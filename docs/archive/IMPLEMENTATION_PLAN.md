# Implementation Plan - Codebase Refactoring

## Goal
Improve codebase maintainability, readability, and testability by systematically refactoring high-complexity files.

## User Review Required

> [!IMPORTANT]
> **This is a significant refactoring effort.** Before proceeding:
> 1. Which phase(s) should we prioritize? (P0/P1/P2)
> 2. Should we delete `app.legacy.js` immediately?
> 3. Any specific files you want to exclude from refactoring?

---

## Phase 0: Critical Fixes (Week 1)

### P0.1: Delete Legacy Code

#### [DELETE] [app.legacy.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/app.legacy.js)
- **Size**: 47KB (1,200+ lines)
- **Reason**: Dead code, superseded by modular `app.js` + views architecture
- **Action**: Delete after confirming no active imports

---

### P0.2: Modularize AlbumsView.js

**Current State**: 1,820 lines, 31 methods, 6 responsibilities

#### [NEW] [AlbumsGridRenderer.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/views/albums/AlbumsGridRenderer.js)
- Extract: `renderAlbumsGrid()`, `renderExpandedList()`, `renderScopedGrid()`, `renderScopedList()`
- Extract: `renderRankedTracklist()`, `renderOriginalTracklist()`
- ~400 lines

#### [NEW] [AlbumsFilters.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/views/albums/AlbumsFilters.js)
- Extract: `filterAlbums()`, `getUniqueArtists()`
- Filter state management
- ~100 lines

#### [NEW] [SeriesModals.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/views/albums/SeriesModals.js)
- Extract: `setupSeriesModals()`, `openEditSeriesModal()`, `openDeleteSeriesModal()`
- Extract: `renderSeriesAlbumsList()`, `closeSeriesModal()`, `initSeriesAutocomplete()`
- ~200 lines

#### [NEW] [AlbumsDataLoader.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/views/albums/AlbumsDataLoader.js)
- Extract: `loadScope()`, `loadAlbumsFromQueries()`, `updateLoadingProgress()`
- ~150 lines

#### [MODIFY] [AlbumsView.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/views/AlbumsView.js)
- Reduced to ~500 lines
- Composition of extracted modules
- `render()`, `mount()`, `destroy()` orchestration only

---

## Phase 1: Short Term (Week 2-3)

### P1.1: Server Route Extraction

#### [NEW] [routes/albums.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/server/routes/albums.js)
- Move: `/api/generate`, `/api/enrich-album`

#### [NEW] [routes/playlists.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/server/routes/playlists.js)
- Move: `/api/playlists`

#### [NEW] [routes/debug.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/server/routes/debug.js)
- Move: `/api/debug/*`, `/api/list-models`

#### [MODIFY] [index.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/server/index.js)
- Reduced to ~100 lines
- Use Express Router pattern

---

### P1.2: Split PlaylistsView.js

#### [NEW] [PlaylistsDragDrop.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/views/playlists/PlaylistsDragDrop.js)
- Extract: `setupDragAndDrop()`, `onStart()`, `onEnd()`
- SortableJS configuration

#### [NEW] [PlaylistsExport.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/views/playlists/PlaylistsExport.js)
- Extract: `handleExportJson()`, `handleExportToAppleMusic()`, `attachExportListeners()`

---

## Phase 2: Medium Term (Week 4+)

### P2.1: MusicKitService Split

#### [NEW] [MusicKitAuth.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/services/musickit/MusicKitAuth.js)
- Token management, initialization

#### [NEW] [MusicKitSearch.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/services/musickit/MusicKitSearch.js)
- Album/track search operations

#### [NEW] [MusicKitPlaylist.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/services/musickit/MusicKitPlaylist.js)
- Playlist creation/management

---

### P2.2: Modal Consolidation

- Create `ModalRegistry` pattern
- Centralize modal state management
- Event delegation for all modals

---

## Verification Plan

### Automated Tests
```bash
npm run test       # Vitest unit tests
npm run lint       # ESLint validation
npm run build      # Vite production build
```

### Manual Verification
1. **P0 Complete**: Navigate to Albums view, verify all features work
2. **P1 Complete**: Verify API endpoints respond correctly
3. **P2 Complete**: Apple Music export still functional

---

## Success Criteria

| Phase | Target | Metric |
|-------|--------|--------|
| P0 | AlbumsView.js < 600 lines | ✅ when `wc -l` < 600 |
| P1 | server/index.js < 150 lines | ✅ when `wc -l` < 150 |
| P2 | MusicKitService.js < 200 lines | ✅ when `wc -l` < 200 |

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| P0 | 3-4 hours | None |
| P1 | 2-3 hours | P0 |
| P2 | 3-4 hours | P1 |

**Total**: ~10 hours of focused refactoring work
