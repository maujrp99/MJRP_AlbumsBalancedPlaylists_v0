/**
 * SpotifyEnrichmentStore
 * 
 * Firestore-backed store for Spotify enrichment data.
 * Refactored to use SpotifyEnrichmentRepository (ARCH-2).
 * 
 * Features:
 * - Deterministic keys (normalized artist-album)
 * - Lazy cleanup (orphan detection on read)
 * - TTL validation (30-day expiration)
 * - Schema versioning
 * 
 * @see docs/technical/specs/sprint13-tech-debt/arch-2-standardize-stores_plan.md
 */

import { db } from '../firebase-init.js'
import { SpotifyEnrichmentRepository } from '../repositories/SpotifyEnrichmentRepository.js'
import { CacheManager } from '../cache/CacheManager.js'

class SpotifyEnrichmentStore {
    constructor() {
        const cache = new CacheManager()
        this.repository = new SpotifyEnrichmentRepository(db, cache)
    }

    /**
     * Get enrichment data for an album with lazy validation.
     * If data is invalid (TTL expired, schema mismatch), returns null.
     * If album no longer exists, deletes orphan data.
     * 
     * @param {string} artist - Artist name
     * @param {string} album - Album title
     * @param {Function} [albumExistsCheck] - Optional function to verify album still exists
     * @returns {Promise<Object|null>} Enrichment data or null
     */
    async get(artist, album, albumExistsCheck = null) {
        try {
            const data = await this.repository.getByArtistAlbum(artist, album)

            // Validation: Check TTL and schema
            if (!data || !this.repository.isValid(data)) {
                if (data) {
                    const key = this.repository.normalizeKey(artist, album)
                    console.log(`[EnrichmentStore] Stale data, needs refresh: ${key}`)
                }
                return null
            }

            // Validation: Check if source album still exists (lazy cleanup)
            if (albumExistsCheck && typeof albumExistsCheck === 'function') {
                const exists = await albumExistsCheck(artist, album)
                if (!exists) {
                    const key = this.repository.normalizeKey(artist, album)
                    console.log(`[EnrichmentStore] Orphan cleanup: ${key}`)
                    await this.repository.delete(key)
                    return null
                }
            }

            return data
        } catch (error) {
            const key = this.repository.normalizeKey(artist, album)
            console.error(`[EnrichmentStore] Error getting enrichment for ${key}:`, error)
            return null
        }
    }

    /**
     * Save enrichment data to Firestore.
     * 
     * @param {string} artist - Artist name
     * @param {string} album - Album title
     * @param {Object} enrichmentData - Data from Spotify API
     * @returns {Promise<void>}
     */
    async save(artist, album, enrichmentData) {
        try {
            await this.repository.saveEnrichment(artist, album, enrichmentData)
            const key = this.repository.normalizeKey(artist, album)
            console.log(`[EnrichmentStore] Saved enrichment: ${key}`)
        } catch (error) {
            const key = this.repository.normalizeKey(artist, album)
            console.error(`[EnrichmentStore] Error saving enrichment for ${key}:`, error)
            throw error
        }
    }

    /**
     * Quick check if valid enrichment exists without fetching full data.
     * 
     * @param {string} artist - Artist name
     * @param {string} album - Album title
     * @returns {Promise<boolean>} True if valid enrichment exists
     */
    async hasValidEnrichment(artist, album) {
        const data = await this.get(artist, album)
        return data !== null
    }

    /**
     * Delete enrichment data for an album.
     * 
     * @param {string} artist - Artist name
     * @param {string} album - Album title
     * @returns {Promise<void>}
     */
    async delete(artist, album) {
        try {
            const key = this.repository.normalizeKey(artist, album)
            await this.repository.delete(key)
            console.log(`[EnrichmentStore] Deleted enrichment: ${key}`)
        } catch (error) {
            const key = this.repository.normalizeKey(artist, album)
            console.error(`[EnrichmentStore] Error deleting enrichment for ${key}:`, error)
        }
    }

    /**
     * Get count of all enrichments (for stats/debugging).
     * 
     * @returns {Promise<number>} Total count
     */
    async getCount() {
        try {
            return await this.repository.count()
        } catch (error) {
            console.error('[EnrichmentStore] Error getting count:', error)
            return 0
        }
    }

    /**
     * Legacy method - kept for backward compatibility.
     * @deprecated Use repository.normalizeKey() instead
     */
    normalizeKey(artist, album) {
        return this.repository.normalizeKey(artist, album)
    }
}

// Singleton instance
export const spotifyEnrichmentStore = new SpotifyEnrichmentStore()
