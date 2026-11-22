/**
 * F75, the judge's second recheck (P2-3): the phone's «⋯» sheet of an album names each kind of Discogs
 * value for what it is: a lowest asking price is never a «Mean of…» (the card and the window already
 * said so). The sheet also says when the reading was made.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { openItemSheet } from '../../public/js/views/InventoryPhoneSheets.js'
import { ValueBasis, ValueOrigin } from '../../public/js/models/inventoryValue.js'

const money = { currency: 'USD', rates: null }
const RELEASE = { id: 1, title: 'RCA 1987, UK', url: 'https://www.discogs.com/release/1' }
const discogs = (extra = {}) => ({ origin: ValueOrigin.DISCOGS, amount: 12.93, currency: 'USD', release: RELEASE, readAt: '2026-11-18T14:05:00.000Z', ...extra })
const text = (node) => node.textContent.replace(/\s+/g, ' ').trim()
const open = (value) => openItemSheet({ id: 'a', title: 'Hejira', artist: 'Joni Mitchell', owned: true }, { value, money }, { view() { }, edit() { }, remove() { } })

describe('the «⋯» sheet of an album on the phone: what kind of Discogs value this is', () => {
    afterEach(() => { document.body.innerHTML = '' })

    it('a lowest asking price says so, and is never called a mean', () => {
        open(discogs({ basis: ValueBasis.LOWEST_FOR_SALE, forSale: 37 }))
        const sheet = text(document.querySelector('#inventoryItemSheet') || document.body)

        expect(sheet).toContain('Lowest asking price for this CD edition on Discogs.')
        expect(sheet).not.toContain('Mean of')
        expect(sheet).toMatch(/Read on 18 Nov 2026, \d{2}:\d{2}\./)
    })

    it('a suggested price keeps its words: the mean of the three conditions', () => {
        open(discogs({ conditions: { mint: 15, nearMint: 12, veryGoodPlus: 9 } }))
        expect(text(document.body)).toContain('Mean of Mint, Near Mint and Very Good Plus on Discogs, for the most common CD edition.')
    })
})
