/**
 * F51 (UAT-179) - the filter toolbar, in jsdom: the search field is one element from start to end,
 * and what the person is typing is never written over.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import FilterToolbar from '../../../public/js/components/ui/FilterToolbar.js'

const groups = (onChange = vi.fn(), value = 'all') => [{
    id: 'artist', label: 'All Artists', value, onChange,
    options: [{ value: 'Rush', label: 'Rush' }, { value: 'Simon & Garfunkel', label: 'Simon & Garfunkel' }]
}]

describe('FilterToolbar', () => {
    let container, toolbar, props
    const search = () => container.querySelector('#genericSearch')
    const type = (value) => {
        search().value = value
        search().dispatchEvent(new Event('input', { bubbles: true }))
    }

    beforeEach(() => {
        container = document.createElement('div')
        document.body.appendChild(container)
        props = {
            searchQuery: '', onSearch: vi.fn(),
            sortOptions: [{ value: 'alpha', label: 'Name (A-Z)' }, { value: 'recent', label: 'Newest' }],
            currentSort: 'alpha', onSort: vi.fn(),
            filterGroups: groups(), viewMode: 'compact', onToggleView: vi.fn(), onRefresh: vi.fn()
        }
        toolbar = new FilterToolbar({ container, props })
        toolbar.mount()
    })
    afterEach(() => container.remove())

    it('the search field is the same element after an update, and after many', () => {
        const field = search()
        toolbar.update({ searchQuery: 'r' })
        toolbar.update({ searchQuery: 'ro', filterGroups: groups(vi.fn(), 'Rush'), currentSort: 'recent', viewMode: 'expanded' })
        toolbar.render()
        expect(search()).toBe(field)
        expect(container.querySelectorAll('#genericSearch')).toHaveLength(1)
    })

    it('typing a whole word keeps the focus and reports each step, with the updates the screen answers with', () => {
        const field = search()
        field.focus()
        props.onSearch.mockImplementation((value) => toolbar.update({ searchQuery: value })) // what the screen does

        'robert'.split('').reduce((typed, letter) => { type(typed + letter); return typed + letter }, '')

        expect(document.activeElement).toBe(field)
        expect(field.value).toBe('robert')
        expect(props.onSearch).toHaveBeenCalledTimes(6)
        expect(props.onSearch).toHaveBeenLastCalledWith('robert')
    })

    it('does not write over what is being typed when the state arrives late', () => {
        search().focus()
        type('robert pl')

        toolbar.update({ searchQuery: 'rob' }) // an older state, drawn after the person went on typing

        expect(search().value).toBe('robert pl')
    })

    it('brings the field in line with the state when the person is not in it (filters cleared elsewhere)', () => {
        type('plant')
        search().blur()

        toolbar.update({ searchQuery: '' })

        expect(search().value).toBe('')
    })

    it('starts with the search the state already had', () => {
        const other = document.createElement('div')
        new FilterToolbar({ container: other, props: { ...props, searchQuery: 'floyd' } }).mount()
        expect(other.querySelector('#genericSearch').value).toBe('floyd')
    })

    it('leaves the other controls alone when what they show did not change, and redraws them when it did', () => {
        const select = container.querySelector('#filter-artist')

        toolbar.update({ searchQuery: 'x', filterGroups: groups() })
        expect(container.querySelector('#filter-artist')).toBe(select)

        toolbar.update({ filterGroups: groups(vi.fn(), 'Rush') })
        expect(container.querySelector('#filter-artist')).not.toBe(select)
        expect(container.querySelector('#filter-artist').value).toBe('Rush')
    })

    it('a filter that was not redrawn still calls the handler of the latest props', () => {
        const first = vi.fn()
        const latest = vi.fn()
        toolbar.update({ filterGroups: groups(first) })
        toolbar.update({ filterGroups: groups(latest) }) // same picture: the control is not redrawn

        const select = container.querySelector('#filter-artist')
        select.value = 'Rush'
        select.dispatchEvent(new Event('change'))

        expect(latest).toHaveBeenCalledWith('Rush')
        expect(first).not.toHaveBeenCalled()
    })

    it('an option with "&" is drawn as text and reported plain', () => {
        const onChange = vi.fn()
        toolbar.update({ filterGroups: groups(onChange) })
        const select = container.querySelector('#filter-artist')
        expect([...select.options].map(option => option.textContent.trim())).toEqual(['All Artists', 'Rush', 'Simon & Garfunkel'])

        select.value = 'Simon & Garfunkel'
        select.dispatchEvent(new Event('change'))
        expect(onChange).toHaveBeenCalledWith('Simon & Garfunkel')
    })

    it('reports the sort, the refresh and the change of view', () => {
        const sort = container.querySelector('#genericSort')
        sort.value = 'recent'
        sort.dispatchEvent(new Event('change'))
        expect(props.onSort).toHaveBeenCalledWith('recent')

        container.querySelector('#genericRefresh').click()
        expect(props.onRefresh).toHaveBeenCalledTimes(1)

        container.querySelector('#viewModeGrid').click() // already compact: nothing to change
        expect(props.onToggleView).not.toHaveBeenCalled()
        container.querySelector('#viewModeList').click()
        expect(props.onToggleView).toHaveBeenCalledTimes(1)
    })
})
