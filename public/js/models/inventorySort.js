/**
 * The order of the inventory (F71): one place says how two items compare.
 *
 * The default is by artist and then by title, so that an inventory of a few hundred albums
 * can be read. Two items equal in the chosen field fall back to artist and title, so the
 * order never depends on the order the items came from the database.
 *
 * An item with no value for the chosen field (an average never read, a date the store does not
 * have, an album with no estimated value) comes LAST, whatever the direction: a missing number is
 * not a low one.
 *
 * The estimated value of an album (F75) is not a field of the item: part of it lives in the
 * browser (a reading of Discogs). Who sorts gives `valueOf(item)`, the amount in USD or null.
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
    value: (item, context) => {
        const amount = context?.valueOf?.(item)
        return isNumber(amount) ? amount : null
    },
    averageRating: averageOf('rating'),
    averagePopularity: averageOf('popularity'),
    addedToInventory: (item) => momentOf(item.addedToInventory ?? item.createdAt),
    purchasePrice: (item) => number(item.purchasePrice)
}

/**
 * The choices of the order: each criterion in its two directions, the way the albums list offers its
 * own (F71, REQ-21). The first of each pair is the direction a criterion starts with. Each `value` is
 * the code of a choice; the screen names it ("Artist (A-Z)", "Value (↓)"...) from its dictionary.
 */
export const SORT_OPTIONS = Object.freeze([
    { value: 'artist', field: 'artist', direction: 'asc' },
    { value: 'artist_desc', field: 'artist', direction: 'desc' },
    { value: 'averageRating', field: 'averageRating', direction: 'desc' },
    { value: 'averageRating_asc', field: 'averageRating', direction: 'asc' },
    { value: 'averagePopularity', field: 'averagePopularity', direction: 'desc' },
    { value: 'averagePopularity_asc', field: 'averagePopularity', direction: 'asc' },
    { value: 'value', field: 'value', direction: 'desc' },
    { value: 'value_asc', field: 'value', direction: 'asc' },
    { value: 'addedToInventory', field: 'addedToInventory', direction: 'desc' },
    { value: 'addedToInventory_asc', field: 'addedToInventory', direction: 'asc' }
])

/** The sorting a choice stands for; anything that is not a choice is the default (by artist). */
export function sortingFor(value) {
    const { field, direction } = SORT_OPTIONS.find(option => option.value === value) || SORT_OPTIONS[0]
    return { field, direction }
}

/** The choice a sorting is: what the select shows as chosen. */
export function choiceOf(sorting) {
    const chosen = SORT_OPTIONS.find(option => option.field === sorting?.field && option.direction === sorting?.direction)
    return (chosen || SORT_OPTIONS[0]).value
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
 * @param {{ valueOf?: Function }} [context] - (item) => the estimated value in USD, or null: only the order by value reads it
 */
export function sortInventory(items, sorting, context = null) {
    const { field, direction } = sorting || {}
    const read = READERS[field] || ((item) => text(item[field]))
    const sign = direction === 'desc' ? -1 : 1
    return items.sort((a, b) => byValue(read(a, context), read(b, context), sign) || byArtistAndTitle(a, b))
}
