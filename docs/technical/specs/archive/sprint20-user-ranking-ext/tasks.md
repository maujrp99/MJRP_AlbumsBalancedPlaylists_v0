# User-Generated Track Ranking - Task List (Extended)

**Sprint**: 20 (Phase 2)
**Status**: ✅ COMPLETE
**Spec**: [spec.md](./spec.md) ✅ APPROVED
**Plan**: [plan.md](./plan.md) ✅ APPROVED
**Last Updated**: 2026-01-12

---

## Phase 8: Extended Functional Completion (1-2h)

### 8.1 Menu Option Parity
- [x] Update `public/js/components/blend/BlendIngredientsPanel.js` to enable all Top N options for `top-n-user`.
- [x] Update `public/js/components/blend/BlendRecipeCard.js` with correct User icon and Sky color theme.

### 8.2 Execution Logic
- [x] Update `public/js/services/PlaylistGenerationService.js` to lock `user` ranking strategy when the user recipe is selected.
- [x] Verify `TopNUserAlgorithm.js` generates the correct title prefix (`UGR Top N`).

### 8.3 Manual Verification (UGR Flow)
- [x] **Rank Albums**: Manually rank 2-3 albums in a test Series.
- [x] **Configure Blend**: Select "My Own Ranking", set Top 1, and choosing a specific grouping.
- [x] **Verify Playlist**: Ensure the generated playlist contains the specific tracks ranked as #1 by the user.
- [x] **Verify Persistence**: Hard refresh and ensure the UGR recipe still uses the saved data.

---

## Phase 1: Data Layer (2-3h) ✅ COMPLETE

### 1.1 UserRankingRepository
- [x] Create `public/js/repositories/UserRankingRepository.js`
- [x] Integrate with `CacheManager`

### 1.2 Album Entity Extension
- [x] Add `userRanking` property to Album runtime object (`SeriesController`)
- [x] Add `hasUserRanking` boolean flag
- [x] Update `TrackTransformer` logic (via Controller injection)

---

## Phase 2: Ranking Strategy (1-2h) ✅ COMPLETE

### 2.1 UserRankingStrategy
- [x] Create `public/js/ranking/UserRankingStrategy.js`
- [x] Implement `rank(album)` logic

### 2.2 Strategy Registration
- [x] Register in `public/js/ranking/index.js`
- [x] Add to exports

---

## Phase 3: Algorithm (1h) ✅ COMPLETE

### 3.1 TopNUserAlgorithm
- [x] Create `public/js/algorithms/TopNUserAlgorithm.js`
- [x] Add badge 'USER'

### 3.2 Algorithm Registration
- [x] Register in `public/js/algorithms/index.js`

---

## Phase 4: UI - TracksTable (3-4h) ✅ COMPLETE

### 4.1 New Column: MY RANK
- [x] Add header definition for `userRank` column
- [x] Implement User Rank badge rendering (incandescent blue)

### 4.2 Column Rendering
- [x] Show `-` (gray) when not ranked
- [x] Position AFTER `title`, BEFORE `rank`

### 4.3 Default Sort Fix
- [x] Set default `sortField = 'position'`
- [x] Set default `sortDirection = 'asc'`

### 4.4 Critical Bug Fix: Sorting Logic
- [x] Debug sorting in List/Card views (Static HTML issue)
- [x] Implement **Event Delegation** in `SeriesEventHandler`
- [x] Update `AlbumCardRenderer` to accept dynamic sort options
- [x] Verify sorting works in both Grid and List modes

### 4.5 Avg Stats Repositioning
- [x] Move Avg Rank and Avg Pop to header (above table)
- [x] Add **Avg User Rank** metric ('My Avg')

---

## Phase 5: UI - UserRankModal (4-5h) ✅ COMPLETE

### 5.1 Modal Component
- [x] Create `public/js/components/ranking/UserRankModal.js`
- [x] Implement Drag-and-Drop (SortableJS)

### 5.2 Drag-and-Drop
- [x] Implement `_initDragDrop()`
- [x] Fix `SortableJS` InvalidCharacterError
- [x] Handle track reordering

### 5.3 Save/Reset Actions
- [x] Implement `save()`
- [x] Implement `reset()`

---

## Phase 6: Integration (2-3h) ✅ COMPLETE

### 6.1 SeriesView - "Rank It" Button
- [x] Add button to album card
- [x] Wire up click event

### 6.2 Ranked Indicator
- [x] Show "Ranked" label when album has ranking
- [x] Use incandescent blue styling with checkmark/ring

### 6.3 Blending Menu Recipe
- [x] Add "My Own Ranking" recipe to Ingredients Panel

---

## Phase 7: Documentation & Verification (1-2h) ✅ COMPLETE

### 7.1 Documentation Updates
- [x] Update `31_UI_Style_Guide.md`
- [x] Update `18_Frontend_Logic_Core.md`

### 7.2 Automated Tests
- [x] Run `npm run build` - Passed
- [x] Unit Test `UserRankingStrategy` - Passed

### 7.3 Manual Tests
| # | Test Case | Status |
|---|-----------|--------|
| 1 | Click "Rank It" on album card → Modal opens | ✅ |
| 2 | Drag tracks to reorder → Visual reorder works | ✅ |
| 3 | Click Save → Modal closes, rankings saved to Firestore | ⚠️ Needs Deploy |
| 4 | Click column headers (all 6) → Table sorts asc/desc | ✅ |
| 5 | Switch Grid ↔ List mode → Sorting works in both | ✅ |
| 6 | Select "My Ranking" recipe → Recipe card visible | ✅ |

---

## DEFERRED / MAINTENANCE

### D.1 Firestore Security Rules
- [x] Update `firestore.rules` locally to allow `albumRankings` write
- [x] **READY FOR DEPLOY**: Rules and code synchronized. (Persistence Fix verified locally).
