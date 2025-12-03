import { BaseView } from './BaseView.js'
import { albumsStore } from '../stores/albums.js'
import { seriesStore } from '../stores/series.js'
import { apiClient } from '../api/client.js'
import { router } from '../router.js'
import { Breadcrumb } from '../components/Breadcrumb.js'
import { getIcon } from '../components/Icons.js'

/**
 * AlbumsView
 * Grid of albums with search and filter
 */

export class AlbumsView extends BaseView {
  constructor() {
    super()
    this.isLoading = false
    this.searchQuery = ''
    this.loadProgress = { current: 0, total: 0 }

    // Default view mode
    this.viewMode = localStorage.getItem('albumsViewMode') || 'compact' // 'compact' (grid) or 'expanded'

    // Filter state
    this.filters = {
      artist: 'all',
      year: 'all',
      status: 'all',
      bestEverOnly: false
    }

    // Store cleanup function
    this.cleanup = null
    this.abortController = null
  }

  destroy() {
    // Call parent destroy
    super.destroy()


    // Cancel any pending requests
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }

    // Custom cleanup
    if (this.cleanup) {
      this.cleanup()
      this.cleanup = null
    }
  }

  async render(params) {
    const albums = albumsStore.getAlbums()
    const activeSeries = seriesStore.getActiveSeries()
    // Priority: URL param > Active Series
    const urlParams = new URLSearchParams(window.location.search)
    const targetSeriesId = params?.seriesId || urlParams.get('seriesId') || activeSeries?.id

    // Ghost Album Prevention:
    // If the store has albums from a different series than what we are about to show,
    // ignore them in the render. The mount() method will trigger a reload.
    const lastLoadedId = albumsStore.getLastLoadedSeriesId()
    let displayAlbums = albums

    if (targetSeriesId && lastLoadedId && targetSeriesId !== lastLoadedId) {
      // console.log('[AlbumsView] Ghost Albums prevented: Stored series', lastLoadedId, '!= Target', targetSeriesId)
      displayAlbums = []
    }

    // Filter albums early to use throughout render
    const filteredAlbums = this.filterAlbums(displayAlbums)



    return `
      <div class="albums-view container">
        <header class="view-header mb-8 fade-in">
          ${Breadcrumb.render('/albums')}
          
          <!-- Title Row -->
          <div class="header-title-row mt-6 mb-6 flex justify-between items-center">
            <h1 class="text-4xl font-bold flex items-center gap-3">
              ${getIcon('Disc', 'w-8 h-8 text-accent-primary')}
              ${activeSeries ? this.escapeHtml(activeSeries.name) : 'All Albums'}
            </h1>
            
            <button 
              id="generatePlaylistsBtn" 
              class="btn btn-primary flex items-center gap-2"
              ${filteredAlbums.length === 0 ? 'disabled' : ''}
            >
              ${getIcon('Play', 'w-5 h-5')}
              Generate Playlists
            </button>
          </div>
          
          <!-- Filters Section -->
          <div class="filters-section glass-panel p-4 mb-6 fade-in" style="animation-delay: 0.1s">
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
                  value="${this.searchQuery}"
                />
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
              
              <!-- Status Filter -->
              <div class="filter-dropdown relative">
                <select id="statusFilter" class="form-control appearance-none cursor-pointer pr-8">
                  <option value="all">All Status</option>
                  <option value="rated" ${this.filters.status === 'rated' ? 'selected' : ''}>Rated</option>
                  <option value="pending" ${this.filters.status === 'pending' ? 'selected' : ''}>Pending</option>
                </select>
                <span class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  ${getIcon('ChevronDown', 'w-4 h-4')}
                </span>
              </div>
              
              <!-- BestEver Toggle -->
              <label class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                <input 
                  type="checkbox" 
                  id="bestEverOnly" 
                  class="form-checkbox"
                  ${this.filters.bestEverOnly ? 'checked' : ''}
                />
                <span class="text-sm font-medium whitespace-nowrap">BestEver only</span>
              </label>
              
              <!-- Refresh Button (Skip Cache) -->
              <button 
                id="refreshAlbums" 
                class="btn btn-warning whitespace-nowrap flex items-center gap-2"
                title="Reload albums from API (skip cache)">
                ${getIcon('RefreshCw', 'w-4 h-4')}
                Refresh
              </button>
              
              <!-- View Mode Toggle -->
              <button 
                id="toggleViewMode" 
                class="btn ${this.viewMode === 'compact' ? 'btn-primary' : 'btn-secondary'} whitespace-nowrap">
                ${getIcon(this.viewMode === 'compact' ? 'List' : 'Grid', 'w-5 h-5')}
                ${this.viewMode === 'compact' ? 'View Expanded' : 'View Compact'}
              </button>
            </div>
          </div>
        </header>



        ${this.isLoading ? this.renderLoadingProgress() : ''}

        <!-- Conditional rendering based on viewMode -->
        ${this.viewMode === 'expanded' ?
        `<div class="albums-list space-y-6" id="albumsList">
            ${this.renderExpandedList(filteredAlbums)}
          </div>` :
        `<div class="albums-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" id="albumsGrid">
            ${this.renderAlbumsGrid(filteredAlbums)}
          </div>`
      }

        <!-- Empty state container - updated dynamically -->
        <div id="emptyStateContainer">
          ${filteredAlbums.length === 0 && !this.isLoading ? this.renderEmptyState() : ''}
        </div>
        
        <footer class="view-footer mt-12 text-center text-muted text-sm border-t border-white/5 pt-6">
          <p class="last-update">Last updated: ${new Date().toLocaleTimeString()}</p>
        </footer>
      </div>
    `
  }

  // MODE 3: Expanded List View
  renderExpandedList(albums) {
    if (albums.length === 0 && (this.searchQuery || Object.values(this.filters).some(v => v !== 'all' && v !== false))) {
      return `
        <div class="text-center py-12 text-muted">
          <p class="text-xl mb-2">No albums match your filters</p>
          <p class="text-sm">Try adjusting your search or filters</p>
        </div>
      `
    }

    // DEBUG: Log first album structure
    // if (albums.length > 0) { ... }

    return albums.map((album, idx) => {


      return `
      <div class="expanded-album-card glass-panel p-6 fade-in" style="animation-delay: ${idx * 0.05}s" data-album-id="${album.id || ''}">
        <!-- Album Header -->
        <div class="album-header-compact flex items-start gap-4 mb-6 pb-4 border-b border-white/10">
          <!-- Album Cover -->
          <div class="album-cover w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
            ${album.coverUrl ?
          `<img src="${album.coverUrl}" alt="${this.escapeHtml(album.title)}" class="w-full h-full object-cover rounded-xl" />` :
          `<div class="text-2xl opacity-20">${getIcon('Music', 'w-12 h-12')}</div>`
        }
          </div>

          <!-- Album Info -->
          <div class="flex-1">
            <h3 class="text-2xl font-bold mb-1">${getIcon('Music', 'w-6 h-6 inline mr-2')}${this.escapeHtml(album.title)}</h3>
            <p class="text-accent-primary text-lg mb-2">${this.escapeHtml(album.artist)}</p>
            <div class="flex flex-wrap gap-2 text-sm">
              ${album.year ? `<span class="badge badge-neutral">${album.year}</span>` : ''}
              <span class="badge badge-neutral">${album.tracks?.length || 0} tracks</span>
              ${(() => {
          const hasRatings = album.acclaim?.hasRatings || album.tracks?.some(t => t.rating > 0)
          return hasRatings ?
            `<span class="badge badge-success flex items-center gap-1">${getIcon('Check', 'w-3 h-3')} Rated</span>` :
            `<span class="badge badge-warning flex items-center gap-1">${getIcon('AlertTriangle', 'w-3 h-3')} Pending</span>`
        })()}
              ${album.bestEverAlbumId ? `
                <a href="https://www.besteveralbums.com/thechart.php?a=${album.bestEverAlbumId}" target="_blank" rel="noopener noreferrer" class="badge badge-primary hover:badge-accent transition-colors flex items-center gap-1">
                  ${getIcon('ExternalLink', 'w-3 h-3')} BestEver
                </a>
              ` : ''}
            </div>
          </div>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="flex flex-col gap-2 ml-4">
            <button 
              class="btn btn-secondary btn-sm whitespace-nowrap"
              data-action="add-to-inventory"
              data-album-id="${album.id || ''}"
            >
              ${getIcon('Archive', 'w-4 h-4')} Add to Inventory
            </button>
          </div>
        </div>

        <!-- Dual Tracklists -->
        <div class="dual-tracklists-compact grid md:grid-cols-2 gap-6">
          ${this.renderRankedTracklist(album)}
          ${this.renderOriginalTracklist(album)}
        </div>
      </div>
    `
    }).join('')
  }

  // Ranked Tracklist (for MODE 3)
  renderRankedTracklist(album) {
    const tracks = album.tracks || []
    if (tracks.length === 0) {
      return '<p class="text-muted text-sm">No tracks available</p>'
    }

    // Sort by rating (descending)
    const rankedTracks = [...tracks].sort((a, b) => (b.rating || 0) - (a.rating || 0))

    return `
      <div class="tracklist-section">
        <h4 class="text-sm font-bold mb-3 flex items-center gap-2 text-accent-primary">
          ${getIcon('TrendingUp', 'w-4 h-4')}
          Ranked by Acclaim
        </h4>
        <div class="tracks-list-compact space-y-1 text-sm">
          ${rankedTracks.map((track, idx) => {
      const rating = track.rating || 0
      const medal = idx < 3 ? (idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉') : ''
      return `
              <div class="track-row-compact flex items-center gap-2 py-1 px-2 rounded hover:bg-white/5">
                <span class="track-pos w-6 text-xs text-muted text-center">${medal || (idx + 1)}</span>
                <span class="track-name flex-1 truncate">${this.escapeHtml(track.title || track.name)}</span>
                ${rating > 0 ? `<span class="track-rating badge badge-sm ${rating >= 90 ? 'badge-success' : rating >= 80 ? 'badge-primary' : 'badge-neutral'}">⭐ ${rating}</span>` : ''}
              </div>
            `
    }).join('')}
        </div>
      </div>
    `
  }

  // Original Tracklist (for MODE 3)
  renderOriginalTracklist(album) {
    // Use tracksOriginalOrder if available, otherwise fall back to tracks
    const tracks = album.tracksOriginalOrder || album.tracks || []


    if (tracks.length === 0) {
      return '<p class="text-muted text-sm">No tracks available</p>'
    }

    return `
      <div class="tracklist-section">
        <h4 class="text-sm font-bold mb-3 flex items-center gap-2 text-accent-secondary">
          ${getIcon('List', 'w-4 h-4')}
          Original Album Order
        </h4>
        <div class="tracks-list-compact space-y-1 text-sm">
          ${tracks.map((track, idx) => {
      const rating = track.rating || 0
      // Use track position for correct numbering
      const position = track.position || (idx + 1)
      return `
              <div class="track-row-compact flex items-center gap-2 py-1 px-2 rounded hover:bg-white/5">
                <span class="track-pos w-6 text-xs text-muted text-center">${position}</span>
                <span class="track-name flex-1 truncate">${this.escapeHtml(track.title || track.name)}</span>
                ${rating > 0 ? `<span class="track-rating badge badge-sm badge-neutral opacity-70">⭐ ${rating}</span>` : ''}
              </div>
            `
    }).join('')}
        </div>
      </div>
    `
  }

  // MODE 1: Compact Grid View
  renderAlbumsGrid(albums) {
    // albums is already filtered from render(), don't filter again

    if (albums.length === 0 && (this.searchQuery || Object.values(this.filters).some(v => v !== 'all' && v !== false))) {
      return `
        <div class="col-span-full text-center py-12 text-muted">
          <p class="text-xl mb-2">No albums match your filters</p>
          <p class="text-sm">Try adjusting your search or filters</p>
        </div>
      `
    }

    return albums.map(album => `
      <div class="album-card group relative overflow-hidden" data-album-id="${album.id || ''}">
        <div class="album-cover aspect-square bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center mb-4 rounded-xl relative">
          ${album.coverUrl ?
        `<img src="${album.coverUrl}" alt="${this.escapeHtml(album.title)}" class="w-full h-full object-cover rounded-xl" />` :
        `<div class="text-6xl opacity-20">${getIcon('Music', 'w-24 h-24')}</div>`
      }
          
          <!-- Hover Overlay -->
          <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
             <button class="btn-icon bg-white/10 hover:bg-white/20 text-white p-3 rounded-full" title="Refresh Data">
               ${getIcon('Refresh', 'w-5 h-5')}
             </button>
             <button class="btn-icon bg-white/10 hover:bg-white/20 text-white p-3 rounded-full" title="Remove Album">
               ${getIcon('Trash', 'w-5 h-5')}
             </button>
             <button class="btn-icon bg-white/10 hover:bg-white/20 text-white p-3 rounded-full" title="Edit Album" data-action="edit-album" data-album-id="${album.id || ''}">
               ${getIcon('Edit', 'w-5 h-5')}
             </button>
             <button class="btn-icon bg-white/10 hover:bg-white/20 text-white p-3 rounded-full" title="Add to Inventory" data-action="add-to-inventory" data-album-id="${album.id || ''}">
               ${getIcon('Archive', 'w-5 h-5')}
             </button>
          </div>
        </div>
        
        <div class="album-info">
          <h3 class="album-title font-bold text-lg truncate mb-1" title="${this.escapeHtml(album.title)}">${this.escapeHtml(album.title)}</h3>
          <p class="album-artist text-accent-primary text-sm mb-2">${this.escapeHtml(album.artist)}</p>
          
          <div class="album-meta flex flex-wrap gap-2 mb-4">
            <span class="badge badge-neutral text-xs">
              ${album.year || 'Unknown'}
            </span>
            <span class="badge badge-neutral text-xs">
              ${album.tracks?.length || 0} tracks
            </span>
            ${(() => {
        const hasRatings = album.acclaim?.hasRatings || album.tracks?.some(t => t.rating > 0)
        return hasRatings ?
          `<span class="badge badge-success text-xs flex items-center gap-1">${getIcon('Check', 'w-3 h-3')} Rated</span>` :
          `<span class="badge badge-warning text-xs flex items-center gap-1">${getIcon('AlertTriangle', 'w-3 h-3')} Pending</span>`
      })()}
          </div>
        </div>
        
        <div class="album-actions mt-auto">
          <button 
            class="btn btn-secondary btn-sm w-full justify-center group-hover:btn-primary transition-all"
            data-action="view-ranking"
            data-album-id="${album.id || ''}">
            View Ranked Tracks ${getIcon('ArrowLeft', 'w-4 h-4 rotate-180 ml-1')}
          </button>
        </div>
      </div>
    `).join('')
  }

  filterAlbums(albums) {
    let filtered = albums

    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase()
      filtered = filtered.filter(album =>
        album.title?.toLowerCase().includes(query) ||
        album.artist?.toLowerCase().includes(query)
      )
    }

    // Artist filter
    if (this.filters.artist !== 'all') {
      filtered = filtered.filter(album => album.artist === this.filters.artist)
    }

    // Year filter
    if (this.filters.year !== 'all') {
      filtered = filtered.filter(album => {
        const year = album.year
        if (!year) return false

        switch (this.filters.year) {
          case '1960s': return year >= 1960 && year < 1970
          case '1970s': return year >= 1970 && year < 1980
          case '1980s': return year >= 1980 && year < 1990
          case '1990s': return year >= 1990 && year < 2000
          case '2000s': return year >= 2000
          default: return true
        }
      })
    }

    // Status filter - defensive check for tracks existence
    if (this.filters.status !== 'all') {
      filtered = filtered.filter(album => {
        // Check multiple sources for ratings
        const hasRatings = album.acclaim?.hasRatings ||
          (Array.isArray(album.tracks) && album.tracks.length > 0 &&
            album.tracks.some(t => t.rating > 0))
        return this.filters.status === 'rated' ? hasRatings : !hasRatings
      })
    }

    // BestEver filter
    if (this.filters.bestEverOnly) {
      filtered = filtered.filter(album => album.bestEverAlbumId)
    }



    return filtered
  }

  getUniqueArtists(albums) {
    const artists = albums
      .map(album => album.artist)
      .filter(Boolean)
    return [...new Set(artists)].sort()
  }

  escapeHtml(text) {
    if (!text) return ''
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  renderLoadingProgress() {
    const { current, total } = this.loadProgress
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0

    return `
      <div class="loading-overlay fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div class="loading-content glass-panel p-8 max-w-md w-full text-center">
          <div class="loading-spinner w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p class="loading-text text-xl font-bold mb-2">Loading albums...</p>
          <div class="progress-bar-container bg-white/10 h-2 rounded-full overflow-hidden mb-2">
            <div class="progress-bar bg-accent-primary h-full transition-all duration-300" style="width: ${percentage}%"></div>
          </div>
          <p class="loading-status text-muted">${current} / ${total} (${percentage}%)</p>
        </div>
      </div>
    `
  }

  renderEmptyState() {
    return `
      <div class="empty-state text-center py-16 glass-panel">
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

    // Attach breadcrumb listeners
    Breadcrumb.attachListeners(this.container)

    // Subscribe to albums store
    const unsubscribe = albumsStore.subscribe((state) => {
      if (!this.isLoading) {
        this.updateAlbumsGrid(state.albums)
      }
    })
    this.subscriptions.push(unsubscribe)

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

    const statusFilter = this.$('#statusFilter')
    if (statusFilter) {
      this.on(statusFilter, 'change', (e) => {
        this.filters.status = e.target.value

        this.updateAlbumsGrid(albumsStore.getAlbums())
      })
    }

    // BestEver checkbox
    const bestEverCheckbox = this.$('#bestEverOnly')
    if (bestEverCheckbox) {
      this.on(bestEverCheckbox, 'change', (e) => {
        this.filters.bestEverOnly = e.target.checked

        this.updateAlbumsGrid(albumsStore.getAlbums())
      })
    }

    // Refresh Albums Button (Skip Cache)
    const refreshBtn = this.$('#refreshAlbums')
    if (refreshBtn) {
      this.on(refreshBtn, 'click', async () => {


        // Get series albums queries
        const activeSeries = seriesStore.getActiveSeries()
        if (activeSeries?.albumQueries) {
          // Reload with skip-cache flag
          await this.loadAlbumsFromQueries(activeSeries.albumQueries, true) // skipCache = true
        } else {

        }
      })
    }

    // View Mode Toggle
    const toggleViewBtn = this.$('#toggleViewMode')
    if (toggleViewBtn) {
      this.on(toggleViewBtn, 'click', async () => {
        // FIX #16: Toggle mode and re-render entire view
        this.viewMode = this.viewMode === 'compact' ? 'expanded' : 'compact'
        localStorage.setItem('albumsViewMode', this.viewMode)


        // Re-render entire view with new mode (keeps same instance)
        const html = await this.render({})
        this.container.innerHTML = html

        // Re-initialize event listeners (preserves this instance)
        // Get current series info
        const activeSeries = seriesStore.getActiveSeries()
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

        const statusFilter = this.$('#statusFilter')
        if (statusFilter) {
          this.on(statusFilter, 'change', (e) => {
            this.filters.status = e.target.value
            this.updateAlbumsGrid(albumsStore.getAlbums())
          })
        }

        const bestEverCheckbox = this.$('#bestEverOnly')
        if (bestEverCheckbox) {
          this.on(bestEverCheckbox, 'change', (e) => {
            this.filters.bestEverOnly = e.target.checked
            this.updateAlbumsGrid(albumsStore.getAlbums())
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
            const activeSeries = seriesStore.getActiveSeries()
            const albums = albumsStore.getAlbums()

            if (!activeSeries) {
              alert('⚠️ No active series. Please create or load a series first.')
              return
            }

            if (albums.length === 0) {
              alert('⚠️ No albums loaded. Please load albums before generating playlists.')
              return
            }

            router.navigate(`/playlists?seriesId=${activeSeries.id}`)
          })
        }
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

        router.navigate(`/ranking/${albumId}`)
        return
      }

      // Refresh Album
      const refreshBtn = e.target.closest('[title="Refresh Data"]')
      if (refreshBtn) {
        const card = refreshBtn.closest('.album-card')
        const albumId = card?.dataset.albumId
        if (albumId) {
          if (confirm('Refresh album data? This will re-fetch from the API.')) {
            // For now, we'll just reload the series to force a refresh, or we could implement a specific refresh method
            // A simple way is to remove and re-add, but that's risky.
            // Better: just alert for now as "Coming Soon" or implement a real refresh if API supports it.
            // Given the current API client, we don't have a single album refresh.
            // Let's just reload the page for now to be safe, or show a toast.
            alert('🔄 Refreshing data is not fully implemented in the backend yet. Please reload the series.')
          }
        }
        return
      }

      // Remove Album
      const trashBtn = e.target.closest('[title="Remove Album"]')
      if (trashBtn) {
        const card = trashBtn.closest('.album-card')
        const albumId = card?.dataset.albumId
        if (albumId) {
          if (confirm('Are you sure you want to remove this album from the library?')) {
            albumsStore.removeAlbum(albumId)
            // Also update the series query list if possible? 
            // For now, just removing from the view is good enough for the UI.
          }
        }
        return
      }
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

          })
        }
        return
      }

      // Edit Album
      const editBtn = e.target.closest('[data-action="edit-album"]')
      if (editBtn) {
        const albumId = editBtn.dataset.albumId
        const album = albumsStore.getAlbums().find(a => a.id === albumId)
        if (album) {
          const { showEditAlbumModal } = await import('../components/EditAlbumModal.js')
          showEditAlbumModal(album, async (id, updates) => {


            // Merge updates into album object
            const updatedAlbum = { ...album, ...updates }

            // Save to Firestore via Store
            // We need db instance. 
            const { db } = await import('../app.js')
            await albumsStore.saveToFirestore(db, updatedAlbum)

            // Store will notify and view will re-render
          })
        }
      }
    })

    // Generate Playlists
    const generateBtn = this.$('#generatePlaylistsBtn')
    if (generateBtn) {
      this.on(generateBtn, 'click', async () => {
        const activeSeries = seriesStore.getActiveSeries()
        const albums = albumsStore.getAlbums()

        // FIX: Add validation for edge cases
        if (!activeSeries) {
          alert('⚠️ No active series. Please create or load a series first.')
          return
        }

        if (albums.length === 0) {
          alert('⚠️ No albums loaded. Please load albums before generating playlists.')
          return
        }


        router.navigate(`/playlists?seriesId=${activeSeries.id}`)
      })
    }

    // Priority: URL param > Store state
    const urlParams = new URLSearchParams(window.location.search)
    const urlSeriesId = urlParams.get('seriesId') || (params && params.seriesId)

    if (urlSeriesId) {

      seriesStore.setActiveSeries(urlSeriesId)
    }

    const activeSeries = seriesStore.getActiveSeries()
    const currentAlbums = albumsStore.getAlbums()

    if (activeSeries && activeSeries.albumQueries && activeSeries.albumQueries.length > 0) {
      // FIX #15 ENHANCED + FIX #19: Check if albums are already loaded for THIS SPECIFIC series
      // Only reload if:
      // 1. Store is empty (currentCount === 0)
      // 2. Wrong number of albums (currentCount !== expectedCount)
      // 3. Albums are from a DIFFERENT series (check first album's metadata or series change)
      const expectedCount = activeSeries.albumQueries.length
      const currentCount = currentAlbums.length

      // Check if we need to reload
      // FIX: Use persistent store state instead of view instance state
      const lastLoadedId = albumsStore.getLastLoadedSeriesId()

      const needsReload = currentCount === 0 ||
        currentCount !== expectedCount ||
        !lastLoadedId ||
        lastLoadedId !== activeSeries.id

      if (needsReload) {

        await this.loadAlbumsFromQueries(activeSeries.albumQueries)
        // Remember which series we just loaded (IN STORE)
        albumsStore.setLastLoadedSeriesId(activeSeries.id)
        // Note: loadAlbumsFromQueries already updates the view, no need to call updateAlbumsGrid
      } else {

        // CRITICAL FIX: Do NOT call updateAlbumsGrid here!
        // The render() method already rendered these albums, calling updateAlbumsGrid
        // would duplicate them. The view is already up-to-date from render().
      }
    } else if (urlSeriesId && !activeSeries) {
      // Fallback: Series ID in URL but not in store (Hard Refresh scenario)

      try {
        // We need to access the db instance. It's exported from app.js
        const { db } = await import('../app.js')
        const { seriesStore } = await import('../stores/series.js')

        // Force load from Firestore
        await seriesStore.loadFromFirestore(db)

        // Try setting active series again
        seriesStore.setActiveSeries(urlSeriesId)
        const reloadedSeries = seriesStore.getActiveSeries()

        if (reloadedSeries && reloadedSeries.albumQueries) {

          await this.loadAlbumsFromQueries(reloadedSeries.albumQueries)
        } else {
          console.warn('[AlbumsView] Series not found even after Firestore fetch')
          this.renderEmptyState()
        }
      } catch (err) {
        console.error('[AlbumsView] Failed to recover series:', err)
        this.renderEmptyState()
      }
    } else {
      console.warn('[AlbumsView] No active series or albums found to load')
      this.renderEmptyState()
    }

  }

  async loadAlbumsFromQueries(queries, skipCache = false) {
    // FIX #15: Cancel previous requests FIRST, before clearing store
    // This prevents race condition where old requests complete after reset
    if (this.abortController) {

      this.abortController.abort()
      this.abortController = null
    }

    // Create new abort controller for this operation
    this.abortController = new AbortController()

    // NOW reset store (no pending requests can add albums after this)
    albumsStore.reset()

    // Force immediate UI clear
    const grid = this.$('#albumsGrid')
    if (grid) grid.innerHTML = ''
    const list = this.$('#albumsList')
    if (list) list.innerHTML = ''



    this.isLoading = true
    this.updateAlbumsGrid([]) // Clear grid immediately to show loading state



    this.loadProgress = { current: 0, total: queries.length }

    // Initial render with progress
    const container = this.$('#albumsGrid') || this.$('#albumsList')
    if (container) {
      container.parentElement.insertBefore(
        this.createElementFromHTML(this.renderLoadingProgress()),
        container
      )
    }

    try {
      const { results, errors } = await apiClient.fetchMultipleAlbums(
        queries,
        (current, total, result) => {
          // Ignore updates if aborted
          if (this.abortController.signal.aborted) return

          this.loadProgress = { current, total }
          this.updateLoadingProgress()

          // Add successful albums incrementally
          if (result.status === 'success' && result.album) {
            albumsStore.addAlbum(result.album)
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
      alert('⚠️ Error loading albums. Please try again.')
    } finally {
      this.isLoading = false

      // Remove loading overlay
      const overlay = this.$('.loading-overlay')
      if (overlay) {
        overlay.remove()
      }

      // Final update
      this.updateAlbumsGrid(albumsStore.getAlbums())
    }
  }

  updateLoadingProgress() {
    const overlay = this.$('.loading-overlay')
    if (overlay) {
      overlay.outerHTML = this.renderLoadingProgress()
    }
  }

  updateAlbumsGrid(albums) {
    // FIX: Ghost Albums - Validate series context before rendering
    // Store subscriptions can trigger this method with stale data from previous series
    const activeSeries = seriesStore.getActiveSeries()
    const lastLoadedId = albumsStore.getLastLoadedSeriesId()

    // Early exit if we're trying to render albums from wrong series
    if (activeSeries && lastLoadedId && activeSeries.id !== lastLoadedId) {
      console.warn('[AlbumsView] updateAlbumsGrid: Series mismatch, skipping render')
      return
    }

    const filtered = this.filterAlbums(albums)


    // Update Generate Playlists button state
    const generateBtn = this.$('#generatePlaylistsBtn')
    if (generateBtn) {
      if (filtered.length === 0) {
        generateBtn.setAttribute('disabled', 'true')
      } else {
        generateBtn.removeAttribute('disabled')
      }
    }

    // Update the correct container based on viewMode
    if (this.viewMode === 'expanded') {
      const list = this.$('#albumsList')
      if (list) {
        list.innerHTML = this.renderExpandedList(filtered)
      }
    } else {
      const grid = this.$('#albumsGrid')
      if (grid) {
        grid.innerHTML = this.renderAlbumsGrid(filtered)
      }
    }

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

  escapeHtml(text) {
    if (!text) return ''
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}
