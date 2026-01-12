# User-Generated Track Ranking - Specification (Extended)

**Sprint**: 20 (Phase 2: Functional Completion)
**Status**: ✅ COMPLETED
**Last Updated**: 2026-01-12

---

## 1. Overview

### 1.1 What
Finalize the integration of the "My Own Ranking" recipe into the Blending Menu. While the ranking data and UI are functional, the recipe itself needs to be fully wired up to behave like the existing Top N recipes (BEA/Spotify).

### 1.2 Success Criteria
- [x] User can drag-and-drop reorder tracks within an album.
- [x] User ranking is persisted per album (Firestore + IndexedDB).
- [x] **Functional Recipe**: "My Own Ranking" recipe appears in Blending Menu and is selectable.
- [ ] **Option Parity**: The recipe must show "Top N Count" and "Grouping" options.
- [ ] **Execution Logic**: Selecting this recipe must correctly trigger `TopNUserAlgorithm` using the user's custom rankings.
- [ ] **Verification**: Playlists generated with this recipe must follow the user's specific track order (falling back to original order for unranked tracks).

---

## 2. Functional Requirements

### 2.1 Core Features

| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| F1 | Rank Tracks UI | Drag-and-drop interface to reorder tracks (partial ranking OK) | P0 |
| F2 | Persist Ranking | Save to Firestore per user/album | P0 |
| F3 | User Badge Display | Incandescent blue badge in all track views | P0 |
| F4 | Recipe Integration | "Top Tracks by My Own Ranking" using TopN algorithm | P0 |
| F5 | Title Prefix | "UGR Top N" prefix on generated playlists | P0 |
| F6 | Fallback Behavior | Use Balanced strategy for unranked albums | P1 |

### 2.2 User Stories

1. **As a user**, I want to rank tracks in my favorite albums according to MY preference.
2. **As a user**, I want to see my personal rank displayed alongside Spotify/BEA ranks.
3. **As a user**, I want to generate playlists using my personal rankings as the source.

---

## 3. UI Specifications

### 3.1 Color System

| Source | Color | Hex | CSS Class |
|--------|-------|-----|-----------|
| BestEverAlbums (Acclaim) | Orange | `#F97316` | `text-brand-orange`, `bg-brand-orange/10` |
| Spotify (Popularity) | Green | `#1DB954` | `text-[#1DB954]`, `bg-[#1DB954]/10` |
| **User Ranking (NEW)** | Incandescent Blue | `#0EA5E9` | `text-sky-500`, `bg-sky-500/10` |

> [!NOTE]
> **Incandescent Blue** (`#0EA5E9` / sky-500) provides a vibrant, flame-like blue that stands out 
> from the standard blue while complementing the orange/green palette.

### 3.2 Badge Appearance

```html
<!-- User Rank Badge (Incandescent Blue) -->
<span class="inline-flex items-center justify-center w-6 h-6 
             rounded-full bg-sky-500/10 text-sky-500 
             text-[10px] font-bold border border-sky-500/20"
      title="Your Rank">
  #1
</span>
```

---

### 3.3 SeriesView Changes

> [!IMPORTANT]
> The **TracksTable** component is shared between Grid and List modes. 
> Changes apply to BOTH views automatically.

#### 3.3.1 Grid/Compact Mode (Card Layout)

**Current state**: Buttons (+, 🗑️) are in the top-right corner of the card.

**Proposed change**: 
- Move buttons below the album title, aligned RIGHT
- Add "⭐ Rank It" button aligned LEFT

```
┌────────────────────────────────────┐
│         ┌──────────────┐           │
│         │              │           │
│         │  ALBUM COVER │           │
│         │              │           │
│         └──────────────┘           │
│                                    │
│  WhentheP...   Voodoo   D'Angola   │
│  Fiona Apple   D'Angelo  D'Angelo  │
│                                    │
│  ┌──────────┐        ┌───┐ ┌───┐   │
│  │⭐ Rank It│        │ + │ │ 🗑️│   │
│  └──────────┘        └───┘ └───┘   │
│  (LEFT)              (RIGHT)       │
│                                    │
│  @ BESTEVERALBUMS     @ Spotify    │
└────────────────────────────────────┘
```

When album is ranked:
```
│  ┌─────────────┐      ┌───┐ ┌───┐  │
│  │💎 Ranked ✓ │      │ + │ │ 🗑️│  │
│  └─────────────┘      └───┘ └───┘  │
```

---

#### 3.3.2 List/Expanded Mode (Full Track Table)

**Current state**: Track table with columns: #, TRACK NAME, BESTEVERALBUMS, POPULARITY, TIME

**Proposed changes**:
1. Add "MY RANK" column AFTER TRACK NAME, BEFORE BESTEVERALBUMS
2. Default table order: **Original album track order**
3. Move Avg Rank and Avg Pop to ABOVE the table

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Alternative R&B/Psychedelic/Avant/Neo Soul              (3 albums)   [📝] [🗑️] │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌────────┐   🎵 When the Pawn...                                              │
│  │        │   Fiona Apple                                                      │
│  │ COVER  │   ┌──────────────────┐ ┌────────────┐                              │
│  │        │   │ @ BESTEVERALBUMS │ │ @ SPOTIFY  │                              │
│  └────────┘   └──────────────────┘ └────────────┘                              │
│                                                                                 │
│  ┌────────────┐  ┌────────────┐  ┌──────────┐              1999   10 TRACKS    │
│  │ ⭐ Rank It │  │+ Inventory │  │  Remove  │                                  │
│  └────────────┘  └────────────┘  └──────────┘                                  │
│                                                                                 │
│                       🏆 Avg BEA Rank: 5.5    🎵 Avg Spotify Pop: 56.7%        │
│                                                                                 │
│  ╔══════╦════════════════════╦═══════════╦═══════════════════╦════════════╦════╗
│  ║  #   ║  TRACK NAME        ║  MY RANK  ║  BESTEVERALBUMS   ║ POPULARITY ║TIME║
│  ║      ║                    ║   (NEW)   ║                   ║            ║    ║
│  ╠══════╬════════════════════╬═══════════╬═══════════════════╬════════════╬════╣
│  ║  1   ║ On the Bound       ║   #2 💎   ║ #2  ★87  🟠      ║ #7   54%   ║--:-║
│  ║  2   ║ To Your Love       ║   #6 💎   ║ #6  ★84  🟠      ║ #9   51%   ║--:-║
│  ║  3   ║ Limp               ║   #3 💎   ║ #3  ★87  🟠      ║ #5   55%   ║--:-║
│  ║  4   ║ Love Ridden        ║  #10 💎   ║ #10 ★82  🟠      ║ #10  51%   ║--:-║
│  ║  5   ║ Paper Bag          ║   #4 💎   ║ #4  ★87  🟠      ║ #1   67%   ║--:-║
│  ║  6   ║ A Mistake          ║   #9 💎   ║ #9  ★83  🟠      ║ #6   55%   ║--:-║
│  ║  7   ║ Fast As You Can    ║   #1 💎   ║ #1  ★88  🟠      ║ #4   57%   ║--:-║
│  ║  8   ║ The Way Things Are ║   #7 💎   ║ #7  ★84  🟠      ║ #8   54%   ║--:-║
│  ║  9   ║ Get Gone           ║   #5 💎   ║ #5  ★86  🟠      ║ #3   60%   ║--:-║
│  ║ 10   ║ I Know             ║   #8 💎   ║ #8  ★84  🟠      ║ #2   63%   ║--:-║
│  ╚══════╩════════════════════╩═══════════╩═══════════════════╩════════════╩════╝
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Column Order** (left to right):
1. `#` - Original album position
2. `TRACK NAME` - Song title + artist
3. `MY RANK` (NEW) - User ranking, incandescent blue badge
4. `BESTEVERALBUMS` - Orange badge + rating
5. `POPULARITY` - Green badge + percentage
6. `TIME` - Duration

**MY RANK Column States**:

| State | Display | Action |
|-------|---------|--------|
| Not ranked | `-` (gray) | Click opens Rank Modal |
| Ranked | `#N 💎` (incandescent blue) | Click opens Rank Modal |

---

#### 3.3.3 Rank Modal (Shared)

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back                                    💾 Save   ↺ Reset   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🎵 Rank Your Album                                            │
│     When the Pawn... - Fiona Apple                             │
│                                                                 │
│  Drag tracks to set your personal ranking:                     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ⋮⋮  1.  Fast As You Can       #1 BEA  #4 SPFY    4:23   │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ ⋮⋮  2.  On the Bound          #2 BEA  #7 SPFY    3:45   │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ ⋮⋮  3.  Limp                  #3 BEA  #5 SPFY    5:01   │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ ⋮⋮  4.  Paper Bag             #4 BEA  #1 SPFY    4:12   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ⋮⋮ = Drag handle (partial ranking allowed)                   │
│                                                                 │
│  💡 BEA and Spotify ranks shown for reference.                 │
│     Your ranking will be used when selecting                   │
│     "Top Tracks by My Own Ranking" in the Blending Menu.       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3.4 TracksTable Component Changes

**File**: `public/js/components/ranking/TracksTable.js`

| Change | Description |
|--------|-------------|
| **New Column** | "MY RANK" after TRACK NAME, before BESTEVERALBUMS |
| **Default Sort** | Original album track order (by position) |
| **Avg Stats Position** | Move to ABOVE the table |
| **All Columns Sortable** | Every column header supports asc/desc sorting |
| **Sort Fix** | Ensure sort works in BOTH Grid and List modes |

> [!WARNING]
> **Known Issue**: Sorting is currently broken in List/Expanded mode.
> This must be fixed as part of this sprint.

---

## 4. Data Model

### 4.1 User Ranking Entity

```javascript
// Firestore: users/{userId}/albumRankings/{albumId}
{
  albumId: "spotify:album:abc123",
  albumTitle: "OK Computer",
  artistName: "Radiohead",
  rankings: [
    { trackTitle: "Paranoid Android", userRank: 1 },
    { trackTitle: "Karma Police", userRank: 2 }
    // Partial ranking allowed - not all tracks need to be ranked
  ],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 4.2 Album Entity Extension

```javascript
// Runtime album object (client-side)
album.userRanking = [
  { trackTitle: "Paranoid Android", userRank: 1 },
  // ...
]
```

---

## 5. Integration Points

### 5.1 Blending Menu Recipe

Add as a TopN algorithm recipe (same ingredients as SPFY and BEA):

```
┌─────────────────────────────────────────────────────────────────┐
│  🍳 Pick Your Recipe                                            │
│                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │
│  │    SPOTIFY    │  │      BEA      │  │  MY RANKING   │ ← NEW  │
│  │   Top Tracks  │  │   Acclaimed   │  │  Top Tracks   │        │
│  │   by Pop.     │  │    Tracks     │  │  by My Own    │        │
│  │               │  │               │  │   Ranking     │        │
│  └───────────────┘  └───────────────┘  └───────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Recipe Card Details**:
- **ID**: `top-n-user`
- **Name**: "Top Tracks by My Own Ranking"
- **Badge**: "USER" (incandescent blue)
- **Algorithm**: TopN (same as SPFY/BEA)
- **Ingredients**: Same as other TopN recipes (Top 1-10, Grouping, etc.)

### 5.2 Generated Playlist Title

```
UGR Top 5 By Album Vol. 1
```

**UGR** = User-Generated-Rank

---

## 6. Test Requirements

### 6.1 Sorting Validation

> [!IMPORTANT]
> **Critical Test**: Verify ALL column sorting works in BOTH modes.

| Test Case | Mode | Expected |
|-----------|------|----------|
| Click `#` header | Grid/List | Table sorts by original position asc/desc |
| Click `TRACK NAME` header | Grid/List | Table sorts alphabetically asc/desc |
| Click `MY RANK` header | Grid/List | Table sorts by user rank asc/desc |
| Click `BESTEVERALBUMS` header | Grid/List | Table sorts by BEA rank asc/desc |
| Click `POPULARITY` header | Grid/List | Table sorts by Spotify % asc/desc |
| Click `TIME` header | Grid/List | Table sorts by duration asc/desc |

---

## 7. Out of Scope (v1)

- Sharing rankings with other users
- Importing rankings from external sources
- Track-level notes/comments

---

## 8. Resolved Questions

| Question | Resolution |
|----------|------------|
| Modal or full page? | **Modal** |
| Show BEA/Spotify while ranking? | **Yes** (for reference) |
| Rank ALL or SOME tracks? | **Partial ranking allowed** (drag-drop is flexible) |
