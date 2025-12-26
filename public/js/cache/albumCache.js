/**
 * AlbumCache
 * ARCH-5 Refactor: Now uses CacheManager (Memory + IndexedDB) instead of localStorage
 * 
 * Maintains backwards-compatible API for consumers (get/set are now async)
 * Migration: Reads from legacy localStorage during 7-day transition period
 */

import { cacheManager } from './CacheManager.js'

export class AlbumCache {
    constructor() {
        this.ttl = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
        this.version = '4.0' // Bumped for IndexedDB migration
        this.legacyVersion = '3.1' // For reading old localStorage entries
        this.migrationComplete = false

        // Schedule legacy cleanup after 7 days
        this.migrationStartDate = this._getMigrationStartDate()
    }

    /**
     * Normalize cache key for consistency
     * @param {string} query - Album query
     * @returns {string} Normalized cache key
     */
    normalizeKey(query) {
        return `album:${(query || '').toLowerCase().trim().replace(/\s+/g, ' ')}`
    }

    /**
     * Get album from cache (async - uses CacheManager)
     * @param {string} query - Album query
     * @returns {Promise<Object|null>} Cached album or null
     */
    async get(query) {
        const key = this.normalizeKey(query)

        // Try new cache first (CacheManager with IndexedDB)
        let data = await cacheManager.get(key)

        if (data) {
            console.log('✅ IndexedDB cache hit:', query)
            return data
        }

        // Fallback: Try legacy localStorage (migration period)
        if (!this.migrationComplete) {
            data = this._legacyGet(query)
            if (data) {
                console.log('📦 Migrating from localStorage to IndexedDB:', query)
                // Migrate to new cache
                await cacheManager.set(key, data, this.ttl)
                return data
            }
        }

        return null
    }

    /**
     * Set album in cache (async - uses CacheManager)
     * @param {string} query - Album query
     * @param {Object} album - Album data
     * @returns {Promise<void>}
     */
    async set(query, album) {
        const key = this.normalizeKey(query)

        // Store in CacheManager (Memory L1 + IndexedDB L2)
        await cacheManager.set(key, album, this.ttl)
        console.log('💾 Cached to IndexedDB:', query)

        // Also cache by album identity for getByIdentity() lookups
        if (album && album.artist && album.title) {
            const identityKey = this.getAlbumKey(album.artist, album.title)
            await cacheManager.set(identityKey, album, this.ttl)
        }
    }

    /**
     * Get album by identity (artist + title) instead of query
     * @param {string} artist - Artist name
     * @param {string} title - Album title
     * @returns {Promise<Object|null>} Cached album or null
     */
    async getByIdentity(artist, title) {
        const identityKey = this.getAlbumKey(artist, title)
        return await cacheManager.get(identityKey)
    }

    /**
     * Generate cache key from album identity (artist + title)
     * @param {string} artist - Artist name
     * @param {string} title - Album title
     * @returns {string} Normalized album key
     */
    getAlbumKey(artist, title) {
        const normalizedArtist = (artist || '').toLowerCase().replace(/\s+/g, '_').replace(/[^\w_-]/g, '')
        const normalizedTitle = (title || '').toLowerCase().replace(/\s+/g, '_').replace(/[^\w_-]/g, '')
        return `album:identity:${normalizedArtist}_${normalizedTitle}`
    }

    /**
     * Invalidate specific album cache
     * @param {string} query - Album query to invalidate
     * @returns {Promise<void>}
     */
    async invalidate(query) {
        const key = this.normalizeKey(query)
        await cacheManager.invalidate(key)
        console.log('🗑️ Invalidated cache:', query)
    }

    /**
     * Clear all cached albums
     * @returns {Promise<void>}
     */
    async clearAll() {
        await cacheManager.clear()
        console.log('🗑️ Cleared all album cache')
    }

    /**
     * Get cache stats
     * @returns {Promise<Object>} Cache statistics
     */
    async getStats() {
        const cmStats = await cacheManager.getStats()
        return {
            memoryCount: cmStats.l1Size,
            indexedDBCount: cmStats.l2Keys,
            indexedDBAvailable: cmStats.l2Available,
            version: this.version
        }
    }

    // =========================================
    // LEGACY METHODS (for migration period)
    // =========================================

    /**
     * Read from legacy localStorage (for migration)
     * @private
     */
    _legacyGet(query) {
        const storageKey = this._legacyStorageKey(query)
        const cached = localStorage.getItem(storageKey)

        if (!cached) return null

        try {
            const { data, timestamp, version } = JSON.parse(cached)

            // Check version compatibility
            if (version !== this.legacyVersion) {
                localStorage.removeItem(storageKey)
                return null
            }

            // Check TTL
            if (Date.now() - timestamp > this.ttl) {
                localStorage.removeItem(storageKey)
                return null
            }

            return data
        } catch (error) {
            localStorage.removeItem(storageKey)
            return null
        }
    }

    /**
     * Legacy storage key format
     * @private
     */
    _legacyStorageKey(query) {
        const normalized = query.toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^\w-]/g, '')
        return `album_cache_v${this.legacyVersion}_${normalized}`
    }

    /**
     * Get migration start date from localStorage
     * @private
     */
    _getMigrationStartDate() {
        const key = 'album_cache_migration_start'
        let startDate = localStorage.getItem(key)

        if (!startDate) {
            startDate = Date.now().toString()
            localStorage.setItem(key, startDate)
        }

        // Check if 7 days have passed
        const daysSinceMigration = (Date.now() - parseInt(startDate)) / (1000 * 60 * 60 * 24)
        if (daysSinceMigration >= 7) {
            this.migrationComplete = true
            console.log('� Migration period complete - localStorage fallback disabled')
        }

        return parseInt(startDate)
    }

    /**
     * Clean up legacy localStorage entries (call after migration period)
     */
    cleanupLegacy() {
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && (key.startsWith('album_cache_v') || key.startsWith('album_'))) {
                keysToRemove.push(key)
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))
        console.log(`🗑️ Cleaned up ${keysToRemove.length} legacy localStorage entries`)
    }
}

// Singleton instance
export const albumCache = new AlbumCache()
