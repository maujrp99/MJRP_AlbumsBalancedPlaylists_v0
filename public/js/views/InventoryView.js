import { BaseView } from './BaseView.js'
import { InventoryController } from '../controllers/InventoryController.js'
import { InventoryGridRenderer } from './renderers/InventoryGridRenderer.js'
import { inventoryStore } from '../stores/inventory.js'
import { Breadcrumb } from '../components/Breadcrumb.js'
import { getIcon } from '../components/Icons.js'

export class InventoryView extends BaseView {
  constructor() {
    super()
    this.controller = new InventoryController(this)
  }

  async mount() {
    // Subscribe to store updates
    this.unsubscribe = inventoryStore.subscribe(() => {
      this.controller.updateStateFromStore()
      this.controller.refresh()
    })

    await this.controller.initialize()
  }

  onUnmount() {
    if (this.unsubscribe) this.unsubscribe()
  }

  /**
   * Render the view state
   * @param {Object} state - The state from Controller
   */
  /**
   * Render the view state
   * @param {Object} input - Route params (from Router) or State object (from Controller)
   */
  async render(input) {
    // Determine if input is state or route params
    // Controller state has 'filteredAlbums' array. Route params usually don't.
    const isUpdate = input && Array.isArray(input.filteredAlbums)
    const state = isUpdate ? input : this.controller.state

    // Guard: State might not be ready on initial load if Store is empty
    if (!state.filteredAlbums) {
      // Try to use Controller defaults
    }

    const content = InventoryGridRenderer.render(state)
    const stats = state.stats || {}

    const html = `
            <div class="inventory-view container pb-20">
                <header class="view-header mb-8 fade-in">
                    ${Breadcrumb.render('/inventory')}
                    
                     <div class="header-title-row mb-6">
                        <h1 class="text-4xl font-bold mb-3 flex items-center gap-3">
                        ${getIcon('Archive', 'w-8 h-8 text-accent-primary')}
                        My Collection
                        </h1>
                        
                        <div class="stats-row flex flex-wrap items-center gap-4 text-sm md:text-lg">
                            <span class="text-accent-primary font-semibold">
                                ${stats.totalCount || 0} albums
                            </span>
                            <div class="flex gap-2">
                                <span class="badge badge-success text-xs">✓ ${stats.ownedCount || 0} Owned</span>
                                <span class="badge badge-neutral text-xs">${stats.wishlistCount || 0} Wishlist</span>
                            </div>
                            <div class="flex items-center gap-3 ml-auto">
                                <span class="text-sm text-gray-400">Total Owned:</span>
                                <span class="text-lg font-bold text-accent-primary">
                                    ${state.viewCurrency === 'USD'
        ? InventoryGridRenderer.formatPrice(stats.ownedValueUSD, 'USD')
        : InventoryGridRenderer.formatPrice(stats.ownedValueBRL, 'BRL')}
                                </span>
                                <button 
                                  id="currencySelector"
                                  class="text-xs px-2 py-1 rounded bg-surface-light hover:bg-surface-lighter border border-surface-light text-gray-300 hover:text-white transition-colors uppercase"
                                  title="Toggle Currency"
                                >
                                  ${state.viewCurrency}
                                </button>
                            </div>
                        </div>
                    </div>

                    ${this.renderFilters(state)}
                </header>

                <div id="inventory-grid-container">
                    ${content}
                </div>
            </div>
        `

    // If called by Controller (Update), manually update DOM
    if (isUpdate) {
      const app = document.getElementById('app')
      if (app) {
        app.innerHTML = html
        this.attachEventListeners()
      }
    }

    // Always return HTML for Router
    return html
  }

  renderFilters(state) {
    const { filters, viewMode } = state
    return `
          <div class="filters-section glass-panel p-4 mb-6">
            <div class="filters-row flex flex-wrap gap-3 items-center">
              <!-- Search -->
              <div class="search-bar relative flex-1 min-w-[200px]">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  ${getIcon('Search', 'w-5 h-5')}
                </span>
                <input 
                  type="search" 
                  id="inventorySearch" 
                  placeholder="Search collection..."
                  class="form-control pl-10 w-full"
                  value="${filters.search || ''}"
                />
              </div>
              
              <!-- Format Filter -->
              <div class="filter-dropdown relative">
                <select id="formatFilter" class="form-control appearance-none cursor-pointer pr-8">
                  <option value="all">All Formats</option>
                  <option value="cd" ${filters.format === 'cd' ? 'selected' : ''}>CD</option>
                  <option value="vinyl" ${filters.format === 'vinyl' ? 'selected' : ''}>Vinyl</option>
                  <option value="digital" ${filters.format === 'digital' ? 'selected' : ''}>Digital</option>
                </select>
                <span class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  ${getIcon('ChevronDown', 'w-4 h-4')}
                </span>
              </div>
              
              <!-- Ownership Filter -->
              <div class="filter-dropdown relative">
                <select id="ownershipFilter" class="form-control appearance-none cursor-pointer pr-8">
                  <option value="all" ${filters.ownership === 'all' ? 'selected' : ''}>All Status</option>
                  <option value="owned" ${filters.ownership === 'owned' ? 'selected' : ''}>✓ Owned Only</option>
                  <option value="wishlist" ${filters.ownership === 'wishlist' ? 'selected' : ''}>Wishlist Only</option>
                </select>
                <span class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  ${getIcon('ChevronDown', 'w-4 h-4')}
                </span>
              </div>
              
              <!-- View Mode Toggle -->
              <button 
                id="toggleViewMode" 
                class="btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}"
                title="Toggle grid/list view"
              >
                ${getIcon(viewMode === 'grid' ? 'Grid' : 'List', 'w-5 h-5')}
              </button>
            </div>
          </div>
        `
  }

  attachEventListeners() {
    // Search
    const searchInput = document.getElementById('inventorySearch')
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.controller.handleFilterChange('search', e.target.value)
      })
      // Maintain focus
      // A bit tricky with full re-render. Ideally use debounce or diff.
      // For now, simple re-render.
      searchInput.focus()
      // Set cursor to end
      const val = searchInput.value
      searchInput.value = ''
      searchInput.value = val
    }

    // Filters
    document.getElementById('formatFilter')?.addEventListener('change', (e) => {
      this.controller.handleFilterChange('format', e.target.value)
    })

    document.getElementById('ownershipFilter')?.addEventListener('change', (e) => {
      this.controller.handleFilterChange('ownership', e.target.value)
    })

    document.getElementById('toggleViewMode')?.addEventListener('click', () => {
      const current = this.controller.state.viewMode
      this.controller.handleViewModeChange(current === 'grid' ? 'list' : 'grid')
    })

    document.getElementById('currencySelector')?.addEventListener('click', () => {
      this.controller.handleCurrencyChange()
    })

    // Grid Delegation for Buttons
    const grid = document.getElementById('inventory-grid-container')
    if (grid) {
      grid.addEventListener('click', (e) => {
        // Handle Button/Div clicks (Edit, Delete, View)
        const target = e.target.closest('.view-album-btn, .edit-album-btn, .delete-album-btn')
        if (!target) return

        const albumId = target.dataset.albumId
        if (!albumId) return

        if (target.classList.contains('delete-album-btn')) {
          this.handleDeleteWithModal(albumId)
        } else if (target.classList.contains('edit-album-btn')) {
          this.handleEditWithModal(albumId)
        } else if (target.classList.contains('view-album-btn')) {
          this.handleViewWithModal(albumId)
        }
      })

      // Status Select Change
      grid.addEventListener('change', (e) => {
        if (e.target.classList.contains('status-select')) {
          const albumId = e.target.dataset.albumId
          const status = e.target.value // 'owned', 'wishlist', 'not-owned'
          this.controller.handleStatusChange(albumId, status)
        }
      })
    }
  }

  async handleDeleteWithModal(albumId) {
    const { showDeleteAlbumModal } = await import('../components/Modals.js')
    const album = this.controller.state.albums.find(a => a.id === albumId)
    if (!album) return

    showDeleteAlbumModal(albumId, `${album.title}`, async (id) => {
      await this.controller.handleDelete(id)
    })
  }

  async handleEditWithModal(albumId) {
    const { showEditInventoryModal } = await import('../components/InventoryModals.js')
    const album = this.controller.state.albums.find(a => a.id === albumId)
    if (!album) return

    showEditInventoryModal(album, async (id, updates) => {
      await this.controller.handleUpdateAlbum(id, updates)
    })
  }

  async handleViewWithModal(albumId) {
    const { showViewAlbumModal } = await import('../components/ViewAlbumModal.js')
    const album = this.controller.state.albums.find(a => a.id === albumId)
    if (!album) return
    showViewAlbumModal(album)
  }
}
