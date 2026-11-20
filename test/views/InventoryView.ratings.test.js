/**
 * F71 (S-56) - the inventory screen as the person sees it: the button "Update ratings", the order
 * «Artist / Avg Rating / Avg Pop / Recently added», and the small line of the averages on a card.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const service = vi.hoisted(() => ({ updateAlbum: vi.fn(), planSeriesAlbums: vi.fn(), addAlbumsAsNotOwned: vi.fn(), updateAverages: vi.fn() }))
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }))
const dialogService = vi.hoisted(() => ({ confirm: vi.fn() }))

vi.mock('../../public/js/services/inventory/inventoryWiring.js', () => ({ inventoryService: service, readSeriesOfThePerson: vi.fn() }))
vi.mock('../../public/js/services/OptimizedAlbumLoader.js', () => ({ optimizedAlbumLoader: { load: vi.fn(async () => { }) } }))
vi.mock('../../public/js/components/Toast.js', () => ({ default: toast, toast }))
vi.mock('../../public/js/services/DialogService.js', () => ({ dialogService }))

import { InventoryView } from '../../public/js/views/InventoryView.js'
import { inventoryStore } from '../../public/js/stores/inventory.js'

const averages = (rating, popularity, extra = {}) => ({ rating, popularity, ratedTracks: 10, popTracks: 9, tracks: 12, at: '2026-11-20T10:00:00.000Z', ...extra })
const item = (id, artist, title, extra = {}) => ({ id, artist, title, owned: null, format: null, albumData: { id }, ...extra })

const wall = item('inv-wall', 'Pink Floyd', 'The Wall', { averages: averages(88.2, 71.4), addedToInventory: { seconds: 1000 } })
const fragile = item('inv-fragile', 'Yes', 'Fragile', { averages: averages(76, 40.5, { tracks: undefined }), addedToInventory: { seconds: 3000 } })
const onlyRating = item('inv-ten', 'Pearl Jam', 'Ten', { averages: averages(90.1, null), addedToInventory: { seconds: 2000 } })
const never = item('inv-never', 'Abba', 'Arrival <b>x</b>')

const text = (node) => node.textContent.replace(/\s+/g, ' ').trim()
const cards = () => [...document.querySelectorAll('.inventory-card-wrapper')].map(card => card.dataset.albumId)

describe('the inventory screen: ratings and order (F71, S-56)', () => {
    let view

    beforeEach(async () => {
        vi.clearAllMocks()
        document.body.innerHTML = '<div id="app"></div>'
        inventoryStore.setAlbums([wall, fragile, onlyRating, never])
        view = new InventoryView()
        await view.mount()
    })
    afterEach(() => {
        view.destroy()
        inventoryStore.reset()
        document.body.innerHTML = ''
    })

    describe('the order', () => {
        it('a select in the filters row offers Artist, Avg Rating, Avg Pop and Recently added, by artist at first', () => {
            const select = document.getElementById('inventorySort')

            expect(select.tagName).toBe('SELECT')
            expect(select.closest('.filters-row')).not.toBe(null)
            expect(select.getAttribute('aria-label')).toBe('Sort by')
            expect([...select.options].map(option => [option.value, option.textContent])).toEqual([
                ['artist', 'Artist'], ['averageRating', 'Avg Rating'], ['averagePopularity', 'Avg Pop'], ['addedToInventory', 'Recently added']
            ])
            expect(select.value).toBe('artist')
            expect(cards()).toEqual(['inv-never', 'inv-ten', 'inv-wall', 'inv-fragile'])
        })

        it.each([
            ['averageRating', ['inv-ten', 'inv-wall', 'inv-fragile', 'inv-never']],
            ['averagePopularity', ['inv-wall', 'inv-fragile', 'inv-never', 'inv-ten']],
            ['addedToInventory', ['inv-fragile', 'inv-ten', 'inv-wall', 'inv-never']]
        ])('choosing %s orders the cards, keeps the choice, and puts an item with no value last', (value, expected) => {
            const select = document.getElementById('inventorySort')
            select.value = value
            select.dispatchEvent(new Event('change', { bubbles: true }))

            expect(cards()).toEqual(expected)
            expect(document.getElementById('inventorySort').value).toBe(value)
        })

        it('works with the filters: the order goes on inside what the filter lets through', () => {
            view.controller.handleSortChoice('averageRating')
            view.controller.handleFilterChange('search', 'p')

            expect(cards()).toEqual(['inv-ten', 'inv-wall'])
        })
    })

    describe('the card', () => {
        it('shows the two averages in one small line, each with the tracks it was made of (REQ-20)', () => {
            const line = document.querySelector('[data-album-id="inv-wall"] [data-role="averages"]')

            expect(text(line)).toBe('Avg Rating: 88.2 (10 of 12) · Avg Pop: 71.4% (9 of 12)')
        })

        it('shows only the average the item has', () => {
            const line = document.querySelector('[data-album-id="inv-ten"] [data-role="averages"]')

            expect(text(line)).toBe('Avg Rating: 90.1 (10 of 12)')
        })

        it('shows nothing, not even a dash, when the item has none', () => {
            expect(document.querySelector('[data-album-id="inv-never"] [data-role="averages"]')).toBe(null)
            expect(text(document.querySelector('[data-album-id="inv-never"]'))).not.toContain('—')
            expect(document.querySelectorAll('[data-role="averages"]')).toHaveLength(3)
        })

        it('the list view shows it too', () => {
            view.controller.handleViewModeChange('list')

            const rows = [...document.querySelectorAll('.inventory-row-wrapper')]
            expect(rows).toHaveLength(4)
            expect(text(rows.find(row => row.dataset.albumId === 'inv-fragile').querySelector('[data-role="averages"]'))).toBe('Avg Rating: 76 (10) · Avg Pop: 40.5% (9)') // read before the size of the album was kept
            expect(rows.find(row => row.dataset.albumId === 'inv-never').querySelector('[data-role="averages"]')).toBe(null)
        })

        it('an album name is text, never markup', () => {
            expect(document.querySelector('[data-album-id="inv-never"] b')).toBe(null)
            expect(text(document.querySelector('[data-album-id="inv-never"]'))).toContain('Arrival <b>x</b>')
        })
    })

    describe('the button "Update ratings"', () => {
        const button = () => document.getElementById('updateRatingsBtn')

        it('is a real button in the filters row, next to the one that adds the albums of the series, reached by the keyboard', () => {
            expect(button().tagName).toBe('BUTTON')
            expect(button().type).toBe('button')
            expect(button().closest('.filters-row')).not.toBe(null)
            expect(button().tabIndex).toBe(0)
            expect(button().disabled).toBe(false)
            expect(button().getAttribute('aria-busy')).toBe('false')
            expect(text(button())).toBe('Update ratings')
            expect(button().previousElementSibling).toBe(document.getElementById('addSeriesAlbumsBtn'))
        })

        it('asks with the app\'s confirmation when there are many albums, and reads on yes', async () => {
            inventoryStore.setAlbums(Array.from({ length: 211 }, (_, index) => item(`inv-${index}`, 'A', `T${index}`)))
            dialogService.confirm.mockResolvedValue(true)
            service.updateAverages.mockResolvedValue({ aborted: false, total: 211, planned: 200, saved: 200, notFound: 11, withoutRatings: 0, popularityNotConnected: 0, unanswered: 0, error: null })

            button().click()
            await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith('Ratings updated for 200 of 211 albums. 11 albums were not found.'))

            expect(dialogService.confirm).toHaveBeenCalledWith({
                title: 'Update ratings?',
                message: 'Read the ratings of 211 albums? This can take a few minutes.',
                confirmText: 'Read ratings'
            })
            expect(button().disabled).toBe(false)
            expect(text(button())).toBe('Update ratings')
        })

        it('while it runs it is disabled, says the progress, and the other action waits; at the end both come back', async () => {
            let finish
            service.updateAverages.mockImplementation(({ onProgress }) => {
                onProgress({ phase: 'reading', done: 40, total: 4 })
                return new Promise(resolve => { finish = resolve })
            })

            button().click()
            await vi.waitFor(() => expect(text(button())).toBe('Reading ratings… 40 of 4'))

            expect(button().disabled).toBe(true)
            expect(button().getAttribute('aria-busy')).toBe('true')
            expect(document.getElementById('addSeriesAlbumsBtn').disabled).toBe(true)
            expect(document.getElementById('addSeriesAlbumsBtn').getAttribute('aria-busy')).toBe('false')

            finish({ aborted: false, total: 4, planned: 3, saved: 3, notFound: 1, withoutRatings: 0, popularityNotConnected: 0, unanswered: 0, error: null })
            await vi.waitFor(() => expect(button().disabled).toBe(false))
            expect(document.getElementById('addSeriesAlbumsBtn').disabled).toBe(false)
            expect(text(button())).toBe('Update ratings')
        })

        it('stays busy when the screen is drawn again in the middle of the run (the store changed)', async () => {
            service.updateAverages.mockImplementation(() => new Promise(() => { }))

            button().click()
            await vi.waitFor(() => expect(button().disabled).toBe(true))
            view.controller.refresh()

            expect(button().disabled).toBe(true)
            expect(button().getAttribute('aria-busy')).toBe('true')
            expect(text(button())).toBe('Reading ratings…')
        })

        it('leaving the screen (the router destroys the view) drops the ask', async () => {
            let signal
            service.updateAverages.mockImplementation((options) => {
                signal = options.signal
                return new Promise(() => { })
            })

            button().click()
            await vi.waitFor(() => expect(signal).toBeDefined())
            view.destroy()

            expect(signal.aborted).toBe(true)
        })
    })
})
