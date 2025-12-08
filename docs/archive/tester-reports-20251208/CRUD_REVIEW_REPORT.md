# CRUD Review Report: Main Views

**Date**: 2025-12-07T20:36  
**Views Analyzed**: Album Series, Playlist Series, Inventory  
**Status Legend**: ✅ Validated | 📝 Code Exists | ⚠️ Gap | ❌ Missing | 🔵 New Requirement

---

## Executive Summary

| View | VIEW | ADD | EDIT | DELETE |
|------|------|-----|------|--------|
| **Album Series** | 📝 | ⚠️ Indirect | 🔵 Needs Enhancement | 📝 |
| **Playlist Series** | 📝 | N/A | 📝 | 📝 |
| **Inventory** | 🔵 Needs View Button | ⚠️ Via AlbumsView | 📝 | 📝 |

---

## 🔵 New Requirements (User Feedback)

### Global UI/UX Standardization

> **CRITICAL**: Standardize across ALL views

1. **Validation Messages**
   - ❌ Remove all `alert()` popups
   - 🔵 Create Toast/Snackbar component for success/error feedback
   - 🔵 Standardize error message styling

2. **Button Nomenclature & Style**
   - 🔵 Audit all button labels (consistent verbs: "Save", "Cancel", "Delete", etc.)
   - 🔵 Standardize button hierarchy (Primary, Secondary, Danger, Ghost)
   - 🔵 Ensure consistent icon usage

3. **Warning/Confirmation Messages**
   - 🔵 Create reusable `ConfirmationModal` component
   - 🔵 Standardize warning text patterns
   - 🔵 Delete messages should clarify what IS and ISN'T deleted

---

## 1. Album Series (`AlbumSeriesListView.js`)

**Route**: `/album-series`

### VIEW 📝 Code Exists
- Grid of series cards with name, date, status, album count

### ADD ⚠️ Indirect
- Currently redirects to `/home` for creation

### EDIT 🔵 Needs Enhancement
**Current**: Only edits series name via modal

**Required** (User Feedback):
- 🔵 Add/Remove albums from series
- 🔵 Edit series name inline or via modal
- 🔵 View list of albums in series before editing

**Proposed UI/UX Solution**:
```
┌─────────────────────────────────────────────┐
│  Edit Series: "My Rock Collection"          │
├─────────────────────────────────────────────┤
│  Series Name: [___________________] [Save]  │
│                                             │
│  Albums (3):                                │
│  ┌─────────────────────────────────────┐   │
│  │ ☑ Pink Floyd - The Wall      [🗑️]  │   │
│  │ ☑ Led Zeppelin - IV          [🗑️]  │   │
│  │ ☑ Black Sabbath - Paranoid   [🗑️]  │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [+ Add Album]                              │
│                                             │
│  [Cancel]                    [Save Changes] │
└─────────────────────────────────────────────┘
```

### DELETE 📝 Code Exists
- Modal confirmation exists
- 🔵 **Requirement**: Warning must clarify that albums remain in Inventory

---

## 2. Playlist Series (`SavedPlaylistsView.js`)

**Route**: `/playlist-series`

### VIEW 📝 Code Exists
- Cards grouped by Series with playlist cards

### ADD (N/A)
- Adding playlists via `/playlists` view - **Confirmed OK**

### EDIT 📝 Code Exists
- "Edit Playlists" navigates to editor

### DELETE 📝 Code Exists
- Modal confirmation with cascade delete

---

## 3. Inventory (`InventoryView.js`)

**Route**: `/inventory`

### VIEW 🔵 Needs Enhancement
**Current**: Grid/List with basic info

**Required** (User Feedback):
- 🔵 **View Album Details Button** - Opens modal with:
  - Album cover, title, artist, year
  - Track listing
  - Format, condition, price
  - Notes

### ADD ⚠️ Via AlbumsView
- Empty state shows "Go to Albums" button

### EDIT 📝 Code Exists
- Inline price editing
- Modal for format/condition/notes

### DELETE 📝 Code Exists
- Confirmation modal

### OWNED STATUS 🔵 New Requirement
**User Feedback**: Checkbox to mark album as "owned" with badge

**Proposed Solution**:
```
┌──────────────────────────────────────┐
│  [Cover]     Pink Floyd - The Wall   │
│              1979 • CD               │
│                                      │
│  ☑ Owned     [✓ OWNED]  ← Badge     │
│                                      │
│  $ 25.00                             │
│  [View] [Edit] [🗑️]                  │
└──────────────────────────────────────┘
```

- Total value calculation: Only count albums with `owned: true`
- Badge styles: Green "OWNED" vs Gray "WISHLIST"
- Filter option: Show All / Owned / Wishlist

---

## Identified Gaps & Requirements

### High Priority

| # | Requirement | View | Status |
|---|-------------|------|--------|
| 1 | Remove all `alert()` popups | Global | ❌ |
| 2 | Toast/Snackbar feedback component | Global | ❌ |
| 3 | Standardize button nomenclature | Global | ❌ |
| 4 | Standardize confirmation modals | Global | ❌ |
| 5 | Edit Series: Add/Remove albums | Album Series | ❌ |
| 6 | View Album Details button | Inventory | ❌ |
| 7 | Owned status checkbox + badge | Inventory | ❌ |

### Medium Priority

| # | Requirement | View | Status |
|---|-------------|------|--------|
| 8 | Inline name editing | Album Series | ❌ |
| 9 | Delete warning: clarify scope | All | ❌ |
| 10 | Create Series from Inventory | Inventory | ⚠️ TODO |

---

## Modal Component Inventory

| Modal | Location | Status |
|-------|----------|--------|
| Edit Series | AlbumSeriesListView | 📝 Needs enhancement |
| Delete Series | AlbumSeriesListView | 📝 Needs standardization |
| View Playlist | SavedPlaylistsView | 📝 Code Exists |
| Delete Playlist Series | SavedPlaylistsView | 📝 Needs standardization |
| Edit Inventory | InventoryModals.js | 📝 Code Exists |
| Delete Inventory | Modals.js | 📝 Needs standardization |
| **View Album Details** | InventoryModals.js | ❌ NEW |
| **Toast/Snackbar** | components/ | ❌ NEW |

---

## Next Steps

1. **Phase 1: UI Standardization**
   - Create `Toast.js` component
   - Create `ConfirmationModal.js` reusable component
   - Audit and replace all `alert()` calls

2. **Phase 2: Album Series Edit**
   - Enhance edit modal with album list
   - Add/remove albums functionality

3. **Phase 3: Inventory Enhancements**
   - View Album Details modal
   - Owned status checkbox + badge
   - Filter by owned/wishlist
