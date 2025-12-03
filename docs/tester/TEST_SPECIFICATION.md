# MJRP Playlist Generator - Test Specification

**Version**: 1.1 (Updated after Gap Analysis)  
**Date**: 2025-12-02  
**Author**: QA Engineer (AI Agent)  
**Status**: ⚠️ **Implementation Gaps Identified**  
**Reviewer**: CEO  

---

## 🚨 IMPLEMENTATION STATUS (Sprint 5 Hardening)

**Status**: ✅ **Implemented (Hybrid Persistence)**
**Date**: 2025-12-03

### Persistence Strategy:
1.  **Playlists**: Firestore (Batch Writes) + localStorage (Offline support)
2.  **Series**: Firestore + localStorage
3.  **Albums**: localStorage cache

### New Features:
-   **Series Management UI**: `/series` route for CRUD operations
-   **Safe Delete**: Deleting a series does NOT delete its albums from inventory

**See**: [TEST_PLAN_SPRINT5_HARDENING.md](./TEST_PLAN_SPRINT5_HARDENING.md) for specific test scenarios.

---

## 📋 Table of Contents

1. [Navigation Scenarios](#navigation-scenarios)
2. [Functionality Mapping](#functionality-mapping)
3. [User Stories](#user-stories)
4. [Acceptance Criteria](#acceptance-criteria)
5. [Test Cases](#test-cases)

---

# Part 1: Navigation Scenarios

## 1.1 All Possible Navigation Paths

### Primary Routes
```
/ (Home)
├── /series (Series List)
│   └── /albums (for selected series)
├── /albums
│   ├── /ranking?album={id}
│   └── /playlists
├── /playlists
│   ├── /ranking?album={id}
│   └── /albums
└── /ranking?album={id}
    ├── /albums
    └── /playlists
```

### Navigation Map (Complete)

#### From HOME (`/`)
- **→ Albums**: Click "Load Albums" button
- **→ Series List**: Click "Playlist Series" in TopNav
- **→ Albums**: Click "Continue" on recent series card
- **Direct URL**: Type `/albums` in URL bar

#### From SERIES LIST (`/series`)
- **→ Home**: Click "Home" in TopNav
- **→ Albums**: Click "Open" on a series
- **→ Edit Series**: Click "Edit" icon
- **→ Delete Series**: Click "Delete" icon

#### From ALBUMS (`/albums`)
- **→ Home**: Click "Home" in TopNav
- **→ Playlists**: Click "Playlists" in TopNav
- **→ Playlists**: Click "Generate Playlists" button
- **→ Ranking**: Click on album card
- **→ Ranking**: Click album in search results
- **Browser Back**: Returns to previous view
- **F5 Refresh**: Reload current page
- **Direct URL**: Type `/ranking?album=xyz` in URL bar

#### From PLAYLISTS (`/playlists`)
- **→ Home**: Click "Home" in TopNav
- **→ Albums**: Click "Albums" in TopNav
- **→ Ranking**: Click track's album badge (future feature)
- **Browser Back**: Returns to previous view
- **F5 Refresh**: Reload current page

**Note**: Series selector dropdown REMOVED (Issue #21 resolution 2025-12-02)

#### From RANKING (`/ranking?album={id}`)
- **→ Home**: Click "Home" in TopNav
- **→ Albums**: Click "Albums" in TopNav
- **→ Playlists**: Click "Playlists" in TopNav
- **Album Dropdown**: Select different album
- **Browser Back**: Returns to previous view
- **F5 Refresh**: Reload current page with same album

### Navigation Patterns to Test

#### Pattern 1: Linear Flow (Happy Path)
```
Home → Albums → Ranking → Playlists → Save
```

#### Pattern 2: Back-and-Forth
```
Albums ↔ Ranking ↔ Albums ↔ Playlists
```

#### Pattern 3: Series Switching
```
Home → Albums (Series A) → Home → Albums (Series B)
```

#### Pattern 4: Deep Link
```
Direct URL: /ranking?album=xyz (no prior context)
```

#### Pattern 5: Browser Controls
```
Home → Albums → [Browser Back] → Home
Albums → Ranking → [F5] → Ranking (same album)
```

---

## 1.2 User Interaction Flows

### Flow 1: Create New Series
```
1. User lands on Home
2. Enters album queries in textarea
3. Enters series name
4. Clicks "Load Albums"
5. → Redirects to /albums
6. Albums load progressively
7. Loading indicator shows progress
8. Albums display in grid
```

### Flow 2: View Album Rankings
```
1. User on Albums view (albums loaded)
2. Clicks album card
3. → Navigates to /ranking?album={id}
4. Ranking view loads
5. Shows tracks sorted by acclaim rank (Summary tab default)
6. Shows tracks in original album order (second column or tab)
7. User can switch tabs:
   - Summary: Ranked track list
   - Sources: Provider attribution (BestEver, Gemini)
   - Logs: Debug trace/telemetry
```

### Flow 3: Generate Playlists
```
1. User on Playlists view
2. Clicks "Generate Playlists"
3. System generates P1, P2, DeepCuts
4. Playlists display in columns
5. Durations calculated and shown
6. User can drag-and-drop tracks
```

### Flow 4: Drag-and-Drop Reordering
```
1. User grabs track in P1 playlist
2. Drags to P2 playlist
3. Drop indicator shows where track will land
4. Track moves to new playlist
5. P1 duration recalculates (decreases)
6. P2 duration recalculates (increases)
7. Status changes to "Drag Applied"
```

### Flow 5: Save Playlists
```
1. User made drag changes
2. Status shows "Drag Applied" (unsaved)
3. Clicks "Save Changes"
4. POST to Firestore
5. Snapshot created in history
6. Status changes to "Synchronized"
7. Toast notification: "Playlists saved!"
```

### Flow 6: Series Data Integrity Check
```
1. User on Playlists view with Series A loaded
2. Navigate to Home
3. Create/Select Series B
4. Navigate back to Playlists
5. Verify ONLY Series B playlists visible
6. NO Series A playlists visible (cross-contamination check)
```

**Note**: Series dropdown was removed (Issue #21 resolution). Series switching now requires navigating back to Home → Albums workflow.

### Flow 7: View Mode Toggle
```
1. User on Albums view (Grid mode)
2. Clicks view toggle button
3. View changes to List mode
4. Albums re-render in list format
5. Track list visible in expanded view
6. Preference persists to localStorage
7. F5 refresh → List mode still active
```

### Flow 8: Filter Albums
```
1. User on Albums view
2. Types artist name in search box
3. Albums filter in real-time (debounced)
4. Only matching albums visible
5. Changes dropdown filter (Year: 1970s)
6. Filter combines with search
7. Empty state if no matches
```

---

# Part 2: Functionality Mapping

## 2.1 Functional Requirements by View

### HOME VIEW

#### Inputs
- **Textarea**: Album queries (one per line)
- **Text Input**: Series name
  
#### Actions
- **Button**: "Load Albums" (Primary CTA)
- **Click**: Recent series card → Resume
- **Navigation**: TopNav links

#### Validations
- Series name: Min 3 characters
- Album queries: At least 1 line
- Format validation: "Artist - Album"

#### Data Operations
- **Create**: New series in Firestore
- **Read**: Recent series from Firestore
- **Update**: Series timestamp on resume

---

### SERIES LIST VIEW (`/series`)

#### Display Elements
- **List**: All created series
- **Columns**: Name, Album Count, Created Date, Actions

#### Actions
- **Click Row/Open**: Navigate to `/albums` for that series
- **Click Edit**: Rename series
- **Click Delete**: Delete series (Safe Delete)

#### Data Operations
- **Read**: Fetch all series from Firestore/localStorage
- **Update**: Rename series
- **Delete**: Remove series document (but KEEP inventory albums)

### ALBUMS VIEW

#### Display Modes
1. **Compact Grid** (default)
   - Album cards (4 columns)
   - Cover image, title, artist, year, badges
   
2. **Expanded List**
   - Album cards (1 column)
   - Includes track list
   - Shows both rankings:
     * **By Acclaim** (tracksByAcclaim)
     * **Original Order** (tracksOriginalOrder)

#### Inputs
- **Search**: Filter by artist/album/year
- **Dropdowns**: Artist filter, Year filter, Status filter
- **Toggle**: "Has BestEver Data"
- **Button**: View mode toggle (Grid ↔ List)

#### Actions
- **Click album card**: Navigate to Ranking
- **Click 🗑**: Delete album (with confirmation)
- **Click 🔄**: Reprocess album ranking
- **Click 🔗**: Open BestEverAlbums external link
- **View Toggle**: Switch between Grid/List

#### Data to Validate
- ✅ Album count matches query count
- ✅ Artist names correct
- ✅ Album titles correct
- ✅ Years correct
- ✅ BestEver badges appear when data exists
- ✅ Status badges (Complete/Pending/Error)
- ✅ Track counts correct
- ✅ **Two different orderings** displayed:
  * Ranked by acclaim (column 1)
  * Original album order (column 2)

#### Data Operations
- **Read**: Albums from AlbumsStore
- **Delete**: Remove album from store + Firestore
- **Update**: Reprocess album (API call + store update)

---

### RANKING VIEW

#### Display Elements
- **Album Dropdown**: Select which album to view
- **Tabs**: Summary | Sources | Logs
- **Summary Tab** - Dual Track Lists:
  * **By Acclaim** (Column 1): Tracks sorted by rating (acclaimRank)
    - Rank position (1, 2, 3...)
    - Track title
    - Rating (0-100)
    - Provider badges
  * **Original Order** (Column 2): Tracks in album's original order
    - Position in album tracklist
    - Track title
    - Same tracks, different order
- **Sources Tab**: Provider attribution table (BestEverAlbums, Gemini AI)
- **Logs Tab**: Debug trace, telemetry data (JSON formatted)

#### Data to Validate
- ✅ **Acclaim Ranking** (Column 1):
  * Tracks sorted by acclaim rank (1 = highest rating)
  * Rating values match API response
  * Provider attribution correct (BestEver, Gemini, etc.)
  * Top 3 tracks have visual distinction (gold/silver/bronze)
- ✅ **Original Order** (Column 2):
  * Tracks in original album sequence
  * Same tracks as acclaim column (just different order)
  * Positions match album's intended tracklist
- ✅ **Tabs Functionality**:
  * Summary tab displays by default
  * Sources tab shows provider breakdown
  * Logs tab shows debug telemetry
- ✅ Progress indicator: "X/Y tracks ranked"
- ✅ Switching albums updates display correctly

#### Actions
- **Dropdown**: Select different album
- **Tab Click**: Switch between Summary/Sources/Logs
- **Button**: "Update Rankings" (reprocess)

#### Data Operations
- **Read**: Rankings from album.tracksByAcclaim
- **Update**: Reprocess album ranking (API call)

---

### PLAYLISTS VIEW

#### Display Elements
- **Series Selector**: Dropdown to switch series
- **Playlist Columns**: P1, P2, DeepCuts 1, DeepCuts 2...
- **Duration Display**: "42:30 / 75:00" per playlist
- **Status Badge**: Synchronized | Drag Applied | Conflicts
- **Track Items**:
  * Drag handle (⋮⋮)
  * Position number
  * Track title
  * Artist + Duration
  * Album badge

#### Critical Data Validations
##### Duration Calculations
- ✅ **Initial Durations Correct**:
  * Sum of all track durations in playlist
  * Format: MM:SS
  
- ✅ **Duration Recalculation on Drag**:
  * Source playlist: Duration DECREASES by dragged track duration
  * Target playlist: Duration INCREASES by dragged track duration
  * Both update in real-time

##### Playlist Generation Rules
- ✅ **P1 Playlist**: Top 1 track from each album (by acclaim rank)
- ✅ **P2 Playlist**: Top 2 tracks from each album
- ✅ **DeepCuts**: Remaining tracks distributed evenly
- ✅ **Max Duration**: No playlist exceeds configured max (default 75 min)

##### Track Data Integrity
- ✅ Track title correct
- ✅ Artist name correct (not missing!)
- ✅ Album name in badge correct
- ✅ Duration format: MM:SS
- ✅ Track IDs unique (no duplicates)

##### Series Data Integrity (Issue #21 - Feature Removed)
- ✅ **When loading different series** (via Home → Albums workflow):
  * NO Series A playlists visible in Series B context
  * NO cross-contamination of tracks
  * Only current series playlists/tracks shown
  * Duration counters match current series
  * Status badge corresponds to current series

**Note**: Series selector dropdown removed (Issue #21 resolution 2025-12-02). Switching now requires navigation: Playlists → Home → Select New Series → Albums → Playlists.

#### Actions
- **Click**: "Generate Playlists"
- **Drag-and-Drop**: Track between playlists
- **Click**: "Save Changes"
- **Click**: "Revert to Previous"
- **Dropdown**: Switch series
- **Icon Click**: Version history modal

#### Drag-and-Drop Behavior
1. **Within Same Playlist**: Reorder track position
2. **To Different Playlist**: Move track
3. **Visual Feedback**:
   - Dashed drop indicator
   - Dragged item transparency
   - Drop zones highlight

#### Data Operations
- **Create**: Generate playlists from albums
- **Update**: Modify playlist track order
- **Update**: Move track between playlists
- **Create**: Snapshot in Firestore history
- **Read**: Version history from Firestore

---

## 2.2 Edge Cases and Error Scenarios

### Data Edge Cases
- **Empty album list**: No track rankings available
- **Missing BestEver data**: Fallback to Gemini only
- **API timeout**: Show error, allow retry
- **Duplicate album queries**: Handle gracefully
- **Invalid album query**: "XYZ - ABC" (non-existent)

### UI Edge Cases
- **Very long album title**: Text truncation
- **Very long track title**: Text truncation
- **Album with 50+ tracks**: Scrollable list
- **Series with 100+ albums**: Performance test
- **Playlist exceeds max duration**: Visual indicator

### Navigation Edge Cases
- **Direct URL to non-existent album**: `/ranking?album=fake-id`
- **Direct URL without series loaded**: `/albums` (no active series)
- **Browser back from external link**: Return to correct state
- **Double-click navigation**: Prevent duplicate requests

---

# Part 3: User Stories

## Epic 1: Series Management

### US-001: Create New Playlist Series
**As a** music curator  
**I want** to create a new playlist series by entering a list of albums  
**So that** I can organize related albums into cohesive collections

**Priority**: 🔴 Critical  
**Estimate**: 5 points

---

### US-002: Resume Existing Series
**As a** returning user  
**I want** to see my recently created series on the home screen  
**So that** I can quickly resume where I left off

**Priority**: 🟡 High  
**Estimate**: 3 points

---

## Epic 2: Album Library

### US-003: View Loaded Albums in Grid
**As a** user  
**I want** to see all loaded albums in a visual grid layout  
**So that** I can browse my collection easily

**Priority**: 🔴 Critical  
**Estimate**: 3 points

---

### US-004: Toggle Between Grid and List Views
**As a** user  
**I want** to switch between compact grid and expanded list views  
**So that** I can see track details without navigating away

**Priority**: 🟡 High  
**Estimate**: 5 points

---

### US-005: See Both Ranked and Original Track Orders
**As a** music analyst  
**I want** to see tracks in both acclaim ranking order AND original album order  
**So that** I can compare algorithmic rankings against artistic intent

**Priority**: 🟡 High  
**Estimate**: 3 points

---

### US-006: Filter Albums by Search Criteria
**As a** user with many albums  
**I want** to filter albums by artist, year, or status  
**So that** I can quickly find specific albums

**Priority**: 🟢 Medium  
**Estimate**: 5 points

---

## Epic 3: Ranking Analysis

### US-007: View Album Track Rankings
**As a** user  
**I want** to see detailed rankings for a specific album  
**So that** I can understand which tracks are most acclaimed

**Priority**: 🔴 Critical  
**Estimate**: 5 points

---

### US-008: See Ranking Data Sources
**As a** data-conscious user  
**I want** to see which providers contributed to each track's ranking  
**So that** I can trust the accuracy of the rankings

**Priority**: 🟢 Medium  
**Estimate**: 3 points

---

### US-009: Switch Between Albums in Ranking View
**As a** user  
**I want** to use a dropdown to switch between albums without leaving the ranking view  
**So that** I can quickly compare rankings across albums

**Priority**: 🟡 High  
**Estimate**: 3 points

---

## Epic 4: Playlist Generation

### US-010: Generate Balanced Playlists
**As a** user  
**I want** to automatically generate P1, P2, and DeepCuts playlists from selected albums  
**So that** I get balanced playlists based on track acclaim

**Priority**: 🔴 Critical  
**Estimate**: 8 points

---

### US-011: See Accurate Playlist Durations
**As a** user  
**I want** to see the total duration of each playlist  
**So that** I know if it fits my target length

**Priority**: 🔴 Critical  
**Estimate**: 3 points

---

### US-012: Reorder Tracks via Drag-and-Drop
**As a** curator  
**I want** to drag tracks between playlists and reorder them  
**So that** I can manually curate the final playlist

**Priority**: 🟡 High  
**Estimate**: 8 points

---

### US-013: See Duration Update on Drag
**As a** user  
**I want** playlist durations to update immediately when I drag tracks  
**So that** I can see the impact of my changes in real-time

**Priority**: 🟡 High  
**Estimate**: 3 points

---

### US-014: ~~Switch Between Playlist Series~~ (REMOVED)
**Status**: ❌ **FEATURE REMOVED** (Issue #21 Resolution 2025-12-02)

**Original Requirement**: Switch series using dropdown in PlaylistsView  
**Resolution**: Dropdown removed after 4 failed debugging attempts  
**New Workflow**: Navigate via Home → Albums → Playlists for series switching

**Replacement**: See US-017 (Verify Series Data Integrity)

---

### US-015: Save Playlist Changes
**As a** user  
**I want** to save my playlist modifications to Firestore  
**So that** my changes persist across sessions

**Priority**: 🔴 Critical  
**Estimate**: 5 points

---

### US-016: See Sync Status
**As a** user  
**I want** to see if my playlist changes are saved or pending  
**So that** I know if I need to save before leaving

**Priority**: 🟡 High  
**Estimate**: 2 points

---

## Epic 5: Data Integrity

### US-017: Verify Series Data Integrity (No Cross-Contamination)
**As a** QA engineer  
**I want** to verify that playlists/albums from one series don't appear in another series  
**So that** I can ensure no data cross-contamination (Issue #21)

**Priority**: 🔴 Critical  
**Estimate**: 5 points

---

### US-017b: Verify Album Data Correspondence
**As a** QA engineer  
**I want** to verify that displayed albums match the input queries  
**So that** I can ensure data integrity

**Priority**: 🔴 Critical  
**Estimate**: 3 points

---

### US-018: Verify Track Artist/Album Fields
**As a** user  
**I want** to see artist and album names on every track in playlists  
**So that** I know the context of each track

**Priority**: 🔴 Critical (Known bug!)  
**Estimate**: 3 points

---

## Epic 9: Series Management (Sprint 5)

### US-033: View Series List
**As a** curator
**I want** to see a list of all my playlist series
**So that** I can manage my collections

**Priority**: 🟡 High
**Estimate**: 3 points

---

### US-034: Rename Series
**As a** curator
**I want** to rename an existing series
**So that** I can correct typos or update names

**Priority**: 🟢 Medium
**Estimate**: 2 points

---

### US-035: Delete Series (Safe Delete)
**As a** curator
**I want** to delete a series WITHOUT deleting its albums
**So that** I can remove the container but keep the inventory data

**Priority**: 🔴 Critical
**Estimate**: 5 points

---

---

# Part 4: Acceptance Criteria

## AC-001: Create New Series (US-001)

**Given** I am on the Home view  
**When** I enter valid album queries and a series name  
**And** I click "Load Albums"  
**Then** the system should:
- ✅ Create a new series in Firestore
- ✅ Navigate to `/albums`
- ✅ Load albums progressively with loading indicators
- ✅ Display all loaded albums in grid view
- ✅ Album count matches number of queries entered

---

## AC-002: Resume Series (US-002)

**Given** I have previously created series  
**When** I navigate to Home  
**Then** I should see:
- ✅ List of recent series (max 5)
- ✅ Series name, album count, last updated timestamp
- ✅ "Continue" button on each series card

**When** I click "Continue" on a series  
**Then**:
- ✅ System sets that series as active
- ✅ Navigates to `/albums`
- ✅ Albums from THAT series load (not a different series)

---

## AC-003: View Albums in Grid (US-003)

**Given** albums have been loaded for a series  
**When** I navigate to `/albums`  
**Then** I should see:
- ✅ Album cards in 4-column grid (desktop)
- ✅ Each card shows: cover, title, artist, year, badges
- ✅ BestEver badge ONLY if `bestEverAlbumId` exists
- ✅ Status badge (Complete/Pending/Error)
- ✅ Action buttons: 🗑 🔄 🔗

---

## AC-004: Toggle View Mode (US-004)

**Given** I am on Albums view in Grid mode  
**When** I click the view toggle button  
**Then**:
- ✅ View changes to List mode
- ✅ Albums display in single-column layout
- ✅ Track list visible for each album
- ✅ NO duplicate albums appear
- ✅ Preference saved to `localStorage` with key `albumsViewMode`

**When** I reload the page (F5)  
**Then**:
- ✅ View mode persists (still List mode)

---

## AC-005: Display Ranked vs Original Orders (US-005)

**Given** I am in Expanded List view  
**When** I view an album's tracks  
**Then** I should see TWO columns:
- ✅ **Column 1**: "By Acclaim" - Tracks sorted by `acclaimRank` (descending rating)
- ✅ **Column 2**: "Original Order" - Tracks in album's original order
- ✅ Both columns show same tracks but different orders
- ✅ Rank numbers correspond to correct ordering

---

## AC-006: Filter Albums (US-006)

**Given** I am on Albums view with 10+ albums  
**When** I type "Pink Floyd" in search box  
**Then**:
- ✅ Only albums matching "Pink Floyd" visible
- ✅ Filtering happens in real-time (debounced 300ms)
- ✅ Album count updates

**When** I select "1970s" from Year dropdown  
**Then**:
- ✅ Filter combines with search (Pink Floyd AND 1970s)
- ✅ Only albums matching BOTH criteria visible

**When** no albums match  
**Then**:
- ✅ Empty state message shown
- ✅ "Reset Filters" button visible

---

## AC-007: View Album Rankings (US-007)

**Given** I am on Albums view  
**When** I click an album card  
**Then**:
- ✅ Navigate to `/ranking?album={id}`
- ✅ Ranking view loads
- ✅ Correct album selected in dropdown
- ✅ Summary tab active by default
- ✅ **Two track lists visible**:
  * Column 1: "By Acclaim" - Sorted by rating (rank 1, 2, 3...)
  * Column 2: "Original Order" - Album's tracklist order
- ✅ Each track shows: rank/position, title, rating (Column 1 only)

**When** I click "Sources" tab  
**Then**:
- ✅ Provider attribution table displayed
- ✅ Shows: Provider name, Type, Reference URL, Track count

**When** I click "Logs" tab  
**Then**:
- ✅ Debug trace/telemetry displayed
- ✅ JSON formatted data visible

**When** track has rating >= 90  
**Then**:
- ✅ Rating badge is green-blue gradient

---

## AC-008: Switch Albums in Ranking (US-009)

**Given** I am on Ranking view for Album A  
**When** I select Album B from dropdown  
**Then**:
- ✅ URL updates to `/ranking?album={albumB_id}`
- ✅ Track list updates to show Album B tracks
- ✅ NO Album A tracks visible
- ✅ NO page reload (SPA behavior)

---

## AC-009: Generate Playlists (US-010)

**Given** I am on Playlists view with albums loaded  
**When** I click "Generate Playlists"  
**Then**:
- ✅ P1 playlist created with top 1 track from each album
- ✅ P2 playlist created with top 2 tracks from each album
- ✅ DeepCuts playlists created with remaining tracks
- ✅ Each playlist shows in separate column
- ✅ Track count correct for each playlist
- ✅ NO tracks missing
- ✅ NO duplicate tracks

**Playlist Generation Rules Verified**:
- ✅ P1: First track selection based on `acclaimRank === 1`
- ✅ P2: Tracks with `acclaimRank <= 2`
- ✅ DeepCuts: Tracks with `acclaimRank > 2`, distributed evenly

---

---

## AC-026: View Series List (US-033)

**Given** I have created multiple series
**When** I navigate to `/series`
**Then**:
- ✅ List of all series displayed
- ✅ Columns: Name, Album Count, Created Date, Actions
- ✅ Sorted by most recent

---

## AC-027: Rename Series (US-034)

**Given** I am on Series List view
**When** I click "Edit" on a series
**And** I enter a new name and save
**Then**:
- ✅ Name updates in the list
- ✅ Firestore document updated
- ✅ Toast notification shown

---

## AC-028: Delete Series - Safe Delete (US-035)

**Given** I have a series with 5 albums
**When** I delete the series
**Then**:
- ✅ Series removed from list
- ✅ Series document deleted from Firestore
- ✅ **CRITICAL**: The 5 albums remain in `/inventory` (not deleted)

---

---

## AC-026: View Series List (US-033)

**Given** I have created multiple series
**When** I navigate to `/series`
**Then**:
- ✅ List of all series displayed
- ✅ Columns: Name, Album Count, Created Date, Actions
- ✅ Sorted by most recent

---

## AC-027: Rename Series (US-034)

**Given** I am on Series List view
**When** I click "Edit" on a series
**And** I enter a new name and save
**Then**:
- ✅ Name updates in the list
- ✅ Firestore document updated
- ✅ Toast notification shown

---

## AC-028: Delete Series - Safe Delete (US-035)

**Given** I have a series with 5 albums
**When** I delete the series
**Then**:
- ✅ Series removed from list
- ✅ Series document deleted from Firestore
- ✅ **CRITICAL**: The 5 albums remain in `/inventory` (not deleted)

---

## AC-010: Accurate Playlist Durations (US-011)

**Given** playlists have been generated  
**When** I view a playlist column  
**Then**:
- ✅ Duration shown in header (e.g., "42:30 / 75:00")
- ✅ Duration is SUM of all track durations in that playlist
- ✅ Format is MM:SS or HH:MM:SS if > 60 min
- ✅ Calculation is ACCURATE (verified by manual sum)

**Example Verification**:
```
P1 Playlist:
Track 1: 6:23
Track 2: 4:15
Track 3: 5:42
Expected Total: 16:20 ✅
Displayed Total: 16:20 ✅
```

---

## AC-011: Drag-and-Drop Between Playlists (US-012)

**Given** playlists are displayed  
**When** I drag Track X from P1 to P2  
**Then**:
- ✅ Dashed drop indicator shows where track will land
- ✅ On drop, Track X moves to P2
- ✅ Track X removed from P1
- ✅ P1 track count decreases by 1
- ✅ P2 track count increases by 1

---

## AC-012: Duration Recalculation on Drag (US-013)

**Given** P1 has duration 42:30 and P2 has duration 38:00  
**When** I drag a 6:23 track from P1 to P2  
**Then**:
- ✅ P1 duration updates to 36:07 (42:30 - 6:23)
- ✅ P2 duration updates to 44:23 (38:00 + 6:23)
- ✅ Both durations update IMMEDIATELY (no delay)
- ✅ Displayed durations MATCH manual calculation

**Math Verification**:
```
Before:
  P1: 42:30 (2550 seconds)
  P2: 38:00 (2280 seconds)

Action: Move 6:23 track (383 seconds)

After:
  P1: 42:30 - 6:23 = 36:07 (2167 seconds) ✅
  P2: 38:00 + 6:23 = 44:23 (2663 seconds) ✅
```

---

## AC-013: ~~Switch Playlist Series (US-014)~~ REMOVED

**Status**: ⚠️ **TEST CASE DEPRECATED** (Issue #21 Resolution 2025-12-02)

**Original AC**:
~~Given I am viewing playlists for Series A  
When I select Series B from series dropdown  
Then all Series A playlists cleared, Series B playlists load~~

**Replacement AC**: See AC-017 (Series Data Integrity via Navigation)

---

## AC-016b: Series Data Integrity via Navigation (US-017)

**Given** I have Series A with playlists generated  
**When** I navigate: Playlists → Home → Create/Select Series B → Albums → Playlists  
**Then**:
- ✅ NO Series A playlists visible
- ✅ NO Series A tracks in any playlist
- ✅ Only Series B playlists/tracks displayed
- ✅ Duration counters correspond to Series B
- ✅ Status badge corresponds to Series B

**Verification Method** (Cross-Contamination Test):
1. Create Series A: ["Pink Floyd - The Wall"]
2. Generate playlists → Note track "Comfortably Numb" in P1
3. Navigate to Home
4. Create Series B: ["Radiohead - OK Computer"]
5. Navigate to Albums (wait for load)
6. Navigate to Playlists
7. **MUST NOT see "Comfortably Numb"** ✅
8. **MUST ONLY see Radiohead tracks** ✅
9. **NO Pink Floyd albums in any dropdown/display** ✅

---

**Given** I have made drag-and-drop changes  
**When** I click "Save Changes"  
**Then**:
- ✅ POST request to Firestore
- ✅ Current playlist state saved
- ✅ Snapshot created in `series/{id}/history/{timestamp}`
- ✅ Status badge changes to "Synchronized"
- ✅ Toast notification: "Playlists saved successfully!"

---

## AC-015: Sync Status Indicator (US-016)

**Given** playlists are freshly generated  
**Then**:
- ✅ Status badge shows "Synchronized" (green)

**When** I drag a track  
**Then**:
- ✅ Status badge changes to "Drag Applied" (blue)

**When** I click "Save Changes"  
**Then**:
- ✅ Status badge changes back to "Synchronized" (green)

---

## AC-016: Album Data Correspondence (US-017)

**Given** I entered queries: ["Led Zeppelin - IV", "Pink Floyd - The Wall"]  
**When** albums load in Albums view  
**Then**:
- ✅ Exactly 2 albums displayed
- ✅ First album: Artist = "Led Zeppelin", Title = "IV" (or similar)
- ✅ Second album: Artist = "Pink Floyd", Title = "The Wall"
- ✅ NO other albums present
- ✅ Album IDs match API response

---

## AC-017: Track Artist/Album Fields (US-018) 🚨 CRITICAL

**Given** playlists have been generated  
**When** I view a track in any playlist  
**Then**:
- ✅ Track title is NOT empty
- ✅ Artist name is NOT empty or "undefined"
- ✅ Album name badge is NOT empty or "undefined"
- ✅ All three fields populated correctly

**Example**:
```
Track Display:
  1. Comfortably Numb
     Pink Floyd • 6:23
     [The Wall]

Verification:
  ✅ Title: "Comfortably Numb"
  ✅ Artist: "Pink Floyd" (NOT missing!)
  ✅ Album: "The Wall" (NOT missing!)
  ✅ Duration: "6:23"
```

---

# Part 5: Test Cases

## 📝 Test Case Format

```
TC-XXX: [Test Case Title]
Priority: Critical | High | Medium | Low
Type: Functional | UI | Regression | Integration
Pre-conditions: [Required state before test]
Steps:
  1. Action
  2. Action
Expected Result:
  - Result
  - Result
Actual Result: [To be filled during execution]
Status: Pass | Fail | Blocked
```

---

## TC-001: Create New Series - Happy Path
**Priority**: 🔴 Critical  
**Type**: Functional  
**User Story**: US-001  

**Pre-conditions**:
- App running on `http://localhost:5000`
- No active series loaded
- User on Home view

**Steps**:
1. Enter in textarea:
   ```
   Pink Floyd - The Wall
   Led Zeppelin - IV
   The Beatles - Abbey Road
   ```
2. Enter series name: "Classic Rock Test"
3. Click "Load Albums" button
4. Wait for albums to load

**Expected Result**:
- ✅ Navigate to `/albums`
- ✅ Loading indicator shows "Loading albums... (1/3)"
- ✅ 3 albums display in grid
- ✅ Album 1: Pink Floyd - The Wall
- ✅ Album 2: Led Zeppelin - IV
- ✅ Album 3: The Beatles - Abbey Road
- ✅ Each album has cover, title, artist, year

**Status**: ⏳ Pending

---

## TC-002: View Toggle - Grid to List
**Priority**: 🔴 Critical  
**Type**: UI, Regression (Issue #16)  
**User Story**: US-004  

**Pre-conditions**:
- Albums loaded in grid view
- View mode toggle button visible

**Steps**:
1. Note current view mode (Grid)
2. Click view toggle button
3. Observe view change
4. Count albums before and after

**Expected Result**:
- ✅ View changes from Grid (4 columns) to List (1 column)
- ✅ Album count UNCHANGED (no duplicates)
- ✅ Track list visible for each album
- ✅ View mode persists in `localStorage` key `albumsViewMode`

**Status**: ⏳ Pending

---

## TC-003: View Toggle - Persistence After Reload
**Priority**: 🟡 High  
**Type**: Functional  
**User Story**: US-004  

**Pre-conditions**:
- Completed TC-002 (view toggled to List)
- Still on `/albums`

**Steps**:
1. Note current view mode (List)
2. Press F5 to reload page
3. Wait for page to load
4. Observe view mode

**Expected Result**:
- ✅ Page reloads
- ✅ View mode is STILL List (persisted)
- ✅ Albums display in List format
- ✅ NO revert to Grid mode

**Status**: ⏳ Pending

---

## TC-004: View Ranked vs Original Track Orders
**Priority**: 🟡 High  
**Type**: Data Validation  
**User Story**: US-005  

**Pre-conditions**:
- Albums loaded
- View toggled to Expanded List mode
- Album "Pink Floyd - The Wall" loaded

**Steps**:
1. Locate "The Wall" album in list
2. Observe track display (should show 2 columns)
3. Note tracks in "By Acclaim" column
4. Note tracks in "Original Order" column
5. Compare orderings

**Expected Result**:
- ✅ TWO track lists visible
- ✅ **By Acclaim** (Column 1):
  * Tracks sorted by rating (highest first)
  * Example: "Comfortably Numb" (#1, rating 94)
- ✅ **Original Order** (Column 2):
  * Tracks in album's original order
  * Example: "In the Flesh?" (#1 in original tracklist)
- ✅ Both lists contain SAME tracks (just different order)
- ✅ Rank numbers match ordering

**Status**: ⏳ Pending

---

## TC-005: Album Data Correspondence
**Priority**: 🔴 Critical  
**Type**: Data Validation  
**User Story**: US-017  

**Pre-conditions**:
- Series created with queries:
  ```
  Led Zeppelin - IV
  Pink Floyd - The Wall
  ```
- Albums loaded in Albums view

**Steps**:
1. Count total albums displayed
2. Note first album: Artist and Title
3. Note second album: Artist and Title
4. Verify NO other albums present

**Expected Result**:
- ✅ Total albums: 2 (exactly)
- ✅ Album 1: Artist contains "Led Zeppelin", Title contains "IV"
- ✅ Album 2: Artist contains "Pink Floyd", Title contains "Wall"
- ✅ NO third album
- ✅ NO albums from different queries

**Status**: ⏳ Pending

---

## TC-006: Navigate to Ranking View
**Priority**: 🔴 Critical  
**Type**: Navigation  
**User Story**: US-007  

**Pre-conditions**:
- Albums loaded
- At least 1 album card visible

**Steps**:
1. Click on first album card
2. Observe URL change
3. Observe Ranking view render

**Expected Result**:
- ✅ URL changes to `/ranking?album={id}`
- ✅ Ranking view loads
- ✅ Album dropdown shows correct album
- ✅ Track list displays
- ✅ Tracks sorted by rank (1, 2, 3...)
- ✅ Each track shows: rank, title, rating

**Status**: ⏳ Pending

---

## TC-007: View Ranking with Tabs and Dual Track Lists
**Priority**: 🔴 Critical  
**Type**: Functional, Data Validation  
**User Story**: US-007  

**Pre-conditions**:
- Albums loaded
- At least 1 album card visible
- Album has both acclaim rankings and original order data

**Steps**:
1. Click on first album card
2. Observe URL change to `/ranking?album={id}`
3. **Verify Summary tab (default)**:
   - Note Column 1 (By Acclaim) track order
   - Note Column 2 (Original Order) track order
   - Compare: Same tracks, different orders?
4. **Click "Sources" tab**:
   - Observe provider table
   - Note providers: BestEverAlbums, Gemini AI, etc.
5. **Click "Logs" tab**:
   - Observe JSON data
   - Check for debug trace info
6. **Return to Summary tab**:
   - Verify still shows both columns

**Expected Result**:
- ✅ URL: `/ranking?album={id}`
- ✅ **Summary Tab** (default active):
  * Column 1 "By Acclaim": Tracks sorted by rating (highest first)
  * Column 2 "Original Order": Tracks in album's tracklist order
  * Both columns show SAME tracks
  * Rank numbers correct for each ordering
- ✅ **Sources Tab**:
  * Table with Provider, Type, Reference, Tracks columns
  * At least one provider listed (BestEver or Gemini)
- ✅ **Logs Tab**:
  * JSON formatted debug data
  * Contains telemetry info
- ✅ Tabs switch correctly (no page reload)

**Status**: ⏳ Pending

---
**Priority**: 🟡 High  
**Type**: Functional  
**User Story**: US-009  

**Pre-conditions**:
- On Ranking view for Album A
- At least 2 albums in series
- Album dropdown visible

**Steps**:
1. Note current album in dropdown (Album A)
2. Note tracks displayed (Album A tracks)
3. Open album dropdown
4. Select Album B
5. Observe track list update
6. Verify NO Album A tracks visible

**Expected Result**:
- ✅ Dropdown opens
- ✅ Album B selected
- ✅ URL updates to `/ranking?album={albumB_id}`
- ✅ Track list updates to Album B tracks
- ✅ NO Album A tracks visible
- ✅ NO page reload (SPA behavior)

**Status**: ⏳ Pending

---

## TC-008: Generate Playlists - Initial Generation
**Priority**: 🔴 Critical  
**Type**: Functional  
**User Story**: US-010  

**Pre-conditions**:
- Series loaded with 3 albums
- Navigate to `/playlists`
- NO playlists generated yet

**Steps**:
1. Click "Generate Playlists" button
2. Wait for generation to complete
3. Count playlist columns
4. Verify P1 column tracks
5. Verify P2 column tracks
6. Verify DeepCuts column tracks

**Expected Result**:
- ✅ At least 3 playlist columns: P1, P2, DeepCuts 1
- ✅ **P1 Playlist**:
  * Contains top 1 track from EACH album
  * Track count = Number of albums
  * Example: 3 albums → 3 tracks in P1
- ✅ **P2 Playlist**:
  * Contains top 2 tracks from EACH album
  * Track count = Number of albums × 2
  * Example: 3 albums → 6 tracks in P2
- ✅ **DeepCuts**:
  * Contains remaining tracks
  * Distributed evenly if multiple DeepCuts playlists
- ✅ NO tracks missing
- ✅ NO duplicate tracks

**Status**: ⏳ Pending

---

## TC-009: Playlist Durations - Initial Calculation
**Priority**: 🔴 Critical  
**Type**: Data Validation  
**User Story**: US-011  

**Pre-conditions**:
- Playlists generated (completed TC-008)
- P1 playlist visible

**Steps**:
1. Note all track durations in P1:
   ```
   Track 1: 6:23
   Track 2: 4:15
   Track 3: 5:42
   ```
2. Manually calculate expected total:
   ```
   6:23 = 383 seconds
   4:15 = 255 seconds
   5:42 = 342 seconds
   Total = 980 seconds = 16:20
   ```
3. Observe displayed duration in P1 header
4. Compare displayed vs expected

**Expected Result**:
- ✅ Displayed duration format: "MM:SS" or "HH:MM:SS"
- ✅ Displayed duration MATCHES manual calculation
- ✅ Example: "16:20 / 75:00" ✅

**Status**: ⏳ Pending

---

## TC-010: Drag-and-Drop - Move Track Between Playlists
**Priority**: 🟡 High  
**Type**: Functional, UI  
**User Story**: US-012  

**Pre-conditions**:
- Playlists generated
- P1 and P2 columns visible
- At least 1 track in P1

**Steps**:
1. Note P1 track count (before): X
2. Note P2 track count (before): Y
3. Grab first track in P1 (e.g., "Comfortably Numb")
4. Drag to P2 playlist column
5. Observe drop indicator
6. Drop track
7. Count tracks in P1 (after)
8. Count tracks in P2 (after)
9. Verify track moved

**Expected Result**:
- ✅ Dashed drop indicator shows during drag
- ✅ Track moves to P2
- ✅ Track REMOVED from P1
- ✅ P1 track count: X - 1
- ✅ P2 track count: Y + 1
- ✅ Track appears in P2 at drop position

**Status**: ⏳ Pending

---

## TC-011: Duration Recalculation on Drag
**Priority**: 🔴 Critical  
**Type**: Data Validation  
**User Story**: US-013  

**Pre-conditions**:
- Completed TC-010 (track moved from P1 to P2)
- Track duration known (e.g., 6:23)

**Steps**:
1. Note P1 duration BEFORE drag: "42:30"
2. Note P2 duration BEFORE drag: "38:00"
3. Drag 6:23 track from P1 to P2
4. Note P1 duration AFTER drag
5. Note P2 duration AFTER drag
6. Manually verify math:
   ```
   P1: 42:30 - 6:23 = 36:07
   P2: 38:00 + 6:23 = 44:23
   ```

**Expected Result**:
- ✅ P1 duration DECREASES by exactly 6:23
- ✅ P1 after: "36:07" (matches manual calc)
- ✅ P2 duration INCREASES by exactly 6:23
- ✅ P2 after: "44:23" (matches manual calc)
- ✅ Update happens IMMEDIATELY (no delay)

**Status**: ⏳ Pending

---

## TC-012: ~~Switch Series - No Sticky Playlists (Issue #21)~~ DEPRECATED
**Priority**: ⚠️ **TEST DEPRECATED**  
**Type**: Regression, Data Integrity  
**User Story**: ~~US-014~~ (Feature Removed)  
**Resolution**: Issue #21 resolved by removing series dropdown (2025-12-02)

**Replacement**: See TC-012b (Series Data Integrity via Navigation)

---

## TC-012b: Series Data Integrity - No Cross-Contamination
**Priority**: 🔴 CRITICAL  
**Type**: Data Integrity, Regression (Issue #21)  
**User Story**: US-017  

**Pre-conditions**:
- No active series

**Steps**:
1. **Create Series A**:
   - Album: "Pink Floyd - The Wall"
   - Navigate to Playlists
   - Generate playlists
   - **Note**: Track "Comfortably Numb" in P1
   - Take screenshot: `series-a-playlists.png`

2. **Navigate to Home**:
   - Click "Home" in TopNav
   - Verify on HomeView

3. **Create Series B**:
   - Album: "Radiohead - OK Computer"
   - Click "Load Albums"
   - Wait for albums to load

4. **Navigate to Playlists**:
   - Click "Playlists" in TopNav or click "Generate Playlists"
   - Generate playlists for Series B

5. **Verify NO Series A Data**:
   - Search for "Comfortably Numb" in ALL playlists
   - Search for "Pink Floyd" in any text
   - Count Radiohead vs Pink Floyd tracks

**Expected Result**:
- ✅ **NO "Comfortably Numb"** track visible in any playlist
- ✅ **NO "Pink Floyd"** artist name visible
- ✅ **ONLY Radiohead** tracks visible
- ✅ **ONLY Radiohead** album in any dropdown/display
- ✅ Playlist columns show Radiohead album name badges
- ✅ Duration counters correspond to Radiohead tracks (not Pink Floyd)
- ✅ Album count shows Series B count (1 album)

**THIS IS THE CRITICAL TEST FOR ISSUE #21** 🚨
**Validates**: No cross-contamination between series when navigating via Home workflow

**Status**: ⏳ Pending

---
**Priority**: 🔴 CRITICAL  
**Type**: Regression, Data Integrity  
**User Story**: US-014  

**Pre-conditions**:
- Series A created with album: ["Pink Floyd - The Wall"]
- Playlists generated for Series A
- Track "Comfortably Numb" visible in P1

**Steps**:
1. Note track "Comfortably Numb" in P1 (Series A)
2. Navigate to Home (`/`)
3. Create Series B with album: ["Radiohead - OK Computer"]
4. Navigate to Albums, wait for load
5. Navigate to Playlists
6. Observe playlists displayed
7. Search for "Comfortably Numb" in ANY playlist
8. Verify ONLY Radiohead tracks present

**Expected Result**:
- ✅ NO "Comfortably Numb" track visible
- ✅ NO Pink Floyd tracks visible
- ✅ ONLY Radiohead tracks visible
- ✅ Playlist columns show Radiohead album name badges
- ✅ Duration counters correspond to Radiohead tracks

## TC-013: Track Artist/Album Fields Not Missing

**Status**: ⏳ Pending

---

## TC-013: Track Artist/Album Fields Not Missing
**Priority**: 🔴 CRITICAL  
**Type**: Data Validation, Regression  
**User Story**: US-018  

**Pre-conditions**:
- Playlists generated
- At least 1 track in P1

**Steps**:
1. Inspect first track in P1
2. Read displayed text:
   ```
   Track Title: [?]
   Artist • Duration: [?]
   Album Badge: [?]
   ```
3. Verify ALL fields populated

**Expected Result**:
- ✅ Track title: NOT empty, NOT "undefined"
- ✅ Artist name: NOT empty, NOT "undefined"
- ✅ Album badge: NOT empty, NOT "undefined"
- ✅ Duration: Format "MM:SS", NOT empty

**Example Valid Display**:
```
1. Comfortably Numb
   Pink Floyd • 6:23
   [The Wall]
```

**Example INVALID Display (FAIL)**:
```
1. Comfortably Numb
   undefined • 6:23      ❌ Artist missing!
   [undefined]           ❌ Album missing!
```

**Status**: ⏳ Pending

---

## TC-014: ~~Save Playlists to Firestore~~ BLOCKED
**Priority**: 🔴 Critical  
**Type**: Persistence  
**User Story**: US-015 (implied)  
**Status**: ❌ **BLOCKED - NOT IMPLEMENTED**

**Implementation Gap**:
- `PlaylistsView.js` does NOT call `PlaylistRepository.create()`
- Playlists only stored in memory via `playlistsStore`
- **Lost on page refresh!**

**Required Fix**:
```javascript
// Add to PlaylistsView.js
async handleSavePlaylists() {
  const playlistRepo = new PlaylistRepository(db, cache, userId, seriesId)
  for (const playlist of playlists) {
    await playlistRepo.create({ name: playlist.name, tracks: playlist.tracks })
  }
}
```

**Status**: ❌ Cannot test until implemented

---

## TC-015: Export Playlists to JSON
**Priority**: 🔴 Critical  
**Type**: Integration  
**User Story**: US-015  

**Pre-conditions**:
- Drag changes applied
- Status shows "Drag Applied"

**Steps**:
1. Note current status badge: "Drag Applied" (blue)
2. Click "Save Changes" button
3. Wait for operation to complete
4. Observe status badge change
5. Observe toast notification

**Expected Result**:
- ✅ POST request to Firestore
- ✅ Status badge changes to "Synchronized" (green)
- ✅ Toast notification: "Playlists saved successfully!"
- ✅ Snapshot created in Firestore `series/{id}/history/{timestamp}`

**Status**: ⏳ Pending

---

## TC-015: Sync Status Indicator Behavior
**Priority**: 🟡 High  
**Type**: UI, Functional  
**User Story**: US-016  

**Pre-conditions**:
- Playlists freshly generated (no changes)

**Steps**:
1. Observe initial status badge
2. Drag one track to different playlist
3. Observe status badge change
4. Click "Save Changes"
5. Observe status badge change

**Expected Result**:
- ✅ Initial: "Synchronized" (green) ✅
- ✅ After drag: "Drag Applied" (blue) ✅
- ✅ After save: "Synchronized" (green) ✅

**Status**: ⏳ Pending

---

## TC-016: Filter Albums - Search by Artist
**Priority**: 🟢 Medium  
**Type**: Functional  
**User Story**: US-006  

**Pre-conditions**:
- Albums view loaded
- At least 5 albums from different artists

**Steps**:
1. Type "Pink Floyd" in search box
2. Wait 300ms (debounce)
3. Count visible albums
4. Verify ONLY Pink Floyd albums visible

**Expected Result**:
- ✅ Only albums with "Pink Floyd" in artist name visible
- ✅ Other albums filtered out
- ✅ Album count badge updates
- ✅ Filtering happens in real-time (debounced)

**Status**: ⏳ Pending

---

## TC-017: Ghost Albums Regression (Issue #15)
**Priority**: 🔴 CRITICAL  
**Type**: Regression  
**Related Issue**: #15  

**Pre-conditions**:
- No active series

**Steps**:
1. Create Series A with albums: ["Led Zeppelin - IV", "Pink Floyd - The Wall"]
2. Wait for albums to load
3. Note albums: Led Zeppelin, Pink Floyd
4. Navigate to Home
5. Create Series B with albums: ["Radiohead - OK Computer", "Nirvana - Nevermind"]
6. Wait for albums to load
7. Verify ONLY Radiohead and Nirvana visible

**Expected Result**:
- ✅ Series B albums: Radiohead, Nirvana
- ✅ NO Led Zeppelin visible
- ✅ NO Pink Floyd visible
- ✅ Album count: 2 (exactly)

**THIS VERIFIES ISSUE #15 FIX** ✅

**Status**: ⏳ Pending

---

## TC-018: View Toggle No Duplication (Issue #16)
**Priority**: 🔴 CRITICAL  
**Type**: Regression  
**Related Issue**: #16  

**Pre-conditions**:
- Albums loaded in Grid view
- Exactly 3 albums visible

**Steps**:
1. Count albums: 3
2. Click view toggle 10 times rapidly
3. Wait for rendering to stabilize
4. Count albums again

**Expected Result**:
- ✅ Album count UNCHANGED: Still 3
- ✅ NO duplicate albums
- ✅ View toggles correctly each time
- ✅ All event listeners work after toggle

**THIS VERIFIES ISSUE #16 FIX** ✅

**Status**: ⏳ Pending

---

## Test Execution Summary Template

```
Total Test Cases: 18
Executed: 0
Passed: 0
Failed: 0
Blocked: 0
Pass Rate: 0%

Critical Tests: TC-001, TC-002, TC-005, TC-006, TC-008, TC-009, TC-011, TC-012, TC-013, TC-014, TC-017, TC-018
High Tests: TC-003, TC-004, TC-007, TC-010, TC-015
Medium Tests: TC-016
```

---

**END OF SPEC** 📋

**Ready for CEO Review!** 

Próximos steps após aprovação:
1. Implementar os TCs em Puppeteer
2. Executar test suite completa
3. Gerar test report
4. Iterar nos fails

