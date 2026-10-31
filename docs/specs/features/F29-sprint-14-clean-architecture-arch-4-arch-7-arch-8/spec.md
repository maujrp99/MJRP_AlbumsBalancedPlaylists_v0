---
status: Accepted
lane: standard
solution_type: feature
imports: []
sprint: SPR-14
planned_for: "[[ROADMAP#^REL-32]]"
delivered_by: ["dfd10f0", "c69d127"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# Feature F29: Sprint 14: Clean Architecture (ARCH-4, ARCH-7, ARCH-8)
**Approved**: not a gate (histórico anterior ao harness; reconstruída do de-para aprovado, `docs/specs/board-mapping.json`)

## Summary
**A feature:** o que a pasta SDD da Sprint 14: Home Refactor & V3 Architecture especificou e o trabalho implementou — a lista em `## Functionalities`. Os arquivos SDD originais estão em `legacy/`, sem reescrita.

**Por quê:** o objetivo que a spec original declara, em `legacy/`. É histórico anterior ao harness, reconstruído do de-para aprovado sem inventar o que a sprint não escreveu.

**Como saber que funcionou:** cada funcionalidade traz a evidência que o projeto deixou (a tarefa marcada, o commit, a linha do CHANGELOG); o que foi especificado e não foi feito ficou fora da lista.

**Versões do produto:** REL-32 (Versão do produto v3.2.0 (sem tag)).

## Functionalities
- (refactor) ARCH-4: serviço de busca de álbuns independente (AlbumSearchService) com o pipeline modularizado — *evidência:* roadmap Sprint 14 «ARCH-4»; AlbumSearchService.js no código; issues #92/#93 ligadas na spec
- (refactor) ARCH-8: InventoryView V3 em componentes (InventoryGrid e renderer) — *evidência:* commit c69d127 «Complete ARCH-8 Refactor»

## Sources
- `legacy/arch-4-album-search-modularization_plan.md` (plan) ← `docs/archive/2025-12/sprint14-clean-arch/arch-4-album-search-modularization_plan.md` em `dfd10f0`
- `legacy/arch-4-album-search-modularization_spec.md` (spec) ← `docs/archive/2025-12/sprint14-clean-arch/arch-4-album-search-modularization_spec.md` em `dfd10f0`
- `legacy/arch-7-security-hardening_plan.md` (plan) ← `docs/archive/2025-12/sprint14-clean-arch/arch-7-security-hardening_plan.md` em `dfd10f0`
- `legacy/arch-7-security-hardening_spec.md` (spec) ← `docs/archive/2025-12/sprint14-clean-arch/arch-7-security-hardening_spec.md` em `dfd10f0`
- `legacy/arch-8-inventory-refactor_plan.md` (plan) ← `docs/archive/2025-12/sprint14-clean-arch/arch-8-inventory-refactor_plan.md` em `dfd10f0`
- `legacy/arch-8-inventory-refactor_spec.md` (spec) ← `docs/archive/2025-12/sprint14-clean-arch/arch-8-inventory-refactor_spec.md` em `dfd10f0`
