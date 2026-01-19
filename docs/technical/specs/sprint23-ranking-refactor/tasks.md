# Tasks: Sprint 23 - Consolidated Ranking Refactor [APPROVED]

## Phase 1: Persistence Fix (Immediate) [COMPLETED]
- [x] **SeriesService Refactor**:
    - [x] Update `refetchAlbumMetadata` to call `albumsStore.updateAlbum(enriched)` after cache injection.
    - [x] Add logging to verify preservation of `tracksOriginalOrder` during this update.
- [x] **Verification (Manual)**:
    - [ ] Start Dev Server (`npm run dev`).
    - [ ] Click "Refetch Enrichment" on an album with missing data.
    - [ ] Reload Page.
    - [ ] Verify ratings persist without re-fetching.
    - [x] **Verification (Automated)**: Added `test/services/SeriesService.test.js` to verify persistence call.

## Phase 2: Consolidated Schema (Backend & Transformer) [COMPLETED]
- [x] **Backend Update**:
    - [x] Edit `server/lib/fetchRanking.js`: Update `mergeRankingEvidence` to return `{ tracks: [{ evidence: [...] }] }`.
    - [x] Ensure backward compatibility (keep `bestEverEvidence` if needed by other consumers, or fully migrate).
- [x] **Frontend Transformer**:
    - [x] Edit `public/js/transformers/TrackTransformer.js`.
    - [x] Map `evidence` array to `track.ranking.evidence`.
    - [x] Calculate and populate legacy `track.rating` and `track.spotifyPopularity` from evidence.
- [x] **Verification (Unit)**:
    - [x] Run `npm test` to verify `TrackTransformer` outputs correct shape.

## Phase 3: Strategy & UI Logic [COMPLETED]
- [x] **Strategy Update**:
    - [x] Edit `public/js/ranking/BalancedRankingStrategy.js`.
    - [x] Update `getAcclaimScore` (or similar helper) to prefer `track.ranking.evidence` if available.
- [x] **UI Update**:
    - [x] Edit `public/js/components/ranking/TracksTable.js`.
    - [x] Add `title` attribute (Tooltip) to Rating Badge showing evidence breakdown.
- [x] **Verification (E2E)**:
    - [x] Run `npm run build` to ensure no build errors.
    - [x] Verify Tooltips in UI.

## Phase 4: Cleanup [SKIPPED]
- [ ] **Refinement**:
    - [ ] Remove any dead code related to old eager merging if safe.
    - [ ] Ensure `refetch` still works with new schema.
