/**
 * AlbumRepository
 * Manages album data within a series
 */

import { BaseRepository } from './BaseRepository.js'

export class AlbumRepository extends BaseRepository {
    /**
     * @param {firebase.firestore.Firestore} firestore - Firestore instance
     * @param {Object} cache - Cache manager
     * @param {string} userId - User ID for scoping
     * @param {string} seriesId - Series ID for scoping
     */
    constructor(firestore, cache, userId, seriesId) {
        super(firestore, cache)

        this.userId = userId || 'anonymous-user'
        this.seriesId = seriesId

        if (!seriesId) {
            throw new Error('AlbumRepository requires seriesId')
        }

        this.collection = firestore.collection(
            `users/${this.userId}/series/${this.seriesId}/albums`
        )
        this.schemaVersion = 2 // Incremented for new fields (tracksOriginalOrder, bestEverUrl)
    }

    /**
     * Update album tracks
     * @param {string} albumId - Album ID
     * @param {Array} tracks - Updated tracks array
     * @returns {Promise<string>} Album ID
     */
    async updateTracks(albumId, tracks) {
        if (!Array.isArray(tracks)) {
            throw new Error('Tracks must be an array')
        }

        return this.update(albumId, {
            tracks,
            tracksOriginalOrder: tracks // Keep both in sync
        })
    }

    /**
     * Delete album (with series cache invalidation)
     * @param {string} albumId - Album ID
     * @returns {Promise<void>}
     */
    async delete(albumId) {
        await super.delete(albumId)

        // Invalidate parent series cache
        if (this.cache) {
            const seriesCacheKey = `users/${this.userId}/series:${this.seriesId}`
            await this.cache.invalidate(seriesCacheKey)
        }
    }

    /**
     * Find albums by artist
     * @param {string} artist - Artist name
     * @returns {Promise<Array>} Matching albums
     */
    async findByArtist(artist) {
        return this.findByField('artist', artist)
    }

    /**
     * Find albums by year
     * @param {number} year - Release year
     * @returns {Promise<Array>} Matching albums
     */
    async findByYear(year) {
        return this.findByField('year', year)
    }

    /**
     * Find albums with ratings
     * @returns {Promise<Array>} Albums that have acclaim ratings
     */
    async findRated() {
        return this.findAll({
            where: [['acclaim.hasRatings', '==', true]]
        })
    }

    /**
     * Find albums from BestEver
     * @returns {Promise<Array>} Albums with BestEver data
     */
    async findFromBestEver() {
        const allAlbums = await this.findAll()
        return allAlbums.filter(album => album.bestEverAlbumId)
    }
}
