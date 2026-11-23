/**
 * F93 TASK-05 (REQ-08): the server reads the Discogs key of the CMS from one public Firestore
 * document (`published/site`), by REST, kept 60 s, with a 1.5 s deadline, and answers THREE states:
 * on, off, and unknown (it could not read), never confusing the last two. No network: the HTTP
 * client and the clock are doubles.
 */
import { describe, it, expect, vi } from 'vitest'
import { createRequire } from 'node:module'
import { httpError, networkError } from './helpers/fakes.js'

const require = createRequire(import.meta.url)
const { createCmsSwitches, siteDocumentUrl, FRESH_MS, STALE_LIMIT_MS, READ_DEADLINE_MS } = require('../../server/lib/valueSources/cmsSwitches.js')

const quiet = () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() })
const document = (switches, extra = {}) => ({
    name: 'projects/p/databases/(default)/documents/published/site',
    fields: { _schemaVersion: { integerValue: '1' }, rev: { integerValue: '3' }, switches: { mapValue: { fields: switches } }, ...extra }
})
const bool = (value) => ({ booleanValue: value })
const answer = (body) => ({ status: 200, data: body })
const httpThat = (...answers) => {
    const get = vi.fn(async () => {
        const next = answers.length > 1 ? answers.shift() : answers[0]
        if (next instanceof Error) throw next
        return typeof next === 'function' ? next() : next
    })
    return { get }
}
const build = (http, options = {}) => {
    const clock = { ms: 1_000_000 }
    const logger = quiet()
    const reader = createCmsSwitches({ http, env: {}, now: () => clock.ms, logger, ...options })
    return { reader, logger, clock, tick: (ms) => { clock.ms += ms } }
}

describe('where it reads', () => {
    it('one public document, by REST, of the project of the logins (FIREBASE_PROJECT_ID, else the production one)', () => {
        expect(siteDocumentUrl({})).toBe('https://firestore.googleapis.com/v1/projects/mjrp-playlist-generator/databases/(default)/documents/published/site')
        expect(siteDocumentUrl({ FIREBASE_PROJECT_ID: 'other-project' })).toContain('/projects/other-project/')
    })

    it('asks once for the document with a deadline of 1.5 s, and sends no credential', async () => {
        const http = httpThat(answer(document({ discogsValues: bool(true) })))
        const { reader } = build(http)
        await reader.discogsValues()
        expect(http.get).toHaveBeenCalledTimes(1)
        const [url, config] = http.get.mock.calls[0]
        expect(url).toBe(siteDocumentUrl({}))
        expect(READ_DEADLINE_MS).toBe(1500)
        expect(JSON.stringify(config)).not.toMatch(/authorization|key=|token/i)
    })
})

describe('the three states', () => {
    it('on: the key is true', async () => {
        expect(await build(httpThat(answer(document({ discogsValues: bool(true) })))).reader.discogsValues()).toBe('on')
    })

    it('off: the key is false', async () => {
        expect(await build(httpThat(answer(document({ discogsValues: bool(false) })))).reader.discogsValues()).toBe('off')
    })

    it('off: the document was read and the key is not in it (the default of the key is false, nobody turned it on)', async () => {
        expect(await build(httpThat(answer(document({ usageMeasurement: bool(true) })))).reader.discogsValues()).toBe('off')
    })

    it('off: the document does not exist (404 is an answer: nobody turned anything on)', async () => {
        const { reader, logger } = build(httpThat(httpError(404, { error: { status: 'NOT_FOUND' } })))
        expect(await reader.discogsValues()).toBe('off')
        expect(logger.warn).not.toHaveBeenCalled()
    })

    it('off, and said in the log: the key came with another type ("yes"); a key out of the list is ignored and said too', async () => {
        const { reader, logger } = build(httpThat(answer(document({ discogsValues: { stringValue: 'yes' }, foo: bool(true) }))))
        expect(await reader.discogsValues()).toBe('off')
        const said = logger.warn.mock.calls.map(([line]) => line).join('\n')
        expect(said).toMatch(/discogsValues/)
        expect(said).toMatch(/foo/)
    })

    it('unknown, never off: the rules refuse the read (403), the service fails (500), the network is out, the answer is not a document', async () => {
        for (const failure of [httpError(403), httpError(500), httpError(503), networkError(), answer('<html>'), answer({ fields: 'nonsense' }), answer(null)]) {
            const { reader, logger } = build(httpThat(failure))
            expect(await reader.discogsValues(), String(failure?.message ?? failure)).toBe('unknown')
            expect(logger.warn, 'it says so in the log').toHaveBeenCalled()
        }
    })

    it('unknown: the read does not come in 1.5 s (the work is left behind)', async () => {
        const http = httpThat(() => new Promise(() => { }))
        const { reader, logger } = build(http, { deadlineMs: 20 })
        expect(await reader.discogsValues()).toBe('unknown')
        expect(logger.warn.mock.calls.join(' ')).toMatch(/timeout|no answer/i)
    })

    it('a document with a switches map that is not a map: unknown is wrong, the key is just not read, so off, with the reason said', async () => {
        const { reader, logger } = build(httpThat(answer({ fields: { switches: { stringValue: 'oops' } } })))
        expect(await reader.discogsValues()).toBe('off')
        expect(logger.warn).toHaveBeenCalled()
    })

    it('a document with no switches at all is read as nothing said', async () => {
        expect(await build(httpThat(answer({ fields: { rev: { integerValue: '1' } } }))).reader.discogsValues()).toBe('off')
    })
})

describe('kept for 60 seconds', () => {
    it('asked once inside the minute, and again after it', async () => {
        const http = httpThat(answer(document({ discogsValues: bool(true) })), answer(document({ discogsValues: bool(false) })))
        const { reader, tick } = build(http)
        expect(FRESH_MS).toBe(60_000)
        expect(await reader.discogsValues()).toBe('on')
        tick(59_000)
        expect(await reader.discogsValues()).toBe('on')
        expect(http.get).toHaveBeenCalledTimes(1)
        tick(1_001)
        expect(await reader.discogsValues()).toBe('off')
        expect(http.get).toHaveBeenCalledTimes(2)
    })

    it('requests that arrive together share one read', async () => {
        let release
        const http = httpThat(() => new Promise(resolve => { release = () => resolve(answer(document({ discogsValues: bool(true) }))) }))
        const { reader } = build(http)
        const together = Promise.all([reader.discogsValues(), reader.discogsValues(), reader.discogsValues()])
        await vi.waitFor(() => expect(release).toBeDefined())
        release()
        expect(await together).toEqual(['on', 'on', 'on'])
        expect(http.get).toHaveBeenCalledTimes(1)
    })

    it('the first request of a new instance WAITS for the read: it answers only when the read is in', async () => {
        let release
        const http = httpThat(() => new Promise(resolve => { release = () => resolve(answer(document({ discogsValues: bool(false) }))) }))
        const { reader } = build(http)
        let settled = false
        const first = reader.discogsValues().then(state => { settled = true; return state })
        await vi.waitFor(() => expect(release).toBeDefined())
        await new Promise(resolve => setTimeout(resolve, 10))
        expect(settled).toBe(false)
        release()
        expect(await first).toBe('off')
    })
})

describe('when the read fails after it had worked', () => {
    const on = answer(document({ discogsValues: bool(true) }))

    it('a failed read is not asked again before 60 s; the last good reading stands meanwhile', async () => {
        const http = httpThat(on, httpError(500))
        const { reader, tick } = build(http)
        expect(await reader.discogsValues()).toBe('on')
        tick(61_000)
        expect(await reader.discogsValues()).toBe('on') // the read failed; the last one stands
        expect(http.get).toHaveBeenCalledTimes(2)
        tick(30_000)
        expect(await reader.discogsValues()).toBe('on')
        expect(http.get, 'not before 60 s after the failure').toHaveBeenCalledTimes(2)
        tick(31_000)
        await reader.discogsValues()
        expect(http.get).toHaveBeenCalledTimes(3)
    })

    it('the last good reading stands for ten minutes at most: after that, unknown (never a stale "on" for good)', async () => {
        const http = httpThat(on, httpError(500))
        const { reader, tick, logger } = build(http)
        expect(STALE_LIMIT_MS).toBe(600_000)
        await reader.discogsValues()
        tick(STALE_LIMIT_MS - 1_000)
        expect(await reader.discogsValues()).toBe('on')
        tick(2_000)
        expect(await reader.discogsValues()).toBe('unknown')
        expect(logger.warn).toHaveBeenCalled()
    })

    it('when it works again, the new reading replaces everything', async () => {
        const http = httpThat(httpError(500), answer(document({ discogsValues: bool(false) })))
        const { reader, tick } = build(http)
        expect(await reader.discogsValues()).toBe('unknown')
        tick(61_000)
        expect(await reader.discogsValues()).toBe('off')
    })
})
