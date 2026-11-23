/**
 * The one album picker (F57): search an artist, see the albums by type, pick some. Ported to TypeScript in F83 wave 5b (it was
 * components/album-picker/AlbumPickerController.js): the same state machine and the same view port, so the Start screen and the panel inside
 * the window to edit a series are frames for one thing.
 *
 * It owns the state of the scan (rules in models/scanState.js, F67) and of the filters (models/albumPicker.js); every change is drawn from
 * that state through the view it was given. The two screens differ in one thing only, and it is the one seam: `onPick`, what is done with an
 * album the person picked.
 *
 * The view is a port with three methods, and nothing else is asked of it:
 *   drawScan(scan)               - the Scan button, the status line and the panel message
 *   drawFilters(filters, counts) - the filter buttons: which are on, how many albums each has
 *   drawAlbums(albums)           - the album cards, when the scan has results
 */
import { isDeadlineError } from '../../utils/deadline.js'
import { ScanStatus, ScanFailure, idleScan, canStartScan, startScan, scanFound, scanFailed, scanReclassified } from '../../models/scanState.js'
import { defaultFilters, toggleFilter, visibleAlbums, countByFilter, newestFirst, findAlbum } from '../../models/albumPicker.js'

/** An album as the catalog gives it to the picker (the fields the picker's rules and cards read). */
export interface PickerAlbum {
    id: string
    title?: string
    artist?: string
    year?: string | number
    type?: string
    releaseDate?: string
    coverUrl?: string | null
    artworkTemplate?: string | null
    [more: string]: unknown
}

/** The state of a scan (models/scanState.js). */
export interface Scan {
    status: string
    generation: number
    query: string
    artist: string | null
    albums: PickerAlbum[]
    classifying: boolean
    failure: string | null
}

export type Filters = Record<string, boolean>
export type Counts = Record<string, number>

/** What the scan service answers: the albums, and the AI list that comes after (to classify them again), if it will. */
export interface ScanAnswer {
    albums: PickerAlbum[]
    reclassified?: Promise<PickerAlbum[] | null> | null
}

export interface PickerView {
    drawScan: (scan: Scan) => void
    drawFilters: (filters: Filters, counts: Counts) => void
    drawAlbums: (albums: PickerAlbum[]) => void
}

export interface PickerOptions {
    /** The one scan of an artist's albums. */
    service: { scanArtist: (text: string) => Promise<ScanAnswer> }
    view: PickerView
    /** What the screen does with a picked album. */
    onPick?: (album: PickerAlbum) => void
    /** What it says when asked to search with no text (a screen that speaks another language gives its own). */
    emptyQueryMessage?: () => string
    /** Where the picker says it (a piece of ui/ holds no store): the site's notices, given by the screen. */
    warn?: (message: string) => void
}

export class AlbumPickerController {
    readonly service: PickerOptions['service']
    readonly view: PickerView
    readonly onPick: (album: PickerAlbum) => void
    readonly emptyQueryMessage: () => string
    readonly warn: (message: string) => void
    scan: Scan = idleScan() as Scan
    filters: Filters = defaultFilters() as Filters
    disposed = false

    constructor({ service, view, onPick, warn, emptyQueryMessage = () => 'Type an artist name first.' }: PickerOptions) {
        this.service = service
        this.view = view
        this.onPick = onPick ?? (() => {})
        this.emptyQueryMessage = emptyQueryMessage
        this.warn = warn ?? (() => {})
    }

    /** The albums of the scan on screen. */
    get results(): PickerAlbum[] {
        return this.scan.albums
    }

    /** Draw the first state. */
    start(): void {
        this.draw()
    }

    /** The screen was left: what is still on its way draws nothing. */
    dispose(): void {
        this.disposed = true
    }

    /**
     * Scan the catalog for an artist. One scan at a time: while one runs, another ask does nothing. Ends when the catalog answered (or
     * failed, or missed its deadline); the AI list, when it is needed, arrives after and classifies the albums on screen again.
     */
    async searchArtist(query: string): Promise<void> {
        if (this.scan.status === ScanStatus.SCANNING) return
        if (!canStartScan(this.scan, query)) {
            this.warn(this.emptyQueryMessage())
            return
        }

        const started = this.setScan(startScan(this.scan, query) as Scan)
        const { generation, query: text } = started

        try {
            const { albums, reclassified } = await this.service.scanArtist(text)
            this.setScan(scanFound(this.scan, generation, { albums: newestFirst(albums), classifying: Boolean(reclassified) }) as Scan)
            if (reclassified) void this.applyAiList(generation, reclassified)
        } catch (error) {
            console.error('[AlbumPicker] Scan failed', error)
            this.setScan(scanFailed(this.scan, generation, isDeadlineError(error) ? ScanFailure.TIMEOUT : ScanFailure.ERROR) as Scan)
        }
    }

    /** "Try again": the same text as the scan that failed. */
    retry(): Promise<void> {
        return this.searchArtist(this.scan.query)
    }

    toggleFilter(key: string): void {
        this.filters = toggleFilter(this.filters, key) as Filters
        this.draw()
    }

    /** The person picked the album of a card: the album handed to `onPick`, or null when the scan does not have it. */
    pick(albumId: string): PickerAlbum | null {
        const album = findAlbum(this.results, albumId) as PickerAlbum | null
        if (album) this.onPick(album)
        return album
    }

    /** The AI list arrives after the first render: the albums shown are classified again. */
    private async applyAiList(generation: number, reclassified: Promise<PickerAlbum[] | null>): Promise<void> {
        let albums: PickerAlbum[] | null = null
        try {
            albums = await reclassified
        } catch (error) {
            console.warn('[AlbumPicker] AI list failed, keeping the first classification', error)
        }
        this.setScan(scanReclassified(this.scan, generation, albums ? newestFirst(albums) : null) as Scan)
    }

    /** The one way the scan's state changes: keep it, then draw from it. */
    private setScan(next: Scan): Scan {
        if (next === this.scan) return next
        this.scan = next
        this.draw()
        return next
    }

    private draw(): void {
        if (this.disposed) return
        this.view.drawScan(this.scan)
        this.view.drawFilters(this.filters, countByFilter(this.scan.albums) as Counts)
        // Only the results state has albums in the grid: in the others the panel shows a message
        if (this.scan.status === ScanStatus.RESULTS) this.view.drawAlbums(visibleAlbums(this.results, this.filters) as PickerAlbum[])
    }
}
