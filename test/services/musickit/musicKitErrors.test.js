/**
 * F98 (UAT-307) - what MusicKit throws is told apart: Apple Music refusing the person (no subscription, an authorization that was revoked
 * or expired, 401/403 of the API) has a name; a search that failed is a failure, never «the catalogue has none».
 *
 * MusicKit is a stand-in: the instance `musicKitAuth.init()` gives is made here, so nothing reaches Apple. What it does NOT prove: what the
 * real SDK throws for a real refused account (the classification reads the error code, the status and the words, with slack).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AppleMusicRefusedError, AppleMusicAuthorizationError, isRefusal, namedError } from '../../../public/js/services/musickit/musicKitErrors.js'
import { musicKitAuth } from '../../../public/js/services/musickit/MusicKitAuth.js'
import { musicKitCatalog } from '../../../public/js/services/musickit/MusicKitCatalog.js'
import { musicKitLibrary } from '../../../public/js/services/musickit/MusicKitLibrary.js'

const withStatus = (status, message = 'x') => Object.assign(new Error(message), { status })

describe('telling a refusal of Apple Music from any failure (F98)', () => {
    it.each([
        ['a 401 of the API', withStatus(401)],
        ['a 403 of the API', withStatus(403)],
        ['a 403 kept in the response', Object.assign(new Error('x'), { response: { status: 403 } })],
        ['MusicKit: ACCESS_DENIED', Object.assign(new Error('x'), { errorCode: 'ACCESS_DENIED' })],
        ['MusicKit: AUTHORIZATION_ERROR', Object.assign(new Error('x'), { errorCode: 'AUTHORIZATION_ERROR' })],
        ['MusicKit: UNAUTHORIZED_ERROR', Object.assign(new Error('x'), { name: 'UNAUTHORIZED_ERROR' })],
        ['MusicKit: SUBSCRIPTION_ERROR', Object.assign(new Error('x'), { errorCode: 'SUBSCRIPTION_ERROR' })],
        ['MusicKit: TOKEN_EXPIRED', Object.assign(new Error('x'), { errorCode: 'TOKEN_EXPIRED' })],
        ['the words of a 403', new Error('Request failed: 403 Forbidden')]
    ])('%s is a refusal', (_what, error) => {
        expect(isRefusal(error)).toBe(true)
        expect(namedError(error)).toBeInstanceOf(AppleMusicRefusedError)
    })

    it.each([
        ['a 500', withStatus(500)],
        ['a 429', withStatus(429)],
        ['a 404', withStatus(404)],
        ['the network down', new TypeError('Failed to fetch')],
        ['MusicKit: NETWORK_ERROR', Object.assign(new Error('x'), { errorCode: 'NETWORK_ERROR' })],
        ['nothing at all', undefined]
    ])('%s is not a refusal: the error stays what it was', (_what, error) => {
        expect(isRefusal(error)).toBe(false)
        expect(namedError(error)).toBe(error)
    })

    it('the refusal keeps what Apple said, for the console, and is an Error', () => {
        const refused = namedError(withStatus(403, 'Forbidden'))
        expect(refused).toBeInstanceOf(Error)
        expect(refused.name).toBe('AppleMusicRefusedError')
        expect(refused.detail).toBe('Forbidden')
    })

    it('a refusal that already has its name is not wrapped again', () => {
        const refused = new AppleMusicRefusedError('once')
        expect(namedError(refused)).toBe(refused)
    })
})

describe('the calls the export makes to MusicKit (F98)', () => {
    let music
    beforeEach(() => {
        vi.restoreAllMocks()
        music = { api: { music: vi.fn() }, authorize: vi.fn(), musicUserToken: 'stand-in' }
        musicKitAuth.music = music
        musicKitAuth.isAuthorized = false
        vi.spyOn(musicKitAuth, 'init').mockResolvedValue(music)
        vi.spyOn(console, 'error').mockImplementation(() => { })
        vi.spyOn(console, 'log').mockImplementation(() => { })
        vi.spyOn(console, 'warn').mockImplementation(() => { })
    })

    describe('the search of a track in the catalogue: three answers (REQ-01)', () => {
        const songs = (...ids) => ({ data: { results: { songs: { data: ids.map(id => ({ id, attributes: { name: `Song ${id}` } })) } } } })
        const none = { data: { results: {} } }

        it('found: the track', async () => {
            music.api.music.mockResolvedValue(songs('11'))
            expect((await musicKitCatalog.findTrackFromAlbum('One', 'Artist', 'Album')).id).toBe('11')
        })

        it('the catalogue has none: null, after Apple answered the two searches', async () => {
            music.api.music.mockResolvedValue(none)
            expect(await musicKitCatalog.findTrackFromAlbum('One', 'Artist', 'Album')).toBeNull()
            expect(music.api.music).toHaveBeenCalledTimes(2)
        })

        it('could not check: a search that failed is thrown, never answered as «none»', async () => {
            music.api.music.mockRejectedValue(withStatus(500, 'Search unavailable'))
            await expect(musicKitCatalog.findTrackFromAlbum('One', 'Artist', 'Album')).rejects.toThrow('Search unavailable')
        })

        it('could not check: the second search (by title and artist alone) failing is thrown too', async () => {
            music.api.music.mockResolvedValueOnce(none).mockRejectedValueOnce(new TypeError('Failed to fetch'))
            await expect(musicKitCatalog.findTrackFromAlbum('One', 'Artist', 'Album')).rejects.toThrow('Failed to fetch')
        })

        it('a 403 on the search is the refusal with its name', async () => {
            music.api.music.mockRejectedValue(withStatus(403, 'Forbidden'))
            await expect(musicKitCatalog.findTrackFromAlbum('One', 'Artist', 'Album')).rejects.toBeInstanceOf(AppleMusicRefusedError)
        })
    })

    describe('the authorization', () => {
        it('not given (the person closed or denied Apple\'s window): an error with its name', async () => {
            music.authorize.mockRejectedValue(new Error('The user denied authorization'))
            await expect(musicKitAuth.authorize()).rejects.toBeInstanceOf(AppleMusicAuthorizationError)
        })
    })

    describe('the folder', () => {
        beforeEach(() => { musicKitAuth.isAuthorized = true })

        it('a refusal while reading the folders stops the export: it is thrown with its name', async () => {
            music.api.music.mockRejectedValue(withStatus(403, 'Forbidden'))
            await expect(musicKitLibrary.createOrGetFolder('Road trip')).rejects.toBeInstanceOf(AppleMusicRefusedError)
        })

        it('any other failure is still «no folder»: the playlists go to the top of the library', async () => {
            music.api.music.mockRejectedValue(withStatus(500, 'Folders unavailable'))
            expect(await musicKitLibrary.createOrGetFolder('Road trip')).toBeNull()
        })
    })

    describe('creating the playlist', () => {
        beforeEach(() => { musicKitAuth.isAuthorized = true })

        it('a 403 (no subscription, an authorization that was revoked) is the refusal with its name', async () => {
            music.api.music.mockRejectedValue(withStatus(403, 'Forbidden'))
            await expect(musicKitLibrary.createPlaylistInFolder('Mix', ['1'], null)).rejects.toBeInstanceOf(AppleMusicRefusedError)
        })

        it('any other failure is thrown as it came', async () => {
            music.api.music.mockRejectedValue(withStatus(500, 'Apple Music said no'))
            await expect(musicKitLibrary.createPlaylistInFolder('Mix', ['1'], null)).rejects.toThrow('Apple Music said no')
        })
    })
})
