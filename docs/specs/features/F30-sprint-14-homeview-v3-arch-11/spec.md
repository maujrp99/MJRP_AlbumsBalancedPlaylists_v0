---
status: Accepted
lane: standard
solution_type: feature
imports: []
epic: EP-09
sprint: SPR-14
planned_for: "[[ROADMAP#^REL-32]]"
delivered_by: ["dfd10f0", "cd4dc21"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# Feature F30: Sprint 14: HomeView V3 (ARCH-11)
**Approved**: not a gate (histórico anterior ao harness; reconstruída do de-para aprovado, `docs/specs/board-mapping.json`)

## Summary
**A feature:** o que a pasta SDD da Sprint 14: Home Refactor & V3 Architecture especificou e o trabalho implementou — a lista em `## Functionalities`. Os arquivos SDD originais estão em `legacy/`, sem reescrita.

**Por quê:** o objetivo que a spec original declara, em `legacy/`. É histórico anterior ao harness, reconstruído do de-para aprovado sem inventar o que a sprint não escreveu.

**Como saber que funcionou:** cada funcionalidade traz a evidência que o projeto deixou (a tarefa marcada, o commit, a linha do CHANGELOG); o que foi especificado e não foi feito ficou fora da lista.

**Versões do produto:** REL-32 (Versão do produto v3.2.0 (sem tag)).

**Épico:** EP-09.

## Functionalities
- (refactor) HomeView V3 modular (HomeController, SearchController, StagingAreaController e renderers) — *evidência:* spec ✅ IMPLEMENTED; tasks.md; arquivos no código
- Painel dividido: busca de artista com a grade da discografia e área de seleção dos álbuns (staging) — *evidência:* spec §1–3; tasks.md Fase 1; commit cd4dc21
- Clicar no cartão do álbum na grade o coloca ou tira da seleção — *evidência:* tasks.md Fase 1 «Fix Staging Interaction» [x]
- Filtros por tipo (álbuns, singles, ao vivo, compilações) em botões — *evidência:* tasks.md Fase 1 «Implement Filter Logic» [x]
- Indicador de carregamento da busca e botão Scan visível — *evidência:* tasks.md Fase 2 e Fase 4 [x]
- Remover da seleção por um X e reordenar a seleção arrastando — *evidência:* tasks.md Fase 2–3 [x]
- Selos de edição nos cartões (Deluxe, Remaster, Live, Single, Compilation) — *evidência:* tasks.md Fase 3 «Album Badges» [x]
- Modo de colar lista com validação visual (borda verde ou laranja) — *evidência:* tasks.md Fase 3 «Bulk Mode Validation» [x]
- Rótulos 01/02a/03 e layout responsivo no celular — *evidência:* tasks.md Fase 4 [x]

## Sources
- `legacy/arch-11-home-v3-spec.md` (spec) ← `docs/archive/2025-12/sprint14-home-refactor/arch-11-home-v3-spec.md` em `dfd10f0`
- `legacy/design_proposal_home_v3.md` (other) ← `docs/archive/2025-12/sprint14-home-refactor/design_proposal_home_v3.md` em `dfd10f0`
- `legacy/sprint14-home-refactor--plan.md` (plan) ← `docs/archive/2025-12/sprint14-home-refactor/plan.md` em `dfd10f0`
- `legacy/sprint14-home-refactor--tasks.md` (tasks) ← `docs/archive/2025-12/sprint14-home-refactor/tasks.md` em `dfd10f0`
