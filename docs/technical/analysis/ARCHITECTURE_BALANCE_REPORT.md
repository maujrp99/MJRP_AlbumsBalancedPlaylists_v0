# Architecture Balance Analysis: Frontend vs Backend

**Date**: 2026-01-03
**Subject**: Architectural Distribution Analysis (Thick Client vs Thin Server)
**Based on**: Codebase Quantitative Scan (v10.1) & Product Vision

---

## 1. The Current Reality (The "90/10" Split)

Our quantitative analysis revealed a distinct **"Thick Client"** architecture:

*   **Frontend (Browser)**: ~25,000 LOC (Logics, Views, State)
*   **Backend (Server)**: ~2,500 LOC (Proxy, Scrapers, Auth)

This **10:1 ratio** places `90%` of the application complexity inside the user's browser. The Backend acts primarily as a "dumb pipe" for data fetching (scraping) and secure token exchange.

---

## 2. Is this balance correct?

**Short Answer: YES, but with a structural warning.**

Given the **Product Vision** ("User Sovereignty", "Complementary Intelligence") and the specific constraints of this application, this distribution is generally **intentional and beneficial**.

### ✅ Why the "Thick Client" works for The Album Blender:

1.  **Iterative Interactivity (The "Blender" Metaphor)**
    *   **User Need**: Users tweak algorithms, drag-and-drop tracks, and regenerate playlists repeatedly.
    *   **Tech implication**: Moving ranking/sorting logic to the backend would introduce **network latency** for every slider adjustment. Doing it in the browser ensures "instant" feedback (60fps), essential for a tool that feels like an instrument.

2.  **Cost & Scalability (Cloud Run Economics)**
    *   **Current**: Heavy sorting/balancing algorithms run on the **User's CPU** (Free).
    *   **backend-heavy**: Running these CPU-intensive loops on Node.js/Cloud Run would significantly increase compute costs and require scaling instances for concurrent users.

3.  **Data Sovereignty & Offline Potential**
    *   **Vision Compliance**: The data belongs to the user (`User Sovereignty`).
    *   **Future**: A thick client architecture is 80% of the way to a **PWA (Progressive Web App)** that effectively works "offline-first", syncing only when needed.

4.  **Dataset Size**
    *   **Scale**: We are processing Series of ~10-100 albums. Modern JavaScript engines (V8) can sort/filter arrays of this size in **microseconds**. We are not crunching Big Data that *requires* server-side processing.

---

## 3. The "Findins": Where the imbalance hurts

While the *topology* (Front vs Back) is correct, the *internal structure* of the Frontend is suffering from the weight.

### 🔴 The Real Problem: "Frontend Monoliths"

The 25k lines are not evenly distributed. They are clumped into **"God Views"** and **"God Objects"**:

1.  **Logic Leaks**: Business logic (e.g., Filtering, Ranking) often lives inside View files (`SeriesView`) rather than pure logic modules. This makes the frontend feel "heavier" than it is because UI and Logic are coupled.
2.  **Bundle Size**: A 25k LOC bundle takes time to parse and execute.
3.  **State Complexity**: Managing strictly consistent state (Undo/Redo, Sync) across 25k lines of vanilla JS is exponentially harder than in a strict framework or Backend DB.

### 🔍 Specific Findings:

| Area | Status | Verdict |
| :--- | :--- | :--- |
| **Ranking Algorithms** | Frontend | **KEEP**. Requires instant interactivity. |
| **Data Normalization** | Mixed | **MOVE TO BACKEND**. The server should return "Clean" data. Currently, the client does too much data patching (fixing "Thriller" bugs, etc). |
| **API Integration** | Backend | **KEEP**. Secure keys must stay on server. |
| **HTML Generation** | Frontend | **REFACTOR**. The Views are generating too much HTML string logic. |

---

## 4. Recommendations

Do **NOT** rewrite the application to be server-side rendered (SSR) or move core logic to the backend. Instead, **professionalize the Frontend Architecture**.

### 1. Refactor, Don't Relocate
*   **Action**: Aggressively decouple Logic from Views (Sprint 17).
*   **Goal**: The `SeriesView.js` should be 200 lines of UI binding, effectively "dumb". The complex logic (filtering, sorting) should be in `SeriesController.js` and `SeriesFilterService.js`.

### 2. Strengthen the "BFF" (Backend for Frontend) Contract
*   **Action**: The Backend should return data that is **100% ready to use**.
*   **Current**: Backend returns raw scraped data → Frontend normalizes/patches it.
*   **Future**: Backend normalizes EVERYTHING. Frontend assumes data is perfect. This reduces frontend "defensive coding" bloat.

### 3. Embrace the "App" Nature
*   Since this is a Thick Client, treat it like a Desktop App.
*   Invest in **Service Workers** (caching) to make the large bundle load instantly on subsequent visits.

## 5. Summary

We have built a **Desktop-class Application running in the Browser**. This is a valid modern architectural choice (like Figma or VS Code). The "weight" on the frontend is a feature, not a bug—provided we manage the code quality strictly.

**Recommendation**: Stay the course on Architecture. Double down on **Modularization**.
