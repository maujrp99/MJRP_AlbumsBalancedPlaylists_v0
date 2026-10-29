# Evidência — Feature F06: Guardar as playlists geradas num lote na nuvem e consultá-las depois, por série e por lote

Entrega anterior ao harness: o contrato foi criado no commit 54fd54c (2026-10-28) e todos os commits abaixo são anteriores. Release: REL-02 (R2 · Dados na nuvem e inventário).
Não há evidência de execução desta entrega (captura de tela, relatório de teste, rodada de aceite) em `reports/evidence/`, pasta que não existia antes do conform, e ela não se reconstitui. A prova é o commit, em produção; o que existe de teste automatizado está abaixo. Os testes citados existem no repositório, e cada linha abaixo diz o que o teste exercita (e, quando é o caso, o que ele não cobre); não foram executados nesta passagem (falta `npm ci`: o repositório está sem `node_modules`), então nenhum deles está provado como verde.

## Onde a prova mora

| História | Commit | Data | Assunto do commit |
|---|---|---|---|
| S-16 · Guardar as playlists geradas num lote, na nuvem | `b6034b6` | 2025-12-07 | fix(persistence): resolve permissions error and router bugs |
| S-18 · Consultar as playlists guardadas, por série e por lote | `3919f18` | 2025-12-06 | WIP: Ghost Albums debugging (4 failed attempts) + SavedPlaylistsView + UI fixes |

## Testes automatizados que existem

- REQ-01 (S-16): nenhum teste automatizado próprio encontrado em `test/` nem em `tests/`
- REQ-02 (S-18): nenhum teste automatizado próprio encontrado em `test/` nem em `tests/`

Aceite: por histórico (regra do MJRP de 2026-10-18, gravada nas histórias com `accepted_in`); esta feature não abre rodada de UAT.
