/**
 * The sensors that walk the imports (noDeadModules, layerBoundaries...) resolve an aliased import by their own table
 * (test/architecture/support/importGraph.js, ALIASES), which mirrors the aliases of the build. An alias the build knows and
 * the table does not makes a module that IS reached look dead (F82: `@mjrp/admin-kit-core`, the admin kit's core in
 * shared/admin-kit/). This holds the two together: the table, vite.config.js and vitest.config.js say the same.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import { ALIASES } from './support/importGraph.js'

/** The aliases a config declares: `'@x': path.resolve(__dirname, 'target')` -> ['@x', 'target']. */
function aliasesOf(file) {
    const source = fs.readFileSync(file, 'utf8')
    const block = source.slice(source.indexOf('alias: {'))
    const body = block.slice(0, block.indexOf('}'))
    return [...body.matchAll(/'([^']+)':\s*path\.resolve\(__dirname,\s*'([^']+)'\)/g)].map(([, alias, target]) => [alias, target]).sort()
}

describe('the aliases of the build and the table of the import sensors agree', () => {
    const table = [...ALIASES].map(([alias, target]) => [alias, target]).sort()

    it('vite.config.js and vitest.config.js declare the same aliases', () => {
        expect(aliasesOf('vite.config.js').length).toBeGreaterThan(0)
        expect(aliasesOf('vitest.config.js')).toEqual(aliasesOf('vite.config.js'))
    })

    it('every alias of the build is in the table with the same target, and the table has no alias the build lost', () => {
        expect(table).toEqual(aliasesOf('vite.config.js'))
    })

    it('tsconfig.json knows them too (the paths of the type check)', () => {
        const paths = Object.keys(JSON.parse(fs.readFileSync('tsconfig.json', 'utf8')).compilerOptions.paths).map((key) => key.replace(/\/\*$/, '')).sort()
        expect(paths).toEqual(table.map(([alias]) => alias).sort())
    })

    it('a longer alias is tried before a shorter one that starts the same way', () => {
        const names = ALIASES.map(([alias]) => alias)
        for (const [index, alias] of names.entries()) {
            expect(names.slice(0, index).filter((earlier) => alias.startsWith(`${earlier}/`)), alias).toEqual([])
        }
    })
})
