/**
 * inventoryValue - what an album of the inventory is worth (F75, S-57), as pure rules.
 *
 * The value shown for an item is, in this order:
 *   1. what the person wrote (`item.value`, kept in the cloud, in USD): origin "yours". A reading
 *      never replaces it;
 *   2. the newest reading of Discogs, whatever its age: the one kept in the item (`discogsReading`,
 *      in the database, per person; decision of the MJRP of 2026-11-21, constitution VI.1) or the
 *      one the browser holds, whichever was read last. Origin "discogs"; it says when it was read;
 *   3. none, with the reason: never read, waiting, being read, no CD edition, no price suggested,
 *      the source is off, or the read failed (and why).
 *
 * Six hours is no longer the age a reading may be shown at. It is the guard of "Update values":
 * an album read less than six hours ago is not asked to Discogs again.
 *
 * Amounts are kept in USD. A reading comes in the currency of the Discogs account and is turned
 * into USD with the rates of the day; with no rate for it, it adds to no total. The screen shows
 * USD, EUR, GBP or BRL; with no rates it shows USD and says why.
 *
 * No network, no store, no screen here.
 */

import { InventoryStatus, statusOf } from './inventoryStatus.js'

export const SIX_HOURS_MS = 6 * 60 * 60 * 1000
export const BASE_CURRENCY = 'USD'
/** The currencies the person may see the values in, in the order of the screen. */
export const CURRENCIES = Object.freeze(['USD', 'EUR', 'GBP', 'BRL'])
const SYMBOLS = Object.freeze({ USD: '$', EUR: '€', GBP: '£', BRL: 'R$ ' })

export const ValueOrigin = Object.freeze({ YOURS: 'yours', DISCOGS: 'discogs' })

/** Why an item shows no value. */
export const NoValue = Object.freeze({
    NEVER_READ: 'never_read',
    WAITING: 'waiting',
    READING: 'reading',
    NO_CD_EDITION: 'no_cd_edition',
    NO_SUGGESTION: 'no_suggestion',
    NONE_FOR_SALE: 'none_for_sale',
    SOURCE_OFF: 'source_off',
    FAILED: 'failed'
})

/**
 * What a Discogs value is made of. Discogs gives the suggestion by condition only to an account
 * with seller settings filled in; to any other the app reads the lowest price the edition is for
 * sale at. It is a Discogs value all the same, and it is never called a suggestion or a mean.
 */
export const ValueBasis = Object.freeze({ SUGGESTION: 'suggestion', LOWEST_FOR_SALE: 'lowest_for_sale' })

/** What a reading kept in the browser says. */
export const ReadingKind = Object.freeze({ FOUND: 'found', NOT_FOUND: 'not_found', NO_VALUE: 'no_value' })

/** The switch of the Discogs values, as the server says it. */
export const SourceState = Object.freeze({ ON: 'on', OFF: 'off' })

/** Why a read failed, as the person is told (REQ-13). */
export const ReadFailure = Object.freeze({
    NO_ANSWER: 'no_answer',
    LIMIT: 'limit',
    TOKEN_REFUSED: 'token_refused',
    SIGN_IN: 'sign_in',
    OTHER: 'other'
})

const isNumber = (value) => typeof value === 'number' && Number.isFinite(value)
const isAmount = (value) => isNumber(value) && value > 0
const CONDITION_NAMES = Object.freeze(['mint', 'nearMint', 'veryGoodPlus'])

/** The mean of the three conditions, to the cent; null when one is missing. */
export function meanOfConditions(conditions) {
    const values = CONDITION_NAMES.map(name => conditions?.[name])
    if (!values.every(isAmount)) return null
    return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100
}

/**
 * Is the reading young enough to be shown? Less than six hours old, and not from the future (a
 * clock that went back says nothing about its age).
 * @param {{ readAt?: string }|null} reading
 * @param {number} now - ms
 */
export function isFresh(reading, now) {
    const at = Date.parse(reading?.readAt ?? '')
    if (!Number.isFinite(at)) return false
    const age = now - at
    return age >= 0 && age < SIX_HOURS_MS
}

const readTime = (reading) => Date.parse(reading?.readAt ?? '')

/** Of two readings, the one read last (the first when they are equal); the one with a date when only one has; else null. */
export function newestReading(first, second) {
    const [a, b] = [readTime(first), readTime(second)]
    if (!Number.isFinite(a)) return Number.isFinite(b) ? second : null
    return Number.isFinite(b) && b > a ? second : first
}

/** The value the person wrote, when there is one. */
export function writtenValueOf(item) {
    const written = item?.value
    return written && isAmount(written.amount) ? { amount: written.amount, currency: written.currency || BASE_CURRENCY, at: written.at ?? null } : null
}

const none = (reason, extra = {}) => ({ origin: null, reason, ...extra })

/** What a reading that is still fresh says of the item. */
function fromReading(reading) {
    if (reading.kind === ReadingKind.NOT_FOUND) return none(NoValue.NO_CD_EDITION, { readAt: reading.readAt })
    if (reading.basis === ValueBasis.LOWEST_FOR_SALE) return fromLowestForSale(reading)
    const amount = reading.kind === ReadingKind.FOUND ? meanOfConditions(reading.conditions) : null
    if (amount === null) return none(NoValue.NO_SUGGESTION, { release: reading.release ?? null, readAt: reading.readAt })
    return {
        origin: ValueOrigin.DISCOGS,
        amount,
        currency: reading.currency || BASE_CURRENCY,
        conditions: reading.conditions,
        release: reading.release ?? null,
        readAt: reading.readAt
    }
}

/** A reading of the lowest price for sale: that price, or "none for sale" when nobody sells the edition. */
function fromLowestForSale(reading) {
    const lowest = reading.kind === ReadingKind.FOUND ? reading.lowest : null
    if (!lowest || !isAmount(lowest.value)) return none(NoValue.NONE_FOR_SALE, { release: reading.release ?? null, readAt: reading.readAt })
    return {
        origin: ValueOrigin.DISCOGS,
        basis: ValueBasis.LOWEST_FOR_SALE,
        amount: lowest.value,
        currency: lowest.currency || BASE_CURRENCY,
        forSale: reading.forSale ?? null,
        release: reading.release ?? null,
        readAt: reading.readAt
    }
}

/** With no value written and no fresh reading: what the run, or the switch, says of the item. */
function fromProgress(progress, source) {
    if (progress?.state === 'reading') return none(NoValue.READING)
    if (progress?.state === 'failed') return none(NoValue.FAILED, { failure: progress.failure || ReadFailure.OTHER })
    if (source === SourceState.ON) return none(NoValue.WAITING)
    return none(source === SourceState.OFF ? NoValue.SOURCE_OFF : NoValue.NEVER_READ)
}

/**
 * The value of one item.
 * @param {Object} item - an inventory item
 * @param {Object} [known]
 * @param {Object|null} [known.reading] - what the browser keeps of the last read of this item
 * @param {number} [known.now] - ms
 * @param {'on'|'off'|null} [known.source] - the switch; null while it is not known
 * @param {{ state: 'reading'|'failed', failure?: string }|null} [known.progress] - what a read under way says
 * @returns {Object} { origin: 'yours', amount, currency, at } | { origin: 'discogs', amount, currency,
 *   conditions, release, readAt } | { origin: null, reason, failure?, release?, readAt? }
 */
export function valueOfItem(item, known = {}) {
    const written = writtenValueOf(item)
    if (written) return { origin: ValueOrigin.YOURS, ...written }
    // With the source off nothing of Discogs is shown, a kept reading included
    return known.source === SourceState.OFF ? fromProgress(null, known.source) : fromDiscogs(item, known)
}

/** The source is on, or not known yet: what is being read now, else the newest reading, else what the run says. */
function fromDiscogs(item, { reading, progress, source }) {
    if (progress && progress.state === 'reading') return none(NoValue.READING)
    const newest = newestReading(item?.discogsReading, reading)
    return newest ? fromReading(newest) : fromProgress(progress, source)
}

/** The newest reading of an item, kept in the item or in the browser. */
const readingOfItem = (item, browserReading) => newestReading(item?.discogsReading, browserReading)

/** Does a run have something to read for this item? No value written, and no reading younger than six hours (the guard). */
export function needsReading(item, reading, now) {
    return !writtenValueOf(item) && !isFresh(readingOfItem(item, reading), now)
}

/** Is the item waiting for a value? No value written, and never a reading: in the item or in the browser. */
export function neverRead(item, reading) {
    return !writtenValueOf(item) && !readingOfItem(item, reading)
}

/** Does the browser hold a reading the item does not keep yet, or a newer one? The next run saves it, with no new question to Discogs. */
export function needsKeeping(item, reading) {
    const newest = readingOfItem(item, reading)
    return Boolean(newest) && newest === reading && newest !== item?.discogsReading
}

// ---- Currencies ------------------------------------------------------------------------------------

const rateOf = (rates, code) => (code === BASE_CURRENCY ? 1 : rates?.[code])

/**
 * An amount in another currency, through USD.
 * @param {number} amount
 * @param {string} from
 * @param {string} to
 * @param {Object|null} rates - { EUR, GBP, BRL }: how much of each one USD buys
 * @returns {number|null} null when a rate that is needed is not known
 */
export function convert(amount, from, to, rates) {
    if (!isNumber(amount)) return null
    if (from === to) return amount
    const [fromRate, toRate] = [rateOf(rates, from), rateOf(rates, to)]
    return isAmount(fromRate) && isAmount(toRate) ? (amount / fromRate) * toRate : null
}

export const toUsd = (amount, currency, rates) => convert(amount, currency || BASE_CURRENCY, BASE_CURRENCY, rates)

/** The currency the screen shows: the chosen one, or USD when it was not chosen or has no rate. */
export function shownCurrency(chosen, rates) {
    if (!CURRENCIES.includes(chosen) || chosen === BASE_CURRENCY) return BASE_CURRENCY
    return isAmount(rates?.[chosen]) ? chosen : BASE_CURRENCY
}

/**
 * An amount rounded to cents, half away from zero, on the amount as its shortest decimal text (the
 * text JavaScript gives a number is fixed by the language, the same on every engine): 1166.505 is
 * 1166.51, 1.005 is 1.01. It is what the site's browsers already show (the default rounding of
 * `toLocaleString`). Money is rounded here, BEFORE it is formatted, because engines round the half
 * differently when they format: the phone's engine wrote 1166.505 as .50, Node as .51 (F78, S1).
 */
export function roundToCents(amount) {
    const [digits, exponent = '0'] = String(Math.abs(amount)).split('e')
    const cents = Math.round(Number(`${digits}e${Number(exponent) + 2}`))
    return Math.sign(amount) * Number(`${cents}e-2`)
}

/** "$12.30", "R$ 1,234.50": rounded to cents first (`roundToCents`), then formatted. */
export function formatMoney(amount, currency = BASE_CURRENCY) {
    const digits = roundToCents(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return `${SYMBOLS[currency] ?? `${currency} `}${digits}`
}

/**
 * A value as the screen writes it, in the shown currency; in its own currency when it cannot be
 * converted (a reading in a currency with no rate today).
 * @param {{ amount: number, currency: string }} value
 * @param {{ currency: string, rates: Object|null }} view
 */
export function moneyOf(value, { currency, rates }) {
    const converted = convert(value.amount, value.currency, currency, rates)
    return converted === null ? formatMoney(value.amount, value.currency) : formatMoney(converted, currency)
}

/**
 * What the person typed as a value: a number above zero, with a dot or a comma for the cents.
 * @returns {number|null}
 */
export function parseAmount(text) {
    const cleaned = String(text ?? '').replace(/[^\d.,]/g, '').replace(/,(\d{1,2})$/, '.$1').replace(/,/g, '')
    const amount = Number.parseFloat(cleaned)
    return isAmount(amount) ? Math.round(amount * 100) / 100 : null
}

/**
 * The `value` an item is written with: what the person typed in the shown currency, kept in USD.
 * @returns {{ amount: number, currency: 'USD', at: string }|null} null when the text is no amount or cannot be converted
 */
export function writtenValueFrom(text, { currency, rates }, at) {
    const typed = parseAmount(text)
    const amount = typed === null ? null : toUsd(typed, currency, rates)
    return amount === null ? null : { amount: Math.round(amount * 100) / 100, currency: BASE_CURRENCY, at }
}

// ---- Totals ----------------------------------------------------------------------------------------

const emptyTotal = () => ({ sum: 0, valued: 0, total: 0 })

/**
 * The two totals of the header, in USD: what is Owned, and what is Not Owned or on the Wishlist.
 * An item counts as "has a value" only when its value adds to the sum.
 * @param {Array<Object>} items
 * @param {Function} valueFor - (item) => a value of valueOfItem
 * @param {Object|null} rates
 * @returns {{ owned: { sum, valued, total }, toBuy: { sum, valued, total } }}
 */
export function totalsOf(items, valueFor, rates) {
    const totals = { owned: emptyTotal(), toBuy: emptyTotal() }
    items.forEach(item => {
        const total = statusOf(item) === InventoryStatus.OWNED ? totals.owned : totals.toBuy
        total.total += 1
        const value = valueFor(item)
        const usd = value?.origin ? toUsd(value.amount, value.currency, rates) : null
        if (usd === null) return
        total.sum += usd
        total.valued += 1
    })
    return totals
}

/** How many of these values came from Discogs: while there is one on the screen, the screen says where the data comes from. */
export const itemsWithDiscogsValue = (values) => [...values.values()].filter(value => value.origin === ValueOrigin.DISCOGS).length

/** How many of these values are the lowest price for sale: while there is one, the screen says what they are. */
export const lowestValuesShown = (values) => [...values.values()].filter(value => value.basis === ValueBasis.LOWEST_FOR_SALE).length

/** The amount of a value in USD, for the order of the inventory; null when it has none. */
export const usdOf = (value, rates) => (value?.origin ? toUsd(value.amount, value.currency, rates) : null)

// ---- What is said ----------------------------------------------------------------------------------

const FAILURE_TEXT = Object.freeze({
    [ReadFailure.NO_ANSWER]: 'Discogs did not answer',
    [ReadFailure.LIMIT]: 'Discogs limit reached',
    [ReadFailure.TOKEN_REFUSED]: 'Discogs refused the token',
    [ReadFailure.SIGN_IN]: 'Sign in to read values',
    [ReadFailure.OTHER]: 'The value could not be read'
})

const NONE_TEXT = Object.freeze({
    [NoValue.NEVER_READ]: 'No value yet',
    [NoValue.SOURCE_OFF]: 'No value yet',
    [NoValue.WAITING]: 'Waiting for a value',
    [NoValue.READING]: 'Reading…',
    [NoValue.NO_CD_EDITION]: 'No CD edition found',
    [NoValue.NO_SUGGESTION]: 'No price suggested on Discogs',
    [NoValue.NONE_FOR_SALE]: 'None for sale on Discogs now'
})

export const failureText = (failure) => FAILURE_TEXT[failure] || FAILURE_TEXT[ReadFailure.OTHER]

/** The short line of a card for an item with no value. */
export const noValueText = (value) => (value.reason === NoValue.FAILED ? failureText(value.failure) : NONE_TEXT[value.reason] || NONE_TEXT[NoValue.NEVER_READ])

/** The label of the value of a card, by the status of the item. */
export const valueLabel = (item) => (statusOf(item) === InventoryStatus.OWNED ? 'In my collection · worth' : 'Not mine yet · costs')

export const DISCOGS_MEAN_TITLE = 'Mean of Mint, Near Mint and Very Good Plus on Discogs, for the most common CD edition'
export const DISCOGS_CREDIT = 'Data provided by Discogs.'
export const DISCOGS_LOWEST_TITLE = 'Lowest price this CD edition was for sale at on Discogs when it was read'
export const LOWEST_PRICES_NOTE = 'Discogs values are lowest asking prices for now.'
export const RATES_MISSING_TEXT = 'Exchange rates are not available: values are shown in USD.'

/** "3 of 14 owned albums have a value": the words of the prototype, the same for every count. */
export const ownedNote = ({ valued, total }) => `${valued} of ${total} owned albums have a value`
/** "9 of 197 albums have a value". */
export const toBuyNote = ({ valued, total }) => `${valued} of ${total} albums have a value`

/** The line under the totals when the screen is not in USD. */
export const rateNote = (currency, rates) => `Converted from USD at today's rate (1 USD = ${rates[currency]} ${currency}).`

/** "20 Nov 2026". */
export function dayText(iso) {
    const date = new Date(iso)
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** "20 Nov": the short «read on» of a card, where there is no room for the year (the whole moment is in its `title`). */
export function shortDayText(iso) {
    const date = new Date(iso)
    // a no-break space between the day and the month: the date never splits over two lines
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).replace(' ', '\u00a0')
}

/** "20 Nov": what the origin line of a card or of a phone row adds to a Discogs value (REQ-16), the same form in both; nothing when the reading has no valid date. */
export const readOnText = (value) => shortDayText(value?.readAt)

/** "20 Nov 2026, 14:05": a reading says the hour too, so the person can tell a reading of today from an old one. */
export function momentText(iso) {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return ''
    return `${dayText(iso)}, ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
}
