// Node only: the site's modules import `@shared/…` (an alias of Vite and Vitest). For the
// unbundled reference run, map it to the repository's shared/ folder, as Vite does.
// With S1_PATCHES=1, the spike's small rewrites (src/patches.js) are applied as files are read.
import { registerHooks } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { applyPatches, PATCHES } from './patches.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const SHARED = path.join(ROOT, 'shared')
const PATCHED = new Set(PATCHES.map(p => path.join(ROOT, p.file)))

registerHooks({
    resolve(specifier, context, nextResolve) {
        if (specifier.startsWith('@shared/')) {
            return nextResolve(pathToFileURL(path.join(SHARED, specifier.slice('@shared/'.length))).href, context)
        }
        return nextResolve(specifier, context)
    },
    load(url, context, nextLoad) {
        if (process.env.S1_PATCHES === '1' && url.startsWith('file:')) {
            const file = fileURLToPath(url)
            if (PATCHED.has(file)) {
                const source = applyPatches(path.relative(ROOT, file), fs.readFileSync(file, 'utf8'))
                return { format: 'module', source, shortCircuit: true }
            }
        }
        return nextLoad(url, context)
    }
})
