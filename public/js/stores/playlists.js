/**
 * Playlists Store
 * Manages playlist generation, curation, and drag-and-drop state
 */

export class PlaylistsStore {
    constructor() {
        this.playlists = []
        this.config = {
            playlistCount: 3,
            maxDuration: 75, // minutes
            p1p2Rule: true
        }
        this.seriesId = null // FIX: Track active series ID
        this.isDirty = false // Unsaved changes
        this.isSynchronized = true
        this.listeners = new Set()

        // Version history for undo/redo
        this.versions = []
        this.currentVersionIndex = -1
        this.maxVersions = 20
    }

    /**
     * Get all playlists
     * @returns {Array} Current playlists
     */
    getPlaylists() {
        return this.playlists
    }

    /**
     * Set playlists (e.g., after generation)
     * @param {Array} playlists - Generated playlists
     * @param {string} seriesId - ID of the series these playlists belong to
     */
    setPlaylists(playlists, seriesId = null) {
        this.playlists = playlists
        this.seriesId = seriesId // Track which series these belong to
        this.isDirty = false
        this.isSynchronized = false
        this.createSnapshot('Initial generation')
        this.notify()
    }

    /**
     * Get playlist configuration
     * @returns {Object} Current config
     */
    getConfig() {
        return { ...this.config }
    }

    /**
     * Update playlist configuration
     * @param {Object} newConfig - Config updates
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig }
        this.notify()
    }

    /**
     * Move track between playlists (drag-and-drop)
     * @param {number} fromPlaylistIndex - Source playlist index
     * @param {number} toPlaylistIndex - Target playlist index
     * @param {number} trackIndex - Track index in source
     * @param {number} newIndex - Target position
     */
    moveTrack(fromPlaylistIndex, toPlaylistIndex, trackIndex, newIndex) {
        const fromPlaylist = this.playlists[fromPlaylistIndex]
        const toPlaylist = this.playlists[toPlaylistIndex]

        const [track] = fromPlaylist.tracks.splice(trackIndex, 1)
        toPlaylist.tracks.splice(newIndex, 0, track)

        this.isDirty = true
        this.isSynchronized = false
        this.createSnapshot(`Moved track from ${fromPlaylist.name} to ${toPlaylist.name}`)
        this.notify()
    }

    /**
     * Reorder track within same playlist
     * @param {number} playlistIndex - Playlist index
     * @param {number} oldIndex - Current track position
     * @param {number} newIndex - New track position
     */
    reorderTrack(playlistIndex, oldIndex, newIndex) {
        const playlist = this.playlists[playlistIndex]
        const [track] = playlist.tracks.splice(oldIndex, 1)
        playlist.tracks.splice(newIndex, 0, track)

        this.isDirty = true
        this.isSynchronized = false
        this.createSnapshot(`Reordered track in ${playlist.name}`)
        this.notify()
    }

    /**
     * Mark as synchronized (after save)
     */
    markSynchronized() {
        this.isDirty = false
        this.isSynchronized = true
        this.notify()
    }

    /**
     * Set batch name on all playlists (used when saving to history)
     * @param {string} batchName - Name for this playlist batch
     */
    setBatchName(batchName) {
        const timestamp = new Date().toISOString()
        this.playlists.forEach(playlist => {
            playlist.batchName = batchName
            playlist.savedAt = timestamp
        })
        this.batchName = batchName
        this.notify()
    }

    /**
     * Calculate total duration of playlist
     * @param {number} playlistIndex - Playlist index
     * @returns {number} Total duration in minutes
     */
    getPlaylistDuration(playlistIndex) {
        const playlist = this.playlists[playlistIndex]
        if (!playlist || !playlist.tracks) return 0

        return playlist.tracks.reduce((total, track) => {
            const duration = track.duration || track.durationSeconds || 0
            return total + duration
        }, 0) / 60 // Convert to minutes
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
            playlists: this.playlists,
            seriesId: this.seriesId,
            config: this.config,
            isDirty: this.isDirty,
            isSynchronized: this.isSynchronized,
            canUndo: this.currentVersionIndex > 0,
            canRedo: this.currentVersionIndex < this.versions.length - 1
        }
    }

    /**
     * Create version snapshot for undo/redo
     * @param {string} description - Change description
     * @private
     */
    createSnapshot(description) {
        // Remove future history if we branch off
        if (this.currentVersionIndex < this.versions.length - 1) {
            this.versions = this.versions.slice(0, this.currentVersionIndex + 1)
        }

        this.versions.push({
            playlists: JSON.parse(JSON.stringify(this.playlists)),
            seriesId: this.seriesId, // FIX: Snapshot seriesId
            timestamp: new Date().toISOString(),
            description
        })

        // Limit history size
        if (this.versions.length > this.maxVersions) {
            this.versions.shift()
        }
        this.currentVersionIndex = this.versions.length - 1
    }

    /**
     * Undo to previous version
     * @returns {boolean} True if undo was successful
     */
    undo() {
        if (this.currentVersionIndex > 0) {
            this.currentVersionIndex--
            const version = this.versions[this.currentVersionIndex]
            this.playlists = JSON.parse(JSON.stringify(version.playlists))
            this.seriesId = version.seriesId // FIX: Restore seriesId
            this.isDirty = true
            this.notify()
            return true
        }
        return false
    }

    /**
     * Redo to next version
     * @returns {boolean} True if redo was successful
     */
    redo() {
        if (this.currentVersionIndex < this.versions.length - 1) {
            this.currentVersionIndex++
            const version = this.versions[this.currentVersionIndex]
            this.playlists = JSON.parse(JSON.stringify(version.playlists))
            this.seriesId = version.seriesId // FIX: Restore seriesId
            this.isDirty = true
            this.notify()
            return true
        }
        return false
    }

    /**
     * Get version history
     * @returns {Array} Version history with current indicator
     */
    getVersionHistory() {
        return this.versions.map((v, index) => ({
            ...v,
            isCurrent: index === this.currentVersionIndex
        }))
    }

    /**
     * Save current state to LocalStorage
     */
    saveToLocalStorage() {
        if (!this.seriesId) return

        try {
            const data = {
                playlists: JSON.parse(JSON.stringify(this.playlists)), // Deep copy & sanitize
                seriesId: this.seriesId,
                config: this.config,
                timestamp: Date.now()
            }
            localStorage.setItem('mjrp_current_playlists', JSON.stringify(data))
        } catch (e) {
            console.warn('Failed to save playlists to LocalStorage:', e)
        }
    }

    /**
     * Load state from LocalStorage
     * @returns {boolean} True if loaded successfully
     */
    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('mjrp_current_playlists')
            if (!saved) return false

            const data = JSON.parse(saved)

            // Validate data freshness (optional: e.g. expires after 24h)
            // const isFresh = Date.now() - data.timestamp < 24 * 60 * 60 * 1000

            this.playlists = data.playlists || []
            this.seriesId = data.seriesId
            this.config = data.config || this.config
            // Reset dirty state since we just loaded
            this.isDirty = false
            this.notify()
            return true
        } catch (e) {
            console.warn('Failed to load playlists from LocalStorage:', e)
            return false
        }
    }

    /**
     * Save playlists to Firestore
     * @param {Object} db - Firestore instance
     * @param {Object} cacheManager - Cache manager instance
     * @param {string} userId - Current User ID
     * @returns {Promise<void>}
     */
    async saveToFirestore(db, cacheManager, userId) {
        if (!this.seriesId || !db) {
            throw new Error('Cannot save: Missing database connection or Series ID')
        }

        const { PlaylistRepository } = await import('../repositories/PlaylistRepository.js')
        const repo = new PlaylistRepository(db, cacheManager, userId || 'anonymous-user', this.seriesId)

        // 1. Sanitize Data (Deep Clean)
        // Convert custom Track objects to plain objects using JSON serialization
        const sanitizedPlaylists = JSON.parse(JSON.stringify(this.playlists))

        // 2. Save each playlist
        // We use repo.save() (upsert) because playlists might have local IDs but not exist in DB yet
        const promises = sanitizedPlaylists.map(playlist => {
            // Include timestamp and metadata
            const playlistData = {
                ...playlist,
                updatedAt: new Date().toISOString()
            }

            // Always use save (upsert)
            // If it has an ID, use it. If not (rare), create one or let repo handle it?
            // Generator assigns IDs like 'playlist-1', so we use those as doc IDs or let Firestore generate?
            // Ideally we want stable IDs.
            if (playlist.id) {
                return repo.save(playlist.id, playlistData)
            } else {
                return repo.create(playlistData)
            }
        })

        await Promise.all(promises)

        this.isDirty = false
        this.isSynchronized = true
        this.saveToLocalStorage() // Sycn local too
        this.notify()
    }

    /**
     * Load playlists from Firestore for the active series
     * @param {Object} db - Firestore instance
     * @param {Object} cacheManager - Cache manager
     * @param {string} userId - Current User ID
     * @param {string} seriesId - Series ID to load
     */
    async loadFromFirestore(db, cacheManager, userId, seriesId) {
        if (!seriesId || !db) return

        this.seriesId = seriesId

        try {
            const { PlaylistRepository } = await import('../repositories/PlaylistRepository.js')
            const repo = new PlaylistRepository(db, cacheManager, userId || 'anonymous-user', seriesId)

            const playlists = await repo.findAll()

            if (playlists && playlists.length > 0) {
                this.playlists = playlists
                this.isSynchronized = true
                this.isDirty = false
                this.saveToLocalStorage()
                this.notify()
                return true
            }
        } catch (e) {
            console.error('Failed to load playlists from Firestore:', e)
        }
        return false
    }

    /**
     * Clean LocalStorage
     */
    clearLocalStorage() {
        localStorage.removeItem('mjrp_current_playlists')
    }

    /**
     * Reset store to initial state
     */
    reset() {
        this.playlists = []
        this.config = {
            playlistCount: 3,
            maxDuration: 75,
            p1p2Rule: true
        }
        this.seriesId = null
        this.isDirty = false
        this.isSynchronized = true
        this.versions = []
        this.currentVersionIndex = -1
        this.clearLocalStorage() // Clear storage on reset
        this.notify()
    }
}

// Singleton instance
export const playlistsStore = new PlaylistsStore()
