/**
 * F76, recheck N2 and F75, the judge's second recheck (P2-3): the values of the inventory on the phone take two short rows, so the list shows on the first
 * screen. «Data provided by Discogs.» stays beside the values (a term of use); the seller-settings notice leaves the flow for a sheet opened by «Lowest
 * asking prices · Why?». The phone's «⋯» sheet of an album names each kind of Discogs value for what it is: a lowest asking price is never a «Mean
 * of…» (the card and the window already said so), and the sheet also says when the reading was made. (The two files of the hand-made screen,
 * InventoryPhoneValues.test.js and InventoryPhoneItemSheet.test.js, carried over: the assertions are the same; the pieces are drawn by React now.)
 */
import { describe, it, expect, afterEach } from 'vitest'
import { PhoneNotices } from '../../../public/js/screens/inventory/Notices'
import { PhoneTotals as Totals } from '../../../public/js/screens/inventory/Totals'
import { InventoryBridge } from '../../../public/js/screens/inventory/InventoryBridge'
import { usePhoneSheets } from '../../../public/js/screens/inventory/phone/Sheets'
import { ValueBasis, ValueOrigin } from '../../../public/js/models/inventoryValue.js'
import { draw, press, undraw } from '../../support/inventoryHost'

const known = (over = {}) => ({
    source: 'on',
    totals: { owned: { sum: 1948.36, valued: 130, total: 160 }, toBuy: { sum: 611.32, valued: 42, total: 51 } },
    money: { currency: 'USD', rates: { USD: 1, EUR: 0.91, GBP: 0.76, BRL: 5.89 }, ratesMissing: false },
    discogsShown: true,
    lowestShown: true,
    sellerSettingsMissing: true,
    run: { busy: false },
    waiting: 39,
    ...over
})

const text = (node: Element) => (node.textContent || '').replace(/\s+/g, ' ').trim()
const none = () => { }
const controllerOf = (state: object, valueViewOf?: () => object) => ({ state, valueViewOf, handleCurrencyChoice: none, handleStopValues: none, handleUpdateValues: none }) as never
const totals = (over = {}) => draw(<Totals known={known(over) as never} controller={controllerOf({})} onAbout={none} />)
const notices = (over = {}) => draw(<PhoneNotices known={known(over) as never} controller={controllerOf({})} />)

/** A piece that opens one of the sheets of the phone when its button is pressed. */
function SheetHost({ controller, open }: { controller: never; open: 'openItem' | 'openValues' }) {
    const sheets = usePhoneSheets(controller, new InventoryBridge())
    return <><button id="open" type="button" onClick={() => (open === 'openItem' ? sheets.openItem('a') : sheets.openValues())}>open</button>{sheets.layer}</>
}

describe('the values of the inventory on the phone (F76, recheck N2)', () => {
    afterEach(async () => { await undraw(); document.querySelectorAll('.sheet').forEach(node => node.remove()) })

    it('writes the two totals in one line each, the currency as the phone segmented control', async () => {
        const host = await totals()
        expect(text(host.querySelector('[data-total="owned"]')!)).toBe('Owned $1,948.36')
        expect(text(host.querySelector('[data-total="to-buy"]')!)).toBe('To buy $611.32')
        const currency = host.querySelector('#currencySelector.phone-segmented')!
        expect([...currency.querySelectorAll('[data-currency]')].map(b => b.className)).toEqual([
            'phone-segmented__option is-on', 'phone-segmented__option', 'phone-segmented__option', 'phone-segmented__option'
        ])
    })

    it('keeps «Data provided by Discogs.» beside the values, and puts the long notice behind «Why?»', async () => {
        const host = await totals()
        const credit = host.querySelector('[data-role="discogs-credit"]')!
        expect(text(credit)).toBe('Data provided by Discogs.')
        expect(credit.getAttribute('href')).toBe('https://www.discogs.com/')
        expect(text(host.querySelector('[data-values-about]')!)).toBe('Lowest asking prices · Why?')
        expect(host.textContent).not.toContain('seller settings')
        expect((await notices()).textContent).not.toContain('seller settings')
    })

    it('says «About the values» when the account has its seller settings, and no credit with Discogs off', async () => {
        expect(text((await totals({ sellerSettingsMissing: false })).querySelector('[data-values-about]')!)).toBe('About the values')
        expect((await totals({ discogsShown: false })).querySelector('[data-role="discogs-credit"]')).toBe(null)
    })

    it('gives the albums waiting one line and its button; nothing with the source off', async () => {
        const host = await notices()
        expect(text(host.querySelector('#valuesWaitingNotice .inv-notice__text')!)).toBe('39 albums are waiting for a value.')
        expect(host.querySelector('[data-notice-action="read-values"]')!.textContent).toBe('Read them now')
        expect((await notices({ source: 'off' })).innerHTML).toBe('')
    })

    it('the «Why?» sheet has the totals with their counts, the seller sentence with its link, and the credit', async () => {
        window.matchMedia = (() => ({ matches: true, addEventListener() { }, removeEventListener() { } })) as never
        window.scrollTo = () => { }
        const state = { value: known({ money: { currency: 'BRL', rates: { BRL: 5.89 }, ratesMissing: false } }) }
        await draw(<SheetHost controller={controllerOf(state)} open="openValues" />)
        await press(document.getElementById('open')!)
        const sheet = document.querySelector('.sheet')!
        const body = text(sheet)
        expect(body).toContain('Why lowest asking prices?')
        expect(body).toContain('130 of 160 owned albums have a value')
        expect(body).toContain('42 of 51 albums have a value')
        expect(body).toContain('1 USD = 5.89 BRL')
        expect(body).toContain('Discogs suggests prices only to accounts with seller settings filled in.')
        expect(sheet.querySelector('a[href="https://www.discogs.com/settings/seller"]')).not.toBe(null)
        expect(sheet.querySelector('a[href="https://www.discogs.com/"]')!.textContent).toBe('Data provided by Discogs.')
    })
})

const money = { currency: 'USD', rates: null }
const RELEASE = { id: 1, title: 'RCA 1987, UK', url: 'https://www.discogs.com/release/1' }
const discogs = (extra = {}) => ({ origin: ValueOrigin.DISCOGS, amount: 12.93, currency: 'USD', release: RELEASE, readAt: '2026-11-18T14:05:00.000Z', ...extra })

describe('the «⋯» sheet of an album on the phone: what kind of Discogs value this is', () => {
    afterEach(async () => { await undraw(); document.querySelectorAll('.sheet').forEach(node => node.remove()) })

    const open = async (value: object) => {
        window.matchMedia = (() => ({ matches: true, addEventListener() { }, removeEventListener() { } })) as never
        window.scrollTo = () => { }
        const item = { id: 'a', title: 'Hejira', artist: 'Joni Mitchell', owned: true }
        await draw(<SheetHost controller={controllerOf({ albums: [item], value: known() }, () => ({ value, money }))} open="openItem" />)
        await press(document.getElementById('open')!)
        return text(document.querySelector('#inventoryItemSheet') || document.body)
    }

    it('a lowest asking price says so, and is never called a mean', async () => {
        const sheet = await open(discogs({ basis: ValueBasis.LOWEST_FOR_SALE, forSale: 37 }))

        expect(sheet).toContain('Lowest asking price for this CD edition on Discogs.')
        expect(sheet).not.toContain('Mean of')
        expect(sheet).toMatch(/Read on 18 Nov 2026, \d{2}:\d{2}\./)
    })

    it('a suggested price keeps its words: the mean of the three conditions', async () => {
        const sheet = await open(discogs({ conditions: { mint: 15, nearMint: 12, veryGoodPlus: 9 } }))
        expect(sheet).toContain('Mean of Mint, Near Mint and Very Good Plus on Discogs, for the most common CD edition.')
    })
})
