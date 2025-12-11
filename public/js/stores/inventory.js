/**
 * Inventory Store
 * Manages inventory state (Observable pattern)
 */

import { InventoryRepository } from '../repositories/InventoryRepository.js'
import { db as firestore } from '../app.js'
import { cacheManager } from '../cache/CacheManager.js'
import { userStore } from './UserStore.js'
import { dataSyncService } from '../services/DataSyncService.js'

export class InventoryStore {
    constructor() {
        this.albums = []
        this.loading = false
        this.error = null
        this.listeners = []
        this.repository = null
        this.userId = 'anonymous-user'

        // Subscribe to user changes
        userStore.subscribe(this.handleUserChange.bind(this))
    }

    /**
     * Handle user state change
     * @param {Object} state - UserStore state
     */
    async handleUserChange(state) {
        const newUser = state.currentUser
        const newUserId = newUser ? newUser.uid : 'anonymous-user'

        // Only update if changed
        if (this.userId !== newUserId) {
            console.log(`[InventoryStore] Switching user context: ${this.userId} -> ${newUserId}`)

            // Capture data relative to previous user context (if it was anonymous)
            // This is the "Guest Data" we want to migrate
            let albumsToMigrate = []
            if (this.userId === 'anonymous-user' && this.albums.length > 0 && newUserId !== 'anonymous-user') {
                albumsToMigrate = [...this.albums]
                console.log(`[InventoryStore] Found ${albumsToMigrate.length} guest albums to migrate.`)
            }

            this.userId = newUserId

            // Re-init repository with new user
            if (firestore) {
                this.repository = new InventoryRepository(firestore, cacheManager, this.userId)

                // Perform migration if needed
                if (albumsToMigrate.length > 0) {
                    try {
                        const count = await dataSyncService.migrateInventory(this.repository, albumsToMigrate)
                        if (count > 0) console.log(`[InventoryStore] Migrated ${count} albums.`)
                        await this.loadAlbums()
                    } catch (err) {
                        console.error('[InventoryStore] Migration failed', err)
                    }
                } else {
                    // No migration needed, just load
                    await this.loadAlbums().catch(err => console.error('Failed to reload inventory on user switch:', err))
                }
            }
        }
    }

    /**
     * Initialize repository
     */
    init() {
        if (!firestore) {
            throw new Error('Firestore not initialized')
        }

        if (!this.repository) {
            this.repository = new InventoryRepository(firestore, cacheManager, this.userId)
        }
    }

    /**
     * Subscribe to state changes
     */
    subscribe(listener) {
        this.listeners.push(listener)
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener)
        }
    }

    /**
     * Notify all listeners
     */
    notify() {
        this.listeners.forEach(listener => listener(this.getState()))
    }

    /**
     * Get current state
     */
    getState() {
        return {
            albums: this.albums,
            loading: this.loading,
            error: this.error
        }
    }

    /**
     * Get all albums
     */
    getAlbums() {
        return this.albums
    }

    /**
     * Load all albums from repository
     */
    async loadAlbums() {
        this.init()
        this.loading = true
        this.error = null
        this.notify()

        try {
            this.albums = await this.repository.findAll()
            this.loading = false
            this.notify()
            return this.albums
        } catch (error) {
            console.error('Failed to load inventory:', error)
            this.error = error.message
            this.loading = false
            this.notify()
            throw error
        }
    }

    /**
     * Add album to inventory
     */
    async addAlbum(album, format, options = {}) {
        this.init()

        try {
            const id = await this.repository.addAlbum(album, format, options)

            // Reload to get fresh data
            await this.loadAlbums()

            return id
        } catch (error) {
            console.error('Failed to add album to inventory:', error)
            throw error
        }
    }

    /**
     * Update album in inventory
     */
    async updateAlbum(albumId, updates) {
        console.log('[InventoryStore.updateAlbum] Starting update for:', albumId, updates)
        this.init()

        try {
            console.log('[InventoryStore.updateAlbum] Calling repository.updateAlbum')
            await this.repository.updateAlbum(albumId, updates)
            console.log('[InventoryStore.updateAlbum] Repository update successful')

            // Update local state
            this.albums = this.albums.map(album =>
                album.id === albumId ? { ...album, ...updates } : album
            )

            this.notify()
            console.log('[InventoryStore.updateAlbum] Local state updated')
            return albumId
        } catch (error) {
            console.error('[InventoryStore.updateAlbum] Failed to update inventory album:', error)
            throw error
        }
    }

    /**
     * Update price inline (optimistic update)
     */
    async updatePrice(albumId, newPrice, currency) {
        this.init()

        // Optimistic update
        const oldAlbum = this.albums.find(a => a.id === albumId)
        if (oldAlbum) {
            this.albums = this.albums.map(album =>
                album.id === albumId
                    ? { ...album, purchasePrice: newPrice, currency }
                    : album
            )
            this.notify()
        }

        try {
            await this.repository.updatePrice(albumId, newPrice, currency)
            return albumId
        } catch (error) {
            console.error('Failed to update price:', error)

            // Rollback on error
            if (oldAlbum) {
                this.albums = this.albums.map(album =>
                    album.id === albumId ? oldAlbum : album
                )
                this.notify()
            }

            throw error
        }
    }

    /**
     * Remove album from inventory
     */
    async removeAlbum(albumId) {
        console.log('[InventoryStore.removeAlbum] Starting delete for:', albumId)
        this.init()

        try {
            console.log('[InventoryStore.removeAlbum] Calling repository.removeAlbum')
            await this.repository.removeAlbum(albumId)
            console.log('[InventoryStore.removeAlbum] Repository delete successful')

            // Remove from local state
            this.albums = this.albums.filter(album => album.id !== albumId)
            this.notify()

            console.log('[InventoryStore.removeAlbum] Removed from local state, albums remaining:', this.albums.length)
            return albumId
        } catch (error) {
            console.error('[InventoryStore.removeAlbum] Failed to remove from inventory:', error)
            throw error
        }
    }

    /**
     * Check if album is in inventory
     */
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

    /**
     * Get inventory statistics
     */
    getStatistics() {
        const stats = {
            totalAlbums: this.albums.length,
            ownedCount: 0,
            wishlistCount: 0,
            byFormat: {
                cd: 0,
                vinyl: 0,
                dvd: 0,
                bluray: 0,
                digital: 0
            },
            totalValueUSD: 0,
            totalValueBRL: 0,
            ownedValueUSD: 0,
            ownedValueBRL: 0,
            averagePriceUSD: 0,
            averagePriceBRL: 0
        }

        let totalPriceUSD = 0
        let totalPriceBRL = 0
        let ownedPriceUSD = 0
        let ownedPriceBRL = 0
        let countUSD = 0
        let countBRL = 0

        this.albums.forEach(album => {
            // Count by ownership
            // Strict check: only true counts as owned. null/undefined (Not Owned) and false (Wishlist) do not.
            const isOwned = album.owned === true
            if (isOwned) {
                stats.ownedCount++
            } else if (album.owned === false) {
                stats.wishlistCount++
            }
            // null/undefined counts as stored but neither owned nor wishlist (Not Owned)

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
                    if (isOwned) ownedPriceUSD += price
                    countUSD++
                } else if (currency === 'BRL') {
                    totalPriceBRL += price
                    if (isOwned) ownedPriceBRL += price
                    countBRL++
                }
            }
        })

        stats.totalValueUSD = totalPriceUSD
        stats.totalValueBRL = totalPriceBRL
        stats.ownedValueUSD = ownedPriceUSD
        stats.ownedValueBRL = ownedPriceBRL
        stats.averagePriceUSD = countUSD > 0 ? totalPriceUSD / countUSD : 0
        stats.averagePriceBRL = countBRL > 0 ? totalPriceBRL / countBRL : 0

        return stats
    }
}

export const inventoryStore = new InventoryStore()
