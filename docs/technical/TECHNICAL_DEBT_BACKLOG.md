# Technical Debt Backlog & Refactoring Roadmap

**Last Updated**: 2025-12-24
**Source**: [Code Quality Assessment v5.0](refactor/CODE_QUALITY_ASSESSMENT_v5.0.md) & [Architecture Deep Dive](../ARCHITECTURE.md)

---

## 🚨 Critical (Immediate Action Required)

**Objective**: Fix Security Vulnerabilities & Data Loss Risks.

| ID | Issue | Risk | Effort | Fix |
| :--- | :--- | :--- | :--- | :--- |
| **CRIT-1** | **Data Loss on Playlist Save** | 🔴 HIGH | S | Use Firestore `WriteBatch` in `PlaylistsStore.saveToFirestore` to guarantee atomic saves. |
| **CRIT-2** | **XSS Vulnerability (innerHTML)** | 🔴 HIGH | M | Replace all 49 instances of `innerHTML` with `textContent` or `DOMPurify`. Found in `*Card.js` and `*View.js`. |
| **CRIT-3** | **Missing Firebase Config in Prod** | 🔴 HIGH | S | Ensure `firebase-config.js` or Environment Variables are correctly set in the Hosting Provider. (Completed?) |

## 🛠️ Strategic (High Value / High Effort)

**Objective**: Modularization & Maintenance.

| ID | Issue | Risk | Effort | Fix |
| :--- | :--- | :--- | :--- | :--- |
| **ARCH-1** | **God Class: PlaylistsView (960 LOC)** | 🟠 MED | L | Extract `PlaylistsDragHandler` (DnD logic) and `PlaylistsGridRenderer` (DOM logic). |
| **ARCH-2** | **Store Pattern Inconsistency** | 🟠 MED | M | Refactor `SpotifyEnrichmentStore` to inherit from `BaseRepository` (standardize cache & access patterns). |
| **ARCH-3** | **Low Component Reuse (5%)** | 🟡 LOW | L | Create `BaseCard` component. Refactor `PlaylistCard`, `BatchGroupCard`, `BlendFlavorCard` to inherit or compose it. |

## 📉 Debt (Medium / Low Priority)

**Objective**: Clean Code standard.

| ID | Issue | Risk | Effort | Fix |
| :--- | :--- | :--- | :--- | :--- |
| **DEBT-1** | **Bloated API Client (500+ LOC)** | 🟡 LOW | M | Split `client.js` into domain-specific clients (`AlbumClient`, `SpotifyClient`). |
| **DEBT-2** | **Offline Support Gap** | 🟡 LOW | L | Implement IndexedDB persistence for `BaseRepository` cache (currently memory-only). |
| **DEBT-3** | **View-Store Coupling** | 🟡 LOW | M | Introduce `PlaylistsController` to mediate between View and Store (V3 Pattern). |

---

## 📅 Recommended Sprint Plan

### Sprint 13.5 (Hardening)
1.  **[CRIT-1]** Atomic Saves for Playlists.
2.  **[CRIT-2]** Remove `innerHTML` globally.

### Sprint 14 (Refactor)
1.  **[ARCH-1]** Explode `PlaylistsView`.
2.  **[ARCH-3]** Implement `BaseCard`.

### Sprint 15 (Standardization)
1.  **[ARCH-2]** Standardize Stores.
2.  **[DEBT-2]** IndexedDB Caching.
