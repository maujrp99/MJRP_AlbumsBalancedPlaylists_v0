/**
 * F45 (UAT-172, 173) - the store that owns "album asked for -> album and its load state".
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AlbumLoadStore } from '../../public/js/stores/albumLoad.js'
import { createEntry, AlbumStatus, SeriesStatus, EnrichmentStatus } from '../../public/js/models/albumLoadState.js'

const allDone = { acclaim: EnrichmentStatus.DONE, popularity: EnrichmentStatus.EMPTY, userRanking: EnrichmentStatus.EMPTY }

describe('AlbumLoadStore', () => {
    let store

    beforeEach(() => {
        store = new AlbumLoadStore()
        store.startGeneration(1)
        store.setSeriesOrder(['s1', 's2'])
        store.setSeriesEntries('s1', [createEntry('s1', 'A - One'), createEntry('s1', 'A - Two')])
        store.setSeriesEntries('s2', [])
        store.flush()
    })

    it('keeps the entries of each series apart, in the order they were asked for', () => {
        expect(store.getEntries('s1').map(e => e.key)).toEqual(['a - one', 'a - two'])
        expect(store.getEntries('s2')).toEqual([])
        expect(store.getEntries('unknown')).toEqual([])
    })

    it('derives the state of a series instead of storing it', () => {
        expect(store.getSeriesState('s1').status).toBe(SeriesStatus.LOADING)
        expect(store.getSeriesState('s2').status).toBe(SeriesStatus.EMPTY)

        store.patchEntry('s1', 'a - one', { status: AlbumStatus.FOUND, album: { title: 'One' } })
        store.patchEntry('s1', 'a - two', { status: AlbumStatus.FAILED, error: { reason: 'timeout' } })

        expect(store.getSeriesState('s1')).toMatchObject({ status: SeriesStatus.FAILED, found: 1, failed: 1 })
        expect(store.isLoading()).toBe(false)
    })

    it('replaces an entry on patch and never mutates the one it handed out', () => {
        const before = store.getEntry('s1', 'a - one')
        store.patchEntry('s1', 'a - one', { status: AlbumStatus.FINDING, enrichment: { acclaim: EnrichmentStatus.LOADING } })
        const after = store.getEntry('s1', 'a - one')

        expect(after).not.toBe(before)
        expect(before.status).toBe(AlbumStatus.PENDING)
        expect(after.enrichment).toEqual({ ...before.enrichment, acclaim: EnrichmentStatus.LOADING })
    })

    it('refuses a patch for an entry that is not there', () => {
        expect(store.patchEntry('s1', 'nope', { status: AlbumStatus.FOUND })).toBe(false)
        expect(store.patchEntry('gone', 'a - one', { status: AlbumStatus.FOUND })).toBe(false)
    })

    it('lists only found albums, and "ready" only when enrichment has finished', () => {
        store.patchEntry('s1', 'a - one', { status: AlbumStatus.FOUND, album: { title: 'One' }, enrichment: allDone })
        store.patchEntry('s1', 'a - two', { status: AlbumStatus.FOUND, album: { title: 'Two' } })

        expect(store.getAlbums('s1').map(a => a.title)).toEqual(['One', 'Two'])
        expect(store.getReadyAlbums('s1').map(a => a.title)).toEqual(['One'])
        expect(store.getAllAlbums()).toHaveLength(2)
    })

    it('drops the series that left the load when the order is set again', () => {
        store.setSeriesOrder(['s2'])

        expect(store.getSeriesIds()).toEqual(['s2'])
        expect(store.getEntries('s1')).toEqual([])
    })

    it('a new generation starts empty', () => {
        store.startGeneration(2)

        expect(store.getGeneration()).toBe(2)
        expect(store.getSeriesIds()).toEqual([])
        expect(store.getAllAlbums()).toEqual([])
    })

    it('gives one notice for several changes in the same tick', async () => {
        const listener = vi.fn()
        store.subscribe(listener)

        store.patchEntry('s1', 'a - one', { status: AlbumStatus.FINDING })
        store.patchEntry('s1', 'a - two', { status: AlbumStatus.FINDING })
        store.patchEntry('s1', 'a - one', { status: AlbumStatus.FOUND, album: {} })
        expect(listener).not.toHaveBeenCalled()

        await Promise.resolve()
        expect(listener).toHaveBeenCalledTimes(1)
    })

    it('subscribe returns the function that ends the subscription', () => {
        const listener = vi.fn()
        const unsubscribe = store.subscribe(listener)
        unsubscribe()

        store.patchEntry('s1', 'a - one', { status: AlbumStatus.FINDING })
        store.flush()

        expect(listener).not.toHaveBeenCalled()
    })

    describe('series asked for by another screen (F56)', () => {
        it('a guest series is kept when the screen changes its own list, and is not part of that list', () => {
            store.addGuest('g1')
            store.setSeriesEntries('g1', [createEntry('g1', 'A - Guest')])

            store.setSeriesOrder(['s2'])

            expect(store.getSeriesIds()).toEqual(['s2'])
            expect(store.getEntries('s1')).toEqual([])
            expect(store.getEntries('g1').map(e => e.key)).toEqual(['a - guest'])
            expect(store.getAllSeriesIds()).toEqual(['s2', 'g1'])
        })

        it('a guest does not count as the screen loading, nor in the albums of the screen', () => {
            store.patchEntry('s1', 'a - one', { status: AlbumStatus.FOUND, album: { title: 'One' }, enrichment: allDone })
            store.patchEntry('s1', 'a - two', { status: AlbumStatus.FAILED })
            store.addGuest('g1')
            store.setSeriesEntries('g1', [createEntry('g1', 'A - Guest')])

            expect(store.isLoading()).toBe(false)
            expect(store.getAllAlbums().map(a => a.title)).toEqual(['One'])
            expect(Object.keys(store.getSeriesStates())).toEqual(['s1', 's2'])
        })

        it('removing a guest that the screen does not show drops its entries and says so', () => {
            store.addGuest('g1')
            store.setSeriesEntries('g1', [createEntry('g1', 'A - Guest')])

            expect(store.removeGuest('g1')).toBe(true)
            expect(store.getEntries('g1')).toEqual([])
            expect(store.getAllSeriesIds()).toEqual(['s1', 's2'])
        })

        it('removing a guest that the screen also shows keeps its entries', () => {
            store.addGuest('s1')

            expect(store.removeGuest('s1')).toBe(false)
            expect(store.getEntries('s1')).toHaveLength(2)
        })

        it('a new generation drops the entries of a guest and remembers that it is asked for', () => {
            store.addGuest('g1')
            store.setSeriesEntries('g1', [createEntry('g1', 'A - Guest')])

            store.startGeneration(2)
            store.setSeriesOrder([])

            expect(store.getEntries('g1')).toEqual([])
            expect(store.isGuest('g1')).toBe(true)
        })
    })

    describe('the hold (F58): the server said "sign in" or "wait"', () => {
        it('has no hold until one is set', () => {
            expect(store.getHold()).toBeNull()
        })

        it('keeps the hold it is given and tells whoever subscribed, when it starts and when it ends', () => {
            const listener = vi.fn()
            store.subscribe(listener)

            store.setHold({ reason: 'rate_limited', until: 5000 })
            store.flush()
            expect(store.getHold()).toEqual({ reason: 'rate_limited', until: 5000 })
            expect(listener).toHaveBeenCalledTimes(1)

            store.setHold(null)
            store.flush()
            expect(store.getHold()).toBeNull()
            expect(listener).toHaveBeenCalledTimes(2)
        })

        it('the same hold set again is not a change', () => {
            const hold = { reason: 'unauthorized', until: null }
            store.setHold(hold)
            store.flush()
            const listener = vi.fn()
            store.subscribe(listener)

            store.setHold(hold)
            store.flush()

            expect(listener).not.toHaveBeenCalled()
        })

        it('touches no entry: nothing of an album is marked by a hold', () => {
            const before = store.getEntries('s1')

            store.setHold({ reason: 'unauthorized', until: null })

            expect(store.getEntries('s1')).toEqual(before)
            expect(store.getSeriesState('s1').failed).toBe(0)
        })
    })

    describe('a load that was stopped (F58)', () => {
        it('is not stopped while it runs', () => {
            expect(store.isStopped()).toBe(false)
        })

        it('keeps what the load left and tells whoever subscribed that nothing more will come', () => {
            const listener = vi.fn()
            store.subscribe(listener)

            store.stopGeneration()
            store.flush()

            expect(store.isStopped()).toBe(true)
            expect(store.getEntries('s1')).toHaveLength(2)
            expect(store.getGeneration()).toBe(1)
            expect(listener).toHaveBeenCalledTimes(1)
        })

        it('a new generation is not stopped', () => {
            store.stopGeneration()

            store.startGeneration(2)

            expect(store.isStopped()).toBe(false)
        })
    })

    it('a listener that throws does not stop the others', () => {
        const second = vi.fn()
        const quiet = vi.spyOn(console, 'error').mockImplementation(() => { })
        store.subscribe(() => { throw new Error('bad listener') })
        store.subscribe(second)

        store.patchEntry('s1', 'a - one', { status: AlbumStatus.FINDING })
        store.flush()

        expect(second).toHaveBeenCalledTimes(1)
        quiet.mockRestore()
    })
})
