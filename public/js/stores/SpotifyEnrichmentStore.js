/**
 * SpotifyEnrichmentStore
 * 
 * Firestore-backed store for Spotify enrichment data with:
 * - Deterministic keys (normalized artist-album)
 * - Lazy cleanup (orphan detection on read)
 * - TTL validation (30-day expiration)
 * - Schema versioning
 * 
 * ============================================================================
 * ⚠️ WORKAROUND: USER-SCOPED STORAGE (Option B)
 * ============================================================================
 * Current implementation uses user-scoped path to work with existing Firestore rules:
 *   users/{userId}/spotify_enrichment/{albumKey}
 * 
 * PRODUCTION TARGET (Option A - Global Collection):
 *   spotify_enrichment/{albumKey}
 * 
 * WHY THIS WORKAROUND?
 * - Global collection requires new Firestore security rules
 * - User-scoped path reuses existing rules (works immediately)
 * 
 * MIGRATION STEPS FOR PROD:
 * 1. Add Firestore rule: match /spotify_enrichment/{albumKey} { allow read, write: if request.auth != null; }
 * 2. Remove getCollectionPath() method
 * 3. Use COLLECTION = 'spotify_enrichment' directly
 * 4. Remove userStore import
 * 
 * See: docs/technical/specs/sprint12-architecture-v3.0/blending-menu/tasks.md
 * ============================================================================
 * 
 * @see docs/technical/specs/sprint12-architecture-v3.0/blending-menu/background-enrichment-spec.md
 */

import { db } from '../firebase-init.js'
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore'
import { userStore } from './UserStore.js'

// WORKAROUND: Collection name (used under user path for now)
// TARGET: Use as root collection 'spotify_enrichment' when Firestore rules are updated
const COLLECTION_NAME = 'spotify_enrichment'
const CURRENT_SCHEMA_VERSION = 1
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

class SpotifyEnrichmentStore {

    /**
     * Get the user-scoped collection path.
     * 
     * WORKAROUND (Option B): Uses same path structure as SeriesRepository:
     *   artifacts/{appId}/users/{userId}/curator/data/spotify_enrichment/{albumKey}
     * 
     * TARGET (Option A - Prod): Global collection:
     *   spotify_enrichment/{albumKey}
     * 
     * @returns {string|null} Collection path or null if not authenticated
     */
    getCollectionPath() {
        const user = userStore.currentUser
        if (!user) {
            console.warn('[EnrichmentStore] No authenticated user')
            return null
        }

        // Path must match Firebase rules: artifacts/{appId}/users/{userId}/curator/data/...
        // Same structure as SeriesRepository
        const appId = 'mjrp-albums'
        return `artifacts/${appId}/users/${user.uid}/curator/data/${COLLECTION_NAME}`
    }

    /**
     * Generate a deterministic key from artist and album names.
     * This ensures the same album always maps to the same document.
     * 
     * @param {string} artist - Artist name
     * @param {string} album - Album title
     * @returns {string} Normalized key
     */
    normalizeKey(artist, album) {
        return `${artist}-${album}`
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 100) // Firestore ID limit safety
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
        const collectionPath = this.getCollectionPath()
        if (!collectionPath) return null

        const key = this.normalizeKey(artist, album)

        try {
            const docRef = doc(db, collectionPath, key)
            const snapshot = await getDoc(docRef)

            if (!snapshot.exists()) {
                return null
            }

            const data = snapshot.data()

            // Validation 1: Check TTL and schema
            if (!this.isValid(data)) {
                console.log(`[EnrichmentStore] Stale data, needs refresh: ${key}`)
                return null
            }

            // Validation 2: Check if source album still exists (lazy cleanup)
            if (albumExistsCheck && typeof albumExistsCheck === 'function') {
                const exists = await albumExistsCheck(artist, album)
                if (!exists) {
                    console.log(`[EnrichmentStore] Orphan cleanup: ${key}`)
                    await deleteDoc(docRef)
                    return null
                }
            }

            return data
        } catch (error) {
            console.error(`[EnrichmentStore] Error getting enrichment for ${key}:`, error)
            return null
        }
    }

    /**
     * Validate enrichment data.
     * 
     * @param {Object} data - Enrichment data from Firestore
     * @returns {boolean} True if valid, false if expired or wrong schema
     */
    isValid(data) {
        if (!data) return false

        // Check TTL
        if (data.enrichedAt && Date.now() - data.enrichedAt > MAX_AGE_MS) {
            return false
        }

        // Check schema version
        if (data.schemaVersion !== CURRENT_SCHEMA_VERSION) {
            return false
        }

        // Check required fields
        if (!data.spotifyId) {
            return false
        }

        return true
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
        const collectionPath = this.getCollectionPath()
        if (!collectionPath) {
            throw new Error('No authenticated user - cannot save enrichment')
        }

        const key = this.normalizeKey(artist, album)

        try {
            const docRef = doc(db, collectionPath, key)
            await setDoc(docRef, {
                ...enrichmentData,
                artist,
                album,
                enrichedAt: Date.now(),
                schemaVersion: CURRENT_SCHEMA_VERSION
            })

            console.log(`[EnrichmentStore] Saved enrichment: ${key}`)
        } catch (error) {
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
        const collectionPath = this.getCollectionPath()
        if (!collectionPath) return

        const key = this.normalizeKey(artist, album)

        try {
            const docRef = doc(db, collectionPath, key)
            await deleteDoc(docRef)
            console.log(`[EnrichmentStore] Deleted enrichment: ${key}`)
        } catch (error) {
            console.error(`[EnrichmentStore] Error deleting enrichment for ${key}:`, error)
        }
    }

    /**
     * Get count of all enrichments for current user (for stats/debugging).
     * 
     * @returns {Promise<number>} Total count
     */
    async getCount() {
        const collectionPath = this.getCollectionPath()
        if (!collectionPath) return 0

        try {
            const collectionRef = collection(db, collectionPath)
            const snapshot = await getDocs(collectionRef)
            return snapshot.size
        } catch (error) {
            console.error('[EnrichmentStore] Error getting count:', error)
            return 0
        }
    }
}

// Singleton instance
export const spotifyEnrichmentStore = new SpotifyEnrichmentStore()
