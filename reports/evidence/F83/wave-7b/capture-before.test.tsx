/**
 * F83 wave 7b - written once, on the hand-made Blend screen, before it was touched: it plays every scenario of test/support/blendScenarios.js on
 * views/BlendingMenuView.js (with the four pieces under it) and writes what stands in the page, and what the screen asked of the world, to
 * test/fixtures/blendBeforeF83.json.
 *
 * A RECORD, NOT A TEST THAT RUNS: it lives in reports/evidence/F83/wave-7b/ (the runner only reads test/); it ran from test/screens/blend/Blend.capture.test.tsx
 * against the tree of the parent commit of the wave (ace99a9 plus the scenarios). The paths below are those of the place it ran from.
 */
import { describe, it, afterEach, vi } from 'vitest'
import fs from 'node:fs'

vi.mock('../../../public/js/controllers/BlendingController.js', async () => (await import('../../support/blendStandIns.js')).controller())
vi.mock('../../../public/js/stores/albumSeries.js', async () => (await import('../../support/blendStandIns.js')).seriesStore())
vi.mock('../../../public/js/services/SeriesService.js', async () => (await import('../../support/blendStandIns.js')).seriesService())
vi.mock('../../../public/js/services/OptimizedAlbumLoader.js', async () => (await import('../../support/blendStandIns.js')).albumLoader())
vi.mock('../../../public/js/components/Toast.js', async () => (await import('../../support/blendStandIns.js')).toastStandIn())

import { play } from '../../support/blendHost'
import { SCENARIOS, keyOf } from '../../support/blendScenarios.js'
import { BlendingMenuView } from '../../../public/js/views/BlendingMenuView.js'

const OUT = 'test/fixtures/blendBeforeF83.json'
const captured: Record<string, Record<string, string | null>> = {}

describe('capture of the hand-made Blend screen', () => {
    afterEach(() => { document.body.innerHTML = '' })

    for (const scenario of SCENARIOS) {
        it(keyOf(scenario), async () => {
            captured[keyOf(scenario)] = await play(scenario as never, () => new BlendingMenuView() as never)
        })
    }

    it('writes the file', () => {
        fs.writeFileSync(OUT, JSON.stringify(captured, null, 1) + '\n')
    })
})
