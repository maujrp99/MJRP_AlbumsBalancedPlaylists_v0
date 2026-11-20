/**
 * F63 (UAT-13) - the account menu opens with a tap or a click and with the keyboard, not only with
 * the mouse over it; it closes on a click outside and on Escape, and says its state (aria-expanded).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/services/auth/signIn.js', () => ({ authService: { logout: vi.fn(async () => { }) } }))
vi.mock('../../public/js/services/SpotifyAuthService.js', () => ({ SpotifyAuthService: { logout: vi.fn() } }))
vi.mock('../../public/js/components/LoginModal.js', () => ({ showLoginModal: vi.fn() }))
vi.mock('../../public/js/components/Toast.js', () => ({ default: { success: vi.fn(), error: vi.fn() } }))
vi.mock('../../public/js/components/Icons.js', () => ({ getIcon: () => '' }))
vi.mock('../../public/js/utils/reloadApp.js', () => ({ reloadApp: vi.fn() }))

import { AuthNav } from '../../public/js/components/navigation/AuthNav.js'

const USER = { currentUser: { isAnonymous: false, displayName: 'Ana', email: 'ana@example.test', photoURL: '/a.png' }, loading: false }

describe('AuthNav: the account menu (F63, UAT-13)', () => {
    let nav
    const trigger = () => document.getElementById('userMenuBtn')
    const menu = () => document.getElementById('userMenu')
    const isOpen = () => !menu().classList.contains('invisible')
    const press = (key, target = document) => target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
    const draw = () => {
        document.body.innerHTML = `<header>${nav.renderDesktop()}</header><main id="outside"><button id="elsewhere">x</button></main>`
        nav.attachListeners()
    }

    beforeEach(() => {
        nav = new AuthNav(USER)
        draw()
    })

    afterEach(() => {
        nav.detachListeners()
        document.body.innerHTML = ''
    })

    it('is drawn closed, and no longer depends on the mouse being over it', () => {
        expect(isOpen()).toBe(false)
        expect(trigger().getAttribute('aria-expanded')).toBe('false')
        expect(trigger().getAttribute('aria-haspopup')).toBe('menu')
        expect(trigger().getAttribute('aria-controls')).toBe('userMenu')
        expect(menu().getAttribute('role')).toBe('menu')
        expect(document.body.innerHTML).not.toContain('group-hover:visible')
    })

    it('a tap on the avatar opens it, another tap closes it', () => {
        trigger().click()
        expect(isOpen()).toBe(true)
        expect(trigger().getAttribute('aria-expanded')).toBe('true')

        trigger().click()
        expect(isOpen()).toBe(false)
        expect(trigger().getAttribute('aria-expanded')).toBe('false')
    })

    it('a click outside closes it; a click inside does not', () => {
        trigger().click()

        menu().querySelector('p').click()
        expect(isOpen()).toBe(true)

        document.getElementById('elsewhere').click()
        expect(isOpen()).toBe(false)
    })

    it('Escape closes it and gives the focus back to the avatar', () => {
        trigger().click()
        document.getElementById('logoutBtn').focus()

        press('Escape')

        expect(isOpen()).toBe(false)
        expect(document.activeElement).toBe(trigger())
    })

    it('Arrow Down on the avatar opens it with the focus on the first item', () => {
        trigger().focus()

        press('ArrowDown', trigger())

        expect(isOpen()).toBe(true)
        expect(document.activeElement).toBe(document.getElementById('logoutBtn'))
        expect(document.getElementById('logoutBtn').getAttribute('role')).toBe('menuitem')
    })

    it('drawn again (the session changed), it still answers once per tap', () => {
        draw()
        draw()

        trigger().click()
        expect(isOpen()).toBe(true)

        document.getElementById('elsewhere').click()
        expect(isOpen()).toBe(false)
    })

    it('with nobody signed in there is no menu, and nothing breaks on a click or a key', () => {
        nav.updateState({ currentUser: null, loading: false })
        draw()

        expect(trigger()).toBeNull()
        document.getElementById('elsewhere').click()
        press('Escape')
    })
})
