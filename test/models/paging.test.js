/**
 * F51 - paging of the albums screen: by series, 10 to 100 a page, numbered pages or a growing list.
 */
import { describe, it, expect } from 'vitest'
import { paginate, takeFirst, normalizePageSize, PAGE_SIZES, DEFAULT_PAGE_SIZE } from '../../public/js/models/paging.js'

const items = (n) => Array.from({ length: n }, (_, i) => i + 1)

describe('paging', () => {
    it('offers 10, 20 … 100 series a page', () => {
        expect(PAGE_SIZES).toEqual([10, 20, 30, 40, 50, 60, 70, 80, 90, 100])
        expect(normalizePageSize(30)).toBe(30)
        expect(normalizePageSize('40')).toBe(40)
        expect(normalizePageSize(15)).toBe(DEFAULT_PAGE_SIZE)
        expect(normalizePageSize(undefined)).toBe(DEFAULT_PAGE_SIZE)
    })

    it('cuts a numbered page and says where it stands', () => {
        expect(paginate(items(45), { page: 2, size: 10 })).toEqual({
            items: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20], page: 2, pages: 5, total: 45, from: 11, to: 20
        })
    })

    it('the last page may be short', () => {
        expect(paginate(items(45), { page: 5, size: 10 })).toMatchObject({ items: [41, 42, 43, 44, 45], from: 41, to: 45 })
    })

    it('a page past the end becomes the last one, and a page before the start the first', () => {
        expect(paginate(items(45), { page: 99, size: 10 }).page).toBe(5)
        expect(paginate(items(45), { page: 0, size: 10 }).page).toBe(1)
        expect(paginate(items(45), { page: 'x', size: 10 }).page).toBe(1)
    })

    it('an empty list is one empty page', () => {
        expect(paginate([], { page: 3, size: 10 })).toEqual({ items: [], page: 1, pages: 1, total: 0, from: 0, to: 0 })
    })

    it('100 a page shows 45 series at once', () => {
        expect(paginate(items(45), { page: 1, size: 100 })).toMatchObject({ pages: 1, from: 1, to: 45 })
    })

    it('the growing list shows the first ones and says whether there is more', () => {
        expect(takeFirst(items(45), 20)).toMatchObject({ total: 45, from: 1, to: 20, hasMore: true })
        expect(takeFirst(items(45), 60)).toMatchObject({ to: 45, hasMore: false })
        expect(takeFirst([], 10)).toEqual({ items: [], total: 0, from: 0, to: 0, hasMore: false })
    })
})
