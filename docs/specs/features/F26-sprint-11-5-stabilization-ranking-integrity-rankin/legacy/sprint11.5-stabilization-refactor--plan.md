# Implementation Plan: Sprint 11.5 - Stabilization & Refactor

**Branch**: `feature/sprint11.5-stabilization` | **Date**: 2025-12-19 | **Spec**: [spec.md](spec.md)

## Summary

This sprint serves as the foundation for reliable playlist generation. The primary goal is to achieve **Total Ranking Integrity**: solving the critical "Wrong Tracks" bug (#71) and ensuring every album in a series has validated ranking data before the orchestration algorithms (Sprint 12) run.

## Technical Context

**Language/Version**: Javascript (ES6)  
**Primary Dependencies**: Firestore, SortableJS, MusicKit/Spotify SDKs  
**Storage**: Firestore (Primary), localStorage (Cache)  
**Testing**: Manual E2E (Multi-browser), Console Debugging  
**Project Type**: Web Application

## Constitution Check

- **Constraint**: Must keep `AlbumsView.js` functional during refactor.
- **Strategy**: Incremental extraction. We will first extract the **State Logic** before touching the **Render Logic**.

## Project Structure

### Documentation (this feature)

```text
docs/technical/specs/sprint11.5-stabilization-refactor/
├── spec.md              # Requirements & Scenarios
├── plan.md              # This file
└── tasks.md             # Detailed checklist
```

## Implementation Phases

### Phase 1: Investigation & Patch (Bug #71)
- Add deterministic logging to `AlbumsView.updateAlbumsGrid`.
- Trace the value of `album.id` passed to `TracksRankingComparison`.
- Check for shared track reference mutation in `Album.js`.
- **Deliverable**: Identification and temporary patch for Bug #71.

### Phase 2: State Extraction (Refactor Start)
- Create `public/js/views/controllers/AlbumsStateController.js`.
- Move `this.filters` and `this.albums` into the controller.
- Implement an Observer pattern inside the controller to notify the View of state changes.
- **Goal**: Resolve Bug #74 (View Toggle) by making the state independent of re-renders.

### Phase 3: Metadata Fixes & Documentation
- Solve Bug #58 (PENDING Badge) by auditing the repository layer.
- Complete documentation for Issue #75 in `data_flow_architecture.md`.
- Final verification of Spotify Export Flow.

## Source Code Layout

```text
public/js/
├── views/
│   ├── AlbumsView.js                # To be modularized
│   └── controllers/
│       └── AlbumsStateController.js  # [NEW]
├── components/
│   └── ranking/
│       └── TracksRankingComparison.js # Investigation target
└── repositories/
    └── AlbumRepository.js           # Bug #58 target
```
