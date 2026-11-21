# Régua do volume de texto por tela — pesquisa e medida (computador e telefone)

> Pesquisa · 2026-11-21 · ramo `claude/f81-copy-volume-research` (F81, os textos do site) · pedido do orquestrador do harness, a partir das palavras do MJRP (2026-11-21): «o copy que pretendo gerenciar no CMS … está bem verbose … gostaria de uma revisao de UX e Copyright para o volume de copy no site … tanto para web qto para mobile».
> Procedimento: `docs/wiki/kernel/design/design-research.md` do harness. Só medida e proposta: nenhum texto do site foi reescrito; o cânone e as skills não foram editados.
> Ao lado: `2026-11-21-copy-volume-ruler/measure-copy-volume.cjs` (mede páginas públicas), `apply-ruler-to-deck.py` (aplica a régua ao documento de copy) e `raw/` (medidas brutas em JSON, linhas por parágrafo e as capturas de tela).

## Resumo em cinco linhas

1. As fontes primárias quase não dão número por elemento. Os poucos números confirmados: título 65 caracteres e resumo 160 (GOV.UK); frase acima de 25 palavras se divide (GOV.UK); título de erro 3–4 palavras, corpo 1–2 frases, botão 1–2 palavras (Atlassian); aba com uma palavra (Apple); parágrafo de 3 a 7 linhas (Microsoft); linha de no máximo 75 a 80 caracteres (GOV.UK, WCAG).
2. Nenhuma fonte dá «X palavras a menos no telefone». A NN/g (2016) não achou diferença prática de compreensão entre telefone e computador, mas diz que a brevidade «continua crítica». A régua do telefone, então, se mede em **linhas**, não em palavras.
3. Elemento por elemento, o V0 está quase todo dentro do teto. O excesso está no **bloco** (o subtítulo da página de entrada tem 43 palavras e 5 linhas), na **altura dos títulos** (títulos de 6 ou 7 palavras ocupam 3 ou 4 linhas, por causa do tamanho da letra) e na **quantidade de textos por tela** (o Inventário tem 231 textos).
4. Na primeira tela, o V0 está na faixa dos produtos medidos: 84 palavras no computador e 64 no telefone. Spotify tem 99 e 63; Linear tem 78 no computador.
5. Proposta ao harness: uma disciplina nova, **CV · Volume de copy** (CV-01 a CV-07), com teste de sim ou não. Mais um passo «medir o texto» na `mjrp-critiquing-ux-ui`, a tabela de alvo e teto na `mjrp-copywriting` e a coluna «Teto» na `mjrp-generating-copy-deck`.

## 1. Leitura da palavra

«Volume de copy» é a quantidade de texto que a pessoa vê, contada de três jeitos:

- por **elemento**: um botão, um título, uma mensagem;
- por **bloco**: o título com o subtítulo, ou um parágrafo;
- por **tela**: o que se vê sem rolar, e a página inteira.

A pesquisa não cobre tom de voz nem qualidade da frase: isso já está nas regras CO-06 e CW-04 do cânone.

## 2. Catálogo antes da busca

Li o catálogo do harness antes de buscar. As fichas que já existem em `docs/wiki/sources/` são:

- Morkes e Nielsen 1997
- Redish 2012
- Krug 2000
- NN/g, divulgação progressiva (2006)
- CDC Clear Communication Index
- ISO 24495-1
- WCAG 2.2
- Mailchimp
- Apple HIG e Material 3 (2021)

Nenhuma dessas fichas traz número de volume por elemento ou por tela. O cânone tem o princípio (CO-06 e CW-04: «uma ideia por frase», «conciso»), mas não a medida.

## 3. Buscas

- Em inglês:
  - «UX writing character limits button label»
  - «how little do users read»
  - «GOV.UK sentence length 25 words»
  - «Atlassian error message content guidelines»
  - «Microsoft style guide scannable content paragraph length»
  - «mobile content comprehension Nielsen»
  - «WCAG reading level 3.1.5»
- Em português, sem resultado primário melhor que os de inglês:
  - «limite de caracteres botão UX writing»
  - «tamanho de frase linguagem simples»

A coleta das fontes foi feita por um subagente (Sonnet). Cada página foi aberta nesta sessão em 2026-11-21.

## 4. Páginas abertas nesta resposta (fontes)

Todas foram abertas em 2026-11-21. As páginas da Apple só devolvem conteúdo por JavaScript; foram lidas pelo JSON de conteúdo da própria Apple (`developer.apple.com/tutorials/data/design/human-interface-guidelines/<página>.json`), que é o corpo da mesma página.

| Fonte | Endereço | Tipo | O que diz sobre tamanho | Citação curta |
|---|---|---|---|---|
| Apple HIG · Writing | developer.apple.com/design/human-interface-guidelines/writing | regra de plataforma | Sem número. Use menos palavras quando puder. Telas pequenas pedem brevidade. Botão com verbo. Erro diz o que fazer. Tela vazia dá o próximo passo. | «their small screens require brevity» |
| Apple HIG · Alerts | …/alerts | regra de plataforma | O título do alerta não passa de duas linhas; a mensagem é «a mais curta possível», e só aparece quando é necessária. | «avoid overly long titles» |
| Apple HIG · Buttons | …/buttons | regra de plataforma | «Poucas palavras», sem número. Um ou dois botões de destaque por vista. | «write a few words that succinctly describe» |
| Apple HIG · Tab bars | …/tab-bars | regra de plataforma | Rótulo de aba: uma palavra quando possível. Cinco abas ou menos por padrão. | «Use single words whenever possible.» |
| Apple HIG · Notifications | …/notifications | regra de plataforma | Sem número. Título breve, lido de relance. O sistema corta o que passar. | «Prefer brief titles that people can read at a glance» |
| NN/g · How Little Do Users Read? | nngroup.com/articles/how-little-do-users-read/ | pesquisa | Lê-se no máximo 28% das palavras por visita; o provável é 20%. Metade do texto só é lida em páginas de até 111 palavras. Dados de 2005. | «at most 28% of the words» |
| NN/g · How Users Read on the Web | nngroup.com/articles/how-users-read-on-the-web/ | pesquisa | 79% passam os olhos; 16% leem palavra por palavra. Texto conciso: +58% de usabilidade; texto escaneável: +47%; os três juntos: +124%. | «scan the page, picking out individual words» |
| NN/g · Concise, Scannable, Objective | nngroup.com/articles/concise-scannable-and-objective-how-to-write-for-the-web/ | pesquisa | A versão concisa tinha cerca de metade das palavras. As pessoas pedem páginas que caibam numa tela. | — (paráfrase) |
| NN/g · F-Shaped Pattern (2017) | nngroup.com/articles/f-shaped-pattern-reading-web-content/ | pesquisa | O essencial vai nos dois primeiros parágrafos; as duas primeiras palavras do título carregam o sentido. Vale no computador e no telefone. | «rarely a perfect F» |
| NN/g · Mobile Content (2016) | nngroup.com/articles/mobile-content/ | pesquisa | 276 pessoas. Sem diferença prática de compreensão entre telefone e computador. Texto difícil é lido mais devagar no telefone. A brevidade continua crítica. | «need for brevity and prioritization is still critical» |
| NN/g · Legibility, Readability, Comprehension | nngroup.com/articles/legibility-readability-comprehension/ | pesquisa | Nível de leitura de 8ª série para o público geral. | «read only 28% of the words» |
| NN/g · Inverted Pyramid | nngroup.com/articles/inverted-pyramid/ | conceito | Sem número. O essencial vem primeiro em cada título, parágrafo e frase. | «perfectly suited for the web» |
| NN/g · Error Message Guidelines | nngroup.com/articles/error-message-guidelines/ | pesquisa | Sem número. Ser conciso e preciso. | — |
| GOV.UK · Clear titles | guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/writing-guidelines/clear-titles/ | padrão | Título com 65 caracteres ou menos, por causa do corte do Google. | «65 characters or less (including spaces)» |
| GOV.UK · Summaries | …/writing-guidelines/summaries/ | padrão | Resumo com até 160 caracteres. | «Keep all summaries to 160 characters» |
| GOV.UK · Clear language | …/writing-guidelines/clear-language/ | padrão | Frase com mais de 25 palavras se divide. Parágrafo com no máximo 5 frases. | «over 25 words long» |
| GOV.UK blog · sentence length (2014) | insidegovuk.blog.gov.uk/2014/08/04/sentence-length-why-25-words-is-our-limit/ | blog (pesquisa secundária) | Cita Ann Wylie: frase média de 14 palavras, mais de 90% de compreensão; com 43 palavras, menos de 10%. | «comprehension drops to less than 10%» |
| GOV.UK Design System · Text input | design-system.service.gov.uk/components/text-input/ | padrão | Dica: uma frase curta, sem ponto final. O placeholder não substitui o rótulo nem a dica. | «a single short sentence» |
| GOV.UK Design System · Button / Error message / Layout | …/components/button/, …/error-message/, …/styles/layout/ | padrão | Botão: sem limite (os exemplos vão de 1 a 6 palavras). Erro: sem limite; diz o que houve e como resolver. Linha com no máximo 75 caracteres. | «no more than 75 characters per line» |
| Microsoft Style Guide · Top 10 tips | learn.microsoft.com/en-us/style-guide/top-10-tips-style-voice | padrão | Sem número. Mais curto é sempre melhor. | «Shorter is always better.» |
| Microsoft · Scannable content / Headings | learn.microsoft.com/en-us/style-guide/scannable-content | padrão | Parágrafo de 3 a 7 linhas. A primeira tela é a mais lida. Título o mais curto possível. | «Three to seven lines is about the right length» |
| Atlassian · Error messages | atlassian.design/foundations/content/designing-messages/error-messages | padrão | Título com 3 ou 4 palavras. Corpo com 1 ou 2 frases. Chamada com 1 ou 2 palavras. | «Limit your CTA to 1 or 2 words.» |
| Atlassian · Empty state | atlassian.design/foundations/content/designing-messages/empty-state | padrão | Corpo com 1 ou 2 frases. Chamada com 1 ou 2 palavras. Título o mais curto possível. | «Keep messages one to two sentences long.» |
| Shopify · App design content | shopify.dev/docs/apps/design/content | padrão | Nível de leitura de 7ª série. Sem limite de palavras. | «aim for a United States grade 7 reading level» |
| digital.gov · Plain language | digital.gov/guides/plain-language/writing/clear-short | padrão | Parágrafo com até 150 palavras, de 3 a 8 frases; nunca acima de 250. | «never be longer than 250 words» |
| Mailchimp · Writing for accessibility | styleguide.mailchimp.com/writing-for-accessibility/ | padrão | Sem número. Frases curtas. | «The shorter the form, the better.» |
| WCAG 2.2 · 3.1.5 Reading Level (AAA) | w3.org/WAI/WCAG22/Understanding/reading-level.html | norma | Texto acima do ensino fundamental II pede versão mais simples. | «more advanced than the lower secondary education level» |
| WCAG 2.2 · 1.4.8 Visual Presentation (AAA) | w3.org/WAI/WCAG22/Understanding/visual-presentation.html | norma | Linha com no máximo 80 caracteres. | «no more than 80 characters or glyphs» |
| WCAG 2.2 · 1.4.10 Reflow (AA) | w3.org/WAI/WCAG22/Understanding/reflow.html | norma | O conteúdo funciona a 320 px de largura, sem rolagem nos dois sentidos. | «without requiring scrolling in two dimensions» |

Pontos sobre as fontes:

- **Os números de título (65) e de resumo (160)** vêm do corte do buscador, não de pesquisa de leitura.
- **As fontes discordam no nível de leitura:** 7ª série para a Shopify, 8ª para a NN/g, até a 9ª para a WCAG.
- **As fontes discordam na linha:** 75 caracteres para a GOV.UK, 80 para a WCAG.

## 5. Produtos medidos (referência)

**Como foi medido.** Com o script `measure-copy-volume.cjs` (Playwright, Chromium sem interface, sem login e sem clique), em 2026-11-21 às 10:45. Duas larguras:

- computador: 1280 × 800;
- telefone: 390 × 844, com agente de iPhone.

Para repetir a medida:

```bash
PW=<caminho>/node_modules/playwright node measure-copy-volume.cjs raw/measures.json nome=url …
```

Regras de contagem:

- **Primeira tela:** conta o texto cuja linha cruza a janela inicial, com a página no topo.
- **Texto que não conta:** o aviso de cookies e o dado de catálogo (nome de álbum, artista ou faixa, porque é conteúdo, não texto do produto) ficam à parte.
- **Tipo do elemento:** é decidido pelo ancestral mais próximo, por heurística. Por exemplo, `h1` é título e `button` é botão.
- **Parte da primeira tela que é texto:** soma das caixas de linha, dividida pela área da janela. Esse número inclui o aviso de cookies.

| Produto · página | Primeira tela, computador (palavras de copy) | Primeira tela, telefone | Parte da 1ª tela que é texto (comp. / tel.) | Título + subtítulo do topo | Observação |
|---|---|---|---|---|---|
| Spotify · início (open.spotify.com) | 99 (35 de menu) | 63 | 19% / 25% | — | No telefone, um cartão de oferta de 60 palavras e o aviso de cookies (43) ocupam a tela. |
| Spotify · página de álbum | 94 (35 de menu, 18 de botões) | 22 | 15% / 21% | título 6 | A tela de trabalho pública mais próxima do V0. No telefone, fora os nomes das faixas, sobram 22 palavras. |
| Bandcamp · início | 49 | 43 | 14% / 29% | título 14 (com números) | O aviso de cookies tem 66 palavras e cobre boa parte da tela do telefone. |
| Linear · início | 78 | 152* | 16% / 21% | título 8 + subtítulo 11 | *Inclui o texto de uma tela falsa do produto, desenhada em HTML (~90 palavras). |
| Discogs · início | não medido (bloqueio anti-robô) | 13 + 104 de cookies | — / 28% | — | No computador, o Cloudflare mostrou a página de verificação; não conta. |
| **V0 · entrada (`/?entry`)** | **84** | **64** | **16% / 32%** | **título 9 + subtítulo 43** | O subtítulo tem duas frases (14 + 29 palavras). |

O que isso ensina:

1. **Primeira tela, só o texto do produto:** cerca de 50 a 100 palavras no computador e 20 a 65 no telefone.
2. **No topo:** os produtos de copy elogiada usam até ~20 palavras no título com o subtítulo (Linear: 19). O V0 usa 52.
3. **Página inteira:** a Linear tem 1196 palavras em 12 alturas de tela, cerca de 100 por tela. O V0 tem cerca de 425 palavras em 6,5 alturas, cerca de 65 por tela. **A página de entrada do V0 não é longa para o gênero; pesa o tamanho de cada bloco.**

## 6. A régua proposta

**Como contar** (vale para toda a régua):

- **Tela:** um estado de uma rota, o que aparece sem abrir nada. Um modal ou uma gaveta aberta é outra tela.
- **Visível:** texto com estilo visível, cuja linha cruza a janela inicial (para a primeira tela) ou a página toda (para a página inteira).
- **Fica fora:** texto só para leitor de tela (`aria-label`, `sr-only`), texto alternativo, aviso de cookies, dado de catálogo e conteúdo da própria pessoa (nome de série, de playlist). O texto alternativo tem regra própria, a CW-10.
- **Placeholder:** conta à parte, porque some quando se digita.
- **Rótulo repetido:** conta em toda aparição no total da tela e uma vez em «textos distintos».
- **Palavra:** sequência separada por espaço que tem letra ou número. `{}` (um valor que entra no texto) conta como uma palavra.
- **Língua:** mede-se em inglês. O português costuma ter de 5% a 15% mais caracteres (no documento de copy do V0, a página de entrada tem 2857 caracteres em inglês e 2921 em português). O teto em linhas vale para as duas línguas.
- **O texto é um só para as duas larguras.** O teto em palavras vale para todas. No telefone, o que manda é o teto em **linhas**, medido a 390 px.

**Por elemento.** Palavras em inglês. «Fonte» diz de onde vem o número; «proposta» é do agente, a partir das medidas da seção 5.

| Elemento | Alvo | Teto | Telefone (a 390 px) | Fonte do número |
|---|---|---|---|---|
| Título da página / do topo (H1) | ≤ 8 palavras | 12 palavras e 65 caracteres | ≤ 3 linhas | 65 car.: GOV.UK. 8 palavras: proposta (Linear 8, Spotify 6). 3 linhas: proposta. |
| Título de seção, de cartão, de diálogo | ≤ 4 palavras | 8 palavras | ≤ 2 linhas | 3–4 palavras: Atlassian (título de erro). 2 linhas: Apple (título de alerta). O resto é proposta. |
| Subtítulo / lede | 1 frase, ≤ 20 palavras | 160 caracteres (~25 palavras) | ≤ 4 linhas | 160: GOV.UK (resumo). 20: proposta (Linear 11). |
| Parágrafo | ≤ 25 palavras | 40 palavras; frase de no máximo 25 | ≤ 4 linhas; o resto vai para um segundo nível | Frase de 25: GOV.UK. «3 a 7 linhas» (Microsoft) vira 40 palavras no computador e 4 linhas no telefone: proposta. |
| Botão / chamada | 1–2 palavras | 4 palavras e 24 caracteres | 1 linha, sem cortar | 1–2: Atlassian. Teto: proposta (a GOV.UK aceita mais, sem dar número). |
| Aba / item de navegação | 1 palavra | 2 palavras e 14 caracteres | 1 linha; ≤ 5 itens na barra de baixo | 1 palavra e 5 abas: Apple. 14 car.: proposta. |
| Opção de menu | 2 palavras | 4 palavras | 1 linha | Proposta. |
| Dica / ajuda do campo | 1 frase curta, sem ponto, ≤ 8 palavras | 12 palavras | ≤ 2 linhas | «Uma frase curta»: GOV.UK. Os números: proposta. |
| Placeholder | só o exemplo do formato, ≤ 2 palavras | 4 palavras | 1 linha | Regra: Apple e GOV.UK. Números: proposta. |
| Estado vazio | título ≤ 4 palavras; corpo 1–2 frases (≤ 15); chamada 1–2 palavras | corpo 25 palavras | ≤ 4 linhas | Atlassian (frases e chamada). Palavras: proposta. |
| Erro | título 3–4 palavras; corpo 1–2 frases (≤ 15), dizendo o que fazer | corpo 25 palavras | ≤ 4 linhas | Atlassian; Apple e GOV.UK (dizer o que fazer). Palavras: proposta. |
| Aviso passageiro (toast) | 1 frase, ≤ 6 palavras | 10 palavras e 60 caracteres | ≤ 2 linhas | Proposta. Nenhuma fonte aberta dá número; o Material Design não abriu. |
| Dica de ícone (tooltip) | ≤ 8 palavras | 12 palavras, 1 frase | não conta com hover: o que é essencial não mora aqui | Proposta; CO-03 já tira o essencial do tooltip. |
| Carregando / andamento | ≤ 3 palavras | 6 palavras | 1 linha | Proposta (a mediana do V0 é 2). |
| Texto de cartão | título ≤ 6 palavras; descrição ≤ 15 | descrição 20 palavras | ≤ 2 linhas de descrição | Proposta. |

**Por tela.** Só o texto do produto, sem dado de catálogo, cookies ou conteúdo da pessoa.

| Medida | Computador: alvo / teto | Telefone: alvo / teto | Fonte |
|---|---|---|---|
| Primeira tela da página de entrada | 60 / 100 palavras | 40 / 70 palavras | Proposta, da faixa medida (Spotify 99/63, Linear 78, Bandcamp 49/43). |
| Título + subtítulo do topo | 30 / 40 palavras | 30 / 40 palavras e ≤ 8 linhas | Proposta (Linear 19). |
| Página de entrada inteira | ≤ 100 palavras por altura de tela | ≤ 100 palavras por altura de tela | Proposta (Linear ~100, V0 ~65). A NN/g diz que, além das 111 palavras, cada visita lê uma parte cada vez menor. |
| Tela de trabalho (um estado) | 60 / 100 palavras | 30 / 50 palavras | Proposta (álbum do Spotify: 94 no computador, 22 no telefone). |
| Mensagem principal | na primeira tela, nos dois primeiros blocos | idem | NN/g (padrão em F, pirâmide invertida); Microsoft (a primeira tela é a mais lida). |

**O que muda no telefone.** A NN/g não dá corte em palavras. O que se propõe é este:

- **Diminui:** o tamanho de display dos títulos. Um título de 6 palavras não deve ocupar mais que 3 linhas.
- **Vai para um segundo nível**, atrás de «More» ou de uma gaveta:
  - o segundo parágrafo de um bloco;
  - a explicação de método («como lemos o número»);
  - a legenda de crédito de imagem;
  - a linha de ajuda que só serve a quem já está configurando.
- **Some do telefone:**
  - o rótulo que repete o que o ícone e o título já dizem;
  - o texto da tela falsa ou ilustrativa;
  - o segundo botão igual ao do cabeçalho (o V0 mostra «Open the app» e «Sign in» duas vezes na primeira tela).
- **Nunca some:** o erro, o que a pessoa precisa para agir e a resposta ao que ela fez.

**Onde as fontes não dão número.** Aviso passageiro, dica de ícone, texto de cartão, placeholder e a medida por tela não têm número confirmado em nenhuma fonte aberta. Os números dessas linhas são proposta do agente e ficam marcados como revisáveis.

## 7. O V0 contra a régua

### 7.1 Página de entrada (medida no navegador, 2026-11-21)

| Medida | Computador (1280) | Telefone (390) | Régua | Situação |
|---|---|---|---|---|
| Primeira tela | 84 palavras | 64 palavras | 60/100 · 40/70 | entre o alvo e o teto, nas duas larguras |
| Título + subtítulo do topo | 9 + 43 = 52 palavras | 52 palavras | 30/40 | **passa do teto** |
| Subtítulo (o parágrafo do topo) | 43 palavras, 5 linhas | 43 palavras, 5 linhas | 1 frase ≤ 20 · teto ~25 palavras e 4 linhas | **passa do teto** |
| Título do topo (H1) | 9 palavras, 5 linhas | 9 palavras, 5 linhas | ≤ 3 linhas | **passa do teto em linhas** (é o tamanho da letra, não o número de palavras) |
| Títulos de seção (H2) | 6–7 palavras, 3–4 linhas | 6–7 palavras, 3–4 linhas | ≤ 4 palavras · ≤ 2 linhas | **acima do alvo em palavras e do teto em linhas** |
| Parágrafos de seção | 21–31 palavras, 2–3 linhas | 21–31 palavras, 3–4 linhas | ≤ 25 · teto 40 · ≤ 4 linhas | dentro do teto; 4 acima do alvo |
| Página inteira | 423 palavras, 6,5 alturas (~65 por altura) | 429 palavras, 6,6 alturas | ≤ 100 por altura | dentro |
| Botões repetidos na primeira tela | «Open the app» e «Sign in» 2× | 2× | um de cada | acima do alvo (o telefone deve esconder um par) |
| Descrição para buscadores (`splash.html:13`, não se vê na tela) | 189 caracteres | — | 160 (GOV.UK) | **passa do teto** |

### 7.2 Telas de trabalho (documento de copy, não o navegador)

**Fonte e limite desta medida.** A medida vem de `design/copy/album-blender-copy.md` (ramo `claude/f81-site-in-more-than-one-language`, commit `4ebb97b`, de 2026-11-21 10:16), com `apply-ruler-to-deck.py`.

Os totais **somam todos os estados** de uma tela: modais, erros e avisos que nunca aparecem juntos. Por isso, não são «o que se vê de uma vez». Essa medida precisa do navegador com a conta e não foi feita.

| Tela (documento) | Textos visíveis | Palavras (EN) | Acima do alvo | Acima do teto |
|---|---|---|---|---|
| Página de entrada | 51 | 455 | 5 | 0 (o bloco passa; ver 7.1) |
| Menu, rodapé e aplicação | 53 | 197 | 6 | 1 |
| Conta e conexões | 26 | 139 | 1 | 1 |
| Home (montar a série) | 73 | 431 | 7 | 1 |
| Séries e álbuns | 140 | 668 | 18 | 3 |
| Ranking e faixas | 60 | 210 | 1 | 1 |
| Blend | 79 | 251 | 4 | 1 |
| Algoritmos e receitas do Blend | 44 | 194 | 2 | 1 |
| Playlists | 196 | 923 | 20 | 4 |
| **Inventário** | **231** | **1369** | **33** | **7** |
| Componentes comuns | 36 | 130 | 0 | 0 |
| Em breve · Servidor · Outros | 57 | 231 | 0 | 0 |

O que a tabela mostra:

1. **O excesso não está na linha.** No documento, só 20 textos passam do teto do seu tipo. O peso está no número de textos por tela: Inventário com 231 e Playlists com 196, contra 36 nos componentes comuns.
2. **O documento parte os blocos.** O topo da página de entrada aparece em duas linhas do documento (14 e 28 palavras), e cada uma passa sozinha. O mesmo bloco reprova no navegador (43 palavras, 5 linhas).

Por isso a régua precisa medir também no navegador: o documento sozinho não pega o bloco.

### 7.3 Os dez piores (texto de hoje, sem reescrita)

A ordem é pelas palavras acima do alvo do tipo. Os itens 1 e 2 vêm do navegador; os outros, do documento.

| # | Onde | Tipo | Palavras (alvo / teto) | Texto de hoje |
|---|---|---|---|---|
| 1 | Página de entrada, topo | subtítulo | 43 (20 / 25), 5 linhas | «The Album Blender is a web app for people who listen to whole albums. Gather albums into series, rank every track, and blend them into playlists that keep every record in the mix — then keep count of the ones on your shelf.» |
| 2 | Página de entrada, rodapé | ajuda / crédito | 43, 3 linhas no computador e 5 no telefone | «Album artwork comes from Apple Music and belongs to the artists and labels; every record shown whole on this page links …» |
| 3 | Inventário · `inv.mean-of-the-besteveralbums-rating` | dica (tooltip) | 26 (8 / 12) | «Mean of the BestEverAlbums rating and of the Spotify popularity of the tracks; in brackets, how many tracks of …» |
| 4 | Inventário · `inv.reading-values-needs-you-signed` | andamento | 13 (3 / 6) | «Reading values needs you signed in with an account, so the reading stopped.» |
| 5 | Séries e álbuns · `ser.we-couldn-t-automatically-match` | mensagem | 24 (15 / 25) | «We couldn't automatically match this album to a record in your series. Please type the exact name/query to rem…» |
| 6 | Playlists · `pl.you-will-leave-this-page` | parágrafo | 34 (25 / 40) | «You will leave this page to sign in to Spotify. Export again when you are back: what was created is not create…» |
| 7 | Página de entrada · `ent.order-each-album-s-tracks` | parágrafo | 31 (25 / 40), 4 linhas no telefone | «Order each album's tracks by how often they are played, by published rankings where the app has them, or by your own ear. The deep cuts get a place in line.» |
| 8 | Ranking e faixas · `rank.tap-a-track-to-move` | ajuda | 16 (8 / 12) | «Tap a track to move it with the buttons below, or drag it by its handle.» |
| 9 | Algoritmos · `alg.builds-balanced-playlists-by-blending` | descrição | 16 (8 / 12) | «Builds balanced playlists by blending the best tracks of each album. Short playlists are merged automatically.» |
| 10 | Playlists · `pl.save-failed-n-nothing-was` | aviso (toast) | 13 (6 / 10) | «Save failed: {}. Nothing was changed: what was saved before is still there.» |

Logo depois desses dez vêm:

- `pl.apple-music-did-not-create` (23 palavras);
- `inv.added-n-of-n-as` (23);
- `nav.a-new-version-of-the` (10, em «carregando»);
- `acct.spotify-is-not-set-up` (13, em aviso passageiro);
- os placeholders `home.an-artist-or-paste-a` (8 palavras) e `ser.enter-artist-name-e-g` (7).

A lista completa está em `raw/deck-vs-ruler.json`.

## 7.4 Os comparadores, medidos

Pedido do orquestrador do V0, a partir das palavras do MJRP (2026-11-21): «a propria organizacao do comparador é uma falha da skill de design que o constroi, ele é bem ruim de UX e UI e com copy verbose, ele nao aplica ao proprio artefato que produz».

**O que foi medido.** O HTML de cada comparador no repositório, não o artefato publicado (não comparei os dois byte a byte). Mesmo script e mesmas larguras: 1280 e 390 px, em 2026-11-21. Medidas brutas: `raw/comparators.json` e as capturas `raw/comparators-*.png`.

Regras desta medida:

- **Só a moldura conta.** O protótipo mostrado dentro do quadro (`iframe`) não entra na contagem; conta só o texto do próprio comparador.
- **O texto é em português.** A régua foi calibrada em inglês; o número de palavras é parecido nas duas línguas.
- **O tipo de tela é «tela de trabalho».** O comparador é uma ferramenta de decisão, então o teto da primeira tela é 100 palavras no computador e 50 no telefone.

| Comparador | Fonte medida | 1ª tela, computador | 1ª tela, telefone | Parte da 1ª tela que é texto (comp. / tel.) | Página inteira |
|---|---|---|---|---|---|
| Home (F79): https://claude.ai/artifact/AsiVV2i3595LqpLEadm61h | `design/proposals/f79-home/comparator.html` (e9f8fca, 2026-11-20 23:34) | **179** palavras (1,8× o teto) | **132** (2,6×) | 12% / 27% | 383 palavras, 2 alturas |
| Página de entrada (F80): https://claude.ai/artifact/5hDJr8qToYkAEsgCrfUK8e | `design/proposals/f80-splash/comparator.html` (d5bc8de, 2026-11-20 20:18) | **359** (3,6×) | **454** (9×) | 23% / 34% | 729 palavras; 7,7 alturas no telefone |
| Inventário: https://claude.ai/artifact/R6r5dLJ48JXJZDSRy6T5Ck | `design/proposals/inventory/comparator.html` (f8ff47c, 2026-11-20 01:20) | **106** (no teto) | **86** (1,7×) | 6% / 14% | 134 palavras, 1 altura |

### Como cada um se organiza, e onde passa da régua

**Home.**

- **Organização:** título e um parágrafo de abertura. Depois vem uma barra de controles: largura (Computador ou Celular), seletor de estado, «Referência» ligada ou desligada e «Marcar decisões do agente». Abaixo, duas colunas (v2 aprovada e v1), cada uma com título, situação, uma nota, o quadro e «abrir sozinha». Depois, uma decisão de cor (prévia A ou B) com a recomendação, um bloco recolhido «Decididos na rodada 1» e uma nota de rodapé.
- **Onde passa:**
  - a abertura tem 73 palavras em uma frase longa (o teto do topo é 40, e o subtítulo deve ser uma frase de até 25);
  - a recomendação da cor tem 53 palavras (o teto do parágrafo é 40);
  - a nota de rodapé tem 41;
  - a nota da v2 tem 34 (o texto de cartão tem teto de 20);
  - o botão «Marcar decisões do agente» tem 4 palavras, no teto.

**Página de entrada.**

- **Organização:** título e uma abertura. Depois, abas de versão com duas linhas cada (uma etiqueta e um rótulo longo) e um botão «As outras direções». Abaixo, a escolha de largura. Antes do quadro, quatro colunas de notas: «O que muda», «Eixo», «Peso» e «Risco». Por fim, uma linha de cabeçalho do quadro, o texto da «Referência» e, mais abaixo, as notas de cada versão.
- **Onde passa:** é o pior dos três.
  - A abertura tem 92 palavras.
  - O rótulo de aba «Caixote · v2 (o fogo e o fio) · Nova · fogo brando» tem 10 palavras (o teto da aba é 2).
  - As notas antes do quadro têm 70, 49 e 63 palavras (o teto do cartão é 20). Elas empurram o protótipo para baixo da primeira tela nas duas larguras.
  - No telefone, a página tem 7,7 alturas de tela antes de terminar a moldura.

**Inventário.**

- **Organização:** título e uma abertura. Depois, a escolha de largura, «Últimas duas» ou «Todas» e o seletor de cenário. Abaixo, colunas (Referência, v5.1 escolhida, v5 recusada), cada uma com uma nota de uma frase e o quadro, e uma linha de ajuda no fim.
- **Onde passa:** é o mais perto da régua.
  - A abertura tem 27 palavras e carrega um endereço local (`http://127.0.0.1:5010/…`), que não serve a quem lê o artefato publicado.
  - A nota da v5 tem 24 palavras (o cartão tem teto de 20).
  - No telefone, passa do teto da primeira tela (86 contra 50).

**O padrão nos três.** O que passa do teto é sempre o mesmo: a abertura em parágrafo longo, a nota de versão escrita como parágrafo e o rótulo de aba que carrega a explicação. Os controles estão dentro da régua (botões de 1 a 4 palavras).

## 8. O que mudaria no harness (proposta, nada foi editado)

### 8.1 Regra nova no cânone

Proposta: uma disciplina nova, **CV · Volume de copy**, em `design-canon.md`, ao lado de CO e CW. A disciplina vale para a tela do app e para o site, por isso fica fora da CW (copy de site). Os IDs são sugestão.

| ID | Regra | Tipo | Teste (sim/não) |
|---|---|---|---|
| CV-01 | Cada texto visível respeita o teto do seu tipo na tabela de volume (título, subtítulo, parágrafo, botão, aba, dica, placeholder, estado vazio, erro, aviso, carregando, cartão). O teto em palavras vale para as duas larguras; no telefone vale também o teto em linhas, medido a 390 px. | produção | Algum texto passa do teto do seu tipo, em palavras ou, no telefone, em linhas? Sim = achado. |
| CV-02 | O topo da página (título + subtítulo) cabe em 40 palavras; o subtítulo é uma frase. | produção | Título + subtítulo do topo têm mais de 40 palavras, ou o subtítulo tem mais de uma frase? Sim = achado. |
| CV-03 | A primeira tela respeita o teto de palavras do seu tipo de tela: entrada, 100 no computador e 70 no telefone; tela de trabalho, 100 e 50. Não contam dado, cookies e conteúdo da pessoa. | produção | A contagem do sensor, na primeira tela, passa do teto da largura? Sim = achado. |
| CV-04 | No telefone, o que não serve à ação da tela vai para um segundo nível: segundo parágrafo, explicação de método, crédito, ajuda de configuração. O que faz agir (erro, chamada, resposta) nunca se esconde. | julgamento | Há, na primeira tela do telefone, texto que não serve à ação e que não está atrás de «More» ou gaveta? |
| CV-05 | Título de display não passa de 3 linhas, nem título de seção de 2, nas duas larguras. Se passa, encurta-se o texto ou o tamanho da letra. | produção | Algum H1 com mais de 3 linhas ou H2 com mais de 2, a 1280 ou a 390 px? Sim = achado. |
| CV-06 | A mesma chamada não aparece duas vezes na mesma primeira tela do telefone. | produção | Há duas chamadas com o mesmo rótulo visíveis juntas a 390 px? Sim = achado. |
| CV-07 | O volume se mede no navegador, por bloco e por tela; a contagem por linha do documento de copy não basta, porque o documento parte os blocos. | produção | O relatório de volume traz a medida do navegador nas duas larguras? Não = achado. |

**Fontes da disciplina.** Os números com fonte vêm de GOV.UK (65, 160, frase de 25), Atlassian (títulos de 3–4 palavras, 1–2 frases, chamada de 1–2 palavras), Apple (aba de uma palavra, título de alerta em até 2 linhas, 5 abas), Microsoft (parágrafo de 3 a 7 linhas, a primeira tela é a mais lida) e NN/g (28% e 20% lidos; o padrão em F; telefone sem diferença de compreensão, mas com brevidade crítica). Os números sem fonte entram como **decisão do agente, revisável pelo MJRP**. As fichas novas a criar em `docs/wiki/sources/` são GOV.UK writing guidelines, Atlassian content, Microsoft scannable content e NN/g How Little Do Users Read e Mobile Content 2016.

**Sensor.** O `measure-copy-volume.cjs` deste relatório pode virar o sensor de CV-01 (em parte), CV-03, CV-05 e CV-06 no harness. Faltam duas coisas:

- uma marca no HTML para separar o dado de catálogo, em vez da heurística por endereço de link;
- a medida em linhas de todos os tipos. Hoje só `p`, `h1` e `h2` são medidos em linhas, por `raw/v0-entry-lines.txt`.

### 8.2 Passo «medir o texto» na `mjrp-critiquing-ux-ui`

Um passo novo, depois da leitura da hierarquia:

> **Medir o texto.** Rode o sensor de volume na tela, a 1280 e a 390 px. Registre:
>
> - as palavras na primeira tela e na página inteira;
> - o título com o subtítulo do topo;
> - as linhas de cada título e de cada parágrafo no telefone;
> - os textos acima do teto do seu tipo.
>
> Cada excesso vira achado CV-0x, com o texto de hoje, a medida e a largura. Sem acesso à tela (conta, dados), use o documento de copy por tipo e diga que a medida por bloco e por tela ficou de fora.

### 8.3 Alvo de tamanho por tipo de linha na `mjrp-copywriting` (`reference/line-types.md`)

Acrescentar a cada tipo de linha a coluna «Alvo / teto (palavras) · telefone (linhas)», com os valores da tabela da seção 6:

- título: 8 / 12 palavras e 65 caracteres · 3 linhas;
- subtítulo: 1 frase, 20 / 25 palavras e 160 caracteres · 4 linhas;
- descrição de serviço (parágrafo): 25 / 40 palavras · 4 linhas;
- chamada: 2 / 4 palavras · 1 linha;
- prova: 1 frase, 15 / 25 palavras · 3 linhas;
- texto alternativo: segue a CW-10.

Cada opção proposta mostra a sua contagem. A que passa do teto não é recomendada.

### 8.4 Coluna de limite na `mjrp-generating-copy-deck`

Acrescentar as colunas **«Teto»** (palavras do tipo, mais as linhas do telefone) e **«Situação»** (dentro / acima do alvo / acima do teto). Nos totais de cada tela, acrescentar o número de textos acima do teto. A página de revisão marca de vermelho a linha acima do teto.

O `apply-ruler-to-deck.py` deste relatório já faz isso sobre o documento do V0. A tabela de mapeamento de tipos está no topo do script.

## 9. O que não foi medido ou não se confirmou

- **Material Design (2 e 3):** as páginas só abrem com JavaScript e não foram lidas. Nenhum limite do Material (aviso, botão, aba, diálogo, ajuda de campo) entra aqui: **não confirmado na fonte**.
- **Shopify Polaris:** as páginas de conteúdo antigas redirecionam para um índice de API, sem orientação de escrita. Os números do Polaris: **não confirmados na fonte**.
- **Microsoft:** as páginas de texto de interface e de mensagem de erro deram 404. Não há número da Microsoft por elemento.
- **«Frase média de 15 a 20 palavras»** (atribuída à GOV.UK ou à plainlanguage.gov): **não confirmado na fonte**. A GOV.UK diz 25, como teto.
- **«Linha de 45 a 75 caracteres»** (Bringhurst, Baymard): **não confirmado na fonte**. Nenhuma das duas foi aberta.
- **NN/g «Mobile Content Is Twice as Difficult» (2011):** o número «duas vezes» **não se confirmou** no texto aberto. O estudo de 2016 diz o contrário quanto à compreensão.
- **NN/g:** as páginas de microcopy e de front-load deram 404.
- **Fluent 2, IBM Carbon, Google developer style guide e Baymard:** não abertos.
- **Discogs no computador:** bloqueado pela verificação anti-robô (Cloudflare). Não foi medido.
- **Telas de trabalho do V0 no navegador:** precisam da conta do MJRP. Não houve login, então o «visível de uma vez» por estado não foi medido; só o documento por tipo. É o que a F84 (sensor no navegador com conta e dados) faria.
- **Tipo de elemento no script:** é heurística por ancestral. «Texto da página» inclui, na Linear, uma tela falsa do produto desenhada em HTML (~90 palavras no telefone). A separação de dado de catálogo usa o endereço do link e pode errar em outros sites.
- **«Parte da tela que é texto»:** inclui o aviso de cookies onde ele aparece (Spotify, Bandcamp, Discogs no telefone).
- **Português:** a régua foi aplicada em inglês. O português não foi medido em linhas, porque ainda não está no site.
- **Números de proposta, revisáveis pelo MJRP:** todos os números marcados como «proposta» na seção 6 são do agente e não vêm de fonte.
