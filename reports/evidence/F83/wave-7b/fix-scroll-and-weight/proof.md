# F83 onda 7b, correções do juiz independente: o salto da página, o peso da construção publicada

Ramo `claude/f83-wave-7b-fix-scroll-and-weight` (a partir de `160c702`); medido no commit final `88e8a99`. A referência é `ace99a9` (a Blend à mão, igual à produção). O controle é a construção SEM as correções (`160c702`): o método tem de reprová-la.

## O que se consertou

| Achado | Conserto | Prova |
|---|---|---|
| P1-1 o Chromium salta a página 112 a 254 px | A seção do passo 4 fica montada; a `key` do desenho vai para o conteúdo dela (`Fragment key`), como a antiga | Rolamento igual ao da antiga em todos os passos (abaixo); teste `Blend.remount` (a seção é o mesmo nó depois de um botão) |
| P1-2 a publicação seria recusada | Regra nova do teto, `scripts/publication-budget.mjs`, teste `publicationBudget` | Abaixo |
| P2-1 esmaecer de 150 a 200 ms | As marcas do passo a passo e os cartões de série são refeitos quando o estado muda (`key` com o estado) | Abaixo (figuras) e teste `Blend.remount` |
| P2-3 `playlists-*.js` a mais na primeira tela | `window.playlistsStore` é exposta por `controllers/BlendingController.js`, não mais pelo `app.js` | Lista de pedidos, abaixo; teste `firstScreenFiles` |
| P2-2 a lista guarda o rolamento | Declarada, sem mudar (abaixo) e em `wave-lessons.md` §20 | Teste `Blend.remount` («on purpose») |

Os 40 cenários do dourado (`test/fixtures/blendBeforeF83.json`) passam sem mudança; suíte inteira 379 arquivos, 4.992 testes; `test/architecture`, `tsc` e `eslint` (0 erros, 67 avisos, os mesmos de antes) limpos.

## P1-1: o rolamento (Chromium, sites construídos, página rolada até perto do fim, o botão com o foco)

Sequência de 14 passos (`scroll2`: um botão de agrupamento, de estrutura e de Top, com e sem o painel de falha). Cada passo guarda `scrollY`, a altura da página e a posição do botão.

| Perfil | nova == à mão (`ace99a9`) | controle `160c702` == à mão |
|---|---|---|
| Chromium 1280 | **igual** | **diferente** (C: 1293 contra 1435) |
| Chromium 900 | **igual** | **diferente** (C: 1556 contra 1698) |
| Chromium 899 (celular) | **igual** | **diferente** |
| Chromium, perfil do iPhone 14 | **igual** | **diferente** |
| WebKit 1280 e iPhone 14 | igual (sem mudança) | n/a |

Os números a 1280 (`scroll1280-table.txt`), `scrollY` depois de cada botão com a página no fim (1439):

| Passo | sem o conserto (`160c702`) | com o conserto == à mão |
|---|---|---|
| depois de «Single» | 1209 | 1327 |
| depois de «Multiple» | 1097 | 1327 |
| depois de um agrupamento | 1209 | **1439** |
| depois de Top 5 / Top 10 | 837 / 887 | 837 / 887 |
| painel de falha, depois de «Single» | 1293 | 1435 |

(«Single» e «Multiple» mudam a altura da página; a antiga também desce 112 px nesse caso, por isso 1327 e não 1439: a diferença que o juiz mediu é o salto de mais, 230 px, que sumiu.)

## P2-1 e as figuras (Chromium 1280 × 3200, sem figuras de página inteira)

- **O que o conserto tira:** depois de escolher uma série, a figura da nova contra a antiga era 21 px + 10 px (máx. 5/255, a borda da faixa do passo a passo, o brilho que fica da transição); agora é **0** (controle: 21 px + 10 px).
- **O que sobra, e que o conserto não toca:** a partir da terceira receita escolhida, 12 a 35 px (máx. 6/255) nos **cantos dos painéis de vidro** (ex.: x 149–158, y 1081–1086, o canto de baixo do painel das receitas), em 57 figuras do fluxo `blend`. O controle `160c702` tem os mesmos 12 a 35 px nos mesmos lugares. Provado que é pintura que sobrou, não estado: com **um repaint forçado dos dois lados antes de cada figura** (`REPAINT=1`: `transform` no `body` por dois quadros) o fluxo `blend` inteiro dá **0 px em 33 passos** e o fluxo curto também. Não é transição nem animação (`transition:none` e `animation:none` nos dois lados não o tiram), nem o desfoque do fundo. Reduzir `box-shadow` baixa a intensidade para ≤ 2/255. Não isolei a causa abaixo disso; ninguém vê (≤ 6/255, ≤ 35 px, e some no próximo repaint). **Não está a 0 sem o repaint.**
- Ruído (à mão contra à mão): 0 px em Chromium 3200 `blend` e `many`.
- A 899 (celular), uma figura (depois de «Single» com o painel de falha): 10 px, máx. 7/255, no canto de cima à direita da faixa (x 874–878, y 127–130); `transition:none`, `animation:none` e a `key` na faixa inteira não o tiram. Controle: 22 px na mesma figura. 1280 × 800: às vezes 3 px, máx. 2/255 (x 173–175, y 651), intermitente.
- WebKit 1280: nova contra à mão **0 px** em `blend`; nas figuras de `scroll2` só a barra do alto animada (4.886 px, o ruído que o juiz já mostrou). iPhone 14 em WebKit: ≤ 1/255 em áreas grandes (o ruído de sempre).

## P2-3: o que a primeira tela baixa (Chromium, frio, tudo fora de `127.0.0.1` bloqueado)

`requests.mjs`; `requests.json` tem as listas por rota.

- `/` (a página de entrada): **igual** à da junta (3 arquivos).
- `/start` e `/albums`: `playlists-*.js` **saiu** (o controle tinha 5 arquivos a mais que a junta; a nova tem 4). Os 4 que restam a mais são os pedaços **da tela Blend e do controlador partilhado**, que a antecipação em segundo plano (`prefetchScreensAfterTheFirstScreen`, ~30 ms depois do carregamento, no navegador sem rede lenta) agora busca porque a Blend deixou o script principal: `AlbumCascade`, `BlendingController`, `batchNaming`, `useFocusLikeAfterAnewDraw`. É o aumento de «depois da primeira tela» que a onda declara (`background` do orçamento); não são pedidos do caminho da primeira tela. **A lista não é idêntica à da junta, e não pode ser enquanto a Blend for um arquivo à parte.**
- `window.playlistsStore` existe depois de um `/start` frio (`check-store.mjs`).

## P1-2: o orçamento

Regra nova (em `scripts/bundle-budget.json` e `wave-lessons.md` §20): os tetos se medem numa construção feita com valores de mentira do mesmo tamanho de cada chave que a publicada leva, mais a margem declarada.

- **Quais entram:** o Vite põe todo `VITE_*` no script principal (`SpotifyAuthService` lê `VITE_SPOTIFY_CLIENT_ID`; `usageWiring` lê o `import.meta.env` inteiro). A configuração web do Firebase **não** entra: é copiada como arquivo (`public/js/firebase-config.js`).
- **Valores de mentira (só no ambiente; sementes fixas; nada em arquivo):** `VITE_SPOTIFY_CLIENT_ID` 32 caracteres (hex), `VITE_POSTHOG_KEY` 47 (`phc_` + 43), `VITE_POSTHOG_HOST` 24 (o host da nuvem da Europa; o dos EUA tem o mesmo tamanho). `VITE_USAGE_MEASUREMENT` fica sem valor (a medição ligada).
- **Comando:** `node scripts/publication-budget.mjs` (`npm run budget:publication`): faz a construção e confere os tetos e a margem. Sai com 1 se um teto tem menos que a margem.
- **Margem declarada:** 150 B (uma chave de verdade é aleatória e comprime alguns bytes diferente de um valor de mentira; `VITE_SPLASH_COVERS` ou um endereço de redirecionamento somam alguns mais).
- **Medido (commit `88e8a99`):** script principal 195.050 B; depois da primeira tela 236.336 B; soma 431.386 B; `react-vendor` 68.691 B.
- **Tetos:** principal **195.210 B** (margem 160 B; era 195.033 B, que a construção publicada já estourava); `background` **58.150 B**, de modo que o teto da soma (301.437 + 72.000 + 58.150 = 431.587 B) tem 201 B de margem. `reactVendor` e `screen` não mudam.
- **Teste:** `test/scripts/publicationBudget.test.js` falha se um teto tiver menos que a margem sobre `publication.measured`; confere os tamanhos e a repetibilidade dos valores de mentira e que o script não escreve valor em arquivo. **Não constrói** (uma construção é lenta demais para a suíte): guarda a regra e os números; o script é a prova. A implantação de prévia de verdade, com o `.env`, é a prova final e é do orquestrador.

## P2-2: a segunda diferença de propósito (declarada)

Escolher uma série mantém o rolamento da lista de séries (a antiga a levava ao topo); também para a série do endereço. Está em `reports/evidence/F83/wave-7b/proof.md` (seção «Duas diferenças de propósito»), em `wave-lessons.md` §20 e dita pelo teste `Blend.remount` («on purpose»). No fluxo `many` do navegador as seis figuras que diferem (três passos) são exatamente essa (`listTop` 295 e 7 contra 0), iguais no controle.

## Não provado

- A implantação de prévia real (o `.env` verdadeiro): do orquestrador.
- A margem de 150 B foi escolhida, não derivada: uma chave de verdade pode gzipar diferente do valor de mentira; se o preview passar por menos de ~10 B, mexa nela.
- Figuras a 0 sem repaint forçado (acima); a causa dos cantos dos painéis de vidro não foi isolada.
- Chromium com perfil do iPhone SE, WebKit a 899 e 900.
- A lista de pedidos da primeira tela não é igual à da junta (os 4 pedaços da Blend, acima).

## Arquivos

`judge.mjs` (o roteiro do juiz com os fluxos `scroll2`, `blend`, `many`, `mini` e o perfil 3200, `REPAINT=1`), `requests.mjs`, `check-store.mjs`, `requests.json`, `scroll1280-table.txt`, `raw/runs1..5.log` (as rodadas, com os scripts `runs*.sh`).
