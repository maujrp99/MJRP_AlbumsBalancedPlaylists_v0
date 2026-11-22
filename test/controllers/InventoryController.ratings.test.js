/**
 * F71 (S-56) - the inventory controller: the order by the averages, and "Update ratings" (the
 * person is asked when it is long; the button is busy and says the progress; the end is said as
 * it was; leaving the screen drops the ask).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const service = vi.hoisted(() => ({ updateAlbum: vi.fn(), planSeriesAlbums: vi.fn(), addAlbumsAsNotOwned: vi.fn(), updateAverages: vi.fn() }))
const store = vi.hoisted(() => ({ getAlbums: vi.fn(() => []), subscribe: vi.fn(() => () => { }) }))
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }))

vi.mock('../../public/js/stores/inventory.js', () => ({ inventoryStore: store }))
vi.mock('../../public/js/services/inventory/inventoryWiring.js', () => ({ inventoryService: service, readSeriesOfThePerson: vi.fn() }))
// The values of the inventory (F75) are off in these tests: no Discogs, no rates
vi.mock('../../public/js/services/inventory/inventoryValueWiring.js', async () => ({ inventoryValues: (await import('../helpers/inventoryValuesStub.js')).valuesOff() }))
vi.mock('../../public/js/services/OptimizedAlbumLoader.js', () => ({ optimizedAlbumLoader: {} }))
vi.mock('../../public/js/stores/toasts.js', () => ({ default: toast, toast }))

import { InventoryController } from '../../public/js/controllers/InventoryController.js'

const withAverages = (id, artist, rating, popularity, extra = {}) => ({
    id, title: id, artist, owned: null, ...extra,
    ...(rating === undefined ? {} : { averages: { rating, popularity, ratedTracks: 1, popTracks: 1, at: '2026-11-20T10:00:00.000Z' } })
})
const many = (count) => Array.from({ length: count }, (_, index) => ({ id: `inv-${index}`, title: `T${index}`, artist: 'A', owned: null }))
const done = (extra = {}) => ({ aborted: false, total: 40, planned: 38, saved: 38, notFound: 2, withoutRatings: 0, popularityNotConnected: 0, unanswered: 0, error: null, ...extra })

describe('InventoryController: the order by the averages (F71, S-56)', () => {
    let controller, view
    const shown = () => controller.state.filteredAlbums.map(item => item.id)

    beforeEach(() => {
        vi.clearAllMocks()
        store.getAlbums.mockReturnValue([
            withAverages('low', 'Zed', 60, 90),
            withAverages('none', 'Abe', undefined),
            withAverages('high', 'Mid', 91.5, 10),
            withAverages('pop', 'Bob', 70, 99, { addedToInventory: { seconds: 2000 } }),
            withAverages('newer', 'Cat', undefined, undefined, { addedToInventory: { seconds: 3000 } })
        ])
        view = { render: vi.fn() }
        controller = new InventoryController(view)
        controller.updateStateFromStore()
    })

    it('starts by artist', () => {
        expect(controller.state.sorting).toEqual({ field: 'artist', direction: 'asc' })
        expect(shown()).toEqual(['none', 'pop', 'newer', 'high', 'low'])
    })

    it('Avg Rating: the highest first, and an item with no rating last', () => {
        controller.handleSortChoice('averageRating')

        expect(controller.state.sorting).toEqual({ field: 'averageRating', direction: 'desc' })
        expect(shown()).toEqual(['high', 'pop', 'low', 'none', 'newer'])
        expect(view.render).toHaveBeenCalledTimes(1)
    })

    it('Avg Pop: the highest first', () => {
        controller.handleSortChoice('averagePopularity')

        expect(shown().slice(0, 3)).toEqual(['pop', 'low', 'high'])
    })

    it('Recently added: the newest first, an item with no date last', () => {
        controller.handleSortChoice('addedToInventory')

        expect(shown()).toEqual(['newer', 'pop', 'none', 'high', 'low'])
    })

    it('the order goes on after a filter, and a choice that is not one goes back to artist', () => {
        controller.handleSortChoice('averageRating')
        controller.handleFilterChange('search', 'o')
        expect(shown()).toEqual(['pop', 'low', 'none'])

        controller.handleSortChoice('nonsense')
        expect(controller.state.sorting).toEqual({ field: 'artist', direction: 'asc' })
    })
})

describe('InventoryController: "Update ratings" (F71, S-56)', () => {
    let controller, view, confirm

    beforeEach(() => {
        vi.clearAllMocks()
        vi.spyOn(console, 'error').mockImplementation(() => { })
        store.getAlbums.mockReturnValue(many(40))
        view = { render: vi.fn(), showRatings: vi.fn(), showSeriesAdd: vi.fn() }
        confirm = vi.fn(async () => true)
        controller = new InventoryController(view)
        controller.updateStateFromStore()
        service.updateAverages.mockResolvedValue(done())
    })

    it('with more than 30 albums asks first, with how many and that it takes a while, and reads only after yes', async () => {
        confirm.mockImplementation(async () => {
            expect(service.updateAverages).not.toHaveBeenCalled()
            return true
        })

        await controller.handleUpdateRatings({ confirm })

        expect(confirm).toHaveBeenCalledWith({
            title: 'Update ratings?',
            message: 'Read the ratings of 40 albums? This can take a few minutes.',
            confirmText: 'Read ratings'
        })
        expect(service.updateAverages).toHaveBeenCalledTimes(1)
    })

    it('the person says no: nothing is read and nothing is announced', async () => {
        confirm.mockResolvedValue(false)

        await controller.handleUpdateRatings({ confirm })

        expect(service.updateAverages).not.toHaveBeenCalled()
        expect(toast.success).not.toHaveBeenCalled()
        expect(controller.state.ratings).toEqual({ busy: false, text: null })
    })

    it('with 30 albums or fewer starts at once, with no question', async () => {
        store.getAlbums.mockReturnValue(many(30))
        controller.updateStateFromStore()
        service.updateAverages.mockResolvedValue(done({ total: 30 }))

        await controller.handleUpdateRatings({ confirm })

        expect(confirm).not.toHaveBeenCalled()
        expect(service.updateAverages).toHaveBeenCalledTimes(1)
    })

    it('an empty inventory says so and asks nothing', async () => {
        store.getAlbums.mockReturnValue([])
        controller.updateStateFromStore()

        await controller.handleUpdateRatings({ confirm })

        expect(toast.info).toHaveBeenCalledWith('Your inventory has no albums yet. There are no ratings to read.')
        expect(service.updateAverages).not.toHaveBeenCalled()
    })

    it('reads every item of the inventory, not only the ones the filter shows', async () => {
        controller.handleFilterChange('search', 'T1')

        await controller.handleUpdateRatings({ confirm })

        expect(confirm.mock.calls[0][0].message).toContain('40 albums')
    })

    it('the button is busy from the first read to the end, with what is being done', async () => {
        service.updateAverages.mockImplementation(async ({ onProgress }) => {
            onProgress({ phase: 'reading', done: 0, total: 40 })
            onProgress({ phase: 'reading', done: 25, total: 40 })
            onProgress({ phase: 'saving', saved: 0, total: 38 })
            return done()
        })

        await controller.handleUpdateRatings({ confirm })

        expect(view.showRatings.mock.calls.map(call => call[0])).toEqual([
            { busy: true, text: 'Reading ratings…' },
            { busy: true, text: 'Reading ratings… 0 of 40' },
            { busy: true, text: 'Reading ratings… 25 of 40' },
            { busy: true, text: 'Saving ratings…' },
            { busy: false, text: null }
        ])
        expect(controller.state.ratings).toEqual({ busy: false, text: null })
    })

    it('says the truth at the end: how many got ratings and how many were not found', async () => {
        await controller.handleUpdateRatings({ confirm })

        expect(toast.success).toHaveBeenCalledWith('Ratings updated for 38 of 40 albums. 2 albums were not found.')
    })

    it('says in one sentence that Spotify is not connected', async () => {
        service.updateAverages.mockResolvedValue(done({ notFound: 0, planned: 40, saved: 40, popularityNotConnected: 40 }))

        await controller.handleUpdateRatings({ confirm })

        expect(toast.success).toHaveBeenCalledWith('Ratings updated for 40 of 40 albums. Spotify is not connected: popularity was not read for 40 albums.')
    })

    it('a write that stopped half way is an error that says how many were saved', async () => {
        service.updateAverages.mockResolvedValue(done({ saved: 20, error: 'offline' }))

        await controller.handleUpdateRatings({ confirm })

        expect(toast.error).toHaveBeenCalledWith('Saved ratings for 20 of 38 albums, then a write failed. Run Update ratings again to save the rest.')
        expect(toast.success).not.toHaveBeenCalled()
    })

    it('an ask the person dropped says nothing', async () => {
        service.updateAverages.mockResolvedValue(done({ aborted: true }))

        await controller.handleUpdateRatings({ confirm })

        expect(toast.success).not.toHaveBeenCalled()
        expect(toast.error).not.toHaveBeenCalled()
        expect(controller.state.ratings.busy).toBe(false)
    })

    it('a service that throws is an error toast and the button comes back', async () => {
        service.updateAverages.mockRejectedValue(new Error('boom'))

        await controller.handleUpdateRatings({ confirm })

        expect(toast.error).toHaveBeenCalledWith('Could not update the ratings. Your inventory was not changed.')
        expect(controller.state.ratings.busy).toBe(false)
    })

    it('a second press while it runs does nothing', async () => {
        let finish
        service.updateAverages.mockReturnValue(new Promise(resolve => { finish = resolve }))

        const first = controller.handleUpdateRatings({ confirm })
        await vi.waitFor(() => expect(service.updateAverages).toHaveBeenCalled())
        await controller.handleUpdateRatings({ confirm })
        finish(done())
        await first

        expect(service.updateAverages).toHaveBeenCalledTimes(1)
    })

    it('does nothing while "Add the albums of my series" runs', async () => {
        controller.state.seriesAdd = { busy: true, text: 'Reading your series…' }

        await controller.handleUpdateRatings({ confirm })

        expect(service.updateAverages).not.toHaveBeenCalled()
    })

    it('"Add the albums of my series" does nothing while the ratings are read', async () => {
        controller.state.ratings = { busy: true, text: 'Reading ratings…' }

        await controller.handleAddSeriesAlbums({ confirm })

        expect(service.planSeriesAlbums).not.toHaveBeenCalled()
    })

    it('leaving the screen drops the ask: the signal given to the service is aborted', async () => {
        let signal
        let finish
        service.updateAverages.mockImplementation((options) => {
            signal = options.signal
            return new Promise(resolve => { finish = resolve })
        })

        const running = controller.handleUpdateRatings({ confirm })
        await vi.waitFor(() => expect(signal).toBeDefined())
        expect(signal.aborted).toBe(false)

        controller.dispose()
        expect(signal.aborted).toBe(true)

        finish(done({ aborted: true }))
        await running
        expect(toast.success).not.toHaveBeenCalled()
    })

    it('leaving before the person answered the question starts nothing', async () => {
        confirm.mockImplementation(async () => {
            controller.dispose()
            return true
        })

        await controller.handleUpdateRatings({ confirm })

        expect(service.updateAverages).not.toHaveBeenCalled()
    })

    it('leaving with nothing running does nothing', () => {
        expect(() => controller.dispose()).not.toThrow()
    })
})
