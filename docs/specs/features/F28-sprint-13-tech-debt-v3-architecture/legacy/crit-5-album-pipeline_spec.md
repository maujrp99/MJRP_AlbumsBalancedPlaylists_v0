# Specification: CRIT-5 Album Data Pipeline Refactoring

**Status**: 📋 DRAFT - Pending Review
**Created**: 2025-12-25
**Sprint**: 13
**Priority**: 🔴 CRITICAL (Blocks Edit Flow Verification)

---

## 1. Problem Statement

### What is the Problem?

When editing saved playlists, **wrong albums appear** in the series. For example, the "Robert Plant 00-10s" series shows 9 albums instead of 7, including unrelated Led Zeppelin albums ("Physical Graffiti", "Mothership").

Additionally, the **Reconfigure panel** changes are not applied when regenerating playlists.

### Why is it a Problem?

1. **Data Corruption**: Users see albums they didn't add to their series
2. **User Confusion**: Edit flows show unexpected content
3. **Feature Blocked**: Cannot verify Sprint 13 Edit/Reconfigure functionality
4. **Trust Issue**: Users cannot rely on their curated series being accurate

### Root Cause Summary

| # | Issue | Location |
|---|-------|----------|
| 1 | Cache key (query) ≠ Album identity (actual title) | `albumCache.js`, `client.js` |
| 2 | No validation of Apple Music search results | `client.js` |
| 3 | Global store pollution across series | `albumsStore.js` |

See [album-data-pipeline-analysis.md](album-data-pipeline-analysis.md) for detailed analysis.

---

## 2. Goal

Refactor the album data pipeline to ensure:
1. **Correct album matching**: Only cache albums that match the query with high confidence
2. **Stable identity**: Albums maintain identity across cache/API round-trips
3. **Series isolation**: Editing one series doesn't pollute another

---

## 3. User Stories

### US-1: As a user editing a playlist, I want to see ONLY the albums I added to that series

**Acceptance Criteria**:
- Series "Robert Plant 00-10s" shows exactly 7 albums (no Led Zeppelin albums)
- Albums match the original queries stored in `albumQueries`

### US-2: As a user, I want the Reconfigure panel settings to be applied when regenerating

**Acceptance Criteria**:
- Changing "Min Tracks per Playlist" affects generated output
- Changing "Ranking Strategy" affects track selection

### US-3: As a user, I want clear feedback when an album cannot be found

**Acceptance Criteria**:
- If Apple Music doesn't have an album, show "Album not found" instead of wrong album
- Low-confidence matches are logged for debugging

---

## 4. Scope

### In Scope

| Component | Change |
|-----------|--------|
| `public/js/api/client.js` | Add similarity validation before caching |
| `public/js/cache/albumCache.js` | Refactor cache key strategy |
| `public/js/controllers/PlaylistsController.js` | Series-scoped album loading |
| `public/js/models/AlbumIdentity.js` | NEW: Stable identity model |

### Out of Scope

- Apple Music artist name alternatives (future enhancement)
- Offline/IndexedDB caching (DEBT-2, separate US)
- BaseCard component (ARCH-3, separate US)

---

## 5. Success Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | "Robert Plant 00-10s" series shows exactly 7 albums | Manual test |
| 2 | No "Physical Graffiti" or "Mothership" in Robert Plant series | Manual test |
| 3 | Reconfigure panel changes are applied on regenerate | Manual test |
| 4 | Console logs show similarity scores for album matching | Dev verification |
| 5 | Low-confidence matches (<35%) are rejected | Dev verification |

---

## 6. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing cached albums | Users see "not found" on reload | Graceful fallback to legacy API |
| Apple Music API rate limiting | Album loading slows down | Keep cache, only reject new mismatches |
| False positives in similarity check | Good albums rejected | Tune threshold, add logging |

---

## 7. Dependencies

| Dependency | Status |
|------------|--------|
| `_calculateSimilarity()` in MusicKitService | ✅ Already exists |
| Album model with stable ID generation | ✅ Already exists |
| PlaylistsController | ✅ Created in ARCH-1 |

---

## 8. User Review Required

> [!IMPORTANT]
> Please review and confirm:
> 1. Is 35% similarity threshold appropriate?
> 2. Should we clear existing cache on deployment?
> 3. Priority relative to ARCH-2, ARCH-3, DEBT-2?

---

## 9. Related Documents

- [Album Data Pipeline Analysis](album-data-pipeline-analysis.md)
- [DEBUG_LOG #92](../../debug/DEBUG_LOG.md#issue-92)
- [DEBUG_LOG #93](../../debug/DEBUG_LOG.md#issue-93)
- [TECHNICAL_DEBT_BACKLOG](../../TECHNICAL_DEBT_BACKLOG.md)
