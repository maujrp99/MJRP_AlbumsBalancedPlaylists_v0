# Sprint 15 Concept: Integrated "L-Shape" App Shell (DRAFT)

> [!WARNING]
> This is a high-level visual concept. A full feature audit (V4 Design Study) is required before implementation to ensure no features are lost.

## Objective
Transition from a "Stacked" layout (TopNav + Page Content) to an **Integrated "L-Shape" Layout** where the Navigation and Sidebar form a unified frame around the content. This creates a more immersive, premium "Application" feel versus a "Website" feel.

## Next Step: V4 Design Audit
Before coding, we must map every existing control to the new layout:
- [ ] Map all HomeView Actions (Search, Filter, Sort, Drag-Drop, etc.)
- [ ] Map all Staging Area interactions
- [ ] Map Inventory Filtering & Bulk Tools
- [ ] Map Playlist Creation & Management flows
- [ ] Map Footer Player & Queue interactions

## Visual Concept
- **Unified Sidebar (Left)**: Spans full height. Contains:
    - **Header**: Logo & Brand.
    - **Primary Navigation**: Links (Home, Series, Playlists).
    - **Context Area**: Dynamic region for page-specific tools (see below).
- **Top Bar (Top Right)**: Connected to sidebar. Contains:
    - **Breadcrumb**: Current location.
    - **Global Tools**: Spotify, Notifications, User Profile.
- **Main Content (Bottom Right)**: The scrollable viewport.

## Architectural Changes

### 1. New Component: `AppShell`
Introduces a CSS Grid structure to manage the layout globally.

```css
.grid-layout {
    display: grid;
    grid-template-areas: 
        "sidebar topbar"
        "sidebar content";
    grid-template-columns: 280px 1fr; /* Fixed Sidebar */
    grid-template-rows: 64px 1fr;     /* Fixed Topbar */
    height: 100vh;
}
```

### 2. The "Context Area" Strategy
The key innovation is the **Context Area** in the Sidebar. Different Views inject different controls here.

| View | Context Area Content | Main Content |
|------|----------------------|--------------|
| **Home** | Artist Search Input, Staging Stack list | Album Grid |
| **Inventory** | Filter Checkboxes (Format, Status), Sorting | Data Table / List |
| **Playlists** | "Create New" Button, Folder Tree | Playlist Grid |
| **Settings** | Sub-navigation (Account, Audio, App) | Forms |

**Implementation Pattern:**
The `Sidebar` component exposes a public API:
- `setContext(templateUrl, controller)` - Injects HTML and binds logic.
- `clearContext()` - Resets to empty state.

### 3. Migration Plan
1.  **Branch**: `sprint-15-layout-overhaul`.
2.  **Step 1**: Create `AppShell.js` and split `TopNav.js` into `SidebarRenderer.js` and `TopbarRenderer.js`.
3.  **Step 2**: Implement the CSS Grid Layout.
4.  **Step 3**: Refactor `HomeView.js` to use `setContext()` for its Left Panel.
5.  **Step 4**: Refactor `InventoryView.js` to move its Top Toolbar filters into the Sidebar Context (optional, but recommended for consistency).

## Risks & Mitigation
- **Mobile Layout**: On mobile, the Sidebar becomes a specialized "Drawer".
    - *Nav Mode*: Shows links.
    - *Context Mode*: Shows the injected controls (Search/Filters).
    - We will need a "Toggle Context" button in the mobile Top Bar.

## Impact Analysis
- **Codebase**: High impact. Touches `index.html`, `TopNav.js`, and all main Views.
- **User Experience**: Significant upgrade. Feels like a Pro App (e.g., VS Code, Spotify Desktop).

## ASCII Mockups

### 1. Global Shell & Home View (Context: Search/Staging)

```text
+-------------------+--------------------------------------------------+
| MJRP BLENDER   [=]| Home > Artist Scan                [Spotify] (User)|
+-------------------+--------------------------------------------------+
|                   |                                                  |
|  [ Home        ]  |  +--------------------------------------------+  |
|  [ Music Series]  |  |  02B // DISCOGRAPHY SCAN    -> LED ZEPPELIN|  |
|  [ Blending    ]  |  +--------------------------------------------+  |
|  [ Playlists   ]  |                                                  |
|                   |  [ Album Card ]  [ Album Card ]  [ Album Card ]  |
|  ---------------- |  [ Album Card ]  [ Album Card ]  [ Album Card ]  |
|  CONTEXT AREA     |  [ Album Card ]  [ Album Card ]  [ Album Card ]  |
|                   |                                                  |
|  [ Artist Input ] |                                                  |
|  [ Scan Button  ] |                                                  |
|                   |                                                  |
|  STAGING AREA     |                                                  |
|  [ Album 1 [x] ]  |                                                  |
|  [ Album 2 [x] ]  |                                                  |
|                   |                                                  |
+-------------------+--------------------------------------------------+
```

### 2. Inventory View (Context: Filters)

```text
+-------------------+--------------------------------------------------+
| MJRP BLENDER   [=]| Inventory > All Items             [Spotify] (User)|
+-------------------+--------------------------------------------------+
|                   |                                                  |
|  [ Home        ]  |  +--------------------------------------------+  |
|  [ Music Series]  |  |  TITLE             ARTIST        STATUS    |  |
|  [ Blending    ]  |  +--------------------------------------------+  |
|  [ Playlists   ]  |  |  Dark Side...      Pink Floyd    [OK]      |  |
|                   |  |  Thriller          MJ            [OK]      |  |
|  ---------------- |  |  Back in Black     AC/DC         [Missing] |  |
|  CONTEXT AREA     |  |  Rumours           Fleetwood     [OK]      |  |
|                   |  |                                            |  |
|  FILTERS          |  |                                            |  |
|                   |  |                                            |  |
|  Format:          |  |                                            |  |
|  (o) All          |  |                                            |  |
|  ( ) Vinyl        |  |                                            |  |
|  ( ) Digital      |  |                                            |  |
|                   |  |                                            |  |
|  Status:          |  |                                            |  |
|  [x] In Stock     |  |                                            |  |
|  [ ] Missing      |  |                                            |  |
|                   |  |                                            |  |
+-------------------+--------------------------------------------------+
```

### 3. Series View (Context: Configuration)

```text
+-------------------+--------------------------------------------------+
| MJRP BLENDER   [=]| Music Series > Summer Vibes 2024   [Spotify] (Use|
+-------------------+--------------------------------------------------+
|                   |                                                  |
|  [ Home        ]  |  +--------------------------------------------+  |
|  [ Music Series]  |  |  SERIES DASHBOARD: 12 Albums, 4 Playlists  |  |
|  [ Blending    ]  |  +--------------------------------------------+  |
|  [ Playlists   ]  |                                                  |
|                   |  [ Series Stats Chart ] [ Top Artists Chart ]    |
|  ---------------- |                                                  |
|  CONTEXT AREA     |  ALBUMS GRID                                     |
|                   |  [ Album ] [ Album ] [ Album ] [ Album ]         |
|  SERIES ACTIONS   |  [ Album ] [ Album ] [ Album ] [ Album ]         |
|                   |                                                  |
|  [ Edit Metadata] |  RELATED PLAYLISTS                               |
|  [ Delete Series] |  [ Playlist Card ] [ Playlist Card ]             |
|                   |                                                  |
|  VIEW OPTIONS     |                                                  |
|  (o) Grid         |                                                  |
|  ( ) List         |                                                  |
|                   |                                                  |
+-------------------+--------------------------------------------------+
```

### 4. Playlists View (Context: Management)

```text
+-------------------+--------------------------------------------------+
| MJRP BLENDER   [=]| Playlists > All Playlists          [Spotify] (Use|
+-------------------+--------------------------------------------------+
|                   |                                                  |
|  [ Home        ]  |  +--------------------------------------------+  |
|  [ Music Series]  |  |  MY PLAYLISTS (24)             [Import]    |  |
|  [ Blending    ]  |  +--------------------------------------------+  |
|  [ Playlists   ]  |                                                  |
|                   |  [ New Wave 80s  ]  [ Road Trip Mix ]            |
|  ---------------- |  [ 42 Tracks     ]  [ 15 Tracks     ]            |
|  CONTEXT AREA     |                                                  |
|                   |  [ Gym Workout   ]  [ Chill Vibes   ]            |
|  ACTIONS          |  [ 60 Tracks     ]  [ 22 Tracks     ]            |
|                   |                                                  |
|  [+ New Playlist] |                                                  |
|  [ Import JSON  ] |                                                  |
|                   |                                                  |
|  CATEGORIES       |                                                  |
|  > Favorites      |                                                  |
|  > Shared         |                                                  |
|  > Archived       |                                                  |
|                   |                                                  |
+-------------------+--------------------------------------------------+
```

### 5. Blending Menu (Context: Controls)

```text
+-------------------+--------------------------------------------------+
| MJRP BLENDER   [=]| Blending Menu                      [Spotify] (Use|
+-------------------+--------------------------------------------------+
|                   |                                                  |
|  [ Home        ]  |  +--------------------------------------------+  |
|  [ Music Series]  |  |  BLENDER CONFIGURATION                     |  |
|  [ Blending    ]  |  +--------------------------------------------+  |
|  [ Playlists   ]  |                                                  |
|                   |  SOURCE A: [ Select Series ]                     |
|  ---------------- |  SOURCE B: [ Select Series ]                     |
|  CONTEXT AREA     |                                                  |
|                   |  [ X ] Balance Tracks (50/50)                    |
|  PRESETS          |  [   ] Prioritize Deep Cuts                      |
|                   |                                                  |
|  (o) Balanced     |  [ GENERATE BLEND ]                              |
|  ( ) Deep Cuts    |                                                  |
|  ( ) Hits Only    |  PREVIEW OUTPUT                                  |
|                   |  1. Song A - Artist A                            |
|  [ Save Preset ]  |  2. Song B - Artist B                            |
|                   |                                                  |
+-------------------+--------------------------------------------------+
```
