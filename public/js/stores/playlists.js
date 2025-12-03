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

        // Load from localStorage on initialization
        this.loadFromLocalStorage()
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
        this.saveToLocalStorage()
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
        this.saveToLocalStorage()
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
        this.saveToLocalStorage()
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
            this.saveToLocalStorage()
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
            this.saveToLocalStorage()
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
        this.notify()
    }

    /**
     * Save playlists to localStorage
     */
    saveToLocalStorage() {
        try {
            const data = {
                playlists: this.playlists,
                seriesId: this.seriesId,
                config: this.config,
                updatedAt: new Date().toISOString()
            }
            localStorage.setItem('mjrp_playlists', JSON.stringify(data))
            // console.log('Playlists saved to localStorage:', this.playlists.length)
        } catch (e) {
            console.error('Failed to save playlists to localStorage', e)
        }
    }

    /**
     * Load playlists from localStorage
     */
    loadFromLocalStorage() {
        try {
            const data = localStorage.getItem('mjrp_playlists')
            if (data) {
                const parsed = JSON.parse(data)
                this.playlists = parsed.playlists || []
                this.seriesId = parsed.seriesId || null
                this.config = { ...this.config, ...(parsed.config || {}) }
                // console.log('Playlists loaded from localStorage:', this.playlists.length)
            }
        } catch (error) {
            console.error('Failed to load playlists from localStorage:', error)
            this.playlists = []
        }
    }
}

// Singleton instance
export const playlistsStore = new PlaylistsStore()
