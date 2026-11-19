/**
 * F49 (UAT-06) - the grid of the "all series" panel, in jsdom: the cut at 12 albums per series, the
 * button that says how many are held back, and the series the person opened drawn whole.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import SeriesGridRenderer from '../../../public/js/components/series/SeriesGridRenderer.js'

const albumsOf = (seriesId, count) => Array.from({ length: count }, (_, index) => ({
    id: `${seriesId}-a${index + 1}`, title: `Album ${index + 1}`, artist: 'Artist', seriesIds: [seriesId], tracks: [], getTracks: () => []
}))
const SERIES = [
    { id: 'big', name: 'Big', albumQueries: [] },
    { id: 'small', name: 'Small', albumQueries: [] }
]

describe('SeriesGridRenderer - more than 12 albums in a series', () => {
    let container, grid
    const group = (seriesId) => container.querySelector(`.series-group[data-series-id="${seriesId}"]`)
    const cards = (seriesId) => [...group(seriesId).querySelectorAll('.albums-grid > [data-id]')].map(card => card.dataset.id)
    const button = (seriesId) => group(seriesId).querySelector('[data-action="load-more-series"]')
    const label = (seriesId) => button(seriesId)?.textContent.replace(/\s+/g, ' ').trim()
    const mount = (props = {}) => {
        grid = new SeriesGridRenderer({
            container,
            props: {
                items: [...albumsOf('big', 15), ...albumsOf('small', 3)],
                layout: 'grid', scope: 'ALL', seriesList: SERIES, pageBounded: true, context: {}, ...props
            }
        })
        grid.mount()
        return grid
    }

    beforeEach(() => {
        document.body.innerHTML = ''
        container = document.createElement('div')
        document.body.appendChild(container)
    })

    it('draws the first 12 albums and a button that says how many are held back', () => {
        mount()

        expect(cards('big')).toEqual(albumsOf('big', 12).map(album => album.id))
        expect(label('big')).toBe('Load 3 more albums')
        expect(button('small')).toBeNull()
        expect(cards('small')).toHaveLength(3)
    })

    it('the button is a real button, with the series it belongs to', () => {
        mount()

        expect(button('big').tagName).toBe('BUTTON')
        expect(button('big').getAttribute('type')).toBe('button')
        expect(button('big').dataset.seriesId).toBe('big')
        expect(button('big').hasAttribute('disabled')).toBe(false)
        expect(button('big').getAttribute('tabindex')).toBeNull()
    })

    it('says "1 more album" in the singular', () => {
        mount({ items: albumsOf('big', 13) })
        expect(label('big')).toBe('Load 1 more album')
    })

    it('draws every album of a series the person opened, in order, with no button', () => {
        mount({ expandedSeriesIds: ['big'] })

        expect(cards('big')).toEqual(albumsOf('big', 15).map(album => album.id))
        expect(button('big')).toBeNull()
    })

    it('keeps an opened series whole when the screen is drawn again with more albums', () => {
        mount({ expandedSeriesIds: ['big'] })
        grid.update({ items: [...albumsOf('big', 20), ...albumsOf('small', 3)] })

        expect(cards('big')).toHaveLength(20)
        expect(button('big')).toBeNull()
    })

    it('opening one series leaves the others cut', () => {
        mount({
            seriesList: [...SERIES, { id: 'other', name: 'Other', albumQueries: [] }],
            items: [...albumsOf('big', 15), ...albumsOf('other', 14)],
            expandedSeriesIds: ['big']
        })

        expect(cards('other')).toHaveLength(12)
        expect(label('other')).toBe('Load 2 more albums')
    })

    it('the list layout has no cut: every album and no button', () => {
        mount({ layout: 'list' })

        expect(button('big')).toBeNull()
        albumsOf('big', 15).forEach(album => expect(group('big').innerHTML).toContain(album.id))
    })

    it('moves the focus to the first album the click brought', () => {
        mount({ expandedSeriesIds: ['big'] })

        expect(grid.focusAlbum('big', 12)).toBe(true)
        expect(document.activeElement.dataset.id).toBe('big-a13')
        expect(grid.focusAlbum('big', 99)).toBe(false)
        expect(grid.focusAlbum('nope', 0)).toBe(false)
    })
})
