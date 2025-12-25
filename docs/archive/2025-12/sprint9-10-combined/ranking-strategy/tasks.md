# Task List: Ranking Strategy Implementation

**Status**: DRAFT
**Sprint**: 11.5

## 1. Domain Logic (Strategies)
- [ ] Create `public/js/ranking/RankingStrategy.js` (Abstract Base)
- [ ] Create `public/js/ranking/BalancedRankingStrategy.js` (Copy logic from Legacy)
- [x] Create `public/js/ranking/RankingStrategy.js` (Abstract Base)
- [x] Create `public/js/ranking/BalancedRankingStrategy.js` (Copy logic from Legacy)
- [x] Create `public/js/ranking/SpotifyRankingStrategy.js` (New logic: Popularity > Rating)
- [ ] Create `public/js/ranking/BEARankingStrategy.js` (New logic: Rating > Acclaim)
- [ ] Create `public/js/ranking/index.js` (Export all)

## 2. Algorithm Refactor
- [x] Update `MJRPBalancedCascadeAlgorithm.js`
    - [x] Import `RankingStrategy` classes
    - [x] Remove `LegacyRoundRobinAlgorithm` dependency
    - [x] Implement `generate` input adapter to use `opts.rankingStrategy.rank(album)`

## 3. UI Integration
- [x] Update `PlaylistsView.js`
    - [x] Add HTML for Ranking Selector (Balanced, Spotify, BEA)
    - [x] Add Event Listener to capture selection
    - [x] Pass `rankingStrategy` instance to `algorithm.generate()`

## 4. UI Refinement (Loading Bar)
- [x] Move `InlineProgress` container to be inside or directly below `filters-section` in `AlbumsView.js`.
- [x] Verify functionality with visual check.

## 5. Verification
- [x] Browser Test: Select "Spotify", Generate, Check Track Order.
- [x] Browser Test: Select "BEA", Generate, Check Track Order.
- [x] **Verified Persistence**: Enriched data saves to DB.
- [x] **Verified UI**: Time/Duration column visible.

## 6. Documentation (Post-Implementation)
- [ ] Update `docs/technical/data_flow_architecture.md` (Architecture Docs)
- [ ] Update component inventory with new `RankingStrategy` classes (Component Reference)
- [ ] Add entry to `docs/debug/DEBUG_LOG.md` for Spotify Export fix (Debug Log)
- [ ] Mark `docs/technical/specs/ranking-strategy/spec.md` as IMPLEMENTED (Spec Files)

