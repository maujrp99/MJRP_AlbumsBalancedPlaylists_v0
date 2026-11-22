/**
 * The orange loading line at the top of the page is gone (MJRP, 2026-11-22: «agora que vi no menu aquela barra
 * laranja que aparece no topo, nao deveria aparecer mesmo»; «a barra laranja aparece apenas qdo clico em album e
 * blend»; asked whether it was the thin loading line, he answered «1. Creio que sim»). Reading, creating, editing
 * and deleting the series no longer draw it. The real service, repository and store; Firestore is the in-memory double.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

vi.mock('firebase/firestore', async () => (await import('../helpers/fakeFirestore.js')).firestoreModule)
vi.mock('../../public/js/api/client.js', () => ({ apiClient: {} }))
vi.mock('../../public/js/cache/CacheManager.js', () => {
    const cacheManager = { get: async () => null, set: async () => { }, invalidate: async () => { } }
    return { cacheManager, CacheManager: class { } }
})

import { fake } from '../helpers/fakeFirestore.js'
import { SeriesService } from '../../public/js/services/SeriesService.js'
import { albumSeriesStore } from '../../public/js/stores/albumSeries.js'
import { globalProgress } from '../../public/js/stores/progress.js'

const SERIES_PATH = 'artifacts/mjrp-albums/users/u1/curator/data/series'
const storage = { save: vi.fn(), load: vi.fn(() => null), remove: vi.fn() }
const loadingLine = () => document.getElementById('globalProgress')
const barShows = () => globalProgress.getState().visible || globalProgress.isActive()

describe('the series service draws no loading line at the top of the page', () => {
    let service

    beforeEach(() => {
        fake.reset()
        fake.seed(`${SERIES_PATH}/sA`, { name: 'Series A' })
        service = new SeriesService({ fake: true }, 'u1', storage, { handleUserChange: vi.fn() })
        albumSeriesStore.setSeries([{ id: 'sA', name: 'Series A' }])
    })

    it('reading the series: no line while it reads (the store says it is loading), none after', async () => {
        const reading = service.loadFromFirestore()
        expect(albumSeriesStore.getState().loading).toBe(true)
        expect(loadingLine()).toBeNull()
        expect(barShows()).toBe(false)
        await reading
        expect(albumSeriesStore.getState().loading).toBe(false)
        expect(loadingLine()).toBeNull()
    })

    it('creating, editing and deleting a series: no line', async () => {
        const created = await service.createSeries({ name: 'New', albumQueries: [] })
        expect(loadingLine()).toBeNull()
        await service.updateSeries(created.id, { name: 'Renamed' })
        expect(loadingLine()).toBeNull()
        await service.deleteSeries(created.id)
        expect(loadingLine()).toBeNull()
        expect(barShows()).toBe(false)
    })

    it('the bar of the site (stores/progress.js) is not started by any of the four, and the service no longer imports it', async () => {
        const start = vi.spyOn(globalProgress, 'start')
        await service.loadFromFirestore()
        const created = await service.createSeries({ name: 'New', albumQueries: [] })
        await service.updateSeries(created.id, { name: 'Renamed' })
        await service.deleteSeries(created.id)
        expect(start).not.toHaveBeenCalled()
        start.mockRestore()
        expect(fs.readFileSync(path.resolve('public/js/services/SeriesService.js'), 'utf8')).not.toMatch(/stores\/progress|globalProgress/)
    })

    it('the hand-made component that drew it is no longer in the app (the bar is stores/progress.js and shell/GlobalProgress.tsx, started by the router for a slow screen file)', () => {
        expect(fs.existsSync(path.resolve('public/js/components/GlobalProgress.js'))).toBe(false)
    })
})
