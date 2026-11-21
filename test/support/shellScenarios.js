/**
 * The states of the shell of the site (the top bar and the footer of the computer, the shell of the phone, the sign-in window, the menu of the
 * phone) that F83 wave 3 checks, written once so the shell as it was (hand-made: TopNav, Footer, PhoneShell, PhoneMenu, LoginModal) and the shell as
 * it is (React) are asked the same thing: the same person in the user store, the same Spotify session, the same clicks and keys, and what stands
 * in the page after each step. `normalize` is the one of wave 1 (savedPlaylistsScenarios.js), run on a copy.
 *
 * What the shell asks of the world outside (the login, Spotify, the toasts, the questions, the measurement of use, the reload of the app) is a
 * stand-in (`world`) that writes down each call: the calls are compared too.
 *
 * Used by: reports/evidence/F83/wave-3/capture-before.test.js (run once, on the hand-made shell, before it was deleted; it wrote
 * test/fixtures/shellBeforeF83.json) and test/shell/Shell.sameAsBefore.test.tsx (the React shell, against that file).
 */
import { vi } from 'vitest'
import { normalize as pageOf } from './savedPlaylistsScenarios.js'
import { userStore } from '../../public/js/stores/UserStore.js'

export const keyOf = (scenario) => scenario.name

export const user = (extra = {}) => ({ uid: 'u1', isAnonymous: false, displayName: 'Mau Pedroso', email: 'mau@example.test', photoURL: '/photo.png', providerData: [{ providerId: 'google.com' }], ...extra })
export const appleUser = () => user({ displayName: 'Apple Mau', providerData: [{ providerId: 'apple.com' }] })
export const guest = () => user({ isAnonymous: true, displayName: null, email: null })
export const rude = () => user({ displayName: '<b>Mau</b> "&"', photoURL: '/a"b.png' })

/** What the shell asked of the world outside, and the answers the world gives it. */
export const world = {
    /** @type {unknown[][]} */
    calls: [],
    /** @type {{ connected: boolean, profile: { display_name: string } | null }} */
    spotify: { connected: false, profile: null },
    signIn: { fail: null },
    confirmAnswer: true,
    clearFails: false,
    failLogout: false,
    reset() {
        this.calls.length = 0
        this.spotify = { connected: false, profile: null }
        this.signIn = { fail: null }
        this.confirmAnswer = true
        this.clearFails = false
        this.failLogout = false
    }
}
const say = (...what) => world.calls.push(what)

/** The modules the shell reaches outside itself, as stand-ins; each test file mocks the same paths with these. */
export const stand = {
    spotify: {
        isAuthenticated: () => world.spotify.connected,
        getUserProfile: async () => world.spotify.profile,
        login: () => say('spotify login'),
        logout: () => { say('spotify logout'); world.spotify.connected = false; window.dispatchEvent(new Event('spotify-auth-change')) }
    },
    login: {
        signInWithGoogle: async () => { say('sign in', 'google'); if (world.signIn.fail) throw world.signIn.fail },
        signInWithApple: async () => { say('sign in', 'apple'); if (world.signIn.fail) throw world.signIn.fail },
        logout: async () => { say('firebase sign out'); if (world.failLogout) throw new Error('no') }
    },
    toast: {
        success: (m) => say('toast success', m), error: (m) => say('toast error', m), info: (m) => say('toast info', m), warning: (m) => say('toast warning', m)
    },
    dialog: { confirm: async (o) => { say('confirm', o.title, o.message, o.confirmText); return world.confirmAnswer } },
    track: (name, props) => say('track', name, JSON.stringify(props ?? null)),
    reloadApp: () => say('reload app'),
    clearCaches: async () => { say('clear caches'); if (world.clearFails) throw new Error('no') }
}

/** The page as the proof compares it, on a copy; the text a field holds now is taken as the value. */
export const normalize = (element) => {
    if (!element) return null
    const copy = element.cloneNode(true)
    const typed = element.querySelectorAll('input')
    copy.querySelectorAll('input').forEach((input, i) => input.setAttribute('value', typed[i].value))
    return pageOf(copy)
}

/**
 * jsdom answers `element.querySelector('#id')` with the first element of the DOCUMENT that has the id, and null when that one is not inside `element`.
 * The page has the same id in more than one place (the Spotify button of the bar and of the drawer: `spotifyLogoutBtn`), and a browser looks inside the
 * element only. This gives the tests the browser's answer, so the hand-made shell is recorded as a browser would run it.
 */
export function scopedIdLookup() {
    const original = Element.prototype.querySelector
    if (original.scoped) return
    const scoped = function (selector) {
        const id = /^#([\w-]+)$/.exec(selector)
        return id ? this.querySelector(`[id="${id[1]}"]`) : original.call(this, selector)
    }
    scoped.scoped = true
    Element.prototype.querySelector = scoped
}

/**
 * The classes of an icon as a set. `normalize` writes the class of an svg as it stands (a string), and the hand-made shell moved some of them
 * with `classList` (a menu opened and closed leaves no space at the end of «duration-200 »): the string differs, the set does not.
 */
/** @param {string|null} page */
export const tidy = (page) => (typeof page === 'string'
    ? page.replace(/<svg class="([^"]*)"/g, (_, classes) => `<svg class="${classes.split(/\s+/).filter(Boolean).sort().join(' ')}"`)
    : page)

const SECTIONS = ['#header-container', '#footer-container', '#phone-topbar', '#phone-tabbar', '.phone-to-top']
/** What the page has over the app, put straight in the body: the sheets and the windows. */
const OVER_THE_PAGE = '.sheet, .modal-overlay, .app-modal'

/** The window of the phone as the shell reads it, and a way to turn it into a computer and back. */
export function asPhone(phone, width = phone ? 393 : 1280) {
    const listeners = []
    const media = {
        matches: phone,
        addEventListener: (_type, listener) => listeners.push(listener),
        removeEventListener: (_type, listener) => { const i = listeners.indexOf(listener); if (i >= 0) listeners.splice(i, 1) }
    }
    window.matchMedia = vi.fn((query) => (query.includes('max-width') ? media : { matches: query.includes('reduce'), addEventListener() { }, removeEventListener() { } }))
    window.scrollTo = vi.fn()
    Object.defineProperty(window, 'innerWidth', { value: width, configurable: true, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true, writable: true })
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true })
    Date.prototype.toLocaleString = () => 'T0'
    return { turn: (to) => { media.matches = to; [...listeners].forEach(listener => listener({ matches: to })) }, listeners }
}

const focusNow = () => {
    const el = document.activeElement
    if (!el || el === document.body) return 'body'
    return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.dataset?.tab ? '[' + el.dataset.tab + ']' : ''}${el.getAttribute('role') ? '[role=' + el.getAttribute('role') + ']' : ''}`
}

/**
 * Each scenario: a name, where the person opened the app (`url`), whether it is the phone, who is in the user store (`user`; `'loading'` leaves the
 * login unanswered), what Spotify says (`spotify`), and what it does with the shell once started. `h.snap(label, selector)` writes down a piece of the
 * page (with no selector: the shell's own parts and what is over the page); `h.note(label)` writes down what was asked of the world outside.
 */
export const SCENARIOS = [
    {
        name: 'the computer: while the login has not answered', url: '/start', user: 'loading', run: async (h) => {
            h.snap('header and footer')
        }
    },
    {
        name: 'the computer: nobody signed in', url: '/start', user: null, run: async (h) => {
            h.snap('header and footer')
            h.snap('the account part', '#header-container .flex.items-center.gap-2.min-w-0:last-of-type')
        }
    },
    {
        name: 'the computer: a guest is not signed in', url: '/albums', user: guest(), run: async (h) => { h.snap('header') }
    },
    {
        name: 'the computer: signed in with Google', url: '/albums/abc123', user: user(), run: async (h) => { h.snap('header, on a series of albums', '#header-container') }
    },
    {
        name: 'the computer: signed in with Apple', url: '/inventory', user: appleUser(), run: async (h) => { h.snap('header', '#header-container') }
    },
    {
        name: 'the computer: a name written as text', url: '/start', user: rude(), run: async (h) => { h.snap('header', '#header-container') }
    },
    {
        name: 'the computer: the link of each address is the current one', url: '/blend', user: null, run: async (h) => {
            h.snap('blend', '#header-container nav > div.hidden')
            await h.restart('/saved-playlists')
            h.snap('saved playlists', '#header-container nav > div.hidden')
            await h.restart('/playlist-series')
            h.snap('the playlists of the series menu', '#header-container nav > div.hidden')
            await h.restart('/artists')
            h.snap('soon: artists', '#header-container nav > div.hidden')
        }
    },
    {
        name: 'the computer: the account menu', url: '/start', user: user(), run: async (h) => {
            h.snap('closed', '#userMenuDropdownTrigger')
            await h.click('#userMenuBtn')
            h.snap('opened by a click', '#userMenuDropdownTrigger')
            h.note('focus', focusNow())
            await h.key(null, 'Escape')
            h.snap('closed by Escape', '#userMenuDropdownTrigger')
            h.note('focus after Escape', focusNow())
            h.focus('#userMenuBtn')
            await h.key('#userMenuBtn', 'ArrowDown')
            h.snap('opened by the arrow', '#userMenuDropdownTrigger')
            h.note('focus after the arrow', focusNow())
            await h.clickOutside()
            h.snap('closed by a click outside', '#userMenuDropdownTrigger')
            await h.click('#userMenuBtn')
            await h.click('#userMenu p')
            h.snap('a click inside it keeps it open', '#userMenuDropdownTrigger')
        }
    },
    {
        name: 'the computer: sign out', url: '/start', user: user(), run: async (h) => {
            await h.click('#logoutBtn')
            h.note('what sign out asked')
        }
    },
    {
        name: 'the computer: sign out fails', url: '/start', user: user(), run: async (h) => {
            world.failLogout = true
            await h.click('#logoutBtn')
            h.note('what sign out asked')
        }
    },
    {
        name: 'the computer: the menu of series', url: '/albums', user: null, run: async (h) => {
            h.snap('closed, on albums', '#seriesDropdownContainer')
            await h.click('#seriesDropdownBtn')
            h.snap('open', '#seriesDropdownContainer')
            await h.click('#seriesDropdownMenu a[href="/albums"]')
            h.snap('closed by a link', '#seriesDropdownContainer')
            await h.click('#seriesDropdownBtn')
            await h.clickOutside()
            h.snap('closed by a click outside', '#seriesDropdownContainer')
            await h.click('#seriesDropdownBtn')
            await h.click('#seriesDropdownMenu [aria-disabled="true"]')
            h.snap('a «Soon» item is no link and leaves it open', '#seriesDropdownContainer')
        }
    },
    {
        name: 'the computer: the drawer of the middle screen', url: '/albums', user: user(), width: 900, run: async (h) => {
            h.snap('closed', '#mobileMenu, #mobileMenuOverlay')
            await h.click('#mobileMenuBtn')
            h.snap('open', '#mobileMenu, #mobileMenuOverlay')
            h.note('the page is held', document.body.style.overflow)
            await h.click('#mobileSeriesToggle')
            h.snap('the series of the drawer open', '#mobileMenu')
            await h.click('#mobileSeriesToggle')
            h.snap('the series of the drawer closed again', '#mobileMenu')
            await h.click('#mobileMenuOverlay')
            h.snap('closed by the background', '#mobileMenu, #mobileMenuOverlay')
            h.note('the page is given back', document.body.style.overflow)
            await h.click('#mobileMenuBtn')
            await h.click('#mobileMenu a[href="/blend"]')
            h.snap('closed by a link', '#mobileMenu')
            await h.click('#mobileMenuBtn')
            await h.click('#closeMenuBtn')
            h.snap('closed by its X', '#mobileMenu')
            await h.click('#mobileMenuBtn')
            await h.popstate()
            h.snap('closed by going back', '#mobileMenu')
            await h.click('#mobileMenuBtn')
            await h.resize(1280)
            h.snap('closed by a wide window', '#mobileMenu')
        }
    },
    {
        name: 'the computer: the drawer, nobody signed in', url: '/start', user: null, run: async (h) => {
            h.snap('the foot of the drawer', '#mobileMenu')
            await h.click('#mobileLoginBtn')
            h.snap('the window to sign in', '.modal-overlay')
        }
    },
    {
        name: 'the computer: the drawer, signed in', url: '/start', user: user(), run: async (h) => {
            h.snap('the foot of the drawer', '#mobileMenu > div:last-of-type')
            await h.click('#mobileLogoutBtn')
            h.note('what sign out asked')
        }
    },
    {
        name: 'the computer: Spotify not connected', url: '/start', user: null, spotify: { connected: false }, run: async (h) => {
            h.snap('the button', '#spotify-connect-desktop')
            h.snap('the button of the drawer', '#spotify-connect-mobile')
            await h.click('#spotifyLoginBtn')
            h.note('what the button asked')
        }
    },
    {
        name: 'the computer: Spotify connected', url: '/start', user: null, spotify: { connected: true, profile: { display_name: 'Spotty <i>Mau</i>' } }, run: async (h) => {
            h.snap('the connected pill', '#spotify-connect-desktop')
            world.confirmAnswer = false
            await h.click('#spotify-connect-desktop #spotifyLogoutBtn')
            h.note('the question, answered No')
            h.snap('still connected', '#spotify-connect-desktop')
            world.confirmAnswer = true
            await h.click('#spotify-connect-desktop #spotifyLogoutBtn')
            h.note('the question, answered Yes')
            h.snap('disconnected', '#spotify-connect-desktop')
            h.snap('the drawer follows', '#spotify-connect-mobile')
        }
    },
    {
        name: 'the computer: Spotify connected, the name not known yet', url: '/start', user: null, spotify: { connected: true, profile: null }, run: async (h) => {
            h.snap('the pill says Spotify', '#spotify-connect-desktop')
            h.spotify({ connected: true, profile: { display_name: 'Late Mau' } })
            h.snap('the signal arrives: still no name until it is asked', '#spotify-connect-desktop')
            await h.settle()
            h.snap('the name comes', '#spotify-connect-desktop')
        }
    },
    {
        name: 'the computer: Spotify connects while the shell is on', url: '/start', user: null, run: async (h) => {
            h.spotify({ connected: true, profile: { display_name: 'Now Connected' } })
            await h.settle()
            h.snap('connected', '#spotify-connect-desktop')
        }
    },
    {
        name: 'the computer: the login answers again', url: '/start', user: null, run: async (h) => {
            await h.click('#seriesDropdownBtn')
            h.snap('the menu of series open', '#seriesDropdownMenu')
            await h.publish(() => userStore.setUser(user()))
            h.snap('after the user store told: the bar is drawn anew (the menu closed)', '#header-container')
            h.note('focus', focusNow())
        }
    },
    {
        name: 'the computer: focus goes back to the page when the bar is drawn anew', url: '/start', user: null, run: async (h) => {
            h.focus('#loginBtn')
            h.note('focus on the button', focusNow())
            await h.publish(() => userStore.setUser(user()))
            h.note('focus after the draw', focusNow())
        }
    },
    {
        name: 'the computer: the window to sign in', url: '/start', user: null, run: async (h) => {
            await h.click('#loginBtn')
            h.snap('the window', '.modal-overlay')
            h.note('focus', focusNow())
            await h.click('[data-action="cancel"]')
            h.snap('closed by Continue as Guest', '.modal-overlay')
            await h.click('#loginBtn')
            await h.click('.modal-overlay')
            h.snap('closed by a click on the background', '.modal-overlay')
            await h.click('#loginBtn')
            await h.click('.modal-container')
            h.snap('a click inside it keeps it', '.modal-overlay')
        }
    },
    {
        name: 'the computer: signing in with Google and with Apple', url: '/start', user: null, run: async (h) => {
            await h.click('#loginBtn')
            await h.click('#googleLoginBtn')
            h.note('Google worked')
            h.snap('closed', '.modal-overlay')
            await h.click('#loginBtn')
            await h.click('#appleLoginBtn')
            h.note('Apple worked')
        }
    },
    {
        name: 'the computer: signing in fails', url: '/start', user: null, run: async (h) => {
            for (const [label, error] of [['a window closed', { code: 'auth/popup-closed-by-user', message: 'x' }], ['a provider off', { code: 'auth/operation-not-allowed', message: 'x' }], ['another error', { code: 'auth/other', message: 'Boom' }]]) {
                world.signIn.fail = error
                await h.click('#loginBtn')
                await h.click('#appleLoginBtn')
                h.snap(`${label}: the buttons are back`, '.modal-overlay .modal-content')
                h.note(label)
                await h.click('[data-action="cancel"]')
            }
        }
    },
    {
        name: 'the computer: the window to sign in is asked for from outside', url: '/start', user: null, run: async (h) => {
            await h.openLogin()
            h.snap('the window', '.modal-overlay')
        }
    },
    {
        name: 'the computer: the footer', url: '/start', user: null, run: async (h) => {
            h.snap('the footer', '#footer-container')
            await h.click('#footerClearCache')
            h.snap('cleared', '#footer-container')
            h.note('what clearing asked')
        }
    },
    {
        name: 'the computer: the footer, the cache cannot be cleared', url: '/start', user: null, run: async (h) => {
            world.clearFails = true
            await h.click('#footerClearCache')
            h.snap('could not clear', '#footer-container')
            h.note('what clearing asked')
        }
    },
    {
        name: 'the computer: the notice of the Discogs API', url: '/inventory', user: null, run: async (h) => {
            h.snap('hidden', '#discogsApiNotice')
            await h.discogs(true)
            h.snap('shown', '#discogsApiNotice')
            await h.discogs(false)
            h.snap('hidden again', '#discogsApiNotice')
        }
    },
    {
        name: 'the computer: nothing of the shell of the phone', url: '/albums', user: user(), run: async (h) => {
            h.note('the body', [...document.body.children].map(c => c.id || c.className || c.tagName).join(' | '))
        }
    },
    {
        name: 'the phone: nobody signed in', url: '/albums', phone: true, user: null, run: async (h) => {
            h.snap('the bars')
            h.note('the body', [...document.body.children].map(c => c.id || c.className || c.tagName).join(' | '))
        }
    },
    {
        name: 'the phone: signed in', url: '/inventory', phone: true, user: user(), run: async (h) => {
            h.snap('the bars')
        }
    },
    {
        name: 'the phone: a name written as text', url: '/albums', phone: true, user: rude(), run: async (h) => { h.snap('the top bar', '#phone-topbar') }
    },
    {
        name: 'the phone: the tab of each address', url: '/start', phone: true, user: null, run: async (h) => {
            for (const path of ['/albums/abc123', '/blend', '/saved-playlists', '/playlists/edit', '/artists', '/homework']) {
                await h.go(path)
                h.snap(`on ${path}`, '#phone-topbar, #phone-tabbar')
            }
            h.note('where the scroll went', JSON.stringify(window.scrollTo.mock.calls))
        }
    },
    {
        name: 'the phone: the same screen again stays where it is', url: '/albums', phone: true, user: null, run: async (h) => {
            await h.go('/albums')
            h.note('where the scroll went', JSON.stringify(window.scrollTo.mock.calls))
        }
    },
    {
        name: 'the phone: a screen names itself', url: '/albums', phone: true, user: null, run: async (h) => {
            await h.name('Prog Rock <70s>')
            h.snap('the name', '#phone-topbar')
            await h.go('/blend')
            h.snap('the next screen has its own name', '#phone-topbar')
            await h.name('Named on the way')
            await h.publish(() => userStore.setUser(user()))
            h.snap('the name stays when the person signs in', '#phone-topbar')
        }
    },
    {
        name: 'the phone: a screen named itself on the computer, then the screen turned a phone', url: '/albums', user: null, run: async (h) => {
            await h.name('Named on a computer')
            await h.turn(true)
            h.snap('the top bar', '#phone-topbar')
        }
    },
    {
        name: 'the phone: the person signs in and out', url: '/albums', phone: true, user: null, run: async (h) => {
            await h.publish(() => userStore.setUser(user()))
            h.snap('signed in', '#phone-topbar')
            await h.publish(() => userStore.setUser(null))
            h.snap('signed out', '#phone-topbar')
        }
    },
    {
        name: 'the phone: the current tab goes to the top', url: '/albums', phone: true, user: null, run: async (h) => {
            const prevented = await h.clickPrevented('[data-tab="albums"]')
            h.note('prevented', String(prevented))
            h.note('the scroll', JSON.stringify(window.scrollTo.mock.calls))
            const other = await h.clickPrevented('[data-tab="blend"]')
            h.note('another tab is not held back', String(other))
        }
    },
    {
        name: 'the phone: back to top', url: '/albums', phone: true, user: null, run: async (h) => {
            h.snap('after no scroll', '.phone-to-top')
            await h.scroll(1599)
            h.snap('1599', '.phone-to-top')
            await h.scroll(1600)
            h.snap('1600', '.phone-to-top')
            await h.click('.phone-to-top')
            h.note('the scroll', JSON.stringify(window.scrollTo.mock.calls))
        }
    },
    {
        name: 'the phone: turned into a computer and back', url: '/albums', phone: true, user: user(), run: async (h) => {
            await h.turn(false)
            h.note('on a computer: the body', [...document.body.children].map(c => c.id || c.className || c.tagName).join(' | '))
            await h.turn(true)
            h.snap('on a phone again', '#phone-topbar, #phone-tabbar')
        }
    },
    {
        name: 'the phone: focus goes back to the page when the tabs are drawn anew', url: '/albums', phone: true, user: null, run: async (h) => {
            h.focus('[data-tab="blend"]')
            h.note('on the tab', focusNow())
            await h.go('/blend')
            h.note('after the screen changed', focusNow())
        }
    },
    {
        name: 'the phone: the menu, nobody signed in', url: '/albums', phone: true, user: null, spotify: { connected: false }, run: async (h) => {
            await h.click('#phoneMenuBtn')
            h.snap('the menu', '.sheet')
            h.note('focus', focusNow())
            h.note('the page is held', String(document.body.dataset.scrollLocked ?? document.body.style.position))
            await h.click('#phone-menu a[href="/playlists"]')
            h.snap('closed by a place', '.sheet')
            await h.click('#phoneMenuBtn')
            await h.click('.phone-menu__sign-in')
            h.snap('the menu leaves, the window to sign in comes', '.sheet, .modal-overlay')
        }
    },
    {
        name: 'the phone: the menu, signed in', url: '/albums', phone: true, user: user(), spotify: { connected: true, profile: { display_name: 'Spot' } }, run: async (h) => {
            await h.click('#phoneMenuBtn')
            h.snap('the menu', '.sheet')
            await h.click('#phone-menu .phone-menu__row--danger')
            h.snap('closed by sign out', '.sheet')
            h.note('what sign out asked')
        }
    },
    {
        name: 'the phone: the menu closes with the sheet', url: '/albums', phone: true, user: null, run: async (h) => {
            await h.click('#phoneMenuBtn')
            await h.click('.sheet__close')
            h.snap('closed by its X', '.sheet')
            await h.click('#phoneMenuBtn')
            await h.key(null, 'Escape')
            h.snap('closed by Escape', '.sheet')
            await h.click('#phoneMenuBtn')
            await h.go('/blend')
            h.snap('closed by the next screen', '.sheet')
            await h.click('#phoneMenuBtn')
            await h.turn(false)
            h.snap('closed by a turn to a computer', '.sheet')
        }
    },
    {
        name: 'the phone: Spotify in the menu', url: '/albums', phone: true, user: null, spotify: { connected: false }, run: async (h) => {
            await h.click('#phoneMenuBtn')
            h.snap('the button of the menu', '#phone-menu-spotify')
            await h.click('#phone-menu-spotify #spotifyLoginBtn')
            h.note('what the button asked')
        }
    },
    {
        name: 'the phone: the question before clearing the cache', url: '/albums', phone: true, user: null, run: async (h) => {
            await h.click('#phoneMenuBtn')
            await h.clickWhere('.phone-menu__row', 'Clear album cache')
            h.snap('the question', '.sheet')
            h.note('focus', focusNow())
            await h.clickWhere('#phone-clear-cache button', 'Cancel')
            h.snap('cancelled', '.sheet')
            await h.click('#phoneMenuBtn')
            await h.clickWhere('.phone-menu__row', 'Clear album cache')
            await h.click('[data-action="clear-cache"]')
            h.snap('cleared', '.sheet')
            h.note('what clearing asked')
        }
    },
    {
        name: 'the phone: the cache cannot be cleared', url: '/albums', phone: true, user: null, run: async (h) => {
            world.clearFails = true
            await h.click('#phoneMenuBtn')
            await h.clickWhere('.phone-menu__row', 'Clear album cache')
            await h.click('[data-action="clear-cache"]')
            h.snap('still asking: the button is back', '.sheet')
            h.note('what clearing asked')
        }
    },
    {
        name: 'the phone: the window to sign in', url: '/albums', phone: true, user: null, run: async (h) => {
            await h.openLogin()
            h.snap('the window', '.modal-overlay')
            h.note('the page is held', String(document.body.style.position || document.body.style.overflow))
            await h.click('[data-action="cancel"]')
            h.note('the page is given back', String(document.body.style.position || document.body.style.overflow))
        }
    }
]

/** The pieces the snapshots read when no selector is given: the shell's own parts and what is over the page. */
export function wholePage() {
    const parts = SECTIONS.map(selector => `${selector}: ${normalize(document.querySelector(selector))}`)
    const over = [...document.querySelectorAll(OVER_THE_PAGE)].map(element => normalize(element))
    return [...parts, ...over].join('\n')
}

/** The same `h` for the two shells; `adapter` is what differs (how the shell starts and stops, and the doors the old screens use). */
export function driver({ adapter, snaps, scenario }) {
    const flush = () => new Promise(resolve => setTimeout(resolve, 25))
    const settle = () => adapter.act(async () => { await flush() })
    const one = (selector) => {
        const element = document.querySelector(selector)
        if (!element) throw new Error(`nothing matches ${selector}`)
        return element
    }
    const h = {
        snap: (label, selector) => {
            snaps[label] = selector ? [...document.querySelectorAll(selector)].map(normalize).join('\n') || null : wholePage()
        },
        note: (label, text) => { snaps[label] = text ?? JSON.stringify(world.calls.splice(0)) },
        settle,
        click: async (selector) => { await adapter.act(async () => { one(selector).click(); await flush() }) },
        clickWhere: async (selector, text) => { await adapter.act(async () => { [...document.querySelectorAll(selector)].find(e => e.textContent.includes(text)).click(); await flush() }) },
        clickPrevented: async (selector) => {
            let prevented = false
            await adapter.act(async () => {
                const event = new MouseEvent('click', { bubbles: true, cancelable: true })
                one(selector).dispatchEvent(event)
                prevented = event.defaultPrevented
                await flush()
            })
            return prevented
        },
        clickOutside: async () => { await adapter.act(async () => { document.body.click(); await flush() }) },
        key: async (selector, key) => {
            await adapter.act(async () => {
                (selector ? one(selector) : document).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
                await flush()
            })
        },
        focus: (selector) => { one(selector).focus() },
        publish: async (change) => { await adapter.act(async () => { change(); await flush() }) },
        spotify: (state) => { world.spotify = { ...world.spotify, ...state }; window.dispatchEvent(new Event('spotify-auth-change')) },
        go: async (path) => { await adapter.act(async () => { window.history.pushState({}, '', path); adapter.navigated(path); await flush() }) },
        popstate: async () => { await adapter.act(async () => { window.dispatchEvent(new PopStateEvent('popstate')); await flush() }) },
        resize: async (width) => { await adapter.act(async () => { window.innerWidth = width; window.dispatchEvent(new Event('resize')); await flush() }) },
        scroll: async (y) => { await adapter.act(async () => { window.scrollY = y; window.dispatchEvent(new Event('scroll')); await flush() }) },
        turn: async (to) => { await adapter.act(async () => { adapter.phone.turn(to); await flush() }) },
        name: async (text) => { await adapter.act(async () => { adapter.nameThisScreen(text); await flush() }) },
        discogs: async (on) => { await adapter.act(async () => { adapter.showDiscogsNotice(on); await flush() }) },
        openLogin: async () => { await adapter.act(async () => { adapter.openLogin(); await flush() }) },
        restart: async (path) => { adapter.stop(); document.body.innerHTML = adapter.skeleton(); window.history.replaceState({}, '', path); adapter.start(); await settle() }
    }
    return { h, scenario }
}
