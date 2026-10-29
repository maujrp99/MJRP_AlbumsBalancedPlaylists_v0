# Evidência — Feature F16: Dar a minha própria ordem às faixas de um álbum e misturar por ela

Entrega anterior ao harness: o contrato foi criado no commit 54fd54c (2026-10-28) e todos os commits abaixo são anteriores. Release: REL-05 (R5 · Ranking pessoal, receitas e celular).
Não há evidência de execução desta entrega (captura de tela, relatório de teste, rodada de aceite) em `reports/evidence/`, pasta que não existia antes do conform, e ela não se reconstitui. A prova é o commit, em produção; o que existe de teste automatizado está abaixo. Os testes citados existem no repositório, e cada linha abaixo diz o que o teste exercita (e, quando é o caso, o que ele não cobre); não foram executados nesta passagem (falta `npm ci`: o repositório está sem `node_modules`), então nenhum deles está provado como verde.

## Onde a prova mora

| História | Commit | Data | Assunto do commit |
|---|---|---|---|
| S-27 · Dar a minha própria ordem às faixas e misturar por ela | `7aa9704` | 2026-01-11 | Sprint 20: Fix User Ranking UI Persistence & Sorting delegation (Grid/List) |

## Testes automatizados que existem

- REQ-01 (S-27): test/ranking/UserRankingStrategy.test.js (ordena pela posição do usuário; ordem original sem ranking)

Aceite: por histórico (regra do MJRP de 2026-10-18, gravada nas histórias com `accepted_in`); esta feature não abre rodada de UAT.
