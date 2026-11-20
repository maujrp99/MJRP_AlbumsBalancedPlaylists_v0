/**
 * The functions of the app that are above a cyclomatic complexity of 10 TODAY, with their number
 * (F58; measured 2026-11-19 with ESLint's `complexity` rule, public/js without vendor/).
 *
 * This list can only shrink (test/architecture/complexityLimit.test.js):
 *   - a function that is not here must be at 10 or below: never add a line;
 *   - a listed function may not get worse;
 *   - when you bring one down, remove its line (or lower its number if it is still above 10).
 *
 * The key is `file:function`, the file relative to public/js, the name as ESLint gives it
 * ("arrow function", "constructor", "function" for the ones with no name). When a file has more
 * than one offender with the same name, they are numbered in the order they appear in the file:
 * `file:arrow function`, `file:arrow function#2`, ...
 *
 * The comment of each line says who could bring it down. F58 was scoped to the album load: for
 * the rest, "F62 holds this code" and "F57 holds this code" name the feature that was working on
 * that code when the list was made (so F58 did not touch it), not a promise of that feature.
 * "no feature yet" is a debt with no owner on the board.
 */
export const KNOWN_ABOVE_THE_LIMIT = Object.freeze({
    'algorithms/BaseAlgorithm.js:buildRankingSummary': 12, // F62 holds this code (blend, playlists, export, Spotify)
    'algorithms/MJRPBalancedCascadeAlgorithm.js:generate': 38, // F62 holds this code (blend, playlists, export, Spotify)
    'algorithms/MJRPBalancedCascadeAlgorithm.js:mergeSmallPlaylists': 14, // F62 holds this code (blend, playlists, export, Spotify)
    'algorithms/TopNAlgorithm.js:generate': 22, // F62 holds this code (blend, playlists, export, Spotify)
    'algorithms/mixins/DurationTrimmingMixin.js:trimOverDurationPlaylists': 11, // F62 holds this code (blend, playlists, export, Spotify)
    'algorithms/mixins/PlaylistBalancingMixin.js:runSwapBalancing': 20, // F62 holds this code (blend, playlists, export, Spotify)
    'algorithms/mixins/PlaylistBalancingMixin.js:isSwapValid': 14, // F62 holds this code (blend, playlists, export, Spotify)
    'algorithms/mixins/TrackEnrichmentMixin.js:arrow function': 14, // F62 holds this code (blend, playlists, export, Spotify)
    'algorithms/mixins/TrackEnrichmentMixin.js:arrow function#2': 32, // F62 holds this code (blend, playlists, export, Spotify)
    'algorithms/mixins/TrackEnrichmentMixin.js:arrow function#3': 20, // F62 holds this code (blend, playlists, export, Spotify)
    'api/serverResult.js:readServerResult': 11, // no feature yet: the API client still normalizes by hand what the server sends
    'components/InventoryEditModal.js:open': 14, // no feature yet
    'components/blend/BlendRecipeCard.js:renderRecipeCard': 13, // F62 holds this code (blend, playlists, export, Spotify)
    'components/blend/BlendSeriesSelector.js:preloadSeriesThumbnails': 20, // F62 holds this code (blend, playlists, export, Spotify)
    'components/ranking/TracksRankingComparison.js:arrow function': 19, // no feature yet
    'components/ranking/TracksTable.js:renderRow': 16, // no feature yet
    'components/series/SeriesEventHandler.js:handleRemoveAlbum': 19, // no feature yet
    'components/ui/AlbumCardRenderer.js:arrow function': 17, // no feature yet
    'components/ui/AlbumCardRenderer.js:arrow function#2': 18, // no feature yet
    'components/ui/Card.js:renderRankingBadge': 17, // no feature yet
    'components/ui/Pager.js:render': 12, // no feature yet
    'components/ui/TrackRow.js:render': 11, // no feature yet
    'components/ui/TrackRow.js:buildBadges': 14, // no feature yet
    'controllers/InventoryController.js:arrow function': 13, // no feature yet
    'controllers/SeriesController.js:arrow function': 20, // no feature yet
    'helpers/BEAEnrichmentHelper.js:applyBEAData': 15, // no feature yet
    'models/Album.js:constructor': 16, // no feature yet: the constructor normalizes every shape an album or a track ever had
    'models/Track.js:constructor': 39, // no feature yet: the constructor normalizes every shape an album or a track ever had
    'models/seriesFilter.js:matches': 14, // no feature yet: three filters of albums that should be one rule
    'ranking/BalancedRankingStrategy.js:arrow function': 14, // F62 holds this code (blend, playlists, export, Spotify)
    'ranking/BalancedRankingStrategy.js:arrow function#2': 30, // F62 holds this code (blend, playlists, export, Spotify)
    'ranking/BalancedRankingStrategy.js:arrow function#3': 12, // F62 holds this code (blend, playlists, export, Spotify)
    'ranking/SpotifyRankingStrategy.js:arrow function': 11, // F62 holds this code (blend, playlists, export, Spotify)
    'repositories/InventoryRepository.js:addAlbum': 16, // no feature yet
    'services/PlaylistsService.js:_writeCurrentBatch': 13, // F62 holds this code (blend, playlists, export, Spotify)
    'services/SavedPlaylistsFilterService.js:filterSeries': 13, // F62 holds this code (blend, playlists, export, Spotify)
    'services/album-search/AlbumSearchService.js:search': 11, // F57 holds this code (album search, classification, series edit)
    'services/album-search/ScoreCalculator.js:calculate': 12, // F57 holds this code (album search, classification, series edit)
    'services/musickit/MusicKitCatalog.js:arrow function': 14, // no feature yet: the Apple Music catalog client
    'services/musickit/MusicKitCatalog.js:getAlbumDetails': 21, // no feature yet: the Apple Music catalog client
    'services/musickit/MusicKitCatalog.js:arrow function#2': 13, // no feature yet: the Apple Music catalog client
    'services/musickit/MusicKitCatalog.js:getArtistAlbums': 18, // no feature yet: the Apple Music catalog client
    'transformers/TrackTransformer.js:toCanonical': 40, // F62 holds this code (blend, playlists, export, Spotify)
    'utils/FilterUtils.js:sortBy': 12, // no feature yet: three filters of albums that should be one rule
    'utils/SafeDOM.js:arrow function': 15, // no feature yet
    'utils/retry.js:retryWithBackoff': 14, // no feature yet
    'views/BlendingMenuView.js:render': 12, // F62 holds this code (blend, playlists, export, Spotify)
    'views/BlendingMenuView.js:renderGenerateButton': 13, // F62 holds this code (blend, playlists, export, Spotify)
    'views/InventoryView.js:render': 11, // no feature yet
    'views/SeriesView.js:updateAlbums': 19, // no feature yet
    'views/albums/AlbumsScopedRenderer.js:arrow function': 12, // no feature yet
    'workers/search.worker.js:function': 11 // F57 holds this code (album search, classification, series edit)
})

/**
 * The same list for the server (server/, measured 2026-11-19 in F52, slice 5). It can only shrink,
 * by the same three rules. The key is `file:function` with the file relative to the repository
 * root. When the slice began there were 26; it brought 8 into the limit (the ranking fetch at 139,
 * the album answer at 65, the consolidation at 49 among them), and F65 removed the 4 of server/scripts.
 */
export const SERVER_KNOWN_ABOVE_THE_LIMIT = Object.freeze({
    'server/lib/aiClient.js:callProvider': 14, // no feature yet: the two shapes of provider (Gemini, proxy) in one function
    'server/lib/aiProviderOutcome.js:describeProviderError': 12, // no feature yet: the optional chains of a log line
    'server/lib/asyncRoute.js:function': 11, // no feature yet: the error responder
    'server/lib/auth/verifyIdToken.js:verify': 14, // no feature yet: the checks of a login token, in a row
    'server/lib/normalize.js:tryRecoverRankingFromText': 17, // no feature yet: reading the AI's answer (the ranking prompt)
    'server/lib/normalize.js:extractFromCandidate': 12, // no feature yet: reading the AI's answer
    'server/lib/normalize.js:normalizeRankingEntry': 28, // no feature yet: reading the AI's answer (the ranking prompt)
    'server/lib/normalize.js:extractRankingPayload': 34, // no feature yet: reading the AI's answer (the ranking prompt)
    'server/lib/outcome.js:upstreamErrorFrom': 11, // no feature yet: one function at 11 in the answer contract
    'server/lib/scrapers/besteveralbums.js:arrow function': 13, // no feature yet: reading the chart page of BestEverAlbums
    'server/lib/scrapers/besteveralbums.js:arrow function#2': 11, // no feature yet: reading the chart page of BestEverAlbums
    'server/routes/debug.js:async arrow function': 13, // no feature yet: a debug route, off in production (F59)
    'server/routes/debug.js:async arrow function#2': 24, // no feature yet: a debug route, off in production (F59)
    'server/routes/handlers/ai.js:albumTitlesIn': 13 // no feature yet: reading the AI's list of albums
})

/**
 * The same list for the modules the app and the server share (shared/). It is EMPTY: the nine
 * functions measured on 2026-11-19 were all of shared/curation.js, which F65 removed. Keep it empty:
 * a function of shared/ above the limit fails the test.
 */
export const SHARED_KNOWN_ABOVE_THE_LIMIT = Object.freeze({})

const APP = 'public/js/'

/**
 * The rows of the measuring as `{ 'file:function': complexity }`, with the same keys as the list.
 * @param {Array<{ file: string, line: number, name: string, complexity: number }>} rows
 * @returns {Object<string, number>}
 */
export function keyed(rows) {
    const seen = new Map()
    const result = {}
    const inFileOrder = [...rows].sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)
    for (const row of inFileOrder) {
        const file = row.file.startsWith(APP) ? row.file.slice(APP.length) : row.file
        const base = `${file}:${row.name}`
        const count = (seen.get(base) || 0) + 1
        seen.set(base, count)
        result[count > 1 ? `${base}#${count}` : base] = row.complexity
    }
    return result
}
