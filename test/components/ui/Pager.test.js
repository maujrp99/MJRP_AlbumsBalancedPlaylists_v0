/**
 * F51 - the paging controls of the albums screen, in jsdom: what they show and what they report.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Pager from '../../../public/js/components/ui/Pager.js'
import { PAGE_SIZES, PagingMode } from '../../../public/js/models/paging.js'

const paging = (extra = {}) => ({
    mode: PagingMode.PAGES, size: 10, page: 1, pages: 5, total: 45, from: 1, to: 10,
    hasMore: false, totalSeries: 45, unchecked: 0, single: false, ...extra
})

describe('Pager', () => {
    let container, handlers, pager
    const mount = (value) => {
        pager = new Pager({ container, props: { paging: value, ...handlers } })
        pager.mount()
        return pager
    }
    const text = (selector) => container.querySelector(selector)?.textContent.replace(/\s+/g, ' ').trim()
    const pageButtons = () => [...container.querySelectorAll('[data-pager-page]')].map(button => button.textContent.trim())

    beforeEach(() => {
        container = document.createElement('div')
        document.body.appendChild(container)
        handlers = { onPage: vi.fn(), onSize: vi.fn(), onMode: vi.fn(), onMore: vi.fn() }
    })

    it('draws nothing with no paging or with no series at all', () => {
        mount(null)
        expect(container.innerHTML).toBe('')
        pager.update({ paging: paging({ totalSeries: 0, total: 0 }) })
        expect(container.innerHTML).toBe('')
    })

    it('says how many series are shown out of how many', () => {
        mount(paging())
        expect(text('.series-pager-count')).toBe('Showing 1–10 of 45 series')
    })

    it('says the total of all series when a filter narrowed the list', () => {
        mount(paging({ total: 4, to: 4, pages: 1, totalSeries: 45 }))
        expect(text('.series-pager-count')).toBe('Showing 1–4 of 4 series (of 45 in all)')
    })

    it('says so when no series passes the filters', () => {
        mount(paging({ total: 0, from: 0, to: 0, pages: 1 }))
        expect(text('.series-pager-count')).toBe('No series matches these filters')
        expect(container.querySelector('.series-pager-pages')).toBeNull()
    })

    it('offers the page sizes from 10 to 100, with the current one selected, and reports a change', () => {
        mount(paging({ size: 30 }))
        const select = container.querySelector('.series-pager-size')
        expect([...select.options].map(option => Number(option.value))).toEqual([10, 20, 30, 40, 50, 60, 70, 80, 90, 100])
        expect([...select.options].map(option => Number(option.value))).toEqual([...PAGE_SIZES])
        expect(select.value).toBe('30')

        select.value = '100'
        select.dispatchEvent(new Event('change'))
        expect(handlers.onSize).toHaveBeenCalledWith(100)
    })

    it('draws one button per page, marks the current one and reports the page asked for', () => {
        mount(paging({ page: 2, from: 11, to: 20 }))
        expect(pageButtons()).toEqual(['Previous', '1', '2', '3', '4', '5', 'Next'])
        expect(container.querySelector('[aria-current="page"]').textContent.trim()).toBe('2')

        container.querySelector('[data-pager-page="4"]').click()
        expect(handlers.onPage).toHaveBeenCalledWith(4)
        container.querySelectorAll('[data-pager-page]')[0].click() // Previous
        expect(handlers.onPage).toHaveBeenLastCalledWith(1)
    })

    it('disables Previous on the first page and Next on the last, and they report nothing', () => {
        mount(paging({ page: 1 }))
        const buttons = () => [...container.querySelectorAll('[data-pager-page]')]
        expect(buttons()[0].disabled).toBe(true)
        buttons()[0].click()

        pager.update({ paging: paging({ page: 5, from: 41, to: 45 }) })
        expect(buttons().at(-1).disabled).toBe(true)
        buttons().at(-1).click()

        expect(handlers.onPage).not.toHaveBeenCalled()
    })

    it('draws no page buttons when everything fits in one page', () => {
        mount(paging({ pages: 1, total: 7, to: 7, totalSeries: 7 }))
        expect(container.querySelector('.series-pager-pages')).toBeNull()
    })

    it('collapses a long run of pages into gaps, keeping the ends and the neighbours of the current page', () => {
        mount(paging({ page: 10, pages: 22, total: 217, from: 91, to: 100, totalSeries: 217 }))
        expect(pageButtons()).toEqual(['Previous', '1', '2', '9', '10', '11', '21', '22', 'Next'])
        expect(container.querySelectorAll('.series-pager-pages span').length).toBe(2)
    })

    it('reports a change of form, and not a click on the form already in use', () => {
        mount(paging())
        container.querySelector(`[data-pager-mode="${PagingMode.PAGES}"]`).click()
        expect(handlers.onMode).not.toHaveBeenCalled()

        container.querySelector(`[data-pager-mode="${PagingMode.SCROLL}"]`).click()
        expect(handlers.onMode).toHaveBeenCalledWith(PagingMode.SCROLL)
    })

    describe('the list that grows (scroll)', () => {
        const scroll = (extra = {}) => paging({ mode: PagingMode.SCROLL, pages: 1, hasMore: true, ...extra })

        it('offers the next batch, no page buttons, and reports the request', () => {
            mount(scroll())
            expect(container.querySelector('.series-pager-pages')).toBeNull()
            expect(container.querySelector('[data-pager-mode="scroll"]').getAttribute('aria-pressed')).toBe('true')
            const more = container.querySelector('[data-pager-more]')
            expect(more.textContent).toBe('Load 10 more')

            more.click()
            expect(handlers.onMore).toHaveBeenCalledTimes(1)
        })

        it('the last batch says how many are really left', () => {
            mount(scroll({ to: 40 }))
            expect(container.querySelector('[data-pager-more]').textContent).toBe('Load 5 more')
        })

        it('says everything is on screen when nothing is left', () => {
            mount(scroll({ to: 45, hasMore: false }))
            expect(container.querySelector('[data-pager-more]')).toBeNull()
            expect(container.textContent).toContain('All 45 series are on screen.')
        })

        it('asks for the next batch once when the end of the list comes into view', () => {
            const observers = []
            vi.stubGlobal('IntersectionObserver', class {
                constructor(callback) { this.callback = callback; this.disconnect = vi.fn(); observers.push(this) }
                observe(element) { this.element = element }
            })
            mount(scroll())
            expect(observers[0].element).toBe(container.querySelector('[data-pager-sentinel]'))

            observers[0].callback([{ isIntersecting: false }])
            expect(handlers.onMore).not.toHaveBeenCalled()
            observers[0].callback([{ isIntersecting: true }])
            observers[0].callback([{ isIntersecting: true }])
            expect(handlers.onMore).toHaveBeenCalledTimes(1)

            pager.update({ paging: scroll({ to: 20 }) }) // a new draw watches anew and lets go of the old watch
            expect(observers[0].disconnect).toHaveBeenCalled()
            expect(observers).toHaveLength(2)
            pager.unmount()
            expect(observers[1].disconnect).toHaveBeenCalled()
            vi.unstubAllGlobals()
        })
    })

    it('does not redraw when nothing changed: the controls stay the same elements', () => {
        mount(paging())
        const select = container.querySelector('.series-pager-size')
        const button = container.querySelector('[data-pager-page="2"]')

        pager.update({ paging: paging() })

        expect(container.querySelector('.series-pager-size')).toBe(select)
        expect(container.querySelector('[data-pager-page="2"]')).toBe(button)

        pager.update({ paging: paging({ page: 2, from: 11, to: 20 }) })
        expect(container.querySelector('.series-pager-size')).not.toBe(select)
    })

    describe('albums not checked against the sources yet (the filter by source)', () => {
        it('says nothing when every album was checked', () => {
            mount(paging())
            expect(container.querySelector('.series-pager-unchecked')).toBeNull()
        })

        it('says how many albums the filter cannot answer for yet', () => {
            mount(paging({ unchecked: 150 }))
            expect(text('.series-pager-unchecked')).toBe('150 albums have not been checked against the sources yet, so this filter may miss them. An album is checked the first time its series loads.')
            pager.update({ paging: paging({ unchecked: 1 }) })
            expect(text('.series-pager-unchecked')).toBe('1 album has not been checked against the sources yet, so this filter may miss it. An album is checked the first time its series loads.')
        })

        it('shows the notice beside "no series matches", where it explains the empty list', () => {
            mount(paging({ total: 0, from: 0, to: 0, pages: 1, unchecked: 12 }))
            expect(text('.series-pager-count')).toBe('No series matches these filters')
            expect(text('.series-pager-unchecked')).toContain('12 albums have not been checked')
        })

        it('with one series on screen, shows only the notice, or nothing', () => {
            mount(paging({ single: true, unchecked: 3 }))
            expect(text('.series-pager-unchecked')).toContain('3 albums have not been checked')
            expect(container.querySelector('.series-pager-size')).toBeNull()
            expect(container.querySelector('.series-pager-count')).toBeNull()

            pager.update({ paging: paging({ single: true, unchecked: 0 }) })
            expect(container.innerHTML).toBe('')
        })
    })
})

describe('Pager above the list (F72)', () => {
    let container, handlers
    const mountTop = (value) => {
        const pager = new Pager({ container, props: { paging: value, place: 'top', ...handlers } })
        pager.mount()
        return pager
    }
    const text = (selector) => container.querySelector(selector)?.textContent.replace(/\s+/g, ' ').trim()

    beforeEach(() => {
        container = document.createElement('div')
        document.body.appendChild(container)
        handlers = { onPage: vi.fn(), onSize: vi.fn(), onMode: vi.fn(), onMore: vi.fn() }
    })

    it('shows the same count, page size, form and page numbers, and reports the same', () => {
        mountTop(paging())

        expect(container.querySelector('[data-pager-place="top"]')).not.toBe(null)
        expect(text('.series-pager-count')).toBe('Showing 1–10 of 45 series')
        expect(container.querySelector('.series-pager-size').value).toBe('10')
        container.querySelector('[data-pager-page="2"]').click()
        expect(handlers.onPage).toHaveBeenCalledWith(2)
        container.querySelector(`[data-pager-mode="${PagingMode.SCROLL}"]`).click()
        expect(handlers.onMode).toHaveBeenCalledWith(PagingMode.SCROLL)
    })

    it('in the growing list it has no "Load more" and nothing that asks for more by being seen', () => {
        mountTop(paging({ mode: PagingMode.SCROLL, hasMore: true, to: 10 }))

        expect(text('.series-pager-count')).toBe('Showing 1–10 of 45 series')
        expect(container.querySelector('[data-pager-more]')).toBe(null)
        expect(container.querySelector('[data-pager-sentinel]')).toBe(null)
    })

    it('leaves the notice about unchecked albums to the pager below, and draws nothing for one series', () => {
        mountTop(paging({ unchecked: 3 }))
        expect(container.querySelector('.series-pager-unchecked')).toBe(null)

        container.innerHTML = ''
        mountTop(paging({ single: true, unchecked: 3 }))
        expect(container.innerHTML).toBe('')
    })

    it('does not announce the count twice: only the pager below is a live region', () => {
        mountTop(paging())
        expect(container.querySelector('.series-pager-count').hasAttribute('aria-live')).toBe(false)
    })
})
