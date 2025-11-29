import { describe, it, expect, beforeEach, vi } from 'vitest'
import { InventoryStore } from '../../public/js/stores/inventory.js'

// Mock dependencies
vi.mock('../../public/js/repositories/InventoryRepository.js', () => {
    return {
        InventoryRepository: vi.fn().mockImplementation(() => ({
            findAll: vi.fn().mockResolvedValue([]),
            addAlbum: vi.fn().mockResolvedValue('new-id'),
            updateAlbum: vi.fn().mockResolvedValue(),
            updatePrice: vi.fn().mockResolvedValue(),
            removeAlbum: vi.fn().mockResolvedValue(),
            findByAlbumId: vi.fn().mockResolvedValue(null)
        }))
    }
})

vi.mock('../../public/js/firebase-config.js', () => ({
    firestore: {}
}))

vi.mock('../../public/js/cache/CacheManager.js', () => ({
    cacheManager: {}
}))

describe('InventoryStore', () => {
    let store

    beforeEach(() => {
        vi.clearAllMocks()
        store = new InventoryStore()
    })

    describe('constructor', () => {
        it('should initialize with empty state', () => {
            expect(store.getAlbums()).toEqual([])
            expect(store.getState().loading).toBe(false)
            expect(store.getState().error).toBeNull()
        })
    })

    describe('loadAlbums', () => {
        it('should load albums from repository', async () => {
            const mockAlbums = [{ id: '1', title: 'Test Album' }]

            // Access the mock instance
            store.init() // Initialize repo
            store.repository.findAll.mockResolvedValue(mockAlbums)

            await store.loadAlbums()

            expect(store.getAlbums()).toEqual(mockAlbums)
            expect(store.getState().loading).toBe(false)
            expect(store.getState().error).toBeNull()
        })

        it('should handle load errors', async () => {
            store.init()
            store.repository.findAll.mockRejectedValue(new Error('Load failed'))

            await expect(store.loadAlbums()).rejects.toThrow('Load failed')

            expect(store.getState().error).toBe('Load failed')
            expect(store.getState().loading).toBe(false)
        })
    })

    describe('addAlbum', () => {
        it('should add album and reload', async () => {
            store.init()
            store.repository.addAlbum.mockResolvedValue('new-id')
            store.repository.findAll.mockResolvedValue([{ id: 'new-id' }])

            const id = await store.addAlbum({ title: 'New Album' }, 'cd')

            expect(id).toBe('new-id')
            expect(store.repository.addAlbum).toHaveBeenCalledWith({ title: 'New Album' }, 'cd', {})
            expect(store.repository.findAll).toHaveBeenCalled()
        })
    })

    describe('updatePrice', () => {
        it('should optimistically update price', async () => {
            // Setup initial state
            store.albums = [{ id: '1', purchasePrice: 10, currency: 'USD' }]
            store.init()

            const promise = store.updatePrice('1', 20, 'USD')

            // Check optimistic update immediately
            expect(store.getAlbums()[0].purchasePrice).toBe(20)

            await promise

            expect(store.repository.updatePrice).toHaveBeenCalledWith('1', 20, 'USD')
        })

        it('should rollback on error', async () => {
            store.albums = [{ id: '1', purchasePrice: 10, currency: 'USD' }]
            store.init()
            store.repository.updatePrice.mockRejectedValue(new Error('Update failed'))

            await expect(store.updatePrice('1', 20, 'USD')).rejects.toThrow('Update failed')

            // Should be back to 10
            expect(store.getAlbums()[0].purchasePrice).toBe(10)
        })
    })

    describe('getStatistics', () => {
        it('should calculate statistics correctly', () => {
            store.albums = [
                { format: 'cd', purchasePrice: 10, currency: 'USD' },
                { format: 'vinyl', purchasePrice: 20, currency: 'USD' },
                { format: 'cd', purchasePrice: 50, currency: 'BRL' }
            ]

            const stats = store.getStatistics()

            expect(stats.totalAlbums).toBe(3)
            expect(stats.byFormat.cd).toBe(2)
            expect(stats.byFormat.vinyl).toBe(1)
            expect(stats.totalValueUSD).toBe(30)
            expect(stats.totalValueBRL).toBe(50)
            expect(stats.averagePriceUSD).toBe(15)
            expect(stats.averagePriceBRL).toBe(50)
        })
    })
})
