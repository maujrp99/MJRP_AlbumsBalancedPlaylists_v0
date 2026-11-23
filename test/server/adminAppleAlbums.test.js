/**
 * F82 TASK-04 (REQ-03) - POST /api/admin/apple-albums: the Painel's search of Apple Music's catalogue, by album or artist
 * or by an album's link, for the administrator only (the same door and limit as /api/admin/translate, mounted in index.js).
 * No network, no Express and no real key: the catalogue is a double. The real Apple API is never called.
 */
import { describe, it, expect, vi } from 'vitest'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { fakeResponse, answerOf, httpError, timeoutError, networkError } from './helpers/fakes.js'

const require = createRequire(import.meta.url)
const { createAppleCatalog, CATALOG_URL, TIMEOUT_MS } = require('../../server/lib/appleMusic/catalogClient.js')
const { createAppleAlbumService, albumLinkOf, MAX_QUERY_CHARS, MAX_RESULTS, REASONS } = require('../../server/lib/services/appleAlbumService.js')
const { createAdminHandlers } = require('../../server/routes/handlers/admin.js')

// A made-up value, on purpose not shaped like a token: the tests only prove it never reaches a log or an answer
const TOKEN = 'developer-token-stand-in'
const quiet = () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() })
const everythingLogged = (logger) => JSON.stringify([logger.info.mock.calls, logger.warn.mock.calls, logger.error.mock.calls])

const raw = (id, over = {}) => ({
    id: String(id), type: 'albums',
    attributes: {
        name: `Album ${id}`, artistName: `Artist ${id}`, releaseDate: '1972-02-01', url: `https://music.apple.com/us/album/album-${id}/${id}`,
        artwork: { url: `https://is2-ssl.mzstatic.com/image/thumb/Music115/v4/e0/4b/${id}/cover.jpg/{w}x{h}bb.jpg` }, ...over
    }
})
const tokensThat = ({ ready = true } = {}) => ({ checkConfig: () => ({ ready, missing: ready ? [] : ['APPLE_KEY_ID'] }), getToken: vi.fn(() => ({ token: TOKEN })) })
const httpThat = (answer) => ({ get: vi.fn(async () => { if (answer instanceof Error) throw answer; return { status: 200, data: answer } }) })

function catalogWith (answer, { tokens = tokensThat(), logger = quiet() } = {}) {
    const http = httpThat(answer)
    return { catalog: createAppleCatalog({ tokens, http, logger }), http, tokens, logger }
}

describe('the catalogue of Apple Music, asked by the server', () => {
    it('a search asks for albums by the term, in one storefront, with the developer token in the header and a deadline', async () => {
        const { catalog, http } = catalogWith({ results: { albums: { data: [raw(1), raw(2)] } } })
        const result = await catalog.searchAlbums('neil young harvest', { storefront: 'us', limit: 10 })
        expect(result).toEqual({ ok: true, albums: [raw(1), raw(2)] })
        const [url, config] = http.get.mock.calls[0]
        expect(url).toBe(`${CATALOG_URL}/us/search`)
        expect(config.params).toEqual({ term: 'neil young harvest', types: 'albums', limit: 10 })
        expect(config.headers.Authorization).toBe(`Bearer ${TOKEN}`)
        expect(config.timeout).toBe(TIMEOUT_MS)
    })

    it('a search with no album found answers an empty list, not a failure', async () => {
        const { catalog } = catalogWith({ results: {} })
        expect(await catalog.searchAlbums('zzzz', { storefront: 'us', limit: 10 })).toEqual({ ok: true, albums: [] })
    })

    it('one album is asked by its id; «no such album» (404) is an empty list', async () => {
        const found = catalogWith({ data: [raw(1015739190)] })
        expect(await found.catalog.albumById('1015739190', { storefront: 'br' })).toEqual({ ok: true, albums: [raw(1015739190)] })
        expect(found.http.get.mock.calls[0][0]).toBe(`${CATALOG_URL}/br/albums/1015739190`)
        expect(await catalogWith(httpError(404)).catalog.albumById('1', { storefront: 'us' })).toEqual({ ok: true, albums: [] })
    })

    it('with no MusicKit key in the server: «search-not-configured», and Apple is not asked', async () => {
        const { catalog, http, tokens } = catalogWith({}, { tokens: tokensThat({ ready: false }) })
        expect(await catalog.searchAlbums('x', { storefront: 'us', limit: 10 })).toMatchObject({ ok: false, status: 503, code: 'not_configured', reason: 'search-not-configured' })
        expect(tokens.getToken).not.toHaveBeenCalled()
        expect(http.get).not.toHaveBeenCalled()
    })

    const FAILURES = [
        ['Apple refuses the developer token (401)', httpError(401), 'upstream_unauthorized', 'search-not-configured'],
        ['Apple refuses the developer token (403)', httpError(403), 'upstream_unauthorized', 'search-not-configured'],
        ['Apple asks to wait (429)', httpError(429), 'upstream_busy', 'service-unavailable'],
        ['Apple broke (500)', httpError(500), 'upstream_failed', 'service-unavailable'],
        ['no answer in time', timeoutError(), 'upstream_timeout', 'service-unavailable'],
        ['no connection', networkError(), 'upstream_failed', 'service-unavailable']
    ]
    for (const [name, error, code, reason] of FAILURES) {
        it(`${name}: ${code} «${reason}»`, async () => {
            const { catalog } = catalogWith(error)
            expect(await catalog.searchAlbums('x', { storefront: 'us', limit: 10 })).toMatchObject({ ok: false, code, reason })
        })
    }

    it('nothing of the token or of what was searched goes to the log', async () => {
        const { catalog, logger } = catalogWith(httpError(500))
        await catalog.searchAlbums('a very private search', { storefront: 'us', limit: 10 })
        const logged = everythingLogged(logger)
        expect(logged).not.toContain(TOKEN)
        expect(logged).not.toContain('private')
        expect(logger.warn).toHaveBeenCalledWith('apple_catalog_failed', { kind: 'provider-error', status: 500 })
    })

    it('a token that cannot be made (a broken key) is «search-not-configured», not a crash', async () => {
        const tokens = { checkConfig: () => ({ ready: true, missing: [] }), getToken: () => { throw new Error('secretOrPrivateKey must be an asymmetric key') } }
        const { catalog } = catalogWith({}, { tokens })
        expect(await catalog.searchAlbums('x', { storefront: 'us', limit: 10 })).toMatchObject({ ok: false, reason: 'search-not-configured' })
    })
})

describe('an Apple Music album link', () => {
    it('is read by its storefront and its id, with or without the name in it', () => {
        expect(albumLinkOf('https://music.apple.com/us/album/harvest/1015739190')).toEqual({ storefront: 'us', id: '1015739190' })
        expect(albumLinkOf('https://music.apple.com/br/album/admir%C3%A1vel-chip-novo/977428211?i=977428215&l=en')).toEqual({ storefront: 'br', id: '977428211' })
        expect(albumLinkOf('https://music.apple.com/gb/album/20833577')).toEqual({ storefront: 'gb', id: '20833577' })
        expect(albumLinkOf('  https://music.apple.com/us/album/low/1347895593  ')).toEqual({ storefront: 'us', id: '1347895593' })
    })

    it('any other address is not one (null), and a plain search is not an address at all (undefined)', () => {
        for (const link of [
            'https://music.apple.com/us/artist/neil-young/549086', 'https://music.apple.com/us/playlist/x/pl.123', 'http://music.apple.com/us/album/harvest/1015739190',
            'https://music.apple.com.evil.example/us/album/harvest/1015739190', 'https://open.spotify.com/album/1', 'https://music.apple.com/us/album/harvest/abc'
        ]) expect(albumLinkOf(link), link).toBeNull()
        expect(albumLinkOf('harvest neil young')).toBeUndefined()
    })
})

describe('the search of the Painel', () => {
    const serviceWith = (catalog) => createAppleAlbumService({ catalog })
    const catalogThat = (albums) => ({ searchAlbums: vi.fn(async () => ({ ok: true, albums })), albumById: vi.fn(async () => ({ ok: true, albums })) })

    it('a word or two searches the catalogue; each album comes back as exactly what the entry page needs', async () => {
        const catalog = catalogThat([raw(1015739190)])
        const result = await serviceWith(catalog).search({ query: ' harvest ' })
        expect(catalog.searchAlbums).toHaveBeenCalledWith('harvest', { storefront: 'us', limit: MAX_RESULTS })
        expect(result).toMatchObject({ ok: true, status: 200, outcome: 'found' })
        expect(result.data).toEqual({ albums: [{
            id: '1015739190', title: 'Album 1015739190', artist: 'Artist 1015739190', year: 1972,
            art: 'Music115/v4/e0/4b/1015739190/cover.jpg', href: 'https://music.apple.com/us/album/album-1015739190/1015739190'
        }] })
    })

    it('an album link asks for that one album, in the link\'s own storefront', async () => {
        const catalog = catalogThat([raw(977428211)])
        const result = await serviceWith(catalog).search({ query: 'https://music.apple.com/br/album/admir%C3%A1vel-chip-novo/977428211' })
        expect(catalog.albumById).toHaveBeenCalledWith('977428211', { storefront: 'br' })
        expect(catalog.searchAlbums).not.toHaveBeenCalled()
        expect(result.data.albums).toHaveLength(1)
    })

    it('an album the entry page could not show is left out: no cover, a cover from another server, a name with markup, no year, a link that is not Apple Music\'s', async () => {
        const catalog = catalogThat([
            raw(1, { artwork: undefined }), raw(2, { artwork: { url: 'https://evil.example/image/thumb/M/x.jpg/{w}x{h}bb.jpg' } }), raw(3, { name: '<script>x</script>' }),
            raw(4, { releaseDate: undefined }), raw(5, { url: 'https://evil.example/album/5' }), raw(6)
        ])
        const result = await serviceWith(catalog).search({ query: 'x' })
        expect(result.data.albums.map(a => a.id)).toEqual(['6'])
    })

    it('nothing found is a success that says so: 200 «not_found», an empty list', async () => {
        const result = await serviceWith(catalogThat([])).search({ query: 'zzzz' })
        expect(result).toMatchObject({ ok: true, status: 200, outcome: 'not_found', data: { albums: [] } })
    })

    it('a request that is not usable is refused before Apple is asked: «invalid-request»', async () => {
        const catalog = catalogThat([raw(1)])
        for (const body of [null, 'x', {}, { query: '' }, { query: '   ' }, { query: 7 }, { query: 'x'.repeat(MAX_QUERY_CHARS + 1) }]) {
            expect(await serviceWith(catalog).search(body), JSON.stringify(body)).toMatchObject({ ok: false, status: 400, code: 'invalid_request', reason: 'invalid-request' })
        }
        expect(catalog.searchAlbums).not.toHaveBeenCalled()
    })

    it('an address that is not an Apple Music album link: 400 «not-an-album-link», and Apple is not asked', async () => {
        const catalog = catalogThat([raw(1)])
        expect(await serviceWith(catalog).search({ query: 'https://open.spotify.com/album/1' })).toMatchObject({ ok: false, status: 400, reason: 'not-an-album-link' })
        expect(catalog.searchAlbums).not.toHaveBeenCalled()
        expect(catalog.albumById).not.toHaveBeenCalled()
    })

    it('a failure of the catalogue leaves as it came, with its name', async () => {
        const failed = { ok: false, status: 503, code: 'upstream_busy', retryable: true, retryAfterSeconds: null, reason: 'service-unavailable' }
        expect(await serviceWith({ searchAlbums: async () => failed }).search({ query: 'x' })).toBe(failed)
    })

    it('the names the Painel can show are a closed list, the door\'s and the limit\'s among them', () => {
        expect(Object.values(REASONS).sort()).toEqual([
            'invalid-request', 'not-an-administrator', 'not-an-album-link', 'search-not-configured', 'service-unavailable', 'session-expired', 'too-many-requests'
        ])
    })
})

describe('POST /api/admin/apple-albums', () => {
    const handlersWith = (appleAlbumService, logger = quiet()) => ({ logger, handlers: createAdminHandlers({ translateService: { translate: vi.fn() }, appleAlbumService, logger, now: () => 1000 }) })

    it('200 { data: { albums }, outcome }, and one log line with the answer, the time, the kind and the count; never what was searched', async () => {
        const album = { id: '1', title: 'T', artist: 'A', year: 1972, art: 'M/x.jpg', href: 'https://music.apple.com/us/album/x/1' }
        const { handlers, logger } = handlersWith({ search: async () => ({ ok: true, status: 200, outcome: 'found', data: { albums: [album] } }) })
        const res = fakeResponse()
        await handlers.appleAlbums({ body: { query: 'a private search' } }, res)
        expect(answerOf(res)).toMatchObject({ status: 200, body: { data: { albums: [album] }, outcome: 'found' } })
        expect(logger.info).toHaveBeenCalledWith('cms_apple_albums', { event: 'cms_apple_albums', answer: 'found', ms: 0, kind: 'term', chars: 16, count: 1 })
        expect(everythingLogged(logger)).not.toContain('private')
    })

    it('a named failure on the wire, and a body that is not an object is answered, not thrown', async () => {
        const { handlers } = handlersWith(createAppleAlbumService({ catalog: {} }))
        const res = fakeResponse()
        await handlers.appleAlbums({ body: 'nonsense' }, res)
        expect(answerOf(res)).toMatchObject({ status: 400, body: { error: { code: 'invalid_request', retryable: false, reason: 'invalid-request' } } })
    })

    it('the route is mounted behind the administrator door, next to the translation, and the developer token is never in an answer', () => {
        const routes = readFileSync('server/routes/admin.js', 'utf8')
        expect(routes).toMatch(/router\.post\('\/admin\/apple-albums'/)
        const index = readFileSync('server/index.js', 'utf8')
        expect(index.indexOf("app.use('/api/admin', guards.admin)")).toBeGreaterThan(-1)
        expect(index.indexOf("app.use('/api/admin', guards.admin)")).toBeLessThan(index.indexOf("app.use('/api', adminRoutes)"))
        const service = readFileSync('server/lib/services/appleAlbumService.js', 'utf8')
        expect(service).not.toMatch(/getToken|Authorization/)
    })
})
