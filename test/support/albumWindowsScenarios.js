/**
 * The states of the windows of the albums screen that F83 wave 5b checks (the window to edit a series with its album picker, the
 * question to delete one, and the window to rank the tracks of an album), written once so the windows as they were (hand-made:
 * SeriesEditModal, SeriesModals, UserRankModal) and as they are (React) are asked the same thing: the same series and albums, the same
 * answers of the catalog and of the services, the same clicks, keys, drags and turns of the phone, and what stands over the page after
 * each step (every element of `body` but `#app`), where the focus is, and EVERY call made to what is outside the window: the series
 * service (what is written, with what payload, and how the service was made), the ranking `onSubmit` / `onSave` / `onClose`, the
 * catalog, the notices, the question, the drag library (the options it was given, and when it was let go).
 *
 * The windows are asked for through `open` (what the runner gives: the old classes or the new ones); `harness` is the rest and is the
 * same for both. `normalize` is the one of the earlier waves (attributes sorted, classes as a set).
 *
 * Used by: reports/evidence/F83/wave-5b/capture-before.test.js (run once, on the hand-made windows, before they were deleted; it wrote
 * test/fixtures/albumWindowsBeforeF83.json) and test/screens/albums/AlbumWindows.sameAsBefore.test.tsx (the React windows, against that file).
 */
import { vi } from 'vitest'
import { normalize as pageOf } from './savedPlaylistsScenarios.js'
import { releasePageScroll } from '../../public/js/utils/pageScrollLock.js'
import { DeadlineError } from '../../public/js/utils/deadline.js'

export const outside = []
const note = (...entry) => outside.push(entry)

/** The part of the page this proof reads: what stands in `body` over the page (windows, sheets, notices), in the order it was put there. */
export const layerOf = () => [...document.body.children]
    .filter(element => element.id !== 'app' && element.id !== 'globalProgress') // the bar of the app is made by whichever module asks first: no part of a window
    .map(element => normalize(element))
    .join('\n')

/** An element as the proof compares it: the text of a field as it holds it now, read from a copy. */
export const normalize = (element) => {
    if (!element) return null
    const copy = element.cloneNode(true)
    const typed = element.querySelectorAll('input')
    copy.querySelectorAll('input').forEach((input, i) => input.setAttribute('value', typed[i].value))
    return pageOf(copy)
}

/** Where the focus is, as words. */
export const focusOf = () => {
    const active = document.activeElement
    if (!active || active === document.body) return 'the page'
    const mark = active.id ? `#${active.id}` : `.${[...active.classList].join('.')}`
    const which = active.dataset?.action ? `[action=${active.dataset.action}]` : active.dataset?.filter ? `[filter=${active.dataset.filter}]` : ''
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

/** A promise a scenario lets go of when it says so. */
export const held = () => {
    let release
    let refuse
    const promise = new Promise((resolve, reject) => { release = resolve; refuse = reject })
    return { promise, release, refuse }
}

// ---------------------------------------------------------------------------------------------- the world

const album = (title, type = 'Album', releaseDate = '2015-03-15', artist = 'Kendrick Lamar') => ({
    id: `id-${title}`, title, artist, year: releaseDate.slice(0, 4), type, releaseDate, coverUrl: 'https://img/{w}x{h}.jpg'
})
export const FOUND = () => ({
    albums: [
        album('good kid, m.A.A.d city (Deluxe Version)', 'Album', '2012-10-22'),
        album('To Pimp a Butterfly'),
        album('The Heart Part 5 - Single', 'Single', '2022-05-08'),
        album('Black Panther: The Album', 'Compilation', '2018-02-09'),
        album('Section.80 (Live)', 'Live', '2011-07-02')
    ],
    reclassified: null
})

const SERIES = () => [
    { id: 's1', name: 'Rap &amp; more', albumQueries: ['Kendrick Lamar - DAMN.', { artist: 'Kendrick Lamar', title: 'To Pimp a Butterfly', appleMusicId: 'am1' }, 'Outkast - Aquemini'] },
    { id: 's2', name: 'Empty', albumQueries: [] },
    { id: 's3', name: 'Rock', albumQueries: ['A - One', 'B - Two', 'C - Three'] }
]

export const world = {
    series: SERIES(),
    db: {},
    /** what the catalog answers, one per scan, in order; empty: the default list */
    scans: [],
    /** the write of the series: what `updateSeries` answers, in order; empty: it works */
    writes: [],
    /** what the service counts under a series, and what `deleteSeries` answers */
    saved: { playlists: 0, batches: 0 },
    countFails: false,
    deleteFails: false,
    confirm: true,
    /** what the ranking `onSubmit` answers: true, false, 'throws', or 'service' (it goes through the real ranking service to the stubbed repository) */
    submit: true,
    rankAlbum: null,
    ownRankingService: null,
    /** loads the real ranking service (a scenario asks for it before it opens the window: loading takes real time) */
    async useRankingService(album) {
        this.ownRankingService = (await import('../../public/js/services/ranking/ownRanking.js')).ownRankingService
        this.submit = 'service'
        this.rankAlbum = album
    },
    reset() {
        this.series = SERIES()
        this.db = {}
        this.scans = []
        this.writes = []
        this.saved = { playlists: 0, batches: 0 }
        this.countFails = false
        this.deleteFails = false
        this.confirm = true
        this.submit = true
        this.rankAlbum = null
    }
}

export const seriesServiceModule = {
    getSeriesService: (db, second, userId) => {
        note('getSeriesService', Boolean(db), second === null ? 'null' : typeof second, userId)
        return {
            updateSeries: (id, data) => {
                note('updateSeries', id, JSON.stringify(data))
                const next = world.writes.shift()
                return typeof next === 'function' ? next() : Promise.resolve()
            },
            countSavedPlaylists: async (id) => {
                note('countSavedPlaylists', id)
                if (world.countFails) throw new Error('count failed')
                return { ...world.saved }
            },
            deleteSeries: async (id) => {
                note('deleteSeries', id)
                if (world.deleteFails) throw new Error('delete failed')
            }
        }
    }
}
export const albumSeriesStoreModule = {
    albumSeriesStore: { getSeries: () => world.series, getDb: () => world.db, getUserId: () => 'user-1' }
}
export const searchModule = {
    albumSearchService: {
        scanArtist: (text) => {
            note('scanArtist', text)
            const next = world.scans.shift()
            return typeof next === 'function' ? next() : Promise.resolve(FOUND())
        }
    }
}
const toasts = {
    info: (m) => note('toast', 'info', m), success: (m) => note('toast', 'success', m),
    error: (m) => note('toast', 'error', m), warning: (m) => note('toast', 'warning', m)
}
export const toastModule = { default: toasts, toast: toasts }
export const dialogModule = {
    dialogService: {
        confirm: async (options) => { note('confirm', JSON.stringify(options)); return world.confirm }
    }
}

/** The drag library: it writes down what it was given and when it was let go, and a scenario drops a row with `drop`. */
export const sortables = []
function SortableStub(element, options) {
    this.element = element
    this.options = options
    this.dead = false
    sortables.push(this)
    note('sortable', element.id || element.className, JSON.stringify(options))
}
SortableStub.create = (element, options) => new SortableStub(element, options)
SortableStub.prototype.destroy = function destroy() { this.dead = true; note('sortable.destroy', this.element.id || this.element.className) }
SortableStub.prototype.option = function option(name, value) {
    if (value === undefined) return this.options[name]
    this.options[name] = value
    note('sortable.option', name, String(value))
}
export const sortableModule = { default: SortableStub }

/** The site's ranking repository (Firestore, behind the ranking service): it writes down what it is asked to save. */
export const rankingRepositoryModule = {
    userRankingRepository: {
        getAllRankings: async () => [],
        saveRanking: async (userId, albumId, data) => { note('repository.saveRanking', userId, albumId, JSON.stringify(data)); return true }
    }
}

/** The callbacks the windows are given. */
export const callbacks = {
    onUpdated: (id) => note('onUpdated', id),
    onDeleted: (id) => note('onDeleted', id),
    onSubmit: async (rankings) => {
        note('onSubmit', JSON.stringify(rankings))
        if (world.submit === 'throws') throw new Error('offline')
        if (world.submit === 'service') {
            // the way the albums screen saves (controller.saveRanking → the ranking service), down to the repository
            return world.ownRankingService.save(world.rankAlbum, rankings)
        }
        return world.submit
    },
    onSave: (rankings) => note('onSave', JSON.stringify(rankings)),
    onClose: () => note('onClose')
}

export const RANK_ALBUM = () => ({
    id: 'ds_bia', title: 'Brothers In Arms', artist: 'Dire Straits',
    tracks: [
        { title: 'So Far Away', position: 1, rank: 4, spotifyRank: 3, duration: 312 },
        { title: 'Money for Nothing', position: 2, rank: 1, spotifyRank: 1, duration: 506 },
        { title: 'Walk of Life', position: 3, duration: 252 },
        { title: 'Your Latest Trick', position: 4, rank: 3 }
    ]
})
/** Three tracks ranked (a saved ranking), one not in it (a partial ranking), a name with an ampersand. */
export const PARTIAL_ALBUM = () => ({
    id: 'kc', title: 'In the Court of the Crimson King', artist: 'King Crimson & Friends',
    tracks: [
        { id: 't1', title: 'Schizoid Man', position: 1, userRank: 1, duration: 442 },
        { id: 't2', title: 'I Talk to the Wind', position: 2, userRank: 3, duration: 363 },
        { id: 't3', title: 'Epitaph', position: 3, userRank: 2, duration: 530 },
        { id: 't4', title: 'Moonchild', position: 4, duration: 727 },
        { id: 't5', title: 'The Court of the Crimson King', position: 5, rank: 5, spotifyRank: 2, duration: 563 }
    ]
})

/** Puts the world as a scenario wants it, before a window opens. */
export function prepare(scenario) {
    outside.length = 0
    sortables.length = 0
    releasePageScroll(window)
    world.reset()
    if (scenario.series) world.series = scenario.series()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame', 'cancelAnimationFrame', 'Date'] })
    vi.setSystemTime(new Date(2026, 10, 21, 12, 0, 0))
}

/**
 * What a scenario is given. `act` wraps a change (the old windows need nothing, the React ones need `act`); `open` is what asks for a
 * window; `phone` turns the screen.
 */
export function harness({ act = async (work) => { await work() }, open, phone }) {
    const snaps = {}
    const at = (selector, index = 0) => {
        const element = document.querySelectorAll(selector)[index]
        if (!element) throw new Error(`nothing matches ${selector} (${index})`)
        return element
    }
    const settle = async () => {
        for (let i = 0; i < 8; i++) await Promise.resolve()
        await new Promise(resolve => setImmediate(resolve))
        for (let i = 0; i < 8; i++) await Promise.resolve()
    }
    const run = (work) => act(async () => { await work(); await settle() })
    const writeInto = (field, value) => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(field, value) // the way a browser writes into a field React owns
        field.dispatchEvent(new Event('input', { bubbles: true }))
    }
    return {
        world,
        held,
        settle,
        snaps,
        // the old rank window starts its drag library after a frame: a few frames pass after each opening and each turn
        open: (kind, ...args) => run(async () => { await open[kind](...args); vi.advanceTimersByTime(50) }),
        snap: (label, selector) => { snaps[label] = selector ? normalize(document.querySelector(selector)) : layerOf() },
        note: (label) => { snaps[label] = JSON.stringify(outside.splice(0)) },
        focus: (label) => { snaps[`focus · ${label}`] = focusOf() },
        count: (label, selector) => { snaps[`count · ${label}`] = String(document.querySelectorAll(selector).length) },
        click: (selector, index = 0) => run(() => { const element = at(selector, index); element.focus(); element.click() }),
        clickAt: (selector, index = 0) => run(() => { at(selector, index).click() }),
        type: (selector, value, index = 0) => run(() => writeInto(at(selector, index), value)),
        enter: (selector) => run(() => {
            const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
            at(selector).dispatchEvent(event)
            note('enter default prevented', event.defaultPrevented)
        }),
        key: (key) => run(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })) }),
        tick: (ms) => run(() => { vi.advanceTimersByTime(ms) }),
        turn: (to) => run(() => { phone.turn(to); vi.advanceTimersByTime(50) }),
        /** Drops the row `from` of the list `selector` at place `to`, as the drag library does: it moves the row, then says so. */
        drag: (selector, from, to) => run(() => {
            const sortable = [...sortables].reverse().find(item => !item.dead && item.element.matches(selector))
            if (!sortable) throw new Error(`no live drag list for ${selector}: ${sortables.map(s => s.element.id + s.dead).join()}`)
            const list = sortable.element
            const item = list.children[from]
            sortable.options.onChoose?.({ item })
            const rows = [...list.children]
            rows.splice(from, 1)
            rows.splice(to, 0, item)
            rows.forEach(row => list.appendChild(row))
            sortable.options.onUnchoose?.({ item })
            sortable.options.onEnd?.({ item, from: list, to: list, oldIndex: from, newIndex: to })
        })
    }
}

export const keyOf = (scenario) => `${scenario.phone ? 'phone' : 'computer'} · ${scenario.name}`

const WINDOW = '#edit-series-modal'
const PICKER = `${WINDOW} [data-album-picker]`
const SCAN = `${PICKER} [data-action="scan-artist"]`
const FIELD = `${PICKER} input`
const SAVE = `${WINDOW} [data-action="save-series"]`
const NAME = `${WINDOW} input[placeholder="Series Name"]`
const CARDS = `${WINDOW} [data-picker-grid] [data-action="pick-album"]`
const LIST = `${WINDOW} [data-series-albums]`

const scan = async (h, text, answer) => {
    if (answer) h.world.scans.push(answer)
    await h.type(FIELD, text)
    await h.click(SCAN)
}

const RANK = '.rank-window'
const LIST_RANK = '#rank-track-list'
const FOOT = '.rank-phone__mover'
const pick = (h, index) => h.click('.rank-row__pick', index)
const button = (h, label) => h.click(`${FOOT} button[aria-label="${label}"], ${FOOT} button.rank-phone__done`)

/**
 * Each scenario: a name, whether it is the phone, and what it does. `h.open('edit', 's1')` / `h.open('delete', 's1')` /
 * `h.open('rank', album)` ask for a window; `h.snap(label)` writes down what stands over the page (or the first element that matches a
 * selector); `h.note(label)` writes down every call made to what is outside; `h.focus(label)` where the focus is.
 */
export const SCENARIOS = [
    // ------------------------------------------------------------------------------------------ the window to edit a series
    {
        name: 'edit: opens with the series', run: async (h) => {
            await h.open('edit', 's1')
            h.snap('the window')
            h.focus('at the opening')
            h.note('what was asked')
        }
    },
    {
        name: 'edit: a series that does not exist', run: async (h) => {
            await h.open('edit', 'nope')
            h.snap('no window')
            h.note('what was asked')
        }
    },
    {
        name: 'edit: a series with no albums', run: async (h) => {
            await h.open('edit', 's2')
            h.snap('the window, no albums yet')
        }
    },
    {
        name: 'edit: the scan, busy and then the results', run: async (h) => {
            const wait = h.held()
            await h.open('edit', 's1')
            await scan(h, 'kendrick lamar', () => wait.promise)
            h.snap('scanning')
            h.focus('after the Scan button')
            h.note('the scan asked')
            await h.click(SCAN)
            h.note('a second press asks nothing')
            wait.release(FOUND())
            await h.settle()
            h.snap('the results: studio albums')
            h.note('the results arrived')
            await h.click(`${PICKER} [data-filter="singles"]`)
            h.snap('singles added to the filters')
            h.focus('after a filter')
            await h.click(`${PICKER} [data-filter="albums"]`)
            await h.click(`${PICKER} [data-filter="live"]`)
            await h.click(`${PICKER} [data-filter="compilations"]`)
            h.snap('singles, live, compendiums')
            await h.click(`${PICKER} [data-filter="singles"]`)
            await h.click(`${PICKER} [data-filter="live"]`)
            await h.click(`${PICKER} [data-filter="compilations"]`)
            h.snap('every filter off: no albums of the selected types')
        }
    },
    {
        name: 'edit: the Enter key scans and sends nothing', run: async (h) => {
            await h.open('edit', 's1')
            await h.type(FIELD, 'kendrick lamar')
            await h.enter(FIELD)
            h.snap('the results')
            h.note('what was asked')
        }
    },
    {
        name: 'edit: scanning with no text', run: async (h) => {
            await h.open('edit', 's1')
            await h.click(SCAN)
            h.snap('nothing was scanned')
            h.note('a notice')
        }
    },
    {
        name: 'edit: the catalog finds nothing', run: async (h) => {
            await h.open('edit', 's1')
            await scan(h, 'kendrik', async () => ({ albums: [], reclassified: null }))
            h.snap('no albums found')
            h.note('what was asked')
        }
    },
    {
        name: 'edit: the catalog is late, then Try again', run: async (h) => {
            await h.open('edit', 's1')
            await scan(h, 'kendrick lamar', async () => { throw new DeadlineError('the catalog', 15000) })
            h.snap('failed by deadline, with Try again')
            await h.type(FIELD, 'something else')
            await h.click(`${WINDOW} [data-action="scan-retry"]`)
            h.snap('the same text asked again: the results')
            h.focus('after Try again')
            h.note('what was asked')
        }
    },
    {
        name: 'edit: the catalog fails', run: async (h) => {
            await h.open('edit', 's1')
            await scan(h, 'kendrick lamar', async () => { throw new Error('boom') })
            h.snap('the search could not be completed')
            h.note('what was asked')
        }
    },
    {
        name: 'edit: the AI list arrives after the first results', run: async (h) => {
            const ai = h.held()
            await h.open('edit', 's1')
            await scan(h, 'orbital', async () => ({ albums: [album('Snivilisation'), album('Odd One')], reclassified: ai.promise }))
            h.snap('the catalog albums, confirming types')
            ai.release([album('Snivilisation'), album('Odd One', 'Uncategorized')])
            await h.settle()
            h.snap('classified again')
        }
    },
    {
        name: 'edit: the AI list fails', run: async (h) => {
            const ai = h.held()
            await h.open('edit', 's1')
            await scan(h, 'orbital', async () => ({ albums: [album('Snivilisation')], reclassified: ai.promise }))
            ai.refuse(new Error('ai down'))
            await h.settle()
            h.snap('the first classification stays')
        }
    },
    {
        name: 'edit: a pick, a repeat, a removal', run: async (h) => {
            await h.open('edit', 's1')
            await scan(h, 'kendrick lamar')
            await h.clickAt(CARDS, 1)
            h.snap('To Pimp a Butterfly was already in the list')
            h.note('the repeat is warned')
            await h.clickAt(CARDS, 0)
            h.snap('an album joined the list')
            h.focus('after a pick')
            h.note('the pick is told')
            await h.click(`${LIST} [data-action="remove-album"]`, 0)
            h.snap('the first album removed')
            h.focus('after a removal')
            await h.click(`${LIST} [data-action="remove-album"]`, 0)
            await h.click(`${LIST} [data-action="remove-album"]`, 0)
            await h.click(`${LIST} [data-action="remove-album"]`, 0)
            h.snap('no albums yet')
            h.note('nothing was written')
        }
    },
    {
        name: 'edit: Cancel and the close button', run: async (h) => {
            await h.open('edit', 's1')
            await h.click(`${WINDOW} [data-action="close-modal"]`, 1)
            h.snap('closed by Cancel')
            h.focus('after Cancel')
            await h.open('edit', 's1')
            await h.click(`${WINDOW} .app-modal__close`)
            h.snap('closed by the cross')
            h.note('what was asked')
        }
    },
    {
        name: 'edit: Escape and a click outside do nothing', run: async (h) => {
            await h.open('edit', 's1')
            await h.key('Escape')
            await h.clickAt(WINDOW)
            h.snap('still open')
        }
    },
    {
        name: 'edit: a scan that answers after the window closed', run: async (h) => {
            const wait = h.held()
            await h.open('edit', 's1')
            await scan(h, 'kendrick lamar', () => wait.promise)
            await h.click(`${WINDOW} [data-action="close-modal"]`, 1)
            wait.release(FOUND())
            await h.settle()
            h.snap('nothing is left')
            h.note('what was asked')
        }
    },
    {
        name: 'edit: save, with a pick and a new name', run: async (h) => {
            const write = h.held()
            h.world.writes.push(() => write.promise)
            await h.open('edit', 's1')
            await scan(h, 'kendrick lamar')
            await h.clickAt(CARDS, 0)
            await h.type(NAME, '  Rap &amp; more ')
            await h.click(SAVE)
            h.snap('saving: the button busy')
            h.focus('on the Save button')
            await h.clickAt(SAVE)
            await h.clickAt(SAVE)
            h.note('one write asked, a third press asks nothing')
            write.release()
            await h.settle()
            h.snap('saved: closed')
            h.note('after the answer')
        }
    },
    {
        name: 'edit: save fails, and again', run: async (h) => {
            h.world.writes.push(async () => { throw new Error('permission-denied') })
            await h.open('edit', 's1')
            await scan(h, 'kendrick lamar')
            await h.clickAt(CARDS, 0)
            await h.click(SAVE)
            h.snap('failed: the message, the list as left')
            h.note('the failure')
            await h.click(SAVE)
            h.snap('saved on the second try')
            h.note('the second try')
        }
    },
    {
        name: 'edit: save with no name', run: async (h) => {
            await h.open('edit', 's1')
            await h.type(NAME, '   ')
            await h.click(SAVE)
            h.snap('give the series a name')
            h.note('nothing was written')
        }
    },
    {
        name: 'edit: save with no database', run: async (h) => {
            await h.open('edit', 's1')
            h.world.db = null
            await h.click(SAVE)
            h.snap('the database is not ready')
            h.note('nothing was written')
        }
    },
    {
        name: 'edit: the name of a series with entities, saved untouched', run: async (h) => {
            await h.open('edit', 's1')
            await h.click(SAVE)
            h.note('the payload')
        }
    },
    {
        name: 'edit: the albums move up and down', phone: true, run: async (h) => {
            await h.open('edit', 's3')
            h.snap('the window on the phone')
            await h.click(`${LIST} [data-action="move-down"]`, 0)
            h.snap('the first moved down')
            h.focus('after a move')
            await h.click(`${LIST} [data-action="move-up"]`, 2)
            h.snap('the last moved up')
            await h.click(`${LIST} [data-action="move-up"]`, 0)
            h.snap('the first cannot move up')
            h.note('nothing written yet')
            await h.click(SAVE)
            h.note('saved in the new order')
        }
    },
    {
        name: 'edit: the computer has no move buttons', run: async (h) => {
            await h.open('edit', 's3')
            h.count('move buttons', `${WINDOW} [data-action="move-up"], ${WINDOW} [data-action="move-down"]`)
            h.count('remove buttons', `${WINDOW} [data-action="remove-album"]`)
        }
    },
    // ------------------------------------------------------------------------------------------ the question to delete a series
    {
        name: 'delete: asked and confirmed', run: async (h) => {
            await h.open('delete', 's1')
            h.note('what was asked')
        }
    },
    {
        name: 'delete: one saved playlist', run: async (h) => {
            h.world.saved = { playlists: 1, batches: 1 }
            await h.open('delete', 's1')
            h.note('what was asked')
        }
    },
    {
        name: 'delete: several saved playlists', run: async (h) => {
            h.world.saved = { playlists: 3, batches: 2 }
            await h.open('delete', 's1')
            h.note('what was asked')
        }
    },
    {
        name: 'delete: not confirmed', run: async (h) => {
            h.world.confirm = false
            await h.open('delete', 's1')
            h.note('nothing was deleted')
        }
    },
    {
        name: 'delete: the service fails', run: async (h) => {
            h.world.deleteFails = true
            await h.open('delete', 's1')
            h.note('the failure is told')
        }
    },
    {
        name: 'delete: the count fails', run: async (h) => {
            h.world.countFails = true
            await h.open('delete', 's1')
            h.note('nothing is asked, nothing deleted')
        }
    },
    {
        name: 'delete: a series that does not exist, and no database', run: async (h) => {
            await h.open('delete', 'nope')
            h.note('not found')
            h.world.db = null
            await h.open('delete', 's1')
            h.note('no database')
        }
    },
    // ------------------------------------------------------------------------------------------ the window to rank the tracks
    {
        name: 'rank: opens in the order of the record', run: async (h) => {
            await h.open('rank', RANK_ALBUM())
            h.snap('the window')
            h.focus('at the opening')
            h.note('what was asked')
        }
    },
    {
        name: 'rank: opens in the saved order, a partial ranking', run: async (h) => {
            await h.open('rank', PARTIAL_ALBUM())
            h.snap('ranked first, the rest after, names as they are')
        }
    },
    {
        name: 'rank: drag a track, Reset', run: async (h) => {
            await h.open('rank', RANK_ALBUM())
            await h.drag(LIST_RANK, 3, 0)
            h.snap('Your Latest Trick first')
            h.focus('after a drag')
            await h.click(`${RANK} .flex.items-center.gap-2 button`, 0)
            h.snap('Reset: the order of the record')
            h.note('what was asked')
        }
    },
    {
        name: 'rank: save', run: async (h) => {
            await h.open('rank', RANK_ALBUM())
            await h.drag(LIST_RANK, 3, 0)
            await h.click(`${RANK} .bg-sky-500`)
            h.snap('saved: the notice, the window still open')
            h.note('what was asked at once')
            await h.tick(499)
            h.snap('499 ms later')
            await h.tick(1)
            h.snap('500 ms later: closed, the notice stays')
            h.note('what was asked after the pause')
            await h.tick(1500)
            h.snap('2 s after the notice: gone')
        }
    },
    {
        name: 'rank: save with the order of the record, and one track moved (a partial ranking)', run: async (h) => {
            await h.open('rank', PARTIAL_ALBUM())
            await h.drag(LIST_RANK, 3, 1)
            await h.click(`${RANK} .bg-sky-500`)
            h.note('every track ranked in the order on screen')
        }
    },
    {
        name: 'rank: the save is refused, or breaks', run: async (h) => {
            h.world.submit = false
            await h.open('rank', RANK_ALBUM())
            await h.click(`${RANK} .bg-sky-500`)
            h.snap('Failed to save: the window stays')
            h.note('refused')
            await h.tick(2500)
            h.snap('the notice is gone, the window open')
            h.world.submit = 'throws'
            await h.click(`${RANK} .bg-sky-500`)
            await h.tick(1000)
            h.snap('after a thrown error: the window stays')
            h.note('broke')
        }
    },
    {
        name: 'rank: Back with nothing changed', run: async (h) => {
            await h.open('rank', RANK_ALBUM())
            await h.click(`${RANK} .text-white\\/60`, 0)
            h.snap('closed')
            h.focus('after Back')
            h.note('what was asked')
        }
    },
    {
        name: 'rank: Back with a change asks, Keep editing, then Discard', run: async (h) => {
            await h.open('rank', RANK_ALBUM())
            await h.drag(LIST_RANK, 0, 2)
            await h.click(`${RANK} .text-white\\/60`, 0)
            h.snap('the question')
            h.focus('on the question')
            await h.key('Escape')
            h.snap('Escape is Keep editing: the window as it was')
            await h.click(`${RANK} .text-white\\/60`, 0)
            await h.key('Escape')
            await h.click(`${RANK} .text-white\\/60`, 0)
            await h.click('#confirm-modal [data-action="confirm"]')
            h.snap('Discard: closed')
            h.note('what was asked')
        }
    },
    {
        name: 'rank: Escape and a click outside', run: async (h) => {
            await h.open('rank', RANK_ALBUM())
            await h.key('Escape')
            h.snap('closed at once')
            await h.open('rank', RANK_ALBUM())
            await h.drag(LIST_RANK, 0, 2)
            await h.key('Escape')
            h.snap('the question')
            await h.clickAt(RANK)
            h.count('questions after a click outside while asking', '#confirm-modal')
            await h.click('#confirm-modal [data-action="cancel"]')
            await h.clickAt(RANK)
            h.snap('a click outside asks too')
            h.note('what was asked')
        }
    },
    {
        name: 'rank: Keep editing keeps the order', run: async (h) => {
            await h.open('rank', RANK_ALBUM())
            await h.drag(LIST_RANK, 0, 2)
            await h.clickAt(RANK)
            await h.click('#confirm-modal [data-action="cancel"]')
            h.snap('as it was')
            await h.click(`${RANK} .bg-sky-500`)
            h.note('the saved order')
        }
    },
    {
        name: 'rank: saved through the real ranking service, down to the repository', run: async (h) => {
            const album = PARTIAL_ALBUM()
            await h.world.useRankingService(album)
            await h.open('rank', album)
            await h.drag(LIST_RANK, 3, 1)
            await h.click(`${RANK} .bg-sky-500`)
            h.note('what was asked at once')
            await h.tick(500)
            h.note('after the pause')
        }
    },
    {
        name: 'rank: the phone, saved through the real ranking service, down to the repository', phone: true, run: async (h) => {
            const album = RANK_ALBUM()
            await h.world.useRankingService(album)
            await h.open('rank', album)
            await pick(h, 3)
            await button(h, 'Move up')
            await h.click('.rank-phone__save')
            h.note('what was asked at once')
            await h.tick(500)
            h.note('after the pause')
        }
    },
    {
        name: 'rank: the phone window', phone: true, run: async (h) => {
            await h.open('rank', RANK_ALBUM())
            h.snap('the window on the phone')
            h.note('what was asked')
        }
    },
    {
        name: 'rank: the phone moves a track without dragging', phone: true, run: async (h) => {
            await h.open('rank', RANK_ALBUM())
            await pick(h, 2)
            h.snap('Walk of Life picked')
            h.focus('after the pick')
            await button(h, 'Move up')
            await button(h, 'Move up')
            h.snap('moved to the top')
            h.focus('after a move')
            await button(h, 'Move down')
            await button(h, 'Done')
            h.snap('Done: the buttons hidden')
            await h.click('.rank-phone__save')
            h.note('what was asked')
        }
    },
    {
        name: 'rank: the phone, Move to', phone: true, run: async (h) => {
            await h.open('rank', RANK_ALBUM())
            await pick(h, 3)
            await h.click(`${FOOT} button`, 2)
            h.snap('the numbers in a sheet')
            h.focus('in the sheet')
            await h.click('.rank-moveto__number', 0)
            h.snap('the track went there')
            h.focus('after the sheet')
        }
    },
    {
        name: 'rank: the phone, Reset and Undo', phone: true, run: async (h) => {
            await h.open('rank', RANK_ALBUM())
            await pick(h, 1)
            await button(h, 'Move up')
            await h.click('.rank-phone__reset')
            h.snap('Reset: the notice with Undo')
            await h.click('.rank-toast__action')
            h.snap('Undo: the order is back, the notice gone')
            await h.click('.rank-phone__reset')
            await h.tick(5000)
            h.snap('5 s: the notice is gone')
        }
    },
    {
        name: 'rank: the phone, Back with a change', phone: true, run: async (h) => {
            await h.open('rank', RANK_ALBUM())
            await h.click('.rank-phone__back')
            h.snap('nothing changed: closed')
            h.note('closed')
            await h.open('rank', RANK_ALBUM())
            await pick(h, 0)
            await button(h, 'Move down')
            await h.click('.rank-phone__back')
            h.snap('the sheet asks')
            h.focus('on Keep editing')
            await h.click('#rankDiscardSheet .rank-discard__keep')
            await h.tick(300)
            h.snap('Keep editing: the window and the order stay')
            await h.key('Escape')
            h.snap('Escape asks too')
            await h.click('#rankDiscardSheet .rank-discard__discard')
            await h.tick(300)
            h.snap('Discard: closed')
            h.note('what was asked')
        }
    },
    {
        name: 'rank: the phone, a move that goes back is no change', phone: true, run: async (h) => {
            await h.open('rank', RANK_ALBUM())
            await pick(h, 0)
            await button(h, 'Move down')
            await button(h, 'Move up')
            await h.click('.rank-phone__back')
            h.snap('closed at once')
        }
    },
    {
        name: 'rank: the phone, drag by the handle, save, then Back', phone: true, run: async (h) => {
            await h.open('rank', RANK_ALBUM())
            await h.drag(LIST_RANK, 1, 3)
            h.snap('dragged')
            await h.click('.rank-phone__save')
            await h.tick(500)
            h.snap('saved and closed')
            h.note('what was asked')
        }
    },
    {
        name: 'rank: turning the phone into a computer and back', phone: true, run: async (h) => {
            await h.open('rank', RANK_ALBUM())
            await pick(h, 1)
            await button(h, 'Move up')
            await h.turn(false)
            h.snap('drawn for the computer, the same order')
            h.note('after turning')
            await h.turn(true)
            h.snap('drawn for the phone again')
        }
    },
    {
        name: 'rank: the phone with a sheet open and Escape', phone: true, run: async (h) => {
            await h.open('rank', RANK_ALBUM())
            await pick(h, 0)
            await h.click(`${FOOT} button`, 2)
            await h.key('Escape')
            h.snap('the sheet takes the Escape; the window stays')
        }
    }
]
