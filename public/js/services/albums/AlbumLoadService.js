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

const FINISHED = new Set([EnrichmentStatus.DONE, EnrichmentStatus.EMPTY])

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
        this._hold = null // { reason, until, timer, ended, end } while the server asked to hold
        this._saidSignIn = false // "sign in" is told once per load, however many times it is heard

        this.fastQueue = new TaskQueue({ concurrency: this.limits.findConcurrency })
        this.sourceQueue = new TaskQueue({ concurrency: this.limits.sourceConcurrency })
        this.slowQueue = new TaskQueue({ concurrency: this.limits.slowConcurrency })

        this.generation = 0
        this.scopeKey = null
        this._scheduled = new Map() // Map<chainId, Promise>: the work in flight of each album, one after the other
        this._activeChains = 0
        this._epochs = new Map() // Map<chainId, number>: how many times the work of an album was ended alone
        this._asks = new Map() // Map<series|key|source, number>: the latest ask of each source for each album
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
        this._endHoldOf(HoldReason.UNAUTHORIZED) // the screen asked again: the login may be there now
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
        this._endHoldOf(HoldReason.UNAUTHORIZED)
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
        this._endHoldOf(HoldReason.UNAUTHORIZED)
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
        return this._hold ? { reason: this._hold.reason, until: this._hold.until } : null
    }

    /** End the hold now and ask again what was waiting (the person signed in, or asked to try). */
    resume() {
        this._endHold()
    }

    /** Stop waiting for everything in flight. The next load starts a new generation. */
    stop() {
        this.scopeKey = null
        this.generation++
        this._endHold()
        this._scheduled = new Map()
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
        this._endHold()
        this._saidSignIn = false
        this._scheduled = new Map()
        this._epochs = new Map()
        this._asks = new Map()
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
    // HOLD: THE SERVER SAID "WAIT" OR "SIGN IN"
    // =========================================

    /**
     * Add a task to a queue. If it ends with an error that carries a hold, nothing has failed: wait
     * for the hold to end and add it again. Any other error, and a hold of an older load, goes on.
     */
    async _addHeld(queue, task, options, generation) {
        // The hold starts inside the task, before the queue frees its slot: no other ask starts in between
        const heldTask = async (context) => {
            try {
                return await task(context)
            } catch (error) {
                if (error?.hold && this._isCurrent(generation)) this._holdFor(error.hold, queue)
                throw error
            }
        }
        for (;;) {
            try {
                return await queue.add(heldTask, options)
            } catch (error) {
                if (!error?.hold || !this._isCurrent(generation)) throw error
                if (this._hold) await this._hold.ended
                if (!this._isCurrent(generation)) throw new TaskCancelledError()
            }
        }
    }

    /**
     * Start a hold, or stretch the one in force. "Sign in" has no end of its own (resume(), a new
     * load or a retry ends it) and wins over "wait"; "wait" ends by itself at the latest time asked.
     */
    _holdFor({ reason, retryAfterMs = 0 }, queue) {
        const started = !this._hold
        if (started) {
            let end
            const ended = new Promise(resolve => { end = resolve })
            this._hold = { reason, until: null, timer: null, ended, end }
        }
        const hold = this._hold
        const becameSignIn = reason === HoldReason.UNAUTHORIZED && hold.reason !== reason

        if (reason === HoldReason.UNAUTHORIZED) {
            clearTimeout(hold.timer)
            Object.assign(hold, { reason, until: null, timer: null })
        } else if (hold.reason !== HoldReason.UNAUTHORIZED) {
            const until = this.now() + retryAfterMs
            if (hold.until === null || until > hold.until) {
                clearTimeout(hold.timer)
                Object.assign(hold, { until, timer: setTimeout(() => this._endHold(), retryAfterMs) })
            }
        }

        // The slow queue only talks to the app's server: it stops when that server said "wait" to it,
        // or "sign in" to anyone. The other queues also reach other sources (Apple Music), so they go on.
        if (queue === this.slowQueue || hold.reason === HoldReason.UNAUTHORIZED) this.slowQueue.pause()

        if (started || becameSignIn) this._tellHold(hold)
    }

    /** One notice per hold; "sign in" only once per load, even if the screen asks and hears it again. */
    _tellHold(hold) {
        const signIn = hold.reason === HoldReason.UNAUTHORIZED
        if (signIn && this._saidSignIn) return
        if (signIn) this._saidSignIn = true
        if (this.onHold) this.onHold({ reason: hold.reason, until: hold.until })
    }

    _endHold() {
        const hold = this._hold
        if (!hold) return
        this._hold = null
        clearTimeout(hold.timer)
        this.slowQueue.resume()
        hold.end()
    }

    _endHoldOf(reason) {
        if (this._hold?.reason === reason) this._endHold()
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
                await this._addHeld(
                    this.fastQueue,
                    ({ signal }) => this._find(generation, seriesId, key, signal),
                    { group: seriesId, priority, timeoutMs: this.limits.findTimeoutMs },
                    generation
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

    async _enrichOne(generation, seriesId, key, source, priority) {
        const entry = this.store.getEntry(seriesId, key)
        if (!entry || entry.status !== AlbumStatus.FOUND) return
        if (FINISHED.has(entry.enrichment[source])) return

        const enricher = this.enrichers[source]
        if (!enricher) {
            this._patch(generation, seriesId, key, { enrichment: { [source]: EnrichmentStatus.EMPTY } })
            return
        }

        const isLatest = this._newAsk(`${seriesId}|${key}|${source}`)
        this._patch(generation, seriesId, key, { enrichment: { [source]: EnrichmentStatus.LOADING } })

        try {
            const answer = await this._askSource(enricher, source, { generation, seriesId, key, priority })
            if (!isLatest()) return
            const album = await this._overNewestAlbum(answer, seriesId, key)
            if (!isLatest()) return
            await this._publishSource(generation, entry, source, album, answer.result)
        } catch (error) {
            if (error instanceof TaskCancelledError || !isLatest()) return
            console.warn(`[AlbumLoadService] ${source} failed for "${key}":`, error?.message || error)
            this._patch(generation, seriesId, key, { enrichment: { [source]: EnrichmentStatus.FAILED } })
        }
    }

    /**
     * Only the latest ask of a source for an album writes its answer (the same rule the generations
     * follow, one level down): an older ask that answers later is dropped.
     * @returns {Function} () => boolean, true while this ask is still the latest
     */
    _newAsk(askId) {
        const ask = (this._asks.get(askId) || 0) + 1
        this._asks.set(askId, ask)
        return () => this._asks.get(askId) === ask
    }

    /**
     * Ask one source, on its queue, for the album the store has when the task starts.
     * @returns {Promise<{ result: Object, given: Album }>}
     */
    async _askSource(enricher, source, { generation, seriesId, key, priority }) {
        const queue = SLOW_SOURCES.includes(source) ? this.slowQueue : this.sourceQueue
        let given = null
        const result = await this._addHeld(
            queue,
            ({ signal }) => {
                given = this.store.getEntry(seriesId, key).album
                return enricher.enrich(given, { signal })
            },
            { group: seriesId, priority, timeoutMs: this.limits.enrichTimeoutMs },
            generation
        )
        return { result, given }
    }

    /**
     * The source worked on the album it was given. If another source published a newer album
     * meanwhile, the answer is applied over that one, so no source undoes another.
     */
    async _overNewestAlbum({ result, given }, seriesId, key) {
        let album = result.album || given
        let base = given
        while (typeof result.apply === 'function') {
            const current = this.store.getEntry(seriesId, key)?.album
            if (!current || current === base) break
            base = current
            album = await result.apply(current)
        }
        return album
    }

    /**
     * Put the answer of a source on the screen and, if it got there, in the cache, with the reason
     * the source gave for having nothing (the cache believes an "empty" for a time that depends on it).
     */
    async _publishSource(generation, entry, source, album, result) {
        // "Not connected" is the source's own word (F69): shown as it is, with nothing kept for it
        if (result.status === EnrichmentStatus.NOT_CONNECTED) {
            this._patch(generation, entry.seriesId, entry.key, { enrichment: { [source]: EnrichmentStatus.NOT_CONNECTED } })
            return
        }
        const done = result.status === EnrichmentStatus.DONE
        const status = done ? EnrichmentStatus.DONE : EnrichmentStatus.EMPTY
        const reason = done ? null : (result.reason || null)
        const published = this._patch(generation, entry.seriesId, entry.key, { album, enrichment: { [source]: status } })
        // `rule`: the version of the identity rule a "not found" was decided with, when the source said (F68)
        const decidedBy = !done && result.rule ? { rule: result.rule } : {}
        if (published) await this.cache.saveEnrichment(entry.query, album, source, status, { reason, ...decidedBy })
    }
}
