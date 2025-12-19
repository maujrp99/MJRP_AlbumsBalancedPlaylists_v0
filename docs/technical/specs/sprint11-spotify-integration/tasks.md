# Sprint 11: Tasks Checklist

## Spotify Integration & Multi-Source Ranking

**Branch**: `feature/sprint11-spotify-integration`  
**Created**: 2025-12-18  
**Status**: 📋 PLANNING

---

## Phase 1: Spotify OAuth Setup (2 days)

### Setup
- [x] Register app in Spotify Developer Dashboard
- [x] Get Client ID (don't need Client Secret for PKCE)
- [x] Configure redirect URIs (localhost + production)
- [x] Set required scopes: `playlist-modify-public`, `playlist-modify-private`, `user-read-private`

### Implementation
- [x] Create `SpotifyAuthService.js`
  - [x] `generateCodeVerifier()` - Random 128 chars
  - [x] `generateCodeChallenge()` - SHA256 + Base64URL
  - [x] `initiateAuth()` - Opens Spotify login popup
  - [x] `handleCallback()` - Exchange code for tokens
  - [x] `refreshToken()` - Auto-refresh expired tokens
  - [x] `isAuthenticated()` - Check token validity
  - [x] `logout()` - Clear tokens
- [x] Create `SpotifyConnectButton.js` component
- [x] Add callback route handler in `app.js`
- [x] Store tokens in localStorage

### Verification
- [x] Test OAuth flow in localhost
- [x] Test OAuth flow in production
- [x] Verify token refresh works

---

## Phase 2: Spotify Popularity Ranking (2 days)

### Core Service Logic
- [x] Create `public/js/services/SpotifyService.js`
  - [x] `searchAlbum(artist, albumName)` -> returns Spotify ID
  - [x] `getAlbumDetails(spotifyId)` -> returns tracks with popularity
  - [x] `getAlbumTracksWithPopularity(spotifyId)` -> returns tracks with popularity
  - [x] `calculateAveragePopularity(tracks)` -> returns 0-100 avg
  - [x] Error handling (401 -> refresh token -> retry)
  - [x] **Verification**: Tested via Console.

### Integration
- [x] Update `Album` model (in memory/store) to hold:
  - `spotifyId`
  - `spotifyPopularity` (0-100)
  - `spotifyUrl`
  - `spotifyImages`
- [ ] Update `AlbumsScopedRenderer` (or new logic) to fetch this data on demand (Lazy Loading) to avoid rate limits?
  *Decision*: Fetch only when "Expanded View" is opened OR when "Enrich" is clicked?
  *Refinement*: Plan says "Lazy load when user expands album".

---

### Data Model
- [ ] Add fields to Album object:
  - [ ] `spotifyId`
  - [ ] `spotifyUrl`
  - [ ] `rankingSource` ("acclaim" | "popularity" | "original")
- [ ] Add fields to Track object:
  - [ ] `spotifyPopularityRank`

---

---

## Phase 3: Multi-Source Ranking UX (2 days)

### Architecture Components
- [ ] Create `public/js/components/ranking/TracksRankingComparison.js` (Smart Container)
  - [ ] Logic: `calculateAverages(tracks)`
  - [ ] State: `activeTab`, `sortField`, `sortDirection`
  - [ ] Data normalization & Resize listener
- [ ] Create `public/js/components/ranking/TracksTable.js` (Desktop Presenter)
  - [ ] Headers: "Track Name (Original)", "Acclaim BEA Rank", "Spotify Popularity Rank"
  - [ ] Render Footer with calculated Averages
  - [ ] Render Header Links (Spotify + BEA)
- [ ] Create `public/js/components/ranking/TracksTabs.js` (Mobile Presenter)
  - [ ] Render Tab Switcher & Simple List
  - [ ] Render Mini-Footer with scores

### Integration
- [ ] **AlbumsView (Expanded)**
  - [ ] Import `TracksRankingComparison`
  - [ ] Replace existing layout
  - [ ] Remove old manual rendering logic

- [ ] **Inventory View (Modal)**
  - [ ] Update `ViewAlbumModal.js` to use `TracksRankingComparison`
  - [ ] Verify styling consistency within modal
  - [ ] **CRITICAL FIX**: Debug and fix "Add/Remove from Inventory" buttons logic (reported buggy)

### Stylization
- [ ] Implement sorting animations (optional nice-to-have)
- [ ] Ensure "Sticky Headers" for long track lists
- [ ] Tooltip implementation for "Pending" or "Low Data" states

---

## Phase 4: Album Cards UI Update (1 day)

### Compact View
- [ ] Add Spotify icon/link to album cards
- [ ] Show correct badge based on `rankingSource`:
  - [ ] 🏆 ACCLAIM (green) - BestEver
  - [ ] 🟢 POPULARITY (Spotify green) - Spotify
  - [ ] ⚪ ORIGINAL (gray) - None

### Badge Styling
- [ ] Create CSS for Spotify brand color (`#1DB954`)
- [ ] Ensure badges are consistent with existing design

### Spotify Link
- [ ] Add clickable Spotify icon
- [ ] Opens `spotifyUrl` in new tab
- [ ] Tooltip: "Open in Spotify"

---

## Phase 5: Export to Spotify (3 days)

### UI Components
- [ ] Create `SpotifyExportModal.js`
  - [ ] Select destination (Apple Music / Spotify)
  - [ ] Playlist name input
  - [ ] Export button
- [ ] Create progress modal
  - [ ] Progress bar
  - [ ] Track matching status
  - [ ] Found/Not found count
- [ ] Create success modal
  - [ ] Success message
  - [ ] "Open in Spotify" button
  - [ ] "View Not Found" expand

### Export Logic
- [ ] Implement track matching via Spotify Search API
- [ ] Handle rate limiting (batch requests)
- [ ] Create playlist via Spotify API
- [ ] Add matched tracks to playlist
- [ ] Report unmatched tracks

### Integration
- [ ] Add "Export to Spotify" button in PlaylistsView
- [ ] Disable if not connected to Spotify
- [ ] Show connection status

---

## Phase 6: Testing & Polish (2 days)

### Functional Tests
- [ ] OAuth flow - happy path
- [ ] OAuth flow - user denies
- [ ] OAuth flow - token refresh
- [ ] Popularity ranking - album with BestEver
- [ ] Popularity ranking - album without BestEver
- [ ] Export - 10-track playlist
- [ ] Export - 50-track playlist
- [ ] Export - tracks not found handling

### UI/UX Tests
- [ ] Desktop layout
- [ ] Mobile layout
- [ ] Dark mode compatibility
- [ ] Loading states
- [ ] Error states

### Edge Cases
- [ ] Spotify disconnected mid-export
- [ ] Network failure
- [ ] Rate limit exceeded
- [ ] Album not found in Spotify

### Documentation
- [ ] Update SPOTIFY_SETUP.md
- [ ] Update CHANGELOG.md
- [ ] Update README if needed

---

## Summary

| Phase | Tasks | Status |
|-------|-------|--------|
| Phase 1: OAuth | 15 | ✅ Complete |
| Phase 2: Ranking | 12 | ✅ Complete |
| Phase 3: Ranking UX | 8 | 🔄 In Progress |
| Phase 4: Cards UI | 8 | ⬜ Not Started |
| Phase 5: Export | 12 | ⬜ Not Started |
| Phase 6: Testing | 16 | ⬜ Not Started |
| **Total** | **71** | **38% Complete** |

---

## Quick Start (First Task)

After user approval:

```bash
# 1. Create SpotifyAuthService.js
touch public/js/services/SpotifyAuthService.js

# 2. Get Spotify Client ID from Dashboard
# https://developer.spotify.com/dashboard

# 3. Add to .env
echo "VITE_SPOTIFY_CLIENT_ID=your_id" >> .env
```
