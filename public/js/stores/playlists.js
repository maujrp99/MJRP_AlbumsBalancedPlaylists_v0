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
        this.isDirty = false // Unsaved changes
        this.isSynchronized = true
        this.listeners = new Set()
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
     */
    setPlaylists(playlists) {
        this.playlists = playlists
        this.isDirty = false
        this.isSynchronized = false
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
            config: this.config,
            isDirty: this.isDirty,
            isSynchronized: this.isSynchronized
        }
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
        this.isDirty = false
        this.isSynchronized = true
        this.notify()
    }
}

// Singleton instance
export const playlistsStore = new PlaylistsStore()
