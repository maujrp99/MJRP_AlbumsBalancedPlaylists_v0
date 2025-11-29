# Impact Analysis: Store Persistence vs Historical Issues

## Proposed Change
**Store persists data while series is active. Reset ONLY when changing series or explicit refresh.**

---

## Historical Issues Impact Assessment

### ✅ ISSUE 1: Navigation Regression ("Generate Playlists" Button)
- **Symptom**: Button redirected to Home instead of Playlists
- **Cause**: Spaces in URL string
- **Impact of Proposal**: **NO IMPACT** ✅
- **Reasoning**: This was a URL formatting issue, unrelated to store state

### ✅ ISSUE 2: HTML Artifacts (Merged Albums)
- **Symptom**: Literal `< div` tags appearing on screen
- **Cause**: Malformed HTML in template strings
- **Impact of Proposal**: **NO IMPACT** ✅
- **Reasoning**: This was a rendering issue, unrelated to store state

### ⚠️ ISSUE 3: State Leak ("Ghost Albums")
- **Symptom**: Albums from previous series appearing in new series
- **Cause**: Store not cleared when loading new series
- **Impact of Proposal**: **REQUIRES CAREFUL IMPLEMENTATION** ⚠️
- **Analysis**:
  - ✅ **GOOD**: Not clearing on view navigation prevents unnecessary reloads
  - ⚠️ **RISK**: Must ensure `loadAlbumsFromQueries()` does `reset()` before loading
  - ⚠️ **RISK**: Must ensure series change triggers store clear
- **Mitigation**: Keep `reset()` in `loadAlbumsFromQueries()` (already there)

### ✅ ISSUE 4: Syntax Errors (Multiple Crashes)
- **Symptom**: Various syntax errors from duplicated code blocks
- **Cause**: Incorrect manual edits, duplicated braces
- **Impact of Proposal**: **PREVENTS FUTURE OCCURRENCES** ✅
- **Reasoning**: Removing recovery logic = less code = fewer syntax errors

### 🔴 ISSUE 5: Hard Refresh Empty State (AlbumsView)
- **Symptom**: Refreshing `/albums?seriesId=X` showed "No albums"
- **Cause**: `albumsStore` was empty after hard refresh
- **Impact of Proposal**: **DOES NOT FIX** 🔴
- **Analysis**:
  - Store is in-memory only
  - Hard refresh = new browser session = empty store
  - **STILL NEEDS**: Fallback logic in AlbumsView.mount() to load from seriesStore
  - **DIFFERENCE**: This is only for hard refresh, not view navigation

### 🔴 ISSUE 6: PlaylistsView Empty State
- **Symptom**: "No albums loaded" when navigating from Albums
- **Cause**: `albumsStore.reset()` in AlbumsView.destroy()
- **Impact of Proposal**: **COMPLETELY FIXES** ✅
- **Analysis**:
  - Store now persists across navigation
  - PlaylistsView will find data in store
  - No recovery logic needed

### 🔴 ISSUE 7: Album Click Navigation ("Album Not Found")
- **Symptom**: Clicking album showed "Album Not Found" in RankingView
- **Cause**: `albumsStore.reset()` in AlbumsView.destroy()
- **Impact of Proposal**: **COMPLETELY FIXES** ✅
- **Analysis**:
  - Store now persists across navigation
  - RankingView will find data in store
  - No recovery logic needed

### 🟡 ISSUE 8: Ghost Albums RETURNED (Current)
- **Symptom**: Ghost albums reappeared after recovery logic added
- **Cause**: Multiple views calling `reset() + reload` created race conditions
- **Impact of Proposal**: **COMPLETELY FIXES** ✅
- **Analysis**:
  - Only one place resets: `loadAlbumsFromQueries()`
  - No race conditions
  - Clean separation: reset only when loading new series

---

## Summary Matrix

| Issue | Fixes? | Introduces New Risk? | Notes |
|-------|--------|---------------------|-------|
| Navigation Regression | N/A | No | Unrelated |
| HTML Artifacts | N/A | No | Unrelated |
| Ghost Albums (Original) | ⚠️ Partial | ⚠️ Yes (if not careful) | Must keep reset in loadAlbumsFromQueries |
| Syntax Errors | ✅ Prevents | No | Less code = fewer errors |
| Hard Refresh Empty | 🔴 No | No | Still needs fallback for hard refresh |
| PlaylistsView Empty | ✅ Yes | No | Store persists |
| RankingView Not Found | ✅ Yes | No | Store persists |
| Ghost Albums (Returned) | ✅ Yes | No | Removes race conditions |

---

## Key Risks & Mitigations

### 🔴 RISK 1: Ghost Albums could return if `loadAlbumsFromQueries()` doesn't reset
**Mitigation**: 
- ✅ Verify `reset()` exists in `loadAlbumsFromQueries()` (line ~820 of AlbumsView)
- ✅ Add test: Load series A, load series B, verify no albums from A appear

### 🟡 RISK 2: Hard refresh still shows empty state
**Mitigation**:
- ⚠️ Keep fallback logic ONLY in AlbumsView.mount() for hard refresh scenario
- ⚠️ Remove recovery from PlaylistsView and RankingView (they navigate from Albums)

### 🟢 BENEFIT 1: Simpler architecture
- No recovery logic in PlaylistsView
- No recovery logic in RankingView
- Data loads once in AlbumsView, persists for session

### 🟢 BENEFIT 2: Better performance
- Avoid redundant API calls when navigating between views
- Cache data benefits from albumCache

---

## Recommendation

✅ **PROCEED** with these conditions:

1. ✅ Remove PlaylistsView.recoverSeriesData() 
2. ✅ Keep AlbumsView hard refresh fallback (lines ~770-802)
3. ✅ Verify `reset()` in loadAlbumsFromQueries() (line ~820)
4. ⚠️ **TEST** thoroughly:
   - Load series A → Navigate to Playlists → Back → Ranking (no ghost albums)
   - Load series A → Load series B → Verify only B's albums appear
   - Hard refresh on /albums → Should load albums
   - Hard refresh on /playlists or /ranking → Navigate back to /albums first
