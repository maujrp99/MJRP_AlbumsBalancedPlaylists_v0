/**
 * F89 (REQ-01 to REQ-04) - the inventory on the phone has a gallery of covers as well as the list:
 * the switch in «Filters and order», the choice kept (the computer's key), the same actions in a
 * card as in a row, the same search, filters, order, counts and notices in both; the computer as before.
 */
import { createElement } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const service = vi.hoisted(() => ({ updateAlbum: vi.fn(async () => true), planSeriesAlbums: vi.fn(), addAlbumsAsNotOwned: vi.fn(), removeAlbum: vi.fn() }))
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }))
const dialogService = vi.hoisted(() => ({ confirm: vi.fn(async () => false) }))
const editModal = vi.hoisted(() => ({ open: vi.fn() }))
const albumWindow = vi.hoisted(() => ({ show: vi.fn(async () => ({ redrawValue() { } })) }))

vi.mock('../../../public/js/services/inventory/inventoryWiring.js', () => ({ inventoryService: service, readSeriesOfThePerson: vi.fn(async () => []) }))
vi.mock('../../../public/js/services/inventory/inventoryValueWiring.js', async () => ({ inventoryValues: (await import('../../helpers/inventoryValuesStub.js')).valuesOff() }))
vi.mock('../../../public/js/services/OptimizedAlbumLoader.js', () => ({ optimizedAlbumLoader: { load: vi.fn(async () => { }) } }))
vi.mock('../../../public/js/stores/toasts.js', () => ({ default: toast, toast }))
vi.mock('../../../public/js/ui/dialogs/dialogs', () => ({ dialogService }))
vi.mock('../../../public/js/ui/inventoryItem/inventoryWindows', () => ({ openInventoryView: albumWindow.show, openInventoryEdit: editModal.open }))

import { openInventory, press, run, draw, undraw } from '../../support/inventoryHost'
import { inventoryStore } from '../../../public/js/stores/inventory.js'
import { PhoneRow, PhoneTile } from '../../../public/js/screens/inventory/phone/PhoneRow'
import { PhoneList } from '../../../public/js/screens/inventory/phone/PhoneList'
import { InventoryBridge } from '../../../public/js/screens/inventory/InventoryBridge'
import { PHONE_CHUNK } from '../../../public/js/models/inventoryJump.js'

const ARTISTS = ['ABBA', 'Blur', 'Cream', 'Genesis', 'Pearl Jam', 'Queen', 'Rush', 'Yes']
const many = (count) => Array.from({ length: count }, (_, i) => ({
    id: `inv-${String(i).padStart(3, '0')}`,
    title: `Album ${i} <b>`,
    artist: ARTISTS[Math.floor(i * ARTISTS.length / count)],
    format: 'cd',
    owned: i % 3 === 0 ? true : (i % 3 === 1 ? null : false),
    albumData: { coverUrl: `https://example.com/${i}.jpg` },
    averages: { rating: 80.5, popularity: 41.2, ratedTracks: 9, popTracks: 10, tracks: 10 }
}))

const text = (node) => node.textContent.replace(/\s+/g, ' ').trim()
const tiles = () => [...document.querySelectorAll('.inv-tile')]
const rows = () => [...document.querySelectorAll('.inv-row')]
const sheet = () => document.querySelector('.sheet:not(.sheet--closing)')
const USD = Object.freeze({ currency: 'USD', rates: null })
const DISCOGS_VALUE = Object.freeze({ origin: 'discogs', amount: 12.4, currency: 'USD', release: { url: 'https://www.discogs.com/release/1' } })

const open = (items, options = {}) => openInventory(items, options)

describe('the card of the gallery (views/renderers/InventoryPhoneTile.js)', () => {
    afterEach(async () => { await undraw() })
    const noop = () => { }
    const actions = { onView: noop, onStatus: noop, onMore: noop }

    it('shows the cover, the title and the artist as text, the format with the origin, the value, the status and «⋯»', async () => {
        const [item] = many(1)
        const tile = (await draw(createElement(PhoneTile, { item, value: DISCOGS_VALUE, money: USD, actions }))).querySelector('.inv-tile')

        expect(tile.dataset.albumId).toBe('inv-000')
        expect(tile.querySelector('img.inv-tile__cover').getAttribute('src')).toBe('https://example.com/0.jpg')
        expect(text(tile.querySelector('.inv-tile__title'))).toBe('Album 0 <b>')
        expect(tile.querySelector('.inv-tile__title b')).toBe(null)
        expect(text(tile.querySelector('.inv-tile__artist'))).toBe('ABBA')
        expect(text(tile.querySelector('[data-role="amount"]'))).toBe('≈ $12.40')
        expect(text(tile.querySelector('.inv-tile__origin'))).toBe('CD · Discogs')
        expect(text(tile.querySelector('.inv-tile__status'))).toBe('✓ Owned')
        expect(tile.querySelector('.inv-tile__status').getAttribute('aria-label')).toBe('Status: Owned. Change it')
        expect(tile.querySelector('.inv-tile__more').getAttribute('aria-label')).toBe('Actions for Album 0 <b>')
        expect(tile.querySelector('.inv-tile__open').dataset.action).toBe('view-modal')
        expect(text(tile.querySelector('[data-role="averages"]'))).toBe('Avg Rating80.5Avg Pop41.2%')
    })

    it('the status pill has the arrow of the row, so it reads as something to tap', async () => {
        const [item] = many(1)
        const tile = (await draw(createElement(PhoneTile, { item, value: DISCOGS_VALUE, money: USD, actions }))).querySelector('.inv-tile')
        const row = (await draw(createElement(PhoneRow, { item, value: DISCOGS_VALUE, money: USD, actions }))).querySelector('.inv-row')

        expect(tile.querySelector('.inv-tile__pill svg.inv-tile__chevron')).not.toBe(null)
        expect(row.querySelector('.inv-row__pill svg')).not.toBe(null)
        expect(text(tile.querySelector('.inv-tile__status'))).toBe('✓ Owned')
    })

    it('an album that was never read has no averages line', async () => {
        const [item] = many(1)
        const tile = (await draw(createElement(PhoneTile, { item: { ...item, averages: null }, value: undefined, money: USD, actions }))).querySelector('.inv-tile')

        expect(tile.querySelector('[data-role="averages"]')).toBe(null)
    })

    it('an album with no value says why, with its format; a wishlist album has its mark', async () => {
        const [item] = many(1)
        const tile = (await draw(createElement(PhoneTile, { item: { ...item, owned: false }, value: undefined, money: USD, actions }))).querySelector('.inv-tile')

        expect(text(tile.querySelector('[data-role="amount"]'))).toBe('—')
        expect(text(tile.querySelector('.inv-tile__origin'))).toBe('CD · No value yet')
        expect(text(tile.querySelector('.inv-tile__status'))).toBe('♡ Wishlist')
    })

    it('an album with no cover address shows the stand-in of the app, and the pair of the card keeps its place', async () => {
        const [item] = many(1)
        const tile = (await draw(createElement(PhoneTile, { item: { ...item, albumData: {}, coverUrl: null }, value: undefined, money: USD, actions }))).querySelector('.inv-tile')

        expect(tile.querySelector('img.inv-tile__cover').dataset.coverStandIn).toBe('true')
    })

    it('the gallery draws the first chunk and says how many there are, as the list does', async () => {
        const items = many(120)
        const state = { albums: items, filteredAlbums: items, filters: { search: '', format: 'all', ownership: 'all' }, sorting: { field: 'artist', direction: 'asc' }, viewMode: 'grid', viewChosen: true, isLoading: false, value: { values: new Map(), money: USD } }
        const host = await draw(createElement(PhoneList, { state, bridge: new InventoryBridge(), controller: {}, actions }))

        expect(host.querySelectorAll('.inv-tile')).toHaveLength(PHONE_CHUNK)
        expect(host.querySelector('ul.inv-tiles').getAttribute('aria-label')).toBe('Albums')
        expect(text(host.querySelector('.inv-more'))).toBe('Showing 50 of 120Show 50 more')
    })
})

describe('the inventory on the phone, the gallery and the list (F89)', () => {
    let view
    const matchMedia = window.matchMedia

    beforeEach(async () => {
        vi.clearAllMocks()
        window.scrollTo = vi.fn()
        localStorage.clear()
    })
    afterEach(async () => {
        await view?.destroy()
        document.querySelectorAll('.sheet').forEach(node => node.remove())
        inventoryStore.reset()
        document.body.innerHTML = ''
        window.matchMedia = matchMedia
        localStorage.clear()
    })

    it('opens on the list for someone who never chose', async () => {
        view = await open(many(3))

        expect(rows()).toHaveLength(3)
        expect(tiles()).toHaveLength(0)
    })

    it('opens on the gallery for someone who chose it, and on the list for someone who chose the list', async () => {
        view = await open(many(3), { choice: 'grid' })
        expect(tiles()).toHaveLength(3)
        expect(rows()).toHaveLength(0)
        await view.destroy()
        view = await open(many(3), { choice: 'list' })
        expect(rows()).toHaveLength(3)
        expect(tiles()).toHaveLength(0)
    })

    it('the switch is in «Filters and order», names each view, and changes the view and keeps the choice', async () => {
        view = await open(many(3))
        await press(document.querySelector('[data-phone-action="filters"]'))
        const choices = [...sheet().querySelectorAll('[data-view]')]
        expect(choices.map(text)).toEqual(['Gallery', 'List'])
        expect(choices.map(choice => choice.getAttribute('aria-pressed'))).toEqual(['false', 'true'])

        await press(sheet().querySelector('[data-view="grid"]'))
        expect(tiles()).toHaveLength(3)
        expect(rows()).toHaveLength(0)
        expect(localStorage.getItem('mjrp_inventory_view_mode')).toBe('grid')
        expect([...sheet().querySelectorAll('[data-view]')].map(choice => choice.getAttribute('aria-pressed'))).toEqual(['true', 'false'])

        await press(sheet().querySelector('[data-view="list"]'))
        expect(rows()).toHaveLength(3)
        expect(localStorage.getItem('mjrp_inventory_view_mode')).toBe('list')
    })

    it('the view chosen is the one the screen opens on next time, and the switch does not count as a filter', async () => {
        view = await open(many(3))
        await press(document.querySelector('[data-phone-action="filters"]'))
        await press(sheet().querySelector('[data-view="grid"]'))
        await press(sheet().querySelector('[data-role="filters-done"]'))
        expect(document.querySelector('[data-phone-action="filters"]').getAttribute('aria-label')).toBe('Filters and order')
        await view.destroy()
        view = await open(many(3))
        expect(tiles()).toHaveLength(3)
    })

    it('a tap on the cover opens the album window, as a tap on the row does', async () => {
        view = await open(many(2), { choice: 'grid' })

        await press(tiles()[1].querySelector('.inv-tile__open'))
        await vi.waitFor(() => expect(albumWindow.show).toHaveBeenCalled())
        expect(albumWindow.show.mock.calls[0][0].id).toBe('inv-001')
    })

    it('the status changes in two taps, from the card', async () => {
        view = await open(many(2), { choice: 'grid' })

        await press(tiles()[1].querySelector('.inv-tile__status'))
        const choices = [...sheet().querySelectorAll('.inv-choice')]
        expect(choices.map(text)).toEqual(['Owned', 'Not Owned', 'Wishlist'])
        await press(choices[0])
        await vi.waitFor(() => expect(service.updateAlbum).toHaveBeenCalledWith('inv-001', { owned: true }))
    })

    it('«⋯» of the card has the same actions as the row: open, edit, the three stores, remove', async () => {
        view = await open(many(2), { choice: 'grid' })
        await press(tiles()[1].querySelector('.inv-tile__more'))
        const actions = sheet()
        expect(text(actions.querySelector('.sheet__title'))).toBe('Album 1 <b>')
        expect([...actions.querySelectorAll('a[data-store]')].map(link => link.dataset.store)).toEqual(['Discogs', 'Amazon', 'iMusic'])
        const named = [...actions.querySelectorAll('.inv-action')].map(text)
        expect(named).toEqual(expect.arrayContaining(['Open album', 'Edit', 'Remove from inventory']))
        ;await press([...actions.querySelectorAll('.inv-action')].find(button => text(button) === 'Edit'))
        await vi.waitFor(() => expect(editModal.open).toHaveBeenCalled())
        expect(editModal.open.mock.calls[0][0].id).toBe('inv-001')
    })

    it('the same search, filter and order give the same albums in both views', async () => {
        view = await open(many(40), { choice: 'grid' })
        const ids = (nodes) => nodes.map(node => node.dataset.albumId)

        await run(() => view.controller.handleFilterChange('search', 'Album 1'))
        const gallery = ids(tiles())
        await run(() => view.controller.handleViewModeChange('list'))
        expect(ids(rows())).toEqual(gallery)
        expect(gallery.length).toBeGreaterThan(1)

        await run(() => view.controller.handleViewModeChange('grid'))
        await run(() => view.controller.handleSortChoice('artist_desc'))
        const desc = ids(tiles())
        await run(() => view.controller.handleViewModeChange('list'))
        expect(ids(rows())).toEqual(desc)
    })

    it('draws 50 cards at a time in the gallery, and «Show 50 more» draws the next ones', async () => {
        view = await open(many(120), { choice: 'grid' })

        expect(tiles()).toHaveLength(PHONE_CHUNK)
        await press(document.querySelector('[data-phone-action="more-rows"]'))
        expect(tiles()).toHaveLength(100)
        expect(document.activeElement.closest('.inv-tile').dataset.albumId).toBe('inv-050')
    })

    it('the jump reaches the card of the artist in the gallery', async () => {
        view = await open(many(160), { choice: 'grid' })
        Element.prototype.scrollIntoView = vi.fn()

        await press(document.querySelector('[data-phone-action="jump"]'))
        const target = [...sheet().querySelectorAll('.inv-jump__target')].find(one => text(one) === 'Y')
        await press(target)
        expect(tiles()).toHaveLength(150)
        expect(document.activeElement.closest('.inv-tile').dataset.albumId).toBe('inv-140')
    })

    it('the totals, the status counts, the search bar and the empty states are the same in the gallery', async () => {
        view = await open(many(3), { choice: 'grid' })

        expect(document.querySelector('#inventoryTotals')).not.toBe(null)
        expect(document.querySelector('#inventoryNotices')).not.toBe(null)
        expect(document.querySelector('#inventoryPhoneBar #inventorySearch')).not.toBe(null)
        expect(document.querySelectorAll('[data-status-count]')).toHaveLength(3)
        await run(() => view.controller.handleFilterChange('search', 'nothing like this'))
        expect(text(document.querySelector('.inv-empty'))).toContain('No albums match')
    })

    it('one card is drawn again where it is when its value changes, still a card', async () => {
        view = await open(many(3), { choice: 'grid' })
        const before = tiles()[1]

        await run(() => view.bridge.showValues(view.controller.state, 'inv-001'))

        expect(tiles()).toHaveLength(3)
        expect(tiles()[1]).not.toBe(before)
        expect(tiles()[1].dataset.albumId).toBe('inv-001')
    })

    it('on the computer nothing changes: the choice is the grid or the list as before, and no card of the phone', async () => {
        view = await open(many(3), { phone: false })
        expect(document.querySelectorAll('.inventory-card-wrapper')).toHaveLength(3)
        expect(document.querySelector('.inv-tile, .inv-row')).toBe(null)
        await view.destroy()
        view = await open(many(3), { phone: false, choice: 'list' })
        expect(document.querySelectorAll('.inventory-row-wrapper')).toHaveLength(3)
        expect(document.querySelector('.inv-tile, .inv-row')).toBe(null)
    })
})
