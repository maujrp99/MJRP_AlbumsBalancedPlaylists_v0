# UI Style Guide

**Last Updated**: 2025-12-23
**Status**: Living Document

---

## Element Registry

Use these IDs to reference specific UI elements:

### HomeView Elements

| Element ID | Description | Current Size |
|------------|-------------|--------------|
| `home.title` | «Pick the albums. We blend the playlists.» (`#homeHero h1`; the second line in the flame as text) | Syne 800, 52 px (30 px on the phone) |
| `home.field` | the one field, «An artist, or paste a list of albums» (`#homeField`, `#artistScanInput`) | 64 px (56 on the phone), radius 18 |
| `home.search` | «Search» (`#btnScanArtist`): the flame only while nothing was found nor chosen | 48 px; 19 px 800 on the flame |
| `home.equalizer` | 48 bars (32 on the phone) under the field: still, live, flat (`.home-eq`) | 36 px high |
| `home.chips` | the type chips with their counts (`#home-toolbar .home-chip`); the one on is white | 44 px, round |
| `home.card` | the cover button (`.home-card`), «+» or the place in the series (`.home-card__mark`, 44 px) | square, radius 10 |
| `home.dock` | the series, fixed at the bottom (`.home-dock`); on the phone the `.phone-action-bar` | covers 52 px, «Create series» 56 px |
| `home.create-button` | «Create series» (`#btnCreateSeries`) | 56 px, 19 px 800, `--home-flame` |

### TopNav Elements

| Element ID | Description | Current Size |
|------------|-------------|--------------|
| `nav.logo-icon` | MJRP logo in nav | 48px / 64px (md) |
| `nav.title-image` | "The Album Blender" text image | h-8 / h-12 (sm) / h-14 (md) |
| `nav.menu-item` | Navigation link | text-sm uppercase, font-semibold, `.nav-link-glow` |

### AlbumsView Elements
The albums screen is `views/SeriesView.js` today (there is no `AlbumsView.js`); the element IDs below keep the `albums.` prefix. Since F83 this is `screens/albums/Albums.tsx` and `screens/albums/index.ts` (React).

| Element ID | Description | Class / Style |
|------------|-------------|---------------|
| `albums.page-header` | View title (`SeriesHeader`) | text-2xl md:text-4xl font-bold flex items-center gap-3 |
| `albums.series-filter` | Series Dropdown Picker | `form-control` bg-brand-dark/50 |
| `albums.filters-section` | Filter Bar Container | `glass-panel p-4` |
| `albums.toggle-view-mode` | Toggle Compact/Expanded | `tech-btn` (Primary/Secondary) |
| `albums.generate-btn` | Generate Playlists CTA | `tech-btn-primary px-8 py-3 rounded-2xl` |
| `albums.card-compact` | Album Card (Grid) | `group flex flex-col gap-3` |
| `albums.card-cover` | Album Cover (Compact) | `aspect-square rounded-xl` |
| `albums.series-group` | Series Group Container | `rounded-xl border border-white/5 p-6 bg-white/5` |
| `albums.series-header` | Series Group Title | `text-2xl font-bold text-accent-primary` |
| `albums.blend-btn` | Blend Albums Button | `tech-btn-primary w-full md:w-auto` |
| `albums.modal-overlay` | Modal Background | `modal-overlay` |
| `albums.modal-container` | Modal Content Box | `glass-panel max-w-2xl rounded-xl` |

### PlaylistsView Elements

| Element ID | Description | Current |
|------------|-------------|---------|
| `playlists.header` | "Playlist Management" | text-2xl md:text-4xl, responsive (flex-col md:flex-row) |
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
| **HomeView** | Title | `.home-hero h1`: Syne 800, 52 px |
| **HomeView** | Artist | `.home-artist h2`: Syne 800, 32 px |
| **HomeView** | Create button | `.home-btn.is-big.is-flame`: 19 px, 800 |
| **HomeView** | Numbers (places, counts) | the text face (`--home-text-font`): the «1» of Syne reads as «ı» |
| **SeriesView** (albums screen) | Page header | `text-2xl md:text-4xl font-bold` |
| **SeriesView** (albums screen) | Card title | `text-lg font-bold` |
| **InventoryView** | Page header | TBD |
| **PlaylistsView** | Playlist title | TBD |
| **SavedPlaylistsView** | Series name | TBD |
| **RankingView** (retired in F65) | Album title | `text-3xl font-bold` |

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
| Primary | `tech-btn-primary` | Albums screen "Blend" button (`SeriesHeader`), Blend screen "Blend It!" |
| Secondary | `tech-btn tech-btn-secondary` | Album card actions (`components/ui/Card.js`) *(F83: now `screens/inventory/ItemCard.tsx` and `screens/inventory/ItemRow.tsx`)* |
| Danger | `tech-btn tech-btn-danger` | Defined in `tech-theme.css`; no screen uses it today |

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
| Primary CTA (Blend screen) | `px-8 py-4` | Keep |
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

### Data Source Color Coding

> **Added**: Sprint 12 (2025-12-23)
> **Updated**: Sprint 20 (2026-01-11) - Added User Ranking

Use consistent colors to visually distinguish data sources:

| Source | Color Name | Hex | Tailwind Class | Usage |
|--------|------------|-----|----------------|-------|
| **Acclaim** (BEA) | Brand Orange | `#f97316` (`brand.orange` in `tailwind.config.js`) | `text-brand-orange`, `bg-brand-orange` | Rankings, ratings, acclaim badges, ★ stars |
| **Popularity** (Spotify) | Spotify Green | `#1DB954` | `text-[#1DB954]`, `bg-[#1DB954]` | Popularity scores, rank badges, progress bars |
| **User Ranking** (NEW) | Incandescent Blue | `#0EA5E9` | `text-sky-500`, `bg-sky-500` | User rank badges, "Rank It" button, My Rank column |

**UI Elements by Source:**

| Element | Acclaim (Orange) | Popularity (Green) | User (Blue) |
|---------|-----------------|-------------------|-------------|
| Rank badge | `#1` orange circle | `#1` green circle | `#1` blue circle |
| Score indicator | `★ 93` with orange star | `78%` with green text | N/A |
| Progress bar | N/A | Green bar (`#1DB954`) | N/A |
| Header icon | Award (orange) | SpotifyConfig (green) | Star (blue) |
| Footer average | "Avg Rating" with orange | "Avg Pop" with green | "My Avg" (blue) |

### Badge Layouts (Card)

> **Updated**: Sprint 22 (Refetch)

**Split Row Layout**:
*   **Top Row**: Acclaim (BEA) - Full width if present.
*   **Bottom Row**: Split 50/50 between Spotify (Left) and User Rank (Right).

**Micro-Badges**:
*   Usage: Card overlays, crowded metadata.
*   Class: `text-[9px]`, `px-1.5`, `py-0.5`.
*   Style: `rounded-md`, `tabular-nums`.

**Year Pill**:
*   Style: `border border-white/10 bg-black/40 px-2 py-0.5 rounded-md text-xs font-mono text-white/70`.

---

## Component Classes

### Glass Panel
```css
.glass-panel {
  /* backdrop-blur + semi-transparent bg */
}
```

### The Home (F79)
The classes of the Home are prefixed `home-` and live in `public/css/views/home.css` (the computer) and `public/css/mobile/home.css` (the phone, inside its media query). The tokens of the flame are custom properties on `:root`: `--home-flame` (`#f97316 → #dc2626`), `--home-flame-text`, `--home-eq-grad`. The old tech panel of the Home is gone.

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
- One stage (`.home-page`, max 1180 px): `.home-stage` (title, field, hint, equalizer), `.home-results` (steps, wait, message, artist, chips, grid), the dock (`.home-dockwrap`, fixed at the bottom, the page keeps its height free)
- Create button: `.home-btn.is-big`, the flame only when it is the next step

### Albums screen (`SeriesView`)
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
- Undo/Redo: `btn btn-secondary`, with `disabled:opacity-40` when there is no step (in "Actions & Export", F62)

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
| Page headers | `text-2xl md:text-3xl lg:text-4xl font-bold` (Responsive) |
| Section headers | `text-xl font-bold` |
| Card titles | `text-lg font-bold` |
| Body text | `text-sm` or `text-base` |
| Primary CTA | `btn btn-primary` or `tech-btn-primary` |
| Card corners | `rounded-xl` (12px) |
| Button corners | `rounded-lg` (8px) or `rounded-2xl` (16px) for CTAs |
