# Tasks — Feature F47: A lista de séries mostra todas as séries, sem o corte em 20 · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

> As tarefas como foram feitas em 2026-11-19, escritas depois (passo retroativo da via rápida). A marca `model::` diz a classe do trabalho (opus: desenho de código; sonnet: mecânico), como o molde pede.

## Pre-Implementation
- [x] conferido no banco, pelo próprio app, antes de mexer: 45 séries na conta, 20 na tela, 25 escondidas, quatro delas com Robert Plant; nada perdido
- [x] ramo criado: `fix/f47-series-list-without-cut`, empilhado sobre o da F45
- [x] conferência cruzada da spec e do plano: feita no fecho — REQs da spec cobertos pelas tasks e plano preenchido, conferido em 2026-11-19

## Implementation
- [x] TASK-01 `test/services/SeriesService.test.js`: três testes da lista inteira, da série sem data e da ordem — dois falhavam antes do conserto · implements:: REQ-01, REQ-02, REQ-03 · model:: opus · rounds:: 1
- [x] TASK-02 `public/js/services/SeriesService.js`, `loadFromFirestore`: `findAll` sem `limit` e sem `orderBy`; a ordem por data de atualização aplicada no cliente, com a série sem data por último — os três testes passam · implements:: REQ-01, REQ-02, REQ-03 · model:: opus · rounds:: 1

## Verification
- [x] TASK-03 medição no navegador, conta do MJRP, guardado apagado: 45 séries na tela; 217 álbuns pedidos, tudo resolvido aos 31 s, 213 achados e 4 com aviso; as quatro séries de Robert Plant aparecem; `reports/evidence/F47-series-list-without-cut/F47-probe-2026-11-19.json` · implements:: REQ-01 · model:: opus · rounds:: 1
- [x] TASK-04 conferir no navegador que o seletor de séries também mostra as 45 — prova: `reports/evidence/F47-series-list-without-cut/F47-desktop-after-2026-11-19.jpg`, `reports/evidence/F47-series-list-without-cut/F47-probe-2026-11-19.json` · implements:: REQ-01 · model:: sonnet · rounds:: 1
- [x] TASK-05 reconferência visual independente, por quem não implementou, num navegador, em 2026-11-21 — relatório `reports/audits/2026-11-21-mjrpalbumblender-v0-albums-series-visual-parity-recheck.md`. Veredito do lote `fail`, sem P0 e sem achado desta feature: a tela aceita mais de 20 séries (50 na captura). A leitura sem corte do serviço não se vê na tela; ela é provada pelos testes e pela medição da TASK-03 · implements:: REQ-01 · model:: opus · rounds:: 1

## Documentation
- [x] `docs/specs/data-model.md` e `docs/manual/` (07) dizem que a lista de séries vem inteira — commit `12713e2`, 2026-11-19 12:34
- [x] spec, plano e tarefas escritos do registro (passo retroativo, 2026-11-19)
- [x] levar o ramo à `main` — feito: ramo mergeado na `main` local (`d893d75`)

## For the owner at UAT
- O MJRP confere no navegador e dá o OK na UAT-24.
- Falta o que a tarefa aberta acima descreve (trabalho de agente); o aceite é dele no UAT, depois do `Done`.
- Push da `main` ao remoto (e, com ele, a primeira rodada da automação do GitHub): é do MJRP.
