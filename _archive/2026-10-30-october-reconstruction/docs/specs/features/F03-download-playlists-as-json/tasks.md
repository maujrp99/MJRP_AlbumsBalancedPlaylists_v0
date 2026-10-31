<!-- docs/specs/features/F03-download-playlists-as-json/tasks.md — o QUANDO, reconstituído: cada task é uma entrega que um commit `delivered_by` já fez; só está marcada onde esse commit existe. Sem `rounds::`: o número de voltas Execute ⇄ Verify nunca foi medido e não se inventa. -->
# Tasks — Feature F03: Baixar as playlists geradas num arquivo JSON · Plan: [[plan]]
**Approved**: not a gate

## Pre-Implementation
- [x] ramo da feature: não houve; a entrega foi feita antes do harness, direto na linha principal, pelos commits `delivered_by` das histórias
- [x] spec e plan conferidos entre si: cada REQ tem fluxo e commit no plan e uma task abaixo; escritos no conform de 2026-10-28

## Implementation
- [x] TASK-01 Botão «Download JSON» no quadro de ações, com o arquivo playlists_<lote>_<data>.json — commit `c8be9fa` (2025-11-27) · implements:: REQ-01 · model:: sonnet

## Verification
- [x] TASK-02 Prova da entrega: em produção desde 2025-11-27 pelos commits `c8be9fa`; os testes existentes que cobrem cada REQ estão no `verified_by` da spec e a evidência fica em `reports/evidence/F03/evidence.md` · implements:: REQ-01 · model:: sonnet

## Documentation
- [x] spec, plan e tasks reconstituídos do que foi entregue · feature Done sem aceite próprio (regra do MJRP de 2026-10-18); esta pasta e a de evidência entram no commit do conform
