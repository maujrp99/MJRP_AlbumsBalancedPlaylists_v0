import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SpotifyAuthService } from '../../../public/js/services/SpotifyAuthService.js'
import { SpotifyConnectButton } from '../../../public/js/components/SpotifyConnectButton.js'

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
        document.body.innerHTML = '<div id="spotify-mount"></div>'
    })

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
        const button = new SpotifyConnectButton('spotify-mount')
        expect(document.getElementById('spotifyLoginBtn')).not.toBeNull()

        SpotifyAuthService.setSession({ access_token: 't', refresh_token: 'r', expires_in: 3600 })
        await vi.waitFor(() => expect(button.userProfile).toEqual({ display_name: 'Mau' }))

        expect(document.getElementById('spotifyLoginBtn')).toBeNull()
        expect(document.getElementById('spotify-mount').textContent).toContain('Connected')
        expect(document.getElementById('spotify-mount').textContent).toContain('Mau')
        profile.mockRestore()
    })

    it('the button goes back to «Connect» on logout', () => {
        vi.spyOn(SpotifyAuthService, 'getUserProfile').mockResolvedValue({ display_name: 'Mau' })
        SpotifyAuthService.setSession({ access_token: 't', refresh_token: 'r', expires_in: 3600 })
        new SpotifyConnectButton('spotify-mount')
        SpotifyAuthService.logout()
        expect(document.getElementById('spotifyLoginBtn')).not.toBeNull()
        vi.restoreAllMocks()
    })

    it('the X asks in the app\'s own dialog, not in the browser\'s confirm(), and disconnects on yes (UAT-183)', async () => {
        vi.spyOn(SpotifyAuthService, 'getUserProfile').mockResolvedValue({ display_name: 'Mau' })
        const native = vi.fn(() => false)
        vi.stubGlobal('confirm', native)
        SpotifyAuthService.setSession({ access_token: 't', refresh_token: 'r', expires_in: 3600 })
        new SpotifyConnectButton('spotify-mount')

        document.getElementById('spotifyLogoutBtn').click()
        await vi.waitFor(() => expect(document.body.textContent).toContain('Disconnect from Spotify?'))
        expect(native).not.toHaveBeenCalled()

        const yes = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Disconnect')
        yes.click()
        await vi.waitFor(() => expect(document.getElementById('spotifyLoginBtn')).not.toBeNull())
        expect(SpotifyAuthService.isAuthenticated()).toBe(false)
        vi.restoreAllMocks()
    })
})
