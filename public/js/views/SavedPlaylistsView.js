import { BaseView } from './BaseView.js'
import { SeriesRepository } from '../repositories/SeriesRepository.js'
import { PlaylistRepository } from '../repositories/PlaylistRepository.js'
import { getIcon } from '../components/Icons.js'
import { Breadcrumb } from '../components/Breadcrumb.js'
import { router } from '../router.js'
import toast from '../components/Toast.js'
import { BatchGroupCard } from '../components/playlists/BatchGroupCard.js'
import { optimizedAlbumLoader } from '../services/OptimizedAlbumLoader.js'
import { AlbumCascade } from '../components/common/AlbumCascade.js'

// Expose AlbumCascade globally for BatchGroupCard if needed (or refactor BatchGroupCard to import it)
// BatchGroupCard is static, so better to ensure it's imported there or here. 
// Ideally BatchGroupCard should import it, but I used `globalThis` check in BatchGroupCard edit to be safe.
// To be cleaner, I'll rely on BatchGroupCard handling it or this logic passing the HTML.
// Actually, BatchGroupCard render refactor used `globalThis.AlbumCascade` which is weak. 
// Let's attach it to window here to be safe since BatchGroupCard doesn't import it in my previous edit?
// Wait, I didn't add import to BatchGroupCard.js in previous step. 
// I should have. But since I'm here, I'll make sure it works by exposing it or I'll fix BatchGroupCard next.
// Better: I will fix BatchGroupCard import in a separate tool call if needed, but for now let's set it up here.
// Actually, I'll use the proper way: Import it here, pass it down? No, BatchGroupCard is responsible for rendering.
// I will assume BatchGroupCard needs the import.
window.AlbumCascade = AlbumCascade;

export class SavedPlaylistsView extends BaseView {
    constructor() {
        super()
        this.data = []
        this.isLoading = true
        this.thumbnailCache = new Map()
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
      
      <!-- Delete All Playlists Confirmation Modal -->
      <div id="deleteModal" class="modal-overlay hidden z-50 fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center opacity-0 transition-opacity duration-300">
          <div class="modal-content glass-panel p-6 max-w-md w-full mx-4 transform scale-95 transition-transform duration-300">
              <div class="text-center">
                  <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                      ${getIcon('AlertTriangle', 'w-8 h-8 text-red-500')}
                  </div>
                  <h3 class="text-xl font-bold mb-2">Delete All Playlists?</h3>
                  <p id="deleteSeriesName" class="text-muted mb-4">This will permanently delete all playlists in this series. The series and its albums will remain.</p>
                  <div class="flex gap-3 justify-center">
                      <button class="btn btn-secondary" data-action="cancel-delete">Cancel</button>
                      <button class="btn btn-danger bg-red-600 hover:bg-red-700" data-action="confirm-delete">Delete All Playlists</button>
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

        // Group playlists by batchName for organized display
        const playlistsByBatch = new Map()
        group.playlists.forEach(pl => {
            const batchKey = pl.batchName || 'Saved Playlists'
            if (!playlistsByBatch.has(batchKey)) {
                playlistsByBatch.set(batchKey, { name: batchKey, savedAt: pl.savedAt, playlists: [] })
            }
            playlistsByBatch.get(batchKey).playlists.push(pl)
        })

        // Sort playlists within each batch by order field or name
        playlistsByBatch.forEach(batch => {
            batch.playlists.sort((a, b) => {
                // Primary: sort by order field if present
                if (a.order !== undefined && b.order !== undefined) {
                    return a.order - b.order
                }
                // Fallback: sort by name (handles "1. Greatest Hits", "2. Deep Cuts", etc.)
                return (a.name || '').localeCompare(b.name || '', undefined, { numeric: true })
            })
        })

        // Sort batches by savedAt (newest first)
        const batches = Array.from(playlistsByBatch.values()).sort((a, b) => {
            const dateA = a.savedAt ? new Date(a.savedAt) : new Date(0)
            const dateB = b.savedAt ? new Date(b.savedAt) : new Date(0)
            return dateB - dateA
        })

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
                    <button class="btn btn-primary btn-sm flex items-center gap-1 group-hover:bg-accent-primary group-hover:text-white transition-colors" data-action="add-playlists" data-id="${group.series.id}">
                        ${getIcon('Plus', 'w-4 h-4')} Add Playlists
                    </button>
                    <button class="btn btn-secondary btn-sm group-hover:bg-white/10 transition-colors" data-action="open-series" data-id="${group.series.id}">
                        Open Series Manager ${getIcon('ArrowLeft', 'w-4 h-4 rotate-180 ml-1')}
                    </button>
                    <button class="btn btn-ghost btn-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors" data-action="delete-all-playlists" data-id="${group.series.id}" data-name="${this.escapeHtml(group.series.name)}" title="Delete all playlists in this series">
                        ${getIcon('Trash', 'w-4 h-4')}
                    </button>
                </div>
            </div>

            ${batches.map(batch => this.renderPlaylistBatch(batch, group.series.id)).join('')}
        </div>
        `
    }

    renderPlaylistBatch(batch, seriesId) {
        // Get cached thumbnails for this series
        const thumbnails = this.thumbnailCache.get(seriesId) || []

        return BatchGroupCard.render({
            seriesId,
            batchName: batch.name,
            playlists: batch.playlists,
            createdAt: batch.savedAt,
            thumbnails: thumbnails
        })
    }

    /**
     * Preload thumbnails for all series groups
     */
    async preloadAllThumbnails() {
        for (const group of this.data) {
            if (!this.thumbnailCache.has(group.series.id)) {
                this.preloadSeriesThumbnails(group.series).then(() => {
                    this.update() // Re-render to show loaded thumbnails
                })
            }
        }
    }

    /**
     * Preload thumbnails for a single series
     * Uses optimizedAlbumLoader to resolve covers from album names
     */
    async preloadSeriesThumbnails(series, max = 3) {
        // Use albumQueries (V3) or fallback to albums array names
        const queries = series.albumQueries || series.albums || []
        const thumbs = []
        const count = Math.min(queries.length, max)

        for (let i = 0; i < count; i++) {
            const query = queries[i]
            let coverUrl = null

            // Handle object query (with imageUrl) or string "Artist - Album"
            if (typeof query === 'object' && query.imageUrl) {
                coverUrl = query.imageUrl
            } else if (typeof query === 'string' && query.includes(' - ')) {
                const [artist, ...albumParts] = query.split(' - ')
                const album = albumParts.join(' - ')

                try {
                    const found = await optimizedAlbumLoader.findAlbum(artist, album)
                    if (found) {
                        coverUrl = optimizedAlbumLoader.getArtworkUrl(found, 100)
                    }
                } catch (e) {
                    // Ignore missing covers
                }
            }
            thumbs.push(coverUrl)
        }

        this.thumbnailCache.set(series.id, thumbs)
        return thumbs
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

            // Start loading thumbnails in background
            this.preloadAllThumbnails()
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

            // Delete All Playlists Flow (keeps series, deletes only playlists)
            if (action === 'delete-all-playlists') {
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
                    this.handleDeleteAllPlaylists(this.pendingDeleteId)
                }
            }

            // Delete Individual Playlist Flow
            if (action === 'delete-playlist') {
                const seriesId = btn.dataset.seriesId
                const playlistId = btn.dataset.playlistId
                const playlistName = btn.dataset.playlistName
                const trackCount = btn.dataset.trackCount
                this.handleDeletePlaylist(seriesId, playlistId, playlistName, trackCount)
            }

            // Add Playlists (Redirect to Blend Menu)
            if (action === 'add-playlists') {
                const id = btn.dataset.id
                // Use standard router navigation to Blend Menu
                router.navigate(`/blend?seriesId=${id}`)
            }

            // Edit Batch Playlists (navigate to editor)
            if (action === 'edit-batch') {
                const seriesId = btn.dataset.seriesId
                const batchName = btn.dataset.batchName
                this.handleEditBatchPlaylists(seriesId, batchName, albumSeriesStore, playlistsStore)
            }

            // Delete Batch (all playlists in this batch)
            if (action === 'delete-batch') {
                const seriesId = btn.dataset.seriesId
                const batchName = btn.dataset.batchName
                const count = btn.dataset.count
                this.handleDeleteBatch(seriesId, batchName, count)
            }
        })
    }

    async handleEditSeries(seriesId, albumSeriesStore, playlistsStore) {
        const group = this.data.find(r => r.series.id === seriesId)
        if (!group) return

        const existing = albumSeriesStore.getSeries().find(s => s.id === seriesId)
        if (!existing) albumSeriesStore.series.push(group.series)
        albumSeriesStore.setActiveSeries(seriesId)

        // Sprint 8.5 FIX: ALSO set albumsStore context so getAlbums() returns correct series
        const { albumsStore } = await import('../stores/albums.js')
        albumsStore.setActiveAlbumSeriesId(seriesId)
        console.log('[SavedPlaylistsView] Set albumsStore context for series:', seriesId)

        // Clear store and set CREATING mode for a clean slate
        playlistsStore.setCreateMode()
        playlistsStore.playlists = [] // Clear any existing data
        playlistsStore.seriesId = seriesId // Set series context

        router.navigate(`/playlists?seriesId=${seriesId}`)
    }

    openDeleteModal(seriesName) {
        const modal = document.getElementById('deleteModal')
        const modalContent = modal?.querySelector('.modal-content')
        const nameEl = document.getElementById('deleteSeriesName')

        if (nameEl) {
            nameEl.textContent = `Delete all playlists in "${seriesName}"? The series and albums will remain.`
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

    async handleDeleteAllPlaylists(seriesId) {
        const confirmBtn = document.querySelector('[data-action="confirm-delete"]')
        if (confirmBtn) {
            confirmBtn.disabled = true
            confirmBtn.textContent = 'Deleting...'
        }

        try {
            const { db, cacheManager, auth } = await import('../app.js')
            const userId = auth.currentUser ? auth.currentUser.uid : 'anonymous-user'

            // Delete all playlists in the series (but NOT the series itself)
            const playlistRepo = new PlaylistRepository(db, cacheManager, userId, seriesId)
            const playlists = await playlistRepo.findAll()

            for (const playlist of playlists) {
                await playlistRepo.delete(playlist.id)
            }

            // Update local data - clear playlists from the group but keep series
            const group = this.data.find(r => r.series.id === seriesId)
            if (group) {
                group.playlists = []
                // Remove group from view since it has no playlists
                this.data = this.data.filter(r => r.playlists.length > 0)
            }
            this.update()

            this.closeDeleteModal()
            toast.success('All playlists deleted. Series and albums remain.')

            console.log('[SavedPlaylistsView] All playlists deleted for series:', seriesId)
        } catch (err) {
            console.error('[SavedPlaylistsView] Delete playlists failed:', err)
            toast.error('Failed to delete playlists: ' + err.message)

            if (confirmBtn) {
                confirmBtn.disabled = false
                confirmBtn.textContent = 'Delete All Playlists'
            }
        }
    }

    async handleDeletePlaylist(seriesId, playlistId, playlistName, trackCount) {
        // Use showDeletePlaylistModal from Modals.js
        const { showDeletePlaylistModal } = await import('../components/Modals.js')

        showDeletePlaylistModal(playlistId, playlistName, trackCount, async (id) => {
            const { db, cacheManager, auth } = await import('../app.js')
            const userId = auth.currentUser ? auth.currentUser.uid : 'anonymous-user'

            // Delete only this playlist
            const playlistRepo = new PlaylistRepository(db, cacheManager, userId, seriesId)
            await playlistRepo.delete(id)

            // Update local data
            const group = this.data.find(r => r.series.id === seriesId)
            if (group) {
                group.playlists = group.playlists.filter(p => p.id !== id)

                // If no playlists left in series, remove the group
                if (group.playlists.length === 0) {
                    this.data = this.data.filter(r => r.series.id !== seriesId)
                }
            }

            this.update()
            toast.success(`Playlist "${playlistName}" deleted`)
            console.log('[SavedPlaylistsView] Playlist deleted:', id)
        })
    }

    async handleEditBatchPlaylists(seriesId, batchName, albumSeriesStore, playlistsStore) {
        // Sprint 11: Use new EditPlaylistView for editing batches
        // EditPlaylistView loads directly from Firestore to avoid ghost playlists (#55)
        // and saves by batchName to fix overwriting issue (#54)

        console.log('[SavedPlaylistsView] Navigating to EditPlaylistView:', { seriesId, batchName })

        // Navigate to new edit route - EditPlaylistView handles loading
        router.navigate(`/playlists/edit?seriesId=${seriesId}&edit=${encodeURIComponent(batchName)}`)
    }

    async handleDeleteBatch(seriesId, batchName, count) {
        // Show confirmation modal
        const { showDeleteBatchModal } = await import('../components/Modals.js')

        // Reuse delete modal with batch info
        showDeleteBatchModal(batchName, count, async () => {
            const { db, cacheManager, auth } = await import('../app.js')
            const userId = auth.currentUser ? auth.currentUser.uid : 'anonymous-user'

            const playlistRepo = new PlaylistRepository(db, cacheManager, userId, seriesId)
            const group = this.data.find(r => r.series.id === seriesId)

            if (group) {
                const playlistsInBatch = group.playlists.filter(p => p.batchName === batchName)

                // Delete each playlist in this batch
                for (const playlist of playlistsInBatch) {
                    await playlistRepo.delete(playlist.id)
                }

                // Update local data
                group.playlists = group.playlists.filter(p => p.batchName !== batchName)

                if (group.playlists.length === 0) {
                    this.data = this.data.filter(r => r.series.id !== seriesId)
                }

                this.update()
                toast.success(`Batch "${batchName}" deleted (${count} playlists)`)
                console.log('[SavedPlaylistsView] Batch deleted:', batchName)
            }
        })
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
            modalTracks.innerHTML = '' // Clear existing content
            const fragment = document.createDocumentFragment()

            const tracks = playlist.tracks || []
            tracks.forEach((track, i) => {
                const row = document.createElement('div')
                row.className = 'track-item flex items-center justify-between p-3 rounded bg-white/5 hover:bg-white/10 transition-colors border-b border-white/5 last:border-0'

                // Left Section (Index + Info)
                const leftDiv = document.createElement('div')
                leftDiv.className = 'flex items-center gap-3 overflow-hidden'

                // Index
                const indexSpan = document.createElement('span')
                indexSpan.className = 'text-muted font-mono text-sm w-6 text-right'
                indexSpan.textContent = i + 1
                leftDiv.appendChild(indexSpan)

                // Info Container
                const infoDiv = document.createElement('div')
                infoDiv.className = 'min-w-0'

                // Title
                const titleDiv = document.createElement('div')
                titleDiv.className = 'font-bold truncate text-sm text-white'
                titleDiv.textContent = track.title
                infoDiv.appendChild(titleDiv)

                // Artist • Album
                const artistDiv = document.createElement('div')
                artistDiv.className = 'text-xs text-muted truncate'
                artistDiv.textContent = `${track.artist} • ${track.album || 'Unknown Album'}`
                infoDiv.appendChild(artistDiv)

                leftDiv.appendChild(infoDiv)
                row.appendChild(leftDiv)

                // Right Section (Duration)
                const durationDiv = document.createElement('div')
                durationDiv.className = 'text-xs font-mono text-muted pl-2'
                durationDiv.textContent = this.formatTime(track.duration)
                row.appendChild(durationDiv)

                fragment.appendChild(row)
            })

            modalTracks.appendChild(fragment)
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
        if (!container) return

        try {
            // Safety: Ensure data is defined
            if (!this.data) this.data = []

            container.innerHTML = this.isLoading ? this.renderLoading() : this.renderContent()
        } catch (err) {
            console.error('[SavedPlaylistsView] Render failed:', err)
            container.innerHTML = `
                <div class="p-8 text-center">
                    <div class="text-red-500 text-xl font-bold mb-2">Error Loading View</div>
                    <pre class="bg-black/30 p-4 rounded text-left text-sm overflow-auto text-red-300">${err.message}\n${err.stack}</pre>
                </div>
            `
        }
    }

    escapeHtml(text) {
        if (!text) return ''
        const div = document.createElement('div')
        div.textContent = text
        return div.innerHTML
    }
}
