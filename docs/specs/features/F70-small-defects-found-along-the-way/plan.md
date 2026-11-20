<!-- docs/specs/features/Fxx-slug/plan.md — HOW. No edge of its own in the graph: the trace to the REQs is the
     cross-check before approval. -->
# Plan — Feature F70: Defeitos pequenos achados no caminho da v5.0 · Spec: [[spec]]
**Approved**: not a gate (via rápida; o MJRP julga)

## Architecture Approach
<!-- How it fits arch.md; components affected; what this plan refines in arch.md and data-model.md. -->
Quatro consertos pequenos, cada um no dono da regra, sem camada nova. Três peças novas, todas puras ou quase: `api/paidRoutes.js` (ao lado do `serverFetch.js`, lê o mesmo login), `models/ratingsOutcome.js` (modelo puro) e `components/ui/coverImage.js` (componente de interface). Nada muda no `data-model.md` (nenhum campo novo no banco; `metadata.ratingsOutcome` vive no álbum em memória e no que o navegador guarda dele). No `arch.md`, a linha «o servidor responde 200 com resultado vazio» já estava vencida pela F52; esta feature não a toca.

## Technical Design
<!-- Data flow first · components/modules (what each receives, renders or returns, emits) · API/interface
     changes · explicit file paths. Each component names the REQ-xx it addresses. -->
**REQ-01, rotas pagas.** `public/js/api/paidRoutes.js`: `isVisitor(user)`, `createPaidRoutesGate({ getUser })` (pura) e `mayUsePaidRoutes()` (ligada a `auth.currentUser`, o mesmo login que `api/serverFetch.js` envia). Falso só para o convidado; sem login conhecido a chamada segue e o 401 do servidor segura a carga, como antes. Chamadores:
- `services/album-search/AlbumSearchService.js`: `scanArtist` só pede a lista quando `mayUsePaidRoutes()`; senão devolve `reclassified: null`, e o `AlbumPickerController` já desenha `classifying: false`. `_fetchAIWithCache` devolve lista vazia sem lembrar nada.
- `api/client.js`: `_fetchAlbumFromAPI` devolve `null` sem chamar; o `CatalogAdapter` termina o álbum em `AlbumNotFoundError`.

**REQ-02, preço.** `services/inventory/InventoryService.js` `updatePrice(albumId, newPrice, currency?)`: a moeda é a dada ou a do item na store; `priceChanges` só inclui a moeda quando há uma; `_writePrice` usa `repository.updatePrice` (que confere a moeda) ou, sem moeda, `repository.updateAlbum` com só o preço. `controllers/InventoryController.js` `handleUpdatePrice(albumId, newPrice, currency?)`: `try/catch`, aviso nos dois casos, redesenho a partir da store.

**REQ-03, notas.** `public/js/models/ratingsOutcome.js`: `SourceOutcome`, `readRatingsOutcome(ratings)`, `ratingsOutcomeOf(album, source)`, `cameWithTheAlbum(outcomes, source)`. `api/client.js` `normalizeAlbumData`: guarda `metadata.ratingsOutcome` e só mantém `bestEverUrl` e `bestEverAlbumId` quando `cameWithTheAlbum`. O `AcclaimEnricher` (`services/albums/adapters/enrichers.js`) não muda: sem o endereço ele pede `POST /api/enrich-album`, e a resposta dele já carrega o motivo e a versão da regra de identidade que os prazos de confiança usam (`AlbumCacheAdapter`). A regra fica num lugar só, na borda.

**REQ-04, capas.** `public/js/components/ui/coverImage.js`: `coverImage(props)` devolve o `<img data-cover>`; sem endereço põe o substituto (`COVER_STAND_IN`, SVG embutido); `watchCovers(document)` instala uma vez um ouvinte de `error` na fase de captura, que troca a imagem pelo substituto e marca `data-cover-stand-in`. Chamadores: `components/ui/AlbumCardRenderer.js`, `components/ui/Card.js`, `components/common/AlbumCascade.js`, `components/ViewAlbumModal.js`, `views/renderers/DiscographyRenderer.js`, `views/renderers/StagingAreaRenderer.js`.

## Dependencies
<!-- New dependencies with their justification — aligned with constitution.md and PRINCIPLES.md (Constitution
     Check); contradicting either needs a recorded decision first (mjrp-recording-decisions). -->
Nenhuma.

## Documents Consulted
<!-- arch.md, data-model.md, info-arch.md, behavior.md, design-system.md, constitution.md, the NFR nodes. -->
`AGENTS.md`, `docs/specs/behavior.md`, `docs/specs/arch.md` (carga de álbuns, contrato de erro), `docs/specs/uat.md` (UAT-208, 209, 210, 63), `reports/evidence/F52/2026-11-19-slice-5-generate-path-proof.md`, `server/lib/auth/guards.js`, `server/lib/rankingSources/`, `docs/manual/03_Backend_API_Layer.md`, `docs/manual/07_Frontend_Data_Infra.md`.

Declarações do passo retroativo da via rápida (conferidas no histórico do repositório em 2026-11-19):
- `docs/specs/constitution.md` — sem mudança: nenhum padrão de código nem dependência novos
- `docs/specs/arch.md` — sem mudança: nenhum componente, fluxo técnico ou integração novos
- `docs/specs/data-model.md` — sem mudança: nenhuma entidade, campo ou esquema mudou
- `docs/specs/tech-stack.md` — sem mudança: nenhuma dependência nova
- `docs/specs/design-system.md` — sem mudança: o projeto não tem `docs/specs/design-system.md`; nenhum token, fonte ou componente compartilhado mudou
- `docs/specs/behavior.md` — atualizado (commit `babaa88`)
- `docs/wiki/` — sem mudança: as páginas de `docs/wiki/` do projeto são só as do harness; nenhuma descreve uma regra do app que esta feature mudou

## Risks & Considerations
- **Visitante e a segunda fonte.** O álbum que só a busca por IA acha não carrega para o visitante. Já era assim (o servidor recusava); agora sem o pedido.
- **`no_ratings` custa um pedido a mais.** O álbum da busca por IA cuja página não tem notas passa a pedir `POST /api/enrich-album` uma vez, para guardar a resposta com o motivo. É raro (álbum fora do Apple Music e página sem notas).
- **Álbuns já guardados no navegador** vindos da busca por IA com a página sem notas continuam como estavam até serem carregados de novo («Refetch» ou «Clear Cache»).
- **Um substituto só.** Quatro desenhos diferentes viram um; é mudança visível, para o MJRP julgar.
- **Arquivos fora da lista deste ramo**, com edição mínima: `components/ui/Card.js`, `components/ViewAlbumModal.js`; arquivo novo em `models/`.

## Test plan
> Derivado dos REQ do `spec.md` · 2026-11-19 22:12 (Brasília)

| REQ | Caso de teste | Critério / estado | Camada | Automatizado? |
|---|---|---|---|---|
| REQ-01 | a regra: convidado não pode, conta pode, sem login a chamada segue | `^home-scan-classifying` | modelo (`api/paidRoutes.js`) | sim |
| REQ-01 | busca de artista eletrônico como visitante | nenhum pedido de rede; `reclassified: null`; status «→ artista» | serviço | sim |
| REQ-01 | álbum que o Apple Music não tem, como visitante | nenhum pedido; `AlbumNotFoundError`, sem parada da carga | cliente + adaptador | sim |
| REQ-01 | quem nomeia uma rota paga importa `paidRoutes.js`; ninguém mais lê `isAnonymous` | um lugar só | arquitetura | sim |
| REQ-01 | visitante numa segunda origem, aba de rede | nenhum pedido a `/api/ai/*` nem `/api/generate` | navegador | não (TASK-06) |
| REQ-02 | preço sem moeda dada | item mantém BRL na store e no Firestore de teste | serviço + repositório real | sim |
| REQ-02 | item sem moeda; moeda dada; outro item intocado; preço negativo | `^inventory-price-keeps-currency` | serviço + repositório real | sim |
| REQ-02 | gravação falha | item de antes na store e no banco; «Failed to update price» | serviço, controlador | sim |
| REQ-03 | `failed`, `not_asked`, `not_configured` e o pedido do app falha | fonte «falhou»; nada guardado | cliente + adaptador + enriquecedor + carga | sim |
| REQ-03 | `found` | nada é pedido; fonte «pronta» | idem | sim |
| REQ-03 | `no_ratings` com a página; `not_found` | vale a resposta do app, com motivo e versão da regra | idem | sim |
| REQ-03 | servidor sem `ratings` | como antes | idem | sim |
| REQ-04 | sem endereço; evento `error`; uma vez só; cartão escrito como texto | `^album-cover-stand-in` | componente (jsdom) | sim |
| REQ-04 | cada lugar que desenha capa usa a peça; nenhum `onerror` no HTML | idem | componente, arquitetura | sim |
| REQ-04 | capa com endereço quebrado na tela | o substituto aparece | navegador | não (TASK-06) |

Bordas fora dos critérios (achados para a `mjrp-writing-reqs` se mudam o comportamento): com `PAID_ROUTES_ALLOW_ANONYMOUS=true` no servidor o visitante continua sem pedir; o `not_found` do `/api/generate` não é guardado por não trazer a versão da regra de identidade.
