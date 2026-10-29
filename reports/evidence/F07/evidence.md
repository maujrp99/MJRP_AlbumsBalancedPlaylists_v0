# Evidência — Feature F07: Manter a coleção de álbuns: ver o que tenho, registrar, marcar a situação e buscar

Entrega anterior ao harness: o contrato foi criado no commit 54fd54c (2026-10-28) e todos os commits abaixo são anteriores. Release: REL-02 (R2 · Dados na nuvem e inventário).
Não há evidência de execução desta entrega (captura de tela, relatório de teste, rodada de aceite) em `reports/evidence/`, pasta que não existia antes do conform, e ela não se reconstitui. A prova é o commit, em produção; o que existe de teste automatizado está abaixo. Os testes citados existem no repositório, e cada linha abaixo diz o que o teste exercita (e, quando é o caso, o que ele não cobre); não foram executados nesta passagem (falta `npm ci`: o repositório está sem `node_modules`), então nenhum deles está provado como verde.

## Onde a prova mora

| História | Commit | Data | Assunto do commit |
|---|---|---|---|
| S-33 · Ver a minha coleção de álbuns, quantos tenho e quanto vale | `bf561e0` | 2025-11-28 | Sprint 5.3 Partial: InventoryView + InventoryStore |
| S-33 · Ver a minha coleção de álbuns, quantos tenho e quanto vale | `165c055` | 2025-12-09 | fix(inventory): Loop fix, header UI simplification, owned dropdown |
| S-34 · Registrar na coleção um álbum que vi numa série | `2093d63` | 2025-11-29 | docs: Update documentation for Sprint 5.3 completion and bump version to v2.0… |
| S-34 · Registrar na coleção um álbum que vi numa série | `cd7dff4` | 2025-12-11 | Fix: Prevent duplicate albums in inventory with check in InventoryRepository |
| S-35 · Marcar se tenho o álbum ou se quero ter, e corrigir formato, preço e notas | `730a9d2` | 2025-12-08 | feat(inventory): add View Album Details modal, Owned status toggle, and ownersh… |
| S-36 · Buscar na coleção por título, artista ou notas e filtrar por formato e situação | `730a9d2` | 2025-12-08 | feat(inventory): add View Album Details modal, Owned status toggle, and ownersh… |

## Testes automatizados que existem

- REQ-01 (S-33): test/stores/inventory.test.js (carregar os álbuns do repositório)
- REQ-02 (S-34): test/stores/inventory.test.js (addAlbum: a loja adiciona o álbum e recarrega; não cobre o botão no cartão do álbum nem a tela)
- REQ-03 (S-35): test/stores/inventory.test.js (updatePrice: atualização otimista e volta atrás em caso de erro)
- REQ-04 (S-36): nenhum teste automatizado próprio encontrado em `test/` nem em `tests/`

Aceite: por histórico (regra do MJRP de 2026-10-18, gravada nas histórias com `accepted_in`); esta feature não abre rodada de UAT.
