# Evidência — Feature F13: Montar a mistura em passos, ajustar a receita, dar nome ao lote e gerar de novo sem sair da tela

Entrega anterior ao harness: o contrato foi criado no commit 54fd54c (2026-10-28) e todos os commits abaixo são anteriores. Release: REL-04 (R4 · Nova aparência e nomes claros).
Não há evidência de execução desta entrega (captura de tela, relatório de teste, rodada de aceite) em `reports/evidence/`, pasta que não existia antes do conform, e ela não se reconstitui. A prova é o commit, em produção; o que existe de teste automatizado está abaixo. Os testes citados não foram executados nesta passagem (o repositório está sem `node_modules`).

## Onde a prova mora

| História | Commit | Data | Assunto do commit |
|---|---|---|---|
| S-11 · Montar a mistura em passos: série, receita e ingredientes | `e8ebe0b` | 2025-12-23 | docs: Add comprehensive project summary, roadmap, product vision, and temporary… |
| S-11 · Montar a mistura em passos: série, receita e ingredientes | `9d53fdf` | 2025-12-31 | feat(v3.16): Sprint 15.5 Prod Polish - Blending Menu UI & AlbumSeries Store Fix |
| S-12 · Ajustar a receita: faixas por álbum, agrupamento, estrutura e duração | `ab4bbb6` | 2026-01-02 | fix(sprint15.5): Apple Music Export, Index Duplication, Batch Name Input, Group… |
| S-12 · Ajustar a receita: faixas por álbum, agrupamento, estrutura e duração | `a86877a` | 2026-01-02 | v3.15.5: Sprint 15.5 Prod Polish - Algorithm Renaming, UI Fixes, Grouping Logic |
| S-13 · Gerar de novo com outra receita sem sair da tela de playlists | `333e72b` | 2025-12-23 | feat: create playlist UI components (Phase 2) |
| S-17 · Dar nome a um lote de playlists | `d3ed5e1` | 2026-01-02 | feat: Batch Naming integration (Sprint 15.5) |

## Testes automatizados que cobrem

- REQ-01 (S-11): test/e2e/blending-wizard.test.js (assistente de ponta a ponta)
- REQ-02 (S-12): test/components/blend/BlendIngredientsPanel.test.js (controles por receita e normalização da escolha) e test/algorithms/topn.test.js
- REQ-03 (S-13): nenhum teste automatizado próprio encontrado em `test/` nem em `tests/`
- REQ-04 (S-17): nenhum teste automatizado próprio encontrado em `test/` nem em `tests/`

Aceite: por histórico (regra do MJRP de 2026-10-18, gravada nas histórias com `accepted_in`); esta feature não abre rodada de UAT.
