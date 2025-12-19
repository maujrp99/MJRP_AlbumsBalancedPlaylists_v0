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

### UI Mockups - AlbumsView Expanded Card

**Current Layout (2 columns):**
```
┌─────────────────────────────────────────────────────────────────────┐
│  [Album Cover]  LED ZEPPELIN IV                                      │
│                 Led Zeppelin (1971)                                  │
│                 🏆 ACCLAIM                                           │
├───────────────────────────────┬─────────────────────────────────────┤
│  ORIGINAL ORDER               │  RANKED BY ACCLAIM                  │
├───────────────────────────────┼─────────────────────────────────────┤
│  1. Black Dog                 │  1. Stairway to Heaven    ⭐ 98     │
│  2. Rock and Roll             │  2. Black Dog             ⭐ 92     │
│  3. The Battle of Evermore    │  3. When the Levee Breaks ⭐ 90     │
│  4. Stairway to Heaven        │  4. Rock and Roll         ⭐ 88     │
│  5. Misty Mountain Hop        │  5. Going to California   ⭐ 85     │
│  6. Four Sticks               │  6. The Battle of Evermore⭐ 82     │
│  7. Going to California       │  7. Misty Mountain Hop    ⭐ 78     │
│  8. When the Levee Breaks     │  8. Four Sticks           ⭐ 65     │
└───────────────────────────────┴─────────────────────────────────────┘
```

---

### NEW Layout Option A: Tabs (Recommended)

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Album Cover]  LED ZEPPELIN IV                                      │
│                 Led Zeppelin (1971)                                  │
│                 🏆 ACCLAIM  🔗[Spotify]                              │
├─────────────────────────────────────────────────────────────────────┤
│  ORIGINAL ORDER  │  [ ACCLAIM ] ← selected │  [ POPULARITY ]        │
├───────────────────────────────┬─────────────────────────────────────┤
│  1. Black Dog                 │  1. Stairway to Heaven    ⭐ 98     │
│  2. Rock and Roll             │  2. Black Dog             ⭐ 92     │
│  3. The Battle of Evermore    │  3. When the Levee Breaks ⭐ 90     │
│  4. Stairway to Heaven        │  4. Rock and Roll         ⭐ 88     │
│  ...                          │  ...                                │
└───────────────────────────────┴─────────────────────────────────────┘
```

**Pros:**
- Clean, no horizontal scroll
- Easy to compare Original vs Selected Ranking
- Mobile-friendly

**Cons:**
- Can't see both rankings simultaneously

---

### NEW Layout Option B: Three Columns

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  [Album Cover]  LED ZEPPELIN IV                                                         │
│                 Led Zeppelin (1971)                 🏆 ACCLAIM  🟢 POPULARITY           │
├────────────────────────────┬───────────────────────────┬───────────────────────────────┤
│  ORIGINAL ORDER            │  RANKED BY ACCLAIM        │  RANKED BY POPULARITY         │
├────────────────────────────┼───────────────────────────┼───────────────────────────────┤
│  1. Black Dog              │  1. Stairway ⭐98         │  1. Stairway    ▓▓▓▓▓▓▓ 95    │
│  2. Rock and Roll          │  2. Black Dog ⭐92        │  2. Black Dog   ▓▓▓▓▓▓  88    │
│  3. The Battle of...       │  3. When the Levee ⭐90   │  3. Rock n Roll ▓▓▓▓▓   82    │
│  4. Stairway to Heaven     │  4. Rock and Roll ⭐88    │  4. When Levee  ▓▓▓▓    75    │
│  ...                       │  ...                      │  ...                          │
└────────────────────────────┴───────────────────────────┴───────────────────────────────┘
```

**Pros:**
- Compare all 3 rankings at once
- Clear visual differentiation

**Cons:**
- May need horizontal scroll on mobile
- Crowded on small screens

---

### NEW Layout Option C: Hybrid (Best of Both)

**On Desktop (≥1024px):** 3 columns
**On Mobile (<1024px):** Tabs

```javascript
// Responsive rendering
if (window.innerWidth >= 1024) {
  return renderThreeColumnLayout()
} else {
  return renderTabsLayout()
}
```

---

### Recommendation: **Option C (Hybrid)**

1. Desktop users get full comparison view
2. Mobile users get tab-based clean interface
3. Implement Option A (Tabs) first, then add Option B for desktop

---

## Phase 4: Album Cards UI Update

### Compact View Changes

**Current:**
```
┌──────────────┐
│ [Cover]      │
│ Album Title  │
│ Artist       │
│ 🏆 ACCLAIM   │
└──────────────┘
```

**New:**
```
┌──────────────┐
│ [Cover]      │
│ Album Title  │
│ Artist       │
│ 🏆 ACCLAIM   │
│ 🔗 Spotify   │ ← NEW: Clickable link
└──────────────┘
```

### Badge Variants

| Source | Badge | Color |
|--------|-------|-------|
| BestEver | 🏆 ACCLAIM | `#22c55e` (green-500) |
| Spotify | 🟢 POPULARITY | `#1DB954` (Spotify green) |
| None | ⚪ ORIGINAL | `#6b7280` (gray-500) |

---

## Phase 5: Export to Spotify

### Export Flow Mockup

```
┌─────────────────────────────────────────────────────┐
│                   EXPORT PLAYLIST                    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Select Destination:                                 │
│                                                      │
│  ┌──────────────────┐  ┌──────────────────┐         │
│  │  🍎 Apple Music  │  │  🎵 Spotify     │          │
│  │    Connected!    │  │   [Connect]     │          │
│  └──────────────────┘  └──────────────────┘         │
│                                                      │
│  Playlist Name: ________________________             │
│                                                      │
│  [ Export to Spotify ]                               │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Export Progress Modal

```
┌─────────────────────────────────────────────────────┐
│              EXPORTING TO SPOTIFY                    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ████████████████████░░░░░░░░░░  65%                │
│                                                      │
│  Matching tracks...                                  │
│  ✅ Stairway to Heaven - Led Zeppelin               │
│  ✅ Black Dog - Led Zeppelin                        │
│  ⏳ Rock and Roll - Led Zeppelin...                 │
│                                                      │
│  Found: 42/45 tracks                                 │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Export Success Modal

```
┌─────────────────────────────────────────────────────┐
│                 🎉 SUCCESS!                          │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Playlist "Greatest Hits" created in Spotify!       │
│                                                      │
│  ✅ 42 tracks added                                  │
│  ⚠️ 3 tracks not found (see details)                │
│                                                      │
│  [ View Not Found ]  [ Open in Spotify ]            │
│                                                      │
└─────────────────────────────────────────────────────┘
```

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
