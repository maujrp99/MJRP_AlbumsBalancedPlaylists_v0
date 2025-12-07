import { BaseView } from './BaseView.js'
import { playlistsStore } from '../stores/playlists.js'
import { albumsStore } from '../stores/albums.js'
import { albumSeriesStore } from '../stores/albumSeries.js'
import { apiClient } from '../api/client.js'
import { router } from '../router.js'
import { Breadcrumb } from '../components/Breadcrumb.js'
import { getIcon } from '../components/Icons.js'

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

        <div id="mainContent" class="fade-in" style="animation-delay: 0.1s">
          ${playlists.length === 0 ? this.renderGenerateSection() : ''}

          <div class="playlists-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="playlistsGrid">
            ${this.renderPlaylists(playlists)}
          </div>
        </div>

        <div id="exportSection" class="mt-8 fade-in" style="animation-delay: 0.2s">
          ${playlists.length > 0 ? this.renderExportSection() : ''}
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
        // Re-attach export listeners would go here
      }

      const footerTime = this.$('.last-update')
      if (footerTime) footerTime.textContent = `Last updated: ${new Date().toLocaleTimeString()}`
    }
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
      <div class="export-section">
        <h3>Export Playlists</h3>
        <div class="export-actions">
          <button class="btn btn-primary" id="exportSpotifyBtn">
            🎵 Export to Spotify
          </button>
          <button class="btn btn-primary" id="exportAppleMusicBtn">
            🍎 Export to Apple Music
          </button>
          <button class="btn btn-secondary" id="exportJsonBtn">
            💾 Download JSON
          </button>
        </div>
      </div>
    `
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

    // Series Selector - REMOVED (Product Decision: Simplify UX, close Issue #21)
    // Users must navigate back to Albums view to switch series

    // Export buttons (Sprint 5-6 placeholders)
    const exportSpotify = this.$('#exportSpotifyBtn')
    const exportAppleMusic = this.$('#exportAppleMusicBtn')
    const exportJson = this.$('#exportJsonBtn')

    if (exportSpotify) {
      this.on(exportSpotify, 'click', () => alert('🎵 Spotify export coming in Sprint 5!'))
    }
    if (exportAppleMusic) {
      this.on(exportAppleMusic, 'click', () => alert('🍎 Apple Music export coming in Sprint 6!'))
    }
    if (exportJson) {
      this.on(exportJson, 'click', () => this.handleExportJson())
    }

    // Check for auto-generate flag
    const urlParams = new URLSearchParams(window.location.search)
    const seriesId = urlParams.get('seriesId')

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
      alert('⚠️ No albums loaded. Please go back and load albums first.')
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
      alert('⚠️ Failed to generate playlists. Please try again.')
      this.isGenerating = false
      this.update()
    }
  }

  setupDragAndDrop() {
    // Delegate drag events
    this.on(this.container, 'dragstart', (e) => {
      if (e.target.classList.contains('track-item')) {
        this.handleDragStart(e)
      }
    })

    this.on(this.container, 'dragover', (e) => {
      e.preventDefault()
      this.handleDragOver(e)
    })

    this.on(this.container, 'drop', (e) => {
      e.preventDefault()
      this.handleDrop(e)
    })

    this.on(this.container, 'dragend', () => {
      this.handleDragEnd()
    })
  }

  handleDragStart(e) {
    const trackEl = e.target
    this.draggedTrack = {
      playlist: parseInt(trackEl.dataset.playlistIndex),
      track: parseInt(trackEl.dataset.trackIndex)
    }
    trackEl.classList.add('dragging')
  }

  handleDragOver(e) {
    const trackEl = e.target.closest('.track-item')
    if (trackEl && !trackEl.classList.contains('dragging')) {
      trackEl.classList.add('drag-over')
    }
  }

  handleDrop(e) {
    const targetEl = e.target.closest('.track-item') || e.target.closest('.playlist-tracks')

    if (!targetEl || !this.draggedTrack) return

    const toPlaylist = parseInt(targetEl.dataset.playlistIndex)
    const toTrack = targetEl.dataset.trackIndex ? parseInt(targetEl.dataset.trackIndex) : null

    const { playlist: fromPlaylist, track: fromTrack } = this.draggedTrack

    if (fromPlaylist === toPlaylist && toTrack !== null) {
      // Reorder within same playlist
      playlistsStore.reorderTrack(fromPlaylist, fromTrack, toTrack)
    } else if (toPlaylist !== null && toPlaylist !== fromPlaylist) {
      // Move to different playlist
      playlistsStore.moveTrack(fromPlaylist, toPlaylist, fromTrack, toTrack || 0)
    }
  }

  handleDragEnd() {
    this.draggedTrack = null
    // Remove drag classes
    this.$$('.dragging').forEach(el => el.classList.remove('dragging'))
    this.$$('.drag-over').forEach(el => el.classList.remove('drag-over'))
  }

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
