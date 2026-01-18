# Specification - Sprint 19: Frontend Modularization
**Status**: ✅ COMPLETED (2026-01-10)
**Created**: 2026-01-10
**Source**: [refactoring_recommendations.md](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/docs/technical/refactoring_recommendations.md)

---

## 1. Problem Statement (WHAT)

The Code Quality Assessment v10 identified four "God Files" in the frontend layer that exceed the 400 LOC threshold and mix concerns:

| File | LOC | Issue |
|:---|:---:|:---|
| `SeriesView.js` | 422 | Monolithic View with inline rendering |
| `SavedPlaylistsView.js` | 412 | Mixed rendering & logic |
| `playlists.js` (store) | 484 | Feature creep, state + computation mixed |
| `albumSeries.js` (store) | 427 | Same as above |

These files violate:
- **Single Responsibility Principle (SRP)**: One file does too many things.
- **"Thin View" Pattern**: Views should delegate to Controllers/Renderers.
- **Store Purity**: Stores should be state containers, not compute engines.

---

## 2. Business Value (WHY)

- **Maintainability**: Smaller, focused files are easier to understand and modify.
- **Testability**: Extracted services/components can be unit-tested in isolation.
- **Onboarding**: New developers can grok smaller modules faster.
- **Consistency**: Aligns with patterns established in Sprints 17/18 (Service Layer).

---

## 3. Scope

### In Scope
1.  **`SeriesView.js`**: Extract `SeriesHeader`, `SeriesProgressBar`, `SeriesEmptyState` as child components.
2.  **`SavedPlaylistsView.js`**: Extract `SavedPlaylistCard`, `SavedPlaylistActions` as reusable components.
3.  **`playlists.js`**: Split into `PlaylistsStore` (pure state) and `PlaylistsService` (computation, CRUD orchestration).
4.  **`albumSeries.js`**: Split into `AlbumSeriesStore` (pure state) and `SeriesService` (CRUD, enrichment orchestration).

### Out of Scope
- `SpotifyService.js` (Medium priority, deferred).
- `BlendIngredientsPanel.js` (Config extraction deferred).
- Backend routes (already addressed in Sprint 18).

---

## 4. Success Criteria

| Metric | Target |
|:---|:---|
| `SeriesView.js` LOC | < 200 |
| `SavedPlaylistsView.js` LOC | < 200 |
| `playlists.js` LOC | < 250 (Store only) |
| `albumSeries.js` LOC | < 250 (Store only) |
| **Build Status** | PASS |
| **Regression** | All `[SERIES]`, `[PLAYLIST_MGR]`, `[HISTORY]` checklists pass **via Agent Browser** |

---

## 5. Risks & Mitigations

| Risk | Mitigation |
|:---|:---|
| **Breaking Store Subscriptions** | Carefully migrate subscribers to new Store/Service imports. |
| **State Desync** | Service must call Store methods, never mutate directly. |
| **UI Regression** | Full regression test after each track. |

---

## 6. Deliverables

### New Files (Expected)
- `public/js/components/series/SeriesHeader.js`
- `public/js/components/series/SeriesProgressBar.js`
- `public/js/components/series/SeriesEmptyState.js`
- `public/js/components/playlists/SavedPlaylistCard.js`
- `public/js/components/playlists/SavedPlaylistActions.js`
- `public/js/services/PlaylistsService.js`
- `public/js/services/SeriesService.js`

### Modified Files
- `public/js/views/SeriesView.js`
- `public/js/views/SavedPlaylistsView.js`
- `public/js/stores/playlists.js`
- `public/js/stores/albumSeries.js`

---

## 8. Parallel Execution Plan (Multi-Agent)

To enable conflict-free parallel work between agents, the sprint is divided into **two independent tracks**:

### Track A: Views (Agent 1)
**Files Owned**:
- `public/js/views/SeriesView.js`
- `public/js/views/SavedPlaylistsView.js`
- `public/js/components/series/SeriesHeader.js` (NEW)
- `public/js/components/series/SeriesProgressBar.js` (NEW)
- `public/js/components/series/SeriesEmptyState.js` (NEW)
- `public/js/components/playlists/SavedPlaylistCard.js` (NEW)
- `public/js/components/playlists/SavedPlaylistActions.js` (NEW)

**Regression Scope**: `[SERIES]`, `[HISTORY]`

### Track B: Stores (Agent 2)
**Files Owned**:
- `public/js/stores/playlists.js`
- `public/js/stores/albumSeries.js`
- `public/js/services/PlaylistsService.js` (NEW)
- `public/js/services/SeriesService.js` (NEW)

**Regression Scope**: `[PLAYLIST_MGR]`, `[BLEND]`

### Coordination Rules
1.  **No Cross-Track Edits**: Agent 1 does NOT touch `/stores/`. Agent 2 does NOT touch `/views/`.
2.  **Interface Contract**: Before starting, agree on the public API of new Services (method names, params). Views will import Services but not modify them.
3.  **Merge Order**: Track B (Stores) merges first to `main`. Track A (Views) merges second, consuming the new Services.
4.  **Shared Regression**: After both tracks merge, run FULL browser regression.

---

## 7. Open Questions (For User)

1.  Should `PlaylistsService` also handle Spotify export orchestration, or leave that to the existing `SpotifyExportService`?
2.  Is there a preference for naming: `SeriesService` vs `AlbumSeriesService`?
