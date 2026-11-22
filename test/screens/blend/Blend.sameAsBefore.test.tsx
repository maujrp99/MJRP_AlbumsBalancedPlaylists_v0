/**
 * F83 wave 7b (REQ-02, REQ-05; TASK-27): the Blend screen in React draws and does what the hand-made one did.
 *
 * For every scenario of test/support/blendScenarios.js (the series loading, none, a failed read, a visitor, one, many, the covers waiting and arrived,
 * a series chosen by click, Enter and Space, the address, each recipe, each ingredient, the slider, the generation in all its endings, leaving, and the
 * phone with its row, its sheet and its bar) the page after each step, the focus, and what the screen asked of the world (the read of the series, the
 * covers, the generation with its whole configuration, the toasts, the move to the playlists) equal what the hand-made screen gave at the same step.
 * Those are kept in test/fixtures/blendBeforeF83.json: written once by the hand-made screen before it was touched
 * (reports/evidence/F83/wave-7b/capture-before.test.tsx), compared element by element, attribute by attribute, with the proof's `normalize`.
 *
 * ONE difference is on purpose, and it is proven both ways: when the covers of the series arrive in the background, the hand-made screen drew the
 * list again and the focus on a card was lost (and the list went back to the top); the new screen keeps the focus (and the list where it was). It is
 * the only label that may differ, and it must differ.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'

vi.mock('../../../public/js/controllers/BlendingController.js', async () => (await import('../../support/blendStandIns.js')).controller())
vi.mock('../../../public/js/stores/albumSeries.js', async () => (await import('../../support/blendStandIns.js')).seriesStore())
vi.mock('../../../public/js/services/SeriesService.js', async () => (await import('../../support/blendStandIns.js')).seriesService())
vi.mock('../../../public/js/services/OptimizedAlbumLoader.js', async () => (await import('../../support/blendStandIns.js')).albumLoader())
vi.mock('../../../public/js/stores/toasts.js', async () => (await import('../../support/blendStandIns.js')).toastStandIn())

import { play } from '../../support/blendHost'
import { SCENARIOS, keyOf } from '../../support/blendScenarios.js'
import { blendView } from '../../../public/js/screens/blend/index'
import { registerTexts } from '../../../public/js/i18n/t.js'
import before from '../../fixtures/blendBeforeF83.json'

const captured = before as Record<string, Record<string, string | null>>

/** Where two pages first differ, in words (a failed comparison says what changed, not only that something did). */
const where = (now: string | null, was: string | null): string => {
    const a = now ?? ''
    const b = was ?? ''
    let i = 0
    while (i < a.length && a[i] === b[i]) i++
    return a === b ? '' : ` at ${i}: now «${a.slice(Math.max(0, i - 60), i + 90)}» before «${b.slice(Math.max(0, i - 60), i + 90)}»`
}

/** The one label that differs on purpose: where the focus is after the covers came in the background. */
const ON_PURPOSE = { scenario: 'computer · many series, the covers waiting and then arrived', label: 'focus after the covers came', was: 'body' }

describe('the Blend screen in React does what the hand-made one did', () => {
    afterEach(() => { document.body.innerHTML = '' })

    it('the file of the old pages is the whole list of scenarios', () => {
        expect(Object.keys(captured).sort()).toEqual(SCENARIOS.map(keyOf).sort())
    })

    for (const scenario of SCENARIOS) {
        const key = keyOf(scenario)
        it(key, async () => {
            const snaps = await play(scenario as never, () => blendView() as never)
            expect(Object.keys(snaps)).toEqual(Object.keys(captured[key]))
            for (const [label, page] of Object.entries(snaps)) {
                if (key === ON_PURPOSE.scenario && label === ON_PURPOSE.label) continue
                expect(page === captured[key][label], `${key} · ${label}${where(page, captured[key][label])}`).toBe(true)
            }
        })
    }
})

describe('the one difference on purpose, proven both ways', () => {
    afterEach(() => { document.body.innerHTML = '' })
    const scenario = SCENARIOS.find(s => keyOf(s) === ON_PURPOSE.scenario)!

    it('the hand-made screen lost the focus when the covers came: it is in the file of the old pages', () => {
        expect(captured[ON_PURPOSE.scenario][ON_PURPOSE.label]).toBe(ON_PURPOSE.was)
    })

    it('the new screen keeps the focus on the card, and the page is the same as the old one', async () => {
        const snaps = await play(scenario as never, () => blendView() as never)
        expect(snaps[ON_PURPOSE.label]).toMatch(/^div blend-series-card/)
        expect(snaps['covers arrived']).toBe(captured[ON_PURPOSE.scenario]['covers arrived'])
    })
})

describe('the proof catches a difference (it is not a rubber stamp)', () => {
    afterEach(() => { document.body.innerHTML = '' })
    const scenario = SCENARIOS.find(s => s.name === 'a series chosen by a click')!

    it('a changed word on the screen is a failed scenario', async () => {
        registerTexts('en', { 'blend.title': 'The Blending Menu!' })
        try {
            const snaps = await play(scenario as never, () => blendView() as never)
            expect(snaps.chosen).not.toBe(captured[keyOf(scenario)].chosen)
            expect(snaps.chosen).toContain('The Blending Menu!')
        } finally {
            registerTexts('en', { 'blend.title': 'The Blending Menu' })
        }
    })

    it('a changed class is a failed scenario too', () => {
        const chosen = captured[keyOf(scenario)].chosen as string
        expect(chosen.replace('blend-stepper', 'blend-stepper-changed')).not.toBe(chosen)
        expect(chosen).toContain('aria-current="step"')
    })
})
