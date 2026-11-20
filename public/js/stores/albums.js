/**
 * Albums Store
 * The albums shelf: the albums each series has, in memory, for the screens to read.
 * It holds state only. Its albums have ONE writer: the album load, which projects the load store
 * into it (services/albums/albumLoading.js -> setAlbumsBySeries). Since F56 the shelf has no
 * method to add or remove one album: whoever wants a series to have another album changes the
 * series and asks the load, and the load reconciles. It never talks to Firestore (repositories do).
 *
 * ARCHITECTURE: Albums are keyed by AlbumSeriesId to prevent ghost albums
 */

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
     * Replace the albums of several series at once, with one notice.
     * Written by the album load (services/albums/albumLoading.js), which owns what a series has.
     * @param {Object<string, Array>} albumsBySeries - seriesId -> albums
     */
    setAlbumsBySeries(albumsBySeries) {
        Object.entries(albumsBySeries).forEach(([seriesId, albums]) => {
            this.albumsByAlbumSeriesId.set(seriesId, [...albums])
        })
        this.notify()
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

    // ========== SERIES MANAGEMENT ==========

    /**
     * Check if series has cached albums
     * @param {string} seriesId - Series ID
     * @returns {boolean} True if cached
     */
    hasAlbumsForSeries(seriesId) {
        return this.albumsByAlbumSeriesId.has(seriesId) &&
            this.albumsByAlbumSeriesId.get(seriesId).length > 0
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
     * @param {boolean} preserveAlbumSeriesContext - If true, keeps activeAlbumSeriesId AND album cache
     * ARCH-6: Now preserves album cache for navigation-back scenarios
     */
    reset(preserveAlbumSeriesContext = false) {
        const seriesId = preserveAlbumSeriesContext ? this.activeAlbumSeriesId : null

        // ARCH-6: Only clear Map if full reset requested
        if (!preserveAlbumSeriesContext) {
            this.albumsByAlbumSeriesId.clear()
        }

        this.currentAlbum = null
        this.loading = false
        this.error = null
        this.activeAlbumSeriesId = seriesId
        this.notify()
    }
}

// Singleton instance
export const albumsStore = new AlbumsStore()
