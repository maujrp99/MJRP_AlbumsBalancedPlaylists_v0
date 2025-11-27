import { BaseView } from './BaseView.js'
import { albumsStore } from '../stores/albums.js'
import { seriesStore } from '../stores/series.js'
import { apiClient } from '../api/client.js'
import { router } from '../router.js'

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
      <div class="albums-view">
        <header class="view-header">
          <div class="header-content">
            <h1>📚 Albums Library</h1>
            ${activeSeries ? `
              <div class="active-series-badge">
                <span class="badge-label">Series:</span>
                <span class="badge-value">${this.escapeHtml(activeSeries.name)}</span>
              </div>
            ` : ''}
          </div>
          
          <div class="header-actions">
            <input 
              type="search" 
              id="albumSearch" 
              placeholder="Search albums..."
              class="search-input"
              value="${this.searchQuery}"
            />
            <button class="btn btn-secondary" id="backToHomeBtn">
              ← Back to Home
            </button>
          </div>
        </header>

        ${this.isLoading ? this.renderLoadingProgress() : ''}

        <div class="albums-grid" id="albumsGrid">
          ${this.renderAlbumsGrid(albums)}
        </div>

        ${albums.length === 0 && !this.isLoading ? this.renderEmptyState() : ''}
      </div>
    `
    }

    renderAlbumsGrid(albums) {
        const filtered = this.filterAlbums(albums)

        if (filtered.length === 0 && this.searchQuery) {
            return '<p class="no-results">No albums match your search.</p>'
        }

        return filtered.map(album => `
      <div class="album-card" data-album-id="${album.id || ''}">
        <div class="album-cover">
          <div class="cover-placeholder">🎵</div>
        </div>
        
        <div class="album-info">
          <h3 class="album-title">${this.escapeHtml(album.title)}</h3>
          <p class="album-artist">${this.escapeHtml(album.artist)}</p>
          ${album.year ? `<p class="album-year">${album.year}</p>` : ''}
          
          <div class="album-meta">
            <span class="badge">
              ${album.tracks?.length || 0} tracks
            </span>
            ${album.acclaim?.hasRatings ?
                '<span class="badge badge-success">✓ Rated</span>' :
                '<span class="badge badge-warning">⚠ No ratings</span>'
            }
            ${album._cached ?
                '<span class="badge badge-info">💾 Cached</span>' : ''}
          </div>
        </div>
        
        <div class="album-actions">
          <button 
            class="btn btn-primary btn-sm"
            data-action="view-ranking"
            data-album-id="${album.id || ''}">
            View Ranking →
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
      <div class="loading-overlay">
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <p class="loading-text">Loading albums...</p>
          <div class="progress-bar-container">
            <div class="progress-bar" style="width: ${percentage}%"></div>
          </div>
          <p class="loading-status">${current} / ${total} (${percentage}%)</p>
        </div>
      </div>
    `
    }

    renderEmptyState() {
        return `
      <div class="empty-state">
        <p class="empty-icon">📝</p>
        <p class="empty-text">No albums in library</p>
        <p class="empty-hint">Create a series from the home page to get started</p>
        <button class="btn btn-primary" id="goHomeBtn">
          Go to Home
        </button>
      </div>
    `
    }

    async mount(params) {
        this.container = document.getElementById('app')

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

        // Back to home button
        const backBtn = this.$('#backToHomeBtn')
        if (backBtn) {
            this.on(backBtn, 'click', () => router.navigate('/home'))
        }

        const goHomeBtn = this.$('#goHomeBtn')
        if (goHomeBtn) {
            this.on(goHomeBtn, 'click', () => router.navigate('/home'))
        }

        // View ranking buttons (event delegation)
        this.on(this.container, 'click', (e) => {
            if (e.target.dataset.action === 'view-ranking') {
                const albumId = e.target.dataset.albumId
                router.navigate(`/ranking/${albumId}`)
            }
        })

        // Load albums if we have an active series
        const activeSeries = seriesStore.getActiveSeries()
        if (activeSeries && activeSeries.albumQueries && activeSeries.albumQueries.length > 0) {
            await this.loadAlbumsFromQueries(activeSeries.albumQueries)
        }
    }

    async loadAlbumsFromQueries(queries) {
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
