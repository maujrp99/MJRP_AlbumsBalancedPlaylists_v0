/**
 * F59 (UAT-28) - signing out of the app also ends the Spotify session kept in the browser: the
 * tokens belong to the person who is leaving.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const auth = vi.hoisted(() => ({ logout: vi.fn(async () => { }) }))
const spotify = vi.hoisted(() => ({ logout: vi.fn() }))
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

vi.mock('@/services/auth/signIn.js', () => ({ authService: auth }))
vi.mock('../../public/js/services/SpotifyAuthService.js', () => ({ SpotifyAuthService: spotify }))
vi.mock('../../public/js/components/LoginModal.js', () => ({ showLoginModal: vi.fn() }))
vi.mock('../../public/js/components/Toast.js', () => ({ default: toast }))
vi.mock('../../public/js/components/Icons.js', () => ({ getIcon: () => '' }))
const reload = vi.hoisted(() => ({ reloadApp: vi.fn() }))
vi.mock('../../public/js/utils/reloadApp.js', () => reload)

import { AuthNav } from '../../public/js/components/navigation/AuthNav.js'

describe('AuthNav sign-out (F59)', () => {
    beforeEach(() => {
        document.body.innerHTML = '<button id="logoutBtn"></button>'
        auth.logout.mockClear(); spotify.logout.mockClear(); toast.success.mockClear(); toast.error.mockClear(); reload.reloadApp.mockClear()
    })

    it('ends the Spotify session together with the account session', async () => {
        new AuthNav({}).attachListeners()
        document.getElementById('logoutBtn').click()

        await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith('Signed out successfully'))
        expect(auth.logout).toHaveBeenCalledTimes(1)
        expect(spotify.logout).toHaveBeenCalledTimes(1)
    })

    it('reloads the app after signing out, so nothing of the person who left stays on screen (decision of 2026-11-19)', async () => {
        new AuthNav({}).attachListeners()
        document.getElementById('logoutBtn').click()

        await vi.waitFor(() => expect(reload.reloadApp).toHaveBeenCalledTimes(1))
        expect(auth.logout).toHaveBeenCalledTimes(1)
    })

    it('keeps the Spotify session when signing out of the account fails', async () => {
        auth.logout.mockRejectedValueOnce(new Error('offline'))
        new AuthNav({}).attachListeners()
        document.getElementById('logoutBtn').click()

        await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith('Sign out failed'))
        expect(spotify.logout).not.toHaveBeenCalled()
        expect(reload.reloadApp).not.toHaveBeenCalled()
    })
})
