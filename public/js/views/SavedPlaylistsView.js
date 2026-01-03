/**
 * SavedPlaylistsView
 * 
 * View for displaying saved playlists grouped by Series and Batches.
 * Refactored in Sprint 15 (ARCH-12) to use Controller-View pattern and Core Components.
 * Refactored in Sprint 16 to replace legacy modals with DialogService.
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
import { dialogService } from '../services/DialogService.js'

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
        const playlists = batch.playlists
        const batchName = batch.name
        const createdAt = batch.savedAt

        const playlistCount = playlists.length
        const totalTracks = playlists.reduce((sum, p) => sum + (p.tracks?.length || 0), 0)
        const albumCount = this.countUniqueAlbums(playlists)
        const dateStr = new Date(createdAt).toLocaleDateString()

        // Calculate total duration from all tracks
        const allTracks = playlists.map(p => p.tracks || []).flat()
        const totalDuration = this.formatDuration(allTracks)

        const playlistsHtml = playlists.map((playlist, idx) =>
            this.renderPlaylistRow(seriesId, playlist, idx)
        ).join('')

        const cascadeHtml = AlbumCascade.render(thumbnails)

        return `
            <div class="batch-group-card bg-surface rounded-xl border border-white/10 overflow-hidden mb-6 transition-all duration-300 hover:border-brand-orange/30" 
                data-series-id="${seriesId}" 
                data-batch-name="${escapeHtml(batchName)}"
                data-collapsed="true">
            
            <div class="batch-header p-5 bg-gradient-to-r from-white/5 to-transparent border-b border-white/10 cursor-pointer"
                    data-action="toggle-collapse">
                <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <span class="collapse-icon text-muted transition-transform duration-200">
                        ${getIcon('ChevronRight', 'w-5 h-5')}
                    </span>
                    ${cascadeHtml}
                    <div>
                        <h3 class="font-bold text-xl text-white tracking-tight">${escapeHtml(batchName)}</h3>
                        <div class="flex items-center gap-3 text-sm text-muted mt-1">
                        <span class="flex items-center gap-1">${getIcon('List', 'w-3 h-3')} ${playlistCount} playlists</span>
                        <span class="flex items-center gap-1">${getIcon('Music', 'w-3 h-3')} ${totalTracks} tracks</span>
                        <span class="flex items-center gap-1">${getIcon('Disc', 'w-3 h-3')} ${albumCount} albums</span>
                        <span class="flex items-center gap-1 font-mono">${getIcon('Clock', 'w-3 h-3')} ${totalDuration}</span>
                        <span class="flex items-center gap-1">${getIcon('Calendar', 'w-3 h-3')} ${dateStr}</span>
                        </div>
                    </div>
                </div>

                <div class="batch-card-buttons flex items-center gap-2">
                    <button class="btn btn-secondary btn-sm flex items-center gap-2 hover:bg-white/20 transition-all shadow-md" 
                            data-action="edit-batch" 
                            data-series-id="${seriesId}" 
                            data-batch-name="${escapeHtml(batchName)}"
                            data-saved-at="${createdAt}"
                            title="Edit this batch">
                    ${getIcon('Edit', 'w-4 h-4')} Edit Batch
                    </button>
                    <button class="btn btn-ghost btn-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors" 
                            data-action="delete-batch" 
                            data-series-id="${seriesId}" 
                            data-batch-name="${escapeHtml(batchName)}"
                            data-count="${playlistCount}"
                            title="Delete entire batch">
                    ${getIcon('Trash', 'w-4 h-4')}
                    </button>
                </div>
                </div>
            </div>

            <div class="batch-playlists divide-y divide-white/5 bg-black/20 hidden">
                ${playlistsHtml || '<div class="p-6 text-center text-muted italic">No playlists in this batch</div>'}
            </div>
            </div>
        `
    }

    renderPlaylistRow(seriesId, playlist, index) {
        const trackCount = playlist.tracks?.length || 0
        const duration = this.formatDuration(playlist.tracks || [])

        return `
        <div class="playlist-row-wrapper" data-playlist-index="${index}">
            <div class="playlist-row p-4 flex items-center justify-between hover:bg-white/5 transition-colors group cursor-pointer"
                data-action="toggle-playlist-tracks"
                data-playlist-id="${playlist.id}">
            <div class="flex items-center gap-4">
                <span class="expand-icon text-muted transition-transform duration-200">
                ${getIcon('ChevronRight', 'w-4 h-4')}
                </span>
                <div class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-muted group-hover:text-brand-orange group-hover:bg-brand-orange/10 transition-colors">
                ${getIcon('Disc', 'w-4 h-4')}
                </div>
                <div>
                <div class="font-medium text-white group-hover:text-brand-orange transition-colors">${escapeHtml(playlist.name)}</div>
                <div class="text-xs text-muted font-mono mt-0.5">${trackCount} tracks • ${duration}</div>
                </div>
            </div>
            
            <div class="playlist-row-buttons flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button class="btn btn-ghost btn-sm text-muted hover:text-white" 
                        data-action="view-playlist" 
                        data-series="${seriesId}" 
                        data-id="${playlist.id}"
                        title="View Details">
                ${getIcon('Eye', 'w-4 h-4')}
                </button>
            </div>
            </div>
            
            <div class="playlist-tracks-list hidden bg-black/30 pl-16 pr-4 py-2">
            ${this.renderTracksList(playlist.tracks)}
            </div>
        </div>
        `
    }

    renderTracksList(tracks) {
        if (!tracks || tracks.length === 0) {
            return '<div class="text-sm text-muted italic py-2">No tracks</div>'
        }

        return tracks.map((track, i) => TrackRow.renderHTML({
            track,
            index: i + 1,
            variant: 'detailed',
            playlistIndex: -1,
            trackIndex: i
        })).join('')
    }

    countUniqueAlbums(playlists) {
        const albumSet = new Set()
        playlists.forEach(playlist => {
            playlist.tracks?.forEach(track => {
                if (track.album) {
                    albumSet.add(track.album.toLowerCase())
                }
            })
        })
        return albumSet.size
    }

    formatDuration(tracks) {
        if (!tracks) return '0m'
        const seconds = tracks.reduce((acc, t) => acc + (t.duration || 0), 0)
        return Math.floor(seconds / 60) + 'm'
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

        // Modals via DialogService
        this.$delegate('[data-action="delete-all-playlists"]', 'click', (e, t) => {
            this.handleDeleteAll(t.dataset.id, t.dataset.name)
        })

        this.$delegate('[data-action="delete-batch"]', 'click', (e, t) => {
            this.handleDeleteBatch(t.dataset.seriesId, t.dataset.batchName, t.dataset.count)
        })

        this.$delegate('[data-action="view-playlist"]', 'click', (e, t) => {
            e.stopPropagation() // Prevent row toggle
            this.openPlaylistModal(t.dataset.series, t.dataset.id)
        })
    }

    async handleDeleteBatch(seriesId, batchName, count) {
        const confirmed = await dialogService.confirm({
            title: 'Delete Batch?',
            message: `Are you sure you want to delete batch "${batchName}"? Contains ${count} playlists.`,
            confirmText: 'Delete Batch',
            variant: 'danger'
        })

        if (confirmed) {
            await this.controller.deleteBatch(seriesId, batchName)
            this.update()
        }
    }

    async handleDeleteAll(seriesId, seriesName) {
        const confirmed = await dialogService.confirm({
            title: 'Delete All Playlists?',
            message: `This will permanently delete all playlists in "${seriesName}". The series and its albums will remain.`,
            confirmText: 'Delete All Playlists',
            variant: 'danger'
        })

        if (confirmed) {
            await this.controller.deleteAllPlaylists(seriesId, seriesName)
            this.update()
        }
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
        const totalSeconds = (playlist.tracks || []).reduce((acc, t) => acc + (t.duration || 0), 0)
        const durationStr = TrackRow.formatDuration(totalSeconds)

        // SafeDOM Content Construction
        const header = SafeDOM.div({ className: 'mb-4 text-xs text-muted flex gap-3 border-b border-white/10 pb-4' }, [
            SafeDOM.span({}, [SafeDOM.span({ className: 'text-white font-bold' }, trackCount), ' tracks']),
            SafeDOM.span({}, [SafeDOM.span({ className: 'text-white font-bold' }, durationStr), ' duration'])
        ])

        const listContainer = SafeDOM.div({ className: 'space-y-1' })

        // Append tracks
        const tracks = playlist.tracks || []
        tracks.forEach((t, i) => {
            const row = TrackRow.render({
                track: t,
                index: i + 1,
                variant: 'compact',
                actions: []
            })
            listContainer.appendChild(row)
        })

        const content = SafeDOM.div({}, [header, listContainer])

        // Footer
        const closeModal = () => {
            BaseModal.unmount('playlist-modal')
        }

        const manualFooter = SafeDOM.div({ className: 'flex justify-end' }, [
            SafeDOM.button({
                className: 'btn btn-secondary',
                onClick: closeModal
            }, 'Close')
        ])

        const modal = BaseModal.render({
            id: 'playlist-modal',
            title: playlist.name,
            content: content,
            footer: manualFooter,
            size: 'lg',
            onClose: closeModal
        })

        BaseModal.mount(modal)
    }

    onThumbnailLoaded(seriesId) {
        // Optional re-render logic
    }
}
