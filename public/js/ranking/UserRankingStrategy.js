/**
 * UserRankingStrategy
 * 
 * Ranking strategy that uses user-defined track rankings.
 * Falls back to the order of the album itself if no user ranking exists (the blend says so:
 * models/recipeSources.js names this fallback in the notice).
 * 
 * Part of the Strategy Pattern for "Source of Truth" selection.
 * Color: Incandescent Blue (#0EA5E9 / sky-500)
 * 
 * @module ranking/UserRankingStrategy
 * @since Sprint 20
 */

import { entryOfEachTrack } from '../models/sameTrack.js'
import { RankingStrategy } from './RankingStrategy.js'

export class UserRankingStrategy extends RankingStrategy {
    static metadata = {
        id: 'user',
        name: 'My Ranking',
        description: 'Your personal track order based on your preferences.',
        color: 'sky-500',  // Incandescent blue
        colorHex: '#0EA5E9'
    }

    constructor(options = {}) {
        super(options)
    }

    /**
     * Rank tracks based on user-defined ranking
     * @param {Object} album - Album with tracks and optional userRanking property
     * @returns {Array} Tracks sorted by user ranking with _rank property
     */
    rank(album) {
        if (!album?.tracks?.length) {
            return []
        }

        // Check if album has user ranking data (Sprint 20 Robustness)
        if (!album.userRanking || album.userRanking.length === 0) {
            // Fallback: If album was hydrated but the specific property is missing, 
            // check if tracks themselves carry userRank (set by setUserRankings)
            const hasTrackRankings = album.tracks.some(t => t.userRank != null && t.userRank < 999);

            if (hasTrackRankings) {
                console.log(`[UserRankingStrategy] No album.userRanking, but found track-level rankings for: ${album.title}`);
                return [...album.tracks].sort((a, b) => (a.userRank ?? 999) - (b.userRank ?? 999));
            }

            // Fallback: original album position
            return this._fallbackToOriginalOrder(album)
        }

        return this._applyUserRanking(album)
    }

    /**
     * Apply user-defined ranking to tracks
     * @param {Object} album - Album with userRanking array
     * @returns {Array} Tracks sorted by user ranking
     * @private
     */
    _applyUserRanking(album) {
        // Which row of the person's ranking is of which track is the one track rule's to say
        // (models/sameTrack.js, F74): two tracks of one title keep each its own rank.
        const rowOf = entryOfEachTrack(album.tracks, album.userRanking)

        const rankedTracks = album.tracks.map((track, index) => {
            const userRank = rowOf[index]?.userRank

            return {
                ...track,
                userRank: userRank ?? 999,  // Unranked tracks get high value
                _rank: userRank ?? 999
            }
        })

        // Sort by user rank (ascending: 1, 2, 3...)
        return rankedTracks.sort((a, b) => a._rank - b._rank)
    }

    /**
     * Fallback: the tracks in the order of the album itself. An album keeps its tracks by acclaim
     * (`tracks`) and in its own order apart (`tracksOriginalOrder`): with no ranking of the
     * person, the order is the album's, never the acclaim order under the name of "my ranking".
     * @param {Object} album - Album object
     * @returns {Array} Tracks with _rank based on original position
     * @private
     */
    _fallbackToOriginalOrder(album) {
        const inAlbumOrder = album.tracksOriginalOrder?.length ? album.tracksOriginalOrder : album.tracks
        return inAlbumOrder.map((track, index) => ({
            ...track,
            userRank: null,
            _rank: index + 1  // 1-based ranking
        }))
    }
}
