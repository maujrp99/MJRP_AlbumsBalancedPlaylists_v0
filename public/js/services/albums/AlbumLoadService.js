/**
 * AlbumLoadService
 *
 * The one owner of the album load (arch.md, "Carga da tela de álbuns"; Service, DP-12).
 * It receives the series to load, in screen order, and is the only writer of AlbumLoadStore.
 *
 * - Each load belongs to a generation; a result that arrives for an older generation is discarded.
 * - Finding an album is separate from enriching it: the album is published as soon as the catalog
 *   answers, and each enrichment source finishes on its own (done, empty or failed).
 * - The external sources and the cache are ports the caller injects (DP-14), so this file imports
 *   no network, no Firestore and no screen.
 *
 * Ports:
 *   catalog.find(query, { signal })            -> Promise<Album>          (throws AlbumNotFoundError)
 *   enrichers[source].enrich(album, { signal }) -> Promise<{ status: 'done'|'empty', album }>
 *                                                 must return a NEW album, never mutate the one given
 *   cache.get(query)                           -> Promise<{ album, enrichment } | null>
 *   cache.saveBase(query, album)               -> Promise<void>
 *   cache.saveEnrichment(query, album, source, status) -> Promise<void>
 */

import { TaskQueue, TaskTimeoutError, TaskCancelledError } from '../../utils/TaskQueue.js'
import {
    AlbumStatus, EnrichmentStatus, FailureReason, ENRICHMENT_SOURCES, createEntry, queryKey
} from '../../models/albumLoadState.js'

/** The catalog has no album for this query. */
export class AlbumNotFoundError extends Error {
    constructor(message = 'Album not found') {
        super(message)
        this.name = 'AlbumNotFoundError'
    }
}

/** How much runs at once and how long each step may take. One place, with names. */
export const LOAD_LIMITS = Object.freeze({
    findConcurrency: 3,       // catalog searches; Apple Music answers 429 above this (measured 2026-11-19 with 6)
    findTimeoutMs: 45000,     // the whole search of one album, its retries included
    sourceConcurrency: 6,     // the quick sources (own ranking, stored popularity): they must not take search slots
    slowConcurrency: 4,       // the acclaim source scrapes a site on the server; 2 was too slow for 217 albums, 4 is being measured (2026-11-19)
    enrichTimeoutMs: 20000
})

/** Sources that go through the slow queue. The others share the fast one. */
const SLOW_SOURCES = Object.freeze(['acclaim'])

const FINISHED = new Set([EnrichmentStatus.DONE, EnrichmentStatus.EMPTY])

export class AlbumLoadService {
    /**
     * @param {Object} deps
     * @param {AlbumLoadStore} deps.store
     * @param {Object} deps.catalog
     * @param {Object} deps.enrichers - { acclaim, popularity, userRanking }
     * @param {Object} deps.cache
     * @param {Object} [deps.limits]
     */
    constructor({ store, catalog, enrichers, cache, limits = LOAD_LIMITS }) {
        this.store = store
        this.catalog = catalog
        this.enrichers = enrichers
        this.cache = cache
        this.limits = { ...LOAD_LIMITS, ...limits }

        this.fastQueue = new TaskQueue({ concurrency: this.limits.findConcurrency })
        this.sourceQueue = new TaskQueue({ concurrency: this.limits.sourceConcurrency })
        this.slowQueue = new TaskQueue({ concurrency: this.limits.slowConcurrency })

        this.generation = 0
        this.scopeKey = null
        this._scheduled = new Set()
        this._activeChains = 0
        this._ignoreCache = false
    }

    // =========================================
    // PUBLIC
    // =========================================

    /**
     * Load a scope. Called every time the screen opens or the series change: it reconciles what is
     * wanted with what it already has, so a new album loads, a removed one leaves and the rest stays.
     *
     * @param {Object} request
     * @param {string} request.scopeKey - changes when the scope changes (all series, one series)
     * @param {Array<{ id: string, albumQueries: Array }>} request.series - in screen order
     * @param {boolean} [request.fresh=false] - search everything again, ignoring what the cache has
     */
    load({ scopeKey, series, fresh = false }) {
        if (fresh || scopeKey !== this.scopeKey) this._startGeneration(scopeKey)
        this._ignoreCache = fresh

        this.store.setSeriesOrder(series.map(s => s.id))

        series.forEach((item, index) => {
            const priority = series.length - index
            const existing = new Map(this.store.getEntries(item.id).map(entry => [entry.key, entry]))
            const seen = new Set()
            const entries = []

            ;(item.albumQueries || []).forEach(query => {
                const key = queryKey(query)
                if (seen.has(key)) return
                seen.add(key)
                entries.push(existing.get(key) || createEntry(item.id, query))
            })

            this.store.setSeriesEntries(item.id, entries)
            this._queues().forEach(queue => queue.prioritize(item.id, priority))
            entries.forEach(entry => this._scheduleIfNeeded(entry, priority))
        })
    }

    /** Try again the albums and the enrichment sources of a series that failed. */
    retryFailed(seriesId) {
        this.store.getEntries(seriesId).forEach(entry => {
            const chainId = this._chainId(entry)
            if (this._scheduled.has(chainId)) return

            if (entry.status === AlbumStatus.FAILED) {
                this.store.patchEntry(seriesId, entry.key, { status: AlbumStatus.PENDING, error: null })
                this._scheduleIfNeeded(this.store.getEntry(seriesId, entry.key), 0)
                return
            }
            const failedSources = ENRICHMENT_SOURCES.filter(s => entry.enrichment[s] === EnrichmentStatus.FAILED)
            if (entry.status === AlbumStatus.FOUND && failedSources.length > 0) {
                const reset = Object.fromEntries(failedSources.map(s => [s, EnrichmentStatus.PENDING]))
                this.store.patchEntry(seriesId, entry.key, { enrichment: reset })
                this._runChain(chainId, () => this._enrichAll(this.generation, seriesId, entry.key, 0))
            }
        })
    }

    /**
     * Put an album that was refetched outside the queue in the place of the loaded one, in every
     * series that has it, and remember it. (The refetch itself joins the queue in F48.)
     * @param {Album} album
     */
    async adoptAlbum(album) {
        for (const seriesId of this.store.getSeriesIds()) {
            for (const entry of this.store.getEntries(seriesId)) {
                if (entry.album && entry.album.id === album.id) {
                    this.store.patchEntry(seriesId, entry.key, { album })
                    await this.cache.saveEnrichment(entry.query, album, 'acclaim', EnrichmentStatus.DONE)
                }
            }
        }
    }

    /** Stop waiting for everything in flight. The next load starts a new generation. */
    stop() {
        this.scopeKey = null
        this.generation++
        this._scheduled = new Set()
        this._queues().forEach(queue => queue.cancelAll())
    }

    /** Resolves when nothing is waiting, running or about to be queued. */
    async whenIdle() {
        do {
            for (const queue of this._queues()) await queue.onIdle()
            await new Promise(resolve => setTimeout(resolve, 0))
        } while (this._activeChains > 0 || this._queues().some(queue => queue.running || queue.pending))
    }

    _queues() {
        return [this.fastQueue, this.sourceQueue, this.slowQueue]
    }

    // =========================================
    // GENERATIONS
    // =========================================

    _startGeneration(scopeKey) {
        this._queues().forEach(queue => queue.cancelAll())
        this.scopeKey = scopeKey
        this.generation++
        this._scheduled = new Set()
        this.store.startGeneration(this.generation)
    }

    _isCurrent(generation) {
        return generation === this.generation
    }

    /** The only door to the store for results: a result of an older generation is dropped. */
    _patch(generation, seriesId, key, patch) {
        if (!this._isCurrent(generation)) return false
        return this.store.patchEntry(seriesId, key, patch)
    }

    // =========================================
    // ONE ALBUM: FIND, THEN ENRICH
    // =========================================

    _chainId(entry) {
        return `${entry.seriesId}|${entry.key}`
    }

    _scheduleIfNeeded(entry, priority) {
        const chainId = this._chainId(entry)
        if (entry.status !== AlbumStatus.PENDING || this._scheduled.has(chainId)) return

        const generation = this.generation
        const { seriesId, key } = entry

        this._runChain(chainId, async () => {
            try {
                await this.fastQueue.add(
                    ({ signal }) => this._find(generation, seriesId, key, signal),
                    { group: seriesId, priority, timeoutMs: this.limits.findTimeoutMs }
                )
            } catch (error) {
                this._failFind(generation, seriesId, key, error)
                return
            }
            await this._enrichAll(generation, seriesId, key, priority)
        })
    }

    _runChain(chainId, chain) {
        this._scheduled.add(chainId)
        this._activeChains++
        const scheduledIn = this._scheduled
        chain()
            .catch(error => console.error('[AlbumLoadService] load chain failed:', error))
            .finally(() => {
                this._activeChains--
                scheduledIn.delete(chainId)
            })
    }

    async _find(generation, seriesId, key, signal) {
        if (!this._patch(generation, seriesId, key, { status: AlbumStatus.FINDING })) return

        const query = this.store.getEntry(seriesId, key).query
        const record = this._ignoreCache ? null : await this.cache.get(query, { seriesId })

        let album
        const known = {}
        if (record?.album) {
            album = record.album
            ENRICHMENT_SOURCES.forEach(source => {
                if (FINISHED.has(record.enrichment?.[source])) known[source] = record.enrichment[source]
            })
        } else {
            album = await this.catalog.find(query, { signal, seriesId })
            if (this._isCurrent(generation)) await this.cache.saveBase(query, album)
        }

        this._patch(generation, seriesId, key, {
            status: AlbumStatus.FOUND,
            album,
            error: null,
            enrichment: known
        })
    }

    _failFind(generation, seriesId, key, error) {
        if (error instanceof TaskCancelledError) {
            this._patch(generation, seriesId, key, { status: AlbumStatus.CANCELLED })
            return
        }
        let reason = FailureReason.NETWORK
        if (error instanceof TaskTimeoutError) reason = FailureReason.TIMEOUT
        if (error instanceof AlbumNotFoundError) reason = FailureReason.NOT_FOUND

        this._patch(generation, seriesId, key, {
            status: AlbumStatus.FAILED,
            error: { reason, message: error?.message || String(error) }
        })
    }

    /** The sources of one album run one after the other, so each starts from the album the last one left. */
    async _enrichAll(generation, seriesId, key, priority) {
        const order = [
            ...ENRICHMENT_SOURCES.filter(source => !SLOW_SOURCES.includes(source)),
            ...ENRICHMENT_SOURCES.filter(source => SLOW_SOURCES.includes(source))
        ]
        for (const source of order) {
            if (!this._isCurrent(generation)) return
            await this._enrichOne(generation, seriesId, key, source, priority)
        }
    }

    async _enrichOne(generation, seriesId, key, source, priority) {
        const entry = this.store.getEntry(seriesId, key)
        if (!entry || entry.status !== AlbumStatus.FOUND) return
        if (FINISHED.has(entry.enrichment[source])) return

        const enricher = this.enrichers[source]
        if (!enricher) {
            this._patch(generation, seriesId, key, { enrichment: { [source]: EnrichmentStatus.EMPTY } })
            return
        }

        this._patch(generation, seriesId, key, { enrichment: { [source]: EnrichmentStatus.LOADING } })
        const queue = SLOW_SOURCES.includes(source) ? this.slowQueue : this.sourceQueue

        try {
            const result = await queue.add(
                ({ signal }) => enricher.enrich(this.store.getEntry(seriesId, key).album, { signal }),
                { group: seriesId, priority, timeoutMs: this.limits.enrichTimeoutMs }
            )
            const status = result.status === EnrichmentStatus.DONE ? EnrichmentStatus.DONE : EnrichmentStatus.EMPTY
            const published = this._patch(generation, seriesId, key, {
                album: result.album || entry.album,
                enrichment: { [source]: status }
            })
            if (published) {
                await this.cache.saveEnrichment(entry.query, result.album || entry.album, source, status)
            }
        } catch (error) {
            if (error instanceof TaskCancelledError) return
            console.warn(`[AlbumLoadService] ${source} failed for "${key}":`, error?.message || error)
            this._patch(generation, seriesId, key, { enrichment: { [source]: EnrichmentStatus.FAILED } })
        }
    }
}
