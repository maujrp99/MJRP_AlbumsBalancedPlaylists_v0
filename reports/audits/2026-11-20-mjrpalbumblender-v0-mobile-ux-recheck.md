---
type: ux-audit
subject: "Album Blender V0 no celular depois da F76: re-conferência das cinco telas, barras, folhas e janelas, a 393x852, 393x660 e 667x375"
project: MJRP_AlbumsBalancedPlaylists_v0
moment: delivery
judged: "2026-11-20 23:40"
who_judged: separate-agent
verdict: passes-with-fixes
p0: 0
p1: 11
p2: 11
human_decisions: 1
status: open
supersedes_checks_of: reports/audits/2026-11-20-mjrpalbumblender-v0-mobile-ux-audit.md
---

# Re-conferência de UX — Album Blender V0 no celular · 2026-11-20 23:40

> Momento: Delivery (a F76 foi integrada na `main`, merge `993b317`) · Gêneros: fluxo/formulário (Home, Blend, ranking) e dados (Albums, Inventário, Playlists)
> Objeto: app em `http://127.0.0.1:5010`, aba `tab-10` do painel de navegador, conta do dono com dados reais · Viewports: 393x852 (iPhone 15 Pro), 393x660 (o que o Safari deixa visível), 667x375 (paisagem) · Cânone: `docs/wiki/harness/design-canon.md` (HI, DE, CP, IN, AH, IA) e `docs/specs/design-system.md` § Celular
> **Quem julgou: agente separado** (recebeu a skill, o pedido, a auditoria anterior e as notas das telas; não construiu nada)

## Veredito

**Pode ir para o iPhone do dono hoje, sem P0.** O salto é grande: das 24 falhas antigas, 19 fecharam, 3 fecharam em parte e 2 não foram re-medidas. Nenhuma tela rola de lado, nenhum alvo medido ficou abaixo de 44 px, nenhum texto abaixo de 12 px, todo campo está a 16 px, não há mais rolagem dentro de rolagem. Albums (grade, lista, folha do álbum, filtros) e a janela de ranking estão no nível de um app nativo.

O que ainda pesa: um defeito visível na Home (os filtros flutuam por cima das capas), uma perda silenciosa de trabalho no ranking, duas telas onde o conteúdo não aparece na primeira dobra (Inventário e New Playlists a 393x660), Playlists salvas, que ficou com o desenho de computador, e as costuras entre as cinco telas (duas fontes, três estilos de controle segmentado, três anatomias de folha).

**As cinco correções que mais importam, em ordem:**

1. **Home: a faixa de filtros fica presa no topo, transparente, por cima das capas** (N1). Esforço baixo.
2. **Ranking: «Back» joga fora a ordem nova sem perguntar** (N6). Esforço baixo.
3. **Inventário: a 393x660 nenhuma linha aparece** (a primeira começa em 681 px; o fundo útil termina em 603) (N2). Esforço médio.
4. **New Playlists: a 393x660 sobram 53 px de faixas** abaixo de 450 px de cabeçalhos (N3). Esforço médio.
5. **Playlists salvas: a tela mais fraca**. Ainda tem a barra de filtros de computador, cartões dentro de cartões, dois botões vermelhos à vista e nomes de lote gerados pela máquina (N5). Esforço médio.

Logo depois: uma regra única de fonte (N4) e de controle segmentado (N9), a folha de status do Inventário com dois «✓» (N8), o nome da série dentro da folha de escolhidos da Home (N10).

**A melhor tela é Albums**, com a janela de ranking logo atrás. **A mais fraca é Playlists salvas.**

## Como foi medido

Por script na página (`javascript_tool`): `scrollWidth` contra `clientWidth`, alvos abaixo de 44x44, textos abaixo de 12 px, campos abaixo de 16 px, caixas com rolagem própria, posição do primeiro conteúdo contra o topo da barra fixa de baixo, família e tamanho de fonte por papel. O contraste é a cor computada contra o primeiro fundo opaco (com alfa composto). Capturas em 393x852 e 393x660, olhadas uma a uma; não foram gravadas em `reports/evidence/`. Nota: o painel às vezes devolvia a captura anterior (página em `visibilityState: hidden`); todo achado visual foi conferido com uma captura nova ou com medida.

Ações (nenhuma gravou na conta): abri folhas e janelas e fechei por Close, Back e Cancel; movi uma faixa no ranking sem salvar (sete passos) e saí por Back; busquei «Pink Floyd» na Home e escolhi dois álbuns sem criar; no Blend escolhi série e receita sem apertar «Blend it!»; em `/playlists` movi uma faixa e desfiz. Guardei antes e devolvi depois, byte a byte, o rascunho `mjrp_current_playlists`, que só tinha mudado no `timestamp`. Alternei Albums para lista e voltei para grade. Não abri «Edit Batch»: abrir um lote podia trocar o rascunho de playlists não salvas do dono.

## As 24 falhas antigas, medidas de novo

| # | Antes | Agora | Estado | Medida |
|---|---|---|---|---|
| 1 | Visão em lista com 205.896 px e rolagem lateral | linha de 105 px, capa de 56, selos em pílula | **fechado** | lista a 393: `scrollWidth` 393, 19.319 px de altura para 40 séries, 0 alvos < 44 |
| 2 | Albums rolava de lado (602 px) | — | **fechado** | `scrollWidth` 393 = `clientWidth` |
| 3 | Janela do álbum com o título virando uma letra e 286 px de faixas | tela cheia, título inteiro, uma rolagem só | **em parte** | aberta por Albums: título em 3 linhas e 7 faixas visíveis. Aberta pelo Inventário: as faixas só começam em y=965, depois de «Estimated value» e «Where to buy», ou seja, 0 faixas na primeira tela (N7) |
| 4 | Playlists salvas rolava de lado; ID cru | — | **fechado** | `scrollWidth` 393, ID escondido, séries fechadas por padrão. O resto da tela continua fraco (N5) |
| 5 | «Remove Track» de 24x24 | «⋯» de 44 e folha da faixa | **fechado** | `/playlists`: 0 alvos < 44 |
| 6 | Seis caixas de faixas com rolagem própria | fichas por playlist e uma lista só | **fechado** | 0 caixas com rolagem interna |
| 7 | Quatro ícones de 25x28 sem nome no cartão | «⋯» de 44 e folha com rótulos | **fechado** | folha: 7 linhas de 52 px, nome em cada uma |
| 8 | 640 px de filtros antes do primeiro álbum | busca + «Filters» numa folha | **fechado** | a primeira capa começa em 240 px. O padrão não chegou a Playlists salvas (N5) |
| 9 | Home sem resposta ao tocar; botão no fim | barra de ação «2 albums chosen · Create series»; número de ordem na capa | **fechado** | nova falha: o nome da série fica longe (N10) |
| 10 | Barra do topo sumia ao rolar | fixa, 48 px, menu de 44 | **fechado** | `phone-topbar` fixa 0–48 |
| 11 | Texto abaixo de 12 px; cinzas de 2,8:1 | 0 textos < 12 em todas as telas | **em parte** | estado vazio «Search for an artist to begin scanning.» na janela Edit Series: **2,43:1** (`rgb(75,85,99)` sobre `#141417`). Na Home o mesmo texto ficou em 8,09:1 |
| 12 | Campos a 12–14 px | todos a 16 px | **fechado** | 0 campos < 16 em Home, Albums, Playlists salvas, Inventário, Edit Series e edição do inventário |
| 13 | Inventário com 211 cartões e 95.809 px | linhas de 102 px, 50 por vez, A–Z | **em parte** | a 393x660 nenhuma linha acima da dobra (N2) |
| 14 | Títulos do ranking cortados; só arrastar | título em linha própria; Up, Down, «Move to…», Done; aviso falado | **fechado** | «I Talk to the Wind is now number 2» na região viva; a faixa escolhida fica à vista ao descer 6 vezes. Nova falha: Back descarta sem perguntar (N6) |
| 15 | Lista de séries do Blend com rolagem interna | folha com busca | **fechado** | 48 séries, 0 rolagem interna. A busca abre o teclado sozinha (N13) |
| 16 | Home sem margem | 16 px | **fechado** | — |
| 17 | Filtros de tipo rolando de lado | duas colunas de 44 px | **fechado** | na janela Edit Series os mesmos filtros continuam em pílulas do desenho antigo (N16) |
| 18 | Conta mostrava a Apple; «Playlists» duplicado | inicial «M» no degradê; menu sem duplicata | **fechado** | — |
| 19 | Título genérico na série aberta por endereço | — | **não re-medido** | não abri `/albums?seriesId=…`; a nota da tela diz que a barra mostra o nome da série |
| 20 | Rodapé de 20 px; Clear Cache sem confirmação | rodapé some no celular; «Clear album cache» no menu | **fechado** (a confirmação não foi apertada) | menu: linhas de 52 px |
| 21 | Janela de edição do inventário com 14 px e alvos de 20 px | campos a 16, botões de 48, fechar de 44, fundo preso | **fechado** | nova falha P2: a moeda só oferece BRL e USD, a tela oferece quatro (N16) |
| 22 | Breadcrumb de 19 px | 44 px | **fechado** | `/playlists`: 0 alvos < 44 |
| 23 | Sem «voltar ao topo» | botão redondo de 44 px | **fechado** | nova falha: cobre o «⋯» das linhas do Inventário (N11) |
| 24 | Sem `design-system.md` | § Celular com medidas, escala de tipo, folhas e barras | **fechado** | falta a regra de família de fonte (N4) |

Contagem: 19 fechados, 3 em parte (3, 11, 13), 2 não re-medidos (19; e 20 só sem a confirmação).

## Achados novos

Severidade: P0 bloqueia a tarefa; P1 a torna difícil ou faz perder trabalho; P2 é acabamento. As âncoras estão em `public/`.

| ID | Sev | Tela | Âncora | Evidência (medida ou vista) | Mudança | Check (S/N) | Esforço | Dona |
|---|---|---|---|---|---|---|---|---|
| N1 | P1 | Home | `css/views/home.css:37-42` (`#home-toolbar { position: sticky; top: 0; z-index: 30 }`), `css/mobile/home.css:186` (tira o fundo e não tira o `sticky`) | Com a discografia aberta e a página rolada 400 px, a faixa «02b // Discography Scan» e os seis filtros ficam presos em `top:0`, com fundo `rgba(0,0,0,0)`. «Studio» e «EPs» ficam meio escondidos sob a barra do topo e «Compendiums» e «?» (y 134–178) flutuam sobre as capas (a primeira capa vai de 162 a 335) e sobre o «+». Visto na captura | No celular, `#home-toolbar { position: static }` dentro de `mobile/home.css`. Se quiser os filtros presos: `top: calc(48px + env(safe-area-inset-top))` e fundo opaco | Rolando a grade, nenhum filtro fica sobre uma capa? | baixo | mjrp-designing-ui |
| N2 | P1 | Inventário | `views/InventoryView.js` (`renderPhone`), `css/mobile/inventory.css` | A 393x660, a primeira linha começa em y=681 e a barra de baixo em 603: **0 linhas** e nem a busca (625–667) à vista. A 393x852 aparece uma linha. Acima dela: contagem e fichas (~90 px), cartão de totais e moeda (~290 px) e o aviso fixo do Discogs sobre a conta de vendedor (~160 px, texto branco em negrito) | Totais numa faixa de uma linha («R$ 6.873 owned · R$ 1.999 to buy ›») que abre uma folha com moeda, taxa e Discogs. O aviso do vendedor vai para a folha «⋯» da coleção, ou aparece uma vez e se dispensa. A barra presa (busca, A–Z, filtros, ⋯) vem logo abaixo das fichas | A 393x660, a busca e pelo menos 2 linhas aparecem sem rolar? | médio | mjrp-designing-ui |
| N3 | P1 | New Playlists (`/playlists`) | `components/playlists/PhonePlaylists.js`, `views/PlaylistsView.js`, `css/mobile/playlists.css` | A 393x660 a primeira faixa começa em ~486 e a barra de ação em 539: **53 px de faixas**, menos de uma linha de 64. Antes dela há breadcrumb, cartão «Batch Name», «Reconfigure…», Undo/Redo e as fichas (~450 px) | O nome do lote vira título editável de uma linha. «Reconfigure» vai para o «⋯» da tela. Undo e Redo viram dois ícones de 44 px na linha das fichas ou na barra de ação. O breadcrumb sai do celular (a barra de baixo já orienta) | A 393x660 aparecem pelo menos 3 faixas sem rolar? | médio | mjrp-designing-ui |
| N4 | P1 | todas (costura) | `css/mobile/albums.css:29` (`--albums-font` do sistema), `css/mobile/playlists.css:26` (`--pl-sans`), `css/mobile/home.css:327`; o resto herda Syne do `body` | Mesmo papel, duas fontes. Linhas e folhas de Albums e de Playlists usam `-apple-system`. Linhas do Inventário, folhas do Inventário, menu, ranking, janela do álbum, Blend e Home usam **Syne**, inclusive no corpo de 13–16 px. Na mesma tela de Playlists, o título é Syne e as faixas são do sistema. `design-system.md` § Escala de tipo não declara família | Declarar no § Celular: Syne só para título de tela, de folha e de item (≥ 17 px). Sistema para corpo, linhas, metadados e botões. Aplicar em `mobile.css` (base) e tirar as variáveis por tela | Um título de linha de álbum tem a mesma família em Albums, Inventário e na folha da Home? | médio | mjrp-defining-design-systems |
| N5 | P1 | Playlists salvas | `views/SavedPlaylistsView.js`, `components/playlists/SavedPlaylistActions.js`, `components/ui/FilterToolbar.js` | A primeira série só começa em y=370: busca, dois `select`, ordem e Refresh empilhados (a nota da tela deixou de fora de propósito). Série aberta: cartão dentro de cartão dentro de cartão. «Add Playlists» e «Open Albums Series» em estilos diferentes, lixeira solta, e no lote «Edit Batch» ao lado de «Delete» em vermelho (dois destrutivos à vista). O nome do lote é a string da máquina, «1. Bob Dylan… SPFY Top 3 Bal.Intv.2026-11-20 23:21». A data aparece em dois formatos e dois dias («11/19/2026» e «2026-11-20»). «1 playlists». Sem «⋯» nem folha, ao contrário das outras quatro telas | O mesmo padrão de Albums: busca + «Filters» numa folha. Série como cabeçalho (nome, «n batches · n playlists», «⋯»). Lote numa linha (capas, nome legível, «n playlists · n tracks · 2h23 · 20 Nov», «⋯» com Edit, Export e Delete). Um formato de data. Plural certo | A primeira série aparece acima de 200 px e todo lote tem «⋯» com as ações? | médio | mjrp-designing-ui |
| N6 | P1 | Ranking | `components/ranking/UserRankModal.js` (botão Back, ~l. 220) | Movi «I Talk to the Wind» de 3 para 8 (7 toques) e apertei Back. A janela fechou sem pergunta e, reaberta, mostrou a ordem antiga: o trabalho se perdeu em silêncio | Com mudança não salva, Back abre uma folha de baixo: «Discard changes?», com «Keep editing» e «Discard» (e «Save ranking»). Sem mudança, fecha direto | Depois de mover e apertar Back, aparece a pergunta? | baixo | mjrp-designing-ui |
| N7 | P1 | Janela do álbum aberta pelo Inventário | `components/ViewAlbumModal.js`, `css/mobile/album-window.css` § 6; `css/tailwind.css:31` (`.btn-secondary` com `backdrop-blur-sm`) | (a) As faixas (controle «Original · BEA · Spotify») só começam em y=965. Antes vêm «Estimated value», a nota de valor e «Where to buy». (b) Nas capturas a 393x852, o botão «Save» do valor (88x47) e os botões das lojas (160x47) **aparecem como caixas vazias**, sem rótulo, embora o estilo computado seja texto branco; a suspeita é o `backdrop-filter: blur(4px)` do `.btn-secondary` dentro da janela desfocada | (a) No celular, um resumo de uma linha do valor («≈ R$ 114.47 · Discogs ›») que abre os detalhes numa folha; as faixas logo depois do cabeçalho. (b) Tirar o `backdrop-filter` dos botões dentro de `.album-window` no celular e conferir no iPhone | Aberta pelo Inventário, a janela mostra pelo menos 3 faixas sem rolar e todo botão mostra o rótulo? | médio | mjrp-designing-ui |
| N8 | P1 | Inventário: folha «Status» | `views/InventoryPhoneSheets.js:60` | As opções levam marcas no rótulo («✓ Owned», «♡ Wishlist») e a escolhida ganha um ✓ à direita. Com Wishlist escolhida, «✓ Owned» parece marcado (dois ✓ com sentidos diferentes). Visto na captura | Na folha, rótulos limpos («Owned», «Not owned», «Wishlist»), ícone neutro à esquerda se quiser; só o ✓ da direita marca a escolha | Com Wishlist escolhida, só uma linha mostra ✓? | baixo | mjrp-designing-ui |
| N9 | P1 | Albums, Inventário, Home, janela do álbum (costura) | `css/mobile/albums.css` (pager Pages/Scroll; Grid/List), `css/mobile/album-window.css` § 4, `css/mobile/inventory.css` (moeda), `css/mobile/home.css` (Visual/Bulk) | Três estilos para o mesmo controle segmentado. Escolhido **laranja** em Pages/Scroll (fim de Albums) e Original/BEA/Spotify. Escolhido **cinza elevado** em Grid/List (folha Filters de Albums), USD/EUR/GBP/BRL e Visual/Bulk Paste. A tela Albums mostra os dois. O laranja passa a significar «escolhido», «ação principal» e «aba atual» ao mesmo tempo | Um só componente segmentado no § Celular: escolhido em cinza elevado com texto branco. Laranja só para a ação principal, a aba atual e a seleção de item (anel na Home) | Todo segmentado escolhido tem a mesma cor nas cinco telas? | baixo | mjrp-defining-design-systems |
| N10 | P1 | Home: folha de escolhidos | `components/home/HomePhoneChosen.js`, `controllers/HomeController.js:204` | O campo do nome fica no topo da página. A folha «2 albums chosen» tem «Create series» e não tem o nome. Com o campo vazio, o código cria a série como «New Album Series» sem avisar. Na folha, o título do álbum fica cortado em 121 px («Pink Floyd at Pompeii -…») porque ↑, ↓ e ✕ ocupam 156 px | Campo «Series name» no alto da folha, preenchido com o nome do artista buscado, e foco nele ao abrir. Título em até 2 linhas; ↑ e ↓ podem virar «⋯» se faltar espaço | Ao apertar «Create series» na folha, a pessoa vê e pode mudar o nome? | baixo | mjrp-designing-ui |
| N22 | P1 (não reproduzido) | todas as folhas | `utils/pageScrollLock.js` (contador `locks` global), `components/ui/Sheet.js:136-158` | Uma vez, no começo da passada, depois do salto A–Z a página ficou presa (`body` com `position: fixed; top: -4371px`, sem nenhuma folha aberta), e a rolagem não andava. Numa rodada limpa (recarregar, abrir A–Z, escolher D) a trava soltou certo. Hipótese: a aba vinha de outra sessão com uma folha cuja `close()` não rodou (troca de rota com folha aberta), deixando `locks > 0` | Destravar por segurança: ao mudar de rota, zerar o contador e soltar o `body`; em `unlockPageScroll`, se não houver `.sheet` nem janela aberta, soltar mesmo com contador > 0 | Com uma folha aberta, trocar de rota (voltar no navegador) deixa a página rolando? | baixo | mjrp-designing-ui |
| N11 | P2 | Inventário (e qualquer lista com «⋯» à direita) | `css/mobile.css` (voltar ao topo), `views/InventoryView.js` | O «voltar ao topo» (334–376 × 737–779) cobre o «⋯» de uma linha (343,760, 44x44) | Subir o botão para 16 px acima da barra de ação/aba e deixá-lo fora da coluna dos «⋯» (por exemplo, uma pílula «Top» centrada), ou mostrar só ao rolar para cima | O «voltar ao topo» nunca se sobrepõe a um alvo? | baixo | mjrp-designing-ui |
| N12 | P2 | Menu | `components/navigation/PhoneMenu.js` | «Series by artist / genre / track» com «Soon» são links vivos para telas «Coming Soon». Em `/genres` o círculo do ícone está vazio, parece quebrado. Três das oito linhas do menu são becos | No celular, tirar as três linhas (ou uma linha só, não tocável, «More series types soon») | O menu só tem linhas que levam a algo? | baixo | mjrp-designing-ui |
| N13 | P2 | Blend: folha «Choose a series» | `components/blend/BlendSeriesPhonePicker.js`, `components/ui/Sheet.js` (foco inicial) | A busca já abre focada: no iPhone o teclado sobe e cobre metade das 48 séries. Desalinhamento: a série de 2 álbuns («King in Crimson Vol.1») tem o texto em x=84; as outras, em x=94 | Foco no título da folha, não no campo. Mosaico de largura fixa (por exemplo 64 px) com qualquer número de capas | Ao abrir, o teclado fica fechado e todos os nomes começam no mesmo x? | baixo | mjrp-designing-ui |
| N14 | P2 | Inventário: folha «⋯» da linha | `views/InventoryPhoneSheets.js:92` (`sellOrTrade`) | «Sell» e «Trade» desligados («not in the app yet») ocupam um bloco. O corpo tem 848 px para 761 visíveis, e «Remove from inventory» fica abaixo da dobra da folha. As lojas usam «↗» no texto; a folha do álbum em Albums usa o ícone de link externo à direita | Tirar Sell e Trade no celular. Usar o mesmo item de link externo da folha do álbum | A folha cabe sem rolar a 393x852? | baixo | mjrp-designing-ui |
| N15 | P2 | Inventário, Playlists, Home (nomes acessíveis) | `views/InventoryView.js` (fichas de status), `components/playlists/PhonePlaylists.js:116,139`, `views/HomeView.js` (filtro «?») | As três fichas de status têm o **mesmo** nome, «Show only these albums; press again to show all», sem o status nem a contagem. O «⋯» chama-se «Options for…» em Playlists e «Actions for…» em Albums e Inventário (IA-02). O filtro «?» da Home não tem nome nem explicação visível | Nome com o status («Show only Owned, 157»). Um verbo só («Actions for…»). «?» vira «Other» ou ganha `aria-label` e uma linha de ajuda | Cada ficha tem um nome diferente e todo «⋯» começa com a mesma palavra? | baixo | mjrp-designing-ui |
| N16 | P2 | Janela Edit Series; edição do inventário | `css/mobile/home.css` § 539 (casca), `views/InventoryView.js` | Edit Series ficou com o desenho antigo: linhas «King Crimson - In the Court of the…» sem capa e cortadas, filtros em pílula com degradê, «Scan» em degradê com brilho, estado vazio a **2,43:1**. A edição do inventário oferece só BRL e USD, a tela oferece quatro moedas | Reaproveitar a linha da folha de escolhidos da Home (capa, título em 2 linhas, ↑ ↓ ✕) e os filtros de duas colunas. Cinza do estado vazio para `#A0A0A8`. As quatro moedas, ou uma nota de por que só duas | A janela Edit Series usa as mesmas peças da Home e passa 4,5:1? | baixo | mjrp-designing-ui |
| N17 | P2 | Blend | `views/BlendingMenuView.js`, `css/mobile/blend.css` | Dois títulos: a barra «Blend» e «🍹 The Blending Menu» (~48 px). A nota da barra de ação quebra feio («· 60 / min»). O controle de duração vai de 30 a 180 min em passos de 5 num trilho de 255 px (8 px por passo): ajuste fino difícil no dedo | Tirar o título repetido no celular. Nota com `white-space: nowrap` e reticências. Fichas de duração (45 · 60 · 80 · 90 · 120) ou − / + ao lado do valor | A duração muda de 5 em 5 min com toques, sem arrastar? | baixo | mjrp-designing-ui |
| N18 | P2 | botão principal (costura) | `css/modals.css:133` e `css/tailwind.css:24` (`.btn-primary` em degradê), `css/mobile/ranking.css` (laranja chapado) | «Save ranking» é laranja chapado. «Show albums», «Create series», «Save Changes», «Scan» e «Save» de Playlists são degradê laranja→vermelho, alguns com brilho | Um estilo de botão principal no celular (o chapado do ranking é o mais limpo) | Todo botão principal tem o mesmo fundo? | baixo | mjrp-defining-design-systems |
| N19 | P2 | folhas (costura) | `components/ui/Sheet.js` e o CSS de cada tela | Quatro anatomias de folha. Álbum: linhas chapadas de 52 px com ícone à esquerda e ↗ à direita. Faixa e playlist: grupos em cartão, linhas de 56 px. Inventário: seções com cabeçalho em maiúsculas e ↗ no texto. Menu: chapadas de 52 px em Syne. Ícones de mover misturados (seta para cima, chevron para baixo) | Uma linha de folha no kit (`Sheet.row`: ícone 24, rótulo 16, 52 px, destrutivo em vermelho e por último, link externo com ícone à direita), usada por todas | As folhas de álbum, faixa, linha do inventário e menu têm a mesma linha? | médio | mjrp-designing-ui |
| N20 | P2 | New Playlists | `components/playlists/PhonePlaylists.js` | Mover pela folha («Move down») muda a lista por baixo sem nenhum sinal: a linha movida não pisca e não há aviso, só Undo acende | Aviso curto «Moved to 2 · Undo» e um realce de 1 s na linha | Depois de mover, a pessoa vê onde a faixa foi parar? | baixo | mjrp-designing-ui |
| N21 | P2 | Paisagem 667x375 | `css/mobile/albums.css` | Albums fica com 2 colunas; barras de 48 + 57 px (28% da altura), e nenhuma capa inteira aparece. (O iPhone 15 Pro deitado tem 852 px e recebe o desenho de computador, então isto vale só para telefones menores) | Em `orientation: landscape` e altura < 500: 3 a 4 colunas e barra do topo de 40 px | Em 667x375 aparece pelo menos uma linha de capas inteira? | baixo | mjrp-designing-ui |

Contagem: P0 0 · P1 11 (N1–N10, N22) · P2 11 (N11–N21).

## As costuras entre as cinco telas

| Papel | Albums | Inventário | Playlists | Home / Blend | Ranking / janela do álbum |
|---|---|---|---|---|---|
| Fonte do corpo e das linhas | sistema | Syne | sistema (título em Syne) | Syne | Syne |
| Controle segmentado escolhido | cinza (Grid/List) **e** laranja (Pages/Scroll) | cinza (moeda) | — | cinza (Visual/Bulk) | laranja (Original/BEA/Spotify) |
| Linha de álbum | capa 56, sistema 16, selos cinza | capa 64, Syne 15, pílula de status colorida | — | capa na folha de 48, Syne 15 | — |
| Folha «⋯» | chapada 52 px, ícones | seções, ↗ no texto, Sell/Trade mortos | grupos em cartão 56 px | — | — |
| Nome do «⋯» | «Actions for…» | «Actions for…» | «Options for…» | — | — |
| Botão principal | degradê («Show albums») | — | degradê («Save») | degradê («Create series») | chapado («Save ranking») |
| Filtros da tela | busca + «Filters» numa folha | busca presa + A–Z + filtros + ⋯ | Playlists salvas: 4 controles empilhados | — | — |

O verde também tem dois sentidos: «passo feito» no Blend e «Owned» no Inventário. É aceitável, porque os dois são positivos; só fica registrado.

## O que está bom, manter

- A base: barra do topo fixa de 48 px, barra de baixo de cinco destinos, menu em folha, avisos abaixo da barra do topo, página presa atrás de folhas (soltou em todas as aberturas e fechamentos que medi, menos o caso N22).
- Albums inteira: cabeçalho de série preso, «⋯» de 44 px, a folha do álbum (rótulos claros, «Remove from this series» separado e em vermelho), a folha Filters com «Clear filters / Show albums», a visão em lista.
- O ranking: «Tap a track to move it with the buttons below», Up, Down, «Move to…», Done, a faixa sempre à vista ao mover, e o aviso falado da posição nova.
- A Home: anel laranja com o número de ordem na capa e a barra «n albums chosen · Create series».
- O Blend: 5 toques do zero até «Blend it!», o resumo na barra de ação e a receita escolhida com ✓.
- As linhas do Inventário: capa, título, valor alinhado à direita com a origem, status em pílula, notas.

## Fora do cânone

N22 (trava de rolagem presa por um contador global) é um candidato sem ID: a fonte é o próprio projeto (`design-system.md` § Áreas seguras, «presa… e devolvida ao lugar ao fechar»). Não abri pesquisa externa.

## O que não conferi, e por quê

- **iPhone e Safari de verdade**: tudo foi feito em emulação no painel. Não vi o teclado sobre os campos, a barra do Safari encolhendo, o toque real nem o arrastar por alça.
- **Inventário**: não toquei em «Show 50 more», na folha de filtros, na busca digitada nem na troca de moeda (o tempo acabou; trocar a moeda também grava a preferência).
- **«Edit Batch» e a edição de um lote salvo**: não abri, para não trocar o rascunho de playlists não salvas do dono (`mjrp_current_playlists`).
- **Ações que gravam**: Save, Create series, Blend it!, Delete, export, «Read again», Clear cache, Sign Out. Por isso não vi as confirmações, os avisos de sucesso e erro, nem uma playlist recém-gerada.
- **Estados vazio, carregando e erro** de Inventário, Playlists e Playlists salvas: a conta tem dados. A busca da Home sem resultado também não foi vista.
- **Série aberta por endereço** (`/albums?seriesId=…`, falha antiga 19) e o modo «Scroll» do pager.
- **Leitor de tela**: só nomes acessíveis e `aria-modal` por leitura do DOM. Não testei o VoiceOver nem a ordem de foco com Tab (o código prende o foco dentro da folha, `Sheet.js:62-80`).
- **N7(b)**, os botões sem rótulo: visto em três capturas e não explicado pelo estilo computado. Pode ser um artefato do Chromium com `backdrop-filter` aninhado; confirmar no iPhone antes de mexer.
- **Entrada no `docs/log.md`**: o pedido proibiu editar outro arquivo além deste. A entrada de revisão que a skill pede (`## [2026-11-20 23:40] review — mjrp-critiquing-ux-ui: celular pós-F76 · passa com correções`) fica para quem integrar.
- **Decisão do MJRP**: N4 e N9 pedem uma regra de fonte e de controle segmentado no `design-system.md`; a proposta está nos achados, quem decide é ele.
