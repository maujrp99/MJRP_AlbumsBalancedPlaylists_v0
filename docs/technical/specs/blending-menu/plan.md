# The Blending Menu - Implementation Plan

**Created**: 2025-12-22  
**Status**: Draft  
**Spec**: [spec.md](./spec.md)

---

## Goal

Implement The Blending Menu feature with Restaurant Menu Metaphor UI, allowing users to generate playlists from a selected series using configurable algorithms.

---

## Phased Approach

Given the prerequisites identified in the spec, we'll implement in phases:

| Phase | Focus | Status |
|-------|-------|--------|
| **Phase 1** | Algorithm Analysis & Refactoring | ⬜ TODO |
| **Phase 2** | Blending Menu UI | ⬜ TODO |
| **Phase 3** | Integration & Testing | ⬜ TODO |

---

## Phase 1: Algorithm Analysis & Refactoring

### 1.1 Existing Algorithm Audit

#### [ANALYZE] [algorithms/](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/algorithms)

**Tasks:**
- [ ] Analyze `MJRPBalancedCascadeAlgorithm.js` (⭐ recommended base)
- [ ] Review parametrization potential for Top 3/5 selection
- [ ] Assess Spotify vs BEA ranking source switching capability
- [ ] Document existing algorithm interfaces

### 1.2 AOY Ranking Feasibility

**Tasks:**
- [ ] Research AOY data source availability
- [ ] Determine integration effort
- [ ] Decision: Implement now or defer to Phase 2+

### 1.3 Algorithm Refactoring/Creation

Based on analysis, either:

**Option A: Parametrize Existing**
```javascript
// If MJRPBalancedCascade can be parametrized:
const config = {
  trackCount: 3 | 5,           // Top 3 or Top 5
  rankingSource: 'spotify' | 'bea',  // Popular vs Acclaimed
  duration: 30 | 45 | 60,      // Minutes
  outputCount: 'single' | 'multiple' | 'auto'
}
```

**Option B: Create New Algorithms**
- [ ] `Top3PopularAlgorithm.js` - Crowd Favorites
- [ ] `Top3AcclaimedAlgorithm.js` - Critics' Choice
- [ ] `Top5PopularAlgorithm.js` - Greatest Hits
- [ ] `Top5AcclaimedAlgorithm.js` - Deep Cuts

---

## Phase 2: Blending Menu UI

### 2.1 View & Components

#### [NEW] [BlendingMenuView.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/views/BlendingMenuView.js)

**Responsibilities:**
- Main wizard container
- Step navigation
- State management for selections
- Dynamic CTA button generation

#### [NEW] [BlendSeriesSelector.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/components/blend/BlendSeriesSelector.js)

**Step 1: Choose Your Blend**
- Entity type dropdown (Albums, Artists, Genres, Tracks)
- Series loader based on entity selection
- Single series selection

#### [NEW] [BlendFlavorCard.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/components/blend/BlendFlavorCard.js)

**Step 2: Choose Your Flavor**
- Visual cards for each algorithm
- User-friendly descriptions
- Selection state

#### [NEW] [BlendIngredientsPanel.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/components/blend/BlendIngredientsPanel.js)

**Step 3: Pick Your Ingredients**
- Duration slider (30m/45m/60m)
- Single/Multiple playlist toggle
- Playlist count input (when multiple)

### 2.2 Route Update

#### [MODIFY] [app.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/app.js)

Replace ComingSoonView with BlendingMenuView for `/blend` route.

---

## Phase 3: Integration & Testing

### 3.1 CurationEngine Integration

#### [MODIFY] [curation.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/curation.js)

- [ ] Add algorithm selection interface
- [ ] Support new/parametrized algorithms
- [ ] Handle duration-based track limiting

### 3.2 PlaylistSeries Integration

- [ ] Route generated playlist(s) to existing PlaylistSeries management
- [ ] Enable drag & drop, edit, save, export

### 3.3 Testing

- [ ] Algorithm selection works
- [ ] Duration limits respected
- [ ] Single vs Multiple playlist output
- [ ] Spotify save integration

---

## File Structure

```
public/js/
├── views/
│   └── BlendingMenuView.js       [NEW]
├── components/
│   └── blend/
│       ├── BlendSeriesSelector.js  [NEW]
│       ├── BlendFlavorCard.js      [NEW]
│       └── BlendIngredientsPanel.js [NEW]
├── algorithms/
│   ├── MJRPBalancedCascadeAlgorithm.js [MODIFY or use as base]
│   └── (new algorithms if needed)
└── curation.js                    [MODIFY]
```

---

## Verification Plan

### Automated
- N/A (manual verification for UI)

### Manual
1. Navigate to `/blend`
2. Select entity type → Verify series load
3. Select series → Verify selection visual
4. Select flavor → Verify algorithm card selection
5. Configure ingredients → Verify parameters reflected
6. Click CTA → Verify playlist generation
7. Verify PlaylistSeries integration

---

## User Review Required

> [!IMPORTANT]
> **Questions before proceeding:**
>
> 1. **Phase 1 first?** Should I start with Algorithm Analysis before UI, or do you want UI skeleton first?
> 2. **Scope for this session?** Full implementation or just Phase 1 analysis?
