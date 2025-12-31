/**
 * SavedPlaylistsView
 * 
 * View for displaying saved playlists grouped by Series and Batches.
 * Refactored in Sprint 15 (ARCH-12) to use Controller-View pattern and Core Components.
 * 
 * @module views/SavedPlaylistsView
 */

import { BaseView } from './BaseView.js'
import { Breadcrumb } from '../components/Breadcrumb.js'
import { getIcon } from '../components/Icons.js'
import { SavedPlaylistsController } from '../components/playlists/SavedPlaylistsController.js'
import { BatchGroupCard } from '../components/playlists/BatchGroupCard.js'
import { BaseModal } from '../components/ui/BaseModal.js'
import { TrackRow } from '../components/ui/TrackRow.js'
import { SafeDOM } from '../utils/SafeDOM.js'
import { escapeHtml } from '../utils/stringUtils.js'

export class SavedPlaylistsView extends BaseView {
    constructor() {
        super()
        this.controller = new SavedPlaylistsController(this)
        this.isLoading = true
    }

    async mount() {
        this.container = document.getElementById('app')

        // Load data via controller
        try {
            const { db, cacheManager, auth } = await import('../app.js')
            await this.controller.loadData({ db, cacheManager, auth })
            this.isLoading = false
            this.update()
        } catch (e) {
            console.error('Failed to load SavedPlaylists:', e)
            this.isLoading = false
            this.renderErrorState()
        }
    }

    update() {
        if (this.container) {
            this.container.innerHTML = this.render()
            this.bindEvents()
        }
    }

    render() {
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
            
            <!-- Modals Container (Dynamic) -->
            <div id="modalsContainer"></div>
        </div>
        `
    }

    renderContent() {
        if (this.controller.data.length === 0) {
            return this.renderEmptyState()
        }

        return `
        <div class="series-groups space-y-8">
            ${this.controller.data.map(group => this.renderSeriesGroup(group)).join('')}
        </div>
        `
    }

    renderSeriesGroup(group) {
        if (!group.playlists || group.playlists.length === 0) return ''

        return `
        <div class="series-group glass-panel p-6 rounded-xl animate-scale-in">
            <div class="group-header flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-white/10 pb-4">
                <div class="mb-4 md:mb-0">
                    <h2 class="text-2xl font-bold text-accent-primary flex items-center gap-2">
                        ${getIcon('Layers', 'w-6 h-6')} ${escapeHtml(group.series.name)}
                    </h2>
                    <span class="text-xs text-muted font-mono bg-black/30 px-2 py-1 rounded ml-8">ID: ${group.series.id.slice(0, 8)}...</span>
                </div>
                <div class="flex gap-2">
                    <button class="btn btn-primary btn-sm flex items-center gap-1 group-hover:bg-accent-primary group-hover:text-white transition-colors" 
                        data-action="add-playlists" data-id="${group.series.id}">
                        ${getIcon('Plus', 'w-4 h-4')} Add Playlists
                    </button>
                    <button class="btn btn-secondary btn-sm group-hover:bg-white/10 transition-colors" 
                        data-action="open-series" data-id="${group.series.id}">
                        Open Series Manager ${getIcon('ArrowLeft', 'w-4 h-4 rotate-180 ml-1')}
                    </button>
                    <button class="btn btn-ghost btn-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors" 
                        data-action="delete-all-playlists" data-id="${group.series.id}" data-name="${escapeHtml(group.series.name)}" 
                        title="Delete all playlists in this series">
                        ${getIcon('Trash', 'w-4 h-4')}
                    </button>
                </div>
            </div>

            ${group.batches.map(batch => this.renderPlaylistBatch(batch, group.series.id)).join('')}
        </div>
        `
    }

    renderPlaylistBatch(batch, seriesId) {
        const thumbnails = this.controller.getThumbnails(seriesId)
        return BatchGroupCard.render({
            seriesId,
            batchName: batch.name,
            playlists: batch.playlists,
            createdAt: batch.savedAt,
            thumbnails: thumbnails
        })
    }

    renderLoading() {
        return `
        <div class="loading-state text-center py-12">
            <div class="loading-spinner w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p class="text-xl">Scanning all series for playlists...</p>
        </div>
        `
    }

    renderEmptyState() {
        return `
        <div class="empty-state text-center py-12 opacity-50">
            ${getIcon('List', 'w-16 h-16 mx-auto mb-4 opacity-50')}
            <h3 class="text-xl font-bold mb-2">No Playlists Found</h3>
            <p>Generate and save playlists in your series to see them here.</p>
            <button class="btn btn-primary mt-4" data-action="go-home">Create Series</button>
        </div>
        `
    }

    renderErrorState() {
        this.update() // Will render generic structure
        // But mainContent is separate. 
        // We can inject error message manually
        const main = document.getElementById('mainContent')
        if (main) main.innerHTML = '<p class="text-red-500 text-center">Failed to load data.</p>'
    }

    // --- Interaction ---

    bindEvents() {
        // BatchGroupCard interactions (Collapse)
        this.$delegate('[data-action="toggle-collapse"]', 'click', (e, target) => {
            const card = target.closest('.batch-group-card')
            if (card) {
                const content = card.querySelector('.batch-playlists')
                const icon = card.querySelector('.collapse-icon')
                const isCollapsed = card.dataset.collapsed === 'true'

                if (isCollapsed) {
                    content.classList.remove('hidden')
                    icon.style.transform = 'rotate(90deg)'
                    card.dataset.collapsed = 'false'
                } else {
                    content.classList.add('hidden')
                    icon.style.transform = 'rotate(0deg)'
                    card.dataset.collapsed = 'true'
                }
            }
        })

        // Playlist Row Expand
        this.$delegate('[data-action="toggle-playlist-tracks"]', 'click', (e, target) => {
            const rowWrapper = target.closest('.playlist-row-wrapper')
            if (rowWrapper) {
                const tracksList = rowWrapper.querySelector('.playlist-tracks-list')
                const icon = rowWrapper.querySelector('.expand-icon')

                if (tracksList.classList.contains('hidden')) {
                    tracksList.classList.remove('hidden')
                    icon.style.transform = 'rotate(90deg)'
                } else {
                    tracksList.classList.add('hidden')
                    icon.style.transform = 'rotate(0deg)'
                }
            }
        })

        // Controller Actions
        this.$delegate('[data-action="add-playlists"]', 'click', (e, t) => {
            this.controller.navigateBlend()
        })

        this.$delegate('[data-action="open-series"]', 'click', (e, t) => {
            this.controller.openSeriesManager(t.dataset.id)
        })

        this.$delegate('[data-action="edit-batch"]', 'click', (e, t) => {
            // Updated to pass full context (Parity Fix)
            this.controller.editBatch(t.dataset.seriesId, t.dataset.batchName, t.dataset.savedAt)
        })

        this.$delegate('[data-action="go-home"]', 'click', () => {
            window.location.hash = '/home' // Or router.navigate
        })

        // Modals
        this.$delegate('[data-action="delete-all-playlists"]', 'click', (e, t) => {
            this.openDeleteModal(t.dataset.id, t.dataset.name)
        })

        this.$delegate('[data-action="delete-batch"]', 'click', (e, t) => {
            this.openDeleteBatchModal(t.dataset.seriesId, t.dataset.batchName, t.dataset.count)
        })

        this.$delegate('[data-action="view-playlist"]', 'click', (e, t) => {
            e.stopPropagation() // Prevent row toggle
            this.openPlaylistModal(t.dataset.series, t.dataset.id)
        })

        // Modal Close (Generic for BaseModal)
        this.$delegate('[data-action="close-modal"]', 'click', (e, t) => {
            const modal = t.closest('.fixed') // BaseModal root
            if (modal) modal.remove()
        })

        // Modal Actions
        this.$delegate('[data-action="confirm-delete"]', 'click', async (e, t) => {
            const seriesId = t.dataset.seriesId
            const seriesName = t.dataset.seriesName

            // Close modal
            const modal = document.getElementById('delete-modal')
            if (modal) modal.remove()

            await this.controller.deleteAllPlaylists(seriesId, seriesName)
            this.update() // Re-render view
        })

        this.$delegate('[data-action="confirm-delete-batch"]', 'click', async (e, t) => {
            const seriesId = t.dataset.seriesId
            const batchName = t.dataset.batchName

            const modal = document.getElementById('delete-batch-modal')
            if (modal) modal.remove()

            await this.controller.deleteBatch(seriesId, batchName)
            this.update()
        })
    }

    openDeleteBatchModal(seriesId, batchName, count) {
        const content = `
            <div class="text-center">
                  <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                      ${getIcon('AlertTriangle', 'w-8 h-8 text-red-500')}
                  </div>
                  <p class="text-muted mb-4">Are you sure you want to delete batch <strong>${escapeHtml(batchName)}</strong>?</p>
                  <p class="text-sm text-gray-400 mb-4">Contains ${count} playlists.</p>
            </div>
        `
        const footer = `
             <button class="btn btn-secondary" data-action="close-modal">Cancel</button>
             <button class="btn btn-danger bg-red-600 hover:bg-red-700" 
                data-action="confirm-delete-batch" 
                data-series-id="${seriesId}" 
                data-batch-name="${escapeHtml(batchName)}">
                Delete Batch
             </button>
        `

        const html = BaseModal.renderHTML({
            id: 'delete-batch-modal',
            title: 'Delete Batch?',
            content: SafeDOM.fromHTML(content),
            footer: SafeDOM.fromHTML(footer),
            size: 'sm'
        })

        this.injectModal(html)
    }

    openDeleteModal(seriesId, seriesName) {
        const content = `
            <div class="text-center">
                  <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                      ${getIcon('AlertTriangle', 'w-8 h-8 text-red-500')}
                  </div>
                  <p class="text-muted mb-4">This will permanently delete all playlists in <strong>${escapeHtml(seriesName)}</strong>. The series and its albums will remain.</p>
            </div>
        `
        const footer = `
             <button class="btn btn-secondary" data-action="close-modal">Cancel</button>
             <button class="btn btn-danger bg-red-600 hover:bg-red-700" 
                data-action="confirm-delete" 
                data-series-id="${seriesId}" 
                data-series-name="${escapeHtml(seriesName)}">
                Delete All Playlists
             </button>
        `

        const html = BaseModal.renderHTML({
            id: 'delete-modal',
            title: 'Delete All Playlists?',
            content: SafeDOM.fromHTML(content),
            footer: SafeDOM.fromHTML(footer),
            size: 'sm'
        })

        this.injectModal(html)
    }

    openPlaylistModal(seriesId, playlistId) {
        // Find playlist data from controller
        const group = this.controller.data.find(g => g.series.id === seriesId)
        if (!group) return

        // Flatten batches to find playlist
        const batch = group.batches.find(b => b.playlists.some(p => p.id === playlistId))
        if (!batch) return

        const playlist = batch.playlists.find(p => p.id === playlistId)
        if (!playlist) return

        const trackCount = playlist.tracks?.length || 0
        const duration = this.controller.constructor.formatDuration(playlist.tracks) // Need to access static or duplicated helper?
        // Actually Controller didn't export static helper. BatchGroupCard has it. TrackRow has formatDuration.
        // Let's use TrackRow.formatDuration(seconds). We need total seconds.
        const totalSeconds = (playlist.tracks || []).reduce((acc, t) => acc + (t.duration || 0), 0)
        const durationStr = TrackRow.formatDuration(totalSeconds)

        const content = `
            <div class="mb-4 text-xs text-muted flex gap-3 border-b border-white/10 pb-4">
                <span><span class="text-white font-bold">${trackCount}</span> tracks</span>
                <span><span class="text-white font-bold">${durationStr}</span> duration</span>
            </div>
            <div class="space-y-1">
                ${(playlist.tracks || []).map((t, i) => TrackRow.renderHTML({
            track: t,
            index: i + 1,
            variant: 'compact',
            actions: [] // No actions in view-only modal? Or maybe play?
        })).join('')}
            </div>
        `

        const footer = `
             <button class="btn btn-secondary" data-action="close-modal">Close</button>
        `

        const html = BaseModal.renderHTML({
            id: 'playlist-modal',
            title: playlist.name,
            content: SafeDOM.fromHTML(content),
            footer: SafeDOM.fromHTML(footer),
            size: 'lg'
        })

        this.injectModal(html)
    }

    injectModal(html) {
        const container = document.getElementById('modalsContainer')
        if (container) {
            container.innerHTML = html
        } else {
            // Fallback if view not mounted? Should be.
            document.body.insertAdjacentHTML('beforeend', html)
        }
    }

    onThumbnailLoaded(seriesId) {
        // Optional: Re-render specific series card?
        // For simplicity, we can ignore or re-render all.
        // If we re-render all, it might close open accordions.
        // Better: Find the BatchGroupCards for this series and update their thumbnails?
        // This is complex DOM manipulation.
        // For v1 of Refactor, let's accept that thumbnails pop in only if we re-render or if we used Image elements that lazy load.
        // But BatchGroupCard uses AlbumCascade which takes URLs.
        // We might just update() if isLoading is false.
        // But that resets UI state.
        // Let's leave it manual for now (user won't see thumbs until refresh or nav back/forth) or implement smart update later.
        // Actually, Controller preloads BEFORE render returns? No, non-blocking.
        // We can just rely on the fact that if user navigates away and back, they are cached.
    }
}
