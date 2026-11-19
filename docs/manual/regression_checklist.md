# MJRP Regression Checklist (Manual)

**Status**: Active - v2.0 (Modular)
**Last Updated**: 2026-01-10

> **Usage**: Ask the agent to "Run the [TAG] checklist" or full regression to all [TAG] checklists.
> **Service Layer Check**: Verify that `[BLEND]` and `[PLAYLIST_MGR]` operations correctly trigger Store updates via their respective Services.

## 🔴 [CORE] Core Loop (The Must Pass)
- [ ] **Load App**: App loads on the local dev address without console crash (port 5000 is taken by AirPlay Receiver on macOS; see issue UAT-178).
- [ ] **Series Isolation**: Switching Series A -> B shows only B's albums.
- [ ] **Clear Cache (v4.0, F48)**: with `/albums` fully loaded, click "Clear Cache" in the footer -> "Cache Cleared!" -> the page reloads and the albums are searched again (grey blocks first, requests to Apple Music in the network tab). The Spotify connection and the view mode are still there.
- [ ] **Personal ranking read once (v4.0, F48)**: reload `/albums` within the hour -> no new read of `albumRankings` per album; save a ranking -> the card shows it after the next load.
- [ ] **Albums load (v4.0)**: with the site data cleared, `/albums` shows the first page of series within seconds; every series ends as albums, or with the notice "N albums did not load · Try again"; none disappears.
- [ ] **Leave and return (v4.0)**: going to Home mid-load and back shows the same number of series.
- [ ] **Search fields (v4.0)**: typing a whole word without clicking again works in the search of `/albums`, of `/saved-playlists` and in the artist field of the Home.
- [ ] **"&" in a name (v4.0)**: an album whose artist has "&" loads (series "Robert Plant 00-10s": "Jimmy Page & Robert Plant - No Quarter"), and no screen shows `&amp;`.
- [ ] **All series (v4.0)**: the count under the grid says the total of series of the account (no cut at 20).
- [ ] **Paging (v4.0)**: series per page 10 to 100; numbered pages and the growing list both work.
- [ ] **Search (v4.0)**: typing a whole word in the search field needs no second click; it finds series of other pages.
- [ ] **Persistence**: Reloading preserves the active Series, View Mode, and Ranking order (Verified Issue #148: Rankings survive refresh).
- [ ] **Playlists Persistence**: Navigating to /playlists and back to /albums preserves generated playlists state (Issue #149 fix).

## 🟡 Modular Checklists

### [HOME] Entry & Search
- [ ] **Scan Artist**: "Scan Artist" finds results (e.g., "Pink Floyd").
- [ ] **Staging**: Clicking album adds to stack with animation.
- [ ] **Initialize**: "Initialize Load Sequence" creates series -> navigates to `/albums`.
- [ ] **Bulk Paste**: Validates "Artist - Album" format correctly.

### [SERIES] Albums & Ranking
- [ ] **Save a ranking (v4.0)**: rank the tracks of an album and save -> the modal closes, "Rankings saved" shows, and that album shows the ranking; no other album reloads.
- [ ] **My Ranking filter (v4.0)**: with only the first page loaded, Source = "My Ranking" brings the series of other pages that have a ranked album.
- [ ] **Source filter notice (v4.0)**: Source = "BestEverAlbums" on an account with series never opened shows "N albums have not been checked against the sources yet…" under the count.
- [ ] **Try again (v4.0)**: on a series with "N albums did not load", "Try again" searches only those albums.
- [ ] **View Toggle**: Switch Grid ↔ List. Layout updates instantly.
- [ ] **View Modes**: Toggle Compact ↔ Expanded. Data persists and layout shifts correctly (No data loss).
    - *Verify*: Tracks load with Index, Title, Duration, and Badges (Spotify/BEA).
    - *Verify*: No "undefined" values in Track Row.
- [ ] **Edit Name**: Click Pencil -> Rename Series -> Header updates **immediately** (No double toast).
- [ ] **Delete Series**: Click Trash -> Confirm -> Redirects to `/albums` -> **Verify Series is REMOVED from list** (Stale Cache Check). **Verify NO Flash** of "No Albums" empty state.
- [ ] **Delete Album from Series**: Click Trash on Album -> Confirm -> **Verify Card Disappears** (No UI Freeze). **Verify NO Grid Reload/Flash** (#161).
- [ ] **Add Album (Surgical)**: Add album via Edit Modal -> Save -> **Verify New Card Appears INSTANTLY**. **Verify Badges (Gold/Silver) are present** (#156).
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
- [ ] **History opens fast (v5.0, F61)**: the page is on screen at once, the series come in one by one, and the whole list is there in a few seconds; going to another screen and back shows the list at once.
- [ ] **One series fails (v5.0, F61)**: with the network cut for one read, that series shows a notice with "Try again" and the others stay.
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