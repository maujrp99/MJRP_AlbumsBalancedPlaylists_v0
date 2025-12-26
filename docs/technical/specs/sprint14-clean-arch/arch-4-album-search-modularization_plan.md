# IMPL-ARCH-4: Album Search Modularization Plan

**Feature Branch**: `arch-4-album-search-modularization`
**Related Spec**: `arch-4-album-search-modularization_spec.md`
**Status**: DRAFT (Waiting for Approval)

---

## 🏗️ Architecture Design

### 1. New Service Module (`public/js/services/album-search/`)
We will move away from the monolithic `MusicKitService.js` by creating a dedicated pipeline.

| File | Responsibility |
|------|----------------|
| `AlbumSearchService.js` | **Orchestrator**. Manages the search flow, fallback strategies, and calling sub-components. |
| `ArtistNormalizer.js` | **Data Transformation**. Maps variations like "Page & Plant" → "Robert Plant & Jimmy Page". |
| `ScoreCalculator.js` | **Logic**. Implements the scoring algorithm (Levenshtein + Penalty modifiers). |
| `EditionFilter.js` | **Filter Logic**. Handles inclusion/exclusion of Deluxe, Live, and Compilation types. |
| `SmartCache.js` | **Performance**. Lightweight in-memory cache for search results (transient). |
| `types.js` | Shared JSDoc type definitions (`SearchResult`, `SearchOptions`). |

### 2. UI Components (`public/js/components/search/`)
To support the new filtering and variant selection without muddying `HomeView.js` further, we will create V3-style components.

| Component | Responsibility |
|-----------|----------------|
| `DiscographyToolbar.js` | Renders the filter buttons ([Albums] [Singles]...) and Edition toggles. |
| `VariantPickerModal.js` | Renders the "Select Version" popup for albums with multiple editions. |

---

## 🔄 Logic Flows

### A. The Search Pipeline (`AlbumSearchService.search()`)
1.  **Normalization**: Input artist name is passed to `ArtistNormalizer`.
2.  **Strategy 1 (Primary)**: Search Apple Music with normalized artist + album name.
3.  **Validation**: Results passed to `ScoreCalculator`.
    *   *If `confidence > 0.8`*: Return immediately.
4.  **Strategy 2 (Fallback)**: If validation fails, try alternative artist names (e.g., "Led Zeppelin" instead of "Led Zep").
5.  **Strategy 3 (Fuzzy)**: Search Artist only, then fetch their top albums and client-side fuzzy match the title.
6.  **Finalize**: Return sorted, scored list.

### B. Variant Grouping (`AlbumSearchService.groupVariants()`)
1.  Input: List of 50 raw albums.
2.  Logic: Buckets albums by normalized title (ignoring "Deluxe", "Remastered").
3.  Output: List of `AlbumGroup` objects (Base Album + `variants` array).

---

## 🎨 UI Implementation Strategy

Since `HomeView.js` is slated for refactor in ARCH-11, we will implement these changes using **Integration Points** rather than a full rewrite of HomeView now.

### 1. Discography Filters (New DOM Injection)
We will add a container div `#discography-filters` above the results grid in `HomeView`.
`DiscographyToolbar` will mount here.

```javascript
// Data-Flow
Toolbar (User clicks 'Singles') 
  → emits 'filter-change' 
  → HomeView receives event 
  → calls AlbumSearchService.filter(results) 
  → HomeView re-renders Grid
```

### 2. Variant Picking
Instead of immediately adding an album on click:
1.  **Check**: Does album have `variants.length > 0`?
2.  **No**: Proceed with existing "Add to Series" logic.
3.  **Yes**: Open `VariantPickerModal`.
    *   User selects specific version(s).
    *   User clicks "Add".
    *   Modal returns `selectedAlbums`.
    *   HomeView adds them to Series.

---

## 🧪 Verification Plan

### Automated Tests (Unit)
*   **`ArtistNormalizer`**: Test known mappings ("AC/DC" vs "ACDC").
*   **`ScoreCalculator`**: Test Levenshtein distance on tricky pairs ("IV" vs "Physical Graffiti").
*   **`EditionFilter`**: Ensure "Standard" setting filters out "Deluxe Edition".

### Manual Tests (User Scenarios)
1.  **Search "Robert Plant & Jimmy Page - Walking Into Clarksdale"**:
    *   Verify result is NOT "Mothership".
    *   Verify confidence score log > 80%.
2.  **Filter "Led Zeppelin" Discography**:
    *   Toggle [Compilations] → Verify "Mothership" and "Early Days" appear.
    *   Toggle [Albums] → Verify they disappear.
3.  **Variant Picker**:
    *   Click "Led Zeppelin IV".
    *   Verify Modal appears with "Standard", "Remastered", "Deluxe".
    *   Select "Remastered" → verify strictly THAT ID is added to series.

---

## 📅 Task Breakdown

### Phase 1: Service Core
1.  [ ] Scaffold `services/album-search/` directory.
2.  [ ] Implement `ArtistNormalizer` and `ScoreCalculator`.
3.  [ ] Implement `AlbumSearchService` (Pipeline logic).
4.  [ ] Unit Tests for logic.

### Phase 2: UI Integration
5.  [ ] Create `DiscographyToolbar` component.
6.  [ ] Create `VariantPickerModal` component.
7.  [ ] Update `HomeView.js` to use `AlbumSearchService` (replacing direct MusicKit calls).
8.  [ ] Wire up Filter events.

### Phase 3: Polish
9.  [ ] Tune Scoring thresholds (35% vs 50%).
10. [ ] CSS Polish for Toolbar and Badges.
