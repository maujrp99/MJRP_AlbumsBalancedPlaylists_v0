/**
 * The playlists on the phone (F83 wave 2; it was components/playlists/PhonePlaylists.js, PhoneUndoNotice.js and
 * views/playlists/phonePlaylistActions.js; F76, REQ-08): ONE playlist at a time, a strip of chips on top that switches it, the tracks of
 * the open one scrolling with the page, a «⋯» of 44 px on each track and each playlist that opens a bottom sheet of named actions, and
 * at the foot the action bar (export, save) and, for a few seconds after a removal or a move, the notice that offers to take it back.
 * Every action calls what the computer's buttons call: the controller, and the service for a move (as the drag does).
 */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../../ui/Icon'
import { formatTrackDuration, type RowTrack } from '../../ui/TrackRow'
import { useSheetWindow } from '../../ui/SheetWindow'
import { EditableTitle } from './PlaylistCards'
import { playlistNameOf, playlistSummary } from './text'
import { t } from '../../i18n/t.js'
import { dialogService } from '../../services/DialogService.js'
import { getPlaylistsService } from '../../services/playlists/playlistsWiring.js'
import { playlistsStore } from '../../stores/playlists.js'
import { exportJson, exportToAppleMusic, openSpotifyExport } from '../../react-bridge/legacy/OutputWindows'
import type { Playlist, PlaylistActions } from './types'

/** How long the notice stays, in ms. */
export const UNDO_NOTICE_MS = 6000

function Dots() {
    return (
        <svg className="phone-dots" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="5" cy="12" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="19" cy="12" r="1.8" />
        </svg>
    )
}

/** The artist and the album of a track, as one line; empty when neither is known. */
const subLineOf = (track: RowTrack): string => [track?.artist, track?.album].filter(Boolean).join(' · ')

/** The strip of chips scrolled so the open chip is in view: moved only as far as needed (a playlist opened from elsewhere, a draw). */
export function revealCurrentChip(root: HTMLElement | null): void {
    const row = root?.querySelector<HTMLElement>('.phone-pl-chips__row')
    const chip = row?.querySelector<HTMLElement>('.phone-pl-chip.is-current')
    if (!row || !chip) return
    const before = chip.offsetLeft < row.scrollLeft
    const after = chip.offsetLeft + chip.offsetWidth > row.scrollLeft + row.clientWidth
    if (before || after) row.scrollLeft = Math.max(chip.offsetLeft - 16, 0)
}

export interface PhoneListProps {
    playlists: Playlist[]
    active: number
    /** The row a track landed on, lit for a moment. */
    lit: { playlist: number; track: number } | null
    actions: PlaylistActions
    onShow: (index: number) => void
    onTrackOptions: (playlistIndex: number, trackIndex: number) => void
    onPlaylistOptions: (playlistIndex: number) => void
}

function Chips({ playlists, active, onShow }: Pick<PhoneListProps, 'playlists' | 'active' | 'onShow'>) {
    return (
        <nav className="phone-pl-chips" aria-label={t('playlists.phone.chips')}>
            <div className="phone-pl-chips__row">
                {playlists.map((playlist, index) => (
                    <button key={index} type="button" className={`phone-pl-chip${index === active ? ' is-current' : ''}`} data-phone-action="show-playlist" data-playlist-index={index} aria-pressed={index === active} onClick={() => onShow(index)}>
                        <span className="phone-pl-chip__name">{`${index + 1} · ${playlistNameOf(playlist, index)}`}</span>
                        <span className="phone-pl-chip__meta">{playlistSummary(playlist)}</span>
                    </button>
                ))}
            </div>
        </nav>
    )
}

function PhoneTrack({ track, playlistIndex, trackIndex, lit, onOptions }: { track: Playlist['tracks'] extends (infer R)[] | undefined ? R : never; playlistIndex: number; trackIndex: number; lit: boolean; onOptions: () => void }) {
    const title = track?.title || t('playlists.phone.untitled')
    const sub = subLineOf(track)
    return (
        <li className={`track-row phone-track${lit ? ' is-moved' : ''}`} data-playlist-index={playlistIndex} data-track-index={trackIndex}>
            <span className="phone-track__pos" aria-hidden="true">{trackIndex + 1}<Icon name="GripVertical" className="phone-track__grip" /></span>
            <span className="phone-track__text">
                <span className="phone-track__title">{title}</span>
                {sub ? <span className="phone-track__sub">{sub}</span> : null}
            </span>
            <span className="phone-track__time">{formatTrackDuration(track?.duration)}</span>
            <button type="button" className="phone-more" data-phone-action="track-options" data-playlist-index={playlistIndex} data-track-index={trackIndex} aria-label={t('playlists.phone.trackActions', { title })} onClick={onOptions}><Dots /></button>
        </li>
    )
}

/** The open playlist: its title (typed over in place), its totals, its options and its tracks. */
function PhonePlaylist({ playlist, index, lit, actions, onTrackOptions, onPlaylistOptions }: { playlist: Playlist; index: number } & Pick<PhoneListProps, 'lit' | 'actions' | 'onTrackOptions' | 'onPlaylistOptions'>) {
    const name = playlistNameOf(playlist, index)
    const tracks = playlist?.tracks || []
    return (
        <section className="phone-pl" data-playlist-index={index} aria-label={name}>
            <header className="phone-pl__head">
                <div className="phone-pl__heading">
                    <h2 className="phone-pl__title"><EditableTitle index={index} title={name} className="playlist-name" onRename={actions.renamePlaylist} /></h2>
                    <p className="phone-pl__meta">{t('playlists.phone.position', { n: index + 1, summary: playlistSummary(playlist) })}</p>
                </div>
                <button type="button" className="phone-more" data-phone-action="playlist-options" data-playlist-index={index} aria-label={t('playlists.phone.playlistActions', { name })} onClick={() => onPlaylistOptions(index)}><Dots /></button>
            </header>
            <ol className="playlist-tracks phone-tracks" data-playlist-index={index}>
                {tracks.length === 0
                    ? <li className="phone-tracks__empty">{t('playlists.phone.noTracks')}</li>
                    : tracks.map((track, trackIndex) => (
                        <PhoneTrack key={trackIndex} track={track} playlistIndex={index} trackIndex={trackIndex} lit={lit?.playlist === index && lit.track === trackIndex} onOptions={() => onTrackOptions(index, trackIndex)} />
                    ))}
            </ol>
        </section>
    )
}

export function PhonePlaylists(props: PhoneListProps) {
    if (props.playlists.length === 0) return null
    return (
        <div className="phone-playlists md:hidden" data-phone-playlists="">
            <Chips playlists={props.playlists} active={props.active} onShow={props.onShow} />
            <PhonePlaylist playlist={props.playlists[props.active]} index={props.active} lit={props.lit} actions={props.actions} onTrackOptions={props.onTrackOptions} onPlaylistOptions={props.onPlaylistOptions} />
        </div>
    )
}

/** The action bar at the foot: Export (it opens a sheet with Spotify, Apple Music and JSON) and Save, the main action of the screen. */
export function PhoneActionBar({ isSaving, onExport, onSave }: { isSaving: boolean; onExport: () => void; onSave: () => void }) {
    return (
        <div className="phone-action-bar phone-pl-bar md:hidden">
            <button type="button" className="btn btn-secondary" data-phone-action="export" onClick={onExport}><Icon name="Share" className="w-5 h-5" />{` ${t('playlists.phone.export')}`}</button>
            {isSaving
                ? <button type="button" className="btn btn-primary" data-phone-action="save" disabled aria-busy="true"><Icon name="Loader" className="w-5 h-5 animate-spin" />{` ${t('playlists.phone.saving')}`}</button>
                : <button type="button" className="btn btn-primary" data-phone-action="save" onClick={onSave}><Icon name="Cloud" className="w-5 h-5" />{` ${t('playlists.phone.save')}`}</button>}
        </div>
    )
}

/** The top of the screen in one line: the batch name (the same field as the computer's) and undo and redo as two named icons of 44 px. */
export function PhoneNameRow({ value, canUndo, canRedo, onType, onUndo, onRedo }: { value: string; canUndo: boolean; canRedo: boolean; onType: (value: string) => void; onUndo: () => void; onRedo: () => void }) {
    return (
        <div id="batchNameSection" className="phone-batch md:hidden">
            <label htmlFor="batchNameInput" className="phone-batch__label">{t('playlists.phone.nameLabel')}</label>
            <div className="phone-batch__row">
                <input type="text" id="batchNameInput" className="phone-batch__input" autoComplete="off" value={value} placeholder={t('playlists.phone.namePlaceholder')} onChange={(event) => onType(event.target.value)} />
                <button type="button" className="phone-history__btn" data-action="undo-edit" aria-label={t('playlists.history.undoLabel')} disabled={!canUndo} onClick={onUndo}><Icon name="Undo" className="w-5 h-5" /></button>
                <button type="button" className="phone-history__btn" data-action="redo-edit" aria-label={t('playlists.history.redoLabel')} disabled={!canRedo} onClick={onRedo}><Icon name="Redo" className="w-5 h-5" /></button>
            </div>
        </div>
    )
}

// ───────────────────────────────────────── the notice «Track removed · Undo»

export interface Notice {
    text: string
    onUndo: () => void
}

/**
 * «Track removed · Undo», at the foot of the phone, above the action bar. A removal on the phone is not asked about first: it happens,
 * and this notice offers to take it back for a few seconds (for a repeated destructive action an Undo in view beats a confirmation every
 * time). One at a time; a new one replaces the old. It is drawn into the body of the page, as the old one was, out of the screen's box.
 */
export function useUndoNotice(): { show: (notice: Notice) => void; layer: ReactNode } {
    const [notice, setNotice] = useState<Notice | null>(null)
    useEffect(() => {
        if (!notice) return undefined
        const timer = setTimeout(() => setNotice(null), UNDO_NOTICE_MS)
        return () => clearTimeout(timer)
    }, [notice])
    const layer = notice
        ? createPortal(
            <div className="phone-undo" role="status">
                <span className="phone-undo__text">{notice.text}</span>
                <button type="button" className="phone-undo__btn" onClick={() => { setNotice(null); notice.onUndo() }}>{t('playlists.notice.undo')}</button>
            </div>, document.body)
        : null
    return { show: setNotice, layer }
}

// ───────────────────────────────────────── the sheets

/** One row of a sheet of actions: an icon, a name, a tap. 56 px tall (playlists.css). */
function SheetAction({ icon, text, onTap, danger = false, disabled = false }: { icon: string; text: ReactNode; onTap: () => void; danger?: boolean; disabled?: boolean }) {
    return (
        <button type="button" className={`phone-sheet-action${danger ? ' phone-sheet-action--danger' : ''}`} disabled={disabled} onClick={onTap}>
            <Icon name={icon} className="phone-sheet-action__icon" /><span>{text}</span>
        </button>
    )
}

const ActionList = ({ children }: { children: ReactNode }) => <div className="phone-sheet-actions">{children}</div>
const Heading = ({ text }: { text: string }) => <p className="phone-sheet-heading">{text}</p>

export interface SheetDeps {
    /** What the controller does (deleteTrack, undo, deletePlaylist). */
    controller: { deleteTrack: (p: number, t: number) => unknown; undo: () => unknown; deletePlaylist: (p: number) => unknown }
    notify: (notice: Notice) => void
    lightUp: (playlist: number, track: number) => void
    rename: (playlistIndex: number) => void
    regenerate: () => void
}

/** Move a track as the drag does (the service records the step, so Undo takes it back). */
const moveTrack = (from: number, to: number, oldIndex: number, newIndex: number): void => getPlaylistsService().moveTrack(from, to, oldIndex, newIndex)

function TrackSheet({ deps, playlistIndex, trackIndex, close }: { deps: SheetDeps; playlistIndex: number; trackIndex: number; close: () => void }) {
    const playlists = playlistsStore.getPlaylists() as Playlist[]
    const track = playlists[playlistIndex]?.tracks?.[trackIndex]
    if (!track) return null
    const title = track.title ?? ''
    const last = (playlists[playlistIndex].tracks?.length ?? 1) - 1
    // a move by the sheet says where the track went, with Undo, and lights the row (recheck N20)
    const moved = (toPlaylist: number, toIndex: number) => {
        const where = toPlaylist === playlistIndex ? t('playlists.notice.movedTo', { title, n: toIndex + 1 }) : t('playlists.notice.movedPlaylist', { title, n: toPlaylist + 1 })
        deps.notify({ text: where, onUndo: () => deps.controller.undo() })
        deps.lightUp(toPlaylist, toIndex)
    }
    const within = (to: number) => () => { close(); moveTrack(playlistIndex, playlistIndex, trackIndex, to); moved(playlistIndex, to) }
    const remove = () => {
        close()
        deps.controller.deleteTrack(playlistIndex, trackIndex)
        deps.notify({ text: t('playlists.notice.removed', { title }), onUndo: () => deps.controller.undo() })
    }
    const others = playlists.map((playlist, index) => (index === playlistIndex ? null : (
        <SheetAction key={index} icon="ListMusic" text={`${index + 1} · ${playlistNameOf(playlist, index)}`} onTap={() => {
            close()
            const end = (playlist.tracks || []).length
            moveTrack(playlistIndex, index, trackIndex, end)
            moved(index, end)
        }} />
    ))).filter(Boolean)
    return (
        <>
            <ActionList>
                <SheetAction icon="ArrowUp" text={t('playlists.sheet.moveUp')} onTap={within(trackIndex - 1)} disabled={trackIndex === 0} />
                <SheetAction icon="ChevronDown" text={t('playlists.sheet.moveDown')} onTap={within(trackIndex + 1)} disabled={trackIndex === last} />
                <SheetAction icon="ArrowUp" text={t('playlists.sheet.moveTop')} onTap={within(0)} disabled={trackIndex === 0} />
                <SheetAction icon="ChevronDown" text={t('playlists.sheet.moveEnd')} onTap={within(last)} disabled={trackIndex === last} />
            </ActionList>
            {others.length ? <Heading text={t('playlists.sheet.moveTo')} /> : null}
            {others.length ? <ActionList>{others}</ActionList> : null}
            <ActionList><SheetAction icon="Trash2" text={t('playlists.sheet.remove')} onTap={remove} danger /></ActionList>
        </>
    )
}

/** Deleting a whole playlist is asked first (the computer deletes on one click; here it is a sheet away). */
async function confirmDeletePlaylist(deps: SheetDeps, playlistIndex: number, name: string): Promise<void> {
    const confirmed = await dialogService.confirm({
        title: t('playlists.confirm.title'),
        message: t('playlists.confirm.message', { name }),
        confirmText: t('playlists.confirm.ok'),
        variant: 'danger'
    })
    if (confirmed) await deps.controller.deletePlaylist(playlistIndex)
}

function PlaylistSheet({ deps, playlistIndex, close }: { deps: SheetDeps; playlistIndex: number; close: () => void }) {
    const playlist = (playlistsStore.getPlaylists() as Playlist[])[playlistIndex]
    if (!playlist) return null
    const name = playlistNameOf(playlist, playlistIndex)
    const after = (act: () => void) => () => { close(); act() }
    return (
        <>
            <ActionList>
                <SheetAction icon="Edit" text={t('playlists.sheet.rename')} onTap={after(() => deps.rename(playlistIndex))} />
                <SheetAction icon="RefreshCw" text={t('playlists.sheet.regenerate')} onTap={after(deps.regenerate)} />
            </ActionList>
            <ActionList><SheetAction icon="Trash2" text={t('playlists.sheet.delete')} danger onTap={after(() => { void confirmDeletePlaylist(deps, playlistIndex, name) })} /></ActionList>
        </>
    )
}

/** The Apple Music export writes its progress on the row pressed: the sheet stays open to show it. */
function AppleRow() {
    const [status, setStatus] = useState<string | null>(null)
    return (
        <button type="button" className="phone-sheet-action" disabled={status !== null} onClick={() => { void exportToAppleMusic(setStatus) }}>
            {status === null
                ? <><Icon name="Apple" className="phone-sheet-action__icon" /><span>{t('playlists.actions.apple')}</span></>
                : <><Icon name="Apple" className="w-5 h-5" />{` ${status}`}</>}
        </button>
    )
}

function ExportSheet({ close }: { close: () => void }) {
    return (
        <ActionList>
            <SheetAction icon="Spotify" text={t('playlists.actions.spotify')} onTap={() => { close(); void openSpotifyExport() }} />
            <AppleRow />
            <SheetAction icon="Download" text={t('playlists.actions.json')} onTap={() => { close(); void exportJson() }} />
        </ActionList>
    )
}

/** The three sheets of the phone, over the one sheet window. */
export function usePhoneSheets(deps: SheetDeps): { openTrack: (p: number, t: number) => void; openPlaylist: (p: number) => void; openExport: () => void; layer: ReactNode } {
    const sheet = useSheetWindow()
    const closeLabel = t('playlists.phone.close')
    const openTrack = (playlistIndex: number, trackIndex: number) => {
        const track = (playlistsStore.getPlaylists() as Playlist[])[playlistIndex]?.tracks?.[trackIndex]
        if (!track) return
        sheet.show({ title: track.title || t('playlists.sheet.track'), closeLabel, render: (close) => <TrackSheet deps={deps} playlistIndex={playlistIndex} trackIndex={trackIndex} close={close} /> })
    }
    const openPlaylist = (playlistIndex: number) => {
        const playlist = (playlistsStore.getPlaylists() as Playlist[])[playlistIndex]
        if (!playlist) return
        sheet.show({ title: playlistNameOf(playlist, playlistIndex), closeLabel, render: (close) => <PlaylistSheet deps={deps} playlistIndex={playlistIndex} close={close} /> })
    }
    const openExport = () => sheet.show({ title: t('playlists.sheet.exportTitle'), closeLabel, render: (close) => <ExportSheet close={close} /> })
    return { openTrack, openPlaylist, openExport, layer: sheet.layer }
}

/** The phone's chip strip follows the open chip after every draw. */
export function useRevealChip(root: React.RefObject<HTMLElement | null>, active: number): void {
    const seen = useRef(-1)
    useLayoutEffect(() => {
        if (seen.current !== active) revealCurrentChip(root.current)
        seen.current = active
    })
}
