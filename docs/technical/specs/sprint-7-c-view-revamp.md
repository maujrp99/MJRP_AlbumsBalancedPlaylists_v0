# Sprint 7 Part C: Holistic View Revamp Specification

## 1. Goal
Standardize the visual presentation of Album and Series entities across the application to ensure:
1.  **Consistent Performance**: Use `OptimizedAlbumLoader` with standardized thumbnail sizes everywhere.
2.  **Data Visibility**: Eliminate text truncation and image-text overlaps.
3.  **Visual Cohesion**: Apply the "Tech/Sci-Fi" aesthetic (Glassmorphism, Neon) consistently.

## 2. Design System: "The Tech Row"
Instead of "Poster" style cards (vertical, image-dominant), we will shift to "Row" style cards (horizontal, data-dominant).

### 2.1. Standard Album Row (AlbumsView / SeriesView)
*   **Dimensions**: Width 100%, Min-Height ~120px.
*   **Layout**: Flexbox Row.
    *   **Left (Thumbnail)**: Fixed 100x100px (or 120x120px) image. Rounded corners (12px).
    *   **Middle (Metadata)**:
        *   **Title**: 1.25rem (text-xl), Bold, White. No truncation (wrap permitted).
        *   **Artist**: 1rem (text-base), Gray-300.
        *   **Meta Badges**: Year, Track Count, Duration (Flex wrap).
    *   **Right (Actions)**:
        *   Vertical stack or Horizontal row of icons (Delete, Rank, Move).
        *   "View Details" button.

### 2.2. Inventory Row (InventoryView)
*   **Base**: Same as Standard Album Row.
*   **Extensions**:
    *   **Format Badge**: Neon Border pill (e.g., "Vinyl", "CD").
    *   **Price**: Large green text input/display (e.g., "$25.00").
    *   **Status**: Toggle (Owned/Wishlist).

### 2.3. Playlist Series Row (PlaylistsView)
*   **Layout**: Series grouping.
*   **Content**: Series Title, Count.
*   **Thumbnails**: A cluster or stack of small thumbnails (e.g., 3 overlapping 60px covers) to represent the collection.

## 3. Technical Implementation

### 3.1. Unified Component: `AlbumRow.js`
A standard function returning HTML string (to keep vanilla JS performance).

```javascript
export function renderAlbumRow(album, options = {}) {
  const { 
    showInventory = false, 
    showRanking = false, 
    actions = [] 
  } = options;
  
  const coverUrl = albumLoader.getArtworkUrl(album, 150); // Standardized Small/Medium
  
  return `
    <div class="tech-row group ...">
      <!-- Thumbnail -->
      <div class="row-thumb ...">
        <img src="${coverUrl}" loading="lazy" ... />
      </div>
      
      <!-- Metadata -->
      <div class="row-content ...">
        <h3>${album.title}</h3>
        <p>${album.artist}</p>
        <!-- Badges -->
      </div>
      
      <!-- Inventory Slots (if enabled) -->
      ${showInventory ? renderInventoryControls(album) : ''}
      
      <!-- Actions -->
      <div class="row-actions ...">
        ${renderActions(actions)}
      </div>
    </div>
  `
}
```

### 3.2. Optimized Loader Usage
*   All views MUST import `OptimizedAlbumLoader`.
*   All `getArtworkUrl` calls MUST use standardized sizes (100, 150, or 300 max).
*   No more Raw URLs unless optimization fails.

## 4. Migration Plan
1.  **Phase 1**: Create `components/AlbumRow.js` and CSS styles.
2.  **Phase 2**: Refactor `AlbumsView.js` to render rows instead of grid cards.
3.  **Phase 3**: Refactor `InventoryView.js` to use `AlbumRow` with inventory slots.
4.  **Phase 4**: Refactor `PlaylistsView.js` / `SeriesListView.js`.

## 5. Verification
*   **Visual**: All text visible? No overlap?
*   **Performance**: Network tab checks for image sizes (should be <50KB).
*   **Functionality**: Actions (Delete, Edit) still work?
