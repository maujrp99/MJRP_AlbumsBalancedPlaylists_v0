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
- **2. O raspador aceita só o álbum certo** — não feita. A regra de identidade nos cinco pontos de aceite do raspador (depende da primeira fatia da F55); nova versão do registro guardado no navegador; fatos antigos da série como «desconhecido».
- **3. Tempo, fila e «não tem» confiável** — não feita. Orçamento de tempo por álbum no servidor (menor que os 20 s do app); fila por instância com uma instância fixa no Cloud Run; «não tem» confiável por 24 horas («álbum sem página») ou 7 dias («página sem notas»).
- **4. Medir** — não feita. Medir a primeira carga e contar quantos álbuns estavam errados; decidir o guardado persistente com o número.

Fora desta feature, por decisão da seção 11: a popularidade do Spotify com falha como falha (item próprio) e a memória curta por instância.

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
- [REQ-06] O raspador de notas só aceita a página do álbum pedido, nos cinco pontos de aceite; o que estava guardado errado no navegador é descartado. (fatia 2, não feita) · fixes UAT-23
  verified_by:: «a escrever na fatia 2»
- [REQ-07] O servidor responde dentro de um orçamento de tempo por álbum menor que o prazo do app, controla o ritmo com a fonte raspada, e o app passa a confiar no «não tem» por 24 horas ou 7 dias. (fatia 3, não feita) · fixes UAT-23
  verified_by:: «a escrever na fatia 3»
- [REQ-08] A primeira carga é medida e conta-se quantos álbuns estavam com nota errada; o guardado persistente no servidor é decidido com o número. (fatia 4, não feita) · fixes UAT-23
  verified_by:: «a escrever na fatia 4»

## Observable States
N/A: a feature não importa nó de requisito com estado de tela. O que se vê: a nota de um álbum em «falhou» (com «tentar de novo») em vez de «sem nota» quando a fonte falha; um aviso único quando a carga é segurada por 401 ou 429.

**Mudança de comportamento declarada (seção 11, item 8):** um álbum cuja página na fonte existe e tem zero notas casadas contava como «tem notas» (`done`); com o servidor novo passa a «não tem» (`empty`). Isso muda o filtro «por fonte» e o fato gravado na série para esses álbuns. Os registros já guardados no navegador não são mexidos nesta fatia (a fatia 2 troca a versão do registro).

## Success Criteria
- Com a fonte de notas fora do ar, `POST /api/enrich-album` responde 502, 503 ou 504 com `{ error: { code, retryable: true } }`, nunca `not_found`.
- Um álbum sem página na fonte responde 200 com `outcome: 'not_found'`; uma página sem notas para as faixas pedidas, `no_ratings`.
- Para cada linha da tabela do provedor de IA, a resposta do servidor tem o status, o código e o `retryable` da linha, e nenhum texto do provedor.
- Uma aba antiga faz uma chamada só a `/api/generate` em cobrança, cota, pedido recusado e resposta inaproveitável.
- O site novo contra o servidor antigo não guarda nada que o servidor antigo não tenha dito.

## Out of Scope
- Mudar como o raspador aceita um álbum (fatia 2) e a versão do registro guardado (fatia 2).
- Fila, orçamento de tempo e prazos de confiança no «não tem» (fatia 3): `EMPTY_TRUSTED_FOR_MS` segue em 1 hora.
- A popularidade do Spotify com falha como falha (item próprio).
- As rotas `musickit`, `playlists` e de depuração: seguem montando o próprio erro.
- Uma tela para o estado «carga segurada»: nesta fatia há só o aviso (toast).

## Open Questions
- Guardado persistente no servidor: só depois de medir, como proposto, ou já? — do MJRP, na fatia 4.
- A lista de álbuns por IA mudou de lugar na resposta (`data.albums`); uma aba antiga deixa de lê-la até ser recarregada e cai na classificação sem a lista. Aceitar, ou o servidor manter `albums` no topo por um tempo? — do MJRP; decisão do agente, revisável: aceitar.
