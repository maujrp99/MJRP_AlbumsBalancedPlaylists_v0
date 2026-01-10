---
description: Documentation protocol
---

# Documentation Protocol & Post-Implementation Checklist

**Purpose**: Defines the Single Source of Truth for documentation and the mandatory checklist for developers after coding.

## 1. The Documentation Map
We rely on a **Manual-Based** documentation system, not a chronological log.

### **Manuals (The Truth)**
-   **Location**: `docs/manual/`
-   **Purpose**: Describes the *current* state of the system.
-   **Rule**: If you change code, you **MUST** update the corresponding Manual chapter.
-   **Index**: [00_MJRP_Album_Blender_Ref_Guide_Index.md](file:///c:/Users/Mauricio%20Pedroso/VibeCoding/MyProjects/MJRP_AlbumsBalancedPlaylists_v0/docs/manual/00_MJRP_Album_Blender_Ref_Guide_Index.md)

### **Architecture Decision Records (The History)**
-   **Location**: `docs/decisions/`
-   **Purpose**: Explains *why* a decision was made.
-   **Rule**: Never update old ADRs. Create new ones to supersede.

### **Onboarding (The People)**
-   **Location**: `docs/onboarding/`
-   **Purpose**: Guides for Humans (Developer, QA, DevOps).

---

## 2. Post-Implementation Checklist
> **Trigger**: Run this checklist after every feature Implementation or significant Bug Fix.

### ✅ Immediate Actions
- [ ] **Check Manuals**: Did I touch a feature covered in `docs/manual/`?
    - If YES: Update the chapter to match the new code.
- [ ] **Check Regression**: Did I add a new critical flow?
    - If YES: Add it to `docs/manual/regression_checklist.md`.
- [ ] **Check Specs**: Is there a `docs/technical/specs/` file?
    - If YES: Mark it as `[IMPLEMENTED]`.

### 🐞 For Bug Fixes
- [ ] **Debug Log**: Add entry to `docs/debug/DEBUG_LOG.md`.
    - Format: `[Date] [IssueID] [Root Cause] [Fix]`.

### 🏗️ For Architecture Changes
- [ ] **ADR**: Did I change a core pattern?
    - If YES: Create a new ADR in `docs/decisions/`.

---

## 3. Maintenance
- **Periodic Audit**: Run `documentation_audit_protocol.md` monthly or when instructed.
- **Archive Policy**: Do not delete useful history; move it to `docs/archive/`.
