/**
 * F56 (UAT-189) - "give me the albums of these series, ready": the one way a screen that is not
 * the albums screen asks for albums. The interleavings with the load of the albums screen are the
 * point of these tests. Doubles for the catalog, the sources and the cache; the real service,
 * store and queue.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AlbumAsks } from '../../../public/js/services/albums/AlbumAsks.js'
import { AlbumLoadService, AlbumNotFoundError } from '../../../public/js/services/albums/AlbumLoadService.js'
import { AlbumLoadStore } from '../../../public/js/stores/albumLoad.js'
import { AlbumStatus, FailureReason, queryKey } from '../../../public/js/models/albumLoadState.js'
import { AskFailure, SourceGap } from '../../../public/js/models/albumAsk.js'

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const deferred = () => {
    let resolve, reject
    const promise = new Promise((res, rej) => { resolve = res; reject = rej })
    return { promise, resolve, reject }
}
const titleOf = (query) => (typeof query === 'string' ? query.split(' - ').slice(1).join(' - ') : query.title)
const albumOf = (query) => ({ id: `id-${titleOf(query)}`, artist: 'Artist', title: titleOf(query), tracks: [] })
const makeCache = () => {
    const records = new Map()
    return {
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
const findsOf = (catalog) => catalog.find.mock.calls.map(([query]) => titleOf(query))

describe('AlbumAsks.albumsOf', () => {
    let store, catalog, enrichers, cache, service, asks, quiet
    const build = (limits = {}) => {
        service = new AlbumLoadService({ store, catalog, enrichers, cache, limits })
        asks = new AlbumAsks({ service, store })
    }
    const titles = (result) => result.albums.map(album => album.title)

    beforeEach(() => {
        store = new AlbumLoadStore()
        catalog = { find: vi.fn(async (query) => albumOf(query)) }
        enrichers = { acclaim: makeEnricher('done'), popularity: makeEnricher('empty'), userRanking: makeEnricher('empty') }
        cache = makeCache()
        quiet = vi.spyOn(console, 'warn').mockImplementation(() => { })
        build()
    })
    afterEach(() => quiet.mockRestore())

    it('gives the albums that are ready and the ones that failed, with the reason of each', async () => {
        catalog.find = vi.fn(async (query) => {
            if (titleOf(query) === 'Two') throw new AlbumNotFoundError('No catalog has "Artist - Two"')
            return albumOf(query)
        })

        const result = await asks.albumsOf({ series: [series('s1', 'One', 'Two', 'Three')] })

        expect(titles(result)).toEqual(['One', 'Three'])
        expect(result.total).toBe(3)
        expect(result.aborted).toBe(false)
        expect(result.failed).toEqual([
            { seriesId: 's1', key: 'artist - two', label: 'Artist - Two', reason: FailureReason.NOT_FOUND, message: 'No catalog has "Artist - Two"' }
        ])
    })

    it('resolves at once for a series with no album', async () => {
        const result = await asks.albumsOf({ series: [{ id: 's1', albumQueries: [] }] })

        expect(result.albums).toEqual([])
        expect(result.total).toBe(0)
    })

    describe('what is already there is not asked again', () => {
        it('a series the albums screen has loaded costs no call to the catalog', async () => {
            service.load({ scopeKey: 'ALL', series: [series('s1', 'One', 'Two')] })
            await service.whenIdle()
            catalog.find.mockClear()
            const onScreen = store.getAlbums('s1')

            const result = await asks.albumsOf({ series: [series('s1', 'One', 'Two')] })

            expect(catalog.find).not.toHaveBeenCalled()
            expect(result.albums).toEqual(onScreen)
        })

        it('a series loaded earlier and no longer on any screen comes from what the browser keeps', async () => {
            await asks.albumsOf({ series: [series('s9', 'Nine')] })
            expect(store.getEntries('s9')).toEqual([])
            catalog.find.mockClear()

            const result = await asks.albumsOf({ series: [series('s9', 'Nine')] })

            expect(catalog.find).not.toHaveBeenCalled()
            expect(titles(result)).toEqual(['Nine'])
        })
    })

    describe('beside the load of the albums screen', () => {
        it('the screen is still loading and another screen asks: nothing of the screen is cancelled or reset', async () => {
            const slow = deferred()
            catalog.find = vi.fn(async (query) => { if (titleOf(query) === 'Two') await slow.promise; return albumOf(query) })
            service.load({ scopeKey: 'ALL', series: [series('s1', 'One', 'Two')] })
            await wait(10)
            const generation = service.generation
            const loadedOnScreen = store.getEntry('s1', 'artist - one')

            const result = await asks.albumsOf({ series: [series('s9', 'Nine')] })

            expect(titles(result)).toEqual(['Nine'])
            expect(service.generation).toBe(generation)
            expect(store.getEntry('s1', 'artist - one')).toBe(loadedOnScreen)
            expect(store.getEntry('s1', 'artist - two').status).toBe(AlbumStatus.FINDING)

            slow.resolve()
            await service.whenIdle()
            expect(store.getAlbums('s1').map(a => a.title)).toEqual(['One', 'Two'])
            expect(findsOf(catalog).sort()).toEqual(['Nine', 'One', 'Two'])
        })

        it('asking for a series the screen is still loading waits for that same load: one search per album', async () => {
            const slow = deferred()
            catalog.find = vi.fn(async (query) => { await slow.promise; return albumOf(query) })
            service.load({ scopeKey: 'ALL', series: [series('s1', 'One', 'Two')] })
            await wait(10)

            const asked = asks.albumsOf({ series: [series('s1', 'One', 'Two')] })
            slow.resolve()
            const result = await asked

            expect(titles(result)).toEqual(['One', 'Two'])
            expect(catalog.find).toHaveBeenCalledTimes(2)
            expect(store.getAlbums('s1')).toHaveLength(2) // the screen keeps it after the asker is served
        })

        it('the screen changes scope in the middle (a new generation): the ask is served in the new one', async () => {
            const slow = deferred()
            let held = true
            catalog.find = vi.fn(async (query) => { if (held) await slow.promise; return albumOf(query) })
            service.load({ scopeKey: 'ALL', series: [series('s1', 'One')] })
            const asked = asks.albumsOf({ series: [series('s9', 'Nine')] })
            await wait(10)

            held = false
            service.load({ scopeKey: 'SINGLE:s1', series: [series('s1', 'One')] })
            const result = await asked

            expect(titles(result)).toEqual(['Nine'])
            expect(result.aborted).toBe(false)
            slow.resolve()
        })

        it('the load is stopped in the middle ("Clear Cache"): the ask is served by a clean load', async () => {
            const slow = deferred()
            let held = true
            catalog.find = vi.fn(async (query) => { if (held) await slow.promise; return albumOf(query) })
            const asked = asks.albumsOf({ series: [series('s9', 'Nine')] })
            await wait(10)

            held = false
            service.stop()
            const result = await asked

            expect(titles(result)).toEqual(['Nine'])
            slow.resolve()
        })

        it('the screen opens for the first time while the ask waits: both are served', async () => {
            const slow = deferred()
            let held = true
            catalog.find = vi.fn(async (query) => { if (held) await slow.promise; return albumOf(query) })
            const asked = asks.albumsOf({ series: [series('s9', 'Nine')] })
            await wait(10)

            held = false
            service.load({ scopeKey: 'ALL', series: [series('s1', 'One')] })
            const result = await asked
            await service.whenIdle()

            expect(titles(result)).toEqual(['Nine'])
            expect(store.getAlbums('s1').map(a => a.title)).toEqual(['One'])
            slow.resolve()
        })
    })

    describe('asking twice', () => {
        it('two asks for the same series at the same time share one load', async () => {
            const slow = deferred()
            catalog.find = vi.fn(async (query) => { await slow.promise; return albumOf(query) })

            const first = asks.albumsOf({ series: [series('s9', 'Nine', 'Ten')] })
            const second = asks.albumsOf({ series: [series('s9', 'Nine', 'Ten')] })
            await wait(10)
            slow.resolve()
            const [a, b] = await Promise.all([first, second])

            expect(titles(a)).toEqual(['Nine', 'Ten'])
            expect(titles(b)).toEqual(['Nine', 'Ten'])
            expect(catalog.find).toHaveBeenCalledTimes(2)
        })

        it('dropping one of two asks does not drop the load the other waits for', async () => {
            const slow = deferred()
            catalog.find = vi.fn(async (query) => { await slow.promise; return albumOf(query) })
            const leaving = new AbortController()

            const first = asks.albumsOf({ series: [series('s9', 'Nine')], signal: leaving.signal })
            const second = asks.albumsOf({ series: [series('s9', 'Nine')] })
            await wait(10)
            leaving.abort()
            slow.resolve()

            expect((await first).aborted).toBe(true)
            expect(titles(await second)).toEqual(['Nine'])
            expect(catalog.find).toHaveBeenCalledTimes(1)
        })

        it('the series changed between two asks: the album added loads, the removed leaves, the rest is not asked again', async () => {
            await asks.albumsOf({ series: [series('s9', 'A', 'B')] })
            catalog.find.mockClear()

            const result = await asks.albumsOf({ series: [series('s9', 'B', 'C')] })

            expect(titles(result)).toEqual(['B', 'C'])
            expect(findsOf(catalog)).toEqual(['C'])
        })

        it('the series changes on the albums screen while the ask waits: the ask gives the series as it is now', async () => {
            const slow = deferred()
            catalog.find = vi.fn(async (query) => { if (titleOf(query) === 'A') await slow.promise; return albumOf(query) })
            service.load({ scopeKey: 'ALL', series: [series('s1', 'A', 'B')] })
            const asked = asks.albumsOf({ series: [series('s1', 'A', 'B')] })
            await wait(10)

            service.load({ scopeKey: 'ALL', series: [series('s1', 'B', 'C')] })
            const result = await asked

            expect(titles(result)).toEqual(['B', 'C'])
            slow.resolve()
        })
    })

    describe('leaving', () => {
        it('an ask dropped by its screen leaves no load behind: what waited is never asked', async () => {
            const slow = deferred()
            catalog.find = vi.fn(async (query) => { await slow.promise; return albumOf(query) })
            build({ findConcurrency: 1 })
            const leaving = new AbortController()

            const asked = asks.albumsOf({ series: [series('s9', 'Nine', 'Ten', 'Eleven')], signal: leaving.signal })
            await wait(10)
            leaving.abort()
            const result = await asked
            slow.resolve()
            await service.whenIdle()

            expect(result.aborted).toBe(true)
            expect(catalog.find).toHaveBeenCalledTimes(1)
            expect(store.getAllSeriesIds()).toEqual([])
        })

        it('an ask whose signal is already aborted asks for nothing', async () => {
            const leaving = new AbortController()
            leaving.abort()

            const result = await asks.albumsOf({ series: [series('s9', 'Nine')], signal: leaving.signal })

            expect(result.aborted).toBe(true)
            expect(catalog.find).not.toHaveBeenCalled()
        })

        it('once served, a series no screen shows is let go, and the sources nobody named stop', async () => {
            const slow = deferred()
            enrichers.acclaim.enrich = vi.fn(async (album) => { await slow.promise; return { status: 'done', album } })

            const result = await asks.albumsOf({ series: [series('s9', 'Nine')], sources: ['popularity'] })
            slow.resolve()
            await service.whenIdle()

            expect(titles(result)).toEqual(['Nine'])
            expect(store.getAllSeriesIds()).toEqual([])
            expect(cache.saveEnrichment).not.toHaveBeenCalledWith(expect.anything(), expect.anything(), 'acclaim', expect.anything())
        })
    })

    describe('the sources a recipe needs', () => {
        it('waits for the sources named and gives the albums as those sources left them', async () => {
            const slow = deferred()
            enrichers.acclaim.enrich = vi.fn(async (album) => { await slow.promise; return { status: 'done', album: { ...album, rated: true } } })
            let settled = false

            const asked = asks.albumsOf({ series: [series('s9', 'Nine')], sources: ['acclaim'] }).then(result => { settled = true; return result })
            await wait(20)
            expect(settled).toBe(false)
            slow.resolve()
            const result = await asked

            expect(result.albums[0].rated).toBe(true)
            expect(result.missingSources).toEqual([])
        })

        it('a source that fails is told as missing for that album, and the album is still given', async () => {
            enrichers.acclaim.enrich = vi.fn(async (album) => {
                if (album.title === 'Ten') throw new Error('502')
                return { status: 'done', album }
            })

            const result = await asks.albumsOf({ series: [series('s9', 'Nine', 'Ten')], sources: ['acclaim', 'popularity'] })

            expect(titles(result)).toEqual(['Nine', 'Ten'])
            expect(result.missingSources).toEqual([
                { source: 'popularity', seriesId: 's9', key: 'artist - nine', label: 'Artist - Nine', gap: SourceGap.EMPTY },
                { source: 'acclaim', seriesId: 's9', key: 'artist - ten', label: 'Artist - Ten', gap: SourceGap.FAILED },
                { source: 'popularity', seriesId: 's9', key: 'artist - ten', label: 'Artist - Ten', gap: SourceGap.EMPTY }
            ])
        })

        it('the source is behind a deadline: past it, the source is missing and the ask is served', async () => {
            enrichers.acclaim.enrich = vi.fn(() => new Promise(() => { }))
            build({ enrichTimeoutMs: 20 })

            const result = await asks.albumsOf({ series: [series('s9', 'Nine')], sources: ['acclaim'] })

            expect(titles(result)).toEqual(['Nine'])
            expect(result.missingSources[0]).toMatchObject({ source: 'acclaim', gap: SourceGap.FAILED })
        })

        it('the server says "sign in" and holds the ratings: the ask does not wait for them', async () => {
            enrichers.acclaim.enrich = vi.fn(async () => { throw Object.assign(new Error('401'), { hold: { reason: 'unauthorized' } }) })

            const result = await asks.albumsOf({ series: [series('s9', 'Nine')], sources: ['acclaim'] })

            expect(titles(result)).toEqual(['Nine'])
            expect(result.missingSources).toEqual([
                { source: 'acclaim', seriesId: 's9', key: 'artist - nine', label: 'Artist - Nine', gap: SourceGap.WAITING }
            ])
            service.stop()
        })

        it('the server holds the search of an album for longer than a search may take: that album fails, the rest is given', async () => {
            catalog.find = vi.fn(async (query) => {
                if (titleOf(query) === 'Ten') throw Object.assign(new Error('401'), { hold: { reason: 'unauthorized' } })
                return albumOf(query)
            })
            build({ findTimeoutMs: 30 })

            const result = await asks.albumsOf({ series: [series('s9', 'Nine', 'Ten')] })

            expect(titles(result)).toEqual(['Nine'])
            expect(result.failed[0]).toMatchObject({ label: 'Artist - Ten', reason: AskFailure.ON_HOLD })
            service.stop()
        })
    })

    describe('no clock (F58): the ask looks again only when the store says something changed', () => {
        it('an ask that waits starts no interval, and no timer while no hold is in force', async () => {
            const slow = deferred()
            catalog.find = vi.fn(async (query) => { await slow.promise; return albumOf(query) })
            const intervals = vi.spyOn(globalThis, 'setInterval')
            const looks = vi.spyOn(asks, '_read')

            const asked = asks.albumsOf({ series: [series('s9', 'Nine')] })
            await wait(40)
            const looksWhileNothingChanged = looks.mock.calls.length
            await wait(40)

            expect(intervals).not.toHaveBeenCalled()
            expect(looks.mock.calls.length).toBe(looksWhileNothingChanged)

            slow.resolve()
            expect(titles(await asked)).toEqual(['Nine'])
            intervals.mockRestore()
        })

        it('learns of a hold from the store, at once: the ratings held by "sign in" are not waited for', async () => {
            enrichers.acclaim.enrich = vi.fn(async () => { throw Object.assign(new Error('401'), { hold: { reason: 'unauthorized' } }) })
            const started = Date.now()

            const result = await asks.albumsOf({ series: [series('s9', 'Nine')], sources: ['acclaim'] })

            expect(result.missingSources[0]).toMatchObject({ source: 'acclaim', gap: SourceGap.WAITING })
            expect(Date.now() - started).toBeLessThan(500) // the clock it had looked once a second
            service.stop()
        })

        it('a hold that ends before a search would have: the album held is waited for and given', async () => {
            let refusals = 1
            catalog.find = vi.fn(async (query) => {
                if (refusals-- > 0) throw Object.assign(new Error('429'), { hold: { reason: 'rate_limited', retryAfterMs: 30 } })
                return albumOf(query)
            })
            build({ findTimeoutMs: 2000 })

            const result = await asks.albumsOf({ series: [series('s9', 'Nine')] })

            expect(titles(result)).toEqual(['Nine'])
            expect(result.failed).toEqual([])
        })

        it('an ask that was dropped leaves no deadline behind', async () => {
            catalog.find = vi.fn(async () => { throw Object.assign(new Error('401'), { hold: { reason: 'unauthorized' } }) })
            build({ findTimeoutMs: 60 })
            const controller = new AbortController()
            const asked = asks.albumsOf({ series: [series('s9', 'Nine')], signal: controller.signal })
            await wait(15)
            const looks = vi.spyOn(asks, '_read')

            controller.abort()
            expect((await asked).aborted).toBe(true)
            const looksAtTheEnd = looks.mock.calls.length
            await wait(80)

            expect(looks.mock.calls.length).toBe(looksAtTheEnd)
            service.stop()
        })
    })

    it('tells the progress while it waits', async () => {
        const onProgress = vi.fn()

        await asks.albumsOf({ series: [series('s9', 'Nine', 'Ten')], onProgress })

        expect(onProgress).toHaveBeenCalledWith({ total: 2, found: 0, failed: 0, waitingSources: 0 })
        expect(onProgress).toHaveBeenLastCalledWith({ total: 2, found: 2, failed: 0, waitingSources: 0 })
    })
})
