---
type: ux-audit
subject: "Album Blender V0 no celular: todas as telas (Home, Albums, Blend, Playlists, Playlists salvas, Inventário, barra e gaveta) a 375x812, 390x844 e 812x375"
project: MJRP_AlbumsBalancedPlaylists_v0
moment: brownfield
judged: "2026-11-20 01:00"
who_judged: separate-agent
verdict: ordered-cut
p0: 3
p1: 12
p2: 9
human_decisions: 2
status: open
---

# UX audit — Album Blender V0 no celular · 2026-11-20 01:00

> Momento: Brownfield (o produto existe e nunca teve discovery no celular) · Gênero: fluxo/formulário (Home, Blend) e dashboard/dados (Albums, Inventário, Playlists)
> Objeto: app rodando em `http://127.0.0.1:5010`, aba própria do painel de navegador embutido, perfil já autenticado · Viewports: 375x812 (principal), 390x844, 812x375 (paisagem) · Cânone: `docs/wiki/harness/design-canon.md` (lidos HI, DE, CP, IN, AH, IA)
> Quem julgou: agente separado (recebeu a skill, o pedido e os documentos do produto; não construiu as telas)
> Pedido de origem: F76 (`docs/specs/features/F76-mobile-redesign/`), requisito S-58, issue UAT-223. O MJRP disse: «a versao responsiva mobile é bem ruim. penso que teremos que ter um redesign pra ser mais funcional na versao mobile.»

## Veredito

**Recorte Brownfield: o celular não é um desktop que falhou em detalhes; são dois problemas misturados.** (1) Defeitos de layout responsivo, que se consertam em horas: a página rola de lado em duas telas, textos e ícones abaixo do mínimo, alvos de toque de 24 a 40 px, campos que dão zoom no iPhone, uma janela de álbum cujo título vira uma letra. (2) Padrões de desktop que não traduzem e pedem desenho novo para o celular: a lista de séries e álbuns de 39 mil px, a barra de filtros de seis controles empilhados, a visão em lista (205 mil px de altura), o inventário de 211 cartões em coluna única (95 mil px), as listas de faixas dentro de caixas com rolagem própria, as ações que só têm título (dica ao pairar) e o arrastar para ordenar. A tela Blend, a janela de ranking (já em tela cheia) e a janela de edição do inventário mostram que o app sabe fazer o certo no celular: esse é o padrão a estender.

Ordem do recorte: primeiro a base compartilhada (alvos, tipo, margens, folha de baixo, barra de ação), depois Albums (inclui a janela de álbum, que o Inventário reaproveita), depois Playlists e Playlists salvas, depois Home, depois Inventário; Blend só precisa de acertos.

## Como foi medido

Em cada tela, por script de leitura (`javascript_tool`): `scrollWidth` contra a largura útil (`documentElement.clientWidth`; nota: no painel, `innerWidth` veio 602 com a emulação de 375, então usei `clientWidth`, que bate com a consulta de mídia `max-width:767px`), elementos que estouram, alvos menores que 44x44 px, textos menores que 12 px, `font-size` de campos menor que 16 px, elementos `sticky`/`fixed`, caixas com rolagem própria, altura total da página. Contraste: cor computada do texto contra o primeiro fundo opaco do ancestral (aproximação; onde há degradê o valor é indicativo). Capturas de tela em meia escala, só na sessão (não entraram em `reports/evidence/`).

Ações feitas no app (todas locais, nenhuma gravou na conta): uma busca de catálogo na Home («Radiohead»); um álbum posto no conjunto escolhido da Home (some ao recarregar); em `/blend`, uma série e uma receita escolhidas (não apertei «Blend»); alternei Albums para a visão em lista e voltei para grade; abri as janelas de álbum, de ranking e de edição do inventário e fechei com Close, Back e Cancel (sem Save); abri a gaveta e o menu da conta (sem Sign Out). Não apertei «Add the albums of my series», «Update ratings», Save, Delete, export nem Clear Cache.

## Achados

Severidade: P0 bloqueia a tarefa da tela no celular; P1 a torna difícil; P2 é acabamento. «Tipo»: **L** = defeito do layout responsivo (conserto); **D** = padrão de desktop que precisa de desenho próprio de celular. Âncoras são arquivos em `public/js/` (css em `public/css/`).

| # | ID | Sev | Tipo | Âncora | Evidência (medida) | Check de aceite (S/N) | Esforço/Impacto | Antes → Depois | Skill dona |
|---|---|---|---|---|---|---|---|---|---|
| 1 | CP-06, AH-11 | P0 | D | `components/ui/FilterToolbar.js` (botão `#viewModeList`), `views/albums/AlbumsScopedRenderer.js` | `/albums`, visão em lista a 375 px: a página passa a 205.896 px de altura (grade: 39.160 px) e a 602 px de largura; o título do álbum fica numa coluna estreita («In the / Court / of the…»), a tabela de faixas é cortada, selos amontoados. O botão que leva a essa visão (38x38) está no topo da tela | A visão em lista, aberta a 375 px, cabe na largura sem rolar de lado e mostra cada álbum em até 1 tela? S/N | alto / alto | tabela de desktop → linha compacta (capa 56 px, título, artista, selos), ou esconder o botão abaixo de 768 px até haver desenho | mjrp-designing-ui |
| 2 | AH-11, CP-01 | P0 | L | `components/series/SeriesGridRenderer.js` (`.series-group-header`, `div.series-actions`) | `/albums` todas as séries: `scrollWidth` 602 contra 375 (a 390: 602 contra 390). 14 de 40 cabeçalhos de série estouram a largura (o maior, «Alternative R&B/Psychedelic/Av…», 553 px); os botões Edit Series e Delete Series ficam em x=512..602, fora da tela. A página inteira rola de lado | `scrollWidth` é igual a `clientWidth` em `/albums` a 375 e 390 px e os dois botões de série ficam visíveis em todo cabeçalho? S/N | baixo / alto | nome numa linha que empurra os botões → nome com quebra de linha (`min-w-0`, `break-words`) e botões em linha própria | mjrp-designing-ui |
| 3 | CP-02, AH-11, IN-03, IN-01 | P0 | D | `components/ViewAlbumModal.js`, `components/ranking/TracksTabs.js`, `css/modals.css` | Janela de álbum a 375x812 (Albums e Inventário): o título «Brothers In Arms» mede 21 px de largura e aparece como «B.» (no inventário, «Group Therapy» vira «G»); a área rolável tem 286 px (Albums) e 220 px (Inventário) de 812, isto é, uma a duas faixas visíveis; as abas ORIGINAL, BESTEVERALBUMS e SPOTIFY se grudam («BESTEVERALBUMSSPOTIFY», 73 px de altura cada); o corpo da página atrás continua rolando (`overflow` visível). Em paisagem (812x375) a área rolável cai a 48 px: a lista de faixas é inalcançável | A janela de álbum mostra o título inteiro e pelo menos 5 faixas sem rolar a 375x812, e pelo menos 2 a 812x375? S/N | médio / alto | caixa de 280 px com cabeçalho que come 300 px → folha de tela cheia como a janela de ranking, cabeçalho compacto que encolhe ao rolar, abas em controle segmentado com rótulos curtos | mjrp-designing-ui |
| 4 | IN-03, AH-11 | P1 | L | `views/SavedPlaylistsView.js`, `components/playlists/SavedPlaylistActions.js` | `/saved-playlists`: `scrollWidth` 465 contra 375 (a 390: 465); o nome de cada lote (`h3`, 162..502 px) sai pela direita, escondendo o nome e a contagem de faixas; 82 títulos e 18.017 px de altura, sem paginação; o ID cru da série («ID: Jp93LzaU…») aparece para o usuário; «Delete entire batch» tem 48x32 | A página não rola de lado e o nome do lote aparece completo (ou com reticências e toque para abrir)? S/N | baixo / alto | lote cortado → nome em até 2 linhas, ações em linha própria, ID escondido | mjrp-designing-ui |
| 5 | IN-03, IN-05 | P1 | L | `components/playlists/PlaylistGrid.js`, `views/PlaylistsView.js` | `/playlists` (6 playlists): 63 botões «Remove Track» de 24x24 (remover faixa com um toque) e «Delete this playlist» de 24x24; o X de remover fica em cima do tempo da faixa (X em 296,182 e tempo em 287..324 × 175..191: sobrepostos); 78 alvos abaixo de 44 px; 187 textos de 10 px (posição, estrela, #) | Todo botão de remover tem alvo ≥ 44x44 e não encosta no texto ao lado? S/N | baixo / alto | X minúsculo sobre o tempo → alvo de 44 px com respiro, ou gesto de deslizar com desfazer | mjrp-designing-ui |
| 6 | DE-01, DE-07, IN-01 | P1 | D | `views/PlaylistsView.js`, `components/playlists/PlaylistGrid.js` | `/playlists`: cada playlist tem uma caixa de faixas com rolagem própria de 260 px (seis caixas, conteúdo de 562 a 1.186 px cada) dentro de uma página que também rola: rolagem dentro de rolagem; só 3 faixas de 10 a 15 visíveis por vez; sem resumo por playlist antes de abrir | Cada playlist mostra nome, nº de faixas e duração fechada, e a lista inteira rola com a página (sem caixa interna)? S/N | médio / alto | seis caixas com rolagem interna → acordeão com resumo; abrir expande a lista na página (DE-07, IN-01) | mjrp-designing-ui |
| 7 | IN-03, IN-05, IN-07, AH-01 | P1 | D | `components/ui/AlbumCardRenderer.js` (`data-action="rank-album"` e irmãs) | Cartão de álbum em `/albums` (131x323, 2 colunas): quatro ações (Rank, Add, Del, Refetch) só com ícone de 16 px e `title` (dica ao pairar, inexistente no toque); cada botão 25x28 px, lado a lado; «Add» (põe no inventário) encostado em «Del»; selos «BESTEVERALBUMS» e «MY RANKING» cortados e a 9 px; título («In the Court of the…») e artista («King Cri…») truncados; ano a 10 px. 367 textos abaixo de 12 px na tela | As ações do álbum têm rótulo visível ou ficam atrás de um «⋯» de 44x44, e título e artista aparecem completos em até 2 linhas? S/N | médio / alto | 4 ícones de 25x28 sem nome → toque no cartão abre a folha do álbum com as ações rotuladas | mjrp-designing-ui |
| 8 | DE-04, DE-07, IN-01, CP-06 | P1 | D | `components/ui/FilterToolbar.js`, `components/ui/Pager.js` | `/albums` a 375x812: antes do primeiro álbum há ~640 px (79% da altura da tela): busca, 4 filtros (série, artista, ano, fonte) empilhados, ordenação, Refresh, alternador grade/lista, depois o bloco do pager (tamanho por página, Pages/Scroll, Previous/1/2/Next); o pager se repete no fim. Nada fica fixo; sem resumo dos filtros ativos. Pager: botões de 34 px, Pages e Scroll de 24 px, seletor de tamanho de 29 px | A barra deixa o primeiro álbum aparecer acima da dobra e mostra quantos filtros estão ativos? S/N | médio / alto | 7 controles empilhados → busca + botão «Filtros (n)» que abre folha de baixo com os 4 filtros e a ordenação; paginação enxuta | mjrp-designing-ui |
| 9 | CP-06, IN-04, CP-03 | P1 | D | `views/HomeView.js`, `controllers/HomeController.js` | `/home` com a discografia escaneada: o conjunto escolhido (seção 03) fica 900 px acima da grade onde se toca; tocar num álbum não dá resposta visível na tela (sem aviso; o contador «(1 Albums)» está fora da vista); o botão «Initialize Load Sequence» (a ação que conclui a tarefa) está no fim da página, em y=2093 de 2362, estático; o ✕ de remover da linha é 36x36; reordenar só arrastando | Ao tocar num álbum, a pessoa vê, sem rolar, quantos escolheu, e o botão de criar fica sempre à vista? S/N | médio / alto | seção 03 longe da grade + botão no fim → barra fixa de baixo («n álbuns · Criar série») que abre o conjunto numa folha | mjrp-designing-ui |
| 10 | IN-03, CP-06 | P1 | L | `components/TopNav.js` | Barra do topo: ☰ e conta de 40x40 (menos que 44); declarada `sticky`, mas ao rolar a barra sai da tela (topo medido −884 em `/blend` rolada), então em páginas de 20 a 95 mil px não há navegação nem volta ao topo; em `/playlists` o aviso «Your unsaved playlists were restored» cobre a barra; em paisagem a barra ocupa 74 de 375 px (20%) e ainda é só ☰ | A barra fica visível ao rolar para cima e o aviso aparece abaixo dela? S/N | baixo / médio | barra que some → barra baixa fixa que reaparece ao rolar para cima, alvos de 44 px | mjrp-designing-ui |
| 11 | AH-01, AH-11 | P1 | L | `css/tech-theme.css`, `css/index.css` (tokens de cinza) | Texto abaixo de 12 px em todas as telas (Albums 367 trechos: selos a 9 px, anos a 10 px; Playlists 187; Home 9; Inventário 23: «CD», «cassette» a 10 px; Blend: passos Mix/Recipe/Ingredients a 10 px). Contraste medido (aproximado): 2,8:1 no estado vazio da Home «Search for an artist to begin scanning.» (16 px) e no alternador «Visual» (10 px); 4,3:1 nos rótulos «YOUR ALBUMS SERIES NAME» e «Filtering by artist…» | Nenhum texto abaixo de 12 px e todo texto ≥ 4,5:1 (3:1 se grande)? S/N | baixo / médio | cinza 500/600 e 9–10 px → 12 px mínimo, cinza mais claro | mjrp-defining-design-systems |
| 12 | CP-06 | P1 | L | `views/HomeView.js`, `components/ui/FilterToolbar.js`, `views/InventoryView.js`, `views/SavedPlaylistsView.js` | Campos com fonte abaixo de 16 px, que dão zoom ao focar no iOS: busca 14 px, `select` de filtro e ordenação 14 e 12 px (Albums, Playlists salvas, Inventário), seletor de status de cada cartão 12 px (211 deles), caixa de texto da Home 12 px, campos da janela de edição 14 px | Todo campo e `select` tem `font-size` ≥ 16 px no celular? S/N | baixo / médio | 12–14 px → 16 px | mjrp-designing-ui |
| 13 | DE-07, IN-03, IN-01 | P1 | D | `views/InventoryView.js`, `views/renderers/InventoryGridRenderer.js` | `/inventory`: 211 cartões em coluna única, ~390 a 450 px cada, 95.809 px de altura (118 telas); sem paginação nem rolagem incremental (o pager da F72 existe só em Albums); busca no topo, não fixa; no cartão, o seletor de status a 12 px (128x26), Edit e Delete de 28x28 lado a lado, View de 12x12. O resumo (157 owned, 35 not owned, 19 wishlist) é bom e fica no topo | Chegar ao 150º álbum leva ≤ 3 gestos, e Edit e Delete têm ≥ 44 px e ≥ 8 px de distância? S/N | alto / alto | coluna de capas grandes → linhas compactas (capa 56 px, título, status, ⋯) com a paginação da F72 e busca fixa | mjrp-designing-ui |
| 14 | IN-03, AH-04, IN-16 | P1 | D | `components/ranking/UserRankModal.js` | Janela de ranking (já em tela cheia, bom): o título da faixa é cortado a 2–3 letras («Th…», «Tak…», «Kni…») porque os selos de posição (#4 BEA, ●11 SPFY) e o tempo comem a linha; Back 36x24, Reset 67x36, Save 82x36; reordenar só pelo ícone de arrastar (sem subir/descer por botão). Arrastar por toque não foi testado | Cada faixa mostra o título em ≥ 15 caracteres e existe uma forma de mover sem arrastar? S/N | médio / médio | linha com 4 colunas → título em linha própria, selos abaixo, botões subir/descer | mjrp-designing-ui |
| 15 | IN-01, DE-01, CP-06 | P1 | D | `components/blend/BlendSeriesSelector.js` | `/blend`: a lista de séries é uma caixa com rolagem própria de 256 px e 4.680 px de conteúdo (49 séries, 3 visíveis por vez), dentro da página que rola: armadilha de rolagem; descrições das receitas cortadas; o passo seguinte trava até escolher. O fluxo de 4 passos em si (Mix, Recipe, Ingredients, Blend it!) é linear e legível: 3,3 telas, sem estouro | A lista de séries rola com a página (ou tem busca) e as 49 séries são alcançáveis sem rolagem interna? S/N | baixo / médio | caixa de 256 px → lista na página com busca, ou folha de baixo | mjrp-designing-ui |
| 16 | CP-04, CP-06 | P2 | L | `views/HomeView.js` | `/home`: campos e rótulos ficam encostados nas bordas da tela (nome da série e cabeçalhos «01 // SERIES CONFIGURATION» em x=0, campo de 0 a 375); as demais telas têm 17 px de margem | A Home tem margem lateral ≥ 16 px como as outras telas? S/N | baixo / médio | sem margem → 16 px | mjrp-designing-ui |
| 17 | IN-03, IN-01 | P2 | L | `views/HomeView.js` (`#btnFilterAlbums` e irmãos, `#btnModeVisual`, `#btnModeBulk`) | Filtros de tipo na Home: rolam de lado (495 px em caixa de 343 px) e «Compendiums» e «?» ficam cortados, sem indício de que há mais; botões de 28–30 px de altura; contagens a 10 px; «Visual» e «Bulk Paste» de 23 px de altura e texto de 10 px | Os 6 filtros de tipo cabem em 2 linhas sem rolar de lado, com alvos de 44 px? S/N | baixo / médio | uma linha que rola escondida → duas linhas ou alternância | mjrp-designing-ui |
| 18 | HI-03, IA-02 | P2 | L | `components/TopNav.js` | O botão da conta no topo mostra o logotipo da Apple com o usuário conectado (a identidade da conta só aparece dentro do menu); na gaveta, «Playlists» aparece duas vezes (dentro de Music Series e no nível principal) e «By Genre» perde o ícone que By Album, By Artist e By Track têm. A gaveta em si (alvos de 48 px, abre e fecha, trava a rolagem) funciona | Existe um único rótulo «Playlists» e o botão da conta mostra a pessoa, não o serviço? S/N | baixo / baixo | duplicado e ícone ambíguo → um rótulo, avatar | mjrp-designing-ui |
| 19 | HI-02, IN-01 | P2 | L | `views/SeriesView.js`, `views/albums/AlbumsScopedRenderer.js` | `/albums?seriesId=…` (aberto por endereço): o título continua «All Albums Series» e o filtro «All Series»; a tela não diz de qual série são os 3 álbuns e não há cabeçalho com Edit e Delete da série. A confirmar no desktop se é só do endereço direto | O título da tela escopada nomeia a série? S/N | baixo / médio | título genérico → nome da série | mjrp-designing-ui |
| 20 | IN-03, IN-05 | P2 | L | `components/Footer.js` | Rodapé: Home (38x20), Albums (46x20), Playlists (50x20) e «Clear Cache» (77x20) em fila, a poucos px um do outro; Clear Cache apaga o cache e recarrega sem confirmação no toque | Os 4 itens têm 44 px de alto e Clear Cache pede confirmação? S/N | baixo / baixo | 4 links de 20 px → alvos de 44 px; ação de cache separada | mjrp-designing-ui |
| 21 | IN-03 | P2 | L | `css/modals.css`, `views/InventoryView.js` | Janela de edição do inventário (a melhor janela do app: cabe em 812 px, Cancel e Save à vista): campos a 14 px, círculos de moeda BRL/USD de 20x20, ✕ de 28x28; o corpo da página atrás não trava a rolagem | Os controles da janela têm ≥ 44 px e a rolagem de fundo trava? S/N | baixo / baixo | 14–28 px → 16 px e 44 px | mjrp-designing-ui |
| 22 | IN-03 | P2 | L | `components/ui/Pager.js`, `views/PlaylistsView.js` | Alvos pequenos remanescentes: breadcrumb «Home / Blend / Playlists» de 19 px de altura e seletor de ordenação a 26 px | Todos os alvos ≥ 44 px? S/N | baixo / baixo | 19–26 px → 44 px | mjrp-designing-ui |
| 23 | IN-06, CP-02 | P2 | D | `components/ui/FilterToolbar.js` | Sem «voltar ao topo» em páginas de 18 a 95 mil px; o modo «Scroll» do pager de Albums não foi aberto em celular (a altura pode crescer sem fim) | Há um «voltar ao topo» visível após 2 telas de rolagem? S/N | baixo / médio | sem atalho → botão flutuante | mjrp-designing-ui |
| 24 | candidato (sem ID), AH-09 | P2 | L | `docs/specs/` (não existe `design-system.md`) | Não há `design-system.md`: nenhuma escala de tipo, de alvos nem de margens declarada para o celular, o que explica a deriva (9, 10, 12, 14 e 16 px misturados; alvos de 24 a 48 px). Achado de contrato, não de tela | Existe um `design-system.md` com mínimos de alvo (44 px), texto (12 px) e campo (16 px) no celular? S/N | médio / alto | sem declaração → declarar antes de redesenhar | mjrp-defining-design-systems |

Contagem: P0 3 (achados 1 a 3), P1 12 (achados 4 a 15), P2 9 (achados 16 a 24).

## Tela × usável no celular hoje?

| Tela e estado | Usável? | Por quê |
|---|---|---|
| Home: criar série por artista (busca, filtros, grade, conjunto) | com esforço | funciona, mas o conjunto escolhido fica 900 px longe e «Initialize» no fim da página; sem margem lateral |
| Home: colar lista (Bulk Paste) | com esforço | caixa de 341x128 e botão de 32 px; texto a 12 px dá zoom no iOS |
| Albums: todas as séries (grade) | com esforço | página rola de lado por 14 cabeçalhos; cartões com ações de 25 px; 39 mil px |
| Albums: barra de filtros e pager | com esforço | 640 px antes do primeiro álbum, campos a 14 px |
| Albums: visão em lista | não | 205 mil px de altura, colunas esmagadas |
| Albums: uma série (por endereço) | com esforço | funciona, mas não nomeia a série |
| Janela de álbum (Albums e Inventário) | não | título de uma letra, 1 a 2 faixas visíveis; em paisagem 48 px |
| Janela de ranking | com esforço | tela cheia, mas títulos cortados e só arrastar |
| Blend (4 passos) | sim | linear, 3,3 telas; só a caixa de séries rolável e textos de 10 px |
| Playlists geradas | com esforço | remover a 24 px, 6 caixas rolantes, botões de exportar em coluna irregular |
| Playlists salvas | com esforço | rola de lado, nomes cortados, 18 mil px |
| Inventário (resumo, filtro, ordenação) | sim | cabeçalho e contagens claros, os dois botões de ação cabem |
| Inventário (lista de cartões) | com esforço | 95 mil px sem paginação, ações de 28 px |
| Inventário: janela de edição | sim | a melhor janela: cabe e fecha |
| Barra do topo e gaveta | com esforço | gaveta boa, barra de 40 px que não fica fixa |
| Entrar / estado da conta | não conferido | só vi o estado conectado (gaveta e menu da conta); não vi o estado sem login |

## O que está bom, manter

- A tela Blend: passos numerados, cada um destrava o próximo, botão final de largura total, sem estouro (375 e 390).
- A janela de ranking é tela cheia no celular, com ações fixas no topo (Back, Reset, Save): é o padrão certo para a janela de álbum.
- A janela de edição do inventário cabe nos 812 px e mantém Cancel e Save à vista.
- A gaveta do menu: itens de 48 px, fecha por ✕, fundo e link, trava a rolagem; o submenu «Music Series» abre sem pular.
- O cabeçalho do inventário (totais por estado em selos, «211 albums») responde à pergunta da tela logo (HI-02).
- A grade de 2 colunas da Home, com capas grandes, é boa para escolher por reconhecimento.
- O botão «BLEND YOUR ALBUMS» e o de criar série têm destaque claro; há avisos de progresso («Scanning…», «Your unsaved playlists were restored»).

## Recorte (Brownfield): ordem do redesenho da F76

Proposta ao designer; não é decisão (o desenho e o padrão são de `mjrp-designing-ui`, em rodadas com três opções).

**0. Base compartilhada, antes das telas (1 rodada curta).** Declarar no `design-system.md` os mínimos do celular (alvo 44 px, texto 12 px, campo 16 px, margem 16 px) e três componentes que todas as telas vão usar: folha de baixo (filtros, ações, janela de álbum), barra de ação fixa e linha compacta de lista. Sem isso, cada tela repete os achados 5, 7, 11, 12 e 16.

**1. Albums e a janela de álbum (achados 1, 2, 3, 7, 8, 19, 23).** Primeiro porque concentra os três P0, é a tela mais longa (39 mil px) e a janela de álbum é reaproveitada no Inventário. Padrões a explorar:
- filtros: busca fixa no topo + botão «Filtros (n)» que abre uma folha de baixo com série, artista, ano, fonte e ordenação; paginação enxuta e «voltar ao topo» (DE-04, IN-01);
- séries: acordeão fechado por padrão, cada linha com nome (em até 2 linhas), contagem e tira de capas; abrir mostra os álbuns (DE-07);
- álbum: linha compacta (capa 56 px, título e artista completos, selos de fonte em 12 px) em vez de cartão de 131x323; o toque abre a folha do álbum; as ações (Rank, Add, Del, Refetch) rotuladas dentro dela, com o ⋯ de 44 px como atalho;
- janela de álbum: tela cheia como a de ranking, cabeçalho que encolhe ao rolar, abas em controle segmentado com rótulos curtos;
- visão em lista: decidir se existe no celular (decisão 1 abaixo).

**2. Playlists geradas e Playlists salvas (achados 4, 5, 6).** É a tela de «quem escuta no celular» (persona Consumption do PRD): abrir a playlist e levá-la ao Spotify ou Apple Music. Padrões a explorar:
- cada playlist como acordeão com resumo (nome, nº de faixas, duração), faixas na própria página, sem caixa rolante interna;
- barra de ação fixa no topo ou no pé (Salvar, Exportar para Spotify, Exportar para Apple Music) e as demais (Download JSON, Undo, Redo) numa folha de baixo;
- remover faixa por deslizar com «desfazer» (e botão de 44 px como alternativa); reordenar por botões subir/descer além do arrastar (IN-16);
- salvas: lista de lotes com busca e paginação; nome em 2 linhas; abrir o lote numa tela própria.

**3. Home: criar série (achados 9, 16, 17).** É o começo de tudo (EP-01) e o primeiro uso. Padrões a explorar:
- barra de ação fixa no pé: «n álbuns escolhidos · Criar série», que abre o conjunto numa folha de baixo (reordenar com subir/descer; remover);
- a busca e os filtros de tipo no topo, os álbuns como linhas com caixa de seleção, para ver quantos foram escolhidos sem rolar;
- Bulk Paste como aba com a caixa em tela cheia e o resultado das linhas puladas em lista.

**4. Inventário (achados 13, 21).** Linhas compactas com a paginação já feita na F72, busca fixa, status por controle segmentado de 44 px, janela de edição como está (só ajustar tamanhos). Entra depois porque o resumo e o filtro já funcionam e porque a F75 (valor e onde comprar) vai mexer no cartão: desenhar o cartão uma vez só, depois dela.

**5. Blend, ranking e barra do topo (achados 10, 14, 15, 18, 20).** Acertos, não redesenho: lista de séries sem rolagem interna, rótulos de passo a 12 px, título da faixa em linha própria no ranking, barra que reaparece ao rolar para cima, rodapé com alvos de 44 px.

Em todos os passos, medir de novo com os mesmos checks: sem rolagem lateral, alvos ≥ 44 px, campos ≥ 16 px, primeiro conteúdo útil acima da dobra de 812 px, janela que cabe também em paisagem.

## Consertos rápidos (de layout, não de redesenho), para fazer já

Cada um é pequeno, não muda a estrutura e pode ser entregue antes do redesenho:

1. **Fim da rolagem lateral em Albums** (achado 2): cabeçalho de série com `min-w-0`, nome com quebra de linha e `div.series-actions` em linha própria abaixo de 768 px (`SeriesGridRenderer.js`).
2. **Fim da rolagem lateral em Playlists salvas** (achado 4): mesma correção no `h3` do lote e esconder o «ID: …» cru.
3. **Campos a 16 px** abaixo de 768 px: busca, todos os `select`, o seletor de status do cartão, a caixa de texto da Home, os campos da janela de edição (achado 12).
4. **Alvos de 44 px** por área de toque (padding), sem mudar o ícone: ☰ e conta, remover faixa, excluir playlist, Edit/Delete do inventário, filtros de tipo e Pages/Scroll, links do rodapé (achados 5, 10, 13, 17, 20).
5. **Janela de álbum**: título com `min-w-0` e quebra de linha, área de faixas com `flex-1` e altura em `dvh`, abas com `overflow-x-auto` e rótulos curtos, travar a rolagem do fundo (achado 3). Em paisagem, tirar o limite de altura.
6. **Esconder o botão de lista** abaixo de 768 px (`#viewModeList`) até a visão em lista ter desenho de celular (achado 1).
7. **Margem lateral de 16 px na Home** (achado 16).
8. **Texto mínimo de 12 px** (selos, anos, passos do Blend, contagens) e cinzas mais claros no estado vazio e nos rótulos (achado 11).
9. **Barra do topo fixa de verdade** e o aviso («unsaved playlists were restored») abaixo dela (achado 10).
10. **Home: aviso curto ao tocar num álbum** («Adicionado · 3 escolhidos») e uma cópia do botão «Initialize» presa ao pé da tela (achado 9, versão mínima).
11. **Lista de séries do Blend** sem altura máxima (ou com busca) (achado 15).

## Decisões que são do MJRP

1. **A visão em lista existe no celular?** Esconder (conserto 6) e manter só a grade ou a linha compacta, ou desenhar uma versão para o celular. Recomendação do crítico: esconder agora e decidir na rodada de Albums.
2. **Qual a abordagem: um layout responsivo único, ou telas de celular com componentes próprios (folha de baixo, barra de ação)?** O PRD já fala em «visões simplificadas de consumo e menus em folha inferior» (persona Consumption, Prod_Vision:86). A auditoria assume a segunda; a decisão pesa no esforço e nos testes da F76.

## O que não conferi, e por quê

- **Aparelho real e iOS Safari**: tudo foi medido em emulação do painel de navegador (375x812, 390x844, 812x375). Não vi zoom ao focar, barra de endereço que encolhe (`100vh`), área segura (entalhe e barra inferior), nem toque de verdade. Os achados 12 e 3 (paisagem) são medidas, não observação em aparelho.
- **Sem login**: o perfil estava conectado. O estado desconectado e o fluxo de entrar (Connect Spotify, Apple, Google) não foram vistos; só abri a gaveta e o menu da conta, sem apertar Sign Out nem Connect.
- **Escritas na conta**: não apertei «Add the albums of my series», «Update ratings», Save, Delete, export, «Blend», Process List nem Clear Cache. Por isso não vi: o resultado da lista colada (linhas puladas), a janela de confirmação de exclusão, o resultado do export, uma playlist recém-gerada, nem os avisos de sucesso e erro (tempo e posição) em uso real.
- **Arrastar por toque**: reordenar o conjunto da Home, as faixas das playlists e as do ranking. Não achei elementos `draggable` na lista de playlists (a técnica usada não ficou clara) e o painel não simula arrastar por toque.
- **Estados vazios, de erro e de carga** de Playlists, Playlists salvas e Inventário (o perfil tem dados); a busca da Home sem resultado e com falha também não.
- **Modo «Scroll» do pager** de Albums: só vi «Pages» (padrão); a altura da página no modo rolagem incremental não foi medida.
- **Séries por gênero, artista e faixas** («Soon»): não são links, sem tela a julgar.
- **Leitor de tela e teclado**: fora do escopo desta passada (AH-04 só citado no achado 14). Os contrastes são aproximados (cor computada contra o primeiro fundo opaco; sobre degradês e vidro o valor real pode variar); recomendo conferir os do achado 11 com uma ferramenta de contraste antes do conserto.
- **Capturas de tela** não foram gravadas em `reports/evidence/` (só a leitura em sessão); podem ser gravadas numa passada de re-conferência.
- **Cânone**: li as disciplinas HI, DE, CP, IN, AH e IA; CO, CW, RC e MP não se aplicam a esta passada (MP-01 só em Discovery).
- **Entrada no `docs/log.md`**: o pedido proibiu editar o log; a entrada de revisão que a skill prescreve (`## [2026-11-20 01:00] review — mjrp-critiquing-ux-ui: Album Blender V0 no celular · recorte Brownfield`, com o caminho deste relatório, P0 3, P1 12, P2 9, agente separado) fica para quem for fazer o commit.

## Fora do cânone (candidatos)

- Rolagem dentro de rolagem em celular (achados 6 e 15): nenhum ID cobre a armadilha de rolagem aninhada em tela de toque. Candidato a regra: «em tela de toque, uma lista não tem altura máxima com rolagem própria dentro de uma página que rola». Não busquei fonte na web nesta passada (o pedido era só leitura e relatório); o candidato vai para `reports/harness-feedback/`, a decidir pelo MJRP.
- Rótulo só em `title` (achado 7): ação sem rótulo visível não existe no toque (a dica ao pairar não aparece). Coberto hoje por IN-03 e IN-07; candidato a regra própria («ação só com ícone tem rótulo visível ou nome acessível e alvo de 44 px»).
