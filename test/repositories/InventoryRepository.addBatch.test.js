/**
 * F71 (S-54) - many albums go into the inventory in ONE write (a Firestore batch: all of them or
 * none), each as an item marked Not Owned that holds what it was given and nothing invented.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const firestore = vi.hoisted(() => {
    const state = { batches: [], nextId: 0 }
    return {
        state,
        collection: vi.fn((db, path) => ({ path })),
        doc: vi.fn((collectionRef) => ({ id: `auto-${++state.nextId}`, path: collectionRef.path })),
        serverTimestamp: vi.fn(() => 'SERVER_TIME'),
        writeBatch: vi.fn(() => {
            const batch = { sets: [], set: vi.fn((ref, data) => batch.sets.push({ ref, data })), commit: vi.fn(async () => { }) }
            state.batches.push(batch)
            return batch
        }),
        getDoc: vi.fn(), getDocs: vi.fn(), setDoc: vi.fn(), updateDoc: vi.fn(), deleteDoc: vi.fn(),
        query: vi.fn(), where: vi.fn(), orderBy: vi.fn(), limit: vi.fn()
    }
})
vi.mock('firebase/firestore', () => firestore)

import { InventoryRepository } from '../../public/js/repositories/InventoryRepository.js'
import { inventoryAlbumFromQuery } from '../../public/js/models/inventoryFromSeries.js'

const build = () => {
    const kept = new Map()
    const cache = {
        get: vi.fn(async (key) => kept.get(key) ?? null),
        set: vi.fn(async (key, value) => { kept.set(key, value) }),
        invalidate: vi.fn(async (key) => { kept.delete(key) })
    }
    return { repository: new InventoryRepository({}, cache, 'user-1'), cache, kept }
}

const core = inventoryAlbumFromQuery({ artist: 'Stone Temple Pilots', title: 'Core', appleMusicId: '1440863531', year: 1992, coverUrl: 'https://example.com/core.jpg' })
const ten = inventoryAlbumFromQuery('Pearl Jam - Ten')

describe('InventoryRepository.addBatch', () => {
    beforeEach(() => {
        firestore.state.batches.length = 0
        firestore.state.nextId = 0
        vi.clearAllMocks()
    })

    it('writes every album in one batch, as a Not Owned item with no format, price or currency invented', async () => {
        const { repository } = build()

        const ids = await repository.addBatch([core, ten])

        expect(ids).toEqual(['auto-1', 'auto-2'])
        expect(firestore.state.batches).toHaveLength(1)
        const [batch] = firestore.state.batches
        expect(batch.commit).toHaveBeenCalledTimes(1)
        expect(batch.sets.map(set => set.ref.path)).toEqual(Array(2).fill('artifacts/mjrp-albums/users/user-1/inventory'))
        expect(batch.sets[0].data).toEqual({
            title: 'Core',
            artist: 'Stone Temple Pilots',
            year: 1992,
            format: null,
            owned: null,
            purchasePrice: null,
            currency: null,
            purchaseDate: null,
            condition: null,
            notes: '',
            albumData: core,
            addedToInventory: 'SERVER_TIME',
            createdAt: 'SERVER_TIME',
            _schemaVersion: 1
        })
        expect(batch.sets[1].data).toMatchObject({ title: 'Ten', artist: 'Pearl Jam', year: null, owned: null })
    })

    it('holds nothing Firestore refuses (no undefined), even for an album with only its names', async () => {
        const { repository } = build()

        await repository.addBatch([{ id: 'a_b', title: 'B', artist: 'A' }])

        const data = firestore.state.batches[0].sets[0].data
        expect(Object.values(data)).not.toContain(undefined)
        expect(data.year).toBe(null)
    })

    it('refuses an album with no title, artist or id before writing anything', async () => {
        const { repository } = build()

        await expect(repository.addBatch([core, { id: 'x', title: '', artist: 'A' }])).rejects.toThrow('Album must have title and artist')
        await expect(repository.addBatch([{ title: 'B', artist: 'A' }])).rejects.toThrow('Album must have an ID')
        expect(firestore.state.batches).toHaveLength(0)
    })

    it('refuses more albums than one Firestore batch holds: the caller sends them in parts', async () => {
        const { repository } = build()
        const tooMany = Array.from({ length: 501 }, (_, index) => ({ id: `a_${index}`, title: `T${index}`, artist: 'A' }))

        await expect(repository.addBatch(tooMany)).rejects.toThrow(/500/)
        expect(firestore.state.batches).toHaveLength(0)
    })

    it('writes nothing and commits nothing for an empty list', async () => {
        const { repository } = build()

        expect(await repository.addBatch([])).toEqual([])
        expect(firestore.state.batches).toHaveLength(0)
    })

    it('a failed commit is thrown, and nothing is said to be written', async () => {
        const { repository } = build()
        firestore.writeBatch.mockImplementationOnce(() => ({ set: vi.fn(), commit: vi.fn(async () => { throw new Error('offline') }) }))

        await expect(repository.addBatch([core])).rejects.toThrow('offline')
    })

    it('forgets the kept list once, not once per album', async () => {
        const { repository, cache } = build()

        await repository.addBatch([core, ten])

        expect(cache.invalidate.mock.calls).toEqual([[repository.getCacheKey('all')]])
    })

    it('the "already in inventory" answer agrees with the new items: the album is found by its id right after', async () => {
        const { repository } = build()
        // before the write the album is not there, and "not there" is never kept
        repository.findAll = vi.fn(async () => [])
        expect(await repository.findByAlbumId(core.id)).toBe(null)

        const [id] = await repository.addBatch([core])
        repository.findAll = vi.fn(async () => [{ id, title: 'Core', artist: 'Stone Temple Pilots', owned: null, albumData: core }])

        expect((await repository.findByAlbumId(core.id))?.id).toBe(id)
        await expect(repository.addAlbum({ id: core.id, title: 'Core', artist: 'Stone Temple Pilots' }, 'cd')).rejects.toThrow('Album already in inventory')
    })
})

describe('InventoryRepository.addAlbum (the item it writes did not change)', () => {
    beforeEach(() => {
        firestore.state.batches.length = 0
        firestore.state.nextId = 0
        vi.clearAllMocks()
    })

    it('writes the item of one album, with the format, the price and the currency the person gave', async () => {
        const { repository } = build()
        repository.findAll = vi.fn(async () => [])
        const album = { id: 'pearl-jam_ten', title: 'Ten', artist: 'Pearl Jam', year: 1991, tracks: [{ title: 'Once' }] }

        await repository.addAlbum(album, 'vinyl', { purchasePrice: 120, currency: 'BRL', notes: 'mint' })

        expect(firestore.setDoc.mock.calls[0][1]).toEqual({
            title: 'Ten',
            artist: 'Pearl Jam',
            year: 1991,
            format: 'vinyl',
            owned: null,
            purchasePrice: 120,
            currency: 'BRL',
            purchaseDate: null,
            condition: null,
            notes: 'mint',
            albumData: album,
            addedToInventory: 'SERVER_TIME',
            createdAt: 'SERVER_TIME',
            _schemaVersion: 1
        })
    })

    it('defaults: CD, USD, Not Owned; and keeps refusing a format or a currency it does not know', async () => {
        const { repository } = build()
        repository.findAll = vi.fn(async () => [])
        const album = { id: 'a_b', title: 'B', artist: 'A', year: 2000 }

        await repository.addAlbum(album)
        expect(firestore.setDoc.mock.calls[0][1]).toMatchObject({ format: 'cd', currency: 'USD', owned: null, purchasePrice: null })

        await expect(repository.addAlbum(album, 'minidisc')).rejects.toThrow(/Format must be one of/)
        await expect(repository.addAlbum(album, 'cd', { currency: 'EUR' })).rejects.toThrow(/Currency must be one of/)
        await expect(repository.addAlbum({ title: 'B', artist: 'A' })).rejects.toThrow('Album must have an ID')
        await expect(repository.addAlbum({ id: 'x', title: 'B' })).rejects.toThrow('Album must have title and artist')
    })
})
