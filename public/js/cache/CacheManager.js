/**
 * CacheManager
 * Unified cache interface with L1 (Memory) + L2 (IndexedDB) layers
 * Falls back gracefully if IndexedDB is unavailable
 */

import { MemoryCache } from './MemoryCache.js'
import { IndexedDBCache } from './IndexedDBCache.js'

export class CacheManager {
    constructor() {
        this.l1 = new MemoryCache() // Fast, session-only
        this.l2 = null // IndexedDB, persistent
        this.l2Available = false
        this.initPromise = null
    }

    /**
     * Initialize cache layers
     * @returns {Promise<void>}
     */
    async init() {
        if (this.initPromise) {
            return this.initPromise
        }

        this.initPromise = (async () => {
            // Try to initialize IndexedDB
            try {
                this.l2 = new IndexedDBCache()
                await this.l2.init()
                this.l2Available = true
                console.log('✅ CacheManager: IndexedDB (L2) initialized')
            } catch (error) {
                console.warn('⚠️ CacheManager: IndexedDB unavailable, falling back to memory-only cache', error)
                this.l2Available = false
            }
        })()

        return this.initPromise
    }

    /**
     * Get value from cache (L1 first, then L2)
     * @param {string} key - Cache key
     * @returns {Promise<any|null>} Cached value or null
     */
    async get(key) {
        await this.init()

        // Try L1 (memory) first - fastest
        let value = await this.l1.get(key)
        if (value !== null) {
            return value
        }

        // Try L2 (IndexedDB) if available
        if (this.l2Available) {
            value = await this.l2.get(key)
            if (value !== null) {
                // Promote to L1 for faster access next time
                await this.l1.set(key, value)
                return value
            }
        }

        return null
    }

    /**
     * Set value in cache (both L1 and L2)
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - Time to live in milliseconds (default: 7 days)
     * @returns {Promise<void>}
     */
    async set(key, value, ttl = 7 * 24 * 60 * 60 * 1000) {
        await this.init()

        // Validate schema version if present
        if (value && value._schemaVersion !== undefined) {
            // Store schema version for future validation
            value._cachedSchemaVersion = value._schemaVersion
        }

        // Set in L1 (memory) - synchronous and fast
        await this.l1.set(key, value, ttl)

        // Set in L2 (IndexedDB) - async, persistent
        if (this.l2Available) {
            try {
                await this.l2.set(key, value, ttl)
            } catch (error) {
                console.error('❌ CacheManager: Failed to cache in L2 (IndexedDB)', error)
                // Continue - L1 cache still works
            }
        }
    }

    /**
     * Invalidate cache entry (both L1 and L2)
     * @param {string} key - Cache key
     * @returns {Promise<void>}
     */
    async invalidate(key) {
        await this.init()

        // Invalidate L1
        await this.l1.invalidate(key)

        // Invalidate L2
        if (this.l2Available) {
            try {
                await this.l2.invalidate(key)
            } catch (error) {
                console.error('❌ CacheManager: Failed to invalidate L2 (IndexedDB)', error)
            }
        }
    }

    /**
     * Clear all cache (both L1 and L2)
     * @returns {Promise<void>}
     */
    async clear() {
        await this.init()

        await this.l1.clear()

        if (this.l2Available) {
            try {
                await this.l2.clear()
            } catch (error) {
                console.error('❌ CacheManager: Failed to clear L2 (IndexedDB)', error)
            }
        }
    }

    /**
     * Check if key exists in cache
     * @param {string} key - Cache key
     * @returns {Promise<boolean>}
     */
    async has(key) {
        await this.init()

        const hasL1 = await this.l1.has(key)
        if (hasL1) return true

        if (this.l2Available) {
            return await this.l2.has(key)
        }

        return false
    }

    /**
     * Validate schema version
     * @param {Object} cachedData - Cached data with _schemaVersion
     * @param {number} expectedVersion - Expected schema version
     * @returns {boolean} True if valid, false if mismatch
     */
    validateSchemaVersion(cachedData, expectedVersion) {
        if (!cachedData || cachedData._schemaVersion === undefined) {
            return true // No version to validate
        }

        return cachedData._schemaVersion === expectedVersion
    }

    /**
     * Clean up expired entries in L2
     * @returns {Promise<number>} Number of entries removed
     */
    async cleanExpired() {
        await this.init()

        if (this.l2Available) {
            return await this.l2.cleanExpired()
        }

        return 0
    }

    /**
     * Get cache statistics
     * @returns {Promise<Object>} Cache stats
     */
    async getStats() {
        await this.init()

        const stats = {
            l1Size: this.l1.size(),
            l2Available: this.l2Available,
            l2Keys: 0
        }

        if (this.l2Available) {
            try {
                const keys = await this.l2.keys()
                stats.l2Keys = keys.length
            } catch (error) {
                console.error('❌ CacheManager: Failed to get L2 stats', error)
            }
        }

        return stats
    }
}

// Singleton instance
export const cacheManager = new CacheManager()
