# Mapa da tela do inventário, `/inventory` (F83, onda 6, TASK-24), com a parte da TASK-23c que vai junto

Escrito antes de qualquer código da onda, a partir da leitura dos arquivos em 2026-11-22 (ramo `claude/f83-wave-6-inventory`, sobre a ponta da segunda junta `claude/f83-sync-2-export-and-inventory-changes`, `88e6b60`). Lê-se com a proposta (§ 4.3, § 4.4, § 9), `wave-lessons.md` (inteiro) e o mapa da onda 5 (`map-wave-5-albums.md`, as seções «Para a onda 6» e «A 5b»). **Estado:** só o mapa; nenhuma linha de produto. A tela de hoje é a que a segunda junta trouxe da `main` (9ff2141) como veio: a lista e a galeria, a galeria no celular (F89), os valores do Discogs guardados no item com a data da leitura e a origem em duas linhas (F75), a ordem nos dois sentidos, a moeda. **Não há caixote 3D nesta tela** (o caixote é da página de entrada, `design/inception/splash-crate-*`). Desde a junta a `main` andou só na Start (F79, UAT-281); nada no inventário.

`/inventory` é **uma tela só**, registrada direto no `app.js` (`router.register('/inventory', () => new InventoryView())`, importada **estaticamente**: hoje todo o inventário está no script principal). Um controlador **por visita** (`new InventoryController(view)` no construtor da view), ao contrário do de álbuns, que é um por sessão.

## O tamanho do trabalho

Alcançado a partir de `InventoryView`, mais a janela de adicionar que a tela de álbuns abre, fora lojas, serviços e modelos: **18 arquivos de desenho, 3.891 linhas**, mais o controlador (514) e a parte dele que cuida dos valores (292), que ficam em JavaScript. Medido por leitura das importações:

| Pedaço de hoje | Linhas | Quem mais o usa | Decisão |
|---|---|---|---|
| `views/InventoryView.js` (a casca, o topo, a barra de filtros, a barra do celular, os ouvintes, os pedidos de janela) | 707 | — | some: `screens/inventory/` (6a) |
| `views/InventoryPhoneSheets.js` (as seis folhas do celular) | 243 | — | `screens/inventory/phone/Sheets.tsx` sobre `ui/SheetWindow` (6a) |
| `views/renderers/InventoryGridRenderer.js` (grade, lista, carregando, vazio, seletor de status do cartão, selo de formato, médias) | 212 | `test/security/outsideTextIsText` | `Grid.tsx`, `ItemCard.tsx`, `ItemRow.tsx` (6a) |
| `views/renderers/InventoryCardValue.js` (as cinco linhas do cartão, a linha do valor da lista) | 142 | a peça da galeria do celular (`formatOf`) | `CardValue.tsx`; `formatOf` vai para um modelo (6a) |
| `views/renderers/InventoryValueHeader.js` (os totais, a moeda, as notas, os avisos; as versões do celular; o texto da folha «About the values») | 175 | as folhas do celular | `Totals.tsx`, `Notices.tsx` (6a) |
| `views/renderers/InventoryPhoneRow.js` (a linha do celular, «Show 50 more», os fantasmas, os dois vazios, a linha do que está rodando) | 155 | a galeria, as folhas | `phone/PhoneRow.tsx`, `PhoneEmpty.tsx`; `phoneProgress` e `originText` vão para um modelo (6a) |
| `views/renderers/InventoryPhoneTile.js` (o cartão da galeria, F89) | 92 | — | `phone/PhoneTile.tsx` (6a) |
| `components/ui/Card.js` (o cartão do app, formas `grid` e `list`) | 341 | **só o inventário** | porta-se **só o que o inventário desenha** (o cartão da grade já depois do pós-processamento, e a linha da lista) em `ItemCard.tsx`/`ItemRow.tsx`; `Card.js` sai (6a) |
| `components/Breadcrumb.js` | 63 | **só o inventário** (as telas em React já usam `ui/Breadcrumb.tsx`) | `ui/Breadcrumb.tsx` ganha `inventoryTrail()`; o antigo sai (6a) |
| `utils/keepField.js` (devolve o campo em uso e a rolagem depois de um redesenho inteiro) | 63 | só o inventário | some: no React o campo de busca não é trocado (6a); o teste dele (8 casos) sai junto, e o que ele garantia é afirmado pelo teste levado da UAT-212 |
| `components/ViewAlbumModal.js` (a janela do álbum: capa, título, selos, «Paid», notas, a comparação de faixas, a barra e o brilho do celular) | 382 | **a tela de álbuns** (`react-bridge/legacy/AlbumWindows.ts`) | `ui/albumWindow/AlbumWindow.tsx` (6b, TASK-23c) |
| `components/InventoryValueSection.js` («Estimated value», «Where to buy», as dobras do celular) | 316 | só a janela do álbum aberta pelo inventário | `screens/inventory/ValueSection.tsx`, `BuyLinks.tsx`, entregues à janela como conteúdo (6b) |
| `components/albumWindowSources.js` (onde estão as fontes do álbum na carga, «Try again») | 40 | só a janela | `ui/albumWindow/sources.ts` (6b) |
| `components/ranking/TracksRankingComparison.js`, `TracksTable.js`, `TracksTabs.js` | 207 + 314 + 102 | o cartão aberto de álbuns (`react-bridge/legacy/TracksTable.tsx`) e a janela | `ui/tracks/TracksComparison.tsx`, `TracksTable.tsx`, `TracksTabs.tsx` (6b, TASK-23c) |
| `components/InventoryEditModal.js` (editar o item) | 157 | — | `screens/inventory/EditWindow.tsx` no casco `ui/ModalShell` (6b) |
| `components/InventoryAddModal.js` («Add to inventory», aberta pelo cartão de álbuns) | 180 | só a tela de álbuns | `screens/albums/InventoryAdd.tsx` no mesmo casco; o formulário partilhado com a de editar em `ui/inventoryItem/ItemForm.tsx` (6b, TASK-23c) |
| `controllers/InventoryController.js` + `InventoryValues.js` | 514 + 292 | — | **ficam em JavaScript** (como `PlaylistsController` e `SeriesController`): a `view` que recebem passa a ser uma ponte |

Saem da lista `handMadeScreensBaseline` 9 arquivos na 6a (2.078 linhas contadas lá: `InventoryView` 693, `InventoryPhoneSheets` 226, os cinco desenhistas 755, `Card` 341, `Breadcrumb` 63) e 8 na 6b (1.698: `ViewAlbumModal` 382, `InventoryValueSection` 316, `albumWindowSources` 40, as três de faixas 623, editar 157, adicionar 180). A lista vai de 41 para 24 arquivos. **Os números da lista estão atrás dos de hoje** (por exemplo `InventoryView` 693 na lista, 707 no disco): a segunda junta trouxe a F89 e a F75 dentro da folga de 20 linhas; nada a fazer, eles saem inteiros.

Motores que ficam (não são do inventário): `components/ui/Sheet.js` (pela `ui/SheetWindow`; a Blend ainda o usa), `BaseModal.js` (a `DialogService`), `Toast.js`, `DialogService.js`, `coverImage.js` (a cascata antiga da Blend; o React usa `ui/CoverImage.tsx`).

## O que é carregado, e quando — e a armadilha da assinatura

Hoje o `app.js` importa `InventoryView` no topo, e com ela `services/inventory/inventoryWiring.js`. **Esse arquivo assina o `userStore` no momento em que é carregado** (`userStore.subscribe(state => inventoryService.handleUserChange(state))`), e `handleUserChange` lê o inventário da pessoa do Firestore para a loja. O `userStore.subscribe` **não chama o ouvinte na hora**. Então: se a tela passar a ser carregada sob demanda (como toda tela em React) e o `inventoryWiring` for com ela, o serviço nunca ouve quem entrou antes de a tela abrir, fica com o visitante anônimo, e **o inventário aparece vazio**. Hoje o inventário é lido na entrada, para todo mundo, e a tela abre com ele já na loja.

**Proposta:** o `app.js` passa a importar `services/inventory/inventoryWiring.js` por si (uma linha, como já importa `services/auth/userSession.js`), e o resto vai para o arquivo sob demanda da tela. Fica no script principal: `InventoryService`, o repositório (em `shared/`), `models/inventoryFromSeries.js` e `inventoryRatings.js` (que o serviço usa). Sai: a view, os desenhistas, as folhas, `Card.js`, o controlador, `InventoryValues`, `inventoryValueWiring.js`, `InventoryValueService.js`, `api/valueApi.js` e os modelos que só eles alcançam (`inventoryValueRun`, `inventorySort`, `inventoryJump`, `inventoryFilter`, `inventoryViewMode`, `buyLinks`, `inventoryValue`, `albumAverages` na parte só deles). A janela do álbum e as de editar e adicionar já são pedidas por `import()` no clique e continuam assim.

A rota entra no padrão das outras: `loadScreen(() => import('./screens/inventory/index.ts'))` e a lista do segundo plano (`prefetchScreensAfterTheFirstScreen`).

## As lojas e as fontes que a tela lê (a auditoria)

| Loja ou fonte | O que muda por dentro, o que é silencioso |
|---|---|
| `inventoryStore` (`stores/inventory.js`) | **A lista é sempre trocada, nunca mudada por dentro**: `setAlbums`, `replaceAlbums` e `reset` põem uma lista nova (o serviço faz `map`/`filter`). Todo `set` avisa, **na hora, sem lote**, e o aviso leva `getState()`, um objeto novo a cada chamada. `loading` e `error` existem mas **a tela não os lê** (ver «Defeitos»). Quem escreve é só o `InventoryService`. A tela **não lê a loja**: o controlador a lê (`getAlbums()`) e guarda a lista no estado dele. |
| `discogsNoticeStore` (`stores/discogsNotice.js`) | a tela **escreve**: `showDiscogsNotice(source === ON)` **a cada desenho**, e cada chamada avisa a moldura (`shell/Footer.tsx` a lê por `useStore`). Ninguém a apaga ao sair (ver «Defeitos»). |
| `userStore` | só pelo `inventoryWiring` (acima); a tela não o lê. |
| `localStorage` | `mjrp_inventory_view_mode` (grade ou lista; lido em `loadSettings`, escrito em `handleViewModeChange`; vale também para a galeria do celular, F89) e `inventoryCurrency` (a moeda, `InventoryValues.loadSettings`/`chooseCurrency`). |
| O cache do navegador (`CacheManager`) | pelo `InventoryValueService`: a leitura do Discogs (`inventoryvalue:`, seis horas) e o câmbio do dia (`exchangerates:`). |
| `optimizedAlbumLoader` | `initialize()` chama `optimizedAlbumLoader.load()` e esquece (nem espera nem trata o fim). Fica igual. |

**Consequência para o desenho:** a tela nova **não assina loja nenhuma** (fora a moldura, que já lê a do aviso). O controlador continua a ouvir a loja do inventário, mas quem o liga a ela hoje é a view (`mount`: `inventoryStore.subscribe(() => { updateStateFromStore(); refresh() })` e `onPhoneChange(() => refresh())`): na nova, essas duas assinaturas vão para o `prepare`/`dispose` da rota (como a tela de álbuns faz com o controlador dela), nunca para um efeito do React. A tela lê o estado do controlador **na hora do desenho**; nada de `useMemo` sobre `state.albums` ou `filteredAlbums` (o controlador refaz as listas em lugar: `this.state.filteredAlbums = result`, e `stats` é o mesmo objeto mudado por dentro).

## Quem guarda qual estado

- **O controlador** (`state`): `albums`, `filteredAlbums`, `stats` (o mesmo objeto, mudado por dentro), `filters` (`search`, `format`, `ownership`), `sorting` (`field`, `direction`), `viewMode`, `viewChosen`, `seriesAdd` e `ratings` (o que cada ação faz, `{ busy, text }`), `value` (o retrato dos valores feito por `InventoryValues.view`, novo a cada cálculo) e `isLoading`. Também o `AbortController` de sair (`_leaving`).
- **`InventoryValues`**: `source` (`on`/`off`/`null`), `rates`, `readings` (`Map` por item, mudado por dentro), `progress` (`Map`), `run`, `chosenCurrency`, `_lookedUp`, `_openedFor`, `_stop`.
- **A view (que morre com a visita)**: `left`, `phoneShown` e `phoneKey` (quantas linhas o celular mostra, e a chave de filtros e ordem que zera esse número), `openWindow` (a janela do álbum aberta, para `redrawValue`). Na nova, os três primeiros vivem na ponte ou num estado da tela; `openWindow` some (a janela é React e lê a ponte).

## Como a tela redesenha hoje, e o que a nova repete

Isto é o que a conferência de «igual» tem de pegar.

- **Redesenho inteiro** (`render(state)` chamado pelo controlador em `refresh`, `loadData`, a cada aviso da loja e a cada mudança de telefone/computador): `SafeDOM.clear(#app)` e uma árvore nova, **dentro de `redrawKeepingField`** (o campo de busca volta com o texto e o cursor, e a rolagem volta ao lugar), e então **todos os ouvintes de novo** (`attachEventListeners`). O foco que não era o da busca **volta para a página**. A loja avisa duas vezes depois de uma escrita (o aviso da loja e o `refresh` que o controlador faz depois de `await`): dois desenhos inteiros.
- **Redesenho no lugar** (sem tocar o resto): `showValues(state, itemId)` (uma rodada de «Update values» andou): o botão, os totais, os avisos, **só o cartão (ou a linha, ou o cartão da galeria) daquele item** trocado por `replaceWith`, a linha do celular do que está rodando, e a seção de valor da janela aberta; `showSeriesAdd` e `showRatings`: só os dois botões e a linha do celular. O foco **não** volta à página nesses (só se estava dentro do cartão trocado). `redrawPhoneGrid` (mais linhas, salto): só a lista do celular.
- **A nova:** a ponte (`InventoryBridge`, como `AlbumsBridge`) dá à tela um número que sobe a cada `render`, e outro a cada `showValues`/`showSeriesAdd`/`showRatings`. O gancho `useFocusLikeAfterAnewDraw` recebe **`after` só com o número dos desenhos inteiros** e **`keep` com o campo de busca** (lições 10 e 13). O campo de busca é o mesmo elemento entre desenhos (não é trocado), por isso `keepField` não é preciso; o ouvinte dele fica `input` na mão (lição 10). O cartão trocado por `showValues` ganha uma `key` que muda com a leitura dele, para soltar o foco como a antiga.

**Os ouvintes de hoje** (refeitos a cada desenho inteiro): `#inventorySearch` `input` → `handleFilterChange('search')`; `#formatFilter` `change`; `#inventorySort` `change` → `handleSortChoice`; `#toggleViewMode` `click`; `#inventoryTotals` `click` (a moeda por `data-currency`; «About the values» / «Why?» por `data-values-about`, que abre a folha); `#inventoryNotices` `click` (`stop-values`, `read-values` com `onlyNeverRead`); no celular, um ouvinte em `.inventory-view--phone` que despacha por `data-phone-action` (`status`, `more`, `more-rows`, `jump`, `filters`, `actions`, `add-series`, `clear-filters`, `stop-values`); na grade, um `click` delegado (um link `a[href]` passa sem abrir janela; `.delete-album-btn` e `.edit-album-btn` com `stopPropagation`; o resto do cartão, a linha, `[data-action="view-modal"]` e «Where to buy» abrem a janela) e um `change` delegado em `.status-select`. Os contadores de status e os três botões de ação têm `onClick` direto. Na nova cada um vira `onClick`/`onChange` no próprio elemento; os links de loja e do Discogs continuam a não abrir a janela.

## O que o controlador faz (e o que muda nele)

Calcula e chama `view.render(state)`, `view.showValues?(state, itemId)`, `view.showSeriesAdd?(x)`, `view.showRatings?(x)`. Não mexe no DOM. **Fica em JS, com a mesma lógica**; a `view` passa a ser a ponte. Os textos que ele diz (`toast.*`, as perguntas de `seriesAddQuestion`, «Reading your series…») vão para o dicionário **nele** (é de `controllers/`, pode importar `i18n/`), como a onda 5 fez. `dispose()` é chamado no `dispose` da rota. Os testes do controlador (73 casos em 5 arquivos, `test/controllers/InventoryController.*`) **não mudam**: eles já usam uma view de mentira.

## As janelas e as folhas do celular

**No computador:**
- *Ver* (a janela do álbum, `showViewAlbumModal(item, { loadAlbum, value })`): um `div.modal-overlay.album-window` posto no `body` (não no `#app`), o cabeçalho com a capa, título, artista, selos (ano, formato, status em maiúsculas), «Paid:» e «Cond:»; as notas (entre aspas, em itálico); **acima das faixas** «Estimated value» e «Where to buy» (só aberta pelo inventário); a comparação das faixas; «Close». Fecha com o ✕, «Close», Escape (ouvinte no `document`) e clique no fundo, com 200 ms de saída antes de sair do DOM. Mostra na hora o que o item guarda e pede à carga o álbum de agora (`albumOfItem`, cancelado ao fechar); «Loading the tracks of this album…», «…could not be loaded…» ou «No tracks are kept for this album.»; um item sem capa ganha a capa do álbum que chegou (UAT-222). No celular: a barra de cima com ✕ e o título que aparece quando o cabeçalho rola (`IntersectionObserver`), o brilho da capa atrás do cabeçalho, e as duas seções dobradas em uma linha cada.
- *Editar* (`InventoryEditModal`, casco `BaseModal` `#inventory-edit-modal`, `md`): «Edit Inventory Item», o cabeçalho com título e artista, «Format:» (seis formatos; «Not set» para o item sem formato, que veio de uma série), «Currency:» (rádios BRL e USD), «Purchase Price:» (`number`, passo 0,01), «Notes:» (texto de três linhas), «Cancel» / «Save Changes». Grava `{ format: format || null, currency, purchasePrice, notes: notes.trim() }` por `controller.handleUpdateAlbum`.
- *Apagar*: `dialogService.confirm` («Remove from Inventory?», «Are you sure you want to remove "…" from your collection?», «Remove», `danger`), depois `handleDelete` (o serviço apaga na nuvem e então na loja; falha: «Failed to delete album»).
- *Adicionar ao inventário* (aberta pelo cartão de **álbuns**, não pelo inventário; `#inventory-add-modal`): o cabeçalho com «artista • ano», «Format: *» (CD de início), «Currency:» (BRL de início, o prefixo R$ ou $ muda junto), «Purchase Price:», «Condition / Notes:», «Cancel» / «Add to Inventory»; chama `inventoryService.addAlbum` direto; repetido avisa «Album is already in your inventory».
- *As perguntas das duas ações da coleção* pela `DialogService` (a de «Add the albums of my series» sempre; a de «Update ratings» só com mais de 30 álbuns, `CONFIRM_FROM`).

**No celular** (todas pelo motor `components/ui/Sheet.js`, variante `bottom`; cada escolha **fecha a folha primeiro** e só então chama o que pediu, para a janela ou a pergunta que vem depois não ficar embaixo):

| Folha | id | O que tem |
|---|---|---|
| Status | `inventoryStatusSheet` | «Status», a nota «título · artista», os três status (o atual marcado); escolher o mesmo não faz nada |
| O álbum («⋯») | `inventoryItemSheet` | título; «artista · ✓ Owned»; «Open album», «Edit»; o valor (rótulo, «≈ …», de onde vem, «Read on …», a edição e «Data provided by Discogs.»); «Where to buy» (três lojas e a nota); «Sell or trade» (desabilitados); «Remove from inventory» |
| Filtros e ordem | `inventoryFiltersSheet` | «View» (Gallery / List, F89), «Format» (All, CD, Vinyl, Digital), «Sort by» (as dez); cada escolha vale **na hora** e a folha se redesenha; o rodapé «Show N albums» com a contagem de agora; ao fechar, **rola ao topo** se a ordem, o filtro ou a vista mudou |
| Ações da coleção («⋯» da barra) | `inventoryActionsSheet` | **os mesmos botões do computador**, com os ids (o andamento é escrito neles por id), cada um com a frase do que faz; um ouvinte em captura fecha a folha antes do clique do botão |
| Saltar | `inventoryJumpSheet` | «A–Z» (por artista) ou «1–N» (as faixas de posição), cada alvo com quantos álbuns; desenha as linhas até o alvo, `scrollIntoView` e foco no botão da linha |
| Sobre os valores | `inventoryValuesSheet` | os dois totais com as contagens, o câmbio, a frase do vendedor com o link (quando falta), de onde vêm os valores, o crédito; título «About the values» ou «Why lowest asking prices?» |

## Os formulários

Três: editar, adicionar e o campo de valor da janela (`#inventoryValueInput`, `inputmode="decimal"`, «Save», Enter também salva; um texto que não é número maior que zero: «Write the value as a number above zero, for example 12.50.» e nada é gravado; fora do USD, «Written in EUR and kept in USD, at today's rate.»). Editar e adicionar têm o mesmo corpo (formato, moeda, preço, notas) e só diferem nos padrões e no que gravam: um `ui/inventoryItem/ItemForm.tsx` com os dois; o rodapé lê o corpo, então as duas janelas vão no `ui/ModalShell` (lição 11), não no `useModalWindow`. Rádios e campos: compare o **estado** (marcado, escrito), não o atributo (lição 13).

## Os estados vazio, carregando e erro

- **Carregando:** `InventoryGridRenderer.renderLoading` («Loading inventory...») e os fantasmas do celular (seis linhas ou seis cartões) existem, mas o `isLoading` do controlador vira `true` e `false` **na mesma volta** (`loadData` não espera nada), então **nunca chega a ser pintado**; e a loja tem `loading`, que a tela não lê. Na prática, enquanto a leitura da entrada não volta, a tela mostra o **vazio**. Os dois estados entram nos cenários (o `isLoading` posto à mão), porque a tela os desenha quando pedida.
- **Vazio:** no computador uma frase só para os dois casos, «No albums found matching your filters.»; no celular dois: o inventário vazio («Your collection is empty», o texto, «Add the albums of my series») e o filtrado («No albums match», «Clear search and filters», que zera busca, formato e status).
- **Erro:** a leitura que falha põe `error` na loja, que ninguém lê; a tela fica no vazio. Os erros de ação são avisos (`toast`).

## O escopo da TASK-23c que vai nesta onda

1. **A tabela de faixas e a comparação** (`TracksTable` 314, `TracksTabs` 102, `TracksRankingComparison` 207): portadas uma vez para `ui/tracks/`. O cartão aberto da tela de álbuns passa a usar `ui/tracks/TracksTable.tsx` com o mesmo estado de ordem que já guarda (`sort` em `AlbumCard`); a janela do álbum usa `TracksComparison.tsx` (a tabela no computador, as abas no celular; hoje as duas são desenhadas e o CSS esconde uma: a nova faz o mesmo). Cuidado: a comparação ordena na mão dela (`handleSort`, a popularidade começa decrescente) e o cartão de álbuns ordena por `models/albumTrackRows.js`; são duas ordens que **continuam duas** (copiar o que cada uma faz, não unificar).
2. **A janela do álbum**, partilhada: `ui/albumWindow/AlbumWindow.tsx`, sem loja e sem serviço (`reactStaysAtTheEdge`): recebe o álbum, `loadAlbum`, as fontes (`sources`, da tela de álbuns) e um conteúdo opcional acima das faixas (a seção de valor e «Where to buy», que são do inventário e ficam em `screens/inventory/`). A tela de álbuns abre a mesma janela pela mesma porta (`albumActions.ts`).
3. **A janela de adicionar ao inventário**: `screens/albums/InventoryAdd.tsx` (só a tela de álbuns a abre), pedida por `import()` no clique como hoje, com o formulário partilhado.
4. **O controlador da sessão em TypeScript** (`controllers/SeriesController.js`, 577 linhas, atrás de `react-bridge/legacy/SessionSeriesController.ts`): **proposta: não nesta onda** (ver «Perguntas», 1).

**Invólucros que esta onda aposenta** (na 6b): `react-bridge/legacy/TracksTable.tsx` e `react-bridge/legacy/AlbumWindows.ts` (os arquivos saem), e da lista `BRIDGE_USES` saem `screens/albums/AlbumCard.tsx` e `screens/albums/albumActions.ts` (mais a entrada temporária que a 6a põe, abaixo). Fica `screens/albums/index.ts` (o controlador da sessão, onda 8). Depois da onda 6, `react-bridge/legacy/` tem `OutputWindows.ts`, `RegeneratePanel.tsx` e `SessionSeriesController.ts`.

## A estrutura proposta em React

Pelas convenções das ondas anteriores (uma pasta por tela; peças partilhadas em `ui/` sem loja nem serviço; a ponte do controlador como `AlbumsBridge`; as regras tiradas dos desenhistas para `models/`, como a 5a fez com `seriesGroups.js` e `albumTrackRows.js`):

```
screens/inventory/
  index.ts              a rota: ReactView com prepare (controller.initialize, as duas assinaturas) e dispose (controller.dispose)
  InventoryBridge.ts    a «view» do controlador: render/showValues/showSeriesAdd/showRatings só contam e avisam
  Inventory.tsx         escolhe computador ou celular (usePhone); o aviso do Discogs da moldura num efeito
  Header.tsx            título, «N albums», os três contadores que filtram
  Totals.tsx            a faixa dos totais e a moeda (computador) e as duas linhas (celular)
  Notices.tsx           a rodada, os que esperam valor, as configurações de vendedor
  Filters.tsx           a linha de filtros do computador (busca, formato, ordem, grade/lista)
  CollectionActions.tsx os três botões (Add the albums of my series, Update ratings, Update values), usados pela linha e pela folha
  Grid.tsx, ItemCard.tsx, ItemRow.tsx, CardValue.tsx, StatusSelect.tsx
  phone/PhoneBar.tsx, PhoneList.tsx, PhoneRow.tsx, PhoneTile.tsx, PhoneEmpty.tsx, Sheets.tsx
  inventoryActions.ts   apagar (a pergunta da DialogService), abrir editar e ver
  types.ts              o contrato do controlador em JS, como screens/albums/types.ts
  (6b) ValueSection.tsx, BuyLinks.tsx, EditWindow.tsx
ui/albumWindow/AlbumWindow.tsx, PhoneBar.tsx, sources.ts      (6b)
ui/tracks/TracksComparison.tsx, TracksTable.tsx, TracksTabs.tsx (6b)
ui/inventoryItem/ItemForm.tsx                                  (6b)
ui/Breadcrumb.tsx   + inventoryTrail()                          (6a)
screens/albums/InventoryAdd.tsx                                 (6b)
models/inventoryCard.js   formatOf, originText, phoneProgress, totalText, moreOf (as regras dos desenhistas, puras)  (6a)
i18n/en|pt/inventory.js   (6a; a 6b acrescenta ui.albumWindow.*, ui.tracks.*, inventory.edit.*, albums.add.*)
```

**O que fica à mão atrás de invólucro, e por quê.** Na 6a: a janela do álbum com a seção de valor e a janela de editar, pela porta que já existe (`react-bridge/legacy/AlbumWindows.ts`, que ganha `openInventoryEdit` e passa a aceitar as opções do inventário e a devolver o `redrawValue`), com a entrada `screens/inventory/inventoryActions.ts` em `BRIDGE_USES`, só até a 6b. Motivo: é o mesmo corte da 5a/5b (a tela primeiro, as janelas depois), e as janelas são da tela de álbuns também. Na 6b: nada do inventário. Fora dos invólucros e por toda a onda, como nas outras telas: a `DialogService` (as perguntas), o `toast`, o motor da Folha por `ui/SheetWindow`; o controlador e `InventoryValues` em JS (não são invólucros: são a camada de baixo, REQ-04).

## A divisão em sub-ondas

Três, nesta ordem; cada uma se constrói, se prova e se julga sozinha, e vai sozinha para o trem.

### 6a — a tela (≈ 2.100 linhas à mão saem; a maior)

- **Arquivos:** tudo de `screens/inventory/` menos o da 6b; `ui/Breadcrumb.tsx` (+ `inventoryTrail`); `models/inventoryCard.js`; `i18n/en|pt/inventory.js`; `app.js` (a rota sob demanda, a lista do segundo plano, a importação do `inventoryWiring`); `react-bridge/legacy/AlbumWindows.ts` (as opções do inventário, `openInventoryEdit`); saem `views/InventoryView.js`, `InventoryPhoneSheets.js`, os cinco `views/renderers/Inventory*.js`, `components/ui/Card.js`, `components/Breadcrumb.js`, `utils/keepField.js` e as entradas deles no `handMadeScreensBaseline`; `complexityAllowlist` perde `Card.js:renderRankingBadge`.
- **Testes levados (contados pelas linhas `it(`; o número do executor é o que vale):** `test/views/InventoryView.gallery.phone` 19, `.phone` 15, `.ratings` 12, `.statusAndSeries` 14 (os 11 da janela vão na 6b), `.values` 25 (os 8 da janela vão na 6b), `.lowestForSale` 3 (2 vão na 6b; os outros 10 testam o modelo e o serviço e ficam como estão), `InventoryPhoneItemSheet` 2, `InventoryPhoneValues` 5, e o caso do inventário em `test/security/outsideTextIsText` (mais o caso do `Breadcrumb` antigo, que passa a ler `ui/Breadcrumb`): **≈ 97 casos levados**, o andaime trocado (`renderScreen`), a asserção intacta. Ficam sem mudar e verdes: os 73 do controlador, os de `test/models/inventory*` e `test/services/inventory/*`, `inventoryGalleryFinishing` e `tabletGridsHaveThreeColumns` (leem o CSS). Sai com o arquivo: `test/utils/keepField.test.js` (8). Novos: o teste-molde de sair; o «igual ao de antes»; os textos em inglês e em português; o texto de fora é texto.
- **Cenários dourados, capturados da tela à mão ANTES de tocá-la** (`test/support/inventoryScenarios.js` → `test/fixtures/inventoryBeforeF83.json`, pelo modelo de `reports/evidence/F83/wave-5b/capture-before.test.js`, com o fuso fixo, ver «Riscos»): o `#app`, o foco e **todas as chamadas** ao serviço, ao `InventoryValues` (via o serviço de valores de mentira de `test/helpers/inventoryValuesStub.js`), à `DialogService` e ao `toast`, em ≈ 45 cenários. Computador (1280): vazio; carregando (posto à mão); grade e lista com os três status, valores desligados; valores ligados com cada origem (Discogs sugerido, menor preço, escrito, nunca lido, lendo, falhou), as notas e o crédito; «N albums are waiting» com «Read them now»; o aviso das configurações de vendedor; câmbio ausente (moedas desabilitadas); EUR escolhido (a nota do câmbio, os valores convertidos); um contador apertado e apertado de novo; busca digitada (foco, texto e cursor) e busca sem resultado; formato Vinyl; as dez ordens (o sem valor por último nos dois sentidos); «Update ratings» ocupado, o outro travado, a pergunta acima de 30; «Add the albums of my series»: lendo, perguntando, escrevendo, nada a adicionar; uma rodada de «Update values» andando (o botão, o aviso com «Stop», um cartão trocado no lugar, a busca intacta), «Stop», o fim; apagar (pergunta, sim, falha); status trocado no cartão (sucesso e falha: o seletor volta); um link do cartão não abre janela; o aviso do Discogs na moldura; sair e voltar. Celular (393, e 820, que é celular desde a F88): a lista padrão; a galeria escolhida; os fantasmas das duas; os dois vazios; a barra (o selo de filtros com formato e ordem, «A–Z» e «1–N», o salto desabilitado no vazio); «Show 50 more» e o foco na primeira linha nova; «All N albums»; cada uma das seis folhas aberta e cada escolha delas; a linha do que roda com «Stop»; os totais e os avisos do celular; virar celular ↔ computador. Cobrir cada âncora `^inventory-…` de `docs/specs/info-arch.md` que é da tela (as da janela vão na 6b).
- **Peso:** o script principal **encolhe** (a view, os desenhistas, o controlador, os valores e seus modelos saem; o `inventoryWiring` fica); estimativa de 15 a 25 kB comprimidos, com ≈ 3 kB de volta pelos ≈ 250 textos em inglês. **O teto desce para o valor medido mais 144 B.** O arquivo da tela, sob demanda, deve ficar perto do teto de uma tela (30.000 B): a fonte comprimida, com os comentários, dá 54,7 kB; minificada, algo entre 20 e 30 kB. **Medir no primeiro build**; se passar, as seis folhas vão para um arquivo à parte, pedido no primeiro toque, em vez de subir o teto.

### 6b — as janelas (TASK-23c; ≈ 1.700 linhas à mão saem)

- **Arquivos:** `ui/albumWindow/*`, `ui/tracks/*`, `ui/inventoryItem/ItemForm.tsx`, `screens/inventory/ValueSection.tsx`, `BuyLinks.tsx`, `EditWindow.tsx`, `screens/albums/InventoryAdd.tsx`; `screens/albums/AlbumCard.tsx` e `albumActions.ts` passam às peças novas; saem `react-bridge/legacy/TracksTable.tsx` e `AlbumWindows.ts`, `components/ViewAlbumModal.js`, `InventoryValueSection.js`, `albumWindowSources.js`, `ranking/Tracks*.js`, `InventoryEditModal.js`, `InventoryAddModal.js` e as entradas deles; `BRIDGE_USES` perde três entradas; `complexityAllowlist` perde `InventoryEditModal.js:open` e `TracksTable.js:renderRow`.
- **Testes levados:** `test/components/ViewAlbumModal.failedSources` 7 e `.phone` 5, `test/components/ranking/TracksRankingComparison.popularity` 6, `TracksTable.averages` 3, `TracksTabs.phone` 6, e os da janela vindos da 6a (`statusAndSeries` 11, `values` 8, `lowestForSale` 2): **≈ 48 casos**. As janelas de editar e de adicionar **não têm teste nenhum hoje**: o dourado é a única rede; escreva os cenários antes. Os de álbuns que desenham a tabela do cartão aberto (`Albums.sameAsBefore`, 36 cenários contra `albumsBeforeF83.json`) têm de passar sem mudar o dourado.
- **Cenários dourados, das janelas à mão** (`test/support/albumWindowScenarios.js` → `test/fixtures/albumWindowBeforeF83.json`; ≈ 40): a janela aberta pela tela de álbuns (fontes boas, avaliações falhadas com «Try again», popularidade não conectada, falhada, sem dado) e pelo inventário (sem faixas: carregando → chegaram; não carregou; nenhuma; com faixas guardadas trocadas pelas de agora; a capa que chega; notas; «Paid» em BRL e USD; selo de status e de formato); a tabela ordenada por cada coluna nos dois sentidos e o «My Avg»; as abas do celular; cada corpo da seção de valor (as âncoras `^inventory-item-value-*` e `^inventory-item-where-to-buy`), escrever (válido, inválido, em EUR), voltar ao valor do Discogs, ler agora, Enter no campo, a dobra do celular; editar (item de série com «Not set», item com formato, cada campo, salvar, falha, cancelar, ✕); adicionar (padrões, trocar a moeda e o prefixo, sucesso, repetido, falha); Escape, fundo e ✕ de cada uma; a barra e o título do celular ao rolar.
- **Peso:** o script principal quase não muda (as janelas já são sob demanda; entram os textos em inglês delas, ≈ 120 chaves, ≈ 1,5 kB); a tabela de faixas passa a pesar no arquivo da tela de álbuns (ela já estava lá pelo invólucro); a janela do álbum vira um arquivo sob demanda próprio (estimativa 8 a 12 kB), baixado no primeiro «View».

### 6c — as frases dos modelos no dicionário (pequena; opcional, ver «Perguntas», 4)

Os modelos do inventário escrevem frases em inglês (≈ 88 lugares: `inventoryValue` 23, `inventoryValueRun` 17, `inventoryFromSeries` 13, `inventoryRatings` 13, `inventorySort` 10, `inventoryStatus` 7, `buyLinks` 5), e `models/` não importa `i18n/`. A 6c faz cada um devolver um código e os números (como `identityReasonOf` na 5a), e a tela ou o controlador traduzem; o inglês vai palavra por palavra para `i18n/en/inventory.js`. Nenhuma mudança visual; os testes dos modelos (≈ 150 casos) passam a afirmar o código com o mesmo sentido. Peso: neutro.

## Riscos e armadilhas desta tela

1. **A assinatura do `userStore` no `inventoryWiring`** (acima): a tela sob demanda sem a linha no `app.js` deixa o inventário vazio para quem já entrou. Teste vermelho antes: abrir o app com a pessoa já entrada e ir ao inventário pela primeira vez.
2. **O modo estrito roda o efeito duas vezes:** `controller.initialize()` num efeito chamaria duas vezes `values.open()` (duas perguntas ao servidor: a chave do Discogs e o câmbio) e `optimizedAlbumLoader.load()`, e assinaria a loja duas vezes. Vai no `prepare` da rota, como a tela de álbuns. **Nenhuma escrita no banco pode sair de um efeito**: as escritas são só de clique (`updateAlbum` de status, preço, valor escrito, valor esquecido; `keepReadings`/`setReadings` numa rodada e numa leitura de um álbum; `removeAlbum`; `addAlbumsAsNotOwned`; `updateAverages`; `addAlbum`). O dourado guarda as chamadas e compara uma a uma; a prova no navegador as troca por registros, como a 5b.
3. **`showDiscogsNotice` durante o desenho:** escrever numa loja que a moldura lê enquanto o React desenha a tela dá o aviso «Cannot update a component while rendering a different component». Num efeito, com o mesmo valor.
4. **Dinheiro:** use só as funções dos modelos (`formatMoney`, que arredonda com `roundToCents` ANTES de formatar, porque os motores arredondam a metade de modo diferente, F78; `moneyOf`, que cai na moeda do item sem câmbio; `convert`, `totalText` com «—» quando nada soma, e nunca «$0.00»), nunca `Intl` num componente. O «≈ » antes do valor, o `tabular-nums`, os símbolos (`R$ ` com espaço; € e £ sem). O campo de valor deriva o símbolo do texto de `formatMoney(0, moeda)` por expressão regular. O total converte do USD; o valor escrito é guardado em USD com duas casas.
5. **Datas:** `readOnText` escreve «20 Nov» com **espaço que não quebra** (` `) e `momentText` usa a **hora local**. Os dois douradores (antiga e nova) com o mesmo fuso fixo (`TZ` no comando), e a comparação de texto não normaliza o ` `.
6. **As folhas no WebKit e no site construído** (lição 10): a ref antes do gancho que faz a camada; a passada no **build** com o **WebKit de perfil de iPhone**, com toques de verdade nas seis folhas, não é opcional. O site construído não expõe a loja do inventário (lição 13): para os estados com itens no build, ver «Perguntas», 7.
7. **O foco:** `after` do gancho só com os desenhos inteiros (uma folha ou janela que fecha devolve o foco ao botão, e a tela não pode soltá-lo, lição 13); `keep` com a busca. O Chromium tira o foco de um botão que fica desabilitado (as três ações ficam `disabled` enquanto rodam); o React pode mantê-lo (lição 13, item 2): comparar no navegador e registrar. «Show 50 more» e o salto focam a linha **depois** de desenhá-la: `flushSync` antes do foco e do `scrollIntoView` (lição 12).
8. **O seletor de status do cartão:** controlado, o React o volta ao valor velho **antes** de a escrita terminar; a antiga mostra a escolha nova até o redesenho e volta só se falhou. `defaultValue` com a `key` do desenho (lição 10).
9. **A folha de ações leva os botões do computador** (os ids, o andamento escrito neles) e um ouvinte em captura a fecha antes do clique; na nova, os botões são os de `CollectionActions.tsx` lendo a ponte, e o clique fecha e então age, na mesma ordem.
10. **A rolagem:** a folha de filtros rola ao topo ao fechar se algo mudou (fica); a antiga não rola no redesenho inteiro (`keepField` devolve a rolagem): a nova não esvazia a página, então a rolagem fica sozinha. Conferir com uma lista longa, a 393, depois de trocar um status.
11. **O tamanho do arquivo da tela** perto do teto de 30.000 B (ver 6a).
12. **A `main` mexe no inventário** (a F89 e a F75 entraram ontem): um retrato capturado vale até a `main` mudar a tela (lição 12). Ver «Perguntas», 6.
13. **O `Card.js` faz pós-processamento** (tira classes e filhos, escreve `style`): porte o HTML final, não a API do `Card`; o atributo `style` comparado por `style.cssText` (como o roteiro da segunda junta).
14. **O ícone `Eye` não existe** em `utils/iconShapes.js`: o botão «View» do cartão da grade sai sem ícone. Copie o que a antiga desenha (lição 11), não o que ela pede.

## Defeitos de hoje que ficam como estão (candidatos a issue; nenhum consertado na migração)

1. Enquanto a leitura do inventário não volta, a tela mostra o **vazio** (o `isLoading` nunca é pintado; o `loading` da loja não é lido): no celular, «Your collection is empty» com o convite a adicionar a série.
2. Uma leitura que falha (`error` na loja) também aparece como vazio.
3. No computador a mesma frase para o inventário vazio e para o filtro sem resultado.
4. Editar: **dois avisos de sucesso** («Album updated» do controlador e «Inventory item updated» da janela); o ramo «Failed to update album» do controlador nunca roda (o serviço lança, não devolve falso); a falha mostra a mensagem crua do erro.
5. Editar **inventa a moeda BRL** para um item sem moeda (gravar as notas grava `currency: 'BRL'`), embora já não invente formato; um preço 0 é lido como vazio (`|| null`).
6. Adicionar: «Add to Inventory» continua apertável durante a escrita (dois toques podem adicionar duas vezes: a conferência de repetido corre contra a escrita); a linha de retorno da janela nunca é mostrada; BRL de início.
7. A janela do álbum escreve «Paid» só em BRL ou com «$» (EUR e GBP saem com «$»); um preço 0 não aparece.
8. A janela do álbum é posta no `body` e **fica aberta sobre a próxima tela** se a pessoa sair da tela por outro caminho (ver «Perguntas», 3); sem `role="dialog"`, sem prender o foco, sem foco ao abrir nem ao fechar.
9. As janelas de editar e de adicionar (casco `BaseModal`): sem Escape, sem fundo, sem foco (como a de editar série na 5b).
10. A comparação desenha um esqueleto pulsante por uma volta (`setTimeout(…, 0)`) e desenha a tabela **e** as abas (o CSS esconde uma).
11. O aviso do Discogs no rodapé fica ligado depois de sair do inventário, até a fonte ser desligada.
12. O botão «View» do cartão sem ícone (`Eye` inexistente).
13. `handleSortChange` e `handleUpdatePrice` do controlador não têm quem os chame (ficam: o controlador não muda).

## O que a música toca aqui

O inventário não toca música, mas usa as fontes do catálogo: a janela do álbum pede o álbum de agora à carga (`albumOfItem`, pela porta única da carga de álbuns, que acha pelo **Apple Music**); «Update ratings» lê a nota do BestEverAlbums e a popularidade do **Spotify** pela mesma porta (`albumAsks`); as médias mostram as duas com os ícones `Award` e `Spotify`. O caminho do Apple Music é o de primeira classe (o dono o usa); a prova troca a carga por álbuns postos, como na onda 5. **O que não dá para exercitar sem conta:** o MusicKit de verdade, a popularidade de uma conta Spotify conectada, e o Discogs de verdade (a chave é do servidor; a prova troca o serviço de valores pelo de mentira e nada sai para o Discogs).

## Os textos

≈ 270 lugares de texto à mão nas peças da tela e das janelas (`InventoryView` 31, `InventoryPhoneSheets` 26, `InventoryValueSection` 56, `InventoryAddModal` 20, `InventoryValueHeader` 20, `InventoryPhoneRow` 21, o controlador 16, `InventoryEditModal` 13, os outros abaixo de 12), mais os ≈ 88 dos modelos (6c). Inglês aberto, português fechado (`i18n/en/inventory.js`, `i18n/pt/inventory.js`; `ui.albumWindow.*`, `ui.tracks.*`). Plurais por `tPlural` («1 album» / «N albums», «Show N albums», «Add 1 album»); título, artista, notas e nomes de loja como texto. Ficam sem tradução: «Discogs», «BestEverAlbums», «Spotify», «Amazon», «iMusic», os códigos de moeda e «Data provided by Discogs.» (texto exigido pelos termos do Discogs; ver «Perguntas», 4).

## Perguntas abertas (o orquestrador decide; cada uma com a recomendação)

1. **O controlador da sessão de álbuns em TypeScript entra na onda 6?** Recomendação: **não**; fica para a onda 8, como o plano já diz. Ele não desenha nada, o invólucro dele tem 12 linhas, e a spec põe «passar o JavaScript existente para TypeScript» fora do escopo; trazê-lo para cá soma risco à tela de álbuns sem tirar uma linha à mão.
2. **Dividir em 6a (a tela), 6b (as janelas) e 6c (as frases dos modelos)?** Recomendação: **sim, nessa ordem**. É o corte da 5a/5b que funcionou; cada parte tem a sua prova; a 6b é a que toca a tela de álbuns e deve ir com a tela do inventário já estável.
3. **A janela do álbum fecha quando a tela sai?** Hoje fica sobre a próxima tela (posta no `body`). Recomendação: **fecha** (a mesma decisão da 5b para a janela de editar série), registrada como «muda de propósito».
4. **As frases dos modelos e os formatos de dinheiro e data em português.** Recomendação: a 6c leva as frases ao dicionário por códigos; **os formatos** («$1,948.00», «20 Nov», a hora em 24 h) **ficam os de hoje nos dois idiomas** até a F81 decidir o formato do português; «Data provided by Discogs.» fica em inglês (é o texto que os termos pedem).
5. **A assinatura do inventário na entrada.** Recomendação: o `app.js` importa o `inventoryWiring` (o inventário continua sendo lido quando a pessoa entra, como hoje; custa manter o serviço no script principal). A alternativa (a tela chamar `handleUserChange(userStore.getState())` ao abrir) muda quando o inventário é lido e o que a janela «Add to inventory» encontra: é mudança de comportamento.
6. **A `main` e o inventário durante a onda.** Recomendação: juntar a `main` na linha do React **logo antes** de a 6a capturar o dourado, e pedir que mudanças no inventário esperem a 6a (ou já venham em React depois dela); se alguma vier antes, recapturar (lição 12).
7. **Prova com itens no site construído.** O build não expõe a loja do inventário. Recomendação: um build de prova (`vite build --mode proof`, nunca publicado) que exponha só a loja para o roteiro, para a passada obrigatória das folhas no WebKit com perfil de iPhone; sem ele, o build prova só o vazio e as folhas que abrem sem itens (filtros, ações), e os estados com itens ficam no servidor de desenvolvimento (dizer qual foi qual).
8. **O vazio durante a leitura (defeito 1).** Recomendação: **manter** nesta onda (é o que a tela faz hoje) e abrir a issue; o conserto é pequeno, mas muda o que a pessoa vê, e a migração não muda o que se vê.

## Onde parou

O mapa está escrito; nada foi construído. Próximo passo, se o orquestrador aceitar a divisão: juntar a `main`, capturar o dourado da tela à mão (`inventoryBeforeF83.json`) e começar a 6a.
