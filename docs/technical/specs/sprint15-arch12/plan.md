# Sprint 15 Plan: Safely Componentized Architecture (ARCH-12)

**Goal**: Define the Architecture for the Unified Component System, Security Foundation, and Refactor Pilot.
**Spec**: [spec.md](./spec.md) | **Tasks**: [tasks.md](./tasks.md)

---

## 1. Directory Structure (Clean Architecture)

```
src/
  components/
    ui/                  # <--- THE NEW CORE
      Card.js            # Universal Card (Grid/List)
      TrackRow.js        # Universal Track (Row/Item)
      BaseModal.js       # Universal Modal Shell
    
    # Legacy Cleanup Targets:
    # - base/ (Delete)
    # - shared/ (Delete)
    # - common/ (Delete)
  
  utils/
    SafeDOM.js           # <--- NEW: Safe DOM Builder
```

## 2. The Strategy: "Security First, Then Migration"
We identified that copying insecure components (`innerHTML`) to multiple views increases technical debt.

**New Flow**:
1.  **Harden**: Create `SafeDOM` and upgrade `Card`/`TrackRow`.
2.  **Migrate**: Apply SAFE components to legacy views.

---

## 3. Technical Architecture

### A. The `SafeDOM` Utility
A fluent, chainable API for DOM creation that forbids `innerHTML`.

```javascript
// public/js/utils/SafeDOM.js
export const SafeDOM = {
  // Primary Factory
  create(tag, props = {}, children = []) {
    const el = document.createElement(tag);
    
    // Props
    Object.entries(props).forEach(([key, val]) => {
      if (key === 'className') el.className = val;
      else if (key === 'style' && typeof val === 'object') Object.assign(el.style, val);
      else if (key.startsWith('on') && typeof val === 'function') {
        el.addEventListener(key.substring(2).toLowerCase(), val);
      }
      else if (key === 'dataset') Object.assign(el.dataset, val);
      else el.setAttribute(key, val);
    });

    // Children (Automatic Text Safety)
    const kids = Array.isArray(children) ? children : [children];
    kids.forEach(child => {
      if (!child) return;
      if (typeof child === 'string' || typeof child === 'number') {
        el.appendChild(document.createTextNode(String(child))); // SAFE
      } else if (child instanceof Node) {
        el.appendChild(child);
      }
    });

    return el;
  },

  // Helpers
  div(props, children) { return this.create('div', props, children); },
  button(props, children) { return this.create('button', props, children); },
  span(props, children) { return this.create('span', props, children); },
  img(props) { return this.create('img', props); },
  
  clear(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }
};
```

### B. Upgraded Component Pattern
Components will export a `render()` function that returns a `DOM Node`, not a string.

**Old (Card.js)**:
```javascript
return `<div class="card">${escapeHtml(data.title)}</div>` // String
```

**New (Card.js)**:
```javascript
import { SafeDOM } from '../utils/SafeDOM.js';

export class Card {
  static render(data) {
    return SafeDOM.div({ className: 'card' }, [
      SafeDOM.div({ className: 'card-title' }, data.title), // Safe text
      SafeDOM.img({ src: data.img, alt: data.title })      // Safe attr
    ]);
  }
}
```

---

## 4. Component API Design

### A. `Card.js` (The Universal Entity)
Replaces `BaseCard`, `EntityCard`, `AlbumsGridRenderer` cards.

```javascript
export class Card {
    /**
     * @param {Object} props
     * @param {Object} props.entity - The data object (Album, Playlist)
     * @param {'grid' | 'list' | 'minimal'} [props.variant='grid']
     * @param {Array<{icon: string, label: string, action: string}>} [props.actions]
     * @param {Function} [props.onClick]
     */
    static render(props) { ... }
}
```

### B. `TrackRow.js` (The Universal List Item)
Replaces `TrackItem.js` (Playlists) and manual HTML (Rankings, SavedPlaylists).

#### Gap Analysis & Superset Strategy
| Feature | `TrackItem.js` (Legacy) | `RankingView` (Manual) | `TrackRow.js` (New) |
| :--- | :--- | :--- | :--- |
| **Drag Handle** | ✅ (If draggable) | ❌ | **✅ (`draggable` prop)** |
| **Medals (🥇)** | ❌ | ✅ (Top 3) | **✅ (`ranking` variant)** |
| **Rank Badges** | ✅ (Acclaim/Spotify) | ✅ (Custom Colors) | **✅ (Unified Logic)** |
| **Duration** | ✅ | ✅ | **✅** |
| **CSS Class** | `.track-item` | `.track-row` | **`.track-row`** (Updates required in DragDrop) |

#### API Definition
```javascript
export class TrackRow {
    /**
     * @param {Object} props
     * @param {Object} props.track - The track data
     * @param {number} props.index - Visual index (1, 2, 3...)
     * @param {'compact' | 'detailed' | 'ranking'} [props.variant='compact']
     * @param {Array<{action: string, icon: string}>} [props.actions]
     * @param {boolean} [props.draggable=false] - Shows grip handle
     * @param {Object} [props.meta] - Extra data (e.g. { ratingClass: 'badge-success' })
     */
    static render(props) { ... }
}
```

### C. `BaseModal.js`
Standardizes the "Glass Panel" look and close behavior.

---

## 5. Component Migration Map

| Component | Current State | Target State | Notes |
| :--- | :--- | :--- | :--- |
| `Card.js` | ⚠️ innerHTML (String) | ✅ SafeDOM (Node) | Used in SavedPlaylists |
| `TrackRow.js` | ⚠️ innerHTML (String) | ✅ SafeDOM (Node) | Used in SavePlaylists |
| `BaseModal.js` | ⚠️ innerHTML (String) | ✅ SafeDOM (Node) | Basic shell |

---

## 6. Architecture: SavedPlaylistsView Refactor

**Pattern**: Controller-View (Separation of Concerns).

### A. The Controller (`SavedPlaylistsController.js`)
Responsible for:
1.  Fetching Series & Playlists (Repositories).
2.  Managing Store Context (setting active Series).
3.  Handling Deletions (Business Logic).
4.  Navigation Routing.

### B. The View (`SavedPlaylistsView.js`)
Responsible for:
1.  **Rendering only**: Uses `Card.js` variants and `TrackRow.js`.
2.  **Event Delegation**: Captures clicks and delegates to Controller.
3.  **No Business Logic**.

---

## 7. Rollout Strategy
1.  **Stop the bleeding**: No new `innerHTML` code.
2.  **Vaccinate the core**: Rewrite `Card`, `TrackRow`, `BaseModal` using `SafeDOM`.
3.  **Heal the limbs**: Refactor Views one by one to use the vaccinated components.

---

## 8. Risk Management
*   **Performance**: `document.createElement` is generally faster than `innerHTML` parsing for small updates, but slower for massive initial renders.
    *   *Mitigation*: Use `DocumentFragment` for lists (e.g., rendering 500 tracks). `SafeDOM` should handle fragments if array passed.
*   **Developer Friction**: Writing DOM definitions is more verbose than HTML strings.
    *   *Mitigation*: Keep `SafeDOM` API terse (`SafeDOM.div` vs `create('div')`).

---

## 9. Security Validation
*   **Rule**: No `innerHTML` interpolation of user data.
*   **Method**: `Card` and `TrackRow` must use safe DOM construction or strict escaping.

---

## 10. UI Mockups (Unchanged)
The visual output remains identical. This is a purely structural refactor to eliminate XSS vectors.
