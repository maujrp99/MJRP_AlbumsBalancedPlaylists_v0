<!-- docs/specs/features/Fxx-slug/tasks.md — WHEN. Every TASK implements at least one REQ of the spec beside
     it; every REQ is implemented by at least one TASK. -->
# Tasks — Feature F72: A tela de séries diz quantos álbuns e quantas séries ela mostra · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

## Pre-Implementation
- [x] requisito S-55 e feature registrados na `main` antes do ramo (`66f469c`)
- [x] ramo `feat/f72-albums-screen-says-how-many`

## Implementation
- [x] TASK-01 a conta e a frase num modelo puro (`models/seriesCounts.js`), o número no `getPageView`, a linha no cabeçalho · implements:: REQ-01 · model:: opus · rounds:: 1
- [x] TASK-04 a caixa da paginação também no topo (`components/ui/Pager.js`, `place: 'top'`; `views/SeriesView.js`), pedida pelo MJRP em 2026-11-20 («trazer a caixa da paginacao para aparecer no topo tb»); teste antes; visto no navegador: as duas caixas mostram «Showing 1–40 of 48 series», a página 2 pela de cima muda as duas, e no modo «Scroll» só a de baixo tem «Load more» · implements:: REQ-02 · model:: opus · rounds:: 1
- [x] TASK-05 a contagem de álbuns vai para a linha da paginação e conta o que está na tela; a linha do cabeçalho sai (julgamento do MJRP de 2026-11-20: «o # de albuns deveria ser o contador do que temos na pagina ou no scroll antes de carregar mais … onde vc colocou creio que fica redundante, eu removeria»); teste antes; visto no navegador: 167 álbuns na página 1, 63 na página 2, 230 com o scroll todo carregado · implements:: REQ-03 · model:: opus · rounds:: 1

## Verification
- [x] TASK-02 suíte, lint e build verdes; prova no navegador com a conta do MJRP (`reports/evidence/F72/2026-11-20-albums-count-proof.md`) · implements:: REQ-01 · model:: opus · rounds:: 1

## Documentation
- [x] `docs/specs/behavior.md` (`^library-counts`), spec, plano e tarefas
- [x] TASK-03 o MJRP julgou a linha de contagem em 2026-11-20 00:55: a contagem é a do que está na tela e fica na paginação; a linha do cabeçalho sai (feito na TASK-05) · implements:: REQ-01 · model:: opus · rounds:: 1
- [ ] TASK-06 o passo retroativo da via rápida: a reconferência visual por quem não implementou, e o `verified_by` de cada REQ · implements:: REQ-01, REQ-02, REQ-03 · model:: sonnet · waiting:: human — o fecho depende do relatório de reconferência visual · action:: o integrador manda fazer a reconferência e junta o relatório
