# Evidência — Feature F02: Gerar playlists equilibradas a partir de uma série e reorganizá-las arrastando as faixas

Entrega anterior ao harness: o contrato foi criado no commit 54fd54c (2026-10-28) e todos os commits abaixo são anteriores. Release: REL-01 (R1 · Primeiras telas e primeira playlist).
Não há evidência de execução desta entrega (captura de tela, relatório de teste, rodada de aceite) em `reports/evidence/`, pasta que não existia antes do conform, e ela não se reconstitui. A prova é o commit, em produção; o que existe de teste automatizado está abaixo. Os testes citados não foram executados nesta passagem (o repositório está sem `node_modules`).

## Onde a prova mora

| História | Commit | Data | Assunto do commit |
|---|---|---|---|
| S-09 · Gerar playlists equilibradas a partir de uma série | `c8be9fa` | 2025-11-27 | feat(sprint4): complete playlist management, fix series mixing and rank display |
| S-14 · Ver as playlists geradas, com as faixas e a duração de cada uma | `c8be9fa` | 2025-11-27 | feat(sprint4): complete playlist management, fix series mixing and rank display |
| S-15 · Reorganizar as playlists arrastando faixas e tirando as que não quero | `c8be9fa` | 2025-11-27 | feat(sprint4): complete playlist management, fix series mixing and rank display |

## Testes automatizados que cobrem

- REQ-01 (S-09): test/algorithms/mixins.test.js (balanceamento entre playlists e «Orphan Tracks») e test/algorithms/topn.test.js
- REQ-02 (S-14): test/views/PlaylistsView.test.js (formato mm:ss da duração)
- REQ-03 (S-15): test/services/PlaylistsService.test.js (moveTrack e retrato do estado)

Aceite: por histórico (regra do MJRP de 2026-10-18, gravada nas histórias com `accepted_in`); esta feature não abre rodada de UAT.
