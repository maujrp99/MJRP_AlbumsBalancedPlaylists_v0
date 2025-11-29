/**
 * MemoryCache (L1)
 * Fast in-memory cache (session-only)
 */

export class MemoryCache {
    constructor() {
        this.store = new Map()
        this.metadata = new Map() // Store TTL and timestamps
    }

    /**
     * Get value from cache
     * @param {string} key - Cache key
     * @returns {Promise<any|null>} Cached value or null if expired/missing
     */
    async get(key) {
        if (!this.store.has(key)) {
            return null
        }

        // Check TTL
        const meta = this.metadata.get(key)
        if (meta && meta.expiresAt && Date.now() > meta.expiresAt) {
            // Expired, remove it
            this.store.delete(key)
            this.metadata.delete(key)
            return null
        }

        return this.store.get(key)
    }

    /**
     * Set value in cache
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - Time to live in milliseconds (default: 7 days)
     * @returns {Promise<void>}
     */
    async set(key, value, ttl = 7 * 24 * 60 * 60 * 1000) {
        this.store.set(key, value)
        this.metadata.set(key, {
            cachedAt: Date.now(),
            expiresAt: ttl ? Date.now() + ttl : null
        })
    }

    /**
     * Invalidate (delete) cache entry
     * @param {string} key - Cache key
     * @returns {Promise<void>}
     */
    async invalidate(key) {
        this.store.delete(key)
        this.metadata.delete(key)
    }

    /**
     * Clear all cache
     * @returns {Promise<void>}
     */
    async clear() {
        this.store.clear()
        this.metadata.clear()
    }

    /**
     * Get cache size
     * @returns {number} Number of cached items
     */
    size() {
        return this.store.size
    }

    /**
     * Check if key exists (and is not expired)
     * @param {string} key - Cache key
     * @returns {Promise<boolean>}
     */
    async has(key) {
        const value = await this.get(key)
        return value !== null
    }
}
