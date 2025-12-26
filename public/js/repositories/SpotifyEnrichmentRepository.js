/**
 * SpotifyEnrichmentRepository
 * 
 * Repository for Spotify enrichment data extending BaseRepository.
 * Provides standardized CRUD operations with caching for global spotify_enrichment collection.
 * 
 * @see docs/technical/specs/sprint13-tech-debt/arch-2-standardize-stores_plan.md
 */

import { BaseRepository } from './BaseRepository.js'

const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000 // 30 days TTL
const CURRENT_SCHEMA_VERSION = 1

export class SpotifyEnrichmentRepository extends BaseRepository {
    /**
     * @param {Firestore} firestore - Firestore instance (modular)
     * @param {CacheManager} cache - Cache manager instance
     */
    constructor(firestore, cache) {
        super(firestore, cache)
        // Global collection (not user-scoped)
        this.collectionPath = 'spotify_enrichment'
        this.schemaVersion = CURRENT_SCHEMA_VERSION
    }

    /**
     * Generate a deterministic key from artist and album names.
     * This ensures the same album always maps to the same document.
     * 
     * @param {string} artist - Artist name
     * @param {string} album - Album title
     * @returns {string} Normalized key (URL-safe, max 100 chars)
     */
    normalizeKey(artist, album) {
        return `${artist}-${album}`
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/[^a-z0-9-]/g, '-')     // Replace non-alphanumeric
            .replace(/-+/g, '-')             // Collapse multiple dashes
            .replace(/^-|-$/g, '')           // Trim leading/trailing dashes
            .substring(0, 100)               // Firestore ID limit safety
    }

    /**
     * Validate enrichment data against TTL and schema version.
     * 
     * @param {Object} data - Enrichment data from Firestore
     * @returns {boolean} True if valid, false if expired or wrong schema
     */
    isValid(data) {
        if (!data) return false

        // Check TTL (30 days)
        if (data.enrichedAt && Date.now() - data.enrichedAt > MAX_AGE_MS) {
            return false
        }

        // Check schema version
        if (data.schemaVersion !== CURRENT_SCHEMA_VERSION &&
            data._schemaVersion !== CURRENT_SCHEMA_VERSION) {
            return false
        }

        // Check required fields
        if (!data.spotifyId) {
            return false
        }

        return true
    }

    /**
     * Get enrichment by artist and album names.
     * Convenience method that handles key normalization.
     * 
     * @param {string} artist - Artist name
     * @param {string} album - Album title
     * @returns {Promise<Object|null>} Enrichment data or null
     */
    async getByArtistAlbum(artist, album) {
        const key = this.normalizeKey(artist, album)
        return this.findById(key)
    }

    /**
     * Save enrichment data for an album.
     * Convenience method that handles key normalization and metadata.
     * 
     * @param {string} artist - Artist name
     * @param {string} album - Album title
     * @param {Object} enrichmentData - Data from Spotify API
     * @returns {Promise<string>} Saved document key
     */
    async saveEnrichment(artist, album, enrichmentData) {
        const key = this.normalizeKey(artist, album)

        return this.save(key, {
            ...enrichmentData,
            artist,
            album,
            enrichedAt: Date.now(),
            schemaVersion: CURRENT_SCHEMA_VERSION
        })
    }
}
