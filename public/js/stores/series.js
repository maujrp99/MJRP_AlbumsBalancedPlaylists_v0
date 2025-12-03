/**
 * Series Store
 * Manages playlist series metadata and history
 */

export class SeriesStore {
    constructor() {
        this.series = []
        this.activeSeries = null
        this.loading = false
        this.error = null
        this.listeners = new Set()
        this.loadFromLocalStorage()
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
     * Set active series
     * @param {string} seriesId - Series ID to activate
     */
    setActiveSeries(seriesId) {
        this.activeSeries = this.series.find(s => s.id === seriesId) || null
        this.notify()
    }

    /**
     * Create new series
     * @param {Object} seriesData - Series metadata
     * @returns {Object} Created series
     */
    createSeries(seriesData) {
        const series = {
            id: seriesData.id || Date.now().toString(),
            name: seriesData.name,
            albumQueries: seriesData.albumQueries || [],
            createdAt: seriesData.createdAt || new Date(),
            updatedAt: seriesData.updatedAt || new Date(),
            status: seriesData.status || 'pending',
            notes: seriesData.notes || ''
        }

        this.series.unshift(series)
        this.activeSeries = series
        this.saveToLocalStorage()
        this.notify()

        return series
    }

    /**
     * Update existing series
     * @param {string} id - Series ID
     * @param {Object} updates - Fields to update
     */
    async updateSeries(id, updates) {
        const series = this.series.find(s => s.id === id)
        if (!series) {
            throw new Error('Series not found')
        }

        const updatedSeries = {
            ...series,
            ...updates,
            updatedAt: new Date()
        }

        // Update local state
        const index = this.series.indexOf(series)
        this.series[index] = updatedSeries

        if (this.activeSeries && this.activeSeries.id === id) {
            this.activeSeries = updatedSeries
        }

        this.saveToLocalStorage()
        this.notify()

        // Update Firestore
        // We pass the db instance if available, or rely on the view to call saveToFirestore
        // Ideally, the store should handle this if it had the db instance.
        // For now, we'll return the updated series so the view can save it if needed,
        // OR we can rely on the fact that saveToFirestore handles updates.
        return updatedSeries
    }

    /**
     * Delete series
     * @param {string} id - Series ID
     * @param {Object} db - Firestore instance (optional)
     */
    async deleteSeries(id, db) {
        const index = this.series.findIndex(s => s.id === id)
        if (index === -1) return

        // Remove from local state
        this.series.splice(index, 1)

        if (this.activeSeries && this.activeSeries.id === id) {
            this.activeSeries = null
        }

        this.saveToLocalStorage()
        this.notify()

        // Remove from Firestore
        if (db) {
            try {
                await db.collection('series').doc(id).delete()
                // Note: We do NOT delete the albums collection. 
                // Albums are preserved as requested.
            } catch (e) {
                console.error('Failed to delete series from Firestore:', e)
                throw e
            }
        }
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('mjrp_series', JSON.stringify(this.series))
        } catch (e) {
            console.error('Failed to save series to localStorage', e)
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
            console.error('Failed to load series from localStorage', e)
        }
    }

    /**
     * Load series from Firestore
     * @param {Object} db - Firestore database instance
     * @returns {Promise<Array>} Loaded series
     */
    async loadFromFirestore(db) {
        this.loading = true
        this.error = null
        this.notify()

        try {
            const snapshot = await db.collection('series')
                .orderBy('updatedAt', 'desc')
                .limit(20)
                .get()

            this.series = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate()
            }))

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
     * Save series to Firestore
     * @param {Object} db - Firestore database instance
     * @param {Object} series - Series to save
     * @returns {Promise<string>} Document ID
     */
    async saveToFirestore(db, series) {
        try {
            const data = {
                ...series,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }

            if (series.id) {
                await db.collection('series').doc(series.id).update(data)
                return series.id
            } else {
                const docRef = await db.collection('series').add({
                    ...data,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                })
                series.id = docRef.id
                return docRef.id
            }
        } catch (error) {
            this.error = error.message
            this.notify()
            throw error
        }
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
export const seriesStore = new SeriesStore()
