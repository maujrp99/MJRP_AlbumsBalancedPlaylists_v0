# Feature Specification: ARCH-4 Album Search Pipeline Modularization

**Feature Branch**: `arch-4-album-search-modularization`  
**Created**: 2025-12-25  
**Status**: Draft  
**Related Issues**: #92 (Album Cache/Display Flaw), #93 (Reconfigure Panel)

---

## Problem Statement

### What is the Problem?

When searching for albums in Apple Music, the current `MusicKitService.searchAlbums()` frequently returns **wrong albums**. For example:
- Query: "Robert Plant & Jimmy Page - Walking Into Clarksdale"
- Apple Music returns: "Mothership" or "Physical Graffiti" (Led Zeppelin albums)

This causes:
1. Wrong albums cached under original query keys
2. Series show albums that don't belong to them
3. User confusion and data corruption

### Why is it a Problem?

1. **User Trust**: Users cannot rely on their curated series being accurate
2. **Feature Blocked**: Cannot verify Sprint 13 Edit/Reconfigure functionality
3. **Architectural Debt**: Monolithic MusicKitService (692 LOC) mixes search, scoring, and matching

### Root Cause

| Cause | Description |
|-------|-------------|
| Low search limit | Only 10 results returned; correct album may be #11-25 |
| No artist normalization | "Page and Plant" ≠ "Robert Plant & Jimmy Page" |
| Simple scoring | Hardcoded penalties, no fuzzy artist matching |
| No fallback strategy | Single query, no alternatives tried |

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find Album with Non-Standard Artist Name (Priority: P1)

User searches for an album where the artist name in their query differs from Apple Music's catalog.

**Why this priority**: This is the core bug (#92) causing wrong albums to appear. Highest impact fix.

**Independent Test**: Add "Robert Plant & Jimmy Page - Walking Into Clarksdale" to a series and verify "Walking Into Clarksdale" (not Mothership) is loaded.

**Acceptance Scenarios**:

1. **Given** user adds "Robert Plant & Jimmy Page - Walking Into Clarksdale" to a series, **When** album is fetched from Apple Music, **Then** "Walking Into Clarksdale" album is returned (confidence > 50%)
2. **Given** artist name is "Page and Plant" (alternative), **When** search fails with exact query, **Then** system tries alternative artist names automatically

---

### User Story 2 - Prefer Standard Edition Over Deluxe/Remaster (Priority: P2)

User searches for a standard album but gets Deluxe Edition variants.

**Why this priority**: Common issue, but doesn't cause "wrong album" - just wrong version.

**Independent Test**: Search for "Led Zeppelin IV" and verify standard edition is prioritized over Deluxe/Super Deluxe.

**Acceptance Scenarios**:

1. **Given** user searches "Led Zeppelin - Led Zeppelin IV", **When** results include both standard and deluxe editions, **Then** standard edition scores higher
2. **Given** user explicitly searches "Led Zeppelin IV Deluxe", **When** results include deluxe edition, **Then** deluxe edition is selected

---

### User Story 3 - Clear Feedback When Album Not Found (Priority: P3)

User searches for an album that doesn't exist in Apple Music catalog.

**Why this priority**: UX improvement, not critical bug.

**Independent Test**: Search for an obscure album and verify a "Not Found" message is shown instead of returning a random album.

**Acceptance Scenarios**:

1. **Given** album does not exist in Apple Music, **When** all search strategies fail, **Then** return null with reason "Album not found" (not a random album)
2. **Given** low-confidence match (< 35%), **When** best result is selected, **Then** console logs similarity score for debugging

---

### User Story 4 - Filter Artist Discography by Album Type (Priority: P2)

User types an artist name in HomeView and wants to filter the discography grid by type (Albums, Singles, Compilations, Live).

**Why this priority**: Improves existing flow without breaking it. Commonly needed for artists with large catalogs.

**Independent Test**: Search "Led Zeppelin", toggle "Albums only" filter, verify only studio albums appear (no compilations/singles).

**Acceptance Scenarios**:

1. **Given** user searches artist "Led Zeppelin" in HomeView, **When** discography loads, **Then** filter buttons appear: [Albums] [Singles] [Compilations] [Live]
2. **Given** filter "Albums" is active, **When** results render, **Then** only items with `albumType === 'Album'` are shown
3. **Given** user toggles multiple filters, **When** re-render, **Then** results match ALL active filters

---

### User Story 5 - Load All Artist Albums with Pagination (Priority: P3)

User searches an artist with 100+ albums (e.g., Beatles) and currently only sees first 100.

**Why this priority**: Edge case for artists with huge catalogs. Current limit=100 is usually sufficient.

**Independent Test**: Search "Beatles", verify "Load More" button appears if more albums exist.

**Acceptance Scenarios**:

1. **Given** artist has > 100 albums, **When** initial load completes, **Then** "Load More" button appears with count (e.g., "Showing 100 of 150")
2. **Given** user clicks "Load More", **When** next page loads, **Then** new albums append to grid (not replace)

---

### User Story 6 - Select Album Variant (Deluxe/Remaster/Standard) (Priority: P2)

User sees multiple versions of the same album (Standard, Deluxe, Remastered) and wants to choose which one(s) to add.

**Why this priority**: Gives user control over which version to blend. Prevents unwanted Deluxe tracks.

**Independent Test**: Search "Led Zeppelin", click on "Led Zeppelin IV" which has 3 variants, verify popup shows all variants.

**Acceptance Scenarios**:

1. **Given** album has multiple variants in catalog, **When** discography renders, **Then** album card shows badge "🔻 3 versions"
2. **Given** user clicks album with variants, **When** popup opens, **Then** all variants are listed with: name, year, track count
3. **Given** user selects specific variant(s), **When** clicks "Add", **Then** ONLY selected variants go to Staging Area
4. **Given** user clicks "Add All", **When** popup closes, **Then** ALL variants are added to Staging Area

---

### User Story 7 - Filter by Edition Type (Standard/Remaster/Deluxe) (Priority: P3)

User wants to see only Standard editions OR only Remasters in the discography grid.

**Why this priority**: Nice-to-have filtering, complements US-6.

**Independent Test**: Search "Pink Floyd", enable "Remasters only", verify only remastered editions appear.

**Acceptance Scenarios**:

1. **Given** edition filter "Standard" is active, **When** results render, **Then** albums with "(Deluxe)", "(Remastered)" in name are hidden
2. **Given** edition filter "Remasters" is active, **When** results render, **Then** only albums with "(Remastered)" in name are shown

---

### Edge Cases

- **Special characters in names**: "AC/DC", "Guns N' Roses", "Earth, Wind & Fire"
- **Roman numerals vs numbers**: "Led Zeppelin IV" vs "Led Zeppelin 4"
- **Multiple artists**: "Santana feat. Rob Thomas" vs "Santana & Rob Thomas"
- **Self-titled albums**: "Led Zeppelin" (artist) - "Led Zeppelin" (album)

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST try at least 2 search strategies before declaring "not found"
- **FR-002**: System MUST support artist name normalization (known variations mapped)
- **FR-003**: System MUST return search result confidence score (0-1)
- **FR-004**: System MUST reject matches with confidence < 35% (configurable threshold)
- **FR-005**: System MUST log all fallback strategy attempts for debugging
- **FR-006**: System MUST penalize Deluxe/Live editions unless explicitly requested
- **FR-007**: Search limit MUST be increased from 10 to at least 50 candidates
- **FR-008**: HomeView MUST display filter buttons for album types (Albums, Singles, Compilations, Live)
- **FR-009**: HomeView MUST display filter toggles for edition types (Standard, Remaster, Deluxe)
- **FR-010**: `getArtistAlbums()` MUST support pagination when artist has > 100 albums
- **FR-011**: HomeView MUST group album variants and show badge with count (e.g., "🔻 3 versions")
- **FR-012**: Variant picker MUST allow selecting one, multiple, or all versions to add

### Non-Functional Requirements

- **NFR-001**: Search latency SHOULD NOT increase by more than 500ms on fallback
- **NFR-002**: New modules MUST have unit test coverage
- **NFR-003**: Filter state SHOULD persist during session (not cleared on re-search)

### Key Entities

- **AlbumSearchResult**: { album, score, confidence, strategy }
- **ArtistMapping**: { normalizedName, alternatives[] }
- **SearchStrategy**: { id, name, execute(query) → AlbumSearchResult[] }
- **AlbumVariantGroup**: { baseName, variants[], hasMultiple }
- **AlbumFilter**: { types: string[], editions: string[] }

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| **SC-001** | "Robert Plant & Jimmy Page - Walking Into Clarksdale" returns correct album | Manual test |
| **SC-002** | No "Physical Graffiti" or "Mothership" in Robert Plant series | Manual test |
| **SC-003** | Console logs show similarity scores and strategy used | Dev verification |
| **SC-004** | Low-confidence matches (< 35%) are rejected with reason | Dev verification |
| **SC-005** | MusicKitService refactored into < 400 LOC (from 692) | Code review |
| **SC-006** | New modules have passing unit tests | `npm test` |
| **SC-007** | HomeView shows filter buttons [Albums] [Singles] etc. | UI verification |
| **SC-008** | Filtering by "Albums only" hides singles/compilations | Manual test |
| **SC-009** | Albums with variants show badge "🔻 N versions" | UI verification |
| **SC-010** | Clicking variant badge opens picker popup | Manual test |
| **SC-011** | Selected variants correctly added to Staging Area | Manual test |

---

## Technical Approach (Reference)

> [!NOTE]
> This section captures technical details from analysis. Full implementation in `plan.md` phase.

### Proposed Modular Architecture

```
public/js/services/
├── MusicKitService.js         # DEPRECATED → rename to MusicKitServiceLegacy.js
├── MusicKitServiceV2.js       # Clean rewrite with modular architecture
│
└── album-search/              # NEW: Modular search components
    ├── AlbumSearchService.js      # Orchestrator with fallback strategies
    ├── AlbumScorer.js             # Scoring logic (extracted)
    ├── ArtistNormalizer.js        # Artist name variations
    ├── EditionFilter.js           # Deluxe/Remaster/Live filtering
    ├── SimilarityMatcher.js       # String similarity (Levenshtein)
    ├── AlbumVariantGrouper.js     # Groups same album versions
    └── index.js                   # Barrel export
```

### Key Components

#### 1. EditionFilter.js
```javascript
// Cleans album name for searching + calculates penalties
cleanQuery("Led Zeppelin IV (Super Deluxe)") → "Led Zeppelin IV"
calculatePenalty({ isDeluxe: true }, { wantsDeluxe: false }) → 50
```

#### 2. SimilarityMatcher.js (Levenshtein)
```javascript
calculate("walking into clarksdale", "walking in clarksdale") → 0.91 (91%)
calculate("walking into clarksdale", "physical graffiti") → 0.15 (rejected)
isMatch(s1, s2, threshold=0.35) → true/false
```

#### 3. ArtistNormalizer.js
```javascript
getAlternatives("Page and Plant") → ["jimmy page & robert plant", "robert plant & jimmy page"]
getAlternatives("Led Zep") → ["led zeppelin"]
```

#### 4. AlbumVariantGrouper.js
```javascript
group([LZ IV, LZ IV (Remastered), LZ IV (Deluxe), Physical Graffiti])
→ {
    "led zeppelin iv": [Original, Remastered, Deluxe],
    "physical graffiti": [Physical Graffiti]
  }
```

---

### HomeView Mockup

```
┌────────────────────────────────────────────────────────────────┐
│  🔍 Led Zeppelin                                    [X Clear]  │
├────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ FILTROS: [✓ Albums] [  Singles] [  Compilations] [  Live]│   │  ← NEW
│  │          [✓ Standard] [✓ Remasters] [  Deluxe]           │   │  ← NEW
│  └─────────────────────────────────────────────────────────┘   │
│                                                                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ LZ I    │ │ LZ II   │ │ LZ III  │ │ LZ IV   │ │ Houses  │   │
│  │ 1969    │ │ 1969    │ │ 1970    │ │ 1971    │ │ 1973    │   │
│  │         │ │         │ │         │ │ 🔻 3    │ │         │   │  ← Badge
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
│                                                                │
│  📄 Showing 9 of 12 albums (3 hidden)               [Load More]│
└────────────────────────────────────────────────────────────────┘
```

### Variant Picker Popup

```
┌──────────────────────────────────────┐
│  Led Zeppelin IV                      │
│  3 versões disponíveis               │
│  ○ Led Zeppelin IV (1971)         [+]│
│  ○ Led Zeppelin IV (Remastered)   [+]│
│  ○ Led Zeppelin IV (Super Deluxe) [+]│
│  [Adicionar todas]  [Fechar]         │
└──────────────────────────────────────┘
```

---

### Implementation Phases (CRIT-5)

#### Phase 5a: Validation Only (Low Impact)
- Add similarity check in `apiClient.fetchAlbum()`
- Reject low-confidence matches (< 35%)
- No schema changes, no persistence impact

#### Phase 5b: Schema Upgrade (Medium Impact)
```javascript
// Firestore Series Schema
{
  albumQueries: ["Artist - Album", ...],        // Kept for compatibility
  resolvedAlbums: [                              // NEW
    { query: "...", albumId: "...", appleId: "...", verified: true }
  ]
}
```

#### Phase 5c: Migration (One-time)
- Script to resolve existing series' albumQueries
- Add resolvedAlbums to each series

---

### MusicKitService Changes

#### getArtistAlbums() - Add Pagination
```javascript
async getArtistAlbums(artistName, options = {}) {
    let allAlbums = []
    let offset = 0
    const limit = 100
    
    while (true) {
        const result = await this.music.api.music(
            `/v1/catalog/${this._getStorefront()}/artists/${artistId}/albums`,
            { limit, offset }  // ← Pagination
        )
        const albums = result.data?.data || []
        allAlbums.push(...albums)
        if (albums.length < limit) break
        offset += limit
    }
    
    return this._mapAndClassify(allAlbums)
}
```

#### searchAlbums() - Increase Limit
```javascript
async searchAlbums(artist, album, limit = 50) {  // Changed from 10
    // ... existing code with better scoring
}
```

---

## Out of Scope

- Apple Music artist name alternatives database (future enhancement)
- Offline/IndexedDB caching (DEBT-2, separate spec)
- BestEver scraper modularization (separate spec)
- Spotify search integration (already handled by SpotifyService)

---

## Dependencies

| Dependency | Status |
|------------|--------|
| MusicKit JS v3 | ✅ Already integrated |
| Levenshtein similarity function | ✅ Already in MusicKitService |
| Strategy Pattern implementation | ✅ Model exists in ranking/ |

---

## Status: Awaiting User Review

> [!IMPORTANT]
> Please review this specification and confirm:
> 1. Are the User Stories correctly prioritized (P1-P3)?
> 2. Is the 35% confidence threshold appropriate?
> 3. Should we add more artist name variations?
> 4. Filters visible always or as expandable panel?
> 5. Variant picker: modal popup or inline expansion?
> 6. Pagination: auto-load or manual "Load More" button?
