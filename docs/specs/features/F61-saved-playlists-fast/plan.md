<!-- docs/specs/features/Fxx-slug/plan.md — HOW. No edge of its own in the graph: the trace to the REQs is the
     cross-check before approval. -->
# Plan — Feature F61: Playlists guardadas em poucos segundos · Spec: [[spec]]
**Approved**: not a gate (via rápida; o MJRP julga)

> Escrito junto com o código (via rápida), no ramo `fix/f61-saved-playlists-fast`, em 2026-11-19.

## Diagnóstico: por que levava 20 segundos
Lido no código antes de mexer (linhas da `main` em `c72dcc2`); nada disto foi medido num navegador por quem implementou.

| Passo, da rota até o primeiro desenho | Onde | Idas ao banco | Em fila ou juntas |
|---|---|---|---|
| A rota cria a tela; `render` desenha a página com «Scanning all series for playlists...» | `app.js:158-165`, `router.js:158-187`, `views/SavedPlaylistsView.js:255-260` | 0 | — |
| `mount` espera `controller.loadData` inteiro | `views/SavedPlaylistsView.js:40-48` | — | segura o desenho |
| Lê a coleção de séries | `SavedPlaylistsController.js:50` → `BaseRepository.findAll` (`:130`) | 1 | — |
| Para cada série, lê a coleção `playlists` dela, com `await` dentro do `for` | `SavedPlaylistsController.js:56-62` | N | em fila, uma por vez |
| Só então `isLoading = false` e a lista é desenhada, toda de uma vez | `views/SavedPlaylistsView.js:47-48,77` | — | — |
| Depois do desenho: capas de três álbuns por série com playlists | `SavedPlaylistsController.js:78,129-174` | 0 (base local de álbuns) | não segura o desenho |

- **Conta para N séries:** 1 + N idas ao banco, 1 + N esperas em fila antes do primeiro desenho. Para 47 séries: 48 e 48. Em documentos lidos: N séries mais todas as playlists, cada uma com as faixas dentro. 20 s por 48 idas dá cerca de 0,4 s por ida.
- **Por que toda série é lida:** as playlists moram em `series/{id}/playlists` e o documento da série não diz se tem alguma.
- **Apagar um lote** custava 1 leitura, um apagamento por playlist (sem transação) e a lista inteira de novo: mais 1 + N em fila (`SavedPlaylistsController.js:217-226`). O Refresh, idem.
- **Não era causa:** capas, dados de álbum (nenhum é carregado) e avisos de store (a tela não escuta nenhum).
- **Medido com o banco falso** (`test/helpers/fakeFirestore.js`, 47 séries, 24 com playlists), antes do conserto: 48 leituras, no máximo 1 no ar.

## Architecture Approach
Sem dependência nova. O desenho repete o da carga dos álbuns (ADR-0016, ADR-0017, ADR-0019), no tamanho de uma leitura de documentos da própria pessoa: um dono, estado explícito, portas e adaptadores, Firestore só nos repositórios.

- **Regras puras:** `public/js/models/savedPlaylists.js` (estados, lotes, totais do cartão, ordem de leitura, de onde vêm as capas). Não importa nada.
- **Um store que só guarda estado:** `public/js/stores/savedPlaylists.js`. Uma entrada por série, trocada e nunca alterada.
- **Um dono da leitura:** `public/js/services/playlists/SavedPlaylistsReader.js`. Só importa a fila (`utils/TaskQueue.js`) e as regras; o banco e as capas chegam por portas.
- **Um adaptador:** `services/playlists/adapters/RepositoryPlaylistsSource.js` serve a porta com `SeriesRepository` e `PlaylistRepository`.
- **Um arquivo de composição:** `services/playlists/savedPlaylistsReading.js` liga o leitor ao banco, ao login e à base local de capas.
- **A tela pergunta e desenha:** `SavedPlaylistsController` pede ao leitor e entrega o que o store tem; `SavedPlaylistsView` escuta o store e redesenha só o grupo que mudou.

Refina no `docs/specs/arch.md`: seção nova «Leitura das playlists guardadas (F61)». O `docs/specs/data-model.md` não muda: nenhum documento mudou de forma.

## Technical Design
Fluxo: rota → `render` desenha a página → `mount` escuta o store e chama `controller.open()` → `reader.load()` → lê as séries (1 ida) → publica uma entrada «lendo» por série, na ordem da lista → lê as playlists de cada série, até 8 juntas → cada resposta troca a entrada daquela série (pronta, vazia ou falhou) → o store avisa → a tela põe ou troca só aquele grupo.

- `public/js/models/savedPlaylists.js` (novo): `ListStatus`, `SeriesPlaylistsStatus`, `batchNameOf` (uma regra para agrupar e para apagar), `groupIntoBatches`, `batchTotals`, `formatMinutes`, `toMillis` (lê a data do Firestore), `inReadOrder` (série atualizada mais recentemente primeiro; gravar um lote toca a série, então a série recém-editada é lida primeiro), `coverSources`, `summarize` (REQ-02, REQ-03, REQ-06).
- `public/js/stores/savedPlaylists.js` (novo): `begin(generation, userId)` (outra pessoa esvazia a lista), `setSeries`, `setListFailed`, `patchEntry`, leitores, `subscribe`; vários avisos no mesmo instante viram um (REQ-03, REQ-08).
- `public/js/services/playlists/SavedPlaylistsReader.js` (novo), REQ-01 a REQ-07:
  - `load({ fresh })`: uma leitura em curso para a mesma pessoa é devolvida, não repetida; `fresh` (Refresh, «Try again» da lista) começa outra geração e descarta a anterior. Nunca rejeita.
  - `refreshSeries(seriesId)`: relê uma série.
  - `removeBatch(seriesId, batchName)` e `removeAll(seriesId)`: leem o que a série tem agora, apagam numa gravação atômica (`deleteMany`) e publicam o que sobrou; se a gravação falha, a série é relida e o erro sobe.
  - Identidade: geração por carga e senha por série; só o último pedido de uma série escreve. Cancelar é parar de esperar e descartar a resposta.
  - Fila: `READ_LIMITS = { concurrency: 8, timeoutMs: 15000 }`; a leitura das séries tem a prioridade mais alta, a de uma série pedida à parte vem antes das demais.
  - O que já foi lido fica na entrada, marcado `refreshing`, enquanto é relido; resposta igual não troca `playlists` nem `batches`.
  - Capas: só de série pronta; o endereço que a série já guarda entra na hora, o que precisa de busca na base local chega depois, uma vez por série.
- `public/js/services/playlists/adapters/RepositoryPlaylistsSource.js` (novo): `listSeries`, `listPlaylists`, `deletePlaylists` (REQ-08).
- `public/js/services/playlists/savedPlaylistsReading.js` (novo): a composição (REQ-08).
- `public/js/components/playlists/SavedPlaylistsController.js`: `open`, `reload`, `retrySeries`, `subscribe`, `getList`, `isFirstLoad`, `findPlaylist`, e os dois apagamentos pelo leitor; saíram `loadData`, `processBatches`, as capas e os repositórios (REQ-05, REQ-08).
- `public/js/views/SavedPlaylistsView.js`: `mount` não espera nada; `refreshContent` reconcilia por série (`syncGroups`, `groupNodeOf`); `renderStatus`, `renderListFailure`, `renderPlaceholder`; `destroy` para de escutar (REQ-02, REQ-03, REQ-04).
- `public/js/components/playlists/SavedSeriesGroup.js`: desenha a entrada, com o aviso de falha e «Try again»; `SavedPlaylistCard.js` e `SavedPlaylistRow.js` constroem as linhas e as faixas na primeira abertura (REQ-03, REQ-06).
- `test/helpers/fakeFirestore.js`: `fake.reads()`, `fake.maxReadsAtOnce()` e falha de leitura por caminho.

## UI/UX Design (if the feature touches a screen)
Sem desenho novo. Textos novos, em inglês como o resto da tela: «Reading your series...», «Reading playlists: N of M series», «Updating...», «Your series could not be read.», «The list could not be updated. What you see may be out of date.», «The playlists of this series could not be read.», «The playlists of this series could not be updated. What you see may be out of date.», «Try again».

## Dependencies
Nenhuma.

## Documents Consulted
- `docs/specs/uat.md` (UAT-186), `MEMORY.md` (`## Now`), `AGENTS.md`
- `reports/audits/2026-11-19-mjrpalbumblender-v0-browser-regression.md` (cenário 10) e `reports/audits/2026-11-19-mjrpalbumblender-v0-v5-map.md` (tema 3.33)
- `docs/decisions/0019-one-owner-for-the-album-load.md`; `docs/manual/01_System_Architecture.md`, seção 6
- `public/js/services/albums/` e `public/js/stores/albumLoad.js` (o molde); `public/js/utils/TaskQueue.js`
- `firestore.rules` (por que não há consulta por grupo de coleção)
- `docs/specs/arch.md`, `docs/specs/behavior.md`, `docs/specs/constitution.md` (complexidade até 10)

Declarações do passo retroativo da via rápida (conferidas no histórico do repositório em 2026-11-19):
- `docs/specs/constitution.md` — sem mudança: nenhum padrão de código nem dependência novos
- `docs/specs/arch.md` — atualizado (commit `03c94ec`)
- `docs/specs/data-model.md` — sem mudança: nenhuma entidade, campo ou esquema mudou
- `docs/specs/tech-stack.md` — sem mudança: nenhuma dependência nova
- `docs/specs/design-system.md` — sem mudança: o projeto não tem `docs/specs/design-system.md`; nenhum token, fonte ou componente compartilhado mudou
- `docs/specs/behavior.md` — atualizado (commit `03c94ec`)
- `docs/wiki/` — sem mudança: as páginas de `docs/wiki/` do projeto são só as do harness; nenhuma descreve uma regra do app que esta feature mudou

## Risks & Considerations
- **O tempo real não foi medido.** Os números são do banco falso: contam idas e esperas, não segundos. Se uma ida continuar em 0,4 s, 7 esperas dão cerca de 3 s para a lista inteira e menos de 1 s para a primeira série; o tamanho das playlists (faixas dentro) pode pesar mais do que a conta sugere.
- **8 leituras juntas não foi testado contra o Firestore de produção.** O limite está num lugar só (`READ_LIMITS`).
- **A leitura que passou do prazo continua correndo** no navegador; a resposta dela é descartada.
- **Ao voltar à tela, por um instante a lista pode mostrar o que estava antes de uma edição**, até a releitura daquela série chegar (ela é a primeira da fila). A linha «Updating...» fica acesa enquanto isso.
- **Apagar com a lista sendo relida:** o Refresh cancela a leitura do apagamento em curso; o apagamento responde «Failed to delete batch» sem ter apagado nada.
- **A gravação do apagamento não tem prazo** (como antes): sem rede, o Firestore a guarda para depois.
- **Séries em leitura não têm bloco próprio na tela**; a ordem é estável, mas um grupo pode entrar acima de outro que já estava desenhado quando a resposta dele chega depois.
- **A composição lê o login por `auth.currentUser`**, como a tela já fazia: visitante sem conta recebe o aviso de falha da lista.

## Proposta de modelo de dados (não feita)
Gravar no documento da série um resumo das playlists (`playlistsSummary`: por lote, o nome, a data, quantas playlists, faixas, álbuns diferentes e a duração). `PlaylistRepository.replaceBatch` já toca a série na mesma gravação atômica, então o resumo entraria ali sem custo de ida. Com ele, a tela desenharia a lista inteira com **uma** leitura (a das séries) e leria as playlists, com as faixas, só do lote que a pessoa abre. Custo: migrar os documentos existentes (um script que lê cada série e grava o resumo), e fazer todo lugar que grava ou apaga playlists passar pelo mesmo ponto. Alternativa menor, que também pede publicação: a regra `match /{path=**}/playlists/{id}` mais um índice de grupo, para uma consulta só.

## Test plan
> Derivado dos REQ do `spec.md` · 2026-11-19 19:24 (Brasília)

| REQ | Caso de teste | Critério / estado | Camada | Automatizado? |
|---|---|---|---|---|
| REQ-01 | `test/services/playlists/SavedPlaylistsReader.reads.test.js` («reads the list of series once…», «reads the series together…», «everything is read in 1 + ceil(N / limit) waits…») | 48 leituras para 47 séries, nenhum caminho duas vezes, 8 no ar, 7 esperas | leitor + repositórios + banco falso | sim |
| REQ-02 | `SavedPlaylistsReader.reads.test.js` («the list is on the store after ONE round trip, and the first series after TWO»); `test/views/SavedPlaylistsView.test.js` («mount returns with the page drawn…», «a series shows when its playlists arrive…», «a group on screen is not drawn again…») | `^saved-loading`, `^saved-series-arriving` | leitor; tela | sim |
| REQ-03 | `test/services/playlists/SavedPlaylistsReader.test.js` («a failure stays where it happened»); `SavedPlaylistsView.test.js` («a failure stays where it happened») | `^saved-series-failed`, `^saved-load-failed` | leitor; tela | sim |
| REQ-04 | `SavedPlaylistsReader.test.js` («an old answer never overwrites a new one»); `SavedPlaylistsView.test.js` («leaving the screen») | resposta velha descartada; a tela para de escutar | leitor; tela | sim |
| REQ-05 | `SavedPlaylistsReader.test.js` («deleting»); `SavedPlaylistsReader.reads.test.js` («trying one series again costs one read…»); `test/components/playlists/SavedPlaylistsController.test.js` | `^saved-batch-delete`, `^saved-series-delete-all` | leitor; controlador | sim |
| REQ-06 | `SavedPlaylistsReader.test.js` («covers»); `SavedPlaylistsView.test.js` («the playlists of a batch and the tracks of a playlist are drawn when opened…»); `test/models/savedPlaylists.test.js` | `^saved-batch-card`, `^saved-playlist-details` | leitor; tela; regras | sim |
| REQ-07 | `SavedPlaylistsReader.test.js` («coming back to the screen») | `^saved-back-again` | leitor | sim |
| REQ-08 | `test/architecture/savedPlaylistsBoundaries.test.js` | fronteiras de importação | arquitetura | sim |
| REQ-01 a REQ-07 | roteiro no navegador com a conta do MJRP, com o tempo até a primeira série e até a lista inteira (TASK-11) | o que a pessoa vê e quanto espera | navegador | não |

Bordas fora dos critérios (achados para a `mjrp-writing-reqs` se mudam o comportamento): a ordenação «Recently Updated» de `utils/FilterUtils.js` não lê a data do Firestore; o estado vazio ainda leva a `#/home` (UAT-27); `PlaylistsService.deleteBatch` apaga pelo nome exato do lote e não trata as playlists antigas sem nome de lote, ao contrário desta tela.
