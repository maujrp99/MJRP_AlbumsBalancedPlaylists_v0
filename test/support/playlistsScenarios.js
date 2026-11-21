/**
 * The states of the playlists screen (/playlists and /playlists/edit) that F83 wave 2 checks, written once so the screen as it was
 * (hand-made) and the screen as it is (React) are asked the same thing: the same playlists in the store, the same clicks, and what
 * stands in `#app` (and in the sheet the screen opens over the page) after each step. `normalize` is the one of wave 1
 * (savedPlaylistsScenarios.js); the only thing this screen draws that is not a function of its data is the time in its foot
 * («Last updated: 3:41:07 PM»), which is written down as `#`.
 *
 * The service that owns the set on screen is a small stand-in (`fakeService`): it keeps the steps of a history and shows them in the
 * store the way PlaylistsService does (a new list per edit), so what the screen draws after a move, a removal, an undo is the
 * screen reading a store that changed, which is the thing under test. Whatever the screen asks of what is outside it (the Spotify
 * window, the file and Apple exports, the question before deleting a playlist) is written down in `outside`.
 *
 * Used by: reports/evidence/F83/wave-2/capture-before.test.js (run once, on the hand-made screen, before it was deleted; it wrote
 * test/fixtures/playlistsBeforeF83.json) and test/screens/playlists/Playlists.sameAsBefore.test.tsx (the React screen, against that file).
 */
import { vi } from 'vitest'
import { normalize as pageOf } from './savedPlaylistsScenarios.js'
import { playlistsStore } from '../../public/js/stores/playlists.js'
import { router } from '../../public/js/router.js'
import { albumsStore } from '../../public/js/stores/albums.js'

/**
 * The page as the proof compares it, with the moment of light of a moved row taken out, and the text of a
 * field as the field holds it now (what a person typed lives in the property `value`, not in the attribute the page was written
 * with). It reads a COPY: the proof must not touch the live page (`normalize()` of a node joins the text nodes that React holds).
 */
export const normalize = (element) => {
    if (!element) return null
    const copy = element.cloneNode(true)
    const typed = element.querySelectorAll('input')
    copy.querySelectorAll('input').forEach((input, i) => input.setAttribute('value', typed[i].value))
    // the row a track landed on is lit by a timer for a moment: whether a snapshot falls inside that moment is not what the page says
    return pageOf(copy).replace(/\bis-moved ?/g, '')
}

const track = (title, artist, album, duration, extra = {}) => ({ id: `t-${title}`, title, artist, album, duration, ...extra })
const meta = { algorithmId: 'mjrp-balanced-cascade', rankingId: 'balanced' }

/** Three playlists as the blend makes them: badges of every kind on the tracks, one empty. */
export const generated = () => [
    {
        id: 'p1', name: 'Playlist 1', title: 'Greatest Hits', batchName: '', _meta: { ...meta }, tracks: [
            track('Kashmir', 'Led Zeppelin', 'Physical Graffiti', 510, { rank: 1, rating: 94, spotifyRank: 2, userRank: 1 }),
            track('Ramble On', 'Led Zeppelin', 'Led Zeppelin II', 275, { rank: 7, rating: 88, spotifyPopularity: 71 }),
            track('Time', 'Pink Floyd', 'The Dark Side of the Moon', 413, { spotifyRank: 5 })
        ]
    },
    {
        id: 'p2', name: 'Playlist 2', batchName: '', _meta: { ...meta, rankingId: 'spotify' }, tracks: [
            track('Gone Gone Gone', 'Plant & Krauss', 'Raising Sand', 200, { rank: 12 }),
            track('Money', 'Pink Floyd', '', 382)
        ]
    },
    { id: 'p3', name: 'Playlist 3', batchName: '', _meta: { ...meta }, tracks: [] }
]

export const outside = []
let steps = []
let at = 0

/** Shows a set as the service does after an edit: a new list in the store and the state of the undo buttons. */
const show = (next) => {
    playlistsStore.setPlaylists(next)
    playlistsStore.setDirty(at > 0)
    playlistsStore.setUndoState(at > 0, at < steps.length - 1)
}

const edit = (next) => {
    steps = [...steps.slice(0, at + 1), next]
    at = steps.length - 1
    show(next)
}

const withTracks = (playlists, index, change) => playlists.map((p, i) => (i === index ? { ...p, tracks: change(p.tracks || []) } : p))

export const fakeService = {
    /** The set the screen opens with: the first step of the history. */
    begin(playlists, extra = {}) {
        steps = [playlists]
        at = 0
        outside.length = 0
        playlistsStore.reset()
        playlistsStore.setPlaylists(playlists)
        if (extra.defaultName) playlistsStore.setDefaultBatchName(extra.defaultName)
    },
    moveTrack(from, to, trackIndex, newIndex) {
        outside.push(['moveTrack', from, to, trackIndex, newIndex])
        const playlists = playlistsStore.getPlaylists()
        const moved = playlists[from]?.tracks?.[trackIndex]
        if (!moved || !playlists[to]) return
        const taken = withTracks(playlists, from, tracks => tracks.filter((_, i) => i !== trackIndex))
        edit(withTracks(taken, to, tracks => [...tracks.slice(0, newIndex), moved, ...tracks.slice(newIndex)]))
    },
    removeTrack(playlistIndex, trackIndex) {
        outside.push(['removeTrack', playlistIndex, trackIndex])
        edit(withTracks(playlistsStore.getPlaylists(), playlistIndex, tracks => tracks.filter((_, i) => i !== trackIndex)))
    },
    removePlaylist(index) {
        outside.push(['removePlaylist', index])
        const playlists = playlistsStore.getPlaylists()
        const removed = playlists[index]
        if (removed) edit(playlists.filter((_, i) => i !== index))
        return removed || null
    },
    renamePlaylist(index, title) {
        outside.push(['renamePlaylist', index, title])
        edit(playlistsStore.getPlaylists().map((p, i) => (i === index ? { ...p, name: title, title } : p)))
        return true
    },
    undo() {
        outside.push(['undo'])
        if (at === 0) return false
        at -= 1
        show(steps[at])
        return true
    },
    redo() {
        outside.push(['redo'])
        if (at >= steps.length - 1) return false
        at += 1
        show(steps[at])
        return true
    },
    hasUnsavedChanges: () => playlistsStore.isDirty,
    setCreateMode() { playlistsStore.setMode('CREATING') },
    restoreDraft: () => false,
    setEditMode(batchName, seriesId) {
        playlistsStore.setMode('EDITING')
        playlistsStore.setEditContext({ originalBatchName: batchName, currentBatchName: batchName, seriesId })
        playlistsStore.setBatchName(batchName)
    },
    async findBatch(seriesId, batchName) {
        const found = fakeService.batches[batchName] || []
        steps = [found]
        at = 0
        return found
    },
    batches: {},
    resolveBatchName: (typed) => (typed || '').trim() || null,
    async saveCurrentBatch({ batchName }) {
        outside.push(['saveCurrentBatch', batchName])
        return { status: 'saved' }
    }
}

/** What the wiring module of the playlists gives the screen: the stand-in. */
export const wiring = () => ({ getPlaylistsService: () => fakeService })

/** The window of the phone as the screen reads it, and a way to turn it into a computer and back. */
export function asPhone(phone) {
    const listeners = []
    const media = {
        matches: phone,
        addEventListener: (_type, listener) => listeners.push(listener),
        removeEventListener: (_type, listener) => { const i = listeners.indexOf(listener); if (i >= 0) listeners.splice(i, 1) }
    }
    // the time in the foot is the one the scenario says (`h.clock`): a draw of the screen is seen by the time it wrote
    globalThis.__clock = 'T0'
    Date.prototype.toLocaleTimeString = () => globalThis.__clock
    window.scrollTo = vi.fn()
    Element.prototype.scrollIntoView = vi.fn()
    window.matchMedia = vi.fn(() => media)
    return { turn: (to) => { media.matches = to; [...listeners].forEach(listener => listener({ matches: to })) } }
}

export const quiet = () => vi.spyOn(router, 'navigate').mockImplementation(() => {})

const rows = (selector) => [...document.querySelectorAll(selector)].map(row => row.textContent.replace(/\s+/g, ' ').trim()).join(' | ')

const tapRow = (h, text) => h.clickWhere('.phone-sheet-action', text)

const sunday = () => generated().map(p => ({ ...p, batchName: 'Sunday mix' }))

/**
 * Each scenario: a name, whether it is the phone, where the person opened it (`url`), what is in the store before the screen opens
 * (`playlists`, with `defaultName`; `batches` is what a saved batch reads), and what it does with the screen once mounted.
 * `h.snap(label)` writes down `#app` (or, with a selector, the first element of the page that matches it); `h.note(label)` writes
 * down what was asked of the world outside.
 */
export const SCENARIOS = [
    {
        name: 'nothing here yet', url: '/playlists', playlists: [], run: async (h) => { h.snap('empty state') }
    },
    {
        name: 'a saved batch that was not found', url: '/playlists/edit?edit=Ghost%20batch&seriesId=s1', playlists: [], run: async (h) => { h.snap('batch not found') }
    },
    {
        name: 'playlists from the blend', url: '/playlists', playlists: generated(), run: async (h) => {
            h.snap('generated')
            await h.type('#batchNameInput', 'Road trip')
            h.snap('the name typed: the grid has it beside each title')
            await h.type('#batchNameInput', '')
            h.snap('the name cleared')
            await h.click('[data-action="toggle-regenerate-panel"]')
            h.snap('the panel to generate again, open')
            await h.click('[data-action="toggle-regenerate-panel"]')
            h.snap('the panel closed')
        }
    },
    {
        name: 'a default name for the batch', url: '/playlists', playlists: generated(), defaultName: 'TheAlbumBlender Playlist 2026-11-21', run: async (h) => {
            h.snap('the default name')
            await h.type('#batchNameInput', 'Road trip')
            await h.type('#batchNameInput', '')
            h.snap('the name cleared by hand: the field is empty and the grid has no name')
            await h.publish(() => playlistsStore.setDirty(true))
            h.snap('the next draw: the default name is back')
        }
    },
    {
        name: 'the foot', url: '/playlists', playlists: generated(), run: async (h) => {
            h.snap('the foot at the start', '.last-update')
            h.clock('T1')
            await h.publish(() => albumsStore.notify())
            h.snap('the foot after the albums store told', '.last-update')
            h.clock('T2')
            await h.publish(() => playlistsStore.setDirty(false))
            h.snap('the foot after the playlists store told', '.last-update')
        }
    },
    {
        name: 'editing the set', url: '/playlists', playlists: generated(), run: async (h) => {
            await h.publish(() => fakeService.moveTrack(0, 1, 0, 1))
            h.snap('a track moved to another playlist: undo is on')
            await h.publish(() => fakeService.moveTrack(1, 1, 0, 2))
            h.snap('a track moved inside its playlist')
            await h.click('button[data-action="remove-track"][data-playlist-index="0"][data-track-index="0"]')
            h.snap('a track removed')
            await h.click('[data-action="delete-playlist"][data-playlist-index="2"]')
            h.snap('a playlist deleted')
            await h.click('[data-action="undo-edit"]')
            h.snap('undone')
            await h.click('[data-action="redo-edit"]')
            h.snap('redone')
            await h.focusIn('.playlist-name[data-playlist-index="0"]')
            await h.typeTitle('.playlist-name[data-playlist-index="0"]', 'Best of Zeppelin')
            await h.focusOut('.playlist-name[data-playlist-index="0"]')
            h.snap('a title typed over')
            await h.focusIn('.playlist-name[data-playlist-index="1"]')
            await h.typeTitle('.playlist-name[data-playlist-index="1"]', '')
            await h.focusOut('.playlist-name[data-playlist-index="1"]')
            h.snap('an empty title is given up')
            h.note('what the service was asked')
        }
    },
    {
        name: 'busy', url: '/playlists', playlists: generated(), run: async (h) => {
            await h.generating(true)
            h.snap('generating')
            await h.generating(false)
            await h.publish(() => playlistsStore.setSaving(true))
            h.snap('saving')
            await h.publish(() => playlistsStore.setSaving(false))
            h.snap('saved')
        }
    },
    {
        name: 'a saved batch being edited', url: '/playlists/edit?edit=Sunday%20mix&seriesId=s1', batches: { 'Sunday mix': sunday() }, run: async (h) => {
            h.snap('edit mode')
            await h.type('#batchNameInput', 'Sunday mix 2')
            await h.click('#saveToHistoryBtn')
            h.note('after the save')
        }
    },
    {
        name: 'the exports', url: '/playlists', playlists: generated(), run: async (h) => {
            await h.click('#exportSpotifyBtn')
            await h.click('#exportJsonBtn')
            await h.click('#exportAppleMusicBtn')
            h.note('what the three buttons asked for')
        }
    },
    {
        name: 'the phone: nothing here yet', phone: true, url: '/playlists', playlists: [], run: async (h) => { h.snap('empty state on the phone') }
    },
    {
        name: 'the phone: playlists from the blend', phone: true, url: '/playlists', playlists: generated(), run: async (h) => {
            h.snap('the first playlist')
            await h.click('[data-phone-action="show-playlist"][data-playlist-index="1"]')
            h.snap('the second playlist')
            await h.click('[data-phone-action="show-playlist"][data-playlist-index="2"]')
            h.snap('the empty playlist')
            await h.type('#batchNameInput', 'On the bus')
            h.snap('the name typed')
            await h.click('[data-phone-action="show-playlist"][data-playlist-index="0"]')
            await h.publish(() => playlistsStore.setSaving(true))
            h.snap('saving')
        }
    },
    {
        name: 'the phone: the sheets', phone: true, url: '/playlists', playlists: generated(), run: async (h) => {
            await h.click('[data-phone-action="track-options"][data-track-index="1"]')
            h.snap('the sheet of a track', '.sheet')
            await tapRow(h, 'Move down')
            h.snap('the track moved, with its notice')
            h.note('the notice', rows('.phone-undo'))
            await h.click('.phone-undo__btn')
            h.snap('the notice taken back')
            await h.click('[data-phone-action="track-options"][data-track-index="0"]')
            h.snap('the sheet of the first track: nothing to move up', '.sheet')
            await tapRow(h, 'Remove from this playlist')
            h.snap('the track removed, with its notice')
            await h.click('[data-phone-action="track-options"][data-track-index="0"]')
            await tapRow(h, '2 · Playlist 2')
            h.snap('the track sent to another playlist')
            await h.click('[data-phone-action="playlist-options"]')
            h.snap('the sheet of a playlist', '.sheet')
            await tapRow(h, 'Delete this playlist')
            h.note('the question before deleting')
            await h.click('[data-phone-action="export"]')
            h.snap('the sheet of the exports', '.sheet')
            await tapRow(h, 'Download JSON')
            h.note('what the export asked for')
            await h.click('[data-phone-action="export"]')
            await tapRow(h, 'Export to Spotify')
            h.note('after Spotify')
            await h.click('[data-phone-action="save"]')
            h.note('after the save')
        }
    },
    {
        name: 'the phone turns into a computer', phone: true, url: '/playlists', playlists: generated(), run: async (h) => {
            await h.turn(false)
            h.snap('the computer')
            await h.turn(true)
            h.snap('the phone again')
        }
    }
]

export const keyOf = (scenario) => `${scenario.phone ? 'phone' : 'computer'} · ${scenario.name}`
export const textOf = (selector) => rows(selector)
