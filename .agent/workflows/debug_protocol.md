---
description: Debugging Protocol
---

# Debug Protocol v2.0 (Integrated)

**Purpose**: Systematic process for finding, fixing, and documenting issues.
**Trigger**: A reported bug or critical failure.

## 1. Intake (Grounding)
1.  **Grounding**: Read `docs/onboarding/DEVELOPER.md` to load context.
2.  **Log**: Add entry to `docs/debug/DEBUG_LOG.md`.
    -   *Format*: `[Date] [IssueID] [Description]`.
3.  **Reproduce**: Confirm the issue.

## 2. Analysis (The "Why")
1.  **Consult Manuals**: Check `docs/manual/01_System_Architecture.md` to understand *intended* behavior.
2.  **Hypothesis**: Formulate a theory.
3.  **Plan**: Describe the fix.
    -   *Check*: If fix requires changing a Core Pattern -> **STOP**. Write an ADR first (`docs/decisions/`).

## 3. Implementation
1.  **Apply Fix**: Edit the code.
2.  **Code Check**: Confirm no Layer Violations (`View` -> `Repository`).

## 4. Verification (The "Safety Net")
1.  **Happy Path**: Verify the fix works.
2.  **Regression Check**:
    -   Consult `docs/manual/regression_checklist.md`.
    -   Run the specific checklist section relevant to your change (e.g., `[HOME]`, `[SERIES]`).
3.  **Hard Refresh**: (F5) Does it persist?

## 5. Closure (The "Definition of Done")
1.  **Log Resolution**: Update `DEBUG_LOG.md` with:
    -   Root Cause.
    -   Solution.
    -   Files Modified.
2.  **Update Manuals**:
    -   *Logic*: If you changed how it works, **UPDATE THE MANUAL**.
    -   *Check*: `docs/manual/00_MJRP_Album_Blender_Ref_Guide_Index.md`.
3.  **User Confirmation**: Ask the user to verify.