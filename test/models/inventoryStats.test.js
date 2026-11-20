/**
 * F58 (UAT-18) - the numbers of the inventory, as a pure rule: how many albums, owned and
 * wished for, by format, and what they cost in each currency.
 */
import { describe, it, expect } from 'vitest'
import { inventoryStatistics } from '../../public/js/models/inventoryStats.js'

describe('inventoryStatistics', () => {
    it('an empty inventory is all zeros, with the known formats listed', () => {
        expect(inventoryStatistics([])).toEqual({
            totalAlbums: 0,
            ownedCount: 0,
            notOwnedCount: 0,
            wishlistCount: 0,
            byFormat: { cd: 0, vinyl: 0, dvd: 0, bluray: 0, digital: 0 },
            totalValueUSD: 0,
            totalValueBRL: 0,
            ownedValueUSD: 0,
            ownedValueBRL: 0,
            averagePriceUSD: 0,
            averagePriceBRL: 0
        })
    })

    it('only `owned: true` is owned and only `owned: false` is wished for; anything else is neither', () => {
        const stats = inventoryStatistics([{ owned: true }, { owned: false }, { owned: null }, {}, { owned: 'yes' }])

        expect(stats.totalAlbums).toBe(5)
        expect(stats.ownedCount).toBe(1)
        expect(stats.wishlistCount).toBe(1)
        expect(stats.notOwnedCount).toBe(3)
    })

    it('counts by format, a format it does not know included; an album with no format is in none', () => {
        const stats = inventoryStatistics([{ format: 'cd' }, { format: 'cd' }, { format: 'cassette' }, {}])

        expect(stats.byFormat).toEqual({ cd: 2, vinyl: 0, dvd: 0, bluray: 0, digital: 0, cassette: 1 })
    })

    it('adds the prices by currency, and the owned ones apart; no currency means USD', () => {
        const stats = inventoryStatistics([
            { purchasePrice: 10, currency: 'USD', owned: true },
            { purchasePrice: '20', owned: false },
            { purchasePrice: 50, currency: 'BRL', owned: true },
            { purchasePrice: 30, currency: 'BRL' }
        ])

        expect(stats.totalValueUSD).toBe(30)
        expect(stats.ownedValueUSD).toBe(10)
        expect(stats.averagePriceUSD).toBe(15)
        expect(stats.totalValueBRL).toBe(80)
        expect(stats.ownedValueBRL).toBe(50)
        expect(stats.averagePriceBRL).toBe(40)
    })

    it('a price that is missing, zero or not a number, and a currency it does not know, add nothing', () => {
        const stats = inventoryStatistics([
            { purchasePrice: 0, currency: 'USD' },
            { purchasePrice: 'abc', currency: 'USD' },
            { currency: 'USD' },
            { purchasePrice: 99, currency: 'EUR' }
        ])

        expect(stats.totalValueUSD).toBe(0)
        expect(stats.totalValueBRL).toBe(0)
        expect(stats.averagePriceUSD).toBe(0)
    })
})
