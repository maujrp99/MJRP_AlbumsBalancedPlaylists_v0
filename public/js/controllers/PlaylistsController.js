import { playlistsStore } from '../stores/playlists.js'
import { albumsStore } from '../stores/albums.js'
import { albumSeriesStore } from '../stores/albumSeries.js'
import { getPlaylistsService } from '../services/PlaylistsService.js'
import { getSeriesService } from '../services/SeriesService.js'
import { blendingController } from './BlendingController.js'
import { albumAsks } from '../services/albums/albumLoading.js'
import { askNotices, noAlbumsMessage } from '../models/albumAsk.js'
import { ENRICHMENT_SOURCES } from '../models/albumLoadState.js'
import toast from '../components/Toast.js'

/**
 * PlaylistsController
 * 
 * Handles business logic for PlaylistsView.
 * Mediates between View (DOM events) and Stores.
 */
export class PlaylistsController {
    constructor(viewContext) {
        this.view = viewContext // Reference to view for triggering updates if absolutely necessary, mainly for toast context
        this._leaving = new AbortController() // aborted when the screen closes: what it asked for is dropped
    }

    /**
     * Initialize data based on route parameters
     * Handles both Create Mode (from Albums) and Edit Mode (from Saved Playlists)
     */
    async initialize(params) {
        const urlParams = new URLSearchParams(window.location.search)
        const editBatchName = urlParams.get('edit')
        const seriesIdParam = urlParams.get('seriesId')
        const isAutoGenerate = urlParams.get('generate') === 'true'

        // 1. EDIT MODE
        if (editBatchName) {
            console.log('[PlaylistsController] Mode: EDIT', editBatchName)

            // Sprint 15 Fix (#99): ALWAYS reload on Edit Mode navigation.
            const { db } = await import('../app.js')
            const { cacheManager } = await import('../cache/CacheManager.js')
            const service = getPlaylistsService(db, cacheManager)
            service.setEditMode(decodeURIComponent(editBatchName), seriesIdParam, null)
            await this.loadPlaylistsForEdit(decodeURIComponent(editBatchName), seriesIdParam)
            return
        }

        // 2. CREATE MODE
        // Check if we have stale data from a different series
        const existingPlaylists = playlistsStore.getPlaylists()
        const currentSeriesId = playlistsStore.seriesId

        if (existingPlaylists.length > 0 && currentSeriesId === seriesIdParam) {
            console.log('[PlaylistsController] Mode: CREATE (Preserving existing generation)')
        } else {
            console.log('[PlaylistsController] Mode: CREATE (Resetting)')
            const { db } = await import('../app.js')
            const { cacheManager } = await import('../cache/CacheManager.js')
            const service = getPlaylistsService(db, cacheManager)
            service.setCreateMode()

            // Playlists generated and not saved before a reload of the page come back (UAT-05)
            if (existingPlaylists.length === 0 && !isAutoGenerate && service.restoreDraft({ seriesId: seriesIdParam })) {
                toast.info('Your unsaved playlists were restored')
                this.loadAlbumsForSeries(playlistsStore.getSeriesId()) // for generating again; not awaited
            }
        }

        // Auto-generate if requested
        if (isAutoGenerate) {
            console.log('[PlaylistsController] Auto-generation requested')
            // Remove param from URL
            const newUrl = window.location.pathname + window.location.search.replace(/[?&]generate=true/, '')
            window.history.replaceState({}, '', newUrl)

            // Slight delay to ensure stores are ready
            setTimeout(() => this.handleGenerate(), 500)
        }
    }

    /**
     * Load playlists from Firestore for Edit Mode
     */
    async loadPlaylistsForEdit(batchName, seriesId) {
        try {
            const { db, auth } = await import('../app.js')
            const { cacheManager } = await import('../cache/CacheManager.js')
            const userId = auth.currentUser?.uid || 'anonymous-user'

            // Ensure series ID
            if (!seriesId) {
                const active = albumSeriesStore.getActiveSeries()
                seriesId = active?.id
            }

            if (!seriesId) {
                toast.error('No series context found')
                return
            }

            const { PlaylistRepository } = await import('../repositories/PlaylistRepository.js')
            const repo = new PlaylistRepository(db, cacheManager, userId, seriesId)

            const allPlaylists = await repo.findAll()

            const batchPlaylists = allPlaylists
                .filter(p => !p.batchName || p.batchName.trim() === batchName.trim())
                .filter(p => p.batchName && p.batchName.trim() === batchName.trim())
                .sort((a, b) => (a.order || 0) - (b.order || 0))

            if (batchPlaylists.length === 0) {
                // Nothing of another batch stays on screen under this batch's name, where a save would store it
                playlistsStore.setPlaylists([], seriesId)
                toast.warning(`No playlists found for batch "${batchName}"`)
                return
            }

            // Load into store
            playlistsStore.setPlaylists(batchPlaylists, seriesId)

            // Also ensure albums are loaded for regeneration/adding
            this.loadAlbumsForSeries(seriesId)

        } catch (err) {
            console.error('[PlaylistsController] Failed to load edit batch:', err)
            toast.error('Failed to load playlists')
        }
    }

    /**
     * Have the albums of the series ready for generating again. They are asked for through the
     * album load (F56): what the albums screen loaded or the browser keeps comes at once, and the
     * person is told which albums could not be loaded.
     * @returns {Promise<Object|null>} the answer of the load (AlbumsResult), or null when nothing was asked
     */
    async loadAlbumsForSeries(seriesId) {
        try {
            const series = await this._seriesOf(seriesId)
            if (!series?.albumQueries?.length) {
                toast.warning('This series has no albums to generate playlists from.')
                return null
            }

            const signal = this._leaving.signal
            // While the screen is open every source keeps coming, so generating again with another
            // recipe does not start from nothing. Nobody waits for this one.
            albumAsks.albumsOf({ series: [series], sources: [...ENRICHMENT_SOURCES], signal })

            const result = await albumAsks.albumsOf({ series: [series], sources: [], signal })
            if (result.aborted) return result

            albumsStore.setActiveAlbumSeriesId(seriesId)
            this._tellLoad(result)
            return result
        } catch (err) {
            console.error('[PlaylistsController] Failed to load albums:', err)
            toast.error('Could not load albums for reconfiguration')
            return null
        }
    }

    /** The series, read from the database first when it is not in memory (a reload of the page). */
    async _seriesOf(seriesId) {
        if (!albumSeriesStore.getById(seriesId)) {
            const db = albumSeriesStore.getDb()
            if (db) await getSeriesService(db, null, albumSeriesStore.getUserId()).loadFromFirestore()
        }
        if (albumSeriesStore.getActiveSeries()?.id !== seriesId) albumSeriesStore.setActiveSeries(seriesId)
        return albumSeriesStore.getById(seriesId) || null
    }

    /** Tell the person what the load left out: which albums and how many. */
    _tellLoad(result) {
        if (result.albums.length === 0) {
            toast.warning(noAlbumsMessage(result))
            return
        }
        askNotices(result).forEach(notice => toast.warning(notice))
    }

    /**
     * Deletes a single playlist from the current working set
     */
    async deletePlaylist(index) {
        if (!playlistsStore.getPlaylists()[index]) return

        const { db } = await import('../app.js')
        const { cacheManager } = await import('../cache/CacheManager.js')
        const removed = getPlaylistsService(db, cacheManager).removePlaylist(index)
        if (removed) toast.success(`Playlist "${removed.name}" removed`)
    }

    /**
     * Delete a specific track from a playlist
     */
    deleteTrack(playlistIndex, trackIndex) {
        // Validate
        const playlists = playlistsStore.getPlaylists()
        if (!playlists[playlistIndex] || !playlists[playlistIndex].tracks[trackIndex]) return

        // Use service for track removal
        import('../app.js').then(({ db }) => {
            import('../cache/CacheManager.js').then(({ cacheManager }) => {
                const service = getPlaylistsService(db, cacheManager)
                service.removeTrack(playlistIndex, trackIndex)
            })
        })
    }

    /**
     * Generate playlists using selected config
     * Uses BlendingController, which asks the album load for the albums with the sources the
     * recipe reads; what the load left out (albums, sources) is told to the person.
     */
    async handleGenerate(config) {
        // config = { algorithmId, rankingId, targetDuration, outputMode, discoveryMode } from UI
        if (!config) config = { algorithmId: 'mjrp-balanced-cascade', rankingId: 'balanced' }

        try {
            this._showGenerating(true)
            const result = await blendingController.regenerate(config, { signal: this._leaving.signal })

            ;(result.notices || []).forEach(notice => toast.warning(notice))
            toast.success(`Generated ${result.playlists.length} playlists`)
        } catch (err) {
            if (err?.name === 'BlendCancelledError') return // the person left the screen
            console.error('[PlaylistsController] Generation failed:', err)
            toast.error(err.message)
        } finally {
            this._showGenerating(false)
        }
    }

    _showGenerating(isGenerating) {
        if (!this.view) return
        this.view.isGenerating = isGenerating
        if (this.view.update) this.view.update()
    }

    /**
     * Save the playlists on screen. The rule of a save (which series, what is replaced, one save
     * at a time) lives in PlaylistsService.saveCurrentBatch; here the person is told the result.
     * The button shows the save in progress from the store (`isSaving`), not from here.
     */
    async handleSave(typedBatchName = null) {
        const { db, auth } = await import('../app.js')
        const { cacheManager } = await import('../cache/CacheManager.js')
        const service = getPlaylistsService(db, cacheManager)

        const batchName = service.resolveBatchName(typedBatchName)
        if (!batchName) {
            toast.error('Batch name required')
            return
        }

        try {
            const userId = auth.currentUser?.uid || 'anonymous-user'
            const result = await service.saveCurrentBatch({ userId, batchName })
            if (result.status === 'saved') toast.success(`Saved "${batchName}" successfully!`)
        } catch (err) {
            console.error('[PlaylistsController] Save failed:', err)
            toast.error(`Save failed: ${err.message}. Nothing was changed: what was saved before is still there.`)
        }
    }

    /**
     * Clean up
     */
    destroy() {
        this._leaving.abort()
        this.view = null
    }
}
