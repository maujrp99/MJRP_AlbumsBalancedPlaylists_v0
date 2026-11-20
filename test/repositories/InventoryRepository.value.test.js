/**
 * F75 (S-57) - what the cloud keeps of the value of an item: the value the PERSON wrote (`value`,
 * in USD) and which Discogs edition was used (`discogs`, catalogue data). A price read from
 * Discogs is never written: there is no door for it here.
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
            const batch = { updates: [], set: vi.fn(), update: vi.fn((ref, data) => batch.updates.push({ ref, data })), commit: vi.fn(async () => { }) }
            state.batches.push(batch)
            return batch
        }),
        getDoc: vi.fn(), getDocs: vi.fn(), setDoc: vi.fn(), updateDoc: vi.fn(async () => { }), deleteDoc: vi.fn(),
        query: vi.fn(), where: vi.fn(), orderBy: vi.fn(), limit: vi.fn()
    }
})
vi.mock('firebase/firestore', () => firestore)

import { InventoryRepository } from '../../shared/data/InventoryRepository.js'
import { firestoreStore } from '../../public/js/repositories/firestoreStore.js'

const build = () => new InventoryRepository(firestoreStore({}), { get: vi.fn(async () => null), set: vi.fn(), invalidate: vi.fn(async () => { }) }, 'user-1')
const written = () => firestore.updateDoc.mock.calls.at(-1)[1]

describe('the value the person wrote', () => {
    beforeEach(() => {
        firestore.state.batches.length = 0
        vi.clearAllMocks()
    })

    it('is kept in the item as an amount in USD and when it was written', async () => {
        await build().updateAlbum('a', { value: { amount: 25, currency: 'USD', at: '2026-11-20T12:00:00.000Z' } })

        expect(written()).toMatchObject({ value: { amount: 25, currency: 'USD', at: '2026-11-20T12:00:00.000Z' } })
    })

    it('null takes it away: the album goes back to its reading', async () => {
        await build().updateAlbum('a', { value: null })

        expect(written()).toMatchObject({ value: null })
    })

    it('what is not an amount above zero in USD is refused, and nothing is written', async () => {
        const repository = build()
        for (const value of [{ amount: 0, currency: 'USD' }, { amount: 'ten', currency: 'USD' }, { amount: 10, currency: 'BRL' }, {}]) {
            await expect(repository.updateAlbum('a', { value })).rejects.toThrow()
        }
        expect(firestore.updateDoc).not.toHaveBeenCalled()
    })

    it('anything else sent beside it is not written: no conditions, no reading', async () => {
        await build().updateAlbum('a', { value: { amount: 25, currency: 'USD', at: 'now', conditions: { mint: 1 } }, reading: { mint: 1 }, discogsValue: 12 })

        expect(Object.keys(written()).sort()).toEqual(['updatedAt', 'value'])
        expect(Object.keys(written().value).sort()).toEqual(['amount', 'at', 'currency'])
    })
})

describe('the edition used', () => {
    beforeEach(() => {
        firestore.state.batches.length = 0
        vi.clearAllMocks()
    })

    it('is written for many items in ONE batch: the id of the release, its title and its page, and no price', async () => {
        const discogs = { releaseId: 5012948, title: 'Harvest 1984, Europe', url: 'https://www.discogs.com/release/5012948', conditions: { mint: 15 }, currency: 'USD' }

        const ids = await build().setEditions([{ id: 'a', discogs }, { id: 'b', discogs: { releaseId: 7 } }])

        expect(ids).toEqual(['a', 'b'])
        expect(firestore.state.batches).toHaveLength(1)
        const [first, second] = firestore.state.batches[0].updates.map(update => update.data)
        expect(first).toEqual({ discogs: { releaseId: 5012948, title: 'Harvest 1984, Europe', url: 'https://www.discogs.com/release/5012948' }, updatedAt: 'SERVER_TIME' })
        expect(second.discogs).toEqual({ releaseId: 7, title: null, url: null })
    })

    it('an entry with no item or no release is refused, and nothing is written', async () => {
        await expect(build().setEditions([{ id: 'a', discogs: { releaseId: 'x' } }])).rejects.toThrow()
        await expect(build().setEditions([{ discogs: { releaseId: 7 } }])).rejects.toThrow()
        expect(firestore.state.batches).toHaveLength(0)
    })
})
