/**
 * The personal ranking is read from the cloud once and then from what the browser keeps (F48, UAT-176).
 * The repository used to hold the CacheManager class instead of the instance, so the cache never acted.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('firebase/firestore', () => ({
    serverTimestamp: vi.fn(() => 'SERVER_TIME'),
    collection: vi.fn(),
    doc: vi.fn((db, ...segments) => ({ path: segments.join('/') })),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    setDoc: vi.fn(async () => {}),
    deleteDoc: vi.fn(async () => {})
}))
vi.mock('../../public/js/firebase-init.js', () => ({ db: {} }))

import { getDoc, setDoc, deleteDoc } from 'firebase/firestore'
import { UserRankingRepository, userRankingRepository, USER_RANKING_TTL_MS } from '../../public/js/repositories/UserRankingRepository.js'
import { cacheManager } from '../../public/js/cache/CacheManager.js'

/** A cache with the three methods of the real one, that remembers the validity it was given. */
const makeCache = () => {
    const entries = new Map()
    return {
        entries,
        get: vi.fn(async (key) => (entries.has(key) ? entries.get(key).value : null)),
        set: vi.fn(async (key, value, ttl) => { entries.set(key, { value, ttl }) }),
        invalidate: vi.fn(async (key) => { entries.delete(key) })
    }
}
const found = (data) => ({ exists: () => true, id: 'alb-1', data: () => data })
const missing = () => ({ exists: () => false })
const ranking = { albumId: 'alb-1', rankings: [{ trackTitle: 'One', userRank: 1 }] }

describe('UserRankingRepository (F48, UAT-176)', () => {
    let cache
    let repository

    beforeEach(() => {
        vi.clearAllMocks()
        cache = makeCache()
        repository = new UserRankingRepository(cache)
        vi.spyOn(console, 'log').mockImplementation(() => {})
    })

    it('the app repository uses the cache instance, not the class', () => {
        expect(userRankingRepository.cache).toBe(cacheManager)
        expect(typeof userRankingRepository.cache.get).toBe('function')
    })

    it('reads a ranking from the cloud once; the second read comes from the cache', async () => {
        getDoc.mockResolvedValue(found(ranking))

        const first = await repository.getRanking('user-1', 'alb-1')
        const second = await repository.getRanking('user-1', 'alb-1')

        expect(first).toMatchObject({ id: 'alb-1', rankings: ranking.rankings })
        expect(second).toEqual(first)
        expect(getDoc).toHaveBeenCalledTimes(1)
    })

    it('also remembers that an album has no ranking, so it is not asked again', async () => {
        getDoc.mockResolvedValue(missing())

        expect(await repository.getRanking('user-1', 'alb-1')).toBeNull()
        expect(await repository.getRanking('user-1', 'alb-1')).toBeNull()
        expect(await repository.hasRanking('user-1', 'alb-1')).toBe(false)
        expect(getDoc).toHaveBeenCalledTimes(1)
    })

    it('keeps what it read for one hour: the ranking may be edited on another device', async () => {
        getDoc.mockResolvedValue(found(ranking))

        await repository.getRanking('user-1', 'alb-1')

        expect(USER_RANKING_TTL_MS).toBe(60 * 60 * 1000)
        expect(cache.set.mock.calls[0][2]).toBe(USER_RANKING_TTL_MS)
    })

    it('does not remember a failed read', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        getDoc.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(found(ranking))

        expect(await repository.getRanking('user-1', 'alb-1')).toBeNull()
        expect(await repository.getRanking('user-1', 'alb-1')).toMatchObject({ rankings: ranking.rankings })
    })

    it('forgets the cached ranking when a new one is saved', async () => {
        getDoc.mockResolvedValue(missing())
        await repository.getRanking('user-1', 'alb-1')

        expect(await repository.saveRanking('user-1', 'alb-1', ranking)).toBe(true)
        getDoc.mockResolvedValue(found(ranking))
        const afterSave = await repository.getRanking('user-1', 'alb-1')

        expect(setDoc).toHaveBeenCalledTimes(1)
        expect(cache.invalidate).toHaveBeenCalledWith('userRanking:user-1:alb-1')
        expect(afterSave).toMatchObject({ rankings: ranking.rankings })
    })

    it('forgets the cached ranking when it is deleted', async () => {
        getDoc.mockResolvedValue(found(ranking))
        await repository.getRanking('user-1', 'alb-1')

        expect(await repository.deleteRanking('user-1', 'alb-1')).toBe(true)
        getDoc.mockResolvedValue(missing())

        expect(deleteDoc).toHaveBeenCalledTimes(1)
        expect(await repository.getRanking('user-1', 'alb-1')).toBeNull()
        expect(await repository.hasRanking('user-1', 'alb-1')).toBe(false)
    })

    it('keeps the rankings of two people apart', async () => {
        getDoc.mockResolvedValueOnce(found(ranking)).mockResolvedValueOnce(missing())

        expect(await repository.getRanking('user-1', 'alb-1')).not.toBeNull()
        expect(await repository.getRanking('user-2', 'alb-1')).toBeNull()
        expect(getDoc).toHaveBeenCalledTimes(2)
    })
})
