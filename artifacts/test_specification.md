# Test Specification

**Status**: Draft
**Last Updated**: 2026-01-10

## Overview
This document serves as the master checklist for Manual and Automated testing, as referenced in `QA_ENGINEER.md`.

## 1. Regression Checklist (Manual)

### Navigation
| ID | Scenario | Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| TC-NAV-001 | Application Load | Open `/` | App loads without console errors. Banner visible. |
| TC-NAV-002 | Route Switching | Click 'Albums' then 'Playlists' | URL updates, View content swaps instantly. |

### Data Integrity
| ID | Scenario | Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| TC-DAT-001 | Album Count | Go to 'Albums', check badge | Count matches Firestore DB. |
| TC-DAT-002 | Series Isolation | Create Series A & B. Add Album to A. Switch to B. | Album from A must NOT be visible in B. |

## 2. Automated Test Descriptions (E2E)

### Smoke Tests
- `smoke.test.js`: Verifies basic app visibility and navigation correctness.

### Issue Verifications
- `issue-15-ghost-albums.test.js`: Ensures no cross-contamination between Series.
- `issue-16-view-toggle.test.js`: Verifies Grid/List toggle persistence.

## 3. Bug Report Evidence Template
When logging bugs in `docs/debug/DEBUG_LOG.md`, link to these TCs:

```markdown
### Issue #X: [Title]
**Related TC**: TC-NAV-002
**Evidence**: [Screenshot]
```
