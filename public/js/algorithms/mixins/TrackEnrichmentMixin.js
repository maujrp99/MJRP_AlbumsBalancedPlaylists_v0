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
                const copy = { ...track }
                const title = copy.title || copy.trackTitle || copy.name || `Track ${idx + 1}`
                copy.title = title
                const key = this.normalizeKey(title)
                const consolidatedEntry = key ? consolidatedIndex.get(key) : null

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
                    if (copy.acclaimScore !== undefined && copy.acclaimScore !== null) return Number(copy.acclaimScore)
                    if (copy.normalizedScore !== undefined && copy.normalizedScore !== null) return Number(copy.normalizedScore)
                    if (consolidatedEntry?.normalizedScore !== undefined && consolidatedEntry?.normalizedScore !== null) {
                        return Number(consolidatedEntry.normalizedScore)
                    }
                    if (rating !== null) return Number(rating)
                    return null
                })()

                // Determine acclaim rank
                const acclaimRank = (() => {
                    if (copy.acclaimRank !== undefined && copy.acclaimRank !== null) return Number(copy.acclaimRank)
                    if (copy.rank !== undefined && copy.rank !== null) return Number(copy.rank)
                    if (consolidatedEntry?.finalPosition !== undefined && consolidatedEntry?.finalPosition !== null) {
                        return Number(consolidatedEntry.finalPosition)
                    }
                    return null
                })()

                const durationFromIndex = key && durationIndex.has(key) ? durationIndex.get(key) : null

                copy.id = copy.id || `track_${album.id || 'album'}_${idx + 1}`
                copy.originAlbumId = copy.originAlbumId || album.id || null
                copy.duration = copy.duration !== undefined && copy.duration !== null ? copy.duration : durationFromIndex
                copy.artist = copy.artist || album.artist || ''
                copy.album = copy.album || album.title || ''
                copy.rating = rating
                copy.acclaimScore = normalizedScore
                copy.acclaimRank = acclaimRank
                copy.canonicalRank = canonicalRank
                copy.spotifyPopularity = copy.spotifyPopularity
                copy.origIndex = idx

                return copy
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

            // Sprint 12.5: Calculate spotifyRank based on spotifyPopularity
            // Sort by popularity desc and assign ranks
            const byPopularity = [...sortedTracks].sort((a, b) => {
                const popA = a.spotifyPopularity ?? -1
                const popB = b.spotifyPopularity ?? -1
                return popB - popA // Higher popularity = lower rank (better)
            })
            byPopularity.forEach((track, idx) => {
                if (!track) return
                // Only assign rank if track has valid popularity
                if (track.spotifyPopularity !== undefined && track.spotifyPopularity !== null && track.spotifyPopularity > -1) {
                    track.spotifyRank = idx + 1
                }
            })

            return sortedTracks
        }
    }
}

export default TrackEnrichmentMixin
