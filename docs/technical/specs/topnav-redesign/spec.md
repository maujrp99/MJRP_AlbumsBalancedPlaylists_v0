# Feature Specification: TopNav Redesign

**Feature**: TopNav v2 - Series Navigation & The Blending Menu  
**Created**: 2025-12-22  
**Status**: ✅ APPROVED  
**Sprint**: 12 (V3 Architecture)  
**Sprint**: 12 (V3 Architecture)  
**Relates To**: [sprint12-architecture-v3.0](../sprint12-architecture-v3.0/spec.md)

---

## 1. Problem Statement

### Current State
The TopNav has separate links for "Album Series", "Playlists", and "Inventory". As we expand to support multiple entity types (Artists, Genres, Tracks, Playlists), we need a unified "Series" dropdown.

### Issues
1. **Fragmented Navigation**: Series types scattered across menu
2. **No Blending Menu Entry Point**: The Blending Menu feature needs a prominent nav item
3. **Scalability**: Adding new entity types requires modifying nav structure

---

## 2. Business Goals

| Goal | Description |
|------|-------------|
| **G1** | Consolidate all series types under one dropdown |
| **G2** | Add "The Blending Menu" as a first-level nav item |
| **G3** | Keep "Inventory" as a standalone item |
| **G4** | Support Desktop and Mobile responsive layouts |

---

## 3. User Stories

### US1: Series Type Navigation (P0)
> As a **Curator**, I want a single "Series" dropdown with all entity types, so that I can easily switch between different series views.

**Acceptance Criteria**:
- [ ] Dropdown labeled "Series" in main nav
- [ ] Options: Albums (default), Artists, Genres, Tracks, Playlists
- [ ] Active entity type is highlighted
- [ ] Clicking an option navigates to that series view

### US2: The Blending Menu Navigation (P1)
> As a **Curator**, I want "The Blending Menu" as a main navigation item, so that I can access playlist generation tools.

**Acceptance Criteria**:
- [ ] "The Blending Menu" appears as first-level nav item
- [ ] Clicking opens the Blending Menu view/overlay

---

## 4. Proposed Navigation Structure

### Desktop Layout
```
┌──────────────────────────────────────────────────────────────────────────┐
│ [Logo] [The Album Blender]     Home    Series ▼    The Blending Menu    │
│                                        ┌──────────────┐                  │
│                                        │ Albums     ✓ │  ← Default       │
│                                        │ Artists      │                  │
│                                        │ Genres       │                  │
│                                        │ Tracks       │                  │
│                                        │ ─────────────│                  │
│                                        │ Playlists    │                  │
│                                        └──────────────┘                  │
│                                                          Inventory  [👤] │
└──────────────────────────────────────────────────────────────────────────┘
```

### Mobile Drawer Layout
```
┌─────────────────────────────────┐
│ [Logo] Menu              [X]    │
├─────────────────────────────────┤
│ 🏠 Home                         │
│ 📀 Series                    ▶  │
│    ├─ Albums (default)          │
│    ├─ Artists                   │
│    ├─ Genres                    │
│    ├─ Tracks                    │
│    └─ Playlists                 │
│ 🎛️ The Blending Menu           │
│ 🗃️ Inventory                   │
├─────────────────────────────────┤
│ [User / Sign In]                │
└─────────────────────────────────┘
```

---

## 4.1 Routes & Landing Pages

| Nav Item | Route | Landing Page | View Component | Status |
|----------|-------|--------------|----------------|--------|
| **Home** | `/home` | Dashboard with stats | `HomeView` | ✅ Exists |
| **Series > Albums** | `/albums` | Album series grid | `SeriesView` | ✅ Exists |
| **Series > Artists** | `/artists` | Artist series grid | `ArtistSeriesView` | ⬜ TODO |
| **Series > Genres** | `/genres` | Genre series grid | `GenreSeriesView` | ⬜ TODO |
| **Series > Tracks** | `/tracks` | Track series grid | `TrackSeriesView` | ⬜ TODO |
| **Series > Playlists** | `/playlist-series` | Playlist series grid | `PlaylistsView` | ✅ Exists |
| **The Blending Menu** | `/blend` | Blend configuration | `BlendingMenuView` | ⬜ TODO |
| **Inventory** | `/inventory` | All albums collection | `InventoryView` | ✅ Exists |

### Landing Page Concepts

#### Home (`/home`)
- Stats overview (total albums, series, playlists)
- Quick access tiles to recent series
- **Album-focused**: Primary loading/creation flow for Album Series (keeps current emphasis)
- "Create Album Series" prominent CTA

#### Series Pages (`/albums`, `/artists`, `/genres`, `/tracks`, `/playlist-series`)
- Grid of series for that entity type
- Search/Filter toolbar
- Create new series CTA
- Click series → drill into detail view

#### The Blending Menu (`/blend`)

> **Restaurant Metaphor Theme**

| Section | Description |
|---------|-------------|
| **🍹 Choose Your Blend** | Select series to blend - dropdown/filter by entity type, then loads series for that entity |
| **🍬 Choose Your Flavor** | Select algorithm/blending mode |
| **🥗 Pick Your Ingredients** | Parameters: duration, single/multiple playlists, # of playlists, discover mode, etc. |
| **🎛️ Blend It!** | CTA button: "Generate Your Playlist(s)" |

#### Inventory (`/inventory`)
- Full album collection (not in any series)
- Import/Export tools
- Data management

> [!WARNING]
> **Known Issues to Fix:**
> 1. Calculations not working properly
> 2. **Owned/Not Owned Bug**: New items should default to "not owned" but are coming as "owned". User should select which albums they own.

---

## 5. Design Principles & Available CSS

### Existing CSS Classes to Use

| Effect | CSS Class | Description |
|--------|-----------|-------------|
| **Glassmorphism** | `.glass-panel` | `backdrop-filter: blur(12px)`, dark bg, subtle border |
| **Navigation Glow** | `.nav-link-glow` | Orange glow on hover with `text-shadow` |
| **Flame/Orange Border** | `.neon-border-orange` | Orange border with `box-shadow` glow |
| **Tech Button** | `.tech-btn-primary` | Orange gradient, glow on hover |
| **Tech Panel** | `.tech-panel` | Chamfered look, backdrop blur |

### Implementation

| Element | Classes |
|---------|---------|
| Dropdown Panel | `glass-panel rounded-xl` |
| Active Nav Item | `nav-link-glow text-accent-primary` |
| Hover Effect | `nav-link-glow:hover` (orange glow + text-shadow) |
| Dropdown Items | `hover:bg-white/5 transition-all duration-200` |
| Separator | `border-t border-white/10` |

---

## 6. Success Criteria

1. **Functionality**: All 5 series types accessible from dropdown
2. **Visual Consistency**: Matches existing glass-panel design
3. **Responsive**: Works on Desktop (≥768px) and Mobile (<768px)
4. **Performance**: Client-side routing, no page reloads

---

## 7. Out of Scope

- The Blending Menu implementation (separate feature)
- Artist/Genre/Track Series views (requires routes first)

---

## 8. Open Questions - RESOLVED

| Question | Answer |
|----------|--------|
| **Q1**: Dropdown closes on click outside or only on selection? | **Closes on click outside** |
| **Q2**: Show entity counts in dropdown (e.g., "Albums (3)")? | **No** |

---

## User Review Required

> [!IMPORTANT]
> Please review this updated navigation structure:
> - **Series ▼** = dropdown with Albums, Artists, Genres, Tracks, Playlists
> - **The Blending Menu** = first-level nav item
> - **Inventory** = first-level nav item
