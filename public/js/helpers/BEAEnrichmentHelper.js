/**
 * BEAEnrichmentHelper
 * 
 * Bridges BestEverAlbums enrichment logic with album models.
 * Encapsulates API calls, data parsing, and application to Album objects.
 * 
 * Usage:
 *   await enrichAlbum(album)
 */

import { apiClient } from '../api/client.js'
import { NormalizationUtils } from '../utils/NormalizationUtils.js'

/**
 * Apply BestEverAlbums enrichment to an album.
 * Fetches fresh data if needed and updates the album object in place.
 * 
 * @param {Album} album - Album object to enrich
 * @param {Object} options - Options
 * @param {boolean} options.force - If true, force re-enrichment even if data exists (default: false)
 * @param {boolean} options.silent - If true, suppress console logs (default: false)
 * @returns {Promise<Album>} Album with BEA data applied (mutates original)
 */
export async function enrichAlbum(album, options = {}) {
    const { force = false, silent = false } = options

    if (!album || !album.artist || !album.title) {
        return album
    }

    // Already enriched? Skip unless forced
    if (album.bestEverUrl && !force) {
        return album
    }

    const log = silent ? () => { } : console.log

    try {
        log(`[BEAEnrichmentHelper] Enriching "${album.artist} - ${album.title}"...`)

        // Call API via Client Proxy
        // Note: The API Client's BEAenrichAlbum method wraps the fetch to /api/enrich-album
        const enrichmentData = await apiClient.BEAenrichAlbum({
            title: album.title,
            artist: album.artist,
            tracks: album.tracks || []
        })

        console.log('[BEA DEBUG] Raw Enrichment Data:', JSON.stringify(enrichmentData, null, 2))

        if (enrichmentData) {
            applyBEAData(album, enrichmentData)
            log(`[BEAEnrichmentHelper] ✅ Enriched "${album.title}" with ${enrichmentData.trackRatings?.length || 0} ratings.`)
        } else {
            log(`[BEAEnrichmentHelper] ⚠️ No data found for "${album.title}".`)
        }

        return album
    } catch (error) {
        console.warn(`[BEAEnrichmentHelper] Failed to enrich "${album.artist} - ${album.title}":`, error.message)
        return album // Return original on error
    }
}

/**
 * Apply BEA data to album object.
 * Maps raw API response to Album model fields.
 * 
 * @param {Album} album
 * @param {Object} enrichmentData - From API response
 */
function applyBEAData(album, enrichmentData) {
    // 1. Apply Album-Level Metadata
    if (enrichmentData.bestEverInfo?.url) {
        album.bestEverUrl = enrichmentData.bestEverInfo.url
    }
    if (enrichmentData.bestEverInfo?.albumId) {
        album.bestEverAlbumId = enrichmentData.bestEverInfo.albumId
    }

    // 2. Map Ratings to Tracks
    if (enrichmentData.trackRatings && Array.isArray(enrichmentData.trackRatings)) {
        // Create O(1) Lookup Map
        // Key: Normalized Title
        const ratingsMap = new Map()
        enrichmentData.trackRatings.forEach(r => {
            if (r.rating !== null && r.rating !== undefined) {
                ratingsMap.set(normalizeTrackTitle(r.title), r.rating)
            }
        })

        // Apply to 'tracks' (Acclaim Order)
        if (album.tracks) {
            album.tracks.forEach(track => {
                const key = normalizeTrackTitle(track.title)
                if (ratingsMap.has(key)) {
                    track.rating = ratingsMap.get(key)
                }
            })
        }

        // Apply to 'tracksOriginalOrder' (Disk Order) - Ensuring consistency
        if (album.tracksOriginalOrder) {
            album.tracksOriginalOrder.forEach(track => {
                const key = normalizeTrackTitle(track.title)
                if (ratingsMap.has(key)) {
                    track.rating = ratingsMap.get(key)
                }
            })
        }

        // 3. Update Acclaim Metadata
        // If we successfully applied ratings, mark the source
        if (ratingsMap.size > 0) {
            album.acclaim = {
                ...album.acclaim,
                hasRatings: true,
                source: 'best-ever-albums',
                enrichedAt: new Date().toISOString()
            }
        }

        // 4. Map Evidence (Sprint 23)
        if (enrichmentData.trackEvidence && Array.isArray(enrichmentData.trackEvidence)) {
            const evidenceLookup = new Map()
            enrichmentData.trackEvidence.forEach(e => {
                if (e.evidence && e.evidence.length > 0) {
                    evidenceLookup.set(normalizeTrackTitle(e.title), e.evidence)
                }
            })

            const applyEvidence = (track) => {
                const key = normalizeTrackTitle(track.title)
                if (evidenceLookup.has(key)) {
                    // Ensure ranking object exists
                    if (!track.ranking) track.ranking = {}
                    track.ranking.evidence = evidenceLookup.get(key)
                }
            }

            if (album.tracks) album.tracks.forEach(applyEvidence)
            if (album.tracksOriginalOrder) album.tracksOriginalOrder.forEach(applyEvidence)
        }

        // 5. Re-sort album.tracks by Rating (Desc) now that we have fresh data
        // This ensures the "Acclaim" view is actually sorted by acclaim
        if (album.tracks) {
            album.tracks.sort((a, b) => {
                const ratingA = (typeof a.rating === 'number') ? a.rating : -1
                const ratingB = (typeof b.rating === 'number') ? b.rating : -1

                // Primary: Rating Descending
                if (ratingA !== ratingB) return ratingB - ratingA

                // Secondary: Track Number Ascending (for ties)
                const numA = a.trackNumber || a.position || 0
                const numB = b.trackNumber || b.position || 0
                return numA - numB
            })

            // Re-assign ranks based on new sort order
            album.tracks.forEach((t, idx) => {
                t.rank = idx + 1
                if (t.ranking) t.ranking.rank = idx + 1
            })
        }
    }
}



/**
 * Helper: Normalize track title for fuzzy matching key
 * @param {string} title 
 * @returns {string}
 */
function normalizeTrackTitle(title) {
    if (!title) return ''
    return NormalizationUtils.toCore(title)
}
