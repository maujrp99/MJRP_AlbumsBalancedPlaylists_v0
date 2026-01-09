# System Architecture & Map

> **Purpose**: This document serves as the high-level map for the entire codebase, linking specific features to their detailed documentation and source files. Used for navigation and "Big Picture" understanding.

## 1. High-Level Architecture
**Status**: `[ACTIVE]`

The system follows a **Hybrid SPA/SSR** architecture with a Node.js Backend (AI Proxy & Scraper) and a Vanilla JS Frontend (MVC Pattern).

```mermaid
graph TD
    Client[Frontend (Vanilla JS)] <--> Backend[Server (Express/Node)]
    Backend <--> External[External Services]
    
    subgraph Client Layer
        Router[SPA Router]
        Stores[State Stores]
        Views[MVC Views]
        Services[Client Services]
    end
    
    subgraph Server Layer
        API[Express API]
        Controller[Route Controllers]
        Scrapers[HTML Scrapers]
        Orchestrator[Ranking Orchestrator]
    end
    
    subgraph External
        Spotify[Spotify Web API]
        BEA[BestEverAlbums]
        AI[LLM Provider]
        Firebase[Firestore DB]
    end
    
    Client -- Fetch API --> API
    API -- Axios --> External
    Views -- Subscribe --> Stores
    Stores -- Sync --> Firebase
```

---

## 2. Feature Map & Documentation Index

### 📍 Playlist Generation Algorithms
*   **Documentation**: `docs/comprehensive_manual/raw_analysis/shared_code.md`
*   **Source Code**: `shared/curation.js`
*   **Key Logic**:
    *   **P1/P2/DeepCuts Distribution**: How tracks arebucketed driven by "Acclaim Rank".
    *   **Swap Balancing**: The algorithm that balances playlist durations (Swap Heuristic).

### 📍 Component & Module Map
*   **Frontend Modules**: `docs/comprehensive_manual/raw_analysis/frontend_views.md`
    *   Maps **Views** (`PlaylistsView`) -> **Controllers** (`PlaylistsController`) -> **Renderers** (`PlaylistsGridRenderer`).
*   **Server Modules**: `docs/comprehensive_manual/raw_analysis/server_core.md`
    *   Maps **Express Routes** -> **Controllers** -> **Libraries**.

### 📍 Album Scanning & Classification
*   **Classification**: `docs/comprehensive_manual/raw_analysis/server_core.md` (Section 4: `server/lib/ranking.js`)
    *   **Logic**: Borda Count Consolidation (Merging BestEver + Spotify + AI ratings).
*   **Scanning (Scrapers)**: `docs/comprehensive_manual/raw_analysis/server_core.md` (Section 5: `server/lib/scrapers/besteveralbums.js`)
    *   **Logic**: Cheerio-based HTML parsing logic.
*   **Searching (Spotify)**: `docs/comprehensive_manual/raw_analysis/frontend_data_layer.md`
    *   **Logic**: Fuzzy Matching & Search Heuristics in `SpotifyService.js`.

### 📍 Blending Menu Logic
*   **Documentation**: `docs/comprehensive_manual/raw_analysis/frontend_views.md` (Section 4.1)
*   **Source Code**: `public/js/views/BlendingMenuView.js`
*   **Logic**: The "Wizard" state machine (Blend -> Flavor -> Ingredients).

---

## 3. Directory Structure Overview
```text
/server
  /index.js           # Entry Point & Polyfills
  /routes             # API Endpoints
  /lib                # Core Business Logic (Ranking, Scraping)
  /services           # Auth Services (MusicKit)

/public/js
  /app.js             # Bootstrapper
  /router.js          # SPA Routing
  /views              # UI Pages (MVC View)
  /controllers        # UI Logic (MVC Controller)
  /stores             # State Management (Singleton)
  /services           # external Integration (Spotify, Auth)
  /components         # Reusable UI Blocks

/shared
  /curation.js        # The "Brain" (Playlist Algo) - Shared
  /normalize.js       # String Utilities
```
