# Regression Analysis: Ghost Albums (Sprint 5)

## 🐛 Issue Description
When navigating between different Series (e.g., from "Series A" to "Series B"), the albums from "Series A" appear briefly ("flash") on the screen before the "Series B" albums are loaded. This creates a confusing user experience ("Ghost Albums").

## 🔍 Root Cause Analysis
The regression was introduced during the implementation of **Offline Persistence** (Sprint 5).

1.  **LocalStorage Hydration**: `AlbumsStore` was updated to load cached albums from `localStorage` immediately upon initialization.
2.  **Missing Context Persistence**: The `saveToLocalStorage` method was **only saving the `albums` array**, but it was **NOT saving the `lastLoadedSeriesId`**.
3.  **Context Mismatch**:
    *   When the user visits a new series URL, `AlbumsStore` initializes and loads the *old* albums from cache.
    *   Because `lastLoadedSeriesId` was not persisted, it defaults to `null`.
    *   `AlbumsView.render()` sees the albums in the store. Since it lacks the context to know these albums belong to a *different* series (and `lastLoadedSeriesId` is null), it assumes they are valid and renders them immediately.
    *   The `mount()` method eventually runs, detects the mismatch, and fetches the correct data, causing the UI to "jump" or "flash".

## 🛠 Recommended Fix

### 1. Update `AlbumsStore.js` (Persistence Layer)
Modify the storage logic to persist the **Series Context** (`lastLoadedSeriesId`) alongside the data.

**Changes required:**
*   In `saveToLocalStorage()`: Include `lastLoadedSeriesId` in the saved object.
*   In `loadFromLocalStorage()`: Restore `lastLoadedSeriesId` from the parsed object.

```javascript
// public/js/stores/albums.js

saveToLocalStorage() {
    const data = {
        albums: this.albums.map(a => ({ ... })), 
        lastLoadedSeriesId: this.lastLoadedSeriesId, // <--- CRITICAL ADDITION
        updatedAt: new Date().toISOString()
    }
    localStorage.setItem('mjrp_albums', JSON.stringify(data))
}

loadFromLocalStorage() {
    const data = localStorage.getItem('mjrp_albums')
    if (data) {
        const parsed = JSON.parse(data)
        this.albums = parsed.albums || []
        this.lastLoadedSeriesId = parsed.lastLoadedSeriesId || null // <--- CRITICAL ADDITION
    }
}
```

### 2. Update `AlbumsView.js` (Presentation Layer)
Add a **Safety Check** in the `render()` method to validate that the cached data matches the requested context.

**Changes required:**
*   In `render(params)`: Compare the requested `seriesId` (from URL/Params) with the store's `lastLoadedSeriesId`.
*   If they do **not** match, ignore the cached albums (render an empty or loading state) to prevent the "Ghost" effect.

```javascript
// public/js/views/AlbumsView.js

async render(params) {
    const albums = albumsStore.getAlbums()
    
    // Determine Target Series
    const urlParams = new URLSearchParams(window.location.search)
    const targetSeriesId = params?.seriesId || urlParams.get('seriesId') || activeSeries?.id

    // Ghost Album Prevention Check
    const lastLoadedId = albumsStore.getLastLoadedSeriesId()
    let displayAlbums = albums

    // IF we have a target series AND we have cached data AND they don't match...
    if (targetSeriesId && lastLoadedId && targetSeriesId !== lastLoadedId) {
        // ...THEN hide the stale albums
        displayAlbums = [] 
    }

    // Continue rendering with displayAlbums...
}
```

## ✅ Expected Outcome
With these changes, when a user switches series, the View will detect that the cached albums belong to the *previous* series and will show a clean loading state instead of the old data, until the new data is fetched.
