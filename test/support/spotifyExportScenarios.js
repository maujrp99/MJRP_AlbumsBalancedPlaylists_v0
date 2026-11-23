/**
 * The states of the Spotify export window that F83 wave 8a checks, written once so the hand-made window (components/SpotifyExportModal.js, the
 * last one) and the React one (ui/SpotifyExportWindow.tsx) are asked the same thing: the same playlists, the same presses, the same typing, the
 * same answers of the export service, and what stands in the page (`#spotify-export-modal`), where the focus is and what the window asked of
 * the world after each step.
 *
 * A snapshot is the page as test/support/savedPlaylistsScenarios.js `normalize` writes it PLUS every text node as it is written (a browser draws
 * the white space of a template as one space, but it shapes the letters it is given: lesson 18), a whitespace-only node counted only inside an
 * inline `span` (there it is drawn: lesson 15).
 *
 * Used by reports/evidence/F83/wave-8a/capture-spotify-before.test.js (run once on the hand-made window: it wrote
 * test/fixtures/spotifyExportBeforeF83.json) and test/ui/SpotifyExportWindow.sameAsBefore.test.tsx.
 */
import { normalize } from './savedPlaylistsScenarios.js'
import { stand } from './spotifyExportStandIns.js'

const track = (title) => ({ title })
export const TWO = [
    { id: 'p1', name: 'Greatest Hits', tracks: [track('One'), track('Two')] },
    { id: 'p2', name: 'Deep Cuts', tracks: [track('Three'), track('Four')] }
]
const GIVEN = { seriesName: 'Road trip', playlists: [...TWO, { id: 'p3', name: 'B-Sides', tracks: [track('Five')] }] }
const ONE = { seriesName: 'Road trip', playlists: [TWO[1]] }
const HOSTILE = '<img src=x onerror="window.__xss=1"> & "quoted"'

const report = (over = {}) => ({
    mode: 'merge', totalTracks: 4, matchCount: 4, created: [], incomplete: [], empty: [], notCreated: [], failure: null, createdUrl: null, ...over
})
const made = (name, id, over = {}) => ({ name, url: `https://open.spotify.com/playlist/${id}`, tracks: 2, total: 2, alreadyThere: false, ...over })

/** What has the focus, in words. */
export function focusOf() {
    const active = document.activeElement
    if (!active || active === document.body) return 'body'
    return `${active.tagName.toLowerCase()} ${active.id || active.getAttribute('aria-label') || active.className}`
}

/** Every text node as it is written (see the top of the file). */
function textsOf(root) {
    const out = []
    const walk = (node) => {
        for (const child of node.childNodes) {
            if (child.nodeType === 3) {
                if (child.textContent.trim()) out.push(child.textContent)
                else if (child.parentNode.tagName === 'SPAN') out.push(' ')
            } else if (child.nodeType === 1) walk(child)
        }
    }
    walk(root)
    return JSON.stringify(out)
}

/** A piece of the page as the proof compares it: its elements, the state of its fields and every text node. */
export function snapOf(selector = '#spotify-export-modal') {
    const element = document.querySelector(selector)
    if (!element) return null
    const clone = element.cloneNode(true)
    const live = [...element.querySelectorAll('input')]
    ;[...clone.querySelectorAll('input')].forEach((input, index) => {
        input.removeAttribute('checked')
        if (live[index].type === 'radio' && live[index].checked) input.setAttribute('data-is-checked', 'true')
        if (live[index].type === 'text') input.setAttribute('data-typed', live[index].value)
        input.removeAttribute('value')
    })
    return `${normalize(clone)}\n${textsOf(element)}`
}

const missing = (count) => Array.from({ length: count }, (_, i) => ({ artist: `Artist ${i + 1}`, title: `Song ${i + 1}` }))

export const SCENARIOS = [
    {
        name: 'idle, the playlists on the edit screen', run: async (h) => {
            h.screen({ playlists: TWO, seriesName: 'Road trip' })
            await h.open()
            h.snap('idle')
            h.note('focus', focusOf())
        }
    },
    {
        name: 'idle, no series open and playlists with no tracks key', run: async (h) => {
            h.screen({ playlists: [{ id: 'x', name: 'Bare' }], seriesName: null })
            await h.open()
            h.snap('idle')
        }
    },
    {
        name: 'idle, the saved playlists screen gives several', run: async (h) => {
            h.screen({ playlists: [], seriesName: null })
            await h.open(GIVEN)
            h.snap('idle')
        }
    },
    {
        name: 'idle, one playlist (F90): no mode to choose, the name carries the playlist', run: async (h) => {
            h.screen({ playlists: [], seriesName: null })
            await h.open(ONE)
            h.snap('one playlist')
            await h.click('#startExportBtn')
            h.note('asked', stand.calls)
        }
    },
    {
        name: 'idle, one playlist with a title and no series given', run: async (h) => {
            h.screen({ playlists: [], seriesName: 'Open series' })
            await h.open({ playlists: [{ id: 'q', name: 'Fallback name', title: 'The Title', tracks: [track('A')] }] })
            h.snap('one playlist')
        }
    },
    {
        name: 'the mode chosen changes the note, the name typed is sent', run: async (h) => {
            h.screen({ playlists: TWO, seriesName: 'Road trip' })
            await h.open()
            await h.choose('separate')
            h.snap('separate')
            await h.type('My own name')
            h.note('focus', focusOf())
            await h.choose('merge')
            h.snap('merge again, name kept')
            await h.choose('separate')
            await h.click('#startExportBtn')
            h.note('asked', stand.calls)
            h.snap('after the press')
        }
    },
    {
        name: 'exporting: searching, creating, adding', run: async (h) => {
            h.screen({ playlists: TWO, seriesName: 'Road trip' })
            await h.open()
            await h.click('#startExportBtn')
            h.snap('pressed, no word yet')
            await h.backdrop()
            h.snap('the backdrop while it waits for the first word')
            h.progress('MATCHING', 1, 4, { title: 'One' })
            h.snap('searching 1 of 4')
            h.note('focus', focusOf())
            h.progress('MATCHING', 3, 4, { title: 'Three' })
            h.snap('searching 3 of 4')
            h.progress('MATCHING', 0, 0, { title: '' })
            h.snap('searching, no total')
            await h.backdrop()
            await h.key('Escape')
            h.snap('the backdrop and Escape do nothing while it works')
            h.progress('CREATING', 4, 4, { name: 'Road trip' })
            h.snap('creating')
            h.progress('ADDING', 2, 4, { name: 'Road trip', count: 2 })
            h.snap('adding')
        }
    },
    {
        name: 'done, everything created, with the links', run: async (h) => {
            h.screen({ playlists: TWO, seriesName: 'Road trip' })
            await h.open()
            await h.choose('separate')
            await h.click('#startExportBtn')
            h.progress('MATCHING', 4, 4, { title: 'Four' })
            h.finish(report({ mode: 'separate', created: [made('Road trip - Greatest Hits', 'pl-1'), made('Road trip - Deep Cuts', 'pl-2', { tracks: 1 })] }))
            await h.settle()
            h.snap('done')
            h.note('focus', focusOf())
        }
    },
    {
        name: 'done, one playlist already there and an address that is no link', run: async (h) => {
            h.screen({ playlists: TWO, seriesName: 'Road trip' })
            await h.open()
            await h.click('#startExportBtn')
            h.finish(report({ created: [made('Road trip', 'pl-1', { alreadyThere: true }), { ...made('Evil', 'x'), url: 'javascript:alert(1)' }, { ...made('No address', 'y'), url: undefined }] }))
            await h.settle()
            h.snap('done')
        }
    },
    {
        name: 'partial: tracks not found, created without all their tracks, none found, not created', run: async (h) => {
            h.screen({ playlists: TWO, seriesName: 'Road trip' })
            await h.open()
            await h.click('#startExportBtn')
            missing(12).forEach(item => h.notFound(item))
            h.finish(report({
                mode: 'separate', totalTracks: 14, matchCount: 2,
                created: [made('Road trip - Greatest Hits', 'pl-1')],
                incomplete: [{ name: 'Road trip - Deep Cuts', url: 'https://open.spotify.com/playlist/pl-2', tracks: 100, total: 150 }],
                empty: ['Road trip - Ghosts'], notCreated: ['Road trip - B-Sides'],
                failure: { kind: 'error', detail: 'Server error' }
            }))
            await h.settle()
            h.snap('partial')
        }
    },
    {
        name: 'partial: one track not found (the summary), nothing matched', run: async (h) => {
            h.screen({ playlists: TWO, seriesName: 'Road trip' })
            await h.open()
            await h.click('#startExportBtn')
            h.notFound({ artist: 'Only', title: 'One' })
            h.finish(report({ totalTracks: 1, matchCount: 0, empty: ['Road trip'] }))
            await h.settle()
            h.snap('one not found')
            h.finish(report())
        }
    },
    {
        name: 'done, the report has no tracks at all', run: async (h) => {
            h.screen({ playlists: TWO, seriesName: 'Road trip' })
            await h.open()
            await h.click('#startExportBtn')
            h.finish(report({ totalTracks: 0, matchCount: 0, created: [made('Road trip', 'pl-1')] }))
            await h.settle()
            h.snap('done, no summary')
        }
    },
    {
        name: 'not connected: connect again, and leaving to sign in', run: async (h) => {
            h.screen({ playlists: TWO, seriesName: 'Road trip' })
            await h.open()
            await h.click('#startExportBtn')
            h.finish(report({
                mode: 'separate', created: [made('Road trip - Greatest Hits', 'pl-1')], notCreated: ['Road trip - Deep Cuts'],
                failure: { kind: 'reconnect' }
            }))
            await h.settle()
            h.snap('reconnect')
            await h.click('#reconnectSpotifyBtn')
            h.note('asked', stand.calls)
        }
    },
    {
        name: 'failure: try again, and it works the second time', run: async (h) => {
            h.screen({ playlists: TWO, seriesName: 'Road trip' })
            await h.open()
            await h.click('#startExportBtn')
            h.finish(report({ notCreated: ['Road trip'], failure: { kind: 'rate-limit', retryAfterSeconds: 600 } }))
            await h.settle()
            h.snap('failed')
            h.note('focus', focusOf())
            await h.click('#retryExportBtn')
            h.snap('trying again')
            h.finish(report({ created: [made('Road trip', 'pl-1')] }))
            await h.settle()
            h.snap('done the second time')
            h.note('asked', stand.calls)
        }
    },
    {
        name: 'failure the service did not foresee: with a message and without', run: async (h) => {
            h.screen({ playlists: TWO, seriesName: 'Road trip' })
            await h.open()
            await h.click('#startExportBtn')
            h.fail(new Error('boom'))
            await h.settle()
            h.snap('boom')
            await h.click('#retryExportBtn')
            h.fail({})
            await h.settle()
            h.snap('no message')
        }
    },
    {
        name: 'nothing to export: the notice, the window stays', run: async (h) => {
            h.screen({ playlists: [], seriesName: 'Road trip' })
            await h.open()
            await h.click('#startExportBtn')
            h.snap('still idle')
            h.note('asked', stand.calls)
        }
    },
    {
        name: 'the button pressed twice starts one export', run: async (h) => {
            h.screen({ playlists: TWO, seriesName: 'Road trip' })
            await h.open()
            const button = document.querySelector('#startExportBtn')
            button.click()
            button.click()
            h.note('asked', stand.calls)
            h.finish(report({ created: [made('Road trip', 'pl-1')] }))
            await h.settle()
            h.snap('done')
        }
    },
    {
        name: 'closing: the X, the Close button, the backdrop; the window forgets its state', run: async (h) => {
            h.screen({ playlists: TWO, seriesName: 'Road trip' })
            await h.open()
            await h.click('.close-modal-btn')
            h.snap('after the X')
            await h.open()
            await h.backdrop()
            h.snap('after the backdrop')
            await h.open()
            await h.click('.glass-panel')
            h.snap('a click inside does not close')
            await h.click('#startExportBtn')
            h.finish(report({ created: [made('Road trip', 'pl-1')] }))
            await h.settle()
            await h.backdrop()
            h.snap('after the backdrop on the report')
            await h.open()
            await h.click('#startExportBtn')
            h.finish(report({ created: [made('Road trip', 'pl-1')] }))
            await h.settle()
            await h.clickLast('.close-modal-btn')
            h.snap('after Close on the report')
            h.note('focus', focusOf())
        }
    },
    {
        name: 'closed while the export waits for its first word, then it speaks', run: async (h) => {
            h.screen({ playlists: TWO, seriesName: 'Road trip' })
            await h.open()
            await h.click('#startExportBtn')
            await h.click('.close-modal-btn')
            h.snap('closed')
            h.progress('MATCHING', 1, 2, { title: 'late' })
            h.finish(report({ created: [made('Road trip', 'pl-1')] }))
            await h.settle()
            h.snap('nothing comes back')
        }
    },
    {
        name: 'what a person typed or the export said is text, never markup', run: async (h) => {
            h.screen({ playlists: [{ id: 'h', name: HOSTILE, tracks: [track('A')] }], seriesName: HOSTILE })
            await h.open()
            h.snap('idle')
            await h.click('#startExportBtn')
            h.progress('MATCHING', 1, 2, { title: HOSTILE })
            h.snap('searching')
            h.notFound({ artist: HOSTILE, title: HOSTILE })
            h.finish(report({
                created: [made(HOSTILE, 'h', { url: `https://open.spotify.com/playlist/"><b>x</b>` })], incomplete: [{ name: HOSTILE, url: 'https://x.y', tracks: 1, total: 2 }],
                empty: [HOSTILE], notCreated: [HOSTILE], failure: { kind: 'error', detail: HOSTILE }
            }))
            await h.settle()
            h.snap('done')
            h.note('injected', window.__xss === undefined)
        }
    }
]

export const keyOf = (scenario) => scenario.name
