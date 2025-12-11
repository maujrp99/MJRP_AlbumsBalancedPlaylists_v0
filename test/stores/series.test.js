import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AlbumSeriesStore } from '../../public/js/stores/albumSeries.js'

// Mock dependencies
vi.mock('../../public/js/repositories/SeriesRepository.js', () => ({
    SeriesRepository: vi.fn().mockImplementation((db, cache, userId) => ({
        userId,
        create: vi.fn().mockResolvedValue('new-series-id'),
        findAll: vi.fn().mockResolvedValue(userId === 'user-123' ? [{
            id: '1',
            name: 'User Series',
            createdAt: { toDate: () => new Date('2024-01-01') },
            updatedAt: { toDate: () => new Date('2024-01-01') }
        }] : []),
        update: vi.fn().mockResolvedValue(),
        delete: vi.fn().mockResolvedValue()
    }))
}))

vi.mock('../../public/js/cache/CacheManager.js', () => ({
    cacheManager: {}
}))

vi.mock('../../public/js/app.js', () => ({
    db: {}
}))

vi.mock('../../public/js/stores/UserStore.js', () => ({
    userStore: {
        subscribe: vi.fn(),
        getState: vi.fn().mockReturnValue({ currentUser: null })
    }
}))

// Mock DataSyncService
vi.mock('../../public/js/services/DataSyncService.js', () => ({
    dataSyncService: {
        migrateSeries: vi.fn().mockResolvedValue(0)
    }
}))
import { dataSyncService } from '../../public/js/services/DataSyncService.js'

import { userStore } from '../../public/js/stores/UserStore.js'

describe('SeriesStore', () => {
    let store
    const mockDb = {}

    beforeEach(() => {
        vi.clearAllMocks()
        // Reset localStorage
        global.localStorage = {
            getItem: vi.fn(),
            setItem: vi.fn(),
            removeItem: vi.fn()
        }
        store = new AlbumSeriesStore()
        store.init(mockDb) // Initialize repository for tests
    })

    describe('constructor', () => {
        it('should initialize and subscribe to userStore', () => {
            expect(userStore.subscribe).toHaveBeenCalled()
            expect(store.getSeries()).toEqual([])
        })
    })

    describe('onUserChange', () => {
        it('should update userId and reload repository when user logs in', async () => {
            const mockUser = { uid: 'user-123' }
            const mockSeries = [{
                id: '1',
                name: 'User Series',
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01')
            }]

            store.init(mockDb) // Ensure basic init

            // Create a guest series first so there is something to migrate
            await store.createSeries({ name: 'Guest Series' })

            store.repository.findAll.mockResolvedValue(mockSeries)

            // Trigger auth change
            await store.handleUserChange({ currentUser: mockUser })

            expect(store.userId).toBe('user-123')
            expect(store.repository.userId).toBe('user-123')
            expect(dataSyncService.migrateSeries).toHaveBeenCalled()
            expect(store.getSeries()).toEqual(mockSeries)
        })

        it('should revert to anonymous when user logs out', async () => {
            store.userId = 'user-123'
            store.init(mockDb, 'user-123')

            await store.handleUserChange({ currentUser: null })

            expect(store.userId).toBe('anonymous-user')
        })
    })

    describe('createSeries', () => {
        it('should create new series with provided data', async () => {
            const seriesData = {
                name: 'Classic Rock Collection',
                albumQueries: ['Pink Floyd - The Wall', 'Led Zeppelin - IV'],
                notes: 'Test notes'
            }

            const series = await store.createSeries(seriesData)

            expect(series.name).toBe('Classic Rock Collection')
            expect(series.albumQueries).toEqual(seriesData.albumQueries)
            expect(series.notes).toBe('Test notes')
            expect(series.status).toBe('pending')
            expect(series.id).toBeDefined()
        })

        it('should set created series as active', async () => {
            const series = await store.createSeries({ name: 'Test Series' })

            expect(store.getActiveSeries()).toEqual(series)
        })

        it('should add series to beginning of list', async () => {
            await store.createSeries({ name: 'Series 1' })
            await store.createSeries({ name: 'Series 2' })

            expect(store.getSeries()[0].name).toBe('Series 2')
            expect(store.getSeries()[1].name).toBe('Series 1')
        })

        it('should handle series without optional fields', async () => {
            const series = await store.createSeries({ name: 'Minimal Series' })

            expect(series.albumQueries).toEqual([])
            expect(series.notes).toBe('')
        })

        it('should notify listeners when series created', async () => {
            const listener = vi.fn()
            store.subscribe(listener)

            await store.createSeries({ name: 'Test' })

            expect(listener).toHaveBeenCalled()
        })
    })

    describe('setActiveSeries', () => {
        it('should set active series by ID', async () => {
            const series1 = await store.createSeries({ name: 'Series 1' })
            const series1Id = series1.id
            await store.createSeries({ name: 'Series 2' }) // This becomes active automatically

            // Now set series1 as active by its ID
            store.setActiveSeries(series1Id)

            expect(store.getActiveSeries().id).toBe(series1Id)
        })
        it('should set active series to null if ID not found', async () => {
            await store.createSeries({ name: 'Series 1' })

            store.setActiveSeries('non-existent-id')

            expect(store.getActiveSeries()).toBeNull()
        })

        it('should notify listeners when active series changes', async () => {
            const series = await store.createSeries({ name: 'Test' })
            const listener = vi.fn()
            store.subscribe(listener)

            store.setActiveSeries(series.id)

            expect(listener).toHaveBeenCalled()
        })
    })

    describe('getSeries', () => {
        it('should return all series', async () => {
            await store.createSeries({ name: 'Series 1' })
            await store.createSeries({ name: 'Series 2' })

            expect(store.getSeries()).toHaveLength(2)
        })
    })

    describe('getActiveSeries', () => {
        it('should return active series', async () => {
            const series = await store.createSeries({ name: 'Test' })

            expect(store.getActiveSeries()).toEqual(series)
        })

        it('should return null if no active series', () => {
            expect(store.getActiveSeries()).toBeNull()
        })
    })

    describe('subscribe', () => {
        it('should add listener', async () => {
            const listener = vi.fn()

            store.subscribe(listener)
            await store.createSeries({ name: 'Test' })

            expect(listener).toHaveBeenCalled()
        })

        it('should return unsubscribe function', async () => {
            const listener = vi.fn()

            const unsubscribe = store.subscribe(listener)
            unsubscribe()
            await store.createSeries({ name: 'Test' })

            expect(listener).not.toHaveBeenCalled()
        })
    })

    describe('getState', () => {
        it('should return complete state snapshot', async () => {
            const series = await store.createSeries({ name: 'Test' })

            const state = store.getState()

            expect(state).toEqual({
                series: [series],
                activeSeries: series,
                loading: false,
                error: null
            })
        })
    })

    describe('reset', () => {
        it('should reset store to initial state', async () => {
            await store.createSeries({ name: 'Test' })

            store.reset()

            expect(store.getSeries()).toEqual([])
            expect(store.getActiveSeries()).toBeNull()
            expect(store.getState().loading).toBe(false)
            expect(store.getState().error).toBeNull()
        })

        it('should notify listeners on reset', () => {
            const listener = vi.fn()
            store.subscribe(listener)

            store.reset()

            expect(listener).toHaveBeenCalled()
        })
    })
})
