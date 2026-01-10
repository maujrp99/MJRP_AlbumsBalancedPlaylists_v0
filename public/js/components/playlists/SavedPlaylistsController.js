/**
 * SavedPlaylistsController
 * 
 * Handles business logic for SavedPlaylistsView.
 * - Fetches Series and Playlists.
 * - Manages thumbnails via OptimizedAlbumLoader.
 * - Handles Delete/Edit actions.
 * 
 * @module components/playlists/SavedPlaylistsController
 * @since Sprint 15 (ARCH-12)
 */

import { SeriesRepository } from '../../repositories/SeriesRepository.js'
import { PlaylistRepository } from '../../repositories/PlaylistRepository.js'
import { optimizedAlbumLoader } from '../../services/OptimizedAlbumLoader.js'
import { getPlaylistsService } from '../../services/PlaylistsService.js'
import { playlistsStore } from '../../stores/playlists.js'
import { albumSeriesStore } from '../../stores/albumSeries.js'
import { albumsStore } from '../../stores/albums.js'
import { router } from '../../router.js'
import toast from '../Toast.js'

export class SavedPlaylistsController {
    constructor(view) {
        this.view = view
        this.data = [] // Cached data
        // Repositories will be initialized in loadData to ensure App dependencies (db, auth) are ready
    }

    /**
     * Load all series and their playlists
     * @returns {Promise<Array>} Array of { series, playlists, batchMap }
     */
    async loadData({ db, cacheManager, auth } = {}) {
        try {
            // Lazy load dependencies (App context)
            if (!db || !cacheManager || !auth) {
                const app = await import('../../app.js')
                db = db || app.db
                cacheManager = cacheManager || app.cacheManager
                auth = auth || app.auth
            }

            const userId = auth.currentUser?.uid || 'anonymous-user'

            // Initialize Series Repo
            const seriesRepo = new SeriesRepository(db, cacheManager, userId)

            // 1. Fetch all series
            const allSeries = await seriesRepo.findAll()

            // 2. Build groups
            const groups = []

            if (allSeries) {
                for (const series of allSeries) {
                    // Initialize Playlist Repo for THIS series
                    // Note: PlaylistRepository is scoped to a seriesId
                    const playlistRepo = new PlaylistRepository(db, cacheManager, userId, series.id)

                    // Find playlists for this series (Using base findAll because repo is scoped)
                    const playlists = await playlistRepo.findAll()

                    if (playlists && playlists.length > 0) {
                        groups.push({
                            series,
                            playlists,
                            batches: this.processBatches(playlists)
                        })
                    }
                }
            }

            // 3. Store data
            this.data = groups

            // 4. Trigger thumbnail preload (non-blocking)
            this.preloadAllThumbnails()

            return groups
        } catch (error) {
            console.error('[Controller] Failed to load playlists:', error)
            toast.error('Failed to load playlists')
            throw error
        }
    }

    /**
     * Process playlists into Batches (Grouping Logic)
     * @private
     */
    processBatches(playlists) {
        const batchMap = new Map()

        playlists.forEach(pl => {
            const batchKey = pl.batchName || 'Saved Playlists'
            if (!batchMap.has(batchKey)) {
                batchMap.set(batchKey, {
                    name: batchKey,
                    savedAt: pl.savedAt,
                    playlists: []
                })
            }
            batchMap.get(batchKey).playlists.push(pl)
        })

        // Sort playlists inside batches
        batchMap.forEach(batch => {
            batch.playlists.sort((a, b) => {
                if (a.order !== undefined && b.order !== undefined) {
                    return a.order - b.order
                }
                return (a.name || '').localeCompare(b.name || '', undefined, { numeric: true })
            })
        })

        // Sort batches by date (newest first)
        return Array.from(batchMap.values()).sort((a, b) => {
            const dateA = a.savedAt ? new Date(a.savedAt) : new Date(0)
            const dateB = b.savedAt ? new Date(b.savedAt) : new Date(0)
            return dateB - dateA
        })
    }

    /**
     * Preload thumbnails for all loaded groups
     * @private
     */
    async preloadAllThumbnails() {
        for (const group of this.data) {
            // Don't await inside loop to allow parallel fetching if supported
            // or just let it run in background
            this.preloadSeriesThumbnails(group.series).then(() => {
                if (this.view && this.view.onThumbnailLoaded) {
                    this.view.onThumbnailLoaded(group.series.id)
                }
            })
        }
    }

    async preloadSeriesThumbnails(series, max = 3) {
        // I need to ensure this.thumbnailCache exists
        if (!this.thumbnailCache) this.thumbnailCache = new Map()
        if (this.thumbnailCache.has(series.id)) return // Already cached

        const queries = series.albumQueries || series.albums || []
        const thumbs = []
        const count = Math.min(queries.length, max)

        for (let i = 0; i < count; i++) {
            const query = queries[i]
            let coverUrl = null

            // Logic ported from SavedPlaylistsView
            if (typeof query === 'object' && query.imageUrl) {
                coverUrl = query.imageUrl
            } else if (typeof query === 'string' && query.includes(' - ')) {
                const [artist, ...albumParts] = query.split(' - ')
                const albumName = albumParts.join(' - ')
                try {
                    const found = await optimizedAlbumLoader.findAlbum(artist, albumName)
                    if (found) {
                        coverUrl = optimizedAlbumLoader.getArtworkUrl(found, 100)
                    }
                } catch (e) { /* ignore */ }
            }
            thumbs.push(coverUrl)
        }

        this.thumbnailCache.set(series.id, thumbs)
        return thumbs
    }

    getThumbnails(seriesId) {
        return (this.thumbnailCache && this.thumbnailCache.get(seriesId)) || []
    }

    /**
     * Actions
     */
    async editBatch(seriesId, batchName, savedAt) {
        // Set context in store so PlaylistsView knows we are editing
        // Use service to set edit mode
        const { db } = await import('../../app.js')
        const { cacheManager } = await import('../../cache/CacheManager.js')
        const service = getPlaylistsService(db, cacheManager)
        service.setEditMode(batchName, seriesId, savedAt)

        // Legacy PlaylistsController expects 'edit' param to trigger initialization
        const encodedName = encodeURIComponent(batchName)
        router.navigate(`/playlists/edit?seriesId=${seriesId}&edit=${encodedName}`)
    }

    // Keep legacy support or redirect
    async editSeries(seriesId) {
        await this.editBatch(seriesId, 'Saved Playlists', null)
    }

    navigateBlend() {
        router.navigate('/blend')
    }

    async openSeriesManager(seriesId) {
        // Sprint 17.5: Navigate to Albums Series view
        router.navigate(`/albums?seriesId=${seriesId}`)
    }

    async deleteBatch(seriesId, batchName) {
        try {
            const { db, cacheManager, auth } = await import('../../app.js') // Lazy load for action
            const userId = auth.currentUser?.uid || 'anonymous-user'

            const playlistRepo = new PlaylistRepository(db, cacheManager, userId, seriesId)

            const playlists = await playlistRepo.findAll()
            const batchPlaylists = playlists.filter(p => (p.batchName || 'Saved Playlists') === batchName)

            if (batchPlaylists.length === 0) return true

            await Promise.all(batchPlaylists.map(p => playlistRepo.delete(p.id)))

            toast.success(`Deleted batch: ${batchName}`)

            await this.loadData()
            return true
        } catch (e) {
            toast.error('Failed to delete batch')
            console.error(e)
            return false
        }
    }

    async deleteAllPlaylists(seriesId, seriesName) {
        try {
            const { db, cacheManager, auth } = await import('../../app.js')
            const userId = auth.currentUser?.uid || 'anonymous-user'
            const playlistRepo = new PlaylistRepository(db, cacheManager, userId, seriesId)

            const playlists = await playlistRepo.findAll()
            await Promise.all(playlists.map(p => playlistRepo.delete(p.id)))

            toast.success(`Deleted playlists for ${seriesName}`)

            this.data = this.data.filter(g => g.series.id !== seriesId)
            return true
        } catch (e) {
            toast.error('Failed to delete playlists')
            console.error(e)
            return false
        }
    }
}
