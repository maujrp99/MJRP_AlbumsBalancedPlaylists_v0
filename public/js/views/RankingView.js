import { BaseView } from './BaseView.js'
import { albumsStore } from '../stores/albums.js'
import { router } from '../router.js'
import { Breadcrumb } from '../components/Breadcrumb.js'
import { getIcon } from '../components/Icons.js'
import { TrackRow } from '../components/ui/TrackRow.js'
import { SafeDOM } from '../utils/SafeDOM.js'

/**
 * RankingView (MODE 2)
 * Single Album Detail with dual tracklists:
 * - Ranked by Acclaim (sorted by rating)
 * - Original Album Order (AS IS)
 * REFACTORED: SafeDOM implementation (Sprint 16)
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

    // Header
    const backBtn = SafeDOM.button({
      id: 'backToAlbums',
      className: 'btn btn-secondary mb-4 inline-flex items-center gap-2'
    })
    backBtn.appendChild(SafeDOM.fromHTML(getIcon('ArrowLeft', 'w-4 h-4')))
    backBtn.appendChild(SafeDOM.text(' Back to Albums'))

    const coverContainer = SafeDOM.div({
      className: 'album-cover-large w-32 h-32 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center flex-shrink-0'
    })

    if (album.coverUrl) {
      coverContainer.appendChild(SafeDOM.img({
        src: album.coverUrl,
        alt: album.title,
        className: 'w-full h-full object-cover rounded-xl'
      }))
    } else {
      const iconDiv = SafeDOM.div({ className: 'text-4xl opacity-20' })
      iconDiv.appendChild(SafeDOM.fromHTML(getIcon('Music', 'w-16 h-16')))
      coverContainer.appendChild(iconDiv)
    }

    const ratingsBadges = []
    if (album.year) ratingsBadges.push(SafeDOM.span({ className: 'badge badge-neutral' }, String(album.year)))
    ratingsBadges.push(SafeDOM.span({ className: 'badge badge-neutral' }, `${trackCount} tracks`))
    if (avgRating) ratingsBadges.push(SafeDOM.span({ className: 'badge badge-success' }, `Avg Rating: ${avgRating}`))

    const albumInfo = SafeDOM.div({ className: 'flex-1' }, [
      SafeDOM.h1({ className: 'text-3xl font-bold mb-2 flex items-center gap-2' }, [
        SafeDOM.fromHTML(getIcon('Music', 'w-8 h-8')),
        SafeDOM.text(album.title)
      ]),
      SafeDOM.p({ className: 'text-accent-primary text-xl mb-3' }, album.artist),
      SafeDOM.div({ className: 'flex flex-wrap gap-3 text-sm' }, ratingsBadges)
    ])

    const headerCard = SafeDOM.div({ className: 'glass-panel p-6 mb-6' },
      SafeDOM.div({ className: 'flex items-start gap-6' }, [coverContainer, albumInfo])
    )

    const header = SafeDOM.header({ className: 'view-header mb-8 fade-in' }, [
      // Breadcrumb returns string
      SafeDOM.fromHTML(Breadcrumb.render(`/ranking/${albumId}`, params)),
      backBtn,
      headerCard
    ])

    // Dual Tracklists
    const dualTracklists = SafeDOM.div({ className: 'dual-tracklists grid gap-8' }, [
      this.renderRankedTracklist(album),
      this.renderOriginalTracklist(album)
    ])

    // Footer
    const footer = SafeDOM.footer({ className: 'view-footer mt-12 text-center text-muted text-sm border-t border-white/5 pt-6' },
      SafeDOM.p({ className: 'last-update' }, `Last updated: ${new Date().toLocaleTimeString()}`)
    )

    const container = SafeDOM.div({ className: 'ranking-view container' }, [
      header, dualTracklists, footer
    ])

    // Return Node directly (supported by router.js update)
    return container
  }

  renderRankedTracklist(album) {
    const tracks = album.tracks || []
    if (tracks.length === 0) {
      return SafeDOM.p({ className: 'text-muted' }, 'No tracks available')
    }

    // Sort by rating (descending)
    const rankedTracks = [...tracks].sort((a, b) => (b.rating || 0) - (a.rating || 0))

    const title = SafeDOM.h3({ className: 'text-xl font-bold mb-6 flex items-center gap-2' }, [
      SafeDOM.fromHTML(getIcon('TrendingUp', 'w-6 h-6 text-accent-primary')),
      SafeDOM.text(' Ranked by BestEverAlbums')
    ])

    const list = SafeDOM.div({ className: 'tracks-list space-y-2' },
      rankedTracks.map((track, idx) => TrackRow.render({
        track,
        index: idx + 1,
        variant: 'ranking',
        primaryRanking: 'acclaim'
      }))
    )

    return SafeDOM.div({ className: 'tracklist-section glass-panel p-6 fade-in' }, [title, list])
  }

  renderOriginalTracklist(album) {
    const tracks = album.tracksOriginalOrder || album.tracks || []

    if (tracks.length === 0) {
      return SafeDOM.p({ className: 'text-muted' }, 'No tracks available')
    }

    const title = SafeDOM.h3({ className: 'text-xl font-bold mb-6 flex items-center gap-2' }, [
      SafeDOM.fromHTML(getIcon('List', 'w-6 h-6 text-accent-secondary')),
      SafeDOM.text(' Original Album Order')
    ])

    const list = SafeDOM.div({ className: 'tracks-list space-y-2' },
      tracks.map((track, idx) => {
        const position = track.position || (idx + 1)
        return TrackRow.render({
          track,
          index: position,
          variant: 'detailed'
        })
      })
    )

    return SafeDOM.div({
      className: 'tracklist-section glass-panel p-6 fade-in',
      style: { animationDelay: '0.1s' }
    }, [title, list])
  }

  renderNotFound() {
    const container = SafeDOM.div({ className: 'not-found container text-center py-16' });
    const panel = SafeDOM.div({ className: 'glass-panel p-12 max-w-md mx-auto' });

    panel.appendChild(SafeDOM.div({ className: 'text-6xl mb-6 opacity-30' }, [SafeDOM.fromHTML(getIcon('AlertTriangle', 'w-24 h-24 mx-auto'))]));
    panel.appendChild(SafeDOM.h2({ className: 'text-2xl font-bold mb-2' }, 'Album Not Found'));
    panel.appendChild(SafeDOM.p({ className: 'text-muted mb-8' }, "The requested album doesn't exist in your library."));

    const btn = SafeDOM.button({ className: 'btn btn-primary', id: 'goHomeBtn' });
    btn.appendChild(SafeDOM.fromHTML(getIcon('ArrowLeft', 'w-4 h-4 mr-2')));
    btn.appendChild(SafeDOM.text(' Go to Home'));
    panel.appendChild(btn);

    container.appendChild(panel);
    return container;
  }

  async mount(params) {
    this.container = document.getElementById('app')

    // Attach breadcrumb listeners
    Breadcrumb.attachListeners(this.container)

    // Event Delegation for buttons
    // Note: Since elements are created via SafeDOM and appended, we could attach listeners directly during creation if we wanted.
    // But maintaining existing pattern for now.

    const backBtn = this.container.querySelector('#backToAlbums')
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        router.navigate('/albums')
      })
    }

    const goHomeBtn = this.container.querySelector('#goHomeBtn')
    if (goHomeBtn) {
      goHomeBtn.addEventListener('click', () => router.navigate('/home'))
    }
  }

  findAlbum(albumId) {
    const albums = albumsStore.getAlbums()
    const album = albums.find(a => a.id === albumId)

    if (!album) {
      console.warn('[RankingView] Album not found:', albumId)
    }

    return album || null
  }

  calculateAverageRating(tracks) {
    if (!tracks || tracks.length === 0) return null

    const ratedTracks = tracks.filter(t => t.rating && t.rating > 0)
    if (ratedTracks.length === 0) return null

    const sum = ratedTracks.reduce((acc, t) => acc + t.rating, 0)
    return Math.round(sum / ratedTracks.length)
  }

}
