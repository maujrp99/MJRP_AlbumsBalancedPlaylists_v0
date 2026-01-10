/**
 * SeriesService.js
 * 
 * Service layer for Album Series operations (CRUD, album management, enrichment).
 * Extracted from AlbumSeriesStore to achieve separation of concerns.
 * 
 * @module services/SeriesService
 */

import { SeriesRepository } from '../repositories/SeriesRepository.js'
import { globalProgress } from '../components/GlobalProgress.js'

export class SeriesService {
    /**
     * @param {Object} db - Firestore instance
     * @param {Object} cacheManager - Cache manager instance
     * @param {string} userId - Current user ID
     */
    constructor(db, cacheManager, userId) {
        this.db = db
        this.cacheManager = cacheManager
        this.userId = userId || 'anonymous-user'
        this.repository = new SeriesRepository(db, cacheManager, this.userId)
    }

    /**
     * Update user ID context (e.g., after login)
     * @param {string} userId - New user ID
     */
    setUserId(userId) {
        this.userId = userId || 'anonymous-user'
        this.repository = new SeriesRepository(this.db, this.cacheManager, this.userId)
    }

    // ========== CRUD ==========

    /**
     * Create a new series
     * @param {Object} seriesData - Series data (name, albumQueries, etc.)
     * @returns {Promise<Object>} Created series with ID
     */
    async createSeries(seriesData) {
        const series = {
            name: seriesData.name || 'Untitled Series',
            albumQueries: seriesData.albumQueries || [],
            createdAt: new Date(),
            updatedAt: new Date(),
            status: seriesData.status || 'pending',
            notes: seriesData.notes || ''
        }

        globalProgress.start()
        try {
            const id = await this.repository.create(series)
            return { ...series, id }
        } finally {
            globalProgress.finish()
        }
    }

    /**
     * Update an existing series
     * @param {string} id - Series ID to update
     * @param {Object} updates - Fields to update
     * @returns {Promise<void>}
     */
    async updateSeries(id, updates) {
        globalProgress.start()
        try {
            await this.repository.update(id, {
                ...updates,
                updatedAt: new Date()
            })
        } finally {
            globalProgress.finish()
        }
    }

    /**
     * Delete a series
     * @param {string} id - Series ID to delete
     * @returns {Promise<void>}
     */
    async deleteSeries(id) {
        globalProgress.start()
        try {
            await this.repository.delete(id)
        } finally {
            globalProgress.finish()
        }
    }

    /**
     * Load all series for the current user
     * @param {Object} options - Query options (orderBy, limit)
     * @returns {Promise<Array>} Series list
     */
    async loadAllSeries(options = {}) {
        globalProgress.start()
        try {
            const firestoreSeries = await this.repository.findAll({
                orderBy: options.orderBy || ['updatedAt', 'desc'],
                limit: options.limit || 20
            })

            return firestoreSeries.map(s => ({
                ...s,
                createdAt: s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt),
                updatedAt: s.updatedAt?.toDate ? s.updatedAt.toDate() : new Date(s.updatedAt)
            }))
        } finally {
            globalProgress.finish()
        }
    }

    // ========== ALBUM MANAGEMENT ==========

    /**
     * Add an album to a series
     * @param {string} seriesId - Target series ID
     * @param {Object} album - Album object with title, artist
     * @returns {Promise<void>}
     */
    async addAlbumToSeries(seriesId, album) {
        // Fetch current series
        const series = await this.repository.findById(seriesId)
        if (!series) throw new Error('Series not found')

        const albumQueries = series.albumQueries || []

        // Add as object query (new format)
        const newQuery = {
            id: album.id || null,
            title: album.title,
            artist: album.artist
        }

        // Avoid duplicates
        const exists = albumQueries.some(q =>
            (typeof q === 'object' && q.title === album.title && q.artist === album.artist) ||
            (typeof q === 'string' && q.toLowerCase().includes(album.title.toLowerCase()))
        )

        if (!exists) {
            albumQueries.push(newQuery)
            await this.updateSeries(seriesId, { albumQueries })
        }
    }

    /**
     * Remove an album from a series
     * @param {string} seriesId - Target series ID
     * @param {Object} album - Album object with title, artist
     * @returns {Promise<void>}
     */
    async removeAlbumFromSeries(seriesId, album) {
        const series = await this.repository.findById(seriesId)
        if (!series) throw new Error('Series not found')

        const albumQueries = series.albumQueries || []
        const norm = str => str?.toLowerCase().trim() || ''

        // Find matching query
        const matchIndex = albumQueries.findIndex(query => {
            // Object query
            if (typeof query === 'object' && query !== null) {
                const titleMatch = query.title === album.title
                const artistMatch = !query.artist || query.artist === album.artist
                const idMatch = query.id && query.id === album.id
                return idMatch || (titleMatch && artistMatch)
            }

            // String query (legacy)
            if (typeof query === 'string') {
                const q = norm(query)
                const title = norm(album.title)
                const artist = norm(album.artist)

                if (q === title) return true
                if (q === `${artist} - ${title}`) return true
                if (q === `${artist} ${title}`) return true
                if (q.includes(title) && q.includes(artist)) return true
            }

            return false
        })

        if (matchIndex === -1) {
            throw new Error(`Could not find album query in series. Album: "${album.title}"`)
        }

        albumQueries.splice(matchIndex, 1)
        await this.updateSeries(seriesId, { albumQueries })
        console.log(`[SeriesService] Removed "${album.title}" from series "${series.name}"`)
    }

    // ========== ENRICHMENT ORCHESTRATION ==========

    /**
     * Enrich all albums in a series (stub - delegates to enrichment service)
     * @param {string} seriesId - Series ID
     * @param {Function} onProgress - Progress callback
     * @returns {Promise<void>}
     */
    async enrichAllAlbums(seriesId, onProgress) {
        // TODO: Wire to SpotifyEnrichmentService or RankingEnrichmentService
        console.log(`[SeriesService] enrichAllAlbums called for series ${seriesId}`)
        // This is a stub - actual enrichment happens via dedicated enrichment services
        if (onProgress) onProgress({ current: 0, total: 0, status: 'pending' })
    }
}

// Singleton factory (lazy initialization)
let _instance = null

/**
 * Get or create SeriesService singleton
 * @param {Object} db - Firestore instance
 * @param {Object} cacheManager - Cache manager
 * @param {string} userId - User ID
 * @returns {SeriesService}
 */
export function getSeriesService(db, cacheManager, userId) {
    if (!_instance && db) {
        _instance = new SeriesService(db, cacheManager, userId)
    } else if (_instance && userId && _instance.userId !== userId) {
        _instance.setUserId(userId)
    }
    return _instance
}
