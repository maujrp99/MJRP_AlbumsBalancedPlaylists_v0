/**
 * F52, slice 3 - how long the app believes "the source has none".
 * The server's answer says WHY there is nothing; the reason travels with the status, from the
 * enricher to the record the browser keeps, and the record is believed for a time that depends
 * on it:
 *   not_found   the source has no page for the album      24 hours
 *   no_ratings  the page was read and has no rating       7 days
 *   (no reason) an answer of the server before F52, or a source that gives no reason: 1 hour, as before
 * A failure is never kept. "Refetch" asks the source whatever the record says.
 */
import { describe, it, expect, vi } from 'vitest'
import { Album } from '../../../public/js/models/Album.js'
import { AcclaimEnricher } from '../../../public/js/services/albums/adapters/enrichers.js'
import { AlbumCacheAdapter, EMPTY_TRUST } from '../../../public/js/services/albums/adapters/AlbumCacheAdapter.js'
import { AlbumLoadService } from '../../../public/js/services/albums/AlbumLoadService.js'
import { AlbumLoadStore } from '../../../public/js/stores/albumLoad.js'
import { queryKey } from '../../../public/js/models/albumLoadState.js'

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

const makeAlbum = (extra = {}) => new Album({
    id: 'artist_album', title: 'Album', artist: 'Artist',
    tracks: [{ id: 't1', title: 'One', position: 1 }, { id: 't2', title: 'Two', position: 2 }],
    ...extra
})

describe('the times are written down in one place', () => {
    it('24 hours for "no page", 7 days for "page without ratings", 1 hour for anything that gives no reason', () => {
        expect(EMPTY_TRUST).toEqual({ not_found: 24 * HOUR, no_ratings: 7 * DAY, unknown: HOUR })
    })
})

describe('AcclaimEnricher: "the source has none" says why', () => {
    const enricherFor = (answer) => new AcclaimEnricher({
        requestRatings: async () => answer,
        applyRatings: (album, data) => { if (data.bestEverInfo?.url) album.bestEverUrl = data.bestEverInfo.url }
    })

    it.each(['not_found', 'no_ratings'])('%s is empty with that reason', async (kind) => {
        const result = await enricherFor({ kind, data: { bestEverInfo: null, trackRatings: [] } }).enrich(makeAlbum())
        expect(result).toMatchObject({ status: 'empty', reason: kind })
    })

    it('an empty answer of the server before F52 gives no reason: it may have been a failure', async () => {
        const result = await enricherFor({ kind: 'legacy', data: { bestEverInfo: null, trackRatings: [] } }).enrich(makeAlbum())
        expect(result.status).toBe('empty')
        expect(result.reason).toBeUndefined()
    })

    it('ratings found carry no reason', async () => {
        const result = await enricherFor({ kind: 'found', data: { bestEverInfo: { url: 'https://bea/1' }, trackRatings: [] } }).enrich(makeAlbum())
        expect(result.status).toBe('done')
        expect(result.reason).toBeUndefined()
    })
})

describe('AlbumCacheAdapter: "empty" is believed for a time that depends on the reason', () => {
    const build = () => {
        const clock = { now: 1000 }
        const backing = new Map()
        const cache = {
            get: vi.fn(async (key) => backing.get(key) ?? null),
            set: vi.fn(async (key, value) => { backing.set(key, value) }),
            invalidate: vi.fn(async (key) => { backing.delete(key) })
        }
        const adapter = new AlbumCacheAdapter({ cache, createAlbum: (plain) => new Album(plain), now: () => clock.now })
        return { adapter, clock, backing }
    }
    const savedWith = async (reason) => {
        const built = build()
        const album = makeAlbum()
        await built.adapter.saveBase('Artist - Album', album)
        await built.adapter.saveEnrichment('Artist - Album', album, 'acclaim', 'empty', reason ? { reason } : undefined)
        return built
    }
    const acclaimAfter = async ({ adapter, clock }, ms) => {
        clock.now += ms
        return (await adapter.get('Artist - Album')).enrichment.acclaim
    }

    it('"no page" (not_found) is believed for 24 hours, and asked again after', async () => {
        const built = await savedWith('not_found')
        expect(await acclaimAfter(built, 23 * HOUR)).toBe('empty')
        expect(await acclaimAfter(built, 2 * HOUR)).toBeUndefined()
    })

    it('"page without ratings" (no_ratings) is believed for 7 days, and asked again after', async () => {
        const built = await savedWith('no_ratings')
        expect(await acclaimAfter(built, 6 * DAY + 23 * HOUR)).toBe('empty')
        expect(await acclaimAfter(built, 2 * HOUR)).toBeUndefined()
    })

    it('an "empty" with no reason (the server before F52, or another source) keeps the rule of 1 hour', async () => {
        const built = await savedWith(null)
        expect(await acclaimAfter(built, 59 * 60 * 1000)).toBe('empty')
        expect(await acclaimAfter(built, 2 * 60 * 1000)).toBeUndefined()
    })

    it('a reason it does not know is not believed for longer than 1 hour', async () => {
        const built = await savedWith('something_new')
        expect(await acclaimAfter(built, 61 * 60 * 1000)).toBeUndefined()
    })

    it('a record written before this slice ("empty" with no reason field) is read with the rule of 1 hour', async () => {
        const built = build()
        const album = makeAlbum()
        await built.adapter.saveBase('Artist - Album', album)
        const [key, record] = [...built.backing.entries()][0]
        built.backing.set(key, { ...record, enrichment: { acclaim: { status: 'empty', at: built.clock.now } } })

        expect(await acclaimAfter(built, 30 * 60 * 1000)).toBe('empty')
        expect(await acclaimAfter(built, 31 * 60 * 1000)).toBeUndefined()
    })

    it('"done" does not expire with these times, and its record carries no reason', async () => {
        const built = build()
        const album = makeAlbum()
        await built.adapter.saveBase('Artist - Album', album)
        await built.adapter.saveEnrichment('Artist - Album', album, 'acclaim', 'done', { reason: 'not_found' })

        expect(await acclaimAfter(built, 6 * DAY)).toBe('done')
        expect([...built.backing.values()][0].enrichment.acclaim).toEqual({ status: 'done', at: 1000 })
    })

    it('a newer answer replaces the older one, reason and time', async () => {
        const built = await savedWith('no_ratings')
        built.clock.now += DAY
        await built.adapter.saveEnrichment('Artist - Album', makeAlbum(), 'acclaim', 'empty', { reason: 'not_found' })
        expect(await acclaimAfter(built, 25 * HOUR)).toBeUndefined()
    })
})

describe('AlbumLoadService: the reason reaches the record, and a failure never does', () => {
    const makeCache = () => {
        const records = new Map()
        return {
            records,
            get: vi.fn(async (query) => records.get(queryKey(query)) || null),
            saveBase: vi.fn(async (query, album) => { records.set(queryKey(query), { album, enrichment: {} }) }),
            saveEnrichment: vi.fn(async () => {})
        }
    }
    const build = (acclaim) => {
        const store = new AlbumLoadStore()
        const cache = makeCache()
        const empty = { enrich: async (album) => ({ status: 'empty', album }) }
        const service = new AlbumLoadService({
            store,
            cache,
            catalog: { find: async () => ({ id: 'a1', title: 'One', tracks: [] }) },
            enrichers: { acclaim, popularity: empty, userRanking: empty }
        })
        return { store, cache, service }
    }
    const acclaimSaves = (cache) => cache.saveEnrichment.mock.calls.filter(call => call[2] === 'acclaim')
    const load = async (service) => {
        service.load({ scopeKey: 'ALL', series: [{ id: 's1', albumQueries: ['Artist - One'] }] })
        await service.whenIdle()
    }

    it.each(['not_found', 'no_ratings'])('"%s" is saved as empty with its reason', async (reason) => {
        const { service, cache } = build({ enrich: async (album) => ({ status: 'empty', reason, album }) })
        await load(service)
        expect(acclaimSaves(cache)).toHaveLength(1)
        expect(acclaimSaves(cache)[0].slice(3)).toEqual(['empty', { reason }])
    })

    it('an empty answer with no reason is saved with none', async () => {
        const { service, cache } = build({ enrich: async (album) => ({ status: 'empty', album }) })
        await load(service)
        expect(acclaimSaves(cache)[0].slice(3)).toEqual(['empty', { reason: null }])
    })

    it('a failure of the source is never saved, and the source is shown as failed', async () => {
        const { service, cache, store } = build({ enrich: async () => { throw new Error('HTTP 504 (upstream_timeout)') } })
        await load(service)
        expect(acclaimSaves(cache)).toEqual([])
        expect(store.getEntries('s1')[0].enrichment.acclaim).toBe('failed')
    })

    describe('"Refetch" of one album (adoptAlbum)', () => {
        const loaded = async () => {
            const built = build({ enrich: async (album) => ({ status: 'empty', reason: 'not_found', album }) })
            await load(built.service)
            built.cache.saveEnrichment.mockClear()
            return built
        }

        it('with ratings: the album replaces the loaded one and the source is saved and shown as done', async () => {
            const { service, cache, store } = await loaded()
            await service.adoptAlbum({ id: 'a1', title: 'One', tracks: [], bestEverUrl: 'https://bea/1', acclaim: { hasRatings: true } })

            expect(acclaimSaves(cache)[0].slice(3)).toEqual(['done', { reason: null }])
            expect(store.getEntries('s1')[0].enrichment.acclaim).toBe('done')
            expect(store.getEntries('s1')[0].album.bestEverUrl).toBe('https://bea/1')
        })

        it('without ratings (the source had none, or the refetch failed): nothing is saved as "done"', async () => {
            const { service, cache, store } = await loaded()
            await service.adoptAlbum({ id: 'a1', title: 'One', tracks: [] })

            expect(acclaimSaves(cache)).toEqual([])
            expect(store.getEntries('s1')[0].enrichment.acclaim).toBe('empty')
            expect(store.getEntries('s1')[0].album).toMatchObject({ id: 'a1' })
        })
    })
})
