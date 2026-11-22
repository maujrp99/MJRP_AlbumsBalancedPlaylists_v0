/**
 * F89 (REQ-01 to REQ-04) - the inventory on the phone has a gallery of covers as well as the list:
 * the switch in «Filters and order», the choice kept (the computer's key), the same actions in a
 * card as in a row, the same search, filters, order, counts and notices in both; the computer as before.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const service = vi.hoisted(() => ({ updateAlbum: vi.fn(async () => true), planSeriesAlbums: vi.fn(), addAlbumsAsNotOwned: vi.fn(), removeAlbum: vi.fn() }))
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }))
const dialogService = vi.hoisted(() => ({ confirm: vi.fn(async () => false) }))
const editModal = vi.hoisted(() => ({ open: vi.fn() }))

vi.mock('../../public/js/services/inventory/inventoryWiring.js', () => ({ inventoryService: service, readSeriesOfThePerson: vi.fn(async () => []) }))
vi.mock('../../public/js/services/inventory/inventoryValueWiring.js', async () => ({ inventoryValues: (await import('../helpers/inventoryValuesStub.js')).valuesOff() }))
vi.mock('../../public/js/services/OptimizedAlbumLoader.js', () => ({ optimizedAlbumLoader: { load: vi.fn(async () => { }) } }))
vi.mock('../../public/js/components/Toast.js', () => ({ default: toast, toast }))
vi.mock('../../public/js/services/DialogService.js', () => ({ dialogService }))
vi.mock('../../public/js/components/InventoryEditModal.js', () => ({ InventoryEditModal: editModal }))

import { InventoryView } from '../../public/js/views/InventoryView.js'
import { inventoryStore } from '../../public/js/stores/inventory.js'
import { phoneGallery, phoneTile } from '../../public/js/views/renderers/InventoryPhoneTile.js'
import { PHONE_CHUNK } from '../../public/js/models/inventoryJump.js'

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

function stubScreen(phone) {
    window.matchMedia = (query) => ({
        matches: query === '(max-width: 899px)' ? phone : query.includes('prefers-reduced-motion'),
        addEventListener() { },
        removeEventListener() { }
    })
}

async function open(items, { phone = true, choice = null } = {}) {
    stubScreen(phone)
    if (choice) localStorage.setItem('mjrp_inventory_view_mode', choice)
    document.body.innerHTML = '<div id="app"></div>'
    inventoryStore.setAlbums(items)
    const view = new InventoryView()
    await view.mount()
    return view
}

describe('the card of the gallery (views/renderers/InventoryPhoneTile.js)', () => {
    const draw = (html) => {
        const host = document.createElement('div')
        host.innerHTML = html
        return host
    }

    it('shows the cover, the title and the artist as text, the format with the origin, the value, the status and «⋯»', () => {
        const [item] = many(1)
        const tile = draw(phoneTile(item, DISCOGS_VALUE, USD)).querySelector('.inv-tile')

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

    it('an album that was never read has no averages line', () => {
        const [item] = many(1)
        const tile = draw(phoneTile({ ...item, averages: null }, undefined, USD)).querySelector('.inv-tile')

        expect(tile.querySelector('[data-role="averages"]')).toBe(null)
    })

    it('an album with no value says why, with its format; a wishlist album has its mark', () => {
        const [item] = many(1)
        const tile = draw(phoneTile({ ...item, owned: false }, undefined, USD)).querySelector('.inv-tile')

        expect(text(tile.querySelector('[data-role="amount"]'))).toBe('—')
        expect(text(tile.querySelector('.inv-tile__origin'))).toBe('CD · No value yet')
        expect(text(tile.querySelector('.inv-tile__status'))).toBe('♡ Wishlist')
    })

    it('an album with no cover address shows the stand-in of the app, and the pair of the card keeps its place', () => {
        const [item] = many(1)
        const tile = draw(phoneTile({ ...item, albumData: {}, coverUrl: null }, undefined, USD)).querySelector('.inv-tile')

        expect(tile.querySelector('img.inv-tile__cover').dataset.coverStandIn).toBe('true')
    })

    it('the gallery draws the first chunk and says how many there are, as the list does', () => {
        const html = phoneGallery(many(120), { values: new Map(), money: USD }, PHONE_CHUNK)
        const host = draw(html)

        expect(host.querySelectorAll('.inv-tile')).toHaveLength(PHONE_CHUNK)
        expect(host.querySelector('ul.inv-tiles').getAttribute('aria-label')).toBe('Albums')
        expect(text(host.querySelector('.inv-more'))).toBe('Showing 50 of 120Show 50 more')
    })
})

describe('the inventory on the phone, the gallery and the list (F89)', () => {
    let view
    const matchMedia = window.matchMedia

    beforeEach(() => {
        vi.clearAllMocks()
        window.scrollTo = vi.fn()
        localStorage.clear()
    })
    afterEach(() => {
        view?.destroy()
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
        view.destroy()

        view = await open(many(3), { choice: 'list' })
        expect(rows()).toHaveLength(3)
        expect(tiles()).toHaveLength(0)
    })

    it('the switch is in «Filters and order», names each view, and changes the view and keeps the choice', async () => {
        view = await open(many(3))
        document.querySelector('[data-phone-action="filters"]').click()

        const choices = [...sheet().querySelectorAll('[data-view]')]
        expect(choices.map(text)).toEqual(['Gallery', 'List'])
        expect(choices.map(choice => choice.getAttribute('aria-pressed'))).toEqual(['false', 'true'])

        sheet().querySelector('[data-view="grid"]').click()
        expect(tiles()).toHaveLength(3)
        expect(rows()).toHaveLength(0)
        expect(localStorage.getItem('mjrp_inventory_view_mode')).toBe('grid')
        expect([...sheet().querySelectorAll('[data-view]')].map(choice => choice.getAttribute('aria-pressed'))).toEqual(['true', 'false'])

        sheet().querySelector('[data-view="list"]').click()
        expect(rows()).toHaveLength(3)
        expect(localStorage.getItem('mjrp_inventory_view_mode')).toBe('list')
    })

    it('the view chosen is the one the screen opens on next time, and the switch does not count as a filter', async () => {
        view = await open(many(3))
        document.querySelector('[data-phone-action="filters"]').click()
        sheet().querySelector('[data-view="grid"]').click()
        sheet().querySelector('[data-role="filters-done"]').click()
        expect(document.querySelector('[data-phone-action="filters"]').getAttribute('aria-label')).toBe('Filters and order')
        view.destroy()

        view = await open(many(3))
        expect(tiles()).toHaveLength(3)
    })

    it('a tap on the cover opens the album window, as a tap on the row does', async () => {
        view = await open(many(2), { choice: 'grid' })
        view.handleViewWithModal = vi.fn()

        tiles()[1].querySelector('.inv-tile__open').click()

        expect(view.handleViewWithModal).toHaveBeenCalledWith('inv-001')
    })

    it('the status changes in two taps, from the card', async () => {
        view = await open(many(2), { choice: 'grid' })

        tiles()[1].querySelector('.inv-tile__status').click()
        const choices = [...sheet().querySelectorAll('.inv-choice')]
        expect(choices.map(text)).toEqual(['Owned', 'Not Owned', 'Wishlist'])
        choices[0].click()

        await vi.waitFor(() => expect(service.updateAlbum).toHaveBeenCalledWith('inv-001', { owned: true }))
    })

    it('«⋯» of the card has the same actions as the row: open, edit, the three stores, remove', async () => {
        view = await open(many(2), { choice: 'grid' })
        tiles()[1].querySelector('.inv-tile__more').click()

        const actions = sheet()
        expect(text(actions.querySelector('.sheet__title'))).toBe('Album 1 <b>')
        expect([...actions.querySelectorAll('a[data-store]')].map(link => link.dataset.store)).toEqual(['Discogs', 'Amazon', 'iMusic'])
        const named = [...actions.querySelectorAll('.inv-action')].map(text)
        expect(named).toEqual(expect.arrayContaining(['Open album', 'Edit', 'Remove from inventory']))
        ;[...actions.querySelectorAll('.inv-action')].find(button => text(button) === 'Edit').click()
        await vi.waitFor(() => expect(editModal.open).toHaveBeenCalled())
        expect(editModal.open.mock.calls[0][0].id).toBe('inv-001')
    })

    it('the same search, filter and order give the same albums in both views', async () => {
        view = await open(many(40), { choice: 'grid' })
        const ids = (nodes) => nodes.map(node => node.dataset.albumId)

        view.controller.handleFilterChange('search', 'Album 1')
        const gallery = ids(tiles())
        view.controller.handleViewModeChange('list')
        expect(ids(rows())).toEqual(gallery)
        expect(gallery.length).toBeGreaterThan(1)

        view.controller.handleViewModeChange('grid')
        view.controller.handleSortChoice('artist_desc')
        const desc = ids(tiles())
        view.controller.handleViewModeChange('list')
        expect(ids(rows())).toEqual(desc)
    })

    it('draws 50 cards at a time in the gallery, and «Show 50 more» draws the next ones', async () => {
        view = await open(many(120), { choice: 'grid' })

        expect(tiles()).toHaveLength(PHONE_CHUNK)
        document.querySelector('[data-phone-action="more-rows"]').click()
        expect(tiles()).toHaveLength(100)
        expect(document.activeElement.closest('.inv-tile').dataset.albumId).toBe('inv-050')
    })

    it('the jump reaches the card of the artist in the gallery', async () => {
        view = await open(many(160), { choice: 'grid' })
        Element.prototype.scrollIntoView = vi.fn()

        document.querySelector('[data-phone-action="jump"]').click()
        const target = [...sheet().querySelectorAll('.inv-jump__target')].find(one => text(one) === 'Y')
        target.click()

        expect(tiles()).toHaveLength(150)
        expect(document.activeElement.closest('.inv-tile').dataset.albumId).toBe('inv-140')
    })

    it('the totals, the status counts, the search bar and the empty states are the same in the gallery', async () => {
        view = await open(many(3), { choice: 'grid' })

        expect(document.querySelector('#inventoryTotals')).not.toBe(null)
        expect(document.querySelector('#inventoryNotices')).not.toBe(null)
        expect(document.querySelector('#inventoryPhoneBar #inventorySearch')).not.toBe(null)
        expect(document.querySelectorAll('[data-status-count]')).toHaveLength(3)
        view.controller.handleFilterChange('search', 'nothing like this')
        expect(text(document.querySelector('.inv-empty'))).toContain('No albums match')
    })

    it('one card is drawn again where it is when its value changes, still a card', async () => {
        view = await open(many(3), { choice: 'grid' })
        const before = tiles()[1]

        view.redrawCard(view.controller.state, 'inv-001')

        expect(tiles()).toHaveLength(3)
        expect(tiles()[1]).not.toBe(before)
        expect(tiles()[1].dataset.albumId).toBe('inv-001')
    })

    it('on the computer nothing changes: the choice is the grid or the list as before, and no card of the phone', async () => {
        view = await open(many(3), { phone: false })
        expect(document.querySelectorAll('.inventory-card-wrapper')).toHaveLength(3)
        expect(document.querySelector('.inv-tile, .inv-row')).toBe(null)
        view.destroy()

        view = await open(many(3), { phone: false, choice: 'list' })
        expect(document.querySelectorAll('.inventory-row-wrapper')).toHaveLength(3)
        expect(document.querySelector('.inv-tile, .inv-row')).toBe(null)
    })
})
