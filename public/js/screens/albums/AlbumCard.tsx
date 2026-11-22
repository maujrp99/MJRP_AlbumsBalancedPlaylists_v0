/**
 * The cards of an album on the albums screen (F83 wave 5a): the compact card of the grid and the expanded card of the list on the
 * computer (components/ui/AlbumCardRenderer.js), and the tile and the row of the phone (components/ui/AlbumPhoneCard.js). The same
 * markup, the same classes; each button has its own `onClick` where the hand-made screen had one listener on the page for every
 * `data-action`. The track table of the expanded card is ui/tracks/TracksTable.tsx (wave 6b), the one the album window holds too.
 */
import { useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import { t } from '../../i18n/t.js'
import { albumLoader } from '../../services/AlbumLoader.js'
import { safeUrl } from '../../utils/safeUrl.js'
import { identityReasonOf } from '../../models/askedAlbum.js'
import { trackRowsOf } from '../../models/albumTrackRows.js'
import { TracksTable, type TrackRowData } from '../../ui/tracks/TracksTable'
import { CoverImage } from '../../ui/CoverImage'
import { Icon } from '../../ui/Icon'
import type { Album } from './types'

/** What a card asks of the screen: an action on an album (the same words the hand-made buttons carried in `data-action`). */
export type AlbumAction = 'view-modal' | 'album-more' | 'rank-album' | 'add-to-inventory' | 'remove-album' | 'refetch-metadata'
export type Act = (action: AlbumAction, album: Album, seriesId?: string | null) => void

const press = (work: () => void) => (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    work()
}

/** The note an album shows when it is not, to the letter, the title that was asked for. */
function identityNote(album: Album): string | null {
    const reason = identityReasonOf(album) as string | null
    if (!reason) return null
    return t(`albums.identity.${reason.replace(/-(\w)/g, (_, letter: string) => letter.toUpperCase())}`)
}

const SMALL = 'text-[9px] px-1 py-0 h-auto min-h-0'

function BestEverBadge({ id }: { id: string | number }) {
    return (
        <div className="flex justify-start w-full">
            <a href={`https://www.besteveralbums.com/thechart.php?a=${id}`} target="_blank" rel="noopener noreferrer" className={`badge badge-primary hover:badge-accent transition-colors flex items-center gap-1 ${SMALL}`} title={t('albums.badge.bestEverTitle')}>
                <Icon name="ExternalLink" className="w-2 h-2" />{` ${t('albums.badge.bestEver')}`}
            </a>
        </div>
    )
}

function SpotifyBadge({ album }: { album: Album }) {
    return (
        <a href={safeUrl(album.spotifyUrl) || `https://open.spotify.com/album/${encodeURIComponent(String(album.spotifyId))}`} target="_blank" rel="noopener noreferrer" className={`badge flex items-center gap-1 transition-colors hover:opacity-80 ${SMALL}`} style={{ background: '#1DB954', color: 'white', border: 'none' }} title={t('albums.badge.spotify')}>
            <Icon name="Spotify" className="w-2 h-2" />{` ${t('albums.badge.spotify')}`}
        </a>
    )
}

function UserBadge() {
    return (
        <span className={`badge flex items-center gap-1 transition-colors ${SMALL}`} style={{ background: '#0EA5E9', color: 'white', border: 'none' }} title={t('albums.badge.myRankingTitle')}>
            <Icon name="Star" className="w-2 h-2" />{` ${t('albums.badge.myRanking')}`}
        </span>
    )
}

const isRankedByTheUser = (album: Album): boolean => Boolean(album.hasUserRanking) || (album.userRanking?.length ?? 0) > 0

/** Spotify on the left and the person's own ranking on the right; a spacer keeps the ranking on the right when Spotify is missing. */
function BottomRow({ album }: { album: Album }) {
    const ranked = isRankedByTheUser(album)
    if (!ranked && !album.spotifyId) return null
    return (
        <div className="flex justify-between items-center w-full">
            {album.spotifyId ? <SpotifyBadge album={album} /> : <div />}
            {ranked ? <UserBadge /> : null}
        </div>
    )
}

function RankingBadges({ album }: { album: Album }) {
    if (!album.bestEverAlbumId && !album.spotifyId && !isRankedByTheUser(album)) return null
    return (
        <div className="flex flex-col gap-1 w-full mt-1">
            {album.bestEverAlbumId ? <BestEverBadge id={album.bestEverAlbumId} /> : null}
            <BottomRow album={album} />
        </div>
    )
}

function Badges({ album }: { album: Album }) {
    const note = identityNote(album)
    return (
        <>
            <RankingBadges album={album} />
            {note ? <span className="basis-full text-[10px] leading-snug text-amber-400" data-identity-note="true">{note}</span> : null}
        </>
    )
}

/** The cover with the four buttons under it, as the compact and the expanded card both have it. */
function VisualHeader({ album, act }: { album: Album; act: Act }) {
    const ranked = Boolean(album.hasUserRanking)
    const buttons: Array<{ icon: string; label: string; action: AlbumAction; className: string }> = [
        { icon: 'Star', label: ranked ? t('albums.card.ranked') : t('albums.card.rank'), action: 'rank-album', className: ranked ? 'text-sky-400 bg-sky-400/10' : 'text-gray-400 hover:text-white hover:bg-white/5' },
        { icon: 'Plus', label: t('albums.card.add'), action: 'add-to-inventory', className: 'text-gray-400 hover:text-white hover:bg-white/5' },
        { icon: 'Trash', label: t('albums.card.remove'), action: 'remove-album', className: 'text-gray-400 hover:text-red-400 hover:bg-red-400/10' },
        { icon: 'RefreshCw', label: t('albums.card.refetch'), action: 'refetch-metadata', className: 'text-gray-500 hover:text-accent-primary hover:bg-accent-primary/10 ml-auto' }
    ]
    return (
        <div className="flex flex-col bg-gray-800">
            <div className="relative aspect-square overflow-hidden group border-b border-white/5" data-action="view-modal" data-id={album.id} onClick={press(() => act('view-modal', album))}>
                <CoverImage src={albumLoader.getArtworkUrl(album, 300)} alt={album.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <Icon name="Maximize2" className="w-10 h-10 text-white drop-shadow-lg" />
                </div>
            </div>
            <div className="flex items-center justify-between p-2 border-b border-white/5 bg-gray-900/50">
                {buttons.map(button => (
                    <button key={button.action} type="button" className={`flex-1 flex justify-center items-center py-1.5 rounded mx-0.5 transition-colors ${button.className}`} title={button.label} data-action={button.action} data-id={album.id} onClick={press(() => act(button.action, album))}>
                        <Icon name={button.icon} className="w-4 h-4" />
                    </button>
                ))}
            </div>
        </div>
    )
}

export function CompactCard({ album, act }: { album: Album; act: Act }) {
    return (
        <div className="flex flex-col rounded-xl overflow-hidden border border-white/10 bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 isolate" data-id={album.id}>
            <VisualHeader album={album} act={act} />
            <div className="px-3 flex flex-col flex-1 bg-gray-800">
                <h3 className="font-bold text-white text-base leading-tight line-clamp-2 mb-1 pt-2" title={album.title}>{album.title}</h3>
                <div className="flex justify-between items-center gap-2 mb-2">
                    <span className="text-sm text-gray-400 truncate min-w-0" title={album.artist}>{album.artist}</span>
                    {album.year ? <span className="text-[10px] text-gray-500 border border-white/10 px-1.5 py-0.5 rounded bg-white/5 shrink-0 tabular-nums">{album.year}</span> : null}
                </div>
                <div className="flex flex-wrap gap-1 mt-auto pb-2 text-xs opacity-90"><Badges album={album} /></div>
            </div>
        </div>
    )
}

/** The order of the table of the open card: a column and a direction (the hand-made table asked the card for the other direction on any column pressed). */
interface TrackSort {
    field: string
    direction: 'asc' | 'desc'
}

export function ExpandedCard({ album, index, act }: { album: Album; index: number; act: Act }) {
    const [sort, setSort] = useState<TrackSort>({ field: 'rank', direction: 'asc' })
    const style: CSSProperties = { animationDelay: `${index * 50}ms` }
    const rows = trackRowsOf(album, { sortField: sort.field, sortDirection: sort.direction }) as TrackRowData[]
    const hasTracks = rows.length > 0
    return (
        <div className="expanded-album-card glass-panel p-6 mb-4 rounded-xl border border-white/5 animate-in fade-in slide-in-from-bottom-2" style={style} data-id={album.id}>
            <div className="flex gap-4">
                <div className="w-32 md:w-40 shrink-0 rounded-xl overflow-hidden shadow-lg border border-white/10 self-start"><VisualHeader album={album} act={act} /></div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-white leading-tight">{album.title}{album.year ? <span className="text-gray-400 font-normal ml-2 text-base">{`(${album.year})`}</span> : null}</h3>
                    <div className="flex items-center gap-3 mb-2"><p className="text-lg text-accent-primary">{album.artist}</p></div>
                    <div className="flex flex-wrap gap-1 mt-auto"><Badges album={album} /></div>
                    {hasTracks ? <TracksTable tracks={rows} sortField={sort.field} sortDirection={sort.direction} albumId={album.id} onSort={(field) => setSort({ field, direction: sort.direction === 'asc' ? 'desc' : 'asc' })} /> : <p className="text-muted text-sm">{t('albums.card.noTracks')}</p>}
                </div>
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------------------------- the phone

const artistLine = (album: Album): string => [album.artist, album.year].filter(Boolean).join(' · ')

/** What the phone's tile and row say of the album's marks, in words. */
export function albumBadgeLabels(album: Album): string[] {
    const hasUserRanking = Boolean(album.hasUserRanking) || (album.userRanking?.length ?? 0) > 0
    return [
        hasUserRanking ? t('albums.phone.myRanking') : null,
        album.bestEverAlbumId ? t('albums.badge.bestEver') : null,
        album.spotifyId ? t('albums.badge.spotify') : null
    ].filter((label): label is string => Boolean(label))
}

function MoreButton({ album, act }: { album: Album; act: Act }) {
    return (
        <button type="button" className="album-more" aria-label={t('albums.phone.actions', { title: album.title || t('albums.phone.actionsThis') })} data-action="album-more" data-id={album.id} onClick={press(() => act('album-more', album))}>
            <svg className="album-more__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>
        </button>
    )
}

function PhoneBadges({ album, className, itemClass }: { album: Album; className: string; itemClass: string }): ReactNode {
    const labels = albumBadgeLabels(album)
    if (labels.length === 0) return null
    return <span className={className}>{labels.map(label => <span key={label} className={itemClass}>{label}</span>)}</span>
}

function PhoneNote({ album, className }: { album: Album; className: string }): ReactNode {
    const note = identityNote(album)
    return note ? <span className={className} data-identity-note="true">{note}</span> : null
}

export function PhoneTile({ album, act }: { album: Album; act: Act }) {
    const open = press(() => act('view-modal', album))
    return (
        <div className="album-tile" data-id={album.id}>
            <button type="button" className="album-tile__cover" aria-label={t('albums.phone.open', { title: album.title || t('albums.phone.openAlbum') })} data-action="view-modal" data-id={album.id} onClick={open}>
                <CoverImage src={albumLoader.getArtworkUrl(album, 300)} alt="" className="album-cover__img" loading="lazy" />
            </button>
            <div className="album-tile__meta">
                <button type="button" className="album-tile__text" data-action="view-modal" data-id={album.id} onClick={open}>
                    <span className="album-tile__title">{album.title || ''}</span>
                    <span className="album-tile__artist">{artistLine(album)}</span>
                    <PhoneBadges album={album} className="album-tile__badges" itemClass="album-tile__badges-item" />
                    <PhoneNote album={album} className="album-tile__notice" />
                </button>
                <MoreButton album={album} act={act} />
            </div>
        </div>
    )
}

export function PhoneRow({ album, act }: { album: Album; act: Act }) {
    return (
        <div className="album-row" data-id={album.id}>
            <button type="button" className="album-row__main" data-action="view-modal" data-id={album.id} onClick={press(() => act('view-modal', album))}>
                <span className="album-row__cover"><CoverImage src={albumLoader.getArtworkUrl(album, 120)} alt="" className="album-cover__img" loading="lazy" /></span>
                <span className="album-row__text">
                    <span className="album-row__title">{album.title || ''}</span>
                    <span className="album-row__artist">{artistLine(album)}</span>
                    <PhoneBadges album={album} className="album-row__badges" itemClass="album-row__badges-item" />
                    <PhoneNote album={album} className="album-row__notice" />
                </span>
            </button>
            <MoreButton album={album} act={act} />
        </div>
    )
}
