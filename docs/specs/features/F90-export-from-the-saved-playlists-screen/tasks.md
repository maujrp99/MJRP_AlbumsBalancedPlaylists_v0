# Tasks — Feature F90: Exportar uma playlist a partir da tela das séries de playlists · Plan: [[plan]]
**Approved**: pendente

## Pre-Implementation
- [ ] o MJRP põe a F90 na «Priorizada» (ele pediu em 2026-11-21; a S-72, a F90 e a UAT-276 foram registradas antes de construir)
- [ ] protótipo: dispensado (reaproveita botões e folhas da tela guardada; o juízo do MJRP é no iPhone) — a confirmar

## Implementation
- [ ] TASK-01 os três exports com entrada explícita e a posição no Apple Music, num módulo só · implements:: REQ-03, REQ-04, REQ-05, REQ-07 · model:: sonnet
- [ ] TASK-02 a janela de export compartilhada (Apple Music, Spotify, JSON) e a tela de edição passando a usá-la · implements:: REQ-03, REQ-07 · model:: sonnet
- [ ] TASK-03 o «Export» de cada playlist na tela guardada (computador e celular) · implements:: REQ-01, REQ-06 · model:: sonnet
- [ ] TASK-04 o «Export» do lote ao lado de «Edit» (computador e folha do celular) · implements:: REQ-02, REQ-06 · model:: sonnet

## Verification
- [ ] TASK-05 a prova no navegador (WebKit iPhone 14 e Chromium a 1280; capturas; sem erro no console) · implements:: REQ-01, REQ-02, REQ-06 · model:: sonnet

## Documentation
- [ ] `docs/specs/behavior.md` (a tela guardada e o export), `docs/specs/info-arch.md` se os estados pedirem

## Migration line
- [ ] TASK-08 repetir esta feature na tela em React da linha de migração (`integrate/staging-2026-11-21`, `public/js/screens/saved-playlists/`) — em aberto, não é desta linha · implements:: REQ-01, REQ-02, REQ-03 · model:: sonnet
