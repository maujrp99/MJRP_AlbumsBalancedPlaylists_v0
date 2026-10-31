# TopNav v2 - Implementation Plan

**Created**: 2025-12-22  
**Status**: ✅ APPROVED  
**Spec**: [spec.md](./spec.md)

---

## Goal

Redesign TopNav to consolidate Series navigation under a dropdown and add "The Blending Menu" as a first-level nav item.

---

## Proposed Changes

### Overview

| Component | Action | Description |
|-----------|--------|-------------|
| `TopNav.js` | MODIFY | Add dropdown for Series, restructure nav items |
| `SeriesDropdown.js` | NEW | Dedicated component for dropdown logic |
| `router.js` | MODIFY | Add routes for /blend, /artists, /genres, /tracks |
| `neon.css` | MODIFY | Ensure dropdown uses existing glow effects |

---

### Component 1: TopNav.js

#### [MODIFY] [TopNav.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/components/TopNav.js)

**Changes:**
1. Replace separate nav links with new structure:
   - `Home` → `/home`
   - `Series ▼` → dropdown
   - `The Blending Menu` → `/blend`
   - `Inventory` → `/inventory`

2. Add dropdown state management:
   ```javascript
   this.isSeriesDropdownOpen = false
   ```

3. Render dropdown menu with entity types:
   - Albums → `/albums`
   - Artists → `/artists` (disabled/coming soon)
   - Genres → `/genres` (disabled/coming soon)
   - Tracks → `/tracks` (disabled/coming soon)
   - Playlists → `/playlist-series`

4. Close dropdown on:
   - Click outside
   - Navigation selection

---

### Component 2: SeriesDropdown.js (Optional)

#### [NEW] [SeriesDropdown.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/components/navigation/SeriesDropdown.js)

**Responsibility:**
- Render dropdown UI
- Handle open/close state
- Emit navigation events

**Interface:**
```javascript
class SeriesDropdown {
  constructor({ onNavigate, currentPath })
  render() // Returns HTML string
  open()
  close()
  isOpen() // Returns boolean
}
```

> [!NOTE]
> This component is optional. If TopNav is already manageable, we can keep dropdown logic inline.

---

### Component 3: Router Updates

#### [MODIFY] [router.js](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/public/js/router.js)

**Add Routes:**
```javascript
{ path: '/blend', view: BlendingMenuView },
{ path: '/artists', view: ComingSoonView }, // Placeholder
{ path: '/genres', view: ComingSoonView },  // Placeholder
{ path: '/tracks', view: ComingSoonView },  // Placeholder
```

---

### Mobile Drawer Updates

Update mobile drawer in TopNav.js:
1. Replace flat nav with expandable "Series" section
2. Add "The Blending Menu" item
3. Maintain same entity type options

---

## Verification Plan

### Automated Tests
- N/A (manual verification for UI)

### Manual Verification
1. Desktop: Click Series dropdown → verify all options visible
2. Desktop: Click outside dropdown → verify closes
3. Desktop: Click nav item → verify navigation works
4. Mobile: Open drawer → verify Series expandable section
5. Mobile: Navigate → verify drawer closes

---

## Implementation Order

| Step | Task | Est. Time |
|------|------|-----------|
| 1 | Add `/blend` route + placeholder view | 15 min |
| 2 | Modify TopNav.js render() with new structure | 30 min |
| 3 | Add dropdown toggle logic + close-on-outside | 20 min |
| 4 | Update mobile drawer with Series expansion | 20 min |
| 5 | Test all navigation paths | 15 min |
| 6 | Polish: CSS refinements | 10 min |

**Total Estimate:** ~2 hours

---

## User Review Required

> [!IMPORTANT]
> Please review this implementation plan:
> 1. Do you want SeriesDropdown as a separate component or inline in TopNav?
> 2. Should disabled entities (Artists, Genres, Tracks) show as "Coming Soon" or be hidden?
> 3. Proceed with implementation?
