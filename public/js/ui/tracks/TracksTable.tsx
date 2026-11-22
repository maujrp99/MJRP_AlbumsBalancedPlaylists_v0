/**
 * TracksTable - the table of the tracks of an album, on the computer (F83 wave 6b; the port of components/ranking/TracksTable.js, with the same
 * HTML and the same classes). Sortable by six columns, with a bar for the Spotify popularity, the badges of the ranks, and the averages of the
 * album over the table. Each row is two rows, the computer's and the phone's (the stylesheet shows one: `hidden md:flex` and `md:hidden`).
 *
 * It draws the tracks it is given, in the order it is given, and says which column was pressed (`onSort(field)`); the order is the caller's:
 * the album card keeps its own (models/albumTrackRows.js) and the comparison of the album window sorts by hand (TracksComparison.tsx).
 */
import { t } from '../../i18n/t.js'
import { averagesOf, popularityValue, ratingValue } from '../../models/albumAverages.js'
import { formatDuration } from '../../utils/duration.js'
import { Icon } from '../Icon'

export interface TrackRowData {
    title?: string
    artist?: string
    position?: number
    duration?: number
    rank?: number
    rating?: number | null
    spotifyPopularity?: number | null
    spotifyRank?: number
    userRank?: number
    ranking?: { evidence?: Array<{ source?: string; score?: number; rating?: number; votes?: number }> }
    [field: string]: unknown
}

export interface TracksTableProps {
    tracks: TrackRowData[]
    sortField?: string
    sortDirection?: 'asc' | 'desc'
    onSort: (field: string) => void
    /** What the card of the albums screen reads the table by (`data-album-id`). */
    albumId?: string
}

const SPOTIFY_GREEN = 'bg-[#1DB954]'

// Column order: #, Title, My Rank, BestEverAlbums, Popularity, Time
const HEADERS = [
    { id: 'position', label: 'ui.tracks.column.position', icon: 'Hash', width: 'w-16', align: '' },
    { id: 'title', label: 'ui.tracks.column.title', icon: '', width: 'flex-1', align: '' },
    { id: 'userRank', label: 'ui.tracks.column.userRank', icon: 'Star', width: 'w-24', align: 'center' },
    { id: 'rank', label: 'ui.tracks.column.rank', icon: 'Award', width: 'w-32', align: 'center' },
    { id: 'spotifyPopularity', label: 'ui.tracks.column.popularity', icon: 'SpotifyConfig', width: 'w-48', align: 'left' },
    { id: 'duration', label: 'ui.tracks.column.time', icon: 'Clock', width: 'w-20', align: 'right' }
]

/** The mean of the positions the person gave their own tracks; "-" when none is ranked. */
function myAverage(tracks: TrackRowData[]): string {
    const ranked = tracks.filter(track => track.userRank && track.userRank < 999)
    if (!ranked.length) return '-'
    return (ranked.reduce((sum, track) => sum + (track.userRank ?? 0), 0) / ranked.length).toFixed(1)
}

/** What the tooltip of a rating says: the evidence it was made of, when there is some. */
function ratingTooltip(track: TrackRowData): string {
    const evidence = track.ranking?.evidence
    if (!Array.isArray(evidence) || evidence.length === 0) return t('ui.tracks.aggregated')
    return evidence
        .map(e => (e.votes ? t('ui.tracks.evidenceVotes', { source: e.source ?? '', score: e.score || e.rating || '', votes: e.votes }) : t('ui.tracks.evidence', { source: e.source ?? '', score: e.score || e.rating || '' })))
        .join(' | ')
}

function Stats({ tracks }: { tracks: TrackRowData[] }) {
    const averages = averagesOf(tracks)
    return (
        <div className="p-3 bg-white/5 border-b border-white/10 flex justify-end gap-6 text-xs">
            <div className="flex items-center gap-2 text-white/50">
                <Icon name="Star" className="w-3 h-3 text-sky-500" />
                <span>{`${t('ui.tracks.myAvg')}: `}<strong className="text-white">{myAverage(tracks)}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-white/50">
                <Icon name="Award" className="w-3 h-3 text-brand-orange" />
                <span>{`${t('ui.tracks.avgRating')}: `}<strong className="text-white">{ratingValue(averages)}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-white/50">
                <Icon name="SpotifyConfig" className="w-3 h-3 text-[#1DB954]" />
                <span>{`${t('ui.tracks.avgPop')}: `}<strong className="text-white">{popularityValue(averages)}</strong></span>
            </div>
        </div>
    )
}

function Headers({ sortField, sortDirection, onSort }: { sortField: string; sortDirection: string; onSort: (field: string) => void }) {
    return (
        <div className="hidden md:flex items-center bg-white/5 border-b border-white/10">
            {HEADERS.map(header => {
                const active = sortField === header.id
                return (
                    <div
                        key={header.id}
                        className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/50 cursor-pointer hover:text-white transition-colors select-none sort-header ${header.width} ${header.align === 'center' ? 'justify-center' : ''} ${header.align === 'right' ? 'justify-end' : ''}`}
                        data-sort={header.id}
                        data-direction={sortDirection}
                        onClick={() => onSort(header.id)}
                    >
                        {header.icon ? <Icon name={header.icon} className="w-3 h-3 text-white/50" /> : null}
                        <span>{t(header.label)}</span>
                        {active ? <span className="text-brand-orange"><Icon name={sortDirection === 'asc' ? 'ChevronUp' : 'ChevronDown'} className="w-3 h-3" /></span> : null}
                    </div>
                )
            })}
        </div>
    )
}

const hasRankOf = (track: TrackRowData): boolean => Boolean(track.rank && track.rank < 999)
const hasUserRankOf = (track: TrackRowData): boolean => Boolean(track.userRank && track.userRank < 999)
const hasPopularityOf = (track: TrackRowData): boolean => track.spotifyPopularity != null && track.spotifyPopularity > -1

/** The BestEverAlbums column of the computer's row: the rank in a badge and the rating with its star, or a dash. */
function AcclaimCell({ track }: { track: TrackRowData }) {
    const badges = []
    if (hasRankOf(track)) {
        badges.push(<span key="rank" className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-orange/10 text-brand-orange text-sm font-bold border border-brand-orange/20 shadow-lg shadow-brand-orange/5">{`#${track.rank}`}</span>)
    }
    if (track.rating !== null && track.rating !== undefined) {
        badges.push(
            <span key="rating" className="flex items-center gap-1 text-sm font-bold text-white/90 cursor-help" title={ratingTooltip(track)}>
                <span className="text-brand-orange">★</span>{Number(track.rating).toFixed(0)}
            </span>
        )
    }
    return (
        <div className="w-32 px-4 py-3 flex justify-center">
            {badges.length > 0 ? <div className="flex items-center gap-2">{badges}</div> : <span className="text-white/10 text-xs">-</span>}
        </div>
    )
}

/** The Popularity column of the computer's row: the Spotify rank, the score and its bar, or «Not linked». */
function PopularityCell({ track }: { track: TrackRowData }) {
    const popularity = track.spotifyPopularity ?? 0
    return (
        <div className="w-48 px-4 py-3">
            {hasPopularityOf(track) ? (
                <div className="flex items-center gap-2">
                    {track.spotifyRank ? <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#1DB954]/10 text-[#1DB954] text-sm font-bold border border-[#1DB954]/20 shadow-lg shadow-[#1DB954]/5">{`#${track.spotifyRank}`}</span> : null}
                    <div className="flex flex-col gap-1 flex-1 max-w-[100px]">
                        <div className="flex justify-between items-end text-[10px] text-white/40 uppercase font-bold tracking-wider">
                            <span>{t('ui.tracks.score')}</span>
                            <span className={popularity > 80 ? 'text-[#1DB954]' : 'text-white/60'}>{`${popularity}%`}</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full ${SPOTIFY_GREEN} rounded-full`} style={{ width: `${popularity}%` }} />
                        </div>
                    </div>
                </div>
            ) : <span className="text-white/10 text-xs">{t('ui.tracks.notLinked')}</span>}
        </div>
    )
}

function UserRankCell({ track }: { track: TrackRowData }) {
    return (
        <div className="w-24 px-4 py-3 flex justify-center">
            {hasUserRankOf(track)
                ? <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-sky-500/10 text-sky-500 text-sm font-bold border border-sky-500/20 shadow-lg shadow-sky-500/5" title={t('ui.tracks.yourRank')}>{`#${track.userRank}`}</span>
                : <span className="text-white/30 text-xs">-</span>}
        </div>
    )
}

const positionOf = (track: TrackRowData): string | number | undefined => ((track.position ?? 0) >= 999 ? '-' : track.position)

function ComputerRow({ track }: { track: TrackRowData }) {
    return (
        <div className="hidden md:flex group items-center border-b border-white/5 hover:bg-white/5 transition-colors">
            <div className="w-16 px-4 py-3 text-white/50 font-mono text-sm group-hover:text-white">{String(positionOf(track))}</div>
            <div className="flex-1 px-4 py-3 min-w-0">
                <div className="font-medium text-white truncate group-hover:text-brand-orange transition-colors">{track.title}</div>
                <div className="text-xs text-white/30 truncate">{track.artist}</div>
            </div>
            <UserRankCell track={track} />
            <AcclaimCell track={track} />
            <PopularityCell track={track} />
            <div className="w-20 px-4 py-3 text-right text-white/50 font-mono text-xs group-hover:text-white">{formatDuration(track.duration)}</div>
        </div>
    )
}

/** The phone's row: stacked, the title and the time over the artist and the badges. */
function PhoneRow({ track }: { track: TrackRowData }) {
    const badges = []
    if (hasUserRankOf(track)) badges.push(<span key="user" className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-sky-500/10 text-sky-500 text-xs font-bold border border-sky-500/20">{`#${track.userRank}`}</span>)
    if (track.rating) {
        badges.push(<span key="rating" className="flex items-center gap-1 text-xs font-bold text-white/90"><span className="text-brand-orange">★</span>{Number(track.rating).toFixed(0)}</span>)
    }
    if (hasPopularityOf(track)) {
        badges.push(
            <div key="bar" className="w-16 h-1 bg-white/10 rounded-full overflow-hidden ml-2">
                <div className={`h-full ${SPOTIFY_GREEN} rounded-full`} style={{ width: `${track.spotifyPopularity}%` }} />
            </div>
        )
    }
    return (
        <div className="md:hidden flex flex-col p-3 border-b border-white/5 hover:bg-white/5 active:bg-white/10 transition-colors gap-1">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <span className="text-white/40 font-mono text-xs w-6 text-center">{String(positionOf(track))}</span>
                    <span className="font-medium text-white text-sm truncate">{track.title}</span>
                </div>
                <span className="text-xs text-white/40 font-mono whitespace-nowrap">{formatDuration(track.duration)}</span>
            </div>
            <div className="flex items-center justify-between pl-9 mt-0.5">
                <span className="text-xs text-white/30 truncate flex-1">{track.artist}</span>
                <div className="flex items-center gap-2 shrink-0">{badges}</div>
            </div>
        </div>
    )
}

const Row = ({ track }: { track: TrackRowData }) => <div><ComputerRow track={track} /><PhoneRow track={track} /></div>

export function TracksTable({ tracks, sortField = 'position', sortDirection = 'asc', onSort, albumId }: TracksTableProps) {
    return (
        <div className="tracks-table-root bg-black/20 rounded-xl border border-white/10 overflow-hidden backdrop-blur-sm" data-album-id={albumId}>
            <Stats tracks={tracks} />
            <Headers sortField={sortField} sortDirection={sortDirection} onSort={onSort} />
            <div className="divide-y divide-white/5">
                {tracks.map((track, index) => <Row key={index} track={track} />)}
            </div>
        </div>
    )
}
