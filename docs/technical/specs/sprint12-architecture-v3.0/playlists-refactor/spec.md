# PlaylistsView Architecture Review & Componentization Spec

**Created**: 2025-12-23 21:43
**Status**: 📋 DRAFT
**Sprint**: 12.5 (Proposed)
**Priority**: High

---

## 1. Problem Statement

The introduction of the **Blending Menu** (Sprint 12) created a new playlist generation flow that duplicates logic from `PlaylistsView`. This leads to:

| Issue | Impact |
|-------|--------|
| **Duplicated track mapping** | Both views transform tracks separately (e.g., `spotifyRank` fix needed in 2 places) |
| **Duplicated generation logic** | Algorithm instantiation, ranking strategy selection repeated |
| **UI inconsistency risk** | Track rendering could diverge between views |
| **Maintenance burden** | Bug fixes require changes in multiple files |

---

## 2. Current State Analysis

### 2.1 BlendingMenuView (NEW - Sprint 12)
```
BlendingMenuView.js (513 LOC)
├── 4-Step Wizard UI
├── Series selection
├── Algorithm/Flavor selection
├── Ingredients (duration, ranking, discovery)
├── Generation logic (lines 400-440)
│   ├── Create algorithm
│   ├── Create ranking strategy
│   ├── Generate playlists
│   └── Transform tracks (DUPLICATED)
└── Navigate to PlaylistsView
```

### 2.2 PlaylistsView (LEGACY)
```
PlaylistsView.js (893 LOC)
├── Algorithm selector (legacy collapsible panel)
├── Ranking strategy selector
├── Generation logic (lines 683-783)
│   ├── Create algorithm
│   ├── Create ranking strategy
│   ├── Generate playlists
│   └── Transform tracks (DUPLICATED)
├── Playlists grid rendering
├── Track item rendering
├── Drag & Drop
├── Export section
└── Save to history
```

### 2.3 Duplicated Code Identified

| Code Block | BlendingMenuView | PlaylistsView |
|------------|------------------|---------------|
| Track transformation | Lines 411-420 | Lines 751-762 |
| Algorithm instantiation | Lines 385-400 | Lines 734-746 |
| setPlaylists call | Line 428 | Line 768 |

---

## 3. Proposed Architecture

### 3.1 Target State: Shared Logic Layer

```
┌─────────────────────────────────────────────────────────────┐
│               PlaylistGenerationService (NEW)                │
│  (Single Source of Truth for generation logic)               │
│  ├── generatePlaylists(albums, config)                       │
│  ├── transformTracks(tracks)                                 │
│  └── validateGenerationConfig(config)                        │
└─────────────────────────────────────────────────────────────┘
         ▲                           ▲
         │                           │
   ┌─────┴─────┐               ┌─────┴─────┐
   │ Blending  │               │ Playlists │
   │ MenuView  │               │   View    │
   └───────────┘               └───────────┘
```

### 3.2 Target State: Componentized UI

```
components/playlists/
├── PlaylistCard.js          ← Renders single playlist column
├── TrackItem.js             ← Renders track with badges (shared)
├── PlaylistGrid.js          ← Grid layout of playlists
├── PlaylistExportPanel.js   ← Export buttons
├── PlaylistSavePanel.js     ← Save to history
└── GenerationProgress.js    ← Loading overlay
```

---

## 4. User Stories

### US-1: Centralize Playlist Generation Logic
> As a **developer**, I want playlist generation logic centralized in a service
> So that changes (like adding spotifyRank) apply everywhere automatically.

**Acceptance Criteria:**
- [ ] Create `PlaylistGenerationService.js`
- [ ] Move `generatePlaylists()` logic from both views
- [ ] Move `transformTracks()` to single function
- [ ] BlendingMenuView calls service
- [ ] PlaylistsView calls service
- [ ] Unit tests for service

---

### US-2: Extract TrackItem Component
> As a **developer**, I want a reusable `TrackItem` component
> So that track rendering is consistent across all views.

**Acceptance Criteria:**
- [ ] Create `TrackItem.js` component
- [ ] Supports Acclaim badge (orange)
- [ ] Supports Spotify badge (green)
- [ ] Supports drag handle (optional)
- [ ] PlaylistsView uses component
- [ ] BlendingMenuView can use same component (future)

---

### US-3: Deprecate PlaylistsView Generation UI
> As a **user**, I want the Blending Menu to be the primary generation entry point
> So that I have a consistent, guided experience.

**Acceptance Criteria:**
- [ ] PlaylistsView focuses on editing/export only
- [ ] Remove/simplify "Generation Settings" section
- [ ] Add "← Generate More" link to Blending Menu
- [ ] Update navigation flow

---

## 5. Technical Tasks

### Phase 1: Service Extraction (Logic)
- [ ] Create `services/PlaylistGenerationService.js`
- [ ] Extract `transformTracks()` helper
- [ ] Extract `generateFromAlbums(albums, config)` method
- [ ] Update BlendingMenuView to use service
- [ ] Update PlaylistsView to use service
- [ ] Delete duplicated code

### Phase 2: UI Componentization
- [ ] Create `components/playlists/TrackItem.js`
- [ ] Create `components/playlists/PlaylistCard.js`
- [ ] Migrate PlaylistsView to use components
- [ ] Update UI tests

### Phase 3: UX Simplification (Optional)
- [ ] Evaluate removing generation from PlaylistsView
- [ ] Update navigation to favor Blending Menu

---

## 6. Impact Analysis

| Area | Current | After |
|------|---------|-------|
| **LOC in BlendingMenuView** | 513 | ~450 (-63) |
| **LOC in PlaylistsView** | 893 | ~750 (-143) |
| **New Service LOC** | 0 | ~150 |
| **New Components LOC** | 0 | ~200 |
| **Net Change** | - | ~-56 LOC + better separation |

---

## 7. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking existing generation | Keep PlaylistsView generation working during transition |
| UI regression | Visual comparison tests before/after |
| Complex refactoring | Phased approach, one user story at a time |

---

## 8. Open Questions

1. **Should PlaylistsView still support generation?**
   - Option A: Keep for power users
   - Option B: Remove completely, redirect to Blending Menu

2. **Should TrackItem support preview playback?**
   - Future consideration for Spotify integration

---

## 9. Dependencies

- Spotify Enrichment (completed Sprint 12)
- Blending Menu (completed Sprint 12)
- Algorithm Registry (completed Sprint 11)

---

## Approval

- [ ] Architecture review by user
- [ ] Scope confirmation
- [ ] Priority confirmation
