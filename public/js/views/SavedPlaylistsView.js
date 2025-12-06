import { BaseView } from './BaseView.js'
import { SeriesRepository } from '../repositories/SeriesRepository.js'
import { PlaylistRepository } from '../repositories/PlaylistRepository.js'
import { getIcon } from '../components/Icons.js'
import { Breadcrumb } from '../components/Breadcrumb.js'
import { router } from '../router.js'

export class SavedPlaylistsView extends BaseView {
    constructor() {
        super()
        this.data = []
        this.isLoading = true
    }

    async render(params) {
        return `
      <div class="saved-playlists-view container">
        <header class="view-header mb-8 fade-in">
          ${Breadcrumb.render('/saved-playlists')}
          
          <div class="header-content mt-6 flex justify-between items-center mb-6">
            <h1 class="text-4xl font-bold flex items-center gap-3">
              ${getIcon('History', 'w-8 h-8')} Global Playlist History
            </h1>
          </div>
        </header>

        <div id="mainContent" class="fade-in" style="animation-delay: 0.1s">
            ${this.isLoading ? this.renderLoading() : this.renderContent()}
        </div>
      </div>
    `
    }

    renderLoading() {
        return `
        <div class="loading-state text-center py-12">
            <div class="loading-spinner w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p class="text-xl">Scanning all series for playlists...</p>
        </div>
        `
    }

    renderContent() {
        if (this.data.length === 0) {
            return `
            <div class="empty-state text-center py-12 opacity-50">
                ${getIcon('List', 'w-16 h-16 mx-auto mb-4 opacity-50')}
                <h3 class="text-xl font-bold mb-2">No Playlists Found</h3>
                <p>Generate and save playlists in your series to see them here.</p>
                <button class="btn btn-primary mt-4" id="goHomeBtn">Create Series</button>
            </div>
            `
        }

        return `
        <div class="series-groups space-y-8">
            ${this.data.map(group => this.renderSeriesGroup(group)).join('')}
        </div>
        `
    }

    renderSeriesGroup(group) {
        if (group.playlists.length === 0) return '' // Skip empty series

        return `
        <div class="series-group glass-panel p-6 rounded-xl">
            <div class="group-header flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                <div>
                    <h2 class="text-2xl font-bold text-accent-primary">${this.escapeHtml(group.series.name)}</h2>
                    <span class="text-xs text-muted">Series ID: ${group.series.id}</span>
                </div>
                <button class="btn btn-secondary btn-sm" data-action="open-series" data-id="${group.series.id}">
                    Open Series ${getIcon('ArrowLeft', 'w-4 h-4 rotate-180 ml-1')}
                </button>
            </div>

            <div class="playlists-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${group.playlists.map(pl => `
                    <div class="playlist-mini-card bg-white/5 p-4 rounded-lg border border-white/5 hover:border-accent-primary/30 transition-all">
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="font-bold truncate" title="${this.escapeHtml(pl.name)}">${this.escapeHtml(pl.name)}</h3>
                            <span class="badge badge-neutral text-xs">${pl.tracks?.length || 0} tracks</span>
                        </div>
                        <div class="text-xs text-muted mb-3">
                            Duration: ${this.formatDuration(pl.tracks)}
                        </div>
                        <!-- Future: Add 'Load Playlist' button specific to playlist -->
                    </div>
                `).join('')}
            </div>
        </div>
        `
    }

    formatDuration(tracks) {
        if (!tracks) return '0m'
        const seconds = tracks.reduce((acc, t) => acc + (t.duration || 0), 0)
        return Math.floor(seconds / 60) + 'm'
    }

    async mount() {
        // Load data
        const { db, cacheManager } = await import('../app.js')

        if (!db) {
            this.isLoading = false
            this.update()
            return
        }

        try {
            const seriesRepo = new SeriesRepository(db, cacheManager, 'anonymous-user')
            const allSeries = await seriesRepo.findAll()

            const results = await Promise.all(allSeries.map(async (series) => {
                const playlistRepo = new PlaylistRepository(db, cacheManager, 'anonymous-user', series.id)
                const playlists = await playlistRepo.findAll()
                return { series, playlists }
            }))

            // Filter out groups with no playlists
            this.data = results.filter(r => r.playlists && r.playlists.length > 0)

        } catch (err) {
            console.error('Failed to load history:', err)
            // Error handling UI could go here
        } finally {
            this.isLoading = false
            this.update()
        }

        // Event Listeners
        this.on(document.getElementById('app'), 'click', (e) => {
            const btn = e.target.closest('button[data-action]')
            if (!btn) return

            if (btn.dataset.action === 'open-series') {
                router.navigate(`/albums?seriesId=${btn.dataset.id}`)
            }
            if (btn.id === 'goHomeBtn') {
                router.navigate('/home')
            }
        })
    }

    update() {
        const container = document.getElementById('mainContent')
        if (container) {
            container.innerHTML = this.isLoading ? this.renderLoading() : this.renderContent()
        }
    }

    escapeHtml(text) {
        if (!text) return ''
        const div = document.createElement('div')
        div.textContent = text
        return div.innerHTML
    }
}
