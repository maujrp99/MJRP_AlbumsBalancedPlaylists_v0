/**
 * SavedPlaylistsView
 *
 * The saved playlists screen: series, each with its batches of playlists.
 * The list is read by SavedPlaylistsReader (F61): this view draws what the list holds now and
 * draws again when the list says it changed. It waits for no read.
 *
 * @module views/SavedPlaylistsView
 */

import { BaseView } from './BaseView.js'
import { router } from '../router.js'
import { Breadcrumb } from '../components/Breadcrumb.js'
import { getIcon } from '../components/Icons.js'
import { SavedPlaylistsController } from '../components/playlists/SavedPlaylistsController.js'
import { SafeDOM } from '../utils/SafeDOM.js'
import { dialogService } from '../services/DialogService.js'
import { PlaylistDetailsModal } from '../components/playlists/PlaylistDetailsModal.js'
import { SavedSeriesGroup } from '../components/playlists/SavedSeriesGroup.js'
import FilterToolbar from '../components/ui/FilterToolbar.js'
import { SavedPlaylistsFilterService } from '../services/SavedPlaylistsFilterService.js'
import { ListStatus } from '../models/savedPlaylists.js'
import { isPhone, onPhoneChange } from '../utils/isPhone.js'
import { filterUseOf } from '../models/filterUse.js'
import { track } from '../services/usage/track.js'

/** What a series group shows: when none of it changed, the group on screen is kept as it is. */
const shownOf = (group) => ({
    name: group.series.name,
    status: group.status,
    error: group.error,
    batches: group.batches,
    thumbnails: group.thumbnails
})
const sameShown = (a, b) => Object.keys(a).every(key => a[key] === b[key])

export class SavedPlaylistsView extends BaseView {
    constructor() {
        super()
        this.controller = new SavedPlaylistsController(this)
        this.groupNodes = new Map() // seriesId -> { shown, node }
        this.openSeries = new Set() // the phone: the series opened (closed by default, F76)
        this.filterState = {
            search: '',
            seriesId: 'all',
            batchName: 'all',
            sort: 'updated_desc'
        }
    }

    /**
     * The page is already drawn (the router calls render first). Listen to the list and ask for
     * it: nothing here waits for the read, each series shows when its own answer arrives.
     */
    async mount() {
        this.container = document.getElementById('app')
        this.subscriptions.push(this.controller.subscribe(() => this.update()))
        // The phone draws a series closed with a row to open it; the computer draws it open
        this.drawnForPhone = isPhone()
        this.subscriptions.push(onPhoneChange((phone) => this.redrawGroups(phone)))
        this.controller.open()
        this.update()
    }

    /**
     * The page is drawn once; after that only the list changes and the toolbar is brought up to
     * date. Redrawing the whole page on every change replaced the search field at each letter and
     * took the cursor away (UAT-179).
     */
    update() {
        if (!this.container) return

        const drawn = this.mainContent && this.container.contains(this.mainContent)
        if (!drawn) {
            SafeDOM.clear(this.container)
            this.container.appendChild(this.render())
            return
        }
        this.toolbar.update(this.toolbarProps())
        this.refreshContent()
    }

    /**
     * Bring the list on screen in line with the list read so far. A series group is drawn again
     * only when what it shows changed, so the groups on screen do not move or close while the
     * others arrive.
     */
    refreshContent() {
        const list = this.controller.getList()
        const visible = this.visibleGroups(list.groups)

        this.replaceChildren(this.statusNode, this.renderStatus(list))
        this.syncGroups(visible)
        this.replaceChildren(this.placeholderNode, this.renderPlaceholder(list, visible))
    }

    destroy() {
        this.container = null // a late update must not draw this page over another one
        this.mainContent = null
        this.toolbar = null
        this.groupNodes.clear()
        super.destroy() // stops listening to the list
    }

    render() {
        const header = SafeDOM.fragment([
            SafeDOM.header({ className: 'view-header mb-8 fade-in' }, [
                SafeDOM.fromHTML(Breadcrumb.render('/saved-playlists')),

                SafeDOM.div({ className: 'header-content mt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6' }, [
                    SafeDOM.h1({ className: 'text-2xl md:text-4xl font-bold flex items-center gap-3' }, [
                        SafeDOM.fromHTML(getIcon('History', 'w-8 h-8')),
                        ' Your Playlists Series'
                    ])
                ])
            ])
        ]);

        const toolbar = this.renderToolbar();

        this.statusNode = SafeDOM.div({ className: 'saved-playlists-status' })
        this.groupsNode = SafeDOM.div({ className: 'series-groups space-y-8' })
        this.placeholderNode = SafeDOM.div({ className: 'saved-playlists-placeholder' })
        this.groupNodes.clear()

        this.mainContent = SafeDOM.div({
            id: 'mainContent',
            className: 'fade-in',
            style: { animationDelay: '0.1s' }
        }, [this.statusNode, this.groupsNode, this.placeholderNode])
        this.refreshContent()

        const modalsContainer = SafeDOM.div({ id: 'modalsContainer' })

        return SafeDOM.div({ className: 'saved-playlists-view container' }, [
            header,
            toolbar,
            this.mainContent,
            modalsContainer
        ])
    }

    /** The groups the filters let through, in the order the sort asks for. */
    visibleGroups(groups) {
        const flat = groups.map(group => ({ ...group.series, batches: group.batches, _group: group }))
        return SavedPlaylistsFilterService.filterSeries(flat, this.filterState).map(item => item._group)
    }

    /** Put the groups on screen in order, keeping the node of every group that did not change. */
    syncGroups(groups) {
        const wanted = new Set(groups.map(group => group.seriesId))
        Array.from(this.groupNodes.keys()).filter(id => !wanted.has(id)).forEach(id => {
            this.groupNodes.get(id).node.remove()
            this.groupNodes.delete(id)
        })

        groups.forEach((group, index) => {
            const node = this.groupNodeOf(group)
            const inPlace = this.groupsNode.children[index]
            if (inPlace !== node) this.groupsNode.insertBefore(node, inPlace || null)
        })
    }

    /** The node of a group: the one on screen when what it shows is the same, a new one otherwise. */
    groupNodeOf(group) {
        const shown = shownOf(group)
        const drawn = this.groupNodes.get(group.seriesId)
        if (drawn && sameShown(drawn.shown, shown)) return drawn.node

        const node = this.renderSeriesGroup(group)
        if (drawn) drawn.node.remove()
        this.groupNodes.set(group.seriesId, { shown, node })
        return node
    }

    /** Every series drawn again when the screen became a phone, or stopped being one. */
    redrawGroups(phone) {
        if (!this.groupsNode || phone === this.drawnForPhone) return
        this.drawnForPhone = phone
        this.groupNodes.forEach(({ node }) => node?.remove())
        this.groupNodes.clear()
        this.refreshContent()
    }

    replaceChildren(parent, child) {
        SafeDOM.clear(parent)
        if (child) parent.appendChild(child)
    }

    renderSeriesGroup(group) {
        const component = new SavedSeriesGroup({
            group,
            open: this.openSeries.has(group.seriesId),
            onToggle: (sid, open) => (open ? this.openSeries.add(sid) : this.openSeries.delete(sid)),
            handlers: {
                onNavigate: () => this.controller.navigateBlend(),
                onOpenSeries: (sid) => this.controller.openSeriesManager(sid),
                onDeleteAll: (sid, name) => this.handleDeleteAll(sid, name),
                onEditBatch: (sid, name, date) => this.controller.editBatch(sid, name, date),
                onDeleteBatch: (sid, name, count) => this.handleDeleteBatch(sid, name, count),
                onOpenPlaylist: (sid, pid) => this.openPlaylistModal(sid, pid),
                onRetry: (sid) => this.controller.retrySeries(sid)
            }
        });
        return component.render();
    }

    /** What the toolbar shows now: built again on each update, the toolbar itself is kept. */
    toolbarProps() {
        const flatData = this.controller.getList().groups.map(g => ({
            ...g.series,
            batches: g.batches
        }))

        const { seriesOptions, batchOptions } = SavedPlaylistsFilterService.getDropdownOptions(flatData)

        return {
            searchQuery: this.filterState.search,
            onSearch: (val) => this.handleFilterChange('search', val),

            sortOptions: [
                { value: 'updated_desc', label: 'Recently Updated' },
                { value: 'name_asc', label: 'Name (A-Z)' },
                { value: 'name_desc', label: 'Name (Z-A)' }
            ],
            currentSort: this.filterState.sort,
            onSort: (val) => this.handleFilterChange('sort', val),

            // The phone: the search and a «Filters (n)» button; the rest in a sheet, as on Albums
            // (F76 polish, recheck N5). The computer's bar is not touched.
            filtersInSheet: true,
            sheetText: { reload: 'Read the saved playlists again', done: 'Show series' },

            filterGroups: [
                {
                    id: 'series',
                    title: 'Album series',
                    label: 'All Albums Series',
                    value: this.filterState.seriesId,
                    options: seriesOptions,
                    onChange: (val) => this.handleFilterChange('seriesId', val),
                    icon: 'Layers'
                },
                {
                    id: 'batch',
                    title: 'Batch',
                    label: 'All Playlist Series',
                    value: this.filterState.batchName,
                    options: batchOptions,
                    onChange: (val) => this.handleFilterChange('batchName', val),
                    icon: 'Grid'
                }
            ],

            onRefresh: () => this.controller.reload()
        }
    }

    renderToolbar() {
        const container = document.createElement('div')
        this.toolbar = new FilterToolbar({ container, props: this.toolbarProps() })
        this.toolbar.render()
        return container
    }

    handleFilterChange(key, value) {
        // F77: the filters of this screen live here, not in a controller: measured where they change
        const use = filterUseOf('saved_playlists', key, value, this.filterState[key])
        if (use) track('filter_used', use)
        this.filterState[key] = value
        this.update()
    }

    /**
     * The line above the list: what is being read, or that the list could not be read.
     * Nothing when the list is whole and up to date.
     */
    renderStatus(list) {
        if (list.status === ListStatus.FAILED) return this.renderListFailure(list)
        const firstLoad = this.controller.isFirstLoad()
        if (!firstLoad && !list.busy) return null

        const { total, settled, loading } = list.summary
        let text = 'Updating...'
        if (firstLoad) text = 'Reading your series...'
        else if (loading > 0) text = `Reading playlists: ${settled} of ${total} series`

        return SafeDOM.div({ className: 'loading-state flex items-center gap-3 text-sm text-muted py-3', role: 'status' }, [
            SafeDOM.div({ className: 'loading-spinner w-4 h-4 border-2 border-accent-primary border-t-transparent rounded-full animate-spin' }),
            SafeDOM.span({}, text)
        ])
    }

    renderListFailure(list) {
        const text = list.groups.length > 0
            ? 'The list could not be updated. What you see may be out of date.'
            : 'Your series could not be read.'
        return SafeDOM.div({ className: 'list-failed flex items-center gap-3 text-red-400 py-3', role: 'alert' }, [
            SafeDOM.span({}, text),
            SafeDOM.button({ className: 'btn btn-secondary btn-sm', onClick: () => this.controller.reload() }, 'Try again')
        ])
    }

    /** What stands in the place of the list when no series is on it. */
    renderPlaceholder(list, visible) {
        if (visible.length > 0) return null
        if (list.groups.length > 0) {
            return SafeDOM.div({ className: 'text-center py-12 opacity-50' }, 'No matches found.')
        }
        const settled = list.status === ListStatus.READY && list.summary.loading === 0
        return settled ? this.renderEmptyState() : null
    }

    renderEmptyState() {
        return SafeDOM.div({ className: 'empty-state text-center py-12 opacity-50' }, [
            SafeDOM.div({ className: 'mb-4 opacity-50' }, [SafeDOM.fromHTML(getIcon('List', 'w-16 h-16 mx-auto'))]),
            SafeDOM.h3({ className: 'text-xl font-bold mb-2' }, 'No Playlists Found'),
            SafeDOM.p({}, 'Generate and save playlists in your series to see them here.'),
            SafeDOM.button({
                className: 'btn btn-primary mt-4',
                onClick: () => router.navigate('/start')
            }, 'Create Series')
        ])
    }

    // The deletes change the list, and the list tells this screen: nothing is drawn again from here.

    async handleDeleteBatch(seriesId, batchName, count) {
        const confirmed = await dialogService.confirm({
            title: 'Delete Batch?',
            message: `Are you sure you want to delete batch "${batchName}"? Contains ${count} playlists.`,
            confirmText: 'Delete Batch',
            variant: 'danger'
        })

        if (confirmed) await this.controller.deleteBatch(seriesId, batchName)
    }

    async handleDeleteAll(seriesId, seriesName) {
        const confirmed = await dialogService.confirm({
            title: 'Delete All Playlists?',
            message: `This will permanently delete all playlists in "${seriesName}". The series and its albums will remain.`,
            confirmText: 'Delete All Playlists',
            variant: 'danger'
        })

        if (confirmed) await this.controller.deleteAllPlaylists(seriesId, seriesName)
    }

    openPlaylistModal(seriesId, playlistId) {
        const playlist = this.controller.findPlaylist(seriesId, playlistId)
        if (playlist) PlaylistDetailsModal.open(playlist)
    }
}
