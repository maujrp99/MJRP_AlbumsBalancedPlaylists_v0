# UX Proposal: "Load Albums" Experience Redesign
**Sprint 7 - Part A (UI/UX Refinement)**

## 1. Problem Statement
The current "Load Albums" flow in `HomeView` is functional but constrained:
- **Cognitive Load**: Users see a text area and a search bar simultaneously, creating confusion ("Where do I type?").
- **No Immediate Gratification**: Selecting an album from autocomplete just appends text (`Artist - Album`) to a box. The user doesn't see the cover art they just selected until *after* they click "Load Albums" and go to the next screen.
- **Edit Friction**: Removing an album requires precise text selection/backspacing in the textarea.

## 2. Proposed Solution: "Visual Staging Area"
We will transform the experience from a "Text Editor" to a "Playlist Builder".

### Key Concepts
1.  **Visual First**: When a user selects an album, it appears instantly as a **Card** with its cover art, not just text.
2.  **Mode Switching**: Clear separation between **"Interactive Search"** (Default) and **"Bulk/Text Import"** (Power User).
3.  **Unified State**: Both modes feed into the same final list.

## 3. User Journey (New Flow)

### Step 1: Artist Drill-Down (The "Select" Flow)
- **Action**: User types in "Filter by Artist" (e.g., "Metallica").
- **Interaction**: Selecting an artist automatically **REPLACES** the "Search for Album" input with a **Results Grid/Carousel**.
- **Results View**: Shows all albums by that artist (e.g. 5-10 covers).
- **Selection**: User clicks albums in this grid to toggle them into the **Staging Area** below.
- **Persistence**: The Artist Results stay open until the user clears the filter or selects a new artist.

### Step 2: Global Search (Fallback)
- If no artist is filtered, the right side remains a standard "Search for Album" autocomplete.

**Option B: Artist Drill-Down (Structured)**
- User focuses on an **"Artist Filter"** field (or types `@Metallica`).
- Selects "Metallica".
- The Main Search bar now says **"Search albums by Metallica..."**.
- Clicking it shows *only* Metallica albums in a grid/list.
- **Benefit**: Helps when you want to add multiple albums from the same artist without re-typing the name.

### Step 2: Visual Confirmation
- Regardless of method, selecting an album adds the **Card** to the Visual Staging Area.

### Step 2: The "Review" (Staging)
- As users add more albums, they build a **Grid of Covers**.
- This builds excitement ("My series is looking good!").
- They can reorder (optional/future) or remove items easily.

### Step 3: The "Bulk" Option (Text Mode)
- A small text/link says: *"Have a list? Switch to Bulk Paste"*.
- Clicking toggles the view to the classic **Textarea**.
- **Bonus**: If possible, pasting text and switching back to "Visual" could try to parse and hydrate covers (Future scope, maybe just keeping modes separate for now is safer).

## 4. UI Layout Mockup

```text
+---------------------------------------------------------------+
|  Series Name: [ My Awesome Playlist ]                         |
+---------------------------------------------------------------+
|                                                               |
|  [ Filter by Artist (Optional) ]  [ Search for Album...    ]  |
|                                                               |
+---------------------------------------------------------------+
|                                                               |
|  [ Added Albums (3) ]                                         |
|                                                               |
|  +-------------+   +-------------+   +-------------+          |
|  |  [COVER]    |   |  [COVER]    |   |  [COVER]    |          |
|  |  Metallica  |   |  Pink Floyd |   |  The Beatles|          |
|  |  72 Seasons |   |  The Wall   |   |  Abbey Road |          |
|  |     (x)     |   |     (x)     |   |     (x)     |          |
|  +-------------+   +-------------+   +-------------+          |
|                                                               |
+---------------------------------------------------------------+
|            [ Switch to Bulk Paste Mode (Text) ]               |
+---------------------------------------------------------------+
|                                                               |
|                 [ LOAD ALBUMS (CTA) ]                         |
|                                                               |
+---------------------------------------------------------------+
```

## 5. Implementation Strategy
- **State Management**: Introduce a local state `selectedAlbums: []` in `HomeView`.
- **Sync Logic**:
  - **Visual Mode**: Adds to `selectedAlbums`.
  - **Text Mode**: Parses text to `selectedAlbums` (or vice versa).
- **Submit**: Sends the final array to `albumSeriesStore`.

## 6. Visual Style
- **Glassmorphism**: The album cards will use the existing `glass-panel` style but "miniaturized".
- **Animations**: Cards pop in (`animate-in zoom-in`).
- **Feedback**: Success toast or flash when adding.

## 7. Visual Mockup
![UI Proposal Mockup (Split Filter)](file:///Users/mpedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/docs/specs/load_albums_mockup.png)

---
**Status**: Proposal Ready for Review
