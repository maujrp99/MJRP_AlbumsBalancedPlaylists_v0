/**
 * A series was edited and saved (UAT-191), carried over in F83 wave 5a from test/controllers/SeriesController.test.js, where it called the
 * hand-made manager of the windows: when the window of a series says «updated», the screen asks the load again as it is, never from
 * scratch (only what changed is loaded). The windows are React since F83 wave 5b (screens/albums/useAlbumWindows); here they are a stand-in
 * that keeps what the screen gave it to call back.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'

vi.mock('../../../public/js/firebase-init.js', () => ({ app: {}, auth: { currentUser: null }, db: {} }))
vi.mock('../../../public/js/services/albums/albumLoading.js', async () => (await import('../../support/albumsScenarios.js')).loadModule)
vi.mock('../../../public/js/services/ranking/ownRanking.js', async () => (await import('../../support/albumsScenarios.js')).rankingModule)
vi.mock('../../../public/js/services/SeriesService.js', async () => (await import('../../support/albumsScenarios.js')).seriesServiceModule)
vi.mock('../../../public/js/ui/dialogs/dialogs', async () => (await import('../../support/albumsScenarios.js')).dialogModule)
vi.mock('../../../public/js/stores/toasts.js', async () => (await import('../../support/albumsScenarios.js')).toastModule)
vi.mock('../../../public/js/screens/albums/useAlbumWindows', async () => (await import('../../support/albumsScenarios.js')).windowsModule)

import { act } from 'react'
import SeriesController from '../../../public/js/controllers/SeriesController.js'
import { albumsView } from '../../../public/js/screens/albums/index'
import { asPhone, quiet, outside, prepare, windowsStandIn } from '../../support/albumsScenarios.js'

describe('a series was edited and saved (UAT-191)', () => {
    afterEach(() => { document.body.innerHTML = ''; vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

    it('the load is asked again as it is, never from scratch: only what changed is loaded', async () => {
        asPhone(false)
        quiet()
        vi.spyOn(console, 'log').mockImplementation(() => {})
        prepare({})
        const app = document.body.appendChild(document.createElement('div'))
        app.id = 'app'
        const view = albumsView(new SeriesController() as never)
        await act(async () => { await view.render({}); view.mount({}) })
        await act(async () => { for (let i = 0; i < 5; i++) await new Promise(resolve => setImmediate(resolve)) })
        outside.length = 0

        await act(async () => { (windowsStandIn.given as unknown as { onSeriesUpdated: (seriesId: string) => void }).onSeriesUpdated('s1') })

        const loads = outside.filter(entry => entry[0] === 'load')
        expect(loads).toHaveLength(1)
        expect(loads[0][1]).toBe('ALL') // the scope
        expect(loads[0][3]).toBe(false) // fresh
        await act(async () => { view.destroy() })
    })
})
