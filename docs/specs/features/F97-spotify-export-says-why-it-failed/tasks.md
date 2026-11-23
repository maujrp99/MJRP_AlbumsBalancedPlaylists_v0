# Tasks — Feature F97: A exportação para o Spotify diz por que falhou · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

Via rápida (o MJRP, 2026-11-23: «conserta pls»): conserto de um defeito com causa confirmada; o MJRP julga a tela; os documentos vêm depois, no passo retroativo.

## Pre-Implementation
- [x] a issue UAT-302 registrada e a causa confirmada (`docs/specs/uat.md`; `docs/log.md` de 2026-11-23 18:06)
- [ ] a feature registrada na `main`; só então o ramo (`fix/f97-spotify-export-says-why-it-failed`)

## Implementation
- [ ] TASK-01 a recusa do Spotify com nome: uma classe de erro para o 403 em `public/js/services/spotify/spotifyErrors.js`, lançada por `SpotifyService._fetch`; `SpotifyExportService` para a exportação e devolve a falha com um tipo próprio; a janela (`public/js/ui/SpotifyExportWindow.tsx`) mostra «o Spotify não permitiu esta conta» com o próximo passo; teste antes · implements:: REQ-01 · model:: sonnet
- [ ] TASK-02 a busca que falha não é faixa não encontrada: `_uriOf` distingue «o Spotify não tem» de «não foi possível conferir»; o relatório conta as não conferidas, e a janela as mostra separadas das não encontradas; teste antes · implements:: REQ-02 · model:: sonnet
- [ ] TASK-03 quando nada pôde ser conferido, a falha diz isso e a janela oferece «Tentar de novo»; teste antes · implements:: REQ-03 · model:: sonnet
- [ ] TASK-04 os textos novos em inglês e português nos dicionários (`public/js/i18n/en/exportWindow.js`, `public/js/i18n/pt/exportWindow.js`), com «The Album Blender» inteiro; teste antes · implements:: REQ-04 · model:: sonnet
- [ ] TASK-05 o evento `playlists_exported` com o desfecho próprio (`public/js/models/exportOutcome.js`); teste antes · implements:: REQ-05 · model:: sonnet

## Verification
- [ ] TASK-06 a prova no site construído (Chromium e WebKit, a 1280 e a 390), com a API do Spotify simulada respondendo 403, depois 500, depois listas vazias de verdade; evidência em `reports/evidence/F97/`; suíte, tipos, lint e orçamento de publicação verdes · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05 · model:: sonnet
- [ ] TASK-07 conferir o caminho do Apple Music pelo mesmo padrão de falha engolida e relatar (sem consertar aqui) · implements:: REQ-02 · model:: sonnet
- [ ] TASK-08 o MJRP julga a tela (na via rápida o juiz é ele) · implements:: REQ-01, REQ-02, REQ-03 · model:: sonnet · depende do MJRP: só ele julga a tela e os textos; o MJRP abre a prévia e diz se passa

## Documentation
- [ ] TASK-09 o passo retroativo, depois do OK dele e antes de fechar: `docs/specs/behavior.md`; a spec e o plano completos; a S-79 com `delivered_by` e `points_to`; a declaração de cada documento no `plan.md` · implements:: REQ-01 · model:: sonnet
- [ ] TASK-10 fechar chamando a `mjrp-ensuring-sdd` (a forma e o cruzamento dos artefatos) antes do `Done` · implements:: REQ-01 · model:: sonnet
