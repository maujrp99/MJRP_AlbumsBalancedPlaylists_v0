<!-- docs/specs/features/Fxx-slug/plan.md — HOW. No edge of its own in the graph: the trace to the REQs is the
     cross-check before approval. -->
# Plan — Feature F49: O botão de carregar mais álbuns de uma série funciona · Spec: [[spec]]
**Approved**: not a gate (via rápida; o MJRP julga)

> Escrito junto com o código (via rápida), no ramo `fix/f49-load-more-albums`, em 2026-11-19.

## Architecture Approach
<!-- How it fits arch.md; components affected; what this plan refines in arch.md and data-model.md. -->
Sem camada nova e sem dependência nova. O desenho repete o da paginação da F51 (`models/paging.js`): a regra é função pura num modelo, um dono guarda o estado, e a grade é desenhada a partir dele a cada redesenho. Nada fica guardado no DOM.

- **Modelo puro novo:** `public/js/models/seriesExpansion.js`. O limite (`SERIES_ALBUM_LIMIT = 12`), o corte (`cutAlbums`) e o estado da visita (`SeriesExpansion`: as séries abertas e o escopo a que pertencem). Não importa nada.
- **Um dono do estado:** a tela. `views/SeriesView.js` cria um `SeriesExpansion` no construtor; o roteador cria uma `SeriesView` nova a cada visita (`app.js:122-123`), então sair da tela esquece a escolha sem código a mais. A troca de escopo não recria a tela (o seletor de série chama `controller.loadScope`), por isso a tela diz o escopo ao estado a cada desenho (`syncExpansionScope`), e um escopo diferente do último esvazia a lista.
- **Um caminho para o clique:** o ouvinte que a tela já tem na raiz (`components/series/SeriesEventHandler.js`), que agora conhece `load-more-series` e avisa a tela (`onShowAllAlbums`). O ouvinte próprio da grade, que ninguém chamava, saiu.
- **Nenhuma carga nova.** A carga já pede todos os álbuns de cada série da página (`SeriesController.requestLoad`); o clique só guarda a escolha e pede o redesenho que o controlador já oferece (`controller.refresh()`), a partir do que a store tem. O serviço de carga e o controlador não foram tocados.

Refina no `docs/specs/arch.md`: nada (o corte é de desenho; a seção da carga não muda). O `docs/specs/data-model.md` não muda: a escolha vive só na memória da tela.

## Technical Design
<!-- Data flow first · components/modules (what each receives, renders or returns, emits) · API/interface
     changes · explicit file paths. Each component names the REQ-xx it addresses. -->
Fluxo: clique (ou Enter/Espaço no botão) → `SeriesEventHandler.handleClick` → `handleSeriesAction('load-more-series', id)` → `SeriesView.showAllAlbums(id)` → `expansion.expand(id)` → `controller.refresh()` → `SeriesView.updateAlbums` → `SeriesViewUpdater.updateGrid(…, expansion.list())` → `SeriesGridRenderer.render` com `props.expandedSeriesIds` → `grid.focusAlbum(id, 12)`. Todo redesenho seguinte (carga, página, filtro) passa pelo mesmo `updateAlbums` e leva a mesma lista.

- `public/js/models/seriesExpansion.js` (novo): `SERIES_ALBUM_LIMIT`; `cutAlbums(albums, expanded)` devolve `{ shown, hidden }`; `SeriesExpansion` com `syncScope(scopeKey)`, `expand(seriesId)`, `isExpanded(seriesId)`, `list()` (REQ-01, REQ-02, REQ-03).
- `public/js/components/ui/LoadMoreButton.js`: `render(seriesId, hidden)` recebe quantos álbuns estão retidos; `type="button"`; singular e plural; nada quando `hidden` não é maior que zero. Saiu o import de `SafeDOM`, que não era usado (REQ-03, REQ-04).
- `public/js/components/series/SeriesGridRenderer.js`: `_renderRealSeriesGroup` lê `props.expandedSeriesIds` e usa `cutAlbums`; `focusAlbum(seriesId, index)` novo; `_attachEventListeners` e `_handleLoadMore` removidos (código sem chamador, que mexia no DOM por fora do redesenho). O mesmo `_renderRealSeriesGroup` serve o desenho direto e o bloco preguiçoso (`_hydrateSeriesGroup`) (REQ-01, REQ-03, REQ-04, REQ-05).
- `public/js/components/series/SeriesEventHandler.js`: `handleSeriesAction` ganhou o caso `load-more-series`, que chama `props.onShowAllAlbums(seriesId)` (REQ-01, REQ-04).
- `public/js/views/SeriesView.js`: `this.expansion` no construtor; `onShowAllAlbums` em `setupEventHandler`; `showAllAlbums(seriesId)`; `syncExpansionScope(scope, seriesId)`, chamado em `updateAlbums`; `updateAlbums` passa `this.expansion.list()` ao atualizador (REQ-01, REQ-02).
- `public/js/views/helpers/SeriesViewUpdater.js`: `updateGrid` ganhou o nono parâmetro `expandedSeriesIds` (padrão `[]`) e o repassa à grade (REQ-02).
- Não tocados: `controllers/SeriesController.js`, `services/albums/AlbumLoadService.js`, `stores/albumLoad.js`, `views/albums/AlbumsScopedRenderer.js` (a lista expandida segue sem corte, REQ-05).

## UI/UX Design (if the feature touches a screen)
<!-- References the observable states of the spec (the judged prototype); details with ASCII mocks and the
     user flow as needed. Where each piece of the transversal layer comes from (the design system's CSS and fonts,
     the shared components — consumed, never redrawn), and the scenarios the visual sensor compares. -->
Sem desenho novo: o botão usa as classes que já tinha. Estado observável: `^library-series-more-albums` do `docs/specs/behavior.md`. Não há sensor visual para esta tela; a conferência é a prova no navegador (TASK-06 do `tasks.md`).

## Dependencies
<!-- New dependencies with their justification — aligned with constitution.md and PRINCIPLES.md (Constitution
     Check); contradicting either needs a recorded decision first (mjrp-recording-decisions). -->
Nenhuma.

## Documents Consulted
<!-- arch.md, data-model.md, info-arch.md, behavior.md, design-system.md, constitution.md, the NFR nodes. -->
- `docs/specs/uat.md` (UAT-06), `MEMORY.md` (`## Now`), `AGENTS.md`
- `docs/specs/arch.md` (seção da carga da tela de álbuns e a seção 16, paginação), `public/js/models/paging.js` (o molde da regra pura)
- `docs/specs/behavior.md` (estados da biblioteca de séries), `docs/manual/09`, `12`, `15`, `29`
- `docs/specs/constitution.md` (complexidade até 10 nas funções novas ou mudadas)

## Risks & Considerations
- **O esquecimento por escopo depende de a tela ser desenhada no outro escopo.** `syncScope` roda em `updateAlbums`; `loadScope` sempre provoca um desenho (`requestLoad` ou, na falha, `renderFromStore`), então ir a uma série e voltar passa por ele. Um caminho futuro que troque o escopo duas vezes sem desenhar entre elas manteria a escolha.
- **O foco no primeiro álbum novo dura até o redesenho seguinte.** Com a carga ainda correndo, a grade é redesenhada inteira e o foco cai, como já caía para qualquer botão da grade.
- **A F56 mexe em `SeriesController.js` e `AlbumLoadService.js`;** esta feature não tocou em nenhum dos dois. Se a F56 mudar a assinatura de `SeriesViewUpdater.updateGrid` ou de `SeriesView.updateAlbums`, o conflito é nas linhas listadas no relatório de entrega.
- **Nada disto foi visto num navegador por quem implementou.** Os testes rodam em jsdom, com o serviço de carga trocado por um dublê que responde na hora.

## Test plan
> Derivado dos REQ do `spec.md` · 2026-11-19 20:10 (Brasília)

| REQ | Caso de teste | Critério / estado | Camada | Automatizado? |
|---|---|---|---|---|
| REQ-01 | `test/views/SeriesView.loadMore.test.js` («the click shows the rest of that series in place…», «the load asks for every album of a series on screen…»); `test/components/series/SeriesGridRenderer.loadMore.test.js` («draws every album of a series the person opened…», «opening one series leaves the others cut») | 15 cartões na ordem, sem botão, nenhum pedido novo à carga · `^library-series-more-albums` | tela inteira (jsdom) + componente | sim |
| REQ-02 | `SeriesView.loadMore.test.js` («…outlives the redraws that the load causes», «…outlives a change of page and of filter», «…forgotten when the scope changes», «…forgotten when the screen is left»); `test/models/seriesExpansion.test.js` | a série aberta sobrevive a redesenho, página, busca; esquecida com o escopo e com a tela | tela inteira + modelo | sim |
| REQ-03 | `SeriesGridRenderer.loadMore.test.js` («draws the first 12 albums and a button that says how many…», «says "1 more album" in the singular»); `seriesExpansion.test.js` (`cutAlbums`) | «Load 3 more albums», «Load 1 more album», sem botão até 12 | componente + modelo | sim |
| REQ-04 | `SeriesGridRenderer.loadMore.test.js` («the button is a real button…», «moves the focus to the first album the click brought»); `SeriesView.loadMore.test.js` (o foco depois do clique) | `<button type="button">`, sem `tabindex` negativo, foco no 13º cartão | componente + tela inteira | sim; o Enter/Espaço e o contorno de foco só no navegador (TASK-06) |
| REQ-05 | `SeriesGridRenderer.loadMore.test.js` («the list layout has no cut…»); `SeriesView.loadMore.test.js` («the list has no cut, and going back to the grid keeps the choice», a série sozinha em «…forgotten when the scope changes») | lista e série sozinha com todos os álbuns e sem botão | componente + tela inteira | sim |

Bordas fora dos critérios (achados para a `mjrp-writing-reqs` se mudam o comportamento): o número do botão cresce enquanto a carga da série corre, porque conta só álbuns achados; uma série com 12 achados e outros ainda carregando não mostra botão até o décimo terceiro chegar. É o que o cabeçalho da série já faz com a contagem.
