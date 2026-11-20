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
import { entryOfEachTrack } from '../models/sameTrack.js'
import { TrackTransformer } from '../transformers/TrackTransformer.js'

export class BalancedRankingStrategy extends RankingStrategy {
    static metadata = {
        id: 'balanced',
        name: 'Balanced (Default)',
        description: 'Prioritizes Acclaim Rank, then Rating, then Score.'
    }

    rank(album) {
        if (!album) return []

        // Which entry of a list of the album is of which track is the one track rule's to say
        // (models/sameTrack.js, F74): nothing here compares titles.
        /** For each of `tracks`, the entry of `list` that is the same track, or null. */
        const entriesFor = (tracks, list) => entryOfEachTrack(tracks, Array.isArray(list) ? list : [])

        // Determine base tracks source
        const baseTracks = (() => {
            if (Array.isArray(album.tracksByAcclaim) && album.tracksByAcclaim.length > 0) {
                return album.tracksByAcclaim.map(track => ({ ...track }))
            }
            if (Array.isArray(album.rankingConsolidated) && album.rankingConsolidated.length > 0) {
                const rows = album.rankingConsolidated
                    .slice()
                    .sort((a, b) => Number(a.finalPosition || a.position || 0) - Number(b.finalPosition || b.position || 0))
                const trackOfRow = entriesFor(rows, album.tracks)
                return rows
                    .map((entry, idx) => {
                        const title = entry.trackTitle || entry.title || `Track ${idx + 1}`
                        const duration = trackOfRow[idx]?.duration || null
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

        const consolidatedOf = entriesFor(baseTracks, album.rankingConsolidated)
        const bestEverOf = entriesFor(baseTracks, album.bestEverEvidence)
        const acclaimOf = entriesFor(baseTracks, album.rankingAcclaim)
        const byAcclaimOf = entriesFor(baseTracks, album.tracks)
        const inAlbumOrderOf = entriesFor(baseTracks, album.tracksOriginalOrder)

        // Enrich each track using TrackTransformer
        const enrichedTracks = baseTracks.map((track, idx) => {
            const title = track.title || track.trackTitle || track.name || `Track ${idx + 1}`

            // The entries of the same track in the lists of the album
            const consolidatedEntry = consolidatedOf[idx]
            const bestEverEntry = bestEverOf[idx]
            const acclaimEntry = acclaimOf[idx]

            // Prepare Raw Data for Transformer
            // Priority: Explicit Consolidated -> BestEver -> Acclaim -> Track Itself
            const raw = {
                ...track,
                title: title,
                // Maps to Canonical 'acclaimRank'
                acclaimRank: track.acclaimRank
                    ?? acclaimEntry?.rank
                    ?? null,

                // Maps to Canonical 'rating'
                rating: track.rating
                    ?? consolidatedEntry?.rating
                    ?? bestEverEntry?.rating
                    ?? acclaimEntry?.rating
                    ?? null,

                // Maps to Canonical 'acclaimScore'
                acclaimScore: track.normalizedScore
                    ?? track.acclaimScore
                    ?? consolidatedEntry?.normalizedScore
                    ?? 0
            }

            // Create Canonical Track
            const canonical = TrackTransformer.toCanonical(raw, {
                artist: album.artist,
                album: album.title,
                albumId: album.id
            })

            // Spotify Enrichment (Sprint 12.5)
            // If explicit Spotify data missing, try to find it in original album context
            if (!canonical.spotifyPopularity && !canonical.spotifyRank) {
                let originalTrack = byAcclaimOf[idx]

                if (!originalTrack?.spotifyPopularity && album.tracksOriginalOrder) {
                    originalTrack = inAlbumOrderOf[idx] || undefined
                }

                if (originalTrack) {
                    Object.assign(canonical, TrackTransformer.mergeSpotifyData(canonical, originalTrack))
                }
            }

            // Fallback Rating: If still null, use Spotify Popularity
            // The mark lets a ranking that is about acclaim alone (BEA) tell a rating from its stand-in.
            if (canonical.rating === null && canonical.spotifyPopularity !== null) {
                canonical.rating = canonical.spotifyPopularity
                canonical.ratingIsPopularity = true
            }

            // Restore original index for stable sort fallback
            canonical.origIndex = idx

            return canonical
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
