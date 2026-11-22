/**
 * SavedPlaylists - the saved playlists screen (/saved-playlists): series, each with its batches of playlists (F83 wave 1; it was
 * views/SavedPlaylistsView.js, with the same look and the same behaviour).
 *
 * The list is read by SavedPlaylistsReader (F61) and kept in SavedPlaylistsStore; this screen draws what the list holds now and
 * draws again when the store says it changed (`useStore`). It waits for no read: each series shows when its own answer arrives.
 * The filters of the screen live here (F77: measured where they change), not in a controller. A series group is drawn again only
 * when what it shows changed, as before (a batch the person opened stays open while other series arrive, and starts closed when
 * its own series changes).
 */
import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../ui/Icon'
import { FilterToolbar, type FilterToolbarProps } from '../../ui/FilterToolbar'
import { useLocale } from '../../react-bridge/useLocale'
import { usePhone } from '../../react-bridge/usePhone'
import { useStore } from '../../react-bridge/useStore'
import { navigate } from '../../react-bridge/navigation'
import { dialogService } from '../../ui/dialogs/dialogs'
import { SavedPlaylistsFilterService } from '../../services/SavedPlaylistsFilterService.js'
import { track } from '../../services/usage/track.js'
import { ListStatus } from '../../models/savedPlaylists.js'
import { filterUseOf } from '../../models/filterUse.js'
import { t } from '../../i18n/t.js'
import { SeriesGroup } from './SeriesGroup'
import { usePlaylistDetails } from './PlaylistDetails'
import { usePlaylistExport } from '../../ui/PlaylistExportWindow'
import * as playlistExports from '../../controllers/playlistExportEntries.js'
import { readableBatchName } from './listText'
import type { SavedPlaylistsController } from '../../controllers/SavedPlaylistsController.js'
import type { Batch, Handlers, ListView, SeriesGroupData } from './types'

interface FilterState {
    search: string
    seriesId: string
    batchName: string
    sort: string
}

const INITIAL_FILTERS: FilterState = { search: '', seriesId: 'all', batchName: 'all', sort: 'updated_desc' }

/** What a series group shows: when none of it changed, the group on screen is kept as it is. */
const shownOf = (group: SeriesGroupData) => ({
    name: group.series.name,
    status: group.status,
    error: group.error,
    batches: group.batches,
    thumbnails: group.thumbnails
})
type Shown = ReturnType<typeof shownOf>
const sameShown = (a: Shown, b: Shown) => (Object.keys(a) as (keyof Shown)[]).every(key => a[key] === b[key])

/** A number per series that goes up when what the series shows changes: the key of its group, so it is drawn anew then. */
function useGroupVersions(groups: SeriesGroupData[]): (seriesId: string) => number {
    const seen = useRef(new Map<string, { shown: Shown; version: number }>())
    groups.forEach(group => {
        const shown = shownOf(group)
        const known = seen.current.get(group.seriesId)
        if (!known) seen.current.set(group.seriesId, { shown, version: 0 })
        else if (!sameShown(known.shown, shown)) seen.current.set(group.seriesId, { shown, version: known.version + 1 })
    })
    return (seriesId) => seen.current.get(seriesId)?.version ?? 0
}

function Status({ list, firstLoad, onRetry }: { list: ListView; firstLoad: boolean; onRetry: () => void }) {
    if (list.status === ListStatus.FAILED) {
        return (
            <div className="list-failed flex items-center gap-3 text-red-400 py-3" role="alert">
                <span>{t(list.groups.length > 0 ? 'savedPlaylists.list.failedStale' : 'savedPlaylists.list.failed')}</span>
                <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>{t('savedPlaylists.tryAgain')}</button>
            </div>
        )
    }
    if (!firstLoad && !list.busy) return null
    const { total, settled, loading } = list.summary
    let text = t('savedPlaylists.status.updating')
    if (firstLoad) text = t('savedPlaylists.status.firstLoad')
    else if (loading > 0) text = t('savedPlaylists.status.reading', { settled, total })
    return (
        <div className="loading-state flex items-center gap-3 text-sm text-muted py-3" role="status">
            <div className="loading-spinner w-4 h-4 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
            <span>{text}</span>
        </div>
    )
}

/** What stands in the place of the list when no series is on it. */
function Placeholder({ list, visible }: { list: ListView; visible: number }) {
    if (visible > 0) return null
    if (list.groups.length > 0) return <div className="text-center py-12 opacity-50">{t('savedPlaylists.noMatches')}</div>
    if (list.status !== ListStatus.READY || list.summary.loading !== 0) return null
    return (
        <div className="empty-state text-center py-12 opacity-50">
            <div className="mb-4 opacity-50"><Icon name="List" className="w-16 h-16 mx-auto" /></div>
            <h3 className="text-xl font-bold mb-2">{t('savedPlaylists.empty.title')}</h3>
            <p>{t('savedPlaylists.empty.body')}</p>
            <button type="button" className="btn btn-primary mt-4" onClick={() => navigate('/start')}>{t('savedPlaylists.empty.create')}</button>
        </div>
    )
}

/** The groups the filters let through, in the order the sort asks for. */
function visibleGroups(groups: SeriesGroupData[], filters: FilterState): SeriesGroupData[] {
    const flat = groups.map(group => ({ ...group.series, batches: group.batches, _group: group }))
    return (SavedPlaylistsFilterService.filterSeries(flat, filters) as { _group: SeriesGroupData }[]).map(item => item._group)
}

/** What the toolbar shows now; the toolbar itself is kept. */
function toolbarOf(groups: SeriesGroupData[], filters: FilterState, change: (key: keyof FilterState, value: string) => void, reload: () => void): FilterToolbarProps {
    const flat = groups.map(group => ({ ...group.series, batches: group.batches }))
    const { seriesOptions, batchOptions } = SavedPlaylistsFilterService.getDropdownOptions(flat)
    return {
        searchQuery: filters.search,
        onSearch: (value) => change('search', value),
        sortOptions: [
            { value: 'updated_desc', label: t('savedPlaylists.sort.updated') },
            { value: 'name_asc', label: t('savedPlaylists.sort.nameAsc') },
            { value: 'name_desc', label: t('savedPlaylists.sort.nameDesc') }
        ],
        currentSort: filters.sort,
        onSort: (value) => change('sort', value),
        // The phone: the search and a «Filters (n)» button; the rest in a sheet, as on Albums (F76 polish, recheck N5)
        filtersInSheet: true,
        sheetText: { reload: t('savedPlaylists.filter.reload'), done: t('savedPlaylists.filter.done') },
        filterGroups: [
            {
                id: 'series', title: t('savedPlaylists.filter.seriesTitle'), label: t('savedPlaylists.filter.seriesAll'),
                value: filters.seriesId, options: seriesOptions, onChange: (value) => change('seriesId', value), icon: 'Layers'
            },
            {
                id: 'batch', title: t('savedPlaylists.filter.batchTitle'), label: t('savedPlaylists.filter.batchAll'),
                value: filters.batchName, options: batchOptions, onChange: (value) => change('batchName', value), icon: 'Grid'
            }
        ],
        onRefresh: reload
    }
}

/** What happens when the person acts on a series, a batch or a playlist; deleting asks first, and the list answers by the store. */
function handlersOf(
    controller: SavedPlaylistsController,
    openPlaylist: (seriesId: string, playlistId: string) => void,
    exportPlaylists: (seriesName: string, batch: Batch, options: { only?: number; title: string; opener?: HTMLElement | null }) => void
): Handlers {
    return {
        onNavigate: () => controller.navigateBlend(),
        onOpenSeries: (seriesId) => controller.openSeriesManager(seriesId),
        onEditBatch: (seriesId, batchName, savedAt) => { void controller.editBatch(seriesId, batchName, savedAt) },
        onRetry: (seriesId) => { void controller.retrySeries(seriesId) },
        onOpenPlaylist: openPlaylist,
        onExportBatch: (seriesName, batch, opener) => exportPlaylists(seriesName, batch, { title: t('savedPlaylists.export.title', { name: readableBatchName(batch.name).text }), opener }),
        onExportPlaylist: (seriesName, batch, playlist, index, opener) => exportPlaylists(seriesName, batch, { only: index, title: t('savedPlaylists.export.title', { name: playlist.name ?? '' }), opener }),
        onDeleteBatch: async (seriesId, batchName, count) => {
            const confirmed = await dialogService.confirm({
                title: t('savedPlaylists.deleteBatch.title'),
                message: t('savedPlaylists.deleteBatch.message', { name: batchName, count }),
                confirmText: t('savedPlaylists.deleteBatch.confirm'),
                variant: 'danger'
            })
            if (confirmed) await controller.deleteBatch(seriesId, batchName)
        },
        onDeleteAll: async (seriesId, seriesName) => {
            const confirmed = await dialogService.confirm({
                title: t('savedPlaylists.deleteAll.title'),
                message: t('savedPlaylists.deleteAll.message', { name: seriesName }),
                confirmText: t('savedPlaylists.deleteAll.confirm'),
                variant: 'danger'
            })
            if (confirmed) await controller.deleteAllPlaylists(seriesId, seriesName)
        }
    }
}

export function SavedPlaylists({ controller }: { controller: SavedPlaylistsController }) {
    useLocale() // draws again when the language changes
    const phone = usePhone()
    const { list, firstLoad } = useStore(controller.store, () => ({ list: controller.getList() as ListView, firstLoad: controller.isFirstLoad() as boolean }))
    const [filters, setFilters] = useState(INITIAL_FILTERS)
    const openSeries = useRef(new Set<string>()) // the phone: the series opened (closed by default, F76)
    const asked = useRef(false)
    const details = usePlaylistDetails()
    const exporting = usePlaylistExport({ exports: playlistExports })
    const versionOf = useGroupVersions(list.groups)

    // Ask for the list once: a load already on its way is joined, what was read before stays on screen
    useEffect(() => {
        if (asked.current) return
        asked.current = true
        void controller.open()
    }, [controller])

    // F77: the filters of this screen live here: measured where they change
    const change = (key: keyof FilterState, value: string) => {
        const use = filterUseOf('saved_playlists', key, value, filters[key]) as object | null
        if (use) track('filter_used', use)
        setFilters(previous => ({ ...previous, [key]: value }))
    }
    // F90: nothing is read or written here: the window is handed what the list already holds
    const exportPlaylists = (seriesName: string, batch: Batch, { only, title, opener }: { only?: number; title: string; opener?: HTMLElement | null }) => {
        const all = batch.playlists
        const indexes = only === undefined ? all.map((_, index) => index) : [only]
        exporting.open({ playlists: indexes.map(index => all[index]), positions: indexes.map(index => index + 1), seriesName, batchName: batch.name, title, opener })
    }
    const handlers = handlersOf(controller, (seriesId, playlistId) => details.open(controller.findPlaylist(seriesId, playlistId)), exportPlaylists)
    const toggleSeries = (seriesId: string, open: boolean) => { if (open) openSeries.current.add(seriesId); else openSeries.current.delete(seriesId) }
    const visible = visibleGroups(list.groups, filters)

    return (
        <div className="saved-playlists-view container">
            <header className="view-header mb-8 fade-in">
                <div className="header-content mt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <h1 className="text-2xl md:text-4xl font-bold flex items-center gap-3">
                        <Icon name="History" className="w-8 h-8" />{` ${t('savedPlaylists.title')}`}
                    </h1>
                </div>
            </header>
            <div><FilterToolbar {...toolbarOf(list.groups, filters, change, () => { void controller.reload() })} /></div>
            <div id="mainContent" className="fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="saved-playlists-status"><Status list={list} firstLoad={firstLoad} onRetry={() => { void controller.reload() }} /></div>
                <div className="series-groups space-y-8">
                    {visible.map(group => (
                        <SeriesGroup
                            key={`${group.seriesId}:${versionOf(group.seriesId)}`}
                            group={group}
                            phone={phone}
                            startsOpen={openSeries.current.has(group.seriesId)}
                            onToggle={toggleSeries}
                            handlers={handlers}
                        />
                    ))}
                </div>
                <div className="saved-playlists-placeholder"><Placeholder list={list} visible={visible.length} /></div>
            </div>
            <div id="modalsContainer" />
            {details.layer}
            {exporting.layer}
        </div>
    )
}
