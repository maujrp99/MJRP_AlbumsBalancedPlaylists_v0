---
type: research
subject: "Conferência das fontes do benchmark de UX no celular (F76): reports/audits/2026-11-20-mjrpalbumblender-v0-mobile-ux-benchmark.md"
judged: "2026-11-20"
who_judged: separate-agent
method: "cada URL do relatório aberta com WebFetch (sem identidade falsa); julgamento contra o texto devolvido; contas de contraste refeitas em script"
---

# Conferência do benchmark de UX no celular · F76

## Veredito

**As fontes de usabilidade (WCAG, HIG, NN/g) em geral dizem o que o relatório diz. As fontes de «beleza» de apps e as de vidro em CSS são as fracas. Quatro afirmações não têm apoio na página citada, duas páginas não abriram, e há contradições internas que viram tela errada se forem seguidas ao pé da letra.**

Contagem (64 pares afirmação × URL; algumas URLs foram divididas em duas afirmações):

| Julgamento | Quantos |
|---|---|
| SUPPORTED (a página diz) | 42 |
| PARTLY (assunto certo, não diz a coisa específica) | 16 |
| UNSUPPORTED (não diz, ou diz outra coisa) | 4 |
| UNREACHABLE (403) | 2 |

Os 4 sem apoio: Plex (rolar ao arrastar no iOS), CLZ na App Store (laranja/azul, filtro, parede de capas, v6.0 de 2020), frontendmasters (nada sobre Safari ou Chromium) e aave (não descreve a receita nem a tese citadas). Os 2 que não abriram: ajuda do Discogs e «novidades» do CLZ (ambos 403; o relatório já avisava do Discogs, não do CLZ).

Pontos que o pedido mandou olhar com atenção:
- **WCAG 2.2 SC 2.5.7**: o relatório acerta. Nível AA; exige alternativa de ponteiro único sem arrastar, salvo se arrastar for essencial; o exemplo do W3C é tocar no item e aparecer controle de subir/descer; teclado igual não basta; a página não fala de toque longo. A inferência do relatório sobre toque longo é honesta e está marcada. A página **não traz o ano 2023** (só «atualizada em 10 ago 2026»); o «(2023)» da tabela final vem de fora. «É exigência» só vale se o produto declarar AA.
- **WCAG 2.5.8**: 24 por 24 px, AA. Correto.
- **Apple Music no iOS 26.4**: confirmado (9to5Mac, 25/03/2026): tela cheia para álbum e playlist; fundo que «combina com a capa e a evoca». Fixar até seis itens (MacRumors): confirmado.
- **Prêmios**: Webby 2025 — Replay '24 é **indicado** (nominee), não vencedor; o relatório diz «indicado», certo. ADA 2025 — Denim (Delight and Fun), Mela (Interaction), Vocabulary (Visuals and Graphics) são finalistas, certo. ADA 2026 — Tide Guide é vencedor em Visuals and Graphics e finalista em Interaction; Structured é finalista em Inclusivity, certo. Tiimo, iPhone App of the Year 2025, certo (04/12/2025). Things: o post diz que foi o segundo prêmio do app, mas não escreve «Things 3» nem «2017» no texto (o ano está só na URL).
- **Datas**: as resenhas do MacStories não têm data na página (Albums, Longplay 2.0). A do Longplay para Mac aponta para julho de 2025 por inferência. O «c. 2021» e o «c. 2023» continuam sem prova. O Roon ARC Focus é de 27/04/2026, ok; a versão 1.77 vem de post vizinho, não do corpo.

## Tabela: afirmação × URL × julgamento × o que a página diz

Sigla: S = SUPPORTED, P = PARTLY, U = UNSUPPORTED, X = UNREACHABLE.

| # | Afirmação do relatório | URL | J | O que a página diz |
|---|---|---|---|---|
| 1 | SC 2.5.7 exige alternativa sem arrastar; exemplo de subir/descer; teclado não basta; toque longo não conta | w3.org/WAI/WCAG22/Understanding/dragging-movements.html | S | «achieved by a single pointer without dragging, unless dragging is essential»; AA; exemplo de lista com controles de «moving the element up or down»; «keyboard equivalence … does not automatically meet». Sem toque longo. |
| 2 | 2.5.8 pede 24x24 px | …/target-size-minimum.html | S | «at least 24 by 24 CSS pixels», AA, com exceções. |
| 3 | Apple Music iOS 26.4: tela cheia e fundo da cor da capa | 9to5mac.com/2026/03/25/… | S | Layout de tela cheia; lista de faixas com cor de fundo que «complements the artwork». |
| 4 | Things 3, ADA 2017, o segundo do app | culturedcode.com/things/blog/2017/06/back-from-wwdc/ | P | Diz que é o segundo prêmio (o primeiro em 2009, no Mac). Não escreve «Things 3» nem «2017». |
| 5 | Segmentado: até ~5 no iPhone, larguras iguais, só texto ou só ícone, substantivos | HIG segmented-controls | S | «no more than about five segments on iPhone»; larguras iguais; não misturar texto e imagem; substantivos. |
| 6 | Tela cheia para fluxo longo; Cancelar à esquerda/Concluir à direita; meia altura; 1º passo Cancelar, depois Voltar; confirmar descarte | HIG sheets | S | Tudo presente. Folha única: Cancelar à esquerda, Concluir à direita; passos: Cancelar no 1º, Voltar depois; deslizar para fechar com mudanças pede confirmação. |
| 7 | Folha de baixo não serve a conteúdo longo; deslize perdido fecha; folha sobre folha desorienta | NN/g bottom-sheet | S | Confirma os três. |
| 8 | Lista para texto, coleção para imagem; reordenar; modo de edição; visto após toque; sem índice junto de setas; texto curto | HIG lists-and-tables | S | Presentes. |
| 9 | Coleção é ideal para imagem; tabela para texto; respiro | HIG collections | S | Presentes. |
| 10 | Busca filtra ao digitar; campo em linha acima da lista, preso; Música como exemplo; sugestões recentes | HIG search-fields | S | Presentes, inclusive «people can navigate to their library and use an inline search field» no app Music. |
| 11 | Rolagem sem fim é ruim para achar algo; paginação ou «Carregar mais» | NN/g infinite-scrolling-tips | P | Desaconselha quando se procura algo específico. **Não recomenda** paginação nem «Carregar mais»; diz que depende dos objetivos. |
| 12 | «Mostrar mais» é o meio-termo no celular; dizer quanto falta («Vendo 40 de 333»); voltar ao mesmo ponto | NN/g alternatives-pagination-listing-pages | P | «Show More» é «especialmente bom» no celular; o exemplo «Viewing 40 of 333» existe. **Não chama de meio-termo.** Voltar ao ponto é recomendado, não exigido. |
| 13 | 15 a 30 itens por carga no celular, «Carregar mais», carga preguiçosa de imagens | baymard.com/blog/number-of-items-loaded-by-default | P | «15–30 products on mobile … all at once»; «Load More» é o melhor método. É sobre lista de **produtos de loja**; a preguiça é de conjuntos, não de imagens. |
| 14 | Filtros em bandeja, rótulo em palavra, resultado na hora, contagem sempre visível | NN/g mobile-faceted-search | S | Os quatro pontos estão. |
| 15 | Acordeão em página longa, fechado por padrão, cabeçalho aberto preso, página sem pular | NN/g mobile-accordions | P | Cabeçalho preso (Amazon) e «não rolar a página ao abrir» estão. «Fechado por padrão» é só implícito; «seções independentes» não aparece. Avisa que acordeão com conteúdo longo cansa. |
| 16 | Acordeão serve a formulário de vários passos | NN/g mobile-accordions | S | «Collapsing each step under an accordion can be an effective way of conveying the form workflow». |
| 17 | Voltar ao topo: só após 4 telas, canto inferior direito, aparece ao rolar para cima | NN/g back-to-top | P | «longer than 4 screens» e «lower right» estão. «Aparece ao rolar para cima» é sugestão, e «só» não está escrito. |
| 18 | Cabeçalho some ao descer e volta ao subir, 300–400 ms, **fundo opaco**, o menor possível | NN/g sticky-headers | S | Tudo. Atenção: «must be an opaque color … translucent headers reduce contrast». Ver contradição C2. |
| 19 | Arrastar: alça visível, cuidado no toque, item muda de aparência, vizinhos ~100 ms, menu erra menos no celular | NN/g drag-drop | S | Todos, com a ressalva «can be less error-prone» (não «sempre»). |
| 20 | Deslizar sem sinal; reservar a destrutivo; não único caminho; não brigar com gestos laterais; Desfazer em ação repetitiva | NN/g contextual-swipe | P | Sinal ausente, «limit to destructive», não interferir com outros deslizes, Desfazer: estão. «Não deixar como único caminho» é só «take caution». Nenhuma menção a 20 px (o relatório marca como seu). |
| 21 | Assistente: indicador, rótulos, botão com destino, Voltar, ordem, passos marcados, guardar estado | NN/g wizards | S | Quase tudo; «passos feitos marcados» é implícito. |
| 22 | Esqueleto: <1 s nada; 1–10 s esqueleto/rodinha; >10 s barra; parecer a página; animação discreta | NN/g skeleton-screens | S | Confirma; sobre animação diz que pode distrair e causar problema de acessibilidade (não pede animação). |
| 23 | Liquid Glass: camada de controles, não no conteúdo, com parcimônia; variante normal desfoca e ajusta luminosidade | HIG materials | S | Todos. É guia de app nativo, não de web. |
| 24 | Cor: não usar a mesma cor para coisas diferentes; parcimônia em barras; cor no **fundo** do botão principal; não colorir vários controles | HIG color | P | Presente para Liquid Glass: «reserve it for … primary actions», «Refrain from adding color to the background of multiple controls». **Não** diz nada sobre «estado ligado», anel de seleção ou links em cor de marca. Ver C1. |
| 25 | Modo escuro: base/elevado; contraste mínimo 4,5:1, 7:1 para texto pequeno; escurecer fundo branco de imagem | HIG dark-mode | S | Presentes. O «92%» é do relatório. |
| 26 | Tipo: 17 pt padrão, 11 pt mínimo; escala 34/41 … 12/16; evitar pesos leves; poucas famílias | HIG typography | S | Tabela do tamanho padrão confere linha a linha. |
| 27 | Movimento breve; evitar o que acontece toda hora; interromper; respeitar movimento reduzido | HIG motion | P | Breve e preciso, evitar em interações frequentes, «let people cancel motion» estão. «Make motion optional» fala de alternativas (háptico, áudio), não cita a configuração de movimento reduzido. |
| 28 | Barra de abas é navegação; símbolos preenchidos; flutua no iOS 26; Música com mini-player | HIG tab-bars | S | Presentes (MiniPlayer da Música incluso). Também: «Make sure the tab bar is visible» (ver C8). |
| 29 | Menu de contexto nunca único caminho; destrutivo por último em vermelho; rótulo curto | HIG context-menus | S | Presentes. |
| 30 | Albums: «beautifully designed», grade com tamanho num «⋯», 9 ordens, 13 filtros, Quick Actions, deslizar a capa revela faixas | macstories … albums-4-0 | S | Todos confirmados. Sem data na página. |
| 31 | Longplay: parede de capas, deslizar revela 8 ordens, «My Library» abre coleções | macstories … longplay-2-0 | S | Confirmado; «emphasizing album art». Sem data. |
| 32 | Longplay Mac: «beautiful design», «premier music apps» | macstories … longplay-for-mac | S | A frase exata está. Data só inferida (jul 2025). |
| 33 | Replay '24 indicado ao Webby 2025 (melhor interface no celular) | winners.webbyawards.com/2025/… | S | Status: **Nominee**. |
| 34 | Denim: finalista ADA 2025, Delight and Fun; capas de playlist | developer.apple.com/design/awards/2025/ | S | Confirmado, com «cool depth effects». |
| 35 | Mela: finalista ADA 2025, Interaction | idem | S | Confirmado. |
| 36 | Vocabulary: finalista ADA 2025, Visuals and Graphics | idem | S | Confirmado. |
| 37 | Tide Guide: vencedor ADA 2026 Visuals and Graphics; finalista Interaction | developer.apple.com/design/awards/ | S | Confirmado. |
| 38 | Structured: finalista ADA 2026, Inclusivity | idem | S | Confirmado, «simple layout». |
| 39 | Tiimo: iPhone App of the Year 2025 | apple.com/newsroom/2025/12/… | S | Confirmado. |
| 40 | Apple Music iOS 26: fixar até seis itens | macrumors.com/guide/ios-26-music/ | S | «pin up to six playlists, albums, artists, or songs». |
| 41 | Roon ARC Focus na 1.77 (gênero, formato, selo, ano, tocado) | community.roonlabs.com/…/318737 | S | Anúncio de 27/04/2026; a versão 1.77 vem de post vizinho. |
| 42 | Spotify Biblioteca: filtros com X, ordenação **num toque**, ordem por filtro, grade/lista | community.spotify.com/…/5196161 | P | Filtros com X, quatro ordens, ordem lembrada por filtro (out/2021), ícone lista/grade: sim. «Num toque» não está. Data de 2021 e pode estar velho (o relatório avisa). |
| 43 | Spotify: Editar, segurar a alça e arrastar; remover pelo «⋯» | community.spotify.com/…/4918572 | S | «hold, and drag»; «Remove from this playlist» no menu da faixa. Reordenar é só Premium (o relatório não diz). |
| 44 | Plex: usuários pedem «digitar a posição» | forums.plex.tv/…/169515 | S | Pedido de 2016 de digitar a posição em lista de 300 itens. |
| 45 | Plex: «não dá para rolar enquanto se arrasta no iOS» | idem | **U** | O relato de iOS (2019) é outro: tem de entrar no modo editar no topo, voltar ao fim e arrastar tudo para cima. Os problemas de «não arrasta» são de Firefox e Chrome. |
| 46 | IMDb: mudar o número da posição ajusta os demais; gravar é passo explícito | help.imdb.com/…/GNQMN47VZSE7KW38 | S | «Save List Order». |
| 47 | CLZ: itens da lista de desejos em laranja e da coleção em azul; filtro Todos/Coleção/Desejo; parede de capas; edição em lote v6.0 de 2020 | apps.apple.com/…/id317997093 | **U** | Nada disso está na página. Só «list with small thumbnails or as cards»; versões vão de 10.0 a 11.2.3. O relatório diz «via notas de versão»: não são as dessa página. |
| 48 | CLZ: filtro estendido a todos os estados; lista, cartões, parede | clz.com/music/mobile/whatsnew/2021 | **X** | 403. As afirmações do item 47 podem estar aqui; não consegui ver. |
| 49 | Discogs (iOS): 3 formas de ver, 8 ordens, pastas, busca | support.discogs.com/…/360039334454 | **X** | 403 (o relatório já avisava). |
| 50 | Discogs: valor da coleção, lista de desejos com selo de preço | apps.apple.com/app/discogs/id1036449551 | P | «Collection value» e «price badging in your Wantlist» estão. Modos de ver, ordens e pastas **não** estão (o relatório diz que vieram de resumo de busca). |
| 51 | `overscroll-behavior: contain` evita encadear; `none` tira o elástico; disponibilidade limitada | MDN overscroll-behavior | S | Confirmado. A tabela de versões do Safari não veio; o relatório já diz que não confirmou. |
| 52 | Linear Mobile: vidro sem refração, contorno sólido com «Aumentar contraste», «lift on touch» | linear.app/now/linear-liquid-glass | S | Post de 21/10/2025. Diz que a refração foi cortada, em parte, por leitura em layouts densos. |
| 53 | Switch no Safari 17.4; vibra via `label`; bibliotecas se apoiam | webkit.org/blog/15054/… | P | O 17.4 está. **Nada sobre vibração.** O bug 285120 diz que o háptico chegou no iOS Safari 18.0. |
| 54 | iOS 26: Safari deixou de honrar `theme-color`; tinge pelo fundo do `body`; elemento fixo usa a cor dele; `viewport-fit=cover` | benfrain.com/ios26-… | S | Confirmado. `viewport-fit` aparece só para `env(safe-area-inset-bottom)`. |
| 55 | Mesmo tema | bugs.webkit.org/show_bug.cgi?id=301756 | P | É um pedido de esclarecimento de um usuário; o engenheiro do WebKit responde que o cabeçalho branco é esperado porque o topo não é fixo. Status NEW, sem resolução. |
| 56 | «Há pedido no WebKit para restringir» o truque do switch | bugs.webkit.org/show_bug.cgi?id=285120 | P | O pedido existe, mas está **RESOLVED FIXED** desde 03/01/2025: o háptico agora exige ativação do usuário (toque). Truque ainda vale sob toque direto; o texto do relatório sugere pendência. |
| 57 | ios-haptics usa o truque | unpkg.com/ios-haptics@3.1.1/README.md | S | Põe um switch nativo sobre o elemento. |
| 58 | `visualViewport` (altura, `offsetTop`, `resize`); tremor ao rolar | MDN VisualViewport | P | Os três membros estão. O aviso de «flickering» é de uma técnica específica (`device-fixed`), não da API em geral. |
| 59 | `navigator.vibrate`: disponibilidade limitada; Safari não tem (de memória) | MDN Navigator/vibrate | S | «Limited availability»; Safari não é citado. O relatório já marca como memória. |
| 60 | Vidro na web: o que funciona no Safari é `backdrop-filter` com desfoque e saturação, fundo translúcido, borda fina, sombra; refração SVG só no Chromium | frontendmasters.com/blog/?p=6644 (301 para blog.master.dev) | **U** | A página não fala de navegador algum. Cita `backdrop-filter` com SVG para refração e avisa que o visual «has been rightfully criticized for text contrast». |
| 61 | Refração SVG só no Chromium; Safari aceita a sintaxe e não desenha | dev.to/devyatov/… | S | «only Chromium supports SVG filters in backdrop-filter»; Safari «renders nothing». |
| 62 | Receita de vidro para o Safari (desfoque, saturação, fundo translúcido, borda, sombra) | aave.com/design/building-glass-for-the-web | **U** | Descreve outra técnica (deslocamento por `feDisplacementMap`), que **funciona no Safari com gambiarras**; sem sombra, sem receita de `blur`+`saturate`. Contraria a leitura «só Chromium» para esse método. |
| 63 | Side B: só lançamento no Product Hunt com um elogio ao desenho | producthunt.com/products/side-b | S | «Launched in 2026»; comentário elogia o desenho. |
| 64 | Musicboard: resenha de usuário **de 2025** que critica o desenho | justuseapp.com/…/reviews | P | Há críticas (botões pretos no escuro), mas a página não mostra datas; «2025» não se confirma. |

## Recomendações que a construção vai seguir, e em que se apoiam

Chamo de «nove padrões» as seções 1 a 9 (sete telas, o web app no iPhone e a linguagem visual).

| # | Recomendação | Apoio | Julgamento |
|---|---|---|---|
| 1 (parágrafo, 1) | Lista de séries fechadas, busca presa, «Filtros (n)» em folha, «Mostrar mais» | NN/g filtros S, Baymard P, NN/g paginação P; beleza: Albums/Longplay S (mas ambos são apps de grade de capas, não de lista de séries) | **Apoia em parte.** «Em vez de páginas» não vem de fonte; o 20 por carga é decisão própria (Baymard fala de produtos). |
| 1 | Linha de série 72 px, álbum 64 px, folha de ações, voltar ao topo, carga de 20 | medidas próprias, sem fonte | **Nada.** São chute razoável, não achado. |
| 2 (parágrafo, 2) | Álbum em tela cheia, capa grande, fundo da cor da capa, segmentado de 3 | HIG segmentado S; 9to5Mac S | **Apoiado.** O cabeçalho que encolhe é «de memória». O desfoque de 40 px e o véu são do relatório; custo no Safari não medido. |
| 2 | Faixa em duas linhas, selos embaixo | texto curto de linha (HIG lists S) | **Apoiado em princípio;** medidas próprias. |
| 3 (parágrafo, 3) | Subir/descer e «mover para…» além da alça; Salvar fixo | WCAG 2.5.7 S; NN/g drag S | **Apoiado, o mais forte do relatório.** O gesto do Things 3 é «de memória». |
| 3 | Barra do pé com ↑ ↓ e grade de 1 a n; Desfazer 5 s | W3C exemplifica «tocar e aparecer controles»; resto é desenho próprio | **Apoiado no essencial;** o 5 s e a grade de 5 colunas são próprios. |
| 4 (parágrafo, 4) | Uma playlist por tela, fichas rolantes no topo, barra de ação no pé; remover com Desfazer | NN/g acordeão P e swipe P (só argumentos **contra**); NN/g Desfazer S; Spotify S | **Parcial.** Não há fonte a favor das fichas no topo; o padrão nasce de eliminar o acordeão. Apple Music (modo editar) é «de memória». |
| 5 | Grade de capas com marca de seleção; barra de seleção no pé com contagem; folha de revisão | HIG coleções S; Fotos/Arquivos «de memória»; CLZ **U** | **Quase sem fonte.** Defensável, mas é desenho próprio. |
| 6 | Fichas de total que filtram; linha 72 px; ficha de estado tocável com menu de 3; lote por «Selecionar» | Discogs X/P, CLZ U/X; Tide Guide, Mela só provam prêmio | **Nada específico.** O relatório admite «só função», mas a função citada também não foi confirmada. |
| 7 (Blend) | Um passo por tela, indicador de 4, «Próximo» com o destino | NN/g assistentes S; acordeão em formulário S; HIG folha em passos S | **Apoiado.** Tiimo e Structured só provam prêmio. |
| 8 | Folha trava o `body`; deslizar da borda; sem toque longo; teclado/`visualViewport`; sem vibração; `:hover`; `theme-color` | MDN S/P, Ben Frain S, WebKit P; «20 px», toque longo, `:hover`, `touch-callout` são «de memória» ou do relatório | **Apoiado onde cita fonte;** tudo que é comportamento do Safari precisa de teste no aparelho (o relatório diz isso). |
| 9.1 | Capas com raio 6/10 e borda de 1 px; fundo desfocado da capa | HIG dark-mode S só para escurecer fundo branco; resto é do relatório | **Própria.** |
| 9.2 | Escala de 6 degraus | HIG typography S como base; degraus próprios | **Apoiado como base;** ver C4. |
| 9.3 | Grade de 4 px, alturas 56/64/72 | NN/g «cabeçalho pequeno» S; o resto próprio | **Própria.** |
| 9.4 | Vidro nas 3 barras, `blur(20px) saturate(1.6)`, `rgba(18,18,20,.72)`, sem refração | HIG materiais S (nativo); Linear S; dev.to S; frontendmasters U; aave U | **Parcial.** A receita CSS não tem fonte que a sustente; ver C2. |
| 9.5 | Laranja em quatro papéis, <10% da área; texto escuro sobre laranja; cinzas | HIG cor P; contas do relatório | **Parcial.** O contraste laranja/preto (8,3:1) e branco/laranja (2,4:1) conferem; o cinza terciário não, ver C3. |
| 9.6 | Anatomia de linha, cartão, ficha, botão 48 px | HIG listas S em princípio | **Própria.** |
| 9.7 | Tabela de durações | HIG movimento P; NN/g 300–400 e ~100 ms S | **Própria dentro de faixas citadas;** o relatório avisa. |
| 9.8 | Esqueleto, progresso, vazio | NN/g esqueleto S | **Apoiado.** |
| 9.9 | Ícones: traço de 1,75 px, 20/24 px | HIG tab-bars e menus S só em princípio | **Própria.** |
| Tabela final | Cada linha repete as acima; a coluna «beleza» cita apps | ver tabelas acima | O texto «Apple HIG busca (rev. 2026)» confere (alteração de 08/06/2026 no log da página). |

## Contradições internas e conflitos com as restrições do produto

- **C1. O laranja não cabe nas próprias regras.** A seção 9.5 diz «um botão principal por tela» e depois dá ao laranja quatro papéis: botão principal, estado ligado (aba ativa, ficha ativa, passo atual, caixa marcada), anel de seleção e link de texto. A 9.6 pinta o **fundo** da ficha ativa de laranja. Numa mesma tela (Playlists: ficha ativa + «Salvar»; Inventário: ficha ativa + botão) há várias superfícies laranja. A HIG, que o relatório cita como fonte, diz para **não** colorir o fundo de vários controles e para não usar a mesma cor com sentidos diferentes. «Estado ligado» e «link» não vêm da HIG. O limite de «menos de 10% da área» é do relatório.
- **C2. Barra do topo de vidro contra a NN/g que o relatório cita.** O relatório cita a NN/g (cabeçalhos presos) em três lugares, mas omite a frase que a mesma página escreve: o cabeçalho preso deve ter cor **opaca**, e translúcido reduz o contraste. A seção 9.4 põe vidro a 72% justamente na barra do topo. Além disso, a seção 1 diz «fundo opaco» e a 9.4 diz o contrário. As duas fontes de receita CSS (frontendmasters, aave) não sustentam a receita. Três barras de `backdrop-filter` sobre lista longa e capa com `blur(40px)` no Safari não foram medidas.
- **C3. Cinza terciário reprova na conta do próprio relatório.** `#6E6E76` sobre `#0A0A0C` dá cerca de 3,9:1; sobre o elevado 1 (`#17171A`), cerca de 3,5:1. A mesma HIG que o relatório cita pede **no mínimo 4,5:1**. «Só para texto de 16 px ou mais» não salva: 16 px regular não é texto grande no WCAG. O secundário `#A0A0A8` dá 7,6:1 na base e 6,3:1 no elevado 2: confere. Branco sobre laranja 2,4:1 e preto sobre laranja 8,3:1: conferem.
- **C4. «6 degraus, nada fora deles»** não é verdade no texto do próprio relatório: aparecem 14/600 (título da grade), 14/500 (fichas), 14 (descrição do Blend), 15 (artista · ano no detalhe, valor no inventário), 17/600 (cartão de receita) e 20/700 ou 20/600 (posição, valor). Quem construir pela tabela da 9.2 vai divergir das seções 2 a 7.
- **C5. Acordeão: a seção 1 recomenda, a seção 4 condena.** A 4 rejeita acordeão para listas de 10 a 30 itens porque a NN/g avisa que o conteúdo longo cansa. A seção 1 abre séries de ~12 álbuns de 64 px (cerca de 770 px) no mesmo molde. A tabela final diz «acordeão»; o parágrafo de abertura diz «séries fechadas». Falta decidir (e dizer) quantos álbuns por série abertos de uma vez.
- **C6. «Computador não pode mudar» não é tratado.** O relatório nunca menciona a tela do computador, nem manda escopar as mudanças a uma media query. Várias recomendações trocam comportamento existente: «Mostrar mais» no lugar das páginas (a F72 acaba de pôr um paginador acima da lista), lista de séries do Blend sem caixa interna, tirar o brilho neon do celular, menu de estado no inventário. Cada uma precisa de uma regra explícita «só abaixo de N px» antes de construir.
- **C7. «Blend: acerto, não redesenho»** (seção 7) contra «um passo por tela, indicador, barra de ação nova»: isso é redesenho. A auditoria irmã chama o fluxo de linear, em 3,3 telas, e lista como acerto os passos numerados e o botão final, não que seja «a melhor tela».
- **C8. Barras empilhadas e altura útil.** Tab bar + barra de ação de 56–64 px + área segura + barra do Safari, contra «dobra de 852 px» e «REQ-06: 5 a 6 faixas». 852 é a altura da tela do aparelho, não da área visível do Safari (algumas centenas de px a menos). A HIG diz que a barra de abas deve ficar visível; o relatório manda escondê-la com o teclado aberto (a HIG abre a exceção só para modal). A «uma só barra de ação» não diz onde fica a de abas.
- **C9. Dark e laranja mantidos: respeitados.** O relatório mantém `#0A0A0C`, `#FF8800`, Syne e Inter. A receita de capa clara a 92% de brilho e o véu do fundo do álbum não ferem isso. Web app em Safari: respeitado, o vidro sem refração é o certo para Safari (dev.to S), mas a receita CSS não tem fonte (C2).

## O que a construção não deve seguir sem conferir

1. **A receita de vidro (9.4)** e o desfoque de 40 px da capa: sem fonte que sustente e sem medida de desempenho no Safari. Teste no aparelho; use fundo **opaco** na barra do topo (a NN/g pede) e guarde o vidro para a barra de abas e a de ação.
2. **Os quatro papéis do laranja (9.5/9.6):** reduza a dois (botão principal; estado ligado com marca que não seja só o fundo) ou assuma que é decisão do MJRP contra a HIG. Não chame de «HIG».
3. **O cinza terciário `#6E6E76`:** reprova 4,5:1. Clareie ou use só em ícone parado, nunca texto.
4. **A tabela de tipo (9.2):** acrescente os degraus 14, 15, 17 e 20, ou refaça as seções 2 a 7 para caber em 6.
5. **O que depende de CLZ, Discogs e Plex (seções 5 e 6):** as afirmações sobre aparência e função desses apps não se confirmaram ou não abriram. Trate o inventário e a série como desenho próprio, não como «o que os apps fazem».
6. **Acordeão de série aberta (seção 1):** decida o limite de álbuns visíveis por série antes; a própria seção 4 mostra o risco.
7. **Escopo só celular:** escreva a regra («abaixo de N px») para cada mudança de comportamento; o computador não pode mudar, e o paginador da F72 é anterior a este relatório.
8. **Altura útil real:** meça a área visível do Safari (e com a barra de ação mais a de abas), não 852 px, antes de fixar «5 a 6 faixas na dobra» e as alturas de barra.
9. **Datas e prêmios como «beleza»:** o reconhecimento dos apps de música é por resenha sem data (Albums «c. 2021», Longplay «c. 2023»). Os prêmios novos (Tide Guide, Mela, Tiimo, Structured, Vocabulary, Denim) são reais, mas as telas não foram vistas: servem de lição de princípio, não de padrão.
10. **Safari no iOS 26:** `theme-color`, puxar para atualizar, a versão de `overscroll-behavior` e a mudança «todo site na tela de início vira web app» (sem fonte primária) precisam de teste no iPhone. O truque do háptico por `switch` vale só com toque direto (o WebKit exigiu ativação do usuário em jan/2025) e no iOS 18 em diante, não no 17.4.
11. **WCAG 2.5.7 «é exigência»:** só se o produto declarar nível AA. A página não traz o ano 2023.
12. **Itens «de memória» que a construção ainda não pode tratar como fato:** gesto do Things 3, edição de playlist no Apple Music, cabeçalho que encolhe, toque longo no iOS, `-webkit-touch-callout`, `:hover` preso, separador do iOS.

## Os nove padrões se sustentam?

Como **direção**, sim: nenhuma fonte refuta algum padrão. Os mais firmes são ranking (3), detalhe do álbum (2), Blend (7), esqueleto/carga e as regras do web app (8). Albums (1) e Playlists (4) se sustentam com ressalvas (C5, falta de fonte a favor das fichas). Série (5), Inventário (6) e as medidas numéricas da seção 9 são desenho próprio, sem prova nas fontes. A seção 9 precisa de correção em três pontos (C1 laranja, C2 vidro no topo, C3 cinza) antes de virar tela.
