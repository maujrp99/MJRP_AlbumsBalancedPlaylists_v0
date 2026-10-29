# Evidência — Feature F18: Usar o app no celular: menu em gaveta, faixas empilhadas e ordenação pelo toque

Entrega anterior ao harness: o contrato foi criado no commit 54fd54c (2026-10-28) e todos os commits abaixo são anteriores. Release: REL-05 (R5 · Ranking pessoal, receitas e celular).
Não há evidência de execução desta entrega (captura de tela, relatório de teste, rodada de aceite) em `reports/evidence/`, pasta que não existia antes do conform, e ela não se reconstitui. A prova é o commit, em produção; o que existe de teste automatizado está abaixo. Os testes citados existem no repositório, e cada linha abaixo diz o que o teste exercita (e, quando é o caso, o que ele não cobre); não foram executados nesta passagem (falta `npm ci`: o repositório está sem `node_modules`), então nenhum deles está provado como verde.

## Onde a prova mora

| História | Commit | Data | Assunto do commit |
|---|---|---|---|
| S-30 · Navegar pelo app no celular com o menu em gaveta | `9ebed2b` | 2025-12-06 | feat(phase1): TopNav 5 items + nomenclature refactor |
| S-30 · Navegar pelo app no celular com o menu em gaveta | `11747c3` | 2025-12-09 | chore(release): Prepare v1.0.0 with UI standardization, mobile menu fixes, an… |
| S-31 · Ler as faixas de um álbum no celular, em linhas empilhadas e abas por fonte | `b9530f1` | 2025-12-19 | feat(ranking): add Multi-Source Ranking UI components (Sprint 11 Phase 3) |
| S-31 · Ler as faixas de um álbum no celular, em linhas empilhadas e abas por fonte | `29b3f5e` | 2026-01-14 | fix(series): resolved sorting issues and refined labels |
| S-32 · Ordenar as faixas de um álbum pelo toque, em tela cheia | `29b3f5e` | 2026-01-14 | fix(series): resolved sorting issues and refined labels |

## Testes automatizados que existem

- REQ-01 (S-30): nenhum teste automatizado próprio encontrado em `test/` nem em `tests/`
- REQ-02 (S-31): nenhum teste automatizado próprio encontrado em `test/` nem em `tests/`
- REQ-03 (S-32): nenhum teste automatizado próprio encontrado em `test/` nem em `tests/`

Aceite: por histórico (regra do MJRP de 2026-10-18, gravada nas histórias com `accepted_in`); esta feature não abre rodada de UAT.
