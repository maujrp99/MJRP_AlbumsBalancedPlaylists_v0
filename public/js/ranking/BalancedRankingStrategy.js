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
import { TrackTransformer } from '../transformers/TrackTransformer.js'

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

        // Enrich each track using TrackTransformer
        const enrichedTracks = baseTracks.map((track, idx) => {
            const title = track.title || track.trackTitle || track.name || `Track ${idx + 1}`
            const key = localNormalizeKey(title)

            // Lookup metadata from various indices
            const consolidatedEntry = key ? consolidatedIndex.get(key) : null
            const bestEverEntry = key ? bestEverIndex.get(key) : null
            const acclaimEntry = key ? acclaimIndex.get(key) : null

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
                let originalTrack = album.tracks?.find(t => localNormalizeKey(t.title || t.name) === key)

                if (!originalTrack?.spotifyPopularity && album.tracksOriginalOrder) {
                    originalTrack = album.tracksOriginalOrder.find(t => localNormalizeKey(t.title || t.name) === key)
                }

                if (originalTrack) {
                    Object.assign(canonical, TrackTransformer.mergeSpotifyData(canonical, originalTrack))
                }
            }

            // Fallback Rating: If still null, use Spotify Popularity
            if (canonical.rating === null && canonical.spotifyPopularity !== null) {
                canonical.rating = canonical.spotifyPopularity
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
