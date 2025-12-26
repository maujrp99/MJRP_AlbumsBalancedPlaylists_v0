import { BaseView } from './BaseView.js'
import { albumsStore } from '../stores/albums.js'
import { albumSeriesStore } from '../stores/albumSeries.js'
import { apiClient } from '../api/client.js'
import { router } from '../router.js'
import { globalProgress } from '../components/GlobalProgress.js'
import { InlineProgress } from '../components/InlineProgress.js'
import { Breadcrumb } from '../components/Breadcrumb.js'
import { albumLoader } from '../services/AlbumLoader.js'
import { optimizedAlbumLoader } from '../services/OptimizedAlbumLoader.js'
import { getIcon } from '../components/Icons.js'
import toast from '../components/Toast.js'
import { showViewAlbumModal } from '../components/ViewAlbumModal.js'
import { createViewModeStrategy } from './strategies/ViewModeStrategy.js'
import { Autocomplete } from '../components/Autocomplete.js'

// Sprint 10: Modular components - Consolidated imports
import {
  renderLoadingProgress as renderLoadingProgressFn,
  renderRankedTracklist as renderRankedTracklistFn,
  renderOriginalTracklist as renderOriginalTracklistFn,
  renderRankingBadge,
  renderExpandedAlbumCard,
  renderExpandedList as renderExpandedListFn,
  renderCompactAlbumCard,
  renderAlbumsGrid as renderAlbumsGridFn,
  renderNoMatchState,
  escapeHtml as escapeHtmlFn,
  wrapInGrid,
  getUniqueArtists as getUniqueArtistsFn,
  renderScopedGrid as renderScopedGridFn,
  renderScopedList as renderScopedListFn,
  filterAlbums as filterAlbumsFn
} from './albums/index.js'
import { AlbumsStateController } from './controllers/AlbumsStateController.js'

import { TracksRankingComparison } from '../components/ranking/TracksRankingComparison.js'

/**
 * AlbumsView
 * Grid of albums with search and filter
 */

export class AlbumsView extends BaseView {
  constructor() {
    super()

    // Sprint 11.5: State Isolation via Controller
    this.controller = new AlbumsStateController()

    // Legacy state (to be deprecated as we migrate)
    this.isLoading = false
    this.loadProgress = { current: 0, total: 0 }

    // Bind State Changes to Render
    this.controller.subscribe((state, event) => {
      console.log(`[AlbumsView] State Update: ${event}`, state)
      if (event === 'filters_changed' || event === 'albums_updated') {
        const grid = this.$('#albumsContainer')
        // Only re-render if we are already mounted? 
        // For now, we rely on the manual updateAlbumsGrid calls from the store,
        // but eventually this listener will drive the UI.
      }
    })

    // Default view mode - now using Strategy Pattern
    this.viewModeKey = localStorage.getItem('albumsViewMode') || 'compact'
    this.viewMode = this.viewModeKey // Keep for backwards compatibility
    this.viewStrategy = createViewModeStrategy(this.viewModeKey, this)

    // Filter state - Sprint 9: Updated to use 'source' instead of 'status'/'bestEverOnly'
    this.filters = {
      artist: 'all',
      year: 'all',
      source: 'all'  // Options: all, pending, acclaim, popularity, ai
    }

    // Store cleanup function
    this.cleanup = null
    this.abortController = null

    // Sprint 7.5: Scope State
    this.currentScope = 'SINGLE' // 'SINGLE' | 'ALL'
    this.targetSeriesId = null

    // Sprint 7.5: Series Edit/Delete State (consolidated from AlbumSeriesListView)
    this.editingSeriesId = null
    this.editingAlbumQueries = []
    this.deletingSeriesId = null
  }

  destroy() {
    // Call parent destroy
    super.destroy()
    console.log('[AlbumsView] Destroying view')

    // Cancel any pending requests
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }

    if (this.cleanup) {
      this.cleanup()
      this.cleanup = null
    }
  }

  async mount(params) {
    await super.mount(params)

    // Sprint 11.5: Listen for enrichment persistence events from child components
    this.container.addEventListener('album-enriched', (e) => {
      const { album } = e.detail
      if (album) {
        console.log('[AlbumsView] Received album-enriched event, saving...', album.title)
        this.controller.persistAlbum(album)
      }
    })
  }

  async render(params) {
    const albums = albumsStore.getAlbums()
    const activeSeries = albumSeriesStore.getActiveSeries()
    const allSeries = albumSeriesStore.getSeries()

    // Determine current scope for render title
    const isAllScope = this.currentScope === 'ALL'
    const pageTitle = isAllScope ? 'All Albums Series' : (activeSeries ? this.escapeHtml(activeSeries.name) : 'Albums')


    // Ghost Albums Prevention (from prod):
    // If albums in store are from a different series than what we're rendering,
    // show empty instead. The mount() will trigger reload for correct series.
    const urlParams = new URLSearchParams(window.location.search)
    let targetSeriesId = params?.seriesId || urlParams.get('seriesId') || activeSeries?.id

    // FIX: Sanitize undefined string
    if (targetSeriesId === 'undefined' || targetSeriesId === 'null') {
      targetSeriesId = null
    }
    const lastLoadedId = albumsStore.getLastLoadedAlbumSeriesId()

    // Filter albums early to use throughout render
    // For ALL scope, we filter globally first, then group later
    // For ALL scope, we filter globally first, then group later
    // displayAlbums was previously defined but removed during refactor.
    // We should use 'albums' from store which was retrieved at line 63.
    // If we want ghost prevention, we should use that logic, but 'albums' is fine for now provided store is consistent.
    // Actually, line 63: const albums = albumsStore.getAlbums()
    const filteredAlbums = this.filterAlbums(albums)

    // Updated render method logic - Using Strategy Pattern
    const contentHtml = this.viewStrategy.render(filteredAlbums, allSeries)

    return `
  <div class="albums-view container" >
    <header class="view-header mb-8 fade-in">
      ${Breadcrumb.render('/albums')}

      <!-- Title Row -->
      <div class="header-title-row mb-6 flex justify-between items-center">
        <h1 class="text-4xl font-bold flex items-center gap-3">
          ${getIcon('Disc', 'w-8 h-8 text-accent-primary')}
          ${pageTitle}
        </h1>

        <button
          id="generatePlaylistsBtn"
          class="tech-btn-primary px-8 py-3 text-base rounded-2xl flex items-center gap-2 hover:scale-105 transition-transform"
          ${filteredAlbums.length === 0 ? 'disabled' : ''}
        >
          ${getIcon('Play', 'w-5 h-5')}
          Generate Playlists
        </button>
      </div>

      <!-- Filters Section -->
      <div class="filters-section glass-panel p-4 mb-6 fade-in relative" style="animation-delay: 0.1s">
        <div class="filters-row flex flex-wrap gap-3 items-center">
          <!-- Search -->
          <div class="search-bar relative flex-1 min-w-[200px]">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              ${getIcon('Search', 'w-5 h-5')}
            </span>
            <input
              type="search"
              id="albumSearch"
              placeholder="Search albums..."
              class="form-control pl-10 w-full"
              value="${this.searchQuery || ''}"
            />
          </div>

          <!-- Series Filter (Sprint 7.5) -->
          <div class="series-dropdown relative min-w-[200px]">
             <select id="seriesFilter" class="form-control appearance-none cursor-pointer pr-8 text-accent-primary font-bold bg-brand-dark/50 border-accent-primary/30">
              <option value="all" ${!activeSeries ? 'selected' : ''}>All Series</option>
              ${albumSeriesStore.getSeries().map(series => `
                <option value="${series.id}" ${activeSeries && activeSeries.id === series.id ? 'selected' : ''}>
                  ${this.escapeHtml(series.name)}
                </option>
              `).join('')}
            </select>
            <span class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-accent-primary">
              ${getIcon('Layers', 'w-4 h-4')}
            </span>
          </div>

          <!-- Artist Filter -->
          <div class="filter-dropdown relative">
            <select id="artistFilter" class="form-control appearance-none cursor-pointer pr-8">
              <option value="all">All Artists</option>
              ${this.getUniqueArtists(albums).map(artist => `
                    <option value="${this.escapeHtml(artist)}" ${this.filters.artist === artist ? 'selected' : ''}>
                      ${this.escapeHtml(artist)}
                    </option>
                  `).join('')}
            </select>
            <span class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              ${getIcon('ChevronDown', 'w-4 h-4')}
            </span>
          </div>

          <!-- Year Filter -->
          <div class="filter-dropdown relative">
            <select id="yearFilter" class="form-control appearance-none cursor-pointer pr-8">
              <option value="all">All Years</option>
              <option value="1960s" ${this.filters.year === '1960s' ? 'selected' : ''}>1960s</option>
              <option value="1970s" ${this.filters.year === '1970s' ? 'selected' : ''}>1970s</option>
              <option value="1980s" ${this.filters.year === '1980s' ? 'selected' : ''}>1980s</option>
              <option value="1990s" ${this.filters.year === '1990s' ? 'selected' : ''}>1990s</option>
              <option value="2000s" ${this.filters.year === '2000s' ? 'selected' : ''}>2000s+</option>
            </select>
            <span class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              ${getIcon('ChevronDown', 'w-4 h-4')}
            </span>
          </div>

          <!-- Source Filter (Unified) -->
          <div class="filter-dropdown relative">
            <select id="sourceFilter" class="form-control appearance-none cursor-pointer pr-8">
              <option value="all">All Sources</option>
              <option value="pending" ${this.filters.source === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="acclaim" ${this.filters.source === 'acclaim' ? 'selected' : ''}>Acclaim (BestEver)</option>
              <option value="popularity" ${this.filters.source === 'popularity' ? 'selected' : ''}>Popularity (Spotify)</option>
              <option value="ai" ${this.filters.source === 'ai' ? 'selected' : ''}>AI Enriched</option>
            </select>
            <span class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              ${getIcon('ChevronDown', 'w-4 h-4')}
            </span>
          </div>

          <!-- Refresh Button (Skip Cache) -->
          <button
            id="refreshAlbums"
            class="btn btn-warning whitespace-nowrap flex items-center gap-2"
            title="Reload albums from API (skip cache)">
            ${getIcon('RefreshCw', 'w-4 h-4')}
            Refresh
          </button>

          <!-- View Mode Toggle - Using Strategy Pattern -->
          <button
            id="toggleViewMode"
            class="${this.viewStrategy.getButtonClass()} whitespace-nowrap">
            ${getIcon(this.viewStrategy.getButtonIcon(), 'w-5 h-5')}
            ${this.viewStrategy.getButtonLabel()}
          </button>
        </div>
        
        <!-- Loading Progress Anchor (Managed by InlineProgress) -->
        <div id="loading-progress-container" class="w-full mt-4 empty:hidden"></div>
      </div>
    </header>

    <!-- Content Container (Grid or List handled by renderScoped methods) -->
    <div id="albumsContainer">
        ${contentHtml}
    </div>

    <!--Empty state container - updated dynamically-->
    <div id="emptyStateContainer">
      ${filteredAlbums.length === 0 && !this.isLoading ? this.renderEmptyState() : ''}
    </div>
        
    <footer class="view-footer mt-12 text-center text-muted text-sm border-t border-white/5 pt-6">
      <p class="last-update">Last updated: ${new Date().toLocaleTimeString()}</p>
    </footer>

    <!-- Edit Series Modal (consolidated from AlbumSeriesListView) -->
    <div id="editSeriesModal" class="modal-overlay hidden">
      <div class="modal-content glass-panel p-6 max-w-2xl w-full mx-4 rounded-xl">
        <div class="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
          <h3 class="text-xl font-bold flex items-center gap-2">
            ${getIcon('Edit', 'w-5 h-5 text-accent-primary')} Edit Series
          </h3>
          <button type="button" class="btn btn-ghost btn-circle" id="closeEditSeriesBtn">
            ${getIcon('X', 'w-5 h-5')}
          </button>
        </div>
        
        <form id="editSeriesForm">
          <div class="form-group mb-6">
            <label class="block text-sm font-medium mb-2">Series Name</label>
            <input type="text" id="editSeriesNameInput" class="form-control w-full" required minlength="3" placeholder="Enter series name...">
          </div>
          
          <div class="form-group mb-6">
            <div class="flex items-center justify-between mb-3">
              <label class="text-sm font-medium">Albums in Series</label>
              <span id="editSeriesAlbumCount" class="badge badge-neutral text-xs">0 albums</span>
            </div>
            
            <div id="editSeriesAlbumsList" class="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar mb-4 bg-black/20 rounded-lg p-3">
              <!-- Albums rendered dynamically -->
            </div>
            
            <div id="editSeriesAutocompleteWrapper" class="mb-4 relative z-50"></div>
            <p class="text-xs text-muted mt-1">Format: Artist - Album Title (e.g., Pink Floyd - The Wall)</p>
          </div>
          
          <div class="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" class="btn btn-secondary" id="cancelEditSeriesBtn">Cancel</button>
            <button type="submit" class="btn btn-primary">${getIcon('Check', 'w-4 h-4')} Save Changes</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Series Modal -->
    <div id="deleteSeriesModal" class="modal-overlay hidden">
      <div class="modal-content glass-panel p-6 max-w-md w-full mx-4 border-l-4 border-red-500 rounded-xl">
        <h3 class="text-xl font-bold mb-2 text-red-400">Delete Series?</h3>
        <p class="mb-4 text-muted">
          Are you sure you want to delete <strong id="deleteSeriesName" class="text-white"></strong>?
        </p>
        <div class="alert alert-info mb-6 text-sm">
          ${getIcon('Info', 'w-4 h-4 inline mr-1')}
          <strong>Safe Delete:</strong> Albums associated with this series will NOT be deleted. They will remain in your inventory.
        </div>
        <div class="flex justify-end gap-3">
          <button type="button" class="btn btn-secondary" id="cancelDeleteSeriesBtn">Cancel</button>
          <button type="button" class="btn btn-danger" id="confirmDeleteSeriesBtn">Delete Series</button>
        </div>
      </div>
    </div>
  </div>
  `
  }

  // MODE 3: Expanded List View - DELEGATED to module
  renderExpandedList(albums) {
    return renderExpandedListFn(albums, {
      searchQuery: this.searchQuery,
      filters: this.filters
    })
  }

  // Ranked Tracklist (for MODE 3) - DELEGATED to module
  renderRankedTracklist(album) {
    return renderRankedTracklistFn(album)
  }

  // Original Tracklist (for MODE 3) - DELEGATED to module
  renderOriginalTracklist(album) {
    return renderOriginalTracklistFn(album)
  }

  // MODE 1: Compact Grid View - DELEGATED to module
  renderAlbumsGrid(albums) {
    return renderAlbumsGridFn(albums, {
      searchQuery: this.searchQuery,
      filters: this.filters
    })
  }

  // Sprint 10: Delegate to modular filter
  filterAlbums(albums) {
    return filterAlbumsFn(albums, {
      searchQuery: this.searchQuery,
      filters: this.filters
    })
  }

  // Sprint 10: Delegate to modular utility
  getUniqueArtists(albums) {
    return getUniqueArtistsFn(albums)
  }

  // Sprint 10: Delegate to modular utility
  escapeHtml(text) {
    return escapeHtmlFn(text)
  }

  // Sprint 10: Delegate to modular renderer
  renderLoadingProgress() {
    return renderLoadingProgressFn(this.loadProgress)
  }


  // Sprint 7.5: Render Grouped Grid for "All Series" - DELEGATED to module
  renderScopedGrid(albums, seriesList) {
    return renderScopedGridFn({
      albums,
      seriesList,
      currentScope: this.currentScope,
      renderAlbumsGrid: (a) => this.renderAlbumsGrid(a)
    })
  }

  // Sprint 7.5: Render Grouped List for "All Series" - DELEGATED to module
  renderScopedList(albums, seriesList) {
    return renderScopedListFn({
      albums,
      seriesList,
      currentScope: this.currentScope,
      renderExpandedList: (a) => this.renderExpandedList(a)
    })
  }

  renderEmptyState() {
    return `
  <div class="empty-state text-center py-16 glass-panel" >
        <div class="text-6xl mb-6 opacity-30">${getIcon('Music', 'w-24 h-24 mx-auto')}</div>
        <h2 class="text-2xl font-bold mb-2">No albums in library</h2>
        <p class="text-muted mb-8">Create a series from the home page to get started</p>
        <button class="btn btn-primary" id="goHomeBtn">
          ${getIcon('ArrowLeft', 'w-4 h-4 mr-2')} Go to Home
        </button>
      </div>
  `
  }

  async mount(params) {
    this.container = document.getElementById('app')

    // Sprint 11.5: Initialize InlineProgress for loading bar
    // FIX: Target specific container below filters (User Feedback)
    const progressContainer = this.$('#loading-progress-container')
    if (progressContainer) {
      this.inlineProgress = new InlineProgress(progressContainer)
    } else {
      console.warn('[AlbumsView] Progress container not found, falling back to app container')
      this.inlineProgress = new InlineProgress(this.container)
    }

    // Sprint 11: Listen for persistence events from child components (e.g. TracksRankingComparison)
    this.on(this.container, 'album-enriched', (e) => {
      const album = e.detail.album
      console.log('[AlbumsView] Received album-enriched event:', album.title)
      this.controller.persistAlbum(album)
      // Toast is handled by component usually, but we can confirm save
    })

    // Attach breadcrumb listeners
    Breadcrumb.attachListeners(this.container)

    // Sprint 7.5: Global delegation for Album actions (Grid & List)
    // We attach this to the container to handle dynamically rendered content (like groups)
    this.on(this.container, 'click', async (e) => {
      // Find closest button or action element
      const target = e.target.closest('[data-action]')
      if (!target) return

      const action = target.dataset.action
      const albumId = target.dataset.albumId
      const seriesId = target.dataset.seriesId

      // Handle series actions first
      if (seriesId) {
        e.stopPropagation()
        switch (action) {
          case 'edit-series':
            this.openEditSeriesModal(seriesId)
            return
          case 'delete-series':
            this.openDeleteSeriesModal(seriesId)
            return
        }
      }

      // Album actions require albumId
      if (!albumId) return

      // Prevent default propagation if it's a button
      e.stopPropagation()

      // Get album object from store
      // Need to find it across series if scope is ALL. 
      // albumsStore.getAlbums() returns current Scope's albums (which is All or Single).
      let album = albumsStore.getAlbums().find(a => a.id === albumId)

      // Safety for fallback
      if (!album) {
        const allSeries = albumSeriesStore.getSeries()
        // Try to find in any loaded series cache if needed, but getAlbums() should have it
        // If scope is ALL, albumsStore should have all albums
      }

      if (!album) {
        console.warn('[AlbumsView] Album not found for action:', action, albumId)
        return
      }

      switch (action) {
        case 'view-modal':
          showViewAlbumModal(album)
          break
        case 'add-to-inventory':
          // FIX: Open modal instead of direct add, to allow selecting format/price
          const { showAddToInventoryModal } = await import('../components/InventoryModals.js')
          showAddToInventoryModal(album, () => {
            // Optional success callback (modal handles toast itself)
            // We could refresh UI here if needed
          })
          break
        case 'remove-album':
          // Import custom modal for better UX
          const { showDeleteAlbumModal } = await import('../components/Modals.js')

          showDeleteAlbumModal(
            album.id,
            `${album.title} - ${album.artist}`,
            async () => {
              try {
                const urlParams = new URLSearchParams(window.location.search)
                const seriesId = urlParams.get('seriesId')

                // 1. Remove from series (Persistence)
                await albumSeriesStore.removeAlbumFromSeries(album, seriesId)

                // 2. Remove from local view store (Immediate UI Feedback)
                albumsStore.removeAlbum(album.id)

                // 3. Success Toast
                toast.success('Album removed from series')
              } catch (err) {
                console.error('Failed to remove album:', err)
                toast.error('Failed to remove album: ' + err.message)
              }
            }
          )
          break
      }
    })

    // Subscribe to albums store
    const unsubscribe = albumsStore.subscribe((state) => {
      console.log('[AlbumsView] Subscription fired: isLoading=', this.isLoading, 'albums=', state.albums?.length)
      if (!this.isLoading) {
        // FIX: Ghost Albums Prevention (GHOST_ALBUMS_REPORT.md)
        // Only update grid if albums belong to the currently active series
        const activeSeries = albumSeriesStore.getActiveSeries()
        const lastLoadedId = albumsStore.getLastLoadedAlbumSeriesId()

        // Guard: Don't render stale albums from a different series
        if (activeSeries && lastLoadedId && lastLoadedId !== activeSeries.id) {
          console.warn('[AlbumsView] Subscription callback: Ignoring stale albums from series:', lastLoadedId)
          return
        }

        this.updateAlbumsGrid(state.albums)
      }
    })
    this.subscriptions.push(unsubscribe)

    // Sprint 7.5: Subscribe to AlbumSeriesStore to update Header (Title/Dropdown)
    const seriesUnsubscribe = albumSeriesStore.subscribe((state) => {
      this.updateHeaderState()
    })
    this.subscriptions.push(seriesUnsubscribe)

    // Setup search
    const searchInput = this.$('#albumSearch')
    if (searchInput) {
      this.on(searchInput, 'input', (e) => {
        this.searchQuery = e.target.value
        this.updateAlbumsGrid(albumsStore.getAlbums())
      })
    }

    // Setup filter dropdowns
    const artistFilter = this.$('#artistFilter')
    if (artistFilter) {
      this.on(artistFilter, 'change', (e) => {
        this.filters.artist = e.target.value
        this.updateAlbumsGrid(albumsStore.getAlbums())
      })
    }

    const yearFilter = this.$('#yearFilter')
    if (yearFilter) {
      this.on(yearFilter, 'change', (e) => {
        this.filters.year = e.target.value
        this.updateAlbumsGrid(albumsStore.getAlbums())
      })
    }

    // Source Filter (replaces Status + BestEver)
    const sourceFilter = this.$('#sourceFilter')
    if (sourceFilter) {
      this.on(sourceFilter, 'change', (e) => {
        this.filters.source = e.target.value
        console.log('[AlbumsView] Source filter changed:', this.filters.source)
        this.updateAlbumsGrid(albumsStore.getAlbums())
      })
    }

    // Refresh Albums Button (Skip Cache)
    const refreshBtn = this.$('#refreshAlbums')
    if (refreshBtn) {
      this.on(refreshBtn, 'click', async () => {
        // Reload current scope
        this.loadScope(this.currentScope, this.targetSeriesId, true)
      })
    }

    // Sprint 7.5: Series Dropdown Listener
    const seriesFilter = this.$('#seriesFilter')
    if (seriesFilter) {
      this.on(seriesFilter, 'change', (e) => {
        const val = e.target.value
        const newScope = val === 'all' ? 'ALL' : 'SINGLE'
        const newId = val === 'all' ? null : val

        this.loadScope(newScope, newId)
      })
    }

    // View Mode Toggle - Using Strategy Pattern
    const toggleViewBtn = this.$('#toggleViewMode')
    if (toggleViewBtn) {
      this.on(toggleViewBtn, 'click', async () => {
        // Toggle mode using Strategy Pattern
        this.viewModeKey = this.viewModeKey === 'compact' ? 'expanded' : 'compact'
        this.viewMode = this.viewModeKey // Keep for backwards compatibility
        this.viewStrategy = createViewModeStrategy(this.viewModeKey, this)
        localStorage.setItem('albumsViewMode', this.viewModeKey)

        // Re-render entire view with new mode (keeps same instance)
        const html = await this.render({})
        this.container.innerHTML = html

        // Re-initialize event listeners (preserves this instance)
        // Get current series info
        const activeSeries = albumSeriesStore.getActiveSeries()
        const currentAlbums = albumsStore.getAlbums()

        // Re-setup all event listeners
        Breadcrumb.attachListeners(this.container)

        // Re-bind search
        const searchInput = this.$('#albumSearch')
        if (searchInput) {
          this.on(searchInput, 'input', (e) => {
            this.searchQuery = e.target.value
            this.updateAlbumsGrid(albumsStore.getAlbums())
          })
        }

        // Re-bind filters
        const artistFilter = this.$('#artistFilter')
        if (artistFilter) {
          this.on(artistFilter, 'change', (e) => {
            this.filters.artist = e.target.value
            this.updateAlbumsGrid(albumsStore.getAlbums())
          })
        }

        const yearFilter = this.$('#yearFilter')
        if (yearFilter) {
          this.on(yearFilter, 'change', (e) => {
            this.filters.year = e.target.value
            this.updateAlbumsGrid(albumsStore.getAlbums())
          })
        }

        // Re-bind Source Filter (replaces Status + BestEver)
        const sourceFilter = this.$('#sourceFilter')
        if (sourceFilter) {
          this.on(sourceFilter, 'change', (e) => {
            this.filters.source = e.target.value
            console.log('[AlbumsView] Source filter changed (after toggle):', this.filters.source)
            this.updateAlbumsGrid(albumsStore.getAlbums())
          })
        }

        // FIX: Re-bind Series Filter
        const seriesFilter = this.$('#seriesFilter')
        if (seriesFilter) {
          this.on(seriesFilter, 'change', (e) => {
            const val = e.target.value
            const newScope = val === 'all' ? 'ALL' : 'SINGLE'
            const newId = val === 'all' ? null : val
            this.loadScope(newScope, newId)
          })
        }

        // Re-bind toggle button (recursive call setup)
        const newToggleBtn = this.$('#toggleViewMode')
        if (newToggleBtn) {
          newToggleBtn.addEventListener('click', () => toggleViewBtn.click())
        }

        // Re-bind other buttons
        const refreshBtn = this.$('#refreshAlbums')
        if (refreshBtn) {
          this.on(refreshBtn, 'click', async () => {
            if (activeSeries?.albumQueries) {
              await this.loadAlbumsFromQueries(activeSeries.albumQueries, true)
            }
          })
        }

        const generateBtn = this.$('#generatePlaylistsBtn')
        if (generateBtn) {
          this.on(generateBtn, 'click', async () => {
            const activeSeries = albumSeriesStore.getActiveSeries()
            const albums = albumsStore.getAlbums()

            if (!activeSeries) {
              toast.warning('No active series. Please create or load a series first.')
              return
            }

            if (albums.length === 0) {
              toast.warning('No albums loaded. Please load albums before generating playlists.')
              return
            }

            // Sprint 8.5: Set CREATING mode explicitly
            const { playlistsStore } = await import('../stores/playlists.js')
            playlistsStore.setCreateMode()

            router.navigate(`/playlists?seriesId=${activeSeries.id}`)
          })
        }

        // FIX: Re-render albums grid after view mode toggle to mount ranking components
        this.updateAlbumsGrid(currentAlbums)
      })
    }

    const goHomeBtn = this.$('#goHomeBtn')
    if (goHomeBtn) {
      this.on(goHomeBtn, 'click', () => router.navigate('/home'))
    }

    // View ranking buttons - improved event delegation
    this.on(this.container, 'click', async (e) => {
      // View Ranking
      const rankingBtn = e.target.closest('[data-action="view-ranking"]')
      if (rankingBtn) {
        const albumId = rankingBtn.dataset.albumId
        if (!albumId) {
          console.error('[AlbumsView] No albumId found on button:', rankingBtn)
          return
        }
        console.log('[AlbumsView] Navigating to ranking:', albumId)
        router.navigate(`/ranking/${albumId}`)
        return
      }

      // NOTE: Refresh button was removed from UI for simplicity

      // NOTE: Remove Album handler is now in a separate event listener below
      // using showDeleteAlbumModal with proper styled confirmation
    })

    // Add to Inventory
    this.on(this.container, 'click', async (e) => {
      const addBtn = e.target.closest('[data-action="add-to-inventory"]')
      if (addBtn) {
        const albumId = addBtn.dataset.albumId
        const album = albumsStore.getAlbums().find(a => a.id === albumId)
        if (album) {
          const { showAddToInventoryModal } = await import('../components/InventoryModals.js')
          showAddToInventoryModal(album, () => {
            // Optional: show success toast
            console.log('Added to inventory')
          })
        }
      }
    })

    // Generate Playlists
    const generateBtn = this.$('#generatePlaylistsBtn')
    if (generateBtn) {
      this.on(generateBtn, 'click', async () => {
        const activeSeries = albumSeriesStore.getActiveSeries()
        const albums = albumsStore.getAlbums()

        // FIX: Add validation for edge cases
        if (!activeSeries) {
          toast.warning('No active series. Please create or load a series first.')
          return
        }

        if (albums.length === 0) {
          toast.warning('No albums loaded. Please load albums before generating playlists.')
          return
        }

        console.log('[AlbumsView] Navigating to playlists with', albums.length, 'albums')

        // Sprint 8.5: Set CREATING mode explicitly
        const { playlistsStore } = await import('../stores/playlists.js')
        playlistsStore.setCreateMode()

        router.navigate(`/playlists?seriesId=${activeSeries.id}`)
      })
    }

    // Sprint 7.5: Edit/Delete Series Modal Listeners (consolidated from AlbumSeriesListView)
    this.setupSeriesModals()

    // Trigger Initial Load
    // We defer this slightly to ensure mount is complete
    // Use URL params or defaults
    const urlParams = new URLSearchParams(window.location.search)
    const urlSeriesId = params?.seriesId || urlParams.get('seriesId')

    // Determine initial scope
    // If ID present -> SINGLE
    // If no ID -> ALL (Default per spec)
    // Exception: If we have an activeSeries in store, we might default to that?
    // Spec says: "Dropdown MUST default to "All Series" when no ID is present in URL."

    // Determine initial scope
    if (urlSeriesId) {
      await this.loadScope('SINGLE', urlSeriesId)
    } else {
      // Clear any stale active series immediately
      albumSeriesStore.setActiveSeries(null)
      await this.loadScope('ALL')
    }

    // Initial Header Sync (after scope is set)
    this.updateHeaderState()
  }

  // Sprint 7.5: Setup Series Modal Event Listeners (consolidated from AlbumSeriesListView)
  setupSeriesModals() {
    const editModal = this.$('#editSeriesModal')
    const deleteModal = this.$('#deleteSeriesModal')

    // Edit Modal Form Submit
    const editForm = this.$('#editSeriesForm')
    if (editForm) {
      this.on(editForm, 'submit', async (e) => {
        e.preventDefault()
        const name = this.$('#editSeriesNameInput').value.trim()
        const saveBtn = editForm.querySelector('button[type="submit"]')

        if (!name || name.length < 3) {
          toast.warning('Series name must be at least 3 characters')
          return
        }

        if (this.editingAlbumQueries.length < 2) {
          toast.warning('Series must have at least 2 albums')
          return
        }

        if (this.editingSeriesId) {
          const originalBtnContent = saveBtn.innerHTML

          try {
            saveBtn.disabled = true
            saveBtn.innerHTML = `${getIcon('Loader', 'w-4 h-4 animate-spin')} Saving...`

            await albumSeriesStore.updateSeries(
              this.editingSeriesId,
              { name, albumQueries: this.editingAlbumQueries }
            )

            toast.success('Series updated successfully!')
            this.closeSeriesModal(editModal)

            // Reload current scope to reflect changes
            this.loadScope(this.currentScope, this.targetSeriesId)
          } catch (err) {
            console.error('Failed to update series:', err)
            toast.error('Failed to update series: ' + err.message)
          } finally {
            if (saveBtn) {
              saveBtn.disabled = false
              saveBtn.innerHTML = originalBtnContent
            }
          }
        }
      })
    }

    // Edit Modal Close Buttons
    const closeEditBtn = this.$('#closeEditSeriesBtn')
    const cancelEditBtn = this.$('#cancelEditSeriesBtn')
    if (closeEditBtn) this.on(closeEditBtn, 'click', () => this.closeSeriesModal(editModal))
    if (cancelEditBtn) this.on(cancelEditBtn, 'click', () => this.closeSeriesModal(editModal))

    // Edit Modal - Remove album from list delegation
    const albumsList = this.$('#editSeriesAlbumsList')
    if (albumsList) {
      this.on(albumsList, 'click', (e) => {
        const btn = e.target.closest('[data-action="remove-album-from-edit"]')
        if (btn) {
          const index = parseInt(btn.dataset.index)
          this.editingAlbumQueries.splice(index, 1)
          this.renderSeriesAlbumsList()
        }
      })
    }

    // Delete Modal Confirm
    const confirmDeleteBtn = this.$('#confirmDeleteSeriesBtn')
    if (confirmDeleteBtn) {
      this.on(confirmDeleteBtn, 'click', async () => {
        if (this.deletingSeriesId) {
          try {
            await albumSeriesStore.deleteSeries(this.deletingSeriesId)
            toast.success('Series deleted')
            this.closeSeriesModal(deleteModal)

            // If we were viewing this series, switch to All
            if (this.targetSeriesId === this.deletingSeriesId) {
              this.loadScope('ALL')
            } else {
              this.loadScope(this.currentScope, this.targetSeriesId)
            }
          } catch (err) {
            toast.error('Failed to delete series: ' + err.message)
          }
        }
      })
    }

    // Delete Modal Close Buttons
    const cancelDeleteBtn = this.$('#cancelDeleteSeriesBtn')
    if (cancelDeleteBtn) this.on(cancelDeleteBtn, 'click', () => this.closeSeriesModal(deleteModal))
  }

  // Open Edit Series Modal
  openEditSeriesModal(seriesId) {
    const series = albumSeriesStore.getSeries().find(s => s.id === seriesId)
    if (!series) {
      toast.error('Series not found')
      return
    }

    this.editingSeriesId = seriesId
    this.editingAlbumQueries = [...(series.albumQueries || [])]

    const modal = this.$('#editSeriesModal')
    const nameInput = this.$('#editSeriesNameInput')

    if (nameInput) nameInput.value = series.name
    this.renderSeriesAlbumsList()
    this.initSeriesAutocomplete()

    if (modal) modal.classList.remove('hidden')
  }

  // Open Delete Series Modal
  openDeleteSeriesModal(seriesId) {
    const series = albumSeriesStore.getSeries().find(s => s.id === seriesId)
    if (!series) {
      toast.error('Series not found')
      return
    }

    this.deletingSeriesId = seriesId

    const modal = this.$('#deleteSeriesModal')
    const nameEl = this.$('#deleteSeriesName')

    if (nameEl) nameEl.textContent = series.name
    if (modal) modal.classList.remove('hidden')
  }

  // Render Albums List inside Edit Modal
  renderSeriesAlbumsList() {
    const albumsList = this.$('#editSeriesAlbumsList')
    const countEl = this.$('#editSeriesAlbumCount')

    if (countEl) countEl.textContent = `${this.editingAlbumQueries.length} albums`

    if (albumsList) {
      if (this.editingAlbumQueries.length === 0) {
        albumsList.innerHTML = `<p class="text-gray-500 text-sm italic">No albums yet. Use search below to add.</p>`
        return
      }

      albumsList.innerHTML = this.editingAlbumQueries.map((query, i) => `
        <div class="album-item flex items-center justify-between p-2 bg-white/5 rounded-lg">
          <span class="text-sm truncate flex-1 mr-2">${this.escapeHtml(query)}</span>
          <button type="button" class="btn btn-ghost btn-sm text-red-400 hover:text-red-300" data-action="remove-album-from-edit" data-index="${i}">
            ${getIcon('X', 'w-4 h-4')}
          </button>
        </div>
      `).join('')
    }
  }

  // Close any series modal
  closeSeriesModal(modal) {
    if (modal) {
      modal.classList.add('hidden')
    }
    this.editingSeriesId = null
    this.editingAlbumQueries = []
    this.deletingSeriesId = null
  }

  // Initialize Autocomplete for adding albums in Edit Series Modal
  initSeriesAutocomplete() {
    const wrapper = this.$('#editSeriesAutocompleteWrapper')
    if (!wrapper) return

    // Clear existing autocomplete if re-opening modal
    wrapper.innerHTML = ''

    // Load album data for autocomplete
    optimizedAlbumLoader.load().catch(console.error)

    const autocomplete = new Autocomplete({
      placeholder: 'Search to add album...',
      loader: optimizedAlbumLoader,
      onSelect: (item) => {
        const entry = `${item.artist} - ${item.album}`

        if (this.editingAlbumQueries.includes(entry)) {
          toast.warning('This album is already in the list')
          return
        }

        this.editingAlbumQueries.push(entry)
        this.renderSeriesAlbumsList()
        toast.success(`Added: ${item.album}`)

        // Clear input
        const input = wrapper.querySelector('input')
        if (input) {
          input.value = ''
          input.focus()
        }
      }
    })

    wrapper.appendChild(autocomplete.render())
  }

  // Sprint 7.5: Load Scope (Architecture)
  async loadScope(scopeType, seriesId = null, skipCache = false) {
    this.currentScope = scopeType
    this.targetSeriesId = seriesId
    this.isLoading = true

    // Update URL without reload (if needed)
    const newUrl = seriesId ? `/albums?seriesId=${seriesId}` : '/albums'
    if (window.location.pathname + window.location.search !== newUrl) {
      window.history.pushState({}, '', newUrl)
    }

    try {
      // 1. Reset Store Context
      // 'ALL' scope uses a special ID to prevent mixing
      const storeContextId = scopeType === 'ALL' ? 'ALL_SERIES_VIEW' : seriesId

      albumsStore.setActiveAlbumSeriesId(storeContextId)
      albumsStore.reset(true) // Clear albums, keep context ID

      this.updateAlbumsGrid([]) // Clear UI

      // 2. Resolve Queries
      let queriesToLoad = []

      // Start inline progress
      if (this.inlineProgress) this.inlineProgress.start()

      if (scopeType === 'ALL') {
        await albumSeriesStore.loadFromFirestore() // Ensure we have latest series list
        const allSeries = albumSeriesStore.getSeries()
        // Aggregate all queries
        allSeries.forEach(s => {
          if (s.albumQueries) queriesToLoad.push(...s.albumQueries)
        })
        // Clear active series in store so "All" is active concept
        albumSeriesStore.setActiveSeries(null)

      } else {
        // Single Series
        // Ensure Series info is loaded
        let series = albumSeriesStore.getSeries().find(s => s.id === seriesId)
        if (!series) {
          // Retry logic for initialization race condition
          let retries = 0
          while (retries < 5) {
            try {
              await albumSeriesStore.loadFromFirestore()
              break
            } catch (err) {
              if (err.message.includes('Repository not initialized')) {
                console.warn(`[AlbumsView] Store not ready, retrying (${retries + 1}/5)...`)
                await new Promise(r => setTimeout(r, 300))
                retries++
              } else {
                throw err
              }
            }
          }
          if (retries >= 5) throw new Error('AlbumStore failed to initialize')

          series = albumSeriesStore.getSeries().find(s => s.id === seriesId)
        }

        if (series) {
          albumSeriesStore.setActiveSeries(series.id)
          queriesToLoad = series.albumQueries || []
        }
      }


      // 3. Load Data
      this.updateHeaderState() // Sync Dropdown
      if (queriesToLoad.length > 0) {
        await this.loadAlbumsFromQueries(queriesToLoad, skipCache)
      } else {
        this.isLoading = false
        if (this.inlineProgress) this.inlineProgress.finish()
        this.updateAlbumsGrid([])
      }

    } catch (err) {
      console.error('[AlbumsView] loadScope failed', err)
      this.isLoading = false
      toast.error('Failed to load series data')
    }
  }

  async loadAlbumsFromQueries(queries, skipCache = false) {
    // FIX #15: Cancel previous requests FIRST, before clearing store
    // This prevents race condition where old requests complete after reset
    if (this.abortController) {
      console.log('[AlbumsView] Aborting previous fetch operation')
      this.abortController.abort()
      this.abortController = null
    }

    // Create new abort controller for this operation
    this.abortController = new AbortController()

    // FIX: Set lastLoadedSeriesId BEFORE reset so subscription guard works during load
    const targetSeries = albumSeriesStore.getActiveSeries()
    if (targetSeries) {
      albumsStore.setLastLoadedAlbumSeriesId(targetSeries.id)
    }

    // NOW reset store but PRESERVE seriesId (no pending requests can add albums after this)
    albumsStore.reset(true) // FIX: Ghost Albums - preserve series context

    // Force immediate UI clear
    const grid = this.$('#albumsGrid')
    if (grid) grid.innerHTML = ''
    const list = this.$('#albumsList')
    if (list) list.innerHTML = ''



    this.isLoading = true
    this.updateAlbumsGrid([]) // Clear grid immediately to show loading state



    this.loadProgress = { current: 0, total: queries.length }

    // Initial render with progress - REMOVED legacy insertion
    // InlineProgress handles this now via start()
    // const container = this.$('#albumsGrid') || this.$('#albumsList')
    // if (container) ...

    try {
      const { results, errors } = await apiClient.fetchMultipleAlbums(
        queries,
        (current, total, result) => {
          // Ignore updates if aborted
          if (this.abortController.signal.aborted) return

          this.loadProgress = { current, total }

          // Sprint 11.5: Inline Progress Update
          if (this.inlineProgress) {
            const percent = Math.round((current / total) * 100)
            const label = result.album ? `Loading: ${result.album.artist} - ${result.album.title}` : `Processing... (${percent}%)`
            this.inlineProgress.update(current, total, label)
          } else {
            this.updateLoadingProgress() // Legacy fallback
          }

          // Add successful albums incrementally
          if (result.status === 'success' && result.album) {

            // FIX: Hydrate with local cover if missing
            if (!result.album.coverUrl && !result.album.artworkTemplate) {
              // We can't await here easily inside the callback if it's not async-safe in ApiClient
              // But ApiClient awaits the callback, so we should be good if we make the callback async?
              // Actually, let's just do it "fire and forget" or assume fast lookup?
              // Better: ApiClient structure check. 
              // Assuming checking the OptimizedLoader is fast (WebWorker). 
              // We'll wrap in a self-executing async or promise handling if needed, 
              // but ApiClient usually awaits the callback.

              // For now, let's try to find it.
              optimizedAlbumLoader.findAlbum(result.album.artist, result.album.title).then(localMatch => {
                if (localMatch) {
                  result.album.coverUrl = optimizedAlbumLoader.getArtworkUrl(localMatch, 500)
                }
                albumsStore.addAlbum(result.album)

                // Save to Firestore (non-blocking)
                if (this.db) {
                  albumsStore.saveToFirestore(this.db, result.album).catch(console.warn)
                }
              })
            } else {
              albumsStore.addAlbum(result.album)
              if (this.db) {
                albumsStore.saveToFirestore(this.db, result.album).catch(console.warn)
              }
            }
          }
        },
        skipCache,  // Pass skipCache flag to API client
        this.abortController.signal // Pass signal
      )

      if (errors.length > 0) {
        console.warn(`${errors.length} albums failed to load: `, errors)
      }
    } catch (error) {
      console.error('Failed to load albums:', error)
      toast.error('Error loading albums. Please try again.')
    } finally {
      this.isLoading = false
      globalProgress.finish()
      if (this.inlineProgress) this.inlineProgress.finish()

      // Remove loading overlay
      const overlay = this.$('.loading-overlay')
      if (overlay) {
        overlay.remove()
      }

      // Final update
      const finalAlbums = albumsStore.getAlbums()
      console.log('[AlbumsView] Final update in loadAlbumsFromQueries: albums=', finalAlbums?.length, 'activeSeriesId=', albumsStore.getActiveAlbumSeriesId())
      this.updateAlbumsGrid(finalAlbums)
    }
  }

  updateLoadingProgress() {
    const overlay = this.$('.loading-overlay')
    if (overlay) {
      overlay.outerHTML = this.renderLoadingProgress()
    }
  }

  updateAlbumsGrid(albums) {
    // Guard: View may have been unmounted while async operations were in flight
    if (!this.container || !document.contains(this.container)) {
      console.log('[AlbumsView] View unmounted, skipping updateAlbumsGrid')
      return
    }

    console.log('[AlbumsView] updateAlbumsGrid called: albums=', albums?.length, 'isLoading=', this.isLoading, 'currentScope=', this.currentScope)

    // If loading, show empty but don't warn
    if (this.isLoading && albums.length === 0) {
      const grid = this.$('#albumsGrid')
      if (grid) grid.innerHTML = ''
      return
    }

    // Ghost Albums Prevention (from prod):
    // Store subscriptions can trigger this method with stale data from previous series.
    // Early exit if trying to render albums from wrong series.
    const activeSeries = albumSeriesStore.getActiveSeries()
    const lastLoadedId = albumsStore.getLastLoadedAlbumSeriesId()

    console.log('[AlbumsView] Guard check: activeSeries=', activeSeries?.id, 'lastLoadedId=', lastLoadedId)

    // FIX: For SINGLE scope, if we have albums and matching lastLoadedId, render them
    // even if activeSeries is temporarily null due to timing
    if (this.currentScope === 'SINGLE') {
      // If lastLoadedId matches our targetSeriesId and we have albums, render them
      if (lastLoadedId === this.targetSeriesId && albums.length > 0) {
        console.log('[AlbumsView] SINGLE scope: rendering', albums.length, 'albums for', this.targetSeriesId)
        // Continue to render
      } else if (!activeSeries && albums.length === 0) {
        console.warn('[AlbumsView] SINGLE scope: No active series and no albums. Clearing view.')
        this.renderEmptyState()
        const grid = this.$('#albumsGrid')
        if (grid) grid.innerHTML = ''
        return
      }
    } else if (this.currentScope === 'ALL') {
      // For ALL scope, just render what we have
      console.log('[AlbumsView] ALL scope: rendering', albums.length, 'albums')
    }

    const filtered = this.filterAlbums(albums)
    console.log('[AlbumsView] After filterAlbums: filtered=', filtered?.length, 'from albums=', albums?.length)

    // State Isolation: Feed data to controller
    this.controller.setAlbums(albums)
    this.controller.setFilters({ searchQuery: this.searchQuery || '' }) // Sync legacy search

    // Update Generate Playlists button state
    const generateBtn = this.$('#generatePlaylistsBtn')
    const readiness = this.controller.checkSeriesReadiness()

    if (generateBtn) {
      if (filtered.length === 0) {
        generateBtn.setAttribute('disabled', 'true')
        generateBtn.title = 'No albums to generate from'
      } else if (!readiness.isReady) {
        // Enforce Total Ranking Integrity
        generateBtn.setAttribute('disabled', 'true')
        generateBtn.title = `Readiness Alert: ${readiness.unrankedCount} albums are missing ranking data. Enrich them first.`
        console.warn('[AlbumsView] Series not ready for generation:', readiness.unrankedAlbums.map(a => a.title))
      } else if (this.currentScope === 'ALL') {
        generateBtn.setAttribute('disabled', 'true')
        generateBtn.title = 'Select a specific series to generate playlists'
      } else {
        generateBtn.removeAttribute('disabled')
        generateBtn.title = 'Generate Balanced Playlists'
      }
    }

    // Update the correct container based on viewMode
    // FIX: The container ID is 'albumsContainer', not 'albumsGrid' or 'albumsList'!
    const container = this.$('#albumsContainer')
    console.log('[AlbumsView] Container element found:', !!container, 'viewMode:', this.viewMode)

    if (!container) {
      console.error('[AlbumsView] CRITICAL: #albumsContainer not found in DOM!')
      return
    }

    // Render using Strategy Pattern
    const allSeries = albumSeriesStore.getSeries()
    const html = this.viewStrategy.render(filtered, allSeries)
    console.log('[AlbumsView] Strategy rendered HTML length:', html?.length, 'mode:', this.viewModeKey)
    container.innerHTML = html

    // Sprint 11: Hydrate Ranking Comparison Components (Mode 3)
    const rankingContainers = container.querySelectorAll('.ranking-comparison-container')
    console.log(`[AlbumsView] Hydrating ${rankingContainers.length} ranking containers`)
    rankingContainers.forEach(el => {
      const albumId = el.dataset.albumId
      const album = filtered.find(a => a.id === albumId)
      if (album) {
        console.log(`[AlbumsView] Mounting TracksRankingComparison for album: ${album.title} (${album.id})`)
        new TracksRankingComparison({ album }).mount(el)
      } else {
        console.warn(`[AlbumsView] Album not found for ranking hydration: ${albumId}`)
      }
    })

    // Update empty state container
    const emptyStateContainer = this.$('#emptyStateContainer')
    if (emptyStateContainer) {
      emptyStateContainer.innerHTML = filtered.length === 0 && !this.isLoading ? this.renderEmptyState() : ''
    }

  }



  createElementFromHTML(html) {
    const template = document.createElement('template')
    template.innerHTML = html.trim()
    return template.content.firstChild
  }

  // Sprint 7.5: Update Header UI (Title & Dropdown) dynamically
  updateHeaderState() {
    const activeSeries = albumSeriesStore.getActiveSeries()
    const isAllScope = this.currentScope === 'ALL'

    // 1. Update Title
    const titleEl = this.$('.header-title-row h1')
    if (titleEl) {
      const pageTitle = isAllScope ? 'All Albums Series' : (activeSeries ? this.escapeHtml(activeSeries.name) : 'Albums')
      // Preserve icon
      titleEl.innerHTML = `
          ${getIcon('Disc', 'w-8 h-8 text-accent-primary')}
          ${pageTitle}
        `
    }

    // 2. Update Dropdown Value
    const seriesSelect = this.$('#seriesFilter')
    if (seriesSelect) {
      // If options are missing (late load), repopulate them?
      // Check if we need to re-render options
      const allSeries = albumSeriesStore.getSeries()
      const currentOptions = seriesSelect.options.length

      // If we have more series than options (minus 'all'), re-render options
      if (allSeries.length > 0 && currentOptions <= 1) {
        const optionsHtml = `
              <option value="all">All Series</option>
              ${allSeries.map(series => `
                <option value="${series.id}">
                  ${this.escapeHtml(series.name)}
                </option>
              `).join('')}
            `
        seriesSelect.innerHTML = optionsHtml
      }

      if (isAllScope || !activeSeries) {
        seriesSelect.value = 'all'
      } else {
        seriesSelect.value = activeSeries.id
      }
    }
  }
}
