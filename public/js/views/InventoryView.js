import { BaseView } from './BaseView.js'
import { inventoryStore } from '../stores/inventory.js'
import { router } from '../router.js'
import { Breadcrumb } from '../components/Breadcrumb.js'
import { getIcon } from '../components/Icons.js'
import toast from '../components/Toast.js'
import { showViewAlbumModal } from '../components/ViewAlbumModal.js'

/**
 * InventoryView
 * Manage physical album collection (CD, Vinyl, DVD, Blu-ray, Digital)
 */

export class InventoryView extends BaseView {
  constructor() {
    super()
    this.viewMode = localStorage.getItem('inventoryViewMode') || 'grid'
    this.selectedAlbums = new Set()
    this.filters = {
      format: 'all',
      search: '',
      ownership: 'all' // 'all' | 'owned' | 'wishlist'
    }
    this.currency = localStorage.getItem('inventoryCurrency') || 'USD'
    this.editingPriceId = null
  }

  async mount() {
    console.log('[InventoryView.mount] Starting mount')

    // Subscribe to store updates FIRST (before loading)
    this.unsubscribe = inventoryStore.subscribe(() => {
      console.log('[InventoryView.mount] Store updated, calling rerender')
      this.rerender()
    })

    // Load albums on mount
    try {
      console.log('[InventoryView.mount] Calling inventoryStore.loadAlbums()')
      const albums = await inventoryStore.loadAlbums()
      console.log('[InventoryView.mount] loadAlbums returned:', albums?.length, 'albums')
    } catch (error) {
      console.error('[InventoryView.mount] Failed to load inventory:', error)
    }
  }

  onUnmount() {
    // Unsubscribe when leaving view
    if (this.unsubscribe) {
      this.unsubscribe()
    }
  }

  /**
   * Re-render the view with current data
   * Called when store updates or filters change
   */
  async rerender() {
    console.log('[InventoryView.rerender] Re-rendering view')
    const container = document.getElementById('app')
    if (!container) return

    const html = await this.render()
    container.innerHTML = html
    this.afterRender()
  }

  afterRender() {
    this.attachEventListeners()
  }

  attachEventListeners() {
    // Currency selector
    const currencySelector = document.getElementById('currencySelector')
    if (currencySelector) {
      currencySelector.addEventListener('change', (e) => {
        this.currency = e.target.value
        localStorage.setItem('inventoryCurrency', this.currency)
        this.rerender()
      })
    }

    // Search
    const searchInput = document.getElementById('inventorySearch')
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filters.search = e.target.value
        this.rerender()
      })
    }

    // Format filter
    const formatFilter = document.getElementById('formatFilter')
    if (formatFilter) {
      formatFilter.addEventListener('change', (e) => {
        this.filters.format = e.target.value
        this.rerender()
      })
    }

    // Ownership filter
    const ownershipFilter = document.getElementById('ownershipFilter')
    if (ownershipFilter) {
      ownershipFilter.addEventListener('change', (e) => {
        this.filters.ownership = e.target.value
        this.rerender()
      })
    }

    // View mode toggle
    const toggleBtn = document.getElementById('toggleViewMode')
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid'
        localStorage.setItem('inventoryViewMode', this.viewMode)
        this.rerender()
      })
    }

    // Album checkboxes (multi-select)
    const checkboxes = document.querySelectorAll('.album-checkbox')
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const albumId = e.target.dataset.albumId
        if (e.target.checked) {
          this.selectedAlbums.add(albumId)
        } else {
          this.selectedAlbums.delete(albumId)
        }
        this.rerender()
      })
    })

    // Price edit buttons (inline editing)
    const priceButtons = document.querySelectorAll('.price-edit-btn')
    priceButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const albumId = e.currentTarget.dataset.albumId
        this.editingPriceId = albumId
        this.rerender()

        // Focus input after rerender
        setTimeout(() => {
          const input = document.getElementById(`priceInput-${albumId}`)
          if (input) {
            input.focus()
            input.select()
          }
        }, 50)
      })
    })

    // Price inputs (save on blur/enter)
    const priceInputs = document.querySelectorAll('[id^="priceInput-"]')
    priceInputs.forEach(input => {
      const savePrice = async () => {
        const albumId = input.dataset.albumId
        const currency = input.dataset.currency
        const newPrice = parseFloat(input.value) || 0

        try {
          await inventoryStore.updatePrice(albumId, newPrice, currency)
          this.editingPriceId = null
          this.rerender()
        } catch (error) {
          console.error('Failed to update price:', error)
          toast.error('Failed to update price. Please try again.')
        }
      }

      input.addEventListener('blur', savePrice)
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          savePrice()
        } else if (e.key === 'Escape') {
          this.editingPriceId = null
          this.rerender()
        }
      })
    })

    // Edit album buttons
    const editButtons = document.querySelectorAll('.edit-album-btn')
    editButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const albumId = e.currentTarget.dataset.albumId
        this.showEditAlbumModal(albumId)
      })
    })

    // Delete album buttons
    const deleteButtons = document.querySelectorAll('.delete-album-btn')
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const albumId = e.currentTarget.dataset.albumId
        this.showDeleteAlbumModal(albumId)
      })
    })

    // View album buttons (including cover click)
    const viewButtons = document.querySelectorAll('.view-album-btn')
    viewButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const albumId = e.currentTarget.dataset.albumId
        this.handleViewAlbum(albumId)
      })
    })

    // Status dropdowns
    this.container.addEventListener('status-change', (e) => {
      e.stopPropagation()
      this.handleStatusChange(e.detail.albumId, e.detail.status)
    })

    // Fallback for direct change if custom event bubbles (via delegation)
    const statusSelects = document.querySelectorAll('.status-select')
    statusSelects.forEach(select => {
      select.addEventListener('change', (e) => {
        e.stopPropagation()
        const albumId = e.target.dataset.albumId
        const status = e.target.value
        this.handleStatusChange(albumId, status)
      })
    })

    // Create series from selected
    const createSeriesBtn = document.getElementById('createSeriesFromSelected')
    if (createSeriesBtn) {
      createSeriesBtn.addEventListener('click', () => {
        this.showCreateSeriesModal()
      })
    }

    // Go to Albums button (empty state)
    const goToAlbumsBtn = document.getElementById('goToAlbums')
    if (goToAlbumsBtn) {
      goToAlbumsBtn.addEventListener('click', () => {
        router.navigate('/albums')
      })
    }
  }

  handleViewAlbum(albumId) {
    const album = inventoryStore.getAlbums().find(a => a.id === albumId)
    if (album) {
      showViewAlbumModal(album)
    }
  }

  async handleStatusChange(albumId, status) {
    const album = inventoryStore.getAlbums().find(a => a.id === albumId)
    if (!album) return

    // Visual feedback handled by select state, but we can disable during save
    const select = document.querySelector(`.status-select[data-album-id="${albumId}"]`)
    if (select) {
      select.disabled = true
      select.classList.add('opacity-50', 'cursor-wait')
    }

    let isOwned = null
    if (status === 'owned') isOwned = true
    else if (status === 'wishlist') isOwned = false
    // 'not-owned' remains null

    try {
      await inventoryStore.updateAlbum(albumId, { owned: isOwned })

      let msg = 'Updated status'
      if (isOwned === true) msg = 'Moved to Collection'
      else if (isOwned === false) msg = 'Moved to Wishlist'
      else msg = 'Removed from specific lists'

      toast.success(msg)
      this.rerender()
    } catch (error) {
      toast.error('Failed to update status: ' + error.message)
      // Re-enable on error
      if (select) {
        select.disabled = false
        select.classList.remove('opacity-50', 'cursor-wait')
        this.rerender() // Revert UI
      }
    }
  }

  async showEditAlbumModal(albumId) {
    const album = inventoryStore.getAlbums().find(a => a.id === albumId)
    if (!album) return

    const { showEditInventoryModal } = await import('../components/InventoryModals.js')

    showEditInventoryModal(album, async (id, updates) => {
      try {
        await inventoryStore.updateAlbum(id, updates)
      } catch (error) {
        throw error // Re-throw for modal to handle
      }
    })
  }

  async showDeleteAlbumModal(albumId) {
    const album = inventoryStore.getAlbums().find(a => a.id === albumId)
    if (!album) return

    const { showDeleteAlbumModal } = await import('../components/Modals.js')

    showDeleteAlbumModal(
      albumId,
      `${album.title} - ${album.artist}`,
      async (id) => {
        try {
          await inventoryStore.removeAlbum(id)
        } catch (error) {
          throw error
        }
      }
    )
  }

  async showCreateSeriesModal() {
    const { showCreateSeriesFromInventoryModal } = await import('../components/InventoryModals.js')
    const { router } = await import('../router.js')

    showCreateSeriesFromInventoryModal(
      Array.from(this.selectedAlbums),
      async (albumIds, seriesName) => {
        try {
          // TODO: Implement createFromInventory in SeriesRepository
          console.log('Creating series:', seriesName, 'with albums:', albumIds)

          // For now, just show success and navigate
          toast.success(`Series "${seriesName}" created successfully!`)

          // Clear selection
          this.selectedAlbums.clear()
          this.rerender()
        } catch (error) {
          throw error
        }
      }
    )
  }

  async render(params) {
    const albums = inventoryStore.getAlbums()
    const stats = inventoryStore.getStatistics()
    const filteredAlbums = this.filterAlbums(albums)

    return `
      <div class="inventory-view container">
        <header class="view-header mb-8 fade-in">
          ${Breadcrumb.render('/inventory')}
          
          <!-- Title Row -->
          <div class="header-title-row mb-6">
            <h1 class="text-4xl font-bold mb-3 flex items-center gap-3">
              ${getIcon('Archive', 'w-8 h-8 text-accent-primary')}
              My Collection
            </h1>
            
            <!-- Stats Row -->
            <div class="stats-row flex flex-wrap items-center gap-4 text-sm md:text-lg">
              <span class="text-accent-primary font-semibold">
                ${stats.totalAlbums} album${stats.totalAlbums !== 1 ? 's' : ''}
              </span>
              
              <!-- Owned/Wishlist badges -->
              <div class="flex gap-2">
                <span class="badge badge-success text-xs">✓ ${stats.ownedCount} Owned</span>
                <span class="badge badge-neutral text-xs">${stats.wishlistCount} Wishlist</span>
              </div>
              
              <!-- Currency Selector with Owned Total -->
              <div class="currency-selector relative ml-auto">
                <select 
                  id="currencySelector" 
                  class="form-control appearance-none cursor-pointer pr-8 bg-surface-light text-sm"
                >
                  <option value="USD" ${this.currency === 'USD' ? 'selected' : ''}>
                    Owned: ${this.formatCurrency(stats.ownedValueUSD, 'USD')}
                  </option>
                  <option value="BRL" ${this.currency === 'BRL' ? 'selected' : ''}>
                    Owned: ${this.formatCurrency(stats.ownedValueBRL, 'BRL')}
                  </option>
                </select>
                <span class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  ${getIcon('ChevronDown', 'w-4 h-4')}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Filters Section -->
          <div class="filters-section glass-panel p-4 fade-in" style="animation-delay: 0.1s">
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
                  value="${this.escapeHtml(this.filters.search)}"
                />
              </div>
              
              <!-- Format Filter -->
              <div class="filter-dropdown relative">
                <select id="formatFilter" class="form-control appearance-none cursor-pointer pr-8">
                  <option value="all">All Formats</option>
                  <option value="cd" ${this.filters.format === 'cd' ? 'selected' : ''}>CD</option>
                  <option value="vinyl" ${this.filters.format === 'vinyl' ? 'selected' : ''}>Vinyl</option>
                  <option value="dvd" ${this.filters.format === 'dvd' ? 'selected' : ''}>DVD</option>
                  <option value="bluray" ${this.filters.format === 'bluray' ? 'selected' : ''}>Blu-ray</option>
                  <option value="digital" ${this.filters.format === 'digital' ? 'selected' : ''}>Digital</option>
                </select>
                <span class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  ${getIcon('ChevronDown', 'w-4 h-4')}
                </span>
              </div>
              
              <!-- Ownership Filter -->
              <div class="filter-dropdown relative">
                <select id="ownershipFilter" class="form-control appearance-none cursor-pointer pr-8">
                  <option value="all" ${this.filters.ownership === 'all' ? 'selected' : ''}>All Status</option>
                  <option value="owned" ${this.filters.ownership === 'owned' ? 'selected' : ''}>✓ Owned Only</option>
                  <option value="wishlist" ${this.filters.ownership === 'wishlist' ? 'selected' : ''}>Wishlist Only</option>
                </select>
                <span class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  ${getIcon('ChevronDown', 'w-4 h-4')}
                </span>
              </div>
              
              <!-- View Mode Toggle -->
              <button 
                id="toggleViewMode" 
                class="btn ${this.viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}"
                title="Toggle grid/list view"
              >
                ${getIcon(this.viewMode === 'grid' ? 'Grid' : 'List', 'w-5 h-5')}
              </button>
              
              <!-- Create Series from Selected -->
              ${this.selectedAlbums.size > 0 ? `
                <button 
                  id="createSeriesFromSelected" 
                  class="btn btn-primary flex items-center gap-2"
                >
                  ${getIcon('FolderPlus', 'w-5 h-5')}
                  Create Series (${this.selectedAlbums.size})
                </button>
              ` : ''}
            </div>
          </div>
        </header>

        <!-- Albums Grid/List -->
        ${this.renderAlbums(filteredAlbums)}
      </div>
    `
  }

  renderAlbums(albums) {
    if (albums.length === 0) {
      return this.renderEmptyState()
    }

    if (this.viewMode === 'grid') {
      return this.renderGrid(albums)
    } else {
      return this.renderList(albums)
    }
  }

  renderGrid(albums) {
    return `
      <div class="albums-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 fade-in" style="animation-delay: 0.2s">
        ${albums.map(album => this.renderAlbumCard(album)).join('')}
      </div>
    `
  }

  renderAlbumCard(album) {
    const isSelected = this.selectedAlbums.has(album.id)
    const isEditingPrice = this.editingPriceId === album.id
    const isOwned = album.owned !== false // Default to true if not set

    return `
      <div class="album-card glass-panel p-4 relative ${isSelected ? 'ring-2 ring-accent-primary' : ''}" data-album-id="${album.id}">
        <!-- Status Dropdown (top right) -->
        <div class="absolute top-2 right-2 z-10 w-32">
          <div class="relative group">
            <select 
              class="status-select w-full appearance-none pl-3 pr-8 py-1 rounded-full text-xs font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-primary transition-colors bg-surface-dark/90 backdrop-blur-sm
                     ${isOwned ? 'text-green-400 border-green-500/50' :
        album.owned === false ? 'text-pink-400 border-pink-500/50' :
          'text-gray-400 border-gray-500/50'}"
              data-album-id="${album.id}"
              onchange="this.dispatchEvent(new CustomEvent('status-change', { bubbles: true, detail: { albumId: '${album.id}', status: this.value } }))"
            >
              <option value="not-owned" ${album.owned === null || album.owned === undefined ? 'selected' : ''}>Not Owned</option>
              <option value="owned" ${isOwned ? 'selected' : ''}>Owned</option>
              <option value="wishlist" ${album.owned === false ? 'selected' : ''}>Wishlist</option>
            </select>
            <!-- Custom Arrow -->
            <div class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-70">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </div>
        
        <!-- Album Cover -->
        <div class="album-cover mb-3 aspect-square bg-surface-light rounded-lg flex items-center justify-center cursor-pointer view-album-btn" data-album-id="${album.id}">
          ${album.albumData?.coverUrl ? `
            <img src="${album.albumData.coverUrl}" alt="${this.escapeHtml(album.title)}" class="w-full h-full object-cover rounded-lg" />
          ` : `
            <div class="text-gray-600">
              ${getIcon('Disc', 'w-16 h-16')}
            </div>
          `}
        </div>
        
        <!-- Album Info -->
        <h3 class="font-semibold text-lg mb-1 truncate" title="${this.escapeHtml(album.title)}">
          ${this.escapeHtml(album.title)}
        </h3>
        <p class="text-sm text-gray-400 mb-1 truncate">${this.escapeHtml(album.artist)}</p>
        <p class="text-xs text-gray-500 mb-2">${album.year || '—'}</p>
        
        <!-- Format Badge -->
        <div class="mb-3">
          ${this.renderFormatBadge(album.format)}
        </div>
        
        <!-- Price (Inline Editable) -->
        <div class="price-section mb-3">
          ${isEditingPrice ? `
            <input 
              type="number" 
              id="priceInput-${album.id}"
              class="form-control w-full text-accent-primary font-semibold" 
              value="${album.purchasePrice || 0}"
              step="0.01"
              min="0"
              placeholder="Price"
              data-album-id="${album.id}"
              data-currency="${album.currency || this.currency}"
            />
          ` : `
            <button 
              class="price-edit-btn text-accent-primary font-semibold hover:text-accent-secondary transition-colors cursor-pointer text-left w-full"
              data-album-id="${album.id}"
              title="Click to edit price"
            >
              ${album.purchasePrice
        ? this.formatCurrency(album.purchasePrice, album.currency || this.currency)
        : `${this.currency === 'USD' ? '$' : 'R$'} —`
      }
            </button>
          `}
        </div>
        
        <!-- Actions -->
        <div class="flex gap-2">
          <button 
            class="btn btn-sm btn-ghost flex-1 view-album-btn flex items-center justify-center gap-1"
            data-album-id="${album.id}"
          >
            ${getIcon('Eye', 'w-4 h-4')}
            View
          </button>
          <button 
            class="btn btn-sm btn-secondary edit-album-btn flex items-center justify-center gap-1"
            data-album-id="${album.id}"
          >
            ${getIcon('Edit', 'w-4 h-4')}
          </button>
          <button 
            class="btn btn-sm btn-danger delete-album-btn flex items-center justify-center gap-1"
            data-album-id="${album.id}"
          >
            ${getIcon('Trash2', 'w-4 h-4')}
          </button>
        </div>
      </div>
    `
  }

  renderList(albums) {
    return `
      <div class="albums-list space-y-3 fade-in" style="animation-delay: 0.2s">
        ${albums.map(album => this.renderAlbumRow(album)).join('')}
      </div>
    `
  }

  renderAlbumRow(album) {
    const isSelected = this.selectedAlbums.has(album.id)

    return `
      <div class="album-row glass-panel p-4 flex items-center gap-4 ${isSelected ? 'ring-2 ring-accent-primary' : ''}" data-album-id="${album.id}">
        <!-- Checkbox -->
        <input 
          type="checkbox" 
          class="album-checkbox form-checkbox cursor-pointer"
          data-album-id="${album.id}"
          ${isSelected ? 'checked' : ''}
        />
        
        <!-- Cover (small) -->
        <div class="album-cover-small w-16 h-16 bg-surface-light rounded flex items-center justify-center flex-shrink-0">
          ${album.albumData?.coverUrl ? `
            <img src="${album.albumData.coverUrl}" alt="${this.escapeHtml(album.title)}" class="w-full h-full object-cover rounded" />
          ` : `
            ${getIcon('Disc', 'w-8 h-8 text-gray-600')}
          `}
        </div>
        
        <!-- Info -->
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold truncate">${this.escapeHtml(album.title)}</h3>
          <p class="text-sm text-gray-400 truncate">${this.escapeHtml(album.artist)} • ${album.year || '—'}</p>
        </div>
        
        <!-- Format -->
        <div class="flex-shrink-0">
          ${this.renderFormatBadge(album.format)}
        </div>
        
        <!-- Price -->
        <div class="price-section flex-shrink-0 w-32">
          <button 
            class="price-edit-btn text-accent-primary font-semibold hover:text-accent-secondary transition-colors cursor-pointer"
            data-album-id="${album.id}"
            title="Click to edit price"
          >
            ${album.purchasePrice
        ? this.formatCurrency(album.purchasePrice, album.currency || this.currency)
        : `${this.currency === 'USD' ? '$' : 'R$'} —`
      }
          </button>
        </div>
        
        <!-- Actions -->
        <div class="flex gap-2 flex-shrink-0">
          <button class="btn btn-sm btn-secondary edit-album-btn" data-album-id="${album.id}">
            ${getIcon('Edit', 'w-4 h-4')}
          </button>
          <button class="btn btn-sm btn-danger delete-album-btn" data-album-id="${album.id}">
            ${getIcon('Trash2', 'w-4 h-4')}
          </button>
        </div>
      </div>
    `
  }

  renderFormatBadge(format) {
    const formatConfig = {
      cd: { icon: 'Disc', label: 'CD', color: 'text-blue-400' },
      vinyl: { icon: 'Disc', label: 'Vinyl', color: 'text-green-400' },
      cassette: { icon: 'Play', label: 'Cassette', color: 'text-yellow-400' },
      dvd: { icon: 'Film', label: 'DVD', color: 'text-purple-400' },
      bluray: { icon: 'Film', label: 'Blu-ray', color: 'text-cyan-400' },
      digital: { icon: 'Download', label: 'Digital', color: 'text-gray-400' }
    }

    const config = formatConfig[format] || formatConfig.cd

    return `
      <span class="badge inline-flex items-center gap-1 ${config.color}">
        ${getIcon(config.icon, 'w-3 h-3')}
        ${config.label}
      </span>
    `
  }

  renderEmptyState() {
    return `
      <div class="empty-state glass-panel p-12 text-center fade-in" style="animation-delay: 0.2s">
        <div class="mb-6">
          ${getIcon('Archive', 'w-24 h-24 mx-auto text-gray-600')}
        </div>
        <h2 class="text-2xl font-bold mb-3">Your inventory is empty</h2>
        <p class="text-gray-400 mb-6 max-w-md mx-auto">
          Add albums from the Albums view to start tracking your physical collection.
        </p>
        <button 
          id="goToAlbums"
          class="btn btn-primary"
        >
          Go to Albums
        </button>
      </div>
    `
  }

  filterAlbums(albums) {
    return albums.filter(album => {
      // Format filter
      if (this.filters.format !== 'all' && album.format !== this.filters.format) {
        return false
      }

      // Search filter
      if (this.filters.search) {
        const query = this.filters.search.toLowerCase()
        const title = (album.title || '').toLowerCase()
        const artist = (album.artist || '').toLowerCase()
        if (!title.includes(query) && !artist.includes(query)) {
          return false
        }
      }

      // Ownership filter
      if (this.filters.ownership !== 'all') {
        const isOwned = album.owned !== false
        if (this.filters.ownership === 'owned' && !isOwned) return false
        if (this.filters.ownership === 'wishlist' && isOwned) return false
      }

      return true
    })
  }

  formatCurrency(value, currency) {
    if (!value) return currency === 'USD' ? '$0.00' : 'R$ 0,00'

    if (currency === 'BRL') {
      return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    } else {
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
  }
}
