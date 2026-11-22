/**
 * F77, REQ-02: creating, editing and deleting a series are measured where they work: in the
 * series service, after the write. A write that fails is not measured. The name of the series
 * never leaves (REQ-03).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('firebase/firestore', async () => (await import('../../helpers/fakeFirestore.js')).firestoreModule)
vi.mock('../../../public/js/api/client.js', () => ({ apiClient: {} }))
vi.mock('../../../public/js/cache/CacheManager.js', () => {
    const cacheManager = { get: async () => null, set: async () => { }, invalidate: async () => { } }
    return { cacheManager, CacheManager: class { } }
})

import { fake } from '../../helpers/fakeFirestore.js'
import { recordUsage, stopRecording } from '../../helpers/usageRecorder.js'
import { SeriesService } from '../../../public/js/services/SeriesService.js'
import { albumSeriesStore } from '../../../public/js/stores/albumSeries.js'

const SERIES_PATH = 'artifacts/mjrp-albums/users/u1/curator/data/series'
const storage = { save: vi.fn(), load: vi.fn(() => null), remove: vi.fn() }
const queries = [{ title: 'OK Computer', artist: 'Radiohead' }, { title: 'Kid A', artist: 'Radiohead' }]

describe('the series events (F77)', () => {
    let service
    let sent

    beforeEach(async () => {
        fake.reset()
        fake.seed(`${SERIES_PATH}/sA`, { name: 'Series A', albumQueries: queries })
        service = new SeriesService({ fake: true }, 'u1', storage, { handleUserChange: vi.fn() })
        albumSeriesStore.setSeries([{ id: 'sA', name: 'Series A', albumQueries: [...queries] }])
        sent = await recordUsage()
    })

    afterEach(() => stopRecording())

    it('series_created, with how many albums, never the name', async () => {
        await service.createSeries({ name: 'My secret 90s', albumQueries: queries })
        expect(sent).toEqual([['series_created', { album_count: 2 }]])
    })

    it('series_edited, with how many albums it has now', async () => {
        await service.addAlbumToSeries('sA', { title: 'Amnesiac', artist: 'Radiohead' })
        await service.updateSeries('sA', { name: 'Renamed' })
        expect(sent).toEqual([['series_edited', { album_count: 3 }], ['series_edited', {}]])
    })

    it('series_deleted', async () => {
        await service.deleteSeries('sA')
        expect(sent).toEqual([['series_deleted', {}]])
    })

    it('a write that fails is not measured', async () => {
        service.repository.update = vi.fn(async () => { throw new Error('offline') })
        await expect(service.updateSeries('sA', { name: 'x' })).rejects.toThrow('offline')
        expect(sent).toEqual([])
    })
})
