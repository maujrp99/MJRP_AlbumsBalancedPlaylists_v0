/**
 * F78, REQ-08: the shared core (shared/) runs on any engine — the browser, Node on the server, the
 * phone's Hermes — because it reaches for nothing of any of them. What it needs from the world it
 * asks through a port, and each side hands it its own (proposal of F78, § 4.3, § 4.7 and § 11).
 *
 * No list of exceptions: a file that breaks a line fails here.
 *
 *   1. No browser global and no engine-dependent call: `window`, `document`, `navigator`,
 *      `localStorage`, `sessionStorage`, `indexedDB`, `fetch`, `MusicKit`, `globalThis`,
 *      `import.meta`. And, outside shared/platform/ (the one place that may depend on the engine):
 *      `crypto`, `Intl`, `toLocale…`, `localeCompare`, `.normalize(`, `URLSearchParams`,
 *      `structuredClone`.
 *   2. No import leaves shared/: nothing from public/, server/, app/, test/; no Node built-in; no
 *      package of a side (firebase, react, react-native, expo…, posthog…). The core has no
 *      dependency: shared/package.json declares none.
 *   3. The rules do not know the data: no file of shared/ outside shared/data/ and
 *      shared/services/ (the use cases) imports shared/data/.
 *
 * The source is read as tokens (espree), so a word inside a comment or a text is not a use.
 * Each line has a case below that breaks it on purpose, so the sensor is seen failing.
 */
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { builtinModules } from 'node:module'
import * as espree from 'espree'

const ROOT = path.resolve(__dirname, '../..')
const SHARED = path.join(ROOT, 'shared')

function listCode(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : listCode(full)
        return /\.(m?js|cjs)$/.test(entry.name) ? [full] : []
    })
}

const GLOBALS = new Set(['window', 'document', 'navigator', 'localStorage', 'sessionStorage', 'indexedDB', 'fetch', 'MusicKit', 'globalThis'])
const ENGINE_GLOBALS = new Set(['crypto', 'Intl', 'URLSearchParams', 'structuredClone'])
const ENGINE_METHODS = /^(toLocale\w*|localeCompare|normalize)$/
const SIDE_PACKAGES = /^(firebase|react|react-native|expo|posthog)([-/@]|$)|^(expo|posthog)/
const NODE_BUILTINS = new Set(builtinModules.flatMap(m => [m, `node:${m}`]))

/** What a piece of core code reaches for: the offending uses, one text each. */
function reachesOut(code, { relative, inPlatform = relative.startsWith('platform/') }) {
    const found = []
    const tokens = espree.tokenize(code, { ecmaVersion: 'latest', sourceType: 'module' })
    tokens.forEach((token, i) => {
        const before = tokens[i - 1]
        const after = tokens[i + 1]
        const isProperty = before && before.type === 'Punctuator' && (before.value === '.' || before.value === '?.')
        if (token.type === 'Identifier' && !isProperty && GLOBALS.has(token.value)) found.push(token.value)
        if (token.type === 'Identifier' && !isProperty && !inPlatform && ENGINE_GLOBALS.has(token.value)) found.push(token.value)
        if (token.type === 'Identifier' && isProperty && !inPlatform && ENGINE_METHODS.test(token.value)) found.push(`.${token.value}`)
        if (token.type === 'Keyword' && token.value === 'import' && after && after.value === '.') found.push('import.meta')
    })
    return found
}

/** The modules a piece of core code imports (static, dynamic with a text, re-exports). */
function importsOf(code) {
    const ast = espree.parse(code, { ecmaVersion: 'latest', sourceType: 'module' })
    const specifiers = []
    const visit = (node) => {
        if (!node || typeof node.type !== 'string') return
        if ((node.type === 'ImportDeclaration' || node.type === 'ExportAllDeclaration' || node.type === 'ExportNamedDeclaration') && node.source) specifiers.push(node.source.value)
        if (node.type === 'ImportExpression' && node.source.type === 'Literal') specifiers.push(node.source.value)
        for (const key of Object.keys(node)) {
            const child = node[key]
            if (Array.isArray(child)) child.forEach(visit)
            else if (child && typeof child === 'object' && key !== 'parent') visit(child)
        }
    }
    visit(ast)
    return specifiers
}

/** Why an import leaves the core, or null. `file` is the absolute path of the importing file. */
function importLeaves(specifier, file) {
    if (NODE_BUILTINS.has(specifier)) return `Node built-in "${specifier}"`
    if (specifier.startsWith('@shared/')) return null
    if (specifier.startsWith('.') || specifier.startsWith('/')) {
        const target = path.resolve(path.dirname(file), specifier)
        return target === SHARED || target.startsWith(SHARED + path.sep) ? null : `outside shared/: "${path.relative(ROOT, target)}"`
    }
    if (specifier.startsWith('@/') || specifier.startsWith('@stores') || specifier.startsWith('@components') || specifier.startsWith('@views')) return `the site, by its alias: "${specifier}"`
    if (SIDE_PACKAGES.test(specifier)) return `a package of one side: "${specifier}"`
    return `a package: "${specifier}" (the core has no dependency)`
}

const coreFiles = () => listCode(SHARED).map(file => ({ file, relative: path.relative(SHARED, file).split(path.sep).join('/') }))

describe('the shared core stays portable (F78, REQ-08)', () => {
    it('shared/ has code to watch, including the platform port', () => {
        const relatives = coreFiles().map(f => f.relative)
        expect(relatives).toEqual(expect.arrayContaining(['platform/newId.js', 'albumIdentity.js', 'trackIdentity.js']))
    })

    it('no file of shared/ names a browser global, and outside shared/platform/ none calls what depends on the engine', () => {
        const offenders = coreFiles().flatMap(({ file, relative }) =>
            reachesOut(fs.readFileSync(file, 'utf8'), { relative }).map(use => `shared/${relative}: ${use}`))
        expect(offenders).toEqual([])
    })

    it('no import of shared/ leaves shared/: not the site, not the server, not Node, not Firebase or any package', () => {
        const offenders = coreFiles().flatMap(({ file, relative }) =>
            importsOf(fs.readFileSync(file, 'utf8')).map(s => importLeaves(s, file)).filter(Boolean).map(why => `shared/${relative}: ${why}`))
        expect(offenders).toEqual([])
    })

    it('the rules do not import shared/data/ (only the use cases of shared/services/ may)', () => {
        const DATA = path.join(SHARED, 'data')
        const offenders = coreFiles()
            .filter(({ relative }) => !relative.startsWith('data/') && !relative.startsWith('services/'))
            .flatMap(({ file, relative }) => importsOf(fs.readFileSync(file, 'utf8'))
                .filter(s => {
                    const target = s.startsWith('@shared/') ? path.join(SHARED, s.slice(8)) : path.resolve(path.dirname(file), s)
                    return s.startsWith('.') || s.startsWith('@shared/') ? target === DATA || target.startsWith(DATA + path.sep) : false
                })
                .map(s => `shared/${relative}: ${s}`))
        expect(offenders).toEqual([])
    })

    it('shared/package.json is an ES module package with no dependency', () => {
        const pkg = JSON.parse(fs.readFileSync(path.join(SHARED, 'package.json'), 'utf8'))
        expect(pkg.type).toBe('module')
        expect(pkg.private).toBe(true)
        expect(pkg.dependencies ?? {}).toEqual({})
        expect(pkg.peerDependencies ?? {}).toEqual({})
    })
})

describe('the sensor fails when a line is broken on purpose', () => {
    const at = (relative) => ({ relative })
    const fakeFile = path.join(SHARED, 'models', 'x.js')

    it('a browser global, fetch, import.meta: anywhere in shared/', () => {
        expect(reachesOut('export const w = () => window.innerWidth', at('models/x.js'))).toEqual(['window'])
        expect(reachesOut('export const f = (u) => fetch(u)', at('platform/x.js'))).toEqual(['fetch'])
        expect(reachesOut('export const u = import.meta.url', at('x.js'))).toEqual(['import.meta'])
        expect(reachesOut('const s = globalThis.localStorage', at('x.js'))).toEqual(['globalThis'])
    })

    it('crypto, Intl, toLocale…, localeCompare, .normalize(: only inside shared/platform/', () => {
        const code = "export const a = (t, u) => [crypto.randomUUID(), new Intl.Collator().compare(t, u), t.localeCompare(u), t.normalize('NFD'), (1).toLocaleString(), new URLSearchParams(t), structuredClone(u)]"
        expect(reachesOut(code, at('albumIdentity.js'))).toEqual(['crypto', 'Intl', '.localeCompare', '.normalize', '.toLocaleString', 'URLSearchParams', 'structuredClone'])
        expect(reachesOut(code, at('platform/text.js'))).toEqual([])
    })

    it('a word in a comment or in a text is not a use; a property named like a global is not one either', () => {
        expect(reachesOut("// window, crypto.randomUUID\nexport const s = 'document fetch( album_window'", at('x.js'))).toEqual([])
        expect(reachesOut('export const p = (o) => o.window + o.document', at('x.js'))).toEqual([])
    })

    it('an import of the site, the server, Node, Firebase or React leaves the core', () => {
        expect(importLeaves('../../public/js/models/Album.js', fakeFile)).toMatch(/outside shared/)
        expect(importLeaves('../../server/lib/outcome.js', fakeFile)).toMatch(/outside shared/)
        expect(importLeaves('node:fs', fakeFile)).toMatch(/Node built-in/)
        expect(importLeaves('fs', fakeFile)).toMatch(/Node built-in/)
        expect(importLeaves('firebase/firestore', fakeFile)).toMatch(/one side/)
        expect(importLeaves('react-native', fakeFile)).toMatch(/one side/)
        expect(importLeaves('expo-crypto', fakeFile)).toMatch(/one side/)
        expect(importLeaves('posthog-js', fakeFile)).toMatch(/one side/)
        expect(importLeaves('@/models/Album.js', fakeFile)).toMatch(/the site/)
        expect(importLeaves('../platform/newId.js', fakeFile)).toBeNull()
        expect(importLeaves('@shared/platform/newId.js', fakeFile)).toBeNull()
    })
})
