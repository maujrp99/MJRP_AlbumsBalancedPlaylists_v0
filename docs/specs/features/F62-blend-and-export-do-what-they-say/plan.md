<!-- docs/specs/features/Fxx-slug/plan.md — HOW. No edge of its own in the graph: the trace to the REQs is the
     cross-check before approval. -->
# Plan — Feature F62: Blend e exportação fazem o que dizem · Spec: [[spec]]
**Approved**: not a gate (via rápida; o MJRP julga)

> Escrito junto com o código (via rápida), no ramo `fix/f62-blend-and-export-do-what-they-say`, em 2026-11-19.

## Architecture Approach
Sem camada nova e sem dependência nova. Cada conserto foi feito no dono da coisa, não em quem a usa:

- **A ordem que uma receita usa sem a sua fonte tem um dono, ao lado das fontes.** `models/recipeSources.js` já dizia quais fontes cada receita lê (F56); ganhou `fallbacksForRecipe`, que diz a ordem usada quando uma delas falta. O aviso continua sendo o da F56 (`askNotices`), que agora recebe essas ordens e as põe na linha da fonte: uma frase só, nenhum aviso em dobro. Um teste segura cada frase contra o que a estratégia de ranking faz.
- **A receita das playlists mora nas playlists.** `PlaylistGenerationService` grava em `_meta` a receita inteira (`generationMeta`); ela é salva com o lote e lida de volta. O painel de reconfigurar deixa de ter uma memória própria do que foi gerado: lê `_meta` e guarda só o que a pessoa mexeu e ainda não gerou.
- **O histórico de desfazer é de um conjunto, e o serviço sabe de qual.** `PlaylistsService` guarda a referência do conjunto que mostrou por último (`_followed`). Se o que está na store não é esse conjunto, outro chegou (o blend escreve direto na store): o histórico recomeça dele. Assim o blend, o «gerar de novo», a abertura de um lote e o guardar não precisam avisar o serviço, e um passo de outro conjunto nunca volta. Toda edição passa por um ponto só (`_applyEdit`) e monta um conjunto novo em vez de mexer no que está na tela.
- **O título de uma playlist é dado da playlist** (`name` e `title`), trocado por `PlaylistsService.renamePlaylist` como qualquer outra edição. A tela mostra a posição e o nome do lote ao lado, fora do campo.
- **As ações de edição da tela são ouvidas num lugar só,** `views/playlists/playlistEditActions.js`, preso uma vez ao contêiner; a `PlaylistsView` só o liga ao controlador.
- **Uma exportação responde com um relato, nunca com silêncio.** `SpotifyExportService` e o novo `AppleMusicExportService` devolvem o que foi criado, o que não foi e por quê; a janela do Spotify e os avisos da Apple só desenham o relato.
- **Renovar o acesso é do cliente do Spotify, não da exportação.** `SpotifyService._fetch` renova uma vez num 401 e repete a chamada; `SpotifyAuthService` garante uma renovação por vez. Dois erros com nome (`SpotifyReconnectError`, `SpotifyRateLimitError`) deixam quem chama distinguir «conectar de novo» e «esperar» de qualquer outra falha.
- **O que já foi exportado tem um registro só, para os dois serviços:** `services/export/exportLedger.js`, em memória.

Refina no `docs/specs/arch.md`: nada (o blend, a tela de playlists e as exportações não estão descritos lá além da carga de álbuns). O `docs/specs/data-model.md` não muda de forma: o documento de playlist já aceitava `_meta`, que passa a trazer mais campos (`trackCount`, `outputMode`, `groupingStrategy`, `targetDuration`).

## Technical Design
Fluxo do blend: `BlendingMenuView` → `BlendingController.generateFromSeries` → `albumAsks.albumsOf` (F56) → `askNotices(result, fallbacksForRecipe(config))` → `PlaylistGenerationService.generate` → `playlistsStore`.

- `public/js/algorithms/TopNAlgorithm.js`: `_applyGrouping` vira uma tabela de quatro funções pequenas (`_byRank`, `_byArtistThenRank`, `_shuffled`, `_interleavedByRank` com `_roundRobinByArtist`); o artista vem de `_getArtistName` (REQ-01).
- `public/js/ranking/UserRankingStrategy.js`: `_fallbackToOriginalOrder` usa `tracksOriginalOrder` quando o álbum a tem. `ranking/BalancedRankingStrategy.js`: marca `ratingIsPopularity` quando a popularidade entra no lugar da nota. `ranking/BEARankingStrategy.js`: `acclaimRatingOf` ignora essa nota de empréstimo; a comparação é uma cadeia de comparadores (REQ-01).
- `public/js/models/recipeSources.js`: `fallbacksForRecipe(config)` → `{ fonte: ordem }`. `models/albumAsk.js`: `askNotices(result, fallbacks)`. `controllers/BlendingController.js`: passa as ordens da receita (REQ-01).
- `public/js/services/PlaylistGenerationService.js`: `generationMeta(config, rankingId)`; `discoveryMode` não é mais repassado; uma popularidade que fez as vezes de nota não sai como nota da faixa (REQ-01, REQ-04, REQ-08).
- `public/js/components/blend/BlendIngredientsPanel.js`: sem «Discovery Mode»; `showsDuration()`; descrições de «Combined», «By Ranking» e «Auto» (REQ-08).
- `public/js/services/PlaylistsService.js`: `moveTrack`, `reorderTrack`, `removeTrack`, `removePlaylist`, `renamePlaylist` → `_applyEdit(next, descrição)` → `_followScreen()` (recomeça o histórico se o conjunto da tela não é o seguido), `history.createSnapshot`, `_show` (store, `isDirty`, `canUndo`/`canRedo`, rascunho). `undo`/`redo` → `_travel`. `_startHistory` no rascunho restaurado e depois de guardar (`_showSaved`). `watchStore` também acerta os botões quando outro conjunto chega (REQ-05, REQ-06, REQ-07).
- `public/js/controllers/PlaylistsController.js`: `_service()`, `undo`, `redo`, `renamePlaylist`; `deletePlaylist` e `deleteTrack` por ele; `handleGenerate` devolve o que gerou (REQ-05, REQ-06, REQ-07).
- `public/js/views/playlists/playlistEditActions.js` (novo): `attachPlaylistEditActions(container, { controller, onEditEnd })` → `{ isEditingTitle, detach }`; clique em `undo-edit`, `redo-edit`, `delete-playlist`; `focusin`/`focusout`/`keydown` no título (REQ-05, REQ-06, REQ-07).
- `public/js/views/PlaylistsView.js`: liga as ações; `update()` espera o fim da edição de um título; passa `canUndo`/`canRedo` e o nome do lote guardado ao desenho; zera o painel de reconfigurar ao abrir e depois de gerar (REQ-04, REQ-05, REQ-07, REQ-10).
- `public/js/components/playlists/PlaylistGrid.js`: `renderTitle` (prefixo fora do campo), lixeira no cabeçalho. `PlaylistsGridRenderer.js`: `renderHeader`, `renderHistoryButton`, `generatedWith`, um rótulo «Batch Name». `RegeneratePanel.js`: `pending`, `reset()`, `_recipeToShow`, `_ingredientsOf`. `components/Breadcrumb.js`: o caminho de `/playlists`. `components/Icons.js`: `Undo`, `Redo` (REQ-04, REQ-05, REQ-06, REQ-07, REQ-10).
- `public/js/services/spotify/spotifyErrors.js` (novo): `SpotifyReconnectError`, `SpotifyRateLimitError`. `services/SpotifyService.js`: `_send`, `_sendWithRenewedAccess`, `_sendAfterTheWait`, `_fetch(endpoint, options, { patient })`; `searchTrack` deixa a falha passar; `addTracksToPlaylist(id, uris, onAdded)`; sai `createSeriesPlaylists`. `services/SpotifyAuthService.js`: `renewAccess()`, `refreshAccessToken` com uma renovação por vez; o `alert` vira aviso (REQ-02).
- `public/js/services/export/exportLedger.js` (novo): `keyOf(serviço, nome, faixas)`, `get`, `set`, `clear` (REQ-02, REQ-03).
- `public/js/services/SpotifyExportService.js`: `exportPlaylists` → relato; `_targetsOf`, `_match`, `_uriOf`, `_deliverAll`, `_deliver`. `components/SpotifyExportModal.js`: estado `DONE` com `renderReportState`, `renderCreated`, `renderNames`, `renderMatchSummary`, `renderNextSteps`; o texto do modo; um envio por vez (REQ-02, REQ-09).
- `public/js/services/AppleMusicExportService.js` (novo): `exportPlaylists` → relato; `_deliver`, `_catalogIdsOf`; `appleExportMessages(report)`. `views/playlists/PlaylistsExport.js`: `handleExportToAppleMusic` com um envio por vez e o relato em avisos; sai `handleExportToSpotify` (REQ-03).

## UI/UX Design (if the feature touches a screen)
Sem desenho novo. O que aparece está em «Prototype Parity» da spec; os textos novos, nas Open Questions.

## Dependencies
Nenhuma.

## Documents Consulted
- `docs/specs/uat.md` (UAT-200, UAT-02, UAT-03, UAT-04, UAT-08, UAT-09, UAT-190), `MEMORY.md` (`## Now`), `AGENTS.md`
- `reports/audits/2026-11-19-mjrpalbumblender-v0-browser-regression.md` (cenários 6, 7, 12 e seção 6), `reports/audits/2026-11-19-mjrpalbumblender-v0-v5-map.md` (tema 4)
- `docs/specs/features/F56-every-screen-loads-through-the-load-service/` (os avisos da carga), `docs/specs/features/F60-no-saved-work-lost/` (o guardar, o rascunho, a guarda de saída), `docs/specs/features/F63-home-and-navigation-that-answer/` (o molde destes três arquivos)
- `docs/specs/behavior.md`, `docs/manual/` (07, 10, 11, 14, 15, 17, 18, 21, 31, 99)
- `docs/specs/constitution.md` (complexidade até 10 nas funções novas)

Declarações do passo retroativo da via rápida (conferidas no histórico do repositório em 2026-11-21):
- `docs/specs/constitution.md` — sem mudança
- `docs/specs/arch.md` — sem mudança: o único commit que cita a F62 e toca o arquivo (`573fa9b`) é da F58
- `docs/specs/data-model.md` — sem mudança
- `docs/specs/tech-stack.md` — sem mudança: nenhuma dependência nova
- `docs/specs/design-system.md` — sem mudança: o projeto não tem `design-system.md`; nenhum token, fonte ou componente compartilhado mudou
- `docs/specs/behavior.md` — atualizado (commit `ccd34bd`: 14 estados reescritos e 8 novos)
- `docs/wiki/` — sem mudança: as páginas de `docs/wiki/` do projeto são só as do harness

## Risks & Considerations
- **`SpotifyService._fetch` serve também à carga de popularidade.** Para ela muda uma coisa: um 401 renova o acesso uma vez e repete a chamada (antes: erro). A espera do 429 é só de quem pede (`patient`), e só a exportação pede. O texto do erro de limite mantém «Rate Limited», que `SpotifyEnrichmentService` procura.
- **O histórico decide pelo objeto na store.** Quem puser na store o mesmo array que o serviço mostrou, alterado no lugar, não é visto como «outro conjunto». Hoje ninguém faz isso no app (um teste da F60 faz, de propósito, para simular a edição).
- **O título é lido de um campo `contenteditable`.** O texto colado com formatação entra como texto (lê-se `textContent`). Enquanto o campo tem o foco a tela não é redesenhada; se o campo for removido da página por outro motivo sem perder o foco antes, o redesenho adiado só vem na próxima mudança da store.
- **A lembrança do que foi exportado é da visita.** Ver «Out of Scope» da spec: depois de reconectar o Spotify, que recarrega o app, um novo envio duplica o que o envio interrompido tinha criado.
- **Playlists guardadas antes da F62** têm só `algorithmId` e `rankingId` em `_meta`: o painel abre na receita certa com as opções padrão.
- **Nada disto foi visto num navegador por quem implementou,** e nenhuma chamada foi feita ao Spotify nem à Apple: os testes rodam em jsdom, com `fetch`, MusicKit e Firestore trocados por dublês. A aparência dos botões novos, da lixeira e do relato da janela é do integrador.

## Test plan
> Derivado dos REQ do `spec.md` · 2026-11-19 20:40 (Brasília)

| REQ | Caso de teste | Critério / estado | Camada | Automatizado? |
|---|---|---|---|---|
| REQ-01 | `test/algorithms/recipes.promise.test.js` (22 casos; 6 falhavam antes); `test/controllers/BlendingController.load.test.js` (2 casos do aviso) | cada receita pelo nome; agrupamento por artista; a ordem usada sem a fonte · `^blend-recipe-promises`, `^blend-source-missing` | serviço de geração + controlador | sim |
| REQ-02 | `test/services/spotify/SpotifyExport.test.js` (18 casos, com um dublê da API do Spotify); `test/components/SpotifyExportModal.test.js` (reconectar, limite, tentar de novo) | renova e segue; 401 renova uma vez; sem renovação: reconectar com o relato; 429 curto espera, longo diz; não duplica · `^spotify-export-access-renewed`, `^spotify-export-rate-limit`, `^spotify-export-no-duplicate`, `^spotify-export-error` | serviço + janela | sim |
| REQ-03 | `test/services/musickit/AppleMusicExport.test.js` (19 casos, com um dublê do MusicKit) | falha dita com o que foi e não foi criado; dois cliques, um envio; segunda exportação não cria · `^apple-export-failed`, `^apple-export-no-duplicate` | serviço + tela | sim |
| REQ-04 | `test/components/playlists/PlaylistsScreen.edit.test.js` (6 casos do painel); `test/controllers/PlaylistsController.edit.test.js` (a receita guardada e relida) | abre na receita das playlists; mantém o que foi mexido · `^playlists-reconfigure-panel` | componente + banco (dublê) | sim |
| REQ-05 | `test/services/PlaylistsService.history.test.js` (9 casos); `PlaylistsScreen.edit.test.js` (2); `test/views/playlistEditActions.test.js`; `PlaylistsController.edit.test.js` (2) | desfaz até o conjunto gerado; recomeça com outro conjunto; botões pela store · `^playlists-undo-redo` | serviço + componente + tela | sim |
| REQ-06 | `PlaylistsScreen.edit.test.js`; `playlistEditActions.test.js`; `PlaylistsController.edit.test.js` (2) | botão no cartão; só o que sobra é guardado · `^playlists-delete-playlist` | componente + banco (dublê) | sim |
| REQ-07 | `PlaylistsController.edit.test.js` (5 casos pelo `fakeFirestore`); `PlaylistsService.history.test.js` (3); `playlistEditActions.test.js` (5) | o título fica no redesenho, ao guardar, ao reabrir, ao exportar · `^playlists-title-edit` | tela + serviço + banco (dublê) | sim |
| REQ-08 | `test/components/blend/BlendIngredientsPanel.test.js` (3 casos novos) | sem «Discovery Mode»; duração quando divide · `^blend-ingredients-by-recipe` | componente | sim |
| REQ-09 | `SpotifyExportModal.test.js` (2 casos); `SpotifyExport.test.js` (1) | um link por playlist; o texto segue o modo · `^spotify-export-success`, `^spotify-export-merge-or-separate` | janela + serviço | sim |
| REQ-10 | `PlaylistsScreen.edit.test.js` (4 casos) | nome do lote, um rótulo, o caminho · `^playlists-edit-mode`, `^playlists-batch-name-live` | componente | sim |
| todos | prova no navegador (TASK-13) | cada item reproduzido e conferido | navegador | não |

Bordas fora dos critérios (achados para a `mjrp-writing-reqs` se mudam o comportamento): o que «Discovery Mode» deveria fazer, se voltar; o que fazer com um álbum sem ranking da pessoa (ordem do álbum, hoje) e com a lembrança da exportação depois de recarregar.
