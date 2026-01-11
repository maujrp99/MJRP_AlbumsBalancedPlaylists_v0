/**
 * AlbumIdentity Model
 * 
 * Represents a stable identity for an album that survives cache/API round-trips.
 * Tracks both the original query (what user saved) and the resolved album (what API returned).
 * 
 * @module models/AlbumIdentity
 * @since Sprint 13 - CRIT-5b
 */

import { calculateSimilarity, generateAlbumKey, SIMILARITY_THRESHOLD } from '../utils/stringUtils.js'

export class AlbumIdentity {
    /**
     * Create an AlbumIdentity
     * 
     * @param {string} originalQuery - The original search query (e.g., "Artist - Album")
     * @param {Object} resolvedAlbum - The album returned by the API
     * @param {string} resolvedAlbum.title - Album title
     * @param {string} resolvedAlbum.artist - Artist name
     * @param {string} [resolvedAlbum.appleId] - Apple Music ID
     * @param {string} [resolvedAlbum.spotifyId] - Spotify ID
     */
    constructor(originalQuery, resolvedAlbum) {
        this.originalQuery = originalQuery
        this.resolvedTitle = resolvedAlbum?.title || ''
        this.resolvedArtist = resolvedAlbum?.artist || ''
        this.appleId = resolvedAlbum?.appleId || resolvedAlbum?.id || null
        this.spotifyId = resolvedAlbum?.spotifyId || null

        // Calculate confidence on construction
        this._matchConfidence = null
        this._createdAt = new Date().toISOString()
    }

    /**
     * Extract expected album name from the original query
     * @returns {string} Expected album name
     */
    get expectedAlbum() {
        if (typeof this.originalQuery === 'object' && this.originalQuery !== null) {
            const val = this.originalQuery.title || this.originalQuery.album || ''
            // FIX: If value has " - " and artist is missing from object, extract album part
            if (val.includes(' - ') && !this.originalQuery.artist) {
                return val.split(' - ').slice(1).join(' - ').trim()
            }
            return val
        }
        if (this.originalQuery && this.originalQuery.includes(' - ')) {
            return this.originalQuery.split(' - ').slice(1).join(' - ').trim()
        }
        return (this.originalQuery || '').trim()
    }

    /**
     * Extract expected artist from the original query
     * @returns {string} Expected artist name
     */
    get expectedArtist() {
        if (typeof this.originalQuery === 'object' && this.originalQuery !== null) {
            if (this.originalQuery.artist) return this.originalQuery.artist

            // FIX: If artist missing but title has " - ", extract artist part
            const val = this.originalQuery.title || this.originalQuery.album || ''
            if (val.includes(' - ')) {
                return val.split(' - ')[0].trim()
            }
            return ''
        }
        if (this.originalQuery && this.originalQuery.includes(' - ')) {
            return this.originalQuery.split(' - ')[0].trim()
        }
        return ''
    }

    /**
     * Calculate confidence score (0-1) for this match
     * Compares expected vs resolved album/artist names
     * 
     * @returns {number} Confidence (0 = no match, 1 = perfect match)
     */
    get matchConfidence() {
        if (this._matchConfidence !== null) {
            return this._matchConfidence
        }

        const expectedAlbumLower = this.expectedAlbum.toLowerCase()
        const resolvedTitleLower = this.resolvedTitle.toLowerCase()

        let queryLower = ''
        if (typeof this.originalQuery === 'string') {
            queryLower = this.originalQuery.toLowerCase()
        } else if (typeof this.originalQuery === 'object' && this.originalQuery !== null) {
            queryLower = `${this.originalQuery.artist || ''} ${this.originalQuery.title || this.originalQuery.album || ''}`.toLowerCase()
        }

        // Strategy 1: Direct similarity between expected album and resolved title
        const albumSimilarity = calculateSimilarity(this.expectedAlbum, this.resolvedTitle)
        const artistSimilarity = calculateSimilarity(this.expectedArtist, this.resolvedArtist)

        // Strategy 2: Check if resolved title (without edition suffixes) is contained in query
        // This handles cases like query="The Beatles Abbey Road" → resolved="Abbey Road (2019 Mix)"
        const cleanResolvedTitle = resolvedTitleLower
            .replace(/\s*\([^)]*\)/g, '')  // Remove (2019 Mix), (Remastered), etc
            .replace(/\s*\[[^\]]*\]/g, '') // Remove [Deluxe], etc
            .trim()

        const containsMatch = queryLower.includes(cleanResolvedTitle) ||
            cleanResolvedTitle.includes(expectedAlbumLower)

        // If there's a containment match, boost confidence significantly
        const containsBonus = containsMatch && cleanResolvedTitle.length > 3 ? 0.4 : 0

        // Weighted average: album match is more important than artist
        // Album: 70%, Artist: 30%
        let confidence = (albumSimilarity * 0.7) + (artistSimilarity * 0.3) + containsBonus

        // Cap at 1.0
        this._matchConfidence = Math.min(confidence, 1.0)

        return this._matchConfidence
    }

    /**
     * Check if this identity represents a valid match
     * @param {number} [threshold=SIMILARITY_THRESHOLD] - Minimum confidence
     * @returns {boolean} True if valid match, false if should be rejected
     */
    isValid(threshold = SIMILARITY_THRESHOLD) {
        return this.matchConfidence >= threshold
    }

    /**
     * Get a stable cache key for this album
     * Based on resolved (actual) album data, not the query
     * 
     * @returns {string} Stable cache key
     */
    getCacheKey() {
        return generateAlbumKey(this.resolvedArtist, this.resolvedTitle)
    }

    /**
     * Get detailed match information for logging/debugging
     * @returns {Object} Debug info
     */
    getDebugInfo() {
        return {
            query: this.originalQuery,
            expected: {
                album: this.expectedAlbum,
                artist: this.expectedArtist
            },
            resolved: {
                title: this.resolvedTitle,
                artist: this.resolvedArtist,
                appleId: this.appleId
            },
            confidence: (this.matchConfidence * 100).toFixed(1) + '%',
            isValid: this.isValid(),
            cacheKey: this.getCacheKey()
        }
    }

    /**
     * Create identity from plain object (for hydration from cache)
     * @param {Object} data - Serialized identity
     * @returns {AlbumIdentity}
     */
    static fromJSON(data) {
        const identity = new AlbumIdentity(data.originalQuery, {
            title: data.resolvedTitle,
            artist: data.resolvedArtist,
            appleId: data.appleId,
            spotifyId: data.spotifyId
        })
        identity._matchConfidence = data._matchConfidence
        identity._createdAt = data._createdAt
        return identity
    }

    /**
     * Serialize to plain object (for caching)
     * @returns {Object}
     */
    toJSON() {
        return {
            originalQuery: this.originalQuery,
            resolvedTitle: this.resolvedTitle,
            resolvedArtist: this.resolvedArtist,
            appleId: this.appleId,
            spotifyId: this.spotifyId,
            _matchConfidence: this._matchConfidence,
            _createdAt: this._createdAt
        }
    }
}
