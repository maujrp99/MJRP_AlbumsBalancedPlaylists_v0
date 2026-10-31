---
status: Accepted
lane: standard
solution_type: feature
imports: []
epic: EP-01
sprint: SPR-21.5
delivered_by: ["66ddca2", "6dc78cc"]
accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"
---
# Feature F41: Sprint 21.5: Stability & Bug Fixing
**Approved**: not a gate (histórico anterior ao harness; reconstruída do de-para aprovado, `docs/specs/board-mapping.json`)

## Summary
**A feature:** o que a pasta SDD da Sprint 21.5: Stability & Bug Fixing especificou e o trabalho implementou — a lista em `## Functionalities`. Os arquivos SDD originais estão em `legacy/`, sem reescrita.

**Por quê:** o objetivo que a spec original declara, em `legacy/`. É histórico anterior ao harness, reconstruído do de-para aprovado sem inventar o que a sprint não escreveu.

**Como saber que funcionou:** cada funcionalidade traz a evidência que o projeto deixou (a tarefa marcada, o commit, a linha do CHANGELOG); o que foi especificado e não foi feito ficou fora da lista.

**Versões do produto:** nenhuma versão declarada no roadmap ou no CHANGELOG.

**Épico:** EP-01.

## Functionalities
- Excluir um álbum de uma série sem erro (#154) — *evidência:* tasks.md 154.1–154.3 [x]
- Série ou álbum novo aparece sem recarregar a página; excluir uma série não mostra «No albums» (#156, #158) — *evidência:* tasks.md 156.x, 158.x [x]
- Excluir uma série não congela o app (#155) — *evidência:* tasks.md 155.1–155.2 [x]
- Editar uma série mostra uma única mensagem de sucesso (#153) — *evidência:* tasks.md 153.1–153.3 [x]
- Esqueletos fantasma enquanto carrega; séries vazias somem ao filtrar (#152) — *evidência:* tasks.md 152.1–152.6 [x]; commit 6dc78cc
- (refactor) Remover o código da barra de progresso (#152B) — *evidência:* tasks.md 152B.1–152B.8 [x]

## Sources
- `legacy/sprint21.5-bug-fixing--plan.md` (plan) ← `docs/technical/specs/archive/sprint21.5-bug-fixing/plan.md`
- `legacy/sprint21.5-bug-fixing--spec.md` (spec) ← `docs/technical/specs/archive/sprint21.5-bug-fixing/spec.md`
- `legacy/sprint21.5-bug-fixing--tasks.md` (tasks) ← `docs/technical/specs/archive/sprint21.5-bug-fixing/tasks.md`
