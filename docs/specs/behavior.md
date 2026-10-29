# Behavior - MJRP_AlbumsBalancedPlaylists_v0

Onde se vê o comportamento que não é tela: a saída de um comando, um código de saída, um arquivo gerado, um hook que
bloqueia, a resposta de uma API, o que um agente faz. Cada estado é um nó do grafo de requisitos, com block ID no fim
da linha; o requisito aponta para ele com `points_to`. A superfície visual mora no `info-arch.md`.

Escreve-se só uma direção: o requisito aponta para o estado. Um estado descreve **onde o comportamento se vê**, não o
critério de aceite. Em vez do protótipo de tela, o que o humano julga aqui são os exemplos: um estado entra quando os
exemplos que ele mostra foram julgados.

## Como este arquivo nasceu (conform, pacote C1, 2026-10-28)

O v0 está em produção e não tem protótipo aprovado nem `docs/specs/info-arch.md` (PRD, «Desenho e protótipo»). Por isso
os estados que a pessoa vê e que não são o desenho de uma tela (carregamento, vazio, mensagem de aviso ou de erro,
pedido de confirmação, o que fica guardado no navegador) moram aqui, e as stories entregues apontam para eles. Cada linha
diz **só o que o código faz hoje**: foi lida do inventário do V1 sobre o v0
(`/Users/maujrp/mjrp/projects/MJRPalbumblender-v1/reports/audits/2026-10-27-mjrpalbumblender-v0-feature-inventory.md`),
com o ID do inventário e `arquivo:linha` (caminhos relativos a `public/js/`, salvo quando começam por `server/` ou
`public/`). Os textos entre aspas são os que a tela mostra, em inglês, como estão no código. Os exemplos foram
«julgados» pelo uso em produção, antes do harness (regra do MJRP de 2026-10-18: o que está fechado e em produção nasce
aceito); nenhum estado novo foi inventado, e o que o inventário marca como **não funciona** não é descrito aqui como se
funcionasse: virou issue em `docs/specs/uat.md` (UAT-01 a UAT-13, decisão do MJRP), e a linha do estado que ainda mostra
o recurso quebrado traz a ressalva com o número da issue. Decidido pelo agente, revisável pelo MJRP. Quando existir `info-arch.md`, o estado que for de tela pode ir
para lá; o block ID continua o mesmo.

## Tela inicial: montar a série

- **Série sem nome ganha o nome padrão.** Se a pessoa não digita nada no campo de nome, a série é criada como "New Album Series" (H1 · `controllers/HomeController.js:222`). ^home-series-default-name
- **Escaneando a discografia.** O botão vira um spinner e o status mostra "Scanning..." (H2 · `components/home/SearchController.js:20-82`). ^home-scan-loading
- **Discografia encontrada.** O status mostra "→ " e o nome do artista; a grade lista os álbuns do mais novo ao mais antigo (H2 · `components/home/SearchController.js:20-82`). ^home-scan-found
- **Artista não encontrado.** O status mostra "→ Not Found" e o navegador abre um alerta nativo "No albums found for this artist." (H2, T8 · `components/home/SearchController.js:72`). ^home-scan-not-found
- **Falha na busca.** O navegador abre um alerta nativo "Artist not found or API error." (T8 · `components/home/SearchController.js:77`). ^home-scan-failed
- **Filtros por tipo de álbum.** "Studio" começa ligado; "EPs", "Singles", "Live", "Compendiums" e "?" (não classificado) ligam e desligam cada um por si, e cada botão mostra a quantidade entre parênteses (H4 · `components/home/SearchController.js:85-169`, `views/HomeView.js:153-160`). ^home-discography-type-filters
- **Filtro sem nenhum álbum.** A grade mostra "No albums found." (H4 · `views/renderers/DiscographyRenderer.js:15-18`). ^home-discography-filter-empty
- **Escolher um álbum.** Clicar no cartão do álbum o põe no conjunto escolhido; clicar de novo não o tira, e o mesmo álbum não entra duas vezes (H7, H9 · `controllers/HomeController.js:98-111`). ^home-album-added-to-stack
- **Conjunto escolhido vazio.** Mostra "Stack Empty" no começo e "No albums selected yet." depois de a lista ser desenhada (H9 · `views/renderers/StagingAreaRenderer.js:15-17,45-55`). ^home-stack-empty
- **Conjunto escolhido com álbuns.** O título mostra "(n Albums)"; o X de cada linha tira o álbum; arrastar a linha muda a ordem (H9 · `components/home/StagingAreaController.js:13-64`). ^home-stack-filled
- **Colar uma lista de álbuns.** Na caixa de texto, a borda fica verde quando as linhas estão no formato "Artista - Álbum" e laranja quando não estão; linhas sem "-" são ignoradas (H10 · `controllers/HomeController.js:76-96,127-217`). ^home-bulk-format-hint
- **Lista processada.** O botão mostra "Processing..." e, no fim, um aviso "Processed N albums."; a caixa de texto é esvaziada (H10 · `controllers/HomeController.js:127-217`). ^home-bulk-processed
- **Lista sem resultado.** Um aviso "No albums found. Check formatting." (H10 · `controllers/HomeController.js:127-217`). ^home-bulk-nothing-found
- **Lista com falha.** Um aviso "Processing failed: …" com o motivo (H10 · `controllers/HomeController.js:127-217`). ^home-bulk-failed
- **Série criada.** O botão mostra "Creating Series...", depois um aviso "Created series: X with N albums" e a tela abre a série criada (H11 · `controllers/HomeController.js:219-275`). ^home-series-created
- **Criar sem escolher álbum.** Um aviso "Please select at least one album to initialize." (H11 · `controllers/HomeController.js:219-275`). ^home-series-needs-album
- **Falha ao criar a série.** Um aviso "Database not initialized" ou "Failed to create series: …" (H11 · `controllers/HomeController.js:219-275`). ^home-series-create-failed

## Biblioteca de séries

- **Endereço da série.** `/albums` mostra todas as séries; `/albums/:id` mostra uma; a barra de endereço passa a `/albums?seriesId=…`, e a troca de série não recarrega a página (A1 · `views/SeriesView.js:101-111`, `controllers/SeriesController.js:90-112`). ^library-scope-url
- **Carregando os álbuns.** Cada série aparece primeiro como um esqueleto cinza; no painel de todas as séries só as três primeiras são desenhadas de saída e as outras se completam quando a pessoa rola até elas; uma barra de progresso corre no topo (A8 · `controllers/SeriesController.js:90-317`, `utils/VirtualScrollObserver.js`). ^library-loading-skeleton
- **Falha ao carregar.** Um aviso "Failed to load series data" ou "Error loading albums. Please try again." (A8 · `controllers/SeriesController.js:90-317`). ^library-load-failed
- **Biblioteca vazia.** Mostra "No albums in library", "Create a series from the home page to get started" e o botão "Go to Home" (A18 · `components/series/SeriesEmptyState.js:10-47`). ^library-empty
- **Filtro sem resultado.** Mostra "No albums match your filters" e "Try adjusting your search or filters" (A4 · `views/albums/AlbumsGridRenderer.js:54-60`). ^library-filter-empty
- **Busca e filtros.** A busca procura no título e no artista; os filtros são por série, artista, década (de 1960s a 1990s e "2000s+") e fonte (My Ranking, Pending, BestEverAlbums, Popularity, AI Enriched); trocar de série zera a busca e os filtros (A3, A4 · `components/ui/FilterToolbar.js:49-60`, `services/SeriesFilterService.js:37-82`). ^library-search-and-filters
- **Grade ou lista, lembrada.** Um botão só alterna entre grade compacta e lista expandida, e a escolha fica guardada no navegador na chave `albumsViewMode` (A6 · `components/ui/FilterToolbar.js:118-179`). ^library-view-mode-remembered
- **Ordenar as séries.** O seletor "Sort" tem seis opções (quantidade de álbuns crescente e decrescente, nome A-Z e Z-A, mais novo e mais antigo) e muda a ordem dos grupos de séries, não dos álbuns; só se nota no painel de todas as séries (A5 · `controllers/SeriesController.js:489-523`). ^library-series-sort
- **Pedir para excluir uma série.** Uma janela "Delete Series?" avisa que "Albums will NOT be deleted from inventory" (A11 · `components/series/SeriesModals.js:55-85`). ^series-delete-confirm
- **Série excluída.** Um aviso confirma; se a pessoa estava vendo só essa série, volta para `/albums` (A11 · `views/helpers/SeriesModalsManager.js:43-50`). ^series-deleted
- **Falha ao excluir a série.** Um aviso "Series not found", "Database not initialized" ou "Failed to delete series" (A11 · `components/series/SeriesModals.js:55-85`). ^series-delete-failed
- **Editar a série.** Uma janela deixa trocar o nome (obrigatório), tirar álbuns pelo x e acrescentar álbuns buscando um artista (filtros Albums, Singles-EPs, Live e Compilations); "No albums yet." quando não há nenhum; o contador mostra "n albums" (A12 · `components/series/SeriesEditModal.js:10-221`). ^series-edit-modal
- **Avisos da edição da série.** "Series name is required", "Album already in list", "Added: …", "Series updated" ou "Failed to update series" (A12 · `components/series/SeriesEditModal.js:10-221`). ^series-edit-messages
- **Pedir para tirar um álbum da série.** Uma janela "Remove Album?"; se o álbum não é achado pela busca, a janela "Manual Removal Required" pede para digitar a busca (A14 · `components/series/SeriesEventHandler.js:205-306`). ^album-remove-confirm
- **Álbum tirado da série.** Um aviso "Album removed from series" ou "Album removed manually", e a grade se atualiza sem recarregar; se falha, "Failed to remove album: …" (A14 · `components/series/SeriesEventHandler.js:205-306`). ^album-removed
- **Cartão do álbum.** Mostra capa (com um quadro no lugar quando não há), título, artista, ano, selos de fonte (BestEverAlbums, Spotify, "MY RANKING") e as ações Rank ou Ranked, Add, Del e Refetch; clicar na capa abre os detalhes (A13 · `components/ui/AlbumCardRenderer.js:28-115`). ^album-card
- **Atualizar os dados do álbum.** Os avisos "Refetching metadata for …" e depois "Metadata updated for …" ou "Refetch failed: …"; a barra de progresso corre no topo (A16 · `controllers/SeriesController.js:406-436`). ^album-refetch-feedback
- **Tabela de faixas na lista.** Colunas `#`, Track Name, My Rank, BestEverAlbums (posição e estrela com a nota), Popularity (barra e posição) e Time; clicar no cabeçalho ordena e clicar de novo inverte; o topo mostra as médias My Avg, Avg Rank e Avg Pop; sem faixas mostra "No tracks available" e, sem Spotify, "Not linked" (A17 · `components/ranking/TracksTable.js:8-30,119-135,230-290`). ^album-track-table
- **Origem da nota na estrela.** Passar o mouse na estrela mostra a origem e a nota de cada fonte, no formato "fonte: nota (votos)" (A17, K2 · `components/ranking/TracksTable.js:119-135`). ^track-score-evidence-tooltip
- **Detalhes do álbum.** Uma janela mostra capa, título, artista, ano, formato, "OWNED" ou "WISHLIST", preço, condição e notas, e compara as faixas por fonte (tabela no computador; abas Original, BestEverAlbums e Spotify no celular); fecha com Esc, clique fora, X ou Close (M1 · `components/ViewAlbumModal.js:13-200`, `components/ranking/TracksTabs.js:18-20`). ^album-detail-modal
- **Buscar a popularidade de um álbum.** O botão "Enrich Data" mostra "Loading..." e depois o aviso "Spotify data loaded!"; sem Spotify conectado diz "Connect to Spotify first…" e, se não acha o álbum, "Album not found on Spotify…" (M2 · `components/ranking/TracksRankingComparison.js:117-260`). ^album-enrich-spotify
- **Ordenar as faixas do álbum a seu gosto.** A janela "Rank It" lista as faixas na ordem do álbum, com a posição "#n BEA" e "#n SPFY" de referência; arrasta-se para ordenar, "Reset" volta e "Save" guarda; mostra "Your ranking will be used in 'Top Tracks by My Own Ranking'" (M3 · `components/ranking/UserRankModal.js:54,101-141,194-235`). ^album-rank-it-modal
- **Ordem guardada.** Um aviso "Ranking saved!", o cartão passa a mostrar "Ranked" e o selo "MY RANKING"; se falha, "Failed to save. Please try again." (M3 · `components/ranking/UserRankModal.js:325-355,394-403`). ^album-rank-it-saved
- **Registrar o álbum no inventário a partir do cartão.** O "+" abre uma janela com formato (CD, Vinyl, Cassette, DVD, Blu-ray, Digital), moeda (BRL de início), preço e notas; o álbum entra como "Not Owned" e o aviso é "Album added to inventory!"; se já está, "Album is already in your inventory"; se falha, "Failed to add: …" (A15 · `components/InventoryAddModal.js:15-160`). ^album-add-to-inventory

## Menu de mistura

- **Passos em ordem.** O menu mostra quatro passos (Mix, Recipe, Ingredients, "Blend it! Ready!"); o passo 2 aparece trancado ("Complete Step 1 to unlock") até a série ser escolhida; recebida a receita, os passos 3 e 4 aparecem (B1 · `views/BlendingMenuView.js:44-193`). ^blend-steps-unlock
- **Escolher a série.** O seletor "Blend your Music by" tem "Albums" ativo e Artists, Genres e Tracks desligados com "(Coming Soon)"; cada série aparece com três capas em cascata e a quantidade de álbuns; escolher marca o cartão (B2 · `components/blend/BlendSeriesSelector.js:31-202`). ^blend-series-choice
- **Sem séries.** Mostra "No series found for this entity type" (B2 · `components/blend/BlendSeriesSelector.js:69-133`). ^blend-series-none
- **Escolher a receita.** Quatro cartões de receita (ícone, cor, selo e descrição); a recomendada leva "★ RECOMMENDED"; a escolhida ganha borda âmbar (B4 · `components/blend/BlendRecipeCard.js:41-146`). ^blend-recipe-choice
- **Ingredientes conforme a receita.** Aparecem só os controles que a receita usa: quantidade de faixas por álbum (1 a 10), agrupamento das faixas (5 modos), estrutura da playlist (única, várias ou automática), duração alvo (30 a 180 minutos, de 5 em 5) e fonte do ranking; a duração só aparece quando a receita a usa ou a estrutura é "várias" (B5 · `components/blend/BlendIngredientsPanel.js:16-347`). ^blend-ingredients-by-recipe
- **Gerando.** O botão final diz "Blend your Album Playlist(s)!", com um resumo "Using X on Y (N min, mode)"; ao gerar mostra "Blending…", o progresso "Loading album i/n…" e, no fim, o aviso "Generated N playlist(s)!" e a tela de playlists abre (B7 · `views/BlendingMenuView.js:198-446`). ^blend-generating
- **Falha ao gerar.** Um painel vermelho mostra a mensagem, por exemplo "No albums loaded from series" ou "Series not found" (B7, B8 · `controllers/BlendingController.js:51-159`). ^blend-failed
- **Nome padrão do lote.** Ao gerar, o lote ganha o nome "TheAlbumBlender Playlist AAAA-MM-DD HH:mm" (B8 · `controllers/BlendingController.js:203-208`). ^blend-default-batch-name

## Playlists geradas

- **Sem álbuns carregados.** O painel "Generation Settings" mostra "No albums loaded" e pede para voltar e carregar álbuns (P2 · `components/playlists/PlaylistsGridRenderer.js:106-178`). ^playlists-no-albums
- **Gerar sem nota nenhuma.** Quando o ranking é o equilibrado e nenhum álbum tem nota, o navegador pergunta "No ratings detected. Playlists may be unbalanced. Continue?" (P3 · `controllers/PlaylistsController.js:245`). ^playlists-no-ratings-confirm
- **Gerando as playlists.** Um véu mostra "Generating balanced playlists..."; depois o aviso "Generated N playlists" (P3 · `controllers/PlaylistsController.js:228-268`). ^playlists-generating
- **Gerar sem álbuns.** O aviso "No albums loaded. Please load albums first." (P3 · `controllers/PlaylistsController.js:228-268`). ^playlists-generate-no-albums
- **Receitas e fonte de nota ao gerar.** O painel "Generation Settings" mostra as quatro receitas como opções e o seletor "Ranking Source" com Balanced (Default), Spotify Popularity e BEA Rating, cada um com sua descrição (P2 · `components/playlists/PlaylistsGridRenderer.js:106-178`). ^playlists-generation-settings
- **Grade de playlists.** Cada playlist mostra o título, a quantidade de faixas e a duração em mm:ss; a grade tem 1, 2 ou 3 colunas conforme a largura; sem playlists mostra "No playlists generated yet." e sem faixas, "No tracks" (P8 · `components/playlists/PlaylistGrid.js:28-139`). ^playlists-grid
- **Linha de faixa.** Mostra o número, o título, a duração e os selos de posição (do usuário em azul, BestEverAlbums em laranja, Spotify em verde, na ordem que combina com a fonte escolhida); o ✕ de remover aparece ao passar o mouse (P9 · `components/ui/TrackRow.js:34-211`). ^playlists-track-row
- **Nomes gerados.** A receita recomendada gera "Greatest Hits" (Vol. 1, Vol. 2 se passar de 60 minutos), "Deep Cuts Vol. N" e "Orphan Tracks"; as receitas Top N geram "SPFY Top N", "BEA Top N" ou "UGR Top N" com o sufixo do agrupamento (P20 · `algorithms/MJRPBalancedCascadeAlgorithm.js:140-185`, `algorithms/TopNAlgorithm.js:105-122,259-277`). ^playlists-generated-names
- **Tirar uma faixa.** O ✕ da faixa a tira da playlist na hora (P10 · `views/PlaylistsView.js:83-94`). ^playlists-track-removed
- **Arrastar faixas.** Arrasta-se a linha dentro da playlist ou para outra; o cursor vira "grabbing"; no toque há uma espera de 100 ms antes de começar (P12 · `components/playlists/PlaylistsDragHandler.js:31-71`). ^playlists-track-dragged
- **Reconfigurar a mistura.** O painel "Reconfigure your Music Playlist Blend" começa recolhido e mostra "(N playlists)"; ao abrir, mostra as receitas e os ingredientes, e "Regenerate Playlists" gera de novo sobre os mesmos álbuns (P7 · `components/playlists/RegeneratePanel.js:35-151`). ^playlists-reconfigure-panel
- **Nome do lote em tempo real.** O campo "Enter batch name (e.g., 'My Beatles Mix')" está sempre à vista; ao digitar, os títulos da grade viram "1. Lote - Título" na hora (P6 · `components/playlists/PlaylistsGridRenderer.js:89-104`, `components/playlists/PlaylistGrid.js:55-62`). ^playlists-batch-name-live
- **Guardando o lote.** O botão "Save to Series History" mostra "Saving…" e depois "Saved!" por dois segundos, com o aviso `Saved "<nome>" successfully!`; depois disso a tela passa a ser de edição do lote (P14 · `controllers/PlaylistsController.js:273-387`). ^playlists-save-saved
- **Falha ao guardar.** O aviso "Batch name required" ou "Save failed: …" (P14 · `controllers/PlaylistsController.js:273-387`). ^playlists-save-failed
- **Editando um lote guardado.** O título é "Edit Playlist Batch", com o selo "Editing: <lote>"; guardar apaga o lote antigo e grava o novo (P5, P14 · `views/PlaylistsView.js:266-312`). ^playlists-edit-mode
- **Lote não encontrado.** Mostra "Batch Not Found" com o link "Return to Saved Playlists"; sem lote guardado o aviso é "No playlists found for batch…" (P1, P5 · `controllers/PlaylistsController.js:26-117`). ^playlists-edit-not-found
- **Quadro de ações.** O painel "Actions & Export" só aparece com playlists e tem Save, Export to Spotify, Export to Apple Music e Download JSON (P19 · `components/playlists/PlaylistsGridRenderer.js:40-67`). ^playlists-actions-panel
- **Baixar em JSON.** O botão "Download JSON" baixa o arquivo `playlists_<lote>_<AAAA-MM-DD>.json` com as playlists e o nome do lote (P15 · `views/playlists/PlaylistsExport.js:33-58`). ^playlists-download-json

## Exportar para Spotify e Apple Music

- **Janela de envio ao Spotify.** Começa mostrando o nome (a série, de início), o modo e a contagem de playlists e faixas; depois passa por procurar as faixas (com barra de porcentagem), criar, acrescentar e terminar com sucesso ou erro (X1 · `components/SpotifyExportModal.js:14-312`). ^spotify-export-steps
- **Juntar ou separar.** "Merge All" cria uma playlist privada com todas as faixas; "Separate Playlists" cria uma por playlist, chamada "<nome> - <playlist>" (X2 · `services/SpotifyExportService.js:90-123`). ^spotify-export-merge-or-separate
- **Envio concluído.** Mostra quantas faixas foram achadas (n de m), a taxa de acerto, uma lista recolhível com até 10 faixas não achadas e o botão "Open in Spotify" — no modo de playlists separadas esse botão não leva a lugar nenhum e a janela segue dizendo que as playlists serão unidas numa só, defeito aberto em [[uat#^UAT-09]] (X3 · `components/SpotifyExportModal.js:314-363`). ^spotify-export-success
- **Envio com erro.** Mostra "Connect to Spotify first", "No playlists to export" ou "No tracks found on Spotify"; a janela só fecha em repouso, sucesso ou erro, pelo clique no fundo ou no X, e não fecha com Esc (X4 · `services/SpotifyExportService.js:30-36,83-85`). ^spotify-export-error
- **Envio ao Apple Music.** Pede a autorização do Apple Music, cria (ou reaproveita) uma pasta com o nome da série e uma playlist por item, "i. Lote - Título"; o resultado vem num aviso: "N playlist(s) exported to "<série>" folder!", com "(k tracks not found)" quando faltam faixas (P16 · `views/playlists/PlaylistsExport.js:66-225`). ^apple-export-done
- **Envio ao Apple Music sem sucesso.** Os avisos "Could not find any tracks…", "Apple Music authorization was cancelled", "Apple Music not configured…" ou "Failed to export playlists" (P16 · `views/playlists/PlaylistsExport.js:66-225`). ^apple-export-failed

## Playlists guardadas

- **Carregando.** Mostra "Scanning all series for playlists…"; o botão "Refresh" recarrega (S2 · `views/SavedPlaylistsView.js:40-54,235-266`). ^saved-loading
- **Falha ao carregar.** Mostra "Failed to load data." e o aviso "Failed to load playlists" (S2 · `views/SavedPlaylistsView.js:214-221`). ^saved-load-failed
- **Nada guardado.** Mostra "No Playlists Found" e o botão "Create Series"; hoje o botão não leva à tela inicial (o código muda o endereço por `#`, e o app navega por `pushState`), defeito ainda sem issue no `uat.md`, a abrir (S8 · `views/SavedPlaylistsView.js:242-251`). ^saved-empty
- **Busca sem resultado.** Mostra "No matches found." (S4 · `services/SavedPlaylistsFilterService.js:22-67`). ^saved-filter-empty
- **Séries, lotes e playlists.** As playlists aparecem em níveis: série, lote, playlist; as sem lote caem em "Saved Playlists"; os lotes vêm do salvo mais recentemente para o mais antigo; a barra tem busca (por série ou lote), filtro de série, filtro de lote e ordenação (Recently Updated, Name A-Z, Name Z-A) (S3, S4 · `components/playlists/SavedPlaylistsController.js:34-123`, `views/SavedPlaylistsView.js:103-131`). ^saved-hierarchy
- **Cartão do lote.** Mostra três capas em cascata, quantas playlists, faixas e álbuns diferentes, a duração em minutos e a data; começa recolhido; tem "Edit Batch" e a lixeira (S6 · `components/playlists/SavedPlaylistCard.js:25-120`). ^saved-batch-card
- **Cabeçalho da série guardada.** Mostra "ID: abcd1234…" e as ações "Add Playlists" (abre o menu de mistura), "Open Albums Series" (abre a série) e a lixeira (S5 · `components/playlists/SavedSeriesGroup.js:25-66`). ^saved-series-header
- **Linha de playlist guardada.** Clicar expande as faixas; o ícone de olho abre a janela com a lista de faixas e o total de faixas e duração (S7 · `components/playlists/SavedPlaylistRow.js:20-93`, `components/playlists/PlaylistDetailsModal.js:16-67`). ^saved-playlist-details
- **Excluir um lote.** A janela "Delete Batch?" pede confirmação; depois o aviso "Deleted batch: <nome>" ou "Failed to delete batch" (S6 · `components/playlists/SavedPlaylistActions.js:22-41`). ^saved-batch-delete
- **Excluir todas as playlists de uma série.** A janela "Delete All Playlists?" pede confirmação; depois o aviso "Deleted playlists for <série>" ou "Failed to delete playlists"; a série e seus álbuns ficam (S5 · `components/playlists/SavedPlaylistsController.js:201-253`; commit e057cfe). ^saved-series-delete-all

## Inventário

- **Cabeçalho da coleção.** "My Collection" mostra "N albums", "✓ n Owned", "n Wishlist" e "Total Owned: $x"; os números são dos itens que passam pelos filtros (I1 · `views/InventoryView.js:57-81`). ^inventory-header-totals
- **Moeda do total.** O botão USD/BRL escolhe qual soma mostrar (a dos itens em dólar ou a dos itens em real); não converte um em outro; a escolha fica guardada na chave `inventoryCurrency` (I2 · `controllers/InventoryController.js:199-257`). ^inventory-currency-toggle
- **Busca e filtros do inventário.** Busca no título, artista e notas; filtro de formato (All, CD, Vinyl, Digital) e de situação (All, Owned, Wishlist) (I3 · `views/InventoryView.js:119-151`). ^inventory-search-and-filters
- **Nenhum item no filtro.** Mostra "No albums found matching your filters." (I3 · `views/InventoryView.js:119-151`). ^inventory-filter-empty
- **Grade ou lista do inventário.** Alternam por um ícone e a escolha fica guardada na chave `mjrp_inventory_view_mode` (I4 · `views/InventoryView.js:154-160`). ^inventory-view-mode-remembered
- **Cartão do item.** Mostra capa, título, artista, formato, preço ($ ou R$, duas casas), a situação (Not Owned, ✓ Owned, ♡ Wishlist) e as ações Ver, Editar e Excluir; na lista, só Editar e Excluir. Hoje o Excluir não tem efeito: confirmar a exclusão não remove o álbum nem mostra aviso, defeito aberto em [[uat#^UAT-01]] (I5, I6 · `views/renderers/InventoryGridRenderer.js:50-149`). ^inventory-item-card
- **Mudar a situação.** Escolher a situação mostra "Moved to Collection", "Moved to Wishlist" ou "Marked as Not Owned"; se falha, "Failed to update status" (I5 · `controllers/InventoryController.js:259-278`). ^inventory-status-changed
- **Editar o item.** Uma janela muda formato (CD, Vinyl, Cassette, DVD, Blu-ray, Digital), moeda (USD ou BRL), preço e notas; os avisos são "Album updated" ou "Failed to update album" (I7 · `components/InventoryEditModal.js:18-121`). ^inventory-item-edited
- **Guardado por pessoa.** O inventário fica guardado por usuário na nuvem (com cópia no navegador); um álbum que já está não entra de novo (I10 · `repositories/InventoryRepository.js:21,52-58`). ^inventory-saved-per-user

## Conta e serviços de música

- **Entrada anônima.** Ao abrir, o app entra sozinho como convidado; se falhar, o aviso é "Authentication issue. Some features may be limited." (L1 · `services/AuthService.js:36-67`). ^auth-anonymous-start
- **Janela de entrada.** "Sign in with Google", "Sign in with Apple" e "Continue as Guest" (que só fecha a janela); a janela fecha com o clique fora e não fecha com Esc (L2 · `components/LoginModal.js:9-121`). ^auth-login-modal
- **Entrando.** Mostra "Signing in…" e, ao entrar, o aviso "Successfully signed in!"; erros são traduzidos, como "Login provider not enabled…" e "Sign-in cancelled" (L2 · `components/LoginModal.js:9-121`). ^auth-login-result
- **Conta aberta.** O menu mostra a foto (ou o ícone da Apple) e o nome; ao passar o mouse aparece "Signed in as…" e "Sign Out"; no celular, "Sign In to Sync" ou "Sign Out" (L3 · `components/navigation/AuthNav.js:21-97`). ^auth-user-menu
- **Saindo.** O aviso "Signed out successfully" ou "Sign out failed" (L3 · `components/navigation/AuthNav.js:21-97`). ^auth-sign-out
- **Botão do Spotify.** Mostra "Connect" ou, conectado, "Connected <nome> ✕"; ao desconectar o navegador pergunta "Disconnect from Spotify?" e depois o aviso "Disconnected from Spotify" (L6 · `components/SpotifyConnectButton.js:37-97`). ^spotify-connect-button
- **Voltando do Spotify.** Ao voltar da autorização, o aviso "Connected to Spotify!" ou "Failed to connect to Spotify" e a tela volta à inicial (C1 · `app.js:125-140`). ^spotify-connect-result
- **Buscando a popularidade em segundo plano.** Depois de conectar, o app busca a popularidade dos álbuns de todas as séries e avisa "Enriching N albums with Spotify data…" e, no fim, "Enriched X albums (Y failed)" (L8 · `app.js:69-92`, `services/SpotifyEnrichmentService.js`). ^spotify-background-enrichment
- **Apple Music sem configuração.** O servidor responde 503 "MusicKit not configured" quando não há credencial (L7 · `server/routes/musickit.js:25-55`). ^apple-music-not-configured

## Mensagens e navegação do app

- **Avisos na tela.** Os avisos de sucesso, erro, atenção e informação aparecem no canto superior direito, entram deslizando, somem em 4 segundos e fecham no ✕ (T7 · `components/Toast.js:36-102`). ^app-toast
- **Caixas do navegador.** Em alguns casos o app ainda usa a caixa nativa do navegador: alerta (artista não achado, Spotify sem identificação) e confirmação (sem notas, desconectar do Spotify) (T8 · `components/home/SearchController.js:72,77`, `controllers/PlaylistsController.js:245`). ^app-native-dialogs
- **Janelas de confirmação.** As confirmações do app (excluir série, álbum, lote ou item) fecham com Esc; a de perigo tem destaque (M4 · `services/DialogService.js:25-60`). ^app-confirm-dialogs
- **Endereços antigos e desconhecidos.** `/` e `/index-v2.html` abrem `/home`; `/album-series` e `/series` abrem `/albums`; um endereço desconhecido abre `/home` (RT1 · `app.js:97-101,146-162`). ^app-route-redirects
- **Erro ao desenhar uma tela.** Mostra "View Error" com a mensagem e o botão "Go Back" (RT2 · `router.js:161-169`). ^app-view-error
- **Menu principal.** O topo tem Home, "Music Series" (By Album, By Artist, By Genre, By Track e Playlists), The Blending Menu, Playlists e Inventory; By Artist, By Genre e By Track aparecem como "Soon" e o clique não navega (T1, T2 · `components/TopNav.js:53-91`, `components/navigation/SeriesDropdown.js:21-28`). ^app-main-menu
- **Menu em gaveta.** Abaixo de 768 px o menu vira um botão ☰ que abre uma gaveta; ela fecha ao clicar num link, no fundo, no ✕ ou ao ampliar a janela, e trava a rolagem da página (T3 · `components/TopNav.js:92-147,258-308`). ^app-mobile-drawer
- **Tela "em breve".** `/artists`, `/genres` e `/tracks` mostram "Coming Soon / We're working hard…" e o botão "Back to Albums" (CS1 · `views/ComingSoonView.js:19-66`). ^app-coming-soon
- **Rodapé.** Mostra Home, Albums e Playlists, "Powered by MJRP Software" e "Last updated:" com a hora em que a página foi carregada (T4 · `components/Footer.js:9-37`). ^app-footer
- **Limpar o cache.** O botão "Clear Cache" do rodapé apaga tudo que o app guardou no navegador (inclusive a conexão com o Spotify e as preferências), mostra "Cache Cleared!" e recarrega a página em um segundo (T5 · `components/Footer.js:18-19,42-59`). ^app-clear-cache

## Guardado no navegador

- **Preferências e conexão.** O navegador guarda a escolha de grade ou lista (`albumsViewMode`, `mjrp_inventory_view_mode`), a moeda do inventário (`inventoryCurrency`) e a conexão com o Spotify (chaves `spotify_*`) (D3 · `services/infra/StorageService.js:6`). ^local-preferences-and-tokens
- **Álbuns guardados por sete dias.** Os dados de cada álbum ficam em memória e no navegador (IndexedDB) por sete dias; um álbum que não casa com a busca é recusado (D2 · `cache/CacheManager.js`, `cache/albumCache.js:13-84`). ^local-album-cache
