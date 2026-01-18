# Task List: Sprint 22 - Enrichment & Filters
> **Based on Plan**: [plan.md](./plan.md)
> **Status**: Approved (Reordered)

## Phase 1: BEA Enrichment Encapsulation (Priority)
- [ ] **Create BEA Helper**
    - [ ] Create `public/js/helpers/BEAEnrichmentHelper.js`.
    - [ ] Implement `enrichAlbum(album)` method.
    - [ ] Implement `mapEntriesToTracks` private logic (extracting from `apiClient`).
- [ ] **Refactor API Client**
    - [ ] Clean up `public/js/api/client.js`: Remove inline rating mapping from `fetchAlbum`.
    - [ ] Ensure `fetchAlbum` delegates or uses cleaner logic.
- [ ] **Refactor Series Service**
    - [ ] Modify `public/js/services/SeriesService.js`.
    - [ ] Replace inline BEA fetch in `refetchAlbumMetadata` with `BEAEnrichmentHelper.enrichAlbum`.
    - [ ] Replace inline BEA fetch in `injectAlbumsIntoViewCache` with `BEAEnrichmentHelper.enrichAlbum`.
- [ ] **Data Verification**
    - [ ] Verify `enrichAlbum` correctly updates `acclaim` and `track.rating` fields.
    - [ ] Verify "BestEver" badge functionality remains consistent.

## Phase 2: Filter Logic Core
- [ ] **Create Filter Utils**
    - [ ] Create `public/js/utils/FilterUtils.js` with `normalizeString`, `textMatch`, `dateSort`.
    - [ ] Create unit tests: `test/utils/FilterUtils.test.js`.
    - [ ] Run `npm test` to verify Utils.
- [ ] **Create SavedPlaylists Service**
    - [ ] Create `public/js/services/SavedPlaylistsFilterService.js`.
    - [ ] Implement `filterSeries` using `FilterUtils`.
- [ ] **Refactor Series Filter Service**
    - [ ] Modify `public/js/services/SeriesFilterService.js` to import and use `FilterUtils`.
    - [ ] Run **Regression Test**: Verify `SeriesFilterService` still passes existing tests.

## Phase 3: UI Integration (Components)
- [ ] **Create FilterToolbar**
    - [ ] Rename/Refactor `SeriesToolbar.js` to `FilterToolbar.js` (or create new and deprecate old).
    - [ ] Implement `render({ onSearch, onSort, onSeriesFilter, onBatchFilter })`.
    - [ ] Ensure it supports "Series Dropdown" and "Batch Dropdown" props.
- [ ] **Integrate into SavedPlaylistsView**
    - [ ] Update `SavedPlaylistsView.js` to mount `FilterToolbar`.
    - [ ] Implement `getUniqueSeriesNames` and `getUniqueBatchNames` for dropdown population.
    - [ ] Connect `onFilterChange` to `SavedPlaylistsController.handleFilter`.
- [ ] **Refactor SeriesView (Regression Check)**
    - [ ] Update `SeriesView.js` to use the new `FilterToolbar`.
    - [ ] Verify Artist/Year dropdowns still work.

## Phase 4: Final Verification
- [ ] **Build Check**: Run `npm run build` to ensure no circular dependencies or breaking imports.
- [ ] **Manual Regression**:
    - [ ] Verify `SeriesView` Filtering (Artist, Year).
    - [ ] Verify `SavedPlaylistsView` Filtering (Name, Date, Dropdowns).
    - [ ] Verify "Refetch Metadata" button functionality.
