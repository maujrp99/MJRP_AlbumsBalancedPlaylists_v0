/**
 * F88 (REQ-01, REQ-04) - the bar of the computer is the home's bar: five stops over one row of bars,
 * the fire on the stretch of the current screen, aria-current on the current stop, the flip mark lit
 * on side B. A pure drawing, tested without a browser.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { PHONE_TABS } from '../../../public/js/components/navigation/phoneTabs.js'
import { renderBarMenu, fitBars, wakeBars, BAR_REST_MS } from '../../../public/js/components/navigation/barMenu.js'
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

    it.each([
        ['/start', 'Start'],
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

    it('a screen no stop stands for marks none and lights no bar', () => {
        draw('/artists')
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
