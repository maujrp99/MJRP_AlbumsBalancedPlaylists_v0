# Sprint 15 Specification: Structural Integrity (ARCH-12)

**Goal**: Unified Component System & Technical Debt Elimination
**Context**: "Grand Problem" of Reusability (<6%) and Security Sinks.

## 1. Why Componentization? Why Now?
*   **Problem**: We have 3 "Shared" folders (`base`, `shared`, `common`) but none are truly standard.
*   **Consequence**: Every View implements its own "Card" and "Track Row" HTML.
*   **Vision**: "Write Once, Update Everywhere". If we change the Album Card design in `Card.js`, it updates Home, Series, and Search results instantly.

## 2. Security Policy: The "Zero Tolerance" Shift
**User Question**: *"Why can't we keep innerHTML? It was strategic for speed."*
**Answer**:
*   **Prototype (v1-v2)**: Speed > Security.
*   **Product (v3)**: Security > Speed. `innerHTML` is an XSS vector.
*   **Benefit**: 100% XSS immunity and faster VDOM-like updates.

## 3. Component Standard: TrackRow Logic

### Current State (The Problem)
*Inconsistent patterns (`track-item` class vs `track-row` class).*
```javascript
// SavedPlaylistsView.js (Uses 'track-item')
row.innerHTML = `<div class="track-item ...">${escapeHtml(title)}</div>`;

// RankingView.js (Uses 'track-row')
html += `<div class="track-row ...">${escapeHtml(name)}</div>`;
```

### Proposed State (The Solution)
*Implemented once in `src/components/ui/TrackRow.js`*
```javascript
import { TrackRow } from '../components/ui/TrackRow.js';

// Works everywhere
const row = TrackRow.render({
    track: track,
    index: i + 1,
    variant: 'compact',
    actions: ['play', 'remove']
});
```

## 4. Feature Audit: SavedPlaylistsView (Goal: 100% Parity)
*We must preserve EVERY feature listed below exactly as it behaves today.*

### A. Data & Loading
- [ ] **Repositories**: `SeriesRepository` (find all), `PlaylistRepository` (find by series).
- [ ] **Stores**: `playlistsStore` (editing context), `albumSeriesStore` (series context), `albumsStore` (series context).
- [ ] **Loading States**: Spinner (`renderLoading`) vs Content (`renderContent`).
- [ ] **Empty State**: "No Playlists Found" + CTA Button to Home.

### B. Grouping & Sorting Logic
- [ ] **Series Grouping**: Top level is Series.
- [ ] **Batch Grouping**:
    -   Playlists with same `batchName` are grouped under one Header.
    -   Default batch: "Saved Playlists".
- [ ] **Sorting Rules**:
    1.  **Batches**: Sorted by `savedAt` (Newest first).
    2.  **Playlists**: Sorted by `order` property (ASC).
    3.  **Fallback**: Sorted by `name` (Numeric string sort).

### C. Visual Elements
- [ ] **Header**: Breadcrumbs (/saved-playlists) + Icon + Title.
- [ ] **Batch Card (`BatchGroupCard`)**:
    -   Thumbnail Cascade (uses `optimizedAlbumLoader` to find covers).
    -   Metadata: Playlist Count, Track Count, Album Count, Duration, Date.
    -   **Collapse/Expand**: Header click toggles playlist list visibility.
- [ ] **Playlist Row**:
    -   Chevron (Expand/Collapse tracks).
    -   Thumbnail (First album art or generic disc).
    -   Metadata: Name, Track count, Duration.
    -   **Hover Actions**: View Details (Eye icon).

### D. Actions & Modals
- [ ] **Edit Series**: Button `[Edit Series]` -> Navigate to `/playlists?seriesId=X`.
    -   *Crucial*: Must set `albumsStore.activeSeriesId`.
- [ ] **Add Playlists**: Button `[Add Playlists]` -> Navigate to `/blend`.
- [ ] **Edit Batch**: Button `[Edit Batch]` -> Navigate to `/playlists/edit`.
- [ ] **Delete All Playlists**:
    -   Triggers local `deleteModal` (HTML hardcoded in View currently).
    -   Logic: Deletes all playlists, Keeps Series.
- [ ] **Delete Batch**:
    -   Triggers `Modals.showDeleteBatchModal`.
- [ ] **Delete Playlist**:
    -   Triggers `Modals.showDeletePlaylistModal`.
    -   Removes single item from UI.
- [ ] **View Playlist Details**:
    -   Triggers local `playlistModal` (HTML hardcoded in View currently).
    -   Renders track list (Scrollable).

## 5. Security Strategy: SafeRender Foundation (New Phase 3)
*Goal: Fix the root cause of XSS risk before spreading components.*

### The Problem
Current components (`Card.js`, `TrackRow.js`) use `innerHTML` with template literals. While `escapeHtml` is used, it relies on developer discipline and is prone to regressions.

### The Solution: `SafeRender` Utility
A lightweight wrapper around `document.createElement` to allow declarative DOM construction without innerHTML.

```javascript
// Before (Risk of XSS if sanitize missed)
el.innerHTML = `<div class="title">${title}</div>`

// After (Safe by default)
const el = SafeDOM.create('div', { className: 'title' }, title)
```

## 6. Execution Plan using SDD

### Phase 1: Core Foundation (Completed)
- [x] Create Directory Structure
- [x] Create `Card.js` (Alpha)
- [x] Create `TrackRow.js` (Alpha)
- [x] Create `BaseModal.js` (Alpha)

### Phase 2: Pilot Refactor (Completed)
- [x] Refactor `SavedPlaylistsView`
- [x] Fix Edit Batch Bugs (#98, #99)

### Phase 3: SafeRender Foundation (NEW PRIORITY)
- [x] **Create `src/utils/SafeDOM.js`**:
    - Fluent API for element creation.
    - Automatic `textContent` for string children.
    - Event listener attachment.
- [x] **Upgrade Core Components**:
    - Refactor `Card.js` to use `SafeDOM`.
    - Refactor `TrackRow.js` to use `SafeDOM`.
    - Refactor `BaseModal.js` to use `SafeDOM`.
- [x] **Verify**: Ensure `SavedPlaylistsView` (Pilot) works with upgraded components.

### Phase 4: Holistic Migration (The "Safe" Grind)
*Now safe to copy-paste everywhere.*
- [x] **Migrate Rankings**: Refactor to `TrackRow` (Safe).
- [x] **Migrate Inventory**: Refactor to `Card` (Safe).
- [x] **Migrate Albums Grid**: Refactor to `Card` (Safe).

### Phase 5: Cleanup & Final Hardening
- [x] Delete legacy folders.
- [x] Global search for residual `innerHTML` (Goal: 0 matches).

## 7. Success Metrics (Definition of Done)

### A. Outputs (Entregáveis Tangíveis)
- **SafeDOM Utility**: `public/js/utils/SafeDOM.js` implemented.
- **Unified Component Library**: `src/components/ui/` populated.
- **Secure Components**: All `src/components/ui/` components free of `innerHTML`.
- **Legacy Extinction**: ALL legacy views migrated to secure components.
- **Refactored Views**: `SavedPlaylistsView.js` rewritten using new components.
- **Cleaned Codebase**: Deletion of `components/base`, `components/shared`, `components/common`.
- **Security Patches**: 53 files patched to replace `innerHTML`.

### B. Outcomes (Resultados de Negócio)

#### Quantitative
- **Reusability Score**: Target **> 40%** (Current: 5.5%).
- **SavedPlaylistsView Size**: Target **< 300 LOC** (Current: 626 LOC).
- **Security Sinks**: Target **0** (Current: 53).
- **Duplication**: **0** instances of manual `track-row` HTML construction.

#### Qualitative
- **Security**: 0 XSS Vectors (innerHTML).
- **Visual Consistency**: Changing `Card.js` updates Home, Search, and Series instantly.
- **Developer Experience**: "Assembly" vs "Construction". Devs compose UI instead of writing HTML strings.
- **Security Posture**: "Zero Tolerance" policy enforcement prevents future regressions.
- **Performance**: Faster rendering (direct DOM nodes vs parser).
