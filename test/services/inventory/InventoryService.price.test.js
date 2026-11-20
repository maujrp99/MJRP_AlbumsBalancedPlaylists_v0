/**
 * F70, UAT-209 - changing the price of an inventory item keeps the item's currency. The controller
 * asked `updatePrice(albumId, newPrice)` with no currency: the screen showed the item with no
 * currency, and the database received the repository's default (USD), whatever the item had.
 *
 * The service owns the rule (it knows the item): with no currency given, the item keeps its own.
 * The real InventoryRepository runs here over the in-memory Firestore, to look at what is written.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('firebase/firestore', async () => (await import('../../helpers/fakeFirestore.js')).firestoreModule)

import { fake } from '../../helpers/fakeFirestore.js'
import { InventoryRepository } from '../../../public/js/repositories/InventoryRepository.js'
import { InventoryService } from '../../../public/js/services/inventory/InventoryService.js'
import { InventoryStore } from '../../../public/js/stores/inventory.js'

const USER = 'owner-1'
const PATH = `artifacts/mjrp-albums/users/${USER}/inventory`
const item = (id, fields) => ({ title: 'Animals', artist: 'Pink Floyd', format: 'vinyl', ...fields, id })

describe('InventoryService.updatePrice keeps the currency of the item (UAT-209)', () => {
    let store, service

    const seed = (id, fields) => {
        fake.seed(`${PATH}/${id}`, { title: 'Animals', artist: 'Pink Floyd', format: 'vinyl', ...fields })
        store.setAlbums([...store.getAlbums(), item(id, fields)])
    }

    beforeEach(async () => {
        fake.reset()
        store = new InventoryStore()
        service = new InventoryService({
            store,
            createRepository: (userId) => new InventoryRepository({}, null, userId)
        })
        vi.spyOn(console, 'log').mockImplementation(() => { })
        vi.spyOn(console, 'error').mockImplementation(() => { })
        await service.handleUserChange({ currentUser: { uid: USER } })
    })

    afterEach(() => vi.restoreAllMocks())

    it('with no currency given, the item keeps its own: on screen and in the database', async () => {
        seed('inv-1', { purchasePrice: 100, currency: 'BRL' })

        await service.updatePrice('inv-1', 150)

        expect(store.getAlbums()[0]).toMatchObject({ purchasePrice: 150, currency: 'BRL' })
        expect(fake.get(`${PATH}/inv-1`)).toMatchObject({ purchasePrice: 150, currency: 'BRL' })
    })

    it('shows the new price with the currency at once, before the database answers', async () => {
        seed('inv-1', { purchasePrice: 100, currency: 'BRL' })

        const written = service.updatePrice('inv-1', 150)

        expect(store.getAlbums()[0]).toMatchObject({ purchasePrice: 150, currency: 'BRL' })
        await written
    })

    it('a currency that is given is the one written', async () => {
        seed('inv-1', { purchasePrice: 100, currency: 'BRL' })

        await service.updatePrice('inv-1', 30, 'USD')

        expect(store.getAlbums()[0]).toMatchObject({ purchasePrice: 30, currency: 'USD' })
        expect(fake.get(`${PATH}/inv-1`)).toMatchObject({ purchasePrice: 30, currency: 'USD' })
    })

    it('an item that never had a currency gets none invented: only the price is written', async () => {
        seed('inv-1', { purchasePrice: 100 })

        await service.updatePrice('inv-1', 150)

        expect(store.getAlbums()[0].purchasePrice).toBe(150)
        expect('currency' in store.getAlbums()[0]).toBe(false)
        expect(fake.get(`${PATH}/inv-1`).purchasePrice).toBe(150)
        expect('currency' in fake.get(`${PATH}/inv-1`)).toBe(false)
    })

    it('no other item is touched', async () => {
        seed('inv-1', { purchasePrice: 100, currency: 'BRL' })
        seed('inv-2', { purchasePrice: 20, currency: 'USD' })

        await service.updatePrice('inv-1', 150)

        expect(store.getAlbums()[1]).toMatchObject({ id: 'inv-2', purchasePrice: 20, currency: 'USD' })
        expect(fake.get(`${PATH}/inv-2`)).toMatchObject({ purchasePrice: 20, currency: 'USD' })
    })

    it('when the write fails, the old price and currency are back and the failure is thrown', async () => {
        seed('inv-1', { purchasePrice: 100, currency: 'BRL' })
        fake.failNext('update', new Error('offline'))

        await expect(service.updatePrice('inv-1', 150)).rejects.toThrow('offline')

        expect(store.getAlbums()[0]).toEqual(item('inv-1', { purchasePrice: 100, currency: 'BRL' }))
        expect(fake.get(`${PATH}/inv-1`)).toMatchObject({ purchasePrice: 100, currency: 'BRL' })
    })

    it('a negative price is refused before anything is shown or written', async () => {
        seed('inv-1', { purchasePrice: 100, currency: 'BRL' })
        const shown = []
        store.subscribe(state => shown.push(state.albums[0].purchasePrice))

        await expect(service.updatePrice('inv-1', -5)).rejects.toThrow('Price cannot be negative')

        expect(shown).toEqual([])
        expect(fake.writes()).toEqual([])
    })
})
