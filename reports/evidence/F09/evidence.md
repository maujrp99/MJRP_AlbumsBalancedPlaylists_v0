# Evidência — Feature F09: Editar um lote de playlists guardado e excluir lotes ou todas as playlists de uma série

Entrega anterior ao harness: o contrato foi criado no commit 54fd54c (2026-10-28) e todos os commits abaixo são anteriores. Release: REL-03 (R3 · Spotify, Apple Music e mais formas de montar a playlist).
Não há evidência de execução desta entrega (captura de tela, relatório de teste, rodada de aceite) em `reports/evidence/`, pasta que não existia antes do conform, e ela não se reconstitui. A prova é o commit, em produção; o que existe de teste automatizado está abaixo. Os testes citados existem no repositório, e cada linha abaixo diz o que o teste exercita (e, quando é o caso, o que ele não cobre); não foram executados nesta passagem (falta `npm ci`: o repositório está sem `node_modules`), então nenhum deles está provado como verde.

## Onde a prova mora

| História | Commit | Data | Assunto do commit |
|---|---|---|---|
| S-19 · Editar um lote de playlists já guardado | `f1b3d46` | 2025-12-18 | feat(playlists): add EditPlaylistView to fix #54 and #55 - Created EditPlaylist… |
| S-20 · Excluir um lote de playlists, ou todas as playlists de uma série | `e057cfe` | 2025-12-16 | fix: Delete All Playlists now keeps series - only deletes playlists |

## Testes automatizados que existem

- REQ-01 (S-19): nenhum teste automatizado próprio encontrado em `test/` nem em `tests/`
- REQ-02 (S-20): nenhum teste automatizado próprio encontrado em `test/` nem em `tests/`

Aceite: por histórico (regra do MJRP de 2026-10-18, gravada nas histórias com `accepted_in`); esta feature não abre rodada de UAT.
