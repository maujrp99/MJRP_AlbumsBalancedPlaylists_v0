/**
 * SavedPlaylistsStore
 *
 * The one owner of "series -> its saved playlists and the state of their read" for the saved
 * playlists screen. Pure state (ADR-0017): setters, getters and subscribe; it decides nothing and
 * reads nothing. Only SavedPlaylistsReader writes here (arch.md, "Leitura das playlists guardadas").
 *
 * An entry is { seriesId, series, status, playlists, batches, thumbnails, error, refreshing } and is
 * replaced, never mutated: an entry that is the same object has not changed.
 */

import { ListStatus, SeriesPlaylistsStatus, summarize } from '../models/savedPlaylists.js'

export class SavedPlaylistsStore {
    constructor() {
        this.generation = 0
        this.userId = null
        this.listStatus = ListStatus.IDLE
        this.listError = null
        this.order = []
        this.entries = new Map()
        this.listeners = new Set()
        this._notifyScheduled = false
    }

    // ========== SETTERS ==========

    /** A new read of the list starts. What is on the list stays until the new answer arrives. */
    begin(generation, userId) {
        if (userId !== this.userId) {
            this.order = []
            this.entries = new Map()
        }
        this.generation = generation
        this.userId = userId
        this.listStatus = ListStatus.LOADING
        this.listError = null
        this._changed()
    }

    /** The series of the list arrived: their entries, in the order the list keeps. */
    setSeries(entries) {
        this.order = entries.map(entry => entry.seriesId)
        this.entries = new Map(entries.map(entry => [entry.seriesId, entry]))
        this.listStatus = ListStatus.READY
        this.listError = null
        this._changed()
    }

    /** The list of series could not be read. What was on the list before stays. */
    setListFailed(error) {
        this.listStatus = ListStatus.FAILED
        this.listError = error
        this._changed()
    }

    /** Change one entry. The entry object is replaced, never mutated. */
    patchEntry(seriesId, patch) {
        const current = this.entries.get(seriesId)
        if (!current) return false
        this.entries.set(seriesId, { ...current, ...patch })
        this._changed()
        return true
    }

    // ========== GETTERS ==========

    getGeneration() {
        return this.generation
    }

    getUserId() {
        return this.userId
    }

    getListStatus() {
        return this.listStatus
    }

    getListError() {
        return this.listError
    }

    getEntry(seriesId) {
        return this.entries.get(seriesId) || null
    }

    /** Every entry, in the order of the list. */
    getEntries() {
        return this.order.map(id => this.entries.get(id))
    }

    /** Counts of series by state. */
    getSummary() {
        return summarize(this.getEntries())
    }

    /** True while the list, or any series of it, is being read. */
    isBusy() {
        return this.listStatus === ListStatus.LOADING ||
            this.getEntries().some(entry => entry.refreshing || entry.status === SeriesPlaylistsStatus.LOADING)
    }

    // ========== SUBSCRIPTIONS ==========

    /**
     * @param {Function} listener
     * @returns {() => void} unsubscribe
     */
    subscribe(listener) {
        this.listeners.add(listener)
        return () => this.listeners.delete(listener)
    }

    /** Several changes in the same tick give one notice. */
    _changed() {
        if (this._notifyScheduled) return
        this._notifyScheduled = true
        queueMicrotask(() => this.flush())
    }

    /** Notify now (tests call it; the app lets the microtask do it). */
    flush() {
        if (!this._notifyScheduled) return
        this._notifyScheduled = false
        this.listeners.forEach(listener => listener(this))
    }
}

export const savedPlaylistsStore = new SavedPlaylistsStore()
