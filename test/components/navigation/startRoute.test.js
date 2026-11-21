/**
 * F85 - «Start» is the name and the address (/start) of the screen where a series is built; the logo
 * leads to /home, the entry page (the site's home), by a full page load, on the computer and on the phone.
 * MJRP, 2026-11-21: «o /home agora deveria ser o entry»: the app never redirects /home to /start; if it
 * is ever asked for /home it leaves to the browser, once (no loop when a server answers /home with the app).
 */
import { describe, it, expect, vi } from 'vitest'

vi.mock('../../../public/js/components/navigation/AuthNav.js', () => ({
    signOut: vi.fn(), isSignedIn: () => false, AuthNav: class { renderDesktop() { return '' } renderMobile() { return '' } attachListeners() {} }
}))
vi.mock('../../../public/js/components/LoginModal.js', () => ({ showLoginModal: vi.fn() }))

import { START_PATH, HOME_PATH, leaveToHome, LEFT_KEY, LEFT_WINDOW_MS } from '../../../public/js/components/navigation/startRoute.js'
import { TopNav } from '../../../public/js/components/TopNav.js'
import { Footer } from '../../../public/js/components/Footer.js'
import { Breadcrumb } from '../../../public/js/components/Breadcrumb.js'
import { PhoneShell } from '../../../public/js/components/navigation/PhoneShell.js'
import { readFileSync } from 'node:fs'

describe('the addresses', () => {
    it('Start is /start and the logo goes to /home, the entry page', () => {
        expect(START_PATH).toBe('/start')
        expect(HOME_PATH).toBe('/home')
    })
})

describe('the app asked for /home (F85, MJRP 2026-11-21)', () => {
    const fakeWin = (search = '', stored = null) => {
        const data = stored === null ? {} : { [LEFT_KEY]: stored }
        return {
            location: { search, replace: vi.fn() },
            sessionStorage: { getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v } },
            data
        }
    }

    it('leaves to the browser: a full load of /home, the address written in the code (the old query is dropped); it never goes to /start', () => {
        const win = fakeWin('?signin')
        expect(leaveToHome(win, { now: 1000 })).toBe(true)
        expect(win.location.replace).toHaveBeenCalledWith('/home')
        expect(win.data[LEFT_KEY]).toBe('1000')
    })

    it('no loop: a server that answers /home with the app is left once, then the app stays (the caller goes to /start)', () => {
        const win = fakeWin('', '1000')
        expect(leaveToHome(win, { now: 1000 + LEFT_WINDOW_MS - 1 })).toBe(false)
        expect(win.location.replace).not.toHaveBeenCalled()
    })

    it('a later, independent ask leaves again', () => {
        const win = fakeWin('', '1000')
        expect(leaveToHome(win, { now: 1000 + LEFT_WINDOW_MS + 1 })).toBe(true)
        expect(win.location.replace).toHaveBeenCalledWith('/home')
    })

    it('without sessionStorage it still leaves once, and cannot loop in the same page', () => {
        const win = { location: { search: '', replace: vi.fn() }, get sessionStorage() { throw new Error('blocked') } }
        expect(leaveToHome(win, { now: 5 })).toBe(true)
        expect(leaveToHome(win, { now: 6 })).toBe(false)
    })

    it('app.js registers /home with leaveToHome and no redirect to /start from it', () => {
        const app = readFileSync('public/js/app.js', 'utf8')
        const block = app.slice(app.indexOf("router.register('/home'"), app.indexOf("router.register('/albums'"))
        expect(block).toMatch(/leaveToHome\(/)
        expect(block).not.toMatch(/oldHomeTarget/)
    })
})

describe('the menu of the computer', () => {
    const html = () => { document.body.innerHTML = new TopNav().render(); return document.body }

    it('says «Start» and goes to /start; nothing says Home', () => {
        const body = html()
        const links = [...body.querySelectorAll('a[href="/start"]')].map(a => a.textContent.trim())
        expect(links.length).toBeGreaterThanOrEqual(2) // the bar and the drawer
        links.forEach(text => expect(text).toBe('Start'))
        expect(body.querySelectorAll('a[href="/home"]:not(.nav-logo)').length).toBe(0) // only the logo leads to /home
        expect(body.textContent).not.toMatch(/\bHome\b/)
    })

    it('the logo leads to /home (the entry page), by a full page load (no data-link)', () => {
        const logo = html().querySelector('a.nav-logo')
        expect(logo.getAttribute('href')).toBe('/home')
        expect(logo.hasAttribute('data-full-page')).toBe(true)
    })

    it('the footer and the breadcrumb say Start', () => {
        expect(new Footer({}).render()).toContain('href="/start"')
        expect(Breadcrumb.getCrumbs('/albums', {})[0]).toEqual({ label: 'Start', path: '/start' })
    })
})

describe('the top bar of the phone', () => {
    it('the logo is a link to the entry page, by a full page load', () => {
        document.body.innerHTML = '<div id="app"></div>'
        const win = {
            document, innerHeight: 800, scrollY: 0, location: { pathname: '/albums' },
            matchMedia: (query) => ({ matches: query.includes('max-width'), addEventListener() {}, removeEventListener() {} }),
            MutationObserver: class { observe() {} disconnect() {} },
            addEventListener: vi.fn(), removeEventListener: vi.fn(), scrollTo: vi.fn()
        }
        const router = { afterNavigate: () => {} }
        const userStore = { getState: () => ({ currentUser: null }), subscribe: () => {} }
        new PhoneShell({ router, userStore, clearCaches: vi.fn(), win }).start()

        const link = document.querySelector('a.phone-topbar__logo-link')
        expect(link.getAttribute('href')).toBe('/home')
        expect(link.hasAttribute('data-full-page')).toBe(true)
        expect(link.getAttribute('aria-label')).toMatch(/entry page/)
        expect(link.querySelector('img.phone-topbar__logo')).not.toBeNull()
        expect(document.querySelector('a[data-tab="home"]').textContent.trim()).toBe('Start')
    })
})

describe('the router', () => {
    const router = readFileSync('public/js/router.js', 'utf8')
    it('leaves a link marked data-full-page to the browser', () => {
        expect(router).toMatch(/data-full-page/)
    })
})
