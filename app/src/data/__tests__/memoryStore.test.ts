import { SeriesRepository } from '@album-blender/shared/data/SeriesRepository.js'
import { InventoryRepository } from '@album-blender/shared/data/InventoryRepository.js'
import { STORE_FUNCTIONS } from '@album-blender/shared/data/store.js'
import { createMemoryStore } from '../memoryStore'
import type { Timestamp } from '../memoryStore'
import { checkedStore, CORE_STORE_FUNCTIONS } from '../store'
import { listSeries } from '../seriesList'
import { noCache } from '../noCache'
import { DEMO_SERIES, DEMO_USER_ID, seedDemo } from '../../demo/demoSeed'
import { wirePlatform, unwirePlatformForTests } from '../../platform/wiring'

beforeAll(() => wirePlatform())
afterAll(() => unwirePlatformForTests())

describe('the in-memory store fulfils the core\'s store port (REQ-09)', () => {
    it('hands every function the core\'s repositories call', () => {
        const store = createMemoryStore()
        expect(() => checkedStore(store)).not.toThrow()
        expect(CORE_STORE_FUNCTIONS).toEqual(STORE_FUNCTIONS)
        const keys = Object.keys(store)
        STORE_FUNCTIONS.forEach((name: string) => expect(keys).toContain(name))
    })

    it('the shared SeriesRepository creates, reads, updates and deletes through it', async () => {
        let clock = 1000
        const store = createMemoryStore({ now: () => clock })
        const repository = new SeriesRepository(store, noCache, 'u1')

        const id = await repository.create({ name: 'First', albumQueries: ['Rush - 2112'] })
        expect(id).toMatch(/^[0-9a-f-]{36}$/) // a new id from the core's newId(), wired to expo-crypto
        type Doc = { id: string; name: string; createdAt: Timestamp; _schemaVersion: number }
        const read = async (docId: string) => (await repository.findById(docId)) as Doc | null
        const created = (await read(id))!
        expect(created).toMatchObject({ id, name: 'First', _schemaVersion: 1 })
        expect(created.createdAt.toMillis()).toBe(1000)

        clock = 2000
        await repository.update(id, { name: 'Renamed' })
        expect((await read(id))!.name).toBe('Renamed')
        await expect(repository.update('missing', { name: 'x' })).rejects.toThrow(/No document to update/)

        await repository.delete(id)
        expect(await repository.findById(id)).toBeNull()
    })

    it('a batch is checked first and applied whole', async () => {
        const store = createMemoryStore()
        const repository = new SeriesRepository(store, noCache, 'u1')
        const [a] = await repository.createMany([{ name: 'A' }, { name: 'B' }])
        await expect(repository.updateMany([{ id: a!, data: { name: 'A2' } }, { id: 'missing', data: { name: 'x' } }])).rejects.toThrow()
        expect(((await repository.findById(a!)) as { name: string }).name).toBe('A') // nothing of the failed batch was written
    })

    it('queries filter, order and limit as Firestore does for the repositories', async () => {
        const store = createMemoryStore()
        const inventory = new InventoryRepository(store, noCache, 'u1')
        await inventory.createMany([{ title: 'b', year: 1980 }, { title: 'a', year: 1970 }, { title: 'c', year: 1990 }])
        const found = await inventory.findAll({ where: [['year', '>=', 1975]], orderBy: ['year', 'desc'], limit: 1 })
        expect(found.map((item: { title: string }) => item.title)).toEqual(['c'])
    })
})

describe('the list of series for the Albums tab', () => {
    it('reads the person\'s series through the shared repository, newest first, summarized', async () => {
        const store = createMemoryStore()
        seedDemo(store)
        const rows = await listSeries(store, DEMO_USER_ID)
        expect(rows.map(row => row.name)).toEqual(['Manchester', 'Live records', 'Prog and art rock'])
        expect(rows[1]).toEqual({ id: 'demo-live', name: 'Live records', albumCount: 3, covers: [] })
        expect(rows).toHaveLength(DEMO_SERIES.length)
    })

    it('another person sees none of them', async () => {
        const store = createMemoryStore()
        seedDemo(store)
        expect(await listSeries(store, 'someone-else')).toEqual([])
    })

    it('a failed read reaches the caller as an error, not as an empty list', async () => {
        const store = createMemoryStore()
        seedDemo(store)
        store.failNextRead(new Error('unavailable'))
        await expect(listSeries(store, DEMO_USER_ID)).rejects.toThrow('unavailable')
    })
})
