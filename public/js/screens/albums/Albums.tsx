/**
 * The albums screen (/albums and /albums/:seriesId) in React (F83 wave 5a; the old SeriesView and the pieces under it). One screen: with no
 * series in the address it shows all of them (each a group), with one it shows that series; choosing a series in the filter changes the scope
 * without leaving the screen.
 *
 * The state, the filters, the order, the pages and the load are the controller's (controllers/SeriesController.js, one for the whole
 * session, kept in JavaScript); it tells this screen «draw again» through the bridge (AlbumsBridge) and the screen reads the controller and
 * the stores at the moment it draws. Like the hand-made screen, the albums under the bar are made anew at each notice (the list is one box
 * with a new `key` each time: the focus on a card goes back to the page, the covers are asked again), while the bar and the pagers are
 * kept and written in place. The windows that stay hand-made (edit and delete a series, the album, the inventory, the ranking) are
 * called as before, behind react-bridge/legacy/.
 */
import { useCallback, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { t } from '../../i18n/t.js'
import { decodeEntities } from '../../models/text.js'
import { listArtists } from '../../models/seriesFilter.js'
import { SERIES_ALBUM_LIMIT } from '../../models/seriesExpansion.js'
import { ListState } from '../../models/albumsListState.js'
import { albumSeriesStore } from '../../stores/albumSeries.js'
import { useAlbumWindows } from './useAlbumWindows'
import { navigate } from '../../react-bridge/navigation'
import { useFocusLikeAfterAnewDraw } from '../../react-bridge/useFocusLikeAfterAnewDraw'
import { useLocale } from '../../react-bridge/useLocale'
import { usePhone } from '../../react-bridge/usePhone'
import { FilterToolbar, type FilterGroupProps, type FilterToolbarProps } from '../../ui/FilterToolbar'
import { Icon } from '../../ui/Icon'
import { Header } from './Header'
import { Pager } from './Pager'
import { usePhoneSheets } from './PhoneSheets'
import { SeriesGroups } from './SeriesGroups'
import { LoadingReserve, LoadingSlot } from './SeriesLoading'
import { runAlbumAction } from './albumActions'
import type { AlbumAction } from './AlbumCard'
import type { AlbumsBridge } from './AlbumsBridge'
import type { Album, AlbumsController, ScreenState } from './types'

/** The scope the address asked for when the screen opened (the hand-made screen kept it for the Refresh button and for a series deleted). */
export interface AlbumsRoute {
    scope: 'ALL' | 'SINGLE'
    seriesId: string | null
}

interface Props {
    controller: AlbumsController
    bridge: AlbumsBridge
    route: AlbumsRoute
}

/** What stays as it is when a notice comes: the bar and the pagers are written in place. */
const KEPT = '#series-toolbar-mount, #series-pager-top-mount, #series-pager-mount'

const YEARS = ['1960s', '1970s', '1980s', '1990s']

function toolbarOf(controller: AlbumsController, state: ScreenState, route: AlbumsRoute): FilterToolbarProps {
    const activeSeries = albumSeriesStore.getActiveSeries()
    const allSeries = albumSeriesStore.getSeries()
    const filters = state.filters
    const labelOf = (name: string) => decodeEntities(name)
    const group = (id: string, title: string, label: string, value: string, options: FilterGroupProps['options'], onChange: (value: string) => void, icon: string): FilterGroupProps => ({ id, title, label, value, options, onChange, icon })
    return {
        searchQuery: state.searchQuery,
        onSearch: (query) => controller.handleSearch(query),
        sortOptions: ['countAsc', 'countDesc', 'alpha', 'alphaDesc', 'recentDesc', 'recentAsc'].map(key => ({
            value: key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`),
            label: t(`albums.sort.${key}`)
        })),
        currentSort: state.seriesSortMode,
        onSort: (key) => controller.handleSort(key),
        filterGroups: [
            group('series', t('albums.filter.series'), t('albums.filter.allSeries'), state.currentScope === 'ALL' ? 'all' : (activeSeries ? activeSeries.id : 'all'),
                allSeries.map((series: { id: string; name: string }) => ({ value: series.id, label: labelOf(series.name) })),
                (value) => { void controller.loadScope(value === 'all' ? 'ALL' : 'SINGLE', value === 'all' ? null : value, false) }, 'Layers'),
            group('artist', t('albums.filter.artist'), t('albums.filter.allArtists'), filters.artist || 'all',
                (listArtists(allSeries) as string[]).map(artist => ({ value: artist, label: artist })), (value) => controller.handleFilterChange('artist', value), 'Mic'),
            group('year', t('albums.filter.year'), t('albums.filter.allYears'), filters.year || 'all',
                [{ value: 'all', label: t('albums.filter.allYears') }, ...YEARS.map(year => ({ value: year, label: year })), { value: '2000s', label: t('albums.filter.yearLast') }],
                (value) => controller.handleFilterChange('year', value), 'Calendar'),
            group('source', t('albums.filter.source'), t('albums.filter.allSources'), filters.source || 'all',
                [
                    { value: 'all', label: t('albums.filter.allSources') },
                    { value: 'user', label: t('albums.filter.sourceUser') },
                    { value: 'pending', label: t('albums.filter.sourcePending') },
                    { value: 'acclaim', label: t('albums.filter.sourceAcclaim') },
                    { value: 'popularity', label: t('albums.filter.sourcePopularity') },
                    { value: 'ai', label: t('albums.filter.sourceAi') }
                ], (value) => controller.handleFilterChange('source', value), 'Database')
        ],
        viewMode: state.viewMode,
        onToggleView: () => controller.handleViewModeChange(state.viewMode === 'compact' ? 'expanded' : 'compact'),
        // the hand-made screen reloaded the scope the address asked for when it opened, not the one chosen since (kept as it was)
        onRefresh: () => { void controller.loadScope(route.scope, route.seriesId, true) },
        filtersInSheet: true,
        sheetText: { reload: t('albums.filter.reload'), done: t('albums.filter.done') }
    }
}

function EmptyState() {
    return (
        <div className="empty-state text-center py-16 glass-panel animate-fade-in-delayed">
            <div className="text-6xl mb-6 opacity-30"><Icon name="Music" className="w-24 h-24 mx-auto" /></div>
            <h2 className="text-2xl font-bold mb-2">{t('albums.empty.title')}</h2>
            <p className="text-muted mb-8">{t('albums.empty.about')}</p>
            <button type="button" className="btn btn-primary" onClick={() => { window.location.href = '/start' }}>
                <Icon name="ArrowLeft" className="w-4 h-4 mr-2" />{` ${t('albums.empty.cta')}`}
            </button>
        </div>
    )
}

/** The empty state: no series on the page and no albums, and no load going on. */
const emptyStateShows = (totalSeries: number, albumCount: number, isLoading: boolean): boolean => (totalSeries > 0 ? 1 : albumCount) === 0 && !isLoading

export function Albums({ controller, bridge, route }: Props) {
    const purposeFocus = useRef<HTMLElement | null>(null)
    const notices = useSyncExternalStore(bridge.subscribe, bridge.getVersion)
    // the hand-made screen let the focus go when the controller gave a notice (it drew anew), not when a sheet closed and gave it back
    useFocusLikeAfterAnewDraw({ keep: (held) => held === purposeFocus.current || held.closest(KEPT) !== null, after: notices })
    useLocale()
    const phone = usePhone()
    const sheets = usePhoneSheets()
    const windows = useAlbumWindows({
        onSeriesUpdated: () => controller.requestLoad(false),
        onSeriesDeleted: (seriesId) => { if (route.seriesId === seriesId) navigate('/albums') }
    })
    const openedAt = useState(() => new Date().toLocaleTimeString())[0]
    const wantFocus = useRef<{ seriesId: string; index: number } | null>(null)

    const state = controller.getState()
    const pageView = controller.getPageView()
    const header = controller.getHeaderData()
    const paging = pageView.paging
    const seriesList = pageView.groups.map(group => group.series)

    // «Load N more albums» opened a series whole: the focus goes to the first album that arrived, once the list is drawn
    useLayoutEffect(() => {
        const request = wantFocus.current
        if (!request) return
        wantFocus.current = null
        const group = Array.from(document.querySelectorAll<HTMLElement>('#series-grid-inner .series-group')).find(element => element.dataset.seriesId === request.seriesId)
        const card = group?.querySelector('.albums-grid')?.children[request.index] as HTMLElement | undefined
        if (!card) return
        card.setAttribute('tabindex', '-1')
        card.focus()
        purposeFocus.current = card
    })

    const act = useCallback((action: AlbumAction, album: Album, groupSeriesId: string | null = null) => {
        void runAlbumAction({ controller, openAlbumSheet: sheets.openAlbum, openRank: windows.openRank }, action, album.id, groupSeriesId)
    }, [controller, sheets.openAlbum, windows.openRank])

    const openSeriesSheet = (seriesId: string, albumCount: number) => {
        const series = albumSeriesStore.getById(seriesId)
        sheets.openSeries(decodeEntities(series?.name) || undefined, albumCount, { onEdit: () => windows.openEdit(seriesId), onDelete: () => { void windows.openDelete(seriesId) } })
    }

    const onMore = useCallback(() => controller.handleShowMore(), [controller])
    const pagerProps = {
        paging,
        phone,
        onPage: (page: number) => { controller.handlePage(page); window.scrollTo({ top: 0 }) },
        onSize: (size: number) => controller.handlePageSize(size),
        onMode: (mode: string) => controller.handlePagingMode(mode),
        onMore
    }
    // F79: while the first read of the series is out and none is known the list area says it is loading, never «No albums in library»
    const waiting = controller.getListState() === ListState.LOADING
    const showEmpty = !waiting && emptyStateShows(paging.totalSeries, bridge.albums.length, bridge.isLoading)

    return (
        <div className="albums-view container">
            <header className="view-header mb-8 fade-in">
                <div id="series-header-mount">
                    <Header
                        title={header.title}
                        seriesId={header.activeSeriesId}
                        onNavigate={navigate}
                        onBlend={() => {
                            const seriesId = controller.getState().targetSeriesId || albumSeriesStore.getActiveSeries()?.id
                            navigate(seriesId ? `/blend?seriesId=${encodeURIComponent(seriesId)}` : '/blend')
                        }}
                        onMore={(seriesId) => openSeriesSheet(seriesId, Number.NaN)}
                    />
                </div>
                <div id="series-toolbar-mount"><FilterToolbar {...toolbarOf(controller, state, route)} /></div>
            </header>
            <div id="series-pager-top-mount"><Pager {...pagerProps} place="top" /></div>
            <div id="series-grid-mount" className={waiting ? 'relative' : undefined} style={waiting ? { visibility: 'hidden' } : undefined}>
                {waiting ? <LoadingSlot phone={phone} /> : null}
                <div id="series-grid-inner" className="pb-8" key={notices}>
                    <SeriesGroups
                        albums={bridge.albums}
                        seriesList={seriesList}
                        scope={state.currentScope}
                        layout={state.viewMode === 'compact' ? 'grid' : 'list'}
                        context={{ searchQuery: state.searchQuery || '', filters: state.filters || {} }}
                        isLoading={bridge.isLoading}
                        seriesStates={controller.getSeriesStates()}
                        expandedSeriesIds={bridge.expansion.list()}
                        phone={phone}
                        act={act}
                        actions={{
                            retry: (seriesId) => controller.retrySeries(seriesId),
                            loadMore: (seriesId) => {
                                bridge.expansion.expand(seriesId)
                                controller.refresh()
                                wantFocus.current = { seriesId, index: SERIES_ALBUM_LIMIT }
                            },
                            edit: (seriesId) => windows.openEdit(seriesId),
                            remove: (seriesId) => { void windows.openDelete(seriesId) },
                            more: openSeriesSheet
                        }}
                    />
                </div>
            </div>
            <div id="series-pager-mount"><Pager {...pagerProps} /></div>
            <div id="emptyStateContainer">{waiting ? <LoadingReserve phone={phone} /> : showEmpty ? <EmptyState /> : null}</div>
            <footer className="view-footer mt-12 text-center text-muted text-sm border-t border-white/5 pt-6">
                <p className="last-update">{t('albums.footer.lastUpdated', { time: openedAt })}</p>
            </footer>
            <div id="series-modals-mount">{windows.layer}</div>
            {sheets.layer}
        </div>
    )
}
