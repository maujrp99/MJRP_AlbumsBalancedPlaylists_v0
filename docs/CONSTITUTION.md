# MJRP Project Constitution

## Core Principles

### I. User-Centric Quality
The user experience must be premium, dynamic, and polished.
- **Visuals**: Use curated color palettes, micro-animations, and responsive design. No generic styles.
- **Interaction**: UI must feel "alive". No dead clicks or silent failures.
- **Validation**: Features are not "done" until the User confirms they are done (Golden Rule).

### II. Clean Code & Modular Architecture
We favor simplicity and standard web technologies over complex framework lock-in where possible.
- **Tech Stack**: Vanilla Javascript (ES Modules), Vite, CSS Variables (Tailwind only if requested).
- **Patterns (not limited to)**:
    - **Store Pattern** for client-side state management (Observer-based).
    - **Repository Pattern** for data access (Firestore, LocalStorage).
    - **Service Layer** for external integrations (AI, Auth).
- **Structure**: Separation of concerns (View vs Logic vs Data).

### III. Documentation First
Documentation is a living part of the codebase, not an afterthought.
- **Single Source of Truth**: `ARCHITECTURE.md`, `ROADMAP.md`, and `technical/devops/DEVOPS_GUIDE.md` must reflect reality.
- **Traceability**: Every bug fix requires an entry in `DEBUG_LOG.md`.
- **Planning**: No code is written without an `implementation_plan.md` or `Implementation Guide` approved by the user.

### IV. Spec-Driven & Test-Supported
We design before we build, and we verify what we built.
- **Spec-First**: For complex features (like Auth), a detailed technical specification is required before implementation (See `.specify/templates/`).
- **Testing**:
    - **Unit Tests** (Vitest) for core logic (Stores, Repositories).
    - **Manual Verification** plans must be explicit and executed.
    - **E2E Tests** (Puppeteer) for critical user flows, avoiding fragile external dependencies where possible.

### V. Operational Excellence
Production stability is paramount.
- **Deployment**: Zero-downtime deployments via CI/CD.
- **Config**: Secrets managed via Environment Variables/Secret Manager.
- **Monitoring**: Logs must be meaningful and accessible.

## Technology Standards

### Backend (Cloud Run)
- Node.js runtime.
- Stateless, scalable container.
- Shared logic with frontend via `/shared` directory.
- Input validation (AJV) for all external data.

### Frontend (Firebase Hosting)
- SPA Architecture.
- History API Routing.
- Mobile-first responsiveness.

## Governance

- **Amendments**: Changes to this constitution require User approval.
- **Compliance**: All Pull Requests and Design Docs must align with these principles.
- **Versioning**: This document follows Semantic Versioning (MAJOR.MINOR.PATCH).

**Version**: 1.0.0 | **Ratified**: 2025-12-10 | **Last Amended**: 2025-12-10
