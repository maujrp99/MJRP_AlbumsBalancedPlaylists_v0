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
})
