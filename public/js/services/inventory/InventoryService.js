/**
 * InventoryService
 *
 * Reads and writes the inventory of the person on the app, and is the only writer of
 * InventoryStore (ADR-0017; F58, UAT-18: this was inside the store). The repository is a port
 * the caller gives (`createRepository(userId)`), so this file imports no Firestore, no cache and
 * no screen; services/inventory/inventoryWiring.js puts it together with the real ones.
 */

const ANONYMOUS = 'anonymous-user'

export class InventoryService {
    /**
     * @param {Object} deps
     * @param {InventoryStore} deps.store
     * @param {Function} deps.createRepository - (userId) => the inventory repository of that person
     */
    constructor({ store, createRepository }) {
        this.store = store
        this.createRepository = createRepository
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

    /** Add an album and read the inventory again. */
    async addAlbum(album, format, options = {}) {
        this.init()

        try {
            const id = await this.repository.addAlbum(album, format, options)
            await this.loadAlbums()
            return id
        } catch (error) {
            console.error('Failed to add album to inventory:', error)
            throw error
        }
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

    /** Change a price: shown at once, and put back if the write is refused. */
    async updatePrice(albumId, newPrice, currency) {
        this.init()

        const before = this.store.getAlbums()
        const oldAlbum = before.find(a => a.id === albumId)
        if (oldAlbum) {
            this.store.replaceAlbums(before.map(album =>
                album.id === albumId ? { ...album, purchasePrice: newPrice, currency } : album
            ))
        }

        try {
            await this.repository.updatePrice(albumId, newPrice, currency)
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
