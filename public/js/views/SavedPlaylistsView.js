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

        // Cascade
        // Use renderNode (we updated AlbumCascade to support it)
        const cascadeNode = AlbumCascade.renderNode(thumbnails)

        // Info Block
        const infoBlock = SafeDOM.div({}, [
            SafeDOM.h3({ className: 'font-bold text-xl text-white tracking-tight' }, batchName),
            SafeDOM.div({ className: 'flex items-center gap-3 text-sm text-muted mt-1' }, [
                SafeDOM.span({ className: 'flex items-center gap-1' }, [SafeDOM.fromHTML(getIcon('List', 'w-3 h-3')), ` ${playlistCount} playlists`]),
                SafeDOM.span({ className: 'flex items-center gap-1' }, [SafeDOM.fromHTML(getIcon('Music', 'w-3 h-3')), ` ${totalTracks} tracks`]),
                SafeDOM.span({ className: 'flex items-center gap-1' }, [SafeDOM.fromHTML(getIcon('Disc', 'w-3 h-3')), ` ${albumCount} albums`]),
                SafeDOM.span({ className: 'flex items-center gap-1 font-mono' }, [SafeDOM.fromHTML(getIcon('Clock', 'w-3 h-3')), ` ${totalDuration}`]),
                SafeDOM.span({ className: 'flex items-center gap-1' }, [SafeDOM.fromHTML(getIcon('Calendar', 'w-3 h-3')), ` ${dateStr}`])
            ])
        ])

        // Buttons
        const buttons = SafeDOM.div({ className: 'batch-card-buttons flex items-center gap-2' }, [
            SafeDOM.button({
                className: 'btn btn-secondary btn-sm flex items-center gap-2 hover:bg-white/20 transition-all shadow-md',
                title: 'Edit this batch',
                onClick: (e) => {
                    e.stopPropagation()
                    this.controller.editBatch(seriesId, batchName, createdAt)
                }
            }, [SafeDOM.fromHTML(getIcon('Edit', 'w-4 h-4')), ' Edit Batch']),
            SafeDOM.button({
                className: 'btn btn-ghost btn-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors',
                title: 'Delete entire batch',
                onClick: (e) => {
                    e.stopPropagation()
                    this.handleDeleteBatch(seriesId, batchName, playlistCount)
                }
            }, SafeDOM.fromHTML(getIcon('Trash', 'w-4 h-4')))
        ])

        // Collapse logic
        const playlistsContainer = SafeDOM.div({ className: 'batch-playlists divide-y divide-white/5 bg-black/20 hidden' })
        const iconSpan = SafeDOM.span({ className: 'collapse-icon text-muted transition-transform duration-200' })
        iconSpan.appendChild(SafeDOM.fromHTML(getIcon('ChevronRight', 'w-5 h-5')))

        const toggleCollapse = () => {
            const isHidden = playlistsContainer.classList.contains('hidden')
            if (isHidden) {
                playlistsContainer.classList.remove('hidden')
                iconSpan.style.transform = 'rotate(90deg)'
                card.dataset.collapsed = 'false'
            } else {
                playlistsContainer.classList.add('hidden')
                iconSpan.style.transform = 'rotate(0deg)'
                card.dataset.collapsed = 'true'
            }
        }

        const batchHeader = SafeDOM.div({
            className: 'batch-header p-5 bg-gradient-to-r from-white/5 to-transparent border-b border-white/10 cursor-pointer',
            onClick: toggleCollapse
        }, [
            SafeDOM.div({ className: 'flex items-center justify-between' }, [
                SafeDOM.div({ className: 'flex items-center gap-4' }, [
                    iconSpan,
                    cascadeNode,
                    infoBlock
                ]),
                buttons
            ])
        ])

        // Playlists Rows
        if (playlists.length > 0) {
            playlists.forEach((p, idx) => {
                playlistsContainer.appendChild(this.renderPlaylistRow(seriesId, p, idx))
            })
        } else {
            playlistsContainer.appendChild(SafeDOM.div({
                className: 'p-6 text-center text-muted italic'
            }, 'No playlists in this batch'))
        }

        const card = SafeDOM.div({
            className: 'batch-group-card bg-surface rounded-xl border border-white/10 overflow-hidden mb-6 transition-all duration-300 hover:border-brand-orange/30',
            dataset: { seriesId, batchName, collapsed: 'true' }
        }, [batchHeader, playlistsContainer])

        return card
    }

    renderPlaylistRow(seriesId, playlist, index) {
        const trackCount = playlist.tracks?.length || 0
        const duration = this.formatDuration(playlist.tracks || [])

        // Row Content
        const icon = SafeDOM.div({ className: 'w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-muted group-hover:text-brand-orange group-hover:bg-brand-orange/10 transition-colors' })
        icon.appendChild(SafeDOM.fromHTML(getIcon('Disc', 'w-4 h-4')))

        const info = SafeDOM.div({}, [
            SafeDOM.div({ className: 'font-medium text-white group-hover:text-brand-orange transition-colors' }, playlist.name),
            SafeDOM.div({ className: 'text-xs text-muted font-mono mt-0.5' }, `${trackCount} tracks • ${duration}`)
        ])

        const expandIcon = SafeDOM.span({ className: 'expand-icon text-muted transition-transform duration-200' })
        expandIcon.appendChild(SafeDOM.fromHTML(getIcon('ChevronRight', 'w-4 h-4')))

        const leftSide = SafeDOM.div({ className: 'flex items-center gap-4' }, [
            expandIcon,
            icon,
            info
        ])

        const viewBtn = SafeDOM.button({
            className: 'btn btn-ghost btn-sm text-muted hover:text-white',
            title: 'View Details',
            onClick: (e) => {
                e.stopPropagation()
                this.openPlaylistModal(seriesId, playlist.id)
            }
        }, SafeDOM.fromHTML(getIcon('Eye', 'w-4 h-4')))

        const buttons = SafeDOM.div({ className: 'playlist-row-buttons flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200' }, [viewBtn])

        // Tracks List
        const tracksList = SafeDOM.div({ className: 'playlist-tracks-list hidden bg-black/30 pl-16 pr-4 py-2' })

        // Lazy render tracks logic could be added here, but for now we render immediately
        if (playlist.tracks && playlist.tracks.length > 0) {
            playlist.tracks.forEach((t, i) => {
                // TrackRow.render returns a Node
                const row = TrackRow.render({
                    track: t,
                    index: i + 1,
                    variant: 'detailed',
                    playlistIndex: -1,
                    trackIndex: i
                })
                tracksList.appendChild(row)
            })
        } else {
            tracksList.appendChild(SafeDOM.div({ className: 'text-sm text-muted italic py-2' }, 'No tracks'))
        }

        const toggleTracks = () => {
            const isHidden = tracksList.classList.contains('hidden')
            if (isHidden) {
                tracksList.classList.remove('hidden')
                expandIcon.style.transform = 'rotate(90deg)'
            } else {
                tracksList.classList.add('hidden')
                expandIcon.style.transform = 'rotate(0deg)'
            }
        }

        const row = SafeDOM.div({
            className: 'playlist-row p-4 flex items-center justify-between hover:bg-white/5 transition-colors group cursor-pointer',
            onClick: toggleTracks,
            dataset: { playlistId: playlist.id }
        }, [leftSide, buttons])

        return SafeDOM.div({
            className: 'playlist-row-wrapper',
            dataset: { playlistIndex: index }
        }, [row, tracksList])
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
