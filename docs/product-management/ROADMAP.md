# MJRP Playlist Generator - Product Roadmap

**Last Updated**: 2025-12-02  
**Current Version**: v2.0.4  
**Current Sprint**: Sprint 5 Phase 3 (Ready for UAT)

---

## 🎯 Product Vision

Transform MJRP Playlist Generator from a single-device tool into a **multi-device, cloud-synced music curation platform** with integrations to major streaming services (Apple Music, Spotify).

---

## ✅ Completed Sprints (1-4)

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

## 🚧 Current Sprint

### Sprint 5 Phase 3: Inventory System & Persistence (In Progress)

**Status**: Phase 3 - Ready for UAT  
**Duration**: 3 phases (Nov 2025 - Dec 2025)

#### Scope

**📦 Persistence Architecture**
- ✅ **Firestore Persistence**
  - Replace localStorage with Firestore Cloud Database
  - Persistence cross-device (sync between devices)
  - User-scoped data (`/users/{userId}/`)
  
- ✅ **IndexedDB Cache** (L2 cache)
  - Replace localStorage (5MB limit)
  - IndexedDB = ~500MB+ capacity
  - Cross-tab sync

- ✅ **Repository Pattern**
  - `AlbumRepository`, `SeriesRepository`, `PlaylistRepository`
  - `InventoryRepository` ← inventory persistence!
  - CRUD completo (Create, Read, Update, Delete)

- ✅ **Migration Tool**
  - Migrate data from localStorage → Firestore
  - No data loss

- ✅ **Inventory Persistence**
  - Save owned albums in Firestore
  - Format, price, notes → all persisted

**UAT Status**: Pending user confirmation

---

## 📜 Completed Sprints

For detailed history of Sprints 1-4, see [CHANGELOG.md](../CHANGELOG.md).

**Summary**:
- **Sprint 1**: Vite + Vitest setup, Store architecture (Albums, Playlists, Series)
- **Sprint 2**: History API router, BaseView architecture, HomeView with series creation
- **Sprint 3**: AlbumsView (library), RankingView (acclaim data), Album detail view
- **Sprint 4**: PlaylistsView with drag-and-drop, "Generate Playlist" feature
- **Sprint 4.5**: Hotfixes (caching issues, localStorage migration)

---

## 🚀 Upcoming Sprints

### Sprint 6: Apple Music Integration (Export)

**Duration**: 1-2 weeks  
**Priority**: High

#### Scope

- [ ] **Apple Music Auth**
  - Register App in Apple Music Developer Dashboard
  - Implement OAuth2 Flow (Backend proxy or PKCE)
  - Store/Refresh Tokens securely

- [ ] **Apple Music API Client**
  - `searchTracks(query)`
  - `createPlaylist(userId, name, description)`
  - `addTracksToPlaylist(playlistId, uris)`

- [ ] **Export Workflow**
  - "Connect to Apple Music" UI in PlaylistsView
  - Export Progress Modal (Matching tracks...)
  - Handling unmatched tracks (Manual search fallback?)
  - Success confirmation with link to Apple Music

**Deliverables**:
- Apple Music OAuth integration
- Export playlists to Apple Music
- Production deployment with export feature

---

### Sprint 7: Authentication (Apple & Google)

**Duration**: 1 week  
**Priority**: High

#### Scope

- [ ] **Login with Apple ID**
  - Enable Apple Sign-In
  - Integrate with Apple authentication SDK

- [ ] **Login with Google Account**
  - Enable Google Sign-In
  - Integrate with Google authentication SDK

- [ ] **User Data Persistence**
  - Capture and persist **only name and email** from user
  - Secure user data in Firestore (`/users/{userId}/profile`)

**Deliverables**:
- Multi-provider authentication
- User profile management
- Secure session handling

---

### Sprint 8: Batch Album Operations

**Duration**: TBD  
**Priority**: Medium  
**Status**: To be defined after Sprint 6 production release

#### Scope (Draft)

- [ ] **Load Batch of Albums**
  - Import multiple albums at once
  - CSV/JSON import support?
  - Bulk album search

- [ ] **Export Batch of Albums**
  - Export album data
  - Format options (JSON, CSV, etc.)

**Note**: Scope to be refined based on user feedback after Sprint 6.

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
- [CHANGELOG.md](../CHANGELOG.md) - Detailed development history
- [V2.0_ANALYSIS.md](V2.0_ANALYSIS.md) - Technical analysis
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Executive summary
