/**
 * F83 wave 5b (REQ-02, REQ-05; TASK-23b, TASK-30): the windows of the albums screen in React do what the hand-made ones did.
 *
 * The proof: for every scenario of test/support/albumWindowsScenarios.js (the window to edit a series with its album picker: the scan, the
 * results, the filters, a pick, a repeat, a removal, the albums moving on the phone, the save, its failure and its refusals, Cancel, Escape
 * and a click outside, a late answer; the question to delete a series; the window to rank the tracks: the order of the record and the saved
 * order, a drag, Reset, the save, a refused save, Back and Escape with and without a change, the phone window, its buttons, the sheet
 * of «Move to…», Undo, turning the phone) what stands over the page after each step equals what the old window drew at the same step, the
 * focus is where the old window left it, and every call made to what is outside is the same call: the same payload written to the
 * series service, the same ranking handed to `onSubmit` and to `onSave` at the same moments, the same catalog and drag-library calls, the
 * same notices. The old pages and calls are kept in test/fixtures/albumWindowsBeforeF83.json: written once by the hand-made windows
 * before they were deleted (reports/evidence/F83/wave-5b/capture-before.test.js).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'

vi.mock('../../../public/js/services/SeriesService.js', async () => (await import('../../support/albumWindowsScenarios.js')).seriesServiceModule)
vi.mock('../../../public/js/stores/albumSeries.js', async () => (await import('../../support/albumWindowsScenarios.js')).albumSeriesStoreModule)
vi.mock('../../../public/js/services/album-search/AlbumSearchService.js', async () => (await import('../../support/albumWindowsScenarios.js')).searchModule)
vi.mock('../../../public/js/stores/toasts.js', async () => (await import('../../support/albumWindowsScenarios.js')).toastModule)
vi.mock('../../../public/js/ui/dialogs/dialogs', async () => (await import('../../support/albumWindowsScenarios.js')).dialogModule)
vi.mock('../../../public/js/repositories/userRankings.js', async () => (await import('../../support/albumWindowsScenarios.js')).rankingRepositoryModule)
vi.mock('sortablejs', async () => (await import('../../support/albumWindowsScenarios.js')).sortableModule)

import { StrictMode, act, type MutableRefObject } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { useAlbumWindows, type AlbumWindows } from '../../../public/js/screens/albums/useAlbumWindows'
import type { RankAlbum } from '../../../public/js/screens/albums/rankSession'
import { SCENARIOS, keyOf, asPhone, prepare, harness, callbacks } from '../../support/albumWindowsScenarios.js'
import before from '../../fixtures/albumWindowsBeforeF83.json'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const captured = before as Record<string, Record<string, string | null>>

type Scenario = (typeof SCENARIOS)[number]

/** What the albums screen is to the windows: it holds them and draws their layer. */
function Host({ api }: { api: MutableRefObject<AlbumWindows | null> }) {
    const windows = useAlbumWindows({ onSeriesUpdated: callbacks.onUpdated, onSeriesDeleted: callbacks.onDeleted })
    api.current = windows
    return <>{windows.layer}</>
}

/**
 * The strict mode of React runs the effect that makes a list's drag library twice (made, let go, made again) while it is developed: a pair
 * the production build does not make. Played in the strict mode, the notes are compared without it.
 */
const isMade = (entry: unknown[] | undefined, list: unknown): boolean => entry?.[0] === 'sortable' && entry[1] === list
const sameNote = (text: string | null): string | null => {
    if (!text?.startsWith('[[')) return text
    const asked = JSON.parse(text) as unknown[][]
    // made, let go, made again with the same options: the pair the strict mode adds (the first made and the let go are dropped; the made again stays)
    const strictPair = (i: number): boolean => isMade(asked[i], asked[i][1]) && asked[i + 1]?.[0] === 'sortable.destroy' && isMade(asked[i + 2], asked[i][1]) && asked[i + 2][2] === asked[i][2]
    const dropped = new Set<number>()
    asked.forEach((_, i) => { if (strictPair(i)) { dropped.add(i); dropped.add(i + 1) } })
    return JSON.stringify(asked.filter((_, i) => !dropped.has(i)))
}

/** Plays a scenario on the new windows and gives what it wrote down. With `strict`, the way the screen is developed (the strict mode). */
export async function play(scenario: Scenario, strict = false): Promise<Record<string, string | null>> {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const phone = asPhone(Boolean((scenario as { phone?: boolean }).phone))
    prepare(scenario)
    const app = document.createElement('div')
    app.id = 'app'
    document.body.appendChild(app)
    const api: MutableRefObject<AlbumWindows | null> = { current: null }
    const root: Root = createRoot(app)
    await act(async () => { root.render(strict ? <StrictMode><Host api={api} /></StrictMode> : <Host api={api} />) })
    const h = harness({
        act: (work: () => Promise<void>) => act(work),
        phone,
        open: {
            edit: (id: string) => { api.current!.openEdit(id) },
            delete: (id: string) => api.current!.openDelete(id),
            rank: (album: RankAlbum) => { api.current!.openRank({ album, onSubmit: callbacks.onSubmit, onSave: callbacks.onSave, onClose: callbacks.onClose }) }
        }
    })
    await h.settle()
    await (scenario as { run: (h: unknown) => Promise<void> }).run(h)
    await act(async () => { root.unmount() })
    return h.snaps as Record<string, string | null>
}

describe('the windows of the albums screen in React do what the hand-made ones did', () => {
    afterEach(() => { document.body.innerHTML = ''; vi.useRealTimers(); vi.restoreAllMocks() })

    it('the file of the old pages is the whole list of scenarios', () => {
        expect(Object.keys(captured).sort()).toEqual(SCENARIOS.map(keyOf).sort())
    })

    for (const scenario of SCENARIOS.filter(s => !process.env.F83_ONLY || s.name === process.env.F83_ONLY)) {
        const key = keyOf(scenario)
        it(key, async () => {
            const snaps = await play(scenario)
            if (process.env.F83_DUMP) (await import('node:fs')).writeFileSync(`${process.env.F83_DUMP}/${key.replace(/\W+/g, '_')}.json`, JSON.stringify(snaps))
            expect(Object.keys(snaps)).toEqual(Object.keys(captured[key]))
            for (const [label, page] of Object.entries(snaps)) {
                expect(page, `${key} · ${label}`).toBe(captured[key][label])
            }
        })
    }
})

describe('the windows in the strict mode of React do the same (the notes without the pair the strict mode adds to the drag library)', () => {
    afterEach(() => { document.body.innerHTML = ''; vi.useRealTimers(); vi.restoreAllMocks() })

    for (const scenario of SCENARIOS) {
        const key = keyOf(scenario)
        it(key, async () => {
            const snaps = await play(scenario, true)
            expect(Object.keys(snaps)).toEqual(Object.keys(captured[key]))
            for (const [label, page] of Object.entries(snaps)) {
                expect(sameNote(page), `${key} · ${label}`).toBe(sameNote(captured[key][label]))
            }
        })
    }
})

describe('the proof catches a difference', () => {
    afterEach(() => { document.body.innerHTML = ''; vi.useRealTimers(); vi.restoreAllMocks() })

    it('a changed word in the window is a failed scenario (the test is not a rubber stamp)', async () => {
        const { registerTexts } = await import('../../../public/js/i18n/t.js')
        const scenario = SCENARIOS.find(s => s.name === 'edit: opens with the series')!
        registerTexts('en', { 'albums.edit.save': 'Store Changes' })
        try {
            const snaps = await play(scenario)
            expect(snaps['the window']).not.toBe(captured[keyOf(scenario)]['the window'])
            expect(snaps['the window']).toContain('Store Changes')
        } finally {
            registerTexts('en', { 'albums.edit.save': 'Save Changes' })
        }
    })

    it('a changed class in the window is a failed scenario too', async () => {
        const scenario = SCENARIOS.find(s => s.name === 'rank: opens in the order of the record')!
        const snaps = await play(scenario)
        expect(snaps['the window']!.replace('rank-window', 'rank-window-changed')).not.toBe(captured[keyOf(scenario)]['the window'])
    })

    it('a changed call (a rank off by one) is a failed scenario too', async () => {
        const scenario = SCENARIOS.find(s => s.name === 'rank: save')!
        const snaps = await play(scenario)
        expect(snaps['what was asked at once']).toBe(captured[keyOf(scenario)]['what was asked at once'])
        expect(snaps['what was asked at once']!.replace('\\"userRank\\":1', '\\"userRank\\":0')).not.toBe(captured[keyOf(scenario)]['what was asked at once'])
    })

    it('a focus left on the wrong control is a failed scenario too', async () => {
        const scenario = SCENARIOS.find(s => s.name === 'edit: save, with a pick and a new name')!
        const snaps = await play(scenario)
        expect(snaps['focus · on the Save button']).toBe(captured[keyOf(scenario)]['focus · on the Save button'])
        expect('button.btn.btn-ghost[action=close-modal]').not.toBe(captured[keyOf(scenario)]['focus · on the Save button'])
    })
})
