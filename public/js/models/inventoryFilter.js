/**
 * inventoryFilter - which items the inventory screen shows for a search, a format and a status,
 * as a pure rule (F71, S-54; it was inside the controller).
 */

import { ALL_STATUSES, countByStatus, passesStatusFilter } from './inventoryStatus.js'

const ALL_FORMATS = 'all'

/** The words a stored format may be written with, for each format of the filter. */
const FORMAT_WORDS = Object.freeze({
    vinyl: ['vinyl', 'lp'],
    cd: ['cd'],
    digital: ['digital'],
    dvd: ['dvd'],
    bluray: ['bluray'],
    cassette: ['cassette']
})

const lower = (text) => String(text ?? '').toLowerCase()

/** The search reads the title, the artist and the notes. */
function matchesSearch(item, search) {
    const wanted = lower(search).trim()
    if (!wanted) return true
    return [item.title, item.artist, item.notes].some(text => lower(text).includes(wanted))
}

/** An item with no format (one that came from a series) is in no format, only in "all". */
function matchesFormat(item, format) {
    if (format === ALL_FORMATS) return true
    const stored = lower(item.format)
    return (FORMAT_WORDS[format] || []).some(word => stored.includes(word)) || !Object.hasOwn(FORMAT_WORDS, format)
}

/**
 * The items that pass the three filters, in the order given.
 * @param {Array<Object>} items
 * @param {{ search?: string, format?: string, ownership?: string }} [filters]
 * @returns {Array<Object>} a new list
 */
export function filterInventory(items, { search = '', format = ALL_FORMATS, ownership = ALL_STATUSES } = {}) {
    return items.filter(item =>
        matchesSearch(item, search) && matchesFormat(item, format) && passesStatusFilter(item, ownership))
}

/**
 * The three counts of the header: how many items each status has among the ones that pass the
 * search and the format. The status filter is left out on purpose, so that choosing "Owned" does
 * not turn the other two into zero.
 * @returns {{ owned: number, 'not-owned': number, wishlist: number }}
 */
export function statusCountsFor(items, { search = '', format = ALL_FORMATS } = {}) {
    return countByStatus(filterInventory(items, { search, format }))
}
