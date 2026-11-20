---
status: In Progress
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-185", "UAT-193"]
planned_for: "[[ROADMAP#^REL-40]]"
---
<!-- docs/specs/features/Fxx-slug/spec.md — the folder is the feature (Fxx, two digits).
     status: In progress while the cycle runs; Done when every task is closed and every REQ has verified_by.
     imports: the requirement nodes this feature delivers (1..n), each Ready, each in no other open feature.
     A transversal NFR node constrains every feature (review it with constitution.md), so a product feature does not import
     it. The exception is an engineering feature (a refactor planned by an ADR, infrastructure): `solution_type: fix`, `fixes: [UAT-xx]` of the
     debt issues (required: the card takes its release from them), and `imports:` only the NFR it serves, named by a
     `violates:: [[NFR-xx-<slug>]]` in the Problem Statement — no story invented for it. A debt against a constitution
     article imports nothing and says `violates:: [[constitution#N]]` of an article that exists. -->
# Feature F57: Uma peça só para escolher álbuns de um artista
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** Criar uma série (Home) e editar uma série usam a mesma peça para buscar um artista, agrupar os álbuns por tipo e escolher; um classificador só diz o tipo de cada álbum, com o motivo; álbuns de estúdio aparecem como álbuns de estúdio nas duas telas. Salvar a edição responde na hora.

**Por quê:** A Home e a janela de edição mostravam a mesma busca de dois jeitos, por dois caminhos, e álbuns de estúdio conhecidos caíam em «?» por causa do nome de um gênero.

**Como saber que funcionou:** Buscando «Kendrick Lamar» nas duas telas, os filtros e o conteúdo são os mesmos, e «To Pimp a Butterfly» e «good kid, m.A.A.d city» estão em «Studio».

## Problem Statement
O MJRP, em 2026-11-19: «os 2 albuns mais famosos e aclamados do kendrick lamar na busca, apareceram em (?) na home»; e «a parte edit de albuns deve ter uma logica diferente tb na busca de albuns pra adicionar e salvar demora pra dar feedback na tela as vezes — sugiro investigar possivel melhoria e verificar a necessidade real das logicas de edit como um todo (na playlist tb) serem diferentes das de adicionarem… como podemos melhorar a arquitetura disso».

O que o código fazia, lido antes do conserto (linhas da `main` em `89ff06c`; o mapa inteiro e a tabela de diferenças estão no [[plan]]):

- **Por que os dois álbuns do Kendrick Lamar caíam em «?».** O classificador tinha duas definições de «eletrônico». A larga (`services/album-search/classification/ElectronicGenreDetector.js:12-54`, usada pelo `GenreGateStrategy.js:23-29`) procurava cada nome da lista como **pedaço** do nome do gênero (`:69`, `g.includes(e)`), e a lista tem «hardcore» (`:43`). O catálogo dá a esses dois álbuns o gênero «Hardcore Rap» (e não o dá a «DAMN.» nem a «Section.80»): o portão de gênero os tratava como eletrônicos e não respondia «Album». As regras seguintes (faixas de remix, quantidade de faixas) não se aplicam a um álbum de 16 faixas. A definição estreita, escrita de novo dentro do orquestrador (`AlbumTypeClassifier.js:75` e `:102`: electronic, dance, trance, house, techno, edm), decidia se a lista da IA era consultada, e para «Hardcore Rap» dizia que não. Sem resposta de ninguém, o álbum saía como «Uncategorized» (`:125`). A lista da IA nunca era pedida para eles. Reproduzido em teste com as formas que o catálogo dá.
- **O buraco não era do Kendrick Lamar.** Em `public/assets/data/albums-curated.json` (38.560 álbuns lidos do catálogo), 501 álbuns têm «Hardcore Rap» (JAY-Z, Nas, Eminem, 2Pac, Wu-Tang Clan…) e 7 têm só «Lounge»: 508 no mesmo buraco. Outros 123 têm «Modern Dancehall», que as duas listas tratavam como eletrônico por conter «dance».
- **Palavras do título procuradas por pedaço.** `TitleKeywordStrategy.js` marcava como coletânea ou ao vivo o título que contivesse o pedaço: «Everybody Scream» («cream», nome de série de DJ mix), «Love Over Gold», «Low-Life (Definitive)», «Band on the Run (Archive Collection)», «Beethoven: Violin Concerto» («in concert»).
- **Dois caminhos de busca do artista.** A Home pedia `AlbumSearchService.scanArtist` (`:109`, prazo de 15 s, álbuns antes da lista da IA — F67); a edição pedia `getArtistDiscography` (`:91`), sem prazo, que só devolve depois de a lista da IA responder (até 60 s) — os «cerca de 8 s» do cenário 17 da regressão. Cada tela tinha a sua instância ou a sua vez de pedir a lista paga.
- **Duas telas para a mesma tarefa.** `components/home/SearchController.js` + `views/HomeView.js` (um estado da busca, seis filtros com quantidades, cartão com capa) e `components/series/ArtistScanner.js` (sem estado único, quatro filtros sem quantidades — «Albums», «Singles/EPs», «Live», «Compilations» —, linha de texto, «sem categoria» escondido dentro de «Albums» em `:162`, falha só por aviso e sem «tentar de novo»).
- **Salvar a edição sem resposta na tela.** `SeriesEditModal.js:136-164`: o botão não mudava enquanto a gravação corria, um segundo clique gravava de novo, e a falha era só um aviso que some.

**As duas precisam ser diferentes?** Não. As duas viram a escolha na consulta que a série guarda pela mesma função (`toAlbumQuery`). A única diferença real é o destino da escolha: na Home, o conjunto da série nova; na edição, a lista da série em edição. Todo o resto era divergência sem dono.

## Requirements
<!-- Local IDs, two digits. Each REQ traces to an imported node; none is invented here.
     Functional and non-functional (performance, security, accessibility) alike are REQ-xx. -->
- [REQ-01] Um classificador só diz o tipo de um álbum do catálogo (estúdio, EP, single, ao vivo, compilação, não classificado) e o motivo, tirado de uma lista fechada; é uma função pura, e só o serviço de busca a chama. · fixes UAT-185
  verified_by:: `test/models/albumType.test.js`, `test/architecture/oneAlbumPicker.test.js`
- [REQ-02] Nenhum álbum fica sem categoria por causa do gênero: «To Pimp a Butterfly» e «good kid, m.A.A.d city (Deluxe Version)» são álbuns de estúdio; «eletrônico» tem uma definição só, por nome inteiro de gênero; o único «não classificado» é o álbum eletrônico de duração cheia que a lista da IA, quando veio, não tem. · fixes UAT-185
  verified_by:: `test/models/albumType.test.js`, `test/services/album-search/AlbumSearchService.scan.test.js`
- [REQ-03] As palavras do título só contam inteiras, e as que também são nota de edição («collection», «essential», «the complete», «classics») só contam fora dos parênteses; nome de série de DJ mix só conta em álbum eletrônico. · fixes UAT-185
  verified_by:: `test/models/albumType.test.js`
- [REQ-04] Há um caminho só para buscar os álbuns de um artista (`scanArtist`: prazo de 15 s no catálogo, álbuns antes da lista da IA, a lista paga pedida uma vez por artista no app inteiro), usado pela Home e pela edição de série. · fixes UAT-193
  verified_by:: `test/services/album-search/AlbumSearchService.scan.test.js`, `test/services/album-search/AlbumSearchService.aiList.test.js`, `test/architecture/oneAlbumPicker.test.js`
- [REQ-05] A Home e a edição de série usam a mesma peça de escolher álbuns: os mesmos estados da busca (parada, buscando, resultados, sem resultados, falhou com «Try again»), os mesmos seis filtros com as quantidades e o mesmo cartão; as telas diferem só no que fazem com a escolha. · fixes UAT-193
  verified_by:: `test/components/home/HomePicker.scan.test.js`, `test/components/series/SeriesEditModal.test.js`, `test/models/albumPicker.test.js`, `test/architecture/oneAlbumPicker.test.js`
- [REQ-06] Na edição de série, o álbum escolhido entra na lista como a consulta que a série guarda, sem repetir; nada é gravado antes de «Save Changes». · fixes UAT-193
  verified_by:: `test/components/series/SeriesEditModal.test.js`, `test/models/seriesDraft.test.js`
- [REQ-07] Salvar a edição responde na hora: o botão fica ocupado e desabilitado enquanto a gravação corre, um segundo clique não grava de novo, e a falha é dita dentro da janela, que continua aberta com o que a pessoa escolheu. Sem `alert`. · fixes UAT-193
  verified_by:: `test/components/series/SeriesEditModal.test.js`, `test/models/seriesDraft.test.js`
- [REQ-08] Títulos em outro alfabeto não são agrupados num álbum só. · fixes UAT-185
  verified_by:: `test/services/album-search/AlbumSearchService.scan.test.js`

## Observable States
<!-- What the imported nodes point_to: the screen state in info-arch.md (the prototype the human judged —
     PRINCIPLES.md §I.13) or the behavior state in behavior.md. N/A only if the nodes point to none. -->
N/A: a feature não importa nenhum requisito (conserto de issue). Estados do `docs/specs/behavior.md` reescritos para o que o código faz agora: `^home-scan-one-state`, `^home-scan-empty-field`, `^home-scan-loading`, `^home-scan-found`, `^home-scan-classifying`, `^home-discography-type-filters`, `^home-discography-filter-empty`, `^home-album-added-to-stack`, `^series-edit-modal`, `^series-edit-messages`. Estados novos: `^album-type-one-classifier`, `^series-edit-album-picker`, `^series-edit-saving`.

## Prototype Parity (if the feature touches a screen)
- Prototype: none. Nenhuma tela foi redesenhada por protótipo. O que muda à vista: **na janela «Edit Series»**, a busca de álbuns passa a ter os seis filtros da Home com as quantidades, os cartões com capa em grade (no lugar das linhas com «+»), a linha de status, a espera, «nenhum álbum» e «falhou» com «Try again» no painel; o botão «Save Changes» mostra «Saving…» e a falha aparece em vermelho dentro da janela. **Na Home**, nada muda de lugar; o texto do filtro sem álbuns passa a «No albums of the selected types.».
- Transversal layer touched: `services/album-search/AlbumSearchService.js` (uma instância para o app) e `views/renderers/DiscographyRenderer.js` (o cartão, agora nas duas telas).
- Design-system cuts or swaps: none. O projeto não tem `design-system.md`; a janela usa as classes que a Home já usava.

**Prototype**: none — MJRP, 2026-11-20 00:10: «eu dispenso prototipo por que estávamos arrumando e consertando problemas passados com pequenas melhorias e nao trabalhando em grande features nova, portanto por ora os prototipos estao dispensados.»

## Success Criteria
- Com as formas que o catálogo dá a «To Pimp a Butterfly» e «good kid, m.A.A.d city (Deluxe Version)» (gênero «Hardcore Rap»), o classificador responde «Album» com o motivo `default-studio`, com ou sem lista da IA, e a lista da IA não é pedida.
- Um álbum de cada tipo, em forma real, cai no tipo certo: edição deluxe, EP, single, ao vivo, compilação, trilha sonora, artista eletrônico com e sem a lista da IA.
- A janela de edição mostra os mesmos seis filtros da Home, na mesma ordem (teste que compara as duas telas montadas).
- Com a gravação no ar, o botão de salvar está desabilitado e três cliques fazem uma gravação; com a gravação falhando, a janela continua aberta com a lista.
- `test/architecture/oneAlbumPicker.test.js` falha se um segundo classificador, um segundo caminho de busca ou uma segunda peça aparecer.
- Suíte: 1521 testes passando (1417 antes da feature); `vite build` compila.

## Out of Scope
- **Playlists (a outra metade da UAT-193):** gerar e editar playlists seguirem caminhos próprios é do ramo `fix/f62-blend-and-export-do-what-they-say`; não lido nem tocado aqui.
- **A busca de um álbum só** (`AlbumSearchService.search`, a do «Bulk Paste», que hoje não acha «Jay-Z - The Blueprint»): depende da regra de identidade (F68); não tocada. Segue com complexidade 11 (F58).
- **Um componente de tela único, dono também do quadro:** a Home e a janela usam a mesma peça e as mesmas partes desenhadas, mas cada uma monta o seu quadro (onde ficam o campo, os filtros e a grade). Ver o [[plan]], «O que falta unificar».
- **Escolher entre edições do mesmo álbum:** o agrupamento continua mostrando a primeira edição que o catálogo devolve (por isso «good kid, m.A.A.d city» aparece como «(Deluxe Version)»). `VariantPickerModal.js`, que faria isso e ninguém importava, foi removido.
- **Participação em álbum de outro artista** («Set Precedent (feat. Kendrick Lamar)», do Mykestro, em «Studio»): o catálogo o devolve na lista do artista e ele é um álbum de estúdio; separar pede um tipo novo ou um filtro por artista, decisão de produto.
- **O arquivo de busca de 8 MiB que carrega quando o app abre** (item 5.2 do mapa da v5.0) e **os álbuns do grupo «Uncategorized» da tela de álbuns que não podem ser removidos** (5.5): não são da peça de escolher álbuns; ficam sem dono.
- A regra de identidade, o serviço de carga dos álbuns, o blend, as playlists e o servidor: não tocados.

## Open Questions
<!-- ALL resolved before Plan. -->
- **Álbum eletrônico sem a lista da IA aparece em «Studio», não em «?» — decidido pelo agente, revisável.** Antes, todo álbum eletrônico de duração cheia ficava em «?» até a lista chegar, e para sempre quando ela falhava ou vinha vazia. Agora aparece em «Studio» e só vai para «?» o que a lista, quando vem, não tem. A tela mostra «confirming album types…» enquanto isso.
- **A ordem «o catálogo antes do título» foi mantida** (um «X - EP» que o catálogo marca como single continua single). — decidido pelo agente, revisável.
- **Palavras de coletânea que saíram da lista: «gold», «definitive», «complete» (ficou «the complete»).** Marcavam álbuns de estúdio («Love Over Gold», «Low-Life (Definitive)»). «ABBA Gold» só é coletânea agora se o catálogo disser. — decidido pelo agente, revisável.
- **«Live in» no começo do título ou de uma parte dele passa a ser ao vivo** («Live in Europe», «Rainbow: Live In Europe»); no meio de uma frase, não («We Live In A Society»). — decidido pelo agente, revisável.
- **A regra feita para uma série de um artista («Hello World N», do Ferry Corsten, forçada a EP) virou regra geral:** um número sobrando no título não casa com o álbum de mesmo nome da lista da IA. Esses lançamentos passam de «EP» para «?». — decidido pelo agente, revisável.
- **Os textos novos, em inglês como o resto do app — propostos pelo agente, a julgar pelo MJRP:** «No albums of the selected types.», «Saving…», «The series could not be saved. Your changes are still here: you can try again.», «Give the series a name before saving.», «The database is not ready yet. Nothing was saved; your changes are still here.».
