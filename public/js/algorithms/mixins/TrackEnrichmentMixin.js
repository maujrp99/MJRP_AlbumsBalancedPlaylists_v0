/**
 * TrackEnrichmentMixin - Shared track enrichment logic
 * 
 * Provides methods for enriching tracks with ranking data from album metadata.
 * This includes consolidating data from multiple sources (BEA, Spotify, etc).
 * 
 * Usage:
 *   class MyAlgorithm extends applyMixin(BaseAlgorithm, TrackEnrichmentMixin) { ... }
 * 
 * @module algorithms/mixins/TrackEnrichmentMixin
 */
import { TrackTransformer } from '../../transformers/TrackTransformer.js'

/**
 * Mixin that adds track enrichment capabilities
 * @param {Function} Base - Base class to extend
 * @returns {Function} Extended class with enrichment methods
 */
export function TrackEnrichmentMixin(Base) {
    return class extends Base {
        /**
         * Normalize string for matching
         * @param {string} str 
         * @returns {string}
         */
        normalizeKey(str) {
            return str ? str.toLowerCase().trim().replace(/[^\w\s]/g, '') : ''
        }

        /**
         * Enrich tracks with ranking data from album metadata
         * @param {Object} album 
         * @returns {Array} Enriched tracks
         */
        enrichTracks(album) {
            if (!album) return []

            // Build indexes from album metadata
            const consolidatedIndex = new Map()
            if (Array.isArray(album.rankingConsolidated)) {
                album.rankingConsolidated.forEach(entry => {
                    const key = this.normalizeKey(entry?.trackTitle || entry?.title || '')
                    if (key) consolidatedIndex.set(key, entry)
                })
            }

            const bestEverIndex = new Map()
            if (Array.isArray(album.bestEverEvidence)) {
                album.bestEverEvidence.forEach(entry => {
                    const key = this.normalizeKey(entry?.trackTitle || entry?.title || '')
                    if (key) bestEverIndex.set(key, entry)
                })
            }

            const acclaimIndex = new Map()
            if (Array.isArray(album.rankingAcclaim)) {
                album.rankingAcclaim.forEach(entry => {
                    const key = this.normalizeKey(entry?.trackTitle || entry?.title || '')
                    if (key) acclaimIndex.set(key, entry)
                })
            }

            const durationIndex = new Map()
            if (Array.isArray(album.tracks)) {
                album.tracks.forEach(track => {
                    const key = this.normalizeKey(track?.title || track?.trackTitle || track?.name || '')
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
                            const key = this.normalizeKey(title)
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
                const title = track.title || track.trackTitle || track.name || `Track ${idx + 1}`
                const key = this.normalizeKey(title)

                const consolidatedEntry = key ? consolidatedIndex.get(key) : null
                const bestEverEntry = key ? bestEverIndex.get(key) : null
                const acclaimEntry = key ? acclaimIndex.get(key) : null

                // Determine duration
                const durationFromIndex = key && durationIndex.has(key) ? durationIndex.get(key) : null
                const finalDuration = track.duration !== undefined && track.duration !== null ? track.duration : durationFromIndex

                // Prepare Raw for Transformer
                const raw = {
                    ...track,
                    title,
                    duration: finalDuration,

                    // Maps to Canonical 'acclaimRank'
                    acclaimRank: track.acclaimRank
                        ?? acclaimEntry?.rank
                        ?? null,

                    // Maps to Canonical 'rating' (Priority: Track -> Consolidated -> BEA -> Acclaim -> Spotify)
                    rating: track.rating
                        ?? consolidatedEntry?.rating
                        ?? bestEverEntry?.rating
                        ?? acclaimEntry?.rating
                        ?? (track.spotifyPopularity > -1 ? track.spotifyPopularity : null),

                    // Maps to Canonical 'acclaimScore'
                    acclaimScore: track.acclaimScore
                        ?? track.normalizedScore
                        ?? consolidatedEntry?.normalizedScore
                        ?? (track.rating !== undefined ? track.rating : null), // Fallback to rating if score missing

                    // Maps to Canonical 'position'
                    position: track.position || track.trackNumber || (idx + 1)
                }

                // 3. Transform to Canonical
                // Note: Algorithms often run client-side where we might not have full album context
                // so we pass available context
                const canonical = TrackTransformer.toCanonical(raw, {
                    artist: album.artist,
                    album: album.title,
                    albumId: album.id
                })

                // Restore algo-specific props
                canonical.origIndex = idx
                // Ensure ID is unique if missing
                if (!canonical.id || canonical.id.startsWith('track_')) {
                    canonical.id = `track_${album.id || 'album'}_${idx + 1}`
                }

                // Calculate Canonical Rank (Logic specific to this Mixin's history)
                canonical.canonicalRank = (() => {
                    if (track.canonicalRank !== undefined && track.canonicalRank !== null) return Number(track.canonicalRank)
                    if (track.rank !== undefined && track.rank !== null) return Number(track.rank)
                    if (consolidatedEntry?.finalPosition) return Number(consolidatedEntry.finalPosition)
                    return null
                })()

                return canonical
            })

            // Sort by score/rating and assign final ranks
            const sortedTracks = [...enrichedTracks]
            sortedTracks.sort((a, b) => {
                const ratingA = a.rating !== undefined && a.rating !== null ? Number(a.rating) : null
                const ratingB = b.rating !== undefined && b.rating !== null ? Number(b.rating) : null
                const scoreA = a.acclaimScore !== undefined && a.acclaimScore !== null ? Number(a.acclaimScore) : null
                const scoreB = b.acclaimScore !== undefined && b.acclaimScore !== null ? Number(b.acclaimScore) : null

                // Primary: Acclaim Rank (if explicit)
                const rankA = a.acclaimRank !== null ? a.acclaimRank : Number.POSITIVE_INFINITY
                const rankB = b.acclaimRank !== null ? b.acclaimRank : Number.POSITIVE_INFINITY
                if (rankA !== rankB) return rankA - rankB

                // Secondary: Rating (includes Spotify Popularity now)
                if (ratingB !== null && ratingA !== null && ratingB !== ratingA) return ratingB - ratingA

                // Tertiary: Score
                if (scoreB !== null && scoreA !== null && scoreB !== scoreA) return scoreB - scoreA

                // Quaternary: Original Order
                return (a.origIndex || 0) - (b.origIndex || 0)
            })

            sortedTracks.forEach((track, idx) => {
                if (!track) return
                if (track.acclaimRank === null) {
                    track.acclaimRank = idx + 1
                }
                if (track.canonicalRank === undefined || track.canonicalRank === null) {
                    track.canonicalRank = track.rank !== undefined && track.rank !== null ? Number(track.rank) : null
                }
                track.rank = track.acclaimRank
            })

            // Sprint 12.5: Use TrackTransformer for consistent spotifyRank calculation
            TrackTransformer.calculateSpotifyRanks(sortedTracks)

            return sortedTracks
        }
    }
}

export default TrackEnrichmentMixin
