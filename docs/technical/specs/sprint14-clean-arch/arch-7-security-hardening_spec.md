# ARCH-7: Operation Safe Text (Security Hardening)

**Date**: 2025-12-26  
**Status**: 📋 SPECIFICATION  
**Sprint**: 14  
**Impact**: High (Security/Tech Debt)

---

## 1. Problem Statement

### Security Vulnerability
The codebase currently has **50+ instances of `innerHTML`** usage, primarily in Modals and Views. This exposes the application to Cross-Site Scripting (XSS) attacks if user-generated content (like playlist names or descriptions) is not strictly sanitized.

### Code Hygiene
There are **8 duplicate `escapeHtml` functions** scattered across the codebase, leading to maintenance issues and potential inconsistencies in how text is escaped.

### Goals
1. eliminate `innerHTML` usage where dynamic content is involved.
2. consolidate text escaping logic into a single utility.
3. standardize text injection using `textContent` for safety.

---

## 2. Requirements

### Functional Requirements
- **FR1**: Create a `utils/stringUtils.js` module with `escapeHtml` and `safeText` helpers.
- **FR2**: Refactor all Modals to use `textContent` instead of string interpolation + `innerHTML`.
  - Priority targets: `Modals.js`, `InventoryModals.js`, `SeriesModals.js`.
- **FR3**: Replace all 8 duplicate `escapeHtml` definitions with imports from the new utility.

### Non-Functional Requirements
- **NFR1**: Zero functional regressions in UI rendering (modals must look identical).
- **NFR2**: Zero performance degradation.

---

## 3. Success Criteria

| ID | Criteria | Validation |
|----|----------|------------|
| **SC1** | No duplicate `escapeHtml` functions remain | `grep -r "function escapeHtml" public/js` returns only 1 result |
| **SC2** | Modals render correctly without `innerHTML` | Manual verification of Create/Edit/Delete modals |
| **SC3** | XSS vector closed in Modals | Attempt to inject `<script>` in playlist name → renders as text |

---

## 4. Out of Scope

- Sanitizing `innerHTML` where HTML is *required* (e.g., rich text descriptions). For now, we focus on where it's *not* required.
- Refactoring huge Views (InventoryView) - handled in ARCH-8.

---

## Approval

- [ ] **USER APPROVAL REQUIRED** to proceed to Implementation Plan
