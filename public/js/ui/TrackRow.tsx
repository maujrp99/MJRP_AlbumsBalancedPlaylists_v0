/**
 * TrackRow - one track in a list: its place, title, length, the badges of how the rankings rate it, and the actions that show
 * on hover (F83 wave 2; it was components/ui/TrackRow.js, ported once for every screen that uses it, with the same HTML and
 * the same classes). It draws what it is given and holds no store or service; what an action does is the caller's (`onSelect`).
 *
 * The badges are the old ones, in this order: yours (blue), then the ranking the playlist is read by first, then the other.
 */
import type { ReactNode } from 'react'
import { Icon } from './Icon'
import { t } from '../i18n/t.js'

export interface RowTrack {
    id?: string
    title?: string
    duration?: number
    rank?: number
    acclaimRank?: number
    rating?: number
    spotifyRank?: number
    spotifyPopularity?: number
    userRank?: number
    [field: string]: unknown
}

export interface RowAction {
    icon: string
    label: string
    action: string
    class?: string
    onSelect?: () => void
}

export interface TrackRowProps {
    track: RowTrack
    /** The place shown, from 1. */
    index: number
    variant?: 'compact' | 'detailed' | 'ranking'
    primaryRanking?: 'spotify' | 'acclaim'
    draggable?: boolean
    actions?: RowAction[]
    playlistIndex?: number
    trackIndex?: number
}

/** 3:45 (how the old row writes a length; the lists that total tracks say it the same way). */
export function formatTrackDuration(seconds?: number): string {
    if (!seconds || seconds <= 0) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

/** The actions of a row show on hover only where there is a mouse to hover with; on touch they are always there (F63, UAT-13). */
const ACTIONS_VISIBILITY = '[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-within:opacity-100'

const MEDALS = ['🥇', '🥈', '🥉']

const isRank = (value?: number): value is number => Boolean(value) && (value as number) < 999

function Position({ index, ranking }: { index: number; ranking: boolean }) {
    if (ranking && index <= 3) return <span className="text-xl w-6 text-center shrink-0">{MEDALS[index - 1]}</span>
    return <span className="text-muted font-bold text-sm w-6 text-center shrink-0">{String(index)}</span>
}

function UserBadge({ track }: { track: RowTrack }) {
    if (!isRank(track.userRank)) return null
    return <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-sky-500 text-white text-[10px] font-bold" title={t('ui.trackRow.yourRank')}>{`#${track.userRank}`}</span>
}

function AcclaimBadge({ track }: { track: RowTrack }) {
    const rank = track.rank || track.acclaimRank
    const rating = track.rating
    const hasRank = isRank(rank)
    const hasRating = Boolean(rating) && (rating as number) > 0
    if (!hasRank && !hasRating) return null
    return (
        <span className="flex items-center gap-1">
            {hasRank && <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-orange/10 text-brand-orange text-[10px] font-bold border border-brand-orange/20" title={t('ui.trackRow.acclaimRank')}>{`#${rank}`}</span>}
            {hasRating && <span className="flex items-center gap-0.5 text-[10px] font-bold text-brand-orange" title={t('ui.trackRow.acclaimRating')}>{`★${rating}`}</span>}
        </span>
    )
}

function SpotifyBadge({ track }: { track: RowTrack }) {
    const popularity = track.spotifyPopularity
    if (isRank(track.spotifyRank)) {
        return <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#1DB954]/10 text-[#1DB954] text-[10px] font-bold border border-[#1DB954]/20" title={t('ui.trackRow.spotifyRank')}>{`#${track.spotifyRank}`}</span>
    }
    if (popularity != null && popularity > -1) {
        return <span className="text-[10px] font-bold text-[#1DB954]" title={t('ui.trackRow.spotifyPopularity')}>{`${popularity}%`}</span>
    }
    return null
}

const hasAcclaim = (track: RowTrack): boolean => isRank(track.rank || track.acclaimRank) || (Boolean(track.rating) && (track.rating as number) > 0)
const hasSpotify = (track: RowTrack): boolean => isRank(track.spotifyRank) || (track.spotifyPopularity != null && track.spotifyPopularity > -1)

/** The badges that exist, in the order the row shows them; a badge that does not exist leaves no empty element. */
function badgesOf(track: RowTrack, primaryRanking: 'spotify' | 'acclaim'): ReactNode[] {
    const acclaim = hasAcclaim(track) ? <AcclaimBadge key="acclaim" track={track} /> : null
    const spotify = hasSpotify(track) ? <SpotifyBadge key="spotify" track={track} /> : null
    const ordered = primaryRanking === 'spotify' ? [spotify, acclaim] : [acclaim, spotify]
    return [isRank(track.userRank) ? <UserBadge key="user" track={track} /> : null, ...ordered].filter(Boolean)
}

export function TrackRow({ track, index, variant = 'compact', primaryRanking = 'spotify', draggable = false, actions = [], playlistIndex, trackIndex }: TrackRowProps) {
    const shown = badgesOf(track, primaryRanking)
    return (
        <div
            className={`track-row flex items-start gap-0 p-2 rounded-lg hover:bg-white/5 transition-colors group relative ${draggable ? 'pl-8' : ''}`}
            data-id={track.id}
            data-playlist-index={playlistIndex}
            data-track-index={trackIndex}
        >
            {draggable && (
                <div className="track-drag-handle absolute left-2 top-1/2 -translate-y-1/2 text-muted opacity-0 group-hover:opacity-50 hover:!opacity-100 cursor-grab">
                    <Icon name="GripVertical" className="w-4 h-4" />
                </div>
            )}
            <div className="flex flex-col flex-1 min-w-0 py-1">
                <div className="flex items-center w-full">
                    <Position index={index} ranking={variant === 'ranking'} />
                    <div className="ml-2 flex-1"><span className="font-medium text-sm text-white" title={track.title}>{track.title}</span></div>
                    <div className="text-xs text-muted font-mono ml-auto pl-2 shrink-0">{formatTrackDuration(track.duration)}</div>
                </div>
                <div className="flex items-center gap-2 mt-0.5 justify-end text-xs w-full">{shown}</div>
            </div>
            <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 ${ACTIONS_VISIBILITY} transition-opacity bg-black/50 rounded px-1`}>
                {actions.map(action => (
                    <button
                        key={action.action}
                        type="button"
                        className={`p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors ${action.class || ''}`}
                        title={action.label}
                        aria-label={action.label}
                        data-action={action.action}
                        data-id={track.id}
                        data-playlist-index={playlistIndex}
                        data-track-index={trackIndex}
                        onClick={action.onSelect}
                    >
                        <Icon name={action.icon} className="w-4 h-4" />
                    </button>
                ))}
            </div>
        </div>
    )
}
