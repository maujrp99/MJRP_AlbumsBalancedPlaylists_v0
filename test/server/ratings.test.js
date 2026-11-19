/**
 * F52, slice 1 - ratings (POST /api/enrich-album). A failure of the source is a failure all the
 * way out: the scraper throws it from every search path, the service turns it into a typed
 * result, the route answers 5xx. "Not found" only when the source answered and nothing matched.
 * No network: the HTTP client and the HTML reader of the scraper are injected.
 */
import { describe, it, expect, vi } from 'vitest'
import { createRequire } from 'node:module'
import { fakeResponse, answerOf, fakeHttp, loadHtml, httpError, timeoutError, networkError } from './helpers/fakes.js'

const require = createRequire(import.meta.url)
const { createBestEverScraper } = require('../../server/lib/scrapers/besteveralbums.js')
const { UpstreamError } = require('../../server/lib/outcome.js')
const EnrichmentService = require('../../server/lib/services/EnrichmentService.js')
const { createAlbumHandlers } = require('../../server/routes/handlers/albums.js')

const NOTHING = ['q', [], [], []] // what suggest.php answers when it knows nothing
const EMPTY_PAGE = '<html><head><title>Search</title></head><body><p>No results</p></body></html>'
const quiet = { log: vi.fn(), warn: vi.fn(), error: vi.fn() }
// The shape of server/lib/logger.js, which is what the services receive: it has no `log`
const serviceLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
const scraperWith = (routes) => createBestEverScraper({ http: fakeHttp(routes), loadHtml, logger: quiet })
const queryOf = (url) => decodeURIComponent(url.split('q=')[1] || '')

describe('BestEverAlbums scraper: a failure of the source is thrown, from every search path', () => {
    const failures = [
        ['no answer', networkError(), 'upstream_failed'],
        ['a deadline', timeoutError(), 'upstream_timeout'],
        ['429', httpError(429), 'upstream_busy'],
        ['500', httpError(500), 'upstream_failed']
    ]
    failures.forEach(([name, error, code]) => {
        it(`the artist search answers with ${name}: ${code}, never "not found"`, async () => {
            const scraper = scraperWith([['suggest.php', error]])
            await expect(scraper.getRankingForAlbum('Album', 'Artist')).rejects.toMatchObject({ name: 'UpstreamError', code })
        })
    })

    it('the page of an artist candidate fails', async () => {
        const scraper = scraperWith([
            ['suggest.php', ['q', ['Artist'], [], ['/thechart.php?b=7']]],
            ['thechart.php?b=7', httpError(500)]
        ])
        await expect(scraper.getRankingForAlbum('Album', 'Artist')).rejects.toBeInstanceOf(UpstreamError)
    })

    it('the album search (suggest) fails', async () => {
        const scraper = scraperWith([['suggest.php', timeoutError()]])
        await expect(scraper.getRankingForAlbum('Album', '')).rejects.toMatchObject({ code: 'upstream_timeout' })
        await expect(scraper.findAlbumId('Album', '')).rejects.toMatchObject({ code: 'upstream_timeout' })
    })

    it('the page of an album candidate fails while it is being checked', async () => {
        const scraper = scraperWith([
            ['suggest.php', ['q', ['Something else'], [], ['/thechart.php?a=5']]],
            ['thechart.php?a=5', httpError(503)]
        ])
        await expect(scraper.findAlbumId('Album', '')).rejects.toMatchObject({ code: 'upstream_busy' })
    })

    it('the HTML search fails', async () => {
        const scraper = scraperWith([['suggest.php', NOTHING], ['search.php', networkError()]])
        await expect(scraper.getRankingForAlbum('Album', '')).rejects.toMatchObject({ code: 'upstream_failed' })
    })

    it('the album page found by the HTML search fails: it is not accepted unseen', async () => {
        const scraper = scraperWith([
            ['suggest.php', NOTHING],
            ['search.php', '<html><body><a href="/thechart.php?a=9">Album</a></body></html>'],
            ['thechart.php?a=9', httpError(500)]
        ])
        await expect(scraper.fetchAlbumPage('Album', '')).rejects.toBeInstanceOf(UpstreamError)
        await expect(scraper.getRankingForAlbum('Album', '')).rejects.toBeInstanceOf(UpstreamError)
    })

    it('one variation of the second search fails after the first search answered', async () => {
        const scraper = scraperWith([
            ['suggest.php', (url) => (queryOf(url) === 'Album' ? httpError(429) : NOTHING)],
            ['search.php', EMPTY_PAGE]
        ])
        await expect(scraper.getRankingForAlbum('Album: Deluxe', 'Artist')).rejects.toBeInstanceOf(UpstreamError)
        await expect(scraper.findAlbumId('Album', 'Artist')).rejects.toMatchObject({ code: 'upstream_busy' })
    })

    it('reading a known address fails', async () => {
        const scraper = scraperWith([['thechart.php?a=3', timeoutError()]])
        await expect(scraper.getRankingFromUrl('https://www.besteveralbums.com/thechart.php?a=3')).rejects.toMatchObject({ code: 'upstream_timeout' })
    })

    it('"not found" (null) only when every search answered and nothing matched', async () => {
        const http = fakeHttp([['suggest.php', NOTHING], ['search.php', EMPTY_PAGE]])
        const scraper = createBestEverScraper({ http, loadHtml, logger: quiet })
        await expect(scraper.getRankingForAlbum('Album', 'Artist')).resolves.toBeNull()
        expect(http.get.mock.calls.length).toBeGreaterThan(3) // the artist search, the album search, the HTML search, the variations
    })

    it('an answer of the search in an unexpected shape is "nothing", not a crash', async () => {
        const scraper = scraperWith([['suggest.php', '<html>busy</html>'], ['search.php', EMPTY_PAGE]])
        await expect(scraper.getRankingForAlbum('Album', 'Artist')).resolves.toBeNull()
    })
})

describe('EnrichmentService: a typed result, never a swallowed failure', () => {
    const tracks = [{ title: 'One' }, { title: 'Two' }]
    const albumData = { title: 'Album', artist: 'Artist', tracks }
    const normalizeRankingKey = async () => (text) => String(text || '').toLowerCase().trim()
    const serviceWith = (getBestEverRanking) => new EnrichmentService({ getBestEverRanking, normalizeRankingKey, logger: serviceLogger })
    const page = (evidence) => ({ provider: 'BestEverAlbums', referenceUrl: 'https://bea/thechart.php?a=1', albumId: '1', evidence })

    it('ratings that match the tracks: found', async () => {
        const result = await serviceWith(async () => page([{ trackTitle: 'One', rating: 90 }, { trackTitle: 'Two', rating: 80 }])).enrichAlbum(albumData)
        expect(result).toMatchObject({ ok: true, outcome: 'found' })
        expect(result.data.trackRatings).toEqual([{ title: 'One', rating: 90 }, { title: 'Two', rating: 80 }])
        expect(result.data.bestEverInfo).toEqual({ albumId: '1', url: 'https://bea/thechart.php?a=1', evidenceCount: 2 })
        expect(result.data.trackEvidence[0].evidence[0]).toMatchObject({ source: 'BestEverAlbums', score: 90 })
    })

    it('the source has no page for the album: not_found, with every track unrated', async () => {
        const result = await serviceWith(async () => null).enrichAlbum(albumData)
        expect(result).toMatchObject({ ok: true, outcome: 'not_found' })
        expect(result.data.bestEverInfo).toBeNull()
        expect(result.data.trackRatings).toEqual([{ title: 'One', rating: null }, { title: 'Two', rating: null }])
    })

    it('"not_found" says which version of the identity rule decided it (F68); the other outcomes do not', async () => {
        const { IDENTITY_RULE_VERSION } = await import('../../shared/albumIdentity.js')

        const notFound = await serviceWith(async () => null).enrichAlbum(albumData)
        const found = await serviceWith(async () => page([{ trackTitle: 'One', rating: 90 }])).enrichAlbum(albumData)
        const noRatings = await serviceWith(async () => page([])).enrichAlbum(albumData)

        expect(notFound.data.identityRule).toBe(IDENTITY_RULE_VERSION)
        expect(found.outcome).toBe('found')
        expect(found.data).not.toHaveProperty('identityRule')
        expect(noRatings.data).not.toHaveProperty('identityRule')
    })

    it('a page with no rating, or with ratings of no track of this album: no_ratings, and the page is told', async () => {
        const cases = [[], [{ trackTitle: 'One', rating: null }], [{ trackTitle: 'Another song', rating: 70 }]]
        for (const evidence of cases) {
            const result = await serviceWith(async () => page(evidence)).enrichAlbum(albumData)
            expect(result).toMatchObject({ ok: true, outcome: 'no_ratings' })
            expect(result.data.bestEverInfo.url).toBe('https://bea/thechart.php?a=1')
            expect(result.data.trackRatings.every(r => r.rating === null)).toBe(true)
        }
    })

    it('the source failed: a failure with the code of what happened, never a success', async () => {
        const table = [['upstream_timeout', 504], ['upstream_busy', 503], ['upstream_failed', 502]]
        for (const [code, status] of table) {
            const result = await serviceWith(async () => { throw new UpstreamError(code, 'x') }).enrichAlbum(albumData)
            expect(result).toMatchObject({ ok: false, code, status, retryable: true })
        }
    })

    it('a request without title or tracks is invalid_request', async () => {
        const scraper = vi.fn()
        for (const bad of [undefined, {}, { title: 'A' }, { tracks: [] }]) {
            expect(await serviceWith(scraper).enrichAlbum(bad)).toMatchObject({ ok: false, code: 'invalid_request', status: 400 })
        }
        expect(scraper).not.toHaveBeenCalled()
    })

    it('something that breaks inside is thrown, not answered as "no ratings"', async () => {
        const broken = new EnrichmentService({
            getBestEverRanking: async () => page([{ trackTitle: 'One', rating: 90 }]),
            normalizeRankingKey: async () => { throw new Error('ranking module missing') },
            logger: serviceLogger
        })
        await expect(broken.enrichAlbum(albumData)).rejects.toThrow('ranking module missing')
        await expect(serviceWith(async () => { throw new TypeError('bug') }).enrichAlbum(albumData)).rejects.toThrow('bug')
    })
})

describe('POST /api/enrich-album', () => {
    const body = { albumData: { title: 'Album', artist: 'Artist', tracks: [{ title: 'One' }] } }
    const handlersWith = (enrichAlbum, env = {}) => createAlbumHandlers({ enrichmentService: { enrichAlbum }, generationService: {}, env })
    const { success, failure } = require('../../server/lib/outcome.js')

    it('answers 200 with the outcome, and does not ask for the AI key it does not use', async () => {
        const res = fakeResponse()
        await handlersWith(async () => success({ trackRatings: [] }, 'not_found'), {}).enrichAlbum({ body }, res)
        expect(answerOf(res)).toMatchObject({ status: 200, body: { data: { trackRatings: [] }, outcome: 'not_found' } })
    })

    it('answers the failure of the source as 5xx with the one error format', async () => {
        const res = fakeResponse()
        await handlersWith(async () => failure('upstream_timeout')).enrichAlbum({ body }, res)
        expect(answerOf(res)).toEqual({ status: 504, headers: {}, body: { error: { code: 'upstream_timeout', retryable: true } } })
    })

    it('with the source down, the whole path answers an error, never not_found', async () => {
        const scraper = createBestEverScraper({ http: fakeHttp([[/./, networkError()]]), loadHtml, logger: quiet })
        const service = new EnrichmentService({
            getBestEverRanking: scraper.getRankingForAlbum, normalizeRankingKey: async () => (t) => t, logger: serviceLogger
        })
        const res = fakeResponse()
        await createAlbumHandlers({ enrichmentService: service, generationService: {}, env: {} }).enrichAlbum({ body }, res)
        expect(answerOf(res)).toMatchObject({ status: 502, body: { error: { code: 'upstream_failed', retryable: true } } })
    })

    it('with the source answering and nothing matching, the whole path answers not_found', async () => {
        const scraper = createBestEverScraper({ http: fakeHttp([['suggest.php', NOTHING], ['search.php', EMPTY_PAGE]]), loadHtml, logger: quiet })
        const service = new EnrichmentService({
            getBestEverRanking: scraper.getRankingForAlbum, normalizeRankingKey: async () => (t) => t, logger: serviceLogger
        })
        const res = fakeResponse()
        await createAlbumHandlers({ enrichmentService: service, generationService: {}, env: {} }).enrichAlbum({ body }, res)
        expect(answerOf(res)).toMatchObject({ status: 200, body: { outcome: 'not_found' } })
    })
})
