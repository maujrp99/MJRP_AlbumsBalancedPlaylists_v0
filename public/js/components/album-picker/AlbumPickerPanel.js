import { SafeDOM } from '../../utils/SafeDOM.js'
import { albumSearchService } from '../../services/album-search/AlbumSearchService.js'
import { describeScan, idleScan } from '../../models/scanState.js'
import { PICKER_FILTERS, defaultFilters } from '../../models/albumPicker.js'
import { DiscographyRenderer } from '../../views/renderers/DiscographyRenderer.js'
import { AlbumPickerController } from './AlbumPickerController.js'
import { createFilterButton, drawFilterButton, drawScanButton, createScanPanel } from './pickerParts.js'

/**
 * The album picker as one block, to put inside another screen (the series edit modal).
 *
 * It is a frame for the one picker (AlbumPickerController): the field and the Scan button, the
 * status line, the filter buttons and the album cards, all drawn from the picker's state with the
 * same pieces the Home uses. It decides nothing: a click asks the controller.
 */
export class AlbumPickerPanel {
    /**
     * @param {Object} options
     * @param {(album: Object) => void} options.onPick - what the screen does with a picked album
     * @param {{ scanArtist: Function }} [options.service]
     */
    constructor({ onPick, service = albumSearchService } = {}) {
        this.controller = new AlbumPickerController({ service, view: this, onPick })
        this.elements = null
    }

    /** @returns {HTMLElement} the block, already drawn in its first state */
    render() {
        const input = SafeDOM.input({
            type: 'text',
            className: 'form-control flex-1',
            placeholder: 'Enter artist name (e.g., Pink Floyd, T-Rex)',
            'aria-label': 'Artist name'
        })
        const scanButton = SafeDOM.button({ type: 'button', className: 'btn btn-primary px-4 flex items-center gap-2', dataset: { action: 'scan-artist' } })
        const status = SafeDOM.p({ className: 'text-xs text-gray-300 font-bold min-h-4 mb-2', role: 'status', 'aria-live': 'polite' })
        const filterButtons = PICKER_FILTERS.map(filter => createFilterButton(filter, { active: defaultFilters()[filter.key] }))
        const filters = SafeDOM.div({ className: 'flex flex-wrap gap-2 mb-3' }, filterButtons)
        const grid = SafeDOM.div({
            className: 'grid grid-cols-3 md:grid-cols-4 gap-4 max-h-[320px] overflow-y-auto custom-scrollbar pr-1',
            dataset: { pickerGrid: 'true' }
        })

        this.elements = { input, scanButton, status, filters, grid }
        this.cards = new DiscographyRenderer(grid)
        this._bind()
        this.controller.start()

        return SafeDOM.div({ className: 'mt-4 p-3 bg-white/5 rounded-lg', dataset: { albumPicker: 'true' } }, [
            SafeDOM.div({ className: 'flex gap-2 mb-2' }, [input, scanButton]),
            status,
            filters,
            grid
        ])
    }

    /** The modal was closed: a scan still on its way draws nothing. */
    dispose() {
        this.controller.dispose()
    }

    _bind() {
        const { input, scanButton, filters, grid } = this.elements
        const scan = () => this.controller.searchArtist(input.value)

        scanButton.addEventListener('click', scan)
        input.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') return
            event.preventDefault()
            scan()
        })
        filters.addEventListener('click', (event) => {
            const button = event.target.closest('[data-filter]')
            if (button) this.controller.toggleFilter(button.dataset.filter)
        })
        grid.addEventListener('click', (event) => this._onGridClick(event))
    }

    _onGridClick(event) {
        if (event.target.closest('[data-action="scan-retry"]')) {
            this.controller.retry()
            return
        }
        const card = event.target.closest('[data-action="pick-album"]')
        if (card) this.controller.pick(card.dataset.id)
    }

    // --- The view port of the picker ---

    drawScan(scan) {
        const shown = describeScan(scan || idleScan())
        drawScanButton(this.elements.scanButton, shown)
        this.elements.status.textContent = shown.statusLine
        if (!shown.panel) return
        SafeDOM.clear(this.elements.grid)
        this.elements.grid.appendChild(createScanPanel(shown.panel, { compact: true }))
    }

    drawFilters(filters, counts) {
        this.elements.filters.querySelectorAll('[data-filter]').forEach(button => {
            const key = button.dataset.filter
            drawFilterButton(button, filters[key], counts[key])
        })
    }

    drawAlbums(albums) {
        this.cards.render(albums)
    }
}
