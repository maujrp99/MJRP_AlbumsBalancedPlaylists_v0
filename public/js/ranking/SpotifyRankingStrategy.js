/**
 * SpotifyRankingStrategy
 * 
 * Logic:
 * 1. Prioritize Spotify Popularity (High > Low)
 * 2. Fallback: Rating
 * 3. Fallback: Original Order
 * 
 * @module ranking/SpotifyRankingStrategy
 */
import { BalancedRankingStrategy } from './BalancedRankingStrategy.js'

export class SpotifyRankingStrategy extends BalancedRankingStrategy {
    static metadata = {
        id: 'spotify',
        name: 'Spotify Popularity',
        description: 'Prioritizes Spotify Popularity (0-100).'
    }

    rank(album) {
        // Use Balanced helper to get enriched data (we need the Spotify IDs/Pop mapped correctly)
        // Since Balanced strategy handles matching tracks to metadata, we reuse it but change sort.
        const tracks = super.rank(album)

        // Re-sort based on Spotify Popularity
        tracks.sort((a, b) => {
            // 1. Spotify Popularity (High is better)
            const popA = (a.spotifyPopularity !== undefined && a.spotifyPopularity !== null) ? Number(a.spotifyPopularity) : -1
            const popB = (b.spotifyPopularity !== undefined && b.spotifyPopularity !== null) ? Number(b.spotifyPopularity) : -1

            if (popA !== popB) return popB - popA

            // 2. Fallback: Rating (High is better)
            const ratingA = a.rating !== null ? a.rating : -1
            const ratingB = b.rating !== null ? b.rating : -1
            if (ratingA !== ratingB) return ratingB - ratingA

            // 3. Original Order
            return (a.origIndex || 0) - (b.origIndex || 0)
        })

        // Re-normalize _rank
        tracks.forEach((track, index) => {
            track._rank = index + 1
            track._debug_strategy = 'spotify'
        })

        return tracks
    }
}
