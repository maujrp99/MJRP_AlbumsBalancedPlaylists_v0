# F80 · A página de entrada do Album Blender · proposta da rodada 1

> Rodada de exploração, 2026-11-20. Três protótipos, um comparador, nenhum código de produto. Nada aqui está decidido: você escolhe a direção, a quantidade de rodadas e quando a página vira protótipo julgado.

## Em uma frase

Fiz três páginas de entrada que dizem a mesma coisa na mesma ordem e mudam numa coisa só, **quanto 3D e de onde vem a profundidade**: a **Brasa** (sem 3D, o fogo e o tipo), o **Lado A, lado B** (3D em CSS, a página contada como um disco) e o **Caixote** (3D de verdade, um caixote de capas que se gira). **Recomendo o Lado A, lado B**, com uma ressalva que vale perguntar (ver «Minha recomendação»).

- Comparador (Artifact do Claude, privado): https://claude.ai/artifact/5hDJr8qToYkAEsgCrfUK8e (as três páginas vão como arquivos do próprio Artifact) — cópia local em `design/proposals/f80-splash/comparator.html`.
- Protótipos: `design/inception/splash-ember-v1.html`, `splash-sides-v1.html`, `splash-crate-v1.html`.
- Textos: `design/proposals/2026-11-20-splash-copy-proposal.md` (15 linhas, opções e recomendação em cada uma).
- Pesquisa: `design/references/f80-splash/references.md`. Crítica de UX: `reports/audits/2026-11-20-f80-splash-round1-ux-audit.md`.

## O que você pediu, e o piso

- «prototipo de uma home splash page para o site, com design moderno imersivo com animações, 3d...tudo relacionado a paixao por ouvir e apreciar ALBUNS completos de musica».
- «o elemento do fogo, de equalizadores, fazem parte da identidade do site, busquem respeitar o design system num minimo pelo menos».

As três usam o preto, o laranja `#f97316`, o degradê «flame», a Syne nos títulos, o seu logotipo (o das letras em fogo) e o equalizador. Onde saí do design system, está escrito no `design-system.md`, marcado «pendente de aprovação do MJRP»: o botão principal com **texto preto** sobre o degradê (o branco dá 2,8:1 na ponta laranja, abaixo do mínimo), e o texto corrido na fonte do sistema (a regra do celular, «título em Syne, o resto na fonte de texto», levada ao computador numa página de leitura).

## A pesquisa (30 minutos, com fonte)

O que conta como referência é só o que foi aberto nesta rodada; o resto está em «Não conferidas» no arquivo da pesquisa. As páginas foram lidas em texto: **não vi nenhum dos sites premiados rodando**, então nada aqui afirma como eles se movem.

**O que faz uma página imersiva funcionar, e não só impressionar**

- A primeira tela decide. Cerca de 57% do olhar fica acima da dobra (NN/g, «Scrolling and Attention», 2018, https://www.nngroup.com/articles/scrolling-and-attention/); a pessoa rola quando tem motivo (NN/g, «The Fold Manifesto», 2015, https://www.nngroup.com/articles/page-fold-manifesto/). Por isso, nas três, a primeira tela diz o que o produto é, com o nome, antes de qualquer imagem.
- Tirar o controle da rolagem custa caro: desorienta, é pior no celular e com texto, e só se paga quando revela informação útil (NN/g, «Scrolljacking 101», 2023, https://www.nngroup.com/articles/scrolljacking-101/). Nenhuma das três sequestra a rolagem: no Lado A, lado B a rolagem é a do navegador e só **dirige** o giro do disco e o fio.
- Paralaxe e movimento decorativo: conteúdo primeiro, e o que se mexeu termina parado no lugar (NN/g, «Parallax Scrolling», 2019, https://www.nngroup.com/articles/parallax-usability/). Herói fixo costuma vencer carrossel; nada deve avançar sozinho no celular (NN/g, carrosséis, revisto em 2026-08, https://www.nngroup.com/articles/designing-effective-carousels/). Daí o giro automático do Caixote parar depois de três voltas.
- Premiados de 2026 no Awwwards com 3D: Sweet Tape (Site do Dia 17/11/2026 e Developer Award; WebGL), Justin Jefferson (07/11/2026; Three.js e som), Carter Ogunsola (19/11/2026; WebGL). As notas de desempenho e acessibilidade que o júri deu ficam entre 6,8 e 8,0 (https://www.awwwards.com/sites/sweet-tape, …/justin-jefferson, …/carter-ogunsola). O site de música premiado lido (Paul Kalkbrenner, 02/09/2026) **não usa WebGL**: duas cores, faixas, CD e vinil na primeira tela (https://www.awwwards.com/sites/paul-kalkbrenner). FWA e Godly não deram nada conferível (FWA só carrega por script; Godly redireciona para outro site).
- Páginas de produtos de música lidas em texto (Apple Music, Roon, Bandcamp, Qobuz, Teenage Engineering): manchete curta, uma chamada só, explicação do som em palavras simples. O Roon promete «navegar, descobrir, colecionar, ouvir»; o Bandcamp trata vinil e CD como categorias de primeira classe: os dois perto do inventário do Album Blender.

**As restrições de engenharia**

- three.js 0.185.0 (junho de 2026): **154,7 KB comprimido** (72,4 + 82,3 KB, brotli do próprio CDN), 751 KB sem compressão, medido hoje. Usei a 0.185.0 e não a 0.187.0 (a mais nova) porque a 0.187.0 importa um arquivo sem minificar (1,47 MB) se não houver mapa de importação.
- Não há número oficial de custo de WebGL no celular (web.dev e Chrome não têm o artigo); o MDN dá só o qualitativo: menos chamadas de desenho, textura menor, tratar a perda de contexto (https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices). O Caixote limita a densidade de pixels a 1,5 no celular (valor de fórum, **não confirmado como oficial**) e para de desenhar fora da tela.
- WebGL ausente: `getContext('webgl2', {failIfMajorPerformanceCaveat:true})` devolve `null` e recusa o contexto lento por software (MDN, getContext). É assim que o Caixote decide cair no leque de capas em CSS.
- Movimento reduzido: o alvo é tirar o movimento não essencial; no script, ouvir a mudança da preferência (web.dev, https://web.dev/articles/prefers-reduced-motion; MDN). As três têm versão parada que parece acabada.
- Primeira pintura: LCP bom até 2,5 s no percentil 75 (web.dev, https://web.dev/articles/lcp). Nas três o texto não espera script nenhum; o three.js só é pedido depois que a página carregou.
- Animação guiada pela rolagem em CSS (`animation-timeline`): Chrome 115, Safari 26 (setembro de 2025), Firefox 159 (27/10/2026): «Baseline» há três semanas (web-features explorer, MDN, Chrome for Developers, WebKit). Quem tem Safari anterior ao 26 não tem; o Lado A, lado B usa a do CSS quando existe e um script curto quando não.

## As três direções

| | **Brasa** (Consolidar) | **Lado A, lado B** (Elevar) | **Caixote** (Transformar) |
|---|---|---|---|
| A imagem | o tipo grande; um leito de fogo e um equalizador que respira, embaixo do texto | capa e vinil em CSS 3D; o vinil gira com a rolagem; o fio do equalizador no topo acende até a «faixa» em que você está | nove capas fictícias em roda, em WebGL, que você gira; luz de fogo que tremula; vinil saindo da capa da frente; equalizador 3D |
| O que a pessoa sente | calor, sobriedade, o logotipo em grande | ouvir um disco do começo ao fim: A1, A2… virar o disco, B1 | estar numa loja de discos, folheando o caixote |
| Custo de construir | o menor: uma página estática, um canvas de ~2 KB de código | médio: CSS 3D, animação por rolagem com plano B, o fio | o maior: cena 3D, texturas geradas, toque e teclado, plano B, testes em aparelhos |
| Peso medido (primeira visita) | ≈ 88 KB na primeira visita (página 53 KB, 34 KB comprimida; fonte Syne 35 KB); nenhuma biblioteca | ≈ 91 KB na primeira visita (página 56 KB, 34 KB comprimida; fonte 35 KB); nenhuma biblioteca | ≈ 254 KB na primeira visita (página 64 KB; fonte 35 KB; three.js 0.185.0, 155 KB comprimido, baixado depois do texto) |
| Primeira pintura (computador, sem cache) | não medida (a medição em lote não rodou: a fila da máquina não andou) | 0,24 s a 393 px (Chrome sem cache, medida antes das correções da crítica) | 0,36 a 0,38 s; o 3D chega depois (Chrome sem cache, medida antes das correções) |
| Risco no celular | quase nenhum; o fogo para fora da tela | baixo; giro só com rolagem | bateria e calor com a cena aberta; aparelhos sem WebGL caem no leque parado |
| Acessibilidade | texto real, alvos de 44 px, «Pause motion» | o mesmo; o fio é enfeite, escondido sem script | o mesmo, mais girar sem arrastar (‹ ›, setas); o leitor de tela ouve só o giro que a pessoa pediu |
| Sem WebGL / sem script / menos movimento | não usa WebGL; sem script, some o fogo; menos movimento, um quadro parado | não usa WebGL; sem script, some o fio; menos movimento, disco parado | leque de capas em CSS, parado, nos três casos |

As três têm o mesmo texto nos três momentos (série, ranking e mistura, coleção), na prova («Shuffle keeps the hits and loses the record. The Blender starts from the record.», com um exemplo de faixas ordenadas marcado «Illustrative · fictional album») e nas chamadas («Open the app», «Sign in»). O título e o subtítulo mudam com a imagem; a proposta de copy dá opções para cada um, e qualquer título serve em qualquer direção.

## Minha recomendação

**O Lado A, lado B.** É a única em que a forma da página conta a ideia do produto: um álbum se ouve inteiro, do lado A ao lado B, e a página se lê assim. Tem profundidade e movimento sem biblioteca, pesa perto da Brasa e não tem o risco de bateria do Caixote. Falta nela o fogo em movimento (só o do logotipo): se você quiser, a próxima versão põe o leito de fogo da Brasa no «Flip the record», sem mudar o resto. A crítica de UX também a viu como o melhor equilíbrio.

Se o «3D» do pedido for literal, o **Caixote** é o que entrega, e é viável: o texto aparece antes, o 3D chega em seguida e cai num plano B parado. Mas custa o triplo em bytes, mais trabalho de construção e testes em iPhone que esta máquina ainda não faz (sem Xcode).

## Onde a página mora

| Lugar | Ganha | Perde |
|---|---|---|
| **Na raiz (`/`), só para quem não entrou**; quem já tem conta vai direto ao app | o endereço que as pessoas e os buscadores já têm vira a página pública; nada muda para quem usa | o app hoje é uma página única que abre na Home: a raiz passa a decidir entre duas coisas pelo estado da conta, e a página precisa ser servida sem o app (para ser lida sem script) |
| **Num endereço próprio** (por exemplo `/welcome` ou um domínio só dela) | não toca no app; pode ser publicada separada | ninguém chega a ela sem um link; o buscador indexa o app na raiz |
| **No lugar da Home de hoje** | um só começo | mistura a página que vende com a tela que trabalha; a F79 está redesenhando essa Home |

Recomendo **a raiz, só para quem não entrou**, como um arquivo HTML estático servido antes do app. É a única opção que dá a um buscador e a um assistente de IA uma página para ler no endereço principal (o candidato de GEO e AEO do PRD). A decisão é sua e muda o plano técnico da F80.

## O que não fiz, ou não pude conferir

- **Medição no iPhone:** não houve; desempenho e bateria do Caixote num iPhone real ficam por medir.
- **Medição completa:** o peso foi medido no navegador do painel (Chrome desta máquina, 1280 e 393 px) e a primeira pintura num Chrome sem interface, antes das correções da crítica. A medição final em lote (WebGL desligado de verdade, movimento reduzido, sem JavaScript) **não rodou**: a fila da máquina ficou ocupada por outra sessão durante uma hora. O plano B sem WebGL foi conferido pelo `?nogl` (o mesmo caminho: o three.js nem é pedido); o movimento reduzido e o sem-JavaScript foram conferidos só lendo o código. O 3D com WebGL foi visto rodando no painel, nas duas larguras.
- **Os sites premiados rodando:** a pesquisa leu as páginas em texto; nada se afirma sobre como eles se movem.
- **A leitura do coach** (valor, usabilidade, viabilidade) não rodou nesta sessão; as três perguntas estão abertas nas notas da rodada.
- **Som:** nenhuma direção toca música. Tocar trechos de álbum numa página pública pede licença.
- **Achados da crítica que ficaram** (P2 e um P1 de decisão sua): listados no fim do relatório da crítica. O principal: no Lado A, lado B, se o fogo do logotipo basta ou se a direção pede fogo em movimento.

## Perguntas para você

1. **Qual direção** segue para a próxima rodada, ou que mistura (por exemplo, o Lado A, lado B com o fogo da Brasa)?
2. **Capas:** a página pública usa só capas inventadas, como os protótipos, ou você quer capas reais? Capa real é obra de terceiros: numa página pública, pede autorização de quem tem os direitos (gravadora, artista) ou uma base legal que eu não sei afirmar. Recomendo capas inventadas.
3. **Onde mora:** a raiz só para quem não entrou (minha recomendação), um endereço próprio, ou no lugar da Home?
4. **A voz:** a voz que li (quem ama discos falando com outro ouvinte, casual, séria, entusiasmada com contenção) está certa? Ela vale para o site todo?
5. **«By critics» em público:** a página fala em ranking da crítica sem citar a fonte. Com a autorização do BestEverAlbums ainda em aberto, fica assim, genérico?
6. **O inventário:** é só de CDs, ou de qualquer formato? A frase do momento 3 muda conforme.
7. **O botão principal com texto preto** sobre o degradê «flame»: aprova para a página pública? E para o app?
8. **Quantas rodadas e que fidelidade** você quer antes de esta página virar o protótipo julgado da F80?
