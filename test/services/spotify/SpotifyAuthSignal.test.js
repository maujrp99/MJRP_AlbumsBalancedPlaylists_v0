import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// the login of the app is Firebase's: the shell is drawn without it here (the Spotify session is the real one, over a small storage)
vi.mock('../../../public/js/services/auth/signIn.js', async () => ({ authService: (await import('../../support/shellScenarios.js')).stand.login }))

import { SpotifyAuthService } from '../../../public/js/services/SpotifyAuthService.js'
import { startOn } from '../../support/renderShell'

// UAT-182: after connecting, the top button kept saying «Connect» until a reload.
describe('Spotify session signal (UAT-182)', () => {
    beforeEach(() => {
        const kept = new Map()
        vi.stubGlobal('localStorage', {
            getItem: key => (kept.has(key) ? kept.get(key) : null),
            setItem: (key, value) => kept.set(key, String(value)),
            removeItem: key => kept.delete(key),
            clear: () => kept.clear()
        })
        document.body.innerHTML = ''
    })

    afterEach(() => { document.body.innerHTML = '' })

    // the button of the top bar of the shell (React, F83 wave 3): it reads the session when it appears and at each signal of the window
    const mount = () => document.getElementById('spotify-connect-desktop')

    it('announces the session change when a session is stored', () => {
        const heard = vi.fn()
        window.addEventListener('spotify-auth-change', heard)
        SpotifyAuthService.setSession({ access_token: 't', refresh_token: 'r', expires_in: 3600 })
        window.removeEventListener('spotify-auth-change', heard)
        expect(heard).toHaveBeenCalledTimes(1)
    })

    it('announces the session change on logout', () => {
        const heard = vi.fn()
        window.addEventListener('spotify-auth-change', heard)
        SpotifyAuthService.logout()
        window.removeEventListener('spotify-auth-change', heard)
        expect(heard).toHaveBeenCalledTimes(1)
    })

    it('the button drawn as «Connect» turns «Connected», with the account name, when the session arrives', async () => {
        const profile = vi.spyOn(SpotifyAuthService, 'getUserProfile').mockResolvedValue({ display_name: 'Mau' })
        const shell = await startOn('/start')
        expect(document.getElementById('spotifyLoginBtn')).not.toBeNull()

        await shell.act(async () => { SpotifyAuthService.setSession({ access_token: 't', refresh_token: 'r', expires_in: 3600 }) })
        await vi.waitFor(() => expect(mount().textContent).toContain('Mau'))

        expect(document.getElementById('spotifyLoginBtn')).toBeNull()
        expect(mount().textContent).toContain('Connected')
        profile.mockRestore()
        shell.stop()
    })

    it('the button goes back to «Connect» on logout', async () => {
        vi.spyOn(SpotifyAuthService, 'getUserProfile').mockResolvedValue({ display_name: 'Mau' })
        SpotifyAuthService.setSession({ access_token: 't', refresh_token: 'r', expires_in: 3600 })
        const shell = await startOn('/start')
        expect(document.getElementById('spotifyLoginBtn')).toBeNull()
        await shell.act(async () => { SpotifyAuthService.logout() })
        expect(document.getElementById('spotifyLoginBtn')).not.toBeNull()
        vi.restoreAllMocks()
        shell.stop()
    })

    it('the X asks in the app\'s own dialog, not in the browser\'s confirm(), and disconnects on yes (UAT-183)', async () => {
        vi.spyOn(SpotifyAuthService, 'getUserProfile').mockResolvedValue({ display_name: 'Mau' })
        const native = vi.fn(() => false)
        vi.stubGlobal('confirm', native)
        SpotifyAuthService.setSession({ access_token: 't', refresh_token: 'r', expires_in: 3600 })
        const shell = await startOn('/start')

        await shell.act(async () => { document.getElementById('spotifyLogoutBtn').click() })
        await vi.waitFor(() => expect(document.body.textContent).toContain('Disconnect from Spotify?'))
        expect(native).not.toHaveBeenCalled()

        const yes = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Disconnect')
        await shell.act(async () => { yes.click() })
        await vi.waitFor(() => expect(document.getElementById('spotifyLoginBtn')).not.toBeNull())
        expect(SpotifyAuthService.isAuthenticated()).toBe(false)
        vi.restoreAllMocks()
        shell.stop()
    })
})
