import { BaseView } from './BaseView.js'
import { albumsStore } from '../stores/albums.js'
import { router } from '../router.js'

/**
 * RankingView
 * Display album track rankings with acclaim visualization
 */

export class RankingView extends BaseView {
    constructor() {
        super()
        this.activeTab = 'summary'
    }

    async render(params) {
        const { albumId } = params
        const album = this.findAlbum(albumId)

        if (!album) {
            return this.renderNotFound()
        }

        return `
      <div class="ranking-view">
        <header class="album-header">
          <button class="btn btn-secondary btn-sm" id="backBtn">
            ← Back to Albums
          </button>
          
          <div class="album-header-info">
            <h1>${this.escapeHtml(album.title)}</h1>
            <p class="artist-name">${this.escapeHtml(album.artist)}</p>
            ${album.year ? `<p class="album-year">${album.year}</p>` : ''}
          </div>

          <button class="btn btn-primary" id="createPlaylistsBtn">
            Create Playlists →
          </button>
        </header>

        <div class="ranking-tabs">
          <button class="tab-btn ${this.activeTab === 'summary' ? 'active' : ''}" data-tab="summary">
            Summary
          </button>
          <button class="tab-btn ${this.activeTab === 'tracks' ? 'active' : ''}" data-tab="tracks">
            Track Rankings
          </button>
          <button class="tab-btn ${this.activeTab === 'sources' ? 'active' : ''}" data-tab="sources">
            Sources
          </button>
        </div>

        <div class="tab-content">
          <div class="tab-pane ${this.activeTab === 'summary' ? 'active' : ''}" id="summary-tab">
            ${this.renderSummary(album)}
          </div>
          
          <div class="tab-pane ${this.activeTab === 'tracks' ? 'active' : ''}" id="tracks-tab">
            ${this.renderTrackRankings(album)}
          </div>
          
          <div class="tab-pane ${this.activeTab === 'sources' ? 'active' : ''}" id="sources-tab">
            ${this.renderSources(album)}
          </div>
        </div>
      </div>
    `
    }

    renderSummary(album) {
        const hasRatings = album.acclaim?.hasRatings
        const trackCount = album.tracks?.length || 0
        const ratedTracks = album.tracks?.filter(t => t.rating && t.rating > 0).length || 0
        const avgRating = this.calculateAverageRating(album.tracks)

        return `
      <div class="summary-grid">
        <div class="summary-card">
          <h3>Track Count</h3>
          <p class="summary-value">${trackCount}</p>
        </div>
        
        <div class="summary-card">
          <h3>Rated Tracks</h3>
          <p class="summary-value ${hasRatings ? 'success' : 'warning'}">
            ${ratedTracks} / ${trackCount}
          </p>
        </div>
        
        <div class="summary-card">
          <h3>Average Rating</h3>
          <p class="summary-value ${avgRating ? 'success' : 'neutral'}">
            ${avgRating || 'N/A'}
          </p>
        </div>
        
        <div class="summary-card">
          <h3>Acclaim Source</h3>
          <p class="summary-value">${album.acclaim?.source || 'Unknown'}</p>
        </div>
      </div>

      ${!hasRatings ? `
        <div class="alert alert-warning">
       <strong>⚠️ No acclaim ratings found</strong>
          <p>This album doesn't have BestEverAlbums ratings. Playlists will be generated using basic track ordering.</p>
        </div>
      ` : `
        <div class="alert alert-success">
          <strong>✓ Acclaim data available</strong>
          <p>This album has ${ratedTracks} rated tracks from ${album.acclaim.source}. Playlist curation will use these rankings.</p>
        </div>
      `}
    `
    }

    renderTrackRankings(album) {
        const tracks = album.tracks || []

        if (tracks.length === 0) {
            return '<p class="empty-text">No tracks available</p>'
        }

        return `
      <div class="ranking-table-container">
        <table class="ranking-table">
          <thead>
            <tr>
              <th class="rank-col">Rank</th>
              <th class="track-col">Track</th>
              <th class="rating-col">Rating</th>
              <th class="score-col">Score</th>
              <th class="duration-col">Duration</th>
            </tr>
          </thead>
          <tbody>
            ${tracks.map((track, index) => `
              <tr class="track-row ${track.rating ? 'rated' : 'unrated'}">
                <td class="rank-cell">
                  <span class="rank-badge">${track.rank || index + 1}</span>
                </td>
                <td class="track-cell">
                  <strong>${this.escapeHtml(track.title || track.name)}</strong>
                </td>
                <td class="rating-cell">
                  ${track.rating ?
                `<span class="rating-badge rating-${this.getRatingClass(track.rating)}">${track.rating}</span>` :
                '<span class="rating-badge rating-none">-</span>'
            }
                </td>
                <td class="score-cell">
                  ${track.normalizedScore ? track.normalizedScore.toFixed(2) : '-'}
                </td>
                <td class="duration-cell">
                  ${track.duration ? this.formatDuration(track.duration) : '-'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `
    }

    renderSources(album) {
        const source = album.acclaim?.source || 'Unknown'

        return `
      <div class="sources-info">
        <h3>Acclaim Data Source</h3>
        <p class="source-description">Primary source: <strong>${source}</strong></p>
        
        ${source === 'BestEverAlbums' ? `
          <div class="source-badge source-verified">
            <div class="badge-icon">✓</div>
            <div class="badge-content">
              <h4>Verified Source</h4>
              <p>Data scraped from BestEverAlbums.com with deterministic rankings.</p>
              <p>This is the most reliable source for track acclaim data.</p>
            </div>
          </div>
        ` : source === 'AI' ? `
          <div class="source-badge source-ai">
            <div class="badge-icon">🤖</div>
            <div class="badge-content">
              <h4>AI-Generated Rankings</h4>
              <p>Rankings generated by Gemini AI based on critical consensus.</p>
              <p><strong>Note:</strong> May vary slightly on regeneration.</p>
            </div>
          </div>
        ` : `
          <div class="source-badge source-unknown">
            <div class="badge-icon">⚠️</div>
            <div class="badge-content">
              <h4>Unknown Source</h4>
              <p>No acclaim data available for this album.</p>
              <p>Playlists will use default track ordering.</p>
            </div>
          </div>
        `}

        ${album._cached ? `
          <div class="cache-info">
            <p>💾 This data was loaded from cache.</p>
            <p class="cache-hint">Fetched: ${this.formatTimestamp(album.metadata?.fetchedAt)}</p>
          </div>
        ` : ''}
      </div>
    `
    }

    renderNotFound() {
        return `
      <div class="not-found">
        <h2>❌ Album Not Found</h2>
        <p>The requested album doesn't exist in your library.</p>
        <button class="btn btn-primary" id="goHomeBtn">
          Go to Home
        </button>
      </div>
    `
    }

    async mount(params) {
        this.container = document.getElementById('app')

        // Back button
        const backBtn = this.$('#backBtn')
        if (backBtn) {
            this.on(backBtn, 'click', () => router.navigate('/albums'))
        }

        // Create playlists button
        const createBtn = this.$('#createPlaylistsBtn')
        if (createBtn) {
            this.on(createBtn, 'click', () => {
                // TODO: Implement in Sprint 4
                alert('🎵 Playlists view coming in Sprint 4!')
            })
        }

        // Tab switching
        const tabBtns = this.$$('.tab-btn')
        tabBtns.forEach(btn => {
            this.on(btn, 'click', (e) => {
                this.switchTab(e.target.dataset.tab)
            })
        })

        // Go home if not found
        const goHomeBtn = this.$('#goHomeBtn')
        if (goHomeBtn) {
            this.on(goHomeBtn, 'click', () => router.navigate('/home'))
        }
    }

    switchTab(tabName) {
        this.activeTab = tabName

        // Remove active from all tabs
        this.$$('.tab-btn').forEach(btn => btn.classList.remove('active'))
        this.$$('.tab-pane').forEach(pane => pane.classList.remove('active'))

        // Add active to selected tab
        const tabBtn = this.$(`[data-tab="${tabName}"]`)
        const tabPane = this.$(`#${tabName}-tab`)

        if (tabBtn) tabBtn.classList.add('active')
        if (tabPane) tabPane.classList.add('active')
    }

    findAlbum(albumId) {
        const albums = albumsStore.getAlbums()

        // Try exact ID match first
        const byId = albums.find(a => a.id === albumId)
        if (byId) return byId

        // Fallback to first album if no match (for debugging)
        return albums[0] || null
    }

    getRatingClass(rating) {
        if (rating >= 90) return 'excellent'
        if (rating >= 80) return 'great'
        if (rating >= 70) return 'good'
        return 'fair'
    }

    formatDuration(seconds) {
        if (!seconds) return '-'
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    calculateAverageRating(tracks) {
        if (!tracks || tracks.length === 0) return null

        const ratedTracks = tracks.filter(t => t.rating && t.rating > 0)
        if (ratedTracks.length === 0) return null

        const sum = ratedTracks.reduce((acc, t) => acc + t.rating, 0)
        return Math.round(sum / ratedTracks.length)
    }

    escapeHtml(text) {
        if (!text) return ''
        const div = document.createElement('div')
        div.textContent = text
        return div.innerHTML
    }
}
