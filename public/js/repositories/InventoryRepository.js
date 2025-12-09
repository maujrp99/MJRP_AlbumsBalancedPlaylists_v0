/**
 * InventoryRepository
 * Manages user's global album collection (physical albums owned)
 */

import { BaseRepository } from './BaseRepository.js'

export class InventoryRepository extends BaseRepository {
    /**
     * @param {Firestore} firestore - Firestore instance (modular)
     * @param {Object} cache - Cache manager
     * @param {string} userId - User ID for scoping
     */
    constructor(firestore, cache, userId) {
        super(firestore, cache)

        this.userId = userId || 'anonymous-user'
        // Path must match Firebase rules: artifacts/{appId}/users/{userId}/inventory
        // appId is "mjrp-albums" (from firebaseConfig.projectId)
        const appId = 'mjrp-albums'
        this.collectionPath = `artifacts/${appId}/users/${this.userId}/inventory`
        this.schemaVersion = 1
    }

    /**
   * Add album to inventory
   * @param {Object} album - Album data (with full albumData)
   * @param {string} format - Physical format: "cd" | "vinyl" | "dvd" | "bluray" | "digital"
   * @param {Object} options - Optional metadata (purchasePrice, currency, notes, etc.)
   * @returns {Promise<string>} Inventory album ID
   */
    async addAlbum(album, format = 'cd', options = {}) {
        if (!album || !album.title || !album.artist) {
            throw new Error('Album must have title and artist')
        }

        const validFormats = ['cd', 'vinyl', 'cassette', 'dvd', 'bluray', 'digital']
        if (!validFormats.includes(format)) {
            throw new Error(`Format must be one of: ${validFormats.join(', ')}`)
        }

        const validCurrencies = ['USD', 'BRL']
        const currency = options.currency || 'USD'
        if (!validCurrencies.includes(currency)) {
            throw new Error(`Currency must be one of: ${validCurrencies.join(', ')}`)
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
            owned: options.owned !== undefined ? options.owned : true, // Default to owned, can be set to false for wishlist
            purchasePrice: options.purchasePrice || null,
            currency,
            purchaseDate: options.purchaseDate || null,
            condition: options.condition || null,
            notes: options.notes || '',
            // Deep sanitize album data (removes undefined, converts custom classes like Track to plain objects)
            albumData: JSON.parse(JSON.stringify(album)),
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
        const allowed = ['format', 'purchasePrice', 'currency', 'purchaseDate', 'condition', 'notes', 'owned']
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
     * Update price inline (for quick edits)
     * @param {string} albumId - Inventory album ID
     * @param {number} newPrice - New price
     * @param {string} currency - Currency (USD or BRL)
     * @returns {Promise<string>} Album ID
     */
    async updatePrice(albumId, newPrice, currency = 'USD') {
        if (newPrice < 0) {
            throw new Error('Price cannot be negative')
        }

        const validCurrencies = ['USD', 'BRL']
        if (!validCurrencies.includes(currency)) {
            throw new Error('Currency must be USD or BRL')
        }

        return this.update(albumId, {
            purchasePrice: newPrice,
            currency
        })
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
        // Try cache first with albumId key
        const cacheKey = this.getCacheKey(`album_${albumId}`)
        if (this.cache) {
            const cached = await this.cache.get(cacheKey)
            if (cached) return cached
        }

        // Query Firestore (no index needed, linear scan acceptable for inventory)
        const albums = await this.findAll()
        const found = albums.find(a => a.albumData?.id === albumId) || null

        // Cache result
        if (found && this.cache) {
            await this.cache.set(cacheKey, found, this.cacheTTL)
        }

        return found
    }

    /**
   * Get inventory statistics
   * @returns {Promise<Object>} Stats (count by format, total value by currency, etc.)
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
            totalValueUSD: 0,
            totalValueBRL: 0,
            averagePriceUSD: 0,
            averagePriceBRL: 0
        }

        let totalPriceUSD = 0
        let totalPriceBRL = 0
        let countUSD = 0
        let countBRL = 0

        albums.forEach(album => {
            // Count by format
            if (album.format) {
                stats.byFormat[album.format] = (stats.byFormat[album.format] || 0) + 1
            }

            // Total value by currency
            if (album.purchasePrice && !isNaN(album.purchasePrice)) {
                const price = Number(album.purchasePrice)
                const currency = album.currency || 'USD'

                if (currency === 'USD') {
                    totalPriceUSD += price
                    countUSD++
                } else if (currency === 'BRL') {
                    totalPriceBRL += price
                    countBRL++
                }
            }
        })

        stats.totalValueUSD = totalPriceUSD
        stats.totalValueBRL = totalPriceBRL
        stats.averagePriceUSD = countUSD > 0 ? totalPriceUSD / countUSD : 0
        stats.averagePriceBRL = countBRL > 0 ? totalPriceBRL / countBRL : 0

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
