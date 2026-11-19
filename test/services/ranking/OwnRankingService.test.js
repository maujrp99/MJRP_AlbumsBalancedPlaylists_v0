/**
 * F46 - the service that owns the person's rankings on the client, with doubles for the repository.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OwnRankingService } from '../../../public/js/services/ranking/OwnRankingService.js'
import { OwnRankingsStore, OwnRankingsStatus } from '../../../public/js/stores/ownRankings.js'
import { isQueryRanked } from '../../../public/js/models/ownRanking.js'

const deferred = () => {
    let resolve, reject
    const promise = new Promise((res, rej) => { resolve = res; reject = rej })
    return { promise, resolve, reject }
}

describe('OwnRankingService', () => {
    let store, userId, getAllRankings, saveRanking, service

    beforeEach(() => {
        store = new OwnRankingsStore()
        userId = 'u1'
        getAllRankings = vi.fn(async () => [{ id: 'pink-floyd_animals', albumId: 'pink-floyd_animals', artistName: 'Pink Floyd', albumTitle: 'Animals' }])
        saveRanking = vi.fn(async () => true)
        service = new OwnRankingService({ store, getUserId: () => userId, getAllRankings, saveRanking })
    })

    it('reads the list once, however many times it is asked for', async () => {
        const first = service.ensureLoaded()
        const second = service.ensureLoaded()
        expect(store.getStatus()).toBe(OwnRankingsStatus.LOADING)

        expect(await first).toBe(true)
        expect(await second).toBe(true)
        expect(await service.ensureLoaded()).toBe(true)

        expect(getAllRankings).toHaveBeenCalledTimes(1)
        expect(getAllRankings).toHaveBeenCalledWith('u1')
        expect(store.getStatus()).toBe(OwnRankingsStatus.READY)
        expect(isQueryRanked('Pink Floyd - Animals', store.getIndex())).toBe(true)
    })

    it('tells whoever listens when the list arrives', async () => {
        const listener = vi.fn()
        store.subscribe(listener)
        await service.ensureLoaded()
        expect(listener).toHaveBeenCalledTimes(2) // loading, ready
    })

    it('a read that failed is marked as failed and tried again on the next call', async () => {
        const quiet = vi.spyOn(console, 'warn').mockImplementation(() => { })
        getAllRankings.mockRejectedValueOnce(new Error('offline'))

        expect(await service.ensureLoaded()).toBe(false)
        expect(store.getStatus()).toBe(OwnRankingsStatus.FAILED)

        expect(await service.ensureLoaded()).toBe(true)
        expect(getAllRankings).toHaveBeenCalledTimes(2)
        quiet.mockRestore()
    })

    it('reads again for another person and drops what it knew of the first', async () => {
        await service.ensureLoaded()
        userId = 'u2'
        getAllRankings.mockResolvedValueOnce([])

        await service.ensureLoaded()

        expect(getAllRankings).toHaveBeenLastCalledWith('u2')
        expect(store.getUserId()).toBe('u2')
        expect(store.getRecords()).toEqual([])
    })

    it('does not keep a list that arrives after the person changed', async () => {
        const slow = deferred()
        getAllRankings.mockReturnValueOnce(slow.promise)
        const reading = service.ensureLoaded()
        userId = 'u2'
        slow.resolve([{ albumId: 'x_y', artistName: 'X', albumTitle: 'Y' }])

        expect(await reading).toBe(false)
        expect(store.getRecords()).toEqual([])
    })

    it('with nobody signed in, reads nothing and saves nothing', async () => {
        userId = null
        expect(await service.ensureLoaded()).toBe(false)
        expect(await service.save({ id: 'a_b', title: 'B', artist: 'A' }, [])).toBe(false)
        expect(getAllRankings).not.toHaveBeenCalled()
        expect(saveRanking).not.toHaveBeenCalled()
    })

    it('saves a ranking through the repository and adds the album to the list, with no new read', async () => {
        await service.ensureLoaded()
        const rankings = [{ trackTitle: 'Dogs', userRank: 1 }]

        const saved = await service.save({ id: 'rush_signals', title: 'Signals', artist: 'Rush' }, rankings)

        expect(saved).toBe(true)
        expect(saveRanking).toHaveBeenCalledWith('u1', 'rush_signals', { albumTitle: 'Signals', artistName: 'Rush', rankings })
        expect(isQueryRanked('Rush - Signals', store.getIndex())).toBe(true)
        expect(getAllRankings).toHaveBeenCalledTimes(1)
    })

    it('a ranking saved before the list was ever read does not pass for the whole list', async () => {
        await service.save({ id: 'rush_signals', title: 'Signals', artist: 'Rush' }, [{ trackTitle: 'x', userRank: 1 }])
        expect(store.getStatus()).toBe(OwnRankingsStatus.IDLE)

        await service.ensureLoaded()
        expect(getAllRankings).toHaveBeenCalledTimes(1)
    })

    it('a save the repository refused changes nothing and says so', async () => {
        saveRanking.mockResolvedValueOnce(false)
        expect(await service.save({ id: 'rush_signals', title: 'Signals', artist: 'Rush' }, [{ trackTitle: 'x', userRank: 1 }])).toBe(false)
        expect(store.getRecords()).toEqual([])
    })

    it('refuses a save with no album id or no ranking list', async () => {
        expect(await service.save({ title: 'Signals' }, [])).toBe(false)
        expect(await service.save({ id: 'a_b' }, null)).toBe(false)
        expect(saveRanking).not.toHaveBeenCalled()
    })
})
