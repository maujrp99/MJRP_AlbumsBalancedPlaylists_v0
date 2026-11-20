/**
 * F70, UAT-209 - the controller asks the inventory service to change a price and tells the person
 * what happened. The service throws when the write fails (it never answers "false"): the old code
 * waited for a false answer, so a failure showed nothing.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const service = vi.hoisted(() => ({ updatePrice: vi.fn(), updateAlbum: vi.fn() }))
const store = vi.hoisted(() => ({
    getAlbums: vi.fn(() => []),
    getStatistics: vi.fn(() => ({})),
    subscribe: vi.fn(() => () => { })
}))
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }))

vi.mock('../../public/js/stores/inventory.js', () => ({ inventoryStore: store }))
vi.mock('../../public/js/services/inventory/inventoryWiring.js', () => ({ inventoryService: service }))
// The values of the inventory (F75) are off in these tests: no Discogs, no rates
vi.mock('../../public/js/services/inventory/inventoryValueWiring.js', async () => ({ inventoryValues: (await import('../helpers/inventoryValuesStub.js')).valuesOff() }))
vi.mock('../../public/js/services/OptimizedAlbumLoader.js', () => ({ optimizedAlbumLoader: {} }))
vi.mock('../../public/js/components/Toast.js', () => ({ default: toast, toast }))

import { InventoryController } from '../../public/js/controllers/InventoryController.js'

describe('InventoryController.handleUpdatePrice (UAT-209)', () => {
    let controller

    beforeEach(() => {
        vi.clearAllMocks()
        controller = new InventoryController({ update: vi.fn() })
        controller.updateStateFromStore = vi.fn()
        controller.refresh = vi.fn()
        vi.spyOn(console, 'error').mockImplementation(() => { })
    })

    it('asks the service once, says so, and redraws from the store', async () => {
        service.updatePrice.mockResolvedValue('inv-1')

        await controller.handleUpdatePrice('inv-1', 150)

        expect(service.updatePrice).toHaveBeenCalledTimes(1)
        expect(service.updatePrice.mock.calls[0].slice(0, 2)).toEqual(['inv-1', 150])
        expect(service.updateAlbum).not.toHaveBeenCalled()
        expect(toast.success).toHaveBeenCalledWith('Price updated')
        expect(controller.updateStateFromStore).toHaveBeenCalled()
        expect(controller.refresh).toHaveBeenCalled()
    })

    it('passes on a currency the person chose, and none when the person chose none', async () => {
        service.updatePrice.mockResolvedValue('inv-1')

        await controller.handleUpdatePrice('inv-1', 150)
        await controller.handleUpdatePrice('inv-1', 30, 'USD')

        expect(service.updatePrice.mock.calls[0][2]).toBeUndefined()
        expect(service.updatePrice.mock.calls[1]).toEqual(['inv-1', 30, 'USD'])
    })

    it('when the write fails: the error notice, no success notice, and the screen shows the old price again', async () => {
        service.updatePrice.mockRejectedValue(new Error('offline'))

        await controller.handleUpdatePrice('inv-1', 150)

        expect(toast.error).toHaveBeenCalledWith('Failed to update price')
        expect(toast.success).not.toHaveBeenCalled()
        expect(service.updateAlbum).not.toHaveBeenCalled()
        // the service put the old price back in the store: the screen is redrawn from it
        expect(controller.updateStateFromStore).toHaveBeenCalled()
        expect(controller.refresh).toHaveBeenCalled()
    })

    it('the state is declared once: no key of the initial state is written twice', async () => {
        const fs = await import('node:fs')
        const source = fs.readFileSync('public/js/controllers/InventoryController.js', 'utf8')
        const initialState = source.slice(source.indexOf('this.state = {'), source.indexOf('isLoading: false'))

        expect(initialState.match(/^ {12}sorting:/gm)).toHaveLength(1)
    })
})
