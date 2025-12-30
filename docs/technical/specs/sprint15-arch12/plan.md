# Sprint 15 Technical Plan: Structural Integrity

**Goal**: Define the Architecture for the Unified Component System and Refactor Pilot.

## 1. Directory Structure (Clean Architecture)

```
src/
  components/
    ui/                  # <--- THE NEW CORE
      Card.js            # Universal Card (Grid/List)
      TrackRow.js        # Universal Track (Row/Item)
      BaseModal.js       # Universal Modal Shell
    
    # Legacy Cleanup Targets:
    # - base/ (Delete)
    # - shared/ (Delete)
    # - common/ (Delete)
```

## 2. Component API Design

### A. `Card.js` (The Universal Entity)
Replaces `BaseCard`, `EntityCard`, `AlbumsGridRenderer` cards.

```javascript
export class Card {
    /**
     * @param {Object} props
     * @param {Object} props.entity - The data object (Album, Playlist)
     * @param {'grid' | 'list' | 'minimal'} [props.variant='grid']
     * @param {Array<{icon: string, label: string, action: string}>} [props.actions]
     * @param {Function} [props.onClick]
     */
    static render(props) { ... }
}
```

### B. `TrackRow.js` (The Universal List Item)
Replaces `TrackItem.js` (Playlists) and manual HTML (Rankings, SavedPlaylists).

#### Gap Analysis & Superset Strategy
| Feature | `TrackItem.js` (Legacy) | `RankingView` (Manual) | `TrackRow.js` (New) |
| :--- | :--- | :--- | :--- |
| **Drag Handle** | ✅ (If draggable) | ❌ | **✅ (`draggable` prop)** |
| **Medals (🥇)** | ❌ | ✅ (Top 3) | **✅ (`ranking` variant)** |
| **Rank Badges** | ✅ (Acclaim/Spotify) | ✅ (Custom Colors) | **✅ (Unified Logic)** |
| **Duration** | ✅ | ✅ | **✅** |
| **CSS Class** | `.track-item` | `.track-row` | **`.track-row`** (Updates required in DragDrop) |

#### API Definition
```javascript
export class TrackRow {
    /**
     * @param {Object} props
     * @param {Object} props.track - The track data
     * @param {number} props.index - Visual index (1, 2, 3...)
     * @param {'compact' | 'detailed' | 'ranking'} [props.variant='compact']
     * @param {Array<{action: string, icon: string}>} [props.actions]
     * @param {boolean} [props.draggable=false] - Shows grip handle
     * @param {Object} [props.meta] - Extra data (e.g. { ratingClass: 'badge-success' })
     */
    static render(props) { ... }
}
```

### C. `BaseModal.js`
Standardizes the "Glass Panel" look and close behavior.

## 3. Architecture: SavedPlaylistsView Refactor

**Pattern**: Controller-View (Separation of Concerns).

### A. The Controller (`SavedPlaylistsController.js`)
Responsible for:
1.  Fetching Series & Playlists (Repositories).
2.  Managing Store Context (setting active Series).
3.  Handling Deletions (Business Logic).
4.  Navigation Routing.

### B. The View (`SavedPlaylistsView.js`)
Responsible for:
1.  **Rendering only**: Uses `Card.js` variants and `TrackRow.js`.
2.  **Event Delegation**: Captures clicks and delegates to Controller.
3.  **No Business Logic**.

## 4. Migration Strategy

1.  **Foundation**:
    *   Create `components/ui/` folder.
    *   Implement `Card.js` (port logic from `AlbumsGridRenderer`).
    *   Implement `TrackRow.js` (port logic from `TrackItem.js`).

2.  **Pilot (SavedPlaylists)**:
    *   Extract logic to `SavedPlaylistsController.js`.
    *   Rewrite `SavedPlaylistsView.js` to use `TrackRow.js`.

3.  **Expansion (Holistic)**:
    *   Update `RankingView` -> Use `TrackRow` (`variant="ranking"`).
    *   Update `AlbumsGridRenderer` -> Use `Card`.
    *   **Critical**: Update `PlaylistsDragDrop.js` to target `.track-row` selector.

## 5. Security Validation
*   **Rule**: No `innerHTML` interpolation of user data.
*   **Method**: `Card` and `TrackRow` must use safe DOM construction or strict escaping.
