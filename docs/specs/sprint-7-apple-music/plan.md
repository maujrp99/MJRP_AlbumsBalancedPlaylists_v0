# Implementation Plan: Sprint 7 - Apple Music Integration

**Branch**: `sprint-7-apple-music` | **Date**: 2025-12-12 | **Spec**: [spec.md](./spec.md)

---

## Summary

Integrate Apple MusicKit to provide:
1. **High-quality album covers** (500px+) replacing Discogs thumbnails
2. **Official discography data** for autocomplete (filtered by album type)
3. **Playlist export** to user's Apple Music library

---

## Technical Context

| Aspect | Value |
|--------|-------|
| **Language/Version** | JavaScript (ES Modules), Node.js 18+ |
| **Primary Dependencies** | MusicKit JS 3.x, `jsonwebtoken` (server) |
| **Storage** | Firestore (user data), `albums-expanded.json` (catalog) |
| **Testing** | Vitest (unit), Manual (integration) |
| **Target Platform** | Web (SPA), iOS Safari, Chrome |
| **Constraints** | MusicKit rate limits (~100 req/min library write) |

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. User-Centric Quality** | ✅ | HD covers improve visual quality |
| **II. Clean Code** | ✅ | New MusicKitService follows Service pattern |
| **III. Documentation First** | ✅ | This plan + spec created before code |
| **IV. Spec-Driven & Test** | ✅ | Unit tests for token generation, manual for OAuth |
| **V. Operational Excellence** | ✅ | AuthKey in Secret Manager, not in code |

---

## Project Structure

### Documentation

```
docs/specs/sprint-7-apple-music/
├── spec.md           # Feature specification (done)
├── plan.md           # This file
└── tasks.md          # Granular implementation checklist (next)
```

### Source Code (New/Modified)

```
server/
├── services/
│   └── MusicKitTokenService.js  # [NEW] JWT generation with .p8 key
├── routes/
│   └── musickit.js              # [NEW] /api/musickit-token endpoint
└── index.js                     # [MODIFY] Mount new route

public/js/
├── services/
│   └── MusicKitService.js       # [NEW] MusicKit JS wrapper
├── components/
│   └── AppleMusicExport.js      # [NEW] Export button/modal
└── api/
    └── client.js                # [MODIFY] Add cover URL lookup from Apple

scripts/
└── enrich-album-covers.js       # [NEW] Batch update covers from Apple Music
```

---

## Implementation Phases

### Phase 1: Server Token Generation (P1)

**Goal**: Secure endpoint to generate MusicKit developer tokens.

| Task | Description |
|------|-------------|
| 1.1 | Store AuthKey .p8 in GCP Secret Manager |
| 1.2 | Create `MusicKitTokenService.js` (JWT signing with ES256) |
| 1.3 | Create `/api/musickit-token` endpoint |
| 1.4 | Add unit tests for token generation |

**JWT Payload**:
```json
{
  "iss": "TEAM_ID",
  "iat": 1702396800,
  "exp": 1717948800,  // 6 months max
  "sub": "MUSIC_APP_ID"
}
```

---

### Phase 2: MusicKit Frontend Service (P1)

**Goal**: Initialize MusicKit and search for albums/artwork.

| Task | Description |
|------|-------------|
| 2.1 | Create `MusicKitService.js` singleton |
| 2.2 | Implement `init()` - fetch token, configure MusicKit |
| 2.3 | Implement `searchAlbums(artist, album)` - return Apple Music data |
| 2.4 | Implement `getArtworkUrl(album, size)` - construct template URL |
| 2.5 | Implement `getArtistAlbums(artistId)` - fetch official discography |

**MusicKit Config**:
```javascript
MusicKit.configure({
  developerToken: await fetchToken(),
  app: {
    name: 'Album Playlist Synthesizer',
    build: '2.0.0'
  }
});
```

---

### Phase 3: Album Covers Enrichment (P1)

**Goal**: Update `albums-expanded.json` with Apple Music artwork URLs.

| Task | Description |
|------|-------------|
| 3.1 | Create `enrich-album-covers.js` script |
| 3.2 | For each album: search Apple Music → get artwork template |
| 3.3 | Update JSON with `appleMusicId`, `artworkTemplate` |
| 3.4 | Fallback to existing Discogs `coverUrl` if not found |
| 3.5 | Run script on full dataset (~30k albums) |

**Artwork Template Format**:
```json
{
  "artworkTemplate": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/abc123/{w}x{h}bb.jpg",
  "coverUrl": "https://i.discogs.com/..." // fallback
}
```

---

### Phase 4: Autocomplete Integration (P1)

**Goal**: Update autocomplete to use Apple Music discography and HD covers.

| Task | Description |
|------|-------------|
| 4.1 | Modify `AlbumLoader.js` to use `artworkTemplate` |
| 4.2 | Add size parameter (100px for dropdown, 500px for cards) |
| 4.3 | Filter by `albumType` in dataset (Studio, Live only) |
| 4.4 | Update `Autocomplete.js` to show HD thumbnails |

---

### Phase 5: Playlist Export (P2)

**Goal**: Allow users to export generated playlists to Apple Music.

| Task | Description |
|------|-------------|
| 5.1 | Add "Export to Apple Music" button in PlaylistsView |
| 5.2 | Implement user authorization flow (MusicKit.authorize()) |
| 5.3 | Create playlist in user library (music.api.createPlaylist) |
| 5.4 | Match tracks by ISRC or title+artist fuzzy match |
| 5.5 | Show success/warning modal with results |

**Authorization Scopes**:
```javascript
await music.authorize(); // Requests library write access
```

---

## Verification Plan

### Automated Tests

| Test | Location | Coverage |
|------|----------|----------|
| Token JWT validity | `test/services/MusicKitTokenService.test.js` | Signature, expiry, claims |
| MusicKitService mock | `test/services/MusicKitService.test.js` | Search, artwork construction |

### Manual Verification

| Scenario | Steps | Expected |
|----------|-------|----------|
| Cover quality | 1. Open /albums 2. View cards | 500px+ artwork, sharp |
| Autocomplete HD | 1. Type "Metallica" 2. View dropdown | HD thumbnails visible |
| Playlist export | 1. Generate playlist 2. Export | Playlist appears in Apple Music app |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Apple rejects token | Validate .p8 key format, test in dev first |
| Rate limiting | Implement exponential backoff, queue exports |
| Track not found | Show warning, allow manual search |
| User denies auth | Clear error message, retry option |

---

## Timeline Estimate

| Phase | Effort | Dependencies |
|-------|--------|--------------|
| Phase 1 (Token) | 2h | AuthKey .p8 in secrets |
| Phase 2 (Service) | 3h | Phase 1 |
| Phase 3 (Covers) | 4h | Phase 2 |
| Phase 4 (Autocomplete) | 2h | Phase 3 |
| Phase 5 (Export) | 4h | Phase 2 |
| **Total** | **~15h** | |

---

## Next Steps

1. User approves this plan
2. Create `tasks.md` with granular checklist
3. Begin Phase 1 implementation
