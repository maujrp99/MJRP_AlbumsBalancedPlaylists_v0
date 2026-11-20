/**
 * The golden self-test of the core in the app (F78, REQ-16): the app's own engine runs every recipe,
 * every ranking strategy, the models and the two identity rules over the golden corpus, and each
 * case is compared with the committed reference. On a device this is what proves the rules behave
 * as on the site; here it is proved in Jest and bundled by Metro (`expo export`).
 *
 * What is bundled, and why (the reference is 1.3 MB compressed, 33 MB of text):
 *   - the corpus inputs (test/fixtures/golden-core/inputs, ~0.75 MB of JSON, nine files) and the runner
 *     (test/fixtures/golden-core/run), as they are: the same files the root suite runs;
 *   - NOT the 33 MB reference, but its committed index (reference/cases.tsv, 0.2 MB): one line per
 *     case with the first 12 hex of the sha256 of the case's line, which the root suite rewrites
 *     with the reference (`node scripts/golden-core.mjs --write`). The app hashes each line it
 *     produces (./sha256.ts) and compares. A different case cannot pass except by a 48-bit
 *     collision; the summary line (counts and ids) is checked by its id report (no id that is not
 *     a v4, none repeated) rather than byte for byte.
 *
 * The rules are where they live TODAY: public/js (algorithms, ranking, models, transformers) and
 * shared/. The runner reaches them; the app does not (test/architecture/appAndSiteApart.test.js
 * allows this one entry, and only through the runner, until the rules move to shared/).
 *
 * The id port is wired by the app's own wiring (expo-crypto): the device's generator is the one
 * under test, not a stand-in.
 */
import { runCore, goldenText } from '../../../test/fixtures/golden-core/run/runCore.js'
import { installHarness } from '../../../test/fixtures/golden-core/run/harness.js'
import referenceIndex from '../../../test/fixtures/golden-core/reference/cases.tsv'
import mixins from '../../../test/fixtures/golden-core/inputs/extracted/test__algorithms__mixins.test.js.json'
import recipes from '../../../test/fixtures/golden-core/inputs/extracted/test__algorithms__recipes.promise.test.js.json'
import topn from '../../../test/fixtures/golden-core/inputs/extracted/test__algorithms__topn.test.js.json'
import userRanking from '../../../test/fixtures/golden-core/inputs/extracted/test__ranking__UserRankingStrategy.test.js.json'
import catalogIdentity from '../../../test/fixtures/golden-core/inputs/extracted/test__services__albums__catalogIdentity.test.js.json'
import albumIdentity from '../../../test/fixtures/golden-core/inputs/extracted/test__shared__albumIdentity.test.js.json'
import albumIdentityRules from '../../../test/fixtures/golden-core/inputs/extracted/test__shared__albumIdentityRules.test.js.json'
import trackIdentity from '../../../test/fixtures/golden-core/inputs/extracted/test__shared__trackIdentity.test.js.json'
import trackIdentitySecondSlice from '../../../test/fixtures/golden-core/inputs/extracted/test__shared__trackIdentitySecondSlice.test.js.json'
import measured1 from '../../../test/fixtures/trackIdentity/measuredAlbums.json'
import measured2 from '../../../test/fixtures/trackIdentity/measuredAlbums2.json'
import { wirePlatform } from '../platform/wiring'
import { sha256Hex } from './sha256'

/** The extracted inputs, in the order the root runner reads them (by file name). */
export const EXTRACTED_FILES = [
    'test__algorithms__mixins.test.js.json',
    'test__algorithms__recipes.promise.test.js.json',
    'test__algorithms__topn.test.js.json',
    'test__ranking__UserRankingStrategy.test.js.json',
    'test__services__albums__catalogIdentity.test.js.json',
    'test__shared__albumIdentity.test.js.json',
    'test__shared__albumIdentityRules.test.js.json',
    'test__shared__trackIdentity.test.js.json',
    'test__shared__trackIdentitySecondSlice.test.js.json'
] as const
const EXTRACTED = [mixins, recipes, topn, userRanking, catalogIdentity, albumIdentity, albumIdentityRules, trackIdentity, trackIdentitySecondSlice]

export interface SelfTestResult {
    /** cases in the committed reference */
    cases: number
    /** cases whose line hashes to the reference's */
    matching: number
    different: string[]
    missing: string[]
    extra: string[]
    /** the id report of the run: every id the rules made is a v4 and none repeats */
    ids: { generated: number; notV4: number; repeated: number }
    millis: number
}

/** The reference index: case id → the first 12 hex of the sha256 of its line. */
export function readReferenceIndex(text: string = referenceIndex): Map<string, string> {
    return new Map(text.split('\n').filter(Boolean).map(line => {
        const [id, hash] = line.split('\t')
        return [id!, hash!]
    }))
}

/** Compares a golden text (as runCore + goldenText make it) with the reference index. */
export function compareWithIndex(text: string, index: Map<string, string>): Omit<SelfTestResult, 'millis'> {
    const lines = text.split('\n')
    const ours = new Map<string, string>()
    for (const line of lines) {
        if (line.startsWith('{"id"')) ours.set((JSON.parse(line) as { id: string }).id, sha256Hex(line).slice(0, 12))
    }
    const head = JSON.parse(lines.filter(line => line.startsWith('{"corpus"')).pop() ?? '{}') as { ids?: { generated?: number; notV4?: number; repeated?: number } }
    const different: string[] = []
    const missing: string[] = []
    let matching = 0
    index.forEach((hash, id) => {
        if (!ours.has(id)) missing.push(id)
        else if (ours.get(id) === hash) matching++
        else different.push(id)
    })
    return {
        cases: index.size,
        matching,
        different,
        missing,
        extra: [...ours.keys()].filter(id => !index.has(id)),
        ids: { generated: head.ids?.generated ?? 0, notV4: head.ids?.notV4 ?? -1, repeated: head.ids?.repeated ?? -1 }
    }
}

/** Runs the corpus on this engine and compares. Synchronous and heavy: seconds on a phone. */
export function runGoldenSelfTest(now: () => number = () => Date.now()): SelfTestResult {
    wirePlatform()
    const started = now()
    const restore = installHarness()
    let text: string
    try {
        text = goldenText(runCore({ extractedFiles: EXTRACTED, measured1, measured2 }))
    } finally {
        restore()
    }
    return { ...compareWithIndex(text, readReferenceIndex()), millis: now() - started }
}

/** «N of N match», the line the screen shows and the Maestro flow will read (tasks.md TASK-23). */
export function matchLine(result: Pick<SelfTestResult, 'matching' | 'cases'>): string {
    return `${result.matching} of ${result.cases} match`
}

export const passed = (result: SelfTestResult) =>
    result.matching === result.cases && result.extra.length === 0 && result.ids.notV4 === 0 && result.ids.repeated === 0
