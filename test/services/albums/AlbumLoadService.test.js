/**
 * F45 (UAT-172, 173, 174) - the service that owns the album load, with doubles for the catalog,
 * the enrichment sources and the cache. No network, no Firestore, no screen.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AlbumLoadService, AlbumNotFoundError } from '../../../public/js/services/albums/AlbumLoadService.js'
import { AlbumLoadStore } from '../../../public/js/stores/albumLoad.js'
import { AlbumStatus, EnrichmentStatus, SeriesStatus, FailureReason, queryKey } from '../../../public/js/models/albumLoadState.js'

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const deferred = () => {
    let resolve, reject
    const promise = new Promise((res, rej) => { resolve = res; reject = rej })
    return { promise, resolve, reject }
}
const deepFreeze = (object) => {
    Object.values(object).forEach(value => { if (value && typeof value === 'object') deepFreeze(value) })
    return Object.freeze(object)
}
const titleOf = (query) => (typeof query === 'string' ? query.split(' - ').slice(1).join(' - ') : query.title)

const makeCatalog = (overrides = {}) => ({
    find: vi.fn(async (query) => deepFreeze({ title: titleOf(query), tracks: [{ title: 't1' }] })),
    ...overrides
})
const makeEnricher = (status = 'done', mark = 'x') => ({
    enrich: vi.fn(async (album) => ({ status, album: { ...album, [mark]: true } }))
})
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
const series = (id, ...titles) => ({ id, albumQueries: titles.map(title => `Artist - ${title}`) })

describe('AlbumLoadService', () => {
    let store, catalog, enrichers, cache, service
    const build = (limits = {}) => new AlbumLoadService({ store, catalog, enrichers, cache, limits })

    beforeEach(() => {
        store = new AlbumLoadStore()
        catalog = makeCatalog()
        enrichers = {
            acclaim: makeEnricher('done', 'rated'),
            popularity: makeEnricher('empty', 'popular'),
            userRanking: makeEnricher('empty', 'ranked')
        }
        cache = makeCache()
        service = build()
    })

    it('loads every album of every series and leaves each series complete', async () => {
        service.load({ scopeKey: 'ALL', series: [series('s1', 'One', 'Two'), series('s2', 'Three')] })
        await service.whenIdle()

        expect(store.getAlbums('s1').map(a => a.title)).toEqual(['One', 'Two'])
        expect(store.getAlbums('s2').map(a => a.title)).toEqual(['Three'])
        expect(store.getSeriesState('s1').status).toBe(SeriesStatus.COMPLETE)
        expect(store.getSeriesState('s2').status).toBe(SeriesStatus.COMPLETE)
        expect(store.isLoading()).toBe(false)
    })

    it('publishes the album as soon as the catalog answers, before the slow source has finished', async () => {
        const slow = deferred()
        enrichers.acclaim.enrich = vi.fn(async (album) => { await slow.promise; return { status: 'done', album: { ...album, rated: true } } })

        service.load({ scopeKey: 'ALL', series: [series('s1', 'One')] })
        await wait(20)

        const entry = store.getEntries('s1')[0]
        expect(entry.status).toBe(AlbumStatus.FOUND)
        expect(entry.album.title).toBe('One')
        expect(entry.enrichment.acclaim).toBe(EnrichmentStatus.LOADING)
        expect(store.getReadyAlbums('s1')).toHaveLength(0)

        slow.resolve()
        await service.whenIdle()
        expect(store.getEntries('s1')[0].enrichment.acclaim).toBe(EnrichmentStatus.DONE)
        expect(store.getReadyAlbums('s1')).toHaveLength(1)
    })

    it('an album the catalog does not have ends as "failed: not found", and the series stays, as failed', async () => {
        catalog.find = vi.fn(async (query) => {
            if (titleOf(query) === 'Missing') throw new AlbumNotFoundError()
            return { title: titleOf(query), tracks: [] }
        })

        service.load({ scopeKey: 'ALL', series: [series('s1', 'One', 'Missing')] })
        await service.whenIdle()

        const missing = store.getEntries('s1')[1]
        expect(missing.status).toBe(AlbumStatus.FAILED)
        expect(missing.error.reason).toBe(FailureReason.NOT_FOUND)
        expect(store.getSeriesState('s1')).toMatchObject({ status: SeriesStatus.FAILED, found: 1, failed: 1 })
    })

    it('an album whose search never answers fails at its deadline and does not hold the others', async () => {
        catalog.find = vi.fn((query) => titleOf(query) === 'Stuck'
            ? new Promise(() => { })
            : Promise.resolve({ title: titleOf(query), tracks: [] }))
        service = build({ findConcurrency: 1, findTimeoutMs: 40 })

        service.load({ scopeKey: 'ALL', series: [series('s1', 'Stuck', 'Two', 'Three')] })
        await service.whenIdle()

        const [stuck, two, three] = store.getEntries('s1')
        expect(stuck.status).toBe(AlbumStatus.FAILED)
        expect(stuck.error.reason).toBe(FailureReason.TIMEOUT)
        expect(two.status).toBe(AlbumStatus.FOUND)
        expect(three.status).toBe(AlbumStatus.FOUND)
    })

    it('a network error is "failed: network", distinct from not found and from timeout', async () => {
        catalog.find = vi.fn(async () => { throw new Error('offline') })

        service.load({ scopeKey: 'ALL', series: [series('s1', 'One')] })
        await service.whenIdle()

        expect(store.getEntries('s1')[0].error).toMatchObject({ reason: FailureReason.NETWORK, message: 'offline' })
    })

    it('a source with nothing is "empty", a source that breaks is "failed", and neither fails the album', async () => {
        enrichers.popularity = makeEnricher('empty')
        enrichers.acclaim.enrich = vi.fn(async () => { throw new Error('scraper down') })
        const quiet = vi.spyOn(console, 'warn').mockImplementation(() => { })

        service.load({ scopeKey: 'ALL', series: [series('s1', 'One')] })
        await service.whenIdle()

        const entry = store.getEntries('s1')[0]
        expect(entry.status).toBe(AlbumStatus.FOUND)
        expect(entry.enrichment.popularity).toBe(EnrichmentStatus.EMPTY)
        expect(entry.enrichment.acclaim).toBe(EnrichmentStatus.FAILED)
        expect(store.getSeriesState('s1').status).toBe(SeriesStatus.COMPLETE)
        quiet.mockRestore()
    })

    it('never mutates an album it has published: each source hands over a new one', async () => {
        service.load({ scopeKey: 'ALL', series: [series('s1', 'One')] })
        await service.whenIdle()

        const final = store.getEntries('s1')[0].album
        expect(final).toMatchObject({ rated: true, popular: true, ranked: true })
        const fromCatalog = await catalog.find.mock.results[0].value // frozen: a mutation would have thrown
        expect(fromCatalog).not.toHaveProperty('rated')
        expect(final).not.toBe(fromCatalog)
    })

    it('a result that arrives for an older load is discarded: only the current load writes', async () => {
        const oldSearch = deferred()
        catalog.find = vi.fn((query) => titleOf(query) === 'Old'
            ? oldSearch.promise
            : Promise.resolve({ title: titleOf(query), tracks: [] }))

        service.load({ scopeKey: 'ALL', series: [series('s1', 'Old')] })
        await wait(5)
        service.load({ scopeKey: 'SINGLE:s2', series: [series('s2', 'New')] })
        await service.whenIdle()

        const patch = vi.spyOn(store, 'patchEntry')
        oldSearch.resolve({ title: 'Old', tracks: [] })
        await wait(20)

        expect(patch).not.toHaveBeenCalled()
        expect(store.getSeriesIds()).toEqual(['s2'])
        expect(store.getAllAlbums().map(a => a.title)).toEqual(['New'])
        expect(cache.saveBase).not.toHaveBeenCalledWith('Artist - Old', expect.anything())
    })

    it('opening the same scope again keeps what is loaded and does not search again', async () => {
        const request = { scopeKey: 'ALL', series: [series('s1', 'One', 'Two')] }
        service.load(request)
        await service.whenIdle()
        const generation = store.getGeneration()

        service.load(request)
        await service.whenIdle()

        expect(catalog.find).toHaveBeenCalledTimes(2)
        expect(store.getGeneration()).toBe(generation)
        expect(store.getAlbums('s1')).toHaveLength(2)
    })

    it('opening the same scope again in the middle of a load does not start the albums twice', async () => {
        const gate = deferred()
        catalog.find = vi.fn(async (query) => { await gate.promise; return { title: titleOf(query), tracks: [] } })
        const request = { scopeKey: 'ALL', series: [series('s1', 'One', 'Two')] }

        service.load(request)
        await wait(5)
        service.load(request)
        gate.resolve()
        await service.whenIdle()

        expect(catalog.find).toHaveBeenCalledTimes(2)
        expect(store.getSeriesState('s1').status).toBe(SeriesStatus.COMPLETE)
    })

    it('reconciles when the series changed: the new album loads, the removed one leaves, the rest stays', async () => {
        service.load({ scopeKey: 'ALL', series: [series('s1', 'One', 'Two')] })
        await service.whenIdle()
        const keptAlbum = store.getAlbums('s1')[0]

        service.load({ scopeKey: 'ALL', series: [series('s1', 'One', 'Three'), series('s9', 'Brand New')] })
        await service.whenIdle()

        expect(store.getAlbums('s1').map(a => a.title)).toEqual(['One', 'Three'])
        expect(store.getAlbums('s1')[0]).toBe(keptAlbum)
        expect(store.getAlbums('s9').map(a => a.title)).toEqual(['Brand New'])
        expect(catalog.find).toHaveBeenCalledTimes(4)
    })

    it('asks for an album once even when a series lists it twice', async () => {
        service.load({ scopeKey: 'ALL', series: [{ id: 's1', albumQueries: ['Artist - One', 'artist  -  one'.replace('  -  ', ' - ')] }] })
        await service.whenIdle()

        expect(store.getEntries('s1')).toHaveLength(1)
        expect(catalog.find).toHaveBeenCalledTimes(1)
    })

    it('on a second visit reads the album and its finished sources from the cache, with no search', async () => {
        service.load({ scopeKey: 'ALL', series: [series('s1', 'One')] })
        await service.whenIdle()
        catalog.find.mockClear()
        Object.values(enrichers).forEach(e => e.enrich.mockClear())

        const secondVisit = new AlbumLoadService({ store: new AlbumLoadStore(), catalog, enrichers, cache })
        secondVisit.load({ scopeKey: 'ALL', series: [series('s1', 'One')] })
        await secondVisit.whenIdle()

        expect(catalog.find).not.toHaveBeenCalled()
        expect(enrichers.acclaim.enrich).not.toHaveBeenCalled()
        expect(secondVisit.store.getAlbums('s1')[0]).toMatchObject({ title: 'One', rated: true })
    })

    it('a failed search or a failed source is never written to the cache', async () => {
        catalog.find = vi.fn(async (query) => {
            if (titleOf(query) === 'Missing') throw new AlbumNotFoundError()
            return { title: titleOf(query), tracks: [] }
        })
        enrichers.acclaim.enrich = vi.fn(async () => { throw new Error('scraper down') })
        const quiet = vi.spyOn(console, 'warn').mockImplementation(() => { })

        service.load({ scopeKey: 'ALL', series: [series('s1', 'One', 'Missing')] })
        await service.whenIdle()

        expect(cache.records.has('artist - missing')).toBe(false)
        expect(cache.records.get('artist - one').enrichment.acclaim).toBeUndefined()
        quiet.mockRestore()
    })

    it('keeps the slow source under its limit however many albums there are', async () => {
        let running = 0
        let maxRunning = 0
        enrichers.acclaim.enrich = vi.fn(async (album) => {
            running++
            maxRunning = Math.max(maxRunning, running)
            await wait(10)
            running--
            return { status: 'done', album: { ...album, rated: true } }
        })
        service = build({ slowConcurrency: 2 })

        service.load({ scopeKey: 'ALL', series: [series('s1', 'A', 'B', 'C', 'D', 'E', 'F')] })
        await service.whenIdle()

        expect(maxRunning).toBe(2)
        expect(store.getReadyAlbums('s1')).toHaveLength(6)
    })

    it('a quick source that hangs does not take the slots of the album searches', async () => {
        enrichers.userRanking.enrich = vi.fn(() => new Promise(() => { }))
        service = build({ findConcurrency: 1, enrichTimeoutMs: 80 })
        const quiet = vi.spyOn(console, 'warn').mockImplementation(() => { })

        service.load({ scopeKey: 'ALL', series: [series('s1', 'A', 'B', 'C')] })
        await wait(40)

        expect(store.getEntries('s1').every(entry => entry.status === AlbumStatus.FOUND)).toBe(true)
        await service.whenIdle()
        quiet.mockRestore()
    })

    it('starts the series at the top of the screen first', async () => {
        const started = []
        catalog.find = vi.fn(async (query) => { started.push(titleOf(query)); await wait(5); return { title: titleOf(query), tracks: [] } })
        service = build({ findConcurrency: 1 })

        service.load({ scopeKey: 'ALL', series: [series('top', 'T1', 'T2'), series('bottom', 'B1')] })
        await service.whenIdle()

        expect(started.slice(0, 3)).toEqual(['T1', 'T2', 'B1'])
    })

    it('retryFailed searches again only the albums that failed', async () => {
        let attempts = 0
        catalog.find = vi.fn(async (query) => {
            if (titleOf(query) === 'Flaky' && attempts++ === 0) throw new Error('offline')
            return { title: titleOf(query), tracks: [] }
        })
        service.load({ scopeKey: 'ALL', series: [series('s1', 'One', 'Flaky')] })
        await service.whenIdle()
        expect(store.getSeriesState('s1').status).toBe(SeriesStatus.FAILED)

        service.retryFailed('s1')
        await service.whenIdle()

        expect(store.getSeriesState('s1').status).toBe(SeriesStatus.COMPLETE)
        expect(catalog.find).toHaveBeenCalledTimes(3)
    })

    it('stop drops what is in flight, and the next load starts clean', async () => {
        const gate = deferred()
        catalog.find = vi.fn(async (query) => { await gate.promise; return { title: titleOf(query), tracks: [] } })
        service.load({ scopeKey: 'ALL', series: [series('s1', 'One')] })
        await wait(5)

        service.stop()
        gate.resolve()
        await service.whenIdle()
        expect(store.getAllAlbums()).toEqual([])

        service.load({ scopeKey: 'ALL', series: [series('s1', 'One')] })
        await service.whenIdle()
        expect(store.getAlbums('s1')).toHaveLength(1)
    })

    describe('refreshSource (F46: the ranking saved by the modal shows on screen)', () => {
        const withIds = () => {
            catalog.find = vi.fn(async (query) => deepFreeze({ id: `id-${titleOf(query)}`, title: titleOf(query), tracks: [] }))
        }

        it('asks only that source again, for that album only, and publishes a new album', async () => {
            withIds()
            service.load({ scopeKey: 'ALL', series: [series('s1', 'One', 'Two')] })
            await service.whenIdle()
            const before = store.getEntries('s1')[0].album
            Object.values(enrichers).forEach(enricher => enricher.enrich.mockClear())
            enrichers.userRanking.enrich = vi.fn(async (album) => ({ status: 'done', album: { ...album, hasUserRanking: true } }))

            expect(service.refreshSource('id-One', 'userRanking')).toBe(1)
            expect(store.getEntries('s1')[0].album).toBe(before) // the album stays on screen meanwhile
            await service.whenIdle()

            const [one, two] = store.getEntries('s1')
            expect(enrichers.userRanking.enrich).toHaveBeenCalledTimes(1)
            expect(enrichers.acclaim.enrich).not.toHaveBeenCalled()
            expect(enrichers.popularity.enrich).not.toHaveBeenCalled()
            expect(catalog.find).toHaveBeenCalledTimes(2) // nothing was searched again
            expect(one.album).not.toBe(before)
            expect(one.album.hasUserRanking).toBe(true)
            expect(one.album.rated).toBe(true) // what the other sources gave is kept
            expect(one.enrichment).toMatchObject({ userRanking: EnrichmentStatus.DONE, acclaim: EnrichmentStatus.DONE })
            expect(two.album.hasUserRanking).toBeUndefined()
            expect(before.hasUserRanking).toBeUndefined() // the published album was not changed
        })

        it('refreshes the album in every series that has it', async () => {
            withIds()
            service.load({ scopeKey: 'ALL', series: [series('s1', 'One'), series('s2', 'One', 'Two')] })
            await service.whenIdle()
            enrichers.userRanking.enrich = vi.fn(async (album) => ({ status: 'done', album: { ...album, hasUserRanking: true } }))

            expect(service.refreshSource('id-One', 'userRanking')).toBe(2)
            await service.whenIdle()

            expect(store.getEntries('s1')[0].album.hasUserRanking).toBe(true)
            expect(store.getEntries('s2')[0].album.hasUserRanking).toBe(true)
            expect(store.getEntries('s2')[1].album.hasUserRanking).toBeUndefined()
        })

        it('does not wait for a source still running: the refresh shows at once, and the older answer does not undo it', async () => {
            withIds()
            const slow = deferred()
            const rate = (album) => ({ ...album, rated: true })
            const rank = (album) => ({ ...album, hasUserRanking: true })
            enrichers.acclaim.enrich = vi.fn(async (album) => { await slow.promise; return { status: 'done', album: rate(album), apply: rate } })
            service.load({ scopeKey: 'ALL', series: [series('s1', 'One')] })
            await wait(20) // found; the slow source is running with the album it was given
            enrichers.userRanking.enrich = vi.fn(async (album) => ({ status: 'done', album: rank(album), apply: rank }))

            service.refreshSource('id-One', 'userRanking')
            await wait(20)
            expect(enrichers.userRanking.enrich).toHaveBeenCalledTimes(1)
            expect(store.getEntries('s1')[0].album.hasUserRanking).toBe(true) // on screen while the rating is still coming
            expect(store.getEntries('s1')[0].album.rated).toBeUndefined()

            slow.resolve()
            await service.whenIdle()
            expect(store.getEntries('s1')[0].album).toMatchObject({ rated: true, hasUserRanking: true })
        })

        it('only the latest ask of a source writes: an older answer that arrives later is dropped', async () => {
            withIds()
            const first = deferred()
            enrichers.userRanking.enrich = vi.fn(async (album) => { await first.promise; return { status: 'done', album: { ...album, ranking: 'old' } } })
            service.load({ scopeKey: 'ALL', series: [series('s1', 'One')] })
            await wait(20) // found; the first read of the ranking is still running
            enrichers.userRanking.enrich = vi.fn(async (album) => ({ status: 'done', album: { ...album, ranking: 'new' } }))

            service.refreshSource('id-One', 'userRanking')
            await wait(20)
            expect(store.getEntries('s1')[0].album.ranking).toBe('new')

            first.resolve()
            await service.whenIdle()
            expect(store.getEntries('s1')[0].album.ranking).toBe('new')
            expect(store.getEntries('s1')[0].enrichment.userRanking).toBe(EnrichmentStatus.DONE)
        })

        it('does nothing for an album that is not loaded or for a source that does not exist', async () => {
            withIds()
            service.load({ scopeKey: 'ALL', series: [series('s1', 'One')] })
            await service.whenIdle()
            Object.values(enrichers).forEach(enricher => enricher.enrich.mockClear())

            expect(service.refreshSource('id-Nope', 'userRanking')).toBe(0)
            expect(service.refreshSource('id-One', 'nonsense')).toBe(0)
            await service.whenIdle()

            expect(enrichers.userRanking.enrich).not.toHaveBeenCalled()
        })

        it('a refresh that fails leaves the album on screen and marks only that source as failed', async () => {
            withIds()
            service.load({ scopeKey: 'ALL', series: [series('s1', 'One')] })
            await service.whenIdle()
            enrichers.userRanking.enrich = vi.fn(async () => { throw new Error('offline') })
            const quiet = vi.spyOn(console, 'warn').mockImplementation(() => { })

            service.refreshSource('id-One', 'userRanking')
            await service.whenIdle()

            const entry = store.getEntries('s1')[0]
            expect(entry.status).toBe(AlbumStatus.FOUND)
            expect(entry.enrichment.userRanking).toBe(EnrichmentStatus.FAILED)
            expect(entry.enrichment.acclaim).toBe(EnrichmentStatus.DONE)
            quiet.mockRestore()
        })
    })

    describe('hold (F52): our own server said "wait" (429) or "sign in" (401)', () => {
        const held = (hold) => Object.assign(new Error('the server asked to hold'), { hold })
        const limited = (retryAfterMs) => held({ reason: 'rate_limited', retryAfterMs })
        const refused = () => held({ reason: 'unauthorized' })
        const acclaimOf = (seriesId) => store.getEntries(seriesId).map(entry => entry.enrichment.acclaim)
        let onHold
        const buildHeld = (limits = {}) => new AlbumLoadService({ store, catalog, enrichers, cache, limits, onHold })

        beforeEach(() => {
            onHold = vi.fn()
        })

        it('a 429 from the ratings holds the slow queue for Retry-After and asks again: no album is marked failed', async () => {
            let refusals = 2
            enrichers.acclaim.enrich = vi.fn(async (album) => {
                if (refusals-- > 0) throw limited(40)
                return { status: 'done', album: { ...album, rated: true } }
            })
            service = buildHeld({ slowConcurrency: 2 })

            service.load({ scopeKey: 'ALL', series: [series('s1', 'One', 'Two', 'Three', 'Four')] })
            await wait(20)

            // in the hold: the two that asked heard "wait"; nobody else asked, nobody failed
            expect(enrichers.acclaim.enrich).toHaveBeenCalledTimes(2)
            expect(acclaimOf('s1')).not.toContain(EnrichmentStatus.FAILED)
            expect(service.getHold()).toMatchObject({ reason: 'rate_limited' })
            expect(store.getAlbums('s1')).toHaveLength(4)

            await service.whenIdle()

            expect(acclaimOf('s1')).toEqual(Array(4).fill(EnrichmentStatus.DONE))
            expect(enrichers.acclaim.enrich).toHaveBeenCalledTimes(6)
            expect(service.getHold()).toBeNull()
            expect(onHold).toHaveBeenCalledTimes(1)
            expect(onHold.mock.calls[0][0]).toMatchObject({ reason: 'rate_limited' })
            expect(onHold.mock.calls[0][0].until).toBeGreaterThan(Date.now() - 1000)
        })

        it('"the ratings source asked to wait" (503 upstream_busy with Retry-After) holds the same way: the ratings wait, nothing fails, one notice', async () => {
            let refusals = 1
            enrichers.acclaim.enrich = vi.fn(async (album) => {
                if (refusals-- > 0) throw held({ reason: 'source_busy', retryAfterMs: 40 })
                return { status: 'done', album: { ...album, rated: true } }
            })
            service = buildHeld({ slowConcurrency: 1 })

            service.load({ scopeKey: 'ALL', series: [series('s1', 'One', 'Two')] })
            await wait(20)
            expect(service.getHold()).toMatchObject({ reason: 'source_busy' })
            expect(acclaimOf('s1')).not.toContain(EnrichmentStatus.FAILED)
            expect(store.getAlbums('s1')).toHaveLength(2) // the albums themselves are on screen

            await service.whenIdle()
            expect(acclaimOf('s1')).toEqual(Array(2).fill(EnrichmentStatus.DONE))
            expect(onHold).toHaveBeenCalledTimes(1)
            expect(cache.saveEnrichment.mock.calls.filter(call => call[2] === 'acclaim' && call[3] !== 'done')).toEqual([])
        })

        it('a 401 stops the asking until resume(), with one notice, and nothing is marked failed', async () => {
            let signedIn = false
            enrichers.acclaim.enrich = vi.fn(async (album) => {
                if (!signedIn) throw refused()
                return { status: 'done', album: { ...album, rated: true } }
            })
            service = buildHeld({ slowConcurrency: 1 })

            service.load({ scopeKey: 'ALL', series: [series('s1', 'One', 'Two', 'Three')] })
            await wait(30)

            expect(enrichers.acclaim.enrich).toHaveBeenCalledTimes(1)
            expect(acclaimOf('s1')).not.toContain(EnrichmentStatus.FAILED)
            expect(service.getHold()).toEqual({ reason: 'unauthorized', until: null })
            expect(onHold).toHaveBeenCalledTimes(1)
            expect(cache.saveEnrichment.mock.calls.filter(call => call[2] === 'acclaim')).toEqual([])

            signedIn = true
            service.resume()
            await service.whenIdle()

            expect(acclaimOf('s1')).toEqual(Array(3).fill(EnrichmentStatus.DONE))
            expect(onHold).toHaveBeenCalledTimes(1)
        })

        it('asking for the load again ends a "sign in" hold: the screen was opened again, so it is tried again', async () => {
            let signedIn = false
            enrichers.acclaim.enrich = vi.fn(async (album) => {
                if (!signedIn) throw refused()
                return { status: 'done', album }
            })
            service = buildHeld()
            const request = { scopeKey: 'ALL', series: [series('s1', 'One')] }

            service.load(request)
            await wait(20)
            expect(service.getHold()).not.toBeNull()

            signedIn = true
            service.load(request)
            await service.whenIdle()

            expect(acclaimOf('s1')).toEqual([EnrichmentStatus.DONE])
            expect(catalog.find).toHaveBeenCalledTimes(1)
        })

        it('"sign in" is said once per load: asking again while the login is still refused holds again, with no new notice', async () => {
            enrichers.acclaim.enrich = vi.fn(async () => { throw refused() })
            service = buildHeld({ slowConcurrency: 1 })
            const request = { scopeKey: 'ALL', series: [series('s1', 'One', 'Two')] }

            service.load(request)
            await wait(15)
            service.load(request) // the person turned a page, changed a filter...
            await wait(15)
            service.load(request)
            await wait(15)

            expect(enrichers.acclaim.enrich).toHaveBeenCalledTimes(3) // one ask per time the screen asked
            expect(service.getHold()).toEqual({ reason: 'unauthorized', until: null })
            expect(onHold).toHaveBeenCalledTimes(1)
            expect(acclaimOf('s1')).not.toContain(EnrichmentStatus.FAILED)

            service.load({ ...request, fresh: true }) // a new load says it again
            await wait(15)
            expect(onHold).toHaveBeenCalledTimes(2)
            service.stop()
        })

        it('a 429 from the second source of albums holds only the album that heard it: the others are found and rated meanwhile', async () => {
            let refusals = 1
            catalog.find = vi.fn(async (query) => {
                if (titleOf(query) === 'Missing' && refusals-- > 0) throw limited(60)
                return { title: titleOf(query), tracks: [] }
            })
            service = buildHeld()

            service.load({ scopeKey: 'ALL', series: [series('s1', 'Missing', 'Here')] })
            await wait(25)

            const [missing, here] = store.getEntries('s1')
            expect(missing.status).toBe(AlbumStatus.FINDING)
            expect(here.status).toBe(AlbumStatus.FOUND)
            expect(here.enrichment.acclaim).toBe(EnrichmentStatus.DONE)

            await service.whenIdle()

            expect(store.getEntries('s1').map(entry => entry.status)).toEqual([AlbumStatus.FOUND, AlbumStatus.FOUND])
            expect(onHold).toHaveBeenCalledTimes(1)
        })

        it('stop during a hold drops what was waiting, and the next load starts clean', async () => {
            enrichers.acclaim.enrich = vi.fn(async () => { throw refused() })
            service = buildHeld()

            service.load({ scopeKey: 'ALL', series: [series('s1', 'One', 'Two')] })
            await wait(20)
            service.stop()
            await service.whenIdle()

            expect(service.getHold()).toBeNull()
            expect(acclaimOf('s1')).not.toContain(EnrichmentStatus.FAILED)

            enrichers.acclaim.enrich = vi.fn(async (album) => ({ status: 'done', album }))
            service.load({ scopeKey: 'ALL', series: [series('s1', 'One', 'Two')] })
            await service.whenIdle()
            expect(acclaimOf('s1')).toEqual([EnrichmentStatus.DONE, EnrichmentStatus.DONE])
        })

        it('a failure with no hold is still a failure, at once', async () => {
            enrichers.acclaim.enrich = vi.fn(async () => { throw Object.assign(new Error('502'), { hold: null }) })
            const quiet = vi.spyOn(console, 'warn').mockImplementation(() => { })
            service = buildHeld()

            service.load({ scopeKey: 'ALL', series: [series('s1', 'One')] })
            await service.whenIdle()

            expect(acclaimOf('s1')).toEqual([EnrichmentStatus.FAILED])
            expect(onHold).not.toHaveBeenCalled()
            quiet.mockRestore()
        })
    })
})
