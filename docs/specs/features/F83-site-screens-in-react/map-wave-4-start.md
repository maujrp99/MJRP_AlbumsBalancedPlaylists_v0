# Mapa da tela Start, `/start` (F83, onda 4, TASK-20)

Escrito antes de qualquer código da onda, a partir da leitura dos arquivos em 2026-11-21 (ramo `claude/f83-wave-4-start`, empilhado sobre a onda 3, `1e3c14b`). Lê-se com a proposta (§ 4.3, § 4.6, § 9) e os mapas das ondas 1, 2 e 3. **Estado:** o mapa; o que a onda construiu está em «Onde parou», no fim.

A tela é a antiga Home (F79): um palco para achar álbuns (um artista ou uma lista colada), os resultados do catálogo, e o «dock» com a série em montagem e o «Create series». **A tela não redesenha tudo a cada aviso**: escreve por cima do que já existe (esconde e mostra, troca classe e texto), e só o dock e a grade de capas são refeitos. Isso muda o que «foco igual» quer dizer aqui (ver «O foco»).

## O tamanho do trabalho

| Pedaço de hoje | Linhas | Quem mais o usa | Decisão |
|---|---|---|---|
| `views/HomeView.js` (palco, resultados, o que o controlador manda desenhar) | 319 | — | `screens/start/Start.tsx` e pedaços |
| `components/home/HomeDock.js` (o dock do computador, a folha do celular, o painel de ordem; refaz o dock inteiro e devolve o foco por seletor) | 398 | — | `screens/start/Dock.tsx` (+ a folha sobre `ui/SheetWindow`) |
| `components/home/HomePasteList.js` (a lista colada: linhas, «ready», relatório) | 208 | — | `screens/start/PasteList.tsx` |
| `components/home/HomeEqualizer.js` | 38 | — | `screens/start/Equalizer.tsx` |
| `components/home/StagingAreaController.js` (a série em montagem; sem desenho) | 91 | — | `screens/start/StagingArea.ts` (a lógica não muda) |
| `controllers/HomeController.js` (o estado da tela; chama `view.draw*`) | 409 | **o sensor visual da F84** (`test/visual/visual.config.mjs`) conduz a tela por `window.controller` e três costuras (`picker.service`, `albumSearchService`, `writeSeries`) | `screens/start/StartController.ts`: **mesmos nomes de métodos e de campos**, no lugar de `view.draw*` avisa «mudou»; `window.controller` continua |
| `views/renderers/DiscographyRenderer.js` | 113 | **a janela de editar série** (variante `card`, onda 5) | fica; a variante `stage` (a capa da Start) sai e vira `ResultCard` na tela |
| `components/album-picker/AlbumPickerController.js` e `models/albumPicker.js`, `scanState.js`, `bulkPaste.js`, `albumQuery.js` | 121 + 76 + 119 + 109 + 138 | **a janela de editar série** (o seletor único, F57) | **ficam** (lógica sem desenho, partilhada até a onda 5); a Start os usa como a antiga |
| `models/homeSeries.js`, `models/homePaste.js` (regras puras **com os textos em inglês dentro**) | 131 + 81 | só a Start | as regras ficam; os textos saem para `screens/start/text.ts` pelo dicionário (`models/` não importa `i18n/`, `dictionariesAgree`) |

~1.054 linhas à mão saem (5 arquivos de desenho) mais a variante `stage` do `DiscographyRenderer`; entram `screens/start/`, o dicionário e o `index.ts` da rota. O controlador (409) é reescrito em TS sem mudar de regra.

## O que é carregado, e quando

`/start` é **a primeira tela que a pessoa vê**. As ondas 1 e 2 deixam as telas num arquivo à parte, baixado na hora da rota. Aqui também (`lazyOnlyAtTheRoute`, e para o script principal encolher), mas para não somar uma viagem de rede à primeira tela, o `app.js` **começa a baixar o arquivo da Start na abertura**, ao mesmo tempo que o login, e a rota espera por ele. A Start entra também na lista do segundo plano (quem chega por outro endereço). A medição de «primeira tela» e do tempo vai no relatório da onda.

## As lojas e as fontes que a tela lê

- **`userStore`** (a linha do visitante no palco, no celular, e no dock, no computador): os três `set` chamam `notify()`; `getState()` devolve um objeto novo a cada chamada (forma «com foto»), e o aviso o passa; `currentUser` é trocado por inteiro. Quem lê: `isGuest = !loading && !isSignedIn(currentUser)`. A antiga lia no aviso; a nova lê no desenho com `useStore`.
- **`albumSeriesStore`**: **não é assinada**; só `getDb()` e `getUserId()` são lidos na hora de criar a série (a costura `writeSeries`). Nada a assinar.
- **A série em montagem, o estado do seletor (`scan`, `filters`) e o estado da tela não são lojas**: são do controlador, que os **troca** (nunca muda por dentro): `StagingArea` constrói um conjunto novo a cada mudança (`[...a, b]`, `filter`, `splice` numa cópia), `scanState.js` devolve um objeto novo a cada passo, `toggleFilter` um objeto novo. `getSelectedAlbums()` devolve a lista interna, que é trocada e não mudada. **Mas a tela não guarda nenhuma delas em `useMemo`**: lê do controlador a cada desenho, como as ondas 1 e 2 fizeram, para uma lista mudada por dentro no futuro não ficar velha.
- **Nenhum `set` silencioso** nas lojas desta tela. O que é silencioso aqui é o **controlador**: `setName` (digitar o nome da série) **não redesenha** (de propósito: o campo é da pessoa e redesenhar tiraria o cursor; só redesenha se tirava o «falta o nome»), e só. A tela nova faz o campo do nome controlado pelo estado do controlador e avisa a cada letra **só para o campo** (o React não troca o campo, então o cursor fica); o resto do dock lê a foto do último `redraw()`, como a antiga (ver «O que muda de propósito», item 3).
- **Outras fontes:** a tela estreita (`usePhone`, que o controlador também lê por `isPhone()`), o idioma (`useLocale`), o endereço (a Start não lê o endereço; `?signin` é do `app.js`).

## Como a antiga redesenhava, e o que a nova repete

Isto é o que a conferência de «igual» tem de pegar.

- **O dock é apagado e refeito a cada aviso do controlador** (`redraw()`), e devolve o foco **por seletor** (`#id` ou `data-dock` + `data-id`) a quem o tinha, **se esse ainda existe e não está desabilitado**, com a seleção do texto. Na nova os elementos ficam; o foco fica nos mesmos casos. Onde a antiga perdia o foco (o botão «Create series» vira «Creating…» desabilitado; «Edit order» ↔ «Done» mantém o `id`, então mantinha) a nova solta o foco do botão que se desabilita com ele em foco. O teste de foco compara com a antiga cena a cena (`h.note('foco')`).
- **A grade de capas é apagada e refeita** a cada estado do seletor (cada passo da busca, cada filtro), **mas não** quando uma capa é escolhida: aí só troca classe e texto (`markCards`). Na nova as capas têm `key` pelo id e ficam; uma capa que continua visível continua o mesmo elemento. A diferença visível seria só a imagem recarregar na antiga.
- **O palco, os resultados e o chips são escritos no lugar** (`hidden`, classe, `textContent`): a nova desenha todos os blocos sempre, com `hidden` nos mesmos casos, para o HTML sair igual.
- **A folha do celular** (`openSheet`, variante `full`, `id=homeSeriesSheet`): abre num toque (nunca num efeito); o conteúdo é desenhado **depois** de aberta, então o foco, que o motor dá ao primeiro foco do conteúdo (vazio na hora), **fica na própria folha**, não no campo do nome. A nova repete (a `useSheetWindow` ganha a variante e «não dar foco ao primeiro»). Fecha quando a série esvazia, é criada ou está sendo criada. Quando a folha está aberta, o dock não mostra a faixa de «Undo» (a folha mostra a dela).
- **O campo do artista é do navegador**: a antiga lê o valor na hora do evento. A nova usa campo **não controlado** e `onInput` (não `onChange`): o sensor visual muda `.value` por código e dispara `input`; um campo controlado ignoraria isso.
- **Desfazer some em 8 s** (`UNDO_MS`), por temporizador do controlador, limpo ao sair.
- **Rolagem:** a antiga não rola para o topo em nenhum desenho desta tela (não redesenha `#app`). Nada a reproduzir. Atenção à regra da onda 3 (o React devolve a rolagem quando um desenho tira o foco de quem o tinha): o botão «Create series», quando vira «Creating…», e a folha, que esconde o botão de «Undo», são os candidatos; o navegador confere com a tela rolada.

## Os textos

Cerca de 90 lugares de texto à mão (o palco, os três passos, os chips, as mensagens, o dock, a lista colada e seus avisos, a folha, os `aria-label`). Inglês aberto, português fechado como nas ondas anteriores: `i18n/en/start.js` e `i18n/pt/start.js`. Plurais pelo `tPlural`; o nome do artista e o do álbum vão como texto (o que o catálogo devolve), nunca como HTML. **Um texto que não é da tela:** o aviso «Type an artist name first.» sai do seletor partilhado (`AlbumPickerController`, que a janela de editar série também usa): o seletor ganha uma opção `emptyQueryMessage` (função) e a Start passa a dela; sem a opção ele continua com o inglês de hoje. `badgesOf` (os selos «Deluxe», «Live»… da capa) ganha uma irmã `badgeCodesOf` que devolve códigos; a antiga os devolve como texto para a janela de editar série.

## O que a música toca aqui

O catálogo da tela é o **Apple Music**: `albumSearchService.scanArtist` e `search` falam com o MusicKit (`musicKitService.searchAlbums`), e o resultado é o que a Start mostra, escolhe e grava na série (`albumQueries`). **O Spotify não é tocado por esta tela** (a série guarda consultas de texto; o Spotify entra só na Blend e nas exportações, ondas 2 e 7). Logo: o caminho do Apple Music é o único caminho de catálogo da tela e é exercitado por inteiro pela costura `albumSearchService` (nos testes e no navegador, trocada por um catálogo falso, como o sensor visual da F84 faz). **O que não dá para exercitar sem conta:** o MusicKit de verdade (o token de desenvolvedor vem do servidor, que pede chaves, e a busca real precisa do catálogo da Apple); a prova diz a diferença plainamente.

## Os estados a conferir (a lista da prova de HTML igual)

Os 18 estados do protótipo da F79, a 1280 e a 393, **mais** os que o protótipo não tem: primeira visita; digitando (dica «Press Enter»); buscando (esqueleto, equalizador vivo, botão ocupado); a discografia (chips com contagem, «Add all», capas); filtros ligados e desligados; uma capa escolhida (anel e número), tirada com «Undo»; «Add all» e o «Undo» dele; vários e muitos álbuns (o `+N` do dock); o painel de ordem aberto, ↑ ↓ ✕ (o primeiro sem ↑, o último sem ↓), a linha que acabou de mexer («moved up/down»); o nome sugerido, digitado, apagado («Give the series a name first», «Use «…»»), de um artista, de dois, de três ou mais; criando (botão ocupado e equalizador pequeno); criada (os dois botões, «Start another series»); não deu para gravar, com e sem a conexão caída; o artista não achado e o catálogo que não respondeu (as duas falhas: prazo e erro; «Try again»); a lista colada (várias linhas, linhas boas e ruins, relatório com e sem linhas que sobram, «Add this line», «Add these N lines»); o visitante (linha no palco, no celular; no dock, no computador); o celular: a barra de ação, a folha (nome, linhas, rodapé, «Undo» na folha), virar computador e voltar com a folha aberta.

## O que muda de propósito (revisável)

1. `window.controller` continua exposto (o sensor visual e a prova do navegador o usam); ganha o nome de campo `view.pasteList.value()` por uma pequena fachada, para o roteiro da F84 não quebrar.
2. A lista colada guarda as linhas no controlador (e não só no DOM): quem escreve a lista é o React; o que a pessoa vê e digita não muda.
3. **Não é diferença, é repetição:** o dock é desenhado de uma foto (`model`) tirada em cada `redraw()`, e digitar o nome **não** tira foto (só o campo, que lê o nome vivo). Então o texto «No name yet» e o `aria-label` do botão do celular ficam como estavam até o desenho seguinte, como na antiga. A nova repete: o dock lê `controller.model`, e só o campo do nome lê `controller.state.name`.

## Onde parou (atualizado ao fim da onda)

A onda 4 foi construída inteira (TASK-20 e TASK-21; a reconferência visual, TASK-32, é de quem não construiu). O que saiu diferente do mapa:

- **A tela é desenhada de uma «foto» do controlador, como a antiga:** o dock é refeito (com `key`) a cada `redraw()` e devolve o foco por seletor; a grade de capas é refeita a cada passo do seletor; as capas escolhidas só mudam de classe. O teste «igual ao de antes» compara 30 cenários com páginas, foco e chamadas ao que está fora (os blocos `hidden` só pelos atributos: o que a antiga deixava escrito dentro de um bloco escondido nunca esteve na tela).
- **Uma diferença de propósito (revisável):** com um Undo ainda valendo, fechar a folha do celular mostra de novo a faixa de Undo; a antiga desenhava o dock com a folha aberta, sem a faixa, e não o desenhava de novo ao fechar, então o Undo bom ficava escondido. O navegador afirma os dois lados (0 e 1 faixas).
- **Dois defeitos da antiga mantidos de propósito:** na folha do celular as linhas e o rodapé são refeitos a cada desenho e o foco vai para a página depois de cada botão de linha; o nome da folha não é desenhado de novo enquanto se digita nele (o aviso «falta o nome» fica até se sair do campo). A contagem de capas da frase «Your series still has its N albums» é a do momento da busca, como na antiga.
- **Lições aplicadas:** o StrictMode roda duas vezes o efeito que devolve o foco: ele só devolve se o foco está na página (sem isso roubava o foco do campo do nome que o gesto acabava de dar); os textos em pedaços (a dica, a linha do visitante) são um nó de texto só, como na antiga (separados, o Chromium compõe o texto com 136 pixels de diferença).
- **O arquivo da tela baixa na abertura** (junto do login): o tempo até o palco apareceu foi o mesmo da antiga num servidor de desenvolvimento (três cargas cada, 426 a 470 ms contra 445 a 464 ms); o script principal encolheu 9.043 B (285.730 contra 294.773 B) e o arquivo da Start é de 12.176 B.
- **O que não se pôde exercitar:** o MusicKit de verdade (o token de desenvolvedor vem do servidor e a busca precisa do catálogo da Apple): a prova troca o catálogo pela costura do sensor visual. O Spotify não é tocado por esta tela. A janela de entrar (aberta pelo visitante) é chamada, não percorrida: é da moldura.
