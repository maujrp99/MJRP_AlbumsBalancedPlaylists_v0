# Playlist Algorithm Menu

**Last Updated**: 2025-12-16  
**Sprint**: 8 - Algorithm Strategy Pattern  
**Status**: SPECIFICATION

---

## Algorithm Registry

| # | ID | Name | Status | Description |
|---|-----|------|--------|-------------|
| 0 | `legacy-roundrobin` | Legacy Round-Robin | ✅ Implemented | Current implementation (simplified) |
| 1 | `s-draft-original` | S-Draft Hybrid Curator Original | ✅ Implemented | Full Serpentine algorithm |
| 2 | `mjrp-balanced-cascade` | MJRP Balanced Cascade | ✅ Implemented | Serpentine + Cascade (recommended) |

---

## 0. Legacy Round-Robin

**ID**: `legacy-roundrobin`  
**Badge**: "LEGACY"  
**Status**: ✅ Currently Coded

### Description
> The current implementation in `CurationEngine.curate()`. A simplified version that uses round-robin distribution instead of full Serpentine.

### How It Works
1. **P1**: Rank #1 from each album
2. **P2**: Rank #2 from each album
3. **Deep Cuts**: Round-robin by album bucket (NOT Serpentine)

### Limitations
- ❌ Does NOT implement true Serpentine (odd/even album logic)
- ❌ No 30-min minimum enforcement
- ❌ Fixed 45-min target (hardcoded)

### Code Location
- `shared/curation.js` → `CurationEngine.curate()` (lines 253-384)

---

## 1. S-Draft Hybrid Curator Original

**ID**: `s-draft-original`  
**Badge**: "ORIGINAL"  
**Status**: 🔜 Planned

### Description
> The original MJRP algorithm design. Creates 2 Greatest Hits playlists + Deep Cuts with full Serpentine distribution.

### Rules of Thumb
| Rule | Value |
|------|-------|
| Target duration | ~45 min per playlist |
| Flexibility | ±7 min |
| Coverage | All playlists must have tracks from all albums |
| Track usage | All tracks from all albums must be used |

### Algorithm Phases

#### FASE 1: Preparation & Ranking
- **N**: Number of albums to distribute
- **P**: Number of playlists (flexible based on duration)
- **Ranking**: Each album's tracks ranked #1 (most acclaimed) to #M (least)

#### FASE 2: Greatest Hits Extraction
| Playlist | Content |
|----------|---------|
| **P1** | Rank #1 from each album |
| **P2** | Rank #2 from each album |

#### FASE 3: Serpentine Distribution (P3 to P)
Remaining tracks (rank #3+) distributed using S-Draft:

**RULE A - Odd Albums (1, 3, 5...)**
```
Track #3 → Playlist P
Track #4 → Playlist P-1
Track #5 → Playlist P-2
...continue up to P3...
[TURN] → reverse direction
Track #X → Playlist 3
Track #X+1 → Playlist 4
...continue down...
```

**RULE B - Even Albums (2, 4, 6...)**
```
Track #3 → Playlist 3
Track #4 → Playlist 4
Track #5 → Playlist 5
...continue down to P...
[TURN] → reverse direction
Track #X → Playlist P
Track #X+1 → Playlist P-1
...continue up...
```

#### FASE 4: Duration Rebalancing
Manual swaps may be needed to achieve ~45 min ±7 min per playlist.

### Expected Output
```
📀 Greatest Hits Vol. 1 (~45 min)
   └─ Rank #1 from each album

📀 Greatest Hits Vol. 2 (~45 min)
   └─ Rank #2 from each album

📀 Deep Cuts Vol. 1-N (~45 min each)
   └─ Serpentine-balanced tracks
```

---

## 2. MJRP Balanced Cascade

**ID**: `mjrp-balanced-cascade`  
**Badge**: "RECOMMENDED"  
**Status**: ✅ Implemented (Sprint 8)

### Description
> Hybrid algorithm combining Serpentine distribution with Cascade rebalancing. Ensures balanced Deep Cuts with global overflow handling.

### Rules of Thumb
| Rule | Value |
|------|-------|
| Greatest Hits max | **60 min** |
| Deep Cuts max | **48 min** (trim to Orphan Tracks) |
| Minimum any playlist | **30 min** |
| numDC formula | **minTracksInAnyAlbum - 2** |
| GH content | **ONLY rank #1 and #2** (never #3+) |
| Coverage | Conditional: applies if numDC ≤ minTracks |

### Algorithm Phases

#### FASE 1: Preparation & Ranking
- **N**: Number of albums
- **numDC**: minTracksInAnyAlbum - 2
- **Ranking**: Each album's tracks ranked #1 to #M

#### FASE 2: Greatest Hits Extraction

**Single Playlist (if #1+#2 ≤ 60 min)**:
- **P1**: Rank #1 AND rank #2 from each album

**Split into 2 Playlists (if #1+#2 > 60 min)**:
| Playlist | Content |
|----------|---------|
| **P1 (Vol. 1)** | ALL rank #1 tracks |
| **P2 (Vol. 2)** | ALL rank #2 tracks |

#### FASE 3a: Serpentine Distribution (First Pass)

Distribute tracks #3 to #(numDC+2):

| Album Type | Direction |
|------------|-----------|
| **Odd (1,3,5,7)** | DC_last → DC1 |
| **Even (2,4,6)** | DC1 → DC_last |

#### FASE 3b: Cascade Global (Excess Tracks)

When smallest album runs out, remaining albums continue with **global ping-pong by ranking**:

```
#(numDC+3) → DC_last (all albums that have it)
#(numDC+4) → DC_(last-1)
#(numDC+5) → DC_(last-2)
...continues ping-pong if needed...
```

#### FASE 4: Duration Trim

```
FOR each DC with duration > 48 min:
    WHILE duration > 48 min:
        Remove track with lowest ranking
        Move to "Orphan Tracks" playlist
```

### Expected Output

```
📀 Greatest Hits Vol. 1 (all #1s)
📀 Greatest Hits Vol. 2 (all #2s)
📀 Deep Cuts Vol. 1 (balanced by Serpentine)
📀 Deep Cuts Vol. 2 (balanced by Serpentine)
...
📀 Deep Cuts Vol. N (may include Cascade extras)
📀 Orphan Tracks (trimmed excess, if any)
```

### Code Location
- `public/js/algorithms/MJRPBalancedCascadeAlgorithm.js`


---

## Comparison Matrix

| Feature | #0 Legacy | #1 Original | #2 MJRP Balanced |
|---------|-----------|-------------|------------------|
| Greatest Hits | 2 fixed | 2 fixed | 1 or 2 (dynamic) |
| GH composition | #1, #2 separate | #1, #2 separate | #1+#2 combined (split if >60) |
| GH max duration | ~45 min | ~45 min | **60 min** |
| Deep Cuts max | ~45 min | ~45 min ±7 | **48 min strict** |
| Minimum playlist | none | none | **30 min** |
| Distribution | Round-robin | Serpentine | Serpentine |
| Under-time handling | none | none | Redistribute or "Manual" |

---

## UI Selector

```
┌─────────────────────────────────────────────────────┐
│  Select Generation Algorithm                         │
├─────────────────────────────────────────────────────┤
│  ○ Legacy Round-Robin              [LEGACY]         │
│    Current simplified implementation                 │
│                                                      │
│  ○ S-Draft Original                [ORIGINAL]       │
│    Classic 2 Greatest Hits + Serpentine Deep Cuts   │
│                                                      │
│  ◉ S-Draft MJRP Balanced           [RECOMMENDED]    │
│    Flexible GH + strict duration rules              │
└─────────────────────────────────────────────────────┘
```

---

## Implementation Files

```
public/js/algorithms/
├── BaseAlgorithm.js              # Abstract base class
├── LegacyRoundRobinAlgorithm.js  # Current code extracted
├── SDraftOriginalAlgorithm.js    # Algorithm #1
├── SDraftBalancedAlgorithm.js    # Algorithm #2
└── index.js                       # Registry & factory
```
