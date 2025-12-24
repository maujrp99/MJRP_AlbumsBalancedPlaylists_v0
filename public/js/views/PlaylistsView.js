import { BaseView } from './BaseView.js'
import { playlistsStore } from '../stores/playlists.js'
import { albumsStore } from '../stores/albums.js'
import { albumSeriesStore } from '../stores/albumSeries.js'
import { apiClient } from '../api/client.js'
import { router } from '../router.js'
import { Breadcrumb } from '../components/Breadcrumb.js'
import { getIcon } from '../components/Icons.js'
import toast from '../components/Toast.js'
import Sortable from 'sortablejs'
import { getAllAlgorithms, getRecommendedAlgorithm } from '../algorithms/index.js'
import { BalancedRankingStrategy, SpotifyRankingStrategy, BEARankingStrategy } from '../ranking/index.js'
import { playlistGenerationService } from '../services/PlaylistGenerationService.js'

// Sprint 10: Modular components
import { handleExportJson as handleExportJsonFn, handleExportToAppleMusic as handleExportToAppleMusicFn } from './playlists/index.js'
import { setupDragAndDrop as setupDragAndDropFn } from './playlists/index.js'

// Sprint 12.5: Playlist components
import { TrackItem } from '../components/playlists/TrackItem.js'
import { PlaylistGrid } from '../components/playlists/PlaylistGrid.js'

/**
 * PlaylistsView
 * Playlist generation, editing, and management
 */

export class PlaylistsView extends BaseView {
  // ... existing constructor ...

  renderPlaylists(playlists) {
    if (playlists.length === 0) return ''

    // Pass playlists to Grid component
    // Grid handles responsive layout and per-playlist ranking logic
    return PlaylistGrid.render({
      playlists,
      editable: true,
      primaryRanking: 'acclaim' // Default fallback
    })
  }

  // Obsolete methods removed: renderTrack, getRatingClass, formatDuration
  // TrackItem and PlaylistCard components now handle this logic.

  renderExportSection() {
    return `
      <div class="export-section glass-panel p-6">
        <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
          ${getIcon('Save', 'w-5 h-5')} Actions & Export
        </h3>
        <div class="export-actions flex flex-wrap gap-4">
          <button class="btn btn-success flex items-center gap-2" id="saveToHistoryBtn">
            ${getIcon('Cloud', 'w-5 h-5')} Save to Series History
          </button>
          <div class="h-auto w-px bg-white/10 mx-2"></div>
          <button class="btn flex items-center gap-2 text-white font-semibold shadow-lg hover:scale-[1.02] transition-all duration-300" style="background: linear-gradient(135deg, #1DB954 0%, #1ed760 100%);" id="exportSpotifyBtn">
            ${getIcon('Spotify', 'w-5 h-5')} Export to Spotify
          </button>
          <button class="btn flex items-center gap-2 bg-gradient-to-r from-[#FF4D00] to-[#FF8800] hover:from-[#FF8800] hover:to-[#FFCC00] text-white font-semibold shadow-lg hover:shadow-[#FF4D00]/30 transition-all duration-300" id="exportAppleMusicBtn">
            ${getIcon('Apple', 'w-5 h-5')} Export to Apple Music
          </button>
          <button class="btn btn-secondary flex items-center gap-2" id="exportJsonBtn">
            ${getIcon('Download', 'w-5 h-5')} Download JSON
          </button>
        </div>
      </div>
    `
  }

  async handleSaveToHistory() {
    const activeSeries = albumSeriesStore.getActiveSeries()
    const playlists = playlistsStore.getPlaylists()

    // Sprint 8.5: Use explicit mode from store (State Machine Pattern)
    const isEditing = playlistsStore.isEditingExistingBatch()
    const editContext = playlistsStore.getEditContext()

    console.log('[PlaylistsView] Save to History:', {
      mode: playlistsStore.mode,
      isEditing,
      editContext,
      playlistCount: playlists.length
    })

    if (isEditing && editContext) {
      // Edit mode: Direct save without naming modal - overwrite existing
      await this._savePlaylistsToFirestore(editContext.batchName, true)
    } else {
      // Create mode: Show naming modal
      const { showSavePlaylistsModal } = await import('../components/Modals.js')
      const defaultName = activeSeries?.name || 'My Playlists'
      const playlistCount = playlists.length

      showSavePlaylistsModal(defaultName, playlistCount, async (batchName) => {
        await this._savePlaylistsToFirestore(batchName, false)
      })
    }
  }

  async _savePlaylistsToFirestore(batchName, isOverwrite) {
    const btn = this.$('#saveToHistoryBtn')
    if (btn) {
      btn.disabled = true
      btn.textContent = isOverwrite ? 'Saving changes...' : 'Saving...'
    }

    try {
      const { db, cacheManager, auth } = await import('../app.js')
      const userId = auth.currentUser ? auth.currentUser.uid : 'anonymous-user'
      const activeSeries = albumSeriesStore.getActiveSeries()

      // 1. Ensure Parent Series Exists (Upsert)
      if (activeSeries) {
        const { SeriesRepository } = await import('../repositories/SeriesRepository.js')
        const seriesRepo = new SeriesRepository(db, cacheManager, userId)

        const seriesData = {
          id: activeSeries.id,
          name: activeSeries.name || 'Untitled Series',
          sourceType: activeSeries.sourceType || 'unknown',
          albumQueries: Array.isArray(activeSeries.albumQueries) ? activeSeries.albumQueries : [],
          updatedAt: new Date().toISOString()
        }

        console.log('[PlaylistsView] 1. Saving Series Parent:', activeSeries.id, seriesData)
        try {
          await seriesRepo.save(activeSeries.id, seriesData)
          console.log('[PlaylistsView] ✅ Series Parent Saved')
        } catch (err) {
          console.error('[PlaylistsView] ❌ Failed to save Series Parent:', err)
          throw err
        }
      }

      // 2. Set batch name on playlists (or update timestamp if editing)
      if (!isOverwrite) {
        playlistsStore.setBatchName(batchName)
      } else {
        // Sprint 8.5: For overwrite, we need to:
        // 1. Delete OLD playlists with this batchName (they have different IDs after regenerate)
        // 2. Set batchName on the NEW playlists
        // 3. Save the NEW playlists

        const { PlaylistRepository } = await import('../repositories/PlaylistRepository.js')
        const repo = new PlaylistRepository(db, cacheManager, userId, activeSeries.id)

        // Delete old batch playlists first
        console.log('[PlaylistsView] 2a. Deleting old playlists for batch:', batchName)
        const allPlaylists = await repo.findAll()
        const oldBatchPlaylists = allPlaylists.filter(p => p.batchName === batchName)
        console.log('[PlaylistsView] Found', oldBatchPlaylists.length, 'old playlists to delete')

        for (const oldPlaylist of oldBatchPlaylists) {
          await repo.delete(oldPlaylist.id)
        }
        console.log('[PlaylistsView] ✅ Old batch deleted')

        // Now set batch info on new playlists
        playlistsStore.setBatchName(batchName)
      }

      // 3. Save Playlists (Subcollection) - uses repo.save() which is upsert
      console.log(`[PlaylistsView] 2b. ${isOverwrite ? 'Saving overwritten' : 'Saving'} Playlists with batch name:`, batchName)
      await playlistsStore.saveToFirestore(db, cacheManager, userId)
      console.log('[PlaylistsView] ✅ Playlists Saved')

      if (btn) {
        btn.className = 'btn btn-success flex items-center gap-2'
        btn.innerHTML = `${getIcon('Check', 'w-5 h-5')} ${isOverwrite ? 'Updated!' : 'Saved!'}`
        setTimeout(() => {
          btn.disabled = false
          btn.innerHTML = `${getIcon('Cloud', 'w-5 h-5')} Save to Series History`
        }, 2000)
      }
      toast.success(isOverwrite ? `"${batchName}" updated!` : `"${batchName}" saved to series history!`)
    } catch (error) {
      console.error('[PlaylistsView] ❌ Cloud Save Failed:', error)

      console.log('[PlaylistsView] Attempting Local Save (Fallback)...')
      playlistsStore.saveToLocalStorage()

      if (btn) {
        btn.className = 'btn btn-warning flex items-center gap-2'
        btn.innerHTML = `${getIcon('AlertTriangle', 'w-5 h-5')} Saved Locally Only`
        setTimeout(() => {
          btn.disabled = false
          btn.innerHTML = `${getIcon('Cloud', 'w-5 h-5')} Save to Series History`
        }, 4000)
      }
      toast.warning('Cloud save failed (permissions). Playlists saved to browser storage.')
    }
  }

  renderGeneratingOverlay() {
    return `
      <div class="loading-overlay">
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <p class="loading-text">Generating balanced playlists...</p>
        </div>
      </div>
    `
  }

  async mount(params) {
    this.container = document.getElementById('app')

    // Attach breadcrumb listeners
    Breadcrumb.attachListeners(this.container)

    // Subscribe to playlists store
    const unsubscribe = playlistsStore.subscribe((state) => {
      this.update()
    })
    this.subscriptions.push(unsubscribe)

    // Sprint 8.5: Read URL params to determine mode (survives refresh)
    const urlParams = new URLSearchParams(window.location.search)
    const editBatchName = urlParams.get('edit')
    const seriesId = urlParams.get('seriesId')

    if (editBatchName) {
      // Edit mode: User clicked "Edit Batch" button
      // Set mode from URL (handles refresh case)
      if (playlistsStore.mode !== 'EDITING' || playlistsStore.editContext?.batchName !== editBatchName) {
        console.log('[PlaylistsView] URL indicates edit mode, setting from URL:', editBatchName)
        // If refreshed, we need to reload the batch playlists from store/localStorage
        playlistsStore.setEditMode(decodeURIComponent(editBatchName), seriesId, null)
      }

      // Only recover from localStorage in EDIT mode (for refresh)
      if (playlistsStore.getPlaylists().length === 0) {
        if (playlistsStore.loadFromLocalStorage()) {
          console.log('[PlaylistsView] Recovered playlists from LocalStorage (edit mode)')
        }
      }
    } else {
      // Create mode: User came from Albums view or Add Playlists
      // Sprint 12.5 FIX: Only clear if there are NO playlists for this series
      // BlendingMenuView sets playlists BEFORE navigation, so we need to preserve them
      const existingPlaylists = playlistsStore.getPlaylists()
      const existingSeriesId = playlistsStore.seriesId

      if (existingPlaylists.length > 0 && existingSeriesId === seriesId) {
        // Fresh playlists from BlendingMenuView - preserve them!
        console.log('[PlaylistsView] Create mode - preserving fresh playlists from generation:', existingPlaylists.length)
      } else {
        // Stale playlists from different series or truly empty - clear and set create mode
        console.log('[PlaylistsView] Create mode - clearing stale playlists (different series or empty)')
        playlistsStore.setCreateMode()
        playlistsStore.playlists = []
      }
    }

    // Generate button
    const generateBtn = this.$('#generateBtn')
    if (generateBtn) {
      this.on(generateBtn, 'click', () => this.handleGenerate())
    }

    // Undo/Redo
    const undoBtn = this.$('#undoBtn')
    const redoBtn = this.$('#redoBtn')
    if (undoBtn) this.on(undoBtn, 'click', () => this.handleUndo())
    if (redoBtn) this.on(redoBtn, 'click', () => this.handleRedo())

    // Back button
    const backBtn = this.$('#backBtn')
    if (backBtn) {
      this.on(backBtn, 'click', () => router.navigate('/albums'))
    }

    // Drag and drop
    this.setupDragAndDrop()

    // Export buttons & Save History
    this.attachExportListeners()

    // Check for auto-generate flag
    // Note: urlParams and seriesId already declared above for mode detection
    // const urlParams = new URLSearchParams(window.location.search) - removed duplicate
    let seriesIdCheck = seriesId  // Use the already-parsed value

    if (seriesIdCheck === 'undefined' || seriesIdCheck === 'null') {
      seriesIdCheck = null
    }

    // Store persistence: Albums should already be loaded from AlbumsView
    // No recovery logic needed - store persists across navigation

    if (urlParams.get('generate') === 'true') {
      console.log('[PlaylistsView] Auto-generating playlists requested')
      // Remove param to prevent re-generation on refresh
      const newUrl = window.location.pathname + window.location.search.replace(/[?&]generate=true/, '')
      window.history.replaceState({}, '', newUrl)

      // Trigger generation after a short delay to ensure stores are ready
      setTimeout(() => this.handleGenerate(), 500)
    }
  }

  // REMOVED: recoverSeriesData() method
  // Architectural change: Store now persists data across navigation.
  // Recovery logic no longer needed - data is loaded once in AlbumsView and persists.

  async handleGenerate() {
    const albums = albumsStore.getAlbums()
    console.log('[PlaylistsView] handleGenerate - albums:', albums.length)

    if (albums.length === 0) {
      toast.warning('No albums loaded. Please go back and load albums first.')
      return
    }

    // Check for ratings
    // Check for ratings
    const ratedAlbums = albums.filter(a => a.acclaim?.hasRatings || a.tracks?.some(t => t.rating || (t.spotifyPopularity !== undefined && t.spotifyPopularity > -1)))

    if (ratedAlbums.length === 0) {
      if (!confirm('⚠️ No ratings detected on any albums. Playlists may be unbalanced. Continue anyway?')) {
        return
      }
    }

    // Get selected algorithm from radio buttons
    const selectedRadio = this.container.querySelector('input[name="algorithm"]:checked')
    if (selectedRadio) {
      this.selectedAlgorithmId = selectedRadio.value
    }

    // Get selected ranking strategy
    const rankingSelect = this.container.querySelector('#rankingStrategySelect')
    if (rankingSelect) {
      this.selectedRankingId = rankingSelect.value
    }

    console.log('[PlaylistsView] Generating with:', {
      algorithm: this.selectedAlgorithmId,
      ranking: this.selectedRankingId
    })

    // VALIDATION: Check if data exists for selected strategy
    if (this.selectedRankingId === 'spotify') {
      const hasSpotifyData = albums.some(a => a.tracks?.some(t => t.spotifyPopularity !== undefined && t.spotifyPopularity > -1))
      if (!hasSpotifyData) {
        if (!confirm('⚠️ No Spotify Popularity data detected! The "Spotify Popularity" strategy will fallback to Acclaim ratings.\n\nTip: Go to Albums view and run "Enrich with Spotify" first.\n\nContinue anyway?')) {
          return
        }
      }
    }

    this.isGenerating = true
    this.update()

    try {
      // Sprint 12.5: Use centralized PlaylistGenerationService
      const result = playlistGenerationService.generate(albums, {
        algorithmId: this.selectedAlgorithmId,
        rankingId: this.selectedRankingId
      })

      const playlists = result.playlists

      console.log('[PlaylistsView] Generated playlists:', playlists.length)

      // FIX: Pass seriesId to store to link playlists to this specific series
      const activeSeries = albumSeriesStore.getActiveSeries()
      playlistsStore.setPlaylists(playlists, activeSeries ? activeSeries.id : null)

      console.log('[PlaylistsView] Playlists set in store for series:', activeSeries ? activeSeries.id : 'unknown',
        `(mode: ${playlistsStore.mode})`)

      // Force immediate update
      this.isGenerating = false
      await this.update()
      console.log('[PlaylistsView] View updated')
    } catch (error) {
      console.error('[PlaylistsView] Generation failed:', error)
      toast.error(`Failed to generate playlists: ${error.message}`)
      this.isGenerating = false
      this.update()
    }
  }

  setupDragAndDrop() {
    // Clean up old instances
    if (this.sortables) {
      this.sortables.forEach(s => s.destroy())
    }
    this.sortables = []

    // Initialize Sortable on all playlist containers
    const containers = this.container.querySelectorAll('.playlist-tracks')

    containers.forEach(container => {
      const sortable = new Sortable(container, {
        group: 'shared-playlists', // Allow dragging between lists
        animation: 150,
        delay: 100, // Slight delay to prevent accidental drags on touch
        delayOnTouchOnly: true,
        touchStartThreshold: 3, // Tolerance for touch
        ghostClass: 'bg-white/5',
        dragClass: 'opacity-100',
        handle: '.track-item', // Make the whole item draggable (or use .track-drag-handle if preferred)

        // Haptic feedback on drag start
        onStart: () => {
          this.isDragging = true // Prevent re-render during drag
          if ('vibrate' in navigator) {
            navigator.vibrate(50) // Short pulse when picking up
          }
        },

        onEnd: (evt) => {
          // Haptic feedback on drop
          if ('vibrate' in navigator) {
            navigator.vibrate([20, 30, 20]) // Double pulse pattern when dropping
          }

          const { from, to, oldIndex, newIndex } = evt

          // If dropped outside or no change
          if (!to || (from === to && oldIndex === newIndex)) {
            this.isDragging = false
            return
          }

          const fromPlaylistIndex = parseInt(from.dataset.playlistIndex)
          const toPlaylistIndex = parseInt(to.dataset.playlistIndex)

          if (from === to) {
            // Reorder within same playlist
            console.log(`[Sortable] Reorder in playlist ${fromPlaylistIndex}: ${oldIndex} -> ${newIndex}`)
            playlistsStore.reorderTrack(fromPlaylistIndex, oldIndex, newIndex)
          } else {
            // Move to different playlist
            console.log(`[Sortable] Move ${fromPlaylistIndex}->${toPlaylistIndex}: ${oldIndex} -> ${newIndex}`)
            playlistsStore.moveTrack(fromPlaylistIndex, toPlaylistIndex, oldIndex, newIndex)
          }

          // Re-enable re-render AFTER store update is processed
          // Use requestAnimationFrame to ensure update() runs with isDragging=true first
          requestAnimationFrame(() => {
            this.isDragging = false
            // Trigger deferred update to refresh track counts/durations
            this.update()
          })
        }
      })
      this.sortables.push(sortable)
    })
  }

  // Removed manual handleDragStart/Over/Drop/End as Sortable handles them

  handleUndo() {
    if (playlistsStore.undo()) {
      console.log('✅ Undo successful')
    }
  }

  handleRedo() {
    if (playlistsStore.redo()) {
      console.log('✅ Redo successful')
    }
  }

  // Sprint 10: Delegate to modular export
  handleExportJson() {
    handleExportJsonFn()
  }

  // Sprint 10: Delegate to modular export
  async handleExportToAppleMusic() {
    const btn = this.$('#exportAppleMusicBtn')
    await handleExportToAppleMusicFn({ btn })
  }

  calculateDuration(tracks) {
    const totalSeconds = tracks.reduce((sum, t) => sum + (t.duration || 0), 0)
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  escapeHtml(text) {
    if (!text) return ''
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}
