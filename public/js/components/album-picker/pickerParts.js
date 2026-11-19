import { SafeDOM } from '../../utils/SafeDOM.js'
import { getIcon } from '../Icons.js'

/**
 * The pieces of the album picker that every screen draws the same way (F57): the Scan button, the
 * filter buttons and the message of the panel. The album card is views/renderers/DiscographyRenderer.js.
 * Each screen places the pieces in its own frame; none of them draws its own version.
 */

const FILTER_ON = 'filter-btn px-3 py-1.5 rounded-lg bg-flame-gradient text-white text-xs font-bold shadow-lg shadow-orange-500/20 flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0'
const FILTER_OFF = 'filter-btn px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold border border-white/5 flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0'
const PANEL_ICONS = Object.freeze({ idle: 'Search', empty: 'Search', failed: 'AlertTriangle' })

/**
 * A filter button: icon, label and a place for the count.
 * @param {{ key: string, label: string, icon: string }} filter - of models/albumPicker.js
 * @param {{ id?: string, active?: boolean }} [options]
 */
export function createFilterButton(filter, { id, active = false } = {}) {
    const button = SafeDOM.button({ type: 'button', className: active ? FILTER_ON : FILTER_OFF, dataset: { filter: filter.key } })
    if (id) button.id = id
    button.setAttribute('aria-pressed', String(active))
    button.appendChild(SafeDOM.fromHTML(getIcon(filter.icon, 'w-3 h-3')))
    button.appendChild(SafeDOM.span({ className: 'filter-btn-text' }, filter.label))
    const count = SafeDOM.span({ className: 'filter-btn-count text-[10px] opacity-70' })
    if (id) count.id = `${id}Count`
    button.appendChild(count)
    return button
}

/** A filter button as the state says: on or off, with how many albums it has. */
export function drawFilterButton(button, active, count) {
    if (!button) return
    button.className = active ? FILTER_ON : FILTER_OFF
    button.setAttribute('aria-pressed', String(active))
    const countSpan = button.querySelector('.filter-btn-count')
    if (countSpan) countSpan.textContent = count > 0 ? ` (${count})` : ''
}

/**
 * The Scan button as the state says: busy and not to be clicked while the catalog is asked.
 * @param {HTMLElement} button
 * @param {{ busy: boolean, buttonLabel: string }} shown - of describeScan (models/scanState.js)
 */
export function drawScanButton(button, { busy, buttonLabel }) {
    if (!button) return

    SafeDOM.clear(button)
    button.appendChild(busy
        ? SafeDOM.div({ className: 'w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' })
        : SafeDOM.fromHTML(getIcon('ScanLine', 'w-4 h-4')))
    button.appendChild(SafeDOM.span({}, buttonLabel))

    button.disabled = busy
    button.classList.toggle('opacity-60', busy)
    button.classList.toggle('cursor-wait', busy)
    if (busy) button.setAttribute('aria-busy', 'true')
    else button.removeAttribute('aria-busy')
}

/**
 * The message of the panel for a state without albums (idle, scanning, empty, failed with "Try again").
 * @param {{ kind: string, title: string, detail: string, retry: boolean }} panel - of describeScan
 * @param {{ retryId?: string, compact?: boolean }} [options] - `compact` for a panel inside a modal
 */
export function createScanPanel(panel, { retryId, compact = false } = {}) {
    const mark = panel.kind === 'scanning'
        ? SafeDOM.div({ className: 'w-10 h-10 border-4 border-white/10 border-t-orange-500 rounded-full animate-spin' })
        : SafeDOM.fromHTML(getIcon(PANEL_ICONS[panel.kind] || 'Search', 'w-12 h-12 opacity-20'))

    const children = [mark, SafeDOM.p({ className: panel.kind === 'failed' ? 'text-gray-300' : '' }, panel.title)]
    if (panel.detail) children.push(SafeDOM.p({ className: 'text-xs text-gray-500' }, panel.detail))
    if (panel.retry) children.push(createRetryButton(retryId))

    return SafeDOM.div({
        className: `col-span-full flex flex-col items-center justify-center text-center text-gray-600 space-y-4 ${compact ? 'py-8' : 'py-20'}`,
        dataset: { scanPanel: panel.kind }
    }, children)
}

function createRetryButton(retryId) {
    const button = SafeDOM.button({
        type: 'button',
        className: 'px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/10 transition-colors',
        dataset: { action: 'scan-retry' }
    }, 'Try again')
    if (retryId) button.id = retryId
    return button
}
