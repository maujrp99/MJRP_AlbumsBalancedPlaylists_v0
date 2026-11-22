/**
 * F76 TASK-07 (REQ-11, REQ-12) - the inventory on the phone: one compact row per album, drawn in
 * chunks, the status in two taps, the named actions of an album in a sheet, the jump, the empty
 * states; and on the computer, the screen of before.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const service = vi.hoisted(() => ({ updateAlbum: vi.fn(async () => true), planSeriesAlbums: vi.fn(), addAlbumsAsNotOwned: vi.fn(), removeAlbum: vi.fn() }))
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }))
const dialogService = vi.hoisted(() => ({ confirm: vi.fn(async () => false) }))
const editModal = vi.hoisted(() => ({ open: vi.fn() }))
const albumWindow = vi.hoisted(() => ({ show: vi.fn(async () => ({ redrawValue() { } })) }))

vi.mock('../../../public/js/services/inventory/inventoryWiring.js', () => ({ inventoryService: service, readSeriesOfThePerson: vi.fn(async () => []) }))
vi.mock('../../../public/js/services/inventory/inventoryValueWiring.js', async () => ({ inventoryValues: (await import('../../helpers/inventoryValuesStub.js')).valuesOff() }))
vi.mock('../../../public/js/services/OptimizedAlbumLoader.js', () => ({ optimizedAlbumLoader: { load: vi.fn(async () => { }) } }))
vi.mock('../../../public/js/components/Toast.js', () => ({ default: toast, toast }))
vi.mock('../../../public/js/services/DialogService.js', () => ({ dialogService }))
vi.mock('../../../public/js/ui/inventoryItem/inventoryWindows', () => ({ openInventoryView: albumWindow.show, openInventoryEdit: editModal.open }))

import { openInventory, press, run } from '../../support/inventoryHost'
import { inventoryStore } from '../../../public/js/stores/inventory.js'
import { initialOf, jumpTargets, shownFor, PHONE_CHUNK } from '../../../public/js/models/inventoryJump.js'

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
const rows = () => [...document.querySelectorAll('.inv-row')]
const sheet = () => document.querySelector('.sheet:not(.sheet--closing)')

const open = (items, phone = true) => openInventory(items, { phone })

describe('the inventory on the phone (F76, TASK-07)', () => {
    let view
    const matchMedia = window.matchMedia

    beforeEach(async () => {
        vi.clearAllMocks()
        window.scrollTo = vi.fn()
    })
    afterEach(async () => {
        await view?.destroy()
        document.querySelectorAll('.sheet').forEach(node => node.remove())
        inventoryStore.reset()
        document.body.innerHTML = ''
        window.matchMedia = matchMedia
    })

    it('draws one row per album, not the cards: cover, title, artist, a named status button, the value and «⋯»', async () => {
        view = await open(many(3))

        expect(document.querySelector('.inventory-card-wrapper')).toBe(null)
        expect(rows()).toHaveLength(3)
        const row = rows()[0]
        expect(row.querySelector('img.inv-row__cover').getAttribute('src')).toBe('https://example.com/0.jpg')
        expect(text(row.querySelector('.inv-row__title'))).toBe('Album 0 <b>')
        expect(row.querySelector('.inv-row__title b')).toBe(null)
        expect(text(row.querySelector('.inv-row__artist'))).toBe('ABBA')
        expect(row.querySelector('.inv-row__status').getAttribute('aria-label')).toBe('Status: Owned. Change it')
        expect(text(row.querySelector('.inv-row__status'))).toBe('✓ Owned')
        expect(row.querySelector('.inv-row__more').getAttribute('aria-label')).toBe('Actions for Album 0 <b>')
        expect(text(row.querySelector('[data-role="value"]'))).toBe('—No value yet')
        expect(text(row.querySelector('[data-role="averages"]'))).toBe('Avg Rating80.5Avg Pop41.2%')
    })

    it('a tap on the row opens the album window, as «View» does on the computer', async () => {
        view = await open(many(2))

        await press(rows()[1].querySelector('.inv-row__open'))
        await vi.waitFor(() => expect(albumWindow.show).toHaveBeenCalled())
        expect(albumWindow.show.mock.calls[0][0].id).toBe('inv-001')
    })

    it('draws 50 rows at a time, says how many, and «Show 50 more» draws the next ones', async () => {
        view = await open(many(120))

        expect(rows()).toHaveLength(PHONE_CHUNK)
        expect(text(document.querySelector('.inv-more'))).toBe('Showing 50 of 120Show 50 more')
        await press(document.querySelector('[data-phone-action="more-rows"]'))
        expect(rows()).toHaveLength(100)
        await press(document.querySelector('[data-phone-action="more-rows"]'))
        expect(rows()).toHaveLength(120)
        expect(text(document.querySelector('.inv-more__count'))).toBe('All 120 albums')
    })

    it('the status changes in two taps, and the list keeps the rows it had drawn (F71)', async () => {
        view = await open(many(120))
        await press(document.querySelector('[data-phone-action="more-rows"]'))
        await press(rows()[1].querySelector('.inv-row__status'))
        const choices = [...sheet().querySelectorAll('.inv-choice')]
        // one mark only (recheck N8): plain labels; the check at the right marks the status now
        expect(choices.map(text)).toEqual(['Owned', 'Not Owned', 'Wishlist'])
        expect(choices.map(choice => Boolean(choice.querySelector('.inv-choice__check')))).toEqual([false, true, false])
        expect(choices.map(choice => choice.getAttribute('aria-pressed'))).toEqual(['false', 'true', 'false'])
        await press(choices[0])
        await vi.waitFor(() => expect(service.updateAlbum).toHaveBeenCalledWith('inv-001', { owned: true }))
        await vi.waitFor(() => expect(toast.success).toHaveBeenCalled())

        expect(sheet()).toBe(null)
        expect(rows()).toHaveLength(100)
    })

    it('«⋯» opens the named actions: open, edit, the three stores, Sell and Trade not yet, remove with a confirmation', async () => {
        view = await open(many(2))
        await press(rows()[1].querySelector('.inv-row__more'))
        const actions = sheet()
        expect(text(actions.querySelector('.sheet__title'))).toBe('Album 1 <b>')
        expect([...actions.querySelectorAll('a[data-store]')].map(link => link.dataset.store)).toEqual(['Discogs', 'Amazon', 'iMusic'])
        expect([...actions.querySelectorAll('a[data-store]')].every(link => link.target === '_blank' && link.rel === 'noopener')).toBe(true)
        const sell = [...actions.querySelectorAll('button')].filter(button => ['Sell', 'Trade'].includes(text(button)))
        expect(sell.every(button => button.disabled)).toBe(true)
        expect(text(actions)).toContain('Selling and trading between collectors: not in the app yet')

        ;await press([...actions.querySelectorAll('.inv-action')].find(button => text(button) === 'Remove from inventory'))
        await vi.waitFor(() => expect(dialogService.confirm).toHaveBeenCalled())
        expect(dialogService.confirm.mock.calls[0][0]).toMatchObject({ title: 'Remove from Inventory?', confirmText: 'Remove', variant: 'danger' })
        expect(service.removeAlbum).not.toHaveBeenCalled()
    })

    it('«Edit» in the sheet opens the edit window of that album', async () => {
        view = await open(many(2))
        await press(rows()[0].querySelector('.inv-row__more'))
        ;await press([...sheet().querySelectorAll('.inv-action')].find(button => text(button) === 'Edit'))
        await vi.waitFor(() => expect(editModal.open).toHaveBeenCalled())
        expect(editModal.open.mock.calls[0][0].id).toBe('inv-000')
    })

    it('the jump by letter draws the chunks up to the artist and puts the first of them on the screen', async () => {
        view = await open(many(160))
        Element.prototype.scrollIntoView = vi.fn()

        await press(document.querySelector('[data-phone-action="jump"]'))
        const targets = [...sheet().querySelectorAll('.inv-jump__target')]
        expect(targets.map(text)).toEqual(['A', 'B', 'C', 'G', 'P', 'Q', 'R', 'Y'])
        await press(targets.find(target => text(target) === 'Y'))
        expect(rows()).toHaveLength(150)
        expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1)
        expect(document.activeElement.closest('.inv-row').dataset.albumId).toBe('inv-140')
    })

    it('«Filters» holds the format and the order and says how many are on', async () => {
        view = await open(many(6))
        const filters = () => document.querySelector('[data-phone-action="filters"]')
        expect(filters().getAttribute('aria-label')).toBe('Filters and order')

        await press(filters())
        await press(sheet().querySelector('[data-sort="value"]'))
        await press(sheet().querySelector('[data-format="vinyl"]'))
        expect(text(sheet().querySelector('.sheet__footer'))).toBe('Show 0 albums')
        await press(sheet().querySelector('[data-role="filters-done"]'))
        expect(filters().getAttribute('aria-label')).toBe('Filters and order, 2 on')
        expect(text(document.querySelector('.inv-empty'))).toContain('No albums match')
    })

    it('the actions of the collection are in «⋯» of the screen, each with what it does in words', async () => {
        view = await open(many(2))
        await press(document.querySelector('[data-phone-action="actions"]'))
        expect([...sheet().querySelectorAll('button.inv-collection-action')].map(button => button.id)).toEqual(['addSeriesAlbumsBtn', 'updateRatingsBtn'])
        expect(text(sheet())).toContain('Reads the BestEverAlbums rating and the Spotify popularity of every album')
    })

    it('says what an action of the collection is doing under the search, and nothing when nothing runs', async () => {
        view = await open(many(2))
        const progress = () => document.getElementById('inventoryPhoneProgress')
        expect(progress().hidden).toBe(true)

        await run(() => view.controller._showRatings({ busy: true, text: 'Reading ratings… 1 of 2' }))
        expect(progress().hidden).toBe(false)
        expect(text(progress())).toBe('Reading ratings… 1 of 2')
    })

    it('an empty inventory says what fills it; a search that finds nothing offers to clear it', async () => {
        view = await open([])
        expect(text(document.querySelector('.inv-empty'))).toContain('Your collection is empty')
        expect(document.querySelector('[data-phone-action="add-series"]').className).toContain('btn-primary')
        await view.destroy()
        view = await open(many(3))
        await run(() => view.controller.handleFilterChange('search', 'nothing like this'))
        expect(text(document.querySelector('.inv-empty'))).toContain('No albums match')
        await press(document.querySelector('[data-phone-action="clear-filters"]'))
        expect(rows()).toHaveLength(3)
    })

    it('on the computer the screen is the one of before: cards, the filters row, no phone bar', async () => {
        view = await open(many(3), false)

        expect(document.querySelectorAll('.inventory-card-wrapper')).toHaveLength(3)
        expect(document.querySelector('.filters-row #inventorySearch')).not.toBe(null)
        expect(document.querySelector('.inv-row, #inventoryPhoneBar, .inventory-view--phone')).toBe(null)
        expect(document.querySelector('.inventory-view').className).toBe('inventory-view container pb-20')
    })
})

describe('the jump of the phone (models/inventoryJump.js)', () => {
    it('the initial of an artist: accents taken away, a digit or nothing is "#"', async () => {
        expect(['Björk', 'Ásgeir', '10,000 Maniacs', '', null, ' the who'].map(initialOf)).toEqual(['B', 'A', '#', '#', '#', 'T'])
    })

    it('by artist, a letter where it first appears; in another order, stretches of 25', async () => {
        const items = [{ artist: 'Abba' }, { artist: 'Air' }, { artist: 'Blur' }]
        expect(jumpTargets(items, 'artist')).toEqual([{ label: 'A', index: 0, count: 2 }, { label: 'B', index: 2, count: 1 }])
        expect(jumpTargets(Array.from({ length: 60 }), 'value').map(target => target.label)).toEqual(['1–25', '26–50', '51–60'])
    })

    it('how many rows to draw for an item to be on the page', async () => {
        expect(shownFor(10, 50)).toBe(50)
        expect(shownFor(50, 50)).toBe(100)
        expect(shownFor(149, 50)).toBe(150)
    })
})
