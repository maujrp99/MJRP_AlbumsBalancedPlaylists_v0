# MJRP Playlist Generator - Product Roadmap

**Last Updated**: 2025-12-19
**Current Version**: v2.11.0
**Current Sprint**: Sprint 12: Critical Fixes & Architecture Refactor

---

## 🚧 Current Sprint

### Sprint 12: Critical Fixes & Architecture Refactor
**Goal**: Resolve the Ranking Table bug and begin "AlbumsView" modularization.
**Duration**: 1-2 weeks  
**Priority**: High  
**Status**: 🔄 **IN PROGRESS**
**Branch**: `feature/albumsview-refactor`

#### Part A: Bug Fixes (UAT Blockers)
- [ ] **Critical: Wrong Tracks in Ranking Table (#71)**
  - Investigation using new documentation flows
  - Fix Album ID passing in `ExpandedStrategy`
  - Verify track reference isolation
- [ ] **Loading UX Improvements (#70)**
  - Smoother transition between skeleton and multi-source ranking
- [ ] **Badge Display Verification (#58)**
  - Ensure "PENDING" is correctly replaced by "ACCLAIM" or "POPULARITY"

#### Part B: AlbumsView Modularization
- [ ] **Break down God-File**
  - Extract `renderAlbumCard` logic to a dedicated module
  - Modularize event delegation setup
  - Decouple stores from view lifecycle (Dependency Injection foundation)

---

## 📋 Upcoming Sprints / Backlog

### Sprint 13: Native App (Capacitor) + Batch Operations
**Status**: Planned
**Priority**: Medium

#### Part A: Capacitor PWA Wrapper
- [ ] **Setup Capacitor**
- [ ] **Native Features (iOS Haptics)**
- [ ] **Distribution (TestFlight)**

#### Part B: Batch Album Operations
- [ ] **Load Batch of Albums (bulk import)**
- [ ] **Export Batch of Albums (CSV/JSON)**

---

## 🎯 Product Vision

To empower music lovers and casual curators to transcend algorithmic bubbles by providing the definitive music curation platform. The MJRP Playlist Generator, "The Album Blender" will transform the art of playlist creation by using the intelligence of global acclaim ratings (BestEverAlbums, Musicboard) and AI enrichment (Google Gemini) to generate balanced playlists that are objectively balanced from acclaimed albums or albums from your favorite artist. Our vision is to be a multi-device, cloud-synced ecosystem where a passion for artist's albums meets data precision, delivering the perfect balanced album playlist experience with native integration into the largest streaming platforms (Spotify, Apple Music).

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
