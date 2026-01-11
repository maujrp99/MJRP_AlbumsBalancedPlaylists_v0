/**
 * UserRankingRepository
 * 
 * Repository for user-generated track rankings per album.
 * Stores rankings in Firestore under users/{userId}/albumRankings/{albumId}
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
import { CacheManager } from '../cache/CacheManager.js'

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
    constructor() {
        this.cache = CacheManager
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
     * Get user's ranking for a specific album
     * @param {string} userId - User ID
     * @param {string} albumId - Album ID
     * @returns {Promise<AlbumRanking|null>} Ranking data or null if not found
     */
    async getRanking(userId, albumId) {
        if (!userId || !albumId) return null

        // Try cache first
        const cacheKey = this._getCacheKey(userId, albumId)
        const cached = await this.cache?.get?.(cacheKey)
        if (cached) {
            return cached
        }

        // Fetch from Firestore
        try {
            const docSnap = await getDoc(this._getDocRef(userId, albumId))
            if (!docSnap.exists()) {
                return null
            }

            const data = { id: docSnap.id, ...docSnap.data() }

            // Cache result
            if (this.cache?.set) {
                await this.cache.set(cacheKey, data)
            }

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
            const cacheKey = this._getCacheKey(userId, albumId)
            if (this.cache?.invalidate) {
                await this.cache.invalidate(cacheKey)
            }

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
            const cacheKey = this._getCacheKey(userId, albumId)
            if (this.cache?.invalidate) {
                await this.cache.invalidate(cacheKey)
            }

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
        const cacheKey = this._getCacheKey(userId, albumId)
        const cached = await this.cache?.get?.(cacheKey)
        if (cached) return true

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
