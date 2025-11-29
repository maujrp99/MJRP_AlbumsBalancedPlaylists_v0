# Architectural Fix: Store State Management

## Problem
Current approach causes:
- **Ghost Albums** (data from previous series appearing)  
- **"Album Not Found"** (data missing when expected)
- **Code Duplication** (recovery logic in 3 views)

## Root Cause
```
❌ BAD: Reset on every navigation
AlbumsView.destroy() → reset store
→ PlaylistsView needs recovery
→ RankingView needs recovery  
→ Duplicated code + race conditions
```

## Proposed Solution

### Store Should Persist While Series is Active

**Reset ONLY when:**
1. **Changing Series**: User switches to a different series
2. **Explicit Refresh**: User clicks "Refresh" on an album
3. **Loading New Series**: `loadAlbumsFromQueries()` starts

**DO NOT Reset when:**
- ❌ Navigating between views (Albums → Playlists → Ranking)
- ❌ View lifecycle (constructor/destroy)

### Implementation

#### 1. AlbumsView Changes
- ✅ **DONE**: Removed `reset()` from constructor
- ✅ **DONE**: Removed `reset()` from destroy()
- ⏳ Keep `reset()` ONLY in `loadAlbumsFromQueries()` (when loading NEW series)

#### 2. PlaylistsView Changes  
- ⏳ Remove `recoverSeriesData()` method (no longer needed)
- ⏳ Remove recovery check from `mount()` (no longer needed)
- Store will already have data from AlbumsView

#### 3. RankingView Changes
- ✅ **DONE**: Removed `recoverAlbumsData()` method
- ✅ **DONE**: Removed recovery check from `mount()`
- Store will already have data from AlbumsView

### Benefits
✅ No ghost albums (data cleared only when changing series)
✅ No "Album Not Found" (data persists across navigation)  
✅ No code duplication (recovery logic removed)
✅ Simpler architecture (views don't manage data loading)

## Next Steps
1. Remove PlaylistsView recovery logic
2. Test navigation flow: Home → Albums → (click album) → Ranking
3. Test playlist generation works
4. Verify ghost albums don't return
