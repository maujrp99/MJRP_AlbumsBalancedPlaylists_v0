# F76 · TASK-04 · Playlists e Playlists gravadas no celular

REQ-01, REQ-02, REQ-08 (e REQ-12: o computador não muda). Achados da crítica: 4, 5, 6, 22 e a issue UAT-216. Ramo `feat/f76-mobile-playlists`. Prova: `reports/evidence/F76/playlists/`.

Tudo o que segue é **decidido pelo agente — revisável**, salvo onde diz a fonte.

## `/playlists` — as playlists recém-geradas (ou um lote em edição)

### O que a tela é no celular (de cima para baixo)

| Bloco | O que mostra | Toque |
|---|---|---|
| Barra do topo (base) | «New Playlists» | menu |
| Trilha `Home › Blend › Playlists` (em edição: `… › Saved Playlists › Edit Batch`) | alvos de 44 px (base) | volta |
| Selo «Editing: nome» | só em edição | — |
| Nome do lote | campo de 16 px, 48 px de alto, largura toda | digitar (o redesenho devolve o campo e o cursor: `keepField`, F73) |
| «Reconfigure your Music Playlist Blend (n playlists)» | linha fechada de 56 px | abre o painel da receita, com «Regenerate Playlists» dentro |
| Undo · Redo | dois botões com nome, 44 px, desligados quando não há passo | desfazer / refazer (os mesmos `data-action` do computador) |
| **Fichas** (presas logo abaixo da barra do topo ao rolar) | uma por playlist: «n · Nome» e «14 tracks · 58 min»; a aberta em claro | abre aquela playlist |
| Cabeçalho da playlist aberta | título (20 px, Syne; digita-se por cima como no computador), «Playlist n of the set · n tracks · duração», «⋯» de 44 px | «⋯» abre a folha da playlist |
| Faixas | linha de 64 px: posição (é a alça de arrastar, 44 px), título (16 px, até 2 linhas), artista · álbum (14 px), duração (14 px, algarismos tabulares), «⋯» de 44 px | «⋯» abre a folha da faixa; arrastar pela posição |
| **Barra de ação** (`.phone-action-bar`) | «Export» (contorno) e «Save» (laranja, a ação principal) | Export abre a folha de exportar; Save grava com o nome do campo |
| Aviso «Removed "…" · Undo» | acima da barra de ação, 6 s | Undo desfaz |

### O que abre como folha (`openSheet`, de baixo)

- **Faixa** («⋯»): Move up · Move down · Move to the top · Move to the end (desligados onde não cabem); «Move to another playlist» com uma linha por playlist (a faixa vai para o fim dela); «Remove from this playlist» por último, em vermelho. Mover chama `PlaylistsService.moveTrack`, o mesmo do arrastar; remover chama `controller.deleteTrack` e mostra o aviso com Desfazer (`controller.undo()`).
- **Playlist** («⋯» do cabeçalho): Rename (põe o cursor no título, texto escolhido) · Reconfigure and regenerate (abre o painel e o traz à vista) · «Delete this playlist» em vermelho, que **pergunta antes** (`dialogService.confirm`, folha de baixo) e chama `controller.deletePlaylist`.
- **Export**: Export to Spotify (fecha a folha e abre a janela de sempre, `showSpotifyExportModal`) · Export to Apple Music (`handleExportToAppleMusic({ btn })`: a folha fica aberta e a linha mostra o progresso, como o botão do computador) · Download JSON (`handleExportJson`). Nenhuma lógica de exportação mudou.

### Estados

- Sem playlists e sem edição: o estado vazio de sempre (leva ao Blend); sem fichas e sem barra de ação.
- Em edição de um lote não achado: o aviso de sempre.
- Gerando: a camada «Generating…» de sempre.
- Gravando: «Saving…» desligado na barra de ação.
- Playlist vazia: «No tracks in this playlist».

### Decisões, e por quê

1. **Uma playlist por vez com fichas no topo, não acordeão.** Com 4 a 8 playlists de 10 a 30 faixas, um acordeão aberto empurra as outras playlists para longe e obriga a rolar muito para fechar (NN/g, acordeões no celular, citado no benchmark § 4). As fichas dizem o resumo de cada playlist fechada (nome, faixas, duração — o que o REQ-08 pede de uma playlist fechada) e trocam em um toque; a aberta rola com a página, sem caixa interna. A conferência do benchmark nota que não há fonte **a favor** das fichas: é desenho próprio.
2. **A ficha aberta é clara (branco sobre escuro), não laranja.** O laranja fica só para «Save», a ação principal (correção C1 da conferência: uma superfície laranja por tela).
3. **Arrastar só pela posição no celular** (`PlaylistsDragHandler`: `.phone-track__pos`; no computador continua a linha inteira). Assim rolar a página com o dedo nunca pega uma faixa. Arrastar entre playlists não existe no celular (só uma está na tela): «Move to another playlist» faz isso por nome.
4. **Remover sem perguntar, com Desfazer** (NN/g, contextual swipe: em ação repetitiva, Desfazer à vista em vez de confirmação, benchmark § 4). **Apagar a playlist inteira pergunta** (é rara e leva tudo).
5. **Undo/Redo em linha própria, com nome**, acima das fichas: são do conjunto, não de uma playlist. A barra de ação fica com dois botões (regra do kit).
6. **O título grande «Playlist Management» sai da vista** (fica para leitor de tela): a barra do topo já diz o nome da tela; ganha-se ~60 px para as faixas.
7. **Linhas, contagens e botões na fonte do sistema** (SF no iPhone); Syne só nos títulos (benchmark § 9.2: Syne perde leitura pequena).
8. **Avisos nesta tela aparecem abaixo das fichas**, nunca sobre a barra do topo, as fichas, a barra de ação ou a de baixo; o Desfazer fica acima da barra de ação.
9. A janela do Spotify por dentro: campo a 16 px, fechar de 44 px, cada opção de modo numa linha de 44 px, nota do modo com mais contraste.

## `/saved-playlists` — as playlists gravadas

### O que a tela é no celular

| Bloco | O que mostra | Toque |
|---|---|---|
| Busca, «All Albums Series», «All Playlist Series», ordem, Refresh | a barra de filtros compartilhada (`FilterToolbar`), campos a 16 px e 44 px pela base | filtrar |
| **Série** (cartão) | nome da série inteiro (quebra a linha; nunca o ID cru), linha «▸ n batches · n playlists» de 44 px | abre/fecha os lotes da série (**fechada por padrão**) |
| Série aberta | «Add Playlists» · «Open Albums Series» · lixeira de 44 px com nome («Delete all playlists in …»), todos discretos | os de sempre; apagar tudo pergunta (como antes) |
| **Lote** | capas em cascata, **nome inteiro** (quebra a linha), fatos (playlists, faixas, álbuns, duração, data); em linha própria «Edit Batch» e «Delete» (com nome, 44 px) | o cabeçalho abre as playlists do lote; Edit leva à edição; Delete pergunta (como antes) |
| Playlist do lote | nome, «n tracks • n m», olho de 44 px com nome («View the tracks of …») | a linha abre as faixas; o olho abre a janela da playlist |

### Decisões

1. **Séries fechadas por padrão, com o resumo na linha que abre.** A página de 12 séries vai de 10.756 px (antes, no mesmo arnês) a 1.793 px; a crítica mediu 18.017 px com os dados reais. Quem abre uma série a encontra aberta depois de uma atualização da lista (a tela lembra). Mudar entre celular e computador redesenha as séries (o computador as mostra sempre abertas, como antes).
2. **O ID da série some no celular** (achado 4); continua no computador, que não muda.
3. **Ações da série só aparecem com a série aberta**, todas sem laranja: a lista não tem uma ação principal, e doze botões laranja repetidos gritavam.
4. **Exportar a partir das gravadas:** hoje a tela não tem exportação própria; exporta-se abrindo o lote («Edit Batch») e usando Export na barra de ação. Não criei um caminho novo (não muda comportamento).

## Medido (arnês com os componentes reais, Chrome sem cabeça, 393x852 com toque)

`reports/evidence/F76/playlists/` (antes = ramo `feat/f76-mobile-redesign`, depois = este ramo, o mesmo arnês e os mesmos dados):

| Caso | largura | altura | alvos < 44 | caixas que rolam por dentro | 1ª faixa (y) |
|---|---|---|---|---|---|
| Geradas, antes | 393 | 3.602 | 111 | 6 | 1.049 |
| Geradas, depois | 393 | 1.562 | 0 | 0 | 496 |
| Gravadas, antes | 393 (conteúdo cortado pela rede da base) | 10.756 | 0 | 0 | — |
| Gravadas, depois | 393 | 1.793 | 0 | 0 | — |
| Gravadas com série e lote abertos, depois | 393 | 2.484 | 0 | 0 | — |

Texto < 12 px: 0; campo < 16 px: 0, em todos os casos do celular. Nas folhas: 0 alvos pequenos (os rádios do Spotify respondem pela linha de 44 px do rótulo). O «×» dos avisos tem 32 px (regra da base, `mobile.css` § 9).

Computador (1280x800): as capturas da janela e da página inteira das quatro situações são **idênticas** pixel a pixel antes e depois, salvo 2 px de antisserrilhado (diferença de 1/255) no canto de um cartão na página inteira das gravadas; medidas de layout iguais.

## O que não verifiquei

- iPhone de verdade, Safari: a altura visível real é menor (barras do Safari); arrastar pela alça no toque real; o teclado sobre o campo do nome.
- Exportar de fato ao Spotify e à Apple Music (sem conta no arnês): só que a folha chama as mesmas funções de antes.
- Telas com login e dados reais (o arnês usa os componentes reais com dados de exemplo).
- A barra de filtros das gravadas (`FilterToolbar`, compartilhada com Albums) continua empilhando quatro controles antes da primeira série (~ 600 px): não é desta tela mudá-la.


## Polimento pós-crítica (2026-11-20, ramo `feat/f76-mobile-polish-home-playlists`)

Fecha achados de `reports/audits/2026-11-20-mjrpalbumblender-v0-mobile-ux-recheck.md`. Tudo **decidido pelo agente — revisável**. Prova: `reports/evidence/F76/playlists/polish/` (depois) contra `before-polish/` (o mesmo arnês sobre `main`), agora também a **393x660** (o que o Safari deixa).

### `/playlists` — N3 (a 393x660 só 53 px de faixas)

| Antes | Agora |
|---|---|
| Trilha `Home › Blend › Playlists` | some no celular: a barra de baixo já leva a Home, Blend e Playlists |
| Cartão «Batch Name» de ~120 px | uma linha: rótulo «BATCH NAME» (12 px), campo de 44 px e 16 px (o mesmo `#batchNameInput`: grava e guarda o cursor como antes) e, ao lado, **Undo e Redo como ícones de 44 px** com nome (`aria-label`) |
| Linha fechada «Reconfigure your Music Playlist Blend» de 56 px | fora da página enquanto fechada; abre pelo «⋯» da playlist («Reconfigure and regenerate»), como já abria; aberta, aparece com seu cabeçalho (que fecha) e fica sob a barra do topo ao rolar até ela; as receitas dentro dela numa coluna, como no Blend |
| «Playlist 1 of the set · 14 tracks · 1 h 31 min» sob o título | só para leitor de tela: a ficha aberta logo acima diz o mesmo |

Medido: a primeira faixa sobe de y=496 para **y=270**; faixas inteiras acima da barra de ação: **0 → 4 a 393x660**, 3 → 6 a 393x852.

### `/playlists` — N20 e N15

- Mover pela folha («Move up/down/to the top/to the end», «Move to another playlist») mostra o aviso de baixo «Moved "…" to number 2 · Undo» (ou «to playlist 3»), o mesmo do remover, e acende a linha onde a faixa caiu por 1,2 s (sem transição com menos movimento). Desfazer chama `controller.undo()`, como antes.
- Os «⋯» dizem «Actions for …», o verbo de Albums e Inventário (eram «Options for …»).

### N4 — fonte (decidido)

No celular, o **título** de uma linha em Syne; o resto na fonte de texto (SF no iPhone). Faixa: Syne 15 px, 600, até duas linhas (as linhas da janela de ranking usam Syne 16/600 com a linha inteira; aqui a linha divide espaço com posição, duração e «⋯», então 15). Fichas: nome em Syne 14. Saved: série 17/700, lote 16/600, playlist 15/500, todos Syne; contagens, datas e botões na fonte de texto.

### `/saved-playlists` — N5 (a tela mais fraca)

A anatomia de Albums (`SeriesPhoneSheets.js`, `AlbumPhoneCard.js`, `albums.css`):

| Bloco | O que mostra | Toque |
|---|---|---|
| Busca + «Filters (n)» | uma linha; o resto (ordem, série de álbuns, lote, ler de novo) numa folha, a mesma de Albums (`FilterToolbar` com `filtersInSheet`, `FilterSheet.js`); fichas «Album series: X ✕» quando há filtro ligado | a folha fecha com «Show series» |
| **Série** (linha, sem cartão; fio entre séries) | capas em cascata, nome em Syne (até 2 linhas), «n batches · n playlists», chevron, «⋯» de 44 px | a linha abre/fecha os lotes (fechada por padrão; lembra quem estava aberta); «⋯» abre a folha da série |
| **Lote** (linha recuada sob a série) | nome **legível** (até 2 linhas), «n playlists · n tracks · 5 h 12 min · 20 Nov 2026», chevron, «⋯» | a linha abre as playlists; «⋯» abre a folha do lote |
| **Playlist** (linha de 52 px, com fio à esquerda) | nome, «n tracks · duração», chevron | abre a janela da playlist com as faixas (`onOpenPlaylist`, a mesma do olho do computador) |

Folhas (classe e linha das folhas de Albums: ícone 22, rótulo 16, 52 px, destrutivo por último, separado e em vermelho):
- **Série**: Add playlists · Open the album series · *Delete all playlists of this series* (pergunta, `dialogService.confirm`, como antes).
- **Lote**: o nome salvo inteiro quando o mostrado foi reescrito («Saved as "…"»), senão os fatos; Edit batch · *Delete batch* (pergunta, como antes).

Nome legível (`components/playlists/batchNames.js`): um nome digitado aparece como foi digitado. Um nome da máquina perde o carimbo de data e hora do fim (a linha já diz a data) e tem os códigos escritos por extenso: «SPFY» → Spotify, «BEA» → BestEverAlbums, «Bal.Intv.» → balanced; o padrão do app «TheAlbumBlender Playlist 2026-11-20 23:21» vira «Saved 20 Nov 2026, 23:21». O nome real continua sendo o usado em Edit e Delete, e aparece inteiro na folha. Uma data só, «20 Nov 2026», sem quebrar de linha. Plural certo («1 playlist»).

Medido a 393x660: a primeira série começa em ~y=120 (era 370 na conta real); sete séries na primeira tela; nada vermelho na tela, só nas folhas. 0 rolagem de lado, 0 texto < 12, 0 campo < 16, 0 alvo < 44 em `saved`, `saved-open`, `saved-filters`, `saved-series-sheet`, `saved-batch-sheet`, `saved-delete-confirm`, a 393x852 e 393x660.

Mudança mínima fora da lista: `components/ui/FilterSheet.js` aceita `props.sheetText = { reload, done }` (aqui «Read the saved playlists again» e «Show series»; Albums segue com seus textos). O botão «Filters» e as fichas leem as variáveis `--albums-*`, que esta tela também define. O nome dos filtros na folha vem de `title` («Album series», «Batch»), que o computador não usa.

Decisões: (1) a cascata de capas fica na série, não em cada lote — as capas são da série de álbuns, e repetidas em cada lote eram ruído; (2) a playlist de um lote abre a janela com as faixas em vez de um terceiro nível de abrir-e-fechar dentro da página; (3) «Export» não foi criado aqui (a tela não exporta hoje; exporta-se por Edit batch).

### Computador

1280x800, janela e página inteira, `generated`, `saved`, `saved-open`: **0 pixel diferente** antes e depois.

### O que não verifiquei

- iPhone e Safari de verdade (o teclado sobre o campo do nome do lote, a barra do Safari encolhendo).
- Nomes de lote reais da conta do dono: as regras do nome legível vêm dos dois exemplos da crítica e do código que gera nomes; um nome de máquina de outro formato aparece como está.
- Escolher um filtro dentro da folha: só a abri e a fechei no arnês (os controles chamam os mesmos `onChange` do computador, cobertos pelos testes do `FilterToolbar`).
