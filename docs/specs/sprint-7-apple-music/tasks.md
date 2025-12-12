# Sprint 7 Tasks: Apple Music Integration

**Created**: 2025-12-12 | **Status**: In Progress

---

## Phase 1: Token Generation (P1)

- [ ] **1.1** Store AuthKey .p8 in GCP Secret Manager
    - [ ] Create secret `musickit-authkey-p8`
    - [ ] Add to Cloud Run service account permissions
    - [ ] Add env var reference in `cloudbuild.yaml`
- [ ] **1.2** Create `server/services/MusicKitTokenService.js`
    - [ ] Read .p8 key from secrets
    - [ ] Generate JWT with ES256 algorithm
    - [ ] Include correct claims (iss, iat, exp, sub)
- [ ] **1.3** Create `/api/musickit-token` endpoint
    - [ ] Add route in `server/routes/musickit.js`
    - [ ] Mount route in `server/index.js`
    - [ ] Return token with expiry info
- [ ] **1.4** Unit tests for token generation
    - [ ] Test JWT structure
    - [ ] Test expiry validation
    - [ ] Test error handling (missing key)

---

## Phase 2: MusicKit Frontend Service (P1)

- [ ] **2.1** Create `public/js/services/MusicKitService.js`
    - [ ] Singleton pattern
    - [ ] Fetch developer token from backend
    - [ ] Configure MusicKit instance
- [ ] **2.2** Implement core methods
    - [ ] `init()` - Initialize MusicKit
    - [ ] `searchAlbums(artist, album)` - Search catalog
    - [ ] `getArtworkUrl(album, size)` - Dynamic URL construction
    - [ ] `getArtistAlbums(artistId)` - Official discography
- [ ] **2.3** Error handling
    - [ ] Handle auth failures
    - [ ] Handle rate limits
    - [ ] Graceful degradation

---

## Phase 3: Album Covers Enrichment (P1)

- [ ] **3.1** Create `scripts/enrich-album-covers.js`
    - [ ] Read `albums-expanded.json`
    - [ ] Search Apple Music for each album
    - [ ] Extract artwork template URL
- [ ] **3.2** Update data model
    - [ ] Add `appleMusicId` field
    - [ ] Add `artworkTemplate` field
    - [ ] Keep `coverUrl` as Discogs fallback
- [ ] **3.3** Run enrichment
    - [ ] Process ~30k albums with rate limiting
    - [ ] Save progress periodically
    - [ ] Log success/failure stats

---

## Phase 4: Autocomplete Integration (P1)

- [ ] **4.1** Update `AlbumLoader.js`
    - [ ] Use `artworkTemplate` when available
    - [ ] Construct URL with dynamic size parameter
    - [ ] Fallback to `coverUrl` (Discogs)
- [ ] **4.2** Update `Autocomplete.js`
    - [ ] Request 100px thumbnails for dropdown
    - [ ] Lazy load images
- [ ] **4.3** Update `AlbumsView.js`
    - [ ] Request 500px for album cards
    - [ ] Request 1000px for detail view

---

## Phase 5: Playlist Export (P2)

- [ ] **5.1** Add UI components
    - [ ] "Export to Apple Music" button in PlaylistsView
    - [ ] Export progress modal
    - [ ] Success/warning result modal
- [ ] **5.2** Implement authorization flow
    - [ ] Call `MusicKit.authorize()`
    - [ ] Handle user consent/denial
    - [ ] Store authorization state
- [ ] **5.3** Implement playlist creation
    - [ ] Create playlist via `music.api.library.createPlaylist()`
    - [ ] Add tracks by ISRC match
    - [ ] Fallback to title+artist fuzzy match
    - [ ] Report unmatched tracks
- [ ] **5.4** Testing
    - [ ] Test on iOS Safari
    - [ ] Test on Chrome
    - [ ] Verify playlist in Apple Music app

---

## Phase 6: Verification

- [ ] **6.1** Automated tests pass
- [ ] **6.2** Manual: Cover quality 500px+ verified
- [ ] **6.3** Manual: Autocomplete shows HD thumbnails
- [ ] **6.4** Manual: Playlist exports to Apple Music
- [ ] **6.5** User final approval
