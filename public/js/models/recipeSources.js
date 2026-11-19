/**
 * recipeSources
 *
 * Which ranking a blend recipe uses and which enrichment sources that ranking reads (F56), so
 * whoever generates playlists waits for those sources and for no other. Pure.
 */

const BALANCED = 'balanced'

/** The sources each ranking reads (names of ENRICHMENT_SOURCES, models/albumLoadState.js). */
const SOURCES_BY_RANKING = Object.freeze({
    spotify: ['popularity'],
    bea: ['acclaim'],
    user: ['userRanking'],
    [BALANCED]: ['acclaim', 'popularity']
})

/** A Top N recipe has its ranking in its name, whatever was chosen on screen. */
const LOCKED_BY_NAME = Object.freeze([['popular', 'spotify'], ['acclaimed', 'bea'], ['user', 'user']])

/**
 * The ranking a recipe is generated with.
 * @param {{ algorithmId: string, rankingId?: string }} config
 * @returns {string} 'spotify' | 'bea' | 'user' | 'balanced' | whatever was chosen
 */
export function resolveRankingId(config) {
    const locked = LOCKED_BY_NAME.find(([word]) => String(config.algorithmId || '').includes(word))
    return locked ? locked[1] : (config.rankingId || BALANCED)
}

/**
 * The enrichment sources a recipe needs. A ranking that is not known is read as balanced, as the
 * generation does (ranking/index.js).
 * @param {{ algorithmId: string, rankingId?: string }} config
 * @returns {string[]}
 */
export function sourcesForRecipe(config) {
    return [...(SOURCES_BY_RANKING[resolveRankingId(config)] || SOURCES_BY_RANKING[BALANCED])]
}

/**
 * What each ranking does with an album for which a source it reads has nothing (F62): the order
 * the tracks of that album are taken in instead. The blend says it in the notice of the missing
 * source, so no recipe changes its ordering in silence. Each line is what the ranking strategy
 * does (ranking/*.js; test/algorithms/recipes.promise.test.js holds them together).
 */
const BY_POPULARITY = 'by Spotify popularity where there is one, otherwise in album order'
const FALLBACK_BY_RANKING = Object.freeze({
    spotify: { popularity: 'by acclaim where there is one, otherwise in album order' },
    bea: { acclaim: BY_POPULARITY },
    user: { userRanking: 'in album order' },
    [BALANCED]: { acclaim: BY_POPULARITY, popularity: 'by acclaim alone' }
})

/**
 * The fallback of a recipe for each source it reads.
 * @param {{ algorithmId: string, rankingId?: string }} config
 * @returns {Object<string, string>} source -> how the tracks are ordered without it
 */
export function fallbacksForRecipe(config) {
    return { ...(FALLBACK_BY_RANKING[resolveRankingId(config)] || FALLBACK_BY_RANKING[BALANCED]) }
}
