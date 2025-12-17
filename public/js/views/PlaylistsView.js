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
import { getAllAlgorithms, getRecommendedAlgorithm, createAlgorithm } from '../algorithms/index.js'

/**
 * PlaylistsView
 * Playlist generation, editing, and management
 */

export class PlaylistsView extends BaseView {
  constructor() {
    super()
    this.isGenerating = false
    this.draggedTrack = null
    this.exportListenersAttached = false // Prevent duplicate listener attachment
    this.isDragging = false // Prevent re-render during drag operations

    // Algorithm selection
    const recommended = getRecommendedAlgorithm()
    this.selectedAlgorithmId = recommended ? recommended.id : 's-draft-balanced'
  }

  async render(params) {
    const state = playlistsStore.getState()
    const activeSeries = albumSeriesStore.getActiveSeries()
    const allSeries = albumSeriesStore.getSeries()

    // FIX: Check for "Ghost Playlists" (Issue #19 equivalent)
    // If store has playlists but they belong to a different series, ignore them
    let playlists = state.playlists

    if (state.seriesId && activeSeries && state.seriesId !== activeSeries.id) {
      console.warn('[PlaylistsView] Detected playlists from different series. Ignoring.', {
        storeSeriesId: state.seriesId,
        activeSeriesId: activeSeries.id
      })
      playlists = [] // Treat as empty for this view
    }

    return `
      <div class="playlists-view container">
        <header class="view-header mb-8 fade-in">
          ${Breadcrumb.render('/playlists')}
          
          <div class="header-content mt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h1 class="text-4xl font-bold flex items-center gap-3">
              ${getIcon('Music', 'w-8 h-8')} Playlist Management
            </h1>
            
            <div class="header-actions flex items-center gap-4">
               <!-- Series Selector & Navigation REMOVED: Simplified UX -->
            </div>
          </div>
        </header>

        <!-- Algorithm Selector (Always visible) -->
        <div id="algorithmSection" class="mb-6 fade-in" style="animation-delay: 0.05s">
          ${this.renderAlgorithmSelector(playlists.length > 0)}
        </div>

        <!-- Export Section (Only when playlists exist) -->
        <div id="exportSection" class="mb-6 fade-in" style="animation-delay: 0.08s">
          ${playlists.length > 0 ? this.renderExportSection() : ''}
        </div>

        <div id="mainContent" class="fade-in" style="animation-delay: 0.1s">
          ${this.renderNoAlbumsWarning()}

          <div class="playlists-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="playlistsGrid">
            ${this.renderPlaylists(playlists)}
          </div>
        </div>

        ${this.isGenerating ? this.renderGeneratingOverlay() : ''}
        
        <footer class="view-footer mt-12 text-center text-muted text-sm border-t border-white/5 pt-6">
          <p class="last-update">Last updated: ${new Date().toLocaleTimeString()}</p>
        </footer>
      </div>
    `
  }

  update() {
    const state = playlistsStore.getState()
    const activeSeries = albumSeriesStore.getActiveSeries()

    // FIX: Apply same series validation to update()
    let playlists = state.playlists
    if (state.seriesId && activeSeries && state.seriesId !== activeSeries.id) {
      playlists = []
    }

    // Update Undo/Redo
    const undoRedo = this.$('#undoRedoControls')
    if (undoRedo) {
      undoRedo.innerHTML = this.renderUndoRedoControls(state)
      // Re-attach listeners for these buttons
      const undoBtn = this.$('#undoBtn')
      const redoBtn = this.$('#redoBtn')
      if (undoBtn) this.on(undoBtn, 'click', () => this.handleUndo())
      if (redoBtn) this.on(redoBtn, 'click', () => this.handleRedo())
    }

    // Update Algorithm Section (always visible)
    const algorithmSection = this.$('#algorithmSection')
    if (algorithmSection) {
      algorithmSection.innerHTML = this.renderAlgorithmSelector(playlists.length > 0)
      // Attach generate button listener
      const generateBtn = this.$('#generateBtn')
      if (generateBtn) this.on(generateBtn, 'click', () => this.handleGenerate())
    }

    // Update Main Content logic
    const mainContent = this.$('#mainContent')
    const exportSection = this.$('#exportSection')

    if (mainContent) {
      // Skip grid re-render during drag operations to prevent Sortable invalidation
      if (!this.isDragging) {
        // Update no albums warning
        const warningSection = mainContent.querySelector('.no-albums-warning')
        const albums = albumsStore.getAlbums()
        if (albums.length === 0 && !warningSection) {
          mainContent.insertAdjacentHTML('afterbegin', this.renderNoAlbumsWarning())
        } else if (albums.length > 0 && warningSection) {
          warningSection.remove()
        }

        const grid = this.$('#playlistsGrid')
        if (grid) grid.innerHTML = this.renderPlaylists(playlists)
      }

      if (exportSection) {
        // Reset flag since we're re-creating the DOM elements
        this.exportListenersAttached = false
        exportSection.innerHTML = playlists.length > 0 ? this.renderExportSection() : ''
        this.attachExportListeners()
      }

      const footerTime = this.$('.last-update')
      if (footerTime) footerTime.textContent = `Last updated: ${new Date().toLocaleTimeString()}`
    }
  }

  attachExportListeners() {
    // Prevent duplicate listener attachment
    if (this.exportListenersAttached) {
      console.log('[PlaylistsView] Export listeners already attached, skipping')
      return
    }

    const exportSpotify = this.$('#exportSpotifyBtn')
    const exportAppleMusic = this.$('#exportAppleMusicBtn')
    const exportJson = this.$('#exportJsonBtn')
    const saveHistory = this.$('#saveToHistoryBtn')
    const regenerate = this.$('#regenerateBtn')

    if (regenerate) {
      this.on(regenerate, 'click', () => this.handleGenerate())
    }
    if (exportSpotify) {
      this.on(exportSpotify, 'click', () => toast.info('Spotify export coming in Sprint 5!'))
    }
    if (exportAppleMusic) {
      this.on(exportAppleMusic, 'click', () => this.handleExportToAppleMusic())
      this.exportListenersAttached = true // Mark as attached
    }
    if (exportJson) {
      this.on(exportJson, 'click', () => this.handleExportJson())
    }
    if (saveHistory) {
      this.on(saveHistory, 'click', () => this.handleSaveToHistory())
    }

    // Re-initialize Drag and Drop after DOM updates
    this.setupDragAndDrop()
  }

  renderUndoRedoControls(state) {
    if (state.playlists.length === 0) return ''
    return `
      <button class="btn btn-secondary btn-sm" id="undoBtn" ${!state.canUndo ? 'disabled' : ''} title="Undo">
        ${getIcon('ArrowLeft', 'w-4 h-4')}
      </button>
      <button class="btn btn-secondary btn-sm" id="redoBtn" ${!state.canRedo ? 'disabled' : ''} title="Redo">
        ${getIcon('ArrowLeft', 'w-4 h-4 rotate-180')}
      </button>
    `
  }

  /**
   * Render algorithm selector - always visible
   * @param {boolean} hasPlaylists - Whether playlists already exist
   */
  renderAlgorithmSelector(hasPlaylists = false) {
    const albums = albumsStore.getAlbums()
    const albumCount = albums.length
    const algorithms = getAllAlgorithms()

    if (albumCount === 0) {
      return '' // No albums, show warning in main content instead
    }

    const buttonText = hasPlaylists ? 'Regenerate with Selected Algorithm' : 'Generate Playlists'
    const buttonIcon = hasPlaylists ? 'Refresh' : 'Rocket'

    return `
      <div class="algorithm-section glass-panel p-6">
        <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
          ${getIcon('Settings', 'w-5 h-5')} Algorithm Selection
        </h3>
        <p class="text-muted text-sm mb-4">
          ${hasPlaylists
        ? `Choose a different algorithm to regenerate playlists from your ${albumCount} albums.`
        : `Select an algorithm to generate playlists from your ${albumCount} ranked albums.`}
        </p>
        
        <div class="algorithm-options grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          ${algorithms.map(algo => `
            <label class="algorithm-option flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer
              ${this.selectedAlgorithmId === algo.id
            ? 'border-accent-primary bg-accent-primary/10'
            : 'border-white/10 bg-white/5 hover:border-white/20'}">
              <input type="radio" name="algorithm" value="${algo.id}" 
                ${this.selectedAlgorithmId === algo.id ? 'checked' : ''}
                class="mt-1 accent-accent-primary" />
              <div class="flex-1 text-left">
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-semibold text-sm">${algo.name}</span>
                  <span class="badge ${algo.isRecommended ? 'badge-success' : algo.badge === 'LEGACY' ? 'badge-warning' : 'badge-neutral'} text-xs">
                    ${algo.badge}
                  </span>
                </div>
                <p class="text-xs text-muted">${algo.description}</p>
              </div>
            </label>
          `).join('')}
        </div>

        <button class="btn ${hasPlaylists ? 'btn-warning' : 'btn-primary'} btn-large w-full justify-center" id="generateBtn">
          ${getIcon(buttonIcon, 'w-5 h-5')} ${buttonText}
        </button>
      </div>
    `
  }

  /**
   * Render no albums warning if needed
   */
  renderNoAlbumsWarning() {
    const albums = albumsStore.getAlbums()
    if (albums.length > 0) return ''

    return `
      <div class="no-albums-warning glass-panel max-w-2xl mx-auto text-center p-8 mb-6">
        <div class="alert alert-warning bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 p-4 rounded-xl">
          <strong class="flex items-center justify-center gap-2 mb-2">${getIcon('AlertTriangle', 'w-5 h-5')} No albums loaded</strong>
          <p>Please go back and load albums first before generating playlists.</p>
        </div>
      </div>
    `
  }

  // DEPRECATED: Use renderAlgorithmSelector() instead
  renderGenerateSection() {
    return this.renderAlgorithmSelector(false)
  }

  renderPlaylists(playlists) {
    if (playlists.length === 0) return ''

    return playlists.map((playlist, pIndex) => `
      <div class="playlist-column glass-panel flex flex-col h-full" data-playlist-index="${pIndex}">
        <div class="playlist-header mb-4 pb-4 border-b border-white/10">
          <h3 class="playlist-name text-lg font-bold mb-2 outline-none focus:text-accent-primary transition-colors" contenteditable="true" data-playlist-index="${pIndex}">
            ${this.escapeHtml(playlist.name)}
          </h3>
          <div class="playlist-stats flex gap-2">
            <span class="badge badge-neutral text-xs">${playlist.tracks.length} tracks</span>
            <span class="badge badge-neutral text-xs">${this.calculateDuration(playlist.tracks)}</span>
          </div>
        </div>

        <div class="playlist-tracks flex-1 overflow-y-auto min-h-[200px] space-y-2" data-playlist-index="${pIndex}">
          ${playlist.tracks.map((track, tIndex) => this.renderTrack(track, pIndex, tIndex)).join('')}
        </div>
      </div>
    `).join('')
  }

  renderTrack(track, playlistIndex, trackIndex) {
    const ratingClass = this.getRatingClass(track.rating)

    return `
      <div 
        class="track-item bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg p-3 cursor-move transition-all group relative" 
        draggable="true"
        data-playlist-index="${playlistIndex}"
        data-track-index="${trackIndex}">
        
        <div class="track-drag-handle absolute left-2 top-1/2 -translate-y-1/2 text-muted opacity-0 group-hover:opacity-50 hover:!opacity-100 cursor-grab">
            ${getIcon('GripVertical', 'w-4 h-4')}
        </div>

        <div class="track-info pl-6">
          <div class="flex justify-between items-start gap-2">
            <div class="track-title font-medium text-sm line-clamp-1" title="${this.escapeHtml(track.title)}">${this.escapeHtml(track.title)}</div>
            <div class="flex items-center gap-1">
              ${track.rank ? `<span class="badge badge-neutral text-[10px] px-1.5 py-0.5 h-fit">#${track.rank}</span>` : ''}
              ${track.rating ? `<span class="badge ${ratingClass} text-[10px] px-1.5 py-0.5 h-fit">${track.rating}</span>` : ''}
            </div>
          </div>
          
          <div class="track-meta text-xs text-muted mt-1 space-y-0.5">
            ${track.artist ? `<div class="truncate">${this.escapeHtml(track.artist)}</div>` : ''}
            <div class="flex justify-between items-center">
              ${track.album ? `<span class="truncate opacity-70">${this.escapeHtml(track.album)}</span>` : '<span></span>'}
              <span class="font-mono opacity-70">${this.formatDuration(track.duration)}</span>
            </div>
          </div>
        </div>
      </div>
    `
  }

  getRatingClass(rating) {
    if (!rating) return ''
    if (rating >= 90) return 'badge-success' // Green
    if (rating >= 70) return 'badge-warning' // Yellow/Orange
    return 'badge-danger'                    // Red
  }

  formatDuration(seconds) {
    if (!seconds) return '-'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

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
      // DO NOT recover from localStorage - we want a clean slate
      console.log('[PlaylistsView] Create mode - clearing any stale playlists')
      playlistsStore.setCreateMode()
      playlistsStore.playlists = [] // Clear any stale data
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
    const ratedAlbums = albums.filter(a => a.acclaim?.hasRatings || a.tracks?.some(t => t.rating))
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

    console.log('[PlaylistsView] Generating playlists with algorithm:', this.selectedAlgorithmId)

    this.isGenerating = true
    this.update()

    try {
      // Create algorithm instance
      const algorithm = createAlgorithm(this.selectedAlgorithmId)

      if (!algorithm) {
        throw new Error(`Unknown algorithm: ${this.selectedAlgorithmId}`)
      }

      // Generate playlists using selected algorithm
      console.log('[PlaylistsView] Using algorithm:', algorithm.constructor.getMetadata().name)
      const result = algorithm.generate(albums)

      // Transform result to playlist format expected by store
      const playlists = result.playlists.map(p => ({
        name: p.title,
        tracks: p.tracks.map(t => ({
          id: t.id,
          title: t.title,
          artist: t.artist,
          album: t.album,
          duration: t.duration,
          rating: t.rating,
          rank: t.rank || t.acclaimRank
        }))
      }))

      console.log('[PlaylistsView] Generated playlists:', playlists.length)

      // Sprint 8.5: No need to preserve batch context anymore - mode is explicit in store
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

  handleExportJson() {
    const playlists = playlistsStore.getPlaylists()
    const json = JSON.stringify(playlists, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `playlists_${new Date().toISOString().split('T')[0]}.json`
    a.click()

    URL.revokeObjectURL(url)
  }

  async handleExportToAppleMusic() {
    const btn = this.$('#exportAppleMusicBtn')
    const originalText = btn?.innerHTML

    try {
      // 1. Import MusicKitService
      const { musicKitService } = await import('../services/MusicKitService.js')

      // 2. Initialize MusicKit
      if (btn) {
        btn.disabled = true
        btn.innerHTML = `${getIcon('Apple', 'w-5 h-5 animate-spin')} Connecting...`
      }

      await musicKitService.init()

      // 3. Authorize user (get library access)
      if (btn) btn.innerHTML = `${getIcon('Apple', 'w-5 h-5')} Authorizing...`
      await musicKitService.authorize()

      const playlists = playlistsStore.getPlaylists()
      if (playlists.length === 0) {
        toast.warning('No playlists to export')
        return
      }

      // 4. Get active series name for folder
      const activeSeries = albumSeriesStore.getActiveSeries()
      const seriesName = activeSeries?.name || 'MJRP Playlists'

      // 5. Create or find folder with series name
      if (btn) btn.innerHTML = `${getIcon('Apple', 'w-5 h-5')} Creating folder...`
      const folderId = await musicKitService.createOrGetFolder(seriesName)

      let successCount = 0
      let warningCount = 0

      // 6. Export each playlist
      for (const playlist of playlists) {
        const playlistName = `${seriesName} - ${playlist.name}`
        if (btn) btn.innerHTML = `${getIcon('Apple', 'w-5 h-5')} Exporting ${playlist.name}...`

        // Find tracks in Apple Music catalog with improved matching
        const trackIds = []
        const notFound = []

        for (const track of playlist.tracks) {
          // Use improved matching with album name and live album detection
          const isLiveAlbum = track.album?.toLowerCase().includes('live') || false
          const found = await musicKitService.findTrackFromAlbum(
            track.title,
            track.artist,
            track.album || '',
            isLiveAlbum
          )
          if (found) {
            trackIds.push(found.id)
          } else {
            notFound.push(`${track.artist} - ${track.title}`)
          }
        }

        if (trackIds.length > 0) {
          // Create playlist inside series folder
          await musicKitService.createPlaylistInFolder(playlistName, trackIds, folderId)
          successCount++

          if (notFound.length > 0) {
            console.warn(`[AppleMusic] Tracks not found in ${playlist.name}:`, notFound)
            warningCount += notFound.length
          }
        } else {
          toast.warning(`Could not find any tracks for "${playlist.name}"`)
        }

        // Small delay between playlist creations
        await new Promise(r => setTimeout(r, 500))
      }

      // 7. Show result
      if (successCount > 0) {
        if (warningCount > 0) {
          toast.success(`${successCount} playlist(s) exported to "${seriesName}" folder! (${warningCount} tracks not found)`)
        } else {
          toast.success(`${successCount} playlist(s) exported to "${seriesName}" folder! 🎉`)
        }
      } else {
        toast.error('Failed to export playlists')
      }

    } catch (error) {
      console.error('[AppleMusic] Export failed:', error)

      if (error.message?.includes('not configured')) {
        toast.error('Apple Music not configured. Please set up MusicKit credentials.')
      } else if (error.message?.includes('Authorization')) {
        toast.warning('Apple Music authorization was cancelled')
      } else {
        toast.error(`Export failed: ${error.message}`)
      }
    } finally {
      if (btn) {
        btn.disabled = false
        btn.innerHTML = originalText || 'Export to Apple Music'
      }
    }
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
