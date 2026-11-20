/**
 * F70, UAT-210 - POST /api/generate says what happened to each source of ratings
 * (`data.ratings = { acclaim, popularity, aiRanking }`, F52 slice 5). The app reads it:
 *
 *   found                       the ratings that came with the album are used as they are
 *   failed | not_asked |        the source was not heard: it says nothing about the album. The app's
 *   not_configured              own source is asked through its normal path, and a failure there
 *                               is "failed", never "this album has no ratings"
 *   not_found | no_ratings      the same trust rules as the app's own answers: the app's source is
 *                               asked, and ITS answer (with its reason and its rule) is what is kept
 *   (no `ratings`: old server)  as before
 *
 * The answer is built by the server's own builder (lib/outcome.js); the album goes through the real
 * API client, the real ratings enricher and the real album load.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createRequire } from 'node:module'

vi.mock('../../public/js/services/MusicKitService.js', () => ({ musicKitService: {} }))
vi.mock('../../public/js/services/AlbumLoader.js', () => ({ albumLoader: {} }))

import { APIClient, ApiError } from '../../public/js/api/client.js'
import { SourceOutcome, readRatingsOutcome, ratingsOutcomeOf, cameWithTheAlbum } from '../../public/js/models/ratingsOutcome.js'
import { AcclaimEnricher } from '../../public/js/services/albums/adapters/enrichers.js'
import { CatalogAdapter } from '../../public/js/services/albums/adapters/CatalogAdapter.js'
import { AlbumLoadService } from '../../public/js/services/albums/AlbumLoadService.js'
import { AlbumLoadStore } from '../../public/js/stores/albumLoad.js'
import { queryKey } from '../../public/js/models/albumLoadState.js'

const require = createRequire(import.meta.url)
const { success, bodyOf } = require('../../server/lib/outcome.js')

const PAGE = 'https://www.besteveralbums.com/thechart.php?a=1'
const tracks = () => [{ id: 't1', title: 'One', rank: 1 }, { id: 't2', title: 'Two', rank: 2 }]
/** The album as the server answers it. `page` is true when the source's page was read. */
const answered = ({ ratings, page = false } = {}) => ({
    title: 'Album',
    artist: 'Artist',
    year: 1999,
    tracks: tracks(),
    tracksByAcclaim: tracks(),
    ...(page ? { bestEverUrl: PAGE, bestEverAlbumId: '1', bestEverEvidence: [{ trackTitle: 'One', rating: null }] } : {}),
    ...(ratings ? { ratings } : {})
})
const wire = (data) => ({ ok: true, status: 200, statusText: 'OK', json: async () => bodyOf(success(data)) })

describe('what the server said about each source of ratings (models/ratingsOutcome.js)', () => {
    it('reads the three sources, each with one of the six outcomes', () => {
        expect(readRatingsOutcome({ acclaim: 'failed', popularity: 'not_configured', aiRanking: 'found' }))
            .toEqual({ acclaim: 'failed', popularity: 'not_configured', aiRanking: 'found' })
        expect(Object.values(SourceOutcome).sort()).toEqual(['failed', 'found', 'no_ratings', 'not_asked', 'not_configured', 'not_found'])
    })

    it('the server before slice 5 says nothing: null', () => {
        expect(readRatingsOutcome(undefined)).toBeNull()
        expect(readRatingsOutcome(null)).toBeNull()
        expect(readRatingsOutcome('found')).toBeNull()
        expect(readRatingsOutcome([])).toBeNull()
    })

    it('an outcome or a source it does not know is not passed on', () => {
        expect(readRatingsOutcome({ acclaim: 'exploded', popularity: 'found', somethingNew: 'found' })).toEqual({ popularity: 'found' })
        expect(readRatingsOutcome({ acclaim: 'exploded' })).toBeNull()
    })

    it.each([
        ['found', true], ['failed', false], ['not_asked', false], ['not_configured', false], ['not_found', false], ['no_ratings', false]
    ])('"%s": what came with the album may be used as it is: %s', (outcome, expected) => {
        expect(cameWithTheAlbum({ acclaim: outcome }, 'acclaim')).toBe(expected)
    })

    it('when the server said nothing (the old server), what came with the album is used, as before', () => {
        expect(cameWithTheAlbum(null, 'acclaim')).toBe(true)
        expect(cameWithTheAlbum({ popularity: 'failed' }, 'acclaim')).toBe(true)
    })
})

describe('the album of POST /api/generate carries what the server said (UAT-210)', () => {
    let client
    let fetchMock

    beforeEach(() => {
        fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
        client = new APIClient()
        client.mayUsePaidRoutes = () => true
        vi.spyOn(console, 'debug').mockImplementation(() => {})
        vi.spyOn(console, 'warn').mockImplementation(() => {})
    })
    afterEach(() => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    const albumFor = async (data) => {
        fetchMock.mockResolvedValueOnce(wire(data))
        return client._fetchAlbumFromAPI('Artist - Album')
    }

    it('the outcome of each source stays on the album, for whoever tells the person', async () => {
        const album = await albumFor(answered({ ratings: { acclaim: 'failed', popularity: 'not_configured', aiRanking: 'found' } }))

        expect(album.metadata.ratingsOutcome).toEqual({ acclaim: 'failed', popularity: 'not_configured', aiRanking: 'found' })
        expect(ratingsOutcomeOf(album, 'acclaim')).toBe('failed')
        expect(ratingsOutcomeOf(album, 'popularity')).toBe('not_configured')
    })

    it('the server before slice 5 (no `ratings`): nothing is carried, and the album is as before', async () => {
        const album = await albumFor(answered({ page: true }))

        expect('ratingsOutcome' in album.metadata).toBe(false)
        expect(ratingsOutcomeOf(album, 'acclaim')).toBeNull()
        expect(album.bestEverUrl).toBe(PAGE)
    })

    it('found: the page of the source and what came with it are kept as they are', async () => {
        const album = await albumFor(answered({ page: true, ratings: { acclaim: 'found', popularity: 'not_asked', aiRanking: 'not_asked' } }))

        expect(album).toMatchObject({ bestEverUrl: PAGE, bestEverAlbumId: '1' })
    })

    it.each(['no_ratings', 'not_found', 'failed', 'not_asked', 'not_configured'])(
        '%s: the page address is not kept (an album with that address reads as "already has its ratings")', async (acclaim) => {
            const album = await albumFor(answered({ page: true, ratings: { acclaim, popularity: 'not_asked', aiRanking: 'found' } }))

            expect(album.bestEverUrl).toBeUndefined()
            expect(album.bestEverAlbumId).toBeUndefined()
            expect(album.tracks.map(t => t.title)).toEqual(['One', 'Two'])
        })
})

describe('the album load with an album of the second source (UAT-210)', () => {
    let fetchMock

    beforeEach(() => {
        fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
        vi.spyOn(console, 'debug').mockImplementation(() => {})
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})
    })
    afterEach(() => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    /** The real client, catalog adapter, ratings enricher and load; Apple Music has no such album. */
    const build = ({ generate, requestRatings }) => {
        fetchMock.mockResolvedValueOnce(wire(generate))
        const client = new APIClient()
        client.mayUsePaidRoutes = () => true
        const store = new AlbumLoadStore()
        const records = new Map()
        const cache = {
            get: vi.fn(async (query) => records.get(queryKey(query)) || null),
            saveBase: vi.fn(async (query, album) => { records.set(queryKey(query), { album, enrichment: {} }) }),
            saveEnrichment: vi.fn(async () => {})
        }
        const asked = vi.fn(requestRatings)
        const empty = { enrich: async (album) => ({ status: 'empty', album }) }
        const service = new AlbumLoadService({
            store,
            cache,
            catalog: new CatalogAdapter({
                musicKit: { searchAlbums: async () => [], getAlbumDetails: async () => null, getArtworkUrl: () => null },
                fetchFromServer: (query) => client._fetchAlbumFromAPI(query),
                generateAlbumId: (data) => client.generateAlbumId(data),
                retryWaitsMs: []
            }),
            enrichers: {
                acclaim: new AcclaimEnricher({
                    requestRatings: asked,
                    applyRatings: (album, data) => { if (data.bestEverInfo?.url) album.bestEverUrl = data.bestEverInfo.url }
                }),
                popularity: empty,
                userRanking: empty
            }
        })
        return { service, store, cache, asked }
    }
    const load = async (service) => {
        service.load({ scopeKey: 'ALL', series: [{ id: 's1', albumQueries: ['Artist - Album'] }] })
        await service.whenIdle()
    }
    const acclaimOf = (store) => store.getEntries('s1')[0].enrichment.acclaim
    const acclaimSaves = (cache) => cache.saveEnrichment.mock.calls.filter(call => call[2] === 'acclaim').map(call => call.slice(3))

    it.each(['failed', 'not_asked', 'not_configured'])(
        'the server said "%s": the app asks its own source, and a failure there is "failed", never "has no ratings"', async (acclaim) => {
            const { service, store, cache, asked } = build({
                generate: answered({ ratings: { acclaim, popularity: 'not_asked', aiRanking: 'found' } }),
                requestRatings: async () => { throw new ApiError('POST /enrich-album answered HTTP 502 (upstream_failed)', { kind: 'http', status: 502, code: 'upstream_failed', retryable: true }) }
            })

            await load(service)

            expect(asked).toHaveBeenCalledTimes(1)
            expect(acclaimOf(store)).toBe('failed')
            expect(acclaimSaves(cache)).toEqual([])
        })

    it('the server said "failed" and the app\'s own source answers: its ratings are the ones kept', async () => {
        const { service, store, cache, asked } = build({
            generate: answered({ ratings: { acclaim: 'failed', popularity: 'not_asked', aiRanking: 'found' } }),
            requestRatings: async () => ({ kind: 'found', data: { bestEverInfo: { url: PAGE }, trackRatings: [] } })
        })

        await load(service)

        expect(asked).toHaveBeenCalledTimes(1)
        expect(acclaimOf(store)).toBe('done')
        expect(store.getEntries('s1')[0].album.bestEverUrl).toBe(PAGE)
        expect(acclaimSaves(cache)).toEqual([['done', { reason: null }]])
    })

    it('the server said "found": the ratings that came with the album are used, and nothing is asked', async () => {
        const { service, store, asked } = build({
            generate: answered({ page: true, ratings: { acclaim: 'found', popularity: 'not_asked', aiRanking: 'not_asked' } }),
            requestRatings: async () => { throw new Error('must not be asked') }
        })

        await load(service)

        expect(asked).not.toHaveBeenCalled()
        expect(acclaimOf(store)).toBe('done')
    })

    it('the server said "no_ratings" with the page: it is not "done"; the app\'s own answer says why, with its trust time', async () => {
        const { service, store, cache, asked } = build({
            generate: answered({ page: true, ratings: { acclaim: 'no_ratings', popularity: 'not_asked', aiRanking: 'found' } }),
            requestRatings: async () => ({ kind: 'no_ratings', data: { bestEverInfo: null, trackRatings: [] } })
        })

        await load(service)

        expect(asked).toHaveBeenCalledTimes(1)
        expect(acclaimOf(store)).toBe('empty')
        expect(acclaimSaves(cache)).toEqual([['empty', { reason: 'no_ratings' }]])
    })

    it('the server said "not_found": the app\'s own answer is kept, with the version of the rule that decided it', async () => {
        const { service, store, cache } = build({
            generate: answered({ ratings: { acclaim: 'not_found', popularity: 'not_asked', aiRanking: 'found' } }),
            requestRatings: async () => ({ kind: 'not_found', data: { bestEverInfo: null, trackRatings: [], identityRule: 7 } })
        })

        await load(service)

        expect(acclaimOf(store)).toBe('empty')
        expect(acclaimSaves(cache)).toEqual([['empty', { reason: 'not_found', rule: 7 }]])
    })

    it('the old server (no `ratings`) with the page: as before, the album already has its ratings', async () => {
        const { service, store, asked } = build({
            generate: answered({ page: true }),
            requestRatings: async () => { throw new Error('must not be asked') }
        })

        await load(service)

        expect(asked).not.toHaveBeenCalled()
        expect(acclaimOf(store)).toBe('done')
    })

    it('what the server said is still on the album the screen gets', async () => {
        const { service, store } = build({
            generate: answered({ ratings: { acclaim: 'failed', popularity: 'not_configured', aiRanking: 'found' } }),
            requestRatings: async () => ({ kind: 'found', data: { bestEverInfo: { url: PAGE }, trackRatings: [] } })
        })

        await load(service)

        expect(ratingsOutcomeOf(store.getEntries('s1')[0].album, 'popularity')).toBe('not_configured')
    })
})
