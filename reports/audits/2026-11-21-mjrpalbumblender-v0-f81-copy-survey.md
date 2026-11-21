---
type: content-audit
---
# Album Blender · levantamento de todos os textos do site, para a F81 (idiomas)

Escrito em 2026-11-21 pelo agente do V0 (sessão da F81), a pedido do orquestrador. Isto é o levantamento e o rascunho dos documentos da feature: **nenhum código de produto foi mexido e o site não foi traduzido.** O mapa está em [`design/copy/album-blender-copy.md`](../../design/copy/album-blender-copy.md). A coluna PT é **proposta do agente (feita por subagentes Sonnet), nunca final; nenhum texto foi aprovado pelo MJRP.**

## A resposta curta

O site tem **1106 textos distintos, em 1437 pontos do código** (191 textos aparecem em mais de um lugar). Para ~270 deles (os marcados «MJRP decide») ele precisa decidir, porque envolvem palavras do produto («Blend», «Series», «Batch», «Inventory»…). O trabalho grande da F81 não é traduzir: é (1) tirar 1437 pontos do código, (2) resolver ~18 conceitos que hoje têm mais de um rótulo antes de traduzir, senão se traduz duas vezes, e (3) os casos difíceis abaixo, sobretudo os 234 textos montados de pedaços e os 23 pontos que mostram a mensagem crua de um erro.

## Como foi contado (reproduzível)

`NODE_PATH=<node_modules com acorn> node scripts/i18n/scan-copy.cjs --out scan.json` lê a árvore sintática (acorn) de 318 arquivos (`.js` e `.html` de `public/` e `server/`), e acha:

- **certo** (a sintaxe prova que chega a uma pessoa): texto passado a `SafeDOM.button/span/p/h1…`, `toast.*`, `alert/confirm/prompt`, `.textContent =`, `aria-label`, `title`, `placeholder`, `alt`, `<title>`, `<meta description/og:*>`, texto entre tags dentro de `innerHTML` e de HTML escrito em JS, chaves `label/title/message/description/…` de objetos, `new Error(...)`, corpo de resposta do servidor;
- **provável** (parece frase ou rótulo, mas a busca não prova o uso): 391 dos 1106 textos. Quase todos são rótulos reais (condicionais `x ? 'A' : 'B'`, `return 'Loading…'`); o resto é ruído que o filtro não pegou. **Revisar essa metade é a primeira tarefa do MJRP ou da TASK-01.**

`scripts/i18n/build-deck.py` agrupa por texto igual (IA-02: um conceito, uma linha), dá o identificador (`tela.palavras-do-texto`), a tela, o tipo, e escreve o mapa. Os 87 candidatos que o script descartou estão em [`design/copy/album-blender-excluded.md`](../../design/copy/album-blender-excluded.md) com o motivo. As propostas em PT estão em `design/copy/album-blender-pt.json` (a única parte que não é gerada por script).

> A skill `mjrp-generating-copy-deck` prova a lista abrindo a página num navegador. Isto aqui é um app com o texto dentro do código, não uma página com cópia de marketing: a prova por navegador não cobre os estados (erro, vazio, modais) e a prova por sintaxe é a que serve. O que a skill promete (documento `# Documento de copy:` com uma tabela por seção e «Fora deste mapa», o limite «a revisão não tira nem põe item») foi seguido; a página de revisão em Artifact não foi montada (ver «Decisão D-12»).

## Quantos textos

| Tela | Textos |
|---|---:|
| Inventário | 238 |
| Playlists | 205 |
| Séries e álbuns | 144 |
| Blend | 79 |
| Home (montar a série) | 80 |
| Página de entrada (`splash.html`, `splash/`) | 67 |
| Ranking e faixas | 62 |
| Menu, rodapé e aplicação | 58 |
| Algoritmos e receitas do Blend (nomes de receita e de playlist gerada) | 44 |
| Componentes comuns (modais, filtros, paginação, avisos) | 42 |
| Outros (erros dos serviços, tipos de álbum, nomes padrão) | 42 |
| Conta e conexões (login, Spotify, Apple Music) | 27 |
| Em breve | 12 |
| Servidor (respostas de depuração) | 5 |
| `index.html` | 1 |
| **Total** | **1106** |

| Tipo | Textos |
|---|---:|
| Texto (frase, nota, linha) | 574 |
| Rótulo ou opção | 94 |
| Aviso (toast) | 65 |
| Leitor de tela (`aria-label`) | 56 |
| Dica (tooltip) ou título | 54 |
| Carregando / andamento | 52 |
| Erro ou aviso de falha | 39 |
| Estado vazio | 35 |
| Descrição | 32 |
| Botão | 28 |
| Erro que pode chegar à tela | 24 |
| Campo (placeholder) | 13 |
| Mensagem | 13 |
| Confirmação do navegador (`confirm`/`alert`) | 11 |
| Título | 8 |
| Mensagem do servidor | 5 |
| Texto alternativo | 3 |

O tipo é deduzido do código (a coluna «Tipo»); 574 «Texto» são os que a busca não soube classificar melhor. O mapa traz também a marca de cada linha: `traduzir` 801+, `traduzir + montado` 186, `fica` 39, `técnico` 19, `MJRP decide` (as 18 dos subagentes + as ~268 pela lista de vocabulário do script).

## Os casos difíceis

1. **Texto montado de pedaços: 234 textos com `{}`.** «Added 13 albums. Undo» é `Added ${n} album${n === 1 ? '' : 's'}.`: o plural é uma letra colada, e em português «álbum → álbuns» não é só um `s`. Há `{} album{}`, `({} playlist{})`, `Top {}{}`, frases partidas em volta de um link (`GUEST_BEFORE` + botão + `GUEST_AFTER` na Home; «Sign in» no meio de uma frase) e concordância de gênero que depende do que entra em `{}` («salva/salvo», «exportada(s)»). Traduzir pedaço a pedaço dá português errado; o dicionário precisa de mensagens inteiras com variáveis nomeadas e regra de plural. **Isto define o contrato do dicionário (F83).**
2. **Mensagem crua de erro na tela: 23 pontos** repassam `error.message` ao toast ou ao modal (`'Failed to add: ' + error.message`, `Login failed: ${error.message}`, `The export to Apple Music failed: ${error.message}`, `toast.error(err.message)`). A parte depois dos dois-pontos é inglês de bibliotecas ou de terceiros e não existe no mapa. Cada caso precisa de um texto próprio (REQ-08).
3. **O servidor quase não manda texto.** As rotas de produção respondem `{ error: { code, retryable } }` (8 códigos, `server/lib/outcome.js`: nenhum texto de provedor ou do servidor sai no corpo, de propósito). Só as rotas de depuração (`server/routes/debug.js`, `musickit.js`) mandam `error: '…'` em inglês: 5 textos no mapa. Os textos de falha, portanto, são do cliente; a F81 mapeia **código → texto** no cliente. Os 39 outros textos do servidor (logs `[Enrichment]`, configuração, prompts de IA) foram descartados, com motivo em `album-blender-excluded.md`.
4. **Prompts de IA do servidor** (`server/lib/aiClient.js`, `server/routes/handlers/ai.js`, `config/prompts.json`) têm instruções fixas em português e em inglês. Não são interface. Mas se o idioma da pessoa mudar, o idioma do que a IA devolve (gêneros, descrições) também poderia mudar: pergunta D-10.
5. **Nomes gerados e gravados:** o Blend nomeia playlists («Greatest Hits Vol. 1», «Deep Cuts Vol. 3», «Greatest Hit #1», nomes de lote, `Untitled batch`, «Created by MJRP Album Blender» no Spotify). O texto é gravado no Firestore e exportado ao Spotify e ao Apple Music **no idioma do momento**; mudar o idioma depois não os muda. Isto não é cópia de interface: é conteúdo da pessoa (D-10).
6. **Datas, horas e moeda: 11 pontos** com `toLocale*` e localidade fixa (`en-GB`, `en-US`, uma moeda `R$` em `pt-BR`) ou a do navegador. O formato de data da tela e o de «Last updated: …» precisam seguir o idioma escolhido, não o do navegador. A moeda do Inventário (USD, EUR, GBP, BRL) é de dado, não de idioma.
7. **Texto dentro de lógica:** `const NEXT = '…'`, mapas de rótulos (`TYPE_LABELS`), `return 'Top {}{}'` em algoritmos, mensagens escolhidas por `?:` em 118 pontos. Não há tabela de textos: o texto manda no fluxo.
8. **A página de entrada lida sem script:** `public/splash.html` tem 58 textos escritos no HTML (inclui `<title>`, `description` e os `og:*`, `lang="en"`), e `public/splash/*.js` mais 18 (rótulos de faixa, «Pause motion»/«Play motion», `aria-label` de capas, «fictional album»). O texto estático precisa estar no idioma já no HTML servido, para o buscador e para quem desliga o script; os 18 do script vêm do dicionário. O `lang` de `index.html` e de `splash.html` é fixo em `en`. Há ainda `public/assets/manifest.webmanifest` (`name`, `description`) que a busca não vê.
9. **Dois estilos de escrita misturados:** 104 rótulos em Title Case («Series Name», «Edit Playlist Batch») contra frase normal («Series name», «Edit series»); 27 textos com `...` e 28 com `…`. Hoje não importa; no PT a regra de caixa é outra (só a primeira maiúscula), então se decide uma vez (D-11).

## O que nunca se traduz

- **Nomes de álbuns, artistas e faixas** (vêm do Apple Music, Spotify, Discogs, BestEverAlbums). Incluem «Unknown Album/Artist/Track», que são texto nosso e se traduzem.
- **Marcas:** The Album Blender, MJRP, Spotify, Apple Music, Discogs, BestEverAlbums («BEA»), Firebase, MusicKit.
- **Os álbuns fictícios da página de entrada** (`public/splash/covers.js`): dado de demonstração, fora do mapa (e o texto «fictional album» em volta está no mapa).
- Siglas técnicas das receitas: «BEA», «SPFY», «UGR» (o agente não sabe o que significa «UGR»: o MJRP diz).
- Nomes de condição do Discogs («Mint», «Near Mint», «Very Good Plus»): proposta é manter (jargão de quem coleciona disco), mas é decisão do MJRP.

## Conceitos com mais de um rótulo (IA-02)

Hoje o mesmo conceito aparece com rótulos diferentes. Cada linha vira uma decisão de rótulo único antes de traduzir:

| Conceito | Rótulos de hoje (EN) | Proposta (opinião do agente) |
|---|---|---|
| Entrar | «Sign in», «Sign In», «Sign In to Sync», «Sign-in cancelled», «Login failed», «Login provider not enabled» | «Sign in» em todo lugar; «Login» sai |
| Sair | «Sign Out», «Sign out failed», «{} Sign Out» | «Sign out» |
| Série | «Series», «Music Series», «Albums Series», «All Albums Series», «Series by artist/genre/track» | «Series»; o prefixo vira nome da tela, não do conceito |
| Lote | «Batch», «Playlist Batch», «New Batch», «Untitled batch», «Edit Batch», «Your Playlists Series» | «Batch» (e a tela «Saved Playlists» não se chama «Series») |
| Coleção do usuário | «Inventory», «Collection», «My Collection», «Library» («No albums in library»), «shelf» (página de entrada) | um rótulo só (D-06) |
| Excluir | «Delete» (playlist, lote), «Remove» (álbum da série, do inventário, faixa), `Playlist "{}" removed` e `Deleted playlists for {}` para o mesmo ato, «Clear» (cache) | «Delete» destrói, «Remove» tira de um grupo: regra única |
| Cache | «Clear Cache», «Clear cache», «Clear album cache», «Cache Cleared!», «Cache cleared» | «Clear cache» / «Cache cleared» |
| Sem nome | «Unknown», «Unknown Title/Album/Artist/Track», «Untitled», «Untitled series/Series», «Untitled Playlist», «No name yet» | «Untitled» para o que a pessoa nomeia; «Unknown» para o que vem do catálogo |
| Editar | «Edit», «Change», «Rename», «Edit order», «Edit Playlists», «Edit Series/series» | «Edit», e «Rename» só para o nome |
| Tentar de novo | «Try again», «Look again», «Reload», «Read … again» | «Try again» |
| Carregando | «Loading…», «Loading...», «Reading…», «Saving…», «Adding…» | verbo real do que acontece, e `…` único |
| Nome do produto | «The Album Blender», «Album Blender», «MJRP Album Blender», «MJRP's The Album Blender», «Generated by Album Blender» | «The Album Blender» na tela; as frases gravadas no Spotify e no Apple Music são decisão à parte |
| Blend | «Blend», «Blender», «Blending Menu», «Blend your Albums», «Blend your Music by», «Music Playlist Blend», «Blend it now» | «Blend» (nome da tela e da ação) |
| Home | «Home» (rodapé, link «Go to Home», «the home page»), «Start» (F85) | «Start»/«Inicie» em todos os textos que citam essa tela |
| Dono do álbum | «Owned», «Not Owned», «In my collection», «Marked as Not Owned» | um par só |
| Caixa e reticência | Title Case × frase normal; `...` × `…` | frase normal e `…` |

## As dez decisões de vocabulário que mais pesam

(Cada uma está como pergunta única, com opções, na seção seguinte.)

1. «Blend»: a palavra do produto, em nome de tela, verbo e substantivo (45 textos).
2. «Series»: 129 textos; é a palavra da tela principal.
3. «Compendiums»: tipo de álbum (coletâneas e seleções).
4. «Deep Cuts» e «Greatest Hits»: nomes de playlist que o Blend gera.
5. «Batch»: o grupo de playlists que uma série gera (29 textos).
6. «Inventory»/«Collection»/«Owned»: três rótulos para a lista de discos da pessoa.
7. O que sobra de «Home» depois do «Start»/«Inicie» da F85.
8. A metáfora de cozinha: «Recipe», «Ingredients», «Round Robin», «Cascade».
9. «Rank» e «Popularity»: verbo, substantivo, e a sigla «BEA».
10. O idioma do que é gravado: nomes de playlist gerados, o que o Blend escreve no Spotify e no Apple Music, e o que a IA devolve.

## O que a busca não vê

- **Texto que mora em dado**: o que vem dos catálogos e de Firestore (nomes de séries e lotes que a pessoa escreveu), e as strings de `config/prompts.json`.
- **Texto montado por função externa ou concatenado a partir de variáveis** (`labelFor(kind)` que devolve uma string de uma tabela em outro arquivo): a busca vê o literal onde ele está, não onde é usado; por isso a coluna «Onde aparece» do mapa é o arquivo, não a tela, e 391 linhas são «provável».
- **Texto fora do JS e do HTML**: `public/assets/manifest.webmanifest`, `content:` de CSS (não achei nenhum), texto dentro de imagens (`TheAlbumBlender.png`, `splash/wordmark.jpg`), SVG com `<text>` (as `Icons.js` não têm).
- **Texto que não é nosso e aparece**: a janela de login do Google e da Apple, os avisos do MusicKit e do Spotify, os formulários nativos (data, arquivo), mensagens de erro de bibliotecas.
- **Estados** que só existem com dados reais (um erro do Discogs, uma conta sem permissão): a busca os acha no código, mas ninguém abriu a tela. A prova por navegador (as 39 conferências da skill) não foi usada.
- **Datas e números**: o formato (`toLocaleString`) não é texto no código; os 13 pontos foram achados por busca textual à parte, não pelo script.
- **Texto de outras superfícies:** o app (`app/`, F78, em pausa) e `spikes/` não entram.
- Arquivo `.html` com `<script>` de outro tipo (JSON-LD) é ignorado de propósito.

## Decisões do MJRP

Para cada uma: a pergunta, as opções e a recomendação do agente (**opinião**, não decisão).

**D-01. A palavra «Blend» (o produto, a tela, a ação) em português:**
a) fica «Blend» como substantivo e se diz «fazer o Blend» · b) vira «Mistura» («Misturar») · c) fica «Blend» em tudo, inclusive como verbo («Blendar»).
Recomendação (opinião): **a**. É o nome da marca em «The Album Blender» e já é palavra usada em português; «mistura» perde a ideia de equilíbrio e «blendar» soa mal.

**D-02. «Series» em português:**
a) «Série(s)» · b) «Coleção(ões)» · c) fica «Series».
Recomendação (opinião): **a**. É o mesmo sentido de «série» de discos e o MJRP já usou «Inicie»; «Coleção» está em disputa com o inventário (D-06).

**D-03. «Compendiums» (tipo de álbum, ao lado de «Studio», «Live», «Singles»):**
a) «Coletâneas» · b) «Compilações» · c) fica «Compendiums».
Recomendação (opinião): **a**; «Compilation» já existe como tipo no mesmo código e se diria igual: confirmar se «Compendiums» e «Compilation» são o mesmo.

**D-04. «Greatest Hits» e «Deep Cuts» (nomes de playlist geradas):**
a) traduzir os dois («Maiores sucessos», «Faixas profundas») · b) ficam em inglês, são termos de quem coleciona disco · c) «Maiores sucessos» traduz e «Deep Cuts» fica.
Recomendação (opinião): **c**. «Faixas profundas» não é uma expressão que alguém use; «Deep Cuts» é termo de nicho. Vale também para o que já está gravado (D-10).

**D-05. «Batch» (o grupo de playlists que uma série gera):**
a) «Lote» · b) «Grupo» · c) «Conjunto».
Recomendação (opinião): **a**, e que a tela «Saved Playlists» pare de chamar o lote de «series» (IA-02).

**D-06. Os três rótulos da lista de discos da pessoa («Inventory», «Collection», «Library», «shelf»; «Owned»/«Not Owned»):**
a) um só, «Inventário», e «Tenho/Não tenho» · b) um só, «Coleção», e «Tenho/Não tenho» · c) manter dois nomes com sentidos diferentes (inventário = o que tenho; coleção = o que quero reunir).
Recomendação (opinião): **b** («Coleção»): quem coleciona disco não diz «inventário». Mas o nome da tela e a rota hoje são `Inventory`: se mudar, muda também o endereço.

**D-07. «Home»: o que fazer com os textos que ainda citam «Home» depois da F85 («Go to Home», «create one on Home», «the home page»)?**
a) todos viram «Start» / «Inicie» · b) só o que aponta para a tela de montar série vira «Start»; «home» fica para a página de entrada · c) deixar para depois.
Recomendação (opinião): **b**, para não chamar duas telas de «Start».

**D-08. A metáfora de cozinha («Recipe», «Ingredients», «Round Robin», «Cascade»):**
a) traduzir («Receita», «Ingredientes», «Rodízio», «Cascata») · b) fica em inglês só o nome técnico («Round Robin», «Cascade») · c) tudo fica.
Recomendação (opinião): **b**. «Receita» e «Ingredientes» funcionam; «Round Robin» e «Cascade» são nomes de algoritmo e dizem pouco traduzidos.

**D-09. «Rank», «Ranking», «Popularity» e a sigla «BEA»:**
a) «Ranking» (substantivo e verbo «classificar»), «Popularidade», e «BEA» fica · b) tudo fica em inglês · c) «Ranking» fica, mas o verbo é «ranquear».
Recomendação (opinião): **a**. «Ranquear» é gíria de equipe; «classificar» é o verbo de quem organiza faixas.

**D-10. O idioma do que o site grava e manda para fora (nomes de playlist, «Created by MJRP Album Blender» no Spotify, e o que a IA devolve):**
a) no idioma da pessoa no momento em que é criado, e o que já está gravado fica como está · b) sempre em inglês, como hoje · c) no idioma do momento e uma ação «Renomear para o meu idioma» · d) a IA sempre responde em inglês e só a interface muda.
Recomendação (opinião): **a**, com o aviso de que playlists antigas ficam em inglês; **b** é a opção barata e segura se a F81 precisa sair logo.

**D-11. Escrita dos rótulos (Title Case × frase normal; `...` × `…`):**
a) frase normal, `…`, nos dois idiomas, e o mapa final já sai assim · b) cada idioma com a sua regra (EN Title Case, PT frase normal) · c) deixar como está.
Recomendação (opinião): **a**: é a regra que o MJRPpersonal usa e a que menos retrabalho dá.

**D-12. Como revisar o mapa (1106 linhas):**
a) página de revisão em Artifact (a skill) com «final» por linha e envio do documento, e a F81 segue depois · b) só o documento `design/copy/album-blender-copy.md` revisado no editor, por tela, em lotes (as 268 marcadas «MJRP decide» primeiro) · c) o MJRP responde D-01 a D-11 e o agente aplica as respostas no mapa sem revisão linha a linha.
Recomendação (opinião): **c**, depois **b** só nas telas que ele usa mais: as palavras decididas resolvem ~80% das linhas, e a revisão linha a linha de 1106 linhas é cara.

**D-13. A página de entrada (F80) entra na F81?**
a) entra (é o primeiro texto que um visitante lê, e o país decide o idioma ali) · b) fica para depois.
Recomendação (opinião): **a**. O app (F78) fica fora.

## Itens para a sessão mestra

- `design/copy/` não existia; foi criada com o mapa, as propostas e a lista de descartados.
- `scripts/i18n/` é novo; o script precisa de `acorn` (hoje só existe no `node_modules` da pasta da `main`, vem de dependência transitiva do ESLint): `NODE_PATH=/Users/maujrp/mjrp/projects/MJRP_AlbumsBalancedPlaylists_v0/node_modules node scripts/i18n/scan-copy.cjs --out <arquivo>`. Se a F83 trouxer o sensor «sem texto solto no código» (TASK-08), o script é a base.
- Não foi aberta página de revisão em Artifact, nem rodada a suíte; nenhum arquivo de produto foi tocado.

## Acerto com o deck do MJRPpersonal e a revisão do volume de texto (pedido do orquestrador, 2026-11-21 10:20)

**A forma.** O mapa passou a ter a mesma forma de `design/copy/2026-11-07-copy-deck-pagina-principal.md`: cabeçalho com fonte e contagens, uma tabela por tela, colunas `ID | Onde aparece | Tipo | Português | Status PT | English | Status EN` (nessa ordem, para a mesma ferramenta ler os dois decks), mais as colunas `Car. PT | Pal. PT | Car. EN | Pal. EN | Nota`. «Onde aparece» diz tela, tipo e estado em palavras e traz o arquivo e a linha ao fim.

**Onde diverge, e por quê.**
- O inglês é o texto **em produção hoje**: «em produção, a revisar»; o português é «tradução do agente, a revisar». Nenhuma linha é «final»: essa marca é do MJRP, na página de revisão.
- O deck é **gerado do código** por script, não escrito a mão como a cópia do protótipo de lá; por isso há o registro de ids (abaixo) e a lista de descartados.
- Não há «marca como placeholder»: as marcas (The Album Blender, Spotify, Apple Music…) são linhas normais com a nota `fica`. O nome do produto aparece em 5 formas (IA-02); a decisão de uma só vem antes de virar placeholder.
- Não montei a página de revisão (pedido: ainda não).

**Ids estáveis, pensados para virar chaves do CMS.** Formato `tela.palavras-do-texto` (`home.series-name`, `blend.blend-it-now`). `design/copy/album-blender-ids.json` registra texto → id e o `build-deck.py --ids` **nunca muda um id já registrado**, mesmo que a tela ou o texto mude; texto novo ganha id novo. Fragilidade a decidir antes do CMS: o id nasce da primeira versão do texto em inglês, então algumas chaves são feias (`pl.n-exported-to-apple-musicnn`, `home.n-is-saved`): vale renomear os 234 textos montados à mão (chave semântica, ex. `home.series-saved`) **uma vez**, antes de a F83 definir o contrato.

**O volume do texto (só medida, sem juízo, sem reescrever).**

| Tela | Textos | Caracteres EN | Palavras EN | Caracteres PT | Palavras PT |
|---|---:|---:|---:|---:|---:|
| Inventário | 238 | 7326 | 1384 | 8023 | 1453 |
| Playlists | 205 | 5434 | 958 | 5937 | 1042 |
| Séries e álbuns | 144 | 3706 | 679 | 4168 | 725 |
| Página de entrada | 67 | 2857 | 549 | 2921 | 550 |
| Home (montar a série) | 80 | 2262 | 461 | 2466 | 467 |
| Blend | 79 | 1387 | 251 | 1602 | 281 |
| Ranking e faixas | 62 | 1316 | 217 | 1521 | 243 |
| Menu, rodapé, aplicação | 58 | 1143 | 208 | 1255 | 218 |
| Algoritmos e receitas | 44 | 1088 | 194 | 1189 | 205 |
| Outros | 42 | 933 | 165 | 1062 | 183 |
| Componentes comuns | 42 | 846 | 146 | 982 | 156 |
| Conta e conexões | 27 | 818 | 140 | 898 | 150 |
| Em breve | 12 | 288 | 48 | 293 | 48 |
| Servidor | 5 | 150 | 25 | 150 | 25 |
| `index.html` | 1 | 10 | 1 | 13 | 1 |
| **Total** | **1106** | **29 564** | **5 426** | | |

Cada linha do mapa tem seus caracteres e palavras (inglês e português), e o total de cada tela está abaixo do título dela. **Não medi o que cabe sem rolar a 1280 e a 393 px**: isso exige o navegador com conta e dados reais, e o sensor da F84 ainda não existe. As telas somam o texto do código, não o que aparece de uma vez (um mesmo estado mostra 5 a 40 textos). A régua da revisão vem depois, do harness. O português passa de 8 a 14% mais longo que o inglês, o que pesa para o celular.

**Testes que comparam texto de interface** (`scripts/i18n/tests-with-literal-text.py`): **178 dos 289 arquivos de teste** (`test/`) trazem entre aspas pelo menos um texto do deck (≥ 8 caracteres, sem `{}`), 351 textos distintos. Por pasta: `services` 37, `components` 32, `models` 23, `controllers` 15, `views` 13, `architecture` 12, `server` 9 (o resto tem poucos); os maiores são `test/views/InventoryView.values.test.js` (43 textos), `test/components/playlists/PhonePlaylists.test.js` (22), `test/views/InventoryView.ratings.test.js` (21), `test/views/InventoryView.lowestForSale.test.js` (18), `test/splash/entryPage.test.js` (15). Conta a mais (um texto de fixture que coincide com o da tela) e a menos (texto montado, regex), então é ordem de grandeza. Esses testes vão quebrar quando o texto sair do código; o conserto é lerem o dicionário pelo id em vez de comparar o texto (a TASK-04 da F81 deve dizer isso; fica no plano como risco).

**O que levaria montar a página de revisão do V0 a partir deste deck** (não feito): (1) um `copy.json` no formato que o `build_copy_review.py` do MJRPpersonal lê, gerado do `rows.json` e do `pt.json` (id, seção, onde aparece, tipo, pt, en, status), um passo curto no `build-deck.py`; (2) as 1106 linhas em seções por tela, filtro por «MJRP decide» e por «provável»; (3) a marca «final» só no campo do MJRP, por linha, e a coluna de tamanho visível (a régua de volume); (4) o Artifact publicado com banco para o rascunho; (5) a coleta do documento enviado de volta para `design/copy/`, com regra de conflito (um só escritor por vez: ou o deck gerado, ou a revisão, nunca os dois). É trabalho de meio dia para o formato e um dia com os testes do artefato; o que mais custa é decidir o que a revisão pode mudar (só texto, nunca o id).
