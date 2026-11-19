/**
 * F58 (UAT-18) - reading and writing the inventory is the work of a service; the store only
 * holds the state the service gives it. These cases were the store's own before the split.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { InventoryService } from '../../../public/js/services/inventory/InventoryService.js'
import { InventoryStore } from '../../../public/js/stores/inventory.js'

describe('InventoryService', () => {
    let store, service, createRepository, quiet

    beforeEach(() => {
        createRepository = vi.fn((userId) => ({
            userId,
            findAll: vi.fn().mockResolvedValue(userId === 'user-123' ? [{ id: '1', title: 'User Album', artist: 'User Artist' }] : []),
            addAlbum: vi.fn().mockResolvedValue('new-id'),
            updateAlbum: vi.fn().mockResolvedValue(),
            updatePrice: vi.fn().mockResolvedValue(),
            removeAlbum: vi.fn().mockResolvedValue(),
            findByAlbumId: vi.fn().mockResolvedValue(null)
        }))
        store = new InventoryStore()
        service = new InventoryService({ store, createRepository })
        quiet = [vi.spyOn(console, 'log').mockImplementation(() => { }), vi.spyOn(console, 'error').mockImplementation(() => { })]
    })
    afterEach(() => quiet.forEach(spy => spy.mockRestore()))

    it('starts as the anonymous user, with no repository until it is needed', () => {
        expect(service.userId).toBe('anonymous-user')
        expect(createRepository).not.toHaveBeenCalled()

        service.init()
        service.init()

        expect(createRepository).toHaveBeenCalledTimes(1)
        expect(createRepository).toHaveBeenCalledWith('anonymous-user')
    })

    describe('the person changes', () => {
        it('reads the inventory of whoever signs in, and keeps nothing of whoever was here', async () => {
            service.init()
            store.setAlbums([{ id: 'guest-1', title: 'Guest Album', artist: 'Guest Artist' }])

            await service.handleUserChange({ currentUser: { uid: 'user-123' } })

            expect(service.userId).toBe('user-123')
            expect(service.repository.userId).toBe('user-123')
            expect(store.getAlbums()).toEqual([{ id: '1', title: 'User Album', artist: 'User Artist' }])
        })

        it('goes back to the anonymous user at sign-out, and reads nothing', async () => {
            await service.handleUserChange({ currentUser: { uid: 'user-123' } })

            await service.handleUserChange({ currentUser: null })

            expect(service.userId).toBe('anonymous-user')
            expect(service.repository.userId).toBe('anonymous-user')
            expect(service.repository.findAll).not.toHaveBeenCalled()
        })

        it('the same person again changes nothing', async () => {
            await service.handleUserChange({ currentUser: { uid: 'user-123' } })
            const repository = service.repository

            await service.handleUserChange({ currentUser: { uid: 'user-123' } })

            expect(service.repository).toBe(repository)
            expect(repository.findAll).toHaveBeenCalledTimes(1)
        })
    })

    describe('loadAlbums', () => {
        it('puts the albums of the repository in the store', async () => {
            const albums = [{ id: '1', title: 'Test Album' }]
            service.init()
            service.repository.findAll.mockResolvedValue(albums)
            const seen = []
            store.subscribe(state => seen.push({ loading: state.loading, count: state.albums.length }))

            await expect(service.loadAlbums()).resolves.toEqual(albums)

            expect(store.getAlbums()).toEqual(albums)
            expect(store.getState()).toMatchObject({ loading: false, error: null })
            expect(seen).toEqual([{ loading: true, count: 0 }, { loading: false, count: 1 }])
        })

        it('a failed read is an error in the store, and is thrown to the caller', async () => {
            service.init()
            service.repository.findAll.mockRejectedValue(new Error('Load failed'))

            await expect(service.loadAlbums()).rejects.toThrow('Load failed')

            expect(store.getState()).toMatchObject({ loading: false, error: 'Load failed' })
        })
    })

    it('addAlbum writes through the repository and reads the inventory again', async () => {
        service.init()
        service.repository.findAll.mockResolvedValue([{ id: 'new-id' }])

        const id = await service.addAlbum({ title: 'New Album' }, 'cd')

        expect(id).toBe('new-id')
        expect(service.repository.addAlbum).toHaveBeenCalledWith({ title: 'New Album' }, 'cd', {})
        expect(store.getAlbums()).toEqual([{ id: 'new-id' }])
    })

    it('updateAlbum writes first and then changes the album in the store', async () => {
        store.setAlbums([{ id: '1', owned: null }, { id: '2', owned: null }])

        await expect(service.updateAlbum('1', { owned: true })).resolves.toBe('1')

        expect(service.repository.updateAlbum).toHaveBeenCalledWith('1', { owned: true })
        expect(store.getAlbums()).toEqual([{ id: '1', owned: true }, { id: '2', owned: null }])
    })

    it('updateAlbum that the repository refuses changes nothing in the store', async () => {
        store.setAlbums([{ id: '1', owned: null }])
        service.init()
        service.repository.updateAlbum.mockRejectedValue(new Error('refused'))

        await expect(service.updateAlbum('1', { owned: true })).rejects.toThrow('refused')

        expect(store.getAlbums()).toEqual([{ id: '1', owned: null }])
    })

    describe('updatePrice', () => {
        it('shows the new price at once, before the repository answers', async () => {
            store.setAlbums([{ id: '1', purchasePrice: 10, currency: 'USD' }])

            const promise = service.updatePrice('1', 20, 'USD')
            expect(store.getAlbums()[0].purchasePrice).toBe(20)

            await expect(promise).resolves.toBe('1')
            expect(service.repository.updatePrice).toHaveBeenCalledWith('1', 20, 'USD')
        })

        it('puts the old price back when the repository refuses', async () => {
            store.setAlbums([{ id: '1', purchasePrice: 10, currency: 'USD' }])
            service.init()
            service.repository.updatePrice.mockRejectedValue(new Error('Update failed'))

            await expect(service.updatePrice('1', 20, 'USD')).rejects.toThrow('Update failed')

            expect(store.getAlbums()[0].purchasePrice).toBe(10)
        })
    })

    it('removeAlbum removes from the repository and then from the store; a refusal removes nothing', async () => {
        store.setAlbums([{ id: '1' }, { id: '2' }])

        await expect(service.removeAlbum('1')).resolves.toBe('1')
        expect(store.getAlbums()).toEqual([{ id: '2' }])

        service.repository.removeAlbum.mockRejectedValue(new Error('refused'))
        await expect(service.removeAlbum('2')).rejects.toThrow('refused')
        expect(store.getAlbums()).toEqual([{ id: '2' }])
    })

    it('isInInventory asks the repository, and a failure reads as "no"', async () => {
        service.init()
        expect(await service.isInInventory('a1')).toBe(false)

        service.repository.findByAlbumId.mockResolvedValue({ id: 'inv-9' })
        expect(await service.isInInventory('a1')).toBe(true)

        service.repository.findByAlbumId.mockRejectedValue(new Error('offline'))
        expect(await service.isInInventory('a1')).toBe(false)
    })
})
