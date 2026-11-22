/**
 * What stands under the filters of the albums screen (F83 wave 5a): the series, each one a group with its header, its albums and its
 * notices, in the grid or in the list; one series alone; the skeletons while a series waits; the notice and «Try again» when a series
 * did not load. The port of components/series/SeriesGridRenderer.js, views/albums/AlbumsGridRenderer.js and AlbumsScopedRenderer.js
 * (and the skeletons and the «Load N more» button).
 *
 * The hand-made grid drew a block for every series that was off screen and swapped it for the real group when it came into view; with the
 * list cut to a page (always, today) every group was drawn whole and that watcher never worked, so this does not have it.
 */
import { t, tPlural } from '../../i18n/t.js'
import { cutAlbums } from '../../models/seriesExpansion.js'
import { groupAlbumsBySeries } from '../../models/seriesGroups.js'
import { Icon } from '../../ui/Icon'
import type { ReactElement } from 'react'
import { CompactCard, ExpandedCard, PhoneRow, PhoneTile, type Act } from './AlbumCard'
import type { Album, Series, SeriesState } from './types'

export interface GroupActions {
    retry: (seriesId: string) => void
    loadMore: (seriesId: string) => void
    edit: (seriesId: string) => void
    remove: (seriesId: string) => void
    more: (seriesId: string, albumCount: number) => void
}

export interface GridProps {
    albums: Album[]
    seriesList: Series[]
    scope: 'ALL' | 'SINGLE'
    layout: 'grid' | 'list'
    context: { searchQuery: string; filters: Record<string, string | boolean | undefined> }
    isLoading: boolean
    seriesStates: Record<string, SeriesState> | null
    expandedSeriesIds: string[]
    phone: boolean
    act: Act
    actions: GroupActions
}

const GRID = 'albums-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6'

const hasActiveFilters = (context: GridProps['context']): boolean =>
    Boolean(context.searchQuery) || Object.values(context.filters || {}).some(value => value !== 'all' && value !== false)

function NoMatch() {
    return (
        <div className="text-center py-12 text-muted">
            <p className="text-xl mb-2">{t('albums.noMatch.title')}</p>
            <p className="text-sm">{t('albums.noMatch.about')}</p>
        </div>
    )
}

function Cards({ albums, props }: { albums: Album[]; props: GridProps }) {
    if (albums.length === 0 && hasActiveFilters(props.context)) return <div className="col-span-full"><NoMatch /></div>
    return <>{albums.map(album => (props.phone ? <PhoneTile key={album.id} album={album} act={props.act} /> : <CompactCard key={album.id} album={album} act={props.act} />))}</>
}

function List({ albums, props }: { albums: Album[]; props: GridProps }) {
    if (albums.length === 0 && hasActiveFilters(props.context)) return <NoMatch />
    return <>{albums.map((album, index) => (props.phone ? <PhoneRow key={album.id} album={album} act={props.act} /> : <ExpandedCard key={album.id} album={album} index={index} act={props.act} />))}</>
}

/** The cards of a group tell the screen which series they stand in (removing an album needs it). */
const inGroup = (props: GridProps, seriesId: string): GridProps => ({ ...props, act: (action, album) => props.act(action, album, seriesId) })

const SeriesGrid = ({ albums, props }: { albums: Album[]; props: GridProps }) => <div className={GRID}><Cards albums={albums} props={props} /></div>

function GroupHeader({ series, count, actions }: { series: Series; count: number; actions: GroupActions }) {
    return (
        <div className="series-group-header flex items-center justify-between mb-6 pb-2 border-b border-white/10">
            <div className="series-group-header__title flex items-center gap-4">
                <h2 className="series-group-header__name text-2xl font-bold text-accent-primary">{series.name}</h2>
                <span className="series-group-header__count text-sm text-white/50 bg-white/5 px-2 py-1 rounded-full border border-white/5">{` ${t('albums.group.count', { count })} `}</span>
            </div>
            <button type="button" className="series-more md:hidden" data-action="series-more" data-series-id={series.id} aria-label={t('albums.series.more', { name: series.name })} onClick={(event) => { event.preventDefault(); event.stopPropagation(); actions.more(series.id, count) }}>
                <svg className="series-more__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>
            </button>
            <div className="series-actions flex gap-2">
                <button className="btn btn-secondary btn-sm btn-icon" data-action="edit-series" data-series-id={series.id} title={t('albums.series.edit')} onClick={(event) => { event.preventDefault(); event.stopPropagation(); actions.edit(series.id) }}>
                    <Icon name="Edit" className="w-4 h-4" />
                </button>
                <button className="btn btn-danger btn-sm btn-icon" data-action="delete-series" data-series-id={series.id} title={t('albums.series.delete')} onClick={(event) => { event.preventDefault(); event.stopPropagation(); actions.remove(series.id) }}>
                    <Icon name="Trash" className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}

function FailureNotice({ series, states, actions }: { series: Series; states: GridProps['seriesStates']; actions: GroupActions }) {
    const state = states ? states[series.id] : null
    if (!state || state.failed === 0 || state.status === 'loading') return null
    return (
        <div className="series-load-failure flex items-center gap-3 mb-4 px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-200" role="status">
            <span>{`${tPlural('albums.failure', state.failed, { count: state.failed })}.`}</span>
            <button type="button" className="underline font-semibold hover:text-white" data-action="retry-series" data-series-id={series.id} onClick={(event) => { event.preventDefault(); event.stopPropagation(); actions.retry(series.id) }}>{t('albums.failure.retry')}</button>
        </div>
    )
}

function LoadMore({ seriesId, hidden, actions }: { seriesId: string; hidden: number; actions: GroupActions }) {
    if (!(hidden > 0)) return null
    return (
        <div className="col-span-full flex justify-center mt-4 w-full">
            <button type="button" className="btn btn-secondary text-sm flex items-center gap-2 group load-more-btn px-6 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-colors" data-series-id={seriesId} data-action="load-more-series" onClick={(event) => { event.preventDefault(); event.stopPropagation(); actions.loadMore(seriesId) }}>
                <span>{tPlural('albums.more', hidden, { count: hidden })}</span>
                <Icon name="ChevronDown" className="w-4 h-4 transition-transform group-hover:translate-y-1" />
            </button>
        </div>
    )
}

// ---------------------------------------------------------------------------------------------- the skeletons

function AlbumSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="bg-white/5 rounded-xl aspect-square w-full mb-2 border border-white/5 relative overflow-hidden"><div className="absolute inset-0 skeleton opacity-20" /></div>
            <div className="space-y-2"><div className="h-3 bg-white/10 rounded w-3/4" /><div className="h-3 bg-white/5 rounded w-1/2" /></div>
        </div>
    )
}

function SeriesSkeleton() {
    return (
        <div className="mb-12 p-4 md:p-6 rounded-2xl border border-white/5 bg-black/20">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-2 animate-pulse">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-white/5 relative overflow-hidden"><div className="absolute inset-0 skeleton opacity-20" /></div>
                    <div className="space-y-2"><div className="h-6 w-48 bg-white/10 rounded" /><div className="h-3 w-24 bg-white/5 rounded" /></div>
                </div>
                <div className="h-8 w-32 bg-white/5 rounded-full" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                {Array.from({ length: 6 }, (_, i) => <AlbumSkeleton key={i} />)}
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------------------------- the groups

const GROUP = 'series-group rounded-xl border border-white/5 p-6 mb-8 bg-white/5'

/** What a series with no albums on screen shows: a skeleton while it loads, the notice when all of it failed, nothing otherwise. */
function emptyDisplay(seriesId: string, props: GridProps): 'loading' | 'failed' | 'hidden' {
    const state = props.seriesStates ? props.seriesStates[seriesId] : null
    if (!state) return props.isLoading ? 'loading' : 'hidden'
    if (state.status === 'loading') return 'loading'
    if (state.status === 'failed' && state.found === 0) return 'failed'
    return 'hidden'
}

function GridGroups({ props }: { props: GridProps }) {
    const { seriesGroups, otherAlbums } = groupAlbumsBySeries(props.albums, props.seriesList) as { seriesGroups: Map<string, { series: Series; albums: Album[] }>; otherAlbums: Album[] }
    let index = 0
    const groups: ReactElement[] = []
    seriesGroups.forEach(({ series, albums }) => {
        if (albums.length === 0) {
            const display = emptyDisplay(series.id, props)
            if (display === 'loading') groups.push(<div key={series.id} className="series-group-skeleton" data-series-id={series.id} data-series-index={index}><SeriesSkeleton /></div>)
            else if (display === 'failed') {
                groups.push(<div key={series.id} className={GROUP} data-series-id={series.id}><GroupHeader series={series} count={0} actions={props.actions} /><FailureNotice series={series} states={props.seriesStates} actions={props.actions} /></div>)
            }
            return
        }
        const { shown, hidden } = cutAlbums(albums, props.expandedSeriesIds.includes(series.id)) as { shown: Album[]; hidden: number }
        groups.push(
            <div key={series.id} className={GROUP} data-series-id={series.id}>
                <GroupHeader series={series} count={albums.length} actions={props.actions} />
                <FailureNotice series={series} states={props.seriesStates} actions={props.actions} />
                <SeriesGrid albums={shown} props={inGroup(props, series.id)} />
                <LoadMore seriesId={series.id} hidden={hidden} actions={props.actions} />
            </div>
        )
        index++
    })
    return (
        <div className="all-series-container space-y-12">
            {groups}
            {otherAlbums.length > 0 ? (
                <div className="series-group mt-12">
                    <div className="series-group-header flex items-center gap-4 mb-6 pb-2 border-b border-white/10">
                        <h2 className="text-2xl font-bold text-gray-400">{t('albums.group.uncategorized')}</h2>
                        <span className="text-sm text-white/50 bg-white/5 px-2 py-1 rounded-full">{t('albums.group.count', { count: otherAlbums.length })}</span>
                    </div>
                    <SeriesGrid albums={otherAlbums} props={props} />
                </div>
            ) : null}
        </div>
    )
}

function ListGroups({ props }: { props: GridProps }) {
    const { seriesGroups, otherAlbums } = groupAlbumsBySeries(props.albums, props.seriesList) as { seriesGroups: Map<string, { series: Series; albums: Album[] }>; otherAlbums: Album[] }
    const groups: ReactElement[] = []
    seriesGroups.forEach(({ series, albums }) => {
        if (albums.length === 0) return
        groups.push(<div key={series.id} className={GROUP} data-series-id={series.id}><GroupHeader series={series} count={albums.length} actions={props.actions} /><List albums={albums} props={inGroup(props, series.id)} /></div>)
    })
    return (
        <div className="all-series-container space-y-12">
            {groups}
            {otherAlbums.length > 0 ? (
                <div className="series-group mt-12">
                    <div className="series-group-header flex items-center gap-4 mb-6 pb-2 border-b border-white/10">
                        <h2 className="text-2xl font-bold text-gray-400">{t('albums.group.uncategorized')}</h2>
                        <span className="text-sm text-white/50 bg-white/5 px-2 py-1 rounded-full">{` ${t('albums.group.count', { count: otherAlbums.length })} `}</span>
                    </div>
                    <List albums={otherAlbums} props={props} />
                </div>
            ) : null}
        </div>
    )
}

/** The inside of `#series-grid-inner`. */
export function SeriesGroups(props: GridProps) {
    if (props.scope === 'ALL' && props.seriesList.length > 0) return props.layout === 'grid' ? <GridGroups props={props} /> : <ListGroups props={props} />
    return props.layout === 'grid' ? <SeriesGrid albums={props.albums} props={props} /> : <List albums={props.albums} props={props} />
}
