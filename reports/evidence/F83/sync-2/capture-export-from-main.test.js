/**
 * F83 sync 2 - written once, on the tree of `main` (F90, hand-made): it plays every scenario of test/support/exportWindowScenarios.js on
 * views/playlists/PlaylistExportWindow.js and writes what stands in the page to test/fixtures/exportWindowFromMain.json.
 *
 * A RECORD, NOT A TEST THAT RUNS: it lives here (the runner only reads test/). It ran as test/views/ExportWindow.capture.test.js on a detached
 * worktree of `main` (9ff2141) with test/support/{exportStandIns,exportWindowScenarios,savedPlaylistsScenarios}.js copied in.
 */
import { describe, it, afterEach, beforeEach, vi } from 'vitest'
import fs from 'node:fs'

const state = vi.hoisted(() => ({ phone: false }))
vi.mock('../../public/js/utils/isPhone.js', () => ({ isPhone: () => state.phone, onPhoneChange: () => () => { } }))
vi.mock('../../public/js/services/MusicKitService.js', async () => ({ musicKitService: (await import('../support/exportStandIns.js')).musicKitService }))
vi.mock('../../public/js/services/AppleMusicExportService.js', async () => ({ AppleMusicExportService: (await import('../support/exportStandIns.js')).appleExportService, appleExportMessages: () => [] }))
vi.mock('../../public/js/components/SpotifyExportModal.js', async () => {
    const m = await import('../support/exportStandIns.js')
    return { showSpotifyExportModal: (arg) => m.stand.calls.push(['spotifyWindow', arg ? arg.playlists.map(item => item.name) : null, arg?.seriesName ?? null]) }
})
vi.mock('../../public/js/views/playlists/PlaylistsExport.js', async (importOriginal) => {
    const original = await importOriginal()
    const m = await import('../support/exportStandIns.js')
    return { ...original, handleExportJson: (playlists, options) => m.stand.calls.push(['json', playlists.map(item => item.name), options?.batchName ?? null]) }
})
vi.mock('../../public/js/components/Toast.js', () => {
    const toast = { info: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn() }
    return { default: toast, toast }
})

import { openPlaylistExport } from '../../public/js/views/playlists/PlaylistExportWindow.js'
import { stand, resetStands } from '../support/exportStandIns.js'
import { SCENARIOS, keyOf, snapOf, onWindow } from '../support/exportWindowScenarios.js'

const OUT = 'test/fixtures/exportWindowFromMain.json'
const captured = {}
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

describe('capture of the hand-made export window', () => {
    beforeEach(() => { resetStands(); localStorage.clear(); document.body.innerHTML = '' })
    afterEach(() => { document.body.innerHTML = '' })

    for (const scenario of SCENARIOS) {
        it(keyOf(scenario), async () => {
            state.phone = Boolean(scenario.phone)
            const snaps = {}
            const h = {
                open: async (job) => { openPlaylistExport(job) },
                click: async (selector) => { document.querySelector(selector).click() },
                pick: async (mode, value) => { [...document.querySelectorAll('input[name="apple-folder"]')].find(r => r.dataset.mode === mode && (value === undefined || r.value === value)).click() },
                type: async (value) => { const field = document.querySelector('[data-folder-name]'); field.value = value; field.dispatchEvent(new Event('input', { bubbles: true })) },
                key: async (key) => { document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })) },
                settle: async () => { await wait(30) },
                finish: () => stand.finish?.(),
                snap: (label, selector) => { snaps[label] = snapOf(selector || onWindow(state.phone)) },
                note: (label, value) => { snaps[label] = JSON.stringify(value) }
            }
            await scenario.run(h)
            captured[keyOf(scenario)] = snaps
        })
    }

    it('writes the file', () => {
        fs.writeFileSync(OUT, JSON.stringify(captured, null, 1) + '\n')
    })
})
