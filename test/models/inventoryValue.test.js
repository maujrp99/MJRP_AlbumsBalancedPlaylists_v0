/**
 * F75 (S-57) - what an album of the inventory is worth, as pure rules: the value the person wrote
 * wins; else a Discogs reading less than six hours old; else none, with the reason. The totals,
 * the currencies and what is said.
 */
import { describe, it, expect } from 'vitest'
import {
    SIX_HOURS_MS, NoValue, ValueOrigin, valueOfItem, isFresh, needsReading, meanOfConditions, convert, toUsd, shownCurrency,
    formatMoney, moneyOf, parseAmount, writtenValueFrom, totalsOf, usdOf, noValueText, valueLabel, ownedNote, toBuyNote, rateNote,
    itemsWithDiscogsValue, RATES_MISSING_TEXT, DISCOGS_CREDIT
} from '../../public/js/models/inventoryValue.js'
import { sortInventory, sortingFor } from '../../public/js/models/inventorySort.js'

const NOW = Date.parse('2026-11-20T12:00:00Z')
const RATES = { USD: 1, EUR: 0.91, GBP: 0.76, BRL: 5.89 }
const ago = (ms) => new Date(NOW - ms).toISOString()
const reading = (extra = {}) => ({
    kind: 'found',
    release: { id: 5012948, title: 'Harvest 1984, Europe', url: 'https://www.discogs.com/release/5012948' },
    conditions: { mint: 15, nearMint: 12, veryGoodPlus: 9 },
    currency: 'USD',
    readAt: ago(60 * 1000),
    ...extra
})
const item = (extra = {}) => ({ id: 'a', artist: 'Pink Floyd', title: 'The Dark Side of the Moon', owned: true, ...extra })
const on = (extra = {}) => ({ now: NOW, source: 'on', ...extra })

describe('the value of an item', () => {
    it('what the person wrote wins over a reading, and says it is theirs', () => {
        const written = item({ value: { amount: 25, currency: 'USD', at: '2026-10-12T10:00:00.000Z' } })

        expect(valueOfItem(written, on({ reading: reading() }))).toEqual({ origin: ValueOrigin.YOURS, amount: 25, currency: 'USD', at: '2026-10-12T10:00:00.000Z' })
    })

    it('a written value shows with the source off too; an amount that is not above zero is no value', () => {
        expect(valueOfItem(item({ value: { amount: 25, currency: 'USD' } }), { now: NOW, source: 'off' }).origin).toBe('yours')
        expect(valueOfItem(item({ value: { amount: 0, currency: 'USD' } }), { now: NOW, source: 'off' }).origin).toBe(null)
        expect(valueOfItem(item({ value: null }), { now: NOW, source: 'off' }).origin).toBe(null)
    })

    it('a fresh reading: the mean of the three conditions, with the edition and when it was read', () => {
        const value = valueOfItem(item(), on({ reading: reading() }))

        expect(value).toMatchObject({ origin: ValueOrigin.DISCOGS, amount: 12, currency: 'USD', conditions: { mint: 15, nearMint: 12, veryGoodPlus: 9 } })
        expect(value.release.url).toBe('https://www.discogs.com/release/5012948')
        expect(meanOfConditions({ mint: 14.5, nearMint: 11.2, veryGoodPlus: 7.9 })).toBeCloseTo(11.2, 5)
    })

    it('a reading is shown for less than six hours, not a second more (REQ-05)', () => {
        const justInside = reading({ readAt: ago(SIX_HOURS_MS - 1000) })
        const atSixHours = reading({ readAt: ago(SIX_HOURS_MS) })

        expect(valueOfItem(item(), on({ reading: justInside })).origin).toBe('discogs')
        expect(valueOfItem(item(), on({ reading: atSixHours }))).toEqual({ origin: null, reason: NoValue.WAITING })
        expect(isFresh(atSixHours, NOW)).toBe(false)
        expect(isFresh({ readAt: 'never' }, NOW)).toBe(false)
        expect(isFresh({ readAt: new Date(NOW + 60000).toISOString() }, NOW)).toBe(false) // a time in the future says nothing of the age
        expect(isFresh(null, NOW)).toBe(false)
    })

    it('with the source off nothing of Discogs is shown, a fresh reading included (REQ-10)', () => {
        expect(valueOfItem(item(), { now: NOW, source: 'off', reading: reading() })).toEqual({ origin: null, reason: NoValue.SOURCE_OFF })
        expect(valueOfItem(item(), { now: NOW, source: null, reading: reading() })).toEqual({ origin: null, reason: NoValue.NEVER_READ })
    })

    it('no value, with the reason: waiting, being read, no CD edition, no price suggested, failed and why', () => {
        expect(valueOfItem(item(), on())).toEqual({ origin: null, reason: NoValue.WAITING })
        expect(valueOfItem(item(), on({ progress: { state: 'reading' }, reading: reading() }))).toEqual({ origin: null, reason: NoValue.READING })
        expect(valueOfItem(item(), on({ reading: { kind: 'not_found', readAt: ago(1000) } }))).toMatchObject({ origin: null, reason: NoValue.NO_CD_EDITION })
        expect(valueOfItem(item(), on({ reading: reading({ kind: 'no_value', conditions: null }) }))).toMatchObject({ origin: null, reason: NoValue.NO_SUGGESTION, release: { id: 5012948 } })
        expect(valueOfItem(item(), on({ progress: { state: 'failed', failure: 'limit' } }))).toEqual({ origin: null, reason: NoValue.FAILED, failure: 'limit' })
    })

    it('a reading with a condition missing is no value: nothing is invented', () => {
        expect(valueOfItem(item(), on({ reading: reading({ conditions: { mint: 15, nearMint: 12 } }) })).reason).toBe(NoValue.NO_SUGGESTION)
    })

    it('what a read has to do: an item with no written value and no fresh reading', () => {
        expect(needsReading(item(), undefined, NOW)).toBe(true)
        expect(needsReading(item(), reading(), NOW)).toBe(false)
        expect(needsReading(item(), reading({ readAt: ago(SIX_HOURS_MS + 1) }), NOW)).toBe(true)
        expect(needsReading(item({ value: { amount: 3, currency: 'USD' } }), undefined, NOW)).toBe(false)
        expect(needsReading(item(), { kind: 'not_found', readAt: ago(1000) }, NOW)).toBe(false) // "no CD edition" is believed for six hours too
    })
})

describe('what is said on the card', () => {
    it('the label follows the status', () => {
        expect(valueLabel(item({ owned: true }))).toBe('In my collection · worth')
        expect(valueLabel(item({ owned: null }))).toBe('Not mine yet · costs')
        expect(valueLabel(item({ owned: false }))).toBe('Not mine yet · costs')
    })

    it('each reason has its words, and each failure says what happened (REQ-13)', () => {
        const said = (value) => noValueText({ origin: null, ...value })
        expect(said({ reason: NoValue.NEVER_READ })).toBe('No value yet')
        expect(said({ reason: NoValue.SOURCE_OFF })).toBe('No value yet')
        expect(said({ reason: NoValue.WAITING })).toBe('Waiting for a value')
        expect(said({ reason: NoValue.READING })).toBe('Reading…')
        expect(said({ reason: NoValue.NO_CD_EDITION })).toBe('No CD edition found')
        expect(said({ reason: NoValue.NO_SUGGESTION })).toBe('No price suggested on Discogs')
        expect(said({ reason: NoValue.FAILED, failure: 'no_answer' })).toBe('Discogs did not answer')
        expect(said({ reason: NoValue.FAILED, failure: 'limit' })).toBe('Discogs limit reached')
        expect(said({ reason: NoValue.FAILED, failure: 'token_refused' })).toBe('Discogs refused the token')
        expect(said({ reason: NoValue.FAILED, failure: 'sign_in' })).toBe('Sign in to read values')
        expect(said({ reason: NoValue.FAILED, failure: 'something new' })).toBe('The value could not be read')
    })

    it('the fixed sentences', () => {
        expect(DISCOGS_CREDIT).toBe('Data provided by Discogs.')
        expect(RATES_MISSING_TEXT).toBe('Exchange rates are not available: values are shown in USD.')
    })
})

describe('currencies (REQ-08)', () => {
    it('converts through USD with the rates of the day', () => {
        expect(convert(10, 'USD', 'BRL', RATES)).toBeCloseTo(58.9, 5)
        expect(convert(58.9, 'BRL', 'USD', RATES)).toBeCloseTo(10, 5)
        expect(convert(9.1, 'EUR', 'GBP', RATES)).toBeCloseTo(7.6, 5)
        expect(convert(10, 'USD', 'USD', null)).toBe(10)
        expect(toUsd(7.6, 'GBP', RATES)).toBeCloseTo(10, 5)
    })

    it('with no rate that is needed there is no conversion, not a guess', () => {
        expect(convert(10, 'USD', 'BRL', null)).toBe(null)
        expect(convert(10, 'EUR', 'USD', { BRL: 5.89 })).toBe(null)
        expect(convert(NaN, 'USD', 'USD', RATES)).toBe(null)
    })

    it('the screen shows the chosen currency, or USD when it has no rate', () => {
        expect(shownCurrency('BRL', RATES)).toBe('BRL')
        expect(shownCurrency('BRL', null)).toBe('USD')
        expect(shownCurrency('USD', null)).toBe('USD')
        expect(shownCurrency('JPY', RATES)).toBe('USD')
        expect(shownCurrency(undefined, RATES)).toBe('USD')
    })

    it('money is written with the symbol and two decimals', () => {
        expect(formatMoney(12.3, 'USD')).toBe('$12.30')
        expect(formatMoney(1234.5, 'BRL')).toBe('R$ 1,234.50')
        expect(formatMoney(9, 'EUR')).toBe('€9.00')
        expect(formatMoney(9, 'GBP')).toBe('£9.00')
    })

    it('a value is written in the shown currency; in its own when it cannot be converted', () => {
        expect(moneyOf({ amount: 10, currency: 'USD' }, { currency: 'BRL', rates: RATES })).toBe('R$ 58.90')
        expect(moneyOf({ amount: 10, currency: 'EUR' }, { currency: 'USD', rates: null })).toBe('€10.00')
    })

    it('the rate used is said', () => {
        expect(rateNote('BRL', RATES)).toBe("Converted from USD at today's rate (1 USD = 5.89 BRL).")
    })
})

describe('the value the person writes (REQ-03)', () => {
    it('reads a number with a dot or a comma, and refuses what is not an amount above zero', () => {
        expect(parseAmount('12.50')).toBe(12.5)
        expect(parseAmount('12,50')).toBe(12.5)
        expect(parseAmount('R$ 1,234.56')).toBe(1234.56)
        expect(parseAmount('  7 ')).toBe(7)
        expect(parseAmount('')).toBe(null)
        expect(parseAmount('abc')).toBe(null)
        expect(parseAmount('0')).toBe(null)
        expect(parseAmount('-5')).toBe(5) // the sign is not part of an amount: what is kept is 5
    })

    it('is kept in USD, with when it was written; typed in another currency, it is converted', () => {
        const at = '2026-11-20T12:00:00.000Z'
        expect(writtenValueFrom('25', { currency: 'USD', rates: null }, at)).toEqual({ amount: 25, currency: 'USD', at })
        expect(writtenValueFrom('58,90', { currency: 'BRL', rates: RATES }, at)).toEqual({ amount: 10, currency: 'USD', at })
        expect(writtenValueFrom('nothing', { currency: 'USD', rates: null }, at)).toBe(null)
    })
})

describe('the two totals (REQ-07)', () => {
    const items = [
        item({ id: 'a', owned: true, value: { amount: 25, currency: 'USD' } }),
        item({ id: 'b', owned: true }),
        item({ id: 'c', owned: null }),
        item({ id: 'd', owned: false }),
        item({ id: 'e', owned: null })
    ]
    const readings = new Map([['b', reading()], ['c', reading({ currency: 'EUR', conditions: { mint: 9.1, nearMint: 9.1, veryGoodPlus: 9.1 } })], ['e', { kind: 'not_found', readAt: ago(1000) }]])
    const valueFor = (one) => valueOfItem(one, on({ reading: readings.get(one.id) }))

    it('what is Owned on one side, what is Not Owned or on the Wishlist on the other, each with how many have a value', () => {
        const totals = totalsOf(items, valueFor, RATES)

        expect(totals.owned).toEqual({ sum: 37, valued: 2, total: 2 })
        expect(totals.toBuy.valued).toBe(1)
        expect(totals.toBuy.total).toBe(3)
        expect(totals.toBuy.sum).toBeCloseTo(10, 5) // 9.10 EUR is 10 USD
        expect(ownedNote(totals.owned)).toBe('2 of 2 owned albums have a value')
        expect(toBuyNote(totals.toBuy)).toBe('1 of 3 albums have a value')
    })

    it('a value in a currency with no rate today adds to no total, and is not counted as having a value', () => {
        expect(totalsOf(items, valueFor, null).toBuy).toEqual({ sum: 0, valued: 0, total: 3 })
    })

    it('how many values on the screen came from Discogs', () => {
        const values = new Map(items.map(one => [one.id, valueFor(one)]))
        expect(itemsWithDiscogsValue(values)).toBe(2)
    })
})

describe('the order by value (REQ-12)', () => {
    const items = () => [
        { id: 'cheap', artist: 'B', title: 'Cheap', value: { amount: 5, currency: 'USD' } },
        { id: 'none', artist: 'A', title: 'None' },
        { id: 'dear', artist: 'C', title: 'Dear', value: { amount: 50, currency: 'USD' } },
        { id: 'none-too', artist: 'D', title: 'None too' }
    ]
    const context = { valueOf: (one) => usdOf(valueOfItem(one, { now: NOW, source: 'off' }), null) }
    const ids = (value) => sortInventory(items(), sortingFor(value), context).map(one => one.id)

    it('the dearest first, or the cheapest first; the item with no value comes last in both', () => {
        expect(ids('value')).toEqual(['dear', 'cheap', 'none', 'none-too'])
        expect(ids('value_asc')).toEqual(['cheap', 'dear', 'none', 'none-too'])
    })

    it('with nobody to say the values, every item is "no value" and the order is by artist', () => {
        expect(sortInventory(items(), sortingFor('value')).map(one => one.id)).toEqual(['none', 'cheap', 'dear', 'none-too'])
    })
})
