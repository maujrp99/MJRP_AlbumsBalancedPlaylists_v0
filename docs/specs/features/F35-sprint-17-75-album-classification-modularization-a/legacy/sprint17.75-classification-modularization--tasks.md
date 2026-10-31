# ARCH-18: Album Classification Modularization - Tasks

**Sprint**: 17.75
**Created**: 2026-01-06
**Status**: 📋 READY FOR EXECUTION
**References**: [spec.md](spec.md) | [plan.md](plan.md)

---

## Phase 1: Infrastructure (Foundation)

- [ ] **T1.1** Create `classification/` folder structure
  - Path: `public/js/services/album-search/classification/`
  
- [ ] **T1.2** Create `BaseStrategy.js` interface
  - Ref: [spec.md#Arquitetura](spec.md#padrões-arquiteturais-utilizados)
  - Must have: `name` property, `execute(album, context)` method

- [ ] **T1.3** Create `ElectronicGenreDetector.js` helper
  - Ref: [spec.md#Gêneros Eletrônicos](spec.md#gêneros-eletrônicos-lista-expandida)
  - Export: `isElectronic(genres)`, `ELECTRONIC_GENRES` array

- [ ] **T1.4** Create `classification/index.js` barrel export

---

## Phase 2: Strategies (Pipeline Components)

- [ ] **T2.1** Create `AppleMetadataStrategy.js` (Etapa 1)
  - Ref: [spec.md#ETAPA 1](spec.md#etapa-1-applemetadatastrategy-fonte-primária-inicial)
  - Rules: isSingle → Single, isCompilation → Compilation

- [ ] **T2.2** Create `TitleKeywordStrategy.js` (Etapa 2)
  - Ref: [spec.md#ETAPA 2](spec.md#etapa-2-titlekeywordstrategy)
  - Categories: Live, DJ Mix, Single, EP, Remix, Greatest Hits, Soundtrack

- [ ] **T2.3** Create `RemixTracksStrategy.js` (Etapa 3)
  - Ref: [spec.md#ETAPA 3](spec.md#etapa-3-remixtracksstrategy)
  - Check: ≥50% tracks contain "remix/mix/version/edit"

- [ ] **T2.4** Create `TrackCountStrategy.js` (Etapa 4)
  - Ref: [spec.md#ETAPA 4](spec.md#etapa-4-trackcountstrategy-com-proteção-prog-rock)
  - Rules: 1-3→Single, 4-6→EP, prog rock protection

- [ ] **T2.5** Create `AIWhitelistStrategy.js` (Etapa 5)
  - Ref: [spec.md#ETAPA 5](spec.md#etapa-5-aiwhiteliststrategy-apenas-eletrônica)
  - Logic: Electronic + not in list → Uncategorized

---

## Phase 3: Orchestrator

- [ ] **T3.1** Create `AlbumTypeClassifier.js`
  - Ref: [spec.md#Chain of Responsibility](spec.md#1-chain-of-responsibility-funil)
  - Import all strategies, define pipeline order
  - Export singleton: `albumTypeClassifier`

---

## Phase 4: Integration

- [ ] **T4.1** Refactor `AlbumSearchService.js`
  - Import `albumTypeClassifier`
  - Replace `_classifyWithAI()` call with `albumTypeClassifier.classify()`
  - Delete `_classifyWithAI()` method (~100 LOC)

---

## Phase 5: UI Updates

- [ ] **T5.1** Add Uncategorized filter type to `DiscographyToolbar.js`
  - New button with "?" icon

- [ ] **T5.2** Add item counters to filter buttons
  - Ref: [plan.md#UI Mockup](plan.md#2-ui-mockup-filter-bar-with-counters)
  - Format: `[Albums (X)]`

- [ ] **T5.3** Update `SearchController.js` to calculate counts
  - Count albums per type after classification

---

## Phase 6: Verification

- [ ] **T6.1** Test Ferry Corsten
  - Expected in Studio: Right of Way, L.E.F., Twice in a Blue Moon, WKND, Blueprint, Connect (6)
  - NOT in Studio: Once Upon a Night, Full On Ferry

- [ ] **T6.2** Test Yes - Close to the Edge
  - Expected: NOT classified as EP (prog rock protection)

- [ ] **T6.3** Test remix package detection
  - Search artist with known remix singles

- [ ] **T6.4** Verify filter counters display correctly

---

## Execution Order

```
Phase 1 (Foundation) → Phase 2 (Strategies) → Phase 3 (Orchestrator)
    → Phase 4 (Integration) → Phase 5 (UI) → Phase 6 (Verification)
```
