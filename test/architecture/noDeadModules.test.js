/**
 * F65 (UAT-203): every module of the app, of the shared code and of the server is reachable
 * from an entry point. A module nothing loads is dead code: it is removed, not kept "in case".
 *
 * The graph is read from the source by test/architecture/support/importGraph.js (static and
 * dynamic imports, require, `?worker`, the page's <script> and <link>, CSS @import), starting at
 *   public/index.html   the site
 *   server/index.js     the server
 * and at any code file the npm scripts or the shell scripts under scripts/ come to name.
 * A test is not a user: a module only the tests import is dead.
 *
 * When this test fails on a module you have just written: import it from where it is used, or
 * do not commit it yet. KEPT_ON_PURPOSE is for a file that is in the repository for people to
 * copy or read, never for code "to be wired later"; each line says why.
 *
 * To see the graph:  node test/architecture/support/importGraph.js
 */
import { describe, it, expect } from 'vitest'
import {
    ENTRY_POINTS, allEntryPoints, graphFrom, watchedModules, watchedStylesheets, resolve, loadsOf
} from './support/importGraph.js'

/** Files under the watched folders that no entry point loads, and stay. */
const KEPT_ON_PURPOSE = {
    // The model a person copies to public/js/firebase-config.js to point the app at a Firebase project.
    'public/js/firebase-config.example.js': 'configuration template, copied by hand',
    // The hook of the React bridge (F83) that no screen has needed yet waits for the screen that does. The line goes out in the
    // commit of the screen that first uses it: this test fails the moment it stops being true. (navigation, usePhone and
    // useStore went out with the saved playlists screen, wave 1; the saved playlists screen sets no title of its own.)
    'public/js/react-bridge/useScreenTitle.ts': 'the bridge, until a screen names itself (wave 2: the playlists screen)',
    // The background download of the menu's screens (F83 wave 0). Its one user was the hand-made saved playlists screen; the
    // screens in React are not fetched in the background until the shell is React (wave 3, REQ-07: the first load downloads no
    // React), and no hand-made screen is loaded late any more. It goes back to app.js in wave 3, with the test it already has.
    'public/js/utils/prefetchScreens.js': 'the background download of the menu\'s screens, until the shell is React (wave 3)'
}

const graph = graphFrom(allEntryPoints())
const unreached = (files) => files.filter(file => !graph.reachable.has(file))

describe('nothing dead in the app, the shared code or the server', () => {
    it('the entry points exist and the graph is the size of the project', () => {
        expect(ENTRY_POINTS.filter(file => !graph.reachable.has(file))).toEqual([])
        expect(watchedModules().length).toBeGreaterThan(200)
        expect(graph.reachable.size).toBeGreaterThan(200)
    })

    it('every module under public/js, shared and server is reachable from an entry point', () => {
        expect(unreached(watchedModules()).filter(file => !(file in KEPT_ON_PURPOSE))).toEqual([])
    })

    it('every stylesheet under public/css is loaded by the page or by the app', () => {
        expect(unreached(watchedStylesheets())).toEqual([])
    })

    it('every file kept on purpose is still there and still unreached', () => {
        const watched = watchedModules()
        const stale = Object.keys(KEPT_ON_PURPOSE).filter(file => !watched.includes(file) || graph.reachable.has(file))
        expect(stale).toEqual([])
    })

    it('no reachable file imports a file that does not exist', () => {
        expect(graph.missing).toEqual([])
    })

    it('no reachable file loads a module by a name made at run time (the graph could not follow it)', () => {
        expect(graph.unresolvedDynamic).toEqual([])
    })
})

describe('the graph follows every way a file is loaded', () => {
    it('the page: <script src> and <link href>', () => {
        expect(loadsOf('public/index.html').specifiers).toEqual(expect.arrayContaining(['/js/app.js', '/js/firebase-config.js', '/css/modals.css']))
        expect(resolve('/js/app.js', 'public/index.html')).toBe('public/js/app.js')
    })

    it('a Vite alias and a worker loaded with ?worker', () => {
        expect(resolve('@shared/albumIdentity.js', 'public/js/app.js')).toBe('shared/albumIdentity.js')
        expect(resolve('../workers/search.worker.js?worker', 'public/js/services/OptimizedAlbumLoader.js')).toBe('public/js/workers/search.worker.js')
        expect(graph.reachable.has('public/js/workers/search.worker.js')).toBe(true)
        expect(graph.reachable.has('public/js/vendor/uFuzzy.js')).toBe(true)
    })

    it('a dynamic import() of the app and of the server, and require()', () => {
        expect(graph.reachable.has('public/js/screens/saved-playlists/index.ts')).toBe(true) // import() in a route of app.js
        expect(graph.reachable.has('shared/trackIdentity.js')).toBe(true) // import() from the CommonJS server
        expect(graph.reachable.has('server/routes/debug.js')).toBe(true) // require() inside an if
    })

    it('CSS @import', () => {
        expect(graph.reachable.has('public/css/neon.css')).toBe(true)
    })

    it('TypeScript and TSX (F83): a static import of .ts from .tsx and a dynamic import() of .tsx, both followed', () => {
        const entry = 'test/architecture/fixtures/typescript/Entry.tsx'
        expect(loadsOf(entry).specifiers).toEqual(['./Leaf', './Lazy'])
        expect(resolve('./Leaf', entry)).toBe('test/architecture/fixtures/typescript/Leaf.ts')
        const fromTsx = graphFrom([entry])
        expect([...fromTsx.reachable].sort()).toEqual([
            'test/architecture/fixtures/typescript/Entry.tsx',
            'test/architecture/fixtures/typescript/Lazy.tsx',
            'test/architecture/fixtures/typescript/Leaf.ts'
        ])
        expect(fromTsx.missing).toEqual([])
    })

    it('a package or a URL is not a file of the repository', () => {
        expect(resolve('firebase/firestore', 'public/js/firebase-init.js')).toBeNull()
        expect(resolve('https://fonts.googleapis.com/css2?family=Syne', 'public/index.html')).toBeNull()
    })

    it('a module is dead when no entry point leads to it: the app is unreachable from the server alone', () => {
        const fromServer = graphFrom(['server/index.js'])
        expect(fromServer.reachable.has('server/lib/outcome.js')).toBe(true)
        expect(fromServer.reachable.has('public/js/app.js')).toBe(false)
    })
})
