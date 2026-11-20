# F76 TASK-04 · prova das Playlists no celular (2026-11-20)

Arnês: `reports/evidence/F76/harness/playlists/` desenha as telas **reais** (`PlaylistsView`, `SavedPlaylistsView`, a barra do celular) com dados de exemplo: 6 playlists de 10 a 30 faixas com títulos longos; 12 séries gravadas com 2 a 6 lotes e nomes longos.

```sh
npx vite --config reports/evidence/F76/harness/playlists/vite.config.mjs --port 5187 --strictPort --host 127.0.0.1
node reports/evidence/F76/playlists/shoot.mjs after 5187
```

`before/` = o mesmo arnês sobre o ramo `feat/f76-mobile-redesign` (a base, sem esta tela); `after/` = `feat/f76-mobile-playlists`. Cada pasta tem `measures.json` e as capturas `<caso>-<tamanho>.png` (e `-full.png`, a página inteira até 5.000 px). Casos só do celular em `after/`: `track-sheet`, `removed-undo`, `scrolled-notice`, `playlist-sheet`, `delete-confirm`, `export-sheet`, `spotify-window`.

Resultado (393x852): sem rolagem de lado, 0 texto < 12 px, 0 campo < 16 px, 0 alvo < 44 px nas telas, nenhuma caixa que rola por dentro; geradas 3.602 → 1.562 px, gravadas 10.756 → 1.793 px; a primeira faixa sobe de y=1.049 a y=496. A 1280x800, antes e depois idênticos pixel a pixel (2 px de antisserrilhado de 1/255 numa página inteira). O que vi nas capturas e o que não verifiquei: `docs/specs/features/F76-mobile-redesign/screens/playlists.md`.
