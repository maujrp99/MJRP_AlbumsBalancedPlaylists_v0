/**
 * PlaylistRepository
 * Manages playlist data within a series
 */

import { BaseRepository } from './BaseRepository.js'
import { doc, writeBatch } from 'firebase/firestore'

// Firestore refuses a batch with more operations than this
const MAX_BATCH_OPERATIONS = 500

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

        // Path must match Firebase rules: artifacts/{appId}/users/{userId}/curator/data/series/{seriesId}/playlists
        const appId = 'mjrp-albums'
        this.seriesCollectionPath = `artifacts/${appId}/users/${this.userId}/curator/data/series`
        this.collectionPath = `${this.seriesCollectionPath}/${this.seriesId}/playlists`
        this.schemaVersion = 1
    }

    /**
     * Write a set of playlists and remove the ones it replaces in ONE atomic write: either the
     * new set is stored and the replaced playlists are gone, or nothing changed at all.
     *
     * The series the playlists live under is part of the same write (its `updatedAt` is touched),
     * so a series that no longer exists refuses the whole write with the code `not-found`: a
     * playlist is never stored without its series.
     *
     * @param {Array<Object>} playlists - in the order they are shown; one with an `id` is updated, one without is created
     * @param {string[]} [replacedIds] - ids of stored playlists this write replaces; the ones still in `playlists` are kept
     * @returns {Promise<Array<Object>>} the playlists as stored, each with its `id` and `order`
     */
    async replaceBatch(playlists, replacedIds = []) {
        const keptIds = new Set(playlists.map(playlist => playlist.id).filter(Boolean))
        const idsToRemove = [...new Set(replacedIds)].filter(id => !keptIds.has(id))

        if (1 + playlists.length + idsToRemove.length > MAX_BATCH_OPERATIONS) {
            throw new Error(`Too many playlists for one save (${playlists.length} to write, ${idsToRemove.length} to remove)`)
        }

        const batch = writeBatch(this.db)
        batch.update(doc(this.db, this.seriesCollectionPath, this.seriesId), { updatedAt: this.getServerTimestamp() })

        const stored = []
        for (const [order, playlist] of playlists.entries()) {
            const data = { ...playlist, order }
            const id = playlist.id
                ? await this.save(playlist.id, data, batch)
                : await this.create(data, batch)
            stored.push({ ...data, id })
        }
        idsToRemove.forEach(id => batch.delete(this.getDocRef(id)))

        await batch.commit()

        if (this.cache) {
            await Promise.all([
                ...idsToRemove.map(id => this.cache.invalidate(this.getCacheKey(id))),
                this.cache.invalidate(this.getCacheKey('all'))
            ])
        }

        return stored
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
