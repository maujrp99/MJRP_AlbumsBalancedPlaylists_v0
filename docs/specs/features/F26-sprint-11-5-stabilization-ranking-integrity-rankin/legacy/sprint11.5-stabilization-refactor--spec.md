# Feature Specification: Sprint 11.5 - Stabilization & Ranking Integrity

**Feature Branch**: `feature/sprint11.5-stabilization`  
**Created**: 2025-12-19  
**Status**: Draft  
**Ultimate Goal**: **Total Ranking Integrity**. Ensure every track in every album of a series is accurately ranked (via BestEver, Spotify, or Fallback) to provide a 100% reliable dataset for playlist generation algorithms.

## User Scenarios & Testing

### User Story 1 - Reliable Album Rankings (Priority: P1)

As a curator, I want to be 100% sure that when I open a "Beatles" album card, I see "Beatles" tracks and not "Led Zeppelin" tracks, so that I can accurately rank and export my playlists.

**Why this priority**: Core value of the app is data accuracy. Bug #71 currently undermines the entire credibility of the multi-source ranking system.

**Independent Test**: Can be tested by opening different album cards in sequence and verifying that the `TracksRankingComparison` component always displays tracks corresponding to the parent card's `album.id`.

**Acceptance Scenarios**:
1. **Given** Multiple albums in the grid, **When** clicking "Expanded View" on one album and then switching to another, **Then** the ranking table must update instantly with the correct tracks.
2. **Given** View mode toggle (Compact <-> Expanded), **When** toggling views, **Then** all ranking data must remain correctly bound to its respective album card without cross-contamination.

---

### User Story 2 - Consistent Badge Status (Priority: P2)

As a user, I want the "BestEver" badge to accurately reflect if an album has been enriched, so I don't waste time clicking "Enrich" multiple times for the same album.

**Why this priority**: UX clarity and preventing redundant API calls. Bug #58 currently creates confusion about data status.

**Independent Test**: Refresh browser and verify that albums previously enriched with BestEver data still show the correct badge status immediately.

**Acceptance Scenarios**:
1. **Given** An enriched album, **When** reloading the series, **Then** `bestEverAlbumId` must be present in the store and reflected in the UI badge.

---

### User Story 3 - Predictable Rendering (Priority: P2)

As a developer, I want the `AlbumsView.js` state management to be isolated from rendering, so that I can add features without causing side effects in event listeners or data mapping.

**Why this priority**: Crucial for long-term maintainability and solving the "God File" complexity.

**Independent Test**: Unit test the `StateController` to ensure filter updates correctly modify the album list without touching the DOM.

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST ensure `TracksRankingComparison` receives a unique, immutable reference to album tracks keyed by `album.id`.
- **FR-002**: System MUST persist the result of `/enrich-album` (specifically `bestEverAlbumId`) in the Firestore document for the specific series context.
- **FR-003**: System MUST implement a `StateController` to manage `filters` and `currentAlbums` outside of the main view rendering loop.
- **FR-004**: System MUST show a non-blocking loading spinner per-album card while ranking data is being fetched (addressed Issue #70).

### Key Entities

- **AlbumState**: Internal state object containing `currentAlbums`, `activeFilters`, and `loadingStatus`.
- **RankingTableContainer**: Component responsible for fetching and mapping tracks to the correct `album.id`.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 0% incidence of "Wrong Tracks" (#71) after 50 consecutive album view toggles.
- **SC-002**: `AlbumsView.js` line count reduced by at least 15% through extraction.
- **SC-003**: BestEver badges persist across manual page refreshes 100% of the time.
