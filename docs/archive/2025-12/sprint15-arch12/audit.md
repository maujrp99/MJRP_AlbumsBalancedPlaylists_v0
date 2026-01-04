# Componentization Audit & Strategy (ARCH-12)

**Severity**: CRITICAL (Reusability < 6%)
**Date**: 2025-12-28
**Context**: User identified "Grand Problem" regarding lack of modular reuse.

## 🚨 The Findings

### 1. The "BaseCard" Illusion
Although `BaseCard.js` exists, it is widely ignored or misused:
-   **Misuse**: `BatchGroupCard` imports it but uses it only as a *Utility Class* (for `escapeHtml`), not inheriting behavior.
-   **Ignored**: `SeriesCard` and `AlbumCard` do not use it at all.
-   **Inversion**: `EntityCard.js` (Component) calls `AlbumsGridRenderer.js` (View Logic) to render HTML. This is backwards dependency.

### 2. Fragmentation of Shared Code
We have 3 directories for "Shared" code, with no clear distinction:
-   `components/base/` (BaseCard, Component)
-   `components/shared/` (SkeletonLoader, ContextMenu)
-   `components/common/` (AlbumCascade)

### 3. Logic Duplication (The "Copy-Paste" Pattern)
Critical UI patterns are implemented 4-5 times independently:
-   **Track Rows**: `SavedPlaylistsView` manually builds track DOMs. `RankingsView` likely does the same. `BlendingView` too.
-   **Modals**: `SavedPlaylistsView` contains hardcoded HTML for 3 modals inside its `render()` string.

---

## 🏗️ The Plan: Unified Component System (Sprint 15)

### Phase 1: Establish the Core (Sprint 15.1)
1.  **Consolidate Directories**: Move all shared UI to `components/ui/`.
    *   `src/components/ui/Card.js`
    *   `src/components/ui/Button.js`
    *   `src/components/ui/Modal.js`
2.  **Create Atomic Atoms**:
    *   `TrackRow.js`: Determines how a track looks everywhere.
    *   `AlbumArt.js`: Handles lazy loading and placeholders.

### Phase 2: Refactor "God Views" (Sprint 15.2)
1.  **SavedPlaylistsView**:
    *   Replace hardcoded Modals with `BaseModal` imports.
    *   Replace manual Track rendering with `TrackRow.render()`.
2.  **AlbumsGridRenderer**:
    *   Refactor to use new `Card` component instead of string concatenation.

### Phase 3: Enforce Usage
-   **Rule**: Views MUST NOT contain `class="track-row..."` or generic HTML structures. They must import Components.

## 🎯 Immediate Next Steps
1.  **Move** `BaseCard.js` to `components/ui/Card.js`.
2.  **Create** `components/ui/TrackRow.js`.
3.  **Refactor** `SavedPlaylistsView` to use `TrackRow` as a proof-of-concept.
