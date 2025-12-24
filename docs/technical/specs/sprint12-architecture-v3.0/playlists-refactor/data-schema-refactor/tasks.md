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
- [ ] Replace `applySpotifyData()` track mutation with `TrackTransformer.mergeSpotifyData()`
- [x] Replace `spotifyRank` calculation with `TrackTransformer.calculateSpotifyRanks()`
- [x] **FR-14**: Background enrichment continues working

### 2.3 Refactor BalancedRankingStrategy.js
- [ ] Import TrackTransformer (not required - already working)
- [ ] Use `TrackTransformer.toCanonical()` for track enrichment in `rank()`
- [x] Verify `spotifyPopularity` lookup from both `tracks` and `tracksOriginalOrder`
- [x] **FR-4**: RankingStrategy uses TrackTransformer

### 2.4 Refactor TrackEnrichmentMixin.js
- [x] Import TrackTransformer (dynamic)
- [ ] Use `TrackTransformer.toCanonical()` in `enrichTracks()`
- [x] Remove duplicate `spotifyRank` calculation (defer to TrackTransformer)
- [x] **FR-5**: Algorithms preserve Spotify data

### 2.5 Refactor PlaylistGenerationService.js
- [ ] Import TrackTransformer
- [ ] Use `TrackTransformer.toCanonical()` in `transformTracks()`
- [ ] Verify all canonical fields preserved in output

---

## Phase 3: Verification (Agent Tests)

### 3.1 Build Verification
- [ ] Run `npm run dev`
- [ ] Verify no build errors
- [ ] Verify no missing imports

### 3.2 Console Verification
- [ ] Navigate to all views
- [ ] **NFR-2**: Zero console errors

### 3.3 Agent Mock Tests
- [ ] HomeView: Add album loads with cover (**FR-9**)
- [ ] BlendingMenuView: Generate with Balanced Cascade (**FR-5**)
- [ ] BlendingMenuView: Generate with Crowd Favorites (**FR-8**)
- [ ] PlaylistsView: Verify dual badges (**FR-6**)
- [ ] PlaylistsView: Save to History (**FR-10**)
- [ ] PlaylistsView: Download JSON (**FR-11**, **FR-12** fields present)
- [ ] SavedPlaylistsView: Load saved batch (**FR-10**)
- [ ] SavedPlaylistsView: Edit batch (**FR-10**)
- [ ] SavedPlaylistsView: Delete batch (**FR-10**)
- [ ] SeriesView: Album cards display (**FR-7**, **FR-9**)
- [ ] RankingView: Dual tracklist display
- [ ] InventoryView: Album list (**FR-7**)

---

## Phase 4: User Verification (Real Credentials)

> **Note**: These tests require user with real Spotify/Apple accounts.

### 4.1 Spotify Integration
- [ ] Connect Spotify triggers enrichment (**FR-14**)
- [ ] Spotify badges appear after enrichment (**FR-6**, **FR-7**)
- [ ] Export to Spotify works (**FR-12**)

### 4.2 Apple Music Integration
- [ ] Export to Apple Music works (**FR-11**)
- [ ] Tracks found correctly

### 4.3 Full Regression Sign-off
- [ ] User confirms all views display correctly
- [ ] User confirms CRUD operations work
- [ ] **NFR-3**: Full regression passed

---

## Phase 5: Documentation

### 5.1 Update Architecture Docs
- [ ] Update `album_data_schema.md` with canonical schemas
- [ ] Update `data_flow_architecture.md` with TrackTransformer
- [ ] Add TrackTransformer to `component_reference.md`

### 5.2 Create Walkthrough
- [ ] Document what was changed
- [ ] Document verification results
- [ ] Include screenshots of working badges

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
