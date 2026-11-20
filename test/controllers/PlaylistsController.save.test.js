/**
 * F60 - saving the playlists on screen, seen from the database: the controller and the service are
 * the real ones, Firestore is an in-memory double that can be told to fail.
 *
 * - UAT-196: a failed write leaves the saved batch as it was, and the person is told;
 * - UAT-197: two clicks write once; the save goes to the series the playlists belong to; the
 *   series itself is not rewritten from memory, and a series that is gone refuses the save.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('firebase/firestore', async () => (await import('../helpers/fakeFirestore.js')).firestoreModule)
// The database and the person signed in are handed to the service where it is put together (playlistsWiring.js)
vi.mock('../../public/js/firebase-init.js', () => ({ db: { fake: true }, auth: { currentUser: { uid: 'u1' } } }))
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

import { fake } from '../helpers/fakeFirestore.js'
import { PlaylistsController } from '../../public/js/controllers/PlaylistsController.js'
import { getPlaylistsService } from '../../public/js/services/playlists/playlistsWiring.js'
import { playlistsStore } from '../../public/js/stores/playlists.js'
import { albumSeriesStore } from '../../public/js/stores/albumSeries.js'
import toast from '../../public/js/components/Toast.js'

const SERIES_PATH = 'artifacts/mjrp-albums/users/u1/curator/data/series'
const playlistsOf = (seriesId) => `${SERIES_PATH}/${seriesId}/playlists`
const saved = (seriesId) => fake.list(playlistsOf(seriesId)).sort((a, b) => a.order - b.order)

const seedSeries = (id, name) => fake.seed(`${SERIES_PATH}/${id}`, { name, albumQueries: ['A - B'] })
const seedPlaylist = (seriesId, id, data) => fake.seed(`${playlistsOf(seriesId)}/${id}`, data)

/** The batch «Rock» of series sA as it is in the database, and the same batch opened for editing. */
const openRockForEditing = () => {
    seedPlaylist('sA', 'p1', { name: 'Rock 1', batchName: 'Rock', order: 0, tracks: [{ title: 'T1' }, { title: 'T2' }] })
    seedPlaylist('sA', 'p2', { name: 'Rock 2', batchName: 'Rock', order: 1, tracks: [{ title: 'T3' }] })
    seedPlaylist('sA', 'other', { name: 'Jazz 1', batchName: 'Jazz', order: 0, tracks: [{ title: 'J1' }] })
    const service = getPlaylistsService()
    service.setEditMode('Rock', 'sA', null)
    playlistsStore.setPlaylists(saved('sA').filter(p => p.batchName === 'Rock'), 'sA')
    return service
}

describe('PlaylistsController.handleSave (F60)', () => {
    let controller

    beforeEach(() => {
        fake.reset()
        getPlaylistsService().reset()
        albumSeriesStore.setSeries([
            { id: 'sA', name: 'Series A', albumQueries: ['A - B'] },
            { id: 'sB', name: 'Series B', albumQueries: ['C - D'] }
        ])
        albumSeriesStore.setActiveSeries('sA')
        seedSeries('sA', 'Series A')
        seedSeries('sB', 'Series B')
        controller = new PlaylistsController({})
    })

    describe('UAT-196: an edited batch is replaced without a moment in which it does not exist', () => {
        it('leaves the saved batch untouched when the write fails, and tells the person', async () => {
            openRockForEditing()
            playlistsStore.getPlaylists()[0].tracks.pop() // the edit that is being saved
            const before = saved('sA')
            fake.failNext('commit', new Error('network down'))

            await controller.handleSave('Rock')

            expect(saved('sA')).toEqual(before)
            expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('network down'))
            expect(toast.success).not.toHaveBeenCalled()
        })

        it('writes the new batch and removes what is no longer in it in one atomic write', async () => {
            openRockForEditing()
            playlistsStore.setPlaylists([playlistsStore.getPlaylists()[0]], 'sA') // «Rock 2» was removed on screen

            await controller.handleSave('Rock')

            expect(saved('sA').map(p => p.id).sort()).toEqual(['other', 'p1'])
            expect(fake.writes()).toEqual(['commit'])
            expect(toast.success).toHaveBeenCalled()
        })

        it('renames a batch without leaving the old name behind', async () => {
            openRockForEditing()

            await controller.handleSave('Rock v2')

            const names = saved('sA').map(p => `${p.id}:${p.batchName}`).sort()
            expect(names).toEqual(['other:Jazz', 'p1:Rock v2', 'p2:Rock v2'])
        })

        it('replaces the batch by playlists generated again (no ids) only when the new ones are written', async () => {
            openRockForEditing()
            playlistsStore.setPlaylists([{ name: 'New 1', tracks: [{ title: 'N1' }] }], 'sA')
            const before = saved('sA')
            fake.failNext('commit')

            await controller.handleSave('Rock')
            expect(saved('sA')).toEqual(before)

            await controller.handleSave('Rock')
            const rock = saved('sA').filter(p => p.batchName === 'Rock')
            expect(rock.map(p => p.name)).toEqual(['New 1'])
            expect(saved('sA').some(p => p.id === 'other')).toBe(true)
        })
    })

    describe('UAT-197: one save, in the right series', () => {
        it('writes the batch once when save is clicked again while the first write is on its way', async () => {
            playlistsStore.setPlaylists([{ name: 'Mix 1', tracks: [] }, { name: 'Mix 2', tracks: [] }], 'sA')
            const firstWrite = fake.holdNext('commit')
            const secondWrite = fake.holdNext('commit') // only reached if the second click writes too

            const first = controller.handleSave('Mix')
            await firstWrite.reached
            const second = controller.handleSave('Mix') // the second click, with the first write in the air
            await Promise.race([second, secondWrite.reached])
            firstWrite.release()
            secondWrite.release()
            await Promise.all([first, second])

            expect(saved('sA').map(p => p.name)).toEqual(['Mix 1', 'Mix 2'])
            expect(toast.success).toHaveBeenCalledTimes(1)
        })

        it('saves into the series the playlists belong to, whatever series is active on screen', async () => {
            openRockForEditing()
            seedPlaylist('sB', 'b1', { name: 'B Rock', batchName: 'Rock', order: 0, tracks: [] })
            albumSeriesStore.setActiveSeries('sB') // the person looked at another series meanwhile
            playlistsStore.getPlaylists()[0].name = 'Rock 1 (edited)'

            await controller.handleSave('Rock')

            expect(saved('sB').map(p => p.id)).toEqual(['b1'])
            expect(saved('sA').find(p => p.id === 'p1').name).toBe('Rock 1 (edited)')
        })

        it('does not rewrite the series from what is in memory', async () => {
            fake.seed(`${SERIES_PATH}/sA`, { name: 'Renamed elsewhere', albumQueries: ['A - B', 'E - F'] })
            playlistsStore.setPlaylists([{ name: 'Mix 1', tracks: [] }], 'sA')

            await controller.handleSave('Mix')

            const series = fake.get(`${SERIES_PATH}/sA`)
            expect(series.name).toBe('Renamed elsewhere')
            expect(series.albumQueries).toEqual(['A - B', 'E - F'])
        })

        it('refuses to save into a series that no longer exists, and writes nothing', async () => {
            fake.reset() // no series in the database
            playlistsStore.setPlaylists([{ name: 'Mix 1', tracks: [] }], 'sA')

            await controller.handleSave('Mix')

            expect(saved('sA')).toEqual([])
            expect(fake.get(`${SERIES_PATH}/sA`)).toBeNull()
            expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('no longer exists'))
        })

        it('asks for a name when there is none', async () => {
            playlistsStore.setPlaylists([{ name: 'Mix 1', tracks: [] }], 'sA')

            await controller.handleSave('')

            expect(saved('sA')).toEqual([])
            expect(toast.error).toHaveBeenCalledWith('Batch name required')
        })

        it('does not keep the playlists of another batch on screen when the batch to edit is not found', async () => {
            const service = openRockForEditing() // «Rock» is on screen
            service.setEditMode('Gone', 'sA', null)

            await controller.loadPlaylistsForEdit('Gone', 'sA')
            await controller.handleSave('Gone')

            expect(playlistsStore.getPlaylists()).toEqual([])
            // «Rock» was not stored again under the name «Gone»
            expect(saved('sA').map(p => `${p.id}:${p.batchName}`).sort()).toEqual(['other:Jazz', 'p1:Rock', 'p2:Rock'])
        })
    })

    describe('removing a playlist on screen', () => {
        it('goes through the service, so the change counts as not saved', async () => {
            const service = openRockForEditing()

            await controller.deletePlaylist(1)

            expect(playlistsStore.getPlaylists().map(p => p.name)).toEqual(['Rock 1'])
            expect(service.hasUnsavedChanges()).toBe(true)
            expect(saved('sA').some(p => p.id === 'p2')).toBe(true) // the saved batch changes only on save
        })
    })
})
