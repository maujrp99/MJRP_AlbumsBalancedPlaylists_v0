/**
 * F83 wave 5a - written once, on the hand-made screen, before it was deleted: it draws every scenario of
 * test/support/albumsScenarios.js with the old SeriesView (and its controller, grid, bar, pagers and click handler) and writes what stands
 * in the page, and where the focus is, to test/fixtures/albumsBeforeF83.json.
 *
 * A RECORD, NOT A TEST THAT RUNS: it lives here (the runner only reads test/); it ran from test/views/SeriesView.capture.test.js
 * (with these paths) against the tree where views/SeriesView.js still existed (the commit before the one that deleted it).
 */
import { describe, it, afterEach, vi } from 'vitest'
import fs from 'node:fs'

vi.mock('../../public/js/firebase-init.js', () => ({ app: {}, auth: { currentUser: null }, db: {} }))
vi.mock('../../public/js/services/albums/albumLoading.js', async () => (await import('../support/albumsScenarios.js')).loadModule)
vi.mock('../../public/js/services/ranking/ownRanking.js', async () => (await import('../support/albumsScenarios.js')).rankingModule)
vi.mock('../../public/js/services/SeriesService.js', async () => (await import('../support/albumsScenarios.js')).seriesServiceModule)
vi.mock('../../public/js/services/DialogService.js', async () => (await import('../support/albumsScenarios.js')).dialogModule)
vi.mock('../../public/js/components/Toast.js', async () => (await import('../support/albumsScenarios.js')).toastModule)
vi.mock('../../public/js/components/ViewAlbumModal.js', async () => (await import('../support/albumsScenarios.js')).albumWindowModule)
vi.mock('../../public/js/components/InventoryAddModal.js', async () => (await import('../support/albumsScenarios.js')).inventoryModule)
vi.mock('../../public/js/components/ranking/UserRankModal.js', async () => (await import('../support/albumsScenarios.js')).rankModule)
vi.mock('../../public/js/components/series/SeriesModals.js', async () => (await import('../support/albumsScenarios.js')).modalsModule)

import SeriesView from '../../public/js/views/SeriesView.js'
import SeriesController from '../../public/js/controllers/SeriesController.js'
import { SCENARIOS, keyOf, normalize, focusOf, asPhone, quiet, outside, prepare, answer, world, dialogs, behaviour } from '../support/albumsScenarios.js'

const OUT = 'test/fixtures/albumsBeforeF83.json'
const captured = {}
const tick = () => new Promise(resolve => setImmediate(resolve))
const flush = async () => { for (let i = 0; i < 5; i++) await tick() }

describe('capture of the hand-made albums screen', () => {
    afterEach(() => { document.body.innerHTML = ''; vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

    for (const scenario of SCENARIOS) {
        it(keyOf(scenario), async () => {
            const phone = asPhone(Boolean(scenario.phone))
            quiet()
            vi.spyOn(console, 'warn').mockImplementation(() => {})
            vi.spyOn(console, 'error').mockImplementation(() => {})
            vi.spyOn(console, 'log').mockImplementation(() => {})
            prepare(scenario)
            const app = document.createElement('div')
            app.id = 'app'
            document.body.appendChild(app)
            const controller = new SeriesController()
            const view = new SeriesView(controller)
            const params = scenario.params ?? {}
            app.appendChild(await view.render(params))
            await view.mount(params)
            await flush()

            const snaps = {}
            const at = (selector, index = 0) => document.querySelectorAll(selector)[index]
            const input = (element, value) => { element.value = value; element.dispatchEvent(new Event('input', { bubbles: true })) }
            const h = {
                dialogs, behaviour, world,
                snap: (label, selector) => { snaps[label] = normalize(selector ? document.querySelector(selector) : app) },
                note: (label) => { snaps[label] = JSON.stringify(outside.splice(0)) },
                focus: (label) => { snaps[`focus · ${label}`] = focusOf() },
                click: async (selector) => { at(selector).focus(); at(selector).click(); await flush() },
                type: async (selector, value) => { input(at(selector), value); await flush() },
                select: async (selector, value) => { const el = at(selector); el.focus(); el.value = value; el.dispatchEvent(new Event('change', { bubbles: true })); await flush() },
                turn: async (to) => { phone.turn(to); await flush() },
                arrive: async (id, state = 'found') => { world.state[id] = state; answer(); await flush() },
                change: async (work) => { work(); await flush() }
            }
            await scenario.run(h)
            captured[keyOf(scenario)] = snaps
            view.destroy()
        })
    }

    it('writes the file', () => {
        fs.writeFileSync(OUT, JSON.stringify(captured, null, 1) + '\n')
    })
})
