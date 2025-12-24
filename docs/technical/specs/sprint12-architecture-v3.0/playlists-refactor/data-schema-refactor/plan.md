# Data Schema Canonical Refactor - Implementation Plan

**Created**: 2025-12-24
**Status**: 📋 DRAFT - Awaiting User Review  
**Sprint**: 12.5 (Sub-task of Playlist Hybrid Refactor)
**SDD Phase**: 2 - Planning
**Depends on**: spec.md (APPROVED)

---

## 1. ARCHITECTURE OVERVIEW

### Before: Fragmented Schema
```
┌─────────────────────────────────────────────────────────────────┐
│                    CURRENT STATE (Fragmented)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │ API Response│───→│ client.js   │───→│ Album/Track Model   │ │
│  │ (raw data)  │    │ normalize() │    │ (incomplete)        │ │
│  └─────────────┘    └──────┬──────┘    └──────────┬──────────┘ │
│                            │                       │            │
│                            ▼                       ▼            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │             ENRICHMENT (2 DIFFERENT PLACES)                 ││
│  │  ┌─────────────────────┐    ┌─────────────────────────────┐ ││
│  │  │SpotifyEnrichmentHelper│   │TrackEnrichmentMixin       │ ││
│  │  │ • spotifyPopularity  │   │ • acclaimRank              │ ││
│  │  │ • spotifyRank       │   │ • spotifyRank (duplicate!) │ ││
│  │  └─────────────────────┘    └─────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
│                            │                                    │
│                            ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │           CONSUMERS (expect different fields)                ││
│  │  PlaylistsView → rank, rating                               ││
│  │  RankingStrategy → acclaimRank, spotifyPopularity           ││
│  │  TrackItem → spotifyRank, rank                              ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### After: Unified Schema
```
┌─────────────────────────────────────────────────────────────────┐
│                    TARGET STATE (Unified)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────────────────────────────────┐ │
│  │ ANY Source  │───→│        TrackTransformer.js              │ │
│  │ (API, Cache,│    │  • toCanonical(rawTrack, albumContext)  │ │
│  │  Firestore) │    │  • ALWAYS returns CanonicalTrack        │ │
│  └─────────────┘    └──────────────────┬──────────────────────┘ │
│                                        │                        │
│                                        ▼                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │               CanonicalTrack (Single Schema)                ││
│  │  ┌───────────────┬───────────────┬───────────────────────┐  ││
│  │  │ IDENTITY      │ ACCLAIM       │ SPOTIFY               │  ││
│  │  │ id, title     │ acclaimRank   │ spotifyRank          │  ││
│  │  │ artist, album │ acclaimScore  │ spotifyPopularity    │  ││
│  │  │ duration      │ rating        │ spotifyId, spotifyUri│  ││
│  │  └───────────────┴───────────────┴───────────────────────┘  ││
│  └─────────────────────────────────────────────────────────────┘│
│                            │                                    │
│                            ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │           ALL CONSUMERS (uniform expectations)               ││
│  │  PlaylistsView, RankingStrategy, TrackItem, Algorithms      ││
│  │  → ALL use same CanonicalTrack fields                       ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. PROPOSED CHANGES

### 2.1 New File: TrackTransformer.js

```
Path: public/js/transformers/TrackTransformer.js
```

```javascript
/**
 * TrackTransformer - Single Source of Truth for Track Normalization
 * 
 * Converts any raw track data to CanonicalTrack format.
 * Used by: client.js, RankingStrategies, Algorithms, Views
 */

export class TrackTransformer {
  /**
   * Convert raw track to canonical format
   * @param {Object} raw - Raw track from any source
   * @param {Object} context - Album context { artist, album, albumId }
   * @returns {CanonicalTrack}
   */
  static toCanonical(raw, context = {}) {
    return {
      // Identity
      id: raw.id || crypto.randomUUID(),
      title: (raw.title || raw.name || raw.trackTitle || 'Unknown').trim(),
      artist: raw.artist || context.artist || 'Unknown Artist',
      album: raw.album || context.album || context.title || 'Unknown Album',

      // Audio
      duration: Number(raw.duration) || 0,

      // Acclaim (BEA)
      acclaimRank: raw.acclaimRank ?? raw.rank ?? raw.finalPosition ?? null,
      acclaimScore: raw.acclaimScore ?? raw.normalizedScore ?? null,
      rating: raw.rating ?? null,

      // Spotify
      spotifyRank: raw.spotifyRank ?? null,
      spotifyPopularity: raw.spotifyPopularity ?? raw.popularity ?? null,
      spotifyId: raw.spotifyId ?? raw.metadata?.spotifyId ?? null,
      spotifyUri: raw.spotifyUri ?? null,

      // Original Order
      position: raw.position ?? raw.trackNumber ?? null,
      originAlbumId: raw.originAlbumId ?? context.albumId ?? null,

      // Preserve metadata
      metadata: { ...raw.metadata }
    }
  }

  /**
   * Merge Spotify enrichment into existing track
   */
  static mergeSpotifyData(track, spotifyData) {
    return {
      ...track,
      spotifyRank: spotifyData.spotifyRank ?? track.spotifyRank,
      spotifyPopularity: spotifyData.spotifyPopularity ?? track.spotifyPopularity,
      spotifyId: spotifyData.spotifyId ?? track.spotifyId,
      spotifyUri: spotifyData.spotifyUri ?? track.spotifyUri
    }
  }

  /**
   * Calculate spotifyRank for a list of tracks by popularity
   */
  static calculateSpotifyRanks(tracks) {
    const withPop = tracks.filter(t => t.spotifyPopularity != null)
    const sorted = [...withPop].sort((a, b) => b.spotifyPopularity - a.spotifyPopularity)
    
    sorted.forEach((track, idx) => {
      track.spotifyRank = idx + 1
    })
    
    return tracks
  }
}
```

---

### 2.2 Update: Track.js Model

#### [MODIFY] [Track.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/models/Track.js)

Add explicit Spotify and Acclaim fields with JSDoc:

```javascript
/**
 * @typedef {Object} Track
 * @property {string} id - Unique identifier
 * @property {string} title - Track title
 * @property {string} artist - Artist name (from album context)
 * @property {string} album - Album title (from album context)
 * @property {number} duration - Duration in seconds
 * 
 * @property {number|null} acclaimRank - Position by BEA/Acclaim (1-N)
 * @property {number|null} acclaimScore - Normalized score 0-100
 * @property {number|null} rating - Star rating (alias for display)
 * 
 * @property {number|null} spotifyRank - Position by Spotify popularity (1-N)
 * @property {number|null} spotifyPopularity - Spotify popularity 0-100
 * @property {string|null} spotifyId - Spotify track ID
 * @property {string|null} spotifyUri - spotify:track:...
 * 
 * @property {number|null} position - Original disc track number
 * @property {string|null} originAlbumId - Parent album ID
 */
```

---

### 2.3 Refactor: Integration Points

| File | Change | LOC Impact |
|------|--------|------------|
| `client.js` | Use `TrackTransformer.toCanonical()` in normalize | -20, +5 |
| `BalancedRankingStrategy.js` | Use `TrackTransformer` for enrichment | -30, +10 |
| `SpotifyRankingStrategy.js` | Inherit from updated Balanced | 0 |
| `BEARankingStrategy.js` | Inherit from updated Balanced | 0 |
| `TrackEnrichmentMixin.js` | Use `TrackTransformer.toCanonical()` | -40, +15 |
| `SpotifyEnrichmentHelper.js` | Use `TrackTransformer.mergeSpotifyData()` | -20, +5 |
| `PlaylistGenerationService.js` | Use `TrackTransformer.toCanonical()` | -10, +5 |
| `PlaylistsView.js` | No change (uses TrackItem) | 0 |
| `TrackItem.js` | No change (reads canonical fields) | 0 |

---

## 3. DATA FLOW (After Refactor)

```mermaid
sequenceDiagram
    participant API as Data Source
    participant Client as client.js
    participant TT as TrackTransformer
    participant Album as Album Model
    participant SEH as SpotifyEnrichmentHelper
    participant RS as RankingStrategy
    participant Algo as Algorithm
    participant PGS as PlaylistGenerationService
    participant UI as TrackItem

    API->>Client: Raw album data
    Client->>TT: toCanonical(rawTrack, context)
    TT-->>Client: CanonicalTrack
    Client->>Album: new Album({ tracks })

    Client->>SEH: applyEnrichmentToAlbum()
    SEH->>TT: mergeSpotifyData(track, spotify)
    TT-->>SEH: Updated track
    SEH->>TT: calculateSpotifyRanks(tracks)

    Note over Album: Album now has enriched CanonicalTracks

    Algo->>RS: rank(album)
    RS->>RS: Use album's CanonicalTracks (already enriched)
    RS-->>Algo: Sorted tracks with _rank

    Algo->>PGS: generate(albums, config)
    PGS->>TT: toCanonical() on output tracks
    PGS-->>UI: Playlist with CanonicalTracks

    UI->>UI: Render with acclaimRank, spotifyRank
```

---

## 4. VERIFICATION PLAN

### 4.1 Manual UAT Checklist (Full Regression)

After implementation, test ALL views:

| # | View | Test | Expected |
|---|------|------|----------|
| 1 | BlendingMenuView | Generate with Balanced Cascade | Playlists created |
| 2 | BlendingMenuView | Generate with Crowd Favorites | Playlists ordered by Spotify |
| 3 | PlaylistsView | Verify dual badges | Orange Acclaim + Green Spotify |
| 4 | PlaylistsView | Save to History | Saves without error |
| 5 | PlaylistsView | Export to Spotify | Tracks found and exported |
| 6 | PlaylistsView | Download JSON | Valid JSON with all fields |
| 7 | SavedPlaylistsView | Load saved batch | Displays correctly |
| 8 | SavedPlaylistsView | Edit batch | Opens in edit mode |
| 9 | SavedPlaylistsView | Delete batch | Removes correctly |
| 10 | SeriesView | Album cards display | Correct artwork, tracks count |
| 11 | RankingView | Dual tracklist display | Original vs Ranked order |
| 12 | InventoryView | Album list | All albums with covers |

### 4.2 Console Verification

Run the app and verify:
- [ ] No console errors on any view
- [ ] `[TrackTransformer]` logs show consistent output

### 4.3 Build Verification

```bash
npm run dev
# Verify no build errors
```

---

## 5. IMPLEMENTATION ORDER

```
Phase 1: Create Foundation
├── 1.1 Create TrackTransformer.js
├── 1.2 Update Track.js with JSDoc
└── 1.3 Add barrel export

Phase 2: Refactor Consumers
├── 2.1 Refactor client.js normalize
├── 2.2 Refactor BalancedRankingStrategy
├── 2.3 Refactor TrackEnrichmentMixin
├── 2.4 Refactor SpotifyEnrichmentHelper
└── 2.5 Refactor PlaylistGenerationService.transformTracks

Phase 3: Verification
├── 3.1 Build verification
├── 3.2 Full regression UAT
└── 3.3 Document in walkthrough
```

---

## 6. APPROVAL

> [!IMPORTANT]
> **Gate**: Cannot proceed to Tasks Phase until Plan is APPROVED.

- [ ] User approves architecture diagrams
- [ ] User approves TrackTransformer design
- [ ] User approves integration points
- [ ] User approves verification plan
