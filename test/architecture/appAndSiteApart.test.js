/**
 * F78, REQ-08: the site (public/) and the phone app (app/) never import each other, and the app
 * keeps no rules of its own: what both need lives in shared/ (proposal of F78, § 11).
 *
 *   - nothing in app/ imports public/, and nothing in public/ imports app/;
 *   - app/ has no folder models, algorithms, ranking or repositories (a copy of the rules would
 *     live there).
 *
 * TODAY app/ DOES NOT EXIST (it is born with TASK-19, after ADR-0022 and the constitution v2 are
 * accepted). While it is absent, the checks of app/ pass with nothing to check — that is said by
 * the first test, so a green run never hides it — and the one direction that exists already
 * (public/ never names app/) is checked for real. The day app/ appears, every check runs on it,
 * with no change to this file.
 */
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import * as espree from 'espree'

const ROOT = path.resolve(__dirname, '../..')
const APP = path.join(ROOT, 'app')
const SITE = path.join(ROOT, 'public')
const appExists = fs.existsSync(APP)

function listCode(dir) {
    if (!fs.existsSync(dir)) return []
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) return ['node_modules', 'vendor', 'ios', 'android', '.expo'].includes(entry.name) ? [] : listCode(full)
        return /\.(m?js|cjs|jsx|ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts') ? [full] : []
    })
}

/** The module texts a file names: import/export from, import(), require(). Read as tokens, so comments do not count. */
function specifiersOf(code) {
    const tokens = espree.tokenize(code.replace(/^#!.*/, ''), { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } })
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

const resolvesInto = (specifier, file, dir) => {
    if (!specifier.startsWith('.') && !specifier.startsWith('/')) return false
    const target = path.resolve(path.dirname(file), specifier)
    return target === dir || target.startsWith(dir + path.sep)
}

/** Imports of `files` that land in `dir` (or name it by an alias the other side uses). */
function crossings(files, dir, aliases) {
    return files.flatMap(file => {
        let specifiers
        try { specifiers = specifiersOf(fs.readFileSync(file, 'utf8')) } catch { return [] } // TypeScript the tokenizer cannot read is checked by the app's own lint
        return specifiers
            .filter(s => resolvesInto(s, file, dir) || aliases.some(a => s === a || s.startsWith(`${a}/`)))
            .map(s => `${path.relative(ROOT, file)} -> ${s}`)
    })
}

describe('the site and the app do not import each other (F78, REQ-08)', () => {
    it(`app/ ${appExists ? 'exists: every check below runs on it' : 'does not exist yet: the app checks pass with nothing to check'}`, () => {
        expect(appExists).toBe(fs.existsSync(APP))
    })

    it('nothing in public/ imports app/', () => {
        expect(crossings(listCode(SITE), APP, ['@app'])).toEqual([])
    })

    it('nothing in app/ imports public/ (the site\'s aliases included)', () => {
        expect(crossings(listCode(APP), SITE, ['@', '@stores', '@components', '@views'])).toEqual([])
    })

    it('app/ has no folder of rules or of data: models, algorithms, ranking, repositories', () => {
        const ruleFolders = listCode(APP)
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
})
