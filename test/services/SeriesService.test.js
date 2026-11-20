import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SeriesService } from '../../public/js/services/SeriesService.js'
import { albumSeriesStore } from '../../public/js/stores/albumSeries.js'

// Mock dependencies
const mockDb = {}

const mockStorage = {
    save: vi.fn(),
    load: vi.fn().mockReturnValue(null),
    remove: vi.fn()
}

const mockUserSync = {
    handleUserChange: vi.fn(),
    migrateSeries: vi.fn()
}

// Mock Repository
vi.mock('../../public/js/repositories/SeriesRepository.js', () => ({
    SeriesRepository: vi.fn().mockImplementation(() => ({
        create: vi.fn().mockResolvedValue('new-id'),
        update: vi.fn().mockResolvedValue(),
        delete: vi.fn().mockResolvedValue(),
        findAll: vi.fn().mockResolvedValue([])
    }))
}))

describe('SeriesService (Refactored)', () => {
    let service

    beforeEach(() => {
        vi.clearAllMocks()
        albumSeriesStore.reset()
        service = new SeriesService(mockDb, 'user-1', mockStorage, mockUserSync)
    })

    describe('createSeries', () => {
        it('should create series and update store + storage', async () => {
            const data = { name: 'New Series' }
            await service.createSeries(data)

            expect(albumSeriesStore.getSeries()).toHaveLength(1)
            expect(albumSeriesStore.getSeries()[0].name).toBe('New Series')
            expect(mockStorage.save).toHaveBeenCalled()
        })
    })

    describe('loadFromFirestore (F47, UAT-24: the list was cut at 20 series)', () => {
        const stored = (n, extra = {}) => ({ id: `s${n}`, name: `Series ${n}`, albumQueries: [], updatedAt: new Date(2026, 0, n), ...extra })

        it('brings every series of the account, not only the 20 most recent', async () => {
            const all = Array.from({ length: 45 }, (_, i) => stored(i + 1))
            service.repository.findAll = vi.fn().mockResolvedValue(all)

            const loaded = await service.loadFromFirestore()

            expect(loaded).toHaveLength(45)
            expect(albumSeriesStore.getSeries()).toHaveLength(45)
        })

        it('asks the database with no limit and no ordering, so a series without an update date is not left out', async () => {
            service.repository.findAll = vi.fn().mockResolvedValue([])

            await service.loadFromFirestore()

            const filters = service.repository.findAll.mock.calls[0][0] || {}
            expect(filters.limit).toBeUndefined()
            expect(filters.orderBy).toBeUndefined()
        })

        it('keeps the most recently updated first, and a series with no update date last', async () => {
            service.repository.findAll = vi.fn().mockResolvedValue([
                stored(1), stored(3), { id: 'undated', name: 'No date', albumQueries: [] }, stored(2)
            ])

            const loaded = await service.loadFromFirestore()

            expect(loaded.map(s => s.id)).toEqual(['s3', 's2', 's1', 'undated'])
        })
    })

    describe('handleUserChange', () => {
        it('should delegate to UserSyncService', async () => {
            const newUser = { uid: 'user-2' }
            await service.handleUserChange({ currentUser: newUser })

            expect(mockUserSync.handleUserChange).toHaveBeenCalled()
        })
    })

    describe('LocalStorage Delegation', () => {
        it('should save to storage', () => {
            service.saveToLocalStorage()
            expect(mockStorage.save).toHaveBeenCalled()
        })
    })

    describe('the albums themselves are not loaded here (F56)', () => {
        it('has no way of its own to load, enrich or put an album on screen', () => {
            expect(service.injectAlbumsIntoViewCache).toBeUndefined()
            expect(service.refetchAlbumMetadata).toBeUndefined()
        })
    })
})
