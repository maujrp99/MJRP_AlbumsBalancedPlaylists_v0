<!-- docs/specs/features/Fxx-slug/plan.md — HOW. No edge of its own in the graph: the trace to the REQs is the
     cross-check before approval. -->
# Plan — Feature F63: Home e navegação que respondem · Spec: [[spec]]
**Approved**: not a gate (via rápida; o MJRP julga)

> Escrito junto com o código (via rápida), no ramo `fix/f63-home-and-navigation-answer`, em 2026-11-19.

## Architecture Approach
Sem camada nova e sem dependência nova. Cada conserto foi feito no dono da coisa, não em quem a usa:

- **O histórico do navegador tem um dono, o roteador.** `router.js` ganhou `redirect(path)` (troca a entrada que está saindo) e `setAddress(path, { replace })` (a tela muda o próprio endereço sem ser desenhada de novo, e o roteador continua sabendo onde a pessoa está: `currentUrl`, que a guarda da F60 usa). Quem escrevia o histórico por fora passou a pedir ao roteador. Um teste de arquitetura recusa a escrita por fora.
- **Um leitor só da linha «Artista - Álbum».** `models/albumQuery.js` já era o lugar único que lê uma consulta de álbum (`parseAlbumQuery`: o primeiro « - » separa). `parsePastedAlbumLine` foi posto ali, por cima dele, com o que só uma linha colada tem. Os outros leitores (`seriesFilter`, `askedAlbum`, `ownRanking`, `albumFacts`, `SeriesEditModal`, `CatalogAdapter`) não mudaram.
- **A colagem em lote como dado, pura:** `models/bulkPaste.js` (novo) lê a lista e diz o que a tela mostra; o `HomeController` só coordena e a `HomeView` só desenha. É o mesmo desenho do Scan da F67 (`models/scanState.js`).
- **O diálogo responde sempre:** `services/DialogService.js` guarda como responder «cancelar» e o usa no Esc e quando outro diálogo toma o lugar.
- **O menu da conta com estado próprio** (`aria-expanded`), em `components/navigation/AuthNav.js`, com um ouvinte de clique e um de teclado na página por instância, religados sem acumular a cada redesenho do topo.
- **A visibilidade das ações da linha de faixa** mora no `TrackRow` (um lugar), não em quem passa o botão.

Refina no `docs/specs/arch.md`: nada (o roteador e a Home não estão descritos lá). O `docs/specs/data-model.md` não muda.

## Technical Design
- `public/js/router.js`: `redirect(path, state)` pergunta às guardas como `navigate`, chama `history.replaceState` e trata a rota; `setAddress(path, { replace })` escreve o endereço (nada, se já é o atual) e atualiza `currentUrl`; o endereço sem tela usa `redirect('/home')` (REQ-01, REQ-04).
- `public/js/app.js`: as quatro rotas que só mandam adiante (`/`, `/callback`, `/album-series`, `/series`) usam `router.redirect` (REQ-01, REQ-04).
- `public/js/controllers/SeriesController.js`: `loadScope(scopeType, seriesId, skipCache, { entering })` escreve o endereço do escopo por `router.setAddress(scopeAddress(seriesId), { replace: entering })`; `scopeAddress` é a função única do endereço do escopo. `views/SeriesView.js` `mount` passa `{ entering: true }`; `views/helpers/SeriesViewHandlers.js` perdeu o `history.replaceState` repetido (REQ-01).
- `public/js/models/albumQuery.js`: `PastedLineProblem` (`blank`, `no-separator`, `no-album`) e `parsePastedAlbumLine(line)` → `{ ok: true, artist, title }` ou `{ ok: false, problem }`. Passos: tirar o marcador de lista da frente; trocar travessão entre espaços e tab por « - »; recusar a linha que termina no separador; `parseAlbumQuery`; sem artista, tentar o hífen com espaço de um lado só; sem artista ou sem álbum, `no-separator` (REQ-02).
- `public/js/models/bulkPaste.js` (novo): `SkipReason`, `readPastedList(text)` → `{ entries, skipped }` com o número da linha na caixa; `bulkInputState(text)` → `empty` | `valid` | `invalid`; `toStagedAlbum(match)`; `bulkOutcome({ added, skipped })` → `{ tone, message, report, leftInBox }` (REQ-02, REQ-03).
- `public/js/controllers/HomeController.js`: `validateBulkInput` (uma linha), `handleBulkProcess` (complexidade 4), `stageBulkEntries`, `stageBulkEntry` (devolve `null` ou o motivo), `showBulkOutcome` (REQ-02, REQ-03, REQ-07).
- `public/js/views/HomeView.js`: `#bulkPasteReport` (`role="status"`), `setBulkBusy`, `setBulkInputState`, `renderBulkReport` (REQ-03).
- `public/js/components/navigation/SeriesDropdown.js`: `renderLink` para o que existe e `renderSoon` para o que ainda não: sem endereço, `aria-disabled` (REQ-05).
- `public/js/services/DialogService.js`: `_show(modal, onDismiss)`, `dismiss()`; `confirm` e `prompt` passam a própria resposta de cancelamento (REQ-06).
- `public/js/components/navigation/AuthNav.js`: `#userMenuBtn` (`aria-haspopup`, `aria-expanded`, `aria-controls`), `#userMenu` (`role="menu"`), `attachMenuListeners`, `detachListeners`, `setMenuOpen`, `handleDocumentClick`, `handleDocumentKeydown` (REQ-08).
- `public/js/components/ui/TrackRow.js`: `ACTIONS_VISIBILITY` (`[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-within:opacity-100`), `aria-label` e `type="button"` nos botões; `components/playlists/PlaylistGrid.js` deixou de esconder o ✕ pela segunda vez (REQ-08).
- `public/js/components/blend/BlendSeriesSelector.js`: `selectById(seriesId)`, `revealChosenCard`, cartões com `role="button"`, `tabindex`, `aria-pressed`, Enter e espaço; `public/js/views/BlendingMenuView.js` `mount(params)` lê `params.query.seriesId` depois da carga das séries (REQ-09, REQ-10).
- `public/js/algorithms/*.js`: 28 textos traduzidos (REQ-10).

## UI/UX Design (if the feature touches a screen)
Sem desenho novo. Os textos novos estão em `models/bulkPaste.js` e listados nas Open Questions da spec.

## Dependencies
Nenhuma nova. O teste `test/architecture/interfaceInEnglish.test.js` usa o `espree`, que já vem com o ESLint (dependência de desenvolvimento do projeto).

## Documents Consulted
- `docs/specs/uat.md` (UAT-201, UAT-10, UAT-11, UAT-13, UAT-26, UAT-27, UAT-192, UAT-07; UAT-12 e UAT-14 para o contexto da UAT-11), `MEMORY.md` (`## Now`), `AGENTS.md`
- `reports/audits/2026-11-19-mjrpalbumblender-v0-browser-regression.md` (cenários e seção 6), `reports/audits/2026-11-19-mjrpalbumblender-v0-v5-map.md` (tema 5), `reports/audits/2026-11-19-mjrpalbumblender-v0-earlier-reports-vs-v5-plan.md` (seção C)
- `docs/specs/features/F67-home-scan-answers-the-click/` (o molde do estado puro e o conserto do roteador), `test/router.overlap.test.js`
- `docs/specs/behavior.md`, `docs/manual/` (08, 11, 13, 15, 17, 19, 21, 24, 29, 99)
- `docs/specs/constitution.md` (complexidade até 10 nas funções novas)

Declarações do passo retroativo da via rápida (conferidas no histórico do repositório em 2026-11-19):
- `docs/specs/constitution.md` — sem mudança: nenhum padrão de código nem dependência novos
- `docs/specs/arch.md` — sem mudança: nenhum componente, fluxo técnico ou integração novos
- `docs/specs/data-model.md` — sem mudança: nenhuma entidade, campo ou esquema mudou
- `docs/specs/tech-stack.md` — sem mudança: nenhuma dependência nova
- `docs/specs/design-system.md` — sem mudança: o projeto não tem `docs/specs/design-system.md`; nenhum token, fonte ou componente compartilhado mudou
- `docs/specs/behavior.md` — atualizado (commit `c21c830`)
- `docs/wiki/` — sem mudança: as páginas de `docs/wiki/` do projeto são só as do harness; nenhuma descreve uma regra do app que esta feature mudou

## Risks & Considerations
- **O roteador mudou no caminho de quatro rotas e da tela de álbuns.** `redirect` troca a entrada: quem chega por `/album-series` não volta mais para `/album-series` (era o defeito). Na tela de álbuns, entrar não acrescenta entrada; trocar de série acrescenta, como antes.
- **O menu da conta não abre mais ao passar o mouse.** É mudança de comportamento para quem usa mouse; a julgar pelo MJRP.
- **As classes `[@media(hover:hover)]:…` são variantes arbitrárias do Tailwind**, geradas na compilação (conferido no CSS de `npx vite build`). Num aparelho que diz ter mouse e tela de toque ao mesmo tempo, o ✕ segue a regra do mouse.
- **O teste de idioma é pragmático:** lê todas as strings (inclusive as do console) e conhece uma lista curta de palavras; português sem acento e fora da lista passa.
- **Os cartões de série do blend ganharam `role="button"`:** o leitor de tela passa a anunciá-los como botões.
- **Nada disto foi visto num navegador por quem implementou.** Os testes rodam em jsdom, com o catálogo, o Firestore e o Spotify trocados por dublês. A aparência (a lista das linhas puladas, o ✕ em tela de toque, o menu aberto) é do integrador.

## Test plan
> Derivado dos REQ do `spec.md` · 2026-11-19 19:50 (Brasília)

| REQ | Caso de teste | Critério / estado | Camada | Automatizado? |
|---|---|---|---|---|
| REQ-01 | `test/router.history.test.js` (7 casos); `test/controllers/SeriesController.address.test.js` (3); `test/architecture/historyOwnedByRouter.test.js` (2) | redirecionar troca a entrada; entrar numa série não acrescenta; só o roteador escreve o histórico · `^app-back-goes-back`, `^app-route-redirects`, `^home-series-created` | roteador + controlador + arquitetura | sim |
| REQ-02 | `test/models/bulkPaste.test.js` (tabela: 24 linhas lidas, 7 recusadas); `test/controllers/HomeController.bulk.test.js` («searches a name with a hyphen whole») | artista e álbum certos na busca · `^home-bulk-format-hint` | modelo + controlador | sim |
| REQ-03 | `HomeController.bulk.test.js` («skips the bad line…», «a line the catalog does not have…», «no line went in», «an album already selected…», «while it searches…»); `bulkPaste.test.js` (`bulkOutcome`) | linha pulada listada com número, texto e motivo; as outras entram; `alert` nunca chamado · `^home-bulk-skipped`, `^home-bulk-processed`, `^home-bulk-nothing-found`, `^home-bulk-failed` | modelo + controlador + tela | sim |
| REQ-04 | `test/router.overlap.test.js` (F67); `test/services/spotify/SpotifyAuthSignal.test.js` (F50); `router.history.test.js` («a route that redirects (as /callback)…») | destino montado uma vez; botão «Connected»; uma entrada no histórico · `^app-route-one-owner` | roteador + componente | sim |
| REQ-05 | `test/router.links.test.js` | os três itens «Soon» não são links e o endereço não muda · `^app-main-menu` | componente + roteador | sim |
| REQ-06 | `test/services/DialogService.dismiss.test.js` (4 casos) | Esc responde `false` / `null`; o diálogo trocado responde · `^app-confirm-dialogs` | serviço | sim |
| REQ-07 | `HomeController.bulk.test.js` («an empty box says what is missing…») | aviso e nenhuma busca · `^home-bulk-empty` | controlador + tela | sim |
| REQ-08 | `test/components/AuthNav.menu.test.js` (7 casos); `test/components/ui/TrackRow.touch.test.js` (4) | clique abre e fecha; clique fora e Esc fecham; `aria-expanded`; ações sem `opacity-0` solto · `^auth-user-menu`, `^playlists-track-row` | componente | sim (a aparência: não) |
| REQ-09 | `test/views/BlendingMenuView.fromSeries.test.js` (4 casos) | série marcada e passo 2 liberado; `seriesId` desconhecido não escolhe · `^blend-series-from-address` | tela + componente | sim |
| REQ-10 | `test/architecture/interfaceInEnglish.test.js`; `test/architecture/oneTabTitle.test.js` | nenhuma string em português em `public/js`; um título · `^blend-recipe-choice` | arquitetura | sim |
| REQ-11, REQ-12, REQ-13 | nenhum | não entregues | — | — |

Bordas fora dos critérios (achados para a `mjrp-writing-reqs` se mudam o comportamento): (1) um artista cujo nome tem « - » com espaços dos dois lados é cortado no primeiro; (2) um artista chamado como um número de lista («1. Algo») perde o prefixo; (3) duas linhas iguais na mesma colagem: a segunda é dita «already in the selection».
