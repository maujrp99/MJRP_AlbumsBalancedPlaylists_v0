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

## Phase 2: Components (UI Extraction) ⏳ IN PROGRESS

### 2.1 TrackItem.js
- [ ] Create `public/js/components/playlists/TrackItem.js`
- [ ] Implement badge order logic (primaryRanking prop)
- [ ] Include drag handle, duration, title, artist
- [ ] Support Acclaim badge (orange)
- [ ] Support Spotify badge (green)
- [ ] Verify: Visual matches mockup

### 2.2 PlaylistCard.js
- [ ] Create `public/js/components/playlists/PlaylistCard.js`
- [ ] Header with name (editable), track count, duration
- [ ] Contains TrackItem list
- [ ] Support Sortable.js integration for drag & drop
- [ ] Verify: Matches current playlist column layout

### 2.3 PlaylistGrid.js
- [ ] Create `public/js/components/playlists/PlaylistGrid.js`
- [ ] Grid layout of PlaylistCards
- [ ] Responsive columns (1/2/3)
- [ ] Verify: Renders correctly on different screen sizes

### 2.4 RegeneratePanel.js
- [ ] Create `public/js/components/playlists/RegeneratePanel.js`
- [ ] Reuse BlendFlavorCard component
- [ ] Reuse BlendIngredientsPanel component
- [ ] Collapsible panel header
- [ ] "Regenerate" CTA button
- [ ] Warning about ID preservation
- [ ] Verify: Panel expands/collapses

### 2.5 BatchGroupCard.js
- [ ] Create `public/js/components/playlists/BatchGroupCard.js`
- [ ] Header with batch name, date
- [ ] List of playlists in batch
- [ ] Edit/Delete buttons per playlist
- [ ] Edit Batch / Delete Batch actions
- [ ] Verify: Matches current SavedPlaylistsView layout

### 2.6 Migrate Views to Components
- [ ] PlaylistsView: Replace renderTrack with TrackItem
- [ ] PlaylistsView: Replace renderPlaylists with PlaylistGrid
- [ ] SavedPlaylistsView: Replace inline rendering with BatchGroupCard
- [ ] Verify: No visual regression

---

## Phase 3: Integration & Testing

### 3.1 PlaylistsView RegeneratePanel Integration
- [ ] Add RegeneratePanel to PlaylistsView Detail
- [ ] Pass existing playlist IDs to panel
- [ ] Implement handleRegenerate with ID preservation
- [ ] Test: Regenerate preserves playlist IDs in Firestore

### 3.2 ID Preservation Logic
- [ ] When regenerating, capture existing playlist.id values
- [ ] After generation, map new playlists to existing IDs
- [ ] Save with preserveIds=true
- [ ] Verify: Firestore document IDs unchanged after regenerate

### 3.3 Manual UAT (All 13 FR)
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
