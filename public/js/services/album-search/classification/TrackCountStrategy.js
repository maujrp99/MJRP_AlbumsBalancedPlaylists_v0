/**
 * TrackCountStrategy - Etapa 4 do Funil
 * 
 * Classifies by track count and duration.
 * Note: Prog Rock Protection REMOVED - Apple Music API already classifies correctly.
 * 
 * @see docs/technical/specs/sprint17.75-classification-modularization/spec.md#etapa-4-trackcountstrategy
 */

import { BaseStrategy } from './BaseStrategy.js';

export class TrackCountStrategy extends BaseStrategy {
    name = 'TrackCount';

    execute(album, context) {
        const trackCount = album.trackCount || context.trackCount || 0;
        const durationMin = this._getDurationMinutes(album, context);

        // 1-3 tracks AND short duration → Single
        if (trackCount >= 1 && trackCount <= 3 && durationMin < 20) {
            this.log(album.title, 'Single', `${trackCount} tracks, ${durationMin.toFixed(0)}min`);
            return 'Single';
        }

        // 4-6 tracks AND moderate duration → EP
        if (trackCount >= 4 && trackCount <= 6 && durationMin < 30) {
            this.log(album.title, 'EP', `${trackCount} tracks, ${durationMin.toFixed(0)}min`);
            return 'EP';
        }

        // 7+ tracks → Pass to AI strategy (for electronic) or direct Album (for others)
        return null;
    }

    /**
     * Get album duration in minutes
     */
    _getDurationMinutes(album, context) {
        // From context
        if (context.durationMin) {
            return context.durationMin;
        }

        // From raw attributes
        const durationMs = album.raw?.attributes?.durationInMillis || 0;
        return durationMs / 60000;
    }
}
