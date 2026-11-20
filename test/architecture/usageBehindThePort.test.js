/**
 * Fitness functions of F77 (REQ-01, REQ-04): the measurement service is behind one port.
 *
 *   1. Only the adapter (services/usage/posthogAdapter.js) imports the measurement library; no
 *      other file of the app or of shared/ imports it, nor names its global (window.posthog).
 *   2. The adapter is loaded only by the wiring, and only lazily (import()), so a build with the
 *      switch off never downloads it.
 *   3. Outside services/usage/, a file that measures imports track.js and nothing else of it.
 *   4. The list of events (shared/usageEvents.js) is imported by the port, not by the screens:
 *      nobody goes around the port's check.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { appFiles, importsOf, offenders, read } from './support/sourceImports.js'

const USAGE = 'services/usage/'
const ADAPTER = 'services/usage/posthogAdapter.js'
const WIRING = 'services/usage/usageWiring.js'

const sharedFiles = () => fs.readdirSync(path.join(process.cwd(), 'shared'), { recursive: true })
    .filter(file => file.endsWith('.js')).map(file => path.join('shared', file))

/** The code without its comments, so a file may say «PostHog» in a comment. */
const codeOf = (source) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

describe('the measurement service is behind one port (F77)', () => {
    it('only the adapter imports the library', () => {
        const library = (specifier) => /^posthog-js(\/|$)/.test(specifier)
        expect(offenders(appFiles().filter(file => file !== ADAPTER), library)).toEqual([])
        expect(importsOf(ADAPTER).filter(library)).toEqual(['posthog-js/dist/module.no-external'])

        const sharedImports = sharedFiles().filter(file => /posthog-js/.test(fs.readFileSync(file, 'utf8')))
        expect(sharedImports).toEqual([])
    })

    it('no file outside the adapter names the global of the library', () => {
        const global = /\b(window|globalThis|self)\s*\.\s*posthog\b|\bposthog\s*\.\s*(init|capture|identify|register)\b/i
        const naming = appFiles().filter(file => file !== ADAPTER && global.test(codeOf(read(file))))
        expect(naming).toEqual([])
    })

    it('the adapter is loaded by the wiring only, and only with import()', () => {
        const toAdapter = (specifier) => /posthogAdapter(\.js)?$/.test(specifier)
        expect(offenders(appFiles().filter(file => file !== WIRING), toAdapter)).toEqual([])
        expect(read(WIRING)).toMatch(/import\(\s*'\.\/posthogAdapter\.js'\s*\)/)
        expect(read(WIRING)).not.toMatch(/^import[^\n]*posthogAdapter/m)
    })

    it('outside services/usage/, only track.js is imported from it (and the wiring, by app.js)', () => {
        const usageFile = (specifier) => /services\/usage\/|^\.\/(track|usageWiring|usageSwitch|memoryAdapter|posthogAdapter)\.js$/.test(specifier)
        const allowed = (specifier, file) => /\/track\.js$/.test(specifier) || (file === 'app.js' && /usageWiring\.js$/.test(specifier))
        const outside = appFiles().filter(file => !file.startsWith(USAGE))
        expect(offenders(outside, (specifier, file) => usageFile(specifier) && !allowed(specifier, file))).toEqual([])
    })

    it('the list of events is read by the port only', () => {
        const list = (specifier) => /usageEvents(\.js)?$/.test(specifier)
        expect(offenders(appFiles().filter(file => file !== 'services/usage/track.js'), list)).toEqual([])
    })
})
