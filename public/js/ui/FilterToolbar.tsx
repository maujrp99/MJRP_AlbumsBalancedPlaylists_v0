/**
 * FilterToolbar - the search, filter and sort bar of the lists, with its sheet on the phone, in React (F83 wave 5a; the port of
 * components/ui/FilterToolbar.js and FilterSheet.js). It is on the saved playlists screen and on the albums screen.
 *
 * It draws what the hand-made bar drew, and keeps what it kept: the search field is one element for as long as the screen lives (a
 * person typing in it never loses the focus: UAT-179, and the field is written to only when it does not hold the focus); the controls
 * (the lists, the order, Refresh, the two views) are made again only when what they show changed (their `key` is that picture), so a
 * list that was just used is a new element and the focus goes back to the page, as the hand-made bar did when it wrote them anew; the
 * bar of the phone (the Filters button, the chips of what is on) and the sheet it opens are drawn from the same props. Its own texts
 * are the dictionary's (`ui.filter.*`); the texts the screen gives it (titles, labels, options, the words of the sheet) come from the
 * screen's own dictionary.
 */
import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'
import { t } from '../i18n/t.js'
import { usePhone } from '../react-bridge/usePhone'
import { Icon } from './Icon'
import { useSheetWindow } from './SheetWindow'

export interface FilterOption {
    value: string
    label: string
}

export interface FilterGroupProps {
    id: string
    title?: string
    label: string
    value: string
    options: FilterOption[]
    onChange: (value: string) => void
    icon?: string
}

export interface FilterToolbarProps {
    searchQuery: string
    onSearch: (value: string) => void
    sortOptions: FilterOption[]
    currentSort: string
    onSort: (value: string) => void
    filtersInSheet?: boolean
    sheetText?: { reload: string; done: string }
    filterGroups: FilterGroupProps[]
    onRefresh?: () => void
    viewMode?: string | null
    onToggleView?: () => void
}

const OFF = new Set(['', 'all', 'null', 'undefined'])
const isOn = (group: FilterGroupProps): boolean => !OFF.has(String(group.value ?? ''))
const filterName = (group: FilterGroupProps): string => group.title || group.id.charAt(0).toUpperCase() + group.id.slice(1)

interface Chosen {
    group: FilterGroupProps
    name: string
    value: string
}

function activeFilters(groups: FilterGroupProps[]): Chosen[] {
    return groups.filter(isOn).map(group => {
        const option = group.options.find(item => String(item.value) === String(group.value))
        return { group, name: filterName(group), value: option ? option.label : String(group.value) }
    })
}

const clearFilters = (groups: FilterGroupProps[]): void => groups.filter(isOn).forEach(group => group.onChange('all'))

/** What the controls show: when it changes, they are made again. */
const picture = (props: FilterToolbarProps): string => JSON.stringify({
    currentSort: props.currentSort,
    viewMode: props.viewMode ?? null,
    refresh: Boolean(props.onRefresh),
    sort: props.sortOptions.map(option => [option.value, option.label]),
    groups: props.filterGroups.map(group => [group.id, group.label, String(group.value), group.options.map(option => [option.value, option.label])])
})

function Dropdown({ group }: { group: FilterGroupProps }) {
    return (
        <div className="filter-dropdown relative min-w-[160px]">
            <select id={`filter-${group.id}`} className="form-control appearance-none cursor-pointer pr-8 text-sm" defaultValue={group.options.some(option => String(option.value) === String(group.value)) ? String(group.value) : undefined} onChange={(event) => group.onChange(event.target.value)}>
                <option value="all">{group.label}</option>
                {group.options.map(option => <option key={option.value} value={option.value}>{` ${option.label} `}</option>)}
            </select>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><Icon name={group.icon || 'ChevronDown'} className="w-4 h-4" /></span>
        </div>
    )
}

function SortDropdown({ props }: { props: FilterToolbarProps }) {
    return (
        <div className="sort-dropdown relative">
            <select id="genericSort" className="form-control appearance-none cursor-pointer pr-8 bg-brand-dark/30 border-white/10 text-xs py-1" defaultValue={props.sortOptions.some(option => option.value === props.currentSort) ? props.currentSort : undefined} onChange={(event) => props.onSort(event.target.value)}>
                {props.sortOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><Icon name="ChevronDown" className="w-3 h-3" /></span>
        </div>
    )
}

function ViewToggles({ props }: { props: FilterToolbarProps }) {
    const compact = props.viewMode === 'compact'
    const on = 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20 scale-105 active:scale-95'
    const off = 'bg-brand-dark/50 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/10'
    return (
        <div className="flex items-center gap-2">
            <button id="viewModeGrid" className={`p-2 rounded-lg transition-all border border-transparent ${compact ? on : off}`} title={t('ui.filter.gridView')} onClick={() => { if (props.viewMode !== 'compact') props.onToggleView?.() }}>
                <Icon name="Grid" className="w-5 h-5" />
            </button>
            <button id="viewModeList" className={`p-2 rounded-lg transition-all border border-transparent ${compact ? off : on}`} title={t('ui.filter.listView')} onClick={() => { if (props.viewMode === 'compact') props.onToggleView?.() }}>
                <Icon name="List" className="w-5 h-5" />
            </button>
        </div>
    )
}

function Controls({ props }: { props: FilterToolbarProps }) {
    return (
        <div className="filters-controls contents" key={picture(props)}>
            {props.filterGroups.map(group => <Dropdown key={group.id} group={group} />)}
            {props.sortOptions.length > 0 ? <SortDropdown props={props} /> : null}
            {props.onRefresh ? (
                <button id="genericRefresh" className="btn btn-warning whitespace-nowrap flex items-center gap-2" title={t('ui.filter.reloadTitle')} onClick={() => props.onRefresh?.()}>
                    <Icon name="RefreshCw" className="w-4 h-4" />{` ${t('ui.filter.refresh')} `}
                </button>
            ) : null}
            {props.viewMode ? <ViewToggles props={props} /> : null}
        </div>
    )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
    return <div className="filter-sheet__section"><p className="filter-sheet__heading">{title}</p>{children}</div>
}

function Segment({ props, mode, label, icon }: { props: FilterToolbarProps; mode: string; label: string; icon: string }) {
    return (
        <button type="button" className="filter-sheet__segment" data-view-mode={mode} aria-pressed={props.viewMode === mode} onClick={() => { if (props.viewMode !== mode) props.onToggleView?.() }}>
            <Icon name={icon} className="filter-sheet__segment-icon" /><span>{label}</span>
        </button>
    )
}

function SheetContent({ props, close }: { props: FilterToolbarProps; close: () => void }) {
    const { sortOptions, currentSort, filterGroups } = props
    return (
        <div className="filter-sheet">
            {props.viewMode && props.onToggleView ? (
                <Section title={t('ui.filter.view')}>
                    <div className="filter-sheet__segments" role="group" aria-label={t('ui.filter.view')}>
                        <Segment props={props} mode="compact" label={t('ui.filter.grid')} icon="Grid" />
                        <Segment props={props} mode="expanded" label={t('ui.filter.list')} icon="List" />
                    </div>
                </Section>
            ) : null}
            {sortOptions.length > 0 ? (
                <Section title={t('ui.filter.sortBy')}>
                    <select id="sheetSort" className="form-control filter-sheet__select" value={currentSort} onChange={(event) => props.onSort(event.target.value)}>
                        {sortOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                </Section>
            ) : null}
            {filterGroups.map(group => (
                <Section key={group.id} title={filterName(group)}>
                    <select id={`sheetFilter_${group.id}`} className="form-control filter-sheet__select" value={isOn(group) ? String(group.value) : 'all'} onChange={(event) => group.onChange(event.target.value)}>
                        {[{ value: 'all', label: group.label }, ...group.options].map((option, index) => <option key={`${option.value}-${index}`} value={option.value}>{option.label}</option>)}
                    </select>
                </Section>
            ))}
            {props.onRefresh ? (
                <button type="button" className="filter-sheet__reload" onClick={() => { close(); props.onRefresh?.() }}>
                    <Icon name="RefreshCw" className="filter-sheet__reload-icon" /><span>{props.sheetText?.reload || t('ui.filter.reloadDefault')}</span>
                </button>
            ) : null}
        </div>
    )
}

const sheetTitle = (count: number): string => (count > 0 ? t('ui.filter.sheetTitleOn', { count }) : t('ui.filter.filters'))

function PhoneBar({ chosen, onOpen }: { chosen: Chosen[]; onOpen: () => void }) {
    const count = chosen.length
    return (
        <button type="button" className={`filters-phone filters-phone-button${count > 0 ? ' is-on' : ''}`} aria-haspopup="dialog" aria-label={count > 0 ? t('ui.filter.filtersOn', { count }) : t('ui.filter.filters')} onClick={onOpen}>
            <Icon name="Layers" className="filters-phone-button__icon" />
            <span>{t('ui.filter.filters')}</span>
            {count > 0 ? <span className="filters-phone-button__count">{String(count)}</span> : null}
        </button>
    )
}

function Chips({ chosen, groups }: { chosen: Chosen[]; groups: FilterGroupProps[] }) {
    if (chosen.length === 0) return null
    return (
        <div className="filters-phone filters-chips">
            {chosen.map(({ group, name, value }) => (
                <button key={group.id} type="button" className="filters-chip" aria-label={t('ui.filter.removeChip', { name, value })} onClick={() => group.onChange('all')}>
                    <span className="filters-chip__text">{`${name}: ${value}`}</span>
                    <Icon name="X" className="filters-chip__x" />
                </button>
            ))}
            {chosen.length > 1 ? <button type="button" className="filters-chips__clear" onClick={() => clearFilters(groups)}>{t('ui.filter.clearAll')}</button> : null}
        </div>
    )
}

export function FilterToolbar(props: FilterToolbarProps) {
    const phone = usePhone()
    const sheet = useSheetWindow()
    const search = useRef<HTMLInputElement>(null)
    const latest = useRef(props)
    latest.current = props
    const chosen = activeFilters(props.filterGroups)
    const inSheet = Boolean(props.filtersInSheet) && phone

    // the field tells the screen on every `input` event, as the hand-made bar heard it (not through React's own change, which a value written
    // by script does not raise)
    useEffect(() => {
        const field = search.current
        if (!field) return undefined
        const heard = (event: Event) => latest.current.onSearch((event.target as HTMLInputElement).value)
        field.addEventListener('input', heard)
        return () => field.removeEventListener('input', heard)
    }, [])

    // the field is written to only when it does not hold the focus and says something else (what the bar was told to show)
    useLayoutEffect(() => {
        const field = search.current
        const wanted = props.searchQuery || ''
        if (field && document.activeElement !== field && field.value !== wanted) field.value = wanted
    })

    // the open sheet shows what changed: its title and its «Clear filters» follow the filters that are on
    useEffect(() => {
        if (sheet.isOpen()) sheet.setTitle(sheetTitle(chosen.length))
    })

    const openSheet = () => {
        if (sheet.isOpen()) return
        sheet.show({
            title: sheetTitle(activeFilters(latest.current.filterGroups).length),
            className: 'filter-sheet-window',
            closeLabel: t('ui.filter.close'),
            render: (close) => <SheetContent props={latest.current} close={close} />,
            footer: (close) => <SheetFooter latest={latest} close={close} />
        })
    }

    return (
        <div className={`filters-section glass-panel p-4 mb-6 fade-in relative${inSheet ? ' filters-section--sheet' : ''}`}>
            <div className="filters-row flex flex-wrap gap-3 items-center">
                <div className="search-bar relative flex-1 min-w-[200px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Icon name="Search" className="w-5 h-5" /></span>
                    <input ref={search} type="search" id="genericSearch" placeholder={t('ui.filter.search')} className="form-control pl-10 w-full" />
                </div>
                <Controls props={props} />
                {inSheet ? <PhoneBar chosen={chosen} onOpen={openSheet} /> : null}
            </div>
            {inSheet ? <Chips chosen={chosen} groups={props.filterGroups} /> : null}
            {sheet.layer}
        </div>
    )
}

function SheetFooter({ latest, close }: { latest: { current: FilterToolbarProps }; close: () => void }) {
    const props = latest.current
    const none = activeFilters(props.filterGroups).length === 0
    return (
        <>
            <button type="button" className="btn btn-secondary filter-sheet__clear" disabled={none} onClick={() => clearFilters(latest.current.filterGroups)}>{t('ui.filter.clear')}</button>
            <button type="button" className="btn btn-primary" onClick={close}>{props.sheetText?.done || t('ui.filter.doneDefault')}</button>
        </>
    )
}
