/**
 * F75 (S-57) - what an album of the inventory is worth, as pure rules: the value the person wrote
 * wins; else a Discogs reading less than six hours old; else none, with the reason. The totals,
 * the currencies and what is said.
 */
import { describe, it, expect, afterEach } from 'vitest'
import {
    SIX_HOURS_MS, NoValue, ValueOrigin, valueOfItem, isFresh, needsReading, meanOfConditions, convert, toUsd, shownCurrency,
    formatMoney, roundToCents, moneyOf, parseAmount, writtenValueFrom, totalsOf, usdOf, noValueText, valueLabel, ownedNote, toBuyNote, rateNote,
    itemsWithDiscogsValue, RATES_MISSING_TEXT, DISCOGS_CREDIT, newestReading, neverRead, needsKeeping
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

    it('a reading is shown whatever its age, with the date it was read; six hours is only the guard of the browser (REQ-14)', () => {
        const old = reading({ readAt: ago(30 * 24 * 60 * 60 * 1000) })

        expect(valueOfItem(item(), on({ reading: old }))).toMatchObject({ origin: ValueOrigin.DISCOGS, amount: 12, readAt: old.readAt })
        expect(isFresh(reading({ readAt: ago(SIX_HOURS_MS - 1000) }), NOW)).toBe(true)
        expect(isFresh(reading({ readAt: ago(SIX_HOURS_MS) }), NOW)).toBe(false)
        expect(isFresh({ readAt: 'never' }, NOW)).toBe(false)
        expect(isFresh({ readAt: new Date(NOW + 60000).toISOString() }, NOW)).toBe(false) // a time in the future says nothing of the age
        expect(isFresh(null, NOW)).toBe(false)
    })

    it('the reading kept in the item shows with its date, with no reading in the browser (REQ-14)', () => {
        const kept = item({ discogsReading: reading({ readAt: ago(3 * 24 * 60 * 60 * 1000), source: 'discogs' }) })

        expect(valueOfItem(kept, on())).toMatchObject({ origin: ValueOrigin.DISCOGS, amount: 12, readAt: kept.discogsReading.readAt })
        // it shows while the switch is not known yet too (at once); only a switch that is off hides it
        expect(valueOfItem(kept, { now: NOW, source: null }).origin).toBe('discogs')
        expect(valueOfItem(kept, { now: NOW, source: 'off' })).toEqual({ origin: null, reason: NoValue.SOURCE_OFF })
    })

    it('the newest reading wins between the one kept in the item and the one in the browser; the written value beats both', () => {
        const kept = reading({ readAt: ago(2 * 60 * 60 * 1000), conditions: { mint: 30, nearMint: 30, veryGoodPlus: 30 } })
        const browser = reading({ readAt: ago(60 * 1000) })

        expect(valueOfItem(item({ discogsReading: kept }), on({ reading: browser })).amount).toBe(12)
        expect(valueOfItem(item({ discogsReading: browser }), on({ reading: kept })).amount).toBe(12)
        expect(newestReading(kept, browser)).toBe(browser)
        expect(newestReading(null, kept)).toBe(kept)
        expect(newestReading({ readAt: 'bad' }, kept)).toBe(kept)
        expect(newestReading(null, null)).toBe(null)
        expect(valueOfItem(item({ discogsReading: kept, value: { amount: 25, currency: 'USD' } }), on({ reading: browser })).origin).toBe('yours')
    })

    it('with the source off nothing of Discogs is shown, a reading included (REQ-10)', () => {
        expect(valueOfItem(item(), { now: NOW, source: 'off', reading: reading() })).toEqual({ origin: null, reason: NoValue.SOURCE_OFF })
        expect(valueOfItem(item(), { now: NOW, source: null })).toEqual({ origin: null, reason: NoValue.NEVER_READ })
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

    it('what a run has to read: no written value, and no reading younger than six hours (the guard)', () => {
        expect(needsReading(item(), undefined, NOW)).toBe(true)
        expect(needsReading(item(), reading(), NOW)).toBe(false)
        expect(needsReading(item(), reading({ readAt: ago(SIX_HOURS_MS + 1) }), NOW)).toBe(true) // an update reads it again
        expect(needsReading(item({ value: { amount: 3, currency: 'USD' } }), undefined, NOW)).toBe(false)
        expect(needsReading(item(), { kind: 'not_found', readAt: ago(1000) }, NOW)).toBe(false)
        expect(needsReading(item({ discogsReading: reading({ readAt: ago(1000) }) }), undefined, NOW)).toBe(false) // read minutes ago on another device
    })

    it('what is waiting: only an item that never had a reading, in the item or in the browser (REQ-14)', () => {
        const old = reading({ readAt: ago(40 * 24 * 60 * 60 * 1000) })

        expect(neverRead(item(), undefined)).toBe(true)
        expect(neverRead(item({ discogsReading: old }), undefined)).toBe(false)
        expect(neverRead(item(), old)).toBe(false)
        expect(neverRead(item({ discogsReading: { kind: 'not_found', readAt: ago(1000) } }), undefined)).toBe(false)
        expect(neverRead(item({ value: { amount: 3, currency: 'USD' } }), undefined)).toBe(false)
    })

    it('a reading only the browser has, or has newer, is what the next run saves to the item without asking Discogs', () => {
        const fresh = reading({ readAt: ago(60 * 1000) })
        const older = reading({ readAt: ago(60 * 60 * 1000) })

        expect(needsKeeping(item(), fresh)).toBe(true)
        expect(needsKeeping(item({ discogsReading: older }), fresh)).toBe(true)
        expect(needsKeeping(item({ discogsReading: fresh }), older)).toBe(false)
        expect(needsKeeping(item({ discogsReading: fresh }), fresh)).toBe(false)
        expect(needsKeeping(item(), undefined)).toBe(false)
        expect(needsKeeping(item({ value: { amount: 3, currency: 'USD' } }), fresh)).toBe(true) // the reading is kept; the value written still wins on the screen
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

    describe('money is rounded to cents before any formatter sees it (F78: engines round the half differently)', () => {
        // The phone's engine (Hermes) rounds a half to even when it formats: 1166.505 gave «1,166.50»
        // there and «1,166.51» on Node and in the browsers (spike S1). This stand-in formats as Hermes
        // did, so the test fails on code that hands the formatter more than two decimals.
        const original = Number.prototype.toLocaleString
        const halfToEven = function (...args) {
            const tie = /^(\d+)\.(\d\d)5$/.exec(String(this))
            if (tie && Number(tie[2]) % 2 === 0) return original.call(Number(`${tie[1]}.${tie[2]}`), ...args)
            return original.call(this, ...args)
        }
        afterEach(() => { Number.prototype.toLocaleString = original })

        it('the rule: half away from zero, on the amount as its shortest decimal text', () => {
            expect(roundToCents(1166.505)).toBe(1166.51)
            expect(roundToCents(1.005)).toBe(1.01) // 1.005 * 100 is 100.49999…: rounding the product would give 1.00
            expect(roundToCents(2.675)).toBe(2.68)
            expect(roundToCents(12.3)).toBe(12.3)
            expect(roundToCents(-1.005)).toBe(-1.01)
            expect(roundToCents(0)).toBe(0)
            expect(roundToCents(1e-7)).toBe(0)
            expect(roundToCents(123456789.125)).toBe(123456789.13)
        })

        it('1166.505 is written «$1,166.51» on an engine that rounds the half to even, as on Node', () => {
            expect(formatMoney(1166.505, 'USD')).toBe('$1,166.51')
            Number.prototype.toLocaleString = halfToEven
            expect(formatMoney(1166.505, 'USD')).toBe('$1,166.51')
            expect(formatMoney(2.125, 'EUR')).toBe('€2.13')
        })

        it('a converted value too: the product of a rate is rounded before it is written', () => {
            Number.prototype.toLocaleString = halfToEven
            expect(moneyOf({ amount: 583.2525, currency: 'USD' }, { currency: 'BRL', rates: { USD: 1, BRL: 2 } })).toBe('R$ 1,166.51')
        })
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
