# Deep Dive: MusicKit Internals & Data Persistence (Batch 12)

This document covers the Apple Music integration layer (`MusicKit`) and the specialized services for data synchronization and persistence.

## 1. MusicKit Integration Layer (`public/js/services/musickit/`)
This folder contains the core logic for interacting with the Apple Music API on the client side. The rest of the app reaches it through the facade `public/js/services/MusicKitService.js` (`musicKitService`).

### MusicKit Auth (`MusicKitAuth.js`)
*   **Role**: Handles the initialization lifecycle and user authorization.
*   **Key Features**:
    *   **Developer Token**: Fetches the signed JWT from `/api/musickit-token` (Server).
    *   **Lazy Loading**: Dynamically injects the `musickit.js` script tag only when needed.
    *   **Storefront Detection**:
        *   Primary: Uses the authenticated user's account storefront.
        *   Fallback: Uses browser locale (e.g., `navigator.language` "pt-BR" -> "br") for guests.
    *   **Validation**: Checks for mismatches between the Browser Storefront (what we guessed) and Account Storefront (what they actually have) to warn about catalog availability issues.

### Auth Sequence Diagram
```mermaid
sequenceDiagram
    participant App
    participant Service as MusicKitAuth
    participant API as Server (Node)
    participant Apple as Apple Music SDK

    App->>Service: init()
    Service->>API: GET /musickit-token
    API-->>Service: Signed JWT (ES256)
    
    Service->>Apple: configure(developerToken, appName)
    Apple-->>Service: Instance Ready
    
    Service->>Service: Detect Storefront (Browser Locale)
    
    Note over Service, Apple: Later, on demand: user authorizes via Pop-up (init opens no pop-up)
    Service->>Apple: authorize()
    Apple-->>Service: User Token
    Service->>Service: authorizeAndValidate(): compare browser and account storefront
```

### MusicKit Catalog (`MusicKitCatalog.js`)
*   **Role**: The "Read" interface for Apple Music.
*   **Capabilities**:
    *   `searchAlbums`: Performs catalog searches with ranking logic.
    *   `getAlbumDetails`: Fetches full metadata + tracks.
    *   `getArtistAlbums`: Handles pagination (pages of 100, looping until 404/short page) to fetch full discographies (safety cap at offset 2000).
    *   `findTrackFromAlbum`: Fuzzy logic to find a specific track on a specific album (critical for "Replacement" logic during playlist generation).

### MusicKit Library (`MusicKitLibrary.js`)
*   **Role**: The "Write" interface for Apple Music.
*   **Capabilities**:
    *   `createPlaylist`: Creates standard playlists.
    *   `createOrGetFolder`: Finds a library playlist folder by name or creates it. The Apple Music export (`views/playlists/PlaylistsExport.js`) uses the series name as the folder name.
    *   `createPlaylistInFolder`: Places generated playlists inside a specific folder to keep the user's library clean.

## 2. Infrastructure Services

### Data Sync Service (`public/js/services/DataSyncService.js`)
*   **Role**: Handles data migration between contexts.
*   **Use Case**: When a user starts as a "Guest" (local data) and then logs in, this service migrates their temporary Inventory and Series to their persistent Firestore account.
*   **Logic**: `migrateInventory` and `migrateSeries` iterate through arrays and call Repository methods (`targetRepository.addAlbum`, `targetRepository.create`). Imported by `services/auth/UserSyncService.js`. `stores/inventory.js` stopped calling `migrateInventory` in v5.0 (F60): the copy it made only ran after a sign-out and put the inventory of the person who left into the anonymous account that followed (UAT-198). In production the guest migration does not run (UAT-12).

### Playlist Persistence Service (`public/js/services/PlaylistPersistenceService.js`)
*   **Role**: The bridge between the **Generation Engine** and the **Database**.
*   **Pattern**: **Service Facade** over Repositories.
*   **Key Logic**:
    *   **Batch Management**: By default overwrites the batch of the same name (delete old -> save new); with `preserveIds: true` it keeps the existing documents and updates them (used by regenerate).
    *   **Series Upsert**: Ensures the parent Series exists before saving children playlists.
    *   **Repository Usage**: Instantiates `PlaylistRepository` and `SeriesRepository` on the fly with the current user context.
