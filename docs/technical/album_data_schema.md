# Album Data Schema & Transformations

## 🟢 STATUS (v2.9.0 - Sprint 11 Planning)
**track.artist and track.album fields** are now properly populated by the Algorithm Strategy Pattern.  
The `MJRPBalancedCascadeAlgorithm` uses `markTrackOrigin()` from `BaseAlgorithm` to attach origin album info to each track.

> **Update Sprint 11**: Added `spotifyUrl`, `spotifyId`, and `rankingSource` to Album model.

---

## Data Flow Journey

```
// Sprint 11 Flow:
Raw API Response → normalizeAlbumData() → AlbumsStore → Views (AlbumsView/Inventory/Playlists)
```

---

## Stage 1: Raw API Response (Backend)

### API Endpoint Response Structure
```json
{
  "title": "Shake Your Money Maker",
  "artist": "The Black Crowes",
  "year": 1990,
  "bestEverAlbumId": "123",
  "bestEverUrl": "https://...",
  "bestEverEvidence": [...],
  
  "tracks": [
    {
      "title": "Twice As Hard",
      "position": 1,
      "duration": 245,
      "rating": null,
      "metadata": {
        "isrc": "...",
        "appleMusicId": "...",
        "spotifyId": "..."
      }
    }
  ],
  
  "tracksByAcclaim": [
    {
      "title": "Hard to Handle",
      "rank": 1,
      "rating": 92,
      "normalizedScore": 0.95,
      "acclaimRank": 1,
      "finalPosition": 1,
      "position": 3,
      "duration": 185
    }
  ],
  
  "rankingConsolidated": [...],
  "rankingConsolidatedMeta": {
    "source": "hybrid-curation"
  },
  "metadata": {...}
}
```

**Key Points:**
- `tracks` = Original album order (AS IS from disc)
- `tracksByAcclaim` = Sorted by acclaim/rating (RANKED)
- Track objects do NOT have `artist` or `album` fields yet

---

## Stage 2: Normalization (ApiClient.normalizeAlbumData)

### Current Implementation (LINE 209-311)

```javascript
normalizeAlbumData(data) {
  const id = this.generateAlbumId(data)
  const originalTracks = data.tracks || []
  const rankedTracks = data.tracksByAcclaim || data.rankingConsolidated || []
  
  const normalized = {
    id: "the-black-crowes_shake-your-money-maker",
    title: "Shake Your Money Maker",
    artist: "The Black Crowes",  // ✅ Album-level
    year: 1990,
    
    tracks: rankedTracks.map((track, idx) => ({
      ...track,
      title: track.title,
      rank: track.rank || idx + 1,
      rating: track.rating,
      duration: track.duration,
      position: track.position,
      // 🔴 MISSING: artist field
      // 🔴 MISSING: album field
      metadata: {...}
    })),
    
    tracksOriginalOrder: originalTracks.map((track, idx) => ({
      ...track,
      title: track.title,
      position: track.position || idx + 1,
      // 🔴 MISSING: artist field
      // 🔴 MISSING: album field
    }))
  }
  
  return normalized
}
```

### What's Missing

```javascript
// 🔴 CURRENT: Track object lacks context
{
  title: "Hard to Handle",
  rank: 1,
  rating: 92
  // artist: ??? MISSING
  // album: ??? MISSING
}

// ✅ SHOULD BE: Track with full context
{
  title: "Hard to Handle",
  artist: "The Black Crowes",  // ← From album.artist
  album: "Shake Your Money Maker",  // ← From album.title
  rank: 1,
  rating: 92
}
```

---

## Stage 3: Store (AlbumsStore.addAlbum)

### Current Implementation (LINE 40-62)

```javascript
addAlbum(album) {
  // Calls normalizeTrack on each track
  if (album.tracks && Array.isArray(album.tracks)) {
    album.tracks = album.tracks.map(track => this.normalizeTrack(track))
  }
  
  this.albums.push(album)
}
```

### AlbumsStore.normalizeTrack (LINE 64-89)

```javascript
normalizeTrack(track) {
  return {
    title: track.title || '',
    artist: track.artist || '',  // 🔴 Empty if not in track object!
    duration: track.duration || 0,
    rating: track.rating || null,
    position: track.position || null,
    metadata: {
      isrc: track.metadata?.isrc || track.isrc || null,
      appleMusicId: track.metadata?.appleMusicId || null,
      spotifyId: track.metadata?.spotifyId || null,
      ...track.metadata
    }
  }
}
```

**Problem**: `normalizeTrack` expects `track.artist` to exist, but it was never populated in `normalizeAlbumData`!

---

## Stage 4: Views Consumption

### AlbumsView (Grid/Expanded)
**Uses:** `album.title`, `album.artist`, `album.year`, `tracks.length`
**Status:** ✅ Works - uses album-level fields

### RankingView (Dual Tracklists)
**Uses:** `album.title`, `album.artist`, `track.title`, `track.rating`, `track.rank`
**Status:** ⚠️ Missing `track.artist` for per-track display

### PlaylistsView (Generated Playlists)
**Uses:** `track.title`, `track.artist`, `track.album`, `track.rank`, `track.rating`
**Status:** 🔴 BROKEN - `track.artist` and `track.album` are empty!

#### PlaylistsView.renderTrack (LINE 205-239)

```javascript
renderTrack(track, playlistIndex, trackIndex) {
  return `
    <div class="track-title">${track.title}</div>
    <div class="track-meta">
      ${track.artist ? /* ← ALWAYS FALSE! */ 
        `<div>${track.artist}</div>` : ''}
      ${track.album ? /* ← ALWAYS FALSE! */
        `<span>${track.album}</span>` : ''}
    </div>
  `
}
```

---

## Data Schema Comparison

### Current Flow (BROKEN)

```
API Response
├─ album: "Shake Your Money Maker"
├─ artist: "The Black Crowes"
└─ tracks: [
     {
       title: "Hard to Handle",
       rank: 1
       // ❌ No artist
       // ❌ No album
     }
   ]

↓ normalizeAlbumData() ↓

Normalized Album
├─ title: "Shake Your Money Maker"
├─ artist: "The Black Crowes"
└─ tracks: [
     {
       title: "Hard to Handle",
       rank: 1
       // 🔴 STILL no artist
       // 🔴 STILL no album
     }
   ]

↓ AlbumsStore.normalizeTrack() ↓

Stored Track
{
  title: "Hard to Handle",
  artist: "",  // ← Empty!
  album: ???,  // ← Doesn't even exist!
  rank: 1
}

↓ PlaylistsView.renderTrack() ↓

Rendered HTML
<div class="track-title">Hard to Handle</div>
<div class="track-meta">
  <!-- Artist div is NOT rendered (falsy) -->
  <!-- Album span is NOT rendered (falsy) -->
</div>
```

### Proposed Flow (FIXED)

```
API Response
└─ tracks: [...]

↓ normalizeAlbumData() (MODIFIED) ↓

tracks: rankedTracks.map((track, idx) => ({
  ...track,
  title: track.title,
  artist: data.artist,  // ✅ ADD THIS
  album: data.title,    // ✅ ADD THIS
  rank: track.rank || idx + 1,
  rating: track.rating
}))

↓ AlbumsStore.normalizeTrack() ↓

{
  title: "Hard to Handle",
  artist: "The Black Crowes",  // ✅ Present!
  album: "Shake Your Money Maker",  // ✅ Present!
  rank: 1
}

↓ PlaylistsView.renderTrack() ↓

<div class="track-title">Hard to Handle</div>
<div class="track-meta">
  <div>The Black Crowes</div>  // ✅ Rendered!
  <span>Shake Your Money Maker</span>  // ✅ Rendered!
</div>
```

---

## Required Fix

### File: `public/js/api/client.js`
### Method: `normalizeAlbumData()` (LINE 209-311)

## 🗺️ Detailed Data Mapping (The "Source of Truth")

This section maps exactly where each critical piece of data comes from and how it travels.

### 1. Track Lists Origin & Flow

| Data Concept | Backend Source (JSON) | Client Normalization (`client.js`) | Store State (`albums.js`) | Curation Usage (`curation.js`) | View Render (`AlbumsView.js`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Original Order** | `data.tracks` (Array) | `tracksOriginalOrder` | `album.tracksOriginalOrder` | Used as fallback if ranking fails | `renderOriginalTracklist` |
| **Acclaim Order** | `data.tracksByAcclaim` | `tracks` (if available) | `album.tracks` | Used for `generatePlaylists` | `renderRankedTracklist` |
| **Consolidated** | `data.rankingConsolidated` | `tracks` (fallback) | `album.tracks` | Used for `generatePlaylists` | `renderRankedTracklist` |

### 2. Field-Level Mapping (The "Lost Data" Investigation)

#### A. Original Track Object (`tracksOriginalOrder`)

| Field | Source in `data.tracks` | Transformation in `normalizeAlbumData` | Status in Store | Status in View |
| :--- | :--- | :--- | :--- | :--- |
| `title` | `track.title` | `track.title || track.name` | ✅ Preserved | ✅ Rendered |
| `position` | `track.position` | `track.position || idx + 1` | ✅ Preserved | ✅ Used for numbering |
| `artist` | **MISSING** | `data.artist` (Added in Fix) | ✅ Preserved | ✅ Rendered (after fix) |
| `album` | **MISSING** | `data.title` (Added in Fix) | ✅ Preserved | ✅ Rendered (after fix) |

#### B. Ranked Track Object (`tracks`)

| Field | Source in `data.tracksByAcclaim` | Transformation in `normalizeAlbumData` | Status in Store | Status in View |
| :--- | :--- | :--- | :--- | :--- |
| `title` | `track.title` | `track.title` | ✅ Preserved | ✅ Rendered |
| `rank` | `track.rank` | `track.rank || track.acclaimRank` | ✅ Preserved | ✅ Used for numbering |
| `rating` | `track.rating` | `track.rating` | ✅ Preserved | ✅ Used for stars |
| `artist` | **MISSING** | `data.artist` (Added in Fix) | ✅ Preserved | ✅ Rendered (after fix) |

### 3. Critical Transformation Points (Where things go wrong)

#### Point A: `client.js` Normalization
```javascript
// Input: data.tracks (Array of objects)
// Logic:
tracksOriginalOrder: data.tracks.map((track, idx) => ({
  ...track,
  position: track.position || idx + 1 // ⚠️ Critical: Relies on array order if position missing
}))
```

#### Point B: `curation.js` Enrichment
```javascript
// Input: album.tracks (Ranked) OR album.rankingConsolidated
// Logic:
enrichTracks(album) {
   // ⚠️ Critical: Re-creates track objects.
   // MUST copy artist/album from parent album.
   // MUST preserve original ID to map back to original order.
}
```

#### Point C: `AlbumsView.js` Rendering
```javascript
// Input: album.tracksOriginalOrder
// Logic:
renderOriginalTracklist(album) {
  const tracks = album.tracksOriginalOrder || album.tracks // ⚠️ Fallback risk
  // If tracksOriginalOrder is missing/empty, it shows Ranked order!
}
```

### 4. Hypothesis for "Original Order" Regression

If `tracksOriginalOrder` is **undefined** or **empty** in the Store, `AlbumsView` falls back to `album.tracks` (which is Ranked Order).

**Why would it be undefined?**
1. `client.js` failed to populate it (unlikely, code looks safe).
2. `AlbumsStore` failed to save it (checked, looks safe).
3. **CACHE POISONING**: Old data in `localStorage` or `IndexedDB` has `tracks` but NO `tracksOriginalOrder`.
   - When loading from cache, `tracksOriginalOrder` is undefined.
   - View falls back to `tracks` (Ranked).
   - User sees "Ranked Order" in the "Original Order" column.

**Solution**: Hard Refresh / Clear Cache is mandatory to fix this state.
