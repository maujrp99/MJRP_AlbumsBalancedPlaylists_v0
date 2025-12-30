import { BaseView } from './BaseView.js'
import { escapeHtml } from '../utils/stringUtils.js'
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

  async render(params) {
    // 1. Initialize Data via Controller
    await this.controller.initialize(params)

    // 2. Return HTML string
    return this.generateHtml()
  }

  async mount(params) {
    this.container = document.getElementById('app')
    Breadcrumb.attachListeners(this.container)

    // 3. Subscribe to Stores
    this.subscribeStores()

    // 4. Attach Listeners & Setup Drag
    this.attachListeners()
    const state = playlistsStore.getState()
    if (state.playlists.length > 0) {
      this.dragHandler.setup(this.container)
    }
  }

  subscribeStores() {
    const unsubscribePlaylists = playlistsStore.subscribe(() => {
      if (!this.isDragging) this.update()
    })
    this.subscriptions.push(unsubscribePlaylists)

    // Subscribe to AlbumsStore to support dynamic loading in Edit Mode
    const unsubscribeAlbums = albumsStore.subscribe(() => {
      // We only need to re-render if we are showing album-dependent UI or want to refresh state
      // In Edit Mode, loading albums enables the "Regenerate" functionality.
      // It might be good to refresh to ensure stores are synced.
      console.log('[PlaylistsView] Albums updated, refreshing...')
      if (!this.isDragging) this.update()
    })
    this.subscriptions.push(unsubscribeAlbums)
  }

  update() {
    if (!this.container) return

    // Render entire view
    this.container.innerHTML = this.generateHtml()

    // Attach Listeners
    this.attachListeners()

    // Setup Drag & Drop
    const state = playlistsStore.getState()
    if (state.playlists.length > 0) {
      this.dragHandler.setup(this.container)
    }
  }

  generateHtml() {
    const state = playlistsStore.getState()
    const playlists = state.playlists
    const activeSeries = albumSeriesStore.getActiveSeries()
    const isEditMode = playlistsStore.isEditingExistingBatch()

    return `
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
                    ${playlists.length === 0 && !isEditMode ? PlaylistsGridRenderer.renderEmptyState() : ''}
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
  }

  renderHeader(isEditMode, playlists) {
    const title = isEditMode ? 'Edit Playlist Batch' : 'Playlist Management'
    const icon = isEditMode ? 'Edit' : 'Music'
    const badge = isEditMode
      ? `<span class="badge badge-success px-3 py-1 rounded-full text-sm">Editing: ${escapeHtml(playlistsStore.editContext?.batchName || '...')}</span>`
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
    // Check Edit Mode from Store
    const isEditMode = playlistsStore.isEditingExistingBatch()

    if (playlists.length > 0) {
      // Reconfiguration Panel (Always available)
      return PlaylistsGridRenderer.renderGenerationControls(playlists, activeSeries, this.isRegeneratePanelExpanded)
    } else if (isEditMode) {
      // ERROR: Edit Mode but no playlists found
      return `
        <div class="alert alert-error bg-red-500/10 border border-red-500/20 text-red-200 p-6 rounded-xl mb-6">
            <div class="flex items-center gap-3">
                ${getIcon('AlertTriangle', 'w-8 h-8 text-red-500')}
                <div>
                    <h3 class="font-bold text-lg">Batch Not Found</h3>
                    <p class="text-sm opacity-80">Could not load playlists for batch "${escapeHtml(playlistsStore.editContext?.batchName || 'Unknown')}".</p>
                    <p class="text-xs mt-2">The batch may have been deleted or the name/series attributes are mismatched.</p>
                </div>
            </div>
            <div class="mt-4 flex gap-4">
                <a href="/saved-playlists" class="btn btn-sm btn-ghost hover:bg-white/10">Return to Saved Playlists</a>
            </div>
        </div>
      `
    } else {
      // Create Mode (Initial Settings) - Valid fallback
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

    // Toggle Regenerate Panel (Collapse/Expand)
    const toggleBtn = this.container.querySelector('[data-action="toggle-regenerate-panel"]')
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const panel = this.container.querySelector('.regenerate-panel')
        const content = panel?.querySelector('.regenerate-content')
        const chevron = panel?.querySelector('.regenerate-chevron')

        if (content) {
          content.classList.toggle('hidden')
          chevron?.classList.toggle('rotate-180')
          console.log('[PlaylistsView] Regenerate panel toggled')
        }
      })
    }

    // Mount RegeneratePanel components (Flavor, Ingredients)
    const regeneratePanel = this.container.querySelector('.regenerate-panel')
    if (regeneratePanel) {
      import('../components/playlists/RegeneratePanel.js').then(({ RegeneratePanel }) => {
        RegeneratePanel.mount()
      })

      // Regenerate Button inside panel
      const regenerateBtn = this.container.querySelector('[data-action="regenerate-playlists"]')
      if (regenerateBtn) {
        regenerateBtn.addEventListener('click', () => {
          import('../components/playlists/RegeneratePanel.js').then(({ RegeneratePanel }) => {
            const config = RegeneratePanel.getConfig()
            this.controller.handleGenerate(config)
          })
        })
      }
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
      jsonBtn.addEventListener('click', () => {
        import('./playlists/index.js').then(({ handleExportJson }) => handleExportJson())
      })
    }

    const appleBtn = this.container.querySelector('#exportAppleMusicBtn')
    if (appleBtn) {
      appleBtn.addEventListener('click', () => {
        import('./playlists/index.js').then(({ handleExportToAppleMusic }) => handleExportToAppleMusic())
      })
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
