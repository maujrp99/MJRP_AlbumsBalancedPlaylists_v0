# Phase 6 Hotfix Plan: Edit Modal Search + Storefront

**Date**: 2025-12-31
**Sprint**: 15 Phase 6
**Issue**: #113

## Goals
1. Unify search logic between Home and Edit modal
2. Implement lazy authorize (browser locale for search, authorize on persist)
3. Deprecate Autocomplete in favor of artist scan + filters

## Storefront Strategy

| Step | Storefront Source | Authorize? |
|------|------------------|------------|
| Search/Scan | Browser locale | ❌ |
| Preview results | Browser locale | ❌ |
| Persist to Firestore | Apple Music account | ✅ |

**Mismatch handling**: If browser !== Apple storefront, re-fetch with correct ID.

---

## Changes

### 1. MusicKitService.js
- Add `getBrowserStorefront()`: Parse `navigator.language` → storefront code
- Remove `authorize()` from `_doInit()` (lazy)
- Keep `_waitForStorefront()` but use browser locale fallback
- Add `validateStorefront()`: Called on persist, detects mismatch

### 2. SeriesModals.js
- Replace Autocomplete input with:
  - Artist input + "Scan" button
  - Filter buttons (Albums/Singles/Live/Compilations)
  - Compact list results
- Use `albumSearchService.getArtistDiscography()` (same as Home)
- On album add: Call `authorize()` + `validateStorefront()`

### 3. Deprecations
- `Autocomplete.js` → Add deprecated comment header
- `MusicKitSearchAdapter.js` → Add deprecated comment header

## Verification
1. Test search with browser locale (no authorize popup)
2. Test adding album triggers authorize
3. Test storefront mismatch warning
4. Test "trex" finds results in Edit modal
