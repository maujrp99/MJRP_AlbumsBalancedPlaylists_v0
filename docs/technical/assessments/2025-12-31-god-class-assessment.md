# Codebase Health Assessment: God Classes Report
**Date**: 2025-12-31
**Context**: Preparation for Sprint 17 (Refactoring)

## Overview
Three critical files have been identified as "God Classes" or maintainability bottlenecks requiring immediate refactoring.

---

## 1. `MusicKitService.js` (811 LOC) - 🚨 CRITICAL
**Problem**: Violation of Single Responsibility Principle (SRP).
This service handles:
- Authorization & Token Management
- Catalog Search & Normalization
- Library Management (Playlists, Folders)
- Storefront/Region Logic
- Similarity Scoring Logic

**Impact**: High coupling makes changes risky (e.g. changing auth logic might break search). Testing is difficult.

**Proposed Refactoring (Sprint 17)**:
Break into valid facade services:
- `MusicKitAuth.js`: Auth state, tokens, storefront detection (`getBrowserStorefront`).
- `MusicKitCatalog.js`: Search, discography fetch, album details.
- `MusicKitLibrary.js`: Create playlist, folder management.
- `MusicKitService.js`: Main facade that coordinates the above (backward compatibility).

---

## 2. `albumSeries.js` (588 LOC) - 🚨 CRITICAL
**Problem**: Massive Code Duplication & Corruption.
- The class methods (`createSeries`, `updateSeries`, etc.) are defined **twice**: once before the constructor and once after.
- This indicates a bad merge or copy-paste error.
- The file is unnecessarily long and confusing.

**Proposed Refactoring (Sprint 16/17)**:
- Immediate cleanup of duplicate methods.
- Verify which version of the methods is the correct/latest one.

---

## 3. `curation.js` (518 LOC) - ⚠️ HIGH
**Problem**: Mixed concerns in Core Logic.
- **Enrichment**: 160 lines of fetching/scoring/normalizing.
- **Generation**: 130 lines of playlist allocation.
- **Balancing**: 45 lines of specialized swap logic.

**Impact**: Adding new algorithms (Phase 4, S-Draft) bloats this file further.

**Proposed Refactoring (Sprint 17)**:
- Extract `EnrichmentService` for track scoring/metadata.
- Implement **Strategy Pattern** for generation algorithms:
    - `PlaylistGenerator.js` (Context)
    - `GenerationStrategy` (Interface)
    - `CascadeStrategy.js`
    - `BalancedSwapStrategy.js`

---

## Roadmap Integration
These findings justify a dedicated **Sprint 17: Architectural Modularization**.
scope:
1. Fix `albumSeries.js` (Quick Win)
2. Modularize `MusicKitService` (High Effort)
3. Refactor `curation.js` (Medium Effort)
