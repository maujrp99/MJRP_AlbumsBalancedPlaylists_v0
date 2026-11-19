/**
 * AlbumSearchService
 * 
 * Orchestrator for the Album Search Pipeline (ARCH-4).
 * Coordinates Normalization, Apple Music API (via MusicKit), Scoring, and Filtering.
 */

import { musicKitService } from '../MusicKitService.js'; // Legacy service for raw API calls for now
import { serverFetch } from '../../api/serverFetch.js'
import { readServerResult, ResultKind } from '../../api/serverResult.js'
import { ArtistNormalizer } from './ArtistNormalizer.js';
import { ScoreCalculator } from './ScoreCalculator.js';
import { EditionFilter } from './EditionFilter.js';
import { albumTypeClassifier } from './AlbumTypeClassifier.js'; // ARCH-18: Modular classification
import { withDeadline } from '../../utils/deadline.js';
import { CATALOG_DEADLINE_MS } from '../../models/scanState.js';

/** How long the paid AI list may take before the scan stops waiting for it (F67). */
export const AI_LIST_DEADLINE_MS = 60000;

export class AlbumSearchService {
    constructor() {
        this.normalizer = new ArtistNormalizer();
        this.scorer = new ScoreCalculator();
        this.filter = new EditionFilter();
        this.cache = new Map(); // Album search cache
        this.aiCache = new Map(); // Sprint 17.75-B: Cache for AI studio album responses
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
     * Get full discography for an artist with AI-enhanced filtering.
     * Waits for the AI list when an album needs it; the Home scan uses `scanArtist` instead.
     * @param {string} artistName
     * @returns {Promise<Array>} Grouped albums
     */
    async getArtistDiscography(artistName) {
        const normalizedArtist = this.normalizer.normalize(artistName);
        console.log(`[AlbumSearch] Fetching discography for "${normalizedArtist}"`);

        const rawAlbums = await this._catalogAlbums(artistName, normalizedArtist);
        if (rawAlbums.length === 0) return [];
        return await this._processDiscography(rawAlbums, normalizedArtist);
    }

    /**
     * The scan of the Home (F67): the albums as soon as the catalog answers, classified without
     * the AI list; the list is asked after, and `reclassified` gives the albums classified again.
     * The catalog has a deadline (CATALOG_DEADLINE_MS): past it, the scan fails with DeadlineError.
     * @param {string} artistName
     * @returns {Promise<{ albums: Array, reclassified: Promise<Array|null>|null }>} `reclassified`
     *          is null when no album needs the AI list (or the list is already remembered); it
     *          resolves to null when the list did not come or is empty: the first albums stay.
     */
    async scanArtist(artistName) {
        const normalizedArtist = this.normalizer.normalize(artistName);
        const rawAlbums = await withDeadline(this._catalogAlbums(artistName, normalizedArtist), CATALOG_DEADLINE_MS, 'the catalog');
        if (rawAlbums.length === 0) return { albums: [], reclassified: null };

        // First pass: with the list already remembered, or with none. It never waits for the server.
        const remembered = this.aiCache.has(normalizedArtist);
        let listWanted = false;
        const albums = await this._classifyAll(rawAlbums, {
            getAiList: async () => {
                listWanted = !remembered;
                return remembered ? this.aiCache.get(normalizedArtist) : [];
            }
        });

        const reclassified = listWanted ? this._reclassifyWithAiList(rawAlbums, normalizedArtist) : null;
        return { albums, reclassified };
    }

    /**
     * Second pass of the scan: asks the AI list (one paid ask, with a deadline) and classifies again.
     * @returns {Promise<Array|null>} null when the list did not come or has nothing: nothing to change
     */
    async _reclassifyWithAiList(rawAlbums, artistName) {
        let list = [];
        try {
            list = await withDeadline(this._fetchAIWithCache(artistName), AI_LIST_DEADLINE_MS, 'the AI list');
        } catch (error) {
            console.warn(`[AlbumSearch] AI list not available (${error?.message || error}), keeping the first classification`);
        }
        if (list.length === 0) return null;
        return this._classifyAll(rawAlbums, { getAiList: async () => list });
    }

    /**
     * The albums of an artist in the catalog, trying the alternative name when the first gives none.
     * @returns {Promise<Array>} raw catalog albums (may be empty)
     */
    async _catalogAlbums(artistName, normalizedArtist) {
        const rawAlbums = await musicKitService.getArtistAlbums(normalizedArtist);
        if (rawAlbums.length > 0) return rawAlbums;

        const alternatives = this.normalizer.getAlternatives(artistName);
        if (alternatives.length < 2) return [];
        console.log(`[AlbumSearch] No results, trying alternative: "${alternatives[1]}"`);
        return musicKitService.getArtistAlbums(alternatives[1]);
    }

    /**
     * Sprint 17.75-B: Fetch AI studio albums with caching
     * Only what the AI answered is remembered (a list, or "there is none"). When it could not be
     * known (F52), the caller gets an empty list for this once and the next search asks again.
     * @param {string} artistName - Normalized artist name
     * @returns {Promise<string[]>} - Array of AI-verified studio album titles
     */
    async _fetchAIWithCache(artistName) {
        if (this.aiCache.has(artistName)) return this.aiCache.get(artistName);

        const { albums, known } = await this._fetchAIStudioAlbums(artistName);
        if (known) this.aiCache.set(artistName, albums);
        return albums;
    }

    /**
     * One ask to POST /api/ai/studio-albums (a paid route: it is never asked again by itself).
     * @returns {Promise<{ albums: string[], known: boolean }>} known is false when the server or
     *          the AI failed: the empty list then means "not known", not "the artist has none"
     */
    async _fetchAIStudioAlbums(artistName) {
        const notKnown = (reason) => {
            console.warn(`[AlbumSearch] AI list not available (${reason}), falling back to heuristics`);
            return { albums: [], known: false };
        };
        const listOf = (albums) => ({ albums: Array.isArray(albums) ? albums : [], known: true });

        let result;
        try {
            const res = await serverFetch('/api/ai/studio-albums', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ artistName })
            });
            result = await readServerResult(res);
        } catch (err) {
            return notKnown(err?.message || err);
        }

        if (result.kind === ResultKind.FAILED) return notKnown(`HTTP ${result.status} ${result.code}`);
        if (result.kind !== ResultKind.LEGACY) return listOf(result.data?.albums);
        // The server before F52 answered 200 with { albums: [], error } when it failed
        if (result.body?.error) return notKnown('the server reported an error');
        return listOf(result.body?.albums);
    }

    /**
     * Process discography with async classification
     * Sprint 17.75-B: Uses lazy AI fetching via context.getAiList()
     */
    async _processDiscography(albums, artistName) {
        console.log(`[AlbumSearch] Classifying ${albums.length} albums for "${artistName}"`);

        // One ask per search, even when it fails: each ask of the list may be paid
        let aiList = null;
        return this._classifyAll(albums, {
            getAiList: () => (aiList ??= this._fetchAIWithCache(artistName))
        });
    }

    /**
     * Classify the catalog albums and group their variants.
     * @param {Array} albums - raw catalog albums
     * @param {{ getAiList: Function }} context - how the classifier gets the AI list when it needs it
     * @returns {Promise<Array>} grouped albums
     */
    async _classifyAll(albums, context) {
        const mapped = [];
        for (const a of albums) {
            const classification = await albumTypeClassifier.classify(a, context);

            mapped.push({
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
            });
        }

        // Group Variants
        return this.groupVariants(mapped);
    }

    // NOTE: Classification logic has been moved to AlbumTypeClassifier (ARCH-18)
    // See: public/js/services/album-search/classification/
    // Pipeline: AppleMetadataStrategy → TitleKeywordStrategy → RemixTracksStrategy → 
    //           TrackCountStrategy → AIWhitelistStrategy

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
