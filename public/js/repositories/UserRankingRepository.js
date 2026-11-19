/**
 * UserRankingRepository
 * 
 * Repository for user-generated track rankings per album.
 * Stores rankings in Firestore under users/{userId}/albumRankings/{albumId}
 *
 * What was read is kept in the app cache (memory + IndexedDB) for one hour, including "this album
 * has no ranking", so the album load does not ask the cloud again for each album on every visit.
 * Saving or deleting a ranking here forgets the cached entry.
 * 
 * @module repositories/UserRankingRepository
 * @since Sprint 20
 */

import {
    serverTimestamp,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    deleteDoc
} from 'firebase/firestore'

import { db } from '../firebase-init.js'
import { cacheManager } from '../cache/CacheManager.js'

/**
 * How long a ranking that was read stays valid in the cache. Short on purpose: the ranking changes,
 * and it may be edited on another device, where this browser cannot forget it.
 */
export const USER_RANKING_TTL_MS = 60 * 60 * 1000

/**
 * @typedef {Object} TrackRanking
 * @property {string} trackTitle - Track title (for matching)
 * @property {number} userRank - User-assigned rank (1-based)
 */

/**
 * @typedef {Object} AlbumRanking
 * @property {string} albumId - Album identifier
 * @property {string} albumTitle - Album title (for display)
 * @property {string} artistName - Artist name (for display)
 * @property {TrackRanking[]} rankings - Track rankings array
 * @property {Timestamp} createdAt - Creation timestamp
 * @property {Timestamp} updatedAt - Last update timestamp
 */

export class UserRankingRepository {
    /**
     * @param {Object} [cache] - { get, set, invalidate }: the app cache instance by default
     */
    constructor(cache = cacheManager) {
        this.cache = cache
    }

    /**
     * Get Firestore document reference for user's album ranking
     * @param {string} userId - User ID
     * @param {string} albumId - Album ID
     * @returns {DocumentReference}
     * @private
     */
    _getDocRef(userId, albumId) {
        // Sanitize albumId for Firestore path (replace invalid characters)
        const safeAlbumId = albumId.replace(/[/\\]/g, '_')
        return doc(db, 'users', userId, 'albumRankings', safeAlbumId)
    }

    /**
     * Get cache key for an album ranking
     * @param {string} userId - User ID
     * @param {string} albumId - Album ID
     * @returns {string}
     * @private
     */
    _getCacheKey(userId, albumId) {
        return `userRanking:${userId}:${albumId}`
    }

    /**
     * The cached answer for a key, or null when there is none (or the cache cannot be read).
     * @returns {Promise<{ ranking: AlbumRanking|null }|null>}
     * @private
     */
    async _readCached(cacheKey) {
        try {
            const entry = await this.cache.get(cacheKey)
            return entry && 'ranking' in entry ? entry : null
        } catch (error) {
            console.warn('[UserRankingRepository] cache read failed:', error?.message || error)
            return null
        }
    }

    /**
     * Keep an answer of the cloud. A cache that cannot be written only costs the next read.
     * @private
     */
    async _writeCached(cacheKey, ranking) {
        try {
            await this.cache.set(cacheKey, { ranking }, USER_RANKING_TTL_MS)
        } catch (error) {
            console.warn('[UserRankingRepository] cache write failed:', error?.message || error)
        }
    }

    /**
     * Get user's ranking for a specific album
     * @param {string} userId - User ID
     * @param {string} albumId - Album ID
     * @returns {Promise<AlbumRanking|null>} Ranking data or null if not found
     */
    async getRanking(userId, albumId) {
        if (!userId || !albumId) return null

        // Try cache first: the entry says whether there is a ranking, and which
        const cacheKey = this._getCacheKey(userId, albumId)
        const cached = await this._readCached(cacheKey)
        if (cached) {
            return cached.ranking
        }

        // Fetch from Firestore
        try {
            const docSnap = await getDoc(this._getDocRef(userId, albumId))
            const data = docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null

            // Cache the answer, "no ranking" included. A failed read is not cached.
            await this._writeCached(cacheKey, data)

            return data
        } catch (error) {
            console.error('[UserRankingRepository] getRanking error:', error)
            return null
        }
    }

    /**
     * Save user's ranking for an album
     * @param {string} userId - User ID
     * @param {string} albumId - Album ID
     * @param {Object} data - Ranking data
     * @param {string} data.albumTitle - Album title
     * @param {string} data.artistName - Artist name
     * @param {TrackRanking[]} data.rankings - Track rankings
     * @returns {Promise<boolean>} Success status
     */
    async saveRanking(userId, albumId, data) {
        if (!userId || !albumId || !data?.rankings) {
            console.error('[UserRankingRepository] saveRanking: missing required params')
            return false
        }

        const docRef = this._getDocRef(userId, albumId)
        const docData = {
            albumId,
            albumTitle: data.albumTitle || '',
            artistName: data.artistName || '',
            rankings: data.rankings,
            updatedAt: serverTimestamp()
        }

        // Check if document exists to set createdAt
        try {
            const existing = await getDoc(docRef)
            if (!existing.exists()) {
                docData.createdAt = serverTimestamp()
            }

            await setDoc(docRef, docData, { merge: true })

            // Invalidate cache
            await this.cache.invalidate(this._getCacheKey(userId, albumId))

            console.log('[UserRankingRepository] Saved ranking for:', albumId)
            return true
        } catch (error) {
            console.error('[UserRankingRepository] saveRanking error:', error)
            return false
        }
    }

    /**
     * Delete user's ranking for an album
     * @param {string} userId - User ID
     * @param {string} albumId - Album ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteRanking(userId, albumId) {
        if (!userId || !albumId) return false

        try {
            await deleteDoc(this._getDocRef(userId, albumId))

            // Invalidate cache
            await this.cache.invalidate(this._getCacheKey(userId, albumId))

            console.log('[UserRankingRepository] Deleted ranking for:', albumId)
            return true
        } catch (error) {
            console.error('[UserRankingRepository] deleteRanking error:', error)
            return false
        }
    }

    /**
     * Check if user has ranked a specific album
     * @param {string} userId - User ID
     * @param {string} albumId - Album ID
     * @returns {Promise<boolean>}
     */
    async hasRanking(userId, albumId) {
        if (!userId || !albumId) return false

        // Check cache first
        const cached = await this._readCached(this._getCacheKey(userId, albumId))
        if (cached) return cached.ranking !== null

        try {
            const docSnap = await getDoc(this._getDocRef(userId, albumId))
            return docSnap.exists()
        } catch (error) {
            console.error('[UserRankingRepository] hasRanking error:', error)
            return false
        }
    }

    /**
     * Get all albums ranked by user
     * @param {string} userId - User ID
     * @returns {Promise<AlbumRanking[]>}
     */
    async getAllRankings(userId) {
        if (!userId) return []

        try {
            const collRef = collection(db, 'users', userId, 'albumRankings')
            const snapshot = await getDocs(collRef)

            return snapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
            }))
        } catch (error) {
            console.error('[UserRankingRepository] getAllRankings error:', error)
            return []
        }
    }
}

// Singleton export for convenience
export const userRankingRepository = new UserRankingRepository()
