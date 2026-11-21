/**
 * F83 wave 4 - written once, on the hand-made screen, before it was deleted: it draws every scenario of
 * test/support/startScenarios.js with the old HomeView (and its controller, dock and pasted list) and writes what stands in the page,
 * and where the focus is, to test/fixtures/startBeforeF83.json.
 *
 * A RECORD, NOT A TEST THAT RUNS: it lives here (the runner only reads test/); it ran from test/views/HomeView.capture.test.js
 * (with these paths) against the tree where views/HomeView.js still existed (the commit before the one that deleted it).
 */
import { describe, it, afterEach, vi } from 'vitest'
import fs from 'node:fs'

vi.mock('../../public/js/services/album-search/AlbumSearchService.js', async () => (await import('../support/startScenarios.js')).catalogStandIn)
vi.mock('../../public/js/services/SeriesService.js', async () => (await import('../support/startScenarios.js')).seriesStandIn)
vi.mock('../../public/js/components/Toast.js', () => ({ default: { warning: vi.fn(), error: vi.fn(), success: vi.fn(), info: vi.fn() } }))

import { HomeView } from '../../public/js/views/HomeView.js'
import { userStore } from '../../public/js/stores/UserStore.js'
import { albumSeriesStore } from '../../public/js/stores/albumSeries.js'
import { SCENARIOS, keyOf, normalize, focusOf, asPhone, quiet, control, outside } from '../support/startScenarios.js'

const OUT = 'test/fixtures/startBeforeF83.json'
const captured = {}
const tick = () => new Promise(resolve => setImmediate(resolve))
const flush = async () => { for (let i = 0; i < 4; i++) await tick() }
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

describe('capture of the hand-made Start screen', () => {
    afterEach(() => { document.body.innerHTML = ''; vi.useRealTimers(); vi.restoreAllMocks() })

    for (const scenario of SCENARIOS) {
        it(keyOf(scenario), async () => {
            const phone = asPhone(Boolean(scenario.phone))
            quiet()
            vi.spyOn(console, 'warn').mockImplementation(() => {})
            vi.spyOn(console, 'error').mockImplementation(() => {})
            vi.spyOn(albumSeriesStore, 'getDb').mockReturnValue({})
            vi.spyOn(albumSeriesStore, 'getUserId').mockReturnValue('u1')
            control.reset()
            userStore.setUser(scenario.guest ? { uid: 'g', isAnonymous: true } : { uid: 'u1', isAnonymous: false })
            if (scenario.timers) vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
            const app = document.createElement('div')
            app.id = 'app'
            document.body.appendChild(app)
            const view = new HomeView()
            app.appendChild(await view.render({}))
            await view.mount({})
            await flush()

            const snaps = {}
            const at = (selector, index = 0) => document.querySelectorAll(selector)[index]
            const input = (element, value) => { element.value = value; element.dispatchEvent(new Event('input', { bubbles: true })) }
            const key = (element, name) => element.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }))
            const paste = (element, text) => {
                const event = new Event('paste', { bubbles: true, cancelable: true })
                event.clipboardData = { getData: () => text }
                element.dispatchEvent(event)
            }
            const h = {
                ...control,
                snap: (label, selector) => { snaps[label] = normalize(selector ? document.querySelector(selector) : app) },
                note: (label, text) => { snaps[label] = text ?? JSON.stringify(outside.splice(0)) },
                focus: (label) => { snaps[`focus · ${label}`] = focusOf() },
                settle: async (ms) => { if (ms) await sleep(ms); else await flush() },
                click: async (selector) => { at(selector).focus(); at(selector).click(); await flush() }, // a press moves the focus to the control, as in a browser
                type: async (selector, value) => { input(at(selector), value); await flush() },
                typeIn: async (selector, index, value) => { input(at(selector, index), value); await flush() },
                key: async (selector, name) => { key(at(selector), name); await flush() },
                keyIn: async (selector, index, name) => { key(at(selector, index), name); await flush() },
                paste: async (selector, text) => { paste(at(selector), text); await flush() },
                caret: async (selector, index, position) => { at(selector, index).setSelectionRange(position, position) },
                focusIn: async (selector) => { at(selector).focus(); await flush() },
                focusOut: async (selector) => { at(selector).blur(); await flush() },
                advance: async (ms) => { vi.advanceTimersByTime(ms); await flush() },
                turn: async (to) => { phone.turn(to); await flush() },
                signIn: () => userStore.setUser({ uid: 'u1', isAnonymous: false })
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
