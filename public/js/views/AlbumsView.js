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
  }

  async render(params) {
    const albums = albumsStore.getAlbums()
    const activeSeries = seriesStore.getActiveSeries()

    return `
      <div class="albums-view container">
        <header class="view-header mb-8 fade-in">
          ${Breadcrumb.render('/albums')}
          
          <div class="header-content flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div class="header-title-row">
              <h1 class="flex items-center gap-3">
                ${activeSeries ? this.escapeHtml(activeSeries.name) : `${getIcon('Music', 'w-8 h-8')} Albums Library`}
              </h1>
              ${activeSeries ? `
                <div class="active-series-badge mt-2">
                  <span class="badge badge-neutral flex items-center gap-1">
                    ${getIcon('Info', 'w-3 h-3')} Series: ${this.escapeHtml(activeSeries.name)}
                  </span>
                </div>
              ` : ''}
            </div>

            <div class="header-actions flex gap-3">
              ${activeSeries ? `
                <a href="/series/${activeSeries.id}/ranking" class="btn btn-primary" data-link>
                  ${getIcon('BarChart', 'w-5 h-5')}
                  View Consolidated Ranking
                </a>
              ` : ''}
            </div>
          </div>
          
          <div class="search-bar relative max-w-md w-full">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              ${getIcon('Search', 'w-5 h-5')}
            </span>
            <input 
              type="search" 
              id="albumSearch" 
              placeholder="Search albums..."
              class="form-control pl-10"
              value="${this.searchQuery}"
            />
          </div>
        </header>

        ${this.isLoading ? this.renderLoadingProgress() : ''}

        <div class="albums-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" id="albumsGrid">
          ${this.renderAlbumsGrid(albums)}
        </div>

        ${albums.length === 0 && !this.isLoading ? this.renderEmptyState() : ''}
        
        <footer class="view-footer mt-12 text-center text-muted text-sm border-t border-white/5 pt-6">
          <p class="last-update">Last updated: ${new Date().toLocaleTimeString()}</p>
        </footer>
      </div>
    `
  }

  renderAlbumsGrid(albums) {
    const filtered = this.filterAlbums(albums)

    if (filtered.length === 0 && this.searchQuery) {
      return `
        <div class="col-span-full text-center py-12 text-muted">
          <p class="text-xl mb-2">No albums match your search</p>
          <p class="text-sm">Try adjusting your filters</p>
        </div>
      `
    }

    return filtered.map(album => `
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
            View Ranking ${getIcon('ArrowLeft', 'w-4 h-4 rotate-180 ml-1')}
          </button>
        </div>
      </div>
    `).join('')
  }

  filterAlbums(albums) {
    if (!this.searchQuery) return albums

    const query = this.searchQuery.toLowerCase()
    return albums.filter(album =>
      album.title?.toLowerCase().includes(query) ||
      album.artist?.toLowerCase().includes(query)
    )
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

    const goHomeBtn = this.$('#goHomeBtn')
    if (goHomeBtn) {
      this.on(goHomeBtn, 'click', () => router.navigate('/home'))
    }

    // View ranking buttons (event delegation)
    this.on(this.container, 'click', async (e) => {
      // View Ranking
      if (e.target.dataset.action === 'view-ranking' || e.target.closest('[data-action="view-ranking"]')) {
        const btn = e.target.dataset.action === 'view-ranking' ? e.target : e.target.closest('[data-action="view-ranking"]')
        const albumId = btn.dataset.albumId
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

    // Priority: URL param > Store state
    const urlParams = new URLSearchParams(window.location.search)
    const urlSeriesId = urlParams.get('seriesId') || (params && params.seriesId)

    if (urlSeriesId) {
      console.log('[AlbumsView] Restoring series from URL:', urlSeriesId)
      seriesStore.setActiveSeries(urlSeriesId)
    }

    const activeSeries = seriesStore.getActiveSeries()

    if (activeSeries && activeSeries.albumQueries && activeSeries.albumQueries.length > 0) {
      console.log('[AlbumsView] Loading albums for series:', activeSeries.name)
      await this.loadAlbumsFromQueries(activeSeries.albumQueries)
    } else {
      console.warn('[AlbumsView] No active series or albums found to load')
    }
  }

  async loadAlbumsFromQueries(queries) {
    // Reset store to clear previous series' albums
    albumsStore.reset()

    this.isLoading = true
    this.loadProgress = { current: 0, total: queries.length }

    // Initial render with progress
    const grid = this.$('#albumsGrid')
    if (grid) {
      grid.parentElement.insertBefore(
        this.createElementFromHTML(this.renderLoadingProgress()),
        grid
      )
    }

    try {
      const { results, errors } = await apiClient.fetchMultipleAlbums(
        queries,
        (current, total, result) => {
          this.loadProgress = { current, total }
          this.updateLoadingProgress()

          // Add successful albums incrementally
          if (result.status === 'success' && result.album) {
            albumsStore.addAlbum(result.album)
          }
        }
      )

      if (errors.length > 0) {
        console.warn(`${errors.length} albums failed to load:`, errors)
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
    const grid = this.$('#albumsGrid')
    if (grid) {
      grid.innerHTML = this.renderAlbumsGrid(albums)
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
