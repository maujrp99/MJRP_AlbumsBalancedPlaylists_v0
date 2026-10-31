# Refactoring Recommendations (2026-01-10)

> **Source**: Code Quality Assessment v10 + Deep Manual Review
> **Status**: Backlog (Pending Sprint Assignment)
> **Reference Architecture**: [01_System_Architecture.md](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/docs/manual/01_System_Architecture.md)

## Review Summary
I have read all frontend manuals (01, 06, 07, 09, 10, 11, 12, 14, 17, 18, 29) and cross-referenced them with the God Files and Route Thinness findings.

### Key Patterns (From Manuals)
| Pattern | Where Documented | Current Compliance |
|:---|:---|:---|
| **MVC** | `01_System_Architecture.md` | ✅ Good in Views/Controllers |
| **Observer/PubSub** | `06_Frontend_Data_Store.md` | ✅ Stores notify Views |
| **Strategy** | `18_Frontend_Logic_Core.md` | ✅ Algorithms & Ranking |
| **Renderer Delegation** | `10_Frontend_Renderers.md` | 🟡 Partially applied |
| **"Thin View"** | `09_Frontend_Views.md` (SeriesView note) | 🟡 Not all views are thin |
| **Command Pattern** | `01_System_Architecture.md` | ✅ Controllers encapsulate actions |
| **Component Reuse** | `14_Frontend_Components_Feature_Map.md` | ✅ `RegeneratePanel` reuses Blend components |

---

## High Opportunity (Worth Refactoring)

| File | LOC | Issue | Refactor Strategy |
|:---|:---:|:---|:---|
| `SeriesView.js` | 422 | Monolithic View | **Componentize**: Extract `SeriesHeader`, `SeriesProgressBar`, `SeriesEmptyState` as child components. |
| `SavedPlaylistsView.js` | 412 | Mixed rendering & logic | **Componentize**: Extract `SavedPlaylistCard`, `SavedPlaylistActions`. |
| `playlists.js` (store) | 484 | Feature creep | **Modularize**: Split into `PlaylistsStore` (state) and `PlaylistsService` (computation). |
| `albumSeries.js` (store) | 427 | Same as above | **Modularize**: Extract series CRUD into `SeriesService`. |
| `server/routes/albums.js` | 52 | Logic in route | **Modularize**: Already in Sprint 18 scope - delegate to `AlbumService`. |

---

## Medium Opportunity (Nice to Have)

| File | LOC | Issue | Notes |
|:---|:---:|:---|:---|
| `SpotifyService.js` | 439 | Large but cohesive | Could split auth/search/playlist into sub-modules. |
| `BlendIngredientsPanel.js` | 433 | Complex UI config | Consider extracting `ALGORITHM_RECIPES` config to a separate JSON/constants file. |
| `client.js` (Firebase) | 488 | Vendor wrapper | Low priority — it's stable infrastructure code. |

---

## Low Priority (Acceptable)

| File | LOC | Notes |
|:---|:---:|:---|
| `server/routes/debug.js` | 127 | Debug utility — exempt from strict rules. |
| `server/routes/ai.js` | 55 | Just 5 lines over threshold. |
| `server/routes/musickit.js` | 63 | Thin wrapper, acceptable. |
| `server/routes/playlists.js` | 64 | Same as above. |

---

## Recommended Sprint Scope

**Sprint 19: Frontend Modularization**
- [ ] Refactor `SeriesView.js`
- [ ] Refactor `SavedPlaylistsView.js`
- [ ] Split `playlists.js` store
- [ ] Split `albumSeries.js` store

**Sprint 18 (In Progress)**: Backend route thinning for `albums.js`.
