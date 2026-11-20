/**
 * F76 (REQ-05, REQ-12) - the albums screen on the phone, in jsdom, with matchMedia answering as a
 * phone and as a computer: the search and a «Filters» button with how many are on (the rest in a
 * sheet), the album as a tile or a compact row with its actions named behind «⋯», the series
 * header with its «⋯», and the pager drawn for the finger. On the computer the markup is today's.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import FilterToolbar from '../../../public/js/components/ui/FilterToolbar.js'
import Pager from '../../../public/js/components/ui/Pager.js'
import SeriesEventHandler from '../../../public/js/components/series/SeriesEventHandler.js'
import SeriesHeader from '../../../public/js/components/series/SeriesHeader.js'
import { renderCompactAlbumCard, renderExpandedAlbumCard } from '../../../public/js/views/albums/AlbumsGridRenderer.js'
import { renderSeriesHeader } from '../../../public/js/views/albums/AlbumsScopedRenderer.js'
import { activeFilters } from '../../../public/js/components/ui/FilterSheet.js'
import { albumsStore } from '../../../public/js/stores/albums.js'
import { PagingMode } from '../../../public/js/models/paging.js'

const realMatchMedia = window.matchMedia
/** The screen answers as a phone (393 px) or as a computer (1280 px); a turn tells the listeners. */
function screenOf(phone) {
    const listeners = new Set()
    const state = { phone }
    window.matchMedia = (query) => ({
        media: query,
        get matches() { return query.includes('max-width: 767px') ? state.phone : false },
        addEventListener: (type, listener) => listeners.add(listener),
        removeEventListener: (type, listener) => listeners.delete(listener)
    })
    return { turn(next) { state.phone = next; listeners.forEach(listener => listener({ matches: next })) } }
}

const ALBUM = {
    id: 'a1', title: 'In the Court of the Crimson King (An Observation by King Crimson)', artist: 'King Crimson', year: 1969,
    hasUserRanking: true, bestEverAlbumId: '123', spotifyId: 'sp1', seriesIds: ['s1'],
    getTracks: () => [{ title: 'Epitaph', position: 1 }], tracks: []
}
const text = (el) => el?.textContent.replace(/\s+/g, ' ').trim()
const sheetRows = () => [...document.querySelectorAll('.albums-sheet .albums-sheet__row')].map(text)

function toolbarProps(overrides = {}) {
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

describe('Albums on the phone', () => {
    let container
    beforeEach(() => {
        vi.useFakeTimers()
        window.scrollTo = () => { } // the sheet gives the page its place back; jsdom draws no page
        document.body.innerHTML = ''
        container = document.createElement('div')
        document.body.appendChild(container)
    })
    afterEach(() => {
        document.querySelectorAll('.sheet__close').forEach(button => button.click())
        vi.runAllTimers()
        vi.useRealTimers()
        window.matchMedia = realMatchMedia
        vi.restoreAllMocks()
    })

    describe('the toolbar', () => {
        it('on the computer is today\'s: no «Filters» button, the controls beside the search', () => {
            screenOf(false)
            const plain = document.createElement('div')
            new FilterToolbar({ container: plain, props: { ...toolbarProps(), filtersInSheet: false } }).mount()
            new FilterToolbar({ container, props: toolbarProps() }).mount()
            expect(container.querySelector('.filters-phone-button')).toBeNull()
            expect(container.innerHTML).toBe(plain.innerHTML)
        })

        it('on the phone keeps the search and says how many filters are on, with a chip per filter', () => {
            screenOf(true)
            const props = toolbarProps()
            new FilterToolbar({ container, props }).mount()
            const button = container.querySelector('.filters-phone-button')
            expect(button.getAttribute('aria-label')).toBe('Filters, 2 on')
            expect(container.querySelector('#genericSearch')).not.toBeNull()
            expect([...container.querySelectorAll('.filters-chip')].map(text)).toEqual(['Artist: Rush', 'Year: 1970s'])
            container.querySelector('.filters-chip').click()
            expect(props.filterGroups[1].onChange).toHaveBeenCalledWith('all')
            container.querySelector('.filters-chips__clear').click()
            expect(props.filterGroups[2].onChange).toHaveBeenCalledWith('all')
        })

        it('the «Filters» button opens a sheet with the view, the order and each filter, through the same handlers', () => {
            screenOf(true)
            const props = toolbarProps()
            new FilterToolbar({ container, props }).mount()
            container.querySelector('.filters-phone-button').click()
            const sheet = document.querySelector('.filter-sheet-window')
            expect(text(sheet.querySelector('.sheet__title'))).toBe('Filters · 2 on')
            const artist = sheet.querySelector('#sheetFilter_artist')
            expect(artist.value).toBe('Rush')
            artist.value = 'all'
            artist.dispatchEvent(new Event('change'))
            expect(props.filterGroups[1].onChange).toHaveBeenCalledWith('all')
            sheet.querySelector('#sheetSort').dispatchEvent(new Event('change'))
            expect(props.onSort).toHaveBeenCalledWith('alpha')
            sheet.querySelector('[data-view-mode="expanded"]').click()
            expect(props.onToggleView).toHaveBeenCalledTimes(1)
            sheet.querySelector('.filter-sheet__clear').click()
            expect(props.filterGroups[2].onChange).toHaveBeenCalledWith('all')
        })

        it('a turn to the computer takes the phone\'s bar off', () => {
            const screen = screenOf(true)
            new FilterToolbar({ container, props: toolbarProps() }).mount()
            screen.turn(false)
            expect(container.querySelector('.filters-phone')).toBeNull()
        })

        it('counts as on only a filter with a value', () => {
            expect(activeFilters(toolbarProps().filterGroups).map(item => item.name)).toEqual(['Artist', 'Year'])
        })
    })

    describe('the album', () => {
        it('on the computer is today\'s card; on the phone a tile with the title whole and a named «⋯»', () => {
            screenOf(false)
            const card = renderCompactAlbumCard(ALBUM)
            expect(card).toContain('data-action="rank-album"')
            expect(card).not.toContain('album-tile')
            screenOf(true)
            container.innerHTML = renderCompactAlbumCard(ALBUM)
            expect(container.querySelector('[data-action="rank-album"]')).toBeNull()
            expect(text(container.querySelector('.album-tile__title'))).toBe(ALBUM.title)
            expect(text(container.querySelector('.album-tile__artist'))).toBe('King Crimson · 1969')
            expect(container.querySelector('.album-more').getAttribute('aria-label')).toBe(`Actions for ${ALBUM.title}`)
            expect(container.querySelector('.album-tile__cover').dataset.action).toBe('view-modal')
        })

        it('in the list, on the phone, is one compact row with no table of tracks', () => {
            screenOf(true)
            container.innerHTML = renderExpandedAlbumCard(ALBUM, 0)
            expect(container.querySelector('.album-row')).not.toBeNull()
            expect(container.querySelector('table, .tracks-table-root')).toBeNull()
            expect([...container.querySelectorAll('.album-row__badges-item')].map(text)).toEqual(['My ranking', 'BestEverAlbums', 'Spotify'])
        })

        it('its «⋯» opens a sheet with every action named, Remove last; each one goes the computer\'s way', async () => {
            screenOf(true)
            vi.spyOn(albumsStore, 'getAlbums').mockReturnValue([ALBUM])
            container.innerHTML = `<div data-series-id="s1">${renderCompactAlbumCard(ALBUM)}</div>`
            const handler = new SeriesEventHandler({ container, props: {} })
            handler.mount()
            const remove = vi.spyOn(handler, 'handleRemoveAlbum').mockResolvedValue()
            container.querySelector('.album-more').click()
            expect(sheetRows()).toEqual(['View album and tracks', 'Edit my ranking', 'Add to inventory', 'Fetch the details again', 'Open in Spotify', 'See on BestEverAlbums', 'Remove from this series'])
            const rows = document.querySelectorAll('.albums-sheet .albums-sheet__row')
            rows[rows.length - 1].click()
            await Promise.resolve()
            expect(remove).toHaveBeenCalledWith(ALBUM, container.querySelector('.album-more'))
        })
    })

    describe('the series', () => {
        it('the header has a «⋯» the computer never shows, and Edit and Delete are named in its sheet', async () => {
            screenOf(true)
            container.innerHTML = `<div class="series-group" data-series-id="s1">${renderSeriesHeader({ id: 's1', name: 'Alternative R&B/Psychedelic/Avant-garde' }, 7)}</div>`
            const more = container.querySelector('.series-more')
            expect(more.classList.contains('md:hidden')).toBe(true)
            const props = { onEditSeries: vi.fn(), onDeleteSeries: vi.fn() }
            const handler = new SeriesEventHandler({ container, props })
            handler.mount()
            more.click()
            await Promise.resolve()
            expect(sheetRows()).toEqual(['Edit series', 'Delete series'])
            expect(text(document.querySelector('.albums-sheet__about'))).toBe('7 albums')
            document.querySelectorAll('.albums-sheet .albums-sheet__row')[1].click()
            expect(props.onDeleteSeries).toHaveBeenCalledWith('s1')
        })

        it('the page header of one series names it and carries its «⋯»; all the series carry none', () => {
            const header = new SeriesHeader({ container, props: { pageTitle: 'Prog', seriesId: 's1', onGeneratePlaylists: vi.fn() } })
            header.mount()
            expect(container.querySelector('.series-page-header--single h1').textContent).toContain('Prog')
            expect(container.querySelector('.series-more').dataset.seriesId).toBe('s1')
            header.update({ pageTitle: 'All Albums Series', seriesId: null })
            expect(container.querySelector('.series-page-header--all')).not.toBeNull()
            expect(container.querySelector('.series-more')).toBeNull()
        })
    })

    describe('the pager', () => {
        const paging = (extra = {}) => ({ mode: PagingMode.PAGES, size: 10, page: 2, pages: 5, total: 45, from: 11, to: 20, hasMore: false, totalSeries: 45, albums: 80, unchecked: 0, single: false, ...extra })
        const mount = (props) => { const pager = new Pager({ container, props }); pager.mount(); return pager }

        it('above the list on the phone is one line: the count and Previous / Next of 44 px', () => {
            screenOf(true)
            const onPage = vi.fn()
            mount({ paging: paging(), place: 'top', onPage })
            expect(text(container.querySelector('.series-pager-count'))).toBe('11–20 of 45 series · 80 albums')
            expect(container.querySelector('.series-pager-size')).toBeNull()
            container.querySelector('[aria-label="Next page"]').click()
            expect(onPage).toHaveBeenCalledWith(3)
        })

        it('below the list on the phone jumps to any page and keeps the size and the form', () => {
            screenOf(true)
            const handlers = { onPage: vi.fn(), onSize: vi.fn(), onMode: vi.fn() }
            mount({ paging: paging(), ...handlers })
            const jump = container.querySelector('.series-pager-jump')
            expect(jump.value).toBe('2')
            jump.value = '5'
            jump.dispatchEvent(new Event('change'))
            expect(handlers.onPage).toHaveBeenCalledWith(5)
            container.querySelector(`[data-pager-mode="${PagingMode.SCROLL}"]`).click()
            expect(handlers.onMode).toHaveBeenCalledWith(PagingMode.SCROLL)
            expect(container.querySelector('.series-pager-size')).not.toBeNull()
        })

        it('on the computer is today\'s', () => {
            screenOf(false)
            mount({ paging: paging(), place: 'top' })
            expect(container.querySelector('.series-pager--phone')).toBeNull()
            expect(container.querySelectorAll('[data-pager-page]').length).toBeGreaterThan(3)
        })
    })
})
