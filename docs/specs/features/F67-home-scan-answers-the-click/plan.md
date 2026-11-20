<!-- docs/specs/features/Fxx-slug/plan.md — HOW. No edge of its own in the graph: the trace to the REQs is the
     cross-check before approval. -->
# Plan — Feature F67: O Scan da Home responde ao clique · Spec: [[spec]]
**Approved**: not a gate (via rápida; o MJRP julga)

> Escrito junto com o código (via rápida), no ramo `fix/f67-home-scan-answers`, em 2026-11-19.

## Architecture Approach
Sem camada nova e sem dependência nova. O desenho repete o da carga dos álbuns (`models/albumLoadState.js` + `AlbumLoadService`, ADR-0019): as regras do estado são funções puras num modelo, um dono guarda o estado, a tela é desenhada a partir dele, e toda resposta carrega a identidade de quem a pediu.

- **Modelo puro novo:** `public/js/models/scanState.js`. Estados, transições, contagem por tipo e os textos da tela (`describeScan`). Não importa nada do navegador.
- **Um dono:** `components/home/SearchController.js` guarda `this.scan` e só o muda por `_setScan`, que desenha.
- **Um desenho:** `views/HomeView.js` `renderScan(scan)` (botão, linha de status, mensagem do painel). A grade de álbuns do estado «resultados» continua no `DiscographyRenderer`, chamado pelo mesmo `_draw`.
- **Prazo como utilitário:** `public/js/utils/deadline.js` (`withDeadline`, `DeadlineError`), usado pelo serviço de busca e pelo início do MusicKit.
- **A classificação não foi reescrita.** A mesma regra (`AlbumTypeClassifier`) roda uma vez sem a lista da IA e, só quando algum álbum a pediu, outra vez com ela.
- **O defeito de ciclo de vida foi consertado no dono:** `router.js` `renderView`.

Refina no `docs/specs/arch.md`: nada (a busca da Home não está descrita lá). O `docs/specs/data-model.md` não muda: o estado da busca vive só na memória da tela.

## Technical Design
Fluxo: clique, Enter ou «Try again» → `SearchController.searchArtist` → `startScan` (estado «buscando», desenhado na hora) → `AlbumSearchService.scanArtist` → catálogo (prazo) → primeira classificação → `scanFound` (álbuns na tela, botão livre) → lista da IA (se precisa) → segunda classificação → `scanReclassified`.

- `public/js/models/scanState.js` (novo): `ScanStatus` (`idle`, `scanning`, `results`, `empty`, `failed`), `ScanFailure` (`timeout`, `error`), `idleScan`, `canStartScan`, `startScan` (nova geração), `scanFound`, `scanEmpty`, `scanFailed`, `scanReclassified` (todas devolvem o mesmo estado quando a geração não é a atual ou a busca já não espera aquela resposta), `countAlbumTypes`, `describeScan` (`{ busy, buttonLabel, statusLine, panel }`), `CATALOG_DEADLINE_MS = 15000` (REQ-01, REQ-02, REQ-03, REQ-05).
- `public/js/utils/deadline.js` (novo): `withDeadline(promise, ms, what)`, `DeadlineError` (`code: 'deadline'`), `isDeadlineError` (REQ-03).
- `public/js/components/home/SearchController.js`: dono do estado; `searchArtist` (uma busca por vez; campo vazio avisa), `_applyAiList`, `_setScan`, `_draw`, `dispose`; `results` virou leitura de `scan.albums`; os comandos são delegados a partir de `#app` e leem `#artistScanInput` na hora do evento; «Try again» (`#btnScanRetry`) busca `scan.query`; sem `alert`; `applyFilters` só desenha a grade no estado «resultados»; `calculateTypeCounts` saiu (a conta é do modelo) (REQ-01, REQ-02, REQ-04, REQ-05, REQ-07).
- `public/js/views/HomeView.js`: `renderScan`, `drawScanButton`, `createScanPanel` no lugar de `setLoading`; a linha de status com `role="status"`; `destroy` avisa o controlador para não desenhar mais (REQ-01, REQ-02, REQ-05).
- `public/js/controllers/HomeController.js`: `dispose`; `toast.warn`, que não existe, trocado por `toast.warning` (REQ-02).
- `public/js/services/album-search/AlbumSearchService.js`: `scanArtist(artistName)` devolve `{ albums, reclassified }`; `_catalogAlbums` (nome normalizado e, sem resultado, o alternativo, os dois dentro do mesmo prazo); `_classifyAll(albums, context)`; `_reclassifyWithAiList` (um pedido pago, prazo `AI_LIST_DEADLINE_MS = 60000`; lista vazia ou não sabida devolve `null`); lista já lembrada entra na primeira passada e não há segunda. `getArtistDiscography` mantém o comportamento (REQ-03, REQ-04).
- `public/js/services/musickit/MusicKitAuth.js`: `init` com prazo `MUSICKIT_INIT_DEADLINE_MS = 10000` sobre token, script e `configure`; cada início tem identidade e o que foi deixado para trás não marca nada como pronto; no `onload`, `window.MusicKit` já presente resolve na hora; a classe passou a ser exportada, para o teste (REQ-03).
- `public/js/router.js`: `renderView` com identidade por chamada (`renderRun`); a tela montada é a que a chamada criou; a chamada deixada para trás não desenha, não monta e não mostra «View Error»; o desenho saiu para `drawView` (REQ-06).

## UI/UX Design (if the feature touches a screen)
Sem desenho novo. Os textos estão em `models/scanState.js` e listados nas Open Questions da spec.

## Dependencies
Nenhuma.

## Documents Consulted
- `docs/specs/uat.md` (UAT-204), `MEMORY.md` (`## Now`), `AGENTS.md`
- `docs/decisions/0019-one-owner-for-the-album-load.md` e `public/js/models/albumLoadState.js` (o molde do estado puro com identidade)
- `docs/specs/behavior.md` (estados da Home), `docs/manual/14`, `16`, `19`, `20`, `21`, `22`
- `docs/specs/constitution.md` (complexidade até 10 nas funções novas)

Declarações do passo retroativo da via rápida (conferidas no histórico do repositório em 2026-11-19):
- `docs/specs/constitution.md` — sem mudança: nenhum padrão de código nem dependência novos
- `docs/specs/arch.md` — atualizado (commit `7f152fc`, da F57, onde entrou o `scanState` da F67)
- `docs/specs/data-model.md` — sem mudança: nenhuma entidade, campo ou esquema mudou
- `docs/specs/tech-stack.md` — sem mudança: nenhuma dependência nova
- `docs/specs/design-system.md` — sem mudança: o projeto não tem `docs/specs/design-system.md`; nenhum token, fonte ou componente compartilhado mudou
- `docs/specs/behavior.md` — atualizado (commit `dda2de7`)
- `docs/wiki/` — sem mudança: as páginas de `docs/wiki/` do projeto são só as do harness; nenhuma descreve uma regra do app que esta feature mudou

## Risks & Considerations
- **O prazo de 10 s do início do MusicKit vale para o app inteiro**, inclusive a carga dos álbuns e a exportação: onde antes só demorava, agora falha com nome e pode ser tentado de novo.
- **A chamada ao catálogo que passou do prazo continua correndo** no navegador; a resposta dela é ignorada. Uma nova tentativa faz outra chamada.
- **O roteador mudou no caminho de toda navegação.** `currentView` fica `null` entre o `destroy` da tela antiga e a criação da nova; não achei quem leia `router.currentView` nesse intervalo.
- **A primeira classificação pode mostrar álbuns eletrônicos em «?» por alguns segundos**, até a lista da IA chegar; a linha de status diz que os tipos estão sendo confirmados.
- **Nada disto foi visto num navegador por quem implementou.** Os testes rodam em jsdom, com o MusicKit, o catálogo e o servidor trocados por dublês.

## Test plan
> Derivado dos REQ do `spec.md` · 2026-11-19 18:40 (Brasília)

| REQ | Caso de teste | Critério / estado | Camada | Automatizado? |
|---|---|---|---|---|
| REQ-01 | `test/models/scanState.test.js`; `test/components/home/SearchController.scan.test.js` («answers the click at once») | um estado por vez; botão desabilitado, `aria-busy`, status e painel no clique · `^home-scan-one-state`, `^home-scan-loading` | modelo + controlador + tela | sim |
| REQ-02 | `SearchController.scan.test.js` («a click while scanning…», «a late answer of an older scan…», «after the screen is left…»); `scanState.test.js` | uma consulta ao catálogo; resposta velha não muda a tela · `^home-scan-late-answer` | modelo + controlador | sim |
| REQ-03 | `test/utils/deadline.test.js`; `AlbumSearchService.scan.test.js` («fails by deadline»); `test/services/musickit/MusicKitAuth.deadline.test.js`; `SearchController.scan.test.js` («failed by deadline») | 15 s e 10 s com relógio falso; nova tentativa começa do zero · `^home-scan-failed` | utilitário + serviço + tela | sim |
| REQ-04 | `AlbumSearchService.scan.test.js` («gives the albums as soon as the catalog answers»); `SearchController.scan.test.js` («shows the catalog albums before the AI list arrives») | álbuns na grade com a IA no ar; quantidades mudam depois · `^home-scan-found`, `^home-scan-classifying` | serviço + controlador + tela | sim |
| REQ-05 | `SearchController.scan.test.js` («no results», «failed… Try again», «an empty field answers too») | mensagem no painel, `alert` nunca chamado · `^home-scan-not-found`, `^home-scan-failed`, `^home-scan-empty-field` | controlador + tela | sim |
| REQ-06 | `test/router.overlap.test.js` (6 de 7 falhavam antes) | destino montado uma vez · `^app-route-one-owner` | roteador | sim |
| REQ-07 | `SearchController.scan.test.js` («reads the text of the field that is on screen», «the Enter key takes the same path») | campo lido na hora do evento | controlador + tela | sim |
| REQ-01 a REQ-07 | roteiro no navegador (TASK-09) | o que a pessoa vê em cada estado | navegador | não |

Bordas fora dos critérios (achados para a `mjrp-writing-reqs` se mudam o comportamento): `components/series/ArtistScanner.js` ainda espera a lista da IA antes de mostrar; os ouvintes diretos de `HomeController.bindEvents` continuam presos aos nós da montagem.
