/**
 * F61 (UAT-186) - the fitness test of the saved playlists read: how many times the list goes to the
 * database for N series, how many of those trips wait for one another, and what the screen has to
 * wait for before it draws. The old load made 1 + N reads one after the other (48 for 47 series,
 * never two in the air) and drew nothing until the last one answered.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('firebase/firestore', async () => (await import('../../helpers/fakeFirestore.js')).firestoreModule)

import { fake } from '../../helpers/fakeFirestore.js'
import { SavedPlaylistsReader, READ_LIMITS } from '../../../public/js/services/playlists/SavedPlaylistsReader.js'
import { RepositoryPlaylistsSource } from '../../../public/js/services/playlists/adapters/RepositoryPlaylistsSource.js'
import { SavedPlaylistsStore } from '../../../public/js/stores/savedPlaylists.js'
import { ListStatus } from '../../../public/js/models/savedPlaylists.js'

const USER = 'u1'
const SERIES_PATH = `artifacts/mjrp-albums/users/${USER}/curator/data/series`
const SERIES_COUNT = 47

const seedAccount = (count) => {
    for (let i = 0; i < count; i++) {
        fake.seed(`${SERIES_PATH}/s${i}`, { name: `Series ${i}`, albumQueries: [] })
        if (i % 2 === 0) {
            fake.seed(`${SERIES_PATH}/s${i}/playlists/p1`, { name: 'Greatest Hits Vol. 1', batchName: 'Batch', order: 0, tracks: [] })
        }
    }
}

const build = () => {
    const store = new SavedPlaylistsStore()
    const reader = new SavedPlaylistsReader({
        store,
        source: new RepositoryPlaylistsSource({ db: {}, cache: null }),
        getUserId: () => USER
    })
    return { store, reader }
}

const microtasks = async () => { for (let i = 0; i < 20; i++) await Promise.resolve() }
/** One turn of the fake network: every read in the air answers, and what the answers start is asked for. */
const oneRoundTrip = async () => {
    await microtasks()
    await new Promise(resolve => setTimeout(resolve, 0))
    await microtasks()
}

describe('saved playlists read: the bound on reads (F61 fitness)', () => {
    beforeEach(() => {
        fake.reset()
        seedAccount(SERIES_COUNT)
    })

    it('reads the list of series once and the playlists of each series once: 1 + N, never more', async () => {
        const { reader } = build()

        await reader.load()

        const reads = fake.reads()
        expect(reads).toHaveLength(1 + SERIES_COUNT)
        expect(reads.filter(path => path === SERIES_PATH)).toHaveLength(1)
        expect(new Set(reads).size).toBe(reads.length) // no path is read twice
    })

    it('reads the series together, up to the limit, instead of one after the other', async () => {
        const { reader } = build()

        await reader.load()

        expect(fake.maxReadsAtOnce()).toBe(READ_LIMITS.concurrency)
        expect(READ_LIMITS.concurrency).toBeGreaterThan(1)
    })

    it('the list is on the store after ONE round trip, and the first series after TWO', async () => {
        const { reader, store } = build()

        const done = reader.load()
        expect(store.getListStatus()).toBe(ListStatus.LOADING)

        await oneRoundTrip()
        expect(store.getListStatus()).toBe(ListStatus.READY)
        expect(store.getEntries()).toHaveLength(SERIES_COUNT)
        expect(fake.reads()).toHaveLength(1 + READ_LIMITS.concurrency)

        await oneRoundTrip()
        expect(store.getSummary().settled).toBeGreaterThanOrEqual(READ_LIMITS.concurrency)
        expect(store.getSummary().loading).toBeGreaterThan(0) // the rest is still on its way

        await done
        expect(store.getSummary()).toMatchObject({ total: SERIES_COUNT, ready: 24, empty: 23, failed: 0, loading: 0 })
    })

    it('everything is read in 1 + ceil(N / limit) waits, not in 1 + N', async () => {
        const { reader } = build()
        let turns = 0
        let finished = false

        reader.load().then(() => { finished = true })
        while (!finished && turns < 100) {
            await oneRoundTrip()
            turns++
        }

        const bound = 1 + Math.ceil(SERIES_COUNT / READ_LIMITS.concurrency)
        expect(turns).toBe(bound)
        expect(turns).toBeLessThan(SERIES_COUNT)
    })

    it('trying one series again costs one read, and deleting a batch costs one read and one write', async () => {
        const { reader, store } = build()
        await reader.load()
        const before = fake.reads().length

        await reader.refreshSeries('s2')
        expect(fake.reads().slice(before)).toEqual([`${SERIES_PATH}/s2/playlists`])

        await reader.removeBatch('s4', 'Batch')
        expect(fake.reads().slice(before + 1)).toEqual([`${SERIES_PATH}/s4/playlists`])
        expect(fake.writes()).toEqual(['commit'])
        expect(fake.list(`${SERIES_PATH}/s4/playlists`)).toEqual([])
        expect(store.getEntry('s4').status).toBe('empty')
    })
})
