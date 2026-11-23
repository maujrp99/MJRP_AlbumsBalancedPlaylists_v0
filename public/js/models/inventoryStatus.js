/**
 * inventoryStatus - the one place that says what the status of an inventory item is (F71, S-54).
 *
 * An item is Owned, Not Owned or on the Wishlist. The cloud keeps it in one field, `owned`:
 * `true` is Owned, `false` is Wishlist, `null` or missing is Not Owned. That is how the items were
 * always stored, so nothing is migrated: this module reads and writes that field, and the card,
 * the filter, the counts, the album window and the notice of a change ask it instead of reading
 * `owned` themselves.
 */

export const InventoryStatus = Object.freeze({
    OWNED: 'owned',
    NOT_OWNED: 'not-owned',
    WISHLIST: 'wishlist'
})

/** The filter value that hides nothing. */
export const ALL_STATUSES = 'all'

/** What the cloud keeps in `owned` for each status. */
const STORED = Object.freeze({
    [InventoryStatus.OWNED]: true,
    [InventoryStatus.NOT_OWNED]: null,
    [InventoryStatus.WISHLIST]: false
})

/** The mark a status has on the card and in the counts. Not Owned has none. */
const ICONS = Object.freeze({
    [InventoryStatus.OWNED]: '✓',
    [InventoryStatus.WISHLIST]: '♡'
})

const isStatus = (value) => Object.hasOwn(STORED, value ?? '')

/**
 * @param {Object|null} item - an inventory item
 * @returns {string} one of InventoryStatus
 */
export function statusOf(item) {
    if (item?.owned === true) return InventoryStatus.OWNED
    if (item?.owned === false) return InventoryStatus.WISHLIST
    return InventoryStatus.NOT_OWNED
}

/**
 * The value to write in `owned` for a status. A status this module does not know is Not Owned.
 * @param {string} status
 * @returns {boolean|null}
 */
export const ownedValueOf = (status) => (isStatus(status) ? STORED[status] : null)

/**
 * The status a text is about: the status itself, and Not Owned for a value that is no status. The words of each status (Owned, Not Owned,
 * Wishlist, "Moved to Collection"...) are in the dictionary of the screen (i18n/inventoryTexts.js): a rule gives a code, the screen says it.
 * @param {string} status
 * @returns {string} one of InventoryStatus
 */
export const statusCodeOf = (status) => (isStatus(status) ? status : InventoryStatus.NOT_OWNED)

/** The mark a status has before its name ("✓", "♡"); an empty text for Not Owned. */
export const statusIconOf = (status) => (Object.hasOwn(ICONS, status ?? '') ? ICONS[status] : '')

/** The values of the filter of the screen, in the order the owner asked for (2026-11-20): the screen names them. */
export const STATUS_FILTER_OPTIONS = Object.freeze([
    Object.freeze({ value: ALL_STATUSES }),
    ...[InventoryStatus.OWNED, InventoryStatus.NOT_OWNED, InventoryStatus.WISHLIST].map(status => Object.freeze({ value: status }))
])

/** The selector on the card of an item: the status a new item has comes first; the mark goes before the name the screen gives. */
export const STATUS_SELECT_OPTIONS = Object.freeze(
    [InventoryStatus.NOT_OWNED, InventoryStatus.OWNED, InventoryStatus.WISHLIST]
        .map(status => Object.freeze({ value: status, icon: statusIconOf(status) }))
)

/**
 * Does the item pass the status filter? "all", and a value that is no status, hide nothing.
 * @param {Object} item
 * @param {string} filter - ALL_STATUSES or one of InventoryStatus
 */
export const passesStatusFilter = (item, filter) => !isStatus(filter) || statusOf(item) === filter

/**
 * @param {Array<Object>} items
 * @returns {{ owned: number, 'not-owned': number, wishlist: number }}
 */
export function countByStatus(items) {
    const counts = Object.fromEntries(Object.values(InventoryStatus).map(status => [status, 0]))
    items.forEach(item => { counts[statusOf(item)] += 1 })
    return counts
}
