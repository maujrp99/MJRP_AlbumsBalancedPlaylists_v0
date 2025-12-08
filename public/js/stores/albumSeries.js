/**
 * AlbumSeriesStore
 * Manages album series metadata and history
 * 
 * Refactored to use SeriesRepository for Firestore persistence
 * localStorage remains as fast-read cache
 */

import { SeriesRepository } from '../repositories/SeriesRepository.js'
import { cacheManager } from '../cache/CacheManager.js'

export class AlbumSeriesStore {
    constructor() {
        this.series = []
        this.activeSeries = null
        this.loading = false
        this.error = null
        this.listeners = new Set()
        this.userId = null
        this.repository = null
        this.db = null  // Will be set on init

        // Load from localStorage for instant access
        this.loadFromLocalStorage()
    }

    /**
     * Initialize repository with Firestore and user ID
     * Called after Firebase auth is ready
     * @param {Firestore} db - Firestore instance
     * @param {string} userId - Firebase auth user ID
     */
    init(db, userId) {
        this.db = db
        this.userId = userId || 'anonymous-user'
        this.repository = new SeriesRepository(db, cacheManager, this.userId)
        console.log('[AlbumSeriesStore] Initialized with userId:', this.userId)
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
        if (series) {
            this.activeSeries = series
            this.notify()
        }
        return series || null
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
