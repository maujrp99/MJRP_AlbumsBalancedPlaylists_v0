# Issue #152 - Ghost Skeletons & Progress Bar

## Specification Document (SDD Phase 1)

**Issue**: #152  
**Sprint**: 21.5 Bug Fixing  
**Status**: DRAFT - Awaiting Review  
**Date**: 2026-01-15

---

## 1. WHAT

### Problem Statement
During album loading in the Series View (All Series or Single Series), users see a blank screen or "No albums found" text while data is being fetched. This creates a poor user experience with no visual feedback.

### Current Behavior
1. User navigates to Albums view (All Series)
2. Albums start loading via `loadAlbumsFromQueries()`
3. **PROBLEM**: No visual feedback during loading
4. Albums appear suddenly when data arrives

### Desired Behavior
1. User navigates to Albums view
2. **IMMEDIATELY**: Ghost skeleton placeholders appear for each known series
3. Skeletons show pulsing gray boxes (series header + 6 album cards)
4. As album data arrives, skeletons are replaced with real content
5. Smooth transition from skeleton → real content

---

## 2. WHY

### User Experience
- **Perceived Performance**: Users perceive faster load times when visual feedback exists
- **Structure Preview**: Users understand the layout before data arrives
- **Confidence**: Users know the app is working, not frozen

### Technical Value
- Reduces "layout shift" when content loads
- Follows modern UX patterns (Facebook, YouTube, etc.)
- Already partially implemented in `SeriesSkeleton.js` and `AlbumSkeleton.js`

### Constitution Alignment
- **I. User-Centric Quality**: "UI must feel alive. No dead clicks or silent failures."
- **I. Visuals**: "Use micro-animations and responsive design."

---

## 3. REQUIREMENTS

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Skeleton placeholders MUST appear immediately when loading starts | HIGH |
| FR-2 | Skeletons MUST have a visible pulsing/shimmer animation | HIGH |
| FR-3 | Skeletons MUST be replaced by real content when data loads | HIGH |
| FR-4 | Skeletons MUST NOT appear for empty series after filters are applied | HIGH |

| FR-5 | Remove/clean up all existing progress bar code | HIGH |
### Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-1 | No regressions in filter functionality (Year, Artist, Source) | CRITICAL |
| NFR-2 | No breaking changes to existing CRUD operations | CRITICAL |
| NFR-3 | Solution must work for both "All Series" and "Single Series" scopes | HIGH |

---

## 4. SUCCESS CRITERIA

### Acceptance Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| AC-1 | Load "All Series" view | Gray pulsing skeletons appear for all series |
| AC-2 | Wait for albums to load | Skeletons smoothly transition to real album cards |
| AC-3 | Filter by Year (1980s) | Only series WITH matching albums appear. Empty series are HIDDEN. |
| AC-4 | Filter by Artist | Only series WITH matching albums appear. Empty series are HIDDEN. |
| AC-5 | Delete a series | *(Blocked by #155/#158)* Skeleton behavior on deletion to be tested after cache fixes |
| AC-6 | Network throttling (Slow 3G) | Skeletons persist visibly for longer period |

### Regression Tests

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| REG-1 | Apply filter → Series with 0 matches | Series header MUST NOT appear |
| REG-2 | Navigate between series | Correct series data loads |
| REG-3 | Edit series name | Name updates without crash |

---

## 5. CONSTRAINTS

### What We CANNOT Change
- The `SeriesSkeleton.js` and `AlbumSkeleton.js` components are already implemented correctly
- The `groupAlbumsBySeries()` function must continue to work for filtering

### Previous Attempt Analysis
The previous fix failed because removing `if (group.albums.length === 0) return;` broke the filter functionality. The solution must:

1. **Distinguish between**:
   - Empty because **loading** → Show skeleton
   - Empty because **filtered out** → Hide completely

2. **Key insight**: The `isLoading` state exists but was not being used effectively to make this distinction.

---

## 6. OUT OF SCOPE

The following are explicitly NOT part of this specification:
- Progress bar (remove any existing progress bar code)
- Lazy loading of off-screen series (virtual scrolling already exists)
- Loading state for individual album cards (only series-level skeletons)

---

## 7. OPEN QUESTIONS

1. Should skeletons show the series NAME during loading or just a gray placeholder header?

---

## 8. APPROVAL

- [ ] User Review
- [ ] Approved to proceed to PLAN phase

---

**Next Step**: User review and approval before creating `plan.md`
