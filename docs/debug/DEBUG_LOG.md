# Debug Log

**Last Updated**: 2026-01-05 14:00
**Workflow**: See `.agent/workflows/debug_protocol.md`
## Maintenance Notes

**How to Update This Document**:
1. Active issues → Current Debugging Session
2. Resolved/reverted issues → Move to Previous with timestamp
3. Keep Previous sections for history (don't delete)
4. Link to ARCHITECTURE.md for architectural decisions

**See**: `.agent/workflows/debug_issue.md` for systematic debugging protocol

---

## 📑 Issue Index

| # | Description | Status | Link |
|---|-------------|--------|------|
| #137 | **Electronic Music Studio Filter (Singles/EPs)** | ⚠️ IN PROGRESS | [Details](#issue-137-electronic-music-studio-filter) |
| #136 | **Discography Pagination 404 (Paul Oakenfold)** | ✅ RESOLVED | [Details](#issue-136-discography-pagination-404) |
| #135 | **Discography Title Truncation** | ✅ RESOLVED | [Details](#issue-135-discography-title-truncation) |
| #134 | **Home View Discography Layout** | ✅ RESOLVED | [Details](#issue-134-home-view-discography-layout) |
| #133 | **Undefined Track Numbers** | ✅ RESOLVED | [Details](#issue-133-undefined-track-numbers) |
| #132 | **Drag & Drop Logic Broken** | ✅ RESOLVED | [Details](#issue-132-drag--drop-logic-broken) |
| #131 | **"Delete All" Wipe Out Bug (Listener Leak)** | ✅ RESOLVED | [Details](#issue-131-delete-all-wipe-out-bug-listener-leak) |
| #130 | **Track Deletion & Grid Unification** | ✅ RESOLVED | [Details](#issue-130-track-deletion--grid-unification) |
| #129 | **BEA Badge Dual Display** | ✅ RESOLVED | [Details](#issue-129-bea-badge-dual-display) |
| #128 | **Bulk Paste Artwork Error** | ✅ RESOLVED | [Details](#issue-128-bulk-paste-artwork-error) |
| #123 | **Router Infinite Loop (PushState)** | ✅ RESOLVED | [Details](#issue-123-router-infinite-loop-pushstate) |
| #122 | **SeriesController Bind Error** | ✅ RESOLVED | [Details](#issue-122-seriescontroller-bind-error) |
| #127 | **Balanced Interleave Clustering (Artist Resolution)** | ✅ RESOLVED | [Details](#issue-127-balanced-interleave-clustering-artist-resolution) |
| #126 | **By Artist Grouping Failure** | ✅ RESOLVED | [Details](#issue-126-by-artist-grouping-failure) |
| #125 | **Top N Ingredients Visibility** | ✅ RESOLVED | [Details](#issue-125-top-n-ingredients-visibility) |
| #124 | **Flavor Card Styling Loss** | ✅ RESOLVED | [Details](#issue-124-flavor-card-styling-loss) |
| #121 | **SeriesView Component Initialization Failure** | ✅ RESOLVED | [Details](#issue-121-seriesview-component-initialization-failure) |
| #116 | **Apple Music Export 500 Error (Invalid Track IDs)** | ✅ RESOLVED | [Details](#issue-116-apple-music-export-500-error-invalid-track-ids) |
| #117 | **Playlist Index Duplication (1. 1. Title)** | ✅ RESOLVED | [Details](#issue-117-playlist-index-duplication-1-1-title) |
| #118 | **Batch Name Input Losing Focus** | ✅ RESOLVED | [Details](#issue-118-batch-name-input-losing-focus) |
| #119 | **Grouping Strategy Not Applied on Reconfigure** | ✅ RESOLVED | [Details](#issue-119-grouping-strategy-not-applied-on-reconfigure) |
| #108 | **App Crash (Missing EntityCard.js)** | ✅ RESOLVED | [Details](#issue-108-app-crash-missing-entitycardjs-regression) |
| #107 | **Legacy Component Removal (BaseCard/EntityCard)** | ✅ NOT RESOLVED | [Details](#issue-107-legacy-component-removal-basecardentitycard) |
| #106 | **SafeDOM Migration (Ranking Views)** | ✅ RESOLVED | [Details](#issue-106-safedom-migration-ranking-views) |
| #105 | **Inventory Grid Layout Overlap (Price/Cover)** | ✅ RESOLVED | [Details](#issue-105-inventory-grid-layout-overlap-pricecover) |
| #104 | **Inventory/Albums Click Interactions Broken** | ✅ RESOLVED | [Details](#issue-104-inventoryalbums-click-interactions-broken) |
| #115 | **Target Duration Visibility (Multiple Playlist)** | ✅ RESOLVED | [Details](#issue-115-target-duration-visibility-multiple-playlist) |
| #114 | **Crowd Favorites Label Not Updated** | ✅ RESOLVED | [Details](#issue-114-crowd-favorites-label-not-updated) |
| #113 | **Edit Modal Search/Storefront Refactoring** | ✅ RESOLVED | [Details](#issue-113-edit-modal-searchstorefront-refactoring) |
| #103 | **Raw HTML Rendering in Cards** | ✅ RESOLVED | [Details](#issue-103-raw-html-rendering-in-cards) |
| #102 | **App Crash - Missing Exports in AlbumsGridRenderer** | ✅ RESOLVED | [Details](#issue-102-app-crash---missing-exports-in-albumsgridrenderer) |
| #101 | **ConsolidatedRankingView Failures** | ✅ RESOLVED | [Details](#issue-101-consolidatedrankingview-failures-imports--store) |
| #100 | **BatchGroupCard HTMLDivElement Regression** | ✅ RESOLVED | [Details](#issue-100) |
| #99 | **Edit Batch Stale Data (Switching Batches)** | ✅ RESOLVED | [Details](#issue-99) |
| #98 | **Edit Batch Functionality Failure (Legacy Fallback)** | ✅ RESOLVED | [Details](#issue-98) |
| #95 | **Series Filter Dropdown Empty on First Load** | 🚧 IN PROGRESS | [Details](#issue-95) |
| #94 | **SeriesView Progress Bar Not Showing** | ✅ RESOLVED | [Details](#issue-94) |
| #93 | **Reconfigure Panel Ignores Ingredients (Edit Mode)** | ✅ RESOLVED | [Details](#issue-93) |
| #92 | **Album Cache/Display Architectural Flaw** | ✅ RESOLVED | [Details](#issue-92) |
| #86 | Modal Display Issues (999/0:00/Missing Ratings) | ✅ RESOLVED | [Details](#issue-86) |
| #82 | TopNav Highlight Bug | ✅ RESOLVED | [Details](#issue-82-topnav-highlight-bug) |
| #81 | Inventory Double-Add Bug | ✅ RESOLVED | [Details](#issue-81-inventory-double-add-bug) |
| #80 | ViewAlbumModal File Corruption | ✅ RESOLVED | [Details](#issue-80-viewalbummodal-file-corruption) |
| #79 | Custom Delete Modal Missing | ✅ RESOLVED | [Details](#issue-79-custom-delete-modal-missing) |
| #78 | Modal Missing Ratings/Duration | ✅ RESOLVED | [Details](#issue-78-modal-missing-ratingsduration) |
| #77 | Stale Spotify Data on Reload | ✅ RESOLVED | [Details](#issue-77-stale-spotify-data-on-reload) |
| #76 | Double Delete Toast & UI Freeze | ✅ RESOLVED | [Details](#issue-76-double-delete-toast--ui-freeze) |
| #75 | Data Flow Architecture Incomplete | 🚧 IN PROGRESS | [Details](#issue-75-data-flow-architecture-incomplete) |
| #74 | Ranking Table Disappears on View Toggle | ✅ RESOLVED | [Details](#issue-74-ranking-table-disappears-on-view-toggle) |
| #73 | Led Zeppelin Not Found on Spotify | ✅ RESOLVED | [Details](#issue-73-led-zeppelin-not-found-on-spotify) |
| #72 | Spotify Popularity Not Displaying | ✅ RESOLVED | [Details](#issue-72-spotify-popularity-not-displaying) |
| #71 | Wrong Tracks in Ranking Table | ✅ RESOLVED | [Details](#issue-71-wrong-tracks-in-ranking-table) |

---

## Current Debugging Session

### Issue #142: Non-Electronic Albums Downgraded to EP (Pink Floyd)
**Status**: ✅ **RESOLVED**
**Date**: 2026-01-07
**Severity**: HIGH (Classification Logic Regression)
**Type**: Logic Error
**Component**: `TypeSanityCheckStrategy.js`
**Sprint**: 17.75-C

#### Problem
Non-electronic albums with few tracks (e.g., Pink Floyd's "Animals" with 5 tracks) were being incorrectly downgraded to "EP" by the new `TypeSanityCheckStrategy`.
This violated the `GenreGate` logic which is supposed to trust metadata for non-electronic genres.

#### Root Cause
The `TypeSanityCheckStrategy` applied the "Track Count <= 6" heuristic blindly to all albums, including Rock/Pop, without checking if the genre was Electronic.

#### Solution
Imported `isElectronic` from `ElectronicGenreDetector` and wrapped the track count heuristic in a conditional check. Now, low track counts only trigger a downgrade if the genre is explicitly Electronic.

#### Files Modified
- `public/js/services/album-search/classification/TypeSanityCheckStrategy.js`

---

### Issue #141: "Hello World" (EP) & "Listening To" (Comp) Misclassification
**Status**: ✅ **RESOLVED**
**Date**: 2026-01-07
**Severity**: MEDIUM (Classification Accuracy)
**Type**: Heuristic Refinement
**Component**: `TypeSanityCheckStrategy.js`, `AlbumTypeClassifier.js`
**Sprint**: 17.75-C

#### Problem
1. Ferry Corsten's "Hello World" EPs were classified as "Album" because they have 7-11 tracks (exceeding generic EP limit).
2. "Why I'm Now Listening To" playlists were classified as "Album" instead of "Compilation" because the existing heuristic was bypassed.

#### Solution
1. **New Strategy**: Extracted post-processing logic into `TypeSanityCheckStrategy.js`.
2. **Specific Heuristics**:
    - Added specific regex `/hello world \d+$/` to force "EP" status regardless of track count.
    - Added "listening to" keyword to force "Compilation".
3. **Global Application**: Refactored `AlbumTypeClassifier` to run this sanity check on *all* results (`_finalize`), preventing bypasses.

#### Files Modified
- `public/js/services/album-search/classification/TypeSanityCheckStrategy.js` (Created)
- `public/js/services/album-search/AlbumTypeClassifier.js`

---

### Issue #140: AI Whitelist Response Truncation (JSON Parse Error)
**Status**: ✅ **RESOLVED**
**Date**: 2026-01-06
**Severity**: HIGH (Data Loss - Valid Albums Rejected)
**Type**: API Configuration / Model Behavior
**Component**: `server/routes/ai.js`
**Sprint**: 17.75-B

#### Problem
Valid albums (e.g., "WKND", "Blueprint") were being classified as `Uncategorized` despite being studio albums.
Console logs showed: `[AI] Failed to parse JSON response`.
Raw response was truncated mid-string: `... "Hello World", "Hell` due to token limit.

#### Root Cause
The `maxTokens` parameter was set to 2000 (default/low). For artists with large discographies (like Ferry Corsten), the JSON list exceeded this limit, causing the response to be cut off. The `JSON.parse` then failed, and the fallback logic was insufficient to recover the partial data.

#### Solution
1. **Increased `maxTokens` to 10,000**: Ensures the full JSON payload is received.
2. **Robust Regex Fallback**: Replaced line-splitting logic with `text.match(/"([^"]+)"/g)` to extract all valid strings even if the JSON structure is broken.

#### Files Modified
- `server/routes/ai.js`

---

### Issue #139: GenreGate Localization Leak (Total Eclipse)
**Status**: ✅ **RESOLVED**
**Date**: 2026-01-06
**Severity**: MEDIUM (False Positives)
**Type**: Logic Error / Localization
**Component**: `ElectronicGenreDetector.js`
**Sprint**: 17.75-B

#### Problem
Albums like "Total Eclipse" (Electronic) were erroneously appearing in the main "Albums" list without passing the AI Whitelist check.
They should have been checked by AI and likely rejected (Uncategorized), but were bypassing the check entirely.

#### Root Cause
The `ElectronicGenreDetector` only checked for English genre names (`electronic`, `dance`).
The Apple Music API returned localized genres for some albums (e.g., `Eletrônica` in Portuguese).
The detector returned `false`, causing the system to treat it as a "Non-Electronic" album (like Rock/Pop), which trusts the metadata blindly and skips the AI Whitelist.

#### Solution
Added `eletrônica` and `electrónica` to the `ELECTRONIC_GENRES` list. Now these albums are correctly flagged as electronic, forced through the AI check, and filtered out if not in the whitelist.

#### Files Modified
- `public/js/services/album-search/classification/ElectronicGenreDetector.js`

---

### Issue #138: Prompt "Garbage" Output (Christmas Albums)
**Status**: ✅ **RESOLVED**
**Date**: 2026-01-06
**Severity**: LOW (Data Quality)
**Type**: Prompt Engineering
**Component**: `server/routes/ai.js`
**Sprint**: 17.75-B

#### Problem
AI returned "Santa's X-Mas Dance Party" and other irrelevant compilations in the whitelist.

#### Root Cause
Google Search grounding combined with a "complete discography" prompt sometimes pulled in obscure holiday compilations.

#### Solution
Reverted to the **original strict prompt** (as requested by user) which excludes compilations and mixes. The improved `maxTokens` and parsing logic now allow this strict prompt to work without truncating valid data.

#### Files Modified
- `server/routes/ai.js`

---

### Issue #137: Electronic Music Studio Filter (Singles/EPs)
**Status**: ⚠️ **IN PROGRESS** (Reverted)
**Date**: 2026-01-05
**Severity**: LOW (Content Accuracy)
**Type**: Logic / Data Classification
**Component**: `MusicKitCatalog.js`
**Sprint**: 17.75

#### Problem
The "Studio Albums" filter includes "Maxi-Singles" and "EPs" for Electronic Music artists (false positives).
Previous heuristics fix was reverted as it caused regressions for other genres (e.g., Tiesto Compilations vs Albums).

#### Solution
(Pending new user proposal)

#### Files Modified
- `public/js/services/musickit/MusicKitCatalog.js` (Reverted)

---

### Issue #136: Discography Pagination 404 (Paul Oakenfold)
**Status**: ✅ **RESOLVED**
**Date**: 2026-01-05
**Severity**: MEDIUM (Scan Failure)
**Type**: API Logic
**Component**: `MusicKitCatalog.js`
**Sprint**: 17.75

#### Problem
Fetching discography for artists with many albums (e.g., Paul Oakenfold) failed with a `404 Not Found` error.
Log: `GET .../albums?limit=100&offset=300 404 (Not Found)`

#### Root Cause
The `getArtistAlbums` pagination loop was aggressive (`while(hasMore)`). When the `offset` exceeded the total number of items, the Apple Music API returned a 404 error instead of an empty list. The code did not catch this specific error, causing the entire promise chain to fail.

#### Solution
Wrapped the API call in a `try/catch` block inside the loop. If the error status is 404, it is interpreted as "End of List" (`hasMore = false`), allowing the function to return the albums collected so far.

#### Files Modified
- `public/js/services/musickit/MusicKitCatalog.js`

---

### Issue #135: Discography Title Truncation
**Status**: ✅ **RESOLVED**
**Date**: 2026-01-05
**Severity**: LOW (UX)
**Type**: CSS
**Component**: `DiscographyRenderer.js`
**Sprint**: 17.75

#### Problem
Album titles were being truncated with `truncate` (one line), hiding important information.

#### Solution
Replaced `truncate` with `line-clamp-2` to allow up to 2 lines of text.

#### Files Modified
- `public/js/views/renderers/DiscographyRenderer.js`

---

### Issue #134: Home View Discography Layout
**Status**: ✅ **RESOLVED**
**Date**: 2026-01-05
**Severity**: LOW (UX/Visual)
**Type**: CSS/Layout
**Component**: `DiscographyRenderer.js`
**Sprint**: 17.75

#### Problem
In the Home View "Discography Scan" grid, the album title and year were overlaying the bottom of the cover image, making it hard to read and obstructing artwork.

#### Solution
Refactored `createAlbumCard` to move the text container out of the image wrapper.
- **Before**: Absolute positioning overlay.
- **After**: Flex column layout (Image -> Title -> Year).

#### Files Modified
- `public/js/views/renderers/DiscographyRenderer.js`

---

### Issue #133: Undefined Track Numbers
**Status**: ✅ **RESOLVED**
**Date**: 2026-01-05
**Severity**: LOW (Visual Regression)
**Type**: Props Mismatch
**Component**: `PlaylistGrid.js`, `TrackRow.js`
**Sprint**: 17.75

#### Problem
Tracks in the playlist grid displayed "undefined." instead of "1.", "2.", etc.

#### Root Cause
`TrackRow` expected a `trackIndex` prop, but `PlaylistGrid` (the parent) was not passing it during the render loop (or passing it with a different name).

#### Solution
Updated `PlaylistGrid.js` to explicitly pass `trackIndex={index}` to the `TrackRow.renderHTML` call.

#### Files Modified
- `public/js/components/playlists/PlaylistGrid.js`

---

### Issue #132: Drag & Drop Logic Broken
**Status**: ✅ **RESOLVED**
**Date**: 2026-01-05
**Severity**: HIGH (Regression)
**Type**: DOM Selector Mismatch
**Component**: `PlaylistsDragHandler.js`
**Sprint**: 17.75

#### Problem
Dragging tracks to reorder them stopped working; the drag handle was unresponsive.

#### Root Cause
The drag handler was initialized with the selector `.track-item` (legacy class), but the new unified grid renders rows with the class `.track-row`.

#### Solution
Updated `PlaylistsDragHandler.js` to listen for `.track-row`.

#### Files Modified
- `public/js/controllers/PlaylistsDragHandler.js`

---

### Issue #131: "Delete All" Wipe Out Bug (Listener Leak)
**Status**: ✅ **RESOLVED**
**Date**: 2026-01-05
**Severity**: CRITICAL (Data Loss Risk)
**Type**: Memory Leak / Event Listener Stacking
**Component**: `PlaylistsView.js`
**Sprint**: 17.75

#### Problem
Deleting a single track from a playlist caused multiple tracks to be deleted sequentially (e.g., clicking "X" on Track 1 deleted Track 1, then Track 2, then Track 3 if the page had been visited 3 times).

#### Root Cause
**Memory Leak in Event Listeners**:
`PlaylistsView.attachDelegatedListeners()` manually added click listeners to the container (`#app`) using `addEventListener`.
Because `PlaylistsView` is destroyed and re-mounted on navigation, but the `#app` container persists, new listeners were added *on top* of old ones every time the view was mounted.
The old listeners were never removed because `destroy()` only cleans up listeners registered via `this.subscriptions`.

#### Solution
Refactored `attachDelegatedListeners` to use `this.on(element, event, handler)` from `BaseView`. This method registers the listener in `this.subscriptions`, ensuring it is automatically removed when `destroy()` is called.

#### Files Modified
- `public/js/views/PlaylistsView.js`

---

### Issue #130: Track Deletion & Grid Unification
**Status**: ✅ **RESOLVED**
**Date**: 2026-01-05
**Severity**: HIGH (Feature)
**Type**: Logic
**Component**: `PlaylistsStore.js`, `PlaylistsController.js`
**Sprint**: 17.75

#### Problem
Users could not delete individual tracks from a playlist in "Edit Batch" mode.

#### Solution
1.  Implemented `removeTrack(playlistIndex, trackIndex)` in `PlaylistsStore`.
2.  Implemented `deleteTrack` action in `PlaylistsController`.
3.  Updated `TrackRow` to expose a Delete button.
4.  Wired up event listeners in `PlaylistsView` (see Issue #131 for the fix).

#### Files Modified
- `public/js/stores/playlists.js`
- `public/js/controllers/PlaylistsController.js`
- `public/js/components/ui/TrackRow.js`

---

### Issue #129: BEA Badge Dual Display
**Status**: ✅ **RESOLVED**
**Date**: 2026-01-05
**Severity**: LOW (UX Enhancement)
**Type**: Visual/Logic
**Component**: `TrackRow.js`
**Sprint**: 17.5

#### Problem
User requested that BestEverAlbums (BEA) badge display **both** the Ranking (#1) and Rating (★95) when available, rather than prioritizing one over the other.

#### Solution
Updated `TrackRow.buildBadges` to collect both BEA metrics into a flex container instead of using an `if/else` exclusive logic.

#### Files Modified
- `public/js/components/ui/TrackRow.js`

---


### Issue #127: Balanced Interleave Clustering (Artist Resolution)
**Status**: ✅ **RESOLVED**
**Date**: 2026-01-04
**Severity**: HIGH (Feature Broken)
**Type**: Logic Error / Data Access
**Component**: `TopNAlgorithm.js`
**Sprint**: 17.5

#### Problem
"Balanced Interleave" grouping strategy failed to interleave artists, resulting in clustered output (Dylan, Dylan...) identical to "By Album".

#### Root Cause
The algorithm treated all tracks as "Unknown Artist" because it looked for `t.artistName` (Apple Music) or `t.artists` array (Spotify) but missed the simple `t.artist` property present on the hydrated track objects. This caused all tracks to fall into a single "Unknown" bucket, defeating the Round Robin logic.

#### Solution
Updated `_getArtistName` to check `t.artist` explicitly. Also added fallback to lookup Album Artist via `albumLookup`.

#### Files Modified
- `public/js/algorithms/TopNAlgorithm.js`

---

### Issue #126: By Artist Grouping Failure
**Status**: ✅ **RESOLVED**
**Date**: 2026-01-04
**Severity**: MEDIUM (Feature Broken)
**Type**: Logic Error
**Component**: `TopNAlgorithm.js`
**Sprint**: 17.5

#### Problem
"By Artist then By Rank" grouping didn't sort correctly.

#### Root Cause
Similar to #127, sorting logic relied on `artistName` which wasn't consistently present or detected.

#### Solution
Refactored artist detection into helper `_getArtistName` (which was later improved in #127).

---

### Issue #125: Top N Ingredients Visibility
**Status**: ✅ **RESOLVED**
**Date**: 2026-01-04
**Severity**: MEDIUM (UI Bug)
**Type**: Configuration Error
**Component**: `BlendIngredientsPanel.js`
**Sprint**: 17.5

#### Problem
Selecting "Top N Popular" or "Top N Acclaimed" did not show the "Track Count" (Top 1..10) buttons.

#### Root Cause
`ALGORITHM_INGREDIENTS` configuration map used old IDs (`top-3-popular`) instead of new generic IDs (`top-n-popular`).

#### Solution
Updated `ALGORITHM_INGREDIENTS` keys to match new Algorithm IDs.

---

### Issue #124: Flavor Card Styling Loss
**Status**: ✅ **RESOLVED**
**Date**: 2026-01-04
**Severity**: LOW (Visual Bug)
**Type**: Static Data Error
**Component**: `BlendFlavorCard.js`
**Sprint**: 17.5

#### Problem
Flavor cards for Top N algorithms appeared gray with default icons.

#### Root Cause
Styles (colors/icons) were hardcoded to legacy IDs (`top-3-popular`). New generic IDs were missing from the style maps.

#### Solution
Added `top-n-*` mappings to `getFlavorIcon` and `getFlavorColor`. Added support for `SPOTIFY` and `BEA` badges.

#### Files Modified
- `public/js/components/blend/BlendFlavorCard.js`

---

### Issue #123: Router Infinite Loop (PushState)
**Status**: ✅ **RESOLVED**
**Date**: 2026-01-04
**Severity**: CRITICAL (App Hang)
**Type**: Implementation Error
**Component**: `router.js`
**Sprint**: 17 Phase 5

#### Problem
Application entered infinite loop updating URL when switching views.

#### Solution
Corrected `pushState` logic invocation in `router.navigate`.

---

### Issue #122: SeriesController Bind Error
**Status**: ✅ **RESOLVED**
**Date**: 2026-01-04
**Severity**: CRITICAL (App Crash)
**Type**: Syntax Error
**Component**: `SeriesController.js`
**Sprint**: 17 Phase 5

#### Problem
`TypeError: Cannot read properties of undefined` in constructor.

#### Root Cause
Invalid `.bind(this)` calls for non-existent methods (`handleFilter` vs `handleFilterChange`).

#### Solution
Updated constructor to bind correct method names.

---

### Issue #121: SeriesView Component Initialization Failure
**Status**: ✅ **RESOLVED**
**Date**: 2026-01-03 17:30
**Resolved**: 2026-01-03 17:45
**Severity**: CRITICAL (Regression / App Crash)
**Type**: Class Initialization / SafeDOM Migration
**Component**: `SeriesView.js`
**Sprint**: 16 Phase 4

#### Problem
During regression testing, clicking "Initialize Load Sequence" caused a `TypeError: Cannot set properties of undefined (setting 'header')`. This occurred because `this.components` was undefined in the `SeriesView` instance.

#### Root Cause
The `SeriesView` class lacked a `constructor` to initialize the `this.components` object. In the previous version, this might have been handled differently or inherited, but the SafeDOM refactor made explicit initialization necessary.

#### Solution
Added a constructor to `SeriesView.js` to initialize `this.components = {}` and other default state.

#### Files Modified
- `public/js/views/SeriesView.js`

---

### Issue #120: SafeDOM Missing Semantic Tags
**Status**: ✅ **RESOLVED**
**Date**: 2026-01-03 17:00
**Resolved**: 2026-01-03 17:15
**Severity**: HIGH (Render Failure)
**Type**: API Omission
**Component**: `SafeDOM.js`
**Sprint**: 16 Phase 4

#### Problem
Regression test failed immediatey with `SafeDOM.aside is not a function` (and similar for `header`, `footer`).

#### Root Cause
The `SafeDOM.js` utility class was missing convenience methods for semantic HTML5 tags (`aside`, `header`, `footer`, `nav`, `section`, `article`, `main`), which were introduced in the SafeDOM refactor of `HomeView` and others.

#### Solution
Added the missing static methods to `SafeDOM` class.

#### Files Modified
- `public/js/utils/SafeDOM.js`

---

### Issue #116: Apple Music Export 500 Error (Invalid Track IDs)
**Status**: ✅ **RESOLVED**
**Date**: 2026-01-02 15:00
**Resolved**: 2026-01-02 15:49
**Severity**: HIGH (Critical Export Failure)
**Type**: API Integration
**Component**: `PlaylistsExport.js`
**Sprint**: 15.5

#### Problem
Apple Music export returned 500 Internal Server Error for some playlists.

#### Root Cause
Some tracks had invalid Apple Music IDs like `"track-3"`, `"track-5"` instead of numeric IDs like `"1492263130"`. The Apple Music API rejects non-numeric track IDs with a 500 error.

#### Solution
Added validation function `isValidAppleMusicId()` that checks if ID is numeric (`/^\d+$/`). Invalid IDs now fallback to search instead of causing API errors.

#### Files Modified
- `public/js/views/playlists/PlaylistsExport.js`: Added ID validation

---

### Issue #117: Playlist Index Duplication (1. 1. Title)
**Status**: ✅ **RESOLVED**
**Date**: 2026-01-02 15:00
**Resolved**: 2026-01-02 15:41
**Severity**: MEDIUM (Visual Bug)
**Type**: Data Flow
**Component**: `PlaylistGenerationService.js`
**Sprint**: 15.5

#### Problem
Playlist titles showed duplicated index like "1. 1. Greatest Hits Vol. 1".

#### Root Cause
`PlaylistGenerationService.generate()` was adding index to playlist name (`${index + 1}. ${p.title}`), AND `PlaylistGrid` was also adding index for display.

#### Solution
Removed index addition from `PlaylistGenerationService`. Index is now only added in:
- `PlaylistGrid` for UI display
- `PlaylistsExport` for export naming

#### Files Modified
- `public/js/services/PlaylistGenerationService.js`: Removed index from name

---

### Issue #118: Batch Name Input Losing Focus
**Status**: ✅ **RESOLVED**
**Date**: 2026-01-02 15:00
**Resolved**: 2026-01-02 15:38
**Severity**: HIGH (UX Critical)
**Type**: UI/Reactivity
**Component**: `playlists.js`, `PlaylistsView.js`
**Sprint**: 15.5

#### Problem
Typing in the Batch Name input field caused it to lose focus on every keystroke.

#### Root Cause
`updateBatchName()` called `notify()` which triggered a full View re-render, recreating the input element and losing focus.

#### Solution
1. Removed `notify()` from `updateBatchName()`
2. Added partial DOM update in `PlaylistsView.js` that only re-renders the playlist grid, not the input.

#### Files Modified
- `public/js/stores/playlists.js`: Removed notify() from updateBatchName
- `public/js/views/PlaylistsView.js`: Added partial grid update

---

### Issue #119: Grouping Strategy Not Applied on Reconfigure
**Status**: ✅ **RESOLVED**
**Date**: 2026-01-02 15:56
**Resolved**: 2026-01-02 16:04
**Severity**: MEDIUM (Feature Bug)
**Type**: Parameter Passing
**Component**: `RegeneratePanel.js`
**Sprint**: 15.5

#### Problem
Changing Track Grouping option in Reconfigure panel had no effect on regenerated playlists.

#### Root Cause
`RegeneratePanel.mount()` passed an empty `config: {}` object to `BlendIngredientsPanel`, ignoring current configuration values.

#### Solution
Pass current config values when initializing `BlendIngredientsPanel`:
```javascript
config: {
  duration: (this.currentConfig.targetDuration || 3600) / 60,
  groupingStrategy: this.currentConfig.groupingStrategy || 'by_album',
  // ... other params
}
```

#### Files Modified
- `public/js/components/playlists/RegeneratePanel.js`: Pass currentConfig to BlendIngredientsPanel

---

### Issue #113: Edit Modal Search/Storefront Refactoring
**Status**: ✅ **RESOLVED**
**Date**: 2025-12-31 00:00
**Resolved**: 2025-12-31 00:13
**Severity**: HIGH (Architectural Improvement)
**Type**: Refactoring / Component Reuse
**Component**: `SeriesModals.js`, `MusicKitService.js`, `Autocomplete.js`
**Sprint**: 15 Phase 6 (Hotfix)

#### Problem
1. Edit modal search used Autocomplete with `MusicKitSearchAdapter`, but Home used `getArtistDiscography`.
2. Storefront required `authorize()` on init, causing popup on first page load.
3. Artist searches like "trex" worked on Home but failed in Edit due to different search methods.

#### Root Causes
1. **Different search methods**: Home uses `getArtistDiscography`, Edit used `search()` - fundamentally different APIs.
2. **Eager authorize**: `MusicKitService.init()` called `authorize()` immediately, forcing Apple Music login popup on every app load.
3. **No storefront fallback**: Without authorize, defaulted to 'us' instead of using browser locale.

#### Solution (4-Part Fix)
1. **Lazy Authorize**: Remove `authorize()` from `init()`, only call on persist to Firestore.
2. **Browser Locale Storefront**: Use `navigator.language` to infer storefront for searches.
3. **Deprecate Autocomplete**: Replace with artist scan + filters (same as Home).
4. **Storefront Validation**: On persist, call authorize and detect region mismatch.

#### Implementation Plan
See: [Phase 6 Hotfix Plan](./sprint15-arch12/phase6-hotfix-plan.md)

#### Files To Change
- `MusicKitService.js`: Add `getBrowserStorefront()`, remove eager authorize
- `SeriesModals.js`: Replace Autocomplete with artist scan + filters
- `Autocomplete.js`: [DEPRECATE]
- `MusicKitSearchAdapter.js`: [DEPRECATE]

---

### Issue #111: Delete Modal Shows Raw HTML
**Status**: ✅ **RESOLVED**
**Date**: 2025-12-30 21:15
**Severity**: MEDIUM (Visual Regression)
**Type**: Rendering
**Component**: `SavedPlaylistsView.js`, `BaseModal`

#### Problem
Delete modals in "Saved Playlists" view displayed raw HTML tags (e.g., `<div class="...">`) as text instead of rendering the elements.
#### Root Cause
`SavedPlaylistsView` passed raw HTML strings to `BaseModal.renderHTML`. `BaseModal` (SafeDOM version) treats string content as text by default for security, escaping the HTML tags.
#### Solution
Updated `SavedPlaylistsView.js` to parse the HTML strings using `SafeDOM.fromHTML()` before passing them to the modal. This converts them to DOM Nodes, which `BaseModal` accepts and renders without escaping.

#### Files Changed
- `public/js/views/SavedPlaylistsView.js`

### Issue #112: App Crash on Album Removal
**Status**: ✅ **RESOLVED**
**Date**: 2025-12-30 21:20
**Severity**: HIGH (App Crash)
**Type**: Regression / Data Type Mismatch
**Component**: `albumSeriesStore.js`

#### Problem
Removing an album triggered `TypeError: str.toLowerCase is not a function`.
#### Root Cause
The `removeAlbumFromSeries` method assumed `albumQueries` were always strings. Since recent updates introduced Object Queries (to support Export integrity), the legacy string normalization logic crashed when encountering an object.
#### Solution
Updated `removeAlbumFromSeries` to safely handle both String and Object queries. It now checks `typeof query` and performs exact property matching (ID/Title/Artist) for objects, while maintaining legacy string matching for older data.

#### Files Changed
- `public/js/stores/albumSeries.js`

---

### Issue #110: Apple Music/Spotify Export Data Loss
**Status**: 🔄 **PENDING VERIFICATION**
**Date**: 2025-12-30 21:40
**Severity**: HIGH (Data Integrity)
**Type**: Logic Error / Data Schema Flaw / Region Mismatch
**Component**: `PlaylistsExport.js`, `MusicKitService.js`, `SeriesModals.js`, `MusicKitSearchAdapter.js`

#### Problem
User reported that albums found by Apple MusicKit were "lost" during export (re-searched and failed). T. Rex tracks silently failed because IDs were from wrong region.

#### Root Cause (Multi-Point)
1. **Export**: `PlaylistsExport.js` ignored existing `appleMusicId` and forced search for every track.
2. **Ingestion**: `MusicKitService.js` didn't explicitly map `appleMusicId` to the track object.
3. **Source Data**: `SeriesModals.js` used static JSON (`OptimizedAlbumLoader`) with US Apple Music IDs, not user's storefront.
4. **Region Mismatch**: IDs from US catalog don't work in Brazil library.

#### Solution (4-Part Fix)
1. **MusicKitService.js**: Explicitly map `appleMusicId: t.id` in `getAlbumDetails()`.
2. **PlaylistsExport.js**: Prioritize existing IDs before fuzzy search.
3. **MusicKitSearchAdapter.js** (**NEW**): Adapter wrapping `AlbumSearchService` for live Apple MusicKit search with user's storefront.
4. **SeriesModals.js**: Use `MusicKitSearchAdapter` instead of static JSON, preserving region-specific `appleMusicId`.

#### Files Changed
- `public/js/services/MusicKitService.js` (Line 220)
- `public/js/views/playlists/PlaylistsExport.js` (Lines 85-120)
- `public/js/services/MusicKitSearchAdapter.js` (**NEW**)
- `public/js/components/series/SeriesModals.js` (Lines 15, 235-290)

---

### Issue #109: SafeDOM.strong TypeError
**Status**: ✅ **RESOLVED**
**Date**: 2025-12-30 20:35
**Severity**: HIGH (Console Error / Partial Render Failure)
**Type**: Bug / Omission
**Component**: `SafeDOM.js`
**Sprint**: 15 Phase 4.4

#### Problem
User reported `TypeError: SafeDOM.strong is not a function` in the console. This prevented `TracksTable.renderFooter` from executing correctly.
#### Root Cause
The `strong` convenience method was missing from the `SafeDOM` utility class, despite being used in the `TracksTable` component during the SafeDOM migration.
#### Solution
Added `strong`, `em`, and `small` convenience methods to `SafeDOM.js`.

#### Files Changed
- `public/js/utils/SafeDOM.js`

---

### Issue #108: App Crash (Missing EntityCard.js Regression)
**Status**: ✅ **RESOLVED**
**Date**: 2025-12-30 18:55
**Severity**: CRITICAL (App Crash)
**Type**: Regression
**Component**: `SeriesGridRenderer.js`
**Sprint**: 15 Phase 4.4

#### Problem
User reported a 404 error for `EntityCard.js`, causing the application to fail to load. This occurred immediately after the file was deleted in Issue #107.
#### Root Cause
`SeriesGridRenderer.js` still had an active import of `EntityCard.js` and used it for rendering "ghost cards" and lazy-loaded items. The cleanup in Issue #107 was incomplete as it missed this dependency.
#### Solution
1. Removed `import EntityCard` from `SeriesGridRenderer.js`.
2. Removed legacy ghost card logic.
3. Replaced `EntityCard.renderCard` usage in `appendItems` with `Card.renderHTML` (Universal UI adapter).
4. Verified `Card.js` only references EntityCard in comments.

#### Files Changed
- `public/js/components/series/SeriesGridRenderer.js`

---

### Issue #107: Legacy Component Removal (BaseCard/EntityCard)
**Status**: ✅ **RESOLVED**
**Date**: 2025-12-30 17:15
**Severity**: LOW (Tech Debt)
**Type**: Cleanup
**Component**: `BaseCard.js`, `EntityCard.js`
**Sprint**: 15 Phase 4.4

#### Problem
Legacy component files `BaseCard.js` and `EntityCard.js` were still present in the codebase despite their functionality being superseded by the new `Card.js` and `AlbumsGridRenderer.js`.
#### Root Cause
Transition to "Universal UI" pattern left orphaned files.
#### Solution
Removed both files after verifying 0 usage.
- `public/js/components/base/BaseCard.js` [DELETED]
- `public/js/components/series/EntityCard.js` [DELETED]

---

### Issue #106: SafeDOM Migration (Ranking Views)
**Status**: ✅ **RESOLVED**
**Date**: 2025-12-30 17:00
**Severity**: MEDIUM (Security)
**Type**: Refactoring / XSS Prevention
**Component**: `RankingView.js`, `TracksTable.js`, `TracksTabs.js`
**Sprint**: 15 Phase 4.3

#### Problem
Ranking views (`RankingView.js`) and sub-components (`TracksTable`, `TracksTabs`) were using `innerHTML` with template literals, posing a theoretical XSS risk.
#### Root Cause
Legacy rendering pattern of returning HTML strings instead of DOM nodes.
#### Solution
1. **Refactored `TracksRankingComparison.js`, `TracksTable.js`, `TracksTabs.js`** to use `SafeDOM.create` and return DOM Nodes.
2. **Refactored `RankingView.js`** to construct the entire view using `SafeDOM`, eliminating template literals and usage of `renderHTML` where possible (except for top-level `outerHTML` return required by BaseView).
3. **Refactored `ViewAlbumModal.js`** to use `SafeDOM` for all content.

#### Files Changed
- `public/js/views/RankingView.js`
- `public/js/components/ranking/TracksRankingComparison.js`
- `public/js/components/ranking/TracksTabs.js`
- `public/js/components/ViewAlbumModal.js`
- `public/js/components/ui/Card.js` (Icon SafeDOM usage)

---


### Issue #105: Inventory Grid Layout Overlap (Price/Cover)
**Status**: ✅ **RESOLVED**
**Date**: 2025-12-30 15:45
**Severity**: MEDIUM (Visual Bug)
**Type**: CSS / Layout
**Component**: `InventoryGridRenderer.js`
**Sprint**: 15 Phase 4.2

#### Problem
In Inventory Grid View, the Album Price (e.g., "$9.99") text was overlapping the Album Cover image.
#### Root Cause
The `Card` component was forcing a 100% height (`h-full`), causing it to fight for space with the Price footer injected by the `InventoryGridRenderer`. The Price footer was absolutely positioned or squeezed into the remaining space incorrectly.
#### Solution
1. Refactored `InventoryGridRenderer.renderCard` to use a `flex-col` layout wrapper.
2. Removed `h-full` class from the inner `Card` component string.
3. Wrapped the Card in a `flex-1` container to allow it to take available space while respecting the Price footer.

#### Files Changed
- `public/js/views/renderers/InventoryGridRenderer.js`

---

### Issue #104: Inventory/Albums Click Interactions Broken
**Status**: ✅ **RESOLVED**
**Date**: 2025-12-30 15:00
**Severity**: HIGH (Interaction Broken)
**Type**: Event Handling
**Component**: `InventoryView.js`, `SeriesEventHandler.js`
**Sprint**: 15 Phase 4.3

#### Problem
Clicking on Album cards in "Inventory View" (both Grid and List modes) or "Albums View" failed to open the "View Album" modal.
#### Root Cause
1. **Attribute Mismatch**: `Card.js` (SafeDOM version) sets `data-id` on the interactive element, but the View event listeners were expecting `data-album-id`.
2. **Selector Mismatch (Grid)**: The `InventoryView` event delegation selector did not include the specific classes used in the Grid View (e.g., `.album-card-compact` or explicit `[data-action]`), so clicks on the cover/title were ignored.
3. **Selector Mismatch (List)**: Clicks on the row wrapper in List View were not bubbling up correctly or targeted correctly.
#### Solution
1. Updated event listeners in `InventoryView.js` and `SeriesEventHandler.js` to check for `dataset.albumId || dataset.id`.
2. Expanded the `closest()` selector in `InventoryView.js` to include `.album-card-compact`, `.expanded-album-card`, and `[data-action="view-modal"]`.

#### Files Changed
- `public/js/views/InventoryView.js`
- `public/js/components/series/SeriesEventHandler.js`

---

### Issue #103: Raw HTML Rendering in Cards
**Status**: ✅ **RESOLVED**
**Date**: 2025-12-30 14:00
**Severity**: MEDIUM (Visual Bug)
**Type**: Rendering / XSS Prevention
**Component**: `AlbumsGridRenderer.js`, `InventoryGridRenderer.js`
**Sprint**: 15 Phase 4.2

#### Problem
Album cards displayed raw HTML tags (e.g., `<div>...</div>`) in the content area instead of rendering the formatted content.
#### Root Cause
The `Card` component (SafeDOM version) treats string input for the `content` prop as **text** by default and escapes it. The Renderers were passing HTML strings for complex layouts.
#### Solution
Imported `SafeDOM` in the renderers and used `SafeDOM.fromHTML()` to wrap the content strings, instructing the Card component to treat them as trusted HTML fragments.

#### Files Changed
- `public/js/views/albums/AlbumsGridRenderer.js`
- `public/js/views/renderers/InventoryGridRenderer.js`

---

### Issue #102: App Crash - Missing Exports in AlbumsGridRenderer
**Status**: ✅ **RESOLVED**
**Date**: 2025-12-30 12:00
**Severity**: CRITICAL (App Crash)
**Type**: Syntax / Missing Export
**Component**: `AlbumsGridRenderer.js`, `app.js`
**Sprint**: 15 Phase 4.2

#### Problem
1. **App Loader Failure**: The application was stuck on "Loading...".
2. **Console Error**: `SyntaxError: The requested module ... does not provide an export named 'renderExpandedList'`.
3. **Cascading Failure**: The barrel file `js/views/albums/index.js` failed to export functions, causing `SeriesView.js` import to fail, which halted `app.js` bootstrap.

#### Root Cause
- During refactoring in Phase 4.2, several helper functions (`renderLoadingProgress`, etc.) and `renderExpandedList` were accidentally deleted/commented out in `AlbumsGridRenderer.js`.

#### Solution
- Restored original implementations of missing helper functions.
- Re-implemented `renderExpandedList` using the new `Card.renderHTML` adapter.

#### Files Changed
- `public/js/views/albums/AlbumsGridRenderer.js`

---
 
### Issue #101: ConsolidatedRankingView Failures (Imports & Store)
**Status**: ✅ **RESOLVED**
**Date**: 2025-12-30 11:30
**Severity**: CRITICAL (App Crash)
**Type**: Syntax / Missing Method
**Component**: `ConsolidatedRankingView`, `albumSeriesStore`
**Sprint**: 15 Phase 4.1

#### Problem
1. **App Loader Failure:** The application was stuck on "Loading..." because `ConsolidatedRankingView.js` contained duplicate import statements, causing a SyntaxError that halted script execution.
2. **Runtime Error:** After fixing imports, navigating to the view caused `TypeError: albumSeriesStore.getById is not a function`.

#### Root Cause
1. **Duplicate Imports:** Refactoring code was pasted without removing existing imports, creating invalid ES Module syntax.
2. **Missing Store Method:** The `ConsolidatedRankingView` relied on `albumSeriesStore.getById(id)` which was presumed to exist but was not implemented in the store class.

#### Solution
1. **Consolidated Imports:** Removed duplicate lines in `ConsolidatedRankingView.js`.
2. **Extended Store:** Added `getById(id)` method to `AlbumSeriesStore` class to support direct series lookup.

#### Files Changed
- `public/js/views/ConsolidatedRankingView.js`
- `public/js/stores/albumSeries.js`

---

### Issue #100: BatchGroupCard [object HTMLDivElement] Regression
**Status**: ✅ **RESOLVED**
**Date**: 2025-12-30 10:30
**Severity**: HIGH (Visual Regression)
**Type**: Rendering / Migration
**Component**: `BatchGroupCard`, `TrackRow`
**Sprint**: 15 Phase 3
 
#### Problem
After refactoring `TrackRow` to use `SafeDOM` (returning DOM nodes), the `BatchGroupCard` started displaying `[object HTMLDivElement]` instead of track rows.
 
#### Symptom
Playlist expansion showed textual `[object HTMLDivElement]` repeated for each track.
 
#### Root Cause
`BatchGroupCard.js` (line 188) interpolated `TrackRow.render()` result directly into a template literal. Since `render()` now returns a DOM Element, implicit string conversion resulted in `[object HTMLDivElement]`.
 
#### Solution
Updated `BatchGroupCard.js` to use the newly created `TrackRow.renderHTML()` adapter method, which returns `outerHTML` string, maintaining backwards compatibility with the string-based template.
 
#### Files Changed
- `public/js/components/playlists/BatchGroupCard.js`
 
---
 
### Issue #99: Edit Batch Stale Data (Switching Batches)
**Status**: ✅ **RESOLVED**
**Date**: 2025-12-29 22:04
**Resolved**: 2025-12-29 22:14
**Severity**: MEDIUM (UX Bug)
**Type**: State Management / Race Condition
**Component**: `PlaylistsController`, `SavedPlaylistsController`
**Sprint**: 15 Phase 2

#### Problem
When clicking "Edit Batch" on **Batch A**, then returning to `SavedPlaylistsView` and clicking "Edit Batch" on **Batch B**, the `PlaylistsView` continues displaying Batch A's data instead of loading Batch B.

#### Symptom Flow
```
1. User clicks "Edit Batch" on "Friday Vibes" → View shows Friday Vibes ✅
2. User navigates back to /saved-playlists
3. User clicks "Edit Batch" on "Workout Mix"
4. View STILL shows "Friday Vibes" data ❌
```

#### Root Cause Analysis

**The Bug is in `PlaylistsController.initialize()` line 30-39:**

```javascript
// ORIGINAL CODE (BUGGY)
if (editBatchName) {
    console.log('[PlaylistsController] Mode: EDIT', editBatchName)

    // Only load if not already matching (prevents refresh loop issues)
    if (playlistsStore.mode !== 'EDITING' || playlistsStore.editContext?.batchName !== editBatchName) {
        playlistsStore.setEditMode(decodeURIComponent(editBatchName), seriesIdParam, null)
        await this.loadPlaylistsForEdit(decodeURIComponent(editBatchName), seriesIdParam)
    }
    return
}
```

**Why this fails:**

| Step | Action | Store State | Result |
|------|--------|-------------|--------|
| 1 | User clicks "Edit Batch A" | `mode: 'CREATING'` | Conditional TRUE → loads Batch A ✅ |
| 2 | User clicks "Edit Batch B" | `mode: 'EDITING'` (still set) | — |
| 2a | `SavedPlaylistsController.editBatch('Batch B')` | Sets `batchName: 'Batch B'` | — |
| 2b | Router navigates to `/playlists/edit?edit=Batch%20B` | — | — |
| 2c | `PlaylistsController.initialize()` runs | `mode === 'EDITING'` AND `batchName === 'Batch B'` | Conditional FALSE → **SKIPS** reload ❌ |

The problem: `SavedPlaylistsController.editBatch()` calls `playlistsStore.setEditMode(newBatchName)` **BEFORE** navigation. When `PlaylistsController.initialize()` runs, it sees the **new** batch name already matches the URL param, so it **incorrectly skips** the reload.

#### Solution

Remove the conditional guard entirely – always reload when navigating to Edit Mode:

```javascript
// FIXED CODE
if (editBatchName) {
    console.log('[PlaylistsController] Mode: EDIT', editBatchName)

    // Sprint 15 Fix: ALWAYS reload on Edit Mode navigation.
    // Previous guard caused stale data when switching between batches.
    playlistsStore.setEditMode(decodeURIComponent(editBatchName), seriesIdParam, null)
    await this.loadPlaylistsForEdit(decodeURIComponent(editBatchName), seriesIdParam)
    return
}
```

**Rationale**: The guard was intended to "prevent refresh loops" but that concern is unfounded – the router lifecycle already handles re-mounting properly.

#### Files Changed
- `public/js/controllers/PlaylistsController.js` (lines 30-39)

#### Verification
1. Navigate to `/saved-playlists`
2. Click "Edit Batch" on Batch A → Verify correct data loads
3. Navigate back to `/saved-playlists`
4. Click "Edit Batch" on Batch B → **Batch B's data should load**

---

### Issue #98: Edit Batch Functionality Failure (Legacy Fallback)
**Status**: ✅ **RESOLVED**
**Date**: 2025-12-29
**Severity**: HIGH (Feature Broken)
**Type**: Logic / Legacy Compatibility
**Component**: `PlaylistsController` (Legacy), `SavedPlaylistsView` (New)

#### Problem
Clicking "Edit Batch" in `SavedPlaylistsView` failed to load the batch data in the (Legacy) `PlaylistsView`. Instead, it showed the "Generation Settings" (Create Mode) UI.

#### Root Cause
1. **URL Navigation**: `SavedPlaylistsController` was navigating to `/playlists` without the `edit` query parameter required by the legacy controller initialization logic.
2. **Data Filtering Failure**: Even with the correct URL, `PlaylistsController` failed to find playlists because the batch name matching was sensitive to whitespace (`'Name ' !== 'Name'`).
3. **UI Fallback**: When the playlist array was empty (due to the filter failure), `PlaylistsGridRenderer` defaulted to showing the "Initial Settings" UI, which looked like a broken state.

#### Solution
1. **Frontend Navigation**: Updated `SavedPlaylistsController.editBatch` to pass `?edit=BATCH_NAME`.
2. **Robust Logic**: Updated `PlaylistsController` loop to use `.trim()` for batch name comparison.
3. **Error Handling**: Updated `PlaylistsView.renderGenerationSection` to display a specific **"Batch Not Found"** error when in Edit Mode with 0 playlists, instead of the generic creation UI.
4. **UI Cleanup**: Conditionally hid the "No albums loaded" warning when the specific error is displayed.

#### Files Changed
- `public/js/components/playlists/SavedPlaylistsController.js`
- `public/js/controllers/PlaylistsController.js`
- `public/js/views/PlaylistsView.js`

---

### Issue #97: V3 Album Objects Crashing Legacy Systems (The "Thriller" Bug)
**Status**: ✅ **RESOLVED**
**Date**: 2025-12-28 10:45
**Severity**: CRITICAL (Data Loss / Incorrect Fallback)
**Type**: Architecture / Compatibility
**Component**: `AlbumCache`, `APIClient`, `AlbumIdentity`

#### Problem
1. Albums found in HomeView (V3) failed to load in SeriesView/Blending.
2. Some searches resulted in "Thriller" by Michael Jackson appearing unexpectedly.
3. Console errors: `TypeError: query.toLowerCase is not a function`.

#### Root Cause
**Architectural Mismatch**: HomeView V3 passes **Metadata Objects** (ID, Title, Artist) to the hydration layer.
However, Legacy components (`AlbumCache`, `AlbumIdentity`) expected **String Queries** ("Artist - Album").
1. `AlbumCache` crashed trying to normalize the object key.
2. `AlbumIdentity` crashed trying to compare string similarity.
3. `APIClient` caught the crash and fell back to the legacy API, sending `[object Object]` as the query.
4. The Backend returned "Thriller" as a default/mock response for invalid inputs.

#### Solution
**Compatibility Patch (Hydration Adapter)**:
1. **AlbumIdentity**: Updated to handle Object queries in constructor.
2. **APICient**: Updated to stringify objects before sending to legacy API.
3. **AlbumCache**: Updated `normalizeKey` and `_legacyStorageKey` to extract string representation from objects.

**Architectural Decision**: [ADR: Discovery vs Hydration](file:///c:/Users/Mauricio%20Pedroso/.gemini/antigravity/brain/9bae9fee-eaf9-4880-9275-3355e3b08fdd/adr_discovery_vs_hydration.md)

#### Files Changed
- `public/js/cache/albumCache.js`
- `public/js/api/client.js`
- `public/js/models/AlbumIdentity.js`
- `public/js/components/series/SeriesModals.js` (UI Fix)

---

### Issue #96: "Owned" Logic Default Incorrect
**Status**: ✅ **RESOLVED**
**Date**: 2025-12-26 15:45
**Severity**: MEDIUM (Logic Bug)
**Type**: Business Logic
**Component**: `InventoryController` (V3), `InventoryGridRenderer` (V3)

#### Problem
New items added to Inventory defaulted to "Owned" (Green) incorrectly, when they should default to "Not Owned" (Backlog). Stats logic also counted everything as owned.

#### Solution
1. **Controller**: Updated `calculateStats` to count only `album.owned === true`.
2. **Logic**: `null` or `undefined` now explicitly treated as "Not Owned".
3. **UI**: Restored Status Dropdown to allow explicit tri-state selection (Owned/Wishlist/Not Owned).

---

### Issue #95: Series Filter Dropdown Empty on First Load
**Status**: 🚧 **IN PROGRESS**
**Date**: 2025-12-26 12:20
**Severity**: MEDIUM (UX Degradation)
**Type**: Component Lifecycle / Race Condition
**Component**: `SeriesView`, `SeriesToolbar`, `albumSeriesStore`
**Related**: ARCH-6 implementation

#### Problem Summary
On first load of `/albums` (cold cache), the series filter dropdown shows only "All Series" with no options to filter by specific series. All albums load and display correctly, but user cannot filter until they navigate away and back.

#### Symptom
```
User opens /albums (fresh page load)
├── Toolbar mounted with empty seriesList
├── loadScope() starts, calls albumSeriesStore.loadFromFirestore()
├── Albums load incrementally (1-by-1) ✅
├── BUT filter dropdown still shows only "All Series" ❌
└── After nav away/back → dropdown works correctly ✅
```

#### Console Log Evidence
```
SeriesView.js:98 [SeriesView] Mounting...
SeriesController.js:83 [SeriesController] loadScope: ALL, seriesId=null
(... albums load 1-67 ...)
SeriesView.js:140 [SeriesView] All components mounted ✅
```

Note: Toolbar is mounted BEFORE `loadFromFirestore()` completes.

#### Root Cause Analysis (Preliminary)
1. `SeriesView.mount()` calls `mountToolbar()` which uses `albumSeriesStore.getSeries()`
2. At this point, `getSeries()` returns empty array (store not loaded yet)
3. Later, `loadScope()` calls `albumSeriesStore.loadFromFirestore()`
4. `albumSeriesStore` now has series, but toolbar isn't re-rendered

#### Potential Solutions
1. **Await store load before mounting toolbar** - delay toolbar mount
2. **Reactive toolbar** - subscribe to `albumSeriesStore` changes
3. **Re-mount toolbar after load** - explicit update call

#### Files Involved
- `public/js/views/SeriesView.js` - `mount()`, `mountToolbar()`
- `public/js/controllers/SeriesController.js` - `loadScope()`
- `public/js/components/series/SeriesToolbar.js`
- `public/js/stores/albumSeries.js`

---

### Issue #94: SeriesView Progress Bar Not Showing
**Status**: ✅ **RESOLVED**
**Date**: 2025-12-26 02:45
**Resolved**: 2025-12-26 02:50
**Severity**: MEDIUM (UX Degradation)
**Type**: DOM / Lifecycle
**Component**: `SeriesView`, `SeriesToolbar`, `InlineProgress`

#### Problem Summary
Loading progress bar missing in Albums Series view after cache refactors. Shows "Starting..." text but no progress bar animation. User also reported slow/repeated album loading when navigating.

#### Root Cause
In `SeriesView.mountToolbar()`, the code tried to initialize `InlineProgress` with a container that doesn't exist yet:
```javascript
// BEFORE toolbar.mount() - container doesn't exist!
const progressContainer = document.getElementById('loading-progress-container');
if (progressContainer) {
    this.inlineProgress = new InlineProgress(progressContainer);
}
// toolbar.mount() creates the container
this.components.toolbar.mount();
```

#### Solution
Move `InlineProgress` initialization to AFTER `toolbar.mount()`:
```javascript
this.components.toolbar.mount();
// NOW container exists
const progressContainer = document.getElementById('loading-progress-container');
if (progressContainer) {
    this.inlineProgress = new InlineProgress(progressContainer);
}
```

#### File Changed
- `public/js/views/SeriesView.js` - `mountToolbar()` method

---

### Issue #93: Reconfigure Panel Ignores Ingredients (Edit Mode)
**Status**: ✅ **RESOLVED**
**Date**: 2025-12-25 22:43
**Resolved**: 2025-12-26 02:40
**Severity**: HIGH (Feature Broken)
**Type**: Logic / State
**Component**: `RegeneratePanel`, `BlendIngredientsPanel`, `BlendingController`

#### Problem Summary
When clicking "Edit" on a saved playlist and using the **Reconfigure panel** to change blend ingredients/settings, the changes are NOT applied when clicking "Regenerate Playlists".

#### Root Cause
1. **Field name mismatch**: `BlendIngredientsPanel.getConfig()` returned `duration` (minutes) and `rankingType`, but `PlaylistGenerationService` expected `targetDuration` (seconds) and `rankingId`.
2. **Wrong albums**: `PlaylistsController.loadAlbumsForSeries()` skipped loading if ANY albums were in memory, even if from a different series.

#### Solution
1. **Centralized config normalization** in `BlendIngredientsPanel.getConfig()`:
   - Converts `duration * 60` → `targetDuration` (seconds)
   - Maps `rankingType` → `rankingId` (e.g. 'combined' → 'balanced')
2. **Created `BlendingController.js`** with centralized:
   - `generateFromSeries(seriesId, config)` - loads albums + generates
   - `regenerate(config)` - generates using albums in store
3. **Fixed series mismatch** in `PlaylistsController.loadAlbumsForSeries()`:
   - Now checks if albums belong to the correct series before skipping

#### Files Changed
- NEW: `public/js/controllers/BlendingController.js`
- `public/js/components/blend/BlendIngredientsPanel.js`
- `public/js/components/playlists/RegeneratePanel.js`
- `public/js/views/BlendingMenuView.js`
- `public/js/controllers/PlaylistsController.js`

---

### Issue #92: Album Cache/Display Architectural Flaw
**Status**: ✅ **RESOLVED**
**Date**: 2025-12-25 22:30
**Resolved**: 2026-01-03 14:45
**Severity**: CRITICAL (Data Corruption + UI Flaw)
**Type**: Architecture / State Management
**Component**: `apiClient`, `albumCache`, `albumsStore`, `SeriesView`, `SeriesController`

#### Problem Summary
When viewing albums in Single Series mode, **wrong albums appear** (e.g., "Blonde" by Frank Ocean appearing in "Blonde on Blonde" series). This "cross-contamination" occurred because the renderer used fuzzy string matching to guess which series an album belonged to.

#### Root Cause
1. **Context Loss**: `SeriesController` loaded albums into a flat list, stripping the series context.
2. **Fuzzy Guessing**: `AlbumsScopedRenderer` attempted to redistribute albums to series using loose string matching (`query.includes(album.title)`), leading to false positives.

#### Solution
Implemented **Context-Aware Loading (ARCH-14)**:
1. **Source Tagging**: `SeriesController` now attaches `_sourceSeriesId` to every query it loads.
2. **Strict Ownership**: `apiClient` preserves this tag, and `albumsStore` attaches it to the Album instance as `seriesIds`.
3. **Precise Rendering**: `AlbumsScopedRenderer` now uses strict `album.seriesIds.includes(seriesId)` checks, falling back to fuzzy matching only for legacy cached data.

#### Files Changed
- `public/js/controllers/SeriesController.js`
- `public/js/views/albums/AlbumsScopedRenderer.js`
- `public/js/stores/albums.js`
- `public/js/stores/albumSeries.js` (Crash fix for deletion)

#### Root Cause Analysis (ARCHITECTURAL)

**3 interlinked architectural violations:**

1. **Cache Key vs Album Title Mismatch**
   ```
   Query: "Jimmy Page & Robert Plant - No Quarter"
   Apple Music Returns: "Physical Graffiti (Remastered)"
   Cache Key Used: "Jimmy Page & Robert Plant - No Quarter"
   Album Title Stored: "Physical Graffiti (Remastered)"
   ```
   The cache stores the WRONG album under the ORIGINAL query as key. When the series loads albums by query, it gets the wrong album data.

2. **Apple Music Search Artist Format Mismatch**
   - Query: `"Robert Plant & Jimmy Page - Walking Into Clarksdale"`
   - Apple Music knows it as: `"Page and Plant - Walking Into Clarksdale"`
   - Search returns Led Zeppelin albums (Mothership, Physical Graffiti) because artist doesn't match

3. **AlbumsStore Cross-Series Pollution**
   - `albumsStore` is a GLOBAL singleton that accumulates albums from ALL series
   - When loading a single series, albums from ALL previous loads remain in store
   - View/Filter logic doesn't properly isolate by series

#### Evidence (Console Logs)

```
[APIClient] Searching Apple Music: Robert Plant & Jimmy Page - Walking Into Clarksdale
[APIClient] Selected from 5 results: "Mothership (Remastered)" (1052497413)
💾 Cached: Robert Plant & Jimmy Page - Walking Into Clarksdale

[AlbumSeriesStore] Could not find matching query for: Physical Graffiti (Remastered)
[SeriesEventHandler] Failed to remove album: Error: Could not find album query in series
```

#### Why Patches Won't Work

Multiple patch attempts were made and reverted:
1. **Similarity Threshold**: Added <35% similarity rejection → Would break search for legitimate artist name variations
2. **Album-Only Fallback Search**: Tried searching by album name only → Other albums with same name could conflict
3. **Force Clear Cache**: Would cause excessive API calls and rate limiting

#### Required Architectural Changes

> [!IMPORTANT]
> **This requires Sprint-level architectural work, not a quick fix.**

**1. Cache Key Normalization**
- Cache MUST validate that the returned album title matches the query
- If mismatch > threshold, DON'T cache, return error to caller
- OR: Use a composite key: `{artist}_{albumTitle}` from the RESULT, not the query

**2. Album Identity Model**
- Albums need a **stable identity** that isn't just the cache key
- Consider: `{ originalQuery, actualTitle, actualArtist, appleId, spotifyId }`
- Track which query produced which album for debugging

**3. Series-Scoped Album Filtering**
- `albumsStore.getAlbumsForSeries(seriesId)` must ONLY return albums whose queries match the series
- Current pattern adds ALL fetched albums to a global pool

**4. SeriesView/Controller State Reset**
- When navigating to single series, explicitly clear albums not in that series
- Filter dropdown must sync with URL on mount

#### Related Architectural Debt

| Item | Description |
|------|-------------|
| ARCH-2 | Standardize Stores (albumsStore pattern inconsistent) |
| DEBT-1 | Split API Client (MusicKitService + EnrichmentService) |
| #75 | Data Flow Architecture incomplete documentation |

#### Files Involved

| File | Role | Issue |
|------|------|-------|
| `public/js/api/client.js` | Fetches albums, caches with query key | Uses query as cache key when returned album differs |
| `public/js/cache/albumCache.js` | L1/L2 cache for albums | No validation of key vs stored content |
| `public/js/stores/albums.js` | Global album store | Accumulates albums from all series without isolation |
| `public/js/services/MusicKitService.js` | Apple Music search | Doesn't handle artist name variations (e.g., "Page and Plant") |
| `public/js/views/SeriesView.js` | Series filter dropdown | Doesn't sync filter state with URL `seriesId` on mount |
| `public/js/controllers/SeriesController.js` | Loads albums for series | Uses global store, doesn't isolate by series |

#### Recommended Sprint Scope

**Sprint 14 or 15** - Album Data Pipeline Refactor:
- [ ] Define Album Identity Model with stable IDs
- [ ] Refactor albumCache to use result-based keys
- [ ] Add cache validation (query vs result matching)
- [ ] Refactor albumsStore to be series-scoped
- [ ] Fix SeriesView filter sync with URL params
- [ ] Add Apple Music artist name normalization/alternatives

---

### Issue #91: Edit Playlist Delete Button Unresponsive
**Status**: ✅ **RESOLVED**
**Severity**: HIGH
**Problem**: Clicking the "Delete Playlist" trash icon usually works, but inside `EditPlaylistView` it triggered no action, or failed to show the modal.
**Root Cause**: 
1. `Modals.js`: The `showDeletePlaylistModal` function implementation was accidentally truncated to comment placeholders during a previous edit.
2. `EditPlaylistView.js`: Event delegation was attached to `app` which might be fragile during re-renders.
**Fix**: 
1. Restored full implementation of `showDeletePlaylistModal` in `Modals.js`.
2. Updated event delegation to `document.body` in `EditPlaylistView.js` for robustness.

### Issue #90: Saved Playlists "Delete Batch" Modal Generic
**Status**: ✅ **RESOLVED**
**Severity**: MEDIUM
**Problem**: Clicking "Delete Batch" showed a generic "Delete Playlist?" modal with confusing text ("0 tracks").
**Fix**: Created a dedicated `showDeleteBatchModal` in `Modals.js` with correct "This action cannot be undone" warning and batch-specific metadata.

### Issue #89: Regeneration Config Stuck/Resetting
**Status**: ✅ **RESOLVED**
**Severity**: MEDIUM
**Problem**: Changes to settings in `RegeneratePanel` were ignored or reset to defaults upon regeneration.
**Root Cause**: `PlaylistsView.js` was hardcoding `currentConfig` defaults instead of reading from the panel's state.
**Fix**: Updated `PlaylistsView.js` to preserve `this.currentConfig` if it exists.

### Issue #88: Ranking Strategy Selection Ignored
**Status**: ✅ **RESOLVED**
**Severity**: HIGH
**Problem**: Selecting "Spotify Popularity" strategy in the UI did not affect the output; the algorithm continued using the default "Balanced" strategy.
**Root Cause**: `PlaylistsView.js` was creating the `RankingStrategy` instance but failing to pass it into the `algorithm.generate()` method options.
**Fix**: Updated `PlaylistsView.js` to correctly pass `{ rankingStrategy }` in the options object.

### Issue #87: Spotify Enrichment Persistence Failure
**Status**: ✅ **RESOLVED**
**Severity**: CRITICAL
**Problem**: After clicking "Enrich with Spotify", the data appeared on screen but was lost upon navigating to "Playlists" view, causing Ranking Strategies to fail (fallback to Acclaim).
**Root Cause**: The `AlbumsView` logic to persist data was missing listeners for the new `album-enriched` event defined in Sprint 11.5. Additionally, `AlbumsStateController` had an invalid dynamic import for Firestore.
**Fix**: 
1. Added `album-enriched` listener in `AlbumsView.js`.
2. Fixed DB import path in `AlbumsStateController.js`.
3. Validated event flow from Component -> View -> Controller -> Store -> DB.


### Issue #82: TopNav Highlight Bug
**Status**: 🔍 **INVESTIGATING**
**Severity**: LOW
**Problem**: "Album Series" is highlighted instead of "Home" (or vice-versa) based on route matching ambiguity.

### Issue #81: Inventory Double-Add Bug
**Status**: ✅ **RESOLVED**
**Severity**: MEDIUM
**Problem**: Clicking "Add to Inventory" triggered an immediate add (via AlbumsView) AND opened the modal, causing a "Duplicate" error when submitting the form.
**Fix**: Updated `AlbumsView` to ONLY open the modal. The modal handles the actual addition.

### Issue #80: ViewAlbumModal File Corruption
**Status**: ✅ **RESOLVED**
**Severity**: CRITICAL
**Problem**: Syntax error in `ViewAlbumModal.js` caused by file write sync issue (orphaned code left at end).
**Fix**: Completely overwrote file with clean content.

---
# Debug Log

**Last Updated**: 2025-12-19 23:00
**Workflow**: See `.agent/workflows/debug_protocol.md`
## Maintenance Notes

**How to Update This Document**:
1. Active issues → Current Debugging Session
2. Resolved/reverted issues → Move to Previous with timestamp
3. Keep Previous sections for history (don't delete)
4. Link to ARCHITECTURE.md for architectural decisions

**See**: `.agent/workflows/debug_issue.md` for systematic debugging protocol

---

## 📑 Issue Index

| # | Description | Status | Link |
|---|-------------|--------|------|
| #86 | Modal Display Issues (999/0:00/Missing Ratings) | ✅ RESOLVED | [Details](#issue-86) |
| #82 | TopNav Highlight Bug | ✅ RESOLVED | [Details](#issue-82-topnav-highlight-bug) |
| #81 | Inventory Double-Add Bug | ✅ RESOLVED | [Details](#issue-81-inventory-double-add-bug) |
| #80 | ViewAlbumModal File Corruption | ✅ RESOLVED | [Details](#issue-80-viewalbummodal-file-corruption) |
| #79 | Custom Delete Modal Missing | ✅ RESOLVED | [Details](#issue-79-custom-delete-modal-missing) |
| #78 | Modal Missing Ratings/Duration | ✅ RESOLVED | [Details](#issue-78-modal-missing-ratingsduration) |
| #77 | Stale Spotify Data on Reload | ✅ RESOLVED | [Details](#issue-77-stale-spotify-data-on-reload) |
| #76 | Double Delete Toast & UI Freeze | ✅ RESOLVED | [Details](#issue-76-double-delete-toast--ui-freeze) |
| #75 | Data Flow Architecture Incomplete | 🚧 IN PROGRESS | [Details](#issue-75-data-flow-architecture-incomplete) |
| #74 | Ranking Table Disappears on View Toggle | ✅ RESOLVED | [Details](#issue-74-ranking-table-disappears-on-view-toggle) |
| #73 | Led Zeppelin Not Found on Spotify | ✅ RESOLVED | [Details](#issue-73-led-zeppelin-not-found-on-spotify) |
| #72 | Spotify Popularity Not Displaying | ✅ RESOLVED | [Details](#issue-72-spotify-popularity-not-displaying) |
| #71 | Wrong Tracks in Ranking Table | ✅ RESOLVED | [Details](#issue-71-wrong-tracks-in-ranking-table) |

---

## Current Debugging Session

### Issue #88: Ranking Strategy Selection Ignored
**Status**: ✅ **RESOLVED**
**Severity**: HIGH
**Problem**: Selecting "Spotify Popularity" strategy in the UI did not affect the output; the algorithm continued using the default "Balanced" strategy.
**Root Cause**: `PlaylistsView.js` was creating the `RankingStrategy` instance but failing to pass it into the `algorithm.generate()` method options.
**Fix**: Updated `PlaylistsView.js` to correctly pass `{ rankingStrategy }` in the options object.

### Issue #87: Spotify Enrichment Persistence Failure
**Status**: ✅ **RESOLVED**
**Severity**: CRITICAL
**Problem**: After clicking "Enrich with Spotify", the data appeared on screen but was lost upon navigating to "Playlists" view, causing Ranking Strategies to fail (fallback to Acclaim).
**Root Cause**: The `AlbumsView` logic to persist data was missing listeners for the new `album-enriched` event defined in Sprint 11.5. Additionally, `AlbumsStateController` had an invalid dynamic import for Firestore.
**Fix**: 
1. Added `album-enriched` listener in `AlbumsView.js`.
2. Fixed DB import path in `AlbumsStateController.js`.
3. Validated event flow from Component -> View -> Controller -> Store -> DB.


### Issue #82: TopNav Highlight Bug
**Status**: 🔍 **INVESTIGATING**
**Severity**: LOW
**Problem**: "Album Series" is highlighted instead of "Home" (or vice-versa) based on route matching ambiguity.

### Issue #81: Inventory Double-Add Bug
**Status**: ✅ **RESOLVED**
**Severity**: MEDIUM
**Problem**: Clicking "Add to Inventory" triggered an immediate add (via AlbumsView) AND opened the modal, causing a "Duplicate" error when submitting the form.
**Fix**: Updated `AlbumsView` to ONLY open the modal. The modal handles the actual addition.

### Issue #80: ViewAlbumModal File Corruption
**Status**: ✅ **RESOLVED**
**Severity**: CRITICAL
**Problem**: Syntax error in `ViewAlbumModal.js` caused by file write sync issue (orphaned code left at end).
**Fix**: Completely overwrote file with clean content.

---

### Issues #79-76: Sprint 11 UI/UX Fixes
**Status**:  **RESOLVED**
**Date**: 2025-12-19
**Note**: Detailed logs for these issues (Delete Modal, Ratings Display, Stale Data) were archived during a merge, but verified as resolved.

---

#### Issue #75: Data Flow Architecture Incomplete
**Status**: ­ƒÜº **IN PROGRESS**
**Severity**: HIGH (Technical Debt)
**Type**: Documentation

**Problem**: `data_flow_architecture.md` is ~50% incomplete. Missing:
- 4 Views (EditPlaylistView, InventoryView, SavedPlaylistsView, ConsolidatedRankingView)
- 2 Stores (inventory, UserStore)
- 3 Services (AlbumLoader, OptimizedAlbumLoader, DataSyncService)
- CRUD flows for all entities
- Ranking generation flow
- Algorithm generation flow

**Action**: Full code scan and document all flows.

**Files**: `docs/technical/data_flow_architecture.md`

---

#### Issue #74: Ranking Table Disappears on View Toggle
**Status**: Ô£à **RESOLVED**
**Severity**: MEDIUM (UX Bug)
**Type**: Rendering

**Problem**: When toggling between Compact and Expanded view, the ranking table (TracksRankingComparison) disappears.

**Root Cause**: After view toggle, `updateAlbumsGrid()` was not being called, so ranking components were not re-mounted.

**Solution**: Added `this.updateAlbumsGrid(currentAlbums)` after event listener re-binding in view toggle handler.

**Files Fixed**: `AlbumsView.js` (line 679)

---

#### Issue #73: Led Zeppelin Not Found on Spotify
**Status**: Ô£à **RESOLVED**
**Severity**: MEDIUM (Data)
**Type**: API Integration

**Problem**: Spotify search for "Led Zeppelin - Led Zeppelin (Remastered)" returned no results.

**Root Cause**: Spotify API doesn't match "(Remastered)" suffix, and structured query `artist:X album:Y` was too strict.

**Solution**: 
1. Strip common suffixes (Remastered, Deluxe Edition, etc.) before search
2. Added fuzzy matching fallback using Levenshtein distance
3. Search by artist only ÔåÆ then score results by album name similarity

**Files Fixed**: `SpotifyService.js` - `searchAlbum()`, `_searchByArtistFuzzy()`, `_similarityScore()`

---

#### Issue #72: Spotify Popularity Not Displaying
**Status**: Ô£à **RESOLVED**
**Severity**: HIGH (Feature Broken)
**Type**: Data Mapping

**Problem**: Even when Spotify found an album with 14 tracks, the log showed "matched 0/14 tracks". Popularity column showed "Not linked".

**Root Cause**: Track title matching was exact-match only. Apple Music track titles differ from Spotify (e.g., parenthetical info, punctuation).

**Solution**: Implemented fuzzy matching for track titles:
1. Normalize: lowercase, remove punctuation, collapse whitespace
2. Try exact match first
3. Fallback to substring matching

**Files Fixed**: `client.js` - `findSpotifyMatch()` helper function

---

#### Issue #71: Wrong Tracks in Ranking Table
**Status**: ­ƒöì **INVESTIGATING**
**Severity**: CRITICAL (Data Corruption)
**Type**: Rendering/Data

**Problem**: Album card shows "Rubber Soul" by The Beatles, but the tracks displayed are Led Zeppelin songs (Black Dog, Stairway to Heaven, etc.).

**Symptoms**:
- Happens after view mode toggle
- Persists even after cache clear
- Problem recurs (not just stale cache)

**Suspected Causes**:
1. Album ID mismatch in container ÔåÆ album lookup
2. Shared reference mutation between album objects
3. Cache storing corrupted data
4. Store state pollution between series

**Investigation Plan**:
1. Add debug logging to track album ÔåÆ tracks mapping
2. Verify album.id matches container data-album-id
3. Check if albums share same tracks array reference
4. Trace data flow from API ÔåÆ cache ÔåÆ store ÔåÆ component

**Files to Investigate**: 
- `AlbumsView.js` (updateAlbumsGrid)
- `TracksRankingComparison.js` (normalizeTracks)
- `albumCache.js` (cache key collision?)
- `Album.js` model (shared references?)

---

### Issues #63-70: Sprint 11 - Spotify Integration (Earlier Session)
**Status**: ­ƒöä **MOSTLY RESOLVED** (1 pending)
**Date**: 2025-12-19 12:00-16:00
**Sprint**: Sprint 11 - Spotify Integration Phase 1-3

---

#### Issue #70: Loading UX During Album Render
**Status**: ­ƒÜº **IN PROGRESS**
**Severity**: MEDIUM (UX)
**Type**: User Experience

**Problem**: Albums page shows inconsistent data during load - cards appear incrementally causing visual confusion.

**Requested Solution**: Non-blocking loading indicator showing which album is being processed.

**Files to Modify**: `AlbumsView.js`, `GlobalProgress.js`

---

#### Issue #69: AlbumsView Duplicate Imports (SyntaxError)
**Status**: Ô£à **RESOLVED**
**Severity**: CRITICAL (App Blocked)

**Problem**: 
```
SyntaxError: Identifier 'filterAlbumsFn' has already been declared
```
App stuck on "Loading..." screen.

**Root Cause**: Previous edit accidentally duplicated import statements in `AlbumsView.js`.

**Fix**: Removed duplicate import lines (filterAlbumsFn, getUniqueArtistsFn, renderScopedGridFn).

**Files Modified**: `public/js/views/AlbumsView.js` (lines 28-36)

---

#### Issue #68: Router TypeError on Callback Route
**Status**: Ô£à **RESOLVED**
**Severity**: MEDIUM

**Problem**:
```
TypeError: Cannot read properties of null (reading 'render') at Router.renderView
```

**Root Cause**: `/callback` route returns `null` after processing OAuth redirect, but Router expected a view object with `render()` method.

**Fix**: Added null check in `router.js` before calling `view.render()`.

**Files Modified**: `public/js/router.js`

---

#### Issue #67: CSP Blocking Apple Music API
**Status**: Ô£à **RESOLVED**
**Severity**: HIGH

**Problem**: `Connecting to 'https://api.music.apple.com' violates Content Security Policy`

**Fix**: Added `https://api.music.apple.com` to `connect-src` in CSP meta tag.

**Files Modified**: `public/index.html`

---

#### Issue #66: CSP Blocking Firebase Source Maps
**Status**: Ô£à **RESOLVED**
**Severity**: LOW (Dev only)

**Problem**: Console spam with CSP violations for `firebase-firestore.js.map` from gstatic.com

**Fix**: Added `https://*.gstatic.com` to `connect-src`.

**Files Modified**: `public/index.html`

---

#### Issue #65: CSP Blocking Spotify API
**Status**: Ô£à **RESOLVED**
**Severity**: HIGH

**Problem**: Spotify OAuth token exchange blocked by CSP.

**Fix**: Added `https://accounts.spotify.com` and `https://api.spotify.com` to `connect-src`.

**Files Modified**: `public/index.html`

---

#### Issue #64: Spotify Redirect URI (localhost blocked)
**Status**: Ô£à **RESOLVED** (Updated 2025-12-19 16:26)
**Severity**: HIGH

**Problem**: Spotify Dashboard rejects `http://localhost:5000/callback` - error message: "localhost is not allowed as redirect URI"

**Root Cause**: Spotify changed policy in 2024 to block "localhost" string.

**Final Solution**: Custom local domain `mjrp.local`
1. Add `127.0.0.1 mjrp.local` to hosts file (Windows/Mac)
2. Updated `vite.config.js` with `host: 'mjrp.local'`
3. Register `http://mjrp.local:5000/callback` in BOTH dashboards

**Benefits**:
- Single URL for both Spotify and Apple Music
- Unified localStorage/cookies (no session splits)
- Same experience as production

**Setup Guide**: *(Guide Removed - Local Domain Setup Abandoned)*

**Files Modified**: `vite.config.js`, new doc created

---

#### Issue #63: Missing VITE_SPOTIFY_CLIENT_ID
**Status**: Ô£à **RESOLVED**
**Severity**: HIGH

**Problem**: Alert "Missing VITE_SPOTIFY_CLIENT_ID" despite `.env` file existing with correct variable.

**Root Cause**: `vite.config.js` had `root: 'public'` which changed envDir to look inside `public/` instead of project root.

**Fix**: Added `envDir: '../'` to `vite.config.js` to explicitly point to project root.

**Files Modified**: `vite.config.js`

**Lesson Learned**: When using non-root `root` config in Vite, must explicitly set `envDir`.

---

### Issues #59-62: Sprint 9+10 Bugs - ALL RESOLVED (2025-12-18)
**Status**: Ô£à **RESOLVED**
**Date**: 2025-12-18 22:00
**Severity**: HIGH ÔåÆ CRITICAL
**Commits**: `da77600`, `7ccf410`, `08054a6`

| Issue | Problem | Fix |
|-------|---------|-----|
| #59 | Loading spinner persistent | Added `loadingContainer` div, use `this.isLoading` state |
| #60 | Scroll/DragDrop UX poor | Added `min-h`, `custom-scrollbar`, `drop-zone-padding` |
| #61 | Regenerate browser freeze | Fixed invalid algorithm ID, reset `isGenerating` flag |
| #62 | Race condition AlbumsView | Added unmount guard check in `updateAlbumsGrid()` |

---

### Issue #57: Sprint 9 - Frontend Filter Regression (Albums Not Displaying)
**Status**: ­ƒº¬ **TESTING** (Frontend Fix Applied - Awaiting User Verification)
**Date**: 2025-12-18 00:45
**Updated**: 2025-12-18 01:20
**Severity**: CRITICAL (Blocked All Album Display)
**Type**: State Management / Filter Logic
**Component**: `AlbumsView.js`

#### Problem
After implementing Sprint 9 features (Source filter dropdown, dynamic badges), all 39 albums in the user's library stopped displaying. Console showed:
```
[AlbumsView] After filterAlbums: filtered= 0 from albums= 39
```

#### Failed Attempts

| # | Time | Attempt | Result |
|---|------|---------|--------|
| 1 | 00:51 | Fixed `isBrowsingAll` to use `this.filters.source` instead of `this.filters.status` | ÔØî FAILED - `isBrowsingAll` still false |
| 2 | 01:03 | Disabled expansion filter (`album.addedBy !== 'expansion'`) | ÔØî FAILED - Still 0 albums, `addedBy` was all `undefined` anyway |
| 3 | 01:08 | Updated event listeners from `#statusFilter`/`#bestEverOnly` to `#sourceFilter` | ÔØî FAILED - Filter state still not updating correctly |
| 4 | 01:13 | **Inspected constructor** - found `this.filters` initialized with OLD keys | Ô£à ROOT CAUSE FOUND |

#### Root Cause
**Constructor Initialization Mismatch**: The `AlbumsView` constructor (lines 33-38) was still initializing `this.filters` with the OLD schema:
```javascript
// BUG (old schema)
this.filters = {
  artist: 'all',
  year: 'all',
  status: 'all',        // ÔåÉ removed from HTML
  bestEverOnly: false   // ÔåÉ removed from HTML
}
```

This caused `this.filters.source` to be `undefined`, so the condition `this.filters.source === 'all'` evaluated to `false`, making `isBrowsingAll = false`, which then triggered incorrect filtering logic.

#### Fix Applied
Updated constructor to use new schema:
```javascript
this.filters = {
  artist: 'all',
  year: 'all',
  source: 'all'  // NEW: Options: all, pending, acclaim, popularity, ai
}
```

#### Files Modified
- `public/js/views/AlbumsView.js`:
  - Constructor filter initialization (line 33-38)
  - `filterAlbums()` isBrowsingAll condition (line 560-565)
  - Event listeners for source filter (line 990-1005, 1076-1090)

#### Lessons Learned
1. When changing filter schema, update ALL 3 places: HTML, event listeners, AND constructor
2. Check constructor initialization when state appears undefined
3. Browser cache can hide JS changes - use hard refresh (Ctrl+Shift+R)

---

### Issue #58: Sprint 9 - Badge Shows "PENDING" Despite BestEver Data
**Status**: ­ƒÜº **IN PROGRESS** (Awaiting Investigation)
**Date**: 2025-12-18 01:30
**Updated**: 2025-12-18 01:45
**Severity**: HIGH (UI Bug - Incorrect Status Display)
**Type**: Data Flow / API Response
**Component**: `/api/enrich-album`, `client.js`, `AlbumsView.js`

#### Problem
Albums display "PENDING" badge in UI even though:
1. BestEver enrichment IS being called (`[APIClient] Enriching album with BestEver data...`)
2. Scraper DOES return `albumId` (confirmed via CLI test: `albumId: "144"` for Led Zeppelin IV)
3. "Ranked by Acclaim" section shows tracks with ratings (proving data is being fetched)

#### Evidence (Frontend Console)
```
client.js:63 [APIClient] Enriching album with BestEver data...
albumCache.js:87 ­ƒÆ¥ Cached: Led Zeppelin - Led Zeppelin IV (Remastered)
AlbumsView.js:1731 [AlbumsView] After filterAlbums: filtered= 39 from albums= 39
```
Albums ARE being enriched and cached, but badge shows PENDING.

#### Code Analysis (Correct Path)
1. `besteveralbums.js:550` ÔåÆ Returns `{ albumId: parsed.albumId, ... }` Ô£à
2. `index.js:191` ÔåÆ Returns `bestEverInfo: { albumId: bestEver.albumId, ... }` Ô£à
3. `client.js:127` ÔåÆ Saves `bestEverAlbumId: enrichment.bestEverInfo?.albumId` Ô£à
4. `AlbumsView.js:360` ÔåÆ Badge logic: `hasBestEver = !!album.bestEverAlbumId` Ô£à

#### Suspected Root Cause
The `/enrich-album` endpoint may NOT be returning `bestEver.albumId` in some cases. Need to:
1. Add debug log to `/api/enrich-album` to confirm `bestEver.albumId` value
2. Verify frontend is receiving the response correctly

#### Next Steps (Tomorrow)
1. Check **server logs** for `/enrich-album` response
2. Add `console.log` to `client.js:72` to log full `enrichment` response
3. Verify `bestEver.albumId` is populated in scraper response

---

### Issue #56: HomeView Type Filter Layout Regression
**Status**: ÔÅ©´©Å **DEFERRED** (Moved to Backlog)
**Date**: 2025-12-17 18:00
**Updated**: 2025-12-17 19:15
**Severity**: MEDIUM
**Type**: UI Layout / Template Injection
**Component**: `HomeView.js`

#### Problem
Attempted to add Album Type Filter checkboxes (Singles, Live, Compilations) to the Artist Search results in HomeView. Multiple implementation approaches caused severe layout regressions where the results grid overlapped with other UI elements (Staging Area).

#### Failed Attempts

| # | Time | Attempt | Result |
|---|------|---------|--------|
| 1 | 18:05 | Inject filter UI via `container.innerHTML` | ÔØî FAILED - Destroyed existing DOM structure |
| 2 | 18:20 | Switch container from `absolute` to `relative` | ÔØî FAILED - Broke intended overlay UX |
| 3 | 18:35 | Add filters to `render()` template (Option A) | ÔØî FAILED - Still had layout issues |

#### Root Cause Analysis
1. **Architectural Issue**: Original implementation defines `artistResultsContainer` in the HTML template with specific CSS (`absolute inset-0`)
2. **My Approach**: Overwrote `container.innerHTML` dynamically, destroying the template structure
3. **Correct Approach**: Should only update `grid.innerHTML` without touching the container

#### Resolution
- **Rolled back** all filter-related changes using `git checkout HEAD -- HomeView.js`
- **Kept** the MusicKit API enhancement (Task 2) which was implemented separately and works correctly
- **Deferred** the Type Filter feature to backlog for proper architectural refactoring

#### Lessons Learned
1. Don't make multiple incremental patches without validating each
2. Understand the existing template structure before modifying
3. For UI changes, consider extracting to a separate component

#### Files Modified
- `public/js/views/HomeView.js` - Rolled back, then added only MusicKit API change

---

### Issue #55: Ghost Playlists / Batch Context Contamination
**Status**: ­ƒº¬ **TESTING** (Awaiting User Verification)
**Date**: 2025-12-17 00:18
**Updated**: 2025-12-17 01:40
**Severity**: HIGH
**Type**: State Management / Cache Contamination
**Component**: `PlaylistsStore`, `PlaylistsView`, `SavedPlaylistsView`

#### Problem
When creating new playlists, system always detected as "editing existing batch" because old `batchName` and `savedAt` values from localStorage contaminated new sessions.

#### Related Issue
Similar to Issue #22 (Ghost Albums) - same pattern of stale cache contaminating new data.

#### Failed Attempts

| # | Time | Attempt | Result |
|---|------|---------|--------|
| 1 | 00:18 | Detect edit mode via `playlists[0]?.savedAt` | ÔØî FAILED - localStorage recovery loaded old playlists with savedAt |
| 2 | 00:32 | Preserve batch context when regenerating | ÔØî FAILED - Made problem worse, now ALL saves were "updates" |
| 3 | 00:52 | Added `clearBatchContext()` method | ÔØî FAILED - Order issue: clear before navigate, but localStorage recovery AFTER mount |
| 4 | 01:22 | State Machine Pattern (user approved) | ­ƒº¬ TESTING |

#### Root Cause Analysis
1. **LocalStorage Recovery**: `loadFromLocalStorage()` restores playlists with old `batchName`/`savedAt`
2. **Execution Order**: `clearBatchContext()` called before navigation, but `loadFromLocalStorage()` in mount() restored context
3. **No Explicit Mode**: System inferred edit/create from playlist metadata instead of explicit state

#### Final Fix (Attempt #4): State Machine + URL Pattern
**Implementation:**
- `PlaylistsStore.mode`: 'CREATING' | 'EDITING' - explicit mode
- `PlaylistsStore.editContext`: { batchName, seriesId, savedAt } when editing
- `setEditMode()` / `setCreateMode()` methods for explicit transitions
- `isEditingExistingBatch()` method for checking mode
- URL param `?edit=batchName` for persistence across refresh
- `PlaylistsView.mount()` reads URL and sets mode accordingly

**Files Modified:**
- `playlists.js` - State machine implementation
- `PlaylistsView.js` - mount() reads URL, handleSaveToHistory uses store.mode
- `SavedPlaylistsView.js` - handleEditBatch navigates with ?edit= param
- `AlbumsView.js` - uses setCreateMode()

---

### Issue #54: Edit Batch Not Overwriting
**Status**: ­ƒº¬ **TESTING** (Awaiting User Verification)
**Date**: 2025-12-17 00:00
**Updated**: 2025-12-17 09:40
**Severity**: HIGH
**Type**: Logic Bug
**Component**: `PlaylistsView._savePlaylistsToFirestore()`

#### Problem
When editing an existing batch:
1. Click "Edit" (pencil icon) on batch
2. Make changes (move tracks, regenerate)
3. Click "Save to Series History"
4. **Expected**: Overwrites existing batch
5. **Actual**: Creates new playlists with default name

#### Failed Attempts

| # | Time | Attempt | Result |
|---|------|---------|--------|
| 1 | 23:20 | Add debug logs to detect `savedAt` | Ôä╣´©Å INFO - Revealed `savedAt` was being lost |
| 2 | 23:36 | Skip modal if `isEditingExistingBatch` true | ÔØî FAILED - `handleGenerate()` cleared `savedAt` |
| 3 | 23:58 | Preserve batch context in `handleGenerate()` | ÔØî PARTIAL - Worked for regenerate, but broke "Add Playlists" |
| 4 | 00:52 | Add `clearBatchContext()` for create-mode separation | ÔØî FAILED - localStorage recovery restored context |
| 5 | 01:22 | State Machine Pattern | ÔØî PARTIAL - Mode works, but IDs change on regenerate |
| 6 | 09:40 | Delete old batch before saving new | ­ƒº¬ TESTING |

#### Root Cause (Final)
**Regenerate creates NEW playlist IDs.** When saveToFirestore runs, it uses `playlist.id` for upsert, so if IDs changed (from regeneration), it creates NEW documents instead of updating existing ones.

#### Final Fix (Attempt #6)
1. In `_savePlaylistsToFirestore()` for OVERWRITE mode:
   - Delete ALL playlists with matching `batchName` first
   - Then call `setBatchName()` on new playlists
   - Then save new playlists

**Additional fix: Playlist Order**
- Added `order` field (0, 1, 2...) when saving playlists
- Sort by `order` when loading in `handleEditBatchPlaylists()`
- Preserves Greatest Hits ÔåÆ DC1 ÔåÆ DC2 ÔåÆ ... sequence

---
**Status**: Ô£à **RESOLVED**
**Date**: 2025-12-15 14:07
**Severity**: CRITICAL (Blocks Series Navigation)
**Type**: State Management / Render Bug
**Component**: `AlbumsView.js`, `router.js`

#### Problem
When navigating to a specific series (e.g., Series 5.1 via URL `/albums?seriesId=...`), the album data is **successfully fetched from cache**, but the UI shows an **empty grid**. The "All Albums Series" view works correctly.

#### Root Cause (FINAL)
**Multiple interacting issues discovered:**

1. **Phantom Click Navigation** Ô£à FIXED
   - TopNav re-render after auth was triggering a click event on the "Albums" link
   - Navigation from `/albums?seriesId=...` to `/albums` (ALL view) destroyed the SINGLE series view
   - **Fix**: Added `e.isTrusted` and `e.detail` checks in `router.js` interceptor

2. **Wrong Container ID** Ô£à FIXED (ROOT CAUSE)
   - `updateAlbumsGrid()` was looking for `#albumsGrid` and `#albumsList`
   - **BUT** the actual HTML template uses `#albumsContainer`!
   - Logs showed `List element found: false` - the IDs simply didn't exist in DOM
   - **Fix**: Changed `updateAlbumsGrid` to use `#albumsContainer`

#### Failed Attempts

| # | Date | Attempt | Result |
|---|------|---------|--------|
| 1 | 12:00 | Bump cache version to 3.0 | ÔØî Data WAS loading |
| 2 | 12:15 | `await loadScope` in mount | ÔØî Timing improvement but still empty |
| 3 | 12:45 | Add debug logs to subscription | Ôä╣´©Å Revealed data loading correctly |
| 4 | 12:55 | Add router navigate trace logs | Ô£à Discovered phantom click |
| 5 | 13:05 | Block phantom clicks in router | Ô£à Fixed navigation hijack |
| 6 | 13:15 | Adjust guard logic for SINGLE scope | ÔÜá´©Å Partial - logs showed "rendering 5 albums" |
| 7 | 13:35 | Add viewMode debug logs | Ô£à Discovered `List element found: false` |
| 8 | 13:50 | **Change to `#albumsContainer`** | Ô£à **FIX CONFIRMED** |

#### Files Modified
- `public/js/router.js` - Phantom click protection
- `public/js/views/AlbumsView.js` - Container ID fix + guard logic

#### Tech Debt
> [!NOTE]
> **RESOLVED**: The ViewMode logic refactoring was completed using **Strategy Pattern**.
> See `public/js/views/strategies/ViewModeStrategy.js`

---

### Issue #53: Ranked by Acclaim Not Loading Ratings - Ô£à RESOLVED
**Status**: Ô£à **RESOLVED**
**Date**: 2025-12-15 16:38
**Severity**: CRITICAL (Core Feature Broken)
**Type**: Backend Bug
**Component**: `server/index.js`, `besteveralbums.js`

#### Problem
"Ranked by Acclaim" tracklist showing all ratings as `null`, even though BestEverAlbums data was being scraped successfully (11 tracks with ratings found).

#### Root Cause
**Property Name Mismatch**: The `/api/enrich-album` endpoint in `server/index.js` was checking `e.title`, but the BestEverAlbums scraper returns `e.trackTitle`.

```javascript
// BUG (line 154)
if (e.title && e.rating !== undefined ...) // e.title is UNDEFINED!

// FIX
const trackTitle = e.trackTitle || e.title
if (trackTitle && e.rating !== undefined ...)
```

#### Evidence
```bash
# Scraper returns correct data:
{ trackTitle: "Light My Fire", rating: 92 }
{ trackTitle: "Break On Through (To The Other Side)", rating: 91 }

# But endpoint couldn't match because it was looking for `e.title`
```

#### Fix Applied
- `server/index.js:154` - Changed `e.title` to `e.trackTitle || e.title`
- Added debug logging for evidence matching

#### Related: Album Loading Improvement
Also increased Apple Music search limit from 1 to 5 in `client.js` to allow better scoring/selection of Standard editions over Deluxe/Remastered.

---

### Issue #47: Sortable Drag & Drop Freeze - RESOLVED Ô£à (TECH DEBT)
**Status**: Ô£à **RESOLVED** - *Marked as Tech Debt for refactor*
**Date**: 2025-12-14 01:05
**Type**: Frontend/UI Bug
**Component**: `PlaylistsView.js`, SortableJS

> [!WARNING]
> **TECH DEBT**: Current fix uses multiple flags and timing hacks. Needs architectural refactor.
> See "Tech Debt Notes" section below.

#### Problem
After performing one drag & drop operation in the Playlist Management view, the UI would freeze:
- Subsequent drags didn't work
- Buttons (Export, Save, etc.) stopped responding
- No errors appeared in console

#### Root Cause
Architectural conflict: SortableJS manipulates DOM directly, but `update()` recreates DOM via `innerHTML`. These patterns are incompatible.

#### Failed Attempts
| # | Action | Result |
|---|--------|--------|
| 1 | Added `isDragging` flag, set false at start of `onEnd` | ÔØî Flag reset BEFORE store update, so `update()` ran with `isDragging=false` |
| 2 | Moved flag reset to `requestAnimationFrame()` after store call | Ô£à Drags work, ÔØî Buttons freeze (listeners lost) |
| 3 | Reset `exportListenersAttached=false` before section re-render | Ô£à Buttons work, ÔØî Track counts/durations don't update |
| 4 | Added `this.update()` inside `requestAnimationFrame` | Ô£à Works but creates complex timing dependencies |

#### Fix Applied (Current - Needs Refactor)
```javascript
// Constructor
this.isDragging = false
this.exportListenersAttached = false

// onStart
this.isDragging = true

// onEnd
requestAnimationFrame(() => {
  this.isDragging = false
  this.update()  // Deferred update
})

// update()
if (!this.isDragging) {
  grid.innerHTML = this.renderPlaylists(playlists)
}
this.exportListenersAttached = false  // Reset before re-render
```

#### Tech Debt Notes
Current solution works but has code smells:
- Multiple state flags (`isDragging`, `exportListenersAttached`)
- Timing dependency via `requestAnimationFrame`
- Logic scattered across multiple methods

**Proper solution (TODO)**: 
1. Use partial DOM updates for metadata only (track counts, durations)
2. Or: Re-initialize Sortable after each `update()`
3. Or: Adopt reactive framework (Preact/lit-html)

#### Files Modified
- `public/js/views/PlaylistsView.js`: Added flags and timing logic

---

### Issue #46: Duplicate Export to Apple Music Calls - RESOLVED Ô£à
**Status**: Ô£à **RESOLVED**
**Date**: 2025-12-14 00:25
**Type**: Frontend/Event Handling Bug
**Component**: `PlaylistsView.js`

#### Problem
When clicking "Export to Apple Music", the export ran **twice**:
- Console showed duplicate logs for every search and playlist creation
- Could cause race conditions or duplicate playlists

#### Root Cause
`attachExportListeners()` was called twice:
1. In `mount()` during view initialization
2. In `update()` every time the view re-rendered

Each call added **new** event listeners without removing old ones.

#### Fix Applied
Added `exportListenersAttached` flag to prevent duplicate attachment:
```javascript
constructor() {
  this.exportListenersAttached = false
}

attachExportListeners() {
  if (this.exportListenersAttached) return
  // ... attach listeners ...
  this.exportListenersAttached = true
}
```

#### Files Modified
- `public/js/views/PlaylistsView.js`: Added listener attachment guard

---

### Issue #45: Apple Music Export Region Issue (72 Seasons) - RESOLVED Ô£à
**Status**: Ô£à **RESOLVED**
**Date**: 2025-12-14 00:15
**Type**: API/Integration Bug
**Component**: `MusicKitService.js`
**Related**: Issue #39 (Track Export Failed)

#### Problem
When exporting playlists to Apple Music:
- Tracks from Metallica "72 Seasons" album were NOT appearing in created playlists
- Tracks from other albums (AC/DC, Ozzy, Judas Priest) appeared correctly
- Console showed tracks were "found" with valid track IDs
- API returned 201 (success) for playlist creation

#### Investigation
1. Confirmed track IDs were being sent in API payload (e.g., `1655432388`)
2. Playlist creation succeeded (status 201)
3. But tracks didn't appear in Apple Music library

#### Root Cause
`MusicKitService.js` had **hardcoded US region** for catalog searches:
```javascript
// Line 426
await this.music.api.music(`/v1/catalog/us/search`, {...})
```
User was in **Brazil** - track IDs from US catalog may have different IDs or availability in BR catalog.

#### Fix Applied
Added dynamic storefront detection:
```javascript
_getStorefront() {
  if (this.music?.storefrontId) {
    return this.music.storefrontId  // e.g., 'br' for Brazil
  }
  return 'us'  // fallback
}

// Changed 5 occurrences:
await this.music.api.music(`/v1/catalog/${this._getStorefront()}/search`, {...})
```

#### Files Modified
- `public/js/services/MusicKitService.js`: Added `_getStorefront()` helper, replaced 5 hardcoded `/catalog/us/` references

#### Verification
After fix, tracks from all albums including 72 Seasons appeared correctly in Apple Music playlists.

---

### Issue #44: MusicKit 503 Error - Export to Apple Music Failed - RESOLVED Ô£à
**Status**: Ô£à **RESOLVED**
**Date**: 2025-12-13 20:52
**Type**: Cloud/IAM Configuration Bug
**Component**: Cloud Run, Secret Manager

#### Problem
"Export to Apple Music" button returned 503 error: `"MusicKit not configured"`.
The `/api/musickit-token` endpoint failed despite secrets being configured in Cloud Run.

#### Key Observation
- `AI_API_KEY` secret worked fine (tested via `/api/list-models`).
- Only MusicKit secrets (`APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_MUSIC_PRIVATE_KEY`) were failing.

#### Root Cause
The Cloud Run Service Account (`540062660076-compute@developer.gserviceaccount.com`) **lacked IAM permissions** to access the MusicKit secrets in Secret Manager.

| Secret | IAM Binding Before |
|--------|-------------------|
| `AI_API_KEY` | Ô£à Had `secretAccessor` |
| `musickit-team-id` | ÔØî No bindings |
| `musickit-key-id` | ÔØî No bindings |
| `musickit-private-key` | ÔØî No bindings |

#### Fix Applied
1. Added `Secret Manager Secret Accessor` role to the 3 MusicKit secrets via GCP Console.
2. Forced new Cloud Run revision:
   ```bash
   gcloud run services update mjrp-proxy --region=southamerica-east1 --project=mjrp-playlist-generator --update-env-vars="FORCE_RESTART=$(date +%s)"
   gcloud run services update-traffic mjrp-proxy --to-latest --region=southamerica-east1 --project=mjrp-playlist-generator
   ```

#### Verification
```bash
curl https://mjrp-playlist-generator.web.app/api/musickit-status
# {"configured":true,"missing":[]}
```

---

### Issue #43: Production Worker Dependency Failure (uFuzzy) - RESOLVED Ô£à
**Status**: Ô£à **RESOLVED**
**Date**: 2025-12-13 13:00
**Type**: Build/Bundling Bug
**Component**: `search.worker.js`, `uFuzzy.js`

#### Problem
In production, `search.worker.js` failed with `Uncaught NetworkError: Failed to execute 'importScripts'...`.
The external dependency `../vendor/uFuzzy.js` could not be loaded because the worker was bundled into `assets/` while `vendor/` remained in the root (or path resolution failed).

#### Fix Applied
1.  Converted `search.worker.js` to an ES Module (`import uFuzzy from ...`).
2.  Modified `uFuzzy.js` to `export default uFuzzy`.
3.  Vite now bundles the dependency *inline* into the worker chunk.

#### Verification
- Worker file size increased (~9kb), confirming bundling.
- Production deploy confirmed working.

---

### Issue #42: Worker 404 / SyntaxError in Production - RESOLVED Ô£à
**Status**: Ô£à **RESOLVED**
**Date**: 2025-12-13 12:50
**Type**: Build/Path Bug
**Component**: `OptimizedAlbumLoader.js`

#### Problem
Web Worker failed to initialize with `SyntaxError: Unexpected token '<'`.
This meant the browser was receiving `index.html` (404 fallback) instead of the JS file.
Caused by `new Worker('/js/workers/search.worker.js')` pointing to a source path that doesn't exist in the hashed production build.

#### Fix Applied
Refactored `OptimizedAlbumLoader.js` to use Vite's worker import syntax:
```javascript
import SearchWorker from '../workers/search.worker.js?worker';
this.worker = new SearchWorker();
```
This ensures Vite correctly bundles and hashes the worker file.

---

### Issue #41: Cover Art Loading Issues - IN PROGRESS
**Status**: ­ƒÜº **IN PROGRESS**
**Date**: 2025-12-13
**Type**: UI Bug
**Component**: `AlbumCard.js`, `OptimizedAlbumLoader.js`

#### Problem
Cover art sometimes fails to load or flickers in album cards.
Sync/Async hydration mismatch suspected.

---

### Issue #40: Autocomplete UX Improvements - IN PROGRESS
**Status**: ­ƒÜº **IN PROGRESS**
**Date**: 2025-12-13
**Type**: UX Improvement
**Component**: `HomeView.js`

#### Request
Refine "Load Albums" form.
- **Goal**: Split autocomplete into Artist Filter + Album Selection.
- **Goal**: Allow direct album entry if not found.

---

### Issue #39: Track Export Failed (Missing Tracks) - IN PROGRESS
**Status**: ­ƒÜº **IN PROGRESS**
**Date**: 2025-12-13
**Type**: Data Bug
**Component**: `PlaylistExport.js`

#### Problem
Some albums (e.g. *72 Seasons* by Metallica) fail to export tracks or show missing tracks in generated playlists.
Need to investigate if this is a matching issue or data validation failure.

---

### Issue #38: Autocomplete TypeError (Sync/Async Mismatch) - RESOLVED Ô£à
**Status**: Ô£à **RESOLVED - USER CONFIRMED**
**Date**: 2025-12-13 00:20
**Type**: Implementation Bug
**Component**: `Autocomplete.js`, `OptimizedAlbumLoader.js`

#### Problem
User reported `TypeError: results.map is not a function` in the browser console when typing in the search box. Autocomplete dropdown did not appear.

#### Root Cause
Contract mismatch between the legacy `AlbumLoader` (synchronous) and the new `OptimizedAlbumLoader` (asynchronous, Promise-based).
- `Autocomplete.js` assumed `this.loader.search()` returned an array immediately.
- `OptimizedAlbumLoader.search()` returns a `Promise` (because it talks to a Web Worker).
- `results` was a Promise object, which does not have a `.map()` method.

#### Failed Attempts
- **Implicit Assumption**: The initial refactor didn't update the call site in `Autocomplete.js` to handle the asynchronous nature of the new loader, assuming interface compatibility was 1:1.

#### Fix Applied
Updated `Autocomplete.js` to `await` the result of `performSearch`:
```javascript
// Autocomplete.js
async performSearch(query) {
    try {
        const results = await this.loader.search(query, 50) 
        this.renderResults(results)
// ...
```

#### Files Modified
- `public/js/components/Autocomplete.js`

#### Verification
- [x] Code reviewed: `await` keyword added.
- [x] Data verification: `generate-autocomplete-index.cjs` confirmed to include `artworkTemplate` for thumbnails.

---

### Issue #37: Apple Sign-In Invalid Redirect URL - RESOLVED Ô£à
**Status**: Ô£à **RESOLVED - USER CONFIRMED**
**Date**: 2025-12-11 22:15 ÔåÆ 23:35
**Type**: Configuration
**Component**: Apple Developer Portal, Firebase Console

#### Problem
Apple Sign-In popup showed `invalid_request: Invalid web redirect url` error.
The CSP (Content Security Policy) was also blocking fonts and scripts from Apple CDNs.

#### Failed Attempts
1. **Attempt 1**: Added `mjrp-albums.firebaseapp.com` to Apple Portal Return URLs.
   - **Result**: Still failed. Assumed wrong domain.
2. **Attempt 2**: Added `mjrp-playlist-generator.web.app` to Apple Portal.
   - **Result**: Still failed. Firebase uses `.firebaseapp.com` for auth, not `.web.app`.
3. **Attempt 3**: Updated CSP in `index.html` to allow Apple fonts (`data:` URIs).
   - **Result**: Partial fix. CSP errors resolved but redirect URL error persisted.
4. **Attempt 4**: CSP too strict, broke production (blocked Tailwind/Firebase CDNs).
   - **Result**: Had to widen CSP to include `cdn.tailwindcss.com`, `www.gstatic.com`.

#### Root Cause
Firebase `authDomain` was configured as `mjrp-playlist-generator.firebaseapp.com`, but Apple Portal only had:
- `mjrp-albums.firebaseapp.com` (wrong project)
- `mjrp-playlist-generator.web.app` (wrong domain type)

The correct domain/Return URL was **never configured**.

#### Fix Applied
1. **Apple Developer Portal** (Identifiers > Service IDs > MJRP Web Auth > Configure):
   - Added to **Domains**: `mjrp-playlist-generator.firebaseapp.com`
   - Added to **Return URLs**: `https://mjrp-playlist-generator.firebaseapp.com/__/auth/handler`
2. **CSP Fix**: Updated `public/index.html` to allow Tailwind, Firebase, and Apple CDNs.

#### Files Modified
- `public/index.html` (CSP meta tag)

#### Lesson Learned
Always verify `authDomain` in `firebase-config.js` before configuring Apple Portal Return URLs.
The redirect URL format is: `https://{authDomain}/__/auth/handler`.

---

### Issue #36: Auth Integration Regressions - RESOLVED Ô£à
**Status**: Ô£à **RESOLVED - USER CONFIRMED**
**Date**: 2025-12-11 19:15 ÔåÆ 19:40
**Type**: Regression
**Component**: `HomeView.js`, `AlbumsView.js`, `TopNav.js`

#### Problem
After abstracting the Auth/UserStore logic, several regressions appeared:
1. **HomeView**: `ReferenceError: series is not defined` when creating a series.
2. **TopNav**: "Albums" link broke (`seriesId=undefined`), and "Sign In" button was missing for guests.
3. **AlbumsView**: Deleting an album crashed the app if the parent series was also deleted (Ghost Series context).

#### Root Cause
1. **HomeView**: Code wrapper for `try/catch` accidentally removed the `const series = ...` definition.
2. **TopNav**: Logic assumed verified user; didn't handle `isAnonymous` correctly. Link generation didn't have a fallback for `undefined` series.
3. **AlbumsView**: Delete handler assumed `activeSeries` always existed.

#### Fix Applied
1. **HomeView**: Restored `series` object definition.
2. **TopNav**:
    - Added explicit `if (currentUser.isAnonymous)` check to show "Sign In".
    - Fixed `getAlbumsSeriesLink` to return base `/albums` if no series active.
3. **AlbumsView**: Added defensive `if (!activeSeries)` check to prevent crash during deletion.

#### Files Modified
- `public/js/views/HomeView.js`
- `public/js/views/AlbumsView.js`
- `public/js/components/TopNav.js`

---

### Issue #35: Firebase Initialization & SDK Mismatch - RESOLVED Ô£à
**Status**: Ô£à **RESOLVED**
**Date**: 2025-12-11 18:00 ÔåÆ 19:10
**Type**: Architecture/Infrastructure
**Component**: `app.js`, `firebase-init.js`, `AuthService.js`, `Repositories`

#### Problem
The application failed to load with multiple errors:
1. `No Firebase App '[DEFAULT]' has been created` - calling `getAuth/getFirestore` before `initializeApp`.
2. `Expected first argument to collection() to be a CollectionReference` - Mixing CDN imports with NPM imports.

#### Root Cause
1. **Module Evaluation Order**: `AuthService.js` and Repositories were instantiating `getAuth()` at the top level.
2. **Hybrid Import Strategy**: Firebase SDK treats objects from CDN and NPM as different instances.

#### Fix Applied
1. **Centralized Initialization**: Created `public/js/firebase-init.js` with lazy initialization.
2. **Lazy Loading**: Refactored `AuthService` to access `this.auth` via a getter.
3. **Standardization**: Converted **ALL** repositories to use NPM imports exclusively.

#### Files Modified
- `public/js/firebase-init.js` (Created)
- `shared/services/AuthService.js`
- `public/js/app.js`
- `public/js/repositories/*.js`

---

### Issue #34: Generate Playlists API Returns 500 - RESOLVED Ô£à
**Status**: Ô£à **RESOLVED - USER CONFIRMED**
**Date**: 2025-12-10 00:00 ÔåÆ 10:23
**Type**: Backend API Error
**Component**: `server/index.js`, `shared/curation.js`

#### Problem
When clicking "Generate Playlists" in production, the API returns HTTP 500:
```
/api/playlists:1 Failed to load resource: the server responded with a status of 500 ()
client.js:193 Playlist generation failed: Error: HTTP 500:
```

#### Root Cause (Found via Cloud Run Logs)
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/usr/src/public/js/curation.js' 
imported from /usr/src/app/index.js
```

The Docker container only has:
- `/usr/src/app/` ÔåÆ server code
- `/usr/src/shared/` ÔåÆ shared modules

It does NOT have `/usr/src/public/` - that folder is only for frontend.

The `server/index.js` was importing:
```javascript
await import('../public/js/curation.js')  // ÔØî Path doesn't exist in container
```

#### Fix Applied (10:20)
1. **Copied `curation.js` to `shared/` folder**:
   ```bash
   cp public/js/curation.js shared/curation.js
   ```

2. **Fixed import in `shared/curation.js`**:
   ```diff
   - import { normalizeKey } from './shared/normalize.js'
   + import { normalizeKey } from './normalize.js'
   ```

3. **Updated `server/index.js`**:
   ```diff
   - await import('../public/js/curation.js')
   + await import('../shared/curation.js')
   ```

4. **Deployed backend**:
   - New revision: `mjrp-proxy-00064-5rz`

#### Verification
- [x] Local import test passed
- [x] Backend deployed successfully
- [x] **USER CONFIRMED**: Generate playlists working at 10:23

---

### Issue #33: Frontend Module Resolution Error (axios) - RESOLVED Ô£à
**Status**: Ô£à **RESOLVED - USER CONFIRMED**
**Date**: 2025-12-09 22:46 ÔåÆ 23:54
**Type**: Build/Production Bug
**Component**: `firebase.json`, `vite.config.js`, `public/index.html`, `scripts/deploy-prod.sh`

#### Problem
After deploying Frontend to Firebase Hosting, browser shows:
```
Uncaught TypeError: Failed to resolve module specifier "axios". Relative references must start with either "/", "./", or "../".
```
App stuck at "Loading..." - completely broken in production.

#### Root Cause Analysis
**The REAL issue was `firebase.json`:**
- `"public": "public"` ÔåÆ Serves **source files** directly
- Should be `"public": "dist"` ÔåÆ Serves **Vite build output**

Firebase Hosting was bypassing Vite entirely, serving unbundled source files.
Browsers cannot resolve `import axios from 'axios'` (bare module specifier) without a bundler.

**Per `V2.0_DEPLOYMENT_IMPACT.md` (line 54)**, this should have been changed but was never applied.

#### Failed Attempts

**Attempt #1: Add Axios CDN + Remove Import** (22:48)
- Added CDN script, commented out import
- **Result**: ÔØî FAILED - Still serving source files

**Attempt #2: Add Vite Externalization Config** (23:00)
- Added `external: ['axios']` + `output.globals`
- **Result**: ÔØî FAILED - Firebase still serving source, not dist

**Attempt #3: Remove Externalization** (23:28)
- Removed `external: ['axios']` from vite.config.js
- Removed CDN script from index.html
- **Result**: ÔÜá´©Å PARTIAL - Build correct, but firebase.json still wrong

**Attempt #4: Fix firebase.json** (23:39)
- Changed `"public": "public"` ÔåÆ `"public": "dist"`
- **Result**: ÔÜá´©Å PARTIAL - App loads but firebase-config.js 404

**Attempt #5: Add static files copy step** (23:50) Ô£à
- Updated `deploy-prod.sh` to copy static files to dist/
- **Result**: Ô£à SUCCESS - User confirmed app works

#### Final Solution

1. **`firebase.json`**: Changed `"public": "dist"`
2. **`vite.config.js`**: Removed `external: ['axios']`
3. **`public/index.html`**: Removed CDN script
4. **`deploy-prod.sh`**: Added `npm run build` + static files copy step

#### Files Modified
- `firebase.json`: Changed public directory to `dist`
- `vite.config.js`: Cleaned up axios workarounds
- `public/index.html`: Removed CDN script
- `scripts/deploy-prod.sh`: Added build + static files copy
- `docs/devops/V2.0_DEPLOYMENT_IMPACT.md`: Added status note

#### Verification
- [x] Build succeeds (`npm run build`)
- [x] Bundle includes axios inline
- [x] Static files copied to dist/
- [x] Deploy: 30 files uploaded
- [x] **USER CONFIRMED**: Production working at 23:54

---

### Issue #32: Cloud Build Docker Context Failure - RESOLVED Ô£à
**Status**: Ô£à **RESOLVED**
**Date**: 2025-12-09 22:10 ÔåÆ 22:42
**Type**: CI/CD Configuration Bug
**Component**: `cloudbuild.yaml`, Cloud Build Trigger

#### Problem
Cloud Build failed with:
```
COPY failed: file not found in build context or excluded by .dockerignore: stat _shared_temp: file does not exist
```

#### Root Cause
The `Dockerfile` expects `server/_shared_temp/` directory to exist (containing shared libs copied from `shared/`). This copy step was supposed to happen BEFORE Docker build, but:
1. `cloudbuild.yaml` didn't exist in the repository
2. Cloud Build Trigger was configured as "Dockerfile" mode, not "Cloud Build config" mode

#### Failed Attempts

**Attempt #1: Create cloudbuild.yaml** (22:14)
- Created `cloudbuild.yaml` with bash step to copy shared libs before Docker build
- **Result**: ÔØî FAILED - Cloud Build Trigger ignored the file
- **Reason**: Trigger was set to "Autodetected" which found Dockerfile first

**Attempt #2: User Changed Trigger Config** (22:26)
- User changed Trigger Configuration from "Autodetected" to "Cloud Build configuration file"
- Set Location to "Repository" and path to `cloudbuild.yaml`
- **Result**: ÔØî FAILED - New error about `build.logs_bucket` invalid argument
- **Reason**: Trigger had service account that required explicit logging config

**Attempt #3: Add Logging Option** (22:34)
- Added to `cloudbuild.yaml`:
  ```yaml
  options:
    logging: CLOUD_LOGGING_ONLY
  ```
- **Result**: Ô£à SUCCESS - Build completed, Docker image pushed, Cloud Run deployed

#### Final Solution
1. Created `cloudbuild.yaml` with proper steps (copy shared ÔåÆ build ÔåÆ push ÔåÆ deploy)
2. Added `options: logging: CLOUD_LOGGING_ONLY`
3. User configured Trigger to use "Cloud Build configuration file" from Repository

---


### Issue #28: Inventory CRUD Not Working - RESOLVED Ô£à
**Status**: Ô£à **RESOLVED - FULL CRUD WORKING**
**Date**: 2025-12-08 19:05 ÔåÆ 20:14
**Type**: Inventory/CRUD Bug
**Component**: `inventory.js`, `InventoryView.js`

#### Problem
Inventory albums don't appear when visiting InventoryView the first time.

#### Failed Attempts

**Attempt #1: Added debug logs** (19:10)
- Added console.log to `InventoryStore.init()` and `InventoryView.onMount()`
- **Failed**: Logs didn't appear - because method was named `onMount` not `mount`

**Attempt #2: Renamed onMount ÔåÆ mount** (19:18)
- Router calls `this.currentView.mount()` but InventoryView had `onMount()`
- Renamed to `mount()` so Router could call it
- **Partial Success**: Logs appeared, showed `loadAlbums returned: 5 albums`
- **Still Failed**: UI showed "empty" despite 5 albums loaded

**Attempt #3: Reordered subscription** (19:21)
- The subscription to store was AFTER `await loadAlbums()`
- `loadAlbums()` calls `notify()` which fires subscription callback
- But subscription didn't exist yet when notify fired!
- **Fix**: Moved subscription BEFORE `loadAlbums()` call
- **Still Failed**: `TypeError: this.rerender is not a function`

**Attempt #4: Added missing rerender() method** (19:25)
- `this.rerender()` was called 14+ times but **never defined**
- Likely lost in a previous AI session crash
- **Fix**: Added `rerender()` method implementation
- **SUCCESS!** Ô£à

#### Root Causes (3 issues)
1. **Method naming**: `onMount()` vs `mount()` - Router expects `mount()`
2. **Subscription timing**: Must subscribe BEFORE async load so notify triggers rerender
3. **Missing method**: `rerender()` was never implemented

#### Final Solution
```javascript
// InventoryView.js
async mount() {
  // 1. Subscribe FIRST
  this.unsubscribe = inventoryStore.subscribe(() => this.rerender())
  
  // 2. THEN load (notify will trigger rerender)
  await inventoryStore.loadAlbums()
}

// Added missing method
async rerender() {
  const container = document.getElementById('app')
  const html = await this.render()
  container.innerHTML = html
  this.afterRender()
}
```

---

### Issue #31: Playlist Generate Not Using New Albums - AWAITING VERIFICATION
**Status**: ­ƒƒí **AWAITING USER VERIFICATION**
**Date**: 2025-12-09 13:00
**Type**: UI/UX Bug
**Component**: `PlaylistsView.js`

#### Problem
After generating playlists, if user adds new albums to the series and returns to Playlist view, there's no way to regenerate with the new albums - the Generate section is removed when playlists exist.

#### Root Cause
When `playlists.length > 0`, the generate section is removed (line 112) and no regenerate button exists.

#### Fix Applied
- [x] Added "Regenerate" button (btn-warning) to export section
- [x] Button calls `handleGenerate()` which uses current `albumsStore.getAlbums()`
- [x] New albums are automatically included since store is always fresh

---

### Issue #30: Album Delete Not Working - RESOLVED Ô£à
**Status**: Ô£à **RESOLVED**
**Date**: 2025-12-09 12:45 ÔåÆ 17:35
**Type**: CRUD Bug
**Component**: `AlbumsView.js`, `albumSeries.js`

#### Problem
1. Delete button had no proper handler
2. Albums returned on page refresh after delete

#### Failed Attempts

**Attempt #1 (15:30):** Added `removeAlbumFromSeries()` to albumSeries.js
- Result: Albums disappeared but reappeared on navigation
- Root Cause Found: `album` was `undefined` because ID mismatch

**Attempt #2 (17:00):** Added debug logs
- Discovered: Button ID = `david-bowie_blackstar`, Store IDs = `['the-beatles_sgt-peppers...', ...]`
- The Blackstar was in VIEW but NOT in STORE

#### Root Cause
1. **Duplicate handler:** Old handler at line 746 used native `confirm()` and only called `albumsStore.removeAlbum()` (memory-only)
2. **ID mismatch:** Album IDs from API didn't match store IDs, so `album = undefined`
3. **removeAlbumFromSeries never called:** Because album was undefined, Firestore was never updated

#### Solution Applied
1. **Removed duplicate handler** with native `confirm()`
2. **DOM fallback:** When album not in store, extract title/artist from card HTML
3. **Call removeAlbumFromSeries():** Updates `albumQueries[]` in series via Firestore
4. **Remove card from DOM:** Immediate visual feedback

#### Files Modified
- `AlbumsView.js`: New delete handler with DOM fallback, removed duplicate handler
- `albumSeries.js`: Added `removeAlbumFromSeries()` method

---


### Issue #29: Inventory Card Display & Modal Issues - RESOLVED Ô£à
**Status**: Ô£à **RESOLVED**
**Date**: 2025-12-08 21:28 ÔåÆ 21:58
**Type**: UI/UX Bug
**Component**: `InventoryView.js`, `InventoryModals.js`, `InventoryRepository.js`

#### Problem
Multiple issues with Inventory view display and modal functionality:
1. **Format Select in Modal** - Incorrect case (CD vs cd) and missing options
2. **Card Format Badge** - Always showed "CD" due to case mismatch
3. **Owned Toggle Not Working** - "No valid fields to update" error

#### Root Causes
1. `owned` was NOT in `updateAlbum` allowed fields list
2. Edit modal used uppercase values ("CD") but system expects lowercase ("cd")
3. Edit modal missing DVD/Blu-ray options

#### Fixes Applied
- [x] Added `owned` to allowed fields in `updateAlbum`
- [x] Fixed Edit modal format values to lowercase
- [x] Added all 6 format options to Edit modal
- [x] Added Cassette format across all components

#### Remaining UX TODO
- [x] Improve owned marking UX (remove confusing checkbox)
- [x] Fix total calculation to consider owned status

---

### Issue #27: Album Series CRUD Persistence Failures - AWAITING VERIFICATION
**Status**: ­ƒƒí **AWAITING USER VERIFICATION**
**Date**: 2025-12-08 17:00
**Type**: Firebase/Persistence Bug
**Component**: `albumSeries.js`, `AlbumSeriesListView.js`

#### Problem
Edit Series "Save Changes" and Delete Series operations failing due to multiple Firebase issues:
1. **Firestore permission errors** - Wrong collection path being used
2. **Serialization errors** - Not using JSON.parse/stringify for ES6 classes
3. **Cache recovery** - Items reappearing after delete on page refresh

#### Root Causes
1. `saveToFirestore()` not serializing data (`{...series}` instead of `JSON.parse(JSON.stringify(series))`)
2. `deleteSeries()` using wrong path `doc(db, 'series', id)` instead of `getSeriesCollectionPath()`
3. Delete updating localStorage BEFORE confirming Firestore success (source of truth)

#### Failed Attempts (2025-12-08)
1. **Made Firestore "optional"** - Incorrectly assumed localStorage was source of truth. User correction: ARCHITECTURE.md line 515 states Firestore IS source of truth.
2. **Fire-and-forget delete** - Tried to delete from localStorage first, then Firestore async. Wrong per architecture.
3. **Created incorrect documentation** - Made `FIRESTORE_PERMISSIONS_FIX.md` stating Firestore is optional. Had to delete.
4. **Only fixed albumSeries.js** - User tested and found albums.js also missing serialization. Album edit save failed with "custom Track object" error.

#### Additional Issue Found (2025-12-08 17:18)
**Error:** `FirebaseError: Function updateDoc() called with invalid data. Unsupported field value: a custom Track object`
**Location:** `albums.js` ÔåÆ `saveToFirestore()` line 217
**Root Cause:** Album object contains `tracks` array with `Track` class instances, not POJOs.
**Fix Applied:** ÔÅ│ Added `JSON.parse(JSON.stringify(album))` before Firestore write.

#### Solutions Applied (2025-12-08) - ÔÜá´©Å NOT VERIFIED BY USER
1. ÔÅ│ Added JSON serialization to `albumSeries.js` ÔåÆ `saveToFirestore()`
2. ÔÅ│ Fixed `deleteSeries()` to use correct collection path via `getSeriesCollectionPath()`
3. ÔÅ│ Changed order: Firestore delete FIRST, then localStorage (source of truth pattern)
4. ÔÅ│ Made db REQUIRED parameter (not optional) per ARCHITECTURE.md
5. ÔÅ│ Added JSON serialization to `albums.js` ÔåÆ `saveToFirestore()` (new fix)

---


### Issue #25: Inventory Modal Misalignment & Missing Styles - RESOLVED
**Status**: Ô£à **RESOLVED**
**Date**: 2025-12-07 01:35
**Type**: Configuration / Environment Issue
**Component**: `index-v2.html`, `vite.config.js`, `modals.css`

#### Problem
The "Add to Inventory" modal was not displaying correctly. 
- Initially reported as appearing "below the footer" (unstyled).
- Later appeared misaligned, clipped, or stuck at the bottom-left of the screen despite seemingly correct styles.
- "Add" button functionality was also initially reported as broken (likely due to modal state).

#### Root Cause
**SPA Entry Point Mismatch**: 
- The project has multiple HTML files (`index.html`, `index-v2.html`, `hybrid-curator.html`).
- The development environment (Vite) is configured in `vite.config.js` to serve `index-v2.html` for all SPA routes (`/home`, `/albums`, etc.).
- `index-v2.html` **was missing the stylesheet link** for `modals.css`.
- `hybrid-curator.html` had the link, but editing it had no effect on the running app.
- The modal appeared "styled" in later screenshots because it inherited atomic classes from Tailwind (e.g., `bg-black`, `rounded`), but missed the crucial **layout rules** (`position: fixed`, `z-index`, `centering`) which were defined only in `modals.css`.

#### Failed Attempts
1. **Inline JS Styles**: Attempted to inject `z-index` and `position` directly via `InventoryModals.js`. Failed because it fought with CSS reset/defaults and introduced maintenance complexity.
2. **Reverting Code**: Reverted `InventoryModals.js` simply to restore "old behavior", assuming a code regression. This brought back the unstyled `<div>` at the bottom of the body.
3. **Fixing Wrong HTML**: Changed `./css/modals.css` to `/css/modals.css` in `hybrid-curator.html`. Failed to affect the app because the user was viewing `index-v2.html`.
4. **Tailwind Class Checks**: Suspected Tailwind conflicts, but the real issue was simply that the custom CSS file wasn't loaded at all.

#### Final Solution
1. **Identified Entry Point**: Confirmed via `vite.config.js` that `index-v2.html` is the authoritative entry point for the SPA.
2. **Linked CSS**: Added `<link rel="stylesheet" href="/css/modals.css">` to `public/index-v2.html`.
3. **Fortified CSS**: Updated `modals.css` with "bulletproof" centering rules to prevent any future layout ambiguity:
   ```css
   .modal-overlay {
     position: fixed !important;
     inset: 0 !important;
     width: 100vw !important;
     height: 100vh !important;
     z-index: 2147483647 !important;
     display: flex !important;
     justify-content: center !important;
     align-items: center !important;
   }
   ```

#### Files Modified
- `public/index-v2.html`: Added CSS link.
- `public/css/modals.css`: Enhanced layout rules.
- `public/hybrid-curator.html`: Fixed relative path (harmless side benefit).

---

### Issue #26: Firebase Serialization Errors (Custom Objects) - RESOLVED
**Status**: Ô£à **RESOLVED**
**Date**: 2025-12-07 01:45
**Type**: Data Persistence Error
**Component**: `InventoryRepository.js`

#### Problem
Adding an album to inventory failed with two distinct Firebase errors:
1. `Unsupported field value: undefined` (found in `coverUrl`)
2. `Unsupported field value: a custom Track object` (found in `tracks` array)

#### Root Cause
The application architecture recently evolved to use rich ES6 Classes (`Album`, `Track`) instead of plain objects.
- **Firestore Limitation**: The Firestore SDK does NOT support saving custom Class instances directly. It requires Plain Old JavaScript Objects (POJOs).
- **Undefined Handling**: Spreading a class instance `{...album}` copies properties with `undefined` values, which Firestore explicitly rejects.

#### Failed Attempts
1. **Shallow Sanitization**: Iterating over keys and setting `undefined` to `null`. This failed because it didn't recurse into nested arrays (like `tracks`), leaving the custom `Track` objects inside.

#### Final Solution (Deep Sanitization)
Implemented robust serialization in `InventoryRepository.addAlbum` using `JSON.parse(JSON.stringify(album))`.
- **Why**: This technique automatically:
  1. Converts ALL custom class instances (nested or not) into plain objects.
  2. Removes all keys with `undefined` values (which is valid for Firestore).
  3. Handles deep nesting without complex recursive code.

#### Files Modified
- `public/js/repositories/InventoryRepository.js`

---
**Status**: Ô£à **RESOLVED**
**Date**: 2025-12-06 20:50
**Type**: UI Bug
**Component**: `Icons.js`

#### Problem
Multiple icons not rendering in `SeriesListView`, `AlbumsView`, `InventoryView`, and `TopNav` (hamburger menu invisible).

#### Root Cause
Icons were being called via `getIcon()` but were not defined in the `Icons` object in `Icons.js`.

#### Solution
Added 10 missing icons to `Icons.js`:
- `Menu` - Hamburger menu (critical for mobile nav)
- `Edit` - Edit buttons
- `Play` - Album playback
- `RefreshCw` - Refresh filter button
- `ExternalLink` - BestEver links
- `ArrowRight` - Migration banner CTA
- `Loader` - Loading states
- `Layers` - Series management
- `Trash2` - Delete in Inventory

#### Files Modified
- `public/js/components/Icons.js` (lines 99-119)

---

### Issue #23: Mobile Menu Transparent Background - RESOLVED  
**Status**: Ô£à **RESOLVED**
**Date**: 2025-12-06 22:33
**Type**: UI/UX Bug
**Component**: `TopNav.js`, `modals.css`

#### Problem
Mobile hamburger menu drawer opened but had transparent/see-through background, making text unreadable as page content was visible behind it.

#### Failed Attempts
1. **Inline `background: #0d0d12`** - CSS classes overrode it
2. **Tailwind `bg-black/95`** - Not processed correctly
3. **`bg-[#0a0a0f]`** - Still transparent
4. **CSS class `.mobile-drawer` with `!important`** - Still overridden
5. **JavaScript `style.setProperty('background-color', '#0a0a0f', 'important')`** - Still transparent

#### Root Cause
Unknown CSS cascade issue causing all background declarations to be ignored or overridden by parent/global styles.

#### Final Solution (Triple-Layer Approach)
Applied solid background `bg-[#0a0a0f]` to **ALL internal child elements**:
1. Parent `#mobileMenu`: inline style + CSS class
2. Header div: `bg-[#0a0a0f]`
3. Nav element: `bg-[#0a0a0f]`
4. Footer div: `bg-[#0a0a0f]`

Also added JavaScript reinforcement in `attachListeners()`:
```javascript
if (mobileMenu) {
  mobileMenu.style.setProperty('background-color', '#0a0a0f', 'important')
  mobileMenu.style.setProperty('backdrop-filter', 'none', 'important')
}
```

#### UX Improvements Made
- Hamburger button moved to **LEFT** side (standard for left-slide drawer)
- Title uses flame image (`TheAlbumPlaylistSynth.png`) instead of text
- Drawer width: 280px / max 80vw
- Orange border accent: `border-orange-500/20`
- Deep shadow: `box-shadow: 4px 0 40px rgba(0,0,0,0.9)`
- Click overlay to close (`#mobileMenuOverlay`)
- Icon-enhanced navigation links

#### Files Modified
- `public/js/components/TopNav.js` (complete menu restructure)
- `public/css/modals.css` (added `.mobile-drawer` class)

---

### Issue #22: Ghost Albums Regression - RESOLVED
**Status**: Ô£à **RESOLVED**
**Date Started**: 2025-12-06 19:42
**Type**: Regression
**Component**: `AlbumsView.js` / `AlbumsStore.js`

#### User Report
Ghost Albums returned after previous session marked as resolved. Albums from previously viewed series appear when switching to a new series.

#### Failed Attempts (2025-12-06)

**ATTEMPT #1: Closure Capture** (19:42 - FAILED)
- **Hypothesis**: `this.abortController` in callback refers to wrong controller due to closure scope
- **Fix Applied**: 
  - Captured `currentController` and `targetSeriesId` at start of `loadAlbumsFromQueries()`
  - Changed callback to check `currentController.signal.aborted` instead of `this.abortController`
  - Added series ID validation: `if (seriesStore.getActiveSeries()?.id !== targetSeriesId) return`
- **Files Modified**: `AlbumsView.js` (lines 928-929, 962-972, 982)
- **Result**: ÔØî FAILED - User reported Ghost Albums still appearing
- **Root Cause Missed**: This was a variation of ATTEMPT #1 from previous session that was already documented as failed

**ATTEMPT #2: Revert to Original Solution** (19:53 - FAILED)
- **Hypothesis**: My closure capture broke something that was working
- **Action**: Reverted closure capture changes, restored original code
- **Code Change**:
  ```javascript
  // Reverted back to:
  if (this.abortController.signal.aborted) return
  this.abortController.signal // Pass signal
  ```
- **Files Modified**: `AlbumsView.js`
- **Result**: ÔØî FAILED - User confirmed issue persists
- **Root Cause Missed**: Original code was also broken

**ATTEMPT #3: Guard in Subscription Callback** (19:55 - FAILED)
- **Hypothesis**: Store subscription callback renders albums without checking series ownership
- **Fix Applied**: Added guard to subscription callback in `mount()`:
  ```javascript
  const unsubscribe = albumsStore.subscribe((state) => {
    if (!this.isLoading) {
      const activeSeries = seriesStore.getActiveSeries()
      const lastLoadedId = albumsStore.getLastLoadedSeriesId()
      
      if (activeSeries && lastLoadedId && lastLoadedId !== activeSeries.id) {
        console.warn('[AlbumsView] Ignoring stale albums from series:', lastLoadedId)
        return
      }
      
      this.updateAlbumsGrid(state.albums)
    }
  })
  ```
- **Files Modified**: `AlbumsView.js` (lines 558-574)
- **Result**: ÔØî FAILED - User reported issue persists
- **Root Cause Missed**: `lastLoadedSeriesId` gets cleared by `reset()`

**ATTEMPT #4: Timing Fix - Set SeriesId Before Reset** (19:58 - FAILED)
- **Hypothesis**: `albumsStore.reset()` clears `lastLoadedSeriesId` to null, making guard pass incorrectly
- **Fix Applied**: 
  - Moved `albumsStore.setLastLoadedSeriesId(targetSeries.id)` to BEFORE `reset()` call
  - Removed redundant call after load completes
  ```javascript
  // FIX: Set lastLoadedSeriesId BEFORE reset
  const targetSeries = seriesStore.getActiveSeries()
  if (targetSeries) {
    albumsStore.setLastLoadedSeriesId(targetSeries.id)
  }
  albumsStore.reset()
  ```
- **Files Modified**: `AlbumsView.js` (lines 936-942, 886-887)
- **Result**: ÔØî FAILED - User confirmed issue still persists
- **Root Cause**: STILL UNKNOWN

#### Current State Analysis (2025-12-06 20:01)
**What We Know**:
1. Ô£à `lastLoadedSeriesId` tracking exists in store
2. Ô£à Subscription guard now exists (ATTEMPT #3)
3. Ô£à Timing fix applied (ATTEMPT #4)
4. ÔØî **Ghost Albums STILL appearing**

**Possible Remaining Causes**:
1. `reset()` is called which fires `notify()` - subscription sees empty albums array but proceeds
2. The guard condition logic may be inverted or incorrect
3. There may be multiple subscription callbacks racing
4. `render()` method may be the actual source of ghost rendering, not `updateAlbumsGrid()`
5. View instance may be caching old data somewhere not tracked

**Next Investigation Steps**:
1. Add extensive console logging to track EXACT execution order
2. Check if `render()` is called with stale data before `mount()`
3. Review if there are other places where albums are rendered
4. Consider completely different approach (clear DOM first, render after all loads complete)

---


## Previous Session (2025-12-02)

### Issue #21: Sticky Playlists

**Context**: Developer onboarding revealed Issues #15 and #16 were NOT actually resolved despite being marked "Resolved" in previous session. User reported problems persist.

**Status**: ÔØî **CLOSED - WONTFIX** (Product Decision)
**Date Started**: 2025-11-30 21:15  
**Date Closed**: 2025-12-02 06:11  
**Type**: Regression / Logic Flaw  
**Resolution**: **Feature Removed**

#### User Report
When navigating through the series dropdown or using arrows in the PlaylistsView, the view keeps showing the playlists from the *first* generated series, regardless of which series is selected in the dropdown.

**Reproduction Steps**:
1. Generate playlists for Series tc1 (e.g., Greatest Hits Vol. 1 & 2)
2. Switch to Series tc2 using dropdown
3. **Expected**: Playlists should clear or show tc2 playlists
4. **Actual**: tc1 playlists remain visible

#### Resolution (2025-12-02 06:11)

**Product Decision**: After 4 failed attempts and ~16 hours of debugging, the decision was made to **remove the series selector dropdown** from `PlaylistsView` entirely to simplify UX and eliminate this issue permanently.

**Changes Applied**:
1. Ô£à **Removed series selector HTML** from `PlaylistsView.render()` (lines 50-62)
2. Ô£à **Removed series selector event handler** from `PlaylistsView.mount()` (lines 335-364)
3. Ô£à **Removed Undo/Redo navigation buttons** from header (lines 49-55) - User request 2025-12-02 06:45
4. Ô£à **Cleaned up all debug logs** added during investigation:
   - Removed emoji logs (­ƒöä) from `PlaylistsView.js`
   - Removed emoji logs (­ƒôª) from `PlaylistsStore.js`
   - Removed emoji logs (­ƒÜª) from `Router.js`
   - Removed emoji logs (­ƒº╣) from `BaseView.js`
4. Ô£à **Kept `seriesId` tracking** in `PlaylistsStore` for data integrity
5. Ô£à **Verified `handleGenerate()`** correctly passes `activeSeries.id` to `setPlaylists()` (line 440)

**User Impact**:
- Users can no longer switch series using the dropdown in PlaylistsView
- Series navigation now requires using breadcrumbs or back button to return to Albums view
- This simplifies the UX and prevents the cross-contamination issue

**Technical Notes**:
- `router.loadRoute()` method implemented during debugging remains available for future use
- `seriesId` tracking in `PlaylistsStore` provides foundation for multi-series features later
- All 4 debugging attempts documented in this issue serve as reference for similar problems

**Next Investigation Steps**:

**ATTEMPT #1: Store Series Tracking + View Validation** (2025-11-30 21:15 - FAILED)
- **Hypothesis**: `PlaylistsStore` doesn't track which series the playlists belong to, causing cross-contamination.
- **Fix Applied**:
  1. Added `seriesId` property to `PlaylistsStore` (line 14)
  2. Modified `setPlaylists(playlists, seriesId)` to accept and store `seriesId` (lines 38-40)
  3. Updated `getState()` to expose `seriesId` (line 150)
  4. Modified `reset()` to clear `seriesId` (line 239)
  5. Added validation in `PlaylistsView.render()` and `update()` to check if `state.seriesId !== activeSeries.id` (lines 30-36, 97-99)
  6. Updated `handleGenerate()` to pass `activeSeries.id` to `setPlaylists()` (line 428)
- **Files Modified**:
  - `public/js/stores/playlists.js` (Steps 412-414)
  - `public/js/views/PlaylistsView.js` (Step 422)
- **Result**: ÔØî **FAILED** - User reported playlists still persist when switching series
- **Root Cause Missed**: Validation logic works, but store history (undo/redo) doesn't track `seriesId`

**ATTEMPT #2: History Snapshot SeriesId** (2025-12-01 00:26 - FAILED)
- **Hypothesis**: Undo/redo history snapshots don't include `seriesId`, so restoring history brings back playlists without series context.
- **Fix Applied**:
  1. Modified `createSnapshot()` to include `seriesId` in snapshots (line 172)
  2. Updated `undo()` to restore `seriesId` from snapshot (line 193)
  3. Updated `redo()` to restore `seriesId` from snapshot (line 210)
- **Files Modified**:
  - `public/js/stores/playlists.js` (Steps 438-439)
- **Result**: ÔØî **FAILED** - User confirmed playlists still show from wrong series
- **Root Cause Missed**: Series selector event handler has logic issues

**ATTEMPT #3: Refactor Series Selector Handler** (2025-12-01 00:35 - FAILED)
- **Hypothesis**: The series selector's manual re-render logic (`this.render().then(html => this.mount())`) causes memory leaks and doesn't properly clean up state.
- **Fix Applied**:
  1. Replaced manual re-render with `router.loadRoute(window.location.pathname)`
  2. Added comments explaining the fix
- **Code Change** (`PlaylistsView.js` lines 336-351):
  ```javascript
  this.on(seriesSelector, 'change', async (e) => {
      const newSeriesId = e.target.value
      console.log('[PlaylistsView] Switching series to:', newSeriesId)
      
      // 1. Update Active Series
      seriesStore.setActiveSeries(newSeriesId)
      
      // 2. Clear current playlists to prevent ghosting
      playlistsStore.setPlaylists([]) 
      
      // 3. Force full view reload via Router
      await router.loadRoute(window.location.pathname)
  })
  ```
- **Files Modified**:
  - `public/js/views/PlaylistsView.js` (Step 464)
- **Result**: ÔØî **FAILED** - User reported playlists still persist
- **Root Cause Missed**: `router.loadRoute()` method doesn't exist!

**ATTEMPT #4: Implement Missing router.loadRoute()** (2025-12-01 13:05 - FAILED)
- **Hypothesis**: The call to `router.loadRoute()` in Attempt #3 failed silently because the method didn't exist in `router.js`.
- **Discovery**: Reviewed `router.js` and confirmed `loadRoute()` method was never implemented.
- **Fix Applied**:
  1. Added `loadRoute(path)` method to `Router` class to force route reload
  2. Method updates history and manually triggers `handleRouteChange()`
- **Code Change** (`router.js` lines 84-91):
  ```javascript
  async loadRoute(path) {
      // Update history without triggering popstate
      history.replaceState({}, '', path)
      // Manually trigger route handling
      await this.handleRouteChange()
  }
  ```
- **Files Modified**:
  - `public/js/router.js` (Step 474)
- **Verification Attempted**: Browser agent failed to connect (404 errors on localhost:5005 and 127.0.0.1:5005)
- **Result**: ÔØî **FAILED** - User confirmed playlists still persist after reload
- **Root Cause**: **STILL UNKNOWN** - All logical fixes applied, but issue persists

#### Current State Analysis (2025-12-01 13:10)
**What We Know**:
1. Ô£à `PlaylistsStore` correctly tracks `seriesId`
2. Ô£à `PlaylistsView` validates `seriesId` before rendering
3. Ô£à History snapshots include `seriesId`
4. Ô£à Series selector calls `setPlaylists([])` to clear
5. Ô£à Series selector calls `router.loadRoute()` to force reload
6. Ô£à `router.loadRoute()` now exists and should work
7. ÔØî **Playlists still persist when switching series**

**Possible Remaining Causes**:
1. **Race Condition**: `setPlaylists([])` ÔåÆ `router.loadRoute()` sequence might have timing issues
   - Store subscription fires render before loadRoute completes?
   - View renders with old data before new view is created?
2. **Store Subscription Not Cleared**: Even after `destroy()`, old subscriptions might fire
3. **Cache/Build Issue**: Changes not being loaded by browser (unlikely, but possible)
4. **Deep Reactivity Issue**: Playlists array is cleared but DOM retains old HTML
5. **Router Bug**: `loadRoute()` implementation doesn't actually destroy/recreate view properly

**Next Investigation Steps**:
1. Add extensive console logging to track exact execution order
2. Verify `BaseView.destroy()` is actually being called
3. Check if store subscriptions are truly being removed
4. Investigate if `router.handleRouteChange()` ÔåÆ `renderView()` actually creates new view instance
5. Consider adding explicit `playlistsStore.reset()` instead of just `setPlaylists([])`

---

## Previous Session (2025-11-30)

### Issue #15: Ghost Albums - REOPENED (Again)
**Status**: Ô£à **RESOLVED (Definitively)**
**Date**: 2025-11-30 21:00  
**Date**: 2025-11-30 19:17 - 20:11  
**Session Duration**: ~54 minutes

#### User Report
Albums from previous series still appearing when:
1. Navigating between series (Home ÔåÆ Albums ÔåÆ Home ÔåÆ Continue)
2. Clicking view toggle button multiple times

#### Investigation Timeline

**ATTEMPT #1: Abort Before Reset** (19:17 - PARTIAL SUCCESS)
- **Hypothesis**: AbortController being called AFTER store.reset() causes race condition
- **Fix Applied**: Moved abort logic BEFORE store reset in `loadAlbumsFromQueries()` (lines 875-890)
- **Code Change**:
  ```javascript
  // OLD: Reset first, then abort
  albumsStore.reset()
  if (this.abortController) this.abortController.abort()
  
  // NEW: Abort first, then reset
  if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
  }
  this.abortController = new AbortController()
  albumsStore.reset()
  ```
- **Result**: ÔØî FAILED - Ghost albums still appeared on navigation
- **Root Cause Missed**: Didn't account for store persistence across view instances

**ATTEMPT #2: Check Store Before Reload** (19:44 - PARTIAL SUCCESS)
- **Hypothesis**: Albums being reloaded even when already in store
- **Fix Applied**: Added check to skip reload if albums already loaded (lines 840-853)
- **Code Change**:
  ```javascript
  const expectedCount = activeSeries.albumQueries.length
  const currentCount = currentAlbums.length
  
  if (currentCount === 0 || currentCount !== expectedCount) {
      await this.loadAlbumsFromQueries(activeSeries.albumQueries)
  } else {
      console.log('[AlbumsView] Albums already loaded')
      this.updateAlbumsGrid(currentAlbums)  // ÔÜá´©Å THIS LINE CAUSED DUPLICATION
  }
  ```
- **Result**: Ô£à Navigation ghost albums fixed
- **New Problem**: Broke view toggle (duplicates still occurred)
- **Impact Assessment FAILED**: Did not consider that `render()` already displays albums

**ATTEMPT #3: Remove Duplicate Render Call** (20:08 - SUCCESS)
- **Hypothesis**: `render()` shows albums, then `mount()` calls `updateAlbumsGrid()` ÔåÆ duplication
- **Fix Applied**: Removed `this.updateAlbumsGrid(currentAlbums)` call in else branch (line 896)
- **Code Change**:
  ```javascript
  } else {
      console.log('[AlbumsView] Albums already loaded')
      // CRITICAL FIX: Do NOT call updateAlbumsGrid here!
      // The render() method already rendered these albums
  }
  ```
- **Result**: Ô£à **COMPLETE SUCCESS** - Both navigation and view toggle work perfectly

#### Final Root Cause Analysis
**Three separate issues:**
1. **Race Condition**: Abort called after reset ÔåÆ old requests complete after reset
   - **Fixed by**: Moving abort before reset
2. **Unnecessary Reloads**: View reloading albums that already exist in store
   - **Fixed by**: Checking album count before reload
3. **Double Rendering**: `render()` + `mount().updateAlbumsGrid()` ÔåÆ duplicate display
   - **Fixed by**: Removing updateAlbumsGrid call when albums already rendered

#### Files Modified
- `public/js/views/AlbumsView.js` (lines 875-898)

#### Verification
- Ô£à Navigate Home ÔåÆ Albums ÔåÆ Home ÔåÆ Continue: No duplicates
- Ô£à Toggle view mode multiple times: No duplicates
- Ô£à Hard refresh (F5): Works correctly
- Ô£à Console logs confirm correct flow

#### Impact Assessment (Post-Fix)
- [x] Does this affect global state/navigation? Yes - store persistence
- [x] Does it work on Hard Refresh? Yes
- [x] Does it work for New AND Existing items? Yes
- [x] Does it introduce visual artifacts? No

---

### Issue #16: View Mode Toggle - REOPENED
**Status**: Ô£à **RESOLVED (After 4 iterations)**  
**Date**: 2025-11-30 19:29 - 20:00  
**Session Duration**: ~31 minutes

#### User Report
1. Button state changes correctly
2. View does NOT switch between Grid and Expanded modes
3. Albums duplicate when clicking toggle multiple times

#### Investigation Timeline

**ATTEMPT #1: Simple Grid Update** (19:29 - FAILED)
-  **Hypothesis**: Can just call `updateAlbumsGrid()` after toggling viewMode
- **Fix Applied**: Updated button state + called `updateAlbumsGrid()`
- **Code Change**: Lines 654-680
- **Result**: ÔØî FAILED - View didn't change at all
- **Root Cause**: `updateAlbumsGrid()` updates EXISTING container, but Grid uses `#albumsGrid` while Expanded uses `#albumsList` - wrong container ID!

**ATTEMPT #2: Manual DOM Manipulation** (19:38 - FAILED)
- **Hypothesis**: Need to remove old container and create new one
- **Fix Applied**: Find old container, remove it, insert new HTML
- **Code Change**: Lines 678-708
- **Result**: ÔØî FAILED - Albums duplicated on each click
- **Problem**: Old containers not being fully removed before inserting new ones

**ATTEMPT #3: While Loop Cleanup** (19:53 - FAILED)
- **Hypothesis**: Need to ensure ALL old containers removed
- **Fix Applied**: While loop to repeatedly check and remove containers
- **Code Change**: Lines 678-719
- **Result**: ÔØî FAILED - View Compact stopped appearing, only Expanded showed
- **Problem**: Event listeners lost during DOM manipulation, complex state management issues

**ATTEMPT #4: Full Re-render** (19:57 - SUCCESS)
- **Hypothesis**: Stop being "clever", just re-render entire view
- **Fix Applied**: Call `render()` + rebuild all event listeners
- **Code Change**: Lines 654-753 (complete rewrite of toggle handler)
- **Code Approach**:
  ```javascript
  this.on(toggleViewBtn, 'click', async () => {
      // Toggle mode
      this.viewMode = this.viewMode === 'compact' ? 'expanded' : 'compact'
      localStorage.setItem('albumsViewMode', this.viewMode)
      
      // Re-render entire view
      const html = await this.render({})
      this.container.innerHTML = html
      
      // Re-bind ALL event listeners
      Breadcrumb.attachListeners(this.container)
      // ... rebind search, filters, buttons, etc.
  })
  ```
- **Result**: Ô£à **SUCCESS** - Toggle works perfectly, no duplicates
- **Tradeoff**: Heavier (re-renders everything) but robust and bug-free

#### Final Root Cause
- **Containers are different**: Grid mode uses `<div id="albumsGrid">`, Expanded uses `<div id="albumsList">`
- **updateAlbumsGrid() fails**: Tries to update wrong container ID
- **Manual DOM manipulation too fragile**: Event listeners lost, state management complex
- **Solution**: Full re-render guarantees consistency at cost of performance

#### Files Modified
- `public/js/views/AlbumsView.js` (lines 654-753)

#### Verification
- Ô£à Click toggle: View changes instantly
- Ô£à Click toggle 10 times: No duplicates, no errors
- Ô£à Reload page: View mode persists in localStorage
- Ô£à All filters still work after toggle

#### Impact Assessment
- [x] Does this affect global state/navigation? No - local to view
- [x] Does it work on Hard Refresh? Yes
- [x] Does it work for New AND Existing items? Yes
- [x] Does it introduce visual artifacts? No
- [x] Performance impact? Minor (full re-render on toggle)

---

- **ID**: #48
  - **Status**: [RESOLVED]
  - **Date**: 2025-12-15
  - **Component**: Documentation / Versioning
  - **Description**: Changelog discrepancy (v2.4 vs v2.7) and roadmap alignment.
  - **Fix**: Retroactively updated Changelog to reflect v2.5 (Stability) and v2.6 (UI Polish). Aligned current work to v2.7. Roadmap updated.

- **ID**: #49
  - **Status**: [RESOLVED]
  - **Date**: 2025-12-15
  - **Component**: AlbumsView (UI)
  - **Description**: Visual regressions in AlbumsView: Series grouping missing in expanded view, and compact grid layout broken (single column).
  - **Correction**: Refactored `AlbumsView.js` `render()` method to correctly delegate to `renderScopedGrid` and `renderScopedList` for both Single and All-Series scopes. Added missing `grid-cols-` classes to `renderScopedGrid` output and ensured list wrappers were present in `renderScopedList`.
    - **Outcome**: Expanded view now shows Series Headers and Borders consistently.

### Issue #19: Wrong Series Albums Displayed
**Status**: Ô£à Resolved  
**Date**: 2025-11-30 20:20  
**Duration**: ~8 minutes  
**Type**: Regression from Issue #15 fix

#### Problem
User clicked on different series (tc1 with Led Zeppelin, Beatles) but saw albums from another series (tc1b with OK Computer, Nevermind). URL showed correct seriesId but wrong albums displayed.

#### Root Cause
Issue #15 fix only checked **album count** to determine if reload needed:
```javascript
if (currentCount === 0 || currentCount !== expectedCount) {
    await this.loadAlbumsFromQueries(activeSeries.albumQueries)
}
```

**Scenario**:
1. Load tc1b (3 albums) ÔåÆ store has 3 albums
2. Click tc1 (also 3 albums) ÔåÆ `currentCount === expectedCount` ÔåÆ thinks "already loaded"
3. Result: Shows tc1b albums instead of tc1 albums

#### Impact Assessment
- [x] Does this affect global state/navigation? Yes - series switching
- [x] Does it work on Hard Refresh? No - same issue
- [x] Does it work for New AND Existing items? Affects all series with same album count
- [ ] Does it introduce visual artifacts? No

#### Resolution
Added series ID tracking to reload logic:
```javascript
constructor() {
    // ...
    this._lastLoadedSeriesId = null  // Track which series is loaded
}

// In mount():
const needsReload = currentCount === 0 || 
                    currentCount !== expectedCount ||
                    !this._lastLoadedSeriesId ||
                    this._lastLoadedSeriesId !== activeSeries.id  // ÔåÉ NEW CHECK

if (needsReload) {
    await this.loadAlbumsFromQueries(activeSeries.albumQueries)
    this._lastLoadedSeriesId = activeSeries.id  // Remember series
}
```

#### Files Modified
- `public/js/views/AlbumsView.js` (lines 35, 890-904)

#### Verification
- Ô£à Click tc1 ÔåÆ Shows Led Zeppelin, Beatles, Pink Floyd
- Ô£à Click tc1b ÔåÆ Shows OK Computer, Nevermind, The Smiths
- Ô£à Switch back to tc1 ÔåÆ Correctly reloads and shows tc1 albums
- Ô£à Hard refresh ÔåÆ Works correctly

---

### Issue #20: Wrong Album Details Displayed
**Status**: Ô£à Resolved  
**Date**: 2025-11-30 20:27  
**Duration**: ~3 minutes  
**Type**: Pre-existing bug exposed by testing

#### Problem
User clicked "View Ranked Tracks" on different albums but always saw the same album details:
- tc1 series: Always showed "The Wall" regardless of which album clicked
- tc1b series: Always showed "OK Computer" regardless of which album clicked

URL showed correct albumId but wrong album details displayed.

#### Root Cause
`RankingView.findAlbum()` had a "debugging fallback" that always returned first album when ID didn't match:

```javascript
findAlbum(albumId) {
    const albums = albumsStore.getAlbums()
    
    // Try exact ID match first
    const byId = albums.find(a => a.id === albumId)
    if (byId) return byId
    
    // Fallback to first album if no match (for debugging)
    return albums[0] || null  // ÔåÉ ALWAYS returns first album!
}
```

**Why it failed**:
- Album IDs in store didn't match albumId from URL
- Fallback kicked in and returned `albums[0]` (first album)
- Result: Always showed The Wall (tc1) or OK Computer (tc1b)

#### Impact Assessment
- [x] Does this affect global state/navigation? No - isolated to RankingView
- [x] Does it work on Hard Refresh? No - same issue
- [x] Does it work for New AND Existing items? Affects all albums
- [ ] Does it introduce visual artifacts? No

#### Resolution
Removed buggy fallback and added debug logging:

```javascript
findAlbum(albumId) {
    const albums = albumsStore.getAlbums()
    
    console.log('[RankingView] Looking for album:', albumId)
    console.log('[RankingView] Available albums:', albums.map(a => a.id))

    // FIX #20: Only return album if ID matches exactly
    // DO NOT fallback to first album - that causes wrong album to display
    const album = albums.find(a => a.id === albumId)
    
    if (!album) {
        console.warn('[RankingView] Album not found:', albumId)
    }
    
    return album || null
}
```

**Now**:
- ID matches ÔåÆ Shows correct album
- ID doesn't match ÔåÆ Shows "Album Not Found" (correct behavior)
- Console logs help debug ID mismatches

#### Files Modified
- `public/js/views/RankingView.js` (lines 207-222)

#### Verification
- Ô£à Click "View Ranked Tracks" on different albums ÔåÆ Shows correct album each time
- Ô£à Console logs show correct album IDs being searched
- Ô£à No more "fallback to first album" behavior

#### Next Steps
If "Album Not Found" appears, console logs will reveal ID mismatch issue. May need to investigate:
- How album IDs are generated
- URL encoding/decoding of album IDs
- Store vs URL ID format differences

---

## Session Summary (2025-11-30 19:17 - 20:30)
- Started with 2 "Resolved" issues actually broken
- Fixed Issues #15, #16 through 7 iterations
- Discovered 2 new regressions (Issues #19, #20)
- All 4 issues now resolved
- Total fixes: 11 code changes across 3 files
- **Status**: Pending UAT confirmation for all fixes


#### Addendum: The "Real" Root Cause (2025-11-30 21:05)
After removing the fallback in `RankingView`, all albums showed "Album Not Found".
- **Investigation**: Console logs showed `Looking for album: undefined`.
- **Discovery**: `app.js` registered route as `/ranking/:id`, but `RankingView` expected `params.albumId`.
- **Final Fix**: Updated `public/js/app.js` to use `/ranking/:albumId`.
- **Status**: Ô£à FULLY VERIFIED

---

## Previous Session (2025-11-29)

### Issue #18: Firebase API Key Client-Side Error
**Status**: Ô£à Resolved
**Date**: 2025-11-29

#### Problem
User reported `Firebase: Error (auth/api-key-not-valid)` on page reload. Console showed `apiKey: "API_KEY_PLACEHOLDER"`.

#### Root Cause
`public/index-v2.html` was missing the script tag to load `public/js/firebase-config.js`.
`app.js` relies on `window.__firebase_config` being set by this script; otherwise, it falls back to a default object with placeholders.

#### Resolution
Added `<script src="/js/firebase-config.js"></script>` to `public/index-v2.html` before the main module script.

---

### Issue #17: InventoryView Runtime Error
**Status**: Ô£à Resolved
**Date**: 2025-11-29

#### Problem
User reported `TypeError: this.escapeHtml is not a function` when accessing the Inventory page.

#### Root Cause
`InventoryView.js` called `this.escapeHtml()` assuming it was inherited from `BaseView`. However, `BaseView.js` did not implement this method, unlike other views that implemented it locally or didn't use it.

#### Resolution
- Added `escapeHtml` utility method to `BaseView.js` to make it available to all view components.
- Verified that `InventoryView` now renders correctly.

---

### Issue #16: View Mode State Mismatch
**Status**: Ô£à Resolved
**Date**: 2025-11-29

#### Problem
"View Mode" toggle button text ("View Expanded" / "View Compact") was inconsistent with the actual view state (Grid vs List) on page load, and the preference was not persisting.

#### Root Cause
`AlbumsView` constructor initialized `viewMode` to `'grid'` (hardcoded) instead of reading from `localStorage`. The toggle logic assumed a binary state that didn't match the initial value.

#### Resolution
- Updated `AlbumsView` constructor to read `localStorage.getItem('albumsViewMode')`.
- Defaulted to `'compact'` (Grid) if not set.
- Standardized toggle logic to switch between `'compact'` and `'expanded'`.

---

### Issue #15: Ghost Albums Regression
**Status**: Ô£à Resolved
**Date**: 2025-11-29

#### Problem
When switching between series, albums from the previous series would sometimes remain visible or mix with the new series' albums.

#### Root Cause
**Race Condition**: `loadAlbumsFromQueries` triggers an async API call. If the user switched series quickly, the previous request's callback would still fire and add albums to the store *after* the store had been reset for the new series.

#### Resolution
- Implemented `AbortController` in `AlbumsView`.
- Added `AbortSignal` support to `APIClient.fetchMultipleAlbums`.
- `AlbumsView` now cancels any pending requests before starting a new load or when destroyed.

---

### Issue #14: Generate Playlists 500 Error
**Status**: Ô£à Resolved
**Date**: 2025-11-29

#### Problem
Server crashed with `ReferenceError: Album is not defined` when hitting `/api/playlists`.

#### Root Cause
`curation.js` (shared code) performed an `instanceof Album` check. On the server (Node.js), the `Album` class was not imported/defined in the global scope where `curation.js` was running, causing a crash.

#### Resolution
- Added a guard in `curation.js`: `if (typeof Album !== 'undefined' && album instanceof Album)`.
- This allows the server to gracefully fall back to legacy object handling while keeping strict checks on the client.

---

### Issue #13: Original Order Incorrect After Refresh
**Status**: Ô£à Resolved
**Date**: 2025-11-29

#### Problem
Even after fixing the Refresh button (Issue #12), the "Original Album Order" column still displays the Ranked track list.

#### Impact Assessment
- [x] Check ARCHITECTURE.md: Verified data flow in `data_flow_analysis.md`.
- [ ] Does this affect global state/navigation? No, local to AlbumsView.
- [x] Does it work on Hard Refresh? No (stale cache persists).
- [ ] Does it work for New AND Existing items? Existing items affected.
- [ ] Does it introduce visual artifacts? Yes, added `[DEBUG]` badge for verification.

#### Investigation History
1.  **Phase 1: Data Verification**
    *   **Hypothesis**: Server sending wrong data or Client normalizing it incorrectly.
    *   **Action**: Ran `curl` and added logs to `client.js`.
    *   **Result**: Ô£à Server and Client confirmed CORRECT. `tracksOriginalOrder` was present and correct in the Model.
2.  **Phase 2: Visual Debugging (The "Stale Code" Red Herring)**
    *   **Hypothesis**: View not receiving data or Browser caching old code.
    *   **Action**: Added `[DEBUG]` badges and console logs to `AlbumsView.js`.
    *   **Observation**: Badges and logs did NOT appear in the user's browser, even after F5 and server restart.
    *   **Incorrect Conclusion**: Assumed aggressive browser caching or build failure.
3.  **Phase 3: The Breakthrough**
    *   **Re-evaluation**: Noticed the URL in the user's screenshot was `/ranking/jimi-hendrix...`.
    *   **Discovery**: The user was viewing the **Album Details Page** (`RankingView.js`), NOT the **Albums List** (`AlbumsView.js`).
    *   **Verification**: Checked `RankingView.js` and found the *exact same bug* (ignoring `tracksOriginalOrder`).

#### Root Cause
*   **Wrong File Targeted**: Debugging `AlbumsView.js` while user was on `RankingView.js`.
*   **Code Defect**: `RankingView.js` used `const tracks = album.tracks || []`, which defaults to the Ranked list, ignoring the available `tracksOriginalOrder`.w API response being correct.

---

### Issue #12: Refresh Button Silent Failure
**Status**: Ô£à Resolved
**Date**: 2025-11-29

#### Problem
User clicked "Refresh" button to fix stale cache, but nothing happened (no reload, no logs).

#### Root Cause
Typo in `AlbumsView.js`: Checked `activeSeries.albums` (undefined) instead of `activeSeries.albumQueries`.
```javascript
if (activeSeries?.albums) { ... } // Evaluates to false
```

#### Resolution
Corrected property name to `activeSeries.albumQueries`.

#### Verification
User confirmed "it's finally reloading".

---

### Issue #11: API Key Not Loaded (Regression)
**Status**: ­ƒƒí Potential Fix Applied
**Date**: 2025-11-29

#### Problem
Backend fails with `503 Service Unavailable` and logs `Warning: AI_API_KEY not set`, even though `.env` exists in `server/` directory.

#### Root Cause
`dotenv` configuration was looking for `.env` in the project root (CWD), but the file is located in `server/`.

#### Resolution
Updated `server/index.js` to use absolute path resolution:
```javascript
require('dotenv').config({ path: path.resolve(__dirname, '.env') })
```

#### Verification
- Server restarted.
- Log confirmed: `AI proxy server listening...` (No warning).
- **Pending User Confirmation**.

---

### Issue #10: API 400 Bad Request
**Status**: ­ƒƒí Potential Fix Applied
**Date**: 2025-11-29

#### Problem
User reported `400 Bad Request` when generating albums after fixing Axios error.

#### Root Cause
Payload mismatch: `client.js` was sending `{ album: query }` but server expects `{ albumQuery: query }`. This regression was introduced when replacing `_fetchAlbumFromAPI` with direct `axios.post`.

#### Resolution
Updated `client.js` to send correct payload property `albumQuery`.

#### Verification
- Code updated.
- **Pending User Confirmation**.

---

### Issue #9: Axios Reference Error
**Status**: ­ƒƒí Potential Fix Applied
**Date**: 2025-11-29

#### Problem
User reported `ReferenceError: axios is not defined` when loading albums after Domain Model refactor.

#### Root Cause
`axios` was used in `client.js` but was not listed in `package.json` dependencies, nor imported in the file. Previous implementation likely relied on global scope or different fetch method.

#### Resolution
1. Installed `axios` via npm.
2. Added `import axios from 'axios'` to `public/js/api/client.js`.

#### Verification
- `npm install` completed successfully.
- Code updated.
- **Pending User Confirmation**.

---

### Issue: Domain Model Anemia (Refactor)
**Status**: ­ƒƒí Potential Fix Applied
**Date**: 2025-11-29

#### Problem
Persistent data integrity issues (missing artist/album fields, original order regression) due to "Anemic Domain Model" (passing raw JSON).

#### Resolution
Refactored to Rich Domain Model:
- Created `Track`, `Album`, `Playlist`, `Series` classes.
- Updated `client.js` to hydrate instances.
- Updated `curation.js` to use model methods.

**See**: [walkthrough.md](../../docs/walkthrough.md)

---

### Issue #8: Store State Management - Architectural Problem
**Status**: ­ƒƒí In Progress (Root Cause Analysis)  
**Date**: 2025-11-29 17:00  
**Related Files**: AlbumsView.js, PlaylistsView.js, RankingView.js

#### Symptoms
- Ghost Albums **RETURNED** after adding recovery logic
- "Album Not Found" was never properly fixed
- Code duplication across 3 views (AlbumsView, PlaylistsView, RankingView)

#### Root Cause
- **Band-aid approach**: Treating symptom (empty store) instead of cause
- Each view doing `reset() + reload` creates race conditions
- Store being cleared when it shouldn't be

#### Wrong Approach (Current)
```
AlbumsView.destroy() ÔåÆ reset store
  ÔåÆ Every other view needs recovery logic
  ÔåÆ Duplicated code + ghost data issues
```

#### Correct Approach (Proposed)
```
Store should persist while series is active
  ÔåÆ Only reset when:
    1. User changes series
    2. User explicitly refreshes
    3. App closes
  ÔåÆ No recovery logic needed in views
```

#### Action Plan
- [x] LOG this issue
- [x] REVERT RankingView changes (recovery logic)
- [ ] REVERT PlaylistsView changes (recovery logic)  
- [x] REMOVE albumsStore.reset() from AlbumsView.destroy()
- [ ] TEST that all views work without reset
- [ ] VERIFY ghost albums don't return

**See Also**: [ARCHITECTURE.md - Store State Management](../../docs/ARCHITECTURE.md#store-state-management-current)

---

### Issue #7: Album Click Navigation - "Album Not Found"
**Status**: ­ƒö┤ Reverted (Wrong Approach)  
**Date**: 2025-11-29 16:38  
**Resolution**: Identified as symptom of Issue #8 (store management). Fix reverted in favor of architectural solution.

**See**: Issue #8 for proper fix.

---

### Issues #1-6: Various Regressions
**Status**: Ô£à Resolved  
**Date**: 2025-11-28 - 2025-11-29  

Summary of resolved issues (see archived versions for details):
1. Navigation regression (button URL)
2. HTML artifacts (template strings)
3. Syntax errors (duplicated braces)
4. Hard refresh empty state
5. PlaylistsView empty state
6. Various UI regressions

---

## Previous Debugging Sessions (2025-11-28 and earlier)

### Sprint 4.5 Phase 2: localStorage Cache Missing New Fields
**Status**: Ô£à Resolved (Deferred to Sprint 5)  
**Date**: 2025-11-28  
**Duration**: 16:00 - 18:50 (2h50m)

#### Problem
After implementing new album fields (`bestEverAlbumId`, `bestEverUrl`, `tracksOriginalOrder`), albums loaded from cache showed `undefined` for these fields.

#### Root Cause
- Albums cached in localStorage before code changes lack new normalized fields
- Cache hit bypasses normalization, loading old structure

#### Resolution
- Ô£à Added "Refresh" button to force skip-cache reload
- Ô£à Modified `loadAlbumsFromQueries(queries, skipCache)` to accept flag
- ÔÅ©´©Å Complete fix deferred to Sprint 5 (Firestore migration)

#### Rationale for Deferral
1. Firestore = Better solution (persistent, schema versioning, no limits)
2. Temporary workaround sufficient (affects only existing cache)
3. New data normalizes correctly

**See**: [SPRINT_5_PERSISTENCE_ARCHITECTURE.md](../../docs/archive/architecture-artifacts-2025-11-29/SPRINT_5_PERSISTENCE_ARCHITECTURE.md)

---

### Issue: Original Album Order Regression (Sprint 4.5)
**Status**: Ô£à Resolved (Workaround)
**Date**: 2025-11-28

#### Problem
"Original Album Order" column showed Ranked order or `undefined` fields after update.

#### Root Cause
**Cache Poisoning**: `localStorage` contained old album objects without `tracksOriginalOrder`.
`AlbumsView` fell back to `tracks` (Ranked) when `tracksOriginalOrder` was missing.

#### Resolution
1. Added `tracksOriginalOrder` to `normalizeAlbumData`.
2. Implemented "Refresh" button to force cache update.
3. **Architecture Fix**: Planned migration to Firestore to avoid localStorage schema issues.

**See**: [album_data_schema.md](../../docs/album_data_schema.md) for data mapping.

---

### Sprint 4.5: Missing Tailwind CSS
**Status**: Ô£à Resolved  
**Date**: 2025-11-28  
**Duration**: 09:00 - 10:20

#### Problem
Site rendered without styles (Header, Footer, Hero Banner broken)

#### Root Cause
Tailwind CSS classes used in code but never installed or included

#### Resolution
Added Tailwind via CDN in `public/index-v2.html`:
```html
<script src="https://cdn.tailwindcss.com"></script>
```

---

### Sprint 4: Series Mixing Bug
**Status**: Ô£à Resolved  
**Date**: 2025-11-27 (Late afternoon)

#### Problem
Albums from previous series persisted when switching to new series

#### Root Cause
`AlbumsView` appending albums without clearing previous state

#### Resolution
Added `albumsStore.reset()` in `AlbumsView.loadAlbumsFromQueries()`

---

### Sprint 4: Ratings Not Loading
**Status**: Ô£à Resolved  
**Date**: 2025-11-27  
**Duration**: 09:30 - 14:32 (5h)

#### Problem
Album ratings not displaying (showed "ÔÜá No ratings" instead of "Ô£ô Rated")

#### Root Causes Found
1. **Backend** - Not mapping ratings from `rankingConsolidated` to tracks
2. **Frontend** - Detection logic relied on non-existent `rankingConsolidatedMeta.hasRatings`
3. **Cache** - localStorage contained old data without ratings
4. **ID Mismatch** - HTML `id="albumQueries"` vs JS `id="albumList"`

#### Fixes Applied
**Backend** (`server/index.js`):
```javascript
// Added ratingMap alongside rankMap
const ratingMap = new Map()
albumPayload.rankingConsolidated.forEach(r => {
  if (r.rating != null) ratingMap.set(normalizeKey(r.trackTitle), r.rating)
})
```

**Frontend** (`public/js/api/client.js`):
```javascript
// Calculate hasRatings from actual data
const hasRatings = tracks.some(t => 
  (t.rating !== null && t.rating !== undefined) ||
  (t.rank !== null && t.rank !== undefined)
)
```

**UX**: Added "Clear Cache" button  
**Validation**: Added minimum 2 albums requirement  
**Navigation**: Added breadcrumbs to all views

#### Files Modified
- server/index.js (+13 lines)
- public/js/api/client.js (+15 lines)
- public/js/views/HomeView.js (+25 lines)
- public/js/components/Breadcrumb.js (93 lines, NEW)

---

### Sprint 4: Rank Display in Playlists
**Status**: Ô£à Resolved  
**Date**: 2025-11-27

#### Problem
"Rank: -" displayed despite data being available

#### Root Cause
Frontend only checked `track.rank`, backend returned `acclaimRank` or `finalPosition`

#### Resolution
Added fallback chain: `rank || acclaimRank || finalPosition || '-'`  
**File**: `public/js/api/client.js`

---

### Hotfix: Ranking by Acclaim (Production)
**Status**: Ô£à Resolved  
**Date**: 2025-11-24  
**Severity**: High (Production Issue)

#### Issue
Tracks not properly sorted by acclaim ranking in production. "Another Brick in the Wall" parts showed rawScore 0.

#### Root Cause
1. **Normalization Mismatch**: Server-side `normalizeKey` was too simple (`trim().toLowerCase()`), missing punctuation variants.
2. **Deduplication**: Client-side `collectRankingAcclaim` had weak deduplication keys, overwriting valid entries.
3. **Mapping**: Backend wasn't mapping `finalPosition` to `tracks[].rank` correctly.

#### Resolution
1. **Server**: Enhanced `normalizeKey` (remove diacritics, non-alphanumeric).
2. **Server**: Updated `rankingConsolidated` mapping to use robust normalization.
3. **Client**: Updated `collectRankingAcclaim` (now in `curation.js` logic) to include `trackTitle` + `albumId` in dedup key.
4. **Client**: `normalizeAlbumData` maps `acclaimRank` -> `rank`.

**Critical Logic Preserved**:
- `tracksOriginalOrder` MUST remain AS IS (1..N based on disc).
- `tracks` (Ranked) MUST be sorted by rating/rank.

**Full Details**: [HOTFIX_RANKING_ACCLAIM.md](../../docs/archive/hotfixes/HOTFIX_RANKING_ACCLAIM.md)

---

## Debug Tools & Visual Elements

### Visual Debug Elements Added (AlbumsView)
**Date**: 2025-11-28  
**Purpose**: Filter debugging  
**Status**: ­ƒƒó Active (removable)

All debug elements marked with `// DEBUG:` comments for easy removal.

#### Visual Debug Panel
- **Location**: Line ~142-170 in AlbumsView.js
- **Purpose**: Real-time filter state display
- **Marker**: `<!-- DEBUG: Visual Debug Panel START/END -->`

#### Console Logs
All prefixed with `­ƒöì [DEBUG]` for easy filtering in DevTools

### How to Remove Debug Code
```bash
# Find all debug comments
grep -n "// DEBUG:" public/js/views/AlbumsView.js

# Find all debug console logs
grep -n "­ƒöì \\[DEBUG\\]" public/js/views/AlbumsView.js
```

---

## Lessons Learned

### Architecture
1. **Band-aids create technical debt**: Recovery logic led to ghost albums
2. **Store persistence matters**: Don't clear state unnecessarily
3. **Single source of truth**: Firestore > localStorage for schema evolution

### Debugging
1. **ID consistency critical**: Mismatched IDs cause silent failures
2. **Cache invalidation**: Always consider cache when testing API changes
3. **Separation of concerns**: Backend vs Frontend issues need separate debugging
4. **Metadata vs Data**: Don't trust metadata fields, inspect actual data

### Development
1. **Verify dependencies**: Never assume a library is available
2. **Visual verification**: Code working Ôëá renders correctly
3. **Browser automation limits**: Manual testing sometimes more reliable

---
**See**: `.agent/workflows/debug_issue.md` for systematic debugging protocol



### Issue #44: New "Tech" UI CSS Not Applying - RESOLVED Ô£à
**Severity**: High (UI Broken)
**Status**: Ô£à **RESOLVED**
**Date**: 2025-12-13 17:33
**Type**: Configuration/CSS
**Component**: `index.css`, `index.html`, `app.js`

#### Problem
User reported that despite multiple attempts and a "hard refresh", the new "Neon/Green Tech" styles (e.g., dark inputs, neon borders) are not appearing. The inputs remain white (default Tailwind forms style).

#### Root Cause Discovery
**`public/css/index.css` is VERIFIED TO NOT BE LOADING.**
- It is **NOT** linked in `public/index.html`.
- It is **NOT** imported in `public/js/app.js` (Vite dependency graph requires CSS import in JS or HTML).
- Only Tailwind CDN is running, which defaults inputs to white.
- `index.css` was created containing the imports for `tech-theme.css`, but the entry point never loads it.

#### Fix Applied
Added `import '../css/index.css'` to `public/js/app.js`.
This ensures Vite bundles the CSS (including `tech-theme.css` and `neon.css`) into the application.

#### Verification
- [x] **USER CONFIRMED**: "ficou sensational!!" (It looks sensational). 
- [x] Neon Green accents and dark theme are now visible.


### Issue #45: Album Load 500 Error (Deluxe Edition) - DEFERRED ÔÅ©´©Å
**Severity**: Medium (Specific Album Fails)
**Status**: ÔÅ©´©Å **DEFERRED**
**Date**: 2025-12-13 17:55
**Type**: API Error
**Component**: `server/index.js`, `aiClient.js`

#### Problem
Loading "Judas Priest - Invincible Shield (Deluxe Edition)" fails with `AxiosError: Request failed with status code 500` from `/api/generate`.
Other albums (e.g. Metallica) work.

#### Suspected Cause
- **Complex Query**: "Deluxe Edition" might generate a very large response that times out the AI provider or fails normalization.
- **Model Config**: Originally suspected invalid model name, but user confirmed configuration is correct/intended.

#### Status
User requested to skip this issue for now to focus on higher priorities.
**Workaround**: None currently (avoid Deluxe Edition queries if possible).


### Issue #46: Cover Art Hydration Failed (Non-Home Views) - DEFERRED ÔÅ©´©Å
**Severity**: Medium (Visual Inconsistency)
**Status**: ÔÅ©´©Å **DEFERRED (Awaiting View Revamp)**
**Date**: 2025-12-13 18:05
**Type**: UI/Data Hydration
**Component**: `InventoryView.js`, `AlbumsView.js`

#### Problem
Cover art for Apple Music albums loads correctly in `HomeView` (via `OptimizedAlbumLoader`) but often fails or shows placeholders in `AlbumsView` and `InventoryView`, even after applying the same loader logic.
The user suspects the current "patch" approach is insufficient and requires a "general views revamp".

#### Status
- Attempted fix in `v2.4.0` (using `getArtworkUrl`) was deemed a failure by the user.
- **Decision**: Deferred to a dedicated branch `feature/cover-loading-views-revamp`.
- **Planned Fix**: Holistic review of how views handle async data and template resolution.
