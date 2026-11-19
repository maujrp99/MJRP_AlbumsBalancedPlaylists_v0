/**
 * AlbumLoadStore
 *
 * The one owner of "album asked for -> album and its load state", per series.
 * Pure state (ADR-0017): setters, getters and subscribe; it decides nothing and fetches nothing.
 * Only AlbumLoadService writes here (arch.md, "Carga da tela de álbuns").
 *
 * The series of the albums screen are `seriesOrder`. A series another screen asked for (F56: the
 * blend, the playlist edit) is a guest: it has entries like any other, it is kept when the screen
 * changes its own list, and it is not part of what the albums screen shows or counts.
 */

import { AlbumStatus, deriveSeriesState, isEnriching } from '../models/albumLoadState.js'

export class AlbumLoadStore {
    constructor() {
        this.generation = 0
        this.seriesOrder = []
        this.entriesBySeries = new Map() // Map<seriesId, Map<key, entry>>
        this.guests = new Set() // series asked for by a screen that is not the albums screen
        this.listeners = new Set()
        this._notifyScheduled = false
    }

    // ========== SETTERS ==========

    /**
     * Start a new load generation: everything from the previous one is dropped. Which series are
     * guests is remembered: whoever asked for them is still waiting and asks again.
     */
    startGeneration(generation) {
        this.generation = generation
        this.seriesOrder = []
        this.entriesBySeries = new Map()
        this._changed()
    }

    /** The series of the current load, in the order the screen shows them. */
    setSeriesOrder(seriesIds) {
        this.seriesOrder = [...seriesIds]
        const wanted = new Set(seriesIds)
        Array.from(this.entriesBySeries.keys()).forEach(id => {
            if (!wanted.has(id) && !this.guests.has(id)) this.entriesBySeries.delete(id)
        })
        this._changed()
    }

    /** Another screen asked for this series: keep it whatever the albums screen shows. */
    addGuest(seriesId) {
        this.guests.add(seriesId)
    }

    /**
     * Nobody else is asking for this series. If the albums screen does not show it either, its
     * entries are dropped.
     * @returns {boolean} true when the series left the store
     */
    removeGuest(seriesId) {
        this.guests.delete(seriesId)
        if (this.seriesOrder.includes(seriesId)) return false
        this.entriesBySeries.delete(seriesId)
        this._changed()
        return true
    }

    /** Replace the entries of one series (in the order its albums were asked for). */
    setSeriesEntries(seriesId, entries) {
        this.entriesBySeries.set(seriesId, new Map(entries.map(entry => [entry.key, entry])))
        this._changed()
    }

    /** Change one entry. The entry object is replaced, never mutated. */
    patchEntry(seriesId, key, patch) {
        const entries = this.entriesBySeries.get(seriesId)
        const current = entries?.get(key)
        if (!current) return false
        entries.set(key, {
            ...current,
            ...patch,
            enrichment: { ...current.enrichment, ...(patch.enrichment || {}) }
        })
        this._changed()
        return true
    }

    // ========== GETTERS ==========

    getGeneration() {
        return this.generation
    }

    getSeriesIds() {
        return [...this.seriesOrder]
    }

    isGuest(seriesId) {
        return this.guests.has(seriesId)
    }

    /** Every series that has entries: the ones of the albums screen, in its order, then the guests. */
    getAllSeriesIds() {
        const guestsOnly = Array.from(this.entriesBySeries.keys()).filter(id => !this.seriesOrder.includes(id))
        return [...this.seriesOrder, ...guestsOnly]
    }

    getEntries(seriesId) {
        return Array.from(this.entriesBySeries.get(seriesId)?.values() || [])
    }

    getEntry(seriesId, key) {
        return this.entriesBySeries.get(seriesId)?.get(key) || null
    }

    /** Derived, never stored: loading, complete, failed or empty, with the counts. */
    getSeriesState(seriesId) {
        return deriveSeriesState(this.getEntries(seriesId))
    }

    /** The state of every series of the current load, by id. */
    getSeriesStates() {
        return Object.fromEntries(this.seriesOrder.map(id => [id, this.getSeriesState(id)]))
    }

    /** The albums of a series that were found, in the order they were asked for. */
    getAlbums(seriesId) {
        return this.getEntries(seriesId)
            .filter(entry => entry.status === AlbumStatus.FOUND && entry.album)
            .map(entry => entry.album)
    }

    /** Found albums whose enrichment has finished: what a playlist may be generated from. */
    getReadyAlbums(seriesId) {
        return this.getEntries(seriesId)
            .filter(entry => entry.status === AlbumStatus.FOUND && entry.album && !isEnriching(entry))
            .map(entry => entry.album)
    }

    /** The found albums of every series, in screen order. */
    getAllAlbums() {
        return this.seriesOrder.flatMap(id => this.getAlbums(id))
    }

    /** True while any album of any series is pending or being found. */
    isLoading() {
        return this.seriesOrder.some(id => this.getSeriesState(id).inFlight > 0)
    }

    // ========== SUBSCRIPTIONS ==========

    /**
     * @param {Function} listener
     * @returns {Function} unsubscribe
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
        this.listeners.forEach(listener => {
            try {
                listener()
            } catch (error) {
                console.error('[AlbumLoadStore] a listener failed:', error)
            }
        })
    }
}

// Singleton instance
export const albumLoadStore = new AlbumLoadStore()
