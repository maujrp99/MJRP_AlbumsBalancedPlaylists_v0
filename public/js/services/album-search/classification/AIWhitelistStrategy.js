/**
 * AIWhitelistStrategy - Etapa 5 do Funil (Final)
 * 
 * For electronic music: Uses AI whitelist to confirm studio albums.
 * For other genres: 7+ tracks automatically becomes Studio Album.
 * 
 * @see docs/technical/specs/sprint17.75-classification-modularization/spec.md#etapa-5-aiwhiteliststrategy
 */

import { BaseStrategy } from './BaseStrategy.js';
import { isElectronic } from './ElectronicGenreDetector.js';

export class AIWhitelistStrategy extends BaseStrategy {
    name = 'AIWhitelist';

    /**
     * Sprint 17.75-B: Made async to support lazy AI fetching
     * AI is only called if album is electronic AND reaches this stage
     */
    async execute(album, context) {
        const genres = context.genres || [];
        const trackCount = album.trackCount || context.trackCount || 0;

        // Note: Non-electronic albums are now handled by GenreGateStrategy (Etapa 2.5)
        // So anything reaching here is guaranteed to be Electronic (or have no genre).

        // Electronic music: needs AI whitelist check
        if (isElectronic(genres)) {
            // Sprint 17.75-B: Lazy AI fetch - only fetches now if not cached
            const aiList = typeof context.getAiList === 'function'
                ? await context.getAiList()
                : context.aiList || [];

            const normalizedAlbumTitle = this._normalizeTitle(album.title);

            // Debug: Log first few AI titles for troubleshooting
            if (aiList.length > 0) {
                console.log(`[AI:Match] Checking "${album.title}" -> normalized: "${normalizedAlbumTitle}"`);
                console.log(`[AI:Match] AI list has ${aiList.length} titles:`, aiList.slice(0, 5));
            }

            // Try exact match first
            let matchedTitle = null;
            const isInWhitelist = aiList.some(aiTitle => {
                const normalizedAiTitle = this._normalizeTitle(aiTitle);
                const isMatch = normalizedAlbumTitle === normalizedAiTitle;
                if (isMatch) matchedTitle = aiTitle;
                return isMatch;
            });

            if (isInWhitelist) {
                console.log(`[AI:Match] ✅ EXACT match: "${album.title}" matched "${matchedTitle}"`);
                this.log(album.title, 'Album', 'AI whitelist match');
                return 'Album';
            }

            // Fuzzy match: check if album title CONTAINS or IS CONTAINED BY any AI title
            const fuzzyMatch = aiList.find(aiTitle => {
                const normalizedAiTitle = this._normalizeTitle(aiTitle);
                return normalizedAlbumTitle.includes(normalizedAiTitle) ||
                    normalizedAiTitle.includes(normalizedAlbumTitle);
            });

            if (fuzzyMatch) {
                console.log(`[AI:Match] ✅ FUZZY match: "${album.title}" matched "${fuzzyMatch}"`);
                this.log(album.title, 'Album', `AI fuzzy match: ${fuzzyMatch}`);
                return 'Album';
            }

            // Electronic but NOT in AI whitelist → Uncategorized
            console.log(`[AI:Match] ❌ No match for "${album.title}" (normalized: "${normalizedAlbumTitle}")`);
            this.log(album.title, 'Uncategorized', 'electronic, not in AI whitelist');
            return 'Uncategorized';
        }

        // Fallback for edge cases (e.g., no genres, low track count)
        return null;
    }

    /**
     * Normalize title for comparison
     * Removes parentheticals, brackets, edition markers, formatting
     */
    _normalizeTitle(title) {
        if (!title) return '';

        return title.toLowerCase()
            .replace(/\(.*?\)/g, '') // Remove parentheticals (deluxe)
            .replace(/\[.*?\]/g, '') // Remove brackets [remaster]
            .replace(/deluxe|remaster|edition|expanded|version|anniversary/gi, '')
            .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric
            .trim();
    }
}
