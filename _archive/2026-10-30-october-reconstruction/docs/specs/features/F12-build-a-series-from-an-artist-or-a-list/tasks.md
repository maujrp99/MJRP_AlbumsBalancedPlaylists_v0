<!-- docs/specs/features/F12-build-a-series-from-an-artist-or-a-list/tasks.md — o QUANDO, reconstituído: cada task é uma entrega que um commit `delivered_by` já fez; só está marcada onde esse commit existe. Sem `rounds::`: o número de voltas Execute ⇄ Verify nunca foi medido e não se inventa. -->
# Tasks — Feature F12: Montar uma série procurando um artista ou colando uma lista de álbuns · Plan: [[plan]]
**Approved**: not a gate

## Pre-Implementation
- [x] ramo da feature: não houve; a entrega foi feita antes do harness, direto na linha principal, pelos commits `delivered_by` das histórias
- [x] spec e plan conferidos entre si: cada REQ tem fluxo e commit no plan e uma task abaixo; escritos no conform de 2026-10-28

## Implementation
- [x] TASK-01 Colar uma lista de «Artista - Álbum» e a área de montagem refinada (HomeView V3, fase 1) — commit `cd4dc21` (2025-12-27) · implements:: REQ-02 · model:: opus
- [x] TASK-02 Busca de artista com discografia, filtros por tipo e classificação dos álbuns, e a carga inicial completa da tela inicial — commit `4c62a82` (2025-12-28) · implements:: REQ-01 · model:: opus

## Verification
- [x] TASK-03 Prova da entrega: em produção desde 2025-12-27 pelos commits `cd4dc21`, `4c62a82`; os testes existentes que cobrem cada REQ estão no `verified_by` da spec e a evidência fica em `reports/evidence/F12/evidence.md` · implements:: REQ-01, REQ-02 · model:: sonnet

## Documentation
- [x] spec, plan e tasks reconstituídos do que foi entregue · feature Done sem aceite próprio (regra do MJRP de 2026-10-18); esta pasta e a de evidência entram no commit do conform
