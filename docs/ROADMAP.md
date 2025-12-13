# MJRP Playlist Generator - Product Roadmap

**Last Updated**: 2025-12-13
**Current Version**: v2.2.1
**Current Sprint**: Sprint 7 (Data Enrichment & UAT)

---

## 🎯 Product Vision

Transform MJRP Playlist Generator from a single-device tool into a **multi-device, cloud-synced music curation platform** with integrations to major streaming services (Apple Music, Spotify).

---

## ✅ Completed Sprints (1-5)


### Sprint 1: Foundation (Nov 2025)
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

### Sprint 3: Core Views (Nov 2025)
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
### Sprint 5: Inventory System & Persistence (Nov - Dec 2025)
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


### Sprint 7: Data Enrichment Validation + Apple Music Integration

**Duration**: 1-2 weeks  
**Priority**: High  
**Status**: 🚧 **In Progress** (UAT)

#### Pre-Requisites (Done in Sprint 6)
- ✅ Apple Developer Account configured
- ✅ .p8 Key generated (can be reused for MusicKit)

#### Part A: Data Enrichment & UI Polish (UAT In Progress)

- [x] **Optimized Autocomplete**
    - [x] Data Optimization (JSON index)
    - [x] Web Worker Setup
    - [x] UI Integration
    - [ ] **UI/UX Refinement** (Load Albums Form) - *WIP: Autocomplete field by artist + manual album entry*

- [ ] **Data Validation & Assets**
    - [ ] **Cover Art Loading** - *WIP: Fix Sync/Async hydration & loading state*
    - [ ] Verify Script Completion (`albums-expanded.json`)

#### Part B: Integrations & Fixes (UAT In Progress)

- [ ] **Export Workflow UI**
    - [ ] "Connect to Apple Music" button in PlaylistsView
    - [ ] **Fix Export Bug**: Missing tracks (e.g. 72 Seasons) - *WIP: Add debug logging*

- [ ] **Backend Proxy & API Client**
    - [ ] Endpoint for Developer Token generation
    - [ ] Apple Music API calls (search, create playlist) for Apple Music API calls (via proxy or client)

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
- 🚧 Export Verification (Part B) - **IN PROGRESS** (Fixing track matching issues, e.g. 72 Seasons)

---

#### Part B: Apple Music Integration

- [ ] **MusicKit Setup**
  - Enable MusicKit capability on App ID
  - Generate Developer Token (JWT with .p8 key)

- [ ] **Backend Proxy**
  - Endpoint for Developer Token generation
  - Endpoint for Apple Music API calls (search, create playlist)

- [ ] **Apple Music API Client**
  - `searchTracks(query)` - Find tracks in Apple Music catalog
  - `createPlaylist(name, description)` - Create user playlist
  - `addTracksToPlaylist(playlistId, trackIds)` - Add tracks

- [ ] **Export Workflow UI**
  - "Connect to Apple Music" button in PlaylistsView
  - Export Progress Modal (Matching tracks...)
  - Handling unmatched tracks (Skip or Manual search)
  - Success confirmation with link to Apple Music

**Deliverables**:
- Data enrichment validated and deployed
- MusicKit OAuth integration
- Export playlists to Apple Music

---


### Sprint 8: Native App (Capacitor) + Batch Operations

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

### Sprint 9: Spotify Integration (Export)

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

## 📊 Long-Term Vision (Post-Sprint 9)

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
