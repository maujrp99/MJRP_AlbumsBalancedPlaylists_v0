# Deep Dive: Frontend Infrastructure & Utilities

This document analyzes the "Plumbing" of the frontend: The utilities, transformers, and workers that power the application.

## 1. Web Workers & Performance
### Search Worker (`public/js/workers/search.worker.js`)
*   **Role**: Offloads heavy fuzzy search operations from the main thread.
*   **Tech Stack**: `uFuzzy` (Micro-library for fuzzy search).
*   **Flow**:
    1.  Fetches `albums-autocomplete.json` on init.
    2.  Builds a "Haystack" of strings (`Artist - Album`).
    3.  Receives `postMessage` query -> Returns Top N matches sorted by year.
*   **Why**: Ensures smooth UI interactions even when searching 1000+ albums.

---

## 2. Security & DOM Manipulation
### SafeDOM (`public/js/utils/SafeDOM.js`)
*   **Role**: A lightweight, ergonomic wrapper for `document.createElement`.
*   **Security**: **ZERO `innerHTML` usage**. All text is set via `textContent` or text nodes, eliminating XSS vectors by design.
*   **API**: Fluent interface (`SafeDOM.div({ className: 'foo' }, [children])`).
*   **SVG Support**: Dedicated namespace handling for SVG creation (`SafeDOM.svg`, `SafeDOM.path`).

---

## 3. Data Normalization
### TrackTransformer (`public/js/transformers/TrackTransformer.js`)
*   **Role**: The "Universal Adapter" for track data.
*   **Concept**: Converts disparate data shapes (Spotify API, Apple Music Kit, Firestore DB, Legacy JSON) into a strict **Canonical Track** format.
*   **Key Properties**:
    *   `acclaimRank` vs `spotifyRank` (Clear separation of authorities).
    *   `id`: Uses `crypto.randomUUID()` fallback.
    *   `metadata`: Preserves original source data for debugging.
*   **Methods**:
    *   `toCanonical(raw, context)`: The factory method.
    *   `mergeSpotifyData(track, spotifyData)`: Late-binding enrichment.

---

## 4. Other Utilities
*   **`stringUtils.js`**: Standard string manipulation (slugify, escapeHtml).
*   **`dom-helpers.js`**: Low-level DOM traversal/manipulation helpers.
*   **`SvgGenerator.js`**: Dynamic SVG generation (likely for placeholders or dynamic icons).
