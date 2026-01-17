---
description: Golden rules for development
---

# General Development Protocol

0. **Onboarding** 

- If you were not onboarded go to `.agent/workflows/onboarding_protocol_v2.md`

1. **Context & Planning**
   - [ ] Check for SDD files (`spec.md`, `plan.md`, `task.md`) OR `implementation_plan.md`.
   - [ ] **Missing Docs?**: Ask the user: "Do we need an SDD for this?"
   - [ ] Create/Update the plan if required.
   - [ ] Check, read, analyze `docs/CONSTITUTION.md` for following it.
   - [ ] Check, read, analyze `agent/developer_rules.md` for following it.

2. **Execution (SDD)**
   - [ ] If strictly new feature -> Check `specs/`.
   - [ ] Implement changes (Modular/Componentized). Follow the defined architecture standards and design patters.

3. **Verification**
   - [ ] Run Tests (`npm test`).
   - [ ] Verify functionality (Evidence required).

4. **Documentation Sync**
   - [ ] Run `.agent/workflows/documentation_protocol.md` workflow.

5. **Completion**
   - [ ] Log in `DEBUG_LOG.md` (if bug fix).
   - [ ] Request User Review.