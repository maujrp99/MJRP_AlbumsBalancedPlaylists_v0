<!-- docs/specs/features/Fxx-slug/tasks.md — WHEN. Every TASK implements at least one REQ of the spec beside
     it; every REQ is implemented by at least one TASK. -->
# Tasks — Feature F54: Fecho da v4.0: apagar do inventário e acabamento · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

> As tarefas como foram feitas em 2026-11-19, escritas depois (passo retroativo da via rápida). A marca `model::` diz a classe do trabalho (opus: desenho de código; sonnet: mecânico), como o molde pede.

## Pre-Implementation
- [x] causa de cada defeito lida no código antes de mexer; a unidade da duração conferida nos dados reais (2.109 faixas, de 15 a 4.767, em segundos)
- [x] ramo criado: `fix/f54-close-v4-inventory-delete-and-polish`
- [x] conferência cruzada da spec e do plano: feita no fecho — REQs da spec cobertos pelas tasks e plano preenchido, conferido em 2026-11-19

## Implementation
- [x] TASK-01 ícone da aba a partir do logo e título único — commit `791da82` · implements:: REQ-05 · model:: sonnet · rounds:: 1
- [x] TASK-02 `SafeDOM`: `textContent` como texto; `test/utils/SafeDOM.test.js` — commit `d49eb38` · implements:: REQ-04 · model:: opus · rounds:: 1
- [x] TASK-03 testes do apagar do inventário (falhavam) e o conserto no controlador e no repositório — commit `82336c2` · implements:: REQ-01, REQ-02 · model:: opus · rounds:: 1
- [x] TASK-04 `utils/duration.js` com teste (falhava) e o uso na janela de ranking e na tabela de faixas — commit `82336c2` · implements:: REQ-03 · model:: opus · rounds:: 1

## Verification
- [x] TASK-05 no navegador: remover «GNX» do inventário; durações nas duas janelas; botão «Close»; título e ícone; `reports/evidence/F54-close-v4-inventory-delete-and-polish/F54-browser-2026-11-19.json` · implements:: REQ-01, REQ-03, REQ-04, REQ-05 · model:: opus · rounds:: 1
- [x] TASK-06 reconferência visual independente, por quem não implementou, num navegador, em 2026-11-21 — relatório `reports/audits/2026-11-21-mjrpalbumblender-v0-inventory-visual-parity-recheck.md` e `reports/audits/2026-11-21-mjrpalbumblender-v0-shell-start-visual-parity-recheck.md`. Veredito dos lotes `fail`, sem P0; achado desta feature: o «X» do topo da janela do álbum sem nome (UAT-251, P2); apagar, durações em m:ss e «Close» conferem · implements:: REQ-01 · model:: opus · rounds:: 1

## Documentation
- [x] `docs/manual/` (14, 21, 99, 07b) e `docs/specs/behavior.md` dizem que o apagar funciona e onde a duração é formatada
- [x] spec, plano e tarefas escritos do registro (passo retroativo, 2026-11-19)

## For the owner at UAT
- O MJRP confere em produção e dá o OK na UAT-01, na UAT-188 e na UAT-195.
- Falta o que a tarefa aberta acima descreve (trabalho de agente); o aceite é dele no UAT, depois do `Done`.
