# Implementation Plan - Sprint 6: Authentication & Persistence

## Goal
Implement secure authentication (Google/Apple) and persist user-specific data (Inventory, Custom Series, Playlists) to Firestore, marking the transition from a Local-First to a Cloud-Synced application.

## User Review Required
> [!IMPORTANT]
> **Data Migration Strategy**: On first login, existing LocalStorage data (Guest Mode) will be **copied** to Firestore. LocalStorage will then be cleared or ignored in favor of Cloud Single Source of Truth to prevent sync conflicts.

## Proposed Architecture Changes

### 1. New Core Modules
- **`services/AuthService.js`**: Adapter for Firebase Authentication SDK. Handles popups, redirects, and session monitoring.
- **`stores/UserStore.js`**: Manages current user state (`currentUser`, `isAuthenticated`), controls the Login/Logout flows, and triggers data sync.

### 2. Repository Layer Enhancements
Current Repositories (`AlbumsRepository`, `SeriesRepository`) usually interact with `IndexedDB` or global `Firestore`.
- **Change**: Introduce `RepositoryContext`.
    - **Guest Mode**: Read/Write to `IndexedDB` (BrowserStorage).
    - **Auth Mode**: Read/Write to `Firestore` paths `/users/{uid}/...`.
- **Implementation**: `RepositoryFactory` or dependency injection in Stores to switch drivers based on `UserStore` state.

### 3. UI Components
- **`components/auth/UserMenu.js`**: Avatar, Name, Logout button.
- **`components/auth/LoginModal.js`**: "Sign in with Google", "Sign in with Apple".
- **`features/Header.js`**: Update to conditionally render `UserMenu` or "Sign In" button.

## Proposed Changes (Files)

### Shared / Services
#### [NEW] [AuthService.js](file:///server/services/AuthService.js)
- `signInWithGoogle()`
- `signInWithApple()`
- `signOut()`
- `onAuthStateChanged(callback)`

### Stores
#### [NEW] [UserStore.js](file:///public/js/stores/UserStore.js)
- Observable store.
- Subscribes to `AuthService`.
- On login: Triggers `DataSyncService.migrateGuestToCloud()`.
- On logout: Clears application state.

### Data Layer
#### [MODIFY] [BaseRepository.js](file:///public/js/repositories/BaseRepository.js)
- Add support for user-scoped paths (e.g., set `userId` context).

#### [NEW] [DataSyncService.js](file:///public/js/services/DataSyncService.js)
- `mergeLocalToCloud(uid)`: Reads all LocalStorage/IndexedDB data and batch writes to `/users/{uid}` subcollections.

### UI
#### [NEW] [LoginModal.js](file:///public/js/components/LoginModal.js)
#### [NEW] [UserMenu.js](file:///public/js/components/UserMenu.js)
#### [MODIFY] [Header.js](file:///public/js/components/Header.js)

## Verification Plan

### Automated Tests (Vitest)
- **UserStore**: Mock `AuthService` and test state transitions.
- **DataSyncService**: Test migration logic with mock LocalStorage and Mock Firestore.
- **Repository**: Test context switching triggers.

### Manual Verification
1. **Guest Flow**: Use app, create custom series, add inventory.
2. **Login Flow**: Sign in with Google.
3. **Verify Persistence**: Check Firestore Console for `/users/{uid}/inventory`.
4. **Session**: Refresh page -> maintained state.
5. **Logout**: Data clears from UI.
6. **Cross-Device**: Login on Incognito -> see same data.
