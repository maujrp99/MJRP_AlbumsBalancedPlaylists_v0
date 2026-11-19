/**
 * F52, slice 1 - the routes that call the paid AI provider (POST /api/generate and
 * POST /api/ai/studio-albums). One closed table says what leaves the server for each answer of
 * the provider. An old browser tab asks again after every 5xx, and each ask costs money: what
 * will not pass by asking again (billing, quota, a refused request, an unusable answer) leaves
 * with a status the old tab does not repeat and `retryable: false`. The provider's own message
 * never leaves.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRequire } from 'node:module'
import { fakeResponse, answerOf, httpError, timeoutError, networkError } from './helpers/fakes.js'

const require = createRequire(import.meta.url)
const { AI_PROVIDER_TABLE, providerCaseOf, failureFromProviderError } = require('../../server/lib/aiProviderOutcome.js')
const GenerationService = require('../../server/lib/services/GenerationService.js')
const { createAlbumHandlers } = require('../../server/routes/handlers/albums.js')
const { createAiHandlers } = require('../../server/routes/handlers/ai.js')

const SECRET_URL = 'https://generativelanguage.googleapis.com/v1beta/models/x:generateContent?key=AIzaSECRET'
const PROVIDER_TEXT = 'Your prepayment credits are depleted. Go to AI Studio.'
/** The provider's failure as axios hands it over: its own message, and the address with the key. */
const providerError = (status) => Object.assign(httpError(status, { error: { code: status, message: PROVIDER_TEXT } }), {
    config: { url: SECRET_URL }
})
const withSecrets = (error) => Object.assign(error, { config: { url: SECRET_URL } })
const quiet = { log: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }

// GenerationService writes to the console (the provider's words go to the log, on purpose)
beforeEach(() => {
    ['log', 'warn', 'error'].forEach(method => vi.spyOn(console, method).mockImplementation(() => {}))
})
afterEach(() => vi.restoreAllMocks())

/** provider answer -> what leaves. THE table of the design, row by row. */
const ROWS = [
    // case        the provider did                  status  code                retryable
    ['timeout', () => withSecrets(timeoutError()), 504, 'upstream_timeout', true],
    ['no_answer', () => withSecrets(networkError()), 502, 'upstream_failed', true],
    ['5xx', () => providerError(500), 502, 'upstream_failed', true],
    ['5xx', () => providerError(503), 502, 'upstream_failed', true],
    ['402', () => providerError(402), 424, 'upstream_failed', false],
    ['429', () => providerError(429), 424, 'upstream_busy', false],
    ['4xx', () => providerError(400), 424, 'upstream_failed', false],
    ['4xx', () => providerError(401), 424, 'upstream_failed', false],
    ['4xx', () => providerError(403), 424, 'upstream_failed', false],
    ['4xx', () => providerError(404), 424, 'upstream_failed', false]
]
/** What an old tab does (public/js/api/client.js before F52): it asks again after any 5xx. */
const oldTabAsksAgain = (status) => status >= 500

describe('the table of the AI provider', () => {
    it('is data, in one place, and closed: these cases and no other', () => {
        expect(AI_PROVIDER_TABLE.map(row => row.provider)).toEqual(['timeout', 'no_answer', '5xx', '402', '429', '4xx', 'unusable'])
        expect(Object.isFrozen(AI_PROVIDER_TABLE)).toBe(true)
    })

    ROWS.forEach(([name, makeError, status, code, retryable]) => {
        const error = makeError()
        const label = error.response ? `HTTP ${error.response.status}` : error.code
        it(`${label} is the case "${name}": leaves as ${status} ${code}, retryable ${retryable}`, () => {
            expect(providerCaseOf(error)).toBe(name)
            expect(failureFromProviderError(error)).toMatchObject({ ok: false, status, code, retryable })
        })
    })

    it('only a failure that may pass leaves as 5xx; every other row leaves with a status an old tab does not repeat', () => {
        AI_PROVIDER_TABLE.forEach(row => {
            expect(oldTabAsksAgain(row.status)).toBe(row.retryable)
        })
    })

    it('no row leaves as 401 or 429: those are this server\'s own door and limit, and they pause the app\'s queue', () => {
        expect(AI_PROVIDER_TABLE.filter(row => row.status === 401 || row.status === 429)).toEqual([])
    })

    it('an error that is not of the provider (a bug of ours) is not in the table', () => {
        expect(providerCaseOf(new TypeError('x is not a function'))).toBeNull()
        expect(failureFromProviderError(new TypeError('x is not a function'))).toBeNull()
    })
})

const album = () => ({ title: 'Album', artist: 'Artist', tracks: [{ title: 'One' }] })
const serviceWith = (overrides = {}) => new GenerationService({
    loadPrompts: () => ({ albumSearchPrompt: 'find {{albumQuery}}' }),
    renderPrompt: (template) => template,
    callProvider: vi.fn(async () => ({ status: 200, data: { candidates: [] } })),
    extractAlbum: vi.fn(() => album()),
    validateAlbum: null,
    ajvAvailable: false,
    getBestEverRanking: vi.fn(async () => null),
    fetchRankingForAlbum: vi.fn(async () => ({ entries: [], sources: [], debugTrace: [] })),
    consolidateRanking: vi.fn(async () => ({ results: [], divergence: {} })),
    normalizeRankingKey: async () => (text) => String(text || '').toLowerCase(),
    logger: quiet,
    ...overrides
})
const config = { processEnv: { AI_API_KEY: 'k' }, startTime: 0, allowRawStage: false }

describe('GenerationService: a typed result for every answer of the provider', () => {
    it('the provider answered with an album: found', async () => {
        const result = await serviceWith().generateAlbum({ albumQuery: 'Artist - Album' }, config)
        expect(result).toMatchObject({ ok: true, status: 200, outcome: 'found' })
        expect(result.data).toMatchObject({ title: 'Album', artist: 'Artist' })
    })

    ROWS.forEach(([name, makeError, status, code, retryable]) => {
        const error = makeError()
        const label = error.response ? `HTTP ${error.response.status}` : error.code
        it(`the provider fails with ${label}: ${status} ${code}, retryable ${retryable}`, async () => {
            const service = serviceWith({ callProvider: vi.fn(async () => { throw error }) })
            expect(await service.generateAlbum({ albumQuery: 'Artist - Album' }, config)).toMatchObject({ ok: false, status, code, retryable })
        })
    })

    it('an answer with no album in it is the case "unusable": 424, not asked again, and the raw answer does not leave', async () => {
        const service = serviceWith({ extractAlbum: vi.fn(() => null) })
        const result = await service.generateAlbum({ albumQuery: 'Artist - Album' }, config)
        expect(result).toMatchObject({ ok: false, status: 424, code: 'upstream_failed', retryable: false })
    })

    it('an album that fails the schema, and an answer that breaks while being read, are "unusable" too', async () => {
        const validateAlbum = Object.assign(() => false, { errors: [{ message: 'tracks required' }] })
        const invalid = await serviceWith({ ajvAvailable: true, validateAlbum }).generateAlbum({ albumQuery: 'A - B' }, config)
        expect(invalid).toMatchObject({ ok: false, status: 424, retryable: false })
        expect(JSON.stringify(invalid)).not.toContain('tracks required')

        const breaks = await serviceWith({ extractAlbum: vi.fn(() => { throw new Error('unexpected shape') }) })
            .generateAlbum({ albumQuery: 'A - B' }, config)
        expect(breaks).toMatchObject({ ok: false, status: 424, retryable: false })
    })

    it('a request with no album to look for is invalid_request, and the provider is not called', async () => {
        const callProvider = vi.fn()
        for (const body of [{}, { albumQuery: '' }, { albumQuery: '   ' }, { albumQuery: 42 }]) {
            expect(await serviceWith({ callProvider }).generateAlbum(body, config)).toMatchObject({ ok: false, status: 400, code: 'invalid_request' })
        }
        expect(callProvider).not.toHaveBeenCalled()
    })

    it('the ratings source failing does not fail the album: the album leaves without them', async () => {
        const { UpstreamError } = require('../../server/lib/outcome.js')
        const service = serviceWith({ getBestEverRanking: vi.fn(async () => { throw new UpstreamError('upstream_timeout', 'slow') }) })
        expect(await service.generateAlbum({ albumQuery: 'Artist - Album' }, config)).toMatchObject({ ok: true, outcome: 'found' })
    })
})

describe('POST /api/generate', () => {
    const handlersWith = (generationService, env = { AI_API_KEY: 'k' }) =>
        createAlbumHandlers({ enrichmentService: {}, generationService, env })
    const ask = async (handlers, body = { albumQuery: 'Artist - Album' }) => {
        const res = fakeResponse()
        await handlers.generate({ body, _startTime: 0 }, res)
        return answerOf(res)
    }

    it('answers 200 { data, outcome: "found" }', async () => {
        expect(await ask(handlersWith(serviceWith()))).toMatchObject({ status: 200, body: { data: { title: 'Album' }, outcome: 'found' } })
    })

    ROWS.forEach(([, makeError, status, code, retryable]) => {
        const error = makeError()
        const label = error.response ? `HTTP ${error.response.status}` : error.code
        it(`provider ${label}: the body is only the one error format, with nothing of the provider in it`, async () => {
            const answer = await ask(handlersWith(serviceWith({ callProvider: vi.fn(async () => { throw error }) })))
            expect(answer).toEqual({ status, headers: {}, body: { error: { code, retryable } } })
            const text = JSON.stringify(answer)
            expect(text).not.toContain('AIzaSECRET')
            expect(text).not.toContain('prepayment')
        })
    })

    it('without the AI key it keeps answering 503, in the one format, and does not call the provider', async () => {
        const callProvider = vi.fn()
        const answer = await ask(handlersWith(serviceWith({ callProvider }), {}))
        expect(answer).toMatchObject({ status: 503, body: { error: { code: 'internal', retryable: false } } })
        expect(callProvider).not.toHaveBeenCalled()
    })
})

describe('POST /api/ai/studio-albums', () => {
    const textAnswer = (text) => ({ status: 200, data: { candidates: [{ content: { parts: [{ text }] } }] } })
    const ask = async (callProvider, body = { artistName: 'Artist' }, env = { AI_API_KEY: 'k' }) => {
        const res = fakeResponse()
        await createAiHandlers({ callProvider, env, logger: quiet }).studioAlbums({ body }, res)
        return answerOf(res)
    }

    it('the list the AI gave: found', async () => {
        const answer = await ask(vi.fn(async () => textAnswer('```json\n["One", "Two"]\n```')))
        expect(answer).toMatchObject({ status: 200, body: { data: { albums: ['One', 'Two'] }, outcome: 'found' } })
    })

    it('the AI answered with an empty list: not_found (it answered; the artist has none)', async () => {
        expect(await ask(vi.fn(async () => textAnswer('[]')))).toMatchObject({ status: 200, body: { data: { albums: [] }, outcome: 'not_found' } })
    })

    it('a list in broken JSON is still read, title by title', async () => {
        const answer = await ask(vi.fn(async () => textAnswer('["One",\n "Two"')))
        expect(answer.body).toMatchObject({ data: { albums: ['One', 'Two'] }, outcome: 'found' })
    })

    ROWS.forEach(([, makeError, status, code, retryable]) => {
        const error = makeError()
        const label = error.response ? `HTTP ${error.response.status}` : error.code
        it(`provider ${label}: never 200 with an empty list, never the provider's message`, async () => {
            const answer = await ask(vi.fn(async () => { throw error }))
            expect(answer).toEqual({ status, headers: {}, body: { error: { code, retryable } } })
            expect(JSON.stringify(answer)).not.toContain('AIzaSECRET')
        })
    })

    it('an answer with no text, or with text that is not a list, is "unusable", not an empty list', async () => {
        for (const response of [{ status: 200, data: {} }, textAnswer('I cannot help with that.'), textAnswer('{"albums": 3}')]) {
            expect(await ask(vi.fn(async () => response))).toMatchObject({ status: 424, body: { error: { code: 'upstream_failed', retryable: false } } })
        }
    })

    it('no artist is invalid_request; no AI key is 503; neither calls the provider', async () => {
        const callProvider = vi.fn()
        expect(await ask(callProvider, {})).toMatchObject({ status: 400, body: { error: { code: 'invalid_request' } } })
        expect(await ask(callProvider, { artistName: 'Artist' }, {})).toMatchObject({ status: 503, body: { error: { code: 'internal' } } })
        expect(callProvider).not.toHaveBeenCalled()
    })

    it('something of ours that breaks is thrown to the error path, not answered as an empty list', async () => {
        await expect(ask(vi.fn(async () => { throw new TypeError('bug') }))).rejects.toThrow('bug')
    })
})
