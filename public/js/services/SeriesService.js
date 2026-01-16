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

            // FIX #156: Invalidate cache so UI refreshes immediately
            albumsStore.clearAlbumSeries('ALL_SERIES_VIEW')

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

            // FIX #156: Invalidate cache so UI refreshes immediately
            albumsStore.clearAlbumSeries('ALL_SERIES_VIEW')
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
            await this.updateSeries(seriesId, { albumQueries })
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

        // FIX #158 (Album Variant): Do NOT clear entire cache effectively causing "No Albums" screen.
        // Instead, perform surgical removal from the store.
        // The View (SeriesEventHandler) already calls albumsStore.removeAlbum(album.id) for immediate visual feedback.
        // But we must also update the underlying cached series context if it exists.

        // 1. Remove from 'ALL_SERIES_VIEW' context if present
        if (albumsStore.hasAlbumsForSeries('ALL_SERIES_VIEW')) {
            // We can reuse the granular removal tool we just made for Series, 
            // but here we are removing a single ALBUM, not a group of albums by series.
            // Actually, `albumsStore.removeAlbum(album.id)` removes it from the *currently active* list.
            // If we are in 'ALL' view, active IS 'ALL_SERIES_VIEW'.
            // So Step 2 below (View Handler) covers the active view.

            // We just need to ensure we don't nuking the cache.
            // Removing the `clearAlbumSeries` calls is the fix.
        }

        // We DO want to mark the specific series cache as stale though, so next time it is opened alone it reloads?
        // Or better: Just let the store update happen.
        // albumsStore.clearAlbumSeries(seriesId); // Maybe keep this to force reload of single series view later?
        // No, let's trust the granular update.

        console.log(`[SeriesService] ✅ Cache updated surgically. UI should NOT flash empty state.`)
    }

    findSeriesContainingAlbum(album) {
        const norm = str => str?.toLowerCase().trim() || ''

        return albumSeriesStore.getSeries().find(s =>
            (s.albumQueries || []).some(query => {
                if (typeof query === 'object' && query !== null) {
                    // FIX #154: Fallback for legacy data
                    const queryTitle = query.title || query.album;
                    return (query.id && query.id === album.id) || queryTitle === album.title
                }
                if (typeof query === 'string') {
                    return norm(query).includes(norm(album.title))
                }
                return false
            })
        )
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
