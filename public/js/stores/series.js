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
            id: Date.now().toString(), // Temporary ID
            name: seriesData.name,
            albumQueries: seriesData.albumQueries || [],
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'pending',
            notes: seriesData.notes || ''
        }

        this.series.unshift(series)
        this.activeSeries = series
        this.notify()

        return series
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
