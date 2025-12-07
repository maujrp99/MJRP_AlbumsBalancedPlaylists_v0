# Implementation Plan: Sprint 5 Complete Fix

**Date**: 2025-12-06T21:40  
**Version**: v2.0.4 → v2.0.5  
**Status**: Phase 1 Complete, Phases 2-6 Pending

---

## TopNav Menu (5 Items) ✅

| # | Menu | Route | View |
|---|------|-------|------|
| 1 | Home | `/home` | HomeView |
| 2 | Albums | `/albums?seriesId=X` | AlbumsView (dynamic) |
| 3 | Album Series | `/album-series` | AlbumSeriesListView |
| 4 | Playlist Series | `/playlist-series` | SavedPlaylistsView |
| 5 | Inventory | `/inventory` | InventoryView |

---

## Phase 1: TopNav, Routes & Nomenclature ✅ DONE

### Changes Made:
- TopNav updated to 5 items (desktop + mobile)
- Albums link dynamically uses active series ID
- Renamed "Recent Series" → "Recent Albums Series"

### Nomenclature Refactor:
| Before | After |
|--------|-------|
| `SeriesListView.js` | `AlbumSeriesListView.js` |
| `series.js` | `albumSeries.js` |
| `seriesStore` | `albumSeriesStore` |
| `SeriesStore` class | `AlbumSeriesStore` |

**Files Updated**: 6 files, ~35 references  
**Build**: ✅ Verified

---

## Phase 2: Firebase SDK Standardization (P0) - DONE

- Converted `albumSeries.js` to modular Firestore API
- Removed duplicate `saveToFirestore()`
- Pending: `albums.js` conversion

---

## Phase 3: Ghost Albums Fix (P0) - ✅ DONE

Implemented 3-Layer Defense: Render Guard, Mount Guard, and Timing Fix.

---

## Phase 3b: Inventory Modal Fix (High) - ✅ DONE

Fixed SPA entry point CSS link issue and CSS positioning rules.

---

## Phase 4: Code Cleanup (P1) - PENDING

Remove duplicate `escapeHtml()` from 4 views.

---

## Phase 5: Playlists Persistence (P0) - PENDING

Add localStorage/Firestore persistence to PlaylistsStore.

---

## Phase 6: Inventory & Series UI (P1) - PENDING

Integrate InventoryRepository in InventoryView.
