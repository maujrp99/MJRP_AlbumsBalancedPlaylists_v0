# Sprint 6 Phase 7: Data Enrichment & Polish Specification

## 1. Overview
This sprint aims to resolve two key user experience limitations identified in the production candidate:
1.  **Missing Album Covers**: The current `albums.csv` dataset lacks image URLs.
2.  **Limited Autocomplete**: The dataset is restricted to the top 3,000 "Acclaimed Music" albums, missing discographies of major artists.

## 2. Architecture: "Static Data Enrichment"
Instead of migrating to a fully dynamic search (which adds latency and complexity), we will generate a robust **static dataset** at build/script time.

### Component Diagram
`scripts/generate-dataset.js` (Node.js) --> **Discogs API** --> `public/assets/data/albums-expanded.json` (Chunked?) --> `AlbumLoader.js` (Frontend)

## 3. Implementation Plan

### 3.1 Data Generation Script (`scripts/generate-dataset.js`)
A Node.js utility that performs the following:
1.  **Input**: Reads `public/assets/data/albums.csv` to get the list of "Acclaimed" albums/artists.
2.  **Enrichment (Covers)**: Search **Discogs API** (Release/Master search) to get the cover image URL.
3.  **Expansion (Discography)**: Search Discogs for the Artist's "Main Releases" (Albums) to populate autocomplete.
4.  **Output**: Saves to `public/assets/data/albums-db.json`.

### 3.2 Chunking Strategy
To prevent a large JSON file blocking load:
- **Core Chunk (`albums-core.json`)**: The original 3,000 albums. Loaded immediately.
- **Expansion Chunks (`albums-search-index.json`)**: Loaded lazily for search.

### 3.3 Frontend Updates
- **`AlbumLoader.js`**: Handle JSON loading.
- **`InventoryRepository.js`**: Persist cover URLs.

## 4. Requirement: API Credentials
- **Apple Music**: Blocked (Requires Active Developer Program).
- **Discogs**: Selected.
    - Requires: `DISCOGS_TOKEN` (Personal Access Token - Free).

## 5. Verification
- Run script with Discogs Token.
- Verify Covers match (Discogs covers can be user-uploaded, may need fallback logic).
- Verify Discography expansion.
