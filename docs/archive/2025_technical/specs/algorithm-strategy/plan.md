# Implementation Plan: Algorithm Strategy Pattern

**Branch**: `feature/sprint8-algorithm-strategy` | **Date**: 2025-12-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `docs/technical/specs/algorithm-strategy/spec.md`

## Summary

Refactor the playlist generation system from a monolithic `CurationEngine.curate()` to a pluggable Strategy Pattern. Users will select an algorithm from a UI selector, and the system executes the corresponding strategy.

## Technical Context

**Language/Version**: JavaScript ES6+ (Vanilla JS)  
**Primary Dependencies**: None (pure JS classes)  
**Storage**: N/A (algorithms are stateless)  
**Testing**: Vitest  
**Target Platform**: Web (SPA)  
**Project Type**: Single frontend project  
**Performance Goals**: Generation < 1 second for 10 albums  
**Constraints**: No external dependencies, maintain backward compatibility  
**Scale/Scope**: 3 algorithms, 1 UI selector, ~500 lines new code

## Constitution Check

✅ Single Responsibility: Each algorithm in separate file  
✅ Open/Closed: New algorithms don't modify existing code  
✅ Dependency Inversion: Views depend on BaseAlgorithm interface  

## Project Structure

### Documentation (this feature)

```text
docs/technical/specs/algorithm-strategy/
├── spec.md              # User stories & requirements
├── plan.md              # This file
└── tasks.md             # Implementation tasks
```

### Source Code

```text
public/js/
├── algorithms/                      # NEW directory
│   ├── BaseAlgorithm.js            # Abstract base class
│   ├── LegacyRoundRobinAlgorithm.js # Algorithm #0
│   ├── SDraftOriginalAlgorithm.js   # Algorithm #1
│   ├── SDraftBalancedAlgorithm.js   # Algorithm #2
│   └── index.js                     # Registry & factory
├── views/
│   └── PlaylistsView.js             # MODIFY: Add selector UI
├── curation.js                       # MODIFY: Use selected algorithm
└── shared/curation.js               # DEPRECATED (logic moved)
```

### Tests

```text
tests/
└── algorithms/
    ├── BaseAlgorithm.test.js
    ├── SDraftBalancedAlgorithm.test.js
    └── registry.test.js
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| New directory `algorithms/` | Separation of concerns | Single file would be 1500+ lines |
| 3 algorithm files | Each algorithm is complex | Combined file unmaintainable |

## Implementation Phases

### Phase 1: Foundation
- Create `BaseAlgorithm.js` with interface
- Create `index.js` registry
- No breaking changes yet

### Phase 2: Extract Legacy
- Move current `curate()` logic to `LegacyRoundRobinAlgorithm.js`
- Wire registry to PlaylistsView
- Verify backward compatibility

### Phase 3: Implement Original
- Create `SDraftOriginalAlgorithm.js` with full Serpentine
- Add to registry

### Phase 4: Implement Balanced
- Create `SDraftBalancedAlgorithm.js` with new rules
- Mark as recommended

### Phase 5: UI Selector
- Remove old inputs
- Add algorithm radio group
- Wire selection to generation

### Phase 6: Polish
- Tests
- Documentation update
