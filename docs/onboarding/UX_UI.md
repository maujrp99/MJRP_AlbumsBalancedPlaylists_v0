# UX/UI Expert Onboarding Guide - MJRP Albums Balanced Playlists v2.0

**Created**: 2025-11-30
**Role**: UX/UI Designer & Frontend Specialist
**Goal**: Polish the "Nebula" theme, validate UI components, and ensure a premium user experience.

---

## 🎨 Design Philosophy: "Nebula" Theme
We are building a **premium, immersive music curation experience**.
- **Aesthetics**: Dark mode, Glassmorphism, Vibrant Gradients.
- **Palette**: "Flame" (Primary), "Amber" (Secondary), Deep Slate (Backgrounds).
- **Typography**: Modern Sans-Serif (Inter/Roboto).
- **Rule #1**: **NO EMOJIS** in the UI. Use SVG icons (Heroicons/Lucide) instead.

### 🖌️ Tech Stack
- **Framework**: Vanilla JS + Vite (No React/Vue complexity).
- **Styling**: **Tailwind CSS** (via CDN for v2.0-alpha).
- **Icons**: SVG Components (`public/js/components/Icons.js`).
- **Assets**: Dynamic SVG Backgrounds (`public/js/utils/SvgGenerator.js`).

---

## 🔭 Current UI Status (v2.0.3)

### 1. Core Views
- **HomeView**: Hero banner with dynamic "Equalizer" SVG. Migration banner (needs polish).
- **AlbumsView**:
  - **Grid Mode**: Standard card layout.
  - **Expanded Mode**: Detailed list with dual tracklists (Ranked vs Original).
  - **Filters**: Sticky header with glassmorphism.
- **PlaylistsView**: Drag-and-drop interface (SortableJS).
- **RankingView**: Album details with track ranking.

### 2. Components to Validate (UAT)
These components are implemented but need **Visual QA**:
- **Edit Album Modal**: Inline editing of album metadata.
- **Migration Banner**: Top of HomeView. Does it look "premium" enough?
- **Inventory UI**: New section (`/inventory`). Check responsiveness.
- **Toast Notifications**: Are they subtle or intrusive?

---

## 🛠️ Your Toolkit

### 1. Local Environment
- **URL**: `http://localhost:5000/`
- **CSS Debugging**: Use Chrome DevTools. Tailwind classes are in HTML.
- **SVG Debugger**: `http://localhost:5000/debug-svg-generator.html` (Tweak the hero background).

### 2. Key Files
- `public/index.css`: Global styles & Tailwind directives.
- `public/js/components/`: Reusable UI parts (Buttons, Modals, Icons).
- `public/js/views/`: Page-level layouts.

---

## 🚀 Immediate Tasks

### Priority 1: Visual UAT (The "Eye" Test)
- [ ] **Ghost Albums**: Verify the fix for Issue #15 didn't break the transition animations.
- [ ] **View Toggle**: Ensure the switch between Grid/List is smooth (Issue #16 fix).
- [ ] **Responsiveness**: Check Mobile vs Desktop layouts.

### Priority 2: Polish & Micro-interactions
- **Hover Effects**: Add subtle scales/glows to album cards.
- **Transitions**: Ensure modals fade in/out (don't just pop).
- **Loading States**: Replace text "Loading..." with skeletons or spinners.

### Priority 3: Design System Consistency
- Audit for "rogue" colors (ensure we stick to the Flame/Amber palette).
- Replace any remaining emojis with SVGs.
- Standardize button sizes and padding.

---

## ⚠️ Known UX Rough Edges
1. **Images**: Some album covers load slowly (external URLs). Consider a placeholder strategy.
2. **Scroll Position**: Verify if scroll restores correctly when going Back.
3. **Debug Panel**: The floating panel in bottom-right is for Devs. Ignore it (or hide it via CSS if blocking).

---

**Ready? Make it shine!** ✨
