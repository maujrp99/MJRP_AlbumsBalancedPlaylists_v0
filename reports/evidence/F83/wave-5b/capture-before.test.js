/**
 * F83 wave 5b - written once, on the hand-made windows, before they were deleted: it opens every scenario of
 * test/support/albumWindowsScenarios.js on the old windows (SeriesEditModal with its album picker, SeriesModals.openDelete, UserRankModal
 * with its phone form) and writes what stands over the page after each step, where the focus is, and every call made to what is
 * outside, to test/fixtures/albumWindowsBeforeF83.json.
 *
 * A RECORD, NOT A TEST THAT RUNS: it lives here (the runner only reads test/); it ran from test/views/AlbumWindows.capture.test.js
 * (the same file, copied there) against the tree where the three windows still existed (the commit before the one that deleted them).
 */
import { describe, it, afterEach, vi } from 'vitest'
import fs from 'node:fs'

vi.mock('../../public/js/services/SeriesService.js', async () => (await import('../support/albumWindowsScenarios.js')).seriesServiceModule)
vi.mock('../../public/js/stores/albumSeries.js', async () => (await import('../support/albumWindowsScenarios.js')).albumSeriesStoreModule)
vi.mock('../../public/js/services/album-search/AlbumSearchService.js', async () => (await import('../support/albumWindowsScenarios.js')).searchModule)
vi.mock('../../public/js/components/Toast.js', async () => (await import('../support/albumWindowsScenarios.js')).toastModule)
vi.mock('../../public/js/services/DialogService.js', async () => (await import('../support/albumWindowsScenarios.js')).dialogModule)
vi.mock('../../public/js/repositories/userRankings.js', async () => (await import('../support/albumWindowsScenarios.js')).rankingRepositoryModule)
vi.mock('sortablejs', async () => (await import('../support/albumWindowsScenarios.js')).sortableModule)

import { SeriesEditModal } from '../../public/js/components/series/SeriesEditModal.js'
import SeriesModals from '../../public/js/components/series/SeriesModals.js'
import { UserRankModal } from '../../public/js/components/ranking/UserRankModal.js'
import { SCENARIOS, keyOf, asPhone, prepare, harness, callbacks } from '../support/albumWindowsScenarios.js'

const OUT = 'test/fixtures/albumWindowsBeforeF83.json'
const captured = {}

describe('capture of the hand-made windows of the albums screen', () => {
    const rankWindows = []
    afterEach(() => {
        rankWindows.splice(0).forEach(modal => modal.close())
        document.body.innerHTML = ''
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    for (const scenario of SCENARIOS) {
        it(keyOf(scenario), async () => {
            vi.spyOn(console, 'warn').mockImplementation(() => {})
            vi.spyOn(console, 'error').mockImplementation(() => {})
            vi.spyOn(console, 'log').mockImplementation(() => {})
            const phone = asPhone(Boolean(scenario.phone))
            prepare(scenario)
            const app = document.createElement('div')
            app.id = 'app'
            document.body.appendChild(app)
            const h = harness({
                phone,
                open: {
                    edit: (id) => { SeriesEditModal.open(id, callbacks.onUpdated) },
                    delete: (id) => new SeriesModals({ onSeriesDeleted: callbacks.onDeleted }).openDelete(id),
                    rank: (album) => {
                        const modal = new UserRankModal({ album, onSubmit: callbacks.onSubmit, onSave: callbacks.onSave, onClose: callbacks.onClose })
                        rankWindows.push(modal)
                        modal.show()
                    }
                }
            })
            await h.settle()
            await scenario.run(h)
            captured[keyOf(scenario)] = h.snaps
        })
    }

    it('writes the file', () => {
        fs.writeFileSync(OUT, JSON.stringify(captured, null, 1) + '\n')
    })
})
