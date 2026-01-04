# Task Checklist - Sprint 13: Technical Debt & V3 Architecture

**Last Updated**: 2025-12-25T21:40

## 1. Documentation Audit & Setup
- [x] Create `sprint-13` branch
- [x] Update `docs/ROADMAP.md`
- [x] **Audit Phase 2: Consolidation**
    - [x] Move `reports/*.md` to `docs/archive/` or `docs/manual/`
    - [x] Move specs to `docs/technical/specs/sprint13-tech-debt/`
    - [x] Clean up root `docs/`
- [x] Update `codebase_analysis.md` in `docs/technical/`
- [ ] Verify `onboarding_protocol` matches current state

## 2. Technical Debt Implementation
- [x] **CRIT-1: Atomic Playlist Saves**
    - [x] Review Spec
    - [x] Create Implementation Plan
    - [x] Implement `runBatchSave` in `PlaylistsStore`
    - [x] Verify
- [x] **CRIT-2: Security Hardening**
    - [x] Scan for `innerHTML`
    - [x] Replace with `textContent` / `createElement`
- [x] **ARCH-1: Refactor PlaylistsView**
    - [x] Create `PlaylistsController.js` (Business Logic)
    - [x] Create `PlaylistsGridRenderer.js` (HTML Generation)
    - [x] Create `PlaylistsDragHandler.js` (Interaction)
    - [x] Refactor `PlaylistsView.js` (Orchestrator) & Deprecate `EditPlaylistView`
    - [x] Fix album loading pattern (use `apiClient.fetchMultipleAlbums`)
    - [/] Verify refactored view (Creation, Editing, Reconfiguration)
- [/] **CRIT-4: Firestore Rules**
    - [x] Added rules for `users/{userId}/series/{seriesId}/albums`
    - [ ] User to deploy rules to Firebase Console

## 3. Review
- [ ] Final Self-Review
- [ ] Commit & Push
