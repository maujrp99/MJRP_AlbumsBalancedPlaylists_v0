/**
 * OwnRankingsStore
 *
 * The albums the person has ranked: which, not how (the ranking of the tracks stays with the album).
 * Pure state (ADR-0017): setters, getters and subscribe. Only OwnRankingService writes here.
 */

import { buildRankedIndex } from '../models/ownRanking.js'

export const OwnRankingsStatus = Object.freeze({
    IDLE: 'idle',       // never read for this person
    LOADING: 'loading',
    READY: 'ready',
    FAILED: 'failed'
})

export class OwnRankingsStore {
    constructor() {
        this.userId = null
        this.status = OwnRankingsStatus.IDLE
        this.records = new Map() // Map<albumId, { albumId, artistName, albumTitle }>
        this.listeners = new Set()
        this._index = null
    }

    // ========== SETTERS ==========

    /** A read of this person's rankings started; what was known of another person is dropped. */
    startLoading(userId) {
        if (userId !== this.userId) this.records = new Map()
        this.userId = userId
        this.status = OwnRankingsStatus.LOADING
        this._changed()
    }

    /** The whole list, as read. */
    setRecords(userId, records = []) {
        this.userId = userId
        this.status = OwnRankingsStatus.READY
        this.records = new Map(records.map(toRecord).filter(record => record.albumId).map(record => [record.albumId, record]))
        this._changed()
    }

    setFailed(userId) {
        this.userId = userId
        this.status = OwnRankingsStatus.FAILED
        this._changed()
    }

    /** One album was ranked now. Kept only for the person the list belongs to. */
    upsert(userId, record) {
        if (this.userId !== null && userId !== this.userId) return
        const entry = toRecord(record)
        if (!entry.albumId) return
        this.userId = userId
        this.records.set(entry.albumId, entry)
        this._changed()
    }

    // ========== GETTERS ==========

    getUserId() {
        return this.userId
    }

    getStatus() {
        return this.status
    }

    getRecords() {
        return Array.from(this.records.values())
    }

    /** Derived, rebuilt only after a change: what answers "is this query ranked?". */
    getIndex() {
        if (!this._index) this._index = buildRankedIndex(this.getRecords())
        return this._index
    }

    // ========== SUBSCRIPTIONS ==========

    /** @returns {Function} unsubscribe */
    subscribe(listener) {
        this.listeners.add(listener)
        return () => this.listeners.delete(listener)
    }

    _changed() {
        this._index = null
        this.listeners.forEach(listener => {
            try {
                listener()
            } catch (error) {
                console.error('[OwnRankingsStore] a listener failed:', error)
            }
        })
    }
}

const toRecord = (record = {}) => ({
    albumId: String(record.albumId || record.id || ''),
    artistName: record.artistName || '',
    albumTitle: record.albumTitle || ''
})

// Singleton instance
export const ownRankingsStore = new OwnRankingsStore()
