/**
 * F76 (REQ-03, REQ-12) - the shell of the phone: the tab bar marks where the person is, the top
 * bar names the screen and shows the person, and none of it is on the page of a computer.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const menu = vi.hoisted(() => ({ openPhoneMenu: vi.fn(() => ({ isOpen: () => true, close: vi.fn() })) }))
vi.mock('../../../public/js/components/navigation/PhoneMenu.js', async (original) => ({ ...(await original()), openPhoneMenu: menu.openPhoneMenu }))
vi.mock('../../../public/js/components/LoginModal.js', () => ({ showLoginModal: vi.fn() }))
vi.mock('../../../public/js/components/navigation/AuthNav.js', () => ({ signOut: vi.fn(), isSignedIn: (user) => Boolean(user && !user.guest) }))
vi.mock('../../../public/js/components/Toast.js', () => ({ default: { success: vi.fn(), error: vi.fn() } }))

import { PHONE_TABS, currentTab, screenName, renderTabBar } from '../../../public/js/components/navigation/phoneTabs.js'
import { PhoneShell } from '../../../public/js/components/navigation/PhoneShell.js'

describe('the tabs of the phone', () => {
    it('are the five destinations, in the order of the work', () => {
        expect(PHONE_TABS.map(tab => tab.label)).toEqual(['Start', 'Albums', 'Blend', 'Playlists', 'Inventory'])
    })

    it.each([
        ['/start', 'home'],
        ['/albums', 'albums'],
        ['/albums/abc123', 'albums'],
        ['/blend', 'blend'],
        ['/saved-playlists', 'playlists'],
        ['/playlists', 'playlists'],
        ['/playlists/edit', 'playlists'],
        ['/inventory', 'inventory']
    ])('%s belongs to the tab %s', (path, id) => {
        expect(currentTab(path).id).toBe(id)
    })

    it('a screen no tab stands for marks none, and a name that only begins alike is not a match', () => {
        expect(currentTab('/artists')).toBeNull()
        expect(currentTab('/homework')).toBeNull()
    })

    it('marks the current tab for the eye and for the screen reader, and only that one', () => {
        document.body.innerHTML = renderTabBar('/albums/abc123')
        const current = [...document.querySelectorAll('[aria-current="page"]')]

        expect(document.querySelectorAll('a[data-link]').length).toBe(5)
        expect(current.map(tab => tab.textContent.trim())).toEqual(['Albums'])
        expect(current[0].classList.contains('is-current')).toBe(true)
        expect(document.querySelectorAll('.is-current').length).toBe(1)
        expect(document.querySelector('nav').getAttribute('aria-label')).toBe('Main')
    })

    it('F88: the bar carries the home\'s row of bars, the fire on the stretch of the current tab', () => {
        document.body.innerHTML = renderTabBar('/blend')
        const row = document.querySelector('.phone-tabbar__bars')
        expect(row.getAttribute('aria-hidden')).toBe('true')
        const bars = [...row.querySelectorAll('i')]
        expect(bars.length).toBeGreaterThanOrEqual(30)
        const lit = bars.filter(bar => bar.classList.contains('on')).length
        expect(lit).toBe(Math.round(bars.length / 5))
        document.body.innerHTML = renderTabBar('/artists')
        expect(document.querySelectorAll('.phone-tabbar__bars i.on').length).toBe(0)
    })

    it('every tab has an icon and a label', () => {
        document.body.innerHTML = renderTabBar('/start')
        for (const tab of document.querySelectorAll('a[data-tab]')) {
            expect(tab.querySelector('svg')).not.toBeNull()
            expect(tab.querySelector('.phone-tabbar__label').textContent.trim()).not.toBe('')
        }
    })

    it('names each screen for the top bar', () => {
        expect(screenName('/start')).toBe('Start')
        expect(screenName('/albums/abc123')).toBe('Albums')
        expect(screenName('/playlists')).toBe('New Playlists')
        expect(screenName('/playlists/edit')).toBe('Edit Playlists')
        expect(screenName('/saved-playlists')).toBe('Playlists')
        expect(screenName('/somewhere-else')).toBe('Album Blender')
    })
})

describe('PhoneShell', () => {
    let win, hooks, storeListeners, user, phoneListener, shell

    const start = (width, path = '/albums') => {
        phoneListener = null
        win = {
            document,
            innerHeight: 800,
            scrollY: 0,
            location: { pathname: path },
            matchMedia: (query) => ({
                matches: query.includes('max-width') ? width <= 767 : false,
                addEventListener: (type, listener) => { if (query.includes('max-width')) phoneListener = listener },
                removeEventListener: () => { }
            }),
            MutationObserver: class { observe() { } disconnect() { } },
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            scrollTo: vi.fn()
        }
        hooks = []
        storeListeners = []
        const router = { afterNavigate: (hook) => hooks.push(hook) }
        const userStore = { getState: () => ({ currentUser: user }), subscribe: (listener) => storeListeners.push(listener) }
        shell = new PhoneShell({ router, userStore, clearCaches: vi.fn(), win })
        shell.start()
    }
    const go = (path) => { win.location.pathname = path; hooks.forEach(hook => hook(path, {})) }

    beforeEach(() => {
        document.body.innerHTML = '<div id="app"></div>'
        user = null
        menu.openPhoneMenu.mockClear()
    })

    afterEach(() => shell?.unmount())

    it('puts nothing on the page of a computer', () => {
        start(1280)

        expect(document.getElementById('phone-topbar')).toBeNull()
        expect(document.getElementById('phone-tabbar')).toBeNull()
        expect(document.querySelector('.phone-to-top')).toBeNull()
        expect(document.body.children.length).toBe(1)
    })

    it('on the phone, shows the top bar with the name of the screen and the tab bar with the current tab', () => {
        start(393, '/albums')

        expect(document.querySelector('#phone-topbar [data-screen-name]').textContent).toBe('Albums')
        expect(document.querySelector('#phone-tabbar [aria-current="page"]').dataset.tab).toBe('albums')
    })

    it('F88: the top bar carries the mark of the site in fire, and it still leads to the entry page', () => {
        start(393, '/albums')

        const link = document.querySelector('#phone-topbar a.phone-topbar__logo-link')
        expect(link.getAttribute('href')).toBe('/home')
        expect(link.hasAttribute('data-full-page')).toBe(true)
        expect(link.getAttribute('aria-label')).toBe('The Album Blender, the entry page')
        expect(link.querySelector('img').getAttribute('src')).toMatch(/wordmark/)
    })

    it('follows the screen: the name and the current tab change, and the new screen starts at its top', () => {
        start(393, '/albums')

        go('/inventory')

        expect(document.querySelector('[data-screen-name]').textContent).toBe('Inventory')
        expect(document.querySelector('[aria-current="page"]').dataset.tab).toBe('inventory')
        expect(win.scrollTo).toHaveBeenCalledWith(0, 0)
    })

    it('the same screen drawn again keeps its place on the page', () => {
        start(393, '/albums')
        go('/albums')
        expect(win.scrollTo).not.toHaveBeenCalled()
    })

    it('comes and goes when the screen becomes a phone or stops being one', () => {
        start(1280)

        phoneListener({ matches: true })
        expect(document.getElementById('phone-tabbar')).not.toBeNull()

        phoneListener({ matches: false })
        expect(document.getElementById('phone-tabbar')).toBeNull()
        expect(document.getElementById('phone-topbar')).toBeNull()
    })

    it('shows the person signed in by the first letter of the name, written as text', () => {
        user = { displayName: '<b>mau</b>' }
        start(393)

        const initial = document.querySelector('#phoneMenuBtn [data-account-initial]')
        expect(initial.textContent).toBe('<')
        expect(document.querySelector('#phoneMenuBtn b')).toBeNull()
    })

    it('shows a menu button to who is not signed in, and draws the person in when they sign in', () => {
        start(393)
        expect(document.querySelector('#phoneMenuBtn [data-account-initial]')).toBeNull()
        expect(document.getElementById('phoneMenuBtn').getAttribute('aria-label')).toBe('Menu and account')

        user = { displayName: 'Mau' }
        storeListeners.forEach(listener => listener())

        expect(document.querySelector('#phoneMenuBtn [data-account-initial]').textContent).toBe('M')
    })

    it('opens the one menu from the top bar, with who is signed in', () => {
        user = { displayName: 'Mau' }
        start(393)

        document.getElementById('phoneMenuBtn').click()

        expect(menu.openPhoneMenu).toHaveBeenCalledTimes(1)
        expect(menu.openPhoneMenu.mock.calls[0][0].user).toBe(user)
    })

    it('a tap on the current tab goes to the top of the screen and does not leave it', () => {
        start(393, '/albums')
        const tab = document.querySelector('[data-tab="albums"]')
        const event = new MouseEvent('click', { bubbles: true, cancelable: true })

        tab.dispatchEvent(event)

        expect(event.defaultPrevented).toBe(true)
        expect(win.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    })

    it('«back to top» shows after two screens of scroll, and not before', () => {
        start(393)
        const toTop = document.querySelector('.phone-to-top')
        expect(toTop.hidden).toBe(true)
        expect(toTop.getAttribute('aria-label')).toBe('Back to top')

        win.scrollY = 1599
        shell.showToTop()
        expect(toTop.hidden).toBe(true)

        win.scrollY = 1600
        shell.showToTop()
        expect(toTop.hidden).toBe(false)
    })

    it('a screen can name itself in the top bar, until the next screen', () => {
        start(393, '/albums')

        shell.setScreenName('Prog Rock <70s>')
        expect(document.querySelector('[data-screen-name]').textContent).toBe('Prog Rock <70s>')

        go('/blend')
        expect(document.querySelector('[data-screen-name]').textContent).toBe('Blend')
    })
})
