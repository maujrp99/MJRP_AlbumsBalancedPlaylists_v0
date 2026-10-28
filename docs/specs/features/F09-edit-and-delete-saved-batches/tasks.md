<!-- docs/specs/features/F09-edit-and-delete-saved-batches/tasks.md — o QUANDO, reconstituído: cada task é uma entrega que um commit `delivered_by` já fez; só está marcada onde esse commit existe. Sem `rounds::`: o número de voltas Execute ⇄ Verify nunca foi medido e não se inventa. -->
# Tasks — Feature F09: Editar um lote de playlists guardado e excluir lotes ou todas as playlists de uma série · Plan: [[plan]]
**Approved**: not a gate

## Pre-Implementation
- [x] ramo da feature: não houve; a entrega foi feita antes do harness, direto na linha principal, pelos commits `delivered_by` das histórias
- [x] spec e plan conferidos entre si: cada REQ tem fluxo e commit no plan e uma task abaixo; escritos no conform de 2026-10-28

## Implementation
- [x] TASK-01 Excluir todas as playlists de uma série mantendo a série (a série e os álbuns ficam) — commit `e057cfe` (2025-12-16) · implements:: REQ-02 · model:: sonnet
- [x] TASK-02 Tela de edição do lote (EditPlaylistView, rota /playlists/edit) carregando do Firestore e guardando por nome do lote — commit `f1b3d46` (2025-12-18) · implements:: REQ-01 · model:: opus

## Verification
- [x] TASK-03 Prova da entrega: em produção desde 2025-12-16 pelos commits `e057cfe`, `f1b3d46`; os testes existentes que cobrem cada REQ estão no `verified_by` da spec e a evidência fica em `reports/evidence/F09/evidence.md` · implements:: REQ-01, REQ-02 · model:: sonnet

## Documentation
- [x] spec, plan e tasks reconstituídos do que foi entregue · feature Done sem aceite próprio (regra do MJRP de 2026-10-18); esta pasta e a de evidência entram no commit do conform
