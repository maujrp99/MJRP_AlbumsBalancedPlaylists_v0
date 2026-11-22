/**
 * F75 (S-57) - the inventory controller and the values: what it asks when the screen opens (the
 * switch and the rates, never Discogs), "Update values" with its progress, its stop and its honest
 * end, the value the person writes, and one album read from its window.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { valuesWith, valuesOff, reading, RATES } from '../helpers/inventoryValuesStub.js'

const holder = vi.hoisted(() => ({ values: null }))
const service = vi.hoisted(() => ({ updateAlbum: vi.fn(async () => 'id') }))
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }))

vi.mock('../../public/js/services/inventory/inventoryWiring.js', () => ({ inventoryService: service, readSeriesOfThePerson: vi.fn() }))
vi.mock('../../public/js/services/inventory/inventoryValueWiring.js', () => ({
    inventoryValues: new Proxy({}, { get: (_, name) => holder.values[name] })
}))
vi.mock('../../public/js/services/OptimizedAlbumLoader.js', () => ({ optimizedAlbumLoader: { load: vi.fn(async () => { }) } }))
vi.mock('../../public/js/stores/toasts.js', () => ({ default: toast, toast }))

import { InventoryController } from '../../public/js/controllers/InventoryController.js'
import { inventoryStore } from '../../public/js/stores/inventory.js'

const owned = { id: 'owned', artist: 'Pink Floyd', title: 'Animals', owned: true }
const written = { id: 'written', artist: 'Radiohead', title: 'OK Computer', owned: true, value: { amount: 25, currency: 'USD', at: '2026-10-12T10:00:00.000Z' } }
const wanted = { id: 'wanted', artist: 'Joni Mitchell', title: 'Hejira', owned: null }
const wished = { id: 'wished', artist: 'Yes', title: 'Fragile', owned: false }
const ITEMS = [owned, written, wanted, wished]

const fakeView = () => ({ render: vi.fn(), showValues: vi.fn() })

async function open(values, items = ITEMS) {
    holder.values = values
    inventoryStore.setAlbums(items)
    const view = fakeView()
    const controller = new InventoryController(view)
    await controller.initialize()
    await controller.valuesOpened
    return { controller, view }
}
const valueOf = (controller, id) => controller.state.value.values.get(id)

describe('InventoryController: the values (F75)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        localStorage.clear()
        inventoryStore.reset()
    })

    describe('when the screen opens', () => {
        it('asks the switch and the rates once, reads what the browser keeps, and asks NOTHING to Discogs', async () => {
            const values = valuesWith({ readings: new Map([['owned', reading()]]) })
            const { controller } = await open(values)

            expect(values.sourceState).toHaveBeenCalledTimes(1)
            expect(values.rates).toHaveBeenCalledTimes(1)
            expect(values.readMany).not.toHaveBeenCalled()
            expect(values.readItem).not.toHaveBeenCalled()
            expect(valueOf(controller, 'owned')).toMatchObject({ origin: 'discogs', amount: 11.2 })
            expect(valueOf(controller, 'written')).toMatchObject({ origin: 'yours', amount: 25 })
        })

        it('counts the albums that wait for a value: no value written and no fresh reading', async () => {
            const { controller } = await open(valuesWith({ readings: new Map([['owned', reading()]]) }))

            expect(controller.state.value.waiting).toBe(2)
            expect(valueOf(controller, 'wanted')).toEqual({ origin: null, reason: 'waiting' })
        })

        it('drawing the screen again starts no run and asks the switch no second time', async () => {
            const values = valuesWith()
            const { controller } = await open(values)

            controller.refresh()
            controller.handleFilterChange('search', 'pink')
            inventoryStore.setAlbums([...ITEMS])
            controller.updateStateFromStore()
            await Promise.resolve()

            expect(values.readMany).not.toHaveBeenCalled()
            expect(values.sourceState).toHaveBeenCalledTimes(1)
        })

        it('the person became known after the screen opened: the switch is asked again, once, for who is here', async () => {
            const values = valuesWith({ source: 'off' })
            values.userId = 'anonymous-user'
            const { controller } = await open(values)
            expect(controller.state.value.source).toBe('off')

            values.userId = 'user-1'
            values.sourceState.mockResolvedValue('on')
            inventoryStore.setAlbums([...ITEMS])
            controller.updateStateFromStore()
            await vi.waitFor(() => expect(controller.state.value.source).toBe('on'))
            controller.updateStateFromStore()
            await Promise.resolve()

            expect(values.sourceState).toHaveBeenCalledTimes(2)
            expect(values.readMany).not.toHaveBeenCalled()
        })

        it('the totals: what is owned on one side, the rest on the other, each with how many have a value', async () => {
            const { controller } = await open(valuesWith({ readings: new Map([['owned', reading()], ['wanted', reading({ mint: 6, nearMint: 6, veryGoodPlus: 6 })]]) }))

            const { totals } = controller.state.value
            expect(totals.owned.valued).toBe(2)
            expect(totals.owned.total).toBe(2)
            expect(totals.owned.sum).toBeCloseTo(36.2, 5)
            expect(totals.toBuy).toMatchObject({ valued: 1, total: 2, sum: 6 })
        })
    })

    describe('the reading kept in the database (REQ-14, REQ-15)', () => {
        const DAY = 24 * 60 * 60 * 1000
        const kept = (extra = {}) => ({ ...reading({ readAt: new Date(Date.now() - 3 * DAY).toISOString() }), ...extra })
        const withKept = (id, saved = kept()) => ITEMS.map(item => (item.id === id ? { ...item, discogsReading: saved } : item))

        it('a reading kept in the item shows at once, with its date, with nothing in the browser and nothing asked to Discogs', async () => {
            const values = valuesWith()
            const { controller } = await open(values, withKept('wanted'))

            expect(valueOf(controller, 'wanted')).toMatchObject({ origin: 'discogs', amount: 11.2, readAt: kept().readAt })
            expect(values.readMany).not.toHaveBeenCalled()
            expect(controller.state.value.discogsShown).toBe(true)
        })

        it('the notice counts only the albums that never had a reading: a kept one, however old, is not waiting', async () => {
            const { controller } = await open(valuesWith(), withKept('wanted'))

            expect(controller.state.value.waiting).toBe(2) // «owned» and «wished»; «wanted» has its reading and «written» a value
        })

        it('"Update values" reads what was kept long ago again, and not what was read minutes ago', async () => {
            const minutesAgo = kept({ readAt: new Date(Date.now() - 5 * 60 * 1000).toISOString() })
            const items = withKept('wanted').map(item => (item.id === 'wished' ? { ...item, discogsReading: minutesAgo } : item))
            const values = valuesWith()
            const { controller } = await open(values, items)

            await controller.handleUpdateValues()

            expect(values.readMany.mock.calls[0][0].map(item => item.id)).toEqual(['owned', 'wanted'])
        })

        it('"Read them now" reads only the albums that never had a reading', async () => {
            const values = valuesWith()
            const { controller } = await open(values, withKept('wanted'))

            await controller.handleUpdateValues({ onlyNeverRead: true })

            expect(values.readMany.mock.calls[0][0].map(item => item.id)).toEqual(['owned', 'wished'])
        })

        it('a fresh reading only the browser holds is kept in its item on the next run, with no new question to Discogs', async () => {
            const held = reading()
            const values = valuesWith({ readings: new Map([['owned', held]]) })
            const { controller } = await open(values)
            expect(values.keepReadings).not.toHaveBeenCalled() // not silently, when the screen opens

            await controller.handleUpdateValues()

            expect(values.keepReadings).toHaveBeenCalledWith([{ item: expect.objectContaining({ id: 'owned' }), reading: held }])
            expect(values.readMany.mock.calls[0][0].map(item => item.id)).toEqual(['wanted', 'wished'])
        })

        it('the newest reading wins between the database and the browser, and the written value beats both', async () => {
            const newer = reading({ mint: 20, nearMint: 20, veryGoodPlus: 20, readAt: new Date().toISOString() })
            const values = valuesWith({ readings: new Map([['wanted', newer], ['written', newer]]) })
            const { controller } = await open(values, withKept('wanted').map(item => (item.id === 'written' ? { ...item, discogsReading: kept() } : item)))

            expect(valueOf(controller, 'wanted')).toMatchObject({ origin: 'discogs', amount: 20 })
            expect(valueOf(controller, 'written')).toMatchObject({ origin: 'yours', amount: 25 })
        })

        it('another person on the same device sees none of the values kept for the one who left', async () => {
            const values = valuesWith()
            const { controller } = await open(values, withKept('wanted'))
            expect(valueOf(controller, 'wanted').origin).toBe('discogs')

            values.userId = 'user-2'
            inventoryStore.setAlbums([{ id: 'other', artist: 'Yes', title: 'Close to the Edge', owned: true }])
            controller.updateStateFromStore()
            await vi.waitFor(() => expect(values.sourceState).toHaveBeenCalledTimes(2))
            await vi.waitFor(() => expect(controller.state.value.values.has('wanted')).toBe(false))

            expect(valueOf(controller, 'other')).toEqual({ origin: null, reason: 'waiting' })
            expect(controller.state.value.discogsShown).toBe(false)
        })
    })

    describe('the switch off (REQ-10)', () => {
        it('no Discogs value, nothing waiting, no run; the written value and the totals go on', async () => {
            const values = valuesWith({ source: 'off', rates: RATES, readings: new Map([['owned', reading()]]) })
            const { controller } = await open(values)

            expect(controller.state.value.source).toBe('off')
            expect(valueOf(controller, 'owned')).toEqual({ origin: null, reason: 'source_off' })
            expect(valueOf(controller, 'written').origin).toBe('yours')
            expect(controller.state.value.waiting).toBe(0)
            expect(controller.state.value.totals.owned).toEqual({ sum: 25, valued: 1, total: 2 })
            expect(values.readingsOf).not.toHaveBeenCalled()

            await controller.handleUpdateValues()
            await controller.handleReadValue('owned')
            expect(values.readMany).not.toHaveBeenCalled()
            expect(values.readItem).not.toHaveBeenCalled()
        })
    })

    describe('the currency (REQ-08)', () => {
        it('the choice is kept where the inventory always kept it, and comes back', async () => {
            const { controller } = await open(valuesWith())
            controller.handleCurrencyChoice('BRL')

            expect(localStorage.getItem('inventoryCurrency')).toBe('BRL')
            expect(controller.state.value.money).toMatchObject({ chosen: 'BRL', currency: 'BRL', ratesMissing: false })

            const again = await open(valuesWith())
            expect(again.controller.state.value.money.currency).toBe('BRL')
        })

        it('with no rates the screen is in USD, and says the rates are missing', async () => {
            localStorage.setItem('inventoryCurrency', 'EUR')
            const { controller } = await open(valuesWith({ rates: null }))

            expect(controller.state.value.money).toMatchObject({ chosen: 'EUR', currency: 'USD', rates: null, ratesMissing: true })
        })

        it('a currency that is not one of the four is ignored', async () => {
            const { controller } = await open(valuesWith())
            controller.handleCurrencyChoice('JPY')
            expect(controller.state.value.money.currency).toBe('USD')
        })
    })

    describe('"Update values" (REQ-09)', () => {
        it('reads the items with no value written and no fresh reading, and only those', async () => {
            const values = valuesWith({ readings: new Map([['owned', reading()]]) })
            const { controller } = await open(values)

            await controller.handleUpdateValues()

            expect(values.readMany.mock.calls[0][0].map(item => item.id)).toEqual(['wanted', 'wished'])
        })

        it('shows the progress on the button and each album as it is read, without drawing the screen whole', async () => {
            const values = valuesWith()
            values.readMany.mockImplementation(async (items, { onProgress, onItem }) => {
                onItem(items[0], { state: 'reading' })
                onItem(items[0], { reading: reading() })
                onProgress({ total: 3, done: 1, read: 1, noEdition: 0, noSuggestion: 0, failed: {} })
                return { total: 3, done: 3, read: 3, noEdition: 0, noSuggestion: 0, failed: {}, stopped: null, aborted: false }
            })
            const { controller, view } = await open(values)
            view.render.mockClear()
            const seen = []
            view.showValues.mockImplementation((state, id) => seen.push([state.value.run.text, id]))

            await controller.handleUpdateValues()

            expect(seen).toEqual([['Reading values… 0 of 3', null], ['Reading values… 0 of 3', 'owned'], ['Reading values… 0 of 3', 'owned'], ['Reading values… 1 of 3', null]])
            expect(view.render).toHaveBeenCalledTimes(1) // once, when the run ended
            expect(controller.state.value.run.busy).toBe(false)
            expect(valueOf(controller, 'owned').origin).toBe('discogs')
            expect(toast.success).toHaveBeenCalledWith('Values read for 3 of 3 albums.')
        })

        it('a second press while it runs starts no second run', async () => {
            const values = valuesWith()
            let finish
            values.readMany.mockImplementation(() => new Promise(resolve => { finish = () => resolve({ total: 3, done: 3, read: 3, noEdition: 0, noSuggestion: 0, failed: {}, stopped: null, aborted: false }) }))
            const { controller } = await open(values)

            const first = controller.handleUpdateValues()
            await controller.handleUpdateValues()
            finish()
            await first

            expect(values.readMany).toHaveBeenCalledTimes(1)
        })

        it('"Stop" aborts the run, and the end says where it stopped', async () => {
            const values = valuesWith()
            values.readMany.mockImplementation((items, { signal }) => new Promise(resolve => {
                signal.addEventListener('abort', () => resolve({ total: 3, done: 1, read: 1, noEdition: 0, noSuggestion: 0, failed: {}, stopped: null, aborted: true }))
            }))
            const { controller } = await open(values)

            const run = controller.handleUpdateValues()
            controller.handleStopValues()
            await run

            expect(toast.success).toHaveBeenCalledWith('Values read for 1 of 3 albums. Stopped by you after 1 of 3.')
        })

        it('leaving the screen drops the run and says nothing', async () => {
            const values = valuesWith()
            let signalOfTheRun
            values.readMany.mockImplementation((items, { signal }) => new Promise(resolve => {
                signalOfTheRun = signal
                signal.addEventListener('abort', () => resolve({ total: 3, done: 0, read: 0, noEdition: 0, noSuggestion: 0, failed: {}, stopped: null, aborted: true }))
            }))
            const { controller, view } = await open(values)

            const run = controller.handleUpdateValues()
            view.render.mockClear()
            controller.dispose()
            await run

            expect(signalOfTheRun.aborted).toBe(true)
            expect(toast.success).not.toHaveBeenCalled()
            expect(toast.error).not.toHaveBeenCalled()
            expect(view.render).not.toHaveBeenCalled()
        })

        it('the end says the truth when albums failed, and why', async () => {
            const values = valuesWith()
            values.readMany.mockResolvedValue({ total: 3, done: 3, read: 1, noEdition: 1, noSuggestion: 0, failed: { no_answer: 1 }, stopped: null, aborted: false })
            const { controller } = await open(values)

            await controller.handleUpdateValues()

            expect(toast.error).toHaveBeenCalledWith('Values read for 1 of 3 albums. 1 album has no CD edition on Discogs. 1 album could not be read: Discogs did not answer (1).')
        })

        it('the source turned off in the middle: the screen goes to "off"', async () => {
            const values = valuesWith()
            values.readMany.mockResolvedValue({ total: 3, done: 1, read: 1, noEdition: 0, noSuggestion: 0, failed: {}, stopped: 'off', aborted: false })
            const { controller } = await open(values)

            await controller.handleUpdateValues()

            expect(controller.state.value.source).toBe('off')
        })

        it('with nothing to read it says so and asks nothing', async () => {
            const values = valuesWith({ readings: new Map(ITEMS.map(item => [item.id, reading()])) })
            const { controller } = await open(values)

            await controller.handleUpdateValues()

            expect(values.readMany).not.toHaveBeenCalled()
            expect(toast.info).toHaveBeenCalledWith('Every album already has a value written by you or read in the last six hours.')
        })
    })

    describe('the value the person writes (REQ-03)', () => {
        it('is written to the item in USD; typed in the shown currency, it is converted', async () => {
            const { controller } = await open(valuesWith())

            expect(await controller.handleWriteValue('owned', '12,50')).toBe(true)
            expect(service.updateAlbum).toHaveBeenLastCalledWith('owned', { value: { amount: 12.5, currency: 'USD', at: expect.any(String) } })

            controller.handleCurrencyChoice('BRL')
            await controller.handleWriteValue('owned', '58.90')
            expect(service.updateAlbum.mock.calls.at(-1)[1].value).toMatchObject({ amount: 10, currency: 'USD' })
            expect(toast.success).toHaveBeenCalledWith('Value saved')
        })

        it('what is not an amount is refused with words, and nothing is written', async () => {
            const { controller } = await open(valuesWith())

            expect(await controller.handleWriteValue('owned', 'a lot')).toBe(false)
            expect(service.updateAlbum).not.toHaveBeenCalled()
            expect(toast.error).toHaveBeenCalledWith('Write the value as a number above zero, for example 12.50.')
        })

        it('a write that fails is said, and the answer is "not saved"', async () => {
            vi.spyOn(console, 'error').mockImplementation(() => { })
            service.updateAlbum.mockRejectedValueOnce(new Error('offline'))
            const { controller } = await open(valuesWith())

            expect(await controller.handleWriteValue('owned', '10')).toBe(false)
            expect(toast.error).toHaveBeenCalledWith('The value could not be saved. Your inventory is as it was.')
        })

        it('"Use the Discogs value instead" takes the written value away', async () => {
            const { controller } = await open(valuesWith())

            await controller.handleForgetValue('written')

            expect(service.updateAlbum).toHaveBeenCalledWith('written', { value: null })
        })

        it('a reading never replaces the written value: the item is not even asked for', async () => {
            const values = valuesWith()
            const { controller } = await open(values)

            await controller.handleUpdateValues()

            expect(values.readMany.mock.calls[0][0].map(item => item.id)).not.toContain('written')
        })
    })

    describe('one album, from its window (REQ-04, REQ-13)', () => {
        it('is read now, its reading and edition are kept in the item, and the window is given the new value', async () => {
            const values = valuesWith()
            values.readItem.mockResolvedValue({ reading: reading() })
            const { controller } = await open(values)

            await controller.handleReadValue('wanted')

            expect(values.readItem.mock.calls[0][0].id).toBe('wanted')
            expect(values.keepReadings).toHaveBeenCalledWith([{ item: expect.objectContaining({ id: 'wanted' }), reading: expect.objectContaining({ kind: 'found' }) }])
            expect(controller.valueViewOf('wanted')).toMatchObject({ value: { origin: 'discogs' }, source: 'on', busy: false, money: { currency: 'USD' } })
        })

        it('a failure is said in plain words and shown on the item', async () => {
            const values = valuesWith()
            values.readItem.mockResolvedValue({ failure: 'limit', waitMs: 40000, stops: false })
            const { controller } = await open(values)

            await controller.handleReadValue('wanted')

            expect(toast.error).toHaveBeenCalledWith('Discogs limit reached. The value was not read.')
            expect(controller.valueViewOf('wanted').value).toEqual({ origin: null, reason: 'failed', failure: 'limit' })
            expect(values.keepReadings).not.toHaveBeenCalled()
        })
    })

    it('with the values off the rest of the controller is as it was', async () => {
        const { controller } = await open(valuesOff())
        expect(controller.state.filteredAlbums).toHaveLength(4)
        expect(controller.state.value.money.ratesMissing).toBe(true)
    })
})
