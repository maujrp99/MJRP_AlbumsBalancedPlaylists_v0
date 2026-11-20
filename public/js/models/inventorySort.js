/**
 * The order of the inventory (F71): one place says how two items compare.
 *
 * The default is by artist and then by title, so that an inventory of a few hundred albums
 * can be read. Two items equal in the chosen field fall back to artist and title, so the
 * order never depends on the order the items came from the database.
 */

const text = (value) => String(value || '').toLowerCase()
const number = (value) => Number(value) || 0
const date = (value) => new Date(value || 0).getTime()

/** How the value of each field is read for comparing. A field not listed is read as text. */
const READERS = {
    addedAt: date,
    purchasePrice: number
}

const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0)

const byArtistAndTitle = (a, b) =>
    compare(text(a.artist), text(b.artist)) || compare(text(a.title), text(b.title))

/**
 * Sorts the items in place and returns them.
 * @param {Array<Object>} items
 * @param {{field: string, direction: 'asc'|'desc'}} sorting
 */
export function sortInventory(items, sorting) {
    const { field, direction } = sorting || {}
    const read = READERS[field] || text
    const sign = direction === 'desc' ? -1 : 1
    return items.sort((a, b) => sign * compare(read(a[field]), read(b[field])) || byArtistAndTitle(a, b))
}
