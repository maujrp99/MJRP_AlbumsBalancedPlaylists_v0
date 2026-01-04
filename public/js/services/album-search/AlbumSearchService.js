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
     * Get full discography for an artist with filtering capabilities
     * @param {string} artistName 
     * @returns {Promise<Array>} Grouped albums
     */
    async getArtistDiscography(artistName) {
        const normalizedArtist = this.normalizer.normalize(artistName);
        console.log(`[AlbumSearch] Fetching discography for "${normalizedArtist}"`);

        // We use the existing MusicKitService for the heavy lifting of ID lookup + fetch
        // But we wrap it to ensure consistent types
        const rawAlbums = await musicKitService.getArtistAlbums(normalizedArtist);

        if (rawAlbums.length === 0) {
            // Fallback: Try alternatives?
            const alternatives = this.normalizer.getAlternatives(artistName);
            if (alternatives.length > 1) {
                console.log(`[AlbumSearch] No results, trying alternative: "${alternatives[1]}"`);
                const altAlbums = await musicKitService.getArtistAlbums(alternatives[1]);
                if (altAlbums.length > 0) return this._processDiscography(altAlbums);
            }
            return [];
        }

        return this._processDiscography(rawAlbums);
    }

    _processDiscography(albums) {
        // 1. Map to consistent format (including all type flags for filtering)
        const mapped = albums.map(a => ({
            id: a.appleMusicId, // Note: MusicKitService returns 'appleMusicId'
            title: a.title,
            artist: a.artist,
            year: a.year,
            coverUrl: musicKitService.getArtworkUrl(a.artworkTemplate, 300),
            artworkTemplate: a.artworkTemplate, // For higher-res rendering
            type: a.albumType, // 'Album', 'Single', 'Compilation', 'Live', 'EP'
            albumType: a.albumType, // Alias for consistency
            isSingle: a.isSingle || false,
            isCompilation: a.isCompilation || false,
            isLive: a.isLive || false,
            releaseDate: a.releaseDate,
            trackCount: a.trackCount,
            confidence: 1.0, // It's a direct discography fetch, assume 100%
            raw: a
        }));

        // 2. Group Variants (Standard, Deluxe, etc)
        return this.groupVariants(mapped);
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
