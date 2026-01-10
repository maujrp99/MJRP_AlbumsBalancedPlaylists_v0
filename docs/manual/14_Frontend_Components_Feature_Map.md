# Frontend Components Analysis (Features)

## Home & Search (`home/`, `search/`)
**Status**: `[ACTIVE]`

-   **`home/SearchController.js`**:
    -   **Role**: Orchestrates the Artist Search flow.
    -   **Logic**: Calls `AlbumSearchService`, sorts results by date, and handles filtering (Albums/EPs/Singles/Live/Compilations). Maintains `filterState`.

    ```mermaid
    flowchart LR
        Input[User Typing] -->|Debounce 300ms| Service[AlbumSearchService]
        Service -->|Raw Results| Sort[Sort By Date Desc]
        Sort --> Filter{Apply Filters}
        Filter -->|EP/Single/Album| Final[Render Grid]
    ```
-   **`home/StagingAreaController.js`**:
    -   **Role**: Manages the "Staging Stack" (drag-and-drop area).
    -   **Logic**: Uses `SortableJS` for reordering. Syncs state with the `StagingRenderer`.
-   **`search/DiscographyToolbar.js`**:
    -   **Role**: UI for filtering search results.
    -   **Logic**: Toggles between types (Album, EP, Single, etc.) and Editions (Standard, Deluxe). Updates button styles dynamically.
-   **`search/VariantPickerModal.js`**:
    -   **Role**: A specialized modal for resolving "Album Groups" (e.g., when search returns multiple versions of "Thriller").
    -   **Pattern**: Functional Component (exports `showVariantPickerModal` function) rather than a Class.

## Blend Wizard (`blend/`)
**Status**: `[ACTIVE]`
**Overview**: These components form the 3-step "Blend" playlist generation wizard.

-   **`blend/BlendSeriesSelector.js` (Step 1)**:
    -   **Role**: Allows user to select an Entity (Album Series, Artist, Genre).
    -   **Logic**: Loads series from `albumSeriesStore`, handles cache-based thumbnail preloading (`preloadAllThumbnails`), and renders a grid of `BlendSeriesCard`s.
-   **`blend/BlendFlavorCard.js` (Step 2)**:
    -   **Role**: Displays available generation algorithms ("Flavors").
    -   **Logic**: Renders cards with metadata (icons, colors, badges) derived from `getAllAlgorithms()`. Highlights "Recommended" algorithms.
-   **`blend/BlendIngredientsPanel.js` (Step 3)**:
    -   **Role**: Configuration panel for the selected algorithm.
    -   **Logic**: Dynamically shows/hides inputs (Duration, Output Mode, Ranking Source, Discovery Mode) based on the selected algorithm's capabilities (`ALGORITHM_INGREDIENTS` mapping).

## Inventory (`inventory/`)
**Status**: `[ACTIVE]`

-   **`inventory/InventoryGrid.js`**:
    -   **Role**: Main view for the User's Inventory.
    -   **Logic**: A wrapper around `SeriesGridRenderer`. Adds generic event delegation for Inventory actions (Click, Context Menu). Handles "Zero State" (Empty Inventory) display.
