# Tasks — Feature F90: Exportar uma playlist a partir da tela das séries de playlists · Plan: [[plan]]
**Approved**: pendente

## Pre-Implementation
- [x] o MJRP põe a F90 na «Priorizada» (ele pediu em 2026-11-21; a S-72, a F90 e a UAT-276 foram registradas antes de construir) · feito: a F90 está em `docs/specs/priority.md` (commit `71a9f6b`)
- [ ] protótipo: dispensado (reaproveita botões e folhas da tela guardada; o juízo do MJRP é no iPhone) — a confirmar

## Implementation
- [x] TASK-01 os três exports com entrada explícita e a posição no Apple Music, num módulo só · implements:: REQ-03, REQ-04, REQ-05, REQ-07 · model:: sonnet · rounds:: 1 · evidência: a reconferência do juiz independente passou o export sobre o commit `6ff1581` (`reports/audits/2026-11-21-mjrpalbumblender-v0-export-from-saved-playlists-visual-parity-recheck.md`); em produção desde 2026-11-22 00:11 (`docs/log.md`)
- [x] TASK-02 a janela de export compartilhada (Apple Music, Spotify, JSON) e a tela de edição passando a usá-la · implements:: REQ-03, REQ-07 · model:: sonnet · rounds:: 1 · evidência: a mesma reconferência; hoje a janela é `public/js/ui/PlaylistExportWindow.tsx` (portada para React, `docs/log.md` de 2026-11-22 00:51)
- [x] TASK-03 o «Export» de cada playlist na tela guardada (computador e celular) · implements:: REQ-01, REQ-06 · model:: sonnet · rounds:: 1 · evidência: a mesma reconferência e as capturas `reports/evidence/F90/export-from-saved-playlists/desktop-row-action.png`
- [x] TASK-04 o «Export» do lote ao lado de «Edit» (computador e folha do celular) · implements:: REQ-02, REQ-06 · model:: sonnet · rounds:: 1 · evidência: a mesma reconferência e as capturas `reports/evidence/F90/export-from-saved-playlists/desktop-batch-action.png`
- [x] TASK-06 o passo da pasta do Apple Music (lista, nome novo, sem pasta, estados, escolha lembrada) · implements:: REQ-08 · model:: sonnet · rounds:: 1 · evidência: a mesma reconferência e `desktop-folder-step.png`; hoje o passo é `public/js/ui/AppleFolderStep.tsx`

## Verification
- [x] TASK-05 a prova no navegador (WebKit iPhone 14 e Chromium a 1280; capturas; sem erro no console) · implements:: REQ-01, REQ-02, REQ-06, REQ-08 · model:: sonnet · rounds:: 1 · evidência: `reports/evidence/F90/export-from-saved-playlists/` (`docs/log.md` de 2026-11-21 23:50)

## Documentation
- [x] `docs/specs/behavior.md` (a tela guardada e o export), `docs/specs/info-arch.md` se os estados pedirem · feito: `docs/specs/behavior.md`, os três itens «Exportar a partir da tela guardada», «Pasta do Apple Music» e «Exportar na tela de edição, no celular»

## Migration line
- [x] TASK-08 repetir esta feature na tela em React da linha de migração (`integrate/staging-2026-11-21`, `public/js/screens/saved-playlists/`) — em aberto, não é desta linha · implements:: REQ-01, REQ-02, REQ-03 · model:: sonnet · rounds:: 1 · evidência: `docs/log.md` de 2026-11-22 00:51 (a F90 portada para as telas em React); a linha React é a `main` desde 2026-11-23 (`public/js/ui/PlaylistExportWindow.tsx`, `AppleFolderStep.tsx`)
