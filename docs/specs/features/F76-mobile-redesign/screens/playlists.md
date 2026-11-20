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
