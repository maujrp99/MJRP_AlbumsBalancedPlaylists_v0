<!-- docs/specs/features/Fxx-slug/tasks.md — WHEN. Every TASK implements at least one REQ of the spec beside
     it; every REQ is implemented by at least one TASK. -->
# Tasks — Feature F52: O servidor diz a verdade · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

## Pre-Implementation
- [x] create the branch `fix/f52-server-tells-the-truth` (da ponta da `main` local, `be346b8`)
- [x] verify the spec and the plan of F52 passed their cross-checks (and were approved, where gated): a proposta passou pela crítica separada e o MJRP aprovou ir ao código em 2026-11-19 17:04

## Implementation
<!-- Atomic (one focused session), verifiable (a clear "done"), ordered by dependency: data → logic →
     components → composition → polish. -->
<!-- Marks, after `implements::`, separated by ` · `:
     model:: sonnet|opus — MANDATORY on every task; the author of this file decides, the implementer never does.
                        sonnet = MECHANICAL: texts and registry keys, summaries, format samples and tests, derived
                        files, renames. opus = code design, architecture, critique, visual recheck. There is no
                        default: a task without the mark fails the cross-check.
     rounds:: N       — written when the task CLOSES ([x]): how many Execute ⇄ Verify rounds it took (ceiling 3).
                        `python3 mjrp-scripts/loop.py --check-tasks tasks.md` fails a closed task without it. -->
### Fatia 1 — contrato e falha que sobe (feita)
- [x] TASK-01 `server/lib/outcome.js`: o módulo que monta toda resposta (`success`, `failure`, `respond`, `UpstreamError`) — `test/server/outcome.test.js` passa · implements:: REQ-01 · model:: opus · rounds:: 1
- [x] TASK-02 `server/lib/asyncRoute.js`, `server/lib/auth/requireUser.js`, `server/lib/rateLimit.js`: os erros passam por `outcome.js`, com os status de antes — os testes existentes atualizados para o formato novo · implements:: REQ-01 · model:: opus · rounds:: 1
- [x] TASK-03 `server/lib/scrapers/besteveralbums.js`: cliente HTTP e leitor de HTML injetados; toda falha de requisição é lançada, em todas as buscas — `test/server/ratings.test.js` (raspador) passa · implements:: REQ-02 · model:: opus · rounds:: 1
- [x] TASK-04 `server/lib/services/EnrichmentService.js` e `server/routes/handlers/albums.js`: resultado tipado; a rota de notas responde o desfecho ou o 5xx e não pede a chave de IA · implements:: REQ-02 · model:: opus · rounds:: 2
- [x] TASK-05 `server/lib/aiProviderOutcome.js`: a tabela do provedor de IA como dado, cada linha testada · implements:: REQ-03 · model:: opus · rounds:: 1
- [x] TASK-06 `server/lib/services/GenerationService.js`, `server/routes/handlers/ai.js`, `server/routes/ai.js`, `server/routes/albums.js`: as duas rotas de IA respondem pela tabela, sem texto do provedor e sem 200 vazio · implements:: REQ-03 · model:: opus · rounds:: 1
- [x] TASK-07 `public/js/api/serverResult.js`: o leitor único, com o servidor novo e o antigo — `test/api/serverResult.test.js` passa · implements:: REQ-04 · model:: opus · rounds:: 1
- [x] TASK-08 `public/js/api/client.js`: `_post`, `requestRatings`, repetição do `/api/generate` pelo campo `retryable` · implements:: REQ-04 · model:: opus · rounds:: 1
- [x] TASK-09 `public/js/services/albums/adapters/enrichers.js` e `public/js/services/album-search/AlbumSearchService.js`: falha termina como falha; «a fonte não tem» como `empty`; falha da lista da IA não fica guardada · implements:: REQ-04 · model:: opus · rounds:: 1
- [x] TASK-10 `public/js/utils/TaskQueue.js`, `public/js/services/albums/AlbumLoadService.js`, `adapters/CatalogAdapter.js`, `models/albumLoadState.js`, `albumLoading.js`: 401 e 429 seguram a carga; `_enrichOne` dividido · implements:: REQ-05 · model:: opus · rounds:: 2
- [x] TASK-11 `test/api/oldTabAgainstNewServer.test.js`: a aba antiga contra o servidor novo · implements:: REQ-03 · model:: sonnet · rounds:: 1

### Fatia 2 — o raspador aceita só o álbum certo (entregue pela F55)
- [x] TASK-12 a regra de identidade nos cinco pontos de aceite do raspador, com o teste «álbum ausente, artista presente dá `not_found`» — entregue pela F55, fatia 1 (`shared/albumIdentity.js`, `test/server/scraperIdentity.test.js`); nada foi refeito aqui · implements:: REQ-06 · model:: opus · rounds:: 1
- [x] TASK-13 nova versão do registro guardado no navegador e fatos antigos da série como «desconhecido» — entregue de outro jeito pela F55, fatia 2: o registro é conferido pela regra a cada leitura e descartado se não é o álbum pedido (a versão não mudou). Os fatos antigos não viraram «desconhecido»: são reescritos a cada carga terminada; o caso que sobra está nas Open Questions da spec · implements:: REQ-06 · model:: opus · rounds:: 1

### Fatia 3 — tempo, fila e «não tem» confiável (feita)
- [x] TASK-14 orçamento de tempo por álbum no servidor (15 s) e prazo de 8 s por requisição: `server/lib/timeBudget.js`, `EnrichmentService` (`ALBUM_BUDGET_MS`), `pageGetter` no raspador — `test/server/pace.test.js`, `test/server/ratingsPace.test.js` · implements:: REQ-07 · model:: opus · rounds:: 1
- [x] TASK-15 fila por instância para a fonte raspada: `server/lib/politeQueue.js`, usada pelo `getPage` único do raspador (`BEA_PACE`). A instância fixa no Cloud Run não é código: está na TASK-25, com quem publica · implements:: REQ-07 · model:: opus · rounds:: 1
- [x] TASK-16 «não tem» confiável por 24 horas («álbum sem página») ou 7 dias («página sem notas») no app; 1 hora para o servidor antigo: `EMPTY_TRUST` em `AlbumCacheAdapter`, o motivo vindo do `AcclaimEnricher` — `test/services/albums/emptyTrust.test.js` · implements:: REQ-07 · model:: opus · rounds:: 1
- [x] TASK-21 um pedido por álbum de cada vez: `server/lib/inFlight.js`, e cada endereço pedido uma vez dentro de um pedido · implements:: REQ-09 · model:: opus · rounds:: 1
- [x] TASK-22 fonte ocupada por mais tempo que o pedido tem: 503 com `Retry-After`; o app segura a carga das notas (`HoldReason.SOURCE_BUSY`) · implements:: REQ-10 · model:: opus · rounds:: 1
- [x] TASK-23 o «Refetch» do álbum não grava `done` quando volta sem notas (`AlbumLoadService.adoptAlbum`) · implements:: REQ-10 · model:: opus · rounds:: 1

### Fatia 4 — medir (a medição construída; o número e a decisão abertos)
- [x] TASK-17 medir a primeira carga e contar quantos álbuns estavam errados — a linha de log `enrich` por pedido de notas (`server/routes/handlers/albums.js`; como ler no Cloud Run: `docs/manual/03_Backend_API_Layer.md`); a contagem dos álbuns errados veio da F55 (227 pedidos, 227 iguais). Ler o número em produção é a TASK-25 · implements:: REQ-08 · model:: opus · rounds:: 1
- [ ] TASK-18 decidir o guardado persistente no servidor · implements:: REQ-08 · model:: opus · waiting:: human — a decisão é do MJRP (seção 9 da proposta, item 3) · action:: o MJRP decide, com o número da TASK-17, se o guardado persistente entra

### Fatia 5 — o caminho de `/api/generate` diz a verdade (feita)
- [x] TASK-26 testes de caracterização do que `fetchRankingForAlbum`, `consolidateRanking` e `_albumFromResponse` fazem hoje, antes de mexer, com as fontes como dublês: `test/server/rankingPipeline.test.js`, `rankingConsolidation.test.js`, `generateAlbumAnswer.test.js`, `helpers/rankingHarness.js` · implements:: REQ-11 · model:: opus · rounds:: 1
- [x] TASK-27 a esteira de fontes com desfecho tipado: `server/lib/fetchRanking.js` (`createRankingFetch`, `PIPELINE`) e `server/lib/rankingSources/` (`sourceOutcome`, as três fontes, `rankingPlan`, `completeRanking`) · implements:: REQ-11 · model:: opus · rounds:: 1
- [x] TASK-28 a consolidação como passo puro, em funções pequenas: `server/lib/ranking.js` · implements:: REQ-11 · model:: opus · rounds:: 1
- [x] TASK-29 a resposta do álbum diz o que houve com as notas: `server/lib/albumAnswer.js`, `GenerationService` em métodos pequenos, `data.ratings`; o que quebra no servidor é lançado · implements:: REQ-12 · model:: opus · rounds:: 1
- [x] TASK-30 prompts e validador falham alto: `server/lib/prompts.js` (`PromptsError`, `requirePrompt`, `createPromptsLoader`), `server/lib/schema.js`, e a carga na partida em `server/index.js` (uma linha) · implements:: REQ-13 · model:: opus · rounds:: 1
- [x] TASK-31 prazo total de `/api/generate` (`GENERATE_BUDGET_MS`, 75 s) com `timeBudget.js`, lido pelo serviço e pela esteira · implements:: REQ-14 · model:: opus · rounds:: 2
- [x] TASK-32 a linha de log `generate` em `server/routes/handlers/albums.js` · implements:: REQ-15 · model:: opus · rounds:: 1
- [x] TASK-33 testes de arquitetura: `test/architecture/noSwallowedFailure.test.js` (com `support/catchBlocks.js` e `swallowedFailureAllowlist.js`) e o limite de complexidade em `server/` e `shared/` (`complexityLimit.test.js`, `complexityAllowlist.js`); os `catch` do caminho consertados (`normalize.js` entre eles) · implements:: REQ-16 · model:: opus · rounds:: 1
- [x] TASK-34 o site de hoje contra o servidor novo: `test/api/siteAgainstGenerateWithRatings.test.js` · implements:: REQ-12 · model:: sonnet · rounds:: 1

## Verification
- [x] TASK-19 suíte (`npx vitest run`: 786 testes), `npx vite build` e o servidor de verdade numa cópia local, com `curl` (401, 400, 503, `found`, `not_found`, 502 com a fonte inalcançável) · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05 · model:: opus · rounds:: 1
- [x] TASK-24 fatias 3 e 4: suíte (`npx vitest run`: 1130 testes), `npx vite build`, e o servidor de verdade numa cópia local, com `curl` (dois pedidos iguais: `source` e `joined`; álbum inventado: `not_found`; corpo inválido: 400) · implements:: REQ-07, REQ-08, REQ-09, REQ-10 · model:: opus · rounds:: 1
- [ ] TASK-25 provar as fatias 3 e 4: servidor local sem chamada paga, depois produção (site, depois servidor, com uma instância fixa), e ler no log do Cloud Run o número da primeira carga (soma de `sourceRequests`, quantos `upstream_timeout`); o roteiro está no relatório de entrega e em `docs/manual/03_Backend_API_Layer.md` · implements:: REQ-07, REQ-08, REQ-09, REQ-10 · model:: opus · waiting:: human — publicar, configurar o Cloud Run e provar no navegador pedem o login do MJRP; quem construiu não tem navegador · action:: o integrador leva `fix/f52-slices-3-4` à `main`, fixa uma instância, publica (site, depois servidor) e confere na tela de álbuns e no log que as notas carregam e que há uma linha `enrich` por pedido
- [x] TASK-20 conferir a fatia 1 em produção, num navegador, depois de publicados o site e o servidor — prova: `reports/evidence/F52/2026-11-19-slice-1-browser-proof.md` · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05 · model:: opus · rounds:: 1
- [x] TASK-35 fatia 5: suíte (`npx vitest run`: 2061 testes; 2073 com a `main` da F65 trazida para o ramo), `npx vite build`, e o servidor de verdade numa cópia local disposta como a imagem, com um substituto da IA na própria máquina (nenhuma chamada paga) e o BestEverAlbums inalcançável: 200 com `ratings`, 424 no 402 do substituto, a linha `generate`, e o servidor que não sobe sem o arquivo de prompts · implements:: REQ-11, REQ-12, REQ-13, REQ-14, REQ-15, REQ-16 · model:: opus · rounds:: 1
- [x] TASK-36 provar a fatia 5: servidor local sem chamada paga (o roteiro está no relatório de entrega e no `plan.md`, «Test plan — fatia 5»), depois publicar o servidor e ler no log do Cloud Run as linhas `generate` (em produção, um álbum que a Apple Music não tem mostra `ratings` com o desfecho de cada fonte) — prova: `reports/evidence/F52/2026-11-19-slice-5-generate-path-proof.md` · implements:: REQ-11, REQ-12, REQ-13, REQ-14, REQ-15 · model:: opus · rounds:: 1

## Documentation
- [x] update the specs affected (`docs/manual/03_Backend_API_Layer.md`, `docs/manual/07_Frontend_Data_Infra.md`, e as frases que ficaram falsas em `01`, `02` e `07b`)
- [x] fatias 3 e 4: `docs/manual/02_Server_Structure.md`, `03_Backend_API_Layer.md`, `07_Frontend_Data_Infra.md`, `08_Frontend_Models.md`, `18_Frontend_Logic_Core.md`, `docs/specs/behavior.md` e a nota no `docs/specs/arch.md`
- [x] fatia 5: `docs/manual/02_Server_Structure.md`, `03_Backend_API_Layer.md`, `04_Backend_Logic_Services.md` e as frases que ficaram falsas em `00_Dir_File_Structure_Map`, `01`, `05`, `23`, `32` e `99`; a nota no `docs/specs/arch.md` (seção 13)
- [ ] mark F52 Done in spec.md · commit: feat: implement server-album-generation-back (só depois das fatias 2 a 4)
- [ ] fechar chamando a `mjrp-ensuring-sdd` (a forma e o cruzamento dos artefatos) antes do Done — o `sdd_shape_check.py` recusa o fecho fora do molde
