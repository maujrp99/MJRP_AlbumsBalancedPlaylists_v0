# Plan: ARCH-3 BaseCard Component

**Created**: 2025-12-26  
**Status**: ✅ DONE  
**Spec**: [arch-3-basecard_spec.md](./arch-3-basecard_spec.md)

---

## Goal

Create a `BaseCard` component that encapsulates shared card structure and styling. Refactor existing cards to use composition.

---

## Current State Analysis

### Card Components Analyzed

| Component | LOC | Pattern | Common Elements |
|-----------|-----|---------|-----------------|
| BlendFlavorCard | 173 | Instance methods | `rounded-xl border`, hover effects, `getIcon()` |
| BatchGroupCard | 174 | Static methods | `rounded-xl border-white/10`, `escapeHtml()`, `getIcon()` |
| PlaylistCard | 120 | Static methods | `rounded-xl border-white/10`, `escapeHtml()`, `getIcon()` |
| EntityCard | 77 | Delegates | Different pattern (uses AlbumsGridRenderer) |

### Common Patterns Identified

1. **Container Styling**: `rounded-xl border border-white/10 bg-surface`
2. **Hover Effects**: `hover:border-brand-orange/30`, `transition-all duration-300`
3. **Icon Rendering**: All use `getIcon()` from `Icons.js`
4. **HTML Escaping**: `escapeHtml()` duplicated in BatchGroupCard and PlaylistCard
5. **Header/Body Structure**: Header with title + body with content

---

## Architecture Decision

**Pattern: Composition with Static Helper Functions** ✅ RECOMMENDED

Since all cards use String Templates (`static render()`), we'll provide composition helpers instead of inheritance.

```javascript
// BaseCard.js - Composition approach
export class BaseCard {
    static renderContainer({ header, body, footer, className = '' }) {
        return `
            <div class="base-card rounded-xl border border-white/10 bg-surface 
                        overflow-hidden transition-all duration-300 
                        hover:border-brand-orange/30 ${className}">
                ${header ? `<div class="card-header">${header}</div>` : ''}
                ${body ? `<div class="card-body">${body}</div>` : ''}
                ${footer ? `<div class="card-footer">${footer}</div>` : ''}
            </div>
        `
    }
    
    static escapeHtml(text) {
        if (!text) return ''
        const div = document.createElement('div')
        div.textContent = text
        return div.innerHTML
    }
}
```

### Why Not Inheritance?

| Approach | Pros | Cons |
|----------|------|------|
| Inheritance | Classic OOP | Doesn't work with static render() |
| Composition | Works with static, flexible | Slightly more verbose |
| Mixins | Reusable logic chunks | Complex, not needed here |

---

## Proposed BaseCard Component

### File: `components/base/BaseCard.js`

```javascript
/**
 * BaseCard Component
 * 
 * Base card component providing consistent styling and structure.
 * Uses composition pattern for String Template rendering.
 * 
 * @module components/base/BaseCard
 * @since ARCH-3
 */

import { getIcon } from '../Icons.js'

export class BaseCard {
    /**
     * Default card CSS classes (can be overridden)
     */
    static BASE_CLASSES = 'rounded-xl border border-white/10 bg-surface overflow-hidden'
    static HOVER_CLASSES = 'transition-all duration-300 hover:border-brand-orange/30'
    
    /**
     * Render card container with header, body, and footer slots
     * @param {Object} options
     * @param {string} [options.header] - Header HTML content
     * @param {string} [options.body] - Body HTML content  
     * @param {string} [options.footer] - Footer HTML content
     * @param {string} [options.className] - Additional CSS classes
     * @param {Object} [options.dataAttrs] - Data attributes { key: value }
     * @returns {string} HTML string
     */
    static renderContainer(options = {}) {
        const { header, body, footer, className = '', dataAttrs = {} } = options
        
        const dataAttrsStr = Object.entries(dataAttrs)
            .map(([k, v]) => `data-${k}="${this.escapeHtml(v)}"`)
            .join(' ')
        
        return `
            <div class="${this.BASE_CLASSES} ${this.HOVER_CLASSES} ${className}"
                 ${dataAttrsStr}>
                ${header ? `<div class="card-header p-4 bg-white/5 border-b border-white/10">${header}</div>` : ''}
                ${body ? `<div class="card-body">${body}</div>` : ''}
                ${footer ? `<div class="card-footer p-4 border-t border-white/10">${footer}</div>` : ''}
            </div>
        `
    }
    
    /**
     * Escape HTML special characters
     * @param {string} text - Text to escape
     * @returns {string} Escaped HTML
     */
    static escapeHtml(text) {
        if (!text) return ''
        const div = document.createElement('div')
        div.textContent = text
        return div.innerHTML
    }
    
    /**
     * Render icon using Icons.js
     * @param {string} iconName - Lucide icon name
     * @param {string} [className] - Additional CSS classes
     * @returns {string} Icon HTML
     */
    static icon(iconName, className = 'w-4 h-4') {
        return getIcon(iconName, className)
    }
}
```

---

## Refactoring Strategy

### PlaylistCard (Target 1 - Simplest)

**Before:**
```javascript
return `
  <div class="playlist-card bg-surface rounded-xl border border-white/10 overflow-hidden" ...>
    <div class="playlist-header p-4 bg-white/5 border-b border-white/10 ...">
      ...header content...
    </div>
    <div class="playlist-tracks ...">
      ...body content...
    </div>
  </div>
`
```

**After:**
```javascript
import { BaseCard } from '../base/BaseCard.js'

return BaseCard.renderContainer({
    header: `...header content...`,
    body: `...body content...`,
    className: 'playlist-card',
    dataAttrs: { 'playlist-index': index }
})
```

### BatchGroupCard (Target 2)

Similar refactoring, removing duplicated `escapeHtml()`.

---

## BatchGroupCard Enhancements (NEW)

In addition to BaseCard integration, we'll add UX improvements:

### Feature 1: Collapsible Header (Default: Collapsed)

```
┌─────────────────────────────────────────────────────────────┐
│ ▶ LED ZEPPELIN SERIES                                       │
│   📋 3 playlists • 🎵 45 tracks • 💿 5 albums    [Edit] [🗑️]│
└─────────────────────────────────────────────────────────────┘
         ↓ Click header to expand ↓
┌─────────────────────────────────────────────────────────────┐
│ ▼ LED ZEPPELIN SERIES                                       │
│   📋 3 playlists • 🎵 45 tracks • 💿 5 albums    [Edit] [🗑️]│
├─────────────────────────────────────────────────────────────┤
│   🎵 Playlist 1 (15 tracks)                          [▶]    │
│   🎵 Playlist 2 (18 tracks)                          [▶]    │
└─────────────────────────────────────────────────────────────┘
```

### Feature 2: Album Count in Header

Calculate unique albums from all playlists' tracks.

### Feature 3: Expandable Playlist Rows

Click playlist row to show tracks inline:

```
│   🎵 Playlist 1 (15 tracks)                          [▼]    │
│       ├ 1. Stairway to Heaven - Led Zeppelin                │
│       ├ 2. Black Dog - Led Zeppelin                         │
│       └ 3. Rock and Roll - Led Zeppelin                     │
│   🎵 Playlist 2 (18 tracks)                          [▶]    │
```

### Implementation Details

```javascript
// State management via data attributes and CSS
<div class="batch-group-card" data-collapsed="true">
    <div class="batch-header cursor-pointer" data-action="toggle-collapse">
        <span class="collapse-icon">▶</span> <!-- or ▼ when expanded -->
        ...
    </div>
    <div class="batch-playlists hidden"> <!-- toggled by JS -->
        ...
    </div>
</div>

// Toggle handler in SavedPlaylistsView
container.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="toggle-collapse"]')) {
        const card = e.target.closest('.batch-group-card')
        const isCollapsed = card.dataset.collapsed === 'true'
        card.dataset.collapsed = !isCollapsed
        card.querySelector('.batch-playlists').classList.toggle('hidden')
        card.querySelector('.collapse-icon').textContent = isCollapsed ? '▼' : '▶'
    }
})
```

---

## Files to Change

| File | Change Type | Description |
|------|-------------|-------------|
| `components/base/BaseCard.js` | **NEW** | Base component with helpers |
| `components/base/index.js` | **NEW** | Barrel export |
| `components/playlists/PlaylistCard.js` | **REFACTOR** | Use BaseCard.renderContainer |
| `components/playlists/BatchGroupCard.js` | **REFACTOR** | Use BaseCard.renderContainer, remove escapeHtml |

### LOC Impact (Estimated)

| Component | Before | After | Δ |
|-----------|--------|-------|---|
| BaseCard.js | 0 | ~60 | +60 |
| PlaylistCard.js | 120 | ~90 | -30 |
| BatchGroupCard.js | 174 | ~140 | -34 |
| **Net Change** | - | - | **~-4 LOC** |

> [!NOTE]
> Net LOC reduction is small, but code reuse and consistency improve significantly.

---

## Verification Plan

### 1. Visual Verification

- Open PlaylistsView
- Verify cards render correctly
- Check hover effects work
- Confirm no style regressions

### 2. Functional Verification

- Edit playlist name (PlaylistCard editable mode)
- Delete batch (BatchGroupCard actions)
- All button actions work

---

## Excluded from Scope

| Component | Reason |
|-----------|--------|
| BlendFlavorCard | Uses instance methods, different lifecycle |
| EntityCard | Delegates to AlbumsGridRenderer, already has wrapper |

These can be refactored in a future iteration if needed.

---

## Status: Awaiting User Review

> [!IMPORTANT]
> Please confirm:
> 1. Composition pattern OK (vs inheritance)?
> 2. Start with PlaylistCard + BatchGroupCard only?
> 3. Proceed with implementation?
