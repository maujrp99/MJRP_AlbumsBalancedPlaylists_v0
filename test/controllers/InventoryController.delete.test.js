/**
 * UAT-01 - removing an album from the inventory did nothing: the controller called a store method
 * that does not exist. It asks the inventory service to remove (the store only holds state, F58), and tells the person what happened.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const service = vi.hoisted(() => ({ removeAlbum: vi.fn() }))
const store = vi.hoisted(() => ({
    getAlbums: vi.fn(() => []),
    getStatistics: vi.fn(() => ({})),
    subscribe: vi.fn(() => () => { }),
    loadAlbums: vi.fn(async () => [])
}))
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }))

vi.mock('../../public/js/stores/inventory.js', () => ({ inventoryStore: store }))
vi.mock('../../public/js/services/inventory/inventoryWiring.js', () => ({ inventoryService: service }))
// The values of the inventory (F75) are off in these tests: no Discogs, no rates
vi.mock('../../public/js/services/inventory/inventoryValueWiring.js', async () => ({ inventoryValues: (await import('../helpers/inventoryValuesStub.js')).valuesOff() }))
vi.mock('../../public/js/services/OptimizedAlbumLoader.js', () => ({ optimizedAlbumLoader: {} }))
vi.mock('../../public/js/components/Toast.js', () => ({ default: toast, toast }))

import { InventoryController } from '../../public/js/controllers/InventoryController.js'

describe('InventoryController.handleDelete (UAT-01)', () => {
    let controller

    beforeEach(() => {
        controller = new InventoryController({ update: vi.fn() })
        controller.updateStateFromStore = vi.fn()
        controller.refresh = vi.fn()
    })

    it('asks the service to remove the album, says so, and redraws', async () => {
        service.removeAlbum.mockResolvedValue('inv-1')

        await controller.handleDelete('inv-1')

        expect(service.removeAlbum).toHaveBeenCalledWith('inv-1')
        expect(toast.success).toHaveBeenCalledWith('Album removed from inventory')
        expect(controller.updateStateFromStore).toHaveBeenCalled()
        expect(controller.refresh).toHaveBeenCalled()
    })

    it('when the removal fails, says so and leaves the screen as it was', async () => {
        service.removeAlbum.mockRejectedValue(new Error('offline'))

        await controller.handleDelete('inv-1')

        expect(toast.error).toHaveBeenCalledWith('Failed to delete album')
        expect(toast.success).not.toHaveBeenCalled()
        expect(controller.refresh).not.toHaveBeenCalled()
    })
})
