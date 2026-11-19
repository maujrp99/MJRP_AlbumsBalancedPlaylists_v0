/**
 * F60 (UAT-05) - opening the playlists screen after a reload of the page puts back the playlists
 * that were generated and not saved. The controller and the service are the real ones.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('firebase/firestore', async () => (await import('../helpers/fakeFirestore.js')).firestoreModule)
vi.mock('../../public/js/app.js', () => ({ db: { fake: true }, auth: { currentUser: { uid: 'u1' } } }))
vi.mock('../../public/js/cache/CacheManager.js', () => {
    const cacheManager = { get: async () => null, set: async () => { }, invalidate: async () => { } }
    return { cacheManager, CacheManager: class { } }
})
vi.mock('../../public/js/services/SeriesService.js', () => ({ getSeriesService: vi.fn() }))
vi.mock('../../public/js/controllers/BlendingController.js', () => ({ blendingController: { regenerate: vi.fn() } }))
vi.mock('../../public/js/services/albums/albumLoading.js', () => ({ albumAsks: { albumsOf: vi.fn() } }))
vi.mock('../../public/js/components/Toast.js', () => {
    const toast = { info: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn() }
    return { default: toast, toast }
})

import { PlaylistsController } from '../../public/js/controllers/PlaylistsController.js'
import { getPlaylistsService } from '../../public/js/services/PlaylistsService.js'
import { playlistsStore } from '../../public/js/stores/playlists.js'
import { albumSeriesStore } from '../../public/js/stores/albumSeries.js'
import toast from '../../public/js/components/Toast.js'

const flush = () => new Promise(resolve => setTimeout(resolve, 0))

/** Generate for a series, as the blend screen does, then lose the memory, as a reload does. */
const generateThenReload = async (seriesId) => {
    playlistsStore.setPlaylists([{ name: 'Mix 1', tracks: [{ title: 'T1' }] }], seriesId)
    playlistsStore.setDefaultBatchName('Suggested name')
    await flush() // the draft is written
    playlistsStore.reset()
}

describe('PlaylistsController.initialize after a reload (UAT-05)', () => {
    let controller

    beforeEach(() => {
        albumSeriesStore.setUserId('u1')
        getPlaylistsService({ fake: true }, null) // the app's service, watching the store
        playlistsStore.reset()
        controller = new PlaylistsController({})
        controller.loadAlbumsForSeries = vi.fn()
    })

    it('puts the unsaved playlists of the series back on screen and says so', async () => {
        await generateThenReload('sA')
        window.history.pushState({}, '', '/playlists?seriesId=sA')

        await controller.initialize({})

        expect(playlistsStore.getPlaylists().map(p => p.name)).toEqual(['Mix 1'])
        expect(playlistsStore.getState()).toMatchObject({ seriesId: 'sA', mode: 'CREATING', defaultBatchName: 'Suggested name' })
        expect(toast.info).toHaveBeenCalledWith(expect.stringContaining('restored'))
        expect(controller.loadAlbumsForSeries).toHaveBeenCalledWith('sA') // so they can be generated again
    })

    it('opens the screen empty for another series', async () => {
        await generateThenReload('sA')
        window.history.pushState({}, '', '/playlists?seriesId=sB')

        await controller.initialize({})

        expect(playlistsStore.getPlaylists()).toEqual([])
        expect(toast.info).not.toHaveBeenCalled()
    })

    it('opens the screen empty for another person', async () => {
        await generateThenReload('sA')
        albumSeriesStore.setUserId('someone-else')
        window.history.pushState({}, '', '/playlists?seriesId=sA')

        await controller.initialize({})

        expect(playlistsStore.getPlaylists()).toEqual([])
    })
})
