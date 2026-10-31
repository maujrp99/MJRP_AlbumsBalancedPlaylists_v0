---
status: Accepted
lane: standard
solution_type: feature
imports: []
epic: EP-09
sprint: SPR-22.5
delivered_by: ["d868594"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# Feature F43: Sprint 22.5: Fuzzy Enrichment Matching
**Approved**: not a gate (histórico anterior ao harness; reconstruída do de-para aprovado, `docs/specs/board-mapping.json`)

## Summary
**A feature:** o que a pasta SDD da Sprint 22.5: Fuzzy Enrichment Matching especificou e o trabalho implementou — a lista em `## Functionalities`. Os arquivos SDD originais estão em `legacy/`, sem reescrita.

**Por quê:** o objetivo que a spec original declara, em `legacy/`. É histórico anterior ao harness, reconstruído do de-para aprovado sem inventar o que a sprint não escreveu.

**Como saber que funcionou:** cada funcionalidade traz a evidência que o projeto deixou (a tarefa marcada, o commit, a linha do CHANGELOG); o que foi especificado e não foi feito ficou fora da lista.

**Versões do produto:** nenhuma versão declarada no roadmap ou no CHANGELOG.

**Épico:** EP-09 (também EP-05).

## Functionalities
- Normalização de títulos (tira «Remastered», «Deluxe», «The» do artista) em NormalizationUtils — *evidência:* tasks.md Fase 1 [x]; NormalizationUtils.js
- Correspondência aproximada no BestEverAlbums quando o texto exato não acha — *evidência:* tasks.md Fase 2 [x]; commit d868594
- Busca no Spotify em etapas (exata, normalizada) com validação do candidato — *evidência:* tasks.md Fase 3 [x]

## Sources
- `legacy/sprint22.5-enrichment-fuzzy-matching--plan.md` (plan) ← `docs/technical/specs/sprint22.5-enrichment-fuzzy-matching/plan.md`
- `legacy/sprint22.5-enrichment-fuzzy-matching--spec.md` (spec) ← `docs/technical/specs/sprint22.5-enrichment-fuzzy-matching/spec.md`
- `legacy/sprint22.5-enrichment-fuzzy-matching--tasks.md` (tasks) ← `docs/technical/specs/sprint22.5-enrichment-fuzzy-matching/tasks.md`
