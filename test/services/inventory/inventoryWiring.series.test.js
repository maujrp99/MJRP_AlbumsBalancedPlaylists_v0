/**
 * F71 (S-54) - where "add the albums of my series" gets the series: read from the cloud at that
 * moment, for the person whose inventory it is, and for nobody else.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const seriesService = vi.hoisted(() => ({ loadFromFirestore: vi.fn() }))
const getSeriesService = vi.hoisted(() => vi.fn(() => seriesService))

vi.mock('../../../public/js/firebase-init.js', () => ({ db: { name: 'db' } }))
vi.mock('../../../shared/data/InventoryRepository.js', () => ({ InventoryRepository: class { findAll() { return [] } } }))
vi.mock('../../../public/js/cache/CacheManager.js', () => ({ cacheManager: {} }))
vi.mock('../../../public/js/services/SeriesService.js', () => ({ getSeriesService }))
vi.mock('../../../public/js/services/albums/albumLoading.js', () => ({ albumAsks: { albumsOf: vi.fn() } }))

import { inventoryService, readSeriesOfThePerson } from '../../../public/js/services/inventory/inventoryWiring.js'
import { albumSeriesStore } from '../../../public/js/stores/albumSeries.js'

describe('the series of the person whose inventory this is', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.spyOn(console, 'log').mockImplementation(() => { })
    })

    it('are read from the cloud now, for that person', async () => {
        const stored = [{ id: 's1', name: 'Grunge', albumQueries: ['Pearl Jam - Ten'] }]
        seriesService.loadFromFirestore.mockResolvedValue(stored)
        inventoryService.userId = 'owner-1'
        albumSeriesStore.setUserId('owner-1')

        expect(await readSeriesOfThePerson()).toBe(stored)
        expect(getSeriesService).toHaveBeenCalledWith({ name: 'db' }, null, 'owner-1')
    })

    it('are not read when the series and the inventory name two people: nothing of one goes to the other', async () => {
        inventoryService.userId = 'owner-1'
        albumSeriesStore.setUserId('someone-else')

        await expect(readSeriesOfThePerson()).rejects.toThrow('not of the same person')
        expect(getSeriesService).not.toHaveBeenCalled()
    })

    it('a read that fails is thrown to whoever asked', async () => {
        seriesService.loadFromFirestore.mockRejectedValue(new Error('offline'))
        inventoryService.userId = 'owner-1'
        albumSeriesStore.setUserId('owner-1')

        await expect(readSeriesOfThePerson()).rejects.toThrow('offline')
    })
})
