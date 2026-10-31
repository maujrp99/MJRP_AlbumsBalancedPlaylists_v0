---
status: Accepted
lane: standard
solution_type: feature
imports: []
epic: EP-05
sprint: SPR-20
planned_for: "[[ROADMAP#^REL-38]]"
delivered_by: ["13a8416", "7aa9704", "685780a", "a6ad3d7"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# Feature F39: Sprint 20: User-Generated Track Ranking and Recipe Parity
**Approved**: not a gate (histórico anterior ao harness; reconstruída do de-para aprovado, `docs/specs/board-mapping.json`)

## Summary
**A feature:** o que a pasta SDD da Sprint 20: User-Ranking & Recipe Parity especificou e o trabalho implementou — a lista em `## Functionalities`. Os arquivos SDD originais estão em `legacy/`, sem reescrita.

**Por quê:** o objetivo que a spec original declara, em `legacy/`. É histórico anterior ao harness, reconstruído do de-para aprovado sem inventar o que a sprint não escreveu.

**Como saber que funcionou:** cada funcionalidade traz a evidência que o projeto deixou (a tarefa marcada, o commit, a linha do CHANGELOG); o que foi especificado e não foi feito ficou fora da lista.

**Versões do produto:** REL-38 (Versão do produto v3.20.0 (sem tag)).

**Épico:** EP-05.

## Functionalities
- Guardar a ordem pessoal das faixas de cada álbum (UserRankingRepository, cache e hidratação) — *evidência:* tasks.md Fase 1 [x]; UserRankingRepository.js
- Modal de ranking pessoal com arrastar e soltar, salvar e redefinir (UserRankModal) — *evidência:* tasks.md Fase 5 [x]; UserRankModal.js
- Coluna «MY RANK» com selo azul na tabela de faixas; ordenação por posição como padrão — *evidência:* tasks.md Fase 4 [x]
- Ordenação das faixas funciona nos modos grade e lista — *evidência:* tasks.md Fase 4.4 [x]; commit 7aa9704
- Médias (Avg Rank, Avg Pop, My Avg) no cabeçalho da tabela — *evidência:* tasks.md Fase 4.5 [x]
- Receita «My Own Ranking» (Top N pela ordem pessoal) com selo USER e todas as opções do Top N — *evidência:* tasks.md Fase 3, 8.1 [x]; TopNUserAlgorithm.js; commit 685780a
- A estratégia pessoal fica travada na execução e o título leva o prefixo «UGR» — *evidência:* tasks.md Fase 8.2 [x]; CHANGELOG v3.20.0
- A ordem pessoal persiste ao recarregar a página (#148) — *evidência:* tasks.md 8.3 [x]; CHANGELOG v3.20.0 «Fixed»; commit a6ad3d7

## Sources
- `legacy/sprint20-user-ranking-ext--plan.md` (plan) ← `docs/technical/specs/archive/sprint20-user-ranking-ext/plan.md`
- `legacy/sprint20-user-ranking-ext--spec.md` (spec) ← `docs/technical/specs/archive/sprint20-user-ranking-ext/spec.md`
- `legacy/sprint20-user-ranking-ext--tasks.md` (tasks) ← `docs/technical/specs/archive/sprint20-user-ranking-ext/tasks.md`
