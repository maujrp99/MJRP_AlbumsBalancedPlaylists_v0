/**
 * Albums Store
 * Manages album data, loading, and Firestore sync
 */

export class AlbumsStore {
    constructor() {
        this.albums = []
        this.currentAlbum = null
        this.loading = false
        this.error = null
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
     * Add album to store
     * @param {Object} album - Album data from API
     */
    addAlbum(album) {
        const existing = this.albums.find(a =>
            a.title === album.title && a.artist === album.artist
        )

        if (!existing) {
            this.albums.push(album)
            this.notify()
        } else {
            // Update existing album
            Object.assign(existing, album)
            this.notify()
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
            const snapshot = await db.collection('albums').get()
            this.albums = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
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
                await db.collection('albums').doc(album.id).update(album)
                return album.id
            } else {
                const docRef = await db.collection('albums').add(album)
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
        this.notify()
    }
}

// Singleton instance
export const albumsStore = new AlbumsStore()
