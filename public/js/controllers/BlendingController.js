/**
 * BlendingController
 * 
 * Centralized controller for playlist generation workflow.
 * Shared by BlendingMenuView and PlaylistsView/RegeneratePanel.
 * 
 * Responsibilities:
 * - Load albums from a series
 * - Generate playlists via PlaylistGenerationService
 * - Update stores (albumsStore, playlistsStore)
 * 
 * @module controllers/BlendingController
 * @since Sprint 13 - Issue #93 modularization
 */

import { apiClient } from '../api/client.js'
import { albumsStore } from '../stores/albums.js'
import { playlistsStore } from '../stores/playlists.js'
import { albumSeriesStore } from '../stores/albumSeries.js'
import { playlistGenerationService } from '../services/PlaylistGenerationService.js'

/**
 * @typedef {Object} GenerationConfig
 * @property {string} algorithmId - Algorithm to use
 * @property {number} targetDuration - Target duration in SECONDS
 * @property {string} rankingId - 'balanced' | 'spotify' | 'bea'
 * @property {string} outputMode - 'auto' | 'single' | 'multiple'
 * @property {boolean} discoveryMode - Include unranked tracks
 */

/**
 * @typedef {Object} GenerationResult
 * @property {Playlist[]} playlists - Generated playlists
 * @property {Album[]} albums - Loaded albums
 * @property {Object} stats - Generation statistics
 */

class BlendingController {
    /**
     * Generate playlists from a series
     * 
     * @param {string} seriesId - Series to generate from
     * @param {GenerationConfig} config - Generation configuration
     * @param {Object} options - Additional options
     * @param {Function} [options.onProgress] - Progress callback (message: string)
     * @param {boolean} [options.useExistingAlbums] - Use albums already in store
     * @returns {Promise<GenerationResult>}
     */
    async generateFromSeries(seriesId, config, options = {}) {
        const { onProgress = () => { }, useExistingAlbums = false } = options

        // 1. Get series info - setActiveSeries returns the series if found
        let series = albumSeriesStore.getActiveSeries()

        // If not active or different series, find and set it
        if (!series || series.id !== seriesId) {
            series = albumSeriesStore.setActiveSeries(seriesId)
        }

        if (!series) {
            // Try to find in series list
            const allSeries = albumSeriesStore.getSeries()
            series = allSeries.find(s => s.id === seriesId)
            if (!series) {
                throw new Error(`Series not found: ${seriesId}`)
            }
        }

        // 2. Load albums (or use existing)
        let albums
        if (useExistingAlbums) {
            albums = albumsStore.getAlbums()
            if (albums.length === 0) {
                throw new Error('No albums in store. Load albums first.')
            }
        } else {
            onProgress(`Loading ${series.albumQueries?.length || 0} albums...`)
            albums = await this.loadAlbumsFromSeries(series, onProgress)
        }

        if (albums.length === 0) {
            throw new Error('No albums loaded from series')
        }

        // 3. Generate playlists
        onProgress(`Generating playlists with ${config.algorithmId}...`)
        const result = playlistGenerationService.generate(albums, config)

        // 4. Update stores
        albumSeriesStore.setActiveSeries(seriesId)
        playlistsStore.setPlaylists(result.playlists, seriesId)

        console.log(`[BlendingController] Generated ${result.playlists.length} playlist(s) from ${albums.length} albums`)

        return {
            playlists: result.playlists,
            albums,
            stats: result.stats
        }
    }

    /**
     * Load albums from a series via API
     * 
     * @param {Object} series - Series object with albumQueries
     * @param {Function} [onProgress] - Progress callback
     * @returns {Promise<Album[]>}
     */
    async loadAlbumsFromSeries(series, onProgress = () => { }) {
        const albumQueries = series.albumQueries || []
        const albums = []

        for (let i = 0; i < albumQueries.length; i++) {
            const query = albumQueries[i]
            onProgress(`Loading album ${i + 1}/${albumQueries.length}...`)

            try {
                const album = await apiClient.fetchAlbum(query)
                if (album) {
                    albums.push(album)
                }
            } catch (err) {
                console.warn(`[BlendingController] Failed to load album: ${query}`, err)
            }
        }

        // Store albums in albumsStore for access by other components
        albumsStore.setActiveAlbumSeriesId(series.id)
        albumsStore.clearAlbumSeries(series.id)
        albums.forEach(album => albumsStore.addAlbumToSeries(series.id, album))

        return albums
    }

    /**
     * Regenerate playlists using albums already in store
     * Used by RegeneratePanel in edit mode
     * 
     * @param {GenerationConfig} config - Generation configuration
     * @returns {Promise<GenerationResult>}
     */
    async regenerate(config) {
        const albums = albumsStore.getAlbums()

        if (albums.length === 0) {
            throw new Error('No albums loaded. Cannot regenerate.')
        }

        console.log(`[BlendingController] Regenerating with ${albums.length} albums`)

        const result = playlistGenerationService.generate(albums, config)

        // Update playlists store (keep same series)
        const activeSeries = albumSeriesStore.getActiveSeries()
        playlistsStore.setPlaylists(result.playlists, activeSeries?.id)

        return {
            playlists: result.playlists,
            albums,
            stats: result.stats
        }
    }
}

// Singleton instance
export const blendingController = new BlendingController()
export { BlendingController }
