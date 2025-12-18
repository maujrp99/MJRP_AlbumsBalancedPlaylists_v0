import { BaseView } from './BaseView.js'
import { playlistsStore } from '../stores/playlists.js'
import { albumsStore } from '../stores/albums.js'
import { albumSeriesStore } from '../stores/albumSeries.js'
import { router } from '../router.js'
import { Breadcrumb } from '../components/Breadcrumb.js'
import { getIcon } from '../components/Icons.js'
import toast from '../components/Toast.js'
import Sortable from 'sortablejs'
import { getAllAlgorithms, getRecommendedAlgorithm, createAlgorithm } from '../algorithms/index.js'

// Sprint 10: Modular components
import { handleExportJson as handleExportJsonFn, handleExportToAppleMusic as handleExportToAppleMusicFn } from './playlists/index.js'

/**
 * EditPlaylistView - Sprint 11
 * 
 * Dedicated view for EDITING existing playlist batches.
 * Fixes Issue #54 (Edit Batch Not Overwriting) and #55 (Ghost Playlists).
 * 
 * Key differences from PlaylistsView:
 * 1. Loads data from Firestore (not localStorage) to avoid ghost playlists
 * 2. Stores originalBatchName to support batch renaming
 * 3. Save always deletes old batch + saves new (by originalBatchName)
 */
export class EditPlaylistView extends BaseView {
    constructor() {
        super()
        this.isGenerating = false
        this.draggedTrack = null
        this.exportListenersAttached = false
        this.isDragging = false

        // EDIT mode specific
        this.originalBatchName = null  // The batch name from URL (for delete)
        this.currentBatchName = null   // Current name (may change if renamed)
        this.seriesId = null           // Series ID from URL

        // Algorithm selection
        const recommended = getRecommendedAlgorithm()
        this.selectedAlgorithmId = recommended ? recommended.id : 's-draft-balanced'
    }

    async render(params) {
        const state = playlistsStore.getState()
        const activeSeries = albumSeriesStore.getActiveSeries()
        const playlists = state.playlists

        return `
      <div class="playlists-view edit-mode container">
        <header class="view-header mb-8 fade-in">
          ${Breadcrumb.render('/playlists')}
          
          <div class="header-content mt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h1 class="text-4xl font-bold flex items-center gap-3">
              ${getIcon('Edit', 'w-8 h-8')} Edit Playlist Batch
            </h1>
            
            <div class="header-actions flex items-center gap-4">
              <span class="badge badge-warning px-3 py-1 rounded-full text-sm">
                Editing: ${this.currentBatchName || 'Loading...'}
              </span>
            </div>
          </div>
        </header>

        <!-- Batch Name Editor -->
        <div id="batchNameSection" class="mb-6 fade-in glass-panel p-4 rounded-xl" style="animation-delay: 0.03s">
          <label class="block text-sm font-medium mb-2">Batch Name</label>
          <input 
            type="text" 
            id="batchNameInput" 
            value="${this.escapeHtml(this.currentBatchName || '')}"
            class="input input-bordered w-full max-w-md bg-white/5 border-white/10 rounded-lg px-4 py-2"
            placeholder="Enter batch name"
          />
        </div>

        <!-- Algorithm Selector (for regenerate) -->
        <div id="algorithmSection" class="mb-6 fade-in" style="animation-delay: 0.05s">
          ${this.renderAlgorithmSelector()}
        </div>

        <!-- Export Section -->
        <div id="exportSection" class="mb-6 fade-in" style="animation-delay: 0.08s">
          ${playlists.length > 0 ? this.renderExportSection() : ''}
        </div>

        <div id="mainContent" class="fade-in" style="animation-delay: 0.1s">
          ${playlists.length === 0 ? this.renderLoadingState() : ''}

          <div class="playlists-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="playlistsGrid">
            ${this.renderPlaylists(playlists)}
          </div>
        </div>

        ${this.isGenerating ? this.renderGeneratingOverlay() : ''}
        
        <footer class="view-footer mt-12 text-center text-muted text-sm border-t border-white/5 pt-6">
          <p class="last-update">Last updated: ${new Date().toLocaleTimeString()}</p>
        </footer>
      </div>
    `
    }

    renderLoadingState() {
        return `
      <div class="text-center py-8">
        <div class="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p class="text-muted">Loading playlists from cloud...</p>
      </div>
    `
    }

    async mount(params) {
        // Extract batch name and series ID from URL
        this.originalBatchName = params.edit
        this.currentBatchName = params.edit
        this.seriesId = params.seriesId

        if (!this.originalBatchName) {
            toast.error('No batch name specified')
            router.navigate('/playlists/saved')
            return
        }

        console.log('[EditPlaylistView] Mounting in EDIT mode', {
            originalBatchName: this.originalBatchName,
            seriesId: this.seriesId
        })

        // Clear old store data to avoid ghost playlists
        playlistsStore.clear()

        // Load playlists from Firestore (not localStorage!)
        await this.loadPlaylistsFromFirestore()

        // Subscribe to store changes
        this.unsubscribe = playlistsStore.subscribe(() => {
            if (!this.isDragging) {
                this.update()
            }
        })

        // Setup event listeners
        this.setupEventListeners()

        // Setup drag and drop after playlists are loaded
        setTimeout(() => this.setupDragAndDrop(), 100)
    }

    async loadPlaylistsFromFirestore() {
        try {
            const { db, cacheManager, auth } = await import('../app.js')
            const userId = auth.currentUser?.uid || 'anonymous-user'

            // Get series ID from URL or active series
            let seriesId = this.seriesId
            if (!seriesId) {
                const activeSeries = albumSeriesStore.getActiveSeries()
                seriesId = activeSeries?.id
            }

            if (!seriesId) {
                toast.error('No series selected')
                router.navigate('/playlists/saved')
                return
            }

            // Set active series if needed
            if (!albumSeriesStore.getActiveSeries() || albumSeriesStore.getActiveSeries().id !== seriesId) {
                await albumSeriesStore.loadFromFirestore()
                albumSeriesStore.setActiveSeries(seriesId)
            }

            const { PlaylistRepository } = await import('../repositories/PlaylistRepository.js')
            const repo = new PlaylistRepository(db, cacheManager, userId, seriesId)

            console.log('[EditPlaylistView] Loading playlists from Firestore for batch:', this.originalBatchName)

            const allPlaylists = await repo.findAll()
            const batchPlaylists = allPlaylists
                .filter(p => p.batchName === this.originalBatchName)
                .sort((a, b) => (a.order || 0) - (b.order || 0))

            if (batchPlaylists.length === 0) {
                toast.warning(`No playlists found for batch "${this.originalBatchName}"`)
                router.navigate('/playlists/saved')
                return
            }

            console.log('[EditPlaylistView] Loaded', batchPlaylists.length, 'playlists from Firestore')

            // Load into store
            playlistsStore.setPlaylists(batchPlaylists)
            playlistsStore.setSeriesId(seriesId)

            // Also load albums for potential regeneration
            await this.loadAlbumsForSeries(seriesId)

            // Update UI
            this.update()
        } catch (error) {
            console.error('[EditPlaylistView] Failed to load from Firestore:', error)
            toast.error('Failed to load playlists')
        }
    }

    async loadAlbumsForSeries(seriesId) {
        // Load albums from series if not already in store
        const albums = albumsStore.getAlbums()
        if (albums.length === 0) {
            const activeSeries = albumSeriesStore.getActiveSeries()
            if (activeSeries?.albumQueries) {
                // TODO: Load albums from queries if needed for regeneration
                console.log('[EditPlaylistView] Albums not loaded, regeneration may not work')
            }
        }
    }

    setupEventListeners() {
        // Batch name input
        const batchNameInput = this.$('#batchNameInput')
        if (batchNameInput) {
            batchNameInput.addEventListener('input', (e) => {
                this.currentBatchName = e.target.value.trim() || this.originalBatchName
            })
        }

        // Generate button
        const generateBtn = this.$('#generateBtn')
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.handleGenerate())
        }

        // Algorithm selector
        const algorithmSelect = this.$('#algorithmSelect')
        if (algorithmSelect) {
            algorithmSelect.addEventListener('change', (e) => {
                this.selectedAlgorithmId = e.target.value
            })
        }

        // Save button
        const saveBtn = this.$('#saveToHistoryBtn')
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.handleSave())
        }

        // Export listeners
        this.attachExportListeners()
    }

    async handleSave() {
        const btn = this.$('#saveToHistoryBtn')
        if (btn) {
            btn.disabled = true
            btn.textContent = 'Saving...'
        }

        try {
            const { db, cacheManager, auth } = await import('../app.js')
            const userId = auth.currentUser?.uid || 'anonymous-user'
            const activeSeries = albumSeriesStore.getActiveSeries()

            if (!activeSeries) {
                toast.error('No series selected')
                return
            }

            const { PlaylistRepository } = await import('../repositories/PlaylistRepository.js')
            const repo = new PlaylistRepository(db, cacheManager, userId, activeSeries.id)

            // 1. DELETE old batch by ORIGINAL name (supports renaming)
            console.log('[EditPlaylistView] Deleting old batch:', this.originalBatchName)
            const allPlaylists = await repo.findAll()
            const oldBatchPlaylists = allPlaylists.filter(p => p.batchName === this.originalBatchName)

            for (const oldPlaylist of oldBatchPlaylists) {
                await repo.delete(oldPlaylist.id)
            }
            console.log('[EditPlaylistView] Deleted', oldBatchPlaylists.length, 'old playlists')

            // 2. Set new batch name on current playlists
            playlistsStore.setBatchName(this.currentBatchName)

            // 3. Save new playlists
            await playlistsStore.saveToFirestore(db, cacheManager, userId)

            console.log('[EditPlaylistView] Saved batch with new name:', this.currentBatchName)

            if (btn) {
                btn.className = 'btn btn-success flex items-center gap-2'
                btn.innerHTML = `${getIcon('Check', 'w-5 h-5')} Saved!`
            }

            toast.success(`"${this.currentBatchName}" saved successfully!`)

            // Navigate back to saved playlists
            setTimeout(() => {
                router.navigate('/playlists/saved')
            }, 1500)

        } catch (error) {
            console.error('[EditPlaylistView] Save failed:', error)
            toast.error('Failed to save: ' + error.message)

            if (btn) {
                btn.disabled = false
                btn.innerHTML = `${getIcon('Cloud', 'w-5 h-5')} Save Changes`
            }
        }
    }

    async handleGenerate() {
        const albums = albumsStore.getAlbums()

        if (albums.length === 0) {
            toast.warning('No albums loaded. Go back to Albums view and load albums first.')
            return
        }

        this.isGenerating = true
        this.update()

        try {
            const algorithm = createAlgorithm(this.selectedAlgorithmId)

            if (!algorithm) {
                toast.error('Selected algorithm not found')
                return
            }

            console.log('[EditPlaylistView] Regenerating with algorithm:', algorithm.name)

            const newPlaylists = algorithm.generate(albums)

            // Keep the current batch name
            newPlaylists.forEach((p, i) => {
                p.batchName = this.currentBatchName
                p.order = i
            })

            playlistsStore.setPlaylists(newPlaylists)
            toast.success(`Regenerated ${newPlaylists.length} playlists!`)

        } catch (error) {
            console.error('[EditPlaylistView] Generate failed:', error)
            toast.error('Generation failed: ' + error.message)
        } finally {
            this.isGenerating = false
            this.update()
            setTimeout(() => this.setupDragAndDrop(), 100)
        }
    }

    // Render methods (similar to PlaylistsView)
    renderAlgorithmSelector() {
        const algorithms = getAllAlgorithms()
        const options = algorithms.map(algo => `
      <option value="${algo.id}" ${this.selectedAlgorithmId === algo.id ? 'selected' : ''}>
        ${algo.name}
      </option>
    `).join('')

        return `
      <div class="flex flex-wrap gap-4 items-center glass-panel p-4 rounded-xl">
        <div class="flex-1 min-w-[200px]">
          <label class="block text-sm font-medium mb-2">Algorithm</label>
          <select id="algorithmSelect" class="select select-bordered w-full bg-white/5 border-white/10 rounded-lg">
            ${options}
          </select>
        </div>
        <button id="generateBtn" class="btn btn-primary flex items-center gap-2 mt-6">
          ${getIcon('RefreshCw', 'w-5 h-5')} Regenerate
        </button>
        <button id="saveToHistoryBtn" class="btn btn-success flex items-center gap-2 mt-6">
          ${getIcon('Cloud', 'w-5 h-5')} Save Changes
        </button>
      </div>
    `
    }

    renderExportSection() {
        return `
      <div class="flex flex-wrap gap-3 glass-panel p-4 rounded-xl">
        <button id="exportJsonBtn" class="btn btn-outline btn-sm flex items-center gap-2">
          ${getIcon('Download', 'w-4 h-4')} Export JSON
        </button>
        <button id="exportAppleMusicBtn" class="btn btn-outline btn-sm flex items-center gap-2">
          ${getIcon('Apple', 'w-4 h-4')} Export to Apple Music
        </button>
      </div>
    `
    }

    renderPlaylists(playlists) {
        if (!playlists || playlists.length === 0) return ''

        return playlists.map((playlist, index) => `
      <div class="playlist-card glass-panel rounded-xl p-4" data-playlist-index="${index}">
        <h3 class="text-lg font-bold mb-3 flex items-center gap-2">
          ${getIcon('Music', 'w-5 h-5')} ${playlist.name}
          <span class="badge badge-sm ml-auto">${playlist.tracks?.length || 0} tracks</span>
        </h3>
        <div class="tracks-list space-y-1 max-h-[400px] overflow-y-auto" data-playlist-index="${index}">
          ${(playlist.tracks || []).map((track, trackIndex) => this.renderTrack(track, index, trackIndex)).join('')}
        </div>
        <div class="mt-3 text-sm text-muted">
          Duration: ${this.calculateDuration(playlist.tracks || [])}
        </div>
      </div>
    `).join('')
    }

    renderTrack(track, playlistIndex, trackIndex) {
        const ratingClass = this.getRatingClass(track.rating)
        return `
      <div class="track-item flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-move" 
           data-playlist-index="${playlistIndex}" 
           data-track-index="${trackIndex}">
        <span class="text-xs text-muted w-6">${trackIndex + 1}</span>
        <div class="flex-1 min-w-0">
          <div class="font-medium truncate">${this.escapeHtml(track.title)}</div>
          <div class="text-sm text-muted truncate">${this.escapeHtml(track.artist)}</div>
        </div>
        ${track.rating ? `<span class="badge ${ratingClass} text-xs">${track.rating}</span>` : ''}
      </div>
    `
    }

    getRatingClass(rating) {
        if (!rating) return 'badge-ghost'
        if (rating >= 90) return 'badge-success'
        if (rating >= 70) return 'badge-info'
        if (rating >= 50) return 'badge-warning'
        return 'badge-error'
    }

    renderGeneratingOverlay() {
        return `
      <div class="loading-overlay">
        <div class="loading-spinner"></div>
        <p class="text-lg mt-4">Regenerating playlists...</p>
      </div>
    `
    }

    setupDragAndDrop() {
        const containers = this.container?.querySelectorAll('.tracks-list')
        if (!containers || containers.length === 0) return

        containers.forEach(container => {
            new Sortable(container, {
                group: 'shared-tracks',
                animation: 150,
                ghostClass: 'sortable-ghost',
                chosenClass: 'sortable-chosen',
                onStart: () => {
                    this.isDragging = true
                },
                onEnd: (evt) => {
                    this.isDragging = false

                    const fromPlaylistIndex = parseInt(evt.from.dataset.playlistIndex)
                    const toPlaylistIndex = parseInt(evt.to.dataset.playlistIndex)
                    const oldIndex = evt.oldIndex
                    const newIndex = evt.newIndex

                    playlistsStore.moveTrack(fromPlaylistIndex, toPlaylistIndex, oldIndex, newIndex)
                }
            })
        })
    }

    attachExportListeners() {
        const jsonBtn = this.$('#exportJsonBtn')
        if (jsonBtn) {
            jsonBtn.addEventListener('click', () => handleExportJsonFn())
        }

        const appleBtn = this.$('#exportAppleMusicBtn')
        if (appleBtn) {
            appleBtn.addEventListener('click', () => handleExportToAppleMusicFn({ btn: appleBtn }))
        }
    }

    update() {
        const state = playlistsStore.getState()
        const playlists = state.playlists

        // Update playlists grid
        const grid = this.$('#playlistsGrid')
        if (grid) {
            grid.innerHTML = this.renderPlaylists(playlists)
            this.setupDragAndDrop()
        }

        // Update export section
        const exportSection = this.$('#exportSection')
        if (exportSection) {
            exportSection.innerHTML = playlists.length > 0 ? this.renderExportSection() : ''
            this.attachExportListeners()
        }
    }

    calculateDuration(tracks) {
        const totalSeconds = tracks.reduce((sum, t) => sum + (t.duration || 0), 0)
        const mins = Math.floor(totalSeconds / 60)
        const secs = totalSeconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    escapeHtml(text) {
        if (!text) return ''
        const div = document.createElement('div')
        div.textContent = text
        return div.innerHTML
    }

    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe()
        }
        super.destroy()
    }
}
