/**
 * InventoryRepository
 * Manages user's global album collection (physical albums owned)
 */

import { BaseRepository } from './BaseRepository.js'

const VALID_FORMATS = ['cd', 'vinyl', 'cassette', 'dvd', 'bluray', 'digital']
const VALID_CURRENCIES = ['USD', 'BRL']

/**
 * The value the person wrote for an album (F75), as it is kept: an amount above zero, in USD, and
 * when it was written. `null` takes the written value away (the album goes back to its reading).
 * A reading of Discogs is not written by this door: it has its own (`setReadings`).
 */
function writtenValue(value) {
    if (value === null) return null
    const amount = Number(value?.amount)
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('A written value needs an amount above zero')
    if (value.currency !== 'USD') throw new Error('A written value is kept in USD')
    return { amount, currency: 'USD', at: value.at || new Date().toISOString() }
}

/** Which Discogs edition the value of an album is read from (F75): catalogue data, no price. */
function discogsEdition(edition) {
    if (!Number.isInteger(edition?.releaseId) || edition.releaseId <= 0) throw new Error('An edition needs the id of its Discogs release')
    return { releaseId: edition.releaseId, title: edition.title ?? null, url: edition.url ?? null }
}

const READING_KINDS = ['found', 'not_found', 'no_value']
const CONDITION_NAMES = ['mint', 'nearMint', 'veryGoodPlus']
const isAmountAbove0 = (value) => typeof value === 'number' && Number.isFinite(value) && value > 0
const orNull = (value) => value ?? null

function readingConditions(conditions) {
    if (!conditions) return null
    // a condition Discogs did not give stays null (the value rule then says "no price suggested")
    if (!CONDITION_NAMES.every(name => conditions[name] == null || isAmountAbove0(conditions[name]))) throw new Error('A reading keeps each condition as an amount above zero, or none')
    return Object.fromEntries(CONDITION_NAMES.map(name => [name, orNull(conditions[name])]))
}

function readingLowest(lowest) {
    if (!lowest) return null
    if (!isAmountAbove0(lowest.value)) throw new Error('The lowest price for sale is an amount above zero')
    return { value: lowest.value, currency: lowest.currency ?? 'USD' }
}

function readingRelease(release) {
    if (!release) return null
    if (!Number.isInteger(release.id) || release.id <= 0) throw new Error('The edition of a reading needs the id of its Discogs release')
    return { id: release.id, title: orNull(release.title), url: orNull(release.url) }
}

/**
 * The reading of Discogs of an album (F75, REQ-14; decision of the MJRP, 2026-11-21: constitution
 * VI.1): what the three conditions or the lowest price for sale said, the currency, the edition
 * and its page, which kind of reading it was, and WHEN it was read. It lives in the item of the
 * person beside the value the person wrote, never mixed with it. Checked here, the one door.
 */
function discogsReading(reading) {
    if (!reading || !READING_KINDS.includes(reading.kind)) throw new Error('A reading is found, not_found or no_value')
    if (!Number.isFinite(Date.parse(reading.readAt))) throw new Error('A reading says when it was read')
    return {
        source: 'discogs',
        kind: reading.kind,
        basis: orNull(reading.basis),
        conditions: readingConditions(reading.conditions),
        lowest: readingLowest(reading.lowest),
        forSale: Number.isInteger(reading.forSale) ? reading.forSale : null,
        currency: orNull(reading.currency),
        release: readingRelease(reading.release),
        readAt: new Date(reading.readAt).toISOString()
    }
}

/** An album can be kept only with its names and its id. */
function requireAlbum(album) {
    if (!album || !album.title || !album.artist) throw new Error('Album must have title and artist')
    if (!album.id) throw new Error('Album must have an ID')
}

/**
 * What a read of the album load adds to an item: the averages, and the cover when the item had
 * none. The cover is one field inside `albumData`: a dotted path, so the rest of it is untouched.
 */
function readFacts(averages, coverUrl) {
    const data = {}
    // JSON round trip: a value that is undefined is left out, Firestore refuses it
    if (averages) data.averages = JSON.parse(JSON.stringify(averages))
    if (coverUrl) data['albumData.coverUrl'] = coverUrl
    return data
}

export class InventoryRepository extends BaseRepository {
    /**
     * @param {import('./store.js').Store} store - the database and the Firestore functions of the side
     * @param {Object} cache - Cache manager
     * @param {string} userId - User ID for scoping
     */
    constructor(store, cache, userId) {
        super(store, cache)

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
        // The value the person wrote (F75): checked here, the one door to the cloud
        if (updates.value !== undefined) filtered.value = writtenValue(updates.value)

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
        entries.forEach(({ id, averages, coverUrl }) => {
            const hasAverages = !!averages && typeof averages === 'object'
            if (!id || (!hasAverages && !coverUrl)) throw new Error('Each update needs the id of an item and its averages or its cover')
        })
        return this.updateMany(entries.map(({ id, averages, coverUrl }) => ({ id, data: readFacts(averages, coverUrl) })))
    }

    /**
     * Write which Discogs edition the value of each item is read from, in ONE write (F75): only
     * the `discogs` field of each item changes. No price goes with it.
     * @param {Array<{ id: string, discogs: { releaseId: number, title?: string, url?: string } }>} entries - at most what one batch holds
     * @returns {Promise<string[]>} the ids of the items, in the order given
     * @throws when an entry lacks its id or its edition (nothing is written), and when the write fails
     */
    async setEditions(entries) {
        const data = entries.map(({ id, discogs }) => {
            if (!id) throw new Error('Each edition needs the id of an item')
            return { id, data: { discogs: discogsEdition(discogs) } }
        })
        return this.updateMany(data)
    }

    /**
     * Write the reading of Discogs of each item, in ONE write (F75, REQ-14): the `discogsReading`
     * field of each item is replaced by the new one (the newest reading wins), and the `discogs`
     * edition too when the entry carries a new one. Nothing else of the item changes: never the
     * value the person wrote.
     * @param {Array<{ id: string, reading: Object, discogs?: Object }>} entries - at most what one batch holds
     * An entry that is not a valid reading (no id, an amount that is not above zero, no date) is
     * SKIPPED and the others are written: one bad reading never costs the batch. The caller compares
     * what it gave with the ids it gets back to know how many were refused.
     * @returns {Promise<string[]>} the ids of the items written, in the order given
     * @throws when the write fails
     */
    async setReadings(entries) {
        const data = entries.flatMap(({ id, reading, discogs }) => {
            try {
                if (!id) throw new Error('Each reading needs the id of an item')
                return [{ id, data: { discogsReading: discogsReading(reading), ...(discogs && { discogs: discogsEdition(discogs) }) } }]
            } catch (error) {
                console.warn(`[InventoryRepository] A reading of ${id ?? 'an item with no id'} was not kept: ${error.message}`)
                return []
            }
        })
        return this.updateMany(data)
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
