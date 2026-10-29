<!-- docs/specs/features/F07-album-inventory/tasks.md — o QUANDO, reconstituído: cada task é uma entrega que um commit `delivered_by` já fez; só está marcada onde esse commit existe. Sem `rounds::`: o número de voltas Execute ⇄ Verify nunca foi medido e não se inventa. -->
# Tasks — Feature F07: Manter a coleção de álbuns: ver o que tenho, registrar, marcar a situação e buscar · Plan: [[plan]]
**Approved**: not a gate

## Pre-Implementation
- [x] ramo da feature: não houve; a entrega foi feita antes do harness, direto na linha principal, pelos commits `delivered_by` das histórias
- [x] spec e plan conferidos entre si: cada REQ tem fluxo e commit no plan e uma task abaixo; escritos no conform de 2026-10-28

## Implementation
- [x] TASK-01 Tela da coleção com totais, moeda do total e grade ou lista (InventoryView e InventoryStore) — commit `bf561e0` (2025-11-28) · implements:: REQ-01 · model:: opus
- [x] TASK-02 Ajustes da coleção: laço corrigido, cabeçalho simplificado e menu de situação «tenho» — commit `165c055` (2025-12-09) · implements:: REQ-01 · model:: sonnet
- [x] TASK-03 Registrar na coleção o álbum visto numa série (janela de registro e botão do cartão do álbum; depois, recusar o álbum já registrado), guardado por pessoa na nuvem — commits `2093d63` (2025-11-29) e `cd7dff4` (2025-12-11) · implements:: REQ-02 · model:: sonnet
- [x] TASK-04 Janela de detalhes do álbum, troca da situação tenho/quero ter, edição do item e busca e filtros da coleção — commit `730a9d2` (2025-12-08) · implements:: REQ-03, REQ-04 · model:: opus

## Verification
- [x] TASK-05 Prova da entrega: em produção desde 2025-11-28 pelos commits `bf561e0`, `2093d63`, `730a9d2`, `165c055`, `cd7dff4`; os testes existentes que cobrem cada REQ estão no `verified_by` da spec e a evidência fica em `reports/evidence/F07/evidence.md` · implements:: REQ-01, REQ-02, REQ-03, REQ-04 · model:: sonnet

## Documentation
- [x] spec, plan e tasks reconstituídos do que foi entregue · feature Done sem aceite próprio (regra do MJRP de 2026-10-18); esta pasta e a de evidência entram no commit do conform
