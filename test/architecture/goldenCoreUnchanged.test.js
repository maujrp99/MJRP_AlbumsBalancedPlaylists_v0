/**
 * The golden corpus of the shared core (F78, REQ-01, REQ-16; TASK-04 and TASK-05).
 *
 * Every recipe of the registry (with the options that change the output), every ranking strategy,
 * the Album and Track models, the transformer and the two identity rules run over the corpus of
 * test/fixtures/golden-core/inputs/, and the output must be the committed reference, byte for
 * byte. A change to a rule that changes an output fails here: when the change is meant, write the
 * new reference with `node scripts/golden-core.mjs --write` and review the diff of
 * test/fixtures/golden-core/reference/cases.tsv (one line per case) in the commit.
 *
 * The app runs the same corpus on its engine (Hermes); `node scripts/golden-core.mjs --hermes` does
 * it on this Mac (it needs the engine of spike S1 and never runs in the suite).
 */
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { runOnThisEngine, readReference, compareText } from '../fixtures/golden-core/run/golden.js'

describe('the rules give the reference output of the golden corpus', () => {
    it('byte for byte, on Node, with real generated ids', () => {
        const output = runOnThisEngine()
        const reference = readReference()
        const diff = compareText(reference, output)
        const told = `${diff.differentCases.length} case(s) changed (first: ${diff.differentCases.slice(0, 5).join(', ')}). ` +
            'If the change of the rule is meant: node scripts/golden-core.mjs --write, and review the diff of reference/cases.tsv'

        expect(diff.cases).toBeGreaterThan(3000)
        expect(diff.differentCases, told).toEqual([])
        expect(diff.onlyInReference, 'cases gone from the run').toEqual([])
        expect(diff.onlyInOther, 'cases new in the run').toEqual([])
        expect(output === reference, 'the summary line differs (corpus, counts or the id report)').toBe(true)
    }, 120_000)

    it('the run makes real ids through the port: v4, never the same twice', () => {
        const head = JSON.parse(readReference().trim().split('\n').pop())
        expect(head.ids.generated).toBeGreaterThan(20_000)
        expect(head.ids).toMatchObject({ notV4: 0, repeated: 0, badStamps: 0 })
    })
})
