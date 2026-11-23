/**
 * The states of the export window that F83 sync 2 checks (the window of F90, on `main` hand-made, in React here), written once so the window
 * as it was and as it is are asked the same thing: the same job, the same presses, the same typing, and what stands in the page (the window of
 * the computer, the sheet of the phone) and where the focus is after each step. The doubles (MusicKit with folders, none, an error or no
 * answer; the Apple Music export service that says its progress and waits) are test/support/exportStandIns.js.
 *
 * Used by reports/evidence/F83/sync-2/capture-export-from-main.test.js (run once on the tree of `main`, it wrote
 * test/fixtures/exportWindowFromMain.json) and test/ui/PlaylistExportWindow.sameAsBefore.test.tsx (the React window, against that file).
 */
import { normalize } from './savedPlaylistsScenarios.js'
import { stand } from './exportStandIns.js'

const track = (title) => ({ title, artist: 'Artist', album: 'Album', duration: 180 })
export const BATCH = [
    { id: 'p1', name: 'Greatest Hits', tracks: [track('One'), track('Two')] },
    { id: 'p2', name: 'Deep Cuts', tracks: [track('Three'), track('Four')] },
    { id: 'p3', name: 'B-Sides', tracks: [track('Five')] }
]
export const JOB = { seriesName: 'Road trip', batchName: 'Mix', playlists: BATCH, positions: [1, 2, 3], title: 'Export Mix' }
const ONE = { ...JOB, playlists: [BATCH[1]], positions: [2], title: 'Export Deep Cuts' }
const KEY = 'mjrp_apple_music_folder:Road trip'

/** What has the focus, in words: the control by what it is, never by where it is. */
export function focusOf() {
    const active = document.activeElement
    if (!active || active === document.body) return 'body'
    const mark = active.dataset?.mode ? `${active.dataset.mode}:${active.value}` : (active.dataset?.export || active.dataset?.appleExport || active.dataset?.folderBack || active.dataset?.folderName || active.getAttribute('aria-label') || active.className)
    return `${active.tagName.toLowerCase()} ${mark}`
}

/** A piece of the page as the proof compares it, with what a person sees of a field (its state), not how a library wrote it. */
export function snapOf(selector) {
    const element = document.querySelector(selector)
    if (!element) return null
    const clone = element.cloneNode(true)
    const live = [...element.querySelectorAll('input')]
    ;[...clone.querySelectorAll('input')].forEach((input, index) => {
        input.removeAttribute('checked')
        if (live[index].type === 'radio' && live[index].checked) input.setAttribute('data-is-checked', 'true')
        if (live[index].type === 'text') input.setAttribute('data-typed', live[index].value)
        input.removeAttribute('value')
        if (live[index].type === 'radio') input.setAttribute('data-value', live[index].value)
    })
    return normalize(clone)
}

const onWindow = (phone) => (phone ? '.sheet' : '#playlist-export-window')

export const SCENARIOS = [
    {
        name: 'the three destinations', run: async (h) => {
            await h.open(JOB)
            h.snap('the window')
            h.note('focus', focusOf())
        }
    },
    {
        name: 'the three destinations', phone: true, run: async (h) => {
            await h.open(JOB)
            h.snap('the sheet')
            h.note('focus', focusOf())
        }
    },
    {
        name: 'the step: folders arrive', run: async (h) => {
            await h.open(JOB)
            await h.click('[data-export="apple"]')
            h.snap('reading')
            await h.settle()
            h.snap('read')
            h.note('focus', focusOf())
            await h.pick('existing', 'Workout')
            h.snap('Workout picked')
            await h.click('[data-apple-export]')
            await h.settle()
            h.snap('exporting')
            h.note('the service was asked', stand.calls.filter(call => call[0] !== 'listFolders'))
            h.finish()
            await h.settle()
            h.snap('done')
        }
    },
    {
        name: 'the step: folders arrive', phone: true, run: async (h) => {
            await h.open(JOB)
            await h.click('[data-export="apple"]')
            await h.settle()
            h.snap('read')
            h.note('focus', focusOf())
            await h.pick('none')
            await h.click('[data-apple-export]')
            await h.settle()
            h.snap('exporting')
            h.note('the service was asked', stand.calls.filter(call => call[0] !== 'listFolders'))
            h.finish()
        }
    },
    {
        name: 'the step: the library has no folder', run: async (h) => {
            stand.mode = 'none'
            await h.open(JOB)
            await h.click('[data-export="apple"]')
            await h.settle()
            h.snap('empty')
        }
    },
    {
        name: 'the step: the folders cannot be read', run: async (h) => {
            stand.mode = 'error'
            await h.open(JOB)
            await h.click('[data-export="apple"]')
            await h.settle()
            h.snap('failed')
            await h.type('Gone')
            h.snap('a name typed')
            await h.click('[data-apple-export]')
            await h.settle()
            h.note('the service was asked', stand.calls.filter(call => call[0] !== 'listFolders'))
            h.finish()
        }
    },
    {
        name: 'the step: a new folder', run: async (h) => {
            await h.open(JOB)
            await h.click('[data-export="apple"]')
            await h.settle()
            await h.pick('new')
            await h.click('[data-apple-export]')
            h.snap('a name is asked for')
            h.note('focus', focusOf())
            await h.type('Trip 2026')
            h.snap('the name typed')
            await h.click('[data-apple-export]')
            await h.settle()
            h.note('the service was asked', stand.calls.filter(call => call[0] !== 'listFolders'))
            h.note('what is remembered', localStorage.getItem(KEY))
            h.finish()
        }
    },
    {
        name: 'the step: the last choice is remembered', run: async (h) => {
            localStorage.setItem(KEY, '{"name":"Favorites"}')
            await h.open(JOB)
            await h.click('[data-export="apple"]')
            await h.settle()
            h.snap('an existing folder remembered')
            await h.click('[data-folder-back]')
            localStorage.setItem(KEY, '{"none":true}')
            await h.click('[data-export="apple"]')
            await h.settle()
            h.snap('no folder remembered')
            await h.click('[data-folder-back]')
            localStorage.setItem(KEY, '{"name":"Gone"}')
            await h.click('[data-export="apple"]')
            await h.settle()
            h.snap('a folder the library no longer has')
        }
    },
    {
        name: 'the step: while it reads', run: async (h) => {
            stand.mode = 'pending'
            await h.open(JOB)
            await h.click('[data-export="apple"]')
            await h.settle()
            h.snap('waiting')
            h.note('focus', focusOf())
            await h.click('[data-apple-export]')
            await h.settle()
            h.snap('exporting while it reads')
            h.finish()
        }
    },
    {
        name: 'one playlist', run: async (h) => {
            await h.open(ONE)
            h.snap('the window')
            await h.click('[data-export="apple"]')
            await h.settle()
            await h.click('[data-apple-export]')
            await h.settle()
            h.note('the service was asked', stand.calls.filter(call => call[0] !== 'listFolders'))
            h.finish()
        }
    },
    {
        name: 'opened on the folder step', run: async (h) => {
            await h.open({ start: 'apple', title: 'Export to Apple Music' })
            await h.settle()
            h.snap('the step')
            h.note('focus', focusOf())
            await h.click('[data-folder-back]')
            h.snap('back to the destinations')
            h.note('focus', focusOf())
            await h.click('[data-export="apple"]')
            h.snap('the step again')
        }
    },
    {
        name: 'Spotify and the file', run: async (h) => {
            await h.open(JOB)
            await h.click('[data-export="spotify"]')
            await h.settle()
            h.snap('after Spotify')
            await h.open(ONE)
            await h.click('[data-export="json"]')
            await h.settle()
            h.snap('after the file')
            h.note('what the exports were given', stand.calls.filter(call => call[0] === 'spotifyWindow' || call[0] === 'json'))
        }
    },
    {
        name: 'Escape, the backdrop and Tab', run: async (h) => {
            const opener = document.createElement('button')
            opener.textContent = 'Export'
            document.body.appendChild(opener)
            await h.open({ ...JOB, opener })
            const marks = []
            const tab = (shiftKey) => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true }))
            const last = [...document.querySelectorAll('#playlist-export-window button:not([disabled])')].pop()
            last.focus()
            tab(false)
            marks.push(focusOf())
            tab(true)
            marks.push(focusOf())
            h.note('Tab round the window', marks)
            await h.key('Escape')
            h.note('after Escape', [document.querySelector('#playlist-export-window') === null, focusOf()])
            await h.open({ ...JOB, opener })
            await h.click('#playlist-export-window')
            h.note('after the backdrop', [document.querySelector('#playlist-export-window') === null, focusOf()])
            await h.open({ ...JOB, opener })
            await h.click('#playlist-export-window .app-modal__close')
            h.note('after the close button', [document.querySelector('#playlist-export-window') === null, focusOf()])
        }
    },
    {
        name: 'Escape and the opener', phone: true, run: async (h) => {
            const opener = document.createElement('button')
            opener.textContent = 'Export'
            document.body.appendChild(opener)
            await h.open({ ...JOB, opener })
            await h.key('Escape')
            await h.settle()
            h.note('after Escape', focusOf())
        }
    }
]

export const keyOf = (scenario) => `${scenario.phone ? 'phone' : 'computer'} · ${scenario.name}`
export { onWindow }
