# Tasks — Feature F98: A exportação para o Apple Music diz por que falhou · Plan: [[plan]]
**Approved**: not a gate (via rápida; o MJRP julga)

Via rápida (o MJRP, 2026-11-23: «2.sim»): conserto de um defeito com causa confirmada; o MJRP julga a tela; os documentos vêm depois, no passo retroativo.

## Pre-Implementation
- [x] as issues UAT-307 e UAT-308 registradas e a causa confirmada (`docs/specs/uat.md`; `reports/evidence/F97/proof.md`, seção «Apple Music»)
- [x] a feature registrada no próprio ramo do conserto (`fix/f98-apple-music-export-says-why-it-failed`), como primeiro commit: o registro viaja com o conserto, a pedido da sessão que orquestra

## Implementation
- [ ] TASK-01 a busca no catálogo com três respostas: `findTrackFromAlbum` e `findTrack` deixam a falha subir; `AppleMusicExportService` conta a faixa como achada, não encontrada ou não conferida; o relatório ganha as não conferidas; teste antes · implements:: REQ-01 · model:: sonnet
- [ ] TASK-02 a recusa do Apple Music com nome: erros próprios em `public/js/services/musickit/`, lançados na autorização, na pasta, na busca e na criação da playlist; a exportação para e devolve a falha com um tipo próprio; teste antes · implements:: REQ-02 · model:: sonnet
- [ ] TASK-03 quando nada pôde ser conferido, a falha diz isso; teste antes · implements:: REQ-03 · model:: sonnet
- [ ] TASK-04 o relatório do Apple Music na janela de exportar (`public/js/ui/PlaylistExportWindow.tsx`), com «Tentar de novo», no lugar dos avisos; as peças do relatório compartilhadas com `public/js/ui/SpotifyExportWindow.tsx`; o resultado parcial sem título de sucesso nas duas janelas; teste antes · implements:: REQ-03, REQ-04 · model:: sonnet
- [ ] TASK-05 o evento `playlists_exported` com `reason` para o Apple Music (`public/js/models/exportOutcome.js`); teste antes · implements:: REQ-05 · model:: sonnet
- [ ] TASK-06 as frases nos dicionários: `SpotifyExportService`, `AppleMusicExportService` e `holdNotice` devolvem código e dados, e quem mostra traduz; os textos em `public/js/i18n/en/` e `public/js/i18n/pt/`; o teste de guarda; teste antes · implements:: REQ-06 · model:: sonnet
- [ ] TASK-07 os dois textos da recusa do Spotify: verdadeiro para qualquer 403, e «only a few places»; teste antes · implements:: REQ-07 · model:: sonnet
- [ ] TASK-08 `role="status"` na região do resultado e o foco no título do resultado, nas duas janelas; teste antes · implements:: REQ-08 · model:: sonnet

## Verification
- [ ] TASK-09 a prova no site construído (Chromium e WebKit, a 1280 e a 390, em inglês e em português), com o MusicKit e a API da Apple simulados: sucesso, todas as buscas falhando, um misto, a autorização recusada, nada no catálogo; a janela do Spotify de novo, pelo resultado parcial; evidência em `reports/evidence/F98/`; suíte, tipos, lint e orçamento de publicação verdes · implements:: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05, REQ-06, REQ-07, REQ-08 · model:: sonnet
- [ ] TASK-10 o MJRP julga a tela (na via rápida o juiz é ele) · implements:: REQ-02, REQ-03, REQ-04 · model:: sonnet · depende do MJRP: só ele julga a tela e os textos; o MJRP abre a prévia e diz se passa

## Documentation
- [ ] TASK-11 o passo retroativo, depois do OK dele e antes de fechar: `docs/specs/behavior.md`; a spec e o plano completos; a S-80 com `delivered_by` e `points_to`; a declaração de cada documento no `plan.md` · implements:: REQ-01 · model:: sonnet
- [ ] TASK-12 fechar chamando a `mjrp-ensuring-sdd` (a forma e o cruzamento dos artefatos) antes do `Done` · implements:: REQ-01 · model:: sonnet
