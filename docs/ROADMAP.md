# MJRP Playlist Generator - Product Roadmap

**Last Updated**: 2025-12-26
**Current Version**: v3.0.0
**Current Sprint**: Sprint 14: Clean Architecture Continuation

---

## 🚧 Current Sprint

### Sprint 15: Structural Integrity (ARCH-12)
**Goal**: Unified Component System & Technical Debt Elimination
**Duration**: 2 weeks
**Priority**: Critical
**Status**: 🔄 **IN PROGRESS**
**Branch**: `sprint-15-arch-12`

#### Part A: Componentization (ARCH-12)
- [ ] **Unified Component Library**: `src/components/ui/{Card, TrackRow, Modal}`
- [ ] **Refactor Base Components**: Clean up `base/`, `shared/`, `common/`
- [ ] **SavedPlaylistsView Refactor**: Pilot implementation of new system

#### Part B: Security & Quality
- [ ] **Safety Patch**: Fix 53 `innerHTML` sinks
- [ ] **Documentation**: Update UI Style Guide

---

## 🎯 Product Vision

- **The Album Blender**: A mixer that takes raw data (albums, AOTY ratings, Spotify popularity) and blends them into a coherent, balanced listening experience.
- **Blending Menu**: A standardized, highly parametrized interface for choosing "Mix Styles" (e.g., Balanced Flow, Hits & Gems).
- **Entity Agnosticism**: While Album-Centric, the system supports Artists and Genres as first-class entry points.
- **Responsive Componentization**: "Write Once, Adapt Everywhere". A UI component library that adapts to Mobile and Desktop contexts.

### 📊 Long-Term Vision
- Collaborative series sharing
- Advanced playlist algorithms
- Cross-platform sync (mobile apps)
- Integration with other music services (YouTube Music, Tidal, etc.)
- AI-powered playlist recommendations

---

## 🔄 Roadmap Maintenance

**Update Frequency**: After each sprint completion  
**Review Triggers**:
- End of sprint
- Major milestone reached
- Scope changes from user feedback

**Process**:
1. Update "Current Sprint" section
2. Move completed sprint to "Completed Sprints"
3. Adjust "Upcoming Sprints" based on learnings
4. Update CHANGELOG.md with detailed history

---

## ✅ Completed Sprints (Reverse Chronological)

### Sprint 14: Home Refactor & V3 Architecture (Dec 2025) - DONE ✅
**Delivered**: 2025-12-28 (v3.2.0)

**Deliverables**:
- ✅ **ARCH-11: HomeView Refactor** - Reduced GridRenderer/Controller split (688 -> 182 LOC).
- ✅ **ARCH-4: Search Modularization** - Independent Album Search Service.
- ✅ **V3 Design System**: Split-Panel Staging Area & Search.
- ✅ **Performance**: Optimized V3 DOM updates.
- ✅ **Critical Fix**: "Thriller" bug (#97) via Object Query compatibility patch.

---

### Sprint 13: Tech Debt & V3 Architecture (Dec 2025) - DONE ✅
**Delivered**: 2025-12-26 (v3.1.0)

**Deliverables**:
- ✅ **ARCH-1: PlaylistsView Modularization** - Controller/Renderer/DragHandler split
- ✅ **ARCH-2: Store Pattern Standardization** - SpotifyEnrichmentRepository
- ✅ **ARCH-3: Component Reuse Foundation** - BaseCard, BatchGroupCard
- ✅ **ARCH-5: Cache Consolidation** - AlbumCache → IndexedDB via CacheManager
- ✅ **ARCH-6: SeriesView Loading Optimization** - Incremental render, store cache
- ✅ **CRIT-1 to CRIT-5**: Atomic saves, innerHTML security, Firestore rules, album pipeline fixes
- ✅ **Issues #92, #93, #94**: Album cache/display, reconfigure panel, progress bar

**Remaining (moved to Sprint 14)**:
- ARCH-4: Album Search Modularization
- Issue #95: Series filter dropdown empty on first load

---

### Sprint 12: Critical Fixes & Architecture Refactor (Dec 2025) - DONE ✅
**Delivered**: 2025-12-24 (v3.0.0)

**Deliverables**:
- ✅ **Ranking Bug Fixes**: Corrected ID passing in ranking comparison.
- ✅ **Persistence Production Fixes**: Solved `updateDoc` error in `AlbumsStore`.
- ✅ **Firestore Rules**: Fixed permissions for `spotify_enrichment`.
- ✅ **UI Polish**: New `AlbumCascade` component and `TopNav` restoration.
- ✅ **Ranking Strategy Pattern**: Decoupled ranking algorithms.

---

### Sprint 11: Spotify Integration & Documentation (Dec 2025) - DONE ✅
**Delivered**: 2025-12-19 (v2.11.0)

**Deliverables**:
- ✅ **Spotify OAuth Integration**: PKCE flow, secure token management.
- ✅ **Spotify Data Enrichment**: Track popularity enrichment and ranking.
- ✅ **Export to Spotify**: Direct playlist creation and track sync.
- ✅ **Multi-Source Ranking UI**: `TracksRankingComparison` component for Acclaim vs Popularity.
- ✅ **Documentation Overhaul**: 100% component coverage in `component_reference.md` and refined architecture flows.

---

### Sprint 9+10: Ranking Enrichment & Codebase Refactoring (Dec 2025) - DONE ✅
**Delivered**: 2025-12-18 (v2.9.0)

**Deliverables**:
- ✅ **EditPlaylistView**: Full editing support for saved playlist batches
- ✅ **GlobalProgress Component**: Top loading bar (YouTube-style)
- ✅ **Skeleton Loaders CSS**: Modern shimmer effect for loading states
- ✅ **Playlist Numbering**: Visual and generation numbering
- ✅ **Server Routes Modularization**: index.js reduced from 535 to 151 lines
- ✅ **Bug Fixes**: Issues #54-62 resolved (ghost playlists, regenerate freeze, etc.)
- ✅ **Cleanup**: Deleted musicboard.js (-421 lines)

---

### Sprint 8.5: Algorithm Improvements & Playlist Fixes (Dec 2025) - DONE ✅
**Delivered**: 2025-12-17 (v2.8.5)

**Deliverables**:
- ✅ **MJRP Cascade V0 Algorithm**: Preserved original algorithm for comparison
- ✅ **State Machine Pattern**: Explicit CREATE/EDIT modes for playlist workflow
- ✅ **Playlist Ordering**: `order` field ensures GH→DC1→DC2 sequence
- ✅ **Overwrite Logic**: Delete old batch before saving new
- ✅ **Bug Fixes**: Ghost playlists (#54, #55), localStorage recovery, albumsStore context

---

### Sprint 8: Algorithm Strategy Pattern (Dec 2025) - DONE ✅
**Delivered**: 2025-12-16 (v2.8.0)

**Deliverables**:
- ✅ **Algorithm Selector UI**: Radio button selector in PlaylistsView
- ✅ **3 Playlist Generation Algorithms**: Legacy Round-Robin, S-Draft Original, MJRP Balanced Cascade.

---

### Sprint 7-7.5: Data Enrichment + View Revamp (Dec 2025) - DONE ✅
**Delivered**: 2025-12-15 (v2.7.0, v2.7.1)

**Deliverables**:
- ✅ **Rebrand**: "The Album Blender"
- ✅ **Apple Music Integration**: MusicKit OAuth, export playlists
- ✅ **ViewMode Strategy Pattern**: Compact/Expanded strategies
- ✅ **AlbumsView Consolidation**: Series management integrated

---

### Sprint 6: Authentication (Dec 2025) - DONE ✅
**Delivered**: 2025-12-12 (v2.1.1)

**Deliverables**:
- ✅ **Apple Sign-In**: Configured via Firebase Auth
- ✅ **Google Sign-In**: Configured
- ✅ **CSP Updates**: Security policy fixes

---

### Sprint 5: Inventory System & Persistence (Dec 2025) - DONE ✅
**Delivered**: 2025-12-09 (v2.1.0)

**Deliverables**:
- ✅ **Firestore Persistence**: Cloud sync for Albums, Series, and Playlists.
- ✅ **Inventory CRUD**: Complete management of owned albums.
- ✅ **Repository Pattern**: Abstraction layer for data access.

---

### Sprint 4 + 4.5: Generate Playlist + Hotfixes (Nov 2025) - DONE ✅
**Deliverables**:
- ✅ Core playlist generation feature
- ✅ Drag-and-drop with Sortable.js
- ✅ Undo/Redo functionality
- ✅ AbortController for API calls

---

### Sprint 3: Core Views (Nov 2025) - DONE ✅
**Deliverables**:
- ✅ Albums Library, Ranking, Playlists views
- ✅ BestEverAlbums badge integration
- ✅ Grid vs Expanded view toggle

---

### Sprint 2: Router + Views (Nov 2025) - DONE ✅
**Deliverables**:
- ✅ History API router (clean URLs)
- ✅ BaseView architecture (lifecycle methods)
- ✅ HomeView with series creation

---

### Sprint 1: Foundation (Nov 2025) - DONE ✅
**Deliverables**:
- ✅ Vite setup (HMR, modern bundler)
- ✅ Vitest testing framework
- ✅ Store architecture (Albums, Playlists, Series)

---

**See Also**:
- [CHANGELOG.md](CHANGELOG.md) - Detailed development history
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Executive summary
- [component_reference.md](technical/component_reference.md) - Technical details
