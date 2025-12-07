/**
 * Albums Store
 * Manages album data, loading, and Firestore sync
 */

import { Album } from '../models/Album.js'
import { collection, doc, addDoc, updateDoc, getDocs } from 'firebase/firestore'

export class AlbumsStore {
    constructor() {
        this.albums = []
        this.currentAlbum = null
        this.loading = false
        this.error = null
        this.lastLoadedSeriesId = null // FIX: Persist series context
        this.listeners = new Set()
    }

    /**
     * Get all albums
     * @returns {Array} Current albums list
     */
    getAlbums() {
        return this.albums
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
     * Set ID of the last loaded series
     * @param {string} seriesId - Series ID
     */
    setLastLoadedSeriesId(seriesId) {
        this.lastLoadedSeriesId = seriesId
        // No notify needed for metadata
    }

    /**
     * Get ID of the last loaded series
     * @returns {string|null} Series ID
     */
    getLastLoadedSeriesId() {
        return this.lastLoadedSeriesId
    }

    /**
     * Add album to store
     * @param {Object|Album} album - Album data or instance
     */
    addAlbum(album) {
        // Domain Model: Tracks are already normalized by the Album/Track constructor.
        // We don't need to re-normalize them here, especially if they are Track instances.

        // If we wanted to ensure metadata extensibility, we could do it on the Track instance,
        // but Track model already handles metadata preservation.

        /* 
        // LEGACY: Removed to prevent converting Track instances back to plain objects
        if (album.tracks && Array.isArray(album.tracks)) {
            album.tracks = album.tracks.map(track => this.normalizeTrack(track))
        }
        */

        const existing = this.albums.find(a =>
            a.title === album.title && a.artist === album.artist
        )

        if (!existing) {
            this.albums.push(album)
            this.notify()
        } else {
            // Update existing album
            // If album is an instance, we might lose methods if we just Object.assign
            // But since we are replacing the data, we should probably replace the reference 
            // or carefully copy properties.

            // For now, Object.assign works for properties, but methods are on prototype.
            // If 'existing' was a plain object and 'album' is an instance, 'existing' becomes hybrid.
            // Ideally, we should replace 'existing' in the array.

            const index = this.albums.indexOf(existing)
            this.albums[index] = album
            this.notify()
        }
    }

    /**
     * Normalize track to include extensible metadata
     * @param {Object} track - Track data
     * @returns {Object} Normalized track
     * @private
     * @deprecated Track model handles this
     */
    normalizeTrack(track) {
        return {
            ...track,
            metadata: track.metadata || {
                isrc: null,           // International Standard Recording Code
                appleMusicId: null,   // Apple Music track ID (cached after match)
                spotifyId: null,      // Spotify track ID (future integration)
                ...track.metadata     // Preserve any existing metadata
            }
        }
    }

    /**
     * Remove album from store
     * @param {string} albumId - Album ID to remove
     */
    removeAlbum(albumId) {
        const index = this.albums.findIndex(a => a.id === albumId)
        if (index !== -1) {
            this.albums.splice(index, 1)
            if (this.currentAlbum?.id === albumId) {
                this.currentAlbum = null
            }
            this.notify()
        }
    }

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
            this.albums = snapshot.docs.map(docSnap => new Album({
                id: docSnap.id,
                ...docSnap.data()
            }))
            this.notify()
            return this.albums
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
            if (album.id) {
                await updateDoc(doc(db, 'albums', album.id), album)
                return album.id
            } else {
                const docRef = await addDoc(collection(db, 'albums'), album)
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
            albums: this.albums,
            currentAlbum: this.currentAlbum,
            loading: this.loading,
            error: this.error
        }
    }

    /**
     * Reset store to initial state
     */
    reset() {
        this.albums = []
        this.currentAlbum = null
        this.loading = false
        this.error = null
        this.lastLoadedSeriesId = null
        this.notify()
    }
}

// Singleton instance
export const albumsStore = new AlbumsStore()
