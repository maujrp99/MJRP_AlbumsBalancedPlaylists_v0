/**
 * AlbumCache
 * Hybrid caching system (Memory + localStorage) with TTL
 * L1 cache: Memory (fast, session-only)
 * L2 cache: localStorage (persistent, with 7-day TTL)
 */

export class AlbumCache {
    constructor() {
        this.memoryCache = new Map() // L1 cache (RAM)
        this.ttl = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
        this.version = '3.1' // CRIT-5: Bumped to invalidate old incorrect cached albums

        // Cleanup expired entries on init
        try {
            this.clearExpired()
        } catch (e) {
            console.warn('Failed to clear expired cache:', e)
        }
    }

    /**
     * Get album from cache (memory first, then localStorage)
     * @param {string} query - Album query
     * @returns {Object|null} Cached album or null
     */
    get(query) {
        // L1: Check memory cache
        if (this.memoryCache.has(query)) {
            console.log('✅ L1 cache hit (memory):', query)
            return this.memoryCache.get(query)
        }

        // L2: Check localStorage
        const storageKey = this.getStorageKey(query)
        const cached = localStorage.getItem(storageKey)

        if (!cached) return null

        try {
            const { data, timestamp, version } = JSON.parse(cached)

            // Check version compatibility
            if (version !== this.version) {
                console.log('⚠️ Cache version mismatch:', query)
                localStorage.removeItem(storageKey)
                return null
            }

            // Check TTL
            if (Date.now() - timestamp > this.ttl) {
                console.log('⏰ Cache expired:', query)
                localStorage.removeItem(storageKey)
                return null
            }

            console.log('✅ L2 cache hit (localStorage):', query)

            // Promote to L1 cache
            this.memoryCache.set(query, data)

            return data
        } catch (error) {
            console.warn('Cache parse error:', error)
            localStorage.removeItem(storageKey)
            return null
        }
    }

    /**
     * Set album in cache (both levels)
     * @param {string} query - Album query
     * @param {Object} album - Album data
     */
    set(query, album) {
        // L1: Memory cache
        this.memoryCache.set(query, album)

        // CRIT-5c: Also cache by album identity key
        if (album.artist && album.title) {
            const albumKey = this.getAlbumKey(album.artist, album.title)
            this.memoryCache.set(albumKey, album)

            // Store query → albumKey mapping for debugging
            if (!this.queryToAlbumKey) {
                this.queryToAlbumKey = new Map()
            }
            this.queryToAlbumKey.set(query, albumKey)
        }

        // L2: localStorage
        const storageKey = this.getStorageKey(query)
        try {
            localStorage.setItem(storageKey, JSON.stringify({
                data: album,
                timestamp: Date.now(),
                version: this.version
            }))
            console.log('💾 Cached:', query)
        } catch (error) {
            console.warn('localStorage full, clearing old entries:', error)
            this.clearOldEntries(5)

            // Retry after cleanup
            try {
                localStorage.setItem(storageKey, JSON.stringify({
                    data: album,
                    timestamp: Date.now(),
                    version: this.version
                }))
            } catch (retryError) {
                console.error('Failed to cache even after cleanup:', retryError)
            }
        }
    }

    /**
     * Get album by identity (artist + title) instead of query
     * CRIT-5c: Alternative lookup that doesn't depend on query string
     * 
     * @param {string} artist - Artist name
     * @param {string} title - Album title
     * @returns {Object|null} Cached album or null
     */
    getByIdentity(artist, title) {
        const albumKey = this.getAlbumKey(artist, title)

        // L1: Memory cache
        if (this.memoryCache.has(albumKey)) {
            console.log('✅ L1 cache hit (by identity):', albumKey)
            return this.memoryCache.get(albumKey)
        }

        // L2: localStorage
        const cached = localStorage.getItem(albumKey)
        if (!cached) return null

        try {
            const { data, timestamp, version } = JSON.parse(cached)
            if (version !== this.version) return null
            if (Date.now() - timestamp > this.ttl) return null

            console.log('✅ L2 cache hit (by identity):', albumKey)
            this.memoryCache.set(albumKey, data)
            return data
        } catch {
            return null
        }
    }

    /**
     * Generate cache key from album identity (artist + title)
     * CRIT-5c: Key based on ACTUAL album, not query
     * 
     * @param {string} artist - Artist name
     * @param {string} title - Album title
     * @returns {string} Normalized album key
     */
    getAlbumKey(artist, title) {
        const normalizedArtist = (artist || '').toLowerCase().replace(/\s+/g, '_').replace(/[^\w_-]/g, '')
        const normalizedTitle = (title || '').toLowerCase().replace(/\s+/g, '_').replace(/[^\w_-]/g, '')
        return `album_${normalizedArtist}_${normalizedTitle}`
    }

    /**
     * Invalidate specific album cache
     * @param {string} query - Album query to invalidate
     */
    invalidate(query) {
        this.memoryCache.delete(query)
        const storageKey = this.getStorageKey(query)
        localStorage.removeItem(storageKey)
        console.log('🗑️ Invalidated cache:', query)
    }

    /**
     * Clear all cached albums
     */
    clearAll() {
        this.memoryCache.clear()

        // Clear all album_* keys from localStorage
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.startsWith('album_')) {
                keysToRemove.push(key)
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))

        console.log('🗑️ Cleared all album cache')
    }

    /**
     * Clear expired entries
     */
    clearExpired() {
        let cleared = 0
        const keysToRemove = []

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (!key || !key.startsWith('album_')) continue

            try {
                const cached = JSON.parse(localStorage.getItem(key))
                if (Date.now() - cached.timestamp > this.ttl) {
                    keysToRemove.push(key)
                    cleared++
                }
            } catch (error) {
                keysToRemove.push(key) // Remove corrupted entries
                cleared++
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key))

        if (cleared > 0) {
            console.log(`🗑️ Cleared ${cleared} expired entries`)
        }
    }

    /**
     * Clear oldest entries (LRU eviction)
     * @param {number} count - Number of entries to remove
     */
    clearOldEntries(count = 5) {
        const entries = []

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (!key || !key.startsWith('album_')) continue

            try {
                const cached = JSON.parse(localStorage.getItem(key))
                entries.push({ key, timestamp: cached.timestamp })
            } catch (error) {
                localStorage.removeItem(key)
            }
        }

        // Sort by oldest first
        entries.sort((a, b) => a.timestamp - b.timestamp)

        // Remove oldest N entries
        const toRemove = entries.slice(0, Math.min(count, entries.length))
        toRemove.forEach(({ key }) => localStorage.removeItem(key))

        console.log(`🗑️ Cleared ${toRemove.length} oldest entries (LRU eviction)`)
    }

    /**
     * Get cache stats
     * @returns {Object} Cache statistics
     */
    getStats() {
        let localStorageCount = 0
        let totalSize = 0

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (!key || !key.startsWith('album_')) continue

            localStorageCount++
            const item = localStorage.getItem(key)
            if (item) {
                totalSize += item.length
            }
        }

        return {
            memoryCount: this.memoryCache.size,
            localStorageCount,
            totalSizeKB: (totalSize / 1024).toFixed(2),
            ttlDays: this.ttl / (24 * 60 * 60 * 1000)
        }
    }

    /**
     * Get storage key for query
     * @param {string} query - Album query
     * @returns {string} Storage key
     * @private
     */
    getStorageKey(query) {
        // Normalize query to consistent format
        const normalized = query.toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^\w-]/g, '')
        return `album_${normalized}`
    }
}

// Singleton instance
export const albumCache = new AlbumCache()
