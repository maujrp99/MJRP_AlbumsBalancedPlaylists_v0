---
type: ux-audit
subject: "F80 página de entrada, rodada 1 de exploração: Brasa, Lado A lado B, Caixote (design/inception/splash-*-v1.html)"
project: MJRP_AlbumsBalancedPlaylists_v0
moment: discovery
judged: "2026-11-20 17:55"
who_judged: separate-agent
verdict: passes
p0: 0
p1: 8
p2: 17
human_decisions: 1
status: open
---
<!-- o frontmatter é o que o Control Center lê (System Monitor · Health Check). open: sobram P1 e uma decisão do MJRP -->

# UX audit — F80 página de entrada, rodada 1 · 2026-11-20 17:55

> Momento: Discovery (Explorar) · Gênero: documento (página pública de leitura, com a ação de entrar no app) · disciplinas em foco: HI, CO, CP, CW, AH-01/02/03/05, IN-03, MP-01, e o padrão do `design-system.md` § «Página de entrada (F80)»
> Objeto: `design/inception/splash-ember-v1.html` (Brasa, Consolidar), `splash-sides-v1.html` (Lado A, lado B, Elevar), `splash-crate-v1.html` (Caixote, Transformar), servidos em http://127.0.0.1:8780/ · Viewports: 1280x800 e 393x852 (o aparelho de referência do `design-system.md`) · Estados capturados: com movimento, sem JavaScript (iframe com `sandbox` sem scripts), sem WebGL (`?nogl`, o mesmo quadro que o Caixote mostra com movimento reduzido) · Cânone: `docs/wiki/harness/design-canon.md`
> Quem julgou: agente separado (recebeu só a skill e os artefatos; não leu a proposta, a proposta de copy nem as notas de inception)
> Limite da passada: o painel do navegador não emula `prefers-reduced-motion`; o movimento reduzido de Brasa e Lado A foi julgado lendo o código, o do Caixote pela captura `?nogl`. A faixa do protótipo e as notas em português não são do site e não foram julgadas.

## Veredito

**Passa (P0: 0)** — pode ir ao MJRP para ele reagir; a escolha é dele. Os oito P1 são o que a direção escolhida precisa resolver na convergência, não um bloqueio desta rodada.

- **Brasa** — a mais sólida e a mais barata: a primeira tela diz o que o produto é e leva ao app nos dois tamanhos, sem biblioteca, legível sem JavaScript. Mas a sua única imagem, o fogo com o equalizador, fica **abaixo da dobra a 1280x800** (o leito começa em 745 px, o equalizador em 849 px): no notebook a Brasa é só tipo.
- **Lado A, lado B** — o melhor equilíbrio do eixo: a profundidade (capa e vinil em CSS 3D) serve à metáfora do disco, sem biblioteca, sem rolagem sequestrada, com «Open the app» sempre à mão no topo preso. Falha o padrão do equalizador (as barras vivas pulsam em uníssono) e não tem fogo em movimento — o segundo é pergunta ao MJRP.
- **Caixote** — o mais imersivo e o mais perto do «3D» pedido, e o que mais custa: no celular a frase que define o produto cai abaixo da dobra, o caixote gira sozinho a cada 5 s e anuncia cada capa ao leitor de tela, o selo «Fictional» é ilegível no 3D, e são 155 KB de three.js de CDN com um laço de desenho que não para.

## Achados

### Brasa (`splash-ember-v1.html`)

| # | ID | Sev | Âncora | Evidência | Check de aceite (S/N) | Esforço/Impacto | Antes → Depois | Skill dona |
|---|---|---|---|---|---|---|---|---|
| E1 | `design-system.md` § Página de entrada, «Fogo em movimento»; CP-03 | P1 | `.firebed` / `#eq-hero` (l. 44–45, 143) | A 1280x800 o leito de fogo começa em 745 px (55 px visíveis) e o equalizador em 849 px, fora da tela; a direção cuja imagem é o fogo abre só com texto. Captura: `reports/evidence/f80-splash-round1/f80-splash-round1-ember-1280x800-2026-11-20.jpg` | A 1280x800, o topo do `.firebed` fica acima de 800 px e as barras do `#eq-hero` aparecem inteiras na primeira tela? S/N | baixo / alto | fogo e equalizador abaixo da dobra no notebook → fogo e equalizador na primeira tela, ainda abaixo do texto | mjrp-designing-ui |
| E2 | `info-arch.md` ^splash-no-js; § Equalizador | P2 | `fillEq()` (l. 232–242) | As barras dos dois equalizadores são criadas por script; sem JavaScript `#eq-hero` e `#eq-final` ficam vazios (0 barras) e sobra só o brilho. Captura: `…/f80-splash-round1-ember-nojs-1280x800-2026-11-20.jpg` | Com JavaScript desligado, `#eq-hero` mostra barras? S/N | baixo / médio | equalizador some sem script → barras no HTML, o script só as anima | mjrp-designing-ui |
| E3 | CP-09 | P2 | `h1 .burn` (l. 136); `.top .btn-sm` (l. 127) | A 393 px o grupo «whole album» quebra no meio («whole / album») e o rótulo «Open the app» do topo quebra em duas linhas dentro do botão. Captura: `…/f80-splash-round1-ember-393x852-2026-11-20.jpg` | A 393x852, «whole album» fica numa linha e o rótulo do botão do topo cabe numa linha? S/N | baixo / baixo | grupo e rótulo quebrados → grupos com `nowrap`, botão do topo numa linha | mjrp-designing-ui |
| E4 | candidato (web.dev, INP e LCP; MDN, desempenho de canvas) | P2 | `#fire` (l. 47, 245–272) | 260 partículas (140 no celular) com composição aditiva e `filter: blur(2px) saturate(1.2)` sobre um canvas da largura da tela, a cada quadro, enquanto o hero está visível. Não medido em aparelho. | Num celular médio, o hero com fogo mantém quadros abaixo de 16 ms e INP ≤ 200 ms? S/N | baixo / médio | desfoque por CSS a cada quadro → custo medido no aparelho (ou desfoque no sprite) | mjrp-designing-ui |

### Lado A, lado B (`splash-sides-v1.html`)

| # | ID | Sev | Âncora | Evidência | Check de aceite (S/N) | Esforço/Impacto | Antes → Depois | Skill dona |
|---|---|---|---|---|---|---|---|---|
| S1 | `design-system.md` § Página de entrada, «Equalizador» (cada barra com duração e atraso próprios, nunca em uníssono; 5 a 8 px) | P1 | `.thread .bars i.on.live` (l. 50); `.thread .bars i` (l. 48) | As seis barras vivas usam a mesma animação de 0,9 s sem atraso: pulsam juntas. As barras do fio são `flex:1`, cerca de 11 px a 1280 px. Diverge do padrão declarado. Captura: `…/f80-splash-round1-sides-1280x800-2026-11-20.jpg` | As barras vivas do fio têm cada uma a sua duração e o seu atraso, e largura de 5 a 8 px (ou o `design-system.md` registra o fio como variante)? S/N | baixo / médio | pulso em uníssono → barras fora de fase, como o padrão | mjrp-designing-ui (ou o MJRP aceita a variante, via mjrp-defining-design-systems) |
| S2 | decisão do MJRP de 2026-11-20 17:12 (`design-system.md` § Página de entrada: «o elemento do fogo, de equalizadores, fazem parte da identidade do site») | P2 | página inteira; `.flip` (l. 130) | Fora o logotipo, não há fogo: só o degradê da capa e um brilho vermelho na seção «Flip the record». As outras duas direções têm fogo em movimento. | A página tem o fogo de § «Fogo em movimento», ou o `design-system.md` registra que o fogo do logotipo basta nesta direção? S/N | médio / médio | identidade só com o equalizador → fogo presente, ou a exceção escrita | **decisão do MJRP**; depois mjrp-designing-ui |
| S3 | candidato (WebKit, «A guide to scroll-driven animations», 2025-06-20: envolver o movimento de rolagem em `prefers-reduced-motion`) | P2 | `update()` (l. 287) | `--p` é escrito a cada rolagem também com movimento reduzido: o vinil desliza até 8% com a rolagem quando o sistema pede menos movimento. | Com `prefers-reduced-motion: reduce`, o `transform` do `.vinyl` fica constante ao rolar? S/N | baixo / baixo | vinil desliza com a rolagem → parado | mjrp-designing-ui |
| S4 | `info-arch.md` ^splash-no-js; RC-08 | P2 | `.thread` (l. 172–174) | Sem JavaScript o fio preso no topo fica com a trilha vazia e o rótulo «Side A · 1» enquanto a pessoa lê A3 (o lugar mostrado está errado). Captura: `…/f80-splash-round1-sides-nojs-1280x800-2026-11-20.jpg` | Com JavaScript desligado, o fio some ou mostra a faixa certa? S/N | baixo / baixo | rótulo errado preso no topo → fio escondido sem script | mjrp-designing-ui |
| S5 | CP-06 | P2 | `.ranked .lens` (l. 126–128, 215) | «Critics / Popularity / Yours» parecem um controle segmentado (bordas, um marcado), têm 31 px de altura e não respondem ao toque. | A lente é interativa com alvos de 44 px, ou deixa de ter cara de botão? S/N | baixo / baixo | falso controle → rótulo estático ou controle de verdade | mjrp-designing-ui |
| S6 | DE-01 (nota: página de leitura, não de monitorar) | P2 | `header.top` + `.thread` (l. 33, 44, 149) | Cromo preso: 64 + 52 = 116 px a 1280x800 (15%); 56 + 44 = 100 px a 393x852 (12%, mais no Safari com as barras dele). | No celular, o que fica preso no topo tem até 64 px? S/N | médio / baixo | duas faixas presas → uma | mjrp-designing-ui |

### Caixote (`splash-crate-v1.html`)

| # | ID | Sev | Âncora | Evidência | Check de aceite (S/N) | Esforço/Impacto | Antes → Depois | Skill dona |
|---|---|---|---|---|---|---|---|---|
| C1 | HI-02, CP-03; `info-arch.md` § Decisões de IA («a primeira tela diz o que o produto é antes de qualquer imagem») | P1 | `.stage` com `order:-1` (l. 128) | A 393x852 o caixote ocupa 136–596 px; o `h1` começa em 651 px, a frase `.what` que define o produto em 863 px (abaixo da dobra) e as chamadas do hero em 1024 px. Captura: `…/f80-splash-round1-crate-webgl-393x852-2026-11-20.jpg`. (Lado A passa por pouco: `.what` termina em 774 px.) | A 393x852, com a faixa do protótipo, o fim da `.what` fica acima de 852 px? S/N | médio / alto | imagem de 460 px antes da definição → definição na primeira tela, imagem menor ou depois | mjrp-designing-ui |
| C2 | candidato (WCAG 2.2, 2.2.2 Pause, Stop, Hide e 4.1.3 Status Messages, W3C) | P1 | `loop()` `if(idle>5) go(1)` (l. 366); `#now` com `aria-live="polite"` reescrito em `announce()` (l. 173, 349) | O caixote gira sozinho a cada 5 s, para sempre, sem pausa; a cada giro o leitor de tela anuncia «Glass Orchard · Velvet Meridian (fictional album, 4 of 9)» por cima da leitura. Confirmado no navegador (o anúncio mudou sozinho em 6 s). | O caixote para de girar sozinho depois da primeira interação ou em até 5 s, e o `#now` anuncia só o giro que a pessoa pediu? S/N | baixo / alto | giro e anúncio a cada 5 s → giro só a pedido (ou com pausa), anúncio só do pedido | mjrp-designing-ui (o julgamento fica com esta skill) |
| C3 | `design-system.md` § Página de entrada, «Capa fictícia» | P2 | `drawSleeve()` `fillText` sem largura máxima (l. 290) | Títulos cortados na borda da capa no 3D: «Lantern Hymr…», «Glass Orchar…». Captura: `…/f80-splash-round1-crate-webgl-1280x800-2026-11-20.jpg` | Todo título de capa cabe inteiro na capa? S/N | baixo / baixo | título cortado → título que cabe | mjrp-designing-ui |
| C4 | candidato (web.dev, INP ≤ 200 ms; MDN, «WebGL best practices») | P2 | `importmap` (l. 12); `loop()` (l. 362–378); `powerPreference:'high-performance'` (l. 312) | Medido: `three.module.min.js` 72,4 KB + `three.core.min.js` 82,3 KB comprimidos = 154,7 KB (751 KB descomprimidos), do cdn.jsdelivr.net na hora. Chega depois do texto (bom), mas o laço desenha todo quadro enquanto o caixote está na tela, mesmo parado (luz, equalizador, vinil). | Num celular médio, o laço para quando nada se move, a biblioteca é servida pelo próprio site, e INP ≤ 200 ms? S/N | médio / médio | GPU sempre ligada e CDN de terceiro → desenho sob demanda e arquivo próprio | mjrp-designing-ui |
| C5 | IN-04; `info-arch.md` ^splash-before-script | P2 | `.fallback` → `canvas` (l. 54–60, 376) | A imagem troca de composição 1–2 s depois de abrir: leque de 5 capas grandes («Copper Year» na frente) → anel de 3 capas menores com equalizador 3D. São duas imagens diferentes. Capturas: `…/f80-splash-round1-crate-fallback-1280x800-2026-11-20.jpg` e `…-crate-webgl-1280x800-…` | O primeiro quadro do 3D tem a mesma capa na frente e o mesmo enquadramento do leque? S/N | médio / baixo | troca visível de imagem → passagem sem salto | mjrp-designing-ui |
| C6 | CP-06 | P2 | `.card:hover` (l. 92) | Os cartões dos três momentos inclinam em 3D e acendem a borda laranja ao passar o mouse, mas não são links. | Os cartões só reagem ao mouse se forem clicáveis? S/N | baixo / baixo | parece botão e não é → sem reação, ou link | mjrp-designing-ui |

### Comum às três

| # | ID | Sev | Âncora | Evidência | Check de aceite (S/N) | Esforço/Impacto | Antes → Depois | Skill dona |
|---|---|---|---|---|---|---|---|---|
| X1 | MP-01 | P1 | `h1`, `.what`, título da seção e título do fecho nos três arquivos | O eixo declarado é «quanto 3D, e de onde vem a profundidade», e o `info-arch.md` § Decisões de IA diz «o mesmo texto»; mas o texto muda junto: «Keep the whole album burning.» / «Side A. Side B. The whole album.» / «Dig through the albums you love. Keep every track.»; «Three moves, one record at a time.» / títulos por faixa / «From the crate to the playlist, in three moves.»; fechos «Start with one album you love.» / «Drop the needle…» / «Pull one record…». O MJRP vai comparar imagem e texto juntos. | Os três arquivos têm o mesmo `h1`, a mesma `.what`, os mesmos títulos de seção e de fecho, ou o registro declara o texto como segundo eixo, de propósito? S/N | baixo / alto | dois eixos que mudam juntos → um eixo (ou os dois declarados) | mjrp-designing-ui |
| X2 | `design-system.md` § Página de entrada, «Capa fictícia» (selo «Fictional»); § Medidas mínimas (12 px) | P1 | Caixote: `.fan .s` (l. 161–167) e o selo do `drawSleeve()` (l. 292); Lado A: `.mini` (l. 109–118, 200–201, 234–235) e `.fict` (l. 74) | Capas inventadas aparecem sem selo legível: o leque do Caixote não tem selo; no 3D o «FICTIONAL» sai com cerca de 6 px, ilegível (`…/f80-splash-round1-crate-texture-zoom-1280x800-2026-11-20.png`), e a legenda «Copper Year · North Atlas» diz «fictional» só ao leitor de tela (`.sr`); as miniaturas de Lado A não têm selo e o selo da capa grande tem 11 px. Só o rodapé avisa. | Toda capa inventada visível tem um selo «Fictional» de 12 px ou mais, ou o grupo tem uma legenda visível «Fictional albums» ao lado? S/N | baixo / alto | nomes de álbuns parecem reais → o inventado dito onde se vê | mjrp-designing-ui |
| X3 | candidato (WCAG 2.2, 2.2.2 Pause, Stop, Hide, nível A, W3C) | P1 | Brasa: `#fire` e `.eq i` (`infinite`); Lado A: `.thread .bars i.on.live` (`infinite`); Caixote: `loop()` e `.eqv i` | As três têm movimento sem fim ao lado do texto (fogo, equalizadores, caixote) e nenhum controle para pausar; o movimento reduzido do sistema só atende quem o ligou. | Cada direção tem um controle visível de pausar o movimento (44 px), ou o movimento para sozinho em até 5 s? S/N | baixo / médio | movimento sem fim e sem pausa → pausa à mão | mjrp-designing-ui (o julgamento fica com esta skill) |
| X4 | W14 (a descrição bate com a versão julgada) | P1 | `info-arch.md` l. 4, 283–286, 331–333 | O `info-arch.md` aponta `design/wireframes/splash-<direção>-v1-desktop.png` e `-phone.png` e `design/proposals/f80-splash/comparator.html`; nenhum existe na árvore (o comparador dá 404 no servidor). ^splash-no-js diz que sem JavaScript somem só o fogo, o fio e o 3D, mas na Brasa somem também os dois equalizadores (E2) e em Lado A o fio fica com o rótulo errado (S4); e «o mesmo texto» não vale (X1). | Os wireframes e o comparador citados existem, e ^splash-no-js bate com as capturas sem JavaScript? S/N | baixo / médio | descrição à frente do que existe → descrição igual ao protótipo | mjrp-designing-ui |
| X5 | AH-01 (WCAG 1.4.11) | P2 | `.btn-ghost` (Brasa l. 37, Lado A l. 40, Caixote l. 39) | A borda do «Sign in» (branco a 28% sobre preto) dá 2,26:1, abaixo de 3:1. O rótulo identifica o botão, por isso não bloqueia. | A borda do botão secundário tem 3:1 ou mais contra o fundo? S/N | baixo / baixo | 2,26:1 → ≥ 3:1 | mjrp-defining-design-systems |
| X6 | candidato (legibilidade da arte; AH-01 não obriga texto de imagem com nome no `aria-label`) | P2 | Lado A `.sleeve .a` (l. 73), `.mini span` 10 px (l. 110); Caixote `.art-sun span` e textura «sun» (l. 70, 279, 289) | O artista «NORTH ATLAS» na capa grande de Lado A fica cerca de 1,9:1 (`…/f80-splash-round1-sides-sleeve-zoom-1280x800-2026-11-20.png`); o título preto sobre `#7c2d12` na capa «sun» do Caixote dá 2,1:1; os títulos das miniaturas têm 10 px. | Título e artista de cada capa se leem na captura, com 3:1 ou mais contra a arte? S/N | baixo / baixo | arte com texto que some → texto da capa legível | mjrp-designing-ui |
| X7 | AH-04 (estrutura navegável) | P2 | Lado A `.flip .kicker#why` (l. 242); Caixote `.eyebrow#why` (l. 210) | A seção «Why whole albums» não tem título (`h2`): é um parágrafo; quem navega por títulos pula a seção. A Brasa usa `h2`. | Toda seção tem um `h2`? S/N | baixo / baixo | seção sem título → `h2` | mjrp-designing-ui |
| X8 | CP-08; padrão do `design-system.md` (padrão novo sem linha) | P2 | `h1` (107,5 px na Brasa, 64 px em Lado A, 62 px no Caixote), `.sec-title` até 56 px, `.btn-sm` 16 px / 44 px | A página tem uma escala própria de display e um botão pequeno no topo; o `design-system.md` § Página de entrada declara só o botão principal de 18 px / 48 px, e a escala declarada é a do app no celular. | Cada tamanho e o botão pequeno da página mapeiam a um papel declarado no `design-system.md`? S/N | baixo / médio | escala sem papel → escala da página declarada (pendente do MJRP) | mjrp-defining-design-systems |
| X9 | conferência de nomes de terceiros (`prototype-upkeep-checks`) | P2 | os nomes inventados (Lado A l. 188, 201; Caixote `ALBUMS`, l. 265–275; o exemplo de faixas) | «Harbour Lights» lembra um disco real («Harbor Lights», Bruce Hornsby, 1993); os outros títulos e artistas não foram procurados. Numa página pública, «fictional» precisa ser verdade. | Cada título e artista inventado foi procurado no Discogs, sem coincidência exata? S/N | baixo / médio | nomes não conferidos → nomes conferidos | mjrp-designing-ui |

Medidas sem achado: todos os alvos do site têm 44 px ou mais (topo 44, chamadas 48, setas do caixote 48, rodapé 44); só o «Skip to content» tem 26 px de altura e aparece só com o foco. Sem rolagem horizontal a 393 px nas três (`scrollWidth` = 393). A família de densidade não rodou: página de leitura, sem limite declarado e sem lista em duas dimensões.

## O que está bom, manter

- **A primeira tela diz o que é e leva ao app** nas três a 1280x800, e na Brasa e em Lado A também a 393x852: sobretítulo, título, a frase que começa por «The Album Blender is a web app for people who…», e «Open the app» / «Sign in».
- **Todo o texto está no HTML**, com `title` e `meta description` que definem o produto: sem JavaScript as três dizem a mesma coisa (buscador e assistente leem).
- **Contraste do botão principal:** texto preto sobre o degradê dá 7,0:1 na ponta laranja e 5,3:1 no meio; o rótulo não chega à ponta vermelha. Laranja de texto `#fb923c` 9,3:1; cinza `#a0a0a8` 8,1:1; corpo a 72% 10,6:1.
- **O fogo nunca fica atrás do texto** (Brasa, Caixote), como o padrão manda.
- **O exemplo de faixas é honesto e plano:** «Illustrative · fictional album» em cima, «Bar length = …» e «Example data, not real scores.» embaixo, barras 2D sem 3D (AH-05) — igual nas três.
- **Nenhuma rolagem sequestrada:** Lado A usa `animation-timeline` só para girar o vinil e acender o fio; o caixote usa `touch-action: pan-y`, a página rola por cima dele.
- **Caixote:** three.js só baixa depois do `load`, só com WebGL 2 sem aviso de desempenho e sem movimento reduzido; o leque em CSS está acabado e vale como estado sem WebGL, sem script e com movimento reduzido; setas de teclado, botões de 48 px com nome, região com nome; o laço para fora da tela e com a aba escondida.
- **Brasa:** o fogo pausa fora da tela e desenha um quadro parado com movimento reduzido; sem biblioteca nenhuma.
- **Lado A:** o topo preso mantém «Open the app» sempre à vista no celular; a página contada como um disco dá ordem à leitura (A2 a B2).
- **Identidade:** preto, laranja `#f97316`, degradê «flame», Syne nos títulos e o logotipo nas três; nenhuma capa real.

## Próximos checks (Discovery)

A nova passada roda só os checks dos P1, na direção que o MJRP escolher (e os comuns):

1. E1 (se Brasa) · S1 (se Lado A) · C1 e C2 (se Caixote).
2. X1, X2, X3, X4 em qualquer direção.
3. Os P2 entram no próximo corte; S2 espera a palavra do MJRP.

Decisão que é do MJRP (1): **S2** — em Lado A, o fogo do logotipo basta, ou a direção precisa de fogo em movimento?

## Fora do cânone (candidatos)

- **Movimento sem fim sem pausa e carrossel que avança sozinho** (X3, C2): WCAG 2.2, critérios 2.2.2 (Pause, Stop, Hide, nível A) e 4.1.3 (Status Messages), W3C. O cânone não tem regra de movimento contínuo nem de rotação automática; IN-07 e AH-04 não cobrem. Candidato a regra (por exemplo «movimento que dura mais de 5 s tem pausa à mão; rotação automática não anuncia em região viva»).
- **Movimento de rolagem com movimento reduzido** (S3): WebKit, «A guide to scroll-driven animations with just CSS», 2025-06-20.
- **Custo de 3D e de canvas no celular** (E4, C4): web.dev (LCP, INP, limites de bom e ruim) e MDN, «WebGL best practices». O cânone não tem orçamento de peso nem de GPU para uma página pública.
- **O cânone não tem o gênero «página pública de entrada / landing»**: DE-02 e AH-05 («nenhum 3D») são regras de dado e de gráfico e não se aplicaram à imagem decorativa; o que vale para uma página de marca com movimento ficou só nas regras CW e nos candidatos acima. Se esses candidatos se sustentarem na convergência, viram um arquivo em `reports/harness-feedback/` (não escrito nesta passada, a pedido de quem a encomendou).
- Não foi feita busca nova na web nesta passada: as fontes acima são as primárias (W3C, WebKit, web.dev, MDN), conhecidas e já com data.

## Correções feitas pelo designer na mesma versão (depois desta crítica, 2026-11-20)

Anotado por quem desenhou (`mjrp-designing-ui`), não pelo juiz; a próxima passada do juiz confere. Corrigidos nos três arquivos, sem versão nova (correções pequenas, antes de o MJRP ver):

- **E1:** o leito de fogo e o equalizador da Brasa entram na primeira tela, abaixo do texto (título menor, o fogo numa faixa própria sob as chamadas).
- **S1:** as barras vivas do fio têm duração e atraso próprios; 110 barras no computador (cerca de 6 px), 44 no celular.
- **C1:** no celular o caixote tem 40% da altura e a frase que diz o que o produto é entra na primeira tela.
- **C2:** o giro automático para depois de três voltas; o anúncio ao leitor de tela vai numa região própria e só para o giro que a pessoa pediu.
- **X1:** declarado como segundo eixo no `info-arch.md` e nas notas (o título, o subtítulo e o fecho acompanham a imagem; os momentos, a prova e as chamadas são os mesmos).
- **X2:** «Fictional albums · original art» legível (12 a 13 px) junto de todo grupo de capas.
- **X3:** botão «Pause motion» (44 px) nas três.
- **X4:** wireframes, comparador e a descrição sem JavaScript corrigidos.
- **P2 baratos:** E3 (sem quebra no meio de «whole album»; «Open the app» numa linha), S4 (o fio some sem JavaScript), C3 (título da capa 3D encolhe para caber), C6 (cartões não inclinam mais ao passar o mouse), X5 (borda do «Sign in» a 50%), X7 («Why whole albums» virou título), X9 («Harbour Lights» trocado por nomes sem semelhança conhecida).

Ficam abertos: S2 (decisão do MJRP), E2, E4, S3, S5, S6, C4, C5, X6, X8.
