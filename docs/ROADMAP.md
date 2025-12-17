# MJRP Playlist Generator - Product Roadmap

**Last Updated**: 2025-12-17
**Current Version**: v2.8.5
**Current Sprint**: Sprint 9: Ranking Refactor & Data Enrichment (Starting)

---

## 🎯 Product Vision

To empower music lovers and casual curators to transcend algorithmic bubbles by providing the definitive music curation platform. The MJRP Playlist Generator, "The Album Blender" will transform the art of playlist creation by using the intelligence of global acclaim ratings (BestEverAlbums, Musicboard) and AI enrichment (Google Gemini) to generate balanced playlists that are objectively balanced from acclaimed albums or albums from your favorite band7artist. Our vision is to be the multi-device, cloud-synced ecosystem where a passion for artist's albums meets data precision, delivering the perfect balanced album playlist experience with native integration into the largest streaming platforms (Spotify, Apple Music).
---

## ✅ Completed Sprints (1-5)

Sprint 8.5 - Enhancements 
(Implementation and release per phase)

Phase 1 - MJRP Balanced Cascade algorithm enhancement:
    - No momento de revisão se as playlists tem menos de 48 min, se a soma da duração da playlist DC N e da DC N+1 for menor que 48 min, faz o merge da playlists mantendo o agrupamento de ranking.



Phase- 2 UI improvements on Playlist view:
- Move MJRP Balanced Cascade to be the first displayed on the left
- Precisamos melhorar as descrições do algoritmo para ser mais didática, mais user friendly, para leigos.
- We have to “Regenerate” now (see print). Does the one in the Actions & Export section still make sense? 


Phase 3 Feature improvement on Playlist view:- o delete está deletando a Album Series inteira, deveria deletar somente a playlist
- Precisamos implementar a nomeação da playlist pelo usuario e reorganizar a UI da playlist view. O que quero dizer:
    - Uma Album Series X, pode ter a playlist serie X.1, X.2, Y, Z, todas pertencentes a albums series X. Então, cada vez que for salvar um playlist to Series History, precisamos ter o nome da playlist pra agrupar na UI da playlist view. Entende? 

Phase 4 - New suggested algorithms
- Implementar os algoritmos que vc sugeriu:
Balanced Mix	VARIETY	Distribuição igual de ratings
Timeline Journey	JOURNEY	Ordem cronológica por ano
BestEver Elite	ELITE	Só tracks com rating ≥ 80


Sprint 9 - Ranking Options Refactor + Artists/Albums Data Enrichment

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

---

### Sprint 7-7.5: Data Enrichment + View Revamp (Dec 2025) - DONE
**Delivered**: 2025-12-15 (v2.7.0, v2.7.1)

**Deliverables**:
- ✅ **Rebrand**: "The Album Playlist Synthesizer" → "The Album Blender"
- ✅ **Apple Music Integration**: MusicKit OAuth, export playlists
- ✅ **ViewMode Strategy Pattern**: Compact/Expanded strategies
- ✅ **AlbumsView Consolidation**: Series management integrated
- ✅ **SaveAllView**: Data migration page

---

### Sprint 8: Algorithm Strategy Pattern (Dec 2025) - DONE ✅
**Delivered**: 2025-12-16 (v2.8.0)

**Deliverables**:
- ✅ **Algorithm Selector UI**: Radio button selector in PlaylistsView
- ✅ **3 Playlist Generation Algorithms**:
  - Legacy Round-Robin (original)
  - S-Draft Original (full Serpentine)
  - **MJRP Balanced Cascade** (Serpentine + Cascade - RECOMMENDED)
- ✅ **SDD Documentation**: ALGORITHM_MENU.md, spec.md, plan.md, tasks.md

**MJRP Balanced Cascade Features**:
- Greatest Hits: #1 and #2 only (split if >60min)
- Serpentine first pass (odd/even albums)
- Cascade global for excess tracks (ping-pong by ranking)
- Duration trim: >48min → Orphan Tracks

---

### Sprint 8.5: Algorithm Improvements & Playlist Fixes (Dec 2025) - DONE ✅
**Delivered**: 2025-12-17 (v2.8.5)

**Deliverables**:
- ✅ **MJRP Cascade V0 Algorithm**: Preserved original algorithm for comparison
- ✅ **State Machine Pattern**: Explicit CREATE/EDIT modes for playlist workflow
- ✅ **Playlist Ordering**: `order` field ensures GH→DC1→DC2 sequence
- ✅ **Overwrite Logic**: Delete old batch before saving new
- ✅ **Bug Fixes**: Ghost playlists (#54, #55), localStorage recovery, albumsStore context

**Technical Debt Identified**:
- PlaylistsView has 891 lines (needs split in Sprint 10)
- 5 sources of truth for "active series" (needs cleanup)

---

## 🚧 Current Sprint

### Sprint 9: Ranking Refactor & Data Enrichment

**Duration**: 2 weeks  
**Priority**: High  
**Status**: 🚧 **Starting**

#### Part A: Ranking System Refactor

- [ ] **User Rankings**
  - Allow users to create custom track rankings
  - Store in Firestore under user context
  - UI: Star rating or 1-100 scale input

- [ ] **Ranking Sources**
  - Source selector: BestEver / Musicboard / User / Hybrid
  - Visual indicator of source in AlbumsView

- [ ] **Ranking Display**
  - RankingView revamp with source tabs
  - Track-level ranking comparison

#### Part B: Artist/Album Data Enrichment

- [ ] **Artist Metadata**
  - Fetch from Discogs/MusicBrainz
  - Artist bio, image, genre tags

- [ ] **Album Metadata**
  - Enhanced credits
  - Recording date vs release date
  - Studio/location info

- [ ] **Gemini AI Enrichment** (Optional)
  - AI-generated album descriptions
  - Similar albums suggestions

---

## 📋 Upcoming Sprints

### Sprint 10: Playlist Subsystem Refactor

**Duration**: 2 weeks  
**Priority**: High  
**Status**: Planned

**Goal**: Clean architecture for playlist generation and management

#### Refactoring Scope

- [ ] **Single Source of Truth**: URL params drive state
- [ ] **Split PlaylistsStore** (440 lines):
  - `PlaylistsStore` (state only)
  - `PlaylistsPersistence` (Firestore/localStorage)
  - `PlaylistsVersioning` (undo/redo)

- [ ] **Split PlaylistsView** (891 lines):
  - `PlaylistsView` (coordinator)
  - `PlaylistGenerator` (algorithm execution)
  - `PlaylistRenderer` (UI)
  - `PlaylistExporter` (JSON/Apple Music)

- [ ] **Context Pattern**
  - `PlaylistsContext.init(params)` sets all stores from URL
  - Remove redundant setter calls from navigation points

---

### Sprint 11: Native App (Capacitor) + Batch Operations

**Duration**: 1-2 weeks  
**Priority**: Medium  
**Status**: Planned

---

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
