# Evidência — Feature F04: Entrar com a conta Google ou Apple e ter séries, playlists e coleção guardadas na nuvem

Entrega anterior ao harness: o contrato foi criado no commit 54fd54c (2026-10-28) e todos os commits abaixo são anteriores. Release: REL-02 (R2 · Dados na nuvem e inventário).
Não há evidência de execução desta entrega (captura de tela, relatório de teste, rodada de aceite) em `reports/evidence/`, pasta que não existia antes do conform, e ela não se reconstitui. A prova é o commit, em produção; o que existe de teste automatizado está abaixo. Os testes citados não foram executados nesta passagem (o repositório está sem `node_modules`).

## Onde a prova mora

| História | Commit | Data | Assunto do commit |
|---|---|---|---|
| S-37 · Entrar com a conta Google ou Apple, ou seguir como convidado | `18fbfc4` | 2025-12-11 | fix(auth-persistence): Resolve regressions and stabilize Sprint 6 features |
| S-38 · Ter as séries, as playlists e a coleção guardadas na nuvem, por conta | `b85f473` | 2025-12-03 | feat: implement persistence and series management UI |
| S-38 · Ter as séries, as playlists e a coleção guardadas na nuvem, por conta | `2f980d0` | 2025-12-09 | chore(release): Consolidate HTML entry points and configure production deployme… |

## Testes automatizados que cobrem

- REQ-01 (S-37): test/services/AuthService.test.js (Google, Apple, sair) e test/stores/UserStore.test.js
- REQ-02 (S-38): test/services/DataSyncService.test.js e test/services/auth/UserSyncService.test.js (migração do convidado para a conta)

Aceite: por histórico (regra do MJRP de 2026-10-18, gravada nas histórias com `accepted_in`); esta feature não abre rodada de UAT.
