# F65 — tirar o que nada usa: prova (2026-11-19 21:47)

Código: ramo `fix/f65-remove-what-nothing-uses` sobre a `main` de hoje (`9c6f248`). Testes: 1945 passando em 162 arquivos; build ok, sem aviso de importação não resolvida.

## O que saiu

208 arquivos mexidos, 143 removidos, 53.309 linhas a menos (26.586 são dois arquivos de dados gerados por scripts sem uso; 9.267 são arquivos de trava de dependências).

| Grupo | Arquivos removidos ou mexidos | Linhas a menos |
|---|---|---|
| `public/js`: módulos que nada alcança e as três telas aposentadas | 49 | 5.868 |
| Servidor e `shared/`: a rota `POST /api/playlists`, `shared/curation.js`, scripts e testes que não rodam | 33 | 2.077 |
| `scripts/` e sobras da raiz (incluídos os dois scripts com o token do Discogs) | 21 | 29.386 |
| Páginas de `public/` fora da build | 12 | 3.298 |
| Testes de coisas mortas ou que nenhum comando roda | 48 | 3.136 |

## No navegador, com a conta do MJRP

Dezessete endereços abertos em sequência, com o console vigiado:

| Endereço | Resultado |
|---|---|
| `/home`, `/albums`, `/albums?seriesId=…`, `/blend`, `/playlists`, `/saved-playlists`, `/playlist-series`, `/inventory` | abrem com o conteúdo de sempre |
| `/artists`, `/genres`, `/tracks` | «Coming Soon» |
| `/album-series`, `/series` | vão para `/albums` |
| `/ranking/x`, `/consolidated-ranking`, `/save-all` (aposentadas) e `/nowhere` | vão para `/home` |

Nenhum erro de script, nenhuma promessa rejeitada, nenhum arquivo 404.

## O que fica guardando

- `test/architecture/noDeadModules.test.js`: todo módulo de `public/js`, `shared` e `server` precisa ser alcançável de um ponto de entrada. Na `main` de antes havia 49 módulos mortos; agora, zero.
- `test/security/noSecretsInRepo.test.js`: vermelho antes (os dois scripts com o token), verde depois; nunca mostra o valor.

## Não visto

- Cada botão de cada tela: a prova abriu as telas, não percorreu todas as ações.
- As exportações e a volta do Spotify (`/callback`).
- Largura de celular.

## Fica com o MJRP

- Trocar o token do Discogs (ele continua no histórico do git).
- Apertar as regras do banco para coleções que nenhum código usa mais (`/albums` compartilhada; o desenho antigo `users/…/series/…`): a lista está no `plan.md` da F65.
- Cerca de 44 MB em `public/assets` que o app não carrega e que sobem em toda publicação: não removidos.
- As 105 classes de estilo usadas e sem definição (lista no `plan.md`, seção 7): nada foi reestilizado.
