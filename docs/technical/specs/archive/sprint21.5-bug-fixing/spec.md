# Sprint 21.5 Bug Fixing - Specification

## SDD Phase 1: Specification

**Sprint**: 21.5 Bug Fixing  
**Status**: DRAFT - Awaiting Review  
**Date**: 2026-01-15

---

## 1. WHAT (Problem Statement)

### Strategy: Clean Re-Application
All issues below were previously fixed but reverted to ensure a **clean codebase** without residual debugging code. Fixes will be re-applied cleanly in proper order.

### Issues Summary

| Order | Issue | Problem |
|-------|-------|---------|
| 1 | #154 | Cannot delete album from series - error message appears |
| 2 | #156 | New albums/series only appear after manual page refresh |
| 2 | #158 | "No albums in library" message appears after deleting series even when other series exist |
| 3 | #155 | Application freezes when deleting a series |
| 4 | #153 | Editing a series shows both success AND failure messages simultaneously |
| 5 | #152 | No visual feedback during album loading; users see blank screen |
| 5 | #152B | **CLEANUP**: Remove all progress bar related code (tech debt) |

---

## 2. WHY (Business Value)

### User Experience Impact

| Issue | User Impact | Severity |
|-------|-------------|----------|
| #154 | User cannot manage their library (unable to delete) | CRITICAL |
| #156 | User thinks additions failed; forced to refresh manually | HIGH |
| #158 | User thinks all data was lost after innocent delete action | CRITICAL |
| #155 | User forced to close/reopen app; loses trust in stability | CRITICAL |
| #153 | User confused by contradictory feedback; loses trust in UI | MEDIUM |
| #152 | User thinks app is frozen or broken during loading | HIGH |

### Constitution Alignment

| Principle | How Issues Violate It |
|-----------|----------------------|
| **I. User-Centric Quality**: "UI must feel alive. No dead clicks or silent failures." | Issues #153, #152 create silent failures and dead feedback |
| **I. Visuals**: "Use micro-animations and responsive design" | Issue #152 lacks loading feedback |
| **I. Interaction**: "No dead clicks" | Issues #154, #155 result in errors or freezes on user actions |
| **III. Documentation First**: "Every bug fix requires an entry in DEBUG_LOG.md" | All issues documented in DEBUG_LOG |

---

## 3. SUCCESS CRITERIA

### Issue #154: Album Deletion
| Test | Expected Result |
|------|-----------------|
| Delete an album from a series | Album removed successfully, no error message |
| Verify album is gone | Album no longer appears in series view |

### Issue #156: New Items Visibility
| Test | Expected Result |
|------|-----------------|
| Create a new series | Series appears immediately without refresh |
| Add album to series | Album appears immediately without refresh |

### Issue #158: Deletion Empty State
| Test | Expected Result |
|------|-----------------|
| Delete one series when multiple exist | Remaining series still visible |
| No false "empty library" message | Other series data intact |

### Issue #155: Deletion Freeze
| Test | Expected Result |
|------|-----------------|
| Delete a series | App remains responsive |
| Navigation continues | User redirected to appropriate view |

### Issue #153: Edit Double Toast
| Test | Expected Result |
|------|-----------------|
| Edit series name | Single success toast appears |
| No error message | Only success feedback shown |

### Issue #152: Ghost Skeletons
| Test | Expected Result |
|------|-----------------|
| Navigate to All Series | Gray pulsing skeleton placeholders appear |
| Wait for load | Skeletons smoothly transition to real albums |
| Apply Year filter | Only series with matching albums appear |
| Apply Artist filter | Only series with matching albums appear |
| Network throttle (Slow 3G) | Skeletons persist visibly during load |

### Issue #152B: Progress Bar Cleanup (Series Context Only)
| Test | Expected Result |
|------|-----------------|
| No progress bar UI in Series views | Skeleton replaces progress bar as loading feedback |
| No console errors | Progress bar references removed cleanly from Series context |
| Reusable components preserved | `InlineProgress.js` and `GlobalProgress.js` remain available for future use |

**Cleanup Strategy:**
- **DELETE**: `SeriesProgressBar.js` (wrapper specific to Series)
- **REMOVE INTEGRATIONS**: Progress bar calls in `SeriesView`, `SeriesController`, `SeriesViewUpdater`
- **PRESERVE**: `InlineProgress.js`, `GlobalProgress.js` (reusable for BlendingView, Export, etc.)

---

## 4. OUT OF SCOPE

- Progress bar enhancements (remove existing progress bar code as cleanup)
- New features or UI redesigns
- Performance optimizations beyond loading feedback
- Backend/API changes

---

## 5. DEPENDENCIES

| Issue | Depends On |
|-------|------------|
| #155 | #156, #158 (cache fixes must be in place) |
| #152 | #155 (deletion flow must work for skeleton testing) |

---

## 6. APPROVAL

- [ ] User Review
- [ ] Approved to proceed to PLAN phase

---

**Gate**: Cannot proceed to `plan.md` until this specification is APPROVED.
