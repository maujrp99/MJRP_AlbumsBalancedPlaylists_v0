/**
 * F61 (UAT-186) - SavedPlaylistsReader: the one owner of the read of the saved playlists.
 * The sources are fakes whose answers the test releases, to put two reads in the air on purpose.
 */
import { describe, it, expect, beforeEach } from 'vitest'

import { SavedPlaylistsReader } from '../../../public/js/services/playlists/SavedPlaylistsReader.js'
import { SavedPlaylistsStore } from '../../../public/js/stores/savedPlaylists.js'
import { ListStatus, SeriesPlaylistsStatus as Status } from '../../../public/js/models/savedPlaylists.js'

const deferred = () => {
    let resolve, reject
    const promise = new Promise((res, rej) => { resolve = res; reject = rej })
    return { promise, resolve, reject }
}
const settle = async () => { for (let i = 0; i < 20; i++) await Promise.resolve() }
const playlist = (id, batchName = 'Batch A', extra = {}) => ({ id, name: `Playlist ${id}`, batchName, savedAt: '2026-11-01T10:00:00Z', tracks: [], ...extra })

/** A source whose every answer waits for the test. */
const heldSource = () => {
    const calls = { series: [], playlists: [], deleted: [] }
    return {
        calls,
        listSeries: (userId) => { const d = deferred(); calls.series.push({ userId, ...d }); return d.promise },
        listPlaylists: (userId, seriesId) => { const d = deferred(); calls.playlists.push({ userId, seriesId, ...d }); return d.promise },
        deletePlaylists: async (userId, seriesId, ids) => { calls.deleted.push({ seriesId, ids }) },
        /** The read of that series still waiting for an answer (the newest one). */
        pending(seriesId) { return calls.playlists.filter(call => call.seriesId === seriesId).pop() }
    }
}

const SERIES = [
    { id: 's1', name: 'Plant', updatedAt: '2026-11-03T00:00:00Z', albumQueries: [{ artist: 'Robert Plant', title: 'Now and Zen', coverUrl: 'https://covers/now.jpg' }] },
    { id: 's2', name: 'Floyd', updatedAt: '2026-11-02T00:00:00Z', albumQueries: ['Pink Floyd - Animals'] },
    { id: 's3', name: 'Purple', updatedAt: '2026-11-01T00:00:00Z', albumQueries: [] }
]

describe('SavedPlaylistsReader', () => {
    let store, source, reader, userId

    beforeEach(() => {
        userId = 'u1'
        store = new SavedPlaylistsStore()
        source = heldSource()
        reader = new SavedPlaylistsReader({ store, source, getUserId: () => userId })
    })

    const answerSeries = async (list = SERIES) => { await settle(); source.calls.series.at(-1).resolve(list); await settle() }
    const answer = async (seriesId, playlists) => { await settle(); source.pending(seriesId).resolve(playlists); await settle() }
    const statuses = () => Object.fromEntries(store.getEntries().map(entry => [entry.seriesId, entry.status]))

    describe('the list appears before the playlists', () => {
        it('each series is loading as soon as the list of series arrives, most recently updated first', async () => {
            reader.load()
            expect(store.getListStatus()).toBe(ListStatus.LOADING)

            await answerSeries([SERIES[2], SERIES[0], SERIES[1]])

            expect(store.getListStatus()).toBe(ListStatus.READY)
            expect(store.getEntries().map(entry => entry.seriesId)).toEqual(['s1', 's2', 's3'])
            expect(statuses()).toEqual({ s1: Status.LOADING, s2: Status.LOADING, s3: Status.LOADING })
        })

        it('a series is ready when ITS playlists arrive, whatever the others are doing, and the order does not move', async () => {
            reader.load()
            await answerSeries()

            await answer('s2', [playlist('p1'), playlist('p2', 'Batch B', { savedAt: '2026-11-05T10:00:00Z' })])

            expect(statuses()).toEqual({ s1: Status.LOADING, s2: Status.READY, s3: Status.LOADING })
            expect(store.getEntry('s2').batches.map(batch => batch.name)).toEqual(['Batch B', 'Batch A'])
            expect(store.getEntries().map(entry => entry.seriesId)).toEqual(['s1', 's2', 's3'])
        })

        it('a series with no playlist is empty, not ready', async () => {
            reader.load()
            await answerSeries()

            await answer('s3', [])

            expect(store.getEntry('s3')).toMatchObject({ status: Status.EMPTY, playlists: [], batches: [] })
        })

        it('load() resolves only when every series has an answer', async () => {
            let finished = false
            reader.load().then(() => { finished = true })
            await answerSeries()
            await answer('s1', [])
            await answer('s2', [])
            expect(finished).toBe(false)

            await answer('s3', [])

            expect(finished).toBe(true)
            expect(store.isBusy()).toBe(false)
        })
    })

    describe('a failure stays where it happened', () => {
        it('the failed read of one series shows on that series and the others go on', async () => {
            reader.load()
            await answerSeries()

            source.pending('s1').reject(new Error('permission-denied'))
            await settle()
            await answer('s2', [playlist('p1')])

            expect(store.getEntry('s1')).toMatchObject({ status: Status.FAILED, error: 'permission-denied' })
            expect(store.getEntry('s2').status).toBe(Status.READY)
            expect(store.getListStatus()).toBe(ListStatus.READY)
        })

        it('"try again" reads that series only', async () => {
            reader.load()
            await answerSeries()
            source.pending('s1').reject(new Error('offline'))
            await answer('s2', [])
            await answer('s3', [])
            const readsBefore = source.calls.playlists.length

            reader.refreshSeries('s1')
            await settle()
            expect(store.getEntry('s1').status).toBe(Status.LOADING)
            await answer('s1', [playlist('p9')])

            expect(source.calls.playlists.slice(readsBefore).map(call => call.seriesId)).toEqual(['s1'])
            expect(store.getEntry('s1')).toMatchObject({ status: Status.READY, error: null })
        })

        it('a list of series that cannot be read is a failed list, and what was on screen stays', async () => {
            reader.load()
            await answerSeries()
            await answer('s1', [playlist('p1')])
            await answer('s2', [])
            await answer('s3', [])

            reader.load({ fresh: true })
            await settle()
            source.calls.series.at(-1).reject(new Error('unavailable'))
            await settle()

            expect(store.getListStatus()).toBe(ListStatus.FAILED)
            expect(store.getListError()).toBe('unavailable')
            expect(store.getEntry('s1').status).toBe(Status.READY)
        })

        it('a read that passes its deadline is a failure with "try again", not an endless wait', async () => {
            reader = new SavedPlaylistsReader({ store, source, getUserId: () => userId, limits: { concurrency: 2, timeoutMs: 20 } })
            reader.load()
            await answerSeries([SERIES[0]])

            await new Promise(resolve => setTimeout(resolve, 40))

            expect(store.getEntry('s1').status).toBe(Status.FAILED)
        })
    })

    describe('an old answer never overwrites a new one', () => {
        it('the answer of a load that was replaced is dropped', async () => {
            reader.load()
            await answerSeries()
            const oldRead = source.pending('s1')

            reader.load({ fresh: true })
            await answerSeries()
            await answer('s1', [playlist('new')])
            oldRead.resolve([playlist('old')])
            await settle()

            expect(store.getEntry('s1').playlists.map(p => p.id)).toEqual(['new'])
        })

        it('the list of series of a load that was replaced is dropped too', async () => {
            reader.load()
            await settle()
            const oldList = source.calls.series.at(-1)

            reader.load({ fresh: true })
            await answerSeries([SERIES[0]])
            oldList.resolve(SERIES)
            await settle()

            expect(store.getEntries().map(entry => entry.seriesId)).toEqual(['s1'])
        })

        it('of two reads of the same series, only the one asked for last writes', async () => {
            reader.load()
            await answerSeries()
            const first = source.pending('s2')

            reader.refreshSeries('s2')
            await settle()
            await answer('s2', [playlist('second')])
            first.resolve([playlist('first')])
            await settle()

            expect(store.getEntry('s2').playlists.map(p => p.id)).toEqual(['second'])
        })

        it('coming back while the first load is still running joins it: no second read', async () => {
            const first = reader.load()
            const second = reader.load()
            await answerSeries()

            expect(second).toBe(first)
            expect(source.calls.series).toHaveLength(1)
            expect(source.calls.playlists).toHaveLength(3)
        })
    })

    describe('coming back to the screen', () => {
        const loadAll = async () => {
            reader.load()
            await answerSeries()
            await answer('s1', [playlist('p1')])
            await answer('s2', [playlist('p2')])
            await answer('s3', [])
        }

        it('what was read stays on the list while it is read again, marked as refreshing', async () => {
            await loadAll()

            reader.load()
            await answerSeries()

            expect(store.getEntry('s1')).toMatchObject({ status: Status.READY, refreshing: true })
            expect(store.getEntry('s1').playlists.map(p => p.id)).toEqual(['p1'])
            expect(store.isBusy()).toBe(true)
        })

        it('an answer equal to what is on the list keeps the same batches (nothing to draw again)', async () => {
            await loadAll()
            const batchesBefore = store.getEntry('s1').batches

            reader.load()
            await answerSeries()
            await answer('s1', [playlist('p1')])

            expect(store.getEntry('s1').batches).toBe(batchesBefore)
            expect(store.getEntry('s1').refreshing).toBe(false)
        })

        it('a different answer replaces what is on the list', async () => {
            await loadAll()

            reader.load()
            await answerSeries()
            await answer('s1', [playlist('p1'), playlist('p7')])

            expect(store.getEntry('s1').playlists.map(p => p.id)).toEqual(['p1', 'p7'])
        })

        it('a series that is gone leaves the list and a new one enters as loading', async () => {
            await loadAll()

            reader.load()
            await answerSeries([SERIES[0], { id: 's4', name: 'New', updatedAt: '2026-11-09T00:00:00Z' }])

            expect(statuses()).toEqual({ s4: Status.LOADING, s1: Status.READY })
        })

        it('a failed re-read keeps the last playlists and says so', async () => {
            await loadAll()

            reader.load()
            await answerSeries()
            source.pending('s1').reject(new Error('offline'))
            await settle()

            expect(store.getEntry('s1')).toMatchObject({ status: Status.FAILED, error: 'offline', refreshing: false })
            expect(store.getEntry('s1').playlists.map(p => p.id)).toEqual(['p1'])
        })

        it('another person starts from an empty list', async () => {
            await loadAll()

            userId = 'u2'
            reader.load()
            await settle()

            expect(store.getEntries()).toEqual([])
            expect(source.calls.series.at(-1).userId).toBe('u2')
        })
    })

    describe('deleting', () => {
        const loadWithBatches = async () => {
            reader.load()
            await answerSeries()
            await answer('s1', [playlist('a1', 'Batch A'), playlist('a2', 'Batch A'), playlist('b1', 'Batch B')])
            await answer('s2', [playlist('x1', undefined, { batchName: undefined })])
            await answer('s3', [])
        }

        it('a batch goes in one write and only its series changes on the list', async () => {
            await loadWithBatches()
            const s2Before = store.getEntry('s2')
            const readsBefore = source.calls.playlists.length

            const removal = reader.removeBatch('s1', 'Batch A')
            await settle()
            await answer('s1', [playlist('a1', 'Batch A'), playlist('a2', 'Batch A'), playlist('b1', 'Batch B')])

            await expect(removal).resolves.toBe(2)
            expect(source.calls.deleted).toEqual([{ seriesId: 's1', ids: ['a1', 'a2'] }])
            expect(source.calls.playlists.slice(readsBefore).map(call => call.seriesId)).toEqual(['s1'])
            expect(store.getEntry('s1').batches.map(batch => batch.name)).toEqual(['Batch B'])
            expect(store.getEntry('s2')).toBe(s2Before)
        })

        it('playlists saved before batches had a name are deleted under the name the card shows', async () => {
            await loadWithBatches()

            const removal = reader.removeBatch('s2', 'Saved Playlists')
            await settle()
            await answer('s2', [{ id: 'x1', name: 'Old', tracks: [] }])

            await expect(removal).resolves.toBe(1)
            expect(source.calls.deleted).toEqual([{ seriesId: 's2', ids: ['x1'] }])
            expect(store.getEntry('s2').status).toBe(Status.EMPTY)
        })

        it('deleting all the playlists of a series leaves it empty', async () => {
            await loadWithBatches()

            const removal = reader.removeAll('s1')
            await settle()
            await answer('s1', [playlist('a1'), playlist('b1', 'Batch B')])

            await expect(removal).resolves.toBe(2)
            expect(store.getEntry('s1')).toMatchObject({ status: Status.EMPTY, batches: [] })
        })

        it('a delete that fails says so and the series is read again, so the list shows what is stored', async () => {
            await loadWithBatches()
            source.deletePlaylists = async () => { throw new Error('write refused') }

            const removal = reader.removeBatch('s1', 'Batch A')
            await settle()
            await answer('s1', [playlist('a1', 'Batch A'), playlist('b1', 'Batch B')])
            await answer('s1', [playlist('a1', 'Batch A'), playlist('b1', 'Batch B')])

            await expect(removal).rejects.toThrow('write refused')
            expect(store.getEntry('s1').playlists.map(p => p.id)).toEqual(['a1', 'b1'])
            expect(store.getEntry('s1').refreshing).toBe(false)
        })
    })

    describe('covers', () => {
        it('a cover the series already stores is on the entry with no lookup; a text query is looked up after', async () => {
            const lookups = []
            const covers = { find: async (artist, title) => { lookups.push(`${artist} / ${title}`); return 'https://covers/animals.jpg' } }
            reader = new SavedPlaylistsReader({ store, source, covers, getUserId: () => userId })
            reader.load()
            await answerSeries()

            await answer('s1', [playlist('p1')])
            await answer('s2', [playlist('p2')])

            expect(store.getEntry('s1').thumbnails).toEqual(['https://covers/now.jpg'])
            expect(store.getEntry('s2').thumbnails).toEqual(['https://covers/animals.jpg'])
            expect(lookups).toEqual(['Pink Floyd / Animals'])
        })

        it('no cover is looked up for a series with no playlists: the list does not show it', async () => {
            const lookups = []
            const covers = { find: async (artist) => { lookups.push(artist); return null } }
            reader = new SavedPlaylistsReader({ store, source, covers, getUserId: () => userId })
            reader.load()
            await answerSeries()

            await answer('s2', [])

            expect(lookups).toEqual([])
        })

        it('a cover is looked up once per series, not again on each read', async () => {
            const lookups = []
            const covers = { find: async (artist) => { lookups.push(artist); return 'https://covers/animals.jpg' } }
            reader = new SavedPlaylistsReader({ store, source, covers, getUserId: () => userId })
            reader.load()
            await answerSeries()
            await answer('s2', [playlist('p2')])

            reader.refreshSeries('s2')
            await settle()
            await answer('s2', [playlist('p2'), playlist('p3')])

            expect(lookups).toEqual(['Pink Floyd'])
            expect(store.getEntry('s2').thumbnails).toEqual(['https://covers/animals.jpg'])
        })
    })
})
