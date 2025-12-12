# Sprint 7 Tasks: Apple Music Integration

**Created**: 2025-12-12 | **Status**: ✅ Complete | **Tag**: v2.2.1

---

## Phase 1: Token Generation (P1) ✅

- [x] **1.1** Store AuthKey .p8 in GCP Secret Manager
    - [x] Create Media ID + MusicKit Key in Apple Developer Portal
    - [x] Create secrets: `musickit-team-id`, `musickit-key-id`, `musickit-private-key`
    - [x] Add to `cloudbuild.yaml` with `--set-secrets`
- [x] **1.2** Create `server/services/MusicKitTokenService.js`
    - [x] Read credentials from environment
    - [x] Generate JWT with ES256 algorithm
    - [x] Include correct claims (iss, iat, exp)
- [x] **1.3** Create `/api/musickit-token` endpoint
    - [x] Add route in `server/routes/musickit.js`
    - [x] Mount route in `server/index.js`
    - [x] Return token with expiry info

---

## Phase 2: MusicKit Frontend Service (P1) ✅

- [x] **2.1** Create `public/js/services/MusicKitService.js`
    - [x] Singleton pattern
    - [x] Fetch developer token from backend
    - [x] Configure MusicKit instance dynamically
- [x] **2.2** Implement core methods
    - [x] `init()` - Initialize MusicKit
    - [x] `searchAlbums(artist, album)` - Search catalog
    - [x] `getArtworkUrl(template, size)` - Dynamic URL construction
    - [x] `getArtistAlbums(artistName)` - Official discography

---

## Phase 3: Album Covers Enrichment (P1) ✅

- [x] **3.1** Create `scripts/enrich-album-covers.js`
    - [x] Read `albums-expanded.json`
    - [x] Search Apple Music for each album
    - [x] Extract artwork template URL with {w}x{h} placeholders
- [x] **3.2** Update data model
    - [x] Add `appleMusicId` field
    - [x] Add `artworkTemplate` field
    - [x] Keep `coverUrl` as Discogs fallback
- [x] **3.3** Enrichment running
    - ✅ Script running in background on 30k+ albums

---

## Phase 4: Autocomplete Integration (P1) ✅

- [x] **4.1** Update `AlbumLoader.js`
    - [x] Add `getArtworkUrl(album, size)` method
    - [x] Construct URL with dynamic size parameter
    - [x] Fallback to `coverUrl` (Discogs)
- [x] **4.2** Update `Autocomplete.js`
    - [x] Request 100px thumbnails for dropdown
    - [x] Use loader.getArtworkUrl for dynamic sizing

---

## Phase 5: Playlist Export (P2) ✅

- [x] **5.1** Add UI components
    - [x] "Export to Apple Music" button with Apple logo
    - [x] Apple gradient styling (pink/red)
    - [x] Hidden Spotify button (future sprint)
- [x] **5.2** Implement authorization flow
    - [x] Call `MusicKit.authorize()`
    - [x] Handle user consent in popup
- [x] **5.3** Implement playlist creation
    - [x] `handleExportToAppleMusic()` in PlaylistsView
    - [x] Track matching via `findTrack(title, artist)`
    - [x] Create playlists via `createPlaylist(name, trackIds)`
    - [x] Report unmatched tracks with toast
- [x] **5.4** Testing
    - [x] Verified: Export works ✅

---

## Phase 6: Verification ✅

- [x] Token endpoint returns valid JWT
- [x] Autocomplete shows album covers
- [x] Playlist export creates playlists in Apple Music
- [x] UI polish: Apple-styled button with logo
