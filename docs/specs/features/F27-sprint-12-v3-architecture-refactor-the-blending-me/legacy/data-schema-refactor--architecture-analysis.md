# Data Schema Architecture Analysis Report

**Date**: 2025-12-24
**Sprint**: 12.5
**Status**: 🔴 CRITICAL ISSUES FOUND

---

## Executive Summary

The application has **multiple inconsistent data schemas** for Albums and Tracks, leading to:
1. Lost ranking data during transformations
2. Missing Spotify fields in some code paths
3. Inconsistent field naming across sources

---

## Current State: Multiple Schema Versions

### 1. API Response Schema (Backend)
```javascript
// From: /api/generate or Apple Music
{
  title, artist, year,
  tracks: [{ title, position, duration, rating, metadata: { spotifyId } }],
  tracksByAcclaim: [{ title, rank, rating, normalizedScore, finalPosition }],
  rankingConsolidated: [...]
}
```
**Missing**: `spotifyPopularity`, `spotifyRank` on individual tracks

---

### 2. Album Model Schema (`public/js/models/Album.js`)
```javascript
class Album {
  id, title, artist, year, coverUrl
  tracks: Track[]              // Ranked order
  tracksOriginalOrder: Track[] // Disc order
  spotifyId, spotifyUrl, spotifyPopularity  // Album-level Spotify
  bestEverAlbumId, bestEverUrl
  acclaim: {}
}
```
**Issues**:
- Spotify data is only at album-level in the model
- Track-level Spotify must be added via enrichment

---

### 3. Track Model Schema (`public/js/models/Track.js`)
```javascript
class Track {
  id, title, artist, album
  duration, rating
  rank      // Acclaim position (1..N)
  position  // Disc track number (1..N)
  metadata: {}
}
```
**MISSING Fields**:
- `spotifyPopularity`
- `spotifyRank`
- `spotifyId`, `spotifyUri`
- `acclaimRank` (explicit)

---

### 4. Spotify Enrichment Schema (`SpotifyEnrichmentHelper.js`)
```javascript
// Applied to tracks:
{
  spotifyPopularity: 0-100,
  spotifyId: "string",
  spotifyUri: "spotify:track:...",
  spotifyRank: 1-N (calculated)
}
```
**Issue**: Only applied to `album.tracks` and `album.tracksOriginalOrder`, but not to newly created tracks by algorithms

---

### 5. Ranking Strategy Output Schema (`BalancedRankingStrategy.js`)
```javascript
// Returns tracks with:
{
  title, artist, album,
  rating, normalizedScore,
  acclaimRank,
  canonicalRank,
  spotifyPopularity,  // IF found in source
  spotifyRank,        // IF found in source
  _rank               // Strategy-assigned position
}
```
**Issue**: Lookup for Spotify data was only in `album.tracks`, not `album.tracksOriginalOrder`

---

### 6. Algorithm Output Schema (`MJRPBalancedCascade.generate()`)
```javascript
// Returns playlist with tracks:
{
  playlists: [{
    title, subtitle, tracks: [{
      id, title, artist, album, duration,
      rating, rank, _rank,
      // MISSING: spotifyRank, spotifyPopularity (depends on enrichment path)
    }]
  }]
}
```

---

### 7. PlaylistGenerationService Output (`transformTracks`)
```javascript
// Sprint 12.5 - transforms algorithm output:
{
  id, title, artist, album, duration, rating,
  rank: t.rank || t.acclaimRank,
  spotifyRank: t.spotifyRank,
  spotifyPopularity: t.spotifyPopularity
}
```
**Issue**: If source track lacks these fields, they become `undefined`

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA SOURCES                                │
├─────────────┬─────────────┬─────────────┬─────────────┬────────────┤
│ Apple Music │   Backend   │  Firestore  │   Spotify   │   Cache    │
│   (MusicKit)│    /api     │   (saved)   │     API     │ (localStorage)
└──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┴─────┬──────┘
       │             │             │             │            │
       └──────┬──────┴──────┬──────┴──────┬──────┘            │
              │             │             │                   │
              ▼             ▼             ▼                   │
       ┌──────────────────────────────────────────────┐       │
       │         apiClient.fetchAlbum()               │       │
       │  • Hydrates to Album model                   │       │
       │  • Calls applyEnrichmentToAlbum()           │←──────┘
       └──────────────────────┬───────────────────────┘
                              │
                              ▼
       ┌──────────────────────────────────────────────┐
       │           Album Model Instance               │
       │  tracks: Track[]           ← ENRICHED        │
       │  tracksOriginalOrder: Track[] ← ENRICHED     │
       │  spotifyId, spotifyPopularity (album-level)  │
       └──────────────────────┬───────────────────────┘
                              │
                              ▼
       ┌──────────────────────────────────────────────┐
       │       RankingStrategy.rank(album)            │
       │  • Reads album.tracks                        │
       │  • Reads album.tracksOriginalOrder ← FIX     │
       │  • Copies spotifyPopularity, spotifyRank     │
       │  OUTPUT: enrichedTracks[]                    │
       └──────────────────────┬───────────────────────┘
                              │
                              ▼
       ┌──────────────────────────────────────────────┐
       │       Algorithm.generate(albums, opts)       │
       │  • Uses strategy.rank() output               │
       │  • Distributes into playlists                │
       │  OUTPUT: { playlists: [...] }                │
       └──────────────────────┬───────────────────────┘
                              │
                              ▼
       ┌──────────────────────────────────────────────┐
       │   PlaylistGenerationService.transformTracks  │
       │  • Normalizes all tracks                     │
       │  • Preserves spotifyRank, spotifyPopularity  │
       │  OUTPUT: normalized playlists[]              │
       └──────────────────────┬───────────────────────┘
                              │
                              ▼
       ┌──────────────────────────────────────────────┐
       │           UI Components (TrackItem)          │
       │  • Displays badge based on primaryRanking    │
       │  • LEFT: chosen ranking, RIGHT: alternative  │
       │  • REQUIRES: rank, spotifyRank               │
       └──────────────────────────────────────────────┘
```

---

## 🔴 Critical Issues Found

### Issue 1: Spotify Data Lost During Ranking
**Location**: `BalancedRankingStrategy.rank()`
**Problem**: Was only checking `album.tracks` for Spotify data, missing `tracksOriginalOrder`
**Status**: ✅ FIXED in this session

### Issue 2: Track Model Missing Spotify Fields
**Location**: `public/js/models/Track.js`
**Problem**: Model doesn't declare `spotifyPopularity`, `spotifyRank`, `spotifyId`
**Impact**: Fields are added dynamically, inconsistent across instances

### Issue 3: No Canonical Track Schema
**Problem**: Each component uses slightly different field expectations:
- Algorithms expect: `_rank`, `acclaimRank`, `canonicalRank`
- UI expects: `rank`, `spotifyRank`, `rating`
- Services expect: `spotifyPopularity`

### Issue 4: TrackEnrichmentMixin vs SpotifyEnrichmentHelper
**Problem**: Two places calculate `spotifyRank`:
1. `SpotifyEnrichmentHelper.applySpotifyData()` - on Album load
2. `TrackEnrichmentMixin.enrichTracks()` - during algorithm execution

If timing differs, ranks may be recalculated inconsistently.

---

## Recommended Canonical Track Schema

```javascript
// Proposed: Single Source of Truth for Track
const CanonicalTrack = {
  // Identity
  id: "string",                    // Unique ID
  title: "string",                 // Track name
  artist: "string",                // From album context
  album: "string",                 // From album context

  // Audio
  duration: 0,                     // Seconds

  // Acclaim Ranking (BestEverAlbums / Hybrid Curation)
  acclaimRank: null,               // 1-N position by acclaim
  acclaimScore: null,              // 0-100 normalized rating
  rating: null,                    // Star rating (alias for display)

  // Spotify Ranking
  spotifyRank: null,               // 1-N position by popularity
  spotifyPopularity: null,         // 0-100 from Spotify API
  spotifyId: null,                 // Spotify track ID
  spotifyUri: null,                // spotify:track:...

  // Original Order
  position: null,                  // Disc track number (1..N)
  originAlbumId: null,             // Parent album ID

  // Legacy Compatibility
  rank: null,                      // Alias → acclaimRank OR spotifyRank (based on context)
}
```

---

## Recommended Actions

### Phase 1: Schema Definition (SHORT TERM)
1. Update `Track.js` model to include all Spotify fields
2. Document canonical schema in `docs/technical/canonical_schemas.md`
3. Add JSDoc types for consistency

### Phase 2: Transformation Consolidation (MEDIUM TERM)
1. Create `TrackTransformer.js` as single source of truth for mapping
2. All data sources use TrackTransformer → CanonicalTrack
3. Deprecate scattered `normalizeTrack` functions

### Phase 3: Validation Layer (LONG TERM)
1. Add schema validation at transformation boundaries
2. Log warnings for missing required fields
3. Ensure UI components fail gracefully for missing data

---

## Conclusion

The current architecture has **organic growth** leading to schema drift. The key fix applied in this session (checking `tracksOriginalOrder` for Spotify data) addresses immediate symptoms, but a canonical schema definition is needed for long-term stability.

**Recommendation**: Create a specification document defining the canonical Album and Track schemas, then refactor all transformation points to comply.
