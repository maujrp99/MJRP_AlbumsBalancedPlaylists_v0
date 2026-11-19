<!-- docs/specs/features/Fxx-slug/plan.md — HOW. No edge of its own in the graph: the trace to the REQs is the
     cross-check before approval. -->
# Plan — Feature F57: Uma peça só para escolher álbuns de um artista · Spec: [[spec]]
**Approved**: not a gate (via rápida; o MJRP julga)

> Escrito junto com o código (via rápida), no ramo `fix/f57-one-album-picker-and-one-classifier`, em 2026-11-19. As linhas citadas na primeira seção são da `main` em `89ff06c`, antes do conserto.

## O problema, estabelecido antes do código

### Os dois fluxos, de ponta a ponta (antes)

| Passo | Home (criar uma série) | Janela «Edit Series» |
|---|---|---|
| Quem manda | `components/home/SearchController.js` (dono do estado da busca, F67), dentro de `controllers/HomeController.js` | `components/series/ArtistScanner.js`, dentro de `components/series/SeriesEditModal.js:114` |
| Estado da busca | um, em `models/scanState.js` (parada, buscando, resultados, vazio, falhou), com geração por busca | nenhum: mexe direto no botão e num texto de dica (`ArtistScanner.js:108-134`) |
| O que pede ao catálogo | `AlbumSearchService.scanArtist` (`:109`) → `_catalogAlbums` (`:147`) → `musicKitService.getArtistAlbums`, com prazo de 15 s (`:111`) | `musicKitService.init()` (`ArtistScanner.js:114`) e `AlbumSearchService.getArtistDiscography` (`:91`) → o mesmo `_catalogAlbums`, **sem prazo** |
| Instância do serviço | uma por visita à Home (`HomeController.js:17`, `new AlbumSearchService()`): a lista da IA lembrada some ao sair | a instância única exportada (`ArtistScanner.js:3`) |
| Lista da IA | pedida **depois** de os álbuns aparecerem; os álbuns são classificados de novo quando chega (`:117-125`, `_reclassifyWithAiList`) | pedida **antes**: nada aparece até ela responder (`_processDiscography`, `:207`), até 60 s |
| Como classifica | `albumTypeClassifier.classify` em `_classifyAll` (`:223`) | o mesmo `_classifyAll` |
| Filtros | seis, com quantidades: «Studio», «EPs», «Singles», «Live», «Compendiums», «?» (`views/HomeView.js:161-166`, `SearchController.js:8-10`) | quatro, sem quantidades: «Albums», «Singles/EPs», «Live», «Compilations» (`ArtistScanner.js:56-59`); «sem categoria» entra em «Albums» (`:162`) |
| Como mostra | cartão com capa em grade, selos de edição e de tipo (`views/renderers/DiscographyRenderer.js`), do mais novo ao mais antigo | linha com capa pequena, título, ano e «+» (`ArtistScanner.js:173-214`), na ordem do catálogo |
| Sem resultado | mensagem no painel («No albums found for «x».») | texto «No albums found.» (`:123`) |
| Falha | mensagem no painel com «Try again»; falha por prazo dita como tal | aviso «Failed to search artist» e «Search failed.» (`:129-130`); sem «tentar de novo» |
| Busca em dobro | um clique com a busca correndo não faz nada | o botão é desabilitado; Enter no campo começa outra |
| Resposta atrasada | ignorada (geração; `dispose` ao sair) | desenha na janela mesmo depois de fechada |
| Escolher | clique no cartão → `HomeController.handleGridClick` (`:89`) → conjunto da série nova, sem repetir | clique na linha ou no «+» → `SeriesEditModal.handleAddAlbum` (`:65`) → lista da série em edição, sem repetir, com aviso |
| A consulta guardada | `toAlbumQuery` ao criar a série (`HomeController.js:209`) | `toAlbumQuery` ao escolher (`SeriesEditModal.js:66`) |
| Salvar | botão «Creating Series...» desabilitado (`HomeController.js:204`) | **nada na tela** enquanto grava (`SeriesEditModal.js:136-164`); segundo clique grava de novo; falha só por aviso |

### As diferenças, uma a uma, e se precisam existir

| # | Diferença | Precisa existir? |
|---|---|---|
| 1 | Destino da escolha (conjunto da série nova × lista da série em edição) | **Sim.** É a única. Virou a costura `onPick`. |
| 2 | Caminho de busca (`scanArtist` × `getArtistDiscography`) | Não. O segundo é o primeiro sem prazo e esperando a IA. |
| 3 | Prazo no catálogo (15 s × nenhum) | Não. |
| 4 | Álbuns antes × depois da lista da IA | Não: é a espera que o MJRP sentiu na edição. |
| 5 | Instância do serviço (por visita × única) | Não: com duas, a lista paga é pedida mais de uma vez por artista. |
| 6 | Estado da busca (um × espalhado) | Não. |
| 7 | Filtros (seis × quatro) e nomes («Studio» × «Albums», «Compendiums» × «Compilations») | Não. |
| 8 | «Sem categoria» à vista («?») × escondido em «Albums» | Não: a mesma busca dava contagens diferentes nas duas telas. |
| 9 | Quantidades nos filtros (sim × não) | Não. |
| 10 | Cartão (capa em grade × linha) e ordem (mais novo × catálogo) | Não. A janela é menor: a grade tem menos colunas, o cartão é o mesmo. |
| 11 | Falha (painel com «Try again» × aviso) | Não. |
| 12 | Resposta atrasada (ignorada × desenhada) | Não. |
| 13 | Quando a consulta é feita (ao criar × ao escolher) | Indiferente: a mesma função, o mesmo resultado. Ficou como estava. |
| 14 | Resposta ao salvar (botão ocupado × nada) | Não. |

**Resposta:** não há necessidade real de as duas diferirem além do destino da escolha. As outras treze diferenças eram a mesma tarefa escrita duas vezes, em épocas diferentes.

### Por que «To Pimp a Butterfly» e «good kid, m.A.A.d city» caíam em «?»

O catálogo dá aos dois o gênero «Hardcore Rap» (visto em `public/assets/data/albums-curated.json`, lido do catálogo: `["Hip-Hop/Rap", "Music", "Hardcore Rap", "West Coast Rap", "Gangsta Rap", "Rap"]`, 16 e 18 faixas; «DAMN.» e «Section.80» não o têm). O funil antigo:

1. `AppleMetadataStrategy`: sem `isSingle` nem `isCompilation` → passa.
2. `TitleKeywordStrategy`: nenhuma palavra → passa.
3. `GenreGateStrategy.js:23`: `isElectronic(genres)` com a lista **larga** e busca por **pedaço** (`ElectronicGenreDetector.js:69`): «hardcore rap» contém «hardcore» (`:43`) → «é eletrônico» → não responde «Album».
4. `RemixTracksStrategy`: a busca não traz nomes de faixas → passa. `TrackCountStrategy`: 16 faixas → passa.
5. Fim do laço. `AlbumTypeClassifier.js:102-105` decide se consulta a lista da IA com a lista **estreita** (electronic, dance, trance, house, techno, edm): «hardcore rap» não é → a lista não é consultada.
6. `:125`: «Uncategorized».

É um buraco entre duas regras, não um defeito do gênero hip-hop: «Hip-Hop/Rap» sozinho passava. A hipótese registrada antes (a lista da IA vindo vazia do servidor) não explica este caso: a lista nem era pedida. Ela explicaria artistas eletrônicos inteiros em «?», e o desenho novo cobre isso também (sem lista, álbum de estúdio).

Medido em `albums-curated.json` com o classificador antigo e o novo, os dois sem lista da IA (38.560 álbuns; o arquivo não tem `isSingle`/`isCompilation`, então só título, gênero e faixas contam): 3.146 saem de «?» para «Studio» (537 não eletrônicos — o buraco — e 2.609 eletrônicos sem lista); 490 passam de estúdio a ao vivo («Live in …»); 193 deixam de ser coletânea («Mellow Gold», «Everybody Scream», «(Archive Collection)», «(Definitive Edition)»); 80 deixam de ser ao vivo («Violin Concerto», «Alive at …»).

## Architecture Approach
Sem camada nova e sem dependência nova. O desenho repete o da carga dos álbuns (ADR-0019) e o da F67: regras em modelos puros, um dono do estado, a tela desenhada a partir dele, uma porta estreita para o que varia. Seção nova no `docs/specs/arch.md`: «Uma peça só para escolher álbuns e um classificador só (F57)». O `docs/specs/data-model.md` não muda: nada novo é gravado; cada álbum da busca ganha `typeReason` só na memória da tela.

- **Classificador:** `public/js/models/albumType.js`, função pura. Substitui `AlbumTypeClassifier.js` e a pasta `classification/` (oito arquivos).
- **Regras da peça:** `public/js/models/albumPicker.js`, puro.
- **A peça:** `public/js/components/album-picker/AlbumPickerController.js`, dona do estado da busca (F67) e dos filtros; desenha por uma porta de três métodos.
- **Partes desenhadas:** `components/album-picker/pickerParts.js` e `views/renderers/DiscographyRenderer.js`.
- **Dois quadros:** a Home (`HomeController` + `HomeView`) e `components/album-picker/AlbumPickerPanel.js` dentro da janela de edição.
- **A costura:** `onPick(album)`.
- **Salvar a edição:** `public/js/models/seriesDraft.js` (estado puro) e `SeriesEditModal` como classe.

## Technical Design
Fluxo, igual nas duas telas: clique, Enter ou «Try again» → `AlbumPickerController.searchArtist` → `startScan` (desenhado na hora) → `albumSearchService.scanArtist` → catálogo (prazo) → `classifyAlbum` sem a lista (ou com a lembrada) → `scanFound` → lista da IA, se algum álbum é eletrônico → `classifyAlbum` de novo → `scanReclassified`. Clique no cartão → `pick(id)` → `onPick(album)`.

- `public/js/models/albumType.js` (novo): `AlbumType`, `ALBUM_TYPES`, `TypeReason` (16 motivos), `isElectronic(genreNames)` (nome inteiro, ou um lado inteiro da «/»), `wantsAiList(album)`, `classifyAlbum(album, { aiList })` → `{ type, reason }`. Ordem: `catalogSays` → `titleSays` (nove regras em ordem, em `TITLE_RULES`) → `trackCountSays` (só eletrônico) → `aiListSays` (só eletrônico, lista conhecida e não vazia) → estúdio. Casamento com a lista: `namesTheAlbum` (mesmo título sem notas, palavras de edição e pontuação; ou todas as palavras do título da lista no título do álbum, sem número sobrando) e `isAnotherProduct` (palavra de outro produto no álbum e não na lista). Nenhuma função passa de 10 de complexidade (REQ-01, REQ-02, REQ-03).
- `public/js/models/albumPicker.js` (novo): `PICKER_FILTERS`, `defaultFilters`, `toggleFilter`, `visibleAlbums`, `countByFilter` (saiu de `scanState.countAlbumTypes`), `newestFirst`, `findAlbum`, `badgesOf` (REQ-05).
- `public/js/models/scanState.js`: perdeu a contagem por tipo e a sua lista de tipos; o resto é o da F67 (REQ-05).
- `public/js/services/album-search/AlbumSearchService.js`: `scanArtist` usa `classifyAlbum` e `wantsAiList`; `_classifyAll(albums, aiList)` é síncrono e põe `type` e `typeReason`; saíram `getArtistDiscography`, `_processDiscography`, `applyFilters`, o `EditionFilter` e as marcas derivadas (`isSingle`, `isCompilation`, `isLive`, `isEP`, `albumType`), que ninguém lia; a chave de agrupamento de variantes guarda letras de qualquer alfabeto (REQ-04, REQ-08).
- `public/js/components/album-picker/AlbumPickerController.js` (novo): `searchArtist`, `retry`, `toggleFilter`, `pick`, `start`, `dispose`; porta `{ drawScan, drawFilters, drawAlbums }`; `onPick` (REQ-05).
- `public/js/components/album-picker/pickerParts.js` (novo): `createFilterButton`, `drawFilterButton` (com `aria-pressed`), `drawScanButton`, `createScanPanel` (saíram de `HomeView`) (REQ-05).
- `public/js/components/album-picker/AlbumPickerPanel.js` (novo): o quadro para dentro de outra tela; ouve os cliques e pergunta à peça (REQ-05).
- `public/js/controllers/HomeController.js`: cria a peça com a porta da Home e `onPick: stagingController.addAlbum`; usa a instância única do serviço; os comandos da busca e dos filtros delegados a partir de `#app` (REQ-04, REQ-05).
- `public/js/views/HomeView.js`: os botões de filtro nascem de `PICKER_FILTERS`; `renderFilters(filters, counts)` no lugar de `updateFilterCounts` e do `updateFilterUI` do controlador; `renderScan` usa as partes (REQ-05).
- `public/js/views/renderers/DiscographyRenderer.js`: selos por `badgesOf`; `data-action="pick-album"`; texto do filtro sem álbuns (REQ-05).
- `public/js/models/seriesDraft.js` (novo): `SaveStatus`, `SaveProblem`, `idleSave`, `canSave`, `saveStarted`, `saveFailed`, `describeSave`, `problemBeforeSave`, `hasAlbumQuery` (REQ-06, REQ-07).
- `public/js/components/series/SeriesEditModal.js`: reescrita como classe (`open` continua sendo a entrada); `addAlbum` é a costura; `saveChanges` com um estado, botão e mensagem desenhados dele (REQ-06, REQ-07).
- Removidos (`git rm`): `components/home/SearchController.js`, `components/series/ArtistScanner.js`, `components/search/DiscographyToolbar.js`, `components/search/VariantPickerModal.js` (os dois últimos sem quem os importasse, conferido por busca), `services/album-search/AlbumTypeClassifier.js`, `services/album-search/classification/*`, `services/album-search/EditionFilter.js`, `services/album-search/types.js`, `test/scripts/test_classification_logic.js`.
- `test/architecture/oneAlbumPicker.test.js` (novo): as funções de aptidão (REQ-01, REQ-04, REQ-05).

### O que foi unificado e o que falta unificar
**Feito:** o classificador, o caminho de busca, a instância do serviço, o estado da busca, o estado e a definição dos filtros, a contagem, a ordem, o cartão, o botão Scan, os botões de filtro, a mensagem do painel com «Try again», a regra dos selos. As duas telas têm o mesmo comportamento, os mesmos prazos e as mesmas respostas, provado por teste nas duas.

**Falta:** um componente de tela único que seja dono também do quadro. Hoje há dois quadros finos: o da Home (os nós com `id` do `HomeView`, os comandos delegados no `HomeController`) e o `AlbumPickerPanel` (um bloco só). Os dois só posicionam as partes e repassam cliques; nenhum decide nada. Não foi unificado porque a Home separa o campo (painel da esquerda, junto do nome da série e do «Bulk Paste») dos filtros e da grade (painel da direita), e trocar esse layout sem ver num navegador é o tipo de mudança que quebra sem teste acusar. O passo seguinte, quando houver navegador: a Home montar o `AlbumPickerPanel` com dois pontos de montagem (campo e resultados) e apagar a porta escrita no `HomeController`.

## UI/UX Design (if the feature touches a screen)
Sem protótipo. Na janela «Edit Series» o bloco de busca fica: campo e botão Scan; linha de status; os seis filtros; grade de cartões com três colunas (quatro em tela média), com altura máxima de 320 px e rolagem. A mensagem de falha do salvamento fica abaixo do bloco, em vermelho, com `role="alert"`. Textos nas Open Questions da spec.

## Dependencies
Nenhuma.

## Documents Consulted
- `AGENTS.md`, `MEMORY.md` (`## Now`), `docs/specs/uat.md` (UAT-185, UAT-193)
- `reports/audits/2026-11-19-mjrpalbumblender-v0-browser-regression.md` (cenários 1 e 17), `reports/audits/2026-11-19-mjrpalbumblender-v0-v5-map.md` (tema 5), `reports/audits/2026-11-19-mjrpalbumblender-v0-earlier-reports-vs-v5-plan.md` (B-09, B-13 a B-22)
- `docs/manual/01_System_Architecture.md` seção 6, `docs/manual/22_Album_Search_Engine.md`
- `docs/specs/features/F67-home-scan-answers-the-click/` (o estado único da busca), `docs/decisions/0019-one-owner-for-the-album-load.md` (o molde)
- `docs/specs/behavior.md`, `docs/specs/constitution.md` (complexidade até 10)
- `public/assets/data/albums-curated.json` (os gêneros que o catálogo dá)

## Risks & Considerations
- **O classificador mudou para todos os artistas, não só para o caso da issue.** As mudanças de resultado estão medidas acima e listadas nas Open Questions da spec. O conjunto medido não tem as marcas do catálogo (`isSingle`, `isCompilation`), que continuam valendo primeiro.
- **Artistas eletrônicos não foram vistos com a lista da IA de verdade.** O caminho deles foi reescrito mantendo as regras (quantidade de faixas, resgate pela lista, palavras de outro produto), com três mudanças conscientes: sem lista o álbum é de estúdio; o casamento por palavras só vale num sentido (as palavras da lista dentro do título do álbum); número sobrando não casa.
- **A regra das faixas de remix não foi levada:** a busca não pede os nomes das faixas, então ela nunca rodou.
- **`albumType` e `contentTraits`** continuam sendo lidos se vierem; não foram vistos numa resposta do catálogo.
- **A janela de edição mudou de aparência** (grade de cartões no lugar de linhas) sem ser vista num navegador. As classes usadas existem no CSS compilado (conferido no `dist/`).
- **A Home passou a usar a instância única do serviço de busca:** a lista da IA de um artista fica lembrada entre visitas, até recarregar a página.
- **Nada disto foi visto num navegador por quem implementou.** Os testes rodam em jsdom, com o catálogo e o servidor trocados por dublês.

## Test plan
> Derivado dos REQ do `spec.md` · 2026-11-19 20:40 (Brasília)

| REQ | Caso de teste | Critério / estado | Camada | Automatizado? |
|---|---|---|---|---|
| REQ-01 | `test/models/albumType.test.js` («the closed lists», «what the catalog says comes first», «what the title says»); `test/architecture/oneAlbumPicker.test.js` («one classifier says the type of an album») | toda resposta tem tipo e motivo das listas; só o serviço de busca chama o classificador · `^album-type-one-classifier` | modelo + arquitetura | sim |
| REQ-02 | `albumType.test.js` («UAT-185, the two Kendrick Lamar albums», «no album ends unknown because of its genre», «an electronic artist»); `AlbumSearchService.scan.test.js` («UAT-185: a hip-hop discography…») | os dois álbuns em «Album»; a lista da IA não é pedida; eletrônico com e sem lista · `^home-discography-type-filters`, `^home-scan-classifying` | modelo + serviço | sim |
| REQ-03 | `albumType.test.js` («stays a studio album», «a DJ-mix brand name counts only for an electronic album») | dez títulos que eram coletânea ou ao vivo por pedaço de palavra | modelo | sim |
| REQ-04 | `AlbumSearchService.scan.test.js`; `AlbumSearchService.aiList.test.js` («one scan asks the list once»); `oneAlbumPicker.test.js` («one path scans the albums of an artist») | um caminho, prazo de 15 s, uma pergunta paga | serviço + arquitetura | sim |
| REQ-05 | `test/components/home/HomePicker.scan.test.js` (16 casos, com a Home de verdade montada); `test/components/series/SeriesEditModal.test.js` («the album picker inside it», 10 casos, um deles compara os filtros com os da Home montada); `test/models/albumPicker.test.js`; `oneAlbumPicker.test.js` («one picker shows them») | os mesmos estados, filtros e cartão nas duas telas · `^home-scan-one-state`, `^series-edit-album-picker` | modelo + controlador + tela + arquitetura | sim |
| REQ-06 | `SeriesEditModal.test.js` («a pick is added to the series being edited»); `test/models/seriesDraft.test.js` («an album already in the list») | a consulta guardada; sem repetir; nada gravado antes de salvar · `^series-edit-modal` | modelo + tela | sim |
| REQ-07 | `SeriesEditModal.test.js` («saving», 6 casos); `seriesDraft.test.js` («the save») | botão ocupado; uma gravação para três cliques; falha dita na janela, lista mantida · `^series-edit-saving` | modelo + tela | sim |
| REQ-08 | `AlbumSearchService.scan.test.js` («titles in another alphabet are not grouped into one album») | dois álbuns, um deles com duas edições | serviço | sim |

Bordas fora dos critérios (achados para a `mjrp-writing-reqs` se mudam o comportamento): a edição mostrada de um álbum com várias edições é a primeira que o catálogo devolve; o álbum em que o artista só participa aparece como álbum de estúdio dele.
