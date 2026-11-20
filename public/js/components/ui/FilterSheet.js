/**
 * FilterSheet - the filters, the order and the view of a list, on the phone (F76, REQ-05; audit
 * finding 8). Styles: public/css/mobile/albums.css (the albums screen is the one that asks for it).
 *
 * On the phone the toolbar keeps only the search and a «Filters» button that says how many filters
 * are on; this sheet holds the rest: the view (grid or list), the order, each filter, and reload.
 * Every control reports through the same handlers the computer's controls call (FilterToolbar's
 * props); the sheet keeps no state of its own and follows the props while it is open (sync).
 */
import { openSheet } from './Sheet.js'
import { SafeDOM } from '../../utils/SafeDOM.js'
import { getIcon } from '../Icons.js'

const OFF = new Set(['', 'all', 'null', 'undefined'])

/** @returns {boolean} the group filters something */
export const isOn = (group) => !OFF.has(String(group?.value ?? ''))

/** The name of a filter, as a heading: the group's title, or its id written as a word. */
export function filterName(group) {
    if (group.title) return group.title
    const id = String(group.id || '')
    return id.charAt(0).toUpperCase() + id.slice(1)
}

/**
 * The filters that are on, each with what it shows.
 * @param {Array} filterGroups
 * @returns {Array<{ group: Object, name: string, value: string }>}
 */
export function activeFilters(filterGroups = []) {
    return filterGroups.filter(isOn).map(group => {
        const option = (group.options || []).find(item => String(item.value) === String(group.value))
        return { group, name: filterName(group), value: option ? option.label : String(group.value) }
    })
}

/** Turn every filter off, through each one's own handler. The series filter, when on, goes first. */
export function clearFilters(filterGroups = []) {
    filterGroups.filter(isOn).forEach(group => group.onChange?.('all'))
}

function section(title, control) {
    return SafeDOM.div({ className: 'filter-sheet__section' }, [
        SafeDOM.p({ className: 'filter-sheet__heading' }, title),
        control
    ])
}

function select(fieldId, options, value, onChange) {
    const field = SafeDOM.select({ id: fieldId, className: 'form-control filter-sheet__select' },
        options.map(option => SafeDOM.option({ value: option.value }, option.label)))
    field.value = String(value)
    field.addEventListener('change', (event) => onChange(event.target.value))
    return field
}

function viewSwitch(props) {
    const choice = (mode, label, icon) => {
        const button = SafeDOM.button({ type: 'button', className: 'filter-sheet__segment', dataset: { viewMode: mode }, 'aria-pressed': String(props.viewMode === mode) }, [
            SafeDOM.fromHTML(getIcon(icon, 'filter-sheet__segment-icon')),
            SafeDOM.span({}, label)
        ])
        button.addEventListener('click', () => { if (props.viewMode !== mode) props.onToggleView?.() })
        return button
    }
    return SafeDOM.div({ className: 'filter-sheet__segments', role: 'group', 'aria-label': 'View' }, [
        choice('compact', 'Grid', 'Grid'),
        choice('expanded', 'List', 'List')
    ])
}

/** The body of the sheet, drawn from the props. */
function buildContent(props, close) {
    const { sortOptions = [], currentSort = '', filterGroups = [] } = props
    const parts = []
    if (props.viewMode && props.onToggleView) parts.push(section('View', viewSwitch(props)))
    if (sortOptions.length > 0) {
        parts.push(section('Sort series by', select('sheetSort', sortOptions, currentSort, (value) => props.onSort?.(value))))
    }
    filterGroups.forEach(group => {
        const options = [{ value: 'all', label: group.label }, ...(group.options || [])]
        const fieldId = 'sheetFilter_' + group.id
        parts.push(section(filterName(group), select(fieldId, options, isOn(group) ? group.value : 'all', (value) => group.onChange?.(value))))
    })
    if (props.onRefresh) {
        const reload = SafeDOM.button({ type: 'button', className: 'filter-sheet__reload' }, [
            SafeDOM.fromHTML(getIcon('RefreshCw', 'filter-sheet__reload-icon')),
            SafeDOM.span({}, 'Reload albums from the sources')
        ])
        reload.addEventListener('click', () => { close(); props.onRefresh() })
        parts.push(reload)
    }
    return SafeDOM.div({ className: 'filter-sheet' }, parts)
}

const titleOf = (count) => (count > 0 ? `Filters · ${count} on` : 'Filters')

/**
 * Opens the sheet.
 * @param {() => Object} getProps - the toolbar's current props (read again on every sync)
 * @param {Function} [onClose]
 * @returns {{ sheet: Object, sync: Function }}
 */
export function openFilterSheet(getProps, onClose) {
    let sheet = null
    const close = () => sheet?.close()
    const clear = SafeDOM.button({ type: 'button', className: 'btn btn-secondary filter-sheet__clear' }, 'Clear filters')
    const done = SafeDOM.button({ type: 'button', className: 'btn btn-primary' }, 'Show albums')
    clear.addEventListener('click', () => clearFilters(getProps().filterGroups))
    done.addEventListener('click', close)

    const count = () => activeFilters(getProps().filterGroups).length
    sheet = openSheet({ variant: 'bottom', title: titleOf(count()), content: buildContent(getProps(), close), footer: [clear, done], onClose })
    sheet.element.classList.add('filter-sheet-window')
    clear.disabled = count() === 0

    /** The props changed (a filter reset by a change of series, the view switched): draw them. */
    const sync = () => {
        if (!sheet.isOpen()) return
        const focusedId = sheet.body.ownerDocument.activeElement?.id
        SafeDOM.replaceChildren(sheet.body, buildContent(getProps(), close))
        if (focusedId) sheet.body.querySelector(`#${focusedId}`)?.focus({ preventScroll: true })
        sheet.setTitle(titleOf(count()))
        clear.disabled = count() === 0
    }
    return { sheet, sync }
}
