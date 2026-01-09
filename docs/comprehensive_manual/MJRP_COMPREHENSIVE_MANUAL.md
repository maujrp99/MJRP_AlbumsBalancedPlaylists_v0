# MJRP Albums Balanced Playlists: The Comprehensive Manual
> **Version**: 1.0.0
> **Generated**: 2026-01-08
> **Scope**: Full Stack Deep Dive

---

## 📖 Introduction
This document serves as the **SINGLE SOURCE OF TRUTH** for the MJRP codebase. It is the synthesis of a forensic audit covering **193+ codebase files**, organized into **28 "Deep Dive" Analysis Modules**. It covers every aspect of the system from the Node.js backend to the Vanilla JS frontend, including the sophisticated Curation Algorithms and Data Pipelines.

---

# PART 1: SYSTEM ARCHITECTURE
*Source: `system_architecture.md`*

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

## 2. Directory Structure Overview
```text
/server
  /lib                # Core Business Logic (Ranking, Scraping)
  /routes             # API Endpoints
  /schema             # JSON Schemas (AJV)
  /scripts            # Maintenance Scripts
  /services           # Auth Services (MusicKit)
  /test               # Server-side Tests

/public/js
  /algorithms         # Playlist Generation Algorithms (Balanced Cascade, TopN)
  /api                # API Client
  /cache              # Cache Managers (IndexedDB, Memory)
  /components         # UI Component Library (55+ Components)
  /controllers        # MVC Controllers (Data Orchestration)
  /helpers            # DOM/Utils Helpers
  /migration          # Data Migration Tools
  /models             # Domain Models (Album, Track, Playlist)
  /ranking            # Ranking Strategies (Balanced, Spotify, BEA)
  /repositories       # Data Access Layer (Firestore Wrappers)
  /services           # Application Services (Auth, Sync, MusicKit)
  /stores             # State Stores (Flux Pattern)
  /transformers       # Data Normalizers
  /utils              # Low-level Utilities (SafeDOM)
  /views              # MVC Views & Renderers
  /workers            # Web Workers (Fuzzy Search)

/test                 # Frontend Test Suite
  /e2e                # Puppeteer End-to-End Tests
  /stores             # Store Unit Tests
  /views              # View Logic Tests
  /services           # Service Logic Tests
  /algorithms         # Algorithm Logic Tests

/shared
  /curation.js        # The "Brain" (Playlist Algo) - Shared
  /normalize.js       # String Utilities
```

---

# PART 2: THE SERVER SIDE
*Sources: `server_core.md`, `server_libs.md`, `server_logic.md`, `server_routes.md`*

## 1. Intelligence Orchestration & Ranking
The backend employs a **Multi-Stage Waterfall Strategy** to determine the "Acclaim Ranking" for tracks. This is orchestrad by `fetchRanking.js`.

### The Strategy (The "Sprint 9 Pivot")
1.  **BestEverAlbums (Community)**:
    *   **Goal**: Extract human-curated rankings.
    *   **Threshold**: Requires **>= 3 rated tracks** or **40% coverage** of the album.
    *   **Logic**: If this threshold fails, the data is discarded as "Sparse" to prevent skewing.
2.  **Spotify Popularity (Fallback 1)**:
    *   **Goal**: Use consumption data as a proxy for acclaim.
    *   **Logic**: Batches track IDs (`/v1/tracks`) to fetch the `popularity` index (0-100).
    *   **Win Condition**: Exclusively wins if coverage >= 50%. It *replaces* sparse BEA data rather than merging.
3.  **AI Enrichment (Fallback 2)**:
    *   **Goal**: Last resort for obscure albums.
    *   **Mechanism**: Injects the `rankingPrompt` (see below) into Gemini.

### The Mathematics: Consolidation Logic (`server/lib/ranking.js`)
Once raw data is gathered, it is merged via a **Borda Count Variant**:
*   **Matching**: Uses **Fuzzy Token Overlap** to align external track names (e.g. "Song (Live)") with the official tracklist.
*   **Scoring**: `Points = N - Position + 1`.
*   **Divergence**: Tracks found in reputable sources but missing from the album are flagged in the `divergence` report for debugging.

## 2. Core Library Logic

### 2.1 AI Constraints & Reliability
*   **Anti-Hallucination**: The `rankingPrompt` explicitly forbids inventing URLs. It instructs the AI to set `referenceUrl: null` if unverified.
*   **Context Injection**: The prompt includes a "Trusted Sources" list of 11 providers (Rolling Stone, NME, Pitchfork, etc.) to ground the AI's search.
*   **Resilience (`normalize.js`)**:
    *   **JSON Repair**: Uses regex heuristics (`tryRecoverRankingFromText`) to extract valid JSON objects even if the LLM wraps them in Markdown or explanatory text.
    *   **Sanitization**: `cleanFencedMarkdown` strips code blocks before parsing.

### 2.2 Intelligent Scraping (`server/lib/scrapers/besteveralbums.js`)
*   **Heuristics**:
    *   **Smart Search**: Prioritizes `suggest.php` for exact "Artist - Album" matches to avoid full search page parsing.
    *   **Tribute Blocking**: Maintains a "Risk Table" of keywords (e.g., `tribute`, `string quartet`, `lullaby`) to reject False Positive albums during discovery.
*   **Validation (`validateSource.js`)**:
    *   Performs **HEAD requests** on metadata URLs to ensure strictly valid links (Status < 400) are returned to the client.

### 2.3 The Schema Layer
*   **AJV Validation**: All AI outputs are strictly validated against `server/schema/album.schema.json` (Draft-07).
*   **Protection**: Prevents "Ghost Tracks" or malformed structure from crashing the Frontend.

---

# PART 3: THE FRONTEND CORE
*Sources: `frontend_js_root.md`, `frontend_core.md`, `frontend_infra_utils.md`*

## 1. Application Shell
*   **Entry**: `public/js/app.js` bootstraps the app on `DOMContentLoaded`.
*   **Auth Gate**: Waits for `AuthService.waitForAuth()` before routing.
*   **Router**: `public/js/router.js` handles client-side navigation (`pushState`) and rendering changes in `#app`.

## 2. Infrastructure & Utilities
*   **SafeDOM (`public/js/utils/SafeDOM.js`)**: A security-first wrapper for DOM creation. **ZERO `innerHTML` usage**.
*   **Web Workers**: `search.worker.js` offloads heavy fuzzy search (uFuzzy) for the 30k+ album autocomplete index.
*   **TrackTransformer**: The "Universal Adapter" that normalizes Spotify/Apple/Firebase data into a canonical `Track` format.

---

# PART 4: FRONTEND DATA LAYER
*Sources: `frontend_data_layer.md`, `frontend_data_infra.md`, `frontend_models_controllers_gap.md`*

## 1. Store Architecture (Flux-Lite)
*   **Stores**: Singleton Observables (`albumsStore`, `playlistsStore`, `userStore`).
*   **Pattern**:
    *   **Load**: Repository -> Store.
    *   **Sync**: Store -> Firestore (Background).
    *   **Notify**: Store -> View (via `subscribe()`).

## 2. Caching Strategy (Dual-Layer)
*   **Manager**: `CacheManager.js`.
*   **L1**: Memory (Instant).
*   **L2**: IndexedDB (Persistent across reloads).
*   **Logic**: Seamlessly promotes L2 hits to L1. Fails safe to L1 if IDB is blocked.

## 3. Data Models
*   **Album**: Supports Dual-Tracklists (`tracksOriginalOrder` vs `tracksByAcclaim`).
*   **AlbumIdentity**: Solves the "Fuzzy Match Problem" by hashing Artist+Title to prevent duplicate API calls for "Remastered" versions.

---

# PART 5: FRONTEND SERVICES & ENGINES
*Sources: `frontend_services.md`, `frontend_musickit_internals.md`, `frontend_album_search_engine.md`*

## 1. Album Classification Engine ("The Judge")
*   **File**: `AlbumTypeClassifier.js`.
*   **Goal**: Distinguish "Studio Albums" from Singles/EPs/Compilations, especially for Electronic Music.
*   **Pipeline**: Chain of Responsibility.
    1.  **Metadata Check**: Trusts Apple if explicit.
    2.  **Genre Gate**: If "Electronic", enters deep heuristics.
    3.  **Track Count**: < 4 is Single, 4-6 is EP.
    4.  **AI Whitelist ("Judgment Day")**:
        *   Consults a Server-side AI Whitelist of known Studio Albums.
        *   **Rescue Logic**: If a 5-track EP matches a known Studio Album in the whitelist, it is **Rescued** (promoted) to Album status.
        *   **Safety**: Uses a "Risk Table" (keywords like "Club Mix") to prevent false rescues.

## 2. MusicKit Integration
*   **Facade**: `MusicKitService.js` hides the complexity of Apple's SDK.
*   **Lazy Loading**: Injects `musickit.js` only on demand.
*   **Storefront**: Detects User vs Browser storefronts to avoid "Item Not Available" errors.

## 3. Data Sync
*   **Migration**: `DataSyncService.js` moves Guest data (LocalStorage) to Firestore upon Login.

---

# PART 6: FRONTEND UI (VIEWS & COMPONENTS)
*Sources: `frontend_views.md`, `frontend_components_*.md`, `frontend_views_renderers.md`*

## 1. Component Architecture ("Universal Pattern")
*   **Base**: `Component.js` (Lifecycle: Mount, Update, Unmount).
*   **Universal Card**: `Card.js` handles Albums, Playlists, and Series via `props.variant`.
*   **Safe Rendering**: All components use `SafeDOM`.

## 2. Key Complex Views
### A. The "Blend" Wizard (`BlendingMenuView.js`)
*   **Concept**: Select Series -> Select Flavor (Algorithm) -> Configure Ingredients.
*   **Components**: `BlendSeriesSelector`, `BlendFlavorCard`, `BlendIngredientsPanel`.

### B. Playlist Workbench (`PlaylistsView.js`)
*   **Features**:
    *   **Drag & Drop**: Reorder tracks between playlists (`PlaylistsDragBoard`).
    *   **Edit Batch**: Edit existing batches without regenerating.
    *   **Ranking Comparison**: Visualizes "My Rank" vs "World Rank".

### C. Inventory (`InventoryView.js`)
*   **Renderer**: `InventoryGridRenderer` (Pure String generation for performance).
*   **Features**: Format tracking (Vinyl/CD), Currency conversion (USD/BRL).

## 3. Search & Ranking Components
*   **TracksRankingComparison**: A "Smart Container" that merges local data with Spotify/BEA stats.
*   **Mobile Optimizations**: Uses `TracksTabs` (Tabs) on mobile vs `TracksTable` (Columns) on desktop.

---

# PART 7: LOGIC & ALGORITHMS
*Source: `frontend_logic_core.md`*

## 1. MJRP Balanced Cascade Algorithm
*   **Status**: Default Algorithm.
*   **Logic**:
    1.  **Greatest Hits**: Extracts Rank #1 and #2 from all albums.
    2.  **Deep Cuts Setup**: Calculates N buckets.
    3.  **Serpentine Distribution**: Distributes tracks Back-to-Front (odd albums) and Front-to-Back (even albums) to balance quality distribution.
    4.  **Cascade Rebalancing**: Ping-pongs excess tracks.

## 2. Ranking Strategies (`strategies/`)
*   **Balanced**: Acclaim > Rating > Popularity.
*   **Spotify**: Pure Popularity (Desc).

---

# PART 8: QUALITY ASSURANCE & LEGACY
*Sources: `test_suite_analysis.md`, `legacy_analysis.md`*

## 1. Test Suite (Batch 13)
*   **Frameworks**: Vitest (Unit) + Puppeteer (E2E).
*   **Structure**:
    *   `test/e2e/`: Smoke tests, Navigation flows.
    *   `test/stores/`: State logic verification.
    *   `test/views/`: Component rendering logic (Mocked).

## 2. Legacy Debt
*   **Note**: `public/legacy/` contains deprecated V2 views (`AlbumsView_DEPRECATED`) that are safe to delete as they have been fully replaced by the V3 Controller architecture.
