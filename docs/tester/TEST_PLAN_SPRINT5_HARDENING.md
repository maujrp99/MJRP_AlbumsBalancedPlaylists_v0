# Test Plan: Sprint 5 Persistence & CRUD Hardening

**Date**: 2025-12-03  
**Scope**: Persistence Layer & Series Management UI  
**Priority**: Critical  
**Context**: Validating new hybrid persistence (Firestore + localStorage) and Series Management features.

---

## 1. New Features Overview

### A. Series Management UI (New View)
- **Route**: `/series` (Accessible via "Playlist Series" in Top Nav)
- **View**: `SeriesListView.js`
- **Capabilities**:
    - **List**: View all series (fetched from Firestore + LocalStorage).
    - **Edit**: Rename existing series.
    - **Delete**: Delete a series.
    - **Open**: Navigate to the series albums.

### B. Data Persistence (Hybrid Strategy)
- **Playlists**:
    - **Cloud**: Saved to Firestore (`users/{uid}/series/{seriesId}/playlists`) using Batch Writes.
    - **Local**: Saved to `localStorage` for immediate access and offline support.
- **Series**:
    - **Cloud**: Saved to Firestore (`users/{uid}/series`) immediately upon creation.
    - **Local**: Synced with `localStorage`.
- **Albums**:
    - **Local**: Cached in `localStorage` to reduce API calls.

### C. Technical Architecture
- **Dependency Injection**: Firestore `db` instance injected into View constructors via `app.js`.
- **Batch Operations**: `createMany` added to `BaseRepository` for atomic playlist saving.

---

## 2. Critical Test Scenarios

### ✅ Scenario 1: Series CRUD & Safe Delete (High Risk)

**Objective**: Verify Series Management UI and ensure "Safe Delete" protects albums.

**Steps**:
1.  **Create**:
    -   Navigate to Home (`/`).
    -   Create a new series "Test Series Delete" with 2 albums.
    -   Verify navigation to `/albums`.
2.  **Edit**:
    -   Navigate to `/series` (via Top Nav "Playlist Series").
    -   Find "Test Series Delete".
    -   Click "Edit" (pencil icon).
    -   Rename to "Test Series Renamed".
    -   Click "Save".
    -   **Verify**: Name updates in UI and Firestore (if accessible).
3.  **Delete (SAFE DELETE CHECK)**:
    -   Click "Delete" (trash icon) on "Test Series Renamed".
    -   Confirm deletion in modal.
    -   **Verify**: Series removed from list.
    -   **CRITICAL VERIFICATION**:
        -   Navigate to `/inventory`.
        -   **Verify**: The albums associated with that series are **STILL PRESENT** in the inventory/database.
        -   **Pass Condition**: Albums are NOT deleted.

### ✅ Scenario 2: Playlist Persistence & Batch Writes

**Objective**: Verify hybrid persistence (Firestore + localStorage) for playlists.

**Steps**:
1.  **Generate**:
    -   Create/Select a series.
    -   Navigate to `/playlists`.
    -   Click "Generate Playlists".
    -   Wait for generation (4 playlists).
2.  **Verify Persistence**:
    -   **UI**: Playlists appear in columns.
    -   **Firestore**: Check `users/{uid}/series/{seriesId}/playlists` contains 4 documents (using Firebase Console if available, or verify via code check).
    -   **LocalStorage**: Open DevTools -> Application -> Local Storage. Check `mjrp_playlists` key exists and contains data.
3.  **Reload**:
    -   Refresh page (F5).
    -   **Verify**: Playlists persist WITHOUT re-generation (loaded from localStorage/Firestore).

### ✅ Scenario 3: Offline Resilience

**Objective**: Verify app stability and data safety when offline.

**Steps**:
1.  **Simulate Offline**:
    -   Open DevTools -> Network -> Select "Offline".
2.  **Action**:
    -   Generate Playlists OR Create Series.
3.  **Verify**:
    -   **UI**: Should update optimistically (show new series/playlists).
    -   **Errors**: No crash or blocking errors (red screen).
    -   **Console**: May show "Failed to save to Firestore" (expected).
4.  **Reconnect**:
    -   Set Network to "No throttling" (Online).
    -   **Verify**: App continues to function. (Note: Auto-sync on reconnect is Sprint 6, so manual sync or page reload might be needed to push to cloud if not implemented yet).

---

## 3. Regression & Integration Tests

### Navigation
-   [ ] Verify "Playlist Series" link in Top Nav works.
-   [ ] Verify navigating from Series List (`/series`) -> Albums (`/albums`) works.

### Data Integrity
-   [ ] **Cross-Series Check**:
    -   Create Series A and Series B.
    -   Generate playlists for Series A.
    -   Switch to Series B.
    -   Verify Series A playlists are NOT visible.
    -   Switch back to Series A.
    -   Verify playlists ARE visible.

---

## 4. Known Limitations
-   **Offline Sync**: Data created offline stays in localStorage. No automatic background sync when coming back online (Sprint 6).
-   **Conflict Resolution**: Last write wins.
