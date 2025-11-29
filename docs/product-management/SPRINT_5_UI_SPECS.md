# Sprint 5 Phase 3: UI Specifications

**Status**: 📐 Specification Phase  
**Target**: Phase 3 Implementation

---

## Overview

Phase 3 UI components complete the user-facing layer of Sprint 5's Firestore persistence system:
- Migration banner + progress modal
- CRUD operations (delete/edit modals)
- **InventoryView** (new feature - physical album collection)
- Generate Playlists flow

---

## 1. Migration Banner (HomeView)

### Purpose
Alert users with legacy localStorage data to migrate to Firestore.

### Trigger Condition
```javascript
const migration = new MigrationUtility(firestore, cache)
if (!migration.isMigrationComplete() && migration.hasLocalStorageData()) {
  // Show banner
}
```

### UI Specification

**Location**: Top of HomeView, below header

**Style**: 
- Info banner (blue accent)
- Glassmorphism background
- Non-dismissible (must migrate or skip)

**Content**:
```
┌─────────────────────────────────────────────────────┐
│ ℹ️ Data Migration Available                         │
│                                                     │
│ We found ${count} albums in your browser storage.  │
│ Migrate to Firestore for cross-device sync and     │
│ better performance.                                 │
│                                                     │
│ [Migrate Now]  [Skip for Now]  [Learn More]       │
└─────────────────────────────────────────────────────┘
```

**Buttons**:
- **Migrate Now**: Open progress modal, start migration
- **Skip for Now**: Hide banner (show again on next visit)
- **Learn More**: Tooltip explaining benefits

---

## 2. Migration Progress Modal

### Purpose
Show real-time migration progress during localStorage → Firestore transfer.

### UI Specification

**Modal Layout**:
```
╔════════════════════════════════════════════════╗
║  🔄 Migrating Data to Firestore                ║
╠════════════════════════════════════════════════╣
║                                                ║
║  Progress: 47/100                              ║
║  ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░ 47%                    ║
║                                                ║
║  📦 Migrated series: Pink Floyd Collection     ║
║  📀 Migrated album: The Wall                   ║
║                                                ║
║  ⏱️ Estimated time: 30 seconds                 ║
║                                                ║
╚════════════════════════════════════════════════╝
```

**States**:
1. **In Progress**: Animated progress bar, live updates
2. **Complete**: 
   ```
   ✅ Migration Complete!
   
   📊 Results:
   - ${seriesMigrated} series migrated
   - ${albumsMigrated} albums migrated
   - ${errors.length} errors
   
   [View Details] [Close]
   ```
3. **Error**: Show errors, offer retry

**Non-blocking**: User can't close modal during migration (prevent data loss)

---

## 3. CRUD Delete Modal

### Purpose
Confirm deletion with cascade preview for series/albums/playlists.

### UI Specification - Delete Series

```
╔════════════════════════════════════════════════╗
║  ⚠️ Delete Series?                             ║
╠════════════════════════════════════════════════╣
║                                                ║
║  Are you sure you want to delete:              ║
║                                                ║
║  📁 "Classic Rock Collection"                  ║
║                                                ║
║  This will also permanently delete:            ║
║  • 12 albums                                   ║
║  • 3 playlists                                 ║
║                                                ║
║  ⚠️ This action cannot be undone.              ║
║                                                ║
║  [Cancel]              [Delete Forever]        ║
║                                                ║
╚════════════════════════════════════════════════╝
```

**Button Styles**:
- Cancel: Secondary (gray)
- Delete Forever: Danger (red), requires hover to enable

**Cascade Preview**:
- Show exact count of affected items
- Different wording for series vs albums

**Delete Album**:
```
⚠️ Delete Album?

"The Wall" by Pink Floyd

This will remove the album from this series.

[Cancel]  [Delete]
```

**Delete Playlist**:
```
⚠️ Delete Playlist?

"Greatest Hits Vol. 1"
23 tracks

[Cancel]  [Delete]
```

---

## 4. CRUD Edit Modal

### Purpose
Inline editing for series names, playlist names, album metadata.

### UI Specification - Edit Series

```
╔════════════════════════════════════════════════╗
║  ✏️ Edit Series Name                           ║
╠════════════════════════════════════════════════╣
║                                                ║
║  Series Name:                                  ║
║  ┌──────────────────────────────────────────┐ ║
║  │ Classic Rock Collection                  │ ║
║  └──────────────────────────────────────────┘ ║
║                                                ║
║  ℹ️ Min 3 characters                           ║
║                                                ║
║  [Cancel]                    [Save Changes]    ║
║                                                ║
╚════════════════════════════════════════════════╝
```

**Validation**:
- Real-time character count
- Disable "Save" if < 3 chars
- Trim whitespace on save

**Edit Playlist**:
- Same layout, different title
- Option to edit name + reorder tracks (drag-drop)

---

## 5. InventoryView (NEW Feature)

### Route
`/inventory` - New top-level route

### Purpose
Manage user's physical album collection (CD, Vinyl, DVD, Blu-ray, Digital).

### Layout

**Header**:
```
╔════════════════════════════════════════════════════════╗
║  📚 My Collection                                      ║
║  120 albums • Total Value: $3,450                      ║
╠════════════════════════════════════════════════════════╣
```

**Filters & Actions**:
```
┌──────────────────────────────────────────────────────┐
│ [🔍 Search...]  Format: [All ▼]  [Grid/List]        │
│                                                      │
│ ☑️ Select Mode    [Create Series from Selected (3)] │
└──────────────────────────────────────────────────────┘
```

**Format Filter Options**:
- All Formats
- 📀 CD
- 💿 Vinyl
- 📀 DVD
- 📀 Blu-ray
- 💾 Digital

**Grid View** (default):
```
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│ [Cover] │  │ [Cover] │  │ [Cover] │  │ [Cover] │
│         │  │         │  │         │  │         │
│ The Wall│  │ Dark... │  │ Wish... │  │ Animals │
│ P. Floyd│  │ P. Floyd│  │ P. Floyd│  │ P. Floyd│
│ 1979    │  │ 1973    │  │ 1975    │  │ 1977    │
│ 💿 Vinyl│  │ 💿 Vinyl│  │ 📀 CD   │  │ 📀 CD   │
│ $150    │  │ $200    │  │ $20     │  │ $25     │
│         │  │         │  │         │  │         │
│[✏️][🗑️] │  │[✏️][🗑️] │  │[✏️][🗑️] │  │[✏️][🗑️] │
└─────────┘  └─────────┘  └─────────┘  └─────────┘
```

**List View**:
```
┌──────────────────────────────────────────────────────┐
│ ☐ [Cover] The Wall          Pink Floyd  1979  💿 $150│
│ ☐ [Cover] Dark Side...      Pink Floyd  1973  💿 $200│
│ ☐ [Cover] Wish You Were...  Pink Floyd  1975  📀 $20 │
│ ☐ [Cover] Animals           Pink Floyd  1977  📀 $25 │
└──────────────────────────────────────────────────────┘
```

**Empty State**:
```
╔════════════════════════════════════════════════╗
║                                                ║
║              📚                                ║
║         Your inventory is empty                ║
║                                                ║
║  Add albums from the Albums view to start     ║
║  tracking your collection.                     ║
║                                                ║
║         [Go to Albums]                         ║
║                                                ║
╚════════════════════════════════════════════════╝
```

---

## 6. Add to Inventory Action (AlbumsView)

### Location
Album card actions (compact view) or album header (expanded view)

### Button Placement

**Compact Grid View**:
```
┌─────────────────┐
│   [Cover Art]   │
│                 │
│ The Wall        │
│ Pink Floyd      │
│ 1979            │
│                 │
│ [View] [+ Inv]  │  ← Add to Inventory button
└─────────────────┘
```

**Expanded View**:
```
╔════════════════════════════════════════════════╗
║ The Wall - Pink Floyd (1979)                  ║
║ [View Details] [Generate Playlist] [+ Inventory]
╚════════════════════════════════════════════════╝
```

### Modal - Add to Inventory

```
╔════════════════════════════════════════════════╗
║  📚 Add to Inventory                           ║
╠════════════════════════════════════════════════╣
║                                                ║
║  Album: The Wall - Pink Floyd                 ║
║                                                ║
║  Format: *                                     ║
║  ┌──────────────────────────────────────────┐ ║
║  │ 💿 Vinyl                              ▼  │ ║
║  └──────────────────────────────────────────┘ ║
║                                                ║
║  Purchase Price (optional):                   ║
║  ┌──────────────────────────────────────────┐ ║
║  │ $                                         │ ║
║  └──────────────────────────────────────────┘ ║
║                                                ║
║  Notes:                                        ║
║  ┌──────────────────────────────────────────┐ ║
║  │ Limited edition remaster                 │ ║
║  └──────────────────────────────────────────┘ ║
║                                                ║
║  [Cancel]                   [Add to Inventory]║
║                                                ║
╚════════════════════════════════════════════════╝
```

**State - Already in Inventory**:
```
[✓ In Inventory]  ← Disabled, different color
```

---

## 7. Create Series from Inventory

### Trigger
Select 2+ albums in InventoryView → "Create Series from Selected" button appears

### Modal

```
╔════════════════════════════════════════════════╗
║  🎵 Create Series from Selection               ║
╠════════════════════════════════════════════════╣
║                                                ║
║  Selected Albums: 3                            ║
║  • The Wall                                    ║
║  • Dark Side of the Moon                       ║
║  • Wish You Were Here                          ║
║                                                ║
║  Series Name: *                                ║
║  ┌──────────────────────────────────────────┐ ║
║  │ Pink Floyd Collection                    │ ║
║  └──────────────────────────────────────────┘ ║
║                                                ║
║  [Cancel]                    [Create Series]   ║
║                                                ║
╚════════════════════════════════════════════════╝
```

**Flow**:
1. Select albums (checkbox mode)
2. Click "Create Series from Selected"
3. Enter series name
4. Create → Navigate to `/albums?series={newSeriesId}`

---

## 8. Generate Playlists Button (AlbumsView)

### Location
Header actions, next to view mode toggle

### UI

**Button**:
```
[🚀 Generate Playlists]
```

**Flow**:
1. Click button
2. Navigate to `/playlists?series={seriesId}`
3. PlaylistsView shows "Generate" button (existing feature)

**Purpose**: Fix missing navigation from Albums → Playlists

---

## Design System

### Colors

**Badges by Format**:
- CD: Blue (`#3b82f6`)
- Vinyl: Green (`#10b981`)
- DVD: Purple (`#8b5cf6`)
- Blu-ray: Cyan (`#06b6d4`)
- Digital: Gray (`#6b7280`)

### Icons
- ℹ️ Info
- ⚠️ Warning
- ✅ Success
- 🔄 Loading
- 📚 Collection
- 💿 Vinyl
- 📀 CD/DVD/Blu-ray
- 💾 Digital
- 🚀 Generate

### Animations
- Modal fade-in: 200ms
- Progress bar: Smooth animation
- Delete button: Shake on hover (warning)

---

## Implementation Notes

**Estimated LOC per Component**:
- Migration Banner: ~50 lines
- Migration Modal: ~100 lines
- Delete Modal: ~80 lines
- Edit Modal: ~60 lines
- InventoryView: ~400 lines
- Add to Inventory: ~80 lines
- Create from Inventory: ~100 lines
- Generate Playlists button: ~20 lines

**Total**: ~890 lines of UI code

**Dependencies**:
- Repositories (already implemented)
- CacheManager (already implemented)
- MigrationUtility (already implemented)
- Router (needs `/inventory` route)

**Testing Strategy**:
- Manual testing (17-item checklist)
- Browser DevTools (cache inspection)
- Cross-tab testing (open 2 tabs)
