/**
 * BEARankingStrategy
 * 
 * Logic:
 * 1. Prioritize BestEverAlbums Rating (High > Low); a track with no rating comes after every rated one
 * 2. Fallback: Canonical Rank (Low > High)
 * 3. Fallback: Spotify Popularity (the fallback the blend names when the ratings are missing)
 * 
 * @module ranking/BEARankingStrategy
 */
import { BalancedRankingStrategy } from './BalancedRankingStrategy.js'

/** The rating the acclaim source gave; a popularity standing in for a missing rating is not one. */
const acclaimRatingOf = (track) => (track.rating !== null && !track.ratingIsPopularity ? track.rating : -1)

/** Low is better (#1); a track with no canonical rank comes after the ones that have it. */
const byCanonicalRank = (a, b) => {
    const rankA = a.canonicalRank ?? Number.POSITIVE_INFINITY
    const rankB = b.canonicalRank ?? Number.POSITIVE_INFINITY
    return rankA === rankB ? 0 : rankA - rankB
}

const popularityOf = (track) => (track.spotifyPopularity === undefined || track.spotifyPopularity === null ? -1 : Number(track.spotifyPopularity))

export class BEARankingStrategy extends BalancedRankingStrategy {
    static metadata = {
        id: 'bea',
        name: 'BEA Rating',
        description: 'Prioritizes BestEverAlbums Ratings.'
    }

    rank(album) {
        // Reuse enrichment from Balanced
        const tracks = super.rank(album)

        // Re-sort: 1. rating (high first)  2. canonical rank (low first)  3. Spotify popularity
        // (high first, the fallback)  4. original order
        tracks.sort((a, b) =>
            acclaimRatingOf(b) - acclaimRatingOf(a) ||
            byCanonicalRank(a, b) ||
            popularityOf(b) - popularityOf(a) ||
            (a.origIndex || 0) - (b.origIndex || 0))

        // Re-normalize _rank
        tracks.forEach((track, index) => {
            track._rank = index + 1
            track._debug_strategy = 'bea'
        })

        return tracks
    }
}
