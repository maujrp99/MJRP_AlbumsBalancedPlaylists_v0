# Frontend Core Analysis

## 1. Entry Point: `public/index.html`
**Status**: `[ACTIVE]`
**Type**: Single Page Application (SPA) Shell

### Logic
-   **Framework**: Vanilla JS (ES Modules) via `<script type="module" src="/js/app.js">` (preceded by `/js/firebase-config.js`).
-   **Styling**:
    -   **Tailwind CSS**: Loaded via CDN (v3 script).
    -   **Custom Config**: In-page script defines colors (`brand.orange`), fonts (`Syne`), and gradients.
    -   **Fonts**: Google Fonts ("Syne").
-   **Security**: Strict **Content Security Policy (CSP)** whitelisting APIs (Spotify, Apple, Firebase, Google).
-   **Layout**: `#app` container, header/footer placeholders (`#header-container`, `#footer-container`).

---

## 2. Global Styles: `public/css/`
**Status**: `[ACTIVE]`
**Type**: CSS Design System

### Files
-   `index.css`: Main entry, imported by `public/js/app.js`. Imports `animations.css`, `neon.css`, `tech-theme.css` and `views/home.css`. `modals.css` is not imported here: `index.html` links it directly.
-   `animations.css`: Keyframes for UX enhancements:
    -   `shimmer`: For skeleton loaders.
    -   `zoomIn`: For modal/card entry.
    -   `progress-indeterminate`: For top loading bar.
-   `modals.css`:
    -   Custom modal implementation (`.modal-overlay`, `.modal-container`).
    -   Glassmorphism effects (`backdrop-filter`).
-   `neon.css`:
    -   "Gamer" aesthetic utilities.
    -   Blue/Green/Orange glowing borders and text shadows.
-   `tech-theme.css`:
    -   "Sci-Fi" UI elements.
    -   Chamfered panels (`.tech-panel`).
    -   Grid backgrounds (`.tech-grid-bg`).
