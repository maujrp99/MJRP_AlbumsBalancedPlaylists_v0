++### MJRP Albums Balanced Playlists — Resumo Executivo

Este documento sumariza o propósito, arquitetura, fluxo principal e pendências operacionais do projeto **MJRP Albums Balanced Playlists**.

**Objetivo**
- Gerar playlists balanceadas a partir de dados de "aclamação" por faixa, combinando evidência determinística (BestEverAlbums) com enriquecimento por modelo de IA (Gemini / Google Generative Language).
- Servir uma UI estática (Firebase Hosting) que persiste curadorias no Firestore e protege chaves de IA por meio de um proxy server.

**Visão Geral do Fluxo**
- Frontend (`public/`) chama o proxy em `POST /api/generate` para obter metadados normalizados do álbum + ranking de faixas.
- Proxy (`server/index.js`) tenta primeiro obter evidência do scraper `BestEverAlbums` (`server/lib/scrapers/besteveralbums.js`).
- Se o scraper for parcial, o proxy solicita ao modelo para enriquecer e mescla resultados (scraper vence conflitos).
- Normalização, validação e sanitização são feitas por `server/lib/normalize.js`, `server/lib/schema.js` (AJV opcional) e `server/lib/validateSource.js`.
- Consolidação de rankings usa Borda (ver `server/lib/ranking.js`).
- O algoritmo de curadoria (cliente) (`public/js/curation.js`) gera playlists P1/P2/DeepCuts, respeita regras de P1/P2 e preenche até a duração alvo.

This file was moved to `docs/PROJECT_SUMMARY.md`.

Please open `docs/PROJECT_SUMMARY.md` for the project executive summary and next steps.
- Tests: `server/test/*` e `test/*` com runners simples (node-based).
