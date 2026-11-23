/**
 * The route of the Start screen: what app.js asks for when the person opens /start. A view the router can mount (the bridge makes it
 * one), named `start` for the measurement of use. The controller is made here, one for each time the screen is opened, as the
 * hand-made view made its own; it is started before the screen is drawn (it asks the album picker for its first state and listens to
 * the user store) and let go of once, when the screen is left. `window.controller` is the handle the browser proof of the Home (F79,
 * and the visual sensor of F84) drives the page by.
 */
import { ReactView } from '../../react-bridge/ReactView'
import { Start } from './Start'
import { StartController } from './StartController'

export function startView() {
    const controller = new StartController()
    return new ReactView(Start, { controller }, {
        screen: 'start',
        prepare: async () => {
            controller.initialize()
            ;(window as { controller?: StartController }).controller = controller
        },
        dispose: () => controller.dispose()
    })
}
