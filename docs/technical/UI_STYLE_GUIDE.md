# UI Style Guide

**Last Updated**: 2025-12-14
**Status**: Living Document

---

## Element Registry

Use these IDs to reference specific UI elements:

### HomeView Elements

| Element ID | Description | Current Size |
|------------|-------------|--------------|
| `home.hero-logo-left` | Left logo (vinyl) | 96px / 112px (md) |
| `home.hero-logo-right` | Right logo (fire vinyl) | 96px / 112px (md) |
| `home.hero-title` | "The Album Playlist Synthesizer" | text-2xl / text-4xl |
| `home.hero-subtitle` | Description paragraph | text-lg / text-xl |
| `home.create-button` | "Initialize Load Sequence" | text-base, rounded-2xl |
| `home.step-01` | "01 // Series Configuration" | text-xs uppercase |
| `home.step-02a` | "02a // Artist Filter" | text-xs uppercase |
| `home.step-02b` | "02b // Select Album" | text-xs uppercase |

### TopNav Elements

| Element ID | Description | Current Size |
|------------|-------------|--------------|
| `nav.logo-icon` | MJRP logo in nav | 48px / 64px (md) |
| `nav.title-image` | "The Album Playlist Synthesizer" text image | h-6 / h-10 / h-12 |
| `nav.menu-item` | Navigation link | text-sm uppercase |

### AlbumsView Elements

| Element ID | Description | Current |
|------------|-------------|---------|
| `albums.page-header` | View title | text-4xl font-bold |
| `albums.card-cover` | Album cover (compact) | aspect-square |
| `albums.card-cover-expanded` | Album cover (expanded) | 128px / 160px |

### PlaylistsView Elements

| Element ID | Description | Current |
|------------|-------------|---------|
| `playlists.header` | "Playlist Management" | text-4xl font-bold |
| `playlists.track-item` | Draggable track | p-3 rounded-lg |

---

## Typography Scale

| Class | Size | Usage |
|-------|------|-------|
| `text-xs` | 12px | Badges, metadata, timestamps, secondary labels |
| `text-sm` | 14px | Body text, form labels, card descriptions |
| `text-base` | 16px | Default body, button text |
| `text-lg` | 18px | Card titles, emphasized text |
| `text-xl` | 20px | Section headers, modal titles |
| `text-2xl` | 24px | Page sub-headers |
| `text-3xl` | 30px | Page headers (desktop) |
| `text-4xl` | 36px | Hero titles, view main headers |

### View-Specific Typography

| View | Element | Current Classes |
|------|---------|-----------------|
| **HomeView** | Hero title | `text-2xl md:text-4xl font-syne font-extrabold` |
| **HomeView** | Hero subtitle | `text-lg md:text-xl` |
| **HomeView** | Create button | `text-base` |
| **HomeView** | Section headers | `text-xs uppercase tracking-widest` |
| **AlbumSeriesListView** | Page header | `text-4xl font-bold` |
| **AlbumSeriesListView** | Card title | `text-lg font-bold` |
| **InventoryView** | Page header | TBD |
| **PlaylistsView** | Playlist title | TBD |
| **SavedPlaylistsView** | Series name | TBD |
| **RankingView** | Album title | `text-3xl font-bold` |

---

## Button System

### Standard Buttons (`btn` class)

| Variant | Classes | Usage |
|---------|---------|-------|
| **Primary** | `btn btn-primary` | Main CTAs, submit, confirm |
| **Secondary** | `btn btn-secondary` | Cancel, back, alternate actions |
| **Danger** | `btn btn-danger` | Delete, destructive actions |
| **Warning** | `btn btn-warning` | Caution, regenerate |
| **Success** | `btn btn-success` | Save, complete |
| **Ghost** | `btn btn-ghost` | Minimal style, close, tertiary |

### Size Modifiers

| Size | Classes | Padding |
|------|---------|---------|
| Small | `btn btn-sm` | `px-3 py-1.5` |
| Default | `btn` | `px-4 py-2` |
| Large | `btn btn-large` | `px-6 py-3` |

### Tech Theme Buttons (`tech-btn` class)

| Variant | Classes | Location |
|---------|---------|----------|
| Primary | `tech-btn-primary` | HomeView create series |
| Secondary | `tech-btn tech-btn-secondary` | AlbumsView |
| Danger | `tech-btn tech-btn-danger` | AlbumsView remove |

### Icon Buttons

| Type | Classes |
|------|---------|
| Circle | `btn btn-ghost btn-circle` |
| Icon only | `btn-icon` |

---

## Border Radius

| Class | Value | Usage |
|-------|-------|-------|
| `rounded` | 4px | Basic elements |
| `rounded-lg` | 8px | Cards, inputs, track items |
| `rounded-xl` | 12px | Panels, covers, modals |
| `rounded-2xl` | 16px | Hero sections, large cards, primary CTA |
| `rounded-3xl` | 24px | Hero banners |
| `rounded-full` | 9999px | Pills, badges, avatars, circular buttons |

---

## Spacing Patterns

### Button Padding

| Element | Current | Recommended |
|---------|---------|-------------|
| Primary CTA (HomeView) | `px-8 py-4` | Keep |
| Standard button | `px-4 py-2` | Keep |
| Small button | `px-3 py-1.5` | Keep |
| Large button | `px-6 py-3` | Keep |

### Card Padding

| Type | Classes |
|------|---------|
| Glass panel | `p-6` |
| Mini card | `p-5` |
| Compact item | `p-3` |

---

## Color Tokens

### Semantic Colors

| Name | Usage |
|------|-------|
| `accent-primary` | Orange/brand, CTAs, highlights |
| `text-muted` | Gray secondary text |
| `bg-surface-light` | Card backgrounds |
| `border-white/10` | Subtle borders |
| `border-orange-500/30` | Accent borders |

### Button Colors

| State | Background | Border |
|-------|------------|--------|
| Primary | Orange gradient | None |
| Secondary | `bg-white/10` | `border-white/20` |
| Danger | `bg-red-500` | None |
| Success | `bg-green-500` | None |
| Warning | Yellow variant | None |

---

## Component Classes

### Glass Panel
```css
.glass-panel {
  /* backdrop-blur + semi-transparent bg */
}
```

### Tech Panel (HomeView)
```css
.tech-panel {
  /* Bordered sections with glow */
}
.tech-header-bar {
  /* Orange accent left border */
}
.tech-input {
  /* Input with tech styling */
}
```

### Animations

| Class | Effect |
|-------|--------|
| `fade-in` | Opacity transition |
| `animate-in` | Entry animation |
| `zoom-in` | Scale from smaller |
| `slide-in-from-bottom-4` | Slide up |
| `animate-pulse` | Pulsing glow |
| `animate-spin` | Loading spinner |

---

## View-Specific Elements

### HomeView
- Hero: `rounded-3xl`, gradient overlay
- Tech panels: `tech-panel`, `tech-green-accent`
- Create button: `tech-btn-primary px-8 py-4 text-base rounded-2xl`

### AlbumsView
- Expanded card: `glass-panel p-6 rounded-2xl`
- Compact card: `aspect-square rounded-xl`
- Action buttons: `tech-btn text-xs px-4 py-2`

### InventoryView
- Album card: `rounded-lg`
- Status select: `rounded-full text-xs`
- Action buttons: `btn btn-sm`

### PlaylistsView
- Track item: `rounded-lg p-3`
- Export section: TBD
- Undo/Redo: `btn btn-secondary btn-sm`

### SavedPlaylistsView
- Series card: `glass-panel p-6 rounded-xl`
- Playlist mini-card: `rounded-lg p-5`
- View button: `btn btn-sm w-full border-2`

---

## Recommendations

### Consistency Fixes Needed

1. **Button sizing**: Some views mix `btn-sm` vs custom padding
2. **Typography**: Hero title sizes vary between views
3. **Border radius**: Cards use mix of `rounded-lg`, `rounded-xl`, `rounded-2xl`

### Standard Recommendations

| Element | Recommended |
|---------|-------------|
| Page headers | `text-3xl md:text-4xl font-bold` |
| Section headers | `text-xl font-bold` |
| Card titles | `text-lg font-bold` |
| Body text | `text-sm` or `text-base` |
| Primary CTA | `btn btn-primary` or `tech-btn-primary` |
| Card corners | `rounded-xl` (12px) |
| Button corners | `rounded-lg` (8px) or `rounded-2xl` (16px) for CTAs |
