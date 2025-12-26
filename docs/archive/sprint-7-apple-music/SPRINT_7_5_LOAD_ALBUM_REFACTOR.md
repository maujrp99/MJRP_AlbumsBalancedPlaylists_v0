# Feature Specification: Load Album Refactor & Visual Polish

**Feature Branch**: `feature/v2.5-load-album-refactor`
**Created**: 2025-12-15
**Status**: APPROVED
**Input**: User request to refactor `loadAlbum` for performance/accuracy (Apple Music) and fix visual regressions (Grid/Grouping).

## User Scenarios & Testing

### User Story 1 - Reliable & Fast Album Loading (Priority: P1)

As a user loading an album, I want the system to fetch reliable metadata (Tracks, Cover, Year) directly from a trusted source (Apple Music) without "hallucinations" or slow AI generation, so that I can trust the data and validate it quickly.

**Why this priority**: Correct data is the foundation of the app. The current LLM generation is slow and prone to errors ("Ghost tracks", fake tracklists). Reliability > Visuals.

**Independent Test**: Load "Metallica - 72 Seasons". Verify tracklist matches official Apple Music data exactly (no hallucinations, correct durations) and loads under 2 seconds.

**Acceptance Scenarios**:

1. **Given** I search for an official album (e.g., "Thriller"), **When** I click "Load Album", **Then** the system fetches track metadata directly from Apple Music (Official Discography).
2. **Given** the album is found in Apple Music, **When** it loads, **Then** the cover art is High-Resolution (>500px).
3. **Given** an official album, **When** loading completes, **Then** the tracklist is 100% accurate (no missing or fake tracks).

---

### User Story 2 - Correct Album Validations (Compact View) (Priority: P2)

As a user browsing my collection in Compact Mode, I want albums to appear in a responsive grid (not a single column) and clicking the cover should open the details modal, so I can manage my collection efficiently.

**Why this priority**: Visual regressions make the app feel broken, though data integrity (P1) is more critical for the core value prop.

**Independent Test**: Navigate to `/albums` in Compact View. Resize window. Verify items flow into columns (1 -> 2 -> 3 -> 4).

**Acceptance Scenarios**:

1. **Given** I am in Compact View, **When** I view the list, **Then** albums are displayed in a responsive grid (multi-column) layout.
2. **Given** I am in Compact View, **When** I click an album cover, **Then** the "View Album" modal opens with correct details.

---

### User Story 3 - Visual Grouping by Series (Expanded View) (Priority: P2)

As a user viewing "All Series" in Expanded Mode, I want to clearly see which series each album belongs to via visual headers and usage of borders, so I can understand the context of my collection.

**Why this priority**: Consistency with Compact View (which already has grouping).

**Independent Test**: Select "All Series" filter. Switch to Expanded View. Verify headers "Series Name" appear above groups of albums.

**Acceptance Scenarios**:

1. **Given** "All Series" is selected, **When** in Expanded View, **Then** albums are visually grouped by Series with clear headers/borders.
2. **Given** "Single Series" is selected, **When** in Expanded View, **Then** no Series headers are shown (flat list).

---

## Edge Cases

- What happens when Apple Music is down or album not found?
    - System falls back to legacy LLM generation (`/api/generate`) to ensure continuity.
- What happens if an album is in Apple Music but has no rankings?
    - System uses the `enrich-album` endpoint to generate rankings via LLM/Scraping, applying them to the *official* tracklist.

## Requirements

### Functional Requirements

- **FR-001**: System MUST query Apple Music API first for album metadata (Tracks, Cover, Year, ISRC).
- **FR-002**: System MUST use a new backend endpoint `/api/enrich-album` to fetch Rankings **only via BestEverAlbums scraping**.
    - If BestEverAlbums data is found: Use it for ranking.
    - If NOT found: Fallback to **Original Album Order** and log a warning to the console: `"[Enrichment] No ratings found for [Album Name]. Using original order."`
- **FR-003**: System MUST NOT use LLM to generating track names if Apple Music data is available.
- **FR-004**: Compact View MUST use CSS Grid with responsive breakpoints (`grid-cols-1`, `md:grid-cols-3`, etc.).
- **FR-005**: Expanded View MUST implement `renderScopedList` (or equivalent) to support Series Grouping logic.

### Key Entities

- **EnrichedAlbum**: `Album` model + `AppleMusicMetadata` + `Rankings` + `BestEverEvidence`.
- **EnrichRequest**: `{ artist, title, tracks: [{ title, duration }] }` payload sent to backend.

## Success Criteria

### Measurable Outcomes

- **SC-001**: **Accuracy**: 100% match with Apple Music tracklists for top 100 tested albums.
- **SC-002**: **Performance**: "Load Album" time reduced from ~8s (LLM) to ~2s (Apple Search + Enrichment).
- **SC-003**: **Visual Integrity**: Zero layout regressions in Compact/Expanded views (Grid verified, Grouping verified).
