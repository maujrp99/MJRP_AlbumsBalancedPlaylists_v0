/**
 * recipeIngredients - what a recipe of the blend lets the person choose, and the configuration the generation takes (F83 wave 7a; the rules
 * the hand-made panel of ingredients, components/blend/BlendIngredientsPanel.js, had inside it). Pure: no text (the labels and descriptions are
 * the dictionary's, by the `value` of each option), no drawing.
 *
 * «Ingredients» are the choices of a blend besides the recipe: the Top #, how the tracks are grouped, how the playlists are structured, the
 * target duration and the ranking source. An option is shown only for a recipe it changes the result of (F62).
 */

/** What each recipe shows: `true` is shown, a missing key is not. A recipe the table does not know shows all but the Top #. */
const SHOWN = Object.freeze({
    'mjrp-balanced-cascade': { duration: true, outputMode: false, rankingType: true, groupingStrategy: false },
    'top-n-popular': { groupingStrategy: true, outputMode: true, duration: false, rankingType: false, trackCount: true },
    'top-n-acclaimed': { groupingStrategy: true, outputMode: true, duration: false, rankingType: false, trackCount: true },
    'top-n-user': { groupingStrategy: true, outputMode: true, duration: false, rankingType: false, trackCount: true }
})

const EVERYTHING_BUT_THE_TOP_NUMBER = Object.freeze({ groupingStrategy: true, outputMode: true, duration: true, rankingType: true, trackCount: false })

/**
 * What the person chose besides the recipe: the duration in minutes, the structure, the grouping, the ranking source and the Top #.
 * @typedef {{ duration: number, outputMode: string, groupingStrategy: string, rankingType: string, trackCount: number }} Choices
 */

/**
 * The choices of a panel that nobody touched.
 * @type {Readonly<Choices>}
 */
export const DEFAULT_CHOICES = Object.freeze({ duration: 60, outputMode: 'auto', groupingStrategy: 'by_album', rankingType: 'combined', trackCount: 3 })

/** The Top # on offer: 1 to 10. */
/** @type {ReadonlyArray<number>} */
export const TRACK_COUNTS = Object.freeze(Array.from({ length: 10 }, (_, i) => i + 1))

/** @type {ReadonlyArray<{ value: string, icon: string }>} */
export const OUTPUT_MODES = Object.freeze([
    { value: 'single', icon: 'ListMusic' },
    { value: 'multiple', icon: 'LayoutGrid' },
    { value: 'auto', icon: 'Sparkles' }
])

/** @type {ReadonlyArray<{ value: string, icon: string }>} */
export const RANKING_TYPES = Object.freeze([
    { value: 'spotify', icon: 'TrendingUp' },
    { value: 'bea', icon: 'Award' },
    { value: 'combined', icon: 'Scale' }
])

/** @type {ReadonlyArray<{ value: string, icon: string }>} */
export const GROUPING_STRATEGIES = Object.freeze([
    { value: 'by_album', icon: 'Disc' },
    { value: 'flat_ranked', icon: 'TrendingUp' },
    { value: 'artist_rank', icon: 'Users' },
    { value: 'ranked_interleave', icon: 'GitMerge' },
    { value: 'shuffle', icon: 'Shuffle' }
])

/**
 * Which ingredients a recipe shows.
 * @param {string} [recipeId]
 * @returns {{ groupingStrategy?: boolean, outputMode?: boolean, duration?: boolean, rankingType?: boolean, trackCount?: boolean }}
 */
export const ingredientsOf = (recipeId) => SHOWN[recipeId] || EVERYTHING_BUT_THE_TOP_NUMBER

/**
 * Is the target duration shown? When the recipe is built on it (the balanced playlists), or when a recipe with a structure may split by it:
 * «Multiple» always does and «Auto» does once the tracks pass the target. For «Single» it changes nothing, so it is not shown.
 * @param {ReturnType<typeof ingredientsOf>} ingredients
 * @param {string} outputMode - the structure chosen
 * @returns {boolean}
 */
export const showsDuration = (ingredients, outputMode) => Boolean(ingredients.duration) || (Boolean(ingredients.outputMode) && outputMode !== 'single')

/** The ranking source as the generation names it. */
const RANKING_ID_OF = Object.freeze({ combined: 'balanced', spotify: 'spotify', bea: 'bea' })

/**
 * The configuration the generation takes, in its form: the duration in SECONDS, `rankingId` instead of `rankingType`. All five keys,
 * always, the ones the recipe does not show included: the generation reads what it needs.
 * @param {Choices} choices
 * @returns {{ targetDuration: number, rankingId: string, outputMode: string, groupingStrategy: string, trackCount: number }}
 */
export const configOf = (choices) => ({
    targetDuration: choices.duration * 60,
    rankingId: RANKING_ID_OF[choices.rankingType] || 'balanced',
    outputMode: choices.outputMode,
    groupingStrategy: choices.groupingStrategy,
    trackCount: choices.trackCount
})

/** The ranking source a recipe was generated with, as the panel names it; any other ranking (the user's own) is shown as «combined». */
const RANKING_TYPE_OF = Object.freeze({ spotify: 'spotify', bea: 'bea' })

/**
 * The choices a generated recipe stands for (the reverse of `configOf`, with the defaults for what the recipe does not carry).
 * @param {{ rankingId?: string, targetDuration?: number, outputMode?: string, groupingStrategy?: string, trackCount?: number }} config
 * @returns {Choices}
 */
export function choicesOf(config) {
    const chosen = {
        duration: config.targetDuration ? config.targetDuration / 60 : undefined, // seconds → minutes
        outputMode: config.outputMode,
        groupingStrategy: config.groupingStrategy,
        rankingType: RANKING_TYPE_OF[config.rankingId] || 'combined',
        trackCount: config.trackCount
    }
    // an option the recipe does not carry keeps the default
    return { ...DEFAULT_CHOICES, ...Object.fromEntries(Object.entries(chosen).filter(([, value]) => value !== undefined && value !== null)) }
}
