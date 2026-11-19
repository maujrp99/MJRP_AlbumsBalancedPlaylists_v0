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

### Fatia 2 — o raspador aceita só o álbum certo (não feita)
- [ ] TASK-12 a regra de identidade nos cinco pontos de aceite do raspador, com o teste «álbum ausente, artista presente dá `not_found`»; depende da primeira fatia da F55 · implements:: REQ-06 · model:: opus
- [ ] TASK-13 nova versão do registro guardado no navegador e fatos antigos da série como «desconhecido» · implements:: REQ-06 · model:: opus

### Fatia 3 — tempo, fila e «não tem» confiável (não feita)
- [ ] TASK-14 orçamento de tempo por álbum no servidor (15 s) e prazo de 8 a 10 s por requisição · implements:: REQ-07 · model:: opus
- [ ] TASK-15 fila por instância para a fonte raspada, com uma instância fixa no Cloud Run · implements:: REQ-07 · model:: opus
- [ ] TASK-16 «não tem» confiável por 24 horas («álbum sem página») ou 7 dias («página sem notas») no app · implements:: REQ-07 · model:: opus

### Fatia 4 — medir (não feita)
- [ ] TASK-17 medir a primeira carga e contar quantos álbuns estavam errados · implements:: REQ-08 · model:: opus
- [ ] TASK-18 decidir o guardado persistente no servidor · implements:: REQ-08 · model:: opus · waiting:: human — a decisão é do MJRP (seção 9 da proposta, item 3) · action:: o MJRP decide, com o número da TASK-17, se o guardado persistente entra

## Verification
- [x] TASK-19 suíte (`npx vitest run`: 786 testes), `npx vite build` e o servidor de verdade numa cópia local, com `curl` (401, 400, 503, `found`, `not_found`, 502 com a fonte inalcançável) · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05 · model:: opus · rounds:: 1
- [ ] TASK-20 conferir a fatia 1 em produção, num navegador, depois de publicados o site e o servidor · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05 · model:: opus · waiting:: human — a prova no navegador roda com o login do MJRP, e a fatia ainda não foi integrada nem publicada · action:: o integrador leva o ramo à `main` e publica (site, depois servidor); o MJRP abre a tela de álbuns em produção e confere que as notas carregam e que uma falha aparece como «falhou»

## Documentation
- [x] update the specs affected (`docs/manual/03_Backend_API_Layer.md`, `docs/manual/07_Frontend_Data_Infra.md`, e as frases que ficaram falsas em `01`, `02` e `07b`)
- [ ] mark F52 Done in spec.md · commit: feat: implement server-album-generation-back (só depois das fatias 2 a 4)
- [ ] fechar chamando a `mjrp-ensuring-sdd` (a forma e o cruzamento dos artefatos) antes do Done — o `sdd_shape_check.py` recusa o fecho fora do molde
