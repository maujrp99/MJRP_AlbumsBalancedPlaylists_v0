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
- [ ] TASK-06 o que a trava do passo retroativo ainda cobra antes do `Done` (`python3 mjrp-scripts/retro_step_check.py . --staged` com a feature em `Done`, conferido em 2026-11-21): Reconferência visual: a feature mexeu na tela e não há relatório `visual-parity-recheck` nem nota de Touch ID (`mjrp-visual-ok`) que a cubra. É trabalho de agente; nenhum item é do MJRP. O que falta de verdade é a reconferência visual independente (relatório `reports/audits/<data>-F54-visual-parity-recheck.md`, por quem não implementou, num navegador): nenhum merge traz nota de Touch ID. «Prototype: none» já está gravada na spec (MJRP, 2026-11-20 00:10). · implements:: REQ-01 · model:: opus

## Documentation
- [x] `docs/manual/` (14, 21, 99, 07b) e `docs/specs/behavior.md` dizem que o apagar funciona e onde a duração é formatada
- [x] spec, plano e tarefas escritos do registro (passo retroativo, 2026-11-19)

## For the owner at UAT
- O MJRP confere em produção e dá o OK na UAT-01, na UAT-188 e na UAT-195.
- Falta o que a tarefa aberta acima descreve (trabalho de agente); o aceite é dele no UAT, depois do `Done`.
