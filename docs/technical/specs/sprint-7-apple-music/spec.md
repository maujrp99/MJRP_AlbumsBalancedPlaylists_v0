# Feature Specification: Apple Music Integration

**Feature Branch**: `sprint-7-apple-music`  
**Created**: 2025-12-12  
**Status**: Draft  
**Input**: User requirement for high-quality album covers, official discography data, and playlist export to Apple Music.

---

## User Scenarios & Testing

### User Story 1 - High-Quality Album Covers (Priority: P1)

As a user browsing my album collection, I want to see **high-resolution album artwork** (500px+) on album cards and in the autocomplete dropdown, so the app feels premium and visually polished.

**Why this priority**: Current Discogs covers are low quality (150px thumbnails). Visual quality directly impacts perceived app quality - a P1 user experience issue.

**Independent Test**: Navigate to Albums view, verify all album cards display sharp, high-resolution artwork. No blurry or pixelated images.

**Acceptance Scenarios**:

1. **Given** an album exists in the system, **When** I view the album card, **Then** the cover art is at least 500x500px and loads quickly.
2. **Given** I search for an album in autocomplete, **When** results appear, **Then** each result shows a thumbnail of the official cover art.
3. **Given** an album has no cover in Apple Music, **When** displayed, **Then** a tasteful placeholder is shown (not broken image).

---

### User Story 2 - Official Discography Data (Priority: P1)

As a user adding albums to my series, I want the autocomplete to show **only official studio and live albums** from an artist's discography (no bootlegs, compilations, or singles), so I can easily find the albums I care about.

**Why this priority**: Current Discogs data includes bootlegs, tour recordings, and compilations that clutter autocomplete. This is a P1 usability issue.

**Independent Test**: Type "Metallica" in autocomplete, verify only official albums appear (Kill 'Em All → 72 Seasons), not M72 tour bootlegs or compilations.

**Acceptance Scenarios**:

1. **Given** I type an artist name, **When** autocomplete shows results, **Then** only studio albums, live albums, and EPs from official discography appear.
2. **Given** an artist has multiple album types, **When** I search, **Then** results are sorted by release year (newest first).
3. **Given** Apple Music has complete discography, **When** I search, **Then** I see ALL official releases (e.g., 72 Seasons for Metallica).

---

### User Story 3 - Playlist Export to Apple Music (Priority: P2)

As a user who has generated balanced playlists, I want to **export my playlists directly to my Apple Music library**, so I can listen to them on any Apple device.

**Why this priority**: This is the "killer feature" for Apple ecosystem users, but requires P1 data quality first.

**Independent Test**: Generate a playlist, click "Export to Apple Music", sign in if needed, verify playlist appears in Apple Music app.

**Acceptance Scenarios**:

1. **Given** I have generated playlists, **When** I click "Export to Apple Music", **Then** I am prompted to authorize if not already signed in.
2. **Given** I am authorized, **When** I export a playlist, **Then** a new playlist is created in my Apple Music library with matching tracks.
3. **Given** a track is not available in Apple Music, **When** exporting, **Then** I see a warning about which tracks couldn't be added.
4. **Given** export succeeds, **When** I open Apple Music, **Then** I see my playlist with correct name and tracks.

---

### Edge Cases

- What happens when Apple Music API is rate-limited? → Show user-friendly error, retry with backoff.
- What happens when user denies Apple Music authorization? → Clear error message, allow retry.
- What happens when album exists in Discogs but not Apple Music? → Show warning, allow manual search.
- What happens when track names differ slightly between sources? → Fuzzy matching with confidence threshold.

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST authenticate users via Apple MusicKit JS.
- **FR-002**: System MUST fetch album artwork in at least 500x500px resolution.
- **FR-003**: System MUST fetch artist discography with album type classification (Studio, Live, Compilation, EP).
- **FR-004**: System MUST filter autocomplete to show only Studio and Live albums by default.
- **FR-005**: System MUST create playlists in user's Apple Music library via MusicKit API.
- **FR-006**: System MUST handle tracks not found in Apple Music gracefully.
- **FR-007**: System MUST store MusicKit authorization token securely (session-based, not persisted).
- **FR-008**: System MUST respect Apple Music API rate limits (configurable backoff).

### Non-Functional Requirements

- **NFR-001**: Cover art must load within 500ms (lazy loading acceptable).
- **NFR-002**: Autocomplete search must return within 200ms using cached data.
- **NFR-003**: Playlist export must complete within 30 seconds for up to 100 tracks.

### Key Entities

- **AppleMusicAlbum**: Apple Music album ID, artist, title, year, albumType, artworkUrl, tracks[].
- **AppleMusicTrack**: Track ID, title, duration, isrc, playable.
- **MusicKitAuth**: User token, expiry, capabilities (library write).

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of albums display cover art at 500px+ resolution (no Discogs fallback).
- **SC-002**: Autocomplete shows only official discography (0 bootlegs or compilations).
- **SC-003**: Users can export playlists to Apple Music in under 30 seconds.
- **SC-004**: 95%+ track match rate when exporting (based on ISRC or title+artist).
- **SC-005**: User satisfaction: "Export to Apple Music" feature used by 50%+ of active users.

---

## Technical Constraints

### Apple Developer Requirements

- Apple Developer Account with MusicKit enabled.
- App registered with `music` and `music-library-write` capabilities.
- MusicKit JS token generated server-side (requires private key).

### API Limitations

- MusicKit search: 25 results/page by default.
- Library write: Rate limited (~100 requests/minute).
- Token expiry: 6 months (developer token), 1 year (user token).

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Apple Developer Account | ✅ Available | User has account |
| MusicKit Key | ⚠️ Pending | Need to generate in Apple Developer Portal |
| Firebase Auth | ✅ Ready | Already configured |
| Data Enrichment V1 | ✅ Ready | Temporary regex filtering in place |

---

## Out of Scope (Sprint 7)

- Apple Music playback within the app (requires more complex MusicKit setup).
- Sync existing Apple Music playlists INTO the app.
- Android/Spotify integration (future sprints).

---

## Decisions (Resolved)

| Question | Decision | Rationale |
|----------|----------|-----------|
| **Token Generation** | Node.js Server + Secret Manager | AuthKey .p8 stored in GCP Secret Manager, JWT generated on demand via `/api/musickit-token` |
| **Cover Caching** | Template URLs (dynamic sizing) | Store base URL template, frontend constructs size dynamically (100px thumbnail → 500px card → 3000px full) |
| **Cover Fallback** | Discogs fallback | If album not in Apple Music, use existing Discogs cover URL |
