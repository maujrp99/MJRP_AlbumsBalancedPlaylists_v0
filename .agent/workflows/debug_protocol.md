---
description: Debugging Protocol
---

# Debug Protocol v2.0 (Integrated)

**Purpose**: Systematic process for finding, fixing, and documenting issues.
**Trigger**: A reported bug or critical failure.

## The GOLDEN RULES
1. Ensure you follow the GOLDEN RULES of .agent/developer_rules.md

## 1. Intake (Grounding)

1.  **Grounding**: Read `docs/onboarding/DEVELOPER.md` to load context.

2.  **Log**: Add entry to `docs/debug/DEBUG_LOG.md`.
    -   *Format*: `[Date] [IssueID] [Description]`.
    **How to Update /DEBUG_LOG.md`**:
       0.Update the Last Update timestamp
       1. Active issues → Current Debugging Session
       1.1 Update the Issue Index
       2. Resolved/reverted issues → Move to Previous with timestamp
       3. Keep Previous sections for history (don't delete)
       4. Always keep the issues on cronological order or numbered order

3.  **Reproduce**: Confirm the issue.

## 2. Analysis (The "Why")

1.  **Consult Manuals**: Check `docs/manual/01_System_Architecture.md` to understand *intended* behavior. consulte o `docs/00_MJRP_Album_Blender_Ref_Guide_Index.md`
2. Consider this: what's your overall/holistic impact analysis of the potential fix? Have you reallu checked all markdow manuals related with thr bug context to ensure you have the big picture and awareness of all functionalities that may be impacted? What functionalities could be impacted and mostly important what functionalities/code/interface you believe it will not break?
3.  After the throughour analysis of the 2 previous steps:
    **Hypothesis**: Formulate a theory.
4.  **Plan**: Describe the fix.
    -   *Check*: If fix requires changing a Core Pattern -> **STOP**. Write an ADR first (`docs/decisions/`).

## 3. Implementation
0. Follow our CONSTITUTION.md and the ´/docs/manual/01_System_Architecture.md´
1.  **Apply Fix**: Edit the code making analysis to implement a fix with componentization and modularity reuse whenever possible following our architecture patterns and If not possible try to modularize or componetize the fix.
2.  **Legacy Code**: If the fix replace a code, clean it and add to the debug log the deleted/replaced code.
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