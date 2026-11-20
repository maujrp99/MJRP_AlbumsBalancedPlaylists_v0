/**
 * AlbumLoadService
 *
 * The one owner of the album load (arch.md, "Carga da tela de álbuns"; Service, DP-12).
 * It receives the series to load, in screen order, and is the only writer of AlbumLoadStore.
 *
 * - Each load belongs to a generation; a result that arrives for an older generation is discarded.
 *   The work of one album also ends alone (the album is loaded again, its series is let go by
 *   whoever asked for it): what that work brings later is discarded the same way.
 * - The albums screen says which series it shows with load(). Any other screen asks through
 *   AlbumAsks (F56), which uses join() and leave(): a series joins the load in force, beside the
 *   ones of the screen, without starting a generation, and leaves when nobody reads it.
 * - Finding an album is separate from enriching it: the album is published as soon as the catalog
 *   answers, and each enrichment source finishes on its own (done, empty or failed).
 * - The external sources and the cache are ports the caller injects (DP-14), so this file imports
 *   no network, no Firestore and no screen.
 *
 * Ports:
 *   catalog.find(query, { signal })            -> Promise<Album>          (throws AlbumNotFoundError)
 *   enrichers[source].enrich(album, { signal }) -> Promise<{ status: 'done'|'empty'|'not-connected', album, reason? }>
 *                                                 must return a NEW album, never mutate the one given;
 *                                                 `reason` says why it is 'empty', when the source said
 *   cache.get(query)                           -> Promise<{ album, enrichment } | null>
 *   cache.saveBase(query, album)               -> Promise<void>
 *   cache.saveEnrichment(query, album, source, status, { reason, rule? }) -> Promise<void>
 *
 * Hold (F52): a port may throw an error with `hold: { reason, retryAfterMs? }` when the app's own
 * server said "sign in" (reason 'unauthorized', HTTP 401) or "wait" ('rate_limited', HTTP 429).
 * That is not a failure of the album: nothing is marked failed, the ask waits and goes again when
 * the hold ends, and the slow queue (which only talks to that server) starts nothing meanwhile.
 */

import { TaskQueue, TaskTimeoutError, TaskCancelledError } from '../../utils/TaskQueue.js'
import { LatestOnly } from '../../utils/LatestOnly.js'
import { LoadHold } from './LoadHold.js'
import { awaitsSource, hasAnswered, overNewestAlbum, sourceOutcome } from '../../models/albumSourceAsk.js'
import {
    AlbumStatus, EnrichmentStatus, FailureReason, HoldReason, ENRICHMENT_SOURCES, createEntry, queryKey, reconcileEntry
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

/** The priority of what the person has just asked for by hand (one album loaded again). */
const ASKED_NOW = Number.MAX_SAFE_INTEGER

export class AlbumLoadService {
    /**
     * @param {Object} deps
     * @param {AlbumLoadStore} deps.store
     * @param {Object} deps.catalog
     * @param {Object} deps.enrichers - { acclaim, popularity, userRanking }
     * @param {Object} deps.cache
     * @param {Object} [deps.limits]
     * @param {Function} [deps.onHold] - ({ reason, until }) => void, called when a hold starts or
     *        becomes "sign in" ("sign in" once per load); `until` is a time in ms, or null for "sign in"
     * @param {Function} [deps.now]
     */
    constructor({ store, catalog, enrichers, cache, limits = LOAD_LIMITS, onHold = null, now = () => Date.now() }) {
        this.store = store
        this.catalog = catalog
        this.enrichers = enrichers
        this.cache = cache
        this.limits = { ...LOAD_LIMITS, ...limits }
        this.onHold = onHold
        this.now = now
        this.fastQueue = new TaskQueue({ concurrency: this.limits.findConcurrency })
        this.sourceQueue = new TaskQueue({ concurrency: this.limits.sourceConcurrency })
        this.slowQueue = new TaskQueue({ concurrency: this.limits.slowConcurrency })
        // The slow queue only talks to the app's server: it is the one a hold stops
        this.hold = new LoadHold({
            serverQueue: this.slowQueue,
            publish: (hold) => this.store.setHold(hold),
            onNotice: (hold) => this.onHold?.(hold),
            now: () => this.now()
        })

        this.generation = 0
        this.scopeKey = null
        this._scheduled = new Map() // Map<chainId, Promise>: the work in flight of each album, one after the other
        this._activeChains = 0
        this._epochs = new Map() // Map<chainId, number>: how many times the work of an album was ended alone
        this._asks = new LatestOnly() // by series|key|source: only the latest ask of a source for an album writes
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
        this.hold.endIf(HoldReason.UNAUTHORIZED) // the screen asked again: the login may be there now
        this._ignoreCache = fresh

        this.store.setSeriesOrder(series.map(s => s.id))
        series.forEach((item, index) => this._reconcileSeries(item, series.length - index))
    }

    /**
     * Someone who is not the albums screen asks for these series (F56; AlbumAsks is the caller).
     * They join the load in force: no generation starts, nothing of the screen is cancelled or
     * reset, an album the load already has is not asked again, and what is missing goes through
     * the same queues, ahead of what the screen still has to load (the asker is waiting now).
     * A series stays joined, whatever the screen does with its own list, until leave().
     *
     * @param {Array<{ id: string, albumQueries: Array }>} series
     * @returns {number} the generation the series joined; when the service is in another one, the
     *          entries are gone and the asker joins again
     */
    join(series) {
        // After stop() the store still holds what the stopped load left: start clean, as load() would
        if (this.store.getGeneration() !== this.generation) this._startGeneration(this.scopeKey)

        series.forEach(item => {
            this.store.addGuest(item.id)
            this._queues().forEach(queue => queue.boost(item.id))
            this._reconcileSeries(item, 0)
        })
        return this.generation
    }

    /**
     * Nobody else is waiting for these series. One the albums screen shows goes on loading for the
     * screen. One that no screen shows leaves the load: its entries are dropped, what waited in
     * the queues is never asked, and what was running is not written anywhere.
     * @param {string[]} seriesIds
     */
    leave(seriesIds) {
        seriesIds.forEach(seriesId => {
            if (!this.store.isGuest(seriesId)) return
            const entries = this.store.getEntries(seriesId)
            this._queues().forEach(queue => queue.unboost(seriesId))
            if (!this.store.removeGuest(seriesId)) return

            entries.forEach(entry => this._endChain(entry))
            this._queues().forEach(queue => queue.cancelGroup(seriesId))
        })
    }

    /**
     * Load one album again, in every series that has it (the "Refetch" of the album card): it is
     * found again in the catalog, not in what is kept, and every source is asked again. It goes
     * through the queues and the state like any album: it shows as loading, a failure is its
     * failure with a reason, and what the sources were still bringing for the old one is dropped.
     *
     * @param {string} albumId - the id of the loaded album
     * @returns {number} how many entries (the album may be in several series) are loading again
     */
    reloadAlbum(albumId) {
        if (!albumId) return 0
        this.hold.endIf(HoldReason.UNAUTHORIZED)
        let asked = 0

        this.store.getAllSeriesIds().forEach(seriesId => {
            const entries = this.store.getEntries(seriesId)
            const again = entries.map(entry => (entry.album?.id === albumId ? this._startedOver(entry) : entry))
            const fresh = again.filter((entry, index) => entry !== entries[index])
            if (fresh.length === 0) return

            asked += fresh.length
            this.store.setSeriesEntries(seriesId, again)
            fresh.forEach(entry => this._scheduleIfNeeded(entry, ASKED_NOW))
        })
        return asked
    }

    /** Try again the albums and the enrichment sources of a series that failed. */
    retryFailed(seriesId) {
        this.hold.endIf(HoldReason.UNAUTHORIZED)
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
                this._runChain(chainId, () => this._enrichAll(this._stampOf(entry), seriesId, entry.key, 0))
            }
        })
    }

    /**
     * Ask one enrichment source again for one album, and only that: the album stays on screen, the
     * other sources keep what they have, and a new album is published when the source answers.
     * Used when the person changes what the source reads (their own ranking, saved by the modal).
     * It does not wait for the other sources of that album (a rating may take minutes to come): each
     * source applies its answer over the newest album, and only the latest ask of a source writes.
     *
     * @param {string} albumId - the id of the loaded album
     * @param {string} source - one of ENRICHMENT_SOURCES
     * @returns {number} how many entries (the album may be in several series) were asked again
     */
    refreshSource(albumId, source) {
        if (!albumId || !ENRICHMENT_SOURCES.includes(source)) return 0
        let asked = 0

        this.store.getSeriesIds().forEach(seriesId => {
            this.store.getEntries(seriesId).forEach(entry => {
                if (entry.status !== AlbumStatus.FOUND || entry.album?.id !== albumId) return
                asked++
                const generation = this._stampOf(entry)
                this._runChain(`${this._chainId(entry)}|${source}`, async () => {
                    if (!this._patch(generation, seriesId, entry.key, { enrichment: { [source]: EnrichmentStatus.PENDING } })) return
                    await this._enrichOne(generation, seriesId, entry.key, source, 0)
                })
            })
        })
        return asked
    }

    /** The hold in force, for whoever shows it: { reason, until } or null. */
    getHold() {
        return this.hold.current
    }

    /** End the hold now and ask again what was waiting (the person signed in, or asked to try). */
    resume() {
        this.hold.end()
    }

    /** Stop waiting for everything in flight. The next load starts a new generation. */
    stop() {
        this.scopeKey = null
        this.generation++
        this.hold.end()
        this._scheduled = new Map()
        this._queues().forEach(queue => queue.cancelAll())
        this.store.stopGeneration()
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
        this.hold.startLoad()
        this._scheduled = new Map()
        this._epochs = new Map()
        this._asks.clear()
        this.store.startGeneration(this.generation)
    }

    /**
     * What a piece of work carries to say which load it belongs to: the generation, and how many
     * times the work of its album had been ended alone when it started. Everywhere below, the
     * parameter `generation` is this stamp.
     * @returns {{ generation: number, chainId: string, epoch: number }}
     */
    _stampOf(entry) {
        const chainId = this._chainId(entry)
        return { generation: this.generation, chainId, epoch: this._epochs.get(chainId) || 0 }
    }

    _isCurrent(stamp) {
        return stamp.generation === this.generation && stamp.epoch === (this._epochs.get(stamp.chainId) || 0)
    }

    /**
     * End the work of one album alone, as a new generation ends the work of all: whatever it
     * brings later is dropped, and the next work for that album does not wait behind it.
     */
    _endChain(entry) {
        const chainId = this._chainId(entry)
        this._epochs.set(chainId, (this._epochs.get(chainId) || 0) + 1)
        ;[chainId, ...ENRICHMENT_SOURCES.map(source => `${chainId}|${source}`)].forEach(id => this._scheduled.delete(id))
    }

    /** A new entry for an album that is loaded again: its old work ends, the cache is not read. */
    _startedOver(entry) {
        this._endChain(entry)
        return { ...createEntry(entry.seriesId, entry.query), fresh: true }
    }

    /**
     * Make the entries of one series what its queries ask for now: a new album loads, a removed
     * one leaves, another edition of the same title starts over, and the rest stays as it is.
     */
    _reconcileSeries(item, priority) {
        const existing = new Map(this.store.getEntries(item.id).map(entry => [entry.key, entry]))
        const wanted = new Map()

        ;(item.albumQueries || []).forEach(query => {
            const key = queryKey(query)
            if (wanted.has(key)) return
            const had = existing.get(key)
            const entry = reconcileEntry(had, item.id, query)
            if (had && entry !== had) this._endChain(had)
            wanted.set(key, entry)
        })

        const entries = Array.from(wanted.values())
        this.store.setSeriesEntries(item.id, entries)
        this._queues().forEach(queue => queue.prioritize(item.id, priority))
        entries.forEach(entry => this._scheduleIfNeeded(entry, priority))
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

        const generation = this._stampOf(entry)
        const { seriesId, key } = entry

        this._runChain(chainId, async () => {
            try {
                await this.hold.add(
                    this.fastQueue,
                    ({ signal }) => this._find(generation, seriesId, key, signal),
                    { group: seriesId, priority, timeoutMs: this.limits.findTimeoutMs },
                    () => this._isCurrent(generation)
                )
            } catch (error) {
                this._failFind(generation, seriesId, key, error)
                return
            }
            await this._enrichAll(generation, seriesId, key, priority)
        })
    }

    /** Run a piece of work for one album after whatever is already running for it. */
    _runChain(chainId, chain) {
        const scheduledIn = this._scheduled
        this._activeChains++
        const tail = (scheduledIn.get(chainId) || Promise.resolve())
            .then(chain)
            .catch(error => console.error('[AlbumLoadService] load chain failed:', error))
            .finally(() => {
                this._activeChains--
                if (scheduledIn.get(chainId) === tail) scheduledIn.delete(chainId)
            })
        scheduledIn.set(chainId, tail)
    }

    async _find(generation, seriesId, key, signal) {
        if (!this._patch(generation, seriesId, key, { status: AlbumStatus.FINDING })) return

        const entry = this.store.getEntry(seriesId, key)
        const query = entry.query
        const record = await this._kept(entry)

        let album
        const known = {}
        if (record?.album) {
            album = record.album
            ENRICHMENT_SOURCES.forEach(source => {
                if (hasAnswered(record.enrichment?.[source])) known[source] = record.enrichment[source]
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

    /** What is kept for the album of an entry, unless this load or this entry must not read it. */
    async _kept(entry) {
        if (this._ignoreCache || entry.fresh) return null
        return this.cache.get(entry.query, { seriesId: entry.seriesId })
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

    /** Ask one source for one album, unless it answered already or nobody serves it. */
    async _enrichOne(generation, seriesId, key, source, priority) {
        const entry = this.store.getEntry(seriesId, key)
        if (!awaitsSource(entry, source)) return

        const enricher = this.enrichers[source]
        if (!enricher) {
            this._patch(generation, seriesId, key, { enrichment: { [source]: EnrichmentStatus.EMPTY } })
            return
        }
        await this._askAndPublish(enricher, source, { generation, entry, priority })
    }

    /**
     * One ask of one source: the source shows as loading, is asked on its queue, and its answer
     * is published over the newest album. Only the latest ask of a source for an album writes (the
     * same rule the generations follow, one level down): an older one that answers later is dropped.
     */
    async _askAndPublish(enricher, source, { generation, entry, priority }) {
        const { seriesId, key } = entry
        const isLatest = this._asks.start(`${seriesId}|${key}|${source}`)
        this._patch(generation, seriesId, key, { enrichment: { [source]: EnrichmentStatus.LOADING } })

        try {
            const answer = await this._askSource(enricher, source, { generation, seriesId, key, priority })
            if (!isLatest()) return
            const album = await overNewestAlbum(answer, () => this.store.getEntry(seriesId, key)?.album)
            if (!isLatest()) return
            await this._publishSource(generation, entry, source, album, answer.result)
        } catch (error) {
            if (error instanceof TaskCancelledError || !isLatest()) return
            this._failSource(generation, entry, source, error)
        }
    }

    /** The source did not answer: it shows as failed, and nothing is kept (a failure is never an "empty"). */
    _failSource(generation, entry, source, error) {
        console.warn(`[AlbumLoadService] ${source} failed for "${entry.key}":`, error?.message || error)
        this._patch(generation, entry.seriesId, entry.key, { enrichment: { [source]: EnrichmentStatus.FAILED } })
    }

    /**
     * Ask one source, on its queue, for the album the store has when the task starts.
     * @returns {Promise<{ result: Object, given: Album }>}
     */
    async _askSource(enricher, source, { generation, seriesId, key, priority }) {
        const queue = SLOW_SOURCES.includes(source) ? this.slowQueue : this.sourceQueue
        let given = null
        const result = await this.hold.add(
            queue,
            ({ signal }) => {
                given = this.store.getEntry(seriesId, key).album
                return enricher.enrich(given, { signal })
            },
            { group: seriesId, priority, timeoutMs: this.limits.enrichTimeoutMs },
            () => this._isCurrent(generation)
        )
        return { result, given }
    }

    /**
     * Put the answer of a source on the screen and, if it got there, in the cache, with what the
     * source said about having nothing (models/albumSourceAsk.js, sourceOutcome).
     */
    async _publishSource(generation, entry, source, album, result) {
        const { status, note } = sourceOutcome(result)
        const published = this._patch(generation, entry.seriesId, entry.key, { album, enrichment: { [source]: status } })
        // `note` is null for an answer that is not kept ("not connected", F69)
        if (published && note) await this.cache.saveEnrichment(entry.query, album, source, status, note)
    }
}
