/**
 * InventoryValueSection - the two sections the album window of an inventory item gains (F75):
 *
 *   «Estimated value»  the three conditions of the disc and their mean, the edition used with its
 *                      link, when it was read, «Read again», the field to write a value, and the
 *                      way back to the Discogs value (REQ-03, REQ-04, REQ-06)
 *   «Where to buy»     the three stores, each on a search for this album on CD (REQ-11)
 *
 * The value section draws what it is told (`view()`), asks its host for every action and draws
 * again when the action ends: it holds no value of its own. Beside every value that came from
 * Discogs it says «Data provided by Discogs.», linked to the page of that edition.
 *
 * On the phone (F76, recheck N7) the window shows both folded, one line each, so the tracks start
 * on the first screen: `phoneValueFold` (the value and its origin, «Data provided by Discogs.»
 * beside it, the whole section on a tap) and `createPhoneBuyLinks` (the three stores in one row).
 *
 * Every text from outside goes through escapeHtml, every address through safeUrl.
 */

import { SafeDOM } from '../utils/SafeDOM.js'
import { getIcon } from './Icons.js'
import { escapeHtml } from '../utils/stringUtils.js'
import { safeUrl } from '../utils/safeUrl.js'
import {
    DISCOGS_CREDIT, NoValue, SourceState, ValueBasis, ValueOrigin, dayText, failureText, formatMoney, meanOfConditions, momentText, moneyOf, readOnText,
    noValueText
} from '../models/inventoryValue.js'
import { BUY_LINKS_NOTE, BuyLinkPlace, buyLinkAttributes, buyLinkMarks, buyLinksOf } from '../models/buyLinks.js'

const BOX = 'bg-black/20 rounded-xl border border-white/10 p-3'
const TAG = 'text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5'
const HEADING = 'text-xs font-bold text-gray-400 uppercase tracking-widest mb-1'
const LEAD = 'text-sm text-gray-400 mb-3'
const SMALL = 'text-xs text-gray-400 mt-3'
const INPUT_ID = 'inventoryValueInput'

const heading = (text) => `<h3 class="${HEADING}">${text}</h3>`
const lead = (text) => `<p class="${LEAD}">${text}</p>`
const textButton = (action, label) => `<button type="button" class="text-accent-primary underline" data-action="${action}">${label}</button>`

/** A link to a page of Discogs, or the plain text when the address is not a web address. */
function discogsLink(url, label) {
    if (!safeUrl(url)) return label
    return `<a class="text-accent-primary underline" href="${escapeHtml(safeUrl(url))}" target="_blank" rel="noopener">${label}</a>`
}

/** «Data provided by Discogs.», linked to the page of the edition the data is of. */
const credit = (release) => `<p class="text-xs text-gray-400 mt-1" data-role="discogs-credit">${discogsLink(release?.url, DISCOGS_CREDIT)}</p>`

/** The field where the person writes a value, in the currency the screen shows. */
function field(label, money) {
    const symbol = formatMoney(0, money.currency).replace(/[\d.,]+$/, '').trim()
    const converted = money.currency === 'USD' ? '' : `<p class="text-xs text-gray-400 mt-1">Written in ${money.currency} and kept in USD, at today's rate.</p>`
    return `<div class="flex flex-wrap items-center gap-3 mt-3"><label class="text-sm text-gray-400" for="${INPUT_ID}">${label}</label>
      <input id="${INPUT_ID}" class="form-control" style="width:140px" inputmode="decimal" autocomplete="off" placeholder="${symbol} 0.00">
      <button type="button" class="btn btn-secondary" data-action="save-value">Save</button></div>${converted}`
}

/** The button that reads the value of this album now; it waits while «Update values» runs. */
function readButton(label, { busy }, primary = false) {
    const waits = busy ? ' disabled title="Update values is running: this album is read in its turn"' : ''
    return primary
        ? `<button type="button" class="btn btn-primary" data-action="read-value"${waits}>${label}</button>`
        : `<button type="button" class="text-accent-primary underline" data-action="read-value"${waits}>${label}</button>`
}

const isOn = (shown) => shown.source === SourceState.ON

function yours({ value, money, ...shown }) {
    const back = isOn(shown) ? 'Use the Discogs value instead' : 'Remove my value'
    const when = value.at ? ` on ${dayText(value.at)}` : ''
    return `${lead(`You wrote this value.${isOn(shown) ? ' Reading values from Discogs never changes it.' : ''}`)}
      <div class="flex items-center gap-2"><span class="text-2xl font-bold text-white" data-role="amount">${moneyOf(value, money)}</span><span class="${TAG}">Yours</span></div>
      ${field('Change it', money)}
      <p class="${SMALL}">Written by you${when}. ${textButton('forget-value', back)}</p>`
}

const cell = (label, amount, value, money, strong = false) =>
    `<div class="${BOX}" ${strong ? 'style="border-color:#f97316"' : ''}><div class="text-xs text-gray-400">${label}</div><div class="text-lg font-bold text-white">${moneyOf({ amount, currency: value.currency }, money)}</div></div>`

/** "Edition: Harvest 1984, Europe (CD), the most common CD edition on Discogs." */
function editionLine(release) {
    const name = release?.title ? `${escapeHtml(release.title)} (CD), the` : 'The'
    return `Edition: ${name} most common CD edition on Discogs. ${discogsLink(release?.url, 'See it on Discogs')}`
}

function fromDiscogs({ value, money, ...shown }) {
    const { mint, nearMint, veryGoodPlus } = value.conditions
    const converted = value.currency === money.currency ? '' : `, converted from ${escapeHtml(value.currency)} at today's rate`
    return `${lead('What this CD sells for on Discogs, by the condition of the disc. The value of the album is the mean of the three.')}
      <div class="flex flex-wrap gap-3" data-role="conditions">${cell('Mint', mint, value, money)}${cell('Near Mint', nearMint, value, money)}${cell('Very Good Plus', veryGoodPlus, value, money)}${cell('Mean of the three', meanOfConditions(value.conditions), value, money, true)}</div>
      <p class="${SMALL}">${editionLine(value.release)}<br>
        Read on ${momentText(value.readAt)}${converted}. ${readButton('Read again', shown)}</p>
      ${credit(value.release)}
      ${field('Write your own value', money)}`
}

/** The weaker Discogs value: the lowest price the edition is for sale at. Never called a suggestion or a mean. */
function lowestForSale({ value, money, ...shown }) {
    const converted = value.currency === money.currency ? '' : `, converted from ${escapeHtml(value.currency)} at today's rate`
    const count = Number.isInteger(value.forSale) && value.forSale > 0 ? `<span class="text-xs text-gray-400">(${value.forSale} for sale)</span>` : ''
    return `${lead('The lowest price this CD is for sale at on Discogs now. It is an asking price, not what the disc usually sells for.')}
      <div class="flex flex-wrap items-center gap-2" data-role="lowest"><span class="text-sm text-gray-400">Lowest price for sale on Discogs:</span> <span class="text-2xl font-bold text-white" data-role="amount">${moneyOf(value, money)}</span> ${count}</div>
      <p class="${SMALL}">${editionLine(value.release)}<br>
        Read on ${momentText(value.readAt)}${converted}. ${readButton('Read again', shown)}</p>
      ${credit(value.release)}
      <p class="text-xs text-gray-400 mt-1">${SUGGESTION_NEEDS_SETTINGS}</p>
      ${field('Write your own value', money)}`
}

const SUGGESTION_NEEDS_SETTINGS = 'Discogs gives a suggestion by the condition of the disc (Mint, Near Mint, Very Good Plus) only to accounts with seller settings filled in.'

function noneForSale({ value, money, ...shown }) {
    return `${lead('Nobody sells this CD edition on Discogs now, so there is no price to read.')}
      <p class="text-sm text-white">None for sale on Discogs now</p>
      <p class="text-xs text-gray-400 mt-1">${editionLine(value.release)}</p>
      ${credit(value.release)}
      ${field('Write the value yourself', money)}
      ${lookedFor(value, shown)}`
}

const lookedFor = (value, shown) => `<p class="${SMALL}">Looked for on ${momentText(value.readAt)}. ${readButton('Look again', shown)}</p>`

function noEdition({ value, money, ...shown }) {
    return `${lead('Discogs has no CD edition under this artist and title, so there is no value to read.')}
      <p class="text-sm text-white">No CD edition found on Discogs</p>
      ${field('Write the value yourself', money)}
      ${lookedFor(value, shown)}`
}

function noSuggestion({ value, money, ...shown }) {
    return `${lead('Discogs has this CD edition and suggests no price for it, so there is no value to read.')}
      <p class="text-sm text-white">No price suggested on Discogs</p>
      <p class="text-xs text-gray-400 mt-1">${editionLine(value.release)}</p>
      ${credit(value.release)}
      ${field('Write the value yourself', money)}
      ${lookedFor(value, shown)}`
}

function notReadYet({ money, ...shown }) {
    return `${lead('No value was read for this album yet.')}
      ${readButton('Read the value now', shown, true)}
      ${field('Or write it yourself', money)}`
}

function reading({ money }) {
    return `${lead('Reading the value from Discogs…')}
      <button type="button" class="btn btn-primary" disabled aria-busy="true">Reading…</button>
      ${field('Or write it yourself', money)}`
}

function failed({ value, money, ...shown }) {
    return `${lead(`${failureText(value.failure)}. The value was not read.`)}
      ${readButton('Try again', shown, true)}
      ${field('Or write it yourself', money)}`
}

function nothingWritten({ money }) {
    return `${lead('No value was written for this album yet.')}
      ${field('Write the value yourself', money)}`
}

/** What the section shows for each origin of a value, and for each reason of having none. */
const BODIES = Object.freeze({
    [ValueOrigin.YOURS]: yours,
    [ValueOrigin.DISCOGS]: fromDiscogs,
    [NoValue.NO_CD_EDITION]: noEdition,
    [NoValue.NO_SUGGESTION]: noSuggestion,
    [NoValue.NONE_FOR_SALE]: noneForSale,
    [ValueBasis.LOWEST_FOR_SALE]: lowestForSale,
    [NoValue.WAITING]: notReadYet,
    [NoValue.READING]: reading,
    [NoValue.FAILED]: failed,
    [NoValue.SOURCE_OFF]: nothingWritten,
    [NoValue.NEVER_READ]: nothingWritten
})

/** The HTML of the «Estimated value» section for what the screen knows now. */
export function valueSectionHtml(shown) {
    const body = BODIES[shown.value.basis || shown.value.origin || shown.value.reason] || nothingWritten
    return `${heading('Estimated value')}${body(shown)}`
}

/**
 * The «Estimated value» section of the album window.
 * @param {Object} host
 * @param {Function} host.view - () => { value, money: { currency, rates }, source, busy }
 * @param {Function} host.onWrite - (text) => Promise<boolean>: the person wrote a value
 * @param {Function} host.onForget - () => Promise: back to the Discogs value
 * @param {Function} host.onRead - () => Promise: read the value of this album now
 * @param {Function} [host.onDrawn] - called each time the section is drawn (the phone's line follows it)
 * @returns {HTMLElement} the section; `section.draw()` draws it again
 */
export function createValueSection({ view, onWrite, onForget, onRead, onDrawn }) {
    const section = SafeDOM.div({ className: `${BOX} mb-6`, dataset: { role: 'estimated-value' } })
    section.style.padding = '1rem'

    const input = () => section.querySelector(`#${INPUT_ID}`)

    /** Drawn again with what the person was typing still in the field, and the cursor in it. */
    const draw = () => {
        const before = input()
        const typed = before ? { text: before.value, inUse: before.ownerDocument.activeElement === before } : null
        SafeDOM.clear(section)
        section.appendChild(SafeDOM.fromHTML(valueSectionHtml(view())))
        onDrawn?.()
        const field = input()
        if (!typed || !field) return
        field.value = typed.text
        if (typed.inUse) field.focus()
    }
    const actions = {
        'save-value': async () => {
            const saved = await onWrite(input()?.value ?? '')
            if (saved && input()) input().value = '' // what was typed is the value now
        },
        'forget-value': () => onForget(),
        'read-value': () => {
            const done = onRead()
            draw() // the host already says "reading": show it while the answer is on its way
            return done
        }
    }
    const run = async (action) => {
        try {
            await actions[action]()
        } finally {
            draw()
        }
    }
    section.addEventListener('click', (event) => {
        const action = event.target.closest('[data-action]')?.dataset.action
        if (actions[action]) run(action)
    })
    section.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && event.target.id === INPUT_ID) run('save-value')
    })

    section.draw = draw
    draw()
    return section
}

/** The «Where to buy» section: the three stores, on this album. */
export function createBuyLinksSection(album) {
    const links = buyLinksOf(album).map(({ id, name, url }) =>
        `<a class="btn btn-secondary" href="${escapeHtml(safeUrl(url))}" target="_blank" rel="noopener" data-store="${escapeHtml(name)}" ${buyLinkAttributes(id, BuyLinkPlace.ALBUM_WINDOW)}>${escapeHtml(name)} ↗</a>`).join('')
    const section = SafeDOM.div({ className: `${BOX} mb-6`, dataset: { role: 'where-to-buy' } })
    section.style.padding = '1rem'
    section.appendChild(SafeDOM.fromHTML(`${heading('Where to buy')}${lead(BUY_LINKS_NOTE)}<div class="flex flex-wrap gap-3">${links}</div>`))
    return section
}

/* ── The phone (F76, recheck N7) ─────────────────────────────────────────────────────────────── */

/**
 * The value in one line: the amount (or what stands for none) and where it comes from, and the
 * edition of Discogs it was read from, for the credit.
 * @param {{ value: Object, money: Object }} shown - what `view()` gives
 */
export function valueSummaryOf({ value, money }) {
    const amount = value.amount ?? (value.conditions ? meanOfConditions(value.conditions) : null)
    if (!value.origin || amount === null || amount === undefined) return { amount: '—', origin: noValueText(value), release: null }
    const discogs = value.origin === ValueOrigin.DISCOGS
    return { amount: `≈ ${moneyOf({ amount, currency: value.currency }, money)}`, origin: discogs ? ['Discogs', readOnText(value)].filter(Boolean).join(' · ') : 'Yours', release: discogs ? value.release || {} : null }
}

/** «Data provided by Discogs.», linked to the edition (or to Discogs when the edition has no address). */
const phoneCredit = (release) => SafeDOM.a({
    className: 'value-fold__credit', href: safeUrl(release.url) || 'https://www.discogs.com/', target: '_blank', rel: 'noopener', dataset: { role: 'discogs-credit' }
}, DISCOGS_CREDIT)

/**
 * «Estimated value» folded to one line: a button with the value and its origin that opens the
 * whole section below it, and the Discogs credit beside it (a term of use: never folded away).
 * @param {HTMLElement} section - from createValueSection
 * @param {Function} view - the host's view()
 * @returns {HTMLElement} the fold; `fold.drawLine()` draws the line again
 */
export function phoneValueFold(section, view) {
    const panel = SafeDOM.div({ id: 'albumWindowValueDetails', className: 'value-fold__panel', hidden: true }, [section])
    const toggle = SafeDOM.button({ className: 'value-fold__toggle', 'aria-expanded': 'false', 'aria-controls': panel.id })
    const line = SafeDOM.div({ className: 'value-fold__line' })
    toggle.addEventListener('click', () => {
        const open = panel.hidden
        panel.hidden = !open
        toggle.setAttribute('aria-expanded', String(open))
    })
    const drawLine = () => {
        const { amount, origin, release } = valueSummaryOf(view())
        SafeDOM.clear(toggle)
        toggle.append(
            SafeDOM.span({ className: 'value-fold__label' }, 'Estimated value'),
            SafeDOM.span({ className: 'value-fold__value' }, [SafeDOM.span({ className: 'value-fold__amount', dataset: { role: 'amount' } }, amount), SafeDOM.span({ className: 'value-fold__origin' }, origin)]),
            SafeDOM.fromHTML(getIcon('ChevronDown', 'value-fold__chevron'))
        )
        SafeDOM.clear(line)
        line.append(...[toggle, release ? phoneCredit(release) : null].filter(Boolean))
    }
    const fold = SafeDOM.div({ className: 'value-fold', dataset: { role: 'value-fold' } }, [line, panel])
    fold.drawLine = drawLine
    drawLine()
    return fold
}

/** «Where to buy» on the phone: the three stores in one row, and what the links are. */
export function createPhoneBuyLinks(album) {
    const links = buyLinksOf(album).map(({ id, name, url }) => SafeDOM.a({
        className: 'value-fold__store', href: safeUrl(url), target: '_blank', rel: 'noopener', dataset: { store: name, ...buyLinkMarks(id, BuyLinkPlace.ALBUM_WINDOW) }
    }, `${name} ↗`))
    return SafeDOM.div({ className: 'value-fold value-fold--buy', dataset: { role: 'where-to-buy' } }, [
        SafeDOM.p({ className: 'value-fold__label' }, 'Where to buy'),
        SafeDOM.div({ className: 'value-fold__stores' }, links),
        SafeDOM.p({ className: 'value-fold__note' }, BUY_LINKS_NOTE)
    ])
}
