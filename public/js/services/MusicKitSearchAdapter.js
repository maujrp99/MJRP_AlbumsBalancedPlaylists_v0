/**
 * MusicKitSearchAdapter
 * 
 * Adapter to make MusicKitService compatible with Autocomplete loader interface.
 * Uses generic catalog search that works for both artist names and album names.
 * 
 * This unifies the search experience between:
 * - APIClient (Albums loading)
 * - SeriesModals (Edit Series)
 */

import { musicKitService } from './MusicKitService.js';

class MusicKitSearchAdapter {
    constructor() {
        this.isReady = false;
    }

    /**
     * Search for albums using MusicKit catalog search
     * Works for both artist names ("trex") and album names ("The Wall")
     * @param {string} query - Search query
     * @param {number} limit - Max results
     * @returns {Promise<Array>} Results in Autocomplete-compatible format
     */
    async search(query, limit = 25) {
        if (!query || query.length < 2) return [];

        try {
            await this.load(); // Ensure MusicKit is initialized + authorized

            const searchTerm = query.trim();
            console.log(`[MusicKitSearchAdapter] Searching catalog: "${searchTerm}"`);

            // Use MusicKitService.searchAlbums directly for generic catalog search
            // This finds results for both artist names AND album names
            const { musicKitService } = await import('./MusicKitService.js');
            const rawResults = await musicKitService.searchAlbums(searchTerm, '', limit);

            console.log(`[MusicKitSearchAdapter] Found ${rawResults?.length || 0} albums`);

            // Map raw Apple Music results to Autocomplete-compatible format
            return (rawResults || []).map(album => ({
                id: album.id,
                appleMusicId: album.id, // Critical: preserve Apple Music ID for export
                artist: album.attributes?.artistName || '',
                album: album.attributes?.name || '',
                title: album.attributes?.name || '',
                year: album.attributes?.releaseDate?.substring(0, 4) || '',
                coverUrl: musicKitService.getArtworkUrl(
                    musicKitService.extractArtworkTemplate(album.attributes?.artwork),
                    100
                ),
                artworkTemplate: musicKitService.extractArtworkTemplate(album.attributes?.artwork)
            }));
        } catch (error) {
            console.error('[MusicKitSearchAdapter] Search failed:', error);
            return [];
        }
    }

    /**
     * Get artwork URL from item
     */
    getArtworkUrl(item, size = 100) {
        if (!item) return null;

        const template = item.coverUrl || item.artworkTemplate;
        if (!template) return null;

        return template.replace('{w}', size).replace('{h}', size);
    }

    /**
     * Initialize adapter (ensures MusicKit is ready)
     * @returns {Promise<void>}
     */
    async load() {
        if (this.isReady) return;

        try {
            await musicKitService.init();
            this.isReady = true;
            console.log('[MusicKitSearchAdapter] Ready ✅');
        } catch (error) {
            console.error('[MusicKitSearchAdapter] Init failed:', error);
        }
    }
}

// Singleton instance
export const musicKitSearchAdapter = new MusicKitSearchAdapter();
