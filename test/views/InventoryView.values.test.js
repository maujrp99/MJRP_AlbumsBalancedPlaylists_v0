/**
 * F75 (S-57) - the inventory screen as the person sees it with the values: the card of the
 * prototype v5.1 (five lines, the same in every card), the totals and the currency, the notices,
 * "Update values", where to buy, the album window, the switch off, and what the Discogs terms ask
 * to be said.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { valuesWith, reading, RATES } from '../helpers/inventoryValuesStub.js'

const holder = vi.hoisted(() => ({ values: null }))
const service = vi.hoisted(() => ({ updateAlbum: vi.fn(async () => 'id'), albumOfItem: vi.fn(async () => null) }))
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }))

vi.mock('../../public/js/services/inventory/inventoryWiring.js', () => ({ inventoryService: service, readSeriesOfThePerson: vi.fn() }))
vi.mock('../../public/js/services/inventory/inventoryValueWiring.js', () => ({
    inventoryValues: new Proxy({}, { get: (_, name) => holder.values[name] })
}))
vi.mock('../../public/js/services/OptimizedAlbumLoader.js', () => ({ optimizedAlbumLoader: { load: vi.fn(async () => { }) } }))
vi.mock('../../public/js/components/Toast.js', () => ({ default: toast, toast }))
vi.mock('../../public/js/services/DialogService.js', () => ({ dialogService: { confirm: vi.fn() } }))

import { InventoryView } from '../../public/js/views/InventoryView.js'
import { InventoryGridRenderer } from '../../public/js/views/renderers/InventoryGridRenderer.js'
import { Footer, DISCOGS_NOTICE } from '../../public/js/components/Footer.js'
import { inventoryStore } from '../../public/js/stores/inventory.js'

const averages = { rating: 88.2, popularity: 71.4, ratedTracks: 10, popTracks: 9, tracks: 12 }
const owned = { id: 'owned', artist: 'Pink Floyd', title: 'The Dark Side of the Moon', owned: true, averages, albumData: { id: 'pf-dsotm', title: 'The Dark Side of the Moon', artist: 'Pink Floyd' } }
const written = { id: 'written', artist: 'Radiohead', title: 'OK Computer', owned: true, value: { amount: 25, currency: 'USD', at: '2026-10-12T10:00:00.000Z' }, albumData: { id: 'rh-okc', title: 'OK Computer', artist: 'Radiohead' } }
const wanted = { id: 'wanted', artist: 'Joni Mitchell', title: 'Hejira <b>', owned: null, albumData: { id: 'jm-hejira', title: 'Hejira <b>', artist: 'Joni Mitchell' } }
const wished = { id: 'wished', artist: 'Yes', title: 'Fragile', owned: false, albumData: { id: 'yes-fragile', title: 'Fragile', artist: 'Yes' } }
const ITEMS = [owned, written, wanted, wished]

const text = (node) => node.textContent.replace(/\s+/g, ' ').trim()
const card = (id) => document.querySelector(`.inventory-card-wrapper[data-album-id="${id}"]`)
const lines = (id) => [...card(id).querySelectorAll('[data-line]')]
const line = (id, number) => card(id).querySelector(`[data-line="${number}"]`)
const total = (name) => document.querySelector(`#inventoryTotals [data-total="${name}"]`)

describe('the inventory screen: values (F75)', () => {
    let view

    async function open(values, items = ITEMS) {
        holder.values = values
        const footer = new Footer({ clearCaches: vi.fn() })
        document.body.innerHTML = `<div id="app"></div>${footer.render()}`
        inventoryStore.setAlbums(items)
        view = new InventoryView()
        await view.mount()
        await view.controller.valuesOpened
        return view
    }
    const READINGS = () => new Map([['owned', reading()], ['wanted', reading({ mint: 9, nearMint: 6, veryGoodPlus: 3, id: 18418450 })]])

    beforeEach(() => {
        vi.clearAllMocks()
        localStorage.clear()
    })
    afterEach(() => {
        view?.destroy()
        document.querySelectorAll('.modal-overlay').forEach(node => node.remove())
        inventoryStore.reset()
        document.body.innerHTML = ''
    })

    describe('the card (REQ-01)', () => {
        beforeEach(() => open(valuesWith({ readings: READINGS() })))

        it('every card has the same five lines, whatever it knows: owned with a value, not owned with none', () => {
            const counts = ITEMS.map(item => lines(item.id).map(one => one.dataset.line))

            counts.forEach(numbers => expect(numbers).toEqual(['1', '2', '3', '4', '5']))
            expect(lines('owned')).toHaveLength(lines('wished').length)
        })

        it('line 1 is the label of the value, by status', () => {
            expect(text(line('owned', 1))).toBe('In my collection · worth')
            expect(text(line('wanted', 1))).toBe('Not mine yet · costs')
            expect(text(line('wished', 1))).toBe('Not mine yet · costs')
        })

        it('line 2 says where the value comes from, and the value with «≈»; a dash when there is none', () => {
            expect(text(line('owned', 2))).toMatch(/^CD · Discogs · \d{1,2} [A-Z][a-z]{2} ≈ \$11\.20$/) // REQ-16: it says when it was read
            expect(text(line('written', 2))).toBe('CD · written by you ≈ $25.00')
            expect(text(line('wanted', 2))).toMatch(/^CD · Discogs · \d{1,2} [A-Z][a-z]{2} ≈ \$6\.00$/)
            expect(text(line('wished', 2))).toBe('Waiting for a value —')
        })

        it('line 3 is the two averages with their icons; empty, and still there, for an item never read', () => {
            expect(text(line('owned', 3))).toBe('Avg Rating88.2(10 of 12)Avg Pop71.4%(9 of 12)')
            expect(text(line('wished', 3))).toBe('')
        })

        it('lines 4 and 5: what is owned can be sold or traded one day (not yet) and opens its window to buy; the rest shows where to buy', () => {
            expect(text(line('owned', 4))).toBe('Sell, trade or buy')
            expect(text(line('owned', 5))).toBe('Sell·Trade·Where to buy')
            const soon = [...line('owned', 5).querySelectorAll('[aria-disabled="true"]')]
            expect(soon.map(text)).toEqual(['Sell', 'Trade'])
            expect(soon.every(one => one.title === 'Selling and trading between collectors: not in the app yet')).toBe(true)
            expect(line('owned', 5).querySelector('button[data-action="view-modal"]').dataset.id).toBe('owned')

            expect(text(line('wished', 4))).toBe('Where to buy')
            const stores = [...line('wished', 5).querySelectorAll('a')]
            expect(stores.map(text)).toEqual(['Discogs ↗', 'Amazon ↗', 'iMusic ↗'])
            expect(stores.map(link => link.href)).toEqual([
                'https://www.discogs.com/search/?q=Yes+Fragile&format_exact=CD&type=release',
                'https://www.amazon.com/s?k=Yes+Fragile+CD',
                'https://imusic.br.com/search?query=Yes+Fragile+CD'
            ])
            expect(stores.every(link => link.target === '_blank' && link.rel === 'noopener')).toBe(true)
        })

        it('nothing wraps: the lines that carry text are cut, with the whole text in the title', () => {
            const origin = line('written', 2).querySelector('span')
            expect(origin.className).toContain('truncate')
            expect(origin.className).toContain('whitespace-nowrap')
            expect(origin.title).toBe('CD · written by you')
            expect(line('owned', 1).className).toContain('truncate')
            expect(line('wished', 5).className).toContain('whitespace-nowrap')
            expect(card('wanted').querySelector('h3').title).toBe('Hejira <b>')
        })

        it('the card is a surface: its own background, a faint edge, the cover to the edges', () => {
            const surface = card('owned')
            expect(surface.style.background).toBe('rgb(21, 21, 26)')
            expect(surface.style.border).toContain('1px solid')
            expect(surface.className).toContain('overflow-hidden')
            const cover = surface.querySelector('.album-card-compact > div')
            expect(cover.style.borderRadius).toBe('0')
        })

        it('text from outside stays text, in the card and in the address of a store', () => {
            expect(card('wanted').querySelector('b')).toBe(null)
            expect(text(card('wanted'))).toContain('Hejira <b>')
            expect(new URL(card('wished').querySelector('a').href).searchParams.get('q')).toBe('Yes Fragile')
        })

        it('a value of Discogs on a card links to the page of its edition (REQ-06)', () => {
            const link = line('owned', 2).querySelector('a')
            expect(text(link)).toBe('Discogs')
            expect(link.href).toBe('https://www.discogs.com/release/5012948')
            expect(link.rel).not.toContain('nofollow')
            expect(link.title).toContain('Data provided by Discogs.')
        })

        it('following a link of a card opens no window', () => {
            line('wished', 5).querySelector('a').addEventListener('click', event => event.preventDefault())
            line('wished', 5).querySelector('a').click()
            expect(document.querySelector('.modal-overlay')).toBe(null)
        })

        it('draws 211 cards in one pass, each with its five lines', () => {
            const many = Array.from({ length: 211 }, (_, index) => ({ id: `i${index}`, artist: `Artist ${index}`, title: `Album ${index}`, owned: index % 3 === 0 ? true : null }))
            const started = performance.now()
            const html = InventoryGridRenderer.render({ filteredAlbums: many, viewMode: 'grid', isLoading: false, value: view.controller.values.view(many, many) })
            const took = performance.now() - started

            expect(html.match(/inventory-card-wrapper/g)).toHaveLength(211)
            expect(html.match(/data-line="5"/g)).toHaveLength(211)
            expect(took).toBeLessThan(2000)
        })
    })

    describe('the header (REQ-02, REQ-07, REQ-08)', () => {
        beforeEach(() => open(valuesWith({ readings: READINGS() })))

        it('the strip under the title has the two totals, each with how many albums have a value; «Total Owned» is gone', () => {
            expect(text(total('owned'))).toBe('Estimated value of what I own: $36.20 2 of 2 owned albums have a value')
            expect(text(total('to-buy'))).toBe('To buy the rest: $6.00 1 of 2 albums have a value')
            expect(text(document.getElementById('app'))).not.toContain('Total Owned')
            expect(document.getElementById('inventoryTotals').previousElementSibling.className).toContain('header-title-row')
        })

        it('four currencies, the chosen one pressed; choosing one converts the cards and the totals and says the rate', () => {
            const buttons = () => [...document.querySelectorAll('#currencySelector [data-currency]')]
            expect(buttons().map(button => [button.textContent, button.getAttribute('aria-pressed')])).toEqual([['USD', 'true'], ['EUR', 'false'], ['GBP', 'false'], ['BRL', 'false']])
            expect(document.querySelector('[data-role="rate"]')).toBe(null)

            buttons()[3].click()

            expect(text(line('written', 2))).toBe('CD · written by you ≈ R$ 147.25')
            expect(text(total('owned'))).toContain('R$ 213.22')
            expect(text(document.querySelector('[data-role="rate"]'))).toBe("Converted from USD at today's rate (1 USD = 5.89 BRL).")
            expect(buttons()[3].getAttribute('aria-pressed')).toBe('true')
            expect(localStorage.getItem('inventoryCurrency')).toBe('BRL')
        })

        it('while Discogs values are on cards the screen says, once, where the data comes from', () => {
            const credits = document.querySelectorAll('#inventoryTotals [data-role="discogs-credit"]')
            expect(credits).toHaveLength(1)
            expect(text(credits[0])).toContain('Data provided by Discogs.')
            expect(credits[0].querySelector('a').href).toBe('https://www.discogs.com/')
        })

        it('«Sort by» orders by value in the two directions, the item with no value last', () => {
            const select = document.getElementById('inventorySort')
            const shown = () => [...document.querySelectorAll('.inventory-card-wrapper')].map(one => one.dataset.albumId)
            expect([...select.options].map(option => option.textContent)).toEqual(expect.arrayContaining(['Value (↓)', 'Value (↑)']))

            select.value = 'value'
            select.dispatchEvent(new Event('change', { bubbles: true }))
            expect(shown()).toEqual(['written', 'owned', 'wanted', 'wished'])

            const again = document.getElementById('inventorySort')
            again.value = 'value_asc'
            again.dispatchEvent(new Event('change', { bubbles: true }))
            expect(shown()).toEqual(['wanted', 'owned', 'written', 'wished'])
        })
    })

    describe('the rates did not come (REQ-13)', () => {
        it('the screen is in USD, says why, and the other currencies cannot be chosen', async () => {
            await open(valuesWith({ rates: null, readings: READINGS() }))

            expect(text(document.querySelector('[data-role="rates-missing"]'))).toBe('Exchange rates are not available: values are shown in USD.')
            const buttons = [...document.querySelectorAll('#currencySelector [data-currency]')]
            expect(buttons.map(button => button.disabled)).toEqual([false, true, true, true])
            expect(text(line('written', 2))).toBe('CD · written by you ≈ $25.00')
        })
    })

    describe('the reading kept in the database (REQ-14, REQ-16)', () => {
        const KEPT_AT = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        const withKept = (item, extra = {}) => ({ ...item, discogsReading: { ...reading({ readAt: KEPT_AT }), ...extra } })
        const ITEMS_KEPT = [withKept(owned), written, withKept(wanted, { mint: 9, nearMint: 6, veryGoodPlus: 3 }), wished]
        const KEPT_DAY = new Date(KEPT_AT).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

        it('a new browser profile (nothing held) shows the kept value on the card, with the date it was read, and asks Discogs nothing', async () => {
            const values = valuesWith()
            await open(values, ITEMS_KEPT)

            expect(text(line('owned', 2))).toBe(`CD · Discogs · ${KEPT_DAY} ≈ $11.20`)
            expect(line('owned', 2).querySelector('span').title).toContain('Read on ')
            expect(line('owned', 2).querySelector('a').href).toBe('https://www.discogs.com/release/5012948')
            expect(text(document.getElementById('inventoryTotals'))).toContain('Data provided by Discogs.')
            expect(values.readMany).not.toHaveBeenCalled()
        })

        it('the waiting notice counts only the albums that never had a reading: here one, not three', async () => {
            await open(valuesWith(), ITEMS_KEPT)

            expect(text(document.getElementById('valuesWaitingNotice'))).toContain('1 album is waiting for a value.')
        })

        it('with every album read once, no notice at all, however old the readings are', async () => {
            const old = (item) => withKept(item, { readAt: '2026-01-05T10:00:00.000Z' })
            await open(valuesWith(), [old(owned), written, old(wanted), old(wished)])

            expect(document.getElementById('valuesWaitingNotice')).toBeNull()
            expect(text(line('wished', 2))).toMatch(/^CD · Discogs · 5 Jan ≈ /)
        })

        it('the window of the album says when it was read, in the «Estimated value» section', async () => {
            await open(valuesWith(), ITEMS_KEPT)

            await view.handleViewWithModal('owned')
            const section = document.querySelector('.modal-overlay [data-role="estimated-value"]')
            expect(text(section)).toContain('Read on ')
            expect(text(section)).toContain('Data provided by Discogs.')
        })
    })

    describe('«Update values» and the notices (REQ-09)', () => {
        it('with albums waiting, a notice says how many and offers to read them; nothing was read on its own', async () => {
            const values = valuesWith({ readings: READINGS() })
            await open(values)

            const notice = document.getElementById('valuesWaitingNotice')
            expect(text(notice)).toBe('1 album is waiting for a value. Reading it takes about a minute. Read it now')
            expect(values.readMany).not.toHaveBeenCalled()

            notice.querySelector('button').click()
            // the readings the browser holds are kept in their items first (REQ-14), then the album that never had one is read
            await vi.waitFor(() => expect(values.readMany).toHaveBeenCalledTimes(1))
            expect(values.readMany.mock.calls[0][0].map(item => item.id)).toEqual(['wished'])
        })

        it('the button is in the filters row, beside «Update ratings»', async () => {
            await open(valuesWith())
            const button = document.getElementById('updateValuesBtn')

            expect(text(button)).toBe('Update values')
            expect(button.closest('.filters-row')).not.toBe(null)
            expect(button.title).toBe('Read the estimated value of every album from Discogs')
        })

        it('while it runs the button says the progress, the notice has «Stop», each card changes in place, and the search keeps its text', async () => {
            const values = valuesWith()
            let finish
            values.readMany.mockImplementation((items, { onProgress, onItem, signal }) => new Promise(resolve => {
                onItem(items[0], { state: 'reading' })
                onProgress({ total: 3, done: 0, read: 0, noEdition: 0, noSuggestion: 0, failed: {} })
                finish = () => {
                    onItem(items[0], { reading: reading() })
                    onProgress({ total: 3, done: 1, read: 1, noEdition: 0, noSuggestion: 0, failed: {} })
                    resolve({ total: 3, done: 1, read: 1, noEdition: 0, noSuggestion: 0, failed: {}, stopped: null, aborted: signal.aborted })
                }
            }))
            await open(values)
            const search = document.getElementById('inventorySearch')
            search.value = 'typed'

            const run = view.controller.handleUpdateValues()

            const button = document.getElementById('updateValuesBtn')
            expect(text(button)).toBe('Reading values… 0 of 3')
            expect(button.disabled).toBe(true)
            expect(button.getAttribute('aria-busy')).toBe('true')
            expect(text(document.getElementById('valuesReadingNotice'))).toBe('Reading values… 0 of 3. You can keep using the inventory. This takes about a minute for 3 albums. Stop')
            expect(text(line('owned', 2))).toBe('Reading… —')
            expect(document.getElementById('inventorySearch')).toBe(search) // the screen was not drawn whole

            document.querySelector('#valuesReadingNotice button').click()
            finish()
            await run

            expect(text(line('owned', 2))).toMatch(/^CD · Discogs · \d{1,2} [A-Z][a-z]{2} ≈ \$11\.20$/) // REQ-16: it says when it was read
            expect(text(document.getElementById('updateValuesBtn'))).toBe('Update values')
            expect(document.getElementById('valuesReadingNotice')).toBe(null)
            expect(toast.success).toHaveBeenCalledWith('Values read for 1 of 3 albums. Stopped by you after 1 of 3.')
        })
    })

    describe('the switch off (REQ-10)', () => {
        beforeEach(() => open(valuesWith({ source: 'off', rates: RATES, readings: READINGS() })))

        it('no «Update values», no notice, no value and no word of Discogs but the store link', () => {
            expect(document.getElementById('updateValuesBtn')).toBe(null)
            expect(document.getElementById('inventoryNotices').children).toHaveLength(0)
            expect(document.querySelector('[data-role="discogs-credit"]')).toBe(null)
            expect(text(line('owned', 2))).toBe('No value yet —')
            const said = text(document.getElementById('app')).replace(/Discogs ↗/g, '')
            expect(said).not.toContain('Discogs')
            expect(document.getElementById('discogsApiNotice').hidden).toBe(true)
        })

        it('the value written by hand, the totals, the currency, the order and the buy links go on working', () => {
            expect(text(line('written', 2))).toBe('CD · written by you ≈ $25.00')
            expect(text(total('owned'))).toBe('Estimated value of what I own: $25.00 1 of 2 owned albums have a value')
            expect(text(total('to-buy'))).toBe('To buy the rest: — 0 of 2 albums have a value')
            document.querySelector('#currencySelector [data-currency="EUR"]').click()
            expect(text(line('written', 2))).toBe('CD · written by you ≈ €22.75')
            expect([...line('wished', 5).querySelectorAll('a')]).toHaveLength(3)
            view.controller.handleSortChoice('value')
            expect(document.querySelector('.inventory-card-wrapper').dataset.albumId).toBe('written')
        })
    })

    describe('what the app says of the Discogs API (REQ-06)', () => {
        it('the footer says it uses the API and is not affiliated, while the values are on', async () => {
            await open(valuesWith())
            const notice = document.getElementById('discogsApiNotice')

            expect(notice.hidden).toBe(false)
            expect(notice.textContent).toBe(DISCOGS_NOTICE)
            expect(DISCOGS_NOTICE).toBe("This application uses Discogs' API but is not affiliated with, sponsored or endorsed by Discogs. 'Discogs' is a trademark of Zink Media, LLC.")
        })
    })

    describe('the album window (REQ-03, REQ-04, REQ-06, REQ-11)', () => {
        const openWindow = async (id) => {
            await view.handleViewWithModal(id)
            return document.querySelector('.modal-overlay')
        }
        const section = (role) => document.querySelector(`.modal-overlay [data-role="${role}"]`)

        it('«Estimated value»: the three conditions and the mean, the edition with its link, when it was read, «Read again», and the credit beside the values', async () => {
            await open(valuesWith({ readings: READINGS() }))
            await openWindow('owned')
            const value = section('estimated-value')

            expect(text(value.querySelector('h3'))).toBe('Estimated value')
            expect([...value.querySelectorAll('[data-role="conditions"] > div')].map(text)).toEqual(['Mint$14.50', 'Near Mint$11.20', 'Very Good Plus$7.90', 'Mean of the three$11.20'])
            expect(text(value)).toContain('Edition: Harvest 1984, Europe (CD), the most common CD edition on Discogs.')
            expect(text(value)).toMatch(/Read on \d{1,2} \w{3} \d{4}, \d{2}:\d{2}\. Read again/)
            const credit = value.querySelector('[data-role="discogs-credit"] a')
            expect(text(credit)).toBe('Data provided by Discogs.')
            expect(credit.href).toBe('https://www.discogs.com/release/5012948')
            expect(credit.rel).not.toContain('nofollow')
            expect(value.querySelector('label').textContent).toBe('Write your own value')
        })

        it('«Where to buy»: the three stores, on this album', async () => {
            await open(valuesWith())
            await openWindow('wished')
            const buy = section('where-to-buy')

            expect(text(buy)).toContain('Each link opens the store on this album, on CD. The app earns nothing from these links today.')
            expect([...buy.querySelectorAll('a')].map(link => [text(link), link.href])).toEqual([
                ['Discogs ↗', 'https://www.discogs.com/search/?q=Yes+Fragile&format_exact=CD&type=release'],
                ['Amazon ↗', 'https://www.amazon.com/s?k=Yes+Fragile+CD'],
                ['iMusic ↗', 'https://imusic.br.com/search?query=Yes+Fragile+CD']
            ])
        })

        it('«Where to buy» on the card of what is owned opens the window', async () => {
            await open(valuesWith())
            line('owned', 5).querySelector('button[data-action="view-modal"]').click()
            await vi.waitFor(() => expect(section('where-to-buy')).not.toBe(null))
        })

        it('writing a value saves it in the item; the window then says it is yours and offers the way back', async () => {
            await open(valuesWith({ readings: READINGS() }))
            service.updateAlbum.mockImplementation(async (id, changes) => {
                inventoryStore.replaceAlbums(inventoryStore.getAlbums().map(item => (item.id === id ? { ...item, ...changes } : item)))
            })
            await openWindow('owned')
            const input = section('estimated-value').querySelector('#inventoryValueInput')
            input.value = '30'
            section('estimated-value').querySelector('[data-action="save-value"]').click()
            await vi.waitFor(() => expect(text(section('estimated-value'))).toContain('You wrote this value.'))

            expect(service.updateAlbum).toHaveBeenCalledWith('owned', { value: { amount: 30, currency: 'USD', at: expect.any(String) } })
            expect(text(section('estimated-value'))).toContain('Reading values from Discogs never changes it.')
            expect(text(section('estimated-value').querySelector('[data-role="amount"]'))).toBe('$30.00')
            expect(text(line('owned', 2))).toBe('CD · written by you ≈ $30.00')

            section('estimated-value').querySelector('[data-action="forget-value"]').click()
            await vi.waitFor(() => expect(service.updateAlbum).toHaveBeenLastCalledWith('owned', { value: null }))
            await vi.waitFor(() => expect(text(section('estimated-value'))).toContain('Mean of the three'))
        })

        it('an album with no CD edition says so, and lets the person write the value or look again', async () => {
            await open(valuesWith({ readings: new Map([['wished', { kind: 'not_found', release: null, readAt: new Date().toISOString() }]]) }))
            await openWindow('wished')
            const value = section('estimated-value')

            expect(text(value)).toContain('Discogs has no CD edition under this artist and title, so there is no value to read.')
            expect(text(value)).toContain('No CD edition found on Discogs')
            expect(value.querySelector('label').textContent).toBe('Write the value yourself')
            expect(text(value.querySelector('[data-action="read-value"]'))).toBe('Look again')
            expect(text(line('wished', 2))).toBe('No CD edition found —')
        })

        it('an album never read offers «Read the value now»; a failure says what happened and offers «Try again»', async () => {
            const values = valuesWith()
            values.readItem.mockResolvedValue({ failure: 'token_refused', waitMs: null, stops: true })
            await open(values)
            await openWindow('wished')

            expect(text(section('estimated-value'))).toContain('No value was read for this album yet.')
            section('estimated-value').querySelector('[data-action="read-value"]').click()
            await vi.waitFor(() => expect(text(section('estimated-value'))).toContain('Discogs refused the token. The value was not read.'))

            expect(text(section('estimated-value').querySelector('[data-action="read-value"]'))).toBe('Try again')
            expect(toast.error).toHaveBeenCalledWith('Discogs refused the token. The value was not read.')
            expect(text(line('wished', 2))).toBe('Discogs refused the token —')
        })

        it('with the switch off the window has no word of Discogs but the store link, and the field to write a value', async () => {
            await open(valuesWith({ source: 'off', rates: null }))
            await openWindow('written')
            const value = section('estimated-value')

            expect(text(value)).not.toContain('Discogs')
            expect(text(value.querySelector('[data-action="forget-value"]'))).toBe('Remove my value')
            expect(value.querySelector('[data-action="read-value"]')).toBe(null)
            expect(section('where-to-buy').querySelectorAll('a')).toHaveLength(3)
        })
    })
})
