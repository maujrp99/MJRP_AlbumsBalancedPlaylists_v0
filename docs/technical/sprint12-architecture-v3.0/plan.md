# Implementation Plan: V3 Refactor & Componentization

**Spec**: [spec.md](./spec.md)
**Status**: Draft
**Architecture**: Vanilla JS Component-Based (Evolutionary)

---

## 1. Architecture Strategy: "Responsive Componentization"

We are moving from **View-Based** (Monolithic) to **Component-Based** (Modular).
The file `AlbumsView.js` will be **Renamed** to `SeriesView.js` to reflect its true purpose: orchestrating `AlbumSeries`, `ArtistSeries`, and `GenreSeries`.

### 1.1 Design Patterns & Trade-offs
| Pattern | Why we chose it | Alternative Considered | Why Rejected? |
| :--- | :--- | :--- | :--- |
| **Component-Based** | Reusability & Testability ("Lego Blocks"). | **Monolithic View** | Current state; unmaintainable God Class. |
| **MVC (Controller)** | Decouples Logic (`AlbumsController`) from UI. | **MVVM** | Too complex for Vanilla JS without a framework. |
| **Observer (Stores)** | Reactivity without prop drilling. | **Redux** | Overkill for this project size. |
| **Repository** | Data access abstraction (Firestore/Local). | **Direct API Calls** | Harder to test and migrate data sources. |

### 1.1 Component Hierarchy (Target State)
```mermaid
graph TD
    App --> SeriesView[Series View (Orchestrator)]
    
    SeriesView --> SeriesHeader[Series Header (Meta & Actions)]
    SeriesView --> SeriesFilterBar[Filter & Search Bar]
    SeriesView --> SeriesGrid[Series Grid (Responsive)]
    
    SeriesGrid --> EntityCard[Entity Card (Album/Track/Artist)]
    
    SeriesView --> BlendingMenuView[Blending Menu (Full View/Overlay)]
    
    SeriesView --> SeriesController[Series Controller (Logic Only)]
```

### 1.2 "Write Once, Adapt Everywhere"
Components will use CSS Grid/Flex with Tailwind classes to adapt, NOT disparate HTML blocks.
*   **Desktop**: `grid-cols-4`, Hover actions visible.
*   **Mobile**: `grid-cols-1`, Actions via "Three-dot" menu (Touch-friendly).

---

## 2. Feature Component Map (The Refactor "Shopping List")

We must extract these **16 distinct responsibilities** from `AlbumsView.js` (becoming `SeriesView.js`) and other views.

| Feature | Current Logic | Target Component | Responsibility |
| :--- | :--- | :--- | :--- |
| **Grid Rendering** | `renderAlbumsGrid` | `components/series/SeriesGridRenderer.js` | Pure rendering of the grid layout. |
| **Card HTML** | `getAlbumCardTemplate` | `components/series/EntityCard.js` | Generic card for Albums/Artists/Tracks. |
| **Ghost Album** | `renderGhostAlbum` | `components/series/EntityCard.js` | "Add Entity" placeholder logic. |
| **Search/Filter** | `setupSearchListeners` | `components/series/SeriesFilterBar.js` | Input debouncing and sort dropdowns. |
| **Series Meta** | `renderHeader` | `components/series/SeriesHeader.js` | Title, description, and stats display. |
| **Loading State** | `renderSkeletons` | `components/shared/SkeletonLoader.js` | Reusable loading UI. |
| **Drag & Drop** | `initSortable` | `components/series/SeriesDragDrop.js` | SortableJS integration for reordering. |
| **Context Menu** | `handleCardAction` | `components/shared/ContextMenu.js` | "Three-dot" menu actions. |
| **Inventory Grid** | `InventoryView.js` | `components/inventory/InventoryGrid.js` | Reuses `SeriesGridRenderer` with inventory actions. |
| **Playlist Drag** | `PlaylistsView.js` | `components/playlists/PlaylistsDragBoard.js` | Kanban-like drag interface. |
| **Playlist Export** | `PlaylistsView.js` | `components/playlists/PlaylistExportToolbar.js` | Export to Spotify/Apple logic. |
| **Home Carousel** | `HomeView.js` | `components/home/HomeCarousel.js` | Series/Artist/Genre/Track selection flow. |
| **Series Cards** | `HomeView.js` | `components/home/SeriesGrid.js` | Visual cards for Series (replacing list). |
| **Branding** | `TopNav.js` | `components/navigation/Breadcrumbs.js` | Contextual navigation breadcrumbs. |
| **Data Fetching** | `loadSeries` | `controllers/SeriesController.js` | Orchestrating Store interaction. |
| **Event Routing** | `bindEvents` | `controllers/SeriesController.js` | DOM event -> Business Logic mapping. |
| **Blending Menu** | *New Feature* | `components/blending/BlendingMenuView.js` | **Full Screen Overlay** for configuring the mix. |

---

## 3. Data Schemas

### 3.1 RankingContext (The "Blending Menu" Contract)
This object is passed from UI to `CurationEngine`.

```json
{
  "style": "balanced_cascade",  // "deep_cuts", "artist_spotlight"
  "targetDuration": 2700,       // Seconds (45m)
  "parameters": {
    "strictness": 0.8,          // 0.0 - 1.0 (How strict on acclaim?)
    "p1_count": 1,              // Number of "Hits" per album
    "deep_cut_ratio": 0.5       // % of playlist dedicated to deep cuts
  },
  "scope": {
    "type": "series",           // "series" (Album), "artist", "genre", "track"
    "id": "series_123"
  },
  "sources": [
    { "id": "bea", "weight": 1.0 },
    { "id": "spotify", "weight": 0.8 }
  ]
}
```

---

## 4. UI Mocks: "The Blending Menu"

**Trigger**: "Create Mix" button in Header.

```text
+---------------------------------------------------------------+
|  🥤 The Blending Menu                                     [X] |
+---------------------------------------------------------------+
|  1. CHOOSE YOUR FLAVOR (Presets)                              |
|  [ MJRP Balanced ] [ Deep Cuts ] [ Party Hits ] [ Custom ]    |
|                                                               |
|  ---------------- (Condition: Algorithm Selected) ----------------
|  2. CONFIGURE ALGORITHM                                       |
|  [>] Target Duration: [ 45m ] [ 60m ] (Visible if time-based) |
|  [>] Strictness (Discovery Mode):                             |
|      [ Low (Hits) ] [ Med ] [ High (Deep Cuts) ]              |
|      "Low: Mainly popular tracks. High: More obscure tracks." |
|                                                               |
|  ---------------- (Condition: Always Visible) --------------------
|  3. OUTPUT CONFIGURATION                                      |
|  Mode: [ (o) Single Playlist ] [ ( ) Split by Era (Series) ]  |
|  Name: [ "Pink Floyd - Essential Mix" ]                       |
+---------------------------------------------------------------+
|                                       [ Cancel ] [ BLEND IT ] |
+---------------------------------------------------------------+
```

---

## 5. Execution Steps

### 5.1 Infrastructure
1.  Create `public/js/components/base/Component.js` (The Interface).
2.  Create `public/js/controllers/AlbumsController.js`.

### 5.2 Extraction (Surgical)
3.  **Step 1**: Extract `AlbumCard` & `AlbumsGridRenderer` (Visuals only).
4.  **Step 2**: Extract `AlbumsFilterBar`.
5.  **Step 3**: Extract `SeriesHeader`.
6.  **Step 4**: Move Logic to `AlbumsController`.

### 5.3 New Features
7.  Implement `BlendingMenuModal`.
8.  Refactor `CurationEngine` to accept `RankingContext`.

### 5.4 Navigation Strategy (Responsive)
*   **Desktop**: Horizontal Top Bar.
    *   `[Logo] [Series Select] | [Albums] [Playlists] [Inventory] | [Create Mix (CTA)] [Profile]`
*   **Mobile**: "App-Like" Shell.
    *   **Top Bar**: `[Logo] [Hamburger Menu]` (Context & Filter).
    *   **Bottom Nav** (Future Sprint) or **Drawer**: For main section switching.
    *   **Create Mix**: Floating Action Button (FAB) or Prominent Header Button in `AlbumsView`.
*   **Implementation**: Refactor `TopNav.js` to use `hidden md:flex` classes and add a Mobile Menu state.

## 6. Verification
*   **Manual**: Verify "Ghost Album" works after Card extraction.
*   **Manual**: Verify Drag & Drop still works on Desktop.
*   **Manual**: Verify Context Menu appears on Mobile tap.
