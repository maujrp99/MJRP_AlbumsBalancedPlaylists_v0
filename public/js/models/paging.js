/**
 * paging
 *
 * The paging of the albums screen, as pure functions (arch.md, seção 16): the screen pages the
 * result of the filter, never the other way round. The unit is the series.
 */

/** Series per page the person may choose: 10, 20 … 100. */
export const PAGE_SIZES = Object.freeze([10, 20, 30, 40, 50, 60, 70, 80, 90, 100])
export const DEFAULT_PAGE_SIZE = 10

/** The two forms of paging: numbered pages, or a list that grows as the person scrolls. */
export const PagingMode = Object.freeze({ PAGES: 'pages', SCROLL: 'scroll' })

/** A size the screen accepts; anything else becomes the default. */
export function normalizePageSize(size) {
    const number = Number(size)
    return PAGE_SIZES.includes(number) ? number : DEFAULT_PAGE_SIZE
}

/**
 * One numbered page of a list.
 * @returns {{ items: Array, page: number, pages: number, total: number, from: number, to: number }}
 *          `from` and `to` are 1-based positions, both 0 when the list is empty.
 */
export function paginate(items = [], { page = 1, size = DEFAULT_PAGE_SIZE } = {}) {
    const total = items.length
    const pageSize = normalizePageSize(size)
    const pages = Math.max(1, Math.ceil(total / pageSize))
    const current = Math.min(Math.max(1, Math.floor(Number(page)) || 1), pages)
    const start = (current - 1) * pageSize
    const slice = items.slice(start, start + pageSize)
    return {
        items: slice,
        page: current,
        pages,
        total,
        from: total === 0 ? 0 : start + 1,
        to: start + slice.length
    }
}

/**
 * The first `count` items of a list that grows as the person scrolls.
 * @returns {{ items: Array, total: number, from: number, to: number, hasMore: boolean }}
 */
export function takeFirst(items = [], count = DEFAULT_PAGE_SIZE) {
    const total = items.length
    const slice = items.slice(0, Math.max(0, count))
    return { items: slice, total, from: total === 0 ? 0 : 1, to: slice.length, hasMore: slice.length < total }
}
