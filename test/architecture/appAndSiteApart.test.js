/**
 * F78, REQ-08: the site (public/), the server (server/) and the phone app (app/) never import each
 * other, and the app keeps no rules of its own: what they share lives in shared/ (proposal of F78,
 * § 4.3 and § 11).
 *
 *   - nothing in app/ imports public/ or server/, directly or by an alias of the site;
 *   - nothing in public/ or server/ imports app/;
 *   - what app/ reaches OUTSIDE app/ (the core, by its package name or the site's alias, and the
 *     golden corpus in test/fixtures) is followed, file by file: it must not land in public/ or
 *     server/ either. One allowance, named and narrow: the golden self-test
 *     (app/src/selftest/goldenSelfTest.ts) runs the rules where they live TODAY, so through the
 *     corpus runner (test/fixtures/golden-core/run/runCore.js) it reaches public/js/algorithms,
 *     ranking, models and transformers. Nothing else of the app may, and the day the runner no
 *     longer needs public/ (the rules moved to shared/), the allowance test fails and says to
 *     remove it;
 *   - app/ has no folder models, algorithms, ranking or repositories (a copy of the rules would
 *     live there);
 *   - every code file of app/ is read: a file the reader cannot read fails, it is not skipped.
 *
 * Since 2026-11-20 app/ exists (F78, the skeleton): every check runs on it.
 */
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import * as espree from 'espree'

const ROOT = path.resolve(__dirname, '../..')
const APP = path.join(ROOT, 'app')
const SITE = path.join(ROOT, 'public')
const SERVER = path.join(ROOT, 'server')
const SHARED = path.join(ROOT, 'shared')
const appExists = fs.existsSync(APP)

const SELF_TEST = path.join(APP, 'src/selftest/goldenSelfTest.ts')
const CORPUS_RUNNER = path.join(ROOT, 'test/fixtures/golden-core/run/runCore.js')
const RULE_FOLDERS = ['algorithms', 'ranking', 'models', 'transformers'].map(f => path.join(SITE, 'js', f))

const SKIPPED_DIRS = ['node_modules', 'vendor', 'ios', 'android', '.expo', 'dist', '_shared_temp']

function listCode(dir) {
    if (!fs.existsSync(dir)) return []
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) return SKIPPED_DIRS.includes(entry.name) ? [] : listCode(full)
        return /\.(m?js|cjs|jsx|ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts') ? [full] : []
    })
}

/**
 * The module texts a file names: import/export from, import(), require(). Read as tokens, so comments
 * do not count. A `.ts` file is read without JSX (a generic arrow `<T,>(v: T) => v` would read as a tag).
 */
function specifiersOf(code, { jsx = true } = {}) {
    const tokens = espree.tokenize(code.replace(/^#!.*/, ''), { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx } })
    const out = []
    tokens.forEach((token, i) => {
        const next = tokens[i + 1]
        const isText = (t) => t && t.type === 'String'
        if (token.type === 'Identifier' && token.value === 'from' && isText(next)) out.push(next.value.slice(1, -1))
        if (token.type === 'Keyword' && token.value === 'import' && isText(next)) out.push(next.value.slice(1, -1))
        if ((token.value === 'import' || token.value === 'require') && next?.value === '(' && isText(tokens[i + 2])) out.push(tokens[i + 2].value.slice(1, -1))
    })
    return out
}

/** Every file's specifiers; a file the tokenizer cannot read is reported, never skipped. */
function readAll(files) {
    const unreadable = []
    const byFile = new Map()
    files.forEach(file => {
        try { byFile.set(file, specifiersOf(fs.readFileSync(file, 'utf8'), { jsx: !file.endsWith('.ts') })) } catch (error) { unreadable.push(`${path.relative(ROOT, file)}: ${error.message}`) }
    })
    return { byFile, unreadable }
}

const inside = (target, dir) => target === dir || target.startsWith(dir + path.sep)

const resolvesInto = (specifier, file, dir) => {
    if (!specifier.startsWith('.') && !specifier.startsWith('/')) return false
    return inside(path.resolve(path.dirname(file), specifier), dir)
}

/** Imports of `files` that land in `dir` (or name it by an alias the other side uses). */
function crossings(byFile, dir, aliases) {
    return [...byFile].flatMap(([file, specifiers]) => specifiers
        .filter(s => resolvesInto(s, file, dir) || aliases.some(a => s === a || s.startsWith(`${a}/`)))
        .map(s => `${path.relative(ROOT, file)} -> ${s}`))
}

/** The file a specifier of the app's world lands on, outside node_modules; null for a package. */
function resolveFile(specifier, from) {
    let base = null
    if (specifier.startsWith('.')) base = path.resolve(path.dirname(from), specifier)
    else if (specifier.startsWith('@album-blender/shared/')) base = path.join(SHARED, specifier.slice('@album-blender/shared/'.length))
    else if (specifier.startsWith('@shared/')) base = path.join(SHARED, specifier.slice('@shared/'.length))
    if (!base) return null
    const candidates = [base, ...['.ts', '.tsx', '.js', '.mjs'].map(ext => base + ext), path.join(base, 'index.ts'), path.join(base, 'index.js')]
    return candidates.find(c => fs.existsSync(c) && fs.statSync(c).isFile()) ?? null
}

/**
 * Follows the app's imports out of app/: returns each step that lands in public/ or server/,
 * as `{ entry, via, target }` (entry: the app file the chain started from).
 */
function landingsOutsideTheCore(appFiles) {
    const landings = []
    for (const entry of appFiles) {
        const seen = new Set()
        const queue = [entry]
        while (queue.length > 0) {
            const file = queue.shift()
            if (seen.has(file)) continue
            seen.add(file)
            if (!/\.(m?js|cjs|jsx|ts|tsx)$/.test(file)) continue
            let specifiers
            try { specifiers = specifiersOf(fs.readFileSync(file, 'utf8'), { jsx: !file.endsWith('.ts') }) } catch { continue } // app files are checked readable above; JSON and text are data
            for (const specifier of specifiers) {
                const target = resolveFile(specifier, file)
                if (!target) continue
                if (inside(target, SITE) || inside(target, SERVER)) {
                    landings.push({ entry, via: file, target })
                    continue // the site's own files are not followed: the corpus runner proved them engine-neutral (spike S1)
                }
                if (!inside(target, APP)) queue.push(target) // the app's own files are entries themselves
            }
        }
    }
    return landings
}

const appFiles = listCode(APP)
const app = readAll(appFiles)

describe('the site, the server and the app do not import each other (F78, REQ-08)', () => {
    it(`app/ ${appExists ? 'exists: every check below runs on it' : 'does not exist yet: the app checks pass with nothing to check'}`, () => {
        expect(appExists).toBe(fs.existsSync(APP))
        if (appExists) expect(appFiles.length).toBeGreaterThan(0)
    })

    it('every code file of app/ is read (none is skipped)', () => {
        expect(app.unreadable).toEqual([])
    })

    it('nothing in public/ or server/ imports app/', () => {
        expect(crossings(readAll(listCode(SITE)).byFile, APP, ['@app'])).toEqual([])
        expect(crossings(readAll(listCode(SERVER)).byFile, APP, ['@app'])).toEqual([])
    })

    it('nothing in app/ imports public/ or server/ (the site\'s aliases included)', () => {
        expect(crossings(app.byFile, SITE, ['@', '@stores', '@components', '@views'])).toEqual([])
        expect(crossings(app.byFile, SERVER, [])).toEqual([])
    })

    it('what app/ reaches outside app/ lands in public/ only by the golden self-test, through the corpus runner, in the rule folders', () => {
        const landings = landingsOutsideTheCore(appFiles)
        const allowed = (l) => l.entry === SELF_TEST && l.via === CORPUS_RUNNER && RULE_FOLDERS.some(dir => inside(l.target, dir))
        expect(landings.filter(l => !allowed(l)).map(l => `${path.relative(ROOT, l.entry)} … ${path.relative(ROOT, l.via)} -> ${path.relative(ROOT, l.target)}`)).toEqual([])
        if (appExists) {
            // the allowance is in use; when it is not (the rules moved to shared/), remove it from this file
            expect(landings.some(allowed)).toBe(true)
        }
    })

    it('app/ has no folder of rules or of data: models, algorithms, ranking, repositories', () => {
        const ruleFolders = appFiles
            .map(file => path.relative(APP, path.dirname(file)).split(path.sep))
            .filter(parts => parts.some(part => ['models', 'algorithms', 'ranking', 'repositories'].includes(part)))
            .map(parts => `app/${parts.join('/')}`)
        expect([...new Set(ruleFolders)]).toEqual([])
    })
})

describe('the sensor fails when a line is broken on purpose', () => {
    it('reads an import of the other side, relative or by alias', () => {
        const file = path.join(APP, 'src', 'screens', 'Series.js')
        const code = "import { Album } from '../../../public/js/models/Album.js'\nimport x from '@/stores/albums.js'\nconst y = require('../../../public/js/utils/a.js')\n// import z from '../../../public/js/b.js'"
        const specifiers = specifiersOf(code)
        expect(specifiers).toEqual(['../../../public/js/models/Album.js', '@/stores/albums.js', '../../../public/js/utils/a.js'])
        expect(specifiers.filter(s => resolvesInto(s, file, SITE))).toHaveLength(2)
        expect(resolvesInto('../../shared/platform/newId.js', file, SITE)).toBe(false)
    })

    it('reads TypeScript: types, generics and `import type`', () => {
        const code = "import type { A } from '../x'\nconst f = <T,>(v: T): T => v\nexport const s: Map<string, number> = new Map()\nimport b from '../../../server/index.js'"
        expect(specifiersOf(code, { jsx: false })).toEqual(['../x', '../../../server/index.js'])
        expect(() => specifiersOf(code, { jsx: true })).toThrow() // read as .tsx it fails, and «every file is read» says so
    })

    it('follows a chain out of app/: an app file that reaches public/ through shared/ is caught', () => {
        const dir = fs.mkdtempSync(path.join(SHARED, '.sensor-'))
        const planted = path.join(dir, 'bridge.js')
        const appFile = path.join(APP, 'src', '.sensor-entry.ts')
        try {
            fs.writeFileSync(planted, "export { Album } from '../../public/js/models/Album.js'\n")
            fs.writeFileSync(appFile, `import { Album } from '@album-blender/shared/${path.basename(dir)}/bridge.js'\n`)
            const landings = landingsOutsideTheCore([appFile])
            expect(landings.map(l => path.relative(ROOT, l.target))).toEqual(['public/js/models/Album.js'])
        } finally {
            fs.rmSync(dir, { recursive: true, force: true })
            fs.rmSync(appFile, { force: true })
        }
    })
})
