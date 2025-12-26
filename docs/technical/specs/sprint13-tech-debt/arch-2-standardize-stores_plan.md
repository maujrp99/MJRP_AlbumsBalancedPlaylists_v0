# Plan: ARCH-2 Standardize Stores

**Created**: 2025-12-26  
**Status**: Draft - Awaiting User Review  
**Spec**: [arch-2-standardize-stores_spec.md](./arch-2-standardize-stores_spec.md)

---

## Goal

Refactor `SpotifyEnrichmentStore` to use `BaseRepository` pattern, eliminating custom Firestore code and ensuring architectural consistency.

---

## Current State Analysis

### SpotifyEnrichmentStore.js (241 LOC)

| Method | Does What | BaseRepository Equivalent |
|--------|-----------|--------------------------|
| `get(artist, album)` | Fetch by normalized key + TTL validation | `findById()` + custom validation |
| `save(artist, album, data)` | setDoc with schema version | `save()` ✅ Compatible |
| `delete(artist, album)` | deleteDoc | `delete()` ✅ Compatible |
| `hasValidEnrichment()` | Calls get() and checks null | Keep as helper |
| `getCount()` | getDocs + snapshot.size | `count()` ✅ Compatible |
| `normalizeKey()` | Generate deterministic key | **KEEP** (domain-specific) |
| `isValid()` | TTL + schema check | **KEEP** (domain-specific) |

### BaseRepository.js (337 LOC)

**Key Features:**
- Cache integration (L1/L2)
- Standardized CRUD (create, findById, save, update, delete)
- Schema versioning
- Batch operations

**Gap Identified:**
- BaseRepository expects `this.collectionPath` as static user-scoped path
- SpotifyEnrichment uses **global** collection (`spotify_enrichment`)

---

## Architecture Decision

### Option A: Extend BaseRepository with Global Collection Support ✅ RECOMMENDED

```javascript
// SpotifyEnrichmentRepository.js
export class SpotifyEnrichmentRepository extends BaseRepository {
    constructor(firestore, cache) {
        super(firestore, cache)
        this.collectionPath = 'spotify_enrichment' // Global, no userId
    }
    
    // Override key generation for normalized artist-album key
    normalizeKey(artist, album) {
        return `${artist}-${album}`
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 100)
    }
}
```

### Option B: Modify BaseRepository for scoped/global mode

```javascript
// Would require changes to BaseRepository constructor
constructor(firestore, cache, options = { scoped: true })
```

**Decision**: Option A is cleaner - no changes to BaseRepository needed.

---

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Component Architecture                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐     ┌─────────────────────────────┐   │
│  │ SpotifyEnrichment   │     │ SpotifyEnrichmentRepository │   │
│  │      Store          │────▶│  (extends BaseRepository)   │   │
│  │  (Business Logic)   │     │  (Data Access Layer)        │   │
│  └─────────────────────┘     └─────────────────────────────┘   │
│           │                              │                      │
│           │ • get()                      │ • findById()         │
│           │ • save()                     │ • save()             │
│           │ • delete()                   │ • delete()           │
│           │ • isValid()                  │ • count()            │
│           │ • normalizeKey()             │                      │
│           │ • hasValidEnrichment()       │                      │
│           ▼                              ▼                      │
│   ┌────────────┐                ┌─────────────────┐            │
│   │ TTL/Schema │                │    Firestore    │            │
│   │ Validation │                │ spotify_enrichment│           │
│   └────────────┘                └─────────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Refactoring Plan

### Step 1: Create SpotifyEnrichmentRepository.js

```javascript
// public/js/repositories/SpotifyEnrichmentRepository.js

import { BaseRepository } from './BaseRepository.js'

const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
const CURRENT_SCHEMA_VERSION = 1

export class SpotifyEnrichmentRepository extends BaseRepository {
    constructor(firestore, cache) {
        super(firestore, cache)
        this.collectionPath = 'spotify_enrichment' // Global collection
        this.schemaVersion = CURRENT_SCHEMA_VERSION
    }
    
    /**
     * Generate normalized key (domain-specific)
     */
    normalizeKey(artist, album) {
        return `${artist}-${album}`
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 100)
    }
    
    /**
     * Validate enrichment data (domain-specific)
     */
    isValid(data) {
        if (!data) return false
        if (data.enrichedAt && Date.now() - data.enrichedAt > MAX_AGE_MS) return false
        if (data.schemaVersion !== CURRENT_SCHEMA_VERSION) return false
        if (!data.spotifyId) return false
        return true
    }
    
    /**
     * Get by artist-album (convenience method)
     */
    async getByArtistAlbum(artist, album) {
        const key = this.normalizeKey(artist, album)
        return this.findById(key)
    }
    
    /**
     * Save by artist-album (convenience method)
     */
    async saveEnrichment(artist, album, enrichmentData) {
        const key = this.normalizeKey(artist, album)
        return this.save(key, {
            ...enrichmentData,
            artist,
            album,
            enrichedAt: Date.now()
        })
    }
}
```

### Step 2: Refactor SpotifyEnrichmentStore.js

```javascript
// public/js/stores/SpotifyEnrichmentStore.js (AFTER)

import { db } from '../firebase-init.js'
import { SpotifyEnrichmentRepository } from '../repositories/SpotifyEnrichmentRepository.js'
import { CacheManager } from '../cache/CacheManager.js'

class SpotifyEnrichmentStore {
    constructor() {
        this.repository = new SpotifyEnrichmentRepository(db, new CacheManager())
    }
    
    async get(artist, album, albumExistsCheck = null) {
        const data = await this.repository.getByArtistAlbum(artist, album)
        
        // Validation
        if (!data || !this.repository.isValid(data)) {
            return null
        }
        
        // Orphan cleanup (lazy)
        if (albumExistsCheck && typeof albumExistsCheck === 'function') {
            const exists = await albumExistsCheck(artist, album)
            if (!exists) {
                await this.delete(artist, album)
                return null
            }
        }
        
        return data
    }
    
    async save(artist, album, enrichmentData) {
        return this.repository.saveEnrichment(artist, album, enrichmentData)
    }
    
    async delete(artist, album) {
        const key = this.repository.normalizeKey(artist, album)
        return this.repository.delete(key)
    }
    
    async hasValidEnrichment(artist, album) {
        const data = await this.get(artist, album)
        return data !== null
    }
    
    async getCount() {
        return this.repository.count()
    }
}

export const spotifyEnrichmentStore = new SpotifyEnrichmentStore()
```

---

## Files to Change

| File | Change Type | Description |
|------|-------------|-------------|
| `repositories/SpotifyEnrichmentRepository.js` | **NEW** | Repository extending BaseRepository |
| `stores/SpotifyEnrichmentStore.js` | **REFACTOR** | Delegate to repository |

### Lines of Code Impact

| Component | Before | After | Δ |
|-----------|--------|-------|---|
| SpotifyEnrichmentStore.js | 241 | ~80 | -161 |
| SpotifyEnrichmentRepository.js | 0 | ~70 | +70 |
| **Net Change** | - | - | **-91 LOC** |

---

## Verification Plan

### 1. Unit Tests

```bash
# Run existing tests (should pass)
npm test -- --grep "SpotifyEnrichment"
```

### 2. Manual Verification

1. **Open app** at `http://mjrp.local:5000`
2. **Navigate to Albums** view with Spotify-enriched series
3. **Verify enrichment data** loads correctly (check console for `[EnrichmentStore]` logs)
4. **Add new album** → Verify enrichment saves
5. **Check Firestore** console → `spotify_enrichment` collection should have entries

### 3. Regression Check

- [ ] Enrichment loads on page refresh
- [ ] Enrichment shows in Blending Menu
- [ ] Enrichment persists after logout/login
- [ ] No console errors

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cache invalidation timing differs | Medium | Test thoroughly, compare behavior |
| Global collection path issue | Low | Already works, just formalizing |
| Breaking change to enrichment format | High | Keep schema version check |

---

## Status: Awaiting User Review

> [!IMPORTANT]
> Please confirm:
> 1. Option A (extend BaseRepository) vs Option B (modify BaseRepository)?
> 2. Should we add more convenience methods to Repository?
> 3. Proceed with implementation?
