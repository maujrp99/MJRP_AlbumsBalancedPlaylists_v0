# Tasks — Feature F97: A exportação para o Spotify diz por que falhou · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

Via rápida (o MJRP, 2026-11-23: «conserta pls»): conserto de um defeito com causa confirmada; o MJRP julga a tela; os documentos vêm depois, no passo retroativo.

## Pre-Implementation
- [x] a issue UAT-302 registrada e a causa confirmada (`docs/specs/uat.md`; `docs/log.md` de 2026-11-23 18:06)
- [x] a feature registrada na `main` (merge `65a2005`); só então o ramo (`fix/f97-spotify-export-says-why-it-failed`)

## Implementation
- [x] TASK-01 a recusa do Spotify com nome: uma classe de erro para o 403 em `public/js/services/spotify/spotifyErrors.js`, lançada por `SpotifyService._fetch`; `SpotifyExportService` para a exportação e devolve a falha com um tipo próprio; a janela (`public/js/ui/SpotifyExportWindow.tsx`) mostra «o Spotify não permitiu esta conta» com o próximo passo; teste antes · evidência: `SpotifyRefusedError` (`public/js/services/spotify/spotifyErrors.js`), `errorOf` em `SpotifyService.js`, falha `refused` em `SpotifyExportService.js`, o quadro sem «Tentar de novo» na janela; `test/services/spotify/SpotifyExport.test.js`, `test/ui/SpotifyExportWindow.test.js` · implements:: REQ-01 · model:: sonnet · rounds:: 1
- [x] TASK-02 a busca que falha não é faixa não encontrada: `_uriOf` distingue «o Spotify não tem» de «não foi possível conferir»; o relatório conta as não conferidas, e a janela as mostra separadas das não encontradas; teste antes · evidência: `_uriOf` e `_count` em `SpotifyExportService.js` (`report.unchecked`, `onUnchecked`); uma playlist sem nenhuma faixa conferida vai para «não criadas», nunca para «nenhuma faixa encontrada»; `TrackNames` na janela; os mesmos dois arquivos de teste · implements:: REQ-02 · model:: sonnet · rounds:: 1
- [x] TASK-03 quando nada pôde ser conferido, a falha diz isso e a janela oferece «Tentar de novo»; teste antes · evidência: falha `unchecked` em `_deliverAll`; a janela diz «não foi possível conferir» e mostra «Tentar de novo»; os mesmos dois arquivos de teste · implements:: REQ-03 · model:: sonnet · rounds:: 1
- [x] TASK-04 os textos novos em inglês e português nos dicionários (`public/js/i18n/en/exportWindow.js`, `public/js/i18n/pt/exportWindow.js`), com «The Album Blender» inteiro; teste antes · evidência: seis chaves `spotifyWindow.refused*` e `spotifyWindow.unchecked*` nos dois dicionários; `test/i18n/exportWindowTexts.test.js`; o texto da recusa não promete inclusão (a lista do Spotify tem poucas vagas) · implements:: REQ-04 · model:: sonnet · rounds:: 1
- [x] TASK-05 o evento `playlists_exported` com o desfecho próprio (`public/js/models/exportOutcome.js`); teste antes · evidência: `exportReason` em `public/js/models/exportOutcome.js` e a propriedade `reason` (`refused`, `unchecked`) do evento em `shared/usageEvents.js`; `test/services/usage/eventsOfPlaylists.test.js` · implements:: REQ-05 · model:: sonnet · rounds:: 1

## Verification
- [x] TASK-06 a prova no site construído (Chromium e WebKit, a 1280 e a 390), com a API do Spotify simulada respondendo 403, depois 500, depois listas vazias de verdade; evidência em `reports/evidence/F97/`; suíte, tipos, lint e orçamento de publicação verdes · evidência: `reports/evidence/F97/proof.md` (132 de 132 no navegador; suíte 5589; tipos, lint e orçamento com saída 0; os tetos do orçamento medidos de novo pela regra, +301 B no script principal) · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05 · model:: sonnet · rounds:: 1
- [x] TASK-07 conferir o caminho do Apple Music pelo mesmo padrão de falha engolida e relatar (sem consertar aqui) · evidência: `reports/evidence/F97/proof.md`, seção «Apple Music»: o mesmo padrão existe (`MusicKitCatalog.findTrackFromAlbum` engole toda falha e devolve «não achei»); relatado, não consertado · implements:: REQ-02 · model:: sonnet · rounds:: 1
- [ ] TASK-08 o MJRP julga a tela (na via rápida o juiz é ele) · implements:: REQ-01, REQ-02, REQ-03 · model:: sonnet · depende do MJRP: só ele julga a tela e os textos; o MJRP abre a prévia e diz se passa

## Documentation
- [ ] TASK-09 o passo retroativo, depois do OK dele e antes de fechar: `docs/specs/behavior.md`; a spec e o plano completos; a S-79 com `delivered_by` e `points_to`; a declaração de cada documento no `plan.md` · implements:: REQ-01 · model:: sonnet
- [ ] TASK-10 fechar chamando a `mjrp-ensuring-sdd` (a forma e o cruzamento dos artefatos) antes do `Done` · implements:: REQ-01 · model:: sonnet
