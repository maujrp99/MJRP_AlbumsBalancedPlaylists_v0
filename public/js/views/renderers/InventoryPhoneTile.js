/**
 * InventoryPhoneTile - the gallery of the inventory on the phone (F89, REQ-01, REQ-02): the covers
 * in a grid, one card per album, with the same pieces as the row of the list and the same actions.
 * Styles: public/css/mobile/inventory.css.
 *
 *   [ cover, square ]
 *   Title, up to two lines
 *   Artist
 *   ≈ $12.40                 the value, or a dash
 *   CD · Discogs             the format, and where the value comes from (or why there is none)
 *   ★ 78.4 · ◉ 42%           the two averages, when the album has them
 *   [✓ Owned]  [⋯]           the status opens its sheet; «⋯» opens the album's named actions
 *
 * A tap on the card opens the album window (as «View» does on the computer). What the card leaves
 * out, the store links, Sell and Trade, is in the «⋯» sheet and in the album window.
 *
 * Pure: HTML strings in, no DOM listeners, no store. Text from outside goes through escapeHtml.
 */

import { escapeHtml } from '../../utils/stringUtils.js'
import { coverImage } from '../../components/ui/coverImage.js'
import { statusLabel, statusOf } from '../../models/inventoryStatus.js'
import { NoValue, moneyOf } from '../../models/inventoryValue.js'
import { MORE_ICON, chevron, moreOf, originText, phoneScores, statusText } from './InventoryPhoneRow.js'
import { formatOf } from './InventoryCardValue.js'

const NOT_KNOWN = Object.freeze({ origin: null, reason: NoValue.NEVER_READ })

const coverOf = (item) => coverImage({
    src: item.albumData?.coverUrl || item.coverUrl || null,
    alt: '',
    loading: 'lazy',
    decoding: 'async',
    className: 'inv-tile__cover'
}).outerHTML

/** The value of the card: the amount, and under it the format with where the amount comes from. */
function tileValue(item, value, money) {
    const amount = value.origin ? `≈ ${moneyOf(value, money)}` : '—'
    const origin = `${formatOf(item)} · ${originText(value)}`
    return `<div class="inv-tile__value" data-role="value" data-origin="${value.origin || 'none'}">`
        + `<strong class="inv-tile__amount" data-role="amount">${escapeHtml(amount)}</strong>`
        + `<span class="inv-tile__origin" title="${escapeHtml(origin)}">${escapeHtml(origin)}</span></div>`
}

/** The two averages, in one short line, as the row of the list shows them; an album never read has none. */
function scoresOf(item) {
    const scores = phoneScores(item.averages)
    return scores ? `<div class="inv-tile__scores" data-role="averages">${scores}</div>` : ''
}

/**
 * One card of the gallery.
 * @param {Object} item - an inventory item
 * @param {Object} [value] - what models/inventoryValue.js `valueOfItem` says of it
 * @param {Object} money - how money is written on the screen
 * @returns {string} HTML
 */
export function phoneTile(item, value, money) {
    const id = escapeHtml(item.id)
    const title = item.title || 'Unknown Title'
    const artist = item.artist || 'Unknown Artist'
    const status = statusOf(item)
    return `<li class="inv-tile" data-album-id="${id}" data-status="${status}">
      <button type="button" class="inv-tile__open" data-action="view-modal" data-id="${id}" aria-label="Open ${escapeHtml(title)}, ${escapeHtml(artist)}"></button>
      ${coverOf(item)}
      <div class="inv-tile__text"><span class="inv-tile__title">${escapeHtml(title)}</span><span class="inv-tile__artist">${escapeHtml(artist)}</span></div>
      ${tileValue(item, value || NOT_KNOWN, money)}${scoresOf(item)}
      <div class="inv-tile__bar">
        <button type="button" class="inv-tile__status" data-phone-action="status" data-album-id="${id}" data-status="${status}" aria-haspopup="dialog" aria-label="Status: ${statusLabel(status)}. Change it"><span class="inv-tile__pill"><span class="inv-tile__pill-text">${statusText(status)}</span>${chevron('inv-tile__chevron')}</span></button>
        <button type="button" class="inv-tile__more" data-phone-action="more" data-album-id="${id}" aria-haspopup="dialog" aria-label="Actions for ${escapeHtml(title)}">${MORE_ICON}</button>
      </div>
    </li>`
}

/**
 * The gallery: the first `shown` albums of the list, and under them how many there are.
 * @param {Array<Object>} items - filtered and ordered
 * @param {{ values: Map, money: Object }} known - what the screen knows of the values
 * @param {number} shown
 * @returns {string} HTML
 */
export function phoneGallery(items, known, shown) {
    const tiles = items.slice(0, shown).map(item => phoneTile(item, known.values.get(item.id), known.money)).join('')
    return `<ul class="inv-tiles" aria-label="Albums">${tiles}</ul>${moreOf(items.length, Math.min(shown, items.length))}`
}

/** While the inventory loads: covers of the same size, empty. */
export function phoneGalleryLoading() {
    const tile = '<li class="inv-tile inv-tile--ghost" aria-hidden="true"><span class="inv-tile__cover"></span><span class="inv-ghost inv-ghost--title"></span><span class="inv-ghost inv-ghost--artist"></span></li>'
    return `<div role="status" class="inv-loading"><span class="sr-only">Loading inventory...</span><ul class="inv-tiles">${tile.repeat(6)}</ul></div>`
}
