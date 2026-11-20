# Deep Dive: Shared Components

This document audits the foundational UI components located in `public/js/components/{ui,base,common,shared}/`. The other files of `components/ui/` (`Pager.js`, `FilterToolbar.js`, `AlbumCardRenderer.js`, `LoadMoreButton.js`, `modals/`, `skeletons/`) are covered in `12_Frontend_Components_Core.md`. These components form the building blocks for the entire application, enforcing consistency and security via `SafeDOM`.

## 1. Base Framework (`components/base/`)

| Component | Responsibility | Features |
| :--- | :--- | :--- |
| **`Component.js`** | Abstract base class for all V3 components. Enforces a standard lifecycle (`mount`, `update`, `unmount`) to manage DOM operations and memory cleanup. | • **Lifecycle Hooks**: `onMount()`, `onUpdate()`, `onUnmount()`<br>• **State Management**: Simple `props` merging strategy.<br>• **DOM Management**: Enforces container ownership. |

### Architectural Note
`Component.js` is deliberately lightweight. While it doesn't strictly depend on `SafeDOM` internally (to minimize circular dependencies), it is designed to be used *with* `SafeDOM` in subclasses.

---

## 2. Core UI Library (`components/ui/`)

These components are the "Universals" - reliable, reusable, and secure implementations of common patterns. They replace older, ad-hoc overrides (e.g., `AlbumCard.js`, `SeriesCard.js`).

| Component | Responsibility | Deep Dive Features |
| :--- | :--- | :--- |
| **`Card.js`** | **Universal Entity Card**. Displays interacting media for Albums, Playlists, or any other entity. | • **Variants**: Supports `grid` (compact) and `list` (expanded) layouts.<br>• **SafeDOM**: Fully secure rendering without `innerHTML`.<br>• **Smart Actions**: Configurable action buttons passed via props.<br>• **Ranking Badges**: Automatic recognition of BestEverAlbums and Spotify metadata. |
| **`BaseModal.js`** | **Universal Modal Shell**. The standard "Glass Panel" dialog container. | • **Animation**: Built-in entry/exit animations (Zoom/Fade).<br>• **Helper**: `createFooterButtons` factory for standard interactions.<br>• **Security**: Replaces legacy `innerHTML` modals, ensuring XSS safety for dynamic content. |
| **`TrackRow.js`** | **Universal Track Item**. Standardizes how songs are listed across Ranking, Playlist, and Inventory views. | • **Context Aware**: Adapts based on `variant` ('compact', 'detailed', 'ranking').<br>• **Medal System**: Renders 🥇/🥈/🥉 for top 3 tracks in Ranking view.<br>• **Drag & Drop**: Native support for drag handles when `draggable=true`.<br>• **Replacement**: supersedes the older `TrackItem.js`.<br>• **Actions without a mouse** (F63): the action buttons of a row (the X that removes a track) are hidden until hover only where the device can hover (`@media (hover:hover)`); on a touch screen they are always shown, and the keyboard focus shows them anywhere. Each button has an `aria-label`. *(removed in F65: `TrackItem.js`)* |

---

## 3. Visual Utilities (`components/common/`)

| Component | Responsibility | Details |
| :--- | :--- | :--- |
| **`AlbumCascade.js`** | Visualization component that renders a stack of album thumbnails. | • used in `BlendSeriesSelector`, `SavedPlaylistCard` and `SavedPlaylistsView` to visually represent a collection of albums.<br>• handles empty states and efficient Z-indexing for the "Deck of Cards" effect. |

## Architectural Shift: The "Universal" Pattern

A key finding from this audit is the move towards **Universal Components**.
*   **Old Way**: `AlbumCard.js` for albums, `PlaylistCard.js` for playlists, `SeriesCard.js` for series.
*   **New Way**: `Card.js` handles all of these via `props.variant` and flexible content slots.


---

## 4. Interaction & Feedback (`components/shared/`)

| Component | Responsibility | Details |
| :--- | :--- | :--- |
| **`ContextMenu.js`** | **Contextual Actions**. Renders a floating menu at cursor position. | • **Positioning**: Fixed at the `x`/`y` it is given; it does not check the viewport bounds.<br>• **Command Pattern**: Accepts an array of `{ label, icon, action, danger }` items (`props.actions`).<br>• **Click-Outside**: Auto-dismisses when clicking elsewhere.<br>• **Usage today**: no module imports it. *(removed in F65: `ContextMenu.js`)* |
| **`SkeletonLoader.js`** | **Loading State**. Renders placeholder shapes while data fetches. | • **Polymorphic**: Supports `card`, `list` and `text` variants.<br>• **Animation**: Uses `animate-pulse` to indicate activity.<br>• **Usage today**: no module imports it; the screens use `components/ui/skeletons/`. *(removed in F65: `SkeletonLoader.js`)* |

