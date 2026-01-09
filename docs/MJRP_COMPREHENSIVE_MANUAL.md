# MJRP Playlist Generator - Comprehensive Manual
**Version**: 1.0
**Date**: 2026-01-08

## 1. Project Overview
The **MJRP Playlist Generator** is a sophisticated web application designed to manage music collections, visualize discographies, and generate balanced playlists using a unique "Performance vs. Availability" algorithm. It bridges the gap between local music libraries and modern streaming services (Spotify, Apple Music).

### Key Philosophies
*   **"Clean Room" Architecture**: A strictly componentized frontend (V3 Architecture) ensuring maintainability.
*   **Balanced Curation**: Algorithms that weigh "Greatest Hits" (External Ranking) against "Deep Cuts" (User Preference/Rarity).
*   **Visual-First**: A rich, album-art-centric interface for browsing and organization.

---

## 2. Architecture & Tech Stack

### 2.1 Technology Stack
*   **Backend**: Node.js + Express (Factory Pattern)
*   **Frontend**: Vanilla JavaScript (ES Modules)
*   **Data Store**: Firebase Firestore (User Data) + In-Memory Stores (Session)
*   **Integrations**:
    *   **Spotify API**: Enrichment (Popularity, Covers) & Export.
    *   **Apple Music (MusicKit)**: Search & catalog data.
    *   **Google Gemini AI**: Smart metadata generation and "Flavor" descriptions.
    *   **BestEverAlbums**: Community ranking data for "Acclaim" sorting.

### 2.2 Core Frontend Concepts
*   **V3 Architecture**: Moves away from monolithic Controllers to "Thin Orchestrator Views" and "Specialized Components".
    *   *Example*: `SeriesView.js` wraps `SeriesGridRenderer`, `SeriesToolbar`, etc.
*   **SafeDOM**: A custom utility (`SafeDOM.js`) for secure, XSS-resistant HTML generation.
*   **Stores**: Reactive state containers (e.g., `albumsStore`, `playlistsStore`) that notify views of changes.

---

## 3. Features & User Guide

### 3.1 Inventory Management
**URL**: `/inventory`
*   **Purpose**: Manage your personal collection of albums.
*   **Features**:
    *   **Track Ownership**: toggling between "Owned", "Wishlist", and "Not Owned".
    *   **Format Tracking**: Label albums as Vinyl, CD, or Digital.
    *   **Filtering**: Search by text or filter by format/status.
    *   **Stats**: Real-time counters for collection size and value.

### 3.2 Series Management
**URL**: `/albums` (or `/series`)
*   **Purpose**: Browse and organize albums into "Series" (e.g., "Led Zeppelin Studio Albums").
*   **Features**:
    *   **View Modes**: Toggle between **Grid** (visual) and **List** (detailed) views.
    *   **Contexts**: View "All Series" or drill down into a "Single Series".
    *   **Ranking**: Click an album to compare its "Original Tracklist" vs. "Ranked by Acclaim".

### 3.3 Playlist Generation (Blending)
**URL**: `/blend`
*   **Purpose**: The core "Wizard" for creating new playlists.
*   **Workflow**:
    1.  **Choose Your Blend**: Select a Series (e.g., "The Beatles").
    2.  **Choose Your Flavor**: Pick an algorithm (e.g., "Balanced", "Hits Only", "Deep Cuts").
    3.  **Add Ingredients**: Tweak parameters (Duration, Format).
    4.  **Generate**: Creates a batch of playlists.

### 3.4 Saved Playlists
**URL**: `/saved-playlists`
*   **Purpose**: Library of generated playlists.
*   **Features**:
    *   **Batch Organization**: Playlists are grouped by the "Batch" they were generated in.
    *   **Export**: Tools to push playlists to Spotify or Apple Music.

---

## 4. Configuration & Troubleshooting
**⚠️ IMPORTANT**: Some features require specific environment configuration to function.

### 4.1 Fixing Home Page (Scanning Stuck)
**Issue**: The Home Page scan hangs on "Scanning...".
**Cause**: The backend fails to generate an Apple Music Token (`500 Internal Server Error`).
**Solution**:
1.  Obtain an **Apple Music Developer Team ID** and **Key ID**.
2.  Download your private key (`.p8` file).
3.  Configure `.env` or Environment Variables:
    ```bash
    APPLE_TEAM_ID=your_team_id
    APPLE_KEY_ID=your_key_id
    APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY... (content) ...END PRIVATE KEY-----"
    ```
4.  Restart the server.

### 4.2 Fixing Data Migration (Crash)
**Issue**: Accessing `/save-all` crashes the app.
**Cause**: Missing or Mismatched Firebase Configuration.
**Solution**:
1.  Ensure you have a valid `firebase-config.js` or `.env` setup.
2.  The application expects the **NPM SDK** format for imports, not the CDN format.
3.  Run `npm install firebase` to ensure specific versions match `package.json`.

### 4.3 Fixing Consolidated Ranking (Empty)
**Issue**: `/consolidated-ranking` shows an empty table.
**Workaround**: Currently, use the **Single Album Ranking** modal (accessible from the Albums Grid) to view ranking data. The consolidated view is pending a data-binding fix.

---

## 5. Developer Guide

### 5.1 Project Structure
*   `server/`: Node.js backend. Routes split by domain (`albums.js`, `musickit.js`).
*   `public/js/`: Frontend source.
    *   `views/`: Top-level page controllers.
    *   `components/`: Reusable UI widgets.
    *   `stores/`: State management.
    *   `services/`: API clients (Spotify, local backend).

### 5.2 Adding a New View
1.  Create `views/MyNewView.js` extending `BaseView`.
2.  Implement `render()` (return HTML/DOM) and `mount()` (listeners).
3.  Register the route in `app.js`:
    ```javascript
    router.register('/my-new-route', () => new MyNewView());
    ```

### 5.3 Debugging
*   **Console Logs**: The Router and Services log heavily to the browser console.
*   **Server Logs**: Check the terminal output for API 500 errors (crucial for Auth/AI issues).

---
*Generated by Clean Room Analysis Protocol v1.0*
