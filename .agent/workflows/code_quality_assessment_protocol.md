# Code Quality Assessment Protocol v3.0

Execute this protocol at the end of every sprint or major architectural milestone or everytime human user requests it.

## 1. Preparation
1.  **Identify Scope**: Determine if the assessment covers the entire project or specific components.
2.  **Environment Check**: Ensure tests pass (`npm run test`).
3.  **Baseline**: Check `docs/archive/` for previous assessments.

## 2. Quantitative Metrics (The Hard Numbers)
| Metric Group | Specific Metric | Formula/Definition | Target |
| :--- | :--- | :--- | :--- |
| **Componentization** | **Atomic Density** | "Dumb" Components / Total Components | > 70% |
| **Componentization** | **Prop Depth** | Max depth of prop passing chain | < 3 |
| **Modularization** | **Feature Coupling** | Cross-feature imports (e.g. Playlist -> Inventory internal) | **0** |
| **SoC** | **Layer Violations** | View -> Repository or Controller -> DOM imports | **0** |
| **Tech Health** | **Safe Sink Ratio** | Usage of `SafeDOM` vs `innerHTML` | 100% : 0% |
| **Backend Health** | **Route Thinness** | Routes > 50 LOC (Should delegate to Lib) | 0 |

## 3. Structural Stress Tests (The "Real Quality" Integrals)

### A. Separation of Concerns (The "Controller Diet")
- **The Controller Test**: Pick a random Controller (`InventoryController`).
    - *Fail*: If it loops through data to "calculate" totals (Business Logic leakage).
    - *Pass*: If it calls `Store.getStats()` or `Service.calculate()` and just passes result to View.
- **The View Test**: Pick a random View (`SeriesView`).
    - *Fail*: If it has `if (status === 'active' && price > 10)` inside the render (Logic leakage).
    - *Pass*: If it renders `album.isPremium` (Logic derived in Model/Presenter).

### B. Modularization (The "Feature Wall")
- **The Isolation Test**: Can you delete the `js/views/Inventory` folder and still build `js/views/Playlists`?
    - *Fail*: If `Playlists` imports `Inventory/utils/formatter.js`.
    - *Pass*: If they rely only on `Shared/` or `Core/`.
- **The Backend Test**: Can you delete `server/lib/ranking` without breaking `server/lib/enrichment`?

### C. Componentization (The "Composition" Check)
- **The Prop Drill**: Trace a piece of data (e.g. `user`).
    - *Fail*: `Home` -> `Header` -> `Nav` -> `UserMenu` -> `Avatar` (4 levels of passing).
    - *Pass*: `UserMenu` connects to `UserStore` directly, OR Composition is used (`<Header><UserMenu/></Header>`).

## 4. Deep Architecture Audit (The Rules)
Verify compliance against the **Manuals**:

### A. Layer Compliance (Refer: `manual/01_System_Architecture.md`)
- **Views**: MUST talk to Controllers/Components. NO Repositories.
- **Controllers**: MUST manage State. NO direct DOM manipulation. MUST use `try/catch`.
- **Stores**: MUST handle Data I/O. NO `window`/`document` access (UI Agnostic).

### B. Backend Integrity (Server Proxy)
- **Routes**: MUST be thin wrappers. Logic in `server/lib/`.

## 5. Report Generation
Create a **Snapshot Report** in `docs/archive/quality_assessment_YYYY-MM-DD.md`.

### Template
```markdown
# Quality Assessment: [Date]
**Assessor**: [Name]

## 1. Scorecard
[Insert Metrics Table]

## 2. Stress Test Results
- **Controller Diet**: [Pass/Fail] - Found logic in `InventoryController`.
- **Feature Wall**: [Pass/Fail] - `Playlists` is tightly coupled to `Albums`.

## 3. Violations & Plan
- [ ] Refactor `InventoryController` (Move logic to Service).
```