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

## Verification
- [x] TASK-02 suíte, lint e build verdes; prova no navegador com a conta do MJRP (`reports/evidence/F72/2026-11-20-albums-count-proof.md`) · implements:: REQ-01 · model:: opus · rounds:: 1

## Documentation
- [x] `docs/specs/behavior.md` (`^library-counts`), spec, plano e tarefas
- [ ] TASK-03 o MJRP julga a linha de contagem (texto, e se conta os álbuns pedidos ou os distintos) · implements:: REQ-01 · model:: opus · waiting:: human — o aceite é do MJRP · action:: o MJRP olha a tela de séries e diz se a contagem serve
