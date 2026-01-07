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
                // console.log(`[AI:Match] Checking "${album.title}"`); 
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

                // SPRINT 17.75-C: FEEDBACK LOOP OVERRIDE
                if (context.preliminaryType && context.preliminaryType !== 'Album') {
                    // SAFETY CHECK: confirm it's safe to override (even for exact match, normalized titles might hide 'Single')
                    if (this._isSafeToRescue(album.title, matchedTitle)) {
                        console.warn(`[AI:Override] ⚠️ Rescuing "${album.title}" from "${context.preliminaryType}" to "Album"!`);
                        this.log(album.title, 'Album', 'AI whitelist match (Rescued)');
                        return 'Album';
                    } else {
                        // console.log(`[AI:Override] 🛑 Blocked rescue for "${album.title}"`);
                        return context.preliminaryType;
                    }
                }

                this.log(album.title, 'Album', 'AI whitelist match');
                return 'Album';
            }

            // Fuzzy match: check if album title CONTAINS or IS CONTAINED BY any AI title
            // REFACTOR: Use strict token matching to avoid "Anyone" matching "One" or "Fireisland" matching "Island"
            const fuzzyMatch = aiList.find(aiTitle => {
                const normalizedAiTitle = this._normalizeTitle(aiTitle);

                // CRITICAL FIX: If normalization results in empty string (e.g. ".-.-."), it matches EVERYTHING.
                // We must skip empty or extremely short keys for fuzzy matching.
                if (normalizedAiTitle.length < 2) return false;

                // STRICTER CHECK: Tokenize/Word Boundary Check
                // 1. If strict equality (already checked above, but safe to keep)
                if (normalizedAlbumTitle === normalizedAiTitle) return true;

                // 2. Normalize with spaces carefully to check for whole words
                // We need to re-normalize WITHOUT stripping spaces for this check, or rely on boundaries
                // The current _normalizeTitle strips spaces ("fireisland"), which destroys word boundaries.
                // We need a specific "tokenizable" normalization here.

                const albumTokens = this._tokenize(album.title);
                const aiTokens = this._tokenize(aiTitle);

                // Check if ALL tokens of the SHORTER string are present in the LONGER string
                // AND in the correct relative order (simplified: just subset for now)
                const source = aiTokens.length < albumTokens.length ? aiTokens : albumTokens;
                const target = aiTokens.length < albumTokens.length ? albumTokens : aiTokens;

                // e.g. source=["one"], target=["is","there","anyone","out","there"] -> "one" != "anyone"
                // e.g. source=["island"], target=["fireisland"] -> "island" != "fireisland"

                return source.every(sToken => target.includes(sToken));
            });

            if (fuzzyMatch) {
                console.log(`[AI:Match] ✅ FUZZY match: "${album.title}" matched "${fuzzyMatch}"`);

                // SPRINT 17.75-C: FEEDBACK LOOP OVERRIDE
                if (context.preliminaryType && context.preliminaryType !== 'Album') {
                    // SAFETY CHECK: confirm it's safe to override
                    if (this._isSafeToRescue(album.title, fuzzyMatch)) {
                        console.warn(`[AI:Override] ⚠️ Rescuing "${album.title}" from "${context.preliminaryType}" to "Album"!`);
                        this.log(album.title, 'Album', `AI fuzzy match: ${fuzzyMatch} (Rescued)`);
                        return 'Album';
                    } else {
                        // console.log(`[AI:Override] 🛑 Blocked rescue for "${album.title}" (Contains Remix/Single/EP/Comp keyword but match does not)`);

                        // SPRINT 17.75-C FIX: If preliminary type was 'Album' but we blocked it due to risky keywords,
                        // we MUST downgrade it to prevent "Feel Again, Pt. 1" (EP) from staying as "Album".
                        if (context.preliminaryType === 'Album') {
                            console.log(`[AI:Correction] 📉 Downgrading "${album.title}" from Album to EP/Compilation due to blocked rescue.`);
                            const lowerTitle = album.title.toLowerCase();
                            if (lowerTitle.includes('ep') || lowerTitle.includes('pt.') || lowerTitle.includes('part')) {
                                return 'EP';
                            }
                            return 'Compilation';
                        }

                        // Fallback to confirming preliminary type (e.g. Single stays Single)
                        return context.preliminaryType;
                    }
                }

                this.log(album.title, 'Album', `AI fuzzy match: ${fuzzyMatch}`);
                return 'Album';
            }

            // SPRINT 17.75-C: FALLBACK / CONFIRMATION
            // ... (rest of method)
            if (context.preliminaryType) {
                console.log(`[AI:Match] ❌ No match. Confirming preliminary type: "${context.preliminaryType}"`);
                return context.preliminaryType;
            }

            // Electric but NOT in AI whitelist and NO preliminary type → Uncategorized
            // console.log(`[AI:Match] ❌ No match for "${album.title}" (normalized: "${normalizedAlbumTitle}")`);
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

    /**
     * Check if it's safe to rescue an album that matched the whitelist
     * Prevents "Album Name - Single" from being rescued to "Album Name"
     */
    _isSafeToRescue(albumTitle, matchedAiTitle) {
        const lowerTitle = albumTitle.toLowerCase();
        const lowerMatch = matchedAiTitle.toLowerCase();

        // Keywords that signal it's NOT a studio album (unless the AI title also has them)
        // Added: presents, vol, volume, compilation, collection, anthology
        // SPRINT 17.75-C FIX: Added 'club', 'pt', 'part' to prevent "Club Embrace" -> "Embrace" or "Feel Again Pt 1" -> "Feel Again"
        const riskyTable = [
            'single', 'ep', 'remix', 'remixed', 'mix', 'live', 'concert',
            'presents', 'vol.', 'volume', 'compilation', 'collection', 'anthology', 'best of', 'sampler',
            'club'
        ];

        for (const risk of riskyTable) {
            // If the album title has a risk word...
            if (lowerTitle.includes(risk)) {
                // ...and the AI whitelist title DOES NOT have it...
                if (!lowerMatch.includes(risk)) {
                    // ...then it's a false positive (different product)
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Tokenize title into words for stricter matching
     * e.g. "Fireisland - Single" -> ["fireisland", "single"]
     * e.g. "Is There Anyone Out There?" -> ["is", "there", "anyone", "out", "there"]
     */
    _tokenize(title) {
        if (!title) return [];
        return title.toLowerCase()
            .replace(/\(.*?\)/g, '') // Remove parentheticals
            .replace(/\[.*?\]/g, '') // Remove brackets
            .replace(/[^a-z0-9\s]/g, '') // Keep spaces! Remove other symbols
            .split(/\s+/) // Split by whitespace
            .filter(t => t.length > 0); // Remove empty tokens
    }
}
