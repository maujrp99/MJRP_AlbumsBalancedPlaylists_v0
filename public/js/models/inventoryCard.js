/**
 * inventoryCard - the little rules the inventory screen drew its cards, rows and bar with, taken out of the drawing so that they are
 * plain functions (F83 wave 6a; they lived in views/renderers/Inventory*.js). Pure: no DOM, no store, no text of the screen: a rule
 * gives a code or a datum and the screen says it (models/ does not import i18n/).
 */
import { InventoryStatus, statusOf } from './inventoryStatus.js'
import { BASE_CURRENCY, NoValue, ValueBasis, ValueOrigin, convert, formatMoney, noValueText, readOnText } from './inventoryValue.js'
import { PHONE_CHUNK } from './inventoryJump.js'

/** The value of an item nothing was said about: the screen draws before the values are known. */
export const NOT_KNOWN = Object.freeze({ origin: null, reason: NoValue.NEVER_READ })
export const USD_ONLY = Object.freeze({ currency: 'USD', rates: null })

/** What the screen knows of the values, or the little that is true before it knows anything. */
export const valuesOf = (state) => state?.value || { values: new Map(), money: USD_ONLY }

/** The format the value is of: the one the item says, or CD (the value read is always of the CD). */
export function formatOf(item) {
    const format = String(item.format || '').toLowerCase()
    if (format.includes('vinyl') || format.includes('lp')) return 'Vinyl'
    return format && !format.includes('cd') ? String(item.format) : 'CD'
}

/** The kind of a format for its badge: `vinyl`, `cd`, `digital`, or `other` with the text the item says. */
export function formatBadgeOf(format) {
    if (!format) return null
    const lower = format.toLowerCase()
    if (lower.includes('vinyl') || lower.includes('lp')) return { kind: 'vinyl', text: 'Vinyl' }
    if (lower.includes('cd')) return { kind: 'cd', text: 'CD' }
    if (lower.includes('digital')) return { kind: 'digital', text: 'Digital' }
    return { kind: 'other', text: format }
}

/** The kind of the Discogs value, in one short word: the card has no room to say more. */
export const kindWordOf = (value) => (value.basis === ValueBasis.LOWEST_FOR_SALE ? 'lowest' : 'suggested')

/** What the row of the phone says of where the value comes from, as parts: the words of the screen fill the rest. */
export function originOf(value) {
    if (value.origin === ValueOrigin.DISCOGS) return { kind: 'discogs', date: readOnText(value) }
    if (value.origin === ValueOrigin.YOURS) return { kind: 'yours' }
    return { kind: 'none', text: noValueText(value) }
}

/** The status as a pill says it: with its mark («✓ Owned», «Not Owned», «♡ Wishlist»), the label coming from the screen. */
export const STATUS_MARK = Object.freeze({ [InventoryStatus.OWNED]: '✓ ', [InventoryStatus.WISHLIST]: '♡ ' })

/** Is the item owned? */
export const isOwned = (item) => statusOf(item) === InventoryStatus.OWNED

/** Under the rows of the phone: how many are drawn, and how many the next chunk adds (null when all are). */
export function moreOf(total, shown) {
    if (total <= shown) return { all: true, total }
    return { all: false, total, shown, next: Math.min(PHONE_CHUNK, total - shown) }
}

/**
 * What an action of the collection is doing, for the line under the search of the phone: which action, the text it gave itself (or
 * null: the screen says the plain words), and whether it can be stopped. Null when nothing runs.
 */
export function phoneProgress(state) {
    const running = [
        ['series', state.seriesAdd, false],
        ['ratings', state.ratings, false],
        ['values', state.value?.run, true]
    ].find(([, action]) => action?.busy)
    if (!running) return null
    const [which, action, stop] = running
    return { which, text: action.text || null, stop }
}

/** A total as the screen writes it: a dash while no album adds to it («$0.00» would say it is worth nothing). */
export function totalText(total, money) {
    if (total.valued === 0) return '—'
    return formatMoney(convert(total.sum, BASE_CURRENCY, money.currency, money.rates) ?? total.sum, money.currency)
}
