# Tasks — Feature F47: A lista de séries mostra todas as séries, sem o corte em 20 · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

> As tarefas como foram feitas em 2026-11-19, escritas depois (passo retroativo da via rápida). A marca `model::` diz a classe do trabalho (opus: desenho de código; sonnet: mecânico), como o molde pede.

## Pre-Implementation
- [x] conferido no banco, pelo próprio app, antes de mexer: 45 séries na conta, 20 na tela, 25 escondidas, quatro delas com Robert Plant; nada perdido
- [x] ramo criado: `fix/f47-series-list-without-cut`, empilhado sobre o da F45
- [ ] conferência cruzada da spec e do plano: fica para o fecho, porque os dois foram escritos depois do código

## Implementation
- [x] TASK-01 `test/services/SeriesService.test.js`: três testes da lista inteira, da série sem data e da ordem — dois falhavam antes do conserto · implements:: REQ-01, REQ-02, REQ-03 · model:: opus · rounds:: 1
- [x] TASK-02 `public/js/services/SeriesService.js`, `loadFromFirestore`: `findAll` sem `limit` e sem `orderBy`; a ordem por data de atualização aplicada no cliente, com a série sem data por último — os três testes passam · implements:: REQ-01, REQ-02, REQ-03 · model:: opus · rounds:: 1

## Verification
- [x] TASK-03 medição no navegador, conta do MJRP, guardado apagado: 45 séries na tela; 217 álbuns pedidos, tudo resolvido aos 31 s, 213 achados e 4 com aviso; as quatro séries de Robert Plant aparecem; `reports/evidence/F47-series-list-without-cut/F47-probe-2026-11-19.json` · implements:: REQ-01 · model:: opus · rounds:: 1
- [ ] TASK-04 conferir no navegador que o seletor de séries também mostra as 45 · implements:: REQ-01 · model:: sonnet
- [ ] TASK-05 julgamento do MJRP no navegador (tarefa do humano); a UAT-24 segue aberta até lá · implements:: REQ-01, REQ-02, REQ-03 · model:: opus

## Documentation
- [x] `docs/specs/data-model.md` e `docs/manual/` (07) dizem que a lista de séries vem inteira — commit `12713e2`, 2026-11-19 12:34
- [x] spec, plano e tarefas escritos do registro (passo retroativo, 2026-11-19)
- [ ] levar o ramo à `main` (o merge não foi feito; push e aceite são do MJRP)
- [ ] fechar chamando a `mjrp-ensuring-sdd` (a forma e o cruzamento dos artefatos) antes do Done — o `sdd_shape_check.py` recusa o fecho fora do molde; só então `status: Done`
