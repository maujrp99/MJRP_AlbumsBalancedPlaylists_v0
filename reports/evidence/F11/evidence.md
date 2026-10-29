# Evidência — Feature F11: Conectar o Spotify, comparar a nota da crítica com a popularidade e enviar as playlists

Entrega anterior ao harness: o contrato foi criado no commit 54fd54c (2026-10-28) e todos os commits abaixo são anteriores. Release: REL-03 (R3 · Spotify, Apple Music e mais formas de montar a playlist).
Não há evidência de execução desta entrega (captura de tela, relatório de teste, rodada de aceite) em `reports/evidence/`, pasta que não existia antes do conform, e ela não se reconstitui. A prova é o commit, em produção; o que existe de teste automatizado está abaixo. Os testes citados existem no repositório, e cada linha abaixo diz o que o teste exercita (e, quando é o caso, o que ele não cobre); não foram executados nesta passagem (falta `npm ci`: o repositório está sem `node_modules`), então nenhum deles está provado como verde.

## Onde a prova mora

| História | Commit | Data | Assunto do commit |
|---|---|---|---|
| S-23 · Conectar a minha conta do Spotify | `4ac955d` | 2025-12-19 | feat(spotify): add Spotify OAuth and Service integration (Sprint 11 Phase 1-2) |
| S-24 · Enviar as playlists para o Spotify, juntas ou separadas | `6013d87` | 2025-12-19 | Sprint 11: Spotify auto-enrichment + fuzzy matching + view toggle fix |
| S-24 · Enviar as playlists para o Spotify, juntas ou separadas | `2336104` | 2025-12-20 | Fix(UI/Playlist): Fix Playlist Generation ignoring Spotify Popularity & Fix Loa… |
| S-26 · Comparar a nota da crítica com a popularidade no Spotify | `b9530f1` | 2025-12-19 | feat(ranking): add Multi-Source Ranking UI components (Sprint 11 Phase 3) |

## Testes automatizados que existem

- REQ-01 (S-23): nenhum teste automatizado próprio encontrado em `test/` nem em `tests/`
- REQ-02 (S-24): nenhum teste automatizado próprio encontrado em `test/` nem em `tests/`
- REQ-03 (S-26): nenhum teste automatizado próprio encontrado em `test/` nem em `tests/`

Aceite: por histórico (regra do MJRP de 2026-10-18, gravada nas histórias com `accepted_in`); esta feature não abre rodada de UAT.
