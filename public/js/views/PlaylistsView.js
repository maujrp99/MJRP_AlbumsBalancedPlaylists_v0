import { BaseView } from './BaseView.js'
import { escapeHtml } from '../utils/stringUtils.js'
import { playlistsStore } from '../stores/playlists.js'
import { albumsStore } from '../stores/albums.js'
import { albumSeriesStore } from '../stores/albumSeries.js'
import { Breadcrumb } from '../components/Breadcrumb.js'
import { getIcon } from '../components/Icons.js'
import { getAllAlgorithms, getRecommendedAlgorithm } from '../algorithms/index.js'
import { BalancedRankingStrategy, SpotifyRankingStrategy, BEARankingStrategy } from '../ranking/index.js'
import { SafeDOM } from '../utils/SafeDOM.js'

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

    // 2. Return DOM Node
    return this.renderContent()
  }

  async mount(params) {
    this.container = document.getElementById('app')
    Breadcrumb.attachListeners(this.container)

    // 3. Subscribe to Stores
    this.subscribeStores()

    // 4. Attach Listeners & Setup Drag
    this.attachDelegatedListeners() // Call ONCE
    this.attachElementListeners()   // Call on every render

    const state = playlistsStore.getState()
    if (state.playlists.length > 0) {
      this.dragHandler.setup(this.container)
    }
  }

  update() {
    if (!this.container) return

    // Clear and Re-render
    SafeDOM.clear(this.container)
    this.container.appendChild(this.renderContent())

    // Attach Element Listeners (Re-bind recreated elements)
    this.attachElementListeners()

    // Setup Drag & Drop
    const state = playlistsStore.getState()
    if (state.playlists.length > 0) {
      this.dragHandler.setup(this.container)
    }
  }

  attachDelegatedListeners() {
    // Delete Playlist
    this.on(this.container, 'click', (e) => {
      const deleteBtn = e.target.closest('[data-action="delete-playlist"]')
      if (deleteBtn) {
        const index = parseInt(deleteBtn.dataset.playlistIndex)
        this.controller.deletePlaylist(index)
      }
    })

    // Remove Track
    this.on(this.container, 'click', (e) => {
      const btn = e.target.closest('button[data-action="remove-track"]')
      if (btn) {
        e.stopPropagation()
        const playlistIndex = parseInt(btn.dataset.playlistIndex)
        const trackIndex = parseInt(btn.dataset.trackIndex)
        if (!isNaN(playlistIndex) && !isNaN(trackIndex)) {
          this.controller.deleteTrack(playlistIndex, trackIndex)
        }
      }
    })
  }

  subscribeStores() {
    this.subscriptions = [
      playlistsStore.subscribe(() => this.update()),
      albumSeriesStore.subscribe(() => this.update()),
      albumsStore.subscribe(() => this.update())
    ]
  }

  attachElementListeners() {
    // Generation Listeners (Initial Generate Button)
    const generateBtn = this.container.querySelector('#generateBtn')
    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        const algoRadio = this.container.querySelector('input[name="algorithm"]:checked')
        const rankSelect = this.container.querySelector('#rankingStrategySelect')
        const config = {
          algorithmId: algoRadio?.value,
          rankingId: rankSelect?.value
        }
        this.controller.handleGenerate(config)
      })
    }

    // Toggle RegeneratePanel
    const toggleBtn = this.container.querySelector('[data-action="toggle-regenerate-panel"]')
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const panel = this.container.querySelector('.regenerate-panel')
        const content = panel?.querySelector('.regenerate-content')
        const chevron = panel?.querySelector('.regenerate-chevron')

        if (content) {
          content.classList.toggle('hidden')
          chevron?.classList.toggle('rotate-180')
          this.isRegeneratePanelExpanded = !content.classList.contains('hidden')
        }
      })
    }

    // Mount RegeneratePanel components
    const regeneratePanel = this.container.querySelector('.regenerate-panel')
    if (regeneratePanel) {
      import('../components/playlists/RegeneratePanel.js').then(({ RegeneratePanel }) => {
        RegeneratePanel.mount()
      })

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
        const input = this.container.querySelector('#batchNameInput')
        this.controller.handleSave(input?.value)
      })
    }

    // Batch Name Input
    const nameInput = this.container.querySelector('#batchNameInput')
    if (nameInput) {
      nameInput.addEventListener('input', (e) => {
        playlistsStore.updateBatchName(e.target.value)

        const gridContainer = this.container.querySelector('#playlistsGrid')
        if (gridContainer) {
          const state = playlistsStore.getState()
          const batchName = playlistsStore.batchName || ''
          gridContainer.innerHTML = PlaylistsGridRenderer.renderGrid(state.playlists, batchName)
        }
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

    // Note: Delegated listeners (Delete/Remove) are in attachDelegatedListeners()
  }


  renderContent() {
    const state = playlistsStore.getState()
    const playlists = state.playlists
    const activeSeries = albumSeriesStore.getActiveSeries()
    const isEditMode = playlistsStore.isEditingExistingBatch()

    console.log('[PlaylistsView] renderContent - Context:', {
      editContext: state.editContext,
      batchName: state.editContext?.batchName,
      defaultBatchName: state.defaultBatchName,
      isEditMode
    })

    const container = SafeDOM.div({ className: 'playlists-view container' })

    // Header
    container.appendChild(SafeDOM.fromHTML(this.renderHeader(isEditMode, playlists)))

    // Batch Name Input
    container.appendChild(SafeDOM.fromHTML(
      PlaylistsGridRenderer.renderBatchNameInput(state.batchName || state.editContext?.batchName, isEditMode, state.defaultBatchName)
    ))

    // Generation / Reconfig
    const genContainer = SafeDOM.div({ id: 'generationControlContainer' })
    genContainer.appendChild(SafeDOM.fromHTML(this.renderGenerationSection(playlists, activeSeries)))
    container.appendChild(genContainer)

    // Export
    const exportSec = SafeDOM.div({ id: 'exportSection', className: 'mb-6 fade-in', style: { animationDelay: '0.08s' } })
    exportSec.appendChild(SafeDOM.fromHTML(PlaylistsGridRenderer.renderExportSection(playlists)))
    container.appendChild(exportSec)

    // Grid
    const mainContent = SafeDOM.div({ id: 'mainContent', className: 'fade-in', style: { animationDelay: '0.1s' } })

    if (playlists.length === 0 && !isEditMode) {
      mainContent.appendChild(SafeDOM.fromHTML(PlaylistsGridRenderer.renderEmptyState()))
    }

    const grid = SafeDOM.div({ id: 'playlistsGrid' })
    grid.appendChild(SafeDOM.fromHTML(
      PlaylistsGridRenderer.renderGrid(playlists, state.batchName || state.editContext?.batchName || state.defaultBatchName || '')
    ))
    mainContent.appendChild(grid)
    container.appendChild(mainContent)

    // Overlay
    if (this.isGenerating) {
      container.appendChild(SafeDOM.fromHTML(this.renderGeneratingOverlay()))
    }

    // Footer
    container.appendChild(SafeDOM.footer({ className: 'view-footer mt-12 text-center text-muted text-sm border-t border-white/5 pt-6' }, [
      SafeDOM.p({ className: 'last-update' }, `Last updated: ${new Date().toLocaleTimeString()}`)
    ]))

    return container
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
      // Create Mode (Initial Settings)
      const algorithms = getAllAlgorithms()
      const rankingStrategies = [BalancedRankingStrategy.metadata, SpotifyRankingStrategy.metadata, BEARankingStrategy.metadata]
      // Defaults
      const currentAlgo = 'mjrp-balanced-cascade'
      const currentRank = 'balanced'
      return PlaylistsGridRenderer.renderInitialSettings(algorithms, currentAlgo, rankingStrategies, currentRank)
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

  destroy() {
    super.destroy()
    this.controller.destroy()
    this.dragHandler.destroy()
  }
}
