<!-- docs/specs/features/F06-save-and-browse-playlist-batches/tasks.md — o QUANDO, reconstituído: cada task é uma entrega que um commit `delivered_by` já fez; só está marcada onde esse commit existe. Sem `rounds::`: o número de voltas Execute ⇄ Verify nunca foi medido e não se inventa. -->
# Tasks — Feature F06: Guardar as playlists geradas num lote na nuvem e consultá-las depois, por série e por lote · Plan: [[plan]]
**Approved**: not a gate

## Pre-Implementation
- [x] ramo da feature: não houve; a entrega foi feita antes do harness, direto na linha principal, pelos commits `delivered_by` das histórias
- [x] spec e plan conferidos entre si: cada REQ tem fluxo e commit no plan e uma task abaixo; escritos no conform de 2026-10-28

## Implementation
- [x] TASK-01 Guardar o lote na nuvem pelo botão «Save to Series History», com a tela passando a ser de edição do lote; correção de permissão e de rota — commit `b6034b6` (2025-12-07) · implements:: REQ-01 · model:: opus
- [x] TASK-02 Tela de playlists guardadas por série e por lote, com busca, ordenação e detalhes das faixas — commit `3919f18` (2025-12-06) · implements:: REQ-02 · model:: opus

## Verification
- [x] TASK-03 Prova da entrega: em produção desde 2025-12-06 pelos commits `3919f18`, `b6034b6`; os testes existentes que cobrem cada REQ estão no `verified_by` da spec e a evidência fica em `reports/evidence/F06/evidence.md` · implements:: REQ-01, REQ-02 · model:: sonnet

## Documentation
- [x] spec, plan e tasks reconstituídos do que foi entregue · feature Done sem aceite próprio (regra do MJRP de 2026-10-18); esta pasta e a de evidência entram no commit do conform
