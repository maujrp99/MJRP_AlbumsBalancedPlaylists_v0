# Implementation Plan: The Great Overhaul

> **Goal**: Establish a "Forensic Truth" across Documentation, Protocols, and Code Structure. Deprecate the "Sprint-based" history in favor of a "Map-based" state.

## User Review Required
> [!IMPORTANT]
> **Code Structure Changes**: Section 2.3 involves moving/archiving code files. Strict verification steps have been added to prevent breakage.
> **Documentation Deletion**: This plan involves **moving** (not deleting) huge chunks of legacy documentation to `docs/archive/`.
> **Protocol Rewriting**: Protocol rewriting is deferred to the Final Phase (Phase 5) to ensure the underlying documentation is stable first.

---

## 2. Proposed Changes

### 2.1 Documentation Overhaul (The "Single Source of Truth")

#### [ANALYSIS] Vision vs. Summary vs. READMEs
*   **Finding**: We have 3 "Landing Pages": Root `README`, `docs/README`, and `PROJECT_SUMMARY`. They duplicate "Quick Start" and "Version" info.
*   **Action**: **Consolidate to Root `README.md`**.
    *   **Root `README.md`**: Becomes the Master Entry Point.
        *   Add "Executive Summary" (from `PROJECT_SUMMARY`).
        *   Add "Documentation Tree" (from `docs/README`).
    *   **`docs/README.md`**: Simplify to a basic index (remove duplicate Quick Start).
    *   **`PROJECT_SUMMARY.md`**: **Archive** (Redundant).

#### [MODIFY] `docs/` Structure
*   **[NEW] `docs/manual/`**: The new home for the "Deep Dive" analysis files (promoted from `comprehensive_manual/raw_analysis/`).
*   **[MOVE] `docs/technical/*` -> `docs/archive/2025_technical/`**: Archive the old Sprint-based specs.
*   **[KEEP] `docs/technical/UI_STYLE_GUIDE.md`**: Valid reference.
*   **[REWRITE] `docs/technical/album_data_schema.md`**: Rewrite as a true schema definition.
*   **[DELETE] `docs/onboarding/contextAI.md`**: Remove the 50KB context dump.
*   **[AUDIT] `docs/onboarding/*`**: Review `QA_ENGINEER.md`, `DEVELOPER.md` vs. new Protocols.

### 2.3 Code Structure Cleanup (Strict Safety)
Reduce cognitive load by cleaning the workspace root.

#### [MODIFY] Root Directory
1.  **[MOVE] `test-*.js` (Root Scripts) -> `test/scripts/`**:
    *   *Safety*: Check `package.json` scripts.
2.  **[MOVE] `api_response_hendrix.json` -> `test/fixtures/`**:
    *   *Safety*: Grep codebase.
3.  **[ARCHIVE] `public/js/deprecated_curation.js`**:
    *   *Safety*: Grep codebase.
4.  **[DELETE] `public/js/api.js`**:
    *   *Safety*: Check vs `api/client.js`.

---

## 3. Execution Steps

### Phase 1: Code Structure Cleanup (The "Safe Sweep")
1.  **Audit Root Scripts**: Check `package.json` for dependencies on `test-*.js`.
2.  **Move Scripts**: Create `test/scripts/` and move the isolated test files.
3.  **Archive Legacy Code**: Verify `deprecated_curation.js` and `api.js` are unused. Move/Delete.

### Phase 2: The Archive (Docs Organization)
1.  Create `docs/archive/2025_technical/`.
2.  Move `docs/technical/specs`, `docs/technical/analysis`, `docs/technical/refactor` to archive.
3.  Move old `.md` files from `docs/technical/` EXCEPT `UI_STYLE_GUIDE.md`.
4.  **Consolidate Landing Pages**:
    *   Update Root `README.md` with best content from `docs/README` and `PROJECT_SUMMARY`.
    *   Archive `PROJECT_SUMMARY.md`.
    *   Trim `docs/README.md`.

### Phase 3: The Promotion (Docs)
1.  Move `docs/comprehensive_manual/raw_analysis/*` to `docs/manual/`.
2.  Rename files for clarity (e.g., `server_core.md` -> `01_Server_Core.md`).
3.  Update internal links in `docs/manual/system_architecture.md`.

### Phase 4: Consistency Sync
1.  Clean `docs/onboarding/`: Delete `contextAI.md`.

### Phase 5: Protocol Rewrite (Final)
1.  Review `docs/onboarding/*.md`.
2.  Write `onboarding_protocol_v2.md` referencing the NEW structure.
3.  Write `documentation_audit_protocol_v2.md`.
4.  Deprecate old protocols.
