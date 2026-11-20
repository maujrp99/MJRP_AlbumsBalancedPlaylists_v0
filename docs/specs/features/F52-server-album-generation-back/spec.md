---
status: In Progress
lane: fast
solution_type: fix
imports: []
fixes: ["UAT-181", "UAT-23"]
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
# Feature F52: O servidor diz a verdade
**Approved**: not a gate (via rápida; o MJRP julga)

## Summary
**A feature:** Quando o servidor não consegue uma resposta, ele diz que **falhou**, e o app trata como falha. «Não tem» só aparece quando a fonte respondeu que não tem. O desenho aprovado é a seção «O servidor diz a verdade — proposta (F52)» do `docs/specs/arch.md`, com as emendas da seção 11.

**Por quê:** Hoje o servidor responde 200 e vazio quando a fonte de notas ou a IA falha; o app acredita, grava «sem nota» e a Home classifica sem a lista da IA. Na busca de álbum por IA, o erro cru do provedor chegava ao navegador.

**Como saber que funcionou:** Com a fonte de notas fora do ar, `POST /api/enrich-album` responde 5xx e a nota do álbum fica em «falhou», com «tentar de novo», e nada é gravado. Um álbum sem página na fonte responde 200 com `not_found`. Nenhuma resposta do servidor traz texto do provedor de IA.

## Problem Statement
violates:: [[constitution#I]] (sem falha silenciosa). Issues: UAT-23 (falha de leitura vira resposta vazia) e UAT-181 (o 402 do provedor de IA chegava ao app como erro de pagamento). A crítica separada de 2026-11-19 16:18 (`reports/audits/2026-11-19-mjrpalbumblender-v0-f52-proposal-critique.md`) corrigiu a proposta em dez pontos; o MJRP aprovou ir ao código com a proposta emendada em 2026-11-19 17:04.

## Fatias (cada uma vai para produção sozinha)
- **1. Contrato e falha que sobe** — **feita em 2026-11-19 no ramo `fix/f52-server-tells-the-truth`** (falta entrar na `main` e ir para produção: site primeiro, servidor depois). Toda resposta de sucesso diz o desfecho (`outcome`); toda falha sai num formato só (`{ error: { code, retryable } }`); a falha do provedor de IA sai por uma tabela fechada; o raspador de notas lança a falha em todas as buscas; o app lê a resposta num lugar só, decide repetir pelo campo `retryable` e segura a fila em 401 e 429.
- **2. O raspador aceita só o álbum certo** — **entregue pela F55** (fatias 1 e 2, em produção em 2026-11-19): a regra única de identidade (`shared/albumIdentity.js`) vale em todos os pontos de aceite do raspador. No lugar de trocar a versão do registro guardado no navegador, a F55 confere cada registro na leitura e descarta o que não é o álbum pedido. Os fatos antigos da série não viraram «desconhecido»: são reescritos a cada carga terminada (ver Open Questions).
- **3. Tempo, fila e «não tem» confiável** — **feita em 2026-11-19 no ramo `fix/f52-slices-3-4`** (falta entrar na `main` e ir para produção). No servidor: orçamento de 15 s por álbum e 8 s por requisição à fonte; uma fila educada por instância (2 requisições por vez, 250 ms entre inícios, espera crescente no 429 e no 503, `Retry-After` respeitado); pedidos iguais simultâneos dividem uma busca só. No app: «álbum sem página» vale 24 horas e «página sem notas» vale 7 dias; a resposta do servidor antigo segue valendo 1 hora; a carga das notas espera, em vez de falhar, quando o servidor diz até quando a fonte pediu para esperar.
- **4. Medir** — **a medição está construída; o número e a decisão, não.** O servidor escreve uma linha de log por pedido de notas (de onde veio a resposta, qual foi, em quanto tempo, quantas requisições à fonte). A contagem dos álbuns errados foi feita pela F55 (227 pedidos, 227 iguais, `reports/evidence/F55/2026-11-19-slice-2-browser-proof.md`). Falta ler o número da primeira carga em produção e o MJRP decidir o guardado persistente.
- **5. O caminho de `/api/generate` diz a verdade** — **feita em 2026-11-19 no ramo `fix/f52-slice-5-generate-path-tells-the-truth`** (falta entrar na `main` e ir para produção; só o servidor muda). É o que sobrava da UAT-23. O ranking de um álbum vira uma esteira de fontes (BestEverAlbums, popularidade do Spotify, IA), cada uma com um desfecho com nome; a falha de uma fonte nunca é lida como «não tem». A resposta do álbum diz, fonte por fonte, o que houve com as notas (`data.ratings`). O arquivo de prompts ausente ou inutilizável faz o servidor não subir. A rota ganha um prazo total (75 s) e uma linha de log por pedido. Dois testes de arquitetura seguram o conserto: nenhum `catch` engole, e o limite de complexidade passa a valer no servidor.

Fora desta feature, por decisão da seção 11: a popularidade do Spotify com falha como falha (item próprio, ainda sem feature criada) e a memória curta por instância (cortada até haver número). O que a leitura do código mostrou sobre a popularidade está no plano, em «Risks & Considerations».

## Requirements
<!-- Local IDs, two digits. Each REQ traces to an imported node; none is invented here.
     Functional and non-functional (performance, security, accessibility) alike are REQ-xx. -->
- [REQ-01] Toda resposta de sucesso das rotas de álbum e de IA diz o desfecho (`found`, `not_found` ou `no_ratings`), e toda falha do servidor sai num formato só, com um código de uma lista fechada e a indicação de se vale repetir; nenhuma mensagem do provedor ou de dentro do servidor sai na resposta. · fixes UAT-23
  verified_by:: `test/server/outcome.test.js`, `test/server/debugGate.test.js`, `test/server/authGuard.test.js`
- [REQ-02] Uma falha da fonte de notas (sem resposta, prazo, 429, qualquer erro de HTTP) chega ao app como falha, em qualquer das buscas do raspador; «não achei» só quando a fonte respondeu a todas e nada bateu. A rota de notas não pede a chave de IA. · fixes UAT-23
  verified_by:: `test/server/ratings.test.js`
- [REQ-03] A resposta do provedor de IA é traduzida por uma tabela fechada: cobrança, cota, pedido recusado e resposta inaproveitável saem com um status que uma aba antiga não repete e com `retryable: false`; só falha passageira sai como 5xx com `retryable: true`. A lista de álbuns por IA não responde 200 com lista vazia numa falha. · fixes UAT-181, UAT-23
  verified_by:: `test/server/aiProvider.test.js`, `test/api/oldTabAgainstNewServer.test.js`
- [REQ-04] O app lê a resposta do servidor num lugar só: falha termina como falha (a fonte fica `failed`, nada é guardado), «a fonte não tem» termina como `empty`, e repetir uma chamada é decidido pelo campo `retryable`. Uma resposta do servidor antigo (200 sem `outcome`, erro como texto) segue a regra de antes. · fixes UAT-23
  verified_by:: `test/api/serverResult.test.js`, `test/api/client.test.js`, `test/services/albums/adapters.test.js`, `test/services/album-search/AlbumSearchService.aiList.test.js`
- [REQ-05] Um 401 ou um 429 do próprio servidor segura a carga de álbuns em vez de marcar cada álbum como falha: no 429 a carga volta sozinha no prazo do `Retry-After`; no 401 ela para de perguntar e avisa uma vez. · fixes UAT-23
  verified_by:: `test/services/albums/AlbumLoadService.test.js`, `test/utils/TaskQueue.test.js`, `test/models/albumLoadState.test.js`
- [REQ-06] O raspador de notas só aceita a página do álbum pedido, nos cinco pontos de aceite; o que estava guardado errado no navegador é descartado. (fatia 2, entregue pela F55: REQ-05 e REQ-11 dela) · fixes UAT-23
  verified_by:: `test/server/scraperIdentity.test.js`, `test/server/ratings.test.js`, `test/services/albums/adapters.test.js`
- [REQ-07] O servidor responde dentro de um orçamento de tempo por álbum menor que o prazo do app, controla o ritmo com a fonte raspada, e o app passa a confiar no «não tem» por 24 horas ou 7 dias. (fatia 3) · fixes UAT-23
  verified_by:: `test/server/pace.test.js`, `test/server/ratingsPace.test.js`, `test/services/albums/emptyTrust.test.js`, `test/api/serverResult.test.js`, `test/api/oldTabAgainstNewServer.test.js`
- [REQ-08] A primeira carga é medida e conta-se quantos álbuns estavam com nota errada; o guardado persistente no servidor é decidido com o número. (fatia 4: a linha de log está construída e testada, a contagem veio da F55; o número em produção e a decisão estão abertos, TASK-18 e TASK-25) · fixes UAT-23
  verified_by:: `test/server/ratingsPace.test.js` (a linha de log), `reports/evidence/F55/2026-11-19-slice-2-browser-proof.md` (a contagem)
- [REQ-09] Pedidos de notas iguais e simultâneos (mesmo artista e título) fazem uma busca só na fonte, e cada um recebe as notas das suas faixas; nada fica guardado no servidor de um pedido para o outro. (fatia 3) · fixes UAT-23
  verified_by:: `test/server/pace.test.js`, `test/server/ratingsPace.test.js`
- [REQ-10] Quando a fonte de notas pede para esperar por mais tempo do que o pedido tem, o servidor responde 503 `upstream_busy` com `Retry-After`, e o app segura a carga das notas até lá, com um aviso, em vez de marcar cada álbum como falha. Uma falha nunca é guardada no navegador, nem pelo «Refetch» do álbum. (fatia 3) · fixes UAT-23
  verified_by:: `test/server/ratingsPace.test.js`, `test/api/serverResult.test.js`, `test/services/albums/AlbumLoadService.test.js`, `test/models/albumLoadState.test.js`, `test/services/albums/emptyTrust.test.js`
- [REQ-11] O ranking de um álbum em `POST /api/generate` vem de uma esteira de fontes perguntadas numa ordem declarada (BestEverAlbums, popularidade do Spotify, IA), cada uma com um desfecho com nome (`found`, `not_found`, `no_ratings`, `not_configured`, `failed`, `not_asked`); a escolha do ranking e a consolidação são passos puros; nos caminhos em que as fontes respondem, o álbum sai igual ao de antes; a falha de uma fonte nunca é lida como «a fonte não tem». (fatia 5) · fixes UAT-23
  verified_by:: `test/server/rankingPipeline.test.js`, `test/server/rankingConsolidation.test.js`, `test/server/generateAlbumAnswer.test.js`, `test/server/rankingEntries.test.js`
- [REQ-12] `POST /api/generate` segue respondendo o álbum quando o álbum foi achado, e o corpo diz, em `data.ratings`, o desfecho de cada fonte de notas: «não tem nota» e «não deu para buscar as notas» ficam diferentes. Uma falha das notas não derruba o pedido; um defeito do próprio servidor (consolidação que quebra) responde `internal`, nunca um álbum sem ranking. O site de hoje segue funcionando: ignora o campo novo. (fatia 5) · fixes UAT-23
  verified_by:: `test/server/generateAlbumAnswer.test.js`, `test/server/aiProvider.test.js`, `test/api/siteAgainstGenerateWithRatings.test.js`
- [REQ-13] O arquivo de prompts ausente, ilegível, que não é JSON ou sem um dos prompts que as rotas usam faz `loadPrompts` lançar, e o servidor o carrega na partida: sem os prompts ele não sobe, e o teste de fumaça da publicação para ali. Uma rota que precisa de um prompt que não existe responde `internal` (500, sem repetir), e o provedor pago não é chamado. O validador do álbum segue a mesma regra: não carregar é erro na partida. (fatia 5) · fixes UAT-23
  verified_by:: `test/server/prompts.test.js`, `test/server/generateAlbumAnswer.test.js`
- [REQ-14] `POST /api/generate` tem um prazo total menor que o prazo do app para essa chamada: o provedor que não responde o álbum nesse tempo é `upstream_timeout`; a fonte de notas que ainda roda quando o tempo acaba fica `failed` em `data.ratings`, e o álbum sai. (fatia 5) · fixes UAT-23
  verified_by:: `test/server/generateAlbumAnswer.test.js`, `test/server/rankingPipeline.test.js`
- [REQ-15] Cada pedido de `POST /api/generate` que chega ao serviço escreve uma linha de log `generate`: a resposta, o status, o tempo e o desfecho de cada fonte de notas, sem dado da pessoa nem do álbum. (fatia 5) · fixes UAT-23
  verified_by:: `test/server/generateAlbumAnswer.test.js`
- [REQ-16] Nenhum `catch` vazio em `server/` fora de uma lista com motivo, e nenhum `catch` que só escreve no log no caminho de `/api/generate` e de `/api/enrich-album`; o limite de complexidade (10) vale no servidor e nos módulos compartilhados, com listas que só encolhem, e sem exceção no caminho reescrito. (fatia 5) · fixes UAT-23
  verified_by:: `test/architecture/noSwallowedFailure.test.js`, `test/architecture/complexityLimit.test.js`

## Observable States
N/A: a feature não importa nó de requisito com estado de tela. O que se vê: a nota de um álbum em «falhou» (com «tentar de novo») em vez de «sem nota» quando a fonte falha; um aviso único quando a carga é segurada por 401 ou 429, e, desde a fatia 3, quando a fonte de notas pediu para esperar («The ratings source asked to slow down. Loading ratings is paused. It resumes by itself at HH:MM.»). Descrito em `docs/specs/behavior.md` (`^library-ratings-load-held`, `^local-album-cache`).

**Mudança de comportamento declarada (seção 11, item 8):** um álbum cuja página na fonte existe e tem zero notas casadas contava como «tem notas» (`done`); com o servidor novo passa a «não tem» (`empty`). Isso muda o filtro «por fonte» e o fato gravado na série para esses álbuns. Os registros já guardados no navegador não são mexidos nesta fatia (a fatia 2 troca a versão do registro).

**Mudança de comportamento declarada (fatia 3):** (1) um álbum que a fonte de notas não tem deixa de ser perguntado a cada hora: volta a ser perguntado depois de 24 horas («sem página») ou 7 dias («página sem notas»); o «Refetch» do álbum pergunta na hora. (2) Um pedido de notas que passa de 15 s no servidor volta como falha (504) com «tentar de novo»; antes o app desistia aos 20 s e o servidor seguia raspando. (3) O «Refetch» que volta sem notas não marca mais as notas como presentes no guardado.

**Mudança de comportamento declarada (fatia 5), só no servidor:** (1) a resposta de `/api/generate` ganha `data.ratings`, e `rankingConsolidatedMeta.fetchRankingDebug` passa a ser uma linha por fonte (desfecho e código), sem mensagem de fonte; (2) uma consolidação que quebra respondia 200 com ranking vazio e o erro no corpo; agora responde 500 `internal`; (3) no caminho em que o Spotify ganha de uma página com poucas notas, o raspador era perguntado duas vezes e `bestEverUrl` saía vazio; agora é perguntado uma vez e o endereço vem; (4) um servidor sem o arquivo de prompts, ou sem o validador do álbum, não sobe mais; (5) um pedido que passa de 75 s no servidor responde antes do app desistir.

## Success Criteria
- Com a fonte de notas fora do ar, `POST /api/enrich-album` responde 502, 503 ou 504 com `{ error: { code, retryable: true } }`, nunca `not_found`.
- Um álbum sem página na fonte responde 200 com `outcome: 'not_found'`; uma página sem notas para as faixas pedidas, `no_ratings`.
- Para cada linha da tabela do provedor de IA, a resposta do servidor tem o status, o código e o `retryable` da linha, e nenhum texto do provedor.
- Uma aba antiga faz uma chamada só a `/api/generate` em cobrança, cota, pedido recusado e resposta inaproveitável.
- O site novo contra o servidor antigo não guarda nada que o servidor antigo não tenha dito.
- (fatia 3) Com a fonte de notas lenta, `POST /api/enrich-album` responde em até 15 s com 504 `upstream_timeout`; com a fonte respondendo 429 sem parar, 503 `upstream_busy` com `Retry-After`. Nunca `not_found`.
- (fatia 3) Dois pedidos iguais ao mesmo tempo aparecem no log como `how: "source"` e `how: "joined"`, e a fonte recebe as requisições de um só.
- (fatia 3) Um álbum que a fonte não tem não gera novo pedido de notas ao recarregar a tela dentro de 24 horas.
- (fatia 5) Com o BestEverAlbums fora do ar, `POST /api/generate` responde 200 com o álbum e `data.ratings.acclaim: "failed"`; com a fonte respondendo que não tem o álbum, `"not_found"`. Os dois nunca saem iguais.
- (fatia 5) Sem `config/prompts.json`, o servidor não sobe e a publicação para no teste de fumaça.
- (fatia 5) Nenhuma função do caminho reescrito passa de 10 de complexidade; `fetchRankingForAlbum` (139), `_albumFromResponse` (65) e `consolidateRanking` (49) saem da conta.

## Out of Scope
- A popularidade do Spotify com falha como falha (item próprio; a seção 11, item 10, tirou desta feature).
- A memória curta de respostas por instância e o guardado persistente no servidor (seção 11, item 10; TASK-18).
- Fixar uma instância no Cloud Run: é configuração do serviço, feita por quem publica (seção 11, item 9); o código não a impõe.
- O app usar `data.ratings` (fatia 5): o servidor passa a dizer; o que o app faz com isso é um item à parte (ver Open Questions).
- Cancelar a chamada ao provedor de IA que perdeu a corrida com o prazo: ela termina sozinha no prazo próprio (60 s) e a resposta é descartada.
- As rotas `musickit`, `playlists` e de depuração: seguem montando o próprio erro.
- Uma tela para o estado «carga segurada»: nesta fatia há só o aviso (toast).

## Open Questions
- Os prazos de confiança (24 horas e 7 dias), o orçamento (15 s, 8 s por requisição) e o ritmo com a fonte (2 por vez, 250 ms, espera de 1 s dobrando até 30 s, 3 tentativas) foram decididos pelo agente, sem medição de como a fonte responde a uma rajada. — do MJRP, revisáveis com o número do log.
- Fatos da série gravados antes da F52: a seção 11 (item 8) pedia que valessem como «desconhecido». Não foi construído: os fatos são reescritos a cada carga terminada, e um «sem nota» antigo no navegador vale só 1 hora, então se refazem na primeira carga. Fica um caso sem conserto automático: o álbum que o servidor de antes da F52 marcou como «tem notas» por ter página com zero notas casadas (guardado como `done`, com o endereço da página). Quantos são não foi contado. — do MJRP: aceitar (o «Refetch» do álbum não o conserta; «Clear Cache» sim) ou abrir item.
- Guardado persistente no servidor: só depois de medir, como proposto, ou já? — do MJRP, na fatia 4.
- A lista de álbuns por IA mudou de lugar na resposta (`data.albums`); uma aba antiga deixa de lê-la até ser recarregada e cai na classificação sem a lista. Aceitar, ou o servidor manter `albums` no topo por um tempo? — do MJRP; decisão do agente, revisável: aceitar.
- (fatia 5) O que o app faz com `data.ratings`: hoje ignora. Proposta: quando uma fonte vem `failed`, o app não grava «este álbum não tem nota» para ela e deixa o enriquecedor de notas (`/api/enrich-album`) perguntar de novo. — do MJRP ou do integrador: abrir o item.
- (fatia 5) O prazo de 75 s foi escolhido sem medir (o app espera 90 s; o provedor tem 60 s próprios). — do MJRP, revisável com a linha de log `generate`.
- (fatia 5) Um defeito do servidor depois do álbum pago (consolidação que quebra) responde 500 e o álbum pago se perde; antes saía um álbum sem ranking, igual a «não tem nota». Decidido pelo agente — revisável: dizer a verdade vale mais que aproveitar a resposta, e o 500 não é repetido.
