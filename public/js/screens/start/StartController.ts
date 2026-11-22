/**
 * StartController - the state of the Start screen (/start, the old Home; F79, moved to React in F83 wave 4; it was controllers/HomeController.js).
 *
 * One stage to find albums, a dock with the series being built, and «Create series». It holds the state of the screen: the mode of the
 * field (an artist or a pasted list), the name (suggested from the artists, or typed), where the creation is, the «Undo» of the last
 * removal or «Add all», the series panel open or not, the lines of the pasted list. The rules are in homeSeries.ts and homePaste.ts; the
 * albums of the series in StagingArea.ts; the search in the one album picker (F57), of which the screen is a frame.
 *
 * The hand-made view was told what to draw (`view.draw*`); the screen in React asks this object what to draw: every change calls
 * `touch()`, which tells the listeners (the screen draws again) and moves a version the screen compares. The names of the methods and
 * of the fields are the ones the old controller had, because the browser proof of the Home (test/visual/visual.config.mjs, F84) drives
 * the page through `window.controller`: `search`, `clickCard`, `addAll`, `setName`, `setMode`, `addPastedList`, `createSeries`,
 * `toggleOpen`, `move`, `removeWithUndo`, `redraw`, `state.guest`, `picker.service`, `albumSearchService`, `writeSeries` and
 * `view.pasteList.value()`.
 *
 * `model` is the picture of the dock taken at each `redraw()`, as the old dock was drawn from the one it was last given: typing the name
 * does not take a picture (the field reads the name as it is now), so the words around it stay as they were until the next one.
 */
import { albumSearchService } from '../../services/album-search/AlbumSearchService.js'
import { AlbumPickerController } from '../../ui/albumPicker/pickerController'
import { albumSeriesStore } from '../../stores/albumSeries.js'
import { userStore } from '../../stores/UserStore.js'
import { getSeriesService } from '../../services/SeriesService.js'
import { router } from '../../router.js'
import { openLoginWindow } from '../../stores/loginWindow.js'
import { isSignedIn } from '../../utils/isSignedIn.js'
import { toAlbumQuery } from '../../models/albumQuery.js'
import { decodeEntities } from '../../models/text.js'
import { isPhone } from '../../utils/isPhone.js'
import { ScanStatus } from '../../models/scanState.js'
import { visibleAlbums } from '../../models/albumPicker.js'
import { readPastedList, toStagedAlbum, SkipReason } from '../../models/bulkPaste.js'
import { t } from '../../i18n/t.js'
import { countListener } from '../../react-bridge/listeners'
import { StagingAreaController } from './StagingArea'
import { pasteReport, type PasteReport } from './homePaste'
import { NameState, nameAfterChange, suggestName, flameOf, type NameStateValue, type SeriesAlbum } from './homeSeries'

/** How long «Undo» stays after a removal or «Add all» (D9). */
export const UNDO_MS = 8000

/** Where the series is when it is created. */
export const CreateState = Object.freeze({ IDLE: 'idle', NO_NAME: 'noname', CREATING: 'creating', CREATED: 'created', FAILED: 'failed' })
export type CreateStateValue = (typeof CreateState)[keyof typeof CreateState]

export interface Undo {
    kind: 'remove' | 'addall'
    album?: SeriesAlbum
    index?: number
    before?: SeriesAlbum[]
    n?: number
}

export interface ScreenState {
    mode: 'artist' | 'paste'
    name: string
    nameState: NameStateValue
    create: CreateStateValue
    created: { id: string; name: string; count: number } | null
    failure: string
    /** Whether the failure said the connection dropped (the phone says it in short). */
    failureNetwork: boolean
    open: boolean
    moved: { id: string; dir: 'up' | 'down' } | null
    undo: Undo | null
    report: boolean
    guest: boolean
}

/** What the dock is drawn from: the picture taken at each `redraw()`. */
export interface DockModel {
    albums: SeriesAlbum[]
    name: string
    nameState: NameStateValue
    suggestion: string
    create: CreateStateValue
    created: ScreenState['created']
    failure: string
    failureNetwork: boolean
    open: boolean
    moved: ScreenState['moved']
    undo: Undo | null
    guest: boolean
    flame: 'search' | 'create' | 'blend' | 'none'
    coversOnScreen: boolean
}

export interface Scan {
    status: string
    generation: number
    query: string
    artist: string | null
    albums: SeriesAlbum[]
    classifying: boolean
    failure: string | null
}

/** One line of the pasted list; `why` is what the report said of it (only while the report is shown). */
export interface PasteLine {
    id: number
    text: string
    why: string
}

export interface PasteState {
    lines: PasteLine[]
    report: PasteReport | null
    busy: boolean
}

/** Where the focus is asked to go after the next draw. */
export type FocusRequest =
    | { to: 'artist' }
    | { to: 'pasteEnd' }
    | { to: 'pasteLine'; id: number; atEnd: boolean }
    | { to: 'name' }

/** The save failed: say a cause only when it is known (the connection), never guess one. */
function failureOf(error: { code?: string; message?: string } | null): { failure: string; failureNetwork: boolean } {
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false
    const network = offline || error?.code === 'unavailable' || /network|offline|fetch/i.test(String(error?.message || ''))
    return { failure: t(network ? 'start.dock.failed.network' : 'start.dock.failed.other'), failureNetwork: network }
}

/** Nobody signed in with an account of their own (a guest session is not one), once the login has said who is there. */
const isGuest = ({ currentUser, loading }: { currentUser?: unknown; loading?: boolean } = {}): boolean => !loading && !isSignedIn(currentUser)

/** A selector that finds a control of the dock again after the dock is drawn anew: its id, or its gesture and the album it is for. */
function selectorOf(control: HTMLElement): string | null {
    if (control.id) return `#${control.id}`
    const { dock, id } = control.dataset
    if (!dock) return null
    return id ? `[data-dock="${dock}"][data-id="${id.replace(/["\\]/g, '\\$&')}"]` : `[data-dock="${dock}"]`
}

export class StartController {
    albumSearchService = albumSearchService
    state: ScreenState
    scan: Scan | null = null
    /** How many albums were in the series when the scan last changed: the sentence of a failed search says it as it was then. */
    chosenAtScan = 0
    model: DockModel | null = null
    /** The picture of the dock the name field of the sheet is drawn from: it is not taken while the person types in that field. */
    sheetName: DockModel | null = null
    sheetNameDraw = 0
    /** The kind of message the box of the results wrote last (it keeps its role and its tone until it writes another). */
    lastMessage: 'empty' | 'failed' | null = null
    /** How many times the dock was drawn anew and the grid of covers was drawn anew: a screen in React keys those parts on them, as the old one built them again. */
    dockDraws = 0
    gridDraws = 0
    /** Where the focus was in the dock when it was last drawn anew, to give it back (a selector and the selection of the text). */
    dockFocus: { selector: string; start: number | null; end: number | null } | null = null
    paste: PasteState
    focusRequest: { id: number; request: FocusRequest } | null = null
    fieldText = ''
    fieldFocused = false
    disposed = false
    readonly stagingController: StagingAreaController
    readonly picker: InstanceType<typeof AlbumPickerController>
    /** What the browser proof of the Home reaches for: the text of the pasted list. */
    readonly view = { pasteList: { value: () => this.pasteValue() } }
    private version = 0
    private nextId = 1
    private nextFocus = 1
    private readonly listeners = new Set<() => void>()
    private undoTimer: ReturnType<typeof setTimeout> | undefined
    private readonly stops: Array<() => void> = []

    constructor() {
        this.state = {
            mode: 'artist', name: '', nameState: NameState.NONE, create: CreateState.IDLE, created: null,
            failure: '', failureNetwork: false, open: false, moved: null, undo: null, report: false, guest: isGuest(userStore.getState())
        }
        this.paste = { lines: [this.line('')], report: null, busy: false }
        this.stagingController = new StagingAreaController({ onChange: () => this.seriesChanged() })
        // The one album picker (F57). The screen is its frame; what it does with a pick is the seam.
        this.picker = new AlbumPickerController({
            service: this.albumSearchService,
            view: {
                drawScan: (scan: Scan) => this.drawScan(scan),
                drawFilters: () => this.touch(),
                drawAlbums: () => { this.gridDraws += 1; this.touch() } // the covers are made again, as the old grid was
            },
            onPick: (album: unknown) => this.stagingController.addAlbum(album as SeriesAlbum),
            emptyQueryMessage: () => t('start.field.typeAnArtist')
        })
    }

    // --- what the screen listens to ---

    subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener)
        const release = countListener()
        return () => {
            this.listeners.delete(listener)
            release()
        }
    }

    getVersion = (): number => this.version

    private touch(): void {
        this.version += 1
        this.listeners.forEach(listener => listener())
    }

    initialize(): void {
        this.picker.start()
        this.stops.push(userStore.subscribe((user: Parameters<typeof isGuest>[0]) => {
            this.state.guest = isGuest(user)
            this.redraw()
        }))
        this.redraw()
    }

    /** The screen was left: what is still on its way draws nothing. */
    dispose(): void {
        this.disposed = true
        this.picker.dispose()
        clearTimeout(this.undoTimer)
        this.stops.splice(0).forEach(stop => stop())
    }

    // --- the search ---

    search(text: string): Promise<void> | undefined {
        if (this.state.mode !== 'artist') this.setMode('artist')
        return this.picker.searchArtist(text)
    }

    /** The picker says the scan changed: the stage, the line under the artist and the dock's note follow it. */
    private drawScan(scan: Scan): void {
        this.scan = scan
        this.chosenAtScan = this.albums().length
        const status = this.state.mode === 'paste' ? 'paste' : scan.status
        if (status === ScanStatus.EMPTY || status === ScanStatus.FAILED) this.lastMessage = status === ScanStatus.FAILED ? 'failed' : 'empty'
        if (status === ScanStatus.SCANNING) this.gridDraws += 1 // the skeleton covers are made again
        this.redraw()
    }

    // --- the field of the artist: what the stage says while it is typed in ---

    typed(text: string, focused: boolean): void {
        this.fieldText = text
        this.fieldFocused = focused
        this.touch()
    }

    focusChanged(focused: boolean): void {
        this.fieldFocused = focused
        this.touch()
    }

    /** True while the person is typing in the field of the artist: the hint points to Enter or Search. */
    isTyping(): boolean {
        return Boolean(this.fieldFocused && this.fieldText.trim())
    }

    // --- the field: an artist or a pasted list ---

    setMode(mode: string, text = ''): void {
        this.state.mode = mode === 'paste' ? 'paste' : 'artist'
        this.state.report = false
        if (this.state.mode === 'paste') this.setPasteText(text)
        this.picker.start() // the results of the scan drawn again for the mode
        this.redraw() // the dock's note follows: no covers on screen while the list is open
        this.askFocus(this.state.mode === 'paste' ? { to: 'pasteEnd' } : { to: 'artist' })
    }

    /** A list pasted in the field of the artist becomes the list (more than one line). */
    pasteIntoField(text: string): boolean {
        if (!/\r?\n/.test(text.trim())) return false
        this.setMode('paste', text.trim())
        return true
    }

    private askFocus(request: FocusRequest): void {
        this.focusRequest = { id: this.nextFocus++, request }
        this.touch()
    }

    // --- the pasted list ---

    private line(text: string, why = ''): PasteLine {
        return { id: this.nextId++, text, why }
    }

    pasteValue(): string {
        return this.paste.lines.map(line => line.text).join('\n')
    }

    /** The list from a text: one line per line of it. */
    private setPasteText(text: string): void {
        this.paste = { ...this.paste, report: null, lines: String(text ?? '').split(/\r?\n/).map(line => this.line(line)) }
    }

    /** A line was typed in: the list goes back to the check as it is typed. */
    pasteTyped(id: number, text: string): void {
        this.paste = { ...this.paste, report: null, lines: this.paste.lines.map(line => (line.id === id ? { ...line, text, why: '' } : line)) }
        this.touch()
    }

    /** Enter opens a new line after this one, and the focus goes to it. */
    pasteInsertAfter(id: number): void {
        const fresh = this.line('')
        const at = this.paste.lines.findIndex(line => line.id === id)
        const lines = [...this.paste.lines.slice(0, at + 1), fresh, ...this.paste.lines.slice(at + 1)]
        this.paste = { ...this.paste, report: null, lines }
        this.askFocus({ to: 'pasteLine', id: fresh.id, atEnd: false })
    }

    /** Backspace on an empty line closes it, and the focus goes to the line before (or after), at its end. */
    pasteRemove(id: number): void {
        const at = this.paste.lines.findIndex(line => line.id === id)
        const near = this.paste.lines[at - 1] ?? this.paste.lines[at + 1]
        this.paste = { ...this.paste, report: null, lines: this.paste.lines.filter(line => line.id !== id) }
        if (near) this.askFocus({ to: 'pasteLine', id: near.id, atEnd: true })
        else this.touch()
    }

    /** Several lines pasted in one line: the first goes after the text before the caret, one line each for the rest. */
    pasteSeveral(id: number, text: string, caret: number | null): void {
        const [first, ...rest] = text.split(/\r?\n/)
        const at = this.paste.lines.findIndex(line => line.id === id)
        const current = this.paste.lines[at]
        const start = caret ?? current.text.length
        const fresh = rest.map(line => this.line(line))
        const lines = [...this.paste.lines.slice(0, at), { ...current, text: current.text.slice(0, start) + first, why: '' }, ...fresh, ...this.paste.lines.slice(at + 1)]
        this.paste = { ...this.paste, report: null, lines }
        this.touch()
    }

    /**
     * «Add N albums»: every ready line is searched and added; a line that cannot go in stays, with why (F63).
     * @param text - the list
     */
    async addPastedList(text: string): Promise<void> {
        const pasted = readPastedList(text)
        if (pasted.entries.length === 0 && pasted.skipped.length === 0) return
        this.paste = { ...this.paste, busy: true }
        this.touch()
        try {
            const searched = await this.stageBulkEntries(pasted.entries)
            const report = pasteReport({ added: searched.added, skipped: [...pasted.skipped, ...searched.skipped] })
            this.state.report = true
            this.showReport(report)
            this.touch()
        } finally {
            // the report, when there is one, says what the button is now; with none, the list does
            this.paste = { ...this.paste, busy: false }
            this.touch()
        }
    }

    /** After «Add»: what went in and what stays to fix. */
    private showReport(report: PasteReport): void {
        const left = report.lines.length ? report.lines : [{ text: '', why: '' }]
        this.paste = { ...this.paste, report, lines: left.map(line => this.line(line.text, line.why)) }
    }

    /** Search each line in the catalog and add what is found. One line never stops the others. */
    private async stageBulkEntries(entries: Array<{ line: number; text: string; artist: string; title: string }>) {
        let added = 0
        const skipped: Array<{ line: number; text: string; reason: string }> = []
        for (const entry of entries) {
            const reason = await this.stageBulkEntry(entry)
            if (reason) skipped.push({ line: entry.line, text: entry.text, reason })
            else added++
        }
        return { added, skipped }
    }

    /** @returns null when the album went in, or why it did not (SkipReason) */
    private async stageBulkEntry({ artist, title }: { artist: string; title: string }): Promise<string | null> {
        let results
        try {
            results = await this.albumSearchService.search(artist, title, { limit: 1 })
        } catch (error) {
            console.error(`[Home] The search failed for: ${artist} - ${title}`, error)
            return SkipReason.SEARCH_FAILED
        }
        const match = results?.[0]
        if (!match) return SkipReason.NOT_FOUND
        if (this.stagingController.hasAlbum(match.id)) return SkipReason.ALREADY_SELECTED
        if (this.isCreated()) this.startAnother()
        this.stagingController.addAlbum(toStagedAlbum(match))
        return null
    }

    // --- the series ---

    albums(): SeriesAlbum[] {
        return this.stagingController.getSelectedAlbums()
    }

    isCreated(): boolean {
        return this.state.create === CreateState.CREATED
    }

    flame(): DockModel['flame'] {
        const results = this.scan?.status === ScanStatus.RESULTS || this.scan?.status === ScanStatus.FAILED
        return flameOf({ chosen: this.albums().length, results, created: this.isCreated() })
    }

    /** A cover was clicked: in the series it goes out (with Undo); not in it, it goes in. */
    clickCard(id: string): void {
        if (this.isCreated()) this.startAnother()
        else if (this.stagingController.hasAlbum(id)) return this.removeWithUndo(id)
        this.state.undo = null
        if (!this.picker.pick(id)) console.warn(`Album not found in the scan: ${id}`)
    }

    /** «Add all»: what the filters show goes in, and «Undo» gives the series back as it was. */
    addAll(): void {
        if (!this.scan) return
        if (this.isCreated()) this.startAnother()
        const before = this.stagingController.snapshot()
        const n = this.stagingController.addMany(visibleAlbums(this.scan.albums, this.picker.filters))
        if (n > 0) this.offerUndo({ kind: 'addall', before, n })
    }

    removeWithUndo(id: string): void {
        const removed = this.stagingController.removeAlbum(id)
        if (removed) this.offerUndo({ kind: 'remove', ...removed })
    }

    private offerUndo(undo: Undo): void {
        clearTimeout(this.undoTimer)
        this.state.undo = undo
        this.state.moved = null
        this.redraw()
        this.undoTimer = setTimeout(() => {
            this.state.undo = null
            if (!this.disposed) this.redraw()
        }, UNDO_MS)
    }

    undo(): void {
        const undo = this.state.undo
        if (!undo) return
        clearTimeout(this.undoTimer)
        this.state.undo = null
        if (undo.kind === 'remove' && undo.album) this.stagingController.insertAlbum(undo.album, undo.index ?? 0)
        else this.stagingController.restore(undo.before ?? [])
    }

    move(id: string, delta: number): void {
        const album = this.albums().find(a => String(a.id) === String(id))
        if (!album) return
        this.state.moved = { id: album.id, dir: delta < 0 ? 'up' : 'down' }
        this.stagingController.moveAlbum(album.id, delta)
    }

    toggleOpen(): void {
        this.state.open = !this.state.open
        this.state.moved = null
        this.redraw()
    }

    closePanel(): void {
        if (!this.state.open && !this.state.moved) return
        this.state.open = false
        this.state.moved = null
        this.redraw()
    }

    /** The series changed: the suggested name follows it, a failed or missing-name state is left. */
    private seriesChanged(): void {
        const albums = this.albums()
        const named = nameAfterChange({ name: this.state.name, state: this.state.nameState }, albums)
        this.state.name = named.name
        this.state.nameState = named.state
        if (!albums.length) this.state.open = false
        if (this.state.create === CreateState.FAILED || (this.state.create === CreateState.NO_NAME && named.name.trim())) this.state.create = CreateState.IDLE
        this.redraw()
    }

    /** The name was typed: nothing else is drawn again (the field is the person's), unless it was missing and now is not. */
    setName(text: string): void {
        this.state.name = text
        this.state.nameState = NameState.EDITED
        if (this.state.create === CreateState.NO_NAME && text.trim()) {
            this.state.create = CreateState.IDLE
            this.redraw()
        } else {
            this.touch() // the field itself shows what it holds
        }
    }

    useSuggestedName(): void {
        this.state.name = suggestName(this.albums())
        this.state.nameState = NameState.SUGGESTED
        this.state.create = CreateState.IDLE
        this.redraw()
    }

    // --- create ---

    /** «Create series»: never without a name (no silent «New Album Series»). */
    async createSeries(): Promise<void> {
        const albums = [...this.albums()]
        const state = this.state
        if (albums.length === 0 || state.create === CreateState.CREATING) return
        const name = decodeEntities(state.name || '').trim()
        if (!name) {
            state.create = CreateState.NO_NAME
            this.redraw()
            this.askFocus({ to: 'name' })
            return
        }
        clearTimeout(this.undoTimer)
        Object.assign(state, { create: CreateState.CREATING, open: false, undo: null, moved: null })
        this.redraw()
        try {
            const series = await this.writeSeries(name, albums)
            Object.assign(state, { create: CreateState.CREATED, created: { id: series.id, name, count: albums.length } })
        } catch (error) {
            console.error('[HomeController] The series was not saved:', error)
            Object.assign(state, { create: CreateState.FAILED, ...failureOf(error as { code?: string; message?: string }) })
        }
        if (!this.disposed) this.redraw()
    }

    /** Writes the series (the seam the browser proof replaces, so no real series is written). */
    async writeSeries(name: string, albums: SeriesAlbum[]): Promise<{ id: string }> {
        const db = albumSeriesStore.getDb()
        if (!db) throw new Error('Database not initialized')
        const service = getSeriesService(db, null, albumSeriesStore.getUserId())
        // One shape, written in one place, with plain text, in the order of the series (models/albumQuery.js)
        return service.createSeries({ name, albumQueries: albums.map(toAlbumQuery), status: 'pending' })
    }

    blendNow(): void {
        if (this.state.created) router.navigate(`/blend?seriesId=${encodeURIComponent(this.state.created.id)}`)
    }

    openSeries(): void {
        if (this.state.created) router.navigate(`/albums/${encodeURIComponent(this.state.created.id)}`)
    }

    /** A new series: the saved one stays as it is; the dock is empty again. */
    startAnother(): void {
        Object.assign(this.state, { create: CreateState.IDLE, created: null, undo: null, name: '', nameState: NameState.NONE, open: false, moved: null })
        if (this.albums().length) this.stagingController.clear()
        else this.redraw()
    }

    signIn(): void {
        openLoginWindow()
    }

    /** The screen became a phone or stopped being one: the dock takes the other form. */
    screenChanged(): void {
        this.state.open = false
        this.redraw()
    }

    // --- drawing ---

    /** Takes the picture the dock is drawn from, and tells the screen. */
    redraw(): void {
        if (this.disposed) return
        this.dockFocus = this.focusInTheDock()
        this.dockDraws += 1
        const albums = this.albums()
        this.model = {
            albums,
            name: this.state.name,
            nameState: this.state.nameState,
            suggestion: suggestName(albums),
            create: this.state.create,
            created: this.state.created,
            failure: this.state.failure,
            failureNetwork: this.state.failureNetwork,
            open: this.state.open && !isPhone(),
            moved: this.state.moved,
            undo: this.state.undo,
            guest: this.state.guest && !isPhone(),
            flame: this.flame(),
            coversOnScreen: this.scan?.status === ScanStatus.RESULTS && this.state.mode === 'artist'
        }
        if (!this.nameOfTheSheetIsBeingTyped()) {
            this.sheetName = this.model
            this.sheetNameDraw = this.dockDraws
        }
        this.touch()
    }

    /** Where the focus is in the dock, as a selector that finds it again after the dock is drawn anew (the old dock did the same). */
    private focusInTheDock(): StartController['dockFocus'] {
        const active = document.activeElement as (HTMLInputElement & HTMLElement) | null
        if (!active || !document.getElementById('homeDockHost')?.contains(active)) return null
        const selector = selectorOf(active)
        return selector ? { selector, start: active.selectionStart ?? null, end: active.selectionEnd ?? null } : null
    }

    private nameOfTheSheetIsBeingTyped(): boolean {
        const active = document.activeElement
        return active?.id === 'homeChosenName' && Boolean(active.closest('#homeSeriesSheet'))
    }
}
