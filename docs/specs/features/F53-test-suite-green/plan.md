<!-- docs/specs/features/Fxx-slug/plan.md — HOW. No edge of its own in the graph: the trace to the REQs is the
     cross-check before approval. -->
# Plan — Feature F53: A suíte de testes volta a ficar verde · Spec: [[spec]]
**Approved**: not a gate (via rápida; o MJRP julga)

> Escrito depois do trabalho (passo retroativo da via rápida), a partir do `docs/log.md` de 2026-11-19 e do commit `0d402f9`.

## Architecture Approach
Nenhuma mudança de arquitetura e nenhum código do app tocado. O que muda é o ambiente de teste (um ponto só, `test/setup.js`) e os testes que tinham ficado para trás de três decisões já registradas: a loja de séries pura (ADR 0017), a extração da camada de serviço (ADR 0016) e a barra de filtros genérica (F51).

## Technical Design
- `test/setup.js`: entrega o `localStorage` e o `sessionStorage` do jsdom, ou um em memória quando o Node esconde o do jsdom, e os esvazia antes de cada teste (REQ-02).
- `vitest.config.js`: `test/e2e/` fora da suíte de unidade (REQ-04).
- `test/stores/series.test.js`: reescrito para a loja pura `AlbumSeriesStore` (REQ-03).
- `test/router.test.js`, `test/services/AuthService.test.js`, `test/components/blend/BlendIngredientsPanel.test.js`: esperam a tela assíncrona, o `auth` tardio e um contêiner limpo por teste (REQ-01).
- `test/views/helpers/SeriesComponentFactory.test.js`, `test/views/ConsolidatedRankingView.test.js`, `test/services/auth/UserSyncService.test.js`: dublês e importações do que existe hoje (REQ-03).
- `test/components/playlists/PlaylistGrid.duration.test.js`: o teste da duração foi para junto do componente que faz a conta (REQ-03).

## UI/UX Design (if the feature touches a screen)
Não toca tela.

## Dependencies
Nenhuma nova. Vitest e jsdom nas versões do projeto; Node 26 na máquina do MJRP.

## Documents Consulted
- `docs/decisions/0016-service-layer-extraction.md`, `docs/decisions/0017-pure-state-stores.md`
- `docs/specs/uat.md` (UAT-149, UAT-20, UAT-21)
- `docs/manual/24_Test_Suite.md`

## Risks & Considerations
- Consertar um teste mudando o que ele confere pode esconder um defeito real. Em cada caso o comportamento do código foi lido antes; onde o teste descrevia comportamento que não existe mais por decisão registrada, foi reescrito, não afrouxado.
- A suíte verde não bloqueia nada sozinha: commit e deploy seguem sem verificação automática (UAT-20).

## Test plan
`npx vitest run`, a suíte inteira, código de saída 0 (REQ-01 a REQ-04).
