// @vitest-environment node
/**
 * Fitness function of F83 (REQ-01, risk R16): the code is split into files only at the route factory. A screen that
 * loads late in the middle of another would not pass through the repair of a tab left on an older publication (F64): the
 * request for a file that is gone would fail with nobody to recover from it. So `import()` of a screen or of the shell,
 * and `lazy()` of React, appear only in app.js, in the factories of the routes.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { SITE_ROOT, siteFiles, loadsIn, callsIn, targetOf, folderOf } from './support/siteImports.js'

const FACTORY_FILE = 'app.js'
const LAZY_CALLS = ['lazy', 'React.lazy']
const SCREEN_HOUSES = ['screens', 'shell']

/** The late loads of a source that are not allowed where it lives: one line per finding. */
export function lateLoadsOutsideTheRoute(file, source) {
    if (file === FACTORY_FILE) return []
    const dynamicScreens = loadsIn(source, file)
        .filter(load => load.dynamic && SCREEN_HOUSES.includes(folderOf(targetOf(file, load.specifier) || '')))
        .map(load => `${file}: import('${load.specifier}') of a screen outside the route factory`)
    const lazies = callsIn(source, file).filter(name => LAZY_CALLS.includes(name)).map(name => `${file}: ${name}() outside the route factory`)
    return [...dynamicScreens, ...lazies]
}

describe('screens load late only at the route (F83)', () => {
    it('the code of today has no late load of a screen outside app.js', () => {
        const found = siteFiles().flatMap(file => lateLoadsOutsideTheRoute(file, fs.readFileSync(path.join(SITE_ROOT, file), 'utf8')))
        expect(found).toEqual([])
    })

    it('a dynamic import of a screen in the middle of another file is accused', () => {
        expect(lateLoadsOutsideTheRoute('screens/a/A.tsx', "export const open = () => import('../b/B.tsx')")).toHaveLength(1)
        expect(lateLoadsOutsideTheRoute('controllers/X.js', "export const open = () => import('../screens/b/B.tsx')")).toHaveLength(1)
        expect(lateLoadsOutsideTheRoute('views/X.js', "const go = async () => (await import('../shell/Shell.tsx')).default")).toHaveLength(1)
    })

    it('React.lazy and lazy are accused outside the route factory, and a dynamic import of something that is not a screen is not', () => {
        expect(lateLoadsOutsideTheRoute('screens/a/A.tsx', "import { lazy } from 'react'\nconst B = lazy(() => import('./B.tsx'))")).toContain("screens/a/A.tsx: lazy() outside the route factory")
        expect(lateLoadsOutsideTheRoute('screens/a/A.tsx', "const B = React.lazy(() => import('./B.tsx'))")).toContain("screens/a/A.tsx: React.lazy() outside the route factory")
        expect(lateLoadsOutsideTheRoute('services/x.js', "const m = await import('./other.js')")).toEqual([])
    })

    it('app.js is the one place: the route factories may import() screens', () => {
        expect(lateLoadsOutsideTheRoute('app.js', "router.register('/artists', async () => (await import('./screens/coming-soon/ComingSoon.tsx')).route())")).toEqual([])
    })
})
