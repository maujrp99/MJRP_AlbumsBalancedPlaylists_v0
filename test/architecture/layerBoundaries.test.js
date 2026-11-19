/**
 * Fitness functions of the layers (F58):
 *
 *   UAT-18 (ADR-0017)  a store only holds state: it imports no service, repository, cache, API,
 *                      Firebase, or the file that mounts the app.
 *   UAT-19 (ADR-0016)  screen -> controller -> service -> repository: a view, a component or a
 *                      controller imports no repository and no Firebase, and nothing but the page
 *                      imports the file that mounts the app (app.js), which made import cycles.
 *
 * They read the imports of the source files. What still breaks a rule today is listed below, one
 * line per import, with who should remove it. The lists can only shrink: a new offender fails
 * the test, and so does a line that is no longer true (remove it when you fix it).
 */
import { describe, it, expect } from 'vitest'
import { appFiles, listJs, offenders, lineCount } from './support/sourceImports.js'

/** Everything left is in the blend and playlists code, held by the branch of F62 while F58 ran. */
const STORES_STILL_REACHING_OUT = [
    // The Spotify popularity "store" is a reader of Firestore with a cache: it becomes a service
    // beside SpotifyEnrichmentService (Spotify services: F62, then F69 for the popularity itself).
    'stores/SpotifyEnrichmentStore.js -> ../firebase-init.js',
    'stores/SpotifyEnrichmentStore.js -> ../repositories/SpotifyEnrichmentRepository.js',
    'stores/SpotifyEnrichmentStore.js -> ../cache/CacheManager.js'
]

const SCREEN_STILL_REACHING_THE_DATABASE = [
    // The playlists controller builds its own repository: it should ask PlaylistsService (F62).
    'controllers/PlaylistsController.js -> ../repositories/PlaylistRepository.js'
]

const STILL_IMPORTING_THE_MOUNTING_FILE = [
    // All of them take `db` (and the cache) from app.js to hand to a service: the service should
    // be given its database where it is put together, as the album load and the inventory are (F62).
    'components/playlists/PlaylistsDragHandler.js -> ../../app.js',
    'components/playlists/SavedPlaylistsController.js -> ../../app.js',
    'controllers/BlendingController.js -> ../app.js',
    'controllers/PlaylistsController.js -> ../app.js',
    'services/PlaylistPersistenceService.js -> ../app.js',
    'views/playlists/PlaylistsDragDrop.js -> ../../app.js'
]

/**
 * The stores above the 150 lines ADR-0017 aimed at, with the size they have today. A listed
 * store may not grow; a store not listed may not pass 150.
 */
const STORE_LINE_LIMIT = 150
const STORES_ABOVE_THE_LINE_LIMIT = {
    'stores/albumLoad.js': 214, // pure state, a third of it comments; the guests and the hold could be models
    'stores/albums.js': 171, // the shelf other screens read: goes when they read the load store (ADR-0019, decision 3)
    'stores/playlists.js': 169 // F62 (the blend and playlists code)
}

const unique = (list) => [...new Set(list)].sort()
const isMountingFile = (specifier) => /(^|\/)app\.js$/.test(specifier)

describe('a store only holds state (UAT-18, ADR-0017)', () => {
    const stores = listJs('stores')

    it('no store imports a service, a repository, the cache, the API, Firebase or the mounting file', () => {
        const reachesOut = /(\/services\/|\/repositories\/|\/cache\/|\/api\/|firebase|(^|\/)app\.js$)/

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
    const screen = [...listJs('views'), ...listJs('components'), ...listJs('controllers')]

    it('no view, component or controller imports a repository or Firebase', () => {
        const database = /(\/repositories\/|firebase)/

        expect(unique(offenders(screen, specifier => database.test(specifier)))).toEqual(unique(SCREEN_STILL_REACHING_THE_DATABASE))
    })

    it('nothing imports the file that mounts the app', () => {
        const others = appFiles().filter(file => file !== 'app.js')

        expect(unique(offenders(others, isMountingFile))).toEqual(unique(STILL_IMPORTING_THE_MOUNTING_FILE))
    })

    it('the inventory and the session are put together in one place each', () => {
        const wiring = ['services/inventory/inventoryWiring.js', 'services/auth/userSession.js']
        const others = appFiles().filter(file => !wiring.includes(file) && file !== 'app.js')

        expect(offenders(others, specifier => /InventoryRepository/.test(specifier))).toEqual([])
        expect(offenders(['services/inventory/InventoryService.js', 'services/auth/UserSessionService.js'],
            specifier => /(firebase|\/repositories\/|\/cache\/|\/stores\/|\/components\/|\/views\/)/.test(specifier))).toEqual([])
    })
})
