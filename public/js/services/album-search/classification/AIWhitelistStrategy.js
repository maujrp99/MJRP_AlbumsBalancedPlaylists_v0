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

    execute(album, context) {
        const genres = context.genres || [];
        const aiList = context.aiList || [];
        const trackCount = album.trackCount || context.trackCount || 0;

        // Non-electronic with 7+ tracks → Direct Studio Album (no AI needed)
        if (!isElectronic(genres) && trackCount >= 7) {
            this.log(album.title, 'Album', `non-electronic, ${trackCount} tracks`);
            return 'Album';
        }

        // Electronic music: check AI whitelist
        if (isElectronic(genres)) {
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

        // Fallback for edge cases
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
