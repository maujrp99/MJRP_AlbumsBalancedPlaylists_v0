/**
 * Albums Store
 * Manages album data per series, loading, and Firestore sync
 * 
 * ARCHITECTURE: Albums are keyed by AlbumSeriesId to prevent ghost albums
 */

import { Album } from '../models/Album.js'
import { collection, doc, addDoc, updateDoc, getDocs } from 'firebase/firestore'

export class AlbumsStore {
    constructor() {
        // NEW: Albums stored per series - prevents ghost albums
        this.albumsByAlbumSeriesId = new Map()  // Map<string, Album[]>
        this.activeAlbumSeriesId = null

        this.currentAlbum = null
        this.loading = false
        this.error = null
        this.listeners = new Set()
    }

    // ========== SERIES CONTEXT ==========

    /**
     * Set active album series ID
     * @param {string} seriesId - Series ID
     */
    setActiveAlbumSeriesId(seriesId) {
        this.activeAlbumSeriesId = seriesId
        this.notify()
    }

    /**
     * Get active album series ID
     * @returns {string|null} Active series ID
     */
    getActiveAlbumSeriesId() {
        return this.activeAlbumSeriesId
    }

    // LEGACY: Keep for backward compatibility during migration
    setLastLoadedAlbumSeriesId(seriesId) {
        this.setActiveAlbumSeriesId(seriesId)
    }

    getLastLoadedAlbumSeriesId() {
        return this.getActiveAlbumSeriesId()
    }

    // ========== ALBUM OPERATIONS ==========

    /**
     * Get albums for active series
     * @returns {Array} Current albums list
     */
    getAlbums() {
        if (!this.activeAlbumSeriesId) return []
        return this.albumsByAlbumSeriesId.get(this.activeAlbumSeriesId) || []
    }

    /**
     * Get albums for specific series (for internal use)
     * @param {string} seriesId - Series ID
     * @returns {Array} Albums for that series
     */
    getAlbumsForSeries(seriesId) {
        return this.albumsByAlbumSeriesId.get(seriesId) || []
    }

    /**
     * Add album to store - MUST specify seriesId
     * Rejects albums for inactive series (prevents ghost albums)
     * @param {string} albumSeriesId - Series ID this album belongs to
     * @param {Object|Album} album - Album data or instance
     * @returns {boolean} True if added, false if rejected
     */
    addAlbumToSeries(albumSeriesId, album) {
        // GHOST ALBUM PREVENTION: Reject if not for active series
        if (albumSeriesId !== this.activeAlbumSeriesId) {
            console.warn(`[AlbumsStore] Rejecting album for inactive series: ${albumSeriesId} (active: ${this.activeAlbumSeriesId})`)
            return false
        }

        // Ensure array exists for this series
        if (!this.albumsByAlbumSeriesId.has(albumSeriesId)) {
            this.albumsByAlbumSeriesId.set(albumSeriesId, [])
        }

        const albums = this.albumsByAlbumSeriesId.get(albumSeriesId)
        const existing = albums.find(a => a.title === album.title && a.artist === album.artist)

        if (!existing) {
            albums.push(album)
        } else {
            const index = albums.indexOf(existing)
            albums[index] = album
        }

        this.notify()
        return true
    }

    /**
     * LEGACY: Add album without seriesId - uses active series
     * @deprecated Use addAlbumToSeries(seriesId, album) instead
     */
    addAlbum(album) {
        if (!this.activeAlbumSeriesId) {
            console.warn('[AlbumsStore] addAlbum called without active series - rejecting')
            return false
        }
        return this.addAlbumToSeries(this.activeAlbumSeriesId, album)
    }

    /**
     * Get current active album
     * @returns {Object|null} Current album or null
     */
    getCurrentAlbum() {
        return this.currentAlbum
    }

    /**
     * Set current album
     * @param {Object} album - Album to set as current
     */
    setCurrentAlbum(album) {
        this.currentAlbum = album
        this.notify()
    }

    /**
     * Remove album from store
     * @param {string} albumId - Album ID to remove
     */
    /**
     * Remove album from store
     * @param {string} albumId - Album ID to remove
     */
    removeAlbum(albumId) {
        const albums = this.getAlbums()
        const index = albums.findIndex(a => a.id === albumId)
        if (index !== -1) {
            albums.splice(index, 1)
            if (this.currentAlbum?.id === albumId) {
                this.currentAlbum = null
            }
            this.notify()
        }
    }

    /**
     * Update album in store and persist to Firestore
     * @param {Object} db - Firestore instance
     * @param {Object} album - Updated album instance
     */
    async updateAlbum(db, album) {
        if (!album.id) throw new Error('Cannot update album without ID')

        // Optimistic Update
        this.addAlbumToSeries(this.activeAlbumSeriesId, album)

        // Persist
        await this.saveToFirestore(db, album)
    }

    // ========== SERIES MANAGEMENT ==========

    /**
     * Clear albums for a specific series
     * @param {string} seriesId - Series ID to clear
     */
    clearAlbumSeries(seriesId) {
        this.albumsByAlbumSeriesId.delete(seriesId)
        if (this.activeAlbumSeriesId === seriesId) {
            this.notify()
        }
    }

    /**
     * Check if series has cached albums
     * @param {string} seriesId - Series ID
     * @returns {boolean} True if cached
     */
    hasAlbumsForSeries(seriesId) {
        return this.albumsByAlbumSeriesId.has(seriesId) &&
            this.albumsByAlbumSeriesId.get(seriesId).length > 0
    }

    // ========== FIRESTORE OPERATIONS ==========

    /**
     * Load albums from Firestore
     * @param {Object} db - Firestore database instance
     * @returns {Promise<Array>} Loaded albums
     */
    async loadFromFirestore(db) {
        this.loading = true
        this.error = null
        this.notify()

        try {
            const snapshot = await getDocs(collection(db, 'albums'))
            const albums = snapshot.docs.map(docSnap => new Album({
                id: docSnap.id,
                ...docSnap.data()
            }))

            // Store in active series if set
            if (this.activeAlbumSeriesId) {
                this.albumsByAlbumSeriesId.set(this.activeAlbumSeriesId, albums)
            }

            this.notify()
            return albums
        } catch (error) {
            this.error = error.message
            this.notify()
            throw error
        } finally {
            this.loading = false
            this.notify()
        }
    }

    /**
     * Save album to Firestore
     * @param {Object} db - Firestore database instance
     * @param {Object} album - Album to save
     * @returns {Promise<string>} Document ID
     */
    async saveToFirestore(db, album) {
        try {
            // Deep serialize: removes undefined and converts ES6 classes like Track to POJOs
            // Required per Issue #26 in DEBUG_LOG.md
            const serialized = JSON.parse(JSON.stringify(album))

            if (album.id) {
                await updateDoc(doc(db, 'albums', album.id), serialized)
                return album.id
            } else {
                const docRef = await addDoc(collection(db, 'albums'), serialized)
                album.id = docRef.id
                this.addAlbum(album)
                return docRef.id
            }
        } catch (error) {
            this.error = error.message
            this.notify()
            throw error
        }
    }

    // ========== SUBSCRIPTIONS ==========

    /**
     * Subscribe to store changes
     * @param {Function} listener - Callback fired on state change
     * @returns {Function} Unsubscribe function
     */
    subscribe(listener) {
        this.listeners.add(listener)
        return () => this.listeners.delete(listener)
    }

    /**
     * Notify all listeners of state change
     * @private
     */
    notify() {
        this.listeners.forEach(listener => listener(this.getState()))
    }

    /**
     * Get complete state snapshot
     * @returns {Object} Current state
     */
    getState() {
        return {
            albums: this.getAlbums(),
            currentAlbum: this.currentAlbum,
            loading: this.loading,
            error: this.error,
            activeAlbumSeriesId: this.activeAlbumSeriesId
        }
    }

    // ========== RESET ==========

    /**
     * Reset store to initial state
     * @param {boolean} preserveAlbumSeriesContext - If true, keeps activeAlbumSeriesId but CLEARS ALL albums
     */
    reset(preserveAlbumSeriesContext = false) {
        const seriesId = preserveAlbumSeriesContext ? this.activeAlbumSeriesId : null

        // ALWAYS clear all albums to prevent ghost albums
        // The Map will be repopulated with new series' albums
        this.albumsByAlbumSeriesId.clear()

        this.currentAlbum = null
        this.loading = false
        this.error = null
        this.activeAlbumSeriesId = seriesId
        this.notify()
    }
}

// Singleton instance
export const albumsStore = new AlbumsStore()
