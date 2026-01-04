---
description: Systematic process for assessing codebase quality, architectural integrity, and modularity
---

# Code Quality Assessment Protocol v2.0

Execute this protocol at the end of every sprint or major architectural milestone or whenever the human user requests.
The goal is to provide a quantitative and qualitative measure of **Real Code Quality**: Architecture Compliance, Domain Modularity, Design Pattern Integrity, and Cognitive Load.

---

## 1. Preparation
1.  **Identify Scope**: Determine if the assessment covers the entire project or specific components (e.g., "Sprint 17 Modularization").
2.  **Environment Check**: Ensure the repository is in a stable state (passing builds/tests).
3.  **Baseline**: Locate the previous assessment (e.g., `docs/technical/refactor/CODE_QUALITY_ASSESSMENT_vN.md`).

## 2. Quantitative Scan (The "Cold" Hard Numbers)

### A. Line Count & Structure
- **Identify God Classes**:
    - Views > 350 LOC (Strict)
    - Controllers > 300 LOC
    - Services > 200 LOC
- **Nesting Depth**: Count functions with indentation depth > 3 levels.

### B. V2 Scorecard Metrics

| Metric Group | Specific Metric | Formula/Definition | Target |
| :--- | :--- | :--- | :--- |
| **Componentization** | **Atomic Density** | "Dumb" Components / Total Components | > 70% |
| | **Component Reusability** | Usage Count > 1 across Views | > 30% |
| **Modularization** | **Layer Violations** | View -> Repository or Controller -> DOM imports | **0** |
| | **Logic Isolation** | Services with 0 UI dependencies | 100% |
| **Maintainability** | **Cognitive Load** | Max Nesting Depth per file | < 3 |
| **Tech Health** | **Safe Sink Ratio** | Usage of `textContent`/`SafeDOM` vs `innerHTML` | 100% : 0% |

---

## 3. Qualitative Scoring (The 1-10 Scale)

Evaluate core files using the following criteria. Penalize heavily for "Hidden Complexity".

| Score | Label | Description |
|-------|-------|-------------|
| 🔴 1-2 | **Critical Debt** | "God Class", circular dependencies, side-effects, >500 LOC. |
| 🟠 3-4 | **High Debt** | Layer violations (e.g., View limits DB), hard to test, copy-paste logic. |
| 🟡 5-6 | **Acceptable** | Functional but needs refactor. <300 LOC but high nesting or low cohesion. |
| 🟢 7-8 | **Good** | Clean Separation of Concerns, Standard Pattern usage, predictable state. |
| 🔵 9-10 | **Exemplary** | "Dumb" Views, Pure Functions, 100% Testable, <150 LOC. |

---

## 4. Deep Architecture Audit (The "Real Quality" Check)

### A. Layer Compliance (Strict Boundaries)
*Verify if strict boundaries are respected:*
- **Views**: MUST ONLY talk to Controllers or Components. NEVER import Repositories or logic Services.
- **Controllers**: MUST ONLY manage State/Data. NEVER manipulate DOM directly (use View binding).
- **Services**: MUST be environment-agnostic. NEVER import `views/` or `components/`.
- **Stores**: MUST be Observable. State changes MUST happen via Actions, not direct mutation.

### B. Design Pattern Integrity
*Audit the fidelity of implemented patterns:*
- **Strategy Pattern**: Do all strategies implement the exact same interface? (Verify `generate()` signature).
- **Passive View**: Does the View contain ANY business logic (`if (user.isPremium)`)? If yes, Fail.
- **Repository Pattern**: Are raw Firestore calls leaked into Controllers? (Should be in Repos).
- **Facade Pattern**: Are complex subsystems (MusicKit) truly hidden behind a simple API?

### C. Component Atomicity
*Check the quality of UI components:*
- **Purity**: Does the component rely *only* on Props? (Smart vs Dumb).
- **Lifecycle**: Are event listeners explicitly removed in `unmount()`?
- **Style Isolation**: Does it use utility classes (Tailwind) or leak global CSS?

### D. Cognitive Load & Readability
- **Import Clarity**: Does a file import > 15 modules? (Sign of high coupling).
- **Naming**: Do names reflect *Intent* (`loadSeries`) or *Implementation* (`getFirebaseData`)?
- **Magic Numbers**: Are configs/constants hardcoded in logic?

---

## 5. Report Generation (Template)
Create a new file `docs/technical/refactor/CODE_QUALITY_ASSESSMENT_v[N+1].md`:

### 📊 Metric Scorecard
*(Insert Table from Section 2)*

### 🔍 Deep Audit Findings
- **Layer Violations Detected**: (List files breaking the rules).
- **Pattern Integrity**: (Pass/Fail for key patterns).
- **Cognitive Hotspots**: (List files with dangerous nesting/complexity).

### 🔴 Top 3 Refactor Targets
| File | Current Score | Primary Violation | Recommended Fix |
| :--- | :--- | :--- | :--- |
| `path/to/file.js` | 3 | View importing Repository | Move logic to Controller |

### 🎯 Strategic Recommendations
- **Immediate**: fix layer violations.
- **Mid-term**: split complex components.

---

## Completion Checklist
- [ ] Computed Quantitative Metrics (including Layer Violations).
- [ ] Audited Design Pattern fidelity.
- [ ] Reviewed Cognitive Load (nesting/imports).
- [ ] Generated Report Argument.