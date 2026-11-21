/**
 * The saved playlists on the phone (F76 polish, recheck N5; moved to React in F83 wave 1 from components/playlists/SavedPlaylistsPhone.js).
 *
 * The anatomy of the Albums screen: a calm list of series, each a header row (covers, name, «n batches · n playlists», a chevron
 * and a «⋯» of 44 px). Opened, a series shows its batches as rows; a batch opened shows its playlists as rows that open the
 * playlist's tracks. No card inside a card; nothing red on the screen: every action of a series or of a batch is named in a bottom
 * sheet, the destructive one last, in red, and it asks first (the screen's handlers ask, as on the computer). Every action calls the
 * same handler the computer's buttons call. The sheets carry the class of the Albums sheets, so the screens share one sheet row.
 */
import { useState, type ReactNode } from 'react'
import { AlbumCascade } from '../../ui/AlbumCascade'
import { Icon } from '../../ui/Icon'
import { useSheetWindow } from '../../ui/SheetWindow'
import { batchTotals } from '../../models/savedPlaylists.js'
import { t } from '../../i18n/t.js'
import { batchFacts, playlistMeta, readableBatchName, seriesSummary } from './listText'
import type { Batch, Handlers, SavedPlaylist, SeriesGroupData } from './types'

interface Row {
    icon: string
    label: string
    onPick: () => void
}

/** The three dots of a «more» button. */
function Dots() {
    return (
        <svg className="phone-dots" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="5" cy="12" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="19" cy="12" r="1.8" />
        </svg>
    )
}

function MoreButton({ label, onTap }: { label: string; onTap: () => void }) {
    return (
        <button type="button" className="phone-more" aria-label={label} aria-haspopup="dialog" onClick={(event) => { event.stopPropagation(); onTap() }}>
            <Dots />
        </button>
    )
}

/** A row that opens and closes the box under it. */
function Disclosure({ className, label, text, meta, open, boxId, onToggle }: {
    className: string
    label?: ReactNode
    text: ReactNode
    meta: ReactNode
    open: boolean
    boxId: string
    onToggle: () => void
}) {
    return (
        <button type="button" className={className} aria-expanded={open} aria-controls={boxId} onClick={onToggle}>
            {label}
            <span className="saved-phone__text">{text}{meta}</span>
            <Icon name="ChevronRight" className="saved-phone__chevron" />
        </button>
    )
}

/* ── Sheets ───────────────────────────────────────────────────────────────────────────────── */

function SheetRow({ row, danger, close }: { row: Row; danger?: boolean; close: () => void }) {
    return (
        <button type="button" className={`albums-sheet__row${danger ? ' albums-sheet__row--danger' : ''}`} onClick={() => { close(); row.onPick() }}>
            <Icon name={row.icon} className="albums-sheet__icon" />
            <span className="albums-sheet__label">{row.label}</span>
        </button>
    )
}

function SheetBody({ about, rows, danger, close }: { about: string; rows: Row[]; danger: Row | null; close: () => void }) {
    return (
        <>
            {about ? <p className="albums-sheet__about">{about}</p> : null}
            <div className="albums-sheet__list">{rows.map(row => <SheetRow key={row.icon + row.label} row={row} close={close} />)}</div>
            {danger ? <div className="albums-sheet__list"><SheetRow row={danger} danger close={close} /></div> : null}
        </>
    )
}

function useActionSheet() {
    const { show, layer } = useSheetWindow()
    const open = (title: string, about: string, rows: Row[], danger: Row | null) => show({
        title,
        className: 'albums-sheet saved-phone-sheet',
        closeLabel: t('savedPlaylists.phone.close'),
        render: (close) => <SheetBody about={about} rows={rows} danger={danger} close={close} />
    })
    return { open, layer }
}

/* ── Rows ─────────────────────────────────────────────────────────────────────────────────── */

/** One playlist of an opened batch: its name and size; a tap opens its tracks. */
function PlaylistLine({ playlist, seriesId, handlers }: { playlist: SavedPlaylist; seriesId: string; handlers: Handlers }) {
    return (
        <button
            type="button"
            className="saved-phone-playlist"
            data-playlist-id={playlist.id}
            aria-label={t('savedPlaylists.phone.openTracks', { name: playlist.name ?? '' })}
            onClick={() => handlers.onOpenPlaylist(seriesId, playlist.id)}
        >
            <span className="saved-phone__text">
                <span className="saved-phone-playlist__name">{playlist.name || t('savedPlaylists.phone.playlistFallback')}</span>
                <span className="saved-phone__meta">{playlistMeta(playlist)}</span>
            </span>
            <Icon name="ChevronRight" className="saved-phone__chevron" />
        </button>
    )
}

/** What a batch holds, drawn the first time the row is opened and kept after that. */
function BatchPlaylists({ batch, seriesId, handlers }: { batch: Batch; seriesId: string; handlers: Handlers }) {
    if (batch.playlists.length === 0) return <p className="saved-phone__empty">{t('savedPlaylists.phone.noPlaylists')}</p>
    return <>{batch.playlists.map(playlist => <PlaylistLine key={playlist.id} playlist={playlist} seriesId={seriesId} handlers={handlers} />)}</>
}

/** One batch: a row that opens its playlists, and its «⋯». */
export function BatchRow({ batch, seriesId, handlers }: { batch: Batch; seriesId: string; handlers: Handlers }) {
    const [state, setState] = useState({ open: false, filled: false })
    const sheet = useActionSheet()
    const shown = readableBatchName(batch.name)
    const boxId = `savedBatch_${seriesId}_${encodeURIComponent(batch.name)}`
    const openSheet = () => sheet.open(
        shown.text,
        shown.machine ? t('savedPlaylists.phone.savedAs', { name: batch.name }) : batchFacts(batch),
        [{ icon: 'Edit', label: t('savedPlaylists.phone.editBatch'), onPick: () => handlers.onEditBatch(seriesId, batch.name, batch.savedAt) }],
        { icon: 'Trash', label: t('savedPlaylists.phone.deleteBatch'), onPick: () => handlers.onDeleteBatch(seriesId, batch.name, batchTotals(batch).playlists) }
    )
    return (
        <div className="saved-phone-batch" data-series-id={seriesId} data-batch-name={batch.name}>
            <div className="saved-phone__head">
                <Disclosure
                    className="saved-phone-batch__main batch-header"
                    text={<span className="saved-phone-batch__name">{shown.text}</span>}
                    meta={<span className="saved-phone__meta">{batchFacts(batch)}</span>}
                    open={state.open}
                    boxId={boxId}
                    onToggle={() => setState({ open: !state.open, filled: true })}
                />
                <MoreButton label={t('savedPlaylists.phone.batchActions', { name: batch.name })} onTap={openSheet} />
            </div>
            <div className="saved-phone-batch__playlists" id={boxId} hidden={!state.open}>
                {state.filled ? <BatchPlaylists batch={batch} seriesId={seriesId} handlers={handlers} /> : null}
            </div>
            {sheet.layer}
        </div>
    )
}

/**
 * The header row of a series: covers, name, what it holds; it opens the box of its batches, and its «⋯» names the actions.
 */
export function SeriesHead({ group, open, boxId, onToggle, handlers }: {
    group: SeriesGroupData
    open: boolean
    boxId: string
    onToggle: () => void
    handlers: Handlers
}) {
    const sheet = useActionSheet()
    const { series, batches } = group
    const summary = seriesSummary(batches)
    const openSheet = () => sheet.open(
        series.name || t('savedPlaylists.phone.seriesFallback'),
        summary,
        [
            { icon: 'Plus', label: t('savedPlaylists.phone.addPlaylists'), onPick: () => handlers.onNavigate() },
            { icon: 'Layers', label: t('savedPlaylists.phone.openSeries'), onPick: () => handlers.onOpenSeries(series.id) }
        ],
        batches.length > 0 ? { icon: 'Trash', label: t('savedPlaylists.phone.deleteAll'), onPick: () => handlers.onDeleteAll(series.id, series.name) } : null
    )
    return (
        <div className="saved-phone__head saved-phone-series__head">
            <Disclosure
                className="saved-series-toggle saved-phone-series__main"
                label={<AlbumCascade thumbnails={group.thumbnails} />}
                text={<span className="saved-phone-series__name">{series.name}</span>}
                meta={<span className="saved-series-toggle__text saved-phone__meta">{summary}</span>}
                open={open}
                boxId={boxId}
                onToggle={onToggle}
            />
            <MoreButton label={t('savedPlaylists.phone.seriesActions', { name: series.name })} onTap={openSheet} />
            {sheet.layer}
        </div>
    )
}
