import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SeriesService } from '../../public/js/services/SeriesService.js'
import { albumSeriesStore } from '../../public/js/stores/albumSeries.js'

// Mock dependencies
const mockDb = {}
const mockCache = {}

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
})
