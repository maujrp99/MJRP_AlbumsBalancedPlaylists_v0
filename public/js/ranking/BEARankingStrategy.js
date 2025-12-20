/**
 * BEARankingStrategy
 * 
 * Logic:
 * 1. Prioritize BestEverAlbums Rating (High > Low)
 * 2. Fallback: Canonical Rank (Low > High)
 * 3. Fallback: Spotify Popularity
 * 
 * @module ranking/BEARankingStrategy
 */
import { BalancedRankingStrategy } from './BalancedRankingStrategy.js'

export class BEARankingStrategy extends BalancedRankingStrategy {
    static metadata = {
        id: 'bea',
        name: 'BEA Rating',
        description: 'Prioritizes BestEverAlbums Ratings.'
    }

    rank(album) {
        // Reuse enrichment from Balanced
        const tracks = super.rank(album)

        // Re-sort based on Rating
        tracks.sort((a, b) => {
            // 1. Rating (High is better)
            const ratingA = a.rating !== null ? a.rating : -1
            const ratingB = b.rating !== null ? b.rating : -1
            if (ratingA !== ratingB) return ratingB - ratingA

            // 2. Canonical Rank (Low is better - e.g. #1)
            const rankA = a.canonicalRank !== null ? a.canonicalRank : Number.POSITIVE_INFINITY
            const rankB = b.canonicalRank !== null ? b.canonicalRank : Number.POSITIVE_INFINITY
            if (rankA !== rankB) return rankA - rankB

            // 3. Spotify Pop (Fallback)
            const popA = (a.spotifyPopularity !== undefined && a.spotifyPopularity !== null) ? Number(a.spotifyPopularity) : -1
            const popB = (b.spotifyPopularity !== undefined && b.spotifyPopularity !== null) ? Number(b.spotifyPopularity) : -1
            if (popA !== popB) return popB - popA

            // 4. Original Order
            return (a.origIndex || 0) - (b.origIndex || 0)
        })

        // Re-normalize _rank
        tracks.forEach((track, index) => {
            track._rank = index + 1
            track._debug_strategy = 'bea'
        })

        return tracks
    }
}
