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

        // Non-electronic with 7+ tracks → Direct Studio Album (no AI needed!)
        // This skips AI call entirely for rock, pop, jazz, etc.
        if (!isElectronic(genres) && trackCount >= 7) {
            this.log(album.title, 'Album', `non-electronic, ${trackCount} tracks (no AI)`);
            return 'Album';
        }

        // Electronic music: needs AI whitelist check
        if (isElectronic(genres)) {
            // Sprint 17.75-B: Lazy AI fetch - only fetches now if not cached
            const aiList = typeof context.getAiList === 'function'
                ? await context.getAiList()
                : context.aiList || [];

            const normalizedTitle = this._normalizeTitle(album.title);

            const isInWhitelist = aiList.some(aiTitle => {
                const normalizedAiTitle = this._normalizeTitle(aiTitle);
                return normalizedTitle === normalizedAiTitle;
            });

            if (isInWhitelist) {
                this.log(album.title, 'Album', 'AI whitelist match');
                return 'Album';
            }

            // Electronic but NOT in AI whitelist → Uncategorized
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
