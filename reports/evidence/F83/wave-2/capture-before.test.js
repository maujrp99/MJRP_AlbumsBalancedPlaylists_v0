/**
 * F83 wave 2 - written once, on the hand-made screen, before it was deleted: it draws every scenario of
 * test/support/playlistsScenarios.js with the old PlaylistsView and writes what stands in the page to
 * test/fixtures/playlistsBeforeF83.json.
 *
 * A RECORD, NOT A TEST THAT RUNS: it lives here (the runner only reads test/); it ran from test/views/PlaylistsView.capture.test.js
 * (with the paths one folder shorter) against the tree where views/PlaylistsView.js still existed (the commit before the one
 * that deleted it).
 */
import { describe, it, afterEach, vi } from 'vitest'
import fs from 'node:fs'

vi.mock('../../public/js/services/playlists/playlistsWiring.js', async () => (await import('../support/playlistsScenarios.js')).wiring())
vi.mock('../../public/js/services/DialogService.js', async () => ({ dialogService: { confirm: vi.fn(async (o) => { (await import('../support/playlistsScenarios.js')).outside.push(['confirm', o.title, o.message]); return true }) } }))
vi.mock('../../public/js/components/SpotifyExportModal.js', async () => ({ showSpotifyExportModal: () => import('../support/playlistsScenarios.js').then(m => m.outside.push(['spotifyWindow'])) }))
vi.mock('../../public/js/views/playlists/PlaylistsExport.js', async () => {
    const m = await import('../support/playlistsScenarios.js')
    return { handleExportJson: () => m.outside.push(['exportJson']), handleExportToAppleMusic: () => m.outside.push(['exportApple']) }
})

import { PlaylistsView } from '../../public/js/views/PlaylistsView.js'
import { SCENARIOS, keyOf, normalize, asPhone, quiet, fakeService, outside } from '../support/playlistsScenarios.js'

const OUT = 'test/fixtures/playlistsBeforeF83.json'
const captured = {}
const flush = () => new Promise(resolve => setTimeout(resolve, 30))

describe('capture of the hand-made playlists screen', () => {
    afterEach(() => { document.body.innerHTML = '' })

    for (const scenario of SCENARIOS) {
        it(keyOf(scenario), async () => {
            const phone = asPhone(Boolean(scenario.phone))
            quiet()
            window.history.replaceState({}, '', scenario.url)
            fakeService.batches = scenario.batches || {}
            fakeService.begin(scenario.playlists || [], { defaultName: scenario.defaultName })
            const app = document.createElement('div')
            app.id = 'app'
            document.body.appendChild(app)
            const view = new PlaylistsView()
            app.appendChild(await view.render({}))
            await view.mount({})

            const snaps = {}
            const field = (selector) => document.querySelector(selector)
            const h = {
                snap: (label, selector) => { snaps[label] = normalize(selector ? document.querySelector(selector) : app) },
                note: (label, text) => { snaps[label] = text ?? JSON.stringify(outside.splice(0)) },
                publish: async (change) => { change(); await flush() },
                click: async (selector) => { field(selector).click(); await flush() },
                clickWhere: async (selector, text) => { [...document.querySelectorAll(selector)].find(e => e.textContent.includes(text)).click(); await flush() },
                type: async (selector, value) => { field(selector).value = value; field(selector).dispatchEvent(new Event('input', { bubbles: true })); await flush() },
                typeTitle: async (selector, value) => { field(selector).textContent = value },
                focusIn: async (selector) => { field(selector).dispatchEvent(new FocusEvent('focusin', { bubbles: true })) },
                focusOut: async (selector) => { field(selector).dispatchEvent(new FocusEvent('focusout', { bubbles: true })); await flush() },
                generating: async (on) => { view.isGenerating = on; view.update(); await flush() },
                turn: async (to) => { phone.turn(to); await flush() }
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
