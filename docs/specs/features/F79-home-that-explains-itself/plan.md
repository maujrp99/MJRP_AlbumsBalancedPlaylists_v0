# Plan — Feature F79: A Home que se explica, para montar uma série · Spec: [[spec]]
**Approved**: decidido pelo agente — revisável (dispensa de 2026-11-19)

## Architecture Approach
A Home continua uma tela do site (vanilla JS, `views/HomeView.js` + `controllers/HomeController.js`), frame da peça única de escolher álbuns da F57 (`components/album-picker/AlbumPickerController.js`): a busca, o estado dela (`models/scanState.js`) e os filtros (`models/albumPicker.js`) não mudam de dono. O que muda é a moldura: o painel da esquerda e a lista «Selected Albums» saem; entram o palco (título, campo único, equalizador), os resultados e a **base da série**. As regras novas (nome sugerido, contagens, um fogo por vez, rótulos, a leitura da lista colada) são funções puras em `models/`; os componentes desenham a partir delas. Nada muda em `arch.md` além de a Home ganhar componentes próprios em `components/home/` (a pasta já existe). A escrita da série continua pelo `SeriesService` (`createSeries`), sem mudança no `data-model.md`.

## Technical Design
Fluxo: clique ou tecla → `HomeController` muda o estado (a lista da série no `StagingAreaController`, o estado da criação, o desfazer) → as regras puras dizem o que mostrar → `HomeView` e `HomeDock` desenham. A busca segue pelo porto de três métodos do picker (`drawScan`, `drawFilters`, `drawAlbums`).

| Módulo | O que recebe e o que devolve ou desenha | REQ |
|---|---|---|
| `public/js/models/homeSeries.js` (novo, puro) | `suggestName(albums)`, `nameAfterChange(name, albums)`, `seriesCountLine(albums)`, `flameOf({ chosen, results, created })`, `addAllLabel(visible, chosenIds)`, `typesLine(filters, n, classifying)`, `dockEmptyNote({ phone, coversOnScreen })`, `stageIsBig(...)`, `equalizerState(scan)` | 01, 02, 04, 06, 10 |
| `public/js/models/homePaste.js` (novo, puro) | `checkPastedLines(text)` → linhas com `ready` ou o motivo; `pasteSummary(lines)`; `pasteReport({ added, skipped })` → a frase e as linhas que ficam para corrigir. Lê cada linha por `parsePastedAlbumLine` (`models/albumQuery.js`) e usa `readPastedList` / `SkipReason` de `models/bulkPaste.js` | 03 |
| `public/js/models/albumPicker.js` | o filtro «?» passa a chamar «Other» (as duas telas) | 02, 11 |
| `public/js/views/renderers/DiscographyRenderer.js` | uma segunda forma do cartão, `variant: 'stage'` (botão com a capa quadrada, o «+» ou o número, o título e o ano); a forma de sempre continua na edição de série. Continua o único que desenha `pick-album` (fitness F57) | 04, 11 |
| `public/js/components/home/StagingAreaController.js` | a lista da série: `addAlbum`, `removeAlbum`, `moveAlbum`, `insertAlbum`, `addMany`, `restore`, `clear`; sai o Sortable (arrastar fica fora) e o `StagingAreaRenderer` | 04, 05 |
| `public/js/components/home/HomeEqualizer.js` (novo) | as barras do equalizador (48, 32 no celular, 5 na base) e o estado `still` / `live` / `flat` | 10 |
| `public/js/components/home/HomePasteList.js` (novo) | a lista colada como linhas editáveis (uma por álbum), com o número, o texto e «ready» ou o motivo; colar várias linhas abre várias; o rodapé com a contagem e «Add N albums» / o relatório e «Add this line» | 03 |
| `public/js/components/home/HomeDock.js` (novo) | a base: no computador, a barra presa embaixo, o painel acima dela e a faixa Undo; no celular, a `.phone-action-bar` e a Folha `full` (`components/ui/Sheet.js`) com o nome, a frase da ordem, as linhas ↑ ↓ ✕ e «Create series» no pé; o aviso de visitante | 04, 05, 06, 07, 08, 09 |
| `public/js/views/HomeView.js` | o palco e os resultados; a marca na capa escolhida (anel e número, nos dois tamanhos); os estados da busca no texto da Home | 01, 02, 04, 10 |
| `public/js/controllers/HomeController.js` | o estado da Home (modo, nome, criação, desfazer por 8 s, painel aberto), «Add all», a lista colada, criar com `SeriesService.createSeries` e o depois («Blend it now» → `/blend?seriesId=<id>`, «Open the series» → `/albums/<id>`) | 02–08 |
| `public/css/views/home.css` | o desenho do computador (a v2) e `prefers-reduced-motion` | 01–10 |
| `public/css/mobile/home.css` | o celular, só dentro de `@media (max-width: 767px)` | 09 |

Saem: `components/home/HomePhoneChosen.js` (a base do celular toma o lugar) e `views/renderers/StagingAreaRenderer.js`.

## UI/UX Design (if the feature touches a screen)
A referência é `design/inception/home-transformar-v2.html` (os 18 estados, `#s=<id>`, a 1280 e a 393). Os padrões vêm de `docs/specs/design-system.md` § «Home · rodada 2 da F79» (aprovada) e § Celular (barra de ação, Folha, medidas); as cores do fogo são as do `tailwind.config.js` (`#f97316 → #dc2626`). O CSS do protótipo (`design/proposals/f79-home/build/transformar-v2.css`) é a fonte das medidas, renomeado para o prefixo `home-` e sem as regras do quadro do protótipo (marcas e wireframe). O visual é conferido lado a lado com o protótipo nas duas larguras (`reports/evidence/F79/`); o projeto não tem o sensor visual configurado (`sensors.visual` comentado no contrato), então a conferência é por capturas e medidas no navegador.

## Dependencies
Nenhuma nova. Sai o uso do `sortablejs` na Home (o pacote continua, se outra tela o usa).

## Documents Consulted
`design/proposals/f79-home/proposal.md` (Rodada 2, «Entregar para construir»), `docs/specs/info-arch.md` (Estados da Home F79), `reports/audits/2026-11-20-mjrpalbumblender-v0-f79-home-r2-ux-audit.md`, `docs/specs/design-system.md`, `docs/specs/behavior.md` (§ Home), `test/architecture/oneAlbumPicker.test.js` (as regras da F57), `test/architecture/phoneStylesStayOnThePhone.test.js`, `test/architecture/complexityLimit.test.js`, `public/js/components/ui/Sheet.js`, `public/css/mobile.css`.

## Risks & Considerations
- **A peça compartilhada.** A edição de série usa o mesmo picker, o mesmo cartão e os mesmos filtros: a Home ganha uma forma do cartão por opção, e o teste da edição roda a cada tarefa.
- **Gravar em produção.** O ambiente local escreve no Firestore de produção; a prova de «Create series» é por testes com o serviço trocado, e no navegador a escrita é trocada por uma falsa pela página (nunca uma série real).
- **Foco ao redesenhar.** A base se redesenha a cada mudança da série; o campo do nome não pode perder o foco nem o texto enquanto a pessoa digita.
- **Complexidade.** Nenhuma função nova passa de 10 (o teste da F58).
- **Testes que leem o texto de hoje** («Initialize Load Sequence», «Scan» na Home, «New Album Series», «?») mudam com o texto novo.
