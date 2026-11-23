# MJRP Playlist Generator - Product Roadmap

**Last Updated**: 2026-01-12
**Current Version**: v3.20.0
**Current Sprint**: Sprint 21: Upcoming Features 🏗️

---

## 🚧 Current Sprint

## 🚧 Current Sprint

### Sprint 24: QA & Stability
- [ ] End-to-End Testing (Cypress/Playwright).
- [ ] Performance Audit (Lighthouse).
- [ ] Documentation Cleanup.

---

## ✅ Completed Sprints (Reverse Chronological)

### Sprint 23: Consolidated Ranking Refactor (Jan 2026)
**Goal**: Resolve ranking inconsistencies and unify all ranking data into a single `evidence` array.
**Status**: ✅ **DONE** (2026-01-19)
**Deliverables**:
- ✅ **Schema Consolidation**: Track `evidence` array merges BEA, Spotify, and AI data.
- ✅ **Evidence UI**: Tooltips displaying score breakdown per source.
- ✅ **Persistence Logic**: Fixed `SeriesService` to save enriched data to Firestore.
- ✅ **Cache Sync**: Fixed "Refetch" to immediately update Blending Menu cache.
- ✅ **Ranking Fixes**: Regex fix for "72 Seasons", forced sort by rating in BEA Enrichment.

---

## ✅ Completed Sprints (Reverse Chronological)

### Sprint 21.5: Stability & Bug Fixing (Jan 2026)
**Goal**: Resolve critical UX issues (ghost skeletons, deletions flashes) and clean up technical debt.
**Status**: ✅ **DONE** (2026-01-16)
**Deliverables**:
- ✅ **Deletion Flashes**: Fixed "No albums" flash on series/album deletion (#159, #158, #161).
- ✅ **Surgical Cache**: Implemented instant "Surgical Injection" for new/deleted items (#156).
- ✅ **New Album Enrichment**: Real-time BestEverAlbums rating fetch for new additions (#156).
- ✅ **Series Sync**: Fixed Toolbar Dropdown Sync (#160).
- ✅ **Visual Feedback**: Verified skeleton animations and removed progress bars (#152).
- ✅ **Clean Log**: Resolved all open critical issues in DEBUG_LOG.

### Sprint 21: Mobile UX & Layout Refresh (Jan 2026)
**Goal**: Comprehensive Mobile UX overhaul, including layout responsiveness, virtual scrolling, and functional series sorting.
**Status**: ✅ **DONE** (2026-01-14)
**Deliverables**:
- ✅ **Mobile Layout**: Responsive grid/list, fullscreen modals, touch-friendly tables.
- ✅ **Series Performance**: Virtual scrolling with `VirtualScrollObserver`, skeletons, and lazy loading.
- ✅ **Series Sorting**: Functional sorting by Name (A-Z/Z-A), Album Count, and Recency.
- ✅ **Visual Polish**: Pulse animations, consolidated CSS, better empty states.

---

### Sprint 20: User-Ranking & Recipe Parity (Jan 2026)
**Goal**: Implement personal track ranking and ensure functional parity for the "My Own Ranking" recipe.
**Status**: ✅ **DONE** (2026-01-12)
**Deliverables**:
- ✅ **User Ranking System**: Drag-and-drop ranking modal with Firestore persistence.
- ✅ **Recipe Parity**: "My Own Ranking" now supports Top-N and Grouping options.
- ✅ **Execution Logic**: Locked user strategy for UGR playlists.
- ✅ **TracksTable Refactor**: New "My Rank" column and repositioned statistics.
- ✅ **Hybrid Sorting**: Fixed cross-view sorting regression via event delegation.
- ✅ **Hybrid Sorting**: Fixed cross-view sorting regression via event delegation.
- ✅ **Title Prefixes**: `SPFY`/`BEA`/`UGR` prefixes for ranking source identification.

---

### Sprint 19: Frontend Modularization
**Goal**: Refactor identified "God Views" and "Thick Stores" from the Code Quality Assessment.
**Status**: ✅ **DONE** (2026-01-10)
**Deliverables**:
- ✅ **Track B**: Split `playlists.js` and `albumSeries.js` → Pure Stores + Services.
- ✅ **Track A**: Refactor `SeriesView.js` & `SavedPlaylistsView.js` → Extract components.
- ✅ **Track C**: Service Layer Refinement (Sub-services & Orchestrators).
- ✅ **Track D**: View Modularization (Components & Helpers).
- ✅ **LOC Achievement**: All refactored stores < 150 LOC. Significant reduction in Views.

### Sprint 18: Holistic Quality & Refactor (Backend + Frontend)
**Goal**: Resolve identified "God Class/File" warnings and "Route Thinness" failures to improve architectural health.
**Status**: ✅ **DONE** (2026-01-10)
**Spec**: [sprint18-backend-refactor/plan.md](technical/specs/archive/sprint18-backend-refactor/plan.md)
**Deliverables**:
- ✅ **Track A**: Recipe Rebranding (Merged from 17.9)
- ✅ **Track B**: Backend Route Thinness (`albums.js`)
- ✅ **Track C**: Frontend God File - Export (`SpotifyExportModal.js`)
- ✅ **Track D**: Frontend God Files - Renderers (`TopNav.js`, `AlbumsGridRenderer.js`)

### Sprint 17.9: Recipe Rebranding (Conceptual Alignment)
**Goal**: Rename "Flavor" to "Recipe" to align with "Menu" metaphor and support future sharing.
**Status**: ✅ **DONE** (2026-01-11)
**Delivered**: 2026-01-11
**Deliverables**:
- ✅ Global string/variable/UI rename completed by Track A agent.
- ✅ Documentation synchronized (ADR-0015).

### Sprint 17.75: Classification Modularization (Jan 2026)
**Goal**: Extract album classification heuristics from `AlbumSearchService` into modular strategy classes.
**Status**: ✅ **DONE** (2026-01-10)
**Delivered**: 2026-01-10 (v3.17.5)
**Deliverables**:
- ✅ **AlbumTypeClassifier.js**: Orchestrator using Chain of Responsibility pattern.
- ✅ **Modular Strategies**: TitleKeyword, AIWhitelist, AppleMetadata.
- ✅ **Refactored Service**: `AlbumSearchService` uses injected strategies.

### Sprint 17: Architectural Modularization (Frontend Specialization)
**Goal**: Decouple "Thick Client" Monoliths into distinct Controllers and Services.
**Status**: ✅ **DONE** (2026-01-08)
**Delivered**: 2026-01-08 (v3.17.0)
**Deliverables**:
- ✅ **SeriesView Refactor**: Converted to Thin Orchestrator (ARCH-16).
- ✅ **MusicKit Modularization**: Split God Service (ARCH-15).
- ✅ **Variable Top N Strategy**: Patternized strategies (ARCH-17).

### Sprint 16: Cleanup & Batch Naming Feature (Jan 2026)
**Goal**: Consistent naming and SafeDOM migration.
**Status**: ✅ **DONE** (2026-01-03)
**Delivered**: 2026-01-03 (v3.16.0)
**Deliverables**:
- ✅ **Batch Naming Integration**: Consistent naming across create/edit/export flows.
- ✅ **SafeDOM Migration**: Eliminated all innerHTML sinks (>50).
- ✅ **Modals Killer**: Replaced legacy Modals.js with DialogService.
- ✅ **Context-Aware Loading**: Fixed Series cross-contamination bug (ARCH-14).
- ✅ **Component Consolidation**: Removed BatchGroupCard/PlaylistCard legacy code.

### Sprint 15.5: Prod Polish & Blending Fixes (Jan 2026)
**Goal**: Algorithm renaming and grouping strategies.
**Status**: ✅ **DONE** (2026-01-02)
**Delivered**: 2026-01-02 (v3.15.5)
**Deliverables**:
- ✅ **Algorithm Renaming**: Self-explanatory names ("Top 3 Tracks by Spotify Popularity", etc.)
- ✅ **Grouping Tracks**: New parameter with 4 strategies (By Album, Global Rank, Artist Cluster, Shuffle)
- ✅ **Sequential Distribution**: Multiple Playlists now fill sequentially (preserves grouping)
- ✅ **Smart Duration Visibility**: Target Duration hidden for fixed-count algorithms unless Multiple mode
- ✅ **Flavor Grouping**: Spotify/BEA algorithms visually grouped in Blending Menu
- ✅ **BestEverAlbums Branding**: "Acclaim" badges renamed across all UI components
- ✅ **Bug Fixes**: Issues #114, #115 resolved

### Sprint 15: Structural Integrity & Release v3.15 (Dec 2025)
**Delivered**: 2025-12-31 (v3.15)
**Status**: ✅ **DONE**
**Deliverables**:
- ✅ **ARCH-12: SafeDOM Migration** - Eliminated 50+ `innerHTML` sinks.
- ✅ **ARCH-13: Lazy Authorize** - Improved UX, no popup on load.
- ✅ **Storefront Strategy**: Smart detection via browser locale.
- ✅ **Edit Modal Refactor**: Artist scan with filters (Home parity).
- ✅ **Release v3.15**: Consolidated stability release.

### Sprint 14: Home Refactor & V3 Architecture (Dec 2025)
**Delivered**: 2025-12-28 (v3.2.0)
**Status**: ✅ **DONE**
**Deliverables**:
- ✅ **ARCH-11: HomeView Refactor** - Reduced GridRenderer/Controller split (688 -> 182 LOC).
- ✅ **ARCH-4: Search Modularization** - Independent Album Search Service.
- ✅ **V3 Design System**: Split-Panel Staging Area & Search.
- ✅ **Performance**: Optimized V3 DOM updates.
- ✅ **Critical Fix**: "Thriller" bug (#97) via Object Query compatibility patch.

### Sprint 13: Tech Debt & V3 Architecture (Dec 2025)
**Delivered**: 2025-12-26 (v3.1.0)
**Status**: ✅ **DONE**
**Deliverables**:
- ✅ **ARCH-1: PlaylistsView Modularization** - Controller/Renderer/DragHandler split
- ✅ **ARCH-2: Store Pattern Standardization** - SpotifyEnrichmentRepository
- ✅ **ARCH-3: Component Reuse Foundation** - BaseCard, BatchGroupCard
- ✅ **ARCH-5: Cache Consolidation** - AlbumCache → IndexedDB via CacheManager
- ✅ **ARCH-6: SeriesView Loading Optimization** - Incremental render, store cache
- ✅ **CRIT-1 to CRIT-5**: Atomic saves, innerHTML security, Firestore rules, album pipeline fixes
- ✅ **Issues #92, #93, #94**: Album cache/display, reconfigure panel, progress bar

### Sprint 12: Critical Fixes & Architecture Refactor (Dec 2025)
**Delivered**: 2025-12-24 (v3.0.0)
**Status**: ✅ **DONE**
**Deliverables**:
- ✅ **Ranking Bug Fixes**: Corrected ID passing in ranking comparison.
- ✅ **Persistence Production Fixes**: Solved `updateDoc` error in `AlbumsStore`.
- ✅ **Firestore Rules**: Fixed permissions for `spotify_enrichment`.
- ✅ **UI Polish**: New `AlbumCascade` component and `TopNav` restoration.
- ✅ **Ranking Strategy Pattern**: Decoupled ranking algorithms.

### Sprint 11: Spotify Integration & Documentation (Dec 2025)
**Delivered**: 2025-12-19 (v2.11.0)
**Status**: ✅ **DONE**
**Deliverables**:
- ✅ **Spotify OAuth Integration**: PKCE flow, secure token management.
- ✅ **Spotify Data Enrichment**: Track popularity enrichment and ranking.
- ✅ **Export to Spotify**: Direct playlist creation and track sync.
- ✅ **Multi-Source Ranking UI**: `TracksRankingComparison` component for Acclaim vs Popularity.
- ✅ **Documentation Overhaul**: 100% component coverage in `component_reference.md` and refined architecture flows.

### Sprint 9+10: Ranking Enrichment & Codebase Refactoring (Dec 2025)
**Delivered**: 2025-12-18 (v2.9.0)
**Status**: ✅ **DONE**
**Deliverables**:
- ✅ **EditPlaylistView**: Full editing support for saved playlist batches
- ✅ **GlobalProgress Component**: Top loading bar (YouTube-style)
- ✅ **Skeleton Loaders CSS**: Modern shimmer effect for loading states
- ✅ **Playlist Numbering**: Visual and generation numbering
- ✅ **Server Routes Modularization**: index.js reduced from 535 to 151 lines
- ✅ **Bug Fixes**: Issues #54-62 resolved (ghost playlists, regenerate freeze, etc.)
- ✅ **Cleanup**: Deleted musicboard.js (-421 lines)

### Sprint 8.5: Algorithm Improvements & Playlist Fixes (Dec 2025)
**Delivered**: 2025-12-17 (v2.8.5)
**Status**: ✅ **DONE**
**Deliverables**:
- ✅ **MJRP Cascade V0 Algorithm**: Preserved original algorithm for comparison
- ✅ **State Machine Pattern**: Explicit CREATE/EDIT modes for playlist workflow
- ✅ **Playlist Ordering**: `order` field ensures GH→DC1→DC2 sequence
- ✅ **Overwrite Logic**: Delete old batch before saving new
- ✅ **Bug Fixes**: Ghost playlists (#54, #55), localStorage recovery, albumsStore context

### Sprint 8: Algorithm Strategy Pattern (Dec 2025)
**Delivered**: 2025-12-16 (v2.8.0)
**Status**: ✅ **DONE**
**Deliverables**:
- ✅ **Algorithm Selector UI**: Radio button selector in PlaylistsView
- ✅ **3 Playlist Generation Algorithms**: Legacy Round-Robin, S-Draft Original, MJRP Balanced Cascade.

### Sprint 7-7.5: Data Enrichment + View Revamp (Dec 2025)
**Delivered**: 2025-12-15 (v2.7.0, v2.7.1)
**Status**: ✅ **DONE**
**Deliverables**:
- ✅ **Rebrand**: "The Album Blender"
- ✅ **Apple Music Integration**: MusicKit OAuth, export playlists
- ✅ **ViewMode Strategy Pattern**: Compact/Expanded strategies
- ✅ **AlbumsView Consolidation**: Series management integrated

### Sprint 6: Authentication (Dec 2025)
**Delivered**: 2025-12-12 (v2.1.1)
**Status**: ✅ **DONE**
**Deliverables**:
- ✅ **Apple Sign-In**: Configured via Firebase Auth
- ✅ **Google Sign-In**: Configured
- ✅ **CSP Updates**: Security policy fixes

### Sprint 5: Inventory System & Persistence (Dec 2025)
**Delivered**: 2025-12-09 (v2.1.0)
**Status**: ✅ **DONE**
**Deliverables**:
- ✅ **Firestore Persistence**: Cloud sync for Albums, Series, and Playlists.
- ✅ **Inventory CRUD**: Complete management of owned albums.
- ✅ **Repository Pattern**: Abstraction layer for data access.

### Sprint 4 + 4.5: Generate Playlist + Hotfixes (Nov 2025)
**Delivered**: 2025-11-28
**Status**: ✅ **DONE**
**Deliverables**:
- ✅ Core playlist generation feature
- ✅ Drag-and-drop with Sortable.js
- ✅ Undo/Redo functionality
- ✅ AbortController for API calls

### Sprint 3: Core Views (Nov 2025)
**Delivered**: 2025-11-20
**Status**: ✅ **DONE**
**Deliverables**:
- ✅ Albums Library, Ranking, Playlists views
- ✅ BestEverAlbums badge integration
- ✅ Grid vs Expanded view toggle

### Sprint 2: Router + Views (Nov 2025)
**Delivered**: 2025-11-15
**Status**: ✅ **DONE**
**Deliverables**:
- ✅ History API router (clean URLs)
- ✅ BaseView architecture (lifecycle methods)
- ✅ HomeView with series creation

### Sprint 1: Foundation (Nov 2025)
**Delivered**: 2025-11-10
**Status**: ✅ **DONE**
**Deliverables**:
- ✅ Vite setup (HMR, modern bundler)
- ✅ Vitest testing framework
- ✅ Store architecture (Albums, Playlists, Series)

---

## 🔮 Upcoming Sprints

### Sprint 22: Blending Context & Discovery
**Goal**: Expand the blending experience with cross-series context and enhanced discovery tools.
**Scope**:
- [ ] Cross-Series Recipe Execution.
- [ ] Recommendation Engine Integration.

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

**See Also**:
- [CHANGELOG.md](CHANGELOG.md) - Detailed development history
- PROJECT_SUMMARY.md - Executive summary
- component_reference.md - Technical details
