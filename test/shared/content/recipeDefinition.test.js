/**
 * The one validator of a recipe made of blocks (F92, REQ-06; TASK-07): the vocabulary, the defaults and the limits. A definition out of the
 * limits is refused WHOLE (nothing of it is used), and the reason names the block.
 */
import { describe, it, expect } from 'vitest'
import {
    RECIPE_DEFAULTS, RECIPE_GROUPINGS, RECIPE_SOURCES, RECIPE_DIRECTIONS, RECIPE_LIMITS,
    validateRecipeDefinition, maxSkipFor
} from '../../../shared/content/recipeDefinition.js'

describe('the blocks of a recipe and their defaults', () => {
    it('has the four sources, the two directions and the groupings of today but the shuffle', () => {
        expect(RECIPE_SOURCES).toEqual(['spotify', 'bea', 'combined', 'user'])
        expect(RECIPE_DIRECTIONS).toEqual(['top', 'bottom'])
        expect(RECIPE_GROUPINGS).toEqual(['by_album', 'flat_ranked', 'artist_rank', 'ranked_interleave'])
        expect(RECIPE_GROUPINGS).not.toContain('shuffle')
    })

    it('starts from Spotify, from the top, skip 0, take 3, no exclusion, by album', () => {
        expect(RECIPE_DEFAULTS).toEqual({ source: 'spotify', direction: 'top', skip: 0, take: 3, minSeconds: 0, grouping: 'by_album' })
    })

    it('an empty definition is the defaults', () => {
        expect(validateRecipeDefinition({})).toEqual({ ok: true, definition: { ...RECIPE_DEFAULTS } })
    })
})

describe('the limits (REQ-06)', () => {
    const refusedFor = (input) => {
        const result = validateRecipeDefinition(input)
        expect(result.ok).toBe(false)
        expect(result).not.toHaveProperty('definition')
        return result.errors.map(error => `${error.field}:${error.reason}`)
    }

    it('skip 0 to 10, take 1 to 10, skip + take at most 15, exclusion 0 to 300 seconds', () => {
        expect(RECIPE_LIMITS).toEqual({ skip: { min: 0, max: 10 }, take: { min: 1, max: 10 }, skipPlusTake: 15, minSeconds: { min: 0, max: 300 } })
        expect(validateRecipeDefinition({ skip: 10, take: 5 }).ok).toBe(true)
        expect(validateRecipeDefinition({ skip: 0, take: 1, minSeconds: 300 }).ok).toBe(true)
    })

    it('take 11 is refused (the example of the spec)', () => {
        expect(refusedFor({ take: 11 })).toEqual(['take:out_of_limits'])
    })

    it('skip 10 with take 6 is refused: 16 is more than 15 (the example of the spec)', () => {
        expect(refusedFor({ skip: 10, take: 6 })).toEqual(['skip+take:out_of_limits'])
    })

    it('skip 11, take 0, a negative exclusion and one over 300 are refused', () => {
        expect(refusedFor({ skip: 11 })).toEqual(['skip:out_of_limits'])
        expect(refusedFor({ take: 0 })).toEqual(['take:out_of_limits'])
        expect(refusedFor({ minSeconds: -1 })).toEqual(['minSeconds:out_of_limits'])
        expect(refusedFor({ minSeconds: 301 })).toEqual(['minSeconds:out_of_limits'])
    })

    it('a number that is not a whole number is refused', () => {
        expect(refusedFor({ skip: 2.5 })).toEqual(['skip:not_whole_number'])
        expect(refusedFor({ take: '3' })).toEqual(['take:not_whole_number'])
    })

    it('a word out of the vocabulary is refused, the shuffle among them', () => {
        expect(refusedFor({ source: 'lastfm' })).toEqual(['source:not_in_vocabulary'])
        expect(refusedFor({ direction: 'middle' })).toEqual(['direction:not_in_vocabulary'])
        expect(refusedFor({ grouping: 'shuffle' })).toEqual(['grouping:not_in_vocabulary'])
    })

    it('a block that does not exist is refused (the rule «no data never counts» and the tie-break are fixed, not blocks)', () => {
        expect(refusedFor({ countsTracksWithoutData: true })).toEqual(['countsTracksWithoutData:unknown_block'])
        expect(refusedFor({ tieBreak: 'rating' })).toEqual(['tieBreak:unknown_block'])
    })

    it('what is not a map is refused', () => {
        expect(refusedFor(null)).toEqual(['definition:not_a_map'])
        expect(refusedFor([])).toEqual(['definition:not_a_map'])
    })

    it('the most a recipe may skip, for a take: 10, or less when the sum would pass 15', () => {
        expect(maxSkipFor(3)).toBe(10)
        expect(maxSkipFor(5)).toBe(10)
        expect(maxSkipFor(6)).toBe(9)
        expect(maxSkipFor(10)).toBe(5)
    })
})
