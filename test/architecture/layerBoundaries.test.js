/**
 * Fitness functions of the layers (F58):
 *
 *   UAT-18 (ADR-0017)  a store only holds state: it imports no service, repository, cache, API,
 *                      Firebase, or the file that mounts the app.
 *   UAT-19 (ADR-0016)  screen -> controller -> service -> repository: a view, a component or a
 *                      controller imports no repository and no Firebase, and nothing but the page
 *                      imports the file that mounts the app (app.js), which made import cycles.
 *
 * They read the imports of the source files. What still breaks a rule is listed below, one line
 * per import, with who should remove it. The lists can only shrink: a new offender fails the
 * test, and so does a line that is no longer true (remove it when you fix it).
 */
import { describe, it, expect } from 'vitest'
import path from 'node:path'
import { appFiles, listJs, importsOf, offenders, lineCount, read } from './support/sourceImports.js'

/**
 * Empty since the second slice of F58: the Spotify popularity "store" became a service given its
 * repository (services/spotify/StoredSpotifyPopularity.js, wired in spotifyPopularityWiring.js).
 */
const STORES_STILL_REACHING_OUT = []

/**
 * Empty since the second slice of F58: the playlists controller asks PlaylistsService for the
 * saved batch it edits (findBatch) and no longer builds a repository.
 */
const SCREEN_STILL_REACHING_THE_DATABASE = []

/**
 * Empty since the second slice of F58: the playlists service is handed the database and the login
 * where it is put together (services/playlists/playlistsWiring.js), and the four files that took
 * `db` and `auth` from app.js ask that service. app.js exports nothing.
 */
const STILL_IMPORTING_THE_MOUNTING_FILE = []

/**
 * The stores above the 150 lines ADR-0017 aimed at, with the size they have today. A listed
 * store may not grow; a store not listed may not pass 150.
 *
 * Judged one by one in the second slice of F58 (2026-11-19): the three are state, setters and
 * pure selectors, with no logic that belongs elsewhere. None is split for the sake of the number.
 */
const STORE_LINE_LIMIT = 150
const STORES_ABOVE_THE_LINE_LIMIT = {
    // State (entries, order, guests, hold, stopped) and selectors; what is derived is computed by
    // models/albumLoadState.js. A third of the file is comments that say who writes what.
    'stores/albumLoad.js': 214,
    // The shelf other screens read: state, getters and one writer. Goes when they read the load
    // store (ADR-0019, decision 3). Two dead aliases left in this slice (171 -> 162).
    'stores/albums.js': 162,
    // Thirteen fields, one setter each, getState and reset that name each field: no logic at all.
    'stores/playlists.js': 169
}

const unique = (list) => [...new Set(list)].sort()
const isMountingFile = (specifier) => /(^|\/)app\.js$/.test(specifier)

describe('a store only holds state (UAT-18, ADR-0017)', () => {
    const stores = listJs('stores')

    it('no store imports a service, a repository, the cache, the API, Firebase or the mounting file', () => {
        const reachesOut = /(\/services\/|\/repositories\/|shared\/data\/|\/cache\/|\/api\/|firebase|(^|\/)app\.js$)/

        expect(unique(offenders(stores, specifier => reachesOut.test(specifier)))).toEqual(unique(STORES_STILL_REACHING_OUT))
    })

    it('a store imports only models, or nothing', () => {
        const others = offenders(stores, specifier => !specifier.startsWith('../models/'))

        expect(unique(others)).toEqual(unique(STORES_STILL_REACHING_OUT))
    })

    it('no store passes 150 lines, and the ones already above do not grow', () => {
        const above = Object.fromEntries(stores
            .map(file => [file, lineCount(file)])
            .filter(([file, lines]) => lines > (STORES_ABOVE_THE_LINE_LIMIT[file] || STORE_LINE_LIMIT)))

        expect(above).toEqual({})
    })

    it('the list of long stores only shrinks: a store back under 150 lines leaves it', () => {
        const noLongerLong = Object.keys(STORES_ABOVE_THE_LINE_LIMIT).filter(file => lineCount(file) <= STORE_LINE_LIMIT)

        expect(noLongerLong).toEqual([])
    })
})

describe('the screen reaches the data only through services (UAT-19, ADR-0016)', () => {
    // The screens (screens/, ui/, shell/, F83; the hand-made views/ and components/ are gone) and the controllers keep one set of rules
    const screen = [...listJs('controllers'), ...listJs('screens'), ...listJs('ui'), ...listJs('shell')]

    it('the reader of imports sees .ts and .tsx (F83): the fixture imports are found, static and dynamic', () => {
        const root = path.join(process.cwd(), 'test/architecture/fixtures/typescript')
        expect(listJs('', root).sort()).toEqual(expect.arrayContaining(['Entry.tsx', 'Lazy.tsx', 'Leaf.ts']))
        expect(importsOf('Entry.tsx', root)).toEqual(['./Leaf', './Lazy'])
    })

    it('no view, component or controller imports a repository or Firebase', () => {
        const database = /(\/repositories\/|shared\/data\/|firebase)/

        expect(unique(offenders(screen, specifier => database.test(specifier)))).toEqual(unique(SCREEN_STILL_REACHING_THE_DATABASE))
    })

    it('nothing imports the file that mounts the app', () => {
        const others = appFiles().filter(file => file !== 'app.js')

        expect(unique(offenders(others, isMountingFile))).toEqual(unique(STILL_IMPORTING_THE_MOUNTING_FILE))
    })

    it('the file that mounts the app exports nothing: there is nothing to import it for', () => {
        expect(read('app.js')).not.toMatch(/^\s*export\s/m)
    })

    it('the inventory and the session are put together in one place each', () => {
        const wiring = ['services/inventory/inventoryWiring.js', 'services/auth/userSession.js']
        const others = appFiles().filter(file => !wiring.includes(file) && file !== 'app.js')

        expect(offenders(others, specifier => /InventoryRepository/.test(specifier))).toEqual([])
        expect(offenders(['services/inventory/InventoryService.js', 'services/auth/UserSessionService.js'],
            specifier => /(firebase|\/repositories\/|shared\/data\/|\/cache\/|\/stores\/|\/components\/|\/views\/)/.test(specifier))).toEqual([])
    })

    it('the playlists service is put together in one place, and only that place makes one', () => {
        const WIRING = 'services/playlists/playlistsWiring.js'
        const others = appFiles().filter(file => file !== WIRING && file !== 'services/PlaylistsService.js')

        expect(others.filter(file => /new\s+PlaylistsService\s*\(/.test(read(file)))).toEqual([])
        // the screen reaches the service through the wiring, never the class
        expect(offenders(screen, specifier => /services\/PlaylistsService(\.js)?$/.test(specifier))).toEqual([])
        // the service itself knows neither Firebase nor the login nor the screen: it is given them
        expect(offenders(['services/PlaylistsService.js'],
            specifier => /(firebase|\/cache\/|\/components\/|\/views\/|\/controllers\/|(^|\/)app\.js$)/.test(specifier))).toEqual([])
    })

    it('no view, component or controller reads who is signed in from Firebase: a service is given it', () => {
        expect(screen.filter(file => /\bauth\.currentUser\b/.test(read(file)))).toEqual([])
    })
})
