/**
 * F75, after the first run in production - Discogs gives price suggestions only to an account
 * with its seller settings filled in: the price page answered HTTP 404 «You must fill out your
 * seller settings first.» for every album. The source says so, and reads a weaker value in its
 * place: the lowest price the edition is for sale at (GET /marketplace/stats/{release_id}).
 * The shape of the stats answer is the real one, read on 2026-11-20 (unauthenticated).
 */
import { describe, it, expect, vi } from 'vitest'
import { createRequire } from 'node:module'
import { httpError } from './helpers/fakes.js'
import priceSuggestions from '../fixtures/discogs/price-suggestions.json'

const require = createRequire(import.meta.url)
const { createDiscogsSource } = require('../../server/lib/valueSources/discogsSource.js')
const { lowestForSaleOf } = require('../../server/lib/valueSources/discogsParse.js')
const { createValueService } = require('../../server/lib/services/valueService.js')
const { noPace } = require('../../server/lib/politeQueue.js')
const { UpstreamError } = require('../../server/lib/outcome.js')

const NOW = Date.parse('2026-11-20T12:00:00Z')
const ALBUM = { artist: 'Pink Floyd', title: 'The Dark Side of the Moon', releaseId: 5012948 }
const RELEASE = { id: 5012948, title: null, url: 'https://www.discogs.com/release/5012948' }
const SELLER = { message: 'You must fill out your seller settings first.' }
const FOR_SALE = { num_for_sale: 124, lowest_price: { value: 0.53, currency: 'USD' }, blocked_from_sale: false } // real answer, release 249504
const NONE_FOR_SALE = { num_for_sale: 0, lowest_price: null, blocked_from_sale: false } // real answer, release 5012948
const refused = (status = 404) => httpError(status, SELLER)

function httpWith(routes) {
    const calls = []
    const get = vi.fn(async (url, config = {}) => {
        calls.push(url.replace('https://api.discogs.com', ''))
        const route = routes.find(([part]) => url.includes(part))
        if (!route) throw new Error(`no route for ${url}`)
        if (route[1] instanceof Error) throw route[1]
        return { status: 200, data: route[1], headers: {}, config }
    })
    return { get, calls }
}
const warn = vi.fn()
const sourceWith = (http) => createDiscogsSource({ http, pace: noPace, env: { DISCOGS_TOKEN: 't' }, now: () => NOW, logger: { warn } })
const ask = (http, album = ALBUM) => sourceWith(http).ask(album, { deadlineAt: NOW + 20000 })

describe('reading the stats of an edition', () => {
    it('the lowest price and how many are for sale, from the real shape', () => {
        expect(lowestForSaleOf(FOR_SALE)).toEqual({ lowest: { value: 0.53, currency: 'USD' }, forSale: 124 })
    })

    it('nothing for sale, or nothing readable, is no price: never zero', () => {
        expect(lowestForSaleOf(NONE_FOR_SALE)).toBeNull()
        expect(lowestForSaleOf({ num_for_sale: 3, lowest_price: { value: 0, currency: 'USD' } })).toBeNull()
        expect(lowestForSaleOf({ num_for_sale: 3, lowest_price: { value: '12', currency: 'USD' } })).toBeNull()
        expect(lowestForSaleOf({ num_for_sale: 3, lowest_price: { value: 12 } })).toBeNull()
        expect(lowestForSaleOf(null)).toBeNull()
        expect(lowestForSaleOf('a page')).toBeNull()
    })
})

describe('the suggestion refused for the seller settings', () => {
    it('is said, and the lowest price for sale is read in its place: one more request, for this album only', async () => {
        const http = httpWith([['/marketplace/price_suggestions/5012948', refused()], ['/marketplace/stats/5012948', FOR_SALE]])

        expect(await ask(http)).toEqual({
            outcome: 'found',
            release: RELEASE,
            kind: 'lowest_for_sale',
            lowest: { value: 0.53, currency: 'USD' },
            forSale: 124,
            suggestions: 'seller_settings_missing',
            readAt: '2026-11-20T12:00:00.000Z'
        })
        expect(http.calls).toEqual(['/marketplace/price_suggestions/5012948', '/marketplace/stats/5012948'])
    })

    it('is the same refusal when Discogs sends it as 401 or 403: it is not "the token was refused"', async () => {
        for (const status of [401, 403]) {
            const http = httpWith([['/marketplace/price_suggestions/5012948', refused(status)], ['/marketplace/stats/5012948', FOR_SALE]])
            expect(await ask(http)).toMatchObject({ outcome: 'found', kind: 'lowest_for_sale', suggestions: 'seller_settings_missing' })
        }
    })

    it('a 401 with any other sentence is still the token refused', async () => {
        const http = httpWith([['/marketplace/price_suggestions/5012948', httpError(401, { message: 'You must authenticate to access this resource.' })]])
        const error = await ask(http).catch(caught => caught)
        expect(error).toBeInstanceOf(UpstreamError)
        expect(error.code).toBe('upstream_unauthorized')
    })

    it('with none for sale: no value, with the edition and the two reasons', async () => {
        const http = httpWith([['/marketplace/price_suggestions/5012948', refused()], ['/marketplace/stats/5012948', NONE_FOR_SALE]])

        expect(await ask(http)).toEqual({ outcome: 'no_value', release: RELEASE, reason: 'none_for_sale', suggestions: 'seller_settings_missing' })
    })

    it('the app that already knows asks for the lowest price at once: the price page is not asked again', async () => {
        const http = httpWith([['/marketplace/price_suggestions/5012948', refused()], ['/marketplace/stats/5012948', FOR_SALE]])

        const answer = await ask(http, { ...ALBUM, prices: 'lowest' })

        expect(answer).toMatchObject({ outcome: 'found', kind: 'lowest_for_sale', suggestions: 'not_asked' })
        expect(http.calls).toEqual(['/marketplace/stats/5012948'])
    })

    it('an edition whose stats page is gone (404) is not_found', async () => {
        const http = httpWith([['/marketplace/stats/5012948', httpError(404, { message: 'Release not found.' })]])
        expect(await ask(http, { ...ALBUM, prices: 'lowest' })).toEqual({ outcome: 'not_found' })
    })

    it('the three conditions are untouched: with the seller settings filled in, the suggestion comes and the stats are not asked', async () => {
        const http = httpWith([['/marketplace/price_suggestions/5012948', priceSuggestions], ['/marketplace/stats/5012948', FOR_SALE]])

        const answer = await ask(http)

        expect(answer).toMatchObject({ outcome: 'found', conditions: { mint: 14.5, nearMint: 11.2, veryGoodPlus: 7.9 }, currency: 'USD' })
        expect(answer.kind).toBeUndefined()
        expect(http.calls).toEqual(['/marketplace/price_suggestions/5012948'])
    })

    it('a suggestion that comes empty says why there is no value', async () => {
        const http = httpWith([['/marketplace/price_suggestions/5012948', {}]])
        expect(await ask(http)).toEqual({ outcome: 'no_value', release: RELEASE, reason: 'no_suggestion' })
    })

    it('the route passes the hint of the app to the source, and only the hint it knows', async () => {
        const source = { name: 'Discogs', ask: vi.fn(async () => ({ outcome: 'not_found' })) }
        const service = createValueService({ source, switches: { discogsValues: async () => 'on' }, env: { DISCOGS_TOKEN: 't' }, logger: { warn: vi.fn() } })

        await service.albumValue({ artist: 'A', title: 'T', prices: 'lowest' }, { uid: 'u' })
        await service.albumValue({ artist: 'A', title: 'T', prices: 'everything' }, { uid: 'u' })

        expect(source.ask.mock.calls.map(([album]) => album.prices)).toEqual(['lowest', undefined])
    })
})
