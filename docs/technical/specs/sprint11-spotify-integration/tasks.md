# Sprint 11: Tasks Checklist

## Spotify Integration & Multi-Source Ranking

**Branch**: `feature/sprint11-spotify-integration`  
**Created**: 2025-12-18  
**Status**: 📋 PLANNING

---

## Phase 1: Spotify OAuth Setup (2 days)

### Setup
- [ ] Register app in Spotify Developer Dashboard
- [ ] Get Client ID (don't need Client Secret for PKCE)
- [ ] Configure redirect URIs (localhost + production)
- [ ] Set required scopes: `playlist-modify-public`, `playlist-modify-private`, `user-read-private`

### Implementation
- [ ] Create `SpotifyAuthService.js`
  - [ ] `generateCodeVerifier()` - Random 128 chars
  - [ ] `generateCodeChallenge()` - SHA256 + Base64URL
  - [ ] `initiateAuth()` - Opens Spotify login popup
  - [ ] `handleCallback()` - Exchange code for tokens
  - [ ] `refreshToken()` - Auto-refresh expired tokens
  - [ ] `isAuthenticated()` - Check token validity
  - [ ] `logout()` - Clear tokens
- [ ] Create `SpotifyConnectButton.js` component
- [ ] Add callback route handler in `app.js`
- [ ] Store tokens in localStorage

### Verification
- [ ] Test OAuth flow in localhost
- [ ] Test OAuth flow in production
- [ ] Verify token refresh works

---

## Phase 2: Spotify Popularity Ranking (2 days)

### Backend
- [ ] Review existing `spotifyPopularity.js`
- [ ] Ensure it returns:
  - [ ] `spotifyId` - Album ID
  - [ ] `spotifyUrl` - Album URL
  - [ ] `tracks[].popularity` - 0-100 value
  - [ ] `tracks[].spotifyPopularityRank` - Calculated rank
- [ ] Create `server/routes/spotify.js`
  - [ ] `POST /api/spotify/album-ranking` endpoint

### Integration
- [ ] Modify `fetchRanking.js`
  - [ ] Add Spotify as fallback after BestEver fails
  - [ ] Logic: BestEver → Spotify → Original order
  - [ ] Set `rankingSource` field on album

### Data Model
- [ ] Add fields to Album object:
  - [ ] `spotifyId`
  - [ ] `spotifyUrl`
  - [ ] `rankingSource` ("acclaim" | "popularity" | "original")
- [ ] Add fields to Track object:
  - [ ] `spotifyPopularityRank`

---

## Phase 3: Multi-Source Ranking UX (2 days)

### AlbumsView - Expanded Card
- [ ] Implement Tab UI for ranking selection
  - [ ] Tab 1: "Ranked by Acclaim" (BestEver)
  - [ ] Tab 2: "Ranked by Popularity" (Spotify)
- [ ] Keep "Original Order" column fixed on left
- [ ] Show active tab based on `rankingSource`
- [ ] Disable unavailable tab (if source not available)

### Responsive Design
- [ ] Desktop (≥1024px): Consider 3-column layout
- [ ] Mobile (<1024px): Tabs only
- [ ] Test on various screen sizes

### Visual Indicators
- [ ] Popularity bar visualization (0-100)
- [ ] Different styling for each ranking source

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
| Phase 1: OAuth | 15 | ⬜ Not Started |
| Phase 2: Ranking | 12 | ⬜ Not Started |
| Phase 3: Ranking UX | 8 | ⬜ Not Started |
| Phase 4: Cards UI | 8 | ⬜ Not Started |
| Phase 5: Export | 12 | ⬜ Not Started |
| Phase 6: Testing | 16 | ⬜ Not Started |
| **Total** | **71** | **0% Complete** |

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
