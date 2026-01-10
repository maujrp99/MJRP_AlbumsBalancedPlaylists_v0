# ADR-016: Service Layer Extraction Pattern

**Date**: 2026-01-10
**Status**: Accepted
**Deciders**: MJRP, Antigravity AI Agent
**Related Sprint**: Sprint 18

## Context
The codebase had identified "God Routes" (backend, e.g., `albums.js` at 288 LOC) and "God Files" (frontend, e.g., `SpotifyExportModal.js` at 511 LOC, `TopNav.js` at 398 LOC). These violated the Single Responsibility Principle (SRP) and made testing, maintenance, and onboarding difficult.

## Decision
We introduce a **Service Layer** pattern for both backend and frontend:
1.  **Backend Services** (`server/lib/services/`) encapsulate domain-specific logic (scraping, AI calling, validation).
2.  **Frontend Services** (`public/js/services/`) encapsulate complex UI workflows (API orchestration, state machines).
3.  **Routes and Components become "Thin Orchestrators"**: They receive input, call Services, and return output. They contain minimal logic.

### Files Created
-   `server/lib/services/EnrichmentService.js`
-   `server/lib/services/GenerationService.js`
-   `public/js/services/SpotifyExportService.js`
-   `public/js/components/navigation/AuthNav.js`
-   `public/js/components/ui/AlbumCardRenderer.js`

## Consequences
**Positive**:
-   **Testability**: Services can be unit-tested in isolation.
-   **Readability**: Routes and Components are now scannable at a glance.
-   **Reusability**: Services can be called from multiple entry points (e.g., different routes or components).

**Negative**:
-   **Increased File Count**: More files to navigate, but the folder structure mitigates this.

## Alternatives Considered
1.  **Controller Objects (OOP)**: Rejected as too heavy for the existing Vanilla JS functional style.
2.  **Inline Refactor (Split within same file)**: Rejected as it doesn't improve testability.

## Notes
This pattern is now the standard for new logic extraction. All new "business logic" should be implemented as a Service first, then consumed by the Route or Component.
