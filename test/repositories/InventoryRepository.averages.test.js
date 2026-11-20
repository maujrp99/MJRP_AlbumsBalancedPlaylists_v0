/**
 * F71 (S-56) - the averages of many items are written in ONE batch (all of them or none), through
 * `BaseRepository.updateMany`; an update never creates an item and never touches another field.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const firestore = vi.hoisted(() => {
    const state = { batches: [] }
    return {
        state,
        collection: vi.fn((db, path) => ({ path })),
        doc: vi.fn((db, path, id) => ({ id, path: `${path}/${id}` })),
        serverTimestamp: vi.fn(() => 'SERVER_TIME'),
        writeBatch: vi.fn(() => {
            const batch = {
                sets: [],
                updates: [],
                set: vi.fn((ref, data) => batch.sets.push({ ref, data })),
                update: vi.fn((ref, data) => batch.updates.push({ ref, data })),
                commit: vi.fn(async () => { })
            }
            state.batches.push(batch)
            return batch
        }),
        getDoc: vi.fn(), getDocs: vi.fn(), setDoc: vi.fn(), updateDoc: vi.fn(), deleteDoc: vi.fn(),
        query: vi.fn(), where: vi.fn(), orderBy: vi.fn(), limit: vi.fn()
    }
})
vi.mock('firebase/firestore', () => firestore)

import { InventoryRepository } from '../../shared/data/InventoryRepository.js'
import { firestoreStore } from '../../public/js/repositories/firestoreStore.js'

const build = () => {
    const cache = { get: vi.fn(async () => null), set: vi.fn(), invalidate: vi.fn(async () => { }) }
    return { repository: new InventoryRepository(firestoreStore({}), cache, 'user-1'), cache }
}

const averages = (rating, popularity) => ({ rating, popularity, ratedTracks: 10, popTracks: 9, at: '2026-11-20T12:00:00.000Z' })

describe('BaseRepository.updateMany (through the inventory)', () => {
    beforeEach(() => {
        firestore.state.batches.length = 0
        vi.clearAllMocks()
    })

    it('updates every document in one batch, each with its own fields and the time of the update', async () => {
        const { repository } = build()

        const ids = await repository.updateMany([{ id: 'a', data: { notes: 'x' } }, { id: 'b', data: { notes: 'y' } }])

        expect(ids).toEqual(['a', 'b'])
        expect(firestore.state.batches).toHaveLength(1)
        const [batch] = firestore.state.batches
        expect(batch.commit).toHaveBeenCalledTimes(1)
        expect(batch.sets).toEqual([])
        expect(batch.updates.map(update => update.ref.path)).toEqual([
            'artifacts/mjrp-albums/users/user-1/inventory/a', 'artifacts/mjrp-albums/users/user-1/inventory/b'
        ])
        expect(batch.updates[0].data).toEqual({ notes: 'x', updatedAt: 'SERVER_TIME' })
    })

    it('refuses more documents than one Firestore batch holds: the caller sends them in parts', async () => {
        const { repository } = build()
        const tooMany = Array.from({ length: 501 }, (_, index) => ({ id: `i${index}`, data: { notes: 'x' } }))

        await expect(repository.updateMany(tooMany)).rejects.toThrow(/500/)
        expect(firestore.state.batches).toHaveLength(0)
    })

    it('writes and commits nothing for an empty list', async () => {
        const { repository } = build()

        expect(await repository.updateMany([])).toEqual([])
        expect(firestore.state.batches).toHaveLength(0)
    })

    it('a failed commit is thrown and the kept answers are not touched', async () => {
        const { repository, cache } = build()
        firestore.writeBatch.mockImplementationOnce(() => ({ update: vi.fn(), commit: vi.fn(async () => { throw new Error('offline') }) }))

        await expect(repository.updateMany([{ id: 'a', data: { notes: 'x' } }])).rejects.toThrow('offline')
        expect(cache.invalidate).not.toHaveBeenCalled()
    })

    it('forgets what is kept of each document and the kept list, after the commit', async () => {
        const { repository, cache } = build()

        await repository.updateMany([{ id: 'a', data: { notes: 'x' } }, { id: 'b', data: { notes: 'y' } }])

        expect(cache.invalidate.mock.calls.map(call => call[0]).sort()).toEqual(
            [repository.getCacheKey('a'), repository.getCacheKey('b'), repository.getCacheKey('all')].sort()
        )
    })
})

describe('InventoryRepository.setAverages', () => {
    beforeEach(() => {
        firestore.state.batches.length = 0
        vi.clearAllMocks()
    })

    it('writes only the `averages` field of each item, in one batch', async () => {
        const { repository } = build()

        await repository.setAverages([{ id: 'a', averages: averages(80, 50) }, { id: 'b', averages: averages(70.5, null) }])

        const [batch] = firestore.state.batches
        expect(batch.updates).toHaveLength(2)
        expect(batch.updates[0].data).toEqual({ averages: averages(80, 50), updatedAt: 'SERVER_TIME' })
        expect(batch.updates[1].data.averages).toEqual(averages(70.5, null))
    })

    it('holds nothing Firestore refuses (no undefined)', async () => {
        const { repository } = build()

        await repository.setAverages([{ id: 'a', averages: { rating: 80, popularity: undefined, ratedTracks: 1, popTracks: 0, at: 'x' } }])

        expect(Object.keys(firestore.state.batches[0].updates[0].data.averages)).not.toContain('popularity')
    })

    it('refuses an entry with no id or with no averages before writing anything', async () => {
        const { repository } = build()

        await expect(repository.setAverages([{ averages: averages(1, 1) }])).rejects.toThrow('Each update needs the id of an item and its averages')
        await expect(repository.setAverages([{ id: 'a' }])).rejects.toThrow('Each update needs the id of an item and its averages')
        expect(firestore.state.batches).toHaveLength(0)
    })

    it('writes the cover as one field inside albumData, with or without averages (UAT-222)', async () => {
        const { repository } = build()

        await repository.setAverages([{ id: 'a', averages: averages(80, 50), coverUrl: 'https://example.com/a.jpg' }, { id: 'b', coverUrl: 'https://example.com/b.jpg' }])

        const [batch] = firestore.state.batches
        expect(batch.updates[0].data).toEqual({ averages: averages(80, 50), 'albumData.coverUrl': 'https://example.com/a.jpg', updatedAt: 'SERVER_TIME' })
        expect(batch.updates[1].data).toEqual({ 'albumData.coverUrl': 'https://example.com/b.jpg', updatedAt: 'SERVER_TIME' })
    })

    it('the old door still refuses a field it does not know: `averages` is not written by updateAlbum', async () => {
        const { repository } = build()

        await expect(repository.updateAlbum('a', { averages: averages(1, 1) })).rejects.toThrow('No valid fields to update')
    })
})
