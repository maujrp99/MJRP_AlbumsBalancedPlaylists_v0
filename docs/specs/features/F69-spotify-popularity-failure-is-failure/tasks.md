<!-- docs/specs/features/Fxx-slug/tasks.md — WHEN. Every TASK implements at least one REQ of the spec beside
     it; every REQ is implemented by at least one TASK. -->
# Tasks — Feature F69: Popularidade do Spotify: falha é falha, e «não conectado» não é «sem dado» · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

> As tarefas como foram feitas em 2026-11-19, no ramo `fix/f69-spotify-popularity-failure`. A marca `model::` diz a classe do trabalho (opus: desenho de código; sonnet: mecânico).

## Pre-Implementation
- [x] ramo criado: `fix/f69-spotify-popularity-failure`, a partir da `main` em `b6a21de`; a `main` com a F58 (`2f9215b`) foi trazida para o ramo depois (`822a794`)
- [x] os dois caminhos de fora da fila, as três camadas que engoliam a falha e a rota que alcança o gêmeo do servidor conferidos no código, com arquivo, na seção «Diagnóstico» do plano; suíte verde antes de começar (1765 testes) e `vite build` compilando
- [x] conferência cruzada da spec e do plano: feita no fecho — REQs da spec cobertos pelas tasks e plano preenchido, conferido em 2026-11-19

## Implementation
<!-- Atomic (one focused session), verifiable (a clear "done"), ordered by dependency: data → logic →
     components → composition → polish. -->
<!-- Marks, after `implements::`, separated by ` · `:
     model:: sonnet|opus — MANDATORY on every task; the author of this file decides, the implementer never does.
                        sonnet = MECHANICAL: texts and registry keys, summaries, format samples and tests, derived
                        files, renames. opus = code design, architecture, critique, visual recheck. There is no
                        default: a task without the mark fails the cross-check.
     rounds:: N       — written when the task CLOSES ([x]): how many Execute ⇄ Verify rounds it took (ceiling 3).
                        `python3 mjrp-scripts/loop.py --check-tasks tasks.md` fails a closed task without it. -->
- [x] TASK-01 `public/js/services/SpotifyService.js` (`albumPopularity` no lugar de `enrichAlbumData`; `_searchByArtist` sem engolir a falha; faixas de 50 em 50) e `public/js/services/SpotifyAuthService.js` (`hasSession`), com `test/services/spotify/SpotifyAlbumPopularity.test.js` vermelho antes — commit `8e47f3e` · implements:: REQ-01 · model:: opus · rounds:: 1
- [x] TASK-02 `public/js/services/albums/adapters/spotifyPopularitySource.js` (a fonte: guardado, sessão, três respostas, 429 com espera curta ou falha) e `PopularityEnricher` em `public/js/services/albums/adapters/enrichers.js`, com `test/services/albums/spotifyPopularity.test.js` vermelho antes — commit `8e47f3e` · implements:: REQ-01, REQ-02, REQ-04 · model:: opus · rounds:: 1
- [x] TASK-03 `public/js/models/albumLoadState.js` (`EnrichmentStatus.NOT_CONNECTED`, `HoldReason.SPOTIFY_BUSY`, o texto de `holdNotice`) e `AlbumLoadService._publishSource` (nada guardado para «não conectado»; depois da F58, por `sourceOutcome` em `public/js/models/albumSourceAsk.js`) — commits `8e47f3e`, `822a794` · implements:: REQ-02, REQ-04 · model:: opus · rounds:: 2
- [x] TASK-04 `public/js/services/albums/adapters/AlbumCacheAdapter.js`: «o Spotify não tem» vale 24 h sob a regra que o decidiu; `empty` de popularidade sem motivo não vale — commit `8e47f3e` · implements:: REQ-05, REQ-06 · model:: opus · rounds:: 1
- [x] TASK-05 `public/js/models/albumFacts.js` (`FACTS_VERSION`, `knownSources`, uma resposta por fonte) e `public/js/models/seriesFilter.js` (`describeQuery`, `countUnchecked` por fonte), com `test/models/popularityOutcomes.test.js` vermelho antes e `test/services/series/SeriesFactsService.test.js` ajustado — commit `8e47f3e` · implements:: REQ-02, REQ-06 · model:: opus · rounds:: 1
- [x] TASK-06 `public/js/models/albumAsk.js`: `SourceGap.NOT_CONNECTED` e o texto «because Spotify is not connected» — commit `8e47f3e` · implements:: REQ-02 · model:: sonnet · rounds:: 1
- [x] TASK-07 `public/js/services/albums/popularityOnConnect.js`, ligado em `public/js/services/albums/albumLoading.js` com a fonte nova: ao conectar, as fontes «não conectado» da tela são pedidas por `refreshSource` — commit `8e47f3e` · implements:: REQ-03, REQ-07 · model:: opus · rounds:: 1
- [x] TASK-08 as duas rotas de fora da fila: `public/js/services/SpotifyEnrichmentService.js` apagado e o ouvinte de `spotify-auth-success` tirado de `public/js/app.js`; `public/js/components/ranking/TracksRankingComparison.js` sem chamada ao Spotify, com a linha do estado (`public/js/models/popularityState.js`) e o botão pedindo por `SeriesController.askPopularity`; `public/js/views/helpers/SeriesGridHelper.js` sem escrever dado do Spotify; `public/js/helpers/SpotifyEnrichmentHelper.js` só com `applySpotifyData` — commit `8e47f3e` · implements:: REQ-02, REQ-04, REQ-07 · model:: opus · rounds:: 1
- [x] TASK-09 `test/architecture/spotifyPopularityOnePath.test.js` (vermelho antes) e a lista de chamadas de `test/architecture/screensLoadThroughTheService.test.js` com os nomes de hoje; três funções saem de `test/architecture/complexityAllowlist.js` — commits `8e47f3e`, `822a794` · implements:: REQ-07 · model:: opus · rounds:: 1
- [x] TASK-10 `server/lib/services/spotifyPopularity.js`: desfechos `found` / `not_found` / `not_configured`, falha lançada como `UpstreamError`, com `test/server/spotifyPopularityOutcome.test.js` vermelho antes — commit `8e47f3e` · implements:: REQ-08 · model:: opus · rounds:: 1

## Verification
- [x] TASK-11 suíte (`npx vitest run`: 1933 passando; 1765 antes) e `npx vite build` compilando; nenhuma função nova ou editada acima de complexidade 10 (`test/architecture/complexityLimit.test.js`) · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07, REQ-08 · model:: sonnet · rounds:: 1
- [x] TASK-12 prova no navegador, pelo integrador (o implementador não tinha navegador), com a conta do MJRP em `http://127.0.0.1:5010`: desconectar o Spotify pelo «Connected ✕», recarregar a página e abrir uma série; conferir que a vista expandida mostra «Connect Spotify to see popularity.» nos álbuns sem popularidade guardada, que os fatos da série não ganham `popularity: false` (e que os antigos sem `v` perdem a chave) e que o registro do navegador não ganha `popularity` para esses álbuns; um blend com receita de popularidade diz «because Spotify is not connected». Reconectar pede o login do MJRP no Spotify: o que der para ver sem reconectar fica provado; o resto é dele — prova: `reports/evidence/F69/2026-11-19-spotify-popularity-outcomes-proof.md` · implements:: REQ-02, REQ-03, REQ-04, REQ-06 · model:: opus · rounds:: 1
- [ ] TASK-13 publicar o servidor e conferir nos registros que uma falha do Spotify em `POST /api/generate` aparece como «could not be asked» e não como «Album not found» (conserto em `server/` só se prova publicando) · implements:: REQ-08 · model:: sonnet · waiting:: human — o conserto do servidor só se vê quando o Spotify falhar de verdade em produção · action:: quando o Spotify falhar, ler no registro do servidor que `/api/generate` diz «could not be asked»

## Documentation
- [x] `docs/specs/arch.md` (a seção «A popularidade do Spotify tem três desfechos (F69)» e o item da F52 que ficou falso), `docs/specs/behavior.md` (cinco estados), `docs/manual/00`, `04`, `06`, `08`, `16`, `17`, `19`, `29` e `32` (as frases que ficaram falsas)
- [x] spec, plano e tarefas preenchidos no ramo
- [x] `docs/specs/uat.md`, `MEMORY.md` e `ROADMAP.md`: do agente integrador — conferido: as issues da feature em `fixed` no `uat.md`, `## Now` do `MEMORY.md` e a v5.0 do `ROADMAP.md` em dia
- [ ] fechar chamando a `mjrp-ensuring-sdd` (a forma e o cruzamento dos artefatos) antes do Done — o `sdd_shape_check.py` recusa o fecho fora do molde

## For the owner at UAT
- O MJRP julga as seis mudanças de comportamento e a questão da renovação que encerra a sessão, nas Open Questions do `spec.md`; a proposta da UAT-28 no `plan.md`
