/**
 * F63 (UAT-13), F88 - the account panel opens with a tap or a click and with the keyboard, not only
 * with the mouse over it; it closes on a click outside and on Escape, and says its state
 * (aria-expanded). Since F88 it is ONE panel (a dialog) for who is signed in and for who is not: who
 * is in, the connections, the cache, sign out.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/services/auth/signIn.js', () => ({ authService: { logout: vi.fn(async () => { }) } }))
vi.mock('../../public/js/services/SpotifyAuthService.js', () => ({ SpotifyAuthService: { logout: vi.fn() } }))
vi.mock('../../public/js/components/LoginModal.js', () => ({ showLoginModal: vi.fn() }))
vi.mock('../../public/js/components/Toast.js', () => ({ default: { success: vi.fn(), error: vi.fn() } }))
vi.mock('../../public/js/components/Icons.js', () => ({ getIcon: () => '' }))
vi.mock('../../public/js/utils/reloadApp.js', () => ({ reloadApp: vi.fn() }))
const connectionCheck = vi.hoisted(() => vi.fn())
const connections = vi.hoisted(() => ({ mountConnections: vi.fn(() => ({ destroy: vi.fn(), check: connectionCheck })), realConnections: vi.fn(() => ({})) }))
vi.mock('../../public/js/components/navigation/connections.js', () => connections)

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
        expect(trigger().getAttribute('aria-haspopup')).toBe('dialog')
        expect(trigger().getAttribute('aria-controls')).toBe('userMenu')
        expect(menu().getAttribute('role')).toBe('dialog')
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

    it('a click in a window the panel opened (the «Disconnect from…?» question) does not close the panel (judge P2-5)', () => {
        trigger().click()
        document.body.insertAdjacentHTML('beforeend', '<div class="app-modal"><div role="dialog"><button id="confirmDisconnect">Disconnect</button></div></div>')
        document.getElementById('confirmDisconnect').click()
        expect(isOpen()).toBe(true)
        document.querySelector('.app-modal').remove()
    })

    it('Escape closes it and gives the focus back to the avatar', () => {
        trigger().click()
        document.getElementById('logoutBtn').focus()

        press('Escape')

        expect(isOpen()).toBe(false)
        expect(document.activeElement).toBe(trigger())
    })

    it('Arrow Down on the avatar opens it with the focus on the first control inside', () => {
        trigger().focus()

        press('ArrowDown', trigger())

        expect(isOpen()).toBe(true)
        expect(document.activeElement).toBe(menu().querySelector('button'))
        expect(menu().contains(document.activeElement)).toBe(true)
    })

    it('holds the connections of Spotify and Apple Music, and asks them to draw into the panel', () => {
        expect(document.getElementById('accountConnections')).not.toBeNull()
        expect(connections.mountConnections).toHaveBeenCalledWith(document.getElementById('accountConnections'), expect.any(Object))
    })

    it('asks the connections for their true state when the panel opens, not before (nothing heavier at load)', () => {
        connectionCheck.mockClear()
        expect(connectionCheck).not.toHaveBeenCalled()
        trigger().click()
        expect(connectionCheck).toHaveBeenCalledTimes(1)
        trigger().click()
        trigger().click()
        expect(connectionCheck).toHaveBeenCalledTimes(2)
    })

    it('says who is signed in, and has Sign Out inside the panel', () => {
        expect(menu().textContent).toContain('Ana')
        expect(menu().querySelector('#logoutBtn')).not.toBeNull()
    })

    it('drawn again (the session changed), it still answers once per tap', () => {
        draw()
        draw()

        trigger().click()
        expect(isOpen()).toBe(true)

        document.getElementById('elsewhere').click()
        expect(isOpen()).toBe(false)
    })

    it('with nobody signed in the panel is still there for the connections: no Sign Out, a way to sign in', () => {
        nav.updateState({ currentUser: null, loading: false })
        draw()

        expect(trigger().getAttribute('aria-label')).toBe('Connections')
        expect(document.getElementById('loginBtn')).not.toBeNull()
        expect(menu().querySelector('#logoutBtn')).toBeNull()
        expect(document.getElementById('accountConnections')).not.toBeNull()
        trigger().click()
        expect(isOpen()).toBe(true)
        press('Escape')
        expect(isOpen()).toBe(false)
        document.getElementById('elsewhere').click()
    })

    it('the panel offers to clear the album cache, and asks first (the caller hands in how)', () => {
        const clearCaches = vi.fn()
        nav = new AuthNav(USER, { clearCaches })
        draw()
        trigger().click()
        document.getElementById('panelClearCache').click()

        expect(isOpen()).toBe(false)
        expect(clearCaches).not.toHaveBeenCalled()
        expect(document.getElementById('phone-clear-cache')).not.toBeNull()
    })

    describe('the closed button never states what it does not know (judge P1-1)', () => {
        const summarize = (summary) => connections.mountConnections.mock.calls.at(-1)[1].onSummary(summary)
        const label = () => trigger().getAttribute('aria-label')
        const dots = () => [...document.querySelectorAll('.top-acct__dot')].map(d => d.className)

        it('Apple Music still pending: no «Nothing connected», no dot for it, a neutral label', () => {
            summarize({ spotify: false, apple: null })
            expect(label()).toBe('Account and connections')
            expect(dots()).toEqual([])
            expect(trigger().dataset.apple).toBe('pending')
        })

        it('pending, with Spotify connected: says only what it knows', () => {
            summarize({ spotify: true, apple: null })
            expect(label()).toBe('Account and connections: Spotify connected')
            expect(dots()).toHaveLength(1)
        })

        it('known and connected: the dot and the name', () => {
            summarize({ spotify: false, apple: true })
            expect(label()).toBe('Account and connections: Apple Music connected')
            expect(dots()).toEqual(['top-acct__dot top-acct__dot--apple'])
        })

        it('both known and absent: only then «Nothing connected»', () => {
            summarize({ spotify: false, apple: false })
            expect(label()).toBe('Account and connections: Nothing connected')
            expect(dots()).toEqual([])
        })
    })
})
