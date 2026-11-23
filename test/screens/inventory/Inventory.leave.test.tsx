/**
 * F83 wave 6a (REQ-01, risk R2): the inventory screen, once left, hears nothing. The controller is one for each visit and the route starts it (`prepare`),
 * hears the inventory store and the turn of the phone from there, and lets go of all of it in `dispose`; the stores, the language and the phone of
 * the bridge, and the window, are counted by the mold. Two things are proved besides: that the store is no longer heard, and that the controller no
 * longer draws into a bridge that was left.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../public/js/services/inventory/inventoryWiring.js', async () => (await import('../../support/inventoryStandIns.js')).wiringModule)
vi.mock('../../../public/js/services/inventory/inventoryValueWiring.js', async () => (await import('../../support/inventoryStandIns.js')).valuesModule)
vi.mock('../../../public/js/services/OptimizedAlbumLoader.js', async () => (await import('../../support/inventoryStandIns.js')).loaderModule)
vi.mock('../../../public/js/stores/toasts.js', async () => (await import('../../support/inventoryStandIns.js')).toastModule)
vi.mock('../../../public/js/ui/dialogs/dialogs', async () => (await import('../../support/inventoryStandIns.js')).dialogModule)

import { act } from 'react'
import { Inventory } from '../../../public/js/screens/inventory/Inventory'
import { inventoryVisit } from '../../../public/js/screens/inventory/index'
import { itLeavesNoListeners, renderScreen } from '../../support/renderScreen'
import { asPhone, prepare, SCENARIOS } from '../../support/inventoryScenarios.js'
import { inventoryStore } from '../../../public/js/stores/inventory.js'

afterEach(() => { document.body.innerHTML = ''; vi.useRealTimers(); vi.restoreAllMocks() })

prepare(SCENARIOS[2])
asPhone(false)

// a new controller and bridge for each visit, as the route makes them
let visit = inventoryVisit()
const visits = {
    get controller() { return visit.controller },
    get bridge() { return visit.bridge }
}
const view = {
    prepare: async () => { visit = inventoryVisit(); await visit.prepare() },
    dispose: () => visit.dispose()
}

itLeavesNoListeners('Inventory', Inventory, visits, { screen: 'inventory', view })

describe('the inventory screen once left', () => {
    it('hears the inventory store no more: the controller is not asked to count again', async () => {
        const rendered = await renderScreen(Inventory, visits, { screen: 'inventory', view })
        const refresh = vi.spyOn(visit.controller, 'refresh')
        await rendered.leave()
        await act(async () => { inventoryStore.replaceAlbums([...inventoryStore.getAlbums()]) })
        expect(refresh).not.toHaveBeenCalled()
    })

    it('the bridge, once left, ignores what the controller says (a run of values that goes on is not drawn)', async () => {
        const rendered = await renderScreen(Inventory, visits, { screen: 'inventory', view })
        const left = visit.bridge
        await rendered.leave()
        const before = left.getVersion()
        left.render()
        left.showValues(visit.controller.state, 'owned')
        expect(left.getVersion()).toBe(before)
    })
})
