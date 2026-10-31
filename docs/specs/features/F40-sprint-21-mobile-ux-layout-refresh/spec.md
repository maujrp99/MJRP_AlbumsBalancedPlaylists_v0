---
status: Accepted
lane: standard
solution_type: feature
imports: []
epic: EP-06
sprint: SPR-21
delivered_by: ["6dc78cc", "94cc140", "6d79577"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# Feature F40: Sprint 21: Mobile UX & Layout Refresh
**Approved**: not a gate (histórico anterior ao harness; reconstruída do de-para aprovado, `docs/specs/board-mapping.json`)

## Summary
**A feature:** o que a pasta SDD da Sprint 21: Mobile UX & Layout Refresh especificou e o trabalho implementou — a lista em `## Functionalities`. Os arquivos SDD originais estão em `legacy/`, sem reescrita.

**Por quê:** o objetivo que a spec original declara, em `legacy/`. É histórico anterior ao harness, reconstruído do de-para aprovado sem inventar o que a sprint não escreveu.

**Como saber que funcionou:** cada funcionalidade traz a evidência que o projeto deixou (a tarefa marcada, o commit, a linha do CHANGELOG); o que foi especificado e não foi feito ficou fora da lista.

**Versões do produto:** nenhuma versão declarada no roadmap ou no CHANGELOG.

**Épico:** EP-06 (também EP-01).

## Functionalities
- Home no celular: o Discography Scan aparece logo abaixo do filtro de artista — *evidência:* spec §2.1; commit 6d79577; roadmap «Mobile Layout»
- Esqueletos de carregamento por série ao abrir todas as séries (SeriesSkeleton) — *evidência:* spec §2.2.1; SeriesSkeleton.js; roadmap «skeletons»
- Carregamento preguiçoso por série com rolagem virtual (VirtualScrollObserver) — *evidência:* spec §2.2.2; VirtualScrollObserver.js; roadmap «Virtual scrolling»
- No máximo 12 álbuns por série, com botão «Load more» (LoadMoreButton) — *evidência:* spec §2.2.2; LoadMoreButton.js; commit 94cc140
- Tabela de faixas como lista de cartões no celular — *evidência:* spec §2.3; roadmap «touch-friendly tables»; commit 6d79577
- Modal de ranking pessoal em tela cheia no celular e atraso de 200 ms no arrastar por toque — *evidência:* spec §2.4; roadmap «fullscreen modals»; commit 6d79577

## Sources
- `legacy/issue152_implementation.md` (other) ← `docs/technical/specs/archive/sprint21-mobile-ux/issue152_implementation.md`
- `legacy/open_issues_analysis.md` (other) ← `docs/technical/specs/archive/sprint21-mobile-ux/open_issues_analysis.md`
- `legacy/sprint21-mobile-ux--plan.md` (plan) ← `docs/technical/specs/archive/sprint21-mobile-ux/plan.md`
- `legacy/regression_audit.md` (other) ← `docs/technical/specs/archive/sprint21-mobile-ux/regression_audit.md`
- `legacy/sprint21-mobile-ux--spec.md` (spec) ← `docs/technical/specs/archive/sprint21-mobile-ux/spec.md`
- `legacy/sprint21-mobile-ux--tasks.md` (tasks) ← `docs/technical/specs/archive/sprint21-mobile-ux/tasks.md`
