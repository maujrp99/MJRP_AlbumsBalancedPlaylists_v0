/**
 * AlbumAsks
 *
 * The one way a screen that is not the albums screen gets albums (F56; ADR-0019, decision 1):
 *
 *   const result = await albumAsks.albumsOf({ series, sources, signal, onProgress })
 *
 * "Give me the albums of these series, ready." The ask joins the load in force in AlbumLoadService
 * (join): what the albums screen has loaded or the browser keeps is not asked again, what is
 * missing goes through the same queues, and nothing of the albums screen is cancelled or reset.
 * It resolves, never rejects, with a typed result (models/albumAsk.js): the albums that are ready,
 * the ones that failed with their reasons, and the named sources that are missing for some album.
 *
 * - `sources` are the enrichment sources the asker needs (a recipe reads ratings, popularity or
 *   the person's ranking). The ask waits for those, each behind the deadline the service gives a
 *   source, and for no other.
 * - The ask holds its series in the load only while it waits. Served or dropped (`signal`), it
 *   lets them go (leave): a series no screen shows leaves the load, so no load is left that
 *   nobody reads. Two asks for the same series share one load; the last one to end lets it go.
 * - A new generation (the albums screen changed scope, "Refresh", "Clear Cache") drops the
 *   entries the ask was reading: the ask joins the new generation and goes on waiting.
 * - While the server holds the load ("sign in" or "wait") the ask does not wait for a source,
 *   and an album still not found after as long as a search may take is given as failed.
 *
 * It imports no network, no Firestore and no screen: the service and the store are given.
 */

import { readAsk } from '../../models/albumAsk.js'

/**
 * How often an ask looks again without a change in the store. A hold starts inside a task and
 * changes no entry, so the store has nothing to tell; this is what sees it.
 */
const CHECK_EVERY_MS = 1000

export class AlbumAsks {
    /**
     * @param {Object} deps
     * @param {AlbumLoadService} deps.service - join, leave, getHold, generation, limits
     * @param {AlbumLoadStore} deps.store - getEntries, subscribe
     * @param {number} [deps.checkEveryMs]
     * @param {Function} [deps.now]
     */
    constructor({ service, store, checkEveryMs = CHECK_EVERY_MS, now = () => Date.now() }) {
        this.service = service
        this.store = store
        this.checkEveryMs = checkEveryMs
        this.now = now
        this._waiting = new Map() // Map<seriesId, number>: how many asks are waiting for each series
    }

    /**
     * @param {Object} request
     * @param {Array<{ id: string, albumQueries: Array }>} request.series - in the order wanted
     * @param {string[]} [request.sources] - enrichment sources to wait for (ENRICHMENT_SOURCES)
     * @param {AbortSignal} [request.signal] - aborted when the asker no longer wants the answer
     * @param {Function} [request.onProgress] - ({ total, found, failed, waitingSources }) => void
     * @returns {Promise<Object>} AlbumsResult (models/albumAsk.js); `aborted` when it was dropped
     */
    albumsOf({ series, sources = [], signal = null, onProgress = null }) {
        const ask = {
            series: series.map(item => ({ id: item.id, albumQueries: [...(item.albumQueries || [])] })),
            sources,
            onProgress,
            generation: null,
            heldSince: null,
            told: ''
        }
        if (signal?.aborted) return Promise.resolve(this._read(ask, { aborted: true }).result)

        this._open(ask)
        return new Promise(resolve => this._wait(ask, signal, resolve))
    }

    /** Look at the ask on every change of the store, and now and then, until it is served or dropped. */
    _wait(ask, signal, resolve) {
        let closed = false
        const close = (aborted) => {
            if (closed) return
            closed = true
            unsubscribe()
            clearInterval(timer)
            signal?.removeEventListener('abort', drop)
            const { result } = this._read(ask, { aborted }) // read before the series are let go
            this._close(ask)
            resolve(result)
        }
        const drop = () => close(true)
        const check = () => {
            if (closed) return
            this._joinAgainIfRestarted(ask)
            const reading = this._read(ask)
            this._tell(ask, reading.progress)
            if (reading.settled) close(false)
        }

        const unsubscribe = this.store.subscribe(check)
        const timer = setInterval(check, this.checkEveryMs)
        signal?.addEventListener('abort', drop, { once: true })
        check()
    }

    _open(ask) {
        ask.series.forEach(item => this._waiting.set(item.id, (this._waiting.get(item.id) || 0) + 1))
        ask.generation = this.service.join(ask.series)
    }

    /** The ask ended: the series no other ask is waiting for are let go. */
    _close(ask) {
        const free = []
        ask.series.forEach(item => {
            const left = (this._waiting.get(item.id) || 1) - 1
            if (left > 0) {
                this._waiting.set(item.id, left)
                return
            }
            this._waiting.delete(item.id)
            free.push(item.id)
        })
        if (free.length > 0) this.service.leave(free)
    }

    /** A new generation dropped what the ask was reading: join it. */
    _joinAgainIfRestarted(ask) {
        if (this.service.generation === ask.generation) return
        ask.heldSince = null
        ask.generation = this.service.join(ask.series)
    }

    _read(ask, { aborted = false } = {}) {
        const asked = ask.series.map(item => ({ seriesId: item.id, entries: this.store.getEntries(item.id) }))
        const onHold = Boolean(this.service.getHold())
        if (!onHold) ask.heldSince = null
        else if (ask.heldSince === null) ask.heldSince = this.now()
        const heldTooLong = onHold && (this.now() - ask.heldSince) >= this.service.limits.findTimeoutMs

        return readAsk(asked, ask.sources, { onHold, heldTooLong, aborted })
    }

    /** Tell the progress only when it changed. */
    _tell(ask, progress) {
        if (!ask.onProgress) return
        const told = JSON.stringify(progress)
        if (told === ask.told) return
        ask.told = told
        ask.onProgress(progress)
    }
}
