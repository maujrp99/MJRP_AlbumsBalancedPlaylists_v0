/**
 * InventoryPhoneRow - the inventory on the phone (F76, TASK-07, REQ-11): one compact row per album
 * instead of the computer's card, drawn in chunks. Styles: public/css/mobile/inventory.css.
 *
 *   [cover 64]  Title, up to two lines               ≈ $12.40
 *               Artist                               Discogs
 *               [✓ Owned ▾]  ★ 78.4 · ◉ 42%           [⋯]
 *
 * A tap on the row opens the album window (as «View» does on the computer); the status button
 * opens a short sheet with the three statuses; «⋯» opens the sheet of the album's named actions.
 * What the row drops from the card (the two labels, the store links, Sell and Trade, the number of
 * tracks behind each average) is in the «⋯» sheet or in the album window.
 *
 * Pure: HTML strings in, no DOM listeners, no store. Text from outside goes through escapeHtml.
 */

import { escapeHtml } from '../../utils/stringUtils.js'
import { getIcon } from '../../components/Icons.js'
import { coverImage } from '../../components/ui/coverImage.js'
import { InventoryStatus, statusLabel, statusOf } from '../../models/inventoryStatus.js'
import { NoValue, ValueOrigin, moneyOf, noValueText } from '../../models/inventoryValue.js'
import { popularityValue, ratingValue } from '../../models/albumAverages.js'
import { PHONE_CHUNK } from '../../models/inventoryJump.js'

/** Three dots: the «⋯» of a row and of the screen. */
export const MORE_ICON = '<svg class="inv-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>'
const CHEVRON = '<svg class="inv-row__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>'

const NOT_KNOWN = Object.freeze({ origin: null, reason: NoValue.NEVER_READ })
const MARK = Object.freeze({ [InventoryStatus.OWNED]: '✓ ', [InventoryStatus.WISHLIST]: '♡ ' })
const isNumber = (value) => typeof value === 'number' && Number.isFinite(value)

/** The status as the row shows it: "✓ Owned", "Not Owned", "♡ Wishlist". */
export const statusText = (status) => `${MARK[status] || ''}${statusLabel(status)}`

/** What the row says of where the value comes from: short, the long words are in the «⋯» sheet. */
export function originText(value) {
    if (value.origin === ValueOrigin.DISCOGS) return 'Discogs'
    if (value.origin === ValueOrigin.YOURS) return 'Yours'
    return noValueText(value)
}

/** The value, right: the amount (or a dash) and its origin. */
export function phoneValue(value, money) {
    const amount = value.origin ? `≈ ${moneyOf(value, money)}` : '—'
    return `<div class="inv-row__value" data-role="value" data-origin="${value.origin || 'none'}">`
        + `<strong class="inv-row__amount" data-role="amount">${escapeHtml(amount)}</strong>`
        + `<span class="inv-row__origin">${escapeHtml(originText(value))}</span></div>`
}

function score(icon, label, shown) {
    return `<span class="inv-row__score">${getIcon(icon, 'inv-row__score-icon')}<span class="sr-only">${label}</span>${escapeHtml(shown)}</span>`
}

/** The two averages, in one short line; an album never read shows nothing. */
export function phoneScores(averages) {
    const parts = []
    if (isNumber(averages?.rating)) parts.push(score('Award', 'Avg Rating', ratingValue(averages)))
    if (isNumber(averages?.popularity)) parts.push(score('Spotify', 'Avg Pop', popularityValue(averages)))
    return parts.join('')
}

const coverOf = (item) => coverImage({
    src: item.albumData?.coverUrl || item.coverUrl || null,
    alt: '',
    loading: 'lazy',
    decoding: 'async',
    className: 'inv-row__cover'
}).outerHTML

/**
 * One row of the phone.
 * @param {Object} item - an inventory item
 * @param {Object} [value] - what models/inventoryValue.js `valueOfItem` says of it
 * @param {Object} money - how money is written on the screen
 * @returns {string} HTML
 */
export function phoneRow(item, value, money) {
    const id = escapeHtml(item.id)
    const title = item.title || 'Unknown Title'
    const artist = item.artist || 'Unknown Artist'
    const status = statusOf(item)
    return `<li class="inv-row" data-album-id="${id}" data-status="${status}">
      <button type="button" class="inv-row__open" data-action="view-modal" data-id="${id}" aria-label="Open ${escapeHtml(title)}, ${escapeHtml(artist)}"></button>
      ${coverOf(item)}
      <div class="inv-row__text"><span class="inv-row__title">${escapeHtml(title)}</span><span class="inv-row__artist">${escapeHtml(artist)}</span></div>
      ${phoneValue(value || NOT_KNOWN, money)}
      <div class="inv-row__bar">
        <button type="button" class="inv-row__status" data-phone-action="status" data-album-id="${id}" data-status="${status}" aria-haspopup="dialog" aria-label="Status: ${statusLabel(status)}. Change it"><span class="inv-row__pill">${statusText(status)}${CHEVRON}</span></button>
        <span class="inv-row__scores" data-role="averages">${phoneScores(item.averages)}</span>
        <button type="button" class="inv-row__more" data-phone-action="more" data-album-id="${id}" aria-haspopup="dialog" aria-label="Actions for ${escapeHtml(title)}">${MORE_ICON}</button>
      </div>
    </li>`
}

/** Under the rows: how many are drawn, and the button for the next chunk. */
export function moreOf(total, shown) {
    if (total <= shown) return `<p class="inv-more__count">${total === 1 ? '1 album' : `All ${total} albums`}</p>`
    const next = Math.min(PHONE_CHUNK, total - shown)
    return `<div class="inv-more"><p class="inv-more__count">Showing ${shown} of ${total}</p>`
        + `<button type="button" class="btn btn-secondary inv-more__button" data-phone-action="more-rows">Show ${next} more</button></div>`
}

/**
 * The rows of the phone, the first `shown` of the list.
 * @param {Array<Object>} items - filtered and ordered
 * @param {{ values: Map, money: Object }} known - what the screen knows of the values
 * @param {number} shown
 * @returns {string} HTML
 */
export function phoneList(items, known, shown) {
    const rows = items.slice(0, shown).map(item => phoneRow(item, known.values.get(item.id), known.money)).join('')
    return `<ul class="inv-rows" aria-label="Albums">${rows}</ul>${moreOf(items.length, Math.min(shown, items.length))}`
}

/** While the inventory loads: rows of the same size, empty. */
export function phoneLoading() {
    const row = '<li class="inv-row inv-row--ghost" aria-hidden="true"><span class="inv-row__cover"></span><span class="inv-ghost inv-ghost--title"></span><span class="inv-ghost inv-ghost--artist"></span></li>'
    return `<div role="status" class="inv-loading"><span class="sr-only">Loading inventory...</span><ul class="inv-rows">${row.repeat(6)}</ul></div>`
}

/**
 * Nothing to show: an empty inventory says what fills it; a filtered one offers to clear the filters.
 * @param {boolean} hasItems - the inventory has items, the search or the filters hide them all
 */
export function phoneEmpty(hasItems) {
    if (hasItems) {
        return `<div class="inv-empty" data-empty="filtered">${getIcon('Search', 'inv-empty__icon')}
          <p class="inv-empty__title">No albums match</p>
          <p class="inv-empty__text">Nothing in your collection matches the search and the filters.</p>
          <button type="button" class="btn btn-secondary" data-phone-action="clear-filters">Clear search and filters</button></div>`
    }
    return `<div class="inv-empty" data-empty="inventory">${getIcon('Archive', 'inv-empty__icon')}
      <p class="inv-empty__title">Your collection is empty</p>
      <p class="inv-empty__text">Albums you add from the Albums screen show here. You can also put every album of your series here at once, as Not Owned.</p>
      <button type="button" class="btn btn-primary" data-phone-action="add-series">Add the albums of my series</button></div>`
}

/**
 * The line under the search while an action of the collection runs: what it is doing, and «Stop»
 * for the values. Null when nothing runs.
 * @param {Object} state - of the controller
 * @returns {{ text: string, stop: boolean }|null}
 */
export function phoneProgress(state) {
    const running = [
        [state.seriesAdd, 'Adding the albums of your series…', false],
        [state.ratings, 'Reading ratings…', false],
        [state.value?.run, 'Reading values…', true]
    ].find(([action]) => action?.busy)
    if (!running) return null
    const [action, waiting, stop] = running
    return { text: action.text || waiting, stop }
}
