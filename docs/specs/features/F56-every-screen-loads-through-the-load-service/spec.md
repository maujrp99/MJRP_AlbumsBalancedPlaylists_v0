---
status: In Progress
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-189", "UAT-191"]
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
# Feature F56: Blend e edição de playlists pelo serviço de carga
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** O blend e a edição de playlists pedem os álbuns ao serviço de carga, que já tem os da tela anterior, usam a edição escolhida do álbum e avisam quando um álbum falha; salvar a edição de uma série recarrega só o que mudou; o recarregar de um álbum e a injeção de álbuns passam pela fila.

**Por quê:** Hoje o blend e a edição têm cada um o seu laço: buscam de novo o que já está carregado, procuram por texto ignorando a edição escolhida e descartam um álbum que falhou só com um aviso no console.

**Como saber que funcionou:** Medido no navegador: o blend de álbuns já carregados começa na hora; um álbum que falha aparece como aviso; editar uma série não faz as outras recarregarem.

## Problem Statement
Regressão de 2026-11-19: blend de 2 álbuns já carregados levou de 8 a 18 segundos. Depende do contrato de erros da F52. Decisão do MJRP de 2026-11-19: tudo entra na v5.0, e cada feature pronta e testada vai para produção sozinha. Origem: o cruzamento dos relatórios anteriores (`reports/audits/2026-11-19-mjrpalbumblender-v0-earlier-reports-vs-v5-plan.md`).

A tela de álbuns carrega por um dono só (`AlbumLoadService`, ADR-0019). As outras telas não: os caminhos, lidos no código da `main` em `d210f35`, estão no `plan.md`, seção «Diagnóstico», com arquivo e linha.

## Requirements
<!-- Local IDs, two digits. Each REQ traces to an imported node; none is invented here.
     Functional and non-functional (performance, security, accessibility) alike are REQ-xx. -->
- [REQ-01] Qualquer tela que não é a de álbuns pede os álbuns de uma ou mais séries por uma porta só e espera a resposta: o que a tela de álbuns já carregou ou o navegador guarda não é buscado de novo, só o que falta passa pela fila, e a resposta é tipada: os álbuns prontos e a lista dos que falharam, cada um com o motivo. · fixes UAT-189
  verified_by:: `test/services/albums/AlbumAsks.test.js`, `test/models/albumAsk.test.js`
- [REQ-02] Um pedido de outra tela não cancela nem zera a carga da tela de álbuns que ainda está a caminho, e a mesma série pedida duas vezes ao mesmo tempo é carregada uma vez só; quando a carga recomeça (troca de escopo, «Refresh», «Clear Cache»), o pedido é atendido pela carga nova. · fixes UAT-189
  verified_by:: `test/services/albums/AlbumAsks.test.js`, `test/services/albums/AlbumLoadService.guests.test.js`, `test/stores/albumLoad.test.js`
- [REQ-03] Sair da tela que pediu não deixa carga que ninguém lê: a série que nenhuma tela mostra sai da carga, o que esperava na fila nunca é pedido e o que estava no ar não é escrito nem guardado; um pedido novo logo em seguida carrega normalmente. · fixes UAT-189
  verified_by:: `test/services/albums/AlbumAsks.test.js`, `test/services/albums/AlbumLoadService.guests.test.js`, `test/utils/TaskQueue.test.js`
- [REQ-04] O blend não tem laço próprio: pede os álbuns da série pela porta única, espera as fontes que a receita lê (notas, popularidade, ranking da pessoa), dentro do prazo que o serviço já dá a uma fonte, segue com os álbuns prontos, diz quais e quantos ficaram de fora e qual fonte falta para quantos álbuns, e só para quando nenhum álbum está pronto. · fixes UAT-189
  verified_by:: `test/controllers/BlendingController.load.test.js`, `test/models/recipeSources.test.js`, `test/models/albumAsk.test.js`
- [REQ-05] A edição de playlists não tem laço próprio: ao abrir pede os álbuns da série pela porta única e diz quais e quantos não carregaram; gerar de novo pede outra vez, com as fontes da receita nova, e diz o que ficou de fora. · fixes UAT-189
  verified_by:: `test/controllers/PlaylistsController.albums.test.js`, `test/controllers/BlendingController.load.test.js`
- [REQ-06] Salvar a edição de uma série carrega só o que mudou: o álbum acrescentado carrega, o tirado sai, uma outra edição do mesmo título é buscada de novo no catálogo, e os outros álbuns e as outras séries ficam como estavam. · fixes UAT-191
  verified_by:: `test/services/albums/AlbumLoadService.guests.test.js`, `test/controllers/SeriesController.test.js`, `test/models/albumAsk.test.js`
- [REQ-07] O recarregar de um álbum («Refetch») passa pela fila e pelo estado do serviço: o álbum aparece como carregando, a falha é a falha daquele álbum, com motivo, e a resposta que ainda vinha para o álbum antigo não escreve por cima do novo. · fixes UAT-189
  verified_by:: `test/services/albums/AlbumLoadService.guests.test.js`, `test/controllers/SeriesController.test.js`
- [REQ-08] Nada põe ou tira um álbum da tela por fora da carga: a prateleira (`stores/albums.js`) tem um escritor de álbuns só, a projeção do store de carga; a injeção de álbuns não existe mais. · fixes UAT-191
  verified_by:: `test/stores/albums.test.js`, `test/services/SeriesService.test.js`, `test/architecture/screensLoadThroughTheService.test.js`
- [REQ-09] A regra fica como teste: nenhum controlador, tela ou componente importa o cliente da API, chama uma fonte de álbum ou de nota, nem faz laço sobre os pedidos de álbum de uma série; o cliente antigo não tem mais os métodos de buscar álbum. · fixes UAT-189
  verified_by:: `test/architecture/screensLoadThroughTheService.test.js`, `test/api/clientIdentity.test.js`

## Observable States
<!-- What the imported nodes point_to: the screen state in info-arch.md (the prototype the human judged —
     PRINCIPLES.md §I.13) or the behavior state in behavior.md. N/A only if the nodes point to none. -->
N/A: a feature não importa nenhum requisito (conserto de issue). Estados do `docs/specs/behavior.md` reescritos para o que o código faz agora: `^blend-generating`, `^blend-failed`, `^playlists-no-ratings-confirm` (a pergunta saiu), `^playlists-generating`, `^playlists-generate-no-albums`, `^playlists-reconfigure-panel`, `^album-refetch-feedback`. Estados novos: `^blend-albums-left-out`, `^blend-source-missing`, `^blend-left-while-loading`, `^playlists-edit-albums`, `^series-edit-saved-reloads-only-changes`.

## Prototype Parity (if the feature touches a screen)
- Prototype: none. Nenhuma tela foi redesenhada. O que muda à vista: o texto do progresso do blend («Loading albums: i of n...», «Waiting for the ratings of i of n albums...»); avisos amarelos (o `toast` que já existia) para álbum que ficou de fora e fonte em falta; some a pergunta do navegador «No ratings detected... Continue?»; o «Refetch» mostra o cartão carregando em vez do aviso «Metadata updated».
- Transversal layer touched: none.
- Design-system cuts or swaps: none. O projeto não tem `design-system.md`; os avisos usam o `components/Toast.js` que as telas já usavam.

## Success Criteria
- Sem rede, com dublês do catálogo, das fontes e do guardado: uma série que a tela de álbuns já carregou é entregue a outra tela com zero chamadas ao catálogo; uma série carregada antes e já fora da tela, idem (vem do guardado); a mesma série pedida duas vezes ao mesmo tempo custa uma busca por álbum.
- Com a tela de álbuns ainda carregando, um pedido de outra tela não muda a geração nem o estado das entradas da tela de álbuns.
- Largar um pedido com 3 álbuns e 1 busca no ar: 1 chamada ao catálogo no total, nenhuma entrada da série no store, nada gravado no guardado.
- Salvar a edição de uma série com um álbum trocado: 1 chamada ao catálogo (a do álbum novo); as entradas dos outros álbuns e das outras séries são os mesmos objetos de antes.
- No navegador, com a conta do MJRP: «Blend It» até a tela de playlists, com os álbuns já carregados, em menos de 2 s (antes: 8 a 18 s); abrir a edição de um lote até os álbuns prontos em menos de 2 s; salvar a edição de uma série sem as outras voltarem para «pendente» (antes: cerca de 10 s). A medir pelo integrador, pelo roteiro do relatório de entrega (TASK-14).
- Suíte: 1232 testes passando (1143 antes da feature); `vite build` compila; nenhuma função nova acima de 10 de complexidade.

## Out of Scope
- **A fila do Spotify em segundo plano** (`services/SpotifyEnrichmentService.js`) e o botão **«Enrich Data»** da janela do álbum (itens 3.27 e 3.28 do mapa da v5.0): pedem ao Spotify por conta própria. O caminho da popularidade está sendo mudado agora no ramo `fix/f52-slices-3-4`; mexer nele aqui criaria conflito.
- **A grade inteira redesenhada a cada aviso do store** (item 3.24 do mapa): é do desenho da tela de álbuns, não da carga.
- **Trazer `_holdFor` e `_enrichOne` para o limite de complexidade** (F58). Nenhuma das duas foi tocada.
- **Apagar `cache/albumCache.js` e `repositories/SharedAlbumRepository.js`**, que ficaram sem quem os chame (F65 ou decisão do MJRP sobre a coleção compartilhada `albums`).
- A regra de identidade (`shared/albumIdentity.js`), o contrato das fontes com o servidor (`adapters/enrichers.js`), os prazos do `AlbumCacheAdapter`, o Scan da Home e as playlists guardadas: não foram tocados.

## Open Questions
<!-- ALL resolved before Plan. -->
- Um contexto separado por tela ou juntar-se à geração em vigor? — Juntar-se (`join` / `leave`): a série que a tela de álbuns já tem é a resposta, a que está a caminho é esperada e não repetida, e as filas, o limite na Apple e a espera do servidor continuam um só. Duas instâncias dividindo as filas se cancelariam. Decidido pelo agente — revisável; o raciocínio está no `plan.md`.
- O blend para quando um álbum falha, ou segue? — Segue com os prontos e diz com clareza quais ficaram de fora; para só quando nenhum está pronto. Um álbum que o catálogo não tem não deve custar o blend inteiro, e as playlists não dizem nada falso. Padrão indicado pelo MJRP no pedido; decidido pelo agente — revisável.
- O blend espera todas as fontes ou só as da receita? — Só as da receita. As notas de uma série grande levam minutos; uma receita que só lê popularidade não deve esperar por elas.
- E quando o servidor pede login ou espera (401, 429)? — A fonte não é esperada e o aviso diz «not waited for: the server paused the load»; um álbum ainda não achado depois do prazo de uma busca (45 s) sai como falha. Sem isso um visitante ficaria no «Blending…» para sempre. Decidido pelo agente — revisável.
- A pergunta «No ratings detected... Continue?» fica? — Não: no lugar, gera e avisa qual fonte falta e para quantos álbuns. Decidido pelo agente — revisável; é mudança de comportamento para o MJRP julgar.
- O «Refetch» continua gravando o documento compartilhado `albums`? — Não: o único escritor era o «Refetch» antigo e ninguém lia a coleção. A classe ficou, sem uso. Decidido pelo agente — revisável.
