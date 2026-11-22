/**
 * One batch on the saved playlists list, on the computer, and its playlists (F83 wave 1; they were components/playlists/
 * SavedPlaylistCard.js, SavedPlaylistRow.js and SavedPlaylistActions.js).
 *
 * Closed, a card shows the totals of the batch; its playlists are drawn the first time the card is opened, not before (F61:
 * nothing the list does not show is built up front), and a playlist's tracks the first time its row is opened. What was drawn
 * stays, hidden, when the card or the row is closed, as before. The totals and dates are the ones of today: «3m» and the date of
 * the browser's own language are written by the model and the browser, as the old card did.
 */
import { useState } from 'react'
import { AlbumCascade } from '../../ui/AlbumCascade'
import { Icon } from '../../ui/Icon'
import { TrackRow } from '../../ui/TrackRow'
import { batchTotals, formatMinutes, toMillis } from '../../models/savedPlaylists.js'
import { t } from '../../i18n/t.js'
import type { Batch, Handlers, SavedPlaylist } from './types'

/** Open and closed, and whether it was ever opened (the first opening draws what was waiting; the arrow only turns after it). */
function useDisclosure() {
    const [state, setState] = useState({ open: false, touched: false })
    return { ...state, toggle: () => setState({ open: !state.open, touched: true }) }
}

const arrowStyle = (touched: boolean, open: boolean) => (touched ? { transform: open ? 'rotate(90deg)' : 'rotate(0deg)' } : undefined)

function PlaylistRow({ playlist, seriesId, seriesName, batch, index, handlers }: {
    playlist: SavedPlaylist
    seriesId: string
    seriesName: string
    batch: Batch
    index: number
    handlers: Handlers
}) {
    const { open, touched, toggle } = useDisclosure()
    const totals = batchTotals({ playlists: [playlist] })
    const tracks = playlist.tracks ?? []
    return (
        <div className="playlist-row-wrapper" data-playlist-index={index}>
            <div
                className="playlist-row p-4 flex items-center justify-between hover:bg-white/5 transition-colors group cursor-pointer"
                data-playlist-id={playlist.id}
                onClick={toggle}
            >
                <div className="flex items-center gap-4">
                    <span className="expand-icon text-muted transition-transform duration-200" style={arrowStyle(touched, open)}>
                        <Icon name="ChevronRight" className="w-4 h-4" />
                    </span>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-muted group-hover:text-brand-orange group-hover:bg-brand-orange/10 transition-colors">
                        <Icon name="Disc" className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="font-medium text-white group-hover:text-brand-orange transition-colors">{playlist.name}</div>
                        <div className="text-xs text-muted font-mono mt-0.5">
                            {t('savedPlaylists.playlist.facts', { tracks: totals.tracks, duration: formatMinutes(totals.durationSeconds) })}
                        </div>
                    </div>
                </div>
                <div className="playlist-row-buttons flex items-center [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                    <button
                        type="button"
                        className="btn btn-ghost btn-sm text-muted hover:text-white"
                        title={t('savedPlaylists.playlist.exportTitle')}
                        aria-label={t('savedPlaylists.playlist.exportLabel', { name: playlist.name ?? '' })}
                        onClick={(event) => { event.stopPropagation(); handlers.onExportPlaylist(seriesName, batch, playlist, index) }}
                    >
                        <Icon name="Share" className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        className="btn btn-ghost btn-sm text-muted hover:text-white"
                        title={t('savedPlaylists.playlist.viewTitle')}
                        aria-label={t('savedPlaylists.playlist.viewLabel', { name: playlist.name ?? '' })}
                        onClick={(event) => { event.stopPropagation(); handlers.onOpenPlaylist(seriesId, playlist.id) }}
                    >
                        <Icon name="Eye" className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <div className={`playlist-tracks-list bg-black/30 pl-16 pr-4 py-2${open ? '' : ' hidden'}`} data-filled={touched ? 'true' : undefined}>
                {touched && tracks.length === 0 ? <div className="text-sm text-muted italic py-2">{t('savedPlaylists.playlist.noTracks')}</div> : null}
                {touched ? tracks.map((track, i) => <TrackRow key={i} track={track} index={i + 1} variant="detailed" playlistIndex={-1} trackIndex={i} />) : null}
            </div>
        </div>
    )
}

function BatchFact({ icon, text, className = 'flex items-center gap-1' }: { icon: string; text: string; className?: string }) {
    return <span className={className}><Icon name={icon} className="w-3 h-3" />{` ${text}`}</span>
}

function BatchInfo({ batch }: { batch: Batch }) {
    const totals = batchTotals(batch)
    const date = batch.savedAt ? new Date(toMillis(batch.savedAt)).toLocaleDateString() : ''
    return (
        <div className="batch-info">
            <h3 className="font-bold text-xl text-white tracking-tight">{batch.name}</h3>
            <div className="flex items-center gap-3 text-sm text-muted mt-1">
                <BatchFact icon="List" text={t('savedPlaylists.batch.playlists', { count: totals.playlists })} />
                <BatchFact icon="Music" text={t('savedPlaylists.batch.tracks', { count: totals.tracks })} />
                <BatchFact icon="Disc" text={t('savedPlaylists.batch.albums', { count: totals.albums })} />
                <BatchFact icon="Clock" text={formatMinutes(totals.durationSeconds)} className="flex items-center gap-1 font-mono" />
                <BatchFact icon="Calendar" text={date} />
            </div>
        </div>
    )
}

/** Edit, export and delete a batch: none opens or closes the card. */
function BatchButtons({ batch, seriesId, seriesName, handlers }: { batch: Batch; seriesId: string; seriesName: string; handlers: Handlers }) {
    const count = batchTotals(batch).playlists
    return (
        <div className="batch-card-buttons flex items-center gap-2">
            <button
                type="button"
                className="btn btn-secondary btn-sm flex items-center gap-2 hover:bg-white/20 transition-all shadow-md"
                title={t('savedPlaylists.batch.editTitle')}
                aria-label={t('savedPlaylists.batch.editLabel', { name: batch.name })}
                onClick={(event) => { event.stopPropagation(); handlers.onEditBatch(seriesId, batch.name, batch.savedAt) }}
            >
                <Icon name="Edit" className="w-4 h-4" />{` ${t('savedPlaylists.batch.edit')}`}
            </button>
            <button
                type="button"
                className="btn btn-secondary btn-sm flex items-center gap-2 hover:bg-white/20 transition-all shadow-md"
                title={t('savedPlaylists.batch.exportTitle')}
                aria-label={t('savedPlaylists.batch.exportLabel', { name: batch.name })}
                onClick={(event) => { event.stopPropagation(); handlers.onExportBatch(seriesName, batch) }}
            >
                <Icon name="Share" className="w-4 h-4" />{` ${t('savedPlaylists.batch.export')}`}
            </button>
            <button
                type="button"
                className="btn btn-ghost btn-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                title={t('savedPlaylists.batch.deleteTitle')}
                aria-label={t('savedPlaylists.batch.deleteLabel', { name: batch.name })}
                onClick={(event) => { event.stopPropagation(); handlers.onDeleteBatch(seriesId, batch.name, count) }}
            >
                <Icon name="Trash" className="w-4 h-4" />
                {/* the phone names the action beside the icon (no hover there to explain it) */}
                <span className="md:hidden">{t('savedPlaylists.batch.delete')}</span>
            </button>
        </div>
    )
}

/** The playlists of the batch: nothing in the box until the card is opened once. */
function BatchPlaylists({ batch, seriesId, seriesName, open, filled, handlers }: {
    batch: Batch
    seriesId: string
    seriesName: string
    open: boolean
    filled: boolean
    handlers: Handlers
}) {
    const rows = batch.playlists.length === 0
        ? <div className="p-6 text-center text-muted italic">{t('savedPlaylists.batch.empty')}</div>
        : batch.playlists.map((playlist, index) => (
            <PlaylistRow key={playlist.id} playlist={playlist} seriesId={seriesId} seriesName={seriesName} batch={batch} index={index} handlers={handlers} />
        ))
    return (
        <div className={`batch-playlists divide-y divide-white/5 bg-black/20${open ? '' : ' hidden'}`} data-filled={filled ? 'true' : undefined}>
            {filled ? rows : null}
        </div>
    )
}

export function BatchCard({ batch, seriesId, seriesName, thumbnails, handlers }: {
    batch: Batch
    seriesId: string
    seriesName: string
    thumbnails: (string | null)[]
    handlers: Handlers
}) {
    const { open, touched, toggle } = useDisclosure()
    return (
        <div
            className="batch-group-card bg-surface rounded-xl border border-white/10 overflow-hidden mb-6 transition-all duration-300 hover:border-brand-orange/30"
            data-series-id={seriesId}
            data-batch-name={batch.name}
            data-collapsed={open ? 'false' : 'true'}
        >
            <div className="batch-header p-5 bg-gradient-to-r from-white/5 to-transparent border-b border-white/10 cursor-pointer" onClick={toggle}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="collapse-icon text-muted transition-transform duration-200" style={arrowStyle(touched, open)}>
                            <Icon name="ChevronRight" className="w-5 h-5" />
                        </span>
                        <AlbumCascade thumbnails={thumbnails} />
                        <BatchInfo batch={batch} />
                    </div>
                    <BatchButtons batch={batch} seriesId={seriesId} seriesName={seriesName} handlers={handlers} />
                </div>
            </div>
            <BatchPlaylists batch={batch} seriesId={seriesId} seriesName={seriesName} open={open} filled={touched} handlers={handlers} />
        </div>
    )
}
