/**
 * The id port (F78, REQ-07, Ref-0): the rules ask `newId()` for a new id, and each side (the site,
 * the tests, the app later) hands the port its own source once, at start. The port never reaches
 * for a global by itself: with no source wired, it says what to wire.
 */
// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { newId, setIdSource } from '@shared/platform/newId.js'

const ROOT = path.resolve(__dirname, '../../..')
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8')

describe('newId(): one id generator behind a port', () => {
    let previous = null
    afterEach(() => { setIdSource(previous) })

    it('with no source wired, it throws an error that names what to wire', () => {
        previous = setIdSource(null)
        expect(() => newId()).toThrow(/setIdSource/)
        expect(() => newId()).toThrow(/crypto\.randomUUID/)
    })

    it('gives what the wired source gives, and setIdSource hands back the source it replaced', () => {
        let n = 0
        const counting = () => `id-${++n}`
        previous = setIdSource(counting)
        expect(newId()).toBe('id-1')
        expect(newId()).toBe('id-2')
        expect(setIdSource(previous)).toBe(counting)
    })

    it('refuses a source that is not a function, and an id that is not a non-empty text', () => {
        previous = setIdSource(null)
        expect(() => setIdSource('abc')).toThrow(/function/)
        setIdSource(() => '')
        expect(() => newId()).toThrow(/non-empty text/)
        setIdSource(() => 42)
        expect(() => newId()).toThrow(/non-empty text/)
    })

    it('the port reads no global: no crypto, window, globalThis, self or navigator in its code', () => {
        const code = read('shared/platform/newId.js').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '').replace(/"[^"]*"|'[^']*'|`[^`]*`/g, "''")
        expect(code).not.toMatch(/\b(crypto|window|globalThis|self|navigator)\b/)
    })
})

describe('the two places that made ids by themselves ask the port (Ref-0)', () => {
    it.each(['public/js/models/Track.js', 'public/js/transformers/TrackTransformer.js'])('%s names no crypto and imports newId', (file) => {
        const code = read(file)
        expect(code).not.toMatch(/\bcrypto\b/)
        expect(code).toMatch(/import \{ newId \} from '@shared\/platform\/newId\.js'/)
    })

    it('outside shared/platform/, only the site wiring names crypto.randomUUID', () => {
        const offenders = []
        const walk = (dir) => {
            for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
                const rel = `${dir}/${entry.name}`
                if (entry.isDirectory()) walk(rel)
                else if (/\.m?js$/.test(entry.name) && /randomUUID/.test(read(rel))) offenders.push(rel)
            }
        }
        walk('public/js')
        walk('shared')
        expect(offenders.filter(f => !f.startsWith('shared/platform/'))).toEqual(['public/js/services/platform/platformWiring.js'])
    })
})
