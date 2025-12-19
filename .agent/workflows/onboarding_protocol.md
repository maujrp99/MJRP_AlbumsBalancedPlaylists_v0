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
5. Read `architecture_protocol.md`
6. Read `debug_protocol.md`
7. Read `documentation_audit.md`
8. Read `sdd_protocol.md`

---

## Step 2: Read Core Documentation (`docs/` folder)

// turbo
9. Read `ARCHITECTURE.md` - Overall system architecture
10. Read `CHANGELOG.md` - Recent changes and version history
11. Read `CONSTITUTION.md` - Core principles and guidelines
12. Read `CONTRIBUTING.md` - Contribution guidelines
13. Read `PROJECT_SUMMARY.md` - Project overview
14. Read `README.md` - Main project README
15. Read `ROADMAP.md` - Future plans and milestones

---

## Step 3: Read Technical Documentation (`docs/technical/` folder)

// turbo
16. Read `album_data_schema.md` - Data models for albums
17. Read `ARCHITECTURE_AUDIT.md` - Architecture review findings
18. Read `data_flow_architecture.md` - Data flow patterns
19. Read `UI_STYLE_GUIDE.md` - UI/UX guidelines

---

## Step 4: Read Debug & Onboarding Docs (`docs/debug/` and `docs/onboarding/`)

### Debug (`docs/debug/`)
// turbo
20. Read `DEBUG_LOG.md` - Current and historical debugging issues

### Onboarding (`docs/onboarding/`)
// turbo
21. Read `DEVELOPER.md` - Developer onboarding guide
22. Read `DEVOPS.md` - DevOps and deployment guide
23. Read `QA_ENGINEER.md` - QA testing guide
24. Read `README.md` - Onboarding overview
25. Read `UX_UI.md` - UX/UI design guide

---

## Step 5: Read SDD Templates (`.specify/templates/` folder)

// turbo
26. Read `agent-file-template.md` - File change template
27. Read `checklist-template.md` - Task checklist template
28. Read `plan-template.md` - Planning document template
29. Read `spec-template.md` - Feature specification template
30. Read `tasks-template.md` - Task breakdown template

---

## Step 6: Architecture Review (`docs/refactor/`)

// turbo
31. Read `CODE_QUALITY_ASSESSMENT.md` - Code quality metrics and analysis
32. Analyze current codebase state based on assessment findings
33. Identify any critical issues or tech debt to be aware of

---

## Completion Checklist

After executing all steps, confirm understanding of:

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
| Bug tracking | `docs/debug/DEBUG_LOG.md` |
| Architecture | `docs/ARCHITECTURE.md` |
| Data models | `docs/technical/album_data_schema.md` |
| UI Standards | `docs/technical/UI_STYLE_GUIDE.md` |
| Current work | `docs/technical/specs/sprint**/` |
