/**
 * PlaylistGenerationService
 * 
 * Centralized playlist generation logic extracted from the old Blending menu and the playlists screen.
 * Single source of truth for track transformation and playlist generation.
 * 
 * @module services/PlaylistGenerationService
 * @since Sprint 12.5
 */

import { createAlgorithm, getAlgorithm } from '../algorithms/index.js'
import { createRankingStrategy } from '../ranking/index.js'
import { TrackTransformer } from '../transformers/TrackTransformer.js'
import { resolveRankingId } from '../models/recipeSources.js'
import { track } from './usage/track.js'

/**
 * @typedef {Object} GenerationConfig
 * @property {string} algorithmId - Algorithm identifier (e.g., 'mjrp-balanced-cascade')
 * @property {string} rankingId - Ranking strategy ('spotify', 'bea', 'balanced')
 * @property {number} [targetDuration] - Target duration in seconds
 * @property {string} [outputMode] - 'single' | 'multiple' | 'auto'
 * @property {string} [groupingStrategy] - 'by_album'|'flat_ranked'|'shuffle'
 */

/**
 * @typedef {Object} GenerationResult
 * @property {Playlist[]} playlists - Generated playlists with normalized tracks
 * @property {Object} stats - Generation statistics
 */

/** The options of a recipe that are remembered with the playlists it generated. */
const REMEMBERED_OPTIONS = ['trackCount', 'outputMode', 'groupingStrategy', 'targetDuration', 'skip']

/**
 * What the generated playlists remember of their recipe. Only what was chosen: an option left
 * out is not written (the database refuses a field with no value).
 * @param {GenerationConfig} config
 * @param {string} rankingId - the ranking the recipe was generated with
 * @returns {Object}
 */
export function generationMeta(config, rankingId) {
    const meta = { algorithmId: config.algorithmId, rankingId }
    REMEMBERED_OPTIONS.forEach(option => {
        if (config[option] !== undefined && config[option] !== null) meta[option] = config[option]
    })
    return meta
}

export class PlaylistGenerationService {
    /**
     * Generate playlists from albums
     * 
     * @param {Album[]} albums - Source albums with tracks
     * @param {GenerationConfig} config - Generation configuration
     * @returns {GenerationResult} - Generated playlists with normalized tracks
     */
    /**
     * The name a recipe shows in the Blending Menu («Top Tracks by Spotify Popularity»), for the
     * default name of a batch (UAT-229). '' for an unknown recipe.
     * @param {string} algorithmId
     * @returns {string}
     */
    recipeName(algorithmId) {
        const recipe = getAlgorithm(algorithmId)
        return (recipe && recipe.getMetadata && recipe.getMetadata().name) || ''
    }

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

        // The ranking of the recipe: a Top N recipe has it locked by its name. The same rule tells
        // the album load which sources the recipe reads (models/recipeSources.js).
        const rankingId = resolveRankingId(config)

        const rankingStrategy = createRankingStrategy(rankingId)

        console.log(`[PlaylistGenerationService] Generating with algorithm: ${config.algorithmId}, ranking: ${rankingId}`)

        // Generate playlists
        const result = algorithm.generate(albums, {
            rankingStrategy,
            targetDuration: config.targetDuration,
            outputMode: config.outputMode,
            groupingStrategy: config.groupingStrategy,
            // Sprint 17: Pass variable track count (N)
            trackCount: config.trackCount || config.n,
            // F92 (REQ-10): how many of the most popular «Deep cuts» skips (only a recipe with an adjustable skip reads it)
            skip: config.skip
        })

        // Transform result to normalized playlist format
        // Note: Do NOT add index here - index is for DISPLAY (Grid) and EXPORT only
        const meta = generationMeta(config, rankingId)
        const playlists = result.playlists.map(p => ({
            name: p.title, // Pure title without index (e.g., "Greatest Hits Vol. 1")
            title: p.title, // Also set title for consistency
            tracks: this.transformTracks(p.tracks),
            // The recipe these playlists were generated with: saved with them, shown again by the
            // "reconfigure" panel
            _meta: { ...meta }
        }))

        console.log(`[PlaylistGenerationService] Generated ${playlists.length} playlist(s)`)

        const stats = {
            totalTracks: playlists.reduce((sum, p) => sum + p.tracks.length, 0),
            totalDuration: playlists.reduce((sum, p) =>
                sum + p.tracks.reduce((tSum, t) => tSum + (t.duration || 0), 0), 0
            )
        }
        // F77: the recipe and how much it made; the blend and "generate again" both come through here
        track('playlists_generated', { recipe: config.algorithmId, playlist_count: playlists.length, track_count: stats.totalTracks })

        return {
            playlists,
            rankingId, // Return the effective ranking used
            stats
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
        // A popularity that stood in for a missing rating while ranking is not shown as a rating.
        return rawTracks.map(t => TrackTransformer.toCanonical(t.ratingIsPopularity ? { ...t, rating: null } : t))
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
