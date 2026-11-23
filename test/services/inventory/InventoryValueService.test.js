/**
 * F75 (S-57) - the service that reads what the albums of the inventory are worth: the switch, the
 * rates of the day, the readings (kept in the item, in the database, since the decision of the MJRP
 * of 2026-11-21, REQ-14; the browser holds them six hours as the guard against asking twice), one
 * album, and the queue of "Update values". No network: the API, the cache and the inventory are doubles.
 * The calls of the API itself (the login, the deadline, a dropped call) are tested at the end.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    InventoryValueService, READING_PREFIX, READING_TTL_MS, RATES_KEY, READING_WRITE_SIZE
} from '../../../public/js/services/inventory/InventoryValueService.js'
import { createValueApi, VALUE_TIMEOUT_MS } from '../../../public/js/api/valueApi.js'
import { InventoryService } from '../../../public/js/services/inventory/InventoryService.js'

const NOW = Date.parse('2026-11-20T12:00:00Z')
const RELEASE = { id: 5012948, title: 'Harvest 1984, Europe', url: 'https://www.discogs.com/release/5012948' }
const found = (release = RELEASE) => ({ kind: 'found', data: { release, conditions: { mint: 15, nearMint: 12, veryGoodPlus: 9 }, currency: 'USD', readAt: '2026-11-20T12:00:00.000Z' } })
const failed = (code, hold = null) => ({ kind: 'failed', code, retryable: false, status: 500, hold })
const item = (id, extra = {}) => ({ id, artist: 'Artist', title: `Album ${id}`, ...extra })

/** A cache double that keeps what it is given, with the time to live it was given. */
function memoryCache() {
    const kept = new Map()
    return {
        kept,
        get: vi.fn(async (key) => kept.get(key)?.value ?? null),
        set: vi.fn(async (key, value, ttl) => { kept.set(key, { value, ttl }) }),
        invalidate: vi.fn(async (key) => { kept.delete(key) })
    }
}

function build({ answers = [], source = { kind: 'found', data: { discogs: 'on' } }, rates = null, mayAsk = () => true } = {}) {
    const queue = [...answers]
    const api = {
        albumValue: vi.fn(async () => queue.shift() ?? found()),
        valueSources: vi.fn(async () => source),
        exchangeRates: vi.fn(async () => rates ?? failed('upstream_failed'))
    }
    const cache = memoryCache()
    const inventory = { userId: 'user-1', setReadings: vi.fn(async (entries) => entries.map(entry => entry.id)) }
    const sleep = vi.fn(async () => true)
    let clock = NOW
    const service = new InventoryValueService({ api, cache, inventory, mayAsk, now: () => clock, sleep })
    return { service, api, cache, inventory, sleep, tick: (ms) => { clock += ms } }
}

describe('the switch (REQ-10)', () => {
    beforeEach(() => vi.spyOn(console, 'warn').mockImplementation(() => { }))

    it('is on only when the server says so', async () => {
        expect(await build().service.sourceState()).toBe('on')
        expect(await build({ source: { kind: 'found', data: { discogs: 'off' } } }).service.sourceState()).toBe('off')
    })

    it('anything else is off: a failure, a server that does not know the route, an answer with no field', async () => {
        expect(await build({ source: failed('no_answer') }).service.sourceState()).toBe('off')
        expect(await build({ source: { kind: 'legacy', body: '<html>' } }).service.sourceState()).toBe('off')
        expect(await build({ source: { kind: 'found', data: null } }).service.sourceState()).toBe('off')
    })

    it('"unknown" (the server could not read the key of the CMS, F93 REQ-08) is not shown as on, and is said in the console, apart from off', async () => {
        const { service } = build({ source: { kind: 'found', data: { discogs: 'unknown' } } })
        expect(await service.sourceState()).toBe('off')
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('unknown'))
        console.warn.mockClear()
        expect(await build({ source: { kind: 'found', data: { discogs: 'off' } } }).service.sourceState()).toBe('off')
        expect(console.warn).not.toHaveBeenCalled()
    })

    it('a visitor is not asked for: the route answers only to a person with an account', async () => {
        const { service, api } = build({ mayAsk: () => false })
        expect(await service.sourceState()).toBe('off')
        expect(api.valueSources).not.toHaveBeenCalled()
    })
})

describe('the rates of the day (REQ-08)', () => {
    const RATES = { kind: 'found', data: { base: 'USD', date: '2026-11-19', rates: { USD: 1, BRL: 5.89, EUR: 0.91, GBP: 0.76 } } }

    it('asked once a day: kept in the browser for the day, asked again the next day', async () => {
        const { service, api, cache, tick } = build({ rates: RATES })

        expect(await service.rates()).toEqual({ rates: RATES.data.rates, date: '2026-11-19' })
        await service.rates()
        expect(api.exchangeRates).toHaveBeenCalledTimes(1)
        expect(cache.kept.get(RATES_KEY).value.day).toBe('2026-11-20')

        tick(24 * 60 * 60 * 1000)
        await service.rates()
        expect(api.exchangeRates).toHaveBeenCalledTimes(2)
    })

    it('rates that did not come are null, and nothing is kept: the next opening asks again', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => { })
        const { service, api, cache } = build()

        expect(await service.rates()).toBe(null)
        expect(cache.set).not.toHaveBeenCalled()
        await service.rates()
        expect(api.exchangeRates).toHaveBeenCalledTimes(2)
    })
})

describe('one album', () => {
    it('the reading is held in the browser under the person and the item, for six hours: the guard against asking twice (REQ-15)', async () => {
        const { service, cache, inventory } = build()

        const outcome = await service.readItem(item('a'))

        expect(outcome.reading).toMatchObject({ kind: 'found', release: RELEASE, currency: 'USD' })
        const key = `${READING_PREFIX}user-1:a`
        expect([...cache.kept.keys()]).toEqual([key])
        expect(cache.kept.get(key).ttl).toBe(READING_TTL_MS)
        expect(READING_TTL_MS).toBe(6 * 60 * 60 * 1000)
        expect(inventory.setReadings).not.toHaveBeenCalled() // reading one album writes nothing: keeping it is the next step
    })

    it('the server is asked with the edition the item already has', async () => {
        const { service, api } = build()
        await service.readItem(item('a', { year: 1973, discogs: { releaseId: 77, title: 'Kept title', url: 'https://www.discogs.com/release/77' } }))

        expect(api.albumValue.mock.calls[0][0]).toEqual({ artist: 'Artist', title: 'Album a', year: 1973, releaseId: 77 })
    })

    it('a re-read that comes with no title keeps the title the item has', async () => {
        const { service } = build({ answers: [found({ id: 77, title: null, url: 'https://www.discogs.com/release/77' })] })
        const { reading } = await service.readItem(item('a', { discogs: { releaseId: 77, title: 'Kept title', url: 'https://www.discogs.com/release/77' } }))

        expect(reading.release).toEqual({ id: 77, title: 'Kept title', url: 'https://www.discogs.com/release/77' })
    })

    it('a failure keeps nothing in the browser and says what it was', async () => {
        const { service, cache } = build({ answers: [failed('upstream_unauthorized')] })

        expect(await service.readItem(item('a'))).toEqual({ failure: 'token_refused', waitMs: null, stops: true })
        expect(cache.set).not.toHaveBeenCalled()
    })

    it('the readings of the items are read back from the browser, the fresh ones only', async () => {
        const { service, tick } = build()
        await service.readItem(item('a'))
        expect([...(await service.readingsOf([item('a'), item('b')])).keys()]).toEqual(['a'])

        tick(6 * 60 * 60 * 1000) // six hours later the record may still be there: it is not shown
        expect((await service.readingsOf([item('a')])).size).toBe(0)
    })

    it('the reading is kept in the item of the person, with the edition it was of (REQ-14)', async () => {
        const { service, inventory } = build()
        const { reading } = await service.readItem(item('a'))

        await service.keepReadings([{ item: item('a'), reading }])
        expect(inventory.setReadings).toHaveBeenCalledWith([{ id: 'a', reading, discogs: { releaseId: 5012948, title: 'Harvest 1984, Europe', url: RELEASE.url } }])
        expect(reading.readAt).toBe('2026-11-20T12:00:00.000Z')
    })

    it('an edition the item already has is not written again; the reading is', async () => {
        const { service, inventory } = build()
        const { reading } = await service.readItem(item('a'))

        await service.keepReadings([{ item: item('a', { discogs: { releaseId: 5012948 } }), reading }])

        expect(inventory.setReadings).toHaveBeenCalledWith([{ id: 'a', reading }])
    })

    it('a reading that could not be kept loses nothing the person sees', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => { })
        const { service, inventory } = build()
        inventory.setReadings.mockRejectedValue(new Error('offline'))
        const { reading } = await service.readItem(item('a'))

        await expect(service.keepReadings([{ item: item('a'), reading }])).resolves.toBe(1) // not silent: it says one was not kept
    })

    it('says how many readings could not be kept: the ones refused, and all of them when the write fails (never silent)', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => { })
        const { service, inventory } = build()
        const { reading } = await service.readItem(item('a'))
        const read = [{ item: item('a'), reading }, { item: item('b'), reading }]

        expect(await service.keepReadings(read)).toBe(0)
        inventory.setReadings.mockResolvedValueOnce(['a'])
        expect(await service.keepReadings(read)).toBe(1)
        inventory.setReadings.mockRejectedValueOnce(new Error('offline'))
        expect(await service.keepReadings(read)).toBe(2)
    })

    it('nothing to keep writes nothing', async () => {
        const { service, inventory } = build()
        await service.keepReadings([])
        expect(inventory.setReadings).not.toHaveBeenCalled()
    })
})

describe('"Update values": the queue (REQ-09)', () => {
    const items = (count) => Array.from({ length: count }, (_, index) => item(`i${index + 1}`))

    it('reads one album after the other, never two at once, and tells the progress', async () => {
        let running = 0
        let most = 0
        const { service, api } = build()
        api.albumValue.mockImplementation(async () => {
            running += 1
            most = Math.max(most, running)
            await Promise.resolve()
            running -= 1
            return found()
        })
        const steps = []

        const count = await service.readMany(items(5), { onProgress: (step) => steps.push(step.done) })

        expect(most).toBe(1)
        expect(steps).toEqual([0, 1, 2, 3, 4, 5])
        expect(count).toMatchObject({ total: 5, done: 5, read: 5, stopped: null, aborted: false })
    })

    it('a failure of one album does not stop the run, and each album is told as it changes', async () => {
        const { service } = build({ answers: [found(), failed('upstream_failed'), { kind: 'not_found', data: null }, { kind: 'no_value', data: { release: RELEASE } }] })
        const told = []

        const count = await service.readMany(items(4), { onItem: (one, what) => told.push([one.id, what?.state || what?.reading?.kind]) })

        expect(count).toMatchObject({ done: 4, read: 1, noEdition: 1, noSuggestion: 1, failed: { no_answer: 1 }, stopped: null })
        expect(told).toEqual([['i1', 'reading'], ['i1', 'found'], ['i2', 'reading'], ['i2', 'failed'], ['i3', 'reading'], ['i3', 'not_found'], ['i4', 'reading'], ['i4', 'no_value']])
    })

    it('"wait" is waited and the same album is asked again', async () => {
        const { service, api, sleep } = build({ answers: [failed('upstream_busy', { reason: 'source_busy', retryAfterMs: 40000 }), found()] })

        const count = await service.readMany(items(1))

        expect(sleep).toHaveBeenCalledWith(40000, null)
        expect(api.albumValue).toHaveBeenCalledTimes(2)
        expect(count).toMatchObject({ read: 1, failed: {} })
    })

    it('an album that keeps answering "wait" is counted as failed by the limit, and the run goes on', async () => {
        const busy = () => failed('upstream_busy', { reason: 'source_busy', retryAfterMs: 1000 })
        const { service, api } = build({ answers: [busy(), busy(), busy(), found()] })

        const count = await service.readMany(items(2))

        expect(api.albumValue).toHaveBeenCalledTimes(4)
        expect(count).toMatchObject({ done: 2, read: 1, failed: { limit: 1 }, stopped: null })
    })

    it('the token refused stops the run at once: the other albums are not asked', async () => {
        const { service, api } = build({ answers: [found(), failed('upstream_unauthorized')] })

        const count = await service.readMany(items(10))

        expect(api.albumValue).toHaveBeenCalledTimes(2)
        expect(count).toMatchObject({ done: 2, read: 1, failed: { token_refused: 1 }, stopped: 'token_refused' })
    })

    it('the source turned off in the middle ends the run, and that album is not counted as failed', async () => {
        const { service } = build({ answers: [found(), { kind: 'not_configured', data: null }] })

        expect(await service.readMany(items(5))).toMatchObject({ done: 1, read: 1, failed: {}, stopped: 'off' })
    })

    it('"Stop", or leaving the screen, ends it after the album being read; nothing more is asked', async () => {
        const stop = new AbortController()
        const { service, api } = build()
        api.albumValue.mockImplementation(async () => {
            if (api.albumValue.mock.calls.length === 2) stop.abort()
            return found()
        })

        const count = await service.readMany(items(6), { signal: stop.signal })

        expect(api.albumValue).toHaveBeenCalledTimes(2)
        expect(count).toMatchObject({ done: 2, aborted: true, stopped: null })
    })

    it('a call dropped in the middle is not a failure of the album', async () => {
        const { service } = build({ answers: [{ kind: 'failed', code: 'dropped' }] })
        const told = []

        const count = await service.readMany(items(3), { onItem: (one, what) => told.push(what) })

        expect(count).toMatchObject({ done: 0, failed: {}, aborted: true })
        expect(told).toEqual([{ state: 'reading' }, null])
    })

    it('a wait dropped by "Stop" ends the run too', async () => {
        const { service, sleep } = build({ answers: [failed('upstream_busy', { reason: 'source_busy', retryAfterMs: 40000 })] })
        sleep.mockResolvedValue(false)

        expect(await service.readMany(items(3))).toMatchObject({ done: 0, aborted: true })
    })

    it('the readings found are kept in the items in parts, and what is left at the end; a newer one replaces the older (REQ-14, REQ-15)', async () => {
        const { service, inventory } = build()

        await service.readMany(items(READING_WRITE_SIZE + 3))

        expect(inventory.setReadings.mock.calls.map(([entries]) => entries.length)).toEqual([READING_WRITE_SIZE, 3])
        expect(inventory.setReadings.mock.calls[0][0][0].reading.readAt).toBe('2026-11-20T12:00:00.000Z')
    })

    it('a run counts the readings it could not keep, so the notice can say so; the value is still read', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => { })
        const { service, inventory } = build()
        inventory.setReadings.mockRejectedValue(new Error('offline'))

        const count = await service.readMany(items(2))

        expect(count.read).toBe(2)
        expect(count.unkept).toBe(2)
    })

    it('a failed album keeps nothing: the reading it had stays as it was', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => { })
        const { service, inventory } = build({ answers: [failed('upstream_failed')] })

        await service.readMany(items(1))

        expect(inventory.setReadings).not.toHaveBeenCalled()
    })

    it('with nothing to read it asks nothing', async () => {
        const { service, api } = build()
        expect(await service.readMany([])).toMatchObject({ total: 0, done: 0 })
        expect(api.albumValue).not.toHaveBeenCalled()
    })
})

describe('the inventory keeps the reading, and only the reading', () => {
    it('one write for all the items, then the store; an item that left the inventory is left out', async () => {
        const albums = [{ id: 'a', title: 'A', value: { amount: 25, currency: 'USD' } }, { id: 'b', title: 'B' }]
        const store = { getAlbums: () => albums.slice(), replaceAlbums: vi.fn() }
        const repository = { setReadings: vi.fn(async () => ['a']) }
        const service = new InventoryService({ store, createRepository: () => repository })
        const discogs = { releaseId: 5012948, title: 'Harvest 1984, Europe', url: RELEASE.url }
        const reading = { kind: 'found', readAt: '2026-11-20T12:00:00.000Z' }

        await service.setReadings([{ id: 'a', reading, discogs }, { id: 'gone', reading }])

        expect(repository.setReadings).toHaveBeenCalledWith([{ id: 'a', reading, discogs }])
        expect(store.replaceAlbums).toHaveBeenCalledWith([{ id: 'a', title: 'A', value: { amount: 25, currency: 'USD' }, discogsReading: reading, discogs }, { id: 'b', title: 'B' }])
    })

    it('a write that fails leaves the store as it was', async () => {
        const store = { getAlbums: () => [{ id: 'a' }], replaceAlbums: vi.fn() }
        const service = new InventoryService({ store, createRepository: () => ({ setReadings: vi.fn(async () => { throw new Error('offline') }) }) })

        await expect(service.setReadings([{ id: 'a', reading: { kind: 'found' } }])).rejects.toThrow('offline')
        expect(store.replaceAlbums).not.toHaveBeenCalled()
    })
})

describe('the calls to the server', () => {
    const response = (status, body) => ({ ok: status < 400, status, headers: { get: () => null }, json: async () => body })

    it('each one goes with the login, to its route, and is read by the one reader', async () => {
        const fetchServer = vi.fn(async () => response(200, { data: { discogs: 'on' }, outcome: 'found' }))
        const api = createValueApi({ fetchServer, base: '/api' })

        expect(await api.valueSources()).toEqual({ kind: 'found', data: { discogs: 'on' } })
        await api.exchangeRates()
        await api.albumValue({ artist: 'Yes', title: 'Fragile' })

        expect(fetchServer.mock.calls.map(([url, init]) => [init.method, url])).toEqual([['GET', '/api/value-sources'], ['GET', '/api/exchange-rates'], ['POST', '/api/album-value']])
        expect(JSON.parse(fetchServer.mock.calls[2][1].body)).toEqual({ artist: 'Yes', title: 'Fragile' })
    })

    it('the new outcomes and the new code are read as what they are', async () => {
        const api = (status, body) => createValueApi({ fetchServer: async () => response(status, body) })

        expect((await api(200, { data: null, outcome: 'not_configured' }).albumValue({})).kind).toBe('not_configured')
        expect((await api(200, { data: { release: {} }, outcome: 'no_value' }).albumValue({})).kind).toBe('no_value')
        expect(await api(502, { error: { code: 'upstream_unauthorized', retryable: false } }).albumValue({})).toMatchObject({ kind: 'failed', code: 'upstream_unauthorized', retryable: false })
    })

    it('a call with no answer is a typed failure, never a thrown error', async () => {
        const api = createValueApi({ fetchServer: async () => { throw new TypeError('Failed to fetch') } })
        expect(await api.albumValue({})).toMatchObject({ kind: 'failed', code: 'no_answer' })
    })

    it('a call the caller dropped says so, and one that is too slow is cut at its deadline', async () => {
        vi.useFakeTimers()
        try {
            const hanging = (url, init) => new Promise((resolve, reject) => init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))))
            const api = createValueApi({ fetchServer: hanging })

            const stop = new AbortController()
            const dropped = api.albumValue({}, { signal: stop.signal })
            stop.abort()
            expect(await dropped).toMatchObject({ kind: 'failed', code: 'dropped' })

            const slow = api.albumValue({})
            await vi.advanceTimersByTimeAsync(VALUE_TIMEOUT_MS)
            expect(await slow).toMatchObject({ kind: 'failed', code: 'deadline' })
        } finally {
            vi.useRealTimers()
        }
    })
})
