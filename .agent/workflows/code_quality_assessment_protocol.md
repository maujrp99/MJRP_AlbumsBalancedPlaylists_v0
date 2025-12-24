---
description: Systematic process for assessing codebase quality and architectural alignment
---

# Code Quality Assessment Protocol

Execute this protocol at the end of every sprint or major architectural milestone or whenever the human user request.
The goal is to provide a quantitative and qualitative measure of clean architecture, modularity of backend logic, componetization of UI and frontend elementtechnical debt and clean code compliance.

---

## 1. Preparation
1.  **Identify Scope**: Determine if the assessment covers the entire project or specific components (e.g., "V3 Refactor").
2.  **Environment Check**: Ensure the repository is in a stable state (passing builds/tests).
3.  **Baseline**: Locate the previous assessment (e.g., `docs/technical/refactor/CODE_QUALITY_ASSESSMENT_vN.md`).

## 2. Quantitative Scan
1.  **Line Count Analysis**:
    - Identify "God Classes" (>500 lines for Views, >300 lines for Modules).
    - Compare total LOC (Lines of Code) against the baseline.
2.  **Quantitative Scorecard**:

| Metric Group | Specific Metric | Formula/Definition | Target |
| :--- | :--- | :--- | :--- |
| **Componentization (UI)** | **Density** | Total Components / Total Views | >3.0 |
| | **Reusability** | Components in `shared/` / Total Components | >40% |
| **Modularization (Logic)** | **Decoupling** | Modules with 0 DOM refs / Total Logic Modules | 100% |
| | **Logic-to-View** | LOC (Controllers+Algos) / LOC (Views) | >1.0 |
| **Tech Health** | **Safe Sink Ratio** | Usage of `textContent` vs `innerHTML` | 1:0 |
| | **Async Safety** | % of API calls with explicit Error Handling | 100% |



## 3. Qualitative Scoring (The 1-10 Scale)

Evaluate core files using the following criteria:

| Score | Label | Description |
|-------|-------|-------------|
| 🔴 1-2 | Critical | God Class, mixed responsibilities, hard to test, >500 LOC. |
| 🟠 3-4 | High | Needs refactor soon. 300-500 LOC, some pattern violations. |
| 🟡 5-6 | Medium | Acceptable but contains tech debt. 150-300 LOC. |
| 🟢 7-8 | Good | Clean code, single responsibility, well-documented. |
| 🔵 9-10 | Excellent | Exemplary patterns, modular, fully tested. |

## 4. Critical Domains Analysis

### A. Frontend Componentization (UI focused)
- **Visual Consistency**: Does the component strictly follow the `UI_STYLE_GUIDE.md`?
- **Lifecycle compliance**: Do UI components implement `mount`, `unmount`, and `update`?
- **Prop Logic**: Is the component "dumb" (receiving all data via props)?

### B. Logic Modularization (Infrastructure/Backend focused)
- **State Isolation**: Does the logic module manage its state without leaking to other modules?
- **Dependency Injection**: Are external services (like Firestore or Spotify API) injected rather than hardcoded?
- **Testability**: Can this logic be tested without a browser environment?

### C. Performance Assessment
- **DOM Efficiency**: Are we re-rendering the whole grid or just changed cards?
- **Debouncing**: Are search/filter inputs debounced to prevent API spam?
- **Memory Management**: Are event listeners being cleaned up in `unmount()`?


### C. Security & Vulnerabilities
- **Injection Risks**: Any usage of `innerHTML` or `eval()`? (Use `textContent` or templates).
- **Sanitization**: Is user-provided content (e.g., Series titles) sanitized?
- **Secrets**: Are there any hardcoded API keys or Firebase secrets?
- **Auth Guarding**: Are internal routes/actions checked against `UserStore.isLoggedIn`?

## 5. Architectural Gap Analysis
1.  **Diagram Check**: Compare the current filesystem against `ARCHITECTURE.md` diagrams.
2.  **Pattern Compliance**: Verify if core patterns (MVC, Observer, Repository) are strictly followed.
3.  **Documentation Sync**: Identify outdated sections in specs or technical guides.


## 5. Report Generation (Actionable Template)
Create a new file `docs/technical/refactor/CODE_QUALITY_ASSESSMENT_v[N+1].md` structured as follows:

### 📊 Executive Scorecard
Construct the table from Section 2, highlighting **Current** vs **Previous** values.

### 🔴 Priority Matrix (The "Top 5 Fixes")
Rank the 5 most critical files or modules based on the 1-10 scale.
- **Each entry must include**: `File Path`, `Score`, `Main Violation`, and `Actionable Fix`.

### 🧩 Domain Analysis
A concise summary of findings from Section 4:
1.  **UI Componentization**: Status of the Lego-block migration.
2.  **Logic Modularization**: State of the "Brain-separation" (Controllers/Services).
3.  **Performance & Security**: Identified leaks, bottlenecks, or sinks.

### 🎯 Strategic Recommendations
- **Immediate (Sprint N+1)**: Tasks for the very next cycle.
- **Architectural (Long-term)**: Changes to patterns or infrastructure.

## 6. Cleanup & Archiving
1.  Link the new assessment in `docs/technical/refactor/PROTOCOL.md`.
2.  Update the `onboarding_protocol.md` if relevant metrics or target folders changed.

---

## Completion Checklist

- [ ] Quantitative data collected (LOC, File count).
- [ ] Scoring applied to all changed files.
- [ ] Componentization & Modularization review completed.
- [ ] Performance & Security checks performed.
- [ ] Architectural gaps identified.
- [ ] New report file created and linked.
- [ ] Next steps/Recommendations proposed.