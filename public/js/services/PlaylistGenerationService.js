/**
 * PlaylistGenerationService
 * 
 * Centralized playlist generation logic extracted from BlendingMenuView + PlaylistsView.
 * Single source of truth for track transformation and playlist generation.
 * 
 * @module services/PlaylistGenerationService
 * @since Sprint 12.5
 */

import { createAlgorithm } from '../algorithms/index.js'
import { createRankingStrategy } from '../ranking/index.js'
import { TrackTransformer } from '../transformers/TrackTransformer.js'

/**
 * @typedef {Object} GenerationConfig
 * @property {string} algorithmId - Algorithm identifier (e.g., 'mjrp-balanced-cascade')
 * @property {string} rankingId - Ranking strategy ('spotify', 'bea', 'balanced')
 * @property {number} [targetDuration] - Target duration in seconds
 * @property {string} [outputMode] - 'single' | 'multiple' | 'auto'
 * @property {boolean} [discoveryMode] - Enable discovery tracks
 * @property {string} [groupingStrategy] - 'by_album'|'flat_ranked'|'shuffle'
 */

/**
 * @typedef {Object} GenerationResult
 * @property {Playlist[]} playlists - Generated playlists with normalized tracks
 * @property {Object} stats - Generation statistics
 */

export class PlaylistGenerationService {
    /**
     * Generate playlists from albums
     * 
     * @param {Album[]} albums - Source albums with tracks
     * @param {GenerationConfig} config - Generation configuration
     * @returns {GenerationResult} - Generated playlists with normalized tracks
     */
    generate(albums, config) {
        // Validate config
        const validation = this.validateConfig(config)
        if (!validation.valid) {
            throw new Error(`Invalid config: ${validation.errors.join(', ')}`)
        }

        // Create algorithm instance
        const algorithm = createAlgorithm(config.algorithmId)
        if (!algorithm) {
            throw new Error(`Unknown algorithm: ${config.algorithmId}`)
        }

        // Determine ranking strategy
        // TopN algorithms have fixed ranking (popular=spotify, acclaimed=bea)
        let rankingId = config.rankingId || 'balanced'
        if (config.algorithmId.includes('popular')) {
            rankingId = 'spotify' // Locked for TopN Popular
        } else if (config.algorithmId.includes('acclaimed')) {
            rankingId = 'bea' // Locked for TopN Acclaimed
        }

        const rankingStrategy = createRankingStrategy(rankingId)

        console.log(`[PlaylistGenerationService] Generating with algorithm: ${config.algorithmId}, ranking: ${rankingId}`)

        // Generate playlists
        const result = algorithm.generate(albums, {
            rankingStrategy,
            targetDuration: config.targetDuration,
            outputMode: config.outputMode,
            discoveryMode: config.discoveryMode,
            groupingStrategy: config.groupingStrategy
        })

        // Transform result to normalized playlist format
        // Note: Do NOT add index here - index is for DISPLAY (Grid) and EXPORT only
        const playlists = result.playlists.map((p, index) => ({
            name: p.title, // Pure title without index (e.g., "Greatest Hits Vol. 1")
            title: p.title, // Also set title for consistency
            tracks: this.transformTracks(p.tracks),
            // Preserve metadata for regeneration
            _meta: {
                algorithmId: config.algorithmId,
                rankingId
            }
        }))

        console.log(`[PlaylistGenerationService] Generated ${playlists.length} playlist(s)`)

        return {
            playlists,
            rankingId, // Return the effective ranking used
            stats: {
                totalTracks: playlists.reduce((sum, p) => sum + p.tracks.length, 0),
                totalDuration: playlists.reduce((sum, p) =>
                    sum + p.tracks.reduce((tSum, t) => tSum + (t.duration || 0), 0), 0
                )
            }
        }
    }

    /**
     * Transform raw tracks to normalized format
     * Single source of truth for track mapping
     * 
     * @param {Object[]} rawTracks - Raw tracks from algorithm
     * @returns {Object[]} - Normalized tracks with all required fields
     */
    /**
     * Transform raw tracks to normalized format
     * Single source of truth for track mapping
     * 
     * @param {Object[]} rawTracks - Raw tracks from algorithm
     * @returns {Object[]} - Normalized tracks with all required fields
     */
    transformTracks(rawTracks) {
        // Sprint 12.5: Use TrackTransformer for canonical output
        // We pass empty context as we don't have album context here, 
        // but rawTracks usually have artist/album populated by this stage.
        return rawTracks.map(t => TrackTransformer.toCanonical(t))
    }

    /**
     * Validate generation configuration
     * 
     * @param {GenerationConfig} config - Configuration to validate
     * @returns {{ valid: boolean, errors: string[] }} - Validation result
     */
    validateConfig(config) {
        const errors = []

        if (!config.algorithmId) {
            errors.push('Algorithm ID is required')
        }

        if (config.targetDuration !== undefined && config.targetDuration <= 0) {
            errors.push('Target duration must be positive')
        }

        return {
            valid: errors.length === 0,
            errors
        }
    }
}

// Singleton instance for convenience
export const playlistGenerationService = new PlaylistGenerationService()
