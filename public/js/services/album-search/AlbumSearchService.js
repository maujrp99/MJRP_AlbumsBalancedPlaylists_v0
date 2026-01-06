/**
 * AlbumSearchService
 * 
 * Orchestrator for the Album Search Pipeline (ARCH-4).
 * Coordinates Normalization, Apple Music API (via MusicKit), Scoring, and Filtering.
 */

import { musicKitService } from '../MusicKitService.js'; // Legacy service for raw API calls for now
import { ArtistNormalizer } from './ArtistNormalizer.js';
import { ScoreCalculator } from './ScoreCalculator.js';
import { EditionFilter } from './EditionFilter.js';

export class AlbumSearchService {
    constructor() {
        this.normalizer = new ArtistNormalizer();
        this.scorer = new ScoreCalculator();
        this.filter = new EditionFilter();
        this.cache = new Map(); // Simple in-memory cache
    }

    /**
     * Search for an album with intelligent fallback strategies
     * @param {string} artist - Artist Name
     * @param {string} albumTitle - Album Title
     * @param {Object} options - { limit: 50, minConfidence: 0.35 }
     * @returns {Promise<Array>} Sorted, scored results
     */
    async search(artist, albumTitle, options = {}) {
        const cacheKey = `${artist}|${albumTitle}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const { limit = 50, minConfidence = 0.35 } = options;
        const normalizedArtist = this.normalizer.normalize(artist);
        let results = [];

        // Strategy 1: Direct Search with Normalized Artist
        console.log(`[AlbumSearch] Strategy 1: "${normalizedArtist} - ${albumTitle}"`);
        const s1Results = await musicKitService.searchAlbums(normalizedArtist, albumTitle, limit);
        results = this._processResults(s1Results, normalizedArtist, albumTitle);

        // Check if we have a high confidence match (> 0.8)
        const bestMatch = results[0];
        if (bestMatch && bestMatch.confidence > 0.8) {
            console.log(`[AlbumSearch] High confidence match found (${bestMatch.confidence.toFixed(2)}). Returning.`);
            this.cache.set(cacheKey, results);
            return results;
        }

        // Strategy 2: Alternative Artist Names
        const alternatives = this.normalizer.getAlternatives(artist).filter(a => a !== normalizedArtist);
        if (alternatives.length > 0) {
            console.log(`[AlbumSearch] Strategy 2: Trying alternatives`, alternatives);
            for (const altArtist of alternatives) {
                const altResultsRaw = await musicKitService.searchAlbums(altArtist, albumTitle, Math.floor(limit / 2));
                const altResults = this._processResults(altResultsRaw, altArtist, albumTitle);

                // Merge results
                results = this._mergeResults(results, altResults);

                if (results[0]?.confidence > 0.8) break;
            }
        }

        // Strategy 3: Loose Search (Artist + fuzzy filter) - Expensive, only if desperate?
        // Not implementing full Strategy 3 yet to avoid MusicKit rate limits, but placeholder here.

        // Filter low confidence junk
        const finalResults = results.filter(r => r.confidence >= minConfidence);

        this.cache.set(cacheKey, finalResults);
        return finalResults;
    }

    /**
     * Get full discography for an artist with AI-enhanced filtering
     * @param {string} artistName 
     * @returns {Promise<Array>} Grouped albums
     */
    async getArtistDiscography(artistName) {
        const normalizedArtist = this.normalizer.normalize(artistName);
        console.log(`[AlbumSearch] Fetching discography for "${normalizedArtist}"`);

        // Parallel Fetch: MusicKit Data + AI Trusted List
        const [rawAlbums, aiStudioAlbums] = await Promise.all([
            musicKitService.getArtistAlbums(normalizedArtist),
            this._fetchAIStudioAlbums(normalizedArtist)
        ]);

        if (rawAlbums.length === 0) {
            // Fallback: Try alternatives?
            const alternatives = this.normalizer.getAlternatives(artistName);
            if (alternatives.length > 1) {
                console.log(`[AlbumSearch] No results, trying alternative: "${alternatives[1]}"`);
                // Note: Not strictly recursive with AI here to save tokens/complexity for now
                const altAlbums = await musicKitService.getArtistAlbums(alternatives[1]);
                if (altAlbums.length > 0) return this._processDiscography(altAlbums, aiStudioAlbums);
            }
            return [];
        }

        return this._processDiscography(rawAlbums, aiStudioAlbums);
    }

    async _fetchAIStudioAlbums(artistName) {
        try {
            const res = await fetch('/api/ai/studio-albums', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ artistName })
            });
            const data = await res.json();
            return data.albums || [];
        } catch (err) {
            console.warn('[AlbumSearch] AI fetch failed, falling back to heuristics:', err);
            return [];
        }
    }

    _processDiscography(albums, aiList = []) {
        console.log(`[AlbumSearch] Classifying ${albums.length} albums against ${aiList.length} AI titles.`);

        // 1. Map and Classify
        const mapped = albums.map(a => {
            // Re-classify using Hybrid Logic (AI + Heuristics)
            const classification = this._classifyWithAI(a, aiList);

            return {
                id: a.appleMusicId,
                title: a.title,
                artist: a.artist,
                year: a.year,
                coverUrl: musicKitService.getArtworkUrl(a.artworkTemplate, 300),
                artworkTemplate: a.artworkTemplate,
                type: classification,
                albumType: classification,
                isSingle: classification === 'Single',
                isCompilation: classification === 'Compilation',
                isLive: classification === 'Live',
                isEP: classification === 'EP',
                releaseDate: a.releaseDate,
                trackCount: a.trackCount,
                confidence: 1.0,
                raw: a.raw
            };
        });

        // 2. Group Variants
        return this.groupVariants(mapped);
    }

    /**
     * Hybrid Classification Logic (Robust Version)
     * 
     * Priority Order (CRITICAL - do not change order):
     * 1. Title Keywords (DJ Mix, Single, Live, EP, Remix, etc.) - catches obvious patterns
     * 2. Explicit Apple Metadata (isSingle, isCompilation)
     * 3. AI Whitelist → Album (Studio) - EXACT match for confirmed studio albums
     * 4. Genre-Aware Track Count + Duration (protects prog rock)
     * 5. Default: Compilation for electronic, Album for others
     */
    _classifyWithAI(album, aiList) {
        const title = (album.title || '').toLowerCase();
        const originalTitle = album.title || '';
        const attributes = album.raw?.attributes || {};
        const trackCount = album.trackCount || attributes.trackCount || 0;
        const durationMs = attributes.durationInMillis || 0;
        const durationMin = durationMs / 60000; // Convert to minutes
        const genres = (attributes.genreNames || []).map(g => g.toLowerCase());

        // Genre Detection
        const isElectronic = genres.some(g =>
            g.includes('electronic') || g.includes('dance') || g.includes('house') ||
            g.includes('techno') || g.includes('trance') || g.includes('dubstep') || g.includes('dj')
        );
        const isProgRock = genres.some(g =>
            g.includes('progressive') || g.includes('art rock') || g.includes('prog')
        );

        // =====================================================================
        // STEP 1: TITLE KEYWORDS (check FIRST to catch DJ Mixes, Singles, etc.)
        // =====================================================================

        // Live / Concert
        if (title.includes('(live)') || title.includes('[live]') ||
            title.includes('live at') || title.includes('live from') ||
            title.includes('unplugged') || title.includes('in concert') ||
            title.includes('concert') || title.includes('tour ') ||
            title.includes(' at the ')) {
            console.log(`[Classify] "${originalTitle}" → Live (keyword)`);
            return 'Live';
        }

        // DJ Mixes / Continuous Mixes / Radio Shows (CRITICAL for electronic music)
        // Catch numbered episodes like "Group Therapy 278", "ASOT 1000", etc.
        const djMixPatterns = [
            '(dj mix)', '[dj mix]', 'dj mix', 'continuous mix',
            'mixed by', 'in the mix', 'club mix', 'megamix',
            // NOTE: 'group therapy', 'a state of trance', 'pure trance' are NOT here
            // because we only want to match them when followed by numbers (via regex below)
            'in search of sunrise', 'trance nation', 'corsten\'s countdown',
            'anjunabeats worldwide', 'radio show',
            'podcast', '(mix)', 'ministry of sound',
            'cream ibiza', 'godskitchen', 'gatecrasher', 'trance energy',
            'electronic mixes', 'club life', 'hardwell on air',
            'ultra music festival', 'electric daisy carnival',
            'tomorrowland mix', 'edc mix', 'sensation', 'dreamstate'
        ];
        // Check for DJ Mix patterns OR numbered episode format (word + number at end)
        const isDjMix = djMixPatterns.some(p => title.includes(p)) ||
            // Match patterns like "Group Therapy 500", "ASOT 1000" (word(s) + number at end)
            /^(group therapy|asot|a state of trance|pure trance|corsten's countdown)\s*\d+/.test(title);

        if (isDjMix) {
            console.log(`[Classify] "${originalTitle}" → Compilation (DJ Mix/Radio Show)`);
            return 'Compilation';
        }

        // Singles - explicit markers (common patterns from Apple Music)
        if (title.includes('- single') || title.includes('(single)') ||
            title.endsWith(' single') || title.includes('[single]')) {
            console.log(`[Classify] "${originalTitle}" → Single (keyword)`);
            return 'Single';
        }

        // EPs - explicit markers
        if (title.includes(' - ep') || title.endsWith(' ep') ||
            title.includes('(ep)') || title.includes('[ep]') ||
            / ep$/i.test(title)) {
            console.log(`[Classify] "${originalTitle}" → EP (keyword)`);
            return 'EP';
        }

        // Remixes
        if (title.includes('remixes') || title.includes('remixed') ||
            title.includes('remix album') || title.includes('the remixes') ||
            (title.includes('remix') && !title.includes('single'))) {
            console.log(`[Classify] "${originalTitle}" → Compilation (remixes)`);
            return 'Compilation';
        }

        // Greatest Hits / Compilations
        if (title.includes('best of') || title.includes('greatest hits') ||
            title.includes('collection') || title.includes('anthology') ||
            title.includes('complete') || title.includes('definitive') ||
            title.includes('essential') || title.includes('gold') ||
            title.includes('classics') || title.includes('retrospective')) {
            console.log(`[Classify] "${originalTitle}" → Compilation (greatest hits)`);
            return 'Compilation';
        }

        // Soundtracks
        if (title.includes('soundtrack') || title.includes(' ost') ||
            title.includes('motion picture') || title.includes('score')) {
            console.log(`[Classify] "${originalTitle}" → Compilation (soundtrack)`);
            return 'Compilation';
        }

        // =====================================================================
        // STEP 2: EXPLICIT APPLE METADATA
        // =====================================================================
        if (attributes.isCompilation) {
            console.log(`[Classify] "${originalTitle}" → Compilation (Apple metadata)`);
            return 'Compilation';
        }
        if (attributes.isSingle) {
            console.log(`[Classify] "${originalTitle}" → Single (Apple metadata)`);
            return 'Single';
        }

        // =====================================================================
        // STEP 3: AI WHITELIST CHECK (EXACT MATCH ONLY)
        // =====================================================================
        const normalizedAlbumTitle = this._normalizeTitleForGrouping(title);

        const isAiMatch = aiList.some(aiTitle => {
            const normalizedAiTitle = this._normalizeTitleForGrouping(aiTitle);
            // STRICT: Must be EXACT match only after normalization
            // Example: "Kaleidoscope" → "kaleidoscope" matches "Kaleidoscope"
            // But: "Group Therapy 278" → "grouptherapy278" does NOT match "Group Therapy" → "grouptherapy"
            return normalizedAlbumTitle === normalizedAiTitle;
        });

        if (isAiMatch) {
            console.log(`[Classify] "${originalTitle}" → Album (AI whitelist EXACT match)`);
            return 'Album';
        }

        // =====================================================================
        // STEP 4: GENRE-AWARE TRACK COUNT + DURATION
        // =====================================================================

        if (isElectronic) {
            // Electronic Music: STRICT rules
            if (trackCount <= 3) {
                console.log(`[Classify] "${originalTitle}" → Single (electronic, ${trackCount} tracks)`);
                return 'Single';
            }
            if (trackCount >= 4 && trackCount <= 6) {
                console.log(`[Classify] "${originalTitle}" → EP (electronic, ${trackCount} tracks)`);
                return 'EP';
            }
            // 7+ tracks: Default to Album (studio album)
            // The AI whitelist already confirmed known studio albums, but AI may be incomplete
            // So we default to Album unless other heuristics above caught it
            console.log(`[Classify] "${originalTitle}" → Album (electronic, ${trackCount} tracks)`);
            return 'Album';
        }

        // Progressive Rock: Protect albums with few but long tracks
        if (isProgRock && durationMin >= 35 && trackCount >= 3) {
            console.log(`[Classify] "${originalTitle}" → Album (prog rock, ${trackCount} tracks, ${durationMin.toFixed(0)} min)`);
            return 'Album';
        }

        // Rock/Pop/Other: More relaxed rules
        if (trackCount <= 2) {
            console.log(`[Classify] "${originalTitle}" → Single (${trackCount} tracks)`);
            return 'Single';
        }
        if (trackCount >= 3 && trackCount <= 4) {
            console.log(`[Classify] "${originalTitle}" → EP (${trackCount} tracks)`);
            return 'EP';
        }
        if (trackCount === 5 && durationMin < 25) {
            console.log(`[Classify] "${originalTitle}" → EP (5 tracks, ${durationMin.toFixed(0)} min)`);
            return 'EP';
        }

        // 6+ tracks = likely Album for non-electronic
        console.log(`[Classify] "${originalTitle}" → Album (default, ${trackCount} tracks)`);
        return 'Album';
    }

    /**
     * Filter a list of albums based on active filters
     * @param {Array} albums - List of albums (ungrouped or grouped)
     * @param {Object} filters - { types: [], editions: [] }
     */
    applyFilters(albums, filters) {
        return this.filter.apply(albums, filters);
    }

    /**
     * Process and score raw API results
     * @private
     */
    _processResults(rawAlbums, queryArtist, queryTitle) {
        if (!rawAlbums) return [];

        return rawAlbums.map(album => {
            const score = this.scorer.calculate(album, queryArtist, queryTitle);
            return {
                id: album.id,
                appleId: album.id,
                title: album.attributes.name,
                artist: album.attributes.artistName,
                year: album.attributes.releaseDate ? album.attributes.releaseDate.substring(0, 4) : 'Unknown',
                coverUrl: album.attributes.artwork ? musicKitService.extractArtworkTemplate(album.attributes.artwork) : null,
                confidence: score,
                raw: album
            };
        }).sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Merge result lists deduplicating by ID
     * @private
     */
    _mergeResults(existing, newResults) {
        const seen = new Set(existing.map(r => r.id));
        const merged = [...existing];

        for (const r of newResults) {
            if (!seen.has(r.id)) {
                merged.push(r);
                seen.add(r.id);
            }
        }

        return merged.sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Group albums by base title (handling variants)
     * @param {Array} albums - List of search results
     * @returns {Array} List of albums where variants are grouped under `variants` prop
     */
    groupVariants(albums) {
        const groups = new Map();

        albums.forEach(album => {
            // Normalize title for grouping: "Album (Deluxe Edition)" -> "album"
            const baseTitle = this._normalizeTitleForGrouping(album.title);
            const key = `${album.artist.toLowerCase()}|${baseTitle}`;

            if (!groups.has(key)) {
                groups.set(key, {
                    ...album,
                    variants: [],
                    hasMultiple: false,
                    isGroupHeader: true
                });
            }

            const group = groups.get(key);
            group.variants.push(album);

            // Update header if we found a better match (higher confidence)
            // or if the current header is a "Deluxe" but we found a "Standard"
            if (album.confidence > group.confidence) {
                // Keep the variants array, but swap the display properties
                const existingVariants = group.variants;
                Object.assign(group, album);
                group.variants = existingVariants;
                group.hasMultiple = true;
                group.isGroupHeader = true;
            }
        });

        // Post-process groups
        return Array.from(groups.values()).map(group => {
            if (group.variants.length > 1) {
                group.hasMultiple = true;
                // Sort variants inside the group
                group.variants.sort((a, b) => {
                    // Prefer standard edition (shortest title generally) for top of list
                    return a.title.length - b.title.length;
                });
            }
            return group;
        });
    }

    _normalizeTitleForGrouping(title) {
        return title.toLowerCase()
            .replace(/\(.*\)/g, '') // Remove parentheticals
            .replace(/\[.*\]/g, '') // Remove brackets
            .replace(/deluxe|remaster|edition|expanded|version/g, '')
            .replace(/[^a-z0-9]/g, '') // Remove formatting chars
            .trim();
    }
}

export const albumSearchService = new AlbumSearchService();
