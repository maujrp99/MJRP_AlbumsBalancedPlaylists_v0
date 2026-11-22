/**
 * F83 wave 7a - written once, on the hand-made panel to generate again, before it was touched: it plays every scenario of
 * test/support/regenerateScenarios.js on the playlists screen (the panel is the hand-made one, behind react-bridge/legacy/RegeneratePanel.tsx)
 * and writes what stands in the panel, and what it handed to the controller, to test/fixtures/regenerateBeforeF83.json.
 *
 * A RECORD, NOT A TEST THAT RUNS: it lives in reports/evidence/F83/wave-7a/ (the runner only reads test/); it ran from
 * test/screens/playlists/RegeneratePanel.capture.test.tsx against the tree of the parent commit of the wave (b29b552 plus the scenarios).
 */
import { describe, it, afterEach, vi } from 'vitest'
import fs from 'node:fs'

vi.mock('../../../public/js/services/playlists/playlistsWiring.js', async () => (await import('../../support/playlistsScenarios.js')).wiring())
vi.mock('../../../public/js/services/DialogService.js', async () => ({ dialogService: { confirm: vi.fn(async () => true) } }))
vi.mock('../../../public/js/components/SpotifyExportModal.js', async () => ({ showSpotifyExportModal: () => {} }))
vi.mock('../../../public/js/views/playlists/PlaylistsExport.js', async () => ({ seriesNameOf: (given?: string) => given || 'MJRP Playlists', handleExportJson: () => {}, handleExportToAppleMusic: () => {} }))
vi.mock('../../../public/js/services/MusicKitService.js', async () => ({ musicKitService: (await import('../../support/exportStandIns.js')).musicKitService }))

import { play } from '../../support/regenerateHost'
import { SCENARIOS, keyOf } from '../../support/regenerateScenarios.js'

const OUT = 'test/fixtures/regenerateBeforeF83.json'
const captured: Record<string, Record<string, string | null>> = {}

describe('capture of the hand-made panel to generate again', () => {
    afterEach(() => { document.body.innerHTML = '' })

    for (const scenario of SCENARIOS) {
        it(keyOf(scenario), async () => {
            captured[keyOf(scenario)] = await play(scenario)
        })
    }

    it('writes the file', () => {
        fs.writeFileSync(OUT, JSON.stringify(captured, null, 1) + '\n')
    })
})
