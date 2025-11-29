/**
 * IndexedDBCache (L2)
 * Persistent cache using IndexedDB (500MB+, cross-tab sync)
 */

export class IndexedDBCache {
    constructor(dbName = 'mjrp-cache', version = 1) {
        this.dbName = dbName
        this.version = version
        this.db = null
        this.storeName = 'cache'
    }

    /**
     * Initialize IndexedDB connection
     * @returns {Promise<void>}
     */
    async init() {
        if (this.db) return // Already initialized

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version)

            request.onerror = () => reject(request.error)
            request.onsuccess = () => {
                this.db = request.result
                resolve()
            }

            request.onupgradeneeded = (event) => {
                const db = event.target.result

                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = db.createObjectStore(this.storeName, { keyPath: 'key' })
                    objectStore.createIndex('expiresAt', 'expiresAt', { unique: false })
                }
            }
        })
    }

    /**
     * Ensure DB is initialized
     * @private
     */
    async ensureInit() {
        if (!this.db) {
            await this.init()
        }
    }

    /**
     * Get value from cache
     * @param {string} key - Cache key
     * @returns {Promise<any|null>} Cached value or null if expired/missing
     */
    async get(key) {
        await this.ensureInit()

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly')
            const objectStore = transaction.objectStore(this.storeName)
            const request = objectStore.get(key)

            request.onsuccess = () => {
                const record = request.result

                if (!record) {
                    resolve(null)
                    return
                }

                // Check TTL
                if (record.expiresAt && Date.now() > record.expiresAt) {
                    // Expired, delete it
                    this.invalidate(key)
                    resolve(null)
                    return
                }

                resolve(record.value)
            }

            request.onerror = () => reject(request.error)
        })
    }

    /**
     * Set value in cache
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} ttl - Time to live in milliseconds (default: 7 days)
     * @returns {Promise<void>}
     */
    async set(key, value, ttl = 7 * 24 * 60 * 60 * 1000) {
        await this.ensureInit()

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite')
            const objectStore = transaction.objectStore(this.storeName)

            const record = {
                key,
                value,
                cachedAt: Date.now(),
                expiresAt: ttl ? Date.now() + ttl : null
            }

            const request = objectStore.put(record)

            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
        })
    }

    /**
     * Invalidate (delete) cache entry
     * @param {string} key - Cache key
     * @returns {Promise<void>}
     */
    async invalidate(key) {
        await this.ensureInit()

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite')
            const objectStore = transaction.objectStore(this.storeName)
            const request = objectStore.delete(key)

            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
        })
    }

    /**
     * Clear all cache
     * @returns {Promise<void>}
     */
    async clear() {
        await this.ensureInit()

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite')
            const objectStore = transaction.objectStore(this.storeName)
            const request = objectStore.clear()

            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
        })
    }

    /**
     * Get all keys in cache
     * @returns {Promise<string[]>} Array of cache keys
     */
    async keys() {
        await this.ensureInit()

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly')
            const objectStore = transaction.objectStore(this.storeName)
            const request = objectStore.getAllKeys()

            request.onsuccess = () => resolve(request.result)
            request.onerror = () => reject(request.error)
        })
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

    /**
     * Clean up expired entries
     * @returns {Promise<number>} Number of entries removed
     */
    async cleanExpired() {
        await this.ensureInit()

        const allKeys = await this.keys()
        let removed = 0

        for (const key of allKeys) {
            const value = await this.get(key) // Will auto-delete if expired
            if (value === null) {
                removed++
            }
        }

        return removed
    }
}
