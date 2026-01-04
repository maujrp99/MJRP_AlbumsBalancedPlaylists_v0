# Background Enrichment Job - Feature Spec

**Created**: 2025-12-23  
**Updated**: 2025-12-23  
**Sprint**: 12 (V3 Architecture)  
**Status**: 🟢 APPROVED

---

## 1. Problem Statement

### Current State
Albums in the collection may lack Spotify enrichment data (track popularity, Spotify IDs, artwork). This data is required for:
- **Spotify-based ranking** (Top N Popular algorithms)
- **Export to Spotify** functionality
- **Rich metadata display**

Currently, enrichment happens on-demand when viewing an album, which is slow and inconsistent.

### Business Need
Automatically enrich all albums in the background when user connects to Spotify, ensuring data is ready for immediate use in Blending Menu algorithms.

---

## 2. Architecture Decision

### ✅ Storage: **Firestore Only**

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Primary Storage** | Firestore | Single source of truth |
| **Local Cache** | Firestore offline persistence | Built-in, zero extra code |
| **IndexedDB/localStorage** | ❌ Not used | Avoids ghost data issues |

**Benefits:**
- Single Source of Truth = zero ghost data
- Firestore offline persistence = automatic caching
- Less code (~150 LOC vs ~280 LOC hybrid)
- Lazy cleanup integrated

---

## 3. Anti-Ghost Strategies

### 👻 Ghost Data Prevention

```javascript
// 1. DETERMINISTIC KEYS (prevents duplicates)
function normalizeKey(artist, album) {
    return `${artist}-${album}`
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
}
// Ex: "The Beatles - Abbey Road" → "the-beatles-abbey-road"

// 2. LAZY CLEANUP (on every read)
async getEnrichment(artist, album) {
    const key = normalizeKey(artist, album)
    const doc = await getDoc(doc(db, 'spotify_enrichment', key))
    
    if (!doc.exists()) return null
    
    const data = doc.data()
    
    // VALIDATION 1: Album still exists in master list?
    const albumExists = await albumLoader.findAlbum(artist, album)
    if (!albumExists) {
        console.log(`[Enrichment] Orphan cleanup: ${key}`)
        await deleteDoc(doc.ref)
        return null
    }
    
    // VALIDATION 2: TTL expired? (re-enrich after 30 days)
    const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
    if (Date.now() - data.enrichedAt > MAX_AGE_MS) {
        return null // Trigger re-enrichment
    }
    
    // VALIDATION 3: Schema version matches?
    if (data.schemaVersion !== CURRENT_SCHEMA_VERSION) {
        return null // Re-enrich with new schema
    }
    
    return data
}

// 3. VERSION TRACKING
const CURRENT_SCHEMA_VERSION = 1
```

### Deletion Scenarios

| Event | Enrichment Action | Reason |
|-------|-------------------|--------|
| Remove album from series | **Keep** | May be used by other series |
| Delete entire series | **Keep** | Albums still exist, enrichment is global |
| Remove album from master list | **Lazy Delete** | Cleaned on next access attempt |
| No access for 30+ days | **Re-enrich** | TTL ensures fresh data |

---

## 4. Technical Design

### Firestore Collection: `spotify_enrichment`

```javascript
// Document ID = normalizeKey(artist, album)
// Ex: "the-beatles-abbey-road"

{
    spotifyId: "0ETFjACtuP2ADo6LFhL6HN",
    spotifyPopularity: 85,  // 0-100
    trackPopularity: [
        { title: "Come Together", popularity: 92, uri: "spotify:track:..." },
        { title: "Something", popularity: 87, uri: "spotify:track:..." },
        // ...
    ],
    artworkUrl: "https://i.scdn.co/image/...",
    enrichedAt: 1703354400000,  // timestamp
    schemaVersion: 1
}
```

### New Service: `SpotifyEnrichmentStore.js`

```javascript
import { db } from '../firebase/config.js'
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore'

const COLLECTION = 'spotify_enrichment'
const CURRENT_SCHEMA_VERSION = 1
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

class SpotifyEnrichmentStore {
    
    // Deterministic key generation
    normalizeKey(artist, album) {
        return `${artist}-${album}`
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
    }
    
    // GET with lazy cleanup
    async get(artist, album) {
        const key = this.normalizeKey(artist, album)
        const docRef = doc(db, COLLECTION, key)
        const snapshot = await getDoc(docRef)
        
        if (!snapshot.exists()) return null
        
        const data = snapshot.data()
        
        // Lazy validation
        if (!this.isValid(data)) {
            await deleteDoc(docRef)
            return null
        }
        
        return data
    }
    
    // Validation checks
    isValid(data) {
        // TTL check
        if (Date.now() - data.enrichedAt > MAX_AGE_MS) return false
        
        // Schema check
        if (data.schemaVersion !== CURRENT_SCHEMA_VERSION) return false
        
        return true
    }
    
    // SAVE enrichment
    async save(artist, album, enrichmentData) {
        const key = this.normalizeKey(artist, album)
        await setDoc(doc(db, COLLECTION, key), {
            ...enrichmentData,
            enrichedAt: Date.now(),
            schemaVersion: CURRENT_SCHEMA_VERSION
        })
    }
    
    // CHECK if enrichment exists and is valid
    async hasValidEnrichment(artist, album) {
        const data = await this.get(artist, album)
        return data !== null
    }
}

export const spotifyEnrichmentStore = new SpotifyEnrichmentStore()
```

### Background Worker: `SpotifyEnrichmentService.js`

```javascript
class SpotifyEnrichmentService {
    constructor() {
        this.queue = []
        this.isRunning = false
        this.completed = 0
        this.total = 0
        this.listeners = new Set()
    }

    // Start enrichment when Spotify auth succeeds
    async startEnrichment() {
        if (this.isRunning) return
        
        this.queue = await this.buildQueue()
        this.total = this.queue.length
        this.completed = 0
        
        if (this.total === 0) {
            this.notify({ type: 'already_complete' })
            return
        }
        
        this.isRunning = true
        this.notify({ type: 'started', total: this.total })
        await this.processQueue()
    }

    // Build queue of albums needing enrichment
    async buildQueue() {
        const albums = albumLoader.getAllAlbums()
        const needsEnrichment = []
        
        for (const album of albums) {
            const hasValid = await spotifyEnrichmentStore.hasValidEnrichment(
                album.artist, album.title
            )
            if (!hasValid) {
                needsEnrichment.push(album)
            }
        }
        
        return needsEnrichment
    }

    // Process queue with rate limiting
    async processQueue() {
        const BATCH_SIZE = 10
        const DELAY_MS = 100 // 10 req/sec max
        
        while (this.queue.length > 0 && this.isRunning) {
            const batch = this.queue.splice(0, BATCH_SIZE)
            
            for (const album of batch) {
                await this.enrichAlbum(album)
                await this.sleep(DELAY_MS)
            }
        }
        
        this.isRunning = false
        this.notify({ type: 'completed', completed: this.completed, total: this.total })
    }

    // Enrich single album
    async enrichAlbum(album) {
        try {
            const data = await spotifyService.enrichAlbumData(album.artist, album.title)
            if (data) {
                await spotifyEnrichmentStore.save(album.artist, album.title, {
                    spotifyId: data.spotifyId,
                    spotifyPopularity: data.spotifyPopularity,
                    trackPopularity: data.trackPopularity,
                    artworkUrl: data.artworkUrl
                })
            }
            this.completed++
            this.notify({ type: 'progress', completed: this.completed, total: this.total })
        } catch (error) {
            console.warn(`[Enrichment] Failed: ${album.artist} - ${album.title}`)
        }
    }
    
    // Event subscription
    subscribe(callback) {
        this.listeners.add(callback)
        return () => this.listeners.delete(callback)
    }
    
    notify(event) {
        this.listeners.forEach(cb => cb(event))
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
    
    pause() {
        this.isRunning = false
    }
}

export const spotifyEnrichmentService = new SpotifyEnrichmentService()
```

---

## 5. Integration Points

| Location | Change |
|----------|--------|
| `SpotifyService.onAuthSuccess()` | Trigger `spotifyEnrichmentService.startEnrichment()` |
| `TopNavComponent` | Show enrichment progress indicator |
| `SpotifyRankingStrategy` | Use `spotifyEnrichmentStore.get()` for popularity data |

---

## 6. UI Design

### Progress Toast
```
┌─────────────────────────────────────────────┐
│  🎵 Enriching albums with Spotify data...  │
│  ████████████░░░░░░░░ 67/120               │
│  [Pause] [×]                                │
└─────────────────────────────────────────────┘
```

### Status Badge (when complete)
```
┌─────────────────────────────────────────────┐
│  ✅ Spotify: 120 albums enriched            │
│  Last updated: 5 min ago                    │
└─────────────────────────────────────────────┘
```

---

## 7. Acceptance Criteria

1. [ ] Enrichment starts automatically on Spotify auth
2. [ ] Progress indicator shows albums processed
3. [ ] Rate limiting prevents API throttling
4. [ ] Data persists in Firestore (survives cache clear)
5. [ ] Lazy cleanup removes orphaned enrichments
6. [ ] TTL triggers re-enrichment after 30 days
7. [ ] User can pause/resume enrichment
8. [ ] Blending Menu algorithms use enriched data

---

## 8. Implementation Priority

| Phase | Scope | Est. LOC |
|-------|-------|----------|
| Phase 1 | `SpotifyEnrichmentStore` (Firestore CRUD) | ~80 |
| Phase 2 | `SpotifyEnrichmentService` (queue + worker) | ~100 |
| Phase 3 | Progress UI (toast + TopNav indicator) | ~50 |
| Phase 4 | Integration with ranking strategies | ~30 |

**Total**: ~260 LOC
