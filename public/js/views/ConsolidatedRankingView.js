import { BaseView } from './BaseView.js'
import { albumsStore } from '../stores/albums.js'
import { albumSeriesStore } from '../stores/albumSeries.js'
import { getIcon } from '../components/Icons.js'
import { SafeDOM } from '../utils/SafeDOM.js'
import { Breadcrumb } from '../components/Breadcrumb.js'

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
    this.container = document.getElementById('app') // Ensure container is set

    // Subscribe to stores
    this.subscribe(albumsStore, () => this.update())
    this.subscribe(albumSeriesStore, () => this.update())

    // Initial render is handled by router calling render(), but mount is after.
    // If we need to update after mount (e.g. data arrival), update() works.
  }

  // Subscribe helper (BaseView usually has one or we use on/store.subscribe)
  subscribe(store, callback) {
    if (store && typeof store.subscribe === 'function') {
      const unsub = store.subscribe(callback)
      this.subscriptions.push(unsub)
    }
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

  update() {
    if (this.container) {
      SafeDOM.replaceChildren(this.container, this.renderContent())
    }
  }

  render(params) {
    return this.renderContent()
  }

  renderContent() {
    const series = albumSeriesStore.getById(this.activeAlbumSeriesId)
    const albums = albumsStore.getAlbums()
    const tracks = this.getFilteredTracks()

    return SafeDOM.div({ className: 'view-container container' }, [
      this.renderHeader(series),
      this.renderControls(albums, tracks),
      this.renderTable(tracks)
    ])
  }

  renderHeader(series) {
    const header = SafeDOM.create('header', { className: 'view-header mb-8 fade-in' })
    const content = SafeDOM.div({ className: 'header-content' })

    const breadcrumb = SafeDOM.div({ className: 'breadcrumb flex items-center gap-2 text-sm text-muted mb-4' })
    breadcrumb.appendChild(SafeDOM.fromHTML(Breadcrumb.render(`/ranking/${this.activeAlbumSeriesId}`, { id: this.activeAlbumSeriesId })))
    content.appendChild(breadcrumb)

    const titleRow = SafeDOM.div({ className: 'header-title-row flex flex-col md:flex-row justify-between items-start md:items-center gap-4' })

    const h1 = SafeDOM.h1({ className: 'flex items-center gap-3' })
    h1.appendChild(SafeDOM.fromHTML(getIcon('BarChart', 'w-8 h-8')))
    h1.appendChild(SafeDOM.text(series ? series.name : 'Series Ranking'))
    titleRow.appendChild(h1)

    const actions = SafeDOM.div({ className: 'header-actions' })
    const link = SafeDOM.a({ href: '/playlists', className: 'btn btn-primary', dataset: { link: '' } })
    link.appendChild(SafeDOM.fromHTML(getIcon('Music', 'w-5 h-5')))
    link.appendChild(SafeDOM.text(' Create your Balanced Playlists'))
    actions.appendChild(link)
    titleRow.appendChild(actions)

    content.appendChild(titleRow)
    header.appendChild(content)
    return header
  }

  renderControls(albums, tracks) {
    const container = SafeDOM.div({
      className: 'ranking-controls glass-panel mb-6 flex flex-col md:flex-row justify-between items-center gap-6 fade-in',
      style: { animationDelay: '0.1s' }
    })

    // Filter Group
    const filterGroup = SafeDOM.div({ className: 'filter-group flex items-center gap-3 w-full md:w-auto' })
    filterGroup.appendChild(SafeDOM.label({ htmlFor: 'albumFilter', className: 'font-semibold whitespace-nowrap' }, 'Filter by Album:'))

    const selectWrapper = SafeDOM.div({ className: 'relative w-full md:w-64' })
    const select = SafeDOM.select({
      id: 'albumFilter',
      className: 'form-control appearance-none cursor-pointer pr-10',
      onChange: (e) => {
        this.filterAlbumId = e.target.value
        this.update()
      }
    })
    select.appendChild(SafeDOM.option({ value: 'all', selected: this.filterAlbumId === 'all' }, 'All Albums'))
    albums.forEach(album => {
      select.appendChild(SafeDOM.option({ value: album.id, selected: this.filterAlbumId === album.id }, album.title))
    })
    selectWrapper.appendChild(select)
    selectWrapper.appendChild(SafeDOM.div({ className: 'absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted' }, [SafeDOM.fromHTML(getIcon('ChevronDown', 'w-4 h-4'))]))

    filterGroup.appendChild(selectWrapper)
    container.appendChild(filterGroup)

    // Stats Group
    const statsGroup = SafeDOM.div({ className: 'stats-group flex gap-8 text-sm' })

    const totalStat = SafeDOM.div({ className: 'stat-item flex flex-col items-center' })
    totalStat.appendChild(SafeDOM.span({ className: 'stat-label text-muted uppercase text-xs tracking-wider' }, 'Total Tracks'))
    totalStat.appendChild(SafeDOM.span({ className: 'stat-value font-bold text-xl' }, String(tracks.length)))
    statsGroup.appendChild(totalStat)

    const avgStat = SafeDOM.div({ className: 'stat-item flex flex-col items-center' })
    avgStat.appendChild(SafeDOM.span({ className: 'stat-label text-muted uppercase text-xs tracking-wider' }, 'Avg Rating'))
    avgStat.appendChild(SafeDOM.span({ className: 'stat-value font-bold text-xl text-accent-primary' }, this.calculateAvgRating(tracks)))
    statsGroup.appendChild(avgStat)

    container.appendChild(statsGroup)
    return container
  }

  renderTable(tracks) {
    const columns = [
      { id: 'rank', label: 'Rank' },
      { id: 'title', label: 'Track' },
      { id: 'rating', label: 'Rating' },
      { id: 'score', label: 'Score' },
      { id: 'duration', label: 'Duration' },
      { id: 'albumTitle', label: 'Album' }
    ]

    const container = SafeDOM.div({
      className: 'ranking-table-container glass-panel overflow-hidden fade-in',
      style: { animationDelay: '0.2s' }
    })

    const wrapper = SafeDOM.div({ className: 'overflow-x-auto' })
    const table = SafeDOM.table({ className: 'ranking-table w-full text-left border-collapse' })

    // Header
    const thead = SafeDOM.thead({ className: 'bg-white/5 border-b border-white/10 text-sm uppercase text-muted font-semibold' })
    const headerRow = SafeDOM.tr({})
    columns.forEach(col => {
      headerRow.appendChild(SafeDOM.th({
        className: `p-4 cursor-pointer hover:text-white transition-colors ${this.getSortClass(col.id)}`,
        dataset: { sort: col.id },
        onClick: () => this.handleSort(col.id)
      }, col.label))
    })
    headerRow.appendChild(SafeDOM.th({ className: 'p-4' }, 'Source'))
    thead.appendChild(headerRow)
    table.appendChild(thead)

    // Body
    const tbody = SafeDOM.tbody({ className: 'divide-y divide-white/5' })
    tracks.forEach(track => {
      tbody.appendChild(this.renderTrackRow(track))
    })
    table.appendChild(tbody)

    wrapper.appendChild(table)
    container.appendChild(wrapper)
    return container
  }

  handleSort(field) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'
    } else {
      this.sortField = field
      this.sortDirection = 'desc'
    }
    this.update()
  }

  renderTrackRow(track) {
    const ratingClass = this.getRatingClass(track.rating)
    const duration = this.formatDuration(track.duration)

    const row = SafeDOM.tr({ className: 'track-row hover:bg-white/5 transition-colors group' })

    row.appendChild(SafeDOM.td({ className: 'rank-cell p-4 font-bold' }, [this.renderRankBadge(track.rank)]))

    const titleCell = SafeDOM.td({ className: 'title-cell p-4' })
    titleCell.appendChild(SafeDOM.div({ className: 'track-title font-medium text-white group-hover:text-accent-primary transition-colors' }, track.title))
    row.appendChild(titleCell)

    const ratingCell = SafeDOM.td({ className: 'rating-cell p-4' })
    if (track.rating) {
      const badge = SafeDOM.span({ className: `badge ${ratingClass} flex items-center gap-1 w-fit` })
      badge.appendChild(SafeDOM.fromHTML(getIcon('Star', 'w-3 h-3 fill-current')))
      badge.appendChild(SafeDOM.text(' ' + track.rating))
      ratingCell.appendChild(badge)
    } else {
      ratingCell.appendChild(SafeDOM.span({ className: 'text-muted' }, '-'))
    }
    row.appendChild(ratingCell)

    row.appendChild(SafeDOM.td({ className: 'score-cell p-4 text-muted font-mono' }, track.score || '-'))
    row.appendChild(SafeDOM.td({ className: 'duration-cell p-4 text-muted font-mono text-sm' }, duration))
    row.appendChild(SafeDOM.td({ className: 'album-cell p-4 text-sm text-muted' }, track.albumTitle))

    const sourceCell = SafeDOM.td({ className: 'source-cell p-4' })
    if (track.url) {
      const link = SafeDOM.a({
        href: track.url,
        target: '_blank',
        className: 'btn-icon inline-flex items-center justify-center w-8 h-8 hover:bg-white/10 rounded-full transition-colors',
        title: 'View on BestEverAlbums'
      })
      link.appendChild(SafeDOM.fromHTML(getIcon('Share', 'w-4 h-4')))
      sourceCell.appendChild(link)
    } else {
      sourceCell.appendChild(SafeDOM.text('-'))
    }
    row.appendChild(sourceCell)

    return row
  }

  renderRankBadge(rank) {
    if (!rank) return SafeDOM.span({ className: 'text-muted' }, '-')

    let badgeClass = 'bg-white/10 text-muted'

    if (rank === 1) badgeClass = 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
    else if (rank === 2) badgeClass = 'bg-slate-400/20 text-slate-300 border border-slate-400/30'
    else if (rank === 3) badgeClass = 'bg-orange-700/20 text-orange-400 border border-orange-700/30'

    if (rank <= 3) {
      return SafeDOM.div({
        className: `flex items-center justify-center w-8 h-8 rounded-full ${badgeClass} font-bold shadow-lg shadow-black/20`
      }, rank)
    }

    return SafeDOM.span({ className: 'text-muted pl-2' }, `#${rank}`)
  }

  calculateAvgRating(tracks) {
    const ratedTracks = tracks.filter(t => t.rating)
    if (ratedTracks.length === 0) return '-'
    const sum = ratedTracks.reduce((acc, t) => acc + t.rating, 0)
    return (sum / ratedTracks.length).toFixed(1)
  }

  getRatingClass(rating) {
    if (!rating) return ''
    if (rating >= 90) return 'badge-success'
    if (rating >= 80) return 'badge-info'
    if (rating >= 70) return 'badge-warning'
    return 'badge-danger'
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
}
