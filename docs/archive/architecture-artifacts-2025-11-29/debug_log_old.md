# Debug Log

**Last Updated**: 2025-11-29 17:20  
**Workflow**: See `.agent/workflows/debug_issue.md`

---

## Current Debugging Session

### Issue #8: Store State Management - Architectural Problem
**Status**: 🟡 In Progress (Root Cause Analysis)  
**Date**: 2025-11-29 17:00  
**Related Files**: AlbumsView.js, PlaylistsView.js, RankingView.js

#### Symptoms
- Ghost Albums **RETURNED** after adding recovery logic
- "Album Not Found" was never properly fixed
- Code duplication across 3 views (AlbumsView, PlaylistsView, RankingView)

#### Root Cause
- **Band-aid approach**: Treating symptom (empty store) instead of cause
- Each view doing `reset() + reload` creates race conditions
- Store being cleared when it shouldn't be

#### Wrong Approach (Current)
```
AlbumsView.destroy() → reset store
  → Every other view needs recovery logic
  → Duplicated code + ghost data issues
```

#### Correct Approach (Proposed)
```
Store should persist while series is active
  → Only reset when:
    1. User changes series
    2. User explicitly refreshes
    3. App closes
  → No recovery logic needed in views
```

####Action Plan
- [x] LOG this issue
- [x] REVERT RankingView changes (recovery logic)
- [ ] REVERT PlaylistsView changes (recovery logic)  
- [x] REMOVE albumsStore.reset() from AlbumsView.destroy()
- [ ] TEST that all views work without reset
- [ ] VERIFY ghost albums don't return

**See Also**: [ARCHITECTURE.md - Store State Management](../../docs/ARCHITECTURE.md#store-state-management-current)

---

## Previous Debugging Sessions

### Issue #7: Album Click Navigation - "Album Not Found"
**Status**: 🔴 Reverted (Wrong Approach)  
**Date**: 2025-11-29 16:38  
**Resolution**: Identified as symptom of Issue #8 (store management). Fix reverted in favor of architectural solution.

**See**: Issue #8 for proper fix.

---

### Issues #1-6: Various Regressions
**Status**: ✅ Resolved  
**Date**: 2025-11-28 - 2025-11-29  

Summary of resolved issues (see `debug_log.md.resolved.*` for details):
1. Navigation regression (button URL)
2. HTML artifacts (template strings)
3. Syntax errors (duplicated braces)
4. Hard refresh empty state
5. PlaylistsView empty state
6. Various UI regressions

---

## Debug Tools & Visual Elements

### Visual Debug Elements Added (AlbumsView)
**Date**: 2025-11-28  
**Purpose**: Filter debugging  
**Status**: 🟢 Active (removable)

All debug elements marked with `// DEBUG:` comments for easy removal.

#### Visual Debug Panel
- **Location**: Line ~142-170 in AlbumsView.js
- **Purpose**: Real-time filter state display
- **Marker**: `<!-- DEBUG: Visual Debug Panel START/END -->`
- **Content**:
  - Active filters display
  - Filtered albums count
  - View mode indicator
  - Search query display

#### Console Logs Added
All prefixed with `🔍 [DEBUG]` for easy filtering in DevTools:

1. **Render Method** (~line 44-50):
   - Raw albums count
   - Filtered albums count
   - Active filters state
   - View mode
   - Search query

2. **Filter Method** (~line 272-280):
   - Before/after counts for each filter step
   - Which filters are active

3. **Mount Method** (~line 340-375):
   - Filter change events with new values
   - Albums grid updates

4. **Update Method** (~line 520):
   - Grid update calls with album counts

### How to Remove Debug Code

Search pattern:
```bash
# Find all debug comments
grep -n "// DEBUG:" public/js/views/AlbumsView.js

# Find all debug console logs
grep -n "🔍 \\[DEBUG\\]" public/js/views/AlbumsView.js
```

Removal steps:
1. Remove visual debug panel (between `<!-- DEBUG: Visual Debug Panel START/END -->`)
2. Remove all `console.log` lines containing `🔍 [DEBUG]`
3. Keep original console.logs if desired

### Testing Checklist
- [x] Visual panel appears on screen
- [x] Console logs appear in DevTools
- [x] Filter changes logged correctly
- [x] Album counts accurate
- [x] View mode toggle reflected

---

## Maintenance Notes

**How to Update This Document**:
1. Active issues → Current Debugging Session
2. Resolved/reverted issues → Move to Previous with timestamp
3. Keep Previous sections for history (don't delete)
4. Link to ARCHITECTURE.md for architectural decisions
5. Link to implementation_plan.md for fixes in progress

**See**: `.agent/workflows/debug_issue.md` for systematic debugging protocol
