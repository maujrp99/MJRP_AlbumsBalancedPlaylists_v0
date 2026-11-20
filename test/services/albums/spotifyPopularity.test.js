/**
 * F69 (UAT-206) - the popularity of an album has three outcomes, and they never merge:
 *   Spotify has no such album   'empty', with the reason, kept for a time
 *   the call failed             'failed', with "try again", never kept
 *   Spotify is not connected    'not-connected': nothing failed, nothing is kept or written
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Album } from '../../../public/js/models/Album.js'
import { PopularityEnricher } from '../../../public/js/services/albums/adapters/enrichers.js'
import { SpotifyPopularitySource, MAX_SPOTIFY_HOLD_MS } from '../../../public/js/services/albums/adapters/spotifyPopularitySource.js'
import { AlbumCacheAdapter, EMPTY_TRUST } from '../../../public/js/services/albums/adapters/AlbumCacheAdapter.js'
import { AlbumLoadService } from '../../../public/js/services/albums/AlbumLoadService.js'
import { askPopularityOnConnect } from '../../../public/js/services/albums/popularityOnConnect.js'
import { AlbumLoadStore } from '../../../public/js/stores/albumLoad.js'
import { EnrichmentStatus, HoldReason, holdNotice, queryKey } from '../../../public/js/models/albumLoadState.js'
import { SpotifyRateLimitError, SpotifyReconnectError } from '../../../public/js/services/spotify/spotifyErrors.js'
import { applySpotifyData } from '../../../public/js/helpers/SpotifyEnrichmentHelper.js'
import { IDENTITY_RULE_VERSION } from '../../../shared/albumIdentity.js'

const HOUR = 60 * 60 * 1000
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const makeAlbum = (extra = {}) => new Album({
    id: 'artist_album', title: 'Album', artist: 'Artist',
    tracks: [{ id: 't1', title: 'One', position: 1 }, { id: 't2', title: 'Two', position: 2 }],
    ...extra
})
const DATA = {
    spotifyId: 'sp1', spotifyUrl: 'https://open.spotify.com/album/sp1', spotifyPopularity: 60, spotifyArtwork: null,
    trackPopularity: [{ name: 'One', popularity: 70, spotifyId: 'x1', spotifyUri: 'u1' }, { name: 'Two', popularity: 50, spotifyId: 'x2', spotifyUri: 'u2' }]
}

const makeSource = ({ stored = null, connected = true, answer = { found: true, data: DATA }, now = () => 1000 } = {}) => {
    const state = { connected }
    const deps = {
        store: { get: vi.fn(async () => stored), save: vi.fn(async () => {}) },
        spotify: { albumPopularity: vi.fn(async () => (typeof answer === 'function' ? answer() : answer)) },
        isConnected: () => state.connected,
        now
    }
    return { source: new SpotifyPopularitySource(deps), deps, state }
}

describe('SpotifyPopularitySource: one typed answer', () => {
    beforeEach(() => vi.spyOn(console, 'warn').mockImplementation(() => {}))
    afterEach(() => vi.restoreAllMocks())

    it('what is already stored for the album answers, connected or not, and Spotify is not asked', async () => {
        const { source, deps } = makeSource({ stored: DATA, connected: false })

        expect(await source.read(makeAlbum())).toEqual({ kind: 'found', data: DATA })
        expect(deps.spotify.albumPopularity).not.toHaveBeenCalled()
    })

    it('nothing stored and no Spotify session: not connected, and Spotify is not asked', async () => {
        const { source, deps } = makeSource({ connected: false })

        expect(await source.read(makeAlbum())).toEqual({ kind: 'not_connected' })
        expect(deps.spotify.albumPopularity).not.toHaveBeenCalled()
    })

    it('Spotify has the album: found, and the answer is stored for the next time', async () => {
        const { source, deps } = makeSource()

        expect(await source.read(makeAlbum())).toEqual({ kind: 'found', data: DATA })
        expect(deps.spotify.albumPopularity).toHaveBeenCalledWith('Artist', 'Album')
        expect(deps.store.save).toHaveBeenCalledWith('Artist', 'Album', DATA)
    })

    it('storing the answer failing does not make the answer a failure', async () => {
        const { source, deps } = makeSource()
        deps.store.save.mockRejectedValue(new Error('permission-denied'))

        expect(await source.read(makeAlbum())).toEqual({ kind: 'found', data: DATA })
    })

    it('Spotify has no such album: not found, with the reason and the version of the rule that decided', async () => {
        const { source, deps } = makeSource({ answer: { found: false, reason: 'not_found' } })

        expect(await source.read(makeAlbum())).toEqual({ kind: 'not_found', reason: 'not_found', rule: IDENTITY_RULE_VERSION })
        expect(deps.store.save).not.toHaveBeenCalled()
    })

    it('the call failed: the error goes up as it came', async () => {
        const { source } = makeSource({ answer: () => { throw new TypeError('Failed to fetch') } })

        await expect(source.read(makeAlbum())).rejects.toThrow('Failed to fetch')
    })

    it('the access could not be renewed (the session ended): not connected, not a failure', async () => {
        const { source } = makeSource({ answer: () => { throw new SpotifyReconnectError() } })

        expect(await source.read(makeAlbum())).toEqual({ kind: 'not_connected' })
    })

    it('Spotify says "wait N seconds" for a short time: the error asks the load to hold, and nobody asks Spotify until then', async () => {
        let time = 1000
        const { source, deps } = makeSource({ answer: () => { throw new SpotifyRateLimitError(5) }, now: () => time })

        const first = await source.read(makeAlbum()).catch(e => e)
        expect(first.hold).toEqual({ reason: HoldReason.SPOTIFY_BUSY, retryAfterMs: 5000 })

        time = 3000
        const second = await source.read(makeAlbum()).catch(e => e)
        expect(second.hold).toEqual({ reason: HoldReason.SPOTIFY_BUSY, retryAfterMs: 3000 })
        expect(deps.spotify.albumPopularity).toHaveBeenCalledTimes(1)

        time = 6001
        await source.read(makeAlbum()).catch(e => e)
        expect(deps.spotify.albumPopularity).toHaveBeenCalledTimes(2)
    })

    it('a wait longer than the load may hold, or with no time said, is a failure that says why', async () => {
        let time = 0
        const seconds = MAX_SPOTIFY_HOLD_MS / 1000 + 1
        const long = makeSource({ answer: () => { throw new SpotifyRateLimitError(seconds) }, now: () => time })

        const error = await long.source.read(makeAlbum()).catch(e => e)
        expect(error).toBeInstanceOf(SpotifyRateLimitError)
        expect(error.hold).toBeUndefined()
        expect(error.message).toContain(`${seconds} seconds`)

        time = 1000 // still inside the wait Spotify asked for: it is not asked again
        expect(await long.source.read(makeAlbum()).catch(e => e)).toBeInstanceOf(SpotifyRateLimitError)
        expect(long.deps.spotify.albumPopularity).toHaveBeenCalledTimes(1)

        const untimed = makeSource({ answer: () => { throw new SpotifyRateLimitError(null) } })
        const plain = await untimed.source.read(makeAlbum()).catch(e => e)
        expect(plain).toBeInstanceOf(SpotifyRateLimitError)
        expect(plain.hold).toBeUndefined()
    })
})

describe('PopularityEnricher: three outcomes', () => {
    const enricherFor = (read) => new PopularityEnricher({ readPopularity: read, applyPopularity: applySpotifyData })

    it('found: done, on a copy, with the popularity of each track', async () => {
        const album = makeAlbum()
        const before = JSON.stringify(album)

        const result = await enricherFor(async () => ({ kind: 'found', data: DATA })).enrich(album)

        expect(result.status).toBe('done')
        expect(result.album.spotifyId).toBe('sp1')
        expect(result.album.tracks.find(t => t.title === 'One').spotifyPopularity).toBe(70)
        expect(JSON.stringify(album)).toBe(before)
        expect((await result.apply(makeAlbum({ spotifyId: 'other' }))).spotifyId).toBe('other')
        expect((await result.apply(makeAlbum())).spotifyId).toBe('sp1')
    })

    it('an album that already carries its Spotify id is done and nobody is asked', async () => {
        const read = vi.fn()
        expect((await enricherFor(read).enrich(makeAlbum({ spotifyId: 'sp0' }))).status).toBe('done')
        expect(read).not.toHaveBeenCalled()
    })

    it('Spotify has no such album: empty, with the reason and the rule', async () => {
        const album = makeAlbum()
        const result = await enricherFor(async () => ({ kind: 'not_found', reason: 'not_found', rule: 2 })).enrich(album)

        expect(result).toMatchObject({ status: 'empty', reason: 'not_found', rule: 2 })
        expect(result.album).toBe(album)
    })

    it('not connected: its own status, neither empty nor failed', async () => {
        const album = makeAlbum()
        const result = await enricherFor(async () => ({ kind: 'not_connected' })).enrich(album)

        expect(result.status).toBe(EnrichmentStatus.NOT_CONNECTED)
        expect(result.status).toBe('not-connected')
        expect(result.album).toBe(album)
    })

    it('a failure is thrown, never an answer', async () => {
        await expect(enricherFor(async () => { throw new Error('network') }).enrich(makeAlbum())).rejects.toThrow('network')
    })
})

describe('the load with the three outcomes', () => {
    const makeCache = () => {
        const records = new Map()
        return {
            records,
            get: vi.fn(async (query) => records.get(queryKey(query)) || null),
            saveBase: vi.fn(async (query, album) => { records.set(queryKey(query), { album, enrichment: {} }) }),
            saveEnrichment: vi.fn(async () => {})
        }
    }
    const quiet = { enrich: async (album) => ({ status: 'empty', album }) }
    let store, cache, onHold
    const build = (popularity) => new AlbumLoadService({
        store, cache, onHold,
        catalog: { find: async (query) => ({ id: queryKey(query), title: query, tracks: [] }) },
        enrichers: { acclaim: quiet, userRanking: quiet, popularity }
    })
    const load = (service, ...titles) => service.load({ scopeKey: 'ALL', series: [{ id: 's1', albumQueries: titles }] })
    const popularityOf = (title) => store.getEntry('s1', queryKey(title)).enrichment.popularity
    const savedPopularity = () => cache.saveEnrichment.mock.calls.filter(([, , source]) => source === 'popularity')

    beforeEach(() => {
        store = new AlbumLoadStore()
        cache = makeCache()
        onHold = vi.fn()
        vi.spyOn(console, 'warn').mockImplementation(() => {})
    })
    afterEach(() => vi.restoreAllMocks())

    it('not connected: the source says so, the album is ready, and nothing is kept for that source', async () => {
        const service = build({ enrich: async (album) => ({ status: 'not-connected', album }) })
        load(service, 'A - One')
        await service.whenIdle()

        expect(popularityOf('A - One')).toBe('not-connected')
        expect(store.getSeriesState('s1').enriching).toBe(0)
        expect(store.getReadyAlbums('s1')).toHaveLength(1)
        expect(savedPopularity()).toEqual([])
    })

    it('a failure is failed and never kept; "try again" asks it again', async () => {
        let fail = true
        const service = build({ enrich: async (album) => { if (fail) throw new Error('Spotify API Error: 500'); return { status: 'done', album: { ...album, spotifyId: 'sp1' } } } })
        load(service, 'A - One')
        await service.whenIdle()

        expect(popularityOf('A - One')).toBe('failed')
        expect(savedPopularity()).toEqual([])

        fail = false
        service.retryFailed('s1')
        await service.whenIdle()
        expect(popularityOf('A - One')).toBe('done')
    })

    it('"Spotify has no such album" is empty and kept with its reason and the rule that decided it', async () => {
        const service = build({ enrich: async (album) => ({ status: 'empty', reason: 'not_found', rule: 2, album }) })
        load(service, 'A - One')
        await service.whenIdle()

        expect(popularityOf('A - One')).toBe('empty')
        expect(savedPopularity()).toHaveLength(1)
        expect(savedPopularity()[0].slice(2)).toEqual(['popularity', 'empty', { reason: 'not_found', rule: 2 }])
    })

    it('Spotify asks to wait: the popularity holds and goes again by itself; nothing fails, one notice', async () => {
        let busy = true
        const enrich = vi.fn(async (album) => {
            if (busy) throw Object.assign(new Error('wait'), { hold: { reason: HoldReason.SPOTIFY_BUSY, retryAfterMs: 40 } })
            return { status: 'done', album: { ...album, spotifyId: 'sp1' } }
        })
        const service = build({ enrich })
        load(service, 'A - One', 'A - Two')
        await wait(15)

        expect(service.getHold()).toMatchObject({ reason: HoldReason.SPOTIFY_BUSY })
        expect([popularityOf('A - One'), popularityOf('A - Two')]).not.toContain('failed')
        busy = false
        await service.whenIdle()

        expect([popularityOf('A - One'), popularityOf('A - Two')]).toEqual(['done', 'done'])
        expect(onHold).toHaveBeenCalledTimes(1)
        expect(service.getHold()).toBeNull()
    })

    it('the notice of that hold names Spotify and the popularity', () => {
        const notice = holdNotice({ reason: HoldReason.SPOTIFY_BUSY, until: 1000 }, () => '10:30')
        expect(notice.message).toBe('Spotify asked to slow down. Loading popularity is paused. It resumes by itself at 10:30.')
    })

    it('the person connects: the sources that were "not connected" are asked, through the service, and no album is loaded again', async () => {
        const state = { connected: false }
        const find = vi.fn(async (query) => ({ id: queryKey(query), title: query, tracks: [] }))
        const service = new AlbumLoadService({
            store, cache, catalog: { find },
            enrichers: {
                acclaim: quiet, userRanking: quiet,
                popularity: { enrich: async (album) => (state.connected ? { status: 'done', album: { ...album, spotifyId: 'sp1' } } : { status: 'not-connected', album }) }
            }
        })
        const target = new EventTarget()
        askPopularityOnConnect({ store, service, isConnected: () => state.connected, target })
        load(service, 'A - One', 'A - Two')
        await service.whenIdle()
        expect([popularityOf('A - One'), popularityOf('A - Two')]).toEqual(['not-connected', 'not-connected'])

        target.dispatchEvent(new Event('spotify-auth-change')) // a signal while still not connected asks nothing
        await service.whenIdle()
        expect(popularityOf('A - One')).toBe('not-connected')

        state.connected = true
        target.dispatchEvent(new Event('spotify-auth-change'))
        await service.whenIdle()

        expect([popularityOf('A - One'), popularityOf('A - Two')]).toEqual(['done', 'done'])
        expect(find).toHaveBeenCalledTimes(2)
    })
})

describe('what the browser keeps of the popularity', () => {
    const makeCacheDouble = () => {
        const records = new Map()
        return {
            records,
            get: async (key) => records.get(key) ?? null,
            peek: async (key) => records.get(key) ?? null,
            set: async (key, value) => { records.set(key, value) },
            invalidate: async (key) => { records.delete(key) }
        }
    }
    const adapterAt = (clock) => new AlbumCacheAdapter({ cache: makeCacheDouble(), createAlbum: (plain) => new Album(plain), now: () => clock.now })
    const QUERY = 'Artist - Album'

    it('"Spotify has no such album" is believed for as long as "no page" of the ratings, and only under the rule that decided it', async () => {
        const clock = { now: 0 }
        const adapter = adapterAt(clock)
        await adapter.saveBase(QUERY, makeAlbum())
        await adapter.saveEnrichment(QUERY, makeAlbum(), 'popularity', 'empty', { reason: 'not_found', rule: IDENTITY_RULE_VERSION })

        clock.now = EMPTY_TRUST.not_found - 1
        expect((await adapter.get(QUERY)).enrichment.popularity).toBe('empty')
        clock.now = EMPTY_TRUST.not_found + 1
        expect((await adapter.get(QUERY)).enrichment.popularity).toBeUndefined()

        clock.now = 0
        await adapter.saveEnrichment(QUERY, makeAlbum(), 'popularity', 'empty', { reason: 'not_found', rule: IDENTITY_RULE_VERSION - 1 })
        expect((await adapter.get(QUERY)).enrichment.popularity).toBeUndefined()
    })

    it('an "empty" of the popularity with no reason (written before F69: it may be "not connected") is not believed, even when new', async () => {
        const clock = { now: 0 }
        const adapter = adapterAt(clock)
        await adapter.saveBase(QUERY, makeAlbum())
        await adapter.saveEnrichment(QUERY, makeAlbum(), 'popularity', 'empty')
        await adapter.saveEnrichment(QUERY, makeAlbum(), 'acclaim', 'empty')

        clock.now = 1000
        const kept = await adapter.get(QUERY)
        expect(kept.enrichment.popularity).toBeUndefined()
        expect(kept.enrichment.acclaim).toBe('empty') // the ratings before F52 keep their hour
        clock.now = HOUR + 1
        expect((await adapter.get(QUERY)).enrichment.acclaim).toBeUndefined()
    })
})
