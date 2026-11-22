/**
 * Playlists - the playlists screen (/playlists and /playlists/edit): the set of playlists the blend made, or a saved batch being edited,
 * to rename, reorder by drag, take tracks out of, generate again, save and export (F83 wave 2; it was views/PlaylistsView.js, with the
 * same look and the same behaviour).
 *
 * The set lives in the playlists store and is changed only by the service (an edit makes a new list, see the map of the wave); this
 * screen reads what the stores hold now, while it draws, and draws again when one of the three it read (playlists, series, albums) says
 * it changed. Nothing derived from the lists is kept (`useMemo`, `React.memo`): `applyBatchName` still writes inside the playlists.
 * The batch name is the one thing the store is silent about (`setBatchName` does not notify, so the cursor stays): the screen keeps what
 * was typed, as the field's own state, and writes it to the store as well.
 * Kept hand-made behind a bridge: the panel to generate again (also the Blend controller's) and the Spotify window; the drag is
 * `sortablejs` behind a bridge that puts the row back where React had it (react-bridge/sortableTracks.ts).
 */
import { useFocusLikeAfterAnewDraw } from '../../react-bridge/useFocusLikeAfterAnewDraw'
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from 'react'
import { Icon } from '../../ui/Icon'
import { Breadcrumb, playlistsTrail } from '../../ui/Breadcrumb'
import { LegacyRegeneratePanel, resetRegeneratePanel, showRegeneratePanel } from '../../react-bridge/legacy/RegeneratePanel'
import { exportJson, openSpotifyExport } from '../../react-bridge/legacy/OutputWindows'
import { usePlaylistExport } from '../../ui/PlaylistExportWindow'
import { useSortableTracks } from '../../react-bridge/sortableTracks'
import { countListener } from '../../react-bridge/listeners'
import { useLocale } from '../../react-bridge/useLocale'
import { usePhone } from '../../react-bridge/usePhone'
import { useStore } from '../../react-bridge/useStore'
import { navigate } from '../../react-bridge/navigation'
import { t } from '../../i18n/t.js'
import { router } from '../../router.js'
import { playlistsStore } from '../../stores/playlists.js'
import { albumsStore } from '../../stores/albums.js'
import { albumSeriesStore } from '../../stores/albumSeries.js'
import { getPlaylistsService } from '../../services/playlists/playlistsWiring.js'
import type { PlaylistsController } from '../../controllers/PlaylistsController.js'
import { PlaylistCards } from './PlaylistCards'
import { PhoneActionBar, PhoneNameRow, PhonePlaylists, useRevealChip, useUndoNotice, usePhoneSheets } from './PhoneParts'
import { generatedWithOf, activeIndexOf } from './text'
import { installUnsavedChangesGuard } from './unsavedChangesGuard'
import type { Playlist, PlaylistActions } from './types'

/** Whether the controller is generating: it says so by `isGenerating` and `update()`, as it did to the hand-made view. */
export class GeneratingFlag {
    isGenerating = false
    private readonly listeners = new Set<() => void>()
    update(): void {
        this.listeners.forEach(listener => listener())
    }
    subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener)
        const release = countListener()
        return () => {
            this.listeners.delete(listener)
            release()
        }
    }
}

interface Props {
    controller: PlaylistsController
    generating: GeneratingFlag
}

const HISTORY_BUTTON = 'btn btn-secondary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed'

function HistoryButton({ action, icon, text, label, enabled, onTap }: { action: string; icon: string; text: string; label: string; enabled: boolean; onTap: () => void }) {
    return (
        <button className={HISTORY_BUTTON} data-action={action} aria-label={label} title={label} disabled={!enabled} onClick={onTap}>
            {' '}<Icon name={icon} className="w-5 h-5" />{` ${text} `}
        </button>
    )
}

interface ExportProps {
    isSaving: boolean
    canUndo: boolean
    canRedo: boolean
    onUndo: () => void
    onRedo: () => void
    onSave: () => void
    onApple: (button: HTMLButtonElement) => void
}

/** The actions of the screen on the computer: undo, redo, save, and the three exports. */
function ExportSection({ isSaving, canUndo, canRedo, onUndo, onRedo, onSave, onApple }: ExportProps) {
    return (
        <div className="export-section glass-panel p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Icon name="Save" className="w-5 h-5" />{` ${t('playlists.actions.heading')} `}</h3>
            <div className="export-actions flex flex-wrap gap-4">
                <HistoryButton action="undo-edit" icon="Undo" text={t('playlists.history.undo')} label={t('playlists.history.undoLabel')} enabled={canUndo} onTap={onUndo} />
                <HistoryButton action="redo-edit" icon="Redo" text={t('playlists.history.redo')} label={t('playlists.history.redoLabel')} enabled={canRedo} onTap={onRedo} />
                <div className="h-auto w-px bg-white/10 mx-2" />
                {isSaving
                    ? <button className="btn btn-success flex items-center gap-2" id="saveToHistoryBtn" disabled aria-busy="true">{' '}<Icon name="Loader" className="w-4 h-4 animate-spin" />{` ${t('playlists.actions.saving')} `}</button>
                    : <button className="btn btn-success flex items-center gap-2" id="saveToHistoryBtn" onClick={onSave}>{' '}<Icon name="Cloud" className="w-5 h-5" />{` ${t('playlists.actions.save')} `}</button>}
                <div className="h-auto w-px bg-white/10 mx-2" />
                <button className="btn flex items-center gap-2 text-white font-semibold shadow-lg hover:scale-[1.02] transition-all duration-300" style={{ background: 'linear-gradient(135deg, #1DB954 0%, #1ed760 100%)' }} id="exportSpotifyBtn" onClick={() => { void openSpotifyExport() }}>
                    {' '}<Icon name="Spotify" className="w-5 h-5" />{` ${t('playlists.actions.spotify')} `}
                </button>
                <button className="btn flex items-center gap-2 bg-gradient-to-r from-[#FF4D00] to-[#FF8800] hover:from-[#FF8800] hover:to-[#FFCC00] text-white font-semibold shadow-lg hover:shadow-[#FF4D00]/30 transition-all duration-300" id="exportAppleMusicBtn" onClick={(event) => onApple(event.currentTarget)}>
                    {' '}<Icon name="Apple" className="w-5 h-5" />{` ${t('playlists.actions.apple')} `}
                </button>
                <button className="btn btn-secondary flex items-center gap-2" id="exportJsonBtn" onClick={() => { void exportJson() }}>{' '}<Icon name="Download" className="w-5 h-5" />{` ${t('playlists.actions.json')} `}</button>
            </div>
        </div>
    )
}

function Header({ editing, editedName, onNavigate }: { editing: boolean; editedName: string; onNavigate: (path: string) => void }) {
    return (
        <header className="view-header mb-8 fade-in">
            <Breadcrumb crumbs={playlistsTrail(editing)} onNavigate={onNavigate} />
            <div className="header-content mt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h1 className="text-2xl md:text-4xl font-bold flex items-center gap-3">
                    <Icon name={editing ? 'Edit' : 'Music'} className="w-8 h-8" />{` ${t(editing ? 'playlists.title.edit' : 'playlists.title.manage')} `}
                </h1>
                <div className="header-actions flex flex-wrap items-center gap-4 w-full md:w-auto">
                    {editing && editedName ? <span className="badge badge-success px-3 py-1 rounded-full text-sm">{t('playlists.badge.editing', { name: editedName })}</span> : null}
                </div>
            </div>
        </header>
    )
}

function NotFound({ name }: { name: string }) {
    return (
        <div className="alert alert-error bg-red-500/10 border border-red-500/20 text-red-200 p-6 rounded-xl mb-6">
            <div className="flex items-center gap-3">
                <Icon name="AlertTriangle" className="w-8 h-8 text-red-500" />
                <div>
                    <h3 className="font-bold text-lg">{t('playlists.notFound.title')}</h3>
                    <p className="text-sm opacity-80">{t('playlists.notFound.body', { name })}</p>
                    <p className="text-xs mt-2">{t('playlists.notFound.hint')}</p>
                </div>
            </div>
            <div className="mt-4 flex gap-4">
                <a href="/saved-playlists" className="btn btn-sm btn-ghost hover:bg-white/10">{t('playlists.notFound.back')}</a>
            </div>
        </div>
    )
}

function EmptyState() {
    return (
        <div className="glass-panel max-w-2xl mx-auto text-center p-8 mb-6" data-playlists-empty="">
            <h3 className="text-lg font-bold mb-2 flex items-center justify-center gap-2"><Icon name="Music" className="w-5 h-5" />{` ${t('playlists.empty.title')}`}</h3>
            <p className="text-muted mb-6">{t('playlists.empty.body')}</p>
            <a href="/blend" data-link="" className="btn btn-primary">{t('playlists.empty.go')}</a>
        </div>
    )
}

/** The field of the batch name on the computer: always there, even before a save, so the batch can be named. */
function BatchNameField({ value, onType }: { value: string; onType: (value: string) => void }) {
    return (
        <div id="batchNameSection" className="mb-6 fade-in glass-panel p-4 rounded-xl" style={{ animationDelay: '0.03s' }}>
            <label htmlFor="batchNameInput" className="block text-sm font-medium mb-2">{t('playlists.batchName.label')}</label>
            <input type="text" id="batchNameInput" value={value} className="input input-bordered w-full max-w-md bg-white/5 border-white/10 rounded-lg px-4 py-2" placeholder={t('playlists.batchName.placeholder')} onChange={(event) => onType(event.target.value)} />
        </div>
    )
}

function GeneratingOverlay() {
    return (
        <div className="loading-overlay">
            <div className="loading-content">
                <div className="loading-spinner" />
                <p className="loading-text">{t('playlists.generating')}</p>
            </div>
        </div>
    )
}

/** What the person typed in the batch name field, while it is what the store holds: the store is silent about it (the cursor stays). */
function useTypedName(storeName: string, shown: string): { value: string; onType: (value: string) => void } {
    const [typed, setTyped] = useState<string | null>(null)
    const onType = (value: string) => {
        playlistsStore.setBatchName(value)
        setTyped(value)
    }
    // The screen was drawn again for another reason (the store told something): the field shows what the screen shows, as the hand-made
    // screen did when it drew everything anew, so a name cleared by hand goes back to the default one. Typing tells nobody (`setBatchName`
    // is silent), so the cursor stays.
    useEffect(() => playlistsStore.subscribe(() => setTyped(null)) as () => void, [])
    // the service changed the name under the field (a save, a batch opened): the store's wins again
    return { value: typed !== null && typed === storeName ? typed : shown, onType }
}

type State = ReturnType<typeof playlistsStore.getState>

/** The phone shows one playlist at a time: which, the row lit after a move, and the page going back to the top of the one just opened. */
function usePhoneOpening(box: RefObject<HTMLDivElement | null>, count: number) {
    const [active, setActive] = useState(0)
    const [lit, setLit] = useState<{ playlist: number; track: number } | null>(null)
    const stuck = useRef(false)
    const open = activeIndexOf(count, active)
    useRevealChip(box, open)
    useLayoutEffect(() => {
        if (!stuck.current) return
        stuck.current = false
        box.current?.querySelector('#playlistsGrid')?.scrollIntoView({ block: 'start' })
    }, [open, box])
    const show = (index: number) => {
        stuck.current = (box.current?.querySelector('#playlistsGrid')?.getBoundingClientRect().top ?? 0) < 0
        setActive(index)
    }
    const lightUp = (playlist: number, track: number) => {
        setTimeout(() => {
            setLit({ playlist, track })
            setTimeout(() => setLit(null), 1200)
        }, 60)
    }
    return { open, lit, show, lightUp }
}

/** Put the cursor in the title of a playlist, its text chosen, to type over it. */
function focusTitle(root: HTMLElement | null, index: number): void {
    const field = root?.querySelector<HTMLElement>(`.phone-pl .playlist-name[data-playlist-index="${index}"]`)
    if (!field) return
    field.focus()
    const range = document.createRange()
    range.selectNodeContents(field)
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
}

/** What the person does on the screen, as the controller does it. */
function useScreenActions(controller: PlaylistsController, nameValue: string) {
    const actions: PlaylistActions = {
        removeTrack: (p, i) => { void controller.deleteTrack(p, i) },
        deletePlaylist: (p) => { void controller.deletePlaylist(p) },
        renamePlaylist: (p, title) => { void controller.renamePlaylist(p, title) }
    }
    return {
        actions,
        undo: () => { void controller.undo() },
        redo: () => { void controller.redo() },
        save: () => { void controller.handleSave(nameValue || null) },
        regenerate: async (config: object) => {
            const generated = await controller.handleGenerate(config)
            // the new playlists carry their recipe: the panel follows them again
            if (generated) resetRegeneratePanel()
        }
    }
}

interface ControlsProps {
    state: State
    playlists: Playlist[]
    editing: boolean
    phone: boolean
    nameValue: string
    onType: (value: string) => void
    activeSeriesId: string | undefined
    todo: ReturnType<typeof useScreenActions>
}

/** The batch name, the panel to generate again (or the batch that was not found) and, on the computer, the actions. */
function Controls({ state, playlists, editing, phone, nameValue, onType, activeSeriesId, todo }: ControlsProps) {
    const exporting = usePlaylistExport() // F90: Apple Music asks for the folder first, in the window the saved playlists screen opens too
    return (
        <>
            {phone
                ? <PhoneNameRow value={nameValue} canUndo={state.canUndo} canRedo={state.canRedo} onType={onType} onUndo={todo.undo} onRedo={todo.redo} />
                : <BatchNameField value={nameValue} onType={onType} />}
            <div id="generationControlContainer">
                <Generation playlists={playlists} editing={editing} originalName={state.editContext?.originalBatchName} seriesId={activeSeriesId} onRegenerate={todo.regenerate} />
            </div>
            {phone ? null : (
                <div id="exportSection" className="mb-6 fade-in" style={{ animationDelay: '0.08s' }}>
                    {playlists.length > 0 ? <ExportSection isSaving={state.isSaving} canUndo={state.canUndo} canRedo={state.canRedo} onUndo={todo.undo} onRedo={todo.redo} onSave={todo.save} onApple={(button) => exporting.open({ start: 'apple', title: t('exportWindow.apple'), opener: button })} /> : null}
                </div>
            )}
            {exporting.layer}
        </>
    )
}

interface GenerationProps {
    playlists: Playlist[]
    editing: boolean
    originalName: string | undefined
    seriesId: string | undefined
    onRegenerate: (config: object) => Promise<void>
}

function Generation({ playlists, editing, originalName, seriesId, onRegenerate }: GenerationProps) {
    if (playlists.length > 0) {
        const ids = playlists.map(playlist => playlist.id).filter((id): id is string => Boolean(id))
        return <LegacyRegeneratePanel seriesId={seriesId} batchName={playlists[0].batchName || 'New Batch'} ids={ids} count={playlists.length} generatedWith={generatedWithOf(playlists) ?? null} onRegenerate={(config) => { void onRegenerate(config) }} />
    }
    return editing ? <NotFound name={originalName || t('playlists.notFound.unknown')} /> : null
}

/** The batch name on screen: what was typed, the name of the batch being edited, or the default one. */
const shownNameOf = (state: State): string => state.batchName || state.editContext?.currentBatchName || state.defaultBatchName || ''

/** What drags a track: the whole row on a computer; on the phone only its position (a 44 px handle), so a finger that scrolls never picks one up (F76). */
const handleOf = (phone: boolean): string => (phone ? '.phone-track__pos' : '.track-row')

interface LayoutProps {
    box: RefObject<HTMLDivElement | null>
    state: State
    playlists: Playlist[]
    editing: boolean
    phone: boolean
    isGenerating: boolean
    activeSeriesId: string | undefined
    name: { value: string; onType: (value: string) => void }
    todo: ReturnType<typeof useScreenActions>
    opening: ReturnType<typeof usePhoneOpening>
    sheets: ReturnType<typeof usePhoneSheets>
    noticeLayer: ReactNode
}

/** The name the batch being edited is saved under. */
const editedNameOf = (state: State): string => state.editContext?.originalBatchName || state.batchName || ''

interface ListsProps {
    phone: boolean
    playlists: Playlist[]
    batchName: string
    actions: PlaylistActions
    opening: ReturnType<typeof usePhoneOpening>
    sheets: ReturnType<typeof usePhoneSheets>
}

/** The playlists: all side by side on the computer, one at a time on the phone (F76). */
function TheLists({ phone, playlists, batchName, actions, opening, sheets }: ListsProps) {
    if (!phone) return <PlaylistCards playlists={playlists} batchName={batchName} actions={actions} />
    return <PhonePlaylists playlists={playlists} active={opening.open} lit={opening.lit} actions={actions} onShow={opening.show} onTrackOptions={sheets.openTrack} onPlaylistOptions={sheets.openPlaylist} />
}

/** The page of the screen: the header, the controls, the playlists (all side by side, or one at a time on the phone), the foot. */
function Layout({ box, state, playlists, editing, phone, isGenerating, activeSeriesId, name, todo, opening, sheets, noticeLayer }: LayoutProps) {
    const nothingHere = playlists.length === 0 && !editing
    return (
        <div className="playlists-view container" ref={box}>
            <Header editing={editing} editedName={editedNameOf(state)} onNavigate={navigate} />
            {nothingHere ? null : <Controls state={state} playlists={playlists} editing={editing} phone={phone} nameValue={name.value} onType={name.onType} activeSeriesId={activeSeriesId} todo={todo} />}
            <div id="mainContent" className="fade-in" style={{ animationDelay: '0.1s' }}>
                {nothingHere ? <EmptyState /> : null}
                <div id="playlistsGrid">
                    <TheLists phone={phone} playlists={playlists} batchName={name.value} actions={todo.actions} opening={opening} sheets={sheets} />
                </div>
            </div>
            {phone && playlists.length > 0 ? <PhoneActionBar isSaving={state.isSaving} onExport={sheets.openExport} onSave={todo.save} /> : null}
            {isGenerating ? <GeneratingOverlay /> : null}
            <footer className="view-footer mt-12 text-center text-muted text-sm border-t border-white/5 pt-6">
                <p className="last-update">{t('playlists.lastUpdated', { time: new Date().toLocaleTimeString() })}</p>
            </footer>
            {sheets.layer}
            {noticeLayer}
        </div>
    )
}

export function Playlists({ controller, generating }: Props) {
    useFocusLikeAfterAnewDraw()
    useLocale()
    const phone = usePhone()
    const state = useStore(playlistsStore, store => store.getState())
    const activeSeries = useStore(albumSeriesStore, store => store.getActiveSeries())
    useStore(albumsStore, () => 0) // the foot says when the screen was drawn: the hand-made screen drew again when the albums store told
    const isGenerating = useSyncExternalStore(generating.subscribe, () => generating.isGenerating)
    const playlists = state.playlists as Playlist[]
    const name = useTypedName(state.batchName, shownNameOf(state))
    const todo = useScreenActions(controller, name.value)
    const box = useRef<HTMLDivElement>(null)
    const opening = usePhoneOpening(box, playlists.length)
    const notice = useUndoNotice()
    const sheets = usePhoneSheets({ controller, notify: notice.show, lightUp: opening.lightUp, rename: (index) => focusTitle(box.current, index), regenerate: () => showRegeneratePanel(box.current) })

    // Leaving with work that is not saved asks first (F60)
    useEffect(() => installUnsavedChangesGuard({ router, hasUnsavedChanges: () => getPlaylistsService().hasUnsavedChanges() === true }), [])
    useSortableTracks(box, {
        handle: handleOf(phone),
        onMove: ({ fromPlaylist, toPlaylist, oldIndex, newIndex }) => getPlaylistsService().moveTrack(fromPlaylist, toPlaylist, oldIndex, newIndex)
    })

    return <Layout box={box} state={state} playlists={playlists} editing={playlistsStore.isEditingExistingBatch()} phone={phone} isGenerating={isGenerating} activeSeriesId={activeSeries?.id} name={name} todo={todo} opening={opening} sheets={sheets} noticeLayer={notice.layer} />
}
