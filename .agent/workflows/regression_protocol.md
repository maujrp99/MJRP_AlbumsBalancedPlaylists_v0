---
description: Regression and Safety Protocol
---

# Regression Protocol v1.0

**Purpose**: Ensure new changes do not break existing functionality.
**Trigger**: After implementing any code change (fix or feature), BEFORE requesting user validation.
**Reference**: `docs/manual/regression_checklist.md`

## 1. Compliance Check (The Golden Rule)
> [!IMPORTANT]
> **Golden Rule #9**: Use this structure to verify your work.

### Step 1: The Build Check
Always ensure the application builds successfully.
```bash
npm run build
```
- **Fail**: Stop and fix build errors.
- **Pass**: Proceed.

### Step 2: The Specific Check (Low/Medium Risk)
Identify the area you touched and execute the corresponding checklist section.
- **Reference**: Open `docs/manual/regression_checklist.md`.
- **Action**: Find the tag (e.g., `[HOME]`, `[SERIES]`, `[BLENDING]`).
- **Execute**: Perform the manual steps listed for that section.
- **Log**: Note successful verification in your internal log.

### Step 3: The Full Suite (High Risk)
**Trigger**:
- You modified Core Logic (`App.js`, `store/*.js`, `router.js`).
- You refactored a shared component (`BaseView`, `Card`).
- You are unsure of the impact.

**Action**:
1.  **Ask the User**:
    > "I have modified core logic. Should I run the Full Regression Checklist or the full Automated Suite?"
2.  **If Full Regression**:
    - Execute ALL sections of `regression_checklist.md`.
3.  **If Automated Suite**:
    - Run `npm test`.

## 2. Reporting
When confirming completion to the user, strictly follow this format:

```markdown
**Verification Complete**
1.  **Build**: Passed (`npm run build`).
2.  **Specific Check**: executed `[SERIES]` checklist.
    -   Creation: OK
    -   Filtering: OK
3.  **Risk Level**: Low (Isolated change).
```

## 3. Maintenance
If you find a bug during regression that is NOT related to your change:
1.  Do not fix it immediately (scope creep).
2.  Log it in `DEBUG_LOG.md`.
3.  Continue verification of *your* change.
