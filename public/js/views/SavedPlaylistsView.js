/**
 * SavedPlaylistsView
 * 
 * View for displaying saved playlists grouped by Series and Batches.
 * Refactored in Sprint 15 (ARCH-12) to use Controller-View pattern and Core Components.
 * Refactored in Sprint 16 to replace legacy modals with DialogService.
 * Refactored in Sprint 16 (Phase 5) to use SafeDOM and eliminate innerHTML.
 * 
 * @module views/SavedPlaylistsView
 */

import { BaseView } from './BaseView.js'
import { Breadcrumb } from '../components/Breadcrumb.js'
import { getIcon } from '../components/Icons.js'
import { SavedPlaylistsController } from '../components/playlists/SavedPlaylistsController.js'
import { AlbumCascade } from '../components/common/AlbumCascade.js'
import { BaseModal } from '../components/ui/BaseModal.js'
import { TrackRow } from '../components/ui/TrackRow.js'
import { SafeDOM } from '../utils/SafeDOM.js'
import { dialogService } from '../services/DialogService.js'
import { SavedPlaylistCard } from '../components/playlists/SavedPlaylistCard.js'

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
            SafeDOM.clear(this.container)
            this.container.appendChild(this.render())
            // No strict bindEvents needed as we use direct event handlers in SafeDOM
        }
    }

    render() {
        const header = SafeDOM.fragment([
            SafeDOM.header({ className: 'view-header mb-8 fade-in' }, [
                SafeDOM.fromHTML(Breadcrumb.render('/saved-playlists')),

                SafeDOM.div({ className: 'header-content mt-6 flex justify-between items-center mb-6' }, [
                    SafeDOM.h1({ className: 'text-4xl font-bold flex items-center gap-3' }, [
                        SafeDOM.fromHTML(getIcon('History', 'w-8 h-8')),
                        ' Your Playlists Series'
                    ])
                ])
            ])
        ]);

        const mainContent = SafeDOM.div({
            id: 'mainContent',
            className: 'fade-in',
            style: { animationDelay: '0.1s' }
        })

        if (this.isLoading) {
            mainContent.appendChild(this.renderLoading())
        } else {
            mainContent.appendChild(this.renderContent())
        }

        const modalsContainer = SafeDOM.div({ id: 'modalsContainer' })

        return SafeDOM.div({ className: 'saved-playlists-view container' }, [
            header,
            mainContent,
            modalsContainer
        ])
    }

    renderContent() {
        if (this.controller.data.length === 0) {
            return this.renderEmptyState()
        }

        const groupsContainer = SafeDOM.div({ className: 'series-groups space-y-8' })

        this.controller.data.forEach(group => {
            const groupNode = this.renderSeriesGroup(group)
            if (groupNode) {
                groupsContainer.appendChild(groupNode)
            }
        })

        return groupsContainer
    }

    renderSeriesGroup(group) {
        if (!group.playlists || group.playlists.length === 0) return null

        const headerTitle = SafeDOM.div({ className: 'mb-4 md:mb-0' }, [
            SafeDOM.h2({ className: 'text-2xl font-bold text-accent-primary flex items-center gap-2' }, [
                SafeDOM.fromHTML(getIcon('Layers', 'w-6 h-6')),
                SafeDOM.text(' ' + group.series.name)
            ]),
            SafeDOM.span({ className: 'text-xs text-muted font-mono bg-black/30 px-2 py-1 rounded ml-8' },
                `ID: ${group.series.id.slice(0, 8)}...`
            )
        ])

        const buttons = SafeDOM.div({ className: 'flex gap-2' }, [
            SafeDOM.button({
                className: 'btn btn-primary btn-sm flex items-center gap-1 group-hover:bg-accent-primary group-hover:text-white transition-colors',
                onClick: () => this.controller.navigateBlend()
            }, [
                SafeDOM.fromHTML(getIcon('Plus', 'w-4 h-4')),
                ' Add Playlists'
            ]),
            SafeDOM.button({
                className: 'btn btn-secondary btn-sm group-hover:bg-white/10 transition-colors',
                onClick: () => this.controller.openSeriesManager(group.series.id)
            }, [
                'Open Albums Series ',
                SafeDOM.fromHTML(getIcon('ArrowLeft', 'w-4 h-4 rotate-180 ml-1'))
            ]),
            SafeDOM.button({
                className: 'btn btn-ghost btn-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors',
                title: 'Delete all playlists in this series',
                onClick: () => this.handleDeleteAll(group.series.id, group.series.name)
            }, SafeDOM.fromHTML(getIcon('Trash', 'w-4 h-4')))
        ])

        const header = SafeDOM.div({
            className: 'group-header flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-white/10 pb-4'
        }, [headerTitle, buttons])

        const batchesContainer = SafeDOM.fragment(
            group.batches.map(batch => this.renderPlaylistBatch(batch, group.series.id))
        )

        return SafeDOM.div({ className: 'series-group glass-panel p-6 rounded-xl animate-scale-in' }, [
            header,
            batchesContainer
        ])
    }

    renderPlaylistBatch(batch, seriesId) {
        const thumbnails = this.controller.getThumbnails(seriesId);
        const card = new SavedPlaylistCard({
            batch,
            seriesId,
            thumbnails,
            onEdit: (sid, name, date) => this.controller.editBatch(sid, name, date),
            onDelete: (sid, name, count) => this.handleDeleteBatch(sid, name, count),
            onOpenPlaylistModal: (sid, pid) => this.openPlaylistModal(sid, pid),
            formatDuration: (tracks) => this.formatDuration(tracks),
            countUniqueAlbums: (pls) => this.countUniqueAlbums(pls)
        });
        return card.render();
    }

    // renderPlaylistRow method removed - now handled by SavedPlaylistRow component via SavedPlaylistCard

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
        return SafeDOM.div({ className: 'loading-state text-center py-12' }, [
            SafeDOM.div({ className: 'loading-spinner w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4' }),
            SafeDOM.p({ className: 'text-xl' }, 'Scanning all series for playlists...')
        ])
    }

    renderEmptyState() {
        return SafeDOM.div({ className: 'empty-state text-center py-12 opacity-50' }, [
            SafeDOM.div({ className: 'mb-4 opacity-50' }, [SafeDOM.fromHTML(getIcon('List', 'w-16 h-16 mx-auto'))]),
            SafeDOM.h3({ className: 'text-xl font-bold mb-2' }, 'No Playlists Found'),
            SafeDOM.p({}, 'Generate and save playlists in your series to see them here.'),
            SafeDOM.button({
                className: 'btn btn-primary mt-4',
                onClick: () => window.location.hash = '/home'
            }, 'Create Series')
        ])
    }

    renderErrorState() {
        // Fallback error rendering
        if (this.container) {
            SafeDOM.clear(this.container)
            const errorMsg = SafeDOM.p({ className: 'text-red-500 text-center mt-10' }, 'Failed to load data.')
            this.container.appendChild(this.render()) // Re-render shell
            const main = this.container.querySelector('#mainContent')
            if (main) {
                SafeDOM.clear(main)
                main.appendChild(errorMsg)
            }
        }
    }

    // --- Interaction ---

    // Note: bindEvents removed as we use direct SafeDOM onClick handlers

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
        // Could trigger this.update() or a targeted update
    }
}
