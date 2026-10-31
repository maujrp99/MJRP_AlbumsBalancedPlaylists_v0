# Design Proposal: Home View V3 (The Album Blender)

**Status**: ✅ IMPLEMENTED
**Last Updated**: 2025-12-28
**Implementation**: See `arch-11-home-v3-spec.md` for final spec

**Objective**: Redesign the Home View to accommodate "Discography Scan", "Search", and "Staging Area" workflows with premium V3 aesthetic.

---

## 1. Core Layout Structure (Implemented)
Moved from linear vertical form to **Split-Panel Workspace**.

### Left Panel (~400px desktop): The Control Deck ✅
Fixed/sticky panel containing input and context.
- **Header**: Compact branding "Album Blender V3"
- **01 // Series Configuration**: Series Name input (always visible)
- **02a // Artist Filter**:
    - **Visual Mode**: Search bar with visible "Scan" button
    - **Bulk Mode**: Textarea with validation feedback
    - *Tab switcher: "Visual" / "Bulk Paste"*
- **03 // Selected Albums (Staging)**:
    - Vertical stack with drag-drop reordering
    - Always-visible X button for removal
    - Real-time count badge
- **Footer**: "Initialize Load Sequence" button (sticky)

### Right Panel (flex-1): The Result Matrix ✅
Scrollable content area for results.
- **Toolbar**: Filters (Studio, Singles/EP, Live, Compilations) + Breadcrumbs
- **Default Sort**: Release Date (Newest → Oldest)
- **Grid**: Responsive columns (2-5 based on viewport)
- **Cards**: Entire card clickable, badges for album types

---

## 2. Interaction Improvements (Implemented)

| Feature | Status | Implementation |
|---------|--------|----------------|
| Click entire album to stage | ✅ | `data-action="toggle-staging"` on card div |
| Always-visible remove button | ✅ | Red background, larger touch target |
| Drag & Drop reordering | ✅ | SortableJS integration |
| Bulk mode validation | ✅ | Border color feedback (green/orange) |
| Loading feedback | ✅ | `setLoading()` method in HomeView |
| Initialize Load navigation | ✅ | Creates series → navigates to /albums/:id |

---

## 3. Visuals & Aesthetics (Implemented)

- **Glassmorphism**: `glass-panel` class on left panel
- **Flame Background**: Dynamic hero_bg.svg with gradient overlay
- **Badge System**: Deluxe, Remaster, Live, Single, Compilation badges
- **Hover Effects**: 
  - Album cards: orange border glow, image scale
  - Buttons: opacity transitions
- **Mobile**: Horizontal scroll filters, stacked panels

---

## 4. Final Layout (Implemented)

```
+-----------------------------------------------------------------------+
|  [TopNav with MJRP branding]                                          |
+----------------------+------------------------------------------------+
|  LEFT PANEL (400px)  |            RIGHT PANEL (flex-1)                |
|                      |                                                |
| 01 // SERIES CONFIG  | [Discography Scan > Artist Name]              |
| Your Albums Series   | [Studio] [Singles/EP] [Live] [Compilations]   |
| [___________________]|                                                |
|                      | +------------------------------------------+  |
| 02a // ARTIST FILTER | | [Album]    [Album]    [Album]    [Album] |  |
| [Visual] [Bulk Paste]| | + badge    + badge    + badge    + badge |  |
|                      | +------------------------------------------+  |
| 🔍 [Artist...] [Scan]|                                                |
|                      | +------------------------------------------+  |
| 03 // SELECTED ALBUMS| | [Album]    [Album]    [Album]    [Album] |  |
| (3 Albums)           | +------------------------------------------+  |
| +------------------+ |                                                |
| | Album 1      [X] | | (Scrollable grid continues...)               |
| | Album 2      [X] | |                                                |
| | Album 3      [X] | |                                                |
| +------------------+ |                                                |
|                      |                                                |
| [INITIALIZE LOAD →]  |                                                |
+----------------------+------------------------------------------------+
```

---

## 5. Mobile Responsiveness (Implemented)

- **Stacking**: Panels stack vertically (left on top, right below)
- **Filters**: Horizontal scroll with hidden scrollbar
- **Breadcrumbs**: Hidden on screens < 640px
- **Touch Targets**: Minimum 44px for buttons
- **Right Panel**: `min-h-[50vh]` ensures visibility

---

## 6. Post-Implementation Notes

### What Worked Well
- Split-panel layout provides clear separation of concerns
- Event delegation solved fragile onclick handlers
- Client-side filtering provides instant UX feedback

### Lessons Learned
- Data model consistency critical (object vs string albumQueries)
- Mobile-first approach needed earlier
- Hover interactions don't translate to mobile (always-visible buttons)

### Future Enhancements
- [ ] "Selected" state indicator on album cards
- [ ] Flying animation when staging albums
- [ ] Artist autocomplete in search
- [ ] Bulk mode: real-time line resolution with checkmarks
