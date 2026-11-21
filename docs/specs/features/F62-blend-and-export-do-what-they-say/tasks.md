<!-- docs/specs/features/Fxx-slug/tasks.md — WHEN. Every TASK implements at least one REQ of the spec beside
     it; every REQ is implemented by at least one TASK. -->
# Tasks — Feature F62: Blend e exportação fazem o que dizem · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

## Pre-Implementation
- [x] ramo criado: `fix/f62-blend-and-export-do-what-they-say`, a partir da `main` em `c9aaa7a` (contém `042da86`, o merge da F56)
- [x] cada issue conferida no código da `main` antes de mexer (a tabela «ainda existia?» no Problem Statement da spec, com arquivo e linha)
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
- [x] TASK-01 `test/algorithms/recipes.promise.test.js`: o que cada receita do menu promete, pelo `PlaylistGenerationService` (22 casos; 6 falhavam na `main`) — commit `eb1219a` · implements:: REQ-01 · model:: opus · rounds:: 1
- [x] TASK-02 `algorithms/TopNAlgorithm.js` (`_applyGrouping` em quatro funções; agrupar por artista; embaralhar sem viés), `ranking/UserRankingStrategy.js` (sem ranking, a ordem do álbum), `ranking/BalancedRankingStrategy.js` e `ranking/BEARankingStrategy.js` (faixa sem nota depois das com nota) — commit `eb1219a` · implements:: REQ-01 · model:: opus · rounds:: 1
- [x] TASK-03 `models/recipeSources.js` (`fallbacksForRecipe`), `models/albumAsk.js` (`askNotices(result, fallbacks)`), `controllers/BlendingController.js`: o aviso de fonte faltando diz a ordem usada; `test/controllers/BlendingController.load.test.js` — commit `eb1219a` · implements:: REQ-01 · model:: opus · rounds:: 1
- [x] TASK-04 `components/blend/BlendIngredientsPanel.js`: sai «Discovery Mode»; `showsDuration`; descrições verdadeiras; `services/PlaylistGenerationService.js`: `generationMeta`, sem `discoveryMode`; `views/BlendingMenuView.js`: sai `showResults` (com um `alert`) — commit `eb1219a` · implements:: REQ-08, REQ-04 · model:: opus · rounds:: 1
- [x] TASK-05 `services/PlaylistsService.js`: toda edição por `_applyEdit`; o histórico segue o conjunto da tela (`_followScreen`, `_startHistory`, `_travel`); `renamePlaylist`; `test/services/PlaylistsService.history.test.js` (12 casos) — commit `1c0b8db` · implements:: REQ-05, REQ-06, REQ-07 · model:: opus · rounds:: 2
- [x] TASK-06 `components/playlists/PlaylistGrid.js` (título num campo próprio, lixeira), `PlaylistsGridRenderer.js` (`renderHeader`, botões de desfazer e refazer, um rótulo, `generatedWith`), `RegeneratePanel.js` (a receita das playlists, `pending`, `reset`), `components/Breadcrumb.js`, `components/Icons.js`; `test/components/playlists/PlaylistsScreen.edit.test.js` (15 casos) — commit `1c0b8db` · implements:: REQ-04, REQ-05, REQ-06, REQ-07, REQ-10 · model:: opus · rounds:: 1
- [x] TASK-07 `views/playlists/playlistEditActions.js` (novo), `views/PlaylistsView.js`, `controllers/PlaylistsController.js` (`undo`, `redo`, `renamePlaylist`, `_service`); `test/views/playlistEditActions.test.js` (9 casos), `test/controllers/PlaylistsController.edit.test.js` (10 casos, pelo `fakeFirestore`) — commit `1c0b8db` · implements:: REQ-05, REQ-06, REQ-07 · model:: opus · rounds:: 1
- [x] TASK-08 `services/spotify/spotifyErrors.js` (novo), `services/SpotifyService.js` (`_fetch` renova uma vez no 401 e espera o 429 curto; `searchTrack` não engole a falha; `addTracksToPlaylist` conta o que foi), `services/SpotifyAuthService.js` (`renewAccess`, uma renovação por vez, sem `alert`) — commit `b459a0c` · implements:: REQ-02 · model:: opus · rounds:: 1
- [x] TASK-09 `services/export/exportLedger.js` (novo), `services/SpotifyExportService.js` (o relato; alvos por modo; não cria o que já criou), `components/SpotifyExportModal.js` (termina no relato; link por playlist; texto do modo; reconectar e tentar de novo); `test/services/spotify/SpotifyExport.test.js` (18 casos), `test/components/SpotifyExportModal.test.js` (9 casos) — commit `b459a0c` · implements:: REQ-02, REQ-09 · model:: opus · rounds:: 2
- [x] TASK-10 `services/AppleMusicExportService.js` (novo: o relato, o registro do que foi criado, `appleExportMessages`), `views/playlists/PlaylistsExport.js` (um envio por vez; sai `handleExportToSpotify`), `views/PlaylistsView.js` (passa o botão); `test/services/musickit/AppleMusicExport.test.js` (19 casos) — commit `956d314` · implements:: REQ-03 · model:: opus · rounds:: 1
- [x] TASK-11 funções tocadas dentro do limite de complexidade: `RegeneratePanel._recipeToShow`, a cadeia de comparadores do `BEARankingStrategy`, `PlaylistsService._draftFor` e `_showSaved`, `shownBatchNameOf` e `savedBatchNameOf` na `PlaylistsView` — commit `416cb4c` · implements:: REQ-04, REQ-05, REQ-10 · model:: opus · rounds:: 1

## Verification
- [x] TASK-12 suíte (`npx vitest run`: 1512 passando no ramo, 1394 antes; o número depois de juntar a `main` está no log), `npx vite build` e complexidade até 10 nas funções novas (`npx eslint --no-config-lookup --rule '{"complexity":["error",10]}'` nos 27 arquivos de `public/js` tocados); ficaram acima do limite, tocadas sem ramo novo, `TopNAlgorithm.generate` (22), o enriquecimento de faixa do `BalancedRankingStrategy` (30) e `PlaylistsService._writeCurrentBatch` (13) · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07, REQ-08, REQ-09, REQ-10 · model:: opus · rounds:: 1
- [x] TASK-13 prova no navegador pelo roteiro do relatório de entrega, do integrador (o implementador não tem navegador). **Sem exportar nada:** gerar com cada uma das quatro receitas e conferir a ordem; «By Artist then By Rank» numa série com dois artistas; o aviso com a ordem usada numa série com álbum sem ranking próprio; o menu sem «Discovery Mode» e a duração em «Auto»; tirar e mover faixa, excluir playlist, trocar título, «Undo» e «Redo», guardar, recarregar e abrir o lote para edição (o título e a receita do painel de reconfigurar voltam); o topo da tela ao criar e ao editar; a janela do Spotify parada na primeira tela, trocando o modo. **Com uma conta real do Spotify** (cria playlists na conta): exportar nos dois modos e abrir cada link; exportar de novo na mesma visita; exportar com o acesso vencido (esperar uma hora ou adiantar `spotify_expires_at` no `localStorage`); exportar depois de apagar `spotify_refresh_token` e adulterar `spotify_access_token` (deve pedir para conectar de novo). **Com uma conta real da Apple Music** (cria playlists na biblioteca): exportar, conferir a pasta e as playlists; clicar duas vezes seguidas; exportar de novo na mesma visita · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07, REQ-08, REQ-09, REQ-10 · model:: opus · rounds:: 1 · as exportações reais foram feitas pelo MJRP em produção em 2026-11-19 23:34 (Spotify 30/30; Apple Music na pasta da série): `reports/evidence/F62/2026-11-19-blend-and-export-proof.md`

## Documentation
- [x] `docs/specs/behavior.md` (14 estados reescritos e 8 novos) e `docs/manual/` (00 mapa de arquivos, 07, 10, 11 seção 4.2, 14, 15, 17, 18, 21 seções 3 e 4, 31, 99) dizem o que o código faz agora
- [x] spec, plano e tarefas preenchidos no ramo
- [x] `docs/specs/uat.md`, `MEMORY.md` e `ROADMAP.md`: do agente integrador — conferido: as issues da feature em `fixed` no `uat.md`, `## Now` do `MEMORY.md` e a v5.0 do `ROADMAP.md` em dia
- [x] fechar chamando a `mjrp-ensuring-sdd` (a forma e o cruzamento dos artefatos) antes do Done — o `sdd_shape_check.py` recusa o fecho fora do molde

## For the owner at UAT
- O MJRP julga as nove mudanças de comportamento e os textos novos listados nas Open Questions da spec
