# Technical Debt Backlog & Refactoring Roadmap

**Last Updated**: 2025-12-25 22:40
**Source**: [Code Quality Assessment v5.0](refactor/CODE_QUALITY_ASSESSMENT_v5.0.md) & [Architecture Deep Dive](../ARCHITECTURE.md)

---

## ✅ Resolved (Sprint 13)

| ID | Issue | Resolution | Date |
| :--- | :--- | :--- | :--- |
| **CRIT-1** | Data Loss on Playlist Save | Implemented `runBatchSave` with Firestore `WriteBatch` in `PlaylistsStore.js` | 2025-12-25 |
| **CRIT-2** | XSS Vulnerability (innerHTML) | Replaced in `HomeView`, `SavedPlaylistsView`, `SeriesModals`. Used `createElement`/`textContent` | 2025-12-25 |
| **ARCH-1** | God Class: PlaylistsView (960 LOC) | Extracted `PlaylistsController`, `PlaylistsGridRenderer`, `PlaylistsDragHandler`. View now ~300 LOC | 2025-12-25 |
| **DEBT-3** | View-Store Coupling | Merged into ARCH-1 (`PlaylistsController` now mediates View←→Store) | 2025-12-25 |

---

## 🚨 Critical (Immediate Action Required)

**Objective**: Fix Security Vulnerabilities & Data Loss Risks.

| ID | Issue | Risk | Effort | Fix |
| :--- | :--- | :--- | :--- | :--- |
| **CRIT-3** | Missing Firebase Config in Prod | 🔴 HIGH | S | Verify `firebase-config.js` or Environment Variables in Hosting. |
| **CRIT-5** | **Album Cache/Display Architectural Flaw** | 🔴 HIGH | L | See [DEBUG_LOG #92](../debug/DEBUG_LOG.md#issue-92). Requires album identity model, cache key normalization, series-scoped filtering. |

---

## 🛠️ Strategic (High Value / High Effort)

**Objective**: Modularization & Maintenance.

| ID | Issue | Risk | Effort | Fix |
| :--- | :--- | :--- | :--- | :--- |
| **ARCH-2** | Store Pattern Inconsistency | 🟠 MED | M | Refactor `SpotifyEnrichmentStore` to inherit from `BaseRepository`. |
| **ARCH-3** | Low Component Reuse (5%) | 🟡 LOW | L | Create `BaseCard` component. Refactor `PlaylistCard`, `BatchGroupCard`, `BlendFlavorCard`. |

---

## 📉 Debt (Medium / Low Priority)

**Objective**: Clean Code standard.

| ID | Issue | Risk | Effort | Fix |
| :--- | :--- | :--- | :--- | :--- |
| **DEBT-1** | Bloated API Client (525 LOC) | 🟡 LOW | M | Split `client.js` into domain-specific clients (`AlbumClient`, `SpotifyClient`). |
| **DEBT-2** | Offline Support Gap | 🟡 LOW | L | Implement IndexedDB persistence for `CacheManager` (currently memory-only). |

---

## 📅 Sprint Plan

### Sprint 13 (Technical Debt & V3 Architecture) - IN PROGRESS
**Completed:**
1.  ✅ **[CRIT-1]** Atomic Saves for Playlists
2.  ✅ **[CRIT-2]** Remove `innerHTML` globally
3.  ✅ **[CRIT-4]** Firestore Rules for series/albums path
4.  ✅ **[ARCH-1]** Explode `PlaylistsView` → Controller + Renderer + DragHandler

**Pending:**
5.  🟠 **[ARCH-2]** Standardize Stores - See [spec](specs/sprint13-tech-debt/arch-2-standardize-stores_spec.md)
6.  🟠 **[ARCH-3]** Implement BaseCard - See [spec](specs/sprint13-tech-debt/arch-3-basecard_spec.md)
7.  🟠 **[DEBT-2]** IndexedDB Persistence - See [spec](specs/sprint13-tech-debt/debt-2-indexeddb_spec.md)

**Verification Blocked by Bugs:**
8.  🟠 **[#93]** Reconfigure Panel Ignores Ingredients - See [DEBUG_LOG #93](../debug/DEBUG_LOG.md#issue-93)
9.  🔴 **[CRIT-5/#92]** Album Cache/Display Architectural Flaw - See [DEBUG_LOG #92](../debug/DEBUG_LOG.md#issue-92)

---

### Sprint 14 (TBD - After Sprint 13 Complete)
- **[DEBT-1]** Split API Client into domain clients
- **[CRIT-3]** Verify Firebase Config in Prod

### Sprint 15 (TBD)
- Further standardization based on Sprint 13 learnings
