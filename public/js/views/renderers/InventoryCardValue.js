/**
 * InventoryCardValue - the lower half of an inventory card (F75, the pattern the owner chose in
 * the prototype v5.1): five lines, the SAME five in every card, so that neighbours line up.
 *
 *   1  the label of the value, by status   «In my collection · worth» | «Not mine yet · costs»
 *   2  where the value comes from (a Discogs value: «Discogs · 18 Nov» over «CD · lowest»), and the value with «≈» (a dash when there is none)
 *   3  the two averages, each with its icon
 *   4  the label of the actions            «Sell, trade or buy» | «Where to buy»
 *   5  the actions, as links
 *
 * Nothing wraps: a long text is cut, and the whole text is in its `title`. Pure: HTML strings in,
 * no DOM, no store. Every text from outside goes through escapeHtml, every address through safeUrl.
 */

import { escapeHtml } from '../../utils/stringUtils.js'
import { safeUrl } from '../../utils/safeUrl.js'
import { getIcon } from '../../components/Icons.js'
import { InventoryStatus, statusOf } from '../../models/inventoryStatus.js'
import { popularityValue, ratingValue, tracksMadeOf } from '../../models/albumAverages.js'
import { DISCOGS_CREDIT, ValueBasis, ValueOrigin, discogsHint, moneyOf, noValueText, readOnText, valueLabel } from '../../models/inventoryValue.js'
import { BuyLinkPlace, SELL_TRADE_SOON, buyLinkAttributes, buyLinksOf } from '../../models/buyLinks.js'

const LABEL = 'text-[11px] text-gray-400 uppercase tracking-widest whitespace-nowrap truncate'
const DOT = '<span class="text-gray-400 text-xs">·</span>'
/** The edge of the value: green for what is in the collection, orange for what is not. */
const EDGE = Object.freeze({ owned: '#22c55e', other: '#f97316' })
const NO_VALUE = '—'

const isNumber = (value) => typeof value === 'number' && Number.isFinite(value)
const isOwned = (item) => statusOf(item) === InventoryStatus.OWNED

/** The format the value is of: the one the item says, or CD (the value read is always of the CD). */
function formatOf(item) {
    const format = String(item.format || '').toLowerCase()
    if (format.includes('vinyl') || format.includes('lp')) return 'Vinyl'
    return format && !format.includes('cd') ? String(item.format) : 'CD'
}

/** The kind of the Discogs value, in one short word: the card has no room to say more (the whole sentence is in its `title`). */
const KIND_WORD = Object.freeze({ [ValueBasis.LOWEST_FOR_SALE]: 'lowest', [ValueBasis.SUGGESTION]: 'suggested' })

/**
 * A Discogs value on two short lines that never shrink (the judge's P1, second recheck): the source
 * with the date it was read («Discogs · 18 Nov», "Discogs" linked to the edition) and the kind
 * («CD · lowest» or «CD · suggested»). Two lines of 11px are as tall as the amount beside them, so the
 * card is no taller. `line` is the same in one line, for the list.
 */
function discogsOrigin(value) {
    const url = safeUrl(value.release?.url)
    const name = url
        ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener" class="underline hover:text-white" title="${DISCOGS_CREDIT} Open this edition on Discogs">Discogs</a>`
        : 'Discogs'
    const tail = readOnText(value)
    const kind = KIND_WORD[value.basis] || KIND_WORD[ValueBasis.SUGGESTION]
    return {
        stacked: `<span data-role="origin-source">${name}${tail ? ` · ${tail}` : ''}</span>\n<span data-role="origin-kind">CD · ${kind}</span>`,
        line: `CD · ${name} · ${kind}`, tail, hint: discogsHint(value)
    }
}

/** Line 2, left: where the value comes from, or why there is none. */
function originOf(item, value) {
    if (value.origin === ValueOrigin.DISCOGS) return discogsOrigin(value)
    const text = value.origin === ValueOrigin.YOURS ? `${formatOf(item)} · written by you` : noValueText(value)
    return { line: escapeHtml(text), hint: text }
}

/** One average: its icon, the number, and of how many tracks it was made. */
function score(icon, label, hint, shown, made) {
    const of = made ? `<span>(${made})</span>` : ''
    return `<span class="flex items-center gap-1 text-xs text-gray-400" title="${hint}">${icon}<span class="sr-only">${label}</span><strong class="text-white">${shown}</strong>${of}</span>`
}

/** Line 3: the averages the item has; an item that was never read keeps the line, empty. */
export function scoresOf(averages) {
    const parts = []
    if (isNumber(averages?.rating)) {
        parts.push(score(getIcon('Award', 'w-3 h-3 text-brand-orange'), 'Avg Rating', 'Mean BestEverAlbums rating of the tracks; in brackets, how many tracks of the album it was made of',
            ratingValue(averages), tracksMadeOf(averages.ratedTracks, averages.tracks)))
    }
    if (isNumber(averages?.popularity)) {
        parts.push(score(getIcon('Spotify', 'w-3 h-3 text-[#1DB954]'), 'Avg Pop', 'Mean Spotify popularity of the tracks; in brackets, how many tracks of the album it was made of',
            popularityValue(averages), tracksMadeOf(averages.popTracks, averages.tracks)))
    }
    return parts.join('')
}

const storeLink = ({ id, name, url }) =>
    `<a href="${escapeHtml(safeUrl(url))}" target="_blank" rel="noopener" class="text-xs text-accent-primary" data-store="${escapeHtml(name)}" ${buyLinkAttributes(id, BuyLinkPlace.CARD)}>${escapeHtml(name)} ↗</a>`

const notYet = (word) => `<span class="text-xs text-gray-400 opacity-50 cursor-not-allowed" aria-disabled="true" title="${SELL_TRADE_SOON}">${word}</span>`

/** Line 2, left: the Discogs value on its two lines, anything else on one that gives way (and has its whole text in the `title`). */
function originSpan(origin) {
    const title = escapeHtml(origin.hint)
    if (origin.stacked) return `<span class="min-w-0 flex flex-col text-[11px] leading-[13px] text-gray-400 whitespace-nowrap" title="${title}">${origin.stacked}</span>`
    return `<span class="min-w-0 flex text-xs text-gray-400 whitespace-nowrap" title="${title}"><span class="truncate">${origin.line}</span></span>`
}

/** Line 5: what is owned can be sold or traded one day, and its links are in its window; what is not owned shows where to buy it. */
function actionsOf(item) {
    if (!isOwned(item)) return buyLinksOf(item).map(storeLink).join(DOT)
    const whereToBuy = `<button type="button" class="text-xs text-accent-primary" data-action="view-modal" data-id="${escapeHtml(item.id)}">Where to buy</button>`
    return [notYet('Sell'), notYet('Trade'), whereToBuy].join(DOT)
}

/**
 * The lower half of the card of an item.
 * @param {Object} item - an inventory item
 * @param {Object} value - what models/inventoryValue.js `valueOfItem` says of it
 * @param {{ currency: string, rates: Object|null }} money - how money is written on the screen
 * @returns {string} HTML
 */
export function cardValueBlock(item, value, money) {
    const owned = isOwned(item)
    const origin = originOf(item, value)
    const amount = value.origin ? `≈ ${moneyOf(value, money)}` : NO_VALUE
    return `
      <div class="border-t border-white/10 mt-2" data-role="value" data-origin="${value.origin || 'none'}">
        <div class="py-2 px-3 flex flex-col gap-1" style="border-left:3px solid ${owned ? EDGE.owned : EDGE.other}">
          <div class="${LABEL}" data-line="1">${valueLabel(item)}</div>
          <div class="flex items-center justify-between gap-2" data-line="2">
            ${originSpan(origin)}
            <strong class="text-lg text-white tabular-nums whitespace-nowrap" data-role="amount">${amount}</strong>
          </div>
        </div>
        <div class="py-2 flex items-center justify-between gap-2 border-t border-white/10 whitespace-nowrap" style="min-height:2.25rem" data-role="averages" data-line="3">${scoresOf(item.averages)}</div>
        <div class="py-2 border-t border-white/10 flex flex-col gap-1">
          <span class="${LABEL}" data-line="4">${owned ? 'Sell, trade or buy' : 'Where to buy'}</span>
          <div class="flex items-center gap-2 whitespace-nowrap overflow-hidden" data-line="5">${actionsOf(item)}</div>
        </div>
      </div>`
}

/** The value of an item in one short line, for the list view. */
export function rowValue(item, value, money) {
    const origin = originOf(item, value)
    const amount = value.origin ? `≈ ${moneyOf(value, money)}` : NO_VALUE
    return `<span class="text-xs text-gray-400 whitespace-nowrap" data-role="value" title="${escapeHtml(origin.hint)}">${origin.line}${origin.tail ? ` · ${origin.tail}` : ''} <strong class="text-white tabular-nums">${amount}</strong></span>`
}
