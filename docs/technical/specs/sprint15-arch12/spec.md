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

## 5. Holistic Migration Map (The "Grand" Scope)
*We will migrate all legacy fragments to the New System.*

### Target: `Card.js` Consumers
- [ ] **AlbumsGridRenderer.js**: Legacy `album-card`. Update to `Card.render()`.
- [ ] **InventoryGridRenderer.js**: Legacy logic. Update to `Card.render()`.
- [ ] **EntityCard.js**: Modernize to extend `Card`.

### Target: `TrackRow.js` Consumers
- [ ] **SavedPlaylistsView.js**: Manual `track-item`.
- [ ] **RankingView.js**: Manual `track-row`.
- [ ] **ConsolidatedRankingView.js**: Manual `track-row`.
- [ ] **BlendingView.js**: Check for manual rows.

## 6. Execution Plan using SDD

### Phase 1: Core Library (`src/components/ui/`)
- [ ] Consolidate `TrackItem.js` (from playlists dir) -> `TrackRow.js`.
- [ ] Consolidate `BaseCard.js` -> `Card.js`.
- [ ] Create `BaseModal.js` (Standardize Backdrop/Close).

### Phase 2: Refactor & Migration
- [ ] **Pilot**: SavedPlaylistsView Refactor (Controller + Components).
- [ ] **Expansion**: Migrate `RankingView` and `InventoryGridRenderer`.

### Phase 3: Cleanup
- [ ] Delete legacy folders (`base`, `shared`, `common`).
- [ ] Security Sweep (53 sinks).

## 7. Success Metrics (Definition of Done)

### A. Outputs (Entregáveis Tangíveis)
- **Unified Component Library**: `src/components/ui/` populated.
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
- **Visual Consistency**: Changing `Card.js` updates Home, Search, and Series instantly.
- **Developer Experience**: "Assembly" vs "Construction". Devs compose UI instead of writing HTML strings.
- **Security Posture**: "Zero Tolerance" policy enforcement prevents future regressions.
