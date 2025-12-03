# Test Specification - Inventory, CRUD & Migration

**Version**: 1.1 (Updated after Gap Analysis)  
**Date**: 2025-12-02  
**Context**: Sprint 5 Features (Firestore Persistence Architecture)  
**Status**: ⚠️ **PARTIALLY BLOCKED** (Critical gaps found)

---

## 🚨 CRITICAL IMPLEMENTATION GAPS

**Investigation Date**: 2025-12-02 22:40  
**Report**: [persistence_gap_analysis.md](./persistence_gap_analysis.md)

### Gap #1: Playlists NOT Saved to Firestore
- **Issue**: `PlaylistsView.js` calls `playlistsStore.setPlaylists()` (memory only)
- **Missing**: NO call to `PlaylistRepository.create()`
- **Impact**: Playlists are LOST on page refresh
- **Affected TCs**: Any TC requiring playlist persistence

### Gap #2: Series NOT Saved to Firestore  
- **Issue**: `SeriesStore.js` calls `saveToLocalStorage()` only
- **Missing**: NO call to `SeriesRepository.create()`
- **Impact**: Series NOT backed up to Firestore
- **Affected TCs**: Migration expects Firestore data

### Gap #3: Inventory Persistence Status Unknown
- **Issue**: Need to verify if `InventoryRepository` is actually used
- **Impact**: TBD
- **Affected TCs**: All Inventory CRUD tests

### ✅ What IS Working:
- Migration Banner detection
- Migration flow with progress
- All UI components (modals, forms)
- All Repository code exists (just not integrated)

### Test Strategy:
- ✅ **Test Migration** (fully implemented)
- ⚠️ **Test Inventory CRUD** (verify if persistence works)
- ❌ **Skip Playlist Persistence** (not implemented)
- ❌ **Skip Series Firestore** (only localStorage works)

---

## 📋 Table of Contents

1. [User Stories](#user-stories)
2. [Acceptance Criteria](#acceptance-criteria)
3. [Test Cases](#test-cases)

---

# Part 1: User Stories

## Epic 6: Inventory Management

### US-019: Add Album to Inventory
**As a** collector  
**I want** to add albums to my physical collection inventory  
**So that** I can track my CDs, Vinyls, DVDs, Blu-rays, and Digital albums

**Priority**: 🟡 High  
**Estimate**: 5 points  
**Route**: `/inventory`

**Details**:
- User can add album with format (CD, Vinyl, DVD, Blu-ray, Digital)
- Optional fields: Price, Purchase Date, Notes
- Album stored in Firestore: `users/{userId}/inventory/albums`

---

### US-020: View Inventory Collection
**As a** collector  
**I want** to see all albums in my collection  
**So that** I can browse my physical music library

**Priority**: 🟡 High  
**Estimate**: 3 points

**Details**:
- Display all inventory albums in grid/list
- Show: Album, Artist, Format, Price, Notes
- Statistics: Total count, Total value, Average price

---

### US-021: Filter Inventory by Format
**As a** collector  
**I want** to filter my collection by format (CD, Vinyl, Digital)  
**So that** I can see albums in specific formats

**Priority**: 🟢 Medium  
**Estimate**: 3 points

**Details**:
- Dropdown filter: "All Formats" | CD | Vinyl | DVD | Blu-ray | Digital
- Real-time filtering
- Update album count

---

### US-022: Search Inventory
**As a** collector  
**I want** to search my inventory by artist or album name  
**So that** I can quickly find specific albums

**Priority**: 🟢 Medium  
**Estimate**: 3 points

**Details**:
- Search box with real-time filtering
- Search by artist OR album title
- Case-insensitive

---

### US-023: View Inventory Statistics
**As a** collector  
**I want** to see statistics about my collection  
**So that** I know my total investment and collection size

**Priority**: 🟢 Medium  
**Estimate**: 2 points

**Details**:
- Total albums count
- Total value (sum of all prices)
- Average price per album
- Breakdown by format

---

### US-024: Create Series from Inventory
**As a** user  
**I want** to create a playlist series from my inventory albums  
**So that** I can generate playlists from my physical collection

**Priority**: 🟡 High  
**Estimate**: 5 points

**Details**:
- Select multiple albums in InventoryView
- Click "Create Series from Selection"
- Navigate to Albums view with selected albums loaded

---

## Epic 7: CRUD Operations

### US-025: Edit Album Details
**As a** user  
**I want** to edit album metadata (format, price, notes)  
**So that** I can keep my inventory up to date

**Priority**: 🟡 High  
**Estimate**: 5 points

**Details**:
- Edit Album modal opens on click
- Editable fields: Format, Price, Purchase Date, Notes
- Save updates to Firestore
- Update UI in real-time

---

### US-026: Delete Album from Inventory
**As a** user  
**I want** to delete an album from my inventory  
**So that** I can remove items I no longer own

**Priority**: 🟡 High  
**Estimate**: 3 points

**Details**:
- Delete button with confirmation modal
- "Are you sure you want to delete [Album Name]?"
- Remove from Firestore
- Remove from UI

---

### US-027: Rename Series
**As a** user  
**I want** to rename a playlist series  
**So that** I can organize my collections better

**Priority**: 🟢 Medium  
**Estimate**: 3 points

**Details**:
- Edit series name inline or via modal
- Validation: Min 3 characters
- Update Firestore
- Update breadcrumbs/UI

---

### US-028: Delete Series with Cascade
**As a** user  
**I want** to delete a series and all its albums/playlists  
**So that** I can clean up unused series

**Priority**: 🟡 High  
**Estimate**: 5 points

**Details**:
- Confirmation modal with warning
- "This will delete X albums and Y playlists"
- Cascade delete from Firestore
- Update UI

---

## Epic 8: Data Migration

### US-029: Detect Legacy Data
**As a** returning user  
**I want** the app to detect my old localStorage data  
**So that** I know migration is available

**Priority**: 🔴 Critical  
**Estimate**: 3 points

**Details**:
- Check for legacy localStorage keys on app load
- Show Migration Banner in HomeView if detected
- Banner: "We found albums from the old version. Migrate now?"

---

### US-030: Migrate Data from localStorage
**As a** returning user  
**I want** to migrate my old localStorage data to Firestore  
**So that** my data persists and is backed up

**Priority**: 🔴 Critical  
**Estimate**: 8 points

**Details**:
- Click "Migrate Now" button
- Progress modal shows migration status
- Migrate: Series, Albums, Playlists
- Create backup before migration
- Mark migration complete (prevent re-migration)

---

### US-031: Migration Progress Tracking
**As a** user  
**I want** to see migration progress  
**So that** I know the process is working

**Priority**: 🟡 High  
**Estimate**: 3 points

**Details**:
- Progress modal with steps:
  1. Creating backup...
  2. Migrating series (X/Y)
  3. Migrating albums (X/Y)
  4. Migrating playlists (X/Y)
  5. Cleanup complete
- Show errors (if any) but continue migration

---

### US-032: Migration Rollback
**As a** user  
**I want** a way to rollback migration if something goes wrong  
**So that** I don't lose my data

**Priority**: 🟢 Medium  
**Estimate**: 5 points

**Details**:
- Backup created BEFORE migration
- Manual rollback option in settings
- Restore from backup
- Clear Firestore data

---

---

# Part 2: Acceptance Criteria

## AC-018: Add Album to Inventory (US-019)

**Given** I am on InventoryView  
**When** I click "Add Album" button  
**Then**:
- ✅ Modal opens with form
- ✅ Fields: Artist, Album, Format (dropdown), Price, Purchase Date, Notes
- ✅ Format options: CD, Vinyl, DVD, Blu-ray, Digital

**When** I fill form and click "Save"  
**Then**:
- ✅ POST to Firestore `users/{userId}/inventory/albums`
- ✅ Album appears in inventory grid
- ✅ Statistics update (count, total value)
- ✅ Toast: "Album added to inventory!"

---

## AC-019: Filter Inventory by Format (US-021)

**Given** I have 10 albums (5 CDs, 3 Vinyls, 2 Digital)  
**When** I select "CD" from format filter  
**Then**:
- ✅ Only 5 CD albums visible
- ✅ Album count shows "5"
- ✅ Vinyls and Digital hidden

**When** I select "All Formats"  
**Then**:
- ✅ All 10 albums visible
- ✅ Album count shows "10"

---

## AC-020: Search Inventory (US-022)

**Given** I have albums from "Pink Floyd", "Radiohead", "The Beatles"  
**When** I type "Pink" in search box  
**Then**:
- ✅ Only Pink Floyd albums visible
- ✅ Search is case-insensitive ("pink" also works)
- ✅ Debounced (300ms delay)

**When** I clear search  
**Then**:
- ✅ All albums visible again

---

## AC-021: Create Series from Inventory (US-024)

**Given** I am on InventoryView  
**When** I select 3 albums via checkboxes  
**And** I click "Create Series from Selection"  
**Then**:
- ✅ Modal opens asking for series name
- ✅ I enter "My Collection Series"
- ✅ Click "Create"
- ✅ Navigate to `/albums`
- ✅ 3 selected albums loaded
- ✅ Series name shows "My Collection Series"

---

## AC-022: Edit Album Details (US-025)

**Given** I am viewing an album in InventoryView  
**When** I click "Edit" button (pencil icon)  
**Then**:
- ✅ Edit Album Modal opens
- ✅ Pre-filled with current values
- ✅ Fields editable: Format, Price, Notes

**When** I change Price from "$10" to "$15"  
**And** I click "Save"  
**Then**:
- ✅ UPDATE to Firestore
- ✅ Album card shows "$15"
- ✅ Statistics recalculate (total value increases by $5)
- ✅ Toast: "Album updated!"

---

## AC-023: Delete Album with Confirmation (US-026)

**Given** I am viewing an album in InventoryView  
**When** I click "Delete" button (trash icon)  
**Then**:
- ✅ Confirmation modal opens
- ✅ Message: "Are you sure you want to delete [Album Name]?"
- ✅ Buttons: "Cancel" | "Delete"

**When** I click "Delete"  
**Then**:
- ✅ DELETE from Firestore
- ✅ Album removed from grid
- ✅ Statistics update (count decreases)
- ✅ Toast: "Album deleted"

**When** I click "Cancel"  
**Then**:
- ✅ Modal closes
- ✅ Album NOT deleted

---

## AC-024: Migration Banner Display (US-029)

**Given** I have legacy localStorage data  
**And** I have NOT migrated yet  
**When** I navigate to HomeView  
**Then**:
- ✅ Migration Banner visible at top
- ✅ Message: "We found albums from the old version"
- ✅ Button: "Migrate Now"
- ✅ Link: "Learn More"

**Given** I already migrated  
**When** I navigate to HomeView  
**Then**:
- ✅ NO Migration Banner visible

---

## AC-025: Data Migration Flow (US-030)

**Given** Migration Banner is visible  
**When** I click "Migrate Now"  
**Then**:
- ✅ Progress Modal opens
- ✅ Step 1: "Creating backup..." ✅
- ✅ Step 2: "Migrating series (1/3)..." (shows progress)
- ✅ Step 3: "Migrating albums (5/10)..." (shows progress)
- ✅ Step 4: "Migrating playlists (2/5)..." (shows progress)
- ✅ Step 5: "Migration complete!" ✅
- ✅ Button: "Close"

**When** migration completes  
**Then**:
- ✅ Data in Firestore matches localStorage
- ✅ Migration Banner hidden
- ✅ localStorage marked as migrated

**When** error occurs during migration  
**Then**:
- ✅ Error logged but migration continues
- ✅ Final step shows: "Migration complete with X errors"
- ✅ Button: "View Errors"

---

---

# Part 3: Test Cases

## TC-019: Add Album to Inventory
**Priority**: 🟡 High  
**Type**: Functional, Integration  
**User Story**: US-019  
**Status**: ⚠️ **VERIFY PERSISTENCE** (Unknown if uses InventoryRepository)

**Pre-conditions**:
- Logged in (or authenticated)
- On InventoryView (`/inventory`)
- ⚠️ **Check**: Does InventoryView use InventoryRepository?

**Steps**:
1. Click "Add Album" button
2. Fill form:
   - Artist: "Pink Floyd"
   - Album: "The Wall"
   - Format: "Vinyl" (dropdown)
   - Price: "25.00"
   - Notes: "Mint condition"
3. Click "Save"
4. Observe UI update

**Expected Result**:
- ✅ Album appears in inventory grid
- ✅ Shows: Pink Floyd - The Wall, Vinyl, $25.00
- ✅ Statistics update:
  * Total count increases by 1
  * Total value increases by $25
- ✅ Toast notification: "Album added to inventory!"

**Status**: ⏳ Pending

---

## TC-020: Filter Inventory by Format
**Priority**: 🟢 Medium  
**Type**: Functional  
**User Story**: US-021  

**Pre-conditions**:
- InventoryView has 10 albums:
  * 5 CDs
  * 3 Vinyls
  * 2 Digital

**Steps**:
1. Note total album count: 10
2. Select "CD" from Format filter dropdown
3. Count visible albums
4. Select "Vinyl"
5. Count visible albums
6. Select "All Formats"
7. Count visible albums

**Expected Result**:
- ✅ Filter "CD": 5 albums visible, count shows "5"
- ✅ Filter "Vinyl": 3 albums visible, count shows "3"
- ✅ Filter "All Formats": 10 albums visible, count shows "10"
- ✅ Filtering is instant (no page reload)

**Status**: ⏳ Pending

---

## TC-021: Search Inventory
**Priority**: 🟢 Medium  
**Type**: Functional  
**User Story**: US-022  

**Pre-conditions**:
- InventoryView has albums from:
  * Pink Floyd (3 albums)
  * Radiohead (2 albums)
  * The Beatles (1 album)

**Steps**:
1. Note total: 6 albums
2. Type "Pink" in search box
3. Wait 300ms (debounce)
4. Count visible albums
5. Type "radio" (lowercase)
6. Wait 300ms
7. Count visible albums
8. Clear search box

**Expected Result**:
- ✅ Search "Pink": 3 albums (Pink Floyd) visible
- ✅ Search "radio": 2 albums (Radiohead) visible
- ✅ Case-insensitive ✅
- ✅ Clear search: All 6 albums visible

**Status**: ⏳ Pending

---

## TC-022: Create Series from Inventory Selection
**Priority**: 🟡 High  
**Type**: Integration  
**User Story**: US-024  

**Pre-conditions**:
- InventoryView has 5+ albums

**Steps**:
1. Check checkboxes for 3 albums:
   - Pink Floyd - The Wall
   - Radiohead - OK Computer
   - The Beatles - Abbey Road
2. Click "Create Series from Selection" button
3. Modal opens
4. Enter series name: "My Vinyl Collection"
5. Click "Create"
6. Observe navigation to `/albums`
7. Verify loaded albums

**Expected Result**:
- ✅ Navigate to `/albums`
- ✅ 3 albums loaded (exactly the selected ones)
- ✅ Series name shows "My Vinyl Collection"
- ✅ Albums match selected inventory items

**Status**: ⏳ Pending

---

## TC-023: Edit Album in Inventory
**Priority**: 🟡 High  
**Type**: CRUD, Integration  
**User Story**: US-025  

**Pre-conditions**:
- Album in inventory: "Pink Floyd - The Wall", CD, $10, "Good condition"

**Steps**:
1. Locate album card
2. Click "Edit" button (pencil icon)
3. Edit Album Modal opens
4. Change:
   - Format: CD → Vinyl
   - Price: $10 → $25
   - Notes: "Good condition" → "Mint condition"
5. Click "Save"
6. Observe UI update
7. Verify statistics

**Expected Result**:
- ✅ Album card updates:
  * Format: Vinyl
  * Price: $25
  * Notes: "Mint condition"
- ✅ Statistics:
  * Total value: +$15 (from $10 to $25)
  * Vinyl count: increases by 1
  * CD count: decreases by 1
- ✅ Toast: "Album updated!"

**Status**: ⏳ Pending

---

## TC-024: Delete Album from Inventory with Confirmation
**Priority**: 🟡 High  
**Type**: CRUD  
**User Story**: US-026  

**Pre-conditions**:
- Album in inventory: "Pink Floyd - The Wall", $25
- Total inventory: 5 albums, $100 total value

**Steps**:
1. Locate album card
2. Click "Delete" button (trash icon)
3. Confirmation modal opens
4. Verify message text
5. Click "Delete" button in modal
6. Observe UI
7. Verify statistics

**Expected Result**:
- ✅ Confirmation modal shows: "Are you sure you want to delete Pink Floyd - The Wall?"
- ✅ Album card removed from grid
- ✅ Statistics update:
  * Total count: 5 → 4
  * Total value: $100 → $75 (decreased by $25)
- ✅ Toast: "Album deleted"

**Status**: ⏳ Pending

---

## TC-025: Migration Banner Detection
**Priority**: 🔴 Critical  
**Type**: Migration  
**User Story**: US-029  

**Pre-conditions**:
- Fresh browser session
- localStorage has legacy data (from v1.x)
- NO Firestore data
- NO migration flag set

**Steps**:
1. Navigate to `/` (HomeView)
2. Observe top of page
3. Verify Migration Banner visible
4. Read banner text
5. Verify buttons

**Expected Result**:
- ✅ Migration Banner visible at top
- ✅ Message includes: "We found albums from the old version"
- ✅ Button: "Migrate Now" (primary)
- ✅ Link: "Learn More"

**Status**: ⏳ Pending

---

## TC-026: Data Migration Process
**Priority**: 🔴 Critical  
**Type**: Migration, Integration  
**User Story**: US-030, US-031  
**Status**: ⚠️ **PARTIAL** (Series may not migrate to Firestore)

**Pre-conditions**:
- localStorage has:
  * 2 series
  * 5 albums
  * 3 playlists
- Migration Banner visible

**⚠️ KNOWN ISSUE**: 
- Series are saved to localStorage (not Firestore)
- Migration expects Firestore data
- May fail or have partial migration

**Steps**:
1. Click "Migrate Now" button
2. Progress Modal opens
3. Observe each migration step:
   - Step 1: Creating backup
   - Step 2: Migrating series (1/2, 2/2)
   - Step 3: Migrating albums (1/5, 2/5, ..., 5/5)
   - Step 4: Migrating playlists (1/3, 2/3, 3/3)
   - Step 5: Cleanup
4. Click "Close" when complete
5. F5 refresh page
6. Verify Migration Banner gone
7. Navigate to `/albums`
8. Verify data migrated

**Expected Result**:
- ✅ Progress modal shows all steps
- ✅ Each step completes (green checkmark)
- ✅ No errors displayed
- ✅ Modal button: "Close"
- ✅ After refresh: NO Migration Banner
- ✅ Firestore has 2 series, 5 albums, 3 playlists
- ✅ Data matches localStorage exactly

**Expected Result (Updated)**:
- ✅ Progress modal shows all steps
- ⚠️ **Series migration**: May skip if no Firestore data
- ✅ Albums/Playlists: Should migrate if exist
- ⚠️ Check console for "Series not found in Firestore" warnings
- ✅ Modal button: "Close"
- ✅ After refresh: NO Migration Banner

**Status**: ⏳ Pending (Expect partial migration)

---

## TC-027: Migration with Errors
**Priority**: 🟡 High  
**Type**: Migration, Error Handling  
**User Story**: US-030  

**Pre-conditions**:
- localStorage has 10 albums (1 with invalid data)
- Migration Banner visible

**Steps**:
1. Click "Migrate Now"
2. Observe migration progress
3. Verify error handling
4. Check final status

**Expected Result**:
- ✅ Migration continues despite errors
- ✅ Final message: "Migration complete with 1 error"
- ✅ Button: "View Errors"
- ✅ Click "View Errors" → Shows error details
- ✅ 9/10 albums migrated successfully
- ✅ Invalid album skipped but logged

**Status**: ⏳ Pending

---

## Test Execution Summary

### Inventory Management (US-019 to US-024)
- **Total TCs**: 4 (TC-019 to TC-022)
- **Priority**: 🟡 High (3), 🟢 Medium (1)

### CRUD Operations (US-025 to US-028)
- **Total TCs**: 2 (TC-023, TC-024)
- **Priority**: 🟡 High (2)

### Migration (US-029 to US-032)
- **Total TCs**: 3 (TC-025, TC-026, TC-027)
- **Priority**: 🔴 Critical (2), 🟡 High (1)

### Grand Total
- **User Stories**: 14 (US-019 to US-032)
- **Acceptance Criteria**: 8 (AC-018 to AC-025)
- **Test Cases**: 9 (TC-019 to TC-027)
- **Ready to Test**: 9 TCs (all can be attempted)
- **Expected Partial Results**: 2 TCs (TC-019, TC-026 - verify persistence)
- **Fully Functional**: 7 TCs (TC-020 to TC-025, TC-027)

---

## 🔗 Related Documentation

- [CHANGELOG.md](../CHANGELOG.md) - Sprint 5 implementation details
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Repository and Cache architecture
- [DEBUG_LOG.md](../debug/DEBUG_LOG.md) - Issue #17, #18 (InventoryView fixes)
- [TEST_SPECIFICATION.md](./TEST_SPECIFICATION.md) - Core features test plan

---

**Next Steps**:
1. ✅ UAT test InventoryView CRUD operations
2. ✅ UAT test Migration Banner and flow
3. ✅ Verify Edit/Delete Album modals
4. ✅ Test series creation from inventory
5. ✅ Update test status after manual verification

---

**Last Updated**: 2025-12-02
