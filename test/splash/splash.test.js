/**
 * F80 (REQ-01, REQ-04, REQ-07) - the entry page alive, as the approved prototype: the scroll is the
 * record playing (a track per section, «Flip the record» turns the crate), the CSS crate lifts the
 * pulled record, the caption names it, the thread lights up; soft fire; the motion rests; reduced
 * motion stops everything and keeps the 3D away.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { COPY } from '../../public/splash/copy.js'
import { USER_KEY_PREFIX } from '../../public/splash/gate.js'
import {
    FIRE, ORDER, TRACKS, MOTION_WINDOW_MS, trackAt, flipProgress, captionIndex, cssCrateLayout, shouldLoad3d,
    threadBarStyle, captionLine, startSplash
} from '../../public/splash/splash.js'
import { coverImagesHtml, captionHtml } from '../../public/splash/covers.js'
import { fillCopy } from '../../scripts/entryPage.mjs'

describe('the record playing', () => {
    it('eight parts: the opening, three stories on side A, the flip band, two stories on side B, the close', () => {
        expect(ORDER).toEqual(['a1', 'start', 'albums', 'blend', 'flip', 'playlists', 'inventory', 'end'])
        expect(TRACKS.playlists.side).toBe('B')
    })

    it('the fire is the soft one: strong on the first screen and the invitation, low in between', () => {
        expect(FIRE).toEqual({ peak: 0.72, low: 0.28 })
        expect(TRACKS.a1.fire).toBe(0.72)
        expect(TRACKS.end.fire).toBe(0.72)
        expect(TRACKS.blend.fire).toBe(0.28)
        expect(TRACKS.flip.fire).toBeCloseTo(0.5)
    })

    it('the track is the last section whose top passed 55% of the screen', () => {
        const vh = 800
        expect(trackAt([0, 900, 1800, 2700, 3600, 4500, 5400, 6300], vh)).toBe('a1')
        expect(trackAt([-1900, -1000, 300, 1200, 2100, 3000, 3900, 4800], vh)).toBe('albums')
        expect(trackAt([-9000, -8000, -7000, -6000, -5000, -4000, -3000, 100], vh)).toBe('end')
    })

    it('the crate turns through «Flip the record» and stays turned on side B', () => {
        expect(flipProgress(900, 600, 800, 'blend')).toBe(0)
        expect(flipProgress(300, 600, 800, 'flip')).toBeCloseTo((600 - 300) / 800)
        expect(flipProgress(-1000, 600, 800, 'flip')).toBe(1)
        expect(flipProgress(5000, 600, 800, 'playlists')).toBe(1)
    })

    it('the caption names the pulled record, or the one in front', () => {
        expect(captionIndex('a1')).toBe(0)
        expect(captionIndex('start')).toBe(2)
        expect(captionIndex('playlists')).toBe(10)
        expect(captionIndex('end')).toBe(13)
        // a crate of 15 (the real set): side A has eight, side B keeps its records
        expect(captionIndex('start', 15)).toBe(2)
        expect(captionIndex('playlists', 15)).toBe(11)
        expect(captionIndex('end', 15)).toBe(14)
        // UAT-290: the caption says the album and the year, without the artist
        expect(captionLine({ a: 'Nas', y: '1994' })).toBe('1994')
        expect(captionLine({ a: 'North Atlas', y: '' })).toBe('álbum fictício')
        expect(captionLine({ a: 'North Atlas', y: '' }, 'en')).toBe('fictional album')
    })
})

describe('the CSS crate', () => {
    it('a crate of 15 shows eight records on side A and the last seven on side B', () => {
        const a = cssCrateLayout('a1', 15)
        expect(a.slice(0, 8).every(p => p.visible)).toBe(true)
        expect(a.slice(8).some(p => p.visible)).toBe(false)
        const b = cssCrateLayout('playlists', 15)
        expect(b.slice(8).every(p => p.visible)).toBe(true)
        expect(b[11].zIndex).toBe('30')
    })

    it('side A faces you on the first track, nothing pulled', () => {
        const places = cssCrateLayout('a1')
        expect(places.slice(0, 7).every(p => p.visible)).toBe(true)
        expect(places.slice(7).some(p => p.visible)).toBe(false)
        expect(places[0].transform).toBe('translate3d(0,0%,0px) rotateX(-6deg)')
    })

    it('a track lifts its record and leans the ones in front of it', () => {
        const places = cssCrateLayout('blend') // pulls record 5
        expect(places[5]).toEqual({ visible: true, transform: 'translate3d(0,-46%,-152px) rotateX(3deg)', zIndex: '30' })
        expect(places[2].transform).toContain('rotateX(-38deg)')
        expect(places[6].transform).toContain('rotateX(-6deg)')
    })

    it('side B is the other seven records, the last one in front', () => {
        const places = cssCrateLayout('end')
        expect(places.slice(0, 7).some(p => p.visible)).toBe(false)
        expect(places[13].transform).toBe('translate3d(0,0%,0px) rotateX(-6deg)')
    })
})

describe('motion', () => {
    it('the 3D comes only to a computer with WebGL, without reduced motion', () => {
        expect(shouldLoad3d({ reduce: false, phone: false, webgl: true, nogl: false })).toBe(true)
        expect(shouldLoad3d({ reduce: true, phone: false, webgl: true, nogl: false })).toBe(false)
        expect(shouldLoad3d({ reduce: false, phone: true, webgl: true, nogl: false })).toBe(false)
        expect(shouldLoad3d({ reduce: false, phone: false, webgl: false, nogl: false })).toBe(false)
        expect(shouldLoad3d({ reduce: false, phone: false, webgl: true, nogl: true })).toBe(false)
    })

    it('the bars of the thread never move in unison', () => {
        const styles = Array.from({ length: 10 }, (_, k) => threadBarStyle(k))
        expect(new Set(styles).size).toBe(10)
        expect(styles[0]).toMatch(/^--h:\d+%;--d:\d\.\d\ds;--o:-\d\.\ds$/)
    })

    it('the automatic motion rests after ten seconds', () => {
        expect(MOTION_WINDOW_MS).toBe(10000)
    })
})

/** The page's body, with the covers of a set, in this jsdom document. */
function loadPage(set = 'fictional') {
    const html = readFileSync(resolve(process.cwd(), 'public/splash.html'), 'utf8')
        .replace('<!--splash:covers-->', coverImagesHtml(set))
        .replace('<!--splash:caption-->', captionHtml(set))
    const served = fillCopy(html, 'pt') // the build writes the Portuguese into the page, as served
    document.body.innerHTML = served.slice(served.indexOf('<body>') + 6, served.indexOf('</body>'))
    document.documentElement.className = ''
    document.documentElement.lang = html.match(/<html lang="([^"]+)"/)[1] // as the page is served, from the first byte
}

function fakeWindow({ reduce = false, phone = false, languages = ['pt-BR'], store = undefined } = {}) {
    const listeners = {}
    class Observer { observe() {} unobserve() {} disconnect() {} }
    return {
        document,
        location: { search: '' },
        innerHeight: 0, // jsdom lays nothing out: every top is 0, and a mark at 0 keeps the first track
        devicePixelRatio: 1,
        Event, CustomEvent,
        IntersectionObserver: Observer,
        ResizeObserver: Observer,
        matchMedia: (q) => ({ matches: (q.includes('reduce') && reduce) || (q.includes('max-width') && phone), addEventListener() {} }),
        navigator: { languages },
        localStorage: store,
        getComputedStyle: () => ({ getPropertyValue: () => '0.72' }),
        requestAnimationFrame: () => 1,
        setTimeout: (fn, ms) => setTimeout(fn, ms),
        clearTimeout: (t) => clearTimeout(t),
        addEventListener: (name, fn) => { (listeners[name] ||= []).push(fn) },
        listeners
    }
}

describe('the page wired', () => {
    beforeEach(() => { vi.useFakeTimers(); loadPage() })
    afterEach(() => { vi.useRealTimers() })

    it('marks the page as scripted, builds the bar and starts on the opening, side A', () => {
        const page = startSplash(fakeWindow())
        expect(document.documentElement.classList.contains('js')).toBe(true)
        expect(document.querySelectorAll('#eqbar i').length).toBeGreaterThanOrEqual(30)
        expect(page.state.track).toBe('a1')
        expect(document.getElementById('who').textContent).toBe('Copper Yearálbum fictício')
        expect(document.querySelectorAll('#box .sl.vis')).toHaveLength(7)
        expect(document.documentElement.lang).not.toBe('en')
    })

    it('the pause icon shows, stops everything and says «Retomar o movimento»; the motion rests by itself', () => {
        startSplash(fakeWindow())
        const html = document.documentElement
        const button = document.getElementById('motion')
        expect(button.hidden).toBe(false)
        expect(html.classList.contains('moving')).toBe(true)
        button.click()
        expect(html.classList.contains('paused')).toBe(true)
        expect(button.getAttribute('aria-label')).toBe(COPY.pt.play)
        expect(button.getAttribute('aria-pressed')).toBe('true')
        button.click()
        expect(button.getAttribute('aria-label')).toBe(COPY.pt.pause)
        vi.advanceTimersByTime(MOTION_WINDOW_MS + 1)
        expect(html.classList.contains('moving')).toBe(false)
    })

    it('with reduced motion nothing moves and the pause icon is hidden', () => {
        startSplash(fakeWindow({ reduce: true }))
        expect(document.documentElement.classList.contains('moving')).toBe(false)
        expect(document.getElementById('motion').hidden).toBe(true)
    })

    it('on the phone each story brings its record with its credit', () => {
        loadPage('real')
        startSplash(fakeWindow({ phone: true }))
        const slot = document.querySelector('#blend .slot')
        expect(slot.querySelector('img').alt).toBe('')
        // UAT-285: the credit is text beside the SAME button as the caption's, never a text link; UAT-286: the text is the album's name only
        const credit = slot.querySelector('.slot-am')
        expect(credit.querySelector('.slot-who').textContent).toBe('Dummy')
        expect(slot.querySelector('a.slot-am')).toBeNull()
        expect(slot.hasAttribute('aria-hidden')).toBe(false)
    })

    it('on the phone every album link is the caption\'s button: one class, same icon, name that says the album (UAT-285)', () => {
        loadPage('real')
        startSplash(fakeWindow({ phone: true }))
        const caption = document.getElementById('am')
        const links = [...document.querySelectorAll('.slot .slot-am a')]
        expect(links).toHaveLength(5)
        for (const a of links) {
            expect(a.className).toBe(caption.className)
            expect(a.querySelector('.mk').textContent).toBe(caption.querySelector('.mk').textContent)
            expect(a.querySelector('.mk').getAttribute('aria-hidden')).toBe('true')
            expect(a.target).toBe('_blank')
            expect(a.rel).toBe('noopener')
            expect(a.textContent).toContain(COPY.pt['c.listen'])
            // UAT-286: the text beside the button is the album only; the button's name still says the album AND the artist
            const who = a.closest('.slot-am').querySelector('.slot-who').textContent
            expect(who).not.toContain(' · ')
            expect(a.getAttribute('aria-label')).toMatch(new RegExp(`^${COPY.pt['c.listen']}: .+, .+ \\(abre numa nova aba\\)$`))
            expect(a.getAttribute('aria-label').startsWith(`${COPY.pt['c.listen']}: ${who}, `)).toBe(true)
            expect(a.closest('.slot-am').querySelector('.slot-who').contains(a)).toBe(false)
        }
    })

    it('the button of a phone record follows the language (UAT-285)', () => {
        loadPage('real')
        startSplash(fakeWindow({ phone: true }))
        document.querySelector('[data-lang="en"]').click()
        const a = document.querySelector('#blend .slot .slot-am a')
        expect(a.textContent).toContain(COPY.en['c.listen'])
        expect(a.getAttribute('aria-label')).toBe(`${COPY.en['c.listen']}: Dummy, Portishead${COPY.en['c.newtab']}`)
        expect(a.closest('.slot-am').querySelector('.slot-who').textContent).toBe('Dummy')
    })

    it('the crate\'s caption says the album and the year, not the artist; its button still names the artist (UAT-290)', () => {
        loadPage('real')
        startSplash(fakeWindow())
        const who = document.getElementById('who')
        expect(who.querySelector('b').textContent).toBe('The Velvet Underground & Nico')
        expect(who.textContent).toBe('The Velvet Underground & Nico1967')
        expect(document.getElementById('am').getAttribute('aria-label')).toBe(`${COPY.pt['c.listen']}: The Velvet Underground & Nico, The Velvet Underground & Nico${COPY.pt['c.newtab']}`)
        expect(document.querySelector('.caption .src').textContent).toBe(COPY.pt['c.src'])
    })

    it('the page has one rule of the button (.am) and the phone record\'s credit reuses it (UAT-285)', () => {
        const page = readFileSync(resolve(process.cwd(), 'public/splash.html'), 'utf8')
        expect(page.match(/^\.am\{/gm)).toHaveLength(1)
        expect(page).toMatch(/^\.am\{[^}]*min-height:44px/m)
        expect(page).not.toMatch(/slot-am[^{]*\{[^}]*text-decoration:underline/)
        // the album and the artist beside it may shrink and wrap, and never push the button out of the column
        expect(page).toMatch(/\.slot-who\{[^}]*min-width:0/)
    })

    it('on the phone the credit has the columns of the story above it: the album under the record, the button under the visual, as wide as it (UAT-286)', () => {
        const page = readFileSync(resolve(process.cwd(), 'public/splash.html'), 'utf8')
        const lead = page.match(/^ {2}\.v4-lead\{[^}]*gap:(\d+)px/m)[1]
        const record = page.match(/^ {2}\.v4-lead \.slot\{[^}]*width:(\d+)px/m)[1]
        const credit = page.match(/^ {2}\.v4-lead \.slot-am\{([^}]*)\}/m)[1]
        expect(credit).toContain(`grid-template-columns:${record}px minmax(0,1fr)`)
        expect(credit).toContain(`column-gap:${lead}px`)
        const button = page.match(/^ {2}\.slot-am \.am\{([^}]*)\}/m)[1]
        expect(button).toContain('width:100%')
        expect(button).toContain('box-sizing:border-box')
        expect(Number(button.match(/font-size:(\d+)px/)[1])).toBeGreaterThanOrEqual(12)
        expect(button).not.toMatch(/min-height|white-space/) // still 44 px high and on one line, from the one rule of .am
    })

    it('on a computer the CSS crate turns to the same diagonal as the 3D one; on the phone it does not (UAT-235)', () => {
        startSplash(fakeWindow())
        expect(document.getElementById('crate-css').style.getPropertyValue('--yaw')).toBe('-15deg')
        loadPage()
        startSplash(fakeWindow({ phone: true }))
        expect(document.getElementById('crate-css').style.getPropertyValue('--yaw')).toBe('')
        expect(document.getElementById('scene').style.marginRight).toBe('')
    })

    it('fictional records on the phone carry their tag and no link', () => {
        startSplash(fakeWindow({ phone: true }))
        const credit = document.querySelector('#start .slot .slot-am')
        expect(credit.tagName).toBe('SPAN')
        expect(credit.textContent).toBe(`Lantern Hymnal · The Hollow Lanterns — ${COPY.pt['c.fictional']}`)
    })
})

describe('the language and the account, wired (UAT-240, UAT-241)', () => {
    const accountStore = () => {
        const key = `${USER_KEY_PREFIX}AIzaFake:[DEFAULT]`
        return { length: 1, key: () => key, getItem: () => JSON.stringify({ uid: 'u1', isAnonymous: false }), setItem() {}, removeItem() {} }
    }
    beforeEach(() => { vi.useFakeTimers(); loadPage() })
    afterEach(() => { vi.useRealTimers() })

    const englishStore = () => ({ getItem: () => 'en', setItem() {} })

    it('a browser in English still opens the page in Portuguese; the switch changes it and remembers the choice', () => {
        const saved = {}
        const store = { getItem: (k) => saved[k] ?? null, setItem: (k, v) => { saved[k] = v } }
        startSplash(fakeWindow({ languages: ['en-US'], store }))
        expect(document.documentElement.lang).toBe('pt-BR')
        expect(document.getElementById('h1').innerHTML).toBe(COPY.pt['h.title'])
        expect(saved['albumblender:lang']).toBeUndefined()
        document.querySelector('[data-lang="en"]').click()
        expect(document.documentElement.lang).toBe('en')
        expect(document.getElementById('h1').innerHTML).toBe(COPY.en['h.title'])
        expect(saved['albumblender:lang']).toBe('en')
        expect(document.querySelector('[data-lang="en"]').getAttribute('aria-pressed')).toBe('true')
        document.querySelector('[data-lang="pt"]').click()
        expect(document.documentElement.lang).toBe('pt-BR')
        expect(saved['albumblender:lang']).toBe('pt')
    })

    it('a remembered English choice opens the page in English', () => {
        startSplash(fakeWindow({ languages: ['pt-BR'], store: englishStore() }))
        expect(document.documentElement.lang).toBe('en')
        expect(document.getElementById('h1').innerHTML).toBe(COPY.en['h.title'])
    })

    it('the caption and the pause label follow the language', () => {
        startSplash(fakeWindow({ store: englishStore() }))
        expect(document.getElementById('who').textContent).toBe('Copper Yearfictional album')
        expect(document.getElementById('motion').getAttribute('aria-label')).toBe(COPY.en.pause)
    })

    it('the caption of the front record follows the language, on the phone too', () => {
        startSplash(fakeWindow({ phone: true, store: englishStore() }))
        expect(document.getElementById('who').textContent).toBe('Copper Yearfictional album')
        document.querySelector('[data-lang="pt"]').click()
        expect(document.getElementById('who').textContent).toBe('Copper Yearálbum fictício')
    })

    it('signed out (the default) the menu scrolls to the stories', async () => {
        startSplash(fakeWindow())
        await vi.advanceTimersByTimeAsync(0)
        expect(document.documentElement.classList.contains('in')).toBe(false)
        expect(document.querySelector('.stop[data-for="albums"]').getAttribute('href')).toBe('#albums')
    })

    it('signed in (an account in the browser) the page shows the menu and the «Criar» button; an item goes to its screen', async () => {
        startSplash(fakeWindow({ store: accountStore() }))
        await vi.advanceTimersByTimeAsync(0)
        expect(document.documentElement.classList.contains('in')).toBe(true)
        expect(document.querySelector('.stop[data-for="playlists"]').getAttribute('href')).toBe('/saved-playlists')
        expect(document.querySelector('.btn-start').getAttribute('href')).toBe('/start')
    })
})
