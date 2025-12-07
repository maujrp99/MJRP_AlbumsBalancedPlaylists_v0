import { BaseView } from './BaseView.js'
import { albumsStore } from '../stores/albums.js'
import { albumSeriesStore } from '../stores/albumSeries.js'
import { getIcon } from '../components/Icons.js'

export class ConsolidatedRankingView extends BaseView {
  constructor() {
    super()
    this.activeAlbumSeriesId = null
    this.filterAlbumId = 'all'
    this.sortField = 'rank' // rank, rating, score, duration
    this.sortDirection = 'asc'
  }

  async mount(params) {
    this.activeAlbumSeriesId = params.id

    // Subscribe to stores
    this.subscribe(albumsStore, () => this.render())
    this.subscribe(albumSeriesStore, () => this.render())

    // Ensure series is loaded
    if (!albumSeriesStore.getById(this.activeAlbumSeriesId)) {
      // If series not found in store (e.g. direct link), try to load or redirect
      // For now, redirect to home if not found
      // window.location.href = '/home'
    }

    this.render()
  }

  getFilteredTracks() {
    const albums = albumsStore.getAlbums()
    let allTracks = []

    // Flatten tracks from all albums
    albums.forEach(album => {
      if (album.tracks) {
        album.tracks.forEach(track => {
          allTracks.push({
            ...track,
            albumTitle: album.title,
            albumId: album.id,
            albumCover: album.cover
          })
        })
      }
    })

    // Filter by album if selected
    if (this.filterAlbumId !== 'all') {
      allTracks = allTracks.filter(t => t.albumId === this.filterAlbumId)
    }

    // Sort
    return allTracks.sort((a, b) => {
      let valA = a[this.sortField]
      let valB = b[this.sortField]

      // Handle nulls/undefined
      if (valA === undefined || valA === null) valA = -Infinity
      if (valB === undefined || valB === null) valB = -Infinity

      // Numeric sort for rank, rating, score, duration
      if (typeof valA === 'number' && typeof valB === 'number') {
        return this.sortDirection === 'asc' ? valA - valB : valB - valA
      }

      // String sort for others
      return this.sortDirection === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA))
    })
  }

  render() {
    const series = albumSeriesStore.getById(this.activeAlbumSeriesId)
    const albums = albumsStore.getAlbums()
    const tracks = this.getFilteredTracks()

    const template = `
      <div class="view-container container">
        <!-- Header -->
        <header class="view-header mb-8 fade-in">
          <div class="header-content">
            <div class="breadcrumb flex items-center gap-2 text-sm text-muted mb-4">
              <a href="/home" data-link class="hover:text-white transition-colors">Home</a>
              <span class="separator opacity-50">›</span>
              <a href="/albums?seriesId=${this.activeAlbumSeriesId}" data-link class="hover:text-white transition-colors">Albums</a>
              <span class="separator opacity-50">›</span>
              <span class="current text-accent-primary">Consolidated Ranking</span>
            </div>
            <div class="header-title-row flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h1 class="flex items-center gap-3">
                ${getIcon('BarChart', 'w-8 h-8')}
                ${series ? series.name : 'Series Ranking'}
              </h1>
              <div class="header-actions">
                <a href="/playlists" class="btn btn-primary" data-link>
                  ${getIcon('Music', 'w-5 h-5')}
                  Create your Balanced Playlists
                </a>
              </div>
            </div>
          </div>
        </header>

        <!-- Filters & Stats -->
        <div class="ranking-controls glass-panel mb-6 flex flex-col md:flex-row justify-between items-center gap-6 fade-in" style="animation-delay: 0.1s">
          <div class="filter-group flex items-center gap-3 w-full md:w-auto">
            <label for="albumFilter" class="font-semibold whitespace-nowrap">Filter by Album:</label>
            <div class="relative w-full md:w-64">
                <select id="albumFilter" class="form-control appearance-none cursor-pointer pr-10">
                  <option value="all" ${this.filterAlbumId === 'all' ? 'selected' : ''}>All Albums</option>
                  ${albums.map(album => `
                    <option value="${album.id}" ${this.filterAlbumId === album.id ? 'selected' : ''}>
                      ${album.title}
                    </option>
                  `).join('')}
                </select>
                <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
                    ${getIcon('ChevronDown', 'w-4 h-4')}
                </div>
            </div>
          </div>
          
          <div class="stats-group flex gap-8 text-sm">
            <div class="stat-item flex flex-col items-center">
              <span class="stat-label text-muted uppercase text-xs tracking-wider">Total Tracks</span>
              <span class="stat-value font-bold text-xl">${tracks.length}</span>
            </div>
            <div class="stat-item flex flex-col items-center">
              <span class="stat-label text-muted uppercase text-xs tracking-wider">Avg Rating</span>
              <span class="stat-value font-bold text-xl text-accent-primary">${this.calculateAvgRating(tracks)}</span>
            </div>
          </div>
        </div>

        <!-- Ranking Table -->
        <div class="ranking-table-container glass-panel overflow-hidden fade-in" style="animation-delay: 0.2s">
          <div class="overflow-x-auto">
            <table class="ranking-table w-full text-left border-collapse">
              <thead class="bg-white/5 border-b border-white/10 text-sm uppercase text-muted font-semibold">
                <tr>
                  <th data-sort="rank" class="p-4 cursor-pointer hover:text-white transition-colors ${this.getSortClass('rank')}">Rank</th>
                  <th data-sort="title" class="p-4 cursor-pointer hover:text-white transition-colors ${this.getSortClass('title')}">Track</th>
                  <th data-sort="rating" class="p-4 cursor-pointer hover:text-white transition-colors ${this.getSortClass('rating')}">Rating</th>
                  <th data-sort="score" class="p-4 cursor-pointer hover:text-white transition-colors ${this.getSortClass('score')}">Score</th>
                  <th data-sort="duration" class="p-4 cursor-pointer hover:text-white transition-colors ${this.getSortClass('duration')}">Duration</th>
                  <th data-sort="albumTitle" class="p-4 cursor-pointer hover:text-white transition-colors ${this.getSortClass('albumTitle')}">Album</th>
                  <th class="p-4">Source</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                ${tracks.map(track => this.renderTrackRow(track)).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `

    this.$el.innerHTML = template
    this.attachEventListeners()
  }

  renderTrackRow(track) {
    const ratingClass = this.getRatingClass(track.rating)
    const duration = this.formatDuration(track.duration)
    const sourceLink = track.url ? `<a href="${track.url}" target="_blank" class="btn-icon inline-flex items-center justify-center w-8 h-8 hover:bg-white/10 rounded-full transition-colors" title="View on BestEverAlbums">${getIcon('Share', 'w-4 h-4')}</a>` : '-'

    return `
      <tr class="track-row hover:bg-white/5 transition-colors group">
        <td class="rank-cell p-4 font-bold">
          ${this.renderRankBadge(track.rank)}
        </td>
        <td class="title-cell p-4">
          <div class="track-title font-medium text-white group-hover:text-accent-primary transition-colors">${track.title}</div>
        </td>
        <td class="rating-cell p-4">
          ${track.rating ? `
            <span class="badge ${ratingClass} flex items-center gap-1 w-fit">
                ${getIcon('Star', 'w-3 h-3 fill-current')} ${track.rating}
            </span>` : '<span class="text-muted">-</span>'}
        </td>
        <td class="score-cell p-4 text-muted font-mono">${track.score || '-'}</td>
        <td class="duration-cell p-4 text-muted font-mono text-sm">${duration}</td>
        <td class="album-cell p-4 text-sm text-muted">${track.albumTitle}</td>
        <td class="source-cell p-4">${sourceLink}</td>
      </tr>
    `
  }

  renderRankBadge(rank) {
    if (!rank) return '<span class="text-muted">-</span>'

    let badgeClass = 'bg-white/10 text-muted'
    let icon = ''

    if (rank === 1) {
      badgeClass = 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
      icon = '🥇'
    } else if (rank === 2) {
      badgeClass = 'bg-slate-400/20 text-slate-300 border border-slate-400/30'
      icon = '🥈'
    } else if (rank === 3) {
      badgeClass = 'bg-orange-700/20 text-orange-400 border border-orange-700/30'
      icon = '🥉'
    }

    if (rank <= 3) {
      return `
                <div class="flex items-center justify-center w-8 h-8 rounded-full ${badgeClass} font-bold shadow-lg shadow-black/20">
                    ${rank}
                </div>
            `
    }

    return `<span class="text-muted pl-2">#${rank}</span>`
  }

  calculateAvgRating(tracks) {
    const ratedTracks = tracks.filter(t => t.rating)
    if (ratedTracks.length === 0) return '-'
    const sum = ratedTracks.reduce((acc, t) => acc + t.rating, 0)
    return (sum / ratedTracks.length).toFixed(1)
  }

  getRatingClass(rating) {
    if (!rating) return ''
    if (rating >= 90) return 'badge-success' // Green
    if (rating >= 80) return 'badge-info'    // Blue
    if (rating >= 70) return 'badge-warning' // Yellow/Orange
    return 'badge-danger'                    // Red
  }

  formatDuration(seconds) {
    if (!seconds) return '-'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  getSortClass(field) {
    if (this.sortField !== field) return 'opacity-50 hover:opacity-100'
    return `text-accent-primary opacity-100`
  }

  attachEventListeners() {
    // Filter change
    const filterSelect = this.$('#albumFilter')
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        this.filterAlbumId = e.target.value
        this.render()
      })
    }

    // Sort headers
    this.$$('th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const field = th.dataset.sort
        if (this.sortField === field) {
          this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'
        } else {
          this.sortField = field
          this.sortDirection = 'desc' // Default to desc for new field (usually better for rankings)
        }
        this.render()
      })
    })
  }
}
