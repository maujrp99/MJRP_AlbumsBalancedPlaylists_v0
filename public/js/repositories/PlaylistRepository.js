/**
 * PlaylistRepository
 * Manages playlist data within a series
 */

import { BaseRepository } from './BaseRepository.js'

export class PlaylistRepository extends BaseRepository {
    /**
     * @param {Firestore} firestore - Firestore instance (modular)
     * @param {Object} cache - Cache manager
     * @param {string} userId - User ID for scoping
     * @param {string} seriesId - Series ID for scoping
     */
    constructor(firestore, cache, userId, seriesId) {
        super(firestore, cache)

        this.userId = userId || 'anonymous-user'
        this.seriesId = seriesId

        if (!seriesId) {
            throw new Error('PlaylistRepository requires seriesId')
        }

        this.collectionPath = `users/${this.userId}/series/${this.seriesId}/playlists`
        this.schemaVersion = 1
    }

    /**
     * Update playlist tracks
     * @param {string} playlistId - Playlist ID
     * @param {Array} tracks - Updated tracks array
     * @returns {Promise<string>} Playlist ID
     */
    async updateTracks(playlistId, tracks) {
        if (!Array.isArray(tracks)) {
            throw new Error('Tracks must be an array')
        }

        return this.update(playlistId, { tracks })
    }

    /**
     * Rename playlist
     * @param {string} playlistId - Playlist ID
     * @param {string} newName - New playlist name
     * @returns {Promise<string>} Playlist ID
     */
    async rename(playlistId, newName) {
        if (!newName || newName.trim().length < 3) {
            throw new Error('Playlist name must be at least 3 characters')
        }

        return this.update(playlistId, { name: newName.trim() })
    }

    /**
     * Get playlists count for series
     * @returns {Promise<number>}
     */
    async getCount() {
        return this.count()
    }

    /**
     * Calculate total duration of playlist
     * @param {string} playlistId - Playlist ID
     * @returns {Promise<number>} Total duration in seconds
     */
    async getTotalDuration(playlistId) {
        const playlist = await this.findById(playlistId)
        if (!playlist || !playlist.tracks) {
            return 0
        }

        return playlist.tracks.reduce((total, track) => {
            return total + (track.duration || 0)
        }, 0)
    }
}
