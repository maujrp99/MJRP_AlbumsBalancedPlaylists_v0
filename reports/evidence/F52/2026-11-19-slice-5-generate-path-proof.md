# F52 fatia 5 — o caminho da busca de álbum por IA diz a verdade: prova no servidor local (2026-11-19 21:52)

Código: ramo `fix/f52-slice-5-generate-path-tells-the-truth` com a `main` junto. Testes: 2085 passando em 172 arquivos; build ok. Servidor local montado como a imagem, com um substituto local no lugar da IA (nenhuma chamada paga).

| # | Cenário | Resposta de `POST /api/generate` | Registro do servidor |
|---|---|---|---|
| 1 | Fonte de notas inalcançável | 200, álbum «Core» com 4 faixas; `ratings: acclaim failed, popularity not_configured, aiRanking found` | `ranking_source_failed` (BestEverAlbums, `upstream_failed`) e a linha `generate` com os mesmos desfechos |
| 2 | Fonte de notas de verdade | 200; `ratings: acclaim found, popularity not_asked, aiRanking not_asked`; página 2906; notas 82, 86, 84, 89 | linha `generate`, 3,1 s |
| 3 | Pedido sem álbum | 400 `invalid_request` | linha `generate` com `ratings: null` |
| 4 | Servidor sem o arquivo de instruções da IA | não sobe: «PromptsError: … the file is missing» | — |

Antes desta fatia, os casos 1 e «a fonte não tem notas» saíam iguais: álbum achado, sem notas, sem dizer por quê.

## Complexidade

| Função | Antes | Depois |
|---|---|---|
| `fetchRankingForAlbum` | 139 | abaixo de 8 |
| `GenerationService._albumFromResponse` | 65 | dividida; maior pedaço 8 |
| `ranking.consolidateRanking` | 49 | dividida; maior pedaço 7 |

Funções do servidor acima do limite: de 26 para 14 (a lista só pode encolher). `shared/`: zero.

## Não visto

- Em produção: uma busca paga de verdade (um álbum que o catálogo da Apple não tem) e a popularidade do Spotify com as credenciais reais do servidor.
- O app ainda não usa o campo novo `ratings`; quando uma fonte vier `failed`, ele não deveria gravar «este álbum não tem notas». Fica como continuação.
