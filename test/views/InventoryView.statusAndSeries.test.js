/**
 * F71 (S-54) - the inventory screen as the person sees it: the status filter with plain names,
 * the three counts in the header, the button "Add the albums of my series", and the card and the
 * album window of an item that came from a series (no tracks, no format, no price).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const service = vi.hoisted(() => ({ updateAlbum: vi.fn(), planSeriesAlbums: vi.fn(), addAlbumsAsNotOwned: vi.fn() }))
const readSeriesOfThePerson = vi.hoisted(() => vi.fn())
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }))
const dialogService = vi.hoisted(() => ({ confirm: vi.fn() }))

vi.mock('../../public/js/services/inventory/inventoryWiring.js', () => ({ inventoryService: service, readSeriesOfThePerson }))
vi.mock('../../public/js/services/OptimizedAlbumLoader.js', () => ({ optimizedAlbumLoader: { load: vi.fn(async () => { }) } }))
vi.mock('../../public/js/components/Toast.js', () => ({ default: toast, toast }))
vi.mock('../../public/js/services/DialogService.js', () => ({ dialogService }))

import { InventoryView } from '../../public/js/views/InventoryView.js'
import { InventoryGridRenderer } from '../../public/js/views/renderers/InventoryGridRenderer.js'
import { showViewAlbumModal } from '../../public/js/components/ViewAlbumModal.js'
import { inventoryStore } from '../../public/js/stores/inventory.js'
import { inventoryAlbumFromQuery } from '../../public/js/models/inventoryFromSeries.js'

const fromCard = { id: 'inv-core', title: 'Core', artist: 'Stone Temple Pilots', format: 'cd', owned: true, purchasePrice: 50, currency: 'BRL', notes: 'mint', albumData: { id: 'stone-temple-pilots_core', title: 'Core', artist: 'Stone Temple Pilots', coverUrl: 'https://example.com/core.jpg', tracks: [{ title: 'Dead & Bloated', position: 1 }] } }
const wished = { id: 'inv-purple', title: 'Purple', artist: 'Stone Temple Pilots', format: 'vinyl', owned: false, purchasePrice: null, currency: 'USD', albumData: { id: 'stone-temple-pilots_purple', title: 'Purple', artist: 'Stone Temple Pilots' } }
/** What InventoryRepository.addBatch stores for an album of a series. */
const fromSeries = (query, id) => {
    const albumData = inventoryAlbumFromQuery(query)
    return { id, title: albumData.title, artist: albumData.artist, year: albumData.year, format: null, owned: null, purchasePrice: null, currency: null, purchaseDate: null, condition: null, notes: '', albumData }
}
const ten = fromSeries({ artist: 'Pearl Jam', title: 'Ten', appleMusicId: '1053135953', year: 1991, coverUrl: 'https://example.com/ten.jpg' }, 'inv-ten')
const vs = fromSeries('Pearl Jam - Vs. <b>', 'inv-vs')

const text = (node) => node.textContent.replace(/\s+/g, ' ').trim()

describe('the inventory screen (F71)', () => {
    let view

    beforeEach(async () => {
        vi.clearAllMocks()
        document.body.innerHTML = '<div id="app"></div>'
        inventoryStore.setAlbums([fromCard, wished, ten, vs])
        view = new InventoryView()
        await view.mount()
    })
    afterEach(() => {
        view.destroy()
        inventoryStore.reset()
        document.body.innerHTML = ''
    })

    it('the header shows "N albums" and the three counts, each with its name', () => {
        const stats = document.querySelector('.stats-row')

        expect(text(stats)).toContain('4 albums')
        expect([...stats.querySelectorAll('[data-status-count]')].map(text)).toEqual(['✓ 1 Owned', '2 Not Owned', '♡ 1 Wishlist'])
    })

    it('the status filter offers All, Owned, Not Owned and Wishlist, in this order', () => {
        const options = [...document.querySelectorAll('#ownershipFilter option')]

        expect(options.map(option => [option.value, option.textContent])).toEqual([
            ['all', 'All'], ['owned', 'Owned'], ['not-owned', 'Not Owned'], ['wishlist', 'Wishlist']
        ])
    })

    it('choosing "Not Owned" shows those items, keeps the choice, and keeps the three counts', () => {
        const select = document.getElementById('ownershipFilter')
        select.value = 'not-owned'
        select.dispatchEvent(new Event('change', { bubbles: true }))

        expect([...document.querySelectorAll('.inventory-card-wrapper')].map(card => card.dataset.albumId).sort()).toEqual(['inv-ten', 'inv-vs'])
        expect(document.getElementById('ownershipFilter').value).toBe('not-owned')
        expect(text(document.querySelector('.stats-row'))).toContain('2 albums')
        expect([...document.querySelectorAll('[data-status-count]')].map(text)).toEqual(['✓ 1 Owned', '2 Not Owned', '♡ 1 Wishlist'])
    })

    it('the filter works with the search: "stone" and Wishlist is one album', () => {
        view.controller.handleFilterChange('search', 'stone')
        view.controller.handleFilterChange('ownership', 'wishlist')

        expect([...document.querySelectorAll('.inventory-card-wrapper')].map(card => card.dataset.albumId)).toEqual(['inv-purple'])
        expect([...document.querySelectorAll('[data-status-count]')].map(text)).toEqual(['✓ 1 Owned', '0 Not Owned', '♡ 1 Wishlist'])
    })

    describe('the screen that was left (F73, UAT-215)', () => {
        it('draws nothing more when the inventory changes after it was left', () => {
            view.destroy()
            document.getElementById('app').innerHTML = '<p id="other">Your Playlists Series</p>'
            inventoryStore.setAlbums([fromCard])
            expect(text(document.getElementById('app'))).toBe('Your Playlists Series')
        })

        it('the search keeps the focus, the text and the cursor when the screen is drawn again (UAT-212)', () => {
            const search = document.getElementById('inventorySearch')
            search.focus()
            search.value = 'pearl'
            search.setSelectionRange(2, 2)
            inventoryStore.setAlbums([fromCard, ten])
            const after = document.getElementById('inventorySearch')
            expect(document.activeElement).toBe(after)
            expect(after.value).toBe('pearl')
            expect(after.selectionStart).toBe(2)
        })
    })

    describe('the button "Add the albums of my series"', () => {
        const button = () => document.getElementById('addSeriesAlbumsBtn')

        it('is a real button in the toolbar, reached by the keyboard, with its name', () => {
            expect(button().tagName).toBe('BUTTON')
            expect(button().type).toBe('button')
            expect(button().closest('.filters-row')).not.toBe(null)
            expect(button().tabIndex).toBe(0)
            expect(button().disabled).toBe(false)
            expect(text(button())).toBe('Add the albums of my series')
        })

        it('asks the person with the app\'s confirmation and, on yes, writes and says the end', async () => {
            readSeriesOfThePerson.mockResolvedValue([{ name: 'Grunge', albumQueries: ['Alice in Chains - Dirt'] }])
            service.planSeriesAlbums.mockResolvedValue({ toAdd: [{ id: 'alice-in-chains_dirt', title: 'Dirt', artist: 'Alice in Chains' }], skipped: [], seriesCount: 1, alreadyThere: 0, repeated: 0, incomplete: 0 })
            service.addAlbumsAsNotOwned.mockResolvedValue({ added: 1, total: 1, error: null, reloaded: true })
            dialogService.confirm.mockResolvedValue(true)

            button().click()
            await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith('Added 1 album as Not Owned.'))

            expect(dialogService.confirm).toHaveBeenCalledWith({
                title: 'Add the albums of your series?',
                message: '1 album from your 1 series will be added as Not Owned.',
                confirmText: 'Add 1 album'
            })
            expect(button().disabled).toBe(false)
        })

        it('while it runs it is disabled and says what is being done, without drawing the screen again', () => {
            const grid = document.querySelector('.albums-grid')

            view.showSeriesAdd({ busy: true, text: 'Adding albums… 100 of 176' })

            expect(button().disabled).toBe(true)
            expect(button().getAttribute('aria-busy')).toBe('true')
            expect(text(button())).toBe('Adding albums… 100 of 176')
            expect(document.querySelector('.albums-grid')).toBe(grid)

            view.showSeriesAdd({ busy: false, text: null })
            expect(button().disabled).toBe(false)
            expect(text(button())).toBe('Add the albums of my series')
        })

        it('a full draw during the run keeps the button busy', () => {
            view.controller.state.seriesAdd = { busy: true, text: 'Reading your series…' }
            view.controller.refresh()

            expect(button().disabled).toBe(true)
            expect(text(button())).toBe('Reading your series…')
        })
    })

    describe('the card of an item', () => {
        const card = (id) => document.querySelector(`.inventory-card-wrapper[data-album-id="${id}"]`)
        const chosen = (id) => card(id).querySelector('.status-select').value

        it('the selector shows the status of each item, with the three choices', () => {
            expect([chosen('inv-core'), chosen('inv-purple'), chosen('inv-ten')]).toEqual(['owned', 'wishlist', 'not-owned'])
            expect([...card('inv-ten').querySelectorAll('.status-select option')].map(option => option.textContent)).toEqual(['Not Owned', '✓ Owned', '♡ Wishlist'])
        })

        it('an item that came from a series shows its cover, title and artist, and no format or price it does not have', () => {
            const made = card('inv-ten')

            expect(made.querySelector('img').getAttribute('src')).toBe('https://example.com/ten.jpg')
            expect(text(made)).toContain('Ten')
            expect(text(made)).toContain('Pearl Jam')
            expect(text(made)).not.toContain('Unknown')
            expect(text(made)).not.toContain('$')
            expect(text(card('inv-core'))).toContain('R$ 50.00')
            expect(text(card('inv-core'))).toContain('CD')
        })

        it('an item with no cover shows the stand-in, and its text is text', () => {
            const made = card('inv-vs')

            expect(made.querySelector('img').getAttribute('src')).toMatch(/^data:image\/svg\+xml/)
            expect(made.querySelector('b')).toBe(null)
            expect(text(made)).toContain('Vs. <b>')
        })

        it('draws 200 cards in one pass, and the list too', () => {
            const many = Array.from({ length: 200 }, (_, index) => fromSeries({ artist: `Artist ${index}`, title: `Album ${index}` }, `inv-${index}`))

            const grid = InventoryGridRenderer.render({ filteredAlbums: many, viewMode: 'grid', isLoading: false })
            const list = InventoryGridRenderer.render({ filteredAlbums: many, viewMode: 'list', isLoading: false })

            expect(grid.match(/inventory-card-wrapper/g)).toHaveLength(200)
            expect(list.match(/inventory-row-wrapper/g)).toHaveLength(200)
        })
    })

    describe('the album window of an item', () => {
        afterEach(() => document.querySelectorAll('.modal-overlay').forEach(node => node.remove()))

        it('of an item that came from a series: Not Owned, and a line in the place of the tracks', async () => {
            const modal = await showViewAlbumModal(ten)

            expect(text(modal)).toContain('Ten')
            expect(text(modal)).toContain('NOT OWNED')
            expect(text(modal)).not.toContain('OWNED OWNED')
            expect(modal.querySelector('[data-role="no-tracks"]').textContent)
                .toBe('No tracks are kept for this album: it was added from your series. Open it in its series to see its tracks.')
        })

        it('of an item added from an album card: its own status, format, price and notes', async () => {
            const modal = await showViewAlbumModal(fromCard)

            expect(text(modal)).toContain('OWNED')
            expect(text(modal)).not.toContain('NOT OWNED')
            expect(text(modal)).toContain('cd')
            expect(text(modal)).toContain('R$ 50,00')
            expect(text(modal)).toContain('"mint"')
            expect(modal.querySelector('[data-role="no-tracks"]')).toBe(null)
        })

        it('of a wished item says WISHLIST; of an album that is no inventory item, no status at all', async () => {
            expect(text(await showViewAlbumModal(wished))).toContain('WISHLIST')

            const loaded = await showViewAlbumModal({ id: 'x', title: 'Dirt', artist: 'Alice in Chains', tracks: [{ title: 'Them Bones', position: 1 }] })
            expect(text(loaded)).not.toMatch(/OWNED|WISHLIST/)
        })

        it('the edit window opens for an item that came from a series', async () => {
            const { InventoryEditModal } = await import('../../public/js/components/InventoryEditModal.js')

            expect(() => InventoryEditModal.open(ten, vi.fn())).not.toThrow()
            expect(document.body.textContent).toContain('Ten')
        })

        it('saving the notes of an item that came from a series invents no format for it', async () => {
            const { InventoryEditModal } = await import('../../public/js/components/InventoryEditModal.js')
            const onSave = vi.fn(async () => { })

            InventoryEditModal.open(ten, onSave)
            const format = document.getElementById('edit-format')
            expect([...format.options].map(option => option.textContent)).toEqual(['Not set', 'CD', 'Vinyl', 'Cassette', 'DVD', 'Blu-ray', 'Digital'])
            expect(format.value).toBe('')
            ;[...document.querySelectorAll('button')].find(button => button.textContent === 'Save Changes').click()
            await vi.waitFor(() => expect(onSave).toHaveBeenCalled())

            expect(onSave.mock.calls[0]).toEqual(['inv-ten', { format: null, currency: 'BRL', purchasePrice: null, notes: '' }])
        })

        it('the edit window of an item with a format offers the formats only, with its own chosen', async () => {
            const { InventoryEditModal } = await import('../../public/js/components/InventoryEditModal.js')

            InventoryEditModal.open(fromCard, vi.fn())
            const format = document.getElementById('edit-format')

            expect([...format.options].map(option => option.value)).toEqual(['cd', 'vinyl', 'cassette', 'dvd', 'bluray', 'digital'])
            expect(format.value).toBe('cd')
        })
    })
})
