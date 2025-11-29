/**
 * InventoryRepository
 * Manages user's global album collection (physical albums owned)
 */

import { BaseRepository } from './BaseRepository.js'

export class InventoryRepository extends BaseRepository {
    /**
     * @param {firebase.firestore.Firestore} firestore - Firestore instance
     * @param {Object} cache - Cache manager
     * @param {string} userId - User ID for scoping
     */
    constructor(firestore, cache, userId) {
        super(firestore, cache)

        this.userId = userId || 'anonymous-user'
        this.collection = firestore.collection(`users/${this.userId}/inventory/albums`)
        this.schemaVersion = 1
    }

    /**
     * Add album to inventory
     * @param {Object} album - Album data (with full albumData)
     * @param {string} format - Physical format: "cd" | "vinyl" | "dvd" | "bluray" | "digital"
     * @param {Object} options - Optional metadata (purchasePrice, notes, etc.)
     * @returns {Promise<string>} Inventory album ID
     */
    async addAlbum(album, format = 'cd', options = {}) {
        if (!album || !album.title || !album.artist) {
            throw new Error('Album must have title and artist')
        }

        const validFormats = ['cd', 'vinyl', 'dvd', 'bluray', 'digital']
        if (!validFormats.includes(format)) {
            throw new Error(`Format must be one of: ${validFormats.join(', ')}`)
        }

        // Check if album already in inventory
        const existing = await this.findByAlbumId(album.id)
        if (existing) {
            throw new Error('Album already in inventory')
        }

        const inventoryAlbum = {
            title: album.title,
            artist: album.artist,
            year: album.year,
            format,
            purchasePrice: options.purchasePrice || null,
            purchaseDate: options.purchaseDate || null,
            condition: options.condition || null,
            notes: options.notes || '',
            albumData: album, // Full album data for creating series
            addedToInventory: this.getServerTimestamp()
        }

        return this.create(inventoryAlbum)
    }

    /**
     * Update inventory album
     * @param {string} albumId - Inventory album ID
     * @param {Object} updates - Fields to update (format, purchasePrice, notes, etc.)
     * @returns {Promise<string>} Album ID
     */
    async updateAlbum(albumId, updates) {
        const allowed = ['format', 'purchasePrice', 'purchaseDate', 'condition', 'notes']
        const filtered = {}

        allowed.forEach(field => {
            if (updates[field] !== undefined) {
                filtered[field] = updates[field]
            }
        })

        if (Object.keys(filtered).length === 0) {
            throw new Error('No valid fields to update')
        }

        return this.update(albumId, filtered)
    }

    /**
     * Remove album from inventory
     * @param {string} albumId - Inventory album ID
     * @returns {Promise<void>}
     */
    async removeAlbum(albumId) {
        return this.delete(albumId)
    }

    /**
     * Find albums by format
     * @param {string} format - Format to filter by
     * @returns {Promise<Array>} Matching albums
     */
    async findByFormat(format) {
        return this.findByField('format', format)
    }

    /**
     * Find album by original album ID
     * @param {string} albumId - Original album ID
     * @returns {Promise<Object|null>} Inventory album or null
     */
    async findByAlbumId(albumId) {
        const albums = await this.findAll()
        return albums.find(a => a.albumData?.id === albumId) || null
    }

    /**
     * Get inventory statistics
     * @returns {Promise<Object>} Stats (count by format, total value, etc.)
     */
    async getStatistics() {
        const albums = await this.findAll()

        const stats = {
            totalAlbums: albums.length,
            byFormat: {
                cd: 0,
                vinyl: 0,
                dvd: 0,
                bluray: 0,
                digital: 0
            },
            totalValue: 0,
            averagePrice: 0
        }

        let totalPrice = 0
        let priceCount = 0

        albums.forEach(album => {
            // Count by format
            if (album.format) {
                stats.byFormat[album.format] = (stats.byFormat[album.format] || 0) + 1
            }

            // Total value
            if (album.purchasePrice && !isNaN(album.purchasePrice)) {
                totalPrice += Number(album.purchasePrice)
                priceCount++
            }
        })

        stats.totalValue = totalPrice
        stats.averagePrice = priceCount > 0 ? totalPrice / priceCount : 0

        return stats
    }

    /**
     * Search inventory by artist or title
     * @param {string} query - Search query
     * @returns {Promise<Array>} Matching albums
     */
    async search(query) {
        const albums = await this.findAll()
        const lowerQuery = query.toLowerCase()

        return albums.filter(album => {
            const title = (album.title || '').toLowerCase()
            const artist = (album.artist || '').toLowerCase()
            return title.includes(lowerQuery) || artist.includes(lowerQuery)
        })
    }
}
