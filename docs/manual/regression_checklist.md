# MJRP Regression Checklist (Manual)

**Status**: Active - v2.0 (Modular)
**Last Updated**: 2026-01-10

> **Usage**: Ask the agent to "Run the [TAG] checklist" or full regression to all [TAG] checklists.
> **Service Layer Check**: Verify that `[BLEND]` and `[PLAYLIST_MGR]` operations correctly trigger Store updates via their respective Services.

## 🔴 [CORE] Core Loop (The Must Pass)
- [ ] **Load App**: App loads on `localhost:5000` without console crash.
- [ ] **Series Isolation**: Switching Series A -> B clears the grid and loads B's albums.
- [ ] **Persistence**: Reloading preserves the active Series, View Mode, and Ranking order (Verified Issue #148: Rankings survive refresh).
- [ ] **Playlists Persistence**: Navigating to /playlists and back to /albums preserves generated playlists state (Issue #149 fix).

## 🟡 Modular Checklists

### [HOME] Entry & Search
- [ ] **Scan Artist**: "Scan Artist" finds results (e.g., "Pink Floyd").
- [ ] **Staging**: Clicking album adds to stack with animation.
- [ ] **Initialize**: "Initialize Load Sequence" creates series -> navigates to `/albums`.
- [ ] **Bulk Paste**: Validates "Artist - Album" format correctly.

### [SERIES] Albums & Ranking
- [ ] **View Toggle**: Switch Grid ↔ List. Layout updates instantly.
- [ ] **View Modes**: Toggle Compact ↔ Expanded. Data persists and layout shifts correctly (No data loss).
    - *Verify*: Tracks load with Index, Title, Duration, and Badges (Spotify/BEA).
    - *Verify*: No "undefined" values in Track Row.
- [ ] **Edit Name**: Click Pencil -> Rename Series -> Header updates **immediately** (No double toast).
- [ ] **Delete Series**: Click Trash -> Confirm -> Redirects to `/albums` -> **Verify Series is REMOVED from list** (Stale Cache Check). **Verify NO Flash** of "No Albums" empty state.
- [ ] **Delete Album from Series**: Click Trash on Album -> Confirm -> **Verify Card Disappears** (No UI Freeze). **Verify NO Grid Reload/Flash**.
- [ ] **Filter Logic**: Click "EPs" -> Only EPs show. Click "Owned" -> Only owned show.
- [ ] **Sorting (Sprint 21)**: Click Sort -> "Name (A-Z)" sorts alpha. "Album Count" sorts by size. "Recently Added" sorts by date.
- [ ] **Rank Tracks (Sprint 20)**: Click "Rank It" -> Drag & Drop -> Save. Verify "Ranked" badge and table update.

### [BLEND] Blending Menu
- [ ] **Wizard Flow**: Series Selector -> Recipe Card -> Ingredients -> Generate Button unlocks sequentially.
- [ ] **My Own Ranking (Sprint 20)**: Select "My Own Ranking" recipe -> Generate. Verify tracks match user order.
- [ ] **Generation**: Clicking "Blend It!" creates valid playlists.
- [ ] **Entity Switch**: Changing "Albums" to "Tracks" updates the UI context.

### [PLAYLIST_MGR] Playlist Manager (Editor)
- [ ] **Delete Playlist**: Click "X" on card -> Playlist removed.
- [ ] **Remove Track**: Click "X" on track -> Track removed from list.
- [ ] **Regenerate**: Open Panel -> Change Duration -> Regenerate -> Updates existing playlist.
- [ ] **Drag & Drop**: Moving track #1 to #5 works visually and persists (in memory).

### [HISTORY] Playlist Series Management
- [ ] **Save Batch**: "Save to History" works -> Toast "Saved".
- [ ] **View History**: `/saved-playlists` shows the new batch.
- [ ] **Expand Batch**: Clicking Batch Header toggles visibility.
- [ ] **Edit Batch**: Click "Edit" -> Redirects to `/playlists` with data loaded.
- [ ] **Delete Batch**: Click Trash -> Batch removed.

### [INVENTORY] Collection Management
- [ ] **Status Change**: Move Album from "Wishlist" to "Owned". Count updates.
- [ ] **Calculations**: "Total Value" updates when item added/removed.
- [ ] **Currency**: Switch USD -> BRL. Prices reformat (~5x multiplier).
- [ ] **Delete Album**: Permanently remove from collection.

### [EXPORT] & [INTEGRATION]
- [ ] **JSON Export**: Click "Export JSON" -> Download starts.
- [ ] **Spotify Auth**: Click "Connect" -> Spotify Login Page appears.
- [ ] **Spotify Export**: Click "Export to Spotify" -> Success Modal -> Link works.

## 🟢 Automated Suite
```bash
npm test              # Unit Tests
npm run test:e2e      # Browser Flows
```
Use the agent browser for final confimation.