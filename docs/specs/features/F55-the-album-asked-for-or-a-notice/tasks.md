<!-- docs/specs/features/Fxx-slug/tasks.md — WHEN. Every TASK implements at least one REQ of the spec beside
     it; every REQ is implemented by at least one TASK. -->
# Tasks — Feature F55: Os álbuns pedidos, ou um aviso: uma regra só para dizer que é o mesmo álbum · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

## Pre-Implementation
- [x] create the branch `fix/f55-one-album-identity-rule` (da ponta da `main` local, `680e726`)
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

### Fatia 2 — o identificador corrigido gravado, e o guardado antigo descartado (não feita)
- [ ] TASK-12 gravar na série, por um único escritor, o identificador novo quando o álbum carregado traz `metadata.replacedSourceId` · implements:: REQ-10 · model:: opus
- [ ] TASK-13 nova versão do registro guardado no navegador, para o álbum trocado já guardado ser refeito (junto com a fatia 2 da F52) · implements:: REQ-10 · model:: opus
- [ ] TASK-14 adicionar e remover álbum de uma série (`SeriesService`) pela regra · implements:: REQ-10 · model:: opus
- [ ] TASK-15 rodar a contagem na conta do MJRP depois de publicado, e levar o número a zero ou a aviso · implements:: REQ-10 · model:: opus · waiting:: human — a contagem roda com o login do MJRP · action:: o MJRP (ou o integrador, com o login dele) roda `await albumIdentityAudit()` no console e decide o que fazer com cada linha `different`

## Verification
- [x] TASK-16 suíte (`npx vitest run`: 919 testes, 86 arquivos; eram 789) e `npx vite build` · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07, REQ-08, REQ-09 · model:: sonnet · rounds:: 1
- [ ] TASK-17 conferir a fatia 1 num navegador (a série «Grunge Rock - Classics» mostra «Core» ou o aviso; a contagem roda e não grava) e o raspador publicado · implements:: REQ-02, REQ-03, REQ-05, REQ-08 · model:: opus · waiting:: human — o auxiliar que construiu não tem navegador; a prova roda no endereço local com o login do MJRP, e o conserto no servidor só se prova publicando · action:: o integrador roda a carga e a contagem (await albumIdentityAudit() no console) no navegador, e publica o servidor depois do ok do MJRP

## Documentation
- [x] update the specs affected (`docs/specs/arch.md`, e no manual: `23_Shared_Code.md`, `08_Frontend_Models.md`, `06_Frontend_Data_Store.md`, `17_Frontend_Services.md`, `02_Server_Structure.md`, `04_Backend_Logic_Services.md`, `24_Test_Suite.md`, e as frases que ficaram falsas em `00_Dir_File_Structure_Map.md`, `01`, `07b` e `99`)
- [ ] mark F55 Done in spec.md · commit: feat: implement the-album-asked-for-or-a-notice (só depois da fatia 2)
- [ ] fechar chamando a `mjrp-ensuring-sdd` (a forma e o cruzamento dos artefatos) antes do Done — o `sdd_shape_check.py` recusa o fecho fora do molde
