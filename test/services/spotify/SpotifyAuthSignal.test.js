import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// the login of the app is Firebase's: the shell is drawn without it here (the Spotify session is the real one, over a small storage)
vi.mock('../../../public/js/services/MusicKitService.js', async () => ({ musicKitService: (await import('../../support/shellScenarios.js')).stand.musicKit }))
vi.mock('../../../public/js/services/auth/signIn.js', async () => ({ authService: (await import('../../support/shellScenarios.js')).stand.login }))

import { SpotifyAuthService } from '../../../public/js/services/SpotifyAuthService.js'
import { startOn } from '../../support/renderShell'

// UAT-182: after connecting, the top button kept saying «Connect» until a reload. Since F88 the button is the Spotify row of the menu's connections.
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

    const row = () => document.querySelector('[data-connection="spotify"]')
    const status = () => row().querySelector('[data-status]').textContent

    it('the row drawn as «Not connected» turns «Connected», with the account name, when the session arrives', async () => {
        const profile = vi.spyOn(SpotifyAuthService, 'getUserProfile').mockResolvedValue({ display_name: 'Mau' })
        const shell = await startOn('/start')
        expect(status()).toBe('Not connected')

        await shell.act(async () => { SpotifyAuthService.setSession({ access_token: 't', refresh_token: 'r', expires_in: 3600 }) })
        await vi.waitFor(() => expect(status()).toBe('Connected as Mau'))
        expect(row().querySelector('button').getAttribute('aria-label')).toBe('Disconnect Spotify')
        profile.mockRestore()
        shell.stop()
    })

    it('the row goes back to «Not connected» on logout', async () => {
        vi.spyOn(SpotifyAuthService, 'getUserProfile').mockResolvedValue({ display_name: 'Mau' })
        SpotifyAuthService.setSession({ access_token: 't', refresh_token: 'r', expires_in: 3600 })
        const shell = await startOn('/start')
        expect(status()).toContain('Connected')
        await shell.act(async () => { SpotifyAuthService.logout() })
        expect(status()).toBe('Not connected')
        vi.restoreAllMocks()
        shell.stop()
    })

    it('Disconnect asks in the app\'s own dialog, not in the browser\'s confirm(), and disconnects on yes (UAT-183)', async () => {
        vi.spyOn(SpotifyAuthService, 'getUserProfile').mockResolvedValue({ display_name: 'Mau' })
        const native = vi.fn(() => false)
        vi.stubGlobal('confirm', native)
        SpotifyAuthService.setSession({ access_token: 't', refresh_token: 'r', expires_in: 3600 })
        const shell = await startOn('/start')

        await shell.act(async () => { row().querySelector('button').click() })
        await vi.waitFor(() => expect(document.body.textContent).toContain('Disconnect from Spotify?'))
        expect(native).not.toHaveBeenCalled()

        const yes = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Disconnect' && !b.closest('[data-connection]'))
        await shell.act(async () => { yes.click() })
        await vi.waitFor(() => expect(status()).toBe('Not connected'))
        expect(SpotifyAuthService.isAuthenticated()).toBe(false)
        vi.restoreAllMocks()
        shell.stop()
    })
})
