# Sprint 11: Implementation Plan

## Spotify Integration & Multi-Source Ranking

**Version**: 1.0  
**Date**: 2025-12-18  
**Branch**: `feature/sprint11-spotify-integration`  
**Estimated Duration**: 2 weeks

---

## Phase Overview

| Phase | Description | Duration | Priority |
|-------|-------------|----------|----------|
| **Phase 1** | Spotify OAuth Setup | 2 days | HIGH |
| **Phase 2** | Spotify Popularity Ranking | 2 days | HIGH |
| **Phase 3** | Multi-Source Ranking UX | 2 days | HIGH |
| **Phase 4** | Album Cards UI Update | 1 day | MEDIUM |
| **Phase 5** | Export to Spotify | 3 days | MEDIUM |
| **Phase 6** | Testing & Polish | 2 days | HIGH |

---

## Phase 1: Spotify OAuth Setup

### Files to Create/Modify

#### [NEW] `public/js/services/SpotifyAuthService.js`
```javascript
// Spotify OAuth with PKCE flow
// - generateCodeVerifier()
// - generateCodeChallenge()
// - initiateAuth()
// - handleCallback()
// - refreshToken()
// - isAuthenticated()
```

#### [MODIFY] `public/js/app.js`
- Add Spotify callback route handler
- Initialize SpotifyAuthService

#### [NEW] `public/js/components/SpotifyConnectButton.js`
- "Connect to Spotify" button component
- Shows connection status

### Environment Variables

```env
# .env (client-side via Vite)
VITE_SPOTIFY_CLIENT_ID=your_client_id
VITE_SPOTIFY_REDIRECT_URI=https://mjrp-playlist-generator.web.app/callback
```

---

## Phase 2: Spotify Popularity Ranking

### Files to Modify

#### [MODIFY] `server/lib/services/spotifyPopularity.js`
- Already exists (136 lines)
- Ensure it returns normalized ranking data

#### [MODIFY] `server/lib/fetchRanking.js`
- Add Spotify as fallback source
- Current: BestEver → AI
- New: BestEver → Spotify → Original

#### [NEW] `server/routes/spotify.js`
```javascript
// POST /api/spotify/album-ranking
// - Fetch album from Spotify
// - Get track popularity
// - Return ranked tracks
```

---

## Phase 3: Multi-Source Ranking UX

### Architecture: Container / Presenter Pattern

To solve the "Table on Desktop vs Tabs on Mobile" challenge, we will use a **Smart Container** that orchestrates two **Dumb Presenters**.

#### 1. Smart Container: `TracksRankingComparison.js`
- **State**:
  - `activeTab` (for mobile)
  - `sortField` (for desktop: 'original', 'acclaim', 'popularity')
  - `sortDirection` ('asc', 'desc')
- **Logic**:
  - **Averages Calculation**: Computes avg(Acclaim) and avg(Popularity) on mounting.
  - **Total Score**: Computes (avgAcclaim + avgPop) / 2.
  - **Normalization**: Ensures every track has a rank.
  - **Responsiveness**: Toggles between Table/Tabs presenters.

#### 2. Desktop Presenter: `TracksTable.js`
- **Props**: `sortedTracks`, `averages`, `albumLinks` (Spotify/BEA)
- **Render**:
  - Full width table
  - **Headers**:
    - "Track Name (Original Album Order)"
    - "Acclaim BEA Rank" (with Orange Badge)
    - "Spotify Popularity Rank" (with Green Badge)
  - **Footer**: Sticky footer showing consolidated averages.

#### 3. Mobile Presenter: `TracksTabs.js`
- **Props**: `tracks`, `activeTab`, `averages`
- **Render**:
  - Tab switcher.
  - Simplified list.
  - Mini-footer with scores.

---

### UI Mockups (Final Decision: Option 5 - Refined Table)

**Desktop (Table)**
```
┌────────────────────────────────────────────────────────────┐
│ Track Name (Original Album Order) | Acclaim BEA Rank | Pop |
├───────────────────────────────────┼──────────────────┼─────┤
│ 1. Stairway to Heaven             | #1 ⭐98          │ ... |
│ ...                               | ...              │ ... |
├───────────────────────────────────┼──────────────────┼─────┤
│ AVERAGES                          | ⭐ 92.0          │ ... |
└───────────────────────────────────┴──────────────────┴─────┘
```


**Mobile (Tabs)**
```
┌──────────────────────────────────────────────────┐
│ [ ORIGINAL ]   [ 🏆 ACCLAIM ]   [ 🟢 POPUL. ]    │
├──────────────────────────────────────────────────┤
│ 1. Stairway to Heaven           #4 Org   ⭐ 98   │
│ 2. Black Dog                    #1 Org   ⭐ 92   │
└──────────────────────────────────────────────────┘
```

---

### Integration Points

1. **AlbumsView (Expanded Card)**
   - Import `TracksRankingComparison`
   - Pass `album` object
   - Component handles its own layout

2. **ViewAlbumModal (Inventory)**
   - Same integration
   - Ensures consistent sorting/viewing experience across app

---

### Badge Variants (for headers)

| Source | Badge | Color |
|--------|-------|-------|
| BestEver | 🏆 ACCLAIM | `#f97316` (orange-500) |
| Spotify | 🟢 POPULARITY | `#1DB954` (Spotify green) |
| None | ⚪ ORIGINAL | `#6b7280` (gray-500) |

---

### Environment Variables
- `VITE_SPOTIFY_CLIENT_ID` (exposed to client - Auth Code with PKCE)
- `SPOTIFY_CLIENT_SECRET` (NOT used on client - PKCE flow)

---

## Phase 5: Export to Spotify (Generated Playlists Only)

### Export Progress Modal (Standardized)
This new component `ExportProgressModal.js` will eventually replace the Apple Music export UI to strictly maintain the same "Standard Pattern" across providers.

**UI State Machine:**
1. `IDLE`: [Export Button] active
2. `MATCHING`: "Searching Spotify for track 1/12..."
3. `CREATING`: "Creating playlist 'My Album'..."
4. `ADDING`: "Adding tracks..."
5. `SUCCESS`: "Done! [Open in Spotify]"
6. `ERROR`: Warning list of unmatched tracks.

---

## 🏗️ Holistic Architectural Analysis (AlbumsView & PlaylistsView)

### 1. The "God Object" Problem (AlbumsView.js)
Current State: `AlbumsView.js` is ~1300 lines, handling too many responsibilities (Filtering, Search, Grid Rendering, Modal Logic, etc.).
**Refactoring Strategy (Sprint 11)**:
- By creating `TracksRankingComparison.js` (Container), we are **extracting** the complex ranking logic OUT of `VIEW` scope.
- `AlbumsView.js` will no longer manually render track lists; it will simply mount the new Container.
- **Impact**: Reduces `AlbumsView.js` complexity and prevents "spaghetti code" when adding a 3rd data source.

### 2. Service Layer Pattern (PlaylistsView.js)
Current State: `PlaylistsView.js` directly calls `albumsStore`, `playlistsStore`, and contains significant business logic in `handleGenerate`.
**Refactoring Strategy (Sprint 11)**:
- We introducing `SpotifyService.js` and `MusicKitService.js` to handle all external IO.
- The View becomes a "dumb" consumer of services, moving towards a proper MVC/MVVM separation.
- **Benefit**: Debugging "Export" issues will be isolated to the Service files, not the UI view file.

### 3. Modularity & Reusability
- **Container/Presenter**: The new `TracksRankingComparison` is context-agnostic. It works in the expanded Album Card, Inventory Modal, and future views without code availability duplication.
- **Standardized Modals**: The `ExportProgressModal` standardizes the "Async Task UI" pattern, replacing ad-hoc loading states in `PlaylistsView`.

**Clean Code Verdict**: This sprint is not just adding features; it is actively **reducing technical debt** by enforcing a strict separation between Data (Service), Logic (Container), and UI (Presenter) across the two main Views.

---

## Phase 6: Testing & Polish

---

## Phase 6: Testing & Polish

### Test Cases

| # | Test Case | Expected Result |
|---|-----------|-----------------|
| 1 | Spotify OAuth flow | Successful login, token stored |
| 2 | Album with BestEver data | Shows ACCLAIM badge |
| 3 | Album without BestEver | Falls back to POPULARITY badge |
| 4 | Album without both | Shows ORIGINAL badge |
| 5 | Export 50-track playlist | >90% tracks matched |
| 6 | Token expired mid-export | Auto-refresh, continue |
| 7 | Spotify disconnected | Clear error, reconnect option |

---

## Files Summary

### New Files (8)

| File | Purpose | Est. Lines |
|------|---------|------------|
| `SpotifyAuthService.js` | OAuth PKCE flow | ~150 |
| `SpotifyConnectButton.js` | Connect button component | ~50 |
| `SpotifyExportModal.js` | Export UI | ~200 |
| `server/routes/spotify.js` | Spotify API routes | ~100 |
| `spec.md` | This specification | - |
| `plan.md` | This plan | - |
| `tasks.md` | Task checklist | - |

### Modified Files (6)

| File | Changes |
|------|---------|
| `AlbumsView.js` | Add Spotify badge, link |
| `PlaylistsView.js` | Add Spotify export option |
| `fetchRanking.js` | Add Spotify fallback |
| `spotifyPopularity.js` | Enhance ranking output |
| `app.js` | Spotify callback route |
| `animations.css` | Spotify brand colors |

---

## Next Steps

1. ✅ Create `spec.md` (DONE)
2. ✅ Create `plan.md` (DONE)
3. 🔜 Create `tasks.md` with checklist
4. 🔜 User approval of plan
5. 🔜 Start Phase 1 implementation
