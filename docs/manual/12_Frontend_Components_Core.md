# Frontend Components Analysis (Core UI)

## Base Architecture
**Status**: `[ACTIVE]`

-   **`base/Component.js`**: Abstract Base Class.
    -   **Pattern**: Enforces standard lifecycle (`mount`, `update`, `unmount`) for vanilla JS components.

## Universal UI Elements (`ui/`)
**Status**: `[ACTIVE]`
**Note**: These components are heavily refactored to use `SafeDOM` (zero `innerHTML`) for security.

-   **`ui/BaseModal.js`**: Standardized Modal Shell.
    -   **Features**: Glass-morphism style, size presets (`sm`, `md`, `lg`, `xl`), footer generator.
-   **`ui/Card.js`**: Universal Entity Card.
    -   **Variants**: `Grid` (Compact) and `List` (Expanded).
    -   **Logic**: Handles ranking badges (Spotify/BestEverAlbums) and generic action buttons.
    -*   **Old Way**: `AlbumCard.js` for albums, `PlaylistCard.js` for playlists, `SeriesCard.js` for series.
*   **New Way**: `Card.js` handles all of these via `props.variant` and flexible content slots.

### Universal Card Diagram
```mermaid
classDiagram
    class Card {
        +variant: "grid"|"list"
        +entityType: "album"|"playlist"
        +render()
    }
    class Slots {
        +Header
        +Media
        +ActiveContent
        +Footer
    }
    
    Card *-- Slots : Composes
    
    note for Card "Renders different layouts\nbased on variant prop\nwithout inheritance"
```
-   **`ui/TrackRow.js`**: Universal Track List Item.
    -   **Variants**: `Compact`, `Detailed`, `Ranking`.
    -   **Logic**: Handles Drag & Drop handles, ranking medals (🥇, 🥈, 🥉), rating stars, and duration formatting.
-   **`ui/Pager.js`** (v4.0): paging controls of a list of series: the count, the series per page (10 to 100), numbered pages or a growing list. It only shows and reports; the controller owns the page. It redraws only when the paging it is given changed. With `paging.unchecked` above zero it shows how many albums a source filter cannot answer for yet; with `paging.single` it shows only that notice. Tested in `test/components/ui/Pager.test.js`.
-   **`ui/LoadMoreButton.js`**: the button "Load N more albums" ("Load 1 more album") under a series of the albums screen that holds albums back. `render(seriesId, hidden)` returns the HTML of a `<button type="button" data-action="load-more-series">`, or nothing when no album is held back. It only shows and reports: the click is heard by `series/SeriesEventHandler.js` (v5.0, F49).
-   **`ui/FilterToolbar.js`**: search, filters, sort and view toggles. The search field is drawn once and is the same element for as long as the toolbar lives; what the person is typing is never written over while the field has the focus; the other controls are redrawn only when what they show changed, and a control that was not redrawn still calls the handler of the latest props. A view that uses it must keep the toolbar and call `update`, not build a new one on each change. Tested in `test/components/ui/FilterToolbar.test.js`.
-   **`ui/modals/ConfirmModal.js`**: Generic Confirmation Dialog (Yes/No).
-   **`ui/modals/InputModal.js`**: Generic Single-Input Dialog.

## Shared & Common (`shared/`, `common/`)
**Status**: `[ACTIVE]`

-   **`shared/ContextMenu.js`**: Floating "Three-dot" action menu. *(removed in F65: `ContextMenu.js`)*
-   **`shared/SkeletonLoader.js`**: Loading placeholders (`card`, `list` variants). *(removed in F65: `SkeletonLoader.js`)*
-   **`common/AlbumCascade.js`**: Visual component rendering a diagonal stack of album thumbnails. Used in Blend and Playlist views.
