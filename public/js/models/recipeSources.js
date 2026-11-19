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
