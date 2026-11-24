/**
 * BlockRecipeAlgorithm - a recipe of the blend made of blocks (F92, REQ-04, REQ-06): the definition (shared/content/recipeDefinition.js)
 * says the source, the direction, how many tracks of each album to skip and to take, the exclusion and the grouping. It runs through the one
 * engine (TopNAlgorithm.generate, selectByBlocks.js) with the fixed rules of the blocks: a track with no data never counts, a tie goes by the
 * order on the album. A definition out of the limits is refused whole: the recipe is not made.
 *
 * `adjustableSkip`: the person may move the skip on the Blend screen (REQ-10, «Deep cuts»), from the definition's skip up to the limit.
 *
 * @module algorithms/BlockRecipeAlgorithm
 */
import { TopNAlgorithm } from './TopNAlgorithm.js'
import { createRankingStrategy } from '../ranking/index.js'
import { RECIPE_GROUPINGS, maxSkipFor, validateRecipeDefinition } from '@shared/content/recipeDefinition.js'

/** The definition, checked; a refused one stops here (nothing of it is used). */
function checked(definition) {
    const result = validateRecipeDefinition(definition)
    if (!result.ok) throw new Error(`Recipe definition refused: ${result.errors.map(error => `${error.field} ${error.reason}`).join(', ')}`)
    return result.definition
}

export class BlockRecipeAlgorithm extends TopNAlgorithm {
    static metadata = {
        id: 'block-recipe',
        name: 'Recipe made of blocks',
        badge: 'BLOCKS',
        description: 'Base class of the recipes made of blocks - do not register directly',
        isRecommended: false
    }

    /** The blocks of the recipe (a subclass writes its own). */
    static definition = null

    /** Whether the person may move the skip on the Blend screen. */
    static adjustableSkip = false

    /**
     * @param {Object} opts
     * @param {Object} [opts.definition] - the blocks; the class's own when left out
     */
    constructor(opts = {}) {
        const definition = checked(opts.definition ?? new.target.definition ?? {})
        super({ ...opts, trackCount: definition.take, rankingStrategy: opts.rankingStrategy || createRankingStrategy(definition.source) })
        this.definition = definition
    }

    /** The skip asked on the screen, held between the definition's skip and the limit; the definition's when it is not adjustable. */
    skipOf(asked) {
        const { skip, take } = this.definition
        if (!this.constructor.adjustableSkip || !Number.isInteger(asked)) return skip
        return Math.min(Math.max(asked, skip), maxSkipFor(take))
    }

    blocksFor({ skip }) {
        const { source, direction, take, minSeconds } = this.definition
        return { source, direction, skip: this.skipOf(skip), take, minSeconds, countsTracksWithoutData: false }
    }

    /** The Top # of the menu is not read (the take is the definition's); the shuffle is not a grouping of a recipe made of blocks. */
    generate(albums, opts = {}) {
        const groupingStrategy = RECIPE_GROUPINGS.includes(opts.groupingStrategy) ? opts.groupingStrategy : this.definition.grouping
        return super.generate(albums, { ...opts, trackCount: this.definition.take, groupingStrategy })
    }

    rankLabel(i, blocks) {
        return `${blocks.direction === 'bottom' ? 'Bottom' : 'Top'} ${blocks.skip + i + 1}`
    }

    getPlaylistSubtitle() {
        const { skip, take } = this._currentBlocks || this.blocksFor({})
        return `Tracks ${skip + 1} to ${skip + take} of each album`
    }
}

export default BlockRecipeAlgorithm
