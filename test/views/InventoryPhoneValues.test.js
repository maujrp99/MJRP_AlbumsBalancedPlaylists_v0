/**
 * F76, recheck N2: the values of the inventory on the phone take two short rows, so the list shows
 * on the first screen. «Data provided by Discogs.» stays beside the values (a term of use); the
 * seller-settings notice leaves the flow for a sheet opened by «Lowest asking prices · Why?».
 */
import { describe, it, expect, afterEach } from 'vitest'
import { phoneValuesDetails, renderPhoneNotices, renderPhoneTotals } from '../../public/js/views/renderers/InventoryValueHeader.js'
import { openValuesSheet } from '../../public/js/views/InventoryPhoneSheets.js'

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

const draw = (html) => {
    const host = document.createElement('div')
    host.innerHTML = html
    document.body.appendChild(host)
    return host
}
const text = (node) => node.textContent.replace(/\s+/g, ' ').trim()

describe('the values of the inventory on the phone (F76, recheck N2)', () => {
    afterEach(() => { document.body.innerHTML = '' })

    it('writes the two totals in one line each, the currency as the phone segmented control', () => {
        const host = draw(renderPhoneTotals(known()))
        expect(text(host.querySelector('[data-total="owned"]'))).toBe('Owned $1,948.36')
        expect(text(host.querySelector('[data-total="to-buy"]'))).toBe('To buy $611.32')
        const currency = host.querySelector('#currencySelector.phone-segmented')
        expect([...currency.querySelectorAll('[data-currency]')].map(b => b.className)).toEqual([
            'phone-segmented__option is-on', 'phone-segmented__option', 'phone-segmented__option', 'phone-segmented__option'
        ])
    })

    it('keeps «Data provided by Discogs.» beside the values, and puts the long notice behind «Why?»', () => {
        const host = draw(renderPhoneTotals(known()))
        const credit = host.querySelector('[data-role="discogs-credit"]')
        expect(text(credit)).toBe('Data provided by Discogs.')
        expect(credit.getAttribute('href')).toBe('https://www.discogs.com/')
        expect(text(host.querySelector('[data-values-about]'))).toBe('Lowest asking prices · Why?')
        expect(host.textContent).not.toContain('seller settings')
        expect(renderPhoneNotices(known())).not.toContain('seller settings')
    })

    it('says «About the values» when the account has its seller settings, and no credit with Discogs off', () => {
        expect(text(draw(renderPhoneTotals(known({ sellerSettingsMissing: false }))).querySelector('[data-values-about]'))).toBe('About the values')
        expect(draw(renderPhoneTotals(known({ discogsShown: false }))).querySelector('[data-role="discogs-credit"]')).toBe(null)
    })

    it('gives the albums waiting one line and its button; nothing with the source off', () => {
        const host = draw(renderPhoneNotices(known()))
        expect(text(host.querySelector('#valuesWaitingNotice .inv-notice__text'))).toBe('39 albums are waiting for a value.')
        expect(host.querySelector('[data-notice-action="read-values"]').textContent).toBe('Read them now')
        expect(renderPhoneNotices(known({ source: 'off' }))).toBe('')
    })

    it('the «Why?» sheet has the totals with their counts, the seller sentence with its link, and the credit', () => {
        window.matchMedia = () => ({ matches: true, addEventListener() { }, removeEventListener() { } })
        window.scrollTo = () => { }
        const sheet = openValuesSheet(phoneValuesDetails(known({ money: { currency: 'BRL', rates: { BRL: 5.89 }, ratesMissing: false } })))
        const body = text(sheet.element)
        expect(body).toContain('Why lowest asking prices?')
        expect(body).toContain('130 of 160 owned albums have a value')
        expect(body).toContain('42 of 51 albums have a value')
        expect(body).toContain('1 USD = 5.89 BRL')
        expect(body).toContain('Discogs suggests prices only to accounts with seller settings filled in.')
        expect(sheet.element.querySelector('a[href="https://www.discogs.com/settings/seller"]')).not.toBe(null)
        expect(sheet.element.querySelector('a[href="https://www.discogs.com/"]').textContent).toBe('Data provided by Discogs.')
        sheet.close()
        delete window.matchMedia
    })
})
