/**
 * SeriesRepository
 * Manages series data with cascade delete support
 */

import { BaseRepository } from './BaseRepository.js'
import { collection, doc, getDocs, updateDoc, writeBatch } from 'firebase/firestore'

// Firestore refuses a batch with more operations than this
const MAX_BATCH_OPERATIONS = 500

export class SeriesRepository extends BaseRepository {
    /**
     * @param {Firestore} firestore - Firestore instance (modular)
     * @param {Object} cache - Cache manager
     * @param {string} userId - User ID for scoping
     */
    constructor(firestore, cache, userId) {
        super(firestore, cache)

        this.userId = userId || 'anonymous-user' // Fallback until Sprint 7 auth

        // Path must match Firebase rules: artifacts/{appId}/users/{userId}/curator/data/series
        // We add '/data/' segment because 'curator' is a collection, so we need a doc ('data') before the next collection ('series')
        const appId = 'mjrp-albums'
        this.collectionPath = `artifacts/${appId}/users/${this.userId}/curator/data/series`
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

        // Load albums subcollection (modular SDK)
        const albumsRef = collection(this.db, `${this.collectionPath}/${seriesId}/albums`)
        const albumsSnapshot = await getDocs(albumsRef)

        series.albums = albumsSnapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
        }))

        return series
    }

    /**
     * The saved playlists of a series (the `playlists` collection under it)
     * @param {string} seriesId
     * @returns {Promise<Array<Object>>}
     */
    async findPlaylists(seriesId) {
        const snapshot = await getDocs(collection(this.db, this.playlistsPath(seriesId)))
        return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
    }

    /**
     * Delete a series together with its saved playlists. Firestore does not remove what is under
     * a document when the document goes, so the playlists are deleted here, in the same atomic
     * write as the series: either all of it goes or all of it stays.
     *
     * A series with more playlists than one write can carry loses playlists first and the series
     * document in the last write, so a failure in the middle never leaves playlists with no series.
     *
     * @param {string} seriesId
     * @returns {Promise<number>} how many playlists were deleted
     */
    async deleteWithPlaylists(seriesId) {
        const playlists = await this.findPlaylists(seriesId)
        const playlistsPath = this.playlistsPath(seriesId)
        const refs = playlists.map(playlist => doc(this.db, playlistsPath, playlist.id))
        refs.push(this.getDocRef(seriesId)) // the series goes last

        for (let start = 0; start < refs.length; start += MAX_BATCH_OPERATIONS) {
            const batch = writeBatch(this.db)
            refs.slice(start, start + MAX_BATCH_OPERATIONS).forEach(ref => batch.delete(ref))
            await batch.commit()
        }

        if (this.cache) {
            await Promise.all([
                this.cache.invalidate(this.getCacheKey(seriesId)),
                this.cache.invalidate(this.getCacheKey('all')),
                this.cache.invalidate(`${playlistsPath}:all`),
                ...playlists.map(playlist => this.cache.invalidate(`${playlistsPath}:${playlist.id}`))
            ])
        }

        return playlists.length
    }

    /** @private */
    playlistsPath(seriesId) {
        return `${this.collectionPath}/${seriesId}/playlists`
    }

    /**
     * Save what the app learned about the albums a series asks for (the `facts` of each query).
     * A write the app makes on its own: it does not count as the person updating the series, so
     * `updatedAt` is left as it is.
     * @param {string} seriesId
     * @param {Array} albumQueries - the whole list, with the facts in place
     * @returns {Promise<string>} Series ID
     */
    async saveAlbumFacts(seriesId, albumQueries) {
        await updateDoc(this.getDocRef(seriesId), { albumQueries })
        if (this.cache) {
            await this.cache.invalidate(this.getCacheKey(seriesId))
        }
        return seriesId
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
