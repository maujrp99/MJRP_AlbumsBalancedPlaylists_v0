---
description: Systematic process for debugging and fixing issues
---

# Debugging Workflow

Follow this strictly this process for every reported bug to ensure quality and prevent regressions.

## 1. Intake & Logging
1.  **Reproduce**: Confirm the issue.
2.  **Log**: Add entry to `debug_log.md`.
    - Issue Description
    - Current vs Expected Behavior
    - Evidence
3. Get more context: review the entire debug log (all versions) to get the history, to learn and potentially avoid reapplying previously failures attempts

## 2. Analysis
1.  **Trace**: Identify the root cause.
2.  **Hypothesis**: Formulate a theory.
3.  **Plan**: Describe the fix before coding.

## 3. Impact Assessment
**CHECKLIST - Do not proceed until answered:**
- Check all the ARCHITECTURE.md for your analysis to be more throughout.
- [ ] Does this affect global state/navigation?
- [ ] Does it work on Hard Refresh?
- [ ] Does it work for New AND Existing items?
- [ ] Does it introduce visual artifacts?


## 4. Implementation
1.  **Apply Fix**: Edit the code.
2.  **CAUTION**: Check for duplicated code blocks (Syntax Errors).
3.  **Mark as Fixed/Resolved**: only when the user confirms, otherwise the status is "Potential Fix Applied".

## 5. Verification
1.  **Test Happy Path**.
2.  **Test Hard Refresh (F5)**.
3.  **Test Navigation (Back/Forward/Deep Link)**.
4.  **Check Console for Errors**.

## 6. Failure Recovery
- If fix fails: **Revert**, **Log Failure**, **New Hypothesis**.
- **DO NOT** erase failed attempts from log. Rollback the code fix applied.