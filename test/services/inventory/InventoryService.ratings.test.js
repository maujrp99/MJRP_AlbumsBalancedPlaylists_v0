/**
 * F71 (S-56) - "Update ratings", in the service: one ask to the album load for the albums of the
 * inventory, each ready album matched back to its item, the averages written in parts, the store
 * told once at the end, and a typed answer that never throws for a failed part.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { InventoryService, SERIES_WRITE_SIZE } from '../../../public/js/services/inventory/InventoryService.js'
import { InventoryStore } from '../../../public/js/stores/inventory.js'
import { SourceGap } from '../../../public/js/models/albumAsk.js'

const NOW = new Date('2026-11-20T12:00:00.000Z')

const itemOf = (index, extra = {}) => ({
    id: `inv-${index}`, artist: `Artist ${index}`, title: `Album ${index}`, owned: null,
    albumData: { id: `artist-${index}_album-${index}`, appleMusicId: String(1000 + index) }, ...extra
})
const albumOf = (index, rating = 80, popularity = 50) => ({
    id: `artist-${index}_album-${index}`, artist: `Artist ${index}`, title: `Album ${index}`,
    getTracks: (order) => (order === 'acclaim' ? [{ title: 'One', rating, spotifyPopularity: popularity }] : [{ title: 'One' }])
})
const readyAsk = (albums, extra = {}) => ({ albums, missingSources: [], failed: [], total: albums.length, aborted: false, ...extra })

/** A repository that keeps what it is given, as the cloud would. */
const createCloud = () => {
    const cloud = {
        failAtWrite: null,
        writes: [],
        setAverages: vi.fn(async (entries) => {
            if (cloud.failAtWrite === cloud.writes.length + 1) throw new Error('offline')
            cloud.writes.push(entries)
            return entries.map(entry => entry.id)
        })
    }
    return cloud
}

describe('InventoryService.updateAverages', () => {
    let store, service, cloud, albumAsks, quiet

    const build = (items, ask = readyAsk([])) => {
        cloud = createCloud()
        store = new InventoryStore()
        store.setAlbums(items)
        albumAsks = { albumsOf: vi.fn(async () => ask) }
        service = new InventoryService({ store, createRepository: () => cloud, albumAsks })
    }
    const run = (options = {}) => service.updateAverages({ now: () => NOW, ...options })

    beforeEach(() => {
        quiet = [vi.spyOn(console, 'log').mockImplementation(() => { }), vi.spyOn(console, 'error').mockImplementation(() => { })]
        build([])
    })
    afterEach(() => quiet.forEach(spy => spy.mockRestore()))

    it('asks the album load once, for the albums of the items, the ratings and the popularity, with the signal', async () => {
        const items = [itemOf(1), itemOf(2)]
        build(items, readyAsk([albumOf(1), albumOf(2)]))
        const signal = new AbortController().signal

        await run({ signal })

        expect(albumAsks.albumsOf).toHaveBeenCalledTimes(1)
        const request = albumAsks.albumsOf.mock.calls[0][0]
        expect(request.series).toEqual([{
            id: 'inventory-ratings',
            albumQueries: [
                { artist: 'Artist 1', title: 'Album 1', appleMusicId: '1001', year: null, coverUrl: null },
                { artist: 'Artist 2', title: 'Album 2', appleMusicId: '1002', year: null, coverUrl: null }
            ]
        }])
        expect(request.sources).toEqual(['acclaim', 'popularity'])
        expect(request.signal).toBe(signal)
    })

    it('says how the reading goes: albums done of the total, then that it is saving', async () => {
        build([itemOf(1), itemOf(2), itemOf(3)])
        albumAsks.albumsOf.mockImplementation(async ({ onProgress }) => {
            onProgress({ total: 3, found: 1, failed: 0, waitingSources: 1 }) // found, but its sources not in yet: not done
            onProgress({ total: 3, found: 2, failed: 1, waitingSources: 0 })
            return readyAsk([albumOf(1), albumOf(2)], { failed: [{ label: 'x' }], total: 3 })
        })
        const steps = []

        await run({ onProgress: step => steps.push(step) })

        expect(steps).toEqual([
            { phase: 'reading', done: 0, total: 3 },
            { phase: 'reading', done: 3, total: 3 },
            { phase: 'saving', saved: 0, total: 2 },
            { phase: 'saving', saved: 2, total: 2 }
        ])
    })

    it('writes the averages of each matched item, with the time, and tells the store once at the end', async () => {
        const items = [itemOf(1, { notes: 'mine', owned: true }), itemOf(2)]
        build(items, readyAsk([albumOf(1, 90, 60), albumOf(2, 70, 40)]))
        const notified = vi.fn()
        store.subscribe(notified)

        const result = await run()

        expect(cloud.writes).toEqual([[
            { id: 'inv-1', averages: { rating: 90, popularity: 60, ratedTracks: 1, popTracks: 1, at: NOW.toISOString() } },
            { id: 'inv-2', averages: { rating: 70, popularity: 40, ratedTracks: 1, popTracks: 1, at: NOW.toISOString() } }
        ]])
        expect(notified).toHaveBeenCalledTimes(1)
        expect(store.getAlbums()[0]).toMatchObject({ id: 'inv-1', notes: 'mine', owned: true, averages: { rating: 90 } })
        expect(result).toEqual({
            aborted: false, total: 2, planned: 2, saved: 2, notFound: 0, withoutRatings: 0, popularityNotConnected: 0, unanswered: 0, error: null
        })
    })

    it('writes in parts of the size the series write uses', async () => {
        const items = Array.from({ length: SERIES_WRITE_SIZE * 2 + 30 }, (_, index) => itemOf(index))
        build(items, readyAsk(items.map((item, index) => albumOf(index))))

        const result = await run()

        expect(cloud.writes.map(part => part.length)).toEqual([100, 100, 30])
        expect(result).toMatchObject({ saved: 230, planned: 230, error: null })
    })

    it('a part that fails stops the run: the answer says how many were saved, the parts before stay, and the screen shows them', async () => {
        const items = Array.from({ length: 250 }, (_, index) => itemOf(index))
        build(items, readyAsk(items.map((item, index) => albumOf(index))))
        cloud.failAtWrite = 2

        const result = await run()

        expect(result).toMatchObject({ saved: 100, planned: 250, error: 'offline' })
        expect(cloud.setAverages).toHaveBeenCalledTimes(2) // the third part is not tried
        expect(store.getAlbums().filter(item => item.averages)).toHaveLength(100)
    })

    it('never throws for a failed write', async () => {
        build([itemOf(1)], readyAsk([albumOf(1)]))
        cloud.failAtWrite = 1

        await expect(run()).resolves.toMatchObject({ saved: 0, planned: 1, error: 'offline' })
        expect(store.getAlbums()[0].averages).toBeUndefined()
    })

    it('an album whose source gave nothing keeps the number the item had', async () => {
        const items = [itemOf(1, { averages: { rating: 66, popularity: 33, ratedTracks: 4, popTracks: 4, at: '2026-01-01T00:00:00.000Z' } })]
        build(items, readyAsk([{ ...albumOf(1), getTracks: (order) => (order === 'acclaim' ? [{ title: 'One', rating: 70 }] : [{ title: 'One' }]) }]))

        await run()

        expect(cloud.writes[0][0].averages).toEqual({ rating: 70, popularity: 33, ratedTracks: 1, popTracks: 4, at: NOW.toISOString() })
    })

    it('counts the albums not found, and says which source was missing', async () => {
        const items = [itemOf(1), itemOf(2), itemOf(3)]
        build(items, readyAsk([albumOf(1, 80, -1), albumOf(2, 80, -1)], {
            failed: [{ label: 'Artist 3 - Album 3', reason: 'not found' }],
            total: 3,
            missingSources: [
                { source: 'popularity', key: 'a', label: 'Artist 1 - Album 1', gap: SourceGap.NOT_CONNECTED },
                { source: 'popularity', key: 'b', label: 'Artist 2 - Album 2', gap: SourceGap.NOT_CONNECTED }
            ]
        }))

        const result = await run()

        expect(result).toMatchObject({ total: 3, planned: 2, saved: 2, notFound: 1, popularityNotConnected: 2 })
        expect(cloud.writes[0][0].averages).toMatchObject({ rating: 80, popularity: null, popTracks: 0 })
    })

    it('an ask the person dropped (they left the screen) writes nothing and says so', async () => {
        build([itemOf(1)], readyAsk([], { aborted: true }))

        const result = await run()

        expect(result.aborted).toBe(true)
        expect(cloud.setAverages).not.toHaveBeenCalled()
    })

    it('an inventory with no item asks nothing and writes nothing', async () => {
        build([])

        const result = await run()

        expect(albumAsks.albumsOf).not.toHaveBeenCalled()
        expect(result).toMatchObject({ total: 0, saved: 0, planned: 0, error: null })
    })

    it('the person changed while the ask was on its way: nothing is written into another account', async () => {
        build([itemOf(1)])
        albumAsks.albumsOf.mockImplementation(async () => {
            service.repository = { setAverages: vi.fn() } // another person arrived
            return readyAsk([albumOf(1)])
        })

        const result = await run()

        expect(result.aborted).toBe(true)
        expect(cloud.setAverages).not.toHaveBeenCalled()
    })

    it('an ask that is given a failed album of an item the store no longer has writes nothing for it', async () => {
        build([itemOf(1)], readyAsk([albumOf(9)]))

        const result = await run()

        expect(result).toMatchObject({ planned: 0, saved: 0, notFound: 1 })
        expect(cloud.setAverages).not.toHaveBeenCalled()
    })
})
