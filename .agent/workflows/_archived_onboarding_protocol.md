---
description: Agent onboarding protocol - comprehensive project context loading
---

# Agent Onboarding Protocol

Execute this protocol when starting a new conversation or when context is lost.
This ensures the agent has full understanding of project architecture, standards, and current state.

---

## Step 1: Read Rules & Workflows (`.agent/` folder)

### Rules (`.agent/rules/`)
// turbo
1. Read `architecture-rules.md`
2. Read `debug-rules.md`
3. Read `developer_rules.md`
4. Read `documentation-rules.md`

### Workflows (`.agent/workflows/`)
// turbo
5. Read `architecture_protocol.md` - Architecture and Technical Analysis Protocol
6. Read `code_quality_assessment_protocol.md` - Code quality assessment process
7. Read `debug_protocol.md` - Systematic process for debugging and fixing issues
8. Read `developer_protocol.md` - Golden rules for development
9. Read `Documentation protocols/documentation-protocol.md` - Living Rules for documenting accordingly
10. Read `Documentation protocols/documentation_audit.md` - Documentation Audit & Reorganization Protocol
11. Read `Documentation protocols/post-implementation-docs.md` - Post-implementation documentation checklist
12. Read `SDD Protocols/SDD-Full-protocol.md` - Specification Defined Development (SDD) Full Protocol
13. Read `SDD Protocols/plan-SDD-protocol.md` - SDD Planning Phase Protocol
14. Read `SDD Protocols/specify-SDD-protocol.md` - SDD Specification Phase Protocol
15. Read `SDD Protocols/task-SDD-protocol.md` - SDD Tasking Phase Protocol
16. Read `onboarding_protocol.md` - This Onboarding Protocol


---

## Step 2: Read Core Documentation (`docs/` folder)

### Product Vision (`docs/product-management/`) - READ FIRST
// turbo
17. Read `product-management/MJRP_Product_Vision.md` - Core product philosophy, Universal Series Model, Blending Menu concept
18. Read `product-management/VISION_FEEDBACK_ANALYSIS.md` - User feedback and strategic adjustments
19. Read `PROJECT_SUMMARY.md` - Executive project overview

### Architecture & Standards
// turbo
20. Read `ARCHITECTURE.md` - Overall system architecture
21. Read `CHANGELOG.md` - Recent changes and version history
22. Read `CONSTITUTION.md` - Core principles and guidelines
23. Read `CONTRIBUTING.md` - Contribution guidelines
24. Read `README.md` - Main project README
25. Read `ROADMAP.md` - Future plans and milestones

---

## Step 3: Read Technical Documentation (`docs/technical/` folder)

// turbo
26. Read `album_data_schema.md` - Data models for albums
27. Read `ARCHITECTURE_AUDIT.md` - Architecture review findings
28. Read `data_flow_architecture.md` - Data flow patterns
29. Read `UI_STYLE_GUIDE.md` - UI/UX guidelines

---

## Step 4: Read Debug & Onboarding Docs (`docs/debug/` and `docs/onboarding/`)

### Debug (`docs/debug/`)
// turbo
30. Read `DEBUG_LOG.md` - Current and historical debugging issues

### Onboarding (`docs/onboarding/`)
// turbo
31. Read `DEVELOPER.md` - Developer onboarding guide
32. Read `DEVOPS.md` - DevOps and deployment guide
33. Read `QA_ENGINEER.md` - QA testing guide
34. Read `README.md` - Onboarding overview
35. Read `UX_UI.md` - UX/UI design guide

---

## Step 5: Read SDD Templates (`.specify/templates/` folder)

// turbo
36. Read `agent-file-template.md` - File change template
37. Read `checklist-template.md` - Task checklist template
38. Read `plan-template.md` - Planning document template
39. Read `spec-template.md` - Feature specification template
40. Read `tasks-template.md` - Task breakdown template

---

## Step 6: Code Quality Ritual (`docs/technical/refactor/`)

// turbo
41. Read `PROTOCOL.md` - Code Quality Assessment Protocol reference
42. Execute `code-quality-assessment-protocol.md`
43. Identify any critical issues or tech debt to be aware of

---

## Completion Checklist

After executing all steps, confirm understanding of:

- [ ] **Product Vision** (Universal Series Model, Blending Menu, Album-Centric Philosophy)
- [ ] Project architecture and patterns (Clean Architecture, SPA)
- [ ] Data models (Album, Track, Playlist, Series)
- [ ] Current sprint/feature work (check `docs/technical/specs/`)
- [ ] Open debugging issues (from DEBUG_LOG.md)
- [ ] Code quality state (from CODE_QUALITY_ASSESSMENT.md)
- [ ] UI/UX standards (from UI_STYLE_GUIDE.md)

---

## Quick Reference After Onboarding

| Topic | Document |
|-------|----------|
| **Product Vision** | `docs/product-management/MJRP_Product_Vision.md` |
| Bug tracking | `docs/debug/DEBUG_LOG.md` |
| Architecture | `docs/ARCHITECTURE.md` |
| Data models | `docs/technical/album_data_schema.md` |
| UI Standards | `docs/technical/UI_STYLE_GUIDE.md` |
| Current work | `docs/technical/specs/sprint**/` |