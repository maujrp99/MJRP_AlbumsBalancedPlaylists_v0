import { BaseView } from './BaseView.js'
import { InventoryController } from '../controllers/InventoryController.js'
import { InventoryGridRenderer } from './renderers/InventoryGridRenderer.js'
import { inventoryStore } from '../stores/inventory.js'
import { Breadcrumb } from '../components/Breadcrumb.js'
import { getIcon } from '../components/Icons.js'
import { SafeDOM } from '../utils/SafeDOM.js'

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
   * @param {Object} input - Route params (from Router) or State object (from Controller)
   */
  async render(input) {
    // Determine if input is state or route params
    const isUpdate = input && Array.isArray(input.filteredAlbums)
    const state = isUpdate ? input : this.controller.state

    // Guard: State might not be ready on initial load if Store is empty
    if (!state.filteredAlbums) {
      // Try to use Controller defaults
    }

    const container = SafeDOM.div({ className: 'inventory-view container pb-20' })

    // Header Structure
    const stats = state.stats || {}

    // Header Title Row
    const titleRow = SafeDOM.div({ className: 'header-title-row mb-6 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between' })

    const h1 = SafeDOM.h1({ className: 'text-2xl md:text-4xl font-bold mb-0 flex items-center gap-3' }) // Removed mb-3, handled by gap
    h1.appendChild(SafeDOM.fromHTML(getIcon('Archive', 'w-8 h-8 text-accent-primary')))
    h1.appendChild(SafeDOM.text(' My Collection'))

    const statsRow = SafeDOM.div({ className: 'stats-row flex flex-wrap items-center gap-4 text-sm md:text-lg w-full md:w-auto' })

    statsRow.appendChild(SafeDOM.span({ className: 'text-accent-primary font-semibold' }, `${stats.totalCount || 0} albums`))

    const badges = SafeDOM.div({ className: 'flex gap-2' }, [
      SafeDOM.span({ className: 'badge badge-success text-xs' }, `✓ ${stats.ownedCount || 0} Owned`),
      SafeDOM.span({ className: 'badge badge-neutral text-xs' }, `${stats.wishlistCount || 0} Wishlist`)
    ])
    statsRow.appendChild(badges)

    const valueSection = SafeDOM.div({ className: 'flex items-center gap-3 ml-0 md:ml-auto mt-2 md:mt-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/10 pt-2 md:pt-0' })
    valueSection.appendChild(SafeDOM.span({ className: 'text-sm text-gray-400' }, 'Total Owned:'))

    const valueText = state.viewCurrency === 'USD'
      ? InventoryGridRenderer.formatPrice(stats.ownedValueUSD, 'USD')
      : InventoryGridRenderer.formatPrice(stats.ownedValueBRL, 'BRL')

    valueSection.appendChild(SafeDOM.span({ className: 'text-lg font-bold text-accent-primary' }, valueText))

    valueSection.appendChild(SafeDOM.button({
      id: 'currencySelector',
      className: 'text-xs px-2 py-1 rounded bg-surface-light hover:bg-surface-lighter border border-surface-light text-gray-300 hover:text-white transition-colors uppercase',
      title: 'Toggle Currency',
      onClick: () => this.controller.handleCurrencyChange() // Direct binding
    }, state.viewCurrency))

    statsRow.appendChild(valueSection)
    titleRow.appendChild(h1)
    titleRow.appendChild(statsRow)

    const header = SafeDOM.header({ className: 'view-header mb-8 fade-in' }, [
      SafeDOM.fromHTML(Breadcrumb.render('/inventory')),
      titleRow,
      this.renderFilters(state)
    ])

    container.appendChild(header)

    // Grid Container
    const gridContainer = SafeDOM.div({ id: 'inventory-grid-container' })
    // Using fromHTML for the grid content as it comes from Renderer (string based)
    gridContainer.appendChild(SafeDOM.fromHTML(InventoryGridRenderer.render(state)))
    container.appendChild(gridContainer)

    // If called by Controller (Update), manually update DOM
    if (isUpdate) {
      const app = document.getElementById('app')
      if (app) {
        SafeDOM.clear(app)
        app.appendChild(container)
        this.attachEventListeners() // Re-attach for delegated events inside grid
      }
    }

    return container
  }

  renderFilters(state) {
    const { filters, viewMode } = state

    const container = SafeDOM.div({ className: 'filters-section glass-panel p-4 mb-6' })
    const row = SafeDOM.div({ className: 'filters-row flex flex-wrap gap-3 items-center' })

    // Search
    const searchDiv = SafeDOM.div({ className: 'search-bar relative flex-1 min-w-[200px]' })
    searchDiv.appendChild(SafeDOM.span({ className: 'absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' }, [SafeDOM.fromHTML(getIcon('Search', 'w-5 h-5'))]))
    searchDiv.appendChild(SafeDOM.input({
      type: 'search',
      id: 'inventorySearch',
      placeholder: 'Search collection...',
      className: 'form-control pl-10 w-full',
      value: filters.search || ''
    }))
    row.appendChild(searchDiv)

    // Format Filter
    const formatDiv = SafeDOM.div({ className: 'filter-dropdown relative' })
    const formatSelect = SafeDOM.select({ id: 'formatFilter', className: 'form-control appearance-none cursor-pointer pr-8' }, [
      SafeDOM.option({ value: 'all' }, 'All Formats'),
      SafeDOM.option({ value: 'cd', selected: filters.format === 'cd' }, 'CD'),
      SafeDOM.option({ value: 'vinyl', selected: filters.format === 'vinyl' }, 'Vinyl'),
      SafeDOM.option({ value: 'digital', selected: filters.format === 'digital' }, 'Digital')
    ])
    formatDiv.appendChild(formatSelect)
    formatDiv.appendChild(SafeDOM.span({ className: 'absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400' }, [SafeDOM.fromHTML(getIcon('ChevronDown', 'w-4 h-4'))]))
    row.appendChild(formatDiv)

    // Ownership Filter
    const ownershipDiv = SafeDOM.div({ className: 'filter-dropdown relative' })
    const ownershipSelect = SafeDOM.select({ id: 'ownershipFilter', className: 'form-control appearance-none cursor-pointer pr-8' }, [
      SafeDOM.option({ value: 'all', selected: filters.ownership === 'all' }, 'All Status'),
      SafeDOM.option({ value: 'owned', selected: filters.ownership === 'owned' }, '✓ Owned Only'),
      SafeDOM.option({ value: 'wishlist', selected: filters.ownership === 'wishlist' }, 'Wishlist Only')
    ])
    ownershipDiv.appendChild(ownershipSelect)
    ownershipDiv.appendChild(SafeDOM.span({ className: 'absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400' }, [SafeDOM.fromHTML(getIcon('ChevronDown', 'w-4 h-4'))]))
    row.appendChild(ownershipDiv)

    // View Mode
    const viewBtn = SafeDOM.button({
      id: 'toggleViewMode',
      className: `btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`,
      title: 'Toggle grid/list view'
    })
    viewBtn.appendChild(SafeDOM.fromHTML(getIcon(viewMode === 'grid' ? 'Grid' : 'List', 'w-5 h-5')))
    row.appendChild(viewBtn)

    container.appendChild(row)
    return container
  }

  attachEventListeners() {
    // Search
    const searchInput = document.getElementById('inventorySearch')
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.controller.handleFilterChange('search', e.target.value)
      })
      // Maintain focus hack needed because we are replacing DOM on update
      // In a real VDOM/fine-grained setup this wouldn't be needed.
      // But since we are full-replacing, the focus is lost.
      // Ideally update() shouldn't replace entire DOM if only grid changed.
      // But keeping it simple for now.
      searchInput.focus()
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

    // Currency listener already bound in render, but if we used ID selector there:
    // ... wait, I used onClick in render for currency selector.
    // But update() re-attaches listeners.
    // However, duplicate listeners? No, DOM is replaced.

    // Grid Delegation for Buttons
    const grid = document.getElementById('inventory-grid-container')
    if (grid) {
      grid.addEventListener('click', (e) => {
        const target = e.target.closest('.view-album-btn, .edit-album-btn, .delete-album-btn, .inventory-row-wrapper, .expanded-album-card, .album-card-compact, [data-action="view-modal"]')
        if (!target) return

        const albumId = target.dataset.albumId || target.dataset.id
        if (!albumId) return

        // Prioritize Delete/Edit buttons inside the card/row
        if (target.classList.contains('delete-album-btn')) {
          e.stopPropagation()
          this.handleDeleteWithModal(albumId)
        } else if (target.classList.contains('edit-album-btn')) {
          e.stopPropagation()
          this.handleEditWithModal(albumId)
        } else {
          // Default action is View
          this.handleViewWithModal(albumId)
        }
      })

      // Status Select Change
      grid.addEventListener('change', (e) => {
        if (e.target.classList.contains('status-select')) {
          const albumId = e.target.dataset.albumId
          const status = e.target.value
          this.controller.handleStatusChange(albumId, status)
        }
      })
    }
  }

  async handleDeleteWithModal(albumId) {
    const { dialogService } = await import('../services/DialogService.js')
    const album = this.controller.state.albums.find(a => a.id === albumId)
    if (!album) return

    const confirmed = await dialogService.confirm({
      title: 'Remove from Inventory?',
      message: `Are you sure you want to remove "${album.title}" from your collection?`,
      confirmText: 'Remove',
      variant: 'danger'
    })

    if (confirmed) {
      await this.controller.handleDelete(albumId)
    }
  }

  async handleEditWithModal(albumId) {
    const { InventoryEditModal } = await import('../components/InventoryEditModal.js')
    const album = this.controller.state.albums.find(a => a.id === albumId)
    if (!album) return

    InventoryEditModal.open(album, async (id, updates) => {
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
