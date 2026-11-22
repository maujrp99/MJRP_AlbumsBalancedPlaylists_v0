/**
 * The states of the album window (shared by the albums and the inventory screens, with the value section of the inventory), of the window
 * to edit an inventory item and of the window to add an album to the inventory, that F83 wave 6b checks, written once so the windows as they
 * were (hand-made: ViewAlbumModal, InventoryValueSection, TracksRankingComparison, TracksTable, TracksTabs, InventoryEditModal,
 * InventoryAddModal) and as they are (React) are asked the same thing: the same albums and items, the same answers of the sources, the album
 * load, the host of the value section and the inventory service, the same clicks, letters, keys and turns of the phone, and what stands over
 * the page after each step (every element of `body` but `#app`), where the focus is, and EVERY call made to what is outside the window.
 *
 * The windows are opened through `h.open` (what the runner gives: the old classes or the new ones); the rest is the same for both.
 * `normalize` is the one of the earlier waves (attributes sorted, classes as a set, the style as the browser writes it) with two changes: a
 * field is compared by what it HOLDS (the value typed, the radio chosen, the option chosen), not by the attribute, and a no-break space is kept
 * visible (`⍽`).
 *
 * Used by: reports/evidence/F83/wave-6b/capture-before.test.js (run once, on the hand-made windows, before they were deleted; it wrote
 * test/fixtures/albumWindowBeforeF83.json) and test/ui/albumWindow/AlbumWindow.sameAsBefore.test.tsx (the React windows, against that file).
 */
import { vi } from 'vitest'
import { outside, held, world } from './albumWindowStandIns.js'
import { releasePageScroll } from '../../public/js/utils/pageScrollLock.js'

export { outside, held, world }

// ---------------------------------------------------------------------------------------------- what the page says

const valueOf = (element, name, value) => {
    if (name === 'style') return element.style.cssText
    if (name === 'class') return value.split(/\s+/).filter(Boolean).sort().join(' ')
    return value
}
// an empty `style` says nothing (a piece of React writes no attribute where the old HTML wrote style=""); a field is compared by what it holds,
// not by the attribute that wrote it (React writes `value` and `checked` as properties, the old windows as attributes)
const isStateAttribute = (element, name) => (
    (name === 'selected' && element.tagName === 'OPTION')
    || (name === 'checked' && element.tagName === 'INPUT')
    || (name === 'value' && (element.tagName === 'TEXTAREA' || (element.tagName === 'INPUT' && element.type !== 'radio')))
)
const attributesOf = (element) => [...element.attributes].map(({ name, value }) => [name, valueOf(element, name, value)])
    .filter(([name, value]) => !(name === 'style' && value === '') && !isStateAttribute(element, name))
    .sort(([a], [b]) => a.localeCompare(b)).map(([name, value]) => ` ${name}="${value}"`).join('')
const fingerprint = (text) => {
    let hash = 2166136261
    for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619)
    return (hash >>> 0).toString(36)
}
function describe(node) {
    if (node.nodeType === 3) return node.textContent.replace(/\u00a0/g, '⍽').replace(/\s+/g, ' ')
    if (node.nodeType !== 1) return ''
    const tag = node.tagName.toLowerCase()
    // what a text area holds is its value (read below), not the text a browser or React may put inside it
    const inner = tag === 'textarea' ? '' : [...node.childNodes].map(describe).join('')
    const state = tag === 'input' && node.type === 'radio' ? ` [checked=${node.checked}]` : tag === 'input' ? ` [held=${node.value}]` : tag === 'textarea' ? ` [held=${node.value}]` : tag === 'select' ? ` [chosen=${node.value}]` : ''
    const whole = `<${tag}${attributesOf(node)}>${inner}</${tag}>${state}`
    return tag === 'svg' ? `<svg class="${node.getAttribute('class')}" shape="${fingerprint(whole.replace(/>\s+</g, '><'))}"/>` : whole
}

/** A piece of the page as the proof compares it. */
export function normalize(element) {
    if (!element) return null
    const copy = element.cloneNode(true)
    const live = [...element.querySelectorAll('input, textarea, select')]
    copy.querySelectorAll('input, textarea, select').forEach((field, i) => {
        // a clone does not keep what was typed: write it back as a property, so `describe` reads it
        if (field.tagName === 'SELECT') field.value = live[i].value
        else if (field.type === 'radio') field.checked = live[i].checked
        else field.value = live[i].value
    })
    copy.querySelectorAll('[data-legacy-host]').forEach(host => host.replaceWith(...host.childNodes))
    copy.normalize()
    // the state of a field is written after its tag: the white space between that and the next tag is not drawn
    return describe(copy).replace(/>\s+</g, '><').replace(/(\[(?:held|checked|chosen)=[^\]]*\]) +</g, '$1<').trim()
}

/** What stands in `body` over the page (windows, sheets, notices), in the order it was put there. */
export const layerOf = () => [...document.body.children]
    .filter(element => element.id !== 'app' && element.id !== 'globalProgress')
    .map(element => normalize(element))
    .join('\n')

/** Where the focus is, as words. */
export const focusOf = () => {
    const active = document.activeElement
    if (!active || active === document.body) return 'the page'
    const mark = active.id ? `#${active.id}` : `.${[...active.classList].join('.')}`
    const which = active.dataset?.action ? `[action=${active.dataset.action}]` : active.dataset?.tab ? `[tab=${active.dataset.tab}]` : active.dataset?.sort ? `[sort=${active.dataset.sort}]` : ''
    return `${active.tagName.toLowerCase()}${mark}${which}`
}

/** The window of the phone as the windows read it, and a way to turn it into a computer and back. */
export function asPhone(phone) {
    const listeners = []
    const state = { phone }
    window.scrollTo = vi.fn()
    Element.prototype.scrollIntoView = vi.fn()
    window.matchMedia = vi.fn((query) => ({
        get matches() { return /max-width/.test(query) && state.phone },
        addEventListener: (_type, listener) => { if (/max-width/.test(query)) listeners.push(listener) },
        removeEventListener: (_type, listener) => { const i = listeners.indexOf(listener); if (i >= 0) listeners.splice(i, 1) }
    }))
    return { turn: (to) => { state.phone = to; [...listeners].forEach(listener => listener({ matches: to })) } }
}

/** The eye that tells the bar of the phone the title of the header went out of sight: a scenario fires it by hand. */
const observers = []
class WatchedEye {
    constructor(listener) { this.listener = listener; observers.push(this) }
    observe(node) { outside.push(['eye.observe', node.tagName.toLowerCase()]) }
    disconnect() { outside.push(['eye.disconnect']) }
}

// ---------------------------------------------------------------------------------------------- the world

export const NOW = '2026-11-20T15:30:00.000Z'
const json = (value) => JSON.stringify(value)
const RATES = { rates: { USD: 1, EUR: 0.91, GBP: 0.76, BRL: 5.89 }, date: '2026-11-19' }
const RELEASE = { id: 249504, title: 'Harvest 1984, Europe', url: 'https://www.discogs.com/release/249504' }
const USD = { currency: 'USD', rates: RATES }
const EUR = { currency: 'EUR', rates: RATES }
const BRL = { currency: 'BRL', rates: RATES }

const TRACKS = () => [
    { title: 'So Far Away', position: 1, duration: 300, artist: 'Dire Straits' },
    { title: 'Money for Nothing', position: 2, duration: 508, artist: 'Dire Straits feat. Sting', rating: 92.4, rank: 1, spotifyPopularity: 81, spotifyRank: 1, userRank: 2 },
    { title: 'Walk of Life', position: 3, duration: 252, rating: 75, rank: 3, spotifyPopularity: 66, userRank: 1 },
    { title: 'Your Latest Trick', position: 4, duration: 393, rank: 2, spotifyPopularity: 40 },
    { title: 'Why Worry', position: 12, duration: 570 }
]
const ALBUM = (extra = {}) => ({ id: 'dire-straits_brothers-in-arms', title: 'Brothers In Arms', artist: 'Dire Straits', year: 1985, coverUrl: 'https://covers.example/bia.jpg', tracks: TRACKS(), ...extra })
const NO_TRACKS = (extra = {}) => ({ id: 'pf-dsotm', title: 'The Dark Side of the Moon', artist: 'Pink Floyd', year: 1973, ...extra })

/** An inventory item: it keeps its album in `albumData`, and what the person wrote. */
const ITEM = (extra = {}, album = NO_TRACKS({ coverUrl: 'https://covers.example/pf.jpg' })) => ({
    id: 'owned', artist: 'Pink Floyd', title: 'The Dark Side of the Moon', owned: true, format: 'cd', purchasePrice: 60, currency: 'BRL', notes: 'a first press', albumData: album, ...extra
})

/** The album load as the albums screen gives it to the window. */
const sourcesOf = (state) => {
    const listeners = new Set()
    let now = state
    return {
        read: () => now,
        ask: (albumId, source) => { outside.push(['sources.ask', albumId, source]) },
        watch: (listener) => { outside.push(['sources.watch']); listeners.add(listener); return () => { outside.push(['sources.unwatch']); listeners.delete(listener) } },
        change(next) { now = next; [...listeners].forEach(listener => listener()) }
    }
}

/** The album of now, as the inventory asks it: answers when the scenario lets it go; says when the window dropped the ask. */
const loaderOf = (answer, gate = null) => (signal) => {
    outside.push(['loadAlbum', Boolean(signal)])
    signal.addEventListener('abort', () => outside.push(['loadAlbum.aborted']))
    return (async () => {
        if (gate) await gate.promise
        const given = typeof answer === 'function' ? answer() : answer
        if (given instanceof Error) throw given
        return given
    })()
}

// the value section: what its host shows now, and what it is asked
const shown = { value: null, money: USD, source: 'on', busy: false }
const showing = (value, money = USD, extra = {}) => { Object.assign(shown, { value, money, source: 'on', busy: false, ...extra }) }
const valueHost = (answers = {}) => ({
    view: () => ({ ...shown }),
    onWrite: async (text) => { outside.push(['host.onWrite', text]); if (answers.write) await answers.write.promise; return answers.writes ?? true },
    onForget: async () => { outside.push(['host.onForget']) },
    onRead: async () => { outside.push(['host.onRead']); if (answers.read) await answers.read.promise }
})

const CONDITIONS = { mint: 14.5, nearMint: 11.2, veryGoodPlus: 7.9 }
const DISCOGS = (extra = {}) => ({ origin: 'discogs', currency: 'USD', conditions: CONDITIONS, release: RELEASE, readAt: '2026-11-18T10:00:00.000Z', ...extra })
const LOWEST = (extra = {}) => ({ origin: 'discogs', basis: 'lowest_for_sale', amount: 12.93, currency: 'USD', forSale: 37, release: RELEASE, readAt: '2026-11-19T10:00:00.000Z', ...extra })
const NONE = (reason, extra = {}) => ({ origin: null, reason, ...extra })

const STATE = (ratings, popularity, extra = {}) => ({ ratings, popularity, ...extra })

// ---------------------------------------------------------------------------------------------- the harness

const tick = () => new Promise(resolve => setImmediate(resolve))

/** Everything a scenario starts from. */
export function prepare(scenario) {
    releasePageScroll()
    world.reset()
    localStorage.clear()
    outside.length = 0
    showing(NONE('never_read'))
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(NOW))
    observers.length = 0
    globalThis.IntersectionObserver = scenario.eye ? WatchedEye : undefined
    return asPhone(Boolean(scenario.phone))
}

export const keyOf = (scenario) => `${scenario.phone ? 'phone' : 'computer'} · ${scenario.name}`

/**
 * What a scenario is given. `open` is the way the windows are opened (hand-made or React); `act` lets React finish what a change set going
 * (the hand-made windows need nothing).
 */
export function harness({ open, act, phone, snaps }) {
    const settleAfter = async (change) => { await act(async () => { await change(); for (let i = 0; i < 6; i++) await tick() }) }
    const at = (selector, index = 0) => {
        const found = document.querySelectorAll(selector)[index]
        if (!found) throw new Error(`nothing matches ${selector}[${index}]`)
        return found
    }
    const writeValue = (field, value) => { Object.getOwnPropertyDescriptor(field.constructor.prototype, 'value').set.call(field, value) }
    const h = {
        phone,
        snap: (label) => { snaps[label] = layerOf(); snaps[`focus · ${label}`] = focusOf() },
        note: (label) => { snaps[`calls · ${label}`] = json(outside.splice(0)) },
        has: (selector) => document.querySelectorAll(selector).length,
        /** a window, opened the way the screen opens it; `redrawValue` of the handle is the controller telling the window the value changed */
        view: async (input, options = {}) => { let handle; await settleAfter(async () => { handle = await open.view(input, options) }); return handle },
        edit: (item, onSave) => settleAfter(async () => { await open.edit(item, onSave) }),
        add: (album, onSuccess) => settleAfter(async () => { await open.add(album, onSuccess) }),
        settle: (ms = 0) => settleAfter(async () => { if (ms) await new Promise(resolve => setTimeout(resolve, ms)) }),
        /** the 200 ms the window takes to leave, for real */
        leave: () => settleAfter(() => new Promise(resolve => setTimeout(resolve, 260))),
        click: (selector, index = 0) => settleAfter(() => { const node = at(selector, index); node.focus(); node.click() }),
        /** a click that is not on a control: the backdrop, a part of the window */
        clickAt: (selector, index = 0) => settleAfter(() => { at(selector, index).click() }),
        type: (selector, value, index = 0) => settleAfter(() => {
            const field = at(selector, index)
            field.focus()
            writeValue(field, value)
            try { field.setSelectionRange?.(value.length, value.length) } catch { /* a number field has no caret */ }
            field.dispatchEvent(new Event('input', { bubbles: true }))
        }),
        select: (selector, value, index = 0) => settleAfter(() => {
            const field = at(selector, index)
            field.focus()
            writeValue(field, value)
            field.dispatchEvent(new Event('change', { bubbles: true }))
        }),
        key: (key, selector = null) => settleAfter(() => {
            const target = selector ? at(selector) : document
            target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
        }),
        /** the screen is turned: a phone becomes a computer and back */
        turn: (to) => settleAfter(() => phone.turn(to)),
        /** the eye of the bar says the title of the header is out of sight (or back) */
        scrolled: (out) => settleAfter(() => observers.forEach(eye => eye.listener([{ isIntersecting: !out }]))),
        act: (work) => settleAfter(async () => work()),
        /** what the world outside answers next */
        world,
        value: { show: showing, host: valueHost, DISCOGS, LOWEST, NONE, USD, EUR, BRL, RELEASE },
        album: ALBUM, noTracks: NO_TRACKS, item: ITEM, sourcesOf, loaderOf, state: STATE, held
    }
    return h
}

// ---------------------------------------------------------------------------------------------- the scenarios

const COLUMNS = ['position', 'title', 'userRank', 'rank', 'spotifyPopularity', 'duration']
const CLOSE_X = 'button[data-action="close"]'
const CLOSE_BAR = '.album-window__close'

export const SCENARIOS = [
    // ---- the window opened by the albums screen: the sources
    {
        name: 'the album window of the albums screen: good sources, the table, close by «Close»',
        async run(h) {
            const sources = h.sourcesOf(h.state('done', 'done'))
            await h.view(h.album(), { sources })
            h.snap('open')
            h.note('open')
            await h.click('.modal-footer button')
            h.snap('closing')
            await h.leave()
            h.snap('closed')
            h.note('closed')
        }
    },
    {
        name: 'ratings failed: «Did not answer» and «Try again» asks the load for the acclaim',
        async run(h) {
            await h.view(h.album(), { sources: h.sourcesOf(h.state('failed', 'done')) })
            h.snap('open')
            await h.click('.ratings-notice button')
            h.snap('asked')
            h.note('asked')
        }
    },
    {
        name: 'popularity failed: «Try again» asks for the popularity; an album with a Spotify id says nothing',
        async run(h) {
            await h.view(h.album(), { sources: h.sourcesOf(h.state('done', 'failed')) })
            h.snap('open')
            await h.click('.popularity-notice button')
            h.snap('asked')
            h.note('asked')
            await h.click(CLOSE_X)
            await h.leave()
            await h.view(h.album({ spotifyId: 'sp1' }), { sources: h.sourcesOf(h.state('done', 'failed')) })
            h.snap('with a spotify id')
        }
    },
    {
        name: 'the sources: not connected, none, asking, and the load changing under the open window',
        async run(h) {
            const sources = h.sourcesOf(h.state('pending', 'not_connected'))
            await h.view(h.album(), { sources })
            h.snap('asking, not connected')
            await h.act(() => sources.change(h.state('done', 'empty')))
            h.snap('done, none')
            await h.click('.popularity-notice button')
            h.note('ask again')
            await h.act(() => sources.change(h.state('failed', 'loading')))
            h.snap('failed, loading')
            await h.act(() => sources.change(h.state('done', 'done', { album: ALBUM({ tracks: [{ title: 'Only One', position: 1, duration: 61, rating: 50, spotifyPopularity: 10 }] }) })))
            h.snap('done, a new album')
            await h.click(CLOSE_X)
            h.note('closing')
            await h.leave()
            h.note('closed')
        }
    },
    {
        name: 'no sources: no notice at all',
        async run(h) {
            await h.view(h.album(), {})
            h.snap('open')
            await h.click(CLOSE_X)
            await h.leave()
            h.snap('closed')
        }
    },
    // ---- closing
    {
        name: 'closing: the cross, the backdrop, Escape, and a click inside that closes nothing',
        async run(h) {
            await h.view(h.album(), {})
            await h.clickAt('.modal-container')
            h.snap('a click inside')
            await h.clickAt('.modal-content')
            await h.key('a')
            h.snap('another key')
            await h.click(CLOSE_X)
            h.snap('cross, closing')
            await h.leave()
            h.snap('cross, closed')
            await h.view(h.album(), {})
            await h.clickAt('.modal-overlay')
            h.snap('backdrop, closing')
            await h.leave()
            h.snap('backdrop, closed')
            await h.view(h.album(), {})
            await h.key('Escape')
            h.snap('escape, closing')
            await h.leave()
            h.snap('escape, closed')
            await h.key('Escape')
            h.snap('a second escape')
        }
    },
    {
        name: 'two windows at once: Escape closes both',
        async run(h) {
            await h.view(h.album(), {})
            await h.view(h.album({ id: 'second', title: 'Second' }), {})
            h.snap('two')
            await h.key('Escape')
            await h.leave()
            h.snap('none')
        }
    },
    // ---- an item of the inventory: the tracks it keeps and the album of now
    {
        name: 'an item with no tracks: «Loading the tracks», then the album of now with its tracks and its cover',
        async run(h) {
            const gate = h.held()
            await h.view(h.item({}, h.noTracks()), { loadAlbum: h.loaderOf(() => ALBUM({ id: 'pf-dsotm', title: 'The Dark Side of the Moon', artist: 'Pink Floyd', coverUrl: 'https://covers.example/arrived.jpg' }), gate) })
            h.snap('loading')
            h.note('loading')
            await h.act(() => gate.release())
            await h.settle()
            h.snap('they came')
            h.note('came')
        }
    },
    {
        name: 'an item with a cover keeps its cover when the album of now has another',
        async run(h) {
            await h.view(h.item(), { loadAlbum: h.loaderOf(() => ALBUM({ id: 'pf-dsotm', coverUrl: 'https://covers.example/other.jpg' })) })
            await h.settle()
            h.snap('came')
        }
    },
    {
        name: 'an item whose album could not be loaded: the tracks could not be loaded (null, and a failure)',
        async run(h) {
            await h.view(h.item({}, h.noTracks()), { loadAlbum: h.loaderOf(() => null) })
            await h.settle()
            h.snap('null')
            await h.click(CLOSE_X)
            await h.leave()
            await h.view(h.item({}, h.noTracks()), { loadAlbum: h.loaderOf(() => new Error('offline')) })
            await h.settle()
            h.snap('failure')
            h.note('failure')
        }
    },
    {
        name: 'an item that keeps tracks shows them at once, and the album of now takes their place; one that came empty leaves them',
        async run(h) {
            const gate = h.held()
            await h.view(h.item({}, ALBUM()), { loadAlbum: h.loaderOf(() => ALBUM({ tracks: [{ title: 'Newer', position: 1, duration: 100 }] }), gate) })
            h.snap('kept')
            await h.act(() => gate.release())
            await h.settle()
            h.snap('replaced')
            await h.click(CLOSE_X)
            await h.leave()
            await h.view(h.item({}, ALBUM()), { loadAlbum: h.loaderOf(() => NO_TRACKS()) })
            await h.settle()
            h.snap('the album of now came empty')
        }
    },
    {
        name: 'an item with no load and no tracks says none are kept',
        async run(h) {
            await h.view(h.item({}, h.noTracks()), {})
            h.snap('none')
        }
    },
    {
        name: 'closed before the album came: the ask is dropped and nothing is drawn',
        async run(h) {
            const gate = h.held()
            await h.view(h.item({}, h.noTracks()), { loadAlbum: h.loaderOf(() => ALBUM(), gate) })
            await h.click(CLOSE_X)
            h.note('closing')
            await h.act(() => gate.release())
            await h.leave()
            h.snap('closed')
            h.note('closed')
        }
    },
    // ---- the header
    {
        name: 'the header of an owned item in CD paid in BRL, with a condition and notes that are text',
        async run(h) {
            await h.view(h.item({ condition: 'Near Mint', notes: 'a <b>first</b> press & more', purchasePrice: 1234.5 }), {})
            h.snap('open')
        }
    },
    {
        name: 'the header of a wanted item in vinyl paid in USD, a wished one with none, an unknown currency (shown with $), a zero price',
        async run(h) {
            await h.view(h.item({ id: 'w', owned: null, format: 'vinyl', currency: 'USD', purchasePrice: 12.5, notes: '' }), {})
            h.snap('wanted, vinyl, usd')
            await h.click(CLOSE_X)
            await h.leave()
            await h.view(h.item({ id: 'x', owned: false, format: 'digital', currency: 'EUR', purchasePrice: 19.99, notes: null }), {})
            h.snap('wished, digital, eur')
            await h.click(CLOSE_X)
            await h.leave()
            await h.view(h.item({ id: 'y', owned: true, format: null, currency: null, purchasePrice: 8, notes: null }), {})
            h.snap('no format, no currency')
            await h.click(CLOSE_X)
            await h.leave()
            await h.view(h.item({ id: 'z', owned: true, format: 'cd', currency: 'GBP', purchasePrice: 0 }), {})
            h.snap('a price of zero, gbp')
            await h.click(CLOSE_X)
            await h.leave()
            await h.view(h.item({ id: 'k', purchasePrice: 0.005, currency: 'BRL' }), {})
            h.snap('half a cent, brl')
        }
    },
    {
        name: 'an album with no cover shows the stand-in; no title and no year',
        async run(h) {
            await h.view({ id: 'bare', tracks: [] }, {})
            h.snap('bare')
        }
    },
    // ---- the table
    {
        name: 'the table: every column in both directions, and the averages with My Avg',
        async run(h) {
            await h.view(h.album(), {})
            h.snap('as it opens')
            for (const column of COLUMNS) {
                await h.click(`.sort-header[data-sort="${column}"]`)
                h.snap(`${column} ·1`)
                await h.click(`.sort-header[data-sort="${column}"]`)
                h.snap(`${column} ·2`)
            }
        }
    },
    {
        name: 'the table: no ranked tracks gives dashes; a track with no popularity is «Not linked»',
        async run(h) {
            await h.view(h.album({ tracks: [{ title: 'One', position: 1, duration: 60 }, { title: 'Two', position: 2, duration: 90, rating: 0 }] }), {})
            h.snap('open')
            await h.click('.sort-header[data-sort="spotifyPopularity"]')
            h.snap('by popularity')
        }
    },
    // ---- the phone
    {
        phone: true,
        eye: true,
        name: 'the phone: the bar with its close, the blurred cover, the tabs, the title that comes to the bar',
        async run(h) {
            await h.view(h.album(), { sources: h.sourcesOf(h.state('done', 'failed')) })
            h.snap('open')
            h.note('open')
            for (const tab of ['acclaim', 'spotify', 'original']) {
                await h.click(`.tracks-tabs__segment[data-tab="${tab}"]`)
                h.snap(`tab ${tab}`)
            }
            await h.scrolled(true)
            h.snap('the title is out of sight')
            await h.scrolled(false)
            h.snap('the title is back')
            await h.click(CLOSE_BAR)
            h.snap('closing')
            await h.leave()
            h.snap('closed')
            h.note('closed')
        }
    },
    {
        phone: true,
        name: 'the phone: no cover, no blurred cover; the cover that comes with the album of now gives it',
        async run(h) {
            const gate = h.held()
            await h.view(h.item({}, h.noTracks()), { loadAlbum: h.loaderOf(() => ALBUM({ id: 'pf-dsotm', coverUrl: 'https://covers.example/arrived.jpg' }), gate) })
            h.snap('no cover')
            await h.act(() => gate.release())
            await h.settle()
            h.snap('the cover came')
        }
    },
    {
        phone: true,
        name: 'the phone: the window is closed with Escape and the backdrop as the computer, and a turn of the screen while open changes nothing',
        async run(h) {
            await h.view(h.album(), {})
            await h.turn(false)
            h.snap('turned to a computer')
            await h.turn(true)
            await h.key('Escape')
            await h.leave()
            h.snap('closed')
        }
    },
    {
        name: 'the computer turned into a phone while the window is open changes nothing',
        async run(h) {
            await h.view(h.album(), {})
            await h.turn(true)
            h.snap('turned to a phone')
        }
    },
    // ---- the value section
    {
        name: 'the value section: every body, as the host draws it again',
        async run(h) {
            const handle = await h.view(h.item(), { value: h.value.host() })
            const draw = async (label, shownNow, money, extra) => {
                h.value.show(shownNow, money, extra)
                await h.act(() => handle.redrawValue())
                h.snap(label)
            }
            h.snap('never read')
            await draw('yours, on', { origin: 'yours', amount: 30, currency: 'USD', at: '2026-10-12T10:00:00.000Z' })
            await draw('yours, off', { origin: 'yours', amount: 30, currency: 'USD', at: '2026-10-12T10:00:00.000Z' }, USD_OFF(), { source: 'off' })
            await draw('yours, no date', { origin: 'yours', amount: 30, currency: 'USD' })
            await draw('discogs suggestion', h.value.DISCOGS())
            await draw('discogs suggestion in EUR', h.value.DISCOGS(), h.value.EUR)
            await draw('discogs, read in EUR shown in USD', h.value.DISCOGS({ currency: 'EUR' }))
            await draw('discogs, busy', h.value.DISCOGS(), h.value.USD, { busy: true })
            await draw('discogs lowest, 37 for sale', h.value.LOWEST())
            await draw('discogs lowest in BRL, none counted', h.value.LOWEST({ forSale: null }), h.value.BRL)
            await draw('none for sale', h.value.NONE('none_for_sale', { release: h.value.RELEASE, readAt: '2026-11-19T10:00:00.000Z' }))
            await draw('no CD edition', h.value.NONE('no_cd_edition', { readAt: '2026-11-19T10:00:00.000Z' }))
            await draw('no suggestion', h.value.NONE('no_suggestion', { release: h.value.RELEASE, readAt: '2026-11-19T10:00:00.000Z' }))
            await draw('no suggestion, a release with no address', h.value.NONE('no_suggestion', { release: { title: 'Odd <i>', url: 'javascript:alert(1)' }, readAt: '2026-11-19T10:00:00.000Z' }))
            await draw('waiting', h.value.NONE('waiting'))
            await draw('waiting, busy', h.value.NONE('waiting'), h.value.USD, { busy: true })
            await draw('reading', h.value.NONE('reading'))
            await draw('failed', h.value.NONE('failed', { failure: 'limit' }))
            await draw('failed, no reason', h.value.NONE('failed'))
            await draw('source off', h.value.NONE('source_off'), USD_OFF(), { source: 'off' })
            await draw('never read', h.value.NONE('never_read'))
            h.note('host')
        }
    },
    {
        name: 'the value section: writing a value, valid; an invalid one; Enter; the way back; reading now',
        async run(h) {
            const read = h.held()
            const handle = await h.view(h.item(), { value: h.value.host({ read }) })
            h.value.show(h.value.DISCOGS())
            await h.act(() => handle.redrawValue())
            await h.type('#inventoryValueInput', '30')
            h.snap('typed')
            await h.click('[data-action="save-value"]')
            h.snap('saved')
            h.note('saved')
            await h.type('#inventoryValueInput', 'abc')
            await h.key('Enter', '#inventoryValueInput')
            h.snap('enter')
            h.note('enter')
            h.value.show({ origin: 'yours', amount: 30, currency: 'USD', at: NOW })
            await h.act(() => handle.redrawValue())
            await h.click('[data-action="forget-value"]')
            h.snap('forgotten')
            h.note('forgotten')
            h.value.show(h.value.DISCOGS())
            await h.act(() => handle.redrawValue())
            await h.type('#inventoryValueInput', '9,5')
            await h.click('[data-action="read-value"]')
            h.snap('reading, while the answer is on its way')
            h.note('reading')
            h.value.show(h.value.NONE('reading'))
            await h.act(() => handle.redrawValue())
            h.snap('the host says reading')
            await h.act(() => read.release())
            await h.settle()
            h.snap('the answer came')
        }
    },
    {
        name: 'the value section: a value written is not cleared when the host says it was not saved; what is typed stays when it is drawn again',
        async run(h) {
            const handle = await h.view(h.item(), { value: h.value.host({ writes: false }) })
            await h.type('#inventoryValueInput', 'zero')
            await h.click('[data-action="save-value"]')
            h.snap('not saved')
            await h.type('#inventoryValueInput', '12.34')
            await h.act(() => handle.redrawValue())
            h.snap('drawn again with the text')
            await h.type('#inventoryValueInput', '55')
            await h.act(() => handle.redrawValue())
            h.snap('drawn again with the focus')
        }
    },
    {
        name: 'the value section in EUR and in BRL: the note, the symbol of the field',
        async run(h) {
            const handle = await h.view(h.item(), { value: h.value.host() })
            for (const money of [h.value.EUR, h.value.BRL, { currency: 'GBP', rates: RATES }]) {
                h.value.show(h.value.DISCOGS(), money)
                await h.act(() => handle.redrawValue())
                h.snap(`field in ${money.currency}`)
            }
        }
    },
    {
        name: '«Where to buy»: the three stores on this album, none for an album with no artist and no title; a click on a store',
        async run(h) {
            await h.view(h.item(), { value: h.value.host() })
            h.snap('stores')
            await h.click('[data-role="where-to-buy"] a')
            h.snap('after a store link')
            await h.click(CLOSE_X)
            await h.leave()
            await h.view({ id: 'x', albumData: { id: 'x', tracks: [] }, owned: true }, { value: h.value.host() })
            h.snap('no artist, no title')
        }
    },
    {
        phone: true,
        name: 'the value on the phone: folded to one line with its credit, opened by a tap; the stores in one row',
        async run(h) {
            const handle = await h.view(h.item(), { value: h.value.host() })
            h.snap('never read')
            h.value.show(h.value.DISCOGS())
            await h.act(() => handle.redrawValue())
            h.snap('discogs, folded')
            await h.click('.value-fold__toggle')
            h.snap('opened')
            await h.click('.value-fold__toggle')
            h.snap('folded again')
            h.value.show({ origin: 'yours', amount: 30, currency: 'USD', at: NOW })
            await h.act(() => handle.redrawValue())
            h.snap('yours')
            h.value.show(h.value.LOWEST(), h.value.EUR)
            await h.act(() => handle.redrawValue())
            h.snap('lowest in EUR')
            h.value.show(h.value.NONE('failed', { failure: 'sign_in' }))
            await h.act(() => handle.redrawValue())
            h.snap('failed')
            await h.type('#inventoryValueInput', '7')
            await h.click('[data-action="save-value"]')
            h.note('saved')
        }
    },
    // ---- the window to edit an item
    {
        name: 'edit: an item that came from a series (no format, no currency, no price): «Not set», every field, save',
        async run(h) {
            const saved = []
            await h.edit({ id: 'inv-1', title: 'Fragile', artist: 'Yes', albumData: { id: 'yes-fragile' } }, async (id, updates) => { outside.push(['onSave', id, json(updates)]); saved.push(id) })
            h.snap('open')
            await h.select('#edit-format', 'vinyl')
            await h.click('input[name="edit-currency"][value="USD"]')
            await h.type('input[type="number"]', '45.5')
            await h.type('textarea', '  a note\nwith two lines  ')
            h.snap('filled')
            await h.click('.app-modal__footer .btn-primary')
            h.snap('saved')
            h.note('saved')
        }
    },
    {
        name: 'edit: an item with a format and a currency and a price: what it holds; save with nothing changed; a price cleared; Not set kept',
        async run(h) {
            await h.edit(h.item({ format: 'bluray', currency: 'USD', purchasePrice: 99.9, notes: 'keep me' }), async (id, updates) => { outside.push(['onSave', id, json(updates)]) })
            h.snap('open')
            await h.click('.app-modal__footer .btn-primary')
            h.snap('saved')
            h.note('saved')
            await h.edit(h.item({ format: null, currency: null, purchasePrice: 0, notes: null }), async (id, updates) => { outside.push(['onSave', id, json(updates)]) })
            h.snap('empty item')
            await h.type('input[type="number"]', '')
            await h.click('.app-modal__footer .btn-primary')
            h.note('saved empty')
        }
    },
    {
        name: 'edit: an item shaped as an album («album» inside) takes its album fields; every format can be chosen',
        async run(h) {
            await h.edit({ id: 'wrapped', album: { id: 'al-1', title: 'Wrapped <i>', artist: 'Someone & Co', format: 'cassette', currency: 'USD', purchasePrice: 5, notes: 'in the album' } }, async (id, updates) => { outside.push(['onSave', id, json(updates)]) })
            h.snap('open')
            for (const format of ['cd', 'vinyl', 'cassette', 'dvd', 'bluray', 'digital']) {
                await h.select('#edit-format', format)
            }
            h.snap('digital')
            await h.click('input[name="edit-currency"][value="BRL"]')
            h.snap('brl')
            await h.click('.app-modal__footer .btn-primary')
            h.note('saved')
        }
    },
    {
        name: 'edit: the save fails: the window stays, the notice says why; a failure with no message',
        async run(h) {
            let fail = new Error('the cloud refused')
            await h.edit(h.item(), async (id, updates) => { outside.push(['onSave', id, json(updates)]); throw fail })
            await h.click('.app-modal__footer .btn-primary')
            h.snap('failed')
            h.note('failed')
            fail = {}
            await h.click('.app-modal__footer .btn-primary')
            h.note('failed, no message')
        }
    },
    {
        name: 'edit: cancel, the cross, Escape and the backdrop (the last two do nothing)',
        async run(h) {
            await h.edit(h.item(), async () => { })
            await h.key('Escape')
            h.snap('escape')
            await h.clickAt('#inventory-edit-modal')
            h.snap('backdrop')
            await h.click('.app-modal__footer .btn-ghost')
            h.snap('cancelled')
            await h.edit(h.item(), async () => { })
            await h.click('.app-modal__close')
            h.snap('cross')
            h.note('none saved')
        }
    },
    {
        phone: true,
        name: 'edit and add on the phone: the same windows',
        async run(h) {
            await h.edit(h.item(), async () => { })
            h.snap('edit')
            await h.click('.app-modal__footer .btn-ghost')
            await h.add(h.album({ id: 'a1' }), () => outside.push(['onSuccess']))
            h.snap('add')
        }
    },
    // ---- the window to add an album
    {
        name: 'add: the defaults (CD, BRL, R$), the album header with and without a year; change every field; add',
        async run(h) {
            await h.add(h.album(), () => outside.push(['onSuccess']))
            h.snap('open')
            await h.select('#add-format', 'vinyl')
            await h.click('input[name="add-currency"][value="USD"]')
            h.snap('usd, the prefix changed')
            await h.type('input[type="number"]', '25.5')
            await h.type('textarea', '  Mint condition  ')
            h.snap('filled')
            await h.click('.app-modal__footer .btn-primary')
            h.snap('added')
            h.note('added')
        }
    },
    {
        name: 'add: no year, no artist; BRL back; no price and no notes',
        async run(h) {
            await h.add({ id: 'bare', title: '' }, () => { })
            h.snap('open')
            await h.click('input[name="add-currency"][value="USD"]')
            await h.click('input[name="add-currency"][value="BRL"]')
            h.snap('brl again')
            await h.click('.app-modal__footer .btn-primary')
            h.note('added')
        }
    },
    {
        name: 'add: the album is already in the inventory (a warning, the window stays); a failure; a failure with no message',
        async run(h) {
            world.addFails = 'Album already in inventory'
            await h.add(h.album(), () => outside.push(['onSuccess']))
            await h.click('.app-modal__footer .btn-primary')
            h.snap('already')
            h.note('already')
            world.addFails = 'the cloud refused'
            await h.click('.app-modal__footer .btn-primary')
            h.snap('failed')
            h.note('failed')
            world.addFails = ''
            await h.click('.app-modal__footer .btn-primary')
            h.snap('worked at last')
            h.note('worked')
        }
    },
    {
        name: 'add: pressed twice during the write adds twice (the button is not disabled)',
        async run(h) {
            world.addGate = h.held()
            await h.add(h.album(), () => outside.push(['onSuccess']))
            await h.click('.app-modal__footer .btn-primary')
            h.snap('writing')
            await h.click('.app-modal__footer .btn-primary')
            h.note('pressed twice')
            await h.act(() => world.addGate.release())
            await h.settle()
            h.snap('done')
            h.note('done')
        }
    },
    {
        name: 'add: cancel, the cross, Escape and the backdrop (the last two do nothing); no callback',
        async run(h) {
            await h.add(h.album(), () => outside.push(['onSuccess']))
            await h.key('Escape')
            await h.clickAt('#inventory-add-modal')
            h.snap('still there')
            await h.click('.app-modal__footer .btn-ghost')
            h.snap('cancelled')
            await h.add(h.album(), undefined)
            await h.click('.app-modal__close')
            h.snap('cross')
            await h.add(h.album(), undefined)
            await h.click('.app-modal__footer .btn-primary')
            h.snap('added with no callback')
            h.note('end')
        }
    }
]

function USD_OFF() { return { currency: 'USD', rates: null } }
