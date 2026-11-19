/**
 * SavedPlaylistsReader
 *
 * The one owner of the read of the saved playlists (arch.md, "Leitura das playlists guardadas", F61).
 * The screen asks it and reads the answer from the store; nobody else reads the list.
 *
 * - One read of the list of series, then the playlists of each series, several at a time
 *   (TaskQueue: a limit and a deadline), most recently updated series first.
 * - Each series has its own state (loading, ready, empty, failed) and is published as its answer
 *   arrives: the list does not wait for the slowest series, and a failure stays on its series.
 * - Every load has a generation and every read of a series a ticket: only the latest ask writes.
 *   Cancelling means "stop waiting and drop the answer" (the database does not really abort).
 * - What was read stays on the list while it is read again, so coming back draws at once.
 * - The two deletes of the screen pass through here, so the list changes in one place and only
 *   the series that changed is read again.
 *
 * Ports (given, never imported): `source` { listSeries(userId), listPlaylists(userId, seriesId),
 * deletePlaylists(userId, seriesId, ids) } and, optional, `covers` { find(artist, title) }.
 */

import { TaskQueue } from '../../utils/TaskQueue.js'
import {
    SeriesPlaylistsStatus as Status,
    batchNameOf,
    coverSources,
    groupIntoBatches,
    inReadOrder
} from '../../models/savedPlaylists.js'

/** How many reads are in the air at once, and how long one may take. */
export const READ_LIMITS = Object.freeze({ concurrency: 8, timeoutMs: 15000 })

const PRIORITY = Object.freeze({ LIST: 2, ONE_SERIES: 1, EVERY_SERIES: 0 })

const messageOf = (error) => error?.message || String(error)
const sameContent = (a, b) => JSON.stringify(a) === JSON.stringify(b)

export class SavedPlaylistsReader {
    /**
     * @param {Object} deps
     * @param {Object} deps.store - SavedPlaylistsStore
     * @param {Object} deps.source - where series and playlists are read from and deleted
     * @param {Object} [deps.covers] - looks a cover up for a series that stores only text
     * @param {Function} deps.getUserId - () => the id of the person on the app now
     * @param {{ concurrency: number, timeoutMs: number }} [deps.limits]
     */
    constructor({ store, source, covers = null, getUserId, limits = READ_LIMITS }) {
        this.store = store
        this.source = source
        this.covers = covers
        this.getUserId = getUserId
        this.queue = new TaskQueue({ concurrency: limits.concurrency, timeoutMs: limits.timeoutMs })
        this._generation = 0
        this._tickets = new Map() // seriesId -> the number of its latest read
        this._coversBySeries = new Map() // seriesId -> covers already looked up
        this._running = null
        this._runningFor = null
    }

    // ========== THE LIST ==========

    /**
     * Read the list. A load already running for the same person is joined, not repeated;
     * `fresh` starts over (the Refresh button, "try again" on a failed list).
     * @param {{ fresh?: boolean }} [options]
     * @returns {Promise<void>} resolves when every series has an answer; never rejects
     */
    load({ fresh = false } = {}) {
        const userId = this.getUserId()
        if (!fresh && this._running && this._runningFor === userId) return this._running

        const generation = ++this._generation
        this.queue.cancelAll()
        const run = this._load(generation, userId).finally(() => {
            if (this._running === run) this._running = null
        })
        this._running = run
        this._runningFor = userId
        return run
    }

    /**
     * Read the playlists of one series again ("try again", or after a change to it).
     * @param {string} seriesId
     * @returns {Promise<void>}
     */
    refreshSeries(seriesId) {
        const entry = this.store.getEntry(seriesId)
        if (!entry) return Promise.resolve()
        this.store.patchEntry(seriesId, entry.playlists
            ? { refreshing: true }
            : { status: Status.LOADING, error: null })
        return this._readSeries(this._generation, this.getUserId(), seriesId, PRIORITY.ONE_SERIES)
    }

    // ========== THE DELETES OF THE SCREEN ==========

    /**
     * Delete one batch of a series, in one write.
     * @returns {Promise<number>} how many playlists were deleted; rejects when the delete fails
     */
    removeBatch(seriesId, batchName) {
        return this._remove(seriesId, playlist => batchNameOf(playlist) === batchName)
    }

    /**
     * Delete every saved playlist of a series, in one write. The series stays.
     * @returns {Promise<number>} how many playlists were deleted; rejects when the delete fails
     */
    removeAll(seriesId) {
        return this._remove(seriesId, () => true)
    }

    // ========== PRIVATE ==========

    _isCurrent(generation) {
        return generation === this._generation
    }

    /** A ticket for a read of that series: a later ticket makes this one's answer worthless. */
    _ticket(generation, seriesId) {
        const ticket = (this._tickets.get(seriesId) || 0) + 1
        this._tickets.set(seriesId, ticket)
        return () => this._isCurrent(generation) && this._tickets.get(seriesId) === ticket
    }

    async _load(generation, userId) {
        if (userId !== this.store.getUserId()) this._coversBySeries.clear()
        this.store.begin(generation, userId)

        let seriesList
        try {
            seriesList = await this.queue.add(() => this.source.listSeries(userId), { priority: PRIORITY.LIST })
        } catch (error) {
            if (this._isCurrent(generation)) this.store.setListFailed(messageOf(error))
            return
        }
        if (!this._isCurrent(generation)) return

        const ordered = inReadOrder(seriesList || [])
        this.store.setSeries(ordered.map(series => this._entryAtStart(series)))
        await Promise.all(ordered.map(series =>
            this._readSeries(generation, userId, series.id, PRIORITY.EVERY_SERIES)))
    }

    /** The entry of a series when a load starts: what is already known stays, marked as refreshing. */
    _entryAtStart(series) {
        const known = this.store.getEntry(series.id)
        if (known?.playlists) return { ...known, series, refreshing: true }
        return {
            seriesId: series.id,
            series,
            status: Status.LOADING,
            playlists: null,
            batches: [],
            thumbnails: [],
            error: null,
            refreshing: false
        }
    }

    async _readSeries(generation, userId, seriesId, priority) {
        const isLatest = this._ticket(generation, seriesId)
        try {
            const playlists = await this.queue.add(() => this.source.listPlaylists(userId, seriesId), { priority })
            if (isLatest()) this._publish(generation, seriesId, playlists || [])
        } catch (error) {
            if (isLatest()) {
                this.store.patchEntry(seriesId, { status: Status.FAILED, error: messageOf(error), refreshing: false })
            }
        }
    }

    /** Put the playlists of a series on the list. Equal to what is there: nothing is replaced. */
    _publish(generation, seriesId, playlists) {
        const entry = this.store.getEntry(seriesId)
        if (!entry) return
        const unchanged = entry.playlists && sameContent(entry.playlists, playlists)
        const status = playlists.length > 0 ? Status.READY : Status.EMPTY
        this.store.patchEntry(seriesId, {
            status,
            error: null,
            refreshing: false,
            ...(unchanged ? {} : { playlists, batches: groupIntoBatches(playlists) })
        })
        if (status === Status.READY) this._showCovers(generation, seriesId, entry.series)
    }

    /** The covers of a series card: what the series stores at once, what has to be looked up after. */
    _showCovers(generation, seriesId, series) {
        const sources = coverSources(series)
        const known = this._coversBySeries.get(seriesId)
        const thumbnails = known || sources.map(source => source.url)
        this._setThumbnails(seriesId, thumbnails)
        if (known || !this.covers || !sources.some(source => source.lookup)) return

        Promise.all(sources.map(source => this._coverOf(source))).then(found => {
            this._coversBySeries.set(seriesId, found)
            if (this._isCurrent(generation)) this._setThumbnails(seriesId, found)
        })
    }

    /** The cover of one album of the card; a lookup that fails is a card without that cover. */
    _coverOf(source) {
        if (!source.lookup) return Promise.resolve(source.url)
        return Promise.resolve()
            .then(() => this.covers.find(source.lookup.artist, source.lookup.title))
            .then(url => url || null, () => null)
    }

    _setThumbnails(seriesId, thumbnails) {
        const entry = this.store.getEntry(seriesId)
        if (!entry || sameContent(entry.thumbnails, thumbnails)) return
        this.store.patchEntry(seriesId, { thumbnails })
    }

    /**
     * Read what the series has stored now, delete what matches in one write, and publish what is
     * left: one read and one write, and no other series is touched.
     */
    async _remove(seriesId, matches) {
        const userId = this.getUserId()
        const generation = this._generation
        const isLatest = this._ticket(generation, seriesId)
        try {
            const stored = await this.queue.add(
                () => this.source.listPlaylists(userId, seriesId), { priority: PRIORITY.ONE_SERIES })
            const doomed = (stored || []).filter(matches)
            if (doomed.length > 0) await this.source.deletePlaylists(userId, seriesId, doomed.map(playlist => playlist.id))

            if (isLatest()) this._publish(generation, seriesId, stored.filter(playlist => !matches(playlist)))
            else this.refreshSeries(seriesId) // someone asked meanwhile: their answer may be from before the delete
            return doomed.length
        } catch (error) {
            await this.refreshSeries(seriesId) // the list shows what is stored, whatever the delete did
            throw error
        }
    }
}
