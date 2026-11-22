/**
 * F83 wave 5a (REQ-01, risk R2): the albums screen, once left, hears nothing. The controller is the session's one and outlives the screen, so
 * the leave test is also where it is proved that the screen lets go of it (the stores, the language and the phone are counted by the mold).
 */
import { afterEach, vi } from 'vitest'

vi.mock('../../../public/js/firebase-init.js', () => ({ app: {}, auth: { currentUser: null }, db: {} }))
vi.mock('../../../public/js/services/albums/albumLoading.js', async () => (await import('../../support/albumsScenarios.js')).loadModule)
vi.mock('../../../public/js/services/ranking/ownRanking.js', async () => (await import('../../support/albumsScenarios.js')).rankingModule)
vi.mock('../../../public/js/services/SeriesService.js', async () => (await import('../../support/albumsScenarios.js')).seriesServiceModule)
vi.mock('../../../public/js/stores/toasts.js', async () => (await import('../../support/albumsScenarios.js')).toastModule)
vi.mock('../../../public/js/screens/albums/useAlbumWindows', async () => (await import('../../support/albumsScenarios.js')).windowsModule)

import SeriesController from '../../../public/js/controllers/SeriesController.js'
import { Albums } from '../../../public/js/screens/albums/Albums'
import { AlbumsBridge } from '../../../public/js/screens/albums/AlbumsBridge'
import { itLeavesNoListeners } from '../../support/renderScreen'
import { asPhone, quiet, prepare, SCENARIOS } from '../../support/albumsScenarios.js'

afterEach(() => { document.body.innerHTML = ''; vi.restoreAllMocks(); vi.unstubAllGlobals() })

// one controller for the whole session, as the route has it; a new bridge for each visit, handed to the controller before the first draw
const controller = new SeriesController()
let bridge: AlbumsBridge
const visits = {
    controller: controller as never,
    get bridge() { return bridge },
    route: { scope: 'ALL' as const, seriesId: null }
}
asPhone(false)
quiet()
prepare(SCENARIOS[2])
itLeavesNoListeners('Albums', Albums, visits, {
    screen: 'albums',
    view: {
        prepare: async () => {
            bridge = new AlbumsBridge(controller as never)
            controller.setView(bridge)
            controller.init(null, bridge)
            await controller.loadScope('ALL', null, false, { entering: true })
        },
        dispose: () => bridge.dispose()
    }
})
