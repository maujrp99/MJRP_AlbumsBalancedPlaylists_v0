---
trigger: always_on
---

### PROJECT CONSTITUTION

> [!IMPORTANT]
> **ALWAYS** follow the Project Constitution defined in `docs/CONSTITUTION.md` and the System Architecture `docs/01_System_Architecture.md`.
> It defines the Core Principles for User-Centric Quality, Clean Code, Documentation, and Testing.

### GOLDEN RULES
1. **Context First**: Always ask if you have full project context and what is the full context of the demand.

2. **Docs Verification**: Read carefully all documentation and point out contradictions or outdated information.

3. **Modularity First**: Always seek to modularize the logic of the backend and componentize the functionalities of the frontend. DO NOT VIOLATE the principle of separated responsibilities.

4. **Spec-Driven**: For complex features, check and ask if it needs to apply the SDD Protocols/SDD-Full-protocol.md

5. **Documentation Sync**: After implementing a feature or fix, always update the documentation following `post-implementation-docs.md`.

6. **Debug Traceability**: Always timestamp and log failed attempts/solutions in the debug log following debug_protocol.md.

7. **User Validation**: Never mark as fixed or done, while human user does not confirm it is really ok.

8. **Integrity Check**: Never commit without verifying and confirming with evidence the functionalities' integrity.

9. **Regression Safety**: Ensure that new implementations (fixes and features) do not break existing functionalities.
   - **Step 1**: Run a build (`npm run build`).
   - **Step 2**: Execute a specific check for the area you touched.(specific tag on docs/manual/regression_checklist.md)
   - **Step 3 (High Risk)**: For complex changes, ask the user: *"Should I run the Full Regression Checklist or the full Automated Suite?"* before requesting validation. (docs/manual/regression_checklist.md) 

10. **Workflow Integrity**: Never change a workflow without a human user request.
