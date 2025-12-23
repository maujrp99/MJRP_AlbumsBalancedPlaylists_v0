---
description: Post-implementation documentation checklist - run after completing any feature
---

# Post-Implementation Documentation Checklist

> Invoke this workflow after implementing any feature or fix to ensure docs stay updated.
> Follow the documentation guidelines of documentation-protocol.md

## When to Use
- After completing a feature implementation
- After fixing a significant bug
- After any architectural change

## Checklist

### 1. Architecture Docs (if structure changed)
- [ ] Update `docs/ARCHITECTURE.md` if new patterns or components added
- [ ] Update `docs/technical/data_flow_architecture.md` if:
  - New views added
  - New stores/services added
  - New data flows created
  - Navigation routes changed

### 2. Component Reference (if components changed)
- [ ] Document new components in data flow inventory
- [ ] Update component API documentation
- [ ] Mark outdated components as deprecated

### 3. Debug Log (for bug fixes)
- [ ] Add entry to `docs/debug/DEBUG_LOG.md` with:
  - Issue ID
  - Problem description
  - Root cause
  - Solution applied
  - Files modified

### 4. Spec Files (for new features)
- [ ] Ensure spec in `docs/technical/specs/` is marked as IMPLEMENTED
- [ ] Update any spec sections that changed during implementation

## Automation Note
This checklist is meant to be reviewed by the developer after implementation.
Call this workflow: `/post-implementation-docs`