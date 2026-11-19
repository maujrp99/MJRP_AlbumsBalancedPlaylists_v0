/**
 * F59 (UAT-28) - signing out of the app also ends the Spotify session kept in the browser: the
 * tokens belong to the person who is leaving.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const auth = vi.hoisted(() => ({ logout: vi.fn(async () => { }) }))
const spotify = vi.hoisted(() => ({ logout: vi.fn() }))
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

vi.mock('@shared/services/AuthService.js', () => ({ authService: auth }))
vi.mock('../../public/js/services/SpotifyAuthService.js', () => ({ SpotifyAuthService: spotify }))
vi.mock('../../public/js/components/LoginModal.js', () => ({ showLoginModal: vi.fn() }))
vi.mock('../../public/js/components/Toast.js', () => ({ default: toast }))
vi.mock('../../public/js/components/Icons.js', () => ({ getIcon: () => '' }))

import { AuthNav } from '../../public/js/components/navigation/AuthNav.js'

describe('AuthNav sign-out (F59)', () => {
    beforeEach(() => {
        document.body.innerHTML = '<button id="logoutBtn"></button>'
        auth.logout.mockClear(); spotify.logout.mockClear(); toast.success.mockClear(); toast.error.mockClear()
    })

    it('ends the Spotify session together with the account session', async () => {
        new AuthNav({}).attachListeners()
        document.getElementById('logoutBtn').click()

        await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith('Signed out successfully'))
        expect(auth.logout).toHaveBeenCalledTimes(1)
        expect(spotify.logout).toHaveBeenCalledTimes(1)
    })

    it('keeps the Spotify session when signing out of the account fails', async () => {
        auth.logout.mockRejectedValueOnce(new Error('offline'))
        new AuthNav({}).attachListeners()
        document.getElementById('logoutBtn').click()

        await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith('Sign out failed'))
        expect(spotify.logout).not.toHaveBeenCalled()
    })
})
