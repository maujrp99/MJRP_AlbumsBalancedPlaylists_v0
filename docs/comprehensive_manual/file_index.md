# Comprehensive File Index

| File Path | Usage Status | Classification | Description |
| :--- | :--- | :--- | :--- |
| **SERVER CORE** | | | |
| `server/index.js` | **[ACTIVE]** | Entry Point | Main Express server entry point. Configures middleware (CORS, JSON), loads env vars, and mounts API routes (`/api`). |
| `server/package.json` | **[ACTIVE]** | Config | Defines server dependencies (express, cors, axios, etc.) and scripts. Package name: `vibecoding-proxy`. |
| `config/prompts.json` | **[ACTIVE]** | Config | JSON file containing system prompts for AI generation (e.g., `generate_playlist_v2`, `enrich_album`). Loaded by `lib/prompts.js`. |
| `server/schema/album.schema.json` | **[ACTIVE]** | Schema | JSON Schema for validating Album objects (title, artist, tracks). Used by `lib/schema.js`. |
| `server/services/MusicKitTokenService.js` | **[ACTIVE]** | Service | Generates Apple MusicKit Developer Tokens (JWT) using ES256 and a private key from env vars. Singleton instance. |
| **SERVER ROUTES** | | | |
| `server/routes/ai.js` | **[ACTIVE]** | Route | POST `/api/ai/studio-albums`. AI-powered discography discovery. |
| `server/routes/albums.js` | **[ACTIVE]** | Route | POST `/api/generate`, `/api/enrich-album`. Core album processing and ranking logic. Uses Dependency Injection. |
| `server/routes/debug.js` | **[ACTIVE]** | Route | Debug endpoints (`/list-models`, `/debug/*`) for diagnosing AI, filesystem, and ranking issues. |
| `server/routes/musickit.js` | **[ACTIVE]** | Route | GET `/api/musickit-token`. Frontend auth token generation. |
| `server/routes/playlists.js` | **[ACTIVE]** | Route | POST `/api/playlists`. Generates playlists using shared curation algorithms. |
| **SERVER LIBRARIES (ROOT)** | | | |
| `server/lib/aiClient.js` | **[ACTIVE]** | Utility | Wrapper for Google Gemini API with search grounding and retry logic. |
| `server/lib/fetchRanking.js` | **[ACTIVE]** | Logic | Orchestrates fetching rankings from Scrapers (BestEver), Spotify Fallback, and AI Enrichment. |
| `server/lib/logger.js` | **[ACTIVE]** | Utility | JSON structured logger for Cloud Run observability. |
| `server/lib/normalize.js` | **[ACTIVE]** | Utility | Robust JSON extraction/repair from AI text responses. Normalizes Album objects. |
| `server/lib/prompts.js` | **[ACTIVE]** | Config | Loads and renders Prompt templates from JSON config. |
| `server/lib/ranking.js` | **[ACTIVE]** | Logic | Implements Borda Count consensus algorithm and Fuzzy Token matching for track alignment. |
| `server/lib/schema.js` | **[ACTIVE]** | Validation | AJV wrapper for `album.schema.json`. |
| `server/lib/schema.js` | **[ACTIVE]** | Validation | AJV wrapper for `album.schema.json`. |
| `server/lib/validateSource.js` | **[ACTIVE]** | Utility | Verifies external reference URLs via HTTP request to prevent hallucinations. |
| **SERVER SUB-LIBRARIES** | | | |
| `server/lib/scrapers/besteveralbums.js` | **[ACTIVE]** | Scraper | Complex scraper for BestEverAlbums. Uses `suggest.php` heuristics and HTML parsing. |
| `server/lib/scrapers/besteveralbums.js` | **[ACTIVE]** | Scraper | Complex scraper for BestEverAlbums. Uses `suggest.php` heuristics and HTML parsing. |
| `server/lib/services/spotifyPopularity.js` | **[ACTIVE]** | Service | Client Credentials Auth. Fetches Spotify Popularity scores (0-100) for fallback ranking. |
| **SHARED MODULES** | | | |
| `shared/curation.js` | **[ACTIVE]** | Logic | **Core Algorithm**: Generates balanced playlists, handles ranking consolidation, and duration balancing swaps. Isomorphic. |
| `shared/normalize.js` | **[ACTIVE]** | Utility | String normalization for cross-provider matching (removes remasters, parens, special chars). |
| `shared/curation.js` | **[ACTIVE]** | Logic | **Core Algorithm**: Generates balanced playlists, handles ranking consolidation, and duration balancing swaps. Isomorphic. |
| `shared/normalize.js` | **[ACTIVE]** | Utility | String normalization for cross-provider matching (removes remasters, parens, special chars). |
| `shared/services/AuthService.js` | **[ACTIVE]** | Service | Firebase Auth wrapper (Google/Apple Sign-in) using Singleton pattern. |
| **FRONTEND CORE** | | | |
| `public/index.html` | **[ACTIVE]** | Entry Point | SPA Shell. Loads Tailwind CDN, Google Fonts, and `app.js`. Defines CSP. |
| `public/css/animations.css` | **[ACTIVE]** | Style | Global keyframe animations (Shimmer, ZoomIn, Pulse). |
| `public/css/index.css` | **[ACTIVE]** | Style | CSS Entry point (imports other CSS files). |
| `public/css/modals.css` | **[ACTIVE]** | Style | Custom modal component styles with glassmorphism. |
| `public/css/neon.css` | **[ACTIVE]** | Style | "Neon" theme utilities (Glows, Shadows). |
| `public/css/neon.css` | **[ACTIVE]** | Style | "Neon" theme utilities (Glows, Shadows). |
| `public/css/tech-theme.css` | **[ACTIVE]** | Style | "Tech" theme utilities (Grid BG, Chamfered panels). |
| **FRONTEND JS ROOT** | | | |
| `public/js/app.js` | **[ACTIVE]** | Bootstrap | Main Entry Point. Initializes Auth, Router, and global Events. |
| `public/js/api.js` | **[ACTIVE]** | Client | API client for backend proxy interactions with retry logic. |
| `public/js/firebase-init.js` | **[ACTIVE]** | Config | Initializes Firebase App, Auth, and Firestore using modular SDK. |
| `public/js/firebase-init.js` | **[ACTIVE]** | Config | Initializes Firebase App, Auth, and Firestore using modular SDK. |
| `public/js/router.js` | **[ACTIVE]** | Logic | Custom History API Router. Supports View rendering and navigation hooks. |
| **FRONTEND MODELS** | | | |
| `public/js/models/Album.js` | **[ACTIVE]** | Model | Domain entity for Albums. Aggregates tracks and manages sort orders. |
| `public/js/models/AlbumIdentity.js` | **[ACTIVE]** | Model | Stable identity mapping (Query <-> Result) for fuzzy matching consistency. |
| `public/js/models/Playlist.js` | **[ACTIVE]** | Model | Domain entity for Playlists. Calculates durations and track counts. |
| `public/js/models/Series.js` | **[ACTIVE]** | Model | Domain entity for Album Series (collections of albums). |
| `public/js/models/Track.js` | **[ACTIVE]** | Model | Canonical Track schema. Unifies data from Spotify, Acclaim, and Scrapers. |
| **FRONTEND STORES** | | | |
| `public/js/stores/albumSeries.js` | **[ACTIVE]** | Store | Manages Collection of Series. Syncs with Firestore and LocalStorage. |
| `public/js/stores/albums.js` | **[ACTIVE]** | Store | Manages Albums within a Series key. Prevents data leaking between series. |
| `public/js/stores/inventory.js` | **[ACTIVE]** | Store | Manages User Inventory (Owned/Wishlist). Syncs with Firestore. |
| `public/js/stores/playlists.js` | **[ACTIVE]** | Store | Manages Playlist State, Undo/Redo, and Drag-and-Drop logic. |
| `public/js/stores/SpotifyEnrichmentStore.js`| **[ACTIVE]** | Store | Caches Spotify metadata (30-day TTL) to minimize API usage. |
| `public/js/stores/SpotifyEnrichmentStore.js`| **[ACTIVE]** | Store | Caches Spotify metadata (30-day TTL) to minimize API usage. |
| `public/js/stores/UserStore.js` | **[ACTIVE]** | Store | Manages User Auth State and profile. |
| **FRONTEND COMPONENTS (ROOT)** | | | |
| `public/js/components/Autocomplete.js` | **[ACTIVE]** | Widget | Generic Autocomplete with debounce and loader support. |
| `public/js/components/Breadcrumb.js` | **[ACTIVE]** | Nav | Dynamic breadcrumb trail generator based on URL. |
| `public/js/components/EditAlbumModal.js` | **[ACTIVE]** | Modal | Modal for editing core album metadata. |
| `public/js/components/Footer.js` | **[ACTIVE]** | Layout | Site footer with debug "Clear Cache" utility. |
| `public/js/components/GlobalProgress.js` | **[ACTIVE]** | Widget | Top-bar loading indicator (singleton). |
| `public/js/components/Icons.js` | **[ACTIVE]** | Config | Registry of SVG Icon strings. |
| `public/js/components/InlineProgress.js` | **[ACTIVE]** | Widget | Block-level progress bar for batch operations. |
| `public/js/components/InventoryAddModal.js`| **[ACTIVE]** | Modal | Form for adding items to user inventory. |
| `public/js/components/InventoryEditModal.js`| **[ACTIVE]** | Modal | Form for editing inventory items. |
| `public/js/components/LoginModal.js` | **[ACTIVE]** | Modal | Auth provider selection dialog. |
| `public/js/components/SpotifyConnectButton.js`| **[ACTIVE]**| Widget | Toggle button for Spotify Authentication state. |
| `public/js/components/SpotifyExportModal.js`| **[ACTIVE]** | Modal | Complex wizard for exporting playlists to Spotify. |
| `public/js/components/Toast.js` | **[ACTIVE]** | Widget | Global notification system. |
| `public/js/components/TopNav.js` | **[ACTIVE]** | Layout | Main App Shell / Navigation Controller. |
| `public/js/components/ViewAlbumModal.js` | **[ACTIVE]** | Modal | Detailed album view with comparison visualization. |
| **FRONTEND COMPONENTS (CORE UI)** | | | |
| `public/js/components/base/Component.js` | **[ACTIVE]** | Base | Abstract Base Class for vanilla components. |
| `public/js/components/common/AlbumCascade.js`| **[ACTIVE]** | UI | Visual stack of album thumbnails. |
| `public/js/components/shared/ContextMenu.js`| **[ACTIVE]** | UI | Floating action menu. |
| `public/js/components/shared/SkeletonLoader.js`| **[ACTIVE]**| UI | Loading state placeholders. |
| `public/js/components/ui/BaseModal.js` | **[ACTIVE]** | UI | Standardized SafeDOM modal shell. |
| `public/js/components/ui/Card.js` | **[ACTIVE]** | UI | Universal Grid/List entity card. |
| `public/js/components/ui/TrackRow.js` | **[ACTIVE]** | UI | Universal Track list item with DnD support. |
| `public/js/components/ui/modals/ConfirmModal.js`| **[ACTIVE]** | Modal | Generic Confirmation Dialog. |
| `public/js/components/ui/modals/InputModal.js`| **[ACTIVE]** | Modal | Generic Single-Input Dialog. |
| **FRONTEND COMPONENTS (FEATURES)** | | | |
| `public/js/components/blend/BlendFlavorCard.js` | **[ACTIVE]** | Blend | Step 2: Algorithm selection cards. |
| `public/js/components/blend/BlendIngredientsPanel.js`| **[ACTIVE]** | Blend | Step 3: Parameter configuration panel. |
| `public/js/components/blend/BlendSeriesSelector.js` | **[ACTIVE]** | Blend | Step 1: Series/Entity selection grid. |
| `public/js/components/home/SearchController.js` | **[ACTIVE]** | Home | Orchestrates artist search and filtering. |
| `public/js/components/home/StagingAreaController.js`| **[ACTIVE]** | Home | Manages the drag-and-drop staging stack. |
| `public/js/components/inventory/InventoryGrid.js` | **[ACTIVE]** | Inventory | Wrapper for Inventory view grid. |
| `public/js/components/search/DiscographyToolbar.js` | **[ACTIVE]** | Search | Filter bar for grid results. |
| `public/js/components/search/VariantPickerModal.js` | **[ACTIVE]** | Search | Modal for selecting specific album editions. |
| **FRONTEND COMPONENTS (COMPLEX)** | | | |
| `public/js/components/navigation/SeriesDropdown.js` | **[ACTIVE]** | Nav | TopNav Entity Selector. |
| `public/js/components/playlists/PlaylistExportToolbar.js`| **[ACTIVE]** | Playlists | Toolbar for Save/Export actions. |
| `public/js/components/playlists/PlaylistGrid.js` | **[ACTIVE]** | Playlists | Responsive grid of playlist cards. |
| `public/js/components/playlists/PlaylistsDragBoard.js` | **[ACTIVE]** | Playlists | Kanban board for playlist editing. |
| `public/js/components/playlists/PlaylistsDragHandler.js` | **[ACTIVE]** | Playlists | DnD Logic wrapper for lists. |
| `public/js/components/playlists/PlaylistsGridRenderer.js`| **[ACTIVE]** | Playlists | HTML generator for playlists view. |
| `public/js/components/playlists/RegeneratePanel.js` | **[ACTIVE]** | Playlists | Reconfiguration panel for batches. |
| `public/js/components/playlists/SavedPlaylistsController.js`| **[ACTIVE]** | Playlists | Main controller for playlist data. |
| `public/js/components/playlists/TrackItem.js` | **[ACTIVE]** | Playlists | Reusable track item component. |
| `public/js/components/ranking/TracksRankingComparison.js`| **[ACTIVE]** | Ranking | Smart container for ranking tables. |
| `public/js/components/ranking/TracksTable.js` | **[ACTIVE]** | Ranking | Desktop comparison table. |
| `public/js/components/series/ArtistScanner.js` | **[ACTIVE]** | Series | Apple Music scanner for series. |
| `public/js/components/series/SeriesDragDrop.js` | **[ACTIVE]** | Series | DnD wrapper for albums. |
| `public/js/components/series/SeriesEditModal.js` | **[ACTIVE]** | Series | Modal for editing series metadata. |
| `public/js/components/series/SeriesEventHandler.js` | **[ACTIVE]** | Series | Event delegation for series grid. |
| `public/js/components/series/SeriesFilterBar.js` | **[ACTIVE]** | Series | Secondary filter component. |
| `public/js/components/series/SeriesGridRenderer.js` | **[ACTIVE]** | Series | Adapter for rendering series grids. |
| `public/js/components/series/SeriesModals.js` | **[ACTIVE]** | Series | Modal orchestrator/facade. |
| `public/js/components/series/SeriesToolbar.js` | **[ACTIVE]** | Series | Main series filter toolbar. |
| **FRONTEND VIEWS** | | | |
| `public/js/views/BaseView.js` | **[ACTIVE]** | Core | Abstract base view class. |
| `public/js/views/BlendingMenuView.js` | **[ACTIVE]** | Feature | Playlist generation wizard. |
| `public/js/views/ComingSoonView.js` | **[ACTIVE]** | Util | Placeholder page. |
| `public/js/views/ConsolidatedRankingView.js`| **[ACTIVE]** | Feature | Series-wide ranking table. |
| `public/js/views/HomeView.js` | **[ACTIVE]** | Main | Landing page & Scanner. |
| `public/js/views/InventoryView.js` | **[ACTIVE]** | Main | Collection management. |
| `public/js/views/PlaylistsView.js` | **[ACTIVE]** | Main | Playlist creation/editing. |
| `public/js/views/RankingView.js` | **[ACTIVE]** | Feature | Single album ranking detail. |
| `public/js/views/SaveAllView.js` | **[ACTIVE]** | Util | Migration utility. |
| `public/js/views/SavedPlaylistsView.js` | **[ACTIVE]** | Main | Saved playlists library. |
| `public/js/views/SeriesView.js` | **[ACTIVE]** | Main | Series browsing (orchestrator). |
| `public/js/views/albums/AlbumsFilters.js` | **[ACTIVE]** | Renderer | Album filtering logic. |
| `public/js/views/albums/AlbumsGridRenderer.js`| **[ACTIVE]** | Renderer | Standard album grid renderer. |
| `public/js/views/albums/AlbumsScopedRenderer.js`| **[ACTIVE]** | Renderer | Scope-aware album renderer. |
| `public/js/views/renderers/DiscographyRenderer.js`| **[ACTIVE]** | Renderer | Search result renderer. |
| `public/js/views/renderers/InventoryGridRenderer.js`| **[ACTIVE]** | Renderer | Inventory card renderer. |
| `public/js/views/renderers/StagingAreaRenderer.js`| **[ACTIVE]** | Renderer | Staging stack renderer. |
| `public/js/views/strategies/ViewModeStrategy.js`| **[ACTIVE]** | Core | View mode strategy pattern. |
