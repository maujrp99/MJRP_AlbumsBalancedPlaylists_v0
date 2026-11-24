/**
 * recipeDefinition - a recipe of the blend made of blocks, and the one validator of it (F92, REQ-06; ADR-0024).
 *
 * The Painel, the rules and the site check a definition with this module. The blocks:
 *   source      where the ranking comes from: 'spotify' | 'bea' | 'combined' | 'user'
 *   direction   'top' (the most first) | 'bottom' (the least first)
 *   skip        how many tracks of each album to skip, 0 to 10
 *   take        how many tracks of each album to take, 1 to 10 (skip + take at most 15)
 *   minSeconds  a track shorter than this is left out, 0 to 300 (0: nothing is left out)
 *   grouping    the groupings of the menu but the shuffle (a recipe gives the same tracks every time)
 * Fixed, not blocks: a track with no data of the source never counts, and a tie is broken by the order of the track on the album.
 *
 * A definition out of the vocabulary or of the limits is refused WHOLE (nothing of it is used). Pure: no Firebase, no `fetch`, no global.
 */

export const RECIPE_SOURCES = Object.freeze(['spotify', 'bea', 'combined', 'user'])
export const RECIPE_DIRECTIONS = Object.freeze(['top', 'bottom'])
export const RECIPE_GROUPINGS = Object.freeze(['by_album', 'flat_ranked', 'artist_rank', 'ranked_interleave'])

export const RECIPE_LIMITS = Object.freeze({
    skip: Object.freeze({ min: 0, max: 10 }),
    take: Object.freeze({ min: 1, max: 10 }),
    skipPlusTake: 15,
    minSeconds: Object.freeze({ min: 0, max: 300 })
})

export const RECIPE_DEFAULTS = Object.freeze({ source: 'spotify', direction: 'top', skip: 0, take: 3, minSeconds: 0, grouping: 'by_album' })

const WORDS = Object.freeze({ source: RECIPE_SOURCES, direction: RECIPE_DIRECTIONS, grouping: RECIPE_GROUPINGS })

export const REASON_NOT_A_MAP = 'not_a_map'
export const REASON_UNKNOWN_BLOCK = 'unknown_block'
export const REASON_NOT_IN_VOCABULARY = 'not_in_vocabulary'
export const REASON_NOT_WHOLE_NUMBER = 'not_whole_number'
export const REASON_OUT_OF_LIMITS = 'out_of_limits'

const isPlainMap = (value) => {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
    const prototype = Object.getPrototypeOf(value)
    return prototype === Object.prototype || prototype === null
}

/** The reason a block is refused, or null. */
function reasonOf(block, value) {
    if (!Object.hasOwn(RECIPE_DEFAULTS, block)) return REASON_UNKNOWN_BLOCK
    if (WORDS[block]) return WORDS[block].includes(value) ? null : REASON_NOT_IN_VOCABULARY
    if (!Number.isInteger(value)) return REASON_NOT_WHOLE_NUMBER
    const { min, max } = RECIPE_LIMITS[block]
    return value < min || value > max ? REASON_OUT_OF_LIMITS : null
}

/**
 * @param {unknown} input - the definition, as the CMS or the code writes it (a block left out takes its default)
 * @returns {{ ok: true, definition: typeof RECIPE_DEFAULTS } | { ok: false, errors: Array<{ field: string, reason: string }> }}
 */
export function validateRecipeDefinition(input) {
    if (!isPlainMap(input)) return { ok: false, errors: [{ field: 'definition', reason: REASON_NOT_A_MAP }] }
    const errors = Object.entries(input)
        .map(([field, value]) => ({ field, reason: reasonOf(field, value) }))
        .filter(error => error.reason !== null)
    if (errors.length) return { ok: false, errors }
    const definition = { ...RECIPE_DEFAULTS, ...input }
    if (definition.skip + definition.take > RECIPE_LIMITS.skipPlusTake) {
        return { ok: false, errors: [{ field: 'skip+take', reason: REASON_OUT_OF_LIMITS }] }
    }
    return { ok: true, definition }
}

/** The most a recipe may skip for a take: 10, or less when skip + take would pass 15. */
export const maxSkipFor = (take) => Math.min(RECIPE_LIMITS.skip.max, RECIPE_LIMITS.skipPlusTake - take)
