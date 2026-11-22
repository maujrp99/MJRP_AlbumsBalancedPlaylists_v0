/**
 * F75 (S-57) - what the cloud keeps of the value of an item: the value the PERSON wrote (`value`,
 * in USD), which Discogs edition was used (`discogs`) and, since the MJRP's decision of 2026-11-21
 * (constitution VI.1, REQ-14), the reading of Discogs itself (`discogsReading`) with the moment it
 * was read. The reading has its own door (`setReadings`) and is never mixed with the written value.
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

    it('anything else sent beside it is not written: no conditions, no reading (a reading has its own door)', async () => {
        await build().updateAlbum('a', { value: { amount: 25, currency: 'USD', at: 'now', conditions: { mint: 1 } }, reading: { mint: 1 }, discogsReading: { kind: 'found' }, discogsValue: 12 })

        expect(Object.keys(written()).sort()).toEqual(['updatedAt', 'value'])
        expect(Object.keys(written().value).sort()).toEqual(['amount', 'at', 'currency'])
    })
})

describe('the edition used', () => {
    beforeEach(() => {
        firestore.state.batches.length = 0
        vi.clearAllMocks()
    })

    it('is written for many items in ONE batch: the id of the release, its title and its page, and no price (the reading has its own door)', async () => {
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

const FOUND = {
    kind: 'found',
    release: { id: 5012948, title: 'Harvest 1984, Europe', url: 'https://www.discogs.com/release/5012948' },
    conditions: { mint: 15, nearMint: 12, veryGoodPlus: 9 },
    currency: 'USD',
    readAt: '2026-11-21T14:05:00.000Z'
}
const updatesOf = () => firestore.state.batches[0].updates

describe('the reading of Discogs (REQ-14, constitution VI.1)', () => {
    beforeEach(() => {
        firestore.state.batches.length = 0
        vi.clearAllMocks()
    })

    it('is written in the item of the person, many items in ONE batch, with when it was read and where it comes from', async () => {
        const ids = await build().setReadings([{ id: 'a', reading: FOUND }, { id: 'b', reading: { kind: 'not_found', readAt: '2026-11-21T14:06:00.000Z' } }])

        expect(ids).toEqual(['a', 'b'])
        expect(firestore.state.batches).toHaveLength(1)
        const [first, second] = updatesOf().map(update => update.data)
        expect(first.discogsReading).toEqual({ ...FOUND, source: 'discogs', basis: null, lowest: null, forSale: null })
        expect(second.discogsReading).toMatchObject({ kind: 'not_found', source: 'discogs', readAt: '2026-11-21T14:06:00.000Z', release: null, conditions: null })
        expect(updatesOf()[0].ref.path).toContain('/users/user-1/inventory')
    })

    it('keeps the lowest price for sale and how many are for sale', async () => {
        await build().setReadings([{ id: 'a', reading: { ...FOUND, conditions: null, basis: 'lowest_for_sale', lowest: { value: 12.93, currency: 'USD' }, forSale: 37 } }])

        expect(updatesOf()[0].data.discogsReading).toMatchObject({ basis: 'lowest_for_sale', lowest: { value: 12.93, currency: 'USD' }, forSale: 37 })
    })

    it('a newer reading replaces the one kept: the whole field is written, nothing of the old one stays', async () => {
        await build().setReadings([{ id: 'a', reading: { kind: 'not_found', readAt: '2026-11-22T10:00:00.000Z' } }])

        expect(updatesOf()[0].data.discogsReading.conditions).toBeNull()
        expect(updatesOf()[0].data.discogsReading.readAt).toBe('2026-11-22T10:00:00.000Z')
    })

    it('touches only the reading, and the edition it was of when it is given: never the value the person wrote', async () => {
        await build().setReadings([{ id: 'a', reading: FOUND, discogs: { releaseId: 5012948, title: 'Harvest', url: 'https://www.discogs.com/release/5012948' } }, { id: 'b', reading: FOUND }])

        expect(Object.keys(updatesOf()[0].data).sort()).toEqual(['discogs', 'discogsReading', 'updatedAt'])
        expect(Object.keys(updatesOf()[1].data).sort()).toEqual(['discogsReading', 'updatedAt'])
    })

    it('what is not a reading is refused, and nothing is written', async () => {
        const repository = build()
        const bad = [
            { id: 'a', reading: { ...FOUND, kind: 'cheap' } },
            { id: 'a', reading: { ...FOUND, readAt: 'yesterday' } },
            { id: 'a', reading: { ...FOUND, conditions: { mint: 'x', nearMint: 1, veryGoodPlus: 1 } } },
            { id: 'a', reading: null },
            { reading: FOUND }
        ]
        for (const entry of bad) await expect(repository.setReadings([entry])).rejects.toThrow()
        expect(firestore.state.batches).toHaveLength(0)
    })
})
