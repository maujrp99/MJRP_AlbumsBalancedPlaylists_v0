import { BaseView } from './BaseView.js'
import { albumsStore } from '../stores/albums.js'
import { router } from '../router.js'
import { Breadcrumb } from '../components/Breadcrumb.js'
import { getIcon } from '../components/Icons.js'
import { escapeHtml } from '../utils/stringUtils.js'

/**
 * RankingView (MODE 2)
 * Single Album Detail with dual tracklists:
 * - Ranked by Acclaim (sorted by rating)
 * - Original Album Order (AS IS)
 */

export class RankingView extends BaseView {
  constructor() {
    super()
  }

  async render(params) {
    const { albumId } = params
    const album = this.findAlbum(albumId)

    if (!album) {
      return this.renderNotFound()
    }

    const avgRating = this.calculateAverageRating(album.tracks)
    const trackCount = album.tracks?.length || 0

    return `
      <div class="ranking-view container">
        <header class="view-header mb-8 fade-in">
          ${Breadcrumb.render(`/ranking/${albumId}`, params)}
          
          <!-- Back Button -->
          <button id="backToAlbums" class="btn btn-secondary mb-4 inline-flex items-center gap-2">
            ${getIcon('ArrowLeft', 'w-4 h-4')}
            Back to Albums
          </button>

          <!-- Album Header Card -->
          <div class="glass-panel p-6 mb-6">
            <div class="flex items-start gap-6">
              <!-- Album Cover Placeholder -->
              <div class="album-cover-large w-32 h-32 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
                ${album.coverUrl ?
        `<img src="${album.coverUrl}" alt="${escapeHtml(album.title)}" class="w-full h-full object-cover rounded-xl" />` :
        `<div class="text-4xl opacity-20">${getIcon('Music', 'w-16 h-16')}</div>`
      }
              </div>

              <!-- Album Info -->
              <div class="flex-1">
                <h1 class="text-3xl font-bold mb-2">${getIcon('Music', 'w-8 h-8 inline mr-2')}${escapeHtml(album.title)}</h1>
                <p class="text-accent-primary text-xl mb-3">${escapeHtml(album.artist)}</p>
                <div class="flex flex-wrap gap-3 text-sm">
                  ${album.year ? `<span class="badge badge-neutral">${album.year}</span>` : ''}
                  <span class="badge badge-neutral">${trackCount} tracks</span>
                  ${avgRating ? `<span class="badge badge-success">Avg Rating: ${avgRating}</span>` : ''}
                </div>
              </div>
            </div>
          </div>
        </header>

        <!-- Dual Tracklists -->
        <div class="dual-tracklists grid gap-8">
          ${this.renderRankedTracklist(album)}
          ${this.renderOriginalTracklist(album)}
        </div>

        <footer class="view-footer mt-12 text-center text-muted text-sm border-t border-white/5 pt-6">
          <p class="last-update">Last updated: ${new Date().toLocaleTimeString()}</p>
        </footer>
      </div>
    `
  }

  renderRankedTracklist(album) {
    const tracks = album.tracks || []
    if (tracks.length === 0) {
      return '<p class="text-muted">No tracks available</p>'
    }

    // Sort by rating (descending)
    const rankedTracks = [...tracks].sort((a, b) => (b.rating || 0) - (a.rating || 0))

    return `
      <div class="tracklist-section glass-panel p-6 fade-in">
        <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
          ${getIcon('TrendingUp', 'w-6 h-6 text-accent-primary')}
          Ranked by Acclaim
        </h3>
        <div class="tracks-list space-y-2">
          ${rankedTracks.map((track, idx) => this.renderTrackRow(track, idx + 1, true)).join('')}
        </div>
      </div>
    `
  }

  renderOriginalTracklist(album) {
    // FIX: Use tracksOriginalOrder if available
    const tracks = album.tracksOriginalOrder || album.tracks || []

    if (tracks.length === 0) {
      return '<p class="text-muted">No tracks available</p>'
    }

    return `
      <div class="tracklist-section glass-panel p-6 fade-in" style="animation-delay: 0.1s">
        <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
          ${getIcon('List', 'w-6 h-6 text-accent-secondary')}
          Original Album Order
        </h3>
        <div class="tracks-list space-y-2">
          ${tracks.map((track, idx) => {
      // Use track position if available, otherwise index
      const position = track.position || (idx + 1)
      return this.renderTrackRow(track, position, false)
    }).join('')}
        </div>
      </div>
    `
  }

  renderTrackRow(track, position, showRating) {
    const rating = track.rating || 0
    const ratingClass = this.getRatingClass(rating)
    const duration = track.duration ? this.formatDuration(track.duration) : '-'

    // Medal icons for top 3 in ranked list
    const medal = showRating && position <= 3 ?
      (position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉') : ''

    return `
      <div class="track-row flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors">
        <!-- Position -->
        <div class="track-position w-8 text-center font-bold text-muted">
          ${medal || position}
        </div>

        <!-- Track Title -->
        <div class="track-title flex-1 font-medium">
          ${escapeHtml(track.title || track.name)}
        </div>

        <!-- Rating (only in ranked list) -->
        ${showRating && rating > 0 ? `
          <div class="track-rating">
            <span class="badge ${ratingClass === 'excellent' ? 'badge-success' :
          ratingClass === 'great' ? 'badge-primary' :
            ratingClass === 'good' ? 'badge-warning' : 'badge-neutral'}">
              ⭐ ${rating}
            </span>
          </div>
        ` : showRating ? `
          <div class="track-rating">
            <span class="badge badge-neutral opacity-50">-</span>
          </div>
        ` : ''}

        <!-- Duration -->
        <div class="track-duration text-muted text-sm w-16 text-right">
          ${duration}
        </div>
      </div>
    `
  }

  renderNotFound() {
    return `
      <div class="not-found container text-center py-16">
        <div class="glass-panel p-12 max-w-md mx-auto">
          <div class="text-6xl mb-6 opacity-30">${getIcon('AlertTriangle', 'w-24 h-24 mx-auto')}</div>
          <h2 class="text-2xl font-bold mb-2">Album Not Found</h2>
          <p class="text-muted mb-8">The requested album doesn't exist in your library.</p>
          <button class="btn btn-primary" id="goHomeBtn">
            ${getIcon('ArrowLeft', 'w-4 h-4 mr-2')} Go to Home
          </button>
        </div>
      </div>
    `
  }

  async mount(params) {
    this.container = document.getElementById('app')

    // Attach breadcrumb listeners
    Breadcrumb.attachListeners(this.container)

    // Back button
    const backBtn = this.$('#backToAlbums')
    if (backBtn) {
      this.on(backBtn, 'click', () => {
        // Remember to go back to the view mode the user was in
        router.navigate('/albums')
      })
    }

    // Go home if not found
    const goHomeBtn = this.$('#goHomeBtn')
    if (goHomeBtn) {
      this.on(goHomeBtn, 'click', () => router.navigate('/home'))
    }
  }

  findAlbum(albumId) {
    const albums = albumsStore.getAlbums()

    console.log('[RankingView] Looking for album:', albumId)
    console.log('[RankingView] Available albums:', albums.map(a => a.id))

    // FIX #20: Only return album if ID matches exactly
    // DO NOT fallback to first album - that causes wrong album to display
    const album = albums.find(a => a.id === albumId)

    if (!album) {
      console.warn('[RankingView] Album not found:', albumId)
    }

    return album || null
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

}
