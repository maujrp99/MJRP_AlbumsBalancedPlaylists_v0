/**
 * F56 (UAT-189, UAT-191) - the load service serving someone who is not the albums screen:
 * a series joins the load in force (join), leaves it when nobody reads it (leave), one album is
 * loaded again through the queue (reloadAlbum), and asking for a series again reloads only what
 * changed, the chosen edition included. Doubles for the catalog, the sources and the cache.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AlbumLoadService } from '../../../public/js/services/albums/AlbumLoadService.js'
import { AlbumLoadStore } from '../../../public/js/stores/albumLoad.js'
import { AlbumStatus, EnrichmentStatus, queryKey } from '../../../public/js/models/albumLoadState.js'

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const deferred = () => {
    let resolve, reject
    const promise = new Promise((res, rej) => { resolve = res; reject = rej })
    return { promise, resolve, reject }
}
const titleOf = (query) => (typeof query === 'string' ? query.split(' - ').slice(1).join(' - ') : query.title)
const albumOf = (query) => ({ id: `id-${titleOf(query)}`, title: titleOf(query), tracks: [], metadata: { sourceId: query?.appleMusicId || null } })

const makeCache = () => {
    const records = new Map()
    return {
        records,
        get: vi.fn(async (query) => records.get(queryKey(query)) || null),
        saveBase: vi.fn(async (query, album) => { records.set(queryKey(query), { album, enrichment: {} }) }),
        saveEnrichment: vi.fn(async (query, album, source, status) => {
            const record = records.get(queryKey(query)) || { enrichment: {} }
            records.set(queryKey(query), { album, enrichment: { ...record.enrichment, [source]: status } })
        })
    }
}
const makeEnricher = (status = 'done') => ({ enrich: vi.fn(async (album) => ({ status, album: { ...album } })) })
const series = (id, ...titles) => ({ id, albumQueries: titles.map(title => `Artist - ${title}`) })

describe('AlbumLoadService: series asked for by another screen', () => {
    let store, catalog, enrichers, cache, service
    const build = (limits = {}) => new AlbumLoadService({ store, catalog, enrichers, cache, limits })
    const statuses = (seriesId) => store.getEntries(seriesId).map(entry => entry.status)
    const found = (seriesId) => store.getAlbums(seriesId).map(album => album.title)

    beforeEach(() => {
        store = new AlbumLoadStore()
        catalog = { find: vi.fn(async (query) => albumOf(query)) }
        enrichers = { acclaim: makeEnricher('done'), popularity: makeEnricher('empty'), userRanking: makeEnricher('empty') }
        cache = makeCache()
        service = build()
    })

    describe('join', () => {
        it('loads a series beside the load of the screen, in the same generation, without touching it', async () => {
            const slow = deferred()
            catalog.find = vi.fn(async (query) => { if (titleOf(query) === 'Two') await slow.promise; return albumOf(query) })
            service.load({ scopeKey: 'ALL', series: [series('s1', 'One', 'Two')] })
            await wait(10)
            const generation = service.generation

            const joined = service.join([series('s9', 'Nine')])
            await wait(10)

            expect(joined).toBe(generation)
            expect(service.generation).toBe(generation)
            expect(found('s9')).toEqual(['Nine'])
            expect(statuses('s1')).toEqual([AlbumStatus.FOUND, AlbumStatus.FINDING])
            expect(store.getSeriesIds()).toEqual(['s1'])

            slow.resolve()
            await service.whenIdle()
            expect(found('s1')).toEqual(['One', 'Two'])
        })

        it('asks the catalog for nothing when the screen already has the series', async () => {
            service.load({ scopeKey: 'ALL', series: [series('s1', 'One', 'Two')] })
            await service.whenIdle()
            catalog.find.mockClear()

            service.join([series('s1', 'One', 'Two')])
            await service.whenIdle()

            expect(catalog.find).not.toHaveBeenCalled()
            expect(found('s1')).toEqual(['One', 'Two'])
        })

        it('puts the series asked for ahead of what the screen still has to load', async () => {
            const order = []
            catalog.find = vi.fn(async (query) => { order.push(titleOf(query)); await wait(2); return albumOf(query) })
            service = build({ findConcurrency: 1 })
            service.load({ scopeKey: 'ALL', series: [series('s1', 'One', 'Two', 'Three', 'Four')] })
            await wait(0)

            service.join([series('s9', 'Nine')])
            await service.whenIdle()

            expect(order.indexOf('Nine')).toBeLessThan(order.indexOf('Three'))
        })

        it('survives the screen changing its own list of series (a page, a filter)', async () => {
            const slow = deferred()
            catalog.find = vi.fn(async (query) => { if (titleOf(query) === 'Nine') await slow.promise; return albumOf(query) })
            service.load({ scopeKey: 'ALL', series: [series('s1', 'One')] })
            service.join([series('s9', 'Nine')])
            await wait(10)

            service.load({ scopeKey: 'ALL', series: [series('s2', 'Two')] })
            slow.resolve()
            await service.whenIdle()

            expect(store.getSeriesIds()).toEqual(['s2'])
            expect(found('s9')).toEqual(['Nine'])
        })

        it('after stop() starts a clean generation instead of reading what the stopped one left', async () => {
            const never = deferred()
            catalog.find = vi.fn(async (query) => { await never.promise; return albumOf(query) })
            service.load({ scopeKey: 'ALL', series: [series('s1', 'One')] })
            await wait(10)
            service.stop()
            catalog.find = vi.fn(async (query) => albumOf(query))

            service.join([series('s1', 'One')])
            await service.whenIdle()

            expect(found('s1')).toEqual(['One'])
        })
    })

    describe('leave', () => {
        it('drops a series nobody reads: what waited is never asked, what was running is not written or kept', async () => {
            const running = deferred()
            catalog.find = vi.fn(async (query) => { await running.promise; return albumOf(query) })
            service = build({ findConcurrency: 1 })
            service.join([series('s9', 'Nine', 'Ten')])
            await wait(10)

            service.leave(['s9'])
            running.resolve()
            await service.whenIdle()

            expect(catalog.find).toHaveBeenCalledTimes(1)
            expect(store.getEntries('s9')).toEqual([])
            expect(store.getAllSeriesIds()).toEqual([])
            expect(cache.saveBase).not.toHaveBeenCalled()
        })

        it('does not stop the load of a series the screen shows', async () => {
            const slow = deferred()
            catalog.find = vi.fn(async (query) => { await slow.promise; return albumOf(query) })
            service.load({ scopeKey: 'ALL', series: [series('s1', 'One')] })
            service.join([series('s1', 'One')])
            await wait(10)

            service.leave(['s1'])
            slow.resolve()
            await service.whenIdle()

            expect(found('s1')).toEqual(['One'])
        })

        it('leaving and asking again at once loads the series; the work that was dropped writes nothing over it', async () => {
            const first = deferred()
            let calls = 0
            catalog.find = vi.fn(async (query) => {
                calls++
                if (calls === 1) { await first.promise; return { ...albumOf(query), stale: true } }
                return albumOf(query)
            })
            service = build({ findConcurrency: 2 })
            service.join([series('s9', 'Nine', 'Ten')])
            await wait(10)

            service.leave(['s9'])
            service.join([series('s9', 'Nine', 'Ten')])
            await wait(10)
            first.resolve()
            await service.whenIdle()

            expect(statuses('s9')).toEqual([AlbumStatus.FOUND, AlbumStatus.FOUND])
            expect(store.getAlbums('s9').some(album => album.stale)).toBe(false)
        })

        it('stops the sources of the series it drops', async () => {
            const slow = deferred()
            enrichers.acclaim.enrich = vi.fn(async (album) => { await slow.promise; return { status: 'done', album: { ...album, rated: true } } })
            service.join([series('s9', 'Nine')])
            await wait(10)

            service.leave(['s9'])
            slow.resolve()
            await service.whenIdle()

            expect(cache.saveEnrichment).not.toHaveBeenCalledWith(expect.anything(), expect.anything(), 'acclaim', expect.anything())
        })
    })

    describe('asking for a series again reloads only what changed (UAT-191)', () => {
        it('an album added loads, an album removed leaves, the rest is not asked again', async () => {
            service.load({ scopeKey: 'ALL', series: [series('s1', 'One', 'Two'), series('s2', 'Three')] })
            await service.whenIdle()
            catalog.find.mockClear()
            const kept = store.getEntry('s1', 'artist - two')
            const other = store.getEntry('s2', 'artist - three')

            service.load({ scopeKey: 'ALL', series: [series('s1', 'Two', 'Four'), series('s2', 'Three')] })
            await service.whenIdle()

            expect(catalog.find.mock.calls.map(([query]) => titleOf(query))).toEqual(['Four'])
            expect(found('s1')).toEqual(['Two', 'Four'])
            expect(store.getEntry('s1', 'artist - two')).toBe(kept)
            expect(store.getEntry('s2', 'artist - three')).toBe(other)
        })

        it('another edition of the same title is found again, from the catalog and not from what is kept', async () => {
            const edition = (id) => ({ id: 's1', albumQueries: [{ artist: 'Artist', title: 'One', appleMusicId: id }, 'Artist - Two'] })
            service.load({ scopeKey: 'ALL', series: [edition('111')] })
            await service.whenIdle()
            catalog.find.mockClear()
            cache.get.mockClear()

            service.load({ scopeKey: 'ALL', series: [edition('222')] })
            await service.whenIdle()

            expect(catalog.find).toHaveBeenCalledTimes(1)
            expect(catalog.find.mock.calls[0][0].appleMusicId).toBe('222')
            expect(cache.get).not.toHaveBeenCalled()
            expect(store.getEntry('s1', 'artist - one').album.metadata.sourceId).toBe('222')
        })

        it('an edition changed while its sources were still being asked: the old answer is not written', async () => {
            const slow = deferred()
            enrichers.acclaim.enrich = vi.fn(async (album) => {
                if (album.metadata.sourceId === '111') await slow.promise
                return { status: 'done', album: { ...album, ratedAs: album.metadata.sourceId } }
            })
            const edition = (id) => ({ id: 's1', albumQueries: [{ artist: 'Artist', title: 'One', appleMusicId: id }] })
            service.load({ scopeKey: 'ALL', series: [edition('111')] })
            await wait(10)

            service.load({ scopeKey: 'ALL', series: [edition('222')] })
            await wait(10)
            slow.resolve()
            await service.whenIdle()

            const entry = store.getEntry('s1', 'artist - one')
            expect(entry.status).toBe(AlbumStatus.FOUND)
            expect(entry.album.ratedAs).toBe('222')
        })
    })

    describe('reloadAlbum (the "Refetch" of one album)', () => {
        it('finds the album again through the queue, ignoring what is kept, and asks its sources again', async () => {
            service.load({ scopeKey: 'ALL', series: [series('s1', 'One', 'Two')] })
            await service.whenIdle()
            catalog.find.mockClear()
            enrichers.acclaim.enrich.mockClear()
            const untouched = store.getEntry('s1', 'artist - two')

            const asked = service.reloadAlbum('id-One')
            expect(store.getEntry('s1', 'artist - one').status).toBe(AlbumStatus.PENDING)
            await service.whenIdle()

            expect(asked).toBe(1)
            expect(catalog.find).toHaveBeenCalledTimes(1)
            expect(enrichers.acclaim.enrich).toHaveBeenCalledTimes(1)
            expect(store.getEntry('s1', 'artist - one').status).toBe(AlbumStatus.FOUND)
            expect(store.getEntry('s1', 'artist - one').enrichment.acclaim).toBe(EnrichmentStatus.DONE)
            expect(store.getEntry('s1', 'artist - two')).toBe(untouched)
        })

        it('reloads the album in every series that has it and says how many', async () => {
            service.load({ scopeKey: 'ALL', series: [series('s1', 'One'), series('s2', 'One', 'Two')] })
            await service.whenIdle()
            catalog.find.mockClear()

            expect(service.reloadAlbum('id-One')).toBe(2)
            await service.whenIdle()

            expect(catalog.find).toHaveBeenCalledTimes(2)
            expect(service.reloadAlbum('id-unknown')).toBe(0)
            expect(service.reloadAlbum(null)).toBe(0)
        })

        it('a source that was still being asked for the old album does not write over the reloaded one', async () => {
            const slow = deferred()
            let asks = 0
            enrichers.acclaim.enrich = vi.fn(async (album) => {
                asks++
                if (asks === 1) { await slow.promise; return { status: 'done', album: { ...album, rated: 'old' } } }
                return { status: 'done', album: { ...album, rated: 'new' } }
            })
            service.load({ scopeKey: 'ALL', series: [series('s1', 'One')] })
            await wait(10)

            service.reloadAlbum('id-One')
            await wait(10)
            slow.resolve()
            await service.whenIdle()

            expect(store.getEntry('s1', 'artist - one').album.rated).toBe('new')
        })

        it('a failure of the reload is the failure of that album, with its reason', async () => {
            service.load({ scopeKey: 'ALL', series: [series('s1', 'One')] })
            await service.whenIdle()
            catalog.find = vi.fn(async () => { throw new Error('offline') })

            service.reloadAlbum('id-One')
            await service.whenIdle()

            expect(store.getEntry('s1', 'artist - one').status).toBe(AlbumStatus.FAILED)
        })
    })
})
