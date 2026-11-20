/**
 * F75 - the value source of the server: the price suggestion of the most common CD edition of an
 * album, from the Discogs API. No network here: the HTTP client is injected and answers from
 * fixtures. The search and the versions fixtures are reduced from real answers; the price
 * suggestion is written by hand from the documented shape (the live call needs the owner's token).
 */
import { describe, it, expect, vi } from 'vitest'
import { createRequire } from 'node:module'
import { httpError, timeoutError } from './helpers/fakes.js'
import searchMaster from '../fixtures/discogs/search-master.json'
import masterVersions from '../fixtures/discogs/master-versions.json'
import searchRelease from '../fixtures/discogs/search-release.json'
import priceSuggestions from '../fixtures/discogs/price-suggestions.json'

const require = createRequire(import.meta.url)
const { createDiscogsSource, DISCOGS_PACE, busyOfDiscogs } = require('../../server/lib/valueSources/discogsSource.js')
const { suggestionsOf, candidatesOf, readingsOfLabel, mostCollectedCd, releaseUrl } = require('../../server/lib/valueSources/discogsParse.js')
const { discogsSwitch } = require('../../server/lib/valueSources/valueSwitch.js')
const { createPoliteQueue, noPace } = require('../../server/lib/politeQueue.js')
const { UpstreamError } = require('../../server/lib/outcome.js')

const ENV = { DISCOGS_TOKEN: 'test-token' }
const NOW = Date.parse('2026-11-20T12:00:00Z')
const DARK_SIDE = { artist: 'Pink Floyd', title: 'The Dark Side of the Moon' }

/** An HTTP double: each route is [text in the address, (config) => body | Error]; it keeps every call. */
function httpWith(routes) {
    const calls = []
    const get = vi.fn(async (url, config = {}) => {
        calls.push({ url, config })
        const route = routes.find(([part, , when]) => url.includes(part) && (!when || when(config)))
        if (!route) throw new Error(`no route for ${url}`)
        const answer = typeof route[1] === 'function' ? route[1](config) : route[1]
        if (answer instanceof Error) throw answer
        return { status: 200, data: answer, headers: route[3] || {} }
    })
    return { get, calls }
}
const isMaster = (config) => config.params.type === 'master'
const isRelease = (config) => config.params.type === 'release'
const happyRoutes = () => [
    ['/database/search', searchMaster, isMaster],
    ['/masters/10362/versions', masterVersions],
    ['/marketplace/price_suggestions/5012948', priceSuggestions]
]
const sourceWith = (http, options = {}) => createDiscogsSource({ http, pace: noPace, env: ENV, now: () => NOW, logger: { warn: vi.fn() }, ...options })
const ask = (source, album = DARK_SIDE) => source.ask(album, { deadlineAt: NOW + 20000 })

describe('the switch of the Discogs values (REQ-10)', () => {
    it('is on only with a token and without DISCOGS_VALUES=off', () => {
        expect(discogsSwitch({ DISCOGS_TOKEN: 't' })).toBe('on')
        expect(discogsSwitch({})).toBe('off')
        expect(discogsSwitch({ DISCOGS_TOKEN: '  ' })).toBe('off')
        expect(discogsSwitch({ DISCOGS_TOKEN: 't', DISCOGS_VALUES: 'off' })).toBe('off')
        expect(discogsSwitch({ DISCOGS_TOKEN: 't', DISCOGS_VALUES: 'OFF ' })).toBe('off')
        expect(discogsSwitch({ DISCOGS_TOKEN: 't', DISCOGS_VALUES: 'on' })).toBe('on')
    })

    it('with DISCOGS_VALUES_FOR it is on only for the people named there (the price is for personal use)', () => {
        const env = { DISCOGS_TOKEN: 't', DISCOGS_VALUES_FOR: 'owner-uid, other-uid' }
        expect(discogsSwitch(env, { uid: 'owner-uid' })).toBe('on')
        expect(discogsSwitch(env, { uid: 'somebody' })).toBe('off')
        expect(discogsSwitch(env, null)).toBe('off')
    })

    it('a guest never has it on: the price is read with the token of an account, for a person with an account', () => {
        expect(discogsSwitch({ DISCOGS_TOKEN: 't' }, { uid: 'guest', anonymous: true })).toBe('off')
        expect(discogsSwitch({ DISCOGS_TOKEN: 't' }, { uid: 'someone', anonymous: false })).toBe('on')
    })

    it('the source that is off asks nothing and says not_configured', async () => {
        const http = httpWith(happyRoutes())
        const source = sourceWith(http, { env: { DISCOGS_TOKEN: 't', DISCOGS_VALUES: 'off' } })
        expect(await ask(source)).toEqual({ outcome: 'not_configured' })
        expect(http.get).not.toHaveBeenCalled()
    })
})

describe('reading the answers of Discogs', () => {
    it('the three conditions and the currency, from the documented shape', () => {
        expect(suggestionsOf(priceSuggestions)).toEqual({ conditions: { mint: 14.5, nearMint: 11.2, veryGoodPlus: 7.9 }, currency: 'USD' })
    })

    it('the currency is given back as it came (it is the one of the Discogs account)', () => {
        const inEuro = Object.fromEntries(Object.entries(priceSuggestions).filter(([name]) => name !== '_note').map(([name, one]) => [name, { ...one, currency: 'EUR' }]))
        expect(suggestionsOf(inEuro).currency).toBe('EUR')
    })

    it('nothing usable is no suggestion: an empty answer, a missing condition, a value that is no number, two currencies', () => {
        const without = (name) => Object.fromEntries(Object.entries(priceSuggestions).filter(([key]) => key !== name))
        expect(suggestionsOf({})).toBeNull()
        expect(suggestionsOf(null)).toBeNull()
        expect(suggestionsOf('text')).toBeNull()
        expect(suggestionsOf(without('Mint (M)'))).toBeNull()
        expect(suggestionsOf({ ...priceSuggestions, 'Mint (M)': { currency: 'USD', value: 'a lot' } })).toBeNull()
        expect(suggestionsOf({ ...priceSuggestions, 'Mint (M)': { currency: 'USD', value: 0 } })).toBeNull()
        expect(suggestionsOf({ ...priceSuggestions, 'Mint (M)': { currency: 'EUR', value: 3 } })).toBeNull()
    })

    it('"Very Good (VG)" is never read as "Very Good Plus (VG+)", nor "Mint" as "Near Mint"', () => {
        const body = { 'Mint (M)': { currency: 'USD', value: 9 }, 'Near Mint (NM or M-)': { currency: 'USD', value: 8 }, 'Very Good (VG)': { currency: 'USD', value: 1 } }
        expect(suggestionsOf(body)).toBeNull()
    })

    it('the masters of a real search, the most collected first, each read as artist and title', () => {
        const masters = candidatesOf(searchMaster, 'master')
        expect(masters[0]).toMatchObject({ id: 10362, label: 'Pink Floyd - The Dark Side Of The Moon' })
        expect(masters.every(one => Number.isInteger(one.id))).toBe(true)
        expect(readingsOfLabel('Pink Floyd - The Dark Side Of The Moon')).toEqual([{ artist: 'Pink Floyd', title: 'The Dark Side Of The Moon' }])
    })

    it('a label with more than one dash is read at each of them; the number Discogs puts after a name is dropped', () => {
        expect(readingsOfLabel('Nirvana (2) - Nevermind')).toEqual([{ artist: 'Nirvana', title: 'Nevermind' }])
        expect(readingsOfLabel('A - B - C')).toEqual([{ artist: 'A', title: 'B - C' }, { artist: 'A - B', title: 'C' }])
        expect(readingsOfLabel('No dash here')).toEqual([])
    })

    it('the CD version most people have, from a real list of versions', () => {
        expect(mostCollectedCd(masterVersions)).toEqual({ id: 5012948, title: 'Harvest 1984, Europe' })
        expect(mostCollectedCd({ versions: [] })).toBeNull()
        expect(mostCollectedCd({})).toBeNull()
    })

    it('a release search lists only what is a CD', () => {
        const releases = candidatesOf(searchRelease, 'release')
        expect(releases[0]).toMatchObject({ id: 18418450, label: 'Joni Mitchell - Hejira' })
        const vinyl = { results: [{ type: 'release', id: 1, title: 'A - B', format: ['Vinyl', 'LP'], community: { have: 5 } }] }
        expect(candidatesOf(vinyl, 'release')).toEqual([])
    })

    it('the page of a release', () => {
        expect(releaseUrl(5012948)).toBe('https://www.discogs.com/release/5012948')
    })
})

describe('the value of an album (REQ-04)', () => {
    it('found: the most common CD edition of the master the identity rule accepts, its three conditions, the currency, when', async () => {
        const http = httpWith(happyRoutes())
        expect(await ask(sourceWith(http))).toEqual({
            outcome: 'found',
            release: { id: 5012948, title: 'Harvest 1984, Europe', url: 'https://www.discogs.com/release/5012948' },
            conditions: { mint: 14.5, nearMint: 11.2, veryGoodPlus: 7.9 },
            currency: 'USD',
            readAt: '2026-11-20T12:00:00.000Z'
        })
        expect(http.calls.map(call => call.url)).toEqual([
            'https://api.discogs.com/database/search',
            'https://api.discogs.com/masters/10362/versions',
            'https://api.discogs.com/marketplace/price_suggestions/5012948'
        ])
        expect(http.calls[0].config.params).toMatchObject({ type: 'master', artist: 'Pink Floyd', release_title: 'The Dark Side of the Moon' })
        expect(http.calls[1].config.params).toMatchObject({ format: 'CD', per_page: 100 })
    })

    it('every request carries the token and a User-Agent that names the app', async () => {
        const http = httpWith(happyRoutes())
        await ask(sourceWith(http))
        http.calls.forEach(({ config }) => {
            expect(config.headers.Authorization).toBe('Discogs token=test-token')
            expect(config.headers['User-Agent']).toMatch(/^AlbumBlender\/\S+ \+https:\/\//)
            expect(config.timeout).toBeGreaterThan(0)
        })
    })

    it('with the edition already known it asks only the price', async () => {
        const http = httpWith(happyRoutes())
        const answer = await ask(sourceWith(http), { ...DARK_SIDE, releaseId: 5012948 })
        expect(answer).toMatchObject({ outcome: 'found', release: { id: 5012948, title: null, url: 'https://www.discogs.com/release/5012948' } })
        expect(http.calls).toHaveLength(1)
    })

    it('a master that is another album is not accepted: not_found, and no price is asked', async () => {
        const http = httpWith([['/database/search', searchMaster, isMaster], ['/database/search', { results: [] }, isRelease]])
        expect(await ask(sourceWith(http), { artist: 'Pink Floyd', title: 'Animals' })).toEqual({ outcome: 'not_found' })
        expect(http.calls.map(call => call.config.params.type)).toEqual(['master', 'release'])
    })

    it('with no master it looks for a CD release, and takes the most collected one the rule accepts', async () => {
        const http = httpWith([
            ['/database/search', { results: [] }, isMaster],
            ['/database/search', searchRelease, isRelease],
            ['/marketplace/price_suggestions/18418450', priceSuggestions]
        ])
        const answer = await ask(sourceWith(http), { artist: 'Joni Mitchell', title: 'Hejira' })
        expect(answer).toMatchObject({ outcome: 'found', release: { id: 18418450, title: 'Asylum Records, US' } })
        expect(http.calls[1].config.params).toMatchObject({ type: 'release', format: 'CD' })
    })

    it('a master with no CD version falls back to the release search too', async () => {
        const http = httpWith([
            ['/database/search', searchMaster, isMaster],
            ['/masters/10362/versions', { versions: [] }],
            ['/database/search', { results: [] }, isRelease]
        ])
        expect(await ask(sourceWith(http))).toEqual({ outcome: 'not_found' })
    })

    it('no_value: the edition exists and Discogs suggests no price for it; the edition is said', async () => {
        const http = httpWith([...happyRoutes().slice(0, 2), ['/marketplace/price_suggestions/5012948', {}]])
        expect(await ask(sourceWith(http))).toEqual({
            outcome: 'no_value',
            release: { id: 5012948, title: 'Harvest 1984, Europe', url: 'https://www.discogs.com/release/5012948' }
        })
    })

    it('an edition Discogs no longer has (404) is not_found', async () => {
        const http = httpWith([['/marketplace/price_suggestions/77', httpError(404)]])
        expect(await ask(sourceWith(http), { ...DARK_SIDE, releaseId: 77 })).toEqual({ outcome: 'not_found' })
    })
})

describe('every failure of Discogs has its name (REQ-13)', () => {
    const failing = (error) => httpWith([['/database/search', error]])
    const codeOf = async (http, options) => {
        const error = await ask(sourceWith(http, options)).catch(caught => caught)
        expect(error).toBeInstanceOf(UpstreamError)
        return error
    }

    it('the token was refused (401, 403): upstream_unauthorized', async () => {
        expect((await codeOf(failing(httpError(401)))).code).toBe('upstream_unauthorized')
        expect((await codeOf(failing(httpError(403)))).code).toBe('upstream_unauthorized')
    })

    it('Discogs broke (500) or did not answer: upstream_failed; too slow: upstream_timeout', async () => {
        expect((await codeOf(failing(httpError(500)))).code).toBe('upstream_failed')
        expect((await codeOf(failing(timeoutError()))).code).toBe('upstream_timeout')
    })

    it('no message carries the token', async () => {
        const error = await codeOf(failing(httpError(401)))
        expect(error.message).not.toContain('test-token')
    })

    it('the limit was reached (429): upstream_busy with the wait, and Discogs is asked once, not again and again', async () => {
        let clock = NOW
        const pace = createPoliteQueue({ ...DISCOGS_PACE, busyOf: busyOfDiscogs(() => clock), now: () => clock, sleep: async (ms) => { clock += ms } })
        const http = failing(Object.assign(httpError(429), { response: { status: 429, headers: { 'retry-after': '40' } } }))
        const error = await codeOf(http, { pace, now: () => clock })
        expect(error.code).toBe('upstream_busy')
        expect(error.retryAfterMs).toBe(40000)
        expect(http.get).toHaveBeenCalledTimes(1)
    })

    it('one request at a time, and at most 60 a minute', () => {
        expect(DISCOGS_PACE.concurrency).toBe(1)
        expect(DISCOGS_PACE.minIntervalMs).toBeGreaterThanOrEqual(1000)
    })

    it('when the headers say the minute is spent, the queue is told to wait before the next request', async () => {
        const pause = vi.fn()
        const spent = { 'x-discogs-ratelimit': '60', 'x-discogs-ratelimit-used': '59', 'x-discogs-ratelimit-remaining': '1' }
        const http = httpWith([['/marketplace/price_suggestions/5012948', priceSuggestions, null, spent]])
        await ask(sourceWith(http, { pace: { ...noPace, pause } }), { ...DARK_SIDE, releaseId: 5012948 })
        expect(pause).toHaveBeenCalledWith(60000)
    })

    it('with requests left, the queue is not told to wait', async () => {
        const pause = vi.fn()
        const fine = { 'x-discogs-ratelimit': '60', 'x-discogs-ratelimit-remaining': '41' }
        const http = httpWith([['/marketplace/price_suggestions/5012948', priceSuggestions, null, fine]])
        await ask(sourceWith(http, { pace: { ...noPace, pause } }), { ...DARK_SIDE, releaseId: 5012948 })
        expect(pause).not.toHaveBeenCalled()
    })

    it('a request whose time is over is not sent', async () => {
        const http = httpWith(happyRoutes())
        const error = await sourceWith(http).ask(DARK_SIDE, { deadlineAt: NOW - 1 }).catch(caught => caught)
        expect(error.code).toBe('upstream_timeout')
        expect(http.get).not.toHaveBeenCalled()
    })
})
