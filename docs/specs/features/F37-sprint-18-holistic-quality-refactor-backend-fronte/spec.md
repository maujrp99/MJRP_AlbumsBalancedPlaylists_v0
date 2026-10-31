---
status: Accepted
lane: standard
solution_type: feature
imports: []
sprint: SPR-18
delivered_by: ["398025d"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# Feature F37: Sprint 18: Holistic Quality & Refactor (Backend + Frontend)
**Approved**: not a gate (histórico anterior ao harness; reconstruída do de-para aprovado, `docs/specs/board-mapping.json`)

## Summary
**A feature:** o que a pasta SDD da Sprint 18: Holistic Quality & Refactor especificou e o trabalho implementou — a lista em `## Functionalities`. Os arquivos SDD originais estão em `legacy/`, sem reescrita.

**Por quê:** o objetivo que a spec original declara, em `legacy/`. É histórico anterior ao harness, reconstruído do de-para aprovado sem inventar o que a sprint não escreveu.

**Como saber que funcionou:** cada funcionalidade traz a evidência que o projeto deixou (a tarefa marcada, o commit, a linha do CHANGELOG); o que foi especificado e não foi feito ficou fora da lista.

**Versões do produto:** nenhuma versão declarada no roadmap ou no CHANGELOG.

## Functionalities
- (refactor) EnrichmentService no servidor (ranking do BestEver, consolidação, mapeamento das faixas) — *evidência:* tasks.md §1 [x]; EnrichmentService.js
- (refactor) GenerationService no servidor (validação ajv; chamada ao provedor em parte) — *evidência:* tasks.md §2; GenerationService.js
- (refactor) Rota albums.js fina, abaixo de 60 linhas — *evidência:* tasks.md §3, §6 [x]
- (refactor) SpotifyExportService extraído da SpotifyExportModal (511 para 405 linhas) — *evidência:* tasks.md §4 [x]; SpotifyExportService.js
- (refactor) SeriesGridRenderer e TopNav sem a lógica de cartão e de login — *evidência:* tasks.md §5 [x]

## Sources
- `legacy/sprint18-backend-refactor--plan.md` (plan) ← `docs/technical/specs/archive/sprint18-backend-refactor/plan.md`
- `legacy/sprint18-backend-refactor--tasks.md` (tasks) ← `docs/technical/specs/archive/sprint18-backend-refactor/tasks.md`
