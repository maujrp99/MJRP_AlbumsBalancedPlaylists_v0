import { BaseView } from './BaseView.js'
import { SeriesRepository } from '../repositories/SeriesRepository.js'
import { PlaylistRepository } from '../repositories/PlaylistRepository.js'
import { getIcon } from '../components/Icons.js'
import { Breadcrumb } from '../components/Breadcrumb.js'
import { router } from '../router.js'
import toast from '../components/Toast.js'

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
              ${getIcon('History', 'w-8 h-8')} Your Playlists Series
            </h1>
          </div>
        </header>

        <div id="mainContent" class="fade-in" style="animation-delay: 0.1s">
            ${this.isLoading ? this.renderLoading() : this.renderContent()}
        </div>
        
        <!-- Playlist Detail Modal -->
        <div id="playlistModal" class="modal-overlay hidden z-50 fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center opacity-0 transition-opacity duration-300">
            <div class="modal-content glass-panel p-6 max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col transform scale-95 transition-transform duration-300">
                <div class="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                    <div>
                        <h3 id="modalTitle" class="text-2xl font-bold text-accent-primary">Playlist Title</h3>
                        <div class="text-xs text-muted mt-1 flex gap-3">
                            <span id="modalTrackCount">0 tracks</span>
                            <span id="modalDuration">0m</span>
                        </div>
                    </div>
                    <button id="closeModalBtn" class="btn btn-ghost btn-circle hover:bg-white/10 text-white" data-action="close-modal">
                        ${getIcon('X', 'w-6 h-6')}
                    </button>
                </div>
                
                <div id="modalTracks" class="overflow-y-auto flex-1 custom-scrollbar pr-2 space-y-2">
                    <!-- Tracks rendered here -->
                </div>

                <div class="modal-actions mt-6 pt-4 border-t border-white/10 flex justify-end gap-3">
                     <button class="btn btn-secondary" id="modalCloseAction" data-action="close-modal">Close</button>
                     <button class="btn btn-primary" id="modalEditBtn" data-action="edit-playlist-modal">
                        ${getIcon('Edit', 'w-4 h-4 mr-2')} Edit This Playlist
                     </button>
                </div>
            </div>
        </div>
      </div>
      
      <!-- Delete Confirmation Modal -->
      <div id="deleteModal" class="modal-overlay hidden z-50 fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center opacity-0 transition-opacity duration-300">
          <div class="modal-content glass-panel p-6 max-w-md w-full mx-4 transform scale-95 transition-transform duration-300">
              <div class="text-center">
                  <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                      ${getIcon('AlertTriangle', 'w-8 h-8 text-red-500')}
                  </div>
                  <h3 class="text-xl font-bold mb-2">Delete Series?</h3>
                  <p id="deleteSeriesName" class="text-muted mb-4">This will permanently delete this series and all its playlists.</p>
                  <div class="flex gap-3 justify-center">
                      <button class="btn btn-secondary" data-action="cancel-delete">Cancel</button>
                      <button class="btn btn-danger bg-red-600 hover:bg-red-700" data-action="confirm-delete">Delete</button>
                  </div>
              </div>
          </div>
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
        <div class="series-group glass-panel p-6 rounded-xl animate-scale-in">
            <div class="group-header flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-white/10 pb-4">
                <div class="mb-4 md:mb-0">
                    <h2 class="text-2xl font-bold text-accent-primary flex items-center gap-2">
                        ${getIcon('Layers', 'w-6 h-6')} ${this.escapeHtml(group.series.name)}
                    </h2>
                    <span class="text-xs text-muted font-mono bg-black/30 px-2 py-1 rounded ml-8">ID: ${group.series.id.slice(0, 8)}...</span>
                </div>
                <div class="flex gap-2">
                    <button class="btn btn-primary btn-sm flex items-center gap-1 group-hover:bg-accent-primary group-hover:text-white transition-colors" data-action="edit-series" data-id="${group.series.id}">
                        ${getIcon('Edit', 'w-4 h-4')} Edit Playlists
                    </button>
                    <button class="btn btn-secondary btn-sm group-hover:bg-white/10 transition-colors" data-action="open-series" data-id="${group.series.id}">
                        Open Series Manager ${getIcon('ArrowLeft', 'w-4 h-4 rotate-180 ml-1')}
                    </button>
                    <button class="btn btn-ghost btn-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors" data-action="delete-series" data-id="${group.series.id}" data-name="${this.escapeHtml(group.series.name)}">
                        ${getIcon('Trash', 'w-4 h-4')}
                    </button>
                </div>
            </div>

            <div class="playlists-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                ${group.playlists.map((pl, index) => `
                    <div class="playlist-mini-card bg-gradient-to-br from-white/5 to-transparent p-5 rounded-lg border border-white/5 hover:border-accent-primary/50 hover:shadow-lg hover:shadow-accent-primary/10 transition-all duration-300 group/card relative overflow-hidden flex flex-col">
                        <div class="absolute top-0 right-0 p-2 opacity-50 group-hover/card:opacity-100 transition-opacity">
                            ${getIcon('Music', 'w-12 h-12 text-white/5')}
                        </div>
                        
                        <div class="relative z-10 flex-1">
                            <h3 class="font-bold text-lg mb-1 truncate text-white group-hover/card:text-accent-primary transition-colors cursor-pointer" title="${this.escapeHtml(pl.name)}" data-action="view-playlist" data-series="${group.series.id}" data-id="${pl.id}">
                                ${this.escapeHtml(pl.name)}
                            </h3>
                            <div class="flex items-center gap-2 mb-3">
                                <span class="badge badge-primary text-xs font-bold shadow-sm">${pl.tracks?.length || 0} tracks</span>
                                <span class="text-xs text-muted flex items-center gap-1">
                                    ${getIcon('Clock', 'w-3 h-3')} ${this.formatDuration(pl.tracks)}
                                </span>
                            </div>

                            <!-- Album Summary -->
                            <div class="album-summary mb-4 space-y-1">
                                ${this.renderAlbumSummary(pl.tracks)}
                            </div>
                            
                            <div class="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-4">
                                <div class="h-full bg-accent-primary/50" style="width: ${Math.min(100, (pl.tracks?.length || 0) * 5)}%"></div>
                            </div>
                        </div>

                        <button class="btn btn-sm w-full border-2 border-white/30 bg-white/10 hover:bg-white/20 hover:border-white/50 z-20 flex items-center justify-center gap-2 font-medium transition-all" data-action="view-playlist" data-series="${group.series.id}" data-id="${pl.id}">
                             ${getIcon('Eye', 'w-4 h-4')} View Tracks
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
        `
    }

    renderAlbumSummary(tracks) {
        if (!tracks || tracks.length === 0) return ''

        // DEBUG: Check what track data looks like
        if (this.debugOnce !== true) {
            console.log('[SavedPlaylistsView] Track Sample JSON:', JSON.stringify(tracks[0], null, 2))
            this.debugOnce = true
        }

        // Extract unique albums (Artist - Album)
        const albums = new Set()
        tracks.forEach(t => {
            // Check for various property names
            const albumName = t.album || t.albumTitle || (t.albumData ? t.albumData.title : 'Unknown')
            const artistName = t.artist || t.artistName || (t.albumData ? t.albumData.artist : 'Unknown')

            if (albumName && artistName) {
                albums.add(`${artistName} - ${albumName}`)
            }
        })

        const uniqueAlbums = Array.from(albums)
        const displayLimit = 3
        const displayAlbums = uniqueAlbums.slice(0, displayLimit)
        const remaining = uniqueAlbums.length - displayLimit

        return `
            <div class="text-xs text-white/70 space-y-1">
                ${displayAlbums.map(album => `
                    <div class="flex items-center gap-1 truncate">
                        <span class="w-1 h-1 rounded-full bg-accent-primary/50 shrink-0"></span>
                        <span class="truncate block" title="${this.escapeHtml(album)}">${this.escapeHtml(album)}</span>
                    </div>
                `).join('')}
                ${remaining > 0 ? `<div class="text-white/40 pl-2 text-[10px]">+ ${remaining} more albums</div>` : ''}
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
        const { db, cacheManager, auth } = await import('../app.js')
        const { playlistsStore } = await import('../stores/playlists.js') // Load store
        const { albumSeriesStore } = await import('../stores/albumSeries.js') // Load store

        if (!db) {
            this.isLoading = false
            this.update()
            return
        }

        try {
            const userId = auth.currentUser ? auth.currentUser.uid : 'anonymous-user'
            const seriesRepo = new SeriesRepository(db, cacheManager, userId)
            const allSeries = await seriesRepo.findAll()

            const results = await Promise.all(allSeries.map(async (series) => {
                const playlistRepo = new PlaylistRepository(db, cacheManager, userId, series.id)
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
            const btn = e.target.closest('button[data-action]') || e.target.closest('[data-action="view-playlist"]')
            if (!btn) return

            const action = btn.dataset.action

            if (action === 'open-series') {
                router.navigate(`/albums?seriesId=${btn.dataset.id}`)
            }

            if (action === 'edit-series') {
                const id = btn.dataset.id
                this.handleEditSeries(id, albumSeriesStore, playlistsStore)
            }

            if (action === 'view-playlist') {
                const seriesId = btn.dataset.series
                const playlistId = btn.dataset.id
                this.openPlaylistModal(seriesId, playlistId)
            }

            if (action === 'close-modal') {
                this.closeModal()
            }

            if (action === 'edit-playlist-modal') {
                const seriesId = this.currentModalSeriesId
                if (seriesId) {
                    this.closeModal()
                    this.handleEditSeries(seriesId, albumSeriesStore, playlistsStore)
                }
            }

            if (btn.id === 'goHomeBtn') {
                router.navigate('/album-series')
            }

            // Delete Series Flow
            if (action === 'delete-series') {
                const seriesId = btn.dataset.id
                const seriesName = btn.dataset.name
                this.pendingDeleteId = seriesId
                this.openDeleteModal(seriesName)
            }

            if (action === 'cancel-delete') {
                this.closeDeleteModal()
            }

            if (action === 'confirm-delete') {
                if (this.pendingDeleteId) {
                    this.handleDeleteSeries(this.pendingDeleteId)
                }
            }
        })
    }

    handleEditSeries(seriesId, albumSeriesStore, playlistsStore) {
        const group = this.data.find(r => r.series.id === seriesId)
        if (!group) return

        const existing = albumSeriesStore.getSeries().find(s => s.id === seriesId)
        if (!existing) albumSeriesStore.series.push(group.series)
        albumSeriesStore.setActiveSeries(seriesId)
        playlistsStore.setPlaylists(group.playlists, seriesId)
        router.navigate('/playlists')
    }

    openDeleteModal(seriesName) {
        const modal = document.getElementById('deleteModal')
        const modalContent = modal?.querySelector('.modal-content')
        const nameEl = document.getElementById('deleteSeriesName')

        if (nameEl) {
            nameEl.textContent = `Delete "${seriesName}"? This will permanently remove this series and all its playlists.`
        }

        if (modal) {
            modal.classList.remove('hidden')
            setTimeout(() => {
                modal.classList.remove('opacity-0')
                if (modalContent) {
                    modalContent.classList.remove('scale-95')
                    modalContent.classList.add('scale-100')
                }
            }, 10)
        }
    }

    closeDeleteModal() {
        const modal = document.getElementById('deleteModal')
        const modalContent = modal?.querySelector('.modal-content')

        if (modal) {
            modal.classList.add('opacity-0')
            if (modalContent) {
                modalContent.classList.remove('scale-100')
                modalContent.classList.add('scale-95')
            }
            setTimeout(() => {
                modal.classList.add('hidden')
                this.pendingDeleteId = null
            }, 300)
        }
    }

    async handleDeleteSeries(seriesId) {
        const confirmBtn = document.querySelector('[data-action="confirm-delete"]')
        if (confirmBtn) {
            confirmBtn.disabled = true
            confirmBtn.textContent = 'Deleting...'
        }

        try {
            const { db, cacheManager, auth } = await import('../app.js')
            const userId = auth.currentUser ? auth.currentUser.uid : 'anonymous-user'

            // 1. Delete all playlists in the series
            const playlistRepo = new PlaylistRepository(db, cacheManager, userId, seriesId)
            const playlists = await playlistRepo.findAll()

            for (const playlist of playlists) {
                await playlistRepo.delete(playlist.id)
            }

            // 2. Delete the series itself
            const seriesRepo = new SeriesRepository(db, cacheManager, userId)
            await seriesRepo.delete(seriesId)

            // 3. Update local data and re-render
            this.data = this.data.filter(r => r.series.id !== seriesId)
            this.update()

            this.closeDeleteModal()

            console.log('[SavedPlaylistsView] Series deleted:', seriesId)
        } catch (err) {
            console.error('[SavedPlaylistsView] Delete failed:', err)
            toast.error('Failed to delete series: ' + err.message)

            if (confirmBtn) {
                confirmBtn.disabled = false
                confirmBtn.textContent = 'Delete'
            }
        }
    }

    openPlaylistModal(seriesId, playlistId) {
        const group = this.data.find(r => r.series.id === seriesId)
        if (!group) return

        const playlist = group.playlists.find(p => p.id === playlistId)
        if (!playlist) return

        this.currentModalSeriesId = seriesId

        // Populate Modal
        const modalTitle = document.getElementById('modalTitle')
        const modalTracks = document.getElementById('modalTracks')
        const modalCount = document.getElementById('modalTrackCount')
        const modalDur = document.getElementById('modalDuration')
        const modal = document.getElementById('playlistModal')
        const modalContent = modal.querySelector('.modal-content')

        if (modalTitle) modalTitle.textContent = playlist.name || 'Untitled Playlist'
        if (modalCount) modalCount.textContent = `${playlist.tracks?.length || 0} tracks`
        if (modalDur) modalDur.textContent = this.formatDuration(playlist.tracks)

        if (modalTracks) {
            modalTracks.innerHTML = (playlist.tracks || []).map((track, i) => `
                <div class="track-item flex items-center justify-between p-3 rounded bg-white/5 hover:bg-white/10 transition-colors border-b border-white/5 last:border-0">
                    <div class="flex items-center gap-3 overflow-hidden">
                        <span class="text-muted font-mono text-sm w-6 text-right">${i + 1}</span>
                        <div class="min-w-0">
                            <div class="font-bold truncate text-sm text-white">${this.escapeHtml(track.title)}</div>
                            <div class="text-xs text-muted truncate">${this.escapeHtml(track.artist)} • ${track.album || 'Unknown Album'}</div>
                        </div>
                    </div>
                    <div class="text-xs font-mono text-muted pl-2">
                        ${this.formatTime(track.duration)}
                    </div>
                </div>
            `).join('')
        }

        // Show Modal with Animation
        if (modal) {
            modal.classList.remove('hidden')
            // Small delay to allow display:block to apply before opacity transition
            setTimeout(() => {
                modal.classList.remove('opacity-0')
                modalContent.classList.remove('scale-95')
                modalContent.classList.add('scale-100')
            }, 10)
        }
    }

    closeModal() {
        const modal = document.getElementById('playlistModal')
        const modalContent = modal?.querySelector('.modal-content')

        if (modal) {
            modal.classList.add('opacity-0')
            if (modalContent) {
                modalContent.classList.remove('scale-100')
                modalContent.classList.add('scale-95')
            }
            setTimeout(() => {
                modal.classList.add('hidden')
                this.currentModalSeriesId = null
            }, 300)
        }
    }

    formatTime(seconds) {
        if (!seconds) return '0:00'
        const m = Math.floor(seconds / 60)
        const s = Math.floor(seconds % 60)
        return `${m}:${s.toString().padStart(2, '0')}`
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
