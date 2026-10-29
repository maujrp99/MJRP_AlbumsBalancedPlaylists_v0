# Evidência — Feature F05: Editar uma série (nome e álbuns) e excluí-la sem apagar os álbuns do inventário

Entrega anterior ao harness: o contrato foi criado no commit 54fd54c (2026-10-28) e todos os commits abaixo são anteriores. Release: REL-02 (R2 · Dados na nuvem e inventário).
Não há evidência de execução desta entrega (captura de tela, relatório de teste, rodada de aceite) em `reports/evidence/`, pasta que não existia antes do conform, e ela não se reconstitui. A prova é o commit, em produção; o que existe de teste automatizado está abaixo. Os testes citados existem no repositório, e cada linha abaixo diz o que o teste exercita (e, quando é o caso, o que ele não cobre); não foram executados nesta passagem (falta `npm ci`: o repositório está sem `node_modules`), então nenhum deles está provado como verde.

## Onde a prova mora

| História | Commit | Data | Assunto do commit |
|---|---|---|---|
| S-06 · Editar uma série: trocar o nome, tirar álbuns e acrescentar outros | `19d38c1` | 2025-12-07 | feat(album-series): enhanced Edit modal with album list management |
| S-06 · Editar uma série: trocar o nome, tirar álbuns e acrescentar outros | `b3b9f32` | 2025-12-31 | feat(Sprint15-Phase6): Lazy authorize + browser locale storefront + Edit modal… |
| S-07 · Excluir uma série sem apagar os álbuns do inventário | `b85f473` | 2025-12-03 | feat: implement persistence and series management UI |

## Testes automatizados que existem

- REQ-01 (S-06): nenhum teste automatizado próprio encontrado em `test/` nem em `tests/`
- REQ-02 (S-07): nenhum teste automatizado próprio encontrado em `test/` nem em `tests/`

Aceite: por histórico (regra do MJRP de 2026-10-18, gravada nas histórias com `accepted_in`); esta feature não abre rodada de UAT.
