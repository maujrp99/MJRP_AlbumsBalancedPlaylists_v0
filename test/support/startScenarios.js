/**
 * The states of the Start screen (/start, the old Home) that F83 wave 4 checks, written once so the screen as it was (hand-made) and
 * the screen as it is (React) are asked the same thing: the same catalog answers, the same clicks and keys, and what stands in `#app`
 * (and in the sheet the phone opens over the page) after each step, together with where the focus is. `normalize` is the one of wave 2.
 *
 * The catalog (`catalog`) and the series service (`writer`) are stand-ins the scenario controls: an answer can be held until the
 * scenario lets it go (`h.answer`, `h.fail`), which is how «searching» and «creating» are looked at. What the screen asked of the
 * world outside (the search, the writing of the series, the move to another screen, the sign-in window) is written down in `outside`.
 *
 * Used by: reports/evidence/F83/wave-4/capture-before.test.js (run once, on the hand-made screen, before it was deleted; it wrote
 * test/fixtures/startBeforeF83.json) and test/screens/start/Start.sameAsBefore.test.tsx (the React screen, against that file).
 */
import { vi } from 'vitest'
import { normalize as pageOf } from './savedPlaylistsScenarios.js'
import { router } from '../../public/js/router.js'
import { loginWindowStore } from '../../public/js/stores/loginWindow.js'

/**
 * The page as the proof compares it: the text of a field as the field holds it now, read from a COPY (the live page is not touched).
 * What stands inside a block that is `hidden` is not compared (the block itself is, with its attributes): the old screen wrote into the
 * blocks it hid and left there what it wrote the last time, which nobody saw; the blocks it shows are written again every time they show.
 */
export const normalize = (element) => {
    if (!element) return null
    const copy = element.cloneNode(true)
    const typed = element.querySelectorAll('input')
    copy.querySelectorAll('input').forEach((input, i) => input.setAttribute('value', typed[i].value))
    copy.querySelectorAll('[hidden]').forEach(block => block.replaceChildren())
    return pageOf(copy)
}

/** Where the focus is, as words: the tag, the id, and what tells a control from another. */
export const focusOf = () => {
    const active = document.activeElement
    if (!active || active === document.body) return 'the page'
    const mark = active.id ? `#${active.id}` : active.dataset?.dock ? `[data-dock=${active.dataset.dock}${active.dataset.id ? ` id=${active.dataset.id}` : ''}]` : `.${[...active.classList].join('.')}`
    return `${active.tagName.toLowerCase()}${mark}`
}

const album = (id, title, year, type = 'Album', coverUrl = `https://img/${id}/{w}x{h}.jpg`, artist = 'Pink Floyd') =>
    ({ id, title, artist, year: String(year), releaseDate: `${year}-06-01`, type, coverUrl })

/** An artist with every type of album, so the chips have counts and the cards have badges. Two have no cover. */
export const FLOYD = [
    album('a0', 'The Endless River', 2014), album('a1', 'The Division Bell', 1994), album('a2', 'A Momentary Lapse of Reason', 1987),
    album('a3', 'The Final Cut', 1983), album('a4', 'The Wall', 1979, 'Album', null), album('a5', 'Animals', 1977),
    album('a6', 'Wish You Were Here', 1975), album('a7', 'The Dark Side of the Moon Deluxe Remaster', 1973),
    album('a8', 'Obscured by Clouds', 1972), album('s0', 'Arnold Layne', 1967, 'Single', null), album('l0', 'Pulse', 1995, 'Live'),
    album('e0', 'Relics', 1971, 'EP'), album('c0', 'A Collection of Great Dance Songs', 1981, 'Compilation'), album('u0', 'Odd Thing', 1990, 'Mystery')
]
export const ONE = [album('p0', 'Crooked Rain', 1994, 'Album', 'https://img/p0/{w}x{h}.jpg', 'Pavement')]

export const outside = []

const standard = () => ({
    scanArtist: async () => ({ albums: FLOYD, reclassified: null }),
    search: async (artist, title) => (/Pinkk$/.test(title) ? [] : [{ id: `x-${title}`, title, artist, year: 1976, coverUrl: null }]),
    createSeries: async () => ({ id: 's-new' })
})
/** What the catalog and the series service do now: a scenario changes it with `control`, and `reset` puts it back. */
export const behaviour = standard()

export const catalogStandIn = {
    albumSearchService: {
        scanArtist: (text) => { outside.push(['scanArtist', text]); return behaviour.scanArtist(text) },
        search: (artist, title, options) => { outside.push(['search', artist, title]); return behaviour.search(artist, title, options) }
    }
}
export const seriesStandIn = {
    getSeriesService: () => ({ createSeries: (series) => { outside.push(['createSeries', series.name, series.albumQueries.length]); return behaviour.createSeries(series) } })
}

/** A promise a scenario lets go of when it says so. */
export const held = () => {
    let release
    let refuse
    const promise = new Promise((resolve, reject) => { release = resolve; refuse = reject })
    return { promise, release, refuse }
}

/** What a scenario does to the stand-ins: hold an answer, change it, or make the writing fail. */
export const control = {
    reset() { Object.assign(behaviour, standard()); outside.length = 0 },
    hold(what) {
        const wait = held()
        if (what === 'scan') behaviour.scanArtist = () => wait.promise
        if (what === 'search') behaviour.search = () => wait.promise
        if (what === 'write') behaviour.createSeries = () => wait.promise
        return wait
    },
    scanAnswer(answer, fails = false) { behaviour.scanArtist = fails ? async () => { throw answer } : async () => answer },
    writeFails(error) { behaviour.createSeries = async () => { throw error } }
}

/** The window of the phone as the screen reads it, and a way to turn it into a computer and back. */
export function asPhone(phone) {
    const listeners = []
    const media = {
        matches: phone,
        addEventListener: (_type, listener) => listeners.push(listener),
        removeEventListener: (_type, listener) => { const i = listeners.indexOf(listener); if (i >= 0) listeners.splice(i, 1) }
    }
    window.scrollTo = vi.fn()
    Element.prototype.scrollIntoView = vi.fn()
    window.matchMedia = vi.fn(() => media)
    return { turn: (to) => { media.matches = to; [...listeners].forEach(listener => listener({ matches: to })) } }
}

export const quiet = () => {
    vi.spyOn(router, 'navigate').mockImplementation((path) => { outside.push(['navigate', path]) })
    vi.spyOn(loginWindowStore, 'open').mockImplementation(() => { outside.push(['signInWindow']) })
}

const pick = (h, ...ids) => ids.reduce((chain, id) => chain.then(() => h.click(`#discographyGrid [data-id="${id}"]`)), Promise.resolve())
const FOUR = ['a1', 'a3', 'a5', 'a0']
const lines = (selector) => [...document.querySelectorAll(selector)].map(row => row.textContent.replace(/\s+/g, ' ').trim()).join(' | ')

const search = async (h, text = 'Pink Floyd') => {
    await h.type('#artistScanInput', text)
    await h.click('#btnScanArtist')
}

/**
 * Each scenario: a name, whether it is the phone, whether it is a signed-in person (`guest`, false by default), and what it does with
 * the screen once mounted. `h.snap(label)` writes down `#app` (or the first element that matches a selector); `h.note(label)` writes down
 * what was asked of the world outside, and `h.focus(label)` where the focus is.
 */
export const SCENARIOS = [
    {
        name: 'first visit', run: async (h) => { h.snap('the stage, the steps, the empty dock'); h.focus('at the start') }
    },
    {
        name: 'typing an artist', run: async (h) => {
            await h.focusIn('#artistScanInput')
            await h.type('#artistScanInput', 'Pink Fl')
            h.snap('the hint points to Enter or Search')
            h.focus('in the field')
            await h.focusOut('#artistScanInput')
            h.snap('the field left')
        }
    },
    {
        name: 'searching', run: async (h) => {
            const wait = h.hold('scan')
            await search(h)
            h.snap('searching')
            h.focus('searching')
            wait.release({ albums: FLOYD, reclassified: null })
            await h.settle()
            h.snap('the discography')
        }
    },
    {
        name: 'the enter key searches', run: async (h) => {
            await h.type('#artistScanInput', 'Pink Floyd')
            await h.key('#artistScanInput', 'Enter')
            h.snap('the discography after Enter')
            h.note('what was asked of the catalog')
        }
    },
    {
        name: 'the discography and its filters', run: async (h) => {
            await search(h)
            h.snap('the discography')
            await h.click('#btnFilterEPs')
            h.snap('EPs on')
            await h.click('#btnFilterSingles')
            await h.click('#btnFilterLive')
            await h.click('#btnFilterCompilations')
            await h.click('#btnFilterUncategorized')
            h.snap('every type on')
            await h.click('#btnFilterAlbums')
            h.snap('studio albums off')
            h.focus('after a filter')
            await h.click('#btnFilterAlbums')
            await h.click('#btnFilterEPs')
            await h.click('#btnFilterSingles')
            await h.click('#btnFilterLive')
            await h.click('#btnFilterCompilations')
            await h.click('#btnFilterUncategorized')
            h.snap('back to studio albums')
        }
    },
    {
        name: 'the types are confirmed after the first answer', run: async (h) => {
            const later = h.hold('ai')
            h.scanAnswer({ albums: FLOYD.slice(0, 5), reclassified: later.promise })
            await search(h)
            h.snap('confirming album types')
            later.release(FLOYD)
            await h.settle()
            h.snap('the types confirmed')
        }
    },
    {
        name: 'choosing covers', run: async (h) => {
            await search(h)
            await pick(h, 'a1')
            h.snap('one album')
            h.focus('after a cover')
            await pick(h, 'a3', 'a5', 'a0')
            h.snap('four albums')
            await pick(h, 'a3')
            h.snap('a cover taken out, with Undo')
            h.focus('after a cover taken out')
            await h.click('[data-dock="undo"]')
            h.snap('Undo gave it back')
            await h.click('#btnAddAll')
            h.snap('«Add all», with Undo')
            await h.click('[data-dock="undo"]')
            h.snap('Undo of «Add all»')
        }
    },
    {
        name: 'many albums', run: async (h) => {
            await search(h)
            await h.click('#btnAddAll')
            h.snap('the series of all the studio albums: the +N of the dock')
            await h.type('#seriesNameInput', 'Pink Floyd, the studio years')
            h.snap('a name typed')
            h.focus('typing the name')
            await h.click('#btnFilterEPs')
            await h.click('#btnFilterSingles')
            h.snap('more types on: «Add the other N»')
        }
    },
    {
        name: 'the order panel', run: async (h) => {
            await search(h)
            await pick(h, ...FOUR)
            await h.click('#btnEditOrder')
            h.snap('the panel open')
            h.focus('after Edit order')
            await h.click('.home-rows li:nth-child(3) .home-rbtn__up')
            h.snap('the third album moved up')
            h.focus('after a move')
            await h.click('.home-rows li:nth-child(1) .home-rbtn__down')
            h.snap('the first album moved down')
            await h.click('.home-rows li:nth-child(2) .home-rbtn__remove')
            h.snap('the second album removed, with Undo')
            h.focus('after a removal')
            await h.click('[data-dock="undo"]')
            h.snap('Undo of the removal')
            await h.click('[data-dock="close"]')
            h.snap('the panel closed with Done')
            await h.click('#btnEditOrder')
            await h.click('#btnEditOrder')
            h.snap('opened and closed by the button')
        }
    },
    {
        name: 'the undo goes away by itself', timers: true, run: async (h) => {
            await search(h)
            await pick(h, 'a1', 'a3')
            await pick(h, 'a3')
            h.snap('Undo is there')
            await h.advance(7900)
            h.snap('Undo still there')
            await h.advance(200)
            h.snap('Undo gone')
        }
    },
    {
        name: 'the name', run: async (h) => {
            await search(h)
            await pick(h, 'a1')
            h.snap('one artist: the name is suggested')
            await pick(h, 'a1')
            await h.settle()
            h.snap('nothing chosen again: no name')
            await h.click('#discographyGrid [data-id="a1"]')
            await h.type('#seriesNameInput', '')
            await h.click('#btnCreateSeries')
            h.snap('the name is missing')
            h.focus('the name is missing')
            await h.click('[data-dock="use-name"]')
            h.snap('the suggested name used')
            h.note('what the screen asked outside')
        }
    },
    {
        name: 'two and three artists in the name', run: async (h) => {
            h.scanAnswer({ albums: [...FLOYD.slice(0, 2), album('j0', 'Hejira', 1976, 'Album', null, 'Joni Mitchell'), album('y0', 'Close to the Edge', 1972, 'Album', null, 'Yes')], reclassified: null })
            await search(h)
            await pick(h, 'a0')
            await pick(h, 'j0')
            h.snap('two artists')
            await pick(h, 'y0')
            h.snap('three artists')
        }
    },
    {
        name: 'creating the series', run: async (h) => {
            await search(h)
            await pick(h, ...FOUR)
            const write = h.hold('write')
            await h.click('#btnCreateSeries')
            h.snap('creating')
            h.focus('creating')
            write.release({ id: 's-new' })
            await h.settle()
            h.snap('created')
            h.focus('created')
            await h.click('#btnBlendNow')
            await h.click('#btnOpenSeries')
            h.note('where it went')
            await pick(h, 'a1')
            h.snap('a cover after creating starts another series')
            h.note('what was asked outside')
        }
    },
    {
        name: 'create, then start another', run: async (h) => {
            await search(h)
            await pick(h, ...FOUR)
            await h.click('#btnCreateSeries')
            await h.click('.home-restart')
            h.snap('another series: empty dock')
        }
    },
    {
        name: 'the series was not saved', run: async (h) => {
            await search(h)
            await pick(h, ...FOUR)
            h.writeFails(Object.assign(new Error('Failed to fetch'), { code: 'unavailable' }))
            await h.click('#btnCreateSeries')
            h.snap('not saved: the connection dropped')
            h.writeFails(new Error('boom'))
            await h.click('#btnCreateSeries')
            h.snap('not saved, no cause known')
            await h.click('[data-dock="toggle"]')
            h.snap('the panel with a failure')
        }
    },
    {
        name: 'nothing found, and the catalog that did not answer', run: async (h) => {
            h.scanAnswer({ albums: [], reclassified: null })
            await search(h, 'Floydd Qxz')
            h.snap('not found')
            await h.click('#homeMessage [data-home-mode="paste"]')
            h.snap('the list opened from the message')
            await h.click('#homeHint [data-home-mode="artist"]')
            h.scanAnswer(Object.assign(new Error('deadline'), { code: 'deadline' }), true)
            await search(h)
            h.snap('the catalog did not answer')
            h.focus('after a failed search')
            h.scanAnswer({ albums: FLOYD, reclassified: null })
            await h.click('#btnScanRetry')
            h.snap('Try again worked')
        }
    },
    {
        name: 'the search failed', run: async (h) => {
            await search(h)
            await pick(h, 'a1')
            h.scanAnswer(new Error('down'), true)
            await search(h)
            h.snap('the search failed with an album chosen: «still has its 1 album»')
        }
    },
    {
        name: 'a field with no artist', run: async (h) => {
            await h.click('#btnScanArtist')
            h.snap('nothing typed: nothing changes')
            h.note('what was asked outside')
        }
    },
    {
        name: 'the list', run: async (h) => {
            await h.click('#homeHint [data-home-mode="paste"]')
            h.snap('the list opens')
            h.focus('the list opens')
            await h.typeIn('.home-line__text', 0, 'Joni Mitchell - Hejira')
            await h.keyIn('.home-line__text', 0, 'Enter')
            h.focus('after Enter: the new line')
            await h.typeIn('.home-line__text', 1, 'Yes - Close to the Edge')
            h.snap('two lines, both ready')
            await h.typeIn('.home-line__text', 1, 'Radiohead OK Computer')
            h.snap('a line to fix')
            await h.typeIn('.home-line__text', 1, '')
            await h.keyIn('.home-line__text', 1, 'Backspace')
            h.snap('an empty line closed with Backspace')
            h.focus('after Backspace')
            await h.click('#homeHint [data-home-mode="artist"]')
            h.snap('back to the artist')
            h.focus('back to the artist')
        }
    },
    {
        name: 'a list pasted in the field', run: async (h) => {
            await h.paste('#artistScanInput', 'Joni Mitchell - Hejira\nYes - Close to the Edge')
            h.snap('the list from a paste')
            h.focus('after the paste')
            await h.caret('.home-line__text', 0, 6)
            await h.paste('.home-line__text', 'Caravan - In the Land of Grey and Pinkk\nOne\nTwo - Three')
            h.snap('lines pasted inside the list')
        }
    },
    {
        name: 'adding the list', run: async (h) => {
            await h.paste('#artistScanInput', 'Joni Mitchell - Hejira\nYes - Close to the Edge\nCaravan - In the Land of Grey and Pinkk\nRadiohead OK Computer')
            h.snap('the list before adding')
            const wait = h.hold('search')
            await h.click('#btnProcessBulk')
            h.snap('adding: busy')
            wait.release([{ id: 'x-Hejira', title: 'Hejira', artist: 'Joni Mitchell', year: 1976, coverUrl: null }])
            await h.settle()
            h.snap('the report: lines left to fix')
            h.focus('after adding')
            await h.typeIn('.home-line__text', 0, 'Caravan - If I Could Do It All Over Again')
            h.snap('a line typed again leaves the report')
            await h.click('#btnProcessBulk')
            h.snap('the second try')
            h.note('what was asked outside')
        }
    },
    {
        name: 'a list of one album', run: async (h) => {
            await h.paste('#artistScanInput', 'Yes - Close to the Edge\nYes - Fragile')
            await h.click('#btnProcessBulk')
            h.snap('everything went in')
            await h.paste('.home-line__text', 'Yes - Close to the Edge\nYes - Fragile')
            h.snap('the same lines again')
            await h.click('#btnProcessBulk')
            h.snap('already in the series')
        }
    },
    {
        name: 'a visitor', guest: true, run: async (h) => {
            h.snap('the visitor line in the dock')
            await pick(h)
            await h.click('[data-dock="sign-in"]')
            h.note('the sign-in window')
            h.signIn()
            await h.settle()
            h.snap('signed in: no line')
        }
    },
    {
        name: 'the phone: the stage and the bar', phone: true, run: async (h) => {
            h.snap('first visit on the phone')
            await search(h)
            h.snap('the discography on the phone')
            await pick(h, 'a1')
            h.snap('one album: the action bar')
            h.focus('after a cover on the phone')
            await pick(h, 'a1')
            h.snap('taken out, with Undo')
        }
    },
    {
        name: 'the phone: a visitor', phone: true, guest: true, run: async (h) => {
            h.snap('the visitor line in the stage')
            await h.click('[data-dock="stage-sign-in"]')
            h.note('the sign-in window')
        }
    },
    {
        name: 'the phone: the sheet', phone: true, run: async (h) => {
            await search(h)
            await pick(h, 'a1', 'a3', 'a5')
            await h.click('.home-dock__open')
            h.snap('the sheet', '.sheet')
            h.snap('the page behind the sheet')
            h.focus('the sheet opened')
            await h.click('#homeSeriesSheet .home-rows li:nth-child(1) .home-rbtn__down')
            h.snap('moved down in the sheet', '.sheet')
            await h.type('#homeChosenName', 'Late nights')
            h.snap('a name typed in the sheet', '.sheet')
            h.snap('the bar behind has the old name')
            h.focus('typing in the sheet')
            await h.click('#homeSeriesSheet .home-rows li:nth-child(3) .home-rbtn__remove')
            h.snap('removed: the Undo is in the sheet', '.sheet')
            h.snap('the page behind: no Undo strip')
            await h.click('#homeSeriesSheet .home-undo button')
            h.snap('Undo in the sheet', '.sheet')
            await h.click('#homeSeriesSheet .sheet__close')
            await h.settle(260)
            h.snap('the sheet closed')
            h.focus('the sheet closed')
        }
    },
    {
        name: 'the phone: create from the sheet', phone: true, run: async (h) => {
            await search(h)
            await pick(h, 'a1', 'a3')
            await h.click('.home-dock__open')
            await h.type('#homeChosenName', '')
            await h.click('#btnCreateSeriesSheet')
            h.snap('the name is missing', '.sheet')
            h.focus('the name is missing')
            await h.type('#homeChosenName', 'L')
            h.snap('typing in the name: the sheet keeps what it showed', '.sheet')
            h.focus('typing in the name')
            await h.click('#homeSeriesSheet [data-dock="use-name"]')
            const write = h.hold('write')
            await h.click('#btnCreateSeriesSheet')
            h.snap('creating: the sheet is gone')
            write.release({ id: 's-new' })
            await h.settle(260)
            h.snap('created on the phone')
            await h.click('#btnBlendNow')
            h.note('where it went')
        }
    },
    {
        name: 'the phone: not saved', phone: true, run: async (h) => {
            await search(h)
            await pick(h, 'a1')
            h.writeFails(Object.assign(new Error('x'), { code: 'unavailable' }))
            await h.click('#btnCreateSeriesPhone')
            h.snap('not saved: the connection dropped')
            h.writeFails(new Error('x'))
            await h.click('#btnCreateSeriesPhone')
            h.snap('not saved')
        }
    },
    {
        name: 'the phone turns into a computer', phone: true, run: async (h) => {
            await search(h)
            await pick(h, 'a1', 'a3')
            await h.click('.home-dock__open')
            await h.turn(false)
            await h.settle(260)
            h.snap('the computer: the sheet is gone')
            await h.turn(true)
            h.snap('the phone again')
        }
    },
    {
        name: 'the computer turns into a phone', run: async (h) => {
            await search(h)
            await pick(h, 'a1', 'a3')
            await h.click('#btnEditOrder')
            await h.turn(true)
            h.snap('the phone: the panel is gone')
        }
    }
]

export const keyOf = (scenario) => `${scenario.phone ? 'phone' : 'computer'} · ${scenario.name}`
export const textOf = lines
