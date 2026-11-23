/**
 * F62 (UAT-200, UAT-09) - exporting to Spotify, against a double of the Spotify Web API (the
 * services are the real ones; only `fetch` is replaced):
 *
 * - an access that expired is renewed once with the refresh token and the call is made again;
 * - when it cannot be renewed the export says "connect again" and reports what it had created;
 * - a 429 with Retry-After is waited for when the wait is short, and reported when it is long;
 * - every playlist created comes back with its address, in both modes;
 * - exporting again in the same session does not create what is already there.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SpotifyExportService } from '../../../public/js/services/SpotifyExportService.js'
import { SpotifyService } from '../../../public/js/services/SpotifyService.js'
import { exportLedger } from '../../../public/js/services/export/exportLedger.js'
import { SpotifyRefusedError } from '../../../public/js/services/spotify/spotifyErrors.js'

const HOUR = 3600 * 1000
const json = (status, body = {}, headers = {}) => ({
    status,
    ok: status >= 200 && status < 300,
    headers: { get: (name) => headers[name] ?? headers[name.toLowerCase()] ?? null },
    json: async () => body
})

/** A double of Spotify: it keeps what was created and answers as the API does. */
function fakeSpotify() {
    const api = {
        validTokens: new Set(['access-1']),
        refreshAnswers: [],          // queue of answers of the token endpoint; default: a new valid token
        created: [],                 // [{ id, name, uris: [] }]
        calls: [],                   // 'METHOD path' of every API call, in order
        refreshes: 0,
        failures: [],                // [{ match: (method, path) => bool, response }] taken once each
        always: [],                  // [{ match: (method, path) => bool, answer: () => response }] every time (F97); an answer may throw
        catalog: new Set(['One', 'Two', 'Three', 'Four'])
    }

    const refresh = () => {
        api.refreshes++
        const scripted = api.refreshAnswers.shift()
        if (scripted) return scripted
        const token = `access-${api.refreshes + 1}`
        api.validTokens.add(token)
        return json(200, { access_token: token, expires_in: 3600 })
    }

    const answer = (method, path, body) => {
        if (path === '/me') return json(200, { id: 'me' })
        if (path.startsWith('/search')) {
            const title = new URLSearchParams(path.split('?')[1]).get('q').match(/track:(.+?) artist:/)?.[1]
            const items = api.catalog.has(title) ? [{ name: title, uri: `spotify:track:${title}`, artists: [{ name: 'Artist' }] }] : []
            return json(200, { tracks: { items } })
        }
        if (method === 'POST' && path === '/users/me/playlists') {
            const playlist = { id: `pl-${api.created.length + 1}`, name: body.name, uris: [] }
            api.created.push(playlist)
            return json(201, { id: playlist.id, external_urls: { spotify: `https://open.spotify.com/playlist/${playlist.id}` } })
        }
        const tracksOf = path.match(/^\/playlists\/(.+)\/tracks$/)
        if (method === 'POST' && tracksOf) {
            api.created.find(p => p.id === tracksOf[1]).uris.push(...body.uris)
            return json(201, { snapshot_id: 's' })
        }
        return json(404, { error: { message: `no such endpoint: ${method} ${path}` } })
    }

    api.fetch = vi.fn(async (url, init = {}) => {
        if (url.startsWith('https://accounts.spotify.com/api/token')) return refresh()
        const path = url.replace('https://api.spotify.com/v1', '')
        const method = init.method || 'GET'
        api.calls.push(`${method} ${path.split('?')[0]}`)
        const token = (init.headers?.Authorization || '').replace('Bearer ', '')
        if (!api.validTokens.has(token)) return json(401, { error: { message: 'The access token expired' } })
        const rule = api.always.find(f => f.match(method, path))
        if (rule) return rule.answer()
        const at = api.failures.findIndex(f => f.match(method, path))
        if (at !== -1) return api.failures.splice(at, 1)[0].response
        return answer(method, path, init.body ? JSON.parse(init.body) : null)
    })
    return api
}

const connect = ({ access = 'access-1', expiresIn = HOUR, refresh = 'refresh-1' } = {}) => {
    localStorage.setItem('spotify_access_token', access)
    localStorage.setItem('spotify_expires_at', String(Date.now() + expiresIn))
    if (refresh) localStorage.setItem('spotify_refresh_token', refresh)
}

const track = (title, extra = {}) => ({ title, artist: 'Artist', album: 'Album', ...extra })
const PLAYLISTS = [
    { name: 'Greatest Hits', title: 'Greatest Hits', tracks: [track('One'), track('Two')] },
    { name: 'Deep Cuts', title: 'Deep Cuts', tracks: [track('Three'), track('Four')] }
]
const noCallbacks = { onProgress: () => { } }
const exportAs = (mode, playlists = PLAYLISTS, callbacks = noCallbacks) =>
    SpotifyExportService.exportPlaylists(playlists, { mode, name: 'Road trip' }, callbacks)

describe('exporting to Spotify (F62)', () => {
    let api, waits

    beforeEach(() => {
        localStorage.clear()
        exportLedger.clear()
        api = fakeSpotify()
        vi.stubGlobal('fetch', api.fetch)
        waits = []
        vi.spyOn(SpotifyService, '_sleep').mockImplementation(async (ms) => { waits.push(ms) })
        vi.spyOn(SpotifyExportService, 'pause').mockResolvedValue()
        vi.spyOn(console, 'error').mockImplementation(() => { })
        vi.spyOn(console, 'warn').mockImplementation(() => { })
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    describe('an access that expired', () => {
        it('is renewed with the refresh token before the export starts, and the export goes on', async () => {
            connect({ access: 'access-old', expiresIn: -HOUR })

            const report = await exportAs('merge')

            expect(api.refreshes).toBe(1)
            expect(report.failure).toBeNull()
            expect(report.created).toEqual([expect.objectContaining({ name: 'Road trip', tracks: 4 })])
            expect(localStorage.getItem('spotify_access_token')).toBe('access-2')
        })

        it('that Spotify refuses in the middle (401) is renewed once and the refused call is made again', async () => {
            connect()
            api.failures.push({ match: (method, path) => method === 'POST' && path === '/users/me/playlists', response: json(401, {}) })

            const report = await exportAs('merge')

            expect(api.refreshes).toBe(1)
            expect(report.failure).toBeNull()
            expect(api.created).toHaveLength(1)
            expect(api.created[0].uris).toHaveLength(4)
        })

        it('with no refresh token asks to connect again and asks Spotify for nothing', async () => {
            connect({ expiresIn: -HOUR, refresh: null })

            const report = await exportAs('merge')

            expect(report.failure).toEqual({ kind: 'reconnect' })
            expect(report.created).toEqual([])
            expect(report.notCreated).toEqual(['Road trip'])
            expect(api.calls).toEqual([])
        })

        it('that cannot be renewed asks to connect again', async () => {
            connect({ access: 'access-old', expiresIn: -HOUR })
            api.refreshAnswers.push(json(400, { error: 'invalid_grant' }))

            const report = await exportAs('merge')

            expect(report.failure.kind).toBe('reconnect')
            expect(api.created).toEqual([])
        })

        it('refused again after the renewal stops there: connect again, with what was created and what was not', async () => {
            connect()
            let creations = 0
            // the second playlist is refused, and the renewed access is refused too
            api.failures.push({
                match: (method, path) => method === 'POST' && path === '/users/me/playlists' && ++creations === 2,
                response: json(401, {})
            })
            api.refreshAnswers.push(json(200, { access_token: 'access-not-accepted', expires_in: 3600 }))

            const report = await exportAs('separate')

            expect(api.refreshes).toBe(1) // once, not in a loop
            expect(report.failure.kind).toBe('reconnect')
            expect(report.created.map(p => p.name)).toEqual(['Road trip - Greatest Hits'])
            expect(report.notCreated).toEqual(['Road trip - Deep Cuts'])
        })
    })

    describe('when Spotify asks to wait (429)', () => {
        const limited = (seconds) => ({
            match: (method, path) => method === 'POST' && path === '/users/me/playlists',
            response: json(429, {}, { 'Retry-After': String(seconds) })
        })

        it('waits the time asked when it is short and makes the call again', async () => {
            connect()
            api.failures.push(limited(3))

            const report = await exportAs('merge')

            expect(waits).toEqual([3000])
            expect(report.failure).toBeNull()
            expect(api.created).toHaveLength(1)
        })

        it('does not wait a long time: it stops and says how long Spotify asked for', async () => {
            connect()
            api.failures.push(limited(600))

            const report = await exportAs('merge')

            expect(waits).toEqual([])
            expect(report.failure).toEqual({ kind: 'rate-limit', retryAfterSeconds: 600 })
            expect(report.notCreated).toEqual(['Road trip'])
        })
    })

    describe('what was created (UAT-09)', () => {
        it('one playlist in merge mode, with its address', async () => {
            connect()

            const report = await exportAs('merge')

            expect(report.created).toEqual([
                { name: 'Road trip', url: 'https://open.spotify.com/playlist/pl-1', tracks: 4, total: 4, alreadyThere: false }
            ])
            expect(api.created[0].uris).toEqual(['spotify:track:One', 'spotify:track:Two', 'spotify:track:Three', 'spotify:track:Four'])
        })

        it('one playlist for each in separate mode, each with its address', async () => {
            connect()

            const report = await exportAs('separate')

            expect(report.created.map(p => [p.name, p.url])).toEqual([
                ['Road trip - Greatest Hits', 'https://open.spotify.com/playlist/pl-1'],
                ['Road trip - Deep Cuts', 'https://open.spotify.com/playlist/pl-2']
            ])
            expect(api.created.map(p => p.uris.length)).toEqual([2, 2])
        })

        it('uses the Spotify address a track already carries and searches only for the others', async () => {
            connect()
            const playlists = [{ name: 'Mix', tracks: [track('Unknown here', { spotifyUri: 'spotify:track:kept' }), track('Other', { spotifyId: 'abc' }), track('One')] }]

            const report = await exportAs('merge', playlists)

            expect(api.created[0].uris).toEqual(['spotify:track:kept', 'spotify:track:abc', 'spotify:track:One'])
            expect(api.calls.filter(call => call === 'GET /search')).toHaveLength(1)
            expect(report.matchCount).toBe(3)
        })

        it('says which tracks were not found and does not create a playlist with none', async () => {
            connect()
            const onNotFound = vi.fn()
            const playlists = [PLAYLISTS[0], { name: 'Ghosts', tracks: [track('Nowhere')] }]

            const report = await exportAs('separate', playlists, { ...noCallbacks, onNotFound })

            expect(onNotFound).toHaveBeenCalledWith({ title: 'Nowhere', artist: 'Artist', playlist: 'Ghosts' })
            expect(report.created.map(p => p.name)).toEqual(['Road trip - Greatest Hits'])
            expect(report.empty).toEqual(['Road trip - Ghosts'])
            expect(report.failure).toBeNull()
        })

        it('reports a failure of Spotify in the middle with what was created and what was not', async () => {
            connect()
            let creations = 0
            api.failures.push({
                match: (method, path) => method === 'POST' && path === '/users/me/playlists' && ++creations === 2,
                response: json(500, { error: { message: 'Server error' } })
            })

            const report = await exportAs('separate')

            expect(report.failure).toEqual({ kind: 'error', detail: 'Server error' })
            expect(report.created.map(p => p.name)).toEqual(['Road trip - Greatest Hits'])
            expect(report.notCreated).toEqual(['Road trip - Deep Cuts'])
        })

        it('says when nothing at all was found', async () => {
            connect()

            const report = await exportAs('merge', [{ name: 'Ghosts', tracks: [track('Nowhere')] }])

            expect(report.failure).toEqual({ kind: 'not-found' })
            expect(api.created).toEqual([])
        })
    })

    describe('exporting again in the same session', () => {
        it('does not create again what was created: it says it is already there', async () => {
            connect()
            await exportAs('separate')

            const again = await exportAs('separate')

            expect(api.created).toHaveLength(2)
            expect(again.created.map(p => p.alreadyThere)).toEqual([true, true])
            expect(again.created[0].url).toBe('https://open.spotify.com/playlist/pl-1')
        })

        it('after a failure creates only what was missing', async () => {
            connect()
            let creations = 0
            api.failures.push({
                match: (method, path) => method === 'POST' && path === '/users/me/playlists' && ++creations === 2,
                response: json(500, {})
            })
            await exportAs('separate')

            const again = await exportAs('separate')

            expect(api.created.map(p => p.name)).toEqual(['Road trip - Greatest Hits', 'Road trip - Deep Cuts'])
            expect(again.created.map(p => p.alreadyThere)).toEqual([true, false])
            expect(again.failure).toBeNull()
        })

        it('finishes a playlist that was created but did not get its tracks, without creating another', async () => {
            connect()
            api.failures.push({ match: (method, path) => method === 'POST' && /\/tracks$/.test(path), response: json(500, {}) })
            const first = await exportAs('merge')
            expect(first.incomplete).toEqual([{ name: 'Road trip', url: 'https://open.spotify.com/playlist/pl-1', tracks: 0, total: 4 }])

            const again = await exportAs('merge')

            expect(api.created).toHaveLength(1)
            expect(api.created[0].uris).toHaveLength(4)
            expect(again.created).toEqual([expect.objectContaining({ name: 'Road trip', tracks: 4, alreadyThere: false })])
        })

        it('creates a new one when the playlist changed (another name or other tracks)', async () => {
            connect()
            await exportAs('merge')

            await exportAs('merge', [{ ...PLAYLISTS[0], tracks: [track('One')] }])

            expect(api.created).toHaveLength(2)
        })
    })

    describe('when Spotify refuses the account (F97, UAT-302)', () => {
        const refusal = () => json(403, { error: { status: 403, message: 'Check settings on developer.spotify.com/dashboard, the user may not be registered.' } })
        const isSearch = (method, path) => path.startsWith('/search')

        it('a 403 is a refusal with a name, not any failure', async () => {
            connect()
            api.always.push({ match: isSearch, answer: refusal })

            await expect(SpotifyService.searchTrack('One', 'Artist')).rejects.toBeInstanceOf(SpotifyRefusedError)
        })

        it('stops at the first refused search and says so: never "tracks not found" (REQ-01)', async () => {
            connect()
            api.always.push({ match: isSearch, answer: refusal })
            const onNotFound = vi.fn()

            const report = await exportAs('separate', PLAYLISTS, { ...noCallbacks, onNotFound })

            expect(report.failure).toEqual({ kind: 'refused' })
            expect(onNotFound).not.toHaveBeenCalled()
            expect(report.empty).toEqual([])
            expect(report.notCreated).toEqual(['Road trip - Greatest Hits', 'Road trip - Deep Cuts'])
            expect(api.calls.filter(call => call === 'GET /search')).toHaveLength(1)
            expect(api.created).toEqual([])
        })

        it('a 403 when the playlist is created is the same refusal (REQ-01)', async () => {
            connect()
            api.always.push({ match: (method, path) => method === 'POST' && path === '/users/me/playlists', answer: refusal })

            const report = await exportAs('merge')

            expect(report.failure.kind).toBe('refused')
            expect(report.notCreated).toEqual(['Road trip'])
        })
    })

    describe('a search that failed is not a track that was not found (F97, REQ-02)', () => {
        const searchOf = (title) => (method, path) => path.startsWith('/search') && decodeURIComponent(path).replace(/\+/g, ' ').includes(`track:${title} `)

        it.each([
            ['a 500 of Spotify', () => json(500, { error: { message: 'Server error' } })],
            ['the network down', () => { throw new TypeError('Failed to fetch') }]
        ])('%s: the track is counted as not checked, and the rest is exported', async (label, answer) => {
            connect()
            api.always.push({ match: searchOf('Two'), answer })
            const onNotFound = vi.fn()
            const onUnchecked = vi.fn()
            const playlists = [{ name: 'Mix', title: 'Mix', tracks: [track('One'), track('Two'), track('Nowhere')] }]

            const report = await exportAs('merge', playlists, { ...noCallbacks, onNotFound, onUnchecked })

            expect(report.unchecked).toBe(1)
            expect(onUnchecked).toHaveBeenCalledWith({ title: 'Two', artist: 'Artist', playlist: 'Mix' })
            expect(onNotFound).toHaveBeenCalledTimes(1)
            expect(onNotFound).toHaveBeenCalledWith({ title: 'Nowhere', artist: 'Artist', playlist: 'Mix' })
            expect(report.failure).toBeNull()
            expect(api.created[0].uris).toEqual(['spotify:track:One'])
        })

        it('a playlist none of whose tracks could be checked is "not created", never "no track found"', async () => {
            connect()
            api.always.push({ match: searchOf('Three'), answer: () => json(503, {}) }, { match: searchOf('Four'), answer: () => json(503, {}) })

            const report = await exportAs('separate')

            expect(report.created.map(p => p.name)).toEqual(['Road trip - Greatest Hits'])
            expect(report.empty).toEqual([])
            expect(report.notCreated).toEqual(['Road trip - Deep Cuts'])
            expect(report.unchecked).toBe(2)
        })

        it('when nothing could be checked the export says that, not that nothing was found (REQ-03)', async () => {
            connect()
            api.always.push({ match: (method, path) => path.startsWith('/search'), answer: () => json(500, { error: { message: 'Server error' } }) })
            const onNotFound = vi.fn()

            const report = await exportAs('merge', PLAYLISTS, { ...noCallbacks, onNotFound })

            expect(report.failure).toEqual({ kind: 'unchecked' })
            expect(report.unchecked).toBe(4)
            expect(onNotFound).not.toHaveBeenCalled()
            expect(report.empty).toEqual([])
            expect(report.notCreated).toEqual(['Road trip'])
            expect(api.created).toEqual([])
        })

        it('a track is "not found" only when Spotify answered and had none', async () => {
            connect()

            const report = await exportAs('merge', [{ name: 'Ghosts', tracks: [track('Nowhere')] }])

            expect(report.unchecked).toBe(0)
            expect(report.failure).toEqual({ kind: 'not-found' })
            expect(report.empty).toEqual(['Road trip'])
        })
    })

    describe('the export writes no sentence of its own (F98, UAT-308, REQ-06)', () => {
        it('the progress is told in stages and names, for the window to say in its language', async () => {
            connect()
            const told = []

            await exportAs('merge', [{ name: 'Mix', tracks: [track('One')] }], { onProgress: (...args) => told.push(args) })

            expect(told).toEqual([
                ['MATCHING', 1, 1, { title: 'One' }],
                ['CREATING', 1, 1, { name: 'Road trip' }],
                ['ADDING', 0, 1, { name: 'Road trip', count: 1 }]
            ])
        })

        it('no failure carries a sentence: a kind, and what Spotify itself said when it said something', async () => {
            connect({ expiresIn: -HOUR, refresh: null })
            expect(Object.keys((await exportAs('merge')).failure)).toEqual(['kind'])
        })
    })

    it('refuses an export with nothing to export', async () => {
        connect()
        await expect(exportAs('merge', [])).rejects.toThrow('No playlists to export')
    })
})
