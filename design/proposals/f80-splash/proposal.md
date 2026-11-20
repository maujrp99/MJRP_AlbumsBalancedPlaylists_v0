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

---

# Rodada 2 · o Caixote, com o fio e o fogo (2026-11-20)

> O que você decidiu: «ok sigamos sua sugestao para as capas e vamos fazer um prototipo da transformar mas adicionando o slider da elevar e a brasa de consolidar, como vc faria pra harmonizar e utilizar todos esses elementos visuais?» Capas reais (as do Apple Music que o app já mostra, com crédito e link). Nada aqui está aprovado.

- Protótipo: `design/inception/splash-crate-v2.html` (a v1 fica intacta, para comparar).
- Comparador, o mesmo link: https://claude.ai/artifact/5hDJr8qToYkAEsgCrfUK8e — abre em «Caixote · v2 (o fogo e o fio)», ao lado da prévia do fogo vivo e do «Caixote · v1»; Brasa e Lado A, lado B ficam dobradas em «As outras direções (rodada 1)». Cópia local: `design/proposals/f80-splash/comparator.html`.
- Crítica separada: `reports/audits/2026-11-20-f80-splash-round2-ux-audit.md`.

## Como os três se harmonizam: um trabalho para cada um

| Elemento | O trabalho dele | O que ele não faz mais |
|---|---|---|
| **O caixote** (Caixote) | o palco: o único objeto 3D, preso à direita do texto do começo ao fim; 14 discos de pé num caixote de madeira escura | não gira sozinho, não se arrasta, não tem ‹ ›, não tem vinil nem equalizador 3D (saíram para a progressão caber) |
| **A rolagem** (o «slider» do Lado A, lado B) | o disco tocando: cada faixa da página puxa **um** disco do caixote e conta uma coisa que o produto faz — A2 série, A3 ranking, A4 mistura, A5 coleção; «Flip the record» gira o caixote e o lado B mostra o outro lado: B1 por que álbuns inteiros, B2 o convite | nunca é sequestrada: é a rolagem do navegador que dita onde o caixote está |
| **O fio do equalizador** | o progresso e a navegação: um grupo de barras por faixa, aceso até onde você leu; o grupo atual respira | o equalizador só aparece aqui e dentro do «Open the app» |
| **O fogo** (Brasa) | a luz: um leito de brasas baixo no palco e a luz de baixo nas capas; forte na primeira tela e no convite, brando no meio | nunca atrás de texto, nunca disputando com uma capa |

Uma coisa se move de cada vez; o que se moveu termina parado; o movimento automático (o fogo, as barras) para sozinho 10 s depois da última rolagem, e «Pause motion» para tudo.

**Onde saí do conceito que me deram.** (1) **No celular o fio não corre pela lateral**: ele desce para a barra de baixo, junto de «Open the app». Uma trilha na lateral comeria ~24 px dos 361 px de texto e o rótulo não se leria em pé; na barra de baixo ele junta as duas coisas que o celular precisa à vista: onde estou e a ação principal. Lá ele é só progresso (sem toque), porque sete alvos em 200 px dariam menos de 44 px cada (achado da crítica). (2) **No celular o caixote não acompanha a rolagem**: um caixote preso no topo tomaria ~18 % da tela durante toda a leitura; em vez disso o caixote em CSS fica sob a primeira tela e **cada faixa traz o seu disco** (a capa sobe uma vez quando entra e para), com crédito e link. Nenhum WebGL no celular. (3) **O caixote tem 14 discos**, não nove: sete por lado, para o lado B ser outro disco de verdade.

## O que mudou da v1

- Capas reais no lugar das fictícias; o selo «Fictional» saiu; entrou a legenda do disco com «Listen on Apple Music».
- O caixote passou de carrossel (gira, arrasta) a palco (puxa um disco por faixa); o vinil, o equalizador 3D, o giro automático e os botões ‹ › saíram.
- O fio do Lado A, lado B entrou, com «Flip the record» girando o caixote.
- O fogo virou luz de baixo e leito de brasas, forte em dois momentos.
- O momento 2 da v1 (ranking e mistura) virou duas faixas (A3 ranking, A4 mistura); a coleção ganhou o valor estimado.
- A primeira frase da página é a definição do produto, também no celular (achado C1 da rodada 1).

## A dúvida que fica com você: a força do fogo

Duas prévias da mesma página, só o fogo muda: **brando** (o padrão; `?fire=soft`) e **vivo** (`?fire=bright`). Recomendo o brando: as capas reais já trazem toda a cor, e o fogo forte nas faixas do meio puxa o olho para fora do disco. O vivo vale se você quiser o fogo mais presente na identidade.

## As capas

Capturadas do app rodando (a sua coleção em http://127.0.0.1:5010/albums, só leitura), 14 discos de épocas e cores variadas, em WebP de 360 px, **211 KB no total** (embutidos na página; 359 KB de página, 213 KB com gzip). **Os direitos das capas são dos artistas e das gravadoras**, não do Album Blender nem da Apple:

| Lado | Disco | Artista | Ano |
|---|---|---|---|
| A | In the Court of the Crimson King | King Crimson | 1969 |
| A | Harvest | Neil Young | 1972 |
| A | The Dark Side of the Moon | Pink Floyd | 1973 |
| A | Low | David Bowie | 1977 |
| A | Power, Corruption & Lies | New Order | 1983 |
| A | Dummy | Portishead | 1994 |
| A | Illmatic | Nas | 1994 |
| B | Close to the Edge | Yes | 1972 |
| B | Homogenic | Björk | 1997 |
| B | Mezzanine | Massive Attack | 1998 |
| B | In the Aeroplane Over the Sea | Neutral Milk Hotel | 1998 |
| B | Admirável Chip Novo | Pitty | 2003 |
| B | Desire, I Want to Turn Into You | Caroline Polachek | 2023 |
| B | To Pimp a Butterfly | Kendrick Lamar | 2015 |

Os links «Listen on Apple Music» vêm da busca pública do iTunes; dois não acharam o álbum certo e apontam para a busca do Apple Music (The Dark Side of the Moon, Homogenic). Na construção, o link sai do identificador que o app já guarda de cada álbum. A nitidez fica abaixo de 1,0 no computador (360 px desenhados a ~300 px numa tela 2x): 600 px custaria o dobro de bytes. O que gera a página: `design/proposals/f80-splash/build/` (modelo e script; as capas não ficam no repositório, só dentro da página).

## A exigência da Apple — **a confirmar antes de publicar**

O que os textos atuais da Apple dizem (lidos em 2026-11-20; resumo, não parecer jurídico):

- **Contrato do programa de desenvolvedor (DPLA), 3.3.6(D) «MusicKit»**, atualizado em 29/10/2026 (https://developer.apple.com/support/terms/apple-developer-program-license-agreement/): a capa e o texto vindos da API do MusicKit não podem ser usados separados da reprodução de música ou da gestão de playlists; não se pode baixar, modificar ou sincronizar o conteúdo, salvo o que a documentação permitir; é preciso seguir as diretrizes de identidade do Apple Music.
- **Diretrizes de revisão da App Store, 4.5.2(ii)**, atualizadas em 16/10/2026 (https://developer.apple.com/app-store/review/guidelines/): capa e metadados só junto da reprodução ou de playlists (inclusive capturas que mostram o app funcionando); em marketing ou publicidade, só com autorização específica dos donos dos direitos. Isso vale para apps; **não confirmei** se rege um site.
- **Diretrizes de identidade do Apple Music** (https://marketing.services.apple/apple-music-identity-guidelines; sem data além de © 2023): o selo oficial «Listen on Apple Music», sem alteração, com link para o Apple Music, abaixo ou à direita do conteúdo e menor que as imagens; mínimo de 30 px; «Apple Music» por extenso; não sugerir patrocínio; a linha de marca «Apple and Apple Music are trademarks of Apple Inc., registered in the U.S. and other countries.» uma vez no site.
- **Não encontrei** página da Apple dizendo que a capa é dos artistas e gravadoras e que a Apple não cede direito sobre ela; a página da `artwork` da API não traz regra de uso.

**Leitura:** a página de entrada é marketing, e as capas nela estão separadas da reprodução. Pelos dois primeiros textos, isso pede a autorização dos donos dos direitos (ou uma base legal que eu não sei afirmar). **A confirmar antes de publicar**; até lá, o protótipo diz isso na faixa do topo. O protótipo já traz o que a identidade pede, menos o selo oficial (um botão de texto no lugar; o arquivo do selo não foi baixado). Plano B se não liberar: as capas fictícias da v1 no mesmo caixote, sem mudar mais nada.

## O texto (inglês, proposto pelo agente)

- **Título:** «Dig through the albums you love. Keep every track.» · **Primeira frase:** «The Album Blender is a web app for people who listen to whole albums.»
- **A2 Series:** «Gather the albums that belong together.» · **A3 Ranking:** «Rank every track, not just the singles.» — «by how often they are played, by published rankings where the app has them, or by your own ear»: não promete a nota da crítica (a autorização do BestEverAlbums não está garantida, estudo § 2.2) e não cita nenhuma fonte. · **A4 Blend:** «Blend the series into one playlist.» · **A5 Your shelf:** «Keep count of the records you own.» (com o valor estimado; o formato fica em aberto, pergunta 6 da rodada 1).
- **Flip:** «Flip the record.» — «Side B is the why, and the way in.» · **B1:** «Shuffle keeps the hits and loses the record. The Blender starts from the record.» · **B2:** «Drop the needle on your first series.» · **Chamadas:** «Open the app», «Sign in».
- Nenhum número inventado, nenhum depoimento, nenhum parceiro nomeado (nem BestEverAlbums, nem Spotify, nem Discogs).

## O que um buscador ou um assistente lê (sem JavaScript)

```
The Album Blender — for people who listen to whole albums
Sign in · Open the app
For whole-album listeners
Dig through the albums you love. Keep every track.
The Album Blender is a web app for people who listen to whole albums. Gather albums into series, rank every track, and blend them into playlists that keep every record in the mix — then keep count of the ones on your shelf.
Side A · 2 — Series. Gather the albums that belong together. An artist's run, a decade, a mood: a series is a shelf of whole albums you choose. Every blend starts there.
Side A · 3 — Ranking. Rank every track, not just the singles. Order each album's tracks by how often they are played, by published rankings where the app has them, or by your own ear. The deep cuts get a place in line. [Illustrative · fictional album — Copper Year, 4 tracks; Example data, not real scores.]
Side A · 4 — Blend. Blend the series into one playlist. Pick a recipe and the Blender draws tracks from every album in the series, so no record drowns out the rest. You choose how long it runs and what leads.
Side A · 5 — Your shelf. Keep count of the records you own. Mark the albums on your shelf, see an estimate of what the collection is worth, and what the missing ones would cost.
End of Side A. Flip the record. Side B is the why, and the way in.
Side B · 1 — Why whole albums. Shuffle keeps the hits and loses the record. The Blender starts from the record. An album has an order: an opening, a turn, a closer. …
Side B · 2 — Start. Drop the needle on your first series. Open the app and start a series with one album you love. Sign in to keep your series, rankings and shelf with you.
[14 images: "In the Court of the Crimson King by King Crimson (1969), album cover" … "To Pimp a Butterfly by Kendrick Lamar (2015), album cover"]
In the Court of the Crimson King — King Crimson · 1969 — Artwork from Apple Music — Listen on Apple Music
Album artwork comes from Apple Music and belongs to the artists and labels; every record shown whole on this page links to its page on Apple Music. Apple and Apple Music are trademarks of Apple Inc., registered in the U.S. and other countries.
```

A página diz o que o produto é na primeira frase depois do título. (Lido do HTML sem scripts e sem estilos; a faixa e as notas do protótipo saem do site.)

## As medidas (2026-11-20, nesta máquina)

| Medida | Resultado | Como |
|---|---|---|
| Peso | página 359 KB (213 KB gzip), das quais 211 KB são as capas; fonte Syne 35 KB; three.js 0.185.0 ≈ 155 KB comprimido (751 KB sem compressão), pedido só no computador, com WebGL, depois do `load` | servidor local, Chrome do painel (recursos) e gzip local |
| Primeira visita | ≈ 405 KB no computador; ≈ 250 KB no celular (sem three.js) | soma das linhas acima |
| Primeira pintura | **não medida**: o painel estava oculto (o Chrome não registra pintura em aba de fundo) e a leitura sem interface (`--dump-dom`) não devolveu o valor. O texto não espera script nenhum; o three.js só é pedido depois do `load` | — |
| Quadros na rolagem | **não medidos** (mesma razão); o 3D desenha só quando algo muda e para quando assenta | — |
| Sem WebGL | o caixote em CSS com as mesmas capas e a pilha certa (captura sem interface com `--disable-webgl`, 1280×800: vista) | Chrome sem interface, pela fila da máquina |
| Movimento reduzido | composição parada e acabada: o caixote em CSS, o fogo num quadro, o fio sem pulsar, sem «Pause motion» (capturas a 1280×800 e 393×852 com `--force-prefers-reduced-motion`: vistas) | idem |
| 3D com WebGL | visto rodando no painel a 1280×800: primeira tela, A3 (Low puxado), meio do giro, B1 e B2 | painel do navegador |
| Celular 393×852 | primeira tela com título, definição e chamadas; caixote em CSS sob ela; disco por faixa; barra de baixo com o fio e «Open the app» | painel |
| Contraste | branco 19,8:1; texto secundário `#b9b9c2` 10,2:1; texto fraco `#9a9aa4` 7,1:1; laranja `#fb923c` 8,7:1; título laranja `#f97316` 7,1:1; links `#d6d6dc` 13,7:1; faixa do protótipo 15,4:1; preto no degradê 7,0:1 (laranja) a 4,1:1 (vermelho), 5,2:1 no meio; borda do botão secundário 7,7:1 | cálculo WCAG das cores declaradas |
| Fontes carregadas | Syne 700 e 800 (`document.fonts`), o corpo na fonte do sistema | painel |

## A crítica (agente separado)

Passa, sem P0; 4 P1 e 12 P2 (`reports/audits/2026-11-20-f80-splash-round2-ux-audit.md`). **Corrigi nesta rodada:** o fio do celular deixou de ser uma fila de alvos pequenos (é progresso, sem toque); cada disco mostrado inteiro no celular tem crédito e link, e a frase do rodapé diz só o que a página faz; o `info-arch.md` descreve a v2; os padrões que divergem estão no `design-system.md` como pendentes; B1 voltou a ter título de seção; sem JavaScript o caixote mostra as capas do lado A. **Fica:** o contraste do texto preto no fim vermelho do degradê (4,1:1 a 18 px peso 800, que a crítica não conta como texto grande) — o botão de texto preto já é pergunta sua (7 da rodada 1); os outros P2 estão no relatório.

## O que ainda precisa de você

1. **As capas reais em público:** liberar com a Apple e os donos dos direitos, ou ficar com as fictícias. Sem isso a página não vai ao ar com as capas.
2. **A força do fogo:** brando (recomendo) ou vivo.
3. **Onde a página mora:** a raiz só para quem não entrou (minha recomendação da rodada 1), um endereço próprio, ou no lugar da Home.
4. **A voz** e o texto em inglês; o formato do inventário (só CD ou qualquer formato); o botão principal com texto preto. (Perguntas 4, 6 e 7 da rodada 1, abertas.)
5. **Se esta é a fidelidade** para virar o protótipo julgado da F80, ou se quer outra rodada.

## O que não pude conferir

A primeira pintura e os quadros por segundo (acima); o 3D num iPhone ou num computador sem placa de vídeo dedicada; a página sem JavaScript foi lida do HTML e julgada pela crítica, não capturada (a captura sem script falhou); o selo oficial do Apple Music (não baixado); se a regra 4.5.2 da App Store vale para um site.
