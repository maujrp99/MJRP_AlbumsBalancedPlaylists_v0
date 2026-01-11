---
description: ### 3. Tasking Phase (`tasks.md`) for SDD
---

### 3. Tasking Phase (`tasks.md`)
**Goal**: Define WHEN and Order of Operations.
1. Agent creates/updates `docs/technical/specs/<feature>/tasks.md`.
2. Checklist items must be granular reflecting exactly what was added to the plan.md and verifiable.
3. Add tasks for using our test suites (npm run test and/or npm run test:e2e) after the implementation and run the build (npm run dev).
4. Agent requests User Review.
5. **Gate**: Start Execution only after Tasks are APPROVED.