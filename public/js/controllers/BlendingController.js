/**
 * BlendingController
 * 
 * Centralized controller for playlist generation workflow.
 * Shared by the Blend screen (screens/blend/) and the playlists screen (generate again).
 * 
 * Responsibilities:
 * - Ask the album load for the albums of a series (it never loads an album itself: F56)
 * - Generate playlists via PlaylistGenerationService
 * - Update the playlists store
 * 
 * @module controllers/BlendingController
 * @since Sprint 13 - Issue #93 modularization
 */

import { albumsStore } from '../stores/albums.js'
import { playlistsStore } from '../stores/playlists.js'
import { albumSeriesStore } from '../stores/albumSeries.js'
import { playlistGenerationService } from '../services/PlaylistGenerationService.js'
import { getPlaylistsService } from '../services/playlists/playlistsWiring.js'
import { albumAsks } from '../services/albums/albumLoading.js'
import { sourcesForRecipe, fallbacksForRecipe } from '../models/recipeSources.js'
import { askNotices, askProgressText, noAlbumsMessage } from '../models/albumAsk.js'
import { defaultBatchName } from '../models/batchNaming.js'

/**
 * @typedef {Object} GenerationConfig
 * @property {string} algorithmId - Algorithm to use
 * @property {number} targetDuration - Target duration in SECONDS
 * @property {string} rankingId - 'balanced' | 'spotify' | 'bea'
 * @property {string} outputMode - 'auto' | 'single' | 'multiple'
 */

/**
 * @typedef {Object} GenerationResult
 * @property {Playlist[]} playlists - Generated playlists
 * @property {Album[]} albums - The albums they were generated from (the ones that were ready)
 * @property {Object} stats - Generation statistics
 * @property {Object} load - what the album load answered (AlbumsResult, models/albumAsk.js)
 * @property {string[]} notices - what to tell the person: albums left out, sources missing and
 *           how the recipe ordered the tracks of the albums a source is missing for
 */

/** The person left the screen while the albums were loading: nothing was generated. */
export class BlendCancelledError extends Error {
    constructor() {
        super('The blend was cancelled')
        this.name = 'BlendCancelledError'
    }
}

class BlendingController {
    /**
     * Generate playlists from a series.
     *
     * The albums come from the load service (albumAsks.albumsOf): what the albums screen already
     * loaded is not loaded again, and the blend waits for the sources its recipe reads.
     * Decision (F56): the blend goes on with the albums that are ready and says which ones were
     * left out and which sources are missing (`notices`); it stops only when no album is ready.
     * One album that the catalog does not have should not cost the person the whole blend, and
     * the playlists say nothing false: they are made of the albums named as ready.
     *
     * @param {string} seriesId - Series to generate from
     * @param {GenerationConfig} config - Generation configuration
     * @param {Object} options - Additional options
     * @param {Function} [options.onProgress] - Progress callback (message: string)
     * @param {AbortSignal} [options.signal] - aborted when the person leaves the screen
     * @returns {Promise<GenerationResult>}
     * @throws {BlendCancelledError} when the signal was aborted before the albums were ready
     */
    async generateFromSeries(seriesId, config, options = {}) {
        const { onProgress = () => { }, signal = null } = options

        const series = albumSeriesStore.getById(seriesId)
        if (!series) throw new Error(`Series not found: ${seriesId}`)

        const load = await this._albumsFor(series, config, { onProgress, signal })

        onProgress(`Generating playlists with ${config.algorithmId}...`)
        const result = playlistGenerationService.generate(load.albums, config)

        albumSeriesStore.setActiveSeries(seriesId)
        playlistsStore.setPlaylists(result.playlists, seriesId)
        this._enterCreateMode()
        playlistsStore.setDefaultBatchName(this._generateDefaultBatchName(series, result.playlists, config))

        console.log(`[BlendingController] Generated ${result.playlists.length} playlist(s) from ${load.albums.length} of ${load.result.total} albums`)

        return { playlists: result.playlists, albums: load.albums, stats: result.stats, load: load.result, notices: load.notices }
    }

    /**
     * Ask the load service for the albums of a series, ready for a recipe.
     * @returns {Promise<{ albums: Album[], result: Object, notices: string[] }>}
     * @throws when the ask was dropped, or when no album is ready (the message says why)
     */
    async _albumsFor(series, config, { onProgress = () => { }, signal = null } = {}) {
        const result = await albumAsks.albumsOf({
            series: [series],
            sources: sourcesForRecipe(config),
            signal,
            onProgress: (progress) => onProgress(askProgressText(progress))
        })
        if (result.aborted) throw new BlendCancelledError()
        if (result.albums.length === 0) throw new Error(noAlbumsMessage(result))

        // Which series the shelf answers for (the load projects its albums there)
        albumsStore.setActiveAlbumSeriesId(series.id)
        return { albums: result.albums, result, notices: askNotices(result, fallbacksForRecipe(config)) }
    }

    /** A new generation is a new set: no edit context or batch name of another set stays. */
    _enterCreateMode() {
        try {
            getPlaylistsService().setCreateMode()
        } catch (error) {
            console.warn('[BlendingController] could not reset the playlists mode:', error?.message || error)
        }
    }

    /**
     * Generate again, with another recipe, the playlists on screen (RegeneratePanel).
     * The albums are asked for again, with the sources of the new recipe: what is loaded or kept
     * answers at once, and a recipe that reads another source waits for it.
     *
     * @param {GenerationConfig} config - Generation configuration
     * @param {Object} [options]
     * @param {AbortSignal} [options.signal]
     * @returns {Promise<GenerationResult>}
     */
    async regenerate(config, options = {}) {
        // The playlists stay in the series they belong to: the one of the set on screen. The series
        // active elsewhere only answers when nothing on screen says which series it is.
        const seriesId = playlistsStore.getSeriesId() || albumSeriesStore.getActiveSeries()?.id
        const series = seriesId ? albumSeriesStore.getById(seriesId) : null
        if (!series) throw new Error('No series to take the albums from. Open the series first.')

        const load = await this._albumsFor(series, config, options)
        console.log(`[BlendingController] Regenerating with ${load.albums.length} albums`)

        const result = playlistGenerationService.generate(load.albums, config)
        playlistsStore.setPlaylists(result.playlists, seriesId)

        // A set being edited keeps its name; a new one gets the default name of now
        if (!playlistsStore.isEditingExistingBatch()) {
            playlistsStore.setDefaultBatchName(this._generateDefaultBatchName(series, result.playlists, config))
        }

        return { playlists: result.playlists, albums: load.albums, stats: result.stats, load: load.result, notices: load.notices }
    }

    /**
     * The default name of a new batch: the series, then the playlist (one) or the recipe (several),
     * e.g. «Trip Hop Vol.1 · Spotify Top 3 balanced» (UAT-229). With no series, the stamped name of
     * the local clock (UAT-225). models/batchNaming.js decides; this only gathers the parts.
     * @private
     */
    _generateDefaultBatchName(series = null, playlists = [], config = {}) {
        return defaultBatchName({
            seriesName: series?.name,
            playlists,
            recipeName: playlistGenerationService.recipeName?.(config.algorithmId) || ''
        })
    }
}

// Singleton instance
export const blendingController = new BlendingController()
export { BlendingController }
