# Architecture Decision Protocol (ADR)
Architecture Decision Records (ADR) provide a historical log of significant design choices, separating "Why we did it" (History) from "How it works clearly" (Manuals).

## 1. When to write an ADR
Create an ADR when a decision:
-   Introduces a new framework, language, or storage engine.
-   Changes a core architectural pattern (e.g., "Switching from Controller-View to MVVM").
-   Has significant trade-offs (e.g., "Performance vs. Maintainability").
-   Is difficult to reverse.

## 2. File Convention
-   **Location**: `docs/decisions/`
-   **Format**: `NNNN-short-title-kebab-case.md` (e.g., `0001-use-firebase-firestore.md`)
-   **Numbering**: Sequential (0001, 0002, ...).

## 3. Workflow
1.  **Draft**: Create the file effectively proposing the change.
2.  **Review**: Discuss with the team/user.
3.  **Decision**: Mark as `Accepted` or `Rejected`.
4.  **Merge**: Commit to the repository.
5.  **Sync Manuals**: **CRITICAL**. Once accepted, you MUST update the `docs/manual/` files to reflect the *new* truth. The ADR explains *why*, the Manual explains *what is*.

## 4. ADR Template
```markdown
# [Short Title]

**Status**: 🟢 Accepted | 🟡 Proposed | 🔴 Rejected | ⚪ Deprecated
**Date**: YYYY-MM-DD
**Deciders**: [List names]

## Context
[What is the issue? What constraints are we facing?]

## Decision
[We decided to...]

## Consequences
-   ✅ **Positive**: [Benefit 1]
-   ⚠️ **Negative**: [Trade-off 1]
-   🔄 **Risks**: [Risk 1]
```
