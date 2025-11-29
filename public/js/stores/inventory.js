/**
 * Inventory Store
 * Manages inventory state (Observable pattern)
 */

import { InventoryRepository } from '../repositories/InventoryRepository.js'
import { db as firestore } from '../app.js'
import { cacheManager } from '../cache/CacheManager.js'

export class InventoryStore {
    constructor() {
        this.albums = []
        this.loading = false
        this.error = null
        this.listeners = []
        this.repository = null
        this.userId = 'anonymous-user' // Will be updated when auth is implemented
    }

    /**
     * Initialize repository
     */
    init() {
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
        this.init()

        try {
            await this.repository.updateAlbum(albumId, updates)

            // Update local state
            this.albums = this.albums.map(album =>
                album.id === albumId ? { ...album, ...updates } : album
            )

            this.notify()
            return albumId
        } catch (error) {
            console.error('Failed to update inventory album:', error)
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
        this.init()

        try {
            await this.repository.removeAlbum(albumId)

            // Remove from local state
            this.albums = this.albums.filter(album => album.id !== albumId)
            this.notify()

            return albumId
        } catch (error) {
            console.error('Failed to remove from inventory:', error)
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

        this.albums.forEach(album => {
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
}

export const inventoryStore = new InventoryStore()
