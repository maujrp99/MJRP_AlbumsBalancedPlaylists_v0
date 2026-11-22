/**
 * F83 wave 8a - written once, on the hand-made Spotify export window (components/SpotifyExportModal.js, 461 lines, the last hand-made window): it plays
 * every scenario of test/support/spotifyExportScenarios.js and writes what stands in the page to test/fixtures/spotifyExportBeforeF83.json.
 *
 * A RECORD, NOT A TEST THAT RUNS: it lives here (the runner only reads test/). It ran as test/components/SpotifyExportModal.capture.test.js (the paths
 * below are the ones of that place) on the tree of 160c702, before the window was rewritten, and was removed.
 */
import { describe, it, afterEach, beforeEach, vi } from 'vitest'
import fs from 'node:fs'

vi.mock('../../public/js/services/SpotifyExportService.js', async () => ({ SpotifyExportService: (await import('../support/spotifyExportStandIns.js')).SpotifyExportService }))
vi.mock('../../public/js/services/SpotifyAuthService.js', async () => ({ SpotifyAuthService: (await import('../support/spotifyExportStandIns.js')).SpotifyAuthService }))
vi.mock('../../public/js/components/Toast.js', async () => {
    const { toast } = await import('../support/spotifyExportStandIns.js')
    return { default: toast, toast }
})

import { showSpotifyExportModal } from '../../public/js/components/SpotifyExportModal.js'
import { playlistsStore } from '../../public/js/stores/playlists.js'
import { albumSeriesStore } from '../../public/js/stores/albumSeries.js'
import { stand, resetStands } from '../support/spotifyExportStandIns.js'
import { SCENARIOS, keyOf, snapOf } from '../support/spotifyExportScenarios.js'

const OUT = 'test/fixtures/spotifyExportBeforeF83.json'
const captured = {}
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

describe('capture of the hand-made Spotify export window', () => {
    beforeEach(() => { resetStands(); document.body.innerHTML = ''; delete window.__xss })
    afterEach(() => { document.body.innerHTML = '' })

    for (const scenario of SCENARIOS) {
        it(keyOf(scenario), async () => {
            const snaps = {}
            const h = {
                screen: ({ playlists, seriesName }) => {
                    playlistsStore.reset(); playlistsStore.setPlaylists(playlists, 'sA')
                    albumSeriesStore.reset()
                    if (seriesName) { albumSeriesStore.setSeries([{ id: 'sA', name: seriesName }]); albumSeriesStore.setActiveSeries('sA') }
                },
                open: async (given) => { showSpotifyExportModal(given) },
                click: async (selector) => { document.querySelector(selector).click() },
                clickLast: async (selector) => { [...document.querySelectorAll(selector)].pop().click() },
                backdrop: async () => { document.querySelector('.modal-backdrop')?.click() },
                key: async (key) => { document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })) },
                choose: async (mode) => { const radio = document.querySelector(`input[name="exportMode"][value="${mode}"]`); radio.checked = true; radio.dispatchEvent(new Event('change', { bubbles: true })) },
                type: async (value) => { const field = document.querySelector('#playlistNameInput'); field.focus(); field.value = value; field.dispatchEvent(new Event('input', { bubbles: true })) },
                progress: (...args) => stand.handlers.onProgress(...args),
                notFound: (item) => stand.handlers.onNotFound(item),
                finish: (report) => stand.finish(report),
                fail: (error) => stand.fail(error),
                settle: async () => { await wait(30) },
                snap: (label, selector) => { snaps[label] = snapOf(selector) },
                note: (label, value) => { snaps[label] = JSON.stringify(value) }
            }
            const quiet = vi.spyOn(console, 'error').mockImplementation(() => { })
            await scenario.run(h)
            quiet.mockRestore()
            captured[keyOf(scenario)] = snaps
        })
    }

    it('writes the file', () => {
        fs.writeFileSync(OUT, JSON.stringify(captured, null, 1) + '\n')
    })
})
