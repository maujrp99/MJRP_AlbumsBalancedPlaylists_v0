/**
 * F88 (REQ-01, REQ-04) - the bar of the computer is the home's bar: five stops over one row of bars,
 * the fire on the stretch of the current screen, aria-current on the current stop, the flip mark lit
 * on side B. A pure drawing, tested without a browser.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { PHONE_TABS } from '../../../public/js/components/navigation/phoneTabs.js'
import { renderBarMenu, renderPhoneBar, fitBars, wakeBars, BAR_REST_MS } from '../../../public/js/components/navigation/barMenu.js'
import { threadBarStyle } from '../../../public/splash/menu.js'

const draw = (path, options) => {
    document.body.innerHTML = renderBarMenu(path, options)
    return document.querySelector('nav.ms')
}
const stops = () => [...document.querySelectorAll('nav.ms a.stop')]

describe('the bar of the top menu', () => {
    it('has the five destinations of the app, in order, as links of the app', () => {
        draw('/start')
        expect(stops().map(a => a.textContent.trim())).toEqual(PHONE_TABS.map(tab => tab.label))
        expect(stops().map(a => a.getAttribute('href'))).toEqual(['/start', '/albums', '/blend', '/saved-playlists', '/inventory'])
        stops().forEach(a => expect(a.hasAttribute('data-link')).toBe(true))
    })

    it('the first stop is «Create» (the owner, 2026-11-22: «mudar o start para Crie/Create»), still going to /start, with the plus above it on the phone and the active state on /start', () => {
        document.body.innerHTML = renderPhoneBar('/start')
        const first = document.querySelector('nav.ms a.stop')
        expect(first.querySelector('.lb').textContent).toBe('Create')
        expect(first.getAttribute('href')).toBe('/start')
        expect(first.classList.contains('cur')).toBe(true)
        expect(first.getAttribute('aria-current')).toBe('page')
        expect(first.querySelector('svg.ic line[x1="12"][y2="19"]')).not.toBeNull()
        expect(first.querySelector('svg.ic line[x1="4"][x2="20"]')).not.toBeNull()
        expect(document.body.textContent).not.toMatch(/\bStart\b/)
    })

    it.each([
        ['/start', 'Create'],
        ['/albums', 'Albums'],
        ['/albums/abc123', 'Albums'],
        ['/blend', 'Blend'],
        ['/saved-playlists', 'Playlists'],
        ['/playlist-series', 'Playlists'],
        ['/playlists', 'Playlists'],
        ['/playlists/edit', 'Playlists'],
        ['/inventory', 'Inventory']
    ])('on %s the current stop is %s, for the eye (cur) and for the reader (aria-current)', (path, label) => {
        draw(path)
        const current = stops().filter(a => a.classList.contains('cur'))
        expect(current.map(a => a.textContent.trim())).toEqual([label])
        expect(stops().filter(a => a.getAttribute('aria-current') === 'page')).toEqual(current)
    })

    it('the other kinds of series light Albums, the stop of today\'s «Music Series» (judge P2-6)', () => {
        for (const path of ['/artists', '/genres', '/tracks']) {
            draw(path)
            expect(stops().filter(a => a.getAttribute('aria-current') === 'page').map(a => a.textContent.trim())).toEqual(['Albums'])
        }
    })

    it('a screen no stop stands for marks none and lights no bar', () => {
        draw('/homework')
        expect(stops().some(a => a.hasAttribute('aria-current'))).toBe(false)
        expect(document.querySelectorAll('.eqbar i.on').length).toBe(0)
    })

    it('is a navigation with a name, and the row of bars is decoration the reader skips', () => {
        const nav = draw('/blend')
        expect(nav.getAttribute('aria-label')).toBe('Main')
        expect(nav.querySelector('.eqbar').getAttribute('aria-hidden')).toBe('true')
    })

    it('lights only the stretch of the current stop: a fifth of the bars, the last four of them moving', () => {
        draw('/blend', { bars: 100 })
        const bars = [...document.querySelectorAll('.eqbar i')]
        expect(bars.length).toBe(100)
        const lit = bars.map((b, k) => (b.classList.contains('on') ? k : -1)).filter(k => k >= 0)
        expect(lit[0]).toBe(40)
        expect(lit[lit.length - 1]).toBe(59)
        const moving = bars.map((b, k) => (b.classList.contains('cur') ? k : -1)).filter(k => k >= 0)
        expect(moving).toEqual([56, 57, 58, 59])
    })

    it('each bar has its own height, speed and offset: the home\'s own function', () => {
        draw('/start', { bars: 40 })
        const bars = [...document.querySelectorAll('.eqbar i')]
        bars.forEach((b, k) => expect(b.getAttribute('style')).toBe(threadBarStyle(k)))
        expect(new Set(bars.map(b => b.getAttribute('style'))).size).toBeGreaterThan(10)
    })

    it('the flip mark is lit on side B (Playlists, Inventory) and not on side A', () => {
        const flip = () => document.querySelector('.flipmark')
        draw('/albums')
        expect(flip().classList.contains('on')).toBe(false)
        draw('/saved-playlists')
        expect(flip().classList.contains('on')).toBe(true)
        draw('/inventory')
        expect(flip().classList.contains('on')).toBe(true)
        expect(flip().getAttribute('aria-hidden')).toBe('true')
    })

    it('draws again by the width of the bar: about a bar every six pixels, never fewer than thirty', () => {
        const nav = draw('/start')
        nav.querySelector('.eqbar').getBoundingClientRect = () => ({ width: 600 })
        fitBars(nav, '/start')
        expect(nav.querySelectorAll('.eqbar i').length).toBe(100)
        nav.querySelector('.eqbar').getBoundingClientRect = () => ({ width: 60 })
        fitBars(nav, '/start')
        expect(nav.querySelectorAll('.eqbar i').length).toBe(30)
    })
})

describe('the motion of the bars', () => {
    afterEach(() => { vi.useRealTimers(); document.documentElement.classList.remove('moving') })
    const win = (reduced) => ({ document, matchMedia: () => ({ matches: reduced }) })

    it('moves for a short while and then rests (the home\'s ten seconds)', () => {
        vi.useFakeTimers()
        wakeBars(win(false))
        expect(document.documentElement.classList.contains('moving')).toBe(true)
        vi.advanceTimersByTime(BAR_REST_MS + 1)
        expect(document.documentElement.classList.contains('moving')).toBe(false)
    })

    it('does not move at all when the person asked the system for less motion', () => {
        wakeBars(win(true))
        expect(document.documentElement.classList.contains('moving')).toBe(false)
    })
})

describe('the phone\'s bottom menu is this same bar (F88: «Os menus não eram pra ser iguais?»)', () => {
    const drawPhone = (path) => {
        document.body.innerHTML = renderPhoneBar(path)
        return document.querySelector('nav.ms')
    }

    it('is the bar of the computer with an icon above each label and without the ⟲', () => {
        const nav = drawPhone('/blend')
        expect(nav.querySelector('.flipmark')).toBeNull()
        const all = [...nav.querySelectorAll('a.stop')]
        expect(all.length).toBe(5)
        all.forEach(a => {
            expect(a.firstElementChild.matches('svg.ic')).toBe(true)
            expect(a.lastElementChild.matches('span.lb')).toBe(true)
        })
        expect(all.map(a => a.dataset.tab)).toEqual(PHONE_TABS.map(tab => tab.id))
    })

    it('the computer\'s bar has no icons', () => {
        draw('/blend')
        expect(document.querySelectorAll('nav.ms svg').length).toBe(0)
    })

    it('the current stop is lit in fire on the row of bars and marked for the reader', () => {
        const nav = drawPhone('/blend')
        expect(nav.querySelector('a.stop.cur').dataset.tab).toBe('blend')
        expect(nav.querySelector('a.stop[aria-current="page"]').dataset.tab).toBe('blend')
        const bars = [...nav.querySelectorAll('.eqbar i')]
        expect(bars.filter(bar => bar.classList.contains('on')).length).toBe(Math.round(bars.length / 5))
        expect(nav.getAttribute('aria-label')).toBe('Main')
    })

    it('a screen no stop stands for lights no bar and marks no stop', () => {
        const nav = drawPhone('/homework')
        expect(nav.querySelectorAll('.eqbar i.on').length).toBe(0)
        expect(nav.querySelectorAll('[aria-current]').length).toBe(0)
    })
})
