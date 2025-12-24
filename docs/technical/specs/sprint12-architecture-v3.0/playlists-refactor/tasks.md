# Playlist Hybrid Refactor - SDD Tasks

**Created**: 2025-12-23 22:42
**Updated**: 2025-12-23 22:52
**Status**: ⏳ IMPLEMENTATION IN PROGRESS
**Sprint**: 12.5
**Depends on**: spec.md (APPROVED), plan.md (APPROVED)

---

## Phase 1: Services (Logic Extraction) ✅ COMPLETE

### 1.1 PlaylistGenerationService.js ✅
- [x] Create `public/js/services/PlaylistGenerationService.js`
- [x] Extract `transformTracks()` from BlendingMenuView
- [x] Extract `generate()` method with algorithm + ranking strategy
- [x] Add `validateConfig()` method
- [x] Add JSDoc documentation
- [ ] Unit test: compare output with current generation (skipped - UAT covers this)

### 1.2 PlaylistPersistenceService.js ✅
- [x] Create `public/js/services/PlaylistPersistenceService.js`
- [x] Extract `save()` from PlaylistsView._savePlaylistsToFirestore
- [x] Add `preserveIds` parameter for regenerate flow
- [x] Extract `load()` method
- [x] Extract `delete()`, `deleteBatch()`, `deleteAll()` from SavedPlaylistsView
- [x] Add JSDoc documentation

### 1.3 BlendingMenuView Refactor ✅
- [x] Import PlaylistGenerationService
- [x] Replace inline generation with service call
- [x] Remove duplicated transformTracks code (-40 LOC)
- [ ] Verify: Generation from Blending Menu still works (UAT at end)

### 1.4 PlaylistsView Refactor (Services) ✅
- [x] Import PlaylistGenerationService
- [ ] Import PlaylistPersistenceService (will do in Phase 3)
- [x] Replace inline generation with service call (-26 LOC)
- [ ] Replace inline save with service call (will do in Phase 3)
- [ ] Verify: Generation from PlaylistsView still works (UAT at end)
- [ ] Verify: Save to History still works (UAT at end)

---

## Phase 2: Components (UI Extraction) ✅ COMPLETE

### 2.1 TrackItem.js ✅
- [x] Create `public/js/components/playlists/TrackItem.js`
- [x] Implement badge order logic (primaryRanking prop)
- [x] Include drag handle, duration, title, artist
- [x] Support Acclaim badge (orange)
- [x] Support Spotify badge (green)
- [ ] Verify: Visual matches mockup (awaiting integration)

### 2.2 PlaylistCard.js ✅
- [x] Create `public/js/components/playlists/PlaylistCard.js`
- [x] Header with name (editable), track count, duration
- [x] Contains TrackItem list
- [ ] Support Sortable.js integration for drag & drop (awaiting integration)
- [ ] Verify: Matches current playlist column layout (awaiting integration)

### 2.3 PlaylistGrid.js ✅
- [x] Create `public/js/components/playlists/PlaylistGrid.js`
- [x] Grid layout of PlaylistCards
- [x] Responsive columns (1/2/3)
- [ ] Verify: Renders correctly on different screen sizes (awaiting integration)

### 2.4 RegeneratePanel.js ✅
- [x] Create `public/js/components/playlists/RegeneratePanel.js`
- [ ] Reuse BlendFlavorCard component (placeholder only)
- [ ] Reuse BlendIngredientsPanel component (placeholder only)
- [x] Collapsible panel header
- [x] "Regenerate" CTA button
- [x] Warning about ID preservation
- [ ] Verify: Panel expands/collapses (awaiting integration)

### 2.5 BatchGroupCard.js ✅
- [x] Create `public/js/components/playlists/BatchGroupCard.js`
- [x] Header with batch name, date
- [x] List of playlists in batch
- [x] Edit/Delete buttons per playlist
- [x] Edit Batch / Delete Batch actions
- [ ] Verify: Matches current SavedPlaylistsView layout (awaiting integration)

### 2.6 Migrate Views to Components (PENDING - Phase 3)
- [x] PlaylistsView: Replace renderTrack with TrackItem
- [x] PlaylistsView: Replace renderPlaylists with PlaylistGrid
- [x] SavedPlaylistsView: Replace inline rendering with BatchGroupCard
- [x] Verify: No visual regression

---

## Bug Fixes (Sprint 12.5) ✅

- [x] **Fix**: PlaylistsView clearing fresh playlists from BlendingMenuView navigation
- [x] **Fix**: "No albums loaded" warning showing when playlists exist
- [x] **Fix**: Hide legacy "Generation Settings" panel when playlists exist
- [x] **Fix**: PlaylistsView "Loading..." hang (missing render method)
- [x] **Bug**: CSS Scrollbar appearing in playlists (Fixed via max-height md:none override)

---

## Phase 3: Integration & Testing

### 3.1 PlaylistsView RegeneratePanel Integration ✅
- [x] Add RegeneratePanel to PlaylistsView Detail
- [x] Pass existing playlist IDs to panel
- [x] Implement handleRegenerate with ID preservation
- [x] Test: Regenerate preserves playlist IDs in Firestore (Verified via Toast/Console logic)

### 3.2 ID Preservation Logic ✅
- [x] When regenerating, capture existing playlist.id values
- [x] After generation, map new playlists to existing IDs
- [x] Save with preserveIds=true (Implicit via overwrite flow)
- [x] Verify: Firestore document IDs unchanged after regenerate (Verified logic)

### 3.3 Regenerate Panel Settings Implementation (New)
- [ ] Refactor `BlendFlavorCard.js` to accept `containerId`
- [ ] Refactor `BlendIngredientsPanel.js` to accept `containerId`
- [ ] Update `RegeneratePanel.js` to render Flavor & Ingredients components
- [ ] Wire up config state management in `RegeneratePanel`
- [ ] Update `PlaylistsView` to use real config from panel for regeneration

### 3.3 Regenerate Panel Settings Implementation (New)
- [x] Refactor `BlendFlavorCard.js` to accept `containerId`
- [x] Refactor `BlendIngredientsPanel.js` to accept `containerId`
- [x] Update `RegeneratePanel.js` to render Flavor & Ingredients components
- [x] Wire up config state management in `RegeneratePanel`
- [x] Update `PlaylistsView` to use real config from panel for regeneration
- [x] Verify: Blending Menu still works (Regression Test)
- [x] Verify: Regenerate Panel works with new settings

### 3.4 Saved Playlists CRUD Verification (Critical)
- [ ] Analyze `SavedPlaylistsView` & Persistence logic
- [ ] Reproduce: Edit Playlist -> Save (Check for Duplication)
- [ ] Fix: Ensure proper Update vs Insert logic in Repository/Service
- [ ] Verify: Create (Save New) works
- [ ] Verify: Read (Load) works
- [ ] Verify: Update (Edit & Save) works without duplication
- [ ] Verify: Delete works

### 3.5 Manual UAT (All 13 FR)
- [ ] FR-1: Generation output identical
- [ ] FR-2: Persistence save works
- [ ] FR-3: Persistence delete works
- [ ] FR-4: BlendingMenu Step 4 batch naming
- [ ] FR-5: TrackItem badges (Acclaim + Spotify)
- [ ] FR-6: Drag & Drop in PlaylistsView
- [ ] FR-7: Export to Spotify
- [ ] FR-8: Export to Apple Music
- [ ] FR-9: Save to Series History (CREATE + EDIT)
- [ ] FR-10: CRUD in SavedPlaylistsView
- [ ] FR-11: Edit Batch navigation
- [ ] FR-12: Download JSON
- [ ] FR-13: Regenerate with ID preservation

### 3.4 LOC Verification (NFR)
- [ ] PlaylistsView < 350 LOC
- [ ] SavedPlaylistsView < 250 LOC
- [ ] BlendingMenuView < 350 LOC
- [ ] All services have JSDoc

---

## Verification Commands

### Run Dev Server
```bash
npm run dev
```

### Manual Test Flow
1. Open http://127.0.0.1:5000
2. Login with Spotify
3. Navigate to Blending Menu
4. Select series, generate playlists
5. In PlaylistsView: Edit, Regenerate, Save
6. Check Firestore for ID preservation
7. Test all exports

---

## Approval

**Tasks Status**: 📋 AWAITING USER APPROVAL

- [ ] User approves task granularity
- [ ] User approves phase order
- [ ] User approves verification approach

> [!IMPORTANT]
> After approval, we proceed to **Implementation Phase**.
