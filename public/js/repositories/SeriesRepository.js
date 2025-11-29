/**
 * SeriesRepository
 * Manages series data with cascade delete support
 */

import { BaseRepository } from './BaseRepository.js'

export class SeriesRepository extends BaseRepository {
    /**
     * @param {firebase.firestore.Firestore} firestore - Firestore instance
     * @param {Object} cache - Cache manager
     * @param {string} userId - User ID for scoping
     */
    constructor(firestore, cache, userId) {
        super(firestore, cache)

        this.userId = userId || 'anonymous-user' // Fallback until Sprint 7 auth
        this.collection = firestore.collection(`users/${this.userId}/series`)
        this.schemaVersion = 1
    }

    /**
     * Find series with all albums loaded
     * @param {string} seriesId - Series ID
     * @returns {Promise<Object>} Series with albums array
     */
    async findWithAlbums(seriesId) {
        const series = await this.findById(seriesId)
        if (!series) {
            return null
        }

        // Load albums subcollection
        const albumsSnapshot = await this.collection
            .doc(seriesId)
            .collection('albums')
            .get()

        series.albums = albumsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))

        return series
    }

    /**
     * Rename series
     * @param {string} seriesId - Series ID
     * @param {string} newName - New series name
     * @returns {Promise<string>} Series ID
     */
    async rename(seriesId, newName) {
        if (!newName || newName.trim().length < 3) {
            throw new Error('Series name must be at least 3 characters')
        }

        return this.update(seriesId, { name: newName.trim() })
    }

    /**
     * Delete series with cascade (deletes all albums + playlists)
     * @param {string} seriesId - Series ID
     * @returns {Promise<void>}
     */
    async deleteWithCascade(seriesId) {
        const batch = this.db.batch()

        // Get all albums in this series
        const albumsSnapshot = await this.collection
            .doc(seriesId)
            .collection('albums')
            .get()

        // Delete all albums
        albumsSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref)
        })

        // Get all playlists in this series
        const playlistsSnapshot = await this.collection
            .doc(seriesId)
            .collection('playlists')
            .get()

        // Delete all playlists
        playlistsSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref)
        })

        // Delete the series itself
        batch.delete(this.collection.doc(seriesId))

        // Execute batch (all-or-nothing)
        await batch.commit()

        // Invalidate cache
        if (this.cache) {
            await this.cache.invalidate(this.getCacheKey(seriesId))
            await this.cache.invalidate(this.getCacheKey('all'))
        }
    }

    /**
     * Create series from inventory albums
     * @param {string[]} albumIds - Inventory album IDs
     * @param {string} seriesName - Name for new series
     * @returns {Promise<string>} New series ID
     */
    async createFromInventory(albumIds, seriesName) {
        if (!albumIds || albumIds.length === 0) {
            throw new Error('At least one album required')
        }

        if (!seriesName || seriesName.trim().length < 3) {
            throw new Error('Series name must be at least 3 characters')
        }

        // Create series
        const seriesId = await this.create({
            name: seriesName.trim(),
            albumQueries: [], // Empty - albums from inventory
            sourceType: 'inventory'
        })

        // Copy albums from inventory to this series
        // Note: This will be implemented when InventoryRepository is available
        // For now, just return the series ID

        return seriesId
    }

    /**
     * Get series count for user
     * @returns {Promise<number>}
     */
    async getCount() {
        return this.count()
    }
}
