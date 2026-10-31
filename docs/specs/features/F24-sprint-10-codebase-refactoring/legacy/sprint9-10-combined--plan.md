# Implementation Plan: Sprint 10 - Codebase Refactoring

**Branch**: `sprint10-refactor` | **Date**: 2025-12-18 | **Spec**: [spec.md](./spec.md)

---

## Summary

Systematically refactor high-complexity files to improve maintainability, reduce cognitive load, and align with Constitution Principle II (Clean Code & Modular Architecture). Primary targets: AlbumsView.js (1,820 → 600 lines), server/index.js (535 → 150 lines), PlaylistsView.js (891 → 500 lines).

---

## Technical Context

**Language/Version**: JavaScript ES2022+, Node.js 18+  
**Primary Dependencies**: Vite, Express.js, Firebase SDK, MusicKit JS  
**Storage**: Firestore, LocalStorage (L1/L2 Cache)  
**Testing**: Vitest (unit), Puppeteer (E2E)  
**Target Platform**: Web (Firebase Hosting + Cloud Run)  
**Project Type**: Web application (frontend + backend)  
**Performance Goals**: < 1s page load, < 200ms API response  
**Constraints**: Zero functional regression, no new dependencies  
**Scale/Scope**: 39 albums in test library, ~50 source files

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. User-Centric Quality | ✅ PASS | No UI changes, preserving current UX |
| II. Clean Code & Modular Architecture | 🎯 PRIMARY | This refactor directly addresses this principle |
| III. Documentation First | ✅ PASS | Creating spec/plan/tasks before code |
| IV. Spec-Driven & Test-Supported | ✅ PASS | Following SDD workflow, tests will verify |
| V. Operational Excellence | ✅ PASS | Build/deploy process unchanged |

---

## Project Structure

### Documentation (this feature)

```text
docs/technical/specs/sprint10-refactor/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file
└── tasks.md             # Implementation tasks
```

### Source Code Changes

```text
public/js/views/
├── albums/                      # [NEW] Module directory
│   ├── AlbumsGridRenderer.js    # [NEW] Grid/list rendering
│   ├── AlbumsFilters.js         # [NEW] Filter logic
│   ├── SeriesModals.js          # [NEW] Modal handlers
│   └── AlbumsDataLoader.js      # [NEW] Data loading
├── playlists/                   # [NEW] Module directory
│   ├── PlaylistsDragDrop.js     # [NEW] SortableJS logic
│   └── PlaylistsExport.js       # [NEW] Apple Music export
├── AlbumsView.js                # [MODIFY] Reduce to orchestrator
└── PlaylistsView.js             # [MODIFY] Reduce to orchestrator

server/
├── routes/                      # [MODIFY] Add new route files
│   ├── albums.js                # [NEW] Album endpoints
│   ├── playlists.js             # [NEW] Playlist endpoint
│   ├── debug.js                 # [NEW] Debug endpoints
│   └── musickit.js              # [EXISTING] No change
└── index.js                     # [MODIFY] Reduce to app setup only

public/js/
└── app.legacy.js                # [DELETE] Dead code
```

**Structure Decision**: Creating subdirectories under `views/` for related modules follows the existing pattern in `views/strategies/`. This maintains consistency with current architecture.

---

## Proposed Changes

### Phase 0: Preparation

#### [DELETE] [app.legacy.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/app.legacy.js)
- Verify no imports reference this file
- Delete and confirm build passes

---

### Phase 1: AlbumsView Modularization

#### [NEW] [AlbumsGridRenderer.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/views/albums/AlbumsGridRenderer.js)
- Extract: `renderAlbumsGrid()`, `renderExpandedList()`, `renderScopedGrid()`, `renderScopedList()`
- Extract: `renderRankedTracklist()`, `renderOriginalTracklist()`, `renderEmptyState()`, `renderLoadingProgress()`
- Export as class or functions that receive `view` context

#### [NEW] [AlbumsFilters.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/views/albums/AlbumsFilters.js)
- Extract: `filterAlbums()`, `getUniqueArtists()`
- Manage filter state independently

#### [NEW] [SeriesModals.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/views/albums/SeriesModals.js)
- Extract: `setupSeriesModals()`, `openEditSeriesModal()`, `openDeleteSeriesModal()`
- Extract: `renderSeriesAlbumsList()`, `closeSeriesModal()`, `initSeriesAutocomplete()`

#### [NEW] [AlbumsDataLoader.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/views/albums/AlbumsDataLoader.js)
- Extract: `loadScope()`, `loadAlbumsFromQueries()`, `updateLoadingProgress()`

#### [MODIFY] [AlbumsView.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/views/AlbumsView.js)
- Import new modules
- Delegate to modules in `render()`, `mount()`, `destroy()`
- Keep only orchestration logic
- Target: < 600 lines

---

### Phase 2: Server Route Extraction

#### [NEW] [routes/albums.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/server/routes/albums.js)
- Move: `/api/generate` endpoint
- Move: `/api/enrich-album` endpoint

#### [NEW] [routes/playlists.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/server/routes/playlists.js)
- Move: `/api/playlists` endpoint

#### [NEW] [routes/debug.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/server/routes/debug.js)
- Move: `/api/debug/*` endpoints
- Move: `/api/list-models` endpoint

#### [MODIFY] [index.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/server/index.js)
- Keep: Express app setup, CORS, middleware
- Keep: Health endpoint `/_health`
- Use: `app.use('/api', albumRoutes)`
- Target: < 150 lines

---

### Phase 3: PlaylistsView Split

#### [NEW] [PlaylistsDragDrop.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/views/playlists/PlaylistsDragDrop.js)
- Extract: `setupDragAndDrop()`, `onStart()`, `onEnd()`
- SortableJS configuration and handlers

#### [NEW] [PlaylistsExport.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/views/playlists/PlaylistsExport.js)
- Extract: `handleExportJson()`, `handleExportToAppleMusic()`, `attachExportListeners()`

#### [MODIFY] [PlaylistsView.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/views/PlaylistsView.js)
- Import new modules
- Delegate to modules
- Target: < 500 lines

---

## Verification Plan

### Automated Tests

```bash
# After each phase:
npm run build                  # Verify Vite build succeeds
npm run test                   # Verify all 39 tests pass
npm run lint                   # Verify no new lint errors
```

### Manual Verification

#### Phase 0 Verification
- [ ] Build passes after deleting app.legacy.js
- [ ] App loads in browser without errors

#### Phase 1 Verification
- [ ] Albums page loads correctly
- [ ] Filter by artist works
- [ ] Filter by year works
- [ ] Filter by source works
- [ ] Search works
- [ ] View mode toggle works (compact/expanded)
- [ ] Series modal opens/closes
- [ ] Add album to series works
- [ ] Remove album from series works

#### Phase 2 Verification
- [ ] `/api/generate` returns album data
- [ ] `/api/enrich-album` returns BestEver info with albumId
- [ ] `/api/playlists` generates playlists
- [ ] `/_health` responds OK

#### Phase 3 Verification
- [ ] Drag-and-drop reorders tracks
- [ ] Export to JSON downloads file
- [ ] Export to Apple Music creates playlist

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Circular imports | Use index.js barrel exports per module directory |
| `this` context loss | Pass `view` reference to module functions |
| Event listener leaks | Ensure `destroy()` calls module cleanup |
| Build size increase | Monitor via `npm run build -- --report` |

---

## Timeline Estimate

| Phase | Duration | Checkpoint |
|-------|----------|------------|
| Phase 0 | 15 min | Build passes |
| Phase 1 | 2-3 hours | All Albums features work |
| Phase 2 | 1-2 hours | All API endpoints work |
| Phase 3 | 1-2 hours | Playlists features work |

**Total**: ~5-7 hours of focused work
