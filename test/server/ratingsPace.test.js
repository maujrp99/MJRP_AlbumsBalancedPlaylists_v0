/**
 * F52, slice 3 - ratings (POST /api/enrich-album) in time and at the source's pace: the scraper
 * hands every request to the polite queue and stops at the deadline of the album request; the
 * service shares identical requests in flight and answers within its budget; the route logs how
 * each request was answered. No network and no real time.
 */
import { describe, it, expect, vi } from 'vitest'
import { createRequire } from 'node:module'
import { fakeResponse, answerOf, fakeHttp, loadHtml, httpError } from './helpers/fakes.js'

const require = createRequire(import.meta.url)
const { createBestEverScraper, busyOfSource, BEA_PACE, REQUEST_TIMEOUT_MS } = require('../../server/lib/scrapers/besteveralbums.js')
const { createPoliteQueue, PaceError } = require('../../server/lib/politeQueue.js')
const { createBudget } = require('../../server/lib/timeBudget.js')
const { UpstreamError } = require('../../server/lib/outcome.js')
const EnrichmentService = require('../../server/lib/services/EnrichmentService.js')
const { createAlbumHandlers } = require('../../server/routes/handlers/albums.js')

const NOTHING = ['q', [], [], []]
const EMPTY_PAGE = '<html><head><title>Search</title></head><body><p>No results</p></body></html>'
const quiet = { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn() }
const NOT_FOUND_ROUTES = [['suggest.php', NOTHING], ['search.php', EMPTY_PAGE]]
const deferred = () => {
    let resolve, reject
    const promise = new Promise((res, rej) => { resolve = res; reject = rej })
    return { promise, resolve, reject }
}

describe('BestEverAlbums scraper: every request goes through the queue, with a deadline', () => {
    it('each request to the source is handed to the queue, with its own deadline of 8 s', async () => {
        const http = fakeHttp(NOT_FOUND_ROUTES)
        const pace = { run: vi.fn((task) => task()) }
        const scraper = createBestEverScraper({ http, loadHtml, logger: quiet, pace })

        expect(await scraper.getRankingForAlbum('Album', 'Artist')).toBeNull()
        expect(http.get).toHaveBeenCalled()
        expect(pace.run).toHaveBeenCalledTimes(http.get.mock.calls.length)
        expect(REQUEST_TIMEOUT_MS).toBe(8000)
        http.get.mock.calls.forEach(([, config]) => expect(config.timeout).toBe(8000))
    })

    it('within one album request the same address is asked once (the artist search is not repeated)', async () => {
        const http = fakeHttp(NOT_FOUND_ROUTES)
        const scraper = createBestEverScraper({ http, loadHtml, logger: quiet })
        const stats = { requests: 0 }

        await scraper.getRankingForAlbum('Album', 'Artist', { stats })
        const urls = http.get.mock.calls.map(([url]) => url)
        expect(new Set(urls).size).toBe(urls.length)
        expect(urls.filter(url => url.includes('search.php'))).toHaveLength(1)
        expect(stats.requests).toBe(urls.length)
    })

    it('another album request asks again: nothing is kept from one request to the next', async () => {
        const http = fakeHttp(NOT_FOUND_ROUTES)
        const scraper = createBestEverScraper({ http, loadHtml, logger: quiet })
        await scraper.getRankingForAlbum('Album', 'Artist')
        const first = http.get.mock.calls.length
        await scraper.getRankingForAlbum('Album', 'Artist')
        expect(http.get.mock.calls.length).toBe(first * 2)
    })

    it('near the deadline of the album request, a request gets only the time that is left', async () => {
        const http = fakeHttp(NOT_FOUND_ROUTES)
        const scraper = createBestEverScraper({ http, loadHtml, logger: quiet, now: () => 10000 })
        await scraper.getRankingForAlbum('Album', 'Artist', { deadlineAt: 13000 })
        http.get.mock.calls.forEach(([, config]) => expect(config.timeout).toBe(3000))
    })

    it('after the deadline of the album request nothing more is asked: upstream_timeout', async () => {
        let t = 0
        const http = fakeHttp([[/./, (url) => { t += 6000; return url.includes('search.php') ? EMPTY_PAGE : NOTHING }]])
        const scraper = createBestEverScraper({ http, loadHtml, logger: quiet, now: () => t })

        const error = await scraper.getRankingForAlbum('Album', 'Artist', { deadlineAt: 15000 }).catch(e => e)
        expect(error).toBeInstanceOf(UpstreamError)
        expect(error.code).toBe('upstream_timeout')
        expect(http.get.mock.calls.length).toBe(3) // 0 s, 6 s, 12 s; at 18 s it does not ask
    })

    it('the queue says the source asked to wait: upstream_busy, with how long', async () => {
        const pace = { run: async () => { throw new PaceError('busy', { retryAfterMs: 42000 }) } }
        const scraper = createBestEverScraper({ http: fakeHttp([]), loadHtml, logger: quiet, pace })
        const error = await scraper.getRankingForAlbum('Album', 'Artist').catch(e => e)
        expect(error).toMatchObject({ name: 'UpstreamError', code: 'upstream_busy', retryAfterMs: 42000 })
    })

    it('the queue says the turn would come too late: upstream_timeout', async () => {
        const pace = { run: async () => { throw new PaceError('deadline') } }
        const scraper = createBestEverScraper({ http: fakeHttp([]), loadHtml, logger: quiet, pace })
        await expect(scraper.getRankingForAlbum('Album', 'Artist')).rejects.toMatchObject({ code: 'upstream_timeout' })
    })

    it('with the real queue: a 429 of the source is asked again after the wait, and then answered', async () => {
        let t = 0
        const sleeps = []
        let refusals = 1
        const http = fakeHttp([
            ['suggest.php', () => (refusals-- > 0 ? httpError(429) : NOTHING)],
            ['search.php', EMPTY_PAGE]
        ])
        const pace = createPoliteQueue({
            ...BEA_PACE, minIntervalMs: 0, busyOf: busyOfSource(() => t), now: () => t, sleep: async (ms) => { sleeps.push(ms); t += ms }
        })
        const scraper = createBestEverScraper({ http, loadHtml, logger: quiet, pace, now: () => t })

        expect(await scraper.getRankingForAlbum('Album', 'Artist', { deadlineAt: 15000 })).toBeNull()
        expect(sleeps).toEqual([BEA_PACE.backoff.baseMs])
    })

    it('with the real queue: a source that keeps saying 429 ends as upstream_busy, never "not found"', async () => {
        let t = 0
        const pace = createPoliteQueue({
            ...BEA_PACE, minIntervalMs: 0, busyOf: busyOfSource(() => t), now: () => t, sleep: async (ms) => { t += ms }
        })
        const http = fakeHttp([[/./, httpError(429)]])
        const scraper = createBestEverScraper({ http, loadHtml, logger: quiet, pace, now: () => t })

        const error = await scraper.getRankingForAlbum('Album', 'Artist', { deadlineAt: 15000 }).catch(e => e)
        expect(error).toMatchObject({ name: 'UpstreamError', code: 'upstream_busy' })
        expect(error.retryAfterMs).toBeGreaterThan(0)
        expect(http.get.mock.calls.length).toBe(BEA_PACE.maxAttempts)
    })

    describe('what counts as "busy", and for how long', () => {
        const busyOf = busyOfSource(() => Date.parse('2026-11-19T12:00:00Z'))
        const answered = (status, headers = {}) => Object.assign(httpError(status), { response: { status, headers } })

        it('429 and 503 are "busy"; anything else is not', () => {
            expect(busyOf(answered(429))).toEqual({ retryAfterMs: null })
            expect(busyOf(answered(503))).toEqual({ retryAfterMs: null })
            expect(busyOf(answered(500))).toBeNull()
            expect(busyOf(answered(404))).toBeNull()
            expect(busyOf(new Error('no answer'))).toBeNull()
        })

        it('Retry-After is read in seconds or as a date; an unreadable one is as if absent', () => {
            expect(busyOf(answered(429, { 'retry-after': '30' }))).toEqual({ retryAfterMs: 30000 })
            expect(busyOf(answered(503, { 'retry-after': 'Thu, 19 Nov 2026 12:01:00 GMT' }))).toEqual({ retryAfterMs: 60000 })
            expect(busyOf(answered(429, { 'retry-after': 'soon' }))).toEqual({ retryAfterMs: null })
        })
    })

    it('the pace of the server is written down: 2 at once, 250 ms apart, waits of 1 s doubling up to 30 s, 3 attempts', () => {
        expect(BEA_PACE).toMatchObject({
            concurrency: 2, minIntervalMs: 250, maxAttempts: 3, backoff: { baseMs: 1000, factor: 2, maxMs: 30000 }
        })
    })
})

describe('EnrichmentService: one search per album at a time, inside a budget', () => {
    const serviceLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const page = (evidence) => ({ albumId: '1', referenceUrl: 'https://bea/thechart.php?a=1', evidence })
    const serviceWith = (getBestEverRanking, deps = {}) => new EnrichmentService({
        getBestEverRanking, logger: serviceLogger, ...deps
    })

    it('two identical requests at the same time search the source once; each gets the ratings of its own tracks', async () => {
        const gate = deferred()
        const scraper = vi.fn(() => gate.promise)
        const service = serviceWith(scraper)

        const first = service.enrichAlbum({ title: 'Album', artist: 'Artist', tracks: [{ title: 'One' }] })
        const second = service.enrichAlbum({ title: '  album ', artist: 'ARTIST', tracks: [{ title: 'Two' }] })
        gate.resolve(page([{ trackTitle: 'One', rating: 90 }, { trackTitle: 'Two', rating: 70 }]))
        const [a, b] = await Promise.all([first, second])

        expect(scraper).toHaveBeenCalledTimes(1)
        expect(a.data.trackRatings).toEqual([{ title: 'One', rating: 90 }])
        expect(b.data.trackRatings).toEqual([{ title: 'Two', rating: 70 }])
        expect([a.trace.how, b.trace.how]).toEqual(['source', 'joined'])
    })

    it('another album at the same time is another search', async () => {
        const scraper = vi.fn(async () => null)
        const service = serviceWith(scraper)
        await Promise.all([
            service.enrichAlbum({ title: 'Album', artist: 'Artist', tracks: [] }),
            service.enrichAlbum({ title: 'Album II', artist: 'Artist', tracks: [] })
        ])
        expect(scraper).toHaveBeenCalledTimes(2)
    })

    it('nothing is remembered: the same album asked later is searched again, after a success and after a failure', async () => {
        const scraper = vi.fn()
            .mockResolvedValueOnce(null)
            .mockRejectedValueOnce(new UpstreamError('upstream_failed', 'x'))
            .mockResolvedValueOnce(null)
        const service = serviceWith(scraper)
        const albumData = { title: 'Album', artist: 'Artist', tracks: [] }

        expect(await service.enrichAlbum(albumData)).toMatchObject({ outcome: 'not_found' })
        expect(await service.enrichAlbum(albumData)).toMatchObject({ ok: false, code: 'upstream_failed' })
        expect(await service.enrichAlbum(albumData)).toMatchObject({ outcome: 'not_found' })
        expect(scraper).toHaveBeenCalledTimes(3)
    })

    it('the scraper is told when the request ends, and counts its requests to the source', async () => {
        const scraper = vi.fn(async (title, artist, { stats }) => { stats.requests = 3; return null })
        const service = serviceWith(scraper, { newBudget: () => createBudget({ ms: 15000, now: () => 1000 }) })

        const result = await service.enrichAlbum({ title: 'Album', artist: 'Artist', tracks: [] })
        expect(scraper.mock.calls[0][2].deadlineAt).toBe(16000)
        expect(result.trace).toEqual({ how: 'source', sourceRequests: 3 })
    })

    it('the budget is 15 s, under the 20 s the app waits', () => {
        expect(EnrichmentService.ALBUM_BUDGET_MS).toBe(15000)
    })

    it('a search still running when the budget ends is answered upstream_timeout (504, retryable)', async () => {
        const timers = []
        const newBudget = () => createBudget({
            ms: 15000, now: () => 0, setTimer: (fn) => { timers.push(fn); return fn }, clearTimer: () => {}
        })
        const service = serviceWith(() => new Promise(() => {}), { newBudget })

        const answering = service.enrichAlbum({ title: 'Album', artist: 'Artist', tracks: [] })
        await Promise.resolve()
        timers.forEach(fire => fire())
        expect(await answering).toMatchObject({ ok: false, code: 'upstream_timeout', status: 504, retryable: true })
    })

    it('"the source asked to wait" is answered 503 with the wait in seconds, rounded up', async () => {
        const service = serviceWith(async () => { throw new UpstreamError('upstream_busy', 'x', { retryAfterMs: 4200 }) })
        const result = await service.enrichAlbum({ title: 'Album', artist: 'Artist', tracks: [] })
        expect(result).toMatchObject({ ok: false, code: 'upstream_busy', status: 503, retryable: true, retryAfterSeconds: 5 })
    })
})

describe('POST /api/enrich-album: the answer in time, and one line of log per request', () => {
    const body = { albumData: { title: 'A secret album', artist: 'A secret artist', tracks: [{ title: 'One' }] } }
    const { success, failure } = require('../../server/lib/outcome.js')

    const handlersWith = (enrichAlbum, logger, times = [100, 350]) => createAlbumHandlers({
        enrichmentService: { enrichAlbum }, generationService: {}, env: {}, logger, now: () => times.shift()
    })

    it('says how it was answered, with what, in how long and with how many requests to the source', async () => {
        const logger = { info: vi.fn() }
        const result = { ...success({ trackRatings: [] }, 'not_found'), trace: { how: 'source', sourceRequests: 6 } }
        await handlersWith(async () => result, logger).enrichAlbum({ body }, fakeResponse())

        expect(logger.info).toHaveBeenCalledTimes(1)
        expect(logger.info).toHaveBeenCalledWith('enrich', { event: 'enrich', how: 'source', answer: 'not_found', ms: 250, sourceRequests: 6 })
    })

    it('a failure is logged with its code; a request that joined another says so', async () => {
        const logger = { info: vi.fn() }
        const result = { ...failure('upstream_timeout'), trace: { how: 'joined', sourceRequests: 0 } }
        await handlersWith(async () => result, logger).enrichAlbum({ body }, fakeResponse())
        expect(logger.info.mock.calls[0][1]).toMatchObject({ how: 'joined', answer: 'upstream_timeout', sourceRequests: 0 })
    })

    it('a request that never reached the source says "none"', async () => {
        const logger = { info: vi.fn() }
        await handlersWith(async () => failure('invalid_request'), logger).enrichAlbum({ body: {} }, fakeResponse())
        expect(logger.info.mock.calls[0][1]).toMatchObject({ how: 'none', answer: 'invalid_request' })
    })

    it('the line names neither the album nor the person', async () => {
        const logger = { info: vi.fn() }
        const result = { ...success({ trackRatings: [] }), trace: { how: 'source', sourceRequests: 3 } }
        await handlersWith(async () => result, logger).enrichAlbum({ body, user: { uid: 'person-1', email: 'a@b.c' } }, fakeResponse())
        const line = JSON.stringify(logger.info.mock.calls[0])
        expect(line).not.toMatch(/secret|person-1|a@b\.c/)
        expect(Object.keys(logger.info.mock.calls[0][1]).sort()).toEqual(['answer', 'event', 'how', 'ms', 'sourceRequests'])
    })

    it('the trace does not go on the wire, and "wait" leaves with Retry-After', async () => {
        const res = fakeResponse()
        const result = { ...failure('upstream_busy', { retryAfterSeconds: 5 }), trace: { how: 'source', sourceRequests: 3 } }
        await handlersWith(async () => result, { info: vi.fn() }).enrichAlbum({ body }, res)
        expect(answerOf(res)).toEqual({
            status: 503, headers: { 'Retry-After': '5' }, body: { error: { code: 'upstream_busy', retryable: true } }
        })
    })

    it('the whole path with the real pieces: the source says 429 until the request gives up; 503, Retry-After, one line', async () => {
        let t = 0
        const pace = createPoliteQueue({
            ...BEA_PACE, minIntervalMs: 0, busyOf: busyOfSource(() => t), now: () => t, sleep: async (ms) => { t += ms }
        })
        const scraper = createBestEverScraper({ http: fakeHttp([[/./, httpError(429)]]), loadHtml, logger: quiet, pace, now: () => t })
        const service = new EnrichmentService({
            getBestEverRanking: scraper.getRankingForAlbum,
            logger: quiet,
            newBudget: () => createBudget({ ms: 15000, now: () => t })
        })
        const logger = { info: vi.fn() }
        const res = fakeResponse()
        await createAlbumHandlers({ enrichmentService: service, generationService: {}, env: {}, logger, now: () => t }).enrichAlbum({ body }, res)

        const answer = answerOf(res)
        expect(answer).toMatchObject({ status: 503, body: { error: { code: 'upstream_busy', retryable: true } } })
        expect(Number(answer.headers['Retry-After'])).toBeGreaterThan(0)
        expect(logger.info.mock.calls[0][1]).toMatchObject({ how: 'source', answer: 'upstream_busy', sourceRequests: BEA_PACE.maxAttempts })
    })
})
