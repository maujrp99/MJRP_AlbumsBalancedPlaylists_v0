/**
 * Migration Utility
 * Migrates data from localStorage to Firestore
 */

import { SeriesRepository } from '../repositories/SeriesRepository.js'
import { AlbumRepository } from '../repositories/AlbumRepository.js'
import { PlaylistRepository } from '../repositories/PlaylistRepository.js'

export class MigrationUtility {
    constructor(firestore, cache) {
        this.firestore = firestore
        this.cache = cache
        this.migrationKey = 'mjrp_migration_status'
    }

    /**
     * Check if migration has already been completed
     * @returns {boolean}
     */
    isMigrationComplete() {
        const status = localStorage.getItem(this.migrationKey)
        return status === 'complete'
    }

    /**
     * Mark migration as complete
     */
    markMigrationComplete() {
        localStorage.setItem(this.migrationKey, 'complete')
    }

    /**
     * Detect if localStorage has data to migrate
     * @returns {boolean}
     */
    hasLocalStorageData() {
        // Check for old cache keys
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && (
                key.startsWith('album_') ||
                key.startsWith('series_') ||
                key.startsWith('playlist_') ||
                key === 'albumCache' ||
                key === 'seriesCache'
            )) {
                return true
            }
        }
        return false
    }

    /**
     * Load all series from localStorage
     * @returns {Array} Array of series objects
     */
    loadSeriesFromLocalStorage() {
        const series = []

        try {
            // Try to find series cache
            const seriesCache = localStorage.getItem('seriesCache')
            if (seriesCache) {
                const parsed = JSON.parse(seriesCache)
                if (Array.isArray(parsed)) {
                    series.push(...parsed)
                } else if (parsed && typeof parsed === 'object') {
                    // Might be a map/object
                    Object.values(parsed).forEach(s => {
                        if (s && s.name) {
                            series.push(s)
                        }
                    })
                }
            }

            // Also check for individual series_ keys
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i)
                if (key && key.startsWith('series_')) {
                    try {
                        const data = JSON.parse(localStorage.getItem(key))
                        if (data && data.name) {
                            series.push(data)
                        }
                    } catch (e) {
                        console.warn(`Failed to parse ${key}:`, e)
                    }
                }
            }
        } catch (error) {
            console.error('Error loading series from localStorage:', error)
        }

        return series
    }

    /**
     * Load all albums from localStorage
     * @returns {Array} Array of album objects
     */
    loadAlbumsFromLocalStorage() {
        const albums = []

        try {
            // Try album cache
            const albumCache = localStorage.getItem('albumCache')
            if (albumCache) {
                const parsed = JSON.parse(albumCache)
                if (Array.isArray(parsed)) {
                    albums.push(...parsed)
                } else if (parsed && typeof parsed === 'object') {
                    Object.values(parsed).forEach(a => {
                        if (a && a.title && a.artist) {
                            albums.push(a)
                        }
                    })
                }
            }

            // Individual album_ keys
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i)
                if (key && key.startsWith('album_')) {
                    try {
                        const data = JSON.parse(localStorage.getItem(key))
                        if (data && data.title && data.artist) {
                            albums.push(data)
                        }
                    } catch (e) {
                        console.warn(`Failed to parse ${key}:`, e)
                    }
                }
            }
        } catch (error) {
            console.error('Error loading albums from localStorage:', error)
        }

        return albums
    }

    /**
     * Migrate all data from localStorage to Firestore
     * @param {string} userId - User ID for scoping
     * @param {Function} onProgress - Progress callback (current, total, message)
     * @returns {Promise<Object>} Migration result
     */
    async migrate(userId = 'anonymous-user', onProgress) {
        const result = {
            success: false,
            seriesMigrated: 0,
            albumsMigrated: 0,
            playlistsMigrated: 0,
            errors: []
        }

        try {
            onProgress?.(0, 100, 'Loading data from localStorage...')

            // Load data
            const series = this.loadSeriesFromLocalStorage()
            const albums = this.loadAlbumsFromLocalStorage()

            const totalSteps = series.length + albums.length
            let currentStep = 0

            onProgress?.(10, 100, `Found ${series.length} series and ${albums.length} albums`)

            // Migrate series
            const seriesRepo = new SeriesRepository(this.firestore, this.cache, userId)

            for (const s of series) {
                try {
                    // Add schema version
                    s._schemaVersion = 1
                    s._migratedFrom = 'localStorage'
                    s._migrationDate = new Date()

                    await seriesRepo.create(s)
                    result.seriesMigrated++

                    currentStep++
                    const progress = 10 + (currentStep / totalSteps) * 70
                    onProgress?.(progress, 100, `Migrated series: ${s.name}`)
                } catch (error) {
                    console.error(`Failed to migrate series ${s.name}:`, error)
                    result.errors.push({ type: 'series', name: s.name, error: error.message })
                }
            }

            // Migrate albums
            // Group albums by series (if they have seriesId)
            const albumsBySeries = new Map()
            albums.forEach(album => {
                const seriesId = album.seriesId || album.metadata?.seriesId || 'default'
                if (!albumsBySeries.has(seriesId)) {
                    albumsBySeries.set(seriesId, [])
                }
                albumsBySeries.get(seriesId).push(album)
            })

            for (const [seriesId, seriesAlbums] of albumsBySeries) {
                const albumRepo = new AlbumRepository(this.firestore, this.cache, userId, seriesId)

                for (const album of seriesAlbums) {
                    try {
                        album._schemaVersion = 2
                        album._migratedFrom = 'localStorage'
                        album._migrationDate = new Date()

                        await albumRepo.create(album)
                        result.albumsMigrated++

                        currentStep++
                        const progress = 10 + (currentStep / totalSteps) * 70
                        onProgress?.(progress, 100, `Migrated album: ${album.title}`)
                    } catch (error) {
                        console.error(`Failed to migrate album ${album.title}:`, error)
                        result.errors.push({ type: 'album', name: album.title, error: error.message })
                    }
                }
            }

            onProgress?.(90, 100, 'Finalizing migration...')

            // Mark migration complete
            this.markMigrationComplete()
            result.success = true

            onProgress?.(100, 100, 'Migration complete!')

        } catch (error) {
            console.error('Migration failed:', error)
            result.errors.push({ type: 'general', error: error.message })
        }

        return result
    }

    /**
     * Clear localStorage after successful migration
     * WARNING: This is irreversible!
     */
    clearLocalStorage() {
        const keysToRemove = []

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && (
                key.startsWith('album_') ||
                key.startsWith('series_') ||
                key.startsWith('playlist_') ||
                key === 'albumCache' ||
                key === 'seriesCache'
            )) {
                keysToRemove.push(key)
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key))

        console.log(`Cleared ${keysToRemove.length} localStorage keys`)
    }

    /**
     * Create rollback backup before migration
     * @returns {string} Backup data as JSON string
     */
    createBackup() {
        const backup = {
            timestamp: new Date().toISOString(),
            series: this.loadSeriesFromLocalStorage(),
            albums: this.loadAlbumsFromLocalStorage()
        }

        const backupJson = JSON.stringify(backup)

        // Save to localStorage with timestamp
        localStorage.setItem(`migration_backup_${Date.now()}`, backupJson)

        return backupJson
    }
}
