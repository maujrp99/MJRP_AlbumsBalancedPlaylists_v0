# Album Data Schema & Transformations

## 🔴 CRITICAL FINDING
**track.artist and track.album fields are NOT being populated in normalizeAlbumData!**
This is why they don't appear in PlaylistsView.

---

## Data Flow Journey

```
Raw API Response → normalizeAlbumData() → AlbumsStore → Views
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

**Change 1: Add artist/album to ranked tracks**
```javascript
tracks: (rankedTracks.length > 0 ? rankedTracks : originalTracks).map((track, idx) => ({
  ...track,
  title: track.title || track.name || '',
  artist: data.artist || '',  // ✅ ADD THIS LINE
  album: data.title || '',    // ✅ ADD THIS LINE
  rank: track.rank || track.acclaimRank || track.finalPosition || (idx + 1),
  rating: track.rating || null,
  // ... rest of fields
}))
```

**Change 2: Add artist/album to original tracks**
```javascript
tracksOriginalOrder: originalTracks.map((track, idx) => ({
  ...track,
  title: track.title || track.name || '',
  artist: data.artist || '',  // ✅ ADD THIS LINE
  album: data.title || '',    // ✅ ADD THIS LINE
  position: track.position || track.trackNumber || (idx + 1),
  // ... rest of fields
}))
```

---

## Impact on Views

| View | Fields Used | Before Fix | After Fix |
|------|-------------|------------|-----------|
| AlbumsView | `album.title`, `album.artist` | ✅ Works | ✅ Works |
| RankingView | `track.title`, `track.rating` | ✅ Works | ✅ Works |
| PlaylistsView | `track.title`, `track.artist`, `track.album` | 🔴 Empty | ✅ Displays |

---

## Data Persistence Guarantee

With store persistence (proposed architectural fix):
1. ✅ Album loaded ONCE with correct data
2. ✅ Tracks include artist/album fields
3. ✅ Data available in PlaylistsView
4. ✅ Data available in RankingView
5. ✅ No re-fetching needed
6. ✅ No data loss on navigation
