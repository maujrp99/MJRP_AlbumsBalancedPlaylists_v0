/**
 * SpotifyEnrichmentService
 * 
 * Background worker that enriches albums with Spotify data when user connects.
 * Features:
 * - Builds queue from all series' albumQueries
 * - Rate-limited batch processing
 * - Progress notifications via event subscription
 * - Pause/resume functionality
 * 
 * @see docs/technical/specs/sprint12-architecture-v3.0/blending-menu/background-enrichment-spec.md
 */

import { spotifyEnrichmentStore } from '../stores/SpotifyEnrichmentStore.js'
import { albumSeriesStore } from '../stores/albumSeries.js'
import { SpotifyService } from './SpotifyService.js'

class SpotifyEnrichmentService {

    constructor() {
        this.queue = []
        this.isRunning = false
        this.isPaused = false
        this.completed = 0
        this.failed = 0
        this.total = 0
        this.listeners = new Set()
    }

    /**
     * Start the background enrichment process.
     * Call this after Spotify auth succeeds.
     */
    async startEnrichment() {
        if (this.isRunning) {
            console.log('[EnrichmentService] Already running')
            return
        }

        // Check if Spotify is available
        if (!SpotifyService.isAvailable()) {
            console.log('[EnrichmentService] Spotify not connected, skipping enrichment')
            this.notify({ type: 'error', message: 'Spotify not connected' })
            return
        }

        console.log('[EnrichmentService] Starting enrichment...')

        // Build queue from all albums that need enrichment
        this.queue = await this.buildQueue()
        this.total = this.queue.length
        this.completed = 0
        this.failed = 0

        if (this.total === 0) {
            console.log('[EnrichmentService] All albums already enriched!')
            this.notify({ type: 'already_complete', message: 'All albums already enriched' })
            return
        }

        this.isRunning = true
        this.isPaused = false

        console.log(`[EnrichmentService] Queue built with ${this.total} albums`)
        this.notify({ type: 'started', total: this.total })

        await this.processQueue()
    }

    /**
     * Build queue of albums needing enrichment from all series.
     * @returns {Promise<Array>} List of {artist, album} objects
     */
    async buildQueue() {
        const needsEnrichment = []
        const processed = new Set() // Avoid duplicates

        // Get all series
        const allSeries = albumSeriesStore.getSeries()

        for (const series of allSeries) {
            const albumQueries = series.albumQueries || []

            for (const query of albumQueries) {
                // Parse "Artist - Album" format
                const parsed = this.parseAlbumQuery(query)
                if (!parsed) continue

                const key = spotifyEnrichmentStore.normalizeKey(parsed.artist, parsed.album)

                // Skip duplicates
                if (processed.has(key)) continue
                processed.add(key)

                // Check if already has valid enrichment
                const hasValid = await spotifyEnrichmentStore.hasValidEnrichment(
                    parsed.artist,
                    parsed.album
                )

                if (!hasValid) {
                    needsEnrichment.push(parsed)
                }
            }
        }

        return needsEnrichment
    }

    /**
     * Parse album query string into artist and album parts.
     * Expected format: "Artist - Album" or "Artist - Album Title"
     * 
     * @param {string} query - Album query string
     * @returns {{artist: string, album: string}|null}
     */
    parseAlbumQuery(query) {
        if (!query || typeof query !== 'string') return null

        // Also handle object format {artist, album}
        if (typeof query === 'object' && query.artist && query.album) {
            return { artist: query.artist, album: query.album }
        }

        // Split by " - " (standard separator)
        const parts = query.split(' - ')

        if (parts.length < 2) {
            console.warn(`[EnrichmentService] Cannot parse query: "${query}"`)
            return null
        }

        return {
            artist: parts[0].trim(),
            album: parts.slice(1).join(' - ').trim() // In case album has " - " in it
        }
    }

    /**
     * Process the queue with rate limiting.
     * 
     * Rate limit: 100ms between requests = 10 req/sec max
     * Spotify rate limit is ~30+ req/sec, so we're well under.
     */
    async processQueue() {
        const DELAY_MS = 100 // 10 req/sec max

        while (this.queue.length > 0 && this.isRunning) {
            // Check if paused
            if (this.isPaused) {
                console.log('[EnrichmentService] Paused, waiting...')
                await this.sleep(500)
                continue
            }

            const item = this.queue.shift()
            await this.enrichAlbum(item)

            // Rate limiting delay
            if (this.queue.length > 0) {
                await this.sleep(DELAY_MS)
            }
        }

        this.isRunning = false

        console.log(`[EnrichmentService] Completed: ${this.completed}/${this.total}, Failed: ${this.failed}`)
        this.notify({
            type: 'completed',
            completed: this.completed,
            failed: this.failed,
            total: this.total
        })
    }

    /**
     * Enrich a single album.
     * 
     * @param {{artist: string, album: string}} item
     */
    async enrichAlbum(item) {
        try {
            // Call SpotifyService to get enrichment data
            const data = await SpotifyService.enrichAlbumData(item.artist, item.album)

            if (data) {
                // Save to Firestore via store
                await spotifyEnrichmentStore.save(item.artist, item.album, {
                    spotifyId: data.spotifyId,
                    spotifyUrl: data.spotifyUrl,
                    spotifyPopularity: data.spotifyPopularity,
                    spotifyArtwork: data.spotifyArtwork,
                    trackPopularity: data.spotifyTracks || []
                })

                this.completed++
            } else {
                // Album not found on Spotify
                this.failed++
            }

            // Notify progress
            this.notify({
                type: 'progress',
                completed: this.completed,
                failed: this.failed,
                total: this.total,
                current: `${item.artist} - ${item.album}`
            })

        } catch (error) {
            console.error(`[EnrichmentService] Failed to enrich: ${item.artist} - ${item.album}`, error)
            this.failed++

            // Check if it's a rate limit error
            if (error.message?.includes('Rate Limited')) {
                console.log('[EnrichmentService] Rate limited, waiting 5 seconds...')
                await this.sleep(5000)
                // Re-add to queue to retry
                this.queue.unshift(item)
            }
        }
    }

    /**
     * Pause the enrichment process.
     */
    pause() {
        if (!this.isRunning) return
        this.isPaused = true
        console.log('[EnrichmentService] Paused')
        this.notify({ type: 'paused' })
    }

    /**
     * Resume the enrichment process.
     */
    resume() {
        if (!this.isRunning || !this.isPaused) return
        this.isPaused = false
        console.log('[EnrichmentService] Resumed')
        this.notify({ type: 'resumed' })
    }

    /**
     * Stop the enrichment process completely.
     */
    stop() {
        this.isRunning = false
        this.isPaused = false
        this.queue = []
        console.log('[EnrichmentService] Stopped')
        this.notify({ type: 'stopped' })
    }

    /**
     * Get current status.
     * @returns {Object} Status object
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            completed: this.completed,
            failed: this.failed,
            total: this.total,
            remaining: this.queue.length
        }
    }

    /**
     * Subscribe to enrichment events.
     * 
     * Events:
     * - { type: 'started', total }
     * - { type: 'progress', completed, failed, total, current }
     * - { type: 'completed', completed, failed, total }
     * - { type: 'paused' }
     * - { type: 'resumed' }
     * - { type: 'stopped' }
     * - { type: 'error', message }
     * - { type: 'already_complete', message }
     * 
     * @param {Function} callback - Event handler
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback) {
        this.listeners.add(callback)
        return () => this.listeners.delete(callback)
    }

    /**
     * Notify all subscribers of an event.
     * @param {Object} event
     */
    notify(event) {
        this.listeners.forEach(callback => {
            try {
                callback(event)
            } catch (error) {
                console.error('[EnrichmentService] Subscriber error:', error)
            }
        })
    }

    /**
     * Sleep helper for rate limiting.
     * @param {number} ms
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
}

// Singleton instance
export const spotifyEnrichmentService = new SpotifyEnrichmentService()
