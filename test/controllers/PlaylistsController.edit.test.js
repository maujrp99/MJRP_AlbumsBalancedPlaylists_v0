/**
 * F62 - the edits of the playlists screen seen from the database: the controller and the service
 * are the real ones, Firestore is the in-memory double.
 *
 * - UAT-04: the title typed for a playlist is saved with the batch, comes back when the batch is
 *   opened for editing, and is the title the screen draws and the exports read;
 * - UAT-03: a playlist deleted from the set is not saved; in a saved batch it is gone on the save;
 * - UAT-02: undo and redo go through the controller and tell the person what happened;
 * - UAT-200: the recipe of the playlists is saved with them.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('firebase/firestore', async () => (await import('../helpers/fakeFirestore.js')).firestoreModule)
vi.mock('../../public/js/firebase-init.js', () => ({ db: { fake: true }, auth: { currentUser: { uid: 'u1' } } }))
vi.mock('../../public/js/cache/CacheManager.js', () => {
    const cacheManager = { get: async () => null, set: async () => { }, invalidate: async () => { } }
    return { cacheManager, CacheManager: class { } }
})
vi.mock('../../public/js/services/SeriesService.js', () => ({ getSeriesService: vi.fn() }))
vi.mock('../../public/js/controllers/BlendingController.js', () => ({ blendingController: { regenerate: vi.fn() } }))
vi.mock('../../public/js/services/albums/albumLoading.js', () => ({
    albumAsks: { albumsOf: vi.fn(async () => ({ albums: [{ id: 'a1' }], bySeries: {}, failed: [], missingSources: [], total: 1, aborted: false })) }
}))
vi.mock('../../public/js/components/Toast.js', () => {
    const toast = { info: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn() }
    return { default: toast, toast }
})

import { fake } from '../helpers/fakeFirestore.js'
import { PlaylistsController } from '../../public/js/controllers/PlaylistsController.js'
import { getPlaylistsService } from '../../public/js/services/playlists/playlistsWiring.js'
import { PlaylistGrid } from '../../public/js/components/playlists/PlaylistGrid.js'
import { PlaylistsGridRenderer } from '../../public/js/components/playlists/PlaylistsGridRenderer.js'
import { playlistGenerationService } from '../../public/js/services/PlaylistGenerationService.js'
import { playlistsStore } from '../../public/js/stores/playlists.js'
import { albumSeriesStore } from '../../public/js/stores/albumSeries.js'
import toast from '../../public/js/components/Toast.js'

const SERIES_PATH = 'artifacts/mjrp-albums/users/u1/curator/data/series'
const saved = () => fake.list(`${SERIES_PATH}/sA/playlists`).sort((a, b) => a.order - b.order)
const onScreen = () => playlistsStore.getPlaylists()
const drawnTitles = () => {
    const host = document.createElement('div')
    host.innerHTML = PlaylistGrid.render({ playlists: onScreen(), batchName: 'Mix' })
    return [...host.querySelectorAll('.playlist-name')].map(el => el.textContent)
}

/** A new page: nothing in memory, the batch opened for editing from the database. */
const reopenForEditing = async (controller, batchName) => {
    const service = getPlaylistsService()
    service.reset()
    service.setEditMode(batchName, 'sA', null)
    await controller.loadPlaylistsForEdit(batchName, 'sA')
}

describe('PlaylistsController: the edits of the set on screen (F62)', () => {
    let controller

    beforeEach(() => {
        vi.clearAllMocks()
        fake.reset()
        getPlaylistsService().reset()
        albumSeriesStore.setSeries([{ id: 'sA', name: 'Series A', albumQueries: ['A - B'] }])
        albumSeriesStore.setActiveSeries('sA')
        fake.seed(`${SERIES_PATH}/sA`, { name: 'Series A', albumQueries: ['A - B'] })
        controller = new PlaylistsController({})
        // what the blend does: the generated set goes straight into the store
        playlistsStore.setPlaylists([
            { name: 'Greatest Hits', title: 'Greatest Hits', tracks: [{ title: 'A' }, { title: 'B' }] },
            { name: 'Deep Cuts Vol. 1', title: 'Deep Cuts Vol. 1', tracks: [{ title: 'C' }] }
        ], 'sA')
    })

    describe('UAT-04: the title of a playlist', () => {
        it('stays through the next redraw of the screen', async () => {
            await controller.renamePlaylist(0, 'Road trip')
            await controller.deleteTrack(0, 0) // anything that draws the screen again

            expect(drawnTitles()).toEqual(['Road trip', 'Deep Cuts Vol. 1'])
        })

        it('is saved with the batch', async () => {
            await controller.renamePlaylist(0, 'Road trip')
            await controller.handleSave('Mix')

            expect(saved().map(p => [p.name, p.title])).toEqual([['Road trip', 'Road trip'], ['Deep Cuts Vol. 1', 'Deep Cuts Vol. 1']])
        })

        it('comes back when the saved batch is opened for editing on a new page', async () => {
            await controller.renamePlaylist(0, 'Road trip')
            await controller.handleSave('Mix')

            await reopenForEditing(controller, 'Mix')

            expect(onScreen().map(p => p.name)).toEqual(['Road trip', 'Deep Cuts Vol. 1'])
            expect(drawnTitles()).toEqual(['Road trip', 'Deep Cuts Vol. 1'])
        })

        it('changed again in edit mode replaces the saved title, in the same playlist', async () => {
            await controller.renamePlaylist(0, 'Road trip')
            await controller.handleSave('Mix')
            const idBefore = saved()[0].id
            await reopenForEditing(controller, 'Mix')

            await controller.renamePlaylist(0, 'Night drive')
            await controller.handleSave('Mix')

            expect(saved().map(p => p.name)).toEqual(['Night drive', 'Deep Cuts Vol. 1'])
            expect(saved()[0].id).toBe(idBefore)
        })

        it('is the name the exports read', async () => {
            await controller.renamePlaylist(0, 'Road trip')

            const service = getPlaylistsService()
            expect(service.prepareForExport(onScreen()[0]).name).toBe('Road trip')
            expect(onScreen()[0].title).toBe('Road trip')
        })
    })

    describe('UAT-03: deleting a playlist of the set', () => {
        it('leaves it out of what is saved', async () => {
            await controller.deletePlaylist(1)
            await controller.handleSave('Mix')

            expect(saved().map(p => p.name)).toEqual(['Greatest Hits'])
            expect(toast.success).toHaveBeenCalledWith('Playlist "Deep Cuts Vol. 1" removed')
        })

        it('removes it from a saved batch on the next save, and can be undone before that', async () => {
            await controller.handleSave('Mix')
            await reopenForEditing(controller, 'Mix')

            await controller.deletePlaylist(0)
            expect(saved()).toHaveLength(2) // nothing is written before the save
            await controller.undo()
            expect(onScreen().map(p => p.name)).toEqual(['Greatest Hits', 'Deep Cuts Vol. 1'])

            await controller.deletePlaylist(0)
            await controller.handleSave('Mix')
            expect(saved().map(p => p.name)).toEqual(['Deep Cuts Vol. 1'])
        })
    })

    describe('UAT-02: undo and redo', () => {
        it('take one step each, and the state of the buttons is the one of the store', async () => {
            await controller.deleteTrack(0, 0)
            expect(playlistsStore.getState()).toMatchObject({ canUndo: true, canRedo: false })

            await controller.undo()
            expect(onScreen()[0].tracks.map(t => t.title)).toEqual(['A', 'B'])
            expect(playlistsStore.getState()).toMatchObject({ canUndo: false, canRedo: true })

            await controller.redo()
            expect(onScreen()[0].tracks.map(t => t.title)).toEqual(['B'])
            expect(playlistsStore.getState()).toMatchObject({ canUndo: true, canRedo: false })
        })

        it('say so when there is nothing to undo or to redo', async () => {
            await controller.undo()
            await controller.redo()

            expect(toast.info).toHaveBeenCalledWith('Nothing to undo')
            expect(toast.info).toHaveBeenCalledWith('Nothing to redo')
        })
    })

    describe('UAT-200: the recipe of the playlists', () => {
        it('is saved with them and read back for the «reconfigure» panel', async () => {
            const album = { id: 'a1', title: 'Album', artist: 'Artist', tracks: [{ id: 't1', title: 'T1', duration: 200, rating: 80 }] }
            const config = { algorithmId: 'top-n-acclaimed', trackCount: 4, outputMode: 'single', groupingStrategy: 'artist_rank', targetDuration: 2700 }
            playlistsStore.setPlaylists(playlistGenerationService.generate([album], config).playlists, 'sA')

            await controller.handleSave('Mix')
            await reopenForEditing(controller, 'Mix')

            expect(PlaylistsGridRenderer.generatedWith(onScreen())).toEqual({ ...config, rankingId: 'bea' })
        })
    })
})
