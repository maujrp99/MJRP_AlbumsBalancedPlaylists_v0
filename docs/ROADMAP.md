# MJRP Playlist Generator - Product Roadmap

**Last Updated**: 2025-12-15
**Current Version**: v2.7.1
**Current Sprint**: Sprint 7.5.1: SeriesView Consolidation (DONE) - Pending merge

---

## 🎯 Product Vision

To empower music lovers and casual curators to transcend algorithmic bubbles by providing the definitive music curation platform. The MJRP Playlist Generator, "The Album Blender" will transform the art of playlist creation by using the intelligence of global acclaim ratings (BestEverAlbums, Musicboard) and AI enrichment (Google Gemini) to generate balanced playlists that are objectively balanced from acclaimed albums or albums from your favorite band7artist. Our vision is to be the multi-device, cloud-synced ecosystem where a passion for artist's albums meets data precision, delivering the perfect balanced album playlist experience with native integration into the largest streaming platforms (Spotify, Apple Music).
---

## ✅ Completed Sprints (1-5)


### Sprint 1: Foundation (Nov 2025) - DONE
**Goal**: Modern build tooling + state management foundation  
**Duration**: 2 weeks

**Deliverables**:
- ✅ Vite setup (HMR, modern bundler)
- ✅ Vitest testing framework
- ✅ Store architecture (Albums, Playlists, Series)
- ✅ 55 unit tests, 82.57% coverage

**Key Technical Decisions**:
- **Vite over Rollup**: HMR, faster builds, minimal config
- **Vanilla JS**: No framework lock-in, small bundle size
- **Observer pattern**: Custom stores instead of Redux/MobX

---

### Sprint 2: Router + Views (Nov 2025)
**Goal**: Navigation infrastructure + view components  
**Duration**: 1 week

**Deliverables**:
- ✅ History API router (clean URLs `/albums`, `/ranking`)
- ✅ BaseView architecture (lifecycle methods)
- ✅ HomeView with series creation
- ✅ 67 tests passing (12 router + 55 stores)

**Technical Highlights**:
- Custom router (no external lib dependency)
- View lifecycle: `mount()`, `unmount()`, `update()`

---

### Sprint 3: Core Views (Nov 2025) - DONE
**Goal**: Albums Library, Ranking, Playlists views  
**Duration**: 2 weeks

**Deliverables**:
- ✅ AlbumsView: filters (artist, year, status), view modes (grid/list)
- ✅ RankingView: track-level acclaim data display
- ✅ PlaylistsView: generated playlists display
- ✅ BestEverAlbums badge integration

**Features**:
- Grid vs Expanded view toggle
- Persistent filter state (localStorage)
- Real-time sync across views

---

### Sprint 4 + 4.5: Generate Playlist + Hotfixes (Nov 2025)
**Goal**: Core playlist generation feature + critical fixes  
**Duration**: 2 weeks + 1 week hotfixes

**Deliverables**:
- ✅ "Generate Playlist" button in PlaylistsView
- ✅ Drag-and-drop with Sortable.js
- ✅ Undo/Redo functionality
- ✅ AbortController for API calls (Issue #15)
- ✅ localStorage view mode persistence (Issue #16)

**Hotfixes (4.5)**:
- Fixed ghost albums (AbortController race condition)
- Fixed view mode toggle state mismatch
- Fixed ranking URL parameter parsing

---
### Sprint 5: Inventory System & Persistence (Nov - Dec 2025) - DONE
**Goal**: Implement persistence, repository pattern, and inventory management.  
**Delivered**: 2025-12-09 (v2.1.0)

**Deliverables**:
- ✅ **Firestore Persistence**: Cloud sync for Albums, Series, and Playlists.
- ✅ **Inventory CRUD**: Complete management of owned albums.
- ✅ **Repository Pattern**: Abstraction layer for data access (SeriesRepository, etc.).
- ✅ **UI/UX Improvements**: Standardized buttons, Mobile Menu fixes, Toast notifications.
- ✅ **Consolidation**: Single entry point (`index.html`), SPA routing configured.
- ✅ **Ghost Albums Fix**: Resolved persistence query issues.

---

## ✅ Completed (Continued)

### Sprint 6: Authentication
**Goal**: Social login with Apple and Google  
**Delivered**: 2025-12-12 (v2.1.1)

**Deliverables**:
- ✅ **Apple Sign-In**: Configured via Firebase Auth + Apple Developer Portal.
- ✅ **Google Sign-In**: Already configured from previous sprint.
- ✅ **CSP Updates**: Content Security Policy fixes for Apple auth and Tailwind CDN.
- ✅ **Mobile Haptics**: Added haptic feedback for drag-and-drop (Android only).

**Technical Notes**:
- Apple auth requires exact `authDomain` match in Return URLs.
- Documented in DEBUG_LOG.md Issue #37.

---

## 🚧 Current Sprint

---


### Sprint 7: Data Enrichment Validation (NOt done yet - 15/12) + Apple Music Integration  - DONE

**Duration**: 1-2 weeks  
**Priority**: High  
**Status**: 🚧 **In Progress** (UAT)

#### Pre-Requisites (Done in Sprint 6)
- ✅ Apple Developer Account configured
- ✅ .p8 Key generated (can be reused for MusicKit)

#### Part A: Data Enrichment & UI Polish (✅ Completed)

- [x] **Optimized Autocomplete**
    - [x] Data Optimization (JSON index)
    - [x] Web Worker Setup
    - [x] UI Integration
    - [x] **UI/UX Refinement** (Load Albums Form)

- [x] **Data Validation & Assets**
    - [x] Verify Script Completion (`albums-expanded.json`)

#### Part B: Integrations (✅ Completed)

- [x] **Backend Proxy & API Client**
    - [x] Endpoint for Developer Token generation
    - [x] Apple Music API Client method

- [x] **Export Workflow UI**
    - [x] "Connect to Apple Music" button in PlaylistsView
    - [x] Export Progress Modal
    - [x] Success confirmation with link
   
- [x ] **MusicKit Setup**
  - Enable MusicKit capability on App ID
  - Generate Developer Token (JWT with .p8 key)

- [ x] **Backend Proxy**
  - Endpoint for Developer Token generation
  - Endpoint for Apple Music API calls (search, create playlist)

- [ x] **Apple Music API Client**
  - `searchTracks(query)` - Find tracks in Apple Music catalog
  - `createPlaylist(name, description)` - Create user playlist
  - `addTracksToPlaylist(playlistId, trackIds)` - Add tracks

- [ ] **Export Workflow UI**
  - "Connect to Apple Music" button in PlaylistsView
  - Export Progress Modal (Matching tracks...)
  - Handling unmatched tracks (Skip or Manual search)
  - Success confirmation with link to Apple Music

**Deliverables**:
- MusicKit OAuth integration
- Export playlists to Apple Music

#### Part C: View Revamp & Stability  - DONE

- [ ] **Holistic View Revamp (Cover Loading)**
    - [x ] Branch: `feature/cover-loading-views-revamp`
    - [x ] Standardize async hydration across `AlbumsView`, `InventoryView`
    - [ NOT DONE] Fix Inventory Ownership bug

- [ ] **Final UAT Fixes**
    - [ x] Verify "Metallica" missing tracks fix in Prod
    - [ x] Fix 500 Error (Judas Priest)

- [ ] **Export Workflow UI**
    - [ x] "Connect to Apple Music" button in PlaylistsView
    - [ x] **Fix Export Bug**: Missing tracks (e.g. 72 Seasons) - *WIP: Add debug logging*

- [ ] **Backend Proxy & API Client**
    - [ x] Endpoint for Developer Token generation
    - [ x] Apple Music API calls (search, create playlist) for Apple Music API calls (via proxy or client)

- [x] **Apple Music API Client**
  - [x] `searchTracks(query)`
  - [x] `createPlaylist(name, description)`
  - [x] `addTracksToPlaylist(playlistId, trackIds)`

- [x] **Export Workflow UI**
  - [x] "Connect to Apple Music" button in PlaylistsView
  - [x] Export Progress Modal
  - [x] Success confirmation with link

**Deliverables Status**:
- ✅ Autocomplete & Cover Loading (Part A) - *Pending User Final Sign-off*
- ✅ Export Implementation (Part B) - **DONE**
- ✅ Export Verification (Part B) - **DONE** (Fixing track matching issues, e.g. 72 Seasons)

#### Part C: View Revamp & Stability (DONE)

- [ ] **Holistic View Revamp (Cover Loading)**
    - [ x] Branch: `feature/cover-loading-views-revamp`
    - [ x] Standardize async hydration across `AlbumsView`, `InventoryView`
    - [ x] Fix Inventory Ownership bug

- [ ] **Final UAT Fixes**
    - [ x] Verify "Metallica" missing tracks fix in Prod
    - [ x] Fix 500 Error (Judas Priest)

---

### Sprint 7.5: AlbumsView Polish & Refactor (Current)ß

**Goal**: Refine AlbumsView UI/UX and fix "Ghost Albums" via architectural scope changes + Apple Music Metadata Refactor.
**Status**: 🚧 **In Progress**

**Deliverables**:
- [x] **Data Flow Architecture**: Scope-based loading (All vs Single Series).
- [x] **UI Refinement**:
    - [x] Series Dropdown Filter (Tech Theme).
    - [x] "All Series" visual grouping with borders (Compact + Expanded).
    - [x] Action buttons justified right, below cover.
    - [x] "View Tracks" label update.
- [x] **Interaction**: (STRATEGY pattern implemented to fix issues - se debug log)
    - [x] Compact View: Click cover → Modal.
    - [x] Expanded View: Default behavior.
- [ ] **Architecture Refactor**:
    - [x ] `loadAlbum` uses Apple Music Metadata (Fast).
    - [WIP 15/12 ] Backend acts as "Enrichment" only (Rankings).

---

### Sprint 8: Rank by User Feature + Revamp Playlist Generation and S-Draft algorithm

###PARKING LOT BACKLOG

### Sprint X: Native App (Capacitor) + Batch Operations

**Duration**: 1-2 weeks  
**Priority**: Medium  
**Status**: Planned

#### Part A: Capacitor PWA Wrapper

- [ ] **Setup Capacitor**
  - Install `@capacitor/core`, `@capacitor/cli`
  - Initialize iOS platform (`npx cap add ios`)

- [ ] **Native Features**
  - Install `@capacitor/haptics` - Haptic feedback on iOS
  - Configure App ID and signing in Xcode

- [ ] **Distribution**
  - TestFlight for personal use
  - (Optional) App Store submission

**Estimated Effort**: ~2 hours

---

#### Part B: Batch Album Operations

- [ ] **Load Batch of Albums**
  - Import multiple albums at once
  - CSV/JSON import support
  - Bulk album search via Discogs

- [ ] **Export Batch of Albums**
  - Export album data
  - Format options (JSON, CSV)

**Note**: Scope to be refined based on user feedback after Sprint 7.

---

### Sprint Y: Spotify Integration (Export)

**Duration**: 1-2 weeks  
**Priority**: Medium

#### Scope

- [ ] **Spotify Auth**
  - Register App in Spotify Developer Dashboard
  - Implement OAuth2 Flow (Backend proxy or PKCE)
  - Store/Refresh Tokens securely

- [ ] **Spotify API Client**
  - `searchTracks(query)`
  - `createPlaylist(userId, name, description)`
  - `addTracksToPlaylist(playlistId, uris)`

- [ ] **Export Workflow**
  - "Connect to Spotify" UI in PlaylistsView
  - Export Progress Modal (Matching tracks...)
  - Handling unmatched tracks (Manual search fallback?)
  - Success confirmation with link to Spotify

**Deliverables**:
- Spotify OAuth integration
- Export playlists to Spotify
- Unified export UI (Apple Music + Spotify)

---

## 📊 Long-Term Vision - 

**Ideas for future consideration**:
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
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Executive summary
- [SPRINT5_UAT_20251206.md](technical/tester/SPRINT5_UAT_20251206.md) - Current blockers
