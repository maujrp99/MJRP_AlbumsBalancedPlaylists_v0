# Mapa da tela Blend, `/blend` (F83, onda 7, TASK-26), com o painel de gerar de novo que vai junto

Escrito antes de qualquer código da onda, a partir da leitura dos arquivos em 2026-11-22 (ramo `claude/f83-wave-7-blend-map`, sobre a ponta da onda 6b, `claude/f83-wave-6b-inventory-windows`, `6622654`). Lê-se com a proposta (§ 4.3, § 4.4, § 9), `wave-lessons.md` (inteiro) e o mapa da onda 2 (`map-wave-2-playlists.md`, a linha do `RegeneratePanel`). **Estado:** só o mapa; nenhuma linha de produto. **A `main` não mexeu na Blend** desde a terceira junta (`b8947e0`): a única mudança de lá em `public/` é o conserto do «Search» da Start no WebKit (UAT-282, `42afedc`), que a Start em React já tem (lição 14).

`/blend` é **uma tela só**, registrada direto no `app.js` (`router.register('/blend', () => new BlendingMenuView())`, importada **estaticamente**: hoje toda a Blend está no script principal). A view guarda o próprio estado (não há controlador por visita); quem gera é o singleton `controllers/BlendingController.js`, que a tela de playlists (já em React) também usa para gerar de novo.

## O tamanho do trabalho

Alcançado a partir de `BlendingMenuView`, mais o painel «Reconfigure your Music Playlist Blend» da tela de playlists, fora lojas, serviços, modelos e algoritmos: **7 arquivos da lista à mão, 1.815 linhas no disco**, mais o invólucro `react-bridge/legacy/RegeneratePanel.tsx` (66). O controlador (169) fica em JavaScript.

| Pedaço de hoje | Linhas | Quem mais o usa | Decisão |
|---|---|---|---|
| `views/BlendingMenuView.js` (o título, os quatro passos, as quatro seções com cadeado, o botão de gerar, o resumo, o progresso e o erro em `#blend-results`, a barra do celular, os ouvintes, a geração e a ida às playlists) | 477 | — | some: `screens/blend/` (7b) |
| `components/blend/BlendSeriesSelector.js` (passo 1 no computador: «Blend your Music by», a lista de séries que rola, os cartões, as capas pré-carregadas; no celular, o mesmo select e a linha) | 340 | `test/security/outsideTextIsText` | `screens/blend/SeriesStep.tsx`, `SeriesCard.tsx`; a leitura das capas vai para `screens/blend/seriesCovers.ts` sobre um modelo puro (7b) |
| `components/blend/BlendSeriesPhonePicker.js` (a linha do celular e a folha cheia com busca) | 141 | — | `screens/blend/phone/SeriesRow.tsx`, `SeriesSheet.tsx` sobre `ui/SheetWindow` (7b) |
| `components/blend/BlendRecipeCard.js` (os cartões de receita, ícone e cor por receita, o selo) | 174 | **o painel de gerar de novo** (tela de playlists) | `ui/recipe/RecipeCards.tsx` (7a); a tabela de ícones e cores vai para `models/recipeLooks.js` |
| `components/blend/BlendIngredientsPanel.js` (Top #, agrupamento, estrutura, duração, fonte do ranking; a configuração normalizada) | 428 | **o painel de gerar de novo** | `ui/recipe/Ingredients.tsx` (7a); a regra de que opção aparece em que receita e `getConfig` vão para `models/recipeIngredients.js` |
| `components/common/AlbumCascade.js` (a cascata de capas, escrita como texto) | 72 | só a Blend (o React já usa `ui/AlbumCascade.tsx`, mantida igual por teste desde a onda 1) | sai (7b); o teste que as compara passa a comparar com um retrato capturado antes |
| `components/playlists/RegeneratePanel.js` (o painel de gerar de novo: cabeçalho que dobra, receitas, ingredientes, «Regenerate Playlists», a memória `pending`) | 183 | só a tela de playlists, pelo invólucro | `screens/playlists/RegeneratePanel.tsx` sobre `ui/recipe/` (7a) |
| `react-bridge/legacy/RegeneratePanel.tsx` (o invólucro) | 66 | `screens/playlists/Playlists.tsx`, `screens/playlists/index.ts` | sai (7a) |
| `controllers/BlendingController.js` | 169 | `PlaylistsController` (gerar de novo) | **fica em JavaScript**, sem mudar; a tela chama `generateFromSeries` como hoje |

**Um achado que muda o corte:** o mapa da onda 2 e a lista `BRIDGE_USES` dizem que o `RegeneratePanel` «é também do controlador da Blend». Não é: `BlendingController.js` não o importa. O que o painel partilha com a Blend são **as duas peças de dentro**, `BlendRecipeCard` e `BlendIngredientsPanel`. É isso que o prende à onda 7, e é isso que permite dividir a onda (abaixo).

Saem da lista `handMadeScreensBaseline`: 1 arquivo na 7a (`RegeneratePanel.js`, 182 na lista) e 6 na 7b (1.631 na lista: a view 477, o seletor 340, a folha 141, os cartões 174, os ingredientes 428, a cascata 71). A lista vai de 24 para 17 arquivos. `complexityAllowlist` perde 4 linhas na 7b (`BlendRecipeCard.js:renderRecipeCard`, `BlendSeriesSelector.js:preloadSeriesThumbnails`, `BlendingMenuView.js:render`, `renderGenerateButton`).

Motores que a Blend usa e que ficam (são da onda 8): `components/ui/Sheet.js` (pela `ui/SheetWindow`), `components/Toast.js`, `components/ui/coverImage.js` (pela `ui/CoverImage`). A Blend **não abre janela** (nenhum `BaseModal`, nenhuma pergunta da `DialogService`).

## O que é carregado, e quando

Hoje a Blend inteira está no script principal, e com ela `BlendingController`, `PlaylistGenerationService`, os algoritmos (`algorithms/`, quatro receitas registradas) e as estratégias de ranking que só eles alcançam. Na nova, a rota entra no padrão das outras: `loadScreen(() => import('./screens/blend/index.ts'))` e a lista do segundo plano (`prefetchScreensAfterTheFirstScreen`). O `BlendingController` passa a ser partilhado por dois arquivos sob demanda (a Blend e as playlists): o empacotador faz dele um arquivo comum. **Não há armadilha de assinatura** como a do inventário: nada da Blend assina uma loja ao ser carregado (conferido: `BlendingController`, `PlaylistGenerationService` e `algorithms/index.js` só exportam).

## As lojas e as fontes que a tela lê (a auditoria)

| Loja ou fonte | O que muda por dentro, o que é silencioso |
|---|---|
| `albumSeriesStore` | a tela **não assina**: o seletor lê `getDb()` e `getUserId()`, pede `getSeriesService(db, null, userId).loadFromFirestore()` **a cada visita** (rede) e então tira **uma foto** de `getSeries()`. Uma série criada noutro lugar durante a visita não aparece (ver «Defeitos»). Sem `db` (visitante) a foto é o que a loja já tem. Quem escreve na loja é o serviço e, na geração, o controlador (`setActiveSeries`). |
| `playlistsStore`, `albumsStore` | só o controlador escreve, na geração (`setPlaylists`, `setDefaultBatchName`, `setActiveAlbumSeriesId`; o modo «criar» pelo serviço de playlists). A tela não as lê. |
| `optimizedAlbumLoader` | as capas: `findAlbum(artista, álbum)` sobre o conjunto **local** de ≈ 30 mil álbuns (um trabalhador com uFuzzy), não o catálogo do Apple Music; `getArtworkUrl(achado, 100)`. Até três por série, para cada série, sem esperar (`preloadAllThumbnails`). |
| `isPhone`/`onPhoneChange` | a view assina a troca (vai em `this.subscriptions`); cada troca faz o desenho inteiro. |
| `localStorage` | nada. |
| O endereço | `?seriesId=<id>` (vindo de «Blend your Albums» da tela de álbuns): a série chega escolhida (F63). |

**Consequência para o desenho:** a tela nova **não assina loja nenhuma**. A leitura das séries e das capas é um pedido único por visita, guardado num objeto da visita (`blendVisit`, como `inventoryVisit`), começado no `prepare` da rota **sem ser esperado** (ver «Riscos», 2), e a tela ouve esse objeto por `useSyncExternalStore` com a assinatura estável (lição 12). Nada de `useMemo` sobre a lista de séries: ela é trocada inteira, mas o cache das capas (`Map`) muda por dentro.

## Quem guarda qual estado

- **A view** (morre com a visita): `selectedSeries`, `selectedRecipe`, `config` (`duration`, `outputMode`, `rankingType`: **um objeto da view até a primeira mudança de ingrediente, e daí o MESMO objeto do painel de ingredientes**, passado por referência em `onConfigChange`), `isGenerating`, `_leaving` (o `AbortController` de sair).
- **O seletor**: `selectedEntity` (`albums`), `selectedSeries` (uma segunda cópia), `series` (a foto), `isLoading`, `thumbnailCache` (`Map` por série, mudado por dentro), `revealChosen` (rolar até o cartão escolhido, uma vez).
- **A folha do celular**: `sheet`, `query`, `elements`.
- **Os cartões de receita**: `recipes` (lidos de `getAllAlgorithms()` no construtor), `selectedRecipe` (uma terceira cópia).
- **O painel de ingredientes**: `selectedRecipe` (quarta cópia), `config` (`duration` 60, `outputMode` `auto`, `groupingStrategy` `by_album`, `rankingType` `combined`, `trackCount` 3). **Não é zerado quando a receita muda**: o que se escolheu numa receita vale para a próxima.
- **O painel de gerar de novo** (estático, vive entre visitas): `pending` (o que a pessoa mudou e não gerou), `currentConfig`, as instâncias dos cartões e dos ingredientes. `reset()` no `prepare` da rota de playlists e depois de gerar.

**Na nova:** um estado só da tela (`useState`/`useReducer` em `Blend.tsx`, ou um modelo puro `screens/blend/blendChoices.ts` com série, receita, ingredientes, gerando, progresso e erro). As quatro cópias viram uma. A regra de ingredientes (o que aparece, o que vai para a geração) é um modelo puro, `models/recipeIngredients.js`, partilhado com o painel de gerar de novo; a memória `pending` do painel vira um módulo pequeno de `screens/playlists/` (vive entre visitas como hoje).

## Como a tela redesenha hoje, e o que a nova repete

- **Desenho inteiro** (`fullUpdate`): escolher uma série (clique, Enter ou Espaço no cartão; um toque na folha), escolher uma receita, virar celular ↔ computador, abrir por `?seriesId`. `SafeDOM.clear(#app)` e a árvore nova; os três pedaços desenham de novo por `innerHTML`; **o foco volta para a página**. Escolher uma série desenha a tela **duas vezes** (o `fullUpdate` e o `render()` do seletor logo depois).
- **Redesenho de um pedaço:** um botão de ingrediente (agrupamento, estrutura, fonte, Top #) refaz **só o painel de ingredientes** por `innerHTML` (o foco vai para a página) e chama `updateGenerateButton`; o deslizador da duração **não** refaz o painel (o foco fica nele), só o número ao lado e `updateGenerateButton`. `updateGenerateButton` refaz a faixa dos passos (achada por `document.querySelector('.inline-flex.items-center.gap-2')`, a primeira do documento), a barra do celular (`replaceWith`) e a seção do botão de gerar.
- **As capas chegando:** cada série cujas capas chegam refaz **o seletor inteiro** (no computador, `innerHTML`; no celular, a linha e, com a folha aberta, a lista da folha com a busca guardada). Com N séries, N redesenhos: no computador **a caixa da lista volta ao topo e o foco num cartão se perde** a cada um.
- **Gerar:** o botão e a barra passam a «Blending…»/«Blending...»; o progresso escreve `#blend-results` (tira `hidden`); no fim, o botão volta.

**A nova:** o gancho `useFocusLikeAfterAnewDraw` com `after` só nos desenhos que a antiga fazia inteiros ou por pedaço por **ação da pessoa** (série, receita, ingrediente por botão, virar o aparelho), e `keep` com o deslizador (a antiga não o tocava). **As capas chegando não soltam o foco nem rolam a lista** (ver «Perguntas», 3). Cada pedaço que a antiga refazia ganha uma `key` que muda quando ela o refaria (lição 15): o painel de ingredientes a cada botão, a barra do celular a cada `updateGenerateButton`, a seção do botão idem. Texto em pedaços vira um nó só (lição 1): o resumo «Using X on Y (60 min, auto mode)» e a nota da barra.

**Os ouvintes de hoje:** no seletor, `#blend-entity-select` `change` (troca de entidade: zera a série do seletor, chama `fullUpdate` e lê as séries de novo) e, por cartão, `click` e `keydown` (Enter, Espaço com `preventDefault`); na folha, `input` na busca e um `click` delegado na lista (`[data-series-id]`: fecha a folha **antes** de escolher); nos cartões de receita, `click`; nos ingredientes, `input` no deslizador e `click` em cada botão (achados por `document.querySelectorAll`, no documento inteiro); `click` no botão de gerar (posto de novo a cada desenho da seção) e no da barra. Na nova cada um vira `onClick`/`onKeyDown` no próprio elemento; o deslizador fica com o ouvinte `input` na mão (lição 10: o `onChange` não ouve um valor escrito por script) e com o valor escrito numa passada depois do desenho (`defaultValue` ganha o atributo `value`).

## O fluxo de gerar, e onde ele passa às playlists

1. `handleGenerate`: sem série ou receita, nada. `isGenerating = true`, `updateGenerateButton`, um `AbortController` novo.
2. Importa o roteador e o `toast` (`import()` dentro do clique; os dois já estão no script principal).
3. `config = { algorithmId: receita.id, ...ingredientes.getConfig() }` — `getConfig` dá `targetDuration` em **segundos**, `rankingId` (`combined` → `balanced`), `outputMode`, `groupingStrategy`, `trackCount`, **todas as cinco sempre**, mesmo as que a receita não mostra.
4. `blendingController.generateFromSeries(seriesId, config, { onProgress, signal })`: pede à carga os álbuns da série com as fontes da receita (`albumAsks.albumsOf`, `sourcesForRecipe`), escreve o progresso em palavras (`askProgressText`), para se ninguém está pronto (`noAlbumsMessage`), gera (`playlistGenerationService.generate`), põe a série ativa, as playlists, o modo «criar» e o nome padrão do lote.
5. Os avisos da carga (`notices`) viram `toast.warning(aviso, 10000)` um a um; então `toast.success('Generated N playlist(s)!')` e `router.navigate('/playlists?seriesId=<id>')`. **A tela de playlists (onda 2, React) lê o que o controlador pôs na loja.**
6. Erro: `BlendCancelledError` (a pessoa saiu) não diz nada; outro erro escreve o painel vermelho em `#blend-results` com a mensagem crua. `finally`: `isGenerating = false` e `updateGenerateButton`.
7. Sair (`destroy`): aborta a carga e fecha a folha do celular.

**Na nova:** o clique chama uma função da tela (`generate.ts`) que faz o mesmo; a navegação vai pela ponte (`react-bridge/navigation.ts`, adiada para depois do desenho) **dentro da continuação do clique, nunca de um efeito**; o `AbortController` vive no objeto da visita e o `dispose` da rota aborta. Os textos que o controlador diz (o progresso «Generating playlists with …», `noAlbumsMessage`, `askNotices`, `askProgressText`) são de `controllers/` e `models/`: os de `models/` voltam códigos (como a 6c fez no inventário), os do controlador vão ao dicionário nele.

## O seletor de séries, os cartões de receita, o painel de ingredientes

- **Computador, passo 1:** o rótulo «Blend your Music by» e o select com quatro opções (só «Albums» ligada; «Artists», «Genres», «Tracks» com « (Coming Soon)», desabilitadas); «Select Series» e a grade de duas colunas numa caixa de 16 rem que rola; cada cartão (`div[role=button][tabindex=0][aria-pressed]`, `data-series-id`) com a cascata de até três capas, o nome (escapado: ver «Defeitos», 2), «N album(s)» e o ✓ do escolhido. Carregando: um círculo girando; sem séries: «No series found for this entity type».
- **Celular, passo 1:** o mesmo select com rótulo `for`; «Series»; uma linha-botão (`#blend-series-pick`) com a cascata da escolhida ou o ícone `Layers`, o título («Choose a series» ou o nome **decodificado**), a meta («Loading your series…», «No series yet: create one on Home», «N series to choose from» ou «N album(s)») e «Choose»/«Change»; desabilitada carregando ou sem séries. O toque abre a **folha cheia** «Choose a series» (`openSheet({ variant: 'full' })`): o campo «Search series» (`type=search`), a linha de estado (`role=status`: «N series» ou «n of N series»), a lista (`role=list`) com uma linha-botão por série (`role=listitem`, `aria-pressed`, a cascata, o nome, «N album(s)», o ✓); sem resultado: «No series with that name.». Um toque escolhe, fecha a folha **e então** escolhe.
- **Receitas:** as quatro de `getAllAlgorithms()` na ordem do registro (`mjrp-balanced-cascade` recomendada, `top-n-popular`, `top-n-acclaimed`, `top-n-user`); cada cartão um `div` com o selo «★ RECOMMENDED» quando é a recomendada, o ícone num quadrado com o gradiente da receita, o nome, o selo (`badge` ou «ALGORITHM») e a descrição em duas linhas. O escolhido ganha `${from}/10 ${to}/10` (classes montadas na hora, no `safelist` do Tailwind: ver «Riscos», 6). Grade de duas colunas, quatro a partir de `lg`; no celular uma coluna com a descrição inteira (CSS).
- **Ingredientes** (o que aparece depende da receita, `ALGORITHM_RECIPES`; receita desconhecida mostra tudo menos o Top #): «Choose your Top #» (Top 1 a Top 10), «Grouping Tracks» (cinco), «Playlist Structure» (Single, Multiple, Auto), «Target Duration (minutes)» (deslizador 30–180 de 5 em 5 e «60m»; aparece quando a receita é feita sobre a duração ou quando ela tem estrutura e a estrutura não é «Single»), «Ranking Source» (Spotify Popularity, Critics Choice, Combined).
- **O botão de gerar:** sem série ou receita, «👈 Select a series» ou «👈 Select a recipe» acima; «Blend your Album Playlist!» (com «s» em «Multiple»); pronto, «Using **receita** on **série** (60 min, auto mode)». Gerando: o círculo e «Blending...».
- **A faixa dos passos:** Mix, Recipe, Ingredients, «Blend it! Ready!»; o atual com `aria-current="step"` e laranja, os feitos verdes com ✓. Na prática o passo 3 **nunca** é o atual (de 2 vai a 4).

## As janelas e as folhas do celular

Uma folha só, a de escolher a série (acima). **Nenhuma janela.** Os avisos são `toast` (sucesso, os avisos da carga por 10 s). A barra do celular (`#blend-phone-bar`, `.phone-action-bar.blend-bar.md:hidden`, dentro do `#app`): a nota (`role=status`, `aria-live=polite`: «Step 1 of 4: choose a series», «Step 2 of 4: choose a recipe» ou «receita · 60 min») e «Blend it!»/«Blending…» (desligado sem os dois passos ou gerando, `aria-busy`), o mesmo caminho do botão do computador. Entre 768 e 899 px a barra aparece só porque `mobile.css` vem depois do Tailwind e vence o `md:hidden` com a mesma força (ver «Riscos», 7).

## Os estados vazio, carregando e erro

- **Carregando as séries:** o círculo no passo 1 (computador) e «Loading your series…» na linha desabilitada (celular). Aparece de verdade: a view desenha antes de ler.
- **Sem séries:** «No series found for this entity type» (computador); «No series yet: create one on Home» com a linha desabilitada (celular). Uma leitura que falha cai aqui também (o erro vai para o console).
- **Passos travados:** «🔒 Choose Your Recipe» / «Complete Step 1 to unlock», «🔒 Blend It!» / «Complete previous steps to unlock» (com série e sem receita), apagados a 40%. Sem série, o passo 4 nem aparece.
- **Gerando:** o progresso em `#blend-results` (o círculo e a frase da carga, depois «Generating playlists with <id>...»).
- **Erro de geração:** o painel vermelho com `AlertCircle` e a mensagem; fica até o próximo desenho inteiro.
- **Folha sem resultado:** «No series with that name.».

## O CSS

`public/css/mobile/blend.css` (451 linhas, tudo dentro de `@media (max-width: 899px)`) e as regras do painel em `public/css/mobile/playlists.css` (`.playlists-view .regenerate-*`, `#regeneratePanelMount:has(.regenerate-content.hidden)`, `.regenerate-content .grid:has(> .blend-recipe-card)`). **Os seletores dependem da forma exata do HTML:** `#app > .container:has(#blend-series-selector)`, `.blend-head > div:first-child > span`, `.blend-stepper__mark > div`, `.blend-bar > .blend-bar__note`. A nova repete a mesma árvore e as mesmas classes (REQ-05); um `div` a mais ou um `Fragment` no lugar errado quebra o celular sem quebrar o computador.

## A estrutura proposta em React

```
ui/recipe/                         (7a; sem loja e sem serviço: recebe as receitas e devolve as escolhas)
  RecipeCards.tsx                  os cartões, o selo, o ícone e o gradiente
  Ingredients.tsx                  as cinco seções e o deslizador
models/recipeIngredients.js        (7a) ALGORITHM_RECIPES, showsDuration, a configuração normalizada (getConfig)
models/recipeLooks.js              (7a) ícone, cores e classe do selo por receita (o que o Tailwind precisa ler inteiro)
screens/playlists/RegeneratePanel.tsx  (7a) o painel sobre ui/recipe, a memória `pending` em regenerateMemory.ts
screens/blend/                     (7b)
  index.ts                         a rota: ReactView com prepare (começa a leitura das séries, sem esperar) e dispose (aborta)
  blendVisit.ts                    a visita: as séries, as capas, o AbortController, quem ouve (useSyncExternalStore)
  seriesCovers.ts                  as capas por optimizedAlbumLoader; o «Artista - Álbum» lido por um modelo puro
  Blend.tsx                        o título, os passos, as quatro seções, o resultado; computador ou celular (usePhone)
  Stepper.tsx, SeriesStep.tsx, SeriesCard.tsx, GenerateSection.tsx, Results.tsx
  phone/SeriesRow.tsx, SeriesSheet.tsx, PhoneBar.tsx
  generate.ts                      o clique de gerar: o controlador, os avisos, a navegação
  types.ts
i18n/en|pt/blend.js                (7a: as receitas, os ingredientes e o painel; 7b: a tela)
```

**O que fica à mão atrás de invólucro, e por quê.** Na 7a: nada novo; a Blend à mão continua com os seus `BlendRecipeCard` e `BlendIngredientsPanel` (duas escritas das mesmas peças até a 7b, mantidas iguais por um teste, como a cascata desde a onda 1; **não** por `mountReactPiece`, que nunca foi construído e somaria uma entrada à lista que só encolhe). Na 7b: nada. Por toda a onda: o `toast`, o motor da Folha por `ui/SheetWindow`, o `BlendingController` e o `PlaylistsController` em JS (camada de baixo, REQ-04).

**Os nomes das receitas** vêm dos metadados dos algoritmos (inglês, em `algorithms/`), que não importam `i18n/`. A tela traduz pelo id da receita (`blend.recipes.<id>.name|description|badge`). **O nome que a geração grava** (o `recipeName` do nome padrão do lote, `_meta` das playlists) é dado e continua o dos metadados nos dois idiomas.

## A divisão em sub-ondas

Duas, nesta ordem; cada uma se constrói, se prova e se julga sozinha, e vai sozinha para o trem.

### 7a — as peças de receita e o painel de gerar de novo, na tela de playlists (≈ 250 linhas à mão saem; a menor)

- **Por que primeiro:** a tela de playlists já é React e já tem dourado (`playlistsFromMain.json`); o painel é pequeno; a 7a tira um invólucro e uma entrada de `BRIDGE_USES` de uma vez, e prova as peças partilhadas antes de a tela grande depender delas.
- **Arquivos:** `ui/recipe/*`, `models/recipeIngredients.js`, `models/recipeLooks.js`, `screens/playlists/RegeneratePanel.tsx` (+ `regenerateMemory.ts`), `screens/playlists/Playlists.tsx` e `index.ts` passam a ele; `i18n/en|pt/blend.js` (as receitas e os ingredientes); saem `components/playlists/RegeneratePanel.js` e `react-bridge/legacy/RegeneratePanel.tsx`; de `BRIDGE_USES` sai `screens/playlists/index.ts` e o motivo de `Playlists.tsx` encolhe (fica só pelas exportações); `tailwindBuiltWithSite` ganha a entrada de `models/recipeLooks.js` (a de `BlendRecipeCard.js` fica até a 7b).
- **Testes levados (linhas `it(`; o número do executor é o que vale):** `test/components/playlists/RegeneratePanel.recipe.test.js` 6 e `test/components/blend/BlendIngredientsPanel.test.js` 9 (uma cópia levada para `ui/recipe/Ingredients`; a original fica com a peça à mão até a 7b): **15 casos**. Ficam sem mudar e verdes: `Playlists.sameAsBefore` (14 cenários contra `playlistsFromMain.json`), `Playlists.test` 36, os do `PlaylistsController` e os 16 do `BlendingController`. Novos: o «igual ao de antes» do painel; o teste que mantém as duas escritas das peças iguais até a 7b; os textos nos dois idiomas.
- **Cenários dourados, capturados do painel à mão ANTES de tocá-lo** (`test/support/regenerateScenarios.js` → `test/fixtures/regenerateBeforeF83.json`, ≈ 16): fechado e aberto; aberto na receita de `generatedWith` de cada uma das quatro, e na recomendada quando as playlists não dizem (salvas antes da F62); cada receita escolhida (os ingredientes trocam); cada tipo de ingrediente; o deslizador; o que se mudou guardado num redesenho (uma letra no nome do lote); «Regenerate Playlists» (a configuração entregue, comparada chave a chave); depois de gerar, o painel segue as playlists novas; no celular, o «⋯» → «Regenerate» abre e rola até ele; o foco depois de cada escolha. O dourado guarda o `#app` **e** a configuração que sairia para `controller.handleGenerate`.
- **Peso:** o script principal **cresce** um pouco (os textos em inglês das receitas e dos ingredientes, ≈ 60 chaves; as peças à mão continuam lá pela Blend); o arquivo da tela de playlists cresce com as peças em React. Medir no primeiro build; o teto sobe só o medido, com o porquê.

### 7b — a tela Blend (≈ 1.630 linhas à mão saem)

- **Arquivos:** `screens/blend/*`, `i18n/en|pt/blend.js` (a tela); `app.js` (a rota sob demanda, a lista do segundo plano, sai a importação estática); saem `views/BlendingMenuView.js`, `components/blend/*` (4) e `components/common/AlbumCascade.js` e as entradas deles no `handMadeScreensBaseline`; `complexityAllowlist` perde as 4 linhas; `outsideTextEscaped` perde a entrada de `BlendRecipeCard.js`; `tailwindBuiltWithSite` perde a dela; `screensLoadThroughTheService` troca `views/BlendingMenuView.js` e `components/blend` por `screens/blend`.
- **Sensores que a 7b precisa tocar:** `viewLifecycle` pede `viewFiles.length > 1` em `views/*View.js`; depois da 7b só sobra `BaseView.js`: a metade das telas à mão (4 casos) sai na 7b, a metade de React fica. `handMadeScreensOnlyShrink` usa `views/BlendingMenuView.js` como exemplo em 3 casos: troque o exemplo por outro arquivo da lista. `everyScreenHasTheLeaveTest` passa a cobrar `test/screens/blend/`.
- **Testes levados:** `test/views/BlendingMenuView.phone.test.js` 7, `BlendingMenuView.fromSeries.test.js` 4, o caso da Blend em `test/security/outsideTextIsText` 1, os 2 casos da cascata à mão em `test/components/ui/coverImage.test.js` (passam a ler `ui/AlbumCascade`; a lista de «quem desenha capa» troca `components/common/AlbumCascade.js` por `screens/blend/SeriesCard.tsx`), `test/ui/AlbumCascade.test.tsx` 7 (5 comparações com a cascata à mão passam a comparar com um retrato capturado antes de apagá-la), e a cópia original de `BlendIngredientsPanel.test.js` 9 sai com a peça (já levada na 7a): **≈ 21 casos levados**, o andaime trocado, a asserção intacta. Novos: o teste-molde de sair; o «igual ao de antes»; os textos em inglês e em português; o texto de fora é texto.
- **Cenários dourados, capturados da tela à mão ANTES de tocá-la** (`test/support/blendScenarios.js` → `test/fixtures/blendBeforeF83.json`, ≈ 40, fuso fixo; o `#app`, o foco e **todas as chamadas** a `generateFromSeries` com a configuração inteira, ao `toast`, ao `router.navigate`, a `loadFromFirestore`, a `findAlbum` e ao `openSheet`): Computador (1280): carregando as séries; sem séries; visitante (sem `db`); a lista com as capas em espera e depois chegadas; uma série escolhida por clique, por Enter e por Espaço; `?seriesId=` de uma série (escolhida, rolada até ela, receitas destravadas), de uma que não existe, e outra escolhida depois; cada uma das quatro receitas e o painel dela; cada botão de ingrediente (as cinco de agrupamento, as três de estrutura, as três de fonte, Top 1, 5 e 10); o deslizador (o número, a faixa, o resumo, a barra); «Multiple» (o botão no plural); gerar: ocupado, cada frase de progresso, sucesso (os avisos de 10 s, o sucesso, a navegação), nenhum álbum pronto, erro, e sair durante a carga (nada dito); sair e voltar (tudo zerado). Celular (393, e 820, que é celular desde a F88): a linha carregando, sem séries, sem escolha e escolhida; a folha aberta (o foco), a busca estreitando, sem resultado, um nome com `&amp;`; escolher pela folha; as capas chegando com a folha aberta (a busca guardada); a nota da barra em cada passo, «Blending…» com `aria-busy`; o botão da barra pelo mesmo caminho; as receitas em uma coluna; virar celular ↔ computador com as escolhas mantidas. Cobrir as âncoras `^blend-phone-step1-empty`, `^blend-phone-series-sheet-open`, `^blend-phone-ready` e `^blend-phone-blending` de `docs/specs/info-arch.md`.
- **Peso:** o script principal **encolhe**: saem a view, as quatro peças, a cascata e, se nada mais do script principal os alcança, o `BlendingController`, o `PlaylistGenerationService`, os algoritmos e as estratégias de ranking (≈ 1.900 linhas de fonte; hoje o arquivo da tela de playlists os alcança pelo controlador dela, então viram um arquivo comum das duas telas). Estimativa: **10 a 20 kB comprimidos a menos**, com ≈ 1 kB de volta pelos ≈ 50 textos em inglês da tela. **O teto desce para o valor medido mais 144 B.** O arquivo da tela, sob demanda, deve ficar entre 8 e 15 kB, longe do alarme de 30.000 B; o arquivo comum (controlador e algoritmos), medido à parte, entra no `background`. **Medir no primeiro build.**

## Riscos e armadilhas desta tela

1. **O modo estrito roda o efeito duas vezes:** a leitura das séries (`loadFromFirestore`, rede), o pré-carregamento das capas (até 3 × N pedidos ao trabalhador) e a assinatura da troca de aparelho não podem sair de um efeito; vão no objeto da visita, começados no `prepare`. **A geração é só de clique.**
2. **O «carregando» some se o `prepare` esperar a leitura:** a antiga desenha e depois lê (o círculo aparece); o roteador espera o `prepare` antes de desenhar (a barra de progresso só depois de um atraso). Começar a leitura no `prepare` **sem `await`**, guardar a promessa na visita, e a tela mostra o carregando até ela voltar.
3. **As capas redesenham o seletor N vezes** (acima): na antiga, a rolagem da caixa volta ao topo e o foco num cartão se perde a cada série. Ver «Perguntas», 3.
4. **`config` partilhado por referência** entre a view e o painel depois da primeira mudança, e **não zerado ao trocar de receita**: o dourado tem de guardar a configuração inteira que vai para `generateFromSeries` em cada cenário (inclusive uma opção escondida escolhida noutra receita, ver «Defeitos», 8), e a nova copiar o mesmo, não «consertar».
5. **A ordem de fechar a folha e escolher:** a folha fecha **antes** de a escolha desenhar a tela de novo (a próxima coisa não fica embaixo dela). Em React, `close()` e então a escolha, na mesma ordem; o foco que a folha devolve ao fechar vai para a linha que a tela vai refazer (a antiga perde esse foco no desenho inteiro): conferir no navegador.
6. **As classes montadas na hora** (`${recipe.color.from}/10`): o Tailwind não as vê no JSX. Elas estão no `safelist` (`tailwind.config.js`, `RECIPE_GRADIENT_AT_10`) e `tailwindBuiltWithSite` lê as cores **do arquivo `BlendRecipeCard.js`**: o teste e o `safelist` passam a ler `models/recipeLooks.js` na 7a, e o caminho antigo sai na 7b.
7. **A barra entre 768 e 899 px** existe só pela ordem das folhas de estilo (`.phone-action-bar { display: flex }` de `mobile.css` depois do `md:hidden` do Tailwind). A lição 4 já viu o empacotador mudar essa ordem uma vez: a passada no **build** no **WebKit com perfil de iPhone** e no Chromium a 820 px não é opcional.
8. **O dourado do painel de playlists** só tem «aberto» e «fechado» (`playlistsScenarios.js`): escolher uma receita, um ingrediente e apertar «Regenerate» **não estão** no retrato. A 7a captura os cenários novos da peça à mão antes de tocá-la.
9. **Os nomes com entidades HTML** («Rush &amp; Friends»): o computador escapa o texto já com a entidade (aparece «&amp;» na tela), o celular decodifica. Copiar os dois como são (lição 11: copie o que a antiga desenha).
10. **`updateStepper` acha a faixa pela primeira `.inline-flex.items-center.gap-2` do documento** (a moldura não tem nenhuma hoje): em React a faixa é um componente; nada a copiar, mas o dourado do passo seguinte a uma mudança de ingrediente prova que a faixa certa mudou.
11. **Duas escritas das peças de receita entre a 7a e a 7b:** um teste as mantém iguais (HTML e configuração); uma mudança na `main` nesse intervalo tem de ir às duas.
12. **O caminho do Apple Music:** a carga dos álbuns que a geração pede acha os álbuns pelo **Apple Music** (a porta única da carga); a receita «Top Tracks by Spotify Popularity» lê a popularidade do Spotify e a «Combined» cai no BestEverAlbums onde falta. A prova troca a carga por álbuns postos (como nas ondas 5 e 6) e compara a configuração e as chamadas, antiga contra nova. As capas da Blend **não** vêm do Apple Music: vêm do conjunto local; no site construído o roteiro responde o arquivo do conjunto.
13. **O texto do botão que se aperta:** a antiga reescreve o botão de gerar e o da barra a cada `updateGenerateButton` (a seção inteira por `innerHTML`). A lição 14 (UAT-282): não reescreva o texto de um controle que pode ter sido apertado; só o troque quando muda. Se o WebKit perder o toque na antiga e não na nova, é diferença para melhor, registrada.
14. **A tela antiga da Blend é a última `views/*View.js`**: depois da 7b, `BaseView.js` fica só pelo título da aba (`useScreenTitle`); ver o mapa da onda 8.

## Defeitos de hoje que ficam como estão (candidatos a issue; nenhum consertado na migração)

1. Os cartões de receita são `div` sem `role`, sem `tabindex` e sem `aria-pressed`: **não se escolhe receita pelo teclado**.
2. No computador o nome da série com entidade HTML aparece cru («Rush &amp; Friends»); no celular, decodificado.
3. As capas chegando refazem o seletor N vezes: no computador a lista volta ao topo e o foco num cartão se perde.
4. A faixa dos passos nunca marca o passo 3 como atual (vai do 2 ao 4).
5. O progresso diz «Generating playlists with mjrp-balanced-cascade...»: o id, não o nome da receita.
6. O resumo «(60 min, auto mode)» aparece mesmo quando a receita não usa a duração nem a estrutura.
7. A troca de entidade (inalcançável hoje: as três outras estão desabilitadas) deixaria a série escolhida na view.
8. Os ingredientes não são zerados ao trocar de receita, e `getConfig` entrega os cinco sempre: uma opção escolhida numa receita e escondida na seguinte **ainda vai para a geração** (conferir se alguma receita a lê; se lê, é a F62 «uma opção só aparece onde muda o resultado» furada).
9. Peças mortas: três receitas em `ALGORITHM_RECIPES` que não estão registradas (`mjrp-cascade-v0`, `s-draft-original`, `legacy-roundrobin`), `DURATIONS` sem uso, a expressão `top-(\d+)` que nenhum id casa, `getSelection` sem quem chame.
10. A lista de séries é uma foto: uma série criada durante a visita só aparece na próxima; e cada visita lê o Firestore de novo.
11. As capas vêm do conjunto local de álbuns: um álbum que não está nele mostra o substituto, mesmo com capa no Apple Music.
12. O painel de erro fica até o próximo desenho inteiro; e a mensagem é a do erro, crua.
13. O círculo do progresso usa `border-3`, que o Tailwind não tem (sai com a borda padrão).
14. Dois textos de sucesso diferentes para a mesma coisa: «Generated N playlist(s)!» (Blend) e «Generated N playlists» (gerar de novo).
15. O painel de gerar de novo: dois elementos com a classe `regenerate-header` (o botão e o `h3`), o botão de dobrar sem `type="button"`, e os ouvintes dos ingredientes achados no documento inteiro.

## O que a música toca aqui

A Blend não toca música. Ela pede os álbuns da série à carga, que os acha pelo **Apple Music** (o caminho de primeira classe; o dono o usa); a receita recomendada e a «Combined» leem a nota do BestEverAlbums e a popularidade do Spotify onde houver; «Top Tracks by Spotify Popularity» depende do Spotify; «My Own Ranking» (`top-n-user`) lê a classificação da pessoa. **O que não dá para exercitar sem conta:** o MusicKit de verdade (o token vem do servidor, a busca precisa do catálogo), a popularidade de uma conta Spotify conectada e a classificação gravada de uma pessoa real. A prova troca a carga por álbuns postos com cada fonte presente e ausente, e compara os avisos (`askNotices`) antiga contra nova.

## Os textos

≈ 100 lugares de texto à mão na tela e no painel (contados com `scripts/lib/stringSites.mjs`: a view 36, os ingredientes 30, a folha 13, o seletor 12, os cartões 7, o painel 3, o controlador 2), mais os 12 dos metadados das quatro receitas (nome, descrição, selo). Inglês aberto, português fechado (`i18n/en/blend.js`, `i18n/pt/blend.js`; `ui.recipe.*` para as peças partilhadas). Plurais por `tPlural` («1 album» / «N albums», «N series», «n of N series», «Generated 1 playlist» / «N playlists»; a antiga escreve «playlist(s)»: o texto em inglês fica igual, o português ganha o plural certo). Ficam sem tradução: «Blend» (a marca, decisão da F80), «Spotify», «BestEverAlbums», «BEA», os emojis (🍹 🔒 👈) e o nome que a geração grava. Os textos em português são propostos pelo agente e esperam o MJRP (como nas ondas 4 a 6).

## Perguntas abertas (o orquestrador decide; cada uma com a recomendação)

1. **Dividir em 7a (as peças de receita e o painel de gerar de novo) e 7b (a tela)?** Recomendação: **sim, nessa ordem**. A 7a é pequena, cai numa tela já em React com dourado, tira um invólucro e prova as peças que a 7b usa. A alternativa (uma onda só, ≈ 1.880 linhas, do tamanho da 6b) também cabe, mas junta duas telas numa prova.
2. **Onde moram as peças de receita?** Recomendação: **`ui/recipe/`**, sem loja e sem serviço; a lista de receitas entra por propriedade, montada por `models/recipeLooks.js` a partir de `getAllAlgorithms()`. As duas telas as usam; nenhuma `import()` de janela (lição 16).
3. **As capas chegando soltam o foco e voltam a lista ao topo?** Recomendação: **não reproduzir**: é um desenho de fundo, não uma ação da pessoa, e roubaria o foco de quem usa teclado ao acaso; segue a decisão da lição 1 (a rolagem ao topo de um redesenho não é reproduzida). Registrar como a diferença de propósito da onda. As ações da pessoa (série, receita, ingrediente) soltam o foco como hoje.
4. **A leitura das séries espera no `prepare`?** Recomendação: **não**: começa no `prepare` e a tela mostra o carregando, como hoje (Riscos, 2).
5. **Os nomes das receitas no dicionário?** Recomendação: **sim, pelo id, só na tela**; o que a geração grava (nome do lote, `_meta`) fica o dos metadados.
6. **O cartão de receita sem teclado (defeito 1).** Recomendação: **manter** nesta onda e abrir a issue; o conserto (um `button` com `aria-pressed`) é pequeno mas muda o HTML que o dourado compara e o foco; vale fazer logo depois da onda, nas duas telas de uma vez, já que a peça é uma só.
7. **A opção escondida que vai para a geração (defeito 8).** Recomendação: **manter e medir**: um teste de caracterização na 7a diz se alguma receita lê a opção escondida; se lê, issue para a F62, fora da migração.
8. **Juntar a `main` antes de capturar o dourado?** Recomendação: **não é preciso para a Blend** (a `main` não a tocou desde `b8947e0`); juntar logo antes da 7a se a `main` andar no painel de gerar de novo, nas receitas ou nos algoritmos, e pedir que mudanças nessas peças esperem a 7b (lição 12).

## Onde parou

O mapa está escrito; nada foi construído. Próximo passo, se o orquestrador aceitar a divisão: capturar o dourado do painel à mão (`regenerateBeforeF83.json`) **e** o da Blend à mão (`blendBeforeF83.json`) antes de qualquer linha, e começar a 7a.

## Depois da 7a (2026-11-22, ramo `claude/f83-wave-7a-recipe-pieces`): o que a 7b encontra

**Decisões do orquestrador (a 7a seguiu; revisáveis):** 7a e depois 7b; as peças de receita em `ui/recipe/`; os nomes das receitas pelo dicionário, pelo id, só na tela (o que a geração grava fica o dos metadados); cartões sem teclado e opção escondida que vai para a geração **mantidos** (a migração não conserta nada); nenhuma junta com a `main`.

**O que a 7a deixou pronto:** `ui/recipe/RecipeCards.tsx` e `Ingredients.tsx` (sem loja e sem serviço: `recipes`, `selectedId`, `onSelect` / `recipeId`, `choices`, `onChange`, `recipeChosen`), `models/recipeLooks.js` (ícone, cores e classes, escritas inteiras) e `models/recipeIngredients.js` (`ingredientsOf`, `showsDuration`, `configOf`, `choicesOf`, `DEFAULT_CHOICES`), `i18n/en|pt/blend.js` (as quatro receitas) e `ui.recipe.*`, `broken()` (o texto como o molde à mão o quebrava em linhas). **Os cartões e os ingredientes à mão não foram ligados à Blend em React: a Blend à mão segue com os seus, e as duas escritas são mantidas iguais por `test/ui/recipe/RecipePieces.sameAsHandMade.test.tsx` (a página, as caixas de cada elemento no navegador, e o texto até o último espaço).**

**O que a 7b tira quando apaga `components/blend/BlendRecipeCard.js` e `BlendIngredientsPanel.js`:** o teste `RecipePieces.sameAsHandMade.test.tsx` (e, em `recipeLooks.test.js` e `recipeIngredients.test.js`, os casos que leem a peça à mão: ficam os que dizem o que o modelo é, sem a comparação); a cópia original `test/components/blend/BlendIngredientsPanel.test.js` (já levada); o `safelist` `RECIPE_GRADIENT_AT_10` de `tailwind.config.js`, a entrada `components/blend/BlendRecipeCard.js` de `PUT_TOGETHER_AT_RUN_TIME` e o último caso de `tailwindBuiltWithSite.test.js` (as cores com `/10` agora estão escritas inteiras em `models/recipeLooks.js`); as entradas de `outsideTextEscaped`, `complexityAllowlist` e `handMadeScreensBaseline`; os dois `vi.mock` dessas peças em `test/views/BlendingMenuView.fromSeries.test.js`.

**Achados da 7a que valem para a 7b:** (1) o painel de gerar de novo e a Blend partilham `getAllAlgorithms()`: a Blend em React chama `recipesOf(getAllAlgorithms())` e entrega as peças; (2) nenhuma das quatro receitas lê uma opção que o painel esconde dela (`test/algorithms/recipes.hiddenIngredients.test.js`), mas as playlists a lembram em `_meta`; (3) o texto de uma peça deve ser UM nó e levar a quebra de linha do molde à mão, ou o WebKit o mede 0,19 px mais largo (o selo «SPOTIFY» e o «BEA»: «Y» e «A» com espaço depois são kernados, com a quebra de linha não): o `normalize` do dourado não vê isso, o navegador sim; o teste `RecipePieces` compara agora o texto de cada nó até o último espaço; (4) o painel de ingredientes à mão do celular e do computador é o mesmo: a 7b só põe as peças na tela; a `Ingredients` já traz o deslizador ouvido pelo evento `input`.
