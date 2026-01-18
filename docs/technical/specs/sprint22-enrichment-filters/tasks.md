# Task List: Sprint 22 - Enrichment & Filters
> **Based on Plan**: [plan.md](./plan.md)
> **Status**: Approved (Reordered)

## Phase 1: BEA Enrichment Encapsulation (Priority)
- [x] **Create BEA Helper**
    - [x] Create `public/js/helpers/BEAEnrichmentHelper.js`.
    - [x] Implement `enrichAlbum(album)` method.
    - [x] Implement `mapEntriesToTracks` private logic (extracting from `apiClient`).
- [x] **Refactor API Client**
    - [x] Clean up `public/js/api/client.js`: Remove inline rating mapping from `fetchAlbum`.
    - [x] Ensure `fetchAlbum` delegates or uses cleaner logic.
- [x] **Refactor Series Service**
    - [x] Modify `public/js/services/SeriesService.js`.
    - [x] Replace inline BEA fetch in `refetchAlbumMetadata` with `BEAEnrichmentHelper.enrichAlbum`.
    - [x] Replace inline BEA fetch in `injectAlbumsIntoViewCache` with `BEAEnrichmentHelper.enrichAlbum`.
- [x] **Data Verification**
    - [x] Verify `enrichAlbum` correctly updates `acclaim` and `track.rating` fields.
    - [x] Verify "BestEver" badge functionality remains consistent.

## Phase 2: Filter Logic Core
- [x] **Create Filter Utils**
    - [x] Create `public/js/utils/FilterUtils.js` with `normalizeString`, `textMatch`, `dateSort`.
    - [x] Create unit tests: `test/utils/FilterUtils.test.js`.
    - [x] Run `npm test` to verify Utils.
- [x] **Create SavedPlaylists Service**
    - [x] Create `public/js/services/SavedPlaylistsFilterService.js`.
    - [x] Implement `filterSeries` using `FilterUtils`.
- [x] **Refactor Series Filter Service**
    - [x] Modify `public/js/services/SeriesFilterService.js` to import and use `FilterUtils`.
    - [x] Run **Regression Test**: Verify `SeriesFilterService` still passes existing tests.

## Phase 3: UI Integration (Components)
- [x] **Create FilterToolbar**
    - [x] Rename/Refactor `SeriesToolbar.js` to `FilterToolbar.js` (or create new and deprecate old).
    - [x] Implement `render({ onSearch, onSort, onSeriesFilter, onBatchFilter })`.
    - [x] Ensure it supports "Series Dropdown" and "Batch Dropdown" props.
- [x] **Integrate into SavedPlaylistsView**
    - [x] Update `SavedPlaylistsView.js` to mount `FilterToolbar`.
    - [x] Implement `getUniqueSeriesNames` and `getUniqueBatchNames` for dropdown population.
    - [x] Connect `onFilterChange` to `SavedPlaylistsController.handleFilter`.
- [x] **Refactor SeriesView (Regression Check)**
    - [x] Update `SeriesView.js` to use the new `FilterToolbar`.
    - [x] Verify Artist/Year dropdowns still work.

## Phase 4: Final Verification
- [x] **Build Check**: Run `npm run build` to ensure no circular dependencies or breaking imports.
- [x] **Manual Regression**:
    - [x] Verify `SeriesView` Filtering (Artist, Year).
    - [x] Verify `SavedPlaylistsView` Filtering (Name, Date, Dropdowns).
    - [x] Verify "Refetch Metadata" button functionality.
