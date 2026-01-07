/**
 * RemixTracksStrategy - Etapa 3 do Funil
 * 
 * Detects singles/EPs with multiple remixes by analyzing track names.
 * If ≥50% of tracks contain remix-related words, classifies as Single/EP.
 * 
 * @see docs/technical/specs/sprint17.75-classification-modularization/spec.md#etapa-3-remixtracksstrategy
 */

import { BaseStrategy } from './BaseStrategy.js';

export class RemixTracksStrategy extends BaseStrategy {
    name = 'RemixTracks';

    // Words that indicate a remix/variant track
    REMIX_INDICATORS = [
        'remix', 'mix', 'version', 'edit',
        'extended', 'radio edit', 'club mix',
        'dub', 'instrumental', 'acoustic',
        'rework', 'bootleg', 'mashup'
    ];

    execute(album, context) {
        // Need track information to analyze
        const tracks = this._getTrackNames(album);

        if (!tracks || tracks.length === 0) {
            return null; // Can't analyze, pass to next
        }

        const trackCount = tracks.length;
        const remixTrackCount = this._countRemixTracks(tracks);
        const remixRatio = remixTrackCount / trackCount;

        // If ≥50% of tracks are remixes, this is a remix package
        if (remixRatio >= 0.5) {
            if (trackCount <= 6) {
                this.log(album.title, 'Single', `${Math.round(remixRatio * 100)}% remix tracks`);
                return 'Single';
            } else {
                this.log(album.title, 'EP', `remix package (${trackCount} tracks, ${Math.round(remixRatio * 100)}% remixes)`);
                return 'EP';
            }
        }

        // Not a remix package, pass to next strategy
        return null;
    }

    /**
     * Extract track names from album data
     * @param {Object} album - Album with raw.relationships or tracklist
     */
    _getTrackNames(album) {
        // Try relationships.tracks from Apple Music API
        const relationships = album.raw?.relationships;
        if (relationships?.tracks?.data) {
            return relationships.tracks.data.map(t =>
                (t.attributes?.name || '').toLowerCase()
            );
        }

        // Fallback: check if album has tracks array directly
        if (album.tracks && Array.isArray(album.tracks)) {
            return album.tracks.map(t => (t.name || t.title || '').toLowerCase());
        }

        return null;
    }

    /**
     * Count tracks that appear to be remixes/variants
     */
    _countRemixTracks(tracks) {
        return tracks.filter(trackName => {
            return this.REMIX_INDICATORS.some(indicator =>
                trackName.includes(indicator)
            );
        }).length;
    }
}
