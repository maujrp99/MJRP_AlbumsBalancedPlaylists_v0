/**
 * The route of the inventory screen: what app.js asks for when the person opens /inventory. A view the router can mount (the bridge makes it one),
 * named `inventory` for the measurement of use. The controller is one for each visit (controllers/InventoryController.js, hand-written): it is made with
 * the bridge the screen draws into, and started here, in `prepare`, never in an effect of the screen (the strict mode runs an effect twice, and the
 * controller asks the server for the switch of the values and the rates of the day, and the album load to start, once). The two things the hand-made
 * view listened to are heard from `prepare` to `dispose`: the inventory store (the list changed: the controller counts again and draws) and the turn
 * of the phone (the rows and the cards are not the same).
 *
 * The inventory is read when the person signs in, not when this screen opens: services/inventory/inventoryWiring.js, which hears who signed in, is
 * imported by app.js itself.
 */
import { ReactView } from '../../react-bridge/ReactView'
import { InventoryController as Controller } from '../../controllers/InventoryController.js'
import { inventoryStore } from '../../stores/inventory.js'
import { onPhoneChange } from '../../utils/isPhone.js'
import { closeAllWindows } from '../../ui/windowLayer'
import { Inventory } from './Inventory'
import { InventoryBridge } from './InventoryBridge'
import type { InventoryController } from './types'

/** One visit: the controller, the bridge between it and the screen, and what the route does when the screen opens and when it is left. */
export function inventoryVisit() {
    const bridge = new InventoryBridge()
    // the controller is JavaScript: what the screen takes of it is said in types.ts
    const made: object = new Controller(bridge)
    const controller = made as InventoryController
    const stops: Array<() => void> = []
    return {
        bridge,
        controller,
        prepare: async () => {
            // the inventory store tells the controller to read it again; the phone turned: the list is not the same
            const stopStore = inventoryStore.subscribe(() => {
                controller.updateStateFromStore()
                controller.refresh()
            })
            stops.push(() => { stopStore() })
            const stopPhone = onPhoneChange(() => controller.refresh())
            stops.push(() => { stopPhone() })
            await controller.initialize()
        },
        dispose: () => {
            stops.splice(0).forEach(stop => stop())
            // what the ask for the ratings still waits for is dropped, and nothing is drawn any more
            controller.dispose()
            bridge.dispose()
            // the album window and the window to edit are not kept over the next screen (on purpose: the hand-made album window stayed)
            closeAllWindows()
        }
    }
}

/** The three parts of a visit: the view for the router, the controller and the bridge between the controller and the screen. */
export function inventoryParts() {
    const { bridge, controller, prepare, dispose } = inventoryVisit()
    const view = new ReactView(Inventory, { controller, bridge }, { screen: 'inventory', prepare, dispose })
    return { view, controller, bridge }
}

export function inventoryView() {
    return inventoryParts().view
}
