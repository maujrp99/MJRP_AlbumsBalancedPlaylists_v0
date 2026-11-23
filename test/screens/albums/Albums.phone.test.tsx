/**
 * F76 (REQ-05, REQ-12) - the albums screen on the phone, in jsdom, with matchMedia answering as a phone and as a computer: the album as a
 * tile or a compact row with its actions named behind «⋯», the series header with its «⋯», and the pager drawn for the finger. On the
 * computer the markup is today's. Carried over to React in F83 wave 5a: the old test mounted the hand-made pieces; the assertions are
 * the same. What belongs to the filter bar (the «Filters» button, the chips, the sheet) is in test/ui/FilterToolbar.test.tsx.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { SeriesGroups, type GridProps } from '../../../public/js/screens/albums/SeriesGroups'
import { usePhoneSheets } from '../../../public/js/screens/albums/PhoneSheets'
import { Header } from '../../../public/js/screens/albums/Header'
import { Pager } from '../../../public/js/screens/albums/Pager'
import { PagingMode } from '../../../public/js/models/paging.js'
import { releasePageScroll } from '../../../public/js/utils/pageScrollLock.js'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const realMatchMedia = window.matchMedia
/** The screen answers as a phone (393 px) or as a computer (1280 px). */
function screenOf(phone: boolean) {
    window.matchMedia = ((query: string) => ({
        media: query,
        matches: query.includes('max-width: 899px') ? phone : false,
        addEventListener: () => {},
        removeEventListener: () => {}
    })) as never
}

const ALBUM = {
    id: 'a1', title: 'In the Court of the Crimson King (An Observation by King Crimson)', artist: 'King Crimson', year: 1969,
    hasUserRanking: true, bestEverAlbumId: '123', spotifyId: 'sp1', seriesIds: ['s1'],
    getTracks: () => [{ title: 'Epitaph', position: 1 }], tracks: []
}
const text = (el: Element | null | undefined) => el?.textContent!.replace(/\s+/g, ' ').trim()
const sheetRows = () => [...document.querySelectorAll('.albums-sheet .albums-sheet__row')].map(text)

describe('Albums on the phone', () => {
    let container: HTMLElement
    let root: Root
    const draw = async (node: React.ReactElement) => { await act(async () => { root.render(node) }) }
    const click = (element: Element | null | undefined) => act(async () => { (element as HTMLElement).click() })

    const actions = { retry: vi.fn(), loadMore: vi.fn(), edit: vi.fn(), remove: vi.fn(), more: vi.fn() }
    const gridOf = (phone: boolean, extra: Partial<GridProps> = {}): GridProps => ({
        albums: [ALBUM] as never, seriesList: [{ id: 's1', name: 'Prog' }], scope: 'SINGLE', layout: 'grid',
        context: { searchQuery: '', filters: {} }, isLoading: false, seriesStates: null, expandedSeriesIds: [], phone,
        act: vi.fn(), actions, ...extra
    })

    beforeEach(() => {
        releasePageScroll(window)
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

    describe('the album', () => {
        it('on the computer is today\'s card; on the phone a tile with the title whole and a named «⋯»', async () => {
            screenOf(false)
            await draw(<SeriesGroups {...gridOf(false)} />)
            expect(container.querySelector('[data-action="rank-album"]')).not.toBeNull()
            expect(container.querySelector('.album-tile')).toBeNull()

            screenOf(true)
            await draw(<SeriesGroups {...gridOf(true)} />)
            expect(container.querySelector('[data-action="rank-album"]')).toBeNull()
            expect(text(container.querySelector('.album-tile__title'))).toBe(ALBUM.title)
            expect(text(container.querySelector('.album-tile__artist'))).toBe('King Crimson · 1969')
            expect(container.querySelector('.album-more')!.getAttribute('aria-label')).toBe(`Actions for ${ALBUM.title}`)
            expect((container.querySelector('.album-tile__cover') as HTMLElement).dataset.action).toBe('view-modal')
        })

        it('in the list, on the phone, is one compact row with no table of tracks', async () => {
            screenOf(true)
            await draw(<SeriesGroups {...gridOf(true, { layout: 'list' })} />)
            expect(container.querySelector('.album-row')).not.toBeNull()
            expect(container.querySelector('table, .tracks-table-root')).toBeNull()
            expect([...container.querySelectorAll('.album-row__badges-item')].map(text)).toEqual(['My ranking', 'BestEverAlbums', 'Spotify'])
        })

        it('its «⋯» opens a sheet with every action named, Remove last; each one goes the computer\'s way', async () => {
            screenOf(true)
            const picked = vi.fn()
            function Screen() {
                const sheets = usePhoneSheets()
                const act: GridProps['act'] = (action, album) => { if (action === 'album-more') sheets.openAlbum(album, (chosen) => picked(chosen, album)) }
                return <><SeriesGroups {...gridOf(true, { act })} />{sheets.layer}</>
            }
            await draw(<Screen />)
            await click(container.querySelector('.album-more'))
            expect(sheetRows()).toEqual(['View album and tracks', 'Edit my ranking', 'Add to inventory', 'Fetch the details again', 'Open in Spotify', 'See on BestEverAlbums', 'Remove from this series'])
            const rows = document.querySelectorAll('.albums-sheet .albums-sheet__row')
            await click(rows[rows.length - 1])
            expect(picked).toHaveBeenCalledWith('remove-album', ALBUM)
        })
    })

    describe('the series', () => {
        it('the header has a «⋯» the computer never shows, and Edit and Delete are named in its sheet', async () => {
            screenOf(true)
            const series = { id: 's1', name: 'Alternative R&B/Psychedelic/Avant-garde' }
            const onEdit = vi.fn()
            const onDelete = vi.fn()
            function Screen() {
                const sheets = usePhoneSheets()
                const more = (_id: string, count: number) => sheets.openSeries(series.name, count, { onEdit, onDelete })
                return (
                    <>
                        <SeriesGroups {...gridOf(true, { scope: 'ALL', seriesList: [series], albums: Array.from({ length: 7 }, (_, i) => ({ ...ALBUM, id: `a${i}` })) as never, actions: { ...actions, more } })} />
                        {sheets.layer}
                    </>
                )
            }
            await draw(<Screen />)
            const more = container.querySelector('.series-more')!
            expect(more.classList.contains('md:hidden')).toBe(true)
            await click(more)
            expect(sheetRows()).toEqual(['Edit series', 'Delete series'])
            expect(text(document.querySelector('.albums-sheet__about'))).toBe('7 albums')
            await click(document.querySelectorAll('.albums-sheet .albums-sheet__row')[1])
            expect(onDelete).toHaveBeenCalledTimes(1)
        })

        it('the page header of one series names it and carries its «⋯»; all the series carry none', async () => {
            const header = { title: 'Prog', seriesId: 's1' as string | null, onNavigate: vi.fn(), onBlend: vi.fn(), onMore: vi.fn() }
            await draw(<Header {...header} />)
            expect(container.querySelector('.series-page-header--single h1')!.textContent).toContain('Prog')
            expect((container.querySelector('.series-more') as HTMLElement).dataset.seriesId).toBe('s1')
            await draw(<Header {...header} title="All Series" seriesId={null} />)
            expect(container.querySelector('.series-page-header--all')).not.toBeNull()
            expect(container.querySelector('.series-more')).toBeNull()
        })
    })

    describe('the pager', () => {
        const paging = (extra = {}) => ({ mode: PagingMode.PAGES, size: 10, page: 2, pages: 5, total: 45, from: 11, to: 20, hasMore: false, totalSeries: 45, albums: 80, unchecked: 0, single: false, ...extra })
        const handlers = () => ({ onPage: vi.fn(), onSize: vi.fn(), onMode: vi.fn(), onMore: vi.fn() })

        it('above the list on the phone is one line: the count and Previous / Next of 44 px', async () => {
            screenOf(true)
            const h = handlers()
            await draw(<Pager paging={paging()} place="top" phone {...h} />)
            expect(text(container.querySelector('.series-pager-count'))).toBe('11–20 of 45 series · 80 albums')
            expect(container.querySelector('.series-pager-size')).toBeNull()
            await click(container.querySelector('[aria-label="Next page"]'))
            expect(h.onPage).toHaveBeenCalledWith(3)
        })

        it('below the list on the phone jumps to any page and keeps the size and the form', async () => {
            screenOf(true)
            const h = handlers()
            await draw(<Pager paging={paging()} phone {...h} />)
            const jump = container.querySelector<HTMLSelectElement>('.series-pager-jump')!
            expect(jump.value).toBe('2')
            await act(async () => {
                Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!.call(jump, '5')
                jump.dispatchEvent(new Event('change', { bubbles: true }))
            })
            expect(h.onPage).toHaveBeenCalledWith(5)
            await click(container.querySelector(`[data-pager-mode="${PagingMode.SCROLL}"]`))
            expect(h.onMode).toHaveBeenCalledWith(PagingMode.SCROLL)
            expect(container.querySelector('.series-pager-size')).not.toBeNull()
        })

        it('on the computer is today\'s', async () => {
            screenOf(false)
            await draw(<Pager paging={paging()} place="top" phone={false} {...handlers()} />)
            expect(container.querySelector('.series-pager--phone')).toBeNull()
            expect(container.querySelectorAll('[data-pager-page]').length).toBeGreaterThan(3)
        })
    })
})
