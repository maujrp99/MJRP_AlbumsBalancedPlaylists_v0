/**
 * F88 (REQ-01, REQ-02, REQ-04) - the top menu of the computer: the home's bar continues inside the app.
 * The mark leads to the home, the five stops are the destinations, the current screen is marked on
 * every route (and follows the router), the account and the connections are one panel, and the line
 * under the bar replaces the old Series dropdown. Nothing of the old bar (the drawer, the dropdown) is left.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/services/auth/signIn.js', () => ({ authService: { logout: vi.fn(async () => { }) } }))
vi.mock('../../public/js/services/SpotifyAuthService.js', () => ({ SpotifyAuthService: { logout: vi.fn() } }))
vi.mock('../../public/js/components/LoginModal.js', () => ({ showLoginModal: vi.fn() }))
vi.mock('../../public/js/components/Toast.js', () => ({ default: { success: vi.fn(), error: vi.fn() } }))
vi.mock('../../public/js/utils/reloadApp.js', () => ({ reloadApp: vi.fn() }))
vi.mock('../../public/js/components/navigation/connections.js', () => ({ mountConnections: vi.fn(() => ({ destroy: vi.fn(), check: vi.fn() })), realConnections: vi.fn(() => ({})) }))

import { userStore } from '../../public/js/stores/UserStore.js'
import { TopNav } from '../../public/js/components/TopNav.js'

const USER = { isAnonymous: false, displayName: 'Ana', email: 'ana@example.test', photoURL: '/a.png' }

describe('TopNav (F88)', () => {
    let nav
    const mount = (path, user = null) => {
        window.history.replaceState({}, '', path)
        userStore.setState?.({ currentUser: user, loading: false })
        nav = new TopNav({ clearCaches: vi.fn() })
        nav.userState = { currentUser: user, loading: false }
        nav.authNav.updateState(nav.userState)
        document.body.innerHTML = `<div id="header-container">${nav.render()}</div>`
        nav.attachListeners()
    }
    const current = () => [...document.querySelectorAll('nav.ms a[aria-current="page"]')].map(a => a.textContent.trim())

    beforeEach(() => { document.body.innerHTML = ''; vi.spyOn(console, 'log').mockImplementation(() => { }) })
    afterEach(() => { nav?.authNav.detachListeners(); vi.restoreAllMocks() })

    it('has the mark that leads to the home as a full page load, and nothing of the old bar', () => {
        mount('/start')
        const home = document.querySelector('a.top-menu__home')
        expect(home.getAttribute('href')).toBe('/home')
        expect(home.hasAttribute('data-full-page')).toBe(true)
        expect(home.getAttribute('aria-label')).toBe('The Album Blender, the entry page')
        expect(home.querySelector('img').getAttribute('src')).toMatch(/wordmark/)
        expect(document.body.innerHTML).not.toMatch(/mobileMenu|seriesDropdown|Music Series|The Blending Menu/)
    })

    it.each([
        ['/start', 'Create'], ['/albums', 'Albums'], ['/albums/abc', 'Albums'], ['/blend', 'Blend'],
        ['/saved-playlists', 'Playlists'], ['/playlist-series', 'Playlists'], ['/playlists', 'Playlists'], ['/inventory', 'Inventory']
    ])('on %s the current stop is %s', (path, label) => {
        mount(path)
        expect(current()).toEqual([label])
    })

    it('follows the router: the current stop and the line under the bar change with the screen, the panel keeps its state', () => {
        mount('/start', USER)
        expect(document.getElementById('top-menu-sub').children.length).toBe(0)
        document.getElementById('userMenuBtn').click()

        nav.followScreen('/albums')
        expect(current()).toEqual(['Albums'])
        expect(document.querySelector('#top-menu-sub nav').getAttribute('aria-label')).toBe('Albums')

        nav.followScreen('/saved-playlists')
        expect(current()).toEqual(['Playlists'])
        expect(document.querySelector('#top-menu-sub nav').getAttribute('aria-label')).toBe('Playlists')
        expect(document.getElementById('userMenuBtn').getAttribute('aria-expanded')).toBe('true')

        nav.followScreen('/blend')
        expect(document.getElementById('top-menu-sub').children.length).toBe(0)
    })

    it('signed out: «Sign In» and the connections button; no account name, no Sign Out', () => {
        mount('/albums')
        expect(document.getElementById('loginBtn').textContent.trim()).toBe('Sign In')
        expect(document.getElementById('userMenuBtn').getAttribute('aria-label')).toBe('Connections')
        expect(document.querySelector('[data-account-name]')).toBeNull()
        expect(document.getElementById('logoutBtn')).toBeNull()
    })

    it('signed in: the account button names the panel, which holds the name and Sign Out; no «Sign In»', () => {
        mount('/albums', USER)
        expect(document.getElementById('loginBtn')).toBeNull()
        expect(document.getElementById('userMenuBtn').getAttribute('aria-label')).toBe('Account and connections')
        expect(document.querySelector('[data-account-name]').textContent).toBe('Ana')
        expect(document.getElementById('logoutBtn')).not.toBeNull()
    })

    it('the account button shows the initial in orange, as the phone and the prototype do, never an image (judge P2-4)', () => {
        mount('/albums', { ...USER, photoURL: null })
        const initial = document.querySelector('#userMenuBtn .top-acct__initial')
        expect(initial.textContent).toBe('A')
        expect(document.querySelector('#userMenuBtn img')).toBeNull()
        mount('/albums', USER)
        expect(document.querySelector('#userMenuBtn .top-acct__initial').textContent).toBe('A')
        expect(document.querySelector('#userMenuBtn img')).toBeNull()
    })

    it('«Sign In» is the home\'s ghost button, not the app\'s orange one (judge P2-4)', () => {
        mount('/albums')
        const button = document.getElementById('loginBtn')
        expect(button.classList.contains('top-menu__signin')).toBe(true)
        expect(button.classList.contains('btn-primary')).toBe(false)
    })

    it('the old drawer is gone: no menu button of the phone and no overlay in the bar', () => {
        mount('/start')
        expect(document.getElementById('mobileMenuBtn')).toBeNull()
        expect(document.getElementById('mobileMenuOverlay')).toBeNull()
    })
})
