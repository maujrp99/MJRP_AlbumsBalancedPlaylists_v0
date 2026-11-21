---
type: research
subject: "Album Blender V0 no celular: como as diretrizes de plataforma e os melhores apps resolvem as tarefas do app (navegar álbuns, álbum, ranking, playlists, criar série, inventário, Blend), e a linguagem visual para o iPhone"
project: MJRP_AlbumsBalancedPlaylists_v0
feature: F76
written: "2026-11-20"
method: "pesquisa na web (Apple HIG, NN/g, Baymard, W3C WCAG 2.2, MDN, WebKit, páginas de ajuda e resenhas dos apps); nenhum app foi aberto num aparelho"
companion: "reports/audits/2026-11-20-mjrpalbumblender-v0-mobile-ux-audit.md"
---

# Benchmark de UX no celular — Album Blender V0 · F76

## Resposta em um parágrafo

As cinco decisões que mais pesam. **(1) Albums vira lista de séries fechadas, com busca presa no topo, um botão «Filtros (n)» que abre folha, e «Mostrar mais» em vez de páginas ou rolagem sem fim**: usabilidade de NN/g e Baymard; beleza de Albums (Adam Linder) e Longplay, que tratam a capa como protagonista. **(2) A janela do álbum é uma tela cheia com a capa grande, cor de fundo puxada da capa e um controle segmentado de 3 fontes**: usabilidade da Apple HIG (até 5 segmentos no iPhone); beleza do Apple Music no iOS 26.4 (2026). **(3) No ranking, cada linha tem botões subir/descer e «mover para…» além da alça de arrastar, com Salvar fixo**: é exigência da WCAG 2.2 SC 2.5.7, não gosto; beleza de Things 3 (Apple Design Award 2017). **(4) Playlists: uma playlist por tela, com abas roláveis no topo e barra de ação fixa no pé; remover com «Desfazer» em vez de confirmação**: usabilidade de NN/g (acordeão longo e deslizar escondido dão problema); beleza do Apple Music e do Spotify. **(5) Uma só barra de ação fixa no pé, de vidro escuro com desfoque, e o laranja só no que é ação principal ou estado ligado**: usabilidade e beleza da Apple HIG de 2025–2026 (Liquid Glass: vidro só na camada de controles, cor com parcimônia), com Linear Mobile (2025) como exemplo de vidro contido. O inventário usa Discogs e CLZ só como referência de função (o que o colecionador precisa ver e fazer), nunca de aparência.

## Como ler este relatório

- Cada seção separa **usabilidade** (diretriz ou pesquisa) de **beleza** (app reconhecido por desenho, com a prova do reconhecimento).
- Toda afirmação sobre um app tem a URL da fonte. Onde descrevo de lembrança, está escrito **«de memória, sem fonte»**. Onde não consegui conferir, **«não verifiquei»**.
- Anos entre parênteses: de quando é a fonte ou o reconhecimento. Referências de 2025–2026 estão marcadas **[novo]**.
- Tamanhos em px CSS, para a tela de 393x852.
- A base (barra de abas, folhas, áreas seguras, mínimos) é de outro relatório; aqui só a seção 8 toca nela.

### Quem conta como referência de beleza, e por quê

| App | Ano | Prova de reconhecimento | Fonte |
|---|---|---|---|
| Things 3 | 2017 | Apple Design Award (o segundo do app) | https://culturedcode.com/things/blog/2017/06/back-from-wwdc/ |
| Albums (Adam Linder) | c. 2021 | MacStories: «beautifully designed, feature-rich app» | https://www.macstories.net/reviews/albums-4-0-a-must-have-app-for-music-lovers/ |
| Longplay | c. 2023–2026 | MacStories elogia o foco na capa; a resenha do Mac fala em «beautiful design» e «one of the premier music apps» | https://www.macstories.net/reviews/longplay-2-0-an-album-oriented-apple-music-player-with-loads-of-new-features/ · https://www.macstories.net/reviews/longplay-for-mac-launches-with-powerful-ai-and-shortcuts-integration/ |
| Apple Music | 2025–2026 **[novo]** | A própria HIG usa o app como exemplo (busca, barra de abas com mini-player); Replay '24 foi indicado ao Webby 2025 de melhor interface no celular; tela de álbum redesenhada no iOS 26.4 | https://developer.apple.com/design/human-interface-guidelines/tab-bars.md · https://winners.webbyawards.com/2025/websites-and-mobile-sites/mobile-features-design/best-mobile-user-interface-mobile-features/340231/apple-music-replay-24 · https://9to5mac.com/2026/03/25/apple-music-in-ios-26-4-has-new-design-for-albums-playlists-and-more/ |
| Linear Mobile | 2025 **[novo]** | Não é prêmio: é o relato de desenho da própria empresa sobre o vidro do app | https://linear.app/now/linear-liquid-glass |
| Denim (capas de playlist) | 2025 **[novo]** | Finalista do Apple Design Award 2025, «Delight and Fun» | https://developer.apple.com/design/awards/2025/ |
| Mela (receitas) | 2025 **[novo]** | Finalista do Apple Design Award 2025, «Interaction» | https://developer.apple.com/design/awards/2025/ |
| Vocabulary | 2025 **[novo]** | Finalista do ADA 2025, «Visuals and Graphics» (ilustração consistente, tipografia equilibrada) | https://developer.apple.com/design/awards/2025/ |
| Tide Guide | 2026 **[novo]** | Vencedor do ADA 2026, «Visuals and Graphics»; finalista em «Interaction» (app de tabelas e gráficos) | https://developer.apple.com/design/awards/ |
| Structured | 2026 **[novo]** | Finalista do ADA 2026, «Inclusivity» (layout simples) | https://developer.apple.com/design/awards/ |
| Tiimo | 2025 **[novo]** | iPhone App of the Year 2025 (planejador) | https://www.apple.com/newsroom/2025/12/apple-unveils-the-winners-of-the-2025-app-store-awards/ |
| Side B (fila de álbuns) | 2026 **[novo]** | Só um lançamento no Product Hunt com um comentário elogiando o desenho; prova fraca | https://www.producthunt.com/products/side-b |

**Cortados por falta de prova** (não verifiquei reconhecimento de desenho): Tidal, Plexamp, Roon ARC, Marvis Pro (só a página da App Store, que diz ter sido destaque em MacStories e 9to5Mac; não li as resenhas), Doppler, Sofa, Letterboxd, Musicboard (achei uma resenha de usuário de 2025 que critica o desenho: https://justuseapp.com/en/app/1503544789/musicboard-discuss-music/reviews). Nenhum app de música, coleção ou lista aparece entre vencedores e finalistas do ADA 2025 e 2026 além dos da tabela. **Awwwards, Godly, Mobbin e Land-book**: a busca não devolveu nenhum site de música ou coleção premiado em 2025–2026 que eu pudesse confirmar; não cito nenhum. Não achei um web app rodando no Safari, de 2025–2026, premiado por desenho nesta categoria: as referências novas são apps nativos, e a ponte para a web está na seção 9 (vidro em CSS).

**Só função, nunca aparência** (decisão do MJRP): Discogs, CLZ Music, MusicBuddy.

---

## 1. Navegar uma biblioteca grande de álbuns agrupados em séries

### O que as referências fazem

**Usabilidade**
- **Texto pede lista; imagem pede grade.** HIG: prefira lista para texto; para muitas imagens, coleção (grade); e «considere uma tabela em vez de coleção para texto». https://developer.apple.com/design/human-interface-guidelines/lists-and-tables.md · https://developer.apple.com/design/human-interface-guidelines/collections.md
- **Rolagem sem fim é ruim para achar algo específico.** NN/g: serve a conteúdo homogêneo sem tarefa; para achar e comparar, paginação ou «Carregar mais». https://www.nngroup.com/articles/infinite-scrolling-tips/
- **«Mostrar mais» é o meio-termo no celular**, e precisa dizer quanto falta: «Vendo 40 de 333». A lista deve voltar ao mesmo ponto depois de abrir um item e voltar. https://www.nngroup.com/articles/alternatives-pagination-listing-pages/
- **15 a 30 itens por carga no celular**, com «Carregar mais» e carga preguiçosa das imagens. Baymard: https://baymard.com/blog/number-of-items-loaded-by-default
- **Filtros numa bandeja sobre os resultados**, com rótulo em palavra («Filtrar»), resultado atualizando na hora e a contagem total sempre à vista. NN/g: https://www.nngroup.com/articles/mobile-faceted-search/
- **Busca**: comece a filtrar enquanto a pessoa digita; campo em linha acima da lista que ele filtra, preso ao topo ao rolar; a HIG cita a biblioteca do app Música como exemplo. https://developer.apple.com/design/human-interface-guidelines/search-fields.md
- **Acordeão** funciona em páginas longas de seções independentes, fechado por padrão, com o cabeçalho da seção aberta preso e sem a página pular ao abrir. NN/g: https://www.nngroup.com/articles/mobile-accordions/
- **Voltar ao topo**: só em páginas com mais de 4 telas, canto inferior direito, aparece quando a pessoa rola para cima. NN/g: https://www.nngroup.com/articles/back-to-top/
- **Cabeçalho que some ao descer e volta ao subir**, animação de 300–400 ms, fundo opaco. NN/g: https://www.nngroup.com/articles/sticky-headers/

**Função (o que os apps de biblioteca oferecem)**
- Spotify «Sua Biblioteca»: filtros no topo (com X para limpar), ordenação num toque no topo da lista (Recentes, Adicionados recentemente, Alfabética, Criador), cada filtro lembra a própria ordem, e um ícone alterna lista e grade. Fonte: fórum oficial, 2021, pode estar desatualizado: https://community.spotify.com/t5/Your-Library/New-Your-Library-view-iOS-amp-Android/td-p/5196161
- Roon ARC (2025) **[novo]**: o «Focus» chegou ao celular na versão 1.77, filtrando por gênero, formato, selo, ano, tocado/não tocado. https://community.roonlabs.com/t/focus-feature-in-roon-arc-is-live/318737
- Apple Music (iOS 26, 2025) **[novo]**: fixar até seis itens no topo da biblioteca. https://www.macrumors.com/guide/ios-26-music/

**Beleza**
- **Albums (Adam Linder, c. 2021)**: grade de capas com tamanho ajustável num menu «⋯», 9 ordenações e 13 tipos de filtro combináveis, e «Quick Actions», uma tira perto do pé que guarda filtros prontos. https://www.macstories.net/reviews/albums-4-0-a-must-have-app-for-music-lovers/
- **Longplay (c. 2023)**: a tela é uma parede de capas; deslizar revela 8 ordens; coleções abrem de uma faixa «My Library». https://www.macstories.net/reviews/longplay-2-0-an-album-oriented-apple-music-player-with-loads-of-new-features/
- Plexamp, Discogs (layout), Letterboxd, Musicboard: não verifiquei.

### Padrão recomendado para este app

**Lista de séries fechadas + linha compacta de álbum + folha de filtros + «Mostrar mais».** Motivo: são 50 séries e 230 álbuns; a tarefa é achar uma série ou um álbum, não passear. A grade de capas fica como opção dentro da série aberta, porque capa é reconhecimento rápido.

**Para construir**
- **Topo preso (56 px)**: campo de busca (altura 44, fonte 16) + botão «Filtros» com contador («Filtros · 2») de 44x44. Filtra enquanto digita.
- **Linha de resumo (32 px), logo abaixo, também presa**: «50 séries · 230 álbuns» à esquerda (o que a F72 já entrega); à direita, a ordem atual como botão de texto («A–Z ↑»). Com filtros ligados, a linha vira fichas removíveis («Série: Prog ✕», «Ano: 1973 ✕») com rolagem lateral e «Limpar» no fim.
- **Linha de série fechada (72 px)**: nome em até 2 linhas (16/600), «12 álbuns» (13, cinza), tira de 3 capas de 40 px à direita, seta. Toque abre no lugar, sem pular. O cabeçalho da série aberta fica preso sob o topo (44 px) com o nome e o «⋯» (Editar, Excluir).
- **Linha de álbum (64 px)**: capa 48 px (raio 6), título (16/600, 1 linha), artista · ano (13, cinza), até 2 selos de fonte de 12 px, e «⋯» de 44x44 que abre uma folha com as ações com nome (Rank, Adicionar ao inventário, Refazer busca, Excluir em vermelho por último).
- **Alternador lista/grade** dentro da folha de filtros, não na tela. Grade: 3 colunas (capa ~112 px, título 13 px em 1 linha) quando a pessoa quer reconhecer por capa.
- **Folha de filtros** (meia altura, cresce até cheia): Série, Artista, Ano, Fonte, Ordem. Aplica na hora; o botão do pé diz «Ver 37 álbuns».
- **Carga**: 20 séries por vez; no fim, «Mostrar mais 20 · vendo 20 de 50». Guardar a posição da rolagem e as séries abertas ao voltar da tela do álbum.
- **Voltar ao topo**: botão redondo de 44 px, canto inferior direito, acima da barra de abas, só depois de 4 telas e ao rolar para cima.

**Evitar**: rolagem sem fim; páginas numeradas com alvos pequenos; filtros empilhados antes do conteúdo; primeira série aberta por padrão; índice alfabético lateral junto de setas de linha (a HIG desaconselha: https://developer.apple.com/design/human-interface-guidelines/lists-and-tables.md).

---

## 2. Detalhe do álbum com faixas e notas de várias fontes

### O que as referências fazem

**Usabilidade**
- **Controle segmentado para subvisões muito próximas**; no iPhone, no máximo cerca de 5 segmentos; larguras iguais; só texto ou só ícone; rótulos em substantivos. https://developer.apple.com/design/human-interface-guidelines/segmented-controls.md
- **Tarefa longa pede tela cheia, não folha.** HIG: para fluxos complexos, use a apresentação de tela cheia; Cancelar à esquerda, Concluir à direita. https://developer.apple.com/design/human-interface-guidelines/sheets.md
- NN/g: folha de baixo não serve a conteúdo longo; um deslize perdido fecha a leitura. https://www.nngroup.com/articles/bottom-sheet/
- **Texto de linha curto**, para evitar corte e quebra. HIG, listas.

**Beleza**
- **Apple Music, iOS 26.4 (2026) [novo]**: álbum e playlist em tela cheia, e a lista de faixas ganha um fundo de cor que «combina com a capa e a evoca». https://9to5mac.com/2026/03/25/apple-music-in-ios-26-4-has-new-design-for-albums-playlists-and-more/
- **Albums (c. 2021)**: no iPhone, deslizar a capa para cima revela faixas, créditos e estatísticas. https://www.macstories.net/reviews/albums-4-0-a-must-have-app-for-music-lovers/
- Cabeçalho que encolhe (capa grande que vira título na barra) no Apple Music e no Spotify: **de memória, sem fonte**.

### Padrão recomendado

**Tela cheia com cabeçalho que encolhe, controle segmentado preso e linhas de faixa em duas linhas.**

**Para construir**
- **Cabeçalho aberto (~300 px)**: capa de 200 px centrada (raio 10, sombra suave), título inteiro em até 2 linhas (22/700), artista · ano (15, cinza). Atrás, a própria capa desfocada e escurecida (ver seção 9). Fechar («‹» de 44 px) no canto superior esquerdo, «⋯» no direito.
- **Ao rolar**: o cabeçalho vira uma barra de 48 px com capa de 32 px + título em 1 linha. Só `transform` e `opacity`, ligados à rolagem.
- **Controle segmentado preso sob a barra (36 px de altura dentro de uma faixa de 52)**: «Original · Crítica · Popular». Três rótulos de uma palavra cabem em 361 px (cerca de 118 px cada).
- **Linha de faixa (60 px)**: posição (13, cinza, 24 px de largura), título em 1 linha (16/500) e, na **segunda linha**, os dois selos (crítica «#4», popularidade «●11») em 12 px com rótulo curto, e a duração alinhada à direita em algarismos tabulares (13). Os selos nunca disputam a linha do título: é isso que hoje corta o título em 2 letras.
- Com capa de 200 px, a dobra de 852 px mostra o cabeçalho e 5 a 6 faixas (REQ-06).
- A ordem da lista segue o segmento. O selo da fonte ativa fica em destaque; o outro, em cinza.

**Evitar**: abas roláveis de lado para 3 opções; selos na mesma linha do título; caixa de rolagem interna para as faixas; folha de meia altura para esta tela.

---

## 3. Ranquear as faixas à mão (8 a 20 linhas)

### O que as referências fazem

**Usabilidade**
- **WCAG 2.2, SC 2.5.7 (nível AA)**: tudo que se faz arrastando precisa poder ser feito com um ponteiro sem arrastar. O exemplo do W3C para lista ordenável é ter controles ao lado do item para subir e descer. Teclado sozinho não basta. O texto não trata de toque longo; como exige segurar, não conto como alternativa (inferência). https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html
- **NN/g, arrastar**: alça visível que não pareça menu; no toque, cuidado com arrastar; o item pego precisa mudar de aparência (sombra, deslocamento); os vizinhos abrem espaço em ~100 ms; no celular, mover por menu erra menos, mesmo com mais passos. https://www.nngroup.com/articles/drag-drop/
- **HIG**: as pessoas gostam de reordenar listas; no iOS, entra-se num modo de edição. https://developer.apple.com/design/human-interface-guidelines/lists-and-tables.md
- **Alvo**: WCAG 2.5.8 pede 24x24 px no mínimo; o app adota 44. https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html

**Função**
- Spotify: Editar playlist, segurar a alça e arrastar. https://community.spotify.com/t5/FAQs/How-can-I-edit-my-playlist-on-mobile/ta-p/4918572
- Plex: usuários pedem «digitar a posição» porque arrastar em lista longa cansa, e relatam que não dá para rolar enquanto se arrasta no iOS. https://forums.plex.tv/t/why-isnt-there-a-way-to-order-a-playlist-other-than-drag-and-drop-feature-request/169515
- IMDb: mudar o número da posição e os demais se ajustam; gravar a ordem é um passo explícito. https://help.imdb.com/article/imdb/track-movies-tv/lists-faq/GNQMN47VZSE7KW38
- Letterboxd, Lembretes do iOS, apps de tier list: não verifiquei.

**Beleza**
- Things 3 (ADA 2017): a referência de arrastar bem feito em lista. O prêmio está confirmado; o detalhe do gesto é **de memória, sem fonte**.
- Linear Mobile (2025) **[novo]**: «lift on touch», o item sobe ao toque. https://linear.app/now/linear-liquid-glass

### Padrão recomendado

**Alça para arrastar + «mover para…» por toque + botões subir/descer na linha escolhida, com Salvar fixo e Desfazer.** Tocar-e-colocar cobre o caso comum (levar a faixa 14 para o 2º lugar) melhor que 12 toques em «subir».

**Para construir**
- **Barra do topo (52 px), fixa**: «‹ Voltar» · título do álbum · «Salvar» (botão cheio laranja, 44 px de altura; apagado enquanto nada mudou). A janela de ranking já é tela cheia; mantém.
- **Linha (56 px)**: número da posição grande (20/700, 36 px de largura; é o dado principal), título em 1 linha (16/500), e à direita a alça «≡» de 44x44. Os selos de BEA e Spotify e a duração descem para a segunda linha em 12 px, ou somem atrás de um interruptor «Mostrar referências».
- **Mover sem arrastar**: tocar na linha a escolhe (borda laranja de 2 px, fundo elevado). Aparece uma barra fixa no pé com «↑», «↓» (56x48 cada), «Mover para…» e «Concluir». «Mover para…» abre uma folha com os números de 1 a n em grade de 5 colunas (alvos de 56x48): um toque e a faixa vai.
- **Arrastar**: só pela alça (`touch-action: none` na alça, não na linha), começa sem espera longa, a lista rola sozinha a 60 px das bordas, vizinhos animam em 100–150 ms.
- **Desfazer**: aviso no pé «Faixa movida para 2º · Desfazer» por 5 s, e «Reiniciar» no «⋯».
- **Sair com mudanças**: confirmar («Descartar mudanças?»), como a HIG pede para folha com edição pendente.

**Evitar**: arrastar como único meio (falha AA); toque longo para começar o arrasto (briga com o menu de contexto e a seleção de texto do iOS); alça com cara de menu; Salvar no fim da lista.

---

## 4. Gerar e editar playlists

### O que as referências fazem

**Usabilidade**
- **Acordeão dá problema quando o conteúdo aberto é longo**: rola-se muito para fechar ou chegar ao próximo. NN/g: https://www.nngroup.com/articles/mobile-accordions/ — seis playlists de 10 a 30 faixas são esse caso.
- **Deslizar para apagar não tem sinal visível**: reserve para ação destrutiva, não o deixe como único caminho, não o sobreponha a gestos de navegação laterais e, em ação repetitiva, ofereça Desfazer bem à vista em vez de confirmação. NN/g: https://www.nngroup.com/articles/contextual-swipe/
- **Menu de contexto nunca é o único caminho** e o item destrutivo vai por último, em vermelho. HIG: https://developer.apple.com/design/human-interface-guidelines/context-menus.md
- **Barra de abas é navegação, não ação**; ações da tela vão numa barra de ferramentas. HIG: https://developer.apple.com/design/human-interface-guidelines/tab-bars.md
- **Controle segmentado só até ~5 opções** no iPhone; acima disso, outra coisa.

**Função**
- Spotify: remover pelo «⋯» da faixa («Remover desta playlist»); reordenar só no modo Editar, pela alça. https://community.spotify.com/t5/FAQs/How-can-I-edit-my-playlist-on-mobile/ta-p/4918572
- Apple Music: a página de ajuda não abriu com conteúdo; modo de edição com «−» vermelho e alça é **de memória, sem fonte**.

**Beleza**
- Apple Music iOS 26.4 (2026) **[novo]**: playlist em tela cheia com fundo da cor da capa. https://9to5mac.com/2026/03/25/apple-music-in-ios-26-4-has-new-design-for-albums-playlists-and-more/
- Denim (finalista ADA 2025) **[novo]**: capas de playlist com efeitos de profundidade. https://developer.apple.com/design/awards/2025/ — ideia a emprestar: dar a cada playlist gerada uma capa de mosaico (4 capas de álbum), para que as seis não pareçam iguais.

### Padrão recomendado

**Uma playlist por tela, com uma faixa de fichas rolável no topo, e uma barra de ação fixa no pé.** Acordeão só no resumo de entrada.

**Para construir**
- **Tela de resumo** (logo após gerar): lista das playlists, linha de 72 px cada: mosaico 48 px, nome, «14 faixas · 58 min». No pé, fixa: «Salvar todas» (principal) e «Exportar…».
- **Tela de uma playlist**: no topo, preso, faixa de fichas com os nomes («1 · Manhã», «2 · Estrada»…), 36 px de altura em faixa de 52, rolagem lateral, a ativa em laranja. Tocar troca de playlist. Não trocar por deslize lateral da página inteira (briga com o voltar do Safari, seção 8).
- **Linha de faixa (60 px)**: capa 40 px, título (16), artista · álbum (13), duração à direita (13, tabular), «⋯» de 44x44. O «⋯» abre folha: «Mover para outra playlist ›» (lista das outras), «Mover para o topo / fim», «Remover» (vermelho, por último).
- **Modo Editar** (botão no topo direito): cada linha ganha «−» vermelho de 44 px à esquerda e alça «≡» à direita; a linha escolhida ganha a mesma barra «↑ ↓ Mover para…» do ranking. O X de remover e a duração nunca ocupam o mesmo lugar.
- **Remover**: sem confirmação; aviso «Faixa removida · Desfazer» por 5 s. Deslizar a linha para a esquerda é atalho opcional; o caminho visível é o «−» e o «⋯».
- **Barra de ação fixa no pé (56 px + área segura)**: «Salvar» (laranja, cheio) e «Exportar» (contorno). «Exportar» abre folha de meia altura: Spotify, Apple Music, Baixar JSON, cada um em linha de 56 px com o estado («Conectado como…» / «Conectar»). «Regenerar», Desfazer e Refazer ficam no «⋯» do topo; Regenerar pede confirmação porque troca tudo.
- **Playlists salvas**: lista de lotes (nome em 2 linhas, data, «6 playlists · 82 faixas»), busca presa, 20 por carga com «Mostrar mais». Tocar abre o lote na mesma tela de resumo. Sem ID cru.

**Evitar**: caixas de faixas com rolagem própria; seis acordeões abertos; deslizar como único jeito de remover; confirmação a cada remoção; exportar escondido no fim.

---

## 5. Criar e editar uma série

### O que as referências fazem

**Usabilidade**
- **Retorno de seleção**: numa lista de opções, a linha marca-se com um sinal (um visto) logo após o toque. HIG: https://developer.apple.com/design/human-interface-guidelines/lists-and-tables.md
- **Coleção (grade) é ideal para imagem**, com respiro em volta para o toque. https://developer.apple.com/design/human-interface-guidelines/collections.md
- **Folha não modal**: no iPhone, uma folha pode ficar na tela enquanto a pessoa mexe na página atrás; meia altura para revelar aos poucos, com alça. https://developer.apple.com/design/human-interface-guidelines/sheets.md
- **Uma folha por vez; folha sobre folha desorienta.** HIG e NN/g (https://www.nngroup.com/articles/bottom-sheet/).
- **Busca que filtra ao digitar, com sugestões recentes.** HIG, busca.
- **Assistente**: passos com nome, botão que diz para onde vai, poder sair e retomar. NN/g: https://www.nngroup.com/articles/wizards/

**Função**
- CLZ Music: na tela de adicionar, títulos já na lista de desejos aparecem em laranja e os já na coleção em azul. https://apps.apple.com/us/app/clz-music-cd-vinyl-database/id317997093 (via notas de versão; só função)
- Barra de seleção com contagem no pé (Fotos, Arquivos do iOS): **de memória, sem fonte**.

**Beleza**
- Albums e Longplay: grade de capas como superfície principal (fontes na seção 1).
- A auditoria já diz que a grade de 2 colunas da Home, com capas grandes, é boa: manter.

### Padrão recomendado

**Grade de capas com marca de seleção + barra de seleção fixa no pé com contagem + folha de revisão.** O defeito de hoje (o conjunto fica 900 px longe do toque) some porque a contagem anda junto do dedo.

**Para construir**
- **Topo preso**: nome da série (campo de 44 px, fonte 16, «Nome da série») e busca de artista (44 px). Abaixo, fichas de tipo (Álbuns · EPs · Ao vivo · Coletâneas) de 36 px com contagem em 12 px, rolagem lateral e sombra de corte à direita para mostrar que há mais.
- **Alternador «Buscar | Colar lista»**: controle segmentado de 2 opções.
- **Grade**: 2 colunas (capa ~172 px), título em 2 linhas (14/600), ano (12). Selecionado: anel laranja de 3 px, selo redondo de 28 px com visto no canto superior direito e a capa a 85% de brilho. Álbum que já está noutra série: etiqueta discreta «em Prog 70s». O toque inteiro no cartão alterna a seleção.
- **Barra de seleção fixa no pé (64 px + área segura)**, visível a partir do 1º escolhido: à esquerda, pilha de até 3 capas de 32 px e «7 álbuns» (toque abre a revisão); à direita, «Criar série» (laranja, 44 px de altura). Ao tocar num álbum, o número anima (120 ms). Com zero, a barra dá lugar à barra de abas.
- **Folha de revisão** (meia altura, cresce): lista dos escolhidos em linhas de 56 px, com «−» e, se a ordem importar, a alça e os botões da seção 3. Pé da folha: «Criar série».
- **Colar lista**: tela cheia com área de texto (fonte 16, altura até o teclado), exemplo de formato como texto de apoio, botão «Processar 12 linhas» preso acima do teclado. Resultado: «10 achados · 2 não achados», com as linhas falhas listadas e editáveis.
- **Editar série**: a mesma tela, já com a barra de seleção preenchida e «Salvar» no lugar de «Criar».

**Evitar**: conjunto escolhido em outra seção da página; botão de criar no fim; modo de seleção que exige toque longo para entrar; filtros cortados sem sinal de que rolam.

---

## 6. Inventário da coleção (211 CDs)

### O que as referências fazem

**Função (só o que o colecionador precisa; nunca aparência)**
- **Discogs (iOS)**: três formas de ver (lista, grade pequena, grade grande); ordem por artista, título, ano, data de entrada, selo, formato, nota ou valor; pastas; busca na coleção; valor da coleção; lista de desejos com selo de preço. A página de ajuda recusou a leitura (403); isto vem do resumo da busca. https://support.discogs.com/hc/en-us/articles/360039334454-How-To-Use-The-Collection-Feature-On-iOS · https://apps.apple.com/app/discogs/id1036449551
- **CLZ Music**: filtro no topo da tela principal por Todos / Na coleção / Lista de desejos, depois estendido a todos os estados (encomendado, à venda); ver como lista, cartões ou parede de capas; editar vários de uma vez (v6.0, 2020). https://apps.apple.com/us/app/clz-music-cd-vinyl-database/id317997093 · https://clz.com/music/mobile/whatsnew/2021
- MusicBuddy, Vinyls: não verifiquei.

**Usabilidade**
- Lista para dado em texto (HIG); segmentado para estado com poucas opções, mas **não para ações**; menu de contexto como atalho, nunca caminho único; deslizar só como atalho (NN/g).
- Contagem total sempre à vista ao filtrar (NN/g, filtros).
- 15 a 30 por carga (Baymard).

**Beleza**
- **Tide Guide (ADA 2026, Visuals and Graphics) [novo]**: prova de que um app de tabelas e números pode ganhar por visual. Não verifiquei as telas; a lição que tiro é de princípio (número grande, rótulo pequeno, uma cor de destaque). https://developer.apple.com/design/awards/
- **Things 3 (ADA 2017)**: linha de lista limpa, uma informação secundária por linha. Detalhe **de memória, sem fonte**.
- **Mela (finalista ADA 2025) [novo]**: gerenciador de coleção (receitas) reconhecido por interação. https://developer.apple.com/design/awards/2025/ Não verifiquei as telas.

### Padrão recomendado

**Linha compacta com o estado como ficha tocável, totais como fichas de filtro no topo, e seleção em lote por modo «Selecionar».**

**Para construir**
- **Cabeçalho (rola junto)**: «211 álbuns» (28/700) e o valor total («R$ 8.420» em 20/600, com a moeda). É o que a auditoria já elogia.
- **Fichas de filtro presas (52 px)**: «Todos 211 · Tenho 180 · Não tenho 19 · Desejo 12». Um toque filtra; a ativa em laranja. São ao mesmo tempo os totais e o filtro. À direita, ícone de ordem (folha: artista, título, ano, valor, data; cada um nas duas direções, como a F71) e busca.
- **Linha (72 px)**: capa 56 px; título (16/600, 1 linha); artista · ano · formato (13, cinza); à direita, valor (15/600, tabular) e, abaixo, a ficha de estado (28 px de altura visível, área de toque 44).
- **Mudar estado em um toque**: tocar na ficha abre um menu de 3 opções ancorado nela, linhas de 48 px, a atual com visto. Dois toques, sem sair da lista, e funciona igual para os três estados. Um segmentado de 3 por linha não cabe com valor e título em 393 px.
- **Toque na linha**: abre a tela do álbum (a mesma da seção 2) com um bloco de inventário no topo: estado em controle segmentado de 3 (aqui cabe), valor, formato, «Editar», e os links de compra em linhas de 48 px com o nome da loja.
- **Deslizar** (atalho, não único): esquerda revela «Editar»; não pôr «Excluir» em deslize longo.
- **Em lote**: «Selecionar» no topo direito; as linhas ganham caixa de 28 px à esquerda; barra no pé «3 selecionados · Estado ▾ · Excluir». 
- **Carga**: 30 por vez, «Mostrar mais 30 · vendo 30 de 211»; posição guardada ao voltar.
- **Edição**: manter a janela atual (a melhor do app), só com campos a 16 px e alvos de 44.

**Evitar**: cartão de 400 px por álbum; `select` nativo pequeno na linha; valor sem moeda; apagar por deslize sem Desfazer; copiar a aparência do Discogs.

---

## 7. O fluxo de 4 passos do Blend

### O que as referências fazem

**Usabilidade**
- **Assistente**: indicador com todos os passos e o atual em destaque, rótulo curto por passo, botões com o nome do destino («Escolher receita ›» em vez de «Próximo»), botão de voltar explícito, ordem forçada, passos feitos marcados, e guardar o estado se a pessoa sair. NN/g: https://www.nngroup.com/articles/wizards/
- **Folha em fluxo de vários passos**: 1º passo com Cancelar à esquerda; passos seguintes com Voltar; Concluir só no último. HIG: https://developer.apple.com/design/human-interface-guidelines/sheets.md
- **Lista longa de escolha**: busca em linha acima da lista, presa, filtrando ao digitar (HIG, busca); nada de rolagem dentro de rolagem (auditoria, achado 15).
- **Acordeão serve a formulário de vários passos**: passos fechados mostram o caminho. NN/g, acordeões.

**Beleza**
- **Tiimo (iPhone App of the Year 2025) [novo]** e **Structured (finalista ADA 2026) [novo]**: planejadores passo a passo reconhecidos pela clareza. Não verifiquei as telas; cito só como prova de que fluxo guiado e simples é premiado. https://www.apple.com/newsroom/2025/12/apple-unveils-the-winners-of-the-2025-app-store-awards/ · https://developer.apple.com/design/awards/
- A auditoria diz que o Blend é a melhor tela do app no celular: aqui é acerto, não redesenho.

### Padrão recomendado

**Um passo por tela, indicador de 4 passos no topo e «Próximo» fixo no pé com o resumo da escolha.**

**Para construir**
- **Indicador preso (48 px)**: 4 segmentos com número e rótulo de 12 px («1 Séries · 2 Receita · 3 Ingredientes · 4 Misturar»); feito = visto; atual = laranja; futuros = cinza. Tocar num passo feito volta a ele.
- **Passo 1, séries**: busca presa (44 px) + «Selecionar todas / Limpar»; lista na própria página, linha de 56 px com caixa de 28 px à esquerda, nome, «12 álbuns». 49 séries rolam com a página, sem caixa interna.
- **Passo 2, receita**: cartões de largura total com nome (17/600) e descrição inteira em até 3 linhas (14), seleção única com anel laranja.
- **Passo 3, ingredientes**: controles em linhas de 56 px; números com «−» e «+» de 44 px em vez de campo que abre teclado.
- **Passo 4**: resumo do que foi escolhido (cada item leva de volta ao passo) e o botão «Misturar».
- **Barra do pé fixa (64 px + área segura)**: à esquerda, o resumo («5 séries · 61 álbuns»); à direita, o botão com o nome do destino («Receita ›»), apagado até haver escolha, com o motivo escrito («Escolha ao menos 1 série»). «‹ Voltar» no topo esquerdo.
- **Estado**: guardar em `sessionStorage`; ao voltar à tela, retomar no passo em que estava.

**Evitar**: lista de séries em caixa de 256 px; «Próximo» genérico no fim da página; rótulos de passo a 10 px; travar o passo sem dizer por quê.

---

## 8. Particularidades do web app no iPhone que mexem com estas telas

- **Rolagem aninhada e encadeada**: `overscroll-behavior: contain` numa folha impede que a rolagem passe para a página atrás; `none` também tira o efeito de elástico e o puxar-para-atualizar. MDN ainda marca a propriedade como «disponibilidade limitada»; não confirmei a versão do Safari no iOS. https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior — Regra prática: uma só área que rola por tela; folha aberta trava o `body`.
- **Deslizar da borda para voltar (Safari)**: o gesto nasce na borda esquerda. Por isso: nada de carrossel de página inteira nem de deslize de linha que comece a menos de ~20 px da borda; trocar de playlist por fichas, não por deslize. NN/g pede o mesmo cuidado com gestos sobrepostos: https://www.nngroup.com/articles/contextual-swipe/ (o valor de 20 px é recomendação minha).
- **Toque longo**: no iOS, abre o menu de contexto do sistema em links e imagens e a seleção de texto (**de memória, sem fonte**). Não usar toque longo como gatilho; nas capas e linhas, `-webkit-touch-callout: none` e `user-select: none`.
- **Teclado sobre barras fixas**: o teclado encolhe a área visual sem mudar a de layout; `window.visualViewport` (altura, `offsetTop`, evento `resize`) permite reposicionar a barra, e a MDN avisa de possível tremor ao rolar. https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport — Regra prática: com um campo em foco, esconder a barra de abas e a de ação, ou prender o botão ao topo do teclado só nas telas de digitação (colar lista, nome da série).
- **Vibração**: `navigator.vibrate` não funciona no Safari (a MDN diz «disponibilidade limitada»; que o Safari não o tem é **de memória**). https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate — Existe um truque: um `<input type="checkbox" switch>` (Safari 17.4, https://webkit.org/blog/15054/an-html-switch-control/) vibra ao ser clicado via `label`, e bibliotecas se apoiam nisso (https://unpkg.com/ios-haptics@3.1.1/README.md). Há pedido no WebKit para restringir (https://bugs.webkit.org/show_bug.cgi?id=285120). **Não depender**: o retorno de toque do app tem de ser visual (seção 9).
- **`:hover` preso depois do toque**: pôr todo estilo de `:hover` dentro de `@media (hover: hover)` e dar ao toque um estado `:active` próprio (**de memória, sem fonte**; prática corrente).
- **Puxar para atualizar**: no Safari a página recarrega ao puxar do topo; no app aberto pelo ícone, não há esse gesto (**não verifiquei** no iOS 26). Com playlist não salva, isso perde trabalho: `overscroll-behavior-y: contain` no `html` e o rascunho guardado, como já se faz.
- **iOS 26 (2025–2026) [novo]**: o Safari deixou de honrar `theme-color` e tinge as barras pela cor de fundo do `body`; com um elemento fixo aberto (folha, diálogo), usa a cor desse elemento. Manter `viewport-fit=cover` se usar `env(safe-area-inset-*)`. https://benfrain.com/ios26-safari-theme-color-tab-tinting-with-fixed-position-elements/ · https://bugs.webkit.org/show_bug.cgi?id=301756 — Há relato de que `theme-color` ainda vale para o web app instalado; fonte fraca, **não verifiquei**. Desde o iOS 26, todo site posto na tela de início abre como web app (resumo de busca, **não verifiquei** na fonte primária). Consequência: fundo do `body` e das folhas na mesma cor escura do app.

---

## 9. Linguagem visual no celular para ESTE app

O app mantém o que tem: fundo quase preto (`#0A0A0C`), laranja `#FF8800`, Syne nos títulos e Inter no texto (lidos de `public/css/tech-theme.css` e `index.css`). O que muda é a disciplina.

### 9.1 A capa é a protagonista
- Fonte: Albums e Longplay são elogiados justamente pelo foco na capa (MacStories, seção 1); o Apple Music de 2026 tinge a tela do álbum com a cor da capa (9to5Mac).
- **Recomendação**: capas sempre quadradas, com raio 6 px até 56 px de lado, 10 px acima disso, e borda interna de 1 px `rgba(255,255,255,.08)` para capas escuras não sumirem no fundo. Tamanhos fixos: 32, 40, 48, 56, 112, 172, 200.
- **Na tela do álbum**: a própria capa, ampliada, com `filter: blur(40px) saturate(1.4)` e um véu `rgba(10,10,12,.65)`, vira o fundo do cabeçalho, apagando em gradiente até `#0A0A0C` na altura do controle segmentado. Custa pouco no CSS e dá a cada álbum uma cor sua (recomendação minha, inspirada na fonte acima).
- A HIG pede escurecer imagens de fundo branco no modo escuro para não «brilharem»: capas muito claras em miniatura, a 92% de brilho. https://developer.apple.com/design/human-interface-guidelines/dark-mode.md

### 9.2 Escala de tipo em 393 px
- Fonte: a HIG dá 17 pt como padrão e 11 pt como mínimo no iOS, e a escala padrão: Título grande 34/41, Título 1 28/34, Título 2 22/28, Título 3 20/25, Corpo 17/22, Chamada 16/21, Subtítulo 15/20, Nota 13/18, Legenda 12/16. Evitar pesos leves; preferir Regular, Medium, Semibold, Bold. Poucas famílias. https://developer.apple.com/design/human-interface-guidelines/typography.md
- **Recomendação** (6 degraus, nada fora deles; o piso do app é 12, pelo REQ-02):

| Uso | Família | Tamanho/linha | Peso |
|---|---|---|---|
| Título da tela | Syne | 28/34 | 700 |
| Título de seção, nome do álbum no detalhe | Syne | 22/28 | 700 |
| Título de linha, botão | Inter | 16/22 | 600 |
| Corpo, campos | Inter | 16/22 | 400 |
| Secundário (artista, contagem) | Inter | 13/18 | 400–500 |
| Selo, legenda, rótulo de passo | Inter | 12/16 | 600 |

- Syne só em títulos de 22 px para cima; em tamanho pequeno ela perde leitura (recomendação minha). Números (duração, valor, posição) com `font-variant-numeric: tabular-nums`. Caixa alta só em rótulos de 12 px, com `letter-spacing: .04em`; fim dos cabeçalhos «01 // SERIES CONFIGURATION» em caixa alta grande.

### 9.3 Ritmo de espaço
- **Recomendação**: grade de 4 px; passos 4, 8, 12, 16, 24, 32. Margem lateral 16. Entre seções 24. Dentro da linha: 12 entre capa e texto, 2 a 4 entre título e secundário. Alturas de linha fixas: 56 (uma linha de texto), 64 e 72 (duas linhas com capa). Separador de 1 px `rgba(255,255,255,.08)` começando no texto, não na capa (padrão das listas do iOS, **de memória**).
- A NN/g pede cabeçalho fixo o menor possível, para a tela ficar com o conteúdo: topo de 48 a 56 px. https://www.nngroup.com/articles/sticky-headers/

### 9.4 Profundidade no escuro
- Fonte: no modo escuro, o iOS usa dois conjuntos de fundo, **base** (mais escuro, recua) e **elevado** (mais claro, avança). Contraste mínimo de 4,5:1, e 7:1 para texto pequeno em cores próprias. https://developer.apple.com/design/human-interface-guidelines/dark-mode.md
- Fonte **[novo]**: o Liquid Glass (2025) é uma camada só para **controles e navegação** que flutua sobre o conteúdo; **não usar vidro na camada de conteúdo**; usar com parcimônia; a variante normal desfoca e ajusta a luminosidade para manter a leitura. A barra de abas do iOS 26 flutua sobre o conteúdo. https://developer.apple.com/design/human-interface-guidelines/materials.md · https://developer.apple.com/design/human-interface-guidelines/tab-bars.md
- Fonte **[novo]**: na web, o vidro que funciona no Safari é `backdrop-filter` com desfoque e saturação, fundo translúcido, borda clara fina e sombra suave. A refração por filtro SVG só é confiável no Chromium; o Safari aceita a sintaxe e não desenha nada. https://frontendmasters.com/blog/?p=6644 · https://dev.to/devyatov/liquid-glass-on-the-web-6-ways-to-build-it-with-css-and-svg-3m07 · https://aave.com/design/building-glass-for-the-web
- Fonte **[novo]**: Linear Mobile (2025) fez vidro próprio, **sem refração**, por leitura em telas densas, e dá contorno sólido aos vidros quando «Aumentar contraste» está ligado. https://linear.app/now/linear-liquid-glass
- **Recomendação**: três níveis. Base `#0A0A0C`. Elevado 1 (cartões, linha escolhida) `#17171A`. Elevado 2 (folhas, menus) `#1F1F23`, com borda superior de 1 px `rgba(255,255,255,.10)`. **Vidro só em três lugares**: barra de abas, barra do topo e barra de ação do pé: `background: rgba(18,18,20,.72); backdrop-filter: blur(20px) saturate(1.6);` com `-webkit-` e borda de 1 px `rgba(255,255,255,.08)`. Sem refração. Com `prefers-reduced-transparency` ou `prefers-contrast: more`, fundo opaco e borda sólida. Sombra não se vê no preto: quem separa os planos é a claridade do fundo e a borda. O brilho neon de `neon.css` fica fora do celular (recomendação minha: ele briga com as capas).

### 9.5 O laranja: quanto e onde
- Fonte: não usar a mesma cor para coisas diferentes; cor de marca que marca o que é tocável não pode pintar texto parado. Em barras, cor com parcimônia e reservada à ação principal, no **fundo** do botão; **não** colorir o fundo de vários controles. Não depender só de cor. https://developer.apple.com/design/human-interface-guidelines/color.md
- **Recomendação**: laranja em quatro papéis e só neles: (1) o botão principal da tela, um por tela; (2) o estado ligado (aba ativa, ficha ativa, passo atual, caixa marcada); (3) o anel de seleção; (4) links de texto. Nunca em títulos, selos de fonte, ícones decorativos ou bordas de cartão. Meta: menos de 10% da área de qualquer tela.
- **Texto sobre laranja**: escuro (`#0A0A0C`), não branco. Pela minha conta, branco sobre `#FF8800` dá cerca de 2,4:1 e falha; preto dá cerca de 8,8:1; e `#FF8800` sobre o fundo do app dá cerca de 8:1. Conferir com ferramenta antes de fixar.
- Cinzas: texto principal `#F2F2F4`; secundário `#A0A0A8` (cerca de 7:1 sobre a base, minha conta); terciário `#6E6E76` só para texto de 16 px ou mais ou para ícone parado. Estados do inventário: verde, cinza e âmbar **com rótulo escrito**, nunca só a cor.

### 9.6 Anatomia de linha e de cartão
- **Linha**: [capa] 12 [título / secundário] espaço [dado à direita] [ação de 44]. No máximo 2 linhas de texto, 1 dado à direita, 1 ação visível; o resto vai para o «⋯». Fonte: texto de linha curto; título só, com o detalhe na tela seguinte (HIG, listas).
- **Cartão**: só quando a imagem é o conteúdo (grade de capas, receita do Blend). Fundo elevado 1, raio 12, respiro interno 12, sem borda colorida.
- **Fichas**: 36 px de altura, raio total, 14/500; ativa = fundo laranja com texto escuro; inativa = elevado 1.
- **Botões**: 48 px de altura, raio 12. Principal cheio; secundário com contorno `rgba(255,255,255,.16)`; destrutivo em texto vermelho, nunca cheio.

### 9.7 Movimento
- Fonte: movimento com propósito, breve e preciso; evitar animar o que acontece a toda hora; a pessoa pode interromper; respeitar quem pede menos movimento. https://developer.apple.com/design/human-interface-guidelines/motion.md
- Fonte: cabeçalho que volta em 300–400 ms (NN/g, cabeçalhos); vizinhos que abrem espaço no arrasto em ~100 ms (NN/g, arrastar).
- **Recomendação** (as durações são minhas, dentro dessas faixas; a página de tokens de movimento do Material 3 não abriu, **não verifiquei**):

| O que anima | Duração | Curva |
|---|---|---|
| Toque (linha ou botão escurece, escala .98) | 80–120 ms | linear |
| Ficha, visto, contador da seleção | 120–160 ms | `ease-out` |
| Abrir série, trocar de segmento | 200–240 ms | `cubic-bezier(.2,.8,.2,1)` |
| Folha sobe / desce | 320 ms / 240 ms | a mesma, saindo mais rápido |
| Cabeçalho que some e volta | 300 ms | `ease-out` |

- Animar só `transform` e `opacity`. Com `prefers-reduced-motion`, trocar deslize por esmaecer de 120 ms. Como não há vibração na web, **o retorno do toque é visual**: todo alvo tem `:active` visível em menos de 100 ms. Linear chama de «lift on touch» (2025).

### 9.8 Vazio e carga
- Fonte: menos de 1 s, nada (indicador só pisca); de 1 a 10 s, esqueleto para página inteira e rodinha para um bloco; mais de 10 s, barra de progresso com estimativa. O esqueleto deve parecer a página final e ter animação discreta. https://www.nngroup.com/articles/skeleton-screens/
- **Recomendação**: esqueleto com as alturas reais de linha (72 px, quadrado de 56 no lugar da capa, duas barras de 12 px), cor elevado 1, brilho passando em 1,2 s; sem brilho com movimento reduzido. A capa entra esmaecendo em 160 ms sobre um quadrado da cor de fundo. Gerar playlists e exportar: progresso com texto («Enviando 3 de 6 ao Spotify»). Vazio: um ícone de 48 px em cinza, uma frase do que falta e **um** botão laranja com a próxima ação («Você ainda não tem séries. Criar a primeira»).

### 9.9 Ícones
- Fonte: preferir símbolos preenchidos na barra de abas, com rótulo de uma palavra; cada item de menu com rótulo curto; ícones familiares para ações comuns. https://developer.apple.com/design/human-interface-guidelines/tab-bars.md · https://developer.apple.com/design/human-interface-guidelines/context-menus.md
- **Recomendação**: uma família só, de traço (1,75 px) em linhas e barras, preenchida na aba ativa. Tamanhos: 20 px em linha, 24 px em barras, sempre dentro de alvo de 44. Ícone sem texto só para os universais (voltar, fechar, buscar, «⋯», alça); todo o resto leva rótulo (a auditoria achou quatro ações só com ícone e dica de pairar). Cor: cinza secundário em repouso, texto principal ao toque, laranja só no estado ligado.

---

## Tabela final: tela × padrão recomendado × fonte

| Tela | Padrão recomendado | Referência de usabilidade (ano) | Referência de beleza (ano) |
|---|---|---|---|
| Albums: lista | Séries fechadas em acordeão, cabeçalho da série aberta preso, linha de álbum de 64 px, «Mostrar mais · vendo 20 de 50», posição guardada | NN/g acordeões e alternativas à paginação (s/ data conferida): https://www.nngroup.com/articles/mobile-accordions/ · https://www.nngroup.com/articles/alternatives-pagination-listing-pages/ ; Baymard 15–30 itens: https://baymard.com/blog/number-of-items-loaded-by-default | Albums, Adam Linder (c. 2021): https://www.macstories.net/reviews/albums-4-0-a-must-have-app-for-music-lovers/ ; Longplay (c. 2023) |
| Albums: busca, filtros, ordem | Busca presa que filtra ao digitar; «Filtros (n)» abre folha; fichas dos filtros ligados; contagem sempre à vista; voltar ao topo após 4 telas | Apple HIG busca (rev. 2026): https://developer.apple.com/design/human-interface-guidelines/search-fields.md ; NN/g filtros e voltar ao topo: https://www.nngroup.com/articles/mobile-faceted-search/ · https://www.nngroup.com/articles/back-to-top/ | Albums (c. 2021): filtros guardados numa tira; Apple Music iOS 26 (2025) **[novo]**: itens fixados, https://www.macrumors.com/guide/ios-26-music/ |
| Detalhe do álbum | Tela cheia; capa de 200 px com fundo da cor da capa; cabeçalho que encolhe; segmentado de 3 preso; faixa em 2 linhas com selos embaixo | Apple HIG segmentado (até ~5 no iPhone) e folhas (rev. 2026): https://developer.apple.com/design/human-interface-guidelines/segmented-controls.md · https://developer.apple.com/design/human-interface-guidelines/sheets.md | Apple Music iOS 26.4 (2026) **[novo]**: https://9to5mac.com/2026/03/25/apple-music-in-ios-26-4-has-new-design-for-albums-playlists-and-more/ |
| Ranking de faixas | Alça + tocar para escolher + «↑ ↓ Mover para…» numa barra do pé; Salvar fixo no topo; Desfazer por 5 s | WCAG 2.2 SC 2.5.7 (2023): https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html ; NN/g arrastar: https://www.nngroup.com/articles/drag-drop/ | Things 3 (ADA 2017): https://culturedcode.com/things/blog/2017/06/back-from-wwdc/ ; Linear Mobile (2025) **[novo]**: https://linear.app/now/linear-liquid-glass |
| Playlists geradas | Resumo em lista + uma playlist por tela com fichas no topo; modo Editar; remover com Desfazer; barra do pé «Salvar · Exportar» | NN/g deslizar contextual e acordeões: https://www.nngroup.com/articles/contextual-swipe/ ; Apple HIG menus de contexto e barra de abas (rev. 2025–2026): https://developer.apple.com/design/human-interface-guidelines/context-menus.md | Apple Music iOS 26.4 (2026) **[novo]**; Denim, finalista ADA (2025) **[novo]**: https://developer.apple.com/design/awards/2025/ |
| Playlists salvas | Lista de lotes com busca presa, nome em 2 linhas, «Mostrar mais»; abrir o lote na tela de resumo | NN/g alternativas à paginação; Baymard 15–30 | Apple Music (2025–2026) **[novo]**, biblioteca |
| Exportar | Folha de meia altura com Spotify, Apple Music e JSON em linhas de 56 px, cada uma com o estado da conexão | Apple HIG folhas, meia altura (rev. 2026); NN/g folha de baixo: https://www.nngroup.com/articles/bottom-sheet/ | Folha de compartilhar do iOS, citada na HIG (rev. 2026) |
| Criar e editar série | Grade de 2 colunas com marca de seleção; barra de seleção no pé («7 álbuns · Criar série»); folha de revisão; «Colar lista» em tela cheia | Apple HIG listas, coleções e folha não modal (2023–2026): https://developer.apple.com/design/human-interface-guidelines/collections.md ; NN/g assistentes: https://www.nngroup.com/articles/wizards/ | Albums (c. 2021) e Longplay (c. 2023): grade de capas |
| Inventário | Fichas de total que filtram; linha de 72 px com valor e ficha de estado tocável (menu de 3); «Selecionar» para lote; 30 por carga | Função: Discogs e CLZ (só função): https://apps.apple.com/app/discogs/id1036449551 · https://apps.apple.com/us/app/clz-music-cd-vinyl-database/id317997093 ; Apple HIG listas e menus (2023–2026) | Things 3 (ADA 2017); Tide Guide, vencedor ADA (2026) **[novo]**: https://developer.apple.com/design/awards/ — telas não verificadas |
| Blend | Um passo por tela; indicador de 4 passos; lista de séries na página com busca; «Próximo» fixo com nome do destino e resumo | NN/g assistentes: https://www.nngroup.com/articles/wizards/ ; Apple HIG folhas em vários passos (rev. 2026) | Tiimo, App of the Year (2025) **[novo]** e Structured, finalista ADA (2026) **[novo]** — telas não verificadas |
| Barras (topo, abas, ação) | Vidro escuro com desfoque, sem refração; uma só barra de ação por tela; laranja só na ação principal | Apple HIG materiais, cor e barra de abas (2025–2026) **[novo]**: https://developer.apple.com/design/human-interface-guidelines/materials.md · https://developer.apple.com/design/human-interface-guidelines/color.md | Linear Mobile (2025) **[novo]**; vidro em CSS (2025) **[novo]**: https://frontendmasters.com/blog/?p=6644 |
| Carga e vazio | Esqueleto com as alturas reais; progresso com texto nas tarefas longas; vazio com uma ação | NN/g esqueletos: https://www.nngroup.com/articles/skeleton-screens/ | Vocabulary, finalista ADA (2025) **[novo]** — telas não verificadas |

## O que não verifiquei

- **Nenhum app foi aberto num aparelho.** As descrições vêm de páginas de ajuda, resenhas e fóruns. Detalhes de tela do Apple Music, Spotify e Things 3 marcados «de memória» precisam de conferência no iPhone do MJRP.
- **Páginas que não abriram**: ajuda do Discogs para iOS (403); ajuda do Spotify sobre editar playlists (página fora do ar; usei o FAQ da comunidade); guia do iPhone da Apple sobre playlists e ordenação da biblioteca (só o índice veio); Baymard sobre «Carregar mais» (só o título; usei outro artigo deles); Material 3 (as páginas não entregam o texto): **nenhuma diretriz do Material 3 entrou no relatório**.
- **Apps sem fonte**: Letterboxd (ordenar lista), Plexamp, Tidal, Doppler, Sofa, MusicBuddy, Vinyls, Lembretes do iOS, apps de tier list, RateYourMusic no celular. Marvis Pro e Musicboard: só a página da loja e resenhas de usuário.
- **Catálogos de desenho**: Awwwards, Godly, Mobbin e Land-book não devolveram nada confirmável em 2025–2026 para música ou coleção. Não achei um **web app** premiado recente nesta categoria; as referências novas são apps nativos.
- **Telas não vistas** dos premiados Tide Guide, Mela, Structured, Tiimo, Vocabulary e Denim: confirmei o prêmio, não o desenho.
- **Datas**: as resenhas do MacStories não trazem a data na página lida; «c. 2021» e «c. 2023» são estimativas. As páginas da NN/g não tiveram o ano conferido.
- **Safari no iOS 26**: comportamento de `theme-color` no app instalado, puxar-para-atualizar no modo tela cheia, versão em que `overscroll-behavior` entrou. Testar no aparelho.
- **Contrastes da seção 9**: contas minhas, aproximadas. Conferir com ferramenta.
- **Durações de animação e medidas em px**: onde não há fonte ao lado, são recomendação minha.
