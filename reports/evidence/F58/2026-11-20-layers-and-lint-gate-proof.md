# F58 segunda fatia e trava de lint da F64: prova (2026-11-19 22:18)

Código: `main` em `fd9a0a1`. Testes: 2219 passando em 183 arquivos; build ok; `npx eslint .`: 0 erros, 23 avisos.

## O que mudou

| Issue | O que foi feito | O que guarda |
|---|---|---|
| UAT-18 lojas que chamam banco | a última (a de popularidade do Spotify) virou um serviço atrás de uma porta; nenhum arquivo de `stores/` importa banco, repositório, cliente de API ou login | `test/architecture/layerBoundaries.test.js`: a lista ficou vazia |
| UAT-19 telas pulam a camada de serviço | o serviço de playlists é montado num lugar só (`services/playlists/playlistsWiring.js`); nenhum controlador, tela ou componente importa `app.js`, o banco ou um repositório; `app.js` não exporta mais nada | o mesmo teste: as duas listas ficaram vazias, e três regras novas |
| UAT-20 a verificação de código não bloqueia | 22 erros de lint consertados (com teste antes de cada mudança de sentido); o lint entrou na automação do GitHub e nos dois roteiros de publicação, antes dos testes | a própria publicação: «Checking the code (npx eslint . --quiet) … ok: no lint errors» |

## No navegador, com a conta do MJRP (app local)

| # | Cenário | Resultado |
|---|---|---|
| 1 | Blend da série «Grunge Rock - Classics» | playlists na tela; o campo do nome do lote vem com o nome sugerido |
| 2 | Arrastar a primeira faixa para a terceira posição (o gesto foi simulado pelo mesmo caminho que a biblioteca de arrastar usa) | a ordem mudou («Black» foi do 1º para o 3º lugar) e ficou depois do redesenho; Undo habilitou |
| 3 | Undo | a ordem voltou |

## Em produção, como visitante

Site `fd9a0a1` (pacote `main-bsMs4i-z.js`), publicado passando pela trava de lint: `/albums`, `/blend`, `/playlists`, `/saved-playlists`, `/inventory` e `/home` abrem sem erro de script.

## Não visto

- Salvar um lote, reabrir e salvar de novo; trocar de conta; arrastar com o mouse de verdade entre duas playlists.
- A automação do GitHub: nunca rodou (nada foi enviado ao remoto).
- A popularidade guardada sendo lida pelo serviço novo com o Spotify desconectado (visto antes, na F69, pelo caminho antigo; agora só nos testes).
