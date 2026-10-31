# SDD Phase 1: Specification [IMPLEMENTED]
: Sprint 21 - Mobile UX & Layout Refresh

## 1. Goal
Improve the overall User Experience on mobile devices (specifically iPhone), focusing on layout consistency, responsive data presentation, and mobile-friendly interactions for drag-and-drop.

## 2. Success Criteria

### 2.1. Home View Layout Logic
- [ ] **Mobile Reordering**: On small screens, the "Discography Scan" (02B) must appear immediately after "Artist Filter" (02A) and before "Selected Albums" (03).
- [ ] **Call to Action**: The "Initialize Load Sequence" button must remain at the bottom of the logical flow on mobile, but only after the user has had the chance to select albums.

### 2.2. Loading & Performance UX (Deep Dive)

#### 2.2.1. Series Loading: Visual Feedback (Skeleton UX) 💀
- [ ] **Skeleton Groups**: When loading the "All Series" view, the app will first display "empty containers" (boxes with dashed borders or pulsing gray backgrounds) representing the series known from Firestore metadata.
- [ ] **Ghost Series Skeletons**: Within each "Skeleton Group", render small pulsing rectangles ("ghosts") in place of the album covers. This gives the user immediate perception of the page structure (e.g., "5 series coming up") before the albums finish loading.
- [ ] **Micro-Status Labels**: Each series header will display a real progress indicator:
    - *Example*: "Rock Classics ... [ 💿 4 / 12 ]" - indicates that 4 albums have been processed/enriched out of a total of 12.
- [ ] **Non-Jumpy Rendering**: Use CSS `min-height` on series containers to prevent the layout from shifting drastically as albums are enriched and rendered.

#### 2.2.2. Series-Aware Virtual Lazy Loading (Hybrid Strategy) 💎
- **Benchmarks & Justification**:
    - *Virtualization*: Mobile browsers choke when DOM nodes exceed ~1,500. A grid of 100 albums produces ~3,000 nodes (30 nodes/card). Virtualization is mandatory for lists > 50 items [Nodes Benchmark].
    - *Load More vs. Infinite Scroll*: Baymard Institute research favors "Load More" buttons for categorical browsing (like our Series) to ensure users can reach the footer and maintain a sense of location.
- **Solution: Two-Level Lazy Loading**:
    1.  **Level 1 (Series - Infinite Scroll)**: The `SeriesController` loads **Metadata** for all series (fast), but the Renderer draws **only the first 3 complete series** to the DOM.
        - *Mechanism*: The other series remain in "standby" (not in DOM). A "scroll sentinel" at the bottom of the page detects when the user nears the end and triggers rendering of the next 3 series.
        - *Impact*: Initial load (First Paint) is nearly instant because the browser only draws ~3 headers and ~36 albums (3 series x 12 albums) instead of 50 series at once.
    2.  **Level 2 (Albums - Load More)**: Within each Series, apply a **Hard Cap of 12 albums** (multiple of 2, 3, and 4).
        - If series > 12 albums: Display a "Load More Albums (+X)" button at the end of the card list.
        - *Performance Win*: With a limit of 12, we ensure instant rendering (only ~360 DOM nodes per series), making the app extremely lightweight even on older devices. Large series become "opt-in".

### 2.3. Responsive Tracks Presentation
- [ ] **Mobile Adaptation**: The `TracksTable` must adapt for iPhone screens. 
- [ ] **Card Pattern**: Switch from a horizontal table to a "Card List" layout on small screens.
- [ ] **Drawer Alternative**: Evaluate replacing centered modals with **Bottom Sheets** (Native-feel sliders) for track list previews.

### 2.4. Mobile-Friendly Drag-Drop & Modals
- [ ] **Full-Screen Ranking Mode**: For the `UserRankModal`, implement a full-screen "Task View" option for mobile. 
    - *Rationale*: Small-centered modals provide too little vertical space for dragging long lists on iPhone. A full-screen overlay provides maximum "track real estate".
- [ ] **Touch Logic**: Add a small delay (200ms) to SortableJS on touch devices to prevent drag-triggering during a normal scroll gesture.

## 3. Requirements

### 3.1. Technical Requirements
- Use **CSS Media Queries** (Tailwind `md:` prefix or custom queries) for the Home View layout shift.
- Implement a **Responsive Variant** for the `TracksTable` component.
- Optimize **SortableJS** configuration for mobile (delay on touch/press if necessary to allow scrolling).

## 4. Architectural Compliance

### 4.1. Constitution Mapping
- **UI Consistency (Art. I)**: Uses existing Design Tokens (Sky-500, Flame Gradient) to ensure the mobile experience feels native to the MJRP brand.
- **Component Reuse (Art. II)**: Core logic for ranking and track listing is shared between desktop (Modals) and mobile (Drawers/Full-screen) using the same Component classes with layout variants.

### 4.2. Strategy Pattern
- **Shell Strategy**: Implement a responsive shell selector that abstract away the "Dialog vs Drawer" decision from the business logic.
- **Thin View Policy**: All state for the new mobile layouts remains managed by existing Controllers, ensuring no duplication of state or branching logic in the rendering layer.
