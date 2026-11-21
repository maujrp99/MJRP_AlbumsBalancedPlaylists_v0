---
status: Done
lane: standard
solution_type: feature
imports: ["[[S-61-build-a-series-on-a-home-that-explains-itself]]"]
planned_for: "[[ROADMAP#^REL-41]]"
---
# Feature F79: A Home que se explica, para montar uma série
**Approved**: decidido pelo agente — revisável (dispensa de 2026-11-19)

## Summary
**A feature:** A Home vira um palco só: um título que diz o que o app faz, um campo que aceita um artista ou uma lista colada, a discografia em capas numeradas ao escolher, e a série presa embaixo como uma base de capas com o nome sugerido e «Create series»; no celular a base é a barra de ação.

**Por quê:** A tela de hoje fala em nomes de código («Initialize Load Sequence», «Stack Empty»), pede o nome antes de saber o que vai dentro, esconde a ação principal no computador e não diz o que é uma série nem o que vem depois.

**Como saber que funcionou:** Quem nunca viu a tela monta uma série de quatro álbuns de um artista em 6 cliques e 1 texto, com a ação principal sempre à vista, e depois de criar sabe onde a série ficou e o que fazer com ela.

## Problem Statement
Dito pelo MJRP em 2026-11-20, com uma captura da Home: «vamos utilizar as skills de UI e UX e de writing copy para melhorar essa seção inicial do site … Gostaria de ver uma proposta consolidar, elevar, transformar, considerando copy, elementos de UI e UX e usabilidade.» Ele escolheu o nível Transformar (19:19) e aprovou a rodada 2 (por volta das 22:15): «aprovado a home v2 … bora implementar».

## Requirements
- [REQ-01] Antes de qualquer controle, a Home diz o que o app faz e o que é uma série («Pick the albums. We blend the playlists.» e a frase da série) e mostra os três passos; a base vazia diz por que «Create series» está apagado. · from [[S-61-build-a-series-on-a-home-that-explains-itself|S-61]]
  verified_by:: `test/components/home/HomeStage.test.js`
- [REQ-02] Um campo só acha álbuns por artista: digitando, a ajuda aponta o próximo gesto; buscando, o botão fica ocupado («Searching…») e a tela diz o que está acontecendo; achado, o artista grande, «N studio albums · newest first», as fichas de tipo com a contagem («Compendiums», «Other») e «Add all N …»; não achado e sem resposta dizem a saída e o que ainda vale, com «Paste a list» e «Try again». · from [[S-61-build-a-series-on-a-home-that-explains-itself|S-61]]
  verified_by:: `test/components/home/HomeStage.test.js`, `test/models/homeSeries.test.js`
- [REQ-03] O mesmo campo aceita uma lista colada: cada linha diz «ready» ou o motivo antes do clique; «Add N albums» manda as linhas prontas; as linhas que não entraram ficam, cada uma num campo com o motivo, com «Add this line». · from [[S-61-build-a-series-on-a-home-that-explains-itself|S-61]]
  verified_by:: `test/models/homePaste.test.js`, `test/controllers/HomeController.bulk.test.js`
- [REQ-04] A série sendo montada fica sempre à vista na base: as capas numeradas (até sete, depois «+N»), o nome, «N albums from N artists · the order counts», «Create series»; a capa escolhida ganha o anel e o número; clicar de novo numa capa escolhida a tira, com «Undo»; «Add all» põe o que o filtro mostra, com «Undo». · from [[S-61-build-a-series-on-a-home-that-explains-itself|S-61]]
  verified_by:: `test/components/home/HomeDock.test.js`, `test/components/home/HomeSeriesList.test.js`
- [REQ-05] Mudar a ordem e tirar um álbum sem arrastar: «Edit order» abre o painel da série (no celular, a folha inteira) com a frase da ordem e ↑ ↓ ✕ de 44 px por linha; a linha movida fica marcada; tirar deixa «Removed «X». Undo» por 8 segundos. · from [[S-61-build-a-series-on-a-home-that-explains-itself|S-61]]
  verified_by:: `test/components/home/HomeDock.test.js`, `test/components/home/HomePhone.dock.test.js`
- [REQ-06] O nome é sugerido pelos artistas como texto de verdade («Pink Floyd selection», «Joni Mitchell and Yes», «Joni Mitchell, Yes and more») com «suggested · edit it»; editar o mantém; com o nome vazio, «Create series» não cria e pede o nome, oferecendo o sugerido. · from [[S-61-build-a-series-on-a-home-that-explains-itself|S-61]]
  verified_by:: `test/models/homeSeries.test.js`, `test/controllers/HomeController.create.test.js`
- [REQ-07] Criar diz o que acontece: «Creating…» e «Saving your series…»; gravada, ««nome» is saved», onde ela fica, «Blend it now» (o Blend com a série escolhida), «Open the series» e «Start another series»; as capas perdem os números e um clique começa outra série; falhou, os álbuns ficam e o botão vira «Try again». · from [[S-61-build-a-series-on-a-home-that-explains-itself|S-61]]
  verified_by:: `test/controllers/HomeController.create.test.js`
- [REQ-08] Quem não entrou com uma conta lê, na base (no celular, sob o campo), que a série fica guardada só neste navegador, com «Sign in». · from [[S-61-build-a-series-on-a-home-that-explains-itself|S-61]]
  verified_by:: `test/components/home/HomeDock.test.js`, `test/components/home/HomePhone.dock.test.js`
- [REQ-09] No celular a base **é** a barra de ação da F76 (`.phone-action-bar`): a capa com a contagem, o nome com reticências, «Tap to edit or reorder» e «Create series» de 48 px; a série abre na folha `full` com o nome no topo e «Create series» no pé; alvos de 44 px, margem de 16 px, a fonte de texto abaixo dos títulos. · from [[S-61-build-a-series-on-a-home-that-explains-itself|S-61]]
  verified_by:: `test/components/home/HomePhone.dock.test.js`, `test/components/home/HomePhone.toolbar.test.js`, `test/architecture/phoneStylesStayOnThePhone.test.js`
- [REQ-10] A identidade com papel: um fogo por vez («Search» enquanto nada foi achado nem escolhido, depois «Create series», depois «Blend it now»); o equalizador parado quando pronto, em movimento enquanto espera, baixo quando a resposta não veio, e as palavras dizem o mesmo; com `prefers-reduced-motion`, nada se mexe. · from [[S-61-build-a-series-on-a-home-that-explains-itself|S-61]]
  verified_by:: `test/models/homeSeries.test.js`, `test/components/home/HomeStage.test.js`, `test/components/home/HomeMotion.test.js`
- [REQ-11] A janela de edição de série, que usa a mesma peça de escolher álbuns, continua funcionando: busca, filtros (com «Other» no lugar de «?»), capas e escolha. · from [[S-61-build-a-series-on-a-home-that-explains-itself|S-61]]
  verified_by:: `test/components/series/SeriesEditModal.test.js`, `test/architecture/oneAlbumPicker.test.js`

## Observable States
- [[info-arch#^home-empty]] · [[info-arch#^home-typing]] · [[info-arch#^home-searching]] · [[info-arch#^home-discography]] · [[info-arch#^home-dock-one]] · [[info-arch#^home-albums-chosen]] · [[info-arch#^home-dock-many]] · [[info-arch#^home-dock-reorder]] · [[info-arch#^home-dock-removed-undo]] · [[info-arch#^home-paste-list]] · [[info-arch#^home-paste-report]] · [[info-arch#^home-artist-not-found]] · [[info-arch#^home-catalog-error]] · [[info-arch#^home-name-missing]] · [[info-arch#^home-creating]] · [[info-arch#^home-created]] · [[info-arch#^home-create-failed]] · [[info-arch#^home-guest]]
- O comportamento que muda: [[behavior#^home-album-added-to-stack]] (clicar de novo tira, com Undo), [[behavior#^home-series-default-name]] (sai: nunca «New Album Series» em silêncio).

## Prototype Parity (if the feature touches a screen)
- Prototype: design/inception/home-transformar-v2.html — approved in info-arch.md § Protótipos aprovados (Home (F79) · Transformar v2)
- Transversal layer touched: tokens and fonts (o degradê «flame» de duas paradas, Syne no computador e a fonte de texto no celular); shared components (a peça de escolher álbuns da F57: o cartão do álbum ganha uma forma da Home, as fichas leem os nomes de `models/albumPicker.js`; a Folha da F76; a `.phone-action-bar`); responsiveness (1280 e 393).
- Design-system cuts or swaps: nenhum corte. Decididos pelo agente — revisáveis: a cor A (sem a terceira parada `#fdba74`), o texto branco 19 px peso 800 sobre o fogo; a Folha do celular usa o botão de fechar da própria Folha (com o nome «Done») no lugar do «Done» em texto do protótipo, porque a Folha `full` do design system tem o fechar sempre à vista.

## Success Criteria
- Na primeira visita, a 1280 x 900, o título, a frase da série, o campo e «Create series» (apagado, com o porquê) estão à vista sem rolar.
- Com quatro álbuns escolhidos, a 1280 x 900 e a 393 x 852, «Create series» está à vista sem rolar.
- Quatro álbuns de um artista viram uma série em 6 cliques e 1 texto (o artista, «Search», 4 capas, «Create series»; o nome já vem sugerido).
- Clicar de novo numa capa escolhida a tira e «Undo» a devolve ao mesmo lugar.
- Com o nome vazio, nenhuma série é criada e a tela pede o nome.
- Depois de criar, «Blend it now» abre `/blend?seriesId=<id>` e «Open the series» abre `/albums/<id>`.
- Com movimento reduzido, nenhum elemento da Home anima.
- A janela de edição de série busca, filtra e escolhe como antes.

## Out of Scope
- Arrastar para mudar a ordem (↑ ↓ basta; decidido na rodada 2).
- A página de entrada para quem não entrou e a rota raiz (F80, outro agente).
- O texto como copy deck (o texto em inglês é proposta do agente).
- A janela de edição de série muda só o nome do filtro «?» → «Other»; o resto dela fica como está (inclusive «Scan»).

## Open Questions
- A cor A ou B, o texto branco ou preto sobre o fogo, os padrões D1 a D9 e «Compendiums»: o MJRP não respondeu; decidido pelo agente — revisável (registro em `info-arch.md` § Protótipos aprovados).
- A mensagem de falha ao gravar: o protótipo diz «the connection dropped»; a construção só diz isso quando a falha é de rede (o navegador sem conexão ou o Firestore indisponível) e, nas outras, «The series was not saved.» — decidido pelo agente, revisável, para não afirmar uma causa que não se sabe.
