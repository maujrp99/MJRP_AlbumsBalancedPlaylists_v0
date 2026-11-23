/**
 * F83 wave 6b - written once, on the hand-made windows (ViewAlbumModal with the value section, the ranking comparison, the table and the tabs;
 * InventoryEditModal; InventoryAddModal), before they were deleted: it opens every scenario of test/support/albumWindowScenarios.js on the old
 * windows and writes what stands over the page after each step, where the focus is, and every call made to what is outside, to
 * test/fixtures/albumWindowBeforeF83.json.
 *
 * A RECORD, NOT A TEST THAT RUNS: it lives here (the runner only reads test/); it ran from test/components/WindowCapture.test.js (the same file,
 * copied there) against the tree where the hand-made windows still existed, with `TZ=America/Sao_Paulo`.
 */
import { describe, it, afterEach, vi } from 'vitest'
import fs from 'node:fs'

vi.mock('../../public/js/services/inventory/inventoryWiring.js', async () => (await import('../support/albumWindowStandIns.js')).wiringModule)
vi.mock('../../public/js/components/Toast.js', async () => (await import('../support/albumWindowStandIns.js')).toastModule)

import { showViewAlbumModal } from '../../public/js/components/ViewAlbumModal.js'
import { InventoryEditModal } from '../../public/js/components/InventoryEditModal.js'
import { InventoryAddModal } from '../../public/js/components/InventoryAddModal.js'
import { SCENARIOS, keyOf, prepare, harness } from '../support/albumWindowScenarios.js'

const OUT = 'test/fixtures/albumWindowBeforeF83.json'
const captured = {}

describe('capture of the hand-made windows', () => {
    afterEach(() => {
        document.body.innerHTML = ''
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    for (const scenario of SCENARIOS) {
        it(keyOf(scenario), async () => {
            vi.spyOn(console, 'warn').mockImplementation(() => {})
            vi.spyOn(console, 'error').mockImplementation(() => {})
            vi.spyOn(console, 'info').mockImplementation(() => {})
            const phone = prepare(scenario)
            const open = {
                view: (input, options) => showViewAlbumModal(input, options),
                edit: async (item, onSave) => InventoryEditModal.open(item, onSave),
                add: async (album, onSuccess) => InventoryAddModal.open(album, onSuccess)
            }
            const snaps = {}
            const h = harness({ open, act: (work) => work(), phone, snaps })
            await scenario.run(h)
            captured[keyOf(scenario)] = snaps
        })
    }

    it('writes the file', () => {
        fs.writeFileSync(OUT, JSON.stringify(captured, null, 1) + '\n')
    })
})
