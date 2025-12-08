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
        this.userId = null // Will be set when user authenticates
        this.loadFromLocalStorage()
    }

    /**
     * Set user ID for Firestore operations
     * @param {string} userId - Firebase auth user ID
     */
    setUserId(userId) {
        this.userId = userId || 'anonymous-user'
    }

    /**
     * Build Firestore collection path matching security rules
     * Path: artifacts/mjrp-albums/users/{userId}/curator/series
     * @param {Object} db - Firestore instance
     * @returns {string} Collection path
     */
    getSeriesCollectionPath(db) {
        const appId = 'mjrp-albums'
        const userId = this.userId || 'anonymous-user'
        return `artifacts/${appId}/users/${userId}/curator/series`
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
            const collectionPath = this.getSeriesCollectionPath(db)
            const q = query(collection(db, collectionPath), orderBy('updatedAt', 'desc'), limit(20))
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
     * Update existing series
     * @param {string} id - Series ID to update
     * @param {Object} updates - Fields to update
     * @param {Object} db - Firestore instance (REQUIRED for persistence)
     * @returns {Promise<Object>} Updated series
     */
    async updateSeries(id, updates, db) {
        if (!db) {
            throw new Error('[AlbumSeriesStore] Firestore db is required - it is the source of truth')
        }

        const index = this.series.findIndex(s => s.id === id)
        if (index === -1) throw new Error('Series not found')

        const updatedSeries = {
            ...this.series[index],
            ...updates,
            updatedAt: new Date()
        }

        // 1. Update in-memory state (optimistic)
        this.series[index] = updatedSeries

        if (this.activeSeries && this.activeSeries.id === id) {
            this.activeSeries = updatedSeries
        }

        // 2. Update localStorage (optimistic cache)
        this.saveToLocalStorage()
        this.notify()

        // 3. Save to Firestore (SOURCE OF TRUTH)
        // If this fails, we throw - operation is not complete
        try {
            await this.saveToFirestore(db, updatedSeries)
        } catch (error) {
            // Firestore failed - revert optimistic updates
            console.error('[AlbumSeriesStore] Firestore save failed, reverting:', error)

            // Reload from localStorage to revert
            this.loadFromLocalStorage()
            this.notify()

            throw error  // Re-throw so View knows it failed
        }

        return updatedSeries
    }

    /**
     * Delete series
     * @param {string} id - Series ID to delete
     * @param {Object} db - Firestore database instance (REQUIRED - source of truth)
     */
    async deleteSeries(id, db) {
        if (!db) {
            throw new Error('[AlbumSeriesStore] Firestore db is required for delete - it is the source of truth')
        }

        const index = this.series.findIndex(s => s.id === id)
        if (index === -1) throw new Error('Series not found')

        // 1. Delete from Firestore FIRST (source of truth)
        // If this fails, we don't modify local state
        const collectionPath = this.getSeriesCollectionPath(db)
        await deleteDoc(doc(db, collectionPath, id))

        // 2. THEN update local state (only after Firestore succeeds)
        this.series.splice(index, 1)

        if (this.activeSeries && this.activeSeries.id === id) {
            this.activeSeries = null
        }

        this.saveToLocalStorage()
        this.notify()
    }

    /**
     * Save series to Firestore
     * @param {Object} db - Firestore database instance
     * @param {Object} series - Series to save
     * @returns {Promise<string>} Document ID
     */
    async saveToFirestore(db, series) {
        try {
            const collectionPath = this.getSeriesCollectionPath(db)
            // Deep serialize: removes undefined values and converts ES6 classes to POJOs
            // Required per Issue #26 in DEBUG_LOG.md
            const serialized = JSON.parse(JSON.stringify(series))
            const data = {
                ...serialized,
                updatedAt: serverTimestamp()
            }

            if (series.id) {
                await updateDoc(doc(db, collectionPath, series.id), data)
                return series.id
            } else {
                const docRef = await addDoc(collection(db, collectionPath), {
                    ...serialized,
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
