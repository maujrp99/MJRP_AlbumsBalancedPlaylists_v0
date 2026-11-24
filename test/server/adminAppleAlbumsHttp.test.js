/**
 * F82 TASK-04 (REQ-03) - POST /api/admin/apple-albums OVER HTTP, behind the door the server really builds (the judge of
 * 2026-11-23: the door of this route was only proven by reading the source). A real HTTP server on this machine runs the
 * very chain index.js mounts on /api/admin - `buildGuards(env).admin`: the login check, the limit of knocks, the
 * administrator's record, the limit of calls - and then the route's own handler; the requests are real `fetch` calls.
 *
 * What stands in: Google's keys (a key pair made here signs the logins), the read of `cmsAdmins/{uid}` (answered from a
 * table) and Apple's catalogue (a double that counts its calls: the real API is never called). Express is not among this
 * suite's packages (it is the server's own), so the HTTP server is Node's, with the two things of Express the chain uses:
 * the parsed JSON body and `res.status().json()`.
 */
// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { createRequire } from 'node:module'
import crypto from 'node:crypto'
import http from 'node:http'

const require = createRequire(import.meta.url)
const { buildGuards } = require('../../server/lib/auth/guards.js')
const { createAppleAlbumService } = require('../../server/lib/services/appleAlbumService.js')
const { createAdminHandlers } = require('../../server/routes/handlers/admin.js')

const PROJECT = 'test-project'
const pair = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
const b64 = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
/** A login as Firebase signs it, for a person and a way of signing in. */
function loginOf(uid, provider = 'google.com') {
    const now = Math.floor(Date.now() / 1000)
    const head = b64({ alg: 'RS256', kid: 'key-1', typ: 'JWT' })
    const body = b64({ aud: PROJECT, iss: `https://securetoken.google.com/${PROJECT}`, sub: uid, iat: now - 10, exp: now + 3600, firebase: { sign_in_provider: provider } })
    const signature = crypto.sign('RSA-SHA256', Buffer.from(`${head}.${body}`), pair.privateKey).toString('base64url')
    return `${head}.${body}.${signature}`
}

/** Who has an administrator's record, and with what role. */
const RECORDS = { owner: 'super', editor: 'editor' }
const notFound = () => Object.assign(new Error('Request failed with status code 404'), { isAxiosError: true, response: { status: 404 } })
const firestore = { get: vi.fn(async (url) => {
    const uid = url.split('/').pop()
    if (!RECORDS[uid]) throw notFound()
    return { status: 200, data: { fields: { role: { stringValue: RECORDS[uid] } } } }
}) }
const ALBUM = { id: '1015739190', type: 'albums', attributes: { name: 'Harvest', artistName: 'Neil Young', releaseDate: '1972-02-01', url: 'https://music.apple.com/us/album/harvest/1015739190', artwork: { url: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/e0/4b/c4/x/093624924722.jpg/{w}x{h}bb.jpg' } } }
const catalog = { searchAlbums: vi.fn(async () => ({ ok: true, albums: [ALBUM] })), albumById: vi.fn(async () => ({ ok: true, albums: [ALBUM] })) }
const quiet = { info() {}, warn() {}, error() {} }

let server, origin

/** The server: the chain of /api/admin as index.js mounts it, then the route. `limit` is the calls an administrator has in the hour. */
function start(limit) {
    const env = { FIREBASE_PROJECT_ID: PROJECT, TRANSLATE_CALLS_PER_HOUR: String(limit), ADMIN_CHECKS_PER_HOUR: '50' }
    const guards = buildGuards(env, { fetchKeys: async () => ({ keys: { 'key-1': pair.publicKey.export({ type: 'spki', format: 'pem' }) }, maxAgeSeconds: 300 }), logger: quiet, http: firestore })
    const handlers = createAdminHandlers({ translateService: { translate: async () => ({}) }, appleAlbumService: createAppleAlbumService({ catalog }), logger: quiet })
    const chain = [...guards.admin, (req, res) => handlers.appleAlbums(req, res)]
    server = http.createServer(async (request, response) => {
        let text = ''
        for await (const chunk of request) text += chunk
        if (request.method !== 'POST' || request.url !== '/api/admin/apple-albums') { response.writeHead(404).end(); return }
        const req = { headers: request.headers, method: request.method, path: '/apple-albums', body: (() => { try { return JSON.parse(text) } catch { return undefined } })() }
        const res = {
            headersSent: false,
            status(code) { response.statusCode = code; return res },
            set(name, value) { response.setHeader(name, value); return res },
            json(body) { res.headersSent = true; response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify(body)); return res }
        }
        const run = async (index) => { if (index < chain.length) await chain[index](req, res, () => run(index + 1)) }
        try { await run(0) } catch { response.writeHead(500).end('{"error":{"code":"internal"}}') }
    })
    return new Promise((resolve) => server.listen(0, '127.0.0.1', () => { origin = `http://127.0.0.1:${server.address().port}`; resolve() }))
}
const stop = () => new Promise((resolve) => server.close(resolve))

async function ask({ login, body = { query: 'harvest' } } = {}) {
    const response = await fetch(`${origin}/api/admin/apple-albums`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(login ? { Authorization: `Bearer ${login}` } : {}) }, body: JSON.stringify(body)
    })
    return { status: response.status, retryAfter: response.headers.get('retry-after'), body: await response.json() }
}

describe('POST /api/admin/apple-albums over HTTP, behind the administrator\'s door', () => {
    beforeAll(() => start(2))
    afterAll(() => stop())
    beforeEach(() => { catalog.searchAlbums.mockClear(); catalog.albumById.mockClear(); firestore.get.mockClear() })

    it('with no login: 401 «session-expired», and neither the record nor Apple is asked', async () => {
        expect(await ask()).toMatchObject({ status: 401, body: { error: { code: 'unauthorized', retryable: false, reason: 'session-expired' } } })
        expect(firestore.get).not.toHaveBeenCalled()
        expect(catalog.searchAlbums).not.toHaveBeenCalled()
    })

    it('a login that does not check (signed by another key, or not a login at all): 401, and Apple is not asked', async () => {
        const other = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
        const [head, body] = loginOf('owner').split('.')
        const forged = `${head}.${body}.${crypto.sign('RSA-SHA256', Buffer.from(`${head}.${body}`), other.privateKey).toString('base64url')}`
        for (const login of [forged, 'not-a-token']) expect(await ask({ login })).toMatchObject({ status: 401, body: { error: { reason: 'session-expired' } } })
        expect(catalog.searchAlbums).not.toHaveBeenCalled()
    })

    it('a guest (the anonymous login the app opens by itself): 403 «not-an-administrator», the record is not even read, Apple is not asked', async () => {
        expect(await ask({ login: loginOf('owner', 'anonymous') })).toMatchObject({ status: 403, body: { error: { code: 'unauthorized', reason: 'not-an-administrator' } } })
        expect(firestore.get).not.toHaveBeenCalled()
        expect(catalog.searchAlbums).not.toHaveBeenCalled()
    })

    it('an account with no administrator record, and one whose role is not «super»: 403, and Apple is not asked', async () => {
        for (const uid of ['somebody', 'editor']) expect(await ask({ login: loginOf(uid) }), uid).toMatchObject({ status: 403, body: { error: { reason: 'not-an-administrator' } } })
        expect(firestore.get).toHaveBeenCalledTimes(2)
        expect(catalog.searchAlbums).not.toHaveBeenCalled()
    })

    it('the administrator: 200 with the albums, each as the crate stores it; then, over the limit of the hour, 429 «too-many-requests» with how long to wait, and Apple is not asked again', async () => {
        const login = loginOf('owner')
        const first = await ask({ login })
        expect(first.status).toBe(200)
        expect(first.body).toEqual({ outcome: 'found', data: { albums: [{ id: '1015739190', title: 'Harvest', artist: 'Neil Young', year: 1972, art: 'Music115/v4/e0/4b/c4/x/093624924722.jpg', href: 'https://music.apple.com/us/album/harvest/1015739190' }] } })
        expect((await ask({ login, body: { query: 'https://music.apple.com/us/album/harvest/1015739190' } })).status).toBe(200)
        expect(catalog.searchAlbums).toHaveBeenCalledTimes(1)
        expect(catalog.albumById).toHaveBeenCalledTimes(1)
        const third = await ask({ login })
        expect(third).toMatchObject({ status: 429, body: { error: { code: 'rate_limited', reason: 'too-many-requests' } } })
        expect(Number(third.retryAfter)).toBeGreaterThan(0)
        expect(catalog.searchAlbums).toHaveBeenCalledTimes(1)
    })

    it('nothing of the developer token, of the login or of the person is in an answer', async () => {
        const answer = JSON.stringify(await ask({ login: loginOf('somebody') }))
        expect(answer).not.toMatch(/Bearer|eyJ|somebody/)
    })
})
