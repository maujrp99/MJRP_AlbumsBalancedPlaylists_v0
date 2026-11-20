/**
 * The value service of the inventory (F75) as a double, for the tests of the screen and of its
 * controller: no network, no browser cache.
 *
 *   valuesOff()               the Discogs values are off and no rates came: what the tests of the
 *                             rest of the inventory need
 *   valuesWith({ ... })       the switch, the rates and the readings a test wants
 */
import { vi } from 'vitest'

export const RATES = Object.freeze({ rates: { USD: 1, EUR: 0.91, GBP: 0.76, BRL: 5.89 }, date: '2026-11-19' })

export function valuesWith({ source = 'on', rates = RATES, readings = new Map() } = {}) {
    return {
        sourceState: vi.fn(async () => source),
        rates: vi.fn(async () => rates),
        readingsOf: vi.fn(async (items) => new Map(items.filter(item => readings.has(item.id)).map(item => [item.id, readings.get(item.id)]))),
        readItem: vi.fn(async () => ({ failure: 'other', waitMs: null, stops: false })),
        readMany: vi.fn(async (items) => ({ total: items.length, done: 0, read: 0, noEdition: 0, noSuggestion: 0, failed: {}, stopped: null, aborted: false })),
        keepEditions: vi.fn(async () => { })
    }
}

export const valuesOff = () => valuesWith({ source: 'off', rates: null })

/** A reading of Discogs as the browser keeps it. */
export const reading = ({ mint = 14.5, nearMint = 11.2, veryGoodPlus = 7.9, currency = 'USD', readAt = new Date().toISOString(), id = 5012948 } = {}) => ({
    kind: 'found',
    release: { id, title: 'Harvest 1984, Europe', url: `https://www.discogs.com/release/${id}` },
    conditions: { mint, nearMint, veryGoodPlus },
    currency,
    readAt
})
