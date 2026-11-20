/**
 * InventoryValueHeader - what the top of the inventory says of the values (F75, prototype v5.1):
 *
 *   the strip under the title   «Estimated value of what I own» and «To buy the rest», each with
 *                               how many albums have a value, and the choice of the currency
 *                               (REQ-07, REQ-08). It took the place of «Total Owned».
 *   the notices                 a run of «Update values» under way, with «Stop»; or how many
 *                               albums wait for a value, with «Read them now» (REQ-09).
 *
 * With the Discogs values off (REQ-10) there is no notice and no mention of Discogs: the totals,
 * the currency and what the person wrote go on working.
 *
 * Pure: HTML strings from what the controller knows (controllers/InventoryValues.js `view`).
 */

import {
    BASE_CURRENCY, CURRENCIES, DISCOGS_CREDIT, LOWEST_PRICES_NOTE, RATES_MISSING_TEXT, SourceState, formatMoney, convert, ownedNote,
    rateNote, toBuyNote
} from '../../models/inventoryValue.js'
import { readingNotice, waitingNotice } from '../../models/inventoryValueRun.js'

const CURRENCY_BUTTON = 'text-xs px-2 py-1 rounded bg-surface-light hover:bg-surface-lighter border border-surface-light text-gray-300 hover:text-white transition-colors uppercase'
const CHOSEN = 'border-color:#f97316;color:#fff'
const NOTE = 'text-xs text-gray-400 w-full'
const NOTHING = '—'

/** A total as the screen writes it: a dash while no album adds to it ("$0.00" would say it is worth nothing). */
function totalText(total, money) {
    if (total.valued === 0) return NOTHING
    return formatMoney(convert(total.sum, BASE_CURRENCY, money.currency, money.rates) ?? total.sum, money.currency)
}

const part = (id, label, sum, counted) => `<div class="flex flex-wrap items-center gap-2" data-total="${id}"><span class="text-sm text-gray-400">${label}</span>
      <span class="text-lg font-bold text-accent-primary" data-role="sum">${sum}</span> <span class="text-xs text-gray-400" data-role="count">${counted}</span></div>`

/** The four currencies; one that has no rate today cannot be chosen, and says why. */
function currencyButtons(money) {
    const buttons = CURRENCIES.map(code => {
        const usable = code === BASE_CURRENCY || Boolean(money.rates?.[code])
        const chosen = code === money.currency
        const off = usable ? '' : ` disabled title="${RATES_MISSING_TEXT}"`
        return `<button type="button" data-currency="${code}" class="${CURRENCY_BUTTON}" aria-pressed="${chosen}" style="${chosen ? CHOSEN : ''}"${off}>${code}</button>`
    }).join('')
    return `<span id="currencySelector" class="flex gap-1 md:ml-auto" role="group" aria-label="Currency">${buttons}</span>`
}

/** The lines under the totals: the rate used, that the rates did not come, and where the Discogs data comes from. */
function notesOf(known) {
    const { money } = known
    const notes = []
    if (money.currency !== BASE_CURRENCY) notes.push(`<div class="${NOTE}" data-role="rate">${rateNote(money.currency, money.rates)}</div>`)
    if (money.ratesMissing) notes.push(`<div class="${NOTE}" data-role="rates-missing" role="status">${RATES_MISSING_TEXT}</div>`)
    if (known.discogsShown) {
        notes.push(`<div class="${NOTE}" data-role="discogs-credit"><a class="underline hover:text-white" href="https://www.discogs.com/" target="_blank" rel="noopener">${DISCOGS_CREDIT}</a> Each value links to its edition on Discogs.${known.lowestShown ? ` ${LOWEST_PRICES_NOTE}` : ''}</div>`)
    }
    return notes.join('')
}

/**
 * The strip of the totals.
 * @param {Object} known - controllers/InventoryValues.js `view`
 * @returns {string} HTML
 */
export function renderTotals(known) {
    const { totals, money } = known
    return part('owned', 'Estimated value of what I own:', totalText(totals.owned, money), ownedNote(totals.owned)) +
        part('to-buy', 'To buy the rest:', totalText(totals.toBuy, money), toBuyNote(totals.toBuy)) +
        currencyButtons(money) +
        notesOf(known)
}

const notice = (id, { strong, rest, action }, actionName) => `<div id="${id}" class="glass-panel p-4 mb-6 flex flex-wrap items-center justify-between gap-3" role="status">
    <span class="text-sm text-white"><strong>${strong}</strong> ${rest}</span> <button type="button" class="btn btn-secondary whitespace-nowrap" data-notice-action="${actionName}">${action}</button></div>`

/**
 * The notice of the values: nothing with the source off; the run while it goes; else the albums
 * that wait for a value, when there are some.
 * @param {Object} known - controllers/InventoryValues.js `view`
 * @returns {string} HTML
 */
export function renderNotices(known) {
    if (known.source !== SourceState.ON) return ''
    return runNotice(known) + (known.sellerSettingsMissing ? SELLER_SETTINGS_NOTICE : '')
}

function runNotice(known) {
    if (known.run.busy) return notice('valuesReadingNotice', readingNotice(known.run.count), 'stop-values')
    return known.waiting > 0 ? notice('valuesWaitingNotice', waitingNotice(known.waiting), 'read-values') : ''
}

/**
 * Discogs refuses price suggestions to an account with no seller settings: said once, with what
 * the values are meanwhile and where the person fills the settings in.
 */
const SELLER_SETTINGS_NOTICE = `<div id="valuesSellerSettingsNotice" class="glass-panel p-4 mb-6" role="status">
    <span class="text-sm text-white"><strong>Discogs suggests prices only to accounts with seller settings filled in.</strong> Until then, the values here are the lowest price each CD is for sale at. Fill the settings in at <a class="text-accent-primary underline" href="https://www.discogs.com/settings/seller" target="_blank" rel="noopener">discogs.com/settings/seller</a>: the suggestions are tried again the next time values are read.</span></div>`

/* ── The phone (F76, recheck N2): the same facts in two short rows, so the list shows at once ── */

/** The text of the phone's values, in one place. */
export const PHONE_VALUES_TEXT = Object.freeze({
    owned: 'Owned',
    toBuy: 'To buy',
    why: 'Lowest asking prices · Why?',
    about: 'About the values'
})

/** The four currencies as the phone's segmented control (css/mobile.css `.phone-segmented`). */
function phoneCurrency(money) {
    const buttons = CURRENCIES.map(code => {
        const usable = code === BASE_CURRENCY || Boolean(money.rates?.[code])
        const chosen = code === money.currency
        return `<button type="button" data-currency="${code}" class="phone-segmented__option${chosen ? ' is-on' : ''}" aria-pressed="${chosen}"${usable ? '' : ' disabled'}>${code}</button>`
    }).join('')
    return `<span id="currencySelector" class="phone-segmented inv-values__currency" role="group" aria-label="Currency">${buttons}</span>`
}

/**
 * The totals on the phone: «Owned $1,948» and «To buy $611» one above the other, the currency at
 * their right; under them «Data provided by Discogs.» (a term of use, always beside the values)
 * and one button that opens the rest in a sheet (the counts, the rate, why the values are the
 * lowest asking prices and where to fill the seller settings in).
 * @param {Object} known - controllers/InventoryValues.js `view`
 * @returns {string} HTML
 */
export function renderPhoneTotals(known) {
    const { totals, money } = known
    const line = (id, label, total) => `<div class="inv-values__total" data-total="${id}"><span class="inv-values__label">${label}</span> <span class="inv-values__sum" data-role="sum">${totalText(total, money)}</span></div>`
    const missing = money.ratesMissing ? `<div class="inv-values__note" data-role="rates-missing" role="status">${RATES_MISSING_TEXT}</div>` : ''
    const credit = known.discogsShown ? `<a class="inv-values__credit" data-role="discogs-credit" href="https://www.discogs.com/" target="_blank" rel="noopener">${DISCOGS_CREDIT}</a>` : ''
    const about = `<button type="button" class="inv-values__about" data-values-about="true" aria-haspopup="dialog">${known.sellerSettingsMissing ? PHONE_VALUES_TEXT.why : PHONE_VALUES_TEXT.about}</button>`
    return `<div class="inv-values__row"><div class="inv-values__totals">${line('owned', PHONE_VALUES_TEXT.owned, totals.owned)}${line('to-buy', PHONE_VALUES_TEXT.toBuy, totals.toBuy)}</div>${phoneCurrency(money)}</div>` +
        `${missing}<div class="inv-values__foot">${credit}${about}</div>`
}

/**
 * What the «Why?» / «About the values» sheet says, as plain text (the sheet writes it as text).
 * @param {Object} known - controllers/InventoryValues.js `view`
 */
export function phoneValuesDetails(known) {
    const { totals, money } = known
    return {
        totals: [
            { label: 'Estimated value of what I own', sum: totalText(totals.owned, money), note: ownedNote(totals.owned) },
            { label: 'To buy the rest', sum: totalText(totals.toBuy, money), note: toBuyNote(totals.toBuy) }
        ],
        rate: money.currency !== BASE_CURRENCY && money.rates?.[money.currency] ? rateNote(money.currency, money.rates) : null,
        discogs: known.discogsShown ? ['Each value links to its edition on Discogs.', known.lowestShown ? LOWEST_PRICES_NOTE : null].filter(Boolean).join(' ') : null,
        sellerSettingsMissing: Boolean(known.sellerSettingsMissing),
        discogsShown: Boolean(known.discogsShown)
    }
}

/** The seller-settings sentence, for the phone's sheet: the same words as the computer's notice. */
export const SELLER_SETTINGS_TEXT = Object.freeze({
    strong: 'Discogs suggests prices only to accounts with seller settings filled in.',
    rest: 'Until then, the values here are the lowest price each CD is for sale at. Fill the settings in at',
    link: 'discogs.com/settings/seller',
    after: ': the suggestions are tried again the next time values are read.'
})

/** One notice of the phone: one line and its button (the seller settings are in the sheet). */
const phoneNotice = (id, { strong, action }, actionName) => `<div id="${id}" class="inv-notice" role="status"><span class="inv-notice__text">${strong}</span><button type="button" class="inv-notice__action" data-notice-action="${actionName}">${action}</button></div>`

/**
 * The notices on the phone: the run, or the albums waiting, each in one row; nothing with the
 * source off. The seller-settings notice is not in the flow: «Why?» opens it.
 * @param {Object} known - controllers/InventoryValues.js `view`
 * @returns {string} HTML
 */
export function renderPhoneNotices(known) {
    if (known.source !== SourceState.ON) return ''
    if (known.run.busy) return phoneNotice('valuesReadingNotice', readingNotice(known.run.count), 'stop-values')
    return known.waiting > 0 ? phoneNotice('valuesWaitingNotice', waitingNotice(known.waiting), 'read-values') : ''
}
