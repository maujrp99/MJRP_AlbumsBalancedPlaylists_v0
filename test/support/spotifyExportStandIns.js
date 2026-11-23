/**
 * The doubles the Spotify export window's scenarios stand on (F83 wave 8a): the export service (it records what it was asked, keeps the two
 * callbacks it was given and waits until the scenario answers), the sign-in and the notice. They import nothing of the app, so a `vi.mock`
 * factory may load this file (a factory that loads the window waits for itself and the test hangs without a word).
 *
 * Used by test/support/spotifyExportScenarios.js's two players: reports/evidence/F83/wave-8a/capture-spotify-before.test.js (run once on the
 * hand-made window, it wrote test/fixtures/spotifyExportBeforeF83.json) and test/ui/SpotifyExportWindow.sameAsBefore.test.tsx.
 */

export const stand = {
    /** Everything the window asked of the world, in order. */
    calls: /** @type {unknown[][]} */ ([]),
    /** The callbacks of the export that is waiting: progress and not found. */
    handlers: /** @type {{ onProgress: Function, onNotFound: Function } | null} */ (null),
    finish: /** @type {((report: object) => void) | null} */ (null),
    fail: /** @type {((error: unknown) => void) | null} */ (null)
}

export function resetStands() {
    stand.calls = []
    stand.handlers = null
    stand.finish = null
    stand.fail = null
}

const plain = (value) => JSON.parse(JSON.stringify(value))

export const SpotifyExportService = {
    exportPlaylists: (playlists, options, handlers) => {
        stand.calls.push(['exportPlaylists', playlists.map(item => item.name), plain(options)])
        stand.handlers = handlers
        return new Promise((resolve, reject) => { stand.finish = resolve; stand.fail = reject })
    }
}

export const SpotifyAuthService = { login: () => { stand.calls.push(['login']) } }

const said = (type) => (...words) => { stand.calls.push(['notice', type, ...words]) }
export const toast = { info: said('info'), success: said('success'), error: said('error'), warning: said('warning') }
