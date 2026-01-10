# MJRP Regression Checklist (Manual)

**Status**: Active - v2.0 (Modular)
**Last Updated**: 2026-01-10

> **Usage**: Ask the agent to "Run the [TAG] checklist".

## 🔴 [CORE] Core Loop (The Must Pass)
- [ ] **Load App**: App loads on `localhost:5000` without console crash.
- [ ] **Series Isolation**: Switching Series A -> B clears the grid and loads B's albums.
- [ ] **Persistence**: Reloading preserves the active Series, View Mode, and Ranking order.

## 🟡 Modular Checklists

### [HOME] Entry & Search
- [ ] **Scan Artist**: "Scan Artist" finds results (e.g., "Pink Floyd").
- [ ] **Staging**: Clicking album adds to stack with animation.
- [ ] **Initialize**: "Initialize Load Sequence" creates series -> navigates to `/albums`.
- [ ] **Bulk Paste**: Validates "Artist - Album" format correctly.

### [SERIES] Albums & Ranking
- [ ] **View Toggle**: Switch Grid ↔ List. Layout updates instantly.
- [ ] **Edit Name**: Click Pencil -> Rename Series -> Header updates.
- [ ] **Delete Series**: Click Trash -> Confirm -> Redirects to `/albums`.
- [ ] **Filter Logic**: Click "EPs" -> Only EPs show. Click "Owned" -> Only owned show.

### [BLEND] Blending Menu
- [ ] **Wizard Flow**: Series Selector -> Recipe Card -> Ingredients -> Generate Button unlocks sequentially.
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