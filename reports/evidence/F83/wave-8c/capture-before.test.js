/**
 * F83 wave 8c - written once, on the hand-made sheet engine (components/ui/Sheet.js, drawn through ui/SheetWindow.tsx): it plays every scenario of
 * test/support/sheetScenarios.js and writes what stood in the page, the page behind and the opener's notebook to test/fixtures/sheetEngineBeforeF83.json.
 *
 * A RECORD, NOT A TEST THAT RUNS: it lives here (the runner only reads test/). It ran as test/ui/sheetCapture.test.js on the tree of 1693d71
 * (the parent of the wave), before the engine was rewritten, and was removed.
 */
import { describe, it } from 'vitest'
import fs from 'node:fs'
import { play } from '../support/engineWorld.js'
import { SHEET_SCENARIOS, sheetKeyOf } from '../support/sheetScenarios.js'
import { makeSheetEngine, withoutTheCount } from '../support/sheetWorld.js'

const captured = {}

describe('capture of the hand-made sheet engine', () => {
    for (const scenario of SHEET_SCENARIOS) {
        it(sheetKeyOf(scenario), async () => {
            captured[sheetKeyOf(scenario)] = await play(scenario, makeSheetEngine, withoutTheCount)
        })
    }

    it('writes the file', () => {
        fs.writeFileSync('test/fixtures/sheetEngineBeforeF83.json', `${JSON.stringify(captured, null, 1)}\n`)
    })
})
