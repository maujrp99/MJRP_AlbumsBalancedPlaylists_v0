/**
 * InventoryService
 *
 * Reads and writes the inventory of the person on the app, and is the only writer of
 * InventoryStore (ADR-0017; F58, UAT-18: this was inside the store). The repository is a port
 * the caller gives (`createRepository(userId)`), so this file imports no Firestore, no cache and
 * no screen; services/inventory/inventoryWiring.js puts it together with the real ones.
 */

import { findInInventory, planSeriesAlbums } from '../../models/inventoryFromSeries.js'
import { RATING_SOURCES, planAverages, queryOfItem, ratingsAskOf } from '../../models/inventoryRatings.js'
import { ENRICHMENT_SOURCES } from '../../models/albumLoadState.js'

const ANONYMOUS = 'anonymous-user'

/**
 * How many albums go in one write of "add the albums of my series". A Firestore batch holds 500;
 * a smaller part keeps the progress visible and, if a write fails, loses less.
 */
export const SERIES_WRITE_SIZE = 100

const partsOf = (list, size) => Array.from({ length: Math.ceil(list.length / size) }, (_, part) => list.slice(part * size, (part + 1) * size))

/** What a price change shows and writes: a currency only when there is one. */
const priceChanges = (purchasePrice, currency) => (currency ? { purchasePrice, currency } : { purchasePrice })

export class InventoryService {
    /**
     * @param {Object} deps
     * @param {InventoryStore} deps.store
     * @param {Function} deps.createRepository - (userId) => the inventory repository of that person
     * @param {{ albumsOf: Function }} [deps.albumAsks] - the album load's one door (services/albums/AlbumAsks.js); only "Update ratings" needs it
     */
    constructor({ store, createRepository, albumAsks = null }) {
        this.store = store
        this.createRepository = createRepository
        this.albumAsks = albumAsks
        this.repository = null
        this.userId = ANONYMOUS
    }

    /**
     * The person on the app changed (sign-in, sign-out, or the anonymous account the app opens by
     * itself after a sign-out).
     *
     * The inventory in memory belongs to the person who was here: it is dropped at once, before
     * anything else, and never written into another account. Then the inventory of the person
     * who arrived is read; between a sign-out and the next account there is nobody to read for.
     *
     * Guest data is NOT carried into an account here: the copy this method used to make ran only
     * when a signed-in person signed out, and put that person's inventory into the anonymous
     * account that followed (UAT-198). Moving a guest's data on sign-in is UAT-12.
     *
     * @param {Object} state - UserStore state
     */
    async handleUserChange(state) {
        const newUser = state.currentUser
        const newUserId = newUser ? newUser.uid : ANONYMOUS
        if (this.userId === newUserId) return

        console.log(`[InventoryService] Switching user context: ${this.userId} -> ${newUserId}`)

        this.userId = newUserId
        this.repository = this.createRepository(this.userId)
        this.store.reset()

        if (!newUser) return

        await this.loadAlbums().catch(err => console.error('Failed to reload inventory on user switch:', err))
    }

    /** The repository of the person on the app, made the first time it is needed. */
    init() {
        if (!this.repository) this.repository = this.createRepository(this.userId)
    }

    /** Read the whole inventory into the store. */
    async loadAlbums() {
        this.init()
        this.store.setLoading()

        // The answer belongs to whoever asked: if the person changes while it is on its way, it is dropped
        const repository = this.repository
        const askedBy = () => repository === this.repository

        try {
            const albums = await repository.findAll()
            if (askedBy()) this.store.setAlbums(albums)
            return this.store.getAlbums()
        } catch (error) {
            if (!askedBy()) return this.store.getAlbums()
            console.error('Failed to load inventory:', error)
            this.store.setError(error.message)
            throw error
        }
    }

    /**
     * Add an album and read the inventory again.
     * An album that is already there is refused, by the same answer "add the albums of my series"
     * uses (models/inventoryFromSeries.js): the same id, the same Apple Music id, or the same
     * album by the one identity rule. So an edition of an album that came from a series is not
     * added beside it from an album card.
     * @throws {Error} 'Album already in inventory'
     */
    async addAlbum(album, format, options = {}) {
        this.init()

        try {
            if (findInInventory(album, await this.repository.findAll())) throw new Error('Album already in inventory')
            const id = await this.repository.addAlbum(album, format, options)
            await this.loadAlbums()
            return id
        } catch (error) {
            console.error('Failed to add album to inventory:', error)
            throw error
        }
    }

    /**
     * What "add the albums of my series" would do now (F71): the inventory is read from the cloud,
     * not from the screen, and nothing is written.
     * @param {Array<{ name?: string, albumQueries?: Array }>} series - the person's series
     * @returns {Promise<Object>} the plan of models/inventoryFromSeries.js `planSeriesAlbums`
     * @throws when the inventory cannot be read
     */
    async planSeriesAlbums(series) {
        this.init()
        return planSeriesAlbums(series, await this.repository.findAll())
    }

    /**
     * Write the planned albums as Not Owned items, in parts of SERIES_WRITE_SIZE, each part one
     * write (all of it or none of it). Items that are already in the inventory are never touched:
     * this only creates.
     *
     * A part that fails stops the run and does NOT take back the parts before it: the answer says
     * how many albums went in. Planning again adds only the rest, so running the action again is
     * the recovery. The store is told once, at the end, by reading the inventory again.
     *
     * @param {Object[]} albums - `toAdd` of the plan
     * @param {Object} [options]
     * @param {Function} [options.onProgress] - ({ added, total }) after each part that went in
     * @returns {Promise<{ added: number, total: number, error: string|null, reloaded: boolean }>}
     */
    async addAlbumsAsNotOwned(albums, { onProgress = () => { } } = {}) {
        this.init()
        const repository = this.repository
        const total = albums.length
        let added = 0
        let error = null

        for (const part of partsOf(albums, SERIES_WRITE_SIZE)) {
            try {
                await repository.addBatch(part)
            } catch (failure) {
                console.error(`[InventoryService] Adding the albums of the series stopped after ${added} of ${total}:`, failure)
                error = failure?.message || String(failure)
                break
            }
            added += part.length
            onProgress({ added, total })
        }

        return { added, total, error, reloaded: added === 0 || await this._readAgain(repository) }
    }

    /** Read the inventory again for the person the write was for. @returns {Promise<boolean>} whether the screen is up to date */
    async _readAgain(repository) {
        if (repository !== this.repository) return false
        try {
            await this.loadAlbums()
            return true
        } catch (error) {
            console.error('[InventoryService] The albums were added, but the inventory could not be read again:', error)
            return false
        }
    }

    /**
     * "Update ratings" (F71, S-56): read the Avg Rating and the Avg Pop of every album of the
     * inventory and keep them in the items (`averages`).
     *
     * ONE ask goes to the album load for the albums of the items (the load's queue, holds and
     * browser cache; nothing here calls the network). Each ready album is matched back to its item
     * by the one identity rule, and the averages are written in parts of SERIES_WRITE_SIZE, each
     * part one write. An average a source gave nothing for keeps the value the item had. A part
     * that fails stops the run and does NOT take back the parts before it; the answer says how many
     * were saved, and running it again writes the rest. It never throws for a failed part. The
     * store is told once, at the end.
     *
     * @param {Object} [options]
     * @param {AbortSignal} [options.signal] - aborted when the person leaves the screen
     * @param {Function} [options.onProgress] - ({ phase: 'reading', done, total }) | ({ phase: 'saving', saved, total })
     * @param {Function} [options.now] - () => Date, for the time written in `averages.at`
     * @returns {Promise<{ aborted: boolean, total: number, planned: number, saved: number, notFound: number,
     *   withoutRatings: number, popularityNotConnected: number, unanswered: number, error: string|null }>}
     */
    async updateAverages({ signal = null, onProgress = () => { }, now = () => new Date() } = {}) {
        this.init()
        const repository = this.repository
        const items = this.store.getAlbums()
        const nothing = { aborted: false, total: items.length, planned: 0, saved: 0, notFound: 0, withoutRatings: 0, popularityNotConnected: 0, unanswered: 0, error: null }
        if (items.length === 0) return nothing

        const result = await this._askForRatings(items, { signal, onProgress })
        if (result.aborted || repository !== this.repository) return { ...nothing, aborted: true }

        const plan = planAverages(items, result, now().toISOString())
        const present = new Set(this.store.getAlbums().map(item => item.id))
        const updates = plan.updates.filter(update => present.has(update.id))
        const { saved, error } = await this._writeAverages(repository, updates, onProgress)
        const { notFound, withoutRatings, popularityNotConnected, unanswered } = plan
        return { ...nothing, planned: updates.length, saved, error, notFound, withoutRatings, popularityNotConnected, unanswered }
    }

    /**
     * The album of an item as the album load has it now, with its ratings, its popularity and the person's own
     * ranking, the same ask the albums screen makes (F71, UAT-220): what the window of an item shows. Asked through the load's one door; what the
     * browser or the albums screen already has is not asked again.
     * @param {Object} item - an inventory item
     * @param {Object} [options]
     * @param {AbortSignal} [options.signal] - aborted when the window closes
     * @returns {Promise<Object|null>} the album, or null when the load could not give it
     */
    async albumOfItem(item, { signal = null } = {}) {
        const result = await this.albumAsks.albumsOf({
            series: [{ id: `inventory-album:${item.id}`, albumQueries: [queryOfItem(item)] }],
            // every source the albums screen shows: ratings, popularity and the person's own ranking
            sources: [...ENRICHMENT_SOURCES],
            signal
        })
        return result.albums?.[0] || null
    }

    /** The one ask to the album load; progress is the albums done (found with their sources, or failed) of the total. */
    _askForRatings(items, { signal, onProgress }) {
        const total = items.length
        let told = -1
        const tell = (done) => {
            if (done === told) return
            told = done
            onProgress({ phase: 'reading', done, total })
        }
        tell(0)
        return this.albumAsks.albumsOf({
            series: [ratingsAskOf(items)],
            sources: [...RATING_SOURCES],
            signal,
            onProgress: ({ found, failed, waitingSources }) => tell(found + failed - waitingSources)
        })
    }

    /** Write the averages in parts; the store shows what was saved, once, at the end. @returns {Promise<{ saved: number, error: string|null }>} */
    async _writeAverages(repository, updates, onProgress) {
        const total = updates.length
        let saved = 0
        let error = null
        if (total > 0) onProgress({ phase: 'saving', saved, total })

        for (const part of partsOf(updates, SERIES_WRITE_SIZE)) {
            try {
                await repository.setAverages(part)
            } catch (failure) {
                console.error(`[InventoryService] Saving the averages stopped after ${saved} of ${total}:`, failure)
                error = failure?.message || String(failure)
                break
            }
            saved += part.length
            onProgress({ phase: 'saving', saved, total })
        }

        if (saved > 0 && repository === this.repository) this._showAverages(updates.slice(0, saved))
        return { saved, error }
    }

    /** The items of the store get the averages that were saved; nothing else of them changes. */
    _showAverages(saved) {
        const byId = new Map(saved.map(({ id, averages }) => [id, averages]))
        this.store.replaceAlbums(this.store.getAlbums().map(item => (byId.has(item.id) ? { ...item, averages: byId.get(item.id) } : item)))
    }

    /** Write the changes of one album; the store changes only after the write worked. */
    async updateAlbum(albumId, updates) {
        this.init()

        try {
            await this.repository.updateAlbum(albumId, updates)
            this.store.replaceAlbums(this.store.getAlbums().map(album =>
                album.id === albumId ? { ...album, ...updates } : album
            ))
            return albumId
        } catch (error) {
            console.error('[InventoryService.updateAlbum] Failed to update inventory album:', error)
            throw error
        }
    }

    /**
     * Change a price: shown at once, and put back if the write is refused.
     * The item keeps its currency (F70, UAT-209): with no `currency` given, the one the item has
     * is shown and written; an item that never had one gets none invented, only the price changes.
     * @param {string} albumId - the inventory item
     * @param {number} newPrice
     * @param {string} [currency] - only when the person chose another one
     * @returns {Promise<string>} the id of the item
     * @throws when the price is negative (nothing is shown or written) or when the write fails
     */
    async updatePrice(albumId, newPrice, currency) {
        this.init()
        if (newPrice < 0) throw new Error('Price cannot be negative')

        const before = this.store.getAlbums()
        const oldAlbum = before.find(a => a.id === albumId)
        const changes = priceChanges(newPrice, currency || oldAlbum?.currency)
        if (oldAlbum) {
            this.store.replaceAlbums(before.map(album =>
                album.id === albumId ? { ...album, ...changes } : album
            ))
        }

        try {
            await this._writePrice(albumId, changes)
            return albumId
        } catch (error) {
            console.error('Failed to update price:', error)
            if (oldAlbum) {
                this.store.replaceAlbums(this.store.getAlbums().map(album =>
                    album.id === albumId ? oldAlbum : album
                ))
            }
            throw error
        }
    }

    /** The repository's price door checks the currency; with none to write, only the price goes. */
    _writePrice(albumId, changes) {
        return changes.currency
            ? this.repository.updatePrice(albumId, changes.purchasePrice, changes.currency)
            : this.repository.updateAlbum(albumId, changes)
    }

    /** Remove an album from the cloud, then from the store. */
    async removeAlbum(albumId) {
        this.init()

        try {
            await this.repository.removeAlbum(albumId)
            this.store.replaceAlbums(this.store.getAlbums().filter(album => album.id !== albumId))
            return albumId
        } catch (error) {
            console.error('[InventoryService.removeAlbum] Failed to remove from inventory:', error)
            throw error
        }
    }

    /** Is this album in the inventory? A failed read answers "no". */
    async isInInventory(albumId) {
        this.init()

        try {
            const album = await this.repository.findByAlbumId(albumId)
            return album !== null
        } catch (error) {
            console.error('Failed to check inventory:', error)
            return false
        }
    }
}
