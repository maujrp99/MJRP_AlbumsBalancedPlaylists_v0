# log — o que aconteceu, em ordem

> **Append-only.** Uma entrada por bloco de trabalho, mais recente no topo, com prefixo parseável: `## [AAAA-MM-DD HH:MM] <tipo> — título`. Tipos: `session`, `decision` (o conteúdo mora na página do assunto em `docs/wiki/`, seção `## History`), `ingest`, `inventory`, `harness-feedback`, `review` (uma passada de crítica, com o caminho do relatório). Hora de Brasília, sempre. Ninguém lê este arquivo inteiro — consulta-se por data ou `grep`. Aqui fica só o **quando**; o que é verdade mora na wiki, o estado no `MEMORY.md`.

## [2026-11-22 07:06] step — F83 onda 7b: a rota /blend em React, as peças à mão saem, os sensores e os testes levados

**Branch:** claude/f83-wave-7b-blend-screen

- `app.js`: `/blend` por `loadScreen(() => import('./screens/blend/index.ts'))` e na lista do segundo plano. Saem com `git rm`: `views/BlendingMenuView.js`, `components/blend/` (4 arquivos), `components/common/AlbumCascade.js`, `test/components/blend/BlendIngredientsPanel.test.js` e `test/ui/recipe/RecipePieces.sameAsHandMade.test.tsx`.
- Sensores: `handMadeScreensBaseline` perde 6 entradas (24 para 18 arquivos), `complexityAllowlist` 4 linhas, `outsideTextEscaped` 1, `tailwindBuiltWithSite` 1 entrada e o último caso (agora lê as cores `/10` de `models/recipeLooks.js`), o `safelist` e a constante `RECIPE_GRADIENT_AT_10` saem de `tailwind.config.js`; `screensLoadThroughTheService` passa a ler `screens/blend`. `viewLifecycle`: saem os 4 casos da metade à mão (não há mais `*View.js` além de `BaseView.js`) e entra a guarda «só sobra `BaseView.js` em `views/`»; a metade de React (lê `screens/`) fica, e cada tela tem o teste-molde de sair.
- Testes levados: os 7 da Blend no celular e os 4 de `?seriesId=` (mesmas asserções, o andaime trocado; `Blend.phone.test.tsx`, `Blend.fromSeries.test.tsx`); os 2 da cascata à mão em `coverImage.test.js` leem `ui/AlbumCascade`; os 5 da cascata em `AlbumCascade.test.tsx` comparam com um retrato capturado antes de apagar a cascata (`albumCascadeBeforeF83.json`); `recipeIngredients`/`recipeLooks` ficam com os valores que a peça à mão tinha; o caso da Blend em `outsideTextIsText` desenha o `SeriesStep`. Novos: o teste-molde de sair, os textos em inglês e em português, o «igual ao de antes».
- Complexidade: `Blend` foi dividida (`generate.ts`, seções); o molde `as unknown` só em `react-bridge/`.

## [2026-11-22 06:59] step — F83 onda 7b: a tela Blend em React (screens/blend/), igual ao dourado

**Branch:** claude/f83-wave-7b-blend-screen

- `screens/blend/` (Blend, SeriesStep, phone/PhoneStep, blendVisit, index, types), `models/seriesCovers.js` (a leitura das consultas de capa, pura) e os textos `blend.*` em inglês (`i18n/en/blend.js`) e as propostas em português (`i18n/pt/blend.js`, esperam o MJRP). A tela usa as peças de 7a (`recipesOf(getAllAlgorithms())`), não assina loja nenhuma, e a leitura das séries começa no `prepare` sem ser esperada (o «carregando» aparece).
- Os 40 cenários do dourado passam contra a tela nova (teste `test/screens/blend/Blend.sameAsBefore.test.tsx`), com UMA diferença de propósito, provada nos dois sentidos: as capas que chegam em segundo plano não soltam o foco (a antiga o soltava). A palavra trocada de propósito derruba o cenário. O dourado foi capturado de novo depois de o hospedeiro passar a tirar o `#app` ao sair (a primeira captura de «sair e voltar» lia um `#app` velho).
- Ainda não ligada à rota: a antiga segue em `app.js` até o passo seguinte.

## [2026-11-22 06:53] step — F83 onda 7b: o dourado da tela Blend à mão, capturado antes de tocá-la

**Branch:** claude/f83-wave-7b-blend-screen

- 40 cenários (`test/support/blendScenarios.js`, o hospedeiro `blendHost.tsx`, o mundo de fora `blendStandIns.js`) jogados na `BlendingMenuView` à mão e gravados em `test/fixtures/blendBeforeF83.json`: séries (carregando, nenhuma, leitura que falha, visitante, uma, muitas), capas (esperando e chegadas, as formas de consulta, fora do conjunto), escolher por clique, Enter e Espaço, `?seriesId=`, cada receita e cada ingrediente, o deslizador, gerar (ocupado, progresso, avisos, nenhum álbum, erro, sair durante a carga), sair e voltar, e o celular (linha, folha, busca, barra, virar o aparelho). O fixture guarda o `#app`, a folha, o foco e tudo o que a tela pediu ao mundo (a configuração inteira de `generateFromSeries`, os avisos, a ida às playlists).
- A junta com a linha de integração: suíte inteira verde (375 arquivos, 4.990 testes) antes de qualquer trabalho novo.
- Achado do dourado: na antiga, quando as capas chegam o foco num cartão se perde (`body`); é a diferença de propósito da onda (a nova o mantém).

## [2026-11-22 06:50] step — F83 onda 7b: a linha de integração (6a-fix, 6b, 6c) junta ao ramo da 7a

**Branch:** claude/f83-wave-7b-blend-screen

- `integrate/staging-2026-11-21` (59e215d) entrou no ramo da 7a (fecfc69). Conflitos: `wave-lessons.md` (duas seções «17»: a da 6c ficou 17 e a da 7a virou 18) e `scripts/bundle-budget.json` (ficou o texto da 7a; o teto do principal e o de `background` serão medidos de novo no build depois da junta).

## [2026-11-22 06:46] review — F83: ondas 6b (as janelas do álbum, de editar e de adicionar) e 6c (os textos do inventário) na linha de integração

**Branch:** integrate/staging-2026-11-21

- 6b: o juiz independente passou (0 P0, 0 P1, 3 P2), julgado na `6622654` contra a `315ae5f`; relatório guardado como veio em `reports/audits/2026-11-22-mjrpalbumblender-v0-react-album-and-inventory-windows-visual-parity-recheck.md`. A diferença de imagem da janela de adicionar era o aviso «Authentication issue» saindo da tela no instante da foto (some com o Firebase bloqueado; 0 px com a tela assentada).
- P2 a anotar na prova: sair da tela fecha também as janelas de editar e de adicionar (de propósito, como a do álbum); no Chromium a 899 px com mouse o código antigo às vezes abria a janela com o título já na barra (defeito antigo não levado).
- 6c (`80d3e1d`): sem juiz próprio — só muda de onde vêm as frases em inglês, iguais palavra por palavra (as fotos de referência de 6a e 6b passam sem recaptura); decidido pelo agente — revisável; a varredura do juiz da onda 7 cobre o inventário de novo. O português proposto segue pendente do MJRP.

## [2026-11-22 06:43] step — F83, onda 7a: a prova no navegador, as notas e os totais

**Branch:** claude/f83-wave-7a-recipe-pieces

- A prova no navegador sobre os sites CONSTRUÍDOS (`reports/evidence/F83/wave-7a/proof.md`, `browser-proof.mjs`, `summary.txt`, `raw/`): o painel em React contra o à mão do pai (`b29b552`) no Chromium 1280, 900 e 899 e no WebKit 1280, iPhone 14 e iPhone SE, em cada estado (fechado, aberto, cada receita, cada ingrediente, o deslizador com o teclado, a ordem do Tab, a falha sem série, «gerando» e a falha da geração, e no celular o «⋯ → Reconfigure and regenerate»), mais a tela Blend à mão (regressão) no Chromium e no WebKit: **1.047 comparações iguais de 1.047** (a página, a caixa de cada elemento, o foco, a rolagem, o aviso, a figura do painel e a da janela), com o controle de antiga contra antiga. A prova achou e a ponta consertou: o texto das peças precisava da quebra de linha do molde à mão (o WebKit kerna «Y» e «A» antes de um espaço e não antes de uma quebra: dois selos 0,19 e 0,38 px mais largos; `ui/recipe/broken.ts`), e o atributo `value` do deslizador não pode seguir o estado. Duas figuras discordaram uma vez e não se repetiram (a barra de baixo do iPhone SE com fundo desfocado, 34/255; um arco de 30 × 10 px no Blend, Chromium 899): ditas como não explicadas além de ruído.
- `wave-lessons.md` (seção 17), `tasks.md` (a linha 7a), `design-system.md` (a tabela de portes) e o fim do mapa da 7 («Depois da 7a»: o que a 7b encontra e o que tira) em dia.
- Totais na ponta, pela fila: suíte inteira 372 arquivos, 4.950 testes, todos verdes (antes: 365 e 4.814; inclui `test/architecture` com 42 arquivos e `test/security/noSecretsInRepo.test.js`: arquivos de arquitetura e de segurança juntos, 47 arquivos e 379 testes); `typecheck` sem erro; `lint` 0 erros e os mesmos 68 avisos; build dentro do teto (`bundle-budget-wave-7a.txt`: script principal 213.923 B contra 213.079 B no pai, teto 214.066 B; `background` de 53.600 B para 56.400 B, a necessidade medida é 56.331 B; o que vem depois da primeira tela 215.845 B contra 213.896 B).

## [2026-11-22 06:43] step — F83, onda 7a: o texto das peças como o molde à mão o quebrava (achado do WebKit)

**Branch:** claude/f83-wave-7a-recipe-pieces

- O que a prova no navegador achou, consertado: (1) o texto das peças (`ui/recipe/broken.ts`) leva a quebra de linha e a indentação do molde à mão, como UM nó: o WebKit mede o texto que recebe (o selo «SPOTIFY» e o «BEA» saíam 0,19 e 0,38 px mais largos com espaços no lugar da quebra); `RecipePieces.sameAsHandMade.test.tsx` ganhou os casos que comparam cada nó de texto até o último espaço (`rawTexts`); (2) o atributo `value` do deslizador fica o do desenho (`useState`), como o à mão o escrevia uma vez.
- O teto de peso medido de novo com o texto das peças: script principal 213.923 B (teto 214.066 B), o que vem depois da primeira tela 215.845 B, `background` de 56.300 B para 56.400 B (a necessidade medida é 56.331 B).

## [2026-11-22 06:13] review — F83: onda 6a (a tela do inventário em React) passou no juiz independente, na segunda conferência

**Branch:** integrate/staging-2026-11-21

- Primeira conferência (na `315ae5f`): reprovada, 1 P0 — no Chromium em tela de celular, com os valores do Discogs ligados, «Show 50 more» fazia a página pular para o fim do bloco novo (ancoragem de rolagem no aviso do Discogs, que ficava montado). Consertado em `claude/f83-wave-6a-fix-show-more` (`553fbd6`): o aviso é remontado junto com a lista.
- Segunda conferência (na `553fbd6`): passa (0 P0, 0 P1, 1 P2); 504 comparações iguais ao pai. Os dois relatórios guardados como vieram em `reports/audits/2026-11-22-mjrpalbumblender-v0-react-inventory-screen-visual-parity-recheck.md` e `…-recheck-2.md`.
- Cuidado deixado pelo juiz: um elemento novo que fique parado abaixo da lista traz o pulo de volta; `overflow-anchor: none` nessa área seria a guarda mais firme.

## [2026-11-22 05:52] step — F83, onda 7a: o painel de gerar de novo em React, o invólucro e o arquivo à mão saem

**Branch:** claude/f83-wave-7a-recipe-pieces

- O painel «Reconfigure your Music Playlist Blend» em React: `screens/playlists/RegeneratePanel.tsx` (o cabeçalho que dobra, os cartões e os ingredientes de `ui/recipe/`, «Regenerate Playlists») e `screens/playlists/regenerateMemory.ts` (o `pending`, que vive entre os desenhos da tela e entre visitas até `forgetWhatWasChanged`: ao abrir a tela e depois de gerar). O painel é feito de novo (uma `key`) quando muda aquilo de que é feito (as playlists, a série, o nome do lote), e não por uma letra digitada no campo do nome; se está aberto fica de fora dessa feitura. No celular o «⋯ → Reconfigure and regenerate» conta um pedido (`asked`): o painel abre no mesmo desenho e a página rola até ele (antes: `showRegeneratePanel` clicava no botão e rolava).
- Saem, com `git rm`: `components/playlists/RegeneratePanel.js` (183 linhas), `react-bridge/legacy/RegeneratePanel.tsx` (o invólucro, 66) e `test/components/playlists/RegeneratePanel.recipe.test.js` (os 6 casos foram levados para `test/screens/playlists/RegeneratePanel.recipe.test.tsx`, a mesma asserção, o andaime trocado). `handMadeScreensBaseline` perde `components/playlists/RegeneratePanel.js` (182); `BRIDGE_USES` perde `screens/playlists/index.ts` e o motivo de `Playlists.tsx` encolhe (fica só pela janela do Spotify e as exportações).
- Prova: `test/screens/playlists/RegeneratePanel.sameAsBefore.test.tsx` (os 22 cenários do dourado do painel à mão passam: a página do painel, a configuração entregue ao controlador, o foco e a rolagem; mais 4 casos que mostram que o teste acusa uma palavra trocada, um selo, uma descrição, uma dica, uma classe e um texto partido em dois nós) e `Playlists.sameAsBefore` (os 14 cenários da tela inteira contra `playlistsFromMain.json`, sem mudar, verdes: exigiu que as peças escrevessem o branco das pontas do HTML à mão, como UM nó de texto; o ícone `BarChart2` de «Ranking Source» não existe na tabela e não desenha nada, como antes). `RegeneratePanel.texts.test.tsx` (10 casos: nenhum texto solto nos arquivos, toda receita do registro tem nome, descrição e selo nos dois idiomas e o inglês é o dos metadados do algoritmo, o painel em português, a volta ao inglês com as escolhas mantidas).
- O peso, medido no build sem as chaves, pela fila (`reports/evidence/F83/wave-7a/bundle-budget-wave-7a.txt`): script principal 213.922 B contra 213.079 B (+843 B, os textos em inglês), o que vem depois da primeira tela 215.799 B contra 213.896 B (+1.903 B, o arquivo da tela de playlists foi de 10.340 B a 12.216 B). O teto `main` subiu de 213.223 B para 214.066 B (o medido mais 144 B das chaves) e `background` de 53.600 B para 56.300 B (a necessidade medida é 56.284 B). O alarme de tela (30.000 B) não mexeu.

## [2026-11-22 05:51] step — F83, onda 7a: as peças de receita em ui/recipe, os modelos, os textos

**Branch:** claude/f83-wave-7a-recipe-pieces

- As peças de receita em React, sem loja e sem serviço, em `ui/recipe/`: `RecipeCards.tsx` (os cartões; a fileira é feita de novo, com uma `key`, a cada toque, como a à mão) e `Ingredients.tsx` (as cinco seções; um botão refaz as seções e o deslizador não, o deslizador é ouvido pelo evento `input` no próprio elemento, e o número ao lado leva o branco das pontas que o HTML à mão tinha). As regras foram para dois modelos puros: `models/recipeLooks.js` (ícone e cores por receita, a classe do selo e a do cartão, TODAS escritas inteiras: o Tailwind as acha no código e nada é montado na hora, então `tailwindBuiltWithSite` não ganhou entrada nova) e `models/recipeIngredients.js` (o que cada receita mostra, a duração só onde muda o resultado, a configuração normalizada `configOf`, a leitura de volta `choicesOf`). As peças mortas do à mão (três receitas fora do registro em `ALGORITHM_RECIPES`, `DURATIONS`, a expressão `top-(\d+)`, `getSelection`) não foram levadas.
- Textos: `i18n/en|pt/blend.js` (nome, descrição e selo das quatro receitas, pela chave `blend.recipes.<id em camelCase>.<parte>`: uma chave não tem hífen), `ui.recipe.*` (as seções, as opções, as dicas) e `playlists.regenerate.*` (o painel). Os textos em português são propostas do agente e esperam o MJRP.
- Testes: `test/models/recipeLooks.test.js` e `recipeIngredients.test.js` (21 casos, cada um compara com a peça à mão); `test/ui/recipe/Ingredients.test.tsx` (os 9 casos de `BlendIngredientsPanel.test.js` levados, a mesma asserção; a original fica com a peça à mão até a 7b); `test/ui/recipe/RecipePieces.sameAsHandMade.test.tsx` (as duas escritas das peças iguais, elemento por elemento: os 5 cartões e 40 combinações de receita, estrutura, agrupamento, fonte, Top # e duração, e o deslizador depois de movido; acusa uma palavra trocada e um texto partido em dois nós; sai na 7b com as peças à mão); `test/algorithms/recipes.hiddenIngredients.test.js` (15 casos de caracterização, ver abaixo).
- A opção escondida que vai para a geração, medida: nenhuma das quatro receitas LÊ uma opção que o painel esconde dela (as playlists saem iguais faixa a faixa), mas as playlists LEMBRAM todas (`_meta` guarda as quatro): o painel que abre sobre elas mostra uma opção que a receita nunca usou. Mantido como está; candidato a issue (regra «uma opção só aparece onde muda o resultado», F62).
- O dourado do painel foi recapturado do painel à mão (do worktree do pai) sem o corte do branco nas pontas: o painel em React escreve o mesmo branco das pontas (um nó de texto só), porque o dourado `playlistsFromMain.json` da tela inteira o compara.

## [2026-11-22 05:45] step — F83, onda 6a: os dois achados da junta independente (o salto de «Mostrar mais 50» com os valores ligados; «No value yet» em um nó só)

**Branch:** claude/f83-wave-6a-fix-show-more

- Achado 1 (bloqueante): com os valores do Discogs ligados, no Chromium do celular (393, 820, 899 px) «Mostrar mais 50» jogava a página para o fim do pedaço novo (a rolagem ancorada no aviso do Discogs, que ficava montado sob a caixa da lista remontada). Correção: o aviso leva a chave da caixa (`notice.` + `gridKey()`), como a tela antiga, que o refazia a cada desenho; DOM, classes e CSS iguais aos do pai. Escolhida em vez de `overflow-anchor: none` (regra nova que o pai não tem) e de mover o aviso para dentro da caixa (mudaria o DOM).
- Achado 2 (menor): `RowValue` escrevia o texto e o espaço seguinte como dois nós; agora um só, e a linha do Discogs sem ligação à edição também (o cartão: «Discogs · data»). Pixels da lista a 1280 e 900: 0.
- Testes novos (`Inventory.showMore.notice.test.js`), vermelhos antes. Prova no navegador, valores ligados, pai contra ponta: rolagem igual em 24 de 24 (Chromium) e 8 de 8 (WebKit); o mesmo roteiro contra a construção sem correção falha (pai 5.299, sem correção 6.321). Evidência em `reports/evidence/F83/wave-6a/fix-show-more/`. Lição na seção 15 do `wave-lessons.md`.
- Sensores pela fila: suíte inteira 364 arquivos, 4.772 testes verdes (com `test/architecture` e `noSecretsInRepo`); `typecheck` e `lint` sem erro; build dentro do teto.

## [2026-11-22 05:37] step — F83, onda 6c: a prova no navegador e os totais

**Branch:** claude/f83-wave-6c-inventory-texts

- Totais na ponta, pela fila: suíte inteira 367 arquivos, 4.849 testes, todos verdes (inclui `test/architecture` e `noSecretsInRepo`); `typecheck` sem erro; `lint` 0 erros e os mesmos 68 avisos do pai; build dentro do teto (script principal 214.274 B contra 213.079 B no pai).
- Prova no navegador (`reports/evidence/F83/wave-6c/proof.md`): o site construído desta ponta contra o pai `6622654`, em inglês, Chromium a 1280 e a 393: tela do inventário (com o Discogs de mentira) e as janelas, 0 diferença de texto, caixas, foco e rolagem; a única figura diferente (a busca digitada) também difere de pai contra pai (o cursor). Português no servidor de desenvolvimento: 14 estados, nenhum inglês sobrando, 13 limpos (o 14º tem só um brilho decorativo da janela do álbum que passa da página, igual em inglês); a passada achou «Lista de desejos» estourando o selo a 393 px e virou «Desejos».
- `wave-lessons.md` § 17 e a linha 6c do `tasks.md` (TASK-25 marcada feita: 6a, 6b e 6c completas).

## [2026-11-22 05:36] step — F83, onda 7a: o dourado do painel de gerar de novo, capturado do painel à mão

**Branch:** claude/f83-wave-7a-recipe-pieces

- O dourado do painel de gerar de novo, capturado do painel à mão (`components/playlists/RegeneratePanel.js` com `BlendRecipeCard` e `BlendIngredientsPanel`, atrás do invólucro) ANTES de tocá-lo: 22 cenários em `test/support/regenerateScenarios.js`, tocados por `test/support/regenerateHost.tsx` (a rota `playlistsView()`, o controlador de gerar trocado por um que anota a configuração recebida), guardados em `test/fixtures/regenerateBeforeF83.json`. Cobrem: fechado e aberto; aberto na receita de cada uma das quatro e nas playlists sem receita (antes da F62) e com receita que não existe; cada receita escolhida; cada ingrediente (Top 1/5/10, as cinco de agrupamento, as três de estrutura, as três de fonte); o deslizador; a duração que só aparece onde muda o resultado; o que se mudou guardado num redesenho do painel; a opção escondida que ainda vai para a geração; «Regenerate Playlists» (a configuração entregue, chave a chave); depois de gerar o painel segue as playlists novas; geração que falha mantém as escolhas; a tela aberta de novo esquece; o celular (o «⋯ → Reconfigure» abre e rola até o painel). Guardam o HTML do painel, a configuração entregue, o foco e a rolagem.
- O `normalize` do dourado do painel não compara o branco nas pontas de um elemento (o navegador não o desenha) e marca dois nós de texto lado a lado (`¦`): o HTML antigo tinha um nó só, e o Chromium compõe cada nó à parte.
- O registro da captura: `reports/evidence/F83/wave-7a/capture-before.test.tsx` (rodou como `test/screens/playlists/RegeneratePanel.capture.test.tsx`, com `TZ=America/Sao_Paulo`, pela fila). Nenhuma linha de produto tocada.

## [2026-11-22 05:32] step — F83, onda 6c: as frases dos modelos do inventário no dicionário

**Branch:** claude/f83-wave-6c-inventory-texts

- As frases em inglês que os modelos do inventário escreviam (≈ 88 lugares: `inventoryValue`, `inventoryValueRun`, `inventoryFromSeries`, `inventoryRatings`, `inventorySort`, `inventoryStatus`, `buyLinks`, e `inventoryCard.originOf`) viraram código e números nos modelos. `i18n/inventoryTexts.js` (nome e argumentos das funções iguais aos de antes) diz cada um pelo dicionário; 191 chaves novas em `i18n/en/inventory.js` e `i18n/pt/inventory.js`. Os finais com várias frases são listas de partes `{ code, ...números }`; as constantes de frase saíram dos modelos. «Data provided by Discogs.» é o único texto que um modelo guarda e fica em inglês nos dois idiomas.
- Consumidores trocados (só o `import` e as chamadas das opções): `Filters`, `Totals`, `Notices`, `CardValue`, `ItemCard`, `Header`, `phone/Sheets`, `phone/PhoneRow`, `BuyLinks`, `ValueSection`, `AlbumWindow`, `InventoryController`, `InventoryValues`.
- Testes: `test/models/inventoryModelsGiveCodes.test.js` (25; 21 falham contra o pai 6622654), `test/i18n/inventoryTexts.test.js` (inglês palavra por palavra e português), um caso novo em `Inventory.texts.test.tsx`; os testes dos modelos passam a perguntar a camada de texto pelas frases (as mesmas asserções em inglês). Os dourados da 6a e da 6b passam SEM recaptura.
- Português (proposta, espera o dono): «Desejos» no lugar de «Lista de desejos» como rótulo de status, porque o selo do cabeçalho estourava a 393 px.
- Peso: o script principal foi de 213.079 B para 214.274 B (+1.195 B, o inglês das 191 chaves); o que vem depois da primeira tela, de 213.896 B para 214.626 B. Tetos: `main` 214.418 B, `background` 55.500 B, com o motivo escrito em `scripts/bundle-budget.json`.

## [2026-11-22 05:25] step — F83, os mapas das ondas 7 (Blend) e 8 (o fecho)

**Branch:** claude/f83-wave-7-blend-map

- `map-wave-7-blend.md` (TASK-26): a Blend à mão em 7 arquivos e 1.815 linhas, com o painel de gerar de novo da tela de playlists. Achado: o painel não é do controlador da Blend (o mapa da onda 2 e `BRIDGE_USES` dizem que é); ele partilha com a Blend os cartões de receita e os ingredientes. Divisão proposta: 7a as peças de receita em `ui/recipe/` e o painel (≈ 250 linhas saem, 15 casos levados), 7b a tela (≈ 1.630 linhas, ≈ 21 casos); os dourados a capturar antes; 15 defeitos que ficam; oito perguntas com recomendação.
- `map-wave-8-closure.md` (TASK-28, TASK-29, TASK-17): depois da onda 7 sobram 17 arquivos à mão (2.192 linhas), 2 invólucros e 3 usos de ponte; a decisão arquivo por arquivo; o controlador da sessão sem reescrever (o invólucro sai pela importação direta); o Spotify reescrito e o Apple Music mudado de lugar com a prova de chamadas ao MusicKit e a exportação de verdade pelo dono; manter o roteador da casa (nota no plano); a TASK-17 dentro do relatório do fecho; a lista do «feito» e o que a publicação em produção verifica; a ordem 8a a 8d.
- TASK-26 marcada. Nenhuma linha de produto.

## [2026-11-22 05:10] step — F83, onda 6b: a prova no navegador e os totais

**Branch:** claude/f83-wave-6b-inventory-windows

- Totais na ponta, pela fila: suíte inteira 365 arquivos, 4.814 testes, todos verdes (inclui `test/architecture` com 42 arquivos e `noSecretsInRepo`); `typecheck` sem erro; `lint` 0 erros e os mesmos 68 avisos; build dentro do teto.
- Prova no navegador (`reports/evidence/F83/wave-6b/proof.md`): Chromium 1280, 900, 899, 393 e WebKit 1280, iPhone 14 e SE sobre o site construído; tudo igual menos a figura da folha de adicionar no celular (também de antiga contra antiga, causa não localizada) e o botão «Close» que a folha do celular não desenha (limite do roteiro).


## [2026-11-22 04:59] step — F83, onda 6b: o peso, os testes de sair e as notas (TASK-23c feita)

**Branch:** claude/f83-wave-6b-inventory-windows

- O peso (`reports/evidence/F83/wave-6b/bundle-budget-wave-6b.txt`, build sem as chaves, pela fila): script principal 213.079 B contra 211.698 B depois da 6a (+1.381 B: os textos em inglês das janelas, ≈ 120 chaves; o inglês fica sempre no script principal), teto de 211.842 B para 213.223 B (o medido mais 144 B das chaves); o arquivo da janela do álbum 4.859 B (`openAlbumWindow-*.js`), o das janelas do inventário 4.155 B (`inventoryWindows-*.js`), `AddWindow` 775 B, `EditWindow` 697 B; o arquivo da tela de álbuns 25.232 B (a tabela de faixas entrou nele) e o do inventário 22.227 B, os dois abaixo do alarme de 30.000 B, que NÃO subiu; depois da primeira tela 213.896 B contra 212.976 B, `background` de 51.300 B para 53.600 B (a necessidade medida é 53.538 B). `reactVendor` igual (68.691 B).
- `test/ui/albumWindow/AlbumWindow.leave.test.tsx` (3 casos: a camada fecha todas, a rota do inventário fecha no `dispose`, uma janela fechada pelo próprio botão não fecha de novo); `test/services/usage/eventsOfLinksFiltersAndAccount.test.js` passa a ler os links de «Where to buy» da janela em React.
- `tasks.md` (TASK-23c feita, linha 6b em TASK-25) e `wave-lessons.md` (seção 16) em dia; `leave-proof.mjs` (a janela do álbum à mão fica sobre a tela seguinte, a em React sai com a tela: provado no site construído, Chromium).


## [2026-11-22 04:47] step — F83, onda 6b: as janelas do álbum, de editar e de adicionar em React (TASK-23c)

**Branch:** claude/f83-wave-6b-inventory-windows

- As janelas em React (TASK-23c): `ui/albumWindow/` (`AlbumWindow.tsx`, `openAlbumWindow.tsx`, `sources.ts`), `ui/tracks/` (`TracksTable.tsx`, `TracksTabs.tsx`, `TracksComparison.tsx`), `ui/inventoryItem/` (`ItemForm.tsx` partilhado, `EditWindow.tsx`, `AddWindow.tsx`, `ValueSection.tsx`, `BuyLinks.tsx`, `money.ts`, `inventoryWindows.tsx`) e `ui/windowLayer.tsx` (as janelas pedidas de código que não é componente, fechadas quando a tela sai). As janelas ficam em `ui/` e não em `screens/` porque o `lazyOnlyAtTheRoute` só deixa `import()` de `screens/` no `app.js`; a janela de adicionar recebe `add` (o serviço do inventário) de quem a abre.
- O cartão aberto de álbuns usa `ui/tracks/TracksTable.tsx` (mesmo estado de ordem); a comparação da janela continua ordenando na mão (duas ordens que continuam duas).
- Saem por `git rm`: `components/ViewAlbumModal.js`, `InventoryValueSection.js`, `albumWindowSources.js`, `ranking/{TracksRankingComparison,TracksTable,TracksTabs}.js`, `InventoryEditModal.js`, `InventoryAddModal.js` (1.698 linhas, 8 arquivos), `react-bridge/legacy/TracksTable.tsx` e `AlbumWindows.ts`; a lista `BRIDGE_USES` perde `AlbumCard.tsx`, `albumActions.ts` e `inventoryActions.ts`; `handMadeScreensBaseline` de 32 para 24 arquivos; `complexityAllowlist` perde `InventoryEditModal.js:open` e `TracksTable.js:renderRow`.
- Muda de propósito: a janela do álbum FECHA quando a tela sai (a antiga ficava sobre a próxima); `closeAllWindows()` no `dispose` das duas telas.
- Defeitos de hoje mantidos (e gravados no dourado): dois avisos de sucesso ao editar; BRL inventada para item sem moeda; «Add to Inventory» apertável duas vezes; «Paid» com «$» para EUR e GBP; sem Escape nem fundo em editar e adicionar; sem foco nas janelas; o foco que cai para a página depois de apertar uma aba ou uma coluna e depois de a linha do valor ser refeita no celular.
- Testes: `test/ui/albumWindow/AlbumWindow.sameAsBefore.test.tsx` (os 40 cenários do dourado contra a janela em React, mais 4 casos que provam que o teste acusa uma palavra, uma classe e uma chamada trocadas de propósito); os 27 casos das janelas e das tabelas levados com a mesma asserção (`test/ui/albumWindow/*`, `test/ui/tracks/*`); os 21 casos da janela que estavam em `Inventory.{statusAndSeries,values,lowestForSale}` passam sem mudar a asserção; as pedidas de janela dos testes de álbuns e de inventário agora trocam `openAlbumWindow`, `inventoryWindows` e `AddWindow` por falsos.
- O dourado foi recapturado uma vez, ainda das janelas à mão e antes de apagá-las, com o `normalize` melhorado (o espaço entre o estado de um campo e a tag seguinte não é desenhado).
- Textos: ≈ 120 chaves em `i18n/en/{ui,inventory,albums}.js` e as propostas em português em `i18n/pt/` (pendentes da aprovação do dono).


## [2026-11-22 04:28] step — F83, onda 6b: o dourado das janelas, capturado das janelas à mão

**Branch:** claude/f83-wave-6b-inventory-windows

- O dourado das janelas, capturado das janelas à mão ANTES de tocá-las: `test/support/albumWindowScenarios.js` (40 cenários: a janela do álbum aberta pela tela de álbuns e pelo inventário, as fontes, o fechar por ✕, «Close», fundo e Escape, a tabela de faixas por coluna nos dois sentidos, as abas do celular, a barra e o título do celular, cada corpo da seção de valor, escrever, Enter, voltar ao valor do Discogs, ler agora, «Where to buy», editar, adicionar), `albumWindowStandIns.js` (o mundo de fora, com as chamadas anotadas) e `test/fixtures/albumWindowBeforeF83.json` (1,3 MB; as páginas, o foco e todas as chamadas).
- O registro da captura: `reports/evidence/F83/wave-6b/capture-before.test.js` (rodou de `test/components/`, com `TZ=America/Sao_Paulo`, sobre o ramo da 6a; o arquivo temporário foi para `_backups/`).
- Os defeitos de hoje ficam gravados no dourado de propósito (dois avisos de sucesso ao editar, BRL inventada, «Add to Inventory» apertável duas vezes, «Paid» com «$» para EUR e GBP).


## [2026-11-22 04:21] step — F83, onda 6a: a prova no navegador, os totais e as lições (a tela do inventário em React)

**Branch:** claude/f83-wave-6a-inventory-screen

- Prova no site construído (`reports/evidence/F83/wave-6a/proof.md`, roteiro `browser-proof.mjs`): a tela em React contra a à mão do pai (12f0234), Firebase bloqueado, os itens postos por uma linha no fim do script principal (a costura, igual nos dois sites). No celular (WebKit iPhone 14 e SE, Chromium 393 e 899): 55 de 55 comparações iguais, 0 pixels, com toques de verdade nas seis folhas; antiga contra antiga também 55 de 55. No computador (Chromium 1280 e 900, WebKit 1280): iguais em texto, caixas e foco; sobras de pixels: a busca digitada (o cursor piscando, também de antiga contra antiga), 8 pixels de 1 nível no Vinyl e na ordem, e **62 e 29 pixels na lista, só no Chromium, sem causa achada** (dito no `proof.md`). Os valores do Discogs não entram na prova do navegador (só no dourado).
- `wave-lessons.md` (seção 15) e `tasks.md` (TASK-25, 6a) em dia.
- Totais na ponta, pela fila: suíte inteira 363 arquivos, 4.767 testes, todos verdes (inclui `test/architecture` com 43 arquivos e `noSecretsInRepo`); `typecheck` sem erro; `lint` 0 erros e 68 avisos (os de antes); build dentro do teto (script principal 211.698 B, arquivo da tela 21.503 B, React 68.691 B). O worktree do pai para comparar ficou em `scratchpad/f83-6a/parent` (a trava recusou removê-lo).

## [2026-11-22 04:04] step — F83, onda 6a: a tela do inventário em React (TASK-25)

**Branch:** claude/f83-wave-6a-inventory-screen

- A tela do inventário (`/inventory`) passa a ser em React: `screens/inventory/` (a rota, a ponte do controlador, o cabeçalho, os totais e a moeda, os avisos, a linha de filtros, os três botões da coleção, a grade, a lista, o cartão com as cinco linhas, o seletor de status e, no celular, a barra, as linhas, a galeria, os dois vazios, os fantasmas, «Show 50 more» e as seis folhas). O controlador (`InventoryController`) e `InventoryValues` ficam em JavaScript por baixo, com a mesma lógica; a `view` que eles recebem é a ponte (`InventoryBridge`), que só conta os avisos. A rota é sob demanda (`loadScreen`) e entra na lista do segundo plano; o controlador nasce no `prepare` da rota (nunca num efeito) e as duas assinaturas (a loja do inventário e a virada do celular) vão de `prepare` a `dispose`.
- A armadilha da assinatura: o `app.js` passa a importar `services/inventory/inventoryWiring.js` por conta própria (uma linha, no topo), para que o inventário continue sendo lido quando a pessoa entra, não quando a tela abre. Teste vermelho antes (`Inventory.signedInBeforeOpening.test.tsx`: sem a linha, a pessoa que entrou antes vê o inventário vazio) e a linha no `app.js` verificada por um segundo teste.
- Saem (git rm; `_safe.py retire` recusa arquivo versionado): `views/InventoryView.js`, `InventoryPhoneSheets.js`, os cinco `views/renderers/Inventory*.js`, `components/ui/Card.js`, `components/Breadcrumb.js` e `utils/keepField.js` (2.078 linhas contadas na lista, 9 arquivos). `handMadeScreensBaseline` de 41 para 32 arquivos (a 6b tira mais 8), `Card.js:renderRankingBadge` sai da `complexityAllowlist`, entra `screens/inventory/inventoryActions.ts` em `BRIDGE_USES` (a janela do álbum e a de editar seguem à mão até a 6b; `react-bridge/legacy/AlbumWindows.ts` ganha `openInventoryView` e `openInventoryEdit`).
- Regras puras dos desenhistas em `models/inventoryCard.js` (`formatOf`, `phoneProgress`, `moreOf`, `totalText`, ...); `ui/Breadcrumb.tsx` ganha `inventoryTrail()` (um passo, não desenha nada, como a antiga); `ui/CoverImage.tsx` ganha `decoding`; o gancho do foco ganha `letGo` (os selects de formato e de ordem soltam o foco, como a antiga, que os refazia).
- Textos: 129 chaves em `i18n/en/inventory.js` e `i18n/pt/inventory.js` (as dos desenhistas, das folhas e as frases do controlador e de `InventoryValues`; as frases dos modelos ficam em inglês até a 6c). O português é proposta, espera o dono.
- Provas: o teste «igual ao de antes» (`Inventory.sameAsBefore.test.tsx`, 45 cenários contra `inventoryBeforeF83.json`, mais 4 provas de que ele acusa uma palavra, uma classe, um foco e uma chamada trocados de propósito), os 7 arquivos de testes da tela à mão levados com a mesma asserção (andaime `inventoryHost.tsx`), `Inventory.leave`, `Inventory.texts`, `Inventory.signedInBeforeOpening`, e os testes de outros arquivos que tocavam a tela antiga (`outsideTextIsText`, `outsideUrlIsChecked`, `Shell.carried`, `coverImage`, `eventsOfLinksFiltersAndAccount`).
- Peso (`reports/evidence/F83/wave-6a/bundle-budget-wave-6a.txt`): script principal 235.748 B -> 211.698 B (o teto desce para 211.842 B); arquivo da tela 21.503 B (abaixo do alarme de 30.000 B, não precisou separar as folhas); o que vem depois da primeira tela 187.136 B -> 212.976 B, e `background` sobe de 49.500 B para 51.300 B (a necessidade medida é 51.237 B).
- Defeitos de hoje mantidos (a migração não conserta nada): o vazio enquanto a leitura não volta, o ícone `Eye` que não existe (o botão «View» do cartão sai sem ícone), «Paid» com «$» para EUR e GBP (na janela, que é da 6b), o aviso do Discogs que fica ligado depois de sair do inventário.

## [2026-11-22 04:04] step — F83: as provas da terceira junta leem a chave web do ambiente

**Branch:** claude/f83-wave-6a-inventory-screen

- Os dois roteiros de prova da terceira junta (`reports/evidence/F83/sync-3/account-probe.mjs` e `browser-proof.mjs`) traziam a chave web do Firebase escrita; passam a ler `process.env.FIREBASE_WEB_API_KEY` (a mesma troca da linha de integração). `test/security/noSecretsInRepo.test.js` volta a ficar verde.

## [2026-11-22 04:03] step — F83: a chave pública do Firebase sai dos dois roteiros de prova da sincronização 3

**Branch:** integrate/staging-2026-11-21

- O teste `test/security/noSecretsInRepo.test.js` barrou a publicação da prévia: `account-probe.mjs` e `browser-proof.mjs` (em `reports/evidence/F83/sync-3/`) traziam a chave de web do Firebase escrita. É a chave pública do app (a que vai no site), mas a regra do repositório não aceita nenhuma escrita; agora os roteiros a leem de `FIREBASE_WEB_API_KEY`.

## [2026-11-22 03:58] review — F83: o juiz independente passou a sincronização 3 (a Start enxuta no celular, em React)

**Branch:** integrate/staging-2026-11-21

- Veredito: passa (0 P0, 0 P1, 1 P2), julgado na `12f0234` contra a `main` na `b8947e0`, nos sites construídos; relatório guardado como veio em `reports/audits/2026-11-22-mjrpalbumblender-v0-react-start-lean-visual-parity-recheck.md`.
- UAT-282 confirmado: em WebKit, o clique em «Search» com o campo em foco não busca na `main` e busca em React.
- P2: o roteiro de prova do construtor refaz a foto quando a diferença é pequena; pode esconder uma mudança fraca.

## [2026-11-22 03:35] step — F83, onda 6a: o dourado da tela do inventário, capturado da tela à mão antes de tocá-la

**Branch:** claude/f83-wave-6a-inventory-screen

- 45 cenários (30 no computador, 15 no celular: lista, galeria, fantasmas, os dois vazios, a barra, «Show 50 more», as seis folhas, a rodada de valores, virar computador e celular) escritos em `test/support/inventoryScenarios.js` e `test/support/inventoryStandIns.js` (o serviço, os valores do Discogs, o aviso, a pergunta, o carregador e as duas janelas à mão são de mentira e anotam cada chamada), 152 retratos em `test/fixtures/inventoryBeforeF83.json` (o `#app`, a Folha aberta, o foco e as chamadas), com `TZ=America/Sao_Paulo` e o relógio fixo; o mesmo arquivo, rodado duas vezes, dá o mesmo resumo (md5).
- O registro da captura: `reports/evidence/F83/wave-6a/capture-before.test.js` (rodou de `test/views/` contra a tela à mão e foi tirado de lá).
- Nada de produto mudou neste passo.

## [2026-11-22 03:27] step — F83, terceira junta: a prova no navegador, o teto de peso e os totais (a Start enxuta em React)

**Branch:** claude/f83-sync-3-start-lean

- Prova no site construído, WebKit com perfil de iPhone, `main` (à mão) contra a linha do React: 393x852 e 375x667, visitante e conta, 45 comparações por rodada (pixels, texto visível, caixas, folga de baixo, foco): 0 pixels de diferença em todos os estados, menos duas sobras de no máximo 2 de 255 numa primeira rodada a 375 (a mesma sobra que `main` contra `main` mostra; a rodada seguinte, 0). O computador a 1280, contra o pai (b143b4f) e contra a `main`, WebKit e Chromium: 31 de 31. Detalhes em `reports/evidence/F83/sync-3/proof.md`.
- Diferença de propósito, no sentido de melhor: um clique em «Search» com o campo em foco inicia a busca no React e NÃO na `main` no WebKit (é o UAT-282: a mão reescreve o texto do botão entre o apertar e o soltar). Não corrigido na `main` por este passo.
- O teto de peso subiu: script principal 235.839 B → 235.892 B (medido 235.748 B + 144 B das chaves); `background` 49.000 B → 49.500 B (a soma do script principal e do que vem depois estourava o teto por 447 B). Números em `reports/evidence/F83/sync-3/bundle-budget-sync-3.txt` e a razão em `scripts/bundle-budget.json`.
- `docs/specs/features/F83-site-screens-in-react/wave-lessons.md` (seção 14) e `tasks.md` (TASK-35) em dia.
- Totais na ponta, pela fila: suíte inteira 361 arquivos, 4.695 testes, todos verdes; `test/architecture` 42 arquivos, 341 testes; `typecheck` sem erro; `lint` 0 erros e 68 avisos (os de antes); build dentro do teto (script principal 235.748 B, React 68.691 B, o que vem depois 187.136 B). `doctor` vermelho desde a base (521 erros: links de `docs/archive`, MEMORY.md, constitution, quadro da F89), nenhum de arquivo desta junta.

## [2026-11-22 02:58] review — F83: o juiz independente passou a sincronização 2 (exportar pela tela das séries de playlists, em React)

**Branch:** integrate/staging-2026-11-21

- Veredito: passa (0 P0, 0 P1, 3 P2), julgado na `693cb97` contra a `main` na `9ff2141`, nos sites construídos; relatório guardado como veio em `reports/audits/2026-11-22-mjrpalbumblender-v0-react-export-and-inventory-visual-parity-recheck.md`.
- P2: dois desvios de pintura que o olho não vê; o teto do que baixa depois da primeira tela ficou com 23 B de folga.
- Não visto: MusicKit e Spotify reais, arrasto com o dedo, Safari num aparelho real.

## [2026-11-22 02:55] step — F83, terceira junta: a Start enxuta no celular portada para a tela Start em React (UAT-281)

**Branch:** claude/f83-sync-3-start-lean

- A tela Start em React passa a ser a Start enxuta no celular (F79, UAT-281), igual à da `main` (b8947e0) até 899 px; no computador nada muda (a única diferença no HTML é o botão «What is a series?», que a `main` também tem e que o CSS esconde no computador).
- Teste vermelho antes: `Start.lean.phone.test.js` (os 7 casos de `HomeLean.phone.test.js` da `main`, com o andaime `startHarness`, mais o da última capa tirada e o dos três passos) e os três testes de `homeSeries.test.js` falhavam; `Start.phone.test.js` (da `main`) também.
- Código: `barShows`, `guestNoticeShows`, `phoneHintLink` em `screens/start/homeSeries.ts`; `Stage.tsx` (o link «What is a series?» que abre a frase na Folha de baixo, o campo «Type an artist», o único link sob o campo, o aviso do visitante só com álbum); `Dock.tsx` (sem barra antes da primeira capa; a faixa de Desfazer fica, com `is-barless`); `Start.tsx` (`is-barless` na página). Os três passos e o título de 26 px são do CSS da `main`, que entrou na junta.
- Textos novos (4, no dicionário): `start.field.placeholderPhone`, `start.hint.phone.paste`, `start.hint.phone.artist`, `start.what.link`; o português é PROPOSTO PELO AGENTE e espera a aprovação do MJRP («Digite um artista», «ou cole uma lista», «Buscar um artista», «O que é uma série?»). O botão de fechar da Folha usa `ui.window.close`.
- Dourado: `test/fixtures/startFromMainLean.json` (33 cenários, capturados da `main` à mão em b8947e0; 30 do mapa antigo recapturados, 3 novos do celular: digitar e o link único, não achado, «What is a series?») no lugar de `startBeforeF83.json`; o registro da captura está em `reports/evidence/F83/sync-3/capture-start-from-main.test.js`. Os retratos do computador diferem do dourado antigo só pelo botão escondido. O teste «igual ao de antes» acusa uma letra trocada de propósito («or paste a lst»).

## [2026-11-22 02:51] step — F83, terceira junta: a main (b8947e0, a Start enxuta no celular) juntada à linha do React

**Branch:** claude/f83-sync-3-start-lean

- Conflitos: `HomeDock.js`, `HomeController.js`, `homeSeries.js` e `HomeView.js` (as telas à mão que a onda 4 já apagou) ficam apagados; o que a `main` mudou neles (diff contra `9ff2141`) é portado no passo seguinte, com teste vermelho antes. `test/screens/start/homeSeries.test.js`: os imports da linha do React mais os três testes novos (`barShows`, `guestNoticeShows`, `phoneHintLink`). `docs/log.md`, `docs/specs/uat.md`, os CSS do celular e da home entraram sem conflito.
- `test/components/home/HomeLean.phone.test.js` (da `main`) foi movido para `test/screens/start/Start.lean.phone.test.js`, ainda com o andaime à mão; o porte para a tela em React é o passo seguinte.

## [2026-11-22 02:45] step — publicado em produção: a tela Start enxuta no celular (F79, UAT-281), da `d03008a`

**Branch:** main

- Com a palavra dele («2. Publica»). Conferido no ar: o texto «Type an artist» está nos arquivos servidos pelo site. Volta: histórico de versões do Firebase Hosting.
- Na migração: a sincronização 1 (menu novo em React) entrou na linha `integrate/staging-2026-11-21` (`a488bca`) e foi à prévia `staging`; a sincronização 2 (exportar em React) está com o juiz; o mapa da onda 6 (inventário) em curso. Falta levar a Start enxuta à tela Start em React.

## [2026-11-22 02:41] decision — Start no celular: o campo diz «Type an artist»; publicar (F79, UAT-281)

**Branch:** main

- MJRP: «2 vamos com sua recomendação» (os três passos saem de vez do celular); «1.type» (o texto de dentro do campo: «Type an artist», no lugar de «An artist»); «2. Publica».
- Mudança de uma linha em `public/js/views/HomeView.js`, feita depois do juiz independente; o teste do campo acompanha.

## [2026-11-22 01:58] step — F83 onda 6: o mapa da tela do inventário (TASK-24), com a parte da TASK-23c; a onda não foi construída
**Branch:** claude/f83-wave-6-inventory
O mapa (map-wave-6-inventory.md), escrito sobre a ponta da segunda junta (88e6b60): 18 arquivos e 3.891 linhas à mão (a tela, as folhas do celular, os desenhistas, `Card.js`, a janela do álbum com a seção de valor, a tabela de faixas e a comparação, editar e adicionar), o controlador e `InventoryValues` ficam em JavaScript. Achados: o `inventoryWiring` assina quem entrou no momento em que é carregado, então a tela sob demanda sem uma linha no `app.js` deixaria o inventário vazio; o carregando nunca é pintado e a tela mostra o vazio enquanto a leitura não volta (defeito mantido); o ícone `Eye` do cartão não existe; as janelas de editar e adicionar não têm teste. Proposta: 6a a tela (≈ 97 casos levados, ≈ 45 cenários dourados), 6b as janelas e a TASK-23c (≈ 48 casos, ≈ 40 cenários; saem os invólucros `TracksTable.tsx` e `AlbumWindows.ts`), 6c as frases dos modelos no dicionário; o controlador da sessão em TypeScript fica para a onda 8. Oito perguntas com recomendação, para o orquestrador. Sem código de produto.

## [2026-11-22 01:46] step — F83, segunda junta: os totais na ponta do ramo, pela fila
**Branch:** claude/f83-sync-2-export-and-inventory-changes
Medidos sobre 693cb97, a ponta do código (o commit depois dele só escreve este registro), pela fila da máquina (`machine_load.py run --label f83s2-final2`). Suíte inteira: 360 arquivos, 4.680 testes, todos passam (4.536 na ponta da primeira junta; os 144 a mais são os 43 da janela e do passo da pasta portados da `main`, os 15 + 19 + 14 + 1 dos cenários «igual ao de antes» novos ou recapturados e os de exportar da tela de playlists guardadas, mais os da ponte do arrastar e do foco). `test/architecture`: 42 arquivos, 341 testes. `typecheck` (`tsc -p tsconfig.json`): sem erro. `lint` (`eslint .`): 0 erros, 68 avisos (os avisos de `process` não definido dos roteiros, os mesmos de antes). `vite build` + `scripts/bundle-budget.mjs`: dentro do teto; script principal 235.695 B (teto 235.839 B), React 68.691 B (teto 72.000 B), a janela de exportar 6.428 B sob demanda, depois da primeira tela 186.719 B, primeira tela 327.641 B (teto 337.839 B). Servidores que subiram (desenvolvimento e `vite preview`, das duas árvores) parados; sobraram na área de rascunho, para quem quiser conferir, o worktree da `main` (`…/scratchpad/main-ref`) e o do commit da junta (`…/scratchpad/merge-tip`).

## [2026-11-22 01:43] step — F83, segunda junta: dois testes da tela de playlists guardadas apertavam o primeiro botão da linha, que agora é «Exportar»
**Branch:** claude/f83-sync-2-export-and-inventory-changes
A suíte inteira na ponta de 4fbaf8e achou dois testes que abriam a janela da playlist pelo primeiro botão de `.playlist-row-buttons` (o «Ver detalhes»): com a F90 o primeiro é «Exportar» e o «Ver detalhes» é o último, como na `main`. `SavedPlaylists.test.tsx` («the Eye button opens the window of the playlist») e `SavedPlaylists.texts.test.tsx` (a leitura em português) apertam agora o `button:last-child`; as asserções não mudaram. Nada na tela mudou: era o andaime do teste.

## [2026-11-22 01:39] step — F83, segunda junta: o teto do script principal é o valor medido do build final mais as chaves
**Branch:** claude/f83-sync-2-export-and-inventory-changes
O build final (depois do último conserto do passo da pasta) mediu o script principal em 235.695 B sem as chaves (`main-C_XDfcyX.js`), 7 B menos que o medido antes; o teto, que só sobe pelo que se mede, ficou em 235.839 B (o medido mais os 144 B das chaves) em vez de 235.846 B, e os números do texto do teto, das lições e do registro foram acertados (+2.249 B contra os 233.446 B da primeira junta: 1.997 B da `main` e 252 B do porte; depois da primeira tela 186.719 B; a janela de exportar 6.428 B sob demanda). `reports/evidence/F83/sync-2/bundle-budget-sync-2.txt` é o do build final e do commit da junta sozinho.

## [2026-11-22 01:38] step — F83, segunda junta: a prova no navegador da janela de exportar, das duas telas e do inventário dentro da moldura em React
**Branch:** claude/f83-sync-2-export-and-inventory-changes
Roteiro em `reports/evidence/F83/sync-2/` (`browser-proof.mjs`, `inventory-proof.mjs`, `safari-drop/`; os resultados em `raw/`, os recortes em `captures/` e `captures-inventory/`, 2,6 MB no total). **Do que se trata**: a `main` (a janela escrita à mão, no servidor de desenvolvimento ou no site construído com `vite preview`) e este ramo (React), lado a lado, com o Firebase Auth e o Firestore bloqueados, o MusicKit trocado por um roteiro de mentira que o teste responde (a biblioteca com pastas, sem nenhuma, ou que falha ao ler) e que escreve tudo que lhe pedem em `window.__apple.calls`; nenhuma chamada real ao Apple Music ou ao Spotify, nada lido ou escrito num banco. Depois de cada passo se compara: o DOM da janela (um campo pelo estado), o foco, os avisos, **o que o MusicKit foi chamado a fazer** e os pixels da janela. **Resultado, no código final**: tela de edição, Chromium a 1280 e WebKit com iPhone 14, no desenvolvimento e **no site construído**, mais o Safari no computador (WebKit a 1280) no site construído: 85 passos de 85 em cada, com a janela, o passo da pasta nos três estados da biblioteca, o nome novo vazio e escrito, «sem pasta», o que foi lembrado, Voltar, Escape e o foco; tela de playlists guardadas (só no desenvolvimento: a loja dela é um módulo e o site construído não a expõe, com o Firestore bloqueado não há série): 73 de 73 no Chromium e no WebKit do computador, 89 de 89 no WebKit com iPhone 14. O controle de ruído, `main` contra `main`, deu o mesmo: 0 pixels de diferença em todos os passos e as mesmas chamadas ao MusicKit (a única sobra nos controles do site construído, 6 «erros de página», é o trabalhador da busca pedindo um arquivo que o `vite preview` não serve, igual nos dois lados e filtrado no roteiro depois). **O que o roteiro achou** (e que o teste de jsdom não via; todos consertados, ver a entrada anterior e esta): a leitura das pastas em dobro no modo estrito; o foco que o botão «Exportar» da barra perdia no WebKit com iPhone depois do Escape; e, no Safari do computador, o passo da pasta devolvia o foco a uma escolha depois de um clique que o Safari deixa na página (o conserto: só depois da leitura terminar, como a antiga escrevia a lista uma vez só). **Uma diferença de propósito que ficou**: depois de apertar «Exportar» o botão de React guarda o foco e o da antiga o largava para a página (Chromium). **O inventário** (à mão, com a galeria no celular da F89, os valores guardados e a origem em duas linhas da F75), desenhado dentro da moldura em React contra o desenhado na `main`: a 393 (WebKit, iPhone 14, a lista e a galeria), a 820 e a 1280 (Chromium): o DOM de `#app` igual em todos e 0 pixels de diferença na página, menos a 820 px, com 47 pixels (de 27 em 255, no mesmo retângulo) que aparecem **igualmente de `main` contra `main`** (ruído). Uma ressalva: o inventário foi posto na loja com itens e leituras do Discogs de teste; os valores do Discogs, que vêm do banco, não aparecem (o roteiro bloqueia o Firestore), então o desenho dos valores guardados em si é o das provas da própria F75, aqui só se mostra que a moldura nova o desenha como a antiga. **O que não dá para provar sem conta**: o MusicKit de verdade (o token de desenvolvedor vem do servidor e a lista de pastas pede a biblioteca da pessoa), o Spotify (nem é tocado), a exportação que cria playlist de fato.

## [2026-11-22 01:36] step — UAT-282: no WebKit, tocar em «Search» na tela Start pode não iniciar a busca

**Branch:** main

- Achado do juiz independente, fora da mudança julgada; vale no ramo e na `main`. Não confirmado num iPhone real.

## [2026-11-22 01:36] review — F79: o juiz independente passou a tela Start enxuta no celular (UAT-281)

**Branch:** fix/f79-start-lean-on-the-phone

- Veredito: passa (0 P0, 0 P1, 1 P2), julgado na `0736e18`, no site construído, em WebKit com perfil de iPhone; relatório guardado como veio em `reports/audits/2026-11-22-mjrpalbumblender-v0-start-lean-phone-visual-parity-recheck.md`.
- P2: ao fechar «What is a series?» aberto por toque, o foco não volta ao link (o Safari não foca botão no toque).
- Visto fora desta mudança, nos dois lados: em WebKit, tocar em «Search» depois de digitar não inicia a busca (Enter funciona); a conferir num iPhone real.
- Não visto: iPhone real, catálogo e conta reais, o estado «série salva».

## [2026-11-22 01:18] step — F83, segunda junta: o que a prova no navegador achou na janela de exportar e na tela de edição, consertado
**Branch:** claude/f83-sync-2-export-and-inventory-changes
Três achados do roteiro no navegador (Chromium a 1280, WebKit com iPhone 14, servidores de desenvolvimento e site construído), cada um com teste antes ou depois do conserto: (1) o modo estrito do desenvolvimento rodava o efeito do passo da pasta duas vezes e o Apple Music era perguntado duas vezes (`MusicKit` visto pelo roteiro de mentira: duas chamadas contra uma na `main`): a leitura das pastas guarda a promessa numa `ref` (`ui/AppleFolderStep.tsx`); (2) `ui/` não pode importar lojas (`reactStaysAtTheEdge`, o teste de arquitetura acusou): o nome da série aberta, que é a pasta padrão numa exportação da tela de edição, entra por `usePlaylistExport({ seriesName })` e a tela o dá (`screens/playlists/activeSeries.ts`); (3) no WebKit com iPhone, fechar a janela de exportar com Escape devolvia o foco ao botão «Exportar» da barra e logo o gancho do foco da tela de playlists o soltava (a tela desenhava de novo porque a folha fechou; a antiga só redesenhava quando uma loja avisava): `useFocusLikeAfterAnewDraw({ after })` com o número de avisos das lojas, da bandeira de gerar e do celular, como a tela de álbuns já fazia (teste novo, vermelho antes: `Playlists.test.tsx`, «gives the focus back to the «Export» of the bar»). Também: a pausa do Safari só vale para um arrasto nativo (`isNativeDrag`: `dragend`/`drop`), o que deixou os testes dourados da janela de classificar como estavam (uma lista com `pointer-events: none` por 1,5 s depois de um arrasto simulado mostrava no DOM). O teto de peso: o script principal medido em 235.695 B sem as chaves (233.446 B depois da primeira junta; 235.443 B no commit da junta sozinho, então +1.997 B da `main` e +259 B do porte); o teto subiu para 235.839 B e o `background` para 49.000 B, com a conta em `scripts/bundle-budget.json` e em `reports/evidence/F83/sync-2/bundle-budget-sync-2.txt`. Os baselines do sensor de telas à mão: `InventoryPhoneTile.js` (novo, F89) entra, `SpotifyExportModal.js` e `PlaylistsExport.js` ganham as linhas que a F90 deu (434 para 461, 116 para 142), com o motivo escrito no arquivo; nada foi folgado sem dizer. TASK-34 no `tasks.md` da F83 e a seção 13 do `wave-lessons.md`. **A TASK-08 da F90 não foi marcada**: marcar a tarefa moveria a F90 de Draft para In Progress (o status derivado) e o gancho do commit recusou, com estas palavras: «a F90 não está na «Priorizada»: o humano a arrasta no board»; a tarefa fica feita no código e provada, e a marca fica para quem integrar a F90.

## [2026-11-22 01:09] review — F83: o juiz independente passou a sincronização com a main e o menu novo em React

**Branch:** integrate/staging-2026-11-21

- Veredito: passa (0 P0, 1 P1, 3 P2), julgado na `5bcb82a`; relatório guardado como veio em `reports/audits/2026-11-22-mjrpalbumblender-v0-react-new-menu-visual-parity-recheck.md`.
- P1: o teste em jsdom e a prova do construtor dizem que o painel da conta se comporta diferente ao clicar em «Connect»; no navegador real os dois lados fazem o mesmo (o painel fica aberto até «Connected» e fecha). Corrigir o teste e a nota; manter o painel aberto é o certo, nos dois lados.
- Não visto pelo juiz: a janela do álbum, o MusicKit real, o Safari real, dados de uma pessoa com conta.

## [2026-11-22 01:08] step — F79: a tela Start enxuta no celular construída (UAT-281)
**Branch:** fix/f79-start-lean-on-the-phone
O MJRP aprovou a versão enxuta («Aprovo a versão enxuta»). Até 899 px: título de 26 px, «What is a series?» abre a frase na folha de baixo, sob o campo só «or paste a list», sem os três passos, a barra da série só com a primeira capa, o aviso de visitante só com álbuns, «An artist» no campo. Regras puras `barShows`, `guestNoticeShows`, `phoneHintLink` em `models/homeSeries.js` (testes novos); `HomeView`, `HomeDock`, `HomeController` (passa `chosen`), `css/mobile/home.css` (só dentro da consulta do celular), `.home-what` escondido no computador em `css/views/home.css`. Dois testes da base do celular atualizados ao novo comportamento. Suíte inteira: 324 arquivos, 4134 testes verdes; prova no site construído em `reports/evidence/F79/start-lean/`. O computador não muda. Não há i18n em `main`, então nenhuma tradução a acrescentar.

## [2026-11-22 01:02] decision — Start enxuta no celular aprovada (F79, UAT-281)

**Branch:** main

- MJRP, sobre a prévia (https://claude.ai/artifact/U8gE8yHna1UyPjpxujrMn3): «Aprovo a versão enxuta». Vale a coluna «Enxuta» de `design/proposals/f79-start-lean/proposal.md` (título de 26 px; não a variante de duas linhas).
- Decidido pelo agente — revisável (ele não respondeu a estas duas): os três passos saem de vez do celular; o texto de dentro do campo fica «An artist».
- Construção: no código de hoje (ramo `fix/f79-start-lean-on-the-phone`) e depois na tela Start em React. Produção só com o «publica» dele.

## [2026-11-22 00:51] step — F83: no Safari, depois de soltar a linha com o mouse na janela de classificar, o lugar antigo dela não fica mais aceso
**Branch:** claude/f83-sync-2-export-and-inventory-changes
O que o juiz da onda 5b deixou para esta linha. Achado e medido no WebKit (Playwright, motor do Safari) numa caixa só com a ponte (`react-bridge/sortableTracks.ts`) e o perfil da janela de classificar (`reports/evidence/F83/sync-2/safari-drop/`): o Safari não ouve o mouse durante um arrasto nativo; quando a ponte tira a linha da lista e a põe de volta, ele acende com `:hover` o que está sob o ponteiro **de onde o arrasto começou** (a linha que passa a ocupar o lugar antigo) e não o apaga quando o mouse segue adiante (o Chromium o apaga no movimento seguinte; a janela antiga redesenhava a lista com elementos novos e nunca mostrava isso). Antes: depois do soltar e de mover o mouse para a quarta linha, a linha do lugar antigo e a quarta ficavam com `:hover`. Conserto: `holdHover` tira a lista do caminho do ponteiro (`pointer-events: none`) enquanto a linha é posta de volta e até o primeiro movimento do mouse (ou 1,5 s, para soltar por teclado ou toque), de modo que não há o que acender no ponteiro antigo. Depois: nenhuma linha acesa depois do soltar, e só a linha sob o ponteiro depois do movimento, em WebKit e Chromium (`results.txt`, `after-drop-*.png`). Tentados antes e que não bastaram no WebKit: `pointer-events` por um quadro, `display: none` por um quadro, elementos novos a cada soltar; `forceFallback` (sem arrasto nativo) não foi guardado por mudar a sensação do arrasto no Safari. Três testes de unidade novos (`test/react-bridge/sortableTracks.test.tsx`); o `RANK_PROFILE` passou a ser exportado para a caixa. A mesma ponte serve a tela de playlists: o conserto vale para as duas.

## [2026-11-22 00:51] step — F83, segunda junta: a F90 (exportar pela tela das playlists guardadas, a pasta do Apple Music) portada para as telas em React
**Branch:** claude/f83-sync-2-export-and-inventory-changes
Tarefa TASK-08 da F90. A janela única de exportar e o passo da pasta, que na `main` são à mão (`views/playlists/PlaylistExportWindow.js`, `AppleFolderStep.js`, `appleFolderChoice.js`), foram **escritos em React**, não deixados atrás de invólucro: duas telas em React a usam e nada à mão depois deste passo. `ui/PlaylistExportWindow.tsx` (gancho `usePlaylistExport`: no computador a janela de `ui/ModalShell` com Escape, clique no fundo, Tab que não sai e o foco que volta; no celular a folha de `ui/SheetWindow`), `ui/AppleFolderStep.tsx` (a série pré-selecionada, as pastas lidas, «Nova pasta», «Sem pasta», os quatro estados, a última escolha lembrada por série, a pasta escolhida da lista segue pelo id, o progresso escrito no botão «Exportar»), `models/appleFolderChoice.js` (a memória e a escolha, movida sem mudar), os textos em `i18n/{en,pt}/exportWindow.js` e `savedPlaylists.js`. O Spotify, o arquivo e a exportação do Apple Music continuam à mão atrás de `react-bridge/legacy/OutputWindows.ts` (que ganhou o que a janela entrega a cada um e a leitura das pastas), e `ui/PlaylistExportWindow.tsx` entra em `BRIDGE_USES` no lugar de `screens/playlists/PhoneParts.tsx`. `ui/ModalShell` ganhou `closeOnBackdrop` (só a janela de exportar o pede). Na tela de playlists guardadas: «Exportar» em cada playlist do lote aberto e no lote (computador), o botão de 44 px ao lado da linha e a linha «Exportar» da folha do lote (celular), o botão que foi tocado recebe o foco de volta no celular, como na `main`; na tela de edição: o botão do Apple Music abre a janela já no passo da pasta e a barra do celular abre a janela inteira. Provas, todas escritas antes do código ou capturadas da `main`: os testes da `main` (`AppleFolderStep`, `PlaylistExportWindow`, `SavedPlaylistsView.export`) portados para os mesmos casos (43 passam; só mudou o andaime: um rádio é ouvido pelo clique, o texto pelo valor nativo); o «igual ao de antes» da janela (15 cenários, 58 passos, capturados da `main` com `reports/evidence/F83/sync-2/capture-export-from-main.test.js`) e das duas telas (`savedPlaylistsFromMain.json`, 19 cenários; `playlistsFromMain.json`, 14), cada um recapturado da `main`; mostrado que o teste acusa uma palavra («Back» virando «Go back») e uma classe (`justify-center`) postas de propósito (8 de 15 cenários falham nos dois casos). **Uma diferença de propósito**: a `main` passa `ok: true` (o resultado da escolha) junto das opções ao exportar; a janela em React não o passa (ninguém o lê). A comparação ignora essa chave nas duas pontas.

## [2026-11-22 00:37] step — F79: prévia da tela Start enxuta no celular (UAT-281), comparador publicado
**Branch:** wip/f79-start-lean-on-the-phone
O MJRP, sobre a captura da tela Start no iPhone dele: «Aqui eu ainda acho que tem muito texto, tá clutter. Como poderíamos melhorar?»; à proposta do orquestrador: «sim faça a prévia pls». Prévia (desenho, não construção) em `design/proposals/f79-start-lean/`: a tela real de `main` capturada com e sem conta, em oito estados, e a «Enxuta» aplicada por cima da mesma marcação e CSS (título 26 px, «What is a series?» numa folha, só «or paste a list» sob o campo, sem os passos no celular, a barra da série só com a primeira capa). Primeira tela: 84 palavras hoje (104 sem conta) contra 16. Uma variante (título em duas linhas). Crítica separada (agente Opus, `mjrp-critiquing-ux-ui`): passa, sem P0; os 2 P1 consertados. Comparador: https://claude.ai/artifact/U8gE8yHna1UyPjpxujrMn3. Pendente da escolha do MJRP (três perguntas em `proposal.md`).

## [2026-11-22 00:23] step — F83, segunda junta com a `main` (F89, F75 guardado, F90, a abertura da home em português): a junta feita
**Branch:** claude/f83-sync-2-export-and-inventory-changes
Juntada a `main` (9ff2141) no ramo da primeira junta (5f3fd50). Conflitos: nove arquivos à mão que as ondas 1 e 2 já tinham trocado por peças em React (`components/playlists/Saved{PlaylistActions,PlaylistCard,PlaylistRow,PlaylistsPhone,SeriesGroup}.js`, `views/PlaylistsView.js`, `views/SavedPlaylistsView.js`, `views/playlists/phonePlaylistActions.js`, `test/components/playlists/PhonePlaylists.test.js`): apagados de novo, sem ressuscitar; o que a F90 mudou neles (o botão de exportar de cada lista e do lote, o de «Export» da linha do celular, a folha do lote, a janela única de exportar) será portado para `screens/saved-playlists/` e `screens/playlists/` na etapa seguinte, com teste vermelho antes. `views/playlists/PlaylistsExport.js` (conflito de conteúdo: a junta anterior tinha `onStatus`, a F90 tem lista, série, lote, posições e pasta) ficou com as duas opções. O inventário (F89, F75), os serviços do Apple Music e do MusicKit, o CSS, os documentos (log, uat, prd, specs) entraram como vieram da `main`, sem conflito.

## [2026-11-22 00:21] step — F83, a `main` na linha do React: os totais na ponta do ramo, pela fila
**Branch:** claude/f83-sync-main-and-the-new-menu
Medidos sobre 5bcb82a, a ponta do código. Suíte inteira: 351 arquivos, 4.536 testes, todos passam. test/architecture: 41 arquivos, 335 testes. typecheck (tsc -p tsconfig.json): sem erro. lint (eslint .): 0 erros, 62 avisos (os 47 de antes, fora de public/js, mais 15 dos arquivos de `test/visual/` que vieram da `main`; nenhum em public/js nem em test/shell). Build (vite build) dentro do teto: script principal 233.458 B gzip (teto 233.590 B; a onda 5b media 231.568 B, +1.890 B), react-vendor 68.691 B (teto 72.000 B), primeira tela 325.723 B (teto 335.590 B). Os servidores de prévia da prova foram parados. O worktree de comparação da `main` (1330ba9, com o dourado capturado) ficou em /private/tmp/claude-501/-Users-maujrp-mjrp-projects-MJRP-AlbumsBalancedPlaylists-v0--claude-worktrees-fix-albums-loading-and-cache-d92daf/51dfc930-aae7-48cd-ba9b-2140b7676e80/scratchpad/main-old: a trava recusou `git worktree remove` (há um arquivo novo sem commit nele, o retrato que já está neste ramo).

## [2026-11-22 00:18] step — F83, a `main` na linha do React: a prova no navegador do menu da F88, o foco da seta e os documentos
**Branch:** claude/f83-sync-main-and-the-new-menu
Sobre o commit da junta. A prova no navegador comparou o site construído da `main` com o do ramo (`vite build` e `vite preview` dos dois, Firebase Auth e Firestore bloqueados, o Apple Music um roteiro de mentira no lugar do da Apple, o movimento pedido desligado): Chromium a 1280 e a 800 px (a faixa de 768 a 899 px, que agora usa o layout do celular), WebKit com perfil de iPhone 14 e iPhone SE, e WebKit a 1280; cada rodada com o controle de ruído (a `main` contra ela mesma). Resultado: 0 pixels de diferença na barra de cada rota, no painel da conta em cada estado do Apple Music, nos pontos, no menu de baixo em cada rota, na folha do Menu, com o texto maior, na passagem da home para o app; só as telas «Em breve» (/artists, /genres, /tracks) têm de 107 a 421 pixels a no máximo 3 de 255, a 160 a 169 px do topo, abaixo da barra, o mesmo ruído que aparece da `main` contra ela mesma. Mesmas chamadas ao roteiro do Apple Music, mesma ordem de Tab, mesmo foco depois de Escape e da seta, nenhum rótulo sobre a fileira de barras. Um defeito só do navegador, no site construído, achado e consertado: a seta para baixo no botão da conta focava o botão do Apple Music que a pergunta ao Apple Music tirava em seguida (o foco ia para a página); `Account.tsx` agora faz `flushSync` (abre, pergunta, desenha, foca o primeiro controle que sobrou). Capturas e resultados em `reports/evidence/F83/sync-main/` (2,9 MB); o teto de peso e a medida em `bundle-budget-sync-main.txt`. O que não foi provado: o MusicKit de verdade, uma pessoa logada no navegador, o equalizador em movimento, um iPhone de verdade. Documentos: `wave-lessons.md` ganha a seção 12 (o que este passo ensinou), a seção 7 passa a dizer que o menu é o da F88 em React; `tasks.md` ganha a TASK-33; `map-wave-3-shell.md` aponta para a F88; os caminhos de código das docs vivas (`arch.md`, `design-system.md`, `info-arch.md`, `behavior.md`) passam dos arquivos à mão apagados para os de `shell/`.

## [2026-11-22 00:11] session — publicado em produção: exportar pela tela das séries de playlists com a pasta da Apple Music (F90) e os valores do Discogs guardados no banco (F75)
**Branch:** main
Palavras do MJRP (2026-11-22): «Perfeito, pode publicar e sim faça a prévia pls» (depois de testar as duas coisas na prévia `home-menu`; a prévia pedida é a da tela Start enxuta no celular). Site publicado da `main` (`3f296f7`, `/assets/main-DEf7FqBm.js`) pelo `deploy-site.sh`, na fila do Album Blender; conferido no ar: `/`, `/home`, `/inventory`, `/saved-playlists` e `/playlists` respondem 200, o `app.html` aponta o script novo e ele traz o campo da leitura guardada e a escolha da pasta. Nenhuma regra do Firestore nem o servidor mudaram.

## [2026-11-21 23:55] step — F75: a terceira reconferência do juiz (passa: sem P0 e sem P1, 4 P2) entra no ramo, com quatro itens de melhoria no uat
**Branch:** feat/f75-inventory-values-kept-in-the-database
`main` (F90) juntada sem conflito. O relatório do juiz sobre a 765dd4a e suas capturas copiados como vieram, escritos pelo juiz, em `reports/audits/` e `reports/evidence/F75/values-kept/recheck-3/`. Os quatro P2 abriram UAT-277 a UAT-280 (melhorias, abertas pelo agente-juiz): as palavras «suggested»/«lowest» do cartão, o tipo da leitura no celular, o «CD · written by you» cortado em reais no extremo, e o desalinhamento dos vizinhos na galeria do celular (da F89).

## [2026-11-21 23:52] review — F90: a reconferência visual pré-merge do juiz independente, guardada
**Branch:** feat/f90-export-from-the-saved-playlists-screen
Relatório de `reports/audits/2026-11-21-mjrpalbumblender-v0-export-from-saved-playlists-visual-parity-recheck.md` (passou, 1 P1 e 7 P2, sobre o commit 6ff1581), escrito pelo juiz, com as capturas em `reports/evidence/F90/export-from-saved-playlists/recheck/`. Os achados foram corrigidos nos commits anteriores deste ramo.

## [2026-11-21 23:50] step — F90: as capturas refeitas no site construído depois das correções do juiz
**Branch:** feat/f90-export-from-the-saved-playlists-screen
`reports/evidence/F90/export-from-saved-playlists/` refeito com `shoot.mjs` (WebKit iPhone 14 e Chromium a 1280): o passo da pasta com «Export» e «Back» centrados e o título do lote com o nome dele. Nada foi chamado no Apple Music nem no Spotify.

## [2026-11-21 23:50] step — F90: os oito achados do juiz corrigidos (uma pasta escolhida da lista segue pelo id; foco; nome do campo; título; palavras; botões; spec)
**Branch:** feat/f90-export-from-the-saved-playlists-screen
P1: a pasta escolhida da lista ia ao export só pelo nome, que era procurado de novo na primeira página das pastas (pasta duplicada com muitas pastas); agora o `id` segue até a criação da playlist, e a lista e `createOrGetFolder` leem as pastas página por página até o fim (`next`). P2: o foco fica onde estava quando a lista chega; a janela do computador prende o Tab e, no celular, devolve o foco ao «⋯» (ou ao botão) que a abriu; «New folder» começa vazio salvo se o lembrado desta série era um nome digitado; o título da janela segue o que ela mostra (na tela de edição, «Back» mostra «Export playlists»); palavras novas, pendentes da aprovação do MJRP: «You have no folders in Apple Music yet. Export creates the folder you pick.» e o título do lote «Export <nome do lote>» (era «Export batch»); «Export» e «Back» com o texto centrado; a spec tira «escolher a pasta» do «Out of Scope» (REQ-08). Testes primeiro, vistos falhar.

## [2026-11-21 23:47] step — F75: main juntada (o conflito da linha do celular), a trava de texto escapado e a ponta final verde
**Branch:** feat/f75-inventory-values-kept-in-the-database
`main` (F89, a galeria do celular) juntada: um conflito em `InventoryPhoneRow.js`, resolvido mantendo a data («Discogs · 18 Nov») e a exportação `originText` da galeria; `log.md` e `uat.md` sem conflito. A trava `outsideTextEscaped` pediu o nome do Discogs montado numa função (`discogsName`) e o `title` escapado no lugar. Ponta final, pela fila: suíte completa 4070 testes em 319 arquivos, todos verdes (a `test/architecture` dentro dela: 292 em 33 arquivos); eslint 0 erros (42 avisos, os de sempre); medida da linha de origem 32 de 32 sem corte. Não verificado: conta, Firestore e Discogs de verdade; aparelho de toque de verdade.

## [2026-11-21 23:46] step — F83: a `main` entra na linha do React, e a moldura passa a desenhar o menu da F88 (a `main` é a referência)
**Branch:** claude/f83-sync-main-and-the-new-menu
Ramo cortado da ponta da onda 5b (a14aea9). A `main` (1330ba9, 60 commits) foi juntada; a produção seguiu em código à mão (F88: o menu do topo refeito; a home nova e em português; os avisos de falha; «Clear Cache» pelo nome; o servidor que aceita endereços de prévia) enquanto as ondas refaziam em React a moldura que a F88 mudou. **Conflitos por tipo.** Documentos: `docs/specs/uat.md` pela ferramenta do trem (`merge_train.py uat-merge`: nada renumerado, nada em aberto) e `docs/log.md` limpo pelo git (as entradas das duas linhas intercaladas por hora); os scripts do núcleo (`mjrp-scripts/`) são os da `main`, sem diferença. Arquivos à mão que a onda 3 apagou e a `main` mudou (TopNav, AuthNav, PhoneMenu, PhoneShell, phoneTabs, as telas de séries à mão e a janela de classificar à mão, o teste de álbuns no celular): apagados de novo; o que a `main` mudou neles voltou para as peças em React. **Portes para peças em React, cada um com teste vermelho antes:** (1) a grade de capas das séries, `md:grid-cols-3` para `sm:grid-cols-3` (`screens/albums/SeriesGroups.tsx`; o teste `tabletGridsHaveThreeColumns` passou a olhar o arquivo em React e ficou vermelho; o retrato dourado de álbuns, `test/fixtures/albumsBeforeF83.json`, ganhou só essa classe); (2) a linha do celular de 767 para 899 px (`usePhone` já lê `isPhone`, que veio da `main`; os testes que fingem a consulta de mídia dos álbuns e da barra de filtros passaram para 899 px; a janela de classificar em React lê `usePhone`, sem nada a portar); (3) a troca de `UserRankModal.isMobile` (768 para 899) não tem peça em React com limite próprio. As mudanças da `main` no cache (`CacheManager`, `clearAlbumCaches`, `MemoryCache`, `IndexedDBCache`) e no servidor entraram sem conflito (nenhuma peça em React as usa). **A moldura.** O menu em React é o da F88, o mesmo desenho que a `main`: `shell/TopNav.tsx` (a barra da home continuando no app, o fogo na tela atual, a linha de baixo para Álbuns e Playlists), `BarMenu.tsx` (as cinco paradas sobre uma fileira de barras, o ⟲, `wakeBars`; as barras vêm de `threadBarStyle` da home, os ícones de `public/splash/phoneBar.js`, por `StopIcon.tsx`), `SubRow.tsx`, `Account.tsx` (um botão e um painel só, com Apple Music e depois Spotify, os pontos no botão fechado, o estado verdadeiro do Apple Music perguntado ao abrir), `connections.ts` e `ConnectionRows.tsx` (o modelo das conexões, sem desenho, e as linhas; o foco volta para a linha), `ClearCache.tsx` (a pergunta, para o painel e para a folha), `PhoneMenu.tsx` e `PhoneShell.tsx` (o menu de baixo único `pbar`, «Go» no Start, e a folha do Menu com as conexões), `menuText.ts` (os textos, agora do dicionário: 25 chaves `shell.m.*` em inglês e português), `wordmark.ts`. Reaproveitados da `main`: `public/splash/bar-menu.css`, `public/css/top-menu.css`, `public/css/mobile.css`, `phoneBar.js`, `menu.js`, e `appleState` (virou `shell/appleState.ts`, só lógica). Saíram de vez, com seus testes: `SeriesDropdown.tsx`, `SpotifyConnect.tsx`, a gaveta da tela média, e os arquivos à mão que a `main` trouxe (`barMenu.js`, `bars.js`, `account.js`, `clearCache.js`, `connections.js`, `menuText.js`, `subRow.js`, `wordmark.js`); a lista `handMadeScreensBaseline` não precisou de linha nova. **Prova (HTML).** O dourado agora é o menu da `main`: `test/fixtures/shellBeforeF88.json`, 55 cenários capturados da moldura à mão da `main` (`reports/evidence/F83/sync-main/capture-before.test.js`, rodado num worktree da `main`), e `Shell.sameAsBefore` os compara: 55 iguais, atributo por atributo, foco e chamadas ao mundo de fora, com UMA diferença de propósito: um clique em «Connect» no painel deixa o painel aberto (o da `main` fechava, porque a linha é refeita dentro do clique e o painel toma o clique por «fora»). Os testes que a `main` trouxe para os arquivos à mão foram levados: `Connections.test.tsx` (22 casos de `connections.test.js`) e `Menu.test.tsx` (barra, linha de baixo, menu de baixo, `TopNav`). Peso: o script principal 233.446 B contra 231.568 B (sem as chaves); o teto subiu para 233.590 B (ver `scripts/bundle-budget.json`).

## [2026-11-21 23:45] session — publicado em produção: a galeria do inventário no celular (F89, UAT-274)
**Branch:** main
Palavras do MJRP (2026-11-21): «Galeria no iPhone 👍🏻» (depois de ver na prévia) e «Publica». Site publicado da `main` (`be86beb`, `/assets/main-jh6S6a9O.js`) pelo `deploy-site.sh`, na fila do Album Blender; conferido no ar: `/`, `/home`, `/inventory` e `/albums` respondem 200, o `app.html` aponta o script novo e a folha de estilo publicada traz a galeria. Outras palavras dele no mesmo período: sobre a Apple Music, a atualização «Deixa assim então, como está» (exportar cria uma playlist nova) e a pasta «Quero escolher ao exportar»; sobre a tela Start no celular, «Aqui eu ainda acho que tem muito texto, tá clutter. Como poderíamos melhorar?» (proposta feita, sem resposta ainda).

## [2026-11-21 23:43] step — F75: a linha de origem do cartão cabe em toda largura e moeda, os textos do juiz e a folha do celular
**Branch:** feat/f75-inventory-values-kept-in-the-database
Segunda reconferência do juiz (1 P1, 3 P2), teste vermelho primeiro. (1) P1: o valor do Discogs no cartão passa a duas linhas curtas de 11px que não encolhem, «Discogs · 18 Nov» sobre «CD · suggested» ou «CD · lowest» (a sugestão se distingue do menor preço sem passar o mouse; o «CD» fica porque o valor lido é sempre da edição em CD, e o formato não aparece no cartão); duas linhas de 11px têm a altura do valor ao lado (28px), o cartão não cresce (501 px a 1280, antes e depois) e o intervalo da linha cai de 12 para 8 px. Medido (`measure-origin-line.mjs`, o app de verdade no harness, com 99,999.99 em cada cartão): a 900, 1280, 1440 e 1920 px, em USD, EUR, GBP e BRL, nada cortado; o pior caso é BRL a 1280 e mais (a coluna tem 86 px, o texto 83). Na lista do computador: «CD · Discogs · suggested · 18 Nov». (2) P2: palavras do juiz: janela «The lowest price this CD was listed at on Discogs when it was read.»; `title` com a data dita uma vez («Lowest asking price for this CD edition on Discogs, read on 18 Nov 2026, 11:05.» e o par da sugestão); avisos «2 values could not be saved to your inventory. This browser keeps them for six hours; Update values tries to save them again.» e a forma de um valor. Conferido no código: seis horas é `READING_TTL_MS`, e «Update values» grava no começo da rodada (`readingsToKeep`), também quando não há nada a ler. (3) P2: a folha «⋯» do celular diz «Lowest asking price for this CD edition on Discogs.» no menor preço e mantém «Mean of Mint, Near Mint and Very Good Plus…» na sugestão. Todas as palavras novas: **pendentes da aprovação do MJRP**. Capturas novas em `reports/evidence/F75/values-kept/` (cartão a 1280 e 1440 em BRL e USD nos dois tipos, a janela, a folha do celular).

## [2026-11-21 23:34] step — F75: a segunda reconferência do juiz (a tela ainda reprova: 1 P1 e 3 P2) e suas capturas entram no ramo
**Branch:** feat/f75-inventory-values-kept-in-the-database
O juiz independente reconferiu a 2885efb: os dados passam; o cartão do computador em reais a 1280 e 1440 corta a origem (1 P1) e há 3 P2 (textos do menor preço, avisos de valor não gravado, folha «⋯» do celular chamando o menor preço de média). Relatório e capturas copiados como vieram, escritos pelo juiz, em `reports/audits/` e `reports/evidence/F75/values-kept/recheck-2/`.

## [2026-11-21 23:33] step — F89: a reconferência visual do juiz independente, guardada
**Branch:** feat/f76-inventory-gallery-on-the-phone
Relatório do juiz (agente separado, Opus) sobre o commit 869ec36: passa, sem P0 e sem P1, com 6 P2 (`reports/audits/2026-11-21-mjrpalbumblender-v0-inventory-gallery-phone-visual-parity-recheck.md`, copiado sem mudar; capturas em `reports/evidence/F76/inventory-gallery-phone/recheck/`). Os seis achados foram corrigidos nos commits anteriores deste ramo.

## [2026-11-21 23:33] step — F89: as seis correções do juiz, vistas no site construído (WebKit, iPhone 14 e SE)
**Branch:** feat/f76-inventory-gallery-on-the-phone
Com a `main` já dentro do ramo (nada novo a unir), suíte completa 318 arquivos / 4033 testes verdes, `eslint .` com 0 erros (69 avisos antigos) e `test/architecture` 33 arquivos / 292 testes verdes, todos pela fila. Recortes dos seis pontos em `reports/evidence/F76/inventory-gallery-phone/fixes/` (252 KB, com `shoot-fixes.mjs` e `measures.json`): capa de 10 px; o motivo do «—» em duas linhas no SE; o fim da galeria e da lista com o botão de topo fora da frase; a seta «⌄» na pílula ("Not Owned" cabe a 320 px, ajustando o respiro da pílula); o cartão com foco acima do menu.

## [2026-11-21 23:30] review — F83 onda 5b: o juiz independente aprova as janelas da tela de álbuns em React (sem P0, sem P1, 3 P2)
**Branch:** integrate/staging-2026-11-21
Relatório `reports/audits/2026-11-21-mjrpalbumblender-v0-react-albums-windows-visual-parity-recheck.md` e capturas em `reports/evidence/F83/wave-5b/recheck/`, escritos pelo juiz (não por quem construiu) sobre o commit f4e3262, guardados como vieram. Gravações: 23 de 23 casos do juiz iguais à antiga em conteúdo, ordem e momento (mover uma faixa de doze grava as 12 numeradas de 1 a 12, como antes). Arrastar com mouse e dedo dá a mesma ordem. P2 a consertar na linha do React: no Safari do computador, depois de soltar com o mouse, o lugar antigo da linha fica aceso (a antiga não fazia isso). P2 que já existem hoje: clicar duas vezes em Save no ranking grava duas vezes; a documentação exagera o conserto das faixas de mesmo título. Não visto: arrastar com o dedo num Safari de verdade, o catálogo de verdade.

## [2026-11-21 23:28] step — F90: o export do Apple Music repartido em três funções (a trava de complexidade 10); suíte, eslint e arquitetura verdes
**Branch:** feat/f90-export-from-the-saved-playlists-screen
A pasta escolhida deixou `AppleMusicExportService.exportPlaylists` com complexidade 12; o plano do export (`planOf`), o relatório vazio (`emptyReport`) e o começo (`_start`) saíram dela, sem mudar o que o export faz. Na ponta: suíte inteira 318 arquivos e 4042 testes passando, eslint sem erro (38 avisos que já existiam), `test/architecture` 32 arquivos e 286 testes passando.

## [2026-11-21 23:27] step — F89: os seis achados do juiz na galeria do inventário do celular, corrigidos
**Branch:** feat/f76-inventory-gallery-on-the-phone
O juiz independente passou o ramo (sem P0, sem P1) com seis P2, todos corrigidos: canto da capa de 10 px como o de Albums (variável `--phone-cover-radius`); o motivo do «—» quebra em duas linhas em vez de cortar; a frase da Discogs ganha o respiro do botão «voltar ao topo» (galeria e lista); a pílula da galeria ganha a seta «⌄» da lista; cartão e linha ganham `scroll-margin-bottom` acima do menu; a linha UAT-274 e o comentário de `shoot.mjs` dizem 2 colunas (3 de 640 px). Testes: `test/architecture/inventoryGalleryFinishing.test.js` e um caso novo na galeria.

## [2026-11-21 23:26] step — F75: ponta final depois do juiz: main juntada, suíte, eslint, scripts de navegador e capturas novas
**Branch:** feat/f75-inventory-values-kept-in-the-database
`main` juntada no ramo sem conflito (o `log.md` e o `uat.md` não pediram o `merge_train`). Na ponta final, pela fila: suíte completa 4039 testes em 315 arquivos, todos verdes (a `test/architecture` dentro dela); eslint 0 erros (40 avisos); os dois scripts de navegador `inventoryValuesKeptInDatabase.mjs` (12 OK) e `inventoryValuesStayInBrowser.mjs` sem FAIL. Capturas novas em `reports/evidence/F75/values-kept/`: cartão de leitura comum e de menor preço à venda (a data fica, o «lowest for sale» é o que se corta quando a coluna é estreita, e fica no `title` e na faixa dos totais), a linha do celular («Discogs · 12 Oct» numa linha só) e a janela para os dois tipos. O cartão em galeria do celular não existe neste ramo.

## [2026-11-21 23:23] step — F75: as correções do juiz (a data do menor preço à venda, a data numa peça só, o texto verdadeiro, a leitura inválida, a atribuição)
**Branch:** feat/f75-inventory-values-kept-in-the-database
Correções do relatório do juiz (84dbddc; 1 P1 e 4 P2), teste vermelho primeiro (11 testes novos falhando antes). (1) P1: o cartão do computador guarda a data num lugar que não encolhe («CD · Discogs · lowest for sale» corta, o dia fica: «… · 18 Nov»), nos dois tipos de leitura; a linha do celular e a do cartão usam a mesma forma. (2) P2: a data é uma peça só (espaço sem quebra entre o dia e o mês) e o celular passa a «Discogs · 18 Nov». (3) P2: «The lowest price this CD was for sale at on Discogs when it was read.» na janela, e o `title` do cartão idem (texto pendente da aprovação do MJRP). (4) P2: `setReadings` pula a leitura inválida e grava as outras; `keepReadings` devolve quantas não foram guardadas, a rodada diz «N readings could not be saved to your inventory: they show in this browser for now.» e uma leitura só diz «The value was read but could not be saved to your inventory. It shows in this browser for now.» (pendentes); o valor continua na tela pela cópia do navegador. (5) P2: a constituição VI.1 e o REQ-16 agora dizem onde a atribuição aparece (no celular: a linha «Data provided by Discogs.» do topo, a folha e a janela; a linha do celular não ganhou o link, para não apertá-la).

## [2026-11-21 23:23] step — F90: exportar a partir da tela das séries de playlists construído; a pasta do Apple Music escolhida ao exportar (REQ-08)
**Branch:** feat/f90-export-from-the-saved-playlists-screen
Palavras do MJRP (2026-11-21): «Quero escolher ao exportar», à pergunta «Pasta na Apple Music: basta a de hoje (o nome da série), ou quer escolher ao exportar?»; antes, sobre o export: «1 os dois , mas principalmente um playlist específica». Construído: a janela de export compartilhada (`views/playlists/PlaylistExportWindow.js`: Apple Music, Spotify, JSON), o «Export» de cada playlist e do lote na tela guardada, o passo da pasta do Apple Music (REQ-08, registrado como REQ e TASK-06 da F90; escolha lembrada em `localStorage`, chave `mjrp_apple_music_folder:<série>`), `listFolders()` no MusicKit. Consertado de passagem: fechar a janela do Spotify pelo «Close» lançava um erro no console (o clique chegava ao ouvinte do fundo depois de `this.container` virar nulo). Prova: testes com serviços de mentira e capturas no WebKit (iPhone 14) e no Chromium a 1280 em `reports/evidence/F90/export-from-saved-playlists/`; um export real para o Apple Music não foi feito, e a lista de pastas e a criação numa pasta escolhida só se provam com a conta do MJRP.

## [2026-11-21 23:15] step — F75: o relatório do juiz sobre a leitura guardada (dados passam; tela com 1 P1 e 4 P2) e suas capturas entram no ramo
**Branch:** feat/f75-inventory-values-kept-in-the-database
O juiz independente reconferiu a 84dbddc: o lado dos dados passou; a tela reprovou em 1 P1 e 4 P2. Relatório e capturas copiados como vieram, escritos pelo juiz, em `reports/audits/` e `reports/evidence/F75/values-kept/recheck/`.

## [2026-11-21 23:03] step — F83 onda 5b: os totais na ponta do ramo, pela fila
**Branch:** claude/f83-wave-5b-albums-windows
Suíte inteira: 341 arquivos, 4.360 testes, todos passam. test/architecture: 37 arquivos, 304 testes. typecheck (tsc -p tsconfig.json): sem erro. lint (eslint .): 0 erros, 47 avisos (os de antes, fora de public/js). Medidos sobre f4e3262, a ponta do código. Nenhum servidor ficou de pé. O worktree de comparação da tela antiga (a 5b antes de apagar as janelas, fbae3fd) ficou em /private/tmp/claude-501/-Users-maujrp-mjrp-projects-MJRP-AlbumsBalancedPlaylists-v0--claude-worktrees-fix-albums-loading-and-cache-d92daf/51dfc930-aae7-48cd-ba9b-2140b7676e80/scratchpad/w5b/old5b (a trava recusou removê-lo).

## [2026-11-21 23:02] review — F83 onda 5a: o juiz independente aprova a tela de álbuns em React (sem P0, sem P1, 3 P2)
**Branch:** integrate/staging-2026-11-21
Relatório `reports/audits/2026-11-21-mjrpalbumblender-v0-react-albums-visual-parity-recheck.md` e capturas em `reports/evidence/F83/wave-5a/recheck/`, escritos pelo juiz (não por quem construiu) sobre o commit 499399c, guardados como vieram. Cerca de 950 conferências antigo contra novo a 1280 e 393, grade e lista, todos os estados e filtros, mais as janelas atrás das pontes: página, endereço, rolagem e chamadas iguais; os pixels diferentes são ruído; no site montado a tela nova é igual ou mais rápida. Os três P2 são defeitos da tela de hoje, mantidos de propósito: «All Years» e «All Sources» aparecem duas vezes; Refresh recarrega o escopo de abertura, não a série escolhida; «Go to Start» recarrega a página inteira. Não visto: Apple Music e Spotify de verdade, gravar um ranking, a lista no WebKit.

## [2026-11-21 23:00] step — F90: exportar uma playlist a partir da tela das séries de playlists — registrada (S-72, F90, UAT-276)
**Branch:** feat/f90-export-from-the-saved-playlists-screen
O MJRP, 2026-11-21: «Uma coisa que senti falta na playlist agora. Foi poder exportar a playlist a partir da tela da playlist series sem ter que entrar em edit batch.» e, à proposta (um «Export» no lote e um export em cada playlist do lote aberto): «1 os dois , mas principalmente um playlist específica»; «eu pessoalmente, uso Apple Music e não Spotify». Registrado antes de construir: a história S-72 (embutida no PRD, épico EP-04, a pasta `ep-04-export-playlists` nasce com ela), a feature F90 (spec, plan e tasks em esboço; `lane: standard`, `solution_type: feature`; imports a S-72) e a UAT-276 (melhoria, aberta pelo humano). O plano deixa uma tarefa aberta (TASK-08): repetir a feature na tela em React da linha de migração. Ids reservados por `merge_train.py` (`next-item-id --reserve`, `next-uat-id --reserve`).

## [2026-11-21 22:59] step — F89: a galeria do inventário segue a grade de Albums (2 colunas, 3 de 640 px) e mostra as médias
**Branch:** feat/f76-inventory-gallery-on-the-phone
Pedido da coordenação (a promessa ao MJRP: «igual à da tela de Albums»; a tela de Albums tem 2 colunas a 393 px). As colunas e os vãos agora são variáveis escritas uma vez (`--phone-cover-columns`, `--phone-cover-gap-x/y` em `mobile.css` § 1), lidas pela galeria e pelo CSS de Albums (mesmos 12 e 20 px: a tela de Albums não muda); um teste de arquitetura mantém as classes de Albums e as variáveis em passo. No WebKit, nos 10 larguras 320, 360, 375, 393, 430, 600, 640, 768, 820 e 899 px, as colunas, os vãos e a largura da capa são iguais nas duas grades. Com cartões de 138 a 281 px o cartão passou a mostrar também as duas médias (como a linha da lista), com letras maiores; os links da loja, Sell e Trade ficam no «⋯». Capturas refeitas (2,3 MB).

## [2026-11-21 22:58] step — F83 onda 5b: o teste do placar da migração acompanha a lista que encolheu
**Branch:** claude/f83-wave-5b-albums-windows
A suíte inteira achou que o teste de scripts/migration-status esperava mais de 40 arquivos à mão e mais de 500 textos fora do dicionário: depois da 5b a lista tem 40 arquivos e 443 textos (os das janelas foram para os dicionários). Os limites passam a 30 arquivos e 300 textos, com o número de hoje no comentário.

## [2026-11-21 22:57] step — F83 onda 5b: a prova no navegador, o peso e os documentos (TASK-23b, TASK-30, TASK-31)
**Branch:** claude/f83-wave-5b-albums-windows
Chromium (1280 com mouse de verdade, 393 com toque; o arrastar pela alça e fora dela), o site construído no Chromium e no WebKit com perfil de iPhone, antiga contra nova e antiga contra antiga: com o que está de fora trocado igual nos dois lados (a busca no catálogo, o serviço de séries e o repositório de classificações), a página, o foco, as chamadas (inclusive o que chegaria ao repositório de classificações), a ordem e os números das faixas e as palavras dos avisos iguais em todos os passos; os controles de antiga contra antiga dão o mesmo ruído conhecido (barra do topo, 1 pixel de 1 nível). A única diferença de pixel que não é ruído nem se explica por inteiro é o rótulo «DELUXE» (9 px, sobre um desfoque) nos cartões do seletor: DOM idêntico, caixas e estilos iguais a 0,001 px, igual quando o nó é refeito; vem da história de desenho do nó, não do que ele é. No WebKit no computador, depois de soltar uma faixa com o mouse a linha realçada (hover) fica onde a faixa foi posta de volta até o ponteiro mexer; candidata a issue. O que ficou à mão do que a antiga tinha de lado, as diferenças decididas, o peso (script principal 230.315 B para 231.568 B, só os textos das janelas) e o que não deu para provar (o MusicKit real, o serviço e o repositório de verdade, o arrastar com o dedo no WebKit) estão em reports/evidence/F83/wave-5b/proof-wave-5b.md. tasks.md (TASK-23b feita, TASK-23c para as ondas 6 e 8), o mapa, o plano e wave-lessons.md (§ 11).

## [2026-11-21 22:56] step — F75: a data curta no cartão, documentos em dia e a prova no navegador da leitura guardada
**Branch:** feat/f75-inventory-values-kept-in-the-database
F75, a data na linha do cartão encurtada («CD · Discogs · 18 Nov»: com «read» o corte da linha escondia o dia a 1280 px; o momento inteiro fica no `title` e na janela), documentos em dia (`behavior.md`, `data-model.md`, `arch.md`, `info-arch.md`, manual, textos pendentes no `design-system.md`) e a prova no navegador: `test/visual/inventoryValuesKeptInDatabase.mjs` (perfil novo, banco de mentira, valor com data e sem aviso de espera) e as capturas a 1280 e 393 px com Firebase, Firestore e Discogs fora do ar (`reports/evidence/F75/values-kept/`). Totais pela fila: suíte completa 4031 testes em 315 arquivos, todos verdes; eslint sem erro (40 avisos, os de sempre e os de globais dos scripts `.mjs`). Não verificado: conta de verdade, Firestore de verdade, Discogs de verdade. Decidido pelo agente — revisável: «Update values» atualiza tudo sem valor escrito, salvo o lido há menos de seis horas; a leitura que só o navegador tem vai ao banco na rodada seguinte, não em silêncio ao abrir a tela (abrir a tela não grava nada que a pessoa não pediu).

## [2026-11-21 22:43] step — F89: a main (a home em português, linhas de UAT) entra no ramo
**Branch:** feat/f76-inventory-gallery-on-the-phone
Conflito só em uat.md, resolvido por `merge_train.py uat-merge --git` (nada renumerado; a UAT-274 ficou entre a 273 e a 275); o log.md uniu sozinho.

## [2026-11-21 22:30] session — publicado em produção: a home abre em português para todos (UAT-273)
**Branch:** main
Palavras do MJRP (2026-11-21): «Pública pls». Site publicado da `main` (`22663ed`) pelo `deploy-site.sh`, na fila do Album Blender; conferido no ar: `/home` vem com `<html lang="pt-BR">` e «Mergulhe nos álbuns que você ama», as descrições da página já não trazem «misture» nem «discos da sua estante», e `/`, `/home`, `/start` e `/inventory` respondem 200. O script principal do app não mudou de nome (`main-Dy6AgDdK.js`): a mudança é só da página de entrada.

## [2026-11-21 22:30] step — F75: a leitura do Discogs guardada no item do inventário, o botão que atualiza e a data na tela (REQ-14 a REQ-16)
**Branch:** feat/f75-inventory-values-kept-in-the-database
F75, REQ-14 a REQ-16 construídos: a leitura do Discogs de um álbum é guardada no item do inventário (`discogsReading`, com a data, a edição, o tipo e a origem), sem mudar as regras do Firestore nem índices (a coleção do inventário já é só do dono e não lista campos). `InventoryRepository.setReadings` (lote, valida, troca o campo inteiro, nunca toca `value`), `InventoryService.setReadings`, `InventoryValueService.keepReadings` (grava a cada 25 álbuns da rodada e na leitura de um álbum). A regra do valor (`models/inventoryValue.js`): o que a pessoa escreveu vence; senão a leitura mais nova entre o item e o navegador, de qualquer idade, com a data; senão nenhum, com o motivo. O aviso «N albums are waiting» conta só quem nunca teve leitura. «Update values» atualiza (lê de novo todo álbum sem valor escrito, salvo o lido há menos de seis horas, a guarda); «Read them now» lê só os nunca lidos. A leitura que só o navegador tem vai ao banco na rodada seguinte, não ao abrir a tela. Texto novo (pendente da aprovação do MJRP): «CD · Discogs · read 21 Nov» no cartão, «Discogs · read 21 Nov» no celular. O teste antigo («o repositório não tem porta para o preço») agora afirma o contrato novo. Testes tocados e `test/architecture` verdes pela fila.

## [2026-11-21 22:17] step — F89: o estado da spec derivado pelo gancho (Draft para In Progress)
**Branch:** feat/f76-inventory-gallery-on-the-phone
O gancho de commit derivou o estado da F89 das tarefas marcadas e gravou na spec depois do commit anterior; este commit só o registra. A F89 segue sem a «Priorizada» do MJRP no board: a spec está em esboço de aprovação (`Approved: pendente`).

## [2026-11-21 22:17] step — F89: a prova no WebKit da galeria do inventário no celular, os cartões estreitos e os documentos
**Branch:** feat/f76-inventory-gallery-on-the-phone
Prova na página CONSTRUÍDA (vite build do harness, as folhas na ordem do app), no WebKit do Playwright 1.63.0 (o módulo do node_modules de outro worktree, ligado por link simbólico), com Auth e Firestore bloqueados: iPhone 14 (390), iPhone 393 (o do MJRP, em pixels CSS), iPhone SE 3 (375), iPhone SE (320) e 820 px. 3 colunas de 360 a 639 px, 2 abaixo de 360 (a 320 px 3 seriam cartões de 90 px), 5 a 820 px; alvos de 44 px, texto de 12 px ou mais, nenhuma pílula cortada, sem rolagem lateral, sem erro no console, a barra de baixo não cobre a última linha. A primeira passada achou a pílula «Not Owned» cortada a 375 px: padding e «⋯» ajustados. Documentos: behavior.md (^phone-inventory-gallery e a linha da grade ou lista), info-arch.md (três estados), arch.md. Pendente: o juízo do MJRP no iPhone (3 colunas a 393 px é o número que ele pediu; a tela de Albums tem 2; a troca fica na folha de filtros, como em Albums).

## [2026-11-21 22:14] step — F80: o relatório do juiz sobre a home em português (passou, sem P0 nem P1, 2 P2) e suas capturas entram no ramo; UAT-275 nova
**Branch:** fix/f80-home-opens-in-portuguese
O juiz escreveu o relatório sobre e743a1a; copiado como veio para `reports/audits/` e as capturas para `reports/evidence/F80/opens-in-portuguese/recheck/`. UAT-275 (melhoria, aberta pelo juiz): quem escolheu inglês vê o português por cerca de 50 a 280 ms antes da troca; não é novo. Sem mudança de código.

## [2026-11-21 22:04] step — F83 onda 5b: as janelas da tela de álbuns em React (TASK-23b); as antigas e as peças só delas saem
**Branch:** claude/f83-wave-5b-albums-windows
Em public/js/screens/albums/: SeriesEdit (a janela de editar série) e seriesEditSession (nome, lista, salvar, o que o MJRP já tinha em seriesDraft), seriesDelete (a pergunta de apagar, pelo dialogService de sempre), RankWindow, RankPhone e rankSession (a janela de classificar, computador e celular), useAlbumWindows (o gancho que a tela chama; os avisos da janela vivem aqui e sobrevivem a ela); em ui/albumPicker/: pickerController.ts (o controlador do seletor único, que a Start passa a importar), AlbumPickerPanel, PickerParts (botão de filtro, de busca, mensagem do painel, cartão); ui/ModalShell.tsx (o casco de BaseModal escrito em React, igual elemento a elemento por teste). react-bridge/sortableTracks.ts ganhou o DragProfile (a lista, o número da lista, as opções do Sortable, a classe da página durante o arrasto), com o da tela de playlists como padrão: uma ponte só, e a janela de classificar dá o perfil dela. Textos pelo dicionário (albums.edit.*, albums.delete.*, albums.rankWindow.*, ui.picker.*, ui.window.close), inglês igual ao de hoje, português fechado. Saíram components/series/*, components/album-picker/*, components/ranking/{UserRankModal,rankWindowPhone}.js, views/renderers/DiscographyRenderer.js e react-bridge/legacy/SeriesModals.tsx (1.073 linhas à mão em 8 arquivos) com as entradas deles no handMadeScreensBaseline; Albums.tsx e as duas entradas de AlbumWindows saíram de BRIDGE_USES. describeScan e describeSave (os textos em inglês dos modelos) saíram: os textos moram no dicionário. O teste igual-ao-de-antes passa nos 50 cenários, em modo normal e em modo estrito, com a classificação gravada também por dentro do serviço real até o repositório de classificações (substituído); os testes das janelas antigas foram levados para o andaime novo (SeriesEdit, RankWindow, rankSession, PickerCard). O script principal cresceu 1.253 B (os textos em inglês das janelas): teto 230.459 B para 231.712 B.

## [2026-11-21 22:03] step — F80: a prova no WebKit (iPhone em inglês) e a UAT-273 registrada como consertada
**Branch:** fix/f80-home-opens-in-portuguese
Prova no site construído, WebKit do Playwright (módulo do control-center) com o perfil iPhone 14 e `locale en-US`, Auth e Firestore bloqueados: o primeiro byte já traz `<html lang="pt-BR">`; a primeira visita mostra «Mergulhe nos álbuns que você ama.» / «Seus álbuns do momento, numa playlist balanceada.», sem troca de texto (o observador de mutações só vê o preenchimento da própria página); «EN» troca e fica lembrado após recarregar; «PT» volta. `dist/index.html` traz as novas descrições. Recortes em `reports/evidence/F80/opens-in-portuguese/`. Varredura do `copy.js`: nenhum outro resto do texto antigo; a palavra «estante» sobra só em «Conte as mídias físicas da sua estante.» (título dele). Para o MJRP, sem mexer: o kicker «um app web para quem ama discos» e o «disco» em vários textos (ele pediu «mídias físicas» só no inventário). Totais: suíte inteira 315 arquivos, 4004 testes passando; eslint 0 erros, 69 avisos (já existiam). UAT-273 passa a `fixed (F80: 31d7504)`; o aceite é dele.

## [2026-11-21 22:02] step — F89: o inventário no celular ganha a galeria de capas (a troca na folha «Filters and order», a escolha guardada, o cartão de capa)
**Branch:** feat/f76-inventory-gallery-on-the-phone
A visão do celular é uma função pura (`models/inventoryViewMode.js`: a escolhida, ou a lista para quem nunca escolheu); a chave guardada é a do computador (`mjrp_inventory_view_mode`), como a tela de Albums divide a sua. O cartão (`InventoryPhoneTile.js`) tem a capa, o título, o artista, o valor com o formato e a origem, a situação e «⋯» (a mesma folha de ações, com «Where to buy»); a grade tem 3 colunas e, a partir de 640 px, as que couberem a 140 px. Testes primeiro: o modelo, a tela (as duas visões, a troca, a escolha guardada, as mesmas ações) e o teste de arquitetura das grades. Sem prova no navegador ainda.

## [2026-11-21 22:00] step — F80: a home abre em português para todos; as descrições escondidas ganham as palavras do MJRP (UAT-273)
**Branch:** fix/f80-home-opens-in-portuguese
O MJRP, no iPhone dele (em inglês), viu a home abrir em «Dig through the albums you love.» e perguntou: «Mas o copy que eu pedi pra mudar na aprovação do protótipo não está lá pq?»; perguntado qual, respondeu: «Da tela inicial». O português é o texto que ele escreveu na aprovação; o inglês é proposta do agente que ele nunca revisou, e a home o escolhia pelo idioma do navegador. Decisão do orquestrador (revisável pelo MJRP): `chooseLanguage` passa a ser «a escolha lembrada, senão português»; o inglês só vem do toque do visitante em «EN», lembrado como antes. A página já nasce com o português preenchido (`fillCopy`, `<html lang="pt-BR">`) e `start()` só troca de idioma se a escolha lembrada não for português: numa primeira visita não há troca nem lampejo. Também: `meta.desc` e `meta.ogdesc` (e o par em inglês) perdem «misture playlists equilibradas» e «conte os discos da sua estante» e usam as palavras dele («Monte séries com seus álbuns do momento, ranqueie… gere playlists equilibradas», «mídias físicas»); a descrição fica em 155 caracteres (pt) e 159 (en). Testes: lang (lembrado pt, lembrado en, nada lembrado com navegador em inglês → pt, storage que lança → pt), copy (descrições), splash (a fiação, com a página como servida). UAT-273 aberta, por ele.

## [2026-11-21 21:58] step — F75: a decisão do MJRP entra no papel (REQ-14 a REQ-16, a constituição v3.0.0 no artigo VI.1), antes de qualquer código
**Branch:** feat/f75-inventory-values-kept-in-the-database
Registrado na spec, no plano, nas tarefas e na história S-57, com as palavras do MJRP de 2026-11-21 («quero os dados persistidos sim e o botão serviria para atualizar valores»; «1.a»). A constituição (VI.1) foi emendada pelo procedimento do artigo VIII: o texto trocado fica inteiro no item, com a data e o motivo; a versão sobe a v3.0.0 (MAJOR); NENHUM carimbo de aceite foi escrito (a ratificação do documento fica para o MJRP). Decidido sabendo que os termos do Discogs só foram lidos de segunda mão (`reports/research/2026-11-21-discogs-terms-on-storing-prices.md`); um produto com outros usuários precisa da autorização escrita do Discogs (aberto, não resolvido aqui). O valor mora no item do inventário (`discogsReading`), sem mudança de regras do Firestore.

## [2026-11-21 21:54] decision — o MJRP: os preços do Discogs passam a ser guardados no banco, e o botão serve para atualizar (F75)
**Branch:** main
Palavras do MJRP (2026-11-21): «quero os dados persistidos sim e o botão serviria para atualizar valores»; à pergunta «Preços do inventário: guardar no banco já (a), ou ler sozinho ao abrir e pedir autorização ao Discogs antes de guardar (b)?», «1.a»; à pergunta «Posso gravar no repositório o relatório da pesquisa dos termos do Discogs?», «2. Pode». Ele decidiu sabendo do que a pesquisa achou (`reports/research/2026-11-21-discogs-terms-on-storing-prices.md`, escrita por um agente de pesquisa e gravada aqui pelo orquestrador com o OK dele): as páginas de termos do Discogs recusaram a leitura automática, então só há citações de terceiros; por elas, as seis horas são regra de frescor, o preço sugerido é dado restrito (licença pessoal, sem uso comercial, sem repasse), guardar para uso só dele é incerto e, num produto com outros usuários, parece pedir autorização escrita. A decisão muda a regra da constituição «O preço do Discogs nunca vai ao Firestore»; a emenda e a construção vêm num ramo próprio.

## [2026-11-21 21:54] session — publicado em produção: o menu de baixo igual na home e no app, com «Go» (UAT-270), e o «Clear Cache» que guarda os valores do inventário (UAT-267)
**Branch:** main
Palavras do MJRP (2026-11-21): «1. Acrescenta 2. Publica 3. Recapitule por favor, mas quero os dados persistidos sim e o botão serviria para atualizar valores» (1: a galeria do inventário no celular; 2: a publicação; 3: os preços do inventário). Antes, sobre o texto da home: «Mas o copy que eu pedi pra mudar na aprovação do protótipo não está lá pq?», «Da tela inicial», «A da home. E no inventory não tem a view de galeria?só de lista? Mas fora isso tá bem top!!!». Site publicado da `main` (`a10d648`, `/assets/main-Dy6AgDdK.js`) pelo `deploy-site.sh`, na fila do Album Blender; conferido: `/`, `/home`, `/start`, `/albums` e `/inventory` respondem 200, o `app.html` aponta o script novo, `/api/musickit-status` responde 200. A decisão dele de guardar os preços do Discogs no banco está registrada e NÃO construída: muda a regra da constituição e espera a resposta dele sobre os termos do Discogs.

## [2026-11-21 21:53] step — F89: a galeria de capas do inventário no celular — registrada (S-71, F89, UAT-274)
**Branch:** feat/f76-inventory-gallery-on-the-phone
O MJRP, 2026-11-21: «no inventory não tem a view de galeria? só de lista?» e, a «Galeria no inventário do celular: sim ou não?»: «1. Acrescenta». Registrado antes de construir: a história S-71 (embutida no PRD, épico EP-06, ao lado da S-58), a feature F89 (spec, plan e tasks em esboço; imports a S-71) e a UAT-274 (melhoria, aberta pelo humano). Convenção seguida: como a F88 e a S-70, uma história nova para a necessidade nova. Não coube como REQ-14 na F76, a dona do inventário do celular: ela está em «Pronto para UAT» e a trava do grafo recusa uma tarefa aberta numa feature Done; reabri-la é do MJRP (`Human-reopened:`). Por isso uma feature própria, que a F76 não precisa conhecer.

## [2026-11-21 21:35] step — F83 onda 5b: o retrato das janelas antigas (48 cenários) e o teste «igual ao de antes», vermelho
**Branch:** claude/f83-wave-5b-albums-windows
test/support/albumWindowsScenarios.js: 48 cenários das janelas de editar série (com o seletor), de apagar série e de classificar (computador e celular), tirados das janelas antigas ainda de pé (reports/evidence/F83/wave-5b/capture-before.test.js) para test/fixtures/albumWindowsBeforeF83.json: a página que fica sobre a tela depois de cada passo, o foco e TODA chamada a quem está de fora (o serviço de séries com o que foi gravado, o onSubmit e o onSave da classificação nos mesmos momentos, o serviço de busca, os avisos, a pergunta, a biblioteca de arrastar com as opções que recebeu). test/screens/albums/AlbumWindows.sameAsBefore.test.tsx toca os mesmos cenários nas janelas novas e compara um a um, com quatro provas de que acusa uma palavra, uma classe, uma chamada e um foco trocados. Falha hoje porque screens/albums/useAlbumWindows não existe.

## [2026-11-21 21:28] step — F83 onda 5b: o mapa das janelas de séries e de classificar (TASK-23b)
**Branch:** claude/f83-wave-5b-albums-windows
O mapa da 5b em map-wave-5-albums.md, escrito antes do código: o que cada janela faz hoje e a nova repete (editar série, apagar série, classificar, o seletor), as lojas que leem (só albumSeriesStore, por leitura, sem assinar), o que a antiga não tem e a nova também não terá (sem Escape e sem prender o foco na de editar; sem foco ao abrir ou fechar na de classificar: candidatas a issue), o que muda de propósito e como se prova. O mapa e a nota do construtor da 5a coincidem; onde o mapa diz que a Start passa ao painel novo, o que a Start usa do seletor é só o controlador, então ela passa a importar o controlador portado.

## [2026-11-21 21:22] step — F83 onda 5a: os totais na ponta do ramo, pela fila
**Branch:** claude/f83-wave-5a-albums-screen
Suíte inteira: 339 arquivos, 4.234 testes, todos passam. test/architecture: 37 arquivos, 304 testes. typecheck (tsc -p tsconfig.json): sem erro. lint: 0 erros, 48 avisos (os de antes, fora de public/js). Nenhum servidor ficou de pé. O worktree de comparação da tela antiga ficou em /private/tmp/claude-501/old5a (a trava recusou removê-lo).

## [2026-11-21 21:20] step — F83 onda 5a: a folha solta o desenho do React ao fim do deslize, mas a tela desenha de novo na hora (teste da Start)
**Branch:** claude/f83-wave-5a-albums-screen
A suíte inteira achou que o teste da Start do celular (o Undo que volta ao fechar a folha) dependia de a tela desenhar de novo no instante em que a folha fecha: useSheetWindow agora desenha de novo na hora e só tira o conteúdo da folha quando ela sai da página; o foco da primeira coisa não é dado a uma folha que fecha.

## [2026-11-21 21:17] step — F83 onda 5a: a prova no navegador, o peso, os documentos (TASK-23a, TASK-30, TASK-31)
**Branch:** claude/f83-wave-5a-albums-screen
Chromium (1280 e 393) e WebKit com perfil de iPhone sobre o build, antiga contra nova e antiga contra antiga: página e foco iguais em todos os passos; o ruído conhecido (barra do topo, relógio do rodapé) existe também de antiga contra antiga; 11 a 20 pixels de 1 nível na barra de filtros não se explicam além de rasterização com caixas e estilos iguais. Redesenho com 300 capas (o roteiro corrigido reconhece a lista a 1280): no build a nova está igual ou abaixo da antiga (42,6 contra 51,8 ms na grade 25x12 a 1280; 24,7 contra 22,9 a 393), no servidor de desenvolvimento 1,6 a 1,9 vez (React de desenvolvimento e modo estrito). O que não dá para provar sem conta: o MusicKit real, o Spotify real, gravar uma classificação, remover um álbum de uma série real. tasks.md (TASK-23a feita, TASK-23b aberta), o mapa, o plano e wave-lessons.md (§ 10).

## [2026-11-21 21:17] step — F83 onda 5a: dois consertos que o navegador achou e o teto de peso
**Branch:** claude/f83-wave-5a-albums-screen
O WebKit com perfil de iPhone sobre o build achou que a folha de filtros mostrava a escolha do desenho anterior no site publicado (a barra lia as propriedades para a camada da folha antes de atribuí-las; o modo estrito escondia isso nos testes): consertado em ui/FilterToolbar.tsx. A passada no Chromium achou que fechar uma folha devolvia o foco ao botão e o gancho o soltava: useFocusLikeAfterAnewDraw ganhou a opção after (só depois de um aviso do controlador). Teto do script principal de 285.874 B para 230.459 B (medido 230.315 B, era 285.730 B: saíram 55.415 B; o arquivo da tela tem 19.997 B e o da barra de filtros 2.619 B).

## [2026-11-21 21:01] step — F83 onda 5a: a tela de álbuns em React (TASK-23, a tela); a antiga e as peças só dela saem
**Branch:** claude/f83-wave-5a-albums-screen
Em public/js/screens/albums/: Albums, Header, SeriesGroups (os grupos, os esqueletos, o aviso de falha e Try again, Load N more), AlbumCard (cartão compacto e expandido, tile e linha do celular), Pager (os dois paginadores, o do celular, o rolar), PhoneSheets, albumActions (remover álbum pelos três caminhos), AlbumsBridge (a view que o controlador recebe), index; ui/FilterToolbar.tsx (a barra e a folha de filtros) no lugar do invólucro, e a tela de playlists guardadas passa a ela (a asserção dos testes dela intacta; o uso saiu de BRIDGE_USES); useFocusLikeAfterAnewDraw foi para react-bridge/ (com a opção keep, para a barra e os paginadores, que a antiga escrevia no lugar); a folha de ui/SheetWindow só sai do React quando termina de deslizar. Ficam à mão atrás de react-bridge/legacy/: a tabela de faixas, as janelas de editar e apagar série, a do álbum, a de adicionar ao inventário e a de classificar, e o controlador da sessão (JS). Dicionário i18n/en|pt/albums.js e ui.filter.*. models/seriesGroups.js e albumTrackRows.js (as regras que estavam dentro dos desenhistas); identityNotice virou identityReasonOf (a frase vem do dicionário). Saíram views/SeriesView.js, views/helpers/*, views/albums/*, components/series/(Header, EmptyState, EventHandler, GridRenderer, PhoneSheets), components/ui/(AlbumCardRenderer, AlbumPhoneCard, Pager, FilterToolbar, FilterSheet, LoadMoreButton, skeletons), base/Component.js e VirtualScrollObserver (≈ 3.4 mil linhas à mão), com as entradas deles no handMadeScreensBaseline. O teste igual-ao-de-antes passa nos 36 cenários; os testes das peças antigas foram levados.

## [2026-11-21 20:51] step — F75: o relatório do juiz sobre o «Clear Cache» (passou, sem P0 nem P1, 1 P2) e suas capturas entram no ramo
**Branch:** fix/f75-clear-cache-keeps-the-inventory-values
O juiz escreveu o relatório sobre 01d26d9; copiado como veio para `reports/audits/` e as capturas para `reports/evidence/F75/clear-cache-recheck/`. UAT-272 (melhoria, aberta pelo juiz): o rodapé ainda diz «Clear Cache» / «Cache Cleared!» embora agora guarde os valores do inventário e o câmbio; o texto visível não foi mudado, é do MJRP aprovar.

## [2026-11-21 20:45] step — F83 onda 5a: o teste «igual ao de antes» da tela de álbuns, vermelho (a tela em React ainda não existe neste commit)
**Branch:** claude/f83-wave-5a-albums-screen
test/screens/albums/Albums.sameAsBefore.test.tsx toca os 36 cenários na tela nova e compara cada página, o foco e o que a tela pediu ao que está fora com test/fixtures/albumsBeforeF83.json (que foi tirado de novo da tela antiga ainda de pé: o grupo das folhas passou a zerar a trava de rolagem da página entre os cenários, e um cenário ganhou o retrato da folha depois de virar o celular). Três provas de que ele acusa uma palavra, uma classe e um foco trocados, e uma diferença decidida e explicada (virar o celular com a folha aberta: o foco, por 250 ms). Falha hoje porque screens/albums/ não existe.

## [2026-11-21 20:41] step — F88: o relatório do juiz sobre o menu do celular (passou, sem P0 nem P1, 3 P2) e suas capturas entram no ramo; UAT-270 consertada, UAT-271 nova
**Branch:** fix/f88-phone-menu-equal-in-home-and-app
O juiz escreveu o relatório sobre 8c09860; copiado como veio para `reports/audits/` e as capturas para `reports/evidence/F88/phone-menu-equal/recheck/`. Dos três P2, o P2-1 (alisamento de fonte) foi consertado em e4f7c46. UAT-270 (os menus diferentes e o ícone do Start) passa a `fixed (F88: 5243644, 8c09860, e4f7c46)`. UAT-271, aberta pelo juiz: no iPhone SE a primeira tela da home mostra só uma fatia do caixote. UAT-263 ganhou a nota de que «Playlists» e «Inventory» também se tocam no app agora que os menus são um só.

## [2026-11-21 20:40] step — F88: o mesmo alisamento de fonte nos rótulos da barra de baixo, na home e no app (o P2-1 do juiz)
**Branch:** fix/f88-phone-menu-equal-in-home-and-app
Esta é a correção do próprio P2-1 do juiz da reconferência do menu do celular, feita depois de o relatório dele ter sido escrito: num Mac os rótulos da home saíam mais finos que os do app, porque o corpo da home alisa a fonte e o do app não. A barra passou a dizer o alisamento ela mesma (`.pbar{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}` em `bar-menu.css`), igual nas duas páginas; um teste em `phoneBarIsOneComponent.test.js` guarda a regra.

## [2026-11-21 20:24] step — F88: a barra de baixo do celular passa a ser opaca (UAT-270)
**Branch:** fix/f88-phone-menu-equal-in-home-and-app
Pedido do orquestrador: nas capturas do app o texto da tela aparecia por trás dos ícones e rótulos. Antes: `rgba(10,10,12,.92)` com desfoque, que só lê bem se o navegador pinta o desfoque. Agora: `#0a0a0c` opaco, a superfície do design system, igual na home e no app (um teste guarda). Rótulo `#b9b9c2` (10:1) e laranja `#fb923c` (8,7:1) leem-se sobre qualquer conteúdo. A doca da Start («No albums yet») já era translúcida (`rgba(8,8,10,.9)`, F76), não vem desta mudança e ficou como está. Medidas de novo no WebKit sobre o site construído: iguais na home e no app (iPhone 14 e SE); imagens regeneradas.

## [2026-11-21 20:22] step — UAT-267 registrada como consertada pelo agente (F75: ad88323)
**Branch:** fix/f75-clear-cache-keeps-the-inventory-values
A linha da UAT-267 passa de `open` a `fixed (F75: ad88323)`, como a UAT-266; o aceite é do MJRP.

## [2026-11-21 20:22] step — «Clear Cache» deixa os valores lidos do Discogs (F75, UAT-267)
**Branch:** fix/f75-clear-cache-keeps-the-inventory-values
O botão apagava o IndexedDB inteiro e levava junto as leituras de valor e o câmbio. Agora apaga por nome (`ALBUM_CACHE_KEY_PREFIXES`: `albumload:`, `userRanking:`, `spotify_enrichment:`, `artifacts/`) por `CacheManager.clearPrefixes`; ficam `inventoryvalue:` e `exchangerates:` (vencem sozinhos) e qualquer armazém futuro não nomeado. `behavior.md` (^app-clear-cache) diz o que apaga e o que guarda. Conferência em Chromium real: 15 de 15 (valor lido, Clear Cache, recarregar: o valor segue e não há aviso de espera; os caches de álbuns somem). Nenhum texto visível mudou.

## [2026-11-21 20:20] step — F83 onda 5a: o retrato da tela de álbuns antiga (36 cenários) antes de apagá-la; a onda 5 dividida em 5a e 5b
**Branch:** claude/f83-wave-5a-albums-screen
O registro das páginas que a tela de álbuns à mão desenha (computador e celular: a espera da primeira carga, séries chegando, grade e lista, a tabela de faixas ordenada por coluna, uma série só, busca, cada filtro e cada ordem, páginas e tamanho da página e o rolar, Load N more, falhas de série (todos e alguns), os estados vazios, os botões do cabeçalho, remover álbum com os três caminhos, as folhas do celular, virar o celular), com onde fica o foco e o que a tela pediu ao que está fora (a carga, as janelas que ficam à mão, as perguntas, os avisos): test/support/albumsScenarios.js (os cenários, uma só vez para a antiga e a nova), test/fixtures/albumsBeforeF83.json e o registro reports/evidence/F83/wave-5a/capture-before.test.js. O retrato saiu igual em duas rodadas. Decisão do orquestrador, registrada no plan.md: a onda 5 se divide como o mapa propõe; esta é a 5a (a tela); a 5b (as janelas) não foi começada.

## [2026-11-21 20:10] review — F83 onda 4: o juiz independente aprova a tela Start em React (sem P0, sem P1, 1 P2)
**Branch:** integrate/staging-2026-11-21
Relatório `reports/audits/2026-11-21-mjrpalbumblender-v0-react-start-visual-parity-recheck.md` e capturas em `reports/evidence/F83/wave-4/recheck/`, escritos pelo juiz (não por quem construiu) sobre o commit 9e57182, guardados como vieram, menos as capturas passo a passo das rodadas (`captures/run*/`, cerca de 70 MB), que ficam fora do git, na pasta de rascunho da sessão do orquestrador. 82 passos por rodada a 1280 e 393: HTML, foco, cursor, título, endereço e chamadas ao catálogo iguais; os pixels diferentes são ruído (re-raster zera). P2, diferença conhecida: se o arquivo da própria tela Start não baixa, a nova mostra «No connection» (e «Try again» recupera), onde a antiga abria a tela; é o custo aceito das telas carregadas sob demanda. Não visto: Apple Music de verdade (falta uma busca de artista e uma lista colada no site publicado), Safari, iPhone real.

## [2026-11-21 20:09] step — duas issues do MJRP sobre o menu novo do app (F88): o cabeçalho e a home fora do menu
**Branch:** wip/inventory-values-reread-investigation
Palavras do MJRP (2026-11-21): «acho que precisamos melhora o header da app tb» (UAT-268: no celular o cabeçalho do app — a marca, o nome da tela ao lado, a conta — precisa de redesenho na linguagem da home nova; melhoria, passa por rodada de design) e «a home parece algo muito separado por nao estar no meu» (ele diz o menu; UAT-269: a home não é item do menu e parece à parte; melhoria, rodada de design sobre como chegar à home de dentro do app além da marca). Só registradas; nada desenhado nem construído.

## [2026-11-21 20:10] step — investigação: o valor do inventário lido do Discogs fica no navegador? (F75)
**Branch:** wip/inventory-values-reread-investigation
Palavras do MJRP (2026-11-21): «temos um bug no inventory, a questao dos preços não é persistida no banco né, toda vez tenho que clicar no read them, é by design isso ou bug?». Achado: a leitura fica em IndexedDB por seis horas, por pessoa e por item, e sobrevive a recarregar e a fechar a aba (nove conferências em Chromium real, servidor falso, sem Firebase nem Discogs); passadas as seis horas, o app pede o clique em «Read them now» e nunca lê sozinho (REQ-09, desenho); é por aparelho (desenho). Defeito pequeno: «Clear Cache» apaga também as leituras de valor, contra o que o comportamento diz (UAT-267). Opções para o desenho, sem construir, no relatório `reports/audits/2026-11-21-mjrpalbumblender-v0-inventory-values-reread.md`. Verificação: `test/visual/inventoryValuesStayInBrowser.mjs`.

## [2026-11-21 20:05] session — F88: o menu de baixo do celular é UM só, o mesmo na home e no app; o Start com o ícone «Go» (UAT-270)
**Branch:** fix/f88-phone-menu-equal-in-home-and-app
Palavras do MJRP (visto no iPhone dele, 2026-11-21): «Os menus não eram pra ser iguais?»; depois «no iphone o start tá com ícone de home mas ele não é home»; «o start poderia ser um ícone de "Go"»; «o icone pde ser Go mesmo nao precisaria traduzir num primeiro momento». O olho dele vence o juiz, que tinha aceitado as duas alturas «como o desenho aprovado as traz». Decidido pelo orquestrador (revisável): um componente, os mesmos pixels. Fileira de 17 px de barras no alto, depois o ícone de 24 px sobre cada rótulo (Syne 12/700, o atual em laranja, o trecho aceso em fogo), 76 px no total mais a área segura. As regras moram só em `public/splash/bar-menu.css`, sob `.pbar` (a classe que a home e o app põem na barra de baixo); os ícones, em `public/splash/phoneBar.js`; o app desenha a barra com `renderPhoneBar` (`barMenu.js`), a mesma função da barra do computador, e a home injeta os ícones em `menu.js`. Saíram as regras `.phone-tabbar*` de `mobile.css` e as regras da barra no `<style>` da home. O Start é a palavra «Go» desenhada em traços (G e o), sem fonte e fora do dicionário de textos traduzíveis (fica «Go» em português também); nenhum outro lugar usava a casa para o Start. Testes primeiro: `test/splash/phoneBar.test.js`, `test/architecture/phoneBarIsOneComponent.test.js`, `phoneBarLabelsStayOffTheBars` e `barMenu`/`PhoneShell` reescritos; `test/visual/phoneBarLabels.mjs` agora compara barra, fileira, ícone, rótulo e fonte da home com os do app. O aviso verde «Successfully signed in!» sobre o título da tela e o nome «Start» ao lado da marca não vêm do menu novo: o aviso é um balão sob a barra de cima desde a F76 (finding 10), e o nome da tela no topo do celular é o desenho da F76 que a proposta da F88 manteve. A barra de baixo agora é opaca (`#0a0a0c`, a superfície do design system; antes `rgba(10,10,12,.92)` com desfoque): o texto da tela aparecia por trás dos ícones e rótulos quando o desfoque não era pintado, e o rótulo (`#b9b9c2`, 10:1) e o laranja (`#fb923c`, 8,7:1) leem-se sobre qualquer conteúdo. A doca da Start («No albums yet») já era translúcida (`rgba(8,8,10,.9)`, F76), não vem desta mudança e ficou como está. Evidência: `reports/evidence/F88/phone-menu-equal/`. Aberto: UAT-270.

## [2026-11-21 19:58] step — F83 onda 5: o mapa das telas de álbuns (TASK-22) e o tempo de redesenho de hoje; a onda não foi construída
**Branch:** claude/f83-wave-5-albums
O mapa (map-wave-5-albums.md): 49 arquivos e 8.569 linhas alcançados, 4.765 só desta tela; a auditoria das quatro lojas; como a tela redesenha hoje; os pontos difíceis (a janela de editar série e o seletor, a tabela de faixas partilhada com o inventário, a janela de classificar com o sortablejs); os estados a 1280 e a 393; o Apple Music como único caminho de catálogo. Medição na tela de hoje com 300 capas (grade a 1280: 48,4 ms em 25 séries de 12 e 38,3 ms em uma de 300; a 393 de 16 a 20 ms; a lista do computador não foi reconhecida pelo roteiro e não vale como teto). A onda 5 não foi construída: a decisão de dividi-la (a tela e as janelas) é do MJRP, recomendação: dividir. Sem código de produto.

## [2026-11-21 19:41] session — publicado em produção: a home nova (F80), o menu novo do topo (F88) e os avisos de falha (F52, F69)
**Branch:** main
Palavras do MJRP (2026-11-21): «Pública mas o menu não está completo no iPhone ainda né?»; depois de ver que o menu de baixo da home e o do app diferem no iPhone, «Os menus não eram pra ser iguais?»; e à pergunta se segurava a publicação, «mas publica sim pls, pra uma primeira iteracao está ótimo». Site publicado da `main` (`3f3393b`, `/assets/main-TMIDBwtr.js`) pelo `deploy-site.sh`, na fila do Album Blender; conferido: `/`, `/home`, `/start` e `/albums` respondem 200, o `app.html` aponta o script novo, `/api/musickit-status` responde 200. Aberto, em conserto no ramo `fix/f88-phone-menu-equal-in-home-and-app`: no celular o menu de baixo deve ser o mesmo na home e no app.

## [2026-11-21 19:36] step — F83 onda 5: as lições das ondas 0 a 4 num arquivo só (wave-lessons.md)
**Branch:** claude/f83-wave-5-albums
Foco e teclado, o link que navega uma vez, a auditoria das lojas, a prova (Firebase bloqueado, antiga contra antiga, WebKit no build), o Apple Music em primeiro lugar, as peças partilhadas e o ritual de fechar uma onda, mais as notas que a onda 4 deixou para a onda 5. Para as ondas seguintes lerem um arquivo em vez de redescobrir.

## [2026-11-21 19:33] step — UAT-266 na forma das partes (a issue que o MJRP viu no iPhone)
**Branch:** main
A linha da UAT-266 trazia rótulos em negrito que não são partes («Causa», «Conserto») e «Aberta por» com o nome e a citação; a conferência da estrutura reprovava. Os rótulos viraram texto e «Aberta por» ficou `humano`; as palavras do MJRP seguem na coluna «Reportado por».

## [2026-11-21 19:31] step — F83 onda 4: o texto em pedaços sai em um nó só, como na antiga (achado do navegador: 136 pixels na linha da dica)
**Branch:** claude/f83-wave-4-start
A dica, a linha do visitante, o título do painel, a linha «foi salva», o «Saving your series…», o aviso do nome e o «ready» da lista levam as palavras e os espaços num nó de texto só, como a antiga (o React os dava em nós separados e o Chromium compõe as pontas de outro jeito). Mais um teste: fechar a folha com um Undo pendente mostra a faixa (diferença de propósito).

## [2026-11-21 19:30] step — F83 onda 4: a prova no navegador, o peso, os documentos
**Branch:** claude/f83-wave-4-start
172 conferências por corrida no Chromium (1280 e 393), a antiga (c343830) contra a nova, com o Firebase Auth e o Firestore bloqueados (nenhuma conta anônima em produção): o HTML, a folha e o foco iguais em todos os passos; 30 capturas com 2 a 60 pixels (maior diferença por canal 19 de 255) e 3 de 24 mil pixels na moldura do topo que a antiga contra a antiga também tem; controles de antiga contra antiga com e sem transições (3 a 7 pixels, e a moldura). Uma diferença de propósito afirmada: com um Undo pendente, fechar a folha do celular mostra a faixa. Script principal 285.730 B (294.773 antes; teto 285.874 B); arquivo da Start 12.176 B; placar: 68 arquivos à mão (73), 12.266 linhas (13.348), 653 textos fora do dicionário (729). Evidência: reports/evidence/F83/wave-4/.

## [2026-11-21 19:30] step — F80 e F88: o terceiro relatório do juiz (passou, sem P0 nem P1) e suas capturas entram no ramo; cinco linhas na uat.md
**Branch:** feat/f88-top-menu-build
O juiz escreveu o relatório sobre 6d518c2; copiado como veio para reports/audits/ e as capturas para reports/evidence/F88/recheck-3/. UAT-262 a UAT-265: os três P2 do juiz e o nome não confirmado da chave do MusicKit (abertas); UAT-266: o defeito do iPhone achado pelo MJRP, já consertado em a4b3933.

## [2026-11-21 19:15] decision — o MJRP escolheu «A» para a barra do computador: 620 px centrados na página, só «Entrar» no cabeçalho da home (F88)
**Branch:** feat/f88-top-menu-build
Pergunta ao MJRP (opções do juiz): (a) 620 px, a largura aprovada na v4, centrada na página, com o cabeçalho da home só com «Entrar» e «Abrir o app» no meio da página; (b) 620 px encostados à esquerda; (c) 412 px centrados, como construído. Resposta do MJRP (2026-11-21): «A». Construído: `--bar-w` = min(620 px, 100vw − 502 px), centrada, no mesmo x na home e no app, sem e com conta; a home tira «Abrir o app» do cabeçalho em toda largura do computador (o botão do corpo da página continua); o idioma e o botão da conta ficam. Abaixo de 1122 px a barra encolhe sem encostar nos lados nem quebrar rótulos, até 900 px (398 px). Medido (x, largura; as quatro combinações iguais em cada largura): 900 px: 251, 398; 1000: 251, 498; 1100: 251, 598; 1280: 330, 620; 1600: 490, 620. Testes atualizados (`barIsCentredOnThePage`); capturas em `reports/evidence/F88/bar-620/`.

## [2026-11-21 19:12] session — F88: a Apple Music só é perguntada em segundo plano a quem já a autorizou; grades de 3 colunas no tablet; ⟲ com vão (P2 da segunda reconferência)
**Branch:** feat/f88-top-menu-build
Apple Music: o sinal de «autorizada antes» é lido do armazenamento do navegador, sem carregar o script da Apple: a marca do próprio app `albumBlender.appleMusic.authorized` (gravada ao conectar e na resposta «conectada», tirada ao desconectar e na resposta «não conectada»; só o valor 1, nenhum dado pessoal) ou a chave `music.*.media-user-token` que o MusicKit guarda (o nome da chave é de memória, não conferi num navegador com conta). Sem o sinal: nada é carregado da Apple, o botão fica neutro, e o estado é perguntado ao abrir o painel ou a folha, com «Checking…». Com o sinal: pergunta em segundo plano, como antes. Uma falha ou um script bloqueado não escreve no console (a verificação inicia o MusicKit em modo quieto; o `appleState` não registra); o estado «Could not connect» aparece onde a pessoa perguntou. Grades: de 640 px, Albums, resultados da Start e o seletor de séries têm 3 colunas no desenho do celular (a 800 px: 3 colunas de 256 px). ⟲: caixa de 12 px, vãos de 8,4 e 6,9 px a 900 px e de 11,8 e 11,1 px de 1000 px para cima. A mudança do corte do celular (767 para 899 px) fica registrada na F76 (REQ-12) e no design-system C6 como feita pela F88, pendente do aceite do dono.

## [2026-11-21 19:10] step — F83 onda 4: a tela Start em React (TASK-21); a Home à mão e os pedaços só dela saem
**Branch:** claude/f83-wave-4-start
Em public/js/screens/start/: Start, Stage, Results, Dock (com a folha do celular sobre ui/SheetWindow, agora com a variante cheia), PasteList, Equalizer, StartController (o controlador reescrito em TS com os mesmos nomes: o sensor visual da F84 conduz a tela por window.controller), StagingArea, homeSeries e homePaste (as regras com texto, vindas de models/), text, index; dicionário i18n/en/start.js e pt/start.js. A rota baixa o arquivo da tela na abertura, junto do login (é a primeira tela). Saíram views/HomeView.js, controllers/HomeController.js e components/home/* (1.054 linhas à mão); DiscographyRenderer perdeu a capa da Start (111 para 81 linhas); o seletor partilhado ganhou emptyQueryMessage e models/albumPicker.js badgeCodesOf. O teste igual-ao-de-antes passa nos 30 cenários (páginas, foco e chamadas ao que está fora), e acusa uma palavra, uma classe e um foco trocados; os testes antigos da Home foram levados por test/support/startHarness.js. Suíte inteira: 336 arquivos, 4.180 testes.

## [2026-11-21 19:08] session — F88: no iPhone os rótulos da barra de baixo da home ficavam em cima das barras (P1 do dono, achado na prévia)
**Branch:** feat/f88-top-menu-build
Palavras do MJRP (2026-11-21): «Na prévia do menu no cel, os copies dos menus estão em cima das barras de gráficos». Reproduzido no WebKit (Playwright, `iPhone 14` e `iPhone SE`) só na página CONSTRUÍDA (`vite build`), na barra de baixo da HOME (44 a 46 interseções, vão de −17 px, em PT e EN; o ⟲ também aparecia): o Vite coloca a folha `bar-menu.css` DEPOIS do `<style>` da home, e as regras do celular da home (`.ms .stop`, `.eqbar`, `.ms .flipmark`), de mesma especificidade que as dela, perdiam; no servidor de desenvolvimento a ordem é outra e nada aparecia (por isso o Chromium e o dev passaram). A barra do app não tinha o defeito. Conserto: as regras da home no celular passam a `.thread …` (vencem em qualquer ordem); a parada deixa 36 px acima do rótulo (as barras ocupam os 26 primeiros) por padding, e a altura é piso (`min-height`), não fixa; o mesmo na barra do app (`min-height` e padding-top de 14 px). Medido no WebKit: as duas barras com 65 px (iPhone 14 e SE), vão entre barras e rótulos ≥ 6 px, alvos ≥ 44 px, também com texto a 130%. Teste novo: `test/architecture/phoneBarLabelsStayOffTheBars.test.js` e o sensor `test/visual/phoneBarLabels.mjs` (WebKit sobre o site construído). Não reproduzi o tamanho de texto do iOS (o WebKit do Playwright não o tem); simulei 130% por CSS.

## [2026-11-21 19:04] review — F83 onda 3: o juiz independente aprova a moldura do site em React (sem P0, sem P1, 3 P2)
**Branch:** integrate/staging-2026-11-21
Relatório `reports/audits/2026-11-21-mjrpalbumblender-v0-react-shell-visual-parity-recheck.md` e capturas em `reports/evidence/F83/wave-3/recheck/`, escritos pelo juiz (não por quem construiu) sobre o commit 1e3c14b, guardados como vieram. 90 pares antigo/novo; as duas diferenças de propósito são melhorias; os pixels do canto são ruído. P2: a primeira tela chega 0,4 s depois em rede lenta (React na largada); a janela de entrar segue sem Escape nem retorno de foco, como a antiga; as provas automáticas devem bloquear o Firebase de produção, para não criar contas anônimas.

## [2026-11-21 18:50] step — F80 e F88: o segundo relatório do juiz (reconferência 2) e suas capturas entram no ramo, sem mudança
**Branch:** feat/f88-top-menu-build
O juiz escreveu o relatório sobre c51abfc; copiado como veio para reports/audits/ e as capturas para reports/evidence/F88/recheck-2/.

## [2026-11-21 18:47] step — F83 onda 4: o teste «igual ao de antes» da Start, vermelho (a tela em React ainda não existe)
**Branch:** claude/f83-wave-4-start
test/screens/start/Start.sameAsBefore.test.tsx toca os 30 cenários na tela nova e compara cada página e o foco com test/fixtures/startBeforeF83.json; mais três provas de que ele acusa uma palavra, uma classe e um foco trocados. Falha hoje porque screens/start/ não existe.

## [2026-11-21 18:47] step — F83 onda 4: o retrato da tela Start antiga (30 cenários) antes de apagá-la
**Branch:** claude/f83-wave-4-start
O registro das páginas que a Start à mão desenha (computador e celular: a primeira visita, a digitação, a busca, a discografia e os filtros, as capas escolhidas e o Undo, o painel de ordem, o nome, criar, a falha de gravar, a lista colada, o visitante, a folha do celular, virar computador e voltar), com onde fica o foco depois de cada passo e as chamadas ao que está fora (catálogo, gravação, navegação, janela de entrar): test/support/startScenarios.js (os cenários, uma só vez para a antiga e a nova), test/fixtures/startBeforeF83.json (o que a antiga desenhou) e o registro reports/evidence/F83/wave-4/capture-before.test.js. O foco da antiga: a capa e o chip ficam com o foco; no dock o foco volta por seletor; na folha do celular as linhas são refeitas e o foco vai para a página.

## [2026-11-21 18:44] step — F83 onda 4: o mapa da tela Start (TASK-20)
**Branch:** claude/f83-wave-4-start
A antiga Home em 1.054 linhas de desenho à mão (5 arquivos) mais o controlador de 409: o que a tela lê (só o userStore; a série e o seletor são do controlador, que troca as listas), como ela redesenha (o dock e a grade de capas; o resto escreve no lugar), o foco que o dock devolve por seletor, a folha do celular, o sensor visual da F84 que conduz a tela por window.controller (os nomes ficam), o arquivo da tela baixado na abertura por ser a primeira tela, os textos que estão dentro de models/ e saem pelo dicionário, e o catálogo (Apple Music; o Spotify não é tocado). Mapa: docs/specs/features/F83-site-screens-in-react/map-wave-4-start.md.

## [2026-11-21 18:34] step — F83 onda 3: a prova no navegador, o peso, os documentos e o conserto do «voltar ao topo»
**Branch:** claude/f83-wave-3-shell
133 conferências no Chromium (1280, 900, 393), 130 passaram; as 3 são 2 a 12 pixels no canto do topo à direita; antiga contra antiga: 0 pixel, com e sem transições. O navegador achou que o «voltar ao topo» parava no meio com um toque de verdade (o React devolve a rolagem quando um desenho tira o foco): o botão solta o foco antes de rolar. Primeiro carregamento com o React na abertura: +85 kB e cerca de +0,4 s (rede lenta, CPU x4). Mapa, tarefas 18, 19, 30 e 31, arch.md e design-system.md.

## [2026-11-21 18:32] step — F88: o teste de onPhoneChange usava 852 px como «não celular»; agora o corte é 899 px
**Branch:** feat/f88-top-menu-build
Só o teste: o celular deitado (852 px) passa a ser celular, então o teste vira de 393 para 1024 px. Pego na suíte inteira.

## [2026-11-21 18:30] step — F88: provas no navegador dos consertos do juiz e dois testes antigos ajustados aos novos cortes
**Branch:** feat/f88-top-menu-build
Provas em `reports/evidence/F88/fixes/` (393, 800 e 1280, sem e com conta, costuras de teste do `reports/evidence/F88/`, nada de login real): `fixes.json` (rótulo e pontos do botão da conta pendente e depois, o painel, o foco após Disconnect, as três rotas de séries, sem rolagem lateral em 4 telas × 3 larguras × 2 estados, sem erro de console do menu), `p3.json` (800 px: o desenho do celular nas duas páginas), `m1.json` e `p2.json` (a barra a 900, 1000, 1280 e 1600 px, e os vãos do ⟲). Os testes `isPhone.test.js` e `outsideTextIsText.test.js` (a foto da conta não é mais desenhada) acompanham o corte de 899 px e o avatar de inicial; apareceram na suíte inteira.

## [2026-11-21 18:27] step — F88: testes e código de /artists, /genres e /tracks acendendo Albums
**Branch:** feat/f88-top-menu-build
Testes primeiro: `currentTab('/artists')` é Albums (PhoneShell) e a barra do computador acende Albums nas três rotas (barMenu); a rota que nenhum item possui continua sem acender nada. `phoneTabs.js` ganhou as três rotas em `under` de Albums. A linha de baixo (subRow) continua só em Albums e Playlists.

## [2026-11-21 18:26] session — F88: no computador, o avatar é a inicial, «Sign In» é o botão fantasma da home e confirmar «Disconnect» não fecha o painel (P2-4 e P2-5 do juiz)
**Branch:** feat/f88-top-menu-build
Avatar: a inicial do nome em laranja, como no celular e no protótipo, nunca uma imagem (nem a foto da conta nem a imagem antiga do MJRP); a função da inicial foi para `navigation/account.js`, usada pelo celular e pelo computador. «Sign In»: o botão fantasma da home (`.top-menu__signin`, borda branca 62%, 44 px, Syne 16 px). Disconnect: um clique numa janela aberta pelo painel (`.app-modal`) não conta mais como «fora do painel», e o foco volta ao botão da mesma linha. Testes primeiro (TopNav, AuthNav.menu, connections).

## [2026-11-21 18:27] session — F88: /artists, /genres e /tracks acendem Albums (P2-6 do juiz)
**Branch:** feat/f88-top-menu-build
Decisão pelo inventário do menu de hoje: o item «Music Series» da produção fica aceso (`isSeriesActive`) nessas três rotas, e é o item que a parada Albums substitui; então Albums as possui, na barra do computador e na aba do celular. O nome do topo do celular (Series by Artist…) não muda.

## [2026-11-21 18:22] session — F88: a barra fica no meio da PÁGINA, igual na home e no app, com uma largura só (P2-1 e P2-3 do juiz)
**Branch:** feat/f88-top-menu-build
A terceira via do juiz, ajustada ao que cabe: a barra é posicionada no meio da página (`left:50%`), fora do fluxo do lado da conta, com a largura `--bar-w` = min(412 px, 100vw − 526 px), escrita uma vez em `public/splash/bar-menu.css`; `top-menu.css` (app) e `splash.html` (home) dizem o mesmo. 620 px centrados não cabem: a 1280 px o lado direito da home sem conta (idioma, Sign in, Open the app) começa em x = 858, e uma barra de 620 px termina em 950; 412 px é o que cabe, centrada (x = 434 a 846). Abaixo de 1280 px a home tira o botão «Open the app» do cabeçalho (o do corpo da página continua), como já fazia no celular, para a barra centrada caber desde 900 px. A barra não anda mais entre sem e com conta nem entre home e app (medido a 900, 1000, 1280 e 1600 px, as quatro combinações). O ⟲ é uma caixa de 16 px a 59%: vãos de 9,8 e 9,1 px até os rótulos a 1280 px (6,4 e 4,9 px a 900). Com o desenho do celular até 899 px, a largura da barra do app não depende mais da conta onde ela aparece. Teste primeiro: `test/architecture/barIsCentredOnThePage.test.js`.

## [2026-11-21 18:16] session — F88: de 768 a 899 px a home e o app usam o MESMO desenho, o do celular (P2 do juiz)
**Branch:** feat/f88-top-menu-build
Escolha: o app usa o desenho do celular (topo de 56 px, marca de 22 px, barra de baixo de 65 px) até 899 px, o corte que a home já tinha; a outra via (a barra do app no topo da home a partir de 768 px) não cabe: a marca de 181 px, a barra e o lado da conta (Sign in e Open the app) não cabem em 736 px sem sobrepor rótulos, que foi o que o construtor anterior mediu. O corte vira 899 px no CSS do celular (mobile.css e mobile/*.css), em `isPhone.js` e no `UserRankModal`; o `md` do Tailwind passa a 900 px (`tailwind.config.js`) para uma tela nunca misturar a moldura do celular com o conteúdo do computador. Testes primeiro (a fitness function do celular, `md` = 900). Medido a 800 px (Albums, Playlists, Inventory, Blend, Start; sem e com conta): topo 56 px, marca 22 px, barra de baixo y = 835, igual à da home; sem rolagem lateral. Muda a regra «768 px para cima não muda» da F76 (REQ-12) para «900 px para cima»; `docs/specs/design-system.md` C6 atualizado.

## [2026-11-21 18:12] session — F88: o botão da conta não nega mais a Apple Music (P1 do juiz): o estado é perguntado uma vez, em segundo plano, com a página ociosa
**Branch:** feat/f88-top-menu-build
Novo `navigation/appleState.js`: uma resposta só (desconhecido, conferindo, conectada, não conectada, falhou), pedida uma vez por `checkAppleWhenIdle` (requestIdleCallback com prazo de 4 s; sem ele, 1,5 s; só depois do `load`). O botão mostra um estado neutro até a resposta (sem ponto da Apple Music, sem «Nothing connected», `data-apple="pending"`); o painel e a folha do celular leem a mesma resposta, com «Checking…» só enquanto pendente. Testes primeiro (pendente, autorizada antes, não autorizada, falhou, nada diz «Nothing connected» enquanto pendente). Peso: o script principal de `vite build` foi de 1.096.195 para 1.097.346 bytes (+1.151 B, +0,1%), 17 arquivos nos dois, nenhum pedido novo antes da primeira pintura.

## [2026-11-21 18:07] step — F80 e F88: o relatório do juiz da reconferência visual e suas capturas entram no ramo, sem mudança
**Branch:** feat/f88-top-menu-build
O juiz (agente separado) escreveu o relatório (fail, 0 P0, 1 P1, 6 P2) sobre 481ec94; copiado como veio para reports/audits/ e as capturas para reports/evidence/F88/recheck/.

## [2026-11-21 18:03] step — F83 onda 3: a moldura do site em React (TASK-19): barra do topo, rodapé, moldura do celular, menu, janela de entrar
**Branch:** claude/f83-wave-3-shell
Em public/js/shell/: TopNav, SeriesDropdown, Account, SpotifyConnect, Footer, PhoneShell, PhoneMenu, LoginWindow, Shell (startShell: três raízes, uma para #header-container, uma para #footer-container e uma sem lugar que escreve no body); três lojas pequenas (screenName, loginWindow, discogsNotice) e utils/isSignedIn.js para as telas antigas falarem com a moldura sem importar shell/; dicionário shell em inglês e português. Os 10 arquivos à mão (1.402 linhas) e os testes deles saíram; 47 cenários da moldura antiga contra a nova, mais os testes levados. react-vendor passa a ser baixado na abertura (reactAtStart true; teto do script principal 290.750 para 294.897 B: o script principal cresceu 4.147 B); as telas do menu em React descem em segundo plano (prefetchScreens volta ao app.js). Diferença: o chevron da gaveta gira, não a nota; a barra segue o endereço.

## [2026-11-21 17:55] session — estado do dia: duas linhas (home e menu para produção; React na prévia), `## Now` atualizado
**Branch:** main
`MEMORY.md ## Now` reescrito com as duas linhas de trabalho, os dois endereços de prévia, o que está na `main` sem publicar e o que espera o MJRP.

## [2026-11-21 17:45] step — F83 onda 3: o retrato da moldura antiga (47 cenários) antes de apagá-la
**Branch:** claude/f83-wave-3-shell
O registro das páginas que a barra do computador, o rodapé, a moldura do celular, o menu e a janela de entrar à mão desenham (computador a 1280 e a 900, celular a 393), com as chamadas ao que está fora (login, Spotify, avisos, perguntas, medição): test/support/shellScenarios.js (os cenários, uma só vez para a antiga e a nova), test/fixtures/shellBeforeF83.json (o que a antiga desenhou) e o registro reports/evidence/F83/wave-3/capture-before.test.js. O jsdom responde errado a querySelector('#id') quando o id se repete na página (o botão do Spotify da barra e da gaveta): o registro usa a resposta do navegador (scopedIdLookup).

## [2026-11-21 17:40] step — F88: o status derivado da spec (Draft para In Progress), gravado pelo hook de commit
**Branch:** feat/f88-top-menu-build
O hook de commit derivou o status da F88 ao começar a construção; só registro, sem mudar a spec.

## [2026-11-21 17:39] session — F88: o estado verdadeiro do Apple Music, a barra de baixo igual à da home, e um ponto de quebra só (não cabe na home)
**Branch:** feat/f88-top-menu-build
Apple Music: o MusicKit guarda a autorização entre visitas e só diz depois de iniciado (music.isAuthorized); MusicKitAuth.checkConnection() inicia o MusicKit e lê; o painel (ao abrir) e a folha do celular (ao abrir) perguntam, com «Checking…» antes, «Connected», «Not connected» ou «Could not connect» + «Try again»; a carga da página não muda; ordem alfabética. Testes primeiro (connections, MusicKitAuth.connection, AuthNav.menu, PhoneMenu). /api/musickit-status só diz se o servidor tem a chave, não a autorização da pessoa. Barra de baixo do celular: --phone-tabbar-h de 68 para 64 px: 65 px como a da home (medido). Ponto de quebra: a home com a barra no cabeçalho a 800 px sem conta fica com paradas de 31 px e rótulos de 33 a 48 px (sobrepõem), então a home segue até 899 px (tentei, medi e desfiz) e a passagem entre 768 e 899 px continua mudando de forma; evidência em reports/evidence/F88/ (apple-*, heights.json, passage-out-800.png).

## [2026-11-21 17:39] decision — o MJRP usa o Apple Music, não o Spotify: o estado do Apple Music no menu tem de ser o verdadeiro (F88)
**Branch:** feat/f88-top-menu-build
Palavras do MJRP (2026-11-21): «eu pessoalmente, uso Apple Music e não Spotify». Como foi entendido (orquestrador): quem autorizou o Apple Music numa visita anterior não pode ver «não conectado»; o painel e a folha listam Apple Music primeiro (ordem alfabética).

## [2026-11-21 17:38] step — F83 onda 3: o mapa da moldura (TASK-18)
**Branch:** claude/f83-wave-3-shell
Barra do topo, rodapé, moldura do celular, menu, janela de entrar: 1.402 linhas à mão em 10 arquivos; o que redesenha e quando; as três lojas pequenas para as telas antigas falarem com a moldura; o achado de que a barra do computador de hoje não segue o endereço (decidido: a nova segue, revisável); onde o seletor de idioma entra.

## [2026-11-21 17:33] session — F88: prova no navegador (1280 e 393, sem conta e com a conta de teste), documentação e tarefas
**Branch:** feat/f88-top-menu-build
Evidência em reports/evidence/F88/ (shoot.mjs, compose.mjs, measures.json, capturas): a barra da home e a do app a 1280 px têm a mesma altura (72), a mesma marca (181 x 30 px a 16 px da borda) e a mesma posição da barra (209,2 px) e da fila de barras, sem e com conta; o item atual aceso nas sete rotas nos dois tamanhos; o painel e a folha do celular abertos com Spotify e Apple Music; sem rolagem para o lado; sem erro no console além dos esperados da bancada (login anônimo e Firestore bloqueados). behavior.md, info-arch.md e design-system.md em dia, o que espera aceite do MJRP marcado «pendente»; tasks.md: TASK-00 a 03 marcadas, TASK-04 (produção junto com a home) aberta.

## [2026-11-21 17:33] session — F88: ajustes do menu depois da prova no navegador (Sign In de 44 px, contraste do painel, teste de segurança do painel)
**Branch:** feat/f88-top-menu-build
Da prova a 1280 e 393: o botão «Sign In» da barra do computador passa a 44 px (era 36, o botão pequeno do app), o «Signed in as» do painel sobe de 50 % para 70 % de branco (contraste AA), e o teste de segurança do texto de fora troca o menu em gaveta (que saiu) pelo painel. A barra do computador ficou à esquerda, depois da marca, também na home (margin do .ms-desk), para a posição não depender do lado da conta.

## [2026-11-21 17:26] step — F83 onda 2: o ponto de partida do Tab volta ao começo da tela depois de uma ação (conferido no navegador contra a tela antiga)
**Branch:** claude/f83-wave-2-playlists-edit
No navegador (1280 e 393, a tela antiga em 5011 e a nova em 5012): migalhas com Cancelar, 1 pergunta e 1 navegação nas duas; depois de remover pelo X com Enter e de desfazer com Enter, o foco é a página e o próximo Tab vai ao «Start» das migalhas nas duas; no celular, depois de mover e de remover pela folha, o foco é a página nas duas. Para o X, o `blur` sozinho deixava o Tab recomeçar no controle; `useFocusLikeAfterAnewDraw` agora põe o foco na tela e solta, que é de onde o Tab recomeça. Servidores parados.

## [2026-11-21 17:21] step — F83 onda 2: as migalhas navegam uma vez só; o foco depois de cada desenho volta à página num lugar só (achados do juiz: 1 P1, 2 P2)
**Branch:** claude/f83-wave-2-playlists-edit
P1: `ui/Breadcrumb.tsx` para a propagação do clique, então só `navigate` do ponte move (antes o ouvinte de links do roteador movia de novo e o guarda de sair perguntava duas vezes ao cancelar); a única tela que usa a migalha é a das playlists (a dos salvos não usa). P2 (celular e computador): `useFocusLikeAfterAnewDraw` em `Playlists.tsx` solta o foco de um controle (não de campo, folha ou janela) depois de cada desenho e põe o ponto de partida do Tab no começo da tela, como a tela antiga que se desenhava de novo; o `blur` só da remoção em `PlaylistCards.tsx` saiu. Testes vermelhos sem as correções (3 falhas) em `test/ui/Breadcrumb.test.tsx` e `Playlists.sameAsBefore.test.tsx`.

## [2026-11-21 17:16] review — F83 onda 2: a reconferência visual independente da tela das playlists em React (relatório do juiz, copiado sem mudança)
**Branch:** claude/f83-wave-2-playlists-edit
O juiz escreveu o relatório `reports/audits/2026-11-21-mjrpalbumblender-v0-react-playlists-visual-parity-recheck.md` e as capturas em `reports/evidence/F83/wave-2/recheck/`; copiados aqui sem mudança. Veredito dele: não passa, 0 P0, 1 P1 (as migalhas perguntam duas vezes ao cancelar), 2 P2 (o foco depois de uma ação, no celular e no computador); o resto igual à antiga e o ruído de pixels se sustenta.

## [2026-11-21 16:43] session — F88: o menu do topo do app na linguagem da home, construído no código de hoje (Transformar no computador, Elevar no celular)
**Branch:** feat/f88-top-menu-build
Computador (a partir de 768 px): a barra da home continua no app (marca em fogo, cinco destinos sobre uma fila de barras, ⟲, o fogo na tela atual, aria-current em toda rota, acompanhando o roteador), uma linha de baixo em Álbuns e em Playlists no lugar do menu suspenso, e um painel só de conta e conexões com Spotify e Apple Music (estados: conectado, não conectado, conectando, falhou) ligados aos serviços de verdade. Celular: a estrutura de hoje com a cara da home (marca em fogo, a barra de baixo com ícones e a fila de barras da home, o item atual em #fb923c, a folha «Menu» com as duas conexões). A barra do computador e a da home dividem public/splash/bar-menu.css e ficam as duas à esquerda, depois da marca (antes a da home andava até 92 px entre sem conta e com conta). Saíram a gaveta antiga, o SeriesDropdown e o SpotifyConnectButton. Textos do menu num lugar só (menuText.js). Testes primeiro: barMenu, subRow, connections, TopNav; os de navegação existentes atualizados, nenhum apagado sem o que testavam ter saído. Sem chave de idioma no app (a F81 traz).

## [2026-11-21 16:43] session — F88: o Apple Music diz se está conectado e desconecta (a base do painel de conexões do menu)
**Branch:** feat/f88-top-menu-build
MusicKitAuth ganha isConnected(), unauthorize() e o sinal applemusic-auth-change (como o spotify-auth-change); o MusicKitService expõe isAuthorized() e unauthorize(). Teste primeiro: test/services/musickit/MusicKitAuth.connection.test.js. O Apple Music só diz «conectado» depois de a pessoa autorizar nesta sessão (o MusicKit não é carregado antes, para não puxar o script de terceiros em toda página).

## [2026-11-21 16:42] step — F83 onda 2: o placar de pixels com os controles; o foco que ficava no X da faixa seguinte devolvido à página
**Branch:** claude/f83-wave-2-playlists-edit
Controles novos em `reports/evidence/F83/wave-2/pixel-noise-wave-2.md`: antiga contra antiga com transições desligadas (0 px nos dois tamanhos), nova contra antiga com o mouse fora da página (o mouse não é a causa). O controle achou uma diferença real: ao remover uma faixa, o botão X ficava com o foco na faixa seguinte (linhas por posição), e a tela antiga, que desenhava de novo, devolvia o foco à página (462 px com o mouse fora); `PlaylistCards.tsx` solta o foco antes de remover, com teste vermelho sem a correção. O resto (até 176 px depois de desfazer e refazer, 2 a 28 px com transições desligadas) é a rasterização do Chrome em nós mantidos: mesmo DOM, mesmos estilos e caixas, e 0 px depois de forçar um novo desenho de `#app`.

## [2026-11-21 16:30] step — F83 onda 2: dois comportamentos da tela antiga devolvidos (o nome do lote apagado volta ao padrão; o «Última atualização» do rodapé segue a loja de álbuns)
**Branch:** claude/f83-wave-2-playlists-edit
O nome do lote apagado à mão volta ao nome padrão no próximo redesenho (o estado digitado zera quando a loja de playlists avisa; digitar não avisa, então o cursor fica) e o rodapé redesenha quando a loja de álbuns avisa (`useStore(albumsStore)`); `Subscribable` em `react-bridge/useStore.ts` passou a devolver `unknown` do `subscribe` (só o tipo; a trava de `test/architecture` não o usa). Cenários dourados novos em `test/support/playlistsScenarios.js` e na fixture. O teste vermelho e a correção vão num commit só: o agente anterior já tinha mostrado o vermelho (2 falhas sem a correção; `test/screens/playlists` 83 de 83 e `test/architecture` 43 arquivos verdes com ela).

## [2026-11-21 16:24] step — F87: o servidor passa a aceitar os canais de prévia do próprio site (UAT-261)
**Branch:** fix/f87-server-accepts-the-preview-address
Medido hoje: o `Origin` da prévia (`...--staging-2nu8kutx.web.app`) dava 500 no servidor de produção. Função pura `isOriginAllowed` em `server/lib/corsOrigin.js` (lista de `ALLOWED_ORIGIN`, sem `Origin`, ou `https://<site>--<canal>-<hash>.web.app` ancorado nas duas pontas, site vindo da primeira origem da lista); testes em `test/server/corsOrigin.test.js`; arch, spec e tasks da F87 em dia; issue UAT-261. Servidor não publicado: vale só depois de `npm run deploy:server`.

## [2026-11-21 16:21] decision — o MJRP escolhe os dois níveis do menu do topo: Elevar no celular, Transformar no computador (F88)
**Branch:** feat/f88-top-menu-build
Palavras do MJRP (2026-11-21), aos dois níveis do protótipo (Elevar e Transformar): «Elevar no cel e transformar na web». Como foi entendido: no celular, o nível Elevar (a estrutura de hoje com a cara da home: a marca em fogo, a letra, o item atual aceso, a barra de baixo com ícones mantida); no computador, o nível Transformar (a barra da home segue sem mudança dentro do app; o fogo marca a tela atual; conta, Spotify e Apple Music num painel; uma linha abaixo no lugar do menu suspenso). À pergunta «A Apple Music entra no menu, ao lado do Spotify? Recomendo sim.», o MJRP respondeu «2.sim»: a Apple Music entra no painel de conexões do menu, ao lado do Spotify (decisão do MJRP, não mais do orquestrador). Construção no código de hoje, sem React nem TypeScript (a migração para React vive em outra linha).

## [2026-11-21 16:18] step — F83 onda 2: o arrastar medido, a prova no navegador, o peso, o placar e os documentos
**Branch:** claude/f83-wave-2-playlists-edit
Relatório do arrastar (`reports/audits/2026-11-21-mjrpalbumblender-v0-f83-wave-2-drag-and-drop.md`; decidido pelo agente — revisável): fica o `sortablejs` atrás da ponte; no Chromium, com o mouse (dentro de uma playlist, entre playlists, para a vazia) e com toque emulado pela alça (393), a ordem das faixas é a da tela antiga e a página mostra a ordem da loja; um dedo fora da alça não pega a linha. `reports/evidence/F83/wave-2/`: 82 conferências, 70 passaram; o `#app` e o que abre sobre a página são iguais em todos os passos, e as 12 que não passaram são capturas de tela de 2 a 173 pixels (a de 173 some com as transições desligadas). Peso: script principal 302.292 → 290.606 B sem as chaves; teto `main` de 302.542 para 290.750 B. Placar: telas à mão 94 → 83 arquivos, 16.389 → 14.750 linhas; 3 invólucros em `react-bridge/legacy/` usados por 4 arquivos. `tasks.md` (TASK-14, 16; 30 a 32 anotadas), mapa, `design-system.md` e `behavior.md` atualizados. Ficam para o coordenador: TASK-17 e a reconferência visual por quem não construiu.

## [2026-11-21 16:16] step — F86: a página do design system do site terminada e publicada
**Branch:** feat/f86-design-system-artifact
Publicada em https://claude.ai/artifact/RHR5zAhDUhQowiEn5BeCgj (versão 1, rascunho), gerada de `docs/specs/design-system.md` por `design/proposals/design-system/build-design-system.mjs` (com `specimens.mjs` e o novo `copy-rules.mjs`). Abre na identidade (o nome do site com fundo transparente, as cores, a Syne, o botão de fogo e o equalizador vivo; 39 palavras no celular); um índice pequeno leva a Cores (o contraste medido na página e conferido contra o documento), Tipo, Espaço e forma, Movimento (os três estados do equalizador com nome, o fio, a home nova com as vinhetas, a regra da pausa e um botão «ver com menos movimento»), Componentes (as famílias do documento e mais quatro peças que o site usa e o documento não lista: avisos com «Try again», estados vazios, o cartão de álbum do computador, a linha de faixa; e a barra que é o menu, do protótipo v4), Texto (a voz, as palavras decididas pelo MJRP com as palavras dele, a régua com um exemplo bom e um ruim por tipo, o link para a página de revisão dos textos) e Desencontros. «Para aprovar» é um botão próprio no topo: as três perguntas com a recomendação à vista, uma quarta (a espessura das barras do fio) e as 21 linhas pendentes do documento, cada uma com amostra viva. O documento: quatro desencontros provados contra o CSS corrigidos e marcados pendentes de aprovação do MJRP, a recomendação da ponta amarela e o link da página. A rodada do menu do app (F88) não tem linha no documento da `main`: nada a mostrar dela. Crítica separada (Opus, `reports/audits/2026-11-21-mjrpalbumblender-v0-f86-design-system-page-critique-2.md`): passa, 0 P0, 6 P1, 7 P2; os 6 P1 corrigidos antes de publicar (a recomendação do texto no fogo dizia «qualquer tamanho»; as opções e as amostras do protótipo pequenas demais no celular; os avisos de desencontro quebrados; quadros mais curtos que a peça; uma decisão fora de «Para aprovar») e a sigla solta de feature (P2) trocada pelo nome. Decidido pelo agente, revisável pelo MJRP.

## [2026-11-21 16:14] step — F88: os requisitos 3 e 6 seguem a decisão «A)» do MJRP (código de hoje primeiro; produção junto com a home)
**Branch:** main
A spec da F88 ainda pedia React e «nada chega à produção antes do fim da migração»; o MJRP decidiu hoje o contrário («A)», entrada das 16h deste log). REQ-03 e REQ-06 reescritos; o resto da spec não muda.

## [2026-11-21 16:02] step — F83 onda 2: a tela das playlists em React, a linha de faixa portada uma vez, a tela antiga apagada
**Branch:** claude/f83-wave-2-playlists-edit
`screens/playlists/` (a tela, os cartões, as peças do celular, o guarda de sair, a rota carregada sob demanda para `/playlists` e `/playlists/edit`), `ui/TrackRow.tsx` e `ui/Breadcrumb.tsx`, a ponte do `sortablejs` (`react-bridge/sortableTracks.ts`), os invólucros do painel de gerar de novo e das janelas de saída em `react-bridge/legacy/`; o invólucro `TrackRows` e dois usos de ponte saíram. Apagados no mesmo commit: `views/PlaylistsView.js`, 4 arquivos de `views/playlists/`, 5 de `components/playlists/`, `components/ui/TrackRow.js` e os testes deles (levados para `test/screens/playlists`, `test/ui`, `test/components/playlists`). A prova de HTML igual: 13 cenários contra `test/fixtures/playlistsBeforeF83.json`, todos iguais, e um teste que prova que ela acusa uma palavra e uma classe trocadas. `ReactView` ganhou `prepare` e `dispose` (o roteador espera a leitura do lote guardado, como esperava o `render` antigo). Desvios pequenos: o campo do nome vazio (apagado à mão) continua vazio até o próximo nome, em vez de voltar ao nome padrão no desenho seguinte; o rodapé «Last updated» não se atualiza mais quando a loja de álbuns avisa (a tela não lia nada dela). Falta: o navegador (arrastar com mouse e toque), o relatório do arrastar, o peso, o placar, as tarefas.

## [2026-11-21 15:47] review — F83 onda 1: o juiz independente aprova a tela de playlists salvas em React (sem P0, sem P1, 1 P2)
**Branch:** integrate/staging-2026-11-21
Relatório `reports/audits/2026-11-21-mjrpalbumblender-v0-react-saved-playlists-visual-parity-recheck.md` e capturas em `reports/evidence/F83/wave-1/recheck/`, escritos pelo juiz (não por quem construiu) sobre o commit 4582756, guardados como vieram. 31 estados iguais ao pixel contra a tela antiga; os 19 pixels do construtor são ruído da própria produção. P2: a prova do construtor deve comparar a produção consigo mesma.

## [2026-11-21 15:46] step — F83 onda 2: o retrato das páginas da tela antiga das playlists (a prova de HTML igual)
**Branch:** claude/f83-wave-2-playlists-edit
Escrito antes de qualquer código da tela nova: `test/support/playlistsScenarios.js` (13 cenários: vazio, lote não achado, gerada pela Blend, nome digitado, painel de gerar aberto, faixa movida, removida, playlist apagada, desfazer e refazer, título digitado, gerando, salvando, lote guardado em edição, os três exportar; no celular: os chips, as folhas, o aviso de desfazer, virar computador) e o retrato `test/fixtures/playlistsBeforeF83.json` (44 páginas), tirado da `PlaylistsView` à mão por `reports/evidence/F83/wave-2/capture-before.test.js`. O serviço das playlists é um substituto que guarda o histórico (o que se testa é a tela lendo a loja). A janela do Spotify e os exportar são conferidos pelo que a tela pede, não pelo conteúdo deles.

## [2026-11-21 15:43] step — F83 onda 2: a resposta sobre as listas do serviço de playlists
**Branch:** claude/f83-wave-2-playlists-edit
Conferido em `services/PlaylistsService.js`: as edições (mover, reordenar, remover faixa, remover e renomear playlist, desfazer, refazer) **trocam** a lista por uma nova; só `applyBatchName` escreve dentro das playlists que estão na loja. A tela nova lê a lista a cada desenho, sem `useMemo` nem `React.memo`, e usa a posição como chave da linha. Escrito no mapa da onda 2.

## [2026-11-21 15:41] decision — o MJRP: o menu novo do topo é construído no código de hoje, para a home ir a produção logo (F88, F80)
**Branch:** main
Palavras do MJRP (2026-11-21): «Como ficou o menu não seria revisto primeiro, pra podermos mover a f80 pra pros?»; à pergunta «Menu novo no código de hoje, para a home ir a produção logo (a), ou só em React, no fim da migração (b)?», «A)». Como foi entendido (orquestrador, revisável): depois de ele aprovar o protótipo do menu (F88), o menu é construído no código de hoje (sem React) e vai a produção junto com a home nova (F80) e os avisos de falha, com o «publica» dele; o menu é refeito em React na onda da moldura da F83. A migração segue na linha `integrate/staging-2026-11-21` e só vai a produção completa.

## [2026-11-21 15:40] step — F83 TASK-15: o mapa das telas das playlists (onda 2); a tela ainda não foi construída
**Branch:** claude/f83-wave-2-playlists-edit
Ramo empilhado sobre o da onda 1. `docs/specs/features/F83-site-screens-in-react/map-wave-2-playlists.md`: os pedaços (~2.600 linhas), o que a tela lê e a auditoria dos `set` de `playlistsStore` (todos avisam, menos `setBatchName`, de propósito), os estados a conferir a 1280 e a 393, e a decisão do arrastar (decidido pelo agente — revisável: manter o `sortablejs` atrás de uma ponte que devolve o nó ao React antes de pedir o `moveTrack`; o `@dnd-kit` muda o comportamento e iria ao MJRP antes). Achados: o `RegeneratePanel` também é do `BlendingController` (fica o antigo atrás de invólucro até a onda 7), a `TrackRow` é portada uma vez para `ui/` (o invólucro da onda 1 sai da lista), a tela tem migalhas (a das playlists guardadas não tinha). Não foram feitos: a medição do arrastar (TASK-14, pede navegador com toque) nem a tela (TASK-16). Nenhum código de produto mudou.

## [2026-11-21 15:38] decision — F83 onda 1: a barra de filtros e a linha de faixa ficam as antigas atrás de invólucros (decidido pelo agente — revisável)
**Branch:** claude/f83-wave-1-saved-playlists
O desvio da onda 1 em relação à proposta (§ 4.4, caso 3) — as peças partilhadas com telas antigas do script principal não são portadas nem montadas por `mountReactPiece`, ficam as antigas atrás de invólucros em `react-bridge/legacy/` até a tela delas migrar, para o React ficar fora da primeira carga — foi aceito pelo coordenador em 2026-11-21 como «decidido pelo agente — revisável». Registrado em `plan.md` (Riscos). Revisável pelo MJRP: a alternativa é carregar o React na abertura já (cerca de 68,7 KB comprimidos a mais para todos).

## [2026-11-21 15:37] step — F83 onda 1: a prova no navegador, o peso, o placar e os documentos; correção ao registro anterior
**Branch:** claude/f83-wave-1-saved-playlists
Correção ao registro das 15:37: as chaves do dicionário desta tela são 79 (savedPlaylists 78 e ui 1) nos dois idiomas, não 101 (o dicionário inteiro tem 88). Navegador (Chromium, `reports/evidence/F83/wave-1/browser-proof.mjs`; servidor de desenvolvimento da tela como era e da tela como é, mais a produção, tudo sem conta, nada lido nem gravado além da sessão anônima que o app abre sozinho): a tela nova contra a produção sem conta (estado vazio) a 1280 e a 393, `#app` igual nos dois; com dados postos na loja da página (o leitor da página trocado por um que nunca responde, e um apagar confirmado por engano só levantaria uma marca), a tela antiga e a nova lado a lado a 1280 e a 393 em 26 estados, cada um conferido no `#app`, no que a tela abre por cima da página (Folha, janela, pergunta) e em captura pixel a pixel; busca com teclas de verdade (o campo é o mesmo elemento e fica com o foco, nas duas), cinco idas e voltas (nenhuma tela nem janela sobra, os ouvintes de `window` voltam ao que eram), nenhum erro na página. Resultado: 65 de 66 conferências; a que falhou foi a captura de 393 contra a produção, 19 pixels no campo de busca com o `#app` igual; não se repetiu em 6 capturas de controle (produção contra produção, a antiga e a nova contra a produção, a antiga contra a nova: todas a 0 pixels, `browser-control-393.mjs`), então foi de tempo, não da tela. O que não se viu: a tela com a conta do MJRP e dados de verdade (nenhuma sessão aberta), o Safari do iPhone, o português lido por uma pessoa. Peso (build publicável, as chaves do `.env` sem impressão, a mesma máquina, antes = `a912eaf`, de onde o ramo saiu): script principal 302.542 B → 302.424 B (−118 B); `react-vendor` 68.691 B (igual); a tela, no arquivo dela, 10.846 B (a antiga era 10.261 B); o canário passou de 1.985 B para 710 B + 2.660 B de `useLocale` que as duas telas dividem; depois da primeira tela, 98.881 B → 100.854 B (+1.973 B); teto do script principal baixado de 316.000 B para 302.542 B (`scripts/bundle-budget.json`: o teto da onda anterior, só desce). Placar (`migration-status.mjs`): telas à mão 102 → 93 arquivos na lista (o relatório conta 94: ele soma o que há hoje), 978 → 904 textos fora do dicionário, 3 usos de ponte para peça antiga. Documentos: `arch.md` (o mapa de componentes, o fluxo de leitura), `design-system.md` (a tabela de portes), o manual de componentes, `plan.md` (o achado das peças partilhadas) e `tasks.md` (TASK-11, 12 e 13 feitas, com o que prova cada uma; TASK-30 e 31 com a parte da onda 1; TASK-32, a reconferência por agente que não construiu, a fazer).

## [2026-11-21 15:37] step — F83 TASK-12 e TASK-13: a tela das playlists guardadas em React (onda 1), a antiga apagada
**Branch:** claude/f83-wave-1-saved-playlists
`screens/saved-playlists/` (a tela, o grupo de série, o cartão de lote com as linhas, as peças do celular, a janela da playlist, `listText.ts`, a rota) no lugar de `views/SavedPlaylistsView.js` e dos 7 pedaços só dela; `/saved-playlists` e `/playlist-series` abrem a tela por `import()` na fábrica da rota (`app.js`). As peças de `ui/`: `AlbumCascade`, `CoverImage` e, sobre os motores que ficam, `useSheetWindow` e `useModalWindow`. A barra de filtros e a linha de faixa ficam as antigas, por dois invólucros em `react-bridge/legacy/` (`FilterToolbar`, `TrackRows`; 3 usos na lista `BRIDGE_USES`), porque as telas antigas que as usam estão no script principal e uma peça em React ali o faria chamar o React (achado no `plan.md`). O controlador mudou para `controllers/` (sem a `view` que não usava; os avisos de apagar pelo dicionário). Os textos: `i18n/en|pt/savedPlaylists.js` e `ui.js` (101 chaves nos dois idiomas; o português segue fechado por `OPEN_LOCALES`). Prova de que é a mesma tela: as páginas da antiga, capturadas antes de apagá-la (`test/fixtures/savedPlaylistsBeforeF83.json`, 16 cenários, a 1280 e no celular), contra as da nova, elemento por elemento (`SavedPlaylists.sameAsBefore.test.tsx`); com duas alterações plantadas de propósito o teste falhou em 8 dos 16 cenários, e voltou a passar sem elas. Testes levados (muda o andaime, não a asserção): 13 da tela, 11 do grupo de série, 4 dos nomes de lote, 8 do controlador, o do cartão (segurança) e o dos filtros medidos (F77); asserções mudadas de sentido: 1 (a tela deixada não ouve mais: a store guarda o ouvinte fixo da ponte por desenho, então o teste lê `bridgeListenerCount() === 0` em vez de `store.listeners.size === 0`); novas: o teste-molde de sair, os textos em português, a pergunta de apagar, o grupo desenhado de novo quando a entrada muda, a cascata igual à da Blend. Sensores: 9 arquivos saíram de `handMadeScreensBaseline.js`; `savedPlaylistsBoundaries` e `noDeadModules` seguem os arquivos novos; `prefetchScreens.js` e `useScreenTitle.ts` ficam na lista dos que esperam (o primeiro volta ao `app.js` na onda 3); a cota «a lista é do tamanho do site» de `handMadeScreensOnlyShrink` baixou (a lista encolheu). Suíte inteira pela fila (`f83w1-full`): 334 arquivos, 4.031 testes verdes; typecheck e lint sem erro.

## [2026-11-21 15:33] step — F83 TASK-11: o mapa da tela das playlists guardadas (onda 1)
**Branch:** claude/f83-wave-1-saved-playlists
O ramo da onda 1 parte de `integrate/staging-2026-11-21` (a base React da onda 0 está nessa linha, não na `main`; a migração só chega à produção completa, decisão do MJRP de hoje). O mapa fica em `docs/specs/features/F83-site-screens-in-react/map-wave-1-saved-playlists.md`: os pedaços da tela antiga e o que cada um vira, os estados a conferir a 1280 e a 393, a auditoria dos `set` da `SavedPlaylistsStore` (todos avisam; a entrada é trocada, nunca mudada; o aviso é em lote, sem foto: a forma «em lote» do `useStore`), o que o controlador faz (nada no DOM), e as peças partilhadas com telas de outras ondas. Achado, para o MJRP decidir (também no `plan.md`): a proposta (§ 4.4, caso 3) manda portar a peça partilhada uma vez e montá-la nas telas antigas por `mountReactPiece`; mas as telas antigas estão no script principal, e uma peça em React ali o faz importar o React, contra a decisão da onda 0 (a primeira carga não baixa React). Por isso, nesta onda, a barra de filtros e a linha de faixa ficam as antigas, alcançadas por invólucros em `react-bridge/legacy/` (cada uso na lista `BRIDGE_USES`), e só a cascata de capas, que a Blend escreve como texto, ganha um porte com duas escritas até a onda 7.

## [2026-11-21 15:27] session — F88: rodada 1 de desenho do menu do topo do app (Elevar e Transformar)
**Branch:** wip/f88-top-menu-design-round-1
Pedido do MJRP (2026-11-21): «já fazer o redesign completo do top nave, aí a transicao fica mais suave». Dois níveis como moldura viva sobre as telas reais do app (capturas de 2026-11-21), a 393 e a 1280, PT e EN, com o menu de hoje como «Referência» e a prévia da passagem da home v4 para o app: `design/inception/f88-top-menu-{elevar,transformar}-v1.html`, comparador https://claude.ai/artifact/AtUiGYy1YAL9iLd58yJ3aF (cópia `design/proposals/f88-top-menu/comparator.html`, gerador em `build/`). Inventário do menu de hoje (MENU-01 a 11), estados e Content Map em `docs/specs/info-arch.md`; padrões novos pendentes no `design-system.md`; proposta, viabilidade em React (onda da moldura da F83) e três perguntas em `design/proposals/f88-top-menu/proposal.md`. Recomendação do agente: Transformar (a barra da home continua no app). Viabilidade escrita para construir primeiro no código de hoje (decisão do MJRP «A)»), React depois; o REQ-03 e o REQ-06 da spec da F88 ficam a reescrever pelo orquestrador. Crítica separada (`reports/audits/2026-11-21-f88-top-menu-round-1-ux-audit.md`): sem P0; os 7 P1 e 6 dos 8 P2 consertados antes de mostrar. Nenhum aprovado.

## [2026-11-21 15:11] session — F80: correções da reconferência do juiz na home (1 P1, 4 P2)
**Branch:** wip/f80-home-bar-is-the-menu-build
P1: no celular, com conta, 18 px entre o título e o «Inicie» (era 0). P2: PT e EN com 44 px de largura no celular; título em inglês como o da v4 («Dig through the albums you love.»; as demais linhas em inglês conferidas contra a v4 por script, sem outra diferença); a legenda do caixote segue o idioma também no celular; o caixote só aparece depois que o script o posiciona, e a diagonal vai no CSS, então as capas não se mexem mais ao carregar (o que sobra do salto vem da troca de idioma do cabeçalho e do título num navegador em inglês). Testes de test/architecture e test/splash verdes (379), eslint limpo, capturas fix-* em reports/evidence/F80/home-bar-is-the-menu/.

## [2026-11-21 15:08] review — F80: reconferência visual independente da home «A barra é o menu» (6cc8863): sem P0, 1 P1, 4 P2
**Branch:** wip/f80-home-bar-is-the-menu-build
Relatório escrito pelo juiz independente, copiado sem mudança para reports/audits/2026-11-21-mjrpalbumblender-v0-home-bar-is-the-menu-visual-parity-recheck.md; capturas em reports/evidence/F80/home-bar-is-the-menu/recheck/.

## [2026-11-21 14:54] decision — o MJRP: o que está no ambiente separado só vai a produção quando a migração para React terminar
**Branch:** main
Palavras do MJRP (2026-11-21): «staging agora só vai pra prod qdo completarmos a migracao». Antes, no mesmo dia: «v4 ficou sensacional, aprovada!!! Kudos for you» (a home v4) e «na versao mobile aqui tem muito texto e manteria o mergulhe e seu subtitulo apenas». Como foi entendido (orquestrador, revisável): o ramo `integrate/staging-2026-11-21` é a linha da migração (F83), publicada só na prévia do Firebase (F87, canal `staging`, https://mjrp-playlist-generator--staging-2nu8kutx.web.app, vence em 7 dias e é republicado a cada onda); o ramo do React não entra na `main` e nada dele vai a produção até a última onda. Em aberto com ele: se a home nova e os avisos de falha, que não dependem do React, vão a produção antes.

## [2026-11-21 14:51] session — F80: a v4 (o ritmo da página) aprovada pelo MJRP e construída na home (UAT-240, UAT-241)
**Branch:** wip/f80-home-bar-is-the-menu-build
O MJRP aprovou a v4 do protótipo: «v4 ficou sensacional, aprovada!!! Kudos for you». Construída em `public/splash.html` e `public/splash/ambient.js`: as cinco vinhetas (Inicie, Álbuns, Blend, Playlists, Inventário) que entram e saem com a rolagem (só `transform` e `opacity`), paradas pelo ícone de pausa e pelo repouso, imagem parada com movimento reduzido; as alturas das histórias da tabela de entrega (computador `clamp(540px,70dvh,680px)`, convite `clamp(440px,56dvh,560px)`, celular pelo conteúdo). Pedido dele para o celular: «na versao mobile aqui tem muito texto e manteria o mergulhe e seu subtitulo apenas» — abaixo de 900 px a abertura mostra só o título e a linha laranja (o parágrafo fica no computador). «Entrar» da abertura sai no celular (fica o do topo). Os pontos `.ambient` vazios viraram os painéis `.v4-motif`. Testes `test/architecture` + `test/splash` verdes (375), eslint limpo; capturas em `reports/evidence/F80/home-bar-is-the-menu/` (`v4-*`, `measures-v4.json`).

## [2026-11-21 14:43] session — F87: os testes de recusa do `--branch` ficam herméticos (repositório temporário próprio)
**Branch:** wip/f87-preview-tests-hermetic
Os scripts de publicação rodam a suíte dentro de uma cópia exportada do ramo, que não é repositório git; lá os três testes de recusa (`--branch` inexistente, `--branch` sem nome, `deploy-site.sh --branch x`) falhavam com «must live inside the git repository». Agora cada um roda numa fixture: repositório git temporário com cópia dos scripts, apagado no fim. Provado no repositório e numa exportação por `git archive`.

## [2026-11-21 14:40] step — F83 onda 0: a `main` (F87, o build compartilhado do site) entra no ramo
**Branch:** claude/f83-wave-0-base
Conflito só em `scripts/deploy-site.sh`: ficou a forma fina da `main` e a minha mudança foi para o compartilhado. O tipo (`npm run typecheck` dentro de `run_lint`) já estava em `scripts/lib/deploy-common.sh`; a recusa pelo teto de peso (`scripts/bundle-budget.mjs`) passou para `verify_build` de `scripts/lib/site-build.sh`, que a publicação de produção e a da prévia (`deploy-preview.sh`) chamam. `test/scripts/bundleBudget.test.js` prova que o teto mora no compartilhado e que os dois scripts chamam `verify_build` e `run_lint` sem ter cópia própria. `test/server test/architecture test/scripts test/security`: 842 testes verdes; typecheck e lint sem erro.

## [2026-11-21 14:40] session — F87: a prévia publica um ramo local (`--branch`), antes de ele chegar à `main`
**Branch:** wip/f87-preview-from-a-branch
O MJRP quer validar no ambiente separado o que está em ramos (a base em React, a nova home) antes da `main`. `deploy-preview.sh --branch <ramo local>` (padrão `main`) exporta e constrói esse ramo com as mesmas checagens; a de «limpo» vale para a pasta onde ele está; recusa ramo que não existe localmente; o `.env` segue o do checkout principal, sem cópia nem impressão; imprime no começo e no fim o ramo, o commit e o canal. `deploy-site.sh` não ganhou a opção (teste prova que `--branch x` é recusado). Cabeçalho de uso, plan, tasks (TASK-01b) e linha de proposta do `arch.md` § Delivery strategy em dia. Nada foi publicado.

## [2026-11-21 14:37] review — F83 onda 0: a reconferência visual independente passou (0 P0, 0 P1, 3 P2)
**Branch:** claude/f83-wave-0-base
O agente juiz, que não construiu, reconferiu o ramo no `0681a96`: veredito `pass`, 0 P0, 0 P1, 3 P2. O relatório está em `reports/audits/2026-11-21-mjrpalbumblender-v0-react-base-visual-parity-recheck.md` e as capturas e as medidas em `reports/evidence/F83/wave-0/recheck/`, copiados sem mudança, escritos pelo juiz. Os três P2 viraram as issues UAT-258 («Try again» branco sobre o laranja, 2,8:1), UAT-259 («Try again» com a rede ainda fora não dá sinal) e UAT-260 (o painel de falha com «View Error» e o rastro técnico), abertas pelo juiz, da F83. Nenhuma mudança de código.

## [2026-11-21 14:37] session — F87 fatia A preparada, sem publicar: `scripts/deploy-preview.sh` e o teste dele
**Branch:** wip/staging-environment-registration
O MJRP pediu um ambiente separado para validar o site («O firebase não nos dá um ambiente de staging pra homologarmos a versão em react?»; «Eu preferia ver tudo num ambiente separado») e escolheu a fatia A («A)»). Novo `scripts/deploy-preview.sh` (canal `staging` por padrão; recusa `live`; mesmas verificações do `deploy-site.sh`; termina com `firebase hosting:channel:deploy <canal> --expires 7d`, flags conferidos em `--help`; mostra o endereço; nunca roda `firebase deploy`). Preparar, construir e conferir foram para `scripts/lib/site-build.sh`, usado pelos dois scripts (movido sem mudar o texto). `npm run deploy:preview`. Teste `test/server/deployPreview.test.js` (10 testes) e `arch.md` § Delivery strategy com uma linha de proposta, à espera do MJRP. Nada foi publicado.

## [2026-11-21 14:32] session — F80: a home v4, o ritmo da rolagem — histórias mais curtas e uma vinheta viva por história (UAT-241, UAT-240)
**Branch:** wip/f80-home-v4-rhythm
O pedido do MJRP (2026-11-21), nas palavras dele, olhando o trecho depois de «Lado A · 1 — Inicie»: «o espçamento aqui tem um vázio muito grande, ou reduzimos ou colocamos animacoes ligadas a fogo e musica...motions fading in e fading out»; «gaste um tempo pra repensar nesse ultimo ponto e caprichar na v4». E a abertura: o título só «Mergulhe nos álbuns que você ama.», com «Seus álbuns do momento, numa playlist balanceada.» como linha menor. Feito: `design/inception/splash-menu-bar-v4.html` (gerador `design/proposals/f80-splash/home-menu/build_v4.mjs`; a v3 intacta); o maior trecho vazio caiu de 308–468 px para 125–173 px no computador e de 70–107 px para 62–91 px no celular, onde a vinheta ocupa o espaço ao lado da capa; o caixote aparece na primeira tela do celular. Crítica separada (`reports/audits/2026-11-21-f80-home-v4-rhythm-ux-audit.md`): passa, 0 P0, 2 P1 e 5 P2; os dois P1 e três P2 corrigidos antes de publicar. Padrões novos pendentes no `design-system.md`; a v4 no `info-arch.md`; o diagnóstico e a tabela para quem constrói em `proposal.md` § Rodada 3 · v4. Comparador publicado (versão 15), com a pergunta «O ritmo da página ficou vivo, sem vazio?»; a pergunta da v3 foi para `home-pt-v3.html`.

## [2026-11-21 14:27] step — F83 onda 0: «Try again» sem rede carrega a tela sem recarregar o app (REQ-10)
**Branch:** claude/f83-wave-0-base
A `main` entrou no ramo por merge, sem conflito (o kernel novo de `mjrp-scripts/`, os avisos de fontes que falharam na janela do álbum; nada de `public/splash/` nem `scripts/entryPage.mjs` tocado); o arquivo novo `components/albumWindowSources.js` e os tamanhos de quatro arquivos que vieram da `main` entraram na lista de `handMadeScreensBaseline.js`. O achado da entrega anterior: o navegador lembra a falha de um `import()` pela vida da página, do arquivo e dos arquivos que ele importa de forma estática (o React); pedir de novo, até com `?retry=N`, falha igual (provado: a primeira tentativa, com a consulta, não funcionou porque o `react-vendor` ficou como falho). O conserto: `utils/loadScreen.js` pergunta à rede (um HEAD em `/app.html`, 5 s) ANTES de importar; sem resposta nada é importado (a falha nunca é feita nem lembrada), o roteador mostra «No connection» e o «Try again» importa depois o próprio arquivo do build, com o seu único React. A tela que chegou fica guardada. O `import()` continua escrito só em `app.js` (`lazyOnlyAtTheRoute`). Limite que sobra: a rede que responde à pergunta e cai antes do arquivo chegar ainda termina no conserto da F64 (uma recarga). Teste primeiro (`test/utils/loadScreen.test.js`, 10): um navegador simulado que guarda a falha por endereço, do arquivo e da dependência; o teste do roteador com «Try again» não pede recarga. Navegador de verdade (`reports/evidence/F83/wave-0/browser-offline-retry.mjs`): servidor de desenvolvimento e build publicável, 5 de 5: offline → «No connection» → online → «Try again» → a tela desenha, a marca em `window` e o `performance.timeOrigin` iguais, um evento `load` só. Suíte inteira pela fila: 323 arquivos, 3.917 testes; typecheck e lint sem erro.

## [2026-11-21 14:25] session — F87 e S-69: um ambiente separado para validar o site antes da produção, em esboço; o MJRP escolheu a fatia A
**Branch:** wip/staging-environment-registration
Palavras do MJRP (2026-11-21), sobre validar a versão em React e a nova home: «O firebase não nos dá um ambiente de staging pra homologarmos a versão em react?» e depois «Eu preferia ver tudo num ambiente separado». Registrados na `main`-origem: a story S-69 (EP-10, no PRD) e a feature F87 (via padrão, tipo feature), spec, plan e tasks em esboço, ids reservados por `merge_train.py next-item-id --reserve`. A spec traz duas fatias: A, um canal de prévia do Firebase Hosting (mesmos dados, login e servidor da produção); B, um segundo projeto Firebase todo separado. Ele respondeu «A)» (só o site separado): fatia A decidida, B fica na spec como não escolhida por ora.

## [2026-11-21 14:24] decision — o MJRP aprova a emenda da constituição para React e TypeScript e o aceite da ADR-0023, condicionado ao ambiente separado
**Branch:** main
Palavras do MJRP (2026-11-21): «O firebase não nos dá um ambiente de staging pra homologarmos a versão em react?»; «Eu preferia ver tudo num ambiente separado»; à pergunta «Aprova a emenda da constituição para React e TypeScript e o aceite da decisão de arquitetura do React?», «1) aprovo desde que crie 2» (o item 2 era o ambiente separado para homologar). Como foi entendido (orquestrador, revisável): a emenda e o aceite valem depois que o ambiente separado existir; a ADR-0023 segue `Proposed` até o commit carimbado por ele; nada da F83 nem da home nova vai a produção antes de ele homologar no ambiente separado. Em aberto com ele: o tamanho do ambiente (só o site numa prévia do Firebase, ou um projeto separado com dados, login e servidor próprios).

## [2026-11-21 14:18] step — F83 TASK-10: o canário, a tela «Coming soon» em React (onda 0 pronta)
**Branch:** claude/f83-wave-0-base
`screens/coming-soon/` (ComingSoon.tsx e a rota `index.ts`) no lugar de `views/ComingSoonView.js`, que saiu com a entrada dela na lista dos arquivos à mão; `/artists`, `/genres` e `/tracks` abrem a tela por `import()` na fábrica da rota (`app.js`), com o prazo de 10 s. Os textos vêm do dicionário: `i18n/` (`t`, `tPlural`, `setLocale`, `onLocaleChange`; `en/` no script principal, `pt/` num arquivo à parte, fechado ao público por `openLocales.js`; o dono lê o português com a marca `mjrp.lang.preview`) e `useLocale` na ponte. Sensores novos: `dictionariesAgree` (as mesmas chaves e espaços nos dois idiomas, sem HTML) e `rulesDoNotSpeak`. Prova de que a tela é a mesma: o teste compara o que a nova desenha com o modelo da antiga (`test/fixtures/comingSoonBeforeF83.js`, o modelo copiado) nos três endereços, elemento por elemento, classe por classe (só o espaço entre as tags, que o navegador não desenha, foi recolhido); no navegador, o `#app` do servidor de desenvolvimento deste ramo é igual ao da produção nos três endereços a 1280 e a 393 (14 de 14, `reports/evidence/F83/wave-0/`); sair e voltar seis vezes deixa uma tela só. Peso, no build publicável: script principal 301.830 B (+393 B), `react-vendor` 68.691 B num arquivo à parte, o canário 1.986 B; a primeira carga de `/start` não baixa React; o tempo até a primeira tela `/start` 1.767 ms (+25 ms), `/artists` 1.900 ms (+135 ms, baixa o React); com Slow 4G 3.737 e 4.250 ms. Achado: sem rede, o painel «No connection» aparece e o app não recarrega, mas o «Try again» acaba recarregando o app (uma vez): o navegador lembra, pela vida da página, que o `import()` daquele arquivo falhou, e a segunda tentativa falha igual (provado no build). Suíte inteira pela fila (`f83-wave0`): 321 arquivos, 3.900 testes verdes; typecheck e lint sem erro. Placar: 102 arquivos à mão, 978 textos fora do dicionário (eram 987).

## [2026-11-21 14:16] session — F80: o dicionário da home no texto v3 e o «Inicie» sozinho com conta (UAT-240, UAT-241)
**Branch:** wip/f80-home-bar-is-the-menu-build
Todas as linhas de `public/splash/copy.js` (pt e en) na tabela v3 de `design/proposals/f80-splash/proposal.md`, com o título da abertura só «Mergulhe nos álbuns que você ama.» e a linha menor e o parágrafo embaixo; com conta, o botão «Suas playlists» saiu e fica só o «Inicie». A `main` entrou no ramo por merge. Capturas da primeira tela a 1280 e 393, sem e com conta, em `reports/evidence/F80/home-bar-is-the-menu/`; o caixote aparece na primeira tela a 393.

## [2026-11-21 14:01] session — F80: a home «A barra é o menu» v2 construída na página de entrada (UAT-240, UAT-241)
**Branch:** wip/f80-home-bar-is-the-menu-build
A página real (`public/splash.html`) vira o protótipo aprovado: a barra contínua é o menu (Inicie, Álbuns, Blend, Playlists, Inventário), uma história por item, a virada como faixa curta, o ícone de pausa; com conta, só o menu e o «Inicie» (um item do menu vai à tela do app; decidido pelo orquestrador, revisável); português e inglês pela chave PT · EN (idioma do navegador, escolha no localStorage). Todo texto visível em `public/splash/copy.js`; o título, a linha e o parágrafo da abertura são do MJRP. Cada história só de texto tem um ponto de ambiente vazio (`.ambient`) e a altura em `--story-min`, para a v4 do espaçamento. Testes de `test/splash` e `test/architecture` verdes (359), eslint limpo, prova no navegador em `reports/evidence/F80/home-bar-is-the-menu/`. Docs: `tasks.md` da F80 (TASK-09 a 11) e `behavior.md` (^entry-home-menu).

## [2026-11-21 14:00] step — F83 TASK-09: o placar da migração
**Branch:** claude/f83-wave-0-base
`scripts/migration-status.mjs` (`--json`, `--root`): os arquivos feitos à mão e as linhas (contra a lista do dia em que a migração começou), os arquivos em React por pasta, as pontes para pedaços antigos (arquivos em `react-bridge/legacy/` e quem os usa) e os textos escritos fora do dicionário (o contador da medição, portado para `scripts/lib/stringSites.mjs`, que também lê TSX: texto solto entre tags e `aria-label`/`title`/`placeholder`/`alt` literais; uma contagem boa a uns 10%). Não grava nada. A saída de hoje, antes do canário, em `reports/evidence/F83/wave-0/migration-status-start-of-wave-0.txt`: 103 arquivos feitos à mão (17.624 linhas; 17.779 no dia que a migração começou, a diferença é o `Icons.js`, que passou a ler os dados), 7 arquivos em React (a ponte e o ícone), 0 pontes, 987 textos fora do dicionário. 5 testes; `test/architecture` e `test/scripts` 319 verdes; lint sem erro.

## [2026-11-21 13:59] session — segundo relatório do juiz (passa) guardado como veio; 2 P2 viram UAT-256 e UAT-257
**Branch:** wip/failed-sources-are-shown-2026-11-21
Relatório `reports/audits/2026-11-21-mjrpalbumblender-v0-failed-sources-visual-parity-recheck-2.md` e capturas `reports/evidence/F52/recheck-2/` escritos pelo juiz (F52, F69), copiados sem edição. Os dois P2 restantes (a lista que se mexe no «Try again»; o azul fora da paleta) entram em `uat.md` como UAT-256 e UAT-257, ids reservados por `merge_train.py next-uat-id --reserve`.

## [2026-11-21 13:58] step — F83 TASK-08: o teto de peso, medido no build publicável
**Branch:** claude/f83-wave-0-base
Medido o build publicável de hoje (`main@3356113`, com as chaves do `.env`; a saída bruta em `reports/evidence/F83/wave-0/raw/`): script principal 301.437 B gzip (`main-Cp3Nsp6i.js`, o mesmo de produção; os 301.051 B da medição eram sem as chaves), folha de estilos 28.974 B, adaptador da medição 129.204 B, a maior tela sob demanda 10.257 B; tempo até a primeira tela em `/start` 1.742 ms (mediana de 5, sem limitação) e 3.701 ms com Slow 4G; `/artists` 1.765 ms. A tabela da proposta § 11 foi acertada com esses números. `scripts/bundle-budget.mjs` lê `dist/` e `scripts/bundle-budget.json`: o script principal sob o teto; React em exatamente um arquivo `react-vendor-*.js` sob o teto e sem ser carregado na abertura (nem import estático do script principal, nem tag nas páginas) enquanto a moldura for à mão; cada arquivo sob o alarme de uma tela, salvo a lista `allowed` com o motivo (só o adaptador da medição, F77); o que desce depois da primeira tela dentro da folga. `vite.config.js`: `manualChunks` põe react, react-dom e scheduler em `react-vendor`. `scripts/deploy-site.sh` recusa publicar um build acima do teto (os tipos já entram em `run_lint`, TASK-01). 14 testes do script e do config; `test/architecture` e `test/scripts` 314 verdes; lint sem erro. O teto de peso da onda 0 fecha depois do canário (TASK-10), com a medição do build com a tela em React.

## [2026-11-21 13:55] session — achados do juiz tratados: «Try again» de 44 px no celular, BestEverAlbums nomeada, linha «Asking»
**Branch:** wip/failed-sources-are-shown-2026-11-21
P1-1: botão com min-h 44 px até o breakpoint md (computador segue 72x24; celular medido 76x44 a 393). P2-1: «BestEverAlbums did not answer.». P2-3: a nota mostra «Asking BestEverAlbums for ratings…» enquanto pergunta, como a popularidade. Azul mantido (P2-2, issue à parte). Novas capturas em F52/ e F69/.

## [2026-11-21 13:54] session — teste vermelho dos achados do juiz: alvo de 44 px, nome da fonte, linha «Asking»
**Branch:** wip/failed-sources-are-shown-2026-11-21
Quatro testes falham (F52/F69, UAT-244/245), cobrindo P1-1, P2-1 e P2-3 do relatório do juiz.

## [2026-11-21 13:53] session — relatório e capturas do juiz sobre a prova de F52 e F69, guardados como vieram
**Branch:** wip/failed-sources-are-shown-2026-11-21
O juiz independente escreveu o relatório `reports/audits/2026-11-21-mjrpalbumblender-v0-failed-sources-visual-parity-recheck.md` e as capturas `reports/evidence/F52/recheck/`; o agente só os copiou, sem editar o veredito nem os achados.

## [2026-11-21 13:52] step — F83 TASK-07: o andaime de teste das telas em React e o teste-molde de sair
**Branch:** claude/f83-wave-0-base
`test/support/renderScreen.tsx`: monta a tela como a produção monta (pela `ReactView`, em `#app`, com o modo estrito e a barreira de erro), `act` em volta de cada mudança, e o teste continua lendo o DOM por seletor (nenhuma biblioteca de teste: as consultas dela mudariam as asserções dos testes antigos). `itLeavesNoListeners` é o molde que toda pasta de `screens/` terá (o sensor `everyScreenHasTheLeaveTest` o exige): entra e sai cinco vezes e nada da tela ouve mais — nem as stores, o idioma e o celular (a contagem da ponte), nem a janela, nem sobra tela na página. O teste do molde (`test/support/renderScreen.test.tsx`, 6): passa na tela que limpa, acusa a que deixa um ouvinte na janela, e prova que o modo estrito está ligado (o efeito roda duas vezes). Lint e typecheck sem erro; `test/architecture` 300 verdes.

## [2026-11-21 13:50] step — F83 TASK-06: o ícone em React sem HTML cru, com o HTML de hoje provado
**Branch:** claude/f83-wave-0-base
Os desenhos dos 65 ícones passaram para dados (`utils/iconShapes.js`: os atributos da raiz e os elementos, na ordem do texto); `components/Icons.js` (`getIcon`, `Icons`) e o `<Icon>` de `ui/Icon.tsx` leem os mesmos dados. A prova (`test/ui/Icon.test.tsx`, com o texto de antes guardado em `test/fixtures/iconMarkupBeforeF83.json`, copiado antes da mudança): 64 ícones iguais byte a byte ao texto de antes, com e sem classe, e o DOM do React igual ao DOM que o navegador faz do texto; a exceção única registrada com o motivo é o `MJRPLogo`, que nenhuma tela usa e perdeu os comentários e a quebra de linha entre os elementos (não se desenham). Andaime de teste acertado: `test/components/Icons.test.js` («nenhum ícone escrito duas vezes») passou a ler `iconShapes.js`, onde os desenhos moram agora; mesma asserção. `tsconfig`: `resolveJsonModule`. O `ui/Icon.tsx` entra em `KEPT_ON_PURPOSE` do `noDeadModules` até o canário. 863 testes verdes; lint e typecheck sem erro.

## [2026-11-21 13:50] session — F80: a home em português, v3, todo o texto revisado (UAT-241, UAT-240)
**Branch:** wip/f80-home-pt-copy-v3
Decisões do MJRP (2026-11-21), nas palavras dele: «Cada faixa Conta em pt está estranho»; «ponha é feio, melhor coloque»; «eu revisaria todo esse copy»; sobre o ranking, «ponha no topo é ruim, e vc pode querer colocar pra baixo, entao aqui tem que ser Ranqueie/ordene e o uso do blend aqui nao é adequado, pode ser "junte" ou agrupe»; sobre as Playlists, «exporta só para o spotify?»; sobre o Inventário, «Conte as midias fisicas da sua estante». Nova versão `design/inception/splash-menu-bar-v3.html` (gerador `home-menu/build_v3.mjs`, lê a v2 e troca só o texto; a v2 intacta): a abertura escrita por ele, nas palavras dele: «Mergulhe nos álbuns que você ama. Seus álbuns do momento, numa playlist balanceada» e «Embaixo: Monte séries com seus álbuns do momento, ranqueie suas faixas e gere playlists equilibradas…» (o inglês dela é proposta), «Ranqueie as faixas do seu jeito.» com o ranking nos dois sentidos, sem «ponha», sem «misture», «Blend» só como nome do menu, exportação «para o Spotify ou a Apple Music», «Conte as mídias físicas da sua estante.» com os formatos do app. Conferido no código: `UserRankingStrategy`/`TopNUserAlgorithm` (a playlist pode seguir a ordem da pessoa), `PlaylistsExport.js`/`SpotifyExportModal.js`, `InventoryAddModal`/`InventoryEditModal`. Wireframes `design/wireframes/splash-menu-bar-v3-*.png` e o registro no `info-arch.md`. Tabela antes → depois em `proposal.md` § Rodada 3 · v3. Comparador republicado na mesma URL (versão 13): abre em «O texto em português ficou natural?», a v3 viva ao lado da v2 (a chave dos três títulos saiu, a abertura dele os substitui); a pergunta da v2 em `home-pt-v2.html`, atrás de «Rodadas anteriores». Conferi 1280 e 393, sem e com conta, PT e EN: sem rolagem lateral, sem rótulo cortado, sem erro no console. Texto decidido pelo agente, revisável pelo MJRP.

## [2026-11-21 13:49] session — F72: o nó S-55 com entrega, estado e critérios; Done
**Branch:** wip/closing-pass-2026-11-21
F72 (quantos álbuns e séries a tela diz): o código está na `main`. Faltavam três linhas da trava: no nó S-55 o `delivered_by` (`49c786e`, `274dfe4`), o `points_to` (`behavior#^library-counts`) e os critérios de aceite, escritos do que o MJRP julgou em 2026-11-20 (a contagem ficou na linha da paginação; numa série só não aparece, hoje a UAT-248, aberta pela reconferência); e a reconferência visual (relatório `reports/audits/2026-11-21-mjrpalbumblender-v0-albums-series-visual-parity-recheck.md`). Acrescentei `verified_by` ao REQ-01 e ao REQ-02 e marquei o REQ-01 como substituído pelo REQ-03, como o próprio MJRP decidiu. Tarefa fechada, spec em `Done`. Nenhum carimbo de aceite: o aceite do S-55 é do MJRP.

## [2026-11-21 13:47] session — F67: o estado da busca no `arch.md`; Done
**Branch:** wip/closing-pass-2026-11-21
F67 (o Scan da Home responde ao clique): o código está na `main`. Faltavam duas linhas da trava. (1) `arch.md`: a declaração dizia «atualizado» pelo commit da F57, que não cita a F67; escrevi na seção do seletor de álbuns o estado da busca, a geração, os prazos e a montagem única do roteador, conferido no código. (2) Reconferência visual: relatório `reports/audits/2026-11-21-mjrpalbumblender-v0-shell-start-visual-parity-recheck.md` (os quatro estados estão na tela). Tarefa fechada, spec em `Done`. Nenhum carimbo de aceite: a UAT-204 segue com o MJRP.

## [2026-11-21 13:46] session — F48: o comportamento da nova tentativa no `behavior.md`, os commits certos nas issues; Done
**Branch:** wip/closing-pass-2026-11-21
F48 (cache e nova tentativa): o código está na `main`. Faltavam duas linhas da trava. (1) `behavior.md`: escrevi as novas tentativas do servidor e o que não se tenta de novo, conferido em `api/client.js`. (2) Reconferência visual: relatórios do lote de 2026-11-21 (álbuns e casca). Conferi também a linha das issues: UAT-175, 176 e 177 já diziam `fixed (F48: …)`, mas citavam o commit `fe12d90`, que é o da UAT-14; troquei pelos commits que as consertaram (`57ce6bc`, `d57ca5c`, `061bcce`). Tarefa fechada, spec em `Done`. Nenhum carimbo de aceite.

## [2026-11-21 13:46] session — prova no navegador da nota e da popularidade que falharam na janela do álbum (UAT-244, UAT-245)
**Branch:** wip/failed-sources-are-shown-2026-11-21
Capturas a 1280 e 393 em `reports/evidence/F52/ratings-failed-*.png` e `reports/evidence/F69/popularity-failed-*.png`, com a janela real do álbum, o CSS real e o fixture da reconferência; a carga é um substituto no roteiro (`reports/evidence/F52/harness/`, `shoot.mjs`). Nada passa da borda; «Try again» pede a fonte e o aviso some. O aviso usa o azul que o aviso da popularidade já tinha (a janela de ranking fora da paleta é a UAT-250); não inventei cor.

## [2026-11-21 13:45] session — F46: o estado por série no `behavior.md`, a UAT-174 devolvida à F45; Done
**Branch:** wip/closing-pass-2026-11-21
F46 (estado claro por série): o código está na `main`. Faltavam três linhas da trava do passo retroativo. (1) `behavior.md`: escrevi o estado por série e que a série sem álbum não é desenhada (UAT-247). (2) Issues: a UAT-174 foi fechada pelo commit `ce52f46`, da F45, e diz `fixed (F45: …)`; não marquei nada como consertado pela F46 e tirei a UAT-174 do `fixes:` da F46 (a UAT-173 segue `fixed (F46: 510a840 …)`); decisão que cabe ao MJRP rever, se ele preferir a UAT-174 no `fixes:` da F45. (3) Reconferência visual: relatório `reports/audits/2026-11-21-mjrpalbumblender-v0-albums-series-visual-parity-recheck.md`. Tarefa fechada, spec em `Done`. Nenhum carimbo de aceite.

## [2026-11-21 13:44] session — F45: o comportamento da carga paralela escrito no `behavior.md`; Done
**Branch:** wip/closing-pass-2026-11-21
F45 (carga de álbuns em paralelo): o código está na `main`. Faltavam duas linhas da trava do passo retroativo: o `behavior.md` (a declaração dizia «atualizado», mas só o commit da v4.0, que não cita a F45, o tocava) e a reconferência visual. Escrevi no `^library-loading-skeleton` o que `LOAD_LIMITS` faz (3 buscas no catálogo juntas, séries de cima primeiro, prazo de 45 s por álbum e 20 s por fonte), conferido no código; a reconferência é a do lote `reports/audits/2026-11-21-mjrpalbumblender-v0-albums-series-visual-parity-recheck.md`. Tarefa fechada, spec em `Done`. Nenhum carimbo de aceite: a UAT-172 segue com o MJRP.

## [2026-11-21 13:44] session — a janela do álbum mostra a nota e a popularidade que falharam, com «Try again» (UAT-244, UAT-245)
**Branch:** wip/failed-sources-are-shown-2026-11-21
A tela de séries dá à janela do álbum `sources` (ler, pedir, observar a carga): a nota (`enrichment.acclaim`) em «failed» mostra «The ratings source did not answer.» e a popularidade em «failed» mostra o aviso que já existia («Spotify did not answer.»), ambos com «Try again» via `albumLoadService.refreshSource`; a janela se redesenha quando a carga muda. Reuso do componente e das cores do aviso da popularidade, sem padrão novo. Não mudei o status das linhas no uat.md: o fecho é do integrador/MJRP.

## [2026-11-21 13:43] step — F83 TASK-05: sem rede não é versão nova
**Branch:** claude/f83-wave-0-base
`utils/staleBuild.js` distingue os três desfechos de um arquivo de tela: chegou; sumiu porque o site foi publicado de novo (pede `/app.html` sem cache e compara o nome do script principal com o da aba: `publicationState`); a rede não respondeu, ou o prazo de 10 s passou (`loadWithDeadline`, `ScreenLoadTimeout`). Só o segundo recarrega o app. O roteador mostra o estado «No connection» com «Try again» (pede a tela de novo, sem recarregar o app), mostra a barra de progresso que já existe só se a tela demora mais de 150 ms (nenhum piscar numa troca rápida) e a tira ao fim, com ou sem erro. O guarda do app inteiro (`installStaleBuildGuard`) também não recarrega com a rede fora. `utils/prefetchScreens.js`: as telas carregadas sob demanda do menu descem em segundo plano depois da primeira tela (uma de cada vez, sem segurar nada). `app.js`: as rotas de playlists guardadas passam pelo prazo de 10 s. Mudei o andaime de testes antigos (não o sentido): `router.staleBuild.test.js` agora injeta `checkPublication` (a rede do jsdom não responde) e os três testes do guarda esperam um tick, porque o reload agora espera a resposta sobre a publicação; no guarda a asserção `defaultPrevented` do `vite:preloadError` saiu (o evento não é mais impedido de forma síncrona). `renderView` ficou com 11 e foi partida (`showFailure`). 421 testes verdes (`test/architecture`, `utils`, `react`); lint e typecheck sem erro.

## [2026-11-21 13:42] session — F68: a reconferência visual do lote fecha a linha que faltava; Done
**Branch:** wip/closing-pass-2026-11-21
F68 (F68-album-identity-rules-reviewed): o código está na `main`. A trava do passo retroativo (`retro_step_check.py . --staged`, feature em `Done`) passa sem nenhuma falta; a única linha que faltava, a reconferência visual, está coberta pelo relatório do lote de 2026-11-21 (`reports/audits/2026-11-21-mjrpalbumblender-v0-albums-series-visual-parity-recheck.md`). Tarefa de reconferência marcada feita, spec em `Done`. Nenhum carimbo de aceite: o aceite no UAT é do MJRP.

## [2026-11-21 13:41] session — F61: a reconferência visual do lote fecha a linha que faltava; Done
**Branch:** wip/closing-pass-2026-11-21
F61 (F61-saved-playlists-fast): o código está na `main`. A trava do passo retroativo (`retro_step_check.py . --staged`, feature em `Done`) passa sem nenhuma falta; a única linha que faltava, a reconferência visual, está coberta pelo relatório do lote de 2026-11-21 (`reports/audits/2026-11-21-mjrpalbumblender-v0-playlists-blend-visual-parity-recheck.md`). Tarefa de reconferência marcada feita, spec em `Done`. Nenhum carimbo de aceite: o aceite no UAT é do MJRP.

## [2026-11-21 13:41] session — F55: a reconferência visual do lote fecha a linha que faltava; Done
**Branch:** wip/closing-pass-2026-11-21
F55 (F55-the-album-asked-for-or-a-notice): o código está na `main`. A trava do passo retroativo (`retro_step_check.py . --staged`, feature em `Done`) passa sem nenhuma falta; a única linha que faltava, a reconferência visual, está coberta pelo relatório do lote de 2026-11-21 (`reports/audits/2026-11-21-mjrpalbumblender-v0-albums-series-visual-parity-recheck.md`). Tarefa de reconferência marcada feita, spec em `Done`. Nenhum carimbo de aceite: o aceite no UAT é do MJRP.

## [2026-11-21 13:40] session — F54: a reconferência visual do lote fecha a linha que faltava; Done
**Branch:** wip/closing-pass-2026-11-21
F54 (F54-close-v4-inventory-delete-and-polish): o código está na `main`. A trava do passo retroativo (`retro_step_check.py . --staged`, feature em `Done`) passa sem nenhuma falta; a única linha que faltava, a reconferência visual, está coberta pelo relatório do lote de 2026-11-21 (`reports/audits/2026-11-21-mjrpalbumblender-v0-inventory-visual-parity-recheck.md`, `reports/audits/2026-11-21-mjrpalbumblender-v0-shell-start-visual-parity-recheck.md`). Tarefa de reconferência marcada feita, spec em `Done`. Nenhum carimbo de aceite: o aceite no UAT é do MJRP.

## [2026-11-21 13:40] session — F50: a reconferência visual do lote fecha a linha que faltava; Done
**Branch:** wip/closing-pass-2026-11-21
F50 (F50-one-local-address): o código está na `main`. A trava do passo retroativo (`retro_step_check.py . --staged`, feature em `Done`) passa sem nenhuma falta; a única linha que faltava, a reconferência visual, está coberta pelo relatório do lote de 2026-11-21 (`reports/audits/2026-11-21-mjrpalbumblender-v0-shell-start-visual-parity-recheck.md`). Tarefa de reconferência marcada feita, spec em `Done`. Nenhum carimbo de aceite: o aceite no UAT é do MJRP.

## [2026-11-21 13:40] session — F49: a reconferência visual do lote fecha a linha que faltava; Done
**Branch:** wip/closing-pass-2026-11-21
F49 (F49-load-more-albums): o código está na `main`. A trava do passo retroativo (`retro_step_check.py . --staged`, feature em `Done`) passa sem nenhuma falta; a única linha que faltava, a reconferência visual, está coberta pelo relatório do lote de 2026-11-21 (`reports/audits/2026-11-21-mjrpalbumblender-v0-albums-series-visual-parity-recheck.md`). Tarefa de reconferência marcada feita, spec em `Done`. Nenhum carimbo de aceite: o aceite no UAT é do MJRP.

## [2026-11-21 13:40] session — teste vermelho: a janela do álbum mostra a nota e a popularidade que falharam (UAT-244, UAT-245)
**Branch:** wip/failed-sources-are-shown-2026-11-21
Teste que falha por falta do modelo e da ligação da janela com a carga (`test/components/ViewAlbumModal.failedSources.test.js`). Decidido pelo agente, revisável: a janela recebe `sources` (ler, pedir, observar) da tela de séries.

## [2026-11-21 13:39] session — F47: a reconferência visual do lote fecha a linha que faltava; Done
**Branch:** wip/closing-pass-2026-11-21
F47 (F47-series-list-without-cut): o código está na `main`. A trava do passo retroativo (`retro_step_check.py . --staged`, feature em `Done`) passa sem nenhuma falta; a única linha que faltava, a reconferência visual, está coberta pelo relatório do lote de 2026-11-21 (`reports/audits/2026-11-21-mjrpalbumblender-v0-albums-series-visual-parity-recheck.md`). Tarefa de reconferência marcada feita, spec em `Done`. Nenhum carimbo de aceite: o aceite no UAT é do MJRP.

## [2026-11-21 13:35] step — F83 TASK-04: a ponte do React com o roteador (ReactView, useStore, usePhone, useScreenTitle, navigate)
**Branch:** claude/f83-wave-0-base
`react-bridge/`: `ReactView.tsx` (a tela é uma view do roteador; a barreira de erro desenha o painel do roteador — o texto e o botão vêm de um modelo só, `utils/failurePanel.js`, que o roteador também usa — e conta o erro por `track('screen_error', { screen })`; modo estrito ligado), `useStore.ts` (um número de versão por store e um ouvinte fixo por store, pelo contrato da proposta § 4.3), `usePhone.ts`, `useScreenTitle.ts`, `navigation.ts` (navegar adiado uma microtarefa), `listeners.ts` (`bridgeListenerCount()`, com o ouvinte fixo contado à parte). `router.afterNavigate` devolve como parar de ouvir. Evento novo `screen_error` em `shared/usageEvents.js` e uma frase em `behavior.md`. Testes: entra, sai e volta cinco vezes sem ouvinte de tela sobrando; um erro ao desenhar mostra o painel e é contado; nas três formas de store (`getState` novo a cada chamada, sem foto, aviso em lote) a store muda entre o primeiro desenho e a inscrição e a tela mostra o valor novo; navegar de dentro de um efeito não quebra. A ponte ainda não tem usuário: entra em `KEPT_ON_PURPOSE` do `noDeadModules` até o canário (TASK-10), que tira as linhas. Corrigido de passagem: `outsideTextEscaped` e `outsideUrlChecked` passavam o nome do arquivo só nos exemplos. 408 testes de `test/architecture`, `test/react` e afins verdes; lint e typecheck sem erro.

## [2026-11-21 13:35] decision — ids de UAT renumerados na integração de `wip/visual-recheck-batch-2026-11-21`

> Participantes: Claude (Claude Code), integrador · Branch: main

- `UAT-240` da `wip/visual-recheck-batch-2026-11-21` colidiu com outra issue de mesmo id e virou `UAT-254` (ordem de chegada).
  - As referências listadas abaixo ainda citam o id velho `UAT-240` e valem para a issue do ramo (hoje `UAT-254`); a reescrever em um commit seguinte, sem tocar nas que citam a issue da `main`:
    - `docs/log.md:20: Juiz separado (Opus) olhou a tela de hoje, em produção e no servidor de desenvolvimento da `main`, a 1280 e 393, contra o design system; nen`
    - `reports/audits/2026-11-21-mjrpalbumblender-v0-shell-start-visual-parity-recheck.md:43: - **P2-1 · F57 · a janela «Edit Series» não acompanhou a Start.** Mesma peça e mesmos dados, mas a ficha escolhida é laranja preenchida (o d`
- `UAT-241` da `wip/visual-recheck-batch-2026-11-21` colidiu com outra issue de mesmo id e virou `UAT-255` (ordem de chegada).
  - As referências listadas abaixo ainda citam o id velho `UAT-241` e valem para a issue do ramo (hoje `UAT-255`); a reescrever em um commit seguinte, sem tocar nas que citam a issue da `main`:
    - `reports/audits/2026-11-21-mjrpalbumblender-v0-shell-start-visual-parity-recheck.md:44: - **P2-2 · F48 · no computador, em `/start`, o rodapé (com «Clear Cache») fica sob a base fixa da série,** mesmo com a página rolada até o f`

## [2026-11-21 13:35] session — conform: as 8 perguntas do relatório viram um lote para o Control Center
**Branch:** wip/kernel-conform-2-2026-11-21
Lote `reports/proposals/2026-11-21-1335-v0-conform-questions.md` (proposal-batch@1, 8 itens, recomendada primeiro). Nenhuma pergunta respondida nem registrada como respondida. `proposal_batches.py check` passou. Decidido pelo agente, revisável pelo MJRP.

## [2026-11-21 13:34] session — conform: `process-sensors` completo, `sensors.board_states` declarado (CM-0144, 0148, 0150, 0153, 0154, 0155, 0156, 0157)
**Branch:** wip/kernel-conform-2-2026-11-21
Com o seed do board já rodado no checkout principal, declarei `sensors.board_states` no contrato (`board_states_check.py`). O sensor saiu com exit 0 («o grafo e o registro conferem») e as 8 notas passaram em `--check-note` antes de serem registradas. Decidido pelo agente, revisável pelo MJRP.

## [2026-11-21 13:33] review — reconferência visual em lote, grupo playlists, playlists guardadas, blend e exportar (F61, F73): fail sem P0, sem P1, 2 P2
**Branch:** wip/visual-recheck-batch-2026-11-21
Juiz separado (Opus) olhou as playlists geradas, as guardadas e o Blending Menu de hoje, a 1280 e 393, contra o design system, pela costura das provas da F76 (as telas, o controlador e o leitor reais com uma fonte de mentira; sem entrar, nada gravado); nenhuma dessas features teve protótipo aprovado. Relatório: `reports/audits/2026-11-21-mjrpalbumblender-v0-playlists-blend-visual-parity-recheck.md`; capturas em `reports/evidence/visual-recheck-batch/2026-11-21/playlists/`. Dois P2 (UAT-252, UAT-253). Fecha a série de quatro relatórios do lote; nada fechado no board.

## [2026-11-21 13:32] review — reconferência visual em lote, grupo inventário (F54, F71, F73): fail sem P0, sem P1, 1 P2
**Branch:** wip/visual-recheck-batch-2026-11-21
Juiz separado (Opus) olhou o inventário e a janela do álbum de hoje, a 1280 e 393, contra o design system, pela costura das provas da F76 (as telas reais com 211 itens de fixture e o serviço real sobre um repositório em memória; sem entrar, nada gravado); nenhuma dessas features teve protótipo aprovado. Relatório: `reports/audits/2026-11-21-mjrpalbumblender-v0-inventory-visual-parity-recheck.md`; capturas em `reports/evidence/visual-recheck-batch/2026-11-21/inventory/` e o ajudante comum `cdp-lib-inventory-playlists.mjs`. O filtro de situação da F71 foi trocado pela F75 pelos três botões de contagem: registrado, sem issue. Um P2 (UAT-251). Nada fechado.

## [2026-11-21 13:31] session — F80: a home em português, «A barra é o menu» v2, no comparador (UAT-241, UAT-240)
**Branch:** wip/f80-home-menu-and-slider
Palavras do MJRP (2026-11-21): «sugiro rever o prototipo já com texto tudo me portugues pls»; sobre o ranking, «o user nao deve rank every track, ele ranqueia o que ele quer, as vezes ele que colocar so uma track no topo, entao o copy aqui deve mudar. Rank your tracks...algo mais flexivel em termos de copy»; sobre o cartão ilustrativo, «isso aqui tb nao deve ser ilustrativo, vamos colocar dados rais de album pls»; sobre a tela «End of side A · Flip the record», «faz sentido isso aqui ?». A direção, nas palavras dele: «a barra é o menu» e «mas pode falar pra ele fazer só para a opcao recomendada» — a B, só ela refeita. Nova versão `design/inception/splash-menu-bar-v2.html` (gerador `home-menu/build_v2.mjs`, wireframes `design/wireframes/splash-menu-bar-v2-*.png`): todo o texto em português com chave PT/EN; o ranking parcial («Ponha no topo as faixas que você quiser.» / «Rank your tracks, your way.»); o cartão com The Velvet Underground & Nico e as faixas reais (busca pública do iTunes), sem notas de terceiros; a virada como faixa curta, filete no celular. Padrões aplicados como «decidido pelo agente — revisável» (`proposal.md` § Rodada 3 · v2, com a tabela PT/EN, proposta a revisar). Crítica separada: passa, 0 P0, 5 P1, 8 P2; corrigidos antes de publicar a capa da história de Álbuns no celular, os 11 px abaixo de 380 px, o sobretítulo repetido, o verbo do ranking, as portas, a chave de idioma, o filete da virada e o registro no `info-arch.md` e no `design-system.md`. Comparador republicado na mesma URL (versão 10): abre em «A home em português: é este o caminho?», a v2 ao lado da prévia que ele viu, chaves PT/EN e sem conta/com conta; **48 palavras na primeira tela**; as três prévias em `home-menu-abc.html`, atrás de «Rodadas anteriores».

## [2026-11-21 13:30] review — reconferência visual em lote, grupo álbuns e séries (F45, F46, F47, F48, F49, F51, F52, F55, F68, F69, F72, F74): fail sem P0, 2 P1, 5 P2
**Branch:** wip/visual-recheck-batch-2026-11-21
Juiz separado (Opus) olhou a tela de álbuns e a janela do álbum de hoje, a 1280 e 393, contra o design system, pela costura das provas da F76 (a `SeriesView` e as janelas reais com dados de fixture; sem entrar, nada gravado); nenhuma dessas features teve protótipo aprovado. Relatório: `reports/audits/2026-11-21-mjrpalbumblender-v0-albums-series-visual-parity-recheck.md`; capturas em `reports/evidence/visual-recheck-batch/2026-11-21/albums/`. Os dois P1 são estados de falha que os requisitos descrevem e que nenhuma tela mostra: a nota que falhou (F52, UAT-244) e a popularidade que falhou (F69, UAT-245). P2 em UAT-246 a UAT-250. Nada fechado.

## [2026-11-21 13:28] step — F83 TASK-03: os sensores novos da migração (só encolhe, o React na borda, um estilo, um React)
**Branch:** claude/f83-wave-0-base
Sete sensores em `test/architecture/`, cada um com o exemplo errado que acusa e passando no código de hoje: `handMadeScreensOnlyShrink` (a lista `handMadeScreensBaseline.js`: os 100 arquivos de `views/` e `components/` com as linhas de cada um, mais o desenho feito à mão fora das duas pastas que o levantamento achou — `utils/SafeDOM.js`, `services/DialogService.js`, `utils/pageScrollLock.js`; arquivo novo falha, crescer mais de 20 linhas falha, entrada sem arquivo falha), `bridgesOnlyShrink`, `reactStaysAtTheEdge` (só `screens/`, `ui/`, `shell/`, `react-bridge/` importam o React; `ui/` não importa store, serviço nem controlador; só o `app.js` importa `screens/` e `shell/`; os `as unknown as` só na ponte, numa lista que só encolhe), `oneStyleSystem`, `lazyOnlyAtTheRoute`, `oneReact` (site, app e o lock) e `everyScreenHasTheLeaveTest`. Os leitores novos: `support/siteImports.js`. `test/architecture`: 300 verdes; lint e typecheck sem erro. Decisão minha: a lista de hoje tem 100 arquivos em `views/` e `components/` (a proposta dizia 99).

## [2026-11-21 13:26] session — conform parcial do V0 depois do kernel de 2026-11-21: 90 para 46 notas, 11 para 10 lacunas
**Branch:** wip/kernel-conform-2026-11-21
Relatório em `reports/audits/2026-11-21-mjrpalbumblender-v0-conform.md`: o que foi registrado (38 notas), feito (6), o que ficou (46 notas, 10 lacunas) e as oito perguntas ao MJRP. O critério estrito do portão segue em 1; o que falta depende do MJRP, do orquestrador (`board_move.py seed` no checkout principal) e da auditoria de conteúdo, que vai por último. Não rodei o doctor, os testes nem o build. Decidido pelo agente, revisável pelo MJRP.

## [2026-11-21 13:26] review — mjrp-critiquing-ux-ui: F80 home «A barra é o menu» v2 em português · passa, sem P0
`reports/audits/2026-11-21-f80-home-pt-v2-ux-audit.md` · P0 0 · P1 5 · P2 8 · quem julgou: agente separado.

## [2026-11-21 13:25] step — F83 TASK-02: os sensores que existem leem .ts e .tsx
**Branch:** claude/f83-wave-0-base
Um leitor só para os sensores (`test/architecture/support/parseSource.js`: espree para `.js`, typescript-estree para `.ts`/`.tsx`, com `loc` e `range`) e uma lista de arquivos de código única. Ensinados: `importGraph` (segue `import`, `import()` e `.ts`/`.tsx`; `noDeadModules` passa a vigiar os arquivos React), `sourceImports` (`layerBoundaries`, `screensLoadThroughTheService`: `screens/`, `ui/` e `shell/` entram na lista do que é tela), `measureComplexity` (`complexityLimit`, o teto de 10 sem lista de exceções para o código novo), `historyOwnedByRouter`, `outsideTextEscaped`, `outsideUrlChecked` (lê `href={…}` em JSX), `tailwindBuiltWithSite` (uma classe só escrita em `.tsx` chega ao CSS), `viewLifecycle`, `oneTabTitle` e, para o dicionário em português não quebrá-lo, `interfaceInEnglish` (lê `.ts`/`.tsx`; português só em `i18n/pt/`). Cada um acusa o seu exemplo em `test/architecture/fixtures/typescript/`. `test/architecture` inteira: 273 verdes; lint e typecheck sem erro.

## [2026-11-21 13:25] session — conform: `delivery-strategy` registrado (CM-0111)
**Branch:** wip/kernel-conform-2026-11-21
Escrita a seção `## Delivery strategy` do `docs/specs/arch.md` lendo os scripts de deploy, o workflow de CI, o `firebase.json`, a ADR-0020 e o contrato; marcada **proposta do agente, à espera do MJRP** (a regra de que só o MJRP envia não mudou). O que o repositório não mostra (se existe canal de preview no Firebase, se há projeto de teste separado) está escrito «not checked». `delivery_strategy_check.py` sai verde com o aviso de proposta; `--check-note CM-0111` passou. A confirmação é do MJRP. Decidido pelo agente (a forma), a decisão do conteúdo é do MJRP.

## [2026-11-21 13:24] session — conform: `uat.md` com a trilha Agente/Juiz separada em 7 issues (uat@4, parcial)
**Branch:** wip/kernel-conform-2026-11-21
Acrescentado `**Aberta por:** agente (<quem>)`, lido da evidência que cada issue cita, em UAT-224, 225, 226, 231, 232, 233 e 234, e a coluna `Reportado por` de UAT-231 a 234 passou de «agente (juiz da F80/F79)» para `juiz` (a forma que a regra aceita; o nome do juiz foi para o `Aberta por`). Faltam 3 lacunas, de UAT-224, 225 e 226: a célula «OK do humano» traz a frase do histórico anterior ao harness (regra de 2026-10-18) numa issue de 2026-11-20, que não é anterior ao harness, e a âncora delas é `^UAT-171` (copiada da UAT-171). Não escrevi o OK (`recheck independente:` ou `testes verdes:`) porque nenhuma evidência no repositório o prova, e não mexi na âncora: vai ao MJRP. A CM-0096 segue pendente. Decidido pelo agente, revisável pelo MJRP.

## [2026-11-21 13:23] session — conform: ADR-0019 encurtada ao teto e com a via do aceite (adr-names)
**Branch:** wip/kernel-conform-2026-11-21
A ADR-0019 (Proposed) tinha 8.553 caracteres, o teto é 6.000: o texto agora traz só a decisão, as alternativas e as consequências, e a lista de «ainda não feito» (que seguia o andamento da F56/F58) aponta para o relatório do cruzamento e para os specs; o texto antigo está no histórico do git. Ganhou `**Acceptance**: tech lead` (escolha técnica; a regra: técnica vai ao tech lead, produto e dinheiro ao MJRP). A ADR-0020 (Accepted) também não tem a linha, mas ADR aceita não se edita: fica para o MJRP (ou o tech lead) dizer se a linha entra no cabeçalho. As três notas (CM-0112, CM-0113, CM-0149) seguem pendentes até lá. Decidido pelo agente, revisável pelo MJRP.

## [2026-11-21 13:23] review — reconferência visual em lote, grupo Start, navegação e casca (F48, F50, F54, F57, F59, F64, F67): fail sem P0, 4 P2
**Branch:** wip/visual-recheck-batch-2026-11-21
Juiz separado (Opus) olhou a tela de hoje, em produção e no servidor de desenvolvimento da `main`, a 1280 e 393, contra o design system; nenhuma dessas features teve protótipo aprovado. Relatório: `reports/audits/2026-11-21-mjrpalbumblender-v0-shell-start-visual-parity-recheck.md`; capturas em `reports/evidence/visual-recheck-batch/2026-11-21/shell/`. Sem entrar com senha, nada gravado. Achados abertos como UAT-254 a UAT-243 (P2). O ramo começou como `claude/f45-visual-recheck-batch` (o número de uma feature do lote, para o gancho de commit) e virou `wip/…` porque a trava «o estado primeiro» pedia a F45 «Em andamento» no board, que só o MJRP move; o orquestrador mandou trocar o nome. Nada fechado: o `Done` fica para o passo de fecho.

## [2026-11-21 13:22] session — conform: `process-sensors` registrado (CM-0107, CM-0121, CM-0129, CM-0135, CM-0140)
**Branch:** wip/kernel-conform-2026-11-21
Declarados em `sensors:` do contrato os quatro sensores do processo que passam hoje (`pdlc_vocabulary`, `sdd_shape`, `requirements_graph_check`, `hooks_map`); os quatro saíram com exit 0. Ficam pendentes as 8 notas seguintes (CM-0144 a CM-0157), que pedem também `sensors.board_states`: o juiz acha 54 features sem registro no board, e o conserto é `board_move.py seed`, que grava em `<checkout principal>/.mjrp/board.jsonl` (fora do git e fora deste ramo). Não rodei o seed daqui: é do orquestrador, no checkout principal; depois dele se declara `board_states` e se registram as 8 notas. Decidido pelo agente, revisável pelo MJRP.

## [2026-11-21 13:21] session — conform: `type:` de 8 relatórios acertado (report-names)
**Branch:** wip/kernel-conform-2026-11-21
Pelo cabeçalho e pelo tema de cada um: `type: research` em 7 (o benchmark de UX do celular e a checagem dele, a análise da carga de álbuns, o estudo de viabilidade do produto público, a viabilidade do preço de CDs, a análise do framework do site e a régua do volume de texto) e `content-audit` no levantamento dos textos do site (F81). Seguem sem tipo da lista 8 relatórios (regressão no navegador, cruzamento dos relatórios com o plano da v5, triagem das issues abertas, varredura das fontes das notas, mapa da v5, e-mails de contato, a atualização do kernel e a limpeza dos worktrees): a regra manda perguntar ao MJRP, porque tipo novo entra na lista do harness. Decidido pelo agente, revisável pelo MJRP.

## [2026-11-21 13:20] session — conform: relatórios de `reports/audits/` renomeados para o padrão (report-names)
**Branch:** wip/kernel-conform-2026-11-21
16 relatórios (as reconferências visuais e as críticas de UX de F56 a F86 e a pesquisa de cópia da F81) passaram de `AAAA-MM-DD-FNN-…` para `AAAA-MM-DD-mjrpalbumblender-v0-fnn-…`, com `git mv`; o nome antigo foi varrido do repositório (docs, specs, UAT, `info-arch.md`, propostas, um teste e um script de cópia que citavam o caminho). NÃO foram tocados os 5 arquivos de protótipo em `design/` (html e css) que citam o nome antigo em comentário: mexer neles dispara a trava do espelho do protótipo (wireframe e info-arch refeitos), que é da `mjrp-designing-ui`. Duas críticas de arquitetura (F52, F78) trocaram `type: architecture-critique` por `architecture-audit` com `status: open` (na dúvida, aberta). Os outros 16 `type:` fora da lista e os 4 pareceres do harness sem o segmento do projeto ficam para o MJRP/harness. Decidido pelo agente, revisável pelo MJRP.

## [2026-11-21 13:19] step — F83 TASK-01: as ferramentas do React no site (React 19.3.0 exato, TypeScript, plugin do Vite, tsconfig, lint, typecheck)
**Branch:** claude/f83-wave-0-base
`react` e `react-dom` 19.3.0 exatos (o `overrides` da raiz vale para o site e o app: um React só), `typescript` 6.0.3, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react` 4.7.0, `typescript-eslint`, `eslint-plugin-react-hooks`. `vite.config.js` e `vitest.config.js` com o plugin; o Vitest roda `.test.ts(x)`; `tsconfig.json` estrito (`allowJs`, sem `checkJs`); `npm run typecheck` dentro de `npm run lint`, no CI e em `run_lint` dos scripts de publicação; bloco de `.ts/.tsx` no ESLint (complexidade 10, hooks, sem `dangerouslySetInnerHTML`, sem `any` nem `as unknown as` em `screens/`, `ui/`, `shell/`); o Tailwind lê `.tsx`. Prova: `test/architecture/reactToolchain.test.js` (8) e `test/react/toolchain.test.tsx` (1); `test/architecture` inteira 262 verdes; typecheck e lint sem erro. Nenhuma tela mudou. Feito sob a decisão do MJRP de 2026-11-21 (Control Center); a ADR-0023 continua Proposed.

## [2026-11-21 13:18] session — conform: `merge-drivers` registrado (CM-0130)
**Branch:** wip/kernel-conform-2026-11-21
O `--check-note` passou em todas as notas do item sem mudar nenhum arquivo do projeto; só o registro em `conformance.applied`. Decidido pelo agente, revisável pelo MJRP.

## [2026-11-21 13:18] session — conform: `session-close` registrado (CM-0124, CM-0132, CM-0136, CM-0137, CM-0146, CM-0151, CM-0160, CM-0164, CM-0165)
**Branch:** wip/kernel-conform-2026-11-21
O `--check-note` passou em todas as notas do item sem mudar nenhum arquivo do projeto; só o registro em `conformance.applied`. Decidido pelo agente, revisável pelo MJRP.

## [2026-11-21 13:18] session — conform: `board` registrado (CM-0095, CM-0123, CM-0141, CM-0145, CM-0147)
**Branch:** wip/kernel-conform-2026-11-21
O `--check-note` passou em todas as notas do item sem mudar nenhum arquivo do projeto; só o registro em `conformance.applied`. Decidido pelo agente, revisável pelo MJRP.

## [2026-11-21 13:18] session — conform: `inception-notes` registrado (CM-0039)
**Branch:** wip/kernel-conform-2026-11-21
O `--check-note` passou em todas as notas do item sem mudar nenhum arquivo do projeto; só o registro em `conformance.applied`. Decidido pelo agente, revisável pelo MJRP.

## [2026-11-21 13:17] session — conform: `info-arch-sections` registrado (CM-0038, CM-0119, CM-0127)
**Branch:** wip/kernel-conform-2026-11-21
O `--check-note` passou em todas as notas do item sem mudar nenhum arquivo do projeto; só o registro em `conformance.applied`. Decidido pelo agente, revisável pelo MJRP.

## [2026-11-21 13:17] session — conform: `requirement-nodes` registrado (CM-0102)
**Branch:** wip/kernel-conform-2026-11-21
O `--check-note` passou em todas as notas do item sem mudar nenhum arquivo do projeto; só o registro em `conformance.applied`. Decidido pelo agente, revisável pelo MJRP.

## [2026-11-21 13:17] session — conform: `product-structure` registrado (CM-0097, CM-0098, CM-0106)
**Branch:** wip/kernel-conform-2026-11-21
O `--check-note` passou em todas as notas do item sem mudar nenhum arquivo do projeto; só o registro em `conformance.applied`. Decidido pelo agente, revisável pelo MJRP.

## [2026-11-21 13:17] session — conform: `wireframes` registrado (CM-0009)
**Branch:** wip/kernel-conform-2026-11-21
O `--check-note` passou em todas as notas do item sem mudar nenhum arquivo do projeto; só o registro em `conformance.applied`. Decidido pelo agente, revisável pelo MJRP.

## [2026-11-21 13:16] session — F83 onda 0 (a base) começa, num agente Sonnet
**Branch:** claude/f83-wave-0-base
Ramo `claude/f83-wave-0-base` cortado da `main` (`3356113`). Contrato: spec, plano, tarefas TASK-01 a TASK-10, proposta de arquitetura e ADR-0023 (continua Proposed; o aceite é um commit do MJRP). O card da F83 foi movido a «Em andamento» com `board_move.py move F83 in_progress --why`, como o gancho (regra 39) pediu.

## [2026-11-21 13:16] session — conform: `visual-sensor` registrado (CM-0007, CM-0023, CM-0090, CM-0091, CM-0099, CM-0115, CM-0116, CM-0117, CM-0125, CM-0142, CM-0162, CM-0166)
**Branch:** wip/kernel-conform-2026-11-21
O `--check-note` passou em todas as notas do item sem mudar nenhum arquivo do projeto; só o registro em `conformance.applied`. Decidido pelo agente, revisável pelo MJRP.

## [2026-11-21 13:16] session — conform: `releases` registrado (CM-0134, CM-0159)
**Branch:** wip/kernel-conform-2026-11-21
O `--check-note` passou nas duas notas (releases@3→4 e @4→5) sem mudar nenhum arquivo do projeto; só o registro em `conformance.applied`. Decidido pelo agente, revisável pelo MJRP.

## [2026-11-21 13:11] decision — o MJRP respondeu as oito perguntas do React e dos idiomas: a opção recomendada em todas
**Branch:** main
Pelo Control Center, com a passkey (13:11), lote `reports/proposals/2026-11-21-1258-v0-react-and-languages.md`: ritmo em sequência com uma parada depois de duas telas medidas; aceita mudar a constituição para o React e os dois idiomas, juntos; endereço por idioma só na home; a escolha do idioma no aparelho e, depois da regra nova do banco, na conta; sem saber o país, o idioma do navegador; a home em português junto; a ordem das telas começando pela base e pela tela difícil; o português abre de uma vez, com tudo pronto. Está nas specs da F83 e da F81. A primeira etapa da migração (a base) começa agora, num agente interno em Sonnet. A ADR-0023 segue proposta: o aceite é um commit dele.

## [2026-11-21 13:11] answer — lote 2026-11-21-1258-v0-react-and-languages

- Lote: `reports/proposals/2026-11-21-1258-v0-react-and-languages.md`
- Envio: 581e31df7e83cf2d
- Recomendações aceitas: D-01, D-02, D-03, D-04, D-05, D-06, D-07, D-08
- Pela tela do Control Center, com o Touch ID.

## [2026-11-21 13:07] session — rodada 3 de desenho da home na `main`; a issue do ramo foi renumerada de UAT-239 para UAT-241
**Branch:** main
O ramo `wip/f80-home-menu-and-slider` usou o número UAT-239 para «com conta, a home com o menu e o botão Start», que na `main` já era a issue da raiz mostrando a home a todos. A ferramenta do trem renumerou a do ramo para UAT-241, e as citações nos arquivos do ramo foram acertadas; as entradas antigas do log do ramo, abaixo, ainda dizem UAT-239 para esse assunto. Comparador republicado no mesmo endereço (https://claude.ai/artifact/5hDJr8qToYkAEsgCrfUK8e): uma pergunta, a página de hoje e três prévias (A · Fio com paradas, B · O menu é a barra, C · Barra embaixo), com a chave sem conta / com conta; a crítica separada passou, sem P0.

## [2026-11-21 13:07] decision — ids de UAT renumerados na integração de `wip/f80-home-menu-and-slider`

> Participantes: Claude (Claude Code), integrador · Branch: main

- `UAT-239` da `wip/f80-home-menu-and-slider` colidiu com outra issue de mesmo id e virou `UAT-241` (ordem de chegada).
  - As referências listadas abaixo ainda citam o id velho `UAT-239` e valem para a issue do ramo (hoje `UAT-241`); a reescrever em um commit seguinte, sem tocar nas que citam a issue da `main`:
    - `design/inception/splash-menu-bar-v1.html:194: /* ===== F80 · home menu preview (UAT-239, UAT-240): shared ===== */`
    - `design/inception/splash-menu-deck-v1.html:194: /* ===== F80 · home menu preview (UAT-239, UAT-240): shared ===== */`
    - `design/inception/splash-menu-stops-v1.html:194: /* ===== F80 · home menu preview (UAT-239, UAT-240): shared ===== */`
    - `design/proposals/f80-splash/home-menu/build.mjs:2: * F80 · the home with the menu as the slider (UAT-239, UAT-240), 2026-11-21.`
    - `design/proposals/f80-splash/home-menu/build.mjs:212: /* ===== F80 · home menu preview (UAT-239, UAT-240): shared ===== */`
    - `design/proposals/f80-splash/proposal.md:225: **Pedido** (UAT-239, UAT-240, as palavras dele estão nas linhas): com conta, a home com o menu e «Start»; a barra contínua da «Elevar»; a ba`
    - `design/proposals/info-arch/info-arch.html:52: <section id="top"><h1>Info-arch — Album Blender V0</h1><blockquote>Aprovado por: ainda não aprovado (nasceu em 2026-11-20 00:28, com a rodad`
    - `design/proposals/info-arch/info-arch.html:56: <p>Desde a F76 o arquivo descreve também <b>o celular</b> (até 767 px), em duas seções: «O celular (F76)» e «Estados no celular». O que está`
    - `design/proposals/info-arch/info-arch.html:62: <p>Pedido do MJRP (UAT-239, UAT-240): com conta, a home com o menu e «Start», sem «Sign in» e «Open the app»; a barra contínua como na «Elev`
    - `design/proposals/info-arch/info-arch.html:103: <div class="table"><table><thead><tr><th>ID</th><th>O que a tela mostra</th><th>Função do produto</th><th>Destino</th></tr></thead><tbody><t`
    - `docs/log.md:6: ## [2026-11-21 13:04] session — F80: a home com o menu na barra, três prévias no comparador (UAT-239, UAT-240)`
    - `docs/log.md:8: Pedidos do MJRP (2026-11-21), registrados como UAT-239 e UAT-240 com as palavras dele: com conta, a home com o menu e «Start»; «o slider dev`
    - `docs/specs/design-system.md:141: Das prévias de 2026-11-21 (`design/inception/splash-menu-{stops,bar,deck}-v1.html`; UAT-239, UAT-240). **Pendentes de aprovação do MJRP**; s`
    - `docs/specs/info-arch.md:6: > Página de entrada (F80), rodada 3, 2026-11-21 (UAT-239, UAT-240): a home com o menu na barra — três prévias num eixo, «quanto o menu e a b`
    - `docs/specs/info-arch.md:23: - **Página de entrada** (F80, aprovada na v2; mora na raiz `/` só para quem não entrou com conta — quem entrou vai direto a `/start`, e `/ho`
    - `docs/specs/info-arch.md:92: Pedido do MJRP (UAT-239, UAT-240): com conta, a home com o menu e «Start», sem «Sign in» e «Open the app»; a barra contínua como na «Elevar»`
    - `docs/specs/info-arch.md:548: | SPL-21 | Com conta, o topo só com «Start» com o fogo | agir | UAT-239 |`
    - `docs/specs/info-arch.md:549: | SPL-22 | Com conta, a primeira tela: «Welcome back», «Back to the crate. Start a new series.», «Start» e «Your playlists» | agir | UAT-239`
    - `docs/specs/info-arch.md:552: | SPL-25 | Com conta, em cada história, «Open <item> →», que abre a tela do app | agir | UAT-239 (pergunta 2 ao MJRP) |`
    - `reports/audits/2026-11-21-f80-home-menu-previews-ux-audit.md:3: subject: "F80 · página de entrada com o menu como fio (UAT-239, UAT-240): prévias A (paradas), B (menu é a barra), C (deck embaixo), contra `

## [2026-11-21 13:05] session — limpeza dos worktrees antigos de agentes: os prints saíram para o `_backups/`, a remoção espera a janela de 60 minutos
**Branch:** main
Sete worktrees de ramos já na `main` (F76 ×4, f59, f78-app-skeleton, f86) tiveram os arquivos fora do git que seguravam a remoção (prints, `.mjrp/before.mjs`, `app/dist`, `launch.json`) movidos para o `_backups/` do checkout principal com `retire_path`. Nenhum worktree saiu ainda: mexer neles renovou a regra de atividade recente (60 min) do `clean-worktrees`; uma nova passada com `--apply` depois disso os remove. Dois ficaram por serem grandes demais para o `_backups/` (`app/ios` 2,3 GB; saída do spike f78 585 MB). Registro em `reports/audits/2026-11-21-mjrpalbumblender-v0-worktree-cleanup.md`.

## [2026-11-21 13:04] session — F80: a home com o menu na barra, três prévias no comparador (UAT-239, UAT-240)
**Branch:** wip/f80-home-menu-and-slider
Pedidos do MJRP (2026-11-21), registrados como UAT-239 e UAT-240 com as palavras dele: com conta, a home com o menu e «Start»; «o slider deveria ser continuo como era na elevar»; a barra é o menu e a página conta «a story de cada item do menu». Decisões dele durante a rodada: «nao sabia da acessabilidade, coloque um icone discreto entao» (pausar vira ícone, em todas as prévias) e «conta aberta sempre home qdo vc acessa o link principal do site, aí vc teria o botao para start» (o estado com conta é a casa de quem volta). Três prévias num eixo, quanto o menu e a barra se juntam, tiradas da página real por `design/proposals/f80-splash/home-menu/build.mjs`: A `splash-menu-stops-v1.html` (fio com paradas), B `splash-menu-bar-v1.html` (o menu é a barra; recomendada), C `splash-menu-deck-v1.html` (barra embaixo); hoje em `home-menu/today.html`. Wireframes das seis telas em `design/wireframes/splash-menu-*-v1-{desktop,phone}.png` (gerador `home-menu/wireframes.py`), inventário SPL-20 a SPL-26 no `info-arch.md`. Crítica separada: passa, 0 P0, 5 P1, 7 P2; corrigidos os rótulos do celular, o ícone em 44 px, o ⟲ no celular, os pendentes no `design-system.md` e a rodada no `info-arch.md` (página regerada). Comparador republicado na mesma URL (https://claude.ai/artifact/5hDJr8qToYkAEsgCrfUK8e, versão 9): abre na pergunta «A home: como o menu e a barra se juntam?», **59 palavras na primeira tela**; a vista da caixa passou para `caixa-vistas.html`, atrás de «Rodadas anteriores». Nota e perguntas em `design/proposals/f80-splash/proposal.md` § Rodada 3.

## [2026-11-21 12:58] session — a proposta do React e dos idiomas na `main`; as oito decisões dela vão ao Control Center
**Branch:** main
O ramo `claude/f83-site-screens-in-react` entrou na `main` (`4a63985`) depois de a ADR-0023 ser registrada nela como proposta. As oito perguntas da proposta («Decisões do MJRP») estão no lote `reports/proposals/2026-11-21-1258-v0-react-and-languages.md`, para ele responder pelo Control Center: o ritmo, a mudança da constituição, o endereço por idioma, onde fica a escolha do idioma, o idioma sem país, a home em português, a ordem das telas e quando o português abre. O aceite da ADR-0023 não vai no lote: é um commit dele.

## [2026-11-21 12:58] decision — ADR-0023 registrada na `main` como proposta: as telas do site em React e TypeScript, tela a tela, com os textos num dicionário por idioma
**Branch:** main
O trem recusou o ramo `claude/f83-site-screens-in-react` porque a ADR que espera o MJRP nasce na `main`, registrada pelo orquestrador, para o Control Center mostrá-la. Registrada como `docs/decisions/0023-site-screens-in-react-screen-by-screen.md`, `Proposed`, igual ao texto do ramo; a crítica separada deu «pode ir ao MJRP» (0 P0, 10 P1 respondidos na proposta, 3 P2). O aceite é dele, no commit dele; o agente não o escreve. Na `main` desde o último registro: o lote de fecho do board (`9d46df8`), o sensor visual (`79f767d`) e o design system do site refeito do código (`9abc02e`).

## [2026-11-21 12:56] review — mjrp-critiquing-ux-ui: F80 home com o menu como fio (A/B/C) · passa, sem P0
`reports/audits/2026-11-21-f80-home-menu-previews-ux-audit.md` · P0 0 · P1 5 · P2 7 · quem julgou: agente separado.

## [2026-11-21 12:50] session — em produção: o `/home` é a página de entrada e a raiz mostra a home a todos
**Branch:** main
Palavra do MJRP: «publica». Publicado da `main` (`da3bf1c`, `/assets/main-Cp3Nsp6i.js`; 3752 testes), pela fila própria do V0. Conferido em produção: `/`, `/home` e `/home?signin` servem a página de entrada; `/start`, `/albums` e `/app.html` servem o app; com a conta dele aberta, `/` fica na home (não vai mais ao «Start») e o logotipo do app aponta para `/home`. Não visto: o clique no logotipo, iPhone de verdade, Safari. UAT-238 e UAT-239 consertadas. Para quem tem conta aberta, a home ainda mostra «Sign in» e «Open the app»: isso é da rodada de desenho em curso.

## [2026-11-21 12:48] session — o conserto do `/home` passava de dois limites de arquitetura; acertado antes de publicar
**Branch:** main
A publicação parou em dois testes de arquitetura que o conserto do `/home` (`34b51bc`) tinha quebrado e que não foram rodados antes do commit (só os arquivos tocados foram): a função `leaveToHome` tinha complexidade 14 (o teto é 10) e montava o endereço com a consulta lida de fora. Agora ela está em partes pequenas e vai sempre para `/home`, o endereço escrito no código; a consulta do endereço antigo é descartada (a página de entrada tem o seu «Sign in»). Lição para o orquestrador: ao aplicar na `main` o trabalho de um agente, rodar também os testes de `test/architecture/`. Decisões do MJRP de hoje nesta frente: «conta aberta sempre home qdo vc acessa o link principal do site, aí vc teria o botao para start» (UAT-239, `320e460`); o «Pause motion» vira «um icone discreto»; «crie um novo prototipo para a questao do slider e da revisao da landing-splash-home page … no comparador» (rodada de desenho em curso, ramo `wip/f80-home-menu-and-slider`).

## [2026-11-21 12:38] session — F85: a raiz `/` mostra a página de entrada a todos (UAT-239)
**Branch:** main
O MJRP: «conta aberta sempre home qdo vc acessa o link principal do site, aí vc teria o botao para start». A raiz deixou de mandar quem tem conta a `/start`: `public/splash/gate.js` perdeu `runGate`, o redirecionamento, a espera e a classe `html.gate`; ficou a leitura pura `hasAccount(win)` (conta no IndexedDB ou localStorage), para o próximo passo trocar o cabeçalho. O plugin `entryPage` não injeta mais script no `<head>` (lugar `gate` removido de `splash.html`). `/home`, `?entry`, `/start`, `/start?signin` e os links diretos como antes; os botões da página seguem para `/start`. Testes de gate e entryPage reescritos; behavior, arch, manual, REQ-03 da F85 e UAT-239 atualizados.

## [2026-11-21 12:28] session — F85: o /home é a página de entrada, para todos (UAT-238)
**Branch:** fix/f85-home-is-the-entry-page
O MJRP, em produção: «o /home agora deveria ser o entry». firebase.json reescreve /home para /index.html antes do **; o plugin entryPage responde /home no dev e no vite preview; o gate.js mostra a página sempre em /home; a rota /home do app sai para o navegador uma vez (leaveToHome, sem laço); o logotipo leva a /home.

## [2026-11-21 12:17] session — em produção: «Start» no menu (F85), a caixa de discos em diagonal e a capa da banana (F80), o contorno laranja (UAT-232)
**Branch:** main
Publicado da `main` (`6909689`, `/assets/main-CXGMhC4B.js`; 3748 testes) e conferido em produção: `reports/evidence/F80/2026-11-21-production-proof.md`. Decisão do MJRP que destravou: «album blender tem que ser fila separada do harness, os projetos filhos sao independentes nesse sentido» — o V0 passa a usar a sua própria fila (`MJRP_MACHINE_HOME=~/.mjrp/album-blender` nas chamadas do orquestrador); a publicação roda em prioridade normal (`MJRP_HEAVY_NICE=off`), porque o teste de tempo do inventário estoura em baixa prioridade. Na `main` desde o último registro: a pesquisa da régua de texto (`a6fccb0`), os ajustes da página de entrada (`2e690e2`, reconferência 0 P0, 0 P1, 1 P2 = UAT-237), o «Start» no menu (`6909689`, reconferência passa, 1 P2: a tela de álbuns vazia ainda diz «from the home page»). Faltam juntar: a proposta do React (`claude/f83-…`), o lote de fecho (`claude/f45-batch-close-merged-features`), o design system (`claude/f86-…`), o sensor visual (`claude/f84-…`).

## [2026-11-21 12:03] session — a publicação parou duas vezes: o limite da fila quebra o Vitest, e um erro de lint no script do levantamento de textos
**Branch:** main
A publicação que o MJRP mandou («publica») falhou primeiro porque a fila da máquina, na versão que veio com o kernel de hoje, limita os trabalhadores do Vitest sem dar o mínimo, e o Vitest 1.6.1 morre antes de rodar («minThreads and maxThreads must not conflict»); contornado com `VITEST_MIN_THREADS=1` no ambiente de quem chama, confirmado pelo agente mestre, que leva o conserto do harness ao MJRP. Na segunda vez parou no lint: dois escapes desnecessários em `scripts/i18n/scan-copy.cjs` (do ramo dos textos), consertados aqui; a expressão casa o mesmo. Nada foi publicado nas duas vezes; produção intacta. O levantamento de textos (F81) entrou na `main` (`5be6ffd`). O juiz independente dos ajustes da página de entrada deu 0 P0, 0 P1 e 1 P2 (UAT-237, o caixote sem 3D); o MJRP disse que pode ir a produção com o achado.

## [2026-11-21 12:03] review — F85: reconferência visual independente (passa, sem P0 nem P1; 1 P2)
**Branch:** claude/f85-start-in-the-menu
Session: claude-code:claude/f85-start-in-the-menu (agente juiz, separado do implementador)
O ramo em `09a0c61` contra a produção, deslogado, a 1280 e 393: só mudou o rótulo «Start» onde havia «Home» e o botão «Go to Start»; a aba cabe sem corte e a barra mantém 57 px; o logotipo leva a `/?entry`; `/home` e `/home?signin` levam a `/start`. Sem o sensor do projeto; sem telas com conta. Relatório: `reports/audits/2026-11-21-mjrpalbumblender-v0-visual-parity-recheck.md`; capturas em `reports/evidence/F85-visual-recheck/`.

## [2026-11-21 11:56] review — reconferência visual da caixa em diagonal e da capa da banana (UAT-235, UAT-236): fail, sem P0 nem P1
**Branch:** fix/f80-uat-entry-page
Um agente que não implementou julgou a página de entrada do ramo contra a prévia 2 («Palco largo») e as palavras do MJRP. A caixa em 3D fica em diagonal e inteira no quadro em todas as posições, de 900 a 1920 px. O palco vai até a borda direita. A capa da banana é o primeiro disco e o King Crimson o segundo; são 15 capas reais e 14 fictícias, sem faltar nenhuma. A faixa e «Flip the record» funcionam. O celular fica como antes. O sensor, com a `main` de referência, deu 0 · 0 · 0. Um P2: na caixa em CSS (sem WebGL ou com menos movimento), o disco da frente sai da caixa como uma cunha branca. Abri a UAT-237, `fixing (F80)`. A legenda alta da banana no celular é efeito do nome comprido, não defeito. Relatório: `reports/audits/2026-11-21-mjrpalbumblender-v0-f80-visual-parity-recheck.md`; capturas em `reports/evidence/F80/recheck-uat235/`.

## [2026-11-21 11:48] decision — cada agente interno declara o seu modelo; Sonnet em esforço médio é o padrão
**Branch:** main
Palavras do MJRP (2026-11-21): «os agentes internos precisam utilizar modelos adequados nao podem derivar tudo do seu modelo, isso importante adicionar no seu processo, é crítico pra gesta de tokens e eficiencia das taregas». Está no resumo da via rápida (`reports/harness-feedback/2026-11-21-fast-lane-as-worked-on-2026-11-20.md`): Sonnet médio para construir, consertar, testar e fechar; Opus para desenho, arquitetura, pesquisa e juiz de tela; nenhum agente herda o modelo do orquestrador. Sessões arquivadas a pedido dele: textos, proposta do React, régua de texto, lote do board e design system (o trabalho de cada uma está no seu ramo); a do kernel não arquivou (ainda tinha trabalho vivo) e as duas com juiz dentro («Start» no menu e a página de entrada) ficam até o juiz terminar.

## [2026-11-21 11:47] decision — volta o jeito de trabalhar de 20/11: uma conversa, agentes internos, o orquestrador junta e publica; as sessões por feature param
**Branch:** main
Palavras do MJRP (2026-11-21): «parece que vc entrou no processo do harness agora, que está te atrapalhando, ontem vc estava mais agil e colocando as coisas em prod, mais rápido»; «vamos matar todas as sessoes e manter o trabalho como ontem, a agilidade do seu trabalho de ontem deve ser o modelo para o fast lane do harness passe esse feedback para o master agent considerar isso na F350 da v2.0 do harness e a partir de agora siga o que vc estava seguindo ontem»; «assuma o trabalho das sessoes e arquivo todas as sessoes»; «ok esse é o resumo do fast lane, coloque no md pls». Feito: as duas sessões que trabalhavam foram paradas; o trabalho sem commit da sessão do design system foi gravado no ramo dela (`91c7c53`); o resumo do processo está em `reports/harness-feedback/2026-11-21-fast-lane-as-worked-on-2026-11-20.md` e foi ao agente mestre. O trabalho das sessões fica nos ramos (`claude/f81-…`, `claude/f81-copy-volume-research`, `claude/f83-…`, `claude/f85-…`, `fix/f80-uat-entry-page`, `claude/f86-…`, `claude/f45-batch-close-merged-features`), que o orquestrador junta. Também de hoje: o push foi feito por ele pelo terminal; a trava de comunicação deixou de pedir reescrita (pedido dele, mudado no harness, commit `c49bf25c8` de lá); a cópia do kernel foi atualizada (`8731582`).

## [2026-11-21 11:46] session — F69: o que ainda impede o `Done` está escrito como trabalho de agente 
**Branch:** claude/batch-close-merged-features
F69 (a falha da popularidade do Spotify é falha): o código está na `main` (merges `1e6e6f0`, `8425964`, `822a794`). A tarefa 13 (publicar o servidor e ver nos registros que a falha do Spotify aparece como «could not be asked») não é do MJRP: tirei a marca `waiting:: human` e escrevi que é do integrador, e que a prova só vem quando o Spotify falhar de verdade em produção. Declarei no `plan.md` 7 documento(s) que faltavam, conferido nos commits que citam a feature. A feature continua `In Progress` porque a trava do passo retroativo ainda cobra: Reconferência visual. Está escrito na tarefa aberta, como trabalho de agente. Nenhum merge traz nota de Touch ID, então não escrevi que houve ok visual. Nada de `Accepted`.

## [2026-11-21 11:46] session — F84: os 18 P0 de ordem da casca conferidos par a par; os seletores da Home acertados
**Branch:** claude/f84-visual-sensor-with-playwright
Conferidos nos pares e no DOM dos dois lados. Os seletores genéricos `header`/`main`/`footer` pegavam outro elemento (a barra do celular no protótipo, o título do artista no produto); a configuração agora usa a casca do app (`#header-container nav.top-nav`, `#app`, `footer.site-footer`). Com isso o resultado não mudou em contagem (P0 18 · P1 0 · P2 27, os mesmos 18 estados a 1280) e o P0 que sobra é real, não de seletor: o protótipo aprovado renderiza o rodapé com 0 px (o logotipo MJRP sem tamanho), o produto tem o rodapé de verdade. Fica relatado, sem mexer no produto nem esconder a região; a decisão é do MJRP. A F80 e o celular (393) não têm diferença. A rota da Home é `VISUAL_HOME_PATH` (padrão `/home`; `/start` depois da F85). Relatório: `reports/evidence/F84/2026-11-21-sensor-findings.md`; a rodada: `reports/evidence/F84/2026-11-21/`.

## [2026-11-21 11:46] step — F86, parte 2: a página de revisão dos textos vestida no design system do site
**Branch:** claude/f86-site-design-system
O ramo `claude/f81-site-in-more-than-one-language` (ainda fora da `main`) foi mesclado neste ramo para trazer a página (`a3ec1c7`). Mudou só o visual de `design/proposals/copy-review/copy-review.template.html`: o preto e o painel `#101014`, a Syne nos títulos e nos botões, a fonte do sistema nos textos, botões de 44 px com cantos de 12 px, o filtro ligado em branco (como as fichas do site, nunca laranja), a linha de fogo sob o título, um tema só, escuro. Conferido por comparação: a marcação, o script e os dados são idênticos à versão publicada (só o bloco de estilo e o link da Syne mudaram); as chaves de gravação (`albumblender-copy-review-v1` no navegador, `copy-review-album-blender` na conta) e as capacidades (db, downloads, user) ficaram. Antes de republicar, a conta não tinha nenhuma edição gravada nessa página (lido no banco da página); as edições guardadas no navegador dele continuam, porque o endereço e a chave são os mesmos. Testado na prévia local: editar um texto, recarregar e o texto voltar; o filtro ligar. Republicada no mesmo endereço (https://claude.ai/artifact/DDE57759QtWJkM4qKVHzBF, versão 2).

## [2026-11-21 11:45] session — F64: o que ainda impede o `Done` está escrito como trabalho de agente
**Branch:** claude/batch-close-merged-features
F64 (um caminho só, testado, para produção): o código está na `main` (merges `4085c49`, `fd9a0a1`, `9424320`). Declarei no `plan.md` 7 documento(s) que faltavam, conferido nos commits que citam a feature. A feature continua `In Progress` porque a trava do passo retroativo ainda cobra: Reconferência visual, Issues. Está escrito na tarefa aberta, como trabalho de agente. Nenhum merge traz nota de Touch ID, então não escrevi que houve ok visual. Nada de `Accepted`.

## [2026-11-21 11:45] session — F51: o que ainda impede o `Done` está escrito como trabalho de agente
**Branch:** claude/batch-close-merged-features
F51 (filtros, busca e paginação na tela de álbuns): o código está na `main` (merges `5268f45`). Declarei no `plan.md` 5 documento(s) que faltavam, conferido nos commits que citam a feature. A feature continua `In Progress` porque a trava do passo retroativo ainda cobra: Reconferência visual, Issues. Está escrito na tarefa aberta, como trabalho de agente. Nenhum merge traz nota de Touch ID, então não escrevi que houve ok visual. Nada de `Accepted`.

## [2026-11-21 11:44] session — F49: o que ainda impede o `Done` está escrito como trabalho de agente
**Branch:** claude/batch-close-merged-features
F49 (o botão de carregar mais álbuns de uma série funciona): o código está na `main` (merges `1d5ed9b`, `36c6ddd`). Declarei no `plan.md` 7 documento(s) que faltavam, conferido nos commits que citam a feature. A feature continua `In Progress` porque a trava do passo retroativo ainda cobra: Reconferência visual. Está escrito na tarefa aberta, como trabalho de agente. Nenhum merge traz nota de Touch ID, então não escrevi que houve ok visual. Nada de `Accepted`.

## [2026-11-21 11:44] session — F73: a tarefa de aceite saiu; o que ainda impede o `Done` está escrito como trabalho de agente
**Branch:** claude/batch-close-merged-features
F73 (as telas mantêm o campo em uso e largam o que deixaram): o código está na `main` (merges `0c0df5e`, `0db59f6`, `fe6e954`). A tarefa «o MJRP diz Prototype: none e dá o ok visual» não era tarefa dele: a frase já estava na `spec.md`, e o ok visual é o aceite, que ele conduz; tirei a tarefa. A feature continua `In Progress` porque a trava do passo retroativo ainda cobra: Reconferência visual. Está escrito na tarefa aberta, como trabalho de agente. Nenhum merge traz nota de Touch ID, então não escrevi que houve ok visual. Nada de `Accepted`.

## [2026-11-21 11:44] session — F72: a tarefa de aceite saiu; o que ainda impede o `Done` está escrito como trabalho de agente
**Branch:** claude/batch-close-merged-features
F72 (a tela de séries diz quantos álbuns e séries mostra): o código está na `main` (merges `8efa91c`, `b467468`, `7f55957`). A tarefa «o MJRP diz Prototype: none e dá o ok visual» não era tarefa dele: a frase já estava na `spec.md`, e o ok visual é o aceite, que ele conduz; tirei a tarefa. Declarei no `plan.md` 7 documento(s) que faltavam, conferido nos commits que citam a feature. A feature continua `In Progress` porque a trava do passo retroativo ainda cobra: Story, Story, Critérios de aceite, Reconferência visual. Está escrito na tarefa aberta, como trabalho de agente. Nenhum merge traz nota de Touch ID, então não escrevi que houve ok visual. Nada de `Accepted`.

## [2026-11-21 11:43] session — F68: a tarefa de aceite saiu; o que ainda impede o `Done` está escrito como trabalho de agente
**Branch:** claude/batch-close-merged-features
F68 (as regras de identidade de álbum revistas): o código está na `main` (merges `7da4418`, `8f36ed9`, `764b495`). A tarefa «o MJRP diz Prototype: none e dá o ok visual» não era tarefa dele: a frase já estava na `spec.md`, e o ok visual é o aceite, que ele conduz; tirei a tarefa. A feature continua `In Progress` porque a trava do passo retroativo ainda cobra: Reconferência visual. Está escrito na tarefa aberta, como trabalho de agente. Nenhum merge traz nota de Touch ID, então não escrevi que houve ok visual. Nada de `Accepted`.

## [2026-11-21 11:43] session — F67: a tarefa de aceite saiu; o que ainda impede o `Done` está escrito como trabalho de agente
**Branch:** claude/batch-close-merged-features
F67 (o Scan da Home responde ao clique): o código está na `main` (merges `cdef6d5`, `5dd2198`). A tarefa «o MJRP diz Prototype: none e dá o ok visual» não era tarefa dele: a frase já estava na `spec.md`, e o ok visual é o aceite, que ele conduz; tirei a tarefa. A feature continua `In Progress` porque a trava do passo retroativo ainda cobra: arch, Reconferência visual. Está escrito na tarefa aberta, como trabalho de agente. Nenhum merge traz nota de Touch ID, então não escrevi que houve ok visual. Nada de `Accepted`.

## [2026-11-21 11:43] session — F61: a tarefa de aceite saiu; o que ainda impede o `Done` está escrito como trabalho de agente
**Branch:** claude/batch-close-merged-features
F61 (playlists guardadas em poucos segundos): o código está na `main` (merges `4e4555b`, `ad2160b`). A tarefa «o MJRP diz Prototype: none e dá o ok visual» não era tarefa dele: a frase já estava na `spec.md`, e o ok visual é o aceite, que ele conduz; tirei a tarefa. A feature continua `In Progress` porque a trava do passo retroativo ainda cobra: Reconferência visual. Está escrito na tarefa aberta, como trabalho de agente. Nenhum merge traz nota de Touch ID, então não escrevi que houve ok visual. Nada de `Accepted`.

## [2026-11-21 11:43] session — F59: a tarefa de aceite saiu; o que ainda impede o `Done` está escrito como trabalho de agente
**Branch:** claude/batch-close-merged-features
F59 (fechar o que estava aberto em segurança): o código está na `main` (merges `a6092a7`, `2cdaf62`, `15ac18b`). A tarefa «o MJRP diz Prototype: none e dá o ok visual» não era tarefa dele: a frase já estava na `spec.md`, e o ok visual é o aceite, que ele conduz; tirei a tarefa. Declarei no `plan.md` 1 documento(s) que faltavam, conferido nos commits que citam a feature. A feature continua `In Progress` porque a trava do passo retroativo ainda cobra: Reconferência visual, Issues. Está escrito na tarefa aberta, como trabalho de agente. Nenhum merge traz nota de Touch ID, então não escrevi que houve ok visual. Nada de `Accepted`.

## [2026-11-21 11:43] session — F57: a tarefa de aceite saiu; o que ainda impede o `Done` está escrito como trabalho de agente
**Branch:** claude/batch-close-merged-features
F57 (uma peça só para escolher álbuns de um artista): o código está na `main` (merges `b73b159`, `8f36ed9`). A tarefa «o MJRP diz Prototype: none e dá o ok visual» não era tarefa dele: a frase já estava na `spec.md`, e o ok visual é o aceite, que ele conduz; tirei a tarefa. Declarei no `plan.md` 1 documento(s) que faltavam, conferido nos commits que citam a feature. A feature continua `In Progress` porque a trava do passo retroativo ainda cobra: Reconferência visual, Issues. Está escrito na tarefa aberta, como trabalho de agente. Nenhum merge traz nota de Touch ID, então não escrevi que houve ok visual. Nada de `Accepted`.

## [2026-11-21 11:43] session — F55: a tarefa de aceite saiu; o que ainda impede o `Done` está escrito como trabalho de agente
**Branch:** claude/batch-close-merged-features
F55 (os álbuns pedidos, ou um aviso: uma regra de identidade): o código está na `main` (merges `dd16b01`, `7cd6a68`, `72c0a70`). A tarefa «o MJRP diz Prototype: none e dá o ok visual» não era tarefa dele: a frase já estava na `spec.md`, e o ok visual é o aceite, que ele conduz; tirei a tarefa. A feature continua `In Progress` porque a trava do passo retroativo ainda cobra: Reconferência visual. Está escrito na tarefa aberta, como trabalho de agente. Nenhum merge traz nota de Touch ID, então não escrevi que houve ok visual. Nada de `Accepted`.

## [2026-11-21 11:43] session — F54: a tarefa de aceite saiu; o que ainda impede o `Done` está escrito como trabalho de agente
**Branch:** claude/batch-close-merged-features
F54 (fecho da v4.0: apagar do inventário e acabamento): o código está na `main` (merges `cd96ad3`, `3d6e8e7`, `1ca7b39`). A tarefa «o MJRP diz Prototype: none e dá o ok visual» não era tarefa dele: a frase já estava na `spec.md`, e o ok visual é o aceite, que ele conduz; tirei a tarefa. A feature continua `In Progress` porque a trava do passo retroativo ainda cobra: Reconferência visual. Está escrito na tarefa aberta, como trabalho de agente. Nenhum merge traz nota de Touch ID, então não escrevi que houve ok visual. Nada de `Accepted`.

## [2026-11-21 11:43] session — F50: a tarefa de aceite saiu; o que ainda impede o `Done` está escrito como trabalho de agente
**Branch:** claude/batch-close-merged-features
F50 (um endereço local só para o login e o Spotify): o código está na `main` (merges `40ca80d`, `987d7d0`). A tarefa «o MJRP diz Prototype: none e dá o ok visual» não era tarefa dele: a frase já estava na `spec.md`, e o ok visual é o aceite, que ele conduz; tirei a tarefa. A feature continua `In Progress` porque a trava do passo retroativo ainda cobra: Reconferência visual. Está escrito na tarefa aberta, como trabalho de agente. Nenhum merge traz nota de Touch ID, então não escrevi que houve ok visual. Nada de `Accepted`.

## [2026-11-21 11:43] step — F86, parte 1: o design system do site levantado do código e a página gerada dele
**Branch:** claude/f86-site-design-system
`docs/specs/design-system.md` refeito a partir de um levantamento do código (um ajudante leu `public/css/`, `tailwind.config.js`, `public/splash.html`, views e componentes): no topo, o que o site usa (cores com contraste medido, o fogo, o equalizador, o tipo, as medidas, 23 peças em 11 famílias, cada uma com a classe e o arquivo), três perguntas que esperam o MJRP (P1 o texto sobre o fogo, P2 a ponta amarela, P3 a fonte do texto corrido no computador; nenhuma marcada aprovada por ele), 13 conflitos no código com uma proposta cada, o declarado e não usado e 7 defeitos do CSS (listados, não consertados). O texto antigo da «Identidade» foi para `## Arquivo` palavra por palavra (conferido: nenhuma linha do arquivo anterior se perdeu). A página: `design/proposals/design-system/design-system.html`, gerada por `build-design-system.mjs` (lê o documento, monta o CSS do site na ordem em que o site o carrega, com o Tailwind gerado do mesmo `tailwind.config.js`) e `specimens.mjs` (a barra de abas, a base da série, o cartão do celular, a folha, os avisos e o equalizador desenhados pelo próprio código do site, num jsdom); cada peça em quadros vivos a 960 e a 390 px; capas fictícias. Primeira tela: 39 palavras no computador (1280x800) e 24 no celular (390x844), contadas no navegador; a régua pede até 100 e 70. Decidido pelo agente — revisável: uma página HTML comum, não o tipo «Design System» do Claude (o espelho desse tipo, pela skill, sai da `main` depois do merge); a página só no tema escuro do site. Não publicada ainda: espera a crítica separada.

## [2026-11-21 11:42] session — F48: a tarefa de aceite saiu; o que ainda impede o `Done` está escrito como trabalho de agente
**Branch:** claude/batch-close-merged-features
F48 (o guardado de álbuns confiável: nova tentativa e «Clear Cache»): o código está na `main` (merges `40ca80d`). A tarefa «o MJRP diz Prototype: none e dá o ok visual» não era tarefa dele: a frase já estava na `spec.md`, e o ok visual é o aceite, que ele conduz; tirei a tarefa. A feature continua `In Progress` porque a trava do passo retroativo ainda cobra: behavior, Reconferência visual, Issues. Está escrito na tarefa aberta, como trabalho de agente. Nenhum merge traz nota de Touch ID, então não escrevi que houve ok visual. Nada de `Accepted`.

## [2026-11-21 11:42] session — F46: a tarefa de aceite saiu; o que ainda impede o `Done` está escrito como trabalho de agente
**Branch:** claude/batch-close-merged-features
F46 (cada série termina carregada, vazia ou com aviso): o código está na `main` (merges `40ca80d`, `0f1163c`). A tarefa «o MJRP diz Prototype: none e dá o ok visual» não era tarefa dele: a frase já estava na `spec.md`, e o ok visual é o aceite, que ele conduz; tirei a tarefa. A feature continua `In Progress` porque a trava do passo retroativo ainda cobra: behavior, Reconferência visual, Issues. Está escrito na tarefa aberta, como trabalho de agente. Nenhum merge traz nota de Touch ID, então não escrevi que houve ok visual. Nada de `Accepted`.

## [2026-11-21 11:42] session — F45: a tarefa de aceite saiu; o que ainda impede o `Done` está escrito como trabalho de agente
**Branch:** claude/batch-close-merged-features
F45 (carregar vários álbuns ao mesmo tempo): o código está na `main` (merges `ffd414f`, `f295316`, `cdeab21`). A tarefa «o MJRP diz Prototype: none e dá o ok visual» não era tarefa dele: a frase já estava na `spec.md`, e o ok visual é o aceite, que ele conduz; tirei a tarefa. A feature continua `In Progress` porque a trava do passo retroativo ainda cobra: behavior, Reconferência visual. Está escrito na tarefa aberta, como trabalho de agente. Nenhum merge traz nota de Touch ID, então não escrevi que houve ok visual. Nada de `Accepted`.

## [2026-11-21 11:42] session — F47: a tarefa de aceite saiu; o que ainda impede o `Done` está escrito como trabalho de agente
**Branch:** claude/batch-close-merged-features
F47 (a lista de séries sem o corte em 20): o código está na `main` (merges `d893d75`, `0b3946d`). A tarefa «o MJRP diz Prototype: none e dá o ok visual» não era tarefa dele: a frase já estava na `spec.md`, e o ok visual é o aceite, que ele conduz; tirei a tarefa. A feature continua `In Progress` porque a trava do passo retroativo ainda cobra: Reconferência visual. Está escrito na tarefa aberta, como trabalho de agente. Nenhum merge traz nota de Touch ID, então não escrevi que houve ok visual. Nada de `Accepted`.

## [2026-11-21 11:40] session — F76 fechada na documentação: a tarefa do juízo no iPhone saiu, a feature vai a `Done`
**Branch:** claude/batch-close-merged-features
F76 (o app no celular, redesenhado): o código está na `main` (merges `6af17ea`, `c8a8e43`, `a1e34a7` e mais). A tarefa «o juízo do MJRP no iPhone dele» era o aceite, que ele conduz: saiu do `tasks.md` e virou `needs_human: "ver: o app no iPhone dele, em produção — …"`, porque o desenho foi decidido pelo agente sem protótipo julgado. A tarefa 08 (a tela de computador igual antes e depois; as medidas a 393x852 e 852x393) já tem prova: `reports/evidence/F76/2026-11-20-foundation-proof.md` e `…-production-proof.md`; marquei como feita, dizendo o que não cobre (nada foi visto num iPhone; a primeira prova foi sem dados). Os `verified_by` dos REQ vieram dos testes e das provas que as tarefas já citam. Não escrevi aceite.

## [2026-11-21 11:40] session — F75 fechada na documentação: a prova em produção registrada, a feature vai a `Done`
**Branch:** claude/batch-close-merged-features
F75 (preço de CDs e onde comprar): a única tarefa aberta, «ligar a fonte e provar em produção», já estava feita pelo integrador: o servidor e o site no ar, o secret `discogs-token` mapeado em `DISCOGS_TOKEN`, a leitura na conta do MJRP com valor para 198 de 211 álbuns (`reports/evidence/F75/2026-11-20-production-proof.md`). Marquei a tarefa com o que a evidência diz e com o que ela não cobre (a tela do site publicado, com login, não foi aberta pelo agente: não verificado). As doze decisões do agente que o MJRP julga e a escolha do `DISCOGS_VALUES_FOR` ficam em `needs_human: "decidir: …"`. Não escrevi aceite.

## [2026-11-21 11:39] session — F62 fechada na documentação: o fecho do molde feito, a feature vai a `Done`
**Branch:** claude/batch-close-merged-features
F62 (blend e exportação fazem o que dizem): o código está na `main` (merges `4f022d8`, `904ee33`, `7da4418`). A única tarefa aberta era o fecho pelo molde: declarei os sete documentos no `plan.md`, conferidos pelo histórico (`behavior.md` «atualizado» em `ccd34bd`; os outros «sem mudança»), rodei o `sdd_shape_check.py` e marquei a tarefa. As nove mudanças de comportamento que o MJRP decide estão nas Open Questions da spec: pus `needs_human: "decidir: …"`. Não escrevi aceite.

## [2026-11-21 11:39] session — F66 fechada na documentação: spec e plano preenchidos do registro, a feature vai a `Done`
**Branch:** claude/batch-close-merged-features
F66 (o token do Discogs fora do repositório): o conserto está na `main` (os scripts saíram na F65, `f9d1abd`; o registro do fecho em `8584971`). Faltavam os campos «a escrever» da spec e do plano e as duas tarefas de documentação: preenchi com o que a evidência (`reports/evidence/F66/2026-11-20-token-out-of-the-repository.md`) e o log dizem, e declarei os sete documentos «sem mudança» (nenhum commit da feature os toca). O token antigo apagado no Discogs é palavra do MJRP (2026-11-20, duas vezes) e o agente não o testou: está dito nos critérios e na marca `needs_human: "segurança: …"`. Não escrevi aceite.

## [2026-11-21 11:37] session — F63 fechada na documentação: a tarefa de aceite saiu, a feature vai a `Done`
**Branch:** claude/batch-close-merged-features
F63 (Home e navegação que respondem): o código está na `main` (merges `cbd96fa`, `946fc21`, `5c3abda`). A tarefa «o MJRP diz Prototype: none e a reconferência» não era tarefa do MJRP: a frase dele já estava na `spec.md` (2026-11-20 00:10) e a reconferência independente existe (`reports/audits/2026-11-19-mjrpalbumblender-v0-f63-visual-parity-recheck.md`: 2 P1, que viraram a UAT-217 e a UAT-218; a UAT-218 está `fixed` pela F63 e a UAT-217 pela F76). Tirei a UAT-10 e a UAT-11 do `fixes:` da spec: quem as consertou foi a F65 (as linhas dizem `fixed (F65: c9f15ec …)`; a própria spec já dizia que o REQ-11 não foi entregue neste ramo), e a trava do passo retroativo exigia `fixed (F63 …)`. Marquei a tarefa como feita na parte do agente e pus `needs_human: "ver: …"`. Nenhum merge traz nota de Touch ID. Nada de `Accepted`.

## [2026-11-21 11:37] session — F65 fechada na documentação: a tarefa de aceite saiu, a feature vai a `Done`
**Branch:** claude/batch-close-merged-features
F65 (tirar o que nada usa): o código está na `main` (merges `ef1b721`, `7be0701`, `1e6e6f0`). A tarefa «o MJRP diz Prototype: none e dá o ok visual / a reconferência» não era tarefa do MJRP: a frase dele já estava na `spec.md` (2026-11-20 00:10) e a reconferência visual independente existe (`reports/audits/2026-11-19-mjrpalbumblender-v0-f65-visual-parity-recheck.md`: passa, 0 P0, 0 P1). Marquei a tarefa como feita na parte do agente; a feature não muda nada que ele veja, então não pus `needs_human`. Declarei `constitution.md` «sem mudança» no `plan.md`, conferido pelo histórico. Nenhum merge traz nota de Touch ID, então não escrevi que houve ok visual. Nada de `Accepted`.

## [2026-11-21 11:37] session — F58 fechada na documentação: a tarefa de aceite saiu, a feature vai a `Done`
**Branch:** claude/batch-close-merged-features
F58 (o serviço de carga dentro do limite de complexidade): o código está na `main` (merges `fd9a0a1`, `c780a48`, `822a794`). A tarefa «o MJRP diz Prototype: none e dá o ok visual / a reconferência» não era tarefa do MJRP: a frase dele já estava na `spec.md` (2026-11-20 00:10) e a reconferência visual independente existe (`reports/audits/2026-11-19-mjrpalbumblender-v0-f58-visual-parity-recheck.md`: passa, 0 P0, 0 P1). Marquei a tarefa como feita na parte do agente; a feature não muda nada que ele veja, então não pus `needs_human`. Declarei `constitution.md` «sem mudança» no `plan.md`, conferido pelo histórico. Nenhum merge traz nota de Touch ID, então não escrevi que houve ok visual. Nada de `Accepted`.

## [2026-11-21 11:37] session — F70 fechada na documentação: a tarefa de aceite saiu, a feature vai a `Done`
**Branch:** claude/batch-close-merged-features
F70 (defeitos pequenos achados no caminho): o código está na `main` (merges `ffd414f`, `88adbc4`, `109b656`). A tarefa «o MJRP diz Prototype: none e dá o ok visual / a reconferência» não era tarefa do MJRP: a frase dele já estava na `spec.md` (2026-11-20 00:10) e a reconferência visual independente existe (`reports/audits/2026-11-19-mjrpalbumblender-v0-f70-visual-parity-recheck.md`: passa, 0 P0, 0 P1). Marquei a tarefa como feita na parte do agente e pus `needs_human: "ver: …"` na spec. Nenhum merge traz nota de Touch ID, então não escrevi que houve ok visual. Nada de `Accepted`.

## [2026-11-21 11:37] session — F60 fechada na documentação: a tarefa de aceite saiu, a feature vai a `Done`
**Branch:** claude/batch-close-merged-features
F60 (nada do que foi salvo se perde): o código está na `main` (merges `bcdd114`, `fa141c0`, `c760592`). A tarefa «o MJRP diz Prototype: none e dá o ok visual / a reconferência» não era tarefa do MJRP: a frase dele já estava na `spec.md` (2026-11-20 00:10) e a reconferência visual independente existe (`reports/audits/2026-11-19-mjrpalbumblender-v0-f60-visual-parity-recheck.md`: não passou limpo: 1 P1, que virou a UAT-216 (playlists salvas no celular), hoje `fixed` pela F76; o fecho da UAT-216 como `closed` é da reconferência independente). Marquei a tarefa como feita na parte do agente e pus `needs_human: "ver: …"` na spec. Nenhum merge traz nota de Touch ID, então não escrevi que houve ok visual. Nada de `Accepted`.

## [2026-11-21 11:36] session — F56 fechada na documentação: a tarefa de aceite saiu, a feature vai a `Done`
**Branch:** claude/batch-close-merged-features
Aviso: o ramo deste lote se chama `claude/f45-…` porque a trava de commits só aceita nome com número de feature; por isso o board mostra a F45 («a tela de álbuns carrega vários álbuns ao mesmo tempo») «em branch» enquanto o lote roda — não é trabalho novo dela. F56 (o blend e a edição de playlist pelo serviço de carga): o código está na `main` (merges `042da86`, `06fba84`). A tarefa «o MJRP diz Prototype: none e dá o ok visual» não era tarefa: a frase dele já estava na `spec.md` (2026-11-20 00:10) e a reconferência visual independente já existe (`reports/audits/2026-11-19-mjrpalbumblender-v0-f56-visual-parity-recheck.md`: passa, sem P0 nem P1). Marquei a tarefa como feita na parte do agente e pus `needs_human: "ver: …"` na spec. Nenhum merge traz nota de Touch ID, então não escrevi que houve ok visual. Nada de `Accepted`. Antes e depois do lote: `reports/audits/2026-11-21-mjrpalbumblender-v0-board-batch-close.md`.

## [2026-11-21 11:32] session — save: F83, o fecho nomeia o ramo
**Branch:** claude/f83-site-screens-in-react
> Participantes: sessão de desenho aberta pelo orquestrador do V0 (Claude Code) · Branch: claude/f83-site-screens-in-react
> Session: claude/f83-site-screens-in-react (sessão de página, no worktree `f83-site-screens-in-react-83ca31`)

A conferência de fecho só reconhece a entrada que traz o ramo na linha dos participantes; as duas entradas anteriores não a tinham. Nenhum trabalho depois de `ba10b43`. O conteúdo do fecho está nas entradas de 10:32 e de 11:31 deste ramo.

## [2026-11-21 11:32] session — save: F83, sessão de desenho fechada
**Branch:** claude/f83-site-screens-in-react
> Participantes: sessão de desenho aberta pelo orquestrador do V0 (Claude Code) · Branch: claude/f83-site-screens-in-react
> Session: claude/f83-site-screens-in-react (sessão de página, no worktree `f83-site-screens-in-react-83ca31`)

Fecho depois do último commit de trabalho (`ba10b43`). O conteúdo está nas duas entradas anteriores deste ramo: a de 10:32 (resumo, decisões do agente, próxima sessão, dados) e a de 11:31 (as decisões para o MJRP reescritas; o doctor fica com o orquestrador, na junção). Nada mudou depois delas.

## [2026-11-21 11:31] session — save: F83, as decisões para o MJRP reescritas no jeito que ele pediu; o doctor fica com o orquestrador
**Branch:** claude/f83-site-screens-in-react
> Session: claude/f83-site-screens-in-react (sessão de página, no worktree `f83-site-screens-in-react-83ca31`). Fecha a sessão; a entrada de 10:32 continua valendo para o resumo, as decisões do agente, a próxima sessão e os dados. O que mudou depois dela: a seção «Decisões do MJRP» da proposta foi reescrita pela regra nova dele (uma pergunta por vez, o ganho e o custo de cada opção numa linha, a recomendação, sem sigla solta). O doctor não fecha este turno: por regra nova do orquestrador do V0 (fila da máquina com 17 trabalhos), as sessões do V0 não rodam mais o doctor nem a suíte inteira, e o trabalho desta sessão na fila foi retirado; a única execução que terminou saiu vermelha com 524 erros, com a saída cortada, sem que se saiba se algum é deste ramo — o orquestrador roda o doctor na junção. Conferido só no que este ramo mudou: `adr_header_check` (a ADR-0023 passa), `loop.py --check-tasks` (32 tarefas, 0 problemas), `sdd_shape_check`, os ganchos de commit e `session-check` (saiu 0).

## [2026-11-21 11:30] review — começou a reconferência visual da caixa em diagonal e da capa da banana (UAT-235, UAT-236)
**Branch:** fix/f80-uat-entry-page
Um agente que não implementou julga a página de entrada do ramo contra a prévia 2 («Palco largo») e as palavras do MJRP. Relatório: `reports/audits/2026-11-21-mjrpalbumblender-v0-f80-visual-parity-recheck.md` (por ora `verdict: running`).

## [2026-11-21 11:29] session — a capa da banana marcada como feita (UAT-236)
**Branch:** fix/f80-uat-entry-page
A linha da capa da banana na lista de problemas do UAT passa a «fixed (42d4cad)»; faltam a reconferência visual e a publicação, com o orquestrador.

## [2026-11-21 11:29] decision — a capa da banana na frente da caixa de discos da página de entrada (UAT-236)
**Branch:** fix/f80-uat-entry-page
Palavras do MJRP: «pode colocar a capa inicial com a do velvet underground & nico a capa da banana?» e «mas mantenha o king crimson so nao ser a primeira». Feito: «The Velvet Underground & Nico» (1967) é o primeiro disco do lado A e o King Crimson vem logo depois; nenhum disco saiu: as capas reais passam a 15 (lado A com 8, lado B com 7; as fictícias seguem 14). «Harvest» foi para o fundo do lado A, para cada faixa continuar puxando os mesmos discos. A busca pública do iTunes achou o álbum certo: a edição de 45 anos com as 11 faixas originais (https://music.apple.com/us/album/the-velvet-underground-nico-45th-anniversary-edition/1440851613); a capa vem do servidor de imagens da Apple, como as outras. A caixa em 3D cabe inteira com 15 (o teste do enquadramento roda com 14 e 15); no celular a legenda cabe na largura, mas o nome longo quebra em três linhas ao lado do botão. Antes: o conserto da caixa em diagonal com palco largo (UAT-235) ficou em `d88b0cf`.

## [2026-11-21 14:58] decision — F88 (o menu do topo do app redesenhado na linguagem da nova home) em esboço, com a S-70
**Branch:** wip/top-nav-redesign-registration
Palavras do MJRP (2026-11-21): «o que mudaria pra home ir pra prod agora, já fazer o redesign completo do top nave, aí a transicao fica mais suave, o que acha?» e, à proposta do orquestrador (redesenhar o menu na linguagem da home, construí-lo em React dentro da migração F83, e a home esperar o fim da migração para home, menu novo e telas migradas chegarem juntos à produção): «siga». A F88 nasce em esboço (via padrão, tipo feature), com a S-70 (EP-01, escolhido pelo agente). Primeira tarefa: rodada de desenho no comparador, depois a construção na onda da moldura da F83. Depende da F80, F83, F81 e F85.

## [2026-11-21 11:12] session — kernel do harness atualizado (2026-11-10 → 2026-11-21)
**Branch:** claude/kernel-refresh-2026-11-21
Rodei `new_project.py --refresh-kernel` a partir do harness: 31 páginas da wiki, scripts vendorizados (entre eles `machine_load.py`, a fila de máquina), hooks e catálogo na versão de 2026-11-21. O contrato, o `board.json` e o `AGENTS.md` do projeto ficaram como estavam (o contrato só ganhou `received:` e o carimbo do kernel). Nenhuma nota de conformidade foi executada; a lista do que fica pendente está em `reports/audits/2026-11-21-mjrpalbumblender-v0-kernel-refresh.md`.

## [2026-11-21 11:04] session — save: pesquisa da régua do volume de copy (F81), o fecho com a falha aceita

> Participantes: orquestrador do V0 + Claude Code (Opus 5.5) · Branch: claude/f81-copy-volume-research
> Session: sessão de página iniciada pelo orquestrador do V0 (local_12b5ff2f-ff3a-4682-b761-b99d85bbc840)

### Executive Summary
Fecho da pesquisa da régua do volume de texto (relatório `reports/research/2026-11-21-copy-volume-ruler.md`, commit `10b5dad`). Nada mudou desde a entrada anterior, além desta nota.

### Decisions
- A conferência de fechamento falha só nas tarefas TASK-01 e TASK-02 do `tasks.md` da F81, que são da sessão da F81. O orquestrador do V0 aceitou a falha e reconcilia o arquivo no merge; esta sessão não o tocou.

### Next Session
1. O integrador junta este ramo na `main`; o orquestrador do harness leva a disciplina CV (volume de copy) ao MJRP.

### Key Data
- Ramo `claude/f81-copy-volume-research`; pesquisa em `10b5dad`; save anterior em `c0b9027`.

## [2026-11-21 11:03] decision — a caixa de discos da página de entrada em diagonal, com o palco largo (UAT-235)
**Branch:** fix/f80-uat-entry-page
Palavras do MJRP: «escolha: 2- palco largo». Feito: a câmera do 3D vê a caixa a 30° do lado e se ajusta ao quadro, de modo que a caixa fica inteira em todas as poses (antes passava da borda na virada); no computador o palco vai até a borda direita da janela; a caixa em CSS (sem WebGL ou com menos movimento) gira para o mesmo lado, pela metade do ângulo, porque sem laterais os discos inclinados saíam da frente; no celular nada muda. Teste da regra escrito antes (vermelho na câmera de hoje). Prova: `reports/evidence/F80/uat/2026-11-21-uat-235-crate-diagonal-proof.md`.

## [2026-11-21 11:01] decision — F86 (o design system do site, como artefato) em esboço, com a S-68; «copy deck» é o nome dele para o artefato de revisão dos textos
**Branch:** main
Palavras do MJRP (2026-11-21), ao ver a página de revisão dos textos (https://claude.ai/artifact/DDE57759QtWJkM4qKVHzBF): «copy está ótimo, eu só colocaria no design-system do site e alias precisamos do artefato do design-system do site tb»; antes: «o artefato do claude que estou chamando de copydeck». Conferido: o site tem o documento `docs/specs/design-system.md`, mas nenhuma página de design system publicada (os artefatos «MJRP PRO DS» e «Control Center Design System» são de outros projetos). A F86 nasce na `main` em esboço (S-68; épico e versão escolhidos pelo agente). Outras palavras dele de hoje, para tudo o que se gera para ele: «abri o artefato agora e nao sei o que eu faço e olho, com tanta info na tela»; «tem gasto de muita info ique acaba de torando inutil por ser overwhelming». Escolhas dele na página de entrada: a vista «2- palco largo» para a caixa de discos; a capa de «The Velvet Underground & Nico» como a primeira, «mas mantenha o king crimson so nao ser a primeira».

## [2026-11-21 11:00] session — save: pesquisa da régua do volume de copy (F81) fechada

> Participantes: orquestrador do V0 + Claude Code (Opus 5.5) · Branch: claude/f81-copy-volume-research
> Session: sessão de página iniciada pelo orquestrador do V0 (local_12b5ff2f-ff3a-4682-b761-b99d85bbc840)

### Executive Summary
A pesquisa da régua do volume de texto está pronta: as fontes abertas com data, a medida de Spotify, Bandcamp e Linear a 1280 e a 390 px, a régua por elemento e por tela, e o V0 e os três comparadores medidos contra ela. Só medida e proposta: nada do site, do cânone ou das skills foi editado.

### Decisions
- O ramo é da F81, não uma feature nova, por decisão do orquestrador do V0. A trava de commit recusou o nome `claude/research-copy-volume`.
- Os números de elemento e de tela sem fonte são proposta do agente, revisável; o relatório marca cada um.

### Next Session
1. O orquestrador do harness leva ao MJRP, como uma decisão só, a disciplina CV (CV-01 a CV-07) e os passos das três skills.
2. O integrador junta este ramo na `main`.
3. Falta medir no navegador, com a conta, as telas de trabalho (F84).

### Key Data
- Primeira tela da página de entrada do V0: 84 palavras no computador e 64 no telefone. O topo (título e subtítulo) tem 52 palavras, acima do teto de 40.
- Primeira tela dos comparadores, no computador / no telefone: Home 179 / 132; página de entrada 359 / 454; Inventário 106 / 86. O teto de tela de trabalho é 100 / 50.
- Commit da pesquisa: `10b5dad`.

## [2026-11-21 10:55] session — F81: fechamento depois da página de revisão
Branch: claude/f81-site-in-more-than-one-language
Session: claude-code:claude/f81-site-in-more-than-one-language (sessão da F81 aberta pelo orquestrador do V0 em 2026-11-21)
Resumo: página de revisão publicada (Artifact privado), gerada do deck; nada de código de produto tocado; nada final marcado por agente.
Próxima sessão: o MJRP revisa pela página (telas Entrada e Start primeiro), baixa o arquivo e devolve; depois D-01 a D-13.
Key Data: último commit de trabalho `9c622de`.

## [2026-11-21 10:55] session — F81: a página «Revisão de texto do Album Blender», onde o MJRP decide os textos, publicada como Artifact privado
Branch: claude/f81-site-in-more-than-one-language
Pedido do orquestrador (o MJRP disse sim). Gerada por `design/proposals/copy-review/build_copy_review.py` a partir de `design/copy/album-blender-copy.md` (o molde `copy-review.template.html` é o único arquivo escrito à mão); Artifact: https://claude.ai/artifact/DDE57759QtWJkM4qKVHzBF. Abre numa tela do site por vez (a página de entrada primeiro, depois Start); cada linha mostra onde aparece em palavras comuns, o inglês de hoje, o português proposto e o tamanho; código, arquivo, tipo e nota ficam em «detalhes». Filtros «Só o que precisa de mim» e «Mais longos primeiro». Ele edita os dois textos e marca «Final» por conta própria; nenhuma marca vem do agente. Guarda em três camadas: navegador, conta (db) e arquivo `.md` no formato do documento (baixar e abrir de volta). Palavras visíveis na primeira tela sem rolar: 238 a 1280×800 (cerca de 150 são os próprios textos do site nas caixas) e 92 a 390 px. Testado no navegador do app: editar, marcar final, filtros, exportar e reabrir o arquivo; a gravação na conta e o download só funcionam com o Artifact aberto no claude.ai e não foram exercitados por mim.

## [2026-11-21 10:52] session — pesquisa: uma régua para o volume de texto por tela, no computador e no telefone
**Branch:** claude/f81-copy-volume-research
A pedido do orquestrador do harness, a partir das palavras do MJRP («o copy … está bem verbose … tanto para web qto para mobile»). O relatório está em `reports/research/2026-11-21-copy-volume-ruler.md`. Ele traz as fontes primárias abertas com data, a medida de Spotify, Bandcamp e Linear a 1280 e a 390 px, a régua por tipo de elemento e por tela, o V0 contra a régua e uma proposta de disciplina nova no cânone (CV-01 a CV-07, só proposta). O script de medida e as medidas brutas estão ao lado. No V0, a primeira tela está na faixa dos produtos medidos (84 e 64 palavras). O excesso está no topo (título e subtítulo, 52 palavras) e no número de textos por tela (Inventário, 231). Também mediu os três comparadores publicados (Home, página de entrada, Inventário). A primeira tela deles tem 179, 359 e 106 palavras no computador; os tetos de tela de trabalho são 100 no computador e 50 no telefone. O ramo é da F81, por decisão do orquestrador. Nada do cânone, das skills ou do site foi editado.

## [2026-11-21 10:48] session — o comparador da página de entrada sem siglas
**Branch:** fix/f80-uat-entry-page
O MJRP: «e a questao de sigla, nao me ajuda Uat-235???». Tirei os códigos dos títulos e botões do comparador: a primeira tela não tem nenhum; o aviso das rodadas anteriores diz «A caixa de discos em diagonal, sem corte» e o botão «Ver as prévias da caixa em diagonal»; a página das prévias se chama «A caixa em diagonal».

## [2026-11-21 10:47] session — o comparador da F80 abre na decisão da caixa de discos
**Branch:** fix/f80-uat-entry-page
O MJRP abriu o comparador e disse: «abri o artefato agora e nao sei o que eu faço e olho, com tanta info na tela». A página de entrada do comparador (https://claude.ai/artifact/5hDJr8qToYkAEsgCrfUK8e) agora abre só na decisão em mãos: «A caixa de discos: qual vista?», a página de hoje e as três vistas lado a lado (janela de 1920 px, onde o corte de hoje aparece), cada uma com um nome curto e uma linha, a recomendada marcada, e um seletor do momento da rolagem (a virada, a abertura, um disco puxado, o lado B). Tudo o que estava antes (rodada 2, peso e risco, o fogo, as versões antigas, o celular) foi para `rodadas-anteriores.html`, intacto, atrás de um link no pé. Palavras visíveis sem rolar, numa janela de 1440 × 900: antes 414, depois 61.

## [2026-11-21 10:44] session — o sensor visual declarado: a configuração, `sensors.visual` e a primeira rodada (F84)
**Branch:** claude/f84-visual-sensor-with-playwright
`test/visual/visual.config.mjs` cobre as duas referências aprovadas (F79: 18 estados; F80: a primeira tela e seis posições de rolagem; a 1280 e a 393, Chromium e WebKit, só escuro), sem conta e sem gravar nada (o catálogo e a gravação da série são trocados dentro da página, como na prova da F79). `.mjrp-project.yml` declara `sensors.visual` com o comando do kit; o A2 do doctor sai. O manual (`docs/manual/24_Test_Suite.md`) descreve o sensor. A primeira rodada, com as regiões da casca ainda pelas etiquetas genéricas, deu P0 18 · P1 0 · P2 27 (`reports/evidence/F84/run-1-2026-11-21/`); os 18 P0 eram `shell-order`, conferidos no passo seguinte.

## [2026-11-21 10:32] session — F85: fechamento da sessão (o ramo e a sessão, no formato que o `session-check` lê)
Branch: `claude/f85-start-in-the-menu`, no commit `78ad892` e antes dele.
Session: claude-code:claude/f85-start-in-the-menu (sessão do V0 aberta pelo orquestrador, via rápida)
Mesmo fechamento da entrada anterior, escrito com a linha `Branch:` sem negrito, que o leitor do `session-check` exige. Nada do código mudou.

## [2026-11-21 10:32] session — F85 entregue: tarefas 01 a 03 e a documentação; a TASK-04 espera o integrador
**Branch:** claude/f85-start-in-the-menu
Session: claude-code:claude/f85-start-in-the-menu (sessão do V0 aberta pelo orquestrador, via rápida)
Fechamento. O ramo leva «Start» no menu e na aba, `/start` (com `/home` e `/home?signin` levando a ela), o logotipo para `/?entry`, a raiz e os botões da página de entrada para `/start`. Provado no servidor de desenvolvimento a 1280 e 393 px, com e sem conta (`reports/evidence/F85/`); não provado: o build sob `vite preview`, a bateria completa e o doctor neste ramo. Decisões do agente, revisáveis: o id de uso `home` fica; «Go to Start» nas telas vazias; migalha e rodapé dizem «Start»; o logotipo é o único caminho para a página de entrada com a conta aberta.

## [2026-11-21 10:32] session — F85: a TASK-04 declara o que espera; a entrada de fechamento nomeia o ramo
**Branch:** claude/f85-start-in-the-menu
Session: claude-code:claude/f85-start-in-the-menu (sessão do V0 aberta pelo orquestrador)
Conserto de forma exigido pelo grafo de requisitos e pelo `session-check`: `waiting:: resource` com `action::` na TASK-04 (o integrador roda o build, a bateria e o doctor no trem de merge); o fechamento anterior passa a dizer `Session:` com o nome do ramo. Nada do código mudou.

## [2026-11-21 10:32] session — save: F83, a proposta de arquitetura das telas em React com os idiomas, criticada, e a ADR-0023 em «Proposed»
**Branch:** claude/f83-site-screens-in-react

> Participantes: sessão de desenho aberta pelo orquestrador do V0 (Claude Code) · Branch: claude/f83-site-screens-in-react
> Session: claude/f83-site-screens-in-react (sessão de página, no worktree `f83-site-screens-in-react-83ca31`)

### Executive Summary
Entrega de desenho, sem código de produto e sem tela migrada. A proposta guiada por risco (`design/proposals/f83-react-screens/architecture-proposal.md`) decide como as telas em React convivem com as antigas, o que fica, a camada do celular, os testes, o contrato dos idiomas com a F81, a ordem das telas e o build. Foi julgada por um agente separado (pode ir ao MJRP: 0 P0, 10 P1, 3 P2) e revista: a resposta a cada achado está na seção 17. A ADR-0023 está em «Proposed», à espera dele; spec, plano e tarefas da F83 saíram do esboço, com «Approved» pendente.

### Decisions
Nenhuma do MJRP nesta sessão. Decidido pelo agente, na proposta, revisável, tudo à espera da aceitação dele:
- A tela em React é mais uma «view» do roteador da casa, no mesmo `#app`; o roteador só é revisto quando a última tela antiga sair.
- Ficam como estão: controladores, stores (sem biblioteca de estado), serviços, modelos, repositórios, `shared/`, o CSS e a camada do celular; TypeScript só no código novo (`screens/`, `ui/`, `shell/`, `react-bridge/`).
- Os textos num dicionário por idioma em JavaScript puro (`i18n/en`, `i18n/pt`), usado pelas telas antigas e novas; o conteúdo editável como par `{ en, pt }`; o app sem prefixo de idioma no endereço; a página de entrada com `/en/` e `/pt/`.
- O país de acesso pelo Firebase Hosting (reescritas de i18n e um `geo.json`), **a conferir** num canal de prévia; a escolha da pessoa vale acima; o palpite do país nunca é gravado como escolha.
- O português fica fechado em produção por uma chave (`OPEN_LOCALES`) até a cobertura que o MJRP escolher.
- A ordem: base e canário; playlists guardadas; edição das playlists (a medição difícil e o ponto de revisão dele); a moldura; Start; séries e álbuns; inventário; Blend; fecho.

### Next Session
1. O orquestrador leva ao MJRP, pelo Control Center, as decisões D-1 a D-8 da proposta (o ritmo; as emendas da constituição; os endereços por idioma; onde a escolha de idioma fica na conta; o idioma quando o país não é sabido; a página de entrada em português; a ordem das telas; quando o português abre) e a aceitação da ADR-0023, que é o commit dele com o carimbo.
2. Quando a medição (`wip/react-measurement-spike`) for entregue: trocar as marcas «prévia» e «a medir» da proposta pelos números dela.
3. A sessão da F81 lê o contrato dos idiomas: a nota `f83-languages-contract-for-f81.md` na pasta de notas das sessões, e a proposta § 5.2 a § 5.4, § 6 e § 7.
4. Depois da aceitação: a onda 0 (ferramentas, sensores, a ponte, «sem rede», o ícone, o teto de peso, o canário).

### Key Data
- Commits: `5a3be3f` (proposta e crítica), `fee3c2d` (ADR-0023), `a8bfc53` (spec, plano, tarefas), mais este de fechamento.
- Crítica: `reports/audits/2026-11-21-mjrpalbumblender-v0-f83-architecture-critique.md`, `verdict: can-go`, `status: open` até a decisão dele.
- Ainda «a medir»: o script principal depois da onda 0, o dicionário em português, as telas do menu em segundo plano, o tempo até a primeira tela, o tempo do build e da suíte com React, o custo de uma tela difícil (arrastar e soltar), o redesenho com listas grandes. Do rascunho da medição já se usa: React 68.922 B comprimidos (a análise estimava 45 KB), script principal +177 B, HTML idêntico em 4 estados, 0 asserções mudadas de 39.
- Não conferido: as reescritas de i18n do Firebase Hosting junto com a reescrita para `/app.html` e o cache por país; a ponte com as stores e o ícone sem HTML cru (desenho, não medida); o sensor da F84 com telas com dados.
- A proposta não tem página visual publicada; o arquivo é a fonte.
- O `status_sync` passou a spec da F83 de «Draft» a «In Progress» no commit das tarefas (derivado pelo gancho, não escolhido).

## [2026-11-21 10:31] session — F85: entregue sem o build de produção; provado no servidor de desenvolvimento
**Branch:** claude/f85-start-in-the-menu
Session: claude-code:claude/f85-start-in-the-menu (sessão do V0 aberta pelo orquestrador, via rápida)
Tarefas 01 a 03 feitas, teste primeiro (555 testes verdes nos arquivos tocados); a TASK-04 fica aberta: provado no servidor de desenvolvimento a 1280 e 393 px, com e sem conta (`reports/evidence/F85/`); NÃO provado: o build sob `vite preview`, a bateria completa e o doctor neste ramo (a fila de trabalhos pesados não andou em mais de uma hora; o orquestrador mandou entregar e cobre isso no trem de merge e na conferência em produção). Decidido pelo agente — revisável: o id de uso `home` não muda; «Go to Start» nas telas vazias; migalha e rodapé dizem «Start».

## [2026-11-21 10:31] session — F83: spec, plano e tarefas saem do esboço; a nota do contrato dos idiomas para a sessão da F81
**Branch:** claude/f83-site-screens-in-react
A spec ganha dez requisitos (a tela em React sob o mesmo roteador; nenhuma mudança para quem usa; a regra da casa e as listas que só encolhem; o que fica debaixo da tela; a camada do celular e o design system; os sensores e os tipos; o teto de peso; os textos pelo dicionário da F81; todas as telas, em ondas; publicar, voltar atrás e «sem rede»). O plano aponta para a proposta e lista os módulos. As tarefas são 32, em nove ondas (0 a 8): as de desenho em Opus, as de construção em Sonnet; todas esperam a ADR-0023 aceita. «Approved» segue pendente. Fora do repositório, na pasta de notas das sessões: `f83-languages-contract-for-f81.md`, o contrato do dicionário, da escolha de idioma e da chave que mantém o português fechado.

## [2026-11-21 10:31] decision — ADR-0023 em «Proposed»: as telas do site em React e TypeScript, tela a tela, com os textos num dicionário por idioma
**Branch:** claude/f83-site-screens-in-react
Rascunho do agente, à espera do MJRP (a rota é dele: traz um framework de interface para o site e emenda a constituição que ele ratificou). Registra a escolha dele de 2026-11-21 («sim vamos com react») e o como: a tela em React é mais uma «view» do roteador da casa; o que fica debaixo da tela não muda; todo texto visível vem de um dicionário em JavaScript puro, em inglês e português. A análise fica na proposta, não na ADR. Nunca «Accepted» pelo agente: a aceitação é o commit dele com o carimbo. `docs/decisions/0023-site-screens-in-react-screen-by-screen.md`.

## [2026-11-21 10:30] review — F83: a crítica separada da proposta de arquitetura e da ADR-0023 — pode ir ao MJRP (0 P0, 10 P1, 3 P2)
**Branch:** claude/f83-site-screens-in-react
Proposta de arquitetura guiada por risco das telas do site em React com os idiomas (`design/proposals/f83-react-screens/architecture-proposal.md`), julgada por um agente separado que recebeu só a skill e os artefatos: `reports/audits/2026-11-21-mjrpalbumblender-v0-f83-architecture-critique.md`. Os seis vetos passam ou não se aplicam. Os 10 P1 foram consertados no texto (seção 17 da proposta): a leitura da preferência que falha não apaga a escolha da conta; o idioma deduzido do país é palpite e não escolha; o português fica fechado por uma chave até a cobertura que o MJRP escolher; o contrato da ponte com as stores; «sem rede» distinto de «versão nova»; uma fonte só por peça partilhada; consertar à frente; a tela difícil medida antes da moldura; os sensores e o que nenhum prova; o teto de peso com número. Ficam abertos: a ponte e o ícone a provar na onda 0, arrastar e soltar (onda 2), o país pelo Firebase Hosting (a conferir), o sinal de erro em produção (a medição está desligada). Um ponteiro em `docs/specs/arch.md` § Propostas em avaliação. Os números da medição ainda não entregue estão como «prévia» ou «a medir».

## [2026-11-21 10:23] session — UAT-235: o diagnóstico da caixa chapada e cortada, e três prévias no comparador
**Branch:** fix/f80-uat-entry-page
Diagnóstico: a câmera do 3D (`public/splash/crate3d.js`) é fixa, de frente, no eixo comprido da caixa, com 30° de campo vertical, e nunca se ajusta ao quadro. O quadro é a coluna do palco: ~690 px de largura em 1280, 1440 e 1920 (a página para em 1280), mas a altura cresce com a janela (604, 704, 884 px), então o campo horizontal encolhe. De frente a caixa parece chapada; o único momento em diagonal é a virada («Flip the record»), quando a caixa (4,3 de comprimento) gira de lado e passa da borda: medido, os cantos chegam a 106% do quadro em 1024, 108% em 1920 e 153% em 900. Entre 900 e 1280 a coluna vai de ~330 a ~700 px e o corte piora quanto mais estreita.
Três prévias no mesmo eixo (de que ângulo se vê a caixa e quanto espaço ela ganha), tiradas da página real com as capas do ar e publicadas no comparador (https://claude.ai/artifact/5hDJr8qToYkAEsgCrfUK8e, página `uat-235.html`; as versões que ele já viu ficaram intactas): 1, três-quartos (30°) inteira no quadro; 2, o mesmo com o palco até a borda direita da janela; 3, ângulo forte (42°) com o disco puxado virando de frente. Nas três a câmera se ajusta ao quadro para todos os cantos caberem em todas as poses. Gerador em `design/proposals/f80-splash/uat-235/`. A página no ar não muda até a escolha dele.

## [2026-11-21 10:17] session — F81: fechamento depois do acerto com o deck do MJRPpersonal
Branch: claude/f81-site-in-more-than-one-language
Session: claude-code:claude/f81-site-in-more-than-one-language (sessão da F81 aberta pelo orquestrador do V0 em 2026-11-21)
Resumo: mapa na forma do deck do MJRPpersonal, ids congelados em `design/copy/album-blender-ids.json`, medidas de tamanho por linha e por tela, testes com texto literal contados (178 de 289 arquivos). Nenhuma decisão do MJRP; nada final; a página de revisão não foi montada.
Próxima sessão: o MJRP responde D-01 a D-13; renomear à mão as chaves feias dos textos montados antes do contrato da F83; depois a F81 é priorizada.
Key Data: último commit de trabalho `4ebb97b`.

## [2026-11-21 10:16] session — F81: o mapa passa à forma do deck do MJRPpersonal, com ids congelados, medidas de tamanho e os testes que comparam texto
Branch: claude/f81-site-in-more-than-one-language
Pedido do orquestrador (palavras do MJRP: «vc cria o artefato do copy deck pra funcionar como o site MJRP pro»). `design/copy/album-blender-copy.md` agora tem as colunas `ID | Onde aparece | Tipo | Português | Status PT | English | Status EN` mais caracteres e palavras por linha e por tela; o inglês é «em produção, a revisar», o português «tradução do agente, a revisar», nada final. `design/copy/album-blender-ids.json` congela os ids (viram chaves do CMS). 178 de 289 arquivos de teste comparam texto de interface (`scripts/i18n/tests-with-literal-text.py`). O que cabe sem rolar a 1280 e a 393 px não foi medido. Relatório e plan atualizados.

## [2026-11-21 10:14] session — F81: spec, plan e tasks saem do esboço; fechamento da sessão do levantamento
**Branch:** claude/f81-site-in-more-than-one-language
Session: claude-code:claude/f81-site-in-more-than-one-language (sessão da F81 aberta pelo orquestrador do V0 em 2026-11-21 («levantar todos os textos do site e entregar o mapa de que a F81 vai traduzir»).)
Resumo: a spec da F81 ganhou 9 requisitos (REQ-01 a REQ-09: dicionário por idioma, país na primeira visita, escolha da pessoa acima do país, seletor de idioma, rótulo único, o que não se traduz, textos montados, falhas sem mensagem crua, página de entrada e `index.html`), estados observáveis e critérios; o plan guarda o que o levantamento mostrou do código e deixa o desenho técnico «a escrever: vem da proposta de arquitetura da F83»; as tasks (TASK-01 a TASK-09, construção em sonnet, `rounds:: 1`). `**Approved**` continua «pendente» nos três.
Decisões gravadas: nenhuma decisão do MJRP nesta sessão; as perguntas D-01 a D-13 (Blend, Series, Compendiums, Deep Cuts e Greatest Hits, Batch, Inventory/Collection, Home, cozinha, Rank/Popularity, idioma do que é gravado, caixa e reticências, como revisar, a página de entrada) esperam o MJRP no relatório, cada uma com a recomendação do agente marcada como opinião.
Próxima sessão: o MJRP responde as decisões; a proposta de arquitetura da F83 define o contrato do dicionário; só então a F81 é priorizada e construída (TASK-01 em diante). A busca não vê texto que vem de dado, de imagem, do manifesto, de janelas de login de terceiros nem o que só aparece em estados reais; 391 linhas do mapa são «provável».
Key Data: 1106 textos / 1437 pontos; 234 montados de pedaços; 23 pontos mostram `error.message`; 13 pontos de data/moeda; 87 descartados; commit do mapa `4dfc9db`.

## [2026-11-21 10:14] session — F81: fechamento (levantamento dos textos e rascunho da feature entregues)
Branch: claude/f81-site-in-more-than-one-language
Session: claude-code:claude/f81-site-in-more-than-one-language (sessão da F81 aberta pelo orquestrador do V0 em 2026-11-21)
Resumo: 1106 textos em 1437 pontos mapeados (`design/copy/album-blender-copy.md`, `scripts/i18n/`), relatório `reports/audits/2026-11-21-mjrpalbumblender-v0-f81-copy-survey.md` com as decisões D-01 a D-13, spec/plan/tasks da F81 em rascunho (`**Approved**` pendente; tasks esperam o MJRP). Nenhum código de produto foi tocado; nada foi enviado ao remoto.
Decisões gravadas: nenhuma decisão do MJRP; a coluna PT do mapa é proposta do agente, nada aprovado.
Próxima sessão: o MJRP responde D-01 a D-13; a proposta da F83 define o contrato do dicionário; depois a F81 é priorizada e construída (TASK-01).
Key Data: commits `4dfc9db`, `ba9cc27`, `ad26f1f` neste ramo.

## [2026-11-21 10:13] session — F81: levantamento de todos os textos do site (1106 textos, 1437 pontos) e o mapa para o português
**Branch:** claude/f81-site-in-more-than-one-language
Levantamento dos textos que uma pessoa vê ou o leitor de tela lê, por árvore sintática (`scripts/i18n/scan-copy.cjs`, `scripts/i18n/build-deck.py`): 1106 textos distintos em 1437 pontos de `public/` e `server/`; o mapa está em `design/copy/album-blender-copy.md` (uma linha por texto, com id, tela, tipo, EN, PT e marca) e a coluna PT é proposta do agente (subagentes Sonnet), nada aprovado. O relatório `reports/audits/2026-11-21-mjrpalbumblender-v0-f81-copy-survey.md` traz as contagens, os casos difíceis, os conceitos com mais de um rótulo (IA-02) e as decisões D-01 a D-13 para o MJRP. Nenhum código de produto foi alterado.

## [2026-11-21 10:08] session — UAT da F80: a caixa de discos mais em diagonal e sem corte (UAT-235); o board fora de passo com o estado real
**Branch:** main
O MJRP abriu o UAT da F80 com uma captura: «a caixa de discos, fica com um efeito muito 2 d qdo está reta e a area dela bem limita, que tal melhorarmos pra ficar mais em diagonal, mas sem o corte da tela que temos hj. o que acha?» — UAT-235. Ele propôs uma sessão de UAT para ir passando as issues; ela sobe em Opus (desenho de tela), com prévias no comparador antes de mudar a página. Sobre o board, palavras dele: «se preocupe com o status do board está condizente com o status real … se é esperando meu aceite nao deveriam estar em coluna esperando». Medido: de F45 a F78, 33 features «em andamento»; 23 só esperam o juízo dele (deveriam estar em «Pronto para UAT»), 6 mistas, 4 só com passo do agente. O agente mestre deu o caminho: atualizar a cópia do kernel (sessão aberta por ele) e depois fechar em lote, numa sessão, tirando a tarefa de aceite. Ele também disse para não cobrar os aceites: ele os gerencia.

## [2026-11-21 09:45] session — F85: a documentação no mesmo ramo (passo retroativo da via rápida)
**Branch:** claude/f85-start-in-the-menu
`behavior.md` (os endereços antigos e o menu, o rodapé, a raiz, «Sign in» da página, e duas linhas novas: o logotipo e o «Start»), `arch.md`, `info-arch.md` (e `info-arch.html`, gerado com o `build_info_arch_page.py`), as páginas do manual que nomeiam o menu ou o endereço, a spec/plan/tasks. Decidido pelo agente — revisável: o botão das telas vazias passa a dizer «Go to Start» (ia para a tela que se chamava Home); a migalha e o rodapé também dizem «Start». A aprovação da spec segue do MJRP.

## [2026-11-21 09:41] session — F84: instalar os navegadores do Playwright sempre pelo nome
**Branch:** main
A orquestradora do MJRPpersonal repôs o WebKit 2215 que a instalação do V0 tinha tirado do cache da máquina, e avisou a causa: `npx playwright install` sem nome remove as versões dos outros projetos. A regra e o jeito de contornar o travamento ao descompactar estão no plano da F84.

## [2026-11-21 09:40] session — F85 TASK-01..03: «Start» no menu e na aba, `/start`, o logotipo leva à página de entrada, a raiz manda para `/start`
**Branch:** claude/f85-start-in-the-menu
Teste primeiro, depois o código. O item «Home» (menu do computador, gaveta, aba do celular, rodapé, migalha) virou «Start»; a rota é `/start`, e `/home` (com a consulta: `/home?signin`) leva a ela por `startRoute.js`. O logotipo (computador e celular) é um link para `/?entry` marcado `data-full-page`: o roteador o deixa ao navegador (carga inteira). A decisão da raiz (`gate.js`) e os botões da página de entrada levam a `/start` (e `/start?signin`). Decidido pelo agente — revisável: o id de uso `home` (medição) não muda.

## [2026-11-21 09:30] decision — F85: o item do menu se chama «Start», e «Inicie» em português
**Branch:** main
Palavras do MJRP (2026-11-21, no chat): «pode ser new Series», «pensando bem, pode ser Starte e Inicie em pt», «Start». Na spec da F85: «Start» em inglês, «Inicie» em português do Brasil (que entra com a F81). Continua decidido pelo agente, revisável: com a conta aberta, o site abre direto na tela de trabalho e só o logotipo leva à página de entrada.

## [2026-11-21 09:29] session — F85 («Start» no menu, o logotipo leva à página de entrada) em esboço, com a S-67; o roteiro de UAT da F79 e da F80
**Branch:** main
O MJRP perguntou se a mudança do menu e do logotipo pode ir a produção já. A F85 nasce na `main` em esboço, via rápida, com a S-67 (EP-01, v6.0 — escolhidos pelo agente). Decidido pelo agente, revisável, porque ele não escolheu: o nome «Start», e com a conta aberta o site continua abrindo direto na tela de trabalho (só o logotipo leva à página de entrada). O ramo espera a F85 na «Priorizada». A pedido dele («uat da f80 e f79»), o roteiro de UAT das duas: `reports/evidence/F79/2026-11-21-f79-f80-uat-script.md`; o aceite é dele, pela tela de aceite do Control Center.

## [2026-11-21 09:28] decision — F82: os álbuns da página de entrada passam a ser escolhidos no CMS
**Branch:** main
Palavras do MJRP (2026-11-21): «ah e gostaria que no CMS fosse configurável os albuns que aparece na nova home». Virou o REQ-03 da F82, com a tarefa. Na mesma mensagem ele abriu uma discussão, ainda sem decisão: o item «Home» do menu virar «Initiate» ou «Start», e o logotipo levar à página de entrada, que passaria a ser a home. As sessões por feature não subiram: ele pediu para discutir isso antes da migração.

## [2026-11-21 09:26] decision — o app (F78) fica em pausa; o foco é React com os idiomas, e o CMS
**Branch:** main
Palavras do MJRP (2026-11-21, de volta ao Mac): «agora voltei para o mac, pause a continuacao da app por enqto, vamos nos concentrar na migracao pra react + internacionalizacao e no CMS». A F78 para onde está (o esqueleto no simulador; a rodada de desenho das telas do app, escolhida na D-06, não começa). As sessões por feature sobem agora para a F83 (a proposta de arquitetura do React) e a F81 (o levantamento dos textos), mais a atualização da cópia do kernel. O CMS (F82) depende da F332 do harness, que espera a prioridade dele no board de lá.

## [2026-11-21 09:10] session — D-06 e D-07 aplicadas: o app segue por uma rodada de desenho; o MJRP já tem a conta de desenvolvedor da Apple
**Branch:** main
Respostas do MJRP pelo Control Center, com a passkey (09:09). D-06: «a» — uma rodada de desenho das telas do app, no comparador, antes de mais código; é a próxima coisa da F78 (a tarefa de protótipo julgado que o plano já previa), numa sessão de desenho em Opus quando as sessões puderem subir. D-07, nas palavras dele: «Tenho conta de dev da apple» — a conta da Apple sai das pendências; a do Expo ele não mencionou e fica para quando houver o que testar no aparelho. O lote `2026-11-21-0845-v0-pending-decisions` está todo respondido e aplicado. O conserto da UAT-232 (`361ad29`) está na `main` e ainda não foi publicado: a publicação foi recusada pela trava de permissão desta sessão e espera a palavra dele.

## [2026-11-21 09:09] session — D-04 e D-05 aplicadas: o contorno laranja sai (UAT-232); a medição fica desligada e ganha uma chave no CMS
**Branch:** main
Respostas do MJRP pelo Control Center, com a passkey (09:08). D-04: aceita a recomendação — tirar o contorno laranja ao abrir «paste a list» e deixar as outras duas diferenças como estão. Feito: a caixa da lista colada não acende mais em laranja com o foco dentro; a linha em foco continua marcada (`public/css/views/home.css`, teste `test/components/home/HomePasteBoxFocus.test.js`, que falhou antes e passa depois). UAT-233 e UAT-234 ficam como estão, com a decisão dele escrita na linha; o fecho delas é dele. D-05, nas palavras dele: «Deixar desligada e entrar no CMS uma feature toggle pra ligar assim que terminarmos a Migracao para o react e o buil do CMS» — virou o REQ-02 da F82; a medição segue desligada.

## [2026-11-21 09:09] answer — lote 2026-11-21-0845-v0-pending-decisions

- Lote: `reports/proposals/2026-11-21-0845-v0-pending-decisions.md`
- Envio: 006863e0abbe691f
- Recomendações aceitas: D-06
- D-07: (outra) Tenho conta de dev da apple
- Pela tela do Control Center, com a passkey.
- assinatura: eyJhdXRoZW50aWNhdG9yX2RhdGEiOiJvN1kzNVpGREl1ZFNYaXp1NzNvZ1NQaTJkNnBZd2RJTkxvYTA1NU90QWdnZEFBQUFBQSIsImNsaWVudF9kYXRhX2pzb24iOiJleUowZVhCbElqb2lkMlZpWVhWMGFHNHVaMlYwSWl3aVkyaGhiR3hsYm1kbElqb2lOSFpWUVV3MVNXOTJhbGg2VlhaaGRHUjVTMGREYVdsaE5XVmljVXh4U0dwa2FXNVZaWFZFUW5ZeU9DSXNJbTl5YVdkcGJpSTZJbWgwZEhCek9pOHZiV3B5Y0MxdE5YQnlieTUwWVdsc01tRXlOakF6TG5SekxtNWxkQ0lzSW1OeWIzTnpUM0pwWjJsdUlqcG1ZV3h6WlgwIiwiY3JlZGVudGlhbF9pZCI6IkJISnRSNXIxaTdUbjlCX1hjSmpMVUk4eFJlMCIsInBheWxvYWRfYnl0ZXNfYjY0IjoiZXlKbGVIQnBjbVZ6WDJGMElqb3hOemsxTWpZek5UYzVMQ0pwYzNOMVpXUmZZWFFpT2pFM09UVXlOakk1Tnprc0ltdHBibVFpT2lKd2NtOXdiM05oYkNJc0ltNXZibU5sSWpvaWVtcHVPVEV5VEdkSVMwbzFkV2RFUm1Sd2RXeEZlRlZISWl3aWNISnZhbVZqZENJNklrMUtVbEJmUVd4aWRXMXpRbUZzWVc1alpXUlFiR0Y1YkdsemRITmZkakFpTENKelkyOXdaU0k2SWpJd01qWXRNVEV0TWpFdE1EZzBOUzEyTUMxd1pXNWthVzVuTFdSbFkybHphVzl1Y3lJc0luTjFZbXBsWTNRaU9pSTBaV0kxWm1FM1lqWmtOREF3TkRGalltTXlNelUzWXpVMU4yRmhObU5tWVRVeE56Rm1OREkyTkRRNE5XVmpOVEV4WVdJeU0yTmhNekZrWkRFNFlUWXhJaXdpZGlJNk1YMCIsInNpZ25hdHVyZSI6Ik1FUUNJQUZ0YmpYQ1JKX0c3TThyTnFPSHhwSHdVem1oZnJHSDg5M00zUy0tdEtGMEFpQXBiOWM5N2VWdTBudGhOcDBuRnc4TlVOeGJUTGppNmp3c0kyUnp1X0xKTXcifQ==
- folhas: D-06:f389280df56ef970 D-07:3091725cd9e4f1bc

## [2026-11-21 09:08] session — F84 (o sensor visual, com o Playwright) em esboço, com a S-66; o trabalho montado espera a prioridade
**Branch:** main
O agente montou o sensor num worktree (Playwright 1.63.0, `test/visual/visual.config.mjs`, `sensors.visual`), mas o gancho de nomes recusou o ramo `chore/visual-sensor-setup`: o trabalho precisa de uma feature no board. A F84 nasce na `main` em esboço (via rápida; S-66; épico e versão escolhidos pelo agente). O que está montado fica sem commit no worktree até o MJRP pôr a F84 na «Priorizada». Primeira rodada do sensor, sem ajuste: 18 P0, 0 P1, 27 P2 — os 18 P0 são todos «ordem de região» na Home a 1280, que o agente atribui aos seletores da configuração e não à tela; a conferir par a par (REQ-02). Com o sensor declarado o doctor deixa de acusar o A2. Efeito colateral a avisar: a instalação dos navegadores tirou da pasta de cache o WebKit 2215, que pode ser o do Playwright 1.56.1 do MJRPpersonal.

## [2026-11-21 09:08] answer — lote 2026-11-21-0845-v0-pending-decisions

- Lote: `reports/proposals/2026-11-21-0845-v0-pending-decisions.md`
- Envio: 837c03887231f8aa
- Recomendações aceitas: D-04
- D-05: (outra) Deixar desligada e entrar no CMS uma feature toggle pra ligar assim que terminarmos a Migracao para o react e o buil do CMS
- Pela tela do Control Center, com a passkey.
- assinatura: eyJhdXRoZW50aWNhdG9yX2RhdGEiOiJvN1kzNVpGREl1ZFNYaXp1NzNvZ1NQaTJkNnBZd2RJTkxvYTA1NU90QWdnZEFBQUFBQSIsImNsaWVudF9kYXRhX2pzb24iOiJleUowZVhCbElqb2lkMlZpWVhWMGFHNHVaMlYwSWl3aVkyaGhiR3hsYm1kbElqb2laamxNTlRCTGIxZFlWa3RJVEc1clRYcEpkbEE0VG1WdVZEaHlVbXRaVWpkNFlsQlRkV0ZETW5wUVFTSXNJbTl5YVdkcGJpSTZJbWgwZEhCek9pOHZiV3B5Y0MxdE5YQnlieTUwWVdsc01tRXlOakF6TG5SekxtNWxkQ0lzSW1OeWIzTnpUM0pwWjJsdUlqcG1ZV3h6WlgwIiwiY3JlZGVudGlhbF9pZCI6IkJISnRSNXIxaTdUbjlCX1hjSmpMVUk4eFJlMCIsInBheWxvYWRfYnl0ZXNfYjY0IjoiZXlKbGVIQnBjbVZ6WDJGMElqb3hOemsxTWpZek5URXlMQ0pwYzNOMVpXUmZZWFFpT2pFM09UVXlOakk1TVRJc0ltdHBibVFpT2lKd2NtOXdiM05oYkNJc0ltNXZibU5sSWpvaVlsSTNMWEJxVjBwelV6aERabGxmZEhOeGFrVXhkVGt5SWl3aWNISnZhbVZqZENJNklrMUtVbEJmUVd4aWRXMXpRbUZzWVc1alpXUlFiR0Y1YkdsemRITmZkakFpTENKelkyOXdaU0k2SWpJd01qWXRNVEV0TWpFdE1EZzBOUzEyTUMxd1pXNWthVzVuTFdSbFkybHphVzl1Y3lJc0luTjFZbXBsWTNRaU9pSXlORGN6WTJNME1qTTJNRGRpWWpRNU1qTmtZemcwTXpJM01XWTNZbUUyTW1JNU0yRXdOREJoWmpGaVlqTmxNVFZqTWpCbFlXWmhNV014TjJJd01tTmtJaXdpZGlJNk1YMCIsInNpZ25hdHVyZSI6Ik1FVUNJQW9vbGhlVTNPWGttVWVDcWNfYmZHQU9jb2ItTUpackdKWXl1NGxEU0NIVkFpRUFsY0RTM1lBdjFsX0tjMGdKNGlXRFZ5XzN6cGRvbXF6bTRVaUZMUUp1cW5ZIn0=
- folhas: D-04:ce84bed217e0c7cd D-05:20e14caef230cd38

## [2026-11-21 09:06] decision — F81: o idioma vem do lugar de quem acessa, e a escolha da pessoa vale acima
**Branch:** main
Palavras do MJRP (Control Center, com a passkey, D-03, 09:05): «De acordo com a geo location primeiro e depois a selecao do user toma precedencia». Como foi lido: primeira visita pelo país de acesso (Brasil → português do Brasil; fora → inglês); a escolha da pessoa passa a valer acima disso. Decidido pelo agente, revisável: sem saber o lugar, inglês; a escolha guardada no aparelho e, com conta, na conta. Está na spec da F81. O agente mestre registrou no harness a F332 (o kit do CMS mora no harness, S-253 de lá, commit `82c7ebfec`, em esboço): a F82 do V0 declara a dependência no plano.

## [2026-11-21 09:05] answer — lote 2026-11-21-0845-v0-pending-decisions

- Lote: `reports/proposals/2026-11-21-0845-v0-pending-decisions.md`
- Envio: 1c32b72c6db272f7
- D-03: (outra) De acordo com a geo location primeiro e depois a selecao do user toma precedencia
- Pela tela do Control Center, com a passkey.
- assinatura: eyJhdXRoZW50aWNhdG9yX2RhdGEiOiJvN1kzNVpGREl1ZFNYaXp1NzNvZ1NQaTJkNnBZd2RJTkxvYTA1NU90QWdnZEFBQUFBQSIsImNsaWVudF9kYXRhX2pzb24iOiJleUowZVhCbElqb2lkMlZpWVhWMGFHNHVaMlYwSWl3aVkyaGhiR3hsYm1kbElqb2llbXBOTlVodlQxOWtWRGhuY0dWUGMwbHZlVGhMVXpWNVMycERkVlZ5ZG5scmIxZHNhSHBTY1hoUWR5SXNJbTl5YVdkcGJpSTZJbWgwZEhCek9pOHZiV3B5Y0MxdE5YQnlieTUwWVdsc01tRXlOakF6TG5SekxtNWxkQ0lzSW1OeWIzTnpUM0pwWjJsdUlqcG1ZV3h6WlgwIiwiY3JlZGVudGlhbF9pZCI6IkJISnRSNXIxaTdUbjlCX1hjSmpMVUk4eFJlMCIsInBheWxvYWRfYnl0ZXNfYjY0IjoiZXlKbGVIQnBjbVZ6WDJGMElqb3hOemsxTWpZek16UTVMQ0pwYzNOMVpXUmZZWFFpT2pFM09UVXlOakkzTkRrc0ltdHBibVFpT2lKd2NtOXdiM05oYkNJc0ltNXZibU5sSWpvaVdtMUlRMmRKUVhnMVIyUTFUeTFJY25OS2VDMTBNa1ZWSWl3aWNISnZhbVZqZENJNklrMUtVbEJmUVd4aWRXMXpRbUZzWVc1alpXUlFiR0Y1YkdsemRITmZkakFpTENKelkyOXdaU0k2SWpJd01qWXRNVEV0TWpFdE1EZzBOUzEyTUMxd1pXNWthVzVuTFdSbFkybHphVzl1Y3lJc0luTjFZbXBsWTNRaU9pSTFaRGsxWXpSalpERmxNalF6TVRRMU1qVmtOMlprWWpObFlUZGlOMlUyTTJJd05HSXpZakUzT0dFeFpHVTRZMk01Tm1RME5HRXdOVE16WTJJME5HRmlJaXdpZGlJNk1YMCIsInNpZ25hdHVyZSI6Ik1FVUNJUUNZUWhkVVNkSzBidTN5MzBocmVHVkFpNVlqTHdSM2E0SUpPTlVsMGhxM3hRSWdQX1VKUllDY3pzOWFlcm9vVFZaUC11MjVJUzhNdmM2dm9DOFdHX3RPbUNVIn0=
- folhas: D-03:50fe081b61df3bb1

## [2026-11-21 09:05] session — D-02 aplicada: a ordem é a do chat
**Branch:** main
O MJRP respondeu a D-02 pelo Control Center com «Respondido no chat». No chat ele aceitou a ordem React, idiomas junto com a migração e o CMS depois («Bora !») e priorizou F81 > F83 > F82. Os planos das três features seguem essa ordem; marcado no lote.

## [2026-11-21 09:04] answer — lote 2026-11-21-0845-v0-pending-decisions

- Lote: `reports/proposals/2026-11-21-0845-v0-pending-decisions.md`
- Envio: 3e3afc4b038345ea
- D-02: (outra) Respondido no chat
- Pela tela do Control Center, com a passkey.
- assinatura: eyJhdXRoZW50aWNhdG9yX2RhdGEiOiJvN1kzNVpGREl1ZFNYaXp1NzNvZ1NQaTJkNnBZd2RJTkxvYTA1NU90QWdnZEFBQUFBQSIsImNsaWVudF9kYXRhX2pzb24iOiJleUowZVhCbElqb2lkMlZpWVhWMGFHNHVaMlYwSWl3aVkyaGhiR3hsYm1kbElqb2lXRTF0VWpOclkwUmhXVWxKT1dKVGVFaEZWRWxrUTA5a05HRmhXR0pmVW1kWlZUVkpaVWxSZG5obU1DSXNJbTl5YVdkcGJpSTZJbWgwZEhCek9pOHZiV3B5Y0MxdE5YQnlieTUwWVdsc01tRXlOakF6TG5SekxtNWxkQ0lzSW1OeWIzTnpUM0pwWjJsdUlqcG1ZV3h6WlgwIiwiY3JlZGVudGlhbF9pZCI6IkJISnRSNXIxaTdUbjlCX1hjSmpMVUk4eFJlMCIsInBheWxvYWRfYnl0ZXNfYjY0IjoiZXlKbGVIQnBjbVZ6WDJGMElqb3hOemsxTWpZek1qazFMQ0pwYzNOMVpXUmZZWFFpT2pFM09UVXlOakkyT1RVc0ltdHBibVFpT2lKd2NtOXdiM05oYkNJc0ltNXZibU5sSWpvaWNUZ3Rka1JNWHpOa1RuVkNlSFZEVlRWV1JuRlBhV3g2SWl3aWNISnZhbVZqZENJNklrMUtVbEJmUVd4aWRXMXpRbUZzWVc1alpXUlFiR0Y1YkdsemRITmZkakFpTENKelkyOXdaU0k2SWpJd01qWXRNVEV0TWpFdE1EZzBOUzEyTUMxd1pXNWthVzVuTFdSbFkybHphVzl1Y3lJc0luTjFZbXBsWTNRaU9pSmxPV0ZsTXpBNVltUTNNV0V3T1dWaE5EaGxaREpqTkRabU9HVmlaREl4TURjd01EVmxNMlV3TVRVd01HWTNOMlF4TVRWaVpqQXlZakkzTVRrMFpUTTNJaXdpZGlJNk1YMCIsInNpZ25hdHVyZSI6Ik1FVUNJRG9vSGFZdzFfd2xvbkNuZFZnZllSblNjOGI2cnhzcWFLcjNENWF4cURKc0FpRUEwUnFPT20wWHhiTjdkblVvbFZWdm5LUlU3UVQ0TFFHQVlpR1lsU2VTaTZFIn0=
- folhas: D-02:49a28fc46e60a650

## [2026-11-21 09:04] session — D-01 aplicada: o kit do CMS mora no harness; o MJRP priorizou F81 > F83 > F82
**Branch:** main
O MJRP respondeu pelo Control Center, com a passkey (09:04): o pacote do kit do CMS mora dentro do harness, distribuído como o kernel. Aplicado: o agente mestre e a orquestradora do MJRPpersonal avisados; o plano da F82 atualizado. Ele também priorizou no board F81 > F83 > F82 (`9126a95`; F79 e F80 saíram como entregues). O agente mestre corrigiu o plano das sessões por feature: Sonnet em esforço médio para construir, Opus ou Fable para arquitetura e desenho; ramo `claude/fNN-<slug>` para a sessão de construção; no máximo duas sessões de construção do V0 por vez; atualizar a cópia do kernel no V0 antes. As sessões ainda não subiram: o MJRP está pelo Remote Control, de onde o app não deixa iniciar sessão; sobem quando ele pedir pelo app do Mac.

## [2026-11-21 09:04] answer — lote 2026-11-21-0845-v0-pending-decisions

- Lote: `reports/proposals/2026-11-21-0845-v0-pending-decisions.md`
- Envio: 6f926be79ae04025
- D-01: b
- Pela tela do Control Center, com a passkey.
- assinatura: eyJhdXRoZW50aWNhdG9yX2RhdGEiOiJvN1kzNVpGREl1ZFNYaXp1NzNvZ1NQaTJkNnBZd2RJTkxvYTA1NU90QWdnZEFBQUFBQSIsImNsaWVudF9kYXRhX2pzb24iOiJleUowZVhCbElqb2lkMlZpWVhWMGFHNHVaMlYwSWl3aVkyaGhiR3hsYm1kbElqb2lUVWx1TFhwamRHOU9OMmxNYVhveFlUWmtObXRVTURVMFVGSkdhM2d3TFY5TFdqa3hWRkF3YzNKeVVTSXNJbTl5YVdkcGJpSTZJbWgwZEhCek9pOHZiV3B5Y0MxdE5YQnlieTUwWVdsc01tRXlOakF6TG5SekxtNWxkQ0lzSW1OeWIzTnpUM0pwWjJsdUlqcG1ZV3h6WlgwIiwiY3JlZGVudGlhbF9pZCI6IkJISnRSNXIxaTdUbjlCX1hjSmpMVUk4eFJlMCIsInBheWxvYWRfYnl0ZXNfYjY0IjoiZXlKbGVIQnBjbVZ6WDJGMElqb3hOemsxTWpZek1qUXdMQ0pwYzNOMVpXUmZZWFFpT2pFM09UVXlOakkyTkRBc0ltdHBibVFpT2lKd2NtOXdiM05oYkNJc0ltNXZibU5sSWpvaU9XdHVRVFJhY1dOMGRFWlhiamREYzI5SU4zbE9SMUZVSWl3aWNISnZhbVZqZENJNklrMUtVbEJmUVd4aWRXMXpRbUZzWVc1alpXUlFiR0Y1YkdsemRITmZkakFpTENKelkyOXdaU0k2SWpJd01qWXRNVEV0TWpFdE1EZzBOUzEyTUMxd1pXNWthVzVuTFdSbFkybHphVzl1Y3lJc0luTjFZbXBsWTNRaU9pSTFaVGc0Wm1KbU56TXpPRE5sWmpBM01URTNZMkV3WXpKa00yUTNNakU1T0RrelkyWTFZV0pqWmprek9HUmtNakZoT0RJeU1USmlPR1EwT1RrellXTXpJaXdpZGlJNk1YMCIsInNpZ25hdHVyZSI6Ik1FVUNJSG13SFl4eTNRRjMzMkpKUHB0ckE3a1NDRlByR0xYNU9uZ3JxU3NMcEZ6QkFpRUFnVk5pQWtpMHdwQXd6ZFg5TGNJaC1tbVU4bl80WTZuMVBTTF9kZWp2ZzJvIn0=
- folhas: D-01:61a2a498596a9f6d

## [2026-11-21 09:04] session — Playwright instalado como devDependency da raiz
**Branch:** claude/f84-visual-sensor-with-playwright
Palavras do MJRP: «Instala o playwright». O `@playwright/test` entrou como devDependency da raiz, fixado em `1.63.0` (a versão que o harness usa), não na 1.56.1 do juiz: o WebKit da 1.56.1 (build 2215) não baixou nesta máquina (o download parava depois de 16 MB, em três tentativas, e o outro servidor de download respondeu 403), e o Chromium 1243 e o WebKit 2359 que a 1.63.0 usa já estavam instalados; o kit aceita da 1.51 até a 2.0. O `vitest.config.js` passa a excluir `test/visual/**`: nenhum arquivo do Playwright entra nos testes do app. Só a dependência e o `package-lock.json`; o sensor vem no commit seguinte.

## [2026-11-21 08:58] decision — a ordem: React, os idiomas junto com a migração, o CMS depois
**Branch:** main
O agente propôs a ordem (1. React com as primeiras telas; 2. os idiomas junto com a migração, tela a tela; 3. o CMS depois, editando o dicionário pronto, quando o kit for pacote) e o MJRP respondeu: «Bora !». Como foi lido: a ordem está aceita como caminho de trabalho; não é aceite de feature nem de ADR. Segue: a medição numa tela real (em curso), depois a proposta de arquitetura da F83 com a F81 e a ADR da adoção, para ele aceitar; os ramos de construção só depois de ele priorizar a F83 e a F81 no board. No lote do Control Center, a pergunta D-02 fica respondida por esta conversa («os idiomas primeiro, o CMS depois»).

## [2026-11-21 08:53] decision — o site vai para React; F83 em esboço, com a S-65
**Branch:** main
Palavras do MJRP (2026-11-21): «Ok transforme a opiniao em fato checado e sim vamos com react, qual a vantagem de fazer a migracao e internacionalizacao juntas? O cms nao deveria surgir depois?» Como foi lido: a adoção do React no site está decidida; falta transformar em fato o que a análise deu como opinião, e responder sobre a ordem. Conferido lendo o kit do CMS: é React puro (só `react`, `clsx` e `@dnd-kit`), sem o Next. A F83 «As telas do site em React, tela a tela» nasce na `main` em esboço (S-65, EP-10, v6.0 — épico e versão escolhidos pelo agente). O esforço e o peso estão sendo medidos numa tela real, num ramo de experimento que não entra na `main`. A adoção pede uma ADR, que só ele aceita. Sobre a ordem, o agente reviu a própria recomendação: migração e idiomas juntos, tela a tela; o CMS depois.

## [2026-11-21 08:47] session — análise: adotar um framework no site (React, Vue ou Next)
**Branch:** main
A pedido do MJRP («acha que está na hora de usar um framework mais moderno? React, vue ou o next?»). `reports/audits/2026-11-21-mjrpalbumblender-v0-frontend-framework-analysis.md`: o site medido (105 arquivos e 19.461 linhas de tela feita à mão; 141 arquivos de regras, serviços e núcleo que não dependem de tela), as quatro opções com ganhos e perdas, e a recomendação do agente, que é opinião: React com o Vite atual, em TypeScript, tela a tela, começando pela página do CMS (F82); o Next fica como porta aberta. Nenhum código mudou; adotar pede uma ADR aceita por ele.

## [2026-11-21 08:45] session — as pendências com o MJRP vão ao Control Center, num lote de propostas
**Branch:** main
Palavras do MJRP (2026-11-21): «Pergunte para o master agent como vc faz propostas/perguntas usando o harness control center e use-o para fazer peeguntas e enderecar suas pendencias comigo. Responderei via harness remote». O agente mestre explicou o mecanismo (`proposal-batch@1`, `mjrp-scripts/proposal_batches.py`). Lote `reports/proposals/2026-11-21-0845-v0-pending-decisions.md`, sete itens: onde mora o pacote do kit do CMS, a ordem entre F82 e F81, os idiomas, os três P2 da Home, a medição de uso, o próximo passo do app, as contas da Apple e do Expo. Fora do lote, porque são válvulas dele: o aceite da F71 à F80 e o carimbo da ADR-0022. Cada resposta se aplica e se marca com `proposal_batches.py mark`.

## [2026-11-21 08:12] session — F81 e F82: o que o agente mestre e o orquestrador do MJRPpersonal responderam
**Branch:** main
O kit do CMS é uma pasta do MJRPpersonal (`src/admin-kit/`, ADR-0011 de lá): núcleo em TypeScript sem framework, interface em React, com portas de ler, gravar, imagem e traduzir; o login e o banco são do projeto. Para o V0 os dois recomendam uma ilha React em `/admin`, as portas sobre o Firestore, o Firebase Auth que já existe e a tradução no servidor Node; para os idiomas, um dicionário por idioma e o conteúdo como par `{pt, en}`. A ADR-0011 diz que o kit vira pacote no segundo projeto e proíbe copiar a pasta: onde o pacote mora é decisão do MJRP. Tudo isso está nos planos das duas features como relato a conferir; nada foi lido no kit ainda, nenhum ramo aberto.

## [2026-11-21 08:11] decision — F81 (o site em mais de um idioma) e F82 (um admin com o CMS-kit), em esboço, com S-63 e S-64
**Branch:** main
Palavras do MJRP (2026-11-21): «As próximas features agora serao de internacionalizar o site e criar um admin como temos nos sites do MJRP personal, utilizando o CMS-kit nosso.» «Pode falar com o master agent sobre isso e com o orchestrator do MJRP personal tb». As duas nascem na `main`, em esboço (via padrão, tipo feature), com as histórias S-63 e S-64 no PRD, sob o EP-10 e planejadas para a v6.0 — o épico e a versão foram escolhidos pelo agente, revisáveis. Nenhum ramo, protótipo ou código antes das conversas com o agente mestre do harness e o orquestrador do MJRPpersonal e de o MJRP priorizar.

## [2026-11-21 08:10] session — F80: as capas reais em produção; a UAT-231 consertada
**Branch:** main
Site publicado da `main` (`e79ac58`, `/assets/main-NTQyvnTw.js`) com `VITE_SPLASH_COVERS=real` no `.env` da pasta da `main` desta máquina (fora do repositório: um build feito noutra máquina, sem essa linha, volta às capas fictícias). Em produção, a 393 px: as capas vêm do servidor de imagens da Apple, a página não passa da largura da tela e o crédito mais longo cabe (termina em 377 px). Relatório: `reports/evidence/F80/2026-11-21-production-proof.md`. A prévia local (porta 5010) foi encerrada pela limpeza do harness e, ao subir de novo, serviu a pasta da sessão, com código antigo: a conferência foi feita em produção.

## [2026-11-21 08:03] decision — F80: as capas reais do Apple Music vão ao ar; o sensor visual é instalado
**Branch:** main
Palavras do MJRP (2026-11-21): «Instala o playwright e vamos com as capas da Apple pq por enqto só eu uso». Como foi lido: a página de entrada passa a ser publicada com o conjunto real de capas (`VITE_SPLASH_COVERS=real`), enquanto só ele usa o site; a leitura dos termos da Apple feita na proposta continua valendo para quando o site for público. Antes de ligar, o conserto da UAT-231: no celular o crédito sob cada disco quebra linha e ocupa a largura da coluna (`public/splash.html`, teste `test/splash/creditWrapsOnThePhone.test.js`, que falhou na página antiga e passa na nova). O sensor visual (Playwright) está sendo montado num ramo próprio, `chore/visual-sensor-setup`.

## [2026-11-21 08:01] session — F79 e F80 publicadas em produção
**Branch:** main
Palavras do MJRP: «Bom dia pode publicar!». O site foi publicado da `main` (`14e4f9c`) pelo `scripts/deploy-site.sh` (script principal `/assets/main-D712PA9d.js`); o servidor não mudou. Conferido em produção: a raiz serve a página de entrada com as capas fictícias; os links diretos abrem o app; com a conta aberta, `/` leva à Home nova e `/?entry` mostra a página de entrada. Não visto: a raiz como visitante num navegador, criar uma série, iPhone e Safari. Relatório: `reports/evidence/F80/2026-11-21-production-proof.md`. As capas reais em público continuam esperando a palavra dele.

## [2026-11-21 00:35] session — F79 na `main`, junto com a F80; conferido no navegador com a conta do MJRP
**Branch:** main
Merge `f3f417f` pelo trem, depois da segunda reconferência independente (`reports/audits/2026-11-21-mjrpalbumblender-v0-f79-visual-parity-recheck-2.md`: passa, 0 P0, 0 P1, 4 P2; a primeira tinha reprovado com 2 P1, consertados no ramo em `b12e751`). O conflito foi só o registro das duas aprovações no `info-arch.md`: ficaram as duas, e a página foi gerada de novo. Na `main` com as duas: 293 arquivos, 3719 testes, nenhum falhou; lint sem erro; build fechado. No navegador (prévia local, conta do MJRP): `/` leva direto à Home nova; a busca «Pink Floyd» traz a discografia do catálogo de verdade; `/?entry` mostra a página de entrada com as capas fictícias. Não provado escrevendo: criar uma série. Os P2 que ficaram viraram UAT-232, 233 e 234 (o sensor visual do projeto, P2-7, é decisão do MJRP: pede o Playwright como dependência). O gancho marcou F79, F80, S-61 e S-62 como «Done» ao fechar as tarefas; o aceite continua do MJRP. Nada publicado, nada enviado ao remoto.

## [2026-11-21 00:33] review — F79: a segunda passada da reconferência visual — passa, sem P0 e sem P1 (4 P2)
**Branch:** feat/f79-home-that-explains-itself
Os 36 pares refeitos sobre `b12e751` e olhados um a um; os fatos medidos nos 72 cenários: zero diferenças no fogo, o Syne carregado, nenhuma rolagem lateral. Fechados os achados da primeira passada: P1-1 (a lista colada em Syne 15/400 e a linha pulada sem caixa, em Syne bold), P1-2 (o mini equalizador na linha de «Saving your series…»), P2-1, P2-2, P2-6 e o corte do P2-3. Ficam P2-4, P2-5 e P2-7 (de propósito) e P2-3' (o contorno de foco e a altura da caixa colada no celular). Nenhuma regressão, nem na janela de editar a série. Nenhuma issue foi aberta no `uat.md`, por instrução do orquestrador. Relatório: `reports/audits/2026-11-21-mjrpalbumblender-v0-f79-visual-parity-recheck-2.md`; capturas: `reports/evidence/F79/recheck-2/`.

## [2026-11-21 00:26] review — F79: a segunda passada da reconferência visual começou
**Branch:** feat/f79-home-that-explains-itself
O mesmo agente juiz (que não implementou) refaz os 36 pares sobre `b12e751`, as correções dos achados da primeira passada. Relatório novo em `reports/audits/2026-11-21-mjrpalbumblender-v0-f79-visual-parity-recheck-2.md`, `verdict: running`; o da primeira passada fica como está.

## [2026-11-21 00:25] session — F79: os achados da reconferência visual corrigidos (P1-1, P1-2 e os P2 da tela)
**Branch:** feat/f79-home-that-explains-itself
Lido `reports/audits/2026-11-20-mjrpalbumblender-v0-f79-visual-parity-recheck.md` (não tocado). Corrigido, com o teste escrito antes e visto falhar (`test/components/home/HomeRecheckShapes.test.js`, mais asserções em `HomeController.bulk.test.js` e `HomePhone.dock.test.js`):
- P1-1: a regra do campo do artista alcançava as linhas da lista colada. Agora vale só para `.home-field > input`. As linhas estão em Syne 15/400 (texto 16/400 no celular). A linha pulada está em Syne 18/600, sem caixa. «Added 2 albums.» em negrito.
- P1-2: o mini equalizador fica na linha de «Saving your series…», e a barra do celular não cresce.
- P2-2: «Not saved: the connection dropped» aparece inteiro.
- P2-3: a última linha colada tem mais espaço e termina em «…».
- P2-6: o ano corre na linha do cartão, e a segunda fileira fica onde o protótipo a põe (medido: igual).
- P2-1: «Your series» com a contagem mais clara; os títulos da folha em uma linha.
Deixados de propósito: os números na fonte do sistema (P2-4) e as fichas do celular (P2-5). O P2-7 é do contrato.
Pares refeitos em `reports/evidence/F79/pairs/`, com a seção nova no relatório da prova. A suíte inteira passou pela fila: 3657 de 3657.

## [2026-11-21 00:20] session — F80 na `main`: a página de entrada passou na reconferência visual; o P2 das capas reais vira a UAT-231
**Branch:** main
Merge `afbaf31` pelo trem, depois da reconferência independente (`reports/audits/2026-11-20-mjrpalbumblender-v0-f80-visual-parity-recheck.md`: passa, 0 P0, 0 P1, 1 P2). O P2 (com as capas reais, a 393 px, o crédito do disco não quebra linha) está aberto como UAT-231; com as capas fictícias, o padrão, não acontece. A primeira tentativa de merge foi recusada pelo portão visual, como devia. A F79 teve a reconferência reprovada sem P0 (2 P1, 7 P2) e está nos consertos no ramo dela. Nada publicado, nada enviado ao remoto.

## [2026-11-21 00:11] review — F80: a reconferência visual independente passa, sem P0 e sem P1
**Branch:** feat/f80-splash-page-for-album-lovers
Um agente que não implementou a F80 comparou a página de entrada (`public/splash.html`, no Vite de desenvolvimento, com as capas reais e com as fictícias) ao Caixote v2 aprovado no fogo brando (`design/inception/splash-crate-v2.html?fire=soft`). O kit `visual_parity` rodou com uma config da rodada (Chromium e WebKit, 1280 e 393, 7 faixas, 28 registros por conjunto): 0 · 0 · 0 nos dois conjuntos. A Syne carrega (700 e 800) e os tokens são iguais. Os olhos conferiram o caixote 3D faixa por faixa, o fio lado A / lado B, «Flip the record», o fogo brando (`peak 0.72`, `low 0.28`), o movimento que para sozinho, e o protótipo e o produto iguais com menos movimento, sem WebGL e sem JavaScript. Veredito `pass`, `p0: 0`, `p1: 0`. Um P2: com as capas reais, a 393 px, o crédito do disco (`a.slot-am`) não quebra linha e a página fica com 467 px, e «Open the app» da barra de baixo sai cortado. O protótipo faz o mesmo; as fictícias (o padrão) não. Fica para o MJRP decidir se corrige antes de publicar as capas reais. A issue no `uat.md` não foi aberta, porque o commit desta passagem foi limitado ao relatório. Relatório: `reports/audits/2026-11-20-mjrpalbumblender-v0-f80-visual-parity-recheck.md`; capturas em `reports/evidence/F80/recheck/`. Não conferido: iPhone e Safari de verdade, o build de produção, a fluidez da animação.

## [2026-11-21 00:05] review — F79: a reconferência visual independente — não passa, sem P0 (2 P1, 7 P2)
**Branch:** feat/f79-home-that-explains-itself
Um agente que não implementou a F79 refez as 72 capturas sobre o código atual (`1d875bc`): os 18 estados a 1280 e a 393, o protótipo `design/inception/home-transformar-v2.html` e a Home construída, como visitante, sem gravar nada. Olhou os 36 pares e mediu fatos nos dois lados (o Syne carregado, o fogo, a tipografia, a rolagem lateral). Bate no leiaute, no texto, no fogo (um botão por estado, igual nos 36 pares), no equalizador, na base, no Undo e no depois de criar. Os dois P1: a tipografia da lista colada (as linhas em Syne 18/600 contra 15/400; a linha pulada num campo de sistema 16/400 contra Syne 18/600) e a barra do celular em «Criando» (o mini equalizador cai para outra linha e a barra cresce). A janela de editar a série não está quebrada. O kit visual não rodou: o contrato não declara `sensors.visual` (o A2). Nenhuma issue foi aberta no `uat.md`, por instrução do orquestrador. Relatório: `reports/audits/2026-11-20-mjrpalbumblender-v0-f79-visual-parity-recheck.md`; capturas: `reports/evidence/F79/recheck/`.

## [2026-11-20 23:51] review — F80: a reconferência visual independente começou
**Branch:** feat/f80-splash-page-for-album-lovers
Um agente que não implementou a F80 começa a reconferência visual da página de entrada contra o protótipo aprovado (`design/inception/splash-crate-v2.html`, fogo brando): o relatório `reports/audits/2026-11-20-mjrpalbumblender-v0-f80-visual-parity-recheck.md` nasce com `verdict: running`, para o quadro mostrar a F80 em avaliação.

## [2026-11-20 23:51] review — F79: a reconferência visual independente começou
**Branch:** feat/f79-home-that-explains-itself
Um agente que não implementou a F79 começa a reconferência visual da Home contra `design/inception/home-transformar-v2.html` (18 estados, 1280 e 393). O relatório nasce em `reports/audits/2026-11-20-mjrpalbumblender-v0-f79-visual-parity-recheck.md` com `verdict: running`; o veredito sobrescreve o mesmo arquivo.

## [2026-11-20 23:48] session — F79: a prova no navegador, ao lado do protótipo aprovado; os ajustes que ela mostrou
**Branch:** feat/f79-home-that-explains-itself
Os 18 estados capturados a 1280 e a 393, o protótipo e a Home construída lado a lado (`reports/evidence/F79/2026-11-20-home-browser-proof.md`, `pairs/`, `shots/`, `shoot.sh`), num servidor local do ramo, como visitante; o catálogo respondeu com a busca capturada pelo protótipo e a série nunca foi gravada (a escrita trocada na página): nada no Firestore. Criar de verdade está provado por teste, não no navegador. Ajustes que a comparação mostrou: a linha colada sem negrito, as linhas mais baixas no celular, a caixa da lista crescendo no celular, o campo do artista com a altura da caixa (alvo de 44 px), a falha ao gravar no celular com o texto do protótipo («Not saved: the connection dropped», só quando é de rede), a seta ↓ (o conjunto de ícones só tem ↑: girada). TASK-10 e TASK-11 fechadas: a suíte inteira, o lint e o build pelo doctor; o doctor segue vermelho só pelo que já era (I3, I5, I6, F1) e pelo A2, que o registro da aprovação acendeu (sem `sensors.visual` no contrato).

## [2026-11-20 23:47] session — F80 construída: a página de entrada na raiz, só para quem não entrou com conta
**Branch:** feat/f80-splash-page-for-album-lovers
A página do protótipo aprovado (Caixote v2, fogo brando) virou `public/splash.html` + `public/splash/` (a página viva, o caixote 3D com three.js 0.185.0 do CDN, a decisão da raiz no `<head>`, as capas num arquivo com dois conjuntos). O build gera `dist/index.html` = a página e `dist/app.html` = o app (plugin `scripts/entryPage.mjs`); o `firebase.json` reescreve o resto para `/app.html` (e põe a raiz sem cache); o `deploy-site.sh` confere as duas páginas; `/home?signin` abre a janela de entrar (`components/navigation/signInFromLink.js`, uma chamada no `app.js`). O roteador, a Home e os arquivos da F79 não mudaram. Capas: padrão fictício; `VITE_SPLASH_COVERS=real` põe as reais, do CDN da Apple — publicar com elas é decisão do MJRP. Provado: suíte (3663 testes), lint e build verdes; no emulador do Hosting a raiz é a página e os endereços do app abrem o app; no navegador, sem conta a página, «Open the app» chega a `/home`, um endereço fundo abre, uma conta gravada no navegador vai a `/home` sem pintar a página, o celular sem three.js; capturas ao lado do protótipo e medidas em `reports/evidence/F80/2026-11-20-entry-page-proof.md`. Não conferido: iPhone, Safari, a primeira pintura, uma conta de verdade, o Hosting no ar.

## [2026-11-20 23:38] session — F79 construída: a Home «Transformar v2» no computador e no celular
**Branch:** feat/f79-home-that-explains-itself
A Home nova (TASK-01 a TASK-09): um palco só (título, frase da série, campo único para artista ou lista, «Search», equalizador com três estados), a discografia com fichas («Compendiums», «Other» no lugar de «?», nas duas telas do picker) e «Add all», as capas numeradas, a base da série presa embaixo (nome sugerido pelos artistas, contagem, «Edit order» com o painel ↑ ↓ ✕, Undo de 8 s, criar, criada com «Blend it now» e «Open the series», falhou), o aviso de visitante; no celular a base é a `.phone-action-bar` e a série abre na Folha `full`. Saem `HomePhoneChosen.js`, `StagingAreaRenderer.js` e o arrastar (Sortable) da Home; a edição de série segue com a mesma peça. Regras puras em `models/homeSeries.js` e `models/homePaste.js`; componentes em `components/home/` (`HomeDock`, `HomePasteList`, `HomeEqualizer`).
Suíte inteira pela fila: 3648 de 3648 (287 arquivos); lint sem erro (48 avisos, os de antes); build ok. Docs: `behavior.md` § Tela inicial reescrita (`^home-album-added-to-stack`: clicar de novo tira, com Undo; `^home-series-default-name`: nunca «New Album Series» em silêncio), o manual (00, 10, 14, 16, 21, 31, checklist), `design-system.md` (o que a construção acrescentou, decidido pelo agente — revisável), `info-arch.md` (nota da construção) e a página gerada.
Decidido pelo agente — revisável: a lista colada editável linha a linha; o fechar da Folha do celular é o dela (✕, «Done» para o leitor de tela); «the connection dropped» só quando a falha é de rede. O doctor segue vermelho por erros de antes (I3 de links de arquivo) e por dois que esta feature traz ou toca: A2 (há referência visual aprovada e o contrato não declara `sensors.visual`) e F1 (o `## Now` do MEMORY é anterior a este log; não é deste ramo).

## [2026-11-20 22:37] decision — F80: o registro da aprovação do Caixote v2 e o SDD da página de entrada
**Branch:** feat/f80-splash-page-for-album-lovers
Registro da aprovação no `info-arch.md` § Protótipos aprovados: as palavras do MJRP («aprovado a home v2, fogo vivo na página de entrada, ficou sensacional! bora implementar» e «fogo brando na verdade»), lidas como a página «Caixote v2» no fogo brando, nas duas larguras, com os nove estados `^splash-v2-*` em `shows::`; as ressalvas abertas (capas reais em público, texto em inglês, texto preto no botão, onde a página mora). `design-system.md`: os padrões da v2 marcados aprovados com o protótipo, só nesta página. `spec.md`, `plan.md` e `tasks.md` da F80 escritos do protótipo (`**Approved**`: decidido pelo agente — revisável, dispensa de 2026-11-19); a S-62 com regras, critérios e `points_to` (status `In progress`). Novos estados sem tela no `behavior.md` § A raiz do site e a página de entrada (F80). Decidido pelo agente — revisável: a raiz só para quem não entrou com conta (o convidado vê a página), dois HTML no build com a troca de nome só no `dist/`, `/?entry` mostra a página a qualquer um, three.js do CDN na versão do protótipo, capas num arquivo com o interruptor `VITE_SPLASH_COVERS` (padrão fictício), nenhum evento novo de medição, o link «Privacy» fora.

## [2026-11-20 22:31] decision — F79: o registro da aprovação da Home «Transformar v2»; a S-61 pronta para construir; spec, plan e tasks
**Branch:** feat/f79-home-that-explains-itself
Palavras do MJRP (2026-11-20, por volta das 22:15): «aprovado a home v2, fogo vivo na página de entrada, ficou sensacional! bora implementar». Registrado em `docs/specs/info-arch.md` § Protótipos aprovados: o protótipo `design/inception/home-transformar-v2.html`, nas duas larguras, com os 18 estados em `shows::`; a parte do fogo é da F80. A crítica da rodada 2 fechada (`closed_by:` aponta a aprovação); «· Aprovada» no comparador local (o Artifact publicado não foi republicado). `design-system.md`: os padrões da rodada 2 valem para a Home.
O que ele não respondeu, decidido pelo agente — revisável (dispensa de 2026-11-19): a cor A, os padrões D1 a D9, «Compendiums», o texto sobre o fogo como a v2 mostra; o texto em inglês é proposta do agente. A S-61 passa a «Ready» com os critérios apontando para os estados julgados; `spec.md`, `plan.md` e `tasks.md` da F79 escritos a partir do protótipo (o «Approved» deles é «decidido pelo agente — revisável», não aprovação do MJRP).

## [2026-11-20 22:22] session — F79 e F80: a construção começa, dois agentes em paralelo
**Branch:** main
Um agente (Opus 5.5) por feature, cada um no seu worktree: `feat/f79-home-that-explains-itself` e `feat/f80-splash-page-for-album-lovers`. Cada um grava o registro da aprovação, escreve spec, plano e tarefas a partir do protótipo aprovado, constrói com o teste primeiro e prova no navegador; o orquestrador junta na `main`. A F80 não toca os arquivos da Home; a F79 não toca a entrada nem as rotas. O `MEMORY.md ## Now` diz o mesmo.

## [2026-11-20 22:20] decision — F80: o fogo da página de entrada é o brando, não o vivo
**Branch:** main
Palavras do MJRP, logo depois da aprovação: «fogo brando na verdade». Corrige a entrada anterior: a página de entrada «Caixote v2» é construída na prévia «fogo brando» (`?fire=soft`, o padrão do protótipo). O resto da entrada anterior vale.

## [2026-11-20 22:20] decision — F79 e F80 aprovadas para construir: a Home «Transformar v2» e a página de entrada «Caixote v2» com o fogo vivo
**Branch:** main
Palavras do MJRP (2026-11-20, por volta das 22:15): «aprovado a home v2, fogo vivo na página de entrada, ficou sensacional! bora implementar». As duas estão na «Priorizada» (`priority.md`: 1. F79, 2. F80).
Como o agente leu: a Home «Transformar v2» (`design/inception/home-transformar-v2.html`, 18 estados) está aprovada como o protótipo julgado da F79; a página de entrada é o «Caixote v2» (`design/inception/splash-crate-v2.html`) na prévia «fogo vivo» (`?fire=bright`), aprovada para construir.
O que ele não respondeu, decidido pelo agente — revisável: F79 com a cor A (o degradê declarado `#f97316 → #dc2626`, sem a terceira parada) e os padrões D1 a D9 como a v2 aprovada mostra, «Compendiums» mantido; o texto sobre o botão de fogo fica como cada protótipo aprovado mostra; a F80 mora na raiz só para quem não entrou, como página estática lida sem script. As capas reais em público continuam uma decisão dele (os termos da Apple): a página é construída com as capas num arquivo de dados trocável, e a publicação em produção com capas reais espera a palavra dele. O texto em inglês das duas telas é proposta do agente, não copy deck.

## [2026-11-20 20:28] session — as rodadas 2 da F79 e da F80 na `main`; a sugestão das capas reais corrigida
**Branch:** main
Na `main` (`f08348a`): a Home «Transformar v2» (18 estados, reordenar e remover, o par de cor A/B; comparador https://claude.ai/artifact/AsiVV2i3595LqpLEadm61h) e a página de entrada «Caixote v2» (o caixote como palco, a rolagem por faixas com o fio de equalizador, a brasa como luz, 14 capas reais; comparador https://claude.ai/artifact/5hDJr8qToYkAEsgCrfUK8e). O merge da F80 teve conflito só no `info-arch.html` gerado; a página foi gerada de novo do `info-arch.md` (110 estados), sem marcas de conflito. **Correção ao que o agente sugeriu ao MJRP:** «capas do Apple Music com crédito e link» provavelmente não basta numa página pública: o contrato de desenvolvedor da Apple só permite a arte junto de reprodução ou gerenciamento de playlists, e a revisão de apps pede autorização dos donos dos direitos para divulgação (fontes na proposta da F80). Dito ao MJRP; a decisão dele de usar capas reais vale para o protótipo privado e fica «a confirmar antes de publicar». Esperam o MJRP: a aprovação das duas v2, a cor, o texto sobre o fogo (uma decisão para as duas telas), fogo brando ou vivo.

## [2026-11-20 20:15] session — F80 rodada 2: o Caixote v2, com o fio e o fogo, e capas reais
**Branch:** wip/f80-splash-design-round-2
Protótipo `design/inception/splash-crate-v2.html` (o caixote 3D é o palco, a rolagem é o disco tocando com o fio do Lado A, lado B, o fogo da Brasa é a luz; 14 capas reais do Apple Music, 211 KB), prévia do fogo brando × vivo, comparador republicado no mesmo Artifact (https://claude.ai/artifact/5hDJr8qToYkAEsgCrfUK8e), `proposal.md` § Rodada 2, `info-arch.md` (estados `^splash-v2-*`, SPL-15 a SPL-19), padrões pendentes no `design-system.md`, wireframes v2.
Crítica separada: passa, 0 P0, 4 P1 corrigidos, 12 P2. Os termos da Apple (DPLA 3.3.6(D), App Review 4.5.2(ii)) só preveem a capa junto da reprodução e pedem autorização para marketing: a confirmar antes de publicar. Nada no remoto.

## [2026-11-20 19:54] session — F79, rodada 2 da Home: Transformar v2 com todos os estados, a prévia de cor e a crítica
**Branch:** wip/f79-home-design-round-2
`design/inception/home-transformar-v2.html` (18 estados, 1280 e 393; a v1 intacta), a prévia A/B da cor `#fdba74` em `design/proposals/f79-home/previews/`, o comparador republicado no mesmo Artifact (abre em v2 ao lado da v1; Consolidar e Elevar dobrados como decididos; a Referência num botão); `proposal.md` § Rodada 2 (as perguntas respondidas pelo código: a ordem dos álbuns pesa no Blend, `MJRPBalancedCascadeAlgorithm.js` linhas 77, 134, 141; os defaults D1–D9 marcados na tela), `info-arch.md` § Home com os 18 estados e onze IDs novos, `design-system.md` com os padrões pendentes, wireframes v2.
A crítica separada passou (0 P0, 6 P1, 13 P2): os seis P1 foram consertados e recapturados; o que fica e as decisões do MJRP (a cor, os defaults, o texto sobre o fogo) estão na proposta. Nada de código do produto; nada enviado ao remoto.

## [2026-11-20 19:49] decision — F80: capas reais do Apple Music na página de entrada; a direção é o Caixote com o fio do Lado A, lado B e a brasa
**Branch:** main
Palavras do MJRP: «ok sigamos sua sugestao para as capas e vamos fazer um prototipo da transformar mas adicionando o slider da elevar e a brasa de consolidar, como vc faria pra harmonizar e utilizar todos esses elementos visuais?». Decidido por ele: (1) capas reais, pela sugestão do agente: as do Apple Music, que o app já usa, com crédito e link, e os termos da Apple conferidos antes de a página ser pública; (2) a direção da página de entrada é o **Caixote** (o 3D de capas), somando o elemento de rolagem do **Lado A, lado B** (a página que anda de faixa em faixa, com o fio de equalizador) e o fogo da **Brasa**. Lido pelo agente: «transformar», «elevar» e «consolidar» são os níveis das três direções da F80 (Caixote, Lado A lado B, Brasa); «slider» é a progressão por rolagem do Lado A, lado B. Segue a rodada 2 da F80, em versão nova.

## [2026-11-20 19:47] review — mjrp-critiquing-ux-ui: F79 Home, Transformar v2 · passa (0 P0), 6 P1 no próximo corte
**Branch:** wip/f79-home-design-round-2
- Relatório: reports/audits/2026-11-20-mjrpalbumblender-v0-f79-home-r2-ux-audit.md · P0 0 · P1 6 · P2 13 · quem julgou: agente separado.
- Os seis P1 foram consertados na mesma rodada (proposta § Rodada 2, «A crítica da rodada 2»); o relatório fica `open` até o MJRP aprovar a v2.

## [2026-11-20 19:19] decision — F79: o MJRP escolhe o nível Transformar para a Home
**Branch:** main
Palavras dele, depois de ver o comparador: «home 3 niveis transformar». Escolha de direção entre os três níveis da rodada 1 (Consolidar, Elevar, Transformar); a recomendação do agente era Elevar, e a decisão é dele. Não é ainda a aprovação do protótipo: o Transformar tem pontos abertos pela crítica (reordenar e remover álbuns, a cor `#fdba74`) e as perguntas da proposta sem resposta. Segue a rodada 2, só do Transformar, em versão nova. Sobre a página de entrada (F80), ele perguntou se as capas serão reais na construção; respondido na conversa, sem decisão registrada ainda.

## [2026-11-20 19:16] session — na `main`: o primeiro build do app no simulador e as duas rodadas de desenho (F79, F80); `## Now` atualizado
**Branch:** main
Juntados, um por vez, pela fila da máquina: `feat/f78-first-simulator-run` (conferido antes: 3601 testes na raiz, 48 no app, lint, build, empacotamento iOS e Android), `wip/f79-home-design-round` e `wip/f80-splash-design-round`. O terceiro teve conflito no `info-arch.md` (as duas rodadas acrescentaram seções): resolvido ficando com as duas, a página de leitura gerada de novo (90 estados), conferido sem marcas de conflito antes do commit. Decisões do dia registradas acima neste log: uma tarefa pesada por vez no V0 (pedido do orquestrador do harness; a carga chegou a 200); as sessões da F46 e da F48 arquivadas; a análise da leitura lenta do harness entregue ao orquestrador (UAT-630 de lá). Pendente de dono: a F66 não está em `priority.md`, e o fecho dela ficou num stash.

## [2026-11-20 18:43] session — F80, rodada 1 de desenho da página de entrada: três direções no comparador
**Branch:** feat/f80-splash-design-round
Três protótipos no eixo «quanto 3D, e de onde vem a profundidade» (`design/inception/splash-ember-v1.html`, `splash-sides-v1.html`, `splash-crate-v1.html`), com a pesquisa (`design/references/f80-splash/references.md`), a proposta de copy, a proposta (`design/proposals/f80-splash/proposal.md`, recomenda o Lado A, lado B), o comparador como Artifact (https://claude.ai/artifact/5hDJr8qToYkAEsgCrfUK8e), wireframes, `info-arch.md` (estados `^splash-*`, inventário SPL-01 a SPL-14) e padrões novos no `design-system.md`, pendentes de aprovação do MJRP.
A medição final em lote não rodou (a fila da máquina não andou em uma hora); o peso foi medido no painel do navegador. Nada enviado ao remoto.

## [2026-11-20 18:43] review — crítica de UX independente da F80, rodada 1: sem P0, 8 P1, 17 P2
**Branch:** feat/f80-splash-design-round
Relatório: `reports/audits/2026-11-20-mjrpalbumblender-v0-f80-splash-round1-ux-audit.md` (agente separado, só a skill, os protótipos e os documentos do produto). Os 8 P1 e 7 P2 baratos foram corrigidos na mesma versão, anotados no fim do relatório.
Fica para o MJRP: S2 (fogo em movimento no Lado A, lado B?) e nove P2.

## [2026-11-20 18:38] session — F79 a Home: rodada 1 de desenho, três níveis (Consolidar, Elevar, Transformar) ao lado da tela de hoje
**Branch:** wip/f79-home-design-round
Protótipos feitos da Home real capturada no site local (busca «Pink Floyd»), sete estados, 1280 e 393 px: `design/inception/home-consolidar-v1.html`, `-elevar-v1.html`, `-transformar-v1.html`; a Referência, o comparador (Artifact privado https://claude.ai/artifact/AsiVV2i3595LqpLEadm61h), a proposta com o diagnóstico medido e as sete perguntas, e o gerador em `design/proposals/f79-home/`; o texto da tela em `design/proposals/2026-11-20-home-copy-proposal.md` (juiz verde). Recomendado: Elevar. Descrição na mesma rodada: `info-arch.md` § A Home (F79) com sete estados e o inventário HOME-01 a HOME-19, wireframes dos três níveis, padrões novos pendentes em `design-system.md`.
O ramo pedido era `feat/f79-home-design-round`; ficou `wip/` para o board não dar a F79 como começada antes de o MJRP priorizá-la. Nenhum código do produto tocado; nada enviado ao remoto.

## [2026-11-20 18:38] review — mjrp-critiquing-ux-ui: F79 a Home, três níveis · passa para a escolha (0 P0)
**Branch:** wip/f79-home-design-round
Relatório: `reports/audits/2026-11-20-mjrpalbumblender-v0-f79-home-ux-audit.md` · P0 0 · P1 8 · P2 9 · quem julgou: agente separado.
Consertados na rodada: o contraste do painel da grade (Consolidar), as capas da barra do celular (Elevar), «Tap» no celular, os wireframes; o que fica está em `design/proposals/f79-home/proposal.md` § 6.

## [2026-11-20 17:38] session — F66: registro do que já estava resolvido, para o fecho
**Branch:** main
O MJRP, em 2026-11-20: «a f66 creio que pode fechar, pq resolvemos ontem a questao do token da discogs, apaguei o antigo e colocamos no novo, priorizei apenas pra poder mover para o fechamento». Conferido: os dois scripts com o token saíram do repositório na F65 (`f9d1abd`); `test/security/noSecretsInRepo.test.js` passa (11 testes); o token novo está no secret `discogs-token`. Não conferido pelo agente: que o token antigo responde «não autorizado» (testar exigiria ler o token do histórico do git). O spec, o plan e as tasks da F66 foram preenchidos com isso; evidência em `reports/evidence/F66/`. O token antigo continua no histórico do git, morto. O aceite é do MJRP.

## [2026-11-20 17:29] session — F78: a primeira vez no simulador — evidência, manual, arch, plano e tarefas
**Branch:** feat/f78-first-simulator-run
O app roda no «iPhone 17 Pro» (iOS 26.5, Xcode 27.2) e o autoteste deu 3343 de 3343 no Hermes do app, com ids v4 do expo-crypto: relatório `reports/evidence/F78/2026-11-20-first-simulator-run.md`, com as capturas e o texto do log do simulador e do Metro; `arch.md` («Os dois builds nativos»), `plan.md` (metade da TASK-07: o simulador; falta o Android), um subitem feito na TASK-23, o manual § 2.6 (pré-requisitos, `npm run app:ios:demo`, o autoteste sem toque).
O script ganhou `--no-clean` (o `expo prebuild` do SDK 58 apaga `ios/` por padrão), o conserto do `«$DEVICE»` e `nice -n 10 -jobs 4`; a terceira execução do script foi parada no meio da compilação pela regra de carga da máquina (um trabalho pesado por vez): o script inteiro, depois dos consertos, não foi conferido de ponta a ponta. Instalado: CocoaPods 1.17.0 por Homebrew.

## [2026-11-20 17:12] decision — identidade visual: o fogo e os equalizadores são do site, e o design system é o piso
**Branch:** main
Palavras do MJRP, ao pedir as propostas da Home (F79) e da página de entrada (F80): «veja que o elemento do fogo, de equalizadores, fazem parte da identidade do site, busquem respeitar o design system num minimo pelo menos». Vale para as duas rodadas de desenho: o fogo (o logotipo `public/assets/TheAlbumBlender.png`, o degradê «flame» `#f97316 → #dc2626`) e os equalizadores são elementos da identidade, a manter e a usar; nenhuma proposta, nem a mais ousada, sai do `docs/specs/design-system.md` sem dizer o que muda e por quê.

## [2026-11-20 17:10] decision — duas features de desenho pedidas pelo MJRP: a Home que se explica (F79) e a página de entrada (F80)
**Branch:** main
Palavras dele: «vamos utilizar as skills de UI e UX e de writing copy para melhorar essa seção inicial do site … Gostaria de ver uma proposta consolidar, elevar, transformar, considerando copy, elementos de UI e UX e usabilidade. Tb gostaria de prototipo de uma home splash page para o site, com design moderno imersivo com animações, 3d...tudo relacionado a paixao por ouvir e apreciar ALBUNS completos de musica.» Criadas na `main`, em esboço: S-61 e F79 (EP-01), S-62 e F80 (EP-10; colocação decidida pelo agente, revisável). As duas começam por rodada de desenho com protótipos; nenhum ramo de código antes da escolha dele e da priorização.

## [2026-11-20 17:09] session — F78: o build de demonstração do app no simulador do iPhone
**Branch:** feat/f78-first-simulator-run
O app sai do Expo sem os pacotes nativos do Firebase, do Google e da Apple quando `EXPO_PUBLIC_DATA_MODE` não é `firebase` (`app/nativeBuild.js`, `app.config.js` com os config plugins e o `exclude` do Podfile, `react-native.config.js`), sem credencial falsa; `app/ios/` é gerado, não commitado; `npm run app:ios:demo` gera, constrói com o `xcodebuild`, instala e abre no simulador. Para rodar sem toque, só no modo de demonstração: `-demoSignIn`/`-demoRoute` na linha de lançamento, `albumblender://sign-in?as=apple`, `albumblender://diagnostics?run=1`; o autoteste escreve a linha `[golden-self-test]` com a contagem, o motor e um id de amostra.
Consertos vistos no simulador: `anchor` no lugar de `initialRouteName` e `backBehavior="initialRoute"` nas abas (dois avisos do Expo Router 58), a barra do autoteste sem a área segura dentro da folha do iOS, o aviso de desenvolvimento do React Native sobre `onAnimatedValueUpdate` silenciado. App: 48 testes, `app:check` verde; raiz: 3601 testes (o de tempo da inventário passou sozinho), lint e build verdes.

## [2026-11-20 16:40] session — os termos de uso do BestEverAlbums, trazidos pelo MJRP, entram no estudo e no rascunho do e-mail
**Branch:** main
A dona do site é a Amulet Solutions (Stamford, Reino Unido); os termos dizem «for your general information and use only», proíbem a reprodução sem permissão e são regidos pela lei do Reino Unido, que tem direito sobre bases de dados. Leitura do agente, não de advogado: o uso pessoal de hoje é zona cinzenta; mostrar as notas num app público pede autorização por escrito; a extração repetida por álbum é o risco legal mais concreto do estudo; eles são afiliados da Amazon, então o app disputaria a mesma receita. O estudo (§ 2.2) e o rascunho do e-mail foram atualizados: o destinatário passa a ser a página de contato, o texto cita os termos e oferece divisão de receita.

## [2026-11-20 16:01] session — F78: o esqueleto do app na `main`; a constituição v2.0.0 em vigor
**Branch:** main
`app/` existe: Expo SDK 58, React Native 0.88.1, TypeScript estrito, cinco abas (quatro dizem «Not in the app yet»), a lista de séries lida pelos repositórios do núcleo, a tela de entrar atrás de uma porta, o autoteste do núcleo (3.343 de 3.343 no Jest), a medição pela lista de eventos compartilhada. Conferido pelo integrador: `npm run app:check` (tipos, 44 testes, lint, empacotamento para iOS e Android, varredura de segredos) e a raiz (3601 testes, lint, build). O site foi publicado de novo porque a ordem das séries passou a vir de `shared/seriesOrder.js`: no app local, conta do MJRP, as séries seguem em «Newest» («Pitty hits», «Trip Hop Vol.1»). **Nada do app rodou em simulador nem em aparelho**: a licença do Xcode não foi aceita. Não provados: o Firebase nativo, entrar com Apple e Google, o gerador de identificadores no aparelho, as telas. O ADR-0022 segue «Proposed» até o commit carimbado pelo MJRP.

## [2026-11-20 15:55] session — F78 esqueleto do app: documentos — tarefas, plano, arch, pilha e manual
**Branch:** feat/f78-app-skeleton
`tasks.md`: a TASK-24 feita; o que o esqueleto fez das TASK-19, 20, 22 e 23 como itens próprios, com o que falta (nenhuma tarefa de aparelho marcada); a linha do `tech-stack.md` feita. `plan.md` § Technical Design: os módulos do app e o que cada um prova aqui; `arch.md`: a seção de `app/` (estrutura, as três portas, o não provado); `tech-stack.md`: as linhas do app, cada uma citando o ADR-0022.
`docs/manual/00_Deployment_and_Setup.md` § 2.6: as checagens do app (`npm run app:check`) e os dois comandos que só o MJRP roda no Mac (aceitar a licença do Xcode, baixar o simulador do iOS).

## [2026-11-20 15:53] session — F78 esqueleto do app: o autoteste do corpo dourado e os sensores do app
**Branch:** feat/f78-app-skeleton
O autoteste (REQ-16): `app/src/selftest/goldenSelfTest.ts` roda o corpo dourado no motor do app, com o id do expo-crypto, e compara cada caso com o índice de referência commitado (`reference/cases.tsv`, 0,2 MB, empacotado como texto) pelo sha256 de cada linha, em TypeScript puro; no Jest, 3343 de 3343 iguais. A tela escondida (toque longo no título de Albums, ou `albumblender://diagnostics`) mostra «N of N match»; o `expo export` empacota tudo para iOS e Android (3,47 e 3,46 MB de bytecode Hermes).
Sensores: `appAndSiteApart` lê todo arquivo do app (nenhum é pulado), segue o que o app alcança fora de `app/` e só aceita chegar a `public/` pelo autoteste, pelo executor do corpo, nas pastas das regras; `noSecretsInTheApp` (novo) procura nomes e formas de chave no código e nos pacotes do `expo export` (`scripts/app-bundle-scan.mjs`, também no `check` do app); cada um com o caso que quebra de propósito. Testes das telas no app: 44 ao todo.

## [2026-11-20 15:52] session — F78 esqueleto do app: as três portas (dados, conta, uso) e as telas
**Branch:** feat/f78-app-skeleton
A costura dos dados: a interface da store em `app/src/data/store.ts` e duas ligações, a em memória (testes e modo de demonstração, semeada com álbuns públicos de catálogo) e a do React Native Firebase (`firebaseStore.ts`, não provada, o único arquivo que importa o pacote nativo); os mesmos repositórios de `shared/data/` leem as séries, e `shared/seriesSummary.js` diz nome, contagem e capas. A conta é uma porta com o falso e a ligação nativa (Apple, Google, Firebase Auth), não provada; o uso passa pela lista fechada de `shared/usageEvents.js`, com o desligado, o em memória e o PostHog (só com chave, não provado).
As telas nativas: a barra de baixo com os cinco destinos (os quatro não feitos dizem «Not in the app yet»), Albums com carregando, lista, vazio e falha com «Try again», e Entrar com os estados do REQ-12; testes da store em memória, da lista de séries e do uso (16 no app até aqui; os das telas entram com o autoteste).

## [2026-11-20 15:52] session — F78 esqueleto do app: app/ nasce (Expo SDK 58, React Native 0.88.1, TypeScript estrito) e a ligação da plataforma
**Branch:** feat/f78-app-skeleton
`app/` é espaço de trabalho da raiz ao lado de `shared/` (`@album-blender/app`), com Expo Router, Jest 30 com jest-expo e RNTL 14, ESLint do Expo e os scripts `typecheck`, `test`, `lint`, `bundle:ios`, `bundle:android`, `check`; a raiz ganha `npm run app:check`, um React só (`overrides`), e o ESLint da raiz deixa `app/` para o do app.
`app/src/platform/wiring.ts` entrega ao `newId()` do núcleo o `randomUUID` do expo-crypto, uma vez; o teste prova que o núcleo recusa antes e funciona depois, e que os dois nomes do núcleo (`@album-blender/shared`, `@shared`) são um módulo só. O grafo de módulos vivos passa a contar o que o app importa do núcleo.

## [2026-11-20 15:51] session — F78 esqueleto do app: a ordem «mais nova primeiro» passa ao núcleo
**Branch:** feat/f78-app-skeleton
A ordem padrão das séries (UAT-227, «Newest») sai do `SeriesController` do site para `shared/seriesOrder.js` (`DEFAULT_SERIES_ORDER`, `compareByCreation`, `newestFirst`), que lê a data de criação como Date, número ou Timestamp do Firestore: uma regra para o site e o app.
O site usa a mesma comparação nos modos «recent»; a função do controller caiu de 20 para 16 de complexidade e a lista baixou junto; `test/shared/seriesOrder.test.js` roda com jsdom e em Node puro.

## [2026-11-20 15:26] session — ADR-0022 apoiado na constituição v2.0.0; o Accepted fica para o commit do MJRP
**Branch:** feat/f78-constitution-v2-in-force
O ADR-0022 diz que o app é TypeScript e que se apoia na constituição v2.0.0; os Deciders registram o aceite dele, «1.aceito pra essa iteração», para esta iteração. O `Status` segue `Proposed`: o ADR nasceu na via do MJRP (`**Acceptance**: MJRP`), e pela CC-ADR-0028 vira `Accepted` só no commit dele com `Human-accepted: adr:ADR-0022`, sem assinatura de agente; o agente não carimba.
Não há índice de ADRs em `docs/decisions/`. Pendente do MJRP: o commit que vira o status, pelo comando da tela dele.

## [2026-11-20 15:24] session — a constituição v2.0.0 em vigor, para esta iteração
**Branch:** feat/f78-constitution-v2-in-force
`docs/specs/constitution.md` passa à v2.0.0 (texto da proposta, sem as partes só de proposta), com o aceite do MJRP «1.aceito pra essa iteração» no cabeçalho e no rodapé; a v1.0.0 inteira em `_archive/2026-11-20-constitution-v1/docs/specs/constitution.md` (o `_safe.py retire` recusa arquivo versionado: sai por commit); `docs/CONSTITUTION.md` marcada substituída só no título; o espelho `.specify/memory/` regenerado da fonte (não há script: feito à mão, igual à fonte, como o doctor I5 confere).
Citações vivas trocadas pela v2 (`tech-stack.md` com as linhas do app, `arch.md` com o acesso ao servidor como o código é desde a F59, `data-model.md`, `.agent/`, `DEVELOPER.md`); F78: a tarefa do aceite marcada, a decisão (6) e o Constitution Check do plano; a pergunta do núcleo em TypeScript segue aberta. Grafo de requisitos igual ao de antes (1 achado, o do ADR-0020).

## [2026-11-20 15:16] decision — o MJRP aceita a constituição v2.0.0 e o ADR-0022, para esta iteração
**Branch:** main
Em resposta ao item «1. Ler e aceitar a constituição v2.0.0 e o ADR-0022», ele escreveu: «1.aceito pra essa iteração». O aceite vale para os dois textos como estão em `design/proposals/f78-app-architecture/constitution-v2.md` e `docs/decisions/0022-app-in-react-native-over-a-shared-core.md`, com a ressalva dele: para esta iteração, isto é, revisável na próxima. A seguir, o que a proposta lista em «O que muda no dia em que for aceita»: a v2.0.0 entra em `docs/specs/constitution.md`, a v1.0.0 vai para o arquivo, as citações vivas são atualizadas e o ADR-0022 passa a aceito.

## [2026-11-20 15:13] session — F78, Ref-A em produção: os seis repositórios no núcleo compartilhado
**Branch:** main
Site publicado da `main`. Os repositórios (Base, Series, Playlist, Inventory, UserRanking, SpotifyEnrichment) vivem em `shared/data/` e recebem o Firestore por injeção; `BaseRepository.save` grava a maior entre a versão de quem escreve e a que leu. Prova de que nada mudou: a sequência de operações gravada na `main` antes da mudança é a mesma depois (`writeSequence.test.js`). Provado no app local, conta do MJRP: 40 séries, o selo «My ranking», 51 lotes, 219 álbuns; uma gravação reversível (o status de «Group Therapy» de Wishlist para Not Owned e de volta), conferida depois de recarregar: 160 / 35 / 24 como antes, `_schemaVersion` 1. Suíte 3575. **Não publicado:** `firestore.rules` com a regra que recusa baixar a versão; a publicação é do MJRP (`firebase deploy --only firestore:rules`), e a regra só foi conferida como texto (sem emulador nesta máquina). Não provado logado: criar, renomear e apagar série; gravar e editar lote; gravar ranking.

## [2026-11-20 15:09] session — F78 Ref-A: documentos — tarefas, plano, arch e data-model
**Branch:** feat/f78-ref-a-repositories-in-the-core
TASK-14 e TASK-15 marcadas; a TASK-16 tem a regra escrita e espera a publicação do MJRP; o que mexe na forma de gravar (só leitura acima da versão, transação, os casos abertos de convivência) foi para a TASK-17 (Ref-B). `plan.md` § Technical Design: o que a Ref-A construiu e os casos abertos; `arch.md`: «Os repositórios no núcleo: a store e a versão»; `data-model.md`: `_schemaVersion` nunca desce, e onde vale.
Conferido no navegador (porta 5199, sem entrar com conta): o site sobe sem erro no console e sem chamada ao Firestore na tela inicial; a sessão anônima que o próprio site abre ao carregar ficou no Firebase Auth. Suíte 274 arquivos, 3.575 testes; lint e build verdes; corpo dourado 3.343 de 3.343 no Node.

## [2026-11-20 15:05] session — F78 convivência: `firestore.rules` recusa a atualização que rebaixe `_schemaVersion` (não publicado)
**Branch:** feat/f78-ref-a-repositories-in-the-core
Nos quatro caminhos que os repositórios gravam (curator: séries e playlists; inventory; albumRankings; spotify_enrichment), `update` passa a pedir `keepsSchemaVersion()` (a versão gravada ≥ a guardada; ausente conta 0); ler, criar e apagar ficam como estavam; os caminhos legados (`users/{uid}/series/…`, `/albums`), onde há documentos antigos com versão 2, não mudam. Nenhum escritor de hoje é recusado: todos gravam 1 ou não tocam no campo.
Provado só pelo texto (`test/security/firestoreRules.test.js`, 9 casos): esta máquina não tem Java para o emulador. Publicar é do MJRP (`firebase deploy --only firestore:rules`); nada foi publicado.

## [2026-11-20 15:04] session — F78 convivência: `_schemaVersion` nunca desce no caminho de gravação, e `oldWriterKeepsNewFields` (REQ-10)
**Branch:** feat/f78-ref-a-repositories-in-the-core
`BaseRepository.save` (o único caminho que carimba a versão num documento que pode existir: playlists e o cache do Spotify) grava o maior entre a versão de quem escreve e a do documento como ele o leu (`shared/data/schemaVersion.js`); `update`, `updateMany`, `saveAlbumFacts` e o ranking não tocam nela. Visto falhar antes: o app «velho» renomeando uma playlist do «novo» baixava 2 para 1.
`test/architecture/oldWriterKeepsNewFields.test.js`: séries, playlists, inventário, ranking e Spotify; o campo desconhecido sobrevive na raiz e dentro de `albumQueries`/`tracks`. O Firestore falso passou a ler segmentos e campos com ponto como o SDK (só os documentos do inventário mudaram no `write-sequence.json`; as chamadas, não). Casos abertos para a Ref-B no plano.

## [2026-11-20 15:01] session — F78 Ref-A: os seis repositórios em `shared/data/`, recebendo o Firestore de fora (REQ-09)
**Branch:** feat/f78-ref-a-repositories-in-the-core
`BaseRepository` e os cinco (séries, playlists, inventário, ranking próprio, enriquecimento do Spotify) foram para `shared/data/` sem importar Firestore: recebem uma «store» (`shared/data/store.js`: o `db` e as 13 funções que chamam); o site a monta do Firebase JS em `public/js/repositories/firestoreStore.js`, e a instância única do ranking mora em `public/js/repositories/userRankings.js`. Os importadores (SeriesService, PlaylistsService, RepositoryPlaylistsSource, as ligações do inventário, do Spotify, do ranking e da carga de álbuns) apontam para a casa nova; o `normalize` da chave do Spotify passa por `shared/platform/text.js`.
Provas: o `writeSequence` dá as mesmas chamadas, cargas e ordem gravadas na `main`; os testes dos repositórios rodam também em Node puro; os sensores de camada passam a enxergar `shared/data/`. Suíte 265 arquivos, 3.519 testes; lint e build verdes.

## [2026-11-20 14:55] session — F78 Ref-A: a sequência de chamadas do Firestore dos repositórios, gravada antes da mudança de casa
**Branch:** feat/f78-ref-a-repositories-in-the-core
Antes de mover os repositórios para `shared/data/`, cada método público dos cinco repositórios roda contra o Firestore falso com gravador (`test/helpers/recordingFirestore.js`) e o registro (chamadas, cargas, ordem, cache e documentos que sobram) fica em `test/fixtures/repositories/write-sequence.json`, gravado no código da `main` (`7a3237b`).
O `writeSequence.test.js` compara o registro com o arquivo: a mudança de casa tem de dar o mesmo, chamada por chamada (REQ-09). Nenhuma escrita no Firestore de produção.

## [2026-11-20 14:48] session — F78: as fundações do núcleo em produção; `## Now` atualizado
**Branch:** main
Servidor `mjrp-proxy-00214-4z4` (teto de 3 instâncias; `DISCOGS_TOKEN` continua mapeado) e site da `3112b6d`. Provado no app local, conta do MJRP: os identificadores de faixa saem da porta (`newId`), o inventário abre com os totais em reais, e as três receitas geram playlists dos álbuns reais de «Trip Hop Vol.1» (chamando o serviço de geração direto, sem tocar no rascunho não salvo dele). Suíte 3512; o corpo dourado bate com o motor Hermes em 3.343 de 3.343 casos. Sobra a limpar: a série de visitante «F78 port check», criada por um agente no Firestore de produção.

## [2026-11-20 14:40] session — F78: o núcleo ganha casa e sensor (pacote do npm, coreStaysPortable, testes sem jsdom)
**Branch:** feat/f78-core-foundations
`shared/package.json` (`@album-blender/shared`, sem dependência) e `"workspaces": ["shared"]` na raiz; o lockfile ganhou só o elo (`npm ci` conferido numa cópia: liga `node_modules/@album-blender/shared`); o `vite build` passa e o arranjo do deploy do servidor (`_shared_temp`) carrega `shared/` como antes. `coreStaysPortable.test.js` (sem exceção: nenhum global do navegador, nada do motor fora de `shared/platform/`, nenhum import que saia de `shared/`, as regras sem `shared/data/`) e `appAndSiteApart.test.js` (as checagens de `app/` passam vazias até ele existir); `vitest.workspace.js` roda `test/shared/` também em Node puro.
Para o sensor passar: o `normalize` das duas regras de identidade foi para `shared/platform/text.js` (o Hermes ainda dá 3.343 de 3.343), e o login do site saiu de `shared/services/AuthService.js` para `public/js/services/auth/signIn.js`. `arch.md` ganha a seção do núcleo (casa, porta do id, corpo dourado e o que quer dizer uma saída mudada); manual 23 e `plan.md` dizem os módulos novos.

## [2026-11-20 14:33] session — F78: o corpo dourado do núcleo vira peça do repositório, e o Hermes dá 3.343 de 3.343
**Branch:** feat/f78-core-foundations
O corpo e a corrida do spike S1 foram para `test/fixtures/golden-core/` (entradas 744 KB; a corrida sem global, o id pela porta) com UMA referência, a saída das regras de hoje no Node: `reference/output.jsonl.gz` (1,3 MB) e `reference/cases.tsv` (230 KB, o diff que se revisa). `test/architecture/goldenCoreUnchanged.test.js` refaz a saída a cada suíte e falha em qualquer caso mudado; `node scripts/golden-core.mjs --write` grava a referência depois de uma mudança revisada. Sem dado pessoal: no lugar da conta do MJRP, os 28 álbuns de catálogo das fixtures.
`node scripts/golden-core.mjs --hermes` (opcional, fora da suíte, precisa do motor do spike): 3.343 de 3.343 iguais no Hermes, do código-fonte e do bytecode, depois das duas mudanças; os 58 casos `mixin:enrichTracks` saíram com o mixin. O README do spike diz como rodar.

## [2026-11-20 14:28] session — F78: o deploy do servidor fixa no máximo 3 instâncias
**Branch:** feat/f78-core-foundations
`scripts/deploy-server.sh` passa `--max-instances "$MAX_INSTANCES"` (padrão 3, com o motivo ao lado) ao `gcloud run deploy` e o diz no passo e no ensaio. O limite por pessoa mora na memória de cada instância, então o pior caso é 60 chamadas pagas por hora vezes 3 = 180; o serviço tinha o padrão de 20 (lido com `gcloud run services describe`, só leitura), 1.200. Nenhuma publicação rodada: o número vale na próxima.
`test/server/deployFixesMaxInstances.test.js` falha se o comando não fixar o número; o manual 00 diz o valor e como trocá-lo numa publicação.

## [2026-11-20 14:26] session — F78: o dinheiro do inventário é arredondado a centavos antes de virar texto
**Branch:** feat/f78-core-foundations
`models/inventoryValue.js` ganha `roundToCents`: metade para longe do zero, sobre o texto decimal mais curto do número (fixado pela linguagem, igual em todo motor), o mesmo que os navegadores já mostravam; `formatMoney` (e por ele `moneyOf` e o total do cabeçalho) e o «Paid:» do `ViewAlbumModal.js` arredondam antes do `toLocaleString`. O spike S1 mediu 1166.505 como .50 no Hermes e .51 no Node: os motores arredondam a metade de jeitos diferentes ao formatar.
O teste novo formata como o Hermes (metade para o par) e falhava no código de antes, com 1166.505 direto e convertido; nenhum número da tela do site muda.

## [2026-11-20 14:25] session — F78: o TrackEnrichmentMixin estava morto e saiu
**Branch:** feat/f78-core-foundations
O comparador inconsistente que o spike S1 achou (`TrackEnrichmentMixin.js:152` e `:155`, a ordem fica a cargo do motor) morava num mixin que nenhuma receita aplica: só o `mixins/index.js` o reexportava. Tirado o reexporte, o `noDeadModules` o acusou sem ninguém que o alcance; o arquivo saiu por `git rm` (o `_safe.py` recusa `retire` para arquivo versionado), com os quatro testes dele em `test/algorithms/mixins.test.js`, a linha do `trackIdentityRule.test.js` e as três da lista de complexidade (a lista só encolhe).
O `PlaylistBalancingMixin` e o `applyMixins` também não são aplicados por nenhuma receita (só reexportados e testados); ficaram, fora do escopo, ditos no relatório. `arch.md` e o manual 08 deixam de citar o mixin.

## [2026-11-20 14:21] session — F78, Ref-0: um gerador de id só, atrás de uma porta do núcleo
**Branch:** feat/f78-core-foundations
`shared/platform/newId.js` exporta `newId()` e `setIdSource(fn)`; sem fonte ligada, `newId()` dá erro dizendo o que ligar (o núcleo não procura global sozinho). O site liga a fonte uma vez, com o `crypto.randomUUID` do navegador, em `public/js/services/platform/platformWiring.js`, o primeiro módulo que o `app.js` carrega; os testes ligam a mesma em `test/setup.js`. `Track.js` e `TrackTransformer.js` chamam `newId()` e não citam mais `crypto`.
Testes novos: `test/shared/platform/newId.test.js` (a porta, o erro sem fonte, os dois arquivos sem `crypto`, ninguém fora da ligação chama `randomUUID`) e `test/services/platform/platformWiring.test.js` (a ligação dá UUID v4 sem repetir; o `app.js` a carrega primeiro). O servidor não cria faixa: não precisa de ligação.

## [2026-11-20 14:15] session — F78: a proposta da constituição v2 corrigida pela reconferência independente
**Branch:** feat/f78-constitution-v2-fixes
Os sete achados aplicados em `design/proposals/f78-app-architecture/constitution-v2.md`: os artigos numerados para que toda citação `violates:: [[constitution#N]]` (F52, F64, F65 e as UAT-15, 16, 17, 21, 22, 23, 24, 25) fique no seu assunto, com o mapa v1→v2 (a segurança e os segredos voltam ao artigo V, como no v1.0.0; a UAT-25 é a única que muda de sentido, e fica como história); `albums/` e `spotify_enrichment/` marcados «vale antes de qualquer conta de fora», sem teste ainda; hooks separados do procedimento (nenhum hook roda o doctor); a Factory por injeção (`DP-02`) de volta; o TypeScript do app como decisão do MJRP e a condição do resto como recomendação do agente.
Na lista do que muda no aceite entraram `data-model.md:151`, `arch.md:107` (ainda diz «sem autenticação»), e os arquivos de `.agent/` e `docs/onboarding/DEVELOPER.md` que mandam ler `docs/CONSTITUTION.md`. Continua proposta: nada mais mudou.

## [2026-11-20 14:09] session — F78: a constituição v2.0.0 proposta, para substituir a de 2025
**Branch:** feat/f78-constitution-v2
`design/proposals/f78-app-architecture/constitution-v2.md`, pelo modelo da `mjrp-designing-architecture`: nove artigos escritos do que o código é hoje (cada regra com a fonte: ADR, teste de arquitetura ou de segurança, decisão do MJRP com a data) mais o app do ADR-0022, em TypeScript; as regras do app marcadas «vale quando `app/` existir», com o teste que as vai conferir; o que saiu da v1.0.0 e por quê; a lista do que muda no dia do aceite (arquivos e linhas, onde guardar a v1.0.0, os sensores que leem a constituição).
Nada entra em vigor: `docs/specs/constitution.md` não foi tocado, o ADR-0022 segue «Proposed» (ganhou o TypeScript e a dependência da v2), a emenda ganhou a nota de que foi substituída, e a tarefa da F78 espera o MJRP ler e aceitar os dois textos.

## [2026-11-20 14:09] session — F78, spike S1: o núcleo de regras no Hermes dá o mesmo resultado que no site, com duas mudanças
**Branch:** feat/f78-spike-s1-core-on-hermes
Rodado na linha de comando, no Hermes 260318099.0.5 (o do React Native 0.88.1, fatia de macOS do artefato `hermes-ios` do Maven Central, com um host de ~80 linhas): 3.401 casos (receitas do registro com as opções, as 4 estratégias, `Album`/`Track`, transformador, identidade de álbum e de faixa, mais as entradas extraídas dos testes do repositório). No Hermes cru, 1.241 quebram em `crypto`; com um `crypto.randomUUID` no lugar, 3.394 iguais byte a byte e 7 diferentes, todos no `TrackEnrichmentMixin` (fora do registro; comparador inconsistente); com a correção de 2 linhas dele, 3.401 de 3.401 iguais, da fonte e do bytecode.
Mudanças para o build (código do site não tocado): Ref-0 (`newId()` com `expo-crypto`, 2 linhas e uma porta), comparador do mixin (2 linhas) e, fora do S1, o arredondamento do dinheiro em `inventoryValue.js:196` (Hermes .50 × Node .51). Não provado: Android, Metro, o Hermes de dentro do app, desempenho. Prova: `reports/evidence/F78/2026-11-20-spike-s1-core-on-hermes.md`; pasta `spikes/f78-s1-core-on-hermes/`.

## [2026-11-20 14:04] decision — TypeScript passa a ser permitido, e o MJRP acha que deve ser usado
**Branch:** main
Palavras dele, sobre a proposta que dizia «sem TypeScript»: «Ignora o sem typescript, podemos ter typescript, creio que devemos inclusive». A proposta da constituição v2 e o ADR-0022 (os dois ainda propostas) passam a dizer: o app em `app/` é escrito em TypeScript. Recomendação do agente para o resto, a decidir por ele: o núcleo `shared/` e o site continuam em JavaScript com JSDoc por ora, e migram por ADR quando o caminho do servidor estiver medido (o servidor é CommonJS e hoje recebe o `shared/` copiado, sem passo de compilação).

## [2026-11-20 14:03] decision — o MJRP prefere substituir a constituição de 2025 a emendá-la
**Branch:** main
Palavras dele, ao receber a proposta de emenda: «Sobre a constitution pode ser superseded já envelheceu». Um agente escreve a nova como proposta (`design/proposals/f78-app-architecture/constitution-v2.md`), a partir do que o código e os registros de decisão são hoje, mais o app. Nada entra em vigor ainda: a constituição v1.0.0 continua no lugar e o ADR-0022 continua «Proposed» até ele ler e aceitar os dois textos. O agente integrador chegou a instruir o contrário (marcar o aceite pelas palavras acima) e corrigiu antes de qualquer arquivo mudar: aceite não se infere.

## [2026-11-20 13:54] decision — F78: o ADR-0022 da pilha do app, em «Proposed», e a emenda da constituição proposta
**Branch:** feat/f78-app-first-milestone-specs
ADR-0022 (React Native com Expo; as regras num núcleo de JavaScript em `shared/`, usado pelo site, pelo app e pelo servidor; Firebase pelo pacote nativo; Swift e Kotlin só onde a plataforma exige, a começar pelo token do Apple Music), uma linha por alternativa; a análise fica na proposta e na crítica. Aceite: MJRP, porque mexe na constituição; o agente não o aceita.
A emenda (`design/proposals/f78-app-architecture/constitution-amendment.md`) cita os Art. II, IV e V como estão e oferece duas redações: (a) exceção só para `app/`, sem TypeScript (a proposta não o exige), escolhida em princípio na decisão 6; (b) TypeScript e framework de interface permitidos em todo o produto por ADR. `constitution.md` não foi tocado.

## [2026-11-20 13:53] session — F78: requisitos, plano e tarefas do primeiro marco do app
**Branch:** feat/f78-app-first-milestone-specs
O primeiro marco da F78 escrito pela ordem do § 15 da proposta: 18 REQs (os spikes S1 a S7 como perguntas de sim ou não, com prazo; Ref-0, a casa e os sensores do núcleo, Ref-A partida em mudança de casa e regras de convivência, Ref-B; o esqueleto que entra e lista as séries, inclusive sem rede; versão mínima; medição pela porta da F77; autoteste do corpo dourado; nada secreto no pacote; `--max-instances`), 29 tarefas, as decisões do MJRP das 13:45 e as cinco que continuam dele. As notas do § 17 fecham nos REQs: `_schemaVersion` nunca desce, `saveAlbumFacts` classificado, o S1 com todas as receitas e estratégias e o gerador real, o corpo dourado com as entradas dos testes do núcleo.
A S-60 passa a «Prioritized» (a F78 está na fila do MJRP); «Ready» espera um estado observável julgado, que nasce na rodada de desenho do esqueleto. Esperam o MJRP: Xcode e Android Studio, conta da Apple (e a do Google, a do Expo), chave do PostHog.

## [2026-11-20 13:45] decision — F78: nas decisões do § 13 da proposta, o MJRP manda seguir a recomendação
**Branch:** main
Palavras dele, em resposta à lista do que continuava sendo dele: «Recomendação sua da proposta». Lido pelo agente assim, e dito a ele para corrigir se não for: onde a proposta tem recomendação, vale a recomendação. São: (4) mesma base para Android desde o primeiro dia, loja do Google depois do iPhone; (5) separar o app para ele (marco A, TestFlight interno) do app público (marco B); (6) emendar a constituição só para `app/`; (7) App Check, e visitante só no site, com limite menor; (9) versão mínima com atualização obrigatória; (10) sem rede: inventário e ranking próprio funcionam, série e playlists pedem rede; (11) apagar a conta pelo servidor; (12) fechar as regras do Firestore de `albums/` e `spotify_enrichment/` antes de qualquer conta de fora; (14) exportar para o Apple Music só no iPhone, se o Android falhar, dito na tela; (15) meio dia para medir a opção (f). Continuam sem resposta, porque a proposta não recomenda: (1) horas de manutenção por mês, (2) quanto tempo o site continua, (3) se o app público vale sem o BestEverAlbums, (8) o teto de gasto por dia; e (13) as contas de desenvolvedor, que só ele cria. O texto da emenda e o aceite do ADR ainda passam por ele: o agente não escreve aceite.

## [2026-11-20 13:44] decision — o MJRP manda seguir a recomendação da proposta da F78 e construir o app, com tudo registrado pelo PDLC
**Branch:** main
Palavras dele: «Vc consegue seguir sua recomendação da f78 e construir a app registrando tudo conforme nosso pdlc?». Lido pelo agente como o sinal para seguir a recomendação (React Native com Expo, núcleo de regras compartilhado, Firebase pelo pacote nativo, Swift e Kotlin só para o Apple Music). Continuam sendo dele, e pedidos a ele: o aceite do ADR da pilha, a emenda à constituição (Art. II, IV e V), as quinze decisões do § 13 da proposta, as contas de desenvolvedor, a instalação do Xcode. Conferido na máquina: Node 26 e npm 11; **sem Xcode** (só as ferramentas de linha de comando) e **sem Android SDK**: o app não roda em simulador aqui hoje. Começa pelo que não depende disso: os registros do PDLC (requisitos e tasks do primeiro marco, ADR em «Proposed») e o teste rápido S1 (o núcleo no motor Hermes, pela linha de comando).

## [2026-11-20 13:39] session — conserto: marcas de conflito no `arch.md`, deixadas pelo merge da proposta da F78
**Branch:** main
Ao juntar a `main` no ramo da proposta, o `arch.md` teve conflito (a seção da F77 e o ponteiro da proposta, no mesmo lugar) e o integrador fez o commit com as marcas dentro. Consertado: as duas seções ficam, a da F77 antes; o ponteiro da proposta diz o estado de agora (criticada, revisada, reconferida, sem aprovação e sem ADR). Erro do agente integrador; nenhum código tocado.

## [2026-11-20 13:39] review — reconferência da proposta de arquitetura do app (F78): pode ir ao MJRP, com notas
**Branch:** feat/f78-app-architecture-proposal
Um segundo agente conferiu a revisão contra a crítica: os dois P0 e os P1 1, 3, 5 e 7 fechados; P0-2 e os P1 2, 4 e 6 em parte. As notas abertas estão no § 17 da proposta (a versão do documento rebaixada por um app antigo; `saveAlbumFacts` sem classificação; o S1 com gerador de identificadores fixo; a cota da IA; os desfechos do BestEverAlbums). Nenhum ADR ainda: a decisão é do MJRP.

## [2026-11-20 13:38] session — F77 em produção, desligada: falta a chave do projeto do PostHog
**Branch:** main
Site publicado da `385ff60` (`main-CqYQz48c.js`); a publicação diz «measurement of use: OFF (no VITE_POSTHOG_KEY)». Provado no app local com a conta do MJRP e a marca de depuração: `screen_viewed` por nome de tela, `filter_used` para o filtro de status e para a busca, sem o texto buscado; nenhum pedido ao PostHog. Suíte 3192. Para ligar: o MJRP põe `VITE_POSTHOG_KEY` no `.env` da raiz (projeto na nuvem da União Europeia, captura de IP desligada) e o site é publicado de novo. Não verificado: evento chegando ao PostHog; `sign_out` sobrevivendo à recarga.

## [2026-11-20 13:36] session — F78: a proposta de arquitetura do app revista depois da crítica independente (2 P0 e 7 P1 respondidos)
**Branch:** feat/f78-app-architecture-proposal
A crítica (`reports/audits/2026-11-20-mjrpalbumblender-v0-f78-architecture-critique.md`) bloqueou a proposta; a pilha recomendada ficou, o desenho em volta mudou: toda gravação tem prazo e estado na tela, inventário e ranking próprio gravam sem rede e série e playlists por transação com conferência; regra de convivência entre versões do app e o site, com versão mínima; a costura do núcleo desenhada (`shared/data/` e cinco fatias de refatoração do site); Firebase nativo no app em vez do Firebase JS; App Check, limite fora da instância e teto global de gasto; dois marcos (o app do MJRP, depois o público).
A parte portável passou a ser dita como é: cerca de 34% depois de um conserto de `crypto.randomUUID`, cerca de 28% sem tocar em nada, 0% provado num aparelho; o spike S1 agora compara byte a byte receitas e rankings reais. Uma discordância, de meio: os 954 casos do Vitest não rodam no motor do app. A resposta por achado está na seção 16 da proposta; a página do MJRP foi republicada no mesmo endereço; nenhum ADR.

## [2026-11-20 13:34] session — F77: plano, spec, tarefas e os documentos da medição
**Branch:** feat/f77-measure-how-the-app-is-used
O `plan.md` reescrito com as onze decisões do agente (revisáveis), a spec com estados, critérios e fora do escopo, as tarefas com uma aberta para o MJRP (o projeto e a chave do PostHog); `arch.md`, `behavior.md` (`^usage-*`), `data-model.md`, `tech-stack.md` e o manual de publicação dizem a porta, o adaptador, o que é medido e o que nunca é.
O `## Now` do `MEMORY.md` ganha uma linha da F77, no ramo; o integrador junta com o da `main`.

## [2026-11-20 13:30] review — crítica independente da proposta de arquitetura do app (F78): não vai ao MJRP como está
**Branch:** main
Um agente separado julgou `design/proposals/f78-app-architecture/architecture-proposal.md` (ramo `feat/f78-app-architecture-proposal`): 2 P0, 7 P1, 2 P2. A pilha recomendada (React Native com núcleo JS) se sustenta; antes de ir ao MJRP a proposta precisa responder: gravar sem prazo e sem estado «pendente» (VT-02); formato dos documentos do Firestore entre versões do app (VT-05); onde fica a costura do núcleo, com `SeriesService` e `PlaylistsService` presos ao Firestore e à tela (IV-03); Firebase JS contra React Native Firebase (RS-04); limite por pessoa só na memória da instância, sem teto global nem App Check (MA-04, MA-05). Parte portável refeita pelo crítico: 116 arquivos, cerca de 34% com um polyfill, 0% provado em aparelho; `crypto.randomUUID` em `Track.js` quebra no motor do app e alcança todas as receitas. Relatório: `reports/audits/2026-11-20-mjrpalbumblender-v0-f78-architecture-critique.md`. A proposta volta ao autor.

## [2026-11-20 13:29] session — F77: as variáveis do build, o CSP e a conferência da publicação
**Branch:** feat/f77-measure-how-the-app-is-used
O CSP deixa os eventos chegarem às duas nuvens do PostHog (nenhum script dele); o `.env.example` traz `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST` e `VITE_USAGE_MEASUREMENT`; o `deploy-site.sh` diz se a medição sai ligada ou desligada e recusa uma chave que não chegou ao build.
Provado num navegador (Vite em 127.0.0.1:5123, sem conta, adaptador de depuração), no computador e a 375 px: as telas pelo nome, uma busca medida uma vez sem o texto, o clique em link de compra medido sem segurar a navegação, nenhum pedido a host do PostHog.

## [2026-11-20 13:26] session — F77: os eventos das tarefas, no computador e no celular
**Branch:** feat/f77-measure-how-the-app-is-used
Os eventos saem onde a ação deu certo, nos serviços e controladores (série, ranking, gerar, gravar, exportar, inventário, filtros, entrar e sair); os links de compra levam a loja e o lugar, e um ouvinte só mede o clique sem segurar a navegação.
Acrescentados pelo agente: `inventory_value_removed` e `inventory_albums_added`. As peças do celular chamam os mesmos controladores e serviços, então mandam os mesmos eventos. Suíte: 3191 testes verdes.

## [2026-11-20 13:19] session — F78: proposta de arquitetura guiada por risco do app para iPhone e Android (sem ADR)
**Branch:** feat/f78-app-architecture-proposal
Escrita pela `mjrp-designing-architecture` em `design/proposals/f78-app-architecture/architecture-proposal.md` (o guarda de caminhos recusou a pasta da feature: proposta mora em `design/proposals/`); ponteiro em `docs/specs/arch.md` § Propostas em avaliação; o `plan.md` da F78 aponta para ela; página para o MJRP ler: https://claude.ai/artifact/35vmLkhuGQhYrBkpzTJzJc. Medido no código: 66 arquivos e 7.392 linhas de regras não tocam o navegador, 24 de 51 serviços também não, 954 dos 2.640 casos de teste exercitam só esse código, e 46% do site é tela a reescrever.
Recomenda React Native com Expo com o núcleo de regras em `shared/` e pedaços nativos só para o token do Apple Music; fica à espera da crítica independente e do MJRP (onze decisões dele, seis spikes, a emenda do Art. II da constituição). O doctor está vermelho por erros que já estavam na `main` (links antigos, sensores sem `node_modules` neste worktree, `## Now` do MEMORY parado); nenhum vem destes arquivos.

## [2026-11-20 13:19] session — F77: a porta de eventos, o adaptador do PostHog e o interruptor
**Branch:** feat/f77-measure-how-the-app-is-used
A lista fechada de eventos em `shared/usageEvents.js` (só contagens e valores de conjunto fechado: texto da pessoa não cabe), a porta `services/usage/track.js`, o adaptador do PostHog carregado só quando ligado (`posthog-js` 1.447.0, build sem código de fora), o adaptador de depuração (`window.__usageEvents`) e o teste de arquitetura que deixa só o adaptador falar com a biblioteca.
O roteador passa a dizer às funções de depois da troca qual rota casou; a tela é medida pelo nome, nunca pelo endereço. Decisões do agente, revisáveis, no `plan.md` da F77.

## [2026-11-20 13:14] session — proposta de medição de uso, com a adoção de cada opção
**Branch:** main
A pedido do MJRP: `design/proposals/f77-usage-measurement/proposal.md`. Proposta do agente, a decidir por ele: PostHog no site e no app; Firebase Analytics e Crashlytics só no app; um monitor de erros no site (Sentry ou a captura do PostHog). Adoção medida hoje (instalações por semana no npm, estrelas no GitHub, parcela de sites no W3Techs, parcela de apps no 42matters): as três escolhas estão entre as mais adotadas da sua categoria. Ele já está criando a conta do PostHog; região recomendada: União Europeia (não há região no Brasil).

## [2026-11-20 12:47] decision — o MJRP abriu a v6.0: o app (React Native) e a medição do uso com o PostHog
**Branch:** main
Palavras dele: «Vamos criar a V6.0 para implementação da app e para implementar o posthog no site e na app em reactive native (pq não flutter?)». Criados na `main`: a versão v6.0 no ROADMAP (`^REL-41`), o épico EP-10 no PRD, as stories S-59 (saber como o app é usado) e S-60 (o app pelas lojas), e as features F77 (medição, PostHog; via padrão) e F78 (o app; via padrão), em esboço, sem ramo: esperam a priorização. Por que não Flutter, na resposta do agente: o app de hoje é JavaScript com mais de 3000 testes; em React Native as regras (receitas, ranking, identidade de álbum e de faixa) são reaproveitadas num núcleo compartilhado com o site; em Flutter (Dart) seriam reescritas ou iriam todas para o servidor. Sem o site, as duas pilhas empatariam. A decisão formal fica para o ADR, depois da proposta de arquitetura.

## [2026-11-20 12:05] session — rascunhos dos e-mails ao BestEverAlbums e ao MusicBrainz; dois candidatos no PRD (analytics; GEO e AEO)
**Branch:** main
A pedido do MJRP: os dois e-mails redigidos em `reports/audits/2026-11-20-mjrpalbumblender-v0-outreach-emails.md` (rascunhos; o envio é dele; o do BestEverAlbums diz o uso de hoje com transparência). Dois candidatos no Intake: medir o uso do site, e ser achado por buscadores e assistentes de IA. Conferido no código: o site não tem analytics, `robots.txt`, descrição nem dados estruturados.

## [2026-11-20 10:18] session — o estudo do produto público vira estudo de viabilidade: afiliação, BestEverAlbums e MusicBrainz autorizados
**Branch:** main
A pedido do MJRP, o documento foi reescrito como estudo de viabilidade de um cenário: produto público, receita por afiliação, notas do BestEverAlbums com autorização, catálogo do MusicBrainz com apoio comercial. Veredito do agente: viável como produto; a afiliação sozinha não se paga no começo (conta ilustrativa: cerca de US$ 135 por mês com 10 mil usuários ativos, premissas escritas). O item que decide é a resposta do BestEverAlbums. O material anterior ficou como anexos.

## [2026-11-20 10:15] session — estudo do produto público: entram as considerações das conversas
**Branch:** main
A pedido do MJRP, o estudo ganhou o que estava só na conversa: as regras das lojas, a opção SwiftUI se o iPhone for a única plataforma, o caminho de uso pessoal (tela de início, Capacitor no TestFlight) e a cláusula de tráfego do Discogs com as três opções.

## [2026-11-20 10:05] decision — candidato no PRD: Album Blender como produto público (iPhone e Android); estudo escrito
**Branch:** main
O MJRP quer considerar um app público nas duas lojas, «uma evolução do produto», e pediu material para decidir, não construção. Registrado como candidato no Intake do PRD; estudo em `reports/audits/2026-11-20-mjrpalbumblender-v0-public-product-study.md` (travas de dados, pilha com Android, monetização, agregador de preços, o lado legal, agregador de rankings). Recomendações do agente, revisáveis: React Native com Expo e núcleo de regras compartilhado; afiliação e plano do colecionador; catálogo por fontes abertas e preço por afiliados e usuários; a nota da comunidade como fonte de faixa.

## [2026-11-20 09:40] session — UAT-229 em produção
**Branch:** main
Site publicado da `main`. Provado no app local com as séries reais da conta do MJRP, sem gerar playlists (o rascunho não salvo dele ficou intacto): uma playlist «Trip Hop Vol.1 · Spotify Top 3 balanced»; várias «Trip Hop Vol.1 · Zé's Balanced Playlists»; «New Order & Depeche Mode & Joy Division · BestEverAlbums Top 5»; sem série, «TheAlbumBlender Playlist 2026-11-20 09:39».

## [2026-11-20 09:39] session — UAT-229: o nome padrão do lote diz a série e a playlist (ou a receita)
**Branch:** feat/f76-batch-name-default
O MJRP aceitou o formato proposto: «Pra essa iteração serve». Um modelo puro, `models/batchNaming.js` (testes primeiro, vistos falhando), decide o nome; os códigos dos títulos (SPFY, BEA, Bal.Intv., Intv.) passam a viver ali e `components/playlists/batchNames.js` os usa, sem segunda cópia. O serviço de geração diz o nome da receita (`recipeName`). Decidido pelo agente — revisável: uma playlist só leva o título dela; várias levam o nome da receita, sem «[MJRP]». Suíte 3080, lint limpo.

## [2026-11-20 09:31] session — UAT-230 em produção
**Branch:** main
Site publicado da `main`. Provado no app local, conta do MJRP, 393x852: «Track Listing» (153 px), «BEA» e «Spotify» (102 px) numa linha, sem reticências.

## [2026-11-20 09:30] session — UAT-230: na janela do álbum no celular, «Original» vira «Track Listing»
**Branch:** feat/f76-track-listing-label
Teste mudado primeiro e visto falhando. O segmento da ordem do álbum ganhou 1,5 da largura dos outros, para «Track Listing» caber numa linha a 393 px. No computador não há esse rótulo.

## [2026-11-20 09:26] session — UAT-224 e UAT-225 em produção; UAT-229 registrada
**Branch:** main
Site publicado da `main`. Provado no app local, conta do MJRP, 1280x800, ranking de «Mezzanine» (nada gravado): com a ordem mudada, «Back» e Escape perguntam «Discard changes?»; «Keep editing» mantém a janela e a ordem; «Discard» fecha. UAT-229: o MJRP quer o nome da playlist no nome padrão do lote; o formato espera a resposta dele.

## [2026-11-20 09:24] session — UAT-224 e UAT-225: o ranking no computador pergunta antes de descartar; o nome automático do lote com dia e hora do mesmo relógio
**Branch:** feat/f76-rank-discard-computer
Testes primeiro, vistos falhando. Ranking: «Back», Escape e o clique fora passam por `requestClose`; no computador a pergunta é a `ConfirmModal` do app (a janela de ranking não pode chamar serviço: `ownRankingBoundaries`), com as palavras do celular. O teste que afirmava o «Back» antigo do computador foi reescrito para a regra nova. Lote: `_generateDefaultBatchName` lê dia e hora do relógio local (o dia vinha de UTC). Suíte 3074, lint limpo.

## [2026-11-20 09:06] session — UAT-227 e UAT-228 em produção
**Branch:** main
Site publicado da `5e8bbf3` (`main-D922NX-F.js`). Provado no app local, conta do MJRP, 393x852: Albums abre em «Newest» («Trip Hop Vol.1» e «ELP - Early Days», de hoje, primeiro); na janela de «Mezzanine» as faixas dizem «BEA ★ 90» em laranja e «Spotify 82%» em verde.

## [2026-11-20 09:05] session — UAT-227 e UAT-228: Albums abre em «Newest»; a janela do álbum no celular diz a nota do BEA, cada fonte na sua cor
**Branch:** feat/f76-owner-adjustments
Testes primeiro (vistos falhando): `SeriesController.defaultOrder.test.js` e o teste novo de `TracksTabs.phone.test.js`. A ordem de abertura é uma constante, `DEFAULT_SERIES_ORDER = 'recent_desc'`. Na faixa, «BEA ★ 87» no lugar de «BEA #4», com `aria-label` falado sem a estrela; BEA laranja `#fb923c`, Spotify verde `#1ed760`, contraste medido. Suíte 3068, lint limpo. `behavior.md` e `design-system.md` dizem as duas regras.

## [2026-11-20 09:03] decision — o MJRP usou o app no iPhone: «Ficou muito top!»; dois ajustes registrados
**Branch:** main
UAT-227: Albums abre em «Newest» (vale também no computador: a ordem de abertura é uma só). UAT-228: na janela do álbum no celular, o BEA mostra a nota da faixa e cada fonte tem a sua cor (BEA laranja, Spotify verde, as do computador). Decidido pelo agente — revisável: «color code» lido como a cor de cada fonte, não como uma escala de cores pelo valor; a regra «laranja só na ação principal e no estado ligado» do celular ganha a exceção da cor do BEA, pedida por ele.

## [2026-11-20 03:54] session — fechamento da madrugada: F75 e F76 em produção, documentos juntos, `## Now` atualizado
**Branch:** main
Decisões da madrugada, todas «decidido pelo agente — revisável»: (1) F76 sem protótipo julgado, pelas palavras de liberdade do MJRP; o juízo dele é no app em produção. (2) «Celular» é até 767 px; nada age acima disso. (3) Telas em Opus 5.5 esforço high, para poupar o Fable (82% às 02:30). (4) F75: sem as configurações de vendedor, o valor é o menor preço à venda, dito na tela; a conta do Discogs não foi tocada. (5) Laranja só na ação principal e no estado ligado; segmento escolhido em superfície clara; títulos de linha em Syne. (6) UAT-226 fica para o MJRP: trocar a edição mudaria o que o número significa.

## [2026-11-20 03:56] session — F76 documentação: plan, spec e tasks fechados
**Branch:** feat/f76-mobile-docs
O `plan.md` nomeia os módulos de cada tela com o REQ que servem e lista o que nunca foi verificado (iPhone de verdade, gravar pelo celular, VoiceOver, a trava de rolagem N22); o `spec.md` liga os estados aos block IDs do info-arch e escreve os critérios de sucesso com as medidas.
A linha de Documentation do `tasks.md` foi marcada; TASK-08 e TASK-09 ficam abertas.

## [2026-11-20 03:55] session — F76 documentação: o celular em info-arch, behavior, arch e manual
**Branch:** feat/f76-mobile-docs
As notas das telas da F76 foram dobradas em `info-arch.md` (navegação, inventário por tela e 55 estados com block ID), `behavior.md` (§ No celular), `arch.md` (a camada do celular) e nas páginas do manual (parte «No celular»); a página de leitura do info-arch foi gerada de novo.
Cada afirmação vaga foi conferida no código; a linha da gaveta ☰ de `behavior.md` foi corrigida (a marcação usa `lg:`, abaixo de 1024 px, e não 768 px).

## [2026-11-20 03:48] session — F76: o acabamento em produção; UAT-216, UAT-217 e UAT-223 resolvidas; três issues novas
**Branch:** main
Site da `0359e3d` (`main-D5xyTKX2.js`): os achados da crítica independente aplicados (inventário com a lista na primeira tela, «Discard changes?» no ranking, valor e compra recolhidos na janela do álbum, playlists gravadas com a anatomia de Albums, um só controle segmentado, títulos em Syne). Prova: `reports/evidence/F76/2026-11-20-production-proof.md`. Abertas: UAT-224 (o «Back» do ranking no computador), UAT-225 (data e hora do nome do lote em fusos diferentes), UAT-226 (edição sem cópia à venda).

## [2026-11-20 03:44] session — F76 polimento: notas das telas e prova (Home, Playlists)
**Branch:** feat/f76-mobile-polish-home-playlists
Seção «Polimento pós-crítica» acrescentada a screens/home-and-blend.md e screens/playlists.md; provas em reports/evidence/F76/playlists/ e home-blend/ (antes = main, depois = este ramo, 393x852, 393x660 e 1280x800).
Computador idêntico pixel a pixel em todas as cenas comparadas, salvo uma faixa de antisserrilhado no botão Sign In da primeira cena da Home.

## [2026-11-20 03:39] session — F76 polimento: P2 baratos de Home e Playlists (N20, N15, N16 em parte)
**Branch:** feat/f76-mobile-polish-home-playlists
No celular: mover uma faixa pela folha mostra «Moved … to number 2 · Undo» e acende a linha por 1,2 s (sem transição com menos movimento); o filtro «?» da Home lê «Other»; na janela Edit Series os avisos de espera/vazio/falha passam a #a0a0a8 (eram 2,43:1).
Fora da lista estrita: views/playlists/phonePlaylistActions.js (as ações da tela de Playlists). Testes 3047 verdes, lint e build verdes.

## [2026-11-20 03:39] session — F76 polimento: notas de tela e provas do Inventário, da janela do álbum e de Albums
**Branch:** feat/f76-mobile-polish-inventory-windows
Seções «Polimento depois da crítica» em screens/inventory.md, album-window-and-ranking.md e albums.md (decisões, medidas, o que não foi feito: N11, N14, N15, N16).
Provas em reports/evidence/F76/inventory/2026-11-20-polish-proof.md e album-window/2026-11-20-polish-proof.md.

## [2026-11-20 03:37] session — F76 polimento: a página presa sem nada aberto é devolvida (N22)
**Branch:** feat/f76-mobile-polish-inventory-windows
Lidos pageScrollLock.js e windowsHoldThePage.js: no código do app nenhum caminho deixa o contador alto (folhas e janelas sempre saem pelo close ou são tiradas do body, o que o observador vê). Os dois caminhos que deixam a página presa sem nada aberto — uma folha tirada do DOM sem close e o módulo recarregado (HMR do servidor de desenvolvimento, onde a crítica rodou) com o body preso — agora se soltam: giveBackAStrayHold roda a cada mudança dos filhos do body e a cada troca de tela (PhoneShell.screenChanged, uma linha).
Testes: 4 novos em test/components/ui/windowsHoldThePage.test.js.

## [2026-11-20 03:36] session — F76 polimento: títulos de linha em Syne em Playlists e na folha da Home (N4, N15 em parte)
**Branch:** feat/f76-mobile-polish-home-playlists
No celular, o título da faixa (15 px, 600, até 2 linhas, como as linhas da janela de ranking) e o nome nas fichas de New Playlists em Syne; na folha de escolhidos da Home, artista, campo, aviso e dica na fonte de texto. Os «⋯» de New Playlists passam de «Options for…» para «Actions for…», o verbo de Albums e Inventário.
A 393x660 continuam 4 faixas inteiras; computador intocado (só regras dentro da media query).

## [2026-11-20 03:35] session — F76 polimento: o nome da série na folha de escolhidos da Home (N10)
**Branch:** feat/f76-mobile-polish-home-playlists
No celular, a folha «n albums chosen» abre com o campo «Series name» (16 px, o mesmo valor do campo da página, escrito nos dois sentidos); sem nome, «Create series» abre a folha, diz «Give the series a name first.» e põe o cursor no campo, em vez de criar «New Album Series» calado. O computador segue com o nome padrão.
Arnês da Home com cenas novas (rolada, folha com e sem nome) e 393x660; computador igual ao de main (uma faixa de antisserrilhado no botão Sign In da primeira cena, fora deste ramo). Decidido pelo agente — revisável.

## [2026-11-20 03:35] session — F76 polimento: um controle segmentado e duas famílias de fonte no celular (N9, N4)
**Branch:** feat/f76-mobile-polish-inventory-windows
Um só segmentado (mobile.css § 11, variáveis --phone-seg-*): escolhido na superfície clara elevada, nunca laranja; aplicado em Grid/List e Pages/Scroll (Albums), Original/BEA/Spotify (janela do álbum) e a moeda (Inventário). Fonte: título de linha em Syne (--phone-font-title), o resto na fonte de texto (--phone-font-text) em Albums, Inventário, janela do álbum e ranking. As duas regras escritas em design-system.md § Celular.
3045 testes verdes, eslint e build verdes; Albums 1280x800 idêntico ao da passada de construção.

## [2026-11-20 03:31] session — F76 polimento: a janela do álbum do Inventário dobra o valor e as lojas (N7)
**Branch:** feat/f76-mobile-polish-inventory-windows
No celular, «Estimated value» vira uma linha (valor, origem, chevron) com «Data provided by Discogs.» ao lado, que abre a seção inteira num toque; «Where to buy» vira uma linha de três lojas de 44 px. As faixas começam em ~y=520 a 393x852 (antes 965). Os .btn-secondary da janela perdem o backdrop-filter próprio no celular (N7b, defensivo: não reproduzido no Chrome).
Testes: 2 novos em test/components/ViewAlbumModal.phone.test.js; 1280x800 idêntico pixel a pixel antes e depois.

## [2026-11-20 03:29] session — F76 polimento: Playlists gravadas com a anatomia de Albums (N5)
**Branch:** feat/f76-mobile-polish-home-playlists
No celular: busca + «Filters (n)» numa folha (`filtersInSheet`), séries como linhas (capas, nome em Syne, «n batches · n playlists», «⋯»), lotes como linhas com nome legível (o nome da máquina inteiro na folha), data num formato só, playlists como linhas que abrem as faixas; toda ação numa folha «⋯», apagar por último, em vermelho, com a confirmação de sempre.
Fora da lista: `components/ui/FilterSheet.js` aceita `props.sheetText` (rótulos de recarregar e fechar). Computador idêntico pixel a pixel (1280x800). Decidido pelo agente — revisável.

## [2026-11-20 03:26] session — F76 polimento: o Inventário mostra a lista na primeira tela (N2, N8)
**Branch:** feat/f76-mobile-polish-inventory-windows
No celular, os totais viram duas linhas («Owned», «To buy») com a moeda ao lado no controle segmentado único (.phone-segmented, novo em mobile.css § 11), «Data provided by Discogs.» fica junto dos valores e o aviso das configurações de vendedor sai do fluxo para a folha «Lowest asking prices · Why?». Medido no harness: 1ª linha em y=365, 2 linhas a 393x660 e 4 a 393x852 (antes 721 e 0). A folha Status mostra uma marca só (N8).
Testes: test/views/InventoryPhoneValues.test.js (5) e o de status atualizado; 1280x800 igual antes e depois.

## [2026-11-20 03:23] session — F76 polimento: New Playlists mostra 4 faixas a 393x660 (N3)
**Branch:** feat/f76-mobile-polish-home-playlists
No celular, nome do lote, Undo e Redo numa linha só (ícones nomeados de 44 px), sem trilha (a barra de baixo orienta), linha fechada «Reconfigure» fora da página (abre pelo «⋯» da playlist, agora com as receitas em uma coluna), resumo repetido da playlist só para leitor de tela.
Primeira faixa de y=496 para y=270: a 393x660, 0 → 4 faixas inteiras; a 393x852, 3 → 6. Decidido pelo agente — revisável.

## [2026-11-20 03:19] session — F76 polimento: o ranking pergunta antes de descartar (N6)
**Branch:** feat/f76-mobile-polish-inventory-windows
No celular, Back e Escape com a ordem mudada e não salva abrem a folha «Discard changes?» (Keep editing · Discard); sem mudança, saem direto. O computador não muda (tem o mesmo defeito, mas a correção lá pediria outra janela de confirmação, não duas linhas).
Testes: 6 novos em test/components/ranking/UserRankModal.phone.test.js.

## [2026-11-20 03:17] session — F76 polimento: os filtros da Home não flutuam mais sobre as capas (N1)
**Branch:** feat/f76-mobile-polish-home-playlists
No celular, `#home-toolbar` deixa de ser preso (`position: static` em `css/mobile/home.css`); a regra presa de `css/views/home.css` fica intacta para o computador.
Decidido pelo agente — revisável: solto em vez de preso sob a barra, porque os seis filtros em duas colunas ocupam ~150 px; teste novo `test/components/home/HomePhone.toolbar.test.js`.

## [2026-11-20 03:16] review — crítica de UX independente da F76 no celular: sem P0, 11 P1, 11 P2
**Branch:** main
Um agente separado percorreu as telas novas na conta do MJRP, a 393x852, 393x660 e 667x375: dos 24 achados antigos, 19 fechados, 3 em parte, 2 não medidos; nenhuma tela rola de lado, nenhum alvo abaixo de 44 px. Melhor tela: Albums; mais fraca: playlists gravadas. Relatório: `reports/audits/2026-11-20-mjrpalbumblender-v0-mobile-ux-recheck.md`. Entram também no repositório a crítica de origem, o benchmark e a conferência dele. Decidido pelo agente — revisável: no celular, títulos de linha em Syne e o resto na fonte de texto do app; um só desenho de controle segmentado.

## [2026-11-20 02:57] session — F76 em produção: o app no celular, redesenhado
**Branch:** main
Site publicado da `993b317` (`main-CEiz0KA2.js`). No site publicado, a 393 px: barra do topo, barra de baixo com os cinco destinos, Home nova; `css/mobile.css` e as folhas por tela servidas. A prova das telas com dados foi no app local, conta do MJRP. Em curso: crítica de UX independente das telas novas. `## Now` atualizado.

## [2026-11-20 02:55] session — F76: as cinco telas do celular juntas no ramo de integração, provadas a 393 px na conta do MJRP
**Branch:** feat/f76-mobile-redesign
Juntados `feat/f76-mobile-inventory`, `-album-window`, `-playlists`, `-home-blend` e `-albums`, sem conflito; suíte 234 arquivos verdes, lint e build verdes. No navegador, conta do MJRP, 393x852: inventário (linhas, filtros, totais), janela do álbum (título, três fontes numa linha, faixas), ranking (títulos inteiros, Up/Down/Move to, Save fixo), Albums (primeiro álbum acima da dobra, folha de ações nomeadas), playlists gravadas, Home e Blend; nenhuma rola de lado. A 1280x800, Albums e inventário sem nenhum elemento do celular. As notas por tela estão em `screens/`; falta dobrá-las em `info-arch.md`, `behavior.md` e no manual (TASK de documentação aberta).

## [2026-11-20 02:52] session — F76 TASK-05/06: prova em navegador, ajustes do que se viu e a nota da tela
**Branch:** feat/f76-mobile-home-blend
Prova no app de verdade com dados postos pela página (`reports/evidence/F76/harness/home-blend.mjs`, `reports/evidence/F76/home-blend/`): a 393x852 nenhum texto < 12, campo < 16, alvo < 44 nem caixa com rolagem própria; a 1280x800, 0 % de pixels diferentes da base. Ajustes do que se viu: o fundo decorativo da Home escurecia as capas, o selo de ordem, a barra em uma linha, o «Recommended» repetido, a duração do Blend.
Nota da tela: `docs/specs/features/F76-mobile-redesign/screens/home-and-blend.md`. Decidido pelo agente — revisável.

## [2026-11-20 02:52] session — F76 TASK-02: Albums no celular, ajuste visual e prova em navegador (harness)
**Branch:** feat/f76-mobile-albums
Ajustes vistos nas capturas: fonte do sistema no texto dos álbuns, lupa da busca, selos do ladrilho numa linha, vão entre séries, respiro sob o «voltar ao topo», o vazio sem o «no match» junto; alvos de 44 nas fichas, no segmentado e em Pages/Scroll. Harness `reports/evidence/F76/harness/albums.html` (a SeriesView real com 50 séries e 230 álbuns) e `shoot-albums.mjs`.
Medido a 393x852: 1º álbum de 1126 para 261 px, alvos < 44 de 356 para 0, nada passa da borda; a 1280x800 sete cenários idênticos pixel a pixel. Nota da tela em `docs/specs/features/F76-mobile-redesign/screens/albums.md`.

## [2026-11-20 02:51] session — F75 em produção, com valores: 198 de 211 álbuns
**Branch:** main
Site e servidor da `70e63da`; revisão `mjrp-proxy-00213-qpq` com `DISCOGS_TOKEN` vindo do secret. A leitura na conta do MJRP deu valor a 198 de 211 álbuns ($1,166.51 no que ele tem; $339.27 no que falta). O Discogs recusa a sugestão em três estados enquanto a conta não tiver as configurações de vendedor: o valor é o menor preço à venda, e a tela diz isso. Prova: `reports/evidence/F75/2026-11-20-production-proof.md`.

## [2026-11-20 02:49] session — F76 TASK-04: prova em navegador das playlists no celular, e acabamento
**Branch:** feat/f76-mobile-playlists
Arnês com os componentes reais (`reports/evidence/F76/harness/playlists/`) e capturas antes/depois a 393x852 e 1280x800 (`reports/evidence/F76/playlists/`): geradas 3.602 → 1.562 px, gravadas 10.756 → 1.793 px, 0 alvo < 44, sem rolagem interna; computador idêntico. Acabamento visto nas capturas: ficha aberta à vista, fonte do sistema nas linhas, ações da série só com ela aberta, nome do lote inteiro, aviso «info» com fundo (base, `mobile.css` § 9), redesenho só quando celular/computador muda de fato. Nota da tela: `screens/playlists.md`.

## [2026-11-20 02:47] session — F76 TASK-03: a nota da tela e a prova em navegador da janela do álbum e do ranking
**Branch:** feat/f76-mobile-album-window
Nota `docs/specs/features/F76-mobile-redesign/screens/album-window-and-ranking.md` (inventário, estados, decisões e fontes). Prova `reports/evidence/F76/album-window/`: 1280x800 idêntico ao antes pixel a pixel; a 393x852 e 393x660 nada abaixo de 44/12/16 px, 8 e 5 faixas à vista na janela do álbum, 10 e 7 no ranking, nenhum título cortado.
Arrastar por toque provado no Chrome (a alça move, o título rola). Não visto: iPhone de verdade e janelas com login.

## [2026-11-20 02:44] session — F76 TASK-07: testes, nota da tela e prova do inventário no celular
**Branch:** feat/f76-mobile-inventory
15 testes do celular e do computador (`test/views/InventoryView.phone.test.js`), a nota `screens/inventory.md` e a harness com 211 itens (`reports/evidence/F76/harness/`); ajustes de CSS vistos nas capturas (fichas, título, aviso, moeda da edição em segmentos de 48 px).
Prova a 393x852: sem rolagem lateral, 0 texto < 12, 0 campo < 16, 0 alvo < 44 em 13 estados; 150º álbum em 2 gestos. A 1280x800, antes e depois iguais em medidas (pixels: ruído de fonte em 18 px).

## [2026-11-20 02:41] session — F76 TASK-03: ajustes vistos nas capturas e o banco de prova da janela do álbum e do ranking
**Branch:** feat/f76-mobile-album-window
O segmento ligado mantém o alvo de 44 px (a pílula desenhada por dentro), o cabeçalho alinha no topo, os botões de mover cabem, sai o vão herdado da tabela do computador.
Banco de prova `reports/evidence/F76/harness/album-window.*` (as janelas de verdade com dados de exemplo: título longo, 16 faixas, valor do F75) e `reports/evidence/F76/album-window/shoot.mjs` (Chrome sem cabeça, porta própria; mede alvos, texto, campos, faixas à vista, rolagens).

## [2026-11-20 02:36] session — F76 TASK-06: o Blend no celular, e o UAT-217
**Branch:** feat/f76-mobile-home-blend
Blend no celular (`public/css/mobile/blend.css`, `components/blend/BlendSeriesPhonePicker.js`): o passo 1 é uma linha que abre uma folha cheia com busca e as séries (sem caixa de 256 px com rolagem própria), passos com rótulo de 12 px e o atual marcado, receitas numa coluna com a descrição inteira, «Blend it!» na barra de ação, apagado com o motivo escrito. UAT-217: «Blend your Albums» leva a série da página (`SeriesComponentFactory.js`, mudança mínima fora da área).
Testes de celular e de computador; no computador nada muda. Decidido pelo agente — revisável.

## [2026-11-20 02:35] session — F75, documentos: a sugestão recusada e o menor preço à venda

**Branch:** feat/f75-cd-prices-and-where-to-buy

- `plan.md`: a decisão («decidido pelo agente — revisável»), como os três estados voltam, a leitura dos termos para as estatísticas do marketplace (conteúdo do Discogs: atribuição e seis horas; dado do marketplace, tratado como «Restricted Data») e o que não foi verificado.
- `behavior.md` (`^inventory-value-lowest-for-sale`), `info-arch.md` (três estados novos com ID de bloco), `data-model.md` (a base `lowest_for_sale` da leitura; a chave `v2`), `arch.md` (emenda) e `docs/manual/21_Dynamic_UI_Mapping.md`.
- Não verificado: `/marketplace/stats` com o token; quantas das 211 edições têm algo à venda (a de «The Dark Side of the Moon» tinha zero).

## [2026-11-20 02:35] session — F76 TASK-03: a janela do álbum e o meu ranking no celular (código e testes)
**Branch:** feat/f76-mobile-album-window
Janela do álbum: uma rolagem só, barra com fechar sempre à vista, capa como herói com a própria capa desfocada atrás, as três fontes num controle segmentado preso sob a barra, faixa em duas linhas (título sozinho; BEA, Spotify e duração embaixo). Meu ranking: barra Back · My ranking · Reset (Reset desfazível por 5 s), linha com o título em linha própria, mover sem arrastar (tocar na faixa, Up/Down/«Move to…»), arrastar só pela alça, Save preso no pé, o aviso abaixo da barra.
Testes novos: TracksTabs.phone, ViewAlbumModal.phone, UserRankModal.phone (celular e computador). No computador a marcação é a de hoje.

## [2026-11-20 02:34] session — F75, app: o menor preço à venda como valor do Discogs, um aviso só sobre as configurações de vendedor, e as leituras erradas descartadas

**Branch:** feat/f75-cd-prices-and-where-to-buy

- O modelo ganhou a base do valor (`ValueBasis`): a leitura de menor preço é um valor de origem «discogs», nunca chamado de sugestão nem de média. No cartão: «CD · Discogs · lowest for sale»; sem nada à venda: «None for sale on Discogs now». Na janela: «Lowest price for sale on Discogs: $12.93 (37 for sale)», a edição, quando foi lido, «Data provided by Discogs.» e a frase que explica por que não há os três estados.
- Um aviso só na tela: «Discogs suggests prices only to accounts with seller settings filled in. Until then, the values here are the lowest price each CD is for sale at. Fill the settings in at discogs.com/settings/seller: the suggestions are tried again the next time values are read.», com o link. Na faixa dos totais, enquanto for o caso: «Discogs values are lowest asking prices for now.».
- A rodada não pergunta mais a página de preço a cada álbum: o serviço lembra a recusa na memória da página por seis horas e manda `prices: 'lowest'`. Decidido pelo agente — revisável: cada rodada nova tenta a sugestão uma vez, no primeiro álbum; se vier, os três estados voltam sem mudar código.
- A chave das leituras no navegador foi para `inventoryvalue:v2:`: as leituras erradas da primeira rodada em produção não são lidas de volta.
- Testes escritos antes e vistos falhar (14 de 15). Suíte: 2879 testes; lint e build verdes. Um teste de tempo (`inventoryFromSeries`, 200 álbuns em menos de 1 s) falhou uma vez sob carga e passou sozinho.

## [2026-11-20 02:34] session — F76 TASK-05: a Home no celular (o escolhido anda com o dedo)
**Branch:** feat/f76-mobile-home-blend
Home no celular (`public/css/mobile/home.css`, `components/home/HomePhoneChosen.js`): uma coluna que rola com a página, filtros de tipo em duas colunas de 44 px, Visual/Bulk Paste em controle segmentado de 44 px, o álbum tocado ganha anel e número, barra de ação «N albums chosen · Create series» sempre à vista e folha com o conjunto escolhido (subir, descer, remover com «Undo», sem arrastar). Janela de edição da série: lista sem caixa própria, subir/descer no celular, alvos de 44 px.
Testes de celular e de computador (`test/components/home/HomePhone.chosen.test.js`); no computador nada muda. Decidido pelo agente — revisável.

## [2026-11-20 02:33] session — F76 TASK-07: o inventário no celular em linhas compactas, em blocos, com folhas
**Branch:** feat/f76-mobile-inventory
No celular (`isPhone()`), o inventário vira uma linha por álbum (capa de 64, título em duas linhas, status de 44 px que abre uma folha com os três, valor com a origem, «⋯» com as ações nomeadas), desenhada em blocos de 50 com «Show 50 more» e um salto por letra (ou por posição); busca, A–Z, filtros e ações presas sob a barra do topo. `InventoryPhoneRow.js`, `InventoryPhoneSheets.js`, `models/inventoryJump.js`, `css/mobile/inventory.css`.
O computador não muda: `renderComputer` é o desenho de antes.

## [2026-11-20 02:33] session — F76 TASK-02: Albums no celular (filtros numa folha, cartão e linha do álbum com «⋯», cabeçalho da série, pager)
**Branch:** feat/f76-mobile-albums
No celular, a barra de Albums fica só com a busca e um botão «Filters» com quantos estão ligados (fichas que se removem; a vista, a ordem, os filtros e Reload numa folha de baixo); o álbum é um ladrilho (capa, título em duas linhas, artista · ano) ou uma linha compacta de 56 px, com as ações nomeadas numa folha aberta pelo «⋯» de 44 px; o cabeçalho da série quebra o nome e leva o «⋯» de Edit e Delete; o pager de cima é uma linha e o de baixo pula a qualquer página. Achados 1, 2, 7, 8, 19 e 22 da crítica.
Tudo só no celular (`isPhone()` ou `md:hidden`, CSS em `public/css/mobile/albums.css`); o computador fica igual. Testes em `test/components/series/albumsOnThePhone.test.js` (celular e computador).

## [2026-11-20 02:32] session — F76 TASK-04: playlists no celular, uma por vez, e as gravadas fechadas por série
**Branch:** feat/f76-mobile-playlists
`/playlists` no celular: fichas no topo (nome, faixas, duração) abrem uma playlist por vez; as faixas rolam com a página; cada faixa tem «⋯» de 44 px com mover (cima, baixo, topo, fim, para outra playlist) e remover com Desfazer; apagar playlist pergunta antes; Salvar e Exportar (folha com Spotify, Apple Music, JSON) na barra de ação. `/saved-playlists`: série fechada com «n lotes · n playlists», sem ID cru, ações nomeadas de 44 px. Computador sem mudança (marcação só no celular). Testes: `test/components/playlists/PhonePlaylists.test.js`.

## [2026-11-20 02:31] session — F75, servidor: a sugestão recusada por falta de «seller settings» tem nome, e o menor preço à venda entra no lugar

**Branch:** feat/f75-cd-prices-and-where-to-buy

- Produção mostrou: a página de preço do Discogs responde HTTP 404 «You must fill out your seller settings first.» para todo álbum. A fonte passa a reconhecer essa recusa (404, 401 ou 403 com essa frase) e a dizê-la dentro da resposta (`suggestions: 'seller_settings_missing'`), e lê no lugar `GET /marketplace/stats/{id}`: `found` com `kind: 'lowest_for_sale'`, `lowest: { value, currency }` e `forSale`; sem nada à venda, `no_value` com `reason: 'none_for_sale'`.
- Decidido pelo agente — revisável: a recusa vai do lado do sucesso do contrato, como um campo, porque o álbum foi respondido (com um valor mais fraco); não é um código de falha. O servidor não guarda estado: o app que já sabe manda `prices: 'lowest'` e a página de preço não é pedida de novo; sem a dica, a sugestão é tentada, de modo que os três estados voltam sozinhos quando a conta tiver as configurações de vendedor.
- Formato real de `/marketplace/stats/{id}`, lido em 6 pedidos sem token: `{"num_for_sale":124,"lowest_price":{"value":0.53,"currency":"USD"},"blocked_from_sale":false}`; sem nada à venda, `{"num_for_sale":0,"lowest_price":null,…}`; edição que não existe, 404 «Release not found.». A edição de «The Dark Side of the Moon» que a fonte escolhe (5012948) tinha zero à venda nessa leitura.
- Testes do servidor escritos antes e vistos falhar; 459 passando.

## [2026-11-20 02:25] session — F75 em produção: o 404 da página de preço não é «sem edição em CD»
**Branch:** feat/f75-cd-prices-and-where-to-buy
Na primeira leitura na conta do MJRP, 16 de 16 álbuns voltaram «No CD edition found», em cerca de 3 s cada (três pedidos ao Discogs): a busca e as versões funcionam (refeitas sem token: AC/DC «High Voltage» acha a edição 864947) e o terceiro pedido, o do preço, voltou 404, que o servidor lia como «não achado». Conserto: o 404 da página de preço vira «sem valor», com a edição dita, e o que o Discogs escreveu vai para o log; o 404 de uma página de master continua «não achado».

## [2026-11-20 02:20] session — F76 TASK-01: design-system (§ Celular), o plano, o kit das telas e a prova em navegador
**Branch:** feat/f76-mobile-redesign
Criado `docs/specs/design-system.md` § Celular (44 / 12 / 16 px, escala de tipo, barras, folha, áreas seguras, com as fontes: WebKit, MDN, web.dev, WCAG, Apple; achado 24 da crítica). `plan.md` reescrito com cada módulo e seu REQ; `mobile-kit.md` para quem faz as telas (um CSS por tela em `public/css/mobile/`, a API da folha, a barra de ação, o que a base achou e é de cada tela); TASK-01 marcada. Prova: `reports/evidence/F76/2026-11-20-foundation-proof.md` (Chrome sem cabeça a 393x852, 852x393 e 1280x800, antes e depois; fora do celular as medidas de layout são iguais nas 14 telas e nas 5 janelas, e as capturas idênticas a menos de ruído de captura medido). Não visto: iPhone de verdade e telas com login.

## [2026-11-20 02:19] session — F76 TASK-01: a base do celular (barras, folha, medidas mínimas, ícone da tela de início)
**Branch:** feat/f76-mobile-redesign
A base que as telas da F76 vão usar, toda dentro de `@media (max-width: 767px)` (`public/css/mobile.css`) e montada só no celular (`utils/isPhone.js`): barra do topo baixa com o nome da tela, barra de baixo com os cinco destinos, menu em folha (com «Clear album cache» pedindo confirmação), a folha `components/ui/Sheet.js` (tela cheia e de baixo), as janelas que existiam viradas folha pela casca, a página de trás presa, campos a 16 px, texto a 12 px, alvos de 44 px nos botões nomeados, margem de 16 px, `viewport-fit=cover` com áreas seguras, manifesto e ícone quadrado. Teste de arquitetura novo: `test/architecture/phoneStylesStayOnThePhone.test.js`. Decidido pelo agente — revisável: tudo o que é desenho (ver `plan.md`). Vitest 2733 de 2733, ESLint limpo, `vite build` verde.

## [2026-11-20 02:17] session — F75: o interruptor é perguntado de novo quando a pessoa do inventário muda

**Branch:** feat/f75-cd-prices-and-where-to-buy

- Defeito achado na releitura, antes de publicar: ao recarregar a página direto em `/inventory`, a tela abre antes de o login ser conhecido; o interruptor era perguntado sem login, o servidor recusava e a fonte ficava «desligada» até a tela ser aberta de novo.
- Conserto: `controllers/InventoryValues.js` guarda para quem perguntou; quando o inventário passa a ser de outra pessoa (o login chegou, ou a pessoa entrou ou saiu), o que se sabia é esquecido e o interruptor é perguntado de novo, uma vez. A resposta que chega para quem já não está é descartada. Nenhuma leitura do Discogs começa sozinha.
- Teste, escrito junto com o conserto: `test/controllers/InventoryController.values.test.js` («the person became known after the screen opened»). Suíte: 2852 testes; lint e build verdes.
- O `status_sync` não promoveu a S-57 (segue «Backlog»): o nó do requisito não tem `points_to`. Os estados com ID de bloco existem agora no `info-arch.md`; apontar o nó para eles é do processo de requisitos, não foi feito aqui.

## [2026-11-20 02:15] session — F75, documentos: plano, tarefas, spec, comportamento, modelo de dados, arquitetura, estados e manual

**Branch:** feat/f75-cd-prices-and-where-to-buy

- `plan.md` reescrito: os módulos e o requisito que cada um serve, as doze decisões tomadas sem o MJRP («decidido pelo agente — revisável»), a leitura dos termos de uso da API do Discogs e o que não foi verificado. `tasks.md`: seis tarefas de construção e a verificação feitas; uma aberta, do integrador (mapear o segredo, publicar o servidor e depois o site, provar com a conta do MJRP). `spec.md` em `In Progress`, com os estados, os critérios e o que ficou fora.
- `behavior.md` (seção «Inventário»), `data-model.md` (`value` e `discogs` no item; a leitura do Discogs e o câmbio só no navegador), `arch.md` (a fonte de valor, o interruptor, os três nomes novos do contrato) e `info-arch.md` (os estados construídos e os que o protótipo não mostrava, cada um com o seu ID de bloco).
- Manual: `00_Deployment_and_Setup.md` ganhou a seção «2.4b O interruptor dos valores do Discogs», com os comandos de ligar, desligar, ligar de novo e restringir a uma pessoa, e as variáveis `DISCOGS_TOKEN`, `DISCOGS_VALUES`, `DISCOGS_VALUES_FOR` e `VALUE_CALLS_PER_HOUR`; `21_Dynamic_UI_Mapping.md` e as linhas do inventário de três outras páginas.
- Para o MJRP julgar: o valor do Discogs aparece acima dos links da Amazon e da iMusic, e os termos proíbem usar o conteúdo para levar tráfego a outras lojas; sem `DISCOGS_VALUES_FOR`, toda pessoa com conta no app vê preços lidos com o token dele.
- Não verificado: a chamada de preço do Discogs nunca foi feita (exige o token); nada foi publicado. O `doctor.py` segue com os mesmos 522 erros de antes do ramo.

## [2026-11-20 02:08] session — F75, app: o valor do item, a fila de «Update values» e a tela do inventário no padrão da v5.1

**Branch:** feat/f75-cd-prices-and-where-to-buy

- Modelos puros: `models/inventoryValue.js` (o valor de um item: o que a pessoa escreveu, senão uma leitura do Discogs com menos de seis horas, senão nenhum, com o motivo; totais; moedas), `models/inventoryValueRun.js` (o que uma rodada lê, o que cada resposta vale, o que se diz no fim) e `models/buyLinks.js` (o único lugar que monta o endereço de uma loja; nenhum parâmetro de afiliado).
- Serviço `services/inventory/InventoryValueService.js`: pergunta o interruptor e o câmbio ao abrir, guarda cada leitura só no cache do navegador por seis horas (uma chave por pessoa e item) e lê um álbum por vez. No Firestore entram só `value` (o que a pessoa escreveu, em USD) e `discogs` (qual edição foi usada). Nenhum preço do Discogs é gravado.
- Tela: o cartão é uma superfície com cinco linhas iguais em todo cartão; as contagens do cabeçalho são botões que filtram e o seletor de status saiu da barra; a faixa sob o título tem os dois totais e as quatro moedas no lugar de «Total Owned»; «Where to buy» no cartão e na janela; «Sort by» ganhou «Value (↓)» e «Value (↑)»; a janela do álbum ganhou «Estimated value» e «Where to buy».
- Decidido pelo agente — revisável: (1) abrir o inventário não lê nada do Discogs, só conta quantos álbuns esperam e oferece «Read them now»; (2) o preço pago (`purchasePrice`) saiu do cartão e fica na janela do álbum como «Paid:», porque as cinco linhas são do valor estimado; (3) «Sell» e «Trade» aparecem desligados e «Where to buy» do cartão do que é seu é um botão com cara de link; (4) no cartão, a palavra «Discogs» da origem é o link para a página da edição, para cumprir o aviso exigido pelos termos; (5) «Pick an edition on Discogs», do protótipo, não foi construído e não aparece.
- Conferido num navegador de verdade com o CSS do build, sem conta e sem servidor (página estática montada com o desenho da tela): seis cartões com 501 px de altura cada, as cinco linhas com as mesmas alturas em todos, nada transbordando, a 1440 e a 390 px. Falta a prova com a conta do MJRP.
- Suíte: 2851 testes passando; lint e build verdes.

## [2026-11-20 01:45] session — F75, servidor: a fonte de valor do Discogs, o interruptor e o câmbio do dia

**Branch:** feat/f75-cd-prices-and-where-to-buy

- Fonte de valor tipada em `server/lib/valueSources/` (`discogsSource.js`, `discogsParse.js`, `valueSwitch.js`), ao lado das fontes de notas: acha a edição em CD mais comum (a regra de identidade de álbum escolhe o master ou o lançamento; nenhum segundo comparador) e pede a sugestão de preço em três estados. Um pedido por vez, no máximo um por segundo, pela fila educada, que ganhou `pause(ms)` para obedecer ao cabeçalho `X-Discogs-Ratelimit-Remaining`.
- Três rotas: `POST /api/album-value` (pessoa com conta, limite próprio `VALUE_CALLS_PER_HOUR`), `GET /api/value-sources` (o interruptor: `DISCOGS_TOKEN` presente e `DISCOGS_VALUES` diferente de `off`; opcional `DISCOGS_VALUES_FOR`) e `GET /api/exchange-rates` (Frankfurter, guardado em memória pelo dia).
- O contrato de resposta ganhou os desfechos `no_value` e `not_configured` e o código de erro `upstream_unauthorized` (o token foi recusado). Decidido pelo agente — revisável: os nomes que já existiam ficam (`upstream_busy`, `upstream_failed`), em vez de sinônimos novos.
- Nomes de campo conferidos em respostas reais do Discogs (5 pedidos sem token, um a cada 2 a 3 segundos): busca (`results[].type`, `id`, `title` como «Artista - Título», `community.have`, `format[]`) e versões (`versions[].major_formats`, `stats.community.in_collection`, `label`, `country`, `released`). A sugestão de preço exige o token: o leitor foi escrito a partir do formato documentado e nunca chamou a API de verdade.
- Nenhum preço é guardado no servidor depois do pedido (termos de uso da API do Discogs).
- Testes do servidor: 447 passando.

## [2026-11-20 01:37] decision — F76 priorizada, com liberdade de desenho dada pelo MJRP; treze requisitos da crítica de UX
**Branch:** main
O MJRP pediu o redesenho do celular em paralelo com a F75, para ver em produção ao voltar: «total liberdade pra vc na versao mobile, na f76....quero a melhor usabilidade e design na app mobile (sem impactar a versao web)»; «só eu uso app por enqto, por isso te dou essa liberdade criativa … uso o iphone 15 pro». Decidido pelo agente — revisável: o protótipo julgado antes da construção fica dispensado por essas palavras e o juízo dele é no app em produção (TASK-09 aberta); «celular» é até 767 px; a tela de computador não muda (REQ-12); o inventário no celular entra depois da F75.

## [2026-11-20 01:32] decision — F75 priorizada: opção B, com interruptor; UAT-17 resolvida

- Dito pelo MJRP: «sim, gerei o novo antes de copiar. opção B (pra fazer um full teste, depois eu abro outra feature pra desligar o discogs, poderiamos usar feature toggle aqui, o que acha?), priorizando a F75».
- UAT-17 em `fixed`: o token antigo do Discogs parou de funcionar; o novo está só no Secret Manager.
- F75: os treze requisitos estão no `spec.md`. Decidido pelo agente — revisável: o interruptor é do servidor (a fonte de valor responde «não configurada» e o app esconde o que é do Discogs), para ligar e desligar sem publicar código; o valor do Discogs não vai para o Firestore, fica no navegador por até seis horas, por causa dos termos de uso; os três estados são Mint, Near Mint e Very Good Plus.

## [2026-11-20 01:26] session — o MJRP criou o secret `discogs-token` no Secret Manager

- Ele rodou o comando que lê o token da área de transferência; o secret `discogs-token` existe no projeto `mjrp-playlist-generator`, versão 1. O agente não leu o valor. O secret ainda não está ligado ao serviço `mjrp-proxy`: isso se faz quando o código que o usa existir.
- A confirmar com ele: se o token copiado foi o novo (depois de «Generate new token») e não o antigo, que está no histórico do git (UAT-17).

## [2026-11-20 01:24] session — F74 segunda fatia provada; termos da API do Discogs lidos (mudam a F75); o token do Discogs na tela é o do histórico

- F74: «Update ratings» na conta do MJRP depois da segunda fatia: 130 álbuns com nota em todas as faixas (eram 109), 66 em parte (eram 87), 13 sem nenhuma; 2148 de 2612 faixas. UAT-221 em `fixed`.
- Termos de uso da API do Discogs, lidos na página oficial: o preço é dado restrito (uso pessoal, não comercial, sem levar tráfego a outras lojas), vale seis horas para ser mostrado e pede o aviso «Data provided by Discogs.» com link. A F75 como proposta (guardar o valor por 30 dias; links de afiliado ao lado) não cabe nisso. Detalhe no relatório de viabilidade.
- O MJRP mostrou a página de desenvolvedor do Discogs: o token pessoal de lá termina em «BzGd», e esse final aparece no histórico do git (contado sem imprimir). É o token da UAT-17. Nenhum código em uso o lê. Ele perguntou se pode apagar e gerar de novo: pode; «Generate new token» faz as duas coisas.

## [2026-11-20 01:20] decision — F75: o cartão do inventário é a superfície da v5.1 (escolha do MJRP)

- Dito por ele: «yep, a v5.1 é minha preferida tb!». O cartão tem fundo próprio, borda bem fraca e a capa até as bordas; a v5, com borda em volta, fica como registro. Assunto: o cartão de álbum do inventário (identidade visual do app).
- Consequência a decidir: a tela de séries usa um cartão sem fundo; as duas telas ficam diferentes até o das séries seguir este.
- F74, segunda fatia, em produção (servidor `mjrp-proxy-00209-prz`, site de `4350564`): «Close to the Edge» 3 de 3, «Black Rose» 9 de 9, «To Pimp a Butterfly» 16 de 16, «The Chronic» 16 de 16, «Déjà Vu» 10 de 10, «Electric Warrior» 11 de 11, vistos na conta do MJRP.

## [2026-11-20 01:17] session — F75: v5.1 (o cartão como superfície) para o MJRP comparar com a v5 (a borda)

- A pedido dele. `design/inception/inventory-value-v5.1.html`; no comparador as duas ficam lado a lado. A escolha é dele.
- F74, segunda fatia: juntada na `main` (`4350564`); o servidor e o site estão em publicação.

## [2026-11-20 01:14] session — F74, segunda fatia: o título com as suas partes, e as faixas que seguiam sem nota

**Branch:** fix/f74-track-titles-second-slice

- Depois de publicada a primeira fatia, o «Update ratings» em produção mostrou uma regressão: Yes «Close to the Edge» caiu de 3 faixas com nota para 1 (o Apple Music numera as partes depois dos dois-pontos, a fonte não).
- Lidas 16 páginas da fonte (29 pedidos). Cada faixa da lista do integrador foi conferida contra a página: `reports/evidence/F74/2026-11-20-track-identity-second-measure.md`.
- A regra foi para a versão 2: quatro degraus com nome (`title-with-its-parts`, `first-of-titles-listed-together`, `letters-starred-out`, `title-in-its-brackets`), o que é só escrita (número por extenso, «A» no começo, «-in'», «a.k.a.») e duas escritas conhecidas. Nenhum aceita por «um contém o outro».
- Três causas fora da regra: a regra lia o lugar na lista como número da faixa, e o app manda a lista na ordem das notas («My Sarah»); o leitor da página pulava títulos de uma letra («u», «i») e cortava «2:» de «2:45 AM».
- Segunda medida, 16 álbuns: 127 faixas com nota na versão 1, 149 depois; as 14 que ficam sem não estão na página, ou são a segunda de duas faixas que a página lista juntas. A primeira medida não mudou (102).
- Não lidos, pelo teto de pedidos: nove álbuns da lista. Não visto num navegador; não publicado.


## [2026-11-20 01:13] decision — F75: um padrão único para as seções do cartão do inventário (v5)

- Dito pelo MJRP: «deveríamos ter um padrao e alinhamento entre seções». A v5 do protótipo dá a cada seção o mesmo número de linhas em todo cartão; medido a 1440 px, as seções ficam alinhadas entre vizinhos. O padrão está escrito em `docs/specs/info-arch.md`, § Decisões de IA.

## [2026-11-20 01:10] decision — F75: uma borda no cartão inteiro liga a capa às informações (v4)

- Dito pelo MJRP: «e a borda conectando a capa com as infos?». A v4 do protótipo (`design/inception/inventory-value-v4.html`) tem a borda em volta do cartão inteiro, o bloco de valor sem caixa própria e «Where to buy» ao lado de «Sell» e «Trade». O comparador (Artifact) mostra a v4 como a nova.

## [2026-11-20 01:08] session — F75: «Where to buy» ao lado de «Sell» e «Trade», na prévia

- Pedido do MJRP: no cartão do álbum que ele tem, um botão «Where to buy» que abre a janela do álbum, onde estão os links. Está na prévia das três formas de segurar o cartão; entra no protótipo com a escolha dele.

## [2026-11-20 01:08] session — F75: prévia de três formas de segurar o cartão (o bloco de valor parecia solto)

- O MJRP achou que falta uma borda ligando o cartão da v3. Prévia em `design/proposals/inventory-card-border-proposal.html` e no comparador: A, só distância; B, borda no cartão inteiro; C, o cartão como superfície. Recomendação do agente: B. O protótipo espera a escolha dele.

## [2026-11-20 01:04] review — crítica de UX das telas no celular (F76)

- Relatório: `reports/audits/2026-11-20-mjrpalbumblender-v0-mobile-ux-audit.md`, por um auxiliar que não construiu as telas, pela skill `mjrp-critiquing-ux-ui`; em emulação de celular, sem aparelho de verdade.
- 3 P0, 12 P1, 9 P2. Os três P0: a lista de séries tem dezenas de milhares de pixels de altura; a tela de séries rola de lado e empurra «Edit» e «Delete Series» para fora; a janela do álbum mostra o título cortado («B.») e só uma ou duas faixas.
- O relatório separa 11 consertos de layout que não dependem de redesenho, e propõe a ordem do redesenho.

## [2026-11-20 01:04] session — F74, primeira fatia, provada em produção; regressão achada e segunda fatia aberta

- Servidor `mjrp-proxy-00208-kzm` e site `8efa91c` publicados. Na conta do MJRP: «In the Court of the Crimson King» com as cinco originais com nota e as extras sem; «High Voltage» 9 de 9, pela página da edição internacional.
- Medida do inventário depois de «Update ratings»: 109 álbuns com nota em tudo, 87 em parte, 13 sem nenhuma; 2106 de 2612 faixas.
- Regressão: «Close to the Edge» de 3 de 3 para 1 de 3 (título seguido da lista das suas partes). Segunda fatia aberta com os exemplos reais; a UAT-221 segue `open`. Prova: `reports/evidence/F74/2026-11-20-production-proof.md`.

## [2026-11-20 01:02] decision — F75: o MJRP escolheu o cartão «Transformar» com «Where to buy» em links, e as contagens como filtro

- Dito por ele: «A opcao é transformar mas na parte do where to buy, quero um merge do elevar (O label WHERE TO BUY) com os links em laranja do consolidar»; e «concordo com a proposta de torná-los filtros».
- A v3 do protótipo (`design/inception/inventory-value-v3.html`) tem as duas decisões; a prévia dos três níveis fica em `design/proposals/inventory-card-proposal.html`; o comparador (Artifact) mostra a v3 como a nova.
- F74: servidor publicado (`mjrp-proxy-00208-kzm`) e site publicado (`8efa91c`); a prova na conta do MJRP está em andamento.

## [2026-11-20 00:55] session — F72: a contagem de álbuns vai para a paginação e conta o que está na tela

**Branch:** feat/f72-albums-count-in-the-pager

- Julgamento do MJRP: «o # de albuns deveria ser o contador do que temos na pagina ou no scroll antes de carregar mais, carregou mais atualizar o numero de albuns … onde vc colocou creio que fica redundante, eu removeria». A linha do cabeçalho saiu; a paginação diz «Showing 1–20 of 48 series · 97 albums».

## [2026-11-20 00:52] session — F75: prévia do cartão em três níveis; S-58, F76 e UAT-223 (o app no celular); candidato «rede de colecionadores»

- O MJRP reagiu à v2 da F75: as contagens parecem botões, as informações do cartão ficam soltas, o valor parece preço de venda, comprar está escondido. Prévia em três níveis (Consolidar, Elevar, Transformar) em `design/proposals/inventory-card-proposal.html` e no comparador; o protótipo só muda depois da escolha.
- Dito por ele: a versão no celular é ruim e pede redesenho, com crítica de UX antes. Registrado: UAT-223, S-58 (EP-06) e F76, via padrão.
- Dito por ele: o app pode virar uma rede de apaixonados por álbuns e colecionadores, com vender e trocar. Não havia registro neste repositório; entrou como candidato no PRD.

## [2026-11-20 00:48] session — F74: uma regra só diz qual faixa recebe cada nota

**Branch:** fix/f74-track-ratings-reach-the-right-tracks

- Pedido do MJRP ([[uat#^UAT-221]]): «o que quero são o ratings das originais mesmo»; e o alcance, dito depois: «não só das edicoes ampliadas, mas dos albuns que nao tiverem todas as faixas com ratings».
- Investigado antes do desenho: as páginas do BestEverAlbums dos 12 piores álbuns do inventário, lidas pelo leitor do próprio servidor (28 pedidos, um a cada 4 segundos). Das 103 faixas sem nota: 83 não têm nota na fonte, 12 são a mesma faixa escrita de outro jeito, 7 são do «High Voltage» (a busca pegava a página do disco australiano), 1 tem outro nome na fonte, nenhuma por falha do leitor. E 12 notas estavam em duas faixas ao mesmo tempo.
- Construído: `shared/trackIdentity.js`, a regra de identidade de faixa, com cinco degraus com nome e a distribuição de uma nota para uma faixa (`matchTracks`). Os lugares do servidor e do app que comparavam títulos de faixas passaram a perguntar a ela; `shared/normalize.js`, `utils/NormalizationUtils.js` e quatro limpadores de `server/lib/normalize.js` saíram.
- O degrau «nunca é a mesma» do esboço não entrou como estava: com ele «Live At The Apollo (1962)» cairia de 7 faixas com nota para nenhuma. A faixa com marca de outra versão fica no degrau mais fraco; a original pega a nota antes.
- O raspador escolhe, pelas faixas, entre duas páginas com o nome do álbum (`pageOfTheEdition`).
- As notas guardadas no navegador de antes da regra são pedidas de novo, uma vez (`trackRule` na resposta do servidor e no registro).
- Medida nos 12 álbuns: 96 notas antes (82 na faixa certa), 102 depois, de 105 que as páginas têm. `reports/evidence/F74/2026-11-20-track-identity-measure.md`.
- Suíte de 2623 testes, lint e build verdes. Não visto num navegador; o servidor não foi publicado.
- Aberto: «Lost Someone (Live 1962)» fica sem nota (a fonte dá nota a duas metades); «Before the Frost... Until the Freeze» segue sem página, pela regra do álbum (F68).


## [2026-11-20 00:41] session — F75: o comparador publicado como Artifact do Claude

- A pedido do MJRP, o comparador do inventário é um Artifact privado: https://claude.ai/artifact/R6r5dLJ48JXJZDSRy6T5Ck. Tela de hoje, v2 e v1 autocontidas, com as capas embutidas.

## [2026-11-20 00:37] session — UAT-222 em produção; `## Now` em dia

- O conserto das capas foi juntado na `main` (`75e0176`) e o site publicado (pacote `main-DHmNr6iC.js`).
- `## Now` atualizado com a F75 (proposta, protótipo v2, comparador) e o que ela espera do MJRP.

## [2026-11-20 00:36] session — F71: o item do inventário sem capa ganha a capa do álbum (UAT-222)

**Branch:** fix/f71-inventory-item-gets-its-cover

- «Update ratings» grava a capa do álbum carregado no item que não tinha nenhuma (`albumData.coverUrl`), e diz quantos ganharam («14 albums got their cover.»). A janela do álbum mostra a capa que chega. Uma capa que o item já tem não é trocada.
- Na conta do MJRP: 15 sem capa antes, 1 depois («No Quarter», que a carga não acha). UAT-222 em `fixed`.

## [2026-11-20 00:34] session — UAT-222 registrada na F71: álbuns do inventário sem capa

- O MJRP viu, em produção, capas faltando no inventário que aparecem na lista de séries. Contado: 15 de 211 itens sem capa, todos vindos de séries cuja entrada não guarda o endereço da capa. UAT-222 aberta; REQ-22 na F71.

## [2026-11-20 00:34] session — F75: protótipo v2 fiel à tela real, comparador e `info-arch.md`

- O MJRP pediu o protótipo fidedigno e o comparador da skill. A v2 é a tela real do inventário capturada como o app a desenha, com o que a F75 propõe; a v1 fica para comparar. O comparador (`design/proposals/inventory/comparator.html`) põe a tela de hoje ao lado das versões.
- `docs/specs/info-arch.md` nasceu com esta feature, descrevendo só a tela do inventário com valor: a trava do protótipo exige o `info-arch` e os wireframes da versão no mesmo commit.
- Proposta: `design/proposals/f75-inventory-value/proposal.md`. Notas: `docs/specs/inception-notes.md`.

## [2026-11-20 00:26] session — F75: proposta e protótipo da rodada 1 (valor estimado do inventário e onde comprar)

- A pedido do MJRP: `design/proposals/f75-inventory-value/proposal.md` e `design/inception/inventory-value-v1.html` (modo explorar, valores ilustrativos, sete cenários). A proposta cobre como um álbum entra no inventário e ganha valor, e o que acontece quando o status muda para «Owned».
- Notas da rodada em `docs/specs/inception-notes.md`. Sem ramo: a F75 espera a reação dele, as respostas e a prioridade.

## [2026-11-20 00:22] session — F75: respostas do MJRP (conta do Discogs, três estados e a média, a edição mais comum, quatro moedas)

- O MJRP aceita ligar um token da conta dele do Discogs; quer o valor de três estados e a média; começa pela edição mais comum; moedas USD, EUR, GBP e BRL, com o câmbio do dia.
- Rumo dito por ele: o inventário ganha foco de colecionador e pede um benchmark de apps de controle de coleção (CDs, vinis, fitas). Fica como candidato no PRD.
- Conferido: `api.frankfurter.app` dá o câmbio do dia sem chave. Não conferido: os termos de uso da API do Discogs.

## [2026-11-20 00:14] session — F75: o propósito é estimar o valor do inventário, com o preço automático e editável à mão

- Dito pelo MJRP: «a ideia do preço médio é para colecionadores como eu, ter uma estimativa de valor do seu inventory, podendo alterar os valores na mao, como hj já é, a questao agora é automatiza a obtencao do preço e se quiser vc edita».
- Gravado no nó S-57 e na spec da F75, com o que isso decide no desenho: o valor tem origem (loja ou pessoa), o que a pessoa escreveu não é trocado, e o total diz quantos itens entraram.

## [2026-11-20 00:14] session — S-57 e F75 registradas (preço de CDs e onde comprar); viabilidade conferida antes

- Pedido do MJRP: preço médio dos CDs do inventário na Amazon, no Discogs e na iMusic, com link de compra, pensando em afiliação; via padrão, com protótipo e a skill de UI; «verifique a viabilidade antes de mais nada».
- Viabilidade: `reports/audits/2026-11-20-mjrpalbumblender-v0-cd-prices-feasibility.md`. Links de compra viáveis nos três. Preço: o Discogs dá o menor preço e a quantidade à venda sem login (conferido com pedidos à API); a Amazon só abre preços para afiliado com vendas; a iMusic recusou o pedido automático e não tem interface pública.
- S-57 no PRD (EP-07) e F75 na `main`, `lane: standard`, em esboço. Sem ramo: espera as respostas dele, o protótipo e a prioridade.

## [2026-11-20 00:11] session — F74 começada depois de priorizada; `## Now` em dia

- O MJRP priorizou a F72 e a F74. A F72 está em produção. A F74 foi passada a um auxiliar com o desenho definido: uma regra de identidade de faixa em `shared/`, no molde da de álbum, e a investigação do leitor da página do BestEverAlbums. A integração, a publicação do servidor e a prova ficam com o integrador.

## [2026-11-20 00:10] decision — o MJRP dispensou o protótipo dos consertos e das melhorias pequenas (F45 a F73)

- Dito por ele: «eu dispenso prototipo por que estávamos arrumando e consertando problemas passados com pequenas melhorias e nao trabalhando em grande features nova, portanto por ora os prototipos estao dispensados.»
- A frase foi gravada no `spec.md` de cada feature da via rápida da F45 à F73, com a data e a hora, como a linha de protótipo do passo retroativo pede. Fecha só essa linha: a reconferência visual e o fecho com o Touch ID seguem como estavam.
- F72 juntada na `main` (`b467468`) e publicada (pacote `main-D6RgK065.js`): contagem de séries e álbuns no cabeçalho e a caixa da paginação também no topo.

## [2026-11-20 00:09] session — F72: a caixa da paginação também no topo da lista de séries

**Branch:** feat/f72-albums-screen-says-how-many

- Pedido do MJRP: «aproveite ao fazer a 72, pra trazer a caixa da paginacao para aparecer no topo tb». A mesma caixa aparece acima e abaixo da lista; «Load N more» e o aviso de álbuns não conferidos ficam só na de baixo, para a de cima não pedir mais séries só por estar à vista.
- Dispensa de protótipo dita pelo MJRP e gravada no `spec.md`: «eu dispenso prototipo por que estávamos arrumando e consertando problemas passados com pequenas melhorias e nao trabalhando em grande features nova, portanto por ora os prototipos estao dispensados.»

## [2026-11-20 00:06] session — F72: a tela de séries diz quantas séries e quantos álbuns tem (S-55), depois de priorizada

**Branch:** feat/f72-albums-screen-says-how-many

- O MJRP priorizou a F72; o ramo voltou ao nome da convenção e o trabalho pronto desde 2026-11-20 foi commitado: `models/seriesCounts.js`, a linha de contagem no cabeçalho («47 series · 227 albums», «2 of 47 series · 4 albums», «5 albums»), os testes e os documentos.

## [2026-11-20 00:05] session — F71: o comportamento e o manual dizem a ordenação nas duas direções

**Branch:** feat/f71-inventory-sort-both-ways

- `docs/specs/behavior.md` e três páginas do manual atualizados com as oito escolhas do «Sort by».

## [2026-11-20 00:05] session — F71: a ordenação do inventário nas duas direções, com setas (REQ-21)

**Branch:** feat/f71-inventory-sort-both-ways

- O seletor «Sort by» passa a oferecer cada critério nas duas direções, no molde da lista de séries: «Artist (A-Z)», «Artist (Z-A)», «Avg Rating (↓)», «Avg Rating (↑)», «Avg Pop (↓)», «Avg Pop (↑)», «Newest», «Oldest». Um item sem valor fica no fim nas duas direções.
- Decidido pelo agente — revisável: os nomes ficaram «Avg Rating» e «Avg Pop», os mesmos do cartão; o MJRP falou em «Ranking».

## [2026-11-20 00:04] session — F71: REQ-21 registrada (ordenação do inventário nas duas direções, com setas)

- Pedido do MJRP: «o filtro/ordernacao do inventory pode ser Ranking e poderáimos ter como no albums series a opcao ascendente e descendente do ranking com as setinhas, mesmo padrao da ordenacao no albums series list».
- A lista de séries oferece cada critério em duas opções do mesmo seletor («# of Albums (↑)», «# of Albums (↓)»); o inventário segue o mesmo molde.

## [2026-11-20 00:02] session — F71: o cartão diz de quantas faixas a média saiu; medida de partida da F74

**Branch:** feat/f71-card-says-how-many-tracks

- O cartão do inventário mostra «Avg Rating: 90 (2 of 8) · Avg Pop: 59.5% (6 of 8)». `averages.tracks` guarda o tamanho do álbum. «Update ratings» rodou de novo na conta do MJRP para preencher.
- Medida de partida da F74, tirada do inventário: 84 de 209 álbuns com nota em só parte das faixas, 13 sem nenhuma. O MJRP alargou o alvo: todo álbum com faixas sem nota, não só as edições ampliadas.

## [2026-11-20 00:00] session — UAT-221 e F74 registradas (a nota chega à faixa certa); REQ-20 na F71 (de quantas faixas saiu a média)

- O MJRP respondeu à pergunta da média tirada de poucas faixas: «mostrar, mas precisamos melhorar o algoritmo do BEA pra que ele encontre a media das faixas». O cartão vai dizer de quantas faixas a média saiu (F71, REQ-20).
- Causa do casamento parcial, lida no código e na página do BestEverAlbums que ele indicou: `normalizeKey` apaga todo parêntese. UAT-221 aberta; F74 criada na `main`, via rápida, conserto. Sem ramo até ele priorizar.

## [2026-11-19 23:55] decision — F72: o ramo foi renomeado para fora da convenção, para o cartão voltar a ser arrastável

- O MJRP não conseguia arrastar a F72: o cartão aparecia «em andamento». O agente mestre do harness explicou (`rules/delivery.py`; CC-ADR-0029 e CC-ADR-0056): um ramo aberto com o nome da convenção (`feat/f72-…`) conta como começo, e feature começada não se ordena.
- O ramo `feat/f72-albums-screen-says-how-many` virou `wip-f72-albums-screen-says-how-many`; o commit `57667c2` e o trabalho em staging ficaram como estavam. Depois que o MJRP salvar a ordem, o ramo volta ao nome da convenção e o trabalho é commitado.
- Regra daqui em diante: o ramo de uma feature só nasce depois que ela está na «Priorizada».

## [2026-11-19 23:54] session — F71: a janela do item faz o mesmo pedido da tela de álbuns (as três fontes)

**Branch:** fix/f71-item-window-same-ask

- O MJRP perguntou: «pq a janela de faixas do inventory carrega algo diferente da tela do albums list? nao deveria ser a mesma chamada?». A janela pedia duas fontes; passa a pedir as três (`ENRICHMENT_SOURCES`), com o ranking da pessoa. Visto no navegador: «My Avg: 5.5» em «The Dark Side of the Moon».

## [2026-11-19 23:51] session — UAT-220 em produção

- O conserto da janela do álbum no inventário foi juntado na `main` (`43d12b6`) e o site publicado (pacote `main-ASxeeVdk.js`).

## [2026-11-19 23:50] session — F71: a janela do álbum no inventário pede o álbum à carga e mostra as faixas (UAT-220)

**Branch:** fix/f71-inventory-window-shows-tracks

- Decidido pelo agente — revisável: o inventário não guarda faixas; a janela de um item pede o álbum pela porta única da carga (`albumAsks.albumsOf`, pelo `InventoryService.albumOfItem`) e mostra o que chega. O que o item guarda aparece na hora e dá lugar ao álbum de agora.
- Visto no navegador com os três álbuns das capturas do MJRP. UAT-220 em `fixed`.

## [2026-11-19 23:48] session — UAT-220 registrada na F71: a janela do álbum no inventário não mostra as faixas

- O MJRP mostrou, em produção, a janela de dois álbuns que vieram das séries dizendo «No tracks are kept for this album…», e a de um item antigo com a popularidade «Not linked». UAT-220 aberta; entra na F71 como REQ-19.

## [2026-11-19 23:45] session — F71 fatia 2 e a barra do topo em produção; `## Now` em dia

- Juntadas na `main` e publicadas: a barra do topo (`cbd96fa`, UAT-218) e a segunda fatia da F71 (`61d4061`). Pacote no ar: `main-J7MPEtWh.js`.
- Abertas: UAT-216 e UAT-217. A F72 segue pronta e à espera de prioridade.

## [2026-11-19 23:44] session — F71, segunda fatia (S-56): notas no inventário provadas e executadas na conta do MJRP

**Branch:** feat/f71-inventory-averages-2

- Decisão de arquitetura (decidido pelo agente — revisável): as duas médias ficam gravadas no item do inventário (`averages`), porque o cache de álbuns do navegador vale 7 dias e é guardado pela consulta da série. «Update ratings» pede os álbuns pela única porta da carga (`albumAsks.albumsOf`) e casa cada álbum com o item pela regra de identidade.
- «Avg Rank» saiu do cartão do álbum e deu lugar a «Avg Rating» (opção A, do MJRP).
- Rodou na conta dele: 209 de 211 álbuns com médias, em cerca de 25 segundos. Prova: `reports/evidence/F71-inventory-holds-every-album-of-my-series/2026-11-19-ratings-in-the-inventory-proof.md`.
- A saber: dois álbuns têm a nota tirada de menos de três faixas (edições ampliadas); o cartão não mostra de quantas faixas a média saiu.

## [2026-11-19 23:41] session — F63: a barra do topo cabe na tela em toda largura (UAT-218)

**Branch:** fix/f63-top-bar-fits

- Os nomes da conta e do Spotify encolhem antes de a barra passar da tela (`navigation/barName.js`: `min-w-0` da barra até o nome); a barra vai a 1400 px a partir de 1280; abaixo de 1280 o botão do Spotify mostra só o ícone; abaixo de 1024 os links vão para o menu lateral (era 768, e os links não cabiam).
- Visto a 375, 800, 1024, 1280, 1440 e 1680 px: sem rolagem horizontal. UAT-218 em `fixed`.

## [2026-11-19 23:40] session — F71, segunda fatia: o inventário guarda, mostra e ordena pelas médias «Avg Rating» e «Avg Pop»

**Branch:** feat/f71-inventory-averages-2

Auxiliar sem navegador e sem conta: nada rodou contra dados reais; a prova na tela e a execução na conta do MJRP são a TASK-17, do integrador. A decisão do MJRP (2026-11-19): «opção A e to achando que o AVG rank nao faz sentido pra mim, poderia trocar por AVG Rating tb».

- **O modelo das médias** (`public/js/models/albumAverages.js`): «Avg Rating» (média da nota do BestEverAlbums das faixas, nota maior que zero) e «Avg Pop» (média da popularidade do Spotify, zero ou mais), uma casa decimal, `null` sem dados; a mescla das faixas é a que a comparação de faixas já fazia (`mergedTracksOf`). A comparação de faixas do álbum (`TracksTable`) troca «Avg Rank» por «Avg Rating»; `TracksRankingComparison.getAverages` não tinha chamador e saiu, e saiu também a exceção de complexidade da função de mescla.
- **O item guarda** `averages: { rating, popularity, ratedTracks, popTracks, at }` (`data-model.md`). **«Update ratings»** (`#updateRatingsBtn`): um pedido a `albumAsks.albumsOf` (fontes `acclaim` e `popularity`) com uma consulta por item; cada álbum pronto volta ao item por `findInInventory`; as médias vão em partes de 100 por `BaseRepository.updateMany` / `InventoryRepository.setAverages`; uma média que a fonte não deu mantém o valor anterior; pergunta antes com mais de 30 álbuns; progresso no botão; o pedido é abortado ao sair da tela; o fim diz quantos ganharam notas, quantos não foram achados e, se for o caso, «Spotify is not connected: popularity was not read for N albums.»
- **A ordem** (`#inventorySort`): Artist, Avg Rating, Avg Pop, Recently added; o item sem valor vem por último nas duas direções; «Recently added» lê `addedToInventory` (ou `createdAt`), carimbo do Firestore ou data. **O cartão** mostra a linha das médias, ou nada.
- **Achado:** o roteador chama `destroy()` ao sair da tela e `InventoryView` só tinha `onUnmount()`, que ninguém chamava (a assinatura da loja ficava ligada). `destroy()` agora chama `onUnmount()`, que também aborta o pedido.
- **Não feito, por escolha:** um filtro por nota mínima («filtro/ranking»). Está nas Open Questions do `spec.md`, com o que ele pediria.
- Documentos: `spec.md` (REQ-11 a REQ-18), `plan.md`, `tasks.md` (TASK-12 a TASK-16 feitas; TASK-17 aberta, do integrador), `behavior.md` (`^inventory-ratings-updated`, `^inventory-order`, `^inventory-item-card`, `^album-track-table`), `data-model.md`, o nó S-56 e as páginas do manual que citavam «Avg Rank» ou descrevem o inventário. Suíte: 200 arquivos, 2439 testes verdes; `eslint` e `vite build` limpos.

## [2026-11-19 23:39] session — a rolagem mantida em produção; `## Now` reescrito

- A correção da UAT-219 foi juntada na `main` (`0c0df5e`) e o site publicado (pacote `main-DLZf9BMM.js`).
- `MEMORY.md ## Now` reescrito com o estado de hoje: F71 fatia 1 e F73 em produção; F71 fatia 2 com um auxiliar; F72 à espera de prioridade; UAT-216 a UAT-218 abertas.

## [2026-11-19 23:38] session — F73: a tela redesenhada mantém a rolagem (UAT-219)

**Branch:** fix/f73-redraw-keeps-the-place

- `utils/keepField.js` guarda a rolagem da janela antes do redesenho e a repõe depois. No inventário, mudar o status não leva mais a lista ao topo. UAT-219 em `fixed`.

## [2026-11-19 23:37] session — F73 em produção; UAT-219 registrada (o inventário volta ao topo ao mudar o status)

- A F73 foi juntada na `main` (`0db59f6`) depois de o MJRP priorizá-la, e o site foi publicado. Quem tinha a aba aberta precisa recarregar uma vez: a guarda contra versão antiga só existe a partir desta publicação.
- O MJRP relatou: no inventário, mudar o status de um álbum leva a tela ao topo. UAT-219 aberta; entra na F73 como REQ-05 (é o mesmo redesenho inteiro da tela).

## [2026-11-19 23:34] session — F73: o campo em uso sobrevive ao redesenho; a aba antiga recarrega; a tela antiga de geração saiu; o inventário se solta

**Branch:** fix/f73-screens-keep-the-field

- Decisão de arquitetura (decidido pelo agente — revisável): três regras, cada uma num lugar só. `utils/keepField.js` devolve o campo em uso depois de um redesenho inteiro; `installStaleBuildGuard` protege todo arquivo pedido sob demanda, não só a troca de tela; a inscrição de uma tela numa loja vai em `this.subscriptions` da `BaseView`, com um teste de arquitetura que guarda isso.
- UAT-212 a UAT-215 em `fixed`. Prova: `reports/evidence/F73/2026-11-19-screens-keep-the-field-proof.md`.
- Fica de fora, anotado: a tela de playlists ainda se redesenha inteira a cada aviso das lojas; um clique no instante de um redesenho pode se perder.
- O MJRP exportou de verdade em produção para o Spotify (30 de 30 faixas) e para o Apple Music (na pasta da série): «sem o problema do campo funcionam os exports apple e spotify».

## [2026-11-19 23:34] review — reconferência visual de F56, F58, F60, F63, F65 e F70 por quem não implementou; três achados viram issues

- Relatórios: `reports/audits/2026-11-19-mjrpalbumblender-v0-f56-visual-parity-recheck.md` e os de F58, F60, F63, F65 e F70, na mesma pasta. Feitos por um auxiliar que não implementou nenhuma das seis.
- Veredito: F56, F58, F65 e F70 passam. F60 e F63 reprovam sem P0; os três P1 viraram UAT-216 (playlists salvas no celular), UAT-217 («Blend your Albums» sem a série) e UAT-218 (barra do topo mais larga que a tela com o Spotify conectado).
- O que não foi conferido está dito em cada relatório: tudo que exigia gravar, apagar, gerar, sair ou conectar.
- F62: as exportações reais foram feitas pelo MJRP em produção («sem o problema do campo funcionam os exports apple e spotify»); a TASK-13 está marcada com essa prova.
- F73 pronta e provada no ramo `fix/f73-screens-keep-the-field`, sem commit: a trava de prioridade recusou («a F73 não está na Priorizada»). Fica à espera do MJRP, como a F72.

## [2026-11-19 23:29] session — UAT-212 a UAT-215 e F73 registradas: campo que perde o foco, exportar numa aba antiga, tela antiga de geração, inventário que não se solta

- O MJRP testou a exportação (F62) em produção e relatou: o «Batch Name» perde o foco ao digitar; depois os botões de exportar não respondem; recarregar sem salvar mostra uma tela antiga de geração.
- Causas lidas no código e vistas no navegador: a tela de playlists é redesenhada inteira a cada aviso de três lojas (UAT-212); a recarga por versão antiga só protege a troca de tela, e o site foi publicado enquanto ele testava (UAT-213); `/playlists` sem playlists ainda desenha as configurações antigas (UAT-214).
- Achado ao varrer os campos: a tela do inventário nunca se solta da loja e se desenha por cima de outra tela (UAT-215, aberta pelo agente).
- F73 criada na `main`, via rápida, conserto.

## [2026-11-19 23:22] session — F71 em produção; a F49 provada pelo MJRP em produção

- A F71 (primeira fatia) foi juntada na `main` (`63793a4`) e o site publicado: pacote `main-BfgCsm6G.js`. O servidor não mudou (`mjrp-proxy-00207-lhz`).
- O MJRP testou a F49 em produção: «f49: testando em prod, all good». O clique em «Load 3 more albums» mostrou os três álbuns restantes de uma série de 15, e o botão sumiu. A TASK-06 da F49 está marcada com essa prova.

## [2026-11-19 23:21] session — F71: provada no navegador e executada na conta do MJRP; ordem do inventário por artista e título

**Branch:** feat/f71-inventory-holds-every-album-of-my-series

- A ação «Add the albums of my series» rodou na conta do MJRP, a pedido dele: 23 álbuns antes (6 Owned, 16 Not Owned, 1 Wishlist), 188 acrescentados como Not Owned, 211 depois (6 / 204 / 1). Os 23 de antes ficaram iguais; a segunda execução não gravou nada. Prova: `reports/evidence/F71-inventory-holds-every-album-of-my-series/2026-11-19-browser-proof-and-owner-account-run.md`.
- Decidido pelo agente — revisável: a grade do inventário ordena por artista e depois por título (`public/js/models/inventorySort.js`); antes ordenava por um campo que os itens não têm. «1 album» no singular.
- O MJRP escolheu a opção A para a S-56 (2026-11-19): «opção A e to achando que o AVG rank nao faz sentido pra mim, poderia trocar por AVG Rating tb». O «Avg Rank» sai também do cartão do álbum e dá lugar ao «Avg Rating». É a segunda fatia da F71.

## [2026-11-19 23:13] session — F71: o manual diz o inventário como ficou

Branch: `feat/f71-inventory-holds-every-album-of-my-series`, depois do commit `c1f2821`.

As frases do manual que deixaram de ser verdade com a F71, corrigidas onde estavam, sem arquivo novo: `21_Dynamic_UI_Mapping.md` (seção 6: a situação por `models/inventoryStatus.js`, o filtro, as três contagens, a ação «Add the albums of my series» passo a passo), `14_Frontend_Components_Feature_Map.md` (inventário), `09_Frontend_Views.md` e `10_Frontend_Renderers.md` (cabeçalho, filtros, botão, cartão sem formato e sem preço), `11_Frontend_Components_Root.md` (a janela do álbum mostra o que é do item; «Not set» na janela de editar), `07_Frontend_Data_Infra.md` (`planSeriesAlbums`, `addAlbumsAsNotOwned`, `addBatch`, `createMany`) e `08_Frontend_Models.md` (os três modelos novos; `inventoryFromSeries.js` entre os que perguntam à regra de identidade). O commit do código também registrou, pelo gancho de status, o nó S-54 em «In progress».

## [2026-11-19 23:13] session — F45 a F70: tarefas provadas marcadas e declarações do passo retroativo; nenhuma feature fechada ainda, salvo a F53

Passada de limpeza dos `tasks.md` das F45 a F70 (menos a F66; F71 e F72 intocadas), sem tocar em código. Cada linha aberta foi decidida com prova: as provas do integrador com arquivo em `reports/evidence/` ou entrada do log foram marcadas (`rounds:: 1`, caminho da prova na linha; o que a prova diz «não visto» não foi mexido); as linhas de documentação foram marcadas quando conferidas no repositório; a conferência cruzada da spec e do plano foi feita por script. O que só diz «o MJRP julga ou aceita» saiu da lista de tarefas e foi para `## For the owner at UAT`, no fim de cada `tasks.md`. Nos `plan.md` das 19 features que fechariam, o `## Documents Consulted` ganhou a declaração de cada documento («atualizado» com o commit, ou «sem mudança» com o motivo), conferida no histórico de commits que citam a feature. Só a F53 passa no `retro_step_check` e fica `Done`. As outras 18 seguem `In Progress` com uma linha aberta (o passo retroativo): faltam «Prototype: none» dito pelo MJRP e o ok visual dele (ou o relatório de reconferência visual, nas features da trilha Agente). Também seguem abertas por falta real: F49 (clique do botão sem prova), F51 (protótipo fora do repositório), F52, F62, F64 e F69. Nenhum `Accepted`; `uat.md`, `MEMORY.md` e `ROADMAP.md` não foram tocados.

## [2026-11-19 23:12] session — F71 no ramo: uma regra para a situação do item, o filtro Owned / Not Owned / Wishlist e a ação «Add the albums of my series»

Branch: `feat/f71-inventory-holds-every-album-of-my-series` (da `main` em `2722d1d`). Auxiliar sem navegador e sem conta: nada rodou contra dados reais; a prova na tela e a execução na conta do MJRP são a TASK-10, do integrador.

**O que entrou.** (1) `models/inventoryStatus.js`: a situação de um item (Owned, Not Owned, Wishlist) dita num lugar só, sobre o campo `owned` de sempre (`true`, `null`, `false`), sem migração; o cartão, o filtro, os totais, a janela do álbum e o aviso da troca perguntam a ele. (2) O filtro de situação com «All», «Owned», «Not Owned», «Wishlist» e o cabeçalho com as três contagens (`models/inventoryFilter.js`). (3) A ação «Add the albums of my series», um botão na barra de filtros: lê as séries do banco, planeja contra o inventário do banco (`models/inventoryFromSeries.js`, função pura), pergunta com `dialogService.confirm` e grava pelo `InventoryService` e pelo `InventoryRepository.addBatch`, em partes de 100 (uma gravação por parte, `BaseRepository.createMany`), com o botão ocupado, o progresso e o fim dito como foi.

**Decisões do agente — revisáveis (2026-11-19), todas nas Open Questions do `spec.md` da F71.** A regra única da origem dos dados: o item feito pela ação leva o que a consulta da série leva (artista, título, ano, capa, id do Apple Music) e mais nada, tenha a tela de álbuns sido aberta ou não; nenhum álbum é carregado. «O mesmo álbum»: o mesmo id do Apple Music, o mesmo id de álbum do app, ou o primeiro nível da regra de identidade (`compareAlbumIdentity(...).same`); a mesma resposta passa a valer no «Add to Inventory» do cartão de um álbum. As três contagens do cabeçalho ignoram o filtro de situação. O cartão sem preço não mostra «$0.00» e o item sem formato não mostra «Unknown». A janela do álbum mostra a situação do item (dizia «OWNED» para todos) e nenhuma fora do inventário. Criar ou editar uma série **não** escreve no inventário: a ação é repetível, e o automático fica como pergunta para o MJRP.

**Dados.** Suíte: 2326 testes em 191 arquivos (eram 2219), build e lint limpos. Saíram da lista de complexidade `InventoryRepository.addAlbum` e `InventoryView.render`. `shared/albumIdentity.js` não mudou (versão 2); `models/inventoryFromSeries.js` entrou nos `CALL_SITES` do teste da regra. O doctor segue vermelho pelos mesmos cerca de 520 links de documentos arquivados; nenhum erro novo.

## [2026-11-19 23:11] decision — MJRP pede, na F71: o inventário mostra e ordena por «Avg Rank» (BEA) e «Avg Pop» (Spotify) (S-56)

Palavras do MJRP, com a captura das duas médias: «no inventory, na 71, pode usar as metricas do print e ter um filtro/ranking por BEA Avg rank e Spotify Avg Pop.?». Registrado na `main`: o requisito S-56 no épico EP-07, embutido no `prd.md`, e importado pela F71 como segunda fatia. A primeira fatia (álbuns das séries no inventário; filtro de situação) está em implementação; esta entra depois dela, feita na sessão principal ou por um auxiliar de modelo mais barato.

## [2026-11-19 23:07] session — UAT-211 em produção (site); em fixed

Site publicado da `main` (`946fc21`, pacote `main-DBBm8vch.js`). Em produção, a imagem do título servida tem o primeiro pixel transparente. Os nomes só aparecem com a conta do MJRP; não foram vistos pelo agente em produção (a regra e o `title` estão nos testes). UAT-211 em `fixed`, à espera do olhar do MJRP.

## [2026-11-19 23:06] session — UAT-211 consertada: título sem caixa e nomes inteiros na barra do topo (F63)

A imagem `TheAlbumBlender.png` tinha fundo preto opaco; o preto foi tirado de forma que, sobre preto, a imagem fique igual (diferença máxima de 10 em 255 por canal, o ruído do fundo). Os nomes da conta e do Spotify deixam o limite fixo de 80 px: 96 px em telas menores, 220 px em telas largas, e o nome inteiro em `title`. Teste primeiro: `test/components/TopBarNames.test.js`.

## [2026-11-19 23:05] session — UAT-211 aberta: barra do topo com retângulo atrás do título e nomes cortados (relato do MJRP)

O MJRP mandou uma captura da barra do topo: «um bug antigo pra arrumar, veja o print, qual o bug?». Leitura do agente: a imagem do título tem fundo preto opaco (aparece como caixa sobre a barra translúcida) e os dois nomes têm largura máxima de 80 px. Entra na F63 (Home e navegação), pela via rápida.

## [2026-11-19 22:53] session — F72: a tela de séries diz quantas séries e quantos álbuns tem (S-55)

Uma linha sob o título: «47 series · 227 albums»; com busca, «2 of 47 series · 4 albums»; numa série, «5 albums». Modelo puro `models/seriesCounts.js`, testes primeiro, prova no navegador com a conta do MJRP. Decidido pelo agente, revisável: conta os álbuns pedidos nas séries que passam pelos filtros (o mesmo álbum em duas séries conta duas vezes), não os distintos.

## [2026-11-19 22:51] decision — MJRP pede: a tela de séries diz quantos álbuns tem (S-55, F72); auxiliares de melhoria não precisam do modelo mais caro

Palavras do MJRP: «outra melhoria conseguimos colocar quantos albums estao na página de albuns series?» e «agora pra implementar essas melhorias creio que vc nao precisa passar para agents com modelos fable». Registrado na `main` antes do ramo: o requisito S-55 no épico EP-01, embutido no `prd.md`, e a feature F72 (via rápida, tipo feature, `^REL-40`). A F72 é feita pelo próprio integrador. O auxiliar da F71 já estava rodando quando a segunda frase chegou e termina como começou; daqui em diante, melhorias pequenas são feitas na sessão principal ou por um auxiliar de modelo mais barato.

## [2026-11-19 22:49] decision — MJRP pede uma melhoria: todos os álbuns das séries no inventário, como «Not Owned»; filtro Owned / Not Owned / Wishlist (S-54, F71)

Palavras do MJRP: «pode fazer um favor, registre uma melhoria, coloque todos os os albums que tenho na minha albums list como parte do meu inventory. tudo marcado como not owned, e melhore o filtro de status para Owned, Not Owned, Wishlist». Registrado na `main` antes de qualquer ramo: o requisito S-54 no épico EP-07, embutido no `prd.md`, e a feature F71 (via rápida, tipo feature, `^REL-40`).

## [2026-11-19 22:21] session — correção da contagem do fecho: 80 issues em fixed, 6 abertas

A entrada de fecho e o `## Now` diziam 79; a tabela de issues tem 80 em `fixed` e 6 abertas (UAT-17, 28, 61, 143, 193, 202). O `## Now` foi corrigido.

## [2026-11-19 22:21] session — fecho: a v5.0 em produção; 79 issues em fixed, 6 abertas com o MJRP

Branch: main
Session: sessão do V0 aberta pelo orquestrador do harness em 2026-11-19 («resolver todos os problemas do album blender»), continuada sob a dispensa do MJRP de 2026-11-19 19:03.

**Resumo.** Todas as features da v5.0 que dependiam do agente estão na `main` e em produção: site `fd9a0a1`, servidor `mjrp-proxy-00207-lhz` (publicado pela trava de lint; em produção, depois da última subida: depuração 404, 401 sem login, notas de «Nevermind» com login, «In the Court of the Crimson King» com página achada). A suíte tem 2219 testes; a build compila; `npx eslint .` termina com 0 erros.

**Decisões desta sessão (todas no log, com hora; as do agente são revisáveis).**
- MJRP: visitante não leva dados ao entrar com conta; sair da conta recarrega o app; servidor em Node 24; F52 ao código com a proposta emendada; o conserto do Scan na frente; «No Quarter» com afrouxamento e a F68 para rever as regras de identidade; a conformidade de 28/10 fica de lado; dispensa de bloqueio pelo processo.
- Agente: a resposta única da busca por IA entra no segundo nível da regra de identidade; a F68 passou na frente depois da varredura (16 de 199 álbuns sem página de notas; hoje 6, todos legítimos); a tabela de «escritas conhecidas»; aposentar as telas de ranking e de migração e a rota `/api/playlists`; os roteiros de navegador antigos saíram; erro do provedor de IA sai como 424; «não tem» da fonte vale 24 horas, «página sem notas» 7 dias; a ADR-0021 (Tailwind compilado) publicada como proposta; F67, F69 e F70 criadas na `main`; o Cloud Run não foi reconfigurado.

**Próxima sessão.** Começa pelo `## Now`: nada em andamento do lado do agente; as treze pendências do MJRP estão listadas lá, o aceite primeiro. Se ele pedir mais trabalho, os candidatos sem dono estão em «Pending on Agent».

**Dados.** Publicações do dia: mais de vinte do site e doze do servidor (revisões `mjrp-proxy-00196-sj7` a `mjrp-proxy-00207-lhz`). Dados de teste deixados na conta do MJRP: rankings em «Brothers In Arms» e «Rapture of the Deep»; os identificadores corrigidos de álbuns nas séries (F55) e os fatos das séries reescritos (F69) são efeito das features, não de teste. Nenhum push, nenhum carimbo de aceite, nenhuma senha digitada.

## [2026-11-19 22:18] review — segunda fatia da F58 e trava de lint em produção (site); UAT-18, 19, 20 em fixed

Site publicado da `main` (`fd9a0a1`, pacote `main-bsMs4i-z.js`), a primeira publicação que passou pela trava de lint. Prova em `reports/evidence/F58/2026-11-20-layers-and-lint-gate-proof.md`: arrastar uma faixa muda a ordem e o desfazer devolve; em produção as seis telas principais abrem sem erro. O servidor está sendo publicado (mudou só a escrita de expressões regulares, com teste antes e depois). Restam 6 issues abertas, todas dependentes do MJRP: UAT-17, 28, 202, 61, 143, 193.

## [2026-11-19 22:16] session — a trava de lint ligada (F64, UAT-20), pelo integrador

Com o ramo das camadas e o da F70 juntos, `npx eslint .` termina com 0 erros e 23 avisos. O passo `npx eslint . --quiet` entrou na automação do GitHub e nos dois roteiros de publicação, antes dos testes; um erro recusa a publicação. Manual 00 e o cabeçalho do `eslint.config.mjs` atualizados; TASK-13 da F64 fechada.

## [2026-11-19 22:15] review — F70 em produção (site) e provada; quatro issues em fixed

Site publicado da `main` (`88adbc4`, pacote `main-DDeTiHbR.js`); a F70 não muda o servidor. Prova em `reports/evidence/F70/2026-11-19-small-defects-proof.md`: em produção, como visitante, a busca de um artista de eletrônica não pede mais a lista da IA; o substituto de capa entra uma vez só. UAT-209 e UAT-210 só por teste, com a razão escrita. Em `fixed`: UAT-208, 209, 210, 63. Restam 9 issues abertas; auxiliar trabalhando nas UAT-18, 19 e 20.

## [2026-11-19 22:14] session — F64, fatia do lint: de 22 erros para 1; o portão não foi ligado (UAT-20)

Ramo `fix/f58-layers-and-lint-gate`. `npx eslint .` na `main` dava 22 erros e 78 avisos; agora dá 1 erro e 24 avisos. Consertados: 17 barras sem efeito em seis expressões regulares (com testes escritos e rodados antes da troca: `test/server/textCleaningPatterns.test.js`, `test/utils/NormalizationUtils.test.js`), a chave `Plus` duplicada dos ícones (ficou a que o app sempre desenhou), a `Promise` com função `async` do `AlbumLoader`, um `const` solto num `case` e um `catch` vazio; 54 avisos mecânicos (importações e variáveis sem uso, `catch (e)` sem leitura). O erro que resta é a chave `sorting` duplicada em `public/js/controllers/InventoryController.js:44`, arquivo do ramo `fix/f70-small-defects`: por isso o passo de lint **não** entrou na automação nem nos scripts de publicação. O que falta ligar está na TASK-13 da F64, com o texto do passo, que foi rodado fora da publicação e recusou com esse erro. Suíte: 2149 passando. Achados que não são mecânicos estão no plano da F64 (o botão de blend ligado sem álbuns, um `sort` que não ordena, títulos que perdem o número).

## [2026-11-19 22:12] session — F70: spec, plano e tarefas; comportamento e manual

Passo de documentos da via rápida, no mesmo ramo (`fix/f70-small-defects`): `spec.md` (quatro REQ, um por issue, com `verified_by::`), `plan.md` e `tasks.md` da F70 preenchidos, `status: In Progress`; fica aberta a tarefa da prova no navegador, do integrador. `docs/specs/behavior.md`: o visitante na busca de álbuns e na carga, «Mudar só o preço do item», «Notas de um álbum achado pela busca por IA» e «Capa que não há ou não carrega». Manual: `03`, `07`, `08`, `13`, `19`, `21`, `99` e o mapa de arquivos, nas frases que ficaram falsas (o site ignorava `data.ratings`; `updatePrice` no lugar errado) e nas três peças novas.

Não feito: status das issues em `docs/specs/uat.md` (é do integrador); `MEMORY.md`; publicação. O `doctor.py` segue vermelho por causas anteriores a este ramo (links de documentos antigos, o `## Now` do `MEMORY.md`, o lint).

## [2026-11-19 22:10] session — F70: a capa que falta ou falha tem um substituto, por uma peça só (UAT-63)

Confirmado no código: `components/ui/AlbumCardRenderer.js` `renderVisualHeader` punha o `src` vindo de `albumLoader.getArtworkUrl`, que pode ser nulo, sem substituto no erro; `views/renderers/DiscographyRenderer.js` apontava para `/assets/images/cover_placeholder.png`, arquivo que não existe; `Card.js` (inventário), `StagingAreaRenderer.js` e `ViewAlbumModal.js` tinham substituto só para o endereço ausente, nenhum para a falha; `AlbumCascade.js` tinha um `onerror` escrito no HTML.

Feito: `public/js/components/ui/coverImage.js` desenha toda capa de álbum. Sem endereço, ou com endereço que falha, a imagem mostra o mesmo substituto (SVG embutido), uma vez por imagem. A falha é ouvida por um ouvinte só, no documento (fase de captura), porque a maioria dos cartões é escrita na página como texto e um ouvinte na própria imagem se perderia; nenhum `onerror` no HTML. Usam a peça: cartão do álbum, cartão da busca, lista de escolhidos, cartão do inventário, cascata (blend e playlists guardadas) e janela do álbum.

Muda na tela, para o MJRP julgar: os quatro substitutos diferentes de antes (nota musical no inventário, «?» na lista de escolhidos, disco na janela do álbum, degradê com disco na cascata) viram um só. Fora da minha lista de arquivos, com edição mínima: `components/ui/Card.js` e `components/ViewAlbumModal.js`.

Testes: `test/components/ui/coverImage.test.js` (jsdom: sem endereço, evento `error`, uma vez só, cartão escrito como texto, cada lugar, e dois testes de arquitetura). Sem navegador nesta sessão: não visto na tela.

## [2026-11-19 22:10] session — F70: o app lê o que o servidor diz das notas de um álbum achado pela IA (UAT-210)

Confirmado no código. O enriquecedor de notas (`services/albums/adapters/enrichers.js`, `AcclaimEnricher`) confia no endereço da página que vem no álbum (`bestEverUrl`): com ele, responde «pronto» sem pedir; sem ele, pede `POST /api/enrich-album`. O servidor só manda esse endereço quando leu a página, então:
- `failed`, `not_asked`, `not_configured`, `not_found`: o álbum vinha sem o endereço e o app já pedia as notas pelo caminho normal. Para a falha, o defeito era teórico: uma falha nunca era gravada como «sem notas». Provado por teste.
- `no_ratings` (a página existe, sem nenhuma nota): o álbum vinha COM o endereço e o app o marcava como «pronto», com notas, sem ter nenhuma. Este era o defeito real, no sentido contrário ao descrito.

Feito: `public/js/models/ratingsOutcome.js` lê `data.ratings`; `api/client.js` `normalizeAlbumData` guarda o desfecho no álbum (`metadata.ratingsOutcome`) e só mantém o endereço da página quando o servidor disse `found` (ou não disse nada: servidor de antes da fatia 5). Nos outros casos vale a resposta do próprio pedido do app, com o motivo e a versão da regra de identidade que os prazos de confiança já usam. O enriquecedor não mudou. `normalizeAlbumData` foi dividida (complexidade 13 para menos de 10; saiu da lista de exceções).

Testes: `test/api/generateRatingsOutcome.test.js` (cliente, adaptador do catálogo, enriquecedor e carga reais, com a resposta montada pelo construtor do servidor); `test/api/siteAgainstGenerateWithRatings.test.js` reescrito (dizia que o app ignorava o campo). Nenhuma tela mostra o desfecho ainda. Decidido pelo agente — revisável: o `not_found` do `/api/generate` não é guardado, porque vem sem a versão da regra de identidade; o app pergunta de novo e guarda a resposta carimbada.

## [2026-11-19 22:10] session — F70: o preço do inventário mantém a moeda (UAT-209)

Confirmado no código: `controllers/InventoryController.js` `handleUpdatePrice` chamava `updatePrice(albumId, newPrice)` sem moeda. Efeito real, pior que o descrito: a tela ficava com `currency: undefined` e o repositório gravava o seu padrão, `USD`, qualquer que fosse a moeda do item (um item em BRL virava USD). O ramo `else` era inalcançável (o serviço lança na falha, nunca devolve falso), então a falha não mostrava aviso. A chave `sorting` estava escrita duas vezes no estado inicial.

Nenhuma tela chama `handleUpdatePrice` hoje: a janela de editar o item passa por `handleUpdateAlbum`, que manda preço e moeda juntos. O defeito existia no código e não era alcançável pela tela.

Feito no dono: `services/inventory/InventoryService.js` `updatePrice(albumId, newPrice, currency?)` usa a moeda do item quando nenhuma é dada, na tela e na gravação; item sem moeda não ganha uma inventada (só o preço é gravado); preço negativo é recusado antes de qualquer mudança; na falha, o item de antes volta. O controlador mostra «Price updated» ou «Failed to update price» e redesenha a partir da store nos dois casos.

Testes: `test/services/inventory/InventoryService.price.test.js` (repositório real sobre o Firestore de teste), `test/controllers/InventoryController.price.test.js`.

## [2026-11-19 22:09] session — F70: o visitante não pede rota paga (UAT-208)

Confirmado no código: `services/album-search/AlbumSearchService.js` pedia `POST /api/ai/studio-albums` para qualquer pessoa quando havia álbum eletrônico (`scanArtist`), e `api/client.js` `_fetchAlbumFromAPI` pedia `POST /api/generate`; o servidor recusa o convidado com 403 (`server/lib/auth/requireUser.js`). Na carga de álbuns o 403 não segura a carga (só o 401 segura, `api/serverResult.js` `holdOf`): o álbum já terminava como «não achado», depois de um pedido recusado.

Feito: `public/js/api/paidRoutes.js` é o lugar único que diz quem pode usar as rotas pagas (`mayUsePaidRoutes()`, lido do mesmo login que o `serverFetch` envia); os dois chamadores perguntam antes de chamar. Visitante: a busca não pede a lista da IA e devolve `reclassified: null` (o status mostra só «→ artista»); a segunda fonte não é pedida e o álbum termina como não achado no catálogo, com o aviso que já existe. Sem login conhecido, a chamada segue e o 401 do servidor segura a carga, como antes. `_fetchAlbumFromAPI` foi dividida (complexidade 13 para menos de 10; saiu da lista de exceções).

Testes: `test/api/paidRoutes.test.js` (a regra, os dois chamadores sem nenhum pedido de rede, e dois testes de arquitetura: quem nomeia uma rota paga importa `paidRoutes.js`; ninguém mais lê `isAnonymous` para decidir). Decidido pelo agente — revisável: com `PAID_ROUTES_ALLOW_ANONYMOUS=true` no servidor (não é o caso da produção), o app continua sem pedir para o visitante.

## [2026-11-19 22:05] session — F58 fatia 2, parte 2: o serviço das playlists montado num lugar só; nada importa o `app.js` (UAT-19)

Ramo `fix/f58-layers-and-lint-gate`. `services/playlists/playlistsWiring.js` entrega ao `PlaylistsService` o banco, o cache e quem está na conta; `PlaylistsController`, `BlendingController`, `PlaylistsDragHandler`, `SavedPlaylistsController` e `PlaylistsView` pedem a ele. O controlador das playlists não cria mais o `PlaylistRepository` (pede `findBatch`) e o `app.js` não exporta nada. As três listas de `test/architecture/layerBoundaries.test.js` estão vazias, com três regras novas. As suítes da F60 e da F62 passam sem mudança de expectativa (só a preparação mudou: o que era simulado no `app.js` é simulado no `firebase-init.js`); `test/services/playlists/playlistsWiring.test.js` é novo. Suíte: 2104 passando (2085 antes). Sem navegador: o arrasto de faixa e a ordem de importação ficam para a prova do integrador (TASK-20 da F58). Com este commit entram o `arch.md`, os manuais e a spec, o plano e as tarefas da segunda fatia da F58 (REQ-07 e REQ-08).

## [2026-11-19 22:02] session — F58 fatia 2, parte 1: a última loja que alcançava o banco virou serviço (UAT-18)

Ramo `fix/f58-layers-and-lint-gate`. `public/js/stores/SpotifyEnrichmentStore.js` deixou de existir: o que o app guarda das respostas do Spotify é o serviço `services/spotify/StoredSpotifyPopularity.js` («o que já temos deste álbum?» e «guarde isto»), montado em `spotifyPopularityWiring.js` sobre o `SpotifyEnrichmentRepository`. A coleção `spotify_enrichment`, o nome do documento e os campos são os de antes: os nove casos de `test/services/spotify/StoredSpotifyPopularity.test.js` passaram primeiro contra a loja antiga, depois contra o serviço. A lista de lojas que alcançam o banco em `test/architecture/layerBoundaries.test.js` ficou vazia. Saíram com o arquivo os métodos que ninguém chamava (a remoção de órfãos na leitura, `hasValidEnrichment`, `delete`, `getCount`). A regra de confiança não mudou: um registro gravado antes da regra de identidade segue aceito por 30 dias. As três lojas acima de 150 linhas foram julgadas uma a uma: são só estado e seletores; `albums.js` perdeu dois apelidos sem uso (171 para 162). O `arch.md`, os manuais e a spec da F58 entram com a parte 2.

## [2026-11-19 21:56] review — UAT-101 e UAT-75 conferidas no navegador; em fixed

A triagem dizia «não acontece mais, falta um olhar no navegador». Visto: a lista de séries tem as 48 opções 1,1 s depois da primeira carga; não existe mais selo «PENDING». A UAT-143 (filtro «Studio» com singles de eletrônica) fica aberta para o julgamento do MJRP com artistas reais. Restam 13 issues abertas.

## [2026-11-19 21:55] session — F52 fatia 5 em produção (servidor); UAT-181 em fixed

Servidor publicado da `main` (`b9e94d6`, revisão `mjrp-proxy-00206-47c`; volta `mjrp-proxy-00205-mg4`). Em produção: `/api/generate` 401 sem login; com login, uma busca paga de verdade respondeu 200 em 37,8 s, e a linha `generate` do registro traz o desfecho das notas por fonte (`acclaim: found`). A busca de álbum por IA foi vista funcionando: UAT-181 em `fixed`, junto com a UAT-23. Com isso a F52 fica sem fatia pendente. Auxiliares trabalhando: F70 (defeitos pequenos) e a segunda fatia das camadas com a trava de lint (`fix/f58-layers-and-lint-gate`).

## [2026-11-19 21:53] decision — F70 criada: defeitos pequenos achados no caminho (decidido pelo agente — revisável)

Feature de via rápida, `^REL-40`, conserta as UAT-208 (visitante pede rota paga), UAT-209 (preço do inventário sem moeda), UAT-210 (o app ignora o desfecho das notas na busca por IA), abertas agora, e a UAT-63 (capa sem substituto). Criada na `main` antes de qualquer ramo. O resto das UAT-18, 19 e 20 segue nas features donas (F58, F64), numa segunda fatia.

## [2026-11-19 21:52] review — F52 fatia 5 provada pelo integrador no servidor local; UAT-23 em fixed

Prova em `reports/evidence/F52/2026-11-19-slice-5-generate-path-proof.md`: a resposta de `/api/generate` passa a dizer, fonte por fonte, o que aconteceu com as notas; falha da fonte não sai mais igual a «não tem»; o servidor não sobe sem o arquivo de instruções da IA. `fetchRankingForAlbum` foi de complexidade 139 para menos de 8. Mudanças do auxiliar que ficam, revisáveis: uma consolidação que quebra responde 500 (antes, 200 com ranking vazio); o servidor não sobe sem o validador de álbum.

## [2026-11-19 21:55] session — F52 fatia 5: a `main` (com a F65) trazida para o ramo

A `main` andou enquanto a fatia 5 era feita: a F65 entrou (`7be0701`) e removeu `server/scripts/**`, `server/test/**`, `server/routes/playlists.js` e `shared/curation.js`. Trazida para `fix/f52-slice-5-generate-path-tells-the-truth` com um encontro só, numa frase de `docs/manual/23_Shared_Code.md` (ficaram as duas coisas: quem importa `shared/normalize.js` hoje e a nota da F65). O teste de complexidade pediu, e as 13 linhas dos arquivos removidos saíram das listas novas: ficam 14 funções do servidor acima de 10 (eram 26 no começo da fatia) e nenhuma em `shared/` (eram 9, todas do `curation.js`). O plano e a seção 13 do `arch.md` dizem os números de agora. Depois de juntar: `npx vitest run` com 2073 testes verdes, `npx vite build` compila, e os arquivos da fatia passam no ESLint da F65 sem erro.

## [2026-11-19 21:51] session — F65 e o conserto da aba antiga (F64, UAT-207) em produção

Site publicado duas vezes da `main`: `7be0701` (F65) e `9424320` (UAT-207; pacote `main-C1NCAuzH.js`). Servidor publicado com a F65 (revisão `mjrp-proxy-00205-mg4`; volta `mjrp-proxy-00204-pt4`): `POST /api/playlists` responde 404. Prova da UAT-207: no navegador local, um arquivo de tela inexistente fez a página recarregar uma vez; na segunda vez, dentro do minuto de guarda, apareceu «This screen could not be loaded» com o botão «Load the new version», sem laço. Em produção, `/`, `/home`, `/index.html` e `/saved-playlists` respondem `cache-control: no-cache`; os arquivos de `/assets` seguem com `max-age=3600`. UAT-207 em `fixed`.

## [2026-11-19 21:49] session — UAT-207 aberta e consertada: aba aberta antes de uma publicação (F64)

Na conferência de produção da F65, uma aba com a versão anterior mostrou «View Error» ao abrir as playlists guardadas: os arquivos das telas carregadas sob demanda mudam de nome a cada publicação, e a página era guardada pelo navegador por uma hora. Conserto em dois lugares: o roteador reconhece o arquivo que sumiu e carrega a versão nova uma vez (`utils/staleBuild.js`, com guarda contra repetição); o `firebase.json` passa a mandar `Cache-Control: no-cache` para a página. Testes primeiro: `test/utils/staleBuild.test.js`, `test/router.staleBuild.test.js`, `test/architecture/hostingServesFreshPage.test.js`. Entra na F64 (um caminho só para publicar).

## [2026-11-19 21:48] session — F52 fatia 5: documentos no ramo (spec, plano, tarefas, arch, manual)

No ramo `fix/f52-slice-5-generate-path-tells-the-truth`: `spec.md` (a fatia 5, REQ-11 a REQ-16, cada um com `verified_by`; as cinco mudanças de comportamento declaradas; três perguntas abertas: o que o app faz com `data.ratings`, o prazo de 75 s, o álbum pago que se perde quando o próprio servidor quebra depois dele), `plan.md` (seção «Fatia 5»: o desenho da esteira, as decisões e as alternativas, a tabela de todo `catch` do servidor com o estado de cada um, os riscos, o plano de testes), `tasks.md` (TASK-26 a TASK-35 fechadas; TASK-36 aberta para o integrador: prova local, publicação e leitura do log), `docs/specs/arch.md` (seção 13 da F52; o item 5 da seção 12 marcado como feito) e o manual (`02_Server_Structure.md`, `03_Backend_API_Layer.md` e `04_Backend_Logic_Services.md` reescritos onde falavam do caminho; frases corrigidas em `00_Dir_File_Structure_Map`, `01`, `05`, `23`, `32` e `99`). Corrigido de passagem no manual: a página 02 dizia que um álbum reprovado no esquema respondia 422; responde 424 desde a fatia 1.

Para quem juntar: a F65 remove `server/scripts/**` e `shared/curation.js`, que estão nas listas de complexidade novas (4 e 9 linhas em `test/architecture/complexityAllowlist.js`); o teste pede que as linhas saiam junto com os arquivos. O `doctor.py` segue vermelho pelos mesmos erros de antes (links de documentos antigos); o único que mudou é o do `MEMORY.md` (`## Now` mais velho que o log), que é do integrador: este ramo não toca o `MEMORY.md`.

## [2026-11-19 21:47] review — F65 provada pelo integrador; cinco issues em fixed

Dezessete endereços abertos no navegador sem erro nem arquivo faltando; as três telas aposentadas caem na Home. 143 arquivos removidos. Prova em `reports/evidence/F65/2026-11-19-remove-what-nothing-uses-proof.md`. Em `fixed`: UAT-203, 21, 10, 11, 30. UAT-17, UAT-20 e UAT-19 diminuíram e seguem abertas. Decisão do auxiliar que fica, revisável: os roteiros de navegador (`test/e2e`) saíram inteiros, com a dependência `puppeteer` (um commit reversível, `fd1cbea`).

## [2026-11-19 21:44] session — F65: provada numa cópia limpa do ramo (npm ci, suíte, build, servidor de desenvolvimento)

No ramo `fix/f65-remove-what-nothing-uses`, sobre o commit `6f047d7`. Feita a prova que os roteiros de publicação fazem: o commit exportado com `git archive` para uma pasta fora do repositório (sem `.git`, sem `node_modules`), `npm ci` de verdade (395 pacotes; nem `puppeteer` nem `jsonwebtoken` instalados), `npx vitest run` com 1945 testes passando em 162 arquivos (a busca de segredos lê a pasta quando não há git) e `npx vite build` compilando. Na mesma cópia, o servidor de desenvolvimento (`npx vite`, noutra porta) respondeu 200 para a página, `/js/app.js`, o worker da busca e um módulo importado por `@shared`: tirar `public/package.json` e o atalho `public/js/shared` não o quebra. O servidor, numa cópia da árvore juntada com a F69: `/_health` 200, `/api/playlists` 404, `/api/enrich-album`, `/api/generate` e `/api/ai/studio-albums` 401 sem login, `/api/musickit-status` 200. O `plan.md`, o `tasks.md` e o `spec.md` da F65 registram essas provas. Continua sem prova: nenhuma tela aberta num navegador.

## [2026-11-19 21:42] session — F65: spec, plano, tarefas, arquitetura, modelo de dados, stack e manual escritos no ramo

No ramo `fix/f65-remove-what-nothing-uses`. A pasta da F65 preenchida para o que foi construído: `spec.md` (`status: In Progress`; 7 REQ, todos com `verified_by`; em `fixes` entram UAT-10, UAT-11 e UAT-30, ao lado de UAT-203, UAT-21 e UAT-29), `plan.md` (o grafo e as entradas; o que saiu por grupo, com arquivos e linhas; o que a triagem listava e ficou; a prova do servidor; os `package.json`; a medição do ESLint por regra; a lista das classes sem regra, com arquivo e linha; os achados não mexidos; os dois roteiros de prova do integrador) e `tasks.md` (14 tarefas; abertas a prova no navegador, do integrador, e o julgamento do MJRP). `docs/specs/arch.md`: seção nova «O que nada usa saiu, e dois sensores que seguram isso (F65)» e as linhas que citavam o que saiu (15 rotas, sem `playlists` no servidor, sem a curadoria, quatro arquivos importando o `app.js`, duas linhas da tabela das regras do banco sem nenhum código que as use). `docs/specs/data-model.md` e `docs/specs/tech-stack.md` em dia. `docs/specs/behavior.md` não mudou: nenhum estado descrevia as telas retiradas. Manual: 108 linhas que citam arquivo removido marcadas («removed in F65», com o nome do arquivo), e as páginas 01, 02, 03, 05, 07, 11, 17, 18, 19, 24, 31 e 99 reescritas onde descreviam o que saiu; `docs/onboarding/UX_UI.md` e `QA_ENGINEER.md` e o `regression_checklist.md` também. Dois comentários de código que citavam módulo removido (`utils/FilterUtils.js`, `services/albums/clearAlbumCaches.js`). Não tocados: `docs/specs/uat.md`, `MEMORY.md`, `ROADMAP.md`, `docs/specs/priority.md`, `firestore.rules`. Fica para o integrador: a `docs/specs/constitution.md` ainda cita os testes de navegador em Puppeteer (tem cópia gerada e não foi emendada aqui). O doctor fica em 523 erros (tinha 524 na `main`). Suíte: 1945 testes passando em 162 arquivos; `npx vite build` compila.

## [2026-11-19 21:40] session — F52 fatia 5: o caminho de `/api/generate` diz a verdade (código e testes, no ramo)

Ramo `fix/f52-slice-5-generate-path-tells-the-truth` (o que faltava da UAT-23), teste antes do código. **O ranking de um álbum vira uma esteira de fontes** (`server/lib/fetchRanking.js` e `server/lib/rankingSources/`): BestEverAlbums, depois a popularidade do Spotify (só quando a página não lista faixas ou tem poucas notas), depois a IA (só quando nenhuma das duas deu o ranking do álbum inteiro). Cada fonte termina num desfecho com nome (`found`, `not_found`, `no_ratings`, `not_configured`, `failed`, `not_asked`); a escolha do que vira o ranking e a consolidação (`server/lib/ranking.js`) são passos puros. **O álbum responde o que houve com as notas:** `POST /api/generate` segue respondendo o álbum quando o álbum foi achado, e agora `data.ratings` diz, fonte por fonte (`acclaim`, `popularity`, `aiRanking`), se «não tem» ou se «não deu para perguntar». **Prompts:** o arquivo ausente, ilegível ou sem um dos dois prompts faz o servidor não subir (`loadPrompts` lança; `server/index.js` carrega na partida, uma linha); uma rota sem o prompt responde `internal`. O validador do álbum (`ajv`) também deixa de virar «validação desligada». **Prazo:** 75 s no total (o app espera 90 s); o provedor que não responde o álbum nesse tempo é `upstream_timeout`; a fonte de notas que ainda roda quando o tempo acaba fica `failed` e o álbum sai, porque já foi pago. **Log:** uma linha `generate` por pedido (resposta, status, tempo, desfecho de cada fonte; nada da pessoa nem do álbum).

Complexidade: `fetchRankingForAlbum` 139, `_albumFromResponse` 65 e `consolidateRanking` 49 saíram da conta (nenhuma função do que foi escrito passa de 10; a maior tem 8). Dois testes de arquitetura novos: nenhum `catch` vazio em `server/` fora de uma lista com motivo (3 entradas) e nenhum `catch` que só escreve no log no caminho de `/api/generate` e de `/api/enrich-album`; o limite de complexidade passa a valer no servidor e em `shared/`, com listas que só encolhem (18 e 9; eram 26 e 9). Suíte: 2061 testes; `npx vite build` compila.

Mudanças de comportamento além da pedida, decididas pelo agente — revisáveis: (1) no caminho em que o Spotify ganha de uma página com poucas notas, o raspador era perguntado duas vezes e o endereço da página se perdia; agora é perguntado uma vez e `bestEverUrl` vem preenchido; (2) uma consolidação que quebra (defeito nosso) respondia 200 com ranking vazio e a pilha do erro no corpo; agora vai para o caminho de erro da rota (`internal`); (3) `fetchRankingDebug` deixa de levar mensagens das fontes: uma linha por fonte, com desfecho e código. Números decididos sem medir: 75 s de prazo. Provado num servidor de verdade, numa cópia local, com um substituto da IA na própria máquina (nenhuma chamada paga) e o BestEverAlbums inalcançável: 200 com `ratings: { acclaim: "failed", popularity: "not_configured", aiRanking: "found" }`, 424 no 402 do provedor, e o servidor não sobe sem o arquivo de prompts. O app não mudou nesta fatia; não foi publicado.

## [2026-11-19 21:32] session — F65 junto com a `main` (F69 dentro): dois encontros, suíte verde

A `main` andou enquanto a F65 era feita (a F69 entrou, `6ae9940`); trazida para o ramo `fix/f65-remove-what-nothing-uses`. Dois encontros. `public/js/views/helpers/SeriesGridHelper.js`: a F69 o editou e a F65 o tinha removido por nada o importar; conferido de novo na árvore juntada (nenhum arquivo o importa) e mantida a remoção. `test/architecture/complexityAllowlist.js`: a F69 tirou as duas linhas do `SpotifyEnrichmentHelper` e a F65 as três da migração; saem as cinco. Depois de juntar: o grafo não acha módulo morto, `npx vitest run` com 1945 testes passando em 162 arquivos, `npx vite build` compila. Nenhum arquivo da F69 foi editado aqui.

## [2026-11-19 21:31] session — F65: classes de estilo sem regra levantadas; sai a regra que perdeu o último uso

No ramo `fix/f65-remove-what-nothing-uses`. Levantadas as classes escritas em `public/js` e em `public/index.html` que não têm regra no CSS construído (o pacote do Vite mais `public/css/modals.css`): 105 no ramo (eram 123 na `main`; 24 saíram junto com os arquivos removidos, entre elas todas as do Font Awesome, `fa-*`, `fas`, `fab`). A lista, com arquivo e linha, agrupada, vai no `plan.md` da F65; nada foi reestilizado (sem navegador). No sentido contrário, 23 classes têm regra em `public/css` e nenhum arquivo do app as escreve; só uma perdeu o último uso neste ramo, `.text-accent-secondary` (usada só pela tela de ranking retirada), e a regra dela sai de `public/css/modals.css`. As outras 22 já não tinham uso na `main` e ficam listadas. Suíte: 1881 testes passando; `npx vite build` compila.

## [2026-11-19 21:27] session — F65: o ESLint passa a verificar cada parte do código como o que ela é (UAT-20, em parte)

No ramo `fix/f65-remove-what-nothing-uses`. `eslint.config.mjs` ganha a lista do que não é verificado (`dist/`, `_archive/`, `_backups/`, `node_modules/`, `public/js/vendor/`, as cópias do harness, as pastas sem código do app) e um bloco por tipo de código: navegador para `public/js` (com `MusicKit`), worker para `public/js/workers`, navegador e Node para `shared`, CommonJS de Node para `server`, Node para `scripts` e os arquivos de configuração, Node com jsdom e os globais do Vitest para `test`. O `.eslintrc.json` da raiz sai (o ESLint 9 não o lê). Medido com `npx eslint .`: na `main` (cópia limpa, configuração antiga) 63 erros e 521 avisos em 531 arquivos, 377 deles `no-undef` por falta de globais; no ramo, com a configuração nova, 25 erros e 91 avisos em 411 arquivos. O que resta, por regra: `no-unused-vars` 89 (aviso), `no-useless-escape` 17, `no-empty` 3, `no-dupe-keys` 2 (`components/Icons.js:100` «Plus» e `controllers/InventoryController.js:44` «sorting»: a segunda chave vence a primeira), `no-case-declarations` 1, `no-async-promise-executor` 1 (`services/AlbumLoader.js:21`), `no-dupe-else-if` 1 (`server/lib/normalize.js:234`: um ramo que nunca roda), `no-undef` 1 e uma diretiva `eslint-disable` sem uso. O `no-undef` é defeito de verdade, anotado e não consertado: em `server/lib/fetchRanking.js` o comentário antes de `normalizeRating` não fecha, a função fica dentro do comentário e `mergeRankingEvidence` (linha 72) a chama; hoje nada chama `mergeRankingEvidence`. Consertado, por ser mecânico e em arquivo já tocado: quatro importações sem uso em `components/TopNav.js` e a importação sem uso do `axios` em `api/client.js` (o pacote do site não muda de tamanho: a build já deixava o `axios` de fora). O lint não entra na CI nem nos roteiros de publicação: ainda tem 25 erros. Suíte: 1881 testes passando; `npx vite build` compila.

## [2026-11-19 21:25] session — F65: teste de arquitetura que reprova módulo que nenhuma entrada alcança (UAT-203)

No ramo `fix/f65-remove-what-nothing-uses`. `test/architecture/noDeadModules.test.js` (12 casos): todo módulo de `public/js`, `shared` e `server` tem de ser alcançado, pelo grafo de importações, a partir de `public/index.html` ou de `server/index.js` (ou de um arquivo que os scripts do `package.json` e os roteiros de `scripts/` passem a nomear); toda folha de estilo de `public/css` também; nenhum arquivo alcançado importa arquivo que não existe; nenhuma importação com nome montado em tempo de execução. Teste não conta como uso. Uma exceção, com o motivo escrito: `public/js/firebase-config.example.js` (modelo copiado à mão), e a lista de exceções reprova linha que sobrou. Conferido por mutação: com a importação do `Footer` comentada no `app.js`, o teste acusa `public/js/components/Footer.js`; desfeita, passa. Hoje: 252 arquivos alcançados, nenhum módulo morto. A ferramenta deixa de pular pastas chamadas `test` ou `tests` dentro das pastas vigiadas (um arquivo de teste posto ali é vigiado como os outros). Suíte: 1881 testes passando em 156 arquivos; `npx vite build` compila.

## [2026-11-19 21:22] session — F52 fatia 5: o que o caminho de `/api/generate` faz hoje fica preso em teste, antes de mexer

Ramo `fix/f52-slice-5-generate-path-tells-the-truth`, da ponta da `main` (`6ae9940`). Antes de reescrever `fetchRankingForAlbum` (complexidade 139), `consolidateRanking` (49) e `GenerationService._albumFromResponse` (65), 52 testes de caracterização prendem o que elas fazem hoje, com as fontes trocadas por dublês (sem rede, sem chamada paga): `test/server/rankingPipeline.test.js` (que fonte é perguntada e em que ordem: BestEverAlbums, popularidade do Spotify, IA; o que sai em cada caminho), `test/server/rankingConsolidation.test.js` (a consolidação, passo puro) e `test/server/generateAlbumAnswer.test.js` (o álbum que a rota responde, com as notas nas faixas). Três testes dizem «TODAY» no nome: prendem o que esta fatia vai mudar de propósito (arquivo de prompts sem o prompt de ranking lido como «sem ranking»; o raspador perguntado duas vezes no caminho em que o Spotify ganha, com o endereço da página perdido; a consolidação que quebra respondida como álbum sem ranking). O `doctor.py` já estava vermelho na `main` (524 erros de link em documentos antigos); nada desta entrada mexe nisso.

## [2026-11-19 21:21] session — F65: páginas fora da build, testes que nenhum comando roda e dependências sem uso saem

No ramo `fix/f65-remove-what-nothing-uses`. Saem de `public/` o que a build não inclui e nada serve (o Vite só constrói `public/index.html`, e o roteiro de publicação só copia `js/firebase-config.js`, `css/`, `assets/` e `favicon.ico`): `debug-curator.html`, `debug-svg-generator.html`, `static_prototype_v3.html`, `typography-preview.html`, `404.html` (o `firebase.json` não a usa: toda rota cai no `index.html`), `legacy/**`, `_api.main.js`, `config.js` (um arquivo vazio que pedia para ser apagado), `package.json` (repetia o `"type": "module"` da raiz) e o atalho `public/js/shared` (o app importa por `@shared`). Saem os testes que nenhum comando roda: `tests/` (dois roteiros caseiros, fora do `include` do Vitest), `test/scripts/**` (oito roteiros soltos; três chamavam o provedor de IA) e `test/e2e/**` com as dez capturas de tela. Sobre o `test/e2e`: 4 dos 17 elementos que os roteiros procuram não existem mais (`#albumsGrid`, `#albumsList`, `#albumList`, `#debugPanel`) e o link `/playlists` do menu também não; não foram rodados aqui (sem navegador). Decidido pelo agente, revisável: saem inteiros, com os scripts `test:e2e` do `package.json` e o `puppeteer`; a prova no navegador do projeto é a do integrador (AGENTS.md, passo 4). `package.json` da raiz: descrição em dia; entram `espree` e `postcss` (usados pelos testes de arquitetura e não declarados), nas versões que o `package-lock.json` já resolvia; saem `puppeteer` e `jsonwebtoken`. O `dotenv` fica: `server/lib/services/spotifyPopularity.js`, que os testes da raiz carregam, o pede ao carregar. `package-lock.json` refeito só no arquivo, numa cópia fora do repositório: 70 pacotes saem, nenhum entra nem muda de versão; `npm ci --dry-run` aceita. `README.md` e `.github/workflows/ci.yml` deixam de citar o que saiu. Suíte: 1869 testes passando em 155 arquivos; `npx vite build` compila. Achado, não mexido: em `public/assets` há cerca de 44 MB que o app não carrega e que vão para o site a cada publicação (`data/albums-curated.json`, `data/albums-expanded-backup.json` e dez imagens).

## [2026-11-19 21:17] session — F65: busca de segredos vira teste; os scripts com o token do Discogs e os geradores sem uso saem (UAT-17)

No ramo `fix/f65-remove-what-nothing-uses`. Teste novo, `test/security/noSecretsInRepo.test.js`, com a busca em `test/security/support/secretScan.js`: lê todo arquivo de texto que o git acompanha e acusa credencial escrita (valor longo atribuído a nome com token, secret, key ou password; `Authorization: Discogs token=…` e `Bearer …` literais; chave privada com conteúdo; chaves de formato conhecido). Diz arquivo, linha e regra; nunca o valor. Rodado antes da remoção: vermelho em `scripts/generate-dataset.js:8` e `scripts/fetch-missing-artists.js:12`, e só neles. Depois: verde. Um valor na lista de públicos, com o motivo: a configuração web do Firebase em `public/js/firebase-config.js`. Saem de `scripts/` os dezesseis arquivos que nada roda (treze geradores e roteiros de dados, entre eles os dois com o token do Discogs, e três arquivos de dados deles); ficam os dois roteiros de publicação, `lib/`, `start-local.sh` e `stop-local.sh`. Saem da raiz `reproduce_match.js`, `sort_test.html`, `restart_dev.sh` (o `scripts/start-local.sh` faz o mesmo) e `.flatten_ts`. O token do Discogs continua no histórico do git: trocá-lo no site do Discogs é do MJRP (UAT-17). Com os geradores sai a receita que montou os arquivos de `public/assets/data`; os arquivos ficam, e a receita está no histórico. Suíte: 1869 testes passando em 155 arquivos; `npx vite build` compila.

## [2026-11-19 21:15] session — F69 em produção (site e servidor)

Site publicado da `main` (`8425964`, pacote `main-DIgppRDb.js`), depois o servidor (revisão `mjrp-proxy-00204-pt4`; volta `mjrp-proxy-00203-lwg`). Conferido em produção: rotas de depuração 404, 401 sem login, notas de «Nevermind» com login (In Bloom 89). A parte do servidor da F69 (a popularidade do Spotify como fonte reserva do ranking em `/api/generate`) não foi exercitada. Auxiliares trabalhando: F65 e a fatia 5 da F52.

## [2026-11-19 21:14] session — F65: a rota /api/playlists, shared/curation.js e o código morto do servidor saem (UAT-21)

No ramo `fix/f65-remove-what-nothing-uses`. Conferido antes de tirar: nada vivo importa `shared/curation.js` nem o que ele exporta (`CurationEngine`, `curateAlbums`); o blend do app usa os algoritmos de `public/js/algorithms`, que não o tocam. Saem a rota `POST /api/playlists` (`server/routes/playlists.js`, com a montagem e a guarda dela no `server/index.js`), `shared/curation.js` (517 linhas) e, no cliente, `generatePlaylists` e `normalizePlaylists` de `public/js/api/client.js`. Saem `server/scripts/**` (onze roteiros de depuração, um HTML, um PNG e um JSON), `server/search_debug.html` e `.png`, e as quatro configurações de lint e formatação do servidor que nada rodava (`.eslintrc.json`, `.eslintignore`, `.prettierrc`, `eslint.config.js`). **UAT-21:** `server/test/` sai inteiro: três arquivos importavam `public/js/curation.js`, que não existe; `run-tests.js` chamava o site de notas de verdade; dois eram do Jest, que nenhum comando rodava. O que era verdadeiro neles e roda sem rede foi para `test/server/answerParsing.test.js` (7 casos: o texto da resposta da IA e a consolidação das posições), dentro do `npx vitest run`; ficaram de fora o esquema do álbum (a raiz instala outra versão maior do `ajv`) e a página de notas (o `cheerio` é só do servidor). `server/package.json`: saem os scripts `lint`, `lint:fix`, `format`, os sete pacotes de desenvolvimento e o bloco do Jest; `test` passa a rodar `npx vitest run test/server` da raiz. `server/package-lock.json` refeito só no arquivo (`npm install --package-lock-only`): os 123 pacotes de produção ficam nas mesmas versões e com a mesma assinatura, os 517 de desenvolvimento saem. Provado numa cópia fora do repositório: `npm ci --omit=dev` instala 123 pacotes, o servidor sobe sem variável nenhuma, `/_health` responde 200, `/api/playlists` 404, `/api/enrich-album` e `/api/generate` 401 sem login; os dois módulos de `shared/` carregam. Suíte: 1858 testes passando em 154 arquivos; `npx vite build` compila. Uma linha sai da lista de funções acima do limite (`api/client.js`).

## [2026-11-19 21:13] review — F69 provada pelo integrador; UAT-206 em fixed

Conectado, a sessão vencida do Spotify foi renovada sozinha e a popularidade veio para os cinco álbuns (o «Core» incluído). Sem as chaves, um álbum sem popularidade guardada ficou `not-connected`, sem nenhum pedido ao Spotify. Prova em `reports/evidence/F69/2026-11-19-spotify-popularity-outcomes-proof.md`. A UAT-28 (chaves no navegador) fica aberta com a análise no `plan.md` da F69: três caminhos, recomendação de aprovar o padrão na constituição agora.

## [2026-11-19 21:11] session — F65: as duas telas de ranking por endereço e a tela de migração saem (UAT-10, UAT-11, UAT-30)

No ramo `fix/f65-remove-what-nothing-uses`, cumprindo a decisão registrada em 2026-11-19 21:03 (do agente, revisável; o código fica no histórico do git). Saem as rotas `/ranking/:albumId`, `/consolidated-ranking` e `/save-all` do `app.js`, com as telas `views/RankingView.js`, `views/ConsolidatedRankingView.js` e `views/SaveAllView.js`. Com a rota da migração saem `migration/MigrationUtility.js` e `repositories/AlbumRepository.js` (o grafo mostrou que só a migração os usava) e o código «Data Sync» do `components/TopNav.js` (`needsMigration`, `renderDataSyncLink`, `handleDataSync`, os dois ouvintes de botões que nunca eram desenhados); o `app.js` deixa de montar um utilitário de migração para o menu. O `components/Breadcrumb.js` perde o ramo de `/ranking`. Nenhum componente ficou órfão com a saída das telas de ranking: tudo o que elas usavam é usado por outra tela. Testes: saem os das duas telas (`ConsolidatedRankingView`, `SaveAllView`) e o caso do link de fonte da tela de ranking no teste de endereços de fora; o caso do caminho de navegação no teste de texto de fora passa a usar `/playlists`. Quatro linhas saem da lista de funções acima do limite de complexidade (três da migração e `TopNav.attachListeners`, que ficou dentro do limite). Suíte: 1851 testes passando em 153 arquivos; `npx vite build` compila. Sem navegador nesta sessão: abrir cada tela fica para o integrador.

## [2026-11-19 21:10] session — F69: documentos no ramo (spec, plano, tarefas, arch, behavior, manual) e a análise da UAT-28

No ramo `fix/f69-spotify-popularity-failure`: `spec.md` (8 REQ, cada um com `verified_by`), `plan.md` (o diagnóstico com arquivo, o desenho, as linhas tocadas nos arquivos da F58, a análise da UAT-28 com três caminhos e a recomendação: aprovar o padrão na constituição com a ameaça reduzida agora, corretor de chaves no servidor se o app passar a ter mais contas; o armazenamento não mudou) e `tasks.md` (11 fechadas; abertas: a prova no navegador pelo integrador, a publicação do servidor e o julgamento do MJRP). `arch.md` ganhou a seção «A popularidade do Spotify tem três desfechos (F69)»; `behavior.md`, cinco estados; o manual, as frases que ficaram falsas (`00`, `04`, `06`, `08`, `16`, `17`, `19`, `29`, `32`). Um teste a mais para `sourceOutcome`. Suíte: 1933 testes verdes; `vite build` compila. Para o MJRP julgar: seis mudanças de comportamento nas Open Questions do `spec.md`.

## [2026-11-19 21:09] session — F65: grafo de importações e saída dos módulos de public/js que nada alcança

Ramo `fix/f65-remove-what-nothing-uses`, saído da `main` em `2f9215b`. Ferramenta nova, `test/architecture/support/importGraph.js`: lê as importações de cada arquivo (estáticas, dinâmicas, `require`, `?worker`, as páginas HTML e o `@import` do CSS) e anda a partir das entradas (`public/index.html`, `server/index.js` e o que os scripts do `package.json` e os roteiros de `scripts/` nomeiam); teste não conta como uso. Na `main` ela aponta 49 módulos que nenhuma entrada alcança (4.998 linhas): 37 em `public/js` e 12 no servidor. Saem neste commit os 36 de `public/js` (fica o `firebase-config.example.js`, que é o modelo de configuração): oito algoritmos antigos, `cache/albumCache.js`, `repositories/SharedAlbumRepository.js`, `components/Autocomplete.js`, `services/PlaylistPersistenceService.js`, os geradores de SVG, os modelos `Playlist` e `Series` e os componentes soltos. Saem também dois que o grafo não acusa: `public/js/tests/TrackTransformerTest.js` (um roteiro de console, fora da suíte) e `views/playlists/PlaylistsDragDrop.js` (alcançado só por um arquivo de reexportação, e a função dele ninguém chama). Com eles: o teste do `SharedAlbumRepository`, dois casos do teste de texto de fora (peças removidas), 18 linhas da lista de funções acima do limite de complexidade e duas da lista dos que importam o `app.js` (sobram 4). Suíte: 1862 testes passando em 155 arquivos (eram 1869 em 156); `npx vite build` compila. Sem navegador nesta sessão.

## [2026-11-19 21:05] session — F69: a `main` (com a F58) trazida para o ramo

A `main` andou enquanto a F69 era feita (F58: `_publishSource` passou a ler `sourceOutcome`, a espera virou `LoadHold`). Trazida para `fix/f69-spotify-popularity-failure` com um conflito só, em `AlbumLoadService._publishSource`: ficou a versão da F58, e o «não conectado» passou a ser decidido em `models/albumSourceAsk.js` (`sourceOutcome` devolve `note: null`, e `_publishSource` só guarda quando há `note`). Três funções saíram da lista de complexidade acima de 10 (`applyEnrichmentToAlbum`, `applySpotifyData`, `describeQuery`). Suíte: 1931 testes verdes; `vite build` compila.

## [2026-11-19 21:03] session — F69: a popularidade do Spotify com três desfechos (código e testes, no ramo)

Ramo `fix/f69-spotify-popularity-failure` (UAT-206), teste antes do código. A popularidade de um álbum deixa de terminar sempre em «sem dado»: o Spotify não tem o álbum é `empty` com motivo (`not_found`, guardado 24 horas e só enquanto valer a versão da regra de identidade que o decidiu); a consulta que falhou é `failed`, nunca guardada; sem sessão do Spotify é `not-connected`, estado novo, que não é guardado nem escrito nos fatos da série. Um caminho só pergunta ao Spotify (`services/albums/adapters/spotifyPopularitySource.js`, atrás do `PopularityEnricher`); o laço de fundo `SpotifyEnrichmentService` saiu e o botão «Enrich Data» passou a pedir pela carga (`refreshSource`). Ao conectar, as fontes «não conectado» dos álbuns na tela são pedidas pela fila, sem recarregar álbum. O 429 do Spotify com espera de até 30 s segura a popularidade (`HoldReason.SPOTIFY_BUSY`); acima disso, ou sem tempo dito, é falha. O gêmeo do servidor (`server/lib/services/spotifyPopularity.js`, alcançado por `POST /api/generate`) passou ao contrato da F52: falha é `UpstreamError`.

Números decididos pelo agente — revisáveis: 24 horas de confiança para «o Spotify não tem este álbum» (o mesmo `EMPTY_TRUST.not_found` das notas); 30 s como a maior espera do Spotify que a carga segura (`MAX_SPOTIFY_HOLD_MS`, o mesmo teto que a exportação espera). Não foi visto num navegador nem publicado; o servidor só se prova publicando.

## [2026-11-19 21:03] review — triagem das 26 issues abertas contra o código de hoje; sete passam a fixed

Relatório em `reports/audits/2026-11-19-mjrpalbumblender-v0-open-issues-triage.md`. Em `fixed`, por já não acontecerem no código (com a feature que resolveu): UAT-31, 62, 73, 84, 152, 22, 29. Ficam abertas com «um olhar no navegador» pendente: UAT-75, 101, 143. Decidido pelo agente — revisável, sob a dispensa do MJRP: a F65 aposenta as duas telas de ranking alcançáveis só por endereço (UAT-10) e a tela de migração (UAT-11), remove a rota `/api/playlists` do servidor (sem tráfego em 30 dias) e os scripts com o token do Discogs; o código fica no histórico do git. Trocar o token no Discogs continua sendo do MJRP.

## [2026-11-19 20:52] session — F58 em produção (site)

Site publicado da `main` (`ec69407`, pacote `main-Bt2pCXey.js`). Em produção, como visitante: a Home abre, a busca de «Kendrick Lamar» mostra Studio (10) com «To Pimp a Butterfly», sem erro novo no console. Anotado, sem dono: um visitante ainda chega a pedir a lista da IA (rota paga) e recebe 403; o app devia nem pedir. Auxiliar trabalhando: F69.

## [2026-11-19 20:51] review — F58 provada pelo integrador; UAT-194 e UAT-14 em fixed

Carga de álbuns com zero funções acima do limite; o app caiu de 97 para 80 com a F57 e a F62 juntas. No navegador nada mudou (álbuns, blend, inventário, tela de migração, console limpo). Prova em `reports/evidence/F58/2026-11-19-load-service-within-the-limit-proof.md`. UAT-18 e UAT-19 ficam abertas: diminuíram, e o resto está em listas que só encolhem. Pergunta para o MJRP: o limite de 10 vira artigo da constituição?

## [2026-11-19 20:50] session — F58 junto com a `main`: a lista das funções acima do limite encolhe de 94 para 80

A F57 e a F62, que entraram na `main` enquanto a F58 era feita, trouxeram 14 funções para dentro do limite de complexidade (ou as retiraram). O teste de limite pediu, e as 14 linhas saíram da lista.

## [2026-11-19 20:48] session — F58: o limite de complexidade vira teste; spec, plano, tarefas, arch.md, ADR-0019 e manual em dia

No ramo `fix/f58-load-service-within-the-limit`. `test/architecture/complexityLimit.test.js` roda a regra `complexity` do ESLint (limite 10): na carga de álbuns sem exceção (0 acima de 10); no resto de `public/js` contra `test/architecture/complexityAllowlist.js`, a lista das 94 funções que passam de 10 hoje, com o número de cada uma e quem pode baixá-la (43 no código que a F62 segura, 10 no da F57, 3 da migração, 38 sem feature). A lista só diminui: função nova acima de 10, função que piorou e função consertada que ficou na lista reprovam; conferido por mutação. Medição: 136 funções acima de 10 antes, 133 depois (`public/js` 97 para 94, `vendor/` 4, `shared/` 9, `server/` 26). Documentos: `spec.md` (`status: In Progress`, REQ-01 a REQ-06 com `verified_by`), `plan.md` (o diagnóstico das quatro issues com arquivo e linha, as costuras, a tabela medida inteira), `tasks.md` (15 tarefas; aberta a prova no navegador, do integrador, e o julgamento do MJRP), `docs/specs/arch.md` (seção nova «O serviço de carga dentro do limite de complexidade (F58)»: onde a espera mora e como o `AlbumAsks` fica sabendo dela; a seção de direção das dependências reescrita para hoje), o texto da ADR-0019 e as páginas 01, 07, 10, 11, 14, 21, 23 e 99 do manual. Decidido pelo agente — revisável: o que resta da UAT-18 e da UAT-19 está no código do blend e das playlists e ficou numa lista em vez de consertado aqui. Pendências que não são deste ramo: o `doctor.py` segue vermelho (links antigos, `MEMORY.md`, lint) e a ADR-0019 já passava do teto de 6.000 caracteres antes desta edição (8.054; agora 8.567).

## [2026-11-19 20:47] session — F57 e F62 em produção (site)

Duas publicações do site da `main`: `b73b159` (F57: um seletor de álbum e um classificador; UAT-185 `fixed`) e `4f022d8` (F62: receitas, exportações, desfazer e refazer, título; sete issues `fixed`; pacote `main-CY7jC6wt.js`). Nenhuma muda o servidor. Auxiliar trabalhando: F58. A F69 começa agora.

## [2026-11-19 20:46] review — F62 provada pelo integrador no que não exporta; sete issues em fixed

Prova em `reports/evidence/F62/2026-11-19-blend-and-export-proof.md`: desfazer e refazer, apagar playlist, título editado que fica, caminho da tela, sem «Discovery Mode». As duas exportações (Spotify e Apple Music) só passaram em teste de unidade: prová-las cria playlists de verdade nas contas do MJRP, e isso fica para ele. Em `fixed`: UAT-200, 02, 03, 04, 08, 09, 190. Mudanças de comportamento para o MJRP julgar estão nas Open Questions do `spec.md` da F62 (dez itens).

## [2026-11-19 20:44] review — F57 provada pelo integrador; UAT-185 em fixed

Home e edição de série mostram os mesmos seis filtros, as mesmas contagens e os mesmos cartões para «Kendrick Lamar»; os dois álbuns que caíam em «?» estão em Studio. Prova em `reports/evidence/F57/2026-11-19-one-picker-one-classifier-proof.md`. A UAT-193 fica aberta: a metade das playlists (gerar e editar) é da F62. Mudanças de comportamento para o MJRP julgar estão nas Open Questions do `spec.md` da F57 (álbum eletrônico sem lista da IA aparece em Studio; «gold», «definitive» e «complete» não marcam mais coletânea; a busca da edição de série ficou igual à da Home).

## [2026-11-19 20:43] session — F62 junto com a `main`: um encontro nas importações do SpotifyService

A `main` andou enquanto a F62 era feita (F49 e F68 entraram, `50e7b2e`); juntada ao ramo `fix/f62-blend-and-export-do-what-they-say`. Um encontro só, em `public/js/services/SpotifyService.js`, nas linhas de importação: a F68 trocou `NormalizationUtils` por `titleWithoutEditionNotes` e a F62 acrescentou os erros com nome do Spotify; ficaram as duas coisas. Depois de juntar: `npx vitest run` com 1661 testes passando em 140 arquivos (a F62 sozinha tinha 1512 sobre os 1394 de partida), `npx vite build` compila.

## [2026-11-19 20:42] session — F62: spec, plano, tarefas, comportamento e manual escritos no ramo

Ramo `fix/f62-blend-and-export-do-what-they-say`. A pasta da F62 preenchida para o que foi construído: 10 REQ com `verified_by` (nenhuma das sete issues estava consertada por inteiro pelo trabalho do dia; a tabela «ainda existia?» traz arquivo e linha da `main` em `c9aaa7a`), 14 tarefas, abertas a prova no navegador (do integrador, com o que pede conta real do Spotify e da Apple Music separado do que não pede) e o julgamento do MJRP (nove mudanças de comportamento e os textos novos, nas Open Questions da spec). `docs/specs/behavior.md`: 14 estados reescritos e 8 novos. Manual: 00, 07, 10, 11 (4.2), 14, 15, 17, 18, 21 (3 e 4), 31 e 99. Decisões do agente, revisáveis, registradas na spec: «Discovery Mode» retirado; sem ranking da pessoa, a ordem do álbum; não duplicar na Apple pelo id lembrado na visita; guardar zera o desfazer. O doctor fica nos 521 erros que já tinha.

## [2026-11-19 20:41] session — F57 junto com a `main` (F68 dentro): sem conflito, suíte verde

A `main` andou enquanto a F57 era feita (F68, regras de identidade, em produção). Juntada ao ramo `fix/f57-one-album-picker-and-one-classifier` sem conflito (o git juntou sozinho `docs/log.md`, `docs/specs/arch.md`, `docs/specs/behavior.md` e `docs/manual/10_Frontend_Renderers.md`). Suíte: 1647 testes passando; `vite build` compila. A F57 não toca na regra de identidade nem em `AlbumSearchService.search`.

## [2026-11-19 20:40] session — F57: spec, plano, tarefas, arquitetura, comportamento e manual escritos no ramo

A pasta da F57 preenchida para o que foi construído (`status: In Progress`; 8 REQ, todos com `verified_by`; 12 tarefas, 10 fechadas; abertas a prova no navegador, do integrador, e o julgamento do MJRP). O plano traz o mapa dos dois fluxos antigos (Home e janela «Edit Series») de ponta a ponta com arquivo e linha, a tabela das 14 diferenças com a resposta a «precisam ser diferentes?» (só uma precisa: o destino da escolha), a causa da UAT-185 passo a passo e o que falta unificar (um quadro de tela único, que pede navegador). `docs/specs/arch.md`: seção nova «Uma peça só para escolher álbuns e um classificador só (F57)». `docs/specs/behavior.md`: dez estados reescritos e três novos (`^album-type-one-classifier`, `^series-edit-album-picker`, `^series-edit-saving`). Manual: `00`, `01`, `10`, `14`, `15`, `16`, `21`, `22` (as seções do classificador reescritas) e `29`. Não tocados: `docs/specs/uat.md`, `MEMORY.md`, `ROADMAP.md`, `docs/specs/priority.md`. Fica para o integrador: a linha do padrão Strategy em `docs/specs/constitution.md` ainda cita a pasta `classification/`, que saiu (a constituição tem cópia gerada e não foi emendada aqui).

## [2026-11-19 20:39] session — F62: funções tocadas dentro do limite de complexidade

Conferida a complexidade das funções novas e tocadas da F62 com `npx eslint --no-config-lookup --rule '{"complexity":["error",10]}'`: nenhuma função nova passa de 10. Quatro tocadas passavam ou passaram a passar e foram extraídas, sem mudar o que fazem: `RegeneratePanel.render` (11, agora com `_recipeToShow`), a comparação do `BEARankingStrategy` (12, agora uma cadeia de três comparadores pequenos), `PlaylistsService.restoreDraft` (15, agora com `_draftFor`) e `PlaylistsView.renderContent` (13, agora com `shownBatchNameOf` e `savedBatchNameOf`). O fim de `_writeCurrentBatch` foi para `_showSaved`; a função continua em 13, como a F60 a deixou, sem ramo novo. Ficaram acima do limite, tocadas sem ramo novo: `TopNAlgorithm.generate` (22; saiu um `console.log`) e o enriquecimento de faixa do `BalancedRankingStrategy` (30; uma atribuição dentro de um `if` que já existia). São da F58.

## [2026-11-19 20:39] session — F57: um classificador só e uma peça só para escolher álbuns (UAT-185, UAT-193)

Ramo `fix/f57-one-album-picker-and-one-classifier`, por um auxiliar sem navegador. **Causa da UAT-185, reproduzida em teste:** o classificador tinha duas definições de «eletrônico»; a larga procurava por pedaço de palavra e tem «hardcore», e o catálogo dá a «To Pimp a Butterfly» e a «good kid, m.A.A.d city» o gênero «Hardcore Rap»; o portão de gênero os tratava como eletrônicos, a definição estreita não deixava consultar a lista da IA, e o álbum saía sem resposta («?»). Em `albums-curated.json`, 508 álbuns estavam no mesmo buraco (JAY-Z, Nas, Eminem, 2Pac…). **O conserto é de desenho:** `models/albumType.js`, uma função pura que devolve tipo e motivo; o gênero deixou de ser portão e só diz se a lista da IA é evidência; «eletrônico» por nome inteiro de gênero; palavras do título só inteiras. **A peça:** `components/album-picker/AlbumPickerController.js` é a busca de artista da Home e da janela «Edit Series» (mesmo estado da F67, mesmos seis filtros, mesmo cartão, mesmo caminho `scanArtist` com prazo); as telas diferem só em `onPick`. Salvar a edição tem estado (`models/seriesDraft.js`): botão ocupado, sem gravação em dobro, falha dita na janela com a lista mantida. Saíram `SearchController.js`, `ArtistScanner.js`, `AlbumTypeClassifier.js`, a pasta `classification/`, `EditionFilter.js`, `types.js`, `getArtistDiscography`, e os dois arquivos de `components/search/` que ninguém importava (o teste de texto de fora passa a provar o cartão da busca). Função de aptidão nova: `test/architecture/oneAlbumPicker.test.js`. Suíte: 1521 testes (1417 antes); `vite build` compila. Decidido pelo agente — revisável: álbum eletrônico sem a lista da IA aparece em «Studio» (antes, «?»); «gold», «definitive» e «complete» deixam de marcar coletânea; «Live in» no começo do título marca ao vivo; a regra do «Hello World N» virou regra geral (número sobrando não casa com a lista). Nada visto num navegador.

## [2026-11-19 20:39] session — F58: um Firebase só, lojas de inventário e de usuário viram estado puro, a tela não importa o banco (UAT-14, UAT-18, UAT-19)

No ramo `fix/f58-load-service-within-the-limit`. **UAT-14:** só restava `views/SaveAllView.js:5-6`, que importava o SDK 11.6.1 do Firebase por CDN (um segundo Firebase, sem app iniciado). A tela de migração passa a receber da rota (`app.js`) o utilitário de migração, feito com o Firestore único do app, e quem está logado; não importa Firebase nenhum. A tela continua sem caminho pelo menu (UAT-11, decisão do MJRP pendente): foi feito o mínimo correto. Teste: `test/architecture/firestoreBehindRepositories.test.js`. **UAT-18:** `stores/inventory.js` e `stores/UserStore.js` viram estado puro; ler e gravar o inventário é do `services/inventory/InventoryService.js` (montado em `inventoryWiring.js`), ouvir o login é do `services/auth/UserSessionService.js` (montado em `userSession.js`, importado pelo `app.js`); as estatísticas do inventário viram regra pura (`models/inventoryStats.js`). **UAT-19:** `SeriesView`, `SeriesEventHandler` e `TopNav` não importam mais o banco nem o `app.js`; o ciclo `app.js` ↔ `stores/inventory.js` acabou. O que resta das duas (a loja do Spotify, o controlador e as telas de playlists e do blend) está em código do ramo da F62 e ficou numa lista que só pode diminuir, em `test/architecture/layerBoundaries.test.js`. Sem navegador nesta sessão.

## [2026-11-19 20:33] session — F62: exportar para a Apple Music avisa a falha e não duplica

Exportar para a Apple Music (UAT-200), no ramo `fix/f62-blend-and-export-do-what-they-say`. **Falha calada:** o erro ao criar uma playlist ia só para o console, e a tela chamava a exportação sem passar o botão, que por isso nunca era desabilitado nem mostrava progresso. **Duas vezes:** nada impedia o segundo clique, durante ou depois. Agora a regra mora em `services/AppleMusicExportService.js`, que devolve um relato (criadas, recusadas com o motivo, sem nenhuma faixa achada, faixas não achadas, pasta feita ou não), e a tela diz esse relato em avisos de 12 s. Um clique com a exportação em curso não cria nada e avisa. O que foi criado nesta sessão não é criado de novo: fica lembrado o id que a Apple devolveu por playlist (nome, faixas e ordem), no mesmo `exportLedger` do Spotify. **Escolha, do agente:** lembrar o id na sessão, e não conferir a biblioteca, porque lá o nome não é único e a playlist recém-criada demora a aparecer na lista, o que falharia justamente no segundo clique; o limite é que um recarregar da página zera a lembrança. Saiu `handleExportToSpotify` de `PlaylistsExport.js`, sem uso e com os mesmos defeitos.

## [2026-11-19 20:32] session — F58: a espera do servidor vira estado da loja de carga; o pedido por fonte ganha regras puras (UAT-194)

No ramo `fix/f58-load-service-within-the-limit`. Medição de hoje com a regra `complexity` do ESLint (limite 10) em `public/js`, `shared` e `server`: 136 funções acima de 10; na pasta da carga só duas, `_holdFor` (12) e `_enrichOne` (12), as duas de `AlbumLoadService.js`. Extraído: (1) a espera («entre na conta», «aguarde», «fonte ocupada») sai do serviço para `services/albums/LoadHold.js`, com as regras em funções puras (`models/albumLoadHold.js`), e passa a ser estado da `AlbumLoadStore` (`setHold`/`getHold`); o `AlbumAsks` deixou de olhar a cada segundo e aprende da espera pela assinatura da loja, com um prazo único só enquanto há espera (`holdWait` em `models/albumAsk.js`). (2) o pedido por fonte: `models/albumSourceAsk.js` (`awaitsSource`, `overNewestAlbum`, `sourceOutcome`) e `utils/LatestOnly.js`. Achado ao tirar o relógio: ele também era o que avisava o pedido de que a carga foi parada («Clear Cache»), porque `stop()` não mudava nada na loja; a parada virou estado (`stopGeneration`/`isStopped`). Depois: nenhuma função da pasta da carga acima de 10. Testes novos: `test/models/albumLoadHold.test.js`, `test/models/albumSourceAsk.test.js`, `test/services/albums/LoadHold.test.js`, `test/utils/LatestOnly.test.js`, e casos em `albumLoad.test.js`, `albumAsk.test.js`, `AlbumLoadService.test.js`, `AlbumAsks.test.js`. Sem navegador nesta sessão: a prova na tela fica para o integrador.

## [2026-11-19 20:30] session — F62: exportar para o Spotify renova o acesso, relata e não duplica

Exportar para o Spotify, no ramo `fix/f62-blend-and-export-do-what-they-say`. **Acesso vencido (UAT-200):** a exportação recusava de saída um acesso vencido (`isAuthenticated()` olha só a hora) mesmo havendo token de renovação, e um 401 no meio virava «Spotify Token Invalid» sem tentar nada. Agora o acesso vencido é renovado antes de começar; um 401 no meio renova UMA vez e repete a chamada; se não der, a janela diz «Spotify needs you to connect again», mostra o botão «Connect to Spotify again» e lista o que foi criado e o que não foi. Renovações pedidas ao mesmo tempo dividem uma só. **429:** com `Retry-After` de até 30 s a exportação espera e repete; acima disso para e diz quanto o Spotify pediu (a carga de álbuns não espera: tem o prazo dela). **Modo separado (UAT-09):** cada playlist criada volta com o seu endereço e a janela mostra um link «Open in Spotify» por playlist; o texto sob o botão acompanha o modo escolhido. **Sem duplicar:** o que foi criado nesta sessão não é criado de novo ao exportar outra vez (`services/export/exportLedger.js`); uma playlist criada sem todas as faixas é completada, não refeita. A busca de faixa não engole mais a falha: «não achei» é resposta, falha é falha. A faixa que já traz o endereço do Spotify não é buscada de novo. Saíram o `alert()` do login sem client id (agora um aviso) e `createSeriesPlaylists`, sem uso.

## [2026-11-19 20:24] session — F62: tela de playlists com desfazer, refazer, excluir playlist e título que fica

Tela de playlists (`/playlists`), no ramo `fix/f62-blend-and-export-do-what-they-say`. **Desfazer e refazer (UAT-02):** dois botões em «Actions & Export», desabilitados quando não há passo; o estado vem da store (`canUndo`, `canRedo`). O histórico não tinha ponto de partida (o primeiro passo gravado já era a mudança) e continuava valendo depois de gerar de novo: agora começa no conjunto como chegou à tela e recomeça quando outro conjunto entra (blend, gerar de novo, abrir lote, salvar). Desfazer tudo volta a «nada a salvar». Sem atalho de teclado: não existia. **Excluir playlist (UAT-03):** botão em cada cartão. **Título (UAT-04):** o campo editável mostrava «1. Lote - Título» e nada lia o que era digitado; agora só o título é editável, vai para a playlist (`name` e `title`) ao sair do campo, é salvo com o lote e volta ao abrir para edição; a tela não é redesenhada enquanto se digita. **Topo (UAT-190):** «Editing: nome do lote», um rótulo «Batch Name», caminho «Home › Blend › Playlists» ou «Home › Saved Playlists › Edit Batch». **Painel de reconfigurar (UAT-200):** abre na receita com que as playlists foram geradas (lida do `_meta`, que é salvo) e guarda o que a pessoa mexeu entre um redesenho e outro; antes voltava para a receita recomendada e esquecia duração, ranking e Top N.

## [2026-11-19 20:24] review — F68 provada em produção: 193 de 199 álbuns com página de notas; UAT-205 em fixed

Varredura repetida em produção: de 183 para 193 achados; os 6 «não tem» restantes são outro lançamento ou ausência real, todos carimbados com a versão 2 da regra; nenhuma falha. Contagem de álbuns trocados: 227 de 227 iguais. Prova em `reports/evidence/F68/2026-11-19-identity-rules-reviewed-proof.md`. Decisões do auxiliar que ficam, revisáveis pelo MJRP: uma tabela pequena de «escritas conhecidas» mantida à mão (Blonde/Blond, POWER UP/PWR-UP, Substance 1977-1980/Substance); um vizinho aceito quando é o único («Hotel California» com só a versão ao vivo listada), sempre sinalizado no cartão.

## [2026-11-19 20:23] session — F62: cada receita do blend faz o que o nome diz, ou avisa

Ramo `fix/f62-blend-and-export-do-what-they-say`. As quatro receitas do menu têm agora um teste que prova o que o nome promete, pelo caminho que a tela usa (`test/algorithms/recipes.promise.test.js`). Defeitos que existiam na `main` e foram consertados: «By Artist then By Rank» não agrupava por artista (lia `artistName`, que a faixa não tem); «My Own Ranking», num álbum sem ranking da pessoa, usava a ordem de aclamação (`album.tracks`) e não a do álbum; «Top Acclaimed» punha uma faixa sem nota acima de uma com nota quando ela era popular (a popularidade entrava no lugar da nota); o embaralhar era viciado. O aviso da F56 de fonte faltando diz agora a ordem usada no lugar («Their tracks were ordered in album order instead»), e essa frase é conferida contra o que cada ranking faz. «Discovery Mode» saiu do menu: nenhuma receita o lia (UAT-08; decidido pelo agente, revisável). A duração alvo aparece nas receitas Top N quando a saída pode ser dividida (antes dividia por 60 minutos sem mostrar). As playlists geradas guardam a receita inteira em `_meta`.

## [2026-11-19 20:20] session — F68 em produção (servidor, depois site)

Servidor publicado primeiro (`764b495`, revisão `mjrp-proxy-00203-lwg`; volta `mjrp-proxy-00202-ktd`), depois o site (pacote `main-Cm36-Baj.js`). Antes de publicar, o servidor local respondeu contra a fonte real como previsto: dos 16 álbuns da varredura, 10 com página e 6 `not_found` com a versão 2 da regra; «Nevermind», «Core (Remastered)», «No Quarter» e «The Wall» nas páginas certas. A varredura em produção roda agora.

## [2026-11-19 20:14] session — F68: documentos da feature, a seção de identidade do arch.md reescrita como uma só, comportamento e manual

No ramo `fix/f68-album-identity-rules-reviewed`: `spec.md` (`status: In Progress`, REQ-01 a REQ-10 com `verified_by`, a mudança de comportamento declarada, as três perguntas abertas com a decisão do agente), `plan.md` (a tabela da verdade da fonte para os 16 álbuns, o fluxo de uma comparação, as tentativas de busca, a versão da regra no «não tem» e o custo na primeira carga, «Como acrescentar uma regra», onde uma regra de gênero entraria, o que as outras três fontes ganham de graça, e o trecho de console da prova em produção) e `tasks.md` (TASK-01 a TASK-08 fechadas; TASK-09 aberta, do integrador: a varredura rodada de novo em produção). No `docs/specs/arch.md`, a seção «Uma regra só para dizer que é o mesmo álbum» virou uma descrição atual só (saíram as duas camadas «fatia 1» e «fatia 2», e três parágrafos da F55 que tinham ficado soltos no fim do arquivo, depois da seção da F61, voltaram para dentro dela). `docs/specs/behavior.md`: a linha do cartão, agora uma frase por regra do segundo degrau, e o prazo do «não tem», que depende da versão da regra. Manual: `23_Shared_Code.md` (a seção da regra reescrita), `02_Server_Structure.md` e `04_Backend_Logic_Services.md` (a busca do raspador em tentativas), `06`, `07`, `07b`, `08`, `10` e `24` (as frases que ficaram falsas). O `doctor` segue vermelho pelos 521 erros que já estavam na `main` (nenhum novo; a F68 saiu do aviso W20); o erro F1 do `MEMORY.md` (`## Now` atrás do registro) fica para o integrador, porque este ramo não mexe no `MEMORY.md`.

## [2026-11-19 20:12] session — F49 em produção (site); F57 começa

Site publicado da `main` (`1d5ed9b`, pacote `main-DPC1GW_g.js`). UAT-06 em `fixed` com a ressalva de que o clique não foi visto no navegador (nenhuma série do MJRP passa de 12 álbuns). Auxiliares trabalhando: F68, F62 e, agora, F57.

## [2026-11-19 20:11] review — F49 revisada pelo integrador; UAT-06 em fixed, sem prova do clique no navegador

Nenhuma série do MJRP passa de 12 álbuns (a maior tem 9), então o botão não aparece na conta dele; não criei série de teste. A prova é por teste com a tela de verdade (`reports/evidence/F49/2026-11-19-load-more-albums-proof.md`). Decidido pelo agente — revisável: publicar assim, com a ressalva escrita.

## [2026-11-19 20:08] session — F56 em produção (site)

Site publicado da `main` (`042da86`, pacote `main-BZG7nsE3.js`). A F56 não muda o servidor. Auxiliares trabalhando: F68 e F49; a F62 começa agora.

## [2026-11-19 20:08] session — F68: a regra de identidade revista (listas com nome), a busca da fonte de notas em tentativas ordenadas, e o «não tem» carimbado com a versão da regra

Ramo `fix/f68-album-identity-rules-reviewed`. Primeiro a verdade da fonte: 56 pedidos educados a `suggest.php` do BestEverAlbums (um por vez, 0,8 s entre eles), guardados como vieram em `test/fixtures/besteveralbums/suggest/`, e a tabela dos 16 em `test/fixtures/besteveralbums/sweep-2026-11-19.json`. Depois a regra (`shared/albumIdentity.js`), reescrita para ser lida de cima a baixo: normalização num lugar; o artista como lista de equivalências com nome (`ARTIST_EQUIVALENCES`: as mesmas palavras; os mesmos nomes em outra ordem); o título em dois degraus, o segundo como lista de regras com nome, frase e exemplo real (`SECOND_TIER_RULES`: antes do subtítulo, sem o que vem entre parênteses, o nome entre parênteses, com o nome do artista na frente, escrito de outro jeito); uma porta só do segundo degrau para «igual» (`acceptedAlone`, chamada pelo `pickAlbum` e pelo `compareKeptAlbum`); a tabela de todos os motivos como dado (`REASONS_EXPLAINED`), que o teste roda linha a linha. O raspador (`server/lib/scrapers/besteveralbums.js`) procura por tentativas ordenadas e nomeadas (`locateAlbum`: página do artista; `searchAttempts`: artista e título, título sozinho, artista sozinho; busca em HTML), com os títulos que a própria regra dá (`titlesToSearch`): a nota de edição não vai mais no texto da busca. Os dois limpadores de título (`cleanTitle` no app e no servidor) saíram; o Spotify, no app e no servidor, usa o `titleWithoutEditionNotes` da regra. O cartão ganhou uma frase por regra do segundo degrau (`identityNotice`). O servidor carimba o `not_found` com a versão da regra (`identityRule`), e o registro guardado no navegador só vale enquanto essa for a versão do app (`IDENTITY_RULE_VERSION`, agora 2). Resultado offline: 10 dos 16 achados; 3 são outro lançamento e 3 não existem na fonte. Suíte: 1343 testes, 110 arquivos (eram 1217, 107); `npx vite build` compila. Sem navegador nesta sessão: nada foi visto em tela.

## [2026-11-19 20:08] decision — F68: o que conta como o mesmo artista, o que entra no segundo degrau e a lista de escritas conhecidas (decidido pelo agente — revisável)

Com o que a fonte de notas respondeu em 2026-11-19: (1) os mesmos nomes em outra ordem são o mesmo artista («Robert Plant & Jimmy Page» = «Jimmy Page & Robert Plant»); «X and the Y» = «X & The Y» = «X & Y»; um nome mais curto ou mais longo não é («Page & Plant», «James Brown And His Famous Flames»). (2) O segundo degrau ganha três regras gerais, todas num sentido só (o pedido é o curto) e todas marcadas no álbum: o título do candidato com algo mais entre parênteses que não é nota de edição nem número («In The Court Of The Crimson King (An Observation By King Crimson)»), o título pedido escrito entre parênteses no candidato («Untitled (Led Zeppelin IV)»), e o nome do artista na frente do título («James Brown Live At The Apollo»). (3) O que nenhuma regra deriva sem errar em outro lugar vira um fato numa lista (`KNOWN_WRITINGS`), por artista: Frank Ocean «Blonde» = «Blond», AC/DC «POWER UP» = «PWR/UP», Joy Division «Substance 1977-1980» = «Substance». O intervalo de anos não virou regra geral porque «Greatest Hits 1970-2002» do Elton John não é o «Greatest Hits» dele. (4) Pedido longo nunca aceita o álbum curto: «More Balls to Picasso», «Unreal Unearth: Unheard» e «Before the Frost... Until the Freeze» seguem «não tem», por serem outro lançamento. Dois testes da F55 mudaram de `different` para o segundo degrau («Weezer» contra «Weezer (Green Album)»; «Hotel California» contra «Hotel California (Live at the Forum '76)»): sozinhos numa fonte passam a ser aceitos, com o aviso no cartão, como já acontecia com o subtítulo.

## [2026-11-19 20:08] session — F49: spec, plano, tarefas, comportamento e manual escritos no ramo

A pasta da F49 preenchida para o que foi construído (`status: In Progress`; 5 REQ, todos com `verified_by`; 7 tarefas, 5 fechadas; abertas a prova no navegador, do integrador, e o julgamento do MJRP). A spec traz a causa com arquivo e linha da `main` em `4dc353a` e o que ficou de fora. `docs/specs/behavior.md`: estado novo `^library-series-more-albums`. Manual: `09` (a grade e a série aberta inteira), `12` (o botão, que o `13` dizia estar lá e não estava), `15` e `29` (a ação `load-more-series` e `onShowAllAlbums`), `99` (linhas da `SeriesView`). Para o MJRP julgar: o texto «Load N more albums» ficou, embora o clique não carregue nada; a escolha vale só para a visita. `docs/specs/uat.md`, `MEMORY.md` e `ROADMAP.md` não tocados: são do integrador.

## [2026-11-19 20:08] session — F49: o botão de carregar mais álbuns mostra o resto da série (UAT-06)

Ramo `fix/f49-load-more-albums`, por um auxiliar sem navegador. Confirmado na `main` (`4dc353a`) por teste da tela inteira: o clique chegava ao ouvinte da raiz (`SeriesEventHandler`) e era jogado fora, porque `load-more-series` não estava entre as ações de série; o ouvinte próprio da grade (`_attachEventListeners`) não tinha chamador e, mesmo ligado, colava cartões no DOM que o redesenho seguinte apagaria. Os álbuns depois do décimo segundo já estavam carregados: a carga pede todos os álbuns das séries da página, e o corte em 12 é só de desenho, só na grade compacta do painel de todas as séries. Conserto: a escolha é estado explícito da tela (`SeriesExpansion`, em `models/seriesExpansion.js`, criado pela `SeriesView` a cada visita), a grade desenha por ele a cada redesenho, o clique passa pelo ouvinte que a tela já tinha, e o foco vai para o primeiro álbum que apareceu. Botão com `type="button"` e singular («Load 1 more album»). Decidido pelo agente — revisável: a escolha mora na tela e não no controlador (que a F56 está mexendo); o texto «Load» ficou. `SeriesController.js` e `AlbumLoadService.js` não tocados. Suíte: 1330 passando (1307 antes); `vite build` compila. Nada visto num navegador.

## [2026-11-19 20:07] review — F56 provada pelo integrador; UAT-189 e UAT-191 em fixed

Blend de uma série já carregada: de 19,2 s para 0,05 s; avisos dizendo qual álbum ficou sem qual fonte; edição de lote e regeneração com a série certa. Prova em `reports/evidence/F56/2026-11-19-screens-through-the-load-service-proof.md`, com o que não foi visto. Mudanças de comportamento para o MJRP julgar: some a pergunta «No ratings detected… Continue?» (os avisos a substituem); o «Refetch» faz o cartão voltar a carregar e não mostra mais «Metadata updated»; a coleção compartilhada `albums` do banco deixa de ser escrita (só o «Refetch» antigo escrevia, nada lia).

## [2026-11-19 20:05] session — F56 junto com a `main`: dois testes do método retirado saem

A F52 fatia 3 tinha consertado `adoptAlbum`; a F56 retirou o método (o «Refetch» agora é `reloadAlbum`, pela fila). No encontro dos dois ramos ficou a versão da F56, e os dois testes do método retirado saíram.

## [2026-11-19 20:02] session — F56: spec, plano, tarefas, arquitetura, ADR-0019, comportamento e manual escritos no ramo

Ramo `fix/f56-screens-load-through-the-service`. A pasta da F56 preenchida para o que foi construído (9 REQ com `verified_by`, 15 tarefas; abertas a prova no navegador com os tempos, do integrador, e o julgamento do MJRP); o diagnóstico com arquivo e linha e a escolha entre «um contexto por tela» e «juntar-se à geração em vigor» estão no plano. `docs/specs/arch.md` ganhou a seção «Toda tela pede os álbuns ao serviço de carga (F56)»; a lista «Not done yet» da ADR-0019 diz o que a F56 fechou (decisões 1 e 7) e o que ficou (o botão «Enrich Data» e a fila do Spotify em segundo plano ainda pedem por fora da fila); `docs/specs/behavior.md` tem os estados do blend, das playlists e da tela de álbuns (cinco novos); manual 01, 06, 07, 08, 15, 17, 18, 19, 21 e 99 corrigidos. O status da ADR e o `docs/specs/uat.md` não foram tocados.

## [2026-11-19 19:58] session — F63 em produção (site)

Site publicado da `main` (`5c3abda`, pacote `main-Bb_Tr-dD.js`). A F63 não muda o servidor. Auxiliares trabalhando: F68 e F56.

## [2026-11-19 19:57] review — F63 provada pelo integrador; seis issues em fixed

Prova em `reports/evidence/F63/2026-11-19-home-and-navigation-proof.md`. Em `fixed`: UAT-201, UAT-26 (consertada pela F67, agora com teste), UAT-13, UAT-27, UAT-07, UAT-192. Decidido pelo agente — revisável: UAT-10 (telas de ranking só por endereço) e UAT-11 (tela de migração) ficam abertas e vão para a F65 com a recomendação de aposentar as telas; tirar tela é decisão do MJRP. Mudanças de comportamento para ele julgar: o menu da conta não abre mais só com o mouse por cima; a caixa de colar mantém as linhas a consertar; entrar numa série não cria entrada nova no histórico.

## [2026-11-19 19:56] session — F56: blend, edição de playlists, «Refetch» e salvar série passam pelo serviço de carga (código, no ramo)

Ramo `fix/f56-screens-load-through-the-service`, a partir da `main` em `d210f35`. Uma porta só para qualquer tela pedir os álbuns de uma série: `albumAsks.albumsOf({ series, sources, signal })` (`services/albums/AlbumAsks.js`), que entra na carga em vigor (`AlbumLoadService.join`/`leave`) sem começar geração, reaproveita o que a tela de álbuns ou o navegador já têm, espera as fontes que a receita lê e devolve um resultado tipado (prontos, falhos com motivo, fontes em falta). O blend e a edição de playlists deixaram os laços próprios; o «Refetch» virou `reloadAlbum` (pela fila); salvar a edição de uma série reconcilia em vez de recarregar tudo, inclusive quando a edição escolhida muda; a injeção de álbuns e os escritores avulsos da prateleira saíram. Os métodos antigos do cliente (`fetchAlbum`, `fetchMultipleAlbums`, `BEAenrichAlbum`) foram removidos: nada mais os chamava. Teste de aptidão novo: `test/architecture/screensLoadThroughTheService.test.js`. Suíte: 1232 passando (1143 antes); `vite build` compila. Decisões do agente, revisáveis: o blend segue com os álbuns prontos e avisa quais ficaram de fora (para só quando nenhum está pronto); a pergunta «No ratings detected… Continue?» saiu, no lugar vêm os avisos de fonte em falta; o documento compartilhado `albums` deixou de ser gravado pelo «Refetch» (ninguém o lia). Não foi visto num navegador.

## [2026-11-19 19:56] session — F63: as duas sobras das playlists guardadas (UAT-27 e o olho da UAT-13), pelo integrador

O auxiliar da F63 não podia tocar nas playlists guardadas (a F61 estava em outro ramo). Com a F61 na `main`: o botão «Create Series» do estado vazio navega pelo roteador (era `location.hash`, que não ia a lugar nenhum), e os botões da linha de playlist aparecem sem mouse (mesma regra das faixas).

## [2026-11-19 19:54] session — F63: spec, plano, tarefas, comportamento e manual escritos no ramo

A pasta da F63 preenchida para o que foi construído (13 REQ: 10 com `verified_by`, dois deles «já consertado» pela F67, F50 e F54 com a prova; 3 não entregues e ditos assim: UAT-10 e UAT-11 pedem decisão do MJRP, UAT-27 ficou fora do escopo dado). A spec traz a tabela «ainda existia?» de cada issue com arquivo e linha, e a lista antes → depois dos 28 textos traduzidos, para o MJRP rever as palavras. 19 tarefas; abertas a prova no navegador (do integrador), o julgamento do MJRP e as três não entregues. `docs/specs/behavior.md`: 12 estados reescritos e 4 novos (`^home-bulk-skipped`, `^home-bulk-empty`, `^blend-series-from-address`, `^app-back-goes-back`). Manual: 00 (mapa de arquivos), 08, 11, 13, 15, 17, 19, 21 (seção 1.2), 24, 29, 99. Suíte: 1233 passando (1143 antes); `vite build` compila; `doctor.py` com os mesmos 521 erros de antes do ramo.

## [2026-11-19 19:48] session — F63: os itens «Soon» do menu não navegam mais

Confirmado na `main` por teste (UAT-201): By Artist, By Genre e By Track, marcados «Soon» no menu «Music Series», eram links com endereço; o ouvinte do próprio item recusava o clique, mas o roteador, que ouve todo link do app, navegava do mesmo jeito. Agora o item «Soon» não é link (`aria-disabled`, sem endereço), como o `docs/specs/behavior.md` já dizia (`^app-main`). A gaveta do celular continua com os três links, que abrem a tela «Coming Soon»: não mexido.

## [2026-11-19 19:47] session — F63: Esc num diálogo responde «cancelar»; teste do título único da aba

Confirmado na `main` (UAT-201, «um diálogo fechado com Esc deixa a ação pendurada»): `DialogService` tirava o diálogo da tela no Esc e a promessa de `confirm`/`prompt` nunca era resolvida. Agora o Esc, e um diálogo que toma o lugar de outro, respondem como «Cancel» (`false` / `null`). O título único da aba (metade da UAT-192, consertada pela F54 em `791da82`) ganhou o teste que não tinha: `test/architecture/oneTabTitle.test.js`.

## [2026-11-19 19:45] session — F63: as receitas do blend em inglês; teste que recusa texto em português no app (UAT-192)

Confirmado na `main`: 28 textos em português em `public/js/algorithms/*.js` (descrições das receitas, subtítulos das playlists geradas, descrições de curadoria), numa interface em inglês. Passados para o inglês mantendo o sentido (a lista antes → depois está no `spec.md` da F63, para o MJRP rever as palavras). Teste de arquitetura novo, `test/architecture/interfaceInEnglish.test.js`: lê toda string e template de `public/js` (pelo `espree`, sem comentários) e falha em letra acentuada do português ou palavra só do português; exceções nomeadas (`eletrônica`, `electrónica`, `Zé's`). O título da aba (a outra metade da UAT-192) já estava consertado pela F54: um título só, igual ao do `index.html`. Fora de `public/js` e não tocados: `shared/curation.js` (três subtítulos em português, código do servidor) e as páginas `public/debug-*.html`. Playlists já guardadas mantêm o subtítulo antigo: é dado gravado.

## [2026-11-19 19:44] session — F63: o menu de mistura abre com a série de origem escolhida (UAT-07, UAT-192)

Confirmado na `main`: `BlendingMenuView.mount` não lia o `seriesId` que o botão «Blend your Albums» põe no endereço (`/blend?seriesId=<id>`). Agora `BlendSeriesSelector.selectById` escolhe a série depois da carga e a tela já abre com o passo da receita liberado; série que não existe não escolhe nenhuma. Os cartões de série viraram botões para o teclado (`role`, `tabindex`, `aria-pressed`, Enter e espaço). `BlendingController.js` não foi tocado. Sem navegador nesta sessão.

## [2026-11-19 19:44] session — F52 fatias 3 e 4 em produção; F68 em andamento

Site e servidor publicados da `main` (`b7bb0cc`; revisão `mjrp-proxy-00202-ktd`, volta `mjrp-proxy-00201-kcq`). A varredura de 199 álbuns rodou contra essa revisão sem falhas. Auxiliares trabalhando: F68 (revisão das regras de identidade, com os 16 casos da varredura), F56 e F63. Pendente do MJRP: fixar uma instância no Cloud Run e aceitar a ADR-0021.

## [2026-11-19 19:43] session — F63: o menu da conta abre no toque; o ✕ da faixa aparece sem mouse (UAT-13)

Confirmado na `main`: o menu da conta só abria com o mouse em cima (`group-hover`), e as ações da faixa ficavam com `opacity-0` até o mouse passar. `AuthNav`: o avatar é um botão com `aria-expanded`/`aria-haspopup`; abre e fecha no toque ou clique, fecha com clique fora e Esc (o foco volta ao avatar), seta para baixo abre no primeiro item; não abre mais só por passar o mouse. `TrackRow`: as ações só ficam escondidas onde o aparelho tem mouse (`@media (hover:hover)`), e aparecem com o foco do teclado; o botão ganhou `aria-label`. Não feito, por estar fora do escopo dado (código das playlists guardadas): o olho de detalhes em `SavedPlaylistRow.js:51` e `SavedPlaylistActions.js:86`, que têm o mesmo `opacity-0 group-hover`. Sem navegador nesta sessão: como fica na tela é do integrador.

## [2026-11-19 19:43] review — varredura da fonte de notas: 16 de 199 álbuns sem página pela regra exata

Relatório em `reports/audits/2026-11-19-mjrpalbumblender-v0-ratings-source-sweep.md`. 183 achados, 16 `not_found`, nenhuma falha (a fila educada segurou 199 pedidos). Os 16 são, na leitura do agente, quase todos custo da regra exata na fonte (artista em outra ordem, qualificador entre parênteses, título escrito de outro jeito). Decidido pelo agente — revisável: a F68 (revisão das regras de identidade) passa na frente e começa agora, com esses 16 casos reais como base.

## [2026-11-19 19:41] session — F63: colar uma lista aceita hífen no nome e pula a linha ruim avisando

Confirmado na `main`: «Jay-Z - The Blueprint» virava artista «Jay» e álbum «Z - The Blueprint» (`line.split('-')`), e uma busca que quebrava numa linha abortava as outras. Um parser só para a linha colada, `parsePastedAlbumLine` em `models/albumQuery.js` (é o `parseAlbumQuery` mais o que só uma linha colada tem: marcador de lista, travessão ou tab como separador, espaço faltando de um lado do hífen), com tabela de 31 casos em `test/models/bulkPaste.test.js`. `models/bulkPaste.js` (puro) lê a lista e diz o que a tela mostra; `HomeController.handleBulkProcess` saiu de complexidade 15 para 4. A linha que não entra é pulada e listada sob a caixa (número, texto, motivo) e fica na caixa para ser corrigida; as outras seguem. Sem `alert`. A UAT-26 (`toast.warn`) já estava consertada pela F67 (`4b6aa73`) e ganhou o teste que faltava. Sem navegador nesta sessão.

## [2026-11-19 19:41] session — F63: o botão voltar volta (o roteador é o dono do histórico)

Ramo `fix/f63-home-and-navigation-answer`. Três armadilhas do botão voltar confirmadas na `main` e consertadas no dono: (1) a tela de álbuns acrescentava uma entrada ao entrar em `/albums/<id>` (`SeriesController.loadScope` chamava `history.pushState` por conta própria), e voltar caía de novo em `/albums/<id>`: é o «preso depois de criar uma série» da UAT-201; (2) as rotas que só mandam adiante (`/callback` do Spotify, `/album-series`, `/series`, endereço sem tela, `/`) empilhavam o destino por cima de si mesmas. O roteador ganhou `redirect` (troca a entrada) e `setAddress` (a tela muda o próprio endereço por ele); teste de arquitetura `test/architecture/historyOwnedByRouter.test.js` recusa escrita do histórico fora do roteador (três exceções conhecidas, com o motivo). A Home «morta» depois do Spotify já estava consertada pela F67 (`test/router.overlap.test.js`) e o botão «Connected» pela F50 (`test/services/spotify/SpotifyAuthSignal.test.js`). Sem navegador nesta sessão: a prova na tela fica com o integrador.

## [2026-11-19 19:38] decision — F69 criada: popularidade do Spotify, falha é falha (decidido pelo agente — revisável)

A proposta emendada da F52 deixou este ponto de fora. Feature de via rápida, `^REL-40`, conserta a UAT-206 (aberta agora). Criada na `main` antes de qualquer ramo, sob a dispensa do MJRP de 19:03. Servidor publicado com as fatias 3 e 4 da F52 e o conserto do artista com nota: revisão `mjrp-proxy-00202-ktd` (volta: `mjrp-proxy-00201-kcq`).

## [2026-11-19 19:36] review — F52 fatias 3 e 4 provadas; defeito da F55 achado e consertado («Nirvana (US)»)

Prova em `reports/evidence/F52/2026-11-19-slices-3-4-proof.md`. Achado: em produção desde a F55 fatia 1, a fonte de notas respondia «não tem» para álbuns cujo artista a fonte escreve com uma nota no fim («Nevermind by Nirvana (US)»). Consertado na regra (`artistNamesFromLabel`) e na busca da página do artista, com testes tirados da resposta real. Decidido pelo agente — revisável: o serviço do Cloud Run permite até 20 instâncias e a fila educada vale por instância; não mudei a configuração do serviço (fica para o MJRP). Depois de publicar, varrer os álbuns do MJRP atrás de outros «não tem» falsos.

## [2026-11-19 19:31] session — F59 fatia E e F61 em produção (site)

Duas publicações do site da `main`: `a6092a7` (F59 fatia E: Tailwind compilado com o site, sem script de terceiro; endereços de fora conferidos) e `4e4555b` (F61: playlists guardadas rápidas; pacote `main-CVU46dC0.js`). Em produção depois da F59: nenhum pedido ao CDN do Tailwind, nenhum aviso no console, estilos aplicados. UAT-25 e UAT-186 em `fixed`. A UAT-199 já estava em `fixed`; o resto dela (endereços) foi entregue. A ADR-0021 segue `Proposed`, à espera do MJRP. Nenhuma das duas muda o servidor.

## [2026-11-19 19:31] session — F52 fatias 3 e 4: documentos da feature, arquitetura, comportamento e manual

No ramo `fix/f52-slices-3-4`: `spec.md` com a fatia 2 marcada como entregue pela F55, as fatias 3 e 4 como ficaram, os REQ-06 a REQ-10 com `verified_by`, a mudança de comportamento declarada e duas perguntas abertas (os números escolhidos sem medir; os fatos antigos da série); `plan.md` com a seção «Fatia 3 e medição» (onde a seção 11 valeu sobre o pedido da sessão, os módulos, a tabela de números, as alternativas, os riscos e o plano de testes); `tasks.md` com as tarefas fechadas e uma aberta para o integrador (TASK-25), além da TASK-18, que é decisão do MJRP. `docs/specs/arch.md`: a seção 12 da proposta, com o que foi construído e os seis pontos que ficam abertos. `behavior.md`: os prazos do guardado e a carga das notas em espera. Manual: `02_Server_Structure.md`, `03_Backend_API_Layer.md` (ritmo, orçamento, a linha de log e como ler no Cloud Run), `07_Frontend_Data_Infra.md`, `08_Frontend_Models.md`, `18_Frontend_Logic_Core.md`. Fora da feature, por decisão da seção 11: a popularidade do Spotify (o que a leitura do código mostrou está no plano) e a memória curta por instância.

## [2026-11-19 19:31] session — F52 fatia 3, app: o «não tem» da fonte de notas leva o motivo e vale 24 horas ou 7 dias; a fonte ocupada segura a carga

Ramo `fix/f52-slices-3-4`. O `AcclaimEnricher` devolve, junto do `empty`, o motivo que o servidor deu (`not_found` ou `no_ratings`; nenhum quando a resposta é do servidor de antes da F52). O motivo vai com o estado até o registro guardado no navegador (`AlbumCacheAdapter`, tabela `EMPTY_TRUST`), que passa a valer conforme ele; um «vazio» sem motivo, inclusive os registros já guardados e a popularidade, segue valendo 1 hora. Uma falha continua sem ser guardada. O «Refetch» do álbum pergunta à fonte em qualquer momento, e o `adoptAlbum` só marca as notas como `done` quando o álbum voltou com notas (antes marcava sempre, mesmo quando o pedido tinha falhado). Um 503 `upstream_busy` com `Retry-After` segura a fila das notas até a hora dita, com aviso próprio (`HoldReason.SOURCE_BUSY`); sem `Retry-After` é falha com «tentar de novo». Compatibilidade: o site novo com o servidor de hoje lê o mesmo contrato; a aba de hoje com o servidor novo lê 503 e 504 como falha que pode repetir. Sem navegador nesta sessão: conferido só por testes.

## [2026-11-19 19:31] decision — por quanto tempo o app confia no «não tem» da fonte de notas: 24 horas e 7 dias (decidido pelo agente — revisável)

A proposta da F52 (seção 9) deixava o número com o MJRP e propunha 7 dias para os dois casos; a seção 11 (item 4), que vale sobre ela, manda começar em 24 horas para «álbum sem página» e 7 dias só para «página conferida, sem notas». Decisão: `not_found` vale 24 horas, `no_ratings` vale 7 dias, e um «vazio» sem motivo (servidor de antes da F52, registro antigo, popularidade) segue valendo 1 hora. O «Refetch» do álbum fura o prazo. Os números moram num lugar só, `EMPTY_TRUST` em `public/js/services/albums/adapters/AlbumCacheAdapter.js`. Sobe-se o prazo do «sem página» depois de ver, no log do servidor, quantos pedidos uma segunda visita ainda faz.

## [2026-11-19 19:30] review — F61 provada pelo integrador; UAT-186 em fixed

Playlists guardadas, conta do MJRP: primeira série em 0,26 s e lista inteira em 0,79 s (antes, hoje, 4,6 s; 20 s na regressão). Prova em `reports/evidence/F61/2026-11-19-saved-playlists-timing.md`. Proposta de modelo de dados do auxiliar (resumo dos lotes no documento da série) fica anotada no `plan.md` da F61, não feita.

## [2026-11-19 19:30] session — F52 fatia 3, servidor: orçamento de tempo, fila educada com a fonte de notas, um pedido por álbum de cada vez, e a linha de log da medição

Ramo `fix/f52-slices-3-4`. Três módulos novos, cada um com um trabalho e com o relógio injetado: `server/lib/politeQueue.js` (o dono do ritmo com a fonte raspada), `server/lib/timeBudget.js` (o tempo total de um pedido) e `server/lib/inFlight.js` (pedidos iguais simultâneos dividem um trabalho; nada fica guardado). O raspador (`besteveralbums.js`) entrega cada requisição à fila pelo `getPage` único, com prazo de 8 s (era 30 s), para de perguntar quando o tempo do pedido acaba e não pede o mesmo endereço duas vezes no mesmo pedido. O `EnrichmentService` dá 15 s a cada pedido de notas (o app espera 20 s) e responde `upstream_timeout` no fim; quando a fonte pede uma espera que não cabe, responde 503 `upstream_busy` com `Retry-After`. A rota escreve uma linha de log por pedido (`how`, `answer`, `ms`, `sourceRequests`), sem dado de pessoa nem de álbum. Números decididos pelo agente, revisáveis, sem medição da fonte: 2 requisições por vez, 250 ms entre inícios, espera de 1 s dobrando até 30 s no 429 e no 503, 3 tentativas, `Retry-After` cortado em 5 minutos. Tudo por instância do servidor. Pela seção 11 da proposta (item 10), a memória curta por instância não foi construída. Conferido num servidor de verdade, em cópia local: dois pedidos iguais deram `source` (3 requisições, 2,0 s) e `joined`; um álbum inventado deu `not_found` com 4 requisições. Foram 7 requisições ao BestEverAlbums no total.

## [2026-11-19 19:28] review — F59 fatia E provada pelo integrador (Tailwind compilado; endereços conferidos)

Oito telas comparadas com produção por estilo calculado, elemento a elemento, como visitante: iguais (diferenças só de escrita, listadas na prova). Receita selecionada no blend com o gradiente certo, com login. A ADR-0021 fica em `Proposed`: publicado sob a dispensa do MJRP de 2026-11-19 19:03 (decidido pelo agente — revisável); o aceite da ADR é dele. UAT-25 e UAT-199 em `fixed`; UAT-28 segue aberta.

## [2026-11-19 19:24] session — F61: spec, plano, tarefas, arquitetura, comportamento e manual escritos no ramo

A pasta da F61 preenchida para o que foi construído (8 REQ com `verified_by`, 12 tarefas, a prova no navegador com o tempo medido aberta para o integrador); o diagnóstico com arquivo e linha e a proposta de modelo de dados (um resumo das playlists gravado na série, não feita) estão no plano. `docs/specs/arch.md` ganhou a seção «Leitura das playlists guardadas (F61)»; `docs/specs/behavior.md` tem os estados da tela (três novos); manual 00, 01, 06, 09, 14, 17, 21, 24, 29, 99 e a lista de regressão corrigidos. Decisões do agente, revisáveis: 8 leituras juntas com prazo de 15 s; a lista lida antes aparece na hora ao voltar e é relida por trás; série em leitura não tem bloco próprio; sair da tela não cancela a leitura. O doctor segue vermelho com os mesmos 521 erros de antes do ramo, nenhum da F61.

## [2026-11-19 19:20] session — F59: spec, plano, tarefas, ADR-0021 (proposta), stack, arquitetura e manual escritos no ramo

Ramo `fix/f59-tailwind-local-and-url-schemes`. A pasta da F59 preenchida para tudo o que foi construído nas fatias A, B, C e E (11 REQ com `verified_by`, 14 tarefas; abertas a prova no navegador, do integrador, e o aceite da ADR, do MJRP). ADR-0021 escrita em «Proposed»: o Tailwind fica, compilado junto com o site (aceite do MJRP pendente; a constituição diz «Tailwind only if requested»). `docs/specs/tech-stack.md` (linha do Tailwind: 3.4.19, como é construído, a ADR), `docs/specs/arch.md` (a casca e a linha de CDN/Assets) e o manual (07b com a `safeUrl`, 09a com a folha do Tailwind, 31) dizem o que o código faz agora. Um teste a mais, `test/security/buildHandsOutNoSource.test.js`, para o requisito dos mapas de código ter prova na suíte. 1002 testes. O doctor segue vermelho com 521 erros, como antes do ramo; entre eles um novo, que é do integrador: o `## Now` do `MEMORY.md` ficou atrás do log (este ramo não toca o `MEMORY.md`). Não mexido: o status das issues no `uat.md`.

## [2026-11-19 19:19] session — F61: a leitura das playlists guardadas com um dono só (código e testes, no ramo)

Ramo `fix/f61-saved-playlists-fast`. Causa lida no código antes de mexer: a tela fazia 1 + N leituras, uma depois da outra (48 para 47 séries, nunca duas no ar), e só desenhava depois da última; apagar um lote relia tudo de novo. Agora `SavedPlaylistsReader` (`public/js/services/playlists/`) é o único dono da leitura: uma leitura das séries, depois as playlists de cada série com até 8 no ar e prazo de 15 s; estado por série (lendo, pronta, vazia, falhou com «Try again»); geração e senha por série para a resposta velha não escrever; o que já foi lido fica na tela enquanto é relido. Medido com o banco falso, 47 séries: 48 leituras nos dois casos; esperas em fila até a lista toda: 48 antes, 7 agora; até a primeira série aparecer: 48 antes, 2 agora. Sem navegador: o tempo real fica para o integrador medir. Suíte: 1046 testes (982 antes); `vite build` compila.

## [2026-11-19 19:15] session — F59: Tailwind compilado junto com o site, sem CDN (UAT-25)

Ramo `fix/f59-tailwind-local-and-url-schemes`. O Tailwind deixou de ser um script de terceiros rodando a cada abertura: é compilado junto com o site (Tailwind 3.4.19, dependência de desenvolvimento; `tailwind.config.js` na raiz, lido pelo `vite.config.js`; entrada `public/css/tailwind.css`, importada pelo `app.js` depois do `index.css`, para as regras do Tailwind continuarem vindo por último como vinham). O tema da página (fonte Syne, cores `brand`, os dois gradientes) e as 13 classes de componente (`.btn`, `.glass-panel`, `.badge` e as outras) saíram do `index.html` sem mudança. O `index.html` perdeu o script do CDN, a configuração embutida e o bloco de estilos; a política de conteúdo perdeu `https://cdn.tailwindcss.com` em `script-src` e em `style-src` (`'unsafe-inline'` continua: há 6 manipuladores embutidos e estilos embutidos no código). Classes montadas na hora: um caso só, as cores da receita selecionada com `/10` em `BlendRecipeCard.js`, 14 classes na lista de segurança. Regra de arquitetura como teste: `test/architecture/tailwindBuiltWithSite.test.js` compila o CSS duas vezes e exige que toda classe que o Tailwind acha no texto das páginas e de `public/js` esteja no CSS do site (758 classes, nenhuma faltando; tirando `public/js` da lista de arquivos, faltariam 753), e que toda montagem de nome de classe esteja lida e listada. Uma linha `@apply` que nunca teve efeito em `tech-theme.css` foi removida, para o botão `.tech-btn` não mudar agora que o Tailwind lê esse arquivo. CSS do build: 76,7 kB (13,0 kB comprimido), contra cerca de 11 kB antes mais o script do CDN. 1001 testes, build ok, o servidor de desenvolvimento entrega os estilos. Quem compila precisa de `npm ci` (pacote novo). Sem navegador nesta sessão: a conferência visual fica com o integrador.

## [2026-11-19 19:14] session — F59: endereço vindo de fora só vira link quando é da web (UAT-199)

Ramo `fix/f59-tailwind-local-and-url-schemes`. Um endereço que vem de um provedor ou de um registro guardado só vira link quando é um endereço da web (http ou https): uma função só, `safeUrl` (`public/js/utils/safeUrl.js`), usada nos três lugares onde isso acontecia sem conferência — o selo do Spotify no cartão do álbum (`Card.js`), o link da fonte na tabela do ranking consolidado (`ConsolidatedRankingView.js`) e o botão que abre no Spotify a playlist recém-criada (`SpotifyExportModal.js`, achado nesta passada). Um endereço como `javascript:...` deixa de chegar ao `href`: o cartão cai no endereço montado com o identificador do Spotify, a tabela mostra um traço e o botão não abre nada. Regra de arquitetura como teste: `test/architecture/outsideUrlChecked.test.js` lê todo `href`, `window.open` e troca de endereço em `public/js` e recusa o que não está escrito no código nem passou pela função. 994 testes. Sem navegador nesta sessão.

## [2026-11-19 19:14] session — F55 fatia 2 em produção (site e servidor)

Site e servidor publicados da `main` (`dd16b01`; revisão `mjrp-proxy-00201-kcq`, volta `mjrp-proxy-00200-2nh`). Em produção, com login: notas de «Core» (página 2906) e de «No Quarter» pelo título curto e pelo longo (a mesma página 11402). UAT-184 em `fixed`. Em andamento com auxiliares: F59 (resto), F61, F52 fatias 3 a 5.

## [2026-11-19 19:12] review — F55 fatia 2 provada pelo integrador; UAT-184 em fixed

Contagem na conta do MJRP depois da fatia 2: 227 álbuns pedidos, 227 iguais. «No Quarter» carrega pelo segundo nível, com o aviso no cartão; o identificador corrigido do «Core» foi gravado na série. Prova em `reports/evidence/F55/2026-11-19-slice-2-browser-proof.md`, com o que não foi visto.

## [2026-11-19 19:10] decision — a resposta única da busca por IA entra no afrouxamento do subtítulo (decidido pelo agente — revisável)

Na prova no navegador, «No Quarter» seguiu falhando: o catálogo da Apple (loja dos EUA) não tem o álbum em nenhuma busca, e ele sempre veio da busca por IA do servidor, que responde «No Quarter: Jimmy Page & Robert Plant Unledded». A fatia 2 tinha deixado a resposta da IA fora do segundo nível da regra. Decisão: uma fonte que é perguntada por um álbum e responde um álbum é julgada como resposta única (`compareOnlyAnswer`, dentro da regra): o título pedido antes de um subtítulo é aceito, com o motivo gravado no álbum e o aviso no cartão. O título longo pedido e o curto respondido continua recusado. Também visto: o identificador corrigido do «Core» foi gravado na série (300973540 → 1285806791).

## [2026-11-19 19:05] session — F55 fatia 2: documentos da feature, arquitetura, comportamento e manual

No ramo `fix/f55-identity-slice-2`: `spec.md` com os REQ-10 a REQ-16 e os seus `verified_by`, a mudança de comportamento declarada e as perguntas respondidas; `plan.md` com o desenho, as decisões, as alternativas recusadas, os riscos e o plano de testes da fatia 2; `tasks.md` com as tarefas fechadas e uma aberta, a prova no navegador pelo integrador (TASK-15). `docs/specs/arch.md`: a seção da regra reescrita para os dois degraus, o escritor único e o guardado conferido na leitura. `behavior.md`: a linha no cartão, o identificador corrigido, o guardado conferido, a remoção de álbum. `data-model.md`: o `appleMusicId` é corrigido pelo app. Manual 01, 02, 04, 06, 07, 08, 10, 17, 23, 24 e 32. A UAT-184 não foi mexida. 1053 testes, build ok; o doctor segue vermelho com os mesmos 521 erros de antes do ramo.

## [2026-11-19 19:03] decision — MJRP: dispensa de bloqueio pelo processo até as issues acabarem

Palavras do MJRP: «ok, eu vou ter que sair nao se bloqueia, decida e registre, principalmente nao se bloqueie pelo processo, sou dono do harness e te dou um waiver aqui pra vc continuar trabalhando nas issues até finalizar todas». Leitura do agente: enquanto ele está fora, o agente decide, registra cada decisão como «decidido pelo agente — revisável», e segue pelas issues abertas sem parar por recusa de processo (a recusa é registrada e o trabalho continua). Não muda: push, aceite e carimbos são dele; nenhuma senha é digitada; nada de `--no-verify`; cada feature só vai a produção testada e provada, com a volta anotada.

## [2026-11-19 18:59] session — F55 fatia 2: adicionar e remover álbum de uma série perguntam à regra única

O `SeriesService` casava a consulta em texto por «a consulta contém o título (e o artista)»: remover «Core» podia remover «Core Memories», e «Core Memories» na série impedia adicionar «Core». Agora, ao remover, a consulta que guarda o id do álbum é a dele (dado antigo); senão a regra diz qual consulta pediu o álbum da tela (a consulta é o pedido, o álbum é o candidato), o título próprio antes da consulta de que ele é só uma edição. Ao adicionar, só o título próprio é repetição; uma edição é outra coisa a pedir. O teste de arquitetura passou a cobrir os leitores do guardado e o `SeriesService`. Achado: o caminho de remoção manual do `SeriesEventHandler` espera a mensagem «Could not find album query in series», que o serviço nunca emite (emite «Could not find album "…" in series»); é código morto, não mexido. 1049 testes.

## [2026-11-19 18:56] session — F55 fatia 2: o álbum trocado já guardado no navegador é descartado quando é lido

Em vez de trocar a versão do registro (que jogaria fora todos os álbuns e todas as notas guardadas), cada leitura do guardado pergunta à regra única se o registro ainda é o álbum pedido pela consulta: `AlbumCacheAdapter.get` (a carga; memória e IndexedDB) e `APIClient.fetchAlbum` (o caminho antigo do blend e das playlists; memória, IndexedDB e o localStorage antigo). O que não é o álbum pedido é esquecido e buscado de novo; o título com subtítulo só fica se o registro diz que uma carga o aceitou pelo segundo degrau. O `peek` da contagem continua só-leitura. Na primeira carga depois de publicar, só os álbuns trocados são buscados de novo (8 em 227 na conta do MJRP, contados em 2026-11-19). 1038 testes.

## [2026-11-19 18:54] session — F55 fatia 2: o identificador corrigido da Apple gravado na série, por um escritor só

Quando o álbum pedido é achado sob outro identificador da Apple (o guardado sumiu ou leva a outro álbum), o `SeriesFactsService`, que já era o único escritor do que a carga aprende sobre a série, grava na mesma escrita, uma vez por série terminada: `appleMusicId` novo e, só se a consulta os guarda, `coverUrl` e `year` do álbum carregado. Artista e título pedidos nunca mudam. Não espera os fatos; a falha da escrita é avisada, tentada de novo na próxima passada e nunca derruba a carga. O álbum aceito pelo segundo degrau também tem o identificador gravado. Teste de arquitetura: só o `CatalogAdapter` diz que um identificador foi trocado, só o `albumQuery.js` lê, só o `SeriesFactsService` escreve. 1029 testes.

## [2026-11-19 18:52] session — F55 fatia 2: o segundo degrau da regra de identidade («No Quarter»)

Ramo `fix/f55-identity-slice-2`. A regra única (`shared/albumIdentity.js`) ganhou um segundo degrau, que nunca disputa com o primeiro: o título pedido é o título do candidato antes de um subtítulo («:» ou « - »), com o mesmo artista, e só num sentido (o pedido é o curto). `compareAlbumIdentity` responde `same-if-alone` (não é `same`); só o `pickAlbum`, que vê todos os candidatos, aceita, e só quando nenhum passou no primeiro degrau e os do segundo são um álbum só. O álbum carregado leva o motivo em `metadata.identityReason`; o cartão do álbum diz em uma linha quando foi aceito pelo segundo degrau; a contagem só-leitura o conta como igual, com o motivo. Não afrouxam, por olharem um candidato só: o identificador guardado, a resposta da IA e a página conferida sozinha no raspador. 1020 testes, build ok. Sem navegador nesta sessão.

## [2026-11-19 18:40] decision — MJRP: «No Quarter» tratado com afrouxamento; F68 criada para rever as regras de identidade de álbum

Palavras do MJRP: «o no quarter é um edge case, vamos tratá-lo com afrouxamento mas coloca no Do not forget do memory e abre uma feature pra revisao das regras todas pra encontrar a identidade de album, até pq depois com as futuras seções de genero, prevejo termos um algoritmo ficando mais complexo e precisamos revisar pra que a manutencao e o entendimento do mesmo seja fácil de entender.» Feito: (1) o afrouxamento entra na F55 fatia 2; (2) `MEMORY.md`, bloco Do Not Forget; (3) F68 criada na `main` (via rápida, `^REL-40`, UAT-205), citada na story S-53.

## [2026-11-19 18:34] session — F67 em produção (site)

Site publicado da `main` (`cdef6d5`, pacote `main-CkVMM5CM.js`). Em produção, como visitante: clique em Scan mostra «Scanning…» com o botão desabilitado na hora e, depois, 12 álbuns de «pavement». A F67 não muda o servidor. UAT-204 em `fixed`, à espera do aceite do MJRP.

## [2026-11-19 18:33] review — F67 revisada e provada pelo integrador; UAT-204 em fixed

Ramo do auxiliar com a `main` junto: 982 testes, build ok. Sete cenários no navegador em `reports/evidence/F67/2026-11-19-home-scan-browser-proof.md`. A causa do caso do MJRP não pôde ser determinada; dois defeitos reais que o explicam foram consertados (consulta ao catálogo sem prazo; navegação sobreposta deixava a tela sem ligar os botões, no roteador). O doctor segue vermelho com os erros antigos, nenhum da F67.

## [2026-11-19 18:30] session — F67: spec, plano, tarefas, comportamento e manual escritos no ramo

A pasta da F67 preenchida para o que foi construído (7 REQ com `verified_by`, 10 tarefas, a prova no navegador aberta para o integrador); `docs/specs/behavior.md` com os estados da busca da Home e a tela sempre montada; manual 14, 16, 19, 20, 21 e 22 corrigidos. O doctor segue vermelho com os mesmos 521 erros de antes do ramo, nenhum da F67.

## [2026-11-19 18:26] session — F67: o Scan da Home tem um estado só, prazo no catálogo e a IA depois (UAT-204)

Ramo `fix/f67-home-scan-answers`. Causa examinada antes do conserto: achado um defeito real do roteador (uma rota que redireciona deixava a tela seguinte desenhada e nunca montada, sem nenhum botão respondendo) e a falta de prazo no catálogo, no início do MusicKit e na lista da IA; a causa do caso do MJRP não se determina pelo código. Construído: `models/scanState.js` (estados parado, buscando, resultados, sem resultados, falhou), o `SearchController` como dono e a `HomeView.renderScan` como único desenho; prazo de 15 s no catálogo e de 10 s no início do MusicKit; os álbuns aparecem quando o catálogo responde e a lista da IA reclassifica depois; nenhum `alert` no fluxo. 982 testes, build ok. Sem navegador nesta sessão: a prova na tela fica com o integrador.

## [2026-11-19 18:18] decision — F67 criada: o Scan da Home responde ao clique (UAT-204)

Feature de via rápida, `^REL-40`, conserta a UAT-204. Criada na `main` antes do ramo. Achado novo: quando o Scan roda, o botão vira um círculo girando; na captura do MJRP o botão estava com o rótulo normal, então o clique não chegou a iniciar a busca ou ela terminou sem mostrar nada. A causa é investigada antes do conserto.

## [2026-11-19 18:18] session — F55 fatia 1 em produção (site e servidor)

Site e servidor publicados da `main` (`72c0a70`; revisão `mjrp-proxy-00200-2nh`, volta `mjrp-proxy-00199-hsv`). Em produção, com login, a fonte de notas respondeu `found` para «Core» e «Core (Remastered)» (mesma página) e `not_found` para «Core Memories». A UAT-184 fica aberta até a fatia 2: os álbuns trocados já guardados no navegador seguem na tela até vencer ou até «Clear Cache», e o identificador corrigido ainda não é gravado na série. Efeito conhecido: «No Quarter» (série Robert Plant 00-10s) passa a falhar com aviso, porque o catálogo só o tem com subtítulo. A regra do raspador que a F52 listava como tarefa 12 foi entregue aqui. O auxiliar da F67 (Scan) está trabalhando.

## [2026-11-19 18:16] review — F55 fatia 1 revisada e provada pelo integrador

Ramo do auxiliar com a `main` junto: 919 testes, build ok. Contagem na conta do MJRP: 8 álbuns trocados em 227 (9 linhas). Com a regra nova, 7 carregam o álbum certo e 1 («No Quarter») passa a falhar com aviso, porque o catálogo só o tem com subtítulo. A fonte de notas respondeu certo no servidor local. Prova em `reports/evidence/F55/2026-11-19-slice-1-browser-proof.md`.

## [2026-11-19 18:08] session — F55 fatia 1: documentos da feature, arquitetura e manual da regra de identidade

Documentos da fatia 1 da F55, no ramo `fix/f55-one-album-identity-rule`.

- **Feature** (`docs/specs/features/F55-the-album-asked-for-or-a-notice/`): `spec.md` em `In Progress`, com as duas fatias (a 1 feita, a 2 não), dez requisitos (nove com o teste que os prova) e a mudança de comportamento declarada; `plan.md` com o desenho como foi construído, as decisões do agente (dois degraus de acerto, nota de edição por vocabulário fechado, o subtítulo) e os riscos; `tasks.md` com 17 tarefas (12 fechadas; a prova no navegador e a fatia 2 abertas).
- **`docs/specs/arch.md`:** seção nova no fim, «Uma regra só para dizer que é o mesmo álbum (F55)», com os lugares antes e depois, e a linha da regra em «Compartilhado».
- **Manual:** `23_Shared_Code.md` ganhou a regra; `08_Frontend_Models.md`, o lado do app (`askedAlbum.js`, no lugar de `AlbumIdentity.js`); `06_Frontend_Data_Store.md`, a busca do Spotify como ficou; `17_Frontend_Services.md`, a contagem só-leitura e como rodá-la; `02_Server_Structure.md` e `04_Backend_Logic_Services.md`, o raspador e o Spotify do servidor; `24_Test_Suite.md`, os testes novos. Frases que ficaram falsas acertadas em `00_Dir_File_Structure_Map.md`, `01`, `07b` e `99`.
- **Para o MJRP decidir** (em `spec.md`, Open Questions): o subtítulo que não é nota de edição conta como parte do título; «(Live)» sozinho é nota de edição; «IV» não é «4». E falta rodar a contagem com o login dele antes de publicar.
- **Não tocado, e fica para o integrador:** o `tasks.md` da F52 ainda diz que a regra de identidade no raspador (TASK-12 de lá) não está feita; ela foi construída aqui.

## [2026-11-19 18:08] session — F55 fatia 1, app: cada lugar que aceita um álbum pergunta à regra única; contagem só-leitura do que está trocado (UAT-184)

Segunda parte da fatia 1 da F55, no ramo `fix/f55-one-album-identity-rule`: os lugares do app que aceitam um álbum passam a perguntar à regra única (`shared/albumIdentity.js`).

- **`public/js/models/askedAlbum.js`** (novo): lê a consulta guardada (o pedido) e o que cada fonte devolve (o candidato) nos mesmos três campos. Entrou no lugar de `models/AlbumIdentity.js`, a nota de semelhança em que o artista certo bastava, que foi removida.
- **Catálogo da Apple Music** (`CatalogAdapter.js`, e o caminho antigo em `api/client.js`): a regra escolhe entre os resultados da busca, em vez de valer o primeiro. O teste novo reproduziu a UAT-184 no código antigo: com «Shangri-La Dee Da» primeiro nos resultados, «Core» pedido carregava «Shangri-La Dee Da».
- **Identificador guardado:** o álbum a que ele leva é conferido pela regra. Se for outro álbum, o álbum é buscado pelo nome, e o resultado traz `metadata.replacedSourceId`. Nada é gravado na série (é a fatia 2).
- **Spotify** (`SpotifyService.js`): três buscas só listam candidatos; a regra aceita um ou nenhum. Saíram «um título contém o outro», o primeiro resultado como reserva e a nota por distância de edição.
- **Dados locais de capa** (`OptimizedAlbumLoader.js`): a linha do álbum pedido, ou nada; a primeira linha da busca não serve mais de reserva.
- **Resposta da busca por IA** (`api/client.js`): conferida pela regra; outro álbum vira «o servidor não tem», sem nova chamada paga.
- **Contagem só-leitura** (`services/albums/albumIdentityAudit.js`): para cada álbum pedido nas séries, o álbum que o app tem e o veredito. Pelo console, com a conta do dono: `await albumIdentityAudit()`. Lê por `peek` (novo nos guardados): não promove nem apaga nada.
- **Função de aptidão** (`test/architecture/albumIdentityRule.test.js`): falha se um desses lugares deixar de perguntar à regra ou voltar a comparar texto.
- Saíram também, por não terem mais quem use: as funções de semelhança e de chave de `utils/stringUtils.js`, os normalizadores de álbum e artista de `utils/NormalizationUtils.js`, e `extractArtist`/`extractAlbum` de `api/client.js`.
- `npx vitest run`: 919 testes; `npx vite build` compila. **Não visto num navegador** (o auxiliar não tem um). Mudança de comportamento: um álbum cujo título guardado difere do título do catálogo por um qualificador que não é edição passa a «não encontrado».

## [2026-11-19 18:07] session — F55 fatia 1, regra e servidor: uma regra só diz «este é o álbum pedido», e o raspador pergunta a ela (UAT-184)

Ramo `fix/f55-one-album-identity-rule`, da ponta da `main` local. Primeira parte da fatia 1 da F55 (UAT-184: a série pedia «Stone Temple Pilots - Core» e mostrava «Shangri-La Dee Da»).

- **A regra:** `shared/albumIdentity.js`, pura, usada pelo app e pelo servidor. `compareAlbumIdentity(pedido, candidato)` devolve um veredito tipado (igual ou diferente, com o motivo); `pickAlbum` escolhe o candidato que passa, ou nenhum. O título tem de bater por conta própria, inteiro; o artista tem de bater; o ano só ordena. Um subtítulo depois de «:» ou « - » só sai se for nota de edição. O teste de «Core» contra «Shangri-La Dee Da» e «Core Memories» foi escrito primeiro (`test/shared/albumIdentity.test.js`).
- **O servidor:** `server/lib/albumIdentity.js` carrega a regra. O raspador (`server/lib/scrapers/besteveralbums.js`) pergunta a ela em todos os pontos em que aceitava por «um texto contém o outro»; a busca em HTML não pega mais o primeiro link; a página de um resultado cujo rótulo já diz que é outro álbum não é aberta. O Spotify do servidor (`spotifyPopularity.js`) pegava o primeiro resultado da busca; agora escolhe pela regra, e a busca só pelo artista, que quebrava num nome nunca importado, voltou a funcionar.
- **Lido da fonte, para conhecer o formato** (cinco leituras do BestEverAlbums, sem login e sem custo): os resultados da busca vêm rotulados «Título by Artista»; a página do álbum diz o mesmo no `<title>` e no cabeçalho; a busca em HTML não devolveu nenhum link de álbum.
- Testes: 919 no fim da fatia (eram 789). Nada publicado; conserto em `server/` só se prova publicando.

## [2026-11-19 17:47] decision — MJRP: o conserto do Scan (UAT-204) passa na frente depois da F55; a conformidade de 28/10 fica de lado

Palavras do MJRP: «1. Sim pode 2.deixa de lado por enqto». (1) O conserto da UAT-204 (resposta imediata ao clique, prazo na consulta ao catálogo, «tentar de novo») é feito assim que a fatia 1 da F55 entrar na `main`. (2) A conformidade aberta em 2026-10-28 (`.mjrp/conform.json`) não é retomada nem largada agora; a trava de fim de turno segue registrando o vermelho dela.

## [2026-11-19 17:41] session — F52 fatia 1 em produção (site e servidor)

Site publicado da `main` (`de14155`, pacote `main-DQ1jxjKx.js`) e, depois, o servidor (revisão `mjrp-proxy-00199-hsv`; a volta é `mjrp-proxy-00198-5df`). Conferido em produção: 401 no formato novo sem login; com login, notas `found` e `not_found`, lista da IA `found` e a Home classificando com ela. Não visto: `/api/generate` com a chave, a carga segurando a fila, falha real da fonte. Prova: `reports/evidence/F52/2026-11-19-slice-1-browser-proof.md`. Também hoje: o MJRP disse que o Scan voltou a funcionar; o registro do servidor mostra que o clique que falhou não chegou ao servidor (UAT-204 segue aberta: sem prazo nem aviso na consulta ao catálogo).

## [2026-11-19 17:38] review — F52 fatia 1 revisada e provada pelo integrador

Ramo do auxiliar com a `main` junto: 789 testes, build ok. Prova em `reports/evidence/F52/2026-11-19-slice-1-browser-proof.md` (oito cenários; três coisas vistas só em teste de unidade, ditas lá). Escolhas do auxiliar que ficam, revisáveis: erro do provedor de IA sai como 424; página com zero notas casadas passa a `empty`; aba antiga lê a lista da IA só depois de recarregar. UAT-181 e UAT-23 seguem abertas (fatias 2 a 4).

## [2026-11-19 17:33] session — F52 fatia 1: documentos da feature e manual do contrato de resposta

Documentos da fatia 1 da F52, no ramo `fix/f52-server-tells-the-truth`.

- **Feature** (`docs/specs/features/F52-server-album-generation-back/`): `spec.md` em `In Progress`, com as quatro fatias (a 1 feita, as 2 a 4 não), oito requisitos e a mudança de comportamento declarada (página com zero notas deixa de contar como «tem notas»); `plan.md` com o desenho como foi construído e as decisões tomadas na construção; `tasks.md` com 20 tarefas (12 fechadas, duas à espera do MJRP).
- **Manual:** `03_Backend_API_Layer.md` ganhou o contrato da resposta, a lista fechada de códigos e a tabela do provedor de IA, linha por linha; `07_Frontend_Data_Infra.md` ganhou o leitor único, a carga segurada e o quadro das duas direções da publicação separada. Frases que ficaram falsas foram acertadas em `01`, `02` e `07b`.
- **`docs/specs/arch.md`:** a proposta diz agora que a fatia 1 está construída e quais dos pontos «ainda não verificados» foram vistos.
- O título da feature nos três documentos passou a «O servidor diz a verdade», o nome da proposta aprovada (era «A busca de álbum por IA do servidor volta a responder»).
- **Para o MJRP decidir** (em `spec.md`, Open Questions): aceitar que uma aba antiga fique sem a lista por IA até recarregar, ou o servidor manter `albums` no topo da resposta por um tempo.

## [2026-11-19 17:33] session — F52 fatia 1, app: um leitor da resposta do servidor, falha como falha, 401 e 429 seguram a carga (UAT-23)

Segunda metade da fatia 1 da F52, no mesmo ramo (`fix/f52-server-tells-the-truth`): o lado do app.

- **Um módulo lê a resposta do servidor** (`public/js/api/serverResult.js`, puro): `found`, `not_found`, `no_ratings`, ou `failed` com `code`, `retryable`, `status` e `hold`. Um 200 sem `outcome` é o servidor antigo (`legacy`) e segue a regra de antes; o erro antigo `{ error: 'texto' }` é lido pelo status.
- **Repetir é decidido pelo campo `retryable`**, nunca só pelo status (`api/client.js`, `_fetchAlbumFromAPI`): um 500 que diz «não repita» é uma chamada paga só.
- **Notas** (`adapters/enrichers.js`): falha é lançada como veio, e a carga marca a fonte como `failed`; `not_found` e `no_ratings` viram `empty`. **Mudança de comportamento:** página com zero notas casadas deixa de contar como `done` com o servidor novo, o que muda o filtro «por fonte» para esses álbuns.
- **Lista de álbuns por IA** (`AlbumSearchService`): a falha não fica mais guardada como «a IA não conhece álbuns» pela sessão; uma busca pergunta a lista uma vez só.
- **401 e 429 do próprio servidor seguram a carga** (`AlbumLoadService._addHeld`, `TaskQueue.pause/resume`): nenhum álbum é marcado como falha; no 429 a carga volta no prazo do `Retry-After`; no 401 ela para de perguntar até `resume()`, uma nova carga ou «tentar de novo», com um aviso só. A fila das notas pausa; a da busca de álbuns não (ela também fala com a Apple Music).
- **`_enrichOne` foi dividido** (tinha complexidade 21): `_newAsk`, `_askSource`, `_overNewestAlbum`, `_publishSource`.
- **Conferido:** `npx vitest run` com 786 testes (eram 590), `npx vite build` compila. As duas direções da publicação separada têm teste: site novo contra servidor antigo (`serverResult.test.js`, `client.test.js`, `AlbumSearchService.aiList.test.js`) e aba antiga contra servidor novo (`oldTabAgainstNewServer.test.js`).
- **Não visto:** nada foi conferido num navegador nem publicado. **Limite conhecido:** uma aba antiga deixa de ler a lista por IA do servidor novo até ser recarregada (a lista foi para `data.albums`) e classifica sem ela.
- **Não mexido:** `EMPTY_TRUSTED_FOR_MS` (1 hora) e a versão do registro guardado.

## [2026-11-19 17:31] session — F52 fatia 1, servidor: um contrato de resposta, o raspador lança a falha, tabela do provedor de IA (UAT-23, UAT-181)

Ramo `fix/f52-server-tells-the-truth`, de um agente auxiliar, da ponta da `main` (`be346b8`). Primeira metade da fatia 1 da F52 (seção 11 da proposta em `docs/specs/arch.md`): o lado do servidor.

- **Um módulo monta toda resposta** (`server/lib/outcome.js`): sucesso é `{ data, outcome }`, com `outcome` sempre presente (`found`, `not_found`, `no_ratings`); falha é `{ error: { code, retryable } }`, com `code` de uma lista fechada de sete. O respondedor de erros, a porta de login e o limite por pessoa passaram por ele, com os status de antes.
- **O raspador de notas lança a falha** (`server/lib/scrapers/besteveralbums.js`): sete `catch` engoliam erro de rede, prazo e 429 e viravam «não achei» (um deles aceitava a página sem vê-la). Agora toda requisição passa por uma função que lança; `null` só quando a fonte respondeu a tudo e nada bateu. Como um álbum é aceito não mudou.
- **Notas** (`POST /api/enrich-album`): responde 200 com o desfecho ou 502, 503, 504; deixou de pedir a chave de IA.
- **IA** (`POST /api/generate`, `POST /api/ai/studio-albums`): uma tabela fechada (`server/lib/aiProviderOutcome.js`) diz o que sai para cada resposta do provedor. Cobrança, cota, pedido recusado e resposta inaproveitável saem como 424 com `retryable: false` (a aba antiga não repete 4xx); só falha passageira sai como 5xx. O texto do provedor não sai mais; a lista por IA não responde 200 vazio na falha.
- **Conferido:** 135 testes do servidor na suíte da raiz; e o servidor de verdade numa cópia local (`curl`): 401, 400, 503 sem a chave, `found` e `not_found` contra o BestEverAlbums, 502 com a fonte inalcançável. Nenhuma rota paga foi chamada.
- **Não feito aqui:** `musickit`, `playlists` e as rotas de depuração seguem montando o próprio erro. Nada foi publicado.

## [2026-11-19 17:24] session — UAT-204 aberta: Scan parece não fazer nada (relato do MJRP)

O MJRP relatou, em produção, que clicar em Scan não faz nada. Não reproduzido pelo agente (visitante em produção: 12 álbuns; com login pelo app local: 0,8 s e 4,8 s). Hipótese: a busca espera a IA (até 60 s) sem resposta visível ao clique; o relato veio minutos depois da publicação do servidor em Node 24 (partida a frio).

## [2026-11-19 17:12] session — décimo deploy do site e servidor em Node 24 em produção

Site publicado da `main` (`bcdd114`, pacote `main-CYRWnKB2.js`): o aviso ao visitante na janela de entrada está no ar; sair da conta recarrega o app (visto só nos testes). Servidor publicado por `npm run deploy:server` (primeiro uso real do script) da `main` (`3a5c859`): revisão `mjrp-proxy-00198-5df`, imagem `node:24-slim`. Conferido em produção: `/api/debug/files` 404, `/api/musickit-status` 200, `/api/generate`, `/api/enrich-album` e `/api/ai/studio-albums` 401 sem login; `/api/enrich-album` 200 com login (pelo app local, notas de «Brothers in Arms»). A volta é a revisão `mjrp-proxy-00197-mps`. A trava de fim de turno passou a exigir o critério do conform aberto em 2026-10-28 (`.mjrp/conform.json`), que fecha vermelho (12 lacunas, 61 notas, catálogo defasado em 7); não é desta sessão, fica para o MJRP decidir.

## [2026-11-19 17:09] decision — servidor em Node 24 (ADR-0020)

O MJRP decidiu «24». `server/Dockerfile` passa de `node:18-slim` para `node:24-slim`; ADR-0020, `tech-stack.md`, `arch.md` e a pergunta aberta da F64 atualizados. Publica sozinho por `npm run deploy:server`; a volta é a revisão `mjrp-proxy-00197-mps`.

## [2026-11-19 17:06] session — UAT-12 cita o commit certo

A issue passa a citar `2a39683`.

## [2026-11-19 17:05] session — F60: visitante não leva dados e a janela de entrada avisa (UAT-12); sair da conta recarrega o app

Duas decisões do MJRP de hoje, feitas: a janela de entrada mostra «Series, playlists and inventory made as a guest stay with the guest session. They are not copied to your account when you sign in.»; e sair da conta recomeça o app da Home numa página nova (`utils/reloadApp.js`), o que tira da tela séries e playlists de quem saiu, além do inventário. Três testes novos, vistos falhar antes; a suíte tem 593 passando. No navegador: a janela de entrada mostra o aviso e os três botões. O recarregar ao sair não foi visto no navegador (sairia da conta no painel de teste).

## [2026-11-19 17:04] decision — quatro decisões do MJRP: visitante não leva dados, sair recarrega, F52 pode ir ao código, Node 24

Respostas do MJRP às quatro perguntas do agente, nas palavras dele:
1. Dados de visitante ao entrar com conta (UAT-12): «não levar e avisar».
2. Sair da conta deve recarregar o app: «sim».
3. F52, ir para o código com a proposta emendada (`docs/specs/arch.md`, «O servidor diz a verdade», seção 11): «sim».
4. Node do servidor: «24».

O que cada uma destrava: a UAT-12 fecha com um aviso na janela de entrada, sem cópia de dados; o sair da conta passa a recarregar a página, o que limpa séries e playlists da tela junto com o inventário; a F52 começa pela fatia 1 (contrato de resultado, um formato de erro, tabela do provedor de IA, raspador que propaga a falha); a imagem do servidor passa de `node:18-slim` para `node:24-slim`, publicada sozinha para isolar o risco.

## [2026-11-19 16:57] session — nono deploy do site: F59 fatia E em produção

`npm run deploy:site`, da `main` em `474f8cf`: 590 testes, pacote conferido, Hosting publicado, e o `index.html` no ar aponta o pacote recém-construído (`/assets/main-D7HiVm63.js`). Em produção agora: o texto de fora tratado antes de entrar no HTML (UAT-199). Não visto em produção num navegador. A F59 está com as fatias A, B, C e E em produção; restam o Tailwind servido do próprio site (UAT-25) e a conferência de esquema de dois endereços vindos de provedores.

## [2026-11-19 16:57] session — F59 fatia E na `main`: texto de fora entra no HTML como texto (UAT-199)

Ramo `fix/f59-escape-outside-text`, de um agente auxiliar, conferido pelo integrador: 590 testes passando, build compilando. `escapeHtml` (`public/js/utils/stringUtils.js`) virou função pura e trata também as aspas, de modo que vale dentro de atributo; 61 pontos em 20 arquivos de tela passaram a usá-la; um teste de arquitetura (`test/architecture/outsideTextEscaped.test.js`) lê os modelos de HTML e reprova um campo de texto de fora sem tratamento.

- **No navegador:** uma série chamada com HTML hostil aparece como texto na tela da série, no blend, no painel de todas as séries e na janela de apagar; nenhuma imagem injetada. A série de teste foi apagada.
- **Não visto:** o nome na lista do filtro de séries não bateu letra por letra (não investigado); sugestões da Home, selo do inventário e nome no diálogo do Spotify só em teste automático.
- **Fica de fora, para decidir:** dois endereços vindos de provedores são postos em `href` sem conferir o esquema (`Card.js`, `ConsolidatedRankingView.js`).
- **Observação do agente auxiliar:** o teste de arquitetura usa o `espree`, que vem pelo ESLint e não está declarado direto no `package.json`.
- **F59:** fatias A, B, C e E feitas; a D é a F66. Falta da fatia E original o Tailwind servido do próprio site (UAT-25), que não foi tocado.

## [2026-11-19 16:53] session — F59 fatia E (texto): texto de fora do código vira texto na tela (UAT-199), no ramo `fix/f59-escape-outside-text`

Ramo `fix/f59-escape-outside-text`, a partir da `main` em `ce5d2b4`; não entrou na `main`, não foi publicado. `escapeHtml` (`public/js/utils/stringUtils.js`) passou a ser uma função pura, sem DOM, que troca `& < > " '` — serve para conteúdo de elemento e para valor de atributo entre aspas; `null` e `undefined` viram texto vazio. As duas cópias locais (`FilterToolbar`, `RegeneratePanel`) chamam essa. Aplicada em 61 pontos de 20 arquivos: nomes de álbum, faixa, artista, série, playlist e lote, mensagem de erro (tela de erro do roteador, exportação do Spotify, menu de mistura), nome, e-mail e foto da conta, endereço lido da URL (trilha de navegação), ids e endereços de capa dentro de atributos. O que já era texto (`SafeDOM`, `textContent`) ficou como estava; rótulos escritos no código não foram tocados. Testes: 9 da função, 17 de telas desenhadas com um nome como `<img src=x onerror=...>` (11 falhavam antes do conserto) e 3 de um teste de arquitetura que falha quando um modelo de HTML recebe um campo de texto de fora sem `escapeHtml` (teria apontado 31 dos pontos consertados; 5 exceções listadas, todas texto escrito no código). Suíte: 590 testes passando; `vite build` compila. Não visto num navegador. Ficou fora, para decisão: endereços vindos de provedor postos em `href` por `setAttribute` (`Card.js`, `ConsolidatedRankingView.js`) aceitam `javascript:`; a política de conteúdo e o Tailwind (UAT-25) continuam abertos na fatia E.

## [2026-11-19 16:31] session — oitavo deploy do site, o primeiro pelo script da F64: F60 em produção

`npm run deploy:site`, da `main` em `c370dcd`. O script exportou a `main`, rodou os testes, construiu, conferiu o pacote, publicou só o Hosting e conferiu produção sozinho: o `index.html` no ar aponta o pacote recém-construído (`/assets/main-BEULvoEC.js`), servido como script. É a primeira prova da F64 com um deploy de verdade (o do servidor ainda não foi usado). Em produção agora: a F60 (salvar playlists sem perder o lote, um salvamento por vez, playlists que voltam ao recarregar, aviso de alteração não salva, apagar série com as playlists, inventário que sai com a pessoa). Não visto em produção num navegador. Como voltar: histórico de versões do Hosting.

## [2026-11-19 16:30] session — F60 na `main`; UAT-196, UAT-197, UAT-198 e UAT-05 em `fixed`

O ramo `fix/f60-no-saved-work-lost` (agente auxiliar, conferido pelo integrador) entrou na `main` em `fa141c0`. A suíte tem 561 testes passando.

- **Mudanças de comportamento que o MJRP precisa julgar** (o agente auxiliar as fez junto com os consertos): salvar playlists não regrava mais a série inteira a partir da memória; **apagar uma série apaga as playlists dela**, depois de a janela dizer quantas, sem desfazer; a cópia de inventário de visitante para conta saiu (só rodava no caso do defeito); o roteador passa a perguntar também no voltar do navegador; salvar um conjunto vazio é recusado.
- **Sem conserto, por decisão de desenho pendente:** UAT-12 (dados de visitante ao entrar). A issue traz as três saídas.
- **Perguntas abertas pelo agente auxiliar:** sair da conta deve recarregar o app? (só o inventário é limpo; séries e playlists em uso ficam na tela); o aviso de sair usa a caixa nativa do navegador, não o diálogo do app.
- **Achados dele, não consertados:** a data de criação de uma playlist regravada vira um mapa em vez de data; salvar sem conexão fica em «Saving...» sem prazo; apagar um lote e apagar todas as playlists de uma série ainda apagam um documento por vez; os álbuns guardados dentro de uma série não são apagados com ela.

## [2026-11-19 16:29] session — F60 conferida no navegador pelo integrador (parte); evidência gravada

O ramo veio de um agente auxiliar, com 561 testes passando depois de trazer a `main`. No navegador, com o login do MJRP e uma série de teste: playlists geradas voltam ao recarregar (UAT-05); dois cliques em salvar gravam um lote só; editar e salvar troca o lote sem sobra; o aviso de alteração não salva pergunta e respeita o não; apagar a série avisa que as playlists vão junto. **Não visto no navegador**, só em teste automático: a gravação que falha no meio (UAT-196), o inventário ao sair da conta (UAT-198) e o salvamento na série errada. `reports/evidence/F60-no-saved-work-lost/F60-browser-2026-11-19.json`.

## [2026-11-19 16:24] session — F60: documentos da feature, `behavior.md` e manual escritos do que foi feito; a UAT-12 fica como pergunta de desenho

- **Feature:** `docs/specs/features/F60-no-saved-work-lost/` com `spec.md` (`status: In Progress`, nove requisitos, oito com o teste que os prova), `plan.md` e `tasks.md` preenchidos a partir dos três commits do ramo. O conferidor de forma e o de tarefas passam; o `doctor.py` segue com os mesmos 520 erros de antes da feature.
- **UAT-12 (dados de visitante ao entrar), investigada e não consertada:** o visitante é uma conta anônima do Firebase; entrar com Google ou Apple troca de `uid`, e as regras do banco só deixam cada `uid` ler o que é seu, então depois do login o app não alcança mais o que o visitante gravou. Três caminhos, escritos em Open Questions do spec: vincular a conta anônima (o `uid` não muda e nada é copiado; recusado quando a conta já existe), copiar antes e depois do login, ou não levar e dizer isso. A escolha é do MJRP.
- **Outras duas perguntas para o MJRP, no mesmo lugar:** recarregar o app ao sair da conta (séries e playlists em memória ainda ficam na tela; só o inventário foi tratado); e a pergunta ao sair com alteração não salva usar a janela do app em vez do `confirm` do navegador (pede que o roteador espere a resposta).
- **Documentos acertados:** `docs/specs/behavior.md` (seis estados reescritos, três novos), `docs/specs/data-model.md`, `docs/specs/arch.md`, `docs/manual/` (01, 06, 07, 17, 19, 20, 21, 24, 99). `docs/specs/uat.md`, `MEMORY.md` e `ROADMAP.md` não foram tocados: são do agente integrador.
- **Não visto num navegador por quem implementou:** a prova é do agente integrador, com o login do MJRP.

## [2026-11-19 16:19] session — F60: playlists geradas e não guardadas voltam depois de recarregar a página (UAT-05); gerar de novo não troca a série

- **UAT-05, investigada e consertada (coube sem mudar o desenho):** a issue dizia que o conjunto era gravado no navegador e nunca lido de volta. O código mostrou mais: a geração escreve direto na loja, sem passar pelo serviço, então o conjunto recém-gerado nem chegava a ser gravado; só as edições de faixa gravavam. Agora o `PlaylistsService` acompanha a loja e mantém no navegador um rascunho do conjunto que ainda não está no banco, com o `uid` de quem o fez; `PlaylistsController.initialize` devolve o rascunho à tela quando ela abre vazia, para a mesma série e a mesma pessoa, e avisa «Your unsaved playlists were restored».
- **Regras do rascunho:** um só por vez; conjunto salvo não é rascunho (salvou, o rascunho some; abrir um lote salvo para editar toma o lugar dele); tela vazia não apaga o rascunho; rascunho de outra pessoa, de outra série ou gravado por versão antiga do app (sem dono) não volta.
- **Fora do alcance, dito para não parecer feito:** edições não salvas de um lote já salvo (endereço `/playlists/edit`) continuam se perdendo ao recarregar; para esse caso existe agora o aviso do navegador antes de sair.
- **Gerar de novo (`BlendingController.regenerate`):** gravava no conjunto da tela a série ativa em outro lugar, e o salvamento seguinte ia para ela (segunda origem do «salvar na série errada» da UAT-197, reproduzida em `test/controllers/BlendingController.regenerate.test.js`). Agora mantém a série do conjunto.
- **Testes:** 530 passando; `vite build` compila.

## [2026-11-19 16:18] session — F60: ao sair da conta o inventário some da tela e não é copiado para a conta seguinte (UAT-198)

- **Confirmado no código e em teste, antes do conserto** (`test/stores/inventory.userChange.test.js`, seis casos, todos falhavam): ao sair, o Firebase avisa primeiro «sem usuário» e logo depois a conta anônima que o app abre sozinho. No primeiro aviso a loja tentava ler o inventário de `anonymous-user`, as regras do banco recusavam, e os álbuns da pessoa anterior ficavam na memória e na tela. No segundo aviso a loja via «era anônimo, tem álbuns, chegou uma conta» e copiava o inventário inteiro da pessoa anterior para a conta anônima nova.
- **Conserto (`public/js/stores/inventory.js`):** na troca de pessoa o inventário em memória é esvaziado na hora, antes de qualquer leitura, e a tela é avisada; entre a saída e a conta seguinte não se lê nada; uma resposta de leitura que chega depois da troca é descartada.
- **A cópia de visitante para conta saiu deste caminho, e o MJRP precisa saber:** ela só rodava no caso do defeito. Um visitante de verdade tem um `uid` anônimo do Firebase, nunca o texto `anonymous-user`, então a condição nunca valia para ele; o inventário de visitante nunca migrou em produção. Levar os dados do visitante para a conta é a UAT-12, que fica como pergunta de desenho.
- **Visto e não mexido:** as séries e as playlists em memória também não são esvaziadas ao sair (só o inventário tinha issue). Recarregar o app ao sair resolveria tudo de uma vez; é decisão de desenho.
- **Testes:** 515 passando.

## [2026-11-19 16:18] review — crítica separada da proposta da F52: «não pode ir ainda»; proposta emendada

Relatório: `reports/audits/2026-11-19-mjrpalbumblender-v0-f52-proposal-critique.md`. Agente separado, só de leitura, 5 minutos. Dois achados que bloqueiam, conferidos pelo implementador no código: a falha das notas é engolida dentro do raspador, não no serviço (mudar só o serviço carimbaria «não achei» em falhas); e virar o erro do provedor de IA em 5xx faria o app repetir chamadas pagas. Mais seis correções antes do código e dois cortes. A proposta ganhou a seção 11, que vale sobre as anteriores, com as fatias refeitas. A direção (contrato de três desfechos, sem guardado em banco no servidor por enquanto) foi mantida. Falta o ok do MJRP para ir ao código.

## [2026-11-19 16:14] session — F64 na `main`: um caminho só para publicar (`npm run deploy:site`, `npm run deploy:server`)

O ramo `fix/f64-one-tested-way-to-production`, feito por um agente auxiliar em cópia isolada e conferido pelo integrador, entrou na `main`. O integrador leu os scripts (o que apagam, como tratam o `.env`, onde publicam) e rodou `npm run deploy:site:dry-run` até o fim: exporta a `main` para uma pasta temporária fora do repositório, roda os 493 testes, constrói, confere o pacote (o mesmo `main-DTBLM2CE.js` que está em produção) e para antes de publicar.

- **O que mudou:** `scripts/deploy-site.sh` e `scripts/deploy-server.sh` no lugar dos dois scripts antigos e do `cloudbuild.yaml` (removidos); `.github/workflows/ci.yml` só roda os testes e não publica; o manual `00_Deployment_and_Setup.md` descreve o caminho único e como voltar.
- **Não provado:** um deploy de verdade com os scripts novos (o próximo já será por eles); o `deploy-server.sh` em modo de ensaio foi rodado pelo agente auxiliar, não repetido pelo integrador; a automação do GitHub nunca rodou.
- **Decisão que espera o MJRP:** o Node da imagem do servidor continua em 18 (fora de suporte). O agente auxiliar tinha trocado para 26; o integrador reverteu, porque muda o que produção roda.
- **Segue aberto da UAT-20:** a verificação de código (`eslint`) tem 81 erros e não entra na automação.

## [2026-11-19 16:13] session — F60: salvar playlists não perde o lote, grava uma vez, na série certa; apagar a série leva as playlists (UAT-196, UAT-197)

- **Ramo:** `fix/f60-no-saved-work-lost`, a partir da `main` em `2adcdef`. Nada publicado, nada mesclado.
- **UAT-196 (reproduzida em teste, com um Firestore em memória que falha quando mandado):** o salvamento em modo de edição apagava o lote antigo e depois gravava o novo; com a gravação falhando, o lote sumia. Agora a regra do salvamento mora em `PlaylistsService.saveCurrentBatch`, e a gravação é uma só, atômica, em `PlaylistRepository.replaceBatch`: grava as playlists novas e remove as que elas substituem no mesmo envio. Falhou, fica tudo como estava e a tela avisa.
- **UAT-197, os quatro reproduzidos antes do conserto:** (1) segundo clique com a primeira gravação no ar gravava o lote duas vezes: agora só um salvamento por vez, e o botão é desenhado desabilitado a partir do estado (`isSaving`), então um redesenho da tela não devolve um botão clicável; (2) o salvamento ia para a série ativa na tela, não para a série das playlists: agora a série vem de um lugar só (`playlistsStore.seriesId`), e contexto de edição de outra série recusa o salvamento; (3) apagar a série deixava as playlists gravadas sem dono: `SeriesRepository.deleteWithPlaylists` apaga série e playlists num envio só, e a janela de confirmação diz quantas playlists e lotes vão junto; (4) não havia aviso ao sair com alteração não salva: agora há, por link ou botão do app, pelo voltar do navegador e ao fechar ou recarregar a aba.
- **Mudanças de comportamento que vieram junto, para o MJRP saber:** o salvamento não regrava mais a série inteira a partir da memória (achado 2.2 do mapa): só toca o `updatedAt` dela, no mesmo envio; se a série não existe mais, o salvamento é recusado com aviso, em vez de criar playlists sem série. Tirar uma playlist inteira da tela passou a contar como alteração não salva. Abrir para edição um lote que não existe mais esvazia a tela, em vez de deixar o lote anterior sob o nome novo.
- **Roteador:** os ganchos de antes de navegar agora podem ser removidos e valem também para o voltar do navegador; um endereço desconhecido sem rota `/home` não chama mais a si mesmo até estourar a pilha (era a origem do «Maximum call stack size exceeded» na saída da suíte).
- **Arquitetura:** `PlaylistsService.js` não importa mais o Firestore (a lista de exceções do teste de fronteiras encolheu para um arquivo); `handleSave` do controlador caiu de complexidade 27 para um caminho curto.
- **Testes:** suíte com 509 passando (462 antes); `vite build` compila. Arquivos novos: `test/helpers/fakeFirestore.js`, `test/controllers/PlaylistsController.save.test.js`, `test/services/PlaylistsService.save.test.js`, `test/services/SeriesService.delete.test.js`, `test/views/unsavedChangesGuard.test.js`, `test/components/playlists/PlaylistsGridRenderer.save.test.js`.
- **Falta nesta feature:** UAT-198, a análise da UAT-05 e da UAT-12, os documentos da feature, o manual e o `behavior.md`; a prova no navegador é do agente integrador.

## [2026-11-19 16:13] session — F64 conferida pelo integrador: o Node do servidor fica em 18 até o MJRP decidir; `arch.md` e `tech-stack.md` em dia

O agente auxiliar entregou a F64 com a imagem do servidor em Node 26. Mudar o Node muda o que produção roda, e isso é decisão do MJRP: o `server/Dockerfile` volta a `node:18-slim` (o que está no ar), com a pendência escrita. `docs/specs/arch.md` (segredos, implantação do site e do servidor) e `docs/specs/tech-stack.md` deixam de citar os scripts antigos e o `cloudbuild.yaml`.

## [2026-11-19 16:12] session — proposta de arquitetura da F52 escrita: «O servidor diz a verdade»

`docs/specs/arch.md`, seção nova no fim. O MJRP pôs como condição da v5.0 que a arquitetura esteja documentada antes do código; esta é a proposta da F52, escrita enquanto a F60 e a F64 rodavam em paralelo. Pontos: um contrato de resultado só para as rotas do servidor (tem o dado; a fonte não tem; não deu para saber), com a falha nunca lida como «sem dado»; o raspador só aceita o álbum certo, pela regra de identidade da F55; **não** começar por um guardado no servidor (o app já guarda por 7 dias; falta poder confiar no «não tem»), e medir antes de pôr banco; uma fila educada para a fonte raspada. Sete riscos, cinco alternativas, cinco fatias e três decisões que são do MJRP. Ainda **sem crítica separada**: é o passo seguinte, antes de qualquer código.

- **F64:** o agente auxiliar entregou o ramo `fix/f64-one-tested-way-to-production`; ainda não conferido nem integrado.
- **Fatia E da F59** (texto inserido como HTML) adiada para depois da F60: o levantamento achou 71 pontos candidatos em 25 arquivos de tela, vários deles os mesmos em que a F60 está mexendo.

## [2026-11-19 16:11] session — F64: spec, plano e tarefas escritos do que foi feito; evidência dos dois ensaios

- **Documentos da feature** (`docs/specs/features/F64-one-tested-way-to-production/`): `spec.md` em `In Progress` com seis requisitos, `plan.md` com o desenho, a decisão sobre as duas receitas da imagem e o risco do Node 26, `tasks.md` com sete tarefas fechadas (commit `fca0108`) e três à espera do MJRP: a primeira publicação real, a automação rodar no GitHub e o aceite.
- **Evidência:** a saída dos dois ensaios em `reports/evidence/F64-one-tested-way-to-production/` (os caminhos da pasta temporária trocados por `<TMP>`).
- **Pergunta aberta para o MJRP:** o Node do servidor passa de 18 para 26 na próxima publicação do servidor.

## [2026-11-19 16:08] session — F64: um script para publicar o site e um para o servidor; receitas antigas removidas

- **Scripts novos:** `scripts/deploy-site.sh` e `scripts/deploy-server.sh` (parte comum em `scripts/lib/deploy-common.sh`), chamados por `npm run deploy:site` e `npm run deploy:server`. Fazem os passos que vinham sendo feitos à mão: recusam se a `main` tem mudança não commitada, exportam a `main` para uma pasta temporária do sistema, `npm ci`, `npx vitest run`, constroem ou montam, conferem o que vai ser enviado, publicam, conferem a produção e mostram como voltar atrás. Usam o login do Firebase CLI e do gcloud; chave de conta de serviço é aceita se existir.
- **`--dry-run`:** faz tudo menos publicar e conferir a produção. Os dois rodaram até o fim na `main` em `e54c80e` (493 testes): o site com o Client ID do Spotify nos scripts, sem `.map`, 40 arquivos em `dist/`; o servidor subiu localmente na arrumação da imagem (`/api/musickit-status` 200, `/api/debug/files` 404, prompts e `shared/` carregados). **Nada foi publicado.**
- **Removidos:** `scripts/deploy-prod.sh`, `scripts/deploy-backend.sh` e `cloudbuild.yaml`. A produção usa `gcloud run deploy --source` (a imagem em uso vem de `cloud-run-source-deploy`); o `cloudbuild.yaml` era a receita que não copiava os prompts (UAT-22).
- **Node do servidor:** `server/Dockerfile` passa de `node:18-slim` para `node:26-slim` e de `npm ci --only=production || npm install` para `npm ci --omit=dev`. O servidor sobe no Node 26 com as dependências do lockfile; a assinatura ES256 do token da Apple foi exercitada com uma chave descartável. **Só vale na próxima publicação do servidor, que depende do sim do MJRP.**
- **Automação do GitHub:** `.github/workflows/ci-firebase.yml` vira `ci.yml`: roda `npx vitest run` em push e pull request e não publica nada. **Não testada: não rodou no GitHub.** O lint ficou de fora (81 erros hoje), então a UAT-20 segue aberta nessa parte.
- **Manual:** `docs/manual/00_Deployment_and_Setup.md`, seções 1 e 2, reescritas para o caminho único, com o que precisa existir na máquina e como voltar atrás.
- **Fica de fora (caminhos de outro agente ou fora do combinado):** `docs/specs/arch.md` e `docs/specs/tech-stack.md` ainda citam os scripts antigos e o `cloudbuild.yaml`; os itens 6.1, 6.5, 6.6 e 6.7 do mapa da v5.0.

## [2026-11-19 16:08] session — F59 fatia C em produção: as rotas pagas respondem 401 sem login e funcionam com login

- **Sétimo deploy do site** (main `e54c80e`): o app manda o login em toda chamada ao servidor. 493 testes antes; build sem mapas de código.
- **Segundo deploy do servidor:** revisão `mjrp-proxy-00197-mps`, de uma cópia limpa da `main`. Ponto de volta: `mjrp-proxy-00196-sj7`.
- **Conferido em produção:** sem login, as quatro rotas guardadas respondem 401 (antes 200). Com o login real do MJRP (app local falando com o servidor de produção): notas 200, lista de álbuns por IA 200 com 6 álbuns, busca de álbum por IA 200 com «1999». As rotas do Apple Music seguem abertas, de propósito.
- **Não conferido:** o app publicado num navegador com login depois deste deploy; uma aba aberta desde antes precisa ser recarregada para mandar o login.
- **F59:** fatias A, B e C em produção; a D virou a F66; falta a E (texto inserido como HTML sem tratamento; Tailwind servido do site).

## [2026-11-19 16:05] session — UAT-16 cita os dois commits da F59

A issue passa a citar `c48689d` (rotas de depuração) e `e253edd` (porta das rotas pagas).

## [2026-11-19 16:05] session — F59, fatia C: as rotas pagas do servidor só respondem a quem está logado, com limite por pessoa

- **O MJRP:** «Go for it pls», à proposta de seguir pela fatia C; e a F60 e a F64 rodam em paralelo com agentes auxiliares, cada um em cópia isolada (ainda sem resultado).
- **Mudança de arquitetura (o MJRP pediu para ser avisado):** o servidor ganhou uma porta. `verifyIdToken.js` confere o login do Firebase sem o Admin SDK; `requireUser.js` responde 401, 403 ou 503; `rateLimit.js` conta por pessoa; `guards.js` é o único arquivo que conhece o Google e as variáveis. No app, `api/serverFetch.js` passa a ser o único jeito de chamar o próprio servidor, levando o login. Fechado por padrão. O desenho e as alternativas estão no `plan.md` da F59.
- **Decisão do agente, revisável:** visitante (login anônimo) não usa as rotas pagas de IA; usa as de notas. `PAID_ROUTES_ALLOW_ANONYMOUS=true` reabre.
- **Limites:** 60 chamadas pagas e 900 de notas por pessoa por hora, contadas na memória de cada instância.
- **Testes:** 36 novos (31 do servidor, 5 do app), vistos falhar antes; a suíte tem 493 passando. O build compila.
- **Prova:** numa cópia local do servidor, com o login real do MJRP e as chaves reais do Google: sem login 401; com login 200; a terceira chamada paga com o limite em 2 recebe 429; a tela de álbuns do app carrega as notas. Evidência na pasta da F59.
- **A publicar, nesta ordem:** o site primeiro (passa a mandar o login), o servidor depois (passa a exigir).

## [2026-11-19 15:53] decision — o token do Discogs sai da F59 e vira a F66, para a F59 poder fechar

- **O MJRP:** «Fatia D deixe pra depois, pode até abrir uma feat nova qqr coisa pra não impedir a issue de fechar, até pq nem me lembro o que seria essa feature com discogs».
- **F66** criada («O token do Discogs sai do repositório», `^REL-40`, via rápida, conserta a UAT-17). A F59 fica com as fatias A e B (feitas), C e E.
- **O que é o Discogs aqui (lido no código):** `scripts/generate-dataset.js` e `scripts/fetch-missing-artists.js` leem discografias do Discogs para montar o arquivo de álbuns da busca com autocompletar (`public/assets/data/`). São scripts rodados à mão, uma vez; o app em produção não fala com o Discogs. O token está escrito nos dois arquivos e no histórico do git.
- **Depende do MJRP:** trocar ou apagar o token no site do Discogs. Sem posição na ordem de prioridade; ele decide.

## [2026-11-19 15:47] session — primeiro deploy do servidor: rotas de depuração fechadas em produção (F59, fatia B)

- **Autorização do MJRP:** «2. Pode, só antes gere uma tag no git pra fechar a v4.0» (a tag `v4.0` foi criada antes).
- **Deploy:** `gcloud run deploy mjrp-proxy --source server`, de uma cópia limpa da `main` em `93a7dc4`, com os mesmos passos do `scripts/deploy-backend.sh` (pasta `shared` e `config` copiadas para o contexto). Revisão nova `mjrp-proxy-00196-sj7`, com 100% do tráfego. Ponto de volta: `mjrp-proxy-00195-9fg`.
- **Conferido em produção:** as quatro rotas de depuração respondem 404, direto e pelo endereço do site (antes 200); `/api/musickit-status` e `/api/musickit-token` 200; `/api/enrich-album` 200 com notas; `/api/generate` de «Prince - 1999» 200 com o álbum; o `rawStage` não devolve mais a resposta crua; variáveis e segredos do serviço mantidos.
- **Segue aberto:** as rotas pagas respondem sem login (fatia C).
- **Prioridade gravada pelo MJRP no Control Center** («Foi!»): as doze que não começaram, na ordem combinada.
- Evidência: `reports/evidence/F59-close-what-is-open-security/F59-probe-2026-11-19.json`.

## [2026-11-19 15:44] session — tag `v4.0`; F59 fatia A publicada; F59 fatia B (servidor) pronta e provada numa cópia local

- **O MJRP:** «1.sim 2. Pode, só antes gere uma tag no git pra fechar a v4.0».
- **Tag `v4.0`** (anotada, local) no commit `cd96ad3`, o que está em produção como v4.0 desde o quinto deploy. Não enviada: o push é do MJRP.
- **Sexto deploy do site (F59, fatia A):** `firebase deploy --only hosting` de uma cópia limpa da `main`; 455 testes antes. Conferido por fora: o site serve o pacote novo, e o endereço do mapa de código devolve a página do app, não o mapa. A conexão do Spotify em produção, com a conferência nova, não foi vista num navegador.
- **Prioridade:** o MJRP salvou pelo Control Center as doze que não começaram (F60, F64, F52, F55, F56, F61, F57, F58, F49, F62, F63, F65); o agente mestre confirmou que a F59, em andamento, fica à frente e abriu a UAT-628 no harness para a mensagem que não nomeava o item.
- **Fatia B (servidor):** `server/lib/debugGate.js` (as rotas de depuração e o `rawStage` só com `ENABLE_DEBUG_ROUTES=true`; `NODE_ENV` não liga) e `server/lib/asyncRoute.js` (rota que quebra responde 500, ou o 4xx de um pedido ilegível, sem detalhe). Sete testes, escritos junto com o código; a suíte tem 462 passando. Numa cópia local do servidor: as quatro rotas de depuração respondem 404 por padrão e 200 com a chave ligada.
- **Achado na leitura de produção:** o serviço do Cloud Run foi publicado por `gcloud run deploy --source`, com quatro segredos (IA e os três da Apple) e nenhuma variável do Spotify; o `Dockerfile` fixa `NODE_ENV=production`.

## [2026-11-19 15:40] decision — a ordem da v5.0 é a do agente: F59, F60, F64, F52, F55, F56, F61, F57, F58, F49, F62, F63, F65

- **O MJRP, do iPhone:** pediu a ordem do agente para arrumar no harness remoto e, depois de tentar, disse «de qqr forma a prioridade é essa acima».
- **O Control Center recusou o salvamento** da ordem com 13 itens: «feature que já começou … sai da ordem, a lista é das que ainda não começaram». A F59, primeira da lista, está `In Progress`. O `docs/specs/priority.md` continua com a ordem antiga (F49, F59, F52, F55, F56, F57, F58, F61); o arquivo é a válvula do MJRP e o agente não o editou.
- **Avisado ao agente mestre do harness** (pedido do MJRP), com as duas perguntas: o caminho certo para gravar a ordem quando a primeira já começou, e se a mensagem que não nomeia o item vira achado do harness.
- **Enviado ao MJRP no iPhone:** o mapa da v5.0 (`reports/audits/2026-11-19-mjrpalbumblender-v0-v5-map.md`).
- **À espera dele:** publicar a fatia A da F59 sem o clique no Spotify; e o primeiro deploy do servidor, para a fatia B.

## [2026-11-19 15:35] session — correção anotada nos dois relatórios: as regras abertas eram as do arquivo, não as de produção

O mapa da v5.0 e o cruzamento ganharam, no topo, a nota da conferência de produção (UAT-15). A UAT-15 cita o commit `90cd34f`.

## [2026-11-19 15:34] session — F59, fatia A (só o site): regras do repositório fechadas, volta do Spotify conferida, sem mapas de código

- **Decisão do MJRP:** «Siga a sua prioridade». A ordem do agente: F59, F60, F64, F52, F55, F56, F61, F57, F58, F62, F63, F65; a F49 entra quando ele disser (o `docs/specs/priority.md` do Control Center ainda mostra a ordem que ele marcou antes; o arquivo é dele).
- **Correção de um achado:** as regras do banco **em produção não estavam abertas**. Lidas pela API de regras do Firebase: a versão em vigor é de 2026-01-11 e fecha o ranking de cada pessoa no dono. Aberto estava o arquivo `firestore.rules` do repositório («if true», nota DEBUG); publicá-lo teria aberto produção. O implementador tinha dito ao MJRP que os rankings estavam abertos a qualquer pessoa, repetindo o relatório sem conferir produção.
- **Feito:** `firestore.rules` igual às regras em vigor, com teste que recusa regra sem condição e dado pessoal sem dono; `firebase.json` aponta o arquivo; `SpotifyAuthService` recusa a volta cujo `state` não é o enviado e tira os segredos do gerador criptográfico; sair da conta encerra a sessão do Spotify; `vite.config.js` sem mapas de código.
- **Confirmado aberto em produção, ainda não consertado:** `/api/debug/files`, `/api/list-models` e `/api/debug/import` respondem 200; `POST /api/generate` responde 200 sem login. São as fatias B e C, de servidor.
- **Testes:** 12 novos, vistos falhar antes; a suíte tem 455 passando. O build compila, sem `.map`.
- **No navegador:** a volta do Spotify que não bate é recusada, sem pedido ao Spotify. A volta certa parou na tela de autorização do Spotify, que é do MJRP aceitar. `reports/evidence/F59-close-what-is-open-security/F59-probe-2026-11-19.json`.
- **Não publicado ainda:** espera a volta certa do Spotify ser vista no navegador, para não arriscar a conexão em produção.

## [2026-11-19 15:20] session — manual: diagramas da evolução da arquitetura (v3, v4.0, alvo v5.0), padrões e componentes

Pedido do MJRP: «produza novos diagramas de arquitetura para os manuais da documentacao, mostrando a evolucao do antes pra depois, nao esqueça de manter o mapeamento dos design patterns utlizados e dos componentes que temos». `docs/manual/01_System_Architecture.md` ganhou a seção 6: três diagramas do mesmo sistema (antes, hoje, alvo), a comparação lado a lado, o mapa de padrões com o identificador do catálogo do harness, o lugar e a versão em que cada um chegou (mais os seis padrões da casa sem identificador e os quatro planejados para a v5.0), e o mapa de componentes do cliente, do servidor e de fora. O índice do manual aponta para ela. A trava de estrutura recusou um arquivo novo em `docs/manual/`; o conteúdo entrou no arquivo de arquitetura que já existia. Os diagramas de «antes» e «hoje» saíram do código; o de «alvo» é plano. Não foram renderizados para conferir a sintaxe.

- **Prioridade do MJRP, pelo Control Center:** F49, F59, F52, F55, F56, F57, F58, F61 (`docs/specs/priority.md`). As features aparecem no board. F60, F62, F63, F64 e F65 ainda sem posição.
- **O MJRP:** «vou dar aceite com o tempo … pode começar a v5.0».

## [2026-11-19 15:16] session — dez issues de hoje ganham a parte «Evidência», que o board exige

O MJRP perguntou se as features da v5.0 aparecem no Control Center. O leitor do board (`product_structure_check.py`) conta 13 features na v5.0 (`^REL-40`) e 8 na v4.0 (`^REL-39`), mas estava vermelho: dez issues abertas hoje (UAT-182, UAT-183, UAT-187 a UAT-193, UAT-195) não tinham a parte **Evidência:** da gramática. Acrescentada em cada uma, apontando o relato do MJRP, o relatório da regressão ou a evidência da feature. A tela do Control Center em si não foi vista: ela pede login (401).

## [2026-11-19 15:14] session — quinto deploy do site: F54 (apagar do inventário, duração das faixas, botão «Close»), main `cd96ad3`

Publicado pela regra do MJRP de 2026-11-19 («cada Feature feita deveria ser testar e ir pra prod»): a F54 passou nos testes (443, 0 falhas) e no navegador local antes. `firebase deploy --only hosting` de uma cópia limpa da `main`. Conferido por fora: o site serve `assets/main-DfWvVVfh.js`, o mesmo arquivo do build. Não visto em produção no navegador. O servidor não foi tocado. Como voltar: «Rollback» no histórico do Firebase Hosting.

**v4.0, o que falta para fechar:** o aceite do MJRP nas issues em `fixed` e o push. Nenhum conserto da v4.0 está pendente de código.

## [2026-11-19 15:13] session — F54: o commit do conserto anotado nas issues e nas tarefas

UAT-01 e UAT-188 passam a citar o commit `82336c2`; as tarefas 3 e 4 da F54 também.

## [2026-11-19 15:12] session — F54: apagar do inventário apaga (UAT-01) e as faixas mostram a duração (UAT-188)

- **UAT-01:** `InventoryController.handleDelete` chamava `inventoryStore.deleteAlbum`, que não existe; passa a chamar `removeAlbum` e a tratar a falha. O repositório esquece a resposta «já está no inventário» do álbum removido, para ele poder ser adicionado de novo em seguida.
- **UAT-188:** `utils/duration.js`, um formatador só, em segundos; a janela de ranking e a tabela de faixas liam a duração como milissegundos. Conferido nos dados reais: 2.109 faixas com duração entre 15 e 4.767, em segundos.
- **Testes:** 9 novos, vistos falhar antes; a suíte tem 443 passando. `vite build` compila.
- **No navegador:** «GNX», o item de teste, removido do inventário do MJRP (24 para 23, não volta ao recarregar); durações nas duas janelas; botão «Close». `reports/evidence/F54-close-v4-inventory-delete-and-polish/F54-browser-2026-11-19.json`.
- **Documentos:** spec, plano e tarefas da F54; UAT-01 e UAT-188 em `fixed`; manual e `behavior.md` sem a ressalva dos defeitos.
- **Ficou de fora:** `TrackRow.formatDuration` e `PlaylistGrid.calculateDuration` ainda formatam por conta própria (certos, em segundos).

## [2026-11-19 15:05] session — mapa da v5.0: cada achado, por tema, com a feature que o resolve

Pedido do MJRP: «a partir do report, vc gerar um novo como um grande mapa … com cada item mapeado para cada feature e agrupado pelos temas que vc sugeriu». `reports/audits/2026-11-19-mjrpalbumblender-v0-v5-map.md`: os 153 itens do cruzamento em oito temas (segurança 11, perda de dado 10, carga e identidade 33, blend e exportação 16, Home e navegação 20, publicação 9, inventário 5, limpeza 13), mais 33 consertados na v4.0 e 3 que não valem mais; cada item em aberto com a feature (F49, F52, F54 a F65), o estado e o código de origem nos relatórios antigos. Onze issues legadas de 2025-11 a 2026-01 ficaram **sem feature**: não foram relidas e pedem triagem. A tradução e a atribuição são do implementador, sem julgamento separado.

## [2026-11-19 15:03] decision — tudo entra na v5.0, e cada feature pronta e testada vai para produção sozinha

- **O MJRP:** «pra mim tudo tem que entrar na v5.0, mas ir pra prod nao precisa ser um big bang, cada Feature feita deveria ser testar e ir pra prod».
- **O que muda:** não há v4.1. Os oito grupos em aberto do cruzamento entram na v5.0. A entrega é feature por feature: testada (testes e navegador), publicada, conferida em produção. O agente trata essa frase como a autorização para publicar o **site** ao fim de cada feature testada; publicar o **servidor** ou as **regras do banco** ele confirma com o MJRP na primeira vez de cada um.
- **Plano da v5.0 revisado no board:** F55 renomeada e alargada (regra única de identidade nos cinco lugares; o MJRP perguntou por que «o álbum» e não «os»); F52 reordenada (contrato de erros, raspador certo, cache); F56 só com blend e edição; F58 alargada ao controlador de playlists; novas F59 (segurança), F60 (perda de dado), F61 (playlists guardadas rápidas), F62 (blend e exportação), F63 (Home e navegação), F64 (um caminho testado para produção), F65 (limpeza). Todas em esboço, via rápida.
- **Issues novas:** UAT-196 a UAT-203, uma por grupo de achados sem issue. Três delas (UAT-197, UAT-198, UAT-200 a UAT-202) vêm dos relatórios e não foram reproduzidas pelo implementador; cada uma diz isso.
- **Ordem proposta dentro da v5.0, à espera do MJRP:** F59, F60, F64, F52, F55, F56, F61, F57, F58, F62, F63, F65.
- **v4.0:** a F54 fica com apagar do inventário (UAT-01), a duração (UAT-188) e o botão «Close» (UAT-195); a UAT-190 foi para a F62 e a UAT-192 para a F63.

## [2026-11-19 14:56] session — relatório do cruzamento com o estado de cada linha

Pedido do MJRP: marcar no relatório o que foi consertado na v4.0, o que vai para a v5.0 e o que não vale mais, com o motivo; o restante será discutido com ele no chat. `reports/audits/2026-11-19-mjrpalbumblender-v0-earlier-reports-vs-v5-plan.md`: 33 linhas consertadas na v4.0, 10 a consertar na v5.0, 3 que não valem mais (cada uma com o motivo), 103 em aberto e 4 que contradizem a análise de hoje.

## [2026-11-19 14:53] session — F54: o texto passado como propriedade vira texto (UAT-195)

`SafeDOM` passa a tratar `textContent` como o texto do elemento. Conserto no ajudante, não nos dois botões, para valer para qualquer uso futuro. Três testes novos em `test/utils/SafeDOM.test.js`; escritos junto com o conserto, não vistos falhar antes (a causa foi lida no código). No navegador local: a janela de detalhe mostra «Close». A suíte tem 434 passando. Ainda fora de produção: o deploy espera o sim do MJRP.

## [2026-11-19 14:52] session — UAT-195 aberta: o botão de fechar da janela de detalhe do álbum aparece sem texto

Relato do MJRP em produção, junto de «ranking album em prod working!» (a janela de ranking reabre na ordem salva, UAT-187, vista por ele em produção). O botão vazio é o «Close». Causa lida no código: `SafeDOM` gravava `textContent` como atributo. A mesma captura mostra «--:--» na coluna de duração: anotado na UAT-188. Conserto pela F54.

## [2026-11-19 14:51] session — quarto deploy do site: ícone da aba e título (main `1ca7b39`)

Pedido do MJRP, com «em prod pls». `firebase deploy --only hosting` de uma cópia limpa da `main`; antes: 431 testes passam, o build compila. Conferido por fora: `https://mjrp-playlist-generator.web.app` responde com o título «MJRP The Album Blender - Playlist Generator», o ícone em PNG (7 kB) e o `favicon.ico` com a mesma imagem. Não visto no navegador: a aba em si (o navegador pode guardar o ícone antigo por um tempo). Como voltar: «Rollback» no histórico de versões do Firebase Hosting.

## [2026-11-19 14:51] session — F54: o ícone da aba é o logo do site e o título é «MJRP The Album Blender - Playlist Generator»

Pedido do MJRP: «sabe o logo do site … pode colocar ele como favicon do browser tb … e no texto do browser "MJRP The Album Blender - Playlist Generator"...em prod». `public/favicon.png` (64 px) e `public/apple-touch-icon.png` (180 px) feitos do `public/assets/images/logo.png`; o `public/favicon.ico`, que estava vazio (0 bytes), recebeu a mesma imagem; `public/index.html` e a Home passam a usar o mesmo título, de modo que ele não muda mais de tela para tela (parte da UAT-192; o resto dela, idioma das receitas e série de origem no blend, segue aberto). O build traz o título e os dois ícones.

## [2026-11-19 14:50] review — cruzamento dos relatórios anteriores com a análise e o plano da v5.0; ADR-0019 corrigida

Relatório: `reports/audits/2026-11-19-mjrpalbumblender-v0-earlier-reports-vs-v5-plan.md`. Feito por um agente separado, só de leitura, a pedido do MJRP («só começamos a v5.0 … fazendo um double check com os reports do inicio dessa sessao»). O implementador conferiu no código seis das afirmações mais graves; as seis conferem. O resto não foi reconferido.

- **Contagem (153 achados):** 33 consertados na v4.0, 10 no plano da v5.0, 20 com issue aberta e fora de qualquer feature, 83 sem issue e sem plano, 3 que não valem mais, 4 que contradizem a análise de hoje.
- **Mais graves que qualquer coisa do plano, todos fora dele:** as regras do Firestore deixam qualquer pessoa ler e gravar o ranking de qualquer usuário (UAT-15, `firestore.rules:32-36`); o servidor de produção tem as rotas de depuração montadas e a chave paga de IA exposta (UAT-16); um token do Discogs em dois scripts versionados (UAT-17); a edição de um lote de playlists apaga os antigos antes de gravar os novos, sem issue (`PlaylistsController.js:350-362`); o inventário da pessoa anterior fica na tela depois de sair da conta, sem issue.
- **O que muda o desenho da v5.0:** a lentidão das playlists guardadas é uma leitura por série, em fila, e não carga de álbum (a F56 tem de separar as duas); a regra «o primeiro resultado vale» existe em cinco lugares, e a F55 cobria um; a loja da Apple vem do idioma do navegador, nunca da conta; uma falha ainda vira «sem dado» na popularidade e nas notas, e a F51 passou a gravar isso na série; um cache de notas no servidor congelaria respostas erradas do raspador (ordem: contrato de erro, raspador certo, cache).
- **Onde a análise de hoje estava errada:** «80 álbuns em 8,5 s» contra «46 de 80 em 4 min 40 s» compara medidas diferentes (achados × achados e com nota); a ADR-0019 dava como feitas as decisões 1 e 7, que o código ainda não cumpre, e recusava a carga no servidor por um motivo falso. A ADR foi corrigida neste commit.
- **Limites do cruzamento:** os apêndices brutos A a M não foram relidos, só as notas verificadas; nenhum teste nem o app foram rodados.

## [2026-11-19 14:45] session — F53: spec, plano e tarefas escritos; UAT-149 em `fixed`

Passo retroativo da via rápida para a suíte de testes verde: quatro requisitos, o plano e as tarefas como foram feitas, com `status: In Progress`. Duas tarefas ficam abertas com `waiting::` (a origem de uma mensagem de erro que não derruba teste; o aceite do MJRP). O verificador de fecho da sessão apontou as tarefas em branco; a sessão **não** está encerrando: o cruzamento dos relatórios antigos com o plano da v5.0 segue rodando, e os arquivos locais de teste (`.claude/launch.json`, `vite.config.local.js`, o protótipo, o `.env`) continuam no worktree de propósito.

## [2026-11-19 14:43] session — terceiro deploy do site: a janela de ranking abre na ordem salva (UAT-187); F53, ADR-0019 e documentação na `main`

- **Autorização do MJRP:** «let's do it», em resposta ao pedido de levar a F53 à `main` e publicar o conserto da janela de ranking.
- **`main`:** o ramo `fix/f53-test-suite-green` entrou por `merge_train.py merge` (`ea393c1`): suíte de testes verde, ADR-0019, `behavior.md`, manual, os dois relatórios e o save.
- **Deploy:** `firebase deploy --only hosting`, de uma cópia limpa da `main` em `ea393c1`, com o `.env`. Antes do envio: 431 testes passam, 0 falham; o build compila. Conferido por fora: o site serve `assets/main-D0HKIHOg.js`.
- **Não conferido:** a janela de ranking em produção no navegador. O servidor não foi tocado.
- **Como voltar:** Firebase Console, Hosting, histórico de versões, «Rollback».
- **A ADR-0019 não está em nenhum remoto** (pergunta do MJRP): nada desta sessão foi enviado por push.
- O `merge_train` desmontou os worktrees das duas sessões laterais (F46 e F48), já integradas.

## [2026-11-19 14:42] session — save: v4.0 em produção e em fecho, regressão completa, v5.0 criada e em espera

> Participantes: MJRP + Claude Code · Branch: fix/f53-test-suite-green
> Session: claude-code:fix-albums-loading-and-cache (sessão de consertos do v0, aberta pela orquestradora do harness)
> Duração: o dia 2026-11-19

### Executive Summary
A v4.0 do Album Blender v0 foi para produção em dois deploys do site (carga de álbuns por um serviço dono, lista inteira de séries, filtros, busca e paginação, cache e nova tentativa, endereço local único, botão do Spotify). Uma regressão completa no navegador achou um fluxo quebrado, três telas lentas e um caso de álbum trocado; virou relatório e onze issues. O MJRP adotou a arquitetura proposta como release v5.0, que só começa depois de documentada e de cruzada com os relatórios do começo da sessão; esse cruzamento estava rodando quando a sessão foi salva.

### Decisions
- A v5.0 só começa com toda a arquitetura documentada e com o cruzamento dos relatórios do começo da sessão feito e o impacto relatado ao MJRP (dele, na última mensagem antes do save).
- A arquitetura proposta (todas as telas pelo serviço de carga, regra única de identidade do álbum, peça única de escolher álbuns, contrato de erros e cache no servidor) é a v5.0, pela via rápida; a v4.0 fecha com o que não depende dela mais o conserto da janela de ranking (MJRP).
- Antes do backlog: consertar os 28 testes, registrar a ADR da carga, atualizar o `behavior.md` e toda a documentação (MJRP). Feito: suíte verde, ADR-0019 `Proposed`, `behavior.md`, 22 arquivos do manual.
- Cenários, resultados, diagnóstico e análise vão para relatório `.md` (MJRP, duas vezes).
- O agente pôde ranquear dois álbuns de teste e criar dados de teste na conta dele para a regressão (MJRP); ficaram «GNX» no inventário e dois rankings.
- Dois deploys do site autorizados por ele («vamos mover pra prod»; «sim, prossiga»). O terceiro, do conserto da janela de ranking, não foi autorizado ainda.
- Mudança de arquitetura feita e avisada: cada fonte aplica a sua resposta sobre o álbum mais novo e só o último pedido de uma fonte escreve (`arch.md`, seção 19).
- Desvio de processo registrado, não contornado: o portão de fim de turno pede o `doctor.py`, vermelho desde antes da sessão; o protótipo da paginação ficou fora do git pela trava do espelho.

### Next Session
1. Ler `side-session-notes/local_a15091e2-6673-441f-a156-65b8e8f594b8/2026-11-19-v0-earlier-reports-vs-v5-plan.md`, conferir o que ele afirma e relatar ao MJRP o impacto na análise e no desenho da v5.0.
2. Escrever as propostas de arquitetura da v5.0 (F55, F56, F57, F52), com crítica separada, antes do código.
3. Fechar a v4.0: F54, documentos da F53, o deploy do conserto da janela de ranking quando o MJRP disser sim.
4. Ver os 24 erros novos do doctor depois do commit do manual.

### Key Data
- Produção: `https://mjrp-playlist-generator.web.app`, publicado da `main` em `40ca80d`. Servidor (Cloud Run `mjrp-proxy`) não tocado.
- Testes: 431 passam, 0 falham (`npx vitest run`, código de saída 0). Antes: 28 falhas.
- Medições: 80 álbuns em 8,5 s; 217 álbuns em 31 s; playlists guardadas 20 s; blend de 2 álbuns já carregados 8 a 18 s.
- Complexidade: `_enrichOne` 21, `CatalogAdapter.find` 12, `api/client.js fetchAlbum` 18, `PlaylistsController.handleSave` 27.
- Issues: UAT-182 a UAT-194 abertas nesta sessão; 51 abertas no total, 40 delas antigas e fora de qualquer feature.
- Doctor: 520 erros (496 antes do commit do manual; 499 no começo da sessão).
- Nada foi enviado por push.

## [2026-11-19 14:41] session — manual revisado contra o código: 22 arquivos de `docs/manual/` corrigidos

Pedido do MJRP: «antes de começar o backlog, atualize toda a documentacao». Um agente separado leu cada arquivo do manual ainda não revisado hoje (servidor, blend, playlists, inventário, integrações, ranking, testes, guia de estilo, folha de referência) e corrigiu o que o código contradiz; o implementador conferiu por amostra (a rota de busca que não existe, o `/debug/files`, os módulos sem uso) antes do commit.

- **Tirado do manual por não existir no código:** a rota `GET /api/search/album`; a espera de 300 ms na busca; a lista de permissão do `/debug/files` (ele lista qualquer caminho, o que agrava a UAT-16); o filtro de palavras do raspador; o limite de chamadas do Spotify no servidor; a evidência vinda de três fontes (só o BestEverAlbums chega); o limite de 80 minutos e a playlist «Overflow»; telas, lojas e métodos que não existem mais.
- **Dito agora como defeito conhecido:** apagar do inventário (UAT-01); o blend e a edição de playlists com laço de carga próprio (UAT-189).
- **Marcados como sem uso:** onze módulos que nada importa (entre eles `ViewModeStrategy`, `PlaylistsDragBoard`, `ContextMenu`, `SkeletonLoader`) e cinco algoritmos não registrados.
- **Não verificado, deixado como estava:** trechos do guia de estilo (classes e tamanhos), detalhes dos algoritmos de mistura, o que cada teste de navegador confere, e os campos de duração da faixa em `32_Data_Schema_Reference.md` (o manual diz milissegundos, o modelo guarda segundos; liga com a UAT-188). As linhas 49 a 81 de `24_Test_Suite.md` estão embaralhadas e não foram reorganizadas.
- **Achados de código, nada mexido:** `server/test/unit-tests.js` importa `public/js/curation.js`, que não existe (é a UAT-21); o `ScoreCalculator` declara uma penalidade de coletânea que nunca aplica.

## [2026-11-19 14:35] session — release v5.0 criada; a v4.0 entra em fecho; features F54 a F58 no board

- **Decisão do MJRP:** «vamos com sua nova arquitetura proposta, mas vamos criar um versao v5.0 pq a v4.0, apesar de ainda com varios defeitos, corrigiu o mais grave e está mais estável em prod. na v4.0, eu fecharia os que nao impactam e dependem da arquitetura mais o fix do ranking que reportei, aí vai todo o restante para a v5.0 via fast lane».
- **`ROADMAP.md`:** `^REL-40`, «v5.0 · Uma arquitetura só para carregar e escolher álbuns»; a `^REL-39` (v4.0) passa a «em fecho».
- **Story S-53** (Prioritized, v5.0), embutida no `prd.md` sob o épico EP-01.
- **v4.0, o que falta para fechar:** F54 (apagar do inventário e acabamento: UAT-01, UAT-188, UAT-190, UAT-192), F53 (suíte de testes verde, já feita no ramo) e o deploy do conserto da janela de ranking (UAT-187).
- **v5.0, via rápida:** F55 (o álbum pedido, ou um aviso: UAT-184), F56 (blend, edição e playlists guardadas pelo serviço de carga: UAT-186, UAT-189, UAT-191), F57 (uma peça só para escolher álbuns: UAT-185, UAT-193), F58 (limite de complexidade no serviço de carga: UAT-194, aberta agora), F52 (servidor, UAT-181) e F49 (carregar mais, UAT-06), as duas últimas movidas da v4.0.
- Todas com spec, plano e tarefas em esboço, `lane: fast`, `solution_type: fix`. A ordem dentro da v5.0 é do MJRP.

## [2026-11-19 14:34] session — ADR-0019 da carga escrita (Proposed) e `behavior.md` em dia com a v4.0

- **ADR:** `docs/decisions/0019-one-owner-for-the-album-load.md`, status `Proposed`. Registra a decisão de um dono só para a carga (o que o MJRP aprovou em conversa em 2026-11-19), as consequências medidas, o que ainda não foi feito e as alternativas recusadas. Escrita depois do código; o texto em si não passou por crítica separada, e o aceite formal está pendente.
- **`behavior.md`:** 12 estados reescritos para o que o código faz depois das features F45 a F51, três estados novos (`^library-album-failed`, `^library-paging`, `^app-local-address`) e ressalvas com o número da issue onde a regressão achou defeito (UAT-184, UAT-185, UAT-186, UAT-188, UAT-27). As linhas que não dizem «v4.0» não foram reconferidas.
- **Decisão do MJRP, 2026-11-19:** «vamos com sua nova arquitetura proposta, mas vamos criar um versao v5.0 … na v4.0, eu fecharia os que nao impactam e dependem da arquitetura mais o fix do ranking que reportei, aí vai todo o restante para a v5.0 via fast lane».

## [2026-11-19 14:33] session — F53: a suíte de testes está verde (431 passam, 0 falham; antes 28 falhas)

`npx vitest run` sai com código 0. Nenhum código do app mudou: os 28 eram testes fora de dia ou ambiente de teste quebrado.

- **Ambiente (3 falhas + as que vinham de arrasto):** as versões novas do Node definem um `localStorage` próprio, vazio, que escondia o do jsdom. O `test/setup.js` passa a entregar o guardado do jsdom (ou um em memória) e a esvaziá-lo antes de cada teste.
- **Loja de séries (19):** o teste descrevia a loja antiga, que criava e lia séries. A loja virou loja pura (ADR 0017). Teste reescrito para a loja que existe; criar e ler séries já é coberto em `test/services/SeriesService.test.js`.
- **Roteador (2):** a tela é criada de forma assíncrona; os testes passaram a esperar.
- **Login (1):** o serviço pega o `auth` só quando precisa; o teste esperava na criação.
- **Barra de filtros (1):** o teste simulava uma barra que não existe mais; agora simula a `FilterToolbar` e confere os artistas tirados das séries.
- **Painel do blend (2):** um teste herdava o contêiner do teste anterior.
- **Duração da playlist (4, que nem rodavam):** a conta saiu da tela e foi para `PlaylistGrid`; o teste foi junto (`test/components/playlists/PlaylistGrid.duration.test.js`).
- **Tela de ranking consolidado (arquivo que não carregava; 2 falhas ao carregar):** importava uma loja que não existe; e `render()` devolve o elemento em vez de escrever na tela.
- **Sincronização de usuário (arquivo que não carregava):** dublê declarado depois do `vi.mock`, que sobe para o topo.
- **Roteiros de navegador (8 arquivos «sem suíte»):** `test/e2e/` saiu da contagem do Vitest; tem executor próprio (`npm run test:e2e`), que não foi rodado.
- **Achado, não consertado:** durante a suíte aparece «Maximum call stack size exceeded» na saída de erro, sem derrubar teste; origem não investigada.

## [2026-11-19 14:31] session — F53 criada: a suíte de testes volta a ficar verde (UAT-149)

Pedido do MJRP: «conserte os 28 testes falhando». Feature na via rápida, `solution_type: fix`, consertando a UAT-149 (falhas de regressão antigas). Spec, plano e tarefas em esboço; o trabalho corre no ramo `fix/f53-test-suite-green`.

## [2026-11-19 14:30] session — análise da arquitetura de carga escrita em relatório, a pedido do MJRP

`reports/audits/2026-11-19-mjrpalbumblender-v0-load-architecture-analysis.md`: o desenho de hoje e o proposto (em diagrama), por que um é pior, os padrões de cada um, o risco de gargalo e a complexidade ciclomática medida com o ESLint. Achado da medição: `_enrichOne` está em 21, acima do limite de 10, depois da mudança da seção 19 do `arch.md`. Quem escreveu é quem desenhou; não houve crítica separada.

## [2026-11-19 14:21] session — relatório da regressão do navegador escrito, a pedido do MJRP

`reports/audits/2026-11-19-mjrpalbumblender-v0-browser-regression.md`: os 20 cenários com o resultado de cada um, o diagnóstico por achado, o que não foi testado, os dados de teste que ficaram na conta e o backlog proposto. Quem rodou foi o próprio implementador, não um juiz separado; o relatório diz isso no cabeçalho.

## [2026-11-19 14:20] session — UAT-193 aberta: o MJRP pede para investigar criar × editar com lógicas separadas (séries e playlists)

Nota dele para o backlog: ver se as lógicas de edição precisam mesmo ser diferentes das de criação, na série e na playlist, e como melhorar a arquitetura e os padrões para facilitar manutenção e evolução. Primeira passada no código: a busca e a classificação já são compartilhadas; a duplicação está na parte de tela (duas listas de discografia). Entra no backlog como investigação com proposta de arquitetura antes de qualquer código.

## [2026-11-19 14:18] session — regressão completa no navegador, a pedido do MJRP; UAT-188 a UAT-192 abertas

Feita em `http://127.0.0.1:5010`, na conta do MJRP, com dados de teste do agente (série «Claude Regression Test», depois «… v2»).

- **Funcionou:** busca por artista na Home e criação da série; carga da série; adicionar ao inventário e editar o item; remover um álbum da série (persistiu); blend com a receita recomendada; renomear o lote, remover uma faixa e salvar; busca das playlists guardadas (texto digitado de uma vez, foco mantido, UAT-179); «Edit Batch» traz o que foi salvo; apagar o lote; editar a série (renomear e acrescentar álbum pela busca); apagar a série.
- **Não funcionou:** apagar do inventário (UAT-01, confirmada: `inventoryStore.deleteAlbum is not a function`). O item de teste «GNX» ficou no inventário do MJRP.
- **Medido:** playlists guardadas, 20 s para aparecer (UAT-186); blend de 2 álbuns já carregados, 8 a 18 s (UAT-189); inventário, 1,2 s.
- **Causa achada:** UAT-184 (álbum trocado): com o artista certo, a conferência de nome aceita qualquer álbum (0,38 contra corte de 0,35), e vários identificadores guardados respondem 404.
- **Novas:** UAT-188 (duração 0:00 na janela de ranking), UAT-189 (blend lento), UAT-190 (tela de edição de playlists), UAT-191 (editar uma série recarrega todas), UAT-192 (título da aba, idioma, série de origem no blend).
- **Não testado:** exportar para o Spotify e para a Apple Music (criaria playlists nas contas dele), «Download JSON», «Refetch», colar em lote na Home, a janela de detalhe do álbum, a migração de visitante. Erros 500 do servidor apareceram no console durante a carga e não foram investigados.
- **Dados de teste que ficaram:** «GNX» no inventário; os rankings de «Brothers In Arms» e «Rapture of the Deep».

## [2026-11-19 14:14] session — UAT-187 consertada: a janela de ranking abre na ordem salva

`UserRankModal` passou a montar a lista pelo ranking que o álbum já traz (faixas sem posição depois, na ordem do disco); «Reset» volta para a ordem do disco. Um teste novo, visto falhar antes. No navegador: a janela de «Brothers In Arms» abre com a faixa-título em 1º. Achado ao lado, não consertado: a janela mostra «0:00» em toda faixa (a duração é guardada em segundos e a janela lê como milissegundos); vai para a lista da regressão.

## [2026-11-19 14:13] session — UAT-187 aberta: a janela de ranking reabre na ordem do disco, não na ordem salva

Relato do MJRP durante a regressão («epitaph como numero 2 … carregou em 3»). Causa lida no código: a janela ordena pela posição no disco e ignora o ranking que o álbum traz. Conserto como ponta da F46, no ramo `fix/f46-rank-modal-saved-order`.

## [2026-11-19 14:08] session — UAT-184, UAT-185 e UAT-186 abertas; o MJRP pediu uma regressão completa do site

- **Relatos do MJRP:** um álbum que ele nunca adicionou aparece numa série (UAT-184: pedido «Stone Temple Pilots - Core», carregado «Shangri-La Dee Da»); álbuns de estúdio do Kendrick Lamar caem na aba «?» da busca da Home (UAT-185); playlists e inventário lentos (UAT-186).
- **Pedido dele:** uma regressão completa no navegador, com dados criados pelo agente (uma série de álbuns «do Claude», blend, edição de playlists, inventário, os CRUDs), registrando as issues achadas; no fim, cruzar com o já reportado e montar um backlog de features para ele priorizar.

## [2026-11-19 14:04] session — segundo deploy do site em produção: F46, F48 e F50 (main `40ca80d`)

- **Autorização do MJRP:** «sim, prossiga», à proposta de juntar na `main` e fazer o segundo deploy.
- **Deploy:** `firebase deploy --only hosting`, de uma cópia limpa da `main` em `40ca80d`, com o `.env`. Antes do envio: 389 testes passam, as mesmas 28 falhas da linha de base; o build compila.
- **Conferido por fora:** `https://mjrp-playlist-generator.web.app` serve `assets/main-J6imsDjR.js` e o arquivo do botão do Spotify com o diálogo novo.
- **Não conferido:** o uso em produção no navegador depois deste deploy. O servidor (Cloud Run) não foi tocado.
- **Como voltar:** Firebase Console, Hosting, histórico de versões, «Rollback» para a versão anterior (a de hoje, `80e6028`).
- **Em produção o Spotify** precisa ser conectado de novo pelo MJRP: a conexão é guardada por endereço.

## [2026-11-19 14:03] session — F46, F48 e F50 na `main`; UAT-173 a UAT-177, UAT-180 e UAT-183 em `fixed`

O ramo `fix/f50-one-local-address` (com `fix/f46-albums-load-state` e `fix/f48-album-cache-and-retry` dentro) entrou na `main` pelo `merge_train.py merge`. O conflito do `docs/specs/uat.md` foi resolvido pelo `uat-merge`. Cada issue em `fixed` diz o que foi visto no navegador e o que não foi; o aceite é do MJRP. A UAT-181 (segunda fonte, 402) segue aberta: o sintoma sumiu com o acerto da cobrança, mas o código do servidor da F52 não foi feito.

## [2026-11-19 14:03] session — F46: o ranking salvo aparece na hora, sem esperar a nota; cada fonte aplica a resposta sobre o álbum mais novo

- **Autorização do MJRP:** «pode testar um ranking, escolha 2 albums de colecoes diferentes, me diga qual … depois eu arrumo com meu ranking». Álbuns usados: «Brothers In Arms» (Dire Straits) e «Rapture of the Deep» (Deep Purple). Os rankings de teste ficaram gravados na conta dele.
- **Defeito achado no teste:** o ranking salvo não refletia na série cuja nota ainda estava na fila; o pedido de reler esperava atrás dela.
- **Mudança de arquitetura (o MJRP pediu para ser avisado):** a porta das fontes ganhou `apply`; o serviço aplica a resposta sobre o álbum mais novo e só o último pedido de uma fonte escreve. `docs/specs/arch.md`, seção 19.
- **Testes:** 3 novos e 1 reescrito; a suíte tem 388 passando e as mesmas 28 falhas da linha de base. `vite build` compila.
- **No navegador:** `reports/evidence/F46-albums-load-state/F46-ranking-2026-11-19.json`.

## [2026-11-19 13:57] session — F46 e F48 conferidas no navegador (parte); o MJRP entrou no painel embutido

- **F48:** «Clear Cache» zera só o cache de álbuns (IndexedDB `mjrp-cache`) e a carga recomeça; login, Spotify e escolhas de tela ficam. `reports/evidence/F48-album-cache-and-retry/F48-browser-2026-11-19.json`.
- **F46:** o filtro «My Ranking» responde sobre as 46 séries (9 séries), não só sobre a página. `reports/evidence/F46-albums-load-state/F46-browser-2026-11-19.json`.
- **Carga:** 171 álbuns na página de 40 séries, nenhum aviso de falha (a segunda fonte voltou depois do acerto da cobrança).
- **Não conferido:** salvar um ranking pelo modal (grava nos dados do MJRP), a nova tentativa ao servidor, a validade do cache de ranking, a busca das playlists guardadas.

## [2026-11-19 13:53] session — F50 provada no navegador; spec, plano e tarefas escritos; UAT-178, UAT-182 e UAT-183 em `fixed`

- **No navegador:** `http://localhost:5010/albums` cai em `http://127.0.0.1:5010/albums`; o «x» do Spotify abre o diálogo do app e desconecta. O MJRP: «connect e disconnect do spotify ok agora no 5010». Evidência: `reports/evidence/F50-one-local-address/F50-probe-2026-11-19.json`.
- **Documentos:** spec, plano e tarefas da F50 preenchidos (passo retroativo), `status: In Progress`; as três issues em `fixed`, à espera do aceite do MJRP.
- **Aberto:** o login pela Apple em `127.0.0.1:5010` (403; em produção funciona). A F46 e a F48 seguem sem prova no navegador: o painel embutido está sem login da conta e a extensão do Chrome não respondeu.

## [2026-11-19 13:50] session — produção vista pelo MJRP depois do deploy; login pela Apple funciona em produção

- O MJRP abriu a tela de álbuns em produção depois do deploy: «top!, acabei de ver em prod, muito mais rapido». É a visão dele do deploy, não o OK das issues (UAT-172, UAT-24, UAT-179 seguem `fixed`, à espera do aceite).
- «Sign in with Apple» funciona em produção (captura do MJRP: consentimento da Apple e «Successfully signed in!»). O 403 só apareceu em `http://127.0.0.1:5010`, no painel embutido e no Chrome. Causa não provada; falta repetir o teste local com a sessão da Apple já aberta.

## [2026-11-19 13:46] session — site publicado em produção (F45, F47, F51) e UAT-183 aberta

- **Deploy:** a pedido do MJRP («vamos mover pra prod»), o site foi publicado no Firebase Hosting a partir da `main` no commit `80e6028` (`firebase deploy --only hosting`, com o `.env` que traz `VITE_SPOTIFY_CLIENT_ID`). Conferido por fora: `https://mjrp-playlist-generator.web.app` serve o pacote novo (`assets/main-CO4b4agM.js`, com o código da carga nova). Antes do envio: 232 testes passam na `main`, as mesmas 28 falhas da linha de base; o build compila.
- **Não conferido:** o uso em produção no navegador (login, tela de álbuns, filtros, paginação) ainda não foi visto depois do deploy. O servidor (Cloud Run) não foi tocado.
- **Como voltar:** Firebase Console, Hosting, histórico de versões, «Rollback» para a versão de 2026-01-19.
- **Desvio declarado:** o `scripts/deploy-prod.sh` exige chave de conta de serviço, que não existe nesta máquina; os mesmos passos dele foram feitos à mão com o login do Firebase CLI do MJRP, numa cópia limpa da `main`.
- **UAT-183:** relato do MJRP, o «x» do botão «Connected» do Spotify não faz nada. Conserto no ramo `fix/f50-one-local-address`.

## [2026-11-19 13:46] session — F50: o «x» do Spotify pergunta pelo diálogo do app (UAT-183)

`SpotifyConnectButton` trocou o `confirm()` nativo pelo `dialogService.confirm`, o mesmo diálogo das outras confirmações do app. Um teste novo cobre o clique no «x», a pergunta no diálogo do app e a desconexão com o sim. A causa (o navegador silenciando o `confirm()`) é provável, não provada; a prova é o MJRP clicar no «x» depois do conserto.

## [2026-11-19 13:43] session — F50: um endereço local só (`http://127.0.0.1:5010`) e o botão do Spotify que reflete a conexão (UAT-182)

- **UAT-182, causa e conserto:** a conexão avisava por `spotify-auth-success` e o botão só escutava `spotify-auth-change`, disparado só ao desconectar. Agora `SpotifyAuthService.setSession` dispara `spotify-auth-change` (conectar, renovar o token e desconectar usam o mesmo sinal) e o botão busca o nome da conta quando a sessão chega. `spotify-auth-success` fica só como gatilho do enriquecimento.
- **Um endereço:** `public/js/utils/localAddress.js` (função pura `canonicalLocalUrl`); o `app.js` manda `localhost` para `127.0.0.1`. `vite.config.js` na porta 5010 com `strictPort`.
- **Documentação:** `PORT_INFO.txt` reescrito, `README.md`, `.env.example` (com `VITE_SPOTIFY_CLIENT_ID`), manual `00_Deployment_and_Setup.md`, scripts de teste e `restart_dev.sh` na porta nova.
- **Testes:** 10 novos (`test/utils/localAddress.test.js`, `test/services/spotify/SpotifyAuthSignal.test.js`), vistos falhar antes do conserto. Suíte: 386 passam, as mesmas 28 falhas da linha de base. `vite build` compila.
- **Não conferido:** a prova no navegador (conectar o Spotify e ver o botão mudar; abrir `localhost:5010` e cair em `127.0.0.1`) ficou para o MJRP, porque o painel embutido estava com uma janela de login aberta. Spec, plano e tarefas da F50 ainda em esboço.
- **Login pela Apple:** 403 também no Chrome do MJRP. O retorno do login vai para `mjrp-playlist-generator.firebaseapp.com/__/auth/handler`, então o endereço local não é a causa. Em investigação.

## [2026-11-19 13:41] session — UAT-182 aberta: o botão do Spotify continua «Connect» depois de conectar

Relato do MJRP ao conectar o Spotify em `http://127.0.0.1:5010`. Causa lida no código: a conexão avisa por `spotify-auth-success`, o botão só escuta `spotify-auth-change`, disparado só ao desconectar. Conserto na F50 (ramo `fix/f50-one-local-address`).

## [2026-11-19 13:27] session — documentação da F46 e das pontas da F51: spec, plano e tarefas, `arch.md` seção 18, manual e título da F45

- Commit de documentação à parte do de código (`510a840`), no ramo `fix/f46-albums-load-state`. F46: `spec.md`, `plan.md` e `tasks.md` preenchidos, com o que a F45 e a F51 já tinham entregue dela; `status: In Progress` (faltam o navegador, o merge e o julgamento do MJRP). F51: TASK-09 e TASK-12 fechadas, TASK-15 a 17 acrescentadas, REQ-10 entregue e REQ-11 novo. F45: o título deixa de prometer «só as séries à vista». `arch.md`: seção 18 e três linhas da seção 17 corrigidas. Manual: 06, 08, 09, 12, 16, 17, mapa de arquivos e `regression_checklist`.
- Recusa de trava, por processo e não por defeito, registrada e não contornada: o primeiro commit de documentação foi recusado pelo `commit-msg` porque o `docs/log.md` não ia no commit (a entrada das 13:24 já tinha entrado no commit de código). Esta entrada é a do commit de documentação.
- O `doctor.py` segue vermelho no projeto por causas antigas (links partidos em arquivos de `docs/archive/` e do manual antigo, o sensor de lint e as 28 falhas da linha de base dos testes); o único erro que esta sessão criou, o `## Now` atrasado, foi corrigido.
- Session: claude-code:f46-albums-load-state (aberta pela sessão de consertos do v0)

## [2026-11-19 13:24] session — F46 fechada no código e pontas da F51: ranking salvo reflete na tela, «My Ranking» sobre todas as séries, aviso de álbuns não conferidos, «&amp;» lido limpo, busca das playlists guardadas

- Ramo `fix/f46-albums-load-state`, cortado da `main` local (`23d81d7`). O worktree veio num commit antigo (`c9cf80f`); o ramo foi renomeado e levado à ponta da `main` antes de qualquer mudança.
- **O que da F46 já estava pronto**, conferido no código: o estado por série e a grade desenhada por ele, o aviso «N albums did not load · Try again» e `retryFailed` (F45); a página desenhada inteira e as inscrições desfeitas no começo de cada visita (F51). O observador de visibilidade por série não foi construído e deixou de ser necessário com a paginação.
- **Ranking salvo pelo modal (F46).** `AlbumLoadService.refreshSource(albumId, source)` refaz uma fonte de um álbum; o trabalho de cada álbum passou a ser encadeado, para a fonte lenta em curso não apagar o ranking recém-lido. O modal salva por `onSubmit` e não importa mais o repositório; quem salva é `SeriesController.saveRanking`, por `OwnRankingService`. A tela deixou de mutar o álbum publicado.
- **«My Ranking» sobre todas as séries (F46).** `OwnRankingService` lê a lista de álbuns ranqueados uma vez por pessoa e a guarda em `stores/ownRankings.js`; `models/ownRanking.js` casa ranking e pedido por nome (caixa, acento, pontuação, «&», entidade HTML e nota de edição não contam) e pelo id quando o ranking não tem os nomes; o álbum carregado com ranking casa de forma exata. Limite conhecido: o álbum a que o catálogo deu outro título só casa depois de carregar. Saída exata, não feita porque muda dado gravado: guardar o id do álbum achado em `facts`.
- **O controlador larga a tela que fechou (F46).** `SeriesController` continuava inscrito nas stores entre uma visita e outra e redesenhava a grade de uma tela fechada enquanto a carga seguia. `SeriesView.destroy` chama `detachView`.
- **Aviso de álbuns não conferidos (F51).** Com o filtro por fonte ativo, o paginador diz quantos álbuns ainda não têm `facts`.
- **UAT-180 (F51).** A origem do «&amp;» não foi achada: nenhum caminho do código de hoje escapa texto antes de gravar, e as versões antigas lidas no histórico (a Home de texto, os modais, a edição de série) também não. Consertado pelo que se controla: `models/text.js` desfaz as entidades, `parseAlbumQuery` e `queryKey` passam por ela (o pedido com «&amp;» e o limpo têm a mesma chave; a chave de quem nunca teve entidade não muda), o catálogo é consultado com o texto limpo, e a Home e a edição de série gravam o pedido por uma função só (`toAlbumQuery`). O banco não foi reescrito. Achado junto: três lugares escapavam texto e depois o desenhavam como nó de texto (o título da série no cabeçalho, o modal de ranking), o que mostrava «&amp;» para um «&» gravado certo.
- **UAT-179.** Na tela de playlists guardadas o conserto da barra de filtros não bastava: `SavedPlaylistsView.update` refazia a página inteira a cada letra. A página passa a ser desenhada uma vez. Na Home, por leitura, o campo é desenhado uma vez e só escuta o Enter: não foi achado redesenho a cada tecla; o que havia era o controlador da tela de álbuns desenhando em segundo plano durante a carga, consertado acima. Falta repetir no navegador.
- Testes: 105 novos (serviço de carga 5, casamento de ranking 22, serviço de ranking 10, texto e pedido 12, paginador 19, barra de filtros 9, controlador 15, modal 3, playlists guardadas 3, aptidão 7). Suíte inteira: 337 passam, as mesmas 28 falhas da linha de base; `npx vite build` compila. Um arquivo antigo de `test/e2e/` (`ghost-albums-render`) chama `process.exit` quando não acha navegador e às vezes aparece como «1 error» na suíte; não é desta mudança.
- Ambiente, registrado e não contornado no repositório: `npm install` falhou no worktree ao baixar o Chrome do Puppeteer (pasta de cache partida em `~/.cache/puppeteer`); instalado com `PUPPETEER_SKIP_DOWNLOAD=1`, como a própria mensagem indica. O `package-lock.json` que a instalação alterou foi restaurado.
- Pedidos a quem é dono dos arquivos (F48, outra sessão): `SeriesService.loadFromFirestore` desfazer as entidades do nome da série, para todas as telas; `api/client.js` `generateAlbumId` usar `stableAlbumId` de `models/ownRanking.js` (a regra está escrita duas vezes); `UserRankingRepository.getAllRankings` devolve lista vazia quando a leitura falha, e o filtro não tem como avisar.
- Documentação: `spec.md`, `plan.md` e `tasks.md` da F46 preenchidos; tasks 09 e 12 da F51 fechadas e 15 a 17 acrescentadas; título da F45 corrigido («as séries do topo primeiro»); `arch.md` seção 18; manual 06, 08, 09, 12, 16, 17, mapa de arquivos e `regression_checklist`.
- Falta: a conferência no navegador (sessão de integração), o merge e o julgamento do MJRP. `uat.md` e o `## Now` do `MEMORY.md` ficam para a integração.
- Session: claude-code:f46-albums-load-state (aberta pela sessão de consertos do v0)

## [2026-11-19 13:19] session — F48, commit da documentação

- Commit à parte da documentação descrita na entrada da F48 abaixo: spec, plano e tarefas; `docs/manual/`; `data-model.md`; `arch.md`. Recusa de trava registrada: o gancho `commit-msg` recusou os commits seguintes ao primeiro por faltar entrada de log em cada um; não foi contornado, cada commit ganhou a sua entrada. O `doctor.py` está vermelho (497 erros) por links quebrados antigos em `docs/archive/`, `docs/technical/` e pastas `legacy/` das features, nenhum em arquivo desta entrega; não foi mexido.
- Session: claude-code:f48-album-cache-and-retry (sessão lateral, aberta pela sessão de integração dos consertos do v0)

## [2026-11-19 13:19] session — F48, commit da prateleira sem Firestore (UAT-14, parte)

- Commit à parte do conserto descrito na entrada da F48 abaixo: `SharedAlbumRepository.js`, `SeriesService` gravando por ele, `stores/albums.js` sem Firestore, os dois arquivos mortos removidos, o comentário das regras do Firestore corrigido (só o comentário), e os testes.
- Session: claude-code:f48-album-cache-and-retry (sessão lateral, aberta pela sessão de integração dos consertos do v0)

## [2026-11-19 13:19] session — F48, commit do «Clear Cache» (UAT-177)

- Commit à parte do conserto descrito na entrada da F48 abaixo: `clearAlbumCaches.js`, a ligação em `albumLoading.js` e `app.js`, o rodapé, `CacheManager.clear()` que falha quando o IndexedDB não limpa, e os três arquivos de teste.
- Session: claude-code:f48-album-cache-and-retry (sessão lateral, aberta pela sessão de integração dos consertos do v0)

## [2026-11-19 13:19] session — F48, commit do cache do ranking pessoal (UAT-176)

- Commit à parte do conserto descrito na entrada da F48 logo abaixo: `UserRankingRepository` com a instância do cache, validade de 1 hora e o teste `test/repositories/UserRankingRepository.test.js`.
- Session: claude-code:f48-album-cache-and-retry (sessão lateral, aberta pela sessão de integração dos consertos do v0)

## [2026-11-19 13:17] session — F48: nova tentativa que roda, cache do ranking que age, «Clear Cache» que limpa e a prateleira sem Firestore

- Ramo `fix/f48-album-cache-and-retry`, cortado da `main` local (`23d81d7`), num worktree à parte. Cada conserto teve o teste escrito antes e visto falhar no código antigo (a UAT-175 falhou com o próprio `ReferenceError: queryStr is not defined`).
- UAT-175: `public/js/utils/retry.js` (nova tentativa com recuo exponencial, variação e teto, padrão `DP-23`) e `public/js/api/client.js` (`ApiError` com o status; prazo de 90 s por chamada; `POST /api/generate` só é pedido de novo em falha de rede ou 5xx, nunca em 4xx nem em prazo estourado, porque a rota usa IA paga). `CatalogAdapter` passa a registrar no console o motivo da falha da segunda fonte.
- UAT-176: `UserRankingRepository` usa a instância `cacheManager` (guardava a classe), com validade de 1 hora, guarda também «este álbum não tem ranking» e esquece a entrada ao salvar e ao apagar. A outra metade da issue (regravar cada álbum a cada carga) já tinha saído com a F45.
- UAT-177: `services/albums/clearAlbumCaches.js` (para a carga, limpa o `cacheManager`, remove as chaves `album_cache_v…`), ligada em `albumLoading.js` e entregue ao rodapé por `app.js`. O botão não faz mais `localStorage.clear()`. `CacheManager.clear()` passa a falhar quando o IndexedDB não limpa, e o rodapé diz que não limpou.
- UAT-14 (parte): `repositories/SharedAlbumRepository.js` grava o álbum do «Refetch Metadata» na coleção `albums` sem o ranking pessoal; `stores/albums.js` ficou sem `import` do Firestore (saíram `saveToFirestore`, `loadFromFirestore`, `updateAlbum`); a lista de exceções da função de aptidão caiu de três para dois arquivos. Removidos `views/controllers/AlbumsStateController.js` (morto) e `public/legacy/AlbumsView_DEPRECATED.js` (o único que o importava, sem quem o importe).
- Testes: 39 novos ou refeitos em 8 arquivos; suíte inteira 271 passam, as mesmas 28 falhas da linha de base; `npx vite build` compila. Nada conferido no navegador: é da sessão de integração.
- Documentação: spec, plano e tarefas da F48 preenchidos (`status: In Progress`, `sdd_shape_check` verde); `docs/manual/` (00, 06, 07, 07b, 08, 11, 19, 98, `regression_checklist`); `docs/specs/data-model.md` (o que se grava em `albums`); `docs/specs/arch.md` (seção 17).
- Não feito: o «Refetch Metadata» pela fila da carga (TASK-12 da F48, aberta). Perguntas para o MJRP na spec: se o «Clear Cache» devia apagar também o resto do `localStorage`, e se o prazo de 90 s sem nova tentativa serve.
- Ambiente: `npm install` falhou ao baixar o navegador do Puppeteer; instalado com `PUPPETEER_SKIP_DOWNLOAD=1`. O `package-lock.json` que o `npm` reescreveu foi devolvido ao texto commitado com `_safe.py restore`.
- Session: claude-code:f48-album-cache-and-retry (sessão lateral, aberta pela sessão de integração dos consertos do v0)

## [2026-11-19 13:01] decision — F52 aberta: a busca de álbum por IA do servidor responde 402 em produção (UAT-181)

- O MJRP, sobre o achado do 402 em `POST /api/generate`: «abra uma feature pra arrumarmos isso via google cloud e firebase cli e eu posso entrar no console tb». Issue UAT-181 na Rodada 2 e feature F52 (`lane: fast`, `solution_type: fix`), na v4.0. O diagnóstico começa pelos registros do Cloud Run, só leitura; mudança de chave, de cota ou de cobrança é dele.
- Ele também perguntou «vamos mover para prod o que já foi corrigido?». Conferido: o site publica por `scripts/deploy-prod.sh` (Firebase Hosting; o `firebase` da máquina está logado na conta dele); a `main` compila; a versão no ar é de 2026-01-19. Risco apontado a ele: a chave do app no Spotify (`VITE_SPOTIFY_CLIENT_ID`) vem de um `.env` que não existe nesta máquina, e um build feito aqui sairia sem ela (o bundle no ar a tem). Publicação à espera da resposta dele sobre a chave.
- Session: claude-code:fix-albums-loading-and-cache-d92daf (sessão de consertos do v0, aberta pela orquestradora do harness)

## [2026-11-19 12:43] session — F45, F47 e F51 integradas na main local; UAT-172, UAT-24 e UAT-179 em «fixed», à espera do OK do MJRP

- Trem de merge do harness (`merge_train.py`): preflight limpo depois de commitar o rastro do doctor (`daily-checks/`, como a ferramenta pede); três merges, na ordem das features: `f295316` (F45), `d893d75` (F47), `5268f45` (F51). A trava visual não se aplica ao v0 (não há `info-arch.md` com referência visual aprovada). Nada foi enviado ao remoto: o push é do MJRP, e é ele que publica em produção.
- `docs/specs/uat.md`: UAT-172, UAT-24 e UAT-179 passam a `fixed`, cada uma com o commit, o teste e a medição no navegador. As duas do MJRP (172 e 179) só fecham com o OK dele; a UAT-24 foi aberta por agente com prioridade humana e também espera por ele.
- `MEMORY.md` `## Now` em dia.
- Session: claude-code:fix-albums-loading-and-cache-d92daf (sessão de consertos do v0, aberta pela orquestradora do harness)

## [2026-11-19 12:42] session — spec, plan e tasks das F45, F47 e F51 preenchidos; funções de aptidão em npm test; o arch.md diz o que foi construído

- Passo retroativo das três features, por um agente à parte a partir do log, do código e da evidência: F45 com 10 REQ e 16 tasks fechadas, F47 com 3 e 3, F51 com 10 REQ (o REQ-10, a UAT-180, marcado «não entregue») e 10 tasks fechadas. `sdd_shape_check`, `evidence_folder_check` e `requirements_graph_check` verdes. As três ficam `In Progress`: faltam o julgamento do MJRP, o merge e os pontos abertos listados em cada `tasks.md`.
- Contradições que o agente achou e ficaram escritas nas specs: o título da F45 promete «só as séries à vista» e isso não foi construído (a F51 busca por página); as contagens de teste do log não batiam (corrigidas pelas contagens por arquivo); `behavior.md` ainda descreve a carga e os filtros antigos.
- `test/architecture/albumLoadBoundaries.test.js`: 9 testes que leem os `import` e reprovam quando uma fronteira do desenho é cruzada (a proposta os prometia e só um existia). A lista de exceções do Firestore fora dos repositórios (issue UAT-14) tem três arquivos e só pode encolher.
- `docs/specs/arch.md`, seção 17: tabela «proposto × construído» com o porquê de cada diferença (limites medidos, carga pela edição escolhida, ordem das fatias, o que não foi construído).
- Session: claude-code:fix-albums-loading-and-cache-d92daf (sessão de consertos do v0, aberta pela orquestradora do harness)

## [2026-11-19 12:34] session — manual e modelo de dados em dia com a carga nova, os filtros e a paginação

- Pedido do MJRP: revisar o manual a cada conserto, «corrigindo e atualizando e limpando o que não faz mais sentido». Atualizados em `docs/manual/`: 08 (o controlador sem o laço, a sequência nova da carga, a store de carga, o guardado por pedido, o que `AlbumIdentity` faz de fato), 06 (as duas stores e a projeção), 07 (o que o repositório lê do cache de verdade; `saveAlbumFacts`; a lista inteira de séries), 07b (`TaskQueue`), 09 (a grade pelo estado, o paginador, os filtros que leem a série, o campo de busca), 11 (o que o «Clear Cache» faz e não faz), 12 (`Pager`), 17 (`AlbumLoadService`, `SeriesFactsService`), 19 (o cliente de API é `public/js/api/client.js`; o `api.js` descrito nunca existiu), 32 (o documento da série como o código grava, com `facts`), o índice (nome certo do 06; não há Pinia nem MobX), 01 (idem), o mapa de arquivos (nove nomes de documento corrigidos, quatro arquivos de código que não existem marcados, a seção da v4.0) e o `regression_checklist` (os casos novos da tela de álbuns).
- `docs/specs/data-model.md`: `albumQueries` com `appleMusicId` e `facts`; a lista de séries sem o corte em 20.
- Recusa de processo, registrada e não contornada: o commit do protótipo `design/inception/albums-paging-v1.html` (o que o MJRP viu ao escolher as duas formas de paginação) foi recusado pela trava do espelho do protótipo, que pede o `docs/specs/info-arch.md` e os wireframes da versão em `design/wireframes/`; o v0 não tem nenhum dos dois (notas de conformidade abertas `info-arch` e `wireframes`). O arquivo fica na pasta `design/inception/` da cópia principal, fora do git, até a orquestradora levar ao MJRP.
- Ainda não revisto no manual: os documentos do servidor (02 a 05), mistura e playlists (15, 18, 21), integrações (20, 22), testes (24, que chama de «saudável» uma suíte com 28 falhas) e a dívida técnica (29). Entram quando os consertos dessas áreas forem feitos.
- Session: claude-code:fix-albums-loading-and-cache-d92daf (sessão de consertos do v0, aberta pela orquestradora do harness)

## [2026-11-19 12:06] session — F51: filtros que leem a série, busca que deixa digitar, paginação nas duas formas e os fatos gravados na série

- Ramo `fix/f51-album-filters-search-and-paging`, empilhado sobre o da F47. Peças novas: `models/seriesFilter.js` (os filtros como função pura sobre os pedidos das séries: série, artista, ano, fonte, busca), `models/paging.js` (páginas numeradas e lista que cresce, por série, de 10 a 100), `models/albumFacts.js` e `services/series/SeriesFactsService.js` (o ano e as fontes de cada álbum gravados no pedido, só a diferença, quando a série termina de carregar; `SeriesRepository.saveAlbumFacts` não mexe em `updatedAt`), `components/ui/Pager.js`. `SeriesController` ganhou a visão da página (`getPageView`) e pede ao serviço de carga só as séries da página; a lista de artistas sai das séries; `FilterToolbar` desenha o campo de busca uma vez e atualiza o resto só quando muda (UAT-179, pela causa); a grade desenha inteira a página, sem o truque das três primeiras séries.
- Conferido no navegador com a conta do MJRP: 10 de 45 séries na primeira página, 5 páginas; digitar «robert plant» de uma vez mantém o foco e traz as quatro séries de outras páginas; página 2 sem bloco cinza; a rolagem cresce de 10 em 10; 67 de 217 pedidos ganharam o bloco `facts` depois de três páginas. Evidência: `reports/evidence/F51-album-filters-search-and-paging/`.
- Testes: 56 novos (filtro 14, paginação 7, fatos e serviço 7, e os anteriores); suíte inteira 223 passam, as mesmas 28 falhas da linha de base.
- Achado para o MJRP: `POST /api/generate` em produção responde 402 (Payment Required). A segunda fonte de álbuns, que usa IA paga, está fora do ar; os álbuns que a Apple Music não tem ficam com o aviso de falha.
- Limites conhecidos: o filtro «My Ranking» só enxerga os álbuns carregados (o ranking mora com o usuário, não na série); o filtro por fonte de uma série fica completo depois da primeira carga dela; a Home ainda não foi conferida para a UAT-179; a UAT-180 (`&amp;`) segue aberta.
- Session: claude-code:fix-albums-loading-and-cache-d92daf (sessão de consertos do v0, aberta pela orquestradora do harness)

## [2026-11-19 12:01] decision — paginação da tela de álbuns: as duas formas, por série, de 10 a 100 por página; notas a 4 buscas por vez

- O MJRP viu o protótipo (`design/inception/albums-paging-v1.html`) e decidiu: «ok, o ideal seria poder escolher multiplos de 10 por pagina, 10, 20, 30, 40, 50, ...100» e «opção A e b, séries por página, go for it». Ficam as duas formas (páginas numeradas e rolagem que carrega mais), a unidade é a série, e o tamanho da página vai de 10 a 100, de 10 em 10.
- Notas: o teto da fonte lenta sobe de 2 para 4 buscas simultâneas (`LOAD_LIMITS.slowConcurrency`). Medido com 45 séries: 31 notas em 60 s, contra cerca de 20 com 2; o servidor passa de 5 s para 7 s por busca quando recebe mais de uma. O gargalo é o raspador, sem cache: fica para a fatia do servidor.
- Ramo novo `fix/f51-album-filters-search-and-paging`, empilhado sobre o da F47.
- Session: claude-code:fix-albums-loading-and-cache-d92daf (sessão de consertos do v0, aberta pela orquestradora do harness)

## [2026-11-19 11:57] decision — filtros, busca e paginação da tela de álbuns: os fatos que os filtros leem passam a morar no pedido da série (F51)

- O MJRP perguntou «como ficaria a questao de filtros se a gente utilizasse paginacao nas telas?». Três caminhos apresentados (filtrar só o carregado; carregar tudo ao filtrar por ano ou fonte; guardar ano e fonte junto do pedido). Escolha dele: «vamos fazer a opcao C». E: «a opcao C imagino que tb necessite a revisao de arquitetura para nao virar patch...vamos melhorando a arquitetura do site, refatorando conforme necessario». Sobre séries antigas: «go for it, preenche sozinho na primeira carga». Sobre haver paginação: «vamos er paginacao entao certo?» — sim, por série; a forma (páginas numeradas ou rolagem que carrega mais) ele escolhe sobre um protótipo.
- Desenho na seção 16 da proposta no `docs/specs/arch.md`: o bloco `facts` em cada item de `albumQueries` (ano, fontes, data da conferência), gravado só pelo `SeriesRepository`; um `SeriesFactsService` grava a diferença em lote quando a série termina de carregar; o filtro vira função pura sobre os pedidos; a tela pagina o resultado do filtro; a barra de filtros atualiza em vez de se refazer.
- Regra de trabalho adotada: cada área tocada por um conserto sai com o dono certo, com teste e com checagem automática; refatoração maior é avisada antes; o que muda dado gravado ou tela vai ao MJRP primeiro.
- Issues novas na Rodada 2: UAT-179 (campo de busca perde o foco a cada tecla; relatado pelo MJRP) e UAT-180 (pedido gravado com `&amp;` não é achado no catálogo). Feature F51 registrada.
- Session: claude-code:fix-albums-loading-and-cache-d92daf (sessão de consertos do v0, aberta pela orquestradora do harness)

## [2026-11-19 11:54] session — F47: a lista de séries sem o corte em 20; o MJRP tinha 45 séries e via 20

- O MJRP, olhando a tela: «engraçaod eu nao tenho albuns do robert plant?». Conferido no banco dele, pelo próprio app: 45 séries na conta, 20 na tela, 25 escondidas pelo `limit: 20` de `SeriesService.loadFromFirestore`; quatro delas com Robert Plant. Nada foi perdido, era só leitura. Ele mandou: «go for it, faz a F47 agora».
- Ramo `fix/f47-series-list-without-cut`, empilhado sobre o da F45 (sem a carga nova, 217 álbuns levariam uns 20 minutos). Conserto: `findAll` sem `limit` e sem `orderBy` (o Firestore deixa de fora o documento que não tem o campo ordenado); a ordem por data de atualização é aplicada no cliente, com a série sem data por último. Três testes em `test/services/SeriesService.test.js`, dois falhavam antes.
- A carga de 217 álbuns mostrou três coisas, corrigidas no desenho da F45: (1) as fontes rápidas (ranking pessoal, popularidade guardada) disputavam as vagas da busca no catálogo: ganharam fila própria (`sourceConcurrency: 6`); (2) 196 dos 217 pedidos trazem o `appleMusicId` da edição escolhida, que a carga antiga ignorava: o adaptador agora carrega por ele, numa chamada só, e é a edição que o MJRP escolheu; (3) 32 desses identificadores respondem 404 (edição de outra loja ou retirada): cai na busca por nome na hora, sem esperar.
- Medido, guardado apagado: 45 séries na tela; 57 álbuns aos 5 s, 118 aos 10 s, 207 aos 30 s; tudo resolvido aos 31 s, 213 achados e 4 com aviso de falha. As quatro séries de Robert Plant aparecem. Evidência: `reports/evidence/F47-series-list-without-cut/`.
- Achados a registrar: um pedido gravado com `&amp;` no lugar de `&` («Jimmy Page &amp; Robert Plant - No Quarter») não é achado; o MJRP relatou que o campo de busca não deixa digitar de uma vez («o campo de bucas tem problemas ... acho que ocorre o mesmo na home»); e escolheu a opção C para os filtros com paginação («vamos fazer a opcao C»): guardar ano e fonte junto do pedido, na série.
- `window.albumLoadStore` e `window.albumLoadService` expostos em `app.js`, como as outras stores, para inspeção e teste.
- Session: claude-code:fix-albums-loading-and-cache-d92daf (sessão de consertos do v0, aberta pela orquestradora do harness)

## [2026-11-19 11:41] session — F45 ligada ao app e medida no navegador: os 80 álbuns em 8,5 s (antes, 1 álbum aos 8,5 s e 46 de 80 aos 4 min 40 s)

- Ligação: adaptadores em `public/js/services/albums/adapters/` (catálogo sobre a Apple Music com o servidor como segunda fonte; notas, popularidade e ranking pessoal, cada um devolvendo um álbum novo; guardado por pedido, base + estado por fonte, «vazio» confiável por 1 hora, ranking pessoal nunca guardado), a composição em `services/albums/albumLoading.js` (que também projeta a store de carga na prateleira `stores/albums.js`, com o setter novo `setAlbumsBySeries`), `models/albumQuery.js` (a leitura única de «Artista - Título»: só o primeiro separador divide). `SeriesController` perdeu o laço de carga (647 → 405 linhas): pede ao serviço, reconcilia quando a lista de séries muda, desfaz as inscrições da visita anterior. `SeriesGridRenderer` desenha a série vazia pelo estado derivado (carregando, falhou, oculta) e mostra o aviso «N albums did not load · Try again».
- Saiu da carga, por decisão do agente e revisável pelo MJRP (decisão 1 da proposta, sem resposta dele ainda): a regravação de cada álbum na coleção `albums` do Firestore.
- Medido (guardado apagado, mesma conta, 20 séries, 80 álbuns): 33 álbuns aos 3 s, 50 aos 5 s, os 80 aos 8,5 s; nenhum erro no console; sair para a Home e voltar mantém 20 blocos e 80 álbuns (antes caía de 20 para 15). Evidência: `reports/evidence/F45-albums-load-in-parallel/F45-probe-after-2026-11-19.json` e `F45-desktop-after-2026-11-19.jpg`.
- Achado da primeira tentativa: com 6 buscas simultâneas a Apple Music respondeu 429 e 5 séries mostraram o aviso de falha (o aviso funcionou; captura `F45-desktop-failure-notice-2026-11-19.jpg`). Corrigido no adaptador: 3 por vez, nova tentativa com espera crescente e variação (`DP-23`), e falha da Apple não cai mais na segunda fonte, que usa IA paga (antes caía).
- Testes: 78 novos passam (fila 12, estado 15, store 10, serviço 18, adaptadores 23). Suíte inteira: 189 passam, 28 falham nos mesmos 9 arquivos da linha de base (mais os 8 E2E sem suíte); nenhuma regressão nova.
- Aberto: as notas chegam a 2 buscas por vez (17 de 80 aos 40 s), sem travar a tela; as séries abaixo das 3 primeiras seguem em bloco cinza até entrarem na janela (F46); o «Refetch» ainda corre fora da fila e é adotado pelo serviço depois (F48); `/blend` e o modo edição ainda usam `apiClient.fetchAlbum`.
- Session: claude-code:fix-albums-loading-and-cache-d92daf (sessão de consertos do v0, aberta pela orquestradora do harness)

## [2026-11-19 11:35] session — F45: a store única da carga e o serviço dono da carga, com dublês das fontes (55 testes novos no total)

- `public/js/stores/albumLoad.js`: store pura, única dona de «pedido → álbum e estado», com aviso agrupado por tique e `subscribe` que devolve o `unsubscribe` (10 testes). `public/js/models/albumLoadState.js`: as regras de estado mudaram de `services/albums/` para `models/`, porque a store não pode importar `services/` (função de aptidão da proposta). `public/js/models/cloneAlbum.js`: cópia do álbum e das faixas, para o enriquecimento não mutar o publicado.
- `public/js/services/albums/AlbumLoadService.js`: gerações (só a carga atual escreve), reconciliação a cada abertura, achar separado de enriquecer, fontes em cadeia por álbum (as rápidas primeiro, a de notas por último, na fila lenta de limite 2), `retryFailed`, `stop`, `whenIdle`. Não importa rede, Firestore nem tela: recebe o catálogo, as fontes e o guardado por injeção. 18 testes, entre eles: resultado de carga antiga é descartado; reabrir o mesmo escopo não busca de novo; reconciliar quando a série mudou; «vazio» distinto de «falhou»; falha nunca vai para o guardado; segunda visita sem busca; álbum do catálogo congelado e não mutado; teto da fonte lenta.
- Ainda não ligado ao app: faltam os adaptadores (catálogo, notas, popularidade, ranking, guardado), a projeção para `stores/albums.js`, o controlador e a grade.
- Session: claude-code:fix-albums-loading-and-cache-d92daf (sessão de consertos do v0, aberta pela orquestradora do harness)

## [2026-11-19 11:31] decision — a proposta da carga de álbuns emendada depois das duas críticas (seção 15 do arch.md)

- Segunda crítica (Fable, cortada pelo limite de tempo): `2026-11-19-v0-albums-load-architecture-critique.md`, na pasta de notas. Veredito igual ao da primeira: pode seguir depois dos P0. O que só ela viu: o servidor não distingue «sem nota» de «a busca falhou» (o raspador engole o erro); o teto de 4 buscas simultâneas não foi medido; a chave do guardado tem de ser a do pedido; `clearAll` apaga séries e rankings junto.
- Emendas, decididas pelo agente e revisáveis pelo MJRP: store única dona de «pedido → álbum», com `stores/albums.js` como leitura projetada; guardado por pedido, base ao achar e um registro por fonte; geração em vez de sessão, com reconciliação a cada abertura; fatias revistas (a F45 leva a grade pelo estado derivado; o observador de visibilidade vai para a F46); álbum publicado não é mutado; filtro, busca ou mistura carregam o escopo inteiro; cancelar é descartar; começa em 2 buscas de nota por vez; a distinção «sem nota» × «falhou» pede mudança no servidor, em fatia própria. A tabela «comportamento de hoje → novo dono → fatia» tem 15 linhas.
- Session: claude-code:fix-albums-loading-and-cache-d92daf (sessão de consertos do v0, aberta pela orquestradora do harness)

## [2026-11-19 11:29] review — crítica independente da proposta da carga de álbuns (Opus, 5 min): pode seguir depois de quatro P0; aceitos

- Relatório: `2026-11-19-v0-albums-load-architecture-critique-opus.md`, na pasta de notas das sessões. Veredito: a direção está certa; faltam quatro pontos. Aceitos pelo agente, revisáveis pelo MJRP:
- P0-1, duas fontes da verdade: a store nova passa a ser a única dona de «pedido → álbum»; `stores/albums.js` vira leitura derivada dela, sem a chave `ALL_SERIES_VIEW` e sem a recusa de série inativa.
- P0-2, o guardado: uma chave única; guarda a base do álbum ao achar e cada enriquecimento com o seu estado; ao ler, enfileira só o que falta. Entra já na F45.
- P0-3, nove comportamentos de hoje sem dono no desenho (capa de reserva, reordenação por nota, `seriesIds`, ranking ao reabrir, série nova com a memória cheia, Refetch e injeção fora da fila, adicionar/remover/editar, o corte em 20, quem lê a lista de séries): a proposta ganha a tabela «comportamento de hoje → novo dono → fatia».
- P0-4, a F45 não se sustenta sem parte da F46: a F45 leva o estado derivado da série na grade e um observador por série em todos os layouts; a F46 fica com o aviso de falha, o «tentar de novo» e o fim das inscrições acumuladas.
- P1: o enriquecimento cria um álbum novo e troca a referência (não muta o publicado); com filtro, busca ou Blend ativos a carga é do escopo inteiro; a sessão é a mesma só se a lista de pedidos da série não mudou; a tabela de prazos corrige a segunda fonte (`/api/generate`); três funções de aptidão a mais (mutação, chave única, dono único).
- Regra do MJRP para as críticas: «vamos colocar um limite de tempo para as criticas ... eu sugiro 5 min no max» e «nao quero bloqueios, quero agir mais rápido». Padrão: 5 minutos com escopo fechado; passou, entrega o que conferiu. A primeira crítica (Fable, escopo de dez perguntas) passou do tempo e foi mandada encerrar.
- Código nesta entrada: `public/js/services/albums/loadState.js` (as regras de estado, puras) com 15 testes (`test/services/albums/loadState.test.js`).
- Session: claude-code:fix-albums-loading-and-cache-d92daf (sessão de consertos do v0, aberta pela orquestradora do harness)

## [2026-11-19 11:25] session — F45: a fila da carga (`TaskQueue`) nasce com 12 testes

- Ramo `fix/f45-albums-load-in-parallel`. `public/js/utils/TaskQueue.js`: limite de tarefas ao mesmo tempo, prioridade (por tarefa e por grupo), prazo por tarefa com `AbortSignal`, cancelamento, `onIdle`. Não importa nada do projeto (o teste confere). Erros com nome: `TaskTimeoutError`, `TaskCancelledError`.
- Teste antes do código: `test/utils/TaskQueue.test.js` falhou por falta do módulo e passou depois, 12 de 12. É a primeira peça do desenho da seção «Carga da tela de álbuns — proposta» do `arch.md`; o serviço e o estado esperam a crítica independente, que está rodando.
- Session: claude-code:fix-albums-loading-and-cache-d92daf (sessão de consertos do v0, aberta pela orquestradora do harness)

## [2026-11-19 11:23] decision — proposta de arquitetura da carga da tela de álbuns escrita no arch.md; a crítica roda em paralelo ao código

- A proposta está em `docs/specs/arch.md`, seção «Carga da tela de álbuns — proposta» (profundidade leve): um serviço dono da carga (`AlbumLoadService`), cada carga com identidade e cancelamento (`LoadSession`), fila com limite, prioridade e prazo (`TaskQueue`), portas para o catálogo, as notas, a popularidade, o ranking pessoal e o guardado, achar o álbum separado de enriquecer, estado explícito por álbum numa store pura e estado da série derivado. Três opções comparadas (remendo, este desenho, levar a carga ao servidor); recomendada a segunda. Funções de aptidão em `npm test`. Entrega em fatias: F45, F46, F48 e, por último, os laços próprios de `/blend` e do modo edição.
- Achado ao desenhar: a coleção `albums` do Firestore, regravada a cada carga, não tem leitor no app (`stores/albums.js:267`, `loadFromFirestore`, sem chamador). Vira a decisão 1 do MJRP na proposta (parar de gravar na carga).
- O MJRP, sobre as skills do harness: «note que temos uma serie de skills mjrp- que podem ajudar (mas nao te limitar) nas tarefas» e «nao deixe as skills te limitarem hein». Decidido pelo agente, revisável por ele: a crítica independente (`mjrp-critiquing-architecture`) roda em paralelo, sem segurar o código das peças que ela não muda (a fila e as funções puras de estado); a página visual da proposta só se o MJRP pedir; a ADR sai depois da crítica.
- Session: claude-code:fix-albums-loading-and-cache-d92daf (sessão de consertos do v0, aberta pela orquestradora do harness)

## [2026-11-19 11:20] decision — o MJRP quer correções de arquitetura, não remendos, e o manual revisto junto; a v4.0 ganha a story S-52

- Arquitetura: «me avise quando tiver correcoes arquiteturais pra corrigir os problemas, quero ficar ciente, disso ok? nao quero patches, quer correcoes robustas com padroes de arquitetura conforme principios do harness». A F45 ia começar como remendo (paralelizar a fila e pôr prazo); parou antes de qualquer código. O conserto da carga do `/albums` passa a ser um desenho só, em fatias (F45, F46, F48): um serviço dono da carga, cada carga com identidade, estado explícito por álbum e por série numa fonte só, achar o álbum separado de enriquecer, fila com limite e prazo, Firestore só nos repositórios, cache com uma definição de identidade. Apresentado ao MJRP, que respondeu «go for it». Antes do código: a proposta de arquitetura, a crítica independente e a ADR.
- Manual: «importante, vá revisando toda a documentacao no manual por favor, corrigindo e atualizando e limpando o que não faz mais sentido». Cada conserto atualiza os arquivos de `docs/manual/` da área que tocou; o que o manual descreve e o código não tem (11 arquivos de código citados que não existem, 10 documentos do índice com nome errado ou ausentes, o carregamento concorrente que nunca existiu) é corrigido ou tirado.
- Resposta da orquestradora do harness à dúvida da release só de consertos: não há isenção; a REL-39 ganha a story que os consertos servem, e a feature que corrige issue de outra rodada declara `planned_for:`. Feito: a story S-52 (EP-01, `Prioritized`, `planned_for` REL-39), embutida no `prd.md`, e `planned_for` na F47 e na F49. `product_structure_check.py` e `requirements_graph_check.py` saem verdes; as seis features caem na v4.0.
- Session: claude-code:fix-albums-loading-and-cache-d92daf (sessão de consertos do v0, aberta pela orquestradora do harness)

## [2026-11-19 11:16] session — v4.0 aberta no v0: medição da carga do /albums, sete issues (UAT-172 a 178) e seis features de conserto (F45 a F50)

- Lido antes de escrever: o manual inteiro (`docs/manual/`, 37 arquivos), o caminho de carga do `/albums` no código (controlador, cliente de API, prateleira, grade, cache, tela) e os três relatórios do V1 (o da causa por inteiro; o mapa completo no corpo; os apêndices A a M por seis leitores, cada defeito conferido na linha do código, notas na pasta de notas das sessões: `v0-appendix-*-verified.md`). A «lista de 89 linhas» do V1 é régua de cobertura, não lista de defeitos: os defeitos estão nos apêndices e no `uat.md`.
- Ambiente de prova: app local na porta 5010 (a 5000 é do Receptor AirPlay do macOS) com `/api` repassado ao servidor de produção, sem segredo no disco; Firestore de produção (`mjrp-playlist-generator`, o projeto que vale em tempo de execução); login feito pelo MJRP no painel. Arquivos locais fora do git: `vite.config.local.js`, `.claude/launch.json` (no worktree da sessão).
- Medido no navegador, cache vazio, 20 séries e 80 álbuns: 1º álbum aos 8,5 s, depois 1 a cada 5–6 s; aos 48 s, 3 séries e 17 blocos cinza; aos 4 min 40 s, 46 de 80. O tempo vai em `POST /api/enrich-album` (média 4,9 s por álbum, em fila); a Apple Music responde em 0,4 s. Sair e voltar no meio da carga: de 20 blocos para 15 em 10 s. Evidência em `reports/evidence/F45-albums-load-in-parallel/` e `reports/evidence/F46-albums-load-state/`.
- Linha de base dos testes (`npx vitest run`, rodado pela primeira vez): 111 passam, 28 falham em 9 arquivos; outros 8 arquivos de `test/e2e/` entram no padrão do Vitest e acusam «No test suite found». «Sem regressão nova» mede-se contra isso.
- Registrado: `^REL-39` «v4.0 · Carregamento e estabilidade» no `ROADMAP.md`; «Rodada 2 — v4.0» no `docs/specs/uat.md` com UAT-172 (carga lenta, do MJRP), 173 (séries em bloco cinza ou que somem), 174 (álbum que falha sem aviso), 175 (nova tentativa que nunca roda: `api/client.js:202`, `:225`; achado novo, o relatório do V1 dizia o contrário), 176 (leituras e gravações a cada visita), 177 («Clear Cache» não limpa), 178 (localhost e 127.0.0.1, do MJRP); features F45 a F50 geradas pelo `new_feature.py` do harness (`lane: fast`, `solution_type: fix`), em esboço com o resumo e o problema escritos. A F47 corrige a UAT-24 e a F49 a UAT-06, da Rodada 1.
- Pendente de resposta da orquestradora do harness: o `product_structure_check.py` acusa a REL-39 «sem nenhuma story que conte» (release só de consertos), e a F47 e a F49 caem na REL-38 por corrigirem issues da Rodada 1.
- Session: claude-code:fix-albums-loading-and-cache-d92daf (sessão de consertos do v0, aberta pela orquestradora do harness)

## [2026-11-19 11:16] decision — respostas do MJRP às perguntas de produto da carga do /albums e ao ambiente de prova

- Limite de 20 séries (UAT-24): «nunca determinei que me lembre limite de series, logo, acidente.» O corte sai (F47).
- Série com álbuns que falharam: «aviso para series que falharam» (F46).
- Carregar todas as séries ou só as visíveis: «carrega com lazy loading sugiro» (F45).
- Ambiente: «Pode testar em producao, só eu uso a app». Sobre o conserto do servidor só se provar publicando: «concordo com o conserto».
- Endereço local: «temos problemas de usar localhost e 127.0.0.1 um funciona para spotify e outra pra apple, isso é algo que gostaria de arrumar tb» (UAT-178, F50).
- Board: o MJRP pediu documentar tudo no Control Center do harness, no projeto do v0, numa versão nova: «um v4.0». Nome dado pelo agente, revisável por ele: «v4.0 · Carregamento e estabilidade».
- Dúvida de harness vai para o agente mestre do harness: «na dúvida sobre o harness pergunte para o [Master Harness Agent]».
- Session: claude-code:fix-albums-loading-and-cache-d92daf (sessão de consertos do v0, aberta pela orquestradora do harness)

## [2026-11-19 11:16] decision — o MJRP manda consertar o v0 pela via rápida, sem ficar preso ao processo; cai a trava «não alterar código do v0»

- Palavras do MJRP, repassadas pela orquestradora do harness: «resolver todos os problemas do album blender no projeto filho V0, começando pelos mais graves, tudo pelo fast lane, todavia nao ficando bloqueado pelo processo, apenas seeguindo para documentar o que está sendo feito, mas o objetivo é arrumar e testar no browser que está arrumado».
- O que muda: o `MEMORY.md` dizia «Não alterar, apagar nem mover código do v0 (em produção)». A partir deste pedido o código do v0 é consertado, um ramo por conserto (`fix/fNN-<slug>` ou `claude/fNN-<slug>`), cada feature registrada na `main` antes do ramo, com `lane: fast` e `solution_type: fix`. O trabalho não espera a «Priorizada» nem as perguntas abertas do conform; a documentação vem junto, como registro do que foi feito (o passo retroativo antes do fecho).
- O que não muda: push, `--no-verify`, carimbos e aceite são do MJRP. Uma trava de commit que recusar por processo, e não por defeito, é registrada e levada à orquestradora; não é contornada.
- Antes de começar, o MJRP pediu o alinhamento: rodar a `mjrp-pdlc-onboarding`, ler o manual a partir do índice, comparar com o código, depois com os relatórios do V1, e reportar o lido e o não lido. Sobre os apêndices do mapa: «acredite verificando no codigo e no browser».
- Session: claude-code:fix-albums-loading-and-cache-d92daf (sessão de consertos do v0, aberta pela orquestradora do harness)

## [2026-10-31 00:40] session — as versões do produto com o nome no formato do roadmap (UAT-434 do harness)

- Os 33 nomes das versões no `ROADMAP.md` saem de «Versão do produto v1.5 (sem tag)» para «v1.5 · v1.5 Refactor» (o número, depois o tema): o Control Center separa o número do nome por « · », e sem isso o rótulo quebrava letra a letra. A rodada do `uat.md` passa a «Rodada 1 — v3.20.0» (a tela liga a rodada à versão pelo começo do nome). Só o texto mudou: os ids (`^REL-06` a `^REL-38`), as versões (`version::`) e os vínculos ficam como estavam. Decidido pelo agente, revisável pelo MJRP; o importador do harness passa a gravar assim.
- Session: f135-versions-timeline

## [2026-10-30 23:53] decision — o histórico do v0 gravado pelas sprints: 26 features, 31 sprints, 33 versões do produto (a F128 e a F136 do harness)

- O MJRP aprovou o de-para refeito sobre os originais (as pastas SDD de cada sprint, a Product Vision de dez/2025, o roadmap antigo, o CHANGELOG) às 22:15 de 2026-10-30 e autorizou a gravação. Gravado pelo `legacy_history_import.py` do harness, a partir do registro `docs/specs/board-mapping.json` (`board_mapping@1`), depois do `--refresh-kernel`: **26 features** F19–F44 (uma por pasta SDD de sprint, com as 156 funcionalidades e os 160 arquivos SDD originais em `legacy/`), **31 sprints** em `docs/specs/groupings/sprints/`, **33 versões do produto** REL-06 a REL-38 no `ROADMAP.md` (a versão do app em `version::`), **142 issues** do `DEBUG_LOG` no `uat.md` e o **EP-09** (achar o álbum certo no catálogo oficial, serve o OUT-03). Foi para `_archive/october-reconstruction/` o que o MJRP descartou: as F01–F18, as 39 stories de outubro e as REL-01..05. O `docs/specs/board.json` e o contrato (`groupings: [release, sprint]`) foram escritos.
- Decidido pelo agente, revisável pelo MJRP: os ids seguem depois do maior que o projeto já teve; cada feature mora na última versão em que saiu; o EP-09 serve o OUT-03; o OK do orquestrador nas 226 linhas mecânicas é da sessão da F128, que não escreveu a proposta.
- Os juízes na v0, todos com exit 0: `board_mapping_check.py`, `requirements_graph_check.py`, `product_structure_check.py`, `feature_history_check.py`, `uat_tracks_check.py`. As notas CM-0086, CM-0088, CM-0089, CM-0092, CM-0093 e CM-0094 passam e entram em `conformance.applied`. Ponto de volta: a tag `v0-before-history-import` (o git antes da gravação). Seguem abertas, do MJRP: as notas de tela (`info-arch`, `wireframes`, `design-system`, `visual-sensor`), a `project-palette` e a auditoria de conteúdo. O `doctor` da v0 segue vermelho nos links das docs antigas (I3) e, desde esta gravação, nos links relativos dos arquivos SDD copiados para `legacy/`: achado para o harness.
- Session: f136-configuring-boards (a sessão de página do harness)

## [2026-10-30 18:25] decision — o de-para do histórico do v0 é refeito pela F136 do harness; o de outubro foi descartado pelo MJRP

- Recado da integradora do harness ao fechar o cascade: o MJRP descartou hoje o de-para de outubro (as stories e as features de histórico montadas no conform: S-xx, F01 a F18) e a sessão da F136 do harness (a skill `mjrp-configuring-boards`) o refaz a partir dos requisitos originais; só os épicos EP-01 a EP-08 se reaproveitam. Quem pegar as perguntas da auditoria (P-01 a Visão, P-33 a paleta e as demais) parte daí: perguntas sobre stories e features de histórico podem mudar com o de-para novo.
- Session: cascade-children-orchestrator

## [2026-10-30 18:19] session — fechamento do cascade nesta pasta: releitura da juíza passou; o resto é do MJRP; sessões arquivadas

- A releitura da juíza B passou (`b7955c5`): os 2 P0, as 7 perguntas evitáveis, as issues H10 e S8 e os 5 `delivered_by` fechados. O conform segue aberto no que depende do MJRP: as perguntas da auditoria (P-01 a Visão — a regra «uma frase» caiu no harness pela F126 —, P-33 a paleta, e as demais) e os itens de tela (`info-arch`, `wireframes`, `design-system`) que dependem delas. Código intocado, sem push. As sessões do cascade (executora e juíza) foram arquivadas a pedido do MJRP; nada sem commit, nenhuma vaga ativa.
- Session: cascade-children-orchestrator

## [2026-10-29 18:59] review — releitura da juíza B depois da rodada de correção do v0

A juíza B releu só o que falhou no julgamento de 2026-10-28, em `reports/audits/2026-10-28-mjrpalbumblender-v0-conformance-audit.md`: os dois P0 (a evidência da F04 e a história S-04), as sete perguntas evitáveis e a regra dobrada (P-36), as issues de H10 e S8 (UAT-26 e UAT-27) e os cinco `delivered_by` fracos. Cada um está fechado no relatório, com o arquivo e a linha que o mostram; os quatro itens de tela sem arquivo seguem abertos de propósito (dependem do MJRP e da economia até 30/10). O veredito do relatório passa a «conforme, com pontos fracos»; o conform continua aberto. Nenhum código tocado, nenhum push, nenhuma válvula do MJRP.

## [2026-10-29 18:55] session — conform do v0 não fechado: rodada de correção da juíza B feita, aguardando releitura

A sessão A terminou a rodada de correção pedida pela orquestradora depois do «não conforme» da juíza B (`f8000df`): prova do F04 (P0), histórias aceitas com defeito aberto (P0 da S-04), sete perguntas evitáveis decididas pelo agente, UAT-26 a UAT-29, `delivered_by` das cinco histórias refeito e itens de tela mantidos abertos pelas regras (economia até 2026-10-30 e sensor visual no fechado). Detalhe nas entradas de 2026-10-29 18:54, 18:55 e 18:55 deste log. O conform segue **não fechado**: 17 notas e 7 lacunas (tela, paleta e a auditoria de conteúdo), e o relatório da juíza ainda lista as perguntas que o agente decidiu até ela reler.

## [2026-10-29 18:55] decision — sete perguntas evitáveis decididas pelo agente; issues UAT-26 a UAT-29 e ADR-0015 normalizada — decidido pelo agente, revisável pelo MJRP

Rodada de correção da juíza B: sete perguntas do rascunho eram evitáveis (classe a) e uma era também regra dobrada; o agente decide e tira da lista ao MJRP.
- [revisável] H10 e S8, as duas coisas do mapa sem issue, viraram UAT-26 (colar texto vazio na Home chama `toast.warn`, que o `Toast` não tem — `HomeController.js:132`; uma lista sem hífen NÃO o chama, mostra `toast.error`) e UAT-27 (o botão «Create Series» do estado vazio faz `location.hash = '/home'` e o roteador lê só o `pathname` — `SavedPlaylistsView.js:249`, `router.js:83-88`), na trilha do agente.
- P-29 (token do Spotify no `localStorage`): `PRINCIPLES.md` §I.14 só admite credencial no cliente com o BYOK aprovado na constituição e a constituição não o aprova; regra antes do código: é defeito de código, issue UAT-28 (`SpotifyAuthService.js:179-182`), sem emenda da constituição (essa é do MJRP).
- P-30 (exceção para o P0 VT-06): `PRINCIPLES.md` §I.3 manda e não há exceção aprovada; o código é o defeito (UAT-14). Sem pergunta.
- P-32 (ADR-0015 `APPROVED`): o cabeçalho passou a `Accepted (registro original de 2026-01-10: APPROVED)`; é normalização do vocabulário de um registro já aprovado em 2026-01-10, não aceite novo.
- P-26 (ADR-0018 `Proposed`): o aceite é da via técnica (tech lead), não do MJRP; a ADR fica `Proposed` e o aceite técnico fica pendente de quem aceita; o agente não aceita ADR por conta própria.
- P-34 (quando entram os itens de tela): a regra responde — economia até 2026-10-30 (decisão do MJRP repassada pela orquestradora no pedido de 2026-10-28) e «o sensor visual não roda no fechado em produção» (regra do MJRP de 2026-10-18); os itens `info-arch`, `info-arch-sections`, `wireframes`, `design-system` e `visual-sensor` ficam abertos e não são criados agora. Resta ao MJRP só a válvula de dispensar de vez, que é dele.
- P-35 (`delivered_by` fraco): resolvida no git (entrada de 2026-10-29 18:55).
- P-36 (tasks fechadas sem `rounds::`, e a recomendação «deixar» dobrava a regra): a regra vale (`loop.py:194` reprova task fechada sem `rounds::`); a pendência virou UAT-29 e o parecer ao harness `reports/harness-feedback/2026-10-29-mjrpalbumblender-v0-loop-rounds-no-legacy-exemption.md`; nenhum número foi inventado.
- Também: o agente R perguntou se o aceite por histórico continua valendo nas histórias com defeito aberto; a regra do MJRP de 2026-10-18 responde (o fechado em produção antes do contrato nasce aceito e não é re-julgado), então não é pergunta.

## [2026-10-29 18:55] decision — histórias aceitas com defeito aberto apontam as issues; delivered_by fraco refeito no git — decidido pelo agente, revisável pelo MJRP

Rodada de correção da juíza B, P0 da S-04 e `delivered_by` fraco (`mjrp-writing-reqs`; ordem de serviço nos arquivos dos juízes de requisitos e de SDD).
- O grafo NÃO tem campo para «aceita com issue aberta» (`violates::` só existe em spec de feature Fix, regra `fix_nfr_import`; não há `known_issues`): o sensor fica verde sem ler o corpo. Sem tirar o aceite histórico (regra do MJRP de 2026-10-18), a S-04 (UAT-24 e UAT-06), a S-37 e a S-38 (UAT-12), a S-15 (UAT-02, UAT-13), a S-12 (UAT-08) e a S-24 (UAT-09) ganharam no corpo uma linha «Defeito aberto hoje» com o link `[[uat#^UAT-nn]]`; os ponteiros «o defeito está em outra story», que não existe, saíram. Parecer ao harness sobre a aresta que falta: `reports/harness-feedback/2026-10-29-mjrpalbumblender-v0-accepted-story-open-issue-edge.md`.
- [revisável] As cinco histórias de `delivered_by` fraco acharam commit real anterior ao contrato (`merge-base --is-ancestor 54fd54c`) e nenhum aceite por histórico foi retirado nem criado: S-30 `9ebed2b`, `11747c3`; S-31 `b9530f1`, `29b3f5e`; S-32 `29b3f5e`; S-34 `2093d63`, `cd7dff4`; S-38 `6eb6682`, `b85f473`, `edc38ee`. Os commits `6d79577` (só documentos e testes) e `2f980d0` (só configuração) saíram como entrega; as tasks de F04, F07 e F18 e as tabelas de `reports/evidence/` foram refeitas contra os commits novos. S-30 e S-31 agora datam de dezembro de 2025 a janeiro de 2026 e estão em REL-05: a coerência da release é do MJRP e não foi mexida.
- [revisável] `behavior.md`: ressalvas de UAT-01 («Excluir» do inventário), UAT-09 («Open in Spotify» no modo separado) e S8 (UAT-27); o cabeçalho diz que o que não funciona virou issue de UAT; 46 caminhos de código errados corrigidos em `behavior.md` e em 9 nós, só quando o nome do arquivo é único em `git ls-files`.

## [2026-10-29 18:54] decision — prova do F04 corrigida: o teste não cobre a migração real do visitante — decidido pelo agente, revisável pelo MJRP

Rodada de correção da juíza B, achado P0 da prova do F04 (ordem de serviço: `reports/audits/2026-10-28-mjrpalbumblender-v0-content-mjrp-ensuring-quality.md`). `reports/evidence/F04/evidence.md` dava a migração do visitante para a conta como coberta por `DataSyncService.test.js` e `UserSyncService.test.js`; esses testes recebem `'guest'` à mão e a UAT-12 diz que a migração real não acontece. A evidência agora diz o que o teste prova (a função, com a entrada montada à mão) e o que não prova (o fluxo real), aponta a UAT-12, e o `spec.md`, o `tasks.md` e o `plan.md` do F04 ganharam a mesma ressalva só nas frases. Nenhum teste foi executado (falta `npm ci`); nas 18 evidências «Testes automatizados que cobrem» virou «que existem… não foram executados nesta passagem».
[revisável] O teste do F01 REQ-04 (`ConsolidatedRankingView.test.js:4,14`) importa `stores/series.js`, que não existe: a evidência diz que ele não conta como prova. O teste do F13 REQ-01 é script Puppeteer fora do vitest — dito na evidência. Deriva de `mjrp-ensuring-quality` («a aresta não é a prova»).
[revisável] Caminhos de código das linhas «Onde mora» dos planos (F02, F03, F04, F05, F07, F10, F12, F13) corrigidos para o arquivo real quando o nome é único em `git ls-files`.


## [2026-10-28 13:17] review — julgamento independente do v0 pela juíza B: relatório entregue

A juíza B (sessão separada da executora) auditou o conform: sete juízes em Sonnet, um por skill juíza, e o relatório principal `reports/audits/2026-10-28-mjrpalbumblender-v0-conformance-audit.md` (os arquivos dos juízes ao lado). Veredito **não conforme**: 2 P0 de conteúdo abertos (a evidência da F04 contra a UAT-12; a S-04 aceita sem ressalva contra a UAT-24 e a UAT-06), 7 perguntas evitáveis e 1 regra dobrada. `conformance_check.py … --pending --gaps` (do harness): 7 lacunas, 17 notas pendentes (tela, paleta e `content-audit`). Conferido: nenhum arquivo de código alterado, apagado ou movido; nenhum push (`origin/main` em `c9cf80f`); nenhuma válvula do MJRP. O conform segue aberto: a rodada de correção é da executora, com os achados dos juízes como ordem de serviço.

## [2026-10-28 13:03] decision — notas de uat, trilha da feature e pasta de evidência registradas — decidido pelo agente, revisável pelo MJRP

Com `docs/specs/uat.md` e as 18 features, entraram na fila e passam as notas dos itens `uat` (CM-0001, CM-0081 → uat@3), `feature-track` (CM-0004, CM-0083 → feature-track@2) e `evidence-folder` (CM-0005, CM-0026, CM-0068, CM-0080 → evidence-folder@4): `conformance_check.py --check-note` passa nas oito. Registradas sem rodada (o trabalho já está feito pelos pacotes D1 e D2). Com isso o `--pending` fica em 17 notas, todas de tela, paleta e auditoria de conteúdo; a carência dos itens de tela agora vai até 2026-11-27 (o refresh do kernel renovou o `received`).

## [2026-10-28 13:03] session — conform do v0 não fechado: sessão A parou de novo, com features e issues de UAT no repositório

Segunda parada da sessão A (depois do recado da orquestradora de 2026-10-28 sobre features por release e issues de UAT). Acrescentado desde a primeira parada: 18 features Done (F01..F18), 25 issues de UAT na trilha do agente (`docs/specs/uat.md`, 4 delas subidas à trilha do MJRP por segurança ou decisão) e a saída de 12 histórias `Backlog` do Board. O conform segue **não fechado**: 17 notas e 7 lacunas abertas (tela, paleta, auditoria de conteúdo), dentro da carência; 37 perguntas ao MJRP (9 de classe b, 28 de classe c) esperam resposta em `v0-conform-perguntas-ao-mjrp.md` (pasta de notas das sessões laterais). `requirements_graph_check.py`, `product_structure_check.py`, `feature_history_check.py`, `record_shapes_check.py` e `evidence_folder_check.py` verdes (rodados nesta sessão).

## [2026-10-28 13:02] decision — features de histórico do v0: 18 features Done por release, cada história importada por uma — decidido pelo agente, revisável pelo MJRP

Nota CM-0074 (item `release-features`) e o pedido do MJRP via orquestradora de 2026-10-28 (features Done por release; cada história Done importada por exatamente uma feature), pelo pacote D1 (`mjrp-specifying-sdd-artifacts`, regra de histórico legado da bootstrap). 18 features `Done` em `docs/specs/features/F01..F18-*/` (`spec.md`, `plan.md`, `tasks.md`) e 18 `reports/evidence/Fxx/evidence.md`: REL-01 F01..F03, REL-02 F04..F07, REL-03 F08..F11, REL-04 F12..F14, REL-05 F15..F18. As 39 histórias Done estão cada uma importada por exatamente uma feature (conferido por script); nenhuma feature cruza release; nenhuma tem `accepted_in` (o aceite por histórico fica nas histórias); `feature_history_check.py`, `requirements_graph_check.py`, `record_shapes_check.py` e `evidence_folder_check.py` verdes, sem sinal de tamanho.
[revisável] Seis features de uma história só (F03, F08, F10, F14, F15, F16): cada uma é fatia vertical com valor próprio — deriva de `legacy-history.md` e `feature-size.md`.
[revisável] `verified_by` cita o teste existente quando o nome casa com o requisito; senão diz «sem teste automatizado próprio» com o commit e o `evidence.md`. Os testes não foram executados (falta `node_modules`) e o `evidence.md` diz isso. `Prototype Parity` = «não se aplica» pela regra do MJRP de 2026-10-18.
Dúvidas que viraram pergunta ao MJRP: `delivered_by` fraco em S-30, S-31, S-32, S-34 e S-38 (commits que só mexem em documentos ou configuração; o código do celular está em 29b3f5e); tasks fechadas sem `rounds::` (o `loop.py --check-tasks` as reprovaria; nada o roda hoje); a troca «flavor → recipe» (Sprint 17.9, ADR-0015) não está em nenhuma história Done.

## [2026-10-28 12:58] decision — issues de UAT do v0: o que não funciona vira issue na trilha do agente — decidido pelo agente, revisável pelo MJRP

Decisão do MJRP (via orquestradora, 2026-10-28): o que o mapa do V1 mostra que não funciona vira ISSUE DE UAT na trilha do agente, não «não entregue». Executado pelo pacote D2 (`mjrp-specifying-sdd-artifacts`); esta entrada corrige a de 12:09, que dizia que S-40..S-54 viraram histórias `Backlog`.

- `docs/specs/uat.md` (novo) tem 25 issues em uma rodada (`Rodada 1 — R5`), todas abertas por `agente`, com o campo «OK do humano» vazio: UAT-01..UAT-13 são os defeitos de capacidades entregues (excluir álbum da coleção, desfazer/refazer sem botão, excluir playlist antes de guardar, título da playlist que não fica, playlists perdidas ao recarregar, «carregar mais» sem efeito, menu de mistura sem a série, modo descoberta sem efeito, «Open in Spotify» no modo separado, telas de ranking sem link, tela de migração sem caminho, migração do visitante que não roda, ações só no hover no celular); UAT-14..UAT-25 são a dívida técnica da crítica de arquitetura, cada uma com `violates::`. Cada linha citada foi conferida no código pelo agente.
- As histórias S-40..S-48 e S-52..S-54 saíram do Board (12 arquivos; `_safe.py retire` recusou arquivo versionado, então foram movidas para `_backups/` com o carimbo do retire e a remoção entra neste commit) e os 12 embeds saíram do PRD. S-49, S-50 e S-51 (séries de artista, gênero e faixas soltas, «em breve» de verdade) continuam `Backlog`.
- [revisável] UAT-15, UAT-16 e UAT-17 (segurança) e UAT-24 (decidir o limite de 20 séries) sobem à trilha do MJRP com `prioridade: humano — …`: o `uat_tracks_check.py` e a skill mandam subir o que é segurança ou pede decisão, e revogar o token só o dono da conta faz; as outras 21 ficam na trilha do agente. Deriva de `uat_tracks_check.py`.
- [revisável] Uma rodada só, em R5, porque o check exige release na rodada. Gravidade pelo guia de `bug-reports.md` da `mjrp-ensuring-quality`; a das issues de arquitetura é a da própria crítica.
- Do `docs/debug/DEBUG_LOG.md` (170 linhas de `Status`, 138 resolvidas) nenhuma issue nova: as 32 restantes ou já estão cobertas (#146, #8, #7), ou foram resolvidas no código com o status desatualizado, ou citam arquivo que não existe mais, ou são pedido de funcionalidade; #45 e #143 não se confirmam sem rodar o código (falta `node_modules`).
- Ficaram fora pelo teto de 12 da dívida: coleções globais sem dono, `_schemaVersion`, «flavor» no código, arquivos acima de 200 linhas, retentativa sem jitter, `AuthService` duplicado (segundo lote possível).

## [2026-10-28 12:39] session — conform do v0 não fechado: a sessão A parou; notas aplicadas, abertas e achados

**Resumo.** Sessão A (executora) do bootstrap e do conform do v0 (brownfield, em produção), a pedido da orquestradora e por decisão do MJRP de 2026-10-28. Código do v0 intocado; nenhum push; todos os commits são locais na `main`.

**Aplicadas (registradas em `conformance.applied`, cada uma com `--check-note` passando):** vision (CM-0029, 0047), roadmap (0002, 0017, 0025, 0041, 0045), releases (0003, 0046, 0078), prd (0051, 0077), constitution (0030, 0048), arch (0032, 0053, 0072), tech-stack (0071), data-model (0033, 0054), adr-names (0012, 0024, 0076, 0085), arch-critique (0011), behavior (0031, 0049), requirement-nodes (0037, 0067), product-structure (0019, 0020, 0021, 0022, 0027, 0028, 0058, 0069, 0079, 0082), release-features (0074), contract-screen (0006), report-names (0016, 0043, 0059, 0060, 0065), english-names (0013), record-shapes (0034, 0044) e memory-layer (0035, 0062).
**Abertas:** tela — visual-sensor (0007, 0023), info-arch (0008), wireframes (0009), design-system (0010, 0040, 0061, 0064, 0075), info-arch-sections (0038): a regra de economia até 2026-10-30 (sem wireframe nem protótipo) e a regra do MJRP de 2026-10-18 (sensor visual não roda no fechado em produção) as deixam para depois; destrava com a decisão do MJRP (P-34); project-palette (0018, 0055): escolha do MJRP (P-33); content-audit (0052, 0057, 0063, 0066, 0073): é a auditoria da sessão B, juíza separada.

[revisável] CM-0074 (`release-features`) registrada sem criar features de histórico: `feature_history_check.py` fica verde e o v0 não tem pasta de marcos legados; features por release seriam escolha do MJRP.
[revisável] `screen:` do contrato é `public/` (o valor do modelo, `web/src/`, não existe no v0). Isso fez os itens de tela passarem a se aplicar.
[revisável] `new_project.py --refresh-kernel` rodou no fim (o harness avançou durante a sessão) e fez um commit próprio; `_backups/` entrou no `.gitignore` do v0 porque a regra da pasta diz que ela não é versionada.

**Achados registrados e não corrigidos (código intocado):** crítica de arquitetura (1 P0 de código — SDK do Firestore fora dos adaptadores —, 11 P1, 5 P2) em `reports/audits/2026-10-28-mjrpalbumblender-v0-architecture-audit.md`; primeiro `doctor.py` completo: 327 links quebrados em documentos legados e os três sensores do contrato sem `node_modules` (`npm ci` destrava); parecer ao harness em `reports/harness-feedback/`.
**Próxima sessão.** A sessão B (juíza independente) audita o conteúdo; as 34 perguntas ao MJRP estão em `side-session-notes/local_8c6b8fce-…/v0-conform-perguntas-ao-mjrp.md` e viram a seção de perguntas do relatório de auditoria. Depois: rodada de correção e as notas abertas.
**Dados.** 9 commits do scaffold (o `new_project.py` os fez) + 16 do conform (com este); 51 notas aplicadas, 17 pendentes; `requirements_graph_check` e `product_structure_check` verdes; 39 aceites por histórico (regra do MJRP de 2026-10-18).
Session: local_a-executora-v0-conform

## [2026-10-28 12:34] review — crítica independente da arquitetura do v0: recorte em ordem (1 P0 de código, documentos corrigidos)

Nota CM-0011 (item `arch-critique`, arch-critique@1) pela `mjrp-critiquing-architecture`, em agente separado de quem escreveu os documentos. Relatório: `reports/audits/2026-10-28-mjrpalbumblender-v0-architecture-audit.md` (primeira passada 12:19: P0 3 · P1 10 · P2 5; segunda passada 12:31, depois da correção dos documentos: P0 1 · P1 11 · P2 5 · higiene 4; veredito «recorte em ordem»). `--check-note CM-0011` passa; `report_types_check.py` verde.
O P0 que resta (VT-06: o SDK do Firestore importado fora dos adaptadores — `PlaylistsService.js:17`, `stores/albums.js:9`, `SaveAllView.js:5-6`) é defeito de CÓDIGO, não de documento: o documento já diz a verdade e aponta o conserto; a regra (ADR-0017, `PRINCIPLES.md` §I.3) vale e o código fica como item de conserto aberto (`violates::`), sem emenda — o v0 está em produção e o código não é alterado neste conform.
[revisável] Nota de higiene do juiz aplicada: a constituição agora diz que o `localStorage` só passa pelo `StorageService` em `PlaylistsService` e `SeriesService`; o espelho do Spec Kit foi regenerado da fonte.
Decisões do humano levantadas pela crítica (vão como perguntas): quem escreve em `/albums` e `spotify_enrichment`; teto de 20 séries; alcance do §I.14 para o token do Spotify no `localStorage`; aceite da ADR-0018; aprovação do `tech-stack.md`; exceção para o P0 (o juiz recomenda não).

## [2026-10-28 12:33] review — doctor completo do v0: espelho da constituição regenerado; links legados e dependências não instaladas ficam registrados

O doctor (I5) reprovava `.specify/memory/constitution.md`: era uma segunda constituição escrita, sem o marcador «GERADO de docs/specs/constitution.md» (PRINCIPLES.md, Parte III: uma escrita e uma gerada). [revisável] Regenerada a partir de `docs/specs/constitution.md` com o marcador; a cópia anterior ficou em `_backups/specify-memory-constitution.md.20261028` — deriva de PRINCIPLES.md Parte III e `_doctor_kernel.py` (`i5_constitution_generated`). É documento de configuração do Spec Kit, não código do produto. Depois da regeneração o doctor diz «constitution: a cópia do SpecKit é gerada e bate com a fonte».
Também reportado e não corrigido (primeiro `doctor.py` completo do v0): (1) 327 erros I3 de link quebrado em documentos legados (`docs/archive` 211, `docs/manual` 69, `docs/technical/specs/archive` 33, `docs/debug` 7, outros) — dívida de documentação antiga do v0, dono: MJRP/sessão de docs, destrava com uma rodada de `mjrp-syncing-docs`; (2) A1: os três sensores do contrato (`npm run lint`, `npm test -- --run`, `npm run build`) «não executam» porque `node_modules` não existe — destrava com `npm ci` (instalação de dependências, não feita nesta sessão).

## [2026-10-28 12:32] decision — tela declarada e nomes de relatório: notas registradas — decidido pelo agente, revisável pelo MJRP

Notas CM-0006 (item `contract-screen`) e CM-0016, 0043, 0059, 0060, 0065 (item `report-names`, report-names@5); `--check-note` passa nas seis (as três do meio com o aviso de nome do parecer ao harness registrado como pergunta em `conformance.asked`).

`screen: [public/]` já estava no contrato (commit 55dd329). O aviso que restou do `report_types_check.py` é o do nome do parecer em `reports/harness-feedback/`: o `project_slug` do harness não aceita `_` na pasta do projeto (defeito do harness, não do v0); o parecer já está em `reports/harness-feedback/` e a pergunta/aviso ficou em `conformance.asked` com a hora da entrada do log de 12:10.

## [2026-10-28 12:32] decision — documentos de arquitetura corrigidos após a crítica independente — decidido pelo agente, revisável pelo MJRP

Rodada de correção da arquitetura: um juiz independente (a skill `mjrp-critiquing-architecture`, agente separado de quem escreveu) leu `arch.md`, `data-model.md`, `tech-stack.md`, `constitution.md` e as ADRs contra o código e achou documentos falsos em pontos que importam (relatório `reports/audits/2026-10-28-mjrpalbumblender-v0-architecture-audit.md`). O autor corrigiu os quatro documentos depois de reler no código as linhas citadas; as doze notas de arquitetura continuam passando.

[revisável] O projeto Firebase vivo é `mjrp-playlist-generator` (`firebase-config.js:3-10`, carregado por `index.html:111`); `mjrp-albums` é só o reserva de `firebase-init.js:6-13`.
[revisável] A fronteira do Firestore é descrita como o código a faz, apontando a regra violada (ADR-0017, `PRINCIPLES.md` §I.3) e o achado do relatório como conserto — a regra não foi dobrada para casar com o código (regra antes do código). A constituição passou a apontar para o relatório de auditoria no lugar do «relatório do conform» que não existia no repositório.
[revisável] `firestore.rules:35` (`albumRankings` aberto) e a escrita de qualquer login anônimo em `/albums` e `spotify_enrichment` entram em `arch.md` como fato; nenhum pipeline publica as regras (`firebase.json` sem bloco `firestore`).
[revisável] `data-model.md` diz que a migração convidado→usuário não roda (`UserSyncService.js:22`), o corte de 20 séries sem aviso e que `albumQueries` é regravado por inteiro.
Dívida de código (os itens `violates::` com fonte `arquivo:linha`) fica no relatório de auditoria, não nos documentos de arquitetura (Art. III da constituição).

## [2026-10-28 12:31] decision — requisitos do v0: 39 histórias entregues aceitas por histórico; o que não funciona virou história pendente — decidido pelo agente, revisável pelo MJRP

Notas dos itens `requirement-nodes` (CM-0037, CM-0067), `product-structure` (CM-0019, 0020, 0021, 0022, 0027, 0028, 0058, 0069, 0079, 0082 → product-structure@10) e `release-features` (CM-0074), pela `mjrp-writing-reqs` (pacote C1): `--check-note` passa em todas; `requirements_graph_check.py` e `product_structure_check.py` VERDES (187 nós, nenhuma regra violada; a tela conta 56 nós: 39 histórias entregues, 15 pendentes sem release, 2 NFR transversais).

[revisável] As 39 histórias entregues (S-01..S-39) nascem `Done` e `Accepted` com `accepted_in: "histórico anterior ao harness — regra do MJRP de 2026-10-18"` — a regra vale: cada uma lista ao menos um `delivered_by` commit real (`git cat-file -t`) anterior ao commit 54fd54c que criou o contrato. Um só registro para as 39 histórias, não 39 linhas. O grafo imprime «39 aceites por histórico».
[revisável] Só o que funciona vira história entregue. O que o código tenta e não cumpre (excluir álbum do inventário chama método inexistente; desfazer/refazer sem botão; «carregar mais» sem handler; excluir playlist sem botão; Discovery Mode sem efeito; título da playlist sem persistência; `?seriesId=` ignorado em `/blend`; rotas de artista/gênero/faixas «em breve»; telas só por URL digitada) virou história `Backlog` sem release (S-40..S-54), com o ID do inventário e a linha. Fix não é nó de requisito neste grafo (o sensor só aceita `S-`, `UC-`, `EA-`, `NFR-`).
[revisável] Os itens do Sprint 24 viraram NFR-01 (testes ponta a ponta) e NFR-02 (desempenho com Lighthouse), ambos `Backlog` e transversais; as refatorações dos Sprints 17 a 19 são arquitetura e não viraram história de usuário.
[revisável] Release de cada história: a do ROADMAP legado para o sprint que a entrega; hashes repetidos entre histórias (por exemplo `c8be9fa` em S-09, S-14, S-15, S-21) porque o histórico do git (que só começa em 2025-11-22) não separa essas capacidades em commits.
[revisável] As histórias apontam para estados do `behavior.md` (sem `info-arch.md` nem protótipo, que não existem); quando o `info-arch.md` existir o estado de tela migra com o mesmo block ID.
Não foi criada feature de histórico: `feature_history_check.py` fica verde sem `docs/specs/milestones/` e o v0 não os tem; features de histórico por release seriam escolha do MJRP, não exigência do sensor.

## [2026-10-28 12:31] decision — comportamento transversal do v0 (behavior.md) escrito do inventário do código — decidido pelo agente, revisável pelo MJRP

Notas CM-0031 e CM-0049 (item `behavior`, behavior@2), pela `mjrp-writing-reqs` (pacote C1); `--check-note` passa.

`docs/specs/behavior.md` nasceu do modelo da skill dona com 113 estados com block ID em 10 superfícies (tela inicial, biblioteca, menu de mistura, playlists geradas, exportação, playlists guardadas, inventário, conta, mensagens do app, guardado no navegador). Cada linha traz o ID do inventário do V1 e o `arquivo:linha`.
[revisável] Só o que o código FAZ (fato lido): fonte `reports/audits/2026-10-27-mjrpalbumblender-v0-feature-inventory.md` do V1 (leitura estática, "confirmar ao vivo" onde o inventário marca).

## [2026-10-28 12:10] harness-feedback — três checks passam o modelo sem preencher; o slug do projeto não aceita sublinhado

O pacote B achou três pontos em que o check do harness deixa passar o que a skill dona não deixaria: (1) `constitution`, `arch` e `data-model` passam com o modelo ainda com colchetes (o check só pede o título); (2) o `tech-stack` aceita ADR em `Proposed` na coluna Decisão; (3) o `project_slug` do `report_types_check.py` não aceita `_`, então nenhum parecer neste projeto fica sem aviso de nome. Parecer em `reports/harness-feedback/2026-10-28-mjrpalbumblender-v0-checks-pass-untouched-templates.md` — vai ao harness, não é corrigido aqui (o agente não edita o check).
Nota CM-0013 (item `english-names`): `--check-note` passa (`docs/wiki/*.md` só tem `index.md`); registrada sem rodada.

## [2026-10-28 12:09] decision — ADRs 0015 a 0018 renomeadas para o padrão; ponteiros varridos — decidido pelo agente, revisável pelo MJRP

Notas CM-0012, 0024, 0076 e 0085 (item `adr-names`, adr-names@4), pela `mjrp-recording-decisions` (pacote B); `--check-note` passa nas quatro e o `--gaps` já não lista o item. As quatro ADRs (`adr-015…018`) viraram `0015-flavor-to-recipe.md`, `0016-service-layer-extraction.md`, `0017-pure-state-stores.md`, `0018-fine-grained-services.md` por `git mv`; só título (`# ADR-NNNN:`) e linha de status mudaram. Varredura `git grep -n -F` dos nomes antigos e de `ADR-015…018` corrigiu os ponteiros em `docs/ROADMAP.md:98`, `docs/manual/00_Dir_File_Structure_Map.md` (linhas 257, 258, 277-280), `proj-documentation-task.md` (281-282) e no corpo da 0017 (`ADR-016` → `ADR-0016`); nada mais acha os nomes antigos.

[revisável] Numeração 0015 a 0018 mantida (a que as ADRs já tinham) — deriva do molde `decision@3`.
[revisável] Status e data originais preservados (0015 APPROVED; 0016 e 0017 Accepted; 0018 Proposed; todas 2026-01-10) e nenhuma linha `**Acceptance**:` foi inventada: o `adr_header_check.py` isenta ADR de data anterior a 2026-10-26 e a CM-0085 manda não reescrever as antigas.
Aberto (classe b): a ADR-0018 segue `Proposed` — o aceite técnico é do tech lead (agente) ou do MJRP; pergunta no relatório de auditoria.

## [2026-10-28 12:09] decision — arquitetura, stack e modelo de dados do v0 escritos do código existente — decidido pelo agente, revisável pelo MJRP

Notas CM-0032, 0053, 0072 (item `arch`, arch@3), CM-0071 (item `tech-stack`) e CM-0033, 0054 (item `data-model`, data-model@2), pela `mjrp-designing-architecture` (pacote B); `--check-note` passa nas seis.

[revisável] `arch.md` descreve o que o código é e não traz lista de problemas (Art. III da constituição proíbe «Known Issues» em documento de arquitetura); desempenho e escala ficaram TBD por serem decisão de produto — fonte: mapa do V1 (Apêndices E, F §7, G §2).
[revisável] `tech-stack.md` (`status: Draft`): versões lidas de `package.json`, `server/package.json`, lockfiles, `Dockerfile` e do CI; a coluna Decisão fica `—` porque nenhuma ADR do v0 decide tecnologia. A aprovação como baseline é do MJRP (pergunta no relatório de auditoria).
[revisável] `data-model.md` segue o que o código grava (`albumQueries` etc.), não o que os manuais 05/32 desenham; campos que o mapa do V1 não leu por inteiro ficam TBD.
[revisável] Padrões de projeto citados com endereço: Store/Observer `DP-05`, Repository `DP-01`, Service `DP-12`, Strategy `DP-04`, Facade `DP-11`, Factory `DP-02`; Singleton, MVC e Command ficaram fora (o `DP-03` do catálogo diz evitar).
Fonte dos fatos de código: relatório do V1 `reports/audits/2026-10-27-mjrpalbumblender-v1-project-bootstrap-report.md` (juiz independente: passou).

## [2026-10-28 12:09] decision — constituição do v0: artigos aprovados mantidos; divergências do código viram conserto, não emenda — decidido pelo agente, revisável pelo MJRP

Notas CM-0030 e CM-0048 (item `constitution`, constitution@2), pela `mjrp-designing-architecture` (pacote B); `--check-note` passa. Antes do trabalho as duas já passavam com o esqueleto de colchetes (o check só pede o título), por isso o conteúdo foi conferido por leitura.

[revisável] Os artigos da constituição aprovada do v0 (`docs/CONSTITUTION.md`, v1.0.0, ratificada em 2025-12-10) ficam palavra por palavra, só na forma do modelo; a linha «Service Layer» duplicada no Art. II foi retirada; nos Art. I, IV e V entra uma linha «Relação com o harness» apontando para `PRINCIPLES.md` §I.8, §I.10 e §I.14 — versão segue 1.0.0.
[revisável] Regra antes do código: onde a constituição e o código divergem, a regra manda e o código vira item de conserto com `violates::` (lista no relatório de auditoria: Art. III × `DEBUG_LOG.md`, Art. II × Tailwind por CDN, Art. V × token escrito em script e regras abertas do Firestore, ADR-0017 × stores que chamam o Firestore). Nenhum artigo foi reescrito para casar com o código.

## [2026-10-28 12:09] decision — PRD do v0: épicos de histórico; a CM-0051 é satisfeita pela forma atual (prd@2) — decidido pelo agente, revisável pelo MJRP

Notas CM-0051 e CM-0077 (item `prd`, prd@2), pela `mjrp-coaching-pm` (pacote A). A CM-0077 passa; a CM-0051 reprova só no degrau antigo (`sem a seção ## Entregue`) e o próprio check diz «versão atual (prd@2): passou» — a CM-0077 proíbe a seção, então a nota é registrada como satisfeita pela forma atual e o PRD não foi editado para o formato mais velho (`conformance-notes.md`, passo 2 e `conform-mode`, passo 6).

[revisável] Oito épicos de histórico, um por área funcional entregue, cada um servindo um único resultado: EP-01 a EP-06 pela organização da própria documentação (`docs/MJRP_Album_Blender_Prod_Vision.md:23-36,44-50,58-77,80-87`); EP-07 (inventário) e EP-08 (conta e nuvem) tiveram stories entregues na R2 e precisavam de casa — colocação provisória, «decidido pelo agente, pendente do MJRP» (OUT-03 e OUT-01), com pergunta de confirmação no relatório de auditoria.
[revisável] Personas, regras de negócio, dependências e fora de escopo só dizem o que a documentação do v0 diz, com a fonte; riscos: «nenhum risco registrado» e os achados do V1 foram para Candidatos.
[revisável] O PRD ainda não embute stories: os requisitos entregues são o próximo pacote (`mjrp-writing-reqs`).

## [2026-10-28 12:09] decision — roadmap e releases do v0: resultados e marcos tirados da documentação legada — decidido pelo agente, revisável pelo MJRP

Notas do item `roadmap` (CM-0002, 0017, 0025, 0041, 0045 → roadmap@6) e do item `releases` (CM-0003, 0046, 0078 → releases@3), pela `mjrp-coaching-pm` (pacote A); `--check-note` passa nas oito.

[revisável] Cinco releases de histórico (R1 a R5) agrupam os Sprints 1 a 23 por data e tags `v*` do git — deriva de `docs/ROADMAP.md:22-281` e `git tag`; Sprint 24 e Sprint 22 não são release (são janelas de tempo).
[revisável] Quatro resultados permanentes (OUT-01 a OUT-04, em `## Now`) saem um a um da seção «Product Vision» do ROADMAP legado (`docs/ROADMAP.md:293-298`); OUT-05 (Next) é o Sprint 22 (`docs/ROADMAP.md:285-289`); Later é a «Long-Term Vision» (`docs/ROADMAP.md:300-305`) — nenhum resultado novo foi inventado.
[revisável] O Sprint 24 («QA & Stability») não virou resultado: saúde técnica é restrição, não resultado (`the-top-of-the-graph.md` da `mjrp-coaching-pm`); os itens vão para `## Candidatos (Intake)` do PRD, para virarem NFR e itens de conserto.
[revisável] Problema, «quem sente» e medida entram só quando a documentação do v0 os diz (com a fonte em comentário); o resto está marcado «a perguntar ao MJRP (P-NN)» — conteúdo de produto, classe c, perguntas no relatório de auditoria.
[revisável] Descrições das releases omitem o que o mapa do V1 mostra que não funciona (desfazer/refazer sem botão; excluir item do inventário) — deriva do inventário do V1 §1.6 e do mapa §2.D/§2.F.

## [2026-10-28 12:08] decision — visão do v0: campos citados da documentação; Visão e paleta ficam para o MJRP — decidido pelo agente, revisável pelo MJRP

Notas CM-0029 e CM-0047 (item `vision`, vision@2), executadas pela `mjrp-coaching-pm` (pacote A, Sonnet) e conferidas com `conformance_check.py --check-note`: as duas passam.

- Propósito, Objetivo, Como, Vibe e Design DNA do `VISION.md` são citação da documentação do v0 (`docs/MJRP_Album_Blender_Prod_Vision.md:11-15`, `README.md:3-6`, `docs/CONSTITUTION.md`), com a fonte em comentário no arquivo; só mudaram de forma.
- A Visão (WHERE) não está dita num lugar só: o campo ficou «a perguntar ao MJRP (P-01)» — pergunta no relatório de auditoria do conform (conteúdo de produto, classe c).
- O nome da paleta da Vibe também ficou para o MJRP (P-02).


## [2026-10-28 11:56] decision — v0 entra no harness como projeto brownfield; o fechado em produção nasce aceito — decidido pelo agente, revisável pelo MJRP

Contexto: decisão do MJRP de 2026-10-28 (confirmada por ele à orquestradora): o v0 do Album Blender (Vanilla JS, em produção) passa a ser projeto do harness; até 2026-10-27 era só fonte para a análise que alimenta o V1.

- [revisável] `new_project.py` rodou sem `--force` (`--profile code-app --process-level standard --ui --requirements-format story`, sensores do `package.json`: lint `npm run lint`, teste `npm test -- --run`, build `npm run build`) e só acrescentou 207 arquivos (nenhum existente alterado, apagado ou movido; código intocado) — deriva de a regra do MJRP de não sobrescrever e de «o código não se apaga nem se move».
- [revisável] `npm test` é o modo de observação do vitest; o contrato usa `npm test -- --run` para o sensor terminar — deriva de `package.json` scripts.test.
- [revisável] `screen:` do contrato declarado como `[public/]` (a tela mora em `public/index.html`, `public/css/`, `public/js/`); o valor do modelo (`web/src/`) não existe aqui — deriva de `public/` (código existente).
- [revisável] regras do MJRP de 2026-10-18 valem aqui: o que está fechado e em produção antes do commit que criou `.mjrp-project.yml` (54fd54c, 2026-10-28 11:52) nasce aceito, sem pedir aceite de histórico; o sensor visual não roda no fechado em produção — deriva de `docs/wiki/harness/conformance-notes.md` e da referência `legacy-history` da bootstrap.
- Todos os 19 ramos remotos (`backup-main-v1.6`, `prod-fixes`, `deploy-sa-helper`, `feature/*`, `fix/*`, `sprint-*`…) têm 0 commits que a `main` não tenha (`git rev-list --count origin/main..<ramo>`); das 70 tags, só `v2.7.0` tem 1 commit fora da `main` (f534ffc, 2025-12-15, CHANGELOG).
