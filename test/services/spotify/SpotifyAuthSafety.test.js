/**
 * F59 - the way back from Spotify is checked: a return whose `state` is not the one this browser
 * sent is refused before anything is asked of Spotify, and the secrets of the handshake come
 * from the browser's cryptographic generator.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SpotifyAuthService } from '../../../public/js/services/SpotifyAuthService.js'

const goTo = (search) => window.history.replaceState({}, '', '/callback' + search)

describe('Spotify sign-in safety (F59)', () => {
    let fetchSpy

    beforeEach(() => {
        fetchSpy = vi.fn(async () => ({ ok: true, json: async () => ({ access_token: 't', refresh_token: 'r', expires_in: 3600 }) }))
        vi.stubGlobal('fetch', fetchSpy)
        localStorage.setItem('spotify_auth_state', 'sent-state')
        localStorage.setItem('spotify_code_verifier', 'verifier')
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        window.history.replaceState({}, '', '/')
    })

    it('refuses a return whose state is not the one that was sent, and asks Spotify for nothing', async () => {
        goTo('?code=abc&state=someone-elses')

        expect(await SpotifyAuthService.handleCallback()).toBe(false)
        expect(fetchSpy).not.toHaveBeenCalled()
        expect(SpotifyAuthService.isAuthenticated()).toBe(false)
    })

    it('refuses a return with no state at all', async () => {
        goTo('?code=abc')

        expect(await SpotifyAuthService.handleCallback()).toBe(false)
        expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('accepts the return that carries the state it sent', async () => {
        goTo('?code=abc&state=sent-state')

        expect(await SpotifyAuthService.handleCallback()).toBe(true)
        expect(fetchSpy).toHaveBeenCalledTimes(1)
        expect(SpotifyAuthService.isAuthenticated()).toBe(true)
    })

    it('a refused return leaves no handshake secret behind', async () => {
        goTo('?code=abc&state=someone-elses')
        await SpotifyAuthService.handleCallback()

        expect(localStorage.getItem('spotify_auth_state')).toBeNull()
        expect(localStorage.getItem('spotify_code_verifier')).toBeNull()
    })

    it('draws the random text from the cryptographic generator, never from Math.random', () => {
        const weak = vi.spyOn(Math, 'random')
        const strong = vi.spyOn(globalThis.crypto, 'getRandomValues')

        const text = SpotifyAuthService.generateRandomString(128)

        expect(text).toMatch(/^[A-Za-z0-9]{128}$/)
        expect(strong).toHaveBeenCalled()
        expect(weak).not.toHaveBeenCalled()
        expect(SpotifyAuthService.generateRandomString(128)).not.toBe(text)
    })
})
