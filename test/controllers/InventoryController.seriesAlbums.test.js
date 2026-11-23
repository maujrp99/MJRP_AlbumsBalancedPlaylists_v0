/**
 * F71 (S-54) - the inventory controller: the status filter and the three counts of the header,
 * the change of a status, and "add the albums of my series" (the person sees what will happen and
 * confirms; the button is busy while it runs; the end is said as it was).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const service = vi.hoisted(() => ({ updateAlbum: vi.fn(), planSeriesAlbums: vi.fn(), addAlbumsAsNotOwned: vi.fn() }))
const readSeriesOfThePerson = vi.hoisted(() => vi.fn())
const store = vi.hoisted(() => ({ getAlbums: vi.fn(() => []), subscribe: vi.fn(() => () => { }) }))
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }))

vi.mock('../../public/js/stores/inventory.js', () => ({ inventoryStore: store }))
vi.mock('../../public/js/services/inventory/inventoryWiring.js', () => ({ inventoryService: service, readSeriesOfThePerson }))
// The values of the inventory (F75) are off in these tests: no Discogs, no rates
vi.mock('../../public/js/services/inventory/inventoryValueWiring.js', async () => ({ inventoryValues: (await import('../helpers/inventoryValuesStub.js')).valuesOff() }))
vi.mock('../../public/js/services/OptimizedAlbumLoader.js', () => ({ optimizedAlbumLoader: {} }))
vi.mock('../../public/js/stores/toasts.js', () => ({ default: toast, toast }))

import { InventoryController } from '../../public/js/controllers/InventoryController.js'

const items = [
    { id: 'core', title: 'Core', artist: 'Stone Temple Pilots', format: 'cd', owned: true, purchasePrice: 50, currency: 'BRL' },
    { id: 'purple', title: 'Purple', artist: 'Stone Temple Pilots', format: 'vinyl', owned: false },
    { id: 'ten', title: 'Ten', artist: 'Pearl Jam', format: 'vinyl', owned: null },
    { id: 'vs', title: 'Vs.', artist: 'Pearl Jam', owned: null }
]

const plan = (toAdd, rest = {}) => ({ toAdd, skipped: [], seriesCount: 2, alreadyThere: 0, repeated: 0, incomplete: 0, ...rest })
const album = (title) => ({ id: title.toLowerCase(), title, artist: 'A' })

describe('InventoryController (F71)', () => {
    let controller, view

    beforeEach(() => {
        vi.clearAllMocks()
        vi.spyOn(console, 'error').mockImplementation(() => { })
        vi.spyOn(console, 'info').mockImplementation(() => { })
        store.getAlbums.mockReturnValue(items)
        view = { render: vi.fn(), showSeriesAdd: vi.fn() }
        controller = new InventoryController(view)
        controller.updateStateFromStore()
    })

    describe('the status filter and the counts of the header', () => {
        const shown = () => controller.state.filteredAlbums.map(item => item.id).sort()
        const counts = () => {
            const { totalCount, ownedCount, notOwnedCount, wishlistCount } = controller.state.stats
            return { totalCount, ownedCount, notOwnedCount, wishlistCount }
        }

        it('with no filter: every item, and one count for each status', () => {
            expect(shown()).toEqual(['core', 'purple', 'ten', 'vs'])
            expect(counts()).toEqual({ totalCount: 4, ownedCount: 1, notOwnedCount: 2, wishlistCount: 1 })
        })

        it('each status shows its items; the three counts stay, "N albums" follows what is shown', () => {
            controller.handleFilterChange('ownership', 'not-owned')
            expect(shown()).toEqual(['ten', 'vs'])
            expect(counts()).toEqual({ totalCount: 2, ownedCount: 1, notOwnedCount: 2, wishlistCount: 1 })

            controller.handleFilterChange('ownership', 'owned')
            expect(shown()).toEqual(['core'])

            controller.handleFilterChange('ownership', 'wishlist')
            expect(shown()).toEqual(['purple'])

            controller.handleFilterChange('ownership', 'all')
            expect(shown()).toEqual(['core', 'purple', 'ten', 'vs'])
        })

        it('the counts are of the items that pass the search and the format', () => {
            controller.handleFilterChange('search', 'pearl')
            expect(counts()).toEqual({ totalCount: 2, ownedCount: 0, notOwnedCount: 2, wishlistCount: 0 })

            controller.handleFilterChange('format', 'vinyl')
            controller.handleFilterChange('ownership', 'not-owned')
            expect(shown()).toEqual(['ten'])
            expect(counts()).toEqual({ totalCount: 1, ownedCount: 0, notOwnedCount: 1, wishlistCount: 0 })
        })

        it('the price paid is no longer added up: the totals are of the estimated value (F75), and a status filter does not empty them', () => {
            expect(controller.state.stats.ownedValueBRL).toBeUndefined()
            const before = controller.state.value.totals
            expect(before.owned).toEqual({ sum: 0, valued: 0, total: 1 })
            expect(before.toBuy).toEqual({ sum: 0, valued: 0, total: 3 })
            controller.handleFilterChange('ownership', 'not-owned')
            expect(controller.state.value.totals).toEqual(before)
        })

        it('a count of the header pressed shows only that status; pressed again, all (F75, REQ-02)', () => {
            controller.handleStatusCount('wishlist')
            expect(shown()).toEqual(['purple'])
            controller.handleStatusCount('owned')
            expect(shown()).toEqual(['core'])
            controller.handleStatusCount('owned')
            expect(shown()).toEqual(['core', 'purple', 'ten', 'vs'])
        })
    })

    describe('changing the status of an item', () => {
        it.each([
            ['owned', true, 'Moved to Collection'],
            ['wishlist', false, 'Moved to Wishlist'],
            ['not-owned', null, 'Marked as Not Owned']
        ])('%s writes owned: %s and says "%s"', async (status, owned, message) => {
            service.updateAlbum.mockResolvedValue('ten')

            await controller.handleStatusChange('ten', status)

            expect(service.updateAlbum).toHaveBeenCalledWith('ten', { owned })
            expect(toast.success).toHaveBeenCalledWith(message)
        })

        it('a write that fails is said, and the screen is drawn again from what is kept', async () => {
            service.updateAlbum.mockRejectedValue(new Error('offline'))

            await controller.handleStatusChange('ten', 'owned')

            expect(toast.error).toHaveBeenCalledWith('Failed to update status')
            expect(toast.success).not.toHaveBeenCalled()
            expect(view.render).toHaveBeenCalled()
        })
    })

    describe('add the albums of my series', () => {
        const series = [{ id: 's1', name: 'Grunge', albumQueries: ['Pearl Jam - Ten'] }]
        let confirm

        beforeEach(() => {
            confirm = vi.fn(async () => true)
            readSeriesOfThePerson.mockResolvedValue(series)
        })

        it('reads the series, shows what will happen, and writes only after the person confirms', async () => {
            const toAdd = Array.from({ length: 176 }, (_, index) => album(`Album ${index}`))
            service.planSeriesAlbums.mockResolvedValue(plan(toAdd, { seriesCount: 47, alreadyThere: 23 }))
            service.addAlbumsAsNotOwned.mockResolvedValue({ added: 176, total: 176, error: null, reloaded: true })
            confirm.mockImplementation(async () => {
                expect(service.addAlbumsAsNotOwned).not.toHaveBeenCalled() // nothing is written before the answer
                return true
            })

            await controller.handleAddSeriesAlbums({ confirm })

            expect(service.planSeriesAlbums).toHaveBeenCalledWith(series)
            expect(confirm).toHaveBeenCalledWith({
                title: 'Add the albums of your series?',
                message: '176 albums from your 47 series will be added as Not Owned. 23 albums already in your inventory stay as they are.',
                confirmText: 'Add 176 albums'
            })
            expect(service.addAlbumsAsNotOwned.mock.calls[0][0]).toBe(toAdd)
            expect(toast.success).toHaveBeenCalledWith('Added 176 albums as Not Owned.')
        })

        it('the person says no: nothing is written and nothing is announced', async () => {
            service.planSeriesAlbums.mockResolvedValue(plan([album('Ten')]))
            confirm.mockResolvedValue(false)

            await controller.handleAddSeriesAlbums({ confirm })

            expect(service.addAlbumsAsNotOwned).not.toHaveBeenCalled()
            expect(toast.success).not.toHaveBeenCalled()
            expect(toast.error).not.toHaveBeenCalled()
            expect(controller.state.seriesAdd.busy).toBe(false)
        })

        it('nothing to add: a notice says so, no question is asked and nothing is written', async () => {
            service.planSeriesAlbums.mockResolvedValue(plan([], { alreadyThere: 199 }))

            await controller.handleAddSeriesAlbums({ confirm })

            expect(toast.info).toHaveBeenCalledWith('Every album of your series is already in your inventory. Nothing was added.')
            expect(confirm).not.toHaveBeenCalled()
            expect(service.addAlbumsAsNotOwned).not.toHaveBeenCalled()
        })

        it('the button is busy from the first read to the end, with what is being done', async () => {
            service.planSeriesAlbums.mockResolvedValue(plan([album('Ten'), album('Vs')]))
            service.addAlbumsAsNotOwned.mockImplementation(async (albums, { onProgress }) => {
                onProgress({ added: 1, total: 2 })
                return { added: 2, total: 2, error: null, reloaded: true }
            })

            await controller.handleAddSeriesAlbums({ confirm })

            expect(view.showSeriesAdd.mock.calls.map(call => call[0])).toEqual([
                { busy: true, text: 'Reading your series…' },
                { busy: true, text: 'Adding 2 albums…' },
                { busy: true, text: 'Adding albums… 1 of 2' },
                { busy: false, text: null }
            ])
            expect(controller.state.seriesAdd).toEqual({ busy: false, text: null })
        })

        it('a second press while it runs does nothing', async () => {
            let answer
            service.planSeriesAlbums.mockReturnValue(new Promise(resolve => { answer = resolve }))

            const first = controller.handleAddSeriesAlbums({ confirm })
            await controller.handleAddSeriesAlbums({ confirm })
            answer(plan([]))
            await first

            expect(readSeriesOfThePerson).toHaveBeenCalledTimes(1)
        })

        it('a write that stopped half way is said as it was: how many went in, and how to add the rest', async () => {
            service.planSeriesAlbums.mockResolvedValue(plan(Array.from({ length: 176 }, (_, index) => album(`Album ${index}`))))
            service.addAlbumsAsNotOwned.mockResolvedValue({ added: 100, total: 176, error: 'offline', reloaded: true })

            await controller.handleAddSeriesAlbums({ confirm })

            expect(toast.error).toHaveBeenCalledWith('Added 100 of 176 albums as Not Owned, then a write failed. 76 albums were not added: run the action again to add the rest.')
            expect(toast.success).not.toHaveBeenCalled()
            expect(controller.state.seriesAdd.busy).toBe(false)
        })

        it('the series or the inventory cannot be read: it says so, asks nothing and writes nothing', async () => {
            readSeriesOfThePerson.mockRejectedValue(new Error('offline'))

            await controller.handleAddSeriesAlbums({ confirm })

            expect(toast.error).toHaveBeenCalledWith('Could not read your series and your inventory. Nothing was added.')
            expect(confirm).not.toHaveBeenCalled()
            expect(service.addAlbumsAsNotOwned).not.toHaveBeenCalled()
            expect(controller.state.seriesAdd.busy).toBe(false)
        })
    })
})
