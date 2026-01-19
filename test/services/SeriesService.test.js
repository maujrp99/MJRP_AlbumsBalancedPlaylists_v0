import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SeriesService } from '../../public/js/services/SeriesService.js'
import { albumSeriesStore } from '../../public/js/stores/albumSeries.js'
import { albumsStore } from '../../public/js/stores/albums.js' // Import the mocked store

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

// 1. Mock API Client
vi.mock('../../public/js/api/client.js', () => ({
    apiClient: {
        get: vi.fn().mockResolvedValue({}),
        post: vi.fn().mockResolvedValue({})
    }
}))

// 2. Mock External Services
vi.mock('../../public/js/helpers/BEAEnrichmentHelper.js', () => ({
    enrichAlbum: vi.fn().mockResolvedValue({})
}))

vi.mock('../../public/js/services/SpotifyService.js', () => ({
    SpotifyService: {
        enrichAlbumData: vi.fn().mockResolvedValue({ spotifyId: 'mock-spotify-id' })
    }
}))

// 3. Mock Albums Store
vi.mock('../../public/js/stores/albums.js', () => ({
    albumsStore: {
        updateAlbum: vi.fn().mockResolvedValue(),
        addAlbumToSeries: vi.fn(),
        getActiveAlbumSeriesId: vi.fn().mockReturnValue('ser-1'),
        clearAlbumSeries: vi.fn(),
        removeAlbumsBySeriesIdFromContext: vi.fn()
    }
}))


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

        // Mock the expensive injection method to isolate "refetch -> persist" logic
        // We use spyOn to overwrite the instance method for this test context
        vi.spyOn(service, 'injectAlbumsIntoViewCache').mockResolvedValue()
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

    describe('refetchAlbumMetadata (Sprint 23 Persistence)', () => {
        it('should call albumsStore.updateAlbum to persist changes after enrichment', async () => {
            // Setup
            const mockAlbum = {
                id: 'alb-1',
                title: 'Test Album',
                artist: 'Test Artist',
                tracks: [{ title: 'Track 1' }],
                tracksOriginalOrder: [{ title: 'Track 1' }]
            }
            const seriesId = 'ser-1'

            // Mock enrichment results (none found, to keep it simple, or mock internals)
            // But refetchAlbumMetadata constructs Promise.allSettled logic.
            // Since we mocked apiClient, the BEA/Spotify calls inside will use the mock.
            // We just want to ensure it reaches the persistence step.

            await service.refetchAlbumMetadata(mockAlbum, seriesId)

            // 2. CRITICAL: Should persist to DB
            expect(albumsStore.updateAlbum).toHaveBeenCalledWith(mockDb, expect.objectContaining({
                id: 'alb-1',
                title: 'Test Album',
                tracksOriginalOrder: expect.any(Array)
            }))
        })
    })
})
