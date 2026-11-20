---
status: In Progress
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-208", "UAT-209", "UAT-210", "UAT-63"]
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
# Feature F70: Defeitos pequenos achados no caminho da v5.0
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** Quatro defeitos pequenos achados enquanto as outras features da v5.0 eram provadas: um visitante pede uma rota paga que vai recusá-lo; editar o preço de um item do inventário grava a moeda vazia; o app ignora o que o servidor diz sobre as notas de um álbum achado pela IA; a capa que falha não tem substituto.

**Por quê:** Cada um é pequeno, mas todos são falhas reais vistas no código ou na tela, e nenhum tinha dono.

**Como saber que funcionou:** Como visitante, nenhuma chamada a rota paga sai do navegador; o preço editado mantém a moeda; um álbum cuja fonte de notas falhou no servidor não é gravado como «sem notas»; um cartão sem capa mostra um substituto.

## Problem Statement
Achados pelo integrador e pelos auxiliares em 2026-11-19 (relatos da F58, da F52 fatia 5 e da triagem). Criada pelo agente sob a dispensa do MJRP de 2026-11-19 19:03.

O que a leitura do código mostrou, defeito por defeito (2026-11-19, ramo `fix/f70-small-defects`):

- **UAT-208.** `services/album-search/AlbumSearchService.js` (`scanArtist`) pedia `POST /api/ai/studio-albums` para qualquer pessoa, e `api/client.js` (`_fetchAlbumFromAPI`) pedia `POST /api/generate`. O servidor recusa o convidado com 403 nas duas (`server/lib/auth/requireUser.js`). Na carga de álbuns o 403 não segura a carga (só o 401 segura): o álbum já terminava como «não achado», depois de um pedido recusado. O app não tinha um lugar que dissesse quem pode usar as rotas pagas.
- **UAT-209.** `controllers/InventoryController.js` (`handleUpdatePrice`) chamava `updatePrice(albumId, newPrice)` sem moeda: a tela ficava com o item sem moeda e o repositório gravava o seu padrão, USD, qualquer que fosse a moeda do item. A falha da gravação não mostrava aviso (o ramo que mostrava era inalcançável). Nenhuma tela chama esse caminho hoje: a janela de editar o item manda preço e moeda juntos por `handleUpdateAlbum`. O defeito estava no código e não era alcançável pela tela.
- **UAT-210.** O app ignorava `data.ratings` do `POST /api/generate`. O enriquecedor de notas confia no endereço da página de notas que vem no álbum: sem o endereço ele pergunta de novo, então a fonte que veio `failed` nunca era gravada como «sem notas» (o defeito, como descrito, era teórico). O defeito real era o contrário: com `no_ratings` (a página existe, sem nenhuma nota) o álbum vinha com o endereço e era marcado como «pronto», com notas, sem ter nenhuma.
- **UAT-63.** `components/ui/AlbumCardRenderer.js` desenhava a capa com um endereço que pode ser nulo e sem substituto na falha; o cartão da busca apontava para `/assets/images/cover_placeholder.png`, arquivo que não existe; os outros lugares tinham substituto só para o endereço ausente, cada um o seu; `components/common/AlbumCascade.js` tinha um `onerror` escrito no HTML.

## Requirements
<!-- Local IDs, two digits. Each REQ traces to an imported node; none is invented here.
     Functional and non-functional (performance, security, accessibility) alike are REQ-xx. -->
- [REQ-01] O visitante (sem conta) não faz nenhum pedido a uma rota paga do servidor: a busca de álbuns classifica sem a lista da IA e o status não anuncia que ela vem; o álbum que o Apple Music não tem termina como não achado no catálogo, com o aviso que já existe. Quem pode usar as rotas pagas é dito num lugar só do app. · fixes UAT-208
  verified_by:: `test/api/paidRoutes.test.js`; a prova no navegador é a TASK-06
- [REQ-02] Mudar só o preço de um item do inventário mantém a moeda do item, na tela e no que é gravado; um item sem moeda não ganha uma; se a gravação falha, o preço e a moeda de antes voltam e um aviso diz que falhou. · fixes UAT-209
  verified_by:: `test/services/inventory/InventoryService.price.test.js`, `test/controllers/InventoryController.price.test.js`
- [REQ-03] O app lê o que o servidor diz de cada fonte de notas de um álbum achado pela busca por IA: o que veio `found` é usado como veio; qualquer outro desfecho faz o app pedir as notas pelo caminho normal, e vale a resposta desse pedido, de modo que a falha de uma fonte nunca é guardada como «este álbum não tem notas» e a página sem notas não conta como «tem notas». O desfecho segue no álbum. Com o servidor de antes, que não diz nada, fica a regra de antes. · fixes UAT-210
  verified_by:: `test/api/generateRatingsOutcome.test.js`, `test/api/siteAgainstGenerateWithRatings.test.js`
- [REQ-04] Toda capa de álbum mostra o mesmo substituto quando não há endereço de capa ou quando o endereço falha ao carregar; o substituto é posto uma vez só por imagem. · fixes UAT-63
  verified_by:: `test/components/ui/coverImage.test.js`; a prova no navegador é a TASK-06

## Observable States
<!-- What the imported nodes point_to: the screen state in info-arch.md (the prototype the human judged —
     PRINCIPLES.md §I.13) or the behavior state in behavior.md. N/A only if the nodes point to none. -->
A feature não importa nenhum requisito (conserto de quatro issues). Os estados de comportamento que mudam ou nascem, em `docs/specs/behavior.md`:

- `^home-scan-classifying` (muda): o visitante não pede a lista da IA; o status mostra só «→ artista».
- `^library-album-failed` (muda): para o visitante, o álbum que o Apple Music não tem termina aqui, sem pedido à segunda fonte.
- `^inventory-price-keeps-currency` (novo): mudar só o preço do item.
- `^library-ai-album-ratings` (novo): as notas de um álbum achado pela busca por IA.
- `^album-cover-stand-in` (novo): a capa que não há ou não carrega; `^album-card` passa a apontar para ele.

Nenhum estado de tela novo no `info-arch.md`: nenhuma tela ganha bloco.

## Success Criteria
<!-- One measurable item per acceptance criterion of the imported nodes. -->
- Como visitante, buscar um artista de música eletrônica na Home e abrir uma série com um álbum que o Apple Music não tem: a aba de rede não mostra nenhum pedido a `/api/ai/*` nem a `/api/generate`, e o console não mostra o 403. A ver no navegador (TASK-06).
- Com conta, os mesmos dois passos fazem os pedidos como antes.
- Um item em BRL cujo preço muda continua em BRL na tela e no banco (visto no teste, com o repositório real sobre o Firestore de teste).
- Um álbum achado pela busca por IA com `acclaim: failed` e o pedido de notas do app falhando termina com a fonte em «falhou», e nada é guardado no navegador como «sem notas» (visto no teste, com o cliente, o enriquecedor e a carga reais).
- Um cartão cuja capa não carrega mostra o substituto; nenhum arquivo do app tem `onerror` escrito no HTML. A ver no navegador (TASK-06).
- Nenhuma função nova ou editada passa de complexidade 10; `_fetchAlbumFromAPI` e `normalizeAlbumData` saíram da lista de exceções.

## Out of Scope
- Mostrar na tela o desfecho de cada fonte de notas (`metadata.ratingsOutcome`): o dado passa a seguir no álbum; nenhum aviso novo foi desenhado.
- Carimbar o `not_found` do `/api/generate` com a versão da regra de identidade, no servidor: sem o carimbo, o app pergunta de novo pelo caminho normal.
- Levar para a conta o que o visitante fez (UAT-12).
- Ligar uma tela ao `handleUpdatePrice` (edição do preço direto no cartão): hoje nenhuma chama.
- O resto das UAT-18, 19 e 20 (das features donas, F58 e F64).
- A popularidade do Spotify que o servidor acha no `/api/generate`: o app continua a pedir a popularidade pela sessão da pessoa (F69).

## Open Questions
<!-- ALL resolved before Plan. -->
- Para o visitante, o álbum que o Apple Music não tem deve terminar como «não achado» ou a carga deve parar com «entre na conta»? — «Não achado», com o aviso que já existe (`^library-album-failed`): a parada da carga (`^library-ratings-load-held`) fala de um login que não pôde ser confirmado e de retomar a carga, e para o visitante não há o que retomar. Decidido pelo agente — revisável, 2026-11-19.
- Com `PAID_ROUTES_ALLOW_ANONYMOUS=true` no servidor (não é o caso da produção), o visitante deveria pedir? — Não: o app não conhece essa chave; se ela for ligada um dia, a regra muda em `api/paidRoutes.js`. Decidido pelo agente — revisável, 2026-11-19.
- Os quatro substitutos de capa que existiam (nota musical, «?», disco, degradê com disco) viram um só: o MJRP aprova a troca? — Aberta para o julgamento dele na TASK-07; o código já usa um só.
