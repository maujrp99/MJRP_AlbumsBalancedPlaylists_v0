/**
 * BalancedRankingStrategy
 * 
 * Logic:
 * 1. Prioritize Explicit Acclaim Rank (Greatest Hits)
 * 2. Fallback to User Rating / Acclaim Rating
 * 3. Fallback to Calculated Score
 * 4. Fallback to Spotify Popularity (if available)
 * 
 * This strategy mirrors the "Legacy" logic but strictly for ranking.
 * 
 * @module ranking/BalancedRankingStrategy
 */
import { RankingStrategy } from './RankingStrategy.js'

export class BalancedRankingStrategy extends RankingStrategy {
    static metadata = {
        id: 'balanced',
        name: 'Balanced (Default)',
        description: 'Prioritizes Acclaim Rank, then Rating, then Score.'
    }

    rank(album) {
        if (!album) return []

        const localNormalizeKey = (str) => str ? str.toLowerCase().trim().replace(/[^a-z0-9]/g, '') : ''

        // Build indexes from album metadata (Copied logic from Legacy)
        const consolidatedIndex = new Map()
        if (Array.isArray(album.rankingConsolidated)) {
            album.rankingConsolidated.forEach(entry => {
                const key = localNormalizeKey(entry?.trackTitle || entry?.title || '')
                if (key) consolidatedIndex.set(key, entry)
            })
        }

        const bestEverIndex = new Map()
        if (Array.isArray(album.bestEverEvidence)) {
            album.bestEverEvidence.forEach(entry => {
                const key = localNormalizeKey(entry?.trackTitle || entry?.title || '')
                if (key) bestEverIndex.set(key, entry)
            })
        }

        const acclaimIndex = new Map()
        if (Array.isArray(album.rankingAcclaim)) {
            album.rankingAcclaim.forEach(entry => {
                const key = localNormalizeKey(entry?.trackTitle || entry?.title || '')
                if (key) acclaimIndex.set(key, entry)
            })
        }

        const durationIndex = new Map()
        if (Array.isArray(album.tracks)) {
            album.tracks.forEach(track => {
                const key = localNormalizeKey(track?.title || track?.trackTitle || track?.name || '')
                if (key && track) durationIndex.set(key, track.duration || null)
            })
        }

        // Determine base tracks source
        const baseTracks = (() => {
            if (Array.isArray(album.tracksByAcclaim) && album.tracksByAcclaim.length > 0) {
                return album.tracksByAcclaim.map(track => ({ ...track }))
            }
            if (Array.isArray(album.rankingConsolidated) && album.rankingConsolidated.length > 0) {
                return album.rankingConsolidated
                    .slice()
                    .sort((a, b) => Number(a.finalPosition || a.position || 0) - Number(b.finalPosition || b.position || 0))
                    .map((entry, idx) => {
                        const title = entry.trackTitle || entry.title || `Track ${idx + 1}`
                        const key = localNormalizeKey(title)
                        const duration = key && durationIndex.has(key) ? durationIndex.get(key) : null
                        return {
                            id: entry.id || `consolidated_${album.id || 'album'}_${idx + 1}`,
                            title,
                            artist: album.artist || '',
                            album: album.title || '',
                            rank: entry.finalPosition || entry.position || null,
                            rating: entry.rating !== undefined ? entry.rating : null,
                            normalizedScore: entry.normalizedScore !== undefined ? entry.normalizedScore : null,
                            duration,
                            originAlbumId: album.id || null
                        }
                    })
            }
            return Array.isArray(album.tracks) ? album.tracks.map(track => ({ ...track })) : []
        })()

        // Enrich each track
        const enrichedTracks = baseTracks.map((track, idx) => {
            const copy = { ...track }
            const title = copy.title || copy.trackTitle || copy.name || `Track ${idx + 1}`
            copy.title = title
            const key = localNormalizeKey(title)
            const consolidatedEntry = key ? consolidatedIndex.get(key) : null

            // Spotify Data (if available on original track object)
            // Look for it in the original album.tracks list if baseTracks came from ranking
            if (!copy.spotifyPopularity) {
                const originalTrack = album.tracks?.find(t => localNormalizeKey(t.title || t.name) === key)
                if (originalTrack) {
                    copy.spotifyId = originalTrack.spotifyId || originalTrack.id
                    copy.spotifyUri = originalTrack.spotifyUri || originalTrack.uri
                    copy.spotifyPopularity = originalTrack.popularity ?? originalTrack.spotifyPopularity
                }
            }

            // Determine canonical rank
            const canonicalRank = (() => {
                if (copy.canonicalRank !== undefined && copy.canonicalRank !== null) return Number(copy.canonicalRank)
                if (copy.rank !== undefined && copy.rank !== null) return Number(copy.rank)
                if (consolidatedEntry?.finalPosition !== undefined && consolidatedEntry?.finalPosition !== null) {
                    return Number(consolidatedEntry.finalPosition)
                }
                return null
            })()

            // Determine rating
            const rating = (() => {
                if (copy.rating !== undefined && copy.rating !== null) return Number(copy.rating)
                if (consolidatedEntry?.rating !== undefined && consolidatedEntry?.rating !== null) {
                    return Number(consolidatedEntry.rating)
                }
                const be = key ? bestEverIndex.get(key) : null
                if (be?.rating !== undefined && be?.rating !== null) return Number(be.rating)
                const ac = key ? acclaimIndex.get(key) : null
                if (ac?.rating !== undefined && ac?.rating !== null) return Number(ac.rating)

                // Fallback: Spotify Popularity
                if (copy.spotifyPopularity !== undefined && copy.spotifyPopularity !== null && copy.spotifyPopularity > -1) {
                    return Number(copy.spotifyPopularity)
                }

                return null
            })()

            // Determine normalized score
            const normalizedScore = (() => {
                if (copy.normalizedScore !== undefined && copy.normalizedScore !== null) return Number(copy.normalizedScore)
                if (consolidatedEntry?.normalizedScore !== undefined && consolidatedEntry?.normalizedScore !== null) {
                    return Number(consolidatedEntry.normalizedScore)
                }
                return 0
            })()

            // Explicit Acclaim Rank (Top 1-2 often fixed)
            const acclaimRank = (() => {
                if (copy.acclaimRank !== undefined && copy.acclaimRank !== null) return Number(copy.acclaimRank)
                const ac = key ? acclaimIndex.get(key) : null
                if (ac?.rank !== undefined && ac?.rank !== null) return Number(ac.rank)
                return null
            })()

            copy.acclaimRank = acclaimRank
            copy.rating = rating
            copy.normalizedScore = normalizedScore
            copy.canonicalRank = canonicalRank
            copy.origIndex = idx

            return copy
        })

        // SORT logic (The "Strategy")
        enrichedTracks.sort((a, b) => {
            // 1. Explicit Acclaim Rank (Primary) - small is better (1, 2)
            const rankA = a.acclaimRank !== null ? a.acclaimRank : Number.POSITIVE_INFINITY
            const rankB = b.acclaimRank !== null ? b.acclaimRank : Number.POSITIVE_INFINITY
            if (rankA !== rankB) return rankA - rankB

            // 2. Rating (Secondary) - High is better
            const ratingA = a.rating !== null ? a.rating : -1
            const ratingB = b.rating !== null ? b.rating : -1
            if (ratingA !== ratingB) return ratingB - ratingA

            // 3. Score (Tertiary) - High is better
            const scoreA = a.normalizedScore || 0
            const scoreB = b.normalizedScore || 0
            if (scoreA !== scoreB) return scoreB - scoreA

            // 4. Default: Original Order
            return (a.origIndex || 0) - (b.origIndex || 0)
        })

        // Normalize _rank property (1-based index based on sort)
        enrichedTracks.forEach((track, index) => {
            track._rank = index + 1
        })

        return enrichedTracks
    }
}
