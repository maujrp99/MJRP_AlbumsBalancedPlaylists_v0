/**
 * F77, REQ-02: the inventory's actions are measured where they work: the status changed, the value
 * written or removed, the values read (all of them, or one), the albums added. A write that fails
 * is not measured. No album, artist or amount leaves (REQ-03).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { valuesWith } from '../../helpers/inventoryValuesStub.js'

const holder = vi.hoisted(() => ({ values: null }))
const service = vi.hoisted(() => ({ updateAlbum: null }))
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }))

vi.mock('../../../public/js/services/inventory/inventoryWiring.js', () => ({
    inventoryService: { updateAlbum: (...args) => service.updateAlbum(...args) }, readSeriesOfThePerson: vi.fn()
}))
vi.mock('../../../public/js/services/inventory/inventoryValueWiring.js', () => ({
    inventoryValues: new Proxy({}, { get: (_, name) => holder.values[name] })
}))
vi.mock('../../../public/js/services/OptimizedAlbumLoader.js', () => ({ optimizedAlbumLoader: { load: vi.fn(async () => { }) } }))
vi.mock('../../../public/js/stores/toasts.js', () => ({ default: toast, toast }))

import { recordUsage, stopRecording } from '../../helpers/usageRecorder.js'
import { InventoryController } from '../../../public/js/controllers/InventoryController.js'
import { InventoryService } from '../../../public/js/services/inventory/InventoryService.js'
import { inventoryStore, InventoryStore } from '../../../public/js/stores/inventory.js'
import { valuesRunOutcome } from '../../../public/js/models/inventoryValueRun.js'

const owned = { id: 'owned', artist: 'Pink Floyd', title: 'Animals', owned: true }
const wanted = { id: 'wanted', artist: 'Joni Mitchell', title: 'Hejira', owned: null }
const run = (fields = {}) => ({ total: 2, done: 2, read: 2, noEdition: 0, noSuggestion: 0, failed: {}, stopped: null, aborted: false, ...fields })

async function open(values = valuesWith()) {
    holder.values = values
    inventoryStore.setAlbums([owned, wanted])
    const controller = new InventoryController({ render: vi.fn(), showValues: vi.fn() })
    await controller.initialize()
    await controller.valuesOpened
    return controller
}

let sent
beforeEach(async () => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => { })
    vi.spyOn(console, 'log').mockImplementation(() => { })
    service.updateAlbum = vi.fn(async () => 'id')
    localStorage.clear()
    inventoryStore.reset()
    sent = await recordUsage()
})
afterEach(() => {
    stopRecording()
    vi.restoreAllMocks()
})

describe('inventory_status_changed', () => {
    it('from the status it had to the one chosen', async () => {
        const controller = await open()
        await controller.handleStatusChange('wanted', 'wishlist')
        expect(sent).toEqual([['inventory_status_changed', { from: 'not_owned', to: 'wishlist' }]])
    })

    it('not when the write fails', async () => {
        const controller = await open()
        service.updateAlbum.mockRejectedValue(new Error('offline'))
        await controller.handleStatusChange('owned', 'not-owned')
        expect(sent).toEqual([])
    })
})

describe('filter_used on the inventory (the same controller on the phone and on the computer)', () => {
    it('the format, the status count, a search when it starts, the order', async () => {
        const controller = await open()
        controller.handleFilterChange('format', 'cd')
        controller.handleStatusCount('owned')
        controller.handleFilterChange('search', 'p')
        controller.handleFilterChange('search', 'pi')
        controller.handleSortChoice('value')
        controller.handleFilterChange('format', 'all')

        expect(sent).toEqual([
            ['filter_used', { screen: 'inventory', which: 'format' }],
            ['filter_used', { screen: 'inventory', which: 'status' }],
            ['filter_used', { screen: 'inventory', which: 'search' }],
            ['filter_used', { screen: 'inventory', which: 'sort' }]
        ])
    })
})

describe('the value written by the person', () => {
    it('inventory_value_written, never the amount', async () => {
        const controller = await open()
        await controller.handleWriteValue('wanted', '12.50')
        expect(sent).toEqual([['inventory_value_written', {}]])
    })

    it('inventory_value_removed', async () => {
        const controller = await open()
        await controller.handleForgetValue('wanted')
        expect(sent).toEqual([['inventory_value_removed', {}]])
    })

    it('nothing when the text is not an amount, or the write fails', async () => {
        const controller = await open()
        await controller.handleWriteValue('wanted', 'twelve')
        service.updateAlbum.mockRejectedValue(new Error('offline'))
        await controller.handleWriteValue('wanted', '12')
        expect(sent).toEqual([])
    })
})

describe('inventory_values_read', () => {
    it('"Update values": how many were read and how the run ended', async () => {
        const values = valuesWith()
        values.readMany.mockResolvedValue(run({ read: 1, noEdition: 1 }))
        const controller = await open(values)
        await controller.handleUpdateValues()
        expect(sent).toEqual([['inventory_values_read', { scope: 'all', count: 1, outcome: 'complete' }]])
    })

    it('one album, read from its window', async () => {
        const values = valuesWith()
        values.readItem.mockResolvedValue({ failure: 'limit', waitMs: 40000, stops: false })
        const controller = await open(values)
        await controller.handleReadValue('wanted')
        expect(sent).toEqual([['inventory_values_read', { scope: 'one', count: 0, outcome: 'failed' }]])
    })

    it.each([
        ['every album answered', run(), 'complete'],
        ['no CD edition is an answer, not a failure', run({ read: 0, noEdition: 2 }), 'complete'],
        ['some failed', run({ read: 1, failed: { no_answer: 1 } }), 'partial'],
        ['the limit stopped it after one', run({ read: 1, done: 1, stopped: 'limit' }), 'partial'],
        ['the limit stopped it before any', run({ read: 0, done: 0, stopped: 'limit' }), 'failed'],
        ['the person stopped it', run({ read: 1, done: 1, aborted: true }), 'stopped']
    ])('valuesRunOutcome: %s', (label, count, outcome) => {
        expect(valuesRunOutcome(count)).toBe(outcome)
    })
})

describe('inventory_albums_added', () => {
    const cloud = () => ({
        findAll: vi.fn(async () => []),
        addAlbum: vi.fn(async () => 'new-id'),
        addBatch: vi.fn(async (albums) => albums.map((album, index) => `inv-${index}`))
    })

    it('one album, from its card', async () => {
        const inventory = new InventoryService({ store: new InventoryStore(), createRepository: cloud })
        await inventory.addAlbum({ id: 'a1', title: 'Animals', artist: 'Pink Floyd' }, 'cd')
        expect(sent).toEqual([['inventory_albums_added', { from: 'one', count: 1 }]])
    })

    it('the albums of the series: how many went in', async () => {
        const inventory = new InventoryService({ store: new InventoryStore(), createRepository: cloud })
        await inventory.addAlbumsAsNotOwned([{ title: 'A', artist: 'X' }, { title: 'B', artist: 'X' }])
        expect(sent).toEqual([['inventory_albums_added', { from: 'series', count: 2 }]])
    })
})
