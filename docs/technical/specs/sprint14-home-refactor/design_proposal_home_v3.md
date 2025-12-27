# Design Proposal: Home View V3 (The Album Blender)

**Objective**: Redesign the Home View to better accommodate the new "Discography Scan", "Search", and "Staging Area" workflows while maintaining the premium V3 aesthetic.

## 1. Core Layout Structure
Move from a linear vertical form to a **Split-Panel Workspace**.

### Left Panel (40%): The Control Deck
Fixed or sticky panel containing the input and context.
- **Hero/Brand**: Compact top branding.
- **Series Config**: Series Name input (always visible).
- **Search Logic Controller**:
    - **Visual Mode**: `ArtistScanner` component (Search bar + Auto-complete).
    - **Bulk Mode**: `BulkInputPanel` component (Textarea + Validation).
    - *Toggle between modes with a clear tab switcher.*
- **Staging Area (Mini)**:
    - A condensed vertical list or "stack" of selected albums.
    - Drag-and-drop ordering support.
    - "Initialize" button at the bottom (always accessible).

### Right Panel (60%): The Result Matrix
Scrollable content area for results.
- **Right Panel**: Result Matrix (Discography Grid).
    - **Sticky Toolbar**: Top bar with filters and sorting controls.
    - **Default Sort**: **Most Recent -> Oldest** (per user request).
    - **Grid**: Infinite scroll or paginated grid of album cards.
    - If scanner fails, toggles to a traditional search result list here.

## 2. Interaction Improvements
- **"Add" Animation**:
    - When clicking an album in the grid, animate a "clone" of the cover flying to the Staging Area on the left.
- **Manual "Bulk Mode" Tab**:
    - A dedicated tab in the Left Panel for text-based input.
    - Real-time validation (green checkmarks next to lines that resolve).

## 3. Visuals & Aesthetics
- **Flattened Depth**: Use glassmorphism for the panels, but keep the background dynamic (the current "Flame" or "Hero" image).
- **Badge System**: Clearer badges for "Deluxe", "Remaster", "Live" on the album cards to reduce reliance on opening modals to know what version it is.

## 4. "Plain Mock" (Wireframe) - Split Panel View

```text
+-----------------------------------------------------------------------+
|  [LOGO] MJRP Blender                                                  |
+----------------------+------------------------------------------------+
|  LEFT PANEL (Fixed)  |            RIGHT PANEL (Scrollable)            |
|                      |                                                |
|  [Series Name Input] |   [Discography Toolbar (Sticky)]               |
|                      |   [Filter: Album | Single | Live ]             |
|  [TAB: Visual | Bulk]|                                                |
|                      |   +---------------------------------------+    |
|  [ARTIST SEARCH BAR] |   | [Album Card]  [Album Card] [Album Card]|    |
|  "Pink Floyd" [Scan] |   | "Dark Side"   "The Wall"   "Animals"  |    |
|                      |   +---------------------------------------+    |
|  [SCAN STATUS: OK]   |                                                |
|                      |   +---------------------------------------+    |
|  STAGING AREA (Stack)|   | [Album Card]  [Album Card] [Album Card]|    |
|  +----------------+  |   | 1. Dark Side   |  |   | "Meddle"      "Wish You"   "Piper"    |    |
|  | 2. The Wall    |  |   +---------------------------------------+    |
|  | 3. Animals     |  |                                                |
|  | 4. Meddle      |  |   (Infinite Scroll Down...)                    |
|  +----------------+  |                                                |
|                      |                                                |
|  [INITIALIZE LOAD]   |                                                |
+----------------------+------------------------------------------------+
```

## 5. Prototype Plan
- **Phase 1 (Mock)**: Above ASCII wireframe for structural agreement.
- **Phase 2 (Visual Prototype)**: `static_prototype_v3.html` created.

![V3 Prototype](file:///C:/Users/Mauricio%20Pedroso/.gemini/antigravity/brain/9bae9fee-eaf9-4880-9275-3355e3b08fdd/prototype_v3_full_png_1766780013610.png)
*Fig 2: Static Prototype showing the Split Panel layout with Flame gradient and Glassmorphism.*

## 6. Mobile Responsiveness
- **Stacking**: On mobile, the Left Panel becomes a top header/drawer, and the Right Panel takes the full screen.
- **Bottom Bar**: Staging Area moves to a collapsible bottom sheet "Selected Albums (5)".

---

**Next Steps (ARCH-11)**:
1. Create `HomeViewV3.js` (shadow component).
2. Implement split-panel layout.
3. Migrate `ArtistScanner` and `StagingArea` logic.
