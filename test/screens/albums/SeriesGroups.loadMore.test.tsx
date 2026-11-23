/**
 * F49 (UAT-06), carried over to React in F83 wave 5a - the grid of the "all series" panel, in jsdom: the cut at 12 albums per series,
 * the button that says how many are held back, and the series the person opened drawn whole.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { SeriesGroups, type GridProps } from '../../../public/js/screens/albums/SeriesGroups'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const albumsOf = (seriesId: string, count: number) => Array.from({ length: count }, (_, index) => ({
    id: `${seriesId}-a${index + 1}`, title: `Album ${index + 1}`, artist: 'Artist', seriesIds: [seriesId], tracks: [], getTracks: () => []
}))
const SERIES = [
    { id: 'big', name: 'Big', albumQueries: [] },
    { id: 'small', name: 'Small', albumQueries: [] }
]

describe('SeriesGroups - more than 12 albums in a series', () => {
    let container: HTMLElement
    let root: Root
    const group = (seriesId: string) => container.querySelector(`.series-group[data-series-id="${seriesId}"]`)!
    const cards = (seriesId: string) => [...group(seriesId).querySelectorAll<HTMLElement>('.albums-grid > [data-id]')].map(card => card.dataset.id)
    const button = (seriesId: string) => group(seriesId).querySelector<HTMLElement>('[data-action="load-more-series"]')
    const label = (seriesId: string) => button(seriesId)?.textContent!.replace(/\s+/g, ' ').trim()
    const actions = { retry: vi.fn(), loadMore: vi.fn(), edit: vi.fn(), remove: vi.fn(), more: vi.fn() }
    const propsOf = (extra: Partial<GridProps> = {}): GridProps => ({
        albums: [...albumsOf('big', 15), ...albumsOf('small', 3)] as never, seriesList: SERIES, scope: 'ALL', layout: 'grid',
        context: { searchQuery: '', filters: {} }, isLoading: false, seriesStates: null, expandedSeriesIds: [], phone: false,
        act: vi.fn(), actions, ...extra
    })
    const draw = async (extra: Partial<GridProps> = {}) => { await act(async () => { root.render(<SeriesGroups {...propsOf(extra)} />) }) }

    beforeEach(() => {
        container = document.body.appendChild(document.createElement('div'))
        root = createRoot(container)
    })
    afterEach(async () => { await act(async () => { root.unmount() }); document.body.innerHTML = '' })

    it('draws the first 12 albums and a button that says how many are held back', async () => {
        await draw()

        expect(cards('big')).toEqual(albumsOf('big', 12).map(album => album.id))
        expect(label('big')).toBe('Load 3 more albums')
        expect(button('small')).toBeNull()
        expect(cards('small')).toHaveLength(3)
    })

    it('the button is a real button, with the series it belongs to', async () => {
        await draw()

        expect(button('big')!.tagName).toBe('BUTTON')
        expect(button('big')!.getAttribute('type')).toBe('button')
        expect(button('big')!.dataset.seriesId).toBe('big')
        expect(button('big')!.hasAttribute('disabled')).toBe(false)
        expect(button('big')!.getAttribute('tabindex')).toBeNull()
    })

    it('asks the screen for more of that series when pressed', async () => {
        await draw()
        await act(async () => { button('big')!.click() })
        expect(actions.loadMore).toHaveBeenCalledWith('big')
    })

    it('says "1 more album" in the singular', async () => {
        await draw({ albums: albumsOf('big', 13) as never })
        expect(label('big')).toBe('Load 1 more album')
    })

    it('draws every album of a series the person opened, in order, with no button', async () => {
        await draw({ expandedSeriesIds: ['big'] })

        expect(cards('big')).toEqual(albumsOf('big', 15).map(album => album.id))
        expect(button('big')).toBeNull()
    })

    it('keeps an opened series whole when the screen is drawn again with more albums', async () => {
        await draw({ expandedSeriesIds: ['big'] })
        await draw({ expandedSeriesIds: ['big'], albums: [...albumsOf('big', 20), ...albumsOf('small', 3)] as never })

        expect(cards('big')).toHaveLength(20)
        expect(button('big')).toBeNull()
    })

    it('opening one series leaves the others cut', async () => {
        await draw({
            seriesList: [...SERIES, { id: 'other', name: 'Other', albumQueries: [] }],
            albums: [...albumsOf('big', 15), ...albumsOf('other', 14)] as never,
            expandedSeriesIds: ['big']
        })

        expect(cards('other')).toHaveLength(12)
        expect(label('other')).toBe('Load 2 more albums')
    })

    it('the list layout has no cut: every album and no button', async () => {
        await draw({ layout: 'list' })

        expect(button('big')).toBeNull()
        albumsOf('big', 15).forEach(album => expect(group('big').innerHTML).toContain(album.id))
    })
})
