/**
 * PlaylistPersistenceService
 * 
 * Centralized CRUD operations for playlists.
 * Encapsulates PlaylistRepository + SeriesRepository access.
 * 
 * @module services/PlaylistPersistenceService
 * @since Sprint 12.5
 */

import { PlaylistRepository } from '../repositories/PlaylistRepository.js'
import { SeriesRepository } from '../repositories/SeriesRepository.js'

export class PlaylistPersistenceService {
    /**
     * @param {Object} db - Firestore instance
     * @param {Object} cacheManager - Cache manager instance
     * @param {string} userId - Current user ID
     */
    constructor(db, cacheManager, userId) {
        this.db = db
        this.cacheManager = cacheManager
        this.userId = userId
    }

    /**
     * Save playlists to Firestore
     * 
     * @param {string} seriesId - Parent series ID
     * @param {Object[]} playlists - Playlists to save
     * @param {string} batchName - Batch grouping name
     * @param {Object} options - Save options
     * @param {boolean} [options.preserveIds=false] - If true, update existing docs (for regenerate)
     * @param {Object} [options.seriesData] - Series data to upsert
     * @returns {Promise<void>}
     */
    async save(seriesId, playlists, batchName, options = {}) {
        const { preserveIds = false, seriesData } = options
        const repo = new PlaylistRepository(this.db, this.cacheManager, this.userId, seriesId)

        console.log(`[PlaylistPersistenceService] Saving ${playlists.length} playlists to series: ${seriesId}, batch: ${batchName}, preserveIds: ${preserveIds}`)

        // 1. Ensure parent series exists (upsert)
        if (seriesData) {
            const seriesRepo = new SeriesRepository(this.db, this.cacheManager, this.userId)
            await seriesRepo.save(seriesId, {
                id: seriesId,
                ...seriesData,
                updatedAt: new Date().toISOString()
            })
            console.log('[PlaylistPersistenceService] Series upserted')
        }

        // 2. Handle batch overwrite if not preserving IDs
        if (!preserveIds) {
            // Delete old batch playlists first
            const allPlaylists = await repo.findAll()
            const oldBatchPlaylists = allPlaylists.filter(p => p.batchName === batchName)

            if (oldBatchPlaylists.length > 0) {
                console.log(`[PlaylistPersistenceService] Deleting ${oldBatchPlaylists.length} old playlists in batch "${batchName}"`)
                for (const oldPlaylist of oldBatchPlaylists) {
                    await repo.delete(oldPlaylist.id)
                }
            }
        }

        // 3. Save playlists with batchName
        for (const playlist of playlists) {
            const playlistData = {
                ...playlist,
                batchName,
                seriesId,
                updatedAt: new Date().toISOString()
            }

            if (!playlistData.createdAt) {
                playlistData.createdAt = playlistData.updatedAt
            }

            await repo.save(playlist.id, playlistData)
        }

        console.log(`[PlaylistPersistenceService] ✅ Saved ${playlists.length} playlists`)
    }

    /**
     * Load playlists from Firestore
     * 
     * @param {string} seriesId - Series ID
     * @param {string} [batchName] - Optional filter by batch name
     * @returns {Promise<Object[]>} - Array of playlists
     */
    async load(seriesId, batchName = null) {
        const repo = new PlaylistRepository(this.db, this.cacheManager, this.userId, seriesId)
        const all = await repo.findAll()

        if (batchName) {
            return all.filter(p => p.batchName === batchName)
        }

        return all
    }

    /**
     * Delete a single playlist
     * 
     * @param {string} seriesId - Series ID
     * @param {string} playlistId - Playlist ID to delete
     * @returns {Promise<void>}
     */
    async delete(seriesId, playlistId) {
        const repo = new PlaylistRepository(this.db, this.cacheManager, this.userId, seriesId)
        await repo.delete(playlistId)
        console.log(`[PlaylistPersistenceService] Deleted playlist: ${playlistId}`)
    }

    /**
     * Delete all playlists in a batch
     * 
     * @param {string} seriesId - Series ID
     * @param {string} batchName - Batch name to delete
     * @returns {Promise<number>} - Number of playlists deleted
     */
    async deleteBatch(seriesId, batchName) {
        const repo = new PlaylistRepository(this.db, this.cacheManager, this.userId, seriesId)
        const all = await repo.findAll()
        const batchPlaylists = all.filter(p => p.batchName === batchName)

        for (const playlist of batchPlaylists) {
            await repo.delete(playlist.id)
        }

        console.log(`[PlaylistPersistenceService] Deleted batch "${batchName}": ${batchPlaylists.length} playlists`)
        return batchPlaylists.length
    }

    /**
     * Delete all playlists in a series
     * 
     * @param {string} seriesId - Series ID
     * @returns {Promise<number>} - Number of playlists deleted
     */
    async deleteAll(seriesId) {
        const repo = new PlaylistRepository(this.db, this.cacheManager, this.userId, seriesId)
        const all = await repo.findAll()

        for (const playlist of all) {
            await repo.delete(playlist.id)
        }

        console.log(`[PlaylistPersistenceService] Deleted all ${all.length} playlists from series: ${seriesId}`)
        return all.length
    }
}

/**
 * Factory function to create service instance
 * Requires Firebase app to be initialized
 */
export async function createPlaylistPersistenceService() {
    const { db, cacheManager, auth } = await import('../app.js')
    const userId = auth.currentUser ? auth.currentUser.uid : 'anonymous-user'
    return new PlaylistPersistenceService(db, cacheManager, userId)
}
