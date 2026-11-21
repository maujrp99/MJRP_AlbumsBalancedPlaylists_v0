/**
 * Visual recheck 2026-11-21: extension of the F76 playlists harness (reports/evidence/F76/harness/playlists/main.js).
 * Draws the real playlists screens with fixture data.
 *   ?screen=generated            PlaylistsView with 6 fixture playlists
 *   ?screen=empty                PlaylistsView with NO playlists (F73: says so and leads to the Blending Menu)
 *   ?screen=saved&mode=...       SavedPlaylistsView driven through the REAL SavedPlaylistsController and the REAL
 *                                SavedPlaylistsReader, with a stand-in `source` (no Firestore):
 *        mode=mixed (default)    series reading, ready, empty, failed (and a ready one) at once
 *        mode=ready | empty | loading (every series reading) | loading-list (the list itself reading)
 *        mode=failed (one series failed, the rest ready) | failed-list (the list could not be read)
 *        mode=retried            a failed series, then «Try again» is pressed and the source answers
 *   &open=1                      opens the first series (phone); &batch=1 opens the first batch
 *   ?screen=blend                BlendingMenuView with a stand-in list of series
 */
import '../../../../../../public/css/modals.css'
import '../../../../../../public/css/index.css'
import '../../../../../../public/css/tailwind.css'
import '../../../../../../public/css/mobile.css'
import '../../../../../../public/css/mobile/screens.css'
import '../../../../../../public/css/safe-area.css'
import { startPhoneShell } from '../../../../../../public/js/components/navigation/PhoneShell.js'
import { playlistsStore } from '../../../../../../public/js/stores/playlists.js'
import { albumsStore } from '../../../../../../public/js/stores/albums.js'
import { albumSeriesStore } from '../../../../../../public/js/stores/albumSeries.js'
import { PlaylistsView } from '../../../../../../public/js/views/PlaylistsView.js'
import { SavedPlaylistsView } from '../../../../../../public/js/views/SavedPlaylistsView.js'
import { BlendingMenuView } from '../../../../../../public/js/views/BlendingMenuView.js'
import { BlendSeriesSelector } from '../../../../../../public/js/components/blend/BlendSeriesSelector.js'
import { SavedPlaylistsController } from '../../../../../../public/js/components/playlists/SavedPlaylistsController.js'
import { SavedPlaylistsStore } from '../../../../../../public/js/stores/savedPlaylists.js'
import { SavedPlaylistsReader } from '../../../../../../public/js/services/playlists/SavedPlaylistsReader.js'
import { generatedPlaylists, savedSeries } from './fixtures.js'
import toast from '../../../../../../public/js/components/Toast.js'

window.__toast = toast
window.__stores = { playlistsStore, albumsStore, albumSeriesStore }

const params = new URLSearchParams(location.search)
const screen = params.get('screen') || 'generated'
const mode = params.get('mode') || 'mixed'
const app = document.getElementById('app')

const fakeRouter = { afterNavigate: () => { }, navigate: (to) => console.log('[harness] navigate', to) }
const fakeUsers = { getState: () => ({ currentUser: null }), subscribe: () => () => { } }
const route = { generated: '/playlists', empty: '/playlists', saved: '/saved-playlists', blend: '/blend' }[screen]
try { localStorage.clear() } catch { /* nothing kept */ }
history.replaceState({}, '', route + location.search)
startPhoneShell({ router: fakeRouter, userStore: fakeUsers, clearCaches: async () => { } })

async function showGenerated() {
    playlistsStore.setPlaylists(generatedPlaylists(), null)
    playlistsStore.setBatchName('Sunday Morning Prog Rock Deep Cuts')
    const view = new PlaylistsView()
    view.phoneActive = Number(params.get('active') || 0)
    app.innerHTML = ''
    app.appendChild(await view.render({}))
    await view.mount({})
    window.__view = view
}

async function showEmpty() {
    playlistsStore.setPlaylists([], null)
    playlistsStore.setBatchName('')
    const view = new PlaylistsView()
    app.innerHTML = ''
    app.appendChild(await view.render({}))
    await view.mount({})
    window.__view = view
}

// ---- Saved playlists: a stand-in `source` for the real reader --------------------------------------
const never = () => new Promise(() => { })
const listOf = (series) => series.map(({ id, name, playlists }, index) => ({
    id, name, updatedAt: `2026-11-${String(20 - index).padStart(2, '0')}T00:00:00Z`,
    albumQueries: playlists[0]?.tracks?.slice(0, 3).map(t => `${t.artist} - ${t.album}`) || ['Pink Floyd - Wish You Were Here']
}))

function sourceFor(mode) {
    const series = savedSeries().slice(0, 6)
    const byId = new Map(series.map(s => [s.id, s]))
    const ids = series.map(s => s.id)
    // what each series answers: 'reading' never answers, 'empty' is [], 'failed' rejects
    const plan = {
        mixed: [['ready'], ['ready'], ['reading'], ['empty'], ['failed'], ['ready']],
        ready: ['ready', 'ready', 'ready', 'ready', 'ready', 'ready'].map(x => [x]),
        empty: ['empty', 'empty', 'empty', 'empty', 'empty', 'empty'].map(x => [x]),
        loading: ['reading', 'reading', 'reading', 'reading', 'reading', 'reading'].map(x => [x]),
        failed: [['ready'], ['ready'], ['failed'], ['ready'], ['ready'], ['ready']],
        retried: [['ready'], ['ready'], ['failed-once'], ['ready'], ['ready'], ['ready']]
    }[mode] || []
    const calls = {}
    return {
        listSeries: async () => {
            if (mode === 'loading-list') return never()
            if (mode === 'failed-list') throw new Error('Missing or insufficient permissions.')
            return listOf(series)
        },
        listPlaylists: async (userId, seriesId) => {
            const index = ids.indexOf(seriesId)
            const kind = plan[index]?.[0] || 'ready'
            calls[seriesId] = (calls[seriesId] || 0) + 1
            if (kind === 'reading') return never()
            if (kind === 'empty') return []
            if (kind === 'failed') throw new Error('Failed to get documents from server')
            if (kind === 'failed-once' && calls[seriesId] === 1) throw new Error('Failed to get documents from server')
            return byId.get(seriesId).playlists
        },
        deletePlaylists: async () => { }
    }
}

async function showSaved() {
    const store = new SavedPlaylistsStore()
    // a very long timeout: «reading» is a promise that never answers and must not turn into «failed» after 15 s
    const reader = new SavedPlaylistsReader({ store, source: sourceFor(mode), getUserId: () => 'harness-user', limits: { concurrency: 8, timeoutMs: 24 * 3600 * 1000 } })
    const view = new SavedPlaylistsView()
    view.controller = new SavedPlaylistsController(view, { reader, store })
    app.innerHTML = ''
    app.appendChild(view.render())
    await view.mount()
    // let the reader answer what it can answer
    await new Promise(resolve => setTimeout(resolve, 600))
    if (mode === 'retried') document.querySelector('.series-failed button, .series-failed .btn, [data-action="retry"]')?.click()
    await new Promise(resolve => setTimeout(resolve, 400))
    if (params.get('open')) document.querySelector('.saved-series-toggle')?.click()
    if (params.get('batch')) document.querySelector('.series-group .batch-header')?.click()
    window.__view = view
    window.__store = store
}

async function showBlend() {
    // the series the person would have (stand-in); no thumbnails are looked up (no network)
    BlendSeriesSelector.prototype.preloadAllThumbnails = async function () { }
    const hues = [12, 38, 200, 260, 320, 150]
    const cover = (i) => 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(' + hues[i % 6] + ',70%,55%)"/><stop offset="1" stop-color="hsl(' + ((hues[i % 6] + 60) % 360) + ',60%,25%)"/></linearGradient></defs><rect width="10" height="10" fill="url(#g)"/></svg>')
    const names = ['Prog Rock Classics', 'Alternative R&B / Psychedelic / Avant-Garde Soul of the Seventies', 'Brazilian Jazz', 'The Beatles', 'Krautrock Essentials', 'Classic Rock', 'Jazz Fusion', 'Post-Punk']
    albumSeriesStore.setSeries(names.map((name, i) => ({ id: 's' + i, name, albumQueries: Array.from({ length: 5 + i * 2 }, (_, k) => `Artist ${k} - Album ${k}`) })))
    const view = new BlendingMenuView()
    window.router = { currentView: view }
    app.innerHTML = ''
    app.appendChild(await view.render({}))
    await view.mount({})
    const selector = view.seriesSelector
    albumSeriesStore.getSeries().forEach((s, i) => selector.thumbnailCache.set(s.id, [0, 1, 2].map(k => cover(i + k))))
    selector.render()
    if (params.get('step') === 'recipe') { selector.onSeriesSelect(albumSeriesStore.getSeries()[0]); await new Promise(r => setTimeout(r, 500)) }
    window.__view = view
}

const SHOW = { generated: showGenerated, empty: showEmpty, saved: showSaved, blend: showBlend }
SHOW[screen]().then(() => { document.body.dataset.harnessReady = 'true' }).catch(error => { console.error(error); document.body.dataset.harnessReady = 'error:' + (error?.message || error) })
