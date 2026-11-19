/**
 * UAT-12, decision of the MJRP on 2026-11-19: what a guest did is NOT carried to the account on
 * sign-in, and the sign-in dialog says so before the person chooses.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@shared/services/AuthService.js', () => ({ authService: { signInWithGoogle: vi.fn(), signInWithApple: vi.fn() } }))
vi.mock('../../public/js/components/Toast.js', () => ({ default: { success: vi.fn(), error: vi.fn() } }))
vi.mock('../../public/js/components/Icons.js', () => ({ getIcon: () => '' }))

import { showLoginModal } from '../../public/js/components/LoginModal.js'

describe('LoginModal guest notice (UAT-12)', () => {
    beforeEach(() => { document.body.innerHTML = '' })

    it('says, before signing in, that what was done as a guest is not carried to the account', () => {
        showLoginModal()
        const notice = document.querySelector('[data-guest-notice]')
        expect(notice).not.toBeNull()
        expect(notice.textContent).toMatch(/guest/i)
        expect(notice.textContent).toMatch(/not (be )?(copied|carried|moved)/i)
    })

    it('still offers the three ways in', () => {
        showLoginModal()
        expect(document.querySelector('#googleLoginBtn')).not.toBeNull()
        expect(document.querySelector('#appleLoginBtn')).not.toBeNull()
        expect(document.querySelector('[data-action="cancel"]')).not.toBeNull()
    })
})
