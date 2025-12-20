import { SeriesRepository } from '../repositories/SeriesRepository.js'
import { cacheManager } from '../cache/CacheManager.js'
import { userStore } from './UserStore.js'
import { dataSyncService } from '../services/DataSyncService.js'
import { globalProgress } from '../components/GlobalProgress.js'

export class AlbumSeriesStore {
    // ... constructor ...

    // ... (lines 14-138)

    /**
     * Create new series
     */
    async createSeries(seriesData) {
        if (!this.repository) {
            throw new Error('[AlbumSeriesStore] Repository not initialized. Call init() first.')
        }

        globalProgress.start()
        try {
            const series = {
                name: seriesData.name || 'Untitled Series',
                albumQueries: seriesData.albumQueries || [],
                createdAt: new Date(),
                updatedAt: new Date(),
                status: seriesData.status || 'pending',
                notes: seriesData.notes || ''
            }

            // 1. Save to Firestore (source of truth)
            const id = await this.repository.create(series)
            series.id = id

            // 2. Update memory
            this.series.unshift(series)
            this.activeSeries = series

            // 3. Update localStorage cache
            this.saveToLocalStorage()
            this.notify()

            return series
        } finally {
            globalProgress.finish()
        }
    }

    // ...

    /**
     * Load series from Firestore (source of truth)
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

            // Update localStorage cache
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
     * Update existing series
     */
    async updateSeries(id, updates) {
        if (!this.repository) {
            throw new Error('[AlbumSeriesStore] Repository not initialized. Call init() first.')
        }

        const index = this.series.findIndex(s => s.id === id)
        if (index === -1) throw new Error('Series not found')

        globalProgress.start()
        try {
            // 1. Update in Firestore FIRST (source of truth)
            await this.repository.update(id, updates)

            // 2. Update memory
            const updatedSeries = {
                ...this.series[index],
                ...updates,
                updatedAt: new Date()
            }
            this.series[index] = updatedSeries

            if (this.activeSeries && this.activeSeries.id === id) {
                this.activeSeries = updatedSeries
            }

            // 3. Update localStorage cache
            this.saveToLocalStorage()
            this.notify()

            return updatedSeries
        } finally {
            globalProgress.finish()
        }
    }

    // ... (lines 272-342)

    /**
     * Delete series
     */
    async deleteSeries(id) {
        if (!this.repository) {
            throw new Error('[AlbumSeriesStore] Repository not initialized. Call init() first.')
        }

        const index = this.series.findIndex(s => s.id === id)
        if (index === -1) throw new Error('Series not found')

        globalProgress.start()
        try {
            // 1. Delete from Firestore FIRST (source of truth)
            await this.repository.delete(id)

            // 2. Update memory
            this.series.splice(index, 1)

            if (this.activeSeries && this.activeSeries.id === id) {
                this.activeSeries = null
            }

            // 3. Update localStorage cache
            this.saveToLocalStorage()
            this.notify()
        } finally {
            globalProgress.finish()
        }
    }
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
     * Create new series
     * @param {Object} seriesData - Series data (name, albumQueries, etc.)
     * @returns {Promise<Object>} Created series
     */
    async createSeries(seriesData) {
        if (!this.repository) {
            throw new Error('[AlbumSeriesStore] Repository not initialized. Call init() first.')
        }

        const series = {
            name: seriesData.name || 'Untitled Series',
            albumQueries: seriesData.albumQueries || [],
            createdAt: new Date(),
            updatedAt: new Date(),
            status: seriesData.status || 'pending',
            notes: seriesData.notes || ''
        }

        // 1. Save to Firestore (source of truth)
        const id = await this.repository.create(series)
        series.id = id

        // 2. Update memory
        this.series.unshift(series)
        this.activeSeries = series

        // 3. Update localStorage cache
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

            // Update localStorage cache
            this.saveToLocalStorage()
            this.notify()
            return this.series
        } catch (error) {
            this.error = error.message
            this.notify()
            throw error
        } finally {
            this.loading = false
            this.notify()
        }
    }

    /**
     * Update existing series
     * @param {string} id - Series ID to update
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated series
     */
    async updateSeries(id, updates) {
        if (!this.repository) {
            throw new Error('[AlbumSeriesStore] Repository not initialized. Call init() first.')
        }

        const index = this.series.findIndex(s => s.id === id)
        if (index === -1) throw new Error('Series not found')

        // 1. Update in Firestore FIRST (source of truth)
        await this.repository.update(id, updates)

        // 2. Update memory
        const updatedSeries = {
            ...this.series[index],
            ...updates,
            updatedAt: new Date()
        }
        this.series[index] = updatedSeries

        if (this.activeSeries && this.activeSeries.id === id) {
            this.activeSeries = updatedSeries
        }

        // 3. Update localStorage cache
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
        let targetSeries = this.activeSeries

        // Fallback 1: Use provided seriesId if activeSeries is missing
        if (!targetSeries && seriesId) {
            targetSeries = this.series.find(s => s.id === seriesId)
        }

        // Fallback 2 (Global Search): If still no target, search ALL series for this album query
        if (!targetSeries) {
            console.log('[AlbumSeriesStore] No context series. Searching all series for album:', album.title)
            // We need to find which series has a query matching this album
            const norm = str => str?.toLowerCase().trim() || ''

            targetSeries = this.series.find(s => {
                return (s.albumQueries || []).some(query => {
                    const q = norm(query)
                    const t = norm(album.title)
                    const a = norm(album.artist)
                    return q.includes(t) || (q.includes(a) && q.includes(t))
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
        const queryToRemove = albumQueries.find(query => {
            const queryLower = query.toLowerCase()
            const titleLower = album.title?.toLowerCase() || ''
            const artistLower = album.artist?.toLowerCase() || ''

            // Match if query contains both artist and title, or just title
            return queryLower.includes(titleLower) ||
                (queryLower.includes(artistLower) && queryLower.includes(titleLower))
        })

        if (!queryToRemove) {
            console.error('[AlbumSeriesStore] Could not find matching query for:', album.title)
            throw new Error('Could not find album query in series')
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
     * Delete series
     * @param {string} id - Series ID to delete
     * @returns {Promise<void>}
     */
    async deleteSeries(id) {
        if (!this.repository) {
            throw new Error('[AlbumSeriesStore] Repository not initialized. Call init() first.')
        }

        const index = this.series.findIndex(s => s.id === id)
        if (index === -1) throw new Error('Series not found')

        // 1. Delete from Firestore FIRST (source of truth)
        await this.repository.delete(id)

        // 2. Update memory
        this.series.splice(index, 1)

        if (this.activeSeries && this.activeSeries.id === id) {
            this.activeSeries = null
        }

        // 3. Update localStorage cache
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
