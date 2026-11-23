/**
 * F83 wave 8c: the sheet of the phone in React (ui/SheetWindow.tsx) draws what the hand-made motor (components/ui/Sheet.js) drew, and acts the same.
 *
 * The proof: for every scenario of test/support/sheetScenarios.js (both forms, the slide to the millisecond, the focus, Tab, Escape, the tap outside, the
 * drag down with its 80 px, the screen that stops being a phone, less motion, the page held and given back, a sheet over a sheet, the screen left with a sheet
 * open, the order of what whoever opened it is told) the page after each step, the focus, the page behind and the notebook equal what the hand-made motor gave at
 * the same step. The pictures are in test/fixtures/sheetEngineBeforeF83.json, written once by the hand-made motor (reports/evidence/F83/wave-8c/capture-before.test.js).
 *
 * KNOWN_DIFFERENCES: what changed on purpose (see the header of ui/SheetWindow.tsx). The last tests prove the check is not blind: a word, a class and a
 * delay of one millisecond, changed on purpose, are accused.
 */
import { describe, it, expect } from 'vitest'
import { play } from '../support/engineWorld.js'
import { SHEET_SCENARIOS, sheetKeyOf } from '../support/sheetScenarios.js'
import { makeSheetEngine, withoutTheCount } from '../support/sheetWorld.js'
import before from '../fixtures/sheetEngineBeforeF83.json'

const captured = before as Record<string, Record<string, string>>

/**
 * The steps where the React sheet differs from the hand-made one on purpose: scenario name → label → what the picture kept of the hand-made motor
 * becomes. Everything else in the picture is still compared to the letter.
 */
const KNOWN_DIFFERENCES: Record<string, Record<string, (kept: string) => string>> = {
    // (1) a sheet still open when its screen is left goes with the screen, at once; the hand-made one slid away, empty, over the next screen
    'the screen is left with a sheet open: the page is let go, the focus goes back, the opener is told, the sheet is gone': {
        'screen left': () => '<body style=""><div></div></body>\n[]',
        'state · screen left': (kept) => kept.replace('"focus":"div sheet__panel","sheets":["sheet sheet--bottom sheet--closing"]', '"focus":"body","sheets":[]'),
        'the log': () => '["onClose focus body"]'
    },
    // (2) a sheet that is closing keeps what was drawn in it while it slides; the hand-made one lost it when the same screen opened another
    'open, close and open again at once: the second is a sheet of its own, and what is drawn in the first goes with it': {
        'the second is up while the first slides': (kept) => kept.replace('<div class="sheet__body"></div>', '<div class="sheet__body"><p>one</p></div>').replace('["Open","First","Second","two"]', '["Open","First","one","Second","two"]')
    }
}

describe('the sheet in React draws what the hand-made sheet drew', () => {
    it('the file of the old pages is the whole list of scenarios', () => {
        expect(Object.keys(captured).sort()).toEqual(SHEET_SCENARIOS.map(sheetKeyOf).sort())
    })

    for (const scenario of SHEET_SCENARIOS) {
        const key = sheetKeyOf(scenario)
        it(key, async () => {
            const snaps = await play(scenario, makeSheetEngine, withoutTheCount)
            expect(Object.keys(snaps)).toEqual(Object.keys(captured[key]))
            for (const [label, page] of Object.entries(snaps)) {
                const becomes = KNOWN_DIFFERENCES[key]?.[label]
                expect(page, `${key} · ${label}`).toBe(becomes ? becomes(captured[key][label]) : captured[key][label])
            }
        })
    }

    describe('the check is not blind', () => {
        const first = SHEET_SCENARIOS[0]
        const run = (change: (page: string) => string) => play(first, makeSheetEngine, (page: string) => change(withoutTheCount(page)))

        it('a word changed on purpose is accused', async () => {
            const snaps = await run((page) => page.replace('Body text', 'Body tekst'))
            expect(snaps['just opened']).not.toBe(captured[sheetKeyOf(first)]['just opened'])
        })

        it('a class changed on purpose is accused', async () => {
            const snaps = await run((page) => page.replace('sheet__panel', 'sheet__panel2'))
            expect(snaps['just opened']).not.toBe(captured[sheetKeyOf(first)]['just opened'])
        })

        it('a slide one millisecond short is accused', async () => {
            const early = {
                name: first.name,
                run: async (w: Parameters<typeof first.run>[0]) => {
                    w.a.show({ variant: 'bottom', title: 'Filters', closeLabel: 'Close', render: () => w.h('p', { className: 'inner' }, 'Body text') })
                    w.a.close()
                    await w.advance(199)
                    await w.snap('200 ms after, one early')
                }
            }
            const snaps = await play(early, makeSheetEngine, withoutTheCount)
            const kept = captured[sheetKeyOf(first)]
            // the pictures kept say the sheet is still on the page 199 ms after the close and gone at 200: a sheet that left 1 ms early is accused
            expect(kept['199 ms after']).toContain('sheet--closing')
            expect(kept['200 ms after']).not.toContain('class="sheet')
            expect(snaps['200 ms after, one early']).toContain('sheet--closing')
        })
    })
})
