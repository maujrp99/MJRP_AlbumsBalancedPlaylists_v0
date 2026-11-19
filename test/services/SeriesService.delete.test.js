/**
 * F60 (UAT-197) - deleting a series takes its saved playlists with it, in one write, and the
 * person is told beforehand how many there are. Seen from the database: the service, the
 * repository and the dialog component are the real ones, Firestore is the in-memory double.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('firebase/firestore', async () => (await import('../helpers/fakeFirestore.js')).firestoreModule)
vi.mock('../../public/js/api/client.js', () => ({ apiClient: {} }))
vi.mock('../../public/js/cache/CacheManager.js', () => {
    const cacheManager = { get: async () => null, set: async () => { }, invalidate: async () => { } }
    return { cacheManager, CacheManager: class { } }
})
vi.mock('../../public/js/components/GlobalProgress.js', () => ({ globalProgress: { start: vi.fn(), finish: vi.fn() } }))
vi.mock('../../public/js/components/Toast.js', () => {
    const toast = { info: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn() }
    return { default: toast, toast }
})
const dialog = vi.hoisted(() => ({ confirm: vi.fn() }))
vi.mock('../../public/js/services/DialogService.js', () => ({ dialogService: dialog }))
vi.mock('../../public/js/components/series/SeriesEditModal.js', () => ({ SeriesEditModal: { open: vi.fn() } }))

import { fake } from '../helpers/fakeFirestore.js'
import { SeriesService } from '../../public/js/services/SeriesService.js'
import SeriesModals from '../../public/js/components/series/SeriesModals.js'
import { albumSeriesStore } from '../../public/js/stores/albumSeries.js'
import { toast } from '../../public/js/components/Toast.js'

const SERIES_PATH = 'artifacts/mjrp-albums/users/u1/curator/data/series'
const playlistsOf = (seriesId) => `${SERIES_PATH}/${seriesId}/playlists`
const storage = { save: vi.fn(), load: vi.fn(() => null), remove: vi.fn() }

describe('deleting a series (F60)', () => {
    let service

    beforeEach(() => {
        fake.reset()
        fake.seed(`${SERIES_PATH}/sA`, { name: 'Series A' })
        fake.seed(`${SERIES_PATH}/sB`, { name: 'Series B' })
        fake.seed(`${playlistsOf('sA')}/p1`, { name: 'Rock 1', batchName: 'Rock' })
        fake.seed(`${playlistsOf('sA')}/p2`, { name: 'Rock 2', batchName: 'Rock' })
        fake.seed(`${playlistsOf('sA')}/p3`, { name: 'Jazz 1', batchName: 'Jazz' })
        fake.seed(`${playlistsOf('sB')}/b1`, { name: 'B 1', batchName: 'Mix' })

        service = new SeriesService({ fake: true }, 'u1', storage, { handleUserChange: vi.fn() })
        albumSeriesStore.setSeries([{ id: 'sA', name: 'Series A' }, { id: 'sB', name: 'Series B' }])
    })

    describe('SeriesService.deleteSeries', () => {
        it('removes the series and its playlists, and nothing of another series', async () => {
            await service.deleteSeries('sA')

            expect(fake.get(`${SERIES_PATH}/sA`)).toBeNull()
            expect(fake.list(playlistsOf('sA'))).toEqual([])
            expect(fake.list(playlistsOf('sB')).map(p => p.id)).toEqual(['b1'])
            expect(fake.get(`${SERIES_PATH}/sB`)).not.toBeNull()
            expect(albumSeriesStore.getSeries().map(s => s.id)).toEqual(['sB'])
        })

        it('does it in one write: a failure leaves the series and every playlist in place', async () => {
            fake.failNext('commit', new Error('network down'))

            await expect(service.deleteSeries('sA')).rejects.toThrow('network down')

            expect(fake.get(`${SERIES_PATH}/sA`)).not.toBeNull()
            expect(fake.list(playlistsOf('sA'))).toHaveLength(3)
            expect(albumSeriesStore.getSeries().map(s => s.id)).toEqual(['sA', 'sB'])
        })

        it('counts what a series has saved', async () => {
            expect(await service.countSavedPlaylists('sA')).toEqual({ playlists: 3, batches: 2 })
            expect(await service.countSavedPlaylists('sB')).toEqual({ playlists: 1, batches: 1 })
        })
    })

    describe('the delete dialog', () => {
        let modals, onSeriesDeleted

        beforeEach(() => {
            onSeriesDeleted = vi.fn()
            modals = new SeriesModals({ onSeriesDeleted })
            // the dialog reaches the service through the app's own factory
            albumSeriesStore.setDb({ fake: true })
            albumSeriesStore.setUserId('u1')
        })

        it('says how many saved playlists go with the series before the person confirms', async () => {
            dialog.confirm.mockResolvedValue(false)

            await modals.openDelete('sA')

            const { message } = dialog.confirm.mock.calls[0][0]
            expect(message).toContain('3 saved playlists')
            expect(message).toContain('2 batches')
            expect(fake.list(playlistsOf('sA'))).toHaveLength(3) // said no: nothing deleted
        })

        it('does not mention playlists for a series that has none', async () => {
            fake.reset()
            fake.seed(`${SERIES_PATH}/sA`, { name: 'Series A' })
            dialog.confirm.mockResolvedValue(false)

            await modals.openDelete('sA')

            expect(dialog.confirm.mock.calls[0][0].message).not.toMatch(/playlist/i)
        })

        it('deletes the series and its playlists on a yes', async () => {
            dialog.confirm.mockResolvedValue(true)

            await modals.openDelete('sA')

            expect(fake.get(`${SERIES_PATH}/sA`)).toBeNull()
            expect(fake.list(playlistsOf('sA'))).toEqual([])
            expect(onSeriesDeleted).toHaveBeenCalledWith('sA')
        })

        it('deletes nothing, and says so, when the saved playlists cannot be counted', async () => {
            fake.failNext('read', new Error('offline'))
            dialog.confirm.mockResolvedValue(true)

            await modals.openDelete('sA')

            expect(dialog.confirm).not.toHaveBeenCalled()
            expect(fake.get(`${SERIES_PATH}/sA`)).not.toBeNull()
            expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Nothing was deleted'))
        })
    })
})
