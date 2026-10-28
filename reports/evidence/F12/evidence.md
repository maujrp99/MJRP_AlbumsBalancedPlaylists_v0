# Evidência — Feature F12: Montar uma série procurando um artista ou colando uma lista de álbuns

Entrega anterior ao harness: o contrato foi criado no commit 54fd54c (2026-10-28) e todos os commits abaixo são anteriores. Release: REL-04 (R4 · Nova aparência e nomes claros).
Não há evidência de execução desta entrega (captura de tela, relatório de teste, rodada de aceite) em `reports/evidence/`, pasta que não existia antes do conform, e ela não se reconstitui. A prova é o commit, em produção; o que existe de teste automatizado está abaixo. Os testes citados não foram executados nesta passagem (o repositório está sem `node_modules`).

## Onde a prova mora

| História | Commit | Data | Assunto do commit |
|---|---|---|---|
| S-02 · Procurar os álbuns de um artista e escolher quais entram na série | `4c62a82` | 2025-12-28 | feat(HomeView V3): Major UX fixes and full Initialize Load implementation |
| S-03 · Colar uma lista de «Artista - Álbum» para montar a série | `cd4dc21` | 2025-12-27 | feat(arch-11): Refine HomeView V3 and Plan Phase 2 |

## Testes automatizados que cobrem

- REQ-01 (S-02): nenhum teste automatizado próprio encontrado em `test/` nem em `tests/`
- REQ-02 (S-03): nenhum teste automatizado próprio encontrado em `test/` nem em `tests/`

Aceite: por histórico (regra do MJRP de 2026-10-18, gravada nas histórias com `accepted_in`); esta feature não abre rodada de UAT.
