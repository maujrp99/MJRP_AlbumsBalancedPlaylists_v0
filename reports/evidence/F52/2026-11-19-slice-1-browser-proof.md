# F52 fatia 1 — prova no navegador e no servidor local (2026-11-19 17:38)

Código: ramo `fix/f52-server-tells-the-truth` com a `main` junto (`fab788d`). Testes: 789 passando em 77 arquivos; build ok.

## Cenários e resultados

| # | Cenário | Como | Resultado |
|---|---|---|---|
| 1 | Site novo com o servidor antigo (produção, antes da F52) | app local na versão nova, `/api` em produção; busca «the smiths» na Home | 4 álbuns de estúdio, 1 ao vivo, 8 coletâneas; a lista da IA lida como `legacy` |
| 2 | Notas, álbum que a fonte tem | app local com login, servidor novo local; Pink Floyd «Animals» | 200, `outcome: found` |
| 3 | Notas, álbum que a fonte não tem | artista e álbum inventados | 200, `outcome: not_found` |
| 4 | Álbum por IA sem a chave | `/api/generate` | 503 `internal`, `retryable: false`, sem segurar a carga, nenhuma chamada paga |
| 5 | Lista da IA sem a chave | `/api/ai/studio-albums`; busca «pink floyd» na Home | 503 `internal`; a Home mostrou 18 álbuns classificados sem a lista |
| 6 | Fonte de notas fora do ar | servidor local com a saída de rede quebrada, sem a porta de login | 502 `upstream_failed`, `retryable: true`; no log `[BEA] request failed` |
| 7 | Chaves do Google fora do alcance | servidor local com a saída quebrada, com login | 503 `upstream_busy`, `retryable: true`; o app recebe `ApiError` com `retryable` |
| 8 | Sem login | `curl` | 401 `unauthorized` no formato novo |

## Não visto no navegador

- A carga segurando a fila num 401 ou 429 (só nos testes de unidade).
- A tela de álbuns com «falhou» e «tentar de novo» vindo do servidor novo (só nos testes de unidade).
- As rotas pagas com a chave de verdade (só em produção, depois da publicação).
