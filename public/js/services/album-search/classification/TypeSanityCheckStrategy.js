/**
 * TypeSanityCheckStrategy - Post-Processing (Sanity Check)
 * 
 * Runs AFTER all other strategies (including AI) to ensure the final classification
 * adheres to strict naming conventions. This acts as a final "safety net".
 * 
 * Rules:
 * - If defined as 'Album' but title explicitly says "Single" -> Downgrade to "Single"
 * - If defined as 'Album' but title explicitly says "EP" -> Downgrade to "EP"
 * 
 * This extracts logic that was previously "patched" into AIWhitelistStrategy.
 */

import { BaseStrategy } from './BaseStrategy.js';
import { isElectronic } from './ElectronicGenreDetector.js';

export class TypeSanityCheckStrategy extends BaseStrategy {
    name = 'TypeSanityCheck';

    execute(album, context) {
        // This strategy requires a preliminary result to work on
        if (!context.currentType || context.currentType === 'Uncategorized') {
            return null;
        }

        // We only care about sanity checking "Albums" to prevent false positives
        if (context.currentType !== 'Album') {
            return null;
        }

        const title = album.title.toLowerCase();

        // 1. Check for "EP"
        // Regex looks for "EP" as a whole word, or at end of string
        if (/\bep\b/i.test(title)) {
            this.log(album.title, 'EP', 'Sanity Check: Title contains "EP"');
            return 'EP';
        }

        // 2. Check for "Single"
        if (/\bsingle\b/i.test(title)) {
            this.log(album.title, 'Single', 'Sanity Check: Title contains "Single"');
            return 'Single';
        }

        // 3. Check for specific compilation keywords if explicit
        // Note: "Sampler" often marks a compilation or EP
        if (title.includes('sampler')) {
            this.log(album.title, 'Compilation', 'Sanity Check: Title contains "Sampler"');
            return 'Compilation';
        }

        // 3b. Check for "Listening To" (playlist-style compilations)
        // e.g. "Why I'm Now Listening To"
        if (title.includes('listening to')) {
            this.log(album.title, 'Compilation', 'Sanity Check: Title contains "Listening To"');
            return 'Compilation';
        }

        // Ensure trackCount is a valid number
        let trackCount = parseInt(context.trackCount);
        if (isNaN(trackCount)) trackCount = 0;

        // SPECIFIC HEURISTIC: "Hello World" Series by Ferry Corsten
        // These are EPs but have high track counts (7-11 tracks).
        // Matches "Hello World 1", "Hello World 2", etc.
        if (title.match(/hello world \d+$/)) {
            this.log(album.title, 'EP', `Sanity Check: "Hello World" series identified. Downgrading to EP.`);
            return 'EP';
        }

        // 4. Track Count Safety Net
        // WARNING: ONLY apply this to Electronic music. 
        // Prog Rock/Jazz often have < 7 tracks (e.g. Pink Floyd "Animals").
        const genres = context.genres || [];

        if (trackCount > 0 && trackCount <= 6) {
            if (isElectronic(genres)) {
                this.log(album.title, 'EP', `Sanity Check: Classified as Album but has only ${trackCount} tracks (Electronic). Downgrading.`);
                return 'EP';
            } else {
                // Non-electronic: Trust the 'Album' classification even with low track count
                return null;
            }
        }

        // Note: We intentionally DO NOT check for "Pt." or "Part" here, 
        // as multi-part albums (e.g. "Feel Again, Pt. 1") are valid Albums.

        return null; // No correction needed
    }
}
