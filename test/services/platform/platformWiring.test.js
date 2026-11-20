/**
 * The site hands the id port its source once, at start (F78, REQ-07): the browser's
 * crypto.randomUUID. The file that mounts the app loads the wiring before any other module of the
 * app, so no track is ever made before the port has a source.
 */
import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { newId, setIdSource } from '@shared/platform/newId.js'
import { wirePlatform } from '../../../public/js/services/platform/platformWiring.js'

const ROOT = path.resolve(__dirname, '../../..')
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('the site wires the id port with the browser crypto', () => {
    let previous = null
    afterEach(() => { setIdSource(previous) })

    it('after the wiring, newId() gives v4 UUIDs, never the same twice', () => {
        previous = setIdSource(null)
        wirePlatform(globalThis)
        const ids = Array.from({ length: 200 }, () => newId())
        expect(ids.every(id => UUID_V4.test(id))).toBe(true)
        expect(new Set(ids).size).toBe(200)
    })

    it('it calls the crypto it is handed, bound to it', () => {
        previous = setIdSource(null)
        const fake = { crypto: { calls: 0, randomUUID() { this.calls++; return 'from-the-browser' } } }
        wirePlatform(fake)
        expect(newId()).toBe('from-the-browser')
        expect(fake.crypto.calls).toBe(1)
    })

    it('a browser with no crypto.randomUUID is said at start, not at the first track', () => {
        previous = setIdSource(null)
        expect(() => wirePlatform({})).toThrow(/crypto\.randomUUID/)
    })

    it('app.js loads the wiring before every other module of the app', () => {
        const app = fs.readFileSync(path.join(ROOT, 'public/js/app.js'), 'utf8')
        const firstScript = app.split('\n').find(line => /^import .*\.js'/.test(line))
        expect(firstScript).toBe("import './services/platform/platformWiring.js' // the id port gets the browser's source before any module runs (F78)")
    })
})
