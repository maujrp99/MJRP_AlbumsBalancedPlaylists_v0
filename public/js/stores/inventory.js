/**
 * Inventory Store
 *
 * The inventory on screen: the albums, whether they are being read, and the last error.
 * Pure state (ADR-0017; F58, UAT-18): setters, getters and subscribe. It reads nothing and writes
 * nowhere: InventoryService (services/inventory/) does, and is the only writer of this store.
 */

import { inventoryStatistics } from '../models/inventoryStats.js'

export class InventoryStore {
    constructor() {
        this.albums = []
        this.loading = false
        this.error = null
        this.listeners = []
    }

    // ========== SETTERS ==========

    /** Drop everything: what is in memory belongs to whoever was here. */
    reset() {
        this.albums = []
        this.loading = false
        this.error = null
        this.notify()
    }

    /** A read started. */
    setLoading() {
        this.loading = true
        this.error = null
        this.notify()
    }

    /** A read ended with these albums. */
    setAlbums(albums) {
        this.albums = albums
        this.loading = false
        this.notify()
    }

    /** A read failed. */
    setError(message) {
        this.error = message
        this.loading = false
        this.notify()
    }

    /** The list changed without a read (an album updated or removed). */
    replaceAlbums(albums) {
        this.albums = albums
        this.notify()
    }

    // ========== GETTERS ==========

    getState() {
        return {
            albums: this.albums,
            loading: this.loading,
            error: this.error
        }
    }

    getAlbums() {
        return this.albums
    }

    /** Derived, never stored (models/inventoryStats.js). */
    getStatistics() {
        return inventoryStatistics(this.albums)
    }

    // ========== SUBSCRIPTIONS ==========

    /**
     * @param {Function} listener - (state) => void
     * @returns {Function} unsubscribe
     */
    subscribe(listener) {
        this.listeners.push(listener)
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener)
        }
    }

    notify() {
        this.listeners.forEach(listener => listener(this.getState()))
    }
}

export const inventoryStore = new InventoryStore()
