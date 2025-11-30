import { Track } from './Track.js'

/**
 * Playlist Domain Model
 * Manages a collection of tracks derived from albums.
 */
export class Playlist {
    /**
     * Create a Playlist instance
     * @param {Object} data - Raw playlist data
     */
    constructor(data = {}) {
        this.id = data.id
        this.title = (data.title || 'Untitled Playlist').trim()
        this.subtitle = data.subtitle || ''
        this.description = data.description || ''

        // Ensure tracks are Track instances
        // If data.tracks contains raw objects, convert them.
        // If they are already Track instances, keep them.
        this.tracks = (data.tracks || []).map(t => {
            return t instanceof Track ? t : new Track(t)
        })
    }

    /**
     * Get total duration in seconds
     * @returns {number} Duration in seconds
     */
    getDuration() {
        return this.tracks.reduce((sum, t) => sum + (t.duration || 0), 0)
    }

    /**
     * Get total duration in minutes
     * @returns {number} Duration in minutes
     */
    getDurationMinutes() {
        return this.getDuration() / 60
    }

    /**
     * Get track count
     * @returns {number} Number of tracks
     */
    getTrackCount() {
        return this.tracks.length
    }
}
