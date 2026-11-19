# F58 — serviço de carga dentro do limite de complexidade: prova (2026-11-19 20:51)

Código: ramo `fix/f58-load-service-within-the-limit` com a `main` junto (`c3ea42d`). Testes: 1869 passando em 156 arquivos; build ok.

## Medição (regra `complexity` do ESLint, limite 10)

| Área | Antes da F58 | Depois | Depois, com F57 e F62 juntas |
|---|---|---|---|
| Carga de álbuns (serviço, store, fila, modelos) | 2 | **0** | 0 |
| `public/js` (sem `vendor/`) | 97 | 94 | **80** |
| `shared/` | 9 | 9 | 9 |
| `server/` | 26 | 26 | 26 |

O teste `test/architecture/complexityLimit.test.js` mantém a carga em zero e só deixa a lista do resto do app encolher.

## No navegador, com a conta do MJRP: nada mudou

| # | Cenário | Resultado |
|---|---|---|
| 1 | Abrir a série «Grunge Rock - Classics» | 5 álbuns achados; notas `done` nos 5 (o «Nevermind» incluído); nenhuma pausa em vigor |
| 2 | Blend da série já carregada | 0,05 s até as playlists |
| 3 | Inventário | abre com «My Collection 23 albums», 5 próprios, 1 na lista de desejos |
| 4 | `/save-all` (tela de migração) | abre sem erro; antes importava um segundo Firebase de um CDN |
| 5 | Console desde a partida | nenhum erro; o menu da conta mostra a pessoa logada |

## Não visto

- A pausa de verdade (visitante recebendo 401, ou a fonte ocupada): só nos testes.
- Mudar um item do inventário, e trocar de conta para ver a lista esvaziar e voltar.
- «Clear Cache» no meio de uma carga.

## O que fica aberto

- UAT-18 e UAT-19 diminuíram, não fecharam: o que resta está no código de blend e playlists (seis arquivos que importam `app.js`, um controlador que chama o repositório) e na loja de enriquecimento do Spotify; as linhas estão em listas que só podem encolher (`test/architecture/layerBoundaries.test.js`).
