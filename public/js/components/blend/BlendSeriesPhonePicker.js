import { SafeDOM } from '../../utils/SafeDOM.js'
import { getIcon } from '../Icons.js'
import { openSheet } from '../ui/Sheet.js'
import { AlbumCascade } from '../common/AlbumCascade.js'
import { decodeEntities } from '../../models/text.js'

/**
 * Step 1 of the Blend on the phone (F76, REQ-10): the series are reached without a box that
 * scrolls inside the page. The page shows one row — the series chosen, or «Choose a series» —
 * and a tap opens a full sheet with a search field and every series; a tap on one chooses it and
 * closes the sheet. The Blend takes ONE series, so the sheet is a single choice.
 *
 * Phone only: BlendSeriesSelector draws this when isPhone(), and its own list on the computer.
 * It decides nothing: the choice goes back through `onChoose`, the selector's own path.
 */

const albumsOf = (series) => (series.albumQueries || series.albums || []).length
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`
const nameOf = (series) => decodeEntities(series.name || '') || 'Untitled series'

export class BlendSeriesPhonePicker {
    /**
     * @param {Object} options
     * @param {() => Array<Object>} options.getSeries - the person's series
     * @param {() => Object|null} options.getChosen - the series chosen
     * @param {(series: Object) => string[]} options.thumbnailsOf - up to 3 cover URLs (or nulls)
     * @param {(series: Object) => void} options.onChoose
     */
    constructor({ getSeries, getChosen, thumbnailsOf, onChoose }) {
        this.getSeries = getSeries
        this.getChosen = getChosen
        this.thumbnailsOf = thumbnailsOf
        this.onChoose = onChoose
        this.sheet = null
        this.query = ''
    }

    /**
     * The row of the page: what is chosen, and the way to the sheet.
     * @param {{ loading: boolean }} state
     * @returns {HTMLElement}
     */
    renderRow({ loading }) {
        const chosen = this.getChosen()
        const count = this.getSeries().length
        const button = SafeDOM.button({ type: 'button', id: 'blend-series-pick', className: `blend-pick${chosen ? ' is-chosen' : ''}` })
        button.appendChild(chosen ? AlbumCascade.renderNode(this.thumbnailsOf(chosen)) : SafeDOM.span({ className: 'blend-pick__icon' }, SafeDOM.fromHTML(getIcon('Layers', 'w-6 h-6'))))
        button.appendChild(SafeDOM.span({ className: 'blend-pick__text' }, [
            SafeDOM.span({ className: 'blend-pick__title' }, chosen ? nameOf(chosen) : 'Choose a series'),
            SafeDOM.span({ className: 'blend-pick__meta' }, this.rowMeta({ loading, chosen, count }))
        ]))
        button.appendChild(SafeDOM.span({ className: 'blend-pick__action' }, chosen ? 'Change' : 'Choose'))
        button.disabled = loading || count === 0
        button.addEventListener('click', () => this.open())
        return button
    }

    rowMeta({ loading, chosen, count }) {
        if (loading) return 'Loading your series…'
        if (count === 0) return 'No series yet: create one on Home'
        return chosen ? plural(albumsOf(chosen), 'album') : `${count} series to choose from`
    }

    open() {
        if (this.sheet?.isOpen()) return
        this.query = ''
        const search = SafeDOM.input({
            type: 'search',
            className: 'blend-sheet__search',
            placeholder: 'Search series',
            'aria-label': 'Search series',
            autocomplete: 'off'
        })
        search.addEventListener('input', () => {
            this.query = search.value
            this.drawList()
        })
        const list = SafeDOM.div({ className: 'blend-sheet__list', role: 'list' })
        const status = SafeDOM.p({ className: 'blend-sheet__status', role: 'status', 'aria-live': 'polite' })
        this.sheet = openSheet({
            variant: 'full',
            title: 'Choose a series',
            content: [SafeDOM.div({ className: 'blend-sheet__search-wrap' }, search), status, list],
            onClose: () => { this.sheet = null }
        })
        this.elements = { list, status }
        list.addEventListener('click', (event) => this.onListClick(event))
        this.drawList()
    }

    /** The covers arrived, or the list changed: the open sheet draws again, the search kept. */
    refresh() {
        if (this.sheet?.isOpen()) this.drawList()
    }

    close() {
        this.sheet?.close()
    }

    drawList() {
        const { list, status } = this.elements
        const words = this.query.trim().toLowerCase()
        const all = this.getSeries()
        const shown = words ? all.filter(series => nameOf(series).toLowerCase().includes(words)) : all
        status.textContent = words ? `${shown.length} of ${all.length} series` : `${all.length} series`
        SafeDOM.clear(list)
        if (shown.length === 0) {
            list.appendChild(SafeDOM.p({ className: 'blend-sheet__empty' }, 'No series with that name.'))
            return
        }
        const chosenId = this.getChosen()?.id
        shown.forEach(series => list.appendChild(this.row(series, series.id === chosenId)))
    }

    row(series, chosen) {
        const row = SafeDOM.button({
            type: 'button',
            role: 'listitem',
            className: `blend-sheet__row${chosen ? ' is-chosen' : ''}`,
            'aria-pressed': String(chosen),
            dataset: { seriesId: series.id }
        }, [
            AlbumCascade.renderNode(this.thumbnailsOf(series)),
            SafeDOM.span({ className: 'blend-sheet__text' }, [
                SafeDOM.span({ className: 'blend-sheet__name' }, nameOf(series)),
                SafeDOM.span({ className: 'blend-sheet__meta' }, plural(albumsOf(series), 'album'))
            ])
        ])
        if (chosen) row.appendChild(SafeDOM.span({ className: 'blend-sheet__check', 'aria-hidden': 'true' }, SafeDOM.fromHTML(getIcon('Check', 'w-5 h-5'))))
        return row
    }

    onListClick(event) {
        const row = event.target.closest('[data-series-id]')
        if (!row) return
        const series = this.getSeries().find(s => s.id === row.dataset.seriesId)
        if (!series) return
        this.close()
        this.onChoose(series)
    }
}
