/**
 * F88 (REQ-01, REQ-02, REQ-04) - the top menu in React: the bar of the computer is the home's bar (five stops over one row of bars, the fire on the
 * stretch of the current screen, aria-current on the current stop, the flip mark lit on side B), the line under it, the account and the phone's
 * bottom menu (the same bar with an icon above each label).
 *
 * Carried from test/components/navigation/barMenu.test.js, subRow.test.js and test/components/TopNav.test.js (main, F88) when the menu moved to
 * React (F83, sync of main): the same cases, the same words, against the components.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

vi.mock('../../public/js/services/auth/signIn.js', async () => ({ authService: (await import('../support/shellScenarios.js')).stand.login }))
vi.mock('../../public/js/services/SpotifyAuthService.js', async () => ({ SpotifyAuthService: (await import('../support/shellScenarios.js')).stand.spotify }))
vi.mock('../../public/js/stores/toasts.js', async (importOriginal) => ({ ...(await importOriginal<object>()), default: (await import('../support/shellScenarios.js')).stand.toast }))
vi.mock('../../public/js/ui/dialogs/dialogs', async () => ({ dialogService: (await import('../support/shellScenarios.js')).stand.dialog }))
vi.mock('../../public/js/services/usage/track.js', async () => ({ track: (await import('../support/shellScenarios.js')).stand.track }))
vi.mock('../../public/js/utils/reloadApp.js', async () => ({ reloadApp: (await import('../support/shellScenarios.js')).stand.reloadApp }))

import { BarMenu, BAR_REST_MS, wakeBars } from '../../public/js/shell/BarMenu'
import { SubRow, subRowFor } from '../../public/js/shell/SubRow'
import { PHONE_TABS } from '../../public/js/shell/phoneTabs'
import { threadBarStyle } from '../../public/splash/menu.js'
import { startOn } from '../support/renderShell'
import { world, scopedIdLookup, user } from '../support/shellScenarios.js'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
const draw = (node: React.ReactElement) => {
    document.body.innerHTML = '<div id="host"></div>'
    root = createRoot(document.getElementById('host')!)
    act(() => root!.render(node))
}
afterEach(() => { if (root) act(() => root!.unmount()); root = null; document.body.innerHTML = '' })

const bar = (path: string, props: Partial<React.ComponentProps<typeof BarMenu>> = {}) => {
    draw(<BarMenu path={path} {...props} />)
    return document.querySelector('nav.ms')!
}
const stops = () => [...document.querySelectorAll<HTMLAnchorElement>('nav.ms a.stop')]
const text = (element: Element) => (element.textContent ?? '').trim()

describe('the bar of the top menu', () => {
    it('has the five destinations of the app, in order, as links of the app', () => {
        bar('/start')
        expect(stops().map(text)).toEqual(['Start', 'Albums', 'Blend', 'Playlists', 'Inventory'])
        expect(stops().map(a => a.getAttribute('href'))).toEqual(['/start', '/albums', '/blend', '/saved-playlists', '/inventory'])
        stops().forEach(a => expect(a.hasAttribute('data-link')).toBe(true))
    })

    it.each([
        ['/start', 'Start'], ['/albums', 'Albums'], ['/albums/abc123', 'Albums'], ['/blend', 'Blend'], ['/saved-playlists', 'Playlists'],
        ['/playlist-series', 'Playlists'], ['/playlists', 'Playlists'], ['/playlists/edit', 'Playlists'], ['/inventory', 'Inventory']
    ])('on %s the current stop is %s, for the eye (cur) and for the reader (aria-current)', (path, label) => {
        bar(path)
        const current = stops().filter(a => a.classList.contains('cur'))
        expect(current.map(text)).toEqual([label])
        expect(stops().filter(a => a.getAttribute('aria-current') === 'page')).toEqual(current)
    })

    it('the other kinds of series light Albums, the stop of today\'s «Music Series» (judge P2-6)', () => {
        for (const path of ['/artists', '/genres', '/tracks']) {
            bar(path)
            expect(stops().filter(a => a.getAttribute('aria-current') === 'page').map(text)).toEqual(['Albums'])
        }
    })

    it('a screen no stop stands for marks none and lights no bar', () => {
        bar('/homework')
        expect(stops().some(a => a.hasAttribute('aria-current'))).toBe(false)
        expect(document.querySelectorAll('.eqbar i.on').length).toBe(0)
    })

    it('is a navigation with a name, and the row of bars is decoration the reader skips', () => {
        const nav = bar('/blend')
        expect(nav.getAttribute('aria-label')).toBe('Main')
        expect(nav.querySelector('.eqbar')!.getAttribute('aria-hidden')).toBe('true')
    })

    it('lights only the stretch of the current stop: a fifth of the bars, the last four of them moving', () => {
        bar('/blend')
        const bars = [...document.querySelectorAll('.eqbar i')]
        expect(bars.length).toBe(100) // the row is measured: 600 px when the page cannot say, a bar every six
        const lit = bars.map((b, k) => (b.classList.contains('on') ? k : -1)).filter(k => k >= 0)
        expect(lit[0]).toBe(40)
        expect(lit[lit.length - 1]).toBe(59)
        expect(bars.map((b, k) => (b.classList.contains('cur') ? k : -1)).filter(k => k >= 0)).toEqual([56, 57, 58, 59])
    })

    it('each bar has its own height, speed and offset: the home\'s own function', () => {
        bar('/start')
        const bars = [...document.querySelectorAll<HTMLElement>('.eqbar i')]
        const written = (b: HTMLElement) => `--h:${b.style.getPropertyValue('--h').trim()};--d:${b.style.getPropertyValue('--d').trim()};--o:${b.style.getPropertyValue('--o').trim()}`
        bars.forEach((b, k) => expect(written(b)).toBe(threadBarStyle(k)))
        expect(new Set(bars.map(written)).size).toBeGreaterThan(10)
    })

    it('the flip mark is lit on side B (Playlists, Inventory) and not on side A', () => {
        const flip = () => document.querySelector('.flipmark')!
        bar('/albums')
        expect(flip().classList.contains('on')).toBe(false)
        bar('/saved-playlists')
        expect(flip().classList.contains('on')).toBe(true)
        bar('/inventory')
        expect(flip().classList.contains('on')).toBe(true)
        expect(flip().getAttribute('aria-hidden')).toBe('true')
    })

    it('draws again by the width of the bar: about a bar every six pixels, never fewer than thirty, at each resize', () => {
        let width = 600
        const spy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ width } as DOMRect))
        bar('/start')
        expect(document.querySelectorAll('.eqbar i').length).toBe(100)
        width = 60
        act(() => { window.dispatchEvent(new Event('resize')) })
        expect(document.querySelectorAll('.eqbar i').length).toBe(30)
        spy.mockRestore()
    })
})

describe('the motion of the bars', () => {
    afterEach(() => { vi.useRealTimers(); document.documentElement.classList.remove('moving'); vi.restoreAllMocks() })
    const reduced = (matches: boolean) => { window.matchMedia = ((query: string) => ({ matches, media: query, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia }

    it('moves for a short while and then rests (the home\'s ten seconds)', () => {
        vi.useFakeTimers()
        reduced(false)
        wakeBars()
        expect(document.documentElement.classList.contains('moving')).toBe(true)
        vi.advanceTimersByTime(BAR_REST_MS + 1)
        expect(document.documentElement.classList.contains('moving')).toBe(false)
    })

    it('does not move at all when the person asked the system for less motion', () => {
        reduced(true)
        wakeBars()
        expect(document.documentElement.classList.contains('moving')).toBe(false)
    })
})

describe('the phone\'s bottom menu is this same bar (F88: «Os menus não eram pra ser iguais?»)', () => {
    const phoneBar = (path: string) => bar(path, { bars: 64, icons: true, flip: false })

    it('is the bar of the computer with an icon above each label and without the ⟲', () => {
        const nav = phoneBar('/blend')
        expect(nav.querySelector('.flipmark')).toBeNull()
        const all = [...nav.querySelectorAll<HTMLElement>('a.stop')]
        expect(all.length).toBe(5)
        all.forEach(a => {
            expect(a.firstElementChild!.matches('svg.ic')).toBe(true)
            expect(a.lastElementChild!.matches('span.lb')).toBe(true)
        })
        expect(all.map(a => a.dataset.tab)).toEqual(PHONE_TABS.map(tab => tab.id))
    })

    it('the computer\'s bar has no icons', () => {
        bar('/blend')
        expect(document.querySelectorAll('nav.ms svg').length).toBe(0)
    })

    it('the current stop is lit in fire on the row of bars and marked for the reader', () => {
        const nav = phoneBar('/blend')
        expect((nav.querySelector('a.stop.cur') as HTMLElement).dataset.tab).toBe('blend')
        expect((nav.querySelector('a.stop[aria-current="page"]') as HTMLElement).dataset.tab).toBe('blend')
        const bars = [...nav.querySelectorAll('.eqbar i')]
        expect(bars.filter(b => b.classList.contains('on')).length).toBe(Math.round(bars.length / 5))
        expect(nav.getAttribute('aria-label')).toBe('Main')
    })

    it('a screen no stop stands for lights no bar and marks no stop', () => {
        const nav = phoneBar('/homework')
        expect(nav.querySelectorAll('.eqbar i.on').length).toBe(0)
        expect(nav.querySelectorAll('[aria-current]').length).toBe(0)
    })
})

describe('the line under the bar', () => {
    const line = (path: string) => { draw(<SubRow path={path} />); return document.querySelector('nav')! }

    it('exists only for Albums and for Playlists', () => {
        for (const path of ['/start', '/blend', '/inventory', '/artists', '/somewhere']) expect(subRowFor(path)).toBeNull()
        draw(<SubRow path="/blend" />)
        expect(document.getElementById('host')!.innerHTML).toBe('')
    })

    it.each(['/albums', '/albums/abc123'])('on %s: By Album (current) and the kinds of series coming, shown and not links', (path) => {
        const nav = line(path)
        expect(nav.getAttribute('aria-label')).toBe('Albums')
        const links = [...nav.querySelectorAll('a')]
        expect(links.map(a => [text(a), a.getAttribute('href'), a.getAttribute('aria-current')])).toEqual([['By Album', '/albums', 'page']])
        const soon = [...nav.querySelectorAll('[aria-disabled="true"]')]
        expect(soon.map(s => (s.textContent ?? '').replace(/\s+/g, ' ').trim())).toEqual(['By Artist Soon', 'By Genre Soon', 'By Track Soon'])
        soon.forEach(s => expect(s.tagName).not.toBe('A'))
    })

    it.each([['/saved-playlists', 'Saved'], ['/playlists', 'New'], ['/playlists/edit', 'New'], ['/playlist-series', 'Series']])('on %s the place of Playlists lit is %s', (path, label) => {
        const nav = line(path)
        expect(nav.getAttribute('aria-label')).toBe('Playlists')
        expect([...nav.querySelectorAll('a')].map(a => a.getAttribute('href'))).toEqual(['/saved-playlists', '/playlists', '/playlist-series'])
        expect([...nav.querySelectorAll('a[aria-current="page"]')].map(text)).toEqual([label])
    })
})

describe('the top menu of the computer (TopNav)', () => {
    beforeEach(() => { world.reset(); scopedIdLookup() })
    afterEach(() => { document.body.innerHTML = ''; document.body.removeAttribute('style') })
    const current = () => [...document.querySelectorAll('nav.ms a[aria-current="page"]')].map(text)
    const ANA = user({ displayName: 'Ana', email: 'ana@example.test', photoURL: null })

    it('has the mark that leads to the home as a full page load, and nothing of the old bar', async () => {
        const shell = await startOn('/start')
        const home = document.querySelector('a.top-menu__home')!
        expect(home.getAttribute('href')).toBe('/home')
        expect(home.hasAttribute('data-full-page')).toBe(true)
        expect(home.getAttribute('aria-label')).toBe('The Album Blender, the entry page')
        expect(home.querySelector('img')!.getAttribute('src')).toMatch(/wordmark/)
        expect(document.body.innerHTML).not.toMatch(/mobileMenu|seriesDropdown|Music Series|The Blending Menu/)
        shell.stop()
    })

    it.each([
        ['/start', 'Start'], ['/albums', 'Albums'], ['/albums/abc', 'Albums'], ['/blend', 'Blend'],
        ['/saved-playlists', 'Playlists'], ['/playlist-series', 'Playlists'], ['/playlists', 'Playlists'], ['/inventory', 'Inventory']
    ])('on %s the current stop is %s', async (path, label) => {
        const shell = await startOn(path)
        expect(current()).toEqual([label])
        shell.stop()
    })

    it('follows the router: the current stop and the line under the bar change with the screen, the panel keeps its state', async () => {
        const shell = await startOn('/start', { user: ANA })
        expect(document.getElementById('top-menu-sub')!.children.length).toBe(0)
        await shell.act(async () => { document.getElementById('userMenuBtn')!.click() })

        window.history.replaceState({}, '', '/albums')
        await shell.act(async () => { shell.navigated('/albums') })
        expect(current()).toEqual(['Albums'])
        expect(document.querySelector('#top-menu-sub nav')!.getAttribute('aria-label')).toBe('Albums')

        window.history.replaceState({}, '', '/saved-playlists')
        await shell.act(async () => { shell.navigated('/saved-playlists') })
        expect(current()).toEqual(['Playlists'])
        expect(document.querySelector('#top-menu-sub nav')!.getAttribute('aria-label')).toBe('Playlists')
        expect(document.getElementById('userMenuBtn')!.getAttribute('aria-expanded')).toBe('true')

        window.history.replaceState({}, '', '/blend')
        await shell.act(async () => { shell.navigated('/blend') })
        expect(document.getElementById('top-menu-sub')!.children.length).toBe(0)
        shell.stop()
    })

    it('signed out: «Sign In» and the connections button; no account name, no Sign Out', async () => {
        const shell = await startOn('/albums')
        expect(document.getElementById('loginBtn')!.textContent!.trim()).toBe('Sign In')
        expect(document.getElementById('userMenuBtn')!.getAttribute('aria-label')).toMatch(/^Connections/)
        expect(document.querySelector('[data-account-name]')).toBeNull()
        expect(document.getElementById('logoutBtn')).toBeNull()
        shell.stop()
    })

    it('signed in: the account button names the panel, which holds the name and Sign Out; no «Sign In»', async () => {
        const shell = await startOn('/albums', { user: ANA })
        expect(document.getElementById('loginBtn')).toBeNull()
        expect(document.getElementById('userMenuBtn')!.getAttribute('aria-label')).toMatch(/^Account and connections/)
        expect(document.querySelector('[data-account-name]')!.textContent).toBe('Ana')
        expect(document.getElementById('logoutBtn')).not.toBeNull()
        shell.stop()
    })

    it('the account button shows the initial in orange, as the phone and the prototype do, never an image (judge P2-4)', async () => {
        const shell = await startOn('/albums', { user: ANA })
        expect(document.querySelector('#userMenuBtn .top-acct__initial')!.textContent).toBe('A')
        expect(document.querySelector('#userMenuBtn img')).toBeNull()
        shell.stop()
        const withPhoto = await startOn('/albums', { user: user({ displayName: 'Ana', photoURL: '/a.png' }) })
        expect(document.querySelector('#userMenuBtn .top-acct__initial')!.textContent).toBe('A')
        expect(document.querySelector('#userMenuBtn img')).toBeNull()
        withPhoto.stop()
    })

    it('«Sign In» is the home\'s ghost button, not the app\'s orange one (judge P2-4)', async () => {
        const shell = await startOn('/albums')
        const button = document.getElementById('loginBtn')!
        expect(button.classList.contains('top-menu__signin')).toBe(true)
        expect(button.classList.contains('btn-primary')).toBe(false)
        shell.stop()
    })

    it('the old drawer is gone: no menu button of the phone and no overlay in the bar', async () => {
        const shell = await startOn('/start')
        expect(document.getElementById('mobileMenuBtn')).toBeNull()
        expect(document.getElementById('mobileMenuOverlay')).toBeNull()
        shell.stop()
    })
})
