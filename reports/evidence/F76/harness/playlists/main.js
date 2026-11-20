/**
 * Draws the real playlists screens with fixture data. ?screen=generated (default) | saved
 * Optional: &open=1 opens the first saved series; &active=N opens playlist N on the phone.
 */
import '../../../../../public/css/modals.css'
import '../../../../../public/css/index.css'
import '../../../../../public/css/tailwind.css'
import '../../../../../public/css/mobile.css'
import '../../../../../public/css/mobile/screens.css'
import '../../../../../public/css/safe-area.css'
import { startPhoneShell } from '../../../../../public/js/components/navigation/PhoneShell.js'
import { playlistsStore } from '../../../../../public/js/stores/playlists.js'
import { PlaylistsView } from '../../../../../public/js/views/PlaylistsView.js'
import { SavedPlaylistsView } from '../../../../../public/js/views/SavedPlaylistsView.js'
import { SavedPlaylistsController } from '../../../../../public/js/components/playlists/SavedPlaylistsController.js'
import { SavedPlaylistsStore } from '../../../../../public/js/stores/savedPlaylists.js'
import { SeriesPlaylistsStatus, groupIntoBatches } from '../../../../../public/js/models/savedPlaylists.js'
import { generatedPlaylists, savedSeries } from './fixtures.js'
import toast from '../../../../../public/js/components/Toast.js'

window.__toast = toast

const params = new URLSearchParams(location.search)
const screen = params.get('screen') || 'generated'
const app = document.getElementById('app')

const fakeRouter = { afterNavigate: () => { }, navigate: (to) => console.log('[harness] navigate', to) }
const fakeUsers = { getState: () => ({ currentUser: null }), subscribe: () => () => { } }
history.replaceState({}, '', (screen === 'saved' ? '/saved-playlists' : '/playlists') + location.search)
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

async function showSaved() {
    const store = new SavedPlaylistsStore()
    const reader = { load: () => Promise.resolve(), refreshSeries: () => Promise.resolve(), removeBatch: () => Promise.resolve(1), removeAll: () => Promise.resolve(1) }
    const view = new SavedPlaylistsView()
    view.controller = new SavedPlaylistsController(view, { reader, store })
    store.begin(1, 'u1')
    store.setSeries(savedSeries().map(({ id, name, playlists }) => ({
        seriesId: id, series: { id, name, updatedAt: '2026-11-01T00:00:00Z' }, status: SeriesPlaylistsStatus.READY,
        playlists, batches: groupIntoBatches(playlists), thumbnails: [], error: null, refreshing: false
    })))
    store.flush()
    app.innerHTML = ''
    app.appendChild(view.render())
    await view.mount()
    if (params.get('open')) document.querySelector('.saved-series-toggle')?.click()
    if (params.get('batch')) document.querySelector('.series-group .batch-header')?.click()
    window.__view = view
}

(screen === 'saved' ? showSaved() : showGenerated()).then(() => { document.body.dataset.harnessReady = 'true' })
