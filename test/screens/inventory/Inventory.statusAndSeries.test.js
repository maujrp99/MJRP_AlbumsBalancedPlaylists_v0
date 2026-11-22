/**
 * F71 (S-54) - the inventory screen as the person sees it: the status filter with plain names,
 * the three counts in the header, the button "Add the albums of my series", and the card and the
 * album window of an item that came from a series (no tracks, no format, no price).
 */
import { createElement } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const service = vi.hoisted(() => ({ updateAlbum: vi.fn(), planSeriesAlbums: vi.fn(), addAlbumsAsNotOwned: vi.fn() }))
const readSeriesOfThePerson = vi.hoisted(() => vi.fn())
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }))
const dialogService = vi.hoisted(() => ({ confirm: vi.fn() }))

vi.mock('../../../public/js/services/inventory/inventoryWiring.js', () => ({ inventoryService: service, readSeriesOfThePerson }))
// The values of the inventory (F75) are off in these tests: no Discogs, no rates
vi.mock('../../../public/js/services/inventory/inventoryValueWiring.js', async () => ({ inventoryValues: (await import('../../helpers/inventoryValuesStub.js')).valuesOff() }))
vi.mock('../../../public/js/services/OptimizedAlbumLoader.js', () => ({ optimizedAlbumLoader: { load: vi.fn(async () => { }) } }))
vi.mock('../../../public/js/stores/toasts.js', () => ({ default: toast, toast }))
vi.mock('../../../public/js/ui/dialogs/dialogs', () => ({ dialogService }))

import { openInventory, press, run, draw, undraw } from '../../support/inventoryHost'
import { Grid } from '../../../public/js/screens/inventory/Grid'
import { InventoryBridge } from '../../../public/js/screens/inventory/InventoryBridge'
import { act } from 'react'
import { openAlbumWindow } from '../../../public/js/ui/albumWindow/openAlbumWindow'
import { openInventoryEdit } from '../../../public/js/ui/inventoryItem/inventoryWindows'
import { closeAllWindows } from '../../../public/js/ui/windowLayer'
import { inventoryStore } from '../../../public/js/stores/inventory.js'
import { inventoryAlbumFromQuery } from '../../../public/js/models/inventoryFromSeries.js'

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

/** The album window as the screen opens it, and its element (the hand-made window gave it back; the page holds it now). */
const showViewAlbumModal = async (item, options) => {
    await act(async () => { await openAlbumWindow(item, options) })
    return [...document.querySelectorAll('.modal-overlay')].at(-1)
}
const closeWindows = () => act(async () => { closeAllWindows() })

describe('the inventory screen (F71)', () => {
    let view

    beforeEach(async () => {
        vi.clearAllMocks()
        view = await openInventory([fromCard, wished, ten, vs], { phone: false })
    })
    afterEach(async () => {
        await view.destroy()
        inventoryStore.reset()
        document.body.innerHTML = ''
    })

    it('the header shows "N albums" and the three counts, each with its name', async () => {
        const stats = document.querySelector('.stats-row')

        expect(text(stats)).toContain('4 albums')
        expect([...stats.querySelectorAll('[data-status-count]')].map(text)).toEqual(['✓ 1 Owned', '2 Not Owned', '♡ 1 Wishlist'])
    })

    it('the counts are the status filter: real buttons, none pressed at first, and no status selector in the filters row (F75, REQ-02)', async () => {
        const counts = [...document.querySelectorAll('[data-status-count]')]

        expect(counts.map(count => count.tagName)).toEqual(['BUTTON', 'BUTTON', 'BUTTON'])
        expect(counts.map(count => count.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'false'])
        expect(counts.every(count => count.getAttribute('type') === 'button' && count.title === 'Show only these albums; press again to show all')).toBe(true)
        expect(document.getElementById('ownershipFilter')).toBe(null)
    })

    it('pressing "Not Owned" shows those items, says it is pressed, and keeps the three counts; pressing it again shows all', async () => {
        const pressNotOwned = () => press(document.querySelector('[data-status-count="not-owned"]'))
        const shown = () => [...document.querySelectorAll('.inventory-card-wrapper')].map(card => card.dataset.albumId).sort()
        await pressNotOwned()

        expect(shown()).toEqual(['inv-ten', 'inv-vs'])
        expect([...document.querySelectorAll('[data-status-count]')].map(count => count.getAttribute('aria-pressed'))).toEqual(['false', 'true', 'false'])
        expect(text(document.querySelector('.stats-row'))).toContain('2 albums')
        expect([...document.querySelectorAll('[data-status-count]')].map(text)).toEqual(['✓ 1 Owned', '2 Not Owned', '♡ 1 Wishlist'])

        await pressNotOwned()
        expect(shown()).toEqual(['inv-core', 'inv-purple', 'inv-ten', 'inv-vs'])
        expect(document.querySelector('[data-status-count="not-owned"]').getAttribute('aria-pressed')).toBe('false')
    })

    it('the filter works with the search: "stone" and Wishlist is one album', async () => {
        await run(() => view.controller.handleFilterChange('search', 'stone'))
        await run(() => view.controller.handleFilterChange('ownership', 'wishlist'))
        expect([...document.querySelectorAll('.inventory-card-wrapper')].map(card => card.dataset.albumId)).toEqual(['inv-purple'])
        expect([...document.querySelectorAll('[data-status-count]')].map(text)).toEqual(['✓ 1 Owned', '0 Not Owned', '♡ 1 Wishlist'])
    })

    describe('the screen that was left (F73, UAT-215)', () => {
        it('draws nothing more when the inventory changes after it was left', async () => {
            await view.destroy()
            document.getElementById('app').innerHTML = '<p id="other">Your Playlists Series</p>'
            inventoryStore.setAlbums([fromCard])
            expect(text(document.getElementById('app'))).toBe('Your Playlists Series')
        })

        it('the search keeps the focus, the text and the cursor when the screen is drawn again (UAT-212)', async () => {
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

        it('is a real button in the toolbar, reached by the keyboard, with its name', async () => {
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

            await press(button())
            await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith('Added 1 album as Not Owned.'))

            expect(dialogService.confirm).toHaveBeenCalledWith({
                title: 'Add the albums of your series?',
                message: '1 album from your 1 series will be added as Not Owned.',
                confirmText: 'Add 1 album'
            })
            expect(button().disabled).toBe(false)
        })

        it('while it runs it is disabled and says what is being done, without drawing the screen again', async () => {
            const grid = document.querySelector('.albums-grid')

            await view.showSeriesAdd({ busy: true, text: 'Adding albums… 100 of 176' })

            expect(button().disabled).toBe(true)
            expect(button().getAttribute('aria-busy')).toBe('true')
            expect(text(button())).toBe('Adding albums… 100 of 176')
            expect(document.querySelector('.albums-grid')).toBe(grid)

            await view.showSeriesAdd({ busy: false, text: null })
            expect(button().disabled).toBe(false)
            expect(text(button())).toBe('Add the albums of my series')
        })

        it('a full draw during the run keeps the button busy', async () => {
            view.controller.state.seriesAdd = { busy: true, text: 'Reading your series…' }
            await run(() => view.controller.refresh())
            expect(button().disabled).toBe(true)
            expect(text(button())).toBe('Reading your series…')
        })
    })

    describe('the card of an item', () => {
        const card = (id) => document.querySelector(`.inventory-card-wrapper[data-album-id="${id}"]`)
        const chosen = (id) => card(id).querySelector('.status-select').value

        it('the selector shows the status of each item, with the three choices', async () => {
            expect([chosen('inv-core'), chosen('inv-purple'), chosen('inv-ten')]).toEqual(['owned', 'wishlist', 'not-owned'])
            expect([...card('inv-ten').querySelectorAll('.status-select option')].map(option => option.textContent)).toEqual(['Not Owned', '✓ Owned', '♡ Wishlist'])
        })

        it('an item that came from a series shows its cover, title and artist, and no format or price it does not have', async () => {
            const made = card('inv-ten')

            expect(made.querySelector('img').getAttribute('src')).toBe('https://example.com/ten.jpg')
            expect(text(made)).toContain('Ten')
            expect(text(made)).toContain('Pearl Jam')
            expect(text(made)).not.toContain('Unknown')
            expect(text(made)).not.toContain('$')
            // F75: the card says what the album is worth, not what was paid for it (that is in its window)
            expect(text(card('inv-core'))).not.toContain('R$ 50.00')
            expect(text(card('inv-core'))).toContain('In my collection · worth')
        })

        it('an item with no cover shows the stand-in, and its text is text', async () => {
            const made = card('inv-vs')

            expect(made.querySelector('img').getAttribute('src')).toMatch(/^data:image\/svg\+xml/)
            expect(made.querySelector('b')).toBe(null)
            expect(text(made)).toContain('Vs. <b>')
        })

        it('draws 200 cards in one pass, and the list too', async () => {
            const many = Array.from({ length: 200 }, (_, index) => fromSeries({ artist: `Artist ${index}`, title: `Album ${index}` }, `inv-${index}`))

            const state = (viewMode) => ({ filteredAlbums: many, viewMode, isLoading: false, value: { values: new Map(), money: { currency: 'USD', rates: null } } })
            const none = () => { }
            const actions = { onView: none, onEdit: none, onDelete: none, onStatus: none }
            const grid = await draw(createElement(Grid, { state: state('grid'), bridge: new InventoryBridge(), actions }))
            const list = await draw(createElement(Grid, { state: state('list'), bridge: new InventoryBridge(), actions }))

            expect(grid.querySelectorAll('.inventory-card-wrapper')).toHaveLength(200)
            expect(list.querySelectorAll('.inventory-row-wrapper')).toHaveLength(200)
            await undraw()
        })
    })

    describe('the album window of an item', () => {
        afterEach(closeWindows)

        it('of an item that came from a series, with nobody to ask: Not Owned, and a line in the place of the tracks', async () => {
            const modal = await showViewAlbumModal(ten)

            expect(text(modal)).toContain('Ten')
            expect(text(modal)).toContain('NOT OWNED')
            expect(text(modal)).not.toContain('OWNED OWNED')
            expect(modal.querySelector('[data-role="no-tracks"]').textContent).toBe('No tracks are kept for this album.')
        })

        describe('asks the album load for the album of now (UAT-220)', () => {
            const loaded = { id: 'pearl-jam_ten', title: 'Ten', artist: 'Pearl Jam', tracks: [{ title: 'Once', position: 1, rating: 88, spotifyPopularity: 70 }, { title: 'Even Flow', position: 2, rating: 90, spotifyPopularity: 80 }] }
            const settled = () => new Promise(resolve => setTimeout(resolve, 0))

            it('says it is loading, then shows the tracks that came', async () => {
                let give
                const loadAlbum = vi.fn(() => new Promise(resolve => { give = resolve }))
                const modal = await showViewAlbumModal(ten, { loadAlbum })

                expect(modal.querySelector('[data-role="no-tracks"]').textContent).toBe('Loading the tracks of this album…')
                await run(async () => { give(loaded); await settled() })

                expect(modal.querySelector('[data-role="no-tracks"]')).toBe(null)
                expect(text(modal)).toContain('Once')
                expect(text(modal)).toContain('Even Flow')
                expect(text(modal)).toContain('NOT OWNED') // the status is still the item's
            })

            it('an item that keeps tracks shows them at once, and the album of now takes their place', async () => {
                let give
                const modal = await showViewAlbumModal(fromCard, { loadAlbum: () => new Promise(resolve => { give = resolve }) })

                expect(text(modal)).toContain('Dead & Bloated')
                await run(async () => { give({ ...fromCard.albumData, tracks: [{ title: 'Dead & Bloated', position: 1 }, { title: 'Sex Type Thing', position: 2 }] }); await settled() })
                expect(text(modal)).toContain('Sex Type Thing')
            })

            it('when the album does not come: the kept tracks stay; with none kept, it says so', async () => {
                const kept = await showViewAlbumModal(fromCard, { loadAlbum: async () => null })
                await run(settled)
                expect(text(kept)).toContain('Dead & Bloated')
                await closeWindows()

                const none = await showViewAlbumModal(ten, { loadAlbum: async () => { throw new Error('offline') } })
                await run(settled)
                expect(none.querySelector('[data-role="no-tracks"]').textContent)
                    .toBe('The tracks of this album could not be loaded. Close this window and open it again to try once more.')
            })

            it('drops the ask when the window is closed, and draws nothing after', async () => {
                let give
                let seen
                const modal = await showViewAlbumModal(ten, { loadAlbum: (signal) => { seen = signal; return new Promise(resolve => { give = resolve }) } })
                await press(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })))
                expect(seen.aborted).toBe(true)
                await run(async () => { give(loaded); await settled() })
                expect(text(modal)).not.toContain('Even Flow')
            })

            it('the screen gives the window the album of the item, asked through the service', async () => {
                service.albumOfItem = vi.fn(async () => loaded)
                await view.handleViewWithModal('inv-ten')
                await run(settled)
                expect(service.albumOfItem).toHaveBeenCalledWith(ten, { signal: expect.any(AbortSignal) })
                expect(text(document.querySelector('.modal-overlay'))).toContain('Even Flow')
            })
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
            await act(async () => { await openInventoryEdit(ten, vi.fn()) })

            expect(document.body.textContent).toContain('Ten')
        })

        it('saving the notes of an item that came from a series invents no format for it', async () => {
            const onSave = vi.fn(async () => { })

            await act(async () => { await openInventoryEdit(ten, onSave) })
            const format = document.getElementById('edit-format')
            expect([...format.options].map(option => option.textContent)).toEqual(['Not set', 'CD', 'Vinyl', 'Cassette', 'DVD', 'Blu-ray', 'Digital'])
            expect(format.value).toBe('')
            ;await press([...document.querySelectorAll('button')].find(button => button.textContent === 'Save Changes'))
            await vi.waitFor(() => expect(onSave).toHaveBeenCalled())

            expect(onSave.mock.calls[0]).toEqual(['inv-ten', { format: null, currency: 'BRL', purchasePrice: null, notes: '' }])
        })

        it('the edit window of an item with a format offers the formats only, with its own chosen', async () => {
            await act(async () => { await openInventoryEdit(fromCard, vi.fn()) })
            const format = document.getElementById('edit-format')

            expect([...format.options].map(option => option.value)).toEqual(['cd', 'vinyl', 'cassette', 'dvd', 'bluray', 'digital'])
            expect(format.value).toBe('cd')
        })
    })
})
