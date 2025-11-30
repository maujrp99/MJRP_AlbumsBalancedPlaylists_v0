import { Album } from './Album.js'

/**
 * Series Domain Model
 * Manages a collection of Albums.
 */
export class Series {
    /**
     * Create a Series instance
     * @param {Object} data - Raw series data
     */
    constructor(data = {}) {
        this.id = data.id || crypto.randomUUID()
        this.name = (data.name || 'Untitled Series').trim()
        this.description = data.description || ''
        this.createdAt = data.createdAt || new Date().toISOString()

        // Albums
        this.albums = (data.albums || []).map(a => {
            return a instanceof Album ? a : new Album(a)
        })
    }

    /**
     * Add or update an album in the series
     * @param {Object|Album} albumData - Album data or instance
     */
    addAlbum(albumData) {
        const album = albumData instanceof Album ? albumData : new Album(albumData)

        // Check for duplicates based on title and artist
        const existingIndex = this.albums.findIndex(a =>
            a.title.toLowerCase() === album.title.toLowerCase() &&
            a.artist.toLowerCase() === album.artist.toLowerCase()
        )

        if (existingIndex >= 0) {
            // Update existing
            this.albums[existingIndex] = album
        } else {
            // Add new
            this.albums.push(album)
        }
    }

    /**
     * Get all albums
     * @returns {Album[]} Array of Album objects
     */
    getAlbums() {
        return this.albums
    }

    /**
     * Get album by ID
     * @param {string} id - Album ID
     * @returns {Album|undefined}
     */
    getAlbumById(id) {
        return this.albums.find(a => a.id === id)
    }
}
