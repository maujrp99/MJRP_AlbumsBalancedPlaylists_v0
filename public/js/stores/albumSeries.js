import { SeriesRepository } from '../repositories/SeriesRepository.js'
import { cacheManager } from '../cache/CacheManager.js'
import { userStore } from './UserStore.js'
import { dataSyncService } from '../services/DataSyncService.js'
import { globalProgress } from '../components/GlobalProgress.js'
import { getSeriesService } from '../services/SeriesService.js'

export class AlbumSeriesStore {
    constructor() {
        this.series = []
        this.activeSeries = null
        this.loading = false
        this.error = null
        this.listeners = new Set()
        this.userId = 'anonymous-user'
        this.repository = null
        this.db = null  // Will be set on init

        // Load from localStorage for instant access
        this.loadFromLocalStorage()

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
            console.log(`[AlbumSeriesStore] Switching user context: ${this.userId} -> ${newUserId}`)

            // Capture data relative to previous user context (if it was anonymous)
            let seriesToMigrate = []
            if (this.userId === 'anonymous-user' && this.series.length > 0 && newUserId !== 'anonymous-user') {
                seriesToMigrate = [...this.series]
                console.log(`[AlbumSeriesStore] Found ${seriesToMigrate.length} guest series to migrate.`)
            }

            this.userId = newUserId

            // Re-initialize repository if db is available
            if (this.db) {
                this.repository = new SeriesRepository(this.db, cacheManager, this.userId)

                // Perform migration if needed
                if (seriesToMigrate.length > 0) {
                    try {
                        const count = await dataSyncService.migrateSeries(this.repository, seriesToMigrate)
                        if (count > 0) console.log(`[AlbumSeriesStore] Migrated ${count} series.`)
                        await this.loadFromFirestore()
                    } catch (err) {
                        console.error('[AlbumSeriesStore] Migration failed', err)
                    }
                } else {
                    // Reload series for new context
                    await this.loadFromFirestore().catch(err => console.error('Failed to reload series on user switch:', err))
                }
            }
        }
    }

    /**
     * Initialize repository with Firestore and user ID
     * Called after Firebase auth is ready
     * @param {Firestore} db - Firestore instance
     * @param {string} userId - Firebase auth user ID (optional, overridden by UserStore)
     */
    init(db, userId) {
        this.db = db
        // If userId provided explicitly (legacy), use it, otherwise rely on UserStore default or current state
        if (userId) {
            this.userId = userId
        }

        if (!this.repository) {
            this.repository = new SeriesRepository(db, cacheManager, this.userId)
            console.log('[AlbumSeriesStore] Initialized with userId:', this.userId)
        }
    }

    /**
     * Set user ID (legacy compatibility - use init() instead)
     * @param {string} userId - Firebase auth user ID
     */
    setUserId(userId) {
        this.userId = userId || 'anonymous-user'
        // Re-initialize repository if db is available
        if (this.db) {
            this.repository = new SeriesRepository(this.db, cacheManager, this.userId)
        }
    }

    /**
     * Get all series
     * @returns {Array} Series list
     */
    getSeries() {
        return this.series
    }

    /**
     * Get series by ID
     * @param {string} id - Series ID
     * @returns {Object|undefined} Series object
     */
    getById(id) {
        return this.series.find(s => s.id === id)
    }

    /**
     * Get active series
     * @returns {Object|null} Active series or null
     */
    getActiveSeries() {
        return this.activeSeries
    }

    /**
     * Set active series by ID
     * @param {string} seriesId - Series ID to activate
     * @returns {Object|null} Activated series or null if not found
     */
    setActiveSeries(seriesId) {
        const series = this.series.find(s => s.id === seriesId)
        // Set to series if found, or null if not (deselect)
        this.activeSeries = series || null
        this.notify()
        return this.activeSeries
    }

    /**
     * Create new series via SeriesService
     * @param {Object} seriesData - Series data (name, albumQueries, etc.)
     * @returns {Promise<Object>} Created series
     */
    async createSeries(seriesData) {
        if (!this.db) {
            throw new Error('[AlbumSeriesStore] Repository not initialized. Call init() first.')
        }

        const service = getSeriesService(this.db, cacheManager, this.userId)
        const series = await service.createSeries(seriesData)

        // Update memory
        this.series.unshift(series)
        this.activeSeries = series
        this.saveToLocalStorage()
        this.notify()

        return series
    }

    // ========== PERSISTENCE ==========

    saveToLocalStorage() {
        try {
            const serialized = JSON.parse(JSON.stringify(this.series))
            localStorage.setItem('mjrp_series', JSON.stringify(serialized))
        } catch (e) {
            console.error('[AlbumSeriesStore] Failed to save to localStorage', e)
        }
    }

    loadFromLocalStorage() {
        try {
            const data = localStorage.getItem('mjrp_series')
            if (data) {
                this.series = JSON.parse(data)
                // Restore dates
                this.series.forEach(s => {
                    s.createdAt = new Date(s.createdAt)
                    s.updatedAt = new Date(s.updatedAt)
                })
                this.notify()
            }
        } catch (e) {
            console.error('[AlbumSeriesStore] Failed to load from localStorage', e)
        }
    }

    /**
     * Load series from Firestore (source of truth)
     * @returns {Promise<Array>} Loaded series
     */
    async loadFromFirestore() {
        if (!this.repository) {
            throw new Error('[AlbumSeriesStore] Repository not initialized. Call init() first.')
        }

        this.loading = true
        this.error = null
        this.notify()
        globalProgress.start()

        try {
            // Use repository to fetch all series
            const firestoreSeries = await this.repository.findAll({
                orderBy: ['updatedAt', 'desc'],
                limit: 20
            })

            this.series = firestoreSeries.map(s => ({
                ...s,
                createdAt: s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt),
                updatedAt: s.updatedAt?.toDate ? s.updatedAt.toDate() : new Date(s.updatedAt)
            }))

            this.saveToLocalStorage()
            this.notify()
            return this.series
        } catch (error) {
            this.error = error.message
            this.notify()
            throw error
        } finally {
            this.loading = false
            globalProgress.finish()
            this.notify()
        }
    }

    /**
     * Update existing series via SeriesService
     * @param {string} id - Series ID to update
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated series
     */
    async updateSeries(id, updates) {
        if (!this.db) {
            throw new Error('[AlbumSeriesStore] Repository not initialized. Call init() first.')
        }

        const index = this.series.findIndex(s => s.id === id)
        if (index === -1) throw new Error('Series not found')

        const service = getSeriesService(this.db, cacheManager, this.userId)
        await service.updateSeries(id, updates)

        // Update memory
        const updatedSeries = {
            ...this.series[index],
            ...updates,
            updatedAt: new Date()
        }
        this.series[index] = updatedSeries

        if (this.activeSeries && this.activeSeries.id === id) {
            this.activeSeries = updatedSeries
        }

        this.saveToLocalStorage()
        this.notify()

        return updatedSeries
    }

    /**
     * Remove an album from the active series
     * Finds the matching query in albumQueries and removes it
     * @param {Object} album - Album object with title and artist
     * @returns {Promise<Object>} Updated series
     */
    async removeAlbumFromSeries(album, seriesId = null) {
        let targetSeries = null;

        // 1. Prioritize explicit seriesId (Correct Context)
        if (seriesId) {
            targetSeries = this.series.find(s => s.id === seriesId)
        }

        // 2. Fallback to activeSeries if no explicit context
        if (!targetSeries && this.activeSeries) {
            targetSeries = this.activeSeries
        }

        // 3. Global Search (Last Resort)
        if (!targetSeries) {
            console.log('[AlbumSeriesStore] No context series. Searching all series for album:', album.title)
            // We need to find which series has a query matching this album
            const norm = str => str?.toLowerCase().trim() || ''

            targetSeries = this.series.find(s => {
                return (s.albumQueries || []).some(query => {
                    // Object Query Support (New)
                    if (typeof query === 'object' && query !== null) {
                        const titleMatch = query.title === album.title
                        const artistMatch = !query.artist || query.artist === album.artist
                        const idMatch = (query.id && query.id === album.id)
                        return idMatch || (titleMatch && artistMatch)
                    }

                    // String Query Support (Legacy)
                    if (typeof query !== 'string') return false;

                    // Robust normalization for legacy string matching
                    const q = norm(query)
                    const title = norm(album.title)
                    const artist = norm(album.artist)

                    // Exact match attempt first
                    if (q === title) return true
                    if (q === `${artist} - ${title}`) return true
                    if (q === `${artist} ${title}`) return true

                    // Loose match
                    return q.includes(title) || (q.includes(artist) && q.includes(title))
                })
            })
        }

        if (!targetSeries) {
            // If still no series found, it means the album probably isn't linked to a query 
            // (or query format mismatch). This effectively means "Series no longer exists" or "Not in any series".
            console.error('[AlbumSeriesStore] Could not find any series containing album:', album.title)
            throw new Error('Could not find which series this album belongs to.')
        }

        const albumQueries = targetSeries.albumQueries || []

        // Find the query that matches this album
        // Query format is typically "Artist Album Title" or just "Album Title"
        // Now supports Object Queries
        let queryToRemove = albumQueries.find(query => {
            // Object Query Support (New)
            if (typeof query === 'object' && query !== null) {
                const titleMatch = query.title === album.title
                const artistMatch = !query.artist || query.artist === album.artist
                const idMatch = (query.id && query.id === album.id)
                return idMatch || (titleMatch && artistMatch)
            }

            if (typeof query !== 'string') return false;

            // Improved Normalization for robust matching
            const norm = str => str?.toLowerCase().replace(/[^\w\s]/g, '').trim() || ''

            const q = typeof query === 'string' ? query : (query.title || '')
            const qNorm = norm(q)
            const titleNorm = norm(album.title)
            const artistNorm = norm(album.artist)

            // 1. Check ID (High confidence)
            if (typeof query === 'object' && query.id && query.id === album.id) return true

            // 2. Check Exact Title Match (Medium confidence)
            if (qNorm === titleNorm) return true

            // 3. Check "Artist - Title" format (Common legacy)
            const compositeNorm = norm(`${album.artist} - ${album.title}`)
            const compositeNorm2 = norm(`${album.artist} ${album.title}`)
            if (qNorm === compositeNorm) return true
            if (qNorm === compositeNorm2) return true

            // 4. Fallback: Contains title AND artist (Loose)
            // Only if query is long enough to avoid false positives on common words
            if (qNorm.length > 5 && qNorm.includes(titleNorm) && qNorm.includes(artistNorm)) return true

            return false
        })

        if (!queryToRemove) {
            console.warn('[AlbumSeriesStore] Robust match failed. Falling back to manual selection or loose heuristic.')

            // 5. Fallback: Ultra-loose match (any token match?) - Dangerous, might delete wrong thing.
            // Better: Find ALL queries that *could* be candidates and ask user?
            // Since we are in a Store, we can't easily pop UI unless we import DialogService.

            // Let's try one more heuristic: Substring match of ANY word > 4 chars
            queryToRemove = albumQueries.find(query => {
                const q = typeof query === 'string' ? query : (query.title || '')
                const qNorm = str => str?.toLowerCase().replace(/[^\w\s]/g, '').trim() || ''
                const qN = qNorm(q)
                const titleN = qNorm(album.title)

                // If the query contains the title or vice versa
                if (qN.includes(titleN) || titleN.includes(qN)) return true

                return false
            })
        }

        if (!queryToRemove) {
            console.error('[AlbumSeriesStore] Could not find matching query for:', album.title)
            console.log('Available Queries:', albumQueries)
            throw new Error(`Could not find album query in series. Expected similar to "${album.title}". See console for available queries.`)
        }

        // Remove the query from the array
        const updatedQueries = albumQueries.filter(q => q !== queryToRemove)

        // Update the series with new albumQueries
        console.log(`[AlbumSeriesStore] Removing "${album.title}" from series "${targetSeries.name}"`)
        return this.updateSeries(targetSeries.id, {
            albumQueries: updatedQueries
        })
    }

    /**
     * Delete series via SeriesService
     * @param {string} id - Series ID to delete
     * @returns {Promise<void>}
     */
    async deleteSeries(id) {
        if (!this.db) {
            throw new Error('[AlbumSeriesStore] Repository not initialized. Call init() first.')
        }

        const index = this.series.findIndex(s => s.id === id)
        if (index === -1) throw new Error('Series not found')

        const service = getSeriesService(this.db, cacheManager, this.userId)
        await service.deleteSeries(id)

        // Update memory
        this.series.splice(index, 1)

        if (this.activeSeries && this.activeSeries.id === id) {
            this.activeSeries = null
        }

        this.saveToLocalStorage()
        this.notify()
    }

    /**
     * Subscribe to store changes
     * @param {Function} listener - Callback fired on state change
     * @returns {Function} Unsubscribe function
     */
    subscribe(listener) {
        this.listeners.add(listener)
        return () => this.listeners.delete(listener)
    }

    /**
     * Notify all listeners of state change
     * @private
     */
    notify() {
        this.listeners.forEach(listener => listener(this.getState()))
    }

    /**
     * Get complete state snapshot
     * @returns {Object} Current state
     */
    getState() {
        return {
            series: this.series,
            activeSeries: this.activeSeries,
            loading: this.loading,
            error: this.error
        }
    }

    /**
     * Reset store to initial state
     */
    reset() {
        this.series = []
        this.activeSeries = null
        this.loading = false
        this.error = null
        this.notify()
    }
}

// Singleton instance
export const albumSeriesStore = new AlbumSeriesStore()
