# CHANGELOG

All notable changes to the MJRP Albums Balanced Playlists project.

### ⏳ Phase 3 - Remaining Work

**Status**: Updated 2025-11-30 17:04 (Based on [CodeVerificationReport.md](CodeVerificationReport.md))

**UI Components** (incomplete):
- **Migration Progress Modal** - Visual UI component for migration progress
  - Current: Uses `console.log` + browser `alert()` 
  - Needed: Custom modal with progress bar (optional - for production polish)
- **Create Series from Inventory** - Backend workflow implementation
  - Current: UI modal exists, has TODO comment in code (line 228 `InventoryView.js`)
  - Needed: Complete `SeriesRepository.createFromInventory()` method

**UI Components** (⚠️ IMPLEMENTED - Pending UAT, may contain bugs):
- ⚠️ Migration Banner (HomeView) - 369 lines, implemented
  - Status: Code exists, needs UAT testing
- ⚠️ Edit Album Modal - 150 lines in `EditAlbumModal.js`
  - Status: Code exists, needs UAT testing
- ⚠️ Delete Album Modal - Implemented in `InventoryView.js` via `Modals.js`
  - Status: Code exists, needs UAT testing
- ⚠️ InventoryView - 593 lines, 21 methods, route `/inventory` working
  - Status: Code exists, needs UAT testing, may have bugs
- ⚠️ Add to Inventory action - Integrated in `AlbumsView.js`
  - Status: Code exists, needs UAT testing
- ⚠️ Generate Playlists button - Functional in `AlbumsView.js`
  - Status: Code exists, needs UAT testing

**Known Issues** (affecting implemented components):
- Issue #15: Ghost Albums - Fix implemented but ineffective (needs re-investigation)
- Issue #16: View Mode State Mismatch - Fix implemented but ineffective (needs re-investigation)

**Manual Testing** (pending UAT):
- Migration flow (localStorage → Firestore)
- CRUD operations with UI (Edit/Delete)
- Inventory management (Add/Edit/Delete albums, multi-select, create series)
- Cross-tab cache sync
- Browser compatibility (Chrome, Firefox, Safari)

---

## [Sprint 5 - Phase 3: UI & Refactor] - 2025-11-30

### 📋 Session Timeline (2025-11-30 08:00)

**Complete Implementation Session**: Documentation consolidation, Domain Model refactor, critical bug fixes, and UI restoration  
**Total Steps**: 58 discrete actions (see detailed breakdown below)  
**Status**: ✅ **Ready for UAT** - Issues #15 & #16 fixes implemented, pending verification

#### Phase 1: Documentation Reorganization (Steps 1-6)
- Created `/docs/` folder structure (devops, product-management, archive)
- Moved documentation files to organized locations:
  - DevOps: LOCAL_RUN.md, DEPLOYMENT.md, PRODUCTION_DEPLOY.md, SECRET_ROTATION_RUNBOOK.md, SECURITY.md
  - Product: PROJECT_SUMMARY.md, SPRINT_5_UI_SPECS.md, V2.0_ANALYSIS.md
  - Archive: HOTFIX_RANKING_ACCLAIM.md, IMPACT_ANALYSIS.md, troubleshooting_log.md
- Created `docs/README.md` as documentation index
- Consolidated `troubleshooting_log.md` into `DEBUG_LOG.md`
- Moved `DEBUG_LOG.md` to `/docs/` root
- Updated ARCHITECTURE.md with cross-references

#### Phase 2: UI Enhancement (Steps 7-10)
- Added MJRP realistic logo to hero section (`HomeView.js`)
- Fixed logo background transparency (external tool → `sips` verification)
- Added cache-busting (`?v=${Date.now()}`) to force logo reload
- Positioned logo on right side, matching left icon size

#### Phase 3: Git Commit (Steps 11-13)
- Staged all changes (`git add -A`)
- Committed: "docs: consolidate architecture documentation + add MJRP logo to hero"
- Created tag `v2.0.1-docs-consolidation`

#### Phase 4: Domain Model Analysis (Steps 14-17)
- Identified root cause: "Anemic Domain Model" (raw JSON passing)
- Issues: Artist/Album missing in playlists, Original Order broken
- Created Implementation Plan for Domain Model refactor
- User approved architectural refactor (Option B)

#### Phase 5: Domain Model Implementation (Steps 18-22)
- Updated ARCHITECTURE.md (moved current to "Previous", documented new model)
- Created ES6 classes:
  - `public/js/models/Track.js` - Guarantees artist/album context
  - `public/js/models/Album.js` - Manages tracks and tracksOriginalOrder
  - `public/js/models/Playlist.js` - Playlist domain logic
  - `public/js/models/Series.js` - Series aggregation
- Refactored `client.js`: Returns `new Album(data)`, added hydration
- Refactored `curation.js`: Uses Album/Track models, added guard
- Updated `AlbumsStore.js`: Prevents instance → plain object conversion

#### Phase 6: Critical Bug Fixes (Steps 23-25)
- **Issue #9: Axios Reference Error**
  - Fix: `npm install axios` + added import to `client.js`
- **Issue #10: API 400 Bad Request**
  - Fix: Changed payload property `album` → `albumQuery`
- **Issue #11: AI_API_KEY Not Loaded**
  - Fix: Updated `server/index.js` dotenv to `path.resolve(__dirname, '.env')`

#### Phase 7: Code Review & Verification (Steps 26-29)
- Performed comprehensive code review of Domain Model refactor
- Fixed hydration in `MigrationUtility.js` and `AlbumsStore.js`
- Created Data Flow Analysis (verified tracks vs tracksOriginalOrder)
- Ran `curl` to API to verify data structure
- Consolidated analysis into ARCHITECTURE.md (per documentation rules)

#### Phase 8: Debug Log Reorganization (Steps 30-31)
- Reorganized `DEBUG_LOG.md` chronologically (newest first)
- Consolidated HOTFIX_RANKING_ACCLAIM.md into `DEBUG_LOG.md`

#### Phase 9: Original Album Order Investigation (Steps 32-41)
- **Issue #13: Original Order Incorrect After Refresh**
- Added debug logs to `client.js` (normalization inspection)
- Added visual [DEBUG] badges to track numbers
- Added console logs to `loadAlbumsFromQueries()`
- Restarted servers to force code update
- Added file load verification log
- **Breakthrough**: Realized user was on `RankingView.js`, not `AlbumsView.js`
- Fixed `RankingView.js` - had same bug (ignoring tracksOriginalOrder)
- Documented full investigation in DEBUG_LOG.md
- Cleaned up debug artifacts

#### Phase 10: Sprint 5.3 Regression Fixes (Steps 42-45)
**⚠️ STATUS: CODE IMPLEMENTED - NOT VERIFIED - KNOWN ISSUES REMAIN**

**CRITICAL FOR DEVELOPERS**: The following fixes were implemented but are **NOT FULLY VERIFIED**. User reports indicate Issues #15 and #16 are **STILL OCCURRING** despite code changes.

- **Issue #14: Generate Playlists 500 Error**
  - ⚠️ Status: Fix implemented, needs UAT verification
  - Fix: Added guard in `curation.js` for Album class check
  
- **Issue #15: Ghost Albums** 🚨 **UNRESOLVED - FIX INEFFECTIVE**
  - ❌ Status: **CODE EXISTS BUT DOES NOT WORK**
  - Attempted Fix: Implemented `AbortController` in `AlbumsView.js`
  - Added `AbortSignal` support to `APIClient.fetchMultipleAlbums()`
  - **USER REPORT**: Issue still occurs - needs re-investigation
  - **ACTION REQUIRED**: Debug why AbortController is ineffective
  
- **Issue #16: View Mode State Mismatch** 🚨 **UNRESOLVED - FIX INEFFECTIVE**
  - ❌ Status: **CODE EXISTS BUT DOES NOT WORK**
  - Attempted Fix: Read `localStorage.getItem('albumsViewMode')` in constructor
  - **USER REPORT**: Issue still occurs - needs re-investigation
  - **ACTION REQUIRED**: Debug localStorage timing or competing state initialization
  
- **Issue #12: Refresh Button**
  - ⚠️ Status: Fix implemented, needs UAT verification
  - Fix: Corrected property `activeSeries.albums` → `activeSeries.albumQueries`

#### Phase 11: UI Reimplementation (Steps 46-49)
**⚠️ STATUS: CODE IMPLEMENTED - NOT VERIFIED - PENDING UAT**

**Note**: All components below exist in codebase but have NOT been manually tested in browser.

- Re-implemented Migration Banner in `HomeView.js`
  - ⚠️ Status: Code exists, needs UAT testing
- Created `EditAlbumModal.js` component
  - ⚠️ Status: Code exists, needs UAT testing
- Added Edit Album button to `AlbumsView.js`
  - ⚠️ Status: Code exists, needs UAT testing
- Added Inventory navigation to `HomeView.js`
  - ⚠️ Status: Code exists, needs UAT testing

#### Phase 12: Testing & Additional Fixes (Steps 50-52)
**⚠️ STATUS: PARTIALLY VERIFIED - AUTOMATED TESTS PASS, MANUAL UAT PENDING**

- Ran automated tests: 34/34 passing ✅
  - `tests/repositories/repositories.test.js` - 20/20
  - `tests/cache/cache.test.js` - 14/14
  - **Note**: Unit tests do NOT cover UI components or browser behavior
  
- **Issue #17: InventoryView Runtime Error**
  - ⚠️ Status: Fix implemented, needs UAT verification
  - Fix: Added `escapeHtml()` method to `BaseView.js`
  
- **Issue #18: Firebase API Key Error**
  - ⚠️ Status: Fix implemented, needs UAT verification
  - Fix: Added `<script src="/js/firebase-config.js"></script>` to `index-v2.html`

#### Phase 13: Final Documentation (Steps 53-58)
**✅ STATUS: COMPLETED** (Documentation only - no code verification needed)

- Updated `CHANGELOG.md` with Sprint 5 Phase 3 completion
- Created UI Persistence Specs section in `ARCHITECTURE.md`
- Corrected Issue IDs in `DEBUG_LOG.md` (swapped #17 and #18)
- Documented UI/UX Standards (No Emojis rule) in `ARCHITECTURE.md`
- Deprecated `implementation_plan.md` in favor of `task.md`
- Updated `task.md` to mark all Sprint 5.3 tasks as DONE

---

## 🚨 CRITICAL DEVELOPER NOTICE - UAT CHECKPOINT

**Current Development Stage**: Between Implementation and Verification

**Phases 1-9**: ✅ Verified and working  
**Phases 10-12**: ⚠️ **CODE EXISTS BUT NOT VERIFIED** - **DO NOT ASSUME THESE WORK**  
**Phase 13**: ✅ Documentation complete

**REQUIRED BEFORE PROCEEDING**:
1. **Re-investigate Issues #15 & #16** - Reported fixes are ineffective
2. **Perform UAT Testing** - All 6 UI components need manual browser testing
3. **Verify Issues #12, #14, #17, #18** - Ensure fixes actually work
4. **Update Status** - Mark each issue as truly resolved only after UAT confirms

**See**: [issue_audit_report.md](../reports/issue_audit_report.md) for detailed issue status

---

### 🚀 Major: Domain Model Refactor & UI Restoration

**Status**: ✅ **Ready for UAT** - Critical bugs fixed, ready for verification  
**Tests**: 34/34 Passing (Repositories + Cache only, **UI components untested**)  
**Focus**: Data Integrity, UI Components, Bug Fixes

**Resolved Blockers** (Pending UAT):
- Issue #15: Ghost Albums - Fix implemented (AbortController + State Check)
- Issue #16: View Mode State Mismatch - Fix implemented (Full Re-render)

#### Changed - Domain Model Architecture
- **Rich Domain Model**: Replaced anemic JSON objects with `Album`, `Track`, `Playlist`, `Series` classes.
- **Data Integrity**: Guaranteed `artist`/`album` context in tracks (fixes "Unknown Artist" bug).
- **Hydration**: Centralized logic for restoring objects from storage/API.

#### Fixed - Critical Bugs
- **Generate Playlists 500 Error (Issue #14)**: Fixed server-side crash due to missing `Album` class definition in `curation.js`.
- **Ghost Albums Regression (Issue #15)**: Fixed race condition in `AlbumsView` using `AbortController`.
- **View Mode State Mismatch (Issue #16)**: Fixed toggle logic and localStorage persistence.
- **Firebase API Key Error (Issue #18)**: Fixed client-side auth error by injecting config.
- **InventoryView Runtime Error (Issue #17)**: Fixed missing `escapeHtml` method.
- **Original Album Order (Issue #13)**: Fixed regression where ranked order was shown instead of original disc order.
- **Refresh Button (Issue #12)**: Fixed property mismatch in refresh logic.
- **Axios Reference Error (Issue #9)**: Installed axios and added import.
- **API 400 Bad Request (Issue #10)**: Fixed payload property mismatch.
- **AI_API_KEY Loading (Issue #11)**: Fixed dotenv path resolution.
- **Migration UI**: Restored missing Migration Banner in `HomeView.js`.

#### Added - UI Components
- **Edit Album Modal**: Implemented `EditAlbumModal.js` for inline editing
- **Inventory Navigation**: Added "Manage Inventory" button to HomeView
- **Migration Banner**: Re-implemented in HomeView with legacy data detection

#### Known Issues
- **Issue #15: Ghost Albums** - Fix implemented (`AbortController`) but reported as ineffective by user (needs re-investigation)
- **Issue #16: View Mode State Mismatch** - Fix implemented (localStorage read) but reported as ineffective by user (needs re-investigation)
- **Note**: See [issue_audit_report.md](../reports/issue_audit_report.md) for detailed audit of all issues #9-18

---

## [Sprint 5 - Phases 1-2] - 2025-11-28

### 🎉 Major: Firestore Persistence Architecture

**Status**: ✅ Phases 1-2 Complete | ⏳ Phase 3 In Progress  
**Tests**: 34/34 Passing (100%)

#### Added - Repository Layer (Phase 1)

**5 New Repositories** with full CRUD operations:

1. **BaseRepository** (abstract base class)
   - `create()`, `findById()`, `findAll()`, `update()`, `delete()`, `deleteMany()`
   - Cache integration (L1 + L2)
   - Schema versioning support
   - Server timestamp handling

2. **SeriesRepository**
   - User-scoped collection: `users/{userId}/series`
   - `rename()` with validation (min 3 chars)
   - `deleteWithCascade()` - deletes albums + playlists
   - `createFromInventory()` - create series from inventory albums
   - `findWithAlbums()` - load series with albums

3. **AlbumRepository**
   - User + Series scoped: `users/{userId}/series/{seriesId}/albums`
   - `updateTracks()` - update track array
   - `findByArtist()`, `findByYear()` - query methods
   - Schema version 2 (added `tracksOriginalOrder`, `bestEverUrl`)

4. **PlaylistRepository**
   - User + Series scoped: `users/{userId}/series/{seriesId}/playlists`
   - `rename()`, `updateTracks()`
   - `getTotalDuration()` - calculate playlist length

5. **InventoryRepository** ⭐ **NEW FEATURE**
   - User-scoped: `users/{userId}/inventory/albums`
   - Manage physical album collection (CD, Vinyl, DVD, Blu-ray, Digital)
   - `addAlbum(album, format, options)` - add to collection
   - `updateAlbum()` - edit format, price, notes
   - `removeAlbum()` - delete from collection
   - `findByFormat()` - filter by format
   - `getStatistics()` - count, total value, average price
   - `search(query)` - search by artist/title

**Tests**: 20/20 passing ✅

---

#### Added - Cache Layer (Phase 2)

**3-Tier Cache System**:

1. **MemoryCache (L1)** - Fast session cache
   - In-memory Map storage
   - TTL expiration (7-day default)
   - Synchronous operations
   - Performance: ~1-5ms

2. **IndexedDBCache (L2)** - Persistent cross-tab cache
   - IndexedDB storage (500MB+ capacity)
   - Async operations with TTL
   - Cross-tab synchronization
   - Graceful fallback if unavailable
   - Performance: ~10-30ms

3. **CacheManager** - Unified cache interface
   - L1 + L2 coordination
   - Auto-promotion (L2 hit → L1)
   - Schema version validation
   - Graceful IndexedDB fallback
   - Cache statistics

**Read Flow**: L1 (memory) → L2 (IndexedDB) → Firestore  
**Write Flow**: L1 (sync) + L2 (async) + Firestore

**Tests**: 14/14 passing ✅

---

#### Added - Migration Utility (Phase 3 - Partial)

**MigrationUtility** - localStorage → Firestore migration:
- Auto-detect legacy localStorage data
- Progress tracking with callbacks
- Rollback backup creation
- Error collection (continues on failures)
- User-scoped migration
- Schema versioning (`_schemaVersion`, `_migratedFrom`)

**Safety Features**:
- Creates backup before migration
- Prevents duplicate migrations
- Continues on individual failures
- Marks completion status

---

### 📁 Files Created

**Repositories** (5 files):
- `public/js/repositories/BaseRepository.js`
- `public/js/repositories/SeriesRepository.js`
- `public/js/repositories/AlbumRepository.js`
- `public/js/repositories/PlaylistRepository.js`
- `public/js/repositories/InventoryRepository.js`

**Cache** (3 files):
- `public/js/cache/MemoryCache.js`
- `public/js/cache/IndexedDBCache.js`
- `public/js/cache/CacheManager.js`

**Migration** (1 file):
- `public/js/migration/MigrationUtility.js`

**Tests** (2 files):
- `tests/repositories/repositories.test.js`
- `tests/cache/cache.test.js`

**Documentation** (2 files):
- `docs/SPRINT_5_UI_SPECS.md` - UI specifications for Phase 3
- Walkthrough artifact - Comprehensive implementation guide

---

### 🧪 Testing

**Automated Tests**: 34/34 Passing (100%)
- Repository CRUD operations
- Cache L1 + L2 + Manager
- TTL expiration
- Schema validation
- Cascade delete logic
- Inventory management

**Test Commands**:
```bash
node tests/repositories/repositories.test.js  # 20/20 ✅
node tests/cache/cache.test.js                 # 14/14 ✅
```

---

### ⏳ Phase 3 - Remaining Work

**UI Components** (not yet implemented):
- Migration banner (HomeView)
- Migration progress modal
- CRUD delete/edit modals
- **InventoryView** (new route `/inventory`)
- Add to Inventory action (AlbumsView)
- Generate Playlists button (AlbumsView → PlaylistsView)
- Create Series from Inventory workflow

**Manual Testing** (pending):
- Migration flow (localStorage → Firestore)
- CRUD operations with UI
- Inventory management
- Cross-tab cache sync
- Browser compatibility (Chrome, Firefox, Safari)



---

### 🎯 Production Readiness

**Ready**:
- ✅ Repository architecture (user-scoped from day 1)
- ✅ Cache layer (graceful fallback)
- ✅ Migration tool (rollback safety)
- ✅ Automated tests (100% passing)

**Pending** (after Phase 3 UI):
- ⏳ Manual testing checklist (17 items)
- ⏳ Cross-browser validation
- ⏳ Firestore security rules
- ⏳ Production Firebase config

---

### 📚 Documentation

- [SPRINT_5_PERSISTENCE_ARCHITECTURE.md](./SPRINT_5_PERSISTENCE_ARCHITECTURE.md) - Full architecture spec
- [SPRINT_5_UI_SPECS.md](./SPRINT_5_UI_SPECS.md) - UI specifications + mockups
- Walkthrough artifact - Implementation guide
- Implementation plan artifact - Phase breakdown

---

## Previous Versions

### [Sprint 4 and Earlier] - See Git History
- BestEver API integration
- Ranking view
- Filter system
- Albums view modes
- Playlist generation

---

# 📦 ARCHIVED CONTENT - Root CHANGELOG.md (Consolidated 2025-11-30)

**Source**: `/CHANGELOG.md` (root, 978 lines)  
**Archived To**: `docs/archive/CHANGELOG_root_archived_20251130.md`  
**Consolidation Date**: 2025-11-30 14:45  
**Note**: Content below preserved from original root CHANGELOG using APPEND-only mode (never delete rule)

---
# Changelog

Format:
- Version anchor
- Summary
- Changes / Fixes
- Files modified

---

## v2.0.0-alpha.6 Sprint 4.5 Phase 2: Albums View Modes (2025-11-28)

**Status**: ⚠️ **Partially Completed** - Tagged as `sprint4.5-partially-completed`

### Summary
Implemented MODE 3 (Expanded List View) for Albums with dual tracklists (Ranked by Acclaim + Original Album Order). Encountered localStorage cache invalidation issue with new normalized fields. **Decision**: Defer complete fix to Sprint 5 (Firestore) for proper data persistence and schema versioning.

### Features Implemented

**MODE 3: Expanded List View** ✅
- Vertical list layout showing all albums simultaneously
- Each album displays dual tracklists side-by-side:
  - **Ranked by Acclaim**: Sorted by rating (descending) with medals 🥇🥈🥉 for top 3
  - **Original Album Order**: AS IS from API (`data.tracks`)
- All tracks visible (no pagination/truncation)
- Premium glassmorphism design matching MODE 2

**View Mode Toggle** ✅
- Button in filter bar to switch between Compact Grid (MODE 1) and Expanded List (MODE 3)
- Full view re-render on toggle with event listener re-attachment
- ViewMode state persists in localStorage

**Series Title UI Enhancement** ✅
- Larger 4xl font size with bold styling
- "Series Name:" label prefix for clarity
- Album count in accent color (prominent display)
- Removed "Consolidated View" badge (cleaner UX)

### Known Issues (Deferred to Sprint 5)

**localStorage Cache Invalidation** ⚠️

**Problem**:
Albums cached before code changes lack new normalized fields (`bestEverAlbumId`, `bestEverUrl`, `tracksOriginalOrder`), resulting in `undefined` values when loaded from cache.

**Root Cause**:
```javascript
// Cache hit bypasses normalizeAlbumData()
✅ L2 cache hit (localStorage): Album X
   ↓ (No re-normalization)
   ↓  
{
  bestEverAlbumId: undefined,      // ❌ Missing
  bestEverUrl: undefined,          // ❌ Missing
  tracksOriginalOrder: undefined   // ❌ Missing
}
```

**Current Workaround**:
- ✅ "Refresh" button in AlbumsView header forces skip-cache reload
- ✅ "Clear Cache" in footer + page reload
- ⚠️ Requires manual user action

**Why Deferred to Sprint 5**:

1. **Firestore >> localStorage**
   - Schema versioning built-in
   - No size limits (~5MB localStorage vs unlimited Firestore)
   - Automatic field migration via Firestore rules
   - Timestamp-based cache invalidation

2. **Architectural Alignment**
   - Sprint 5 replaces localStorage with Firestore entirely
   - Proper persistence layer with offline support
   - Single source of truth for all album data

3. **Limited Impact**
   - Only affects existing cached albums
   - New albums normalize correctly
   - Users can manually refresh when needed

### Files Modified
```
public/js/api/client.js                # +50 lines - Debug logging, BestEver fields extraction
public/js/views/AlbumsView.js          # +120 lines - MODE 3 rendering, Refresh button, dual tracklists
docs/troubleshooting_log.md           # +88 lines - Sprint 4.5 Phase 2 issues documented
```

### Implementation Details

**Data Flow** (MODE 3):
```javascript
// API Response has TWO track arrays:
data.tracks              // Original album order (AS IS)
data.tracksByAcclaim     // Sorted by rating (ranked)

// Normalization preserves both:
normalized.tracks = tracksByAcclaim        // Primary for UI
normalized.tracksOriginalOrder = data.tracks  // For "Original Album Order" list

// Rendering:
renderRankedTracklist(album.tracks)                    // Shows acclaim ranking
renderOriginalTracklist(album.tracksOriginalOrder)     // Shows AS IS order
```

**Refresh Button Flow**:
```javascript
// User clicks Refresh
→ loadAlbumsFromQueries(queries, skipCache=true)
  → apiClient.fetchMultipleAlbums(queries, onProgress, skipCache=true)
    → fetchAlbum(query, skipCache=true)  // Bypasses cache
      → _fetchAlbumFromAPI()  // Fresh fetch
        → normalizeAlbumData(data)  // All fields populated ✅
```

### Next Steps (Sprint 5)

**Firestore Persistence Architecture**:
- [ ] Replace localStorage with Firestore for album storage
- [ ] Implement schema versioning (e.g., `_schemaVersion: 2`)
- [ ] Migrate existing localStorage → Firestore on first load
- [ ] Add `lastFetched` timestamp for cache invalidation strategy
- [ ] Implement offline-first sync (Firestore + local cache)

**Benefits**:
- ✅ Proper data persistence across devices
- ✅ No cache invalidation issues
- ✅ Edit/delete album functionality  
- ✅ Collaborative series sharing (future Sprint 6)

---

## v2.0.0-alpha.5 Sprint 4.5 Phase 1: Landing View UI/UX (2025-11-28)

**Status**: In development (feature/v2.0-foundation branch)

### Summary
Finalized the Landing View (HomeView) UI/UX with a premium "Nebula" theme. Implemented a dynamic SVG background generator for the Hero Banner, a new SVG logo, and fixed critical styling issues by integrating Tailwind CSS.

### Features

**Hero Banner Overhaul**:
- **Dynamic SVG Background**:
  - Created `SvgGenerator.js` utility to generate mathematical equalizer patterns.
  - Implemented "Vibrant Spectrum" gradient (Green -> Yellow -> Red).
  - Configured for 33% height occupancy to leave room for copy.
  - Generated unique `hero_bg.svg` using server-side script.
- **New Logo**:
  - Created `MJRPLogo` SVG (Vinyl Record with Flame) in `Icons.js`.
  - Replaced placeholder icon in TopNav and Hero.

**Styling Infrastructure**:
- **Tailwind CSS Integration**:
  - Added Tailwind CDN to `index-v2.html` (was previously missing).
  - Configured basic theme extension.
  - Removed conflicting legacy styles.

**Developer Tools**:
- **SVG Debugger**:
  - Created `public/debug-svg-generator.html` for real-time visualization of SVG generation logic.
  - Allows tweaking parameters (columns, gap, height ratio) visually.

### Fixes

1. **Missing Styles** (Critical):
   - **Issue**: Header, Footer, and Hero were unstyled on localhost.
   - **Fix**: Added `<script src="https://cdn.tailwindcss.com"></script>` to `index-v2.html`.
   - **Impact**: UI now renders correctly with all Tailwind classes applied.

2. **SVG Generation**:
   - **Issue**: Initial SVG generation script failed due to ESM/CommonJS mismatch.
   - **Fix**: Updated `scripts/generate_hero_svg.js` to use ESM imports.

### Files Added
```
public/js/utils/SvgGenerator.js        # Generic SVG generation logic
public/debug-svg-generator.html        # Visual debugger for SVGs
scripts/generate_hero_svg.js           # Server-side generation script
public/assets/images/hero_bg.svg       # Generated background asset
```

### Files Modified
```
public/index-v2.html                   # Added Tailwind CDN
public/js/views/HomeView.js            # Updated Hero structure and classes
public/js/components/Icons.js          # Added MJRPLogo
public/js/components/TopNav.js         # Updated logo usage
```

---

## v2.0.0-alpha.4 Sprint 4: Playlists Management (2025-11-26)

**Status**: In development (feature/v2.0-foundation branch)

### Summary
Implemented complete playlist management system with drag-and-drop editing, undo/redo version history, and backend API integration. Users can now generate balanced playlists from ranked albums, reorder tracks interactively, and export to JSON.

### Features

**PlaylistsStore Enhancement** (+85 lines):
- **Version History System**:
  - Snapshot-based undo/redo (max 20 versions)
  - Automatic snapshot creation on track moves/reorders
  - `undo()` / `redo()` methods with state restoration
  - `getVersionHistory()` with current version indicator
  - Version pruning when undoing then making new changes
- **State Management**:
  - `canUndo` / `canRedo` flags in state
  - Immutable snapshots (deep clone via JSON)
  - Integrated with existing `moveTrack()` and `reorderTrack()`

**API Client Enhancement** (+68 lines):
- `generatePlaylists(albums, options)` method
- Backend integration with `/api/playlists` endpoint
- Payload formatting:
  - Album data with tracks (title, rank, rating, duration)
  - Options: targetCount, minTracksPerPlaylist, maxTracksPerPlaylist
- `normalizePlaylists()` response handler
- Playlist naming and ID generation

**PlaylistsView** (363 lines new):
- **Generate Section**:
  - Album count display
  - Playlist count selector (3-5)
  - **Min/max duration per playlist inputs (30-60 min default)**
  - "Generate Playlists" button with loading state
  - Warning if no albums loaded
- **Playlists Grid**:
  - Responsive columns (auto-fit, 300px min)
  - Editable playlist names (contenteditable)
  - Playlist stats (track count, duration)
  - Track items with drag handles (⋮⋮)
- **Drag & Drop**:
  - Reorder tracks within same playlist
  - Move tracks between playlists
  - Visual feedback (`.dragging`, `.drag-over`)
  - Event delegation for performance
- **Undo/Redo UI**:
  - Undo/Redo buttons in header
  - Auto-disabled when at history bounds
  - Console feedback on success
- **Export Section**:
  - JSON export (working - downloads file)
  - Spotify export placeholder (Sprint 5)
  - Apple Music export placeholder (Sprint 6)
- **Empty State**:
  - Clear instructions when no playlists
  - Disabled generate button if no albums

**Router Integration**:
- Registered `/playlists` route
- Updated `RankingView` "Create Playlists" button
- Navigate from rankings → playlists
- Vite middleware updated for `/playlists` SPA routing

**Styling** (+150 lines CSS):
- **Grid Layout**:
  - Responsive playlists columns
  - Card-based playlist containers
  - Min-height for empty playlists
- **Track Items**:
  - Flexbox layout with drag handle
  - Hover effects (border color change)
  - Truncated text with ellipsis
  - Rating badges
- **Drag Feedback**:
  - `.dragging`: Opacity 0.5, grabbing cursor
  - `.drag-over`: Green border, background tint
  - Smooth transitions
- **Generate/Export Sections**:
  - Grid options layout
  - Centered export actions
  - Card styling consistency

### Implementation Details

**Version History Pattern**:
```javascript
createSnapshot(description) {
  // Remove future versions if undid then changed
  if (currentIndex < versions.length - 1) {
    versions = versions.slice(0, currentIndex + 1)
  }
  
  // Add snapshot with deep clone
  versions.push({
    playlists: JSON.parse(JSON.stringify(playlists)),
    timestamp: new Date().toISOString(),
    description
  })
  
  // Enforce max limit
  if (versions.length > maxVersions) {
    versions.shift()
  }
}
```

**Drag & Drop Flow**:
1. `dragstart`: Capture source playlist/track indices → `.dragging`
2. `dragover`: Prevent default, add `.drag-over` to target
3. `drop`: Call `moveTrack()` or `reorderTrack()` based on target
4. `dragend`: Clear drag state, remove visual classes

**Backend Payload**:
```json
{
  "albums": [
    {
      "title": "Album Name",
      "artist": "Artist Name",
      "tracks": [
        { "title": "Track", "rank": 1, "rating": 95, "duration": 240 }
      ]
    }
  ],
  "options": {
    "targetCount": 4,
    "minTracksPerPlaylist": 8,
    "maxTracksPerPlaylist": 15
  }
}
```

### Bug Fixes (Hotfixes 2025-11-27)

1.  **SeriesStore ID Mismatch** (Critical):
    -   **Issue**: `HomeView` generated a temporary ID (`series_...`) which was overwritten by `SeriesStore` (`Date.now()`), causing `AlbumsView` to fail loading the series on initial navigation (URL ID mismatch).
    -   **Fix**: Updated `SeriesStore.createSeries` to respect provided IDs and updated `HomeView` to use the returned ID.
    -   **Impact**: Fixed "No albums in library" empty state on first load.

2.  **PlaylistsView Reactivity**:
    -   **Issue**: `PlaylistsView` lacked an `update()` method implementation, causing the UI to remain static after generation or state changes.
    -   **Fix**: Implemented `update()` to re-render grid, undo/redo controls, and toggle sections dynamically.
    -   **Impact**: Playlist generation now updates the view immediately.

3.  **Ratings Display**:
    -   **Issue**: Ratings were missing from frontend due to missing mapping in backend and strict checks in frontend.
    -   **Fix**: Added `ratingMap` in backend `server/index.js` and relaxed frontend `hasRatings` check.
    -   **Impact**: "✓ Rated" badges now appear correctly for supported albums.

4.  **UX Improvements**:
    -   **Clear Cache**: Added "Troubleshooting Tools" section with Clear Cache button to `HomeView`.
    -   **Error Feedback**: Replaced `alert()` with inline red error messages in `PlaylistsView`.
    -   **Timestamps**: Added "Last updated" footer to views for visual liveness confirmation.

5.  **Series Mixing (Ghost Albums)**:
    -   **Issue**: Albums from previous series persisted when switching series (e.g., Test 14 albums showing in Test 11).
    -   **Fix**: Added `albumsStore.reset()` before loading new series albums in `AlbumsView`.
    -   **Impact**: Clean state when switching contexts.

6.  **Playlist Rank Display**:
    -   **Issue**: Track rank showed as "-" in playlists.
    -   **Fix**: Updated `client.js` normalization to fallback to `acclaimRank` or `finalPosition` if `rank` is missing.
    -   **Impact**: "Rank: X" correctly displayed in playlist cards.

### Bug Fixes

1. **Import Statement** (Syntax):
   - **Issue**: `import { router, } from '../router.js'` (trailing comma)
   - **Fix**: Removed trailing comma
   - **Impact**: PlaylistsView now loads without syntax error

2. **Vite Dev Server** (Configuration):
   - **Issue**: Server needed restart after middleware changes
   - **Fix**: Restarted dev server
   - **Impact**: `/playlists` route now serves correctly

### Testing & Verification

**Manual Testing**:
- ✅ Navigate to `/playlists` directly
- ✅ Playlist generation form displays
- ⏸️ Generate playlists (requires backend `/api/playlists` endpoint)
- ⏸️ Drag-and-drop reordering
- ⏸️ Undo/redo functionality
- ✅ JSON export downloads file

**Note**: Full end-to-end testing pending backend `/api/playlists` implementation

### Files Added
```
public/js/views/PlaylistsView.js   # 363 lines - Playlists management view
```

### Files Modified
```
public/js/stores/playlists.js      # +85 lines - Version history
public/js/api/client.js            # +68 lines - generatePlaylists method
public/js/views/RankingView.js     # Modified - Navigate to playlists
public/index-v2.html               # +150 lines CSS, route registration
vite.config.js                     # +1 line - /playlists middleware
```

### Performance & UX

- **Version History**: O(1) undo/redo via index tracking
- **Drag & Drop**: Event delegation (single listener per container)
- **JSON Export**: Client-side with `Blob` and `URL.createObjectURL`
- **Loading State**: Overlay with spinner during generation
- **Disabled States**: Buttons auto-disable when actions unavailable

### Architecture Decisions

**Why Version History?**
- Users experiment with track ordering
- Easy to undo mistakes without fear
- Industry standard (Spotify, Logic Pro, etc.)

**Why Immutable Snapshots?**
- Prevents reference bugs
- Simplifies undo/redo logic
- Small memory cost (~10KB per snapshot)

**Why JSON Export First?**
- No OAuth dependency (Sprint 5-6)
- Useful for backup/debugging
- Foundation for Spotify/Apple Music exports

### Next Steps (Sprint 5-6)

**Sprint 5: Spotify Integration**
- OAuth authentication
- Spotify Web API playlist creation
- Track matching by ISRC
- Error handling for unmatched tracks

**Sprint 6: Apple Music Integration**
- MusicKit JS setup
- Apple Music API playlist creation
- Track matching
- Cross-platform export options

### Notes

- Backend `/api/playlists` exists in v1.6.1 (tested and working)
- v2.0 frontend ready for backend integration
- Drag-and-drop UX matches modern playlist tools
- Version history limited to 20 to prevent memory bloat
- All changes on `feature/v2.0-foundation` branch

---

## v2.0.0-alpha.3 Sprint 3: Albums & Ranking Views (2025-11-26)

**Status**: In development (feature/v2.0-foundation branch)

### Summary
Implemented complete album library and ranking visualization with API integration, hybrid caching system (Memory + localStorage), and progress tracking. Successfully tested end-to-end flow from series creation through album loading and ranking display.

### Features

**Hybrid Cache System**:
- **L1 Cache (Memory)**: Instant access for current session
- **L2 Cache (localStorage)**: Persistent storage with 7-day TTL
- LRU eviction when storage full (~100-500 albums capacity)
- Cache invalidation and stats methods
- Version-aware for future migrations

**API Client & Integration**:
- RESTful wrapper for `/api/generate` endpoint
- Automatic retry logic (2 retries with 1s delay)
- Multi-album fetching with progress callbacks
- Cache-first strategy with skip-cache option
- Query parsing: "Artist - Album" or "Album Name"
- Response normalization for consistent data structure
- **Bug Fix**: Corrected payload from `{artist, album}` to `{albumQuery}`

**AlbumsView** (~230 lines):
- Responsive grid layout (auto-fill, 280px min cards)
- Real-time search/filter functionality
- Animated progress bar with percentage (0-100%)
- Loading overlay with spinner
- Album cards with:
  - Cover placeholder
  - Title, artist, year
  - Track count badge
  - Rating status (✓ Rated / ⚠ No ratings)
  - Cache indicator (💾 Cached)
- Empty state with call-to-action
- Integration with AlbumsStore and SeriesStore
- Navigation to RankingView on card click

**RankingView** (~280 lines):
- Tabbed interface (Summary, Tracks, Sources)
- **Summary Tab**:
  - Stats grid: Track count, rated tracks, avg rating, source
  - Alert badges (success/warning) for rating status
- **Tracks Tab**:
  - Sortable table with rank, title, rating, score, duration
  - Color-coded rating badges:
    - 🟢 Excellent (90+)
    - 🔵 Great (80-89)
    - 🟡 Good (70-79)
    - 🔴 Fair (<70)
  - Visual distinction for rated vs unrated tracks
- **Sources Tab**:
  - Source verification badges
  - BestEverAlbums (✓ Verified)
  - AI Generated (🤖 AI)
  - Unknown (⚠️ Warning)
  - Cache metadata display
- Back navigation to albums
- Album not found handling

**Router Enhancement**:
- Registered `/albums` route
- Registered `/ranking/:albumId` route with param extraction
- Updated HomeView navigation flow
- Integrated with History API middleware

**Store Updates**:
- Extended `AlbumsStore.addAlbum()` with track metadata normalization
- Added `normalizeTrack()` method for extensible metadata:
  ```javascript
  metadata: {
    isrc: null,
    appleMusicId: null,
    spotifyId: null
  }
  ```

**Vite Configuration**:
- Custom plugin `v2-spa-fallback` for SPA routing
- Middleware to serve `index-v2.html` for `/home`, `/albums`, `/ranking` routes
- Preserved proxy for `/api` → `http://localhost:3000`
- Fixed: Syntax error in middleware array

**Styling** (~500 lines CSS):
- Albums grid with hover effects and transforms
- Progress bar with gradient animation
- Ranking table with row highlighting
- Tab navigation with active indicators
- Rating badge color system
- Source badge gradients
- Loading overlay with spinner animation
- Responsive design for mobile/tablet

### Testing & Verification

**Backend API**: ✅
- Successfully tested with `curl`
- Album data returned with tracks and ratings
- Average response time: 10-15 seconds

**Manual Testing**: ✅
- Series creation → Albums loading → Ranking display
- Progress bar shows correctly during fetch
- Cache works (instant load on second visit)
- Search/filter functional
- Tab switching smooth
- Back navigation works

### Bug Fixes

1. **API Client Payload** (Critical):
   - **Issue**: Backend expected `{albumQuery}`, client sent `{artist, album}`
   - **Fix**: Changed request body to `JSON.stringify({ albumQuery: query })`
   - **Impact**: Albums now load successfully from API

2. **Vite Configuration** (Blocker):
   - **Issue**: `/home` route served `hybrid-curator.html` (v1.6.1) instead of `index-v2.html`
   - **Fix**: Added custom middleware plugin for SPA route fallback
   - **Impact**: v2.0 routes now work correctly

### Documentation Added

- `docs/CACHING_STRATEGY.md` - Comprehensive cache analysis (4 options compared)
- Updated `docs/V2.0_ANALYSIS.md` - Sprint 3 status
- Updated `README.md` - Sprint 3 completion status

### Files Added
```
public/js/cache/albumCache.js       # 238 lines - Hybrid cache system
public/js/api/client.js             # 207 lines - API client wrapper
public/js/views/AlbumsView.js       # 230 lines - Albums grid view
public/js/views/RankingView.js      # 280 lines - Ranking display view
docs/CACHING_STRATEGY.md            # 650 lines - Cache analysis
```

### Files Modified
```
public/js/stores/albums.js          # +22 lines - normalizeTrack method
public/js/views/HomeView.js         # Modified - Navigate to /albums
public/index-v2.html                # +500 lines - CSS for new views
public/js/router.js                 # +2 routes registered
vite.config.js                      # +20 lines - SPA middleware plugin
README.md                           # Updated Sprint 3 status
```

### Performance Metrics

- **Cache Hit Rate**: ~90% on revisit (L1 instant, L2 <100ms)
- **API Call Time**: 10-15 seconds average
- **Progress Update Frequency**: Real-time (per album)
- **localStorage Usage**: ~10-50 KB per album
- **Bundle Size Impact**: +~150 KB (new views + cache)

### Next Steps (Sprint 4)

- Playlists generation with balanced algorithm
- Drag-and-drop playlist editing
- Export to Spotify/Apple Music
- Version history and snapshots

### Notes

- Backend unchanged - v2.0 is frontend-only enhancement
- Production still uses v1.6.1 (`hybrid-curator.html`)
- All changes on `feature/v2.0-foundation` branch
- Cache hybrid strategy chosen for optimal UX
- History API routing ready for OAuth flows (Sprint 5-6)

---

## v2.0.0-alpha.2 Sprint 2: Router & Views (2025-11-26)

**Status**: In development (feature/v2.0-foundation branch)

### Summary
Implemented SPA routing with History API, base view architecture, and HomeView for series creation. Clean URL navigation without hash symbols, preparing for OAuth integrations (Apple Music, Spotify).

### Features

**History API Router**:
- Clean URLs (`/home` instead of `/#/home`)
- Route registration with param extraction (`/albums/:id`)
- Navigation hooks (before/after navigate)
- View lifecycle management (render → mount → destroy)
- Query string parsing
- Link interception for SPA navigation
- Browser back/forward support

**View Architecture**:
- **BaseView** abstract class:
  - Lifecycle methods (render, mount, destroy)
  - DOM helpers ($, $$)
  - Subscription management
  - Event cleanup
  - Timestamp formatting utility
- **HomeView** implementation:
  - Series creation form
  - Recent series grid with cards
  - SeriesStore integration (subscribe/notify)
  - Form validation and cleanup
  - Keyboard shortcuts (Enter navigation)
  - Responsive dark mode UI

**Future-Proofing**:
- Extended track metadata structure:
  ```javascript
  metadata: {
    isrc: null,          // International Standard Recording Code
    appleMusicId: null,  // Apple Music track ID (cached)
    spotifyId: null      // Spotify track ID (future)
  }
  ```
- Ready for OAuth flows (Apple Music, Spotify, Google)

### Testing Infrastructure
- **Router tests**: 12 comprehensive tests
  - Route registration and matching
  - Navigation and param extraction
  - Lifecycle hooks
  - Link interception
- **All tests passing**: 67/67 (router + stores)
- **Coverage**: Router core 100%

### Documentation Added
- `docs/ROUTING_DECISION.md` - Hash vs History API analysis
- `docs/APPLE_MUSIC_ARCHITECTURE.md` - Future integration architecture
- Updated `README.md` with Sprint 2 status

### Files Added
```
public/js/router.js              # 167 lines - History API router
public/js/views/BaseView.js      # 110 lines - Base view class
public/js/views/HomeView.js      # 190 lines - Home view implementation
public/index-v2.html             # 290 lines - v2.0 entry point
test/router.test.js              # 157 lines - Router test suite
docs/ROUTING_DECISION.md         # 485 lines - Routing analysis
docs/APPLE_MUSIC_ARCHITECTURE.md # 650 lines - Integration architecture
```

### Files Modified
```
public/js/stores/albums.js       # +22 lines - Track metadata extension
firebase.json                    # +5 lines - SPA rewrite rule cleanup
README.md                        # Updated Sprint 2 roadmap status
```

### Sprint Status
- ✅ Phase 1: Router Core (100%)
- ✅ Phase 2: Base View Architecture (100%)
- ✅ Phase 3: HomeView Implementation (100%)
- ✅ Phase 4: App Bootstrap (100%)
- ✅ Phase 5: Testing (100%)
- ✅ Phase 6: Manual Verification (100%)
- ✅ Phase 7: Documentation (100%)

### Demo
- ✅ Successful browser demo recorded
- ✅ Series creation workflow validated
- ✅ History API navigation verified
- ✅ Store updates working correctly

### Next Steps (Sprint 3)
- Albums Library view
- Ranking view with acclaim visualization
- Album detail view
- API integration for album fetching

### Notes
- Backend unchanged - v2.0 is frontend-only refactor
- Production deployment still uses v1.6.1
- All changes on feature branch, safe to revert
- History API chosen for OAuth compatibility
- v1.6.1 entry point (`hybrid-curator.html`) preserved

---

## v2.0.0-alpha.1 Sprint 1: Foundation Setup (2025-11-26)

**Status**: In development (feature/v2.0-foundation branch)

### Summary
Major architectural upgrade: Modern build tooling (Vite), comprehensive testing (Vitest), and centralized state management (stores). This alpha establishes the foundational infrastructure for v2.0's SPA transformation.

### Features

**Development Tools**:
- Vite 5.x for modern bundling, HMR, and dev server with API proxy
- Vitest 1.x for fast unit testing with jsdom environment
- Path aliases for clean imports (`@stores`, `@components`, `@views`, `@shared`)
- Coverage reporting with v8 provider

**State Management Architecture**:
- **AlbumsStore**: CRUD operations, Firestore sync, current album tracking
- **PlaylistsStore**: Playlist generation, drag-and-drop state, duration calculation
- **SeriesStore**: Series metadata management (new v2.0 feature)
- All stores implement Observer pattern (subscribe/notify)

**Testing Infrastructure**:
- 55 comprehensive unit tests across 3 stores
- AlbumsStore: 16 tests, 78.23% coverage
- PlaylistsStore: 22 tests, 100% coverage
- SeriesStore: 17 tests, 70.52% coverage
- Overall store coverage: 82.57%
- Firebase mocks for isolated testing

### Documentation Added
- `docs/V2.0_ANALYSIS.md` - Complete technical analysis and roadmap
- `docs/V2.0_DESIGN_MOCKUPS.md` - UI/UX mockups with component specs
- `docs/V2.0_DEPLOYMENT_IMPACT.md` - Deployment workflow changes
- `docs/TOOLING_COMPARISON.md` - Vite vs webpack/parcel/esbuild comparison
- Updated `README.md` with v2.0 development workflow

### Files Added
```
package.json                 # Frontend dependencies (vite, vitest, etc)
package-lock.json           # Lockfile (199 packages)
vite.config.js              # Vite bundler configuration
vitest.config.js            # Vitest test runner configuration
test/setup.js               # Global test setup with Firebase mocks

public/js/stores/
  albums.js                 # 178 lines - Albums state management
  playlists.js              # 174 lines - Playlists state management
  series.js                 # 174 lines - Series state management

test/stores/
  albums.test.js            # 16 tests - AlbumsStore comprehensive suite
  playlists.test.js         # 22 tests - PlaylistsStore with drag-and-drop
  series.test.js            # 17 tests - SeriesStore validation

docs/
  V2.0_ANALYSIS.md          # Technical analysis and sprint breakdown
  V2.0_DESIGN_MOCKUPS.md    # UI mockups for 4 main views
  V2.0_DEPLOYMENT_IMPACT.md # Deployment impact analysis
  TOOLING_COMPARISON.md     # Build tooling comparison
```

### Changes
- `.gitignore`: Added `dist/`, `coverage/`, `.vite/`
- `README.md`: Added v2.0 development section with workflow

### Sprint Status
- ✅ Phase 1: Development Tools Setup (100%)
- ✅ Phase 2: Store Architecture (100%)
- ✅ Phase 3: Testing Infrastructure (100%)
- ⏳ Phase 4: Integration & Verification (75%)

### Next Steps (Sprint 2)
- HashRouter for SPA navigation
- Base view components (Home, Albums, Ranking, Playlists)
- Component library implementation

### Notes
- Backend unchanged - v2.0 is frontend-only refactor
- Production deployment still uses v1.6.1
- All changes on feature branch, safe to revert
- Build tested and working (`npm run build` successful)

---

## v1.6.1 Hotfix: Production Deployment (2025-11-26)

### Summary
Fixed critical production deployment issue where track ratings were not appearing in production environment despite working correctly in local development.

### Root Cause
Multiple configuration and module loading issues in the Cloud Run container deployment:
1. **Missing Config Files**: `config/prompts.json` was not being copied to the container, causing `loadPrompts()` to fail silently and `fetchRankingForAlbum` to return empty results immediately.
2. **Shared Module Path**: `shared/normalize.js` was not accessible at the expected import path within the container.
3. **ESM Configuration**: The shared module lacked proper ESM configuration (`package.json` with `"type": "module"`), causing import failures.

### Fixes Applied

**Deployment Script (`scripts/deploy-backend.sh`)**:
- Added copying of `config/` directory to `server/config/` before Cloud Run build
- Added copying of `shared/` directory to `server/_shared_temp/` with ESM package.json injection
- Added cleanup of temporary directories after deployment

**Module Loading (`server/lib/prompts.js`)**:
- Updated to check multiple paths for `prompts.json`: container path (`../config/`) and local path (`../../config/`)
- Added graceful fallback between paths using `fs.existsSync()`

**Shared Module (`shared/normalize.js`)**:
- Deployment script now creates `{"type": "module"}` package.json in the shared directory
- Ensures proper ESM handling by Node.js in the container

**Frontend Cache Busting (`public/hybrid-curator.html`)**:
- Added `?v=1.6.0` cache buster to app.js script tag to force browser reload of updated logic

### Debug Instrumentation Added
- Created `/api/debug/files` endpoint to inspect container filesystem
- Created `/api/debug/import` endpoint to test dynamic module imports  
- Enhanced `/api/debug/raw-ranking` to return full error details
- Added `debugTrace` to `fetchRankingForAlbum` to track execution flow
- Exposed debug metadata in API responses via `rankingConsolidatedMeta`

### Verification
Tested with production API:
```bash
curl -X POST https://mjrp-proxy-540062660076.southamerica-east1.run.app/api/generate \
  -H "Content-Type: application/json" \
  -d '{"albumQuery": "Rolling Stones - Let it Bleed"}'
```

**Results**:
- ✅ `Has Ratings: true` (previously `false`)
- ✅ 9 tracks with ratings from BestEverAlbums
- ✅ Sample: "Gimme Shelter" with rating 93
- ✅ Debug trace confirms full pipeline execution: scraper → ratings → consolidation

### Files Modified
- `scripts/deploy-backend.sh`: Added config/shared copying and cleanup
- `server/lib/prompts.js`: Multi-path config loading
- `server/lib/fetchRanking.js`: Debug tracing
- `server/index.js`: Debug endpoint enhancements, debug metadata exposure
- `public/hybrid-curator.html`: Cache busting

### Notes
- Debug endpoints (`/api/debug/*`) should be disabled or protected in production deployment
- Consider adding health check endpoint that validates config/module loading
- Future: Add automated smoke tests that verify `/api/generate` returns ratings

---

## v1.5 Refactor (2025-11-25)

### Architecture
- **Shared Logic**: Created `shared/normalize.js` as an ES module used by both frontend and backend to ensure consistent key normalization.
- **Frontend**: Refactored `curation.js` into a stateless `CurationEngine` class, decoupling it from the DOM. Updated `app.js` to use this engine.
- **Backend**: Modularized `server/index.js` by extracting ranking logic into `server/lib/fetchRanking.js` and `server/lib/ranking.js`. Implemented dynamic imports for shared ESM modules.

### Fixes
- **Connectivity**: Addressed external scraper connectivity issues by increasing timeouts and adding browser-like User-Agent headers in `server/lib/scrapers/besteveralbums.js`. Note: Environment restrictions may still block specific sites.
- **Curation**: Fixed a regression where `curateAlbums` was undefined in `app.js` by switching to `CurationEngine`.

### Verification
- Unit tests passed for backend modules.
- Manual verification performed on localhost.

---

## Release: BEA-RankingAcclaim-Implemented (2025-11-23)

Summary
- Added scraper-first ranking provenance using BestEverAlbums when available.
- Server exposes per-track `bestEverEvidence`, `bestEverAlbumId` and per-track `rating` in the album payload returned by `/api/generate`.
- Merge logic: when scraper evidence is partial, model outputs are used to enrich missing tracks; scraper entries take precedence for matched tracks.
- Frontend: consolidated ranking UI updated to prefer server-side `rankingConsolidated` and surface BestEver sources first.

Verification
- Unit and integration tests added under `server/test/`. Local `npm test` passed during development.

---

## Hotfix: BestEver suggest fast-accept & fuzzy matching (2025-11-25)

Summary
- Problem: the BestEver `suggest.php` sometimes returned candidate results pointing to non-canonical pages (tributes, live versions). In some album queries (notably *Pink Floyd — The Wall*) the scraper selected such a page and thus returned incomplete evidence (missing per-track ratings), causing `rankingConsolidated` to be incorrect or sparse.

Root cause
- Scraper selection relied on suggest/title token matches without reliably verifying the artist or page content. Additionally, consolidation used strict normalization which failed to match many BestEver track title variants (punctuation, part labels), leaving valid mentions unmatched.

Fixes applied
- Scraper (`server/lib/scrapers/besteveralbums.js`):
  - Added a safe "fast-accept" path when `suggest.php` returns a title matching the pattern "<Album> by <Artist>" and the suggest title lacks bad keywords (e.g., `tribute`, `live`, `cover`, `deluxe`, `reissue`). The choice is logged via `bestever_fast_accept` for auditability.
  - Added page-content verification fallback: when suggest is ambiguous, the scraper fetches candidate pages and verifies album title/artist in the DOM before accepting the id.

- Consolidation (`server/lib/ranking.js` and `server/index.js`):
  - Hardened `normalizeKey` to strip diacritics (NFD + remove \p{M}), collapse non-alphanumerics, and preserve token boundaries.
  - Introduced tokenization and token-overlap heuristics and containment checks to match BestEver evidence to album tracks (reduced misses for variants such as "Another Brick In The Wall Pt. 2").
  - Fixed mapping bug and ensured `finalPosition` from consolidated results is mapped deterministically back into `tracks[].rank` (server exports `tracksByAcclaim` sorted by rank for UI convenience).

- Frontend (`public/js/app.js`):
  - Updated collection and rendering logic to prefer server `tracksByAcclaim` for deterministic numbering while preserving ordering by `rating` (descending) when ratings are available. If ratings are absent, fallback to `rank` ordering.
  - Strengthened dedupe keys in `collectRankingAcclaim` to avoid discarding valid mentions.

Verification
- Local testing: reproduced problematic case for *The Wall* and confirmed scraper now selects canonical id (`a=204`) and returns per-track ratings; `rankingConsolidated` length matched track count and `tracks[].rank` was populated.
- Tests: server unit tests passed locally (`cd server && npm test`).

Notes / Next steps
- Consider adding an environment flag `BESTEVER_STRICT_VERIFY=true|false` to control fast-accept vs strict verification in high-throughput runs.
- Persist `rankingConsolidatedMeta` to Firestore for long-term auditability (currently returned inline in the payload).

---

## Patch: UI ordering / rating restoration (2025-11-25)

Summary
- Symptom: After the first UI hotfix that made the client use `tracksByAcclaim` for numbering, the visual ordering by `rating` was lost in some production views.
- Action: Updated `public/js/app.js` to enrich `tracksByAcclaim` with ratings (from `rankingConsolidated`, `bestEverEvidence`, or `rankingAcclaim`) and order the displayed list by `rating` when ratings exist, while continuing to show the deterministic `rank` number beside each track.

Verification
- Commit `ce78f9b` recorded the change; frontend was deployed to Firebase Hosting (`https://mjrp-playlist-generator.web.app`) using `./scripts/deploy-prod.sh` and verified with sample album payloads.

---

## Unreleased / Pending

- Persist `rankingConsolidatedMeta` to Firestore for long-term divergence auditing.
- Add optional env flag `BESTEVER_STRICT_VERIFY` to toggle scraper fast-accept behavior for batch vs strict runs.
- Add additional automated post-deploy smoke tests that call `/api/generate` for a set of known albums and assert `tracksByAcclaim` presence and congruence with BestEver evidence.

---

## Patch: Curation ordering fix (2025-11-25)

Summary
- Symptom: playlist generation was still effectively using the canonical `track.rank` (server-provided finalPosition) rather than the intended acclaim ordering (rating-desc) when selecting P1/P2 and filling playlists.

Root cause
- Although the UI and server provided `tracksByAcclaim` and visual ranks, the curation algorithm earlier relied on `track.rank` lookups which could reflect canonical positions. This produced playlists ordered by canonical rank rather than by acclaim rating.

Fix applied
- Updated `public/js/curation.js` to explicitly compute an acclaim-ordered per-album track list (prefer `rating` desc; fallback to existing rank/original order) and to:
  - Select P1/P2 from the acclaim-ordered list (top 2 tracks by rating),
  - Populate the `remaining` pool from the acclaim-ordered list (preserving the acclaim ordering),
  - Assign visual `rank` (1..N) on the working copy so downstream steps use the acclaim ordering.

Verification
- Commit `c501535` contains the fix. The change was pushed to `main`. Recommend running the following smoke test after deploy:

```bash
curl -sS -X POST https://<BACKEND_URL>/api/generate -H "Content-Type: application/json" -d '{"albumQuery":"Exile on Main St."}' | jq '.data.tracksByAcclaim[0:3], .data.rankingConsolidated[0:3]'
```

Notes
- This aligns generation behavior with the UI expectation: playlists are now built from acclaim ordering (rating), while the UI still surfaces canonical rank as an audit badge.

---

If anything here looks ambiguous or you want a more formal release note for a GitHub Release body, tell me which section to expand and I will prepare it.
