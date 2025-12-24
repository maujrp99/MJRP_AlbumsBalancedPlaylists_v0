/**
 * SpotifyEnrichmentHelper
 * 
 * Bridges SpotifyEnrichmentStore with album display.
 * Applies cached enrichment data to album objects.
 * 
 * Usage:
 *   const enrichedAlbum = await applyEnrichmentToAlbum(album)
 */

import { spotifyEnrichmentStore } from '../stores/SpotifyEnrichmentStore.js'
import { SpotifyService } from '../services/SpotifyService.js'
import { TrackTransformer } from '../transformers/TrackTransformer.js'

/**
 * Apply cached Spotify enrichment to an album.
 * If no cached data exists, optionally fetches fresh data.
 * 
 * @param {Album} album - Album object to enrich
 * @param {Object} options - Options
 * @param {boolean} options.fetchIfMissing - If true, fetch from Spotify if no cache (default: true)
 * @param {boolean} options.silent - If true, suppress console logs (default: false)
 * @returns {Promise<Album>} Album with Spotify data applied (mutates original)
 */
export async function applyEnrichmentToAlbum(album, options = {}) {
    const { fetchIfMissing = true, silent = false } = options

    if (!album || !album.artist || !album.title) {
        return album
    }

    // Already enriched? Skip
    if (album.spotifyId) {
        return album
    }

    const log = silent ? () => { } : console.log

    try {
        // 1. Try to get cached enrichment
        const cached = await spotifyEnrichmentStore.get(album.artist, album.title)

        if (cached) {
            log(`[EnrichmentHelper] Applying cached data to "${album.artist} - ${album.title}"`)
            applySpotifyData(album, cached)
            return album
        }

        // 2. No cache - optionally fetch fresh
        if (fetchIfMissing && SpotifyService.isAvailable()) {
            log(`[EnrichmentHelper] Fetching fresh data for "${album.artist} - ${album.title}"`)

            const freshData = await SpotifyService.enrichAlbumData(album.artist, album.title)

            if (freshData) {
                // Convert SpotifyService format to EnrichmentStore format
                const enrichmentData = {
                    spotifyId: freshData.spotifyId,
                    spotifyUrl: freshData.spotifyUrl,
                    spotifyPopularity: freshData.spotifyPopularity,
                    spotifyArtwork: freshData.spotifyArtwork,
                    trackPopularity: freshData.spotifyTracks || []
                }

                // Save for future use
                await spotifyEnrichmentStore.save(album.artist, album.title, enrichmentData)

                // Apply to album
                applySpotifyData(album, enrichmentData, freshData.trackPopularityMap)
            }
        }

        return album
    } catch (error) {
        console.warn(`[EnrichmentHelper] Failed to enrich "${album.artist} - ${album.title}":`, error.message)
        return album
    }
}

/**
 * Apply Spotify data to album object.
 * @param {Album} album
 * @param {Object} enrichmentData - From EnrichmentStore or SpotifyService
 * @param {Map} [trackPopularityMap] - Optional Map for track matching
 */
function applySpotifyData(album, enrichmentData, trackPopularityMap = null) {
    // Apply album-level data
    album.spotifyId = enrichmentData.spotifyId
    album.spotifyUrl = enrichmentData.spotifyUrl
    album.spotifyPopularity = enrichmentData.spotifyPopularity

    if (enrichmentData.spotifyArtwork && !album.coverUrl) {
        album.coverUrl = enrichmentData.spotifyArtwork
    }

    // Build track popularity map from stored data if not provided
    if (!trackPopularityMap && enrichmentData.trackPopularity) {
        trackPopularityMap = new Map()
        enrichmentData.trackPopularity.forEach(track => {
            const normalizedTitle = track.name?.toLowerCase().trim()
            if (normalizedTitle) {
                trackPopularityMap.set(normalizedTitle, {
                    popularity: track.popularity,
                    spotifyId: track.spotifyId,
                    spotifyUri: track.spotifyUri
                })
            }
        })
    }

    if (!trackPopularityMap) return

    // Helper: Normalize title for fuzzy matching
    const normalizeTitle = (str) =>
        str?.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim() || ''

    // Helper: Find best match from stored tracks
    const findMatch = (trackTitle) => {
        const normalized = normalizeTitle(trackTitle)
        const exactKey = trackTitle.toLowerCase().trim()

        // Exact match
        if (trackPopularityMap.has(exactKey)) {
            return trackPopularityMap.get(exactKey)
        }

        // Fuzzy match
        for (const [key, data] of trackPopularityMap) {
            const keyNorm = normalizeTitle(key)
            if (keyNorm === normalized ||
                keyNorm.includes(normalized) ||
                normalized.includes(keyNorm)) {
                return data
            }
        }
        return null
    }

    // Apply to tracks
    const applyToTrack = (track) => {
        const match = findMatch(track.title)
        if (match) {
            track.spotifyPopularity = match.popularity
            track.spotifyId = match.spotifyId
            track.spotifyUri = match.spotifyUri
        }
    }

    album.tracks?.forEach(applyToTrack)
    album.tracksOriginalOrder?.forEach(applyToTrack)

    // Sprint 12.5: Use TrackTransformer for rank calculation
    // This ensures consistent spotifyRank across all track arrays
    if (album.tracks?.length > 0) {
        TrackTransformer.calculateSpotifyRanks(album.tracks)
    }
    if (album.tracksOriginalOrder?.length > 0) {
        TrackTransformer.calculateSpotifyRanks(album.tracksOriginalOrder)
    }
}

/**
 * Apply enrichment to multiple albums in parallel.
 * @param {Album[]} albums
 * @param {Object} options
 * @returns {Promise<Album[]>}
 */
export async function applyEnrichmentToAlbums(albums, options = {}) {
    const { batchSize = 5 } = options

    // Process in batches to avoid rate limiting
    for (let i = 0; i < albums.length; i += batchSize) {
        const batch = albums.slice(i, i + batchSize)
        await Promise.all(batch.map(album => applyEnrichmentToAlbum(album, options)))
    }

    return albums
}
