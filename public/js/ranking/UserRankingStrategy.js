/**
 * UserRankingStrategy
 * 
 * Ranking strategy that uses user-defined track rankings.
 * Falls back to original album position if no user ranking exists.
 * 
 * Part of the Strategy Pattern for "Source of Truth" selection.
 * Color: Incandescent Blue (#0EA5E9 / sky-500)
 * 
 * @module ranking/UserRankingStrategy
 * @since Sprint 20
 */

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

        // Check if album has user ranking data
        if (!album.userRanking || album.userRanking.length === 0) {
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
        // Create lookup map: normalized track title -> user rank
        const userRankMap = new Map(
            album.userRanking.map(r => [
                this._normalizeKey(r.trackTitle),
                r.userRank
            ])
        )

        // Apply user ranks to tracks
        const rankedTracks = album.tracks.map(track => {
            const key = this._normalizeKey(track.title)
            const userRank = userRankMap.get(key)

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
     * Fallback: return tracks in original album order
     * @param {Object} album - Album object
     * @returns {Array} Tracks with _rank based on original position
     * @private
     */
    _fallbackToOriginalOrder(album) {
        return album.tracks.map((track, index) => ({
            ...track,
            userRank: null,
            _rank: index + 1  // 1-based ranking
        }))
    }

    /**
     * Normalize track title for matching
     * Handles case differences, extra spaces, special characters
     * @param {string} title - Track title
     * @returns {string} Normalized key
     * @private
     */
    _normalizeKey(title) {
        if (!title) return ''
        return title
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ')           // Collapse multiple spaces
            .replace(/['']/g, "'")           // Normalize quotes
            .replace(/[""]/g, '"')           // Normalize double quotes
            .replace(/[^\w\s'"-]/g, '')      // Remove special chars
    }
}
