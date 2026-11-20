/**
 * F75 - the three routes of the value of the inventory, under the answer contract of F52:
 *   POST /api/album-value     the Discogs value of one album
 *   GET  /api/value-sources   the switch, as the app reads it
 *   GET  /api/exchange-rates  the rates of the day, from USD
 * No network and no Express: the handlers are called with doubles.
 */
import { describe, it, expect, vi } from 'vitest'
import { createRequire } from 'node:module'
import { fakeResponse, answerOf, httpError, timeoutError } from './helpers/fakes.js'

const require = createRequire(import.meta.url)
const { createValueService, VALUE_BUDGET_MS } = require('../../server/lib/services/valueService.js')
const { createExchangeRates, RATES_URL } = require('../../server/lib/services/exchangeRates.js')
const { createValueHandlers } = require('../../server/routes/handlers/values.js')
const { UpstreamError, OUTCOMES, ERROR_CODES } = require('../../server/lib/outcome.js')
const { buildGuards } = require('../../server/lib/auth/guards.js')

const ON = { DISCOGS_TOKEN: 'test-token' }
const FOUND = {
    outcome: 'found',
    release: { id: 5012948, title: 'Harvest 1984, Europe', url: 'https://www.discogs.com/release/5012948' },
    conditions: { mint: 14.5, nearMint: 11.2, veryGoodPlus: 7.9 },
    currency: 'USD',
    readAt: '2026-11-20T12:00:00.000Z'
}
const quiet = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
const sourceThat = (answer) => ({ name: 'Discogs', ask: vi.fn(async () => { if (answer instanceof Error) throw answer; return answer }) })
const serviceWith = (source, env = ON) => createValueService({ source, env, logger: quiet })
const BODY = { artist: 'Pink Floyd', title: 'The Dark Side of the Moon' }
const USER = { uid: 'owner-uid', anonymous: false }

describe('the answer contract knows the value answers', () => {
    it('two more outcomes and one more error code', () => {
        expect(Object.values(OUTCOMES)).toEqual(expect.arrayContaining(['no_value', 'not_configured']))
        expect(ERROR_CODES).toContain('upstream_unauthorized')
    })
})

describe('the value of one album', () => {
    it('found: the data is what the source read, and nothing else', async () => {
        const result = await serviceWith(sourceThat(FOUND)).albumValue(BODY, USER)
        const { outcome, ...data } = FOUND
        expect(result).toMatchObject({ ok: true, outcome, data })
    })

    it('the source is asked with the artist, the title, the year and the edition, within the time of the request', async () => {
        const source = sourceThat(FOUND)
        await serviceWith(source).albumValue({ ...BODY, year: 1973, releaseId: 5012948, extra: 'ignored' }, USER)
        const [album, options] = source.ask.mock.calls[0]
        expect(album).toEqual({ artist: 'Pink Floyd', title: 'The Dark Side of the Moon', year: 1973, releaseId: 5012948 })
        expect(options.deadlineAt - Date.now()).toBeLessThanOrEqual(VALUE_BUDGET_MS)
    })

    it('not_found and no_value are answers, with the edition when there is one', async () => {
        expect(await serviceWith(sourceThat({ outcome: 'not_found' })).albumValue(BODY, USER)).toMatchObject({ ok: true, outcome: 'not_found', data: null })
        const noValue = await serviceWith(sourceThat({ outcome: 'no_value', release: FOUND.release })).albumValue(BODY, USER)
        expect(noValue).toMatchObject({ ok: true, outcome: 'no_value', data: { release: FOUND.release } })
    })

    it('the switch off: not_configured, and Discogs is not asked', async () => {
        for (const env of [{}, { DISCOGS_TOKEN: 't', DISCOGS_VALUES: 'off' }, { DISCOGS_TOKEN: 't', DISCOGS_VALUES_FOR: 'another-person' }]) {
            const source = sourceThat(FOUND)
            expect(await serviceWith(source, env).albumValue(BODY, USER)).toMatchObject({ ok: true, outcome: 'not_configured', data: null })
            expect(source.ask).not.toHaveBeenCalled()
        }
    })

    it('a request with no artist or title, or an edition that is not a number, is refused before anything is asked', async () => {
        const source = sourceThat(FOUND)
        const service = serviceWith(source)
        for (const body of [null, {}, { artist: 'A' }, { title: 'T' }, { ...BODY, releaseId: 'abc' }, { ...BODY, releaseId: -3 }, { ...BODY, releaseId: 1.5 }, { artist: 'x'.repeat(301), title: 'T' }]) {
            expect(await service.albumValue(body, USER)).toMatchObject({ ok: false, code: 'invalid_request', status: 400 })
        }
        expect(source.ask).not.toHaveBeenCalled()
    })

    const failures = [
        ['upstream_unauthorized', 502, false],
        ['upstream_failed', 502, true],
        ['upstream_timeout', 504, true],
        ['upstream_busy', 503, true]
    ]
    failures.forEach(([code, status, retryable]) => {
        it(`${code} of the source leaves as ${status}, retryable ${retryable}`, async () => {
            const result = await serviceWith(sourceThat(new UpstreamError(code, 'Discogs: it failed'))).albumValue(BODY, USER)
            expect(result).toMatchObject({ ok: false, code, status, retryable })
        })
    })

    it('"wait" goes with how long, in Retry-After', async () => {
        const handlers = createValueHandlers({
            valueService: serviceWith(sourceThat(new UpstreamError('upstream_busy', 'Discogs: asked to wait', { retryAfterMs: 40000 }))),
            exchangeRates: { today: vi.fn() },
            logger: quiet
        })
        const res = fakeResponse()
        await handlers.albumValue({ body: BODY, user: USER }, res)
        expect(answerOf(res)).toMatchObject({ status: 503, body: { error: { code: 'upstream_busy', retryable: true } }, headers: { 'Retry-After': '40' } })
    })

    it('something of ours that broke is thrown on: the error path of the routes answers `internal`', async () => {
        await expect(serviceWith(sourceThat(new TypeError('a bug'))).albumValue(BODY, USER)).rejects.toThrow('a bug')
    })

    it('the log line of a request says the answer and the time, and nothing of the person or of the album', async () => {
        const logger = { info: vi.fn() }
        const handlers = createValueHandlers({ valueService: serviceWith(sourceThat(FOUND)), exchangeRates: { today: vi.fn() }, logger })
        await handlers.albumValue({ body: BODY, user: USER }, fakeResponse())
        const [, line] = logger.info.mock.calls[0]
        expect(line).toMatchObject({ event: 'album_value', answer: 'found' })
        expect(JSON.stringify(line)).not.toMatch(/Pink Floyd|owner-uid|test-token/)
    })
})

describe('the switch as the app reads it', () => {
    const answerFor = async (env, user = USER) => {
        const handlers = createValueHandlers({ valueService: serviceWith(sourceThat(FOUND), env), exchangeRates: { today: vi.fn() }, logger: quiet })
        const res = fakeResponse()
        await handlers.valueSources({ user }, res)
        return answerOf(res)
    }

    it('on with the token; off without it, or with DISCOGS_VALUES=off; read on every request', async () => {
        expect(await answerFor(ON)).toMatchObject({ status: 200, body: { data: { discogs: 'on' }, outcome: 'found' } })
        expect((await answerFor({})).body.data).toEqual({ discogs: 'off' })
        const env = { DISCOGS_TOKEN: 't' }
        const service = serviceWith(sourceThat(FOUND), env)
        expect(service.valueSources(USER).data).toEqual({ discogs: 'on' })
        env.DISCOGS_VALUES = 'off'
        expect(service.valueSources(USER).data).toEqual({ discogs: 'off' })
    })

    it('with DISCOGS_VALUES_FOR it is on only for who is named', async () => {
        const env = { DISCOGS_TOKEN: 't', DISCOGS_VALUES_FOR: 'owner-uid' }
        expect((await answerFor(env)).body.data).toEqual({ discogs: 'on' })
        expect((await answerFor(env, { uid: 'a-guest', anonymous: true })).body.data).toEqual({ discogs: 'off' })
    })

    it('the answer never carries the token', async () => {
        expect(JSON.stringify(await answerFor(ON))).not.toContain('test-token')
    })
})

describe('the exchange rates of the day', () => {
    const DAY = Date.parse('2026-11-20T10:00:00Z')
    const frankfurter = { amount: 1.0, base: 'USD', date: '2026-11-19', rates: { BRL: 5.89, EUR: 0.91, GBP: 0.76 } }
    const httpThat = (answer) => ({ get: vi.fn(async () => { if (answer instanceof Error) throw answer; return { status: 200, data: answer } }) })

    it('found: the three rates from USD, with the date the source gives; the source is asked for exactly those', async () => {
        const http = httpThat(frankfurter)
        const result = await createExchangeRates({ http, now: () => DAY }).today()
        expect(result).toMatchObject({ ok: true, outcome: 'found', data: { base: 'USD', date: '2026-11-19', rates: { USD: 1, BRL: 5.89, EUR: 0.91, GBP: 0.76 } } })
        expect(http.get.mock.calls[0][0]).toBe(RATES_URL)
        expect(RATES_URL).toBe('https://api.frankfurter.app/latest?from=USD&to=BRL,EUR,GBP')
    })

    it('kept in memory for the day: asked once a day, and again the next day', async () => {
        let clock = DAY
        const http = httpThat(frankfurter)
        const rates = createExchangeRates({ http, now: () => clock })
        await rates.today()
        clock += 3 * 60 * 60 * 1000
        await rates.today()
        expect(http.get).toHaveBeenCalledTimes(1)
        clock += 24 * 60 * 60 * 1000
        await rates.today()
        expect(http.get).toHaveBeenCalledTimes(2)
    })

    it('the source failed: a typed failure, and nothing is kept (the next request asks again)', async () => {
        const http = httpThat(httpError(500))
        const rates = createExchangeRates({ http, now: () => DAY, logger: quiet })
        expect(await rates.today()).toMatchObject({ ok: false, code: 'upstream_failed' })
        expect(await createExchangeRates({ http: httpThat(timeoutError()), now: () => DAY, logger: quiet }).today()).toMatchObject({ ok: false, code: 'upstream_timeout' })
        await rates.today()
        expect(http.get).toHaveBeenCalledTimes(2)
    })

    it('an answer with a rate missing or that is no number is a failure, not a rate of zero', async () => {
        for (const bad of [{}, { rates: { BRL: 5.89, EUR: 0.91 } }, { rates: { BRL: '5,89', EUR: 0.91, GBP: 0.76 } }, { rates: { BRL: 0, EUR: 0.91, GBP: 0.76 } }, 'a page']) {
            expect(await createExchangeRates({ http: httpThat(bad), now: () => DAY, logger: quiet }).today()).toMatchObject({ ok: false, code: 'upstream_failed' })
        }
    })

    it('the route answers what the service says', async () => {
        const handlers = createValueHandlers({ valueService: serviceWith(sourceThat(FOUND)), exchangeRates: createExchangeRates({ http: httpThat(frankfurter), now: () => DAY }), logger: quiet })
        const res = fakeResponse()
        await handlers.exchangeRates({}, res)
        expect(answerOf(res)).toMatchObject({ status: 200, body: { outcome: 'found', data: { rates: { BRL: 5.89 } } } })
    })
})

describe('who may ask for a value', () => {
    it('the values have a door of their own: an account (no guest), with its own limit per person', () => {
        const guards = buildGuards({}, { fetchKeys: vi.fn(), logger: quiet })
        expect(guards.value).toHaveLength(2)
        expect(guards.value[1]).not.toBe(guards.paid[1])
    })

    it('with the door off (local experiments) the values are open like the rest', () => {
        const guards = buildGuards({ REQUIRE_SIGN_IN: 'false' }, { logger: quiet })
        expect(guards.value).toHaveLength(1)
    })
})
