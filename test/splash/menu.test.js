/**
 * F80 (UAT-240, UAT-241): the bar is the menu. One continuous row of bars with five stops, each
 * with its story; signed out a stop scrolls to its story, signed in it goes to its screen of the app;
 * signed in the page shows the menu and only the «Criar» button.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { MENU, SLOTS, menuHref, barProgress, stopIndex, applyAccount } from '../../public/splash/menu.js'
import { ORDER, TRACKS } from '../../public/splash/splash.js'

describe('the menu', () => {
    it('five items, in the app\'s order, each with its screen', () => {
        expect(MENU.map(m => m.id)).toEqual(['start', 'albums', 'blend', 'playlists', 'inventory'])
        expect(MENU.map(m => m.app)).toEqual(['/start', '/albums', '/blend', '/saved-playlists', '/inventory'])
        expect(MENU.map(m => m.key)).toEqual(['m.start', 'm.albums', 'm.blend', 'm.playlists', 'm.inventory'])
    })

    it('signed out, an item scrolls to its story; signed in, it goes to its screen of the app', () => {
        expect(MENU.map(m => menuHref(m, false))).toEqual(['#start', '#albums', '#blend', '#playlists', '#inventory'])
        expect(MENU.map(m => menuHref(m, true))).toEqual(['/start', '/albums', '/blend', '/saved-playlists', '/inventory'])
    })

    it('every item has a story on the page, in the page\'s order, with the flip between Blend and Playlists', () => {
        expect(ORDER).toEqual(['a1', 'start', 'albums', 'blend', 'flip', 'playlists', 'inventory', 'end'])
        for (const m of MENU) expect(TRACKS[m.id], m.id).toBeDefined()
        expect(TRACKS.playlists.side).toBe('B')
        expect(TRACKS.blend.side).toBe('A')
    })
})

describe('the continuous bar', () => {
    const rows = (tops) => ORDER.map((id, i) => ({ id, top: tops[i], height: 600 }))

    it('every story has its stretch of the bar, from 0 to 1, the five stops one fifth each', () => {
        expect(Object.keys(SLOTS)).toEqual(ORDER)
        expect(SLOTS.start).toEqual([0, 0.2])
        expect(SLOTS.inventory).toEqual([0.8, 1])
        expect(SLOTS.flip).toEqual([0.6, 0.6])
    })

    it('nothing is lit at the top, all of it at the end of the page', () => {
        expect(barProgress(rows([0, 900, 1500, 2100, 2700, 3000, 3600, 4200]), 800, false)).toBe(0)
        expect(barProgress(rows([-5000, -4400, -3800, -3200, -2600, -2300, -1700, -1100]), 800, true)).toBe(1)
    })

    it('inside a story, the bar fills with how far it has been read', () => {
        // the mark is 55% of 800 = 440; «albums» top at 140 → read 300 of 600 = half → 0.2 + 0.1
        const p = barProgress(rows([-3000, -600, 140, 740, 1340, 1640, 2240, 2840]), 800, false)
        expect(p).toBeCloseTo(0.3)
        expect(stopIndex(p)).toBe(1)
    })

    it('the current stop: none at either end, otherwise the fifth the bar is in', () => {
        expect(stopIndex(0)).toBe(-1)
        expect(stopIndex(1)).toBe(-1)
        expect(stopIndex(0.1)).toBe(0)
        expect(stopIndex(0.6)).toBe(3)
        expect(stopIndex(0.99)).toBe(4)
    })
})

describe('signed in or out', () => {
    beforeEach(() => {
        document.documentElement.className = ''
        document.body.innerHTML = MENU.map(m => `<a class="stop" href="#${m.id}" data-for="${m.id}"></a>`).join('')
    })

    it('signed in: the page says so, and the menu goes to the app', () => {
        applyAccount(document, true)
        expect(document.documentElement.classList.contains('in')).toBe(true)
        expect([...document.querySelectorAll('.stop')].map(a => a.getAttribute('href')))
            .toEqual(['/start', '/albums', '/blend', '/saved-playlists', '/inventory'])
    })

    it('signed out (the default): the menu scrolls to the stories', () => {
        applyAccount(document, true)
        applyAccount(document, false)
        expect(document.documentElement.classList.contains('in')).toBe(false)
        expect([...document.querySelectorAll('.stop')].map(a => a.getAttribute('href')))
            .toEqual(['#start', '#albums', '#blend', '#playlists', '#inventory'])
    })
})
