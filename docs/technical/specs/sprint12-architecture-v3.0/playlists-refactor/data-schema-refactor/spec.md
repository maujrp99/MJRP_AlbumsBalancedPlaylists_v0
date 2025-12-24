# Data Schema Canonical Refactor - Specification

**Created**: 2025-12-24
**Status**: ✅ APPROVED
**Sprint**: 12.5 (Sub-task of Playlist Hybrid Refactor)
**SDD Phase**: 1 - Specification (COMPLETE)

---

## 1. WHAT (Problem Statement)

### Current State

The application has **multiple inconsistent data schemas** for Albums and Tracks, created organically over sprints 1-12. This leads to:

1. **Lost ranking data** during transformations
2. **Missing Spotify fields** in some code paths
3. **Inconsistent field naming** across sources
4. **Dual enrichment logic** in different modules

### Evidence

| Issue | Location | Impact |
|-------|----------|--------|
| Spotify data lost | `BalancedRankingStrategy` only checked `album.tracks` | Green badges never appear |
| Track model incomplete | `Track.js` lacks Spotify fields | Fields added dynamically, inconsistent |
| Multiple normalize functions | `client.js`, `albumsStore`, `PlaylistsView` | Each normalizes differently |
| Dual spotifyRank calculation | `SpotifyEnrichmentHelper` AND `TrackEnrichmentMixin` | Inconsistent ranks |

---

## 2. WHY (Goals)

### Primary Goals

| ID | Goal | Benefit |
|----|------|---------|
| G-1 | Define **canonical Album schema** | Single source of truth |
| G-2 | Define **canonical Track schema** | All fields explicitly declared |
| G-3 | Create **single normalization point** | Eliminates drift |
| G-4 | Ensure **Spotify data flows end-to-end** | Badges work correctly, algorithms using Spotify ranking sort correctly |

### Success Metrics

| Metric | Target |
|--------|--------|
| Track fields explicitly defined | 100% in model |
| Normalization functions | Single `TrackTransformer.js` |
| Green Spotify badge visible | Whenever Spotify data is available for track |
| Full regression test pass | All views display correctly |

---

## 3. SCOPE

### In Scope

1. **Album Model** (`Album.js`) - Add missing fields, JSDoc
2. **Track Model** (`Track.js`) - Add Spotify fields, JSDoc
3. **TrackTransformer** - New single source for track mapping
4. **RankingStrategy** - Use TrackTransformer
5. **Algorithm Mixins** - Use TrackTransformer
6. **PlaylistGenerationService** - Use TrackTransformer
7. **Views** - Verify all tracks render correctly

### Out of Scope

- Backend API changes (data comes as-is)
- Firestore schema migration
- New features (purely refactor)

---

## 4. SUCCESS CRITERIA

### Functional Requirements

| ID | Requirement | Verification Method |
|----|-------------|---------------------|
| FR-1 | Track model declares: `spotifyPopularity`, `spotifyRank`, `spotifyId`, `spotifyUri` | Code review |
| FR-2 | Track model declares: `acclaimRank`, `acclaimScore` | Code review |
| FR-3 | `TrackTransformer.toCanonical()` creates consistent track from ANY source | Unit test |
| FR-4 | RankingStrategy uses TrackTransformer | Code review |
| FR-5 | Algorithms preserve Spotify data through pipeline | UAT |
| FR-6 | Dual badges (orange Acclaim, green Spotify) visible in PlaylistsView when data available | UAT |
| FR-7 | Spotify popularity badges visible in AlbumsView and InventoryView | UAT |
| FR-8 | Spotify-based algorithms sort tracks by spotifyPopularity correctly | UAT |
| FR-9 | Apple Music Kit album cover data preserved through transformations | UAT |
| FR-10 | All CRUD operations (Series, Playlists, Inventory) persist data without loss | UAT |

### Non-Functional Requirements

| ID | Requirement | Verification Method |
|----|-------------|---------------------|
| NFR-1 | No new dependencies added | Package.json review |
| NFR-2 | Zero console errors on all views | Manual test all views |
| NFR-3 | Full regression: All existing features work | Checklist UAT |

---

## 5. RISK ASSESSMENT

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Breaking existing views | High | High | Full regression checklist |
| Cache poisoning (old data) | Medium | Medium | Document cache clear needed |
| Algorithm output changes | Medium | High | Compare before/after output |

---

## 6. DATA CONTEXT

### Current Schema Locations

| File | Purpose | Fields Defined |
|------|---------|----------------|
| `models/Album.js` | Album domain model | id, title, artist, tracks[], spotifyId |
| `models/Track.js` | Track domain model | id, title, artist, album, rank, rating |
| `helpers/SpotifyEnrichmentHelper.js` | Adds Spotify data | spotifyPopularity, spotifyRank |
| `algorithms/mixins/TrackEnrichmentMixin.js` | Enriches during generation | acclaimRank, canonicalRank, spotifyRank |

### Proposed Canonical Track Schema

```javascript
// CanonicalTrack - to be formalized in Track.js
{
  // Identity
  id: string,
  title: string,
  artist: string,
  album: string,

  // Audio
  duration: number (seconds),

  // Acclaim (BestEverAlbums)
  acclaimRank: number | null,     // 1-N
  acclaimScore: number | null,    // 0-100
  rating: number | null,          // Star rating (alias)

  // Spotify
  spotifyRank: number | null,     // 1-N
  spotifyPopularity: number | null, // 0-100
  spotifyId: string | null,
  spotifyUri: string | null,

  // Apple Music Kit
  appleMusicId: string | null,    // Apple Music track ID
  isrc: string | null,            // ISRC for cross-platform matching
  previewUrl: string | null,      // Audio preview URL

  // Original Order
  position: number | null,        // Disc track # (1..N)
  originAlbumId: string | null,

  // Internal (Algorithm Use)
  _rank: number,                  // Strategy-assigned
  _debug_strategy: string
}
```

### Proposed Canonical Album Schema

```javascript
// CanonicalAlbum - to be formalized in Album.js
{
  // Identity
  id: string,
  title: string,
  artist: string,
  year: number | null,

  // Artwork (Apple Music Kit primary source)
  coverUrl: string | null,        // High-res artwork URL
  artworkTemplate: string | null, // Apple Music template for resizing

  // Track Lists
  tracks: CanonicalTrack[],           // Ranked order
  tracksOriginalOrder: CanonicalTrack[], // Disc order

  // Acclaim (BestEverAlbums)
  bestEverAlbumId: string | null,
  bestEverUrl: string | null,
  bestEverEvidence: array | null,
  acclaim: object,                // { hasRatings, source, trackCount }

  // Spotify
  spotifyId: string | null,
  spotifyUrl: string | null,
  spotifyPopularity: number | null,

  // Apple Music Kit
  appleMusicId: string | null,

  // Metadata
  metadata: {
    source: string,               // 'Apple Music' | 'Backend' | 'Cache'
    sourceId: string,
    fetchedAt: timestamp
  }
}
```

---

## 7. APPROVAL

> [!IMPORTANT]
> **Gate**: Cannot proceed to Plan Phase until Spec is APPROVED by user.

- [ ] User approves problem statement
- [ ] User approves scope
- [ ] User approves success criteria
- [ ] User approves canonical schema

---

## 8. RELATED DOCUMENTS

- [Data Schema Analysis](file:///C:/Users/Mauricio%20Pedroso/.gemini/antigravity/brain/193cc8af-11a1-49e0-901b-41119c22e5f2/data_schema_analysis.md)
- [album_data_schema.md](../../../../../../technical/album_data_schema.md)
- [data_flow_architecture.md](../../../../../../technical/data_flow_architecture.md)
