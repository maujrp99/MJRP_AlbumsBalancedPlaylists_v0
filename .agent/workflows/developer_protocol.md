---
description: Golden rules for development
---

### PROJECT CONSTITUTION
> [!IMPORTANT]
> **ALWAYS** follow the Project Constitution defined in `docs/CONSTITUTION.md`.
> It defines the Core Principles for User-Centric Quality, Clean Code, Documentation, and Testing.

### GOLDEN RULES
1. **Context First**: Always ask if you have full project context and what is the full context of the demand.
2. **Docs Verification**: Read carefully all documentation and point out contradictions.
3. **Spec-Driven**: For complex features, verify against `docs/technical/specs/` before implementation.
   - **MUST USE**: Templates in `.specify/templates/` for new features.
4. **Documentation Sync**: After implementing a feature or fix, always update the documentation.
5. **Debug Traceability**: Always log failed attempts and solutions in the debug log.
6. **User Validation**: Nunca marca nada como fixed ou done, enquanto o usuário não confirmar que está OK.
7. **Never break a working feature*: Garanta que novas implementações e fixes, não quebrem funcionalidades prontas e funcionais dos sprints anteriores.