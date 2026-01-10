/**
 * AlbumSeries Store - PURE STATE CONTAINER
 * 
 * Only holds state and exposes simple setters/getters.
 * All CRUD logic delegated to SeriesService (Sprint 19).
 */

export class AlbumSeriesStore {
    constructor() {
        // Core state
        this.series = []
        this.activeSeries = null

        // Sync state
        this.loading = false
        this.error = null

        // Context
        this.userId = 'anonymous-user'
        this.db = null

        // Observer pattern
        this.listeners = new Set()
    }

    // ========== SIMPLE SETTERS ==========

    setSeries(series) {
        this.series = series
        this.notify()
    }

    addSeries(series) {
        this.series.unshift(series)
        this.notify()
    }

    updateSeriesById(id, updates) {
        const index = this.series.findIndex(s => s.id === id)
        if (index !== -1) {
            this.series[index] = { ...this.series[index], ...updates, updatedAt: new Date() }
            if (this.activeSeries?.id === id) {
                this.activeSeries = this.series[index]
            }
        }
        this.notify()
    }

    removeSeriesById(id) {
        this.series = this.series.filter(s => s.id !== id)
        if (this.activeSeries?.id === id) {
            this.activeSeries = null
        }
        this.notify()
    }

    setActiveSeries(seriesId) {
        this.activeSeries = seriesId ? this.series.find(s => s.id === seriesId) || null : null
        this.notify()
        return this.activeSeries
    }

    setLoading(loading) {
        this.loading = loading
        this.notify()
    }

    setError(error) {
        this.error = error
        this.notify()
    }

    setUserId(userId) {
        this.userId = userId || 'anonymous-user'
        this.notify()
    }

    setDb(db) {
        this.db = db
    }

    // ========== SIMPLE GETTERS ==========

    getSeries() {
        return this.series
    }

    getById(id) {
        return this.series.find(s => s.id === id)
    }

    getActiveSeries() {
        return this.activeSeries
    }

    getUserId() {
        return this.userId
    }

    getDb() {
        return this.db
    }

    // ========== OBSERVER PATTERN ==========

    subscribe(listener) {
        this.listeners.add(listener)
        return () => this.listeners.delete(listener)
    }

    notify() {
        this.listeners.forEach(listener => listener(this.getState()))
    }

    getState() {
        return {
            series: this.series,
            activeSeries: this.activeSeries,
            loading: this.loading,
            error: this.error
        }
    }

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
