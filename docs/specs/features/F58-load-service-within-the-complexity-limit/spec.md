---
status: Done
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-194", "UAT-14", "UAT-18", "UAT-19"]
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
# Feature F58: Carga e gravação de playlists dentro do limite de complexidade
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** As funções do serviço de carga, dos adaptadores e do controlador de playlists ficam com complexidade de no máximo 10, e um teste recusa a que passar disso.

**Por quê:** A medição de 2026-11-19 achou `_enrichOne` em 21, a busca do adaptador do catálogo em 12 e o salvar do controlador de playlists em 27, onde estão três dos defeitos de perda de dado.

**Como saber que funcionou:** O teste do limite de complexidade passa nessas pastas e reprova uma função acima de 10.

## Problem Statement
Pergunta do MJRP em 2026-11-19: «como fica a complexidade ciclomatica de um e de outro?». Decisão do MJRP de 2026-11-19: tudo entra na v5.0, e cada feature pronta e testada vai para produção sozinha. Origem: o cruzamento dos relatórios anteriores (`reports/audits/2026-11-19-mjrpalbumblender-v0-earlier-reports-vs-v5-plan.md`).

**O que a medição de hoje achou** (2026-11-19, depois de F52, F55, F56, F60, F61, F63, F67 e F68; regra `complexity` do ESLint, limite 10; a tabela inteira está no `plan.md`). Os números do resumo acima envelheceram: na carga de álbuns só duas funções passavam de 10, `_holdFor` (12) e `_enrichOne` (12), as duas em `public/js/services/albums/AlbumLoadService.js`; a busca do adaptador do catálogo já estava dentro do limite; o salvar do controlador de playlists também (a F60 o dividiu). No app inteiro eram 136 funções acima de 10.

A feature conserta quatro issues:
- **UAT-194** — funções do serviço de carga acima do limite. O limite de 10 é do dono do projeto e não é artigo da `constitution.md`: a issue não tem `violates::`.
- **UAT-14** — o Firestore usado fora dos repositórios. violates:: [[0017-pure-state-stores]] e a regra de dependências de `PRINCIPLES.md` §I.3.
- **UAT-18** — lojas de estado que chamam banco, API e login. violates:: [[0017-pure-state-stores]].
- **UAT-19** — controladores e telas pulam a camada de serviço. violates:: [[0016-service-layer-extraction]] e `PRINCIPLES.md` §I.3.

## Requirements
<!-- Local IDs, two digits. Each REQ traces to an imported node; none is invented here.
     Functional and non-functional (performance, security, accessibility) alike are REQ-xx. -->
- [REQ-01] Nenhuma função da carga de álbuns (o serviço, os seus colaboradores, os adaptadores, a fila, a loja de carga e os modelos da carga) passa de complexidade ciclomática 10, medida pela regra `complexity` do ESLint, e um teste reprova a que passar. A carga se comporta como antes: a suíte que já existia para ela passa sem mudança de expectativa. · fixes UAT-194
  verified_by:: `test/architecture/complexityLimit.test.js`, `test/services/albums/AlbumLoadService.test.js`, `test/services/albums/AlbumLoadService.guests.test.js`, `test/services/albums/emptyTrust.test.js`, `test/models/albumSourceAsk.test.js`, `test/utils/LatestOnly.test.js`
- [REQ-02] A espera pedida pelo servidor («entre na conta», «aguarde», «fonte ocupada») é estado explícito da loja de carga, com as regras em funções puras: quem lê a carga fica sabendo de uma espera, e do fim dela, pela assinatura da loja; o pedido de álbuns de outra tela não olha mais a cada segundo. Uma carga parada também é estado da loja. · fixes UAT-194
  verified_by:: `test/models/albumLoadHold.test.js`, `test/services/albums/LoadHold.test.js`, `test/stores/albumLoad.test.js`, `test/services/albums/AlbumAsks.test.js`, `test/models/albumAsk.test.js`
- [REQ-03] No resto do app nenhuma função nova passa de 10 e nenhuma das que já passam piora: as que passam hoje estão numa lista com o número de cada uma, que só pode diminuir. · fixes UAT-194
  verified_by:: `test/architecture/complexityLimit.test.js` (com `test/architecture/complexityAllowlist.js`)
- [REQ-04] O app tem um Firebase só, o do pacote: nenhum arquivo importa código de um endereço, e só os repositórios e o arquivo que inicia o Firebase falam com o Firestore. A tela de migração recebe da rota o que precisa do banco. · fixes UAT-14
  verified_by:: `test/architecture/firestoreBehindRepositories.test.js`, `test/views/SaveAllView.test.js`
- [REQ-05] As lojas de inventário e de usuário só guardam estado e avisam quem assinou: ler e gravar o inventário e ouvir o login são de serviços. Nenhuma loja nova importa serviço, repositório, cache, API, Firebase ou o arquivo que monta o app; a que ainda importa (a do Spotify) está numa lista que só pode diminuir. · fixes UAT-18
  verified_by:: `test/architecture/layerBoundaries.test.js`, `test/stores/inventory.test.js`, `test/stores/UserStore.test.js`, `test/services/inventory/InventoryService.test.js`, `test/services/inventory/InventoryService.userChange.test.js`, `test/services/auth/UserSessionService.test.js`, `test/models/inventoryStats.test.js`
- [REQ-06] Nenhuma tela, componente ou controlador importa repositório ou Firebase, e nada importa o arquivo que monta o app, fora de uma lista que só pode diminuir (hoje: o código do blend e das playlists). A tela de álbuns, o menu e a loja de inventário saíram dela, e o ciclo entre `app.js` e a loja de inventário acabou. · fixes UAT-19
  verified_by:: `test/architecture/layerBoundaries.test.js`
- [REQ-07] (segunda fatia) Nenhum arquivo de `public/js/stores/` importa serviço, repositório, cache, API, Firebase ou o arquivo que monta o app, e a lista de exceções do teste está vazia. O que o app guarda das respostas do Spotify sobre um álbum é um serviço atrás de uma porta («o que já temos deste álbum?» e «guarde isto»), montado num arquivo só; os documentos já gravados seguem sendo lidos: a coleção, o nome do documento, os campos e a regra de confiança (30 dias, o formato, um id do Spotify) são os de antes. · fixes UAT-18
  verified_by:: `test/architecture/layerBoundaries.test.js`, `test/services/spotify/StoredSpotifyPopularity.test.js`, `test/architecture/spotifyPopularityOnePath.test.js`
- [REQ-08] (segunda fatia) Nenhuma tela, componente ou controlador importa repositório, Firebase ou o arquivo que monta o app, nem lê do Firebase quem está na conta, e as listas de exceções do teste estão vazias. O serviço das playlists recebe o banco, o cache e quem está na conta num arquivo só, onde é montado; os controladores e componentes das playlists e do blend pedem a esse serviço. O arquivo que monta o app não exporta nada. Gerar, editar, guardar, abrir um lote guardado e arrastar uma faixa se comportam como antes: as suítes da F60 e da F62 passam sem mudança de expectativa. · fixes UAT-19
  verified_by:: `test/architecture/layerBoundaries.test.js`, `test/services/playlists/playlistsWiring.test.js`, `test/controllers/PlaylistsController.save.test.js`, `test/controllers/PlaylistsController.edit.test.js`, `test/controllers/PlaylistsController.restore.test.js`, `test/controllers/BlendingController.load.test.js`

## Observable States
<!-- What the imported nodes point_to: the screen state in info-arch.md (the prototype the human judged —
     PRINCIPLES.md §I.13) or the behavior state in behavior.md. N/A only if the nodes point to none. -->
N/A: a feature não importa nenhum requisito (conserto de dívidas de engenharia) e nenhum estado de tela ou de comportamento muda.

## Prototype Parity (if the feature touches a screen)
- Prototype: none. Nenhuma tela foi redesenhada e nenhum texto mudou. O que a pessoa pode notar: nada. O que muda por dentro e pode ser visto com as ferramentas do navegador: a tela de álbuns é redesenhada uma vez a mais quando uma espera começa e quando acaba (o desenho é o mesmo); um blend pedido durante uma espera é servido assim que a espera começa, sem aguardar até um segundo.

**Prototype**: none — MJRP, 2026-11-20 00:10: «eu dispenso prototipo por que estávamos arrumando e consertando problemas passados com pequenas melhorias e nao trabalhando em grande features nova, portanto por ora os prototipos estao dispensados.»

## Success Criteria
<!-- One measurable item per acceptance criterion of the imported nodes. -->
- `npx vitest run test/architecture/complexityLimit.test.js` passa; pôr uma função com complexidade 11 em `public/js/services/albums/` faz o teste falhar com o arquivo, a linha e o número.
- Antes: 2 funções da carga acima de 10 (12 e 12). Depois: 0. No app (`public/js`, sem `vendor/`): de 97 para 94; a lista tem 94 linhas.
- `git grep -n "gstatic.com/firebasejs.*\.js'" -- public/js` não acha nenhum `import`; `git grep -n "firebase/firestore" -- public/js` só acha `repositories/` e `firebase-init.js`.
- `public/js/stores/inventory.js` e `public/js/stores/UserStore.js` não têm nenhum `import` fora de `../models/`.
- A suíte inteira passa (`npx vitest run`) e o site compila (`npx vite build`).
- No navegador (tarefa do integrador): a tela de álbuns carrega, um blend gera, e uma espera 401 de visitante mostra um aviso só e não marca nota como falha.
- Segunda fatia: as três listas de `test/architecture/layerBoundaries.test.js` (`STORES_STILL_REACHING_OUT`, `SCREEN_STILL_REACHING_THE_DATABASE`, `STILL_IMPORTING_THE_MOUNTING_FILE`) estão vazias; `public/js/stores/SpotifyEnrichmentStore.js` não existe; `grep -rn "app.js'" public/js` não acha nenhum `import`; `public/js/app.js` não tem nenhum `export`.
- Segunda fatia, no navegador (tarefa do integrador): gerar um blend, editar o conjunto (arrastar uma faixa, remover, desfazer), guardar, abrir o lote na lista das guardadas e guardar de novo; a popularidade do Spotify aparece num álbum já guardado sem nova pergunta ao Spotify e num álbum novo depois de perguntar.

## Out of Scope
- As 94 funções de `public/js` que seguem acima de 10 e as 35 de `shared/` e `server/`: ficam na lista (as do app) ou só na tabela do plano (as outras).
- Na primeira fatia ficou de fora o que restava da UAT-18 e da UAT-19 (`stores/SpotifyEnrichmentStore.js`, `controllers/PlaylistsController.js`, `controllers/BlendingController.js`, `components/playlists/PlaylistsDragHandler.js`, `components/playlists/SavedPlaylistsController.js`; `views/playlists/PlaylistsDragDrop.js` e `services/PlaylistPersistenceService.js` saíram na F65, sem uso). A segunda fatia (REQ-07, REQ-08) consertou todos.
- Segunda fatia: dividir as três lojas que passam de 150 linhas (`albumLoad.js` 214, `playlists.js` 169, `albums.js` 162). Foram lidas uma a uma: são estado, setters e seletores puros, sem regra que pertença a outro lugar; ficam na lista do teste, que não as deixa crescer.
- Segunda fatia: a regra de confiança do que o app guarda do Spotify. Um registro gravado antes da regra de identidade de álbum (F55/F68) não leva a versão da regra e segue aceito por 30 dias sem nova conferência; não foi mudada.
- Segunda fatia: o que o teste das camadas não mede: um controlador que alcança um repositório por dentro de um serviço (`getSeriesService(...).repository`, em `PlaylistsController._seriesOf` e outros) e os serviços que importam lojas.
- Dar um caminho no menu para a tela de migração ou retirá-la (UAT-11): decisão do MJRP, na F65.
- A regra de identidade de álbum, a busca da Home, a classificação e o modal de edição de série (F57), o leitor das playlists guardadas.
- Mudar o estado das issues no `docs/specs/uat.md`, o `MEMORY.md` e o `ROADMAP.md`: do integrador.

## Open Questions
<!-- ALL resolved before Plan. -->
- As dívidas UAT-18 e UAT-19 fecham com o que resta numa lista? — Decidido pelo agente, revisável: não fecham; a feature conserta o que não está no código de outro ramo e deixa o resto listado num teste que só aceita a lista diminuir. O integrador decide o estado das issues.
- O título da feature fala em «gravação de playlists», e o salvar do controlador de playlists já está dentro do limite desde a F60 — Decidido pelo agente, revisável: o título fica; o resumo foi mantido como escrito e a seção «Problem Statement» diz o que a medição de hoje achou.
- (segunda fatia) Quem é «a pessoa» para o serviço das playlists? — Decidido pelo agente, revisável: ficaram as duas respostas que o código já tinha, para nada mudar: o rascunho no navegador é de quem a loja de séries diz (`albumSeriesStore.getUserId()`), e o guardar e o ler um lote vão para quem o Firebase diz estar na conta (`auth.currentUser`, ou «anonymous-user»). Unificar as duas é outra mudança, com o seu teste.
- O limite de 10 entra na `constitution.md`? — Aberta para o MJRP: hoje é uma regra dele dita em conversa e guardada num teste; a constituição só fala do tamanho de arquivo.
