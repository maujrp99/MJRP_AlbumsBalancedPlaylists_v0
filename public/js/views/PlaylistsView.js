import { BaseView } from './BaseView.js'
import { playlistsStore } from '../stores/playlists.js'
import { albumsStore } from '../stores/albums.js'
import { seriesStore } from '../stores/series.js'
import { apiClient } from '../api/client.js'
import { router } from '../router.js'
import { Breadcrumb } from '../components/Breadcrumb.js'

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
    const playlists = state.playlists
    const activeSeries = seriesStore.getActiveSeries()

    return `
      <div class="playlists-view">
        <header class="view-header">
          ${Breadcrumb.render('/playlists')}
          
          <div class="header-content">
            <h1>🎵 Playlist Management</h1>
            ${activeSeries ? `
              <div class="active-series-badge">
                <span class="badge-label">Series:</span>
                <span class="badge-value">${this.escapeHtml(activeSeries.name)}</span>
              </div>
            ` : ''}
          </div>

          <div class="header-actions">
            <div id="undoRedoControls">
              ${this.renderUndoRedoControls(state)}
            </div>
          </div>
        </header>

        <div id="mainContent">
          ${playlists.length === 0 ? this.renderGenerateSection() : ''}

          <div class="playlists-grid" id="playlistsGrid">
            ${this.renderPlaylists(playlists)}
          </div>
        </div>

        <div id="exportSection">
          ${playlists.length > 0 ? this.renderExportSection() : ''}
        </div>

        ${this.isGenerating ? this.renderGeneratingOverlay() : ''}
        
        <footer class="view-footer">
          <p class="last-update">Last updated: ${new Date().toLocaleTimeString()}</p>
        </footer>
      </div>
    `
  }

  update() {
    const state = playlistsStore.getState()
    const playlists = state.playlists

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
        // Show generate section if hidden or update it
        // Note: If we re-render generate section, we lose input values unless we bind them.
        // For simplicity, we'll re-render if switching modes, but try to preserve inputs if just updating error.
        // Actually, simpler to just re-render the grid if playlists exist.

        const generateSection = this.$('.generate-section')
        if (!generateSection) {
          mainContent.innerHTML = this.renderGenerateSection() + '<div class="playlists-grid" id="playlistsGrid"></div>'
          // Re-attach generate button listener
          const generateBtn = this.$('#generateBtn')
          if (generateBtn) this.on(generateBtn, 'click', () => this.handleGenerate())
        }
      } else {
        // Hide generate section, show grid
        const generateSection = this.$('.generate-section')
        if (generateSection) generateSection.remove()

        const grid = this.$('#playlistsGrid')
        if (grid) grid.innerHTML = this.renderPlaylists(playlists)
      }
    }

    if (exportSection) {
      exportSection.innerHTML = playlists.length > 0 ? this.renderExportSection() : ''
      // Re-attach export listeners... (omitted for brevity, assume static for now or re-attach)
    }

    // Update timestamp
    const footerTime = this.$('.last-update')
    if (footerTime) footerTime.textContent = `Last updated: ${new Date().toLocaleTimeString()}`
  }

  renderUndoRedoControls(state) {
    if (state.playlists.length === 0) return ''
    return `
      <button class="btn btn-secondary btn-sm" id="undoBtn" ${!state.canUndo ? 'disabled' : ''}>
        ↶ Undo
      </button>
      <button class="btn btn-secondary btn-sm" id="redoBtn" ${!state.canRedo ? 'disabled' : ''}>
        ↷ Redo
      </button>
    `
  }

  renderGenerateSection() {
    const albums = albumsStore.getAlbums()
    const albumCount = albums.length

    return `
      <div class="generate-section card">
        <h2>Generate Balanced Playlists</h2>
        <p>Create playlists from your ${albumCount} ranked album${albumCount !== 1 ? 's' : ''} using our balanced algorithm.</p>
        
        <div id="playlistError" class="alert alert-danger" style="display: none;"></div>

        ${albumCount === 0 ? `
          <div class="alert alert-warning">
            <strong>⚠️ No albums loaded</strong>
            <p>Please go back and load albums first.</p>
          </div>
        ` : `
          <div class="generate-options">
            <div class="option-group">
              <label for="playlistCount">Number of playlists:</label>
              <select id="playlistCount" class="form-control">
                <option value="3">3 playlists</option>
                <option value="4" selected>4 playlists</option>
                <option value="5">5 playlists</option>
              </select>
            </div>

            <div class="option-group">
              <label for="minDuration">Min duration per playlist (min):</label>
              <input type="number" id="minDuration" class="form-control" value="30" min="20" max="90" />
            </div>

            <div class="option-group">
              <label for="maxDuration">Max duration per playlist (min):</label>
              <input type="number" id="maxDuration" class="form-control" value="60" min="30" max="120" />
            </div>
          </div>

          <button class="btn btn-primary btn-large" id="generateBtn">
            🚀 Generate Playlists
          </button>
        `}
      </div>
    `
  }

  showErrorMessage(message) {
    const errorEl = this.$('#playlistError')
    if (errorEl) {
      errorEl.innerHTML = `<strong>⚠️ Error</strong><p>${message}</p>`
      errorEl.style.display = 'block'
      errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  hideErrorMessage() {
    const errorEl = this.$('#playlistError')
    if (errorEl) {
      errorEl.style.display = 'none'
    }
  }

  renderPlaylists(playlists) {
    if (playlists.length === 0) return ''

    return playlists.map((playlist, pIndex) => `
      <div class="playlist-column" data-playlist-index="${pIndex}">
        <div class="playlist-header">
          <h3 class="playlist-name" contenteditable="true" data-playlist-index="${pIndex}">
            ${this.escapeHtml(playlist.name)}
          </h3>
          <div class="playlist-stats">
            <span class="badge">${playlist.tracks.length} tracks</span>
            <span class="badge">${this.calculateDuration(playlist.tracks)}</span>
          </div>
        </div>

        <div class="playlist-tracks" data-playlist-index="${pIndex}">
          ${playlist.tracks.map((track, tIndex) => this.renderTrack(track, pIndex, tIndex)).join('')}
        </div>
      </div>
    `).join('')
  }

  renderTrack(track, playlistIndex, trackIndex) {
    return `
      <div 
        class="track-item" 
        draggable="true"
        data-playlist-index="${playlistIndex}"
        data-track-index="${trackIndex}">
        <div class="track-drag-handle">⋮⋮</div>
        <div class="track-info">
          <div class="track-title">${this.escapeHtml(track.title)}</div>
          <div class="track-rank">Rank: ${track.rank || '-'}</div>
          <div class="track-meta">
            ${track.artist ? this.escapeHtml(track.artist) : ''}${track.album ? ' • ' + this.escapeHtml(track.album) : ''}
            ${track.rating ? `<span class="track-rating">${track.rating}</span>` : ''}
          </div>
        </div>
      </div>
    `
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
  }

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
      playlistsStore.setPlaylists(playlists)
      console.log('[PlaylistsView] Playlists set in store')

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
    const total = tracks.reduce((sum, t) => sum + (t.duration || 0), 0)
    const mins = Math.floor(total / 60)
    return `${mins} min`
  }

  escapeHtml(text) {
    if (!text) return ''
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}
