<!-- docs/specs/features/Fxx-slug/tasks.md — WHEN. Every TASK implements at least one REQ of the spec beside
     it; every REQ is implemented by at least one TASK. -->
# Tasks — Feature F55: Os álbuns pedidos, ou um aviso: uma regra só para dizer que é o mesmo álbum · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

## Pre-Implementation
- [x] create the branch `fix/f55-one-album-identity-rule` (da ponta da `main` local, `680e726`)
- [x] create the branch `fix/f55-identity-slice-2` para a fatia 2 (da ponta da `main` local, `4e4cc1b`)
- [x] verify the spec and the plan of F55 passed their cross-checks (and were approved, where gated): via rápida, sem portão; o `spec.md` e o `plan.md` da fatia 1 foram escritos depois do código, e o MJRP julga

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
### Fatia 1 — uma regra, usada em todos os lugares, e a contagem (feita)
- [x] TASK-01 `shared/albumIdentity.js`: a regra pura (`compareAlbumIdentity`, `pickAlbum`, `sameArtist`, `albumFromLabel`), com o teste de «Core» contra «Shangri-La Dee Da» e «Core Memories» escrito primeiro — `test/shared/albumIdentity.test.js` passa · implements:: REQ-01 · model:: opus · rounds:: 1
- [x] TASK-02 `server/lib/albumIdentity.js` e `server/lib/scrapers/besteveralbums.js`: o servidor carrega a regra e o raspador pergunta a ela em todos os pontos de aceite — `test/server/scraperIdentity.test.js` e `test/server/ratings.test.js` passam · implements:: REQ-05 · model:: opus · rounds:: 2
- [x] TASK-03 `server/lib/services/spotifyPopularity.js`: `findSpotifyAlbum` aceita pela regra, nunca o primeiro resultado — `test/server/spotifyAlbumIdentity.test.js` passa · implements:: REQ-04 · model:: opus · rounds:: 1
- [x] TASK-04 `public/js/models/askedAlbum.js`: o pedido e os candidatos de cada fonte lidos nos mesmos três campos · implements:: REQ-01 · model:: opus · rounds:: 1
- [x] TASK-05 `public/js/services/albums/adapters/CatalogAdapter.js`: a busca por nome escolhe pela regra; o álbum do identificador guardado é conferido; `metadata.replacedSourceId` — `test/services/albums/catalogIdentity.test.js` passa · implements:: REQ-02, REQ-03 · model:: opus · rounds:: 1
- [x] TASK-06 `public/js/api/client.js`: o caminho antigo da Apple escolhe pela regra e a resposta da IA é conferida — `test/api/clientIdentity.test.js` passa · implements:: REQ-02, REQ-07 · model:: opus · rounds:: 1
- [x] TASK-07 `public/js/services/SpotifyService.js` e `public/js/components/ranking/TracksRankingComparison.js`: `searchAlbum` aceita pela regra; saem a nota de semelhança e a conferência só de artista — `test/services/spotify/SpotifyAlbumMatch.test.js` passa · implements:: REQ-04 · model:: opus · rounds:: 1
- [x] TASK-08 `public/js/services/OptimizedAlbumLoader.js`: `findAlbum` devolve a linha do álbum pedido ou nada — `test/services/OptimizedAlbumLoader.identity.test.js` passa · implements:: REQ-06 · model:: opus · rounds:: 1
- [x] TASK-09 `public/js/services/albums/albumIdentityAudit.js`, `albumLoading.js`, `app.js` e `peek` nos guardados (`CacheManager`, `MemoryCache`, `IndexedDBCache`, `AlbumCacheAdapter`): a contagem só-leitura, rodável pelo console — `test/services/albums/albumIdentityAudit.test.js` passa · implements:: REQ-08 · model:: opus · rounds:: 1
- [x] TASK-10 tirar o que a regra substituiu: `public/js/models/AlbumIdentity.js`, `test/repro_identity.js`, e as funções de semelhança e de normalização de álbum e artista de `utils/stringUtils.js` e `utils/NormalizationUtils.js` · implements:: REQ-01 · model:: sonnet · rounds:: 1
- [x] TASK-11 `test/architecture/albumIdentityRule.test.js`: a função de aptidão · implements:: REQ-09 · model:: opus · rounds:: 1

### Fatia 2 — o segundo degrau, o identificador corrigido gravado, e o guardado antigo descartado (construída; falta a prova no navegador)
- [x] TASK-18 `shared/albumIdentity.js`: o segundo degrau da regra (`same-if-alone`, `title-before-subtitle`), aceito só pelo `pickAlbum` e só quando é o único álbum; `compareKeptAlbum` para o álbum guardado; o cabeçalho do arquivo reescrito em dois degraus, com exemplos — os testes de «No Quarter», «The Wall» e «Greatest Hits» escritos primeiro, `test/shared/albumIdentity.test.js` passa · implements:: REQ-13 · model:: opus · rounds:: 1
- [x] TASK-19 os lugares: `CatalogAdapter` e `api/client.js` guardam `metadata.identityReason`; o identificador guardado, a resposta da IA e a página conferida sozinha no raspador (`pageIsTheAlbum`) aceitam só o primeiro degrau; Spotify (app e servidor), sugestões e página do artista ganham o degrau pela escolha — `test/services/albums/catalogIdentity.test.js`, `test/api/clientIdentity.test.js`, `test/services/spotify/SpotifyAlbumMatch.test.js`, `test/server/spotifyAlbumIdentity.test.js` e `test/server/scraperIdentity.test.js` passam · implements:: REQ-14, REQ-15 · model:: opus · rounds:: 2
- [x] TASK-20 `models/askedAlbum.js` (`keptAlbum`, `identityNotice`), `components/ui/AlbumCardRenderer.js` (a linha no cartão), `albumIdentityAudit.js` e `albumLoading.js` (a contagem conta o segundo degrau como igual, com o motivo) — `test/components/ui/AlbumCardIdentityNote.test.js` e `test/services/albums/albumIdentityAudit.test.js` passam · implements:: REQ-15 · model:: opus · rounds:: 1
- [x] TASK-12 gravar na série, por um único escritor (`SeriesFactsService`, na escrita dos fatos), o identificador novo quando o álbum carregado traz `metadata.replacedSourceId`: `withCorrectedSource` em `models/albumQuery.js`, `withCorrectedSources` em `models/albumFacts.js` — `test/services/series/SeriesFactsService.test.js` passa · implements:: REQ-10 · model:: opus · rounds:: 1
- [x] TASK-13 o álbum trocado já guardado no navegador é descartado quando é lido, pela regra, em vez de uma nova versão do registro: `AlbumCacheAdapter.get` e `APIClient._keptAlbumAskedFor` — `test/services/albums/adapters.test.js` e `test/api/clientIdentity.test.js` passam · implements:: REQ-11 · model:: opus · rounds:: 1
- [x] TASK-14 adicionar e remover álbum de uma série (`SeriesService`) pela regra: `indexOfQueryFor` e `alreadyAskedFor` em `models/askedAlbum.js` — `test/services/SeriesService.identity.test.js` passa · implements:: REQ-12 · model:: opus · rounds:: 1
- [x] TASK-21 `test/architecture/albumIdentityRule.test.js`: nenhum lugar nomeia ou concede o segundo degrau; os leitores do guardado e o `SeriesService` entram na lista de lugares; um escritor só para o identificador corrigido · implements:: REQ-16 · model:: opus · rounds:: 1
- [x] TASK-15 provar a fatia 2 num navegador com a conta do MJRP, antes de publicar: a contagem antes; as séries «Robert Plant 00-10s» («No Quarter» carrega, com a linha no cartão) e «Grunge Rock - Classics» («Core» no lugar de «Shangri-La Dee Da», sem «Clear Cache»); o identificador novo gravado na série; a contagem depois, em zero ou com cada linha virando aviso — prova: `reports/evidence/F55/2026-11-19-slice-2-browser-proof.md` · implements:: REQ-10, REQ-11, REQ-13, REQ-15 · model:: opus · rounds:: 1

## Verification
- [x] TASK-16 suíte (`npx vitest run`: 919 testes, 86 arquivos; eram 789) e `npx vite build` · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07, REQ-08, REQ-09 · model:: sonnet · rounds:: 1
- [x] TASK-22 suíte da fatia 2 (`npx vitest run`: 1053 testes, 94 arquivos; eram 982) e `npx vite build` · implements:: REQ-10, REQ-11, REQ-12, REQ-13, REQ-14, REQ-15, REQ-16 · model:: sonnet · rounds:: 1
- [x] TASK-17 conferir a fatia 1 num navegador (a série «Grunge Rock - Classics» mostra «Core» ou o aviso; a contagem roda e não grava) e o raspador publicado — prova: `reports/evidence/F55/2026-11-19-slice-1-browser-proof.md` · implements:: REQ-02, REQ-03, REQ-05, REQ-08 · model:: opus · rounds:: 1
- [ ] TASK-23 o que a trava do passo retroativo ainda cobra antes do `Done` (`python3 mjrp-scripts/retro_step_check.py . --staged` com a feature em `Done`, conferido em 2026-11-21): Reconferência visual: a feature mexeu na tela e não há relatório `visual-parity-recheck` nem nota de Touch ID (`mjrp-visual-ok`) que a cubra. É trabalho de agente; nenhum item é do MJRP. O que falta de verdade é a reconferência visual independente (relatório `reports/audits/<data>-F55-visual-parity-recheck.md`, por quem não implementou, num navegador): nenhum merge traz nota de Touch ID. «Prototype: none» já está gravada na spec (MJRP, 2026-11-20 00:10). · implements:: REQ-01 · model:: opus

## Documentation
- [x] update the specs affected (`docs/specs/arch.md`, e no manual: `23_Shared_Code.md`, `08_Frontend_Models.md`, `06_Frontend_Data_Store.md`, `17_Frontend_Services.md`, `02_Server_Structure.md`, `04_Backend_Logic_Services.md`, `24_Test_Suite.md`, e as frases que ficaram falsas em `00_Dir_File_Structure_Map.md`, `01`, `07b` e `99`)
- [x] fatia 2: update the specs affected (`docs/specs/arch.md`, `docs/specs/behavior.md`, `docs/specs/data-model.md`, e no manual: `23_Shared_Code.md`, `08_Frontend_Models.md`, `06_Frontend_Data_Store.md`, `07_Frontend_Data_Infra.md`, `10_Frontend_Renderers.md`, `17_Frontend_Services.md`, `02_Server_Structure.md`, `04_Backend_Logic_Services.md`, `24_Test_Suite.md`, `01_System_Architecture.md`, `32_Data_Schema_Reference.md`)
- [x] mark F55 Done in spec.md · commit: feat: implement the-album-asked-for-or-a-notice (só depois da prova da fatia 2 no navegador, TASK-15) — a prova da fatia 2 existe; `status: Done` posto

## For the owner at UAT
- Falta o que a tarefa aberta acima descreve (trabalho de agente); o aceite é dele no UAT, depois do `Done`.
