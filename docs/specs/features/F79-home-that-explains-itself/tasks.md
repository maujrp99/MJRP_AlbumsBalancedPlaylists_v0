# Tasks — Feature F79: A Home que se explica, para montar uma série · Plan: [[plan]]
**Approved**: decidido pelo agente — revisável (dispensa de 2026-11-19)

## Pre-Implementation
- [x] rodada de desenho com `mjrp-designing-ui`: três níveis lado a lado no comparador, com a tela de hoje como «Referência»; rodada 2 do Transformar
- [x] texto da tela (proposta do agente, `design/proposals/f79-home/proposal.md` § Rodada 2)
- [x] crítica de UX por agente separado (`mjrp-critiquing-ux-ui`): rodada 1 e rodada 2, passa
- [x] o MJRP escolheu (Transformar) e aprovou a v2 (2026-11-20, por volta das 22:15); a F79 em «Priorizada»
- [x] o ramo `feat/f79-home-that-explains-itself`, da `main`

## Implementation
- [x] TASK-01 as regras puras da Home em `models/homeSeries.js` e `models/homePaste.js` (nome sugerido, contagens, um fogo por vez, rótulos, a leitura da lista colada) — testes `test/models/homeSeries.test.js`, `test/models/homePaste.test.js` verdes · implements:: REQ-02, REQ-03, REQ-04, REQ-06, REQ-10 · model:: opus · rounds:: 1
- [x] TASK-02 a peça compartilhada: «?» vira «Other» em `models/albumPicker.js`; o cartão `variant: 'stage'` em `DiscographyRenderer.js`; a edição de série intacta — `albumPicker`, `SeriesEditModal`, `oneAlbumPicker` verdes · implements:: REQ-02, REQ-11 · model:: opus · rounds:: 1
- [x] TASK-03 a lista da série em `StagingAreaController.js` (sem arrastar; `addMany`, `restore`, `clear`) — `test/components/home/HomeSeriesList.test.js` verde · implements:: REQ-04, REQ-05 · model:: opus · rounds:: 1
- [x] TASK-04 o palco e os resultados em `HomeView.js` / `HomeController.js` (título, campo, «Search», ajuda, equalizador, três passos, buscando, discografia com fichas e «Add all», não encontrado, sem resposta) e `components/home/HomeEqualizer.js` — `test/components/home/HomeStage.test.js` verde · implements:: REQ-01, REQ-02, REQ-10 · model:: opus · rounds:: 2
- [x] TASK-05 a lista colada no mesmo campo (`components/home/HomePasteList.js`): linhas checadas, «Add N albums», o relatório com as linhas para corrigir e «Add this line» — `test/controllers/HomeController.bulk.test.js` verde · implements:: REQ-03 · model:: opus · rounds:: 1
- [x] TASK-06 a base do computador (`components/home/HomeDock.js`): capas numeradas, nome sugerido, contagem, «Edit order» com o painel ↑ ↓ ✕, Undo de 8 s, capa escolhida com anel e número, clicar de novo tira, «Add all» com Undo, aviso de visitante — `test/components/home/HomeDock.test.js` verde · implements:: REQ-04, REQ-05, REQ-06, REQ-08 · model:: opus · rounds:: 2
- [x] TASK-07 criar: nome faltando, «Creating…», criada («Blend it now», «Open the series», «Start another series», capas sem número e um clique começa outra), falhou com «Try again» — `test/controllers/HomeController.create.test.js` verde · implements:: REQ-06, REQ-07 · model:: opus · rounds:: 1
- [x] TASK-08 o celular: a base é a `.phone-action-bar`, a série na Folha `full` com o nome, as linhas e «Create series» no pé; o aviso de visitante sob o campo; `public/css/mobile/home.css` só dentro da consulta do celular; sai `HomePhoneChosen.js` — `test/components/home/HomePhone.dock.test.js`, `HomePhone.toolbar.test.js`, `phoneStylesStayOnThePhone` verdes · implements:: REQ-05, REQ-08, REQ-09 · model:: opus · rounds:: 2
- [x] TASK-09 o movimento: o equalizador e o esqueleto param com `prefers-reduced-motion` (nada se mexe) — `test/components/home/HomeMotion.test.js` verde · implements:: REQ-10 · model:: opus · rounds:: 1
- [x] TASK-12 (UAT-281) a Start enxuta no celular, aprovada pelo MJRP («Aprovo a versão enxuta»): título de 26 px, «What is a series?» abre a frase na folha de baixo, sob o campo só «or paste a list», sem os três passos, a barra só com a primeira capa, o aviso de visitante só com álbuns, «An artist» no campo; o computador não muda — `test/models/homeSeries.test.js`, `test/components/home/HomeLean.phone.test.js`, `phoneStylesStayOnThePhone` verdes; prova no site construído em `reports/evidence/F79/start-lean/` · implements:: REQ-08, REQ-09 · model:: sonnet · rounds:: 1

## Verification
- [x] TASK-10 a suíte inteira, o lint e o build pela fila da máquina; a edição de série sem regressão · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07, REQ-08, REQ-09, REQ-10, REQ-11 · model:: opus · rounds:: 2
- [x] TASK-11 paridade visual com o protótipo aprovado: os estados construídos capturados a 1280 e a 393 ao lado dos do protótipo, num servidor local deste ramo, sem gravar no Firestore de produção; evidência em `reports/evidence/F79/` · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07, REQ-08, REQ-09, REQ-10 · model:: opus · rounds:: 2

## Documentation
- [x] `docs/specs/behavior.md` (a Home nova; `^home-album-added-to-stack` vira «clicar de novo tira, com Undo»), o manual da Home, `info-arch.md` (e a página gerada), `design-system.md`, uma entrada do `docs/log.md` por commit
