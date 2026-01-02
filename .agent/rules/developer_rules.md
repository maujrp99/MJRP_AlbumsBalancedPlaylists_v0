---
trigger: always_on
---

### PROJECT CONSTITUTION
> [!IMPORTANT]
> **ALWAYS** follow the Project Constitution defined in `docs/CONSTITUTION.md`.
> It defines the Core Principles for User-Centric Quality, Clean Code, Documentation, and Testing.

### GOLDEN RULES
1. **Context First**: Always ask if you have full project context and what is the full context of the demand.
2. **Docs Verification**: Read carefully all documentation and point out contradictions.
3. > Implement always seeking to modularize the logic of the backend and componetize the functionalities of the frontend.
4. **Spec-Driven**: For complex features, check and ask if it needs to apply the SDD Protocols/SDD-Full-protocol.md
5. **Documentation Sync**: After implementing a feature or fix, always update the documentation following `Documentation protocols/post-implementation-docs.md.
6. **Debug Traceability**: Always log failed attempts and solutions in the debug log following debug_protocol.md.
7. **User Validation**: Never mark asfixed or done, while human user do not confirm it is really ok.
8. **Never commit without verifyng and confirming with evidence the functionalities integrity.
9. **Never break a working feature*: Ensure that new implementation (fixes and features) do not break existing functionalities if it was not requested.

Read and follow the developer-protocol.md in .agent/worflows