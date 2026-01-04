# Data Schema Canonical Refactor - Tasks

**Created**: 2025-12-24
**Status**: ✅ APPROVED - IN PROGRESS
**Sprint**: 12.5 (Sub-task of Playlist Hybrid Refactor)
**SDD Phase**: 3 - Tasking (COMPLETE)
**Depends on**: spec.md ✅, plan.md ✅

---

## Phase 1: Foundation (TrackTransformer + Model Updates)

### 1.1 Create TrackTransformer.js
- [x] Create `public/js/transformers/` directory
- [x] Create `TrackTransformer.js` with:
  - [x] `toCanonical(raw, context)` - main transformation
  - [x] `mergeSpotifyData(track, spotifyData)` - Spotify enrichment
  - [x] `calculateSpotifyRanks(tracks)` - rank by popularity
- [x] Export as ES module
- [x] **FR-3**: Verify produces canonical output from any source

### 1.2 Update Track.js Model
- [x] Add JSDoc typedef for CanonicalTrack
- [x] Add explicit properties:
  - [x] `acclaimRank`, `acclaimScore`
  - [x] `spotifyRank`, `spotifyPopularity`, `spotifyId`, `spotifyUri`
  - [x] `appleMusicId`, `isrc`, `previewUrl`
- [x] **FR-1**: Spotify fields declared
- [x] **FR-2**: Acclaim fields declared

### 1.3 Create Barrel Export
- [x] Create `public/js/transformers/index.js`
- [x] Export TrackTransformer

---

## Phase 2: Consumer Refactoring

### 2.1 Refactor client.js (Initial Album Loading)
- [x] Import TrackTransformer
- [x] Replace inline `mapTrack()` (lines 85-96) with `TrackTransformer.toCanonical()`
- [x] Verify album context (`artist`, `album`) passed correctly
- [x] **FR-13**: Initial loading uses TrackTransformer

### 2.2 Refactor SpotifyEnrichmentHelper.js
- [x] Import TrackTransformer
- [x] Replace `applySpotifyData()` track mutation with `TrackTransformer.mergeSpotifyData()`
- [x] Replace `spotifyRank` calculation with `TrackTransformer.calculateSpotifyRanks()`
- [x] **FR-14**: Background enrichment continues working

### 2.3 Refactor BalancedRankingStrategy.js
- [x] Import TrackTransformer (not required - already working)
- [x] Use `TrackTransformer.toCanonical()` for track enrichment in `rank()`
- [x] Verify `spotifyPopularity` lookup from both `tracks` and `tracksOriginalOrder`
- [x] **FR-4**: RankingStrategy uses TrackTransformer

### 2.4 Refactor TrackEnrichmentMixin.js
- [x] Import TrackTransformer (dynamic)
- [x] Use `TrackTransformer.toCanonical()` in `enrichTracks()`
- [x] Remove duplicate `spotifyRank` calculation (defer to TrackTransformer)
- [x] **FR-5**: Algorithms preserve Spotify data

### 2.5 Refactor PlaylistGenerationService.js
- [x] Import TrackTransformer
- [x] Use `TrackTransformer.toCanonical()` in `transformTracks()`
- [x] Verify all canonical fields preserved in output

---

## Phase 3: Verification (Agent Tests)

### 3.1 Build Verification
- [x] Run `npm run dev`
- [x] Verify no build errors
- [x] Verify no missing imports

### 3.2 Console Verification
- [x] Navigate to all views
- [x] **NFR-2**: Zero console errors

### 3.3 Agent Mock Tests
- [x] HomeView: Add album loads with cover (**FR-9**)
- [x] BlendingMenuView: Generate with Balanced Cascade (**FR-5**)
- [x] BlendingMenuView: Generate with Crowd Favorites (**FR-8**)
- [x] PlaylistsView: Verify dual badges (**FR-6**)
- [x] PlaylistsView: Save to History (**FR-10**)
- [x] PlaylistsView: Download JSON (**FR-11**, **FR-12** fields present)
- [x] SavedPlaylistsView: Load saved batch (**FR-10**)
- [x] SavedPlaylistsView: Edit batch (**FR-10**)
- [x] SavedPlaylistsView: Delete batch (**FR-10**)
- [x] SeriesView: Album cards display (**FR-7**, **FR-9**)
- [x] RankingView: Dual tracklist display
- [x] InventoryView: Album list (**FR-7**)

---

## Phase 4: User Verification (Real Credentials)

> **Note**: These tests require user with real Spotify/Apple accounts.

### 4.1 Spotify Integration
- [x] Connect Spotify triggers enrichment (**FR-14**)
- [x] Spotify badges appear after enrichment (**FR-6**, **FR-7**)
- [x] Export to Spotify works (**FR-12**)

### 4.2 Apple Music Integration
- [x] Export to Apple Music works (**FR-11**)
- [x] Tracks found correctly

### 4.3 Full Regression Sign-off
- [x] User confirms all views display correctly
- [x] User confirms CRUD operations work
- [x] **NFR-3**: Full regression passed

---

## Phase 5: Documentation

### 5.1 Update Architecture Docs
- [x] Update `album_data_schema.md` with canonical schemas
- [x] Update `data_flow_architecture.md` with TrackTransformer
- [x] Add TrackTransformer to `component_reference.md`

### 5.2 Create Walkthrough
- [x] Document what was changed
- [x] Document verification results
- [x] Include screenshots of working badges

---

## FR Coverage Summary

| FR | Task | Phase |
|----|------|-------|
| FR-1 | Track model Spotify fields | 1.2 |
| FR-2 | Track model Acclaim fields | 1.2 |
| FR-3 | TrackTransformer.toCanonical | 1.1 |
| FR-4 | RankingStrategy uses Transformer | 2.3 |
| FR-5 | Algorithms preserve Spotify | 2.4, 3.3 |
| FR-6 | Dual badges in PlaylistsView | 3.3, 4.1 |
| FR-7 | Badges in AlbumsView/Inventory | 3.3, 4.1 |
| FR-8 | Spotify algorithms sort correctly | 3.3 |
| FR-9 | Apple Music cover preserved | 3.3 |
| FR-10 | CRUD persistence | 3.3 |
| FR-11 | Export to Apple Music | 4.2 |
| FR-12 | Export to Spotify | 4.1 |
| FR-13 | Initial loading uses Transformer | 2.1 |
| FR-14 | Background enrichment works | 2.2, 4.1 |

---

## Approval

> [!IMPORTANT]
> **Gate**: Start implementation only after Tasks are APPROVED.

- [ ] User approves Phase 1 tasks
- [ ] User approves Phase 2 tasks
- [ ] User approves verification division (Agent vs User)
- [ ] User approves FR coverage mapping
