import toast from '../Toast.js'
import { isDeadlineError } from '../../utils/deadline.js'
import { ScanStatus, ScanFailure, idleScan, canStartScan, startScan, scanFound, scanFailed, scanReclassified } from '../../models/scanState.js'
import { defaultFilters, toggleFilter, visibleAlbums, countByFilter, newestFirst, findAlbum } from '../../models/albumPicker.js'

/**
 * The one album picker (F57): search an artist, see the albums by type, pick some.
 *
 * Used by the Home (a new series) and by the series edit. It owns the state of the scan (rules in
 * models/scanState.js, F67) and of the filters (models/albumPicker.js); every change is drawn from
 * that state through the view it was given. The two screens differ in one thing only, and it is the
 * one seam: `onPick`, what is done with an album the person picked.
 *
 * The view is a port with three methods, and nothing else is asked of it:
 *   drawScan(scan)               - the Scan button, the status line and the panel message
 *   drawFilters(filters, counts) - the filter buttons: which are on, how many albums each has
 *   drawAlbums(albums)           - the album cards, when the scan has results
 */
export class AlbumPickerController {
    /**
     * @param {Object} options
     * @param {{ scanArtist: Function }} options.service - the one scan of an artist's albums
     * @param {{ drawScan: Function, drawFilters: Function, drawAlbums: Function }} options.view
     * @param {(album: Object) => void} options.onPick - what the screen does with a picked album
     */
    constructor({ service, view, onPick }) {
        this.service = service
        this.view = view
        this.onPick = onPick || (() => {})
        this.scan = idleScan()
        this.filters = defaultFilters()
        this.disposed = false
    }

    /** The albums of the scan on screen. */
    get results() {
        return this.scan.albums
    }

    /** Draw the first state. */
    start() {
        this._draw()
    }

    /** The screen was left: what is still on its way draws nothing. */
    dispose() {
        this.disposed = true
    }

    /**
     * Scan the catalog for an artist. One scan at a time: while one runs, another ask does nothing.
     * Ends when the catalog answered (or failed, or missed its deadline); the AI list, when it is
     * needed, arrives after and classifies the albums on screen again.
     */
    async searchArtist(query) {
        if (this.scan.status === ScanStatus.SCANNING) return
        if (!canStartScan(this.scan, query)) {
            toast.warning('Type an artist name first.')
            return
        }

        const { generation, query: text } = this._setScan(startScan(this.scan, query))

        try {
            const { albums, reclassified } = await this.service.scanArtist(text)
            this._setScan(scanFound(this.scan, generation, { albums: newestFirst(albums), classifying: Boolean(reclassified) }))
            if (reclassified) this._applyAiList(generation, reclassified)
        } catch (error) {
            console.error('[AlbumPicker] Scan failed', error)
            this._setScan(scanFailed(this.scan, generation, isDeadlineError(error) ? ScanFailure.TIMEOUT : ScanFailure.ERROR))
        }
    }

    /** "Try again": the same text as the scan that failed. */
    retry() {
        return this.searchArtist(this.scan.query)
    }

    toggleFilter(key) {
        this.filters = toggleFilter(this.filters, key)
        this._draw()
    }

    /**
     * The person picked the album of a card.
     * @param {string} albumId - the id the card carries
     * @returns {Object|null} the album handed to `onPick`, or null when the scan does not have it
     */
    pick(albumId) {
        const album = findAlbum(this.results, albumId)
        if (album) this.onPick(album)
        return album
    }

    /** The AI list arrives after the first render: the albums shown are classified again. */
    async _applyAiList(generation, reclassified) {
        let albums = null
        try {
            albums = await reclassified
        } catch (error) {
            console.warn('[AlbumPicker] AI list failed, keeping the first classification', error)
        }
        this._setScan(scanReclassified(this.scan, generation, albums ? newestFirst(albums) : null))
    }

    /** The one way the scan's state changes: keep it, then draw from it. */
    _setScan(next) {
        if (next === this.scan) return next
        this.scan = next
        this._draw()
        return next
    }

    _draw() {
        if (this.disposed) return
        this.view.drawScan(this.scan)
        this.view.drawFilters(this.filters, countByFilter(this.scan.albums))
        // Only the results state has albums in the grid: in the others the panel shows a message
        if (this.scan.status === ScanStatus.RESULTS) this.view.drawAlbums(visibleAlbums(this.results, this.filters))
    }
}
