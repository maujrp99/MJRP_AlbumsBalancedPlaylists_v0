/**
 * F56 - which enrichment sources a blend recipe reads, so the blend waits for those and no other.
 */
import { describe, it, expect } from 'vitest'
import { resolveRankingId, sourcesForRecipe } from '../../public/js/models/recipeSources.js'

describe('resolveRankingId', () => {
    it('a Top N recipe has its ranking locked by its name', () => {
        expect(resolveRankingId({ algorithmId: 'top-3-popular', rankingId: 'bea' })).toBe('spotify')
        expect(resolveRankingId({ algorithmId: 'top-5-acclaimed' })).toBe('bea')
        expect(resolveRankingId({ algorithmId: 'top-n-user', rankingId: 'spotify' })).toBe('user')
    })

    it('any other recipe uses the ranking chosen, balanced when none was', () => {
        expect(resolveRankingId({ algorithmId: 'mjrp-balanced-cascade', rankingId: 'spotify' })).toBe('spotify')
        expect(resolveRankingId({ algorithmId: 'mjrp-balanced-cascade' })).toBe('balanced')
    })
})

describe('sourcesForRecipe', () => {
    it('names the sources each ranking reads', () => {
        expect(sourcesForRecipe({ algorithmId: 'x', rankingId: 'spotify' })).toEqual(['popularity'])
        expect(sourcesForRecipe({ algorithmId: 'x', rankingId: 'bea' })).toEqual(['acclaim'])
        expect(sourcesForRecipe({ algorithmId: 'x', rankingId: 'user' })).toEqual(['userRanking'])
        expect(sourcesForRecipe({ algorithmId: 'x', rankingId: 'balanced' })).toEqual(['acclaim', 'popularity'])
        expect(sourcesForRecipe({ algorithmId: 'x', rankingId: 'combined' })).toEqual(['acclaim', 'popularity'])
    })

    it('an unknown ranking is read as balanced, as the generation does', () => {
        expect(sourcesForRecipe({ algorithmId: 'x', rankingId: 'whatever' })).toEqual(['acclaim', 'popularity'])
    })
})
