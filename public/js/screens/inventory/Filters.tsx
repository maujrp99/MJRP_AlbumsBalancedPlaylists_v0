/**
 * The row of filters of the computer (F83 wave 6a; the port of InventoryView.renderFilters): the search, the format, the order, the switch between
 * grid and list, and the three actions of the collection. The status is chosen with the counts of the header (F75, REQ-02), not here.
 *
 * The search field is one element for the whole visit: the hand-made screen drew everything anew and gave the field back with its text and its caret,
 * and here the field is simply not made anew. It hears the event `input` by hand (an `onChange` of React does not hear a value written by script), and
 * when the controller changed the text (the phone's «Clear search and filters») the field is written to match.
 */
import { useEffect, useRef } from 'react'
import { t } from '../../i18n/t.js'
import { Icon } from '../../ui/Icon'
import { SORT_OPTIONS, choiceOf } from '../../models/inventorySort.js'
import { CollectionActions } from './CollectionActions'
import type { InventoryController, InventoryState } from './types'

/** The field of the search, for the computer's row and the phone's bar: the same behaviour, the two drawings differ in what they put around it. */
export function useSearchField(controller: InventoryController, search: string) {
    const field = useRef<HTMLInputElement>(null)
    useEffect(() => {
        const input = field.current
        if (!input) return undefined
        const heard = () => controller.handleFilterChange('search', input.value)
        input.addEventListener('input', heard)
        return () => input.removeEventListener('input', heard)
    }, [controller])
    useEffect(() => {
        if (field.current && field.current.value !== search) field.current.value = search
    })
    return field
}

const Chevron = () => (
    <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><Icon name="ChevronDown" className="w-4 h-4" /></span>
)

const FORMATS = ['cd', 'vinyl', 'digital']

export function Filters({ state, controller }: { state: InventoryState; controller: InventoryController }) {
    const { filters, viewMode } = state
    const search = useSearchField(controller, filters.search || '')
    return (
        <div className="filters-section glass-panel p-4 mb-6">
            <div className="filters-row flex flex-wrap gap-3 items-center">
                <div className="search-bar relative flex-1 min-w-[200px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Icon name="Search" className="w-5 h-5" /></span>
                    <input ref={search} type="search" id="inventorySearch" placeholder={t('inventory.search.placeholder')} className="form-control pl-10 w-full" defaultValue={filters.search || ''} />
                </div>
                <div className="filter-dropdown relative">
                    <select id="formatFilter" className="form-control appearance-none cursor-pointer pr-8" value={filters.format} onChange={(event) => controller.handleFilterChange('format', event.target.value)}>
                        <option value="all">{t('inventory.format.all')}</option>
                        {FORMATS.map(code => <option key={code} value={code}>{t(`inventory.format.${code}`)}</option>)}
                    </select>
                    <Chevron />
                </div>
                <div className="filter-dropdown relative">
                    <select id="inventorySort" className="form-control appearance-none cursor-pointer pr-8" aria-label={t('inventory.sort.label')} value={choiceOf(state.sorting)} onChange={(event) => controller.handleSortChoice(event.target.value)}>
                        {SORT_OPTIONS.map(({ value, label }: { value: string; label: string }) => <option key={value} value={value}>{label}</option>)}
                    </select>
                    <Chevron />
                </div>
                <button type="button" id="toggleViewMode" className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`} title={t('inventory.view.toggle')} onClick={() => controller.handleViewModeChange(viewMode === 'grid' ? 'list' : 'grid')}>
                    <Icon name={viewMode === 'grid' ? 'Grid' : 'List'} className="w-5 h-5" />
                </button>
                <CollectionActions state={state} controller={controller} />
            </div>
        </div>
    )
}
