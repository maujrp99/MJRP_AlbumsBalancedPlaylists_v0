/**
 * The route of the albums screen: what app.js asks for when the person opens /albums or /albums/:seriesId. A view the router can mount (the
 * bridge makes it one), named `albums` for the measurement of use. The controller is the session's one (it lives on after the screen, with
 * the load going on in the service); each time the screen opens it is handed the bridge it draws into, and the scope the address asked for
 * is loaded before the screen is drawn, as the hand-made screen loaded it as soon as it was mounted. The controller lets go of the bridge
 * once, when the screen is left.
 */
import { ReactView, type RouteParams } from '../../react-bridge/ReactView'
import { sessionSeriesController } from '../../react-bridge/legacy/SessionSeriesController'
import { closeAllWindows } from '../../ui/windowLayer'
import { Albums, type AlbumsRoute } from './Albums'
import { AlbumsBridge } from './AlbumsBridge'
import type { AlbumsController } from './types'

/** The series the address names: `/albums/:seriesId`, or `?seriesId=` (a value of «undefined» or «null» is no series). */
export function routeOf(params: RouteParams): AlbumsRoute {
    const named = typeof params?.seriesId === 'string' ? params.seriesId : new URLSearchParams(window.location.search).get('seriesId')
    if (named && named !== 'undefined' && named !== 'null') return { scope: 'SINGLE', seriesId: named }
    return { scope: 'ALL', seriesId: null }
}

export function albumsView(controller: AlbumsController = sessionSeriesController() as AlbumsController) {
    const bridge = new AlbumsBridge(controller)
    const route: AlbumsRoute = { scope: 'ALL', seriesId: null }
    return new ReactView(Albums, { controller, bridge, route }, {
        screen: 'albums',
        prepare: async (params) => {
            Object.assign(route, routeOf(params))
            controller.setView(bridge)
            controller.init(null, bridge)
            await controller.loadScope(route.scope, route.seriesId, false, { entering: true })
        },
        // the album window and the window to add to the inventory are not kept over the next screen (on purpose: the hand-made album window stayed)
        dispose: () => { bridge.dispose(); closeAllWindows() }
    })
}
