/**
 * F51 - the paging controls of the albums screen, in jsdom: what they show and what they report. Carried over to React in F83 wave 5a
 * (the old test mounted components/ui/Pager.js; the assertions are the same).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Pager, type PagerProps } from '../../../public/js/screens/albums/Pager'
import { PAGE_SIZES, PagingMode } from '../../../public/js/models/paging.js'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const paging = (extra = {}) => ({
    mode: PagingMode.PAGES, size: 10, page: 1, pages: 5, total: 45, from: 1, to: 10,
    hasMore: false, totalSeries: 45, unchecked: 0, single: false, ...extra
})

/** Draws the pager in a fresh container; drawing again in the same one is what the screen does when the paging changes. */
function setup(place?: 'top' | 'bottom') {
    const container = document.body.appendChild(document.createElement('div'))
    const state = { root: createRoot(container) as Root }
    const handlers = { onPage: vi.fn(), onSize: vi.fn(), onMode: vi.fn(), onMore: vi.fn() }
    const draw = async (value: unknown, extra: Partial<PagerProps> = {}) => {
        await act(async () => { state.root.render(<Pager paging={value as never} place={place} phone={false} {...handlers} {...extra} />) })
    }
    return { container, state, handlers, draw }
}

const textOf = (container: HTMLElement, selector: string) => container.querySelector(selector)?.textContent!.replace(/\s+/g, ' ').trim()
const click = (element: Element | null) => act(async () => { (element as HTMLElement).click() })

describe('Pager', () => {
    let s: ReturnType<typeof setup>
    const pageButtons = () => [...s.container.querySelectorAll('[data-pager-page]')].map(button => button.textContent!.trim())

    beforeEach(() => { s = setup() })
    afterEach(async () => { await act(async () => { s.state.root.unmount() }); document.body.innerHTML = '' })

    it('draws nothing with no paging or with no series at all', async () => {
        await s.draw(null)
        expect(s.container.innerHTML).toBe('')
        await s.draw(paging({ totalSeries: 0, total: 0 }))
        expect(s.container.innerHTML).toBe('')
    })

    it('says how many series are shown out of how many', async () => {
        await s.draw(paging())
        expect(textOf(s.container, '.series-pager-count')).toBe('Showing 1–10 of 45 series')
    })

    it('says the total of all series when a filter narrowed the list', async () => {
        await s.draw(paging({ total: 4, to: 4, pages: 1, totalSeries: 45 }))
        expect(textOf(s.container, '.series-pager-count')).toBe('Showing 1–4 of 4 series (of 45 in all)')
    })

    it('says so when no series passes the filters', async () => {
        await s.draw(paging({ total: 0, from: 0, to: 0, pages: 1 }))
        expect(textOf(s.container, '.series-pager-count')).toBe('No series matches these filters')
        expect(s.container.querySelector('.series-pager-pages')).toBeNull()
    })

    it('offers the page sizes from 10 to 100, with the current one selected, and reports a change', async () => {
        await s.draw(paging({ size: 30 }))
        const select = s.container.querySelector<HTMLSelectElement>('.series-pager-size')!
        expect([...select.options].map(option => Number(option.value))).toEqual([10, 20, 30, 40, 50, 60, 70, 80, 90, 100])
        expect([...select.options].map(option => Number(option.value))).toEqual([...PAGE_SIZES])
        expect(select.value).toBe('30')

        await act(async () => {
            Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!.call(select, '100') // the way a browser writes into a list React owns
            select.dispatchEvent(new Event('change', { bubbles: true }))
        })
        expect(s.handlers.onSize).toHaveBeenCalledWith(100)
    })

    it('draws one button per page, marks the current one and reports the page asked for', async () => {
        await s.draw(paging({ page: 2, from: 11, to: 20 }))
        expect(pageButtons()).toEqual(['Previous', '1', '2', '3', '4', '5', 'Next'])
        expect(s.container.querySelector('[aria-current="page"]')!.textContent!.trim()).toBe('2')

        await click(s.container.querySelector('[data-pager-page="4"]'))
        expect(s.handlers.onPage).toHaveBeenCalledWith(4)
        await click(s.container.querySelectorAll('[data-pager-page]')[0]) // Previous
        expect(s.handlers.onPage).toHaveBeenLastCalledWith(1)
    })

    it('disables Previous on the first page and Next on the last, and they report nothing', async () => {
        await s.draw(paging({ page: 1 }))
        const buttons = () => [...s.container.querySelectorAll<HTMLButtonElement>('[data-pager-page]')]
        expect(buttons()[0].disabled).toBe(true)
        await click(buttons()[0])

        await s.draw(paging({ page: 5, from: 41, to: 45 }))
        expect(buttons().at(-1)!.disabled).toBe(true)
        await click(buttons().at(-1)!)

        expect(s.handlers.onPage).not.toHaveBeenCalled()
    })

    it('draws no page buttons when everything fits in one page', async () => {
        await s.draw(paging({ pages: 1, total: 7, to: 7, totalSeries: 7 }))
        expect(s.container.querySelector('.series-pager-pages')).toBeNull()
    })

    it('collapses a long run of pages into gaps, keeping the ends and the neighbours of the current page', async () => {
        await s.draw(paging({ page: 10, pages: 22, total: 217, from: 91, to: 100, totalSeries: 217 }))
        expect(pageButtons()).toEqual(['Previous', '1', '2', '9', '10', '11', '21', '22', 'Next'])
        expect(s.container.querySelectorAll('.series-pager-pages span').length).toBe(2)
    })

    it('reports a change of form, and not a click on the form already in use', async () => {
        await s.draw(paging())
        await click(s.container.querySelector(`[data-pager-mode="${PagingMode.PAGES}"]`))
        expect(s.handlers.onMode).not.toHaveBeenCalled()

        await click(s.container.querySelector(`[data-pager-mode="${PagingMode.SCROLL}"]`))
        expect(s.handlers.onMode).toHaveBeenCalledWith(PagingMode.SCROLL)
    })

    describe('the list that grows (scroll)', () => {
        const scroll = (extra = {}) => paging({ mode: PagingMode.SCROLL, pages: 1, hasMore: true, ...extra })

        it('offers the next batch, no page buttons, and reports the request', async () => {
            await s.draw(scroll())
            expect(s.container.querySelector('.series-pager-pages')).toBeNull()
            expect(s.container.querySelector('[data-pager-mode="scroll"]')!.getAttribute('aria-pressed')).toBe('true')
            const more = s.container.querySelector('[data-pager-more]')!
            expect(more.textContent).toBe('Load 10 more')

            await click(more)
            expect(s.handlers.onMore).toHaveBeenCalledTimes(1)
        })

        it('the last batch says how many are really left', async () => {
            await s.draw(scroll({ to: 40 }))
            expect(s.container.querySelector('[data-pager-more]')!.textContent).toBe('Load 5 more')
        })

        it('says everything is on screen when nothing is left', async () => {
            await s.draw(scroll({ to: 45, hasMore: false }))
            expect(s.container.querySelector('[data-pager-more]')).toBeNull()
            expect(s.container.textContent).toContain('All 45 series are on screen.')
        })

        it('asks for the next batch once when the end of the list comes into view', async () => {
            type Watcher = { callback: (entries: unknown[]) => void; disconnect: ReturnType<typeof vi.fn>; element?: Element }
            const observers: Watcher[] = []
            vi.stubGlobal('IntersectionObserver', class {
                callback: Watcher['callback']
                disconnect = vi.fn()
                element?: Element
                constructor(callback: Watcher['callback']) { this.callback = callback; observers.push(this as Watcher) }
                observe(element: Element) { this.element = element }
            })
            try {
                await s.draw(scroll())
                const first = observers.at(-1)!
                expect(first.element).toBe(s.container.querySelector('[data-pager-sentinel]'))

                first.callback([{ isIntersecting: false }])
                expect(s.handlers.onMore).not.toHaveBeenCalled()
                first.callback([{ isIntersecting: true }])
                first.callback([{ isIntersecting: true }])
                expect(s.handlers.onMore).toHaveBeenCalledTimes(1)

                await s.draw(scroll({ to: 20 })) // a new draw watches anew and lets go of the old watch
                expect(first.disconnect).toHaveBeenCalled()
                const second = observers.at(-1)!
                expect(second).not.toBe(first)
                await act(async () => { s.state.root.unmount() })
                expect(second.disconnect).toHaveBeenCalled()
                s.state.root = createRoot(s.container) // afterEach unmounts what is there
            } finally {
                vi.unstubAllGlobals()
            }
        })
    })

    it('does not redraw when nothing changed: the controls stay the same elements', async () => {
        await s.draw(paging())
        const select = s.container.querySelector('.series-pager-size')
        const button = s.container.querySelector('[data-pager-page="2"]')

        await s.draw(paging())

        expect(s.container.querySelector('.series-pager-size')).toBe(select)
        expect(s.container.querySelector('[data-pager-page="2"]')).toBe(button)

        await s.draw(paging({ page: 2, from: 11, to: 20 }))
        expect(s.container.querySelector('.series-pager-size')).not.toBe(select)
    })

    describe('albums not checked against the sources yet (the filter by source)', () => {
        it('says nothing when every album was checked', async () => {
            await s.draw(paging())
            expect(s.container.querySelector('.series-pager-unchecked')).toBeNull()
        })

        it('says how many albums the filter cannot answer for yet', async () => {
            await s.draw(paging({ unchecked: 150 }))
            expect(textOf(s.container, '.series-pager-unchecked')).toBe('150 albums have not been checked against the sources yet, so this filter may miss them. An album is checked the first time its series loads.')
            await s.draw(paging({ unchecked: 1 }))
            expect(textOf(s.container, '.series-pager-unchecked')).toBe('1 album has not been checked against the sources yet, so this filter may miss it. An album is checked the first time its series loads.')
        })

        it('shows the notice beside "no series matches", where it explains the empty list', async () => {
            await s.draw(paging({ total: 0, from: 0, to: 0, pages: 1, unchecked: 12 }))
            expect(textOf(s.container, '.series-pager-count')).toBe('No series matches these filters')
            expect(textOf(s.container, '.series-pager-unchecked')).toContain('12 albums have not been checked')
        })

        it('with one series on screen, shows only the notice, or nothing', async () => {
            await s.draw(paging({ single: true, unchecked: 3 }))
            expect(textOf(s.container, '.series-pager-unchecked')).toContain('3 albums have not been checked')
            expect(s.container.querySelector('.series-pager-size')).toBeNull()
            expect(s.container.querySelector('.series-pager-count')).toBeNull()

            await s.draw(paging({ single: true, unchecked: 0 }))
            expect(s.container.innerHTML).toBe('')
        })
    })
})

describe('Pager above the list (F72)', () => {
    let s: ReturnType<typeof setup>

    beforeEach(() => { s = setup('top') })
    afterEach(async () => { await act(async () => { s.state.root.unmount() }); document.body.innerHTML = '' })

    it('shows the same count, page size, form and page numbers, and reports the same', async () => {
        await s.draw(paging())

        expect(s.container.querySelector('[data-pager-place="top"]')).not.toBe(null)
        expect(textOf(s.container, '.series-pager-count')).toBe('Showing 1–10 of 45 series')
        expect(s.container.querySelector<HTMLSelectElement>('.series-pager-size')!.value).toBe('10')
        await click(s.container.querySelector('[data-pager-page="2"]'))
        expect(s.handlers.onPage).toHaveBeenCalledWith(2)
        await click(s.container.querySelector(`[data-pager-mode="${PagingMode.SCROLL}"]`))
        expect(s.handlers.onMode).toHaveBeenCalledWith(PagingMode.SCROLL)
    })

    it('in the growing list it has no "Load more" and nothing that asks for more by being seen', async () => {
        await s.draw(paging({ mode: PagingMode.SCROLL, hasMore: true, to: 10 }))

        expect(textOf(s.container, '.series-pager-count')).toBe('Showing 1–10 of 45 series')
        expect(s.container.querySelector('[data-pager-more]')).toBe(null)
        expect(s.container.querySelector('[data-pager-sentinel]')).toBe(null)
    })

    it('leaves the notice about unchecked albums to the pager below, and draws nothing for one series', async () => {
        await s.draw(paging({ unchecked: 3 }))
        expect(s.container.querySelector('.series-pager-unchecked')).toBe(null)

        await s.draw(paging({ single: true, unchecked: 3 }))
        expect(s.container.innerHTML).toBe('')
    })

    it('does not announce the count twice: only the pager below is a live region', async () => {
        await s.draw(paging())
        expect(s.container.querySelector('.series-pager-count')!.hasAttribute('aria-live')).toBe(false)
    })
})

describe('Pager: how many albums the series on screen hold (F72)', () => {
    afterEach(() => { document.body.innerHTML = '' })

    const count = async (value: unknown, place?: 'top' | 'bottom') => {
        const s = setup(place)
        await s.draw(value)
        const text = textOf(s.container, '.series-pager-count')
        await act(async () => { s.state.root.unmount() })
        return text
    }

    it('says it beside the series, in the pager below and in the one above', async () => {
        expect(await count(paging({ from: 1, to: 20, total: 48, totalSeries: 48, size: 20, albums: 97 }))).toBe('Showing 1–20 of 48 series · 97 albums')
        expect(await count(paging({ albums: 97 }), 'top')).toBe('Showing 1–10 of 45 series · 97 albums')
    })

    it('follows what is on screen: more albums after the scroll loads more series', async () => {
        const scroll = paging({ mode: PagingMode.SCROLL, hasMore: true, to: 10, albums: 51 })
        expect(await count(scroll)).toBe('Showing 1–10 of 45 series · 51 albums')
        expect(await count({ ...scroll, to: 20, albums: 104 })).toBe('Showing 1–20 of 45 series · 104 albums')
    })

    it('writes one album in the singular, keeps the filtered note, and says nothing with no count', async () => {
        expect(await count(paging({ from: 1, to: 1, total: 1, totalSeries: 45, albums: 1 }))).toBe('Showing 1–1 of 1 series (of 45 in all) · 1 album')
        expect(await count(paging())).toBe('Showing 1–10 of 45 series')
    })
})
