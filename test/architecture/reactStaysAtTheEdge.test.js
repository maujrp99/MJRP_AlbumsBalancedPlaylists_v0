// @vitest-environment node
/**
 * Fitness function of F83 (REQ-04, risk R3): React stays at the edge. The dependency rule of the site does not change
 * (screen -> controller -> service -> repository); React is a way to draw a screen, so nothing below the screen may know it.
 *
 *   1. only screens/, ui/, shell/ and react-bridge/ import `react`, `react-dom` or the Vite plugin;
 *   2. ui/ (the pieces of the design system) imports no store, service, controller, repository, API or cache: a piece draws
 *      what it is given;
 *   3. only app.js (the route factories and the mounting of the shell) imports screens/ and shell/;
 *   4. the casts `as unknown as` of the site's TypeScript live in react-bridge/, in a list that only shrinks (the lint
 *      refuses them in screens/, ui/ and shell/).
 *
 * What it does not prove: that a screen reads the data through its controller or service (layerBoundaries and
 * screensLoadThroughTheService hold that, now over the React folders too).
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { SITE_ROOT, siteFiles, importsOfFiles, folderOf, doubleCastsIn } from './support/siteImports.js'

const REACT_HOUSES = ['screens', 'ui', 'shell', 'react-bridge']
const REACT_PACKAGE = /^(react|react-dom|@vitejs\/plugin-react)(\/|$)/
const BELOW_A_PIECE = ['stores', 'services', 'controllers', 'repositories', 'api', 'cache']
const ONLY_THE_MOUNTING_FILE_IMPORTS = ['screens', 'shell']
const MOUNTING_FILE = 'app.js'

/**
 * Casts through `unknown` in react-bridge/, with how many each file has. A new one needs the reason; it can only shrink.
 * Empty at the start of wave 0.
 */
export const CASTS_IN_THE_BRIDGE = {}

/** What breaks the four rules, given the imports of the site: one line per finding. */
export function breaches(imports) {
    const out = []
    for (const { file, specifier, target } of imports) {
        const home = folderOf(file)
        if (REACT_PACKAGE.test(specifier) && !REACT_HOUSES.includes(home)) out.push(`${file} imports ${specifier}: React is for ${REACT_HOUSES.join(', ')} only`)
        if (home === 'ui' && target && BELOW_A_PIECE.includes(folderOf(target))) out.push(`${file} imports ${target}: a piece of ui/ draws what it is given`)
        const targetHome = target ? folderOf(target) : ''
        if (ONLY_THE_MOUNTING_FILE_IMPORTS.includes(targetHome) && file !== MOUNTING_FILE && home !== targetHome) {
            out.push(`${file} imports ${target}: only ${MOUNTING_FILE} imports ${targetHome}/`)
        }
    }
    return out
}

/** The files with more casts than their entry in the list allows. */
export function castBreaches(counts, allowed = CASTS_IN_THE_BRIDGE) {
    return Object.entries(counts)
        .filter(([file, count]) => count > (allowed[file] || 0))
        .map(([file, count]) => `${file}: ${count} casts through unknown, ${allowed[file] || 0} allowed`)
}

const castsOfTheSite = () => Object.fromEntries(siteFiles().filter(file => /\.(ts|tsx)$/.test(file))
    .map(file => [file, doubleCastsIn(fs.readFileSync(path.join(SITE_ROOT, file), 'utf8'), file)]).filter(([, count]) => count > 0))

describe('React stays at the edge (F83)', () => {
    const imports = importsOfFiles(siteFiles())

    it('the code of today breaks no rule of the edge', () => {
        expect(breaches(imports)).toEqual([])
    })

    it('a file of services/ that imports react is accused', () => {
        expect(breaches([{ file: 'services/Thing.js', specifier: 'react', target: null }])).toHaveLength(1)
        expect(breaches([{ file: 'stores/x.js', specifier: 'react-dom/client', target: null }])).toHaveLength(1)
        expect(breaches([{ file: 'screens/a/A.tsx', specifier: 'react', target: null }])).toEqual([])
        expect(breaches([{ file: 'react-bridge/ReactView.tsx', specifier: 'react-dom/client', target: null }])).toEqual([])
    })

    it('a piece of ui/ that imports a store, a service or a controller is accused', () => {
        expect(breaches([{ file: 'ui/Card.tsx', specifier: '../stores/albums.js', target: 'stores/albums.js' }])).toHaveLength(1)
        expect(breaches([{ file: 'ui/Card.tsx', specifier: '@/services/x.js', target: 'services/x.js' }])).toHaveLength(1)
        expect(breaches([{ file: 'ui/Card.tsx', specifier: '../utils/iconShapes.js', target: 'utils/iconShapes.js' }])).toEqual([])
    })

    it('a file that is not app.js and imports a screen or the shell is accused; a screen importing its own folder is not', () => {
        expect(breaches([{ file: 'controllers/X.js', specifier: '../screens/a/A.tsx', target: 'screens/a/A.tsx' }])).toHaveLength(1)
        expect(breaches([{ file: 'router.js', specifier: './shell/Shell.tsx', target: 'shell/Shell.tsx' }])).toHaveLength(1)
        expect(breaches([{ file: 'app.js', specifier: './screens/a/A.tsx', target: 'screens/a/A.tsx' }])).toEqual([])
        expect(breaches([{ file: 'screens/a/A.tsx', specifier: '../b/B.tsx', target: 'screens/b/B.tsx' }])).toEqual([])
    })

    it('the casts through unknown are only in react-bridge/, within a list that only shrinks', () => {
        const counts = castsOfTheSite()
        expect(castBreaches(counts)).toEqual([])
        expect(Object.keys(counts).filter(file => folderOf(file) !== 'react-bridge')).toEqual([])
        expect(castBreaches({ 'react-bridge/useStore.ts': 1 })).toHaveLength(1)
        expect(castBreaches({ 'react-bridge/useStore.ts': 1 }, { 'react-bridge/useStore.ts': 1 })).toEqual([])
    })
})
