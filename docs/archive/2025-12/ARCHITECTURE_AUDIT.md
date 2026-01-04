# Architecture Analysis & Refactoring Plan ("The Album Blender")

## 1. Executive Summary
The codebase is a **Vanilla JS Single Page Application (SPA)** using a custom Router and Observer Pattern for state management. 
While functional and "lightweight" (no framework overhead), it suffers from **"God Class" antipatterns** in Views and **Mixed Concerns** in Stores.

The recent introduction of the **Strategy Pattern** (Sprint 7.5) for View Modes is a step in the right direction, but broader structural changes are needed to maintain velocity.

---

## 2. Key Issues Identified

### 🔴 A. "God View" Monoliths (`AlbumsView.js`)
`AlbumsView.js` (~1500 lines) violates the Single Responsibility Principle. It handles:
1.  **Layout**: Rendering the full page structure.
2.  **Components**: Configuring grids, lists, cards, and headers manually (String concatenation).
3.  **Event Delegation**: Handling clicks, propagation, and filtering globally.
4.  **Business Logic**: "Ghost Album" prevention, scope resolution (Single vs All), and complex filtering.

**Impact**: High cognitive load, difficult to test, high risk of regressions when changing one part (e.g., Sprint 7.5 refactor needed careful surgery).

### 🔴 B. Stores Mixed with Persistence
`AlbumsStore.js` integrates **State Management** (active series, loading state) directly with **Data Access** (Firestore calls, JSON serialization).
- *Problem*: You cannot easily switch storage backends or test the store logic without mocking Firebase.
- *Problem*: Serialization logic (`JSON.parse(JSON.stringify)`) is likely duplicated across stores.
- *Inconsistent State*: A comprehensive "Repository Pattern" implementation **already exists** (`AlbumRepository.js`, `BaseRepository.js`) but is **completely unused** by `AlbumsStore`, which continues to use direct Firestore calls. This indicates a stalled migration/refactor.

### 🟡 C. Hardcoded Dependencies & Singletons
Views import stores directly:
```javascript
import { albumsStore } from '../stores/albums.js'
```
This tight coupling makes it impossible to unit test a View with a "Mock Store".

### 🟢 D. Good Parts
- **Robust Backend (BFF)**: The `server/` directory implements a solid Backend-for-Frontend pattern using Express. It correctly handles AI proxying (`aiClient.js`), validation (`schema.js`), and Apple Music tokens (`musickit.js`), keeping sensitive keys and logic secure.
- **Existing Foundations**: Reusable UI components (`components/`) and Data Repositories (`repositories/`) exist, providing a great head-start for refactoring.
- **MusicKitService**: Cleanly encapsulated domain logic. Zero UI coupling.
- **Strategy Pattern (ViewMode)**: Excellent use of patterns to handle variability.
- **Router**: Simple, effective History API wrapper.

---

## 3. Recommended Refactoring (Roadmap)

### Phase 1: Structural Separation (High Value, Low Risk)

#### 1. Adopt Existing Repositories (Complete the Migration)
The `AlbumRepository` class already exists and handles Firestore interactions cleanly.
**Action**:
- Inject `AlbumRepository` into `AlbumsStore`.
- Remove direct Firestore/Firebase imports from `AlbumsStore`.
- Switch `load` and `save` calls to use the repository methods.

```javascript
// stores/AlbumsStore.js
async loadAlbums() {
    this.items = await this.repository.load(this.activeSeriesId)
    this.notify()
}
```

#### 2. Componentization of `AlbumsView`
Break the monolith into functional components. Even without React, we can have classes that return HTML strings or DOM elements.

*   `components/AlbumCard.js` (Encapsulate the card HTML/badges)
*   `components/FilterBar.js` (Encapsulate the complex filter dropdowns/logic)
*   `components/SeriesGroup.js` (The "All Series" grouping logic)

### Phase 2: Design Patterns to Adopt

#### 1. Composite Operations (Command Pattern)
For complex operations like "Generate Playlists" which touch multiple stores and APIs.
- Create `commands/GeneratePlaylistsCommand.js`
- Encapsulate the logic currently sitting in `PlaylistsView`.

#### 2. Dependency Injection (Lite)
Instead of importing instances, pass dependencies in constructors.
```javascript
// app.js
const albumsRepo = new AlbumsRepository(db)
const albumsStore = new AlbumsStore(albumsRepo)
const albumsView = new AlbumsView(albumsStore) // Inject store
```

### Phase 3: Architectural "North Star"

Consider moving to a lightweight component library if the UI complexity grows. 
Since you successfully use **Web Components** (Standard) principles, you might benefit from **Lit** (just the library, not a framework shift) to handle the HTML rendering/updating more efficiently than raw Template Literals.

---

## 4. Immediate Action Item (Sprint 7.5/8)

**Refactor `filterAlbums` logic out of `AlbumsView`**:
Create a `SeriesFilteringService` or `AlbumFilter` utility. The view should just say:
`const visibleAlbums = AlbumFilter.apply(albums, this.filters)`
This removes ~100 lines of complex logic from the View.
