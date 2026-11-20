/**
 * The order of the inventory (F71): one place says how two items compare.
 *
 * The default is by artist and then by title, so that an inventory of a few hundred albums
 * can be read. Two items equal in the chosen field fall back to artist and title, so the
 * order never depends on the order the items came from the database.
 *
 * An item with no value for the chosen field (an average never read, a date the store does not
 * have) comes LAST, whatever the direction: a missing number is not a low one.
 */

const text = (value) => String(value || '').toLowerCase()
const number = (value) => Number(value) || 0
const isNumber = (value) => typeof value === 'number' && Number.isFinite(value)

/** A moment as milliseconds: a Firestore timestamp ({ seconds } or toMillis), a Date, a number or a text. null when it is none. */
function momentOf(value) {
    if (value === null || value === undefined) return null
    if (typeof value.toMillis === 'function') return value.toMillis()
    if (isNumber(value.seconds)) return value.seconds * 1000 + Math.floor((value.nanoseconds || 0) / 1e6)
    const time = typeof value === 'number' ? value : new Date(value).getTime()
    return isNumber(time) ? time : null
}

const averageOf = (name) => (item) => (isNumber(item.averages?.[name]) ? item.averages[name] : null)

/**
 * How the value of each field is read from an item for comparing. A field not listed is read as
 * text. A reader answers `null` for "no value": that item goes last.
 */
const READERS = {
    averageRating: averageOf('rating'),
    averagePopularity: averageOf('popularity'),
    addedToInventory: (item) => momentOf(item.addedToInventory ?? item.createdAt),
    purchasePrice: (item) => number(item.purchasePrice)
}

/** The choices of the order, as the person sees them, with the direction each starts with. */
export const SORT_OPTIONS = Object.freeze([
    { value: 'artist', label: 'Artist', direction: 'asc' },
    { value: 'averageRating', label: 'Avg Rating', direction: 'desc' },
    { value: 'averagePopularity', label: 'Avg Pop', direction: 'desc' },
    { value: 'addedToInventory', label: 'Recently added', direction: 'desc' }
])

/** The sorting a choice stands for; anything that is not a choice is the default (by artist). */
export function sortingFor(value) {
    const { value: field, direction } = SORT_OPTIONS.find(option => option.value === value) || SORT_OPTIONS[0]
    return { field, direction }
}

const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0)

const byArtistAndTitle = (a, b) =>
    compare(text(a.artist), text(b.artist)) || compare(text(a.title), text(b.title))

const isMissing = (value) => value === null || value === undefined

/** Missing values last, both missing equal, otherwise the direction decides. */
function byValue(one, other, sign) {
    if (isMissing(one) || isMissing(other)) return Number(isMissing(one)) - Number(isMissing(other))
    return sign * compare(one, other)
}

/**
 * Sorts the items in place and returns them.
 * @param {Array<Object>} items
 * @param {{field: string, direction: 'asc'|'desc'}} sorting
 */
export function sortInventory(items, sorting) {
    const { field, direction } = sorting || {}
    const read = READERS[field] || ((item) => text(item[field]))
    const sign = direction === 'desc' ? -1 : 1
    return items.sort((a, b) => byValue(read(a), read(b), sign) || byArtistAndTitle(a, b))
}
