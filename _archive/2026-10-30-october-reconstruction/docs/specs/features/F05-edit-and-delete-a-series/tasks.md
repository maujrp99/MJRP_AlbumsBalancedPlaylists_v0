<!-- docs/specs/features/F05-edit-and-delete-a-series/tasks.md — o QUANDO, reconstituído: cada task é uma entrega que um commit `delivered_by` já fez; só está marcada onde esse commit existe. Sem `rounds::`: o número de voltas Execute ⇄ Verify nunca foi medido e não se inventa. -->
# Tasks — Feature F05: Editar uma série (nome e álbuns) e excluí-la sem apagar os álbuns do inventário · Plan: [[plan]]
**Approved**: not a gate

## Pre-Implementation
- [x] ramo da feature: não houve; a entrega foi feita antes do harness, direto na linha principal, pelos commits `delivered_by` das histórias
- [x] spec e plan conferidos entre si: cada REQ tem fluxo e commit no plan e uma task abaixo; escritos no conform de 2026-10-28

## Implementation
- [x] TASK-01 Janela de editar a série: trocar o nome e gerir a lista de álbuns da série — commit `19d38c1` (2025-12-07) · implements:: REQ-01 · model:: opus
- [x] TASK-02 Acrescentar álbuns na edição buscando um artista (busca com autocompletar e adaptador de busca do Apple Music) — commit `b3b9f32` (2025-12-31) · implements:: REQ-01 · model:: opus
- [x] TASK-03 Excluir a série com confirmação, avisando que os álbuns do inventário não saem — commit `b85f473` (2025-12-03) · implements:: REQ-02 · model:: opus

## Verification
- [x] TASK-04 Prova da entrega: em produção desde 2025-12-03 pelos commits `b85f473`, `19d38c1`, `b3b9f32`; os testes existentes que cobrem cada REQ estão no `verified_by` da spec e a evidência fica em `reports/evidence/F05/evidence.md` · implements:: REQ-01, REQ-02 · model:: sonnet

## Documentation
- [x] spec, plan e tasks reconstituídos do que foi entregue · feature Done sem aceite próprio (regra do MJRP de 2026-10-18); esta pasta e a de evidência entram no commit do conform
