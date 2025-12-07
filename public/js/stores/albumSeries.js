import { serverTimestamp, collection, doc, addDoc, updateDoc, getDocs, query, orderBy, limit } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js'

/**
 * AlbumSeriesStore
 * Manages album series metadata and history
 */

export class AlbumSeriesStore {
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
            const q = query(collection(db, 'series'), orderBy('updatedAt', 'desc'), limit(20))
            const snapshot = await getDocs(q)

            this.series = snapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data(),
                createdAt: docSnap.data().createdAt?.toDate(),
                updatedAt: docSnap.data().updatedAt?.toDate()
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
                updatedAt: serverTimestamp()
            }

            if (series.id) {
                await updateDoc(doc(db, 'series', series.id), data)
                return series.id
            } else {
                const docRef = await addDoc(collection(db, 'series'), {
                    ...data,
                    createdAt: serverTimestamp()
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
export const albumSeriesStore = new AlbumSeriesStore()
