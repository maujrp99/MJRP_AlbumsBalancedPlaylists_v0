// Runs the repository's OWN unit tests of the rules (recipes, rankings, transformer and the two
// identity rules) with a recorder in between, so that the inputs those tests pass to the rules are
// written down as data (corpus/extracted/*.json) instead of retyped by hand.
//
// - The two identity modules (shared/albumIdentity.js, shared/trackIdentity.js) are swapped, for
//   the importers, by a generated wrapper that records each call of an exported function and then
//   calls the real one (the real module is loaded under `?real`).
// - The ranking strategies and recipes are wrapped on their prototypes by record-setup.js.
// Nothing of the site is changed: the swap lives only in this config.
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { defineConfig } from 'vitest/config'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../../..')
const WRAPPED = ['shared/albumIdentity.js', 'shared/trackIdentity.js'].map(f => path.join(ROOT, f))

function recordIdentityCalls() {
    return {
        name: 'record-identity-calls',
        enforce: 'pre',
        async resolveId(source, importer, options) {
            if (source.endsWith('?real') || source.endsWith('?record')) return source
            const resolved = await this.resolve(source, importer, { ...options, skipSelf: true })
            if (resolved && WRAPPED.includes(resolved.id)) return `${resolved.id}?record`
            return null
        },
        async load(id) {
            if (id.endsWith('?real')) return fs.readFileSync(id.slice(0, -'?real'.length), 'utf8')
            if (!id.endsWith('?record')) return null
            const file = id.slice(0, -'?record'.length)
            const real = await import(pathToFileURL(file).href)
            const moduleName = path.basename(file, '.js')
            const fns = Object.keys(real).filter(k => typeof real[k] === 'function')
            const recorder = JSON.stringify(path.join(HERE, 'recorder.js'))
            return [
                `export * from ${JSON.stringify(file + '?real')}`,
                `import * as real from ${JSON.stringify(file + '?real')}`,
                `import { recordCall } from ${recorder}`,
                ...fns.map(fn => `export const ${fn} = (...args) => recordCall(${JSON.stringify(moduleName + '.' + fn)}, args, () => real.${fn}(...args))`)
            ].join('\n')
        }
    }
}

export default defineConfig({
    root: ROOT,
    plugins: [recordIdentityCalls()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: [path.join(ROOT, 'test/setup.js'), path.join(HERE, 'record-setup.js')],
        include: [
            'test/algorithms/*.test.js',
            'test/ranking/*.test.js',
            'test/transformers/*.test.js',
            'test/shared/albumIdentity*.test.js',
            'test/shared/trackIdentity*.test.js',
            'test/services/albums/catalogIdentity.test.js'
        ]
    },
    resolve: {
        alias: {
            '@': path.join(ROOT, 'public/js'),
            '@stores': path.join(ROOT, 'public/js/stores'),
            '@components': path.join(ROOT, 'public/js/components'),
            '@views': path.join(ROOT, 'public/js/views'),
            '@shared': path.join(ROOT, 'shared')
        }
    }
})
