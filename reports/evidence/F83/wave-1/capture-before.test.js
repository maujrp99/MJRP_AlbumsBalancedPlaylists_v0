/**
 * F83 wave 1 - written once, on the hand-made screen, before it was deleted: it draws every scenario of
 * test/support/savedPlaylistsScenarios.js with the old SavedPlaylistsView and writes what stands in the page to
 * test/fixtures/savedPlaylistsBeforeF83.json.
 *
 * A RECORD, NOT A TEST THAT RUNS: it lives here (vitest only runs test/), and the imports below are the ones of the file as it ran,
 * from test/views/SavedPlaylistsView.capture.test.js, against the tree where views/SavedPlaylistsView.js still existed (the parent of
 * the commit that deleted it). The controller had already moved to controllers/ then, so a two-line shim stood in the old path
 * (`export class SavedPlaylistsController extends Moved { constructor(view, deps) { super(deps) } }`), taken away after the capture.
 */
import { describe, it, afterEach, vi } from 'vitest'
import fs from 'node:fs'

vi.mock('../../public/js/services/playlists/savedPlaylistsReading.js', () => ({ savedPlaylistsReader: {}, savedPlaylistsStore: {} }))
vi.mock('../../public/js/services/DialogService.js', () => ({ dialogService: { confirm: vi.fn(() => Promise.resolve(false)) } }))

import { SavedPlaylistsView } from '../../public/js/views/SavedPlaylistsView.js'
import { SavedPlaylistsController } from '../../public/js/components/playlists/SavedPlaylistsController.js'
import { SavedPlaylistsStore } from '../../public/js/stores/savedPlaylists.js'
import { SCENARIOS, normalize, asPhone, quietTheRouter } from '../support/savedPlaylistsScenarios.js'

const OUT = 'test/fixtures/savedPlaylistsBeforeF83.json'
const captured = {}

describe('capture of the hand-made saved playlists screen', () => {
    afterEach(() => { document.body.innerHTML = '' })

    for (const scenario of SCENARIOS) {
        it(scenario.name, async () => {
            asPhone(Boolean(scenario.phone))
            quietTheRouter()
            const app = document.createElement('div')
            app.id = 'app'
            document.body.appendChild(app)
            const store = new SavedPlaylistsStore()
            const reader = { load: vi.fn(() => new Promise(() => {})), refreshSeries: vi.fn(() => Promise.resolve()), removeBatch: vi.fn(), removeAll: vi.fn() }
            const view = new SavedPlaylistsView()
            view.controller = new SavedPlaylistsController(view, { reader, store })
            app.appendChild(view.render())
            await view.mount()

            const snaps = {}
            const h = {
                app, store,
                snap: (label, selector) => { snaps[label] = normalize(selector ? document.querySelector(selector) : app) },
                publish: async (change) => { change(); store.flush() },
                click: async (selector) => { document.querySelector(selector).click() },
                type: async (selector, value) => {
                    const field = document.querySelector(selector)
                    field.value = value
                    field.dispatchEvent(new Event('input', { bubbles: true }))
                },
                change: async (selector, value) => {
                    const field = document.querySelector(selector)
                    field.value = value
                    field.dispatchEvent(new Event('change', { bubbles: true }))
                }
            }
            await scenario.run(h)
            captured[`${scenario.phone ? 'phone' : 'computer'} · ${scenario.name}`] = snaps
            view.destroy()
        })
    }

    it('writes the file', () => {
        fs.mkdirSync('test/fixtures', { recursive: true })
        fs.writeFileSync(OUT, JSON.stringify(captured, null, 1) + '\n')
    })
})
