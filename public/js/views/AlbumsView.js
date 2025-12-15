import { BaseView } from './BaseView.js'
import { albumsStore } from '../stores/albums.js'
import { albumSeriesStore } from '../stores/albumSeries.js'
import { apiClient } from '../api/client.js'
import { router } from '../router.js'
import { Breadcrumb } from '../components/Breadcrumb.js'
import { albumLoader } from '../services/AlbumLoader.js'
import { optimizedAlbumLoader } from '../services/OptimizedAlbumLoader.js'
import { getIcon } from '../components/Icons.js'
import toast from '../components/Toast.js'
import { showViewAlbumModal } from '../components/ViewAlbumModal.js'

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

    // Sprint 7.5: Scope State
    this.currentScope = 'SINGLE' // 'SINGLE' | 'ALL'
    this.targetSeriesId = null
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

    // Custom cleanup
    if (this.cleanup) {
      this.cleanup()
      this.cleanup = null
    }
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

    // DEBUG: Enhanced logging for troubleshooting

    // Updated render method logic
    const contentHtml = this.viewMode === 'expanded'
      ? this.renderScopedList(filteredAlbums, allSeries)
      : this.renderScopedGrid(filteredAlbums, allSeries)

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

          <!-- Status Filter -->
          <div class="filter-dropdown relative">
            <select id="statusFilter" class="form-control appearance-none cursor-pointer pr-8">
              <option value="all">All Status</option>
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
  </div>
  `
  }

  // MODE 3: Expanded List View
  renderExpandedList(albums) {
    if (albums.length === 0 && (this.searchQuery || Object.values(this.filters).some(v => v !== 'all' && v !== false))) {
      return `
  <div class="text-center py-12 text-muted" >
          <p class="text-xl mb-2">No albums match your filters</p>
          <p class="text-sm">Try adjusting your search or filters</p>
        </div>
  `
    }

    return albums.map((album, idx) => {
      const coverUrl = albumLoader.getArtworkUrl(album, 150)

      return `
  <div class="expanded-album-card glass-panel p-6 mb-6 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-500" style="animation-delay: ${idx * 50}ms" data-album-id="${album.id || ''}" >
    <div class="flex flex-col md:flex-row gap-6 items-start">

      <!-- Album Cover & Actions Column -->
      <div class="flex flex-col gap-4 shrink-0">
        <div class="relative group">
          <div class="w-32 h-32 md:w-40 md:h-40 rounded-xl overflow-hidden shadow-lg bg-gray-800 border border-white/10">
            <img
              src="${coverUrl}"
              alt="${this.escapeHtml(album.title)}"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        </div>

        <!-- Action Buttons (Refined) -->
        <div class="flex flex-wrap gap-2 justify-center md:justify-start">
          <button class="tech-btn tech-btn-secondary text-xs px-4 py-2 flex items-center gap-2 hover:bg-white/20"
            data-action="add-to-inventory"
            data-album-id="${album.id || ''}">
            ${getIcon('Plus', 'w-3 h-3')} Inventory
          </button>

          <button class="tech-btn tech-btn-danger text-xs px-4 py-2 flex items-center gap-2"
            data-action="remove-album"
            data-album-id="${album.id || ''}">
            ${getIcon('Trash', 'w-3 h-3')} Remove
          </button>
        </div>
      </div>

      <!-- Content Column -->
      <div class="flex-1 w-full min-w-0">
        <h3 class="text-2xl font-bold mb-1 flex items-center gap-2">
          ${getIcon('Music', 'w-6 h-6 text-accent-primary')}
          ${this.escapeHtml(album.title)}
        </h3>
        <p class="text-accent-primary text-lg mb-3">${this.escapeHtml(album.artist)}</p>

        <!-- Badges -->
        <div class="flex flex-wrap gap-2 text-sm mb-4">
          ${album.year ? `<span class="badge badge-neutral">${album.year}</span>` : ''}
          <span class="badge badge-neutral">${album.tracks?.length || 0} tracks</span>
          ${(() => {
          const hasRatings = album.acclaim?.hasRatings || album.tracks?.some(t => t.rating > 0)
          return hasRatings ?
            '' :
            `<span class="badge badge-warning flex items-center gap-1">${getIcon('AlertTriangle', 'w-3 h-3')} Pending</span>`
        })()}
          ${album.bestEverAlbumId ? `
                <a href="https://www.besteveralbums.com/thechart.php?a=${album.bestEverAlbumId}" target="_blank" rel="noopener noreferrer" class="badge badge-primary hover:badge-accent transition-colors flex items-center gap-1">
                  ${getIcon('ExternalLink', 'w-3 h-3')} BestEver
                </a>
              ` : ''}
        </div>

        <!-- Dual Tracklists -->
        <div class="dual-tracklists-compact grid md:grid-cols-2 gap-6">
          ${this.renderOriginalTracklist(album)}
          ${this.renderRankedTracklist(album)}
        </div>
      </div>
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
  <div class="tracklist-section" >
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
  <div class="tracklist-section" >
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
  // MODE 1: Compact Grid View
  renderAlbumsGrid(albums) {
    // albums is already filtered from render(), don't filter again

    if (albums.length === 0 && (this.searchQuery || Object.values(this.filters).some(v => v !== 'all' && v !== false))) {
      return `
  <div class="col-span-full text-center py-12 text-muted" >
          <p class="text-xl mb-2">No albums match your filters</p>
          <p class="text-sm">Try adjusting your search or filters</p>
        </div>
  `
    }

    return albums.map(album => {
      // Use 300px for grid view to ensure high quality on retina/large screens
      const coverUrl = albumLoader.getArtworkUrl(album, 300)

      return `
  <div class="album-card-compact flex flex-col gap-3 h-full relative" data-album-id="${album.id || ''}" >
        <!--Image Container(Square top) - Click triggers View Modal-->
        <div 
            class="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-800 border border-white/5 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
            data-action="view-modal"
            data-album-id="${album.id || ''}"
        >
           ${coverUrl ?
          `<img src="${coverUrl}" alt="${this.escapeHtml(album.title)}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />` :
          `<div class="flex items-center justify-center w-full h-full text-white/20">${getIcon('Music', 'w-24 h-24')}</div>`
        }
           
           <!-- Hover Overlay Icon to indicate clickable -->
           <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
              <span class="bg-black/50 p-3 rounded-full backdrop-blur text-white">
                  ${getIcon('Maximize2', 'w-6 h-6')}
              </span>
           </div>
        </div>
        
        <!--Metadata Container(Below Image)-->
  <div class="flex flex-col gap-1 px-1">
    <div class="flex justify-between items-start gap-2">
        <div class="min-w-0 flex-1">
            <h3 class="font-bold text-white text-base truncate leading-tight" title="${this.escapeHtml(album.title)}">
              ${this.escapeHtml(album.title)}
            </h3>
            <p class="text-gray-400 text-sm truncate hover:text-white transition-colors">
              ${this.escapeHtml(album.artist)}
            </p>
        </div>
        
        <!-- Sprint 7.5: Action Buttons (Right Aligned) -->
        <div class="flex items-center gap-1 shrink-0">
             <button class="p-1.5 text-gray-400 hover:text-green-400 hover:bg-white/10 rounded-lg transition-colors" 
                title="Add to Inventory" 
                data-action="add-to-inventory" 
                data-album-id="${album.id || ''}">
               ${getIcon('Plus', 'w-4 h-4')}
             </button>
             <button class="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors" 
                title="Remove" 
                data-action="remove-album" 
                data-album-id="${album.id || ''}">
               ${getIcon('Trash', 'w-4 h-4')}
             </button>
        </div>
    </div>

    <!-- Badges & View Button Row -->
    <div class="flex items-center justify-between mt-2 gap-2">
        <div class="flex flex-wrap gap-2">
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5">
            ${album.year || 'N/A'}
          </span>
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5">
            ${album.tracks?.length || 0}
          </span>
          ${(() => {
          const hasRatings = album.acclaim?.hasRatings || album.tracks?.some(t => t.rating > 0)
          return hasRatings ? '' : `<span class="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 flex items-center gap-1">${getIcon('AlertTriangle', 'w-3 h-3')}</span>`
        })()}
        </div>

        <!-- View Tracks Button (Renamed from View Ranked) -->
        <button
          class="text-xs px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-accent-primary hover:bg-white/10 hover:border-accent-primary/50 transition-all flex items-center gap-1 whitespace-nowrap"
          data-action="view-modal"
          data-album-id="${album.id || ''}">
          View Tracks
        </button>
    </div>
  </div>
      </div>
  `
    }).join('')
  }

  filterAlbums(albums) {
    let filtered = albums

    // FIX: Expansion Dataset Safety
    // Do not show expanded discography items in the main browsing view (too many items)
    // Only show them when searching or filtering by specific criteria
    const isBrowsingAll = !this.searchQuery &&
      this.filters.artist === 'all' &&
      this.filters.year === 'all' &&
      this.filters.status === 'all' &&
      !this.filters.bestEverOnly

    if (isBrowsingAll) {
      filtered = filtered.filter(album => album.addedBy !== 'expansion')
    }

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
        return !hasRatings // Only support filtering for Pending, as Rated is removed from UI
      })
    }

    // BestEver filter
    if (this.filters.bestEverOnly) {
      filtered = filtered.filter(album => album.bestEverAlbumId)
    }

    // DEBUG: Log filtering steps
    // Filter logic end

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
  <div class="loading-overlay fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50" >
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

  // Sprint 7.5: Render Grouped Grid for "All Series"
  renderScopedGrid(albums, seriesList) {
    // Helper to wrap grid items
    const wrapGrid = (content) => `
       <div class="albums-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
         ${content}
       </div>`

    if (this.currentScope === 'SINGLE') {
      return wrapGrid(this.renderAlbumsGrid(albums))
    }

    // "All Series" Grouping
    let html = '<div class="all-series-container space-y-12">'

    // 1. Group albums by Series
    // We reverse lookup which series owns the album
    const seriesGroups = new Map()

    // Initialize groups for all series to ensure order
    seriesList.forEach(series => {
      seriesGroups.set(series.id, {
        series: series,
        albums: []
      })
    })

    // "Other" bucket for albums not found in any series (defensive)
    const otherAlbums = []

    albums.forEach(album => {
      let found = false
      // Check which series queries match this album
      for (const series of seriesList) {
        const queries = series.albumQueries || []
        // Simple check: is this album title/artist present in queries?
        // Note: Exact match logic might vary, but for now we trust the "reverse matching" or just metadata
        // Better approach: When loading ALL, we could tag them. For now, let's try fuzzy match context
        // Actually, simplest is: Check if any query contains the album title
        // Bidirectional check for better matching (Query contains Album OR Album contains Query)
        // This handles cases where Query is "Artist - Album" (Long) vs "Album" (Short)
        // AND cases where Album is "Album (Deluxe)" (Long) vs "Album" (Short)
        const match = queries.some(q => {
          const qNorm = q.toLowerCase()
          const aNorm = album.title.toLowerCase()
          return qNorm.includes(aNorm) || aNorm.includes(qNorm)
        })

        if (match) {
          const group = seriesGroups.get(series.id)
          if (group) group.albums.push(album)
          found = true
          break // Assign to first matching series
        }
      }
      if (!found) otherAlbums.push(album)
    })

    // 2. Render Groups
    seriesGroups.forEach(group => {
      if (group.albums.length === 0) return // Skip empty series groups in view

      html += `
            <div class="series-group rounded-xl border border-white/5 p-6 mb-8 bg-white/5">
                <div class="series-group-header flex items-center gap-4 mb-6 pb-2 border-b border-white/10">
                    <h2 class="text-2xl font-bold text-accent-primary">${this.escapeHtml(group.series.name)}</h2>
                    <span class="text-sm text-white/50 bg-white/5 px-2 py-1 rounded-full border border-white/5">
                        ${group.albums.length} albums
                    </span>
                </div>
                ${wrapGrid(this.renderAlbumsGrid(group.albums))}
            </div>
        `
    })

    // Render Orphans if any
    if (otherAlbums.length > 0) {
      html += `
            <div class="series-group mt-12">
                 <div class="series-group-header flex items-center gap-4 mb-6 pb-2 border-b border-white/10">
                    <h2 class="text-2xl font-bold text-gray-400">Uncategorized</h2>
                    <span class="text-sm text-white/50 bg-white/5 px-2 py-1 rounded-full">
                        ${otherAlbums.length} albums
                    </span>
                </div>
                ${wrapGrid(this.renderAlbumsGrid(otherAlbums))}
            </div>
        `
    }

    html += '</div>'
    return html
  }

  // Sprint 7.5: Render Grouped List for "All Series" (Expanded Mode)
  renderScopedList(albums, seriesList) {
    if (this.currentScope === 'SINGLE') {
      return this.renderExpandedList(albums)
    }

    let html = '<div class="all-series-container space-y-12">'
    const seriesGroups = new Map()
    seriesList.forEach(series => seriesGroups.set(series.id, { series, albums: [] }))
    const otherAlbums = []

    albums.forEach(album => {
      let found = false
      for (const series of seriesList) {
        if ((series.albumQueries || []).some(q => {
          const qNorm = q.toLowerCase()
          const aNorm = album.title.toLowerCase()
          return qNorm.includes(aNorm) || aNorm.includes(qNorm)
        })) {
          const group = seriesGroups.get(series.id)
          if (group) group.albums.push(album)
          found = true
          break
        }
      }
      if (!found) otherAlbums.push(album)
    })

    seriesGroups.forEach(group => {
      if (group.albums.length === 0) return
      html += `
            <div class="series-group rounded-xl border border-white/5 p-6 mb-8 bg-white/5">
                <div class="series-group-header flex items-center gap-4 mb-6 pb-2 border-b border-white/10">
                    <h2 class="text-2xl font-bold text-accent-primary">${this.escapeHtml(group.series.name)}</h2>
                    <span class="text-sm text-white/50 bg-white/5 px-2 py-1 rounded-full border border-white/5">
                        ${group.albums.length} albums
                    </span>
                </div>
                ${this.renderExpandedList(group.albums)}
            </div>
        `
    })

    if (otherAlbums.length > 0) {
      html += `
            <div class="series-group mt-12">
                 <div class="series-group-header flex items-center gap-4 mb-6 pb-2 border-b border-white/10">
                    <h2 class="text-2xl font-bold text-gray-400">Uncategorized</h2>
                    <span class="text-sm text-white/50 bg-white/5 px-2 py-1 rounded-full">
                        ${otherAlbums.length} albums
                    </span>
                </div>
                ${this.renderExpandedList(otherAlbums)}
            </div>
        `
    }

    html += '</div>'
    return html
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
          try {
            // Import inventory store dynamically if needed or just use event
            // Assuming inventoryStore is global or we need to import it? 
            // Inventory interactions usually happen via InventoryView...
            // But here we are in AlbumsView. 
            // Let's use toast for now or check if we have inventoryStore imported?
            // We don't import inventoryStore in AlbumsView imports list above.
            // Let's dynamic import
            const { inventoryStore } = await import('../stores/inventory.js')
            await inventoryStore.addAlbum(album)
            toast.success(`Added "${album.title}" to inventory`)
          } catch (err) {
            console.error(err)
            toast.error('Failed to add to inventory')
          }
          break
        case 'remove-album':
          if (confirm(`Remove "${album.title}" from this series?`)) {
            await albumSeriesStore.removeAlbumFromSeries(album)
            // View will update automatically via subscription
            toast.success('Album removed from series')
          }
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
        return
      }



      // Remove Album
      const removeBtn = e.target.closest('[data-action="remove-album"]')
      if (removeBtn) {
        const albumId = removeBtn.dataset.albumId

        // Find the album card to get title and artist from DOM
        const albumCard = removeBtn.closest('.album-card')
        let album = albumsStore.getAlbums().find(a => a.id === albumId)

        // Fallback: if album not in store, create minimal object from DOM
        if (!album && albumCard) {
          const titleEl = albumCard.querySelector('.album-title')
          const artistEl = albumCard.querySelector('.album-artist')
          if (titleEl && artistEl) {
            album = {
              id: albumId,
              title: titleEl.textContent.trim(),
              artist: artistEl.textContent.trim()
            }
          }
        }

        if (album) {
          // Import confirmation modal
          const { showDeleteAlbumModal } = await import('../components/Modals.js')

          showDeleteAlbumModal(
            albumId,
            `${album.title} - ${album.artist} `,
            async (id) => {
              try {
                // Check if series still exists
                const activeSeries = albumSeriesStore.getActiveSeries()
                if (!activeSeries) {
                  const { toast } = await import('../components/Toast.js')
                  toast.error('Series no longer exists. Redirecting...')
                  setTimeout(() => router.navigate('/album-series'), 1500)
                  return
                }

                // 1. Remove from series in Firestore (updates albumQueries[])
                await albumSeriesStore.removeAlbumFromSeries(album)

                // 2. Remove from local memory store (if present)
                albumsStore.removeAlbum(id)

                // 3. Remove the card from DOM
                if (albumCard) {
                  albumCard.remove()
                }

                const { toast } = await import('../components/Toast.js')
                toast.success('Album removed from series')
              } catch (error) {
                console.error('[AlbumsView] Failed to remove album:', error)
                throw error // Re-throw for modal to handle
              }
            }
          )
        } else {
          console.error('[AlbumsView] Could not find album info for ID:', albumId)
          const { toast } = await import('../components/Toast.js')
          toast.error('Could not find album information')
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
        router.navigate(`/playlists?seriesId=${activeSeries.id}`)
      })
    }

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
          await albumSeriesStore.loadFromFirestore()
          series = albumSeriesStore.getSeries().find(s => s.id === seriesId)
        }

        if (series) {
          albumSeriesStore.setActiveSeries(series.id)
          queriesToLoad = series.albumQueries || []
        } else {
          // Series not found
          console.warn('[AlbumsView] Series not found:', seriesId)
          queriesToLoad = []
        }
      }

      // 3. Load Data
      this.updateHeaderState() // Sync Dropdown
      if (queriesToLoad.length > 0) {
        await this.loadAlbumsFromQueries(queriesToLoad, skipCache)
      } else {
        this.isLoading = false
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
    // FIX: The container ID is 'albumsContainer', not 'albumsGrid' or 'albumsList'!
    const container = this.$('#albumsContainer')
    console.log('[AlbumsView] Container element found:', !!container, 'viewMode:', this.viewMode)

    if (!container) {
      console.error('[AlbumsView] CRITICAL: #albumsContainer not found in DOM!')
      return
    }

    // Render based on viewMode
    const allSeries = albumSeriesStore.getSeries()
    if (this.viewMode === 'expanded') {
      const html = this.renderScopedList(filtered, allSeries)
      console.log('[AlbumsView] renderScopedList returned HTML length:', html?.length)
      container.innerHTML = html
    } else {
      const html = this.renderScopedGrid(filtered, allSeries)
      console.log('[AlbumsView] renderScopedGrid returned HTML length:', html?.length)
      container.innerHTML = html
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
