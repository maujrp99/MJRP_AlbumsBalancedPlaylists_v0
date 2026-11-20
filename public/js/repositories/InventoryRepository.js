/**
 * InventoryRepository
 * Manages user's global album collection (physical albums owned)
 */

import { BaseRepository } from './BaseRepository.js'

const VALID_FORMATS = ['cd', 'vinyl', 'cassette', 'dvd', 'bluray', 'digital']
const VALID_CURRENCIES = ['USD', 'BRL']

/** An album can be kept only with its names and its id. */
function requireAlbum(album) {
    if (!album || !album.title || !album.artist) throw new Error('Album must have title and artist')
    if (!album.id) throw new Error('Album must have an ID')
}

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
     * @param {string} format - Physical format: "cd" | "vinyl" | "cassette" | "dvd" | "bluray" | "digital"
     * @param {Object} options - Optional metadata (purchasePrice, currency, notes, etc.)
     * @returns {Promise<string>} Inventory album ID
     */
    async addAlbum(album, format = 'cd', options = {}) {
        requireAlbum(album)
        if (!VALID_FORMATS.includes(format)) {
            throw new Error(`Format must be one of: ${VALID_FORMATS.join(', ')}`)
        }
        const currency = options.currency || 'USD'
        if (!VALID_CURRENCIES.includes(currency)) {
            throw new Error(`Currency must be one of: ${VALID_CURRENCIES.join(', ')}`)
        }

        // Check if album already in inventory
        const existing = await this.findByAlbumId(album.id)
        if (existing) {
            console.warn(`[InventoryRepository] Prevented duplicate add for album: ${album.id}`)
            throw new Error('Album already in inventory')
        }

        return this.create(this._itemFor(album, { ...options, format, currency }))
    }

    /**
     * Add many albums in ONE write, each as a Not Owned item (F71): all of them go in, or none
     * does. The item holds the album as given and nothing invented: no format, no price, no
     * currency. Whether an album is already in the inventory is NOT asked here: the caller gives
     * the albums that are not (models/inventoryFromSeries.js decides, InventoryService asks).
     *
     * The "already in inventory" answers kept in the cache (`album_<id>`) need nothing: only an
     * item that was FOUND is kept there, never "not there", so a new item is found by the next
     * question (findByAlbumId reads the inventory when it has no answer kept).
     *
     * @param {Object[]} albums - each { id, title, artist, ... }; at most what one batch holds
     * @returns {Promise<string[]>} the ids of the new items, in the order given
     * @throws when an album lacks its names or its id (nothing is written), and when the write fails
     */
    async addBatch(albums) {
        albums.forEach(requireAlbum)
        return this.createMany(albums.map(album => this._itemFor(album, { format: null, currency: null })))
    }

    /** The item the inventory keeps for an album. `owned` is null (Not Owned) unless given. */
    _itemFor(album, { format, currency, owned = null, purchasePrice, purchaseDate, condition, notes }) {
        return {
            title: album.title,
            artist: album.artist,
            year: album.year ?? null,
            format,
            owned,
            purchasePrice: purchasePrice || null,
            currency,
            purchaseDate: purchaseDate || null,
            condition: condition || null,
            notes: notes || '',
            // Deep sanitize album data
            albumData: JSON.parse(JSON.stringify(album)),
            addedToInventory: this.getServerTimestamp()
        }
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
     * Write the averages of many items in ONE write (F71, S-56): only the `averages` field of each
     * item changes (models/inventoryRatings.js decides what it holds); nothing else of the item does.
     * @param {Array<{ id: string, averages: Object }>} entries - at most what one batch holds
     * @returns {Promise<string[]>} the ids of the items, in the order given
     * @throws when an entry lacks its id or its averages (nothing is written), and when the write fails
     */
    async setAverages(entries) {
        entries.forEach(({ id, averages }) => {
            if (!id || !averages || typeof averages !== 'object') throw new Error('Each update needs the id of an item and its averages')
        })
        // JSON round trip: a value that is undefined is left out, Firestore refuses it
        return this.updateMany(entries.map(({ id, averages }) => ({ id, data: { averages: JSON.parse(JSON.stringify(averages)) } })))
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

        if (!VALID_CURRENCIES.includes(currency)) {
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
        // The "already in inventory" answer is kept under the id of the album the item holds:
        // forget it too, or adding the same album again would be refused while that answer lives.
        let heldAlbumId = null
        try {
            heldAlbumId = (await this.findById(albumId))?.albumData?.id ?? null
        } catch (error) {
            console.warn('[InventoryRepository] could not read the item before removing it:', error?.message || error)
        }

        await this.delete(albumId)

        if (heldAlbumId !== null && this.cache) {
            await this.cache.invalidate(this.getCacheKey(`album_${heldAlbumId}`))
        }
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
        if (!albumId) return null

        // Try cache first with albumId key
        const cacheKey = this.getCacheKey(`album_${albumId}`)
        if (this.cache) {
            const cached = await this.cache.get(cacheKey)
            if (cached) return cached
        }

        // Query Firestore
        // Use loose comparison for IDs (String vs Number safety)
        const albums = await this.findAll()
        const found = albums.find(a => String(a.albumData?.id) === String(albumId)) || null

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
