import { BaseView } from './BaseView.js'
import { albumsStore } from '../stores/albums.js'
import { albumSeriesStore } from '../stores/albumSeries.js'
import { getIcon } from '../components/Icons.js'
import { escapeHtml } from '../utils/stringUtils.js'
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

    // Subscribe to stores
    this.subscribe(albumsStore, () => this.render())
    this.subscribe(albumSeriesStore, () => this.render())

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

    const content = SafeDOM.div({ className: 'view-container container' }, [
      this.renderHeader(series),
      this.renderControls(albums, tracks),
      this.renderTable(tracks)
    ])

    SafeDOM.replaceChildren(this.$el, content)
  }

  renderHeader(series) {
    return SafeDOM.create('header', { className: 'view-header mb-8 fade-in' }, [
      SafeDOM.div({ className: 'header-content' }, [
        SafeDOM.div({ className: 'breadcrumb flex items-center gap-2 text-sm text-muted mb-4' },
          SafeDOM.fromHTML(Breadcrumb.render(`/ranking/${this.activeAlbumSeriesId}`, { id: this.activeAlbumSeriesId }))
        ),
        SafeDOM.div({ className: 'header-title-row flex flex-col md:flex-row justify-between items-start md:items-center gap-4' }, [
          SafeDOM.h1({ className: 'flex items-center gap-3' }, [
            SafeDOM.fromHTML(getIcon('BarChart', 'w-8 h-8')),
            SafeDOM.text(series ? series.name : 'Series Ranking')
          ]),
          SafeDOM.div({ className: 'header-actions' },
            SafeDOM.a({ href: '/playlists', className: 'btn btn-primary', dataset: { link: '' } }, [
              SafeDOM.fromHTML(getIcon('Music', 'w-5 h-5')),
              SafeDOM.text('Create your Balanced Playlists')
            ])
          )
        ])
      ])
    ])
  }

  renderControls(albums, tracks) {
    return SafeDOM.div({
      className: 'ranking-controls glass-panel mb-6 flex flex-col md:flex-row justify-between items-center gap-6 fade-in',
      style: { animationDelay: '0.1s' }
    }, [
      // Filter Group
      SafeDOM.div({ className: 'filter-group flex items-center gap-3 w-full md:w-auto' }, [
        SafeDOM.label({ htmlFor: 'albumFilter', className: 'font-semibold whitespace-nowrap' }, 'Filter by Album:'),
        SafeDOM.div({ className: 'relative w-full md:w-64' }, [
          SafeDOM.select({
            id: 'albumFilter',
            className: 'form-control appearance-none cursor-pointer pr-10',
            onChange: (e) => {
              this.filterAlbumId = e.target.value
              this.render()
            }
          }, [
            SafeDOM.option({ value: 'all', selected: this.filterAlbumId === 'all' }, 'All Albums'),
            ...albums.map(album => SafeDOM.option({
              value: album.id,
              selected: this.filterAlbumId === album.id
            }, album.title))
          ]),
          SafeDOM.div({ className: 'absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted' },
            SafeDOM.fromHTML(getIcon('ChevronDown', 'w-4 h-4'))
          )
        ])
      ]),

      // Stats Group
      SafeDOM.div({ className: 'stats-group flex gap-8 text-sm' }, [
        SafeDOM.div({ className: 'stat-item flex flex-col items-center' }, [
          SafeDOM.span({ className: 'stat-label text-muted uppercase text-xs tracking-wider' }, 'Total Tracks'),
          SafeDOM.span({ className: 'stat-value font-bold text-xl' }, tracks.length)
        ]),
        SafeDOM.div({ className: 'stat-item flex flex-col items-center' }, [
          SafeDOM.span({ className: 'stat-label text-muted uppercase text-xs tracking-wider' }, 'Avg Rating'),
          SafeDOM.span({ className: 'stat-value font-bold text-xl text-accent-primary' }, this.calculateAvgRating(tracks))
        ])
      ])
    ])
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

    return SafeDOM.div({
      className: 'ranking-table-container glass-panel overflow-hidden fade-in',
      style: { animationDelay: '0.2s' }
    }, [
      SafeDOM.div({ className: 'overflow-x-auto' }, [
        SafeDOM.table({ className: 'ranking-table w-full text-left border-collapse' }, [
          SafeDOM.thead({ className: 'bg-white/5 border-b border-white/10 text-sm uppercase text-muted font-semibold' }, [
            SafeDOM.tr({}, [
              ...columns.map(col => SafeDOM.th({
                className: `p-4 cursor-pointer hover:text-white transition-colors ${this.getSortClass(col.id)}`,
                dataset: { sort: col.id },
                onClick: () => this.handleSort(col.id)
              }, col.label)),
              SafeDOM.th({ className: 'p-4' }, 'Source')
            ])
          ]),
          SafeDOM.tbody({ className: 'divide-y divide-white/5' },
            tracks.map(track => this.renderTrackRow(track))
          )
        ])
      ])
    ])
  }

  handleSort(field) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'
    } else {
      this.sortField = field
      this.sortDirection = 'desc'
    }
    this.render()
  }

  renderTrackRow(track) {
    const ratingClass = this.getRatingClass(track.rating)
    const duration = this.formatDuration(track.duration)

    return SafeDOM.tr({ className: 'track-row hover:bg-white/5 transition-colors group' }, [
      SafeDOM.td({ className: 'rank-cell p-4 font-bold' }, this.renderRankBadge(track.rank)),
      SafeDOM.td({ className: 'title-cell p-4' },
        SafeDOM.div({ className: 'track-title font-medium text-white group-hover:text-accent-primary transition-colors' }, track.title)
      ),
      SafeDOM.td({ className: 'rating-cell p-4' },
        track.rating ? SafeDOM.span({ className: `badge ${ratingClass} flex items-center gap-1 w-fit` }, [
          SafeDOM.fromHTML(getIcon('Star', 'w-3 h-3 fill-current')),
          SafeDOM.text(' ' + track.rating) // Add space
        ]) : SafeDOM.span({ className: 'text-muted' }, '-')
      ),
      SafeDOM.td({ className: 'score-cell p-4 text-muted font-mono' }, track.score || '-'),
      SafeDOM.td({ className: 'duration-cell p-4 text-muted font-mono text-sm' }, duration),
      SafeDOM.td({ className: 'album-cell p-4 text-sm text-muted' }, track.albumTitle),
      SafeDOM.td({ className: 'source-cell p-4' },
        track.url ? SafeDOM.a({
          href: track.url,
          target: '_blank',
          className: 'btn-icon inline-flex items-center justify-center w-8 h-8 hover:bg-white/10 rounded-full transition-colors',
          title: 'View on BestEverAlbums'
        }, SafeDOM.fromHTML(getIcon('Share', 'w-4 h-4'))) : SafeDOM.text('-')
      )
    ])
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
