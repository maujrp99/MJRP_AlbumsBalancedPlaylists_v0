/**
 * F85 - «Start» is the name and the address (/start) of the screen where a series is built;
 * /home and /home?signin still open (they lead to /start, query kept); the logo leads to the
 * entry page by a full page load, on the computer and on the phone.
 */
import { describe, it, expect, vi } from 'vitest'

vi.mock('../../../public/js/components/navigation/AuthNav.js', () => ({
    signOut: vi.fn(), isSignedIn: () => false, AuthNav: class { renderDesktop() { return '' } renderMobile() { return '' } attachListeners() {} }
}))
vi.mock('../../../public/js/components/LoginModal.js', () => ({ showLoginModal: vi.fn() }))

import { START_PATH, ENTRY_PATH, oldHomeTarget } from '../../../public/js/components/navigation/startRoute.js'
import { TopNav } from '../../../public/js/components/TopNav.js'
import { Footer } from '../../../public/js/components/Footer.js'
import { Breadcrumb } from '../../../public/js/components/Breadcrumb.js'
import { PhoneShell } from '../../../public/js/components/navigation/PhoneShell.js'
import { readFileSync } from 'node:fs'

describe('the addresses', () => {
    it('Start is /start and the logo goes to the entry page', () => {
        expect(START_PATH).toBe('/start')
        expect(ENTRY_PATH).toBe('/?entry')
    })

    it('/home leads to /start and keeps the query (the sign-in opener still works)', () => {
        expect(oldHomeTarget('')).toBe('/start')
        expect(oldHomeTarget('?signin')).toBe('/start?signin')
        expect(oldHomeTarget('?x=1&signin')).toBe('/start?x=1&signin')
    })
})

describe('the menu of the computer', () => {
    const html = () => { document.body.innerHTML = new TopNav().render(); return document.body }

    it('says «Start» and goes to /start; nothing says Home', () => {
        const body = html()
        const links = [...body.querySelectorAll('a[href="/start"]')].map(a => a.textContent.trim())
        expect(links.length).toBeGreaterThanOrEqual(2) // the bar and the drawer
        links.forEach(text => expect(text).toBe('Start'))
        expect(body.querySelector('a[href="/home"]')).toBeNull()
        expect(body.textContent).not.toMatch(/\bHome\b/)
    })

    it('the logo leads to the entry page, by a full page load (no data-link)', () => {
        const logo = html().querySelector('a.nav-logo')
        expect(logo.getAttribute('href')).toBe('/?entry')
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
        expect(link.getAttribute('href')).toBe('/?entry')
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
