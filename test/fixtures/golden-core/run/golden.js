// The golden corpus on Node (F78, TASK-04 and TASK-05): read the inputs, wire the id port with
// Node's crypto.randomUUID (the same Web Crypto API the browser has), run the rules, and compare
// the text with the reference committed in ../reference/.
//
// Used by test/architecture/goldenCoreUnchanged.test.js (the suite) and scripts/golden-core.mjs
// (to write the reference after a reviewed change, and to run the same corpus on Hermes).
//
// The reference is the output of the CURRENT rules on Node. A change to a rule that changes an
// output fails the suite; when the change is meant, `node scripts/golden-core.mjs --write` writes
// the new reference, and the diff of reference/cases.tsv says which cases changed, for review.
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { runCore, goldenText } from './runCore.js'
import { installHarness } from './harness.js'
import { setIdSource } from '../../../../shared/platform/newId.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
export const GOLDEN = path.resolve(HERE, '..')
export const ROOT = path.resolve(GOLDEN, '../../..')
export const EXTRACTED = path.join(GOLDEN, 'inputs/extracted')
export const MEASURED = ['measuredAlbums.json', 'measuredAlbums2.json'].map(f => path.join(ROOT, 'test/fixtures/trackIdentity', f))
export const REFERENCE = path.join(GOLDEN, 'reference/output.jsonl.gz')
export const CASES = path.join(GOLDEN, 'reference/cases.tsv')

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))

/** The extracted inputs, in a fixed order (by file name). */
export const extractedFileNames = () => fs.readdirSync(EXTRACTED).filter(f => f.endsWith('.json')).sort()

export function readInputs() {
    const [measured1, measured2] = MEASURED.map(readJson)
    return { extractedFiles: extractedFileNames().map(f => readJson(path.join(EXTRACTED, f))), measured1, measured2 }
}

/** The golden text, on the engine running this file. */
export function runOnThisEngine() {
    const inputs = readInputs()
    const previous = setIdSource(() => crypto.randomUUID())
    const restore = installHarness()
    try {
        return goldenText(runCore(inputs))
    } finally {
        restore()
        setIdSource(previous)
    }
}

export const readReference = () => zlib.gunzipSync(fs.readFileSync(REFERENCE)).toString('utf8')

const caseLines = (text) => text.split('\n').filter(line => line.startsWith('{"id"'))
const idOf = (line) => JSON.parse(line).id

/** Which cases differ between two golden texts (by id), and which are only in one of them. */
export function compareText(reference, other) {
    const theirs = new Map(caseLines(other).map(line => [idOf(line), line]))
    const ours = new Map(caseLines(reference).map(line => [idOf(line), line]))
    return {
        identical: reference === other,
        differentCases: [...ours].filter(([id, line]) => theirs.has(id) && theirs.get(id) !== line).map(([id]) => id),
        onlyInReference: [...ours.keys()].filter(id => !theirs.has(id)),
        onlyInOther: [...theirs.keys()].filter(id => !ours.has(id)),
        cases: ours.size
    }
}

/** One line per case: its id and the first 12 hex of the sha256 of its line. The reviewable diff. */
export function caseIndex(text) {
    return caseLines(text)
        .map(line => `${idOf(line)}\t${crypto.createHash('sha256').update(line).digest('hex').slice(0, 12)}`)
        .join('\n') + '\n'
}

/** Writes the reference (gzip, no file name nor time in the header: the same bytes each time). */
export function writeReference(text) {
    fs.mkdirSync(path.dirname(REFERENCE), { recursive: true })
    fs.writeFileSync(REFERENCE, zlib.gzipSync(Buffer.from(text, 'utf8'), { level: 9 }))
    fs.writeFileSync(CASES, caseIndex(text))
}
