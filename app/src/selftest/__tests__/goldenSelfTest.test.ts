import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { EXTRACTED_FILES, compareWithIndex, matchLine, passed, readReferenceIndex, runGoldenSelfTest } from '../goldenSelfTest'
import { sha256Hex } from '../sha256'
import { unwirePlatformForTests } from '../../platform/wiring'

const GOLDEN = path.resolve(__dirname, '../../../../test/fixtures/golden-core')

afterAll(() => unwirePlatformForTests())

describe('sha256 in plain TypeScript, as Node hashes', () => {
    it.each([
        '', 'abc', 'Sigur Rós — Ágætis byrjun', '椎名林檎 · 無罪モラトリアム', 'emoji 🎸 and a lone \ud800 surrogate',
        'x'.repeat(55), 'x'.repeat(56), 'x'.repeat(64), 'y'.repeat(1000)
    ])('%#', (text) => {
        expect(sha256Hex(text)).toBe(crypto.createHash('sha256').update(text).digest('hex'))
    })
})

describe('the golden self-test of the core in the app (REQ-16)', () => {
    it('reads every extracted input the root runner reads, no more, no fewer', () => {
        const onDisk = fs.readdirSync(path.join(GOLDEN, 'inputs/extracted')).filter((f: string) => f.endsWith('.json')).sort()
        expect([...EXTRACTED_FILES]).toEqual(onDisk)
    })

    it('the bundled index is the committed reference index', () => {
        const committed = fs.readFileSync(path.join(GOLDEN, 'reference/cases.tsv'), 'utf8')
        expect(readReferenceIndex().size).toBe(committed.split('\n').filter(Boolean).length)
    })

    it('runs the corpus on this engine with the app\'s wiring and reports «N of N match»', () => {
        const result = runGoldenSelfTest()
        expect(result.different).toEqual([])
        expect(result.missing).toEqual([])
        expect(result.extra).toEqual([])
        expect(result.ids.notV4).toBe(0)
        expect(result.ids.repeated).toBe(0)
        expect(result.ids.generated).toBeGreaterThan(0) // tracks with no id: the device's generator is exercised
        expect(result.cases).toBeGreaterThan(3000)
        expect(passed(result)).toBe(true)
        expect(matchLine(result)).toBe(`${result.cases} of ${result.cases} match`)
         
        console.log(`golden self-test in Jest: ${matchLine(result)} (${result.millis} ms)`)
    })

    it('a case that differs is named, and the line says it', () => {
        const index = new Map([['a', sha256Hex('{"id":"a","output":1}').slice(0, 12)], ['b', '000000000000'], ['c', 'ffffffffffff']])
        const text = '{"id":"a","output":1}\n{"id":"b","output":2}\n{"id":"d","output":3}\n{"corpus":{},"ids":{"generated":0,"notV4":0,"repeated":0}}\n'
        const result = compareWithIndex(text, index)
        expect(result).toMatchObject({ cases: 3, matching: 1, different: ['b'], missing: ['c'], extra: ['d'] })
        expect(matchLine(result)).toBe('1 of 3 match')
        expect(passed({ ...result, millis: 0 })).toBe(false)
    })
})
