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

/**
 * PlaylistsView
 * Playlist generation, editing, and management
 */

export class PlaylistsView extends BaseView {
  constructor() {
    super()
    this.isGenerating = false
    this.draggedTrack = null
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
          
          <div class="header-content flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h1 class="flex items-center gap-3">
              ${getIcon('Music', 'w-8 h-8')} Playlist Management
            </h1>
            
            <div class="header-actions flex items-center gap-4">
               <!-- Series Selector & Navigation REMOVED: Simplified UX -->
            </div>
          </div>
        </header>

        <!-- Export Section (Top) -->
        <div id="exportSection" class="mb-6 fade-in" style="animation-delay: 0.05s">
          ${playlists.length > 0 ? this.renderExportSection() : ''}
        </div>

        <div id="mainContent" class="fade-in" style="animation-delay: 0.1s">
          ${playlists.length === 0 ? this.renderGenerateSection() : ''}

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

    // Update Main Content logic
    const mainContent = this.$('#mainContent')
    const exportSection = this.$('#exportSection')

    if (mainContent) {
      if (playlists.length === 0) {
        // Always re-render generate section to reflect potential changes in album count (e.g. after recovery)
        mainContent.innerHTML = this.renderGenerateSection() + '<div class="playlists-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="playlistsGrid"></div>'

        const generateBtn = this.$('#generateBtn')
        if (generateBtn) this.on(generateBtn, 'click', () => this.handleGenerate())
      } else {
        const generateSection = this.$('.generate-section')
        if (generateSection) generateSection.remove()

        const grid = this.$('#playlistsGrid')
        if (grid) grid.innerHTML = this.renderPlaylists(playlists)
      }

      if (exportSection) {
        exportSection.innerHTML = playlists.length > 0 ? this.renderExportSection() : ''
        this.attachExportListeners()
      }

      const footerTime = this.$('.last-update')
      if (footerTime) footerTime.textContent = `Last updated: ${new Date().toLocaleTimeString()}`
    }
  }

  attachExportListeners() {
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
      this.on(exportAppleMusic, 'click', () => toast.info('Apple Music export coming in Sprint 6!'))
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

  renderGenerateSection() {
    const albums = albumsStore.getAlbums()
    const albumCount = albums.length

    return `
      <div class="generate-section glass-panel max-w-2xl mx-auto text-center p-8">
        <h2 class="text-2xl font-bold mb-4">Generate Balanced Playlists</h2>
        <p class="text-muted mb-8">Create playlists from your ${albumCount} ranked album${albumCount !== 1 ? 's' : ''} using our balanced algorithm.</p>
        
        <div id="playlistError" class="alert alert-danger mb-6" style="display: none;"></div>

        ${albumCount === 0 ? `
          <div class="alert alert-warning bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 p-4 rounded-xl">
            <strong class="flex items-center justify-center gap-2 mb-2">${getIcon('AlertTriangle', 'w-5 h-5')} No albums loaded</strong>
            <p>Please go back and load albums first.</p>
          </div>
        ` : `
          <div class="generate-options grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-left">
            <div class="option-group">
              <label for="playlistCount" class="block text-sm font-semibold mb-2">Number of playlists</label>
              <select id="playlistCount" class="form-control">
                <option value="3">3 playlists</option>
                <option value="4" selected>4 playlists</option>
                <option value="5">5 playlists</option>
              </select>
            </div>

            <div class="option-group">
              <label for="minDuration" class="block text-sm font-semibold mb-2">Min duration (min)</label>
              <input type="number" id="minDuration" class="form-control" value="30" min="20" max="90" />
            </div>

            <div class="option-group">
              <label for="maxDuration" class="block text-sm font-semibold mb-2">Max duration (min)</label>
              <input type="number" id="maxDuration" class="form-control" value="60" min="30" max="120" />
            </div>
          </div>

          <button class="btn btn-primary btn-large w-full justify-center" id="generateBtn">
            ${getIcon('Rocket', 'w-5 h-5')} Generate Playlists
          </button>
        `}
      </div>
    `
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
          <button class="btn btn-warning flex items-center gap-2" id="regenerateBtn" title="Regenerate playlists using current albums (including newly added ones)">
            ${getIcon('Refresh', 'w-5 h-5')} Regenerate
          </button>
          <button class="btn btn-success flex items-center gap-2" id="saveToHistoryBtn">
            ${getIcon('Cloud', 'w-5 h-5')} Save to Series History
          </button>
          <div class="h-auto w-px bg-white/10 mx-2"></div>
          <button class="btn btn-primary flex items-center gap-2" id="exportSpotifyBtn">
            Export to Spotify
          </button>
          <button class="btn btn-primary flex items-center gap-2" id="exportAppleMusicBtn">
            Export to Apple Music
          </button>
          <button class="btn btn-secondary flex items-center gap-2" id="exportJsonBtn">
            Download JSON
          </button>
        </div>
      </div>
    `
  }

  async handleSaveToHistory() {
    const btn = this.$('#saveToHistoryBtn')
    if (btn) {
      btn.disabled = true
      btn.textContent = 'Saving...'
    }

    try {
      const { db, cacheManager, auth } = await import('../app.js')
      const userId = auth.currentUser ? auth.currentUser.uid : 'anonymous-user'

      // 1. Ensure Parent Series Exists (Upsert)
      const activeSeries = albumSeriesStore.getActiveSeries()
      if (activeSeries) {
        const { SeriesRepository } = await import('../repositories/SeriesRepository.js')
        const seriesRepo = new SeriesRepository(db, cacheManager, userId)

        // Sanitize series object (minimal payload to avoid rule violations)
        const seriesData = {
          id: activeSeries.id,
          name: activeSeries.name || 'Untitled Series',
          sourceType: activeSeries.sourceType || 'unknown',
          // Only include albumQueries if they exist and are array
          albumQueries: Array.isArray(activeSeries.albumQueries) ? activeSeries.albumQueries : [],
          updatedAt: new Date().toISOString()
        }

        console.log('[PlaylistsView] 1. Saving Series Parent:', activeSeries.id, seriesData)
        try {
          await seriesRepo.save(activeSeries.id, seriesData)
          console.log('[PlaylistsView] ✅ Series Parent Saved')
        } catch (err) {
          console.error('[PlaylistsView] ❌ Failed to save Series Parent:', err)
          throw err // Propagate to outer catch
        }
      }

      // 2. Save Playlists (Subcollection)
      console.log('[PlaylistsView] 2. Saving Playlists Subcollection...')
      await playlistsStore.saveToFirestore(db, cacheManager, userId)
      console.log('[PlaylistsView] ✅ Playlists Saved')

      if (btn) {
        btn.className = 'btn btn-success flex items-center gap-2'
        btn.innerHTML = `${getIcon('Check', 'w-5 h-5')} Saved!`
        setTimeout(() => {
          btn.disabled = false
          btn.innerHTML = `${getIcon('Cloud', 'w-5 h-5')} Save to Series History`
        }, 2000)
      }
      toast.success('Playlists saved to series history!')
    } catch (error) {
      console.error('[PlaylistsView] ❌ Cloud Save Failed:', error)

      // FALLBACK: Save to LocalStorage so user doesn't lose data
      console.log('[PlaylistsView] Attempting Local Save (Fallback)...')
      playlistsStore.saveToLocalStorage()

      if (btn) {
        btn.className = 'btn btn-warning flex items-center gap-2'
        btn.innerHTML = `${getIcon('AlertTriangle', 'w-5 h-5')} Saved Locally Only`
        // Reset button after 3 seconds
        setTimeout(() => {
          btn.disabled = false
          btn.className = 'btn btn-success flex items-center gap-2' // Keep green/success look or revert to primary? 
          // Let's revert to primary Call To Action but maybe keep it enabled
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

    // Attempt recovery from LocalStorage if store is empty
    if (playlistsStore.getPlaylists().length === 0) {
      if (playlistsStore.loadFromLocalStorage()) {
        console.log('[PlaylistsView] Recovered playlists from LocalStorage')
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
    const urlParams = new URLSearchParams(window.location.search)
    let seriesId = urlParams.get('seriesId')

    if (seriesId === 'undefined' || seriesId === 'null') {
      seriesId = null
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

    const targetCount = parseInt(this.$('#playlistCount')?.value || '4')
    const minDuration = parseInt(this.$('#minDuration')?.value || '30')
    const maxDuration = parseInt(this.$('#maxDuration')?.value || '60')

    console.log('[PlaylistsView] Generating playlists with options:', { targetCount, minDuration, maxDuration })

    this.isGenerating = true
    this.update()

    try {
      const playlists = await apiClient.generatePlaylists(albums, {
        targetCount,
        minDuration,
        maxDuration
      })

      console.log('[PlaylistsView] Received playlists:', playlists)

      // FIX: Pass seriesId to store to link playlists to this specific series
      const activeSeries = albumSeriesStore.getActiveSeries()
      playlistsStore.setPlaylists(playlists, activeSeries ? activeSeries.id : null)

      console.log('[PlaylistsView] Playlists set in store for series:', activeSeries ? activeSeries.id : 'unknown')

      // Force immediate update
      this.isGenerating = false
      await this.update()
      console.log('[PlaylistsView] View updated')
    } catch (error) {
      console.error('[PlaylistsView] Generation failed:', error)
      toast.error('Failed to generate playlists. Please try again.')
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

        onEnd: (evt) => {
          const { from, to, oldIndex, newIndex } = evt

          // If dropped outside or no change
          if (!to || (from === to && oldIndex === newIndex)) {
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
