/**
 * SeriesService.js
 * 
 * Service layer for ALL album series operations:
 * - CRUD (create, update, delete series)
 * - Album management (add, remove albums)
 * - Enrichment orchestration
 * - LocalStorage persistence
 * - User context management
 * 
 * Extracted from AlbumSeriesStore (Sprint 19).
 */

import { SeriesRepository } from '../repositories/SeriesRepository.js'
import { globalProgress } from '../components/GlobalProgress.js'
import { albumSeriesStore } from '../stores/albumSeries.js'
import { albumsStore } from '../stores/albums.js' // FIX #156: For cache invalidation
import { cacheManager } from '../cache/CacheManager.js'
import { StorageService } from './infra/StorageService.js'
import { UserSyncService } from './auth/UserSyncService.js'
import { apiClient } from '../api/client.js' // Fix #156: Needed for enrichment

const STORAGE_KEY = 'series' // prefix will be added

export class SeriesService {
    constructor(db, userId, storageService, userSyncService) {
        this.db = db
        this.userId = userId || 'anonymous-user'
        this.repository = new SeriesRepository(db, cacheManager, this.userId)

        // Dependencies
        this.storage = storageService || new StorageService()
        this.userSync = userSyncService || new UserSyncService()

        // Update store context
        albumSeriesStore.setDb(db)
        albumSeriesStore.setUserId(this.userId)
    }

    // ========== CONTEXT MANAGEMENT ==========

    setUserId(userId) {
        this.userId = userId || 'anonymous-user'
        this.repository = new SeriesRepository(this.db, cacheManager, this.userId)
        albumSeriesStore.setUserId(this.userId)
    }

    async handleUserChange(state) {
        const newUser = state.currentUser
        const newUserId = newUser ? newUser.uid : 'anonymous-user'
        const currentUserId = albumSeriesStore.getUserId()

        await this.userSync.handleUserChange(newUser, currentUserId, async () => {
            // Migration Callback
            if (albumSeriesStore.getSeries().length > 0) {
                const seriesToMigrate = [...albumSeriesStore.getSeries()]
                console.log(`[SeriesService] Found ${seriesToMigrate.length} series to migrate`)

                // We need to temporarily set the new ID to perform the save, managed by repo
                // Actually relying on UserSyncService to orchestrate this via DataSyncService
                // But for now, we'll keep the logic local but cleaner
                this.setUserId(newUserId)
                const count = await this.userSync.migrateSeries(this.repository, seriesToMigrate)
                if (count > 0) await this.loadFromFirestore()
            }
        })

        // If simply switching user without migration
        if (currentUserId !== newUserId && currentUserId !== 'anonymous-user') {
            this.setUserId(newUserId)
            await this.loadFromFirestore().catch(err => console.error('Reload failed:', err))
        }
    }

    // ========== CRUD ==========

    async createSeries(seriesData) {
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

            const id = await this.repository.create(series)
            series.id = id

            albumSeriesStore.addSeries(series)
            albumSeriesStore.setActiveSeries(id)
            this.saveToLocalStorage()

            // FIX #156/161: No more aggressive cache clearing.
            // If albums were created separately, they should be injected manually by caller.

            return series
        } finally {
            globalProgress.finish()
        }
    }

    async updateSeries(id, updates) {
        globalProgress.start()
        try {
            await this.repository.update(id, { ...updates, updatedAt: new Date() })
            albumSeriesStore.updateSeriesById(id, updates)
            this.saveToLocalStorage()

            // FIX #156/161: No more aggressive cache clearing.
            // Callers (SeriesEditModal) responsible for injecting new albums via injectAlbumsIntoViewCache.
        } finally {
            globalProgress.finish()
        }
    }

    async deleteSeries(id) {
        globalProgress.start()
        try {
            await this.repository.delete(id)
            albumSeriesStore.removeSeriesById(id)
            this.saveToLocalStorage()

            // FIX #158: Granular removal prevents "No albums" flash
            albumsStore.clearAlbumSeries(id)
            albumsStore.removeAlbumsBySeriesIdFromContext(id, 'ALL_SERIES_VIEW')
        } finally {
            globalProgress.finish()
        }
    }

    async loadFromFirestore() {
        albumSeriesStore.setLoading(true)
        albumSeriesStore.setError(null)
        globalProgress.start()

        try {
            const firestoreSeries = await this.repository.findAll({
                orderBy: ['updatedAt', 'desc'],
                limit: 20
            })

            const series = firestoreSeries.map(s => ({
                ...s,
                createdAt: s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt),
                updatedAt: s.updatedAt?.toDate ? s.updatedAt.toDate() : new Date(s.updatedAt)
            }))

            albumSeriesStore.setSeries(series)
            this.saveToLocalStorage()
            return series
        } catch (error) {
            albumSeriesStore.setError(error.message)
            throw error
        } finally {
            albumSeriesStore.setLoading(false)
            globalProgress.finish()
        }
    }

    // ========== ALBUM MANAGEMENT ==========

    async addAlbumToSeries(seriesId, album) {
        const series = albumSeriesStore.getById(seriesId)
        if (!series) throw new Error('Series not found')

        const albumQueries = series.albumQueries || []

        // Check for duplicates
        const exists = albumQueries.some(q =>
            (typeof q === 'object' && q.title === album.title && q.artist === album.artist) ||
            (typeof q === 'string' && q.toLowerCase().includes(album.title.toLowerCase()))
        )

        if (!exists) {
            albumQueries.push({ id: album.id || null, title: album.title, artist: album.artist })
            // Note: updateSeries is cleaner now (no cache wipe)
            await this.updateSeries(seriesId, { albumQueries })

            // FIX #156: Surgically inject into view
            await this.injectAlbumsIntoViewCache([album], seriesId)
        }
    }

    async removeAlbumFromSeries(seriesId, album) {
        const series = albumSeriesStore.getById(seriesId)
        if (!series) throw new Error('Series not found')

        const albumQueries = series.albumQueries || []
        const norm = str => str?.toLowerCase().trim() || ''

        // Find matching query
        const matchIndex = albumQueries.findIndex(query => {
            if (typeof query === 'object' && query !== null) {
                // FIX #154: Fallback for legacy data that used 'album' instead of 'title'
                if (query.id && query.id === album.id) return true;
                const queryTitle = query.title || query.album;
                return queryTitle === album.title && (!query.artist || query.artist === album.artist)
            }
            if (typeof query === 'string') {
                const q = norm(query)
                const title = norm(album.title)
                const artist = norm(album.artist)
                return q === title || q === `${artist} - ${title}` || q === `${artist} ${title}` ||
                    (q.includes(title) && q.includes(artist))
            }
            return false
        })

        if (matchIndex === -1) {
            throw new Error(`Could not find album "${album.title}" in series`)
        }

        albumQueries.splice(matchIndex, 1)
        await this.updateSeries(seriesId, { albumQueries })

        console.log(`[SeriesService] 🗑️ Successfully removed album "${album.title}" from series "${series.name}" (ID: ${seriesId})`)


    }



    // ========== SURGICAL CACHE UPDATES (FIX #156) ==========

    /**
     * Surgically inject albums into the active view cache.
     * Handles enrichment and store hydration logic.
     * @param {Array<Object>} albums - List of album objects
     * @param {string} seriesId - Context series ID (optional)
     */
    async injectAlbumsIntoViewCache(albums, seriesId = null) {
        if (!albums || albums.length === 0) return

        console.log(`[SeriesService] 💉 Surgically injecting ${albums.length} albums into view cache...`)

        // 1. Enrich (BestEver Ratings) if missing
        const enrichedAlbums = await Promise.all(albums.map(async (album) => {
            // Clone to avoid mutation side effects on original reference locally
            const enriched = { ...album, tracks: album.tracks ? [...album.tracks] : [] }

            // Basic check if enrichment is needed (e.g. no ratings data)
            // We assume if it came from Search, it might have Tracks but no Acclaim data
            const needsEnrichment = !enriched.bestEverUrl && (!enriched.acclaim || !enriched.acclaim.hasRatings)

            if (needsEnrichment && enriched.artist && enriched.title) {
                // console.log(`[SeriesService] Enriching ${enriched.title}...`)
                const enrichment = await apiClient.BEAenrichAlbum({
                    title: enriched.title,
                    artist: enriched.artist,
                    tracks: enriched.tracks || []
                })

                if (enrichment && enrichment.trackRatings) {
                    // Merge ratings
                    const ratingsMap = new Map()
                    enrichment.trackRatings.forEach(r => {
                        if (r.rating !== null) ratingsMap.set(r.title.toLowerCase().trim(), r.rating)
                    })

                    // Apply to tracks
                    if (enriched.tracks) {
                        enriched.tracks.forEach(t => {
                            const key = t.title.toLowerCase().trim()
                            if (ratingsMap.has(key)) {
                                t.rating = ratingsMap.get(key)
                            }
                        })
                        // Sort by rating? Logic exists in APIClient, duplication risk.
                        // For surgical update, simple rating injection is usually enough for visual badges.
                        enriched.acclaim = { hasRatings: true, source: 'surgical-enrichment' }
                        enriched.bestEverUrl = enrichment.bestEverInfo?.url
                    }
                }
            }
            return enriched
        }))

        // 2. Hydrate & Inject
        // We can reuse the Controller logic style manual injection
        // But we need to be careful about hydration dependencies (OptimizedLoader etc)
        // Ideally, we persist them as proper Album Models.

        // Dynamic import to avoid circular dependency
        const { Album } = await import('../models/Album.js')
        const { optimizedAlbumLoader } = await import('../services/OptimizedAlbumLoader.js')
        const { userRankingRepository } = await import('../repositories/UserRankingRepository.js')

        for (const albumData of enrichedAlbums) {
            // Hydrate logic copied/adapted from SeriesController.hydrateAndAddAlbum
            // Ideally should be a shared utility, but for now we keep it here to avoid refactoring Controller.

            const album = albumData instanceof Album ? albumData : new Album(albumData)

            if (!album.coverUrl && !album.artworkTemplate) {
                const localMatch = await optimizedAlbumLoader.findAlbum(album.artist, album.title)
                if (localMatch) {
                    album.coverUrl = optimizedAlbumLoader.getArtworkUrl(localMatch, 500)
                }
            }

            // Inject into ALL_SERIES_VIEW context
            albumsStore.addAlbumToSeries('ALL_SERIES_VIEW', album)

            // Inject into Specific Series Context if active
            if (seriesId && albumsStore.getActiveAlbumSeriesId() === seriesId) {
                albumsStore.addAlbumToSeries(seriesId, album)
            }
        }

        console.log(`[SeriesService] ✅ Injection complete.`)
    }

    // ========== ENRICHMENT ==========

    async enrichAllAlbums(seriesId, onProgress) {
        // Stub - actual enrichment via dedicated enrichment services
        console.log(`[SeriesService] enrichAllAlbums called for ${seriesId}`)
        if (onProgress) onProgress({ current: 0, total: 0, status: 'pending' })
    }

    // ========== LOCALSTORAGE (Delegated) ==========

    saveToLocalStorage() {
        const series = albumSeriesStore.getSeries()
        this.storage.save(STORAGE_KEY, series)
    }

    loadFromLocalStorage() {
        const data = this.storage.load(STORAGE_KEY)
        if (data) {
            const series = data.map(s => ({
                ...s,
                createdAt: new Date(s.createdAt),
                updatedAt: new Date(s.updatedAt)
            }))
            albumSeriesStore.setSeries(series)
            return true
        }
        return false
    }

    reset() {
        this.storage.remove(STORAGE_KEY)
        albumSeriesStore.reset()
    }
}

// Singleton factory
let _instance = null

export function getSeriesService(db, cacheManager, userId) {
    if (!_instance && db) {
        const storage = new StorageService()
        const userSync = new UserSyncService()
        _instance = new SeriesService(db, userId, storage, userSync)
    } else if (_instance && userId && _instance.userId !== userId) {
        _instance.setUserId(userId)
    }
    return _instance
}
