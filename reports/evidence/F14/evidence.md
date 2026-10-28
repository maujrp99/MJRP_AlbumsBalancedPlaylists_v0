# Evidência — Feature F14: Abrir o app e começar a usar sem janela de login nem de autorização

Entrega anterior ao harness: o contrato foi criado no commit 54fd54c (2026-10-28) e todos os commits abaixo são anteriores. Release: REL-04 (R4 · Nova aparência e nomes claros).
Não há evidência de execução desta entrega (captura de tela, relatório de teste, rodada de aceite) em `reports/evidence/`, pasta que não existia antes do conform, e ela não se reconstitui. A prova é o commit, em produção; o que existe de teste automatizado está abaixo. Os testes citados não foram executados nesta passagem (o repositório está sem `node_modules`).

## Onde a prova mora

| História | Commit | Data | Assunto do commit |
|---|---|---|---|
| S-39 · Abrir o app sem ver janela de login nem de autorização | `b3b9f32` | 2025-12-31 | feat(Sprint15-Phase6): Lazy authorize + browser locale storefront + Edit modal… |

## Testes automatizados que cobrem

- REQ-01 (S-39): nenhum teste automatizado próprio encontrado em `test/` nem em `tests/`

Aceite: por histórico (regra do MJRP de 2026-10-18, gravada nas histórias com `accepted_in`); esta feature não abre rodada de UAT.
