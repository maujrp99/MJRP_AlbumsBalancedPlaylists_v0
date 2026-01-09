# MJRP Forensic Documentation Conflict Report

**Generated**: 2026-01-08
**Scope**: Comparison of Legacy Documentation (Sprint 1-15) vs. New Deep Dive Manual (Phase 1-10 Analysis).

## 1. Executive Summary

The codebase has undergone a "Forensic Documentation" process (Phases 1-10), resulting in 31+ new analysis files in `docs/comprehensive_manual/raw_analysis/`. This process revealed significant divergence from the existing documentation, which had become primarily a "Changelog" rather than a system map.

**Key Finding**: The Legacy Documentation (`docs/ARCHITECTURE.md`, `docs/technical/*`) describes **how we got here** (history), whereas the New Manual describes **where we are** (state).

---

## 2. Critical Conflicts & Divergences

### 2.1 System Architecture
*   **Legacy (`docs/ARCHITECTURE.md`)**:
    *   **Status**: Mixed (Current + Historical).
    *   **Conflict**: Structured as a list of "ARCH-X" tickets (e.g., "ARCH-1 PlaylistsView Modularization"). It mixes implemented features with planned ones (e.g., "ARCH-18 Planned").
    *   **Reality**: The new `system_architecture.md` (Phase 10) presents the *consolidated* state, removing the "Sprint" noise. It explicitly defines the "Master Map" which contradicts the fragmented diagrams in the legacy doc.

*   **Legacy (`docs/technical/data_flow_architecture.md`)**:
    *   **Status**: Partially Valid but Redundant.
    *   **Conflict**: Contains huge overlapping Sequence Diagrams. Some flows (e.g., "SeriesView V3 Architecture") are accurate but duplicated in the new `frontend_views.md`.
    *   **Metric**: ~40% of this file is superseded by the new localized Mermaid diagrams in the Deep Dive manual.

### 2.2 Data Models & Schema
*   **Legacy (`docs/technical/album_data_schema.md`)**:
    *   **Status**: **Specific Bug Report / RFC**.
    *   **Conflict**: This document heavily focuses on a specific "Missing Artist Field" bug in Sprint 11. It documents a "Proposed Flow (FIXED)".
    *   **Reality**: The new `frontend_data_layer.md` and `server_logic.md` analyze the *actual* running code. If the code was fixed, the "Old" doc is now describing a solved problem as if it were a schema definition. It's confusing to read "Proposed Flow" in a permanent documentation file.


### 2.4 Versioning & Roadmap Conflicts
*   **Version Mismatch**:
    *   **PROJECT_SUMMARY.md**: Claims version `v2.12.0 (Production Stable)` and `Last Updated: 2025-12-23`.
    *   **ROADMAP.md**: Claims version `v3.15.5` and `Last Updated: 2026-01-02`.
    *   **Reality**: The project is functionally in v3.x, meaning `PROJECT_SUMMARY.md` is **severely outdated** (2 major versions behind).

*   **Onboarding / contextAI.md**:
    *   **Status**: **Dangerous Bloat**.
    *   **Conflict**: `docs/onboarding/contextAI.md` is a massive ~50KB dump of raw AI context likely from a previous session. It contains potentially hallucinated or obsolete state.
    *   **Action**: Should be marked for deletion to prevent polluting the agent context window.

---

## 3. The "Missing Link" Discrepancies

These are items found in the New Analysis that were **completely absent** from Legacy Documentation:

1.  **The "Ghost Test" Flow**: Confirmed in `test_suite_analysis.md`. Legacy docs barely mentioned E2E structure.
2.  **SaveAllView / Migration Logic**: The complexity of `SaveAllView.js` (Firebase direct imports vs DI) was undocumented until Phase 10 analysis exposed it.
3.  **Specific Algorithm Heuristics**: Legacy docs said "Use Algorithms". New `server_libs.md` documents the *exact* Scraper heuristics (Search vs Suggest fallback) which were undocumented tribal knowledge.
4.  **MusicKit Token Generation**: The server-side crypto flow (ES256 signing) was undocumented in `ARCHITECTURE.md`.

---

## 4. Recommendations for Consolidation

To resolve these conflicts, I propose the following **Retention & Archival Strategy**:

| Document | Action | Reasoning |
| :--- | :--- | :--- |
| `docs/MJRP_PRODUCT_VISION.md` | **KEEP** | Remains the high-level "Soul" of the project. Valid. |
| `docs/ARCHITECTURE.md` | **REPLACE** | Replace with content from `comprehensive_manual/raw_analysis/system_architecture.md`. Move old content to `docs/archive/ARCHITECTURE_HISTORY_v1.md`. |
| `docs/technical/data_flow_architecture.md` | **ARCHIVE** | Superseded by the 25+ localized Mermaid diagrams in the Deep Dive Manual. |
| `docs/technical/album_data_schema.md` | **REWRITE** | It is currently a bug report. Should be rewritten to be a clean Schema Definition derived from `server_schema.md`. |
| `docs/technical/UI_STYLE_GUIDE.md` | **KEEP (AS REF)** | Good for design tokens, but mark as "Non-Normative" (Code is Truth). |
| `docs/comprehensive_manual/` | **PROMOTE** | This folder becomes the canonical `docs/technical/` source. |

## 5. Conclusion

The "Onboarding Protocol" pointed to documents that were effectively **"Snapshot Reports"** of previous Sprints (11-15).
The "Deep Dive Manual" (Phases 1-10) is a **"Forensic Maps"** set.

**Action Item**: We must formally deprecate the Sprint-based documentation in favor of the Map-based documentation to prevent future confusion.
