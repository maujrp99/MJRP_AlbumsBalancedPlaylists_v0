---
status: Accepted
lane: standard
solution_type: feature
imports: []
epic: EP-09
sprint: SPR-15
planned_for: "[[ROADMAP#^REL-33]]"
delivered_by: ["dfd10f0", "93c2f5c", "ebabd9d", "550030f", "b3b9f32"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# Feature F31: Sprint 15: Structural Integrity (ARCH-12)
**Approved**: not a gate (histórico anterior ao harness; reconstruída do de-para aprovado, `docs/specs/board-mapping.json`)

## Summary
**A feature:** o que a pasta SDD da Sprint 15: Structural Integrity especificou e o trabalho implementou — a lista em `## Functionalities`. Os arquivos SDD originais estão em `legacy/`, sem reescrita.

**Por quê:** o objetivo que a spec original declara, em `legacy/`. É histórico anterior ao harness, reconstruído do de-para aprovado sem inventar o que a sprint não escreveu.

**Como saber que funcionou:** cada funcionalidade traz a evidência que o projeto deixou (a tarefa marcada, o commit, a linha do CHANGELOG); o que foi especificado e não foi feito ficou fora da lista.

**Versões do produto:** REL-33 (Versão do produto v3.15).

**Épico:** EP-09 (também EP-04).

## Functionalities
- (refactor) Componentes de UI únicos: Card, TrackRow e BaseModal — *evidência:* tasks.md Fase 1 [x]
- (refactor) SavedPlaylistsView como piloto com SavedPlaylistsController, mantendo a paridade (ordenar, miniaturas de 4 álbuns, excluir e editar lote, estado «lote não encontrado») — *evidência:* tasks.md Fase 2 [x]
- (refactor) SafeDOM: utilitário e zero innerHTML nos componentes e views — *evidência:* tasks.md Fases 3 e 5 [x]; commits ebabd9d, 550030f
- (refactor) Migrar rankings, inventário e grade de álbuns para Card e TrackRow — *evidência:* tasks.md Fase 4 [x]
- (refactor) Apagar as pastas de componentes legados (base, shared, common) — *evidência:* tasks.md Fase 5 [x]
- Autorização preguiçosa do Apple Music: sem popup ao abrir o app, validação só ao salvar — *evidência:* tasks.md Fase 6 [x]; commit b3b9f32
- Região (storefront) do Apple Music pelo idioma do navegador — *evidência:* tasks.md Fase 6 [x]; commit b3b9f32
- Modal de editar série: buscar por artista com filtros (Albums, Singles, Live, Compilations), igual à Home — *evidência:* tasks.md Fase 6 [x]; commit b3b9f32

## Sources
- `legacy/audit.md` (other) ← `docs/archive/2025-12/sprint15-arch12/audit.md` em `dfd10f0`
- `legacy/phase6-hotfix-plan.md` (plan) ← `docs/archive/2025-12/sprint15-arch12/phase6-hotfix-plan.md` em `dfd10f0`
- `legacy/sprint15-arch12--plan.md` (plan) ← `docs/archive/2025-12/sprint15-arch12/plan.md` em `dfd10f0`
- `legacy/sprint15-arch12--spec.md` (spec) ← `docs/archive/2025-12/sprint15-arch12/spec.md` em `dfd10f0`
- `legacy/sprint15-arch12--tasks.md` (tasks) ← `docs/archive/2025-12/sprint15-arch12/tasks.md` em `dfd10f0`
- `legacy/sprint15_proposal.md` (other) ← `docs/technical/specs/sprint15_proposal.md` em `93c2f5c`
