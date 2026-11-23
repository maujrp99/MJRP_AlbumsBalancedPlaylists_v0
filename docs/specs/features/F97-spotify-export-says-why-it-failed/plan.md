# Plan — Feature F97: A exportação para o Spotify diz por que falhou · Spec: [[spec]]
**Approved**: not a gate (via rápida; o MJRP julga)

## Architecture Approach
Em esboço. Via rápida: este plano se completa no passo retroativo, com o que foi construído.

A recusa do Spotify ganha um nome próprio, do mesmo jeito que o login vencido e o limite de chamadas já têm (`SpotifyReconnectError` e `SpotifyRateLimitError`, em `public/js/services/spotify/spotifyErrors.js`): uma classe de erro que `SpotifyService._fetch` lança ao receber 403, que `SpotifyExportService` trata como falha que para a exportação, e que a janela (`public/js/ui/SpotifyExportWindow.tsx`) mostra com o seu próprio quadro. As outras falhas de busca deixam de virar «sem faixa»: a busca passa a ter três respostas (achou, o Spotify não tem, não foi possível conferir), e o relatório conta cada uma.

## Technical Design
A completar no passo retroativo. Já decidido:
- Uma classe de erro com nome para a recusa (403), ao lado das duas que existem; `_fetch` a lança; `failureOf` devolve um `kind` próprio; `stopsTheExport` a inclui.
- `_uriOf` distingue «o Spotify respondeu e não tem» de «a busca falhou»; o relatório (`ExportReport`) ganha a conta das faixas não conferidas.
- Com nenhuma faixa casada: se alguma busca falhou e nenhuma foi respondida, a falha é «nada pôde ser conferido» (com «Tentar de novo»), não «No tracks found on Spotify».
- `public/js/models/exportOutcome.js` devolve um desfecho próprio para a recusa e para «nada conferido»; o evento `playlists_exported` o leva.
- Os textos novos nos dicionários `public/js/i18n/en/exportWindow.js` e `public/js/i18n/pt/exportWindow.js`.
- Teste que falha antes, para cada requisito.

## Dependencies
F62 (a exportação que nunca termina em silêncio: o `ExportReport` e os tipos de falha); F77 (o evento `playlists_exported`); F81 (os dicionários em inglês e português); F83 (a janela de exportação em React).

## Documents Consulted
`docs/specs/uat.md` (UAT-302); `docs/log.md` de 2026-11-23 18:06; `public/js/services/SpotifyExportService.js` e `public/js/services/SpotifyService.js` (`main`, só leitura); `docs/specs/features/F96-entry-page-in-swipes-on-the-phone/` e `docs/specs/features/F74-track-ratings-reach-the-right-tracks/` (a forma); S-72.

A declarar no passo retroativo, um a um («atualizado» ou «sem mudança»): `arch.md`, `data-model.md`, `tech-stack.md`, `constitution.md`, `design-system.md`, `behavior.md`.

## Risks & Considerations
- Um 403 do Spotify nem sempre é a conta fora da lista: também vem de permissão que falta no login ou de limite de recurso. O texto diz o que é mais provável e dá um próximo passo que serve nos dois casos, sem afirmar o que o app não sabe.
- `SpotifyService._fetch` serve também ao carregamento de álbuns e ao enriquecimento: a classe nova não pode mudar o que esses caminhos fazem com um 403 (hoje, um `Error` comum); a classe nova continua sendo um `Error`.
- Uma falha de rede no meio de uma exportação longa não deve jogar fora as faixas já casadas: as não conferidas são contadas, e a playlist sai com o que foi achado.
- A prova no navegador nunca chama a API de verdade do Spotify: as respostas são simuladas.
