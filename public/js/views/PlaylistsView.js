import { BaseView } from './BaseView.js'
import { playlistsStore } from '../stores/playlists.js'
import { albumsStore } from '../stores/albums.js'
import { albumSeriesStore } from '../stores/albumSeries.js'
import { Breadcrumb } from '../components/Breadcrumb.js'
import { getIcon } from '../components/Icons.js'
import { getAllAlgorithms, getRecommendedAlgorithm } from '../algorithms/index.js'
import { BalancedRankingStrategy, SpotifyRankingStrategy, BEARankingStrategy } from '../ranking/index.js'

// Refactored Components
import { PlaylistsController } from '../controllers/PlaylistsController.js'
import { PlaylistsGridRenderer } from '../components/playlists/PlaylistsGridRenderer.js'
import { PlaylistsDragHandler } from '../components/playlists/PlaylistsDragHandler.js'

export class PlaylistsView extends BaseView {
  constructor() {
    super()
    this.isGenerating = false
    this.isDragging = false
    this.isRegeneratePanelExpanded = false // UI State

    // Init Controller
    this.controller = new PlaylistsController(this)

    // Init Drag Handler
    this.dragHandler = new PlaylistsDragHandler(this)
  }

  async mount(params) {
    this.container = document.getElementById('app')
    Breadcrumb.attachListeners(this.container)

    // 1. Initialize Data via Controller
    await this.controller.initialize(params)

    // 2. Subscribe to Stores
    this.subscribeStores()

    // 3. Render Initial State
    this.update()
  }

  subscribeStores() {
    const unsubscribe = playlistsStore.subscribe(() => {
      if (!this.isDragging) this.update()
    })
    this.subscriptions.push(unsubscribe)

    // We might want to subscribe to AlbumsStore if we handle dynamic album loading, 
    // but typically albums are loaded before entering or via Controller.
  }

  update() {
    if (!this.container) return

    const state = playlistsStore.getState()
    const playlists = state.playlists
    const activeSeries = albumSeriesStore.getActiveSeries()
    const isEditMode = playlistsStore.isEditingExistingBatch()

    // Render entire view (Simplest approach for thin orchestrator)
    // Ideally we diff, but for now full re-render is safer and fast enough with component caching.
    // Actually, we should preserve the grid container if dragging, but we block updates during dragging anyway.

    this.container.innerHTML = `
            <div class="playlists-view container">
                ${this.renderHeader(isEditMode, playlists)}
                
                ${PlaylistsGridRenderer.renderBatchNameInput(state.editContext?.batchName, isEditMode)}
                
                <!-- Generation / Reconfig -->
                <div id="generationControlContainer">
                    ${this.renderGenerationSection(playlists, activeSeries)}
                </div>

                <!-- Export -->
                <div id="exportSection" class="mb-6 fade-in" style="animation-delay: 0.08s">
                    ${PlaylistsGridRenderer.renderExportSection(playlists)}
                </div>

                <!-- Grid -->
                <div id="mainContent" class="fade-in" style="animation-delay: 0.1s">
                    ${playlists.length === 0 ? PlaylistsGridRenderer.renderEmptyState() : ''}
                    <div id="playlistsGrid">
                        ${PlaylistsGridRenderer.renderGrid(playlists)}
                    </div>
                </div>

                ${this.isGenerating ? this.renderGeneratingOverlay() : ''}
                
                <footer class="view-footer mt-12 text-center text-muted text-sm border-t border-white/5 pt-6">
                    <p class="last-update">Last updated: ${new Date().toLocaleTimeString()}</p>
                </footer>
            </div>
        `

    // Attach Listeners
    this.attachListeners()

    // Setup Drag & Drop (only if playlists exist)
    if (playlists.length > 0) {
      this.dragHandler.setup(this.container)
    }
  }

  renderHeader(isEditMode, playlists) {
    const title = isEditMode ? 'Edit Playlist Batch' : 'Playlist Management'
    const icon = isEditMode ? 'Edit' : 'Music'
    const badge = isEditMode
      ? `<span class="badge badge-success px-3 py-1 rounded-full text-sm">Editing: ${playlistsStore.editContext?.batchName || '...'}</span>`
      : ''

    return `
            <header class="view-header mb-8 fade-in">
                ${Breadcrumb.render(isEditMode ? '/saved-playlists' : '/albums')}
                <div class="header-content mt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <h1 class="text-4xl font-bold flex items-center gap-3">
                        ${getIcon(icon, 'w-8 h-8')} ${title}
                    </h1>
                    <div class="header-actions flex items-center gap-4">
                        ${badge}
                    </div>
                </div>
            </header>
        `
  }

  renderGenerationSection(playlists, activeSeries) {
    if (playlists.length > 0) {
      // Reconfiguration Panel (Always available)
      return PlaylistsGridRenderer.renderGenerationControls(playlists, activeSeries, this.isRegeneratePanelExpanded)
    } else {
      // Initial Settings (No playlists yet)
      const algorithms = getAllAlgorithms()
      const rankingStrategies = [BalancedRankingStrategy.metadata, SpotifyRankingStrategy.metadata, BEARankingStrategy.metadata]
      // Defaults
      const currentAlgo = 'mjrp-balanced-cascade'
      const currentRank = 'balanced'
      return PlaylistsGridRenderer.renderInitialSettings(algorithms, currentAlgo, rankingStrategies, currentRank)
    }
  }

  attachListeners() {
    // Generation Listeners (Initial Generate Button)
    const generateBtn = this.container.querySelector('#generateBtn')
    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        // Gather config from DOM inputs
        const algoRadio = this.container.querySelector('input[name="algorithm"]:checked')
        const rankSelect = this.container.querySelector('#rankingStrategySelect')
        const config = {
          algorithmId: algoRadio?.value,
          rankingId: rankSelect?.value
        }
        this.controller.handleGenerate(config)
      })
    }

    // Re-generate Panel Listeners (Delegated or specific?)
    // The RegeneratePanel typically attaches its own listeners or we delegate.
    // Wait, RegeneratePanel uses `Generate` button too inside it.
    // We need to ensure we capture that. 
    // If RegeneratePanel renders a button with id="regenerateActionBtn" (check component),
    // we should listen to it. 
    // Actually, RegeneratePanel.js usually attaches listeners if we call `RegeneratePanel.mount()`.
    if (this.container.querySelector('#regeneratePanelMount')) {
      // We might need to call a static mount, or simple delegation event
      // Let's assume standard event bubbling for "click" on button inside panel
      // NOTE: Existing RegeneratePanel might need `mount` call. 
      // Checking previous PlaylistsView, it called `RegeneratePanel.mount()`.
      // Ideally we move that logic to Renderer or Controller, but View handles DOM.
      // Let's call it here.
      import('../components/playlists/RegeneratePanel.js').then(({ RegeneratePanel }) => {
        RegeneratePanel.mount()
      })
    }

    // Export/Save Listeners
    const saveBtn = this.container.querySelector('#saveToHistoryBtn')
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        // If there's a batch name input, grab value
        const input = this.container.querySelector('#batchNameInput')
        this.controller.handleSave(input?.value)
      })
    }

    // Batch Name Input (Update local state / store edit context?)
    const nameInput = this.container.querySelector('#batchNameInput')
    if (nameInput) {
      nameInput.addEventListener('input', (e) => {
        // Update store context to preserve across re-renders?
        // Or just let it be read on save.
        // Better to sync with store if possible, or just local controller.
      })
    }

    // Export Buttons
    const spotifyBtn = this.container.querySelector('#exportSpotifyBtn')
    if (spotifyBtn) {
      spotifyBtn.addEventListener('click', async () => {
        const { showSpotifyExportModal } = await import('../components/SpotifyExportModal.js')
        showSpotifyExportModal()
      })
    }

    const jsonBtn = this.container.querySelector('#exportJsonBtn')
    if (jsonBtn) {
      import('./playlists/index.js').then(({ handleExportJson }) => handleExportJson())
    }

    const appleBtn = this.container.querySelector('#exportAppleMusicBtn')
    if (appleBtn) {
      import('./playlists/index.js').then(({ handleExportToAppleMusic }) => handleExportToAppleMusic())
    }

    // Delete Playlist (Delegation)
    this.container.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('[data-action="delete-playlist"]')
      if (deleteBtn) {
        const index = parseInt(deleteBtn.dataset.playlistIndex)
        this.controller.deletePlaylist(index)
      }
    })
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

  destroy() {
    super.destroy()
    this.controller.destroy()
    this.dragHandler.destroy()
  }
}
