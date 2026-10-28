# Evidência — Feature F08: Escolher entre mais de uma receita para montar a playlist

Entrega anterior ao harness: o contrato foi criado no commit 54fd54c (2026-10-28) e todos os commits abaixo são anteriores. Release: REL-03 (R3 · Spotify, Apple Music e mais formas de montar a playlist).
Não há evidência de execução desta entrega (captura de tela, relatório de teste, rodada de aceite) em `reports/evidence/`, pasta que não existia antes do conform, e ela não se reconstitui. A prova é o commit, em produção; o que existe de teste automatizado está abaixo. Os testes citados não foram executados nesta passagem (o repositório está sem `node_modules`).

## Onde a prova mora

| História | Commit | Data | Assunto do commit |
|---|---|---|---|
| S-10 · Escolher entre mais de uma receita para montar a playlist | `e038315` | 2025-12-16 | feat(sprint8): Implement Algorithm Strategy Pattern with MJRP Balanced Cascade |

## Testes automatizados que cobrem

- REQ-01 (S-10): test/algorithms/topn.test.js (registro com as quatro receitas; Top N por popularidade e por crítica)

Aceite: por histórico (regra do MJRP de 2026-10-18, gravada nas histórias com `accepted_in`); esta feature não abre rodada de UAT.
