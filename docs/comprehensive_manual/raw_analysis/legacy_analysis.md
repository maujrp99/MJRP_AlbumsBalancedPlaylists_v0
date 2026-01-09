# Deep Dive: Legacy & Deprecated Components

This document audits the `public/legacy/` directory to ensure no critical business logic is lost before these files are eventually deleted.

## 1. `AlbumsView_DEPRECATED.js`
*   **Status**: **Redundant / Safe to Delete**
*   **Replacement**: `public/js/views/SeriesView.js` (V3 Architecture)
*   **Analysis**:
    *   This was the monolithic V2 view for the Albums route.
    *   It contains hardcoded logic for filtering and rendering that has been extracted into `SeriesFilterService.js` and `AlbumsStateController.js`.
    *   The file explicitly exports `class AlbumsView` but is marked with JSDoc `@deprecated`.

## 2. `EditPlaylistView_DEPRECATED.js`
*   **Status**: **Redundant / Safe to Delete**
*   **Replacement**: `public/js/views/PlaylistsView.js` + `public/js/controllers/PlaylistsController.js`
*   **Analysis**:
    *   Implemented the "Edit Batch" functionality introduced in Sprint 11.
    *   This logic (fetching from Firestore, preventing ghost playlists, batch renaming) has been successfully refactored into the V3 `PlaylistsController`.
    *   `PlaylistsView.js` now dynamically switches between "Create Mode" and "Edit Mode" based on store state, rendering this separate view class unnecessary.

## 3. `hybrid-curator.html`
*   **Status**: **Obsolete / Safe to Delete**
*   **Replacement**: `public/index.html` (SPA Entry Point)
*   **Analysis**:
    *   This appears to be an early prototype or V1 entry point.
    *   It loads `firebase-config.js` and `app.js` but uses a completely different DOM structure (`#app-container` vs V3's `#app`).
    *   It references CSS/Classes not present in the modern design system (e.g., specific `modal-backdrop` styles that differ from the current `BaseModal`).

## 4. `index_redirect.html`
*   **Status**: **Keep (Utility)**
*   **Analysis**:
    *   A simple utility to handle 404s or redirects in some hosting environments (e.g., Firebase Hosting SPA fallback).
    *   It is harmless and potentially useful for configuration.

---

## Conclusion & Recommendation

The contents of `public/legacy/` are confirmed to be **technically debt**. They contain no active unique logic that hasn't been ported to the V3 architecture.

> [!RECOMMENDATION]
> **Delete**: `AlbumsView_DEPRECATED.js`, `EditPlaylistView_DEPRECATED.js`, `hybrid-curator.html`.
> **Keep**: `index_redirect.html` (as a safety measure).
