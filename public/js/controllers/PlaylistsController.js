import { playlistsStore } from '../stores/playlists.js'
import { albumsStore } from '../stores/albums.js'
import { albumSeriesStore } from '../stores/albumSeries.js'
import { blendingController } from './BlendingController.js'
import { createAlgorithm } from '../algorithms/index.js'
import toast from '../components/Toast.js'
import { getIcon } from '../components/Icons.js'

/**
 * PlaylistsController
 * 
 * Handles business logic for PlaylistsView.
 * Mediates between View (DOM events) and Stores.
 */
export class PlaylistsController {
    constructor(viewContext) {
        this.view = viewContext // Reference to view for triggering updates if absolutely necessary, mainly for toast context
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

            // Only load if not already matching (prevents refresh loop issues)
            if (playlistsStore.mode !== 'EDITING' || playlistsStore.editContext?.batchName !== editBatchName) {
                playlistsStore.setEditMode(decodeURIComponent(editBatchName), seriesIdParam, null)
                await this.loadPlaylistsForEdit(decodeURIComponent(editBatchName), seriesIdParam)
            }
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
            playlistsStore.setCreateMode()
            playlistsStore.playlists = [] // Clear stale
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
                .filter(p => p.batchName === batchName)
                .sort((a, b) => (a.order || 0) - (b.order || 0))

            if (batchPlaylists.length === 0) {
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

    async loadAlbumsForSeries(seriesId) {
        // Check if albums are already cached FOR THIS SERIES
        const currentSeriesId = albumsStore.activeAlbumSeriesId
        const albumsInMemory = albumsStore.getAlbums().length > 0

        if (albumsInMemory && currentSeriesId === seriesId) {
            console.log('[PlaylistsController] Albums already in memory for this series, skipping load')
            return
        }

        // Albums in memory are for a different series - need to reload
        if (albumsInMemory && currentSeriesId !== seriesId) {
            console.log(`[PlaylistsController] Albums in memory are for different series (${currentSeriesId}), reloading for ${seriesId}`)
        }

        console.log('[PlaylistsController] Albums not in memory. Loading via API pipeline for series:', seriesId)

        try {
            // V3 Architecture: Load albums via API pipeline (same as SeriesController)
            // 1. Get album queries from the active series
            let activeSeries = albumSeriesStore.getActiveSeries()

            if (!activeSeries || activeSeries.id !== seriesId) {
                // Ensure series is set
                await albumSeriesStore.loadFromFirestore()
                albumSeriesStore.setActiveSeries(seriesId)
                activeSeries = albumSeriesStore.getActiveSeries()
            }

            if (!activeSeries || !activeSeries.albumQueries || activeSeries.albumQueries.length === 0) {
                console.warn('[PlaylistsController] No album queries found for series. Regeneration will be disabled.')
                toast.warning('No album data available. Visit Music Series to load albums first.')
                return
            }

            // 2. Set context for ghost prevention
            albumsStore.setActiveAlbumSeriesId(seriesId)
            albumsStore.reset(true)

            // 3. Load via API (fetchMultipleAlbums)
            const { apiClient } = await import('../api/client.js')

            const { results, errors } = await apiClient.fetchMultipleAlbums(
                activeSeries.albumQueries,
                (current, total, result) => {
                    if (result.status === 'success' && result.album) {
                        // Add album to store (same pattern as SeriesController.hydrateAndAddAlbum)
                        albumsStore.addAlbumToSeries(seriesId, result.album)
                    }
                },
                false // skipCache
            )

            if (errors.length > 0) {
                console.warn(`[PlaylistsController] ${errors.length} albums failed to load`)
            }

            const loadedCount = albumsStore.getAlbums().length
            console.log(`[PlaylistsController] Albums loaded via API for edit context: ${loadedCount} albums`)

            if (loadedCount === 0) {
                toast.warning('Could not load albums. Visit Music Series first to ensure data is available.')
            }
        } catch (err) {
            console.error('[PlaylistsController] Failed to load albums:', err)
            toast.error('Could not load albums for reconfiguration')
        }
    }

    /**
     * Deletes a single playlist from the current working set
     */
    deletePlaylist(index) {
        const playlists = playlistsStore.getPlaylists()
        if (!playlists[index]) return

        const name = playlists[index].name
        const newPlaylists = playlists.filter((_, i) => i !== index)

        // Update store
        playlistsStore.setPlaylists(newPlaylists, playlistsStore.seriesId)
        toast.success(`Playlist "${name}" removed`)
    }

    /**
     * Generate playlists using selected config
     * Uses BlendingController for centralized generation logic
     */
    async handleGenerate(config) {
        // config = { algorithmId, rankingId, targetDuration, outputMode, discoveryMode } from UI
        if (!config) config = { algorithmId: 'mjrp-balanced-cascade', rankingId: 'balanced' }

        // Issue #93 Debug: Log received config
        console.log('[PlaylistsController] handleGenerate config:', config)

        const albums = albumsStore.getAlbums()
        if (albums.length === 0) {
            toast.warning('No albums loaded. Please load albums first.')
            return
        }

        // Validation - Check Ratings
        if (config.rankingId === 'balanced') {
            const ratedAlbums = albums.filter(a => a.acclaim?.hasRatings || a.tracks?.some(t => t.rating))
            if (ratedAlbums.length === 0) {
                if (!confirm('No ratings detected. Playlists may be unbalanced. Continue?')) return
            }
        }

        try {
            this.view.isGenerating = true;
            if (this.view.update) this.view.update(); // Trigger loading state

            // Use BlendingController for centralized generation
            const result = await blendingController.regenerate(config)
            toast.success(`Generated ${result.playlists.length} playlists`)

        } catch (err) {
            console.error('[PlaylistsController] Generation failed:', err)
            toast.error(err.message)
        } finally {
            this.view.isGenerating = false
            if (this.view.update) this.view.update()
        }
    }

    /**
     * Save the current playlists (Create or Overwrite based on mode)
     */
    async handleSave(customBatchName = null) {
        const isEditMode = playlistsStore.isEditingExistingBatch()
        let batchName = customBatchName

        // If Edit Mode, use existing name if not provided (or updated name from input)
        if (isEditMode && !batchName) {
            batchName = playlistsStore.getEditContext()?.batchName
        }

        if (!batchName) {
            // Should be handled by UI modal, but safeguard
            toast.error('Batch name required')
            return
        }

        const btn = document.querySelector('#saveToHistoryBtn') // Access DOM only for button state if needed, or pass callback
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `${getIcon('Loader', 'w-4 h-4 animate-spin')} Saving...`
        }

        try {
            // Logic mostly copied from _savePlaylistsToFirestore but cleaner
            const { db, cacheManager, auth } = await import('../app.js')
            const userId = auth.currentUser?.uid || 'anonymous-user'

            // Fix: Ensure we have a Series ID. 
            // activeSeries might be null if we reloaded the page in Edit Mode without visiting Albums view first.
            // But we should have it in playlistsStore.seriesId from initialize()
            let seriesId = albumSeriesStore.getActiveSeries()?.id

            if (!seriesId) {
                // Fallback to store context
                seriesId = playlistsStore.seriesId
                if (seriesId) {
                    // Try to restore active series in store if missing (optional but good for consistency)
                    const { SeriesRepository } = await import('../repositories/SeriesRepository.js')
                    const seriesRepo = new SeriesRepository(db, cacheManager, userId)
                    const series = await seriesRepo.findById(seriesId)
                    if (series) albumSeriesStore.setActiveSeries(series.id)
                }
            }

            if (!seriesId) throw new Error('No Series Context found for saving.')

            const activeSeries = albumSeriesStore.getActiveSeries()

            // 1. Save Series Parent (Upsert)
            if (activeSeries) {
                const { SeriesRepository } = await import('../repositories/SeriesRepository.js')
                const seriesRepo = new SeriesRepository(db, cacheManager, userId)
                await seriesRepo.save(activeSeries.id, {
                    ...activeSeries,
                    updatedAt: new Date().toISOString()
                })
            }

            // 2. Handle Overwrite (Delete Old)
            const { PlaylistRepository } = await import('../repositories/PlaylistRepository.js')
            const repo = new PlaylistRepository(db, cacheManager, userId, seriesId)

            // If overwriting (Edit Mode OR explicit overwrite confirmed in Create Mode)
            // Note: Create Mode overwrite check happens in View before calling this with isOverwrite=true usually.
            // But here let's rely on simple logic:
            // If Edit Mode -> Always delete original batch name first (handles rename case too if we track original)

            if (isEditMode) {
                const originalName = playlistsStore.editContext?.originalBatchName || playlistsStore.editContext?.batchName
                if (originalName) {
                    console.log('[PlaylistsController] Deleting old batch:', originalName)
                    const all = await repo.findAll()
                    const old = all.filter(p => p.batchName === originalName)
                    for (const p of old) await repo.delete(p.id)
                }
            } else {
                // Create Mode: Check existence handled by UI Modal usually. 
                // We assume if we are here, we are good to write.
            }

            // 3. Set Batch Name and Save
            playlistsStore.setBatchName(batchName)
            await playlistsStore.saveToFirestore(db, cacheManager, userId)

            toast.success(`Saved "${batchName}" successfully!`)

            if (btn) {
                btn.innerHTML = `${getIcon('Check', 'w-4 h-4')} Saved!`
                setTimeout(() => {
                    btn.disabled = false;
                    btn.innerHTML = `${getIcon('Cloud', 'w-5 h-5')} ${isEditMode ? 'Save Changes' : 'Save to History'}`
                }, 2000)
            }

        } catch (err) {
            console.error('[PlaylistsController] Save failed:', err)
            toast.error('Save failed: ' + err.message)
            if (btn) btn.disabled = false
        }
    }

    /**
     * Clean up
     */
    destroy() {
        this.view = null
    }
}
