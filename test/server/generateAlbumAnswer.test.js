/**
 * F52, slice 5 - the album POST /api/generate answers, with its ratings: the paid answer read into
 * an album, the ranking fetched, consolidated and written on the tracks. Written against
 * `GenerationService._albumFromResponse` when it was one function of complexity 65, and kept: the
 * cases pass unchanged against the small steps, but for the three the slice changed on purpose
 * (they say so). The last groups are what the slice added: `data.ratings`, the time of the request,
 * the prompts, the log line.
 * The service runs whole, with the real consolidation; only the outside is a double (the paid
 * provider, the scraper, Spotify): no network, no paid call.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRequire } from 'node:module'
import { rankingFetchWith, beaPage, spotifyFound, aiRanking, BEA_URL, SPOTIFY_URL, PROMPTS } from './helpers/rankingHarness.js'
import { readFileSync } from 'node:fs'
import { httpError, fakeResponse, answerOf } from './helpers/fakes.js'

const require = createRequire(import.meta.url)
const GenerationService = require('../../server/lib/services/GenerationService.js')
const { consolidateRanking } = require('../../server/lib/ranking.js')
const { renderPrompt, PromptsError } = require('../../server/lib/prompts.js')
const { UpstreamError, bodyOf } = require('../../server/lib/outcome.js')
const { createBudget } = require('../../server/lib/timeBudget.js')
const { createAlbumHandlers } = require('../../server/routes/handlers/albums.js')
const { asyncRoute, errorResponder } = require('../../server/lib/asyncRoute.js')

const quiet = { log: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
const TITLES = ['One', 'Two', 'Three', 'Four']
/** The album the paid provider answered, as the reader of its answer hands it over. */
const answeredAlbum = (extra = {}) => ({ title: 'Album', artist: 'Artist', year: 1999, tracks: TITLES.map(title => ({ title })), ...extra })
const ALBUM_ANSWER = { status: 200, data: { candidates: [] } }
const CONFIG = { processEnv: { AI_API_KEY: 'k' }, startTime: 0, allowRawStage: false }
const QUERY = 'Artist - Album'

/**
 * The service over the ranking fetch with its doubles. The paid provider is one double for the two
 * prompts: the album search answers `ALBUM_ANSWER`, the ranking prompt answers `ai`.
 */
const serviceWith = ({ album = answeredAlbum(), overrides = {}, ...sources } = {}) => {
    const fetch = rankingFetchWith(sources)
    const albumCalls = vi.fn(async () => ALBUM_ANSWER)
    const service = new GenerationService({
        loadPrompts: () => PROMPTS,
        renderPrompt,
        callProvider: albumCalls,
        extractAlbum: () => album,
        validateAlbum: null,
        ajvAvailable: false,
        getBestEverRanking: fetch.bestEver,
        fetchRankingForAlbum: fetch.fetchRankingForAlbum,
        consolidateRanking,
        logger: quiet,
        ...overrides
    })
    return { service, fetch, albumCalls }
}
const generate = (service, body = { albumQuery: QUERY }, config = CONFIG) => service.generateAlbum(body, config)
/** [title, rank, rating] of each track. */
const tracksOf = (list) => list.map(t => [t.title, t.rank, t.rating])

beforeEach(() => {
    ['log', 'warn', 'error'].forEach(method => vi.spyOn(console, method).mockImplementation(() => {}))
})
afterEach(() => vi.restoreAllMocks())

describe('POST /api/generate: the album and its ratings, BestEverAlbums has them', () => {
    const RATED = { One: 70, Two: 90, Three: 80, Four: 60 }

    it('the album search prompt is what the paid provider is asked', async () => {
        const { service, albumCalls } = serviceWith({ bestEver: beaPage(RATED) })
        await generate(service)

        expect(albumCalls).toHaveBeenCalledTimes(1)
        expect(albumCalls).toHaveBeenCalledWith(expect.objectContaining({ prompt: 'find Artist - Album', albumQuery: QUERY, aiApiKey: 'k' }))
    })

    it('each track gets its rating and its rank (by rating), and the tracks are also listed by acclaim', async () => {
        const { service } = serviceWith({ bestEver: beaPage(RATED) })
        const { ok, outcome, data } = await generate(service)

        expect({ ok, outcome }).toEqual({ ok: true, outcome: 'found' })
        expect(data).toMatchObject({ title: 'Album', artist: 'Artist', year: 1999 })
        expect(tracksOf(data.tracks)).toEqual([['One', 3, 70], ['Two', 1, 90], ['Three', 2, 80], ['Four', 4, 60]])
        expect(tracksOf(data.tracksByAcclaim)).toEqual([['Two', 1, 90], ['Three', 2, 80], ['One', 3, 70], ['Four', 4, 60]])
    })

    it('the album carries the entries of the source, the consolidated ranking and where it came from', async () => {
        const { service } = serviceWith({ bestEver: beaPage(RATED) })
        const { data } = await generate(service)

        expect(data.rankingAcclaim.map(e => [e.provider, e.trackTitle, e.position, e.rating])).toEqual([
            ['BestEverAlbums', 'One', 1, 70], ['BestEverAlbums', 'Two', 2, 90], ['BestEverAlbums', 'Three', 3, 80], ['BestEverAlbums', 'Four', 4, 60]
        ])
        expect(data.rankingConsolidated.map(r => [r.trackTitle, r.finalPosition, r.rating])).toEqual([['Two', 1, 90], ['Three', 2, 80], ['One', 3, 70], ['Four', 4, 60]])
        expect(data.rankingSources).toEqual([{ provider: 'BestEverAlbums', providerType: 'community', referenceUrl: BEA_URL }])
        expect(data.rankingConsolidatedMeta).toMatchObject({
            unmatchedMentions: [],
            tracksWithoutSupport: [],
            debugInfo: { tracksCount: 4, acclaimCount: 4, providersCount: 1 },
            rankingEntriesCount: 4,
            rankingEntriesSample: { provider: 'BestEverAlbums', trackTitle: 'One', position: 1, rating: 70, referenceUrl: BEA_URL }
        })
        expect(data.bestEverEvidence).toEqual(beaPage(RATED).evidence)
        expect(data.bestEverUrl).toBe(BEA_URL)
        expect(data.bestEverAlbumId).toBe('1')
    })

    it('the scraper is asked once', async () => {
        const { service, fetch } = serviceWith({ bestEver: beaPage(RATED) })
        await generate(service)

        expect(fetch.bestEver).toHaveBeenCalledTimes(1)
    })

    it('the sources the AI named for the album stay first in the list', async () => {
        const named = { provider: 'Wikipedia', referenceUrl: 'https://en.wikipedia.org/wiki/Album' }
        const { service } = serviceWith({ album: answeredAlbum({ rankingSources: [named] }), bestEver: beaPage(RATED) })
        const { data } = await generate(service)

        expect(data.rankingSources).toEqual([named, { provider: 'BestEverAlbums', providerType: 'community', referenceUrl: BEA_URL }])
    })
})

describe('POST /api/generate: the album and its ratings, from Spotify popularity', () => {
    const POPULARITY = { One: 10, Two: 90, Three: 50, Four: 30 }

    it('BestEverAlbums has no page: the popularity is the rating of each track, and nothing of BestEverAlbums is on the album', async () => {
        const { service } = serviceWith({ bestEver: null, spotify: spotifyFound(POPULARITY) })
        const { data } = await generate(service)

        expect(tracksOf(data.tracks)).toEqual([['One', 4, 10], ['Two', 1, 90], ['Three', 2, 50], ['Four', 3, 30]])
        expect(data.rankingSources).toEqual([{ provider: 'Spotify', providerType: 'popularity', referenceUrl: SPOTIFY_URL }])
        expect(data.rankingAcclaim.map(e => e.provider)).toEqual(['Spotify', 'Spotify', 'Spotify', 'Spotify'])
        expect(data.bestEverEvidence).toBeUndefined()
        expect(data.bestEverUrl).toBeUndefined()
    })

    it('the page has few ratings and Spotify wins: the popularity is the rating, and the page stays on the album as evidence, its source first', async () => {
        const page = beaPage({ One: 70, Two: null, Three: null, Four: null })
        const { service } = serviceWith({ bestEver: page, spotify: spotifyFound(POPULARITY) })
        const { data } = await generate(service)

        expect(tracksOf(data.tracks)).toEqual([['One', 4, 10], ['Two', 1, 90], ['Three', 2, 50], ['Four', 3, 30]])
        expect(data.rankingSources).toEqual([
            { provider: 'BestEverAlbums', providerType: 'community', referenceUrl: BEA_URL },
            { provider: 'Spotify', providerType: 'popularity', referenceUrl: SPOTIFY_URL }
        ])
        expect(data.bestEverEvidence).toEqual(page.evidence)
        expect(data.bestEverAlbumId).toBe('1')
    })

    // Changed by the slice: before, the scraper was asked a second time here, and the address of the page was lost
    it('the scraper is asked once on this path too, and the album keeps the address of the page', async () => {
        const page = beaPage({ One: 70, Two: null, Three: null, Four: null })
        const { service, fetch } = serviceWith({ bestEver: page, spotify: spotifyFound(POPULARITY) })
        const { data } = await generate(service)

        expect(fetch.bestEver).toHaveBeenCalledTimes(1)
        expect(data.bestEverUrl).toBe(BEA_URL)
    })
})

describe('POST /api/generate: the album and its ratings, from the AI ranking', () => {
    it('the ranking has positions and no rating: the tracks are ranked by points, the ones not named after', async () => {
        const { service } = serviceWith({ bestEver: null, ai: aiRanking([['Three', 'Rolling Stone'], ['One', 'NME']]) })
        const { data } = await generate(service)

        expect(tracksOf(data.tracks)).toEqual([['One', 2, undefined], ['Two', 3, undefined], ['Three', 1, undefined], ['Four', 4, undefined]])
        expect(data.rankingConsolidatedMeta.tracksWithoutSupport).toEqual(['Two', 'Four'])
        expect(data.rankingSources.map(s => s.name)).toEqual(['Rolling Stone', 'NME'])
    })
})

describe('POST /api/generate: the album when no source has ratings for it', () => {
    it('the album leaves as found, its tracks ranked in album order, with no entry and no source', async () => {
        const { service } = serviceWith({ bestEver: null, spotify: { outcome: 'not_found' }, ai: aiRanking([]) })
        const { ok, outcome, data } = await generate(service)

        expect({ ok, outcome }).toEqual({ ok: true, outcome: 'found' })
        expect(tracksOf(data.tracks)).toEqual([['One', 1, undefined], ['Two', 2, undefined], ['Three', 3, undefined], ['Four', 4, undefined]])
        expect(tracksOf(data.tracksByAcclaim)).toEqual(tracksOf(data.tracks))
        expect(data.rankingSources).toEqual([])
        expect(data.rankingAcclaim).toBeUndefined()
        expect(data.rankingConsolidated.map(r => [r.trackTitle, r.finalPosition, r.rating])).toEqual([['One', 1, null], ['Two', 2, null], ['Three', 3, null], ['Four', 4, null]])
        expect(data.rankingConsolidatedMeta).toMatchObject({ rankingEntriesCount: 0, rankingEntriesSample: null })
    })

    it('every source of ratings fails: the album still leaves as found, with the same tracks', async () => {
        const down = () => new UpstreamError('upstream_failed', 'the source is down')
        const { service } = serviceWith({ bestEver: down, spotify: down, ai: httpError(500) })
        const { ok, outcome, data } = await generate(service)

        expect({ ok, outcome }).toEqual({ ok: true, outcome: 'found' })
        expect(tracksOf(data.tracks)).toEqual([['One', 1, undefined], ['Two', 2, undefined], ['Three', 3, undefined], ['Four', 4, undefined]])
        expect(data.rankingSources).toEqual([])
        expect(data.rankingAcclaim).toBeUndefined()
    })
})

describe('POST /api/generate: the raw stage (a debug feature)', () => {
    it('when it is allowed, the answer is the provider\'s answer to the ranking prompt, as it came', async () => {
        const answer = aiRanking([['One', 'NME']])
        const { service } = serviceWith({ ai: answer })
        const { ok, data } = await generate(service, { albumQuery: QUERY, rawStage: 'ranking' }, { ...CONFIG, allowRawStage: true })

        expect(ok).toBe(true)
        expect(data).toEqual({ rawRankingResponse: answer.data })
    })

    it('when it is not allowed, the request is answered as any other', async () => {
        const { service } = serviceWith({ bestEver: null })
        const { data } = await generate(service, { albumQuery: QUERY, rawStage: 'ranking' })

        expect(data.rawRankingResponse).toBeUndefined()
        expect(data.title).toBe('Album')
    })
})

describe('POST /api/generate: an album with no list of tracks', () => {
    it('leaves with the entries of the source and the consolidated ranking made of them', async () => {
        const { service } = serviceWith({ album: { title: 'Album', artist: 'Artist' }, bestEver: beaPage({ One: 70, Two: 90 }) })
        const { data } = await generate(service)

        expect(data.tracks).toBeUndefined()
        expect(data.tracksByAcclaim).toBeUndefined()
        expect(data.rankingConsolidated.map(r => [r.trackTitle, r.finalPosition, r.rating])).toEqual([['Two', 1, 90], ['One', 2, 70]])
    })
})

describe('POST /api/generate: what breaks inside this server', () => {
    // Changed by the slice: before, this was answered 200, as an album with an empty ranking
    it('a consolidation that breaks is thrown to the error path of the route, never answered as an album with no ranking', async () => {
        const overrides = { consolidateRanking: async () => { throw new Error('consolidation bug') } }
        const { service } = serviceWith({ bestEver: beaPage({ One: 70, Two: 90, Three: 80, Four: 60 }), overrides })

        await expect(generate(service)).rejects.toThrow('consolidation bug')
    })
})

describe('POST /api/generate: the album says what happened to its ratings (F52, slice 5)', () => {
    const RATED = { One: 70, Two: 90, Three: 80, Four: 60 }
    const down = () => new UpstreamError('upstream_failed', 'the source is down')

    it.each([
        ['the ratings were found', { bestEver: beaPage(RATED) }, { acclaim: 'found', popularity: 'not_asked', aiRanking: 'not_asked' }],
        ['no source has ratings', { bestEver: null, spotify: { outcome: 'not_found' }, ai: aiRanking([]) }, { acclaim: 'not_found', popularity: 'not_found', aiRanking: 'not_found' }],
        ['the ratings could not be fetched', { bestEver: down, spotify: down, ai: httpError(500) }, { acclaim: 'failed', popularity: 'failed', aiRanking: 'failed' }],
        ['Spotify is not set up on this server', { bestEver: null, spotify: { outcome: 'not_configured' }, ai: aiRanking([]) }, { acclaim: 'not_found', popularity: 'not_configured', aiRanking: 'not_found' }]
    ])('%s: the album is found, and `data.ratings` says it source by source', async (name, sources, ratings) => {
        const { service } = serviceWith(sources)
        const result = await generate(service)

        expect(result).toMatchObject({ ok: true, status: 200, outcome: 'found' })
        expect(result.data.ratings).toEqual(ratings)
    })

    it('"no ratings exist" and "the ratings could not be fetched" leave with the same tracks and a different `ratings`', async () => {
        const none = await generate(serviceWith({ bestEver: null, spotify: { outcome: 'not_found' }, ai: aiRanking([]) }).service)
        const failed = await generate(serviceWith({ bestEver: down, spotify: down, ai: httpError(500) }).service)

        expect(tracksOf(failed.data.tracks)).toEqual(tracksOf(none.data.tracks))
        expect(failed.data.ratings).not.toEqual(none.data.ratings)
    })

    it('nothing a source said when it failed is in the answer', async () => {
        const secret = () => new UpstreamError('upstream_failed', 'BestEverAlbums: secret detail')
        const { service } = serviceWith({ bestEver: secret, spotify: secret, ai: httpError(402, { error: { message: 'prepayment credits' } }) })
        const text = JSON.stringify(bodyOf(await generate(service)))

        expect(text).not.toContain('secret detail')
        expect(text).not.toContain('prepayment')
    })
})

describe('POST /api/generate: the time of the request (F52, slice 5)', () => {
    const never = () => new Promise(() => {})
    const shortBudget = { newBudget: () => createBudget({ ms: 5 }) }

    it('the whole request has less time than the app waits for it', () => {
        const client = readFileSync(require.resolve('../../public/js/api/client.js'), 'utf8')
        const appWaitsMs = Number(client.match(/serverTimeoutMs = (\d+)/)[1])

        expect(GenerationService.GENERATE_BUDGET_MS).toBeLessThan(appWaitsMs)
    })

    it('the provider does not answer the album in time: 504 upstream_timeout, the "timeout" row of the table', async () => {
        const { service } = serviceWith({ overrides: { ...shortBudget, callProvider: vi.fn(never) } })

        expect(await generate(service)).toMatchObject({ ok: false, status: 504, code: 'upstream_timeout', retryable: true })
    })

    it('a source of ratings is still running when the time ends: the album leaves (it was paid for), and the source is `failed`', async () => {
        // A budget whose time ends when the test says so: the album is answered in time, the source is not
        let time = 0
        const timers = new Set()
        const budget = createBudget({ ms: 1000, now: () => time, setTimer: (fn) => { timers.add(fn); return fn }, clearTimer: (fn) => timers.delete(fn) })
        const { service, fetch } = serviceWith({ bestEver: never, overrides: { newBudget: () => budget } })

        const answering = generate(service)
        await vi.waitFor(() => expect(fetch.asked).toEqual(['bestEver']))
        time = 1000
        timers.forEach(fire => fire())
        const result = await answering

        expect(result).toMatchObject({ ok: true, outcome: 'found', data: { title: 'Album' } })
        expect(result.data.ratings).toEqual({ acclaim: 'failed', popularity: 'failed', aiRanking: 'failed' })
        expect(fetch.asked).toEqual(['bestEver'])
    })

    it('the sources of ratings are asked within the same budget as the album', async () => {
        const budget = createBudget({ ms: 60000 })
        const { service, fetch } = serviceWith({ bestEver: null, overrides: { newBudget: () => budget } })
        await generate(service)

        expect(fetch.bestEver.mock.calls[0][2]).toMatchObject({ deadlineAt: budget.deadlineAt })
    })
})

describe('POST /api/generate: the prompts (F52, slice 5)', () => {
    const askRoute = async (service) => {
        const handlers = createAlbumHandlers({ enrichmentService: {}, generationService: service, env: { AI_API_KEY: 'k' }, logger: quiet })
        const res = fakeResponse()
        const req = { body: { albumQuery: QUERY }, method: 'POST', path: '/api/generate' }
        // The route as Express runs it: what the handler throws goes to the error responder
        await asyncRoute(handlers.generate)(req, res, (err) => errorResponder(quiet)(err, req, res, () => {}))
        return answerOf(res)
    }

    it('no prompt for the album search: the route answers `internal` (500, not asked again), and the provider is not paid', async () => {
        const { service, albumCalls } = serviceWith({ overrides: { loadPrompts: () => ({ rankingPrompt: 'rank' }) } })

        expect(await askRoute(service)).toEqual({ status: 500, headers: {}, body: { error: { code: 'internal', retryable: false } } })
        expect(albumCalls).not.toHaveBeenCalled()
    })

    it('no prompt for the ranking: the route answers `internal`, never an album "with no ratings"', async () => {
        const { service } = serviceWith({ prompts: { albumSearchPrompt: 'find {{albumQuery}}' } })

        expect(await askRoute(service)).toMatchObject({ status: 500, body: { error: { code: 'internal', retryable: false } } })
    })

    it('a prompts file that cannot be loaded: `internal` too', async () => {
        const { service } = serviceWith({ overrides: { loadPrompts: () => { throw new PromptsError('the file is missing') } } })

        expect(await askRoute(service)).toMatchObject({ status: 500, body: { error: { code: 'internal' } } })
    })
})

describe('POST /api/generate: one line of log per request (F52, slice 5)', () => {
    const ask = async (service) => {
        const logger = { info: vi.fn() }
        const clock = [1000, 1250]
        const handlers = createAlbumHandlers({ enrichmentService: {}, generationService: service, env: { AI_API_KEY: 'k' }, logger, now: () => clock.shift() })
        const res = fakeResponse()
        await handlers.generate({ body: { albumQuery: QUERY }, _startTime: 0 }, res)
        return { answer: answerOf(res), lines: logger.info.mock.calls }
    }

    it('the album answered: how long, `found`, and the outcome of each source of ratings', async () => {
        const { service } = serviceWith({ bestEver: beaPage({ One: 70, Two: null, Three: null, Four: null }), spotify: new UpstreamError('upstream_busy', 'busy') })
        const { answer, lines } = await ask(service)

        expect(lines).toEqual([['generate', { event: 'generate', answer: 'found', status: 200, ms: 250, ratings: { acclaim: 'found', popularity: 'failed', aiRanking: 'not_asked' } }]])
        expect(answer.body.data.ratings).toEqual({ acclaim: 'found', popularity: 'failed', aiRanking: 'not_asked' })
        expect(answer.body).toEqual({ data: expect.any(Object), outcome: 'found' }) // the trace does not go on the wire
    })

    it('the provider failed: the code of the failure, and no ratings', async () => {
        const { service } = serviceWith({ overrides: { callProvider: vi.fn(async () => { throw httpError(402) }) } })
        const { lines } = await ask(service)

        expect(lines).toEqual([['generate', { event: 'generate', answer: 'upstream_failed', status: 424, ms: 250, ratings: null }]])
    })

    it('nothing of the album or of the person is in the line', async () => {
        const { service } = serviceWith({ bestEver: beaPage({ One: 70, Two: 90, Three: 80, Four: 60 }) })
        const text = JSON.stringify((await ask(service)).lines)

        for (const word of ['Album', 'Artist', 'One', QUERY]) expect(text).not.toContain(word)
    })
})
