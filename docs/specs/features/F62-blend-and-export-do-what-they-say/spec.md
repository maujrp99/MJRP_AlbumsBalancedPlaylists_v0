---
status: Done
lane: fast
solution_type: fix
needs_human: "decidir: as nove mudanças de comportamento e os textos novos listados nas Open Questions da spec (o menu de mistura, o desfazer e refazer, o título da playlist)"
imports: []
fixes: ["UAT-200", "UAT-02", "UAT-03", "UAT-04", "UAT-08", "UAT-09", "UAT-190"]
planned_for: "[[ROADMAP#^REL-40]]"
---
<!-- docs/specs/features/Fxx-slug/spec.md — the folder is the feature (Fxx, two digits).
     status: In progress while the cycle runs; Done when every task is closed and every REQ has verified_by.
     imports: the requirement nodes this feature delivers (1..n), each Ready, each in no other open feature.
     A transversal NFR node constrains every feature (review it with constitution.md), so a product feature does not import
     it. The exception is an engineering feature (a refactor planned by an ADR, infrastructure): `solution_type: fix`, `fixes: [UAT-xx]` of the
     debt issues (required: the card takes its release from them), and `imports:` only the NFR it serves, named by a
     `violates:: [[NFR-xx-<slug>]]` in the Problem Statement — no story invented for it. A debt against a constitution
     article imports nothing and says `violates:: [[constitution#N]]` of an article that exists. -->
# Feature F62: Blend e exportação fazem o que dizem
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** Cada receita do blend faz o que o nome diz ou avisa; exportar para o Spotify renova o acesso vencido; exportar para a Apple Music avisa a falha e não duplica; desfazer e refazer têm botão; o título de uma playlist editado fica salvo.

**Por quê:** São os defeitos de blend, playlists e exportação dos relatórios anteriores, ainda não testados em 2026-11-19.

**Como saber que funcionou:** Cada item reproduzido no navegador antes e conferido depois.

## Problem Statement
Decisão do MJRP de 2026-11-19: tudo entra na v5.0, e cada feature pronta e testada vai para produção sozinha. Origem: o cruzamento dos relatórios anteriores (`reports/audits/2026-11-19-mjrpalbumblender-v0-earlier-reports-vs-v5-plan.md`, seção D), o mapa da v5.0 (`reports/audits/2026-11-19-mjrpalbumblender-v0-v5-map.md`, tema 4) e a regressão no navegador (`reports/audits/2026-11-19-mjrpalbumblender-v0-browser-regression.md`, cenário 12 e seção 6).

Cada issue foi conferida no código da `main` em `c9aaa7a` (2026-11-19, depois da F56, da F60, da F63 e da F59) antes de qualquer mudança. Nenhuma estava consertada por inteiro pelo trabalho do dia; o que a F56 e a F60 já tinham feito está dito em cada linha.

| Issue | Parte | Ainda existia? | Onde (linhas da `main` em `c9aaa7a`) |
|---|---|---|---|
| UAT-200 | «By Artist then By Rank» não agrupa por artista | **Sim.** O agrupamento lia `artistName` e `artists[0].name`; a faixa tem `artist`. Todo artista virava texto vazio e a ordem saía só por posição | `algorithms/TopNAlgorithm.js:161-173` |
| UAT-200 | «My Own Ranking» cai calada para a ordem de aclamação | **Sim, em parte.** A F56 já avisava «Your own ranking is missing for N of M albums», mas não dizia que ordem tinha sido usada, e a ordem usada era a de `album.tracks`, que é a de aclamação | `ranking/UserRankingStrategy.js:51,94-95`, `models/albumAsk.js` (`sourceNotice`) |
| UAT-200 | (achado ao ler) «Top Acclaimed» põe faixa sem nota acima de faixa com nota | **Sim.** A popularidade entrava no lugar da nota que faltava e era comparada com as notas | `ranking/BalancedRankingStrategy.js:148`, `ranking/BEARankingStrategy.js:27` |
| UAT-200 | (achado ao ler) o embaralhar é viciado | **Sim.** `sort(() => Math.random() - 0.5)` | `algorithms/TopNAlgorithm.js:180` |
| UAT-200 | Exportar para o Spotify recusa um token vencido que dá para renovar | **Sim.** A exportação recusava de saída pelo relógio (`isAuthenticated()`), sem tentar o token de renovação; um 401 no meio virava erro sem renovar | `services/SpotifyExportService.js:30`, `services/SpotifyService.js:53` |
| UAT-200 | (achado ao ler) 429 sem espera; busca de faixa engole a falha | **Sim.** O 429 virava «Rate Limited» na hora; a busca de faixa devolvia «não achei» em qualquer falha, e a exportação seguia | `services/SpotifyService.js:58-59,250`, `services/SpotifyExportService.js:74` |
| UAT-200 | Exportar para a Apple Music falha sem aviso | **Sim.** A falha ao criar ia só para o console; a tela chamava a exportação sem o botão, que nunca era desabilitado | `views/playlists/PlaylistsExport.js:185`, `views/PlaylistsView.js:206` |
| UAT-200 | Um segundo clique exporta duas vezes (Apple) | **Sim.** Nada impedia o clique durante o envio nem lembrava o que já tinha sido criado | `views/playlists/PlaylistsExport.js:67` |
| UAT-200 | O painel de reconfigurar esquece a configuração | **Sim.** O painel abria sempre na receita recomendada; o que a pessoa mexia era guardado na forma do painel (minutos, `rankingType`) e lido na forma da geração (segundos, `rankingId`), então duração e fonte voltavam ao valor inicial a cada redesenho; o Top N não era passado e voltava para 3 | `components/playlists/RegeneratePanel.js:139-148`, `components/playlists/PlaylistsGridRenderer.js:29` |
| UAT-02 | Desfazer e refazer sem botão | **Sim.** E o histórico não funcionava: o primeiro passo gravado já era a mudança (não havia ponto de partida), as operações de faixa não atualizavam `canUndo`, e os passos de um conjunto continuavam valendo depois de gerar de novo | `services/PlaylistsService.js:58,72,87,104,194-220`, `controllers/BlendingController.js:82,139` |
| UAT-03 | Sem botão de excluir uma playlist | **Sim.** O ouvinte existia; nenhum elemento trazia `data-action="delete-playlist"`. (A F60 já tinha feito `removePlaylist` com passo no histórico) | `views/PlaylistsView.js:85`, `components/playlists/PlaylistGrid.js:119-139` |
| UAT-04 | Título de playlist editado não fica | **Sim.** O campo editável mostrava «1. Lote - Título» inteiro e nenhum código lia o que era digitado; qualquer redesenho o apagava | `components/playlists/PlaylistGrid.js:58-61,126` |
| UAT-08 | «Discovery Mode» não tem efeito | **Sim.** O valor chegava à geração e nenhuma receita o lia | `components/blend/BlendIngredientsPanel.js:21,424`, `services/PlaylistGenerationService.js:66` |
| UAT-08 | (achado ao ler) a duração alvo divide a lista sem aparecer | **Sim.** Numa receita Top N em «Auto», a lista era dividida por 60 minutos e o controle da duração só aparecia em «Multiple» | `components/blend/BlendIngredientsPanel.js:180` |
| UAT-09 | «Open in Spotify» morto no modo separado; texto diz «unidas numa só» | **Sim** | `services/SpotifyExportService.js:88`, `components/SpotifyExportModal.js:111,272` |
| UAT-190 | «EDITING: ...» no lugar do nome | **Sim.** A tela lia `editContext.batchName`, campo que não existe | `views/PlaylistsView.js:279` |
| UAT-190 | Rótulo «Batch Name» duas vezes | **Sim** | `components/playlists/PlaylistsGridRenderer.js:104-105` |
| UAT-190 | Caminho «Home › Albums» | **Sim.** Ao criar, a tela pedia o caminho da tela de álbuns; ao editar, pedia o das playlists guardadas, que não desenha nada | `views/PlaylistsView.js:284`, `components/Breadcrumb.js:47` |

## Requirements
<!-- Local IDs, two digits. Each REQ traces to an imported node; none is invented here.
     Functional and non-functional (performance, security, accessibility) alike are REQ-xx. -->
- [REQ-01] Cada receita do menu entrega o que o nome promete: «Top Tracks by Spotify Popularity» as N mais populares de cada álbum; «Top Acclaimed Tracks on BestEverAlbums» as N de maior nota, e uma faixa sem nota nunca à frente de uma com nota; «Top Tracks by My Own Ranking» as N primeiras do ranking guardado; a receita recomendada o 1º e o 2º lugar de cada álbum e o resto em playlists dentro da duração escolhida, sem perder faixa. O agrupamento «By Artist then By Rank» junta as faixas por artista. Quando a fonte que a receita lê falta para um álbum, o aviso diz a ordem usada no lugar; sem o ranking da pessoa, a ordem é a do álbum. · fixes UAT-200
  verified_by:: `test/algorithms/recipes.promise.test.js`, `test/controllers/BlendingController.load.test.js` («says when a source the recipe reads is missing…», «My Own Ranking says which albums…»)
- [REQ-02] Exportar para o Spotify renova o acesso vencido antes de começar e, recusado no meio (401), uma vez, repetindo a chamada; quando não dá para renovar, a janela pede para conectar de novo, com o botão, e diz o que foi criado e o que não foi. Um 429 com espera curta é esperado; com espera longa é dito, com o tempo pedido. Nenhuma falha termina calada, e exportar de novo na mesma visita não cria o que já foi criado. · fixes UAT-200
  verified_by:: `test/services/spotify/SpotifyExport.test.js`, `test/components/SpotifyExportModal.test.js`
- [REQ-03] Exportar para a Apple Music diz a falha com o que foi e o que não foi criado, e não cria uma segunda cópia: um clique durante o envio não cria nada, e o que foi criado nesta visita não é criado de novo. · fixes UAT-200
  verified_by:: `test/services/musickit/AppleMusicExport.test.js`
- [REQ-04] O painel de reconfigurar abre na receita e nas opções com que as playlists da tela foram geradas (também depois de guardar e reabrir o lote) e mantém o que a pessoa mexeu nele enquanto a tela é redesenhada. · fixes UAT-200
  verified_by:: `test/components/playlists/PlaylistsScreen.edit.test.js` («the reconfigure panel shows the recipe…», 6 casos), `test/controllers/PlaylistsController.edit.test.js` («UAT-200: the recipe of the playlists»), `test/algorithms/recipes.promise.test.js` («what the generated playlists remember»)
- [REQ-05] Desfazer e refazer têm um botão cada na tela de playlists, desabilitado quando não há passo; o estado vem da store. O histórico começa no conjunto como chegou à tela (a primeira mudança pode ser desfeita) e recomeça quando outro conjunto chega; desfeita a última mudança, não há mais alteração a guardar. · fixes UAT-02
  verified_by:: `test/services/PlaylistsService.history.test.js`, `test/components/playlists/PlaylistsScreen.edit.test.js` («the buttons of undo and redo»), `test/views/playlistEditActions.test.js`, `test/controllers/PlaylistsController.edit.test.js` («UAT-02»)
- [REQ-06] Cada playlist do conjunto tem uma ação de excluir, e só o que sobra é guardado. · fixes UAT-03
  verified_by:: `test/components/playlists/PlaylistsScreen.edit.test.js` («has a button that deletes that playlist…»), `test/views/playlistEditActions.test.js`, `test/controllers/PlaylistsController.edit.test.js` («UAT-03»)
- [REQ-07] O título que a pessoa digita numa playlist fica na playlist: vale na tela depois de qualquer redesenho, ao guardar o lote, ao abrir o lote para edição e nas exportações. · fixes UAT-04
  verified_by:: `test/controllers/PlaylistsController.edit.test.js` («UAT-04», 5 casos, pelo `test/helpers/fakeFirestore.js`), `test/services/PlaylistsService.history.test.js` («renamePlaylist»), `test/views/playlistEditActions.test.js`, `test/components/playlists/PlaylistsScreen.edit.test.js`
- [REQ-08] Uma opção do painel de ingredientes só aparece para a receita em que muda o resultado. «Discovery Mode», que nenhuma receita lia, não é mais mostrado; a duração alvo aparece sempre que a lista pode ser dividida por ela. · fixes UAT-08
  verified_by:: `test/components/blend/BlendIngredientsPanel.test.js` («shows Discovery Mode for no recipe…», «shows the target duration of a Top N recipe…»), `test/algorithms/recipes.promise.test.js` («the output mode of a Top N recipe»)
- [REQ-09] No modo separado, a pessoa abre no Spotify cada playlist que acabou de criar, e o texto da janela diz o que cada modo faz. · fixes UAT-09
  verified_by:: `test/components/SpotifyExportModal.test.js` («in separate mode shows every playlist created with a link…», «says what each mode will create…»), `test/services/spotify/SpotifyExport.test.js` («one playlist for each in separate mode, each with its address»)
- [REQ-10] O topo da tela de playlists mostra o nome do lote que está sendo editado, um rótulo «Batch Name» só e o caminho da própria tela. · fixes UAT-190
  verified_by:: `test/components/playlists/PlaylistsScreen.edit.test.js` («the top of the screen (UAT-190)», 4 casos)

## Observable States
<!-- What the imported nodes point_to: the screen state in info-arch.md (the prototype the human judged —
     PRINCIPLES.md §I.13) or the behavior state in behavior.md. N/A only if the nodes point to none. -->
N/A: a feature não importa nenhum requisito (conserto de issues). Estados do `docs/specs/behavior.md` reescritos para o que o código faz agora: `^blend-ingredients-by-recipe`, `^blend-source-missing`, `^playlists-grid`, `^playlists-reconfigure-panel`, `^playlists-batch-name-live`, `^playlists-edit-mode`, `^playlists-leave-unsaved`, `^playlists-actions-panel`, `^spotify-export-steps`, `^spotify-export-merge-or-separate`, `^spotify-export-success`, `^spotify-export-error`, `^apple-export-done`, `^apple-export-failed`. Estados novos: `^blend-recipe-promises`, `^playlists-title-edit`, `^playlists-delete-playlist`, `^playlists-undo-redo`, `^spotify-export-access-renewed`, `^spotify-export-rate-limit`, `^spotify-export-no-duplicate`, `^apple-export-no-duplicate`.

## Prototype Parity (if the feature touches a screen)
- Prototype: none. Nenhuma tela foi redesenhada. O que muda à vista: no menu de mistura, some o interruptor «Discovery Mode» e a duração alvo aparece nas receitas Top N em «Auto»; na tela de playlists, dois botões («Undo», «Redo») antes de «Save to Series History», uma lixeira no cabeçalho de cada cartão, o título do cartão com «1. Lote - » em cinza e só o título editável, o selo «Editing: <lote>», um rótulo «Batch Name» e o caminho «Home › Blend › Playlists» ou «Home › Saved Playlists › Edit Batch»; na janela do Spotify, o texto sob o botão que acompanha o modo e, no fim, as listas «Created», «Not created» e os botões «Connect to Spotify again» ou «Try again»; na exportação para a Apple Music, o botão ocupado com o passo e avisos de 12 segundos com o relato.
- Transversal layer touched: `services/SpotifyService.js` (`_fetch`: usado também pela carga de popularidade; para ela muda só a renovação do acesso num 401, a espera do 429 é só da exportação), `services/SpotifyAuthService.js` (uma renovação por vez), `components/Breadcrumb.js` (o caminho de `/playlists`; os outros caminhos não mudam), `components/Icons.js` (dois ícones novos), `models/albumAsk.js` (`askNotices` ganhou um segundo parâmetro opcional).
- Design-system cuts or swaps: none. O projeto não tem `design-system.md`; os botões novos usam `btn btn-secondary`, e a janela do Spotify as cores que já usava.

**Prototype**: none — MJRP, 2026-11-20 00:10: «eu dispenso prototipo por que estávamos arrumando e consertando problemas passados com pequenas melhorias e nao trabalhando em grande features nova, portanto por ora os prototipos estao dispensados.»

## Success Criteria
- As quatro receitas do menu passam pelos 22 casos de `test/algorithms/recipes.promise.test.js`, pelo `PlaylistGenerationService`, o caminho da tela (6 falhavam na `main`).
- «By Artist then By Rank» com três álbuns de dois artistas entrega as faixas de um artista juntas (antes: intercaladas).
- O aviso de fonte faltando termina com a ordem usada no lugar, e a frase é conferida contra o que cada ranking faz.
- Com o acesso vencido e o token de renovação guardado, a exportação para o Spotify cria as playlists (antes: «Connect to Spotify first»). Um 401 no meio custa uma renovação, não o envio.
- No modo separado, o relato traz um endereço por playlist criada e a janela um link por playlist (antes: nenhum).
- Exportar duas vezes na mesma visita, para o Spotify ou para a Apple Music, cria cada playlist uma vez.
- Uma playlist que a Apple recusa aparece num aviso com o nome e o motivo (antes: só no console).
- Tirar uma faixa e clicar em «Undo» devolve o conjunto como foi gerado; «Redo» refaz; os botões ficam desabilitados sem passo.
- Trocar o título de uma playlist, guardar, recarregar e abrir o lote para edição mostra o título trocado (pelo `fakeFirestore`).
- Nenhum `alert(` em `services/SpotifyAuthService.js` nem em `views/BlendingMenuView.js`.
- Nenhuma função nova acima de complexidade 10; nas funções tocadas que já passavam do limite nenhum ramo foi acrescentado.
- Suíte: 1512 testes passando (1394 antes da feature); `npx vite build` compila.

## Out of Scope
- **Os outros defeitos dos algoritmos do tema 4.5 do mapa** (desempate, número dos volumes depois de juntar, álbuns curtos na receita recomendada, faixas sem duração contadas como zero, «Greatest Hits» sem teto por volume): sem issue própria; só o embaralhar e a duração escondida foram consertados, por estarem no caminho.
- **«Origem e Your Rank somem das faixas geradas» (4.7), «data em UTC nos nomes padrão» (4.8), «Blend your Albums nunca fica desabilitado» (4.3), a corrida ao carregar o MusicKit e `isAuthorized` que nunca é zerado (4.1)**: sem issue própria, não tocados.
- **O casamento de faixas na exportação** (a busca do Spotify aceita o primeiro resultado quando nenhum confere; a da Apple idem): é a regra de identidade, da F55 e da F68.
- **A lembrança do que foi exportado não sobrevive a recarregar a página.** Depois de «Connect to Spotify again» (que sai do app e volta), um novo envio cria de novo o que o envio interrompido tinha criado; a janela diz isso antes de a pessoa sair.
- **Renovar o acesso quando a rede cai:** `SpotifyAuthService` continua encerrando a sessão do Spotify em qualquer falha da renovação, também numa falha de rede (comportamento anterior, não mexido).
- **Atalho de teclado para desfazer e refazer:** não existia; não foi criado.
- **O resumo sob o botão do blend** («Using X on Y (60 min, auto mode)») continua mostrando duração e modo também quando a receita não os usa.
- **A tela de playlists guardadas** (`SavedPlaylistsView` e os seus componentes) e os algoritmos fora do menu (`LegacyRoundRobin`, `SDraft*`, `MJRPBalancedCascadeV0`, `Top3*`, `Top5*`, `shared/curation.js`): não tocados.

## Open Questions
<!-- ALL resolved before Plan. -->
- **«Discovery Mode» (UAT-08): retirado — decidido pelo agente, revisável.** A issue pedia que o modo mudasse a playlist «do jeito que o produto definir», e o produto nunca definiu. O texto do interruptor dizia «Include tracks without ranking data»; fazer esse texto valer (desligado = deixar de fora as faixas sem nota) tiraria álbuns inteiros da playlist sempre que uma fonte faltasse, o que pede um desenho e um aviso próprios. Retirar o interruptor é a correção que não inventa comportamento. Se o MJRP quiser o modo, é um requisito novo.
- **Sem o ranking da pessoa, a ordem do álbum (e não a de aclamação) — decidido pelo agente, revisável.** O comentário do código já dizia «original album position»; a ordem de aclamação sob o nome «My Own Ranking» era o defeito. A alternativa (deixar o álbum de fora) muda o tamanho da playlist; a escolhida mantém o álbum e diz no aviso o que foi feito.
- **Não duplicar na Apple Music: lembrar o id na visita, e não conferir a biblioteca — decidido pelo agente.** Na biblioteca o nome não é único e a playlist recém-criada demora a aparecer na lista, o que falharia justamente no segundo clique; conferir pediria paginar todas as playlists a cada envio. O limite é o de cima: recarregar zera a lembrança.
- **Guardar zera o histórico de desfazer — decidido pelo agente, revisável.** O que foi guardado vira o novo ponto de partida; desfazer para antes do que está no banco pediria regravar o banco.
- **Textos novos, em inglês, a julgar pelo MJRP:** «Undo», «Redo» («Undo the last change», «Redo the change that was undone»), «Nothing to undo», «Nothing to redo», «Delete this playlist», «Home › Blend › Playlists», «Home › Saved Playlists › Edit Batch»; no menu: «Acclaim first, popularity where unrated», «Every #1, then every #2...», «One playlist, split when over the target»; no aviso do blend: «Its/Their tracks were ordered <ordem> instead.», com as ordens «in album order», «by acclaim where there is one, otherwise in album order», «by Spotify popularity where there is one, otherwise in album order», «by acclaim alone»; na janela do Spotify: «Each playlist becomes its own Spotify playlist, named after this name and its title», «Export stopped part of the way», «Created (n)», «Created without all their tracks (n)», «Not created (n)», «No track found (n)», «(already exported in this session, not created again)», «Connect to Spotify again», «Try again», «Spotify needs you to connect again.», «Spotify asked to wait N seconds before the next request (Rate Limited).»; na Apple Music: os avisos listados no estado `^apple-export-failed` do `behavior.md`.
- **Mudanças de comportamento a julgar pelo MJRP:** (1) some o «Discovery Mode»; (2) «My Own Ranking» num álbum sem ranking pega as primeiras faixas na ordem do álbum, não as mais aclamadas; (3) «Top Acclaimed» deixa as faixas sem nota depois das com nota; (4) uma faixa cuja «nota» era a popularidade no lugar não mostra mais essa popularidade como nota na playlist gerada; (5) uma playlist sem nenhuma faixa achada não é criada no Spotify (antes era criada vazia no modo separado); (6) exportar de novo na mesma visita não cria cópias (quem queria duas cópias iguais precisa recarregar a página ou mudar o nome); (7) o título do cartão não é mais editável por inteiro: só o título, sem «1. Lote - »; (8) guardar zera o desfazer; (9) na exportação para a Apple Music, a falha de uma playlist não interrompe as outras (já era assim) e agora é dita.
