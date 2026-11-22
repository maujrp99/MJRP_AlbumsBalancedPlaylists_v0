/**
 * F83 wave 6a - written once, on the hand-made inventory screen (InventoryView, its renderers and its sheets), before it was deleted: it
 * opens every scenario of test/support/inventoryScenarios.js on the old screen and writes what stands in #app (and in the sheet of the
 * phone) after each step, where the focus is, and every call made to what is outside (the service, the value service, the question
 * dialog, the toast, the two hand-made windows), to test/fixtures/inventoryBeforeF83.json.
 *
 * A RECORD, NOT A TEST THAT RUNS: it lives here (the runner only reads test/); it ran from test/views/Inventory.capture.test.js (the same
 * file, copied there) against the tree where the hand-made screen still existed, with `TZ=America/Sao_Paulo`.
 */
import { describe, it, afterEach, vi } from 'vitest'
import fs from 'node:fs'

vi.mock('../../public/js/services/inventory/inventoryWiring.js', async () => (await import('../support/inventoryStandIns.js')).wiringModule)
vi.mock('../../public/js/services/inventory/inventoryValueWiring.js', async () => (await import('../support/inventoryStandIns.js')).valuesModule)
vi.mock('../../public/js/services/OptimizedAlbumLoader.js', async () => (await import('../support/inventoryStandIns.js')).loaderModule)
vi.mock('../../public/js/components/Toast.js', async () => (await import('../support/inventoryStandIns.js')).toastModule)
vi.mock('../../public/js/services/DialogService.js', async () => (await import('../support/inventoryStandIns.js')).dialogModule)
vi.mock('../../public/js/components/ViewAlbumModal.js', async () => (await import('../support/inventoryStandIns.js')).albumWindowModule)
vi.mock('../../public/js/components/InventoryEditModal.js', async () => (await import('../support/inventoryStandIns.js')).editWindowModule)

import { InventoryView } from '../../public/js/views/InventoryView.js'
import { SCENARIOS, keyOf, prepare, harness } from '../support/inventoryScenarios.js'

const OUT = 'test/fixtures/inventoryBeforeF83.json'
const captured = {}

describe('capture of the hand-made inventory screen', () => {
    afterEach(() => {
        document.body.innerHTML = ''
        document.querySelectorAll('.sheet').forEach(node => node.remove())
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    for (const scenario of SCENARIOS) {
        it(keyOf(scenario), async () => {
            vi.spyOn(console, 'warn').mockImplementation(() => {})
            vi.spyOn(console, 'error').mockImplementation(() => {})
            vi.spyOn(console, 'info').mockImplementation(() => {})
            const phone = prepare(scenario)
            let view = null
            const session = {
                controller: () => view.controller,
                async enter() {
                    const app = document.createElement('div')
                    app.id = 'app'
                    document.body.appendChild(app)
                    view = new InventoryView()
                    app.appendChild(await view.render({}))
                    await view.mount()
                },
                async leave() {
                    view.destroy()
                    document.getElementById('app')?.remove()
                }
            }
            const snaps = {}
            const h = harness({ session, act: (work) => work(), phone, snaps })
            await session.enter()
            await h.settle()
            await scenario.run(h)
            if (document.getElementById('app')) await session.leave()
            captured[keyOf(scenario)] = snaps
        })
    }

    it('writes the file', () => {
        fs.writeFileSync(OUT, JSON.stringify(captured, null, 1) + '\n')
    })
})
