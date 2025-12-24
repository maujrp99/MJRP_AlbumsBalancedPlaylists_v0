# Playlist Hybrid Refactor - SDD Spec

**Created**: 2025-12-23 22:08
**Status**: 📋 SPEC PHASE - Awaiting Approval
**Sprint**: 12.5
**Priority**: High
**Architecture**: Option C - Hybrid (Services + Components)

---

## 1. WHAT: Feature Overview

### 1.1 Summary

Refactor Playlist-related functionality using a **Hybrid Architecture** that combines:
1. **Service Layer**: Centralized business logic (generation, persistence)
2. **Component Layer**: Reusable UI components (TrackItem, PlaylistCard)
3. **Thin View Layer**: Views become orchestrators, not logic containers

### 1.2 Scope

**In Scope:**
- Extract `PlaylistGenerationService` (from BlendingMenuView + PlaylistsView)
- Extract `PlaylistPersistenceService` (CRUD operations)
- Create reusable UI components (TrackItem, PlaylistCard, BatchGroupCard)
- Add Playlist Series naming step to BlendingMenu
- Refactor views to use services and components

**Out of Scope:**
- New features (Spotify export remains as-is)
- Navigation changes (SavedPlaylistsView landing behavior unchanged)
- New CRUD operations (only refactoring existing)

---

## 2. WHY: Problem Statement

### 2.1 Current Issues

| Issue | Severity | Details |
|-------|----------|---------|
| **Duplicated Logic** | 🔴 High | `transformTracks()` in 2 places, 6 LOC each |
| **Duplicated Generation** | 🔴 High | `generatePlaylists()` in 2 places, ~30 LOC each |
| **Inline Repository Calls** | 🟠 Medium | 5 places with `new PlaylistRepository()` |
| **No TrackItem Component** | 🟠 Medium | Track rendering repeated in 2+ views |
| **Missing Batch Naming** | 🟠 Medium | BlendingMenu doesn't prompt for series name |
| **View LOC Bloat** | 🟡 Low | PlaylistsView 896 LOC, SavedPlaylistsView 667 LOC |

### 2.2 Benefits of Refactor

| Benefit | Impact |
|---------|--------|
| **Single Source of Truth** | Bug fixes apply everywhere automatically |
| **Testability** | Services can be unit tested in isolation |
| **Consistency** | Same TrackItem component across all views |
| **Maintainability** | Views become thin orchestrators (~200-300 LOC) |
| **Alignment** | Matches SeriesView V3 architecture pattern |

---

## 3. SUCCESS CRITERIA

### 3.1 Functional Requirements

| ID | Requirement | Verification |
|----|-------------|--------------|
| FR-1 | `PlaylistGenerationService.generate()` produces identical output to current code | Unit test comparing outputs |
| FR-2 | `PlaylistPersistenceService.save()` persists to Firestore correctly | Integration test |
| FR-3 | `PlaylistPersistenceService.delete()` removes from Firestore | Integration test |
| FR-4 | BlendingMenu Step 4 prompts for batch name (when output:multiple) | Manual UAT |
| FR-5 | TrackItem displays Acclaim (orange) and Spotify (green) badges | Visual check |
| FR-6 | Drag & Drop works in PlaylistsView Detail | Manual UAT |
| FR-7 | **Export to Spotify** continues working | Manual UAT |
| FR-8 | **Export to Apple Music** continues working | Manual UAT |
| FR-9 | **Save to Series History** continues working (both CREATE and EDIT modes) | Manual UAT |
| FR-10 | **CRUD in SavedPlaylistsView**: Delete playlist, batch, all playlists | Manual UAT |
| FR-11 | **Edit Batch Playlists** navigation and editing works | Manual UAT |
| FR-12 | **Download JSON** export continues working | Manual UAT |

### 3.2 Non-Functional Requirements

| ID | Requirement | Verification |
|----|-------------|--------------|
| NFR-1 | No regression in page load time | Performance comparison |
| NFR-2 | PlaylistsView < 350 LOC after refactor | LOC count |
| NFR-3 | SavedPlaylistsView < 250 LOC after refactor | LOC count |
| NFR-4 | BlendingMenuView < 350 LOC after refactor | LOC count |
| NFR-5 | All new services have JSDoc documentation | Code review |

### 3.3 Acceptance Gates

- [ ] All FR-* tests pass
- [ ] All NFR-* requirements met
- [ ] User UAT approval

---

## 4. ENTITIES AND DATA FLOW

### 4.1 Data Model (Unchanged)

```
Playlist {
  id: string
  name: string
  batchName: string          // Groups playlists together
  tracks: Track[]
  seriesId: string           // Parent series reference
  createdAt: timestamp
  updatedAt: timestamp
}

Track {
  id: string
  title: string
  artist: string
  album: string
  duration: number
  rating: number             // Acclaim rating
  rank: number               // Acclaim rank
  spotifyRank: number        // Spotify popularity rank
  spotifyPopularity: number  // 0-100
}
```

### 4.2 Service Interfaces

```typescript
// PlaylistGenerationService
interface PlaylistGenerationService {
  generate(albums: Album[], config: GenerationConfig): GenerationResult
  transformTracks(rawTracks: any[]): Track[]
  validateConfig(config: GenerationConfig): ValidationResult
}

// PlaylistPersistenceService
interface PlaylistPersistenceService {
  save(seriesId: string, playlists: Playlist[], batchName: string): Promise<void>
  load(seriesId: string, batchName?: string): Promise<Playlist[]>
  delete(seriesId: string, playlistId: string): Promise<void>
  deleteBatch(seriesId: string, batchName: string): Promise<void>
  deleteAll(seriesId: string): Promise<void>
}
```

### 4.3 Component Props

```typescript
// TrackItem
interface TrackItemProps {
  track: Track
  playlistIndex: number
  trackIndex: number
  draggable: boolean         // Required in PlaylistsView
  showAcclaimBadge: boolean
  showSpotifyBadge: boolean
  onRemove?: () => void
}

// PlaylistCard
interface PlaylistCardProps {
  playlist: Playlist
  index: number
  editable: boolean
  onNameChange?: (name: string) => void
  children: TrackItem[]
}
```

---

## 5. VIEW HIERARCHY (Clarified)

```
TopNav "Playlists" → SavedPlaylistsView (Landing Page)
                     ├── Shows grouped Playlist Series (BatchGroupCard)
                     ├── "+ Add" button → navigates to Blending Menu
                     └── Click batch → PlaylistsView (Detail)

PlaylistsView (Detail):
                     ├── Edit playlist names, tracks (drag & drop)
                     ├── "Regenerate" → uses existing series config
                     ├── Export, Save to History
                     └── "← Back" to landing

BlendingMenuView:
                     ├── Step 1: Select Series
                     ├── Step 2: Pick Flavor (Algorithm)
                     ├── Step 3: Ingredients (Duration, Ranking, Discovery)
                     ├── Step 4: Batch Name + "Blend It!" CTA
                     └── Navigate to PlaylistsView (Detail)
```

---

## 6. RISKS

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Breaking existing functionality | Medium | High | Comprehensive test before/after |
| Firestore permission issues | Low | Medium | Same paths as current code |
| Complex refactor | Medium | Medium | Phased approach |

---

## 7. DEPENDENCIES

- ✅ Spotify Enrichment (completed Sprint 12)
- ✅ Blending Menu (completed Sprint 12)
- ✅ Algorithm Registry (completed Sprint 11)
- ✅ PlaylistRepository (exists)
- ✅ SeriesRepository (exists)

---

## 8. APPROVAL

**Spec Status**: 📋 AWAITING USER APPROVAL

- [ ] User approves WHAT (scope)
- [ ] User approves WHY (problem statement)
- [ ] User approves SUCCESS CRITERIA

> [!IMPORTANT]
> After approval, we proceed to **Plan Phase** (plan.md) with architecture details and UI mockups.
