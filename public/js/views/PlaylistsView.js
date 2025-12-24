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

    // Ranking Strategy selection
    this.selectedRankingId = 'balanced'
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

        <!-- Generation Settings (Algorithm + Ranking) -->
        <div id="algorithmSection" class="mb-6 fade-in" style="animation-delay: 0.05s">
          ${this.renderSettingsSection(playlists.length > 0)}
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

    // Update Settings Section
    const algorithmSection = this.$('#algorithmSection')
    if (algorithmSection) {
      algorithmSection.innerHTML = this.renderSettingsSection(playlists.length > 0)

      const generateBtn = this.$('#generateBtn')
      if (generateBtn) this.on(generateBtn, 'click', () => this.handleGenerate())

      // Attach listener for ranking strategy dropdown if needed (though it's standard input)
      const rankingSelect = this.$('#rankingStrategySelect')
      if (rankingSelect) {
        this.on(rankingSelect, 'change', (e) => {
          this.selectedRankingId = e.target.value
          // Update description dynamically
          const rankingStrategies = [
            BalancedRankingStrategy.metadata,
            SpotifyRankingStrategy.metadata,
            BEARankingStrategy.metadata
          ]
          const selectedStrat = rankingStrategies.find(s => s.id === this.selectedRankingId)
          const descriptionEl = this.$('#rankingDescription')
          if (descriptionEl && selectedStrat) {
            descriptionEl.textContent = selectedStrat.description
          }
          console.log('[PlaylistsView] Selected ranking strategy:', this.selectedRankingId)
        })
      }
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
      this.on(exportSpotify, 'click', async () => {
        const { showSpotifyExportModal } = await import('../components/SpotifyExportModal.js')
        showSpotifyExportModal()
      })
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
   * Render consolidated Settings Section (Algorithm + Ranking)
   */
  renderSettingsSection(hasPlaylists = false) {
    const albums = albumsStore.getAlbums()
    const albumCount = albums.length
    const algorithms = getAllAlgorithms()

    if (albumCount === 0) return ''

    const buttonText = hasPlaylists ? 'Regenerate Playlists' : 'Generate Playlists'
    const buttonIcon = hasPlaylists ? 'Refresh' : 'Rocket'

    // Ranking Strategies Metadata
    const rankingStrategies = [
      BalancedRankingStrategy.metadata,
      SpotifyRankingStrategy.metadata,
      BEARankingStrategy.metadata
    ]

    return `
      <div class="settings-section glass-panel p-6">
        <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
          ${getIcon('Settings', 'w-5 h-5')} Generation Settings
        </h3>
        
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
            <!-- Left: Algorithm Selection (Output) -->
            <div class="lg:col-span-8">
                <label class="block text-sm font-medium text-muted mb-3">1. Distribution Algorithm (Output)</label>
                <div class="algorithm-options grid grid-cols-1 md:grid-cols-2 gap-3">
                  ${algorithms.map(algo => `
                    <label class="algorithm-option flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer h-full
                      ${this.selectedAlgorithmId === algo.id
        ? 'border-accent-primary bg-accent-primary/10'
        : 'border-white/10 bg-white/5 hover:border-white/20'}">
                      <input type="radio" name="algorithm" value="${algo.id}" 
                        ${this.selectedAlgorithmId === algo.id ? 'checked' : ''}
                        class="mt-1 accent-accent-primary" />
                      <div class="flex-1 text-left">
                        <div class="flex items-center gap-2 mb-1">
                          <span class="font-semibold text-sm">${algo.name}</span>
                          <span class="badge ${algo.isRecommended ? 'badge-success' : algo.badge === 'LEGACY' ? 'badge-warning' : 'badge-neutral'} text-[10px] px-1.5 py-0.5">
                            ${algo.badge}
                          </span>
                        </div>
                        <p class="text-xs text-muted line-clamp-2">${algo.description}</p>
                      </div>
                    </label>
                  `).join('')}
                </div>
            </div>

            <!-- Right: Ranking Strategy (Input) -->
            <div class="lg:col-span-4">
                 <label class="block text-sm font-medium text-muted mb-3">2. Ranking Source (Input)</label>
                 <div class="bg-white/5 rounded-xl border border-white/10 p-4 h-full">
                    <p class="text-xs text-muted mb-3">
                        Choose the "Source of Truth" for how tracks are ranked (S-Tier vs Deep Cuts).
                    </p>
                    <select id="rankingStrategySelect" class="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm focus:border-accent-primary focus:outline-none transition-colors">
                        ${rankingStrategies.map(strat => `
                            <option value="${strat.id}" ${this.selectedRankingId === strat.id ? 'selected' : ''}>
                                ${strat.name}
                            </option>
                        `).join('')}
                    </select>
                    
                    <div class="mt-4 p-3 bg-white/5 rounded-lg border border-white/5">
                        <div class="flex items-start gap-2">
                             ${getIcon('Info', 'w-4 h-4 text-accent-primary mt-0.5')}
                             <p class="text-xs text-muted" id="rankingDescription">
                                ${rankingStrategies.find(s => s.id === this.selectedRankingId)?.description || ''}
                             </p>
                        </div>
                    </div>
                 </div>
            </div>
        </div>

        <button class="btn ${hasPlaylists ? 'btn-warning' : 'btn-primary'} btn-large w-full justify-center" id="generateBtn">
          ${getIcon(buttonIcon, 'w-5 h-5')} ${buttonText}
        </button>
      </div>
    `
  }

  // Backwards compatibility shim
  renderAlgorithmSelector(hasPlaylists) {
    return this.renderSettingsSection(hasPlaylists)
  }

  /**
   * Render no albums warning if needed
   * Sprint 12.5 FIX: Don't show warning if playlists already exist
   * (albums were loaded during generation, just not stored in albumsStore)
   */
  renderNoAlbumsWarning() {
    // If we have playlists, albums must have been loaded at some point
    const playlists = playlistsStore.getPlaylists()
    if (playlists.length > 0) return ''

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
          <h3 class="playlist-name text-lg font-bold mb-2 outline-none focus:text-accent-primary transition-colors flex items-center gap-2" contenteditable="true" data-playlist-index="${pIndex}">
            <span class="text-accent-primary font-mono">${pIndex + 1}.</span>
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

    // Sprint 12: Color-coded rank badges
    // Acclaim = Orange, Popularity = Spotify Green
    const hasAcclaimRank = track.rank && track.rank < 999
    const hasSpotifyRank = track.spotifyRank && track.spotifyRank < 999
    const hasSpotifyPop = track.spotifyPopularity != null && track.spotifyPopularity > -1

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
            <div class="flex items-center gap-1.5">
              ${hasAcclaimRank
        ? `<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-orange/10 text-brand-orange text-[10px] font-bold border border-brand-orange/20">#${track.rank}</span>`
        : ''}
              ${track.rating
        ? `<span class="flex items-center gap-0.5 text-[10px] font-bold"><span class="text-brand-orange">★</span>${track.rating}</span>`
        : ''}
              ${hasSpotifyRank
        ? `<span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#1DB954]/10 text-[#1DB954] text-[10px] font-bold border border-[#1DB954]/20">#${track.spotifyRank}</span>`
        : ''}
              ${hasSpotifyPop
        ? `<span class="text-[10px] font-bold text-[#1DB954]">${track.spotifyPopularity}%</span>`
        : ''}
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
