/**
 * F51 (UAT-179) - the filter toolbar, in jsdom: the search field is one element from start to end, and what the person is typing is
 * never written over. F76 (REQ-05, REQ-12) - the same bar on the phone: the search and a «Filters» button with how many are on (the
 * rest in a sheet), the chips, the sheet. Carried over to React in F83 wave 5a: the old tests mounted components/ui/FilterToolbar.js
 * and its sheet; the assertions are the same, the bar is now ui/FilterToolbar.tsx with the same props.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { FilterToolbar, type FilterToolbarProps } from '../../public/js/ui/FilterToolbar'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const groups = (onChange = vi.fn(), value = 'all') => [{
    id: 'artist', label: 'All Artists', value, onChange,
    options: [{ value: 'Rush', label: 'Rush' }, { value: 'Simon & Garfunkel', label: 'Simon & Garfunkel' }]
}]

const realMatchMedia = window.matchMedia
/** The screen answers as a phone (393 px) or as a computer (1280 px); a turn tells the listeners. */
function screenOf(phone: boolean) {
    const listeners = new Set<(event: { matches: boolean }) => void>()
    const state = { phone }
    window.matchMedia = ((query: string) => ({
        media: query,
        get matches() { return query.includes('max-width: 899px') ? state.phone : false },
        addEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => listeners.add(listener),
        removeEventListener: (_type: string, listener: (event: { matches: boolean }) => void) => listeners.delete(listener)
    })) as never
    return { turn(next: boolean) { state.phone = next; listeners.forEach(listener => listener({ matches: next })) } }
}

const text = (el: Element | null) => el?.textContent!.replace(/\s+/g, ' ').trim()
const nativeSet = (element: Element, value: string) => {
    const proto = element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(element, value) // the way a browser writes into a field React owns
}

describe('FilterToolbar', () => {
    let container: HTMLElement
    let root: Root
    let props: FilterToolbarProps
    const search = () => container.querySelector<HTMLInputElement>('#genericSearch')!
    const draw = async (extra: Partial<FilterToolbarProps> = {}) => {
        props = { ...props, ...extra }
        await act(async () => { root.render(<FilterToolbar {...props} />) })
    }
    const type = async (value: string) => { await act(async () => { nativeSet(search(), value); search().dispatchEvent(new Event('input', { bubbles: true })) }) }
    const choose = async (select: Element, value: string) => { await act(async () => { nativeSet(select, value); select.dispatchEvent(new Event('change', { bubbles: true })) }) }
    const click = (element: Element | null) => act(async () => { (element as HTMLElement).click() })

    beforeEach(async () => {
        screenOf(false)
        container = document.body.appendChild(document.createElement('div'))
        root = createRoot(container)
        props = {
            searchQuery: '', onSearch: vi.fn(),
            sortOptions: [{ value: 'alpha', label: 'Name (A-Z)' }, { value: 'recent', label: 'Newest' }],
            currentSort: 'alpha', onSort: vi.fn(),
            filterGroups: groups(), viewMode: 'compact', onToggleView: vi.fn(), onRefresh: vi.fn()
        }
        await draw()
    })
    afterEach(async () => { await act(async () => { root.unmount() }); document.body.innerHTML = ''; window.matchMedia = realMatchMedia })

    it('the search field is the same element after an update, and after many', async () => {
        const field = search()
        await draw({ searchQuery: 'r' })
        await draw({ searchQuery: 'ro', filterGroups: groups(vi.fn(), 'Rush'), currentSort: 'recent', viewMode: 'expanded' })
        await draw()
        expect(search()).toBe(field)
        expect(container.querySelectorAll('#genericSearch')).toHaveLength(1)
    })

    it('typing a whole word keeps the focus and reports each step, with the updates the screen answers with', async () => {
        const field = search()
        field.focus()
        ;(props.onSearch as ReturnType<typeof vi.fn>).mockImplementation((value: string) => { void draw({ searchQuery: value }) }) // what the screen does

        let typed = ''
        for (const letter of 'robert') { typed += letter; await type(typed) }

        expect(document.activeElement).toBe(field)
        expect(field.value).toBe('robert')
        expect(props.onSearch).toHaveBeenCalledTimes(6)
        expect(props.onSearch).toHaveBeenLastCalledWith('robert')
    })

    it('does not write over what is being typed when the state arrives late', async () => {
        search().focus()
        await type('robert pl')

        await draw({ searchQuery: 'rob' }) // an older state, drawn after the person went on typing

        expect(search().value).toBe('robert pl')
    })

    it('brings the field in line with the state when the person is not in it (filters cleared elsewhere)', async () => {
        await draw({ searchQuery: 'plant' })
        await type('plant')
        search().blur()

        await draw({ searchQuery: '' })

        expect(search().value).toBe('')
    })

    it('starts with the search the state already had', async () => {
        await act(async () => { root.unmount() })
        root = createRoot(container)
        await draw({ searchQuery: 'floyd' })
        expect(search().value).toBe('floyd')
    })

    it('leaves the other controls alone when what they show did not change, and redraws them when it did', async () => {
        const select = container.querySelector<HTMLSelectElement>('#filter-artist')

        await draw({ searchQuery: 'x', filterGroups: groups() })
        expect(container.querySelector('#filter-artist')).toBe(select)

        await draw({ filterGroups: groups(vi.fn(), 'Rush') })
        expect(container.querySelector('#filter-artist')).not.toBe(select)
        expect(container.querySelector<HTMLSelectElement>('#filter-artist')!.value).toBe('Rush')
    })

    it('a filter that was not redrawn still calls the handler of the latest props', async () => {
        const first = vi.fn()
        const latest = vi.fn()
        await draw({ filterGroups: groups(first) })
        await draw({ filterGroups: groups(latest) }) // same picture: the control is not redrawn

        await choose(container.querySelector('#filter-artist')!, 'Rush')

        expect(latest).toHaveBeenCalledWith('Rush')
        expect(first).not.toHaveBeenCalled()
    })

    it('an option with "&" is drawn as text and reported plain', async () => {
        const onChange = vi.fn()
        await draw({ filterGroups: groups(onChange) })
        const select = container.querySelector<HTMLSelectElement>('#filter-artist')!
        expect([...select.options].map(option => option.textContent!.trim())).toEqual(['All Artists', 'Rush', 'Simon & Garfunkel'])

        await choose(select, 'Simon & Garfunkel')
        expect(onChange).toHaveBeenCalledWith('Simon & Garfunkel')
    })

    it('reports the sort, the refresh and the change of view', async () => {
        await choose(container.querySelector('#genericSort')!, 'recent')
        expect(props.onSort).toHaveBeenCalledWith('recent')

        await click(container.querySelector('#genericRefresh'))
        expect(props.onRefresh).toHaveBeenCalledTimes(1)

        await click(container.querySelector('#viewModeGrid')) // already compact: nothing to change
        expect(props.onToggleView).not.toHaveBeenCalled()
        await click(container.querySelector('#viewModeList'))
        expect(props.onToggleView).toHaveBeenCalledTimes(1)
    })
})

// ---------------------------------------------------------------------------------------------- the bar on the phone (F76)

function phoneProps(overrides: Partial<FilterToolbarProps> = {}): FilterToolbarProps {
    return {
        searchQuery: '', onSearch: vi.fn(),
        sortOptions: [{ value: 'alpha', label: 'Name (A-Z)' }], currentSort: 'alpha', onSort: vi.fn(),
        filterGroups: [
            { id: 'series', label: 'All Series', value: 'all', options: [{ value: 's1', label: 'Prog' }], onChange: vi.fn() },
            { id: 'artist', label: 'All Artists', value: 'Rush', options: [{ value: 'Rush', label: 'Rush' }], onChange: vi.fn() },
            { id: 'year', label: 'All Years', value: '1970s', options: [{ value: '1970s', label: '1970s' }], onChange: vi.fn() }
        ],
        viewMode: 'compact', onToggleView: vi.fn(), onRefresh: vi.fn(), filtersInSheet: true, ...overrides
    }
}

describe('FilterToolbar on the phone', () => {
    let container: HTMLElement
    let root: Root
    const draw = async (props: FilterToolbarProps, into = root) => { await act(async () => { into.render(<FilterToolbar {...props} />) }) }
    const click = (element: Element | null) => act(async () => { (element as HTMLElement).click() })

    beforeEach(() => {
        window.scrollTo = () => { } // the sheet gives the page its place back; jsdom draws no page
        document.body.innerHTML = ''
        container = document.body.appendChild(document.createElement('div'))
        root = createRoot(container)
    })
    afterEach(async () => {
        await act(async () => { document.querySelectorAll<HTMLElement>('.sheet__close').forEach(button => button.click()) })
        await act(async () => { root.unmount() })
        document.body.innerHTML = ''
        window.matchMedia = realMatchMedia
        vi.restoreAllMocks()
    })

    it('on the computer is today\'s: no «Filters» button, the controls beside the search', async () => {
        screenOf(false)
        const other = document.body.appendChild(document.createElement('div'))
        const otherRoot = createRoot(other)
        await draw({ ...phoneProps(), filtersInSheet: false }, otherRoot)
        await draw(phoneProps())
        expect(container.querySelector('.filters-phone-button')).toBeNull()
        expect(container.innerHTML).toBe(other.innerHTML)
        await act(async () => { otherRoot.unmount() })
    })

    it('on the phone keeps the search and says how many filters are on, with a chip per filter', async () => {
        screenOf(true)
        const props = phoneProps()
        await draw(props)
        const button = container.querySelector('.filters-phone-button')!
        expect(button.getAttribute('aria-label')).toBe('Filters, 2 on')
        expect(container.querySelector('#genericSearch')).not.toBeNull()
        expect([...container.querySelectorAll('.filters-chip')].map(text)).toEqual(['Artist: Rush', 'Year: 1970s'])
        await click(container.querySelector('.filters-chip'))
        expect(props.filterGroups[1].onChange).toHaveBeenCalledWith('all')
        await click(container.querySelector('.filters-chips__clear'))
        expect(props.filterGroups[2].onChange).toHaveBeenCalledWith('all')
    })

    it('the «Filters» button opens a sheet with the view, the order and each filter, through the same handlers', async () => {
        screenOf(true)
        const props = phoneProps()
        await draw(props)
        await click(container.querySelector('.filters-phone-button'))
        const sheet = document.querySelector('.filter-sheet-window')!
        expect(text(sheet.querySelector('.sheet__title'))).toBe('Filters · 2 on')
        const artist = sheet.querySelector<HTMLSelectElement>('#sheetFilter_artist')!
        expect(artist.value).toBe('Rush')
        await act(async () => { nativeSet(artist, 'all'); artist.dispatchEvent(new Event('change', { bubbles: true })) })
        expect(props.filterGroups[1].onChange).toHaveBeenCalledWith('all')
        const sort = sheet.querySelector<HTMLSelectElement>('#sheetSort')!
        await act(async () => { nativeSet(sort, 'alpha'); sort.dispatchEvent(new Event('change', { bubbles: true })) })
        expect(props.onSort).toHaveBeenCalledWith('alpha')
        await click(sheet.querySelector('[data-view-mode="expanded"]'))
        expect(props.onToggleView).toHaveBeenCalledTimes(1)
        await click(sheet.querySelector('.filter-sheet__clear'))
        expect(props.filterGroups[2].onChange).toHaveBeenCalledWith('all')
    })

    it('a turn to the computer takes the phone\'s bar off', async () => {
        const screen = screenOf(true)
        await draw(phoneProps())
        expect(container.querySelector('.filters-phone')).not.toBeNull()
        await act(async () => { screen.turn(false) })
        expect(container.querySelector('.filters-phone')).toBeNull()
    })

    it('counts as on only a filter with a value', async () => {
        screenOf(true)
        await draw(phoneProps())
        expect([...container.querySelectorAll('.filters-chip__text')].map(text)).toEqual(['Artist: Rush', 'Year: 1970s'])
    })
})
